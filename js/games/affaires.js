/* « Le dossier Duval Textiles » — mini-jeu du Master Management des Banques et Institutions Financières (MBIF).
   Une seule question, du lundi au jeudi : en comité de crédit, prête-t-on 1,2 M€ à Duval Textiles (PME textile fictive
   de Roubaix) pour sa nouvelle ligne de production ? Le joueur, chargé d'affaires en alternance, instruit le dossier :
     1. lundi : entourer au doigt la ligne qui cloche dans la liasse fiscale ;
     2. lundi : calculer les ratios du comité sur la calculatrice, avec les chiffres lus dans la liasse ;
     3. mardi : visiter l'usine, compter les palettes, coller une pastille sur le stock invendable, lire la lettre de Volta ;
     4. mercredi : monter le prêt (durée, caution, Bpifrance, nantissement, condition) en voyant bouger les jauges ;
     5. mercredi : remonter l'actionnariat jusqu'aux bénéficiaires effectifs, puis noter le risque ;
     6. jeudi : devant le comité, répondre à chaque objection en montrant la pièce et la ligne qui le prouvent.
   Le dossier s'épaissit sur le bureau à chaque pièce. Environ 9 minutes. Contenus dans affaires-data.js. */
import * as THREE from "three";
import { makePerson, std, box, cyl } from "../kit.js?v=50ccfe85e2";
import { jpoCard } from "./jpo.js?v=50ccfe85e2";
import { palier } from "./palier.js?v=50ccfe85e2";
import { PRET, TAUX, CAF_PREV, SERVICE, VIE, PATRI, PROPRES, NANT, BPI_MAX, PAL, annuite, LIASSE, RATIOS, PALLETS, ORDERS, LETTER, ORG, RBE, GRID,
	PIECES, MEMBERS, objections, COURSES, NEXT } from "./affaires-data.js?v=50ccfe85e2";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a)*t;
const fr = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/ | /g, " ");
const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
const FX = 60, CX = -60, DY = .77;          // l'usine, la salle du comité ; hauteur du plateau du bureau
const NAVY = "#16324f", INK = "#1f2a36", GREY = "#66727e", RED = "#c0392b", GREEN = "#2e7d4f", GOLD = "#b8871b", PAPER = "#fbf9f4";

const CSS = `
.dv{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:${INK};background:#e7ebee;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation;animation:dvIn .3s ease both}
@keyframes dvIn{from{opacity:0}to{opacity:1}}
.dv canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.dv-top{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 6px calc(env(safe-area-inset-left) + 12px);z-index:5;pointer-events:none}
.dv-top>*{pointer-events:auto}
.dv-tag{background:#fff;border:1px solid #cdd6de;border-radius:6px;padding:6px 11px;font-weight:900;font-size:13px;white-space:nowrap;box-shadow:0 2px 6px rgba(20,35,55,.12)}
.dv-tag.n{background:${NAVY};border-color:${NAVY};color:#f1e6c8;font-family:Fraunces,Georgia,serif;font-weight:700}
.dv-tag.f{transition:transform .25s}
.dv-tag.f.pop{transform:scale(1.18)}
.dv-x{margin-left:auto;width:48px;height:48px;border-radius:50%;border:1px solid #cdd6de;background:#fff;font-size:24px;cursor:pointer;color:${INK};box-shadow:0 2px 6px rgba(20,35,55,.15)}
.dv-say{position:absolute;z-index:6;max-width:min(390px,calc(100% - 24px));transform:translate(-50%,-100%);transition:opacity .25s;cursor:pointer}
.dv-say.off{opacity:0;pointer-events:none}
.dv-say .b{background:#fff;border-left:5px solid ${NAVY};border-radius:6px;padding:9px 12px 7px;font-size:14.5px;line-height:1.42;box-shadow:0 6px 18px rgba(20,35,55,.22)}
.dv-say .who{display:block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:${GOLD};font-weight:900}
.dv-say .nx{display:block;text-align:right;font-size:11px;color:#97a2ad;font-weight:800}
.dv-say.fix{transform:none}
.dv-say.me .b{border-left-color:${GOLD}}
.dv-task{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 10px);z-index:5;background:${NAVY};color:#fff;border-radius:10px;padding:9px 14px;font-weight:800;font-size:14px;line-height:1.35;width:max-content;max-width:calc(100% - 24px);text-align:center;box-shadow:0 6px 18px rgba(20,35,55,.3);pointer-events:none}
.dv-task[hidden]{display:none}
.dv-task b{color:#f1d27a}
.dv-notes{position:absolute;right:calc(env(safe-area-inset-right) + 12px);bottom:calc(env(safe-area-inset-bottom) + 70px);z-index:5;display:flex;flex-direction:column-reverse;gap:8px;align-items:flex-end;pointer-events:none;max-width:min(270px,48%)}
.dv-note{background:#fff;border-radius:3px;border-top:4px solid ${GOLD};padding:6px 10px 8px;font-size:12.5px;font-weight:800;line-height:1.3;box-shadow:2px 4px 12px rgba(20,35,55,.2);animation:dvNote 4.4s ease both;background-image:repeating-linear-gradient(transparent 0 17px,#d6e4f0 17px 18px)}
.dv-note span{display:block;font-size:10px;color:${GOLD};letter-spacing:.06em;text-transform:uppercase}
@keyframes dvNote{0%{opacity:0;translate:0 14px}10%{opacity:1;translate:0 0}85%{opacity:1}100%{opacity:0}}
.dv-ov{position:absolute;inset:0;z-index:9;display:grid;place-items:center;padding:14px;background:rgba(15,25,40,.42)}
.dv-ov[hidden]{display:none}
.dv-card{max-width:580px;width:100%;max-height:100%;overflow:auto;background:${PAPER};border-radius:10px;border-top:6px solid ${NAVY};padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35);user-select:text;-webkit-user-select:text}
.dv-card h2{font:700 27px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px;color:${NAVY}}
.dv-card .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${GOLD};font-weight:900;margin:0 0 4px}
.dv-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.dv-q{background:#eef2f6;border-left:4px solid ${NAVY};padding:9px 12px;font:600 16px/1.4 Fraunces,Georgia,serif;color:${NAVY};margin:0 0 12px}
.dv-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0 12px}
.dv-legend div{background:#eef1f3;border-radius:8px;padding:7px 9px;font-size:13px;line-height:1.3}
.dv-legend b{font-size:18px;display:block}
.dv-go{display:block;width:100%;border:0;border-radius:10px;padding:12px;font:900 16px Nunito,sans-serif;background:${NAVY};color:#fff;cursor:pointer;min-height:48px;box-shadow:0 4px 0 #0b1c2e}
.dv-go:focus-visible{outline:3px solid #f1d27a}
.dv-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:${NAVY};background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:underline;min-height:44px}
.dv-stats{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
.dv-stats div{flex:1 1 120px;background:#eef1f3;border-radius:8px;padding:6px 9px;font-size:12px;font-weight:800;color:${GREY}}
.dv-stats b{display:block;font-size:17px;color:${INK}}
.dv-list{list-style:none;margin:0 0 10px;padding:0}
.dv-list li{background:#f1f3f5;border-radius:8px;padding:7px 9px;margin:5px 0;font-size:13px;line-height:1.35}
.dv-list li span{display:inline-block;background:${NAVY};color:#fff;border-radius:5px;padding:1px 6px;font-size:11px;font-weight:900;margin-right:5px}
.dv-list.next li{background:#fdf6e3}
.dv-big{font-size:46px;text-align:center;margin:0}
.dv-stamp{display:inline-block;border:3px solid currentColor;border-radius:6px;padding:3px 10px;font:900 15px Nunito,sans-serif;letter-spacing:.08em;transform:rotate(-4deg);margin:2px 0 10px}
.dv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media (max-width:640px){.dv-tag{font-size:12px;padding:5px 8px}.dv-tag.hide-s{display:none}.dv-say .b{font-size:13.5px}.dv-task{font-size:13px}.dv-notes{max-width:60%}}
@media (prefers-reduced-motion:reduce){.dv,.dv-note{animation:none}}
`;

export function openAffaires({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("dv-css")){ const st = document.createElement("style"); st.id = "dv-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "dv";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le dossier Duval Textiles");
	root.innerHTML = `<canvas tabindex="0" aria-label="Le bureau du chargé d'affaires"></canvas>
		<div class="dv-top"><span class="dv-tag n">Dossier Duval</span><span class="dv-tag" id="dvDay">Lundi 9 h</span><span class="dv-tag hide-s" id="dvWhere">Agence</span><span class="dv-tag f" id="dvFile">📁 0 pièce</span><button class="dv-x" aria-label="Quitter le jeu">×</button></div>
		<div class="dv-say off" id="dvSay" aria-live="polite"><div class="b"><span class="who"></span><span class="t"></span><span class="nx">toucher pour continuer ›</span></div></div>
		<div class="dv-task" id="dvTask" hidden></div>
		<div class="dv-notes" id="dvNotes"></div>
		<div class="dv-sr" id="dvSr" aria-live="assertive"></div>
		<div class="dv-ov" id="dvOv"><div class="dv-card" id="dvCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	let closed = false;

	/* ---------- état ---------- */
	const S = { phase:"intro", pts:0, max:0, learned:[], pieces:[], view:null, zoom:null,
		rv:[null, null, null, null], rs:[null, null, null, null], ri:-1,
		counted:new Set(), stick:new Set(), visitDone:false, dead:0,
		n:6, caution:0, conj:false, bpi:0, nant:false, volta:false, cov:0, effort:0, submitted:false,
		bo:{}, cell:null, el:null, elOk:null, rate:null, com:0, comMax:0, answers:[], accord:false };
	const trash = [];       // géométries, matériaux et textures créés ici (ceux du kit sont partagés avec le campus)
	const own = o => (trash.push(o), o);
	const mat = (c, o) => own(std(c, o));

	/* ---------- la scène ---------- */
	const canvas = $("canvas");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
	const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#dfe8ee");
	const camera = new THREE.PerspectiveCamera(42, 1, .03, 80);
	scene.add(new THREE.HemisphereLight("#fdfcf8", "#9d968a", 1.5));
	const sun = new THREE.DirectionalLight("#fff3e0", 1.6); sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-9, right:9, top:9, bottom:-9, near:1, far:30 }); sun.shadow.bias = -.0005;
	scene.add(sun, sun.target);
	function lightAt(x){ sun.position.set(x - 4, 10, 6); sun.target.position.set(x, 0, -1); }
	lightAt(0);

	const M = { floor:mat("#b7a07e"), wall:mat("#f2efe9"), oak:mat("#c9a77a"), leg:mat("#3b3a38"), black:mat("#1d2024"), paper:mat("#f4f1ea"), manila:mat("#d8b878"),
		sky:own(new THREE.MeshBasicMaterial({ color:"#cfe3f1" })), frame:mat("#5a5f66"), city:mat("#c3bcb1"), city2:mat("#aea79c"), plant:mat("#56804f"), pot:mat("#d9cbb5"),
		chair:mat("#2c3138"), navy:mat(NAVY), concrete:mat("#a8a59f"), brick:mat("#a2553b"), steel:mat("#8b9096"), orange:mat("#d9772b"), loom:mat("#5d7b74"),
		wood:mat("#b78f5a"), dust:mat("#9b968c"), dustTop:mat("#c9c2b4"), glass:own(new THREE.MeshBasicMaterial({ color:"#e3f0f7" })), yellow:mat("#e9c02b"),
		film:own(new THREE.MeshStandardMaterial({ color:"#ffffff", transparent:true, opacity:.22, roughness:.2, depthWrite:false })),
		bob:[mat("#3d6fb6"), mat("#e9e6df"), mat("#c2463a"), mat("#2f6b4f"), mat("#d6c7a6")], table:mat("#6e4f36"), board:mat("#fafafa"),
		hit:own(new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })) };
	const geo = g => own(g);

	// une étiquette ou un panneau dessiné
	function canvasPlane(parent, W, H, ww, draw, basic = true){
		const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
		const tex = own(new THREE.CanvasTexture(c)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = ANISO;
		const m = new THREE.Mesh(geo(new THREE.PlaneGeometry(ww, ww*H/W)), own(basic ? new THREE.MeshBasicMaterial({ map:tex, toneMapped:false }) : new THREE.MeshStandardMaterial({ map:tex, roughness:.9 })));
		parent.add(m); if(draw){ draw(x, W, H); tex.needsUpdate = true; }
		return { m, c, x, tex };
	}

	/* --- l'agence : le bureau du chargé d'affaires --- */
	box(scene, 14, .1, 12, M.floor, 0, -.1, 0).receiveShadow = true;
	box(scene, 14, .9, .2, M.wall, 0, 0, -3.2); box(scene, 14, .8, .2, M.wall, 0, 2.8, -3.2);
	const sky1 = new THREE.Mesh(geo(new THREE.PlaneGeometry(24, 7)), M.sky); sky1.position.set(0, 2.2, -7); scene.add(sky1);
	for(let x = -6.5; x <= 6.5; x += 1.3) box(scene, .07, 1.9, .1, M.frame, x, .9, -3.15, 0, false);
	box(scene, 14, .06, .1, M.frame, 0, 1.7, -3.15, 0, false);
	for(let i = 0; i < 16; i++){ const h = .5 + ((i*37) % 11)/9; box(scene, .8 + (i % 3)*.3, h, .4, i % 2 ? M.city : M.city2, -7.5 + i*1.05, .4, -5.6, 0, false); }
	box(scene, .3, 2.6, .3, M.city2, -2.2, .4, -5.5, 0, false);     // une cheminée d'usine roubaisienne au loin
	box(scene, .2, 3.6, 12, M.wall, -6, 0, 0); box(scene, .2, 3.6, 12, M.wall, 6, 0, 0);
	// le bureau
	box(scene, 2.9, .05, 1.3, M.oak, 0, DY - .05, 0);
	for(const dx of [-1.35, 1.35]) for(const dz of [-.55, .55]) box(scene, .06, DY - .05, .06, M.leg, dx, 0, dz, 0, false);
	box(scene, .6, .5, .6, M.chair, 0, 0, 1.25, 0, false);
	// l'écran : l'outil d'instruction de la banque
	box(scene, .3, .02, .2, M.black, .3, DY, -.42); box(scene, .05, .32, .05, M.black, .3, DY, -.47);
	const monG = new THREE.Group(); monG.position.set(.3, DY + .5, -.45); monG.rotation.x = -.1; scene.add(monG);
	box(monG, 1.08, .68, .04, M.black, 0, -.34, -.03);
	{ const sc = canvasPlane(monG, 800, 480, 1.04, (x, W, H) => { x.fillStyle = "#0f2236"; x.fillRect(0, 0, W, H); x.fillStyle = "#f1e6c8"; x.font = "700 64px Fraunces, Georgia, serif"; x.textAlign = "center"; x.fillText("Crédit des Flandres", W/2, 230); x.font = "800 30px Nunito, sans-serif"; x.fillStyle = "#8fa3b8"; x.fillText("Centre d'affaires de Roubaix", W/2, 290); }); sc.m.position.z = .001; }
	// la calculatrice
	box(scene, .34, .03, .48, M.black, 1.06, DY, .16);
	// une étagère de classeurs, une plante, le nom de la banque
	box(scene, 1.6, 2, .35, M.oak, -4.6, 0, -2.8);
	for(let i = 0; i < 9; i++) box(scene, .14, .34, .28, [M.navy, M.manila, M.frame][i % 3], -5.25 + i*.16, 1.02, -2.8, 0, false);
	cyl(scene, .3, .24, .5, M.pot, 4.6, 0, -2.4); { const p = new THREE.Mesh(geo(new THREE.IcosahedronGeometry(.55, 0)), M.plant); p.position.set(4.6, 1, -2.4); p.castShadow = true; scene.add(p); }
	{ const sg = canvasPlane(scene, 900, 160, 3, (x, W, H) => { x.fillStyle = NAVY; x.fillRect(0, 0, W, H); x.fillStyle = "#f1e6c8"; x.font = "700 64px Fraunces, Georgia, serif"; x.fillText("Crédit des Flandres", 40, 82); x.font = "800 34px Nunito, sans-serif"; x.fillText("Centre d'affaires de Roubaix", 42, 132); }, false); sg.m.position.set(0, 3.1, -3.08); }
	// le dossier Duval, qui s'épaissit à chaque pièce
	const folder = new THREE.Group(); folder.position.set(-1.18, DY, -.32); folder.rotation.y = .12; scene.add(folder);
	box(folder, .36, .006, .46, M.manila, 0, 0, 0);
	{ const t = canvasPlane(folder, 360, 120, .3, (x, W, H) => { x.fillStyle = "#d8b878"; x.fillRect(0, 0, W, H); x.fillStyle = NAVY; x.font = "900 44px Nunito, sans-serif"; x.fillText("DUVAL", 18, 56); x.font = "800 28px Nunito, sans-serif"; x.fillText("Textiles · crédit 1,2 M€", 18, 100); }, false);
		t.m.rotation.x = -Math.PI/2; t.m.position.set(0, .0075, .1); folder.userData.lab = t.m; }
	// Nadia, directrice du centre d'affaires
	const nadia = makePerson(scene, false, "pro"); nadia.g.position.set(1.95, 0, -1.05); nadia.g.rotation.y = -.7;

	/* --- l'usine Duval Textiles, à Roubaix --- */
	const fac = new THREE.Group(); fac.position.set(FX, 0, 0); scene.add(fac);
	box(fac, 26, .1, 18, M.concrete, 0, -.1, -1).receiveShadow = true;
	box(fac, 26, 5.2, .3, M.brick, 0, 0, -6); box(fac, .3, 5.2, 14, M.brick, -13, 0, -1); box(fac, .3, 5.2, 14, M.brick, 13, 0, -1);
	for(let x = -12; x <= 12; x += 3){ const r = box(fac, .2, .6, 14, M.steel, x, 4.9, -1, 0, false); r.rotation.z = .5; }
	for(let x = -10.5; x <= 12; x += 3){ const g = new THREE.Mesh(geo(new THREE.PlaneGeometry(1.6, 12)), M.glass); g.rotation.x = -Math.PI/2; g.rotation.y = .5; g.position.set(x, 5.6, -1); fac.add(g); }
	for(let i = 0; i < 4; i++){ const w = new THREE.Mesh(geo(new THREE.PlaneGeometry(1.4, 1.6)), M.glass); w.position.set(-9 + i*6, 3.4, -5.84); fac.add(w); }
	// les métiers à tisser, et la place de la nouvelle ligne
	for(let i = 0; i < 3; i++){
		const lx = 3.6 + i*2.9;
		box(fac, 2.2, 1.1, 1.3, M.loom, lx, 0, -3.8); box(fac, 2.3, .12, 1.4, M.steel, lx, 1.1, -3.8);
		const r1 = cyl(fac, .14, .14, 2.1, M.bob[i % 3], lx - 1.05, 1.42, -3.3, 12); r1.rotation.z = -Math.PI/2;
		const cl = new THREE.Mesh(geo(new THREE.PlaneGeometry(2, 1.1)), M.bob[(i + 1) % 5]); cl.rotation.x = -1.05; cl.position.set(lx, 1.25, -3.05); fac.add(cl);
	}
	for(const [w, d, x, z] of [[3.6, .08, 6.5, -.3], [3.6, .08, 6.5, 1.9], [.08, 2.2, 4.7, .8], [.08, 2.2, 8.3, .8]]) box(fac, w, .012, d, M.yellow, x, 0, z, 0, false);
	{ const fl = canvasPlane(fac, 760, 180, 2.6, (x, W, H) => { x.clearRect(0, 0, W, H); x.fillStyle = "#e9c02b"; x.font = "900 52px Nunito, sans-serif"; x.fillText("NOUVELLE LIGNE", 20, 70); x.font = "800 40px Nunito, sans-serif"; x.fillText("d'enduction · emplacement", 20, 140); });
		fl.m.material.transparent = true; fl.m.rotation.x = -Math.PI/2; fl.m.position.set(6.5, .02, .8); }
	// les racks et les 12 palettes
	const pallets = [];
	const bays = [-5.6, -2.4], levels = [0, 1.2];
	for(const bx of bays){
		for(const dx of [-1.55, 1.55]) for(const dz of [-.5, .5]) box(fac, .1, 2.3, .1, M.orange, bx + dx, 0, -3 + dz, 0, false);
		for(const dz of [-.5, .5]) box(fac, 3.2, .12, .08, M.orange, bx, 1.07, -3 + dz, 0, false);
		box(fac, 3.1, .04, 1, M.steel, bx, 1.14, -3, 0, false);
	}
	PALLETS.forEach((p, i) => {
		const g = new THREE.Group(), b = Math.floor(i/6), l = Math.floor((i % 6)/3), s = i % 3;
		g.position.set(bays[b] + (s - 1)*1.02, levels[l] + (l ? .04 : 0), -3); fac.add(g);
		box(g, .9, .12, .9, M.wood, 0, 0, 0);
		const bm = p[3] ? M.dust : M.bob[(i*2) % 5];
		for(let r = 0; r < 2; r++) for(let c = 0; c < 3; c++) cyl(g, .13, .13, .62, bm, -.3 + c*.3, .12, -.2 + r*.4, 10);
		box(g, .92, .64, .92, M.film, 0, .12, 0, 0, false);
		if(p[3]){ box(g, .93, .012, .93, M.dustTop, 0, .76, 0, 0, false); }
		const tag = canvasPlane(g, 320, 200, .5, null); tag.m.position.set(0, .44, .47); tag.m.visible = false;
		const hit = new THREE.Mesh(BOXGEO(), M.hit); hit.scale.set(1, .95, 1); hit.position.y = .45; hit.userData.pal = i; g.add(hit);
		pallets.push({ g, tag, hit, i, p });
	});
	function BOXGEO(){ return BOXGEO.g || (BOXGEO.g = geo(new THREE.BoxGeometry(1, 1, 1))); }
	const tagTxt = i => { const [c, r, d] = PALLETS[i]; return `${c} · ${r} · entrée ${d}`; };
	function drawTag(i){
		const P = pallets[i], x = P.tag.x, [client, ref, date, dead] = P.p, n = [...S.counted].indexOf(i) + 1;
		x.fillStyle = dead ? "#e9e4d8" : "#ffffff"; x.fillRect(0, 0, 320, 200);
		x.strokeStyle = "#333"; x.lineWidth = 4; x.strokeRect(2, 2, 316, 196);
		x.fillStyle = "#2a5db0"; x.font = "900 54px Nunito, sans-serif"; x.fillText(String(n), 16, 60);
		x.fillStyle = "#222"; x.font = "900 30px Nunito, sans-serif"; x.fillText(client, 82, 46);
		x.font = "800 24px Nunito, sans-serif"; x.fillText(ref, 18, 110); x.fillText("Entrée : " + date, 18, 150);
		x.fillStyle = "#666"; x.font = "800 20px Nunito, sans-serif"; x.fillText("150 k€ · inventaire", 18, 186);
		if(S.stick.has(i)){ x.fillStyle = "#d22f27"; x.beginPath(); x.arc(276, 150, 34, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "900 34px Nunito, sans-serif"; x.textAlign = "center"; x.fillText("✕", 276, 162); x.textAlign = "left"; }
		P.tag.tex.needsUpdate = true; P.tag.m.visible = true;
	}
	// le tableau des commandes, avec la lettre de Volta épinglée ; le pupitre de la fiche de visite
	box(fac, 2.7, 1.6, .06, M.frame, 1.3, .85, -5.8);
	box(fac, .62, .34, .5, M.wood, -4, 0, -1.35);
	// M. Duval
	const duval = makePerson(fac, false, "senior"); duval.g.position.set(2.6, 0, -2.3); duval.g.rotation.y = -.6;

	/* --- la salle du comité de crédit --- */
	const com = new THREE.Group(); com.position.set(CX, 0, 0); scene.add(com);
	box(com, 12, .1, 10, M.floor, 0, -.1, -1).receiveShadow = true;
	box(com, 12, 3.4, .2, M.wall, 0, 0, -4.2); box(com, .2, 3.4, 10, M.wall, -5, 0, -1); box(com, .2, 3.4, 10, M.wall, 5, 0, -1);
	{ const w = new THREE.Mesh(geo(new THREE.PlaneGeometry(1.6, 2.2)), M.sky); w.rotation.y = Math.PI/2; w.position.set(-4.88, 1.7, -1.5); com.add(w); }
	box(com, 5.2, .05, 2.1, M.table, 0, DY - .05, -1.15);
	for(const dx of [-2.4, 2.4]) for(const dz of [-1.9, -.4]) box(com, .08, DY - .05, .08, M.leg, dx, 0, dz, 0, false);
	{ const sc = canvasPlane(com, 1000, 420, 2.4, (x, W, H) => { x.fillStyle = "#1d2024"; x.fillRect(0, 0, W, H); x.fillStyle = "#f1e6c8"; x.font = "700 62px Fraunces, Georgia, serif"; x.fillText("Comité de crédit", 50, 120); x.font = "800 40px Nunito, sans-serif"; x.fillStyle = "#cfd8e0"; x.fillText("Jeudi 14 h · Duval Textiles · 1 200 k€", 50, 200); x.fillText("Rapporteur : le chargé d'affaires", 50, 260); x.fillText("Décision : accord / refus / ajournement", 50, 320); }); sc.m.position.set(0, 2.2, -4.08); }
	const members = {};
	[["lambert", -1.5], ["vasseur", 0], ["okafor", 1.5]].forEach(([id, x], i) => {
		box(com, .55, .48, .55, M.chair, x, 0, -2.75, 0, false);
		const p = makePerson(com, true, i === 1 ? "senior" : "pro"); p.g.position.set(x, 0, -2.75); members[id] = p;
	});

	/* ---------- les documents : des feuilles dessinées qu'on touche ---------- */
	const SH = {}, hits = [];
	function sheet(id, W, H, ww, paint){
		const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
		const tex = own(new THREE.CanvasTexture(c)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = ANISO;
		const m = new THREE.Mesh(geo(new THREE.PlaneGeometry(ww, ww*H/W)), own(new THREE.MeshBasicMaterial({ map:tex, toneMapped:false })));
		const s = { id, W, H, ww, wh:ww*H/W, c, x, tex, mesh:m, paint, ink:[], on:null, zones:{}, dirty:true };
		m.userData.sheet = s; hits.push(m); SH[id] = s;
		return s;
	}
	function flat(s, parent, x, y, z, ry = 0){ s.mesh.rotation.set(-Math.PI/2, 0, 0); s.mesh.rotateZ(ry); s.mesh.position.set(x, y, z); parent.add(s.mesh); }
	function redraw(s){
		const x = s.x; x.save(); s.paint(x, s); x.restore();
		for(const st of s.ink){
			if(st.pts.length < 2) continue;
			x.strokeStyle = st.col; x.globalAlpha = st.a || .85; x.lineWidth = st.w || 7; x.lineCap = x.lineJoin = "round";
			x.beginPath(); st.pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.globalAlpha = 1;
		}
		s.tex.needsUpdate = true; s.dirty = false;
	}
	const dirty = (...ids) => ids.forEach(id => SH[id] && (SH[id].dirty = true));

	// le crayon : rectangles arrondis, texte, paragraphes
	function rr(x, X, Y, W, H, r, fill, stroke, lw = 3){ x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); if(fill){ x.fillStyle = fill; x.fill(); } if(stroke){ x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } }
	function T(x, s, X, Y, size, col = INK, w = 700, al = "left", fam = "Nunito, system-ui, sans-serif"){ x.font = `${w} ${size}px ${fam}`; x.fillStyle = col; x.textAlign = al; x.textBaseline = "alphabetic"; x.fillText(s, X, Y); }
	function P(x, s, X, Y, maxW, size, col = INK, w = 700, lh = 1.25){
		x.font = `${w} ${size}px Nunito, system-ui, sans-serif`; let line = "", yy = Y;
		for(const wd of s.split(" ")){ const t = line ? line + " " + wd : wd; if(x.measureText(t).width > maxW && line){ T(x, line, X, yy, size, col, w); line = wd; yy += size*lh; } else line = t; }
		if(line) T(x, line, X, yy, size, col, w); return yy;
	}
	function paper(x, s, title, sub){
		x.fillStyle = PAPER; x.fillRect(0, 0, s.W, s.H); x.strokeStyle = "#d9d3c4"; x.lineWidth = 4; x.strokeRect(2, 2, s.W - 4, s.H - 4);
		T(x, title, 40, 58, 32, NAVY, 900); if(sub) T(x, sub, 40, 94, 22, GREY, 700);
		x.fillStyle = "#c9a227"; x.fillRect(40, 108, 90, 5);
	}
	const check = (x, X, Y, ok) => T(x, ok ? "✔" : "✘", X, Y, 34, ok ? GREEN : RED, 900, "center");

	/* -- la liasse fiscale -- */
	sheet("liasse", 1000, 800, .8, (x, s) => {
		paper(x, s, "LIASSE FISCALE SIMPLIFIÉE", "Duval Textiles SAS · Roubaix · en milliers d'euros (k€)");
		const cols = [700, 830, 960];
		["2023", "2024", "2025"].forEach((y, i) => T(x, y, cols[i], 142, 24, GREY, 900, "right"));
		let y = 152;
		for(const [id, lab, ...v] of LIASSE){
			if(!v.length){ x.fillStyle = "#e6ebf1"; x.fillRect(24, y, s.W - 48, 34); T(x, lab, 40, y + 25, 18, NAVY, 900); y += 34; continue; }
			s.zones[id] = [24, y, s.W - 24, y + 50];
			if(S.hl === id){ x.fillStyle = "#fff1b8"; x.fillRect(24, y, s.W - 48, 50); }
			T(x, lab, 40, y + 35, 25, INK, 700);
			v.forEach((n, i) => T(x, fr(n), cols[i], y + 35, 26, INK, 800, "right"));
			x.strokeStyle = "#e3ded2"; x.lineWidth = 2; x.beginPath(); x.moveTo(24, y + 50); x.lineTo(s.W - 24, y + 50); x.stroke();
			y += 50;
		}
	});
	/* -- la fiche de ratios -- */
	sheet("ratios", 1000, 720, .8, (x, s) => {
		paper(x, s, "FICHE DE RATIOS", "pour le comité de crédit · chiffres de la liasse");
		RATIOS.forEach((r, i) => {
			const y = 128 + i*146; s.zones[r.id] = [24, y, s.W - 24, y + 140];
			if(i === S.ri) rr(x, 24, y + 4, s.W - 48, 134, 10, "#eef4fb", "#9db8d6", 3);
			T(x, r.t, 44, y + 42, 27, NAVY, 900);
			T(x, "= " + r.f, 44, y + 80, 22, INK, 700);
			T(x, r.norm, 44, y + 116, 20, GOLD, 800);
			rr(x, 720, y + 26, 250, 88, 8, "#fff", S.rs[i] === "ok" ? GREEN : S.rs[i] ? RED : i === S.ri ? NAVY : "#cfd6dd", i === S.ri ? 4 : 3);
			if(S.rv[i] !== null) T(x, fr(S.rv[i], r.dec) + (r.unit ? " " + r.unit : ""), 845, y + 84, 36, S.rs[i] === "ok" ? GREEN : S.rs[i] ? "#a3341f" : INK, 900, "center");
			else if(i === S.ri) T(x, "↗ calculatrice", 845, y + 80, 22, GREY, 800, "center");
		});
	});
	/* -- la calculatrice -- */
	const KEYS = [["C", "⌫", "÷", "×"], ["7", "8", "9", "−"], ["4", "5", "6", "+"], ["1", "2", "3", "="], ["0", ",", "↗"]];
	const CALC = { cur:"", acc:null, op:null, hist:"", eq:false, flash:null, on:null };
	sheet("calc", 300, 456, .3, (x, s) => {
		x.fillStyle = "#23272d"; x.fillRect(0, 0, s.W, s.H);
		rr(x, 12, 12, 276, 108, 8, "#c9d8c1");
		T(x, CALC.hist.slice(-24), 278, 44, 20, "#3c4a37", 800, "right");
		T(x, CALC.cur || (CALC.acc !== null ? fmtN(CALC.acc) : "0"), 278, 100, 46, "#1b2418", 900, "right");
		KEYS.forEach((row, r) => row.forEach((k, c) => {
			const X = 12 + c*69, Y = 130 + r*64, W = k === "↗" ? 135 : 66;
			const col = k === "↗" ? "#c9a227" : /[÷×−+=]/.test(k) ? "#41566f" : k === "C" || k === "⌫" ? "#7a3a32" : "#3c4048";
			rr(x, X, Y, W, 58, 8, CALC.flash === k ? "#f1d27a" : col);
			T(x, k === "↗" ? "↗ Reporter" : k, X + W/2, Y + 40, k === "↗" ? 24 : 30, k === "↗" ? "#1b1b1b" : "#fff", 900, "center");
			s.zones["k" + k] = [X, Y, X + W, Y + 58];
		}));
	});
	const fmtN = v => !isFinite(v) ? "Erreur" : fr(v, Math.abs(v) < 10 ? 3 : Math.abs(v) < 1000 ? 2 : 1).replace(/,?0+$/, "").replace(/,$/, "");
	const num = s => parseFloat(s.replace(",", "."));
	const apply = (a, op, b) => op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a*b : b === 0 ? NaN : a/b;
	function calcKey(k){
		const C = CALC; C.flash = k; setTimeout(() => { C.flash = null; dirty("calc"); }, 140); play("clic");
		if(/[0-9]/.test(k)){ if(C.eq){ C.acc = null; C.hist = ""; C.eq = false; } if(C.cur.replace(/\D/g, "").length < 9) C.cur += k; C.hist += k; }
		else if(k === ","){ if(C.eq){ C.acc = null; C.hist = ""; C.eq = false; } if(!C.cur.includes(",")){ C.cur = (C.cur || "0") + ","; C.hist += ","; } }
		else if(k === "C"){ C.cur = ""; C.acc = null; C.op = null; C.hist = ""; C.eq = false; }
		else if(k === "⌫"){ if(C.cur){ C.cur = C.cur.slice(0, -1); C.hist = C.hist.slice(0, -1); } }
		else if("÷×−+".includes(k)){
			if(C.cur){ const b = num(C.cur); C.acc = C.op && C.acc !== null ? apply(C.acc, C.op, b) : b; C.cur = ""; }
			else if(C.acc === null) C.acc = 0;
			C.op = k; C.eq = false; C.hist = C.hist.replace(/ [÷×−+] $/, "") + " " + k + " ";
		}
		else if(k === "="){ if(C.op && C.cur){ C.acc = apply(C.acc, C.op, num(C.cur)); C.cur = ""; C.op = null; C.hist += " ="; C.eq = true; } }
		else if(k === "↗"){
			const v = C.cur ? (C.op && C.acc !== null ? apply(C.acc, C.op, num(C.cur)) : num(C.cur)) : C.acc;
			if(v === null || !isFinite(v)){ play("bad"); return; }
			if(C.on) C.on(v); else play("bad");
			C.cur = ""; C.acc = null; C.op = null; C.hist = ""; C.eq = false;
		}
		dirty("calc");
	}
	SH.calc.on = { down:p => { for(const [z, r] of Object.entries(SH.calc.zones)) if(p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]){ calcKey(z.slice(1)); return; } } };
	const calcValue = () => new Promise(r => { CALC.on = v => { CALC.on = null; r(v); }; });
	flat(SH.calc, scene, 1.06, DY + .033, .16);

	/* -- l'écran : la fiche de montage du prêt -- */
	const MT = { x0:70, x1:630, rows:{ duree:[400, 3, 12, 1], caution:[520, 0, 600, 25], bpi:[700, 0, BPI_MAX, 10] }, tog:{ conj:[566, 622], nant:[750, 806], volta:[810, 866] } };
	function montageCalc(){
		const a = annuite(S.n), cEff = S.conj ? S.caution : Math.min(S.caution, PROPRES);
		S.annuite = a; S.cEff = cEff;
		S.cov = Math.min(PRET, (S.nant ? NANT : 0) + S.bpi/100*PRET + cEff); S.covPct = S.cov/PRET*100;
		S.effort = (a + SERVICE)/CAF_PREV*100;
		const issues = [];
		if(S.n > VIE) issues.push(["duree", `Le prêt durerait ${S.n} ans, plus longtemps que la machine (${VIE} ans) : on rembourserait encore une ligne déjà usée.`]);
		if(S.effort > 55) issues.push(["effort", `Annuités trop lourdes : ${fr(S.effort)} % de la CAF prévisionnelle. Au-delà de 55 %, la trésorerie ne suit plus.`]);
		if(S.caution > PATRI) issues.push(["caution", `Caution de ${fr(S.caution)} k€ pour un patrimoine de ${PATRI} k€ : disproportionnée, un juge la réduirait (Code civil, art. 2300).`]);
		if(S.covPct < 70) issues.push(["cov", `Couverture de ${fr(S.covPct)} % seulement : pour ce risque, la banque veut au moins 70 % de garanties.`]);
		if(!S.volta) issues.push(["volta", "Rien ne protège la banque si Volta ne signe jamais : on débloquerait 1,2 M€ pour une ligne sans client."]);
		S.issues = issues; return issues;
	}
	const sheetMon = sheet("montage", 700, 1040, .54, (x, s) => {
		x.fillStyle = "#f4f6f8"; x.fillRect(0, 0, s.W, s.H); x.strokeStyle = "#1d2024"; x.lineWidth = 14; x.strokeRect(7, 7, s.W - 14, s.H - 14);
		x.fillStyle = NAVY; x.fillRect(14, 14, s.W - 28, 80); T(x, "OUTIL D'INSTRUCTION", 32, 48, 26, "#f1e6c8", 900); T(x, "Prêt Duval Textiles · 1 200 k€ · taux indicatif 4,2 %", 32, 80, 20, "#cfd8e0", 800);
		montageCalc();
		const slider = (id, label, val, marks) => {
			const [y, a, b] = MT.rows[id], X = v => MT.x0 + (v - a)/(b - a)*(MT.x1 - MT.x0);
			s.zones[id] = [20, y - 62, 680, y + 40];
			T(x, label, 32, y - 30, 26, INK, 900); T(x, val, 668, y - 30, 25, NAVY, 900, "right");
			rr(x, MT.x0, y - 6, MT.x1 - MT.x0, 12, 6, "#cfd6dd");
			T(x, String(a), MT.x0 - 14, y + 8, 17, GREY, 800, "right"); T(x, String(b), MT.x1 + 12, y + 8, 17, GREY, 800);
			for(const [v, t, c] of marks){ x.fillStyle = c; x.fillRect(X(v) - 2, y - 18, 4, 36); T(x, t, X(v), y + 38, 18, c, 800, "center"); }
			x.fillStyle = NAVY; x.beginPath(); x.arc(X(clamp(id === "duree" ? S.n : id === "caution" ? S.caution : S.bpi, a, b)), y, 20, 0, 7); x.fill();
		};
		const toggle = (id, label, on) => {
			const [y0, y1] = MT.tog[id]; s.zones[id] = [20, y0, 680, y1];
			rr(x, 32, y0 + 8, 68, 36, 18, on ? GREEN : "#b7c0c8"); x.fillStyle = "#fff"; x.beginPath(); x.arc(on ? 82 : 50, y0 + 26, 14, 0, 7); x.fill();
			P(x, label, 116, y0 + 22, 550, 21, INK, 800, 1.12);
		};
		const gauge = (y, label, v, ok, sub, okFn, id) => {
			s.zones[id] = [20, y - 34, 680, y + 70];
			T(x, label, 32, y - 10, 23, INK, 900); T(x, fr(v) + " %", 668, y - 10, 28, okFn(v) ? GREEN : RED, 900, "right");
			rr(x, 32, y, 636, 36, 7, "#dde3e8");
			const f = clamp(v/100, 0, 1), good = okFn(v);
			if(v > 0) rr(x, 32, y, Math.max(14, 636*f), 36, 7, good ? "#3f9a62" : "#d0573b");
			x.fillStyle = INK; x.fillRect(32 + 636*ok/100 - 2, y - 7, 4, 50);
			T(x, sub, 32, y + 62, 18, GREY, 800);
		};
		gauge(128, "Effort de remboursement", S.effort, 55, `annuités ÷ CAF prévue (${CAF_PREV} k€) · 55 % au plus`, v => v <= 55, "effort");
		gauge(240, "Couverture par les garanties", S.covPct, 70, `${fr(S.cov)} k€ couverts sur 1 200 · 70 % au moins`, v => v >= 70, "cov");
		x.fillStyle = "#d9dfe5"; x.fillRect(20, 322, 660, 3);
		slider("duree", "Durée", `${S.n} ans · annuité ${fr(S.annuite)} k€`, [[VIE, "vie de la machine", RED]]);
		slider("caution", "Caution de M. Duval", `${fr(S.caution)} k€`, [[PATRI, "son patrimoine net", RED]]);
		toggle("conj", "Accord écrit de Mme Duval à la caution (mariés sous la communauté)", S.conj);
		slider("bpi", "Garantie Bpifrance", `${S.bpi} % du prêt`, []);
		toggle("nant", `Nantissement de la nouvelle ligne (valeur retenue ${NANT} k€)`, S.nant);
		toggle("volta", "Condition suspensive : contrat Volta signé avant déblocage des fonds", S.volta);
		const warn = [];
		if(S.n > VIE) warn.push("⚠ Plus long que la vie de la machine");
		if(S.caution > PATRI) warn.push("⚠ Caution disproportionnée au patrimoine");
		if(S.caution > PROPRES && !S.conj) warn.push(`⚠ Sans l'accord de son épouse, la caution n'engage que ses biens propres : ${PROPRES} k€ retenus`);
		let y = 868;
		for(const w of warn.slice(0, 2)) y = P(x, w, 32, y, 636, 19, RED, 800, 1.12) + 28;
		s.zones.stamp = [32, 950, 668, 1026];
		rr(x, 32, 950, 636, 76, 12, S.submitted ? "#e7efe9" : NAVY);
		T(x, S.submitted ? "✔ Transmis au comité" : "Transmettre au comité ✍", 350, 1000, 28, S.submitted ? GREEN : "#fff", 900, "center");
	});
	flat(sheetMon, scene, .3, DY + .018, .1); sheetMon.mesh.visible = false;

	/* -- l'organigramme des actionnaires (KYC) -- */
	sheet("kyc", 1000, 780, .8, (x, s) => {
		paper(x, s, "QUI EST DERRIÈRE DUVAL TEXTILES ?", "statuts, Kbis et registre des titres · KYC");
		const N = ORG.nodes;
		for(const [a, b, pct] of ORG.edges){
			const [ax, ay] = N[a], [bx, by] = N[b];
			x.strokeStyle = "#8a97a6"; x.lineWidth = 5; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
			const mx = (ax + bx)/2, my = (ay + by)/2; rr(x, mx - 44, my - 24, 88, 44, 22, "#fff", "#8a97a6", 3); T(x, pct + " %", mx, my + 10, 26, NAVY, 900, "center");
		}
		if(S.trace){ const t = S.trace; x.strokeStyle = "rgba(240,190,40,.75)"; x.lineWidth = 22; x.lineCap = x.lineJoin = "round"; x.beginPath(); t.path.forEach((n, i) => { const [a, b] = N[n]; i ? x.lineTo(a, b) : x.moveTo(a, b); }); if(t.f) x.lineTo(t.f[0], t.f[1]); x.stroke(); }
		for(const [id, [X, Y, name, sub]] of Object.entries(N)){
			const done = S.bo[id] !== undefined, person = id === "jean" || id === "clara";
			rr(x, X - 130, Y - 42, 260, 84, 12, id === "dt" ? NAVY : done ? "#e6f3ea" : "#fff", id === "dt" ? NAVY : person ? GOLD : "#8a97a6", 4);
			T(x, name, X, Y - 4, 26, id === "dt" ? "#fff" : INK, 900, "center"); T(x, sub, X, Y + 26, 19, id === "dt" ? "#cfd8e0" : GREY, 800, "center");
		}
		let y = 660;
		for(const id of ["jean", "clara", "lys"]){
			if(S.bo[id] === undefined) continue;
			const v = S.bo[id], be = v > 25 && id !== "lys";
			s.zones[id] = [24, y - 32, s.W - 24, y + 10];
			T(x, id === "lys" ? `Lys Invest : 20 % en direct · une société, sous 25 %` : `${ORG.nodes[id][2]} : ${id === "jean" ? "60" : "40"} % × 80 % = ${fr(v)} %`, 44, y, 25, INK, 800);
			T(x, be ? "bénéficiaire effectif" : "", s.W - 44, y, 22, be ? GREEN : GREY, 900, "right");
			y += 42;
		}
	});
	/* -- l'extrait du registre des bénéficiaires effectifs -- */
	sheet("rbe", 1000, 560, .8, (x, s) => {
		paper(x, s, "REGISTRE DES BÉNÉFICIAIRES EFFECTIFS", "extrait · Duval Textiles SAS · RCS Lille Métropole 000 318 442 (fictif)");
		RBE.forEach(([id, t], i) => { const y = 150 + i*98; s.zones[id] = [24, y - 6, s.W - 24, y + 86]; rr(x, 30, y, s.W - 60, 84, 8, "#fff", "#e0dbcf", 2); const two = (x.font = "800 24px Nunito, sans-serif", x.measureText(t).width > s.W - 110); P(x, t, 50, y + (two ? 34 : 52), s.W - 110, 24, INK, 800, 1.15); });
	});
	/* -- la grille de notation -- */
	sheet("grille", 1000, 780, .8, (x, s) => {
		paper(x, s, "GRILLE DE NOTATION INTERNE", "cote de la banque (fictive) et probabilité de défaut à un an");
		const X0 = 300, Y0 = 200, CW = 225, RH = 100;
		T(x, "Endettement →", X0, 158, 21, GREY, 900); GRID.cols.forEach((c, j) => T(x, c, X0 + j*CW + CW/2, 188, 21, NAVY, 900, "center"));
		T(x, "Capacité de", 40, 176, 20, GREY, 900); T(x, "remboursement ↓", 40, 198, 20, GREY, 900);
		GRID.rows.forEach((r, i) => {
			T(x, r, 40, Y0 + i*RH + 60, 23, NAVY, 900);
			GRID.cells[i].forEach(([cote, pd], j) => {
				const X = X0 + j*CW, Y = Y0 + i*RH, sel = S.cell && S.cell[0] === i && S.cell[1] === j, good = i === GRID.good[0] && j === GRID.good[1];
				s.zones["c" + i + j] = [X, Y, X + CW, Y + RH];
				rr(x, X + 4, Y + 4, CW - 8, RH - 8, 8, sel ? (good ? "#e6f3ea" : "#fbe3dc") : "#fff", sel ? (good ? GREEN : RED) : "#d9d3c4", sel ? 5 : 2);
				T(x, "cote " + cote, X + CW/2, Y + 44, 26, INK, 900, "center"); T(x, "défaut " + fr(pd, pd < 1 ? 1 : 0) + " %", X + CW/2, Y + 76, 20, GREY, 800, "center");
			});
		});
		if(S.cell) s.zones.cell = s.zones["c" + S.cell[0] + S.cell[1]];
		const y = 560; s.zones.el = [24, y - 40, s.W - 24, y + 170];
		T(x, "Perte attendue = défaut × (prêt − garanties)", 40, y, 26, NAVY, 900);
		T(x, `= ${S.cell ? fr(GRID.cells[S.cell[0]][S.cell[1]][1], 1) + " %" : "?"} × (1 200 − ${fr(S.cov)}) =`, 40, y + 48, 26, INK, 800);
		rr(x, 690, y + 4, 270, 74, 8, "#fff", S.elOk === true ? GREEN : S.elOk === false ? RED : S.cell ? NAVY : "#cfd6dd", 4);
		if(S.el !== null) T(x, fr(S.el, 1) + " k€", 825, y + 56, 34, S.elOk ? GREEN : "#a3341f", 900, "center");
		else if(S.cell) T(x, "↗ calculatrice", 825, y + 52, 22, GREY, 800, "center");
		if(S.rate !== null){ T(x, `Taux client = ressource 3,0 % + risque ${fr(S.el/PRET*100, 2)} % + frais 0,6 % + marge 0,2 %`, 40, y + 120, 21, GREY, 800); T(x, `= ${fr(S.rate, 2)} %`, 40, y + 156, 26, GREEN, 900); }
	});
	/* -- la fiche de visite (sur le pupitre de l'usine) -- */
	sheet("visite", 700, 900, .44, (x, s) => {
		paper(x, s, "FICHE DE VISITE", "Duval Textiles · mardi 10 h");
		const n = S.counted.size, k = S.stick.size;
		s.zones.count = [24, 140, s.W - 24, 300];
		T(x, `Palettes comptées : ${n}`, 40, 180, 30, INK, 900);
		T(x, `× ${PAL} k€ (inventaire) = ${fr(n*PAL)} k€`, 40, 226, 26, INK, 800);
		T(x, "Stocks au bilan : 1 850 k€", 40, 270, 24, GREY, 800);
		if(!S.visitDone){
			T(x, `Pastilles rouges : ${k}`, 40, 350, 30, k ? RED : INK, 900);
			P(x, "Une pastille sur chaque palette qui ne se vendra pas.", 40, 400, 620, 22, GREY, 700);
			s.zones.sign = [40, 760, 660, 860];
			rr(x, 40, 760, 620, 100, 12, n === PALLETS.length ? NAVY : "#b7c0c8");
			T(x, "Signer la fiche ✍", 350, 824, 32, "#fff", 900, "center");
		} else {
			const live = PALLETS.length - S.dead;
			s.zones.live = [24, 320, s.W - 24, 420]; s.zones.dead = [24, 430, s.W - 24, 560]; s.zones.cp = [24, 570, s.W - 24, 700];
			P(x, `${live} palettes en rotation normale : ${fr(live*PAL)} k€`, 40, 360, 620, 26, GREEN, 900);
			P(x, `4 palettes Autolux invendables (client fermé) : 600 k€ à déprécier`, 40, 470, 620, 26, RED, 900);
			P(x, "Capitaux propres corrigés : 2 200 k€, endettement après prêt 0,95 (sous 1, de justesse)", 40, 610, 620, 22, INK, 800);
			T(x, "Vu sur place ✍", 640, 840, 34, NAVY, 700, "right", "Fraunces, Georgia, serif");
		}
	});
	/* -- le tableau de l'usine : carnet de commandes et lettre de Volta -- */
	sheet("volta", 1400, 820, 2.5, (x, s) => {
		x.fillStyle = "#fbfbfa"; x.fillRect(0, 0, s.W, s.H);
		T(x, "Carnet de commandes 2026 (k€)", 40, 74, 38, "#1b4f9c", 800, "left", "'Comic Sans MS', 'Segoe Print', cursive");
		ORDERS.forEach(([c, m, st], i) => { const y = 150 + i*84; T(x, c, 50, y, 34, "#222", 700, "left", "'Comic Sans MS', 'Segoe Print', cursive"); T(x, m, 540, y, 34, "#222", 700, "right", "'Comic Sans MS', 'Segoe Print', cursive"); T(x, st, 570, y, 30, st === "signé" ? "#2a7d3c" : "#c0392b", 700, "left", "'Comic Sans MS', 'Segoe Print', cursive"); });
		T(x, "Total signé : 6 600", 50, 520, 34, "#1b4f9c", 800, "left", "'Comic Sans MS', 'Segoe Print', cursive");
		T(x, "→ nouvelle ligne = Volta !!", 50, 600, 34, "#c0392b", 800, "left", "'Comic Sans MS', 'Segoe Print', cursive");
		// la lettre épinglée
		x.save(); x.shadowColor = "rgba(0,0,0,.25)"; x.shadowBlur = 18; x.shadowOffsetY = 6; x.fillStyle = "#fff"; x.fillRect(740, 30, 620, 760); x.restore();
		x.fillStyle = "#c0392b"; x.beginPath(); x.arc(1050, 46, 12, 0, 7); x.fill();
		T(x, "VOLTA MOBILITY GmbH", 780, 104, 30, "#0d5f6e", 900); T(x, "Stuttgart · Purchasing department", 780, 136, 20, GREY, 700);
		T(x, "LETTER OF INTENT", 780, 196, 26, INK, 900); T(x, "Dear Mr Duval,", 780, 240, 23, INK, 700);
		let y = 290;
		for(const [id, lines] of LETTER){ s.zones[id] = [760, y - 30, 1340, y + (lines.length - 1)*32 + 14]; lines.forEach((l, i) => T(x, l, 780, y + i*32, 23, INK, 700)); y += lines.length*32 + 22; }
		T(x, "Best regards,", 780, y + 20, 23, INK, 700); T(x, "K. Brandt, Head of Purchasing", 780, y + 54, 23, INK, 800);
	});

	// où se posent les documents
	const SLOT = { L:new THREE.Vector3(-.58, DY + .004, .14), C:new THREE.Vector3(.33, DY + .005, .14) };
	flat(SH.liasse, scene, SLOT.L.x, SLOT.L.y, SLOT.L.z, .03); SH.liasse.mesh.visible = false;
	for(const id of ["ratios", "kyc", "grille"]){ flat(SH[id], scene, SLOT.C.x, SLOT.C.y, SLOT.C.z, -.02); SH[id].mesh.visible = false; }
	flat(SH.rbe, scene, SLOT.L.x, SLOT.L.y + .001, SLOT.L.z, .02); SH.rbe.mesh.visible = false;
	{ const v = SH.visite.mesh; v.rotation.set(-Math.PI/2 + .45, 0, 0); v.position.set(-4, .48, -1.33); fac.add(v); }
	{ const v = SH.volta.mesh; v.position.set(1.3, 1.65, -5.76); fac.add(v); }

	/* ---------- la caméra : elle cadre ce qu'il faut regarder ---------- */
	const TOP = 66, BOT = 64;     // place des barres du haut et du bas
	const UP = new THREE.Vector3(0, 1, 0);
	function wpos(o){ o.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld); }
	function wnorm(o){ const q = new THREE.Quaternion(); o.getWorldQuaternion(q); return new THREE.Vector3(0, 0, 1).applyQuaternion(q); }
	const tilt = (n, t = .42) => n.clone().add(new THREE.Vector3(0, 0, t)).normalize();
	const VIEWS = {
		liasse:() => ({ c:wpos(SH.liasse.mesh), n:tilt(UP), w:1, h:.84 }),      // un peu de marge : la feuille inclinée grossit vers le bas, et la bulle de Nadia couvre le coin haut
		desk:() => camera.aspect < .9 ? { c:new THREE.Vector3(.57, DY, .14), n:tilt(UP), w:1.46, h:.7 } : { c:new THREE.Vector3(.18, DY, .14), n:tilt(UP), w:2.32, h:.72 },
		monitor:() => ({ c:wpos(SH.montage.mesh), n:tilt(UP, .3), w:.6, h:.9 }),
		sheet:id => () => { const m = SH[id].mesh, n = wnorm(m); return { c:wpos(m), n:n.y > .9 ? tilt(n) : n, w:SH[id].ww*1.08, h:SH[id].wh*1.08 }; },
		factory:() => ({ p:new THREE.Vector3(FX + 1.5, 3.8, 8.8), l:new THREE.Vector3(FX, 1.1, -2.4) }),
		racks:() => ({ c:new THREE.Vector3(FX - 4, .95, -2.5), n:new THREE.Vector3(0, .25, 1).normalize(), w:6.5, h:2.6 }),
		board:() => ({ c:wpos(SH.volta.mesh), n:new THREE.Vector3(0, 0, 1), w:2.6, h:1.5 }),
		committee:() => camera.aspect < .9 ? { p:new THREE.Vector3(CX, 4.3, 3.4), l:new THREE.Vector3(CX, 1.05, -1.2) } : { p:new THREE.Vector3(CX, 2.75, 3.0), l:new THREE.Vector3(CX, 1.2, -1.3) },
		present:() => { const m = PRES.mesh; return { c:wpos(m), n:wnorm(m), w:PRES.w*1.1, h:PRES.h*1.1 }; },
		agency:() => ({ p:new THREE.Vector3(0, 2.2, 3.2), l:new THREE.Vector3(0, .9, -.6) })
	};
	const camPos = new THREE.Vector3(0, 2.2, 3.2), camLook = new THREE.Vector3(0, .9, -.6), goalP = camPos.clone(), goalL = camLook.clone();
	function camGoal(){
		if(!innerWidth || !innerHeight || !isFinite(camera.aspect)) return;
		const fn = S.zoom || S.view; if(!fn) return;
		const v = fn();
		if(v.p){ goalP.copy(v.p); goalL.copy(v.l); return; }
		const vf = camera.fov*Math.PI/180, hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect);
		const free = 1 - (TOP + BOT)/innerHeight;
		const d = Math.max((v.w/2)/Math.tan(hf/2), (v.h/2)/(Math.tan(vf/2)*free));
		goalP.copy(v.c).addScaledVector(v.n, d);
		const u = UP.clone().addScaledVector(v.n, -v.n.dot(UP)); if(u.lengthSq() < 1e-4) u.set(0, 0, -1); u.normalize();
		goalL.copy(v.c).addScaledVector(u, (TOP - BOT)/innerHeight*d*Math.tan(vf/2));
	}
	function view(name, arg){ S.zoom = null; S.view = arg !== undefined ? VIEWS[name](arg) : VIEWS[name]; camGoal(); }
	function zoomOn(fn, id = "x"){ S.zoom = fn; S.zoomId = id; camGoal(); }
	let sized = "";
	function resize(){
		const w = innerWidth, h = innerHeight; if(!w || !h) return;
		renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = h > w ? 58 : 42; camera.updateProjectionMatrix();
		camGoal(); sized = w + "x" + h;
		if(!isFinite(camPos.x + camLook.x)){ camPos.copy(goalP); camLook.copy(goalL); }
	}
	resize(); addEventListener("resize", resize);
	const toScreen = v => { const p = v.clone().project(camera); return { x:(p.x + 1)/2*innerWidth, y:(1 - p.y)/2*innerHeight, in:p.z < 1 && Math.abs(p.x) < .92 && p.y < .82 && p.y > -.7 }; };

	/* ---------- horloge du jeu, animations ---------- */
	const timers = new Set(), tickers = new Set(), anims = new Set();
	function wait(ms){ return new Promise(r => { timers.add({ t:ms/1000, r }); }); }
	function anim(d, fn, done){ anims.add({ t:0, d, fn, done }); }
	function flyTo(o, toP, toS, d = .9, done){
		const p0 = o.position.clone(), s0 = o.scale.clone(), q0 = o.quaternion.clone(), q1 = arguments[5] || q0;
		anim(d, k => { const e = ease(k); o.position.lerpVectors(p0, toP, e); o.scale.lerpVectors(s0, toS, e); o.quaternion.slerpQuaternions(q0, q1, e); o.position.y += Math.sin(Math.PI*e)*.12; }, done);
	}

	/* ---------- dialogues, consignes, fiches de cours ---------- */
	const people = { nadia:[nadia, "Nadia, directrice du centre d'affaires"], duval:[duval, "M. Duval, dirigeant"], lambert:[members.lambert, MEMBERS.lambert], vasseur:[members.vasseur, MEMBERS.vasseur], okafor:[members.okafor, MEMBERS.okafor], me:[null, "Toi"] };
	const bubble = $("#dvSay"); let speaker = null, skip = null;
	function say(who, html){
		speaker = who; bubble.classList.toggle("me", who === "me");
		bubble.querySelector(".who").textContent = people[who][1]; bubble.querySelector(".t").innerHTML = html;
		bubble.classList.remove("off"); $("#dvSr").textContent = html.replace(/<[^>]+>/g, ""); placeBubble();
	}
	const hush = () => { bubble.classList.add("off"); speaker = null; };
	function talk(who, html, min = 0){
		say(who, html);
		const ms = Math.max(min, clamp(html.replace(/<[^>]+>/g, "").length*52, 2600, 10500));
		return new Promise(r => { let done = false; const end = () => { if(done) return; done = true; skip = null; r(); }; skip = end; wait(ms).then(end); });
	}
	bubble.addEventListener("click", () => { if(skip){ play("clic"); skip(); } });
	function task(html){ const t = $("#dvTask"); if(!html){ t.hidden = true; return; } t.innerHTML = html; t.hidden = false; }
	function setDay(d, w){ $("#dvDay").textContent = d; $("#dvWhere").textContent = w; }
	function learn(keys){
		for(const k of keys){
			if(S.learned.includes(k)) continue; S.learned.push(k);
			const c = COURSES[k], el = document.createElement("div"); el.className = "dv-note"; el.innerHTML = `<span>${c[0]} · au programme</span>${c[1]}`;
			const b = $("#dvNotes"); b.appendChild(el); while(b.children.length > 3) b.firstChild.remove(); setTimeout(() => el.remove(), 4500);
		}
	}
	function mark(res, w){ S.max += w; S.pts += res === "ok" ? w : res === "mid" ? w/2 : 0; }
	const resOf = tries => tries <= 1 ? "ok" : tries === 2 ? "mid" : "ko";

	// le dossier s'épaissit
	const stack = [];
	function addPiece(id){
		if(S.pieces.includes(id)) return; S.pieces.push(id);
		const n = S.pieces.length, sh = box(folder, .34, .012, .44, M.paper, ((n*7) % 5 - 2)*.006, .006 + (n - 1)*.012, ((n*3) % 5 - 2)*.005, ((n*11) % 7 - 3)*.012, false);
		stack.push(sh); folder.userData.lab.position.y = .0075 + n*.012 + .002;
		const f = $("#dvFile"); f.textContent = `📁 ${n} pièce${n > 1 ? "s" : ""}`; f.classList.add("pop"); setTimeout(() => f.classList.remove("pop"), 300);
		play("pop");
	}
	// une feuille du bureau rejoint le dossier
	function file(id){
		const m = SH[id].mesh; if(!m.visible || m.parent !== scene){ addPiece(id); return Promise.resolve(); }
		const to = folder.position.clone(); to.y += .02 + S.pieces.length*.012;
		return new Promise(r => flyTo(m, to, new THREE.Vector3(.4, .4, .4), .8, () => { m.visible = false; m.scale.set(1, 1, 1); addPiece(id); r(); }));
	}

	/* ---------- les gestes : du doigt aux objets 3D ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	const shown = o => { for(; o; o = o.parent) if(!o.visible) return false; return true; };
	let cap = null;        // l'objet qui a reçu le doigt
	const palHandler = { down:null };
	function pick(e, only){
		ndc.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ndc, camera);
		const list = only ? [only] : hits.concat(pallets.map(p => p.hit)).filter(shown);
		const h = ray.intersectObjects(list, false)[0]; if(!h) return null;
		const s = h.object.userData.sheet;
		return { obj:h.object, s, pal:h.object.userData.pal, x:s && h.uv ? h.uv.x*s.W : 0, y:s && h.uv ? (1 - h.uv.y)*s.H : 0, cx:e.clientX, cy:e.clientY };
	}
	function handlerOf(p){ if(p.pal !== undefined) return palHandler; const s = p.s; return s.on || (s.ref ? refHandler(s) : null); }
	const refHandler = s => ({ down:() => { play("clic"); const z = VIEWS.sheet(s.id); if(S.zoom && S.zoomId === s.id){ S.zoom = null; S.zoomId = null; } else { S.zoom = z; S.zoomId = s.id; } camGoal(); } });
	canvas.addEventListener("pointerdown", e => {
		if(S.phase !== "play") return;
		const p = pick(e);
		if(!p){ if(S.zoom && S.zoomId){ S.zoom = null; S.zoomId = null; camGoal(); } return; }
		const h = handlerOf(p); if(!h) { if(S.zoom && S.zoomId){ S.zoom = null; S.zoomId = null; camGoal(); } return; }
		try { canvas.setPointerCapture(e.pointerId); } catch(_){}
		cap = { id:e.pointerId, obj:p.obj, h, last:p }; h.down && h.down(p);
	});
	canvas.addEventListener("pointermove", e => { if(!cap || e.pointerId !== cap.id) return; const p = pick(e, cap.obj); if(p){ cap.last = p; cap.h.move && cap.h.move(p); } });
	const upH = e => { if(!cap || e.pointerId !== cap.id) return; const c = cap; cap = null; const p = pick(e, c.obj) || c.last; c.h.up && c.h.up(p); };
	canvas.addEventListener("pointerup", upH); canvas.addEventListener("pointercancel", upH);
	function onKey(e){
		if(e.key === "Escape"){ close(); return; }
		if(S.phase !== "play" || !CALC.on) return;
		const k = { "*":"×", "x":"×", "/":"÷", "-":"−", "+":"+", "Enter":"=", "=":"=", "Backspace":"⌫", ".":",", ",":",", "Delete":"C", "r":"↗", "R":"↗" }[e.key] || (/^[0-9]$/.test(e.key) ? e.key : null);
		if(k){ e.preventDefault(); calcKey(k); }
	}
	document.addEventListener("keydown", onKey);

	// entourer au doigt : renvoie la zone entourée (ou soulignée)
	function circle(s, ids, col = "#c0392b"){
		return new Promise(res => {
			let st = null;
			s.on = {
				down:p => { st = { pts:[[p.x, p.y]], col, w:7 }; s.ink.push(st); s.dirty = true; },
				move:p => { if(!st) return; const l = st.pts[st.pts.length - 1]; if(Math.hypot(p.x - l[0], p.y - l[1]) > 4){ st.pts.push([p.x, p.y]); s.dirty = true; } },
				up:() => {
					if(!st) return; const pts = st.pts; let len = 0;
					for(let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
					const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), cy = (y0 + y1)/2;
					let best = null, bd = 1e9;
					for(const id of ids){ const z = s.zones[id]; if(!z) continue; const zc = (z[1] + z[3])/2, ov = Math.min(x1, z[2]) - Math.max(x0, z[0]);
						if(zc < y0 - 14 || zc > y1 + 14 || ov < (z[2] - z[0])*.25) continue; const d = Math.abs(zc - cy); if(d < bd){ bd = d; best = id; } }
					const stroke = st; st = null;
					if(len < 70 || !best){ s.ink.splice(s.ink.indexOf(stroke), 1); s.dirty = true; say("nadia", "Entoure (ou souligne) une ligne entière, d'un seul trait de doigt."); return; }
					s.on = null; res({ z:best, stroke });
				}
			};
		});
	}
	// un geste « tracé » propre pour les tests et le clavier : une ellipse autour d'une zone
	const ellipse = z => { const pts = [], cx = (z[0] + z[2])/2, cy = (z[1] + z[3])/2, rx = (z[2] - z[0])/2, ry = (z[3] - z[1])/2 + 6; for(let a = 0; a <= 6.4; a += .25) pts.push([cx + Math.cos(a)*rx, cy + Math.sin(a)*ry]); return pts; };
	const okInk = (st, good) => { st.col = good === true ? GREEN : good === "mid" ? "#d68a1c" : "#9aa3ad"; st.a = good === true ? .9 : .6; };

	/* ================= 1. lundi 9 h : la liasse ================= */
	async function stepLiasse(){
		ev("stage", "Liasse"); setDay("Lundi 9 h", "Agence"); lightAt(0);
		SH.liasse.mesh.visible = true; dirty("liasse"); view("agency");
		await talk("nadia", "Duval Textiles, 42 salariés, nous demande <b>1,2 M€</b>. Jeudi, c'est toi qui défends son dossier au comité de crédit : prête-t-on, oui ou non ?");
		if(closed) return;
		view("liasse");
		await talk("nadia", "On commence toujours par les comptes. Voici sa liasse fiscale : trois ans de chiffres. <b>Entoure au doigt la ligne qui cloche.</b>", 4200);
		task("✍ Entoure au doigt la ligne <b>anormale</b> de la liasse");
		let tries = 0;
		const ids = LIASSE.filter(r => r.length > 2).map(r => r[0]);
		for(;;){
			const { z, stroke } = await circle(SH.liasse, ids); if(closed) return;
			tries++;
			if(z === "stk"){ okInk(stroke, true); play("good"); break; }
			ev("err"); play("bad");
			if(z === "tre"){ okInk(stroke, "mid"); await talk("nadia", "Bien vu, la trésorerie fond : 420, puis 90. Mais c'est une <b>conséquence</b>. L'argent est coincé quelque part : où ?"); }
			else { okInk(stroke, false); await talk("nadia", tries === 1 ? "Ça, c'est normal. Compare chaque ligne au chiffre d'affaires : lui ne bouge presque pas (+3 % en deux ans). Quelle ligne s'envole ?" : "Regarde les stocks : 900, 1 250, 1 850. Le double en deux ans, pour les mêmes ventes."); }
			if(closed) return;
			if(tries >= 3){ S.hl = "stk"; const st = { pts:ellipse(SH.liasse.zones.stk), col:GREEN, w:7 }; SH.liasse.ink.push(st); dirty("liasse"); break; }
		}
		    // les essais ratés comptent dans la note ci-dessous, pas deux fois
		mark(resOf(tries), 2); task(null);
		await talk("nadia", "Les <b>stocks</b> ont doublé en deux ans alors que les ventes stagnent. Du fil qui dort dans l'usine, c'est de l'argent qui ne rentre pas : voilà pourquoi la trésorerie fond.");
		learn(["af", "crea", "marche"]);
	}

	/* ================= 2. lundi 11 h : les ratios ================= */
	async function stepRatios(){
		ev("stage", "Ratios"); setDay("Lundi 11 h", "Agence");
		SH.ratios.mesh.visible = true; S.ri = 0; dirty("ratios", "calc"); SH.liasse.ref = true;
		view("desk");
		await talk("nadia", "Le comité regarde quatre ratios. <b>Lis les chiffres dans la liasse et tape-les sur la calculatrice</b>, puis la touche <b>↗ Reporter</b> les écrit sur la fiche.", 5000);
		if(closed) return;
		for(let i = 0; i < RATIOS.length; i++){
			const r = RATIOS[i]; S.ri = i; dirty("ratios");
			task(`🧮 <b>${r.t}</b> = ${r.f}${camera.aspect < .9 ? "<br>(touche la liasse pour la lire de près)" : ""}`);
			let tries = 0;
			for(;;){
				const v = await calcValue(); if(closed) return;
				tries++; S.rv[i] = v;
				if(Math.abs(v - r.v) <= r.tol){ S.rs[i] = "ok"; dirty("ratios"); play("good"); break; }
				S.rs[i] = "ko"; dirty("ratios"); play("bad");
				if(tries >= 3){ S.rv[i] = r.v; S.rs[i] = "ok"; dirty("ratios"); await talk("nadia", `Je te le note : ${fr(r.v, r.dec)}${r.unit ? " " + r.unit : ""}. ${r.hint}`); break; }
				await talk("nadia", tries === 1 ? `Ce n'est pas ça (${fmtN(v)}). Relis bien la liasse : quelle ligne, quelle année ?` : r.hint);
				if(closed) return;
				S.rs[i] = null; dirty("ratios");
			}
			mark(resOf(tries), 1);
			if(i === 0) await talk("nadia", `<b>${fr(r.v)} jours</b> de stock, contre 53 en 2023 : le fil reste deux fois plus longtemps dans l'usine.`);
			if(i === 1) await talk("nadia", "<b>0,75</b> : la banque prêterait 75 centimes pour chaque euro des associés. Sous 1, ça passe.");
			if(closed) return;
		}
		S.ri = -1; dirty("ratios"); task(null); S.zoom = null;
		await talk("nadia", "<b>4 ans</b> pour tout rembourser avec la CAF : pile à la limite. Le dossier tient… si ce stock existe vraiment et se vend. Demain, on va voir sur place.");
		learn(["math", "besoins"]);
		SH.liasse.ref = false;
		await file("liasse"); await file("ratios");
	}

	/* ================= 3. mardi 10 h : la visite de l'usine ================= */
	async function stepVisite(){
		ev("stage", "Visite"); setDay("Mardi 10 h", "Usine Duval, Roubaix"); lightAt(FX);
		nadia.g.position.set(FX + .9, 0, -.4); nadia.g.rotation.y = -.5;
		view("factory");
		await talk("duval", "Bienvenue chez Duval Textiles ! 42 salariés, du tissu technique pour les sièges de voiture. Depuis qu'<b>Autolux</b> a fermé son usine de Douai, on s'est recentrés sur nos autres clients.");
		if(closed) return;
		await talk("duval", "Et là, le marquage jaune : c'est la place de la nouvelle ligne d'enduction. Avec elle, on attaque l'électrique !");
		if(closed) return;
		view("racks");
		await talk("nadia", "Le bilan dit 1 850 k€ de stocks. Vérifions : <b>touche chaque palette pour la compter</b>.", 3600);
		task(`📦 Compte les palettes : <b>0</b> / ?`);
		await new Promise(res => {
			palHandler.down = p => {
				if(S.counted.has(p.pal)) return;
				S.counted.add(p.pal); drawTag(p.pal); play("pop"); dirty("visite");
				task(`📦 Palettes comptées : <b>${S.counted.size}</b><br>n° ${S.counted.size} · ${tagTxt(p.pal)}`);
				if(S.counted.size === PALLETS.length){ palHandler.down = null; res(); }
			};
		});
		if(closed) return;
		await talk("duval", "Douze palettes à 150 k€ : 1,8 million. Tout est là, comme au bilan !");
		if(closed) return;
		await talk("nadia", "Les chiffres collent. Mais un stock ne vaut que s'il se vend. <b>Lis les étiquettes</b> et colle une pastille rouge sur chaque palette qui ne se vendra pas, puis <b>signe ta fiche de visite</b>.", 5200);
		task("🔴 Pastille sur les palettes invendables, puis signe la fiche de visite");
		let tries = 0;
		for(;;){
			const res = await new Promise(r => {
				palHandler.down = p => { if(S.stick.has(p.pal)) S.stick.delete(p.pal); else S.stick.add(p.pal); drawTag(p.pal); play("clic"); dirty("visite"); task(`🔴 ${S.stick.has(p.pal) ? "Pastille sur" : "Pastille retirée :"} n° ${[...S.counted].indexOf(p.pal) + 1} · ${tagTxt(p.pal)}<br>puis signe la fiche de visite`); };
				SH.visite.on = { down:p => { const z = SH.visite.zones.sign; if(z && p.x >= z[0] && p.x <= z[2] && p.y >= z[1] && p.y <= z[3]){ r(true); } else zoomOn(VIEWS.sheet("visite"), "visite"); } };
			});
			if(closed || !res) return;
			tries++;
			const dead = new Set(PALLETS.map((p, i) => p[3] ? i : -1).filter(i => i >= 0));
			const wrongOn = [...S.stick].filter(i => !dead.has(i)), missed = [...dead].filter(i => !S.stick.has(i));
			if(!wrongOn.length && !missed.length){ play("good"); break; }
			ev("err"); play("bad"); S.zoom = null; camGoal();
			if(wrongOn.length) await talk("duval", `Hé ! La palette ${[...S.counted].indexOf(wrongOn[0]) + 1}, c'est pour ${PALLETS[wrongOn[0]][0]} : elle part dans quinze jours !`);
			else await talk("nadia", tries === 1 ? "Il en reste. Qu'a dit M. Duval en arrivant ? Quel client a fermé son usine ? Regarde aussi les dates d'entrée… et la poussière." : "Toutes les palettes Autolux : ce client n'existe plus, personne n'achètera ce fil noir AX-17.");
			if(closed) return;
			if(tries >= 3){ S.stick = dead; pallets.forEach(p => drawTag(p.i)); break; }
		}
		palHandler.down = null; SH.visite.on = null; S.dead = 4; S.visitDone = true; dirty("visite"); S.zoom = null;
		mark(resOf(tries), 2); task(null);
		zoomOn(VIEWS.sheet("visite"));
		await talk("nadia", "Quatre palettes Autolux, <b>600 k€ de stock mort</b>. Il faut les déprécier : les capitaux propres tombent à 2,2 M€, l'endettement monte à 0,95. Toujours sous 1… de justesse.");
		if(closed) return;
		await talk("duval", "Bon… je les gardais au cas où. Venez voir pourquoi j'ai besoin de cette ligne !");
		if(closed) return;
		learn(["risqpme", "conj"]);
		view("board");
		await talk("duval", "<b>Volta Mobility</b>, un constructeur électrique allemand : 1,6 million par an ! La lettre est arrivée la semaine dernière.");
		if(closed) return;
		await talk("nadia", "La lettre est en anglais, comme souvent. <b>Entoure la phrase qui doit inquiéter la banque.</b>", 3800);
		task("✍ Entoure dans la lettre de Volta la phrase qui inquiète");
		tries = 0;
		for(;;){
			const { z, stroke } = await circle(SH.volta, LETTER.map(l => l[0])); if(closed) return;
			tries++;
			if(z === "z4" || z === "z3"){ okInk(stroke, true); play("good"); break; }
			ev("err"); play("bad"); okInk(stroke, false);
			await talk("nadia", tries === 1 ? "Ça, c'est de la politesse ou une promesse. Cherche ce qui dit que <b>rien n'est encore acheté</b>." : "« non-binding » : la lettre n'engage pas Volta. Ce n'est pas une commande.");
			if(closed) return;
			if(tries >= 3){ SH.volta.ink.push({ pts:ellipse(SH.volta.zones.z4), col:GREEN, w:7 }); dirty("volta"); break; }
		}
		mark(resOf(tries), 1); task(null);
		await talk("nadia", "Exactement : une <b>lettre d'intention</b>, pas une commande. Volta veut d'abord tester les échantillons. Si la banque finance la ligne et que Volta ne signe pas… Garde ça en tête pour le montage.");
		learn(["ang"]);
		addPiece("visite"); addPiece("volta");
	}

	/* ================= 4. mercredi 9 h : le montage du prêt ================= */
	async function stepMontage(){
		ev("stage", "Montage"); setDay("Mercredi 9 h", "Agence"); lightAt(0);
		nadia.g.position.set(1.95, 0, -1.05); nadia.g.rotation.y = -.7;
		SH.montage.mesh.visible = true; view("monitor"); dirty("montage");
		await talk("nadia", "Place au montage. Règle la <b>durée</b> et les <b>garanties</b> en regardant les deux jauges : le remboursement doit rester supportable, et la banque doit être couverte si ça tourne mal.", 6000);
		if(closed) return;
		await talk("nadia", "La fiche patrimoniale : M. Duval a <b>350 k€</b> de patrimoine net, il est marié <b>sous la communauté</b>. Bpifrance peut garantir jusqu'à <b>50 %</b>.", 5200);
		if(closed) return;
		task("🎚 Règle durée et garanties, puis <b>transmets au comité</b>");
		const s = SH.montage;
		let tries = 0;
		for(;;){
			const done = await new Promise(r => {
				let drag = null, moved = 0, down = null;
				const setFromX = (id, px) => { const [, a, b, st] = MT.rows[id]; const v = clamp(Math.round((a + (px - MT.x0)/(MT.x1 - MT.x0)*(b - a))/st)*st, a, b);
					const key = id === "duree" ? "n" : id; if(S[key] !== v){ S[key] = v; play("clic"); dirty("montage"); } };
				s.on = {
					down:p => {
						down = p; moved = 0; drag = null;
						for(const id of Object.keys(MT.rows)){ const y = MT.rows[id][0]; if(p.x > 20 && p.x < 690 && Math.abs(p.y - y) < 30){ drag = id; setFromX(id, p.x); return; } }
					},
					move:p => { moved += 1; if(drag) setFromX(drag, p.x); },
					up:p => {
						if(drag){ drag = null; return; }
						if(!down) return;
						for(const id of Object.keys(MT.tog)){ const [y0, y1] = MT.tog[id]; if(p.y >= y0 && p.y <= y1){ S[id] = !S[id]; play("pop"); dirty("montage"); return; } }
						const z = s.zones.stamp; if(p.x >= z[0] && p.y >= z[1] && p.y <= z[3]) r(true);
					}
				};
			});
			if(closed || !done) return;
			s.on = null; tries++;
			const issues = montageCalc();
			if(!issues.length){ S.submitted = true; dirty("montage"); play("good"); break; }
			ev("err"); play("bad");
			await talk("nadia", issues[0][1] + (issues.length > 1 ? ` <i>(et ${issues.length - 1} autre${issues.length > 2 ? "s" : ""} point${issues.length > 2 ? "s" : ""})</i>` : ""));
			if(closed) return;
		}
		mark(resOf(tries), 3); task(null);
		await talk("nadia", `Montage solide : <b>${S.n} ans</b>, effort de ${fr(S.effort)} %, couverture de ${fr(S.covPct)} %, et pas un euro débloqué sans contrat Volta.${S.caution > 0 && !S.conj ? " Note : sans l'accord de son épouse, sa caution ne vaut que 100 k€." : ""}`);
		learn(["finpro", "droitfin", "droitbq", "sib"]); if(S.caution > 0 || S.conj) learn(["regmat"]);
		await file("montage");
	}

	/* ================= 5. mercredi 15 h : KYC et notation ================= */
	async function stepKyc(){
		ev("stage", "KYC"); setDay("Mercredi 15 h", "Agence");
		SH.kyc.mesh.visible = true; dirty("kyc"); S.zoom = null;
		view("sheet", "kyc");
		await talk("nadia", "Avant de prêter, la loi nous oblige à savoir <b>qui contrôle vraiment</b> l'entreprise : ses bénéficiaires effectifs, ceux qui détiennent plus de 25 %.", 4800);
		if(closed) return;
		task("☝ Trace du doigt le chemin de <b>chaque personne</b> jusqu'à Duval Textiles");
		await talk("nadia", "Trace du doigt le chemin de <b>chaque personne</b> jusqu'à Duval Textiles : les pourcentages se multiplient en route.", 4000);
		const N = ORG.nodes, near = (p, id, r = 95) => Math.hypot(p.x - N[id][0], p.y - N[id][1]) < r;
		const next = id => ORG.edges.filter(e => e[0] === id).map(e => e[1]);
		const pctOf = path => path.slice(0, -1).reduce((v, a, i) => v*ORG.edges.find(e => e[0] === a && e[1] === path[i + 1])[2]/100, 100);
		await new Promise(res => {
			SH.kyc.on = {
				down:p => { const st = ["jean", "clara", "lys"].find(id => near(p, id)); S.trace = st ? { path:[st], f:[p.x, p.y] } : null; dirty("kyc"); },
				move:p => { const t = S.trace; if(!t) return; t.f = [p.x, p.y]; const last = t.path[t.path.length - 1]; for(const n of next(last)) if(near(p, n, 80)) t.path.push(n); dirty("kyc"); },
				up:() => {
					const t = S.trace; S.trace = null; dirty("kyc"); if(!t) return;
					if(t.path[t.path.length - 1] !== "dt"){ if(t.path.length) say("nadia", "Va jusqu'au bout : jusqu'à <b>Duval Textiles</b>, en passant par les sociétés intermédiaires."); return; }
					const who = t.path[0]; if(S.bo[who] === undefined){ S.bo[who] = pctOf(t.path); play("pop"); }
					if(who === "lys") say("nadia", "Lys Invest : 20 % en direct. C'est une société, et sous 25 % : pas un bénéficiaire effectif.");
					else say("nadia", `${N[who][2]} : ${fr(S.bo[who])} %.${S.bo[who] > 25 ? " Plus de 25 % : bénéficiaire effectif." : ""}`);
					if(S.bo.jean !== undefined && S.bo.clara !== undefined){ SH.kyc.on = null; res(); }
				}
			};
		});
		if(closed) return;
		await wait(1200); if(closed) return;
		SH.rbe.mesh.visible = true; dirty("rbe");
		view("sheet", "rbe");
		await talk("nadia", "Jean <b>48 %</b>, Clara <b>32 %</b> : deux bénéficiaires effectifs. Compare avec le registre officiel. <b>Entoure la ligne fausse.</b>", 4400);
		task("✍ Entoure la ligne du registre qui ne colle pas avec ton calcul");
		SH.rbe.ref = false;
		let tries = 0;
		for(;;){
			const { z, stroke } = await circle(SH.rbe, RBE.map(r => r[0])); if(closed) return;
			tries++;
			if(z === "l2"){ okInk(stroke, true); play("good"); break; }
			ev("err"); play("bad"); okInk(stroke, false);
			await talk("nadia", tries === 1 ? "Cette ligne-là est juste. Qui manque dans le registre ?" : "Le registre dit « aucun autre bénéficiaire » : or Clara a 32 %.");
			if(closed) return;
			if(tries >= 3){ SH.rbe.ink.push({ pts:ellipse(SH.rbe.zones.l2), col:GREEN, w:7 }); dirty("rbe"); break; }
		}
		mark(resOf(tries), 1); task(null);
		await talk("nadia", "Clara a reçu ses parts en 2024, le registre date de 2021. Rien de louche : une déclaration pas à jour. Mais la banque a l'<b>obligation de signaler l'écart au greffe</b>. C'est fait.");
		if(closed) return;
		learn(["soc", "audit"]);
		await file("rbe"); await file("kyc");
		// la notation
		SH.grille.mesh.visible = true; dirty("grille"); view("sheet", "grille");
		await talk("nadia", "Dernière pièce : la <b>note de risque</b>. Avec tes deux ratios du lundi, <b>touche la case</b> de la grille qui correspond à Duval Textiles.", 4600);
		task("☝ Touche la case : capacité de remboursement × endettement");
		tries = 0;
		for(;;){
			const c = await new Promise(r => { SH.grille.on = { down:p => { for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){ const z = SH.grille.zones["c" + i + j]; if(p.x >= z[0] && p.x <= z[2] && p.y >= z[1] && p.y <= z[3]) r([i, j]); } } }; });
			if(closed) return;
			SH.grille.on = null; tries++; S.cell = c; dirty("grille");
			if(c[0] === GRID.good[0] && c[1] === GRID.good[1]){ play("good"); break; }
			ev("err"); play("bad");
			await talk("nadia", tries === 1 ? "Reprends la fiche de ratios : capacité de remboursement <b>4 ans</b>, endettement <b>0,75</b> (0,95 après la dépréciation du stock)." : "Ligne « de 3 à 5 ans », colonne « de 0,5 à 1 ».");
			if(closed) return;
			if(tries >= 3){ S.cell = GRID.good.slice(); dirty("grille"); break; }
		}
		mark(resOf(tries), 1);
		const pd = GRID.cells[S.cell[0]][S.cell[1]][1]/100, want = pd*(PRET - S.cov);
		view("desk");
		await talk("nadia", `Cote 5 : <b>2 % de risque de défaut</b> dans l'année. Calcule la <b>perte attendue</b> : 2 % de la part du prêt que tes garanties ne couvrent pas (1 200 − ${fr(S.cov)}).`, 5200);
		task(`🧮 Perte attendue = 0,02 × (1 200 − ${fr(S.cov)}) → ↗ Reporter`);
		tries = 0;
		for(;;){
			const v = await calcValue(); if(closed) return;
			tries++; S.el = v; S.elOk = Math.abs(v - want) <= Math.max(.15, want*.02); dirty("grille");
			if(S.elOk){ play("good"); break; }
			play("bad");
			if(tries >= 3){ S.el = want; S.elOk = true; dirty("grille"); break; }
			await talk("nadia", tries === 1 ? `Ce n'est pas ${fmtN(v)}. D'abord 1 200 − ${fr(S.cov)}, puis × 0,02 (2 %).` : `Tape : 1200 − ${fr(S.cov)} × 0,02 → la calculatrice va de gauche à droite.`);
			if(closed) return;
		}
		mark(resOf(tries), 1);
		S.rate = 3 + S.el/PRET*100 + .6 + .2; dirty("grille"); task(null);
		await talk("nadia", `Perte attendue : <b>${fr(S.el, 1)} k€</b> par an. On la fait payer dans le taux, avec le coût de l'argent (lié aux taux de la BCE), nos frais et notre marge : <b>${fr(S.rate, 2)} %</b>.`);
		learn(["grisk", "cdg", "polec"]);
		await file("grille");
	}

	/* ================= 6. jeudi 14 h : le comité de crédit ================= */
	const PRES = { mesh:null, w:1, h:1, home:null };
	const fan = {};
	async function stepComite(){
		ev("stage", "Comité"); setDay("Jeudi 14 h", "Comité de crédit"); lightAt(CX);
		nadia.g.position.set(CX + 3, 0, -.1); nadia.g.rotation.y = -1.1;
		// les pièces du dossier, étalées sur la table (mêmes feuilles, mêmes annotations)
		const ids = ["liasse", "ratios", "visite", "volta", "montage", "kyc", "rbe", "grille"];
		S.zoom = null;
		ids.forEach((id, k) => {
			const s = SH[id]; redraw(s);
			const tall = camera.aspect < .9, w = Math.min(tall ? .56 : .92, (tall ? .5 : .58)*s.W/s.H), h = w*s.H/s.W;
			const m = new THREE.Mesh(geo(new THREE.PlaneGeometry(w, h)), own(new THREE.MeshBasicMaterial({ map:s.tex, toneMapped:false })));
			m.userData.sheet = s; m.userData.piece = id;
			const col = k % 4, row = Math.floor(k/4);
			m.position.set(tall ? CX - .96 + col*.64 : CX - 1.86 + col*1.24, DY + .004 + k*.0004, tall ? -.4 - row*.6 : -.45 - row*.78); m.rotation.set(-Math.PI/2, 0, ((k*5) % 7 - 3)*.02); scene.add(m);
			fan[id] = { m, w, h, home:{ p:m.position.clone(), q:m.quaternion.clone() } };
		});
		view("committee");
		await talk("lambert", "Bonjour. Nous avons lu votre note : Duval Textiles, 1,2 M€ sur " + S.n + " ans. Nous avons des questions. <b>Répondez avec les pièces de votre dossier.</b>", 5000);
		if(closed) return;
		const OBJ = objections(S.volta);
		for(let oi = 0; oi < OBJ.length; oi++){
			const o = OBJ[oi];
			view("committee");
			await talk(o.who, o.q, 4200); if(closed) return;
			say(o.who, o.q);
			task("📄 Touche la pièce qui répond, puis <b>la ligne</b> qui le prouve");
			let res = null, tries = 0;
			while(!res){
				const ans = await present(); if(closed) return;
				tries++;
				const key = ans.piece + ":" + ans.zone, star = ans.piece + ":*";
				if(o.ok.includes(key)) res = tries === 1 ? "ok" : "mid";
				else if(o.mid.includes(key) || o.mid.includes(star) || o.ok.some(k => k.startsWith(ans.piece + ":"))) res = tries === 1 ? "mid" : "ko";
				if(!res){
					play("bad"); ev("err");
					await talk(o.who, ans.zone ? "Cette ligne ne répond pas à ma question." : "Ce document ne répond pas à ma question.", 2600); if(closed) return;
					say(o.who, o.q);
					if(tries >= 2) res = "ko";
				}
				await unpresent();
			}
			S.answers.push(res); S.comMax += 2; S.com += res === "ok" ? 2 : res === "mid" ? 1 : 0; mark(res, 2);
			play(res === "ok" ? "good" : res === "mid" ? "chime" : "bad");
			if(res === "ko") await talk("nadia", o.no); else await talk("me", o.yes + (res === "mid" ? " <i>(la bonne pièce, mais pas la meilleure ligne)</i>" : ""));
			if(closed) return;
			await talk(o.who, res === "ok" ? "Très clair, merci." : res === "mid" ? "Bien. J'aurais aimé l'entendre plus nettement." : "Je note que ce point n'était pas prêt.", 2200);
			if(closed) return;
		}
		task(null); view("committee");
		S.accord = S.com/S.comMax >= .5;
		await talk("lambert", S.accord ? `Le comité <b>accorde</b> le prêt : 1,2 M€ sur ${S.n} ans à ${fr(S.rate, 2)} %, garanties comprises, déblocage à la signature du contrat Volta. Bon travail.`
			: "Le comité <b>ajourne</b> le dossier : revenez avec des réponses plus solides. Le dossier n'est pas mauvais, c'est sa défense qui l'était.", 5200);
		learn(["nego", "oral", "ethique", "alt"]);
	}
	// présenter une pièce : la toucher sur la table, puis toucher la ligne
	function present(){
		return new Promise(res => {
			const pieces = Object.values(fan).map(f => f.m);
			for(const m of pieces) if(!hits.includes(m)) hits.push(m);
			let cur = null;
			const lift = id => {
				const f = fan[id]; cur = id; PRES.mesh = f.m; PRES.w = f.w*1.7; PRES.h = f.h*1.7;
				const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2 + .62, 0, 0));
				f.m.renderOrder = 2; play("pop");
				flyTo(f.m, new THREE.Vector3(CX, DY + .32, .05), new THREE.Vector3(1.7, 1.7, 1.7), .55, () => zoomOn(VIEWS.present), q);
			};
			for(const [id, f] of Object.entries(fan)){
				f.m.userData.sheet = { ...f.m.userData.sheet, on:{ down:p => {
					if(cur === null){ lift(id); return; }
					if(cur !== id){ const f = fan[cur]; flyTo(f.m, f.home.p, new THREE.Vector3(1, 1, 1), .35, null, f.home.q); lift(id); return; }
					const s = SH[id]; let zone = null;
					for(const [z, r] of Object.entries(s.zones)){ if(/^k|^c\d|^sign$|^stamp$/.test(z)) continue; if(p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]){ zone = z; break; } }
					if(!zone){ play("clic"); return; }
					const st = { pts:ellipse(s.zones[zone]), col:"#d68a1c", w:6 }; s.ink.push(st); redraw(s);
					setTimeout(() => { s.ink.splice(s.ink.indexOf(st), 1); s.dirty = true; }, 2600/SPEED);
					for(const g of Object.values(fan)) g.m.userData.sheet = { ...g.m.userData.sheet, on:null };
					res({ piece:id, zone });
				} } };
				f.m.userData.sheet.W = SH[id].W; f.m.userData.sheet.H = SH[id].H;
			}
		});
	}
	function unpresent(){ return new Promise(r => { const f = Object.values(fan).find(g => g.m === PRES.mesh); S.zoom = null; camGoal(); if(!f){ r(); return; } flyTo(f.m, f.home.p, new THREE.Vector3(1, 1, 1), .45, r, f.home.q); PRES.mesh = null; }); }

	/* ---------- déroulé ---------- */
	async function run(){
		await stepLiasse(); if(closed) return;
		await palier({ id:"affaires", onEvent:ev, openLead, quit:close,      // fin de la scène d'ouverture
			titre:"Tu as trouvé ce que cachent les comptes : un stock qui a doublé.",
			texte:"Il reste trois jours avant le comité : calculer les ratios, vérifier sur place à l'usine, monter le prêt, puis le défendre pièce par pièce.",
			suite:"Instruire tout le dossier (≈ 8 min)" }); if(closed) return;
		await stepRatios(); if(closed) return;
		await stepVisite(); if(closed) return;
		await stepMontage(); if(closed) return;
		await stepKyc(); if(closed) return;
		await stepComite(); if(closed) return;
		finish();
	}

	/* ---------- boucle ---------- */
	let last = performance.now(), raf = 0, drawAcc = 0;
	function frame(now){
		if(closed) return;
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		if(SPEED === 1) tick(dt);
		show(dt);
	}
	function show(dt){
		if(sized !== innerWidth + "x" + innerHeight) resize();
		camGoal();
		const k = Math.min(1, dt*3.4); camPos.lerp(goalP, k); camLook.lerp(goalL, k);
		if(!isFinite(camPos.x + camLook.x)){ camPos.copy(goalP); camLook.copy(goalL); }
		camera.position.copy(camPos); camera.lookAt(camLook); camera.updateMatrixWorld();
		drawAcc += dt;
		if(drawAcc > 1/30){ drawAcc = 0; for(const s of Object.values(SH)) if(s.dirty) redraw(s); }
		renderer.render(scene, camera);
		placeBubble();
	}
	function tick(dt){
		const g = dt*SPEED;
		for(const o of [...timers]){ o.t -= g; if(o.t <= 0){ timers.delete(o); o.r(); } }
		for(const a of [...anims]){ a.t += g; const k = Math.min(1, a.t/a.d); a.fn(k); if(k >= 1){ anims.delete(a); a.done && a.done(); } }
		for(const f of [...tickers]) f(g);
	}
	function placeBubble(){
		if(bubble.classList.contains("off") || !speaker) return;
		const who = people[speaker][0];
		if(who && who.g.visible){
			const head = new THREE.Vector3(); who.g.getWorldPosition(head); head.y += who === members.lambert || who === members.vasseur || who === members.okafor ? 2.45 : 2.6;
			const s = toScreen(head);
			if(s.in){ bubble.classList.remove("fix"); const half = Math.min(195, innerWidth/2 - 12); bubble.style.left = clamp(s.x, half + 12, innerWidth - half - 12) + "px"; bubble.style.top = Math.max(bubble.offsetHeight + 66, s.y) + "px"; return; }
		}
		bubble.classList.add("fix"); bubble.style.left = "12px"; bubble.style.top = "64px";
	}

	/* ---------- début, fin, fermeture ---------- */
	const ov = $("#dvOv"), card = $("#dvCard");
	function finish(){
		S.phase = "done"; play("win"); task(null); hush();
		const score = S.max ? Math.round(S.pts/S.max*100) : 0;
		const mention = MENTIONS[score >= 85 ? 3 : score >= 65 ? 2 : score >= 45 ? 1 : 0];
		ev("win", mention);
		const pieceNames = S.pieces.map(id => PIECES[id]);
		card.innerHTML = `<p class="k">Jeudi 15 h · décision du comité</p><div class="dv-big">${S.accord ? "🤝" : "📂"}</div>
			<h2>${S.accord ? "Prêt accordé" : "Dossier ajourné"}</h2>
			<span class="dv-stamp" style="color:${S.accord ? GREEN : RED}">${S.accord ? "ACCORD SOUS CONDITIONS" : "AJOURNEMENT"}</span>
			<p>Mention <b>${mention}</b> (${score} / 100). ${S.accord ? "Tu as trouvé ce que les comptes cachaient, monté un prêt qui protège la banque et l'entreprise, et défendu chaque point avec une preuve." : (S.pts - S.com)/(S.max - S.comMax) >= .6 ? "L'instruction était solide ; mais au comité, chaque réponse doit s'appuyer sur la bonne pièce, et sur la bonne ligne." : "Le stock qui dort, les garanties, les actionnaires : le comité attend des preuves. Rejoue pour les trouver."}</p>
			<div class="dv-stats"><div>Stock invendable trouvé<b>600 k€</b></div><div>Prêt monté<b>${S.n} ans · ${fr(S.rate || 4.2, 2)} %</b></div><div>Couverture<b>${fr(S.covPct)} %</b></div><div>Objections bien défendues<b>${S.answers.filter(a => a === "ok").length} / ${S.answers.length}</b></div></div>
			<p class="k">Ton dossier (${pieceNames.length} pièces)</p><p style="font-size:13px">${pieceNames.join(" · ")}</p>
			<p class="k">Les cours du master que tu as pratiqués (${S.learned.length})</p>
			<ul class="dv-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span><b>${COURSES[k][1]}</b> · ${COURSES[k][2]}</li>`).join("")}</ul>
			<p class="k">La suite du dossier, côté patrimoine</p>
			<p style="font-size:13.5px">M. Duval a 62 ans et Clara détient déjà 32 % : la transmission approche. Le master t'apprend aussi à la préparer :</p>
			<ul class="dv-list next">${NEXT.map(n => `<li>${n}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="dv-go" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="dv-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master MBIF ↗</a>
			<button class="dv-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="dv-alt" data-a="replay">Rejouer</button>`;
		ov.hidden = false; card.scrollTop = 0;
	}
	ov.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openAffaires({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	$(".dv-x").addEventListener("click", close);

	// ?vite : l'horloge du jeu avance même quand l'affichage est en pause, et des gestes simulés pour les tests
	let pump = 0;
	if(SPEED > 1){
		const fake = (s, x, y) => ({ s, obj:s.mesh, x, y, cx:0, cy:0 });
		const T$ = {
			S, SH, CALC, pallets, fan, camera, renderer,
			snap:() => { drawAcc = 1; show(1); },
			tap:(id, x, y) => { const s = SH[id], h = s.on || (s.ref ? refHandler(s) : null); if(!h) return "rien"; h.down && h.down(fake(s, x, y)); h.up && h.up(fake(s, x, y)); return "ok"; },
			drag:(id, pts) => { const s = SH[id], h = s.on; if(!h) return "rien"; h.down(fake(s, ...pts[0])); pts.slice(1).forEach(q => h.move && h.move(fake(s, ...q))); h.up(fake(s, ...pts[pts.length - 1])); return "ok"; },
			circle:(id, zone) => T$.drag(id, ellipse(SH[id].zones[zone])),
			keys:str => { for(const k of str.split(" ")) calcKey(k); },
			pal:i => { palHandler.down && palHandler.down({ pal:i }); },
			piece:(id, zone) => { const f = fan[id], h = f.m.userData.sheet.on; if(!h) return "rien"; const z = zone ? SH[id].zones[zone] : null; h.down({ x:z ? (z[0] + z[2])/2 : 1, y:z ? (z[1] + z[3])/2 : 1 }); return "ok"; },
			skip:() => skip && skip(),
			get speaker(){ return speaker; }, get task(){ return $("#dvTask").textContent; }
		};
		window.__mbif = T$;
		pump = setInterval(() => { if(!closed && !T$.pause) tick(.03); }, 30);
	}

	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.clear(); anims.clear(); tickers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		if(window.__mbif) delete window.__mbif;
		for(const o of trash) o.dispose && o.dispose();       // les géométries et matériaux du kit sont partagés avec le campus : on ne les libère pas
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss();
		root.remove();
		onClose && onClose();
	}

	// ouverture à chaud : pas d'écran de règles, Nadia explique chaque geste au moment de le faire
	ov.hidden = true; S.phase = "play"; ev("start"); run();
	raf = requestAnimationFrame(frame);
}
