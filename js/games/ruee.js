/* « La Ruée » — mini-jeu de la Licence Économie-Finance (FGES).
   Un après-midi de stage dans le bureau d'une société de gestion, en plein jour. Tu gères une ligne de 100 000 €,
   Inès, l'analyste qui t'encadre, travaille au bureau d'à côté. Les nouvelles tombent toutes les quelques secondes.
   Environ 4 minutes. Tous les gestes se font dans la scène, sur les objets :
     - glisser une ligne de l'écran vers le haut (ça va monter) ou vers le bas (ça va baisser) ;
     - toucher l'écran au bon moment pour figer la droite de régression ;
     - maintenir le téléphone pour voir d'où vient une rumeur ;
     - maintenir le doigt sur l'écran pendant le krach pour être couvert (la prime tourne) ;
     - glisser sur les années pour les actualiser, puis décider ;
     - toucher, sur la courbe de la journée, la décision qui a coûté le plus.
   Les contenus (nouvelles, chiffres, cours) sont dans ruee-data.js. */
import * as THREE from "three";
import { makePerson, std, box, cyl } from "../kit.js?v=fdd5d880ac";
import { jpoCard } from "./jpo.js?v=fdd5d880ac";
import { COURSES, ASSETS, STAKE, FLASHES, REG, RUMOUR, KRACH, STARTUP, CLOSE, van, euro } from "./ruee-data.js?v=fdd5d880ac";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const lerp = (a, b, t) => a + (b - a)*t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fr = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/ | /g, " ");
const kEur = n => (n < 0 ? "−" : "") + fr(Math.abs(n)) + " k€";

const CSS = `
.ru{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#23201b;background:#efe9df;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;animation:ruIn .3s ease both}
@keyframes ruIn{from{opacity:0}to{opacity:1}}
.ru canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.ru-top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 6px calc(env(safe-area-inset-left) + 12px);z-index:5;pointer-events:none}
.ru-top>*{pointer-events:auto}
.ru-tag{background:#fffaf2;border:1px solid #d9cdb8;border-radius:8px;padding:6px 11px;font-weight:900;font-size:13px;white-space:nowrap;box-shadow:0 2px 6px rgba(60,45,20,.12)}
.ru-tag.n{background:#1d3b33;border-color:#1d3b33;color:#f3efe6}
.ru-pnl{font-variant-numeric:tabular-nums;transition:background .3s,color .3s}
.ru-pnl.up{background:#dff3e6;color:#11603d;border-color:#9fd3b2}
.ru-pnl.down{background:#fbe3dc;color:#a8361f;border-color:#eab2a3}
.ru-x{margin-left:auto;width:48px;height:48px;border-radius:50%;border:1px solid #d9cdb8;background:#fffaf2;font-size:24px;cursor:pointer;color:#23201b;box-shadow:0 2px 6px rgba(60,45,20,.15)}
.ru-say{position:absolute;z-index:4;max-width:min(340px,calc(100% - 24px));transform:translate(-50%,-100%);pointer-events:none;transition:opacity .3s}
.ru-say.off{opacity:0}
.ru-say .b{background:#fffaf2;border:2px solid #1d3b33;border-radius:14px;padding:8px 12px;font-size:14px;line-height:1.4;box-shadow:0 6px 18px rgba(40,30,10,.2)}
.ru-say .who{display:block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#2f7d62;font-weight:900}
.ru-say.fix{transform:none}
.ru-say.mx .b{border-color:#c0702a}.ru-say.mx .who{color:#a85a18}
.ru-notes{position:absolute;left:calc(env(safe-area-inset-left) + 12px);bottom:calc(env(safe-area-inset-bottom) + 12px);z-index:5;display:flex;flex-direction:column-reverse;gap:8px;align-items:flex-start;pointer-events:none;max-width:min(260px,46%)}
.ru-note{background:#fff3a6;color:#3b3510;border-radius:2px;padding:7px 10px 9px;font-size:12.5px;font-weight:800;line-height:1.3;box-shadow:2px 4px 10px rgba(60,50,10,.22);transform:rotate(-1.5deg);animation:ruNote 4.2s ease both}
.ru-note:nth-child(2n){transform:rotate(1.2deg);background:#ffe7a0}
.ru-note span{display:block;font-size:10px;color:#7a6a14;letter-spacing:.06em;text-transform:uppercase}
@keyframes ruNote{0%{opacity:0;translate:0 14px}10%{opacity:1;translate:0 0}85%{opacity:1}100%{opacity:0}}
.ru-ov{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:14px;background:rgba(35,32,27,.4)}
.ru-ov[hidden]{display:none}
.ru-card{max-width:560px;width:100%;max-height:100%;overflow:auto;background:#fffaf2;border-radius:16px;padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);user-select:text;-webkit-user-select:text}
.ru-card h2{font:800 26px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px;color:#1d3b33}
.ru-card .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#2f7d62;font-weight:900;margin:0 0 4px}
.ru-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.ru-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}
.ru-legend div{background:#f1ebe0;border-radius:10px;padding:7px 9px;font-size:13px;line-height:1.3}
.ru-legend b{font-size:18px;display:block}
.ru-go{display:block;width:100%;border:0;border-radius:12px;padding:12px;font:900 16px Nunito,sans-serif;background:#1d3b33;color:#fff;cursor:pointer;min-height:48px;box-shadow:0 4px 0 #0f221d}
.ru-go:focus-visible{outline:3px solid #f4c430}
.ru-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#1d3b33;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:underline;min-height:44px}
.ru-stats{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
.ru-stats div{flex:1 1 110px;background:#f1ebe0;border-radius:10px;padding:6px 9px;font-size:12px;font-weight:800;color:#6b6152}
.ru-stats b{display:block;font-size:18px;color:#23201b}
.ru-list{list-style:none;margin:0 0 10px;padding:0}
.ru-list li{background:#f6f1e8;border-radius:10px;padding:7px 9px;margin:5px 0;font-size:13px;line-height:1.35}
.ru-list li span{display:inline-block;background:#1d3b33;color:#fff;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:900;margin-right:5px}
.ru-big{font-size:46px;text-align:center;margin:0}
.ru-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:640px){.ru-tag{font-size:12px;padding:5px 8px}.ru-tag.hide-s{display:none}.ru-say .b{font-size:13px}.ru-notes{max-width:58%}}
@media (prefers-reduced-motion:reduce){.ru,.ru-note{animation:none}}
`;

export function openRuee({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("ru-css")){ const st = document.createElement("style"); st.id = "ru-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "ru";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La Ruée");
	root.innerHTML = `<canvas tabindex="0" aria-label="Le bureau : flèches haut et bas pour les lignes, espace pour toucher ou maintenir, flèche droite pour actualiser"></canvas>
		<div class="ru-top"><span class="ru-tag n">La Ruée</span><span class="ru-tag" id="ruClock">13 h 58</span><span class="ru-tag ru-pnl" id="ruPnl">Résultat du jour 0 €</span><button class="ru-x" aria-label="Quitter le jeu">×</button></div>
		<div class="ru-say off" id="ruInes" aria-live="polite"><div class="b"><span class="who">Inès, analyste</span><span class="t"></span></div></div>
		<div class="ru-say mx off" id="ruMax" aria-live="polite"><div class="b"><span class="who">Maxime, fondateur</span><span class="t"></span></div></div>
		<div class="ru-notes" id="ruNotes"></div>
		<div class="ru-sr" id="ruSr" aria-live="assertive"></div>
		<div class="ru-ov" id="ruOv"><div class="ru-card" id="ruCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	let closed = false;

	/* ---------- état ---------- */
	const S = { phase:"intro", pnl:0, pts:0, max:0, good:0, rows:0, learned:[], moments:[], bilan:0, verified:false, hedge:null, npv:null, focus:"desk" };

	/* ---------- scène : un bureau en plein jour ---------- */
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
		frame:std("#55575c"), city:std("#c6bfb4"), city2:std("#b3aca1"), plant:std("#557f4f"), pot:std("#d9cbb5"), paper:std("#f7f4ee"), mug:std("#2f7d62"), chair:std("#2c3138") };
	box(scene, 16, .1, 12, MAT.floor, 0, -.1, -1).receiveShadow = true;
	// le mur de fenêtres, avec Lille au loin
	box(scene, 16, .9, .2, MAT.wall, 0, 0, -4.2); box(scene, 16, .7, .2, MAT.wall, 0, 3.6, -4.2);
	const sky = new THREE.Mesh(new THREE.PlaneGeometry(22, 5), MAT.sky); sky.position.set(0, 2.25, -6.5); scene.add(sky);
	for(let x = -7.5; x <= 7.5; x += 1.5) box(scene, .08, 2.8, .12, MAT.frame, x, .85, -4.15, 0, false);
	box(scene, 16, .06, .12, MAT.frame, 0, 2.2, -4.15, 0, false);
	for(let i = 0; i < 14; i++){ const h = .5 + ((i*37) % 11)/10; box(scene, .7 + (i % 3)*.25, h, .3, i % 2 ? MAT.city : MAT.city2, -7 + i*1.1, .9, -5.4, 0, false); }
	box(scene, .25, 1.9, .25, MAT.city2, 2.6, .9, -5.3, 0, false);      // un beffroi au loin
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
	// le téléphone, le carnet, la tasse, le clavier
	const PW = 300, PH = 560;
	const pc = document.createElement("canvas"); pc.width = PW; pc.height = PH; const pctx = pc.getContext("2d");
	const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
	const phone = new THREE.Group(); scene.add(phone);
	box(phone, .2, .38, .02, MAT.black, 0, -.19, -.012, 0, false);
	const pscr = new THREE.Mesh(new THREE.PlaneGeometry(.18, .336), new THREE.MeshBasicMaterial({ map:ptex, toneMapped:false })); pscr.position.z = .0; phone.add(pscr);
	pscr.userData.phone = true;
	const PHONE_DESK = { p:new THREE.Vector3(.95, 1.05, .2), q:new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2, 0, .4)) };
	phone.position.copy(PHONE_DESK.p); phone.quaternion.copy(PHONE_DESK.q);
	box(scene, 1.1, .03, .35, MAT.black, 0, 1.04, .15);
	box(scene, .5, .02, .65, MAT.paper, -1.1, 1.04, .2, .2);
	cyl(scene, .07, .06, .16, MAT.mug, 1.45, 1.04, -.1);
	for(const [x, z] of [[-6, -3.4], [6, -3.4], [-6, 1.5]]){ cyl(scene, .35, .28, .6, MAT.pot, x, 0, z); const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.65, 0), MAT.plant); p.position.set(x, 1.15, z); p.castShadow = true; scene.add(p); }
	// les écrans des collègues, au fond
	for(const [x, z] of [[-3.6, -3.05], [3.9, -3.05]]) box(scene, 1, .6, .05, MAT.black, x, 1.3, z);
	// la pendule
	const clk = document.createElement("canvas"); clk.width = clk.height = 256; const clkx = clk.getContext("2d");
	const clkT = new THREE.CanvasTexture(clk); clkT.colorSpace = THREE.SRGBColorSpace;
	const clock = new THREE.Mesh(new THREE.CircleGeometry(.3, 32), new THREE.MeshBasicMaterial({ map:clkT })); clock.position.set(-5.2, 3.95, -4.08); scene.add(clock);
	function setClock(s){
		$("#ruClock").textContent = s;
		const [h, m] = s.split(" h ").map(Number); const x = clkx;
		x.fillStyle = "#fffaf2"; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = "#23201b"; x.stroke();
		for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; x.fillStyle = "#23201b"; x.fillRect(128 + Math.sin(a)*100 - 4, 128 - Math.cos(a)*100 - 4, 8, 8); }
		const hand = (a, l, w) => { x.lineWidth = w; x.lineCap = "round"; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(a)*l, 128 - Math.cos(a)*l); x.stroke(); };
		hand(((h % 12) + m/60)/12*Math.PI*2, 60, 12); hand(m/60*Math.PI*2, 92, 7);
		clkT.needsUpdate = true;
	}
	setClock("13 h 58");
	// Inès, à son bureau, tournée vers toi ; Maxime arrivera plus tard
	const ines = makePerson(scene, true, "pro"); ines.g.position.set(2.45, 0, -1.05); ines.g.rotation.y = -.55;
	box(scene, .55, .5, .55, MAT.chair, 2.45, 0, -1.05, 0, false);
	for(const [x, z, r] of [[-3.6, -1.9, Math.PI], [3.9, -1.9, Math.PI]]){ const p = makePerson(scene, true, "pro"); p.g.position.set(x, 0, z); p.g.rotation.y = r; }
	const maxi = makePerson(scene, false, "casual"); maxi.g.position.set(-5.5, 0, -1.6); maxi.target = maxi.g.position.clone(); maxi.g.visible = false;

	/* ---------- les écrans : dessin ---------- */
	const A = {};
	for(const [id, a] of Object.entries(ASSETS)) A[id] = { ...a, base:a.p, open:a.p, anim:null };
	function moveAsset(id, pct, sec = 1.6){ const a = A[id]; a.anim = { from:a.p, to:a.base*(1 + pct), t:0, d:sec }; a.base = a.base*(1 + pct); }
	function tickAssets(dt){
		for(const a of Object.values(A)){
			if(a.anim){ a.anim.t += dt; const k = clamp(a.anim.t/a.anim.d, 0, 1); a.p = lerp(a.anim.from, a.anim.to, 1 - Math.pow(1 - k, 3)); if(k >= 1) a.anim = null; }
			else a.p = a.base*(1 + (Math.sin(performance.now()/700 + a.open) + Math.sin(performance.now()/290 + a.open*3))*.0004);
		}
	}
	const C = { bg:"#121820", panel:"#1b2430", hi:"#25354a", txt:"#e9eef2", dim:"#8d9bab", up:"#3ccf8e", down:"#ff6b52", gold:"#f4c430", line:"#2c3a4c", teal:"#5fd0c0" };
	function rr(x, c, X, Y, W, H, r){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); x.fillStyle = c; x.fill(); }
	function txt(x, s, X, Y, size, col = C.txt, w = 700, al = "left"){ x.font = `${w} ${size}px Nunito, system-ui, sans-serif`; x.fillStyle = col; x.textAlign = al; x.textBaseline = "alphabetic"; x.fillText(s, X, Y); }
	function wrap(x, s, X, Y, maxW, size, col, w = 800, lh = 1.2){
		x.font = `${w} ${size}px Nunito, system-ui, sans-serif`; const words = s.split(" "); let line = "", yy = Y;
		for(const wd of words){ const t = line ? line + " " + wd : wd; if(x.measureText(t).width > maxW && line){ txt(x, line, X, yy, size, col, w); line = wd; yy += size*lh; } else line = t; }
		if(line) txt(x, line, X, yy, size, col, w); return yy;
	}
	function header(x, title, sub){
		x.fillStyle = C.bg; x.fillRect(0, 0, SW, SH);
		x.fillStyle = "#0c1117"; x.fillRect(0, 0, SW, 46);
		txt(x, title, 22, 31, 20, C.teal, 900); if(sub) txt(x, sub, SW - 22, 31, 18, C.dim, 700, "right");
	}
	function timerBar(x, o){ if(!o) return; const f = clamp(o.t/o.max, 0, 1); rr(x, "#26303c", 22, SH - 18, SW - 44, 8, 4); rr(x, f < .3 ? C.down : C.gold, 22, SH - 18, Math.max(8, (SW - 44)*f), 8, 4); }
	const fmtP = a => fr(a.p, a.dec) + a.unit;
	const chg = a => (a.p/a.open - 1)*100;

	// une ligne d'actif à glisser
	function drawRow(x, r, Y, H, i, m){
		const a = A[r.id], pressed = m.drag && m.drag.i === i;
		rr(x, pressed ? C.hi : C.panel, 18, Y, SW - 36, H - 10, 12);
		if(r.res){ x.lineWidth = 4; x.strokeStyle = r.res === "ok" ? C.up : r.res === "ko" ? C.down : C.dim; x.stroke(); }
		txt(x, a.name, 38, Y + 34, 21, C.dim, 800);
		txt(x, fmtP(a), 38, Y + H - 26, 32, C.txt, 900);
		const c = chg(a); txt(x, (c >= 0 ? "▲ +" : "▼ ") + fr(c, 2) + " %", 300, Y + H - 26, 22, c >= 0 ? C.up : C.down, 900);
		const cx = SW - 110, cy = Y + (H - 10)/2;
		if(r.pick){
			txt(x, r.pick > 0 ? "▲" : "▼", cx, cy + 22, 64, r.res ? (r.res === "ok" ? C.up : C.down) : C.gold, 900, "center");
			if(r.res) txt(x, r.res === "ok" ? "+" + fr(r.gain) + " €" : r.res === "ko" ? "−" + fr(-r.gain) + " €" : "—", cx - 90, cy + 12, 22, r.res === "ok" ? C.up : C.down, 900, "right");
		} else if(m.idle){ /* rien */ } else if(!m.over){
			const bob = Math.sin(performance.now()/260)*6;
			txt(x, "▲", cx, cy - 8 - bob, 30, C.dim, 900, "center"); txt(x, "▼", cx, cy + 34 + bob, 30, C.dim, 900, "center");
			if(m.labels) { txt(x, m.labels[0], cx - 40, cy - 12, 16, C.dim, 800, "right"); txt(x, m.labels[1], cx - 40, cy + 30, 16, C.dim, 800, "right"); }
		} else txt(x, "trop tard", cx, cy + 8, 20, C.dim, 800, "center");
	}
	function drawL(){
		const x = L.ctx, m = L.mode;
		if(!m || m.kind === "idle"){
			header(x, "MARCHÉS · EN DIRECT", $("#ruClock").textContent);
			["cac", "oat", "eur", "brent"].forEach((id, i) => drawRow(x, { id }, 62 + i*106, 106, -1, { over:false, idle:true }));
			return;
		}
		if(m.kind === "pre"){
			header(x, "MARCHÉS · EN DIRECT", m.F.clock);
			wrap(x, m.F.pre, 40, 150, SW - 80, 34, C.txt, 800);
			const n = Math.ceil(m.o.t); txt(x, n > 0 ? String(n) : "", SW/2, 380, 120, C.gold, 900, "center");
			return;
		}
		if(m.kind === "rows"){
			header(x, m.title, m.clock);
			let y = 62;
			if(m.news){ rr(x, m.alert ? "#4a1d18" : "#3a2f10", 18, 56, SW - 36, m.subShown ? 104 : 80, 10); y = wrap(x, m.news, 36, 92, SW - 72, 28, "#fff", 900); if(m.subShown && m.sub) wrap(x, m.sub, 36, y + 30, SW - 72, 19, "#e8d9a8", 700); y = m.subShown ? 172 : 148; }
			const H = Math.min(112, (SH - 30 - y)/m.rows.length);
			m.rows.forEach((r, i) => drawRow(x, r, y + i*H, H, i, m)); m.y0 = y; m.h = H;
			if(m.banner){ rr(x, "#173a2c", 18, SH - 92, SW - 36, 64, 10); wrap(x, m.banner, 34, SH - 66, SW - 68, 18, "#c9f0dc", 800); }
			timerBar(x, m.over ? null : m.o);
			return;
		}
		if(m.kind === "reg") return drawReg(x, m);
	}
	// la régression
	function drawReg(x, m){
		header(x, "ÉTUDE · CROISSANCE ET CHÔMAGE · 30 PAYS", REG.clock);
		const X0 = 50, X1 = 470, Y0 = 70, Y1 = 440;
		const px = v => X0 + (v + 2)/7*(X1 - X0), py = v => Y1 - (v + 1.8)/3.8*(Y1 - Y0);
		x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, py(0)); x.lineTo(X1, py(0)); x.moveTo(px(0), Y0); x.lineTo(px(0), Y1); x.stroke();
		txt(x, "croissance du PIB (%) →", X1, Y1 + 22, 15, C.dim, 800, "right");
		x.save(); x.translate(X0 - 14, Y1); x.rotate(-Math.PI/2); txt(x, "variation du chômage (pt) →", 0, 0, 15, C.dim, 800); x.restore();
		for(const [a, b] of m.pts){ x.fillStyle = C.teal; x.beginPath(); x.arc(px(a), py(b), 6, 0, 7); x.fill(); }
		const s = m.s;
		x.strokeStyle = m.frozen ? (m.res === "ok" ? C.up : m.res === "mid" ? C.gold : C.down) : C.gold; x.lineWidth = 5;
		x.save(); x.beginPath(); x.rect(X0, Y0, X1 - X0, Y1 - Y0); x.clip(); x.beginPath(); x.moveTo(px(-2), py(m.my + s*(-2 - m.mx))); x.lineTo(px(5), py(m.my + s*(5 - m.mx))); x.stroke(); x.restore();
		if(m.frozen && m.res !== "ok"){ x.setLineDash([10, 8]); x.strokeStyle = C.up; x.lineWidth = 3; x.beginPath(); x.moveTo(px(-2), py(m.my + REG.slope*(-2 - m.mx))); x.lineTo(px(5), py(m.my + REG.slope*(5 - m.mx))); x.stroke(); x.setLineDash([]); }
		// à droite : le script R et l'écart au nuage
		rr(x, "#0c1117", 490, 64, 290, 200, 10);
		REG.code.forEach((l, i) => wrap(x, "> " + l, 504, 94 + i*58, 262, 16, i === 1 ? "#b8f0c8" : "#c9d4de", 700, 1.15));
		txt(x, "Écart de ta droite au nuage", 494, 300, 17, C.dim, 800);
		const err = m.err; rr(x, "#26303c", 494, 312, 280, 22, 11); rr(x, err < .15 ? C.up : err < .45 ? C.gold : C.down, 494, 312, Math.max(22, 280*clamp(err, 0, 1)), 22, 11);
		txt(x, "pente " + fr(s, 2), 494, 376, 30, C.txt, 900);
		if(m.frozen) txt(x, "R trouve : " + fr(REG.slope, 2), 494, 414, 22, C.up, 900);
		else txt(x, "Touche l'écran quand la droite colle", 494, 414, 17, C.gold, 800);
		timerBar(x, m.frozen ? null : m.o);
	}
	function drawR(){
		const x = R.ctx, m = R.mode;
		if(!m || m.kind === "idle"){
			header(x, "TA LIGNE · 100 000 €", $("#ruClock").textContent);
			txt(x, "Résultat du jour", 40, 120, 24, C.dim, 800);
			txt(x, euro(S.pnl), 40, 200, 70, S.pnl > 0 ? C.up : S.pnl < 0 ? C.down : C.txt, 900);
			S.moments.forEach((mo, i) => { txt(x, mo.label, 40, 270 + i*44, 22, C.dim, 800); txt(x, euro(mo.d), SW - 40, 270 + i*44, 22, mo.d >= 0 ? C.up : C.down, 900, "right"); });
			return;
		}
		if(m.kind === "krach") return drawKrach(x, m);
		if(m.kind === "npv") return drawNpv(x, m);
		if(m.kind === "close") return drawClose(x, m);
	}
	// le krach
	const kIdx = t => { const p = KRACH.path; for(let i = 1; i < p.length; i++) if(t <= p[i][0]){ const [t0, v0] = p[i - 1], [t1, v1] = p[i]; return lerp(v0, v1, (t - t0)/(t1 - t0)); } return p[p.length - 1][1]; };
	function drawKrach(x, m){
		header(x, "CAC 40 · KRACH EN COURS", KRACH.clock);
		const X0 = 40, X1 = SW - 40, Y0 = 70, Y1 = 330, T = KRACH.path[KRACH.path.length - 1][0];
		const px = t => X0 + t/T*(X1 - X0), py = v => Y0 + (.01 - v)/.1*(Y1 - Y0);
		x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, py(0)); x.lineTo(X1, py(0)); x.stroke();
		txt(x, "0 %", X0, py(0) - 8, 15, C.dim); txt(x, "−8 %", X0, py(-.08) - 8, 15, C.dim);
		for(let i = 1; i < m.trace.length; i++){
			const [ta, va, ha] = m.trace[i - 1], [tb, vb] = m.trace[i];
			x.strokeStyle = ha ? C.up : C.down; x.lineWidth = ha ? 9 : 5; x.beginPath(); x.moveTo(px(ta), py(va)); x.lineTo(px(tb), py(vb)); x.stroke();
		}
		const held = m.hold && !m.over;
		rr(x, held ? "#173a2c" : "#3a1e18", 18, 350, SW - 36, 110, 12);
		txt(x, held ? "✋ COUVERT" : m.started ? "⚠ EXPOSÉ" : "Prêt ?", 40, 400, 36, held ? C.up : C.gold, 900);
		txt(x, held ? `la prime tourne : ${fr(KRACH.premium)} €/s` : "maintiens le doigt sur l'écran pour te couvrir", 40, 440, 18, C.dim, 800);
		txt(x, "position " + euro(m.pos), SW - 40, 396, 24, m.pos >= 0 ? C.up : C.down, 900, "right");
		txt(x, "prime payée −" + fr(m.prem) + " €", SW - 40, 436, 20, C.dim, 800, "right");
	}
	// la VAN
	function drawNpv(x, m){
		header(x, "DOSSIER START-UP · " + STARTUP.name.toUpperCase(), STARTUP.clock);
		const r = (STARTUP.rf + STARTUP.prime)/100, fl = STARTUP.flows, n = fl.length;
		const X0 = 50, bw = (SW - 100)/n, Z = 290, k = 1.1;
		txt(x, `Taux d'actualisation ${STARTUP.rf + STARTUP.prime} % = ${STARTUP.rf} % sans risque + ${STARTUP.prime} % de prime de risque`, 30, 76, 17, C.dim, 800);
		x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.moveTo(30, Z); x.lineTo(SW - 30, Z); x.stroke();
		fl.forEach((f, i) => {
			const cx = X0 + i*bw + bw/2;
			if(i === 0){ rr(x, "#8a3a2c", cx - bw*.32, Z, bw*.64, 120, 6); txt(x, "−300 k€", cx, Z + 70, 20, "#fff", 900, "center"); txt(x, "mise", cx, Z + 150, 17, C.dim, 800, "center"); return; }
			const hv = m.h[i], ghost = f*k;
			if(m.done[i]){ x.strokeStyle = "#4b5b70"; x.setLineDash([6, 5]); x.lineWidth = 2; x.strokeRect(cx - bw*.32, Z - ghost, bw*.64, ghost); x.setLineDash([]); }
			rr(x, m.done[i] ? C.teal : "#c9a24a", cx - bw*.32, Z - hv*k, bw*.64, hv*k, 6);
			txt(x, fr(hv) + " k€", cx, Z - hv*k - 10, 19, C.txt, 900, "center");
			txt(x, "an " + i, cx, Z + 26, 17, C.dim, 800, "center");
		});
		const sumNom = fl.slice(1).reduce((a, b) => a + b, 0), sumAct = m.h.slice(1).reduce((a, b) => a + b, 0);
		if(m.phase === "scrub"){
			txt(x, `Promis par Maxime : ${fr(sumNom)} k€`, 30, 116, 22, "#e8c66a", 900);
			txt(x, "Glisse le doigt sur les années → pour les ramener à aujourd'hui", SW - 30, SH - 34, 18, C.gold, 800, "right");
		} else {
			const v = van(fl, r);
			txt(x, `Valeur aujourd'hui : ${fr(sumAct)} k€ pour une mise de 300 k€`, 30, 116, 21, C.txt, 800);
			txt(x, "VAN " + kEur(Math.round(v)), 30, 172, 40, v >= 0 ? C.up : C.down, 900);
			if(!m.over){ txt(x, "▲ glisse vers le haut : j'investis", SW - 30, SH - 64, 19, C.gold, 800, "right"); txt(x, "▼ vers le bas : je passe", SW - 30, SH - 36, 19, C.gold, 800, "right"); }
			else txt(x, m.pick > 0 ? "Tu as investi." : m.pick < 0 ? "Tu as passé ton tour." : "La cloche a sonné.", SW - 30, SH - 40, 22, C.txt, 900, "right");
		}
		timerBar(x, m.over ? null : m.o);
	}
	// la clôture
	function drawClose(x, m){
		header(x, "CLÔTURE · TA JOURNÉE", CLOSE.clock);
		txt(x, "Touche la décision qui t'a coûté le plus", 30, 84, 22, C.gold, 900);
		const pts = m.pts, X0 = 70, X1 = SW - 70, Y0 = 120, Y1 = 430;
		const vals = pts.map(p => p.v), lo = Math.min(...vals, -1000), hi = Math.max(...vals, 1000);
		const px = i => X0 + i/(pts.length - 1)*(X1 - X0), py = v => Y1 - (v - lo)/(hi - lo)*(Y1 - Y0);
		x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, py(0)); x.lineTo(X1, py(0)); x.stroke();
		x.strokeStyle = C.txt; x.lineWidth = 4; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(px(i), py(p.v)) : x.moveTo(px(i), py(p.v))); x.stroke();
		m.hit = [];
		pts.forEach((p, i) => {
			if(!i) return; const X = px(i), Y = py(p.v);
			let col = p.d >= 0 ? C.up : C.down; if(m.pick === i) col = m.res ? C.up : C.down;
			if(!m.over && m.sel === i){ x.lineWidth = 5; x.strokeStyle = C.txt; x.beginPath(); x.arc(X, Y, 30, 0, 7); x.stroke(); }
			if(m.over && i === m.worst){ x.lineWidth = 6; x.strokeStyle = C.gold; x.beginPath(); x.arc(X, Y, 32, 0, 7); x.stroke(); }
			x.fillStyle = col; x.beginPath(); x.arc(X, Y, 22, 0, 7); x.fill();
			txt(x, p.label, X, Y + (p.d >= 0 ? -36 : 52), 18, C.txt, 900, "center");
			txt(x, euro(p.d), X, Y + (p.d >= 0 ? -58 : 74), 16, col, 800, "center");
			m.hit.push([i, X]);
		});
		timerBar(x, m.over ? null : m.o);
	}
	// le téléphone
	function drawPhone(){
		const x = pctx; x.fillStyle = "#0d0f12"; x.fillRect(0, 0, PW, PH);
		if(!S.phoneOn){ return; }
		x.fillStyle = "#f5f6f8"; x.fillRect(10, 10, PW - 20, PH - 20);
		txt(x, "Réseau social", 26, 46, 18, "#6b7280", 800);
		rr(x, "#ffffff", 20, 64, PW - 40, 230, 12);
		x.fillStyle = "#9aa3ad"; x.beginPath(); x.arc(46, 96, 16, 0, 7); x.fill();
		txt(x, RUMOUR.author, 70, 102, 16, "#111", 900);
		wrap(x, RUMOUR.post, 32, 140, PW - 64, 19, "#111", 800, 1.25);
		const f = clamp(S.reveal || 0, 0, 1);
		if(f > 0){
			rr(x, "#fff4d6", 20, 310, PW - 40, 220, 12);
			txt(x, "🔎 La source", 34, 342, 18, "#7a5a00", 900);
			RUMOUR.source.forEach((s, i) => { if(f > (i + .5)/RUMOUR.source.length) txt(x, "• " + s, 34, 380 + i*36, 16, "#3b2f00", 800); });
		} else txt(x, "Maintiens pour voir la source", PW/2, 420, 17, "#6b7280", 800, "center");
	}
	let drawAcc = 0;
	function drawScreens(dt){
		drawAcc += dt; if(drawAcc < 1/30) return; drawAcc = 0;
		drawL(); L.tex.needsUpdate = true; drawR(); R.tex.needsUpdate = true;
		if(S.phoneOn || S.phoneWas){ drawPhone(); ptex.needsUpdate = true; S.phoneWas = S.phoneOn; }
	}

	/* ---------- caméra : elle cadre ce qu'il faut regarder ---------- */
	const VIEW = { desk:{ c:new THREE.Vector3(.4, 1.3, -.2), n:new THREE.Vector3(0, .5, 1).normalize(), w:6.2, h:2.6 }, L:{ c:L.center, n:L.normal, w:1.42, h:.95 }, R:{ c:R.center, n:R.normal, w:1.42, h:.95 } };
	const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camGoalP = new THREE.Vector3(), camGoalL = new THREE.Vector3();
	function camGoal(){
		if(!innerWidth || !innerHeight || !isFinite(camera.aspect)) return;
		const v = VIEW[S.focus], vf = camera.fov*Math.PI/180, hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect);
		const top = 70/innerHeight;       // place pour la barre du haut
		const d = Math.max((v.w/2)/Math.tan(hf/2), (v.h/2)/(Math.tan(vf/2)*(1 - top*1.4)));
		camGoalP.copy(v.c).addScaledVector(v.n, d); if(S.focus !== "desk") camGoalP.y += .12;
		camGoalL.copy(v.c); camGoalL.y += S.focus === "desk" ? 0 : .02 + top*d*.5;
	}
	let sized = "";
	function focus(f){ S.focus = f; camGoal(); }
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
	function countdown(sec, onEnd){ const o = { t:sec, max:sec, onEnd, tick:true }; timers.add(o); o.stop = () => timers.delete(o); return o; }
	const tickers = new Set();      // fonctions appelées à chaque pas avec le temps du jeu

	/* ---------- Inès, Maxime, les post-it de cours ---------- */
	const bubbles = { ines:{ el:$("#ruInes"), who:ines, off:0 }, max:{ el:$("#ruMax"), who:maxi, off:0 } };
	function say(t, ms = 6000, k = "ines"){
		const b = bubbles[k]; b.el.querySelector(".t").innerHTML = t; b.el.classList.remove("off"); clearTimeout(b.off);
		if(ms) b.off = setTimeout(() => b.el.classList.add("off"), ms/Math.min(SPEED, 2));
		$("#ruSr").textContent = t.replace(/<[^>]+>/g, "");
	}
	function learn(keys){
		for(const k of keys || []){
			if(S.learned.includes(k)) continue; S.learned.push(k);
			const c = COURSES[k], el = document.createElement("div"); el.className = "ru-note"; el.innerHTML = `<span>${c[0]}</span>${c[1]}`;
			const box = $("#ruNotes"); box.appendChild(el); while(box.children.length > 3) box.firstChild.remove(); setTimeout(() => el.remove(), 4300);
		}
	}
	function setPnl(d, label){
		S.pnl += d; const el = $("#ruPnl"); el.textContent = "Résultat du jour " + euro(S.pnl);
		el.classList.toggle("up", S.pnl > 0); el.classList.toggle("down", S.pnl < 0);
		if(label) S.moments.push({ label, d });
		if(d) play(d > 0 ? "coin" : "bad");
	}
	const mark = (res, max) => { S.max += max; S.pts += res === "ok" ? max : res === "mid" ? max/2 : 0; if(res !== "ok") ev("err"); };

	/* ---------- les gestes : du doigt à l'écran 3D ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let inp = null;           // { down(h), move(h), up(h), key(e, down) } fournis par l'étape en cours
	let ptr = null;
	function hitAt(e){
		ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
		const hit = ray.intersectObjects([L.scr, R.scr, pscr], false)[0];
		const h = { cx:e.clientX, cy:e.clientY, mon:null, phone:false, x:0, y:0 };
		if(hit){ if(hit.object.userData.phone) h.phone = true; else { h.mon = hit.object.userData.mon; h.x = hit.uv.x*SW; h.y = (1 - hit.uv.y)*SH; } }
		return h;
	}
	canvas.addEventListener("pointerdown", e => { if(!inp) return; try { canvas.setPointerCapture(e.pointerId); } catch(_){} ptr = e.pointerId; const h = hitAt(e); inp.down && inp.down(h); });
	canvas.addEventListener("pointermove", e => { if(!inp || e.pointerId !== ptr) return; inp.move && inp.move(hitAt(e)); });
	const upH = e => { if(e.pointerId !== ptr) return; ptr = null; inp && inp.up && inp.up(hitAt(e)); };
	canvas.addEventListener("pointerup", upH); canvas.addEventListener("pointercancel", upH);
	function onKey(e){
		if(e.key === "Escape"){ close(); return; }
		if(inp && inp.key && ["ArrowUp", "ArrowDown", "ArrowRight", " ", "Enter"].includes(e.key) && S.phase === "play"){ e.preventDefault(); if(!e.repeat) inp.key(e.key, true); }
	}
	function onKeyUp(e){ if(inp && inp.key && [" ", "Enter"].includes(e.key)) inp.key(e.key, false); }
	document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKeyUp);

	/* ---------- étape : glisser des lignes (flashs et rumeur) ---------- */
	function rowsStep(m, onPick){
		return new Promise(done => {
			L.mode = m; m.drag = null; m.over = false;
			const rowAt = y => { const i = Math.floor((y - m.y0)/m.h); return i >= 0 && i < m.rows.length ? i : -1; };
			function pick(i, dir){
				const r = m.rows[i]; if(!r || r.pick || m.over) return;
				r.pick = dir; play("clic"); if(onPick) onPick(r);
				if(m.rows.every(q => q.pick)) end();
			}
			const prev = inp;
			inp = {
				down:h => { if(h.mon === L){ const i = rowAt(h.y); if(i >= 0 && !m.rows[i].pick) m.drag = { i, cy:h.cy }; } else if(prev && prev.down) prev.down(h); },
				move:h => { if(m.drag){ const dy = h.cy - m.drag.cy; if(Math.abs(dy) > 16){ pick(m.drag.i, dy < 0 ? 1 : -1); m.drag = null; } } else if(prev && prev.move) prev.move(h); },
				up:h => { m.drag = null; if(prev && prev.up) prev.up(h); },
				key:(k, d) => { if(!d){ prev && prev.key && prev.key(k, d); return; } const i = m.rows.findIndex(r => !r.pick); if(k === "ArrowUp" && i >= 0) pick(i, 1); else if(k === "ArrowDown" && i >= 0) pick(i, -1); else if(prev && prev.key) prev.key(k, d); }
			};
			m.o = countdown(m.time, end);
			function end(){ if(m.over) return; m.over = true; m.o.stop(); inp = null; m.drag = null; done(); }
			m.end = end;
		});
	}
	async function flash(F, first){
		setClock(F.clock); focus("L"); play("chime");
		const pre = { kind:"pre", F, o:countdown(3, () => {}) };
		L.mode = pre; say(F.pre, 3200);
		await wait(3000); if(closed) return;
		play("alarm"); ev("stage", F.id === "bce" ? "Flash BCE" : "Dépêche OPEP");
		const m = { kind:"rows", title:F.english ? "DÉPÊCHE · EN ANGLAIS" : "FLASH · BANQUE CENTRALE EUROPÉENNE", clock:F.clock, news:F.news, sub:F.sub, subShown:!F.english, alert:true, time:F.time,
			rows:F.rows.map(([id, want, move, why]) => ({ id, want, move, why, pick:0 })) };
		if(F.english){ const o = { t:3.5, r:() => { m.subShown = true; } }; timers.add(o); }
		if(first) say("Glisse chaque ligne <b>vers le haut</b> si elle va monter, <b>vers le bas</b> si elle va baisser. Vite, le marché n'attend pas !", 7000);
		await rowsStep(m); if(closed) return;
		// le marché tranche
		let d = 0, wrong = null;
		for(const r of m.rows){
			moveAsset(r.id, r.move);
			r.res = !r.pick ? "miss" : r.pick === r.want ? "ok" : "ko";
			r.gain = r.res === "ok" ? STAKE : r.res === "ko" ? -STAKE : 0; d += r.gain;
			S.rows++; if(r.res === "ok") S.good++; mark(r.res, 1);
			if(r.res !== "ok" && !wrong) wrong = r;
		}
		await wait(900);
		setPnl(d, F.id === "bce" ? "BCE" : "OPEP");
		say(wrong ? `${wrong.res === "miss" ? "Pas de décision sur « " + ASSETS[wrong.id].name + " »." : "✘ " + ASSETS[wrong.id].name + " :"} ${wrong.why}<br><br>${F.trap}` : `✔ Les trois dans le bon sens. ${F.trap}`, 9000);
		learn(F.courses);
		await wait(4200);
	}

	/* ---------- étape : la régression ---------- */
	function regression(){
		return new Promise(async done => {
			setClock(REG.clock); focus("L"); play("chime"); ev("stage", "Régression");
			let sd = REG.seed; const rnd = () => (sd = (sd*16807) % 2147483647)/2147483647;
			const pts = []; for(let i = 0; i < REG.n; i++){ const a = -1.6 + rnd()*6.2; pts.push([a, .2 + REG.slope*(a - 1.5) + (rnd() - .5)*1.1]); }
			const mx = pts.reduce((s, p) => s + p[0], 0)/pts.length, my = pts.reduce((s, p) => s + p[1], 0)/pts.length;
			// la vraie pente des moindres carrés de ces points
			const ols = pts.reduce((s, p) => s + (p[0] - mx)*(p[1] - my), 0)/pts.reduce((s, p) => s + (p[0] - mx)**2, 0);
			const sse = s => pts.reduce((a, p) => a + (p[1] - (my + s*(p[0] - mx)))**2, 0);
			const e0 = sse(ols), e1 = sse(ols + 1.3);
			const m = { kind:"reg", pts, mx, my, s:.4, t:0, err:1, frozen:false };
			L.mode = m;
			say("Le chef veut savoir si la croissance fait baisser le chômage. La droite tourne : <b>touche l'écran quand elle colle le mieux au nuage</b>.", 7000);
			const tk = dt => { if(m.frozen) return; m.t += dt; m.s = ols + .85*Math.sin(m.t*1.5 + 1.2); m.err = clamp((sse(m.s) - e0)/(e1 - e0), 0, 1); };
			tickers.add(tk);
			m.o = countdown(REG.time, () => freeze(true));
			function freeze(late){
				if(m.frozen) return; m.frozen = true; m.o.stop(); tickers.delete(tk); inp = null;
				const gap = Math.abs(m.s - ols);
				m.res = late ? "ko" : gap < .14 ? "ok" : gap < .32 ? "mid" : "ko";
				mark(m.res, 2); play(m.res === "ok" ? "good" : m.res === "mid" ? "chime" : "bad");
				say((m.res === "ok" ? "✔ Pile sur la droite de R : " : m.res === "mid" ? "≈ Pas loin. R trouve " : late ? "✘ Trop tard. R trouve " : "✘ Trop loin du nuage. R trouve ")
					+ `une pente de ${fr(REG.slope, 2)} : un point de croissance en plus, environ 0,4 point de chômage en moins. <b>Mais un lien n'est pas une cause</b> : il faudrait d'autres tests pour le dire.`, 9000);
				learn(REG.courses);
				wait(5200).then(done);
			}
			inp = { down:() => freeze(false), key:(k, d) => { if(d && (k === " " || k === "Enter")) freeze(false); } };
		});
	}

	/* ---------- étape : la rumeur ---------- */
	const phoneTo = { p:new THREE.Vector3(), q:new THREE.Quaternion() };
	async function rumour(){
		setClock(RUMOUR.clock); focus("L"); ev("stage", "Rumeur");
		S.phoneOn = true; S.reveal = 0; S.verified = false; S.phoneUp = 1; play("clic");
		moveAsset("lys", RUMOUR.drop, 7);
		const m = { kind:"rows", title:"MARCHÉS · BANQUES", clock:RUMOUR.clock, news:"Banque Lys : −9 % en quelques minutes", alert:true, subShown:false, time:RUMOUR.time,
			labels:["je garde", "je vends"], rows:[{ id:"lys", pick:0 }] };
		say("Ton téléphone vibre, et la Banque Lys plonge. Tu en as dans ta ligne. <b>Garde ou vends</b> : glisse la ligne. Et avant, si tu veux, <b>maintiens le téléphone</b> pour voir la source.", 8000);
		let holding = false;
		const tk = dt => {
			if(holding){ S.reveal = Math.min(1.2, S.reveal + dt/1.4); if(S.reveal >= 1 && !S.verified){ S.verified = true; play("pop"); say("Un compte créé hier, sans source… <b>Méfiance.</b> Maintenant, décide.", 5000); } }
			S.phoneUp = holding ? 2 : 1;
		};
		tickers.add(tk);
		const phoneInp = { down:h => { if(h.phone) holding = true; }, up:() => { holding = false; }, key:(k, d) => { if(k === " " || k === "Enter") holding = d; } };
		inp = phoneInp;
		const p = rowsStep(m);
		// rowsStep a remplacé inp en gardant le téléphone comme repli
		await p; if(closed) return;
		tickers.delete(tk); holding = false; S.phoneUp = 0;
		const r = m.rows[0], sold = r.pick < 0;
		let res, d, msg;
		if(sold){ res = "ko"; d = Math.round(-STAKE*1.4); msg = "✘ Tu as vendu au plus bas, sur une rumeur. "; }
		else if(S.verified){ res = "ok"; d = Math.round(STAKE*.6); msg = "✔ Tu as vérifié, tu as gardé. "; }
		else { res = "mid"; d = Math.round(STAKE*.6); msg = "≈ Tu as gardé, mais sans vérifier : cette fois, c'était de la chance. "; }
		r.res = res === "mid" ? "ok" : res; r.gain = d; if(!r.pick) r.pick = 1;
		mark(res, 2);
		await wait(800);
		m.banner = RUMOUR.denial; play("chime"); moveAsset("lys", RUMOUR.back, 2.5);
		await wait(1500);
		setPnl(d, "Rumeur");
		say(msg + "Le démenti est tombé, l'action remonte. Sur les réseaux, une fausse nouvelle va plus vite qu'un communiqué.", 8000);
		learn(RUMOUR.courses);
		await wait(4000);
		S.phoneOn = false;
	}

	/* ---------- étape : le krach ---------- */
	function krach(){
		return new Promise(async done => {
			setClock(KRACH.clock); focus("R"); ev("stage", "Krach");
			const m = { kind:"krach", t:0, trace:[[0, 0, false]], hold:false, pos:0, prem:0, started:false, over:false, everHeld:false, heldLate:0 };
			R.mode = m; play("alarm");
			say(KRACH.keynes + "<br>L'indice décroche. <b>Maintiens le doigt sur l'écran</b> pour te couvrir, et lâche quand ça repart : la couverture se paie à la seconde.", 7500);
			await wait(2400); if(closed) return;
			m.started = true;
			const T = KRACH.path[KRACH.path.length - 1][0];
			let last = 0;
			const tk = dt => {
				if(m.over) return;
				m.t = Math.min(T, m.t + dt); const v = kIdx(m.t), dv = v - last; last = v;
				m.pos += KRACH.expo*dv*(m.hold ? 1 - KRACH.cover : 1);
				if(m.hold){ m.prem += KRACH.premium*dt; m.everHeld = true; if(m.t > 8.6) m.heldLate += dt; }
				m.trace.push([m.t, v, m.hold]);
				if(m.t >= T) end();
			};
			tickers.add(tk);
			inp = { down:() => { m.hold = true; play("clic"); }, up:() => { m.hold = false; }, key:(k, d) => { if(k === " " || k === "Enter") m.hold = d; } };
			async function end(){
				m.over = true; tickers.delete(tk); inp = null; m.hold = false;
				const res$ = Math.round(m.pos - m.prem);
				const res = res$ >= 2000 ? "ok" : res$ >= -1500 ? "mid" : "ko";
				mark(res, 3); S.hedge = res$;
				setPnl(res$, "Krach");
				say((res === "ok" ? "✔ Couvert pendant la chute, découvert pour le rebond : c'est exactement à ça que sert une couverture. " :
					!m.everHeld ? "✘ Sans couverture, tu as pris toute la chute. " :
					m.heldLate > 2 ? "✘ Tu es resté couvert trop longtemps : la prime t'a coûté plus que la chute, et tu as raté le rebond. " :
					"≈ Couverture tardive ou trop courte. ") + `Bilan : ${euro(res$)}, prime comprise.`, 8500);
				learn(KRACH.courses);
				await wait(5000); done();
			}
		});
	}

	/* ---------- étape : la start-up ---------- */
	function startup(){
		return new Promise(async done => {
			setClock(STARTUP.clock); focus("desk"); ev("stage", "Start-up");
			maxi.g.visible = true; maxi.g.position.set(-5.5, 0, -1.6); maxi.target = new THREE.Vector3(-2.05, 0, -1.15); maxi.face = .4;
			say("Maxime, un ancien du parcours Étudiant Créateur, vient lever des fonds. Écoute-le…", 4000);
			await wait(2600); if(closed) return;
			say(STARTUP.pitch, 5200, "max"); play("pop");
			await wait(3600); if(closed) return;
			focus("R");
			const fl = STARTUP.flows, r = (STARTUP.rf + STARTUP.prime)/100;
			const m = { kind:"npv", phase:"scrub", h:fl.slice(), done:fl.map((_, i) => i === 0), over:false, pick:0 };
			R.mode = m; S.npv = Math.round(van(fl, r));
			say("Avant de signer : <b>glisse le doigt sur les années</b>, de gauche à droite, pour les ramener à aujourd'hui.", 7000);
			const n = fl.length, bw = (SW - 100)/n;
			const tk = dt => { m.h = m.h.map((v, i) => { const goal = m.done[i] ? fl[i]/Math.pow(1 + r, i) : fl[i]; return lerp(v, goal, Math.min(1, dt*6)); }); };
			tickers.add(tk);
			function disc(i){ if(i < 1 || i >= n || m.done[i]) return; m.done[i] = true; play("pop"); if(m.done.every(Boolean)){ m.phase = "decide"; dr = null; play("chime"); say("Voilà ce que valent vraiment ses promesses aujourd'hui. Maxime attend : <b>tu investis ?</b>", 8000); } }
			let dr = null, lastI = null;
			const sweep = h => {          // un geste rapide saute des années : on actualise tout l'intervalle parcouru
				if(h.mon !== R) return; const i = clamp(Math.floor((h.x - 50)/bw), 0, n - 1);
				const a = lastI === null ? i : Math.min(lastI, i), b = lastI === null ? i : Math.max(lastI, i);
				for(let j = a; j <= b && m.phase === "scrub"; j++) disc(j);
				lastI = i;
			};
			inp = {
				down:h => { dr = { cy:h.cy }; lastI = null; if(m.phase === "scrub") sweep(h); },
				move:h => { if(m.phase === "scrub") sweep(h); else if(dr && Math.abs(h.cy - dr.cy) > 18){ decide(h.cy < dr.cy ? 1 : -1); dr = null; } },
				up:() => { dr = null; lastI = null; },
				key:(k, d) => { if(!d) return; if(m.phase === "scrub" && k === "ArrowRight") disc(m.done.indexOf(false)); else if(m.phase === "decide" && k === "ArrowUp") decide(1); else if(m.phase === "decide" && k === "ArrowDown") decide(-1); }
			};
			m.o = countdown(STARTUP.time, () => decide(0));
			async function decide(dir){
				if(m.over) return; m.over = true; m.o.stop(); inp = null; m.pick = dir;
				if(m.phase === "scrub"){ m.done = m.done.map(() => true); m.phase = "decide"; }
				const res = dir < 0 ? "ok" : "ko"; mark(res, 3);
				play(res === "ok" ? "good" : "bad");
				if(dir < 0){ say("✔ Bien vu : à 12 %, son projet détruit 28 000 € de valeur. Tu lui proposes de revenir avec une mise plus petite ou des ventes déjà signées.", 8500); say("D'accord… je reviens avec mes premiers contrats.", 4000, "max"); }
				else if(dir > 0){ say("✘ 400 000 € dans cinq ans ne valent pas 400 000 € aujourd'hui. À 12 %, ils en valent 272 000 : tu as payé 300 000 € pour 272 000 €.", 9000); say("Merci, on va tout déchirer !", 3500, "max"); }
				else say("✘ La cloche a sonné avant ta décision. En finance aussi, ne pas décider, c'est décider.", 7000);
				learn(STARTUP.courses);
				await wait(5200);
				tickers.delete(tk); maxi.target = new THREE.Vector3(-5.5, 0, -1.6);
				done();
			}
		});
	}

	/* ---------- étape : la clôture ---------- */
	function closing(){
		return new Promise(done => {
			setClock(CLOSE.clock); focus("R"); play("chime"); ev("stage", "Clôture");
			let v = 0; const pts = [{ v:0 }].concat(S.moments.map(mo => ({ v:(v += mo.d), d:mo.d, label:mo.label })));
			let worst = 1; pts.forEach((p, i) => { if(i && p.d < pts[worst].d) worst = i; });
			const m = { kind:"close", pts, worst, over:false, pick:0, sel:0, res:false }; R.mode = m;
			say("Dernier réflexe de la journée : <b>touche sur la courbe la décision qui t'a coûté le plus</b>. C'est par là qu'on progresse.", 7000);
			function choose(i){
				if(m.over) return; m.over = true; m.o.stop(); inp = null; m.pick = i; m.res = i === worst; S.bilan = m.res ? 1 : 0;
				play(m.res ? "good" : "bad"); if(!m.res) ev("err");
				say(m.res ? "✔ Bien lu. Le débrief, ça se fait chaque soir en salle des marchés, et dans ton rapport de stage." : `✘ Regarde le point le plus bas de la marche : c'est « ${pts[worst].label} ».`, 6000);
				learn(CLOSE.courses);
				wait(3600).then(done);
			}
			inp = {
				down:h => { if(h.mon !== R || !m.hit) return; let best = null, bd = 1e9; for(const [i, X] of m.hit){ const d = Math.abs(h.x - X); if(d < bd){ bd = d; best = i; } } if(best !== null && bd < 120) choose(best); },
				key:(k, d) => { if(!d) return; if(k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown"){ m.sel = m.sel % (pts.length - 1) + 1; play("clic"); } else if((k === " " || k === "Enter") && m.sel) choose(m.sel); }
			};
			m.o = countdown(CLOSE.time, () => choose(-1));
		});
	}

	/* ---------- déroulé ---------- */
	async function run(){
		L.mode = { kind:"idle" }; R.mode = { kind:"idle" };
		focus("desk");
		say("Bienvenue dans l'équipe ! Tu gères une ligne de <b>100 000 €</b> cet après-midi. Les nouvelles vont tomber vite.", 5000);
		await wait(3200); if(closed) return;
		await flash(FLASHES[0], true); if(closed) return;
		L.mode = { kind:"idle" };
		await flash(FLASHES[1], false); if(closed) return;
		await regression(); if(closed) return;
		await rumour(); if(closed) return;
		L.mode = { kind:"idle" };
		await krach(); if(closed) return;
		R.mode = { kind:"idle" };
		await startup(); if(closed) return;
		await closing(); if(closed) return;
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
		if(sized !== innerWidth + "x" + innerHeight) resize();      // fenêtre redimensionnée ou affichée après coup
		walk(dt, now/1000);
		camPos.lerp(camGoalP, Math.min(1, dt*3.2)); camLook.lerp(camGoalL, Math.min(1, dt*3.2));
		if(!isFinite(camPos.x + camLook.x)){ camPos.copy(camGoalP); camLook.copy(camGoalL); }
		camera.position.copy(camPos); camera.lookAt(camLook); camera.updateMatrixWorld();
		placePhone(dt, now/1000);
		drawScreens(dt);
		renderer.render(scene, camera);
		placeBubbles();
	}
	function tick(dt){
		const g = dt*SPEED;
		for(const o of [...timers]){
			o.t -= g;
			if(o.tick){ if(o.t <= 0){ timers.delete(o); o.onEnd(); } }
			else if(o.t <= 0){ timers.delete(o); o.r(); }
		}
		for(const f of [...tickers]) f(g);
		tickAssets(g);
	}
	function walk(dt, t){
		const p = maxi; if(!p.g.visible) return;
		const d = p.target.clone().sub(p.g.position); d.y = 0; const Lg = d.length();
		if(Lg > .02){ p.g.position.addScaledVector(d.normalize(), Math.min(Lg, dt*2.4*Math.min(SPEED, 3))); p.g.rotation.y = Math.atan2(d.x, d.z); p.g.position.y = Math.abs(Math.sin(t*10))*.05; }
		else { p.g.position.y = 0; if(p.face !== undefined) p.g.rotation.y += (p.face - p.g.rotation.y)*Math.min(1, dt*6); }
	}
	// le téléphone se lève dans le champ quand il vibre, et vient au centre quand on le maintient
	const tmpV = new THREE.Vector3(), right = new THREE.Vector3(), upV = new THREE.Vector3(), fwd = new THREE.Vector3();
	function placePhone(dt, t){
		if(!S.phoneUp){ phoneTo.p.copy(PHONE_DESK.p); phoneTo.q.copy(PHONE_DESK.q); }
		else {
			const vf = camera.fov*Math.PI/180, d = S.phoneUp === 2 ? .74 : .95;
			const vh = 2*d*Math.tan(vf/2), vw = vh*camera.aspect;
			camera.getWorldDirection(fwd); right.set(1, 0, 0).applyQuaternion(camera.quaternion); upV.set(0, 1, 0).applyQuaternion(camera.quaternion);
			const ox = S.phoneUp === 2 ? Math.min(vw*.25, vw/2 - .13) : vw/2 - .13, oy = S.phoneUp === 2 ? -.03 : -vh/2 + .34;
			phoneTo.p.copy(camera.position).addScaledVector(fwd, d).addScaledVector(right, ox).addScaledVector(upV, oy);
			if(S.phoneUp === 1 && !S.verified) phoneTo.p.addScaledVector(right, Math.sin(t*55)*.004);
			phoneTo.q.copy(camera.quaternion);
		}
		const k = Math.min(1, dt*8); phone.position.lerp(phoneTo.p, k); phone.quaternion.slerp(phoneTo.q, k);
	}
	function placeBubbles(){
		for(const b of Object.values(bubbles)){
			if(b.el.classList.contains("off")) continue;
			const head = b.who.g.position.clone(); head.y += 2.55;
			const s = toScreen(head);
			if(s.in && b.who.g.visible){ b.el.classList.remove("fix"); const half = Math.min(170, innerWidth/2 - 12); b.el.style.left = clamp(s.x, half + 12, innerWidth - half - 12) + "px"; b.el.style.top = Math.max(b.el.offsetHeight + 70, s.y) + "px"; }
			else { b.el.classList.add("fix"); b.el.style.left = "12px"; const ie = bubbles.ines.el; b.el.style.top = (b === bubbles.max && ie.classList.contains("fix") && !ie.classList.contains("off") ? 64 + ie.offsetHeight + 8 : 64) + "px"; }
		}
	}

	/* ---------- début, fin, fermeture ---------- */
	const ov = $("#ruOv"), card = $("#ruCard");
	function intro(){
		card.innerHTML = `<p class="k">Licence Économie-Finance · un après-midi de stage</p>
			<h2>La Ruée</h2>
			<p>14 h, une société de gestion lilloise. Tu es en stage de L3 et tu gères une ligne de 100 000 €. Inès, l'analyste qui t'encadre, est au bureau d'à côté. Les nouvelles vont tomber, vite.</p>
			<div class="ru-legend">
				<div><b>⇅</b>Glisse une ligne de l'écran : vers le haut, ça monte ; vers le bas, ça baisse.</div>
				<div><b>👆</b>Touche l'écran au bon moment.</div>
				<div><b>✋</b>Maintiens le doigt : sur le téléphone, sur l'écran pendant le krach.</div>
				<div><b>→</b>Glisse sur les années pour les ramener à aujourd'hui.</div>
			</div>
			<p>Gagner beaucoup en prenant trop de risques ne suffit pas pour la mention. Environ 4 minutes.</p>
			<button class="ru-go" data-a="start">Prendre son poste</button>`;
	}
	function finish(){
		S.phase = "done"; play("win");
		const score100 = Math.max(0, Math.round((S.max ? S.pts/S.max : 0)*90 + S.bilan*10));
		const mention = MENTIONS[score100 >= 85 ? 3 : score100 >= 65 ? 2 : score100 >= 45 ? 1 : 0];
		ev("win", mention);
		const rank = mention === "Très bien" ? "Inès veut te garder" : mention === "Bien" ? "Bon analyste junior" : mention === "Assez bien" ? "Analyste en devenir" : "À revoir avec Inès";
		card.innerHTML = `<p class="k">17 h 30 · la séance est close</p><div class="ru-big">${score100 >= 65 ? "📈" : "📋"}</div>
			<h2>${rank}</h2>
			<p>Mention <b>${mention}</b> (${score100} / 100). ${S.pnl > 0 && score100 < 65 ? "Tu finis en gain, mais la mention regarde aussi comment tu as décidé." : S.pnl <= 0 && score100 >= 65 ? "Peu de gain, mais de bonnes décisions : c'est ce qui paie sur la durée." : "Lire la surprise, vérifier la source, payer le risque au juste prix : c'est le métier."}</p>
			<div class="ru-stats"><div>Résultat du jour<b>${euro(S.pnl)}</b></div><div>Lignes dans le bon sens<b>${S.good} / ${S.rows}</b></div><div>Krach, prime comprise<b>${S.hedge === null ? "—" : euro(S.hedge)}</b></div><div>VAN de la start-up<b>${S.npv === null ? "—" : kEur(S.npv)}</b></div></div>
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
		if(a === "start" && S.phase === "intro"){ ov.hidden = true; S.phase = "play"; ev("start"); canvas.focus({ preventScroll:true }); run(); }
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openRuee({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	$(".ru-x").addEventListener("click", close);
	let pump = 0;      // ?vite : l'horloge du jeu avance même quand l'affichage est en pause (tests automatiques)
	if(SPEED > 1){ window.__ruee = { S, L, R, get inp(){ return inp; }, camera, renderer, scene, snap:() => { drawAcc = 1; show(1, performance.now()); } }; pump = setInterval(() => { if(!closed && !window.__ruee.pause) tick(.03); }, 30); }

	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.clear(); tickers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp);
		for(const b of Object.values(bubbles)) clearTimeout(b.off);
		[L.tex, R.tex, ptex, clkT].forEach(t => t.dispose());
		[L.scr, R.scr, pscr, clock, sky].forEach(m => { m.material.dispose(); m.geometry.dispose(); });      // les géométries du kit sont partagées avec le campus : on ne les libère pas
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss();
		root.remove();
		onClose && onClose();
	}

	intro();
	raf = requestAnimationFrame(frame);
}
