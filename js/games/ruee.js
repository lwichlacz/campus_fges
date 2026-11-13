/* « La Ruée · Le comité de 18 h » — mini-jeu de la Licence Économie-Finance (FGES).
   17 h 30, un open space en plein jour. Le fonds d'Inès (fictif) a perdu 3,2 % dans la journée ; à 18 h, le comité
   demande : pourquoi, et que fait-on ? Le joueur, stagiaire de L3, a trente minutes (l'horloge tourne) pour monter
   son dossier, puis il le défend. Environ 7 minutes. Tous les gestes se font dans la scène, sur les objets :
     - la règle posée sur la courbe du fonds : appuyer au début d'une chute, glisser jusqu'à la fin, lire l'écart ;
     - le téléphone en calculatrice : poids × variation, duration × surprise… le résultat remplit le tableur ;
     - la droite de régression saisie à la main et tournée jusqu'à coller au nuage : on lit le bêta ;
     - le carnet d'ordres qu'on fait défiler pour retrouver un ticket, le curseur posé à son heure sur le cours ;
     - au comité, la pièce du dossier qu'on prend sur la table, puis le chiffre qu'on montre du doigt.
   Le dossier, les chiffres et les cours sont dans ruee-data.js. */
import * as THREE from "three";
import { makePerson, std, box, cyl } from "../kit.js?v=e7c881c81b";
import { jpoCard } from "./jpo.js?v=e7c881c81b";
import { palier } from "./palier.js?v=e7c881c81b";
import { COURSES, FUND, CURVE, NEWS, BCE, REG, ORDERS, LYS, KRACH, PIECES, BOARD, QUESTIONS, fr, pct, hhmm, at } from "./ruee-data.js?v=e7c881c81b";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const RATIO = 5;                       // secondes de l'horloge du bureau par seconde réelle : 30 minutes ≈ 6 minutes de jeu
const START = 17*60 + 30, COMITE = 18*60;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a)*t;
// les points de la mention : courbe 4, BCE 3, régression 2, Lys 3, krach 4, comité 5 × 3 + 1 pour le calcul de la recommandation
const MAXP = 4 + 3 + 2 + 3 + 4 + QUESTIONS.length*3 + 1;

const CSS = `
.ru{position:fixed;inset:0;z-index:40;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#23201b;background:#e9f7fa;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;animation:ruIn .3s ease both}
@keyframes ruIn{from{opacity:0}to{opacity:1}}
.ru canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.ru-top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 6px calc(env(safe-area-inset-left) + 12px);z-index:5;pointer-events:none}
.ru-top>*{pointer-events:auto}
.ru-tag{background:#fffaf2;border:1px solid #e9f7fa;border-radius:8px;padding:6px 11px;font-weight:900;font-size:13px;white-space:nowrap;box-shadow:0 2px 6px rgba(15,49,104,.12);font-variant-numeric:tabular-nums}
.ru-tag.n{background:#0f3168;border-color:#0f3168;color:#e9f7fa}
.ru-tag.late{background:#fbe3dc;color:#a8361f;border-color:#eab2a3}
.ru-x{margin-left:auto;width:48px;height:48px;border-radius:50%;border:1px solid #e9f7fa;background:#fffaf2;font-size:24px;cursor:pointer;color:#23201b;box-shadow:0 2px 6px rgba(15,49,104,.15)}
.ru-say{position:absolute;z-index:4;max-width:min(360px,calc(100% - 24px));transform:translate(-50%,-100%);pointer-events:none;transition:opacity .3s}
.ru-say.off{opacity:0}
.ru-say .b{background:#fffaf2;border:2px solid #0f3168;border-radius:14px;padding:8px 12px;font-size:14px;line-height:1.4;box-shadow:0 6px 18px rgba(40,30,10,.2)}
.ru-say .who{display:block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#0f3168;font-weight:900}
.ru-say.fix{transform:none}
.ru-say.cm .b{border-color:#3d4f7a}.ru-say.cm .who{color:#3d4f7a}
.ru-say.me{left:50%!important;top:auto!important;bottom:calc(env(safe-area-inset-bottom) + 14px);transform:translateX(-50%)}
.ru-say.me .b{background:#0f3168;color:#e9f7fa;border-color:#0f3168}.ru-say.me .who{color:#21b7cb}
.ru-notes{position:absolute;left:calc(env(safe-area-inset-left) + 12px);bottom:calc(env(safe-area-inset-bottom) + 12px);z-index:3;display:flex;flex-direction:column-reverse;gap:8px;align-items:flex-start;pointer-events:none;max-width:min(260px,46%)}
.ru-note{background:#e9f7fa;color:#0f3168;border-radius:2px;padding:7px 10px 9px;font-size:12.5px;font-weight:800;line-height:1.3;box-shadow:2px 4px 10px rgba(15,49,104,.22);transform:rotate(-1.5deg);animation:ruNote 4.2s ease both}
.ru-note:nth-child(2n){transform:rotate(1.2deg);background:#e9f7fa}
.ru-note span{display:block;font-size:10px;color:#0f3168;letter-spacing:.06em;text-transform:uppercase}
@keyframes ruNote{0%{opacity:0;translate:0 14px}10%{opacity:1;translate:0 0}85%{opacity:1}100%{opacity:0}}
.ru-ov{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:14px;background:rgba(35,32,27,.4)}
.ru-ov[hidden]{display:none}
.ru-card{max-width:560px;width:100%;max-height:100%;overflow:auto;background:#fffaf2;border-radius:16px;padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);user-select:text;-webkit-user-select:text}
.ru-card h2{font:300 26px/1.15 Tiempos Headline,Georgia,serif;margin:4px 0 8px;color:#0f3168}
.ru-card .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0f3168;font-weight:900;margin:0 0 4px}
.ru-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.ru-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}
.ru-legend div{background:#e9f7fa;border-radius:10px;padding:7px 9px;font-size:13px;line-height:1.3}
.ru-legend b{font-size:18px;display:block}
.ru-go{display:block;width:100%;border:0;border-radius:12px;padding:12px;font:700 16px Inter,system-ui,sans-serif;background:#0f3168;color:#fff;cursor:pointer;min-height:48px;box-shadow:0 4px 0 #0f221d}
.ru-go:focus-visible{outline:3px solid #21b7cb}
.ru-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#0f3168;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:underline;min-height:44px}
.ru-stats{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
.ru-stats div{flex:1 1 110px;background:#e9f7fa;border-radius:10px;padding:6px 9px;font-size:12px;font-weight:800;color:#6b6152}
.ru-stats b{display:block;font-size:18px;color:#23201b}
.ru-list{list-style:none;margin:0 0 10px;padding:0}
.ru-list li{background:#e9f7fa;border-radius:10px;padding:7px 9px;margin:5px 0;font-size:13px;line-height:1.35}
.ru-list li span{display:inline-block;background:#0f3168;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:900;margin-right:5px}
.ru-big{font-size:46px;text-align:center;margin:0}
.ru-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:640px){.ru-tag{font-size:12px;padding:5px 8px}.ru-tag.hide-s{display:none}.ru-say .b{font-size:13px}.ru-notes{max-width:58%}}
@media (max-aspect-ratio:1/1){.ru.up .ru-notes{display:none}}
@media (prefers-reduced-motion:reduce){.ru,.ru-note{animation:none}}
`;

export function openRuee({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("ru-css")){ const st = document.createElement("style"); st.id = "ru-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "ru";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La Ruée, le comité de 18 h");
	root.innerHTML = `<canvas tabindex="0" aria-label="Le bureau : flèches pour déplacer, espace ou entrée pour poser, chiffres pour calculer"></canvas>
		<div class="ru-top"><span class="ru-tag n">La Ruée</span><span class="ru-tag" id="ruClock">17 h 30</span><span class="ru-tag hide-s" id="ruDos">Dossier 0 / 5</span><button class="ru-x" aria-label="Quitter le jeu">×</button></div>
		<div class="ru-say off" id="ruInes" aria-live="polite"><div class="b"><span class="who">Inès, gérante du fonds</span><span class="t"></span></div></div>
		<div class="ru-say cm off" id="ruCom" aria-live="polite"><div class="b"><span class="who"></span><span class="t"></span></div></div>
		<div class="ru-say me off" id="ruMe" aria-live="polite"><div class="b"><span class="who">Toi, au comité</span><span class="t"></span></div></div>
		<div class="ru-notes" id="ruNotes"></div>
		<div class="ru-sr" id="ruSr" aria-live="assertive"></div>
		<div class="ru-ov" id="ruOv"><div class="ru-card" id="ruCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	let closed = false;

	/* ---------- état ---------- */
	const S = { phase:"intro", gmin:START, inv:false, late:false, warned:false, pts:0, learned:[], pieces:{}, focus:"desk", phoneUp:0, phoneMode:"off", calc:null, raised:null, qok:0, steps:{} };

	/* ---------- scène : un open space en plein jour ---------- */
	const canvas = $("canvas");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#efe9df");
	const camera = new THREE.PerspectiveCamera(45, 1, .05, 60);
	scene.add(new THREE.HemisphereLight("#fffdf7", "#a89b86", 1.45));
	const sun = new THREE.DirectionalLight("#fff1dc", 1.7); sun.position.set(-3, 7, -6); sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-7, right:7, top:6, bottom:-4, near:1, far:24 }); scene.add(sun);

	const MAT = { floor:std("#b9b3a8"), wall:std("#f3eee6"), oak:std("#cfae7f"), leg:std("#3b3a38"), black:std("#1b1d21"), sky:new THREE.MeshBasicMaterial({ color:"#cfe4f2" }),
		frame:std("#55575c"), city:std("#c6bfb4"), city2:std("#b3aca1"), plant:std("#557f4f"), pot:std("#d9cbb5"), paper:std("#f7f4ee"), mug:std("#2f7d62"), chair:std("#2c3138"), table:std("#e6dccb") };
	box(scene, 16, .1, 12, MAT.floor, 0, -.1, -1).receiveShadow = true;
	// le mur de fenêtres, avec Lille au loin
	box(scene, 16, .9, .2, MAT.wall, 0, 0, -4.2); box(scene, 16, .7, .2, MAT.wall, 0, 3.6, -4.2);
	const sky = new THREE.Mesh(new THREE.PlaneGeometry(22, 5), MAT.sky); sky.position.set(0, 2.25, -6.5); scene.add(sky);
	for(let x = -7.5; x <= 7.5; x += 1.5) box(scene, .08, 2.8, .12, MAT.frame, x, .85, -4.15, 0, false);
	box(scene, 16, .06, .12, MAT.frame, 0, 2.2, -4.15, 0, false);
	for(let i = 0; i < 14; i++){ const h = .5 + ((i*37) % 11)/10; box(scene, .7 + (i % 3)*.25, h, .3, i % 2 ? MAT.city : MAT.city2, -7 + i*1.1, .9, -5.4, 0, false); }
	box(scene, .25, 1.9, .25, MAT.city2, 2.6, .9, -5.75, 0, false);      // un beffroi au loin
	box(scene, .2, 6, 10, MAT.wall, -7, 0, -1); box(scene, .2, 6, 10, MAT.wall, 7, 0, -1);
	function desk(x, z, w = 2.8){
		box(scene, w, .06, 1.3, MAT.oak, x, .98, z);
		for(const dx of [-w/2 + .1, w/2 - .1]) for(const dz of [-.55, .55]) box(scene, .06, .98, .06, MAT.leg, x + dx, 0, z + dz, 0, false);
	}
	desk(0, -.15, 3.4); desk(4.3, -.15); desk(-3.6, -2.6); desk(3.9, -2.6);
	// tes deux écrans
	const SW = 800, SH = 500;
	function monitor(x, ry){
		const g = new THREE.Group(); g.position.set(x, 1.04, -.5); g.rotation.y = ry; scene.add(g);
		box(g, .35, .03, .25, MAT.black, 0, 0, 0); box(g, .07, .38, .05, MAT.black, 0, 0, -.06);
		box(g, 1.34, .86, .05, MAT.black, 0, .3, -.03);
		const c = document.createElement("canvas"); c.width = SW; c.height = SH; const ctx = c.getContext("2d");
		const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
		const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.28, .8), new THREE.MeshBasicMaterial({ map:tex, toneMapped:false })); scr.position.set(0, .73, .0); g.add(scr);
		const center = new THREE.Vector3(), normal = new THREE.Vector3(0, 0, 1);
		g.updateMatrixWorld(); scr.getWorldPosition(center); normal.applyQuaternion(g.quaternion);
		return { g, scr, c, ctx, tex, center, normal, mode:null };
	}
	const L = monitor(-.7, .14), R = monitor(.7, -.14);
	L.scr.userData.mon = L; R.scr.userData.mon = R;
	// le téléphone : il sert de calculatrice et affiche les réseaux sociaux
	const PW = 300, PH = 560;
	const pc = document.createElement("canvas"); pc.width = PW; pc.height = PH; const pctx = pc.getContext("2d");
	const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
	const phone = new THREE.Group(); scene.add(phone);
	box(phone, .2, .38, .02, MAT.black, 0, -.19, -.012, 0, false);
	const pscr = new THREE.Mesh(new THREE.PlaneGeometry(.18, .336), new THREE.MeshBasicMaterial({ map:ptex, toneMapped:false })); phone.add(pscr);
	pscr.userData.phone = true;
	const PHONE_DESK = { p:new THREE.Vector3(.95, 1.05, .2), q:new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2, 0, .4)) };
	phone.position.copy(PHONE_DESK.p); phone.quaternion.copy(PHONE_DESK.q);
	box(scene, 1.1, .03, .35, MAT.black, 0, 1.04, .15);
	box(scene, .5, .02, .65, MAT.paper, -1.1, 1.04, .2, .2);
	cyl(scene, .07, .06, .16, MAT.mug, 1.45, 1.04, -.1);
	for(const [x, z] of [[-6, -3.4], [6, -3.4], [-6.2, 3]]){ cyl(scene, .35, .28, .6, MAT.pot, x, 0, z); const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.65, 0), MAT.plant); p.position.set(x, 1.15, z); p.castShadow = true; scene.add(p); }
	for(const [x, z] of [[-3.6, -3.05], [3.9, -3.05]]) box(scene, 1, .6, .05, MAT.black, x, 1.3, z);
	// la pendule
	const clk = document.createElement("canvas"); clk.width = clk.height = 256; const clkx = clk.getContext("2d");
	const clkT = new THREE.CanvasTexture(clk); clkT.colorSpace = THREE.SRGBColorSpace;
	const clock = new THREE.Mesh(new THREE.CircleGeometry(.3, 32), new THREE.MeshBasicMaterial({ map:clkT })); clock.position.set(-5.2, 3.95, -4.08); scene.add(clock);
	let shownMin = -1;
	function setClock(min){
		const m = Math.floor(min); if(m === shownMin) return; shownMin = m;
		const el = $("#ruClock"); el.textContent = hhmm(m) + (S.inv ? " · comité à 18 h" : ""); el.classList.toggle("late", S.inv && m >= COMITE - 10);
		const h = Math.floor(m/60), mm = m % 60, x = clkx;
		x.fillStyle = "#fffaf2"; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = "#23201b"; x.stroke();
		for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; x.fillStyle = "#23201b"; x.fillRect(128 + Math.sin(a)*100 - 4, 128 - Math.cos(a)*100 - 4, 8, 8); }
		const hand = (a, l, w) => { x.lineWidth = w; x.lineCap = "round"; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(a)*l, 128 - Math.cos(a)*l); x.stroke(); };
		hand(((h % 12) + mm/60)/12*Math.PI*2, 60, 12); hand(mm/60*Math.PI*2, 92, 7);
		clkT.needsUpdate = true;
	}
	setClock(START);
	// Inès, à son bureau, tournée vers toi ; deux collègues au fond
	const ines = makePerson(scene, true, "pro"); ines.g.position.set(2.45, 0, -1.05); ines.g.rotation.y = -.55;
	box(scene, .55, .5, .55, MAT.chair, 2.45, 0, -1.05, 0, false);
	for(const [x, z, r] of [[-3.6, -1.9, Math.PI], [3.9, -1.9, Math.PI]]){ const p = makePerson(scene, true, "pro"); p.g.position.set(x, 0, z); p.g.rotation.y = r; }
	// la table du comité, devant les fenêtres de gauche : trois membres assis en face de toi
	const TB = { x:-3.6, z:1.7 };
	box(scene, 2.7, .06, 1.5, MAT.table, TB.x, .98, TB.z);
	for(const dx of [-1.2, 1.2]) for(const dz of [-.6, .6]) box(scene, .07, .98, .07, MAT.leg, TB.x + dx, 0, TB.z + dz, 0, false);
	const members = [-.9, 0, .9].map((dx, i) => {
		box(scene, .55, .5, .55, MAT.chair, TB.x + dx, 0, TB.z - 1.15, 0, false);
		const p = makePerson(scene, true, i === 0 ? "senior" : "pro"); p.g.position.set(TB.x + dx, 0, TB.z - 1.15); p.g.rotation.y = -dx*.18;
		return p;
	});

	/* ---------- dessin des écrans ---------- */
	const C = { bg:"#121820", panel:"#1b2430", hi:"#25354a", txt:"#e9eef2", dim:"#8d9bab", up:"#3ccf8e", down:"#ff6b52", gold:"#f4c430", line:"#2c3a4c", teal:"#5fd0c0", warn:"#ff9f43" };
	function rr(x, c, X, Y, W, H, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); x.fillStyle = c; x.fill(); }
	function txt(x, s, X, Y, size, col = C.txt, w = 700, al = "left"){ x.font = `${w} ${size}px Inter,system-ui,sans-serif`; x.fillStyle = col; x.textAlign = al; x.textBaseline = "alphabetic"; x.fillText(s, X, Y); }
	function wrap(x, s, X, Y, maxW, size, col, w = 800, lh = 1.2){
		x.font = `${w} ${size}px Inter,system-ui,sans-serif`; const words = s.split(" "); let line = "", yy = Y;
		for(const wd of words){ const t = line ? line + " " + wd : wd; if(x.measureText(t).width > maxW && line){ txt(x, line, X, yy, size, col, w); line = wd; yy += size*lh; } else line = t; }
		if(line) txt(x, line, X, yy, size, col, w); return yy;
	}
	function header(x, title, sub){
		x.fillStyle = C.bg; x.fillRect(0, 0, SW, SH);
		x.fillStyle = "#0c1117"; x.fillRect(0, 0, SW, 46);
		txt(x, title, 22, 31, 20, C.teal, 900); if(sub) txt(x, sub, SW - 22, 31, 18, C.dim, 700, "right");
	}
	function dash(x, X0, Y0, X1, Y1, col, w = 2, d = [7, 6]){ x.setLineDash(d); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(X0, Y0); x.lineTo(X1, Y1); x.stroke(); x.setLineDash([]); }

	// une courbe horaire avec sa règle : g = { X0, X1, Y0, Y1, from, to, vmin, vmax }, f(t) = valeur à la minute t
	function plot(x, g, f, o = {}){
		const px = t => g.X0 + (t - g.from)/(g.to - g.from)*(g.X1 - g.X0);
		const py = v => g.Y0 + (g.vmax - v)/(g.vmax - g.vmin)*(g.Y1 - g.Y0);
		g.px = px; g.py = py;
		for(let h = Math.ceil(g.from/60); h*60 <= g.to; h++){ const X = px(h*60); x.strokeStyle = C.line; x.lineWidth = 1; x.beginPath(); x.moveTo(X, g.Y0); x.lineTo(X, g.Y1); x.stroke(); txt(x, h + " h", X, g.Y1 + 22, 16, C.dim, 800, "center"); }
		if(g.half) for(let t = Math.ceil(g.from/30)*30; t <= g.to; t += 30) if(t % 60){ const X = px(t); txt(x, hhmm(t).replace(" h ", " h "), X, g.Y1 + 22, 14, "#5f6d7c", 700, "center"); }
		for(const [v, s] of o.yt || []){ const Y = py(v); x.strokeStyle = v === 0 ? "#3e5068" : C.line; x.lineWidth = v === 0 ? 2 : 1; x.beginPath(); x.moveTo(g.X0, Y); x.lineTo(g.X1, Y); x.stroke(); txt(x, s, g.X0 - 8, Y + 5, 14, C.dim, 800, "right"); }
		for(const s of o.shade || []){ x.fillStyle = s.col; x.fillRect(px(s.a), g.Y0, px(s.b) - px(s.a), g.Y1 - g.Y0); if(s.label) txt(x, s.label, (px(s.a) + px(s.b))/2, g.Y0 + 20, 15, s.tcol || C.dim, 900, "center"); }
		for(const mk of o.marks || []){ const X = px(mk.t); dash(x, X, g.Y0, X, g.Y1, mk.col, 2); txt(x, mk.label, X + (mk.left ? -6 : 6), g.Y0 + (mk.dy || 16), 14, mk.col, 900, mk.left ? "right" : "left"); }
		x.strokeStyle = o.col || C.txt; x.lineWidth = 3.5; x.lineJoin = "round"; x.beginPath();
		for(let t = g.from; t <= g.to; t += 1){ const X = px(t), Y = py(f(t)); t === g.from ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.stroke();
		for(const d of o.done || []){      // les mesures validées restent sur la courbe
			const Xa = px(d.a), Xb = px(d.b), Y = Math.min(py(f(d.a)), py(f(d.b))) - 14;
			x.strokeStyle = C.up; x.lineWidth = 3; x.beginPath(); x.moveTo(Xa, Y + 8); x.lineTo(Xa, Y); x.lineTo(Xb, Y); x.lineTo(Xb, Y + 8); x.stroke();
			txt(x, d.label, (Xa + Xb)/2, Y - 8, 16, C.up, 900, "center");
		}
		const r = o.ruler;
		if(r){
			const a = Math.min(r.a, r.b), b = Math.max(r.a, r.b), col = r.live ? C.gold : r.ok ? C.up : C.down;
			const Xa = px(a), Xb = px(b), Ya = py(f(a)), Yb = py(f(b));
			x.fillStyle = r.live ? "rgba(244,196,48,.12)" : r.ok ? "rgba(60,207,142,.12)" : "rgba(255,107,82,.12)"; x.fillRect(Xa, g.Y0, Xb - Xa, g.Y1 - g.Y0);
			dash(x, Xa, g.Y0, Xa, g.Y1, col, 2); dash(x, Xb, g.Y0, Xb, g.Y1, col, 2);
			dash(x, Xa, Ya, Xb, Ya, col, 2, [4, 4]);
			x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.moveTo(Xb, Ya); x.lineTo(Xb, Yb); x.stroke();
			x.fillStyle = col; for(const [X, Y] of [[Xa, Ya], [Xb, Yb]]){ x.beginPath(); x.arc(X, Y, 7, 0, 7); x.fill(); }
			const d = f(b) - f(a), lab = pct(d, o.dec ?? 2) + (o.eur ? "  (" + (d < 0 ? "−" : "+") + fr(Math.abs(Math.round(d*FUND.size*1e4/1e3)*1e3)) + " €)" : "");
			const bx = clamp((Xa + Xb)/2, 150, SW - 150), by = clamp(Math.max(Ya, Yb) + 44, g.Y0 + 40, g.Y1 - 6);
			rr(x, "#0c1117", bx - 140, by - 30, 280, 42, 10); txt(x, lab, bx, by - 2, 22, col, 900, "center");
			txt(x, hhmm(a) + " → " + hhmm(b), bx, by + 30, 15, C.dim, 800, "center");
		}
		if(o.cursor !== undefined && o.cursor !== null){
			const X = px(o.cursor), v = f(o.cursor); dash(x, X, g.Y0, X, g.Y1, C.gold, 3, [2, 0]);
			x.fillStyle = C.gold; x.beginPath(); x.arc(X, py(v), 8, 0, 7); x.fill();
			const bx = clamp(X, 110, SW - 110); rr(x, "#0c1117", bx - 100, g.Y1 - 64, 200, 52, 10);
			txt(x, hhmm(o.cursor), bx, g.Y1 - 42, 18, C.gold, 900, "center"); txt(x, o.cursorLabel(v), bx, g.Y1 - 20, 18, C.txt, 900, "center");
		}
		if(o.kc !== undefined && o.kc !== null && !(r && r.live)){ const X = px(o.kc); dash(x, X, g.Y0, X, g.Y1, "#5f6d7c", 2, [3, 5]); }
	}
	const tAt = (g, X) => clamp(Math.round(g.from + (X - g.X0)/(g.X1 - g.X0)*(g.to - g.from)), g.from, g.to);
	const fundAt = t => at(CURVE.keys, t) + .006*Math.sin(t*1.7) + .005*Math.sin(t*.53);
	const lysAt = t => at(LYS.keys, t) + .02*Math.sin(t*1.3);
	const cacAt = t => at(KRACH.keys, t) + .03*Math.sin(t*1.1);

	function drawL(){
		const x = L.ctx, m = L.mode || { kind:"idle" };
		if(m.kind === "idle"){
			header(x, FUND.name.toUpperCase() + " · " + FUND.size + " M€", "aujourd'hui");
			txt(x, "Variation du jour", 40, 110, 24, C.dim, 800); txt(x, "−3,2 %", 40, 190, 76, C.down, 900); txt(x, "−320 000 €", 330, 186, 36, C.down, 900);
			FUND.lines.forEach(([n, w], i) => { const Y = 250 + i*44; txt(x, n, 40, Y, 21, C.txt, 800); rr(x, "#26303c", 430, Y - 16, 300, 18, 9); rr(x, C.teal, 430, Y - 16, 300*w/45, 18, 9); txt(x, w + " %", 760, Y, 20, C.dim, 900, "right"); });
			return;
		}
		if(m.kind === "curve"){
			header(x, "COURBE DU FONDS · VARIATION DEPUIS 9 H", "règle : appuie, glisse, lâche");
			m.g = { X0:70, X1:SW - 24, Y0:66, Y1:SH - 40, from:CURVE.from, to:CURVE.to, vmin:-3.6, vmax:.4 };
			plot(x, m.g, fundAt, { yt:[[0, "0 %"], [-1, "−1 %"], [-2, "−2 %"], [-3, "−3 %"]], done:m.done, ruler:m.ruler, eur:true, kc:m.kc });
			return;
		}
		if(m.kind === "bce") return drawBce(x, m);
		if(m.kind === "reg") return drawReg(x, m);
		if(m.kind === "orders") return drawOrders(x, m);
	}
	function drawBce(x, m){
		header(x, "DÉPÊCHE · 14 H 15 · EN ANGLAIS", "tableur d'attribution");
		rr(x, "#3a2f10", 18, 56, SW - 36, 96, 10);
		txt(x, BCE.news, 36, 92, 27, "#fff", 900); wrap(x, BCE.fr, 36, 128, SW - 72, 18, "#e8d9a8", 700);
		const rows = [
			...BCE.cells.map(c => [c.label, m.vals[c.id] !== undefined ? fr(m.vals[c.id], 2).replace("-", "−") + c.unit : "?", c.id]),
			[`Actions zone euro = ${BCE.equity.w} % × ${fr(BCE.equity.v, 2).replace("-", "−")} %`, pct(BCE.equity.c, 1), "eq"],
			["Total expliqué par la BCE", m.total !== undefined ? pct(m.total, 1) : "…", "tot"],
			["Chute mesurée sur la courbe à 14 h 15", "−1,0 %", "mes"]
		];
		rows.forEach(([lab, v, id], i) => {
			const Y = 166 + i*52, cur = m.cur === id;
			rr(x, cur ? "#3a3315" : id === "tot" ? "#173a2c" : C.panel, 18, Y, SW - 36, 46, 8);
			if(cur){ x.lineWidth = 3; x.strokeStyle = C.gold; x.stroke(); }
			wrap(x, lab, 32, Y + 29, 560, 17, id === "mes" ? C.dim : C.txt, 800);
			txt(x, v, SW - 34, Y + 32, 24, v === "?" ? C.gold : id === "mes" ? C.dim : v.startsWith("−") ? C.down : C.up, 900, "right");
			if(cur) txt(x, "← calcule sur le téléphone", SW - 110, Y + 31, 15, C.gold, 800, "right");
		});
	}
	function drawReg(x, m){
		header(x, "R · " + REG.code, REG.n + " séances");
		m.panels.forEach((p, i) => {
			const X0 = 18 + i*258, W = 246, Y0 = 60, H = 300, sel = m.kc === i;
			rr(x, sel ? C.hi : C.panel, X0, Y0, W, H + 106, 10);
			txt(x, p.name, X0 + 12, Y0 + 26, 19, C.teal, 900);
			p.box = { X0:X0 + 8, X1:X0 + W - 8, Y0:Y0 + 36, Y1:Y0 + H };
			const b = p.box, px = v => b.X0 + (v + p.xr)/(2*p.xr)*(b.X1 - b.X0), py = v => b.Y1 - (v + p.yr)/(2*p.yr)*(b.Y1 - b.Y0);
			p.px = px; p.py = py;
			x.strokeStyle = C.line; x.lineWidth = 1.5; x.beginPath(); x.moveTo(b.X0, py(0)); x.lineTo(b.X1, py(0)); x.moveTo(px(0), b.Y0); x.lineTo(px(0), b.Y1); x.stroke();
			x.fillStyle = "#7fb7d8"; for(const [a, c] of p.pts){ x.beginPath(); x.arc(px(a), py(c), 4, 0, 7); x.fill(); }
			x.save(); x.beginPath(); x.rect(b.X0, b.Y0, b.X1 - b.X0, b.Y1 - b.Y0); x.clip();
			x.strokeStyle = p.ok ? C.up : C.gold; x.lineWidth = 5; x.beginPath(); x.moveTo(px(-p.xr), py(p.my + p.s*(-p.xr - p.mx))); x.lineTo(px(p.xr), py(p.my + p.s*(p.xr - p.mx))); x.stroke();
			if(!p.ok){ const hx = p.mx + p.xr*.7; x.fillStyle = C.gold; x.beginPath(); x.arc(px(hx), py(p.my + p.s*(hx - p.mx)), 9, 0, 7); x.fill(); }
			x.restore();
			txt(x, "fonds", b.X0 + 4, b.Y0 + 14, 13, C.dim, 800); txt(x, p.name + " →", b.X1 - 4, py(0) - 6, 13, C.dim, 800, "right");
			// la jauge des écarts au nuage
			txt(x, "écarts au nuage", X0 + 12, Y0 + H + 30, 15, C.dim, 800);
			rr(x, "#26303c", X0 + 12, Y0 + H + 40, W - 24, 14, 7); rr(x, p.err < .04 ? C.up : p.err < .3 ? C.gold : C.down, X0 + 12, Y0 + H + 40, Math.max(14, (W - 24)*clamp(p.err, 0, 1)), 14, 7);
			txt(x, (p.ok ? "β = " : "pente ") + fr(p.ok ? p.beta : p.s, 2), X0 + 12, Y0 + H + 92, p.ok ? 28 : 24, p.ok ? C.up : C.txt, 900);
		});
		txt(x, m.allOk ? "Les trois bêtas sont lus." : "Saisis chaque droite et tourne-la : la jauge doit être au plus bas", SW/2, SH - 10, 16, m.allOk ? C.up : C.gold, 800, "center");
	}
	function drawOrders(x, m){
		header(x, "CARNET D'ORDRES · AUJOURD'HUI", "fais défiler, touche un ticket");
		const top = 56, H = 70, bot = SH - 8;
		x.save(); x.beginPath(); x.rect(0, top, SW, bot - top); x.clip();
		ORDERS.forEach(([h, s, t, amt, det], i) => {
			const Y = top + 6 + i*H - m.scroll; if(Y > bot || Y + H < top) return;
			const found = m.found.includes(i), sel = m.sel === i, bad = m.bad === i;
			rr(x, found ? "#173a2c" : bad ? "#4a1d18" : sel ? C.hi : C.panel, 16, Y, SW - 32, H - 8, 9);
			txt(x, h, 34, Y + 40, 22, C.txt, 900);
			rr(x, s === "ACHAT" ? "#1d4a35" : "#5a2620", 130, Y + 17, 86, 30, 6); txt(x, s, 173, Y + 39, 16, s === "ACHAT" ? C.up : C.down, 900, "center");
			txt(x, t, 236, Y + (found && det ? 32 : 40), 21, C.txt, 800);
			if(found && det) txt(x, det, 236, Y + 54, 15, "#c9f0dc", 800);
			txt(x, amt, SW - 34, Y + 40, 20, C.dim, 900, "right");
		});
		x.restore();
		const max = Math.max(1, ORDERS.length*H + 12 - (bot - top)), f = m.scroll/max;
		rr(x, "#26303c", SW - 10, top + 4, 5, bot - top - 8, 2); rr(x, C.dim, SW - 10, top + 4 + f*(bot - top - 70), 5, 62, 2);
		m.rowAt = y => { const i = Math.floor((y - top - 6 + m.scroll)/H); return y >= top && i >= 0 && i < ORDERS.length ? i : -1; };
		m.maxScroll = max;
	}
	function drawR(){
		const x = R.ctx, m = R.mode || { kind:"news" };
		if(m.kind === "news"){
			header(x, "FIL D'ACTUALITÉS · AUJOURD'HUI", hhmm(S.gmin));
			NEWS.forEach(([h, s], i) => { const Y = 64 + i*70; rr(x, C.panel, 18, Y, SW - 36, 60, 8); txt(x, h, 34, Y + 38, 20, C.gold, 900); wrap(x, s, 130, Y + 26, SW - 170, 18, C.txt, 800); });
			return;
		}
		if(m.kind === "lys"){
			header(x, "BANQUE LYS · COURS DU TITRE", "pose le curseur");
			m.g = { X0:70, X1:SW - 24, Y0:66, Y1:SH - 40, from:LYS.from, to:LYS.to, vmin:21.6, vmax:25.6, half:true };
			plot(x, m.g, lysAt, { yt:[[22, "22 €"], [23, "23 €"], [24, "24 €"], [25, "25 €"]], col:C.txt,
				marks:[{ t:LYS.rumour, label:"rumeur 15 h 30", col:C.warn, left:true }, { t:LYS.denial, label:"démenti 15 h 52", col:C.up, dy:36 }],
				cursor:m.cursor, cursorLabel:v => fr(v, 2) + " € (" + pct((v/LYS.open - 1)*100, 0) + ")", kc:null });
			return;
		}
		if(m.kind === "krach"){
			header(x, "CAC 40 · VARIATION DEPUIS 16 H", "règle : appuie, glisse, lâche");
			m.g = { X0:70, X1:SW - 24, Y0:66, Y1:SH - 40, from:KRACH.from, to:KRACH.to, vmin:-4.8, vmax:.8, half:true };
			plot(x, m.g, cacAt, { yt:[[0, "0 %"], [-1, "−1 %"], [-2, "−2 %"], [-3, "−3 %"], [-4, "−4 %"]], col:C.txt,
				shade:[{ a:KRACH.pose, b:KRACH.to, col:"rgba(95,208,192,.10)", label:"couvert", tcol:C.teal }],
				marks:[{ t:KRACH.pose, label:"couverture posée 16 h 50", col:C.teal, dy:64 }], done:m.done, ruler:m.ruler, dec:1, kc:m.kc });
		}
	}
	// le téléphone : calculatrice ou réseau social
	const KEYS = [["C", "(", ")", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "−"], ["1", "2", "3", "+"], ["0", ",", "⌫", "="]];
	const KY = 196, KH = 72, KX = 8, KW = 71;
	const keyAt = (X, Y) => { const r = Math.floor((Y - KY)/KH), c = Math.floor((X - KX)/KW); return r >= 0 && r < 5 && c >= 0 && c < 4 ? KEYS[r][c] : null; };
	function drawPhone(){
		const x = pctx; x.fillStyle = "#0d0f12"; x.fillRect(0, 0, PW, PH);
		if(S.phoneMode === "feed"){
			x.fillStyle = "#f5f6f8"; x.fillRect(8, 8, PW - 16, PH - 16);
			txt(x, "Réseau social · 15 h 30", 22, 40, 16, "#6b7280", 800);
			rr(x, "#ffffff", 18, 52, PW - 36, 230, 12);
			x.fillStyle = "#9aa3ad"; x.beginPath(); x.arc(44, 82, 15, 0, 7); x.fill();
			txt(x, LYS.author, 66, 88, 15, "#111", 900);
			const yy = wrap(x, LYS.post, 30, 124, PW - 60, 18, "#111", 800, 1.25);
			wrap(x, LYS.source, 30, yy + 34, PW - 60, 14, "#a8361f", 800);
			txt(x, "Dépêche · 15 h 52", 22, 316, 16, "#6b7280", 800);
			rr(x, "#e6f6ee", 18, 328, PW - 36, 210, 12);
			wrap(x, LYS.denialText, 30, 362, PW - 60, 18, "#11603d", 800, 1.25);
			return;
		}
		const c = S.calc; if(S.phoneMode !== "calc" || !c) return;
		x.fillStyle = "#1c1f24"; x.fillRect(4, 4, PW - 8, PH - 8);
		const y = wrap(x, c.cell.label, 16, 30, PW - 32, 16, "#cfd6de", 800, 1.2);
		if(c.showHint) txt(x, "Tape : " + c.cell.hint, 16, Math.min(y + 26, 110), 16, C.gold, 900);
		rr(x, "#0d0f12", 10, 118, PW - 20, 70, 10);
		x.save(); x.beginPath(); x.rect(12, 118, PW - 24, 70); x.clip();
		txt(x, c.expr || "0", PW - 20, 150, 28, "#fff", 900, "right"); x.restore();
		txt(x, c.msg, PW - 20, 180, 18, c.ok ? C.up : c.msgBad ? C.down : C.dim, 900, "right");
		KEYS.forEach((row, r) => row.forEach((k, i) => {
			const X = KX + i*KW, Y = KY + r*KH, op = "÷×−+=".includes(k), fn = "C()⌫".includes(k);
			rr(x, c.flash === k ? "#5a6676" : k === "=" ? "#2f7d62" : op ? "#3d4f7a" : fn ? "#3a3f47" : "#2b3038", X + 3, Y + 3, KW - 6, KH - 6, 12);
			txt(x, k, X + KW/2, Y + KH/2 + 11, 30, "#fff", 800, "center");
		}));
	}
	// les pièces du dossier : des feuilles posées sur la table du comité
	const SHW = 512, SHH = 420;
	const sheets = {};
	function drawSheet(sh){
		const x = sh.ctx, P = PIECES[sh.id];
		x.fillStyle = "#fbf8f1"; x.fillRect(0, 0, SHW, SHH); x.strokeStyle = "#d9cdb8"; x.lineWidth = 6; x.strokeRect(3, 3, SHW - 6, SHH - 6);
		txt(x, P.title, 24, 50, 30, "#1d3b33", 900); txt(x, P.sub, 24, 80, 17, "#7a6f60", 800);
		sh.zones = P.zones.map(([id, s], i) => {
			const n = P.zones.length, Hz = n > 3 ? 56 : 74, Y = 100 + i*(Hz + 8), cited = sh.cited === id, bad = sh.bad === id;
			rr(x, cited ? "#dff3e6" : bad ? "#fbe3dc" : "#f1ebe0", 18, Y, SHW - 36, Hz, 10);
			if(sh.kz === id){ x.lineWidth = 4; x.strokeStyle = "#c0702a"; x.stroke(); }
			txt(x, s, 34, Y + Hz/2 + 9, n > 3 ? 23 : 26, cited ? "#11603d" : "#23201b", 900);
			return [id, Y, Y + Hz];
		});
		sh.tex.needsUpdate = true;
	}
	function makeSheet(id, i){
		const c = document.createElement("canvas"); c.width = SHW; c.height = SHH; const ctx = c.getContext("2d");
		const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.46, .46*SHH/SHW), new THREE.MeshBasicMaterial({ map:tex, toneMapped:false }));
		const row = i < 3 ? 0 : 1, col = row ? i - 3 : i;
		const home = new THREE.Vector3(TB.x + (row ? (col - .5)*.56 : (col - 1)*.56), 1.046 + i*.001, TB.z + (row ? .45 : .02));
		const hq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2, 0, ((i*37) % 7 - 3)*.025));
		mesh.position.copy(home); mesh.quaternion.copy(hq); mesh.userData.sheet = id; scene.add(mesh);
		const sh = sheets[id] = { id, c, ctx, tex, mesh, home, hq, zones:[], cited:null, bad:null, kz:null };
		drawSheet(sh); return sh;
	}
	let drawAcc = 0;
	function drawScreens(dt){
		drawAcc += dt; if(drawAcc < 1/30) return; drawAcc = 0;
		drawL(); L.tex.needsUpdate = true; drawR(); R.tex.needsUpdate = true;
		if(S.phoneMode !== "off" || S.phoneWas){ drawPhone(); ptex.needsUpdate = true; S.phoneWas = S.phoneMode !== "off"; }
	}

	/* ---------- caméra : elle cadre ce qu'il faut regarder (et laisse la place au téléphone) ---------- */
	const VIEW = { desk:{ c:new THREE.Vector3(.4, 1.3, -.2), n:new THREE.Vector3(0, .5, 1).normalize(), w:6.2, h:2.6 }, L:{ c:L.center, n:L.normal, w:1.42, h:.95 }, R:{ c:R.center, n:R.normal, w:1.42, h:.95 },
		comite:{ c:new THREE.Vector3(TB.x, 1.62, TB.z - .3), n:new THREE.Vector3(0, .62, 1).normalize(), w:3.4, wp:1.9, h:2.5 } };
	const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camGoalP = new THREE.Vector3(), camGoalL = new THREE.Vector3();
	function camGoal(){
		root.classList.toggle("up", !!S.phoneUp);
		if(!innerWidth || !innerHeight || !isFinite(camera.aspect)) return;
		const v = VIEW[S.focus], vf = camera.fov*Math.PI/180, hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect);
		const c = v.c.clone(); let w = camera.aspect < 1 && v.wp ? v.wp : v.w, h = v.h;
		if(S.phoneUp){
			if(camera.aspect >= 1){ c.add(new THREE.Vector3(v.n.z, 0, -v.n.x).normalize().multiplyScalar(v.w*.3)); w = v.w*1.6; }
			else { c.y -= v.h*.62; h = v.h*2.25; }
		}
		const top = (camera.aspect >= 1 ? 135 : 70)/innerHeight;       // place pour la barre du haut (et, sur ordinateur, la bulle d'Inès)
		const d = Math.max((w/2)/Math.tan(hf/2), (h/2)/(Math.tan(vf/2)*(1 - top*1.4)));
		const scr = S.focus === "L" || S.focus === "R";
		camGoalP.copy(c).addScaledVector(v.n, d); if(scr) camGoalP.y += .12;
		camGoalL.copy(c); if(scr) camGoalL.y += .02 + top*d*.5;
	}
	let sized = "";
	function focus(f, up = S.phoneUp){ S.focus = f; S.phoneUp = up; camGoal(); }
	function resize(){
		const w = innerWidth, h = innerHeight; if(!w || !h) return;
		renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = h > w ? 58 : 42; camera.updateProjectionMatrix();
		camGoal(); sized = w + "x" + h;
		if(!isFinite(camPos.x + camLook.x) || !camPos.lengthSq()){ camPos.copy(camGoalP); camLook.copy(camGoalL); }
	}
	resize(); camPos.copy(camGoalP); camLook.copy(camGoalL); addEventListener("resize", resize);
	const toScreen = v => { const p = v.clone().project(camera); return { x:(p.x + 1)/2*innerWidth, y:(1 - p.y)/2*innerHeight, in:p.z < 1 && Math.abs(p.x) < .95 && p.y < .9 && p.y > -.9 }; };

	/* ---------- horloge du jeu ---------- */
	const timers = new Set();
	function wait(ms){ return new Promise(r => { timers.add({ t:ms/1000, r }); }); }
	const tickers = new Set();
	const lateHooks = new Set();
	const stop = () => closed || S.late;
	// un geste attendu : setup(fin) installe les contrôles ; à 18 h, tout geste en cours s'arrête
	function gesture(setup){
		return new Promise(res => {
			if(closed || (S.late && !S.board)){ res("late"); return; }
			let done = false, clean = null;
			const late = () => fin("late");
			function fin(v){ if(done) return; done = true; lateHooks.delete(late); inp = null; clean && clean(); res(v); }
			lateHooks.add(late);
			clean = setup(fin) || null;
		});
	}
	tickers.add(g => {
		if(!S.inv) return;
		S.gmin += g*RATIO/60; setClock(S.gmin);
		if(!S.warned && S.gmin >= COMITE - 10){ S.warned = true; say("17 h 50 : plus que dix minutes avant le comité. On accélère !", 4500); play("alarm"); }
		if(S.gmin >= COMITE && !S.late){ S.late = true; S.inv = false; for(const f of [...lateHooks]) f(); }
	});

	/* ---------- Inès, le comité, toi, les post-it de cours ---------- */
	const bubbles = { ines:{ el:$("#ruInes"), who:ines, off:0 }, com:{ el:$("#ruCom"), who:members[0], off:0 }, me:{ el:$("#ruMe"), who:null, off:0 } };
	function say(t, ms = 6000, k = "ines"){
		const b = bubbles[k]; b.el.querySelector(".t").innerHTML = t; b.el.classList.remove("off"); clearTimeout(b.off);
		if(ms) b.off = setTimeout(() => b.el.classList.add("off"), ms/Math.min(SPEED, 2));
		$("#ruSr").textContent = t.replace(/<[^>]+>/g, "");
	}
	function sayCom(i, t, ms = 0){ const b = bubbles.com; b.who = members[i]; b.el.querySelector(".who").textContent = BOARD[i].name + ", " + BOARD[i].role; say(t, ms, "com"); }
	const hush = k => bubbles[k].el.classList.add("off");
	function learn(keys){
		for(const k of keys || []){
			if(S.learned.includes(k)) continue; S.learned.push(k);
			const c = COURSES[k], el = document.createElement("div"); el.className = "ru-note"; el.innerHTML = `<span>${c[0]}</span>${c[1]}`;
			const box = $("#ruNotes"); box.appendChild(el); while(box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), 4300);
		}
	}
	function award(step, max, errs, per = .5){ const p = Math.max(0, max - errs*per); S.pts += p; S.steps[step] = (S.steps[step] || 0) + p; }
	function addPiece(id){ S.pieces[id] = true; $("#ruDos").textContent = `Dossier ${Object.keys(S.pieces).length} / 5`; play("pop"); }
	const miss = () => { ev("err"); play("bad"); };

	/* ---------- les gestes : du doigt à l'objet 3D ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let inp = null, ptr = null;
	function hitAt(e){
		ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
		const objs = [L.scr, R.scr]; if(S.phoneMode !== "off") objs.push(pscr); for(const s of Object.values(sheets)) objs.push(s.mesh);
		const hit = ray.intersectObjects(objs, false)[0];
		const h = { cx:e.clientX, cy:e.clientY, mon:null, phone:false, sheet:null, x:0, y:0 };
		if(hit){
			const u = hit.uv, o = hit.object.userData;
			if(o.phone){ h.phone = true; h.x = u.x*PW; h.y = (1 - u.y)*PH; }
			else if(o.sheet){ h.sheet = o.sheet; h.x = u.x*SHW; h.y = (1 - u.y)*SHH; }
			else { h.mon = o.mon; h.x = u.x*SW; h.y = (1 - u.y)*SH; }
		}
		return h;
	}
	canvas.addEventListener("pointerdown", e => { if(!inp) return; try { canvas.setPointerCapture(e.pointerId); } catch(_){} ptr = e.pointerId; inp.down && inp.down(hitAt(e)); });
	canvas.addEventListener("pointermove", e => { if(!inp || e.pointerId !== ptr) return; inp.move && inp.move(hitAt(e)); });
	const upH = e => { if(e.pointerId !== ptr) return; ptr = null; inp && inp.up && inp.up(hitAt(e)); };
	canvas.addEventListener("pointerup", upH); canvas.addEventListener("pointercancel", upH);
	function onKey(e){
		if(e.key === "Escape"){ close(); return; }
		if(S.phase === "play" && inp && inp.key && inp.key(e.key, e)) e.preventDefault();
	}
	document.addEventListener("keydown", onKey);

	// la règle posée sur une courbe (souris, doigt ou clavier) ; onMeasure(a, b, écart) renvoie vrai si la mesure est juste
	function rulerInput(mon, f, onMeasure){
		const m = mon.mode; m.kc = m.g ? Math.round((m.g.from + m.g.to)/2) : null;
		const end = () => { const r = m.ruler; if(!r || !r.live) return; r.live = false; const a = Math.min(r.a, r.b), b = Math.max(r.a, r.b); if(b - a < 3){ m.ruler = null; return; } r.ok = onMeasure(a, b, f(b) - f(a)); };
		return {
			down:h => { if(h.mon !== mon || !m.g) return; const t = tAt(m.g, h.x); m.ruler = { a:t, b:t, live:true }; },
			move:h => { if(h.mon === mon && m.ruler && m.ruler.live) m.ruler.b = tAt(m.g, h.x); },
			up:end,
			key:k => {
				if(!m.g) return false;
				if(k === "ArrowLeft" || k === "ArrowRight"){ m.kc = clamp((m.kc ?? m.g.from) + (k === "ArrowLeft" ? -5 : 5), m.g.from, m.g.to); if(m.ruler && m.ruler.live) m.ruler.b = m.kc; return true; }
				if(k === " " || k === "Enter"){ if(m.ruler && m.ruler.live) end(); else m.ruler = { a:m.kc, b:m.kc, live:true }; return true; }
				return false;
			}
		};
	}
	// une mesure correspond-elle à l'un des mouvements attendus ?
	function judge(list, a, b, d, done){
		const over = list.filter(F => Math.min(b, F.b) - Math.max(a, F.a) > 0);
		const F = over.find(F => Math.abs(d - F.d) <= Math.max(.04, Math.abs(F.d)*.12));
		if(F) return { F, again:done.some(x => x.id === F.id) };
		return { F:null, why:Math.abs(d) < .06 && over.length === 0 ? "flat" : over.length > 1 ? "two" : over.length === 1 ? "part" : "flat" };
	}

	// la calculatrice du téléphone : le résultat juste remplit la cellule ; renvoie le nombre d'essais ratés
	function evalExpr(s){
		s = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".").replace(/\s/g, "");
		let i = 0;
		const num = () => { const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)); if(!m) throw 0; i += m[0].length; return parseFloat(m[0]); };
		const fac = () => { if(s[i] === "-"){ i++; return -fac(); } if(s[i] === "+"){ i++; return fac(); } if(s[i] === "("){ i++; const v = sum(); if(s[i] !== ")") throw 0; i++; return v; } return num(); };
		const prod = () => { let v = fac(); while(s[i] === "*" || s[i] === "/"){ const o = s[i++], w = fac(); v = o === "*" ? v*w : v/w; } return v; };
		const sum = () => { let v = prod(); while(s[i] === "+" || s[i] === "-"){ const o = s[i++], w = prod(); v = o === "+" ? v + w : v - w; } return v; };
		try { const v = sum(); return i === s.length && isFinite(v) ? v : null; } catch(_){ return null; }
	}
	const near = (v, c) => Math.abs(Math.abs(v) - Math.abs(c)) <= Math.max(1e-9, Math.abs(c)*.012);
	function calc(cell, onOk){
		S.phoneMode = "calc"; camGoal();
		const c = S.calc = { cell, expr:"", msg:"", ok:false, errs:0, showHint:false, flash:null };
		return gesture(fin => {
			const accept = () => { c.ok = true; c.msgBad = false; play("good"); onOk && onOk(cell.want); wait(1100).then(() => fin(c.errs)); };
			const press = k => {
				if(c.ok) return; play("clic"); c.flash = k; setTimeout(() => { if(c.flash === k) c.flash = null; }, 140);
				// après un « = » raté, un chiffre recommence un calcul neuf ; un opérateur repart du calcul affiché
				if(c.evald && /^[0-9,(]$/.test(k)){ c.expr = ""; c.msg = ""; }
				c.evald = false;
				if(k === "C"){ c.expr = ""; c.msg = ""; }
				else if(k === "⌫") c.expr = c.expr.slice(0, -1);
				else if(k === "="){
					const v = evalExpr(c.expr); if(v === null){ c.msg = "Erreur de saisie"; c.msgBad = true; return; }
					c.evald = true;
					const cands = [cell.want, ...(cell.unit === " %" ? [cell.want/100] : []), ...(cell.alt || [])];
					if(cands.some(w => near(v, w))){ c.msg = "= " + fr(cell.want, 2).replace("-", "−") + cell.unit + " ✔"; return accept(); }
					c.errs++; miss(); c.msgBad = true; c.msg = "= " + fr(v, 3).replace("-", "−") + " ✘";
					const w = (cell.hint.match(/0,\d+/) || ["0,45"])[0];
					if(near(v, cell.want*100)) say(`Attention aux pourcentages : ${fr(parseFloat(w.replace(",", "."))*100)} %, c'est <b>${w}</b> dans le calcul.`, 5500);
					else if(c.errs >= 2){ c.showHint = true; say("Regarde l'indice en haut du téléphone et tape-le.", 4500); }
					else say("Pas tout à fait. Relis la formule en haut du téléphone : chaque nombre est à l'écran.", 5000);
					if(c.errs >= 4){ c.expr = cell.hint; c.msg = "= " + fr(cell.want, 2).replace("-", "−") + cell.unit; accept(); }
				}
				else if(c.expr.length < 24) c.expr += k;
			};
			inp = {
				down:h => { if(h.phone){ const k = keyAt(h.x, h.y); if(k) press(k); } },
				key:k => { const map = { "*":"×", "/":"÷", "-":"−", ".":",", "Enter":"=", "=":"=", "Backspace":"⌫", "Delete":"C", "c":"C", "C":"C" }; const kk = map[k] || ("0123456789+,()".includes(k) && k.length === 1 ? k : null); if(!kk) return false; press(kk); return true; }
			};
			S.calcPress = press;
			return () => { S.calcPress = null; };
		});
	}
	const phoneDown = () => { S.phoneMode = "off"; S.phoneUp = 0; S.calc = null; camGoal(); };

	/* ---------- 1. la courbe : mesurer les chutes à la règle ---------- */
	async function courbe(){
		focus("L", 0); ev("stage", "La courbe"); play("chime");
		const m = L.mode = { kind:"curve", done:[], ruler:null };
		say("Voici la courbe du fonds aujourd'hui. Pose la règle : <b>appuie au début d'une chute, glisse jusqu'à la fin, lâche</b>. Mesure chaque chute.", 9000);
		let errs = 0;
		const r = await gesture(fin => {
			const check = (a, b, d) => {
				const j = judge(CURVE.falls, a, b, d, m.done);
				if(j.F && !j.again){
					const F = j.F; m.done.push({ id:F.id, a:F.a, b:F.b, label:F.name + " " + pct(F.d, 1) }); play("good");
					const big = m.done.filter(x => !CURVE.falls.find(f => f.id === x.id).minor).length;
					if(F.minor) say(`−0,1 % à 11 h 30 : le pétrole, ce matin. Petit… mais c'est ce qu'il manquait.`, 6000);
					else say(`${F.name}, ${F.at} : <b>${pct(F.d, 1)}</b>, soit ${fr(Math.abs(F.d)*100)} 000 €. ${big < 3 ? "Il en reste." : ""}`, 5000);
					if(big === 3 && m.done.length === 3) wait(2600).then(() => { if(m.done.length === 3) say("Trois chutes : −1,0, −0,5 et −1,6, soit <b>−3,1 %</b>. Mais le fonds a perdu 3,2 %… <b>Il manque 0,1 % quelque part.</b> Regarde la matinée de près.", 9000); });
					if(m.done.length === CURVE.falls.length) wait(1800).then(() => fin(errs));
					return true;
				}
				if(j.F && j.again){ say("Celle-là, tu l'as déjà mesurée.", 3000); return false; }
				errs++; miss();
				say(j.why === "two" ? "Tu as pris deux mouvements d'un coup : mesure les chutes <b>une par une</b>." :
					j.why === "part" ? "Tu n'as qu'une partie de la chute : pars juste <b>avant</b> qu'elle commence, arrête-toi quand la courbe redevient plate." :
					"Là, la courbe est presque plate. Cherche où elle <b>plonge</b>.", 6000);
				return false;
			};
			inp = rulerInput(L, fundAt, check);
		});
		if(r === "late") return;
		award("courbe", 4, errs); learn(["donnees"]);
		say("−0,1 −1,0 −0,5 −1,6 : le compte est bon, <b>−3,2 %</b>. Maintenant, il faut expliquer chaque chute.", 6000);
		addPiece("courbe");
		await wait(3000);
	}

	/* ---------- 2. la BCE : la surprise, la duration, poids × variation ---------- */
	async function bce(){
		if(stop()) return;
		ev("stage", "BCE"); play("chime");
		const m = L.mode = { kind:"bce", vals:{}, cur:BCE.cells[0].id };
		focus("L", 1);
		say("14 h 15, la dépêche est en anglais : <b>50 bp</b>, c'est 0,50 point. Le marché attendait 0,25. Calcule chaque cellule sur le téléphone, il sert de calculatrice.", 9500);
		let errs = 0;
		for(const cell of BCE.cells){
			m.cur = cell.id;
			const r = await calc(cell, v => { m.vals[cell.id] = v; });
			if(r === "late") return;
			errs += r;
			if(cell.id === "surprise") say("La surprise, c'est <b>+0,25 point</b> : le marché ne réagit qu'à ce qu'il n'attendait pas. Une OAT de duration 8 perd environ 8 fois la hausse de son taux.", 7500);
			if(cell.id === "oatvar") say("L'OAT perd 2 %. Elle pèse 45 % du fonds : combien ça fait pour le fonds ?", 6000);
		}
		m.cur = null; m.total = BCE.cells[2].want + BCE.equity.c;
		phoneDown(); focus("L", 0);
		award("bce", 3, errs); learn(BCE.courses); addPiece("bce");
		say("−0,9 pour l'OAT, −0,1 pour les actions : <b>−1,0 %</b>, exactement la chute mesurée. Première explication, dans le dossier.", 6500);
		await wait(3200);
	}

	/* ---------- 3. la régression : à quoi le fonds est-il exposé ? ---------- */
	async function regression(){
		if(stop()) return;
		ev("stage", "Régression"); play("chime"); focus("L", 0);
		let sd = REG.seed; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647;
		const gauss = () => { let u = 0; for(let i = 0; i < 6; i++) u += rnd(); return (u - 3)/Math.sqrt(.5); };
		const panels = REG.factors.map((F, i) => {
			const pts = []; for(let k = 0; k < REG.n; k++){ const a = gauss()*F.sx; pts.push([a, F.beta*a + gauss()*F.noise]); }
			const mx = pts.reduce((s, p) => s + p[0], 0)/pts.length, my = pts.reduce((s, p) => s + p[1], 0)/pts.length;
			const ols0 = pts.reduce((s, p) => s + (p[0] - mx)*(p[1] - my), 0)/pts.reduce((s, p) => s + (p[0] - mx)**2, 0);
			for(const p of pts) p[1] += (F.beta - ols0)*(p[0] - mx);      // le nuage est recalé : la droite des moindres carrés a exactement le bêta affiché
			const ols = F.beta;
			const sse = s => pts.reduce((a, p) => a + (p[1] - (my + s*(p[0] - mx)))**2, 0);
			const p = { ...F, pts, mx, my, ols, sse, e0:sse(ols), e1:sse(ols + .8), xr:F.sx*2.6, yr:1.7, s:[1.3, -.5, .9][i], ok:false, err:1 };
			p.upd = () => { p.err = clamp((p.sse(p.s) - p.e0)/(p.e1 - p.e0), 0, 1); };
			p.upd(); return p;
		});
		const m = L.mode = { kind:"reg", panels, kc:0, allOk:false };
		say("Le comité va demander à quoi le fonds est exposé. R a les 60 dernières séances : <b>saisis chaque droite et tourne-la</b> jusqu'à ce que la jauge des écarts soit au plus bas.", 9500);
		const tol = .06;
		const r = await gesture(fin => {
			let drag = -1;
			const set = (i, s) => { const p = panels[i]; if(p.ok) return; p.s = clamp(s, -1.5, 2); p.upd(); };
			const release = i => {
				const p = panels[i]; if(!p || p.ok) return;
				if(Math.abs(p.s - p.ols) <= tol){ p.ok = true; p.s = p.ols; play("good"); say(p.id === "brent" ? "β Brent = <b>0,03</b> : le pétrole ne pèse presque rien sur ce fonds." : `β ${p.name} = <b>${fr(p.beta, 2)}</b> : quand ${p.name.startsWith("OAT") ? "l'OAT" : "le CAC 40"} bouge de 1 %, le fonds bouge de ${fr(p.beta, 2)} %.`, 5500); }
				else if(p.err > .3) say("La jauge est encore haute : la droite passe loin des points. Tourne-la encore.", 3500);
				if(panels.every(q => q.ok)){ m.allOk = true; wait(2200).then(() => fin(0)); }
			};
			const grab = h => {
				if(h.mon !== L) return;
				const i = panels.findIndex(p => p.box && h.x >= p.box.X0 - 6 && h.x <= p.box.X1 + 6 && h.y >= p.box.Y0 - 10 && h.y <= p.box.Y1 + 10); if(i < 0) return -1;
				const p = panels[i], b = p.box, xd = -p.xr + (h.x - b.X0)/(b.X1 - b.X0)*2*p.xr, yd = -p.yr + (b.Y1 - h.y)/(b.Y1 - b.Y0)*2*p.yr;
				if(Math.abs(xd - p.mx) > p.xr*.15) set(i, (yd - p.my)/(xd - p.mx));
				return i;
			};
			inp = {
				down:h => { drag = grab(h); if(drag >= 0) m.kc = drag; },
				move:h => { if(drag >= 0 && h.mon === L){ const p = panels[drag], b = p.box; if(h.x >= b.X0 - 40 && h.x <= b.X1 + 40) grab({ ...h, x:clamp(h.x, b.X0, b.X1), y:clamp(h.y, b.Y0, b.Y1) }); } },
				up:() => { if(drag >= 0) release(drag); drag = -1; },
				key:k => {
					if(k === "ArrowLeft" || k === "ArrowRight"){ m.kc = (m.kc + (k === "ArrowLeft" ? 2 : 1)) % 3; return true; }
					if(k === "ArrowUp" || k === "ArrowDown"){ const p = panels[m.kc]; set(m.kc, p.s + (k === "ArrowUp" ? .04 : -.04)); return true; }
					if(k === " " || k === "Enter"){ release(m.kc); return true; }
					return false;
				}
			};
		});
		if(r === "late") return;
		award("reg", 2, 0); learn(REG.courses); addPiece("reg");
		say("Bêta OAT 0,45, bêta actions 0,50, bêta pétrole 0,03 : on sait maintenant <b>à quoi le fonds est exposé</b>. Garde ça pour la recommandation.", 7000);
		await wait(3200);
	}

	/* ---------- 4. la Banque Lys : le ticket, l'heure, le démenti ---------- */
	function findTicket(want, wrongMsg){
		const m = L.mode;
		return gesture(fin => {
			let errs = 0, dn = null;
			const pick = i => {
				if(i < 0) return;
				if(i === want){ m.found.push(i); m.sel = i; m.bad = null; play("good"); wait(1400).then(() => fin(errs)); inp = null; return; }
				errs++; miss(); m.bad = i; setTimeout(() => { if(m.bad === i) m.bad = null; }, 900); say(wrongMsg(ORDERS[i]), 4500);
			};
			inp = {
				down:h => { if(h.mon === L) dn = { y:h.y, cy:h.cy, s:m.scroll, moved:false }; },
				move:h => { if(!dn || h.mon !== L) return; const dy = h.y - dn.y; if(Math.abs(dy) > 8) dn.moved = true; if(dn.moved) m.scroll = clamp(dn.s - dy, 0, m.maxScroll || 0); },
				up:h => { if(dn && !dn.moved && h.mon === L && m.rowAt) pick(m.rowAt(h.y)); dn = null; },
				key:k => {
					if(k === "ArrowDown" || k === "ArrowUp"){ m.sel = clamp((m.sel < 0 ? -1 : m.sel) + (k === "ArrowDown" ? 1 : -1), 0, ORDERS.length - 1); m.scroll = clamp(m.sel*70 - 180, 0, m.maxScroll || 0); return true; }
					if((k === " " || k === "Enter") && m.sel >= 0){ pick(m.sel); return true; }
					return false;
				}
			};
		});
	}
	async function lys(){
		if(stop()) return;
		ev("stage", "Banque Lys"); play("chime");
		L.mode = { kind:"orders", scroll:0, sel:-1, found:[], bad:null };
		S.phoneMode = "feed"; focus("L", 1);
		say("15 h 30, une rumeur sur la Banque Lys ; 15 h 52, le démenti : tout est sur ton téléphone. On a vendu nos Lys entre les deux… <b>Retrouve le ticket dans le carnet d'ordres</b> : fais défiler, touche-le.", 10000);
		const e1 = await findTicket(LYS.ticket, o => o[2] === "Banque Rivage" ? "Banque <b>Rivage</b>, pas Lys : lis bien le nom." : `${o[0]}, ${o[2]} : ce n'est pas la Banque Lys. Fais défiler.`);
		if(e1 === "late") return;
		say("Le voilà : <b>vente à 15 h 41</b>, 20 000 titres à 22,50 €. Sur le cours de Lys, <b>pose le curseur à l'heure du ticket</b>.", 7000);
		await wait(1600); if(stop()) return;
		const m = R.mode = { kind:"lys", cursor:null };
		focus("R", 1);
		const e2 = await gesture(fin => {
			let errs = 0, holding = false;
			const release = () => {
				const t = m.cursor; if(t === null) return;
				if(Math.abs(t - LYS.sale) <= 1){ m.cursor = LYS.sale; play("good"); wait(600).then(() => fin(errs)); inp = null; return; }
				errs++; miss();
				say(Math.abs(t - LYS.denial) <= 3 ? "Ça, c'est l'heure du <b>démenti</b>. Le ticket, lui, dit 15 h 41." : "Le ticket est horodaté <b>15 h 41</b> : glisse le curseur jusqu'à cette heure-là.", 4500);
			};
			inp = {
				down:h => { if(h.mon === R && m.g){ holding = true; m.cursor = tAt(m.g, h.x); } },
				move:h => { if(holding && h.mon === R && m.g) m.cursor = tAt(m.g, h.x); },
				up:() => { if(holding){ holding = false; release(); } },
				key:k => { if(!m.g) return false; if(k === "ArrowLeft" || k === "ArrowRight"){ m.cursor = clamp((m.cursor ?? 15*60 + 30) + (k === "ArrowLeft" ? -1 : 1), m.g.from, m.g.to); return true; } if(k === " " || k === "Enter"){ release(); return true; } return false; }
			};
		});
		if(e2 === "late") return;
		say("22,50 € à 15 h 41 : <b>−10 %</b> depuis 15 h, et le démenti tombe onze minutes plus tard. Lys pesait 5 % du fonds : combien a-t-on perdu ?", 8000);
		await wait(1200); if(stop()) return;
		const e3 = await calc(LYS.cell);
		if(e3 === "late") return;
		phoneDown(); focus("R", 0);
		award("lys", 3, e1 + e2 + e3); learn(LYS.courses); addPiece("lys");
		say("<b>−0,5 %</b>, et le titre est remonté à 24,80 € : sans cette vente, on l'aurait presque tout récupéré. Deuxième explication.", 7000);
		await wait(3200);
	}

	/* ---------- 5. le krach : la couverture, posée et levée quand ? ---------- */
	async function krach(){
		if(stop()) return;
		ev("stage", "Krach"); play("alarm");
		const lm = L.mode && L.mode.kind === "orders" ? L.mode : (L.mode = { kind:"orders", scroll:0, sel:-1, found:[], bad:null });
		lm.sel = -1; focus("L", 0);
		say("16 h 20, le krach. On s'était couverts en vendant des contrats à terme… <b>Retrouve la couverture dans le carnet</b>.", 7500);
		const e1 = await findTicket(KRACH.ticket, o => o[2] === "Banque Lys" ? "Ça, c'est la vente de Lys. La couverture, ce sont des <b>contrats à terme</b>." : `${o[2]} : ce n'est pas une couverture. Cherche des contrats à terme.`);
		if(e1 === "late") return;
		say("Posée à <b>16 h 50</b>. Et la levée ? Aucun ordre après… <b>jamais levée</b>.", 6000);
		await wait(1800); if(stop()) return;
		const m = R.mode = { kind:"krach", done:[], ruler:null };
		focus("R", 0);
		say(KRACH.keynes + "<br>Sur le CAC 40, <b>mesure à la règle</b> ce qui s'est passé avant la couverture, puis pendant.", 9500);
		let errs = 0;
		const r = await gesture(fin => {
			inp = rulerInput(R, cacAt, (a, b, d) => {
				const j = judge(KRACH.spans, a, b, d, m.done);
				if(j.F && !j.again){
					m.done.push({ id:j.F.id, a:j.F.a, b:j.F.b, label:pct(j.F.d, 1) }); play("good");
					say(j.F.id === "chute" ? "<b>−4 %</b> avant la couverture : on a pris toute la chute." : "<b>+2,5 %</b> de rebond pendant qu'on était couverts : on l'a manqué.", 5000);
					if(m.done.length === 2) wait(1500).then(() => fin(errs));
					return true;
				}
				if(j.F) return false;
				errs++; miss();
				say(j.why === "two" ? "Tu as mesuré la chute et le rebond ensemble. Sépare-les à la ligne de la couverture, 16 h 50." : j.why === "part" ? "Une partie seulement : va d'un bout à l'autre du mouvement." : "Là, l'indice ne bouge presque pas.", 5500);
				return false;
			});
		});
		if(r === "late") return;
		say("Le rebond manqué, en part du fonds : les actions pèsent 40 %. Calcule.", 5000);
		const e3 = await calc(KRACH.cell);
		if(e3 === "late") return;
		phoneDown(); focus("R", 0);
		award("krach", 4, e1 + errs + e3); learn(KRACH.courses); addPiece("krach");
		say("Posée au plus bas, jamais levée : le mauvais timing a coûté <b>1,0 %</b>. Le dossier est complet. On monte au comité.", 7000);
		await wait(3500);
	}

	/* ---------- 6. le comité de 18 h ---------- */
	const MEMBER_OK = ["Clair.", "Merci, c'est précis.", "C'est noté.", "Bien vu.", ""];
	async function comite(){
		S.board = true; S.inv = false; S.gmin = COMITE; setClock(COMITE); $("#ruClock").textContent = "18 h 00 · comité";
		ev("stage", "Comité"); play("chime");
		Object.keys(PIECES).filter(id => S.pieces[id]).forEach((id, i) => makeSheet(id, i));
		hush("ines"); focus("comite", 0);
		await wait(800);
		const n = Object.keys(S.pieces).length;
		say(n === 5 ? "18 h, on y est. Pour répondre : <b>prends la bonne pièce sur la table, puis montre le chiffre</b>." : `18 h… On n'a que ${n} pièce${n > 1 ? "s" : ""} sur 5. Défends ce qu'on a : <b>prends la bonne pièce, puis montre le chiffre</b>.`, 8000);
		await wait(2400); if(closed) return;
		for(const Q of QUESTIONS){
			sayCom(Q.who, Q.q); play("pop");
			const avail = Q.ok.some(([p]) => S.pieces[p]);
			if(!avail){
				await wait(3500); if(closed) return;
				say("On n'a pas cette pièce : on n'a pas eu le temps de la monter…", 4500); miss();
				await wait(1800); if(closed) return;
				sayCom(Q.who, "Alors revenez demain avec des preuves."); await wait(3000); if(closed) return;
				continue;
			}
			const res = await gesture(fin => {
				let errs = 0;
				const cite = (sh, zid) => {
					const ok = Q.ok.some(([p, z]) => p === sh.id && z === zid);
					if(ok){ sh.cited = zid; drawSheet(sh); play("good"); inp = null; wait(1300).then(() => fin(errs)); return; }
					errs++; miss(); sh.bad = zid; drawSheet(sh); setTimeout(() => { sh.bad = null; drawSheet(sh); }, 900);
					sayCom(Q.who, Q.ok.some(([p]) => p === sh.id) ? "Ce chiffre-là ne répond pas exactement à ma question." : "Ce document ne répond pas à ma question.", 0);
					if(errs >= 3){ const [p] = Q.ok.find(([p]) => S.pieces[p]); say(`Psst… la pièce « ${PIECES[p].title} ».`, 5000); }
				};
				const zoneAt = (sh, y) => { const z = sh.zones.find(([, a, b]) => y >= a && y <= b); return z ? z[0] : null; };
				inp = {
					down:h => {
						if(h.sheet){ const sh = sheets[h.sheet]; if(S.raised === h.sheet){ const z = zoneAt(sh, h.y); if(z) cite(sh, z); } else { S.raised = h.sheet; sh.kz = null; play("clic"); } }
						else S.raised = null;
					},
					key:k => {
						const ids = Object.keys(sheets); if(!ids.length) return false;
						if(!S.raised){ S.kp = S.kp ?? 0;
							if(k === "ArrowLeft" || k === "ArrowRight"){ S.kp = (S.kp + (k === "ArrowLeft" ? ids.length - 1 : 1)) % ids.length; for(const s of Object.values(sheets)){ s.kz = s.id === ids[S.kp] ? "*" : null; drawSheet(s); } return true; }
							if(k === " " || k === "Enter"){ S.raised = ids[S.kp]; sheets[S.raised].kz = PIECES[S.raised].zones[0][0]; drawSheet(sheets[S.raised]); return true; }
							return false; }
						const sh = sheets[S.raised], zs = PIECES[sh.id].zones.map(z => z[0]);
						if(k === "ArrowUp" || k === "ArrowDown"){ const i = zs.indexOf(sh.kz); sh.kz = zs[(Math.max(0, i) + (k === "ArrowUp" ? zs.length - 1 : 1)) % zs.length]; drawSheet(sh); return true; }
						if(k === " " || k === "Enter"){ if(sh.kz && sh.kz !== "*") cite(sh, sh.kz); return true; }
						if(k === "Backspace"){ sh.kz = null; drawSheet(sh); S.raised = null; return true; }
						return false;
					}
				};
			});
			if(closed) return;
			const sh = sheets[S.raised];
			award("comite", 3, res, 1); S.qok += res === 0 ? 1 : 0;
			say(Q.ans, 0, "me"); learn(Q.courses);
			await wait(Q.calc ? 4500 : 6500); if(closed) return;
			if(Q.calc){
				S.raised = null;
				sayCom(Q.who, "Et concrètement, on couvre combien ?"); focus("comite", 1);
				const e = await calc(Q.calc); if(closed) return;
				award("comite", 1, e); S.reco = true;
				phoneDown(); focus("comite", 0);
				say("2,5 M€ de contrats à terme : avec un bêta de 0,25, une chute de 4 % ne coûte plus que 1 %. Et on écrit d'avance quand on lève la couverture.", 0, "me");
				await wait(5500); if(closed) return;
			}
			S.raised = null; if(sh){ sh.cited = null; drawSheet(sh); }
			sayCom(Q.who, MEMBER_OK[QUESTIONS.indexOf(Q) % MEMBER_OK.length] || "Merci.", 2600); hush("me");
			await wait(1500); if(closed) return;
		}
		hush("me");
		sayCom(0, S.reco ? "Recommandation adoptée : 2,5 M€ de couverture, et une règle de levée. Karim ?" : "On reprendra la recommandation demain. Karim ?", 0);
		await wait(3600); if(closed) return;
		sayCom(1, "Et plus aucun ordre sur une information non vérifiée. Merci pour ce dossier.", 0);
		await wait(3800);
	}

	/* ---------- déroulé ---------- */
	async function run(){
		L.mode = { kind:"idle" }; R.mode = { kind:"news" };
		focus("desk", 0);
		say("17 h 30. Le fonds a perdu <b>3,2 %</b> aujourd'hui. À 18 h, le comité veut savoir <b>pourquoi</b>. Commence par la courbe.", 6000);
		await wait(2600); if(closed) return;
		S.inv = true; shownMin = -1; setClock(S.gmin);
		await courbe(); if(closed) return;
		// fin de la scène d'ouverture : l'horloge du comité s'arrête pendant le palier
		if(!S.late){ S.inv = false; await palier({ id:"ruee", onEvent:ev, openLead, quit:close,
			titre:"Les chutes sont mesurées : −3,2 %, le compte est bon.",
			texte:"Reste à expliquer chacune (une annonce de la BCE, un ordre passé trop tôt, une action qui plonge), puis à défendre ton dossier devant le comité de 18 h.",
			suite:"Monter tout le dossier (≈ 6 min)" }); if(closed) return; S.inv = true; }
		await bce(); if(closed) return;
		await regression(); if(closed) return;
		await lys(); if(closed) return;
		await krach(); if(closed) return;
		if(S.late){ phoneDown(); say("18 h ! Le comité nous attend. Tant pis, on y va avec ce qu'on a.", 5000); play("alarm"); await wait(3000); if(closed) return; }
		S.inv = false; S.phoneMode = "off"; S.phoneUp = 0;
		await comite(); if(closed) return;
		finish();
	}

	/* ---------- boucle ---------- */
	let last = performance.now(), raf = 0;
	function frame(now){
		if(closed) return;
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		if(SPEED === 1) tick(dt);
		show(dt, now);
	}
	function show(dt, now){
		if(sized !== innerWidth + "x" + innerHeight) resize();
		camPos.lerp(camGoalP, Math.min(1, dt*3.2)); camLook.lerp(camGoalL, Math.min(1, dt*3.2));
		if(!isFinite(camPos.x + camLook.x)){ camPos.copy(camGoalP); camLook.copy(camGoalL); }
		camera.position.copy(camPos); camera.lookAt(camLook); camera.updateMatrixWorld();
		placePhone(dt); placeSheets(dt);
		drawScreens(dt);
		renderer.render(scene, camera);
		placeBubbles();
	}
	function tick(dt){
		const g = dt*SPEED;
		for(const o of [...timers]){ o.t -= g; if(o.t <= 0){ timers.delete(o); o.r(); } }
		for(const f of [...tickers]) f(g);
	}
	// le téléphone vient dans le champ, à droite (paysage) ou en bas (portrait), assez grand pour taper
	const fwd = new THREE.Vector3(), right = new THREE.Vector3(), upV = new THREE.Vector3(), goalP = new THREE.Vector3(), goalQ = new THREE.Quaternion();
	function camFrame(d){
		const vf = camera.fov*Math.PI/180, vh = 2*d*Math.tan(vf/2), vw = vh*camera.aspect;
		camera.getWorldDirection(fwd); right.set(1, 0, 0).applyQuaternion(camera.quaternion); upV.set(0, 1, 0).applyQuaternion(camera.quaternion);
		return { vh, vw };
	}
	function placePhone(dt){
		let sc = 1;
		if(!S.phoneUp){ goalP.copy(PHONE_DESK.p); goalQ.copy(PHONE_DESK.q); }
		else {
			const d = .5, { vh, vw } = camFrame(d), land = camera.aspect >= 1;
			const Hp = land ? Math.min(.8*vh, .3*vw*PH/PW) : Math.min(.48*vh, .86*vw*PH/PW);
			const ox = land ? vw/2 - .1875*vw : 0, oy = land ? -.04*vh : -vh/2 + .275*vh;
			goalP.copy(camera.position).addScaledVector(fwd, d).addScaledVector(right, ox).addScaledVector(upV, oy);
			goalQ.copy(camera.quaternion); sc = Hp/.38;
		}
		const k = Math.min(1, dt*8); phone.position.lerp(goalP, k); phone.quaternion.slerp(goalQ, k);
		phone.scale.setScalar(lerp(phone.scale.x, sc, k));
	}
	function placeSheets(dt){
		const k = Math.min(1, dt*7);
		for(const sh of Object.values(sheets)){
			let sc = 1;
			if(S.raised === sh.id){
				const d = .45, { vh, vw } = camFrame(d), ar = SHW/SHH;
				const H = Math.min(.62*vh, .94*vw/ar); sc = H/(.46/ar);
				goalP.copy(camera.position).addScaledVector(fwd, d).addScaledVector(upV, .02*vh); goalQ.copy(camera.quaternion);
			} else { goalP.copy(sh.home); goalQ.copy(sh.hq); }
			sh.mesh.position.lerp(goalP, k); sh.mesh.quaternion.slerp(goalQ, k); sh.mesh.scale.setScalar(lerp(sh.mesh.scale.x, sc, k));
		}
	}
	function placeBubbles(){
		for(const [key, b] of Object.entries(bubbles)){
			if(key === "me" || b.el.classList.contains("off")) continue;
			const head = b.who.g.position.clone(); head.y += 2.55;
			const s = toScreen(head);
			if(s.in && !(key === "ines" && S.focus !== "desk")){ b.el.classList.remove("fix"); const half = Math.min(180, innerWidth/2 - 12); b.el.style.left = clamp(s.x, half + 12, innerWidth - half - 12) + "px"; b.el.style.top = Math.max(b.el.offsetHeight + 70, s.y) + "px"; }
			else { b.el.classList.add("fix"); b.el.style.left = "12px"; const other = key === "com" ? bubbles.ines.el : null; b.el.style.top = (other && other.classList.contains("fix") && !other.classList.contains("off") ? 64 + other.offsetHeight + 8 : 64) + "px"; }
		}
	}

	/* ---------- début, fin, fermeture ---------- */
	const ov = $("#ruOv"), card = $("#ruCard");
	function finish(){
		S.phase = "done"; play("win");
		const score100 = Math.max(0, Math.min(100, Math.round(S.pts/MAXP*100)));
		const mention = MENTIONS[score100 >= 85 ? 3 : score100 >= 65 ? 2 : score100 >= 45 ? 1 : 0];
		ev("win", mention);
		const np = Object.keys(S.pieces).length;
		const rank = mention === "Très bien" ? "Le comité est convaincu" : mention === "Bien" ? "Dossier solide" : mention === "Assez bien" ? "Analyste en devenir" : "À reprendre avec Inès";
		card.innerHTML = `<p class="k">18 h 15 · le comité est levé</p><div class="ru-big">${score100 >= 65 ? "📈" : "📋"}</div>
			<h2>${rank}</h2>
			<p>Mention <b>${mention}</b> (${score100} / 100). ${np < 5 ? "Il manquait des pièces au dossier : au comité, sans preuve, pas de réponse." : S.qok >= 4 ? "Chaque explication est arrivée avec sa preuve et son chiffre : c'est ce qu'on attend d'un analyste." : "Le dossier était complet ; au comité, choisis la pièce et le chiffre qui répondent exactement à la question."}</p>
			<div class="ru-stats"><div>Pièces au dossier<b>${np} / 5</b></div><div>Réponses du premier coup<b>${S.qok} / ${QUESTIONS.length}</b></div><div>Explication de la journée<b>${S.pieces.courbe ? "−1,0 −0,5 −1,6 −0,1" : "—"}</b></div><div>Recommandation<b>${S.reco ? "couvrir 2,5 M€" : "—"}</b></div></div>
			<p class="k">Les cours de la licence que tu as pratiqués (${S.learned.length})</p>
			<ul class="ru-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span><b>${COURSES[k][1]}</b> · ${COURSES[k][2]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="ru-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="ru-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Économie-Finance ↗</a>
			<button class="ru-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="ru-alt" data-a="replay">Rejouer</button>`;
		ov.hidden = false; card.scrollTop = 0;
		for(const b of Object.values(bubbles)) b.el.classList.add("off");
	}
	ov.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openRuee({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	$(".ru-x").addEventListener("click", close);
	let pump = 0;      // ?vite : l'horloge du jeu avance même quand l'affichage est en pause (tests automatiques)
	if(SPEED > 1){ window.__ruee = { S, L, R, sheets, get inp(){ return inp; }, camera, renderer, scene, hitAt, snap:() => { drawAcc = 1; show(1, performance.now()); } }; pump = setInterval(() => { if(!closed && !window.__ruee.pause) tick(.03); }, 30); }

	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.clear(); tickers.clear(); lateHooks.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		for(const b of Object.values(bubbles)) clearTimeout(b.off);
		[L.tex, R.tex, ptex, clkT].forEach(t => t.dispose());
		for(const s of Object.values(sheets)){ s.tex.dispose(); s.mesh.material.dispose(); s.mesh.geometry.dispose(); }
		[L.scr, R.scr, pscr, clock, sky].forEach(m => { m.material.dispose(); m.geometry.dispose(); });      // les géométries du kit sont partagées avec le campus : on ne les libère pas
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss();
		root.remove();
		onClose && onClose();
	}

	// ouverture à chaud : pas d'écran de règles, Inès explique chaque geste au moment de le faire
	ov.hidden = true; S.phase = "play"; ev("start"); run();
	raf = requestAnimationFrame(frame);
}
