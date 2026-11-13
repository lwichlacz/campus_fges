/* « La clinique rurale » — mini-jeu de la Prépa concours B Véto et Agro (parcours de la Licence Sciences de la Vie, FGES, 2026).
   Une ferme-clinique au petit matin, entre la grange et les champs. La docteure Vasseur, vétérinaire rurale, confie
   au joueur ses consultations ; chaque cas mobilise une matière du concours B :
   1 · biologie, chimie : Pixel, un chien agité ; poser le stéthoscope, taper le rythme du cœur, prendre la
       température, interroger le propriétaire, puis jouer la bonne carte diagnostic (scène d'ouverture) ;
   2 · biologie, chimie : Marguerite, une vache qui ne rumine plus ; écouter le rumen, tremper la bandelette de pH ;
   3 · géologie : la carrière derrière la ferme ; dater les couches et le filon qui les recoupe ;
   4 · agronomie : une rotation sur trois ans, avec une jauge d'azote du sol ;
   5 · l'oral du concours, puis le choix entre école vétérinaire et école d'agronomie.
   Personnes et animaux fictifs ; contenus simplifiés, à relire par l'équipe de la prépa. */
import { stage3d, THREE } from "./stage3d.js?v=e7c881c81b";
import { jpoCard } from "./jpo.js?v=e7c881c81b";
import { palier } from "./palier.js?v=e7c881c81b";

const COURSES = {
	bio:   ["Biologie", "Physiologie, métabolisme, microbiologie : comprendre le vivant pour le soigner. Première matière du concours B."],
	chim:  ["Chimie", "Molécules, acides et bases, pH : la chimie qui se cache derrière un empoisonnement ou une indigestion."],
	geol:  ["Géologie", "Lire une coupe, dater des roches, raconter l'histoire d'un paysage : une épreuve à part entière du concours B."],
	agro:  ["Agronomie et écologie", "Sols, cycles de l'azote, rotations : nourrir les hommes sans épuiser la terre."],
	oral:  ["Oraux du concours", "Expliquer clairement, relier les matières, garder son calme devant un jury : ça s'entraîne en colles toute l'année."]
};
const STEPS_UI = [["chien", "🐕 Pixel"], ["vache", "🐄 Marguerite"], ["geol", "🪨 La carrière"], ["champ", "🌾 Le champ"], ["oral", "🎓 L'oral"]];
const BPM = 176;
const LAYERS = [
	{ id:"gres", n:"Grès", c:"#c9a77a", y:0, h:1.6 }, { id:"argile", n:"Argile", c:"#8a7a6a", y:1.6, h:1.3 },
	{ id:"calcaire", n:"Calcaire à fossiles", c:"#e3dcc6", y:2.9, h:1.6 }, { id:"sable", n:"Sable", c:"#e8c97a", y:4.5, h:1.2 },
	{ id:"sol", n:"Sol actuel", c:"#5a4632", y:5.7, h:.7 }
];
const GEO_ORDER = ["gres", "argile", "calcaire", "sable", "filon", "sol"];
const CROPS = {
	feverole:{ n:"Féverole", ic:"🫘", n2:+60, col:"#7fa35a", legume:true },
	ble:{ n:"Blé", ic:"🌾", n2:-50, col:"#d9b54a" },
	colza:{ n:"Colza", ic:"🌼", n2:-40, col:"#e8d22a" },
	mais:{ n:"Maïs", ic:"🌽", n2:-70, col:"#9bbf4a" }
};

const CSS = `
.cv{position:fixed;inset:0;z-index:40;background:#e9f7fa;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#0f3168;overflow:hidden;animation:cvIn .4s ease both}
@keyframes cvIn{from{opacity:0}}
.cv canvas.cv-3d{position:absolute;inset:0;display:block;touch-action:none}
.cv-x{position:absolute;right:12px;top:10px;z-index:4;width:40px;height:40px;border-radius:50%;border:0;background:#0f3168;color:#fff;font-size:22px;cursor:pointer}
.cv-steps{position:absolute;left:12px;top:10px;z-index:3;display:flex;gap:5px;flex-wrap:wrap;max-width:calc(100% - 480px)}
.cv-steps span{background:rgba(255,255,255,.85);border-radius:999px;padding:5px 10px;font-size:12px;font-weight:800;color:#7a8f93}
.cv-steps span.done{color:#0f3168}.cv-steps span.now{background:#0f3168;color:#fff}
.cv-app{position:absolute;right:14px;top:58px;bottom:14px;width:396px;z-index:3;display:flex;flex-direction:column;background:#fff;border-radius:22px;box-shadow:0 20px 50px rgba(15,49,104,.3);overflow:hidden;border:6px solid #e7f2f1}
.cv-bar{display:flex;align-items:center;gap:8px;background:#0f3168;color:#fff;padding:10px 14px}
.cv-bar b{font-size:14px}.cv-bar small{margin-left:auto;font-size:11.5px;opacity:.85}
.cv-body{flex:1;overflow:auto;padding:14px;scrollbar-width:thin}
.cv-doc{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
.cv-av{flex:none;width:40px;height:40px;border-radius:12px;background:#e9f7fa;display:grid;place-items:center;font-size:22px}
.cv-doc p{margin:0;font-size:14px;line-height:1.45;background:#e9f7fa;border-radius:4px 14px 14px 14px;padding:8px 11px}
.cv-doc p small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0f3168}
.cv-k{font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0f3168}
.cv-h{font:300 21px/1.2 Tiempos Headline,Georgia,serif;margin:2px 0 8px}
.cv-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#2f4a52}
.cv-vitals{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}
.cv-vitals div{background:#e9f7fa;border-radius:12px;padding:7px 8px;text-align:center}
.cv-vitals small{display:block;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#5f7f84}
.cv-vitals b{font:300 18px Inter,system-ui,sans-serif}
.cv-vitals b.hi{color:#0f3168}
.cv-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.cv-chips button{border:2px solid #cfe3e1;background:#fff;border-radius:999px;padding:7px 12px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer;color:#0f3168}
.cv-chips button.on{border-color:#0f3168;background:#e9f7fa}
.cv-say{background:#e9f7fa;border-left:4px solid #21b7cb;border-radius:4px;padding:7px 10px;margin:6px 0;font-size:13.5px}
.cv-cards{display:grid;gap:7px;margin:8px 0}
.cv-card{display:flex;gap:10px;align-items:center;text-align:left;border:2px solid #cfe3e1;background:#fff;border-radius:14px;padding:10px 12px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;color:#0f3168}
.cv-card i{font-style:normal;font-size:24px}
.cv-card small{display:block;font-weight:600;font-size:12px;color:#5f7f84}
.cv-card:hover{border-color:#0f3168}
.cv-go{display:block;width:100%;border:0;border-radius:14px;padding:13px;margin-top:10px;background:#0f3168;color:#fff;font:700 15.5px Inter,system-ui,sans-serif;cursor:pointer}
.cv-go:disabled{opacity:.35}
.cv-alt{display:block;width:100%;border:2px solid #cfe3e1;border-radius:14px;padding:11px;margin-top:8px;background:#fff;color:#0f3168;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.cv-tap{display:block;width:100%;height:84px;border:0;border-radius:16px;background:radial-gradient(circle,#ff8a7a,#0f3168);color:#fff;font:300 18px Inter,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;user-select:none}
.cv-tap:active{transform:scale(.97)}
.cv-ok{color:#1f7a4a;font-weight:800;font-size:13.5px;margin:6px 0}.cv-ko{color:#b3402a;font-weight:800;font-size:13.5px;margin:6px 0}
.cv-course{background:#e9f7fa;border-radius:12px;padding:8px 11px;margin:8px 0;border:2px solid #e9f7fa}
.cv-course small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#0f3168}
.cv-course b{display:block;font-size:15px}.cv-course span{font-size:13px;color:#4a5f63}
.cv-stars{font-size:20px;letter-spacing:3px;color:#21b7cb}
.cv-swatch{display:flex;gap:6px;margin:8px 0}
.cv-swatch button{flex:1;height:52px;border:3px solid #fff;border-radius:10px;cursor:pointer;font:700 13px Inter,system-ui,sans-serif;color:#0f3168;box-shadow:0 0 0 2px #cfe3e1}
.cv-strip{height:22px;border-radius:6px;background:#e9f7fa;margin:6px 0;transition:background 1.2s}
.cv-years{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}
.cv-years div{border:2px dashed #cfe3e1;border-radius:12px;min-height:64px;padding:6px;text-align:center;font-size:12px;font-weight:800;color:#5f7f84}
.cv-years div b{display:block;font-size:22px}
.cv-years div.on{border-style:solid;border-color:#0f3168;color:#0f3168}
.cv-gauge{height:12px;border-radius:6px;background:#e7f2f1;overflow:hidden;margin:4px 0 10px}
.cv-gauge i{display:block;height:100%;transition:width .5s,background .5s}
.cv-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.cv-tbl td{padding:5px 3px;border-top:1px solid #e7f2f1}.cv-tbl td:last-child{text-align:right;font-weight:800}
@media (max-width:759px){
	.cv-app{left:0;right:0;top:auto;bottom:0;width:auto;max-height:55%;border-radius:20px 20px 0 0;border-width:5px 5px 0}
	.cv-steps{max-width:calc(100% - 64px)}
	.cv-steps span{font-size:11px;padding:4px 8px}
}`;

export function openClinique({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("cv-css")){ const st = document.createElement("style"); st.id = "cv-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "cv";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La clinique rurale");
	root.innerHTML = `<canvas class="cv-3d" aria-hidden="true"></canvas>
		<div class="cv-steps">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div>
		<button class="cv-x" aria-label="Quitter le jeu">×</button>
		<div class="cv-app"><div class="cv-bar">🩺 <b>Clinique des Prés</b><small data-clock>7 h 30</small></div><div class="cv-body"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), app = $(".cv-app"), body = $(".cv-body");
	const S = { stars:0, errors:0, learned:new Set(), bpm:null, temp:null, asked:new Set(), ph:null, geo:[], rot:[], school:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= la ferme-clinique ================= */
	const W = stage3d($("canvas"), { panel:app, side:"right", panelW:420, bg:"#cfe3f0", fog:[60, 150], minD:5, maxD:120, maxPolar:1.35 });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#fff6e6", "#7a9a5a", 1.1));
	const sun = new THREE.DirectionalLight("#ffe7c0", 2.2); sun.position.set(-25, 30, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30 }); scene.add(sun);
	// prés, chemin, grange, clôtures, arbres
	mesh(G(new THREE.PlaneGeometry(140, 140)), "#86a85a", 0, 0, 0).rotation.x = -Math.PI/2;
	box(4, .05, 40, "#b8a07a", 3, 0, 0);
	const barn = new THREE.Group(); barn.position.set(-6, 0, -6); scene.add(barn);
	box(12, 5, 9, "#9a3b2a", 0, 0, 0, barn);
	{ const s = new THREE.Shape(); s.moveTo(-6.4, 0); s.lineTo(6.4, 0); s.lineTo(0, 3.6); s.closePath(); const r = mesh(G(new THREE.ExtrudeGeometry(s, { depth:9.6, bevelEnabled:false })), "#4a3a32", 0, 5, -4.8, barn); }
	box(4, 3.6, .2, "#e8dccb", 0, 0, 4.55, barn);
	const sign = label("Clinique des Prés · vétérinaire", { size:.026, bg:"#0f6b6b", fg:"#fff" }); sign.position.set(0, 9.6, 4.6); barn.add(sign);
	for(let i = 0; i < 9; i++){ box(.2, 1.2, .2, "#8a6a4a", 10 + i*2.5, 0, 6); } box(20, .15, .1, "#8a6a4a", 20, 1, 6); box(20, .15, .1, "#8a6a4a", 20, .6, 6);
	for(const [x, z] of [[-20, 4], [-16, -14], [26, -5], [18, 14], [-24, -4]]){ cyl(.3, .4, 2, "#6b4a2e", x, 0, z); mesh(G(new THREE.IcosahedronGeometry(2.2, 0)), "#5d8a3a", x, 3.4, z); }
	// la table d'examen et Pixel, le chien
	const exam = new THREE.Group(); exam.position.set(4.5, 0, -2); scene.add(exam);
	box(4, .2, 2.2, "#c9d2d6", 0, 2.6, 0, exam); for(const [x, z] of [[-1.8, -.9], [1.8, -.9], [-1.8, .9], [1.8, .9]]) box(.15, 2.6, .15, "#8a949a", x, 0, z, exam);
	const dog = new THREE.Group(); dog.position.set(0, 2.8, 0); exam.add(dog);
	const fur = M("#c48a4a"), furD = M("#8a5a2a");
	mesh(G(new THREE.CapsuleGeometry(.45, 1.4, 6, 12)), fur, 0, .65, 0, dog).rotation.z = Math.PI/2;
	const head = mesh(G(new THREE.SphereGeometry(.42, 16, 12)), fur, 1.15, 1.05, 0, dog);
	mesh(G(new THREE.BoxGeometry(.45, .28, .32)), fur, 1.55, .95, 0, dog); mesh(G(new THREE.SphereGeometry(.07, 8, 6)), "#222", 1.79, 1, 0, dog);
	for(const z of [-.25, .25]){ mesh(G(new THREE.BoxGeometry(.12, .4, .22)), furD, 1.05, 1.4, z, dog).rotation.x = z*1.2; mesh(G(new THREE.SphereGeometry(.05, 8, 6)), "#111", 1.45, 1.15, z*.7, dog); }
	for(const [x, z] of [[-.55, -.25], [-.55, .25], [.55, -.25], [.55, .25]]) mesh(G(new THREE.CylinderGeometry(.09, .08, .5, 8)), fur, x, .2, z, dog);
	const tail = mesh(G(new THREE.CylinderGeometry(.05, .08, .7, 6)), furD, -1.1, .95, 0, dog); tail.rotation.z = .9;
	const heartZone = mesh(G(new THREE.SphereGeometry(.32, 12, 10)), new THREE.MeshBasicMaterial({ color:"#ff6a5a", transparent:true, opacity:0 }), .45, .55, .44, dog);
	// la vache Marguerite, dans sa stalle
	const cow = new THREE.Group(); cow.position.set(-6, 0, 3.5); cow.rotation.y = -.4; scene.add(cow);
	const hide = W.canvasTex(256, 128, (x, w, h) => { x.fillStyle = "#f4f1ea"; x.fillRect(0, 0, w, h); x.fillStyle = "#222"; for(const [a, b, r] of [[40, 40, 26], [120, 80, 34], [200, 30, 22], [180, 100, 18], [70, 100, 16]]){ x.beginPath(); x.ellipse(a, b, r, r*.7, .4, 0, 7); x.fill(); } });
	const cowM = M("#ffffff", { map:hide });
	mesh(G(new THREE.BoxGeometry(3.4, 1.7, 1.6)), cowM, 0, 2.2, 0, cow);
	mesh(G(new THREE.BoxGeometry(.9, .9, .8)), cowM, 2.1, 2.7, 0, cow); mesh(G(new THREE.BoxGeometry(.5, .45, .7)), "#e9b7a6", 2.6, 2.45, 0, cow);
	for(const z of [-.45, .45]) mesh(G(new THREE.ConeGeometry(.08, .35, 6)), "#ddd", 2.2, 3.3, z, cow);
	for(const [x, z] of [[-1.3, -.6], [-1.3, .6], [1.3, -.6], [1.3, .6]]) mesh(G(new THREE.CylinderGeometry(.16, .14, 1.4, 8)), cowM, x, .7, z, cow);
	const rumenZone = mesh(G(new THREE.SphereGeometry(.6, 12, 10)), new THREE.MeshBasicMaterial({ color:"#ffcc66", transparent:true, opacity:0 }), -.4, 2.3, -.82, cow);
	box(5, 1.2, .15, "#8a6a4a", 0, 0, -1.6, cow); box(5, 1.2, .15, "#8a6a4a", 0, 0, 1.6, cow);
	// le stéthoscope, qu'on pose sur l'animal
	const steth = new THREE.Group(); scene.add(steth); steth.visible = false;
	mesh(G(new THREE.TorusGeometry(.25, .04, 8, 20)), "#2a2f38", 0, .4, 0, steth);
	mesh(G(new THREE.CylinderGeometry(.16, .16, .08, 16)), M("#c0c4c8", { metalness:.8, roughness:.25 }), 0, 0, 0, steth);
	const stethHit = mesh(G(new THREE.SphereGeometry(.6, 8, 6)), new THREE.MeshBasicMaterial({ visible:false }), 0, .2, 0, steth);
	{ const l = label("🩺 Glisse-moi", { size:.022, bg:"#0f6b6b", fg:"#fff" }); l.position.y = 1.1; steth.add(l); }
	// la carrière : des couches, un filon qui les recoupe
	const quarry = new THREE.Group(); quarry.position.set(16, 0, -14); quarry.rotation.y = -.5; scene.add(quarry); quarry.visible = false;
	const layerHits = [];
	for(const L of LAYERS){ const m = box(12, L.h, 2, L.c, 0, L.y, 0, quarry); layerHits.push({ id:L.id, hit:m }); const l = label(L.n, { size:.022 }); l.position.set(-7.2, L.y + L.h/2, 1.2); quarry.add(l); }
	for(let i = 0; i < 9; i++) mesh(G(new THREE.TorusGeometry(.12, .04, 6, 10)), "#a8a08a", -4 + i, 3.6 + (i % 2)*.4, 1.02, quarry);
	const dyke = box(1.1, 5.7, 2.05, "#3a3a42", 2.2, 0, 0, quarry); dyke.rotation.z = .12;
	layerHits.push({ id:"filon", hit:dyke });
	{ const l = label("Filon de basalte", { size:.022, bg:"#3a3a42", fg:"#fff" }); l.position.set(2.6, 3.2, 1.4); quarry.add(l); }
	// le champ : trois bandes, une par année
	const field = new THREE.Group(); field.position.set(-18, 0, 14); scene.add(field); field.visible = false;
	const strips = [0, 1, 2].map(i => { const m = box(5.2, .25, 10, "#7a5a3a", -6 + i*6, 0, 0, field); const crop = new THREE.Group(); crop.position.set(-6 + i*6, .25, 0); field.add(crop); const l = label(`Année ${i + 1}`, { size:.022 }); l.position.set(-6 + i*6, 2.6, 5.4); field.add(l); return { m, crop }; });
	function plant(i, k){
		const s = strips[i]; s.crop.clear(); if(!k) return; const c = CROPS[k];
		for(let r = 0; r < 6; r++) for(let j = 0; j < 4; j++){ const p = new THREE.Mesh(G(new THREE.ConeGeometry(.22, k === "mais" ? 1.4 : .8, 5)), M(c.col)); p.position.set(-1.8 + j*1.2, (k === "mais" ? .7 : .4), -4 + r*1.6); s.crop.add(p); }
		const l = label(c.ic + " " + c.n, { size:.024 }); l.position.y = 2; s.crop.add(l);
	}

	/* ================= l'interface ================= */
	let stepHooks = [];
	const hook = f => stepHooks.push(W.onFrame(f));
	function stage(k, title, clock){
		root.querySelectorAll(".cv-steps span").forEach(s => { const i = STEPS_UI.findIndex(x => x[0] === s.dataset.s), n = STEPS_UI.findIndex(x => x[0] === k); s.className = i < n ? "done" : i === n ? "now" : ""; });
		$("[data-clock]").textContent = clock; ev("stage", title); W.clearInput(); stepHooks.forEach(f => f()); stepHooks = []; steth.visible = false;
	}
	const doc = t => `<div class="cv-doc"><span class="cv-av">👩‍⚕️</span><p><small>Dr Hélène Vasseur</small>${t}</p></div>`;
	function stars(n){ S.stars += n; return `<div class="cv-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	let stepErr = 0;
	function err(){ S.errors++; stepErr++; play("bad"); ev("err"); }
	const sc = () => stepErr === 0 ? 3 : stepErr <= 2 ? 2 : 1;
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="cv-course"><small>Au concours B</small><b>${n}</b><span>${t}</span></div>`; }
	const show = html => { body.innerHTML = html; body.scrollTop = 0; };
	const append = html => { const el = body.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); body.scrollTop = body.scrollHeight; } };
	const next = (k, t) => `<button class="cv-go" data-next="${k}">${t}</button>`;
	body.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });
	// glisser le stéthoscope sur une zone de l'animal
	let stethCb = null;      // pour les tests : poser le stéthoscope sans geste
	function stethoscope(target, onHit){
		stethCb = onHit; steth.visible = true; const wp = new THREE.Vector3(); target.getWorldPosition(wp);
		const home = wp.clone().add(new THREE.Vector3(1.6, .6, 1.2)); steth.position.copy(home);
		const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion()), -(wp.z + .6));
		W.setDrags([{ id:"steth", hit:stethHit }], plane, (d, p) => { steth.position.copy(p); }, () => {
			target.getWorldPosition(wp);
			if(steth.position.distanceTo(wp) < 1.1){ steth.position.copy(wp).add(new THREE.Vector3(0, 0, .5)); play("pop"); onHit(); }
			else { steth.position.copy(home); }
		});
	}

	/* ---------- 1 · Pixel : un chien agité (scène d'ouverture) ---------- */
	function chien(){
		stage("chien", "1 · Pixel, un chien agité", "7 h 30"); stepErr = 0;
		W.fly(new THREE.Vector3(4.6, 3.4, -1.6), 12, 1.0, .35);
		const first = !S.chienDone;
		let taps = [], listening = false;
		const vit = () => `<div class="cv-vitals"><div><small>Cœur</small><b class="${S.bpm ? (S.bpm > 140 ? "hi" : "") : ""}">${S.bpm ? S.bpm + " /min" : "?"}</b></div><div><small>Température</small><b class="${S.temp ? "hi" : ""}">${S.temp ? S.temp.toLocaleString("fr-FR") + " °C" : "?"}</b></div><div><small>Questions</small><b>${S.asked.size} / 3</b></div></div>`;
		const render = () => {
			show(`${first ? `<div class="cv-k">Mini-jeu · ${formation.name}</div>` : ""}<div class="cv-h">Pixel, 6 ans, très agité</div>
				${doc(`${first ? "Bonjour ! Premier client de la journée, et ça presse. " : ""}Pixel tremble, halète, son maître est inquiet. <b>Examine-le</b> : glisse le stéthoscope sur son cœur (côté gauche, derrière la patte avant), prends sa température, pose tes questions.`)}
				${vit()}<div data-tap></div>
				<div class="cv-chips"><button data-t>🌡️ Prendre la température</button></div>
				<div class="cv-chips">${[["mange", "Qu'a-t-il mangé ?"], ["vomi", "A-t-il vomi ?"], ["boit", "Boit-il beaucoup ?"]].map(([k, t]) => `<button data-q="${k}" class="${S.asked.has(k) ? "on" : ""}">${t}</button>`).join("")}</div>
				<div data-live></div><div data-dx></div>`);
			body.querySelector("[data-t]").onclick = () => { S.temp = 39.6; play("pop"); render(); check(); };
			body.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { const k = b.dataset.q; S.asked.add(k); play("pop"); render(); append(`<div class="cv-say">${{ mange:"« Hier soir, il a volé la moitié d'un <b>gâteau au chocolat</b> sur la table… »", vomi:"« Deux fois cette nuit. »", boit:"« Oui, il boit sans arrêt et il fait pipi partout. »" }[k]}</div>`); check(); });
			if(listening) tapPad();
		};
		function tapPad(){
			const el = body.querySelector("[data-tap]"); if(!el) return;
			el.innerHTML = `<p class="cv-p">🩺 Tu entends le cœur. <b>Tape au rythme des battements</b> pendant quelques secondes.</p><button class="cv-tap">💓 Tape au rythme</button>`;
			const b = el.querySelector(".cv-tap");
			b.onpointerdown = e => { e.preventDefault(); taps.push(performance.now()); play("clic"); if(taps.length >= 10){
				const iv = taps.slice(1).map((t, i) => t - taps[i]).sort((a, c) => a - c), med = iv[Math.floor(iv.length/2)], bpm = Math.round(60000/med);
				if(Math.abs(bpm - BPM) > 30){ taps = []; err(); el.insertAdjacentHTML("beforeend", `<p class="cv-ko">${bpm} /min ? Écoute mieux, et recommence : suis le flash rouge.</p>`); return; }
				S.bpm = BPM; listening = false; heartZone.material.opacity = 0; render(); check();
			} };
		}
		// le cœur bat, visible et audible, quand le stéthoscope est posé
		let beat = 0;
		hook((now) => { if(!listening) return; const k = (now/1000*BPM/60) % 1; heartZone.material.opacity = k < .15 ? .7 : .15; if(k < .15 && now - beat > 200){ beat = now; play("stomp"); const b = body.querySelector(".cv-tap"); if(b){ b.style.filter = "brightness(1.5)"; later(90, () => b.style.filter = ""); } } });
		hook((now) => { tail.rotation.z = .9 + Math.sin(now/90)*.25; dog.position.y = 2.8 + Math.abs(Math.sin(now/180))*.03; });
		stethoscope(heartZone, () => { if(S.bpm) return; listening = true; heartZone.material.opacity = .2; render(); });
		function check(){
			if(!(S.bpm && S.temp && S.asked.has("mange"))) return;
			const dx = body.querySelector("[data-dx]"); if(!dx || dx.childElementCount) return;
			dx.innerHTML = `<p class="cv-p"><b>Cœur à ${S.bpm}/min</b> (normal : 60 à 140), <b>39,6 °C</b> (normal : jusqu'à 39,2). Ton diagnostic ?</p>
				<div class="cv-cards">${[["gastro", "🦠", "Gastro-entérite", "une infection digestive"], ["choc", "🍫", "Intoxication au chocolat", "la théobromine"], ["chaleur", "☀️", "Coup de chaleur", "une exposition au soleil"]].map(([k, i, t, d]) => `<button class="cv-card" data-d="${k}"><i>${i}</i><span>${t}<small>${d}</small></span></button>`).join("")}</div>`;
			body.scrollTop = body.scrollHeight;
			dx.querySelector(".cv-cards").onclick = e => {
				const b = e.target.closest("[data-d]"); if(!b) return;
				if(b.dataset.d !== "choc"){ err(); dx.insertAdjacentHTML("beforeend", `<p class="cv-ko">${b.dataset.d === "gastro" ? "Une gastro n'emballe pas le cœur à ce point. Relis ce qu'il a mangé." : "Pas de soleil la nuit, et il est resté à l'intérieur."}</p>`); return; }
				play("good"); dx.querySelector(".cv-cards").style.pointerEvents = "none";
				dx.insertAdjacentHTML("beforeend", `${stars(sc())}<p class="cv-ok">✓ Intoxication à la théobromine.</p>
					<p class="cv-p">Le chocolat contient de la <b>théobromine</b>, une molécule de la famille de la caféine. Le chien l'élimine très lentement : elle s'accumule, stimule le cœur (tachycardie), l'agite, le fait vomir et boire. Traitement : charbon activé, perfusion, surveillance du cœur.</p>
					${course("bio")}${course("chim")}${first ? "" : next("vache", "Consultation suivante : Marguerite →")}`);
				body.scrollTop = body.scrollHeight; S.chienDone = true;
				if(first) later(2400, () => palier({ id:"clinique", onEvent, openLead, quit:close,
					titre:"Diagnostic posé : Pixel est sauvé. Tu raisonnes déjà comme une vétérinaire.",
					texte:"La journée continue : une vache qui ne rumine plus, une carrière à dater, un champ à faire tourner… puis l'oral du concours.",
					suite:"Continuer la journée (≈ 6 min)" }).then(vache));
			};
		}
		render();
	}

	/* ---------- 2 · Marguerite : le rumen se tait ---------- */
	function vache(){
		stage("vache", "2 · Marguerite ne rumine plus", "9 h 15"); stepErr = 0;
		W.fly(new THREE.Vector3(-5.5, 2.4, 3.5), 15, 1.0, .25);
		let listened = false;
		const render = () => {
			show(`<div class="cv-h">Marguerite ne mange plus</div>
				${doc("Le flanc gauche est gonflé, elle ne rumine plus depuis hier. L'éleveur a changé sa ration : <b>beaucoup plus d'orge</b>, d'un coup. Pose le stéthoscope sur son <b>flanc gauche</b> : c'est là qu'est le rumen.")}
				<div data-ear></div><div data-live></div>`);
			if(listened) earResult();
		};
		function earResult(){
			const el = body.querySelector("[data-ear]");
			el.innerHTML = `<p class="cv-p">🩺 Une minute d'écoute… <b>aucune contraction</b> (normal : une à trois par minute). Le rumen est à l'arrêt.</p>
				<p class="cv-p">Tu prélèves un peu de jus de rumen. <b>Trempe la bandelette</b>, puis compare sa couleur au nuancier.</p>
				<button class="cv-go" data-dip>Tremper la bandelette</button><div class="cv-strip"></div><div data-sw></div>`;
			el.querySelector("[data-dip]").onclick = () => {
				play("swipe"); el.querySelector(".cv-strip").style.background = "#21b7cb"; el.querySelector("[data-dip]").disabled = true;
				later(1300, () => {
					const sw = [["4,5", "#d6402a"], ["5,2", "#e07a3a"], ["6,2", "#d9c23a"], ["7,0", "#5aa04a"]];
					el.querySelector("[data-sw]").innerHTML = `<p class="cv-p">Quelle case du nuancier ressemble à ta bandelette ?</p><div class="cv-swatch">${sw.map(([v, c]) => `<button data-ph="${v}" style="background:${c}">pH ${v}</button>`).join("")}</div>`;
					el.querySelector(".cv-swatch").onclick = e => {
						const b = e.target.closest("[data-ph]"); if(!b) return;
						if(b.dataset.ph !== "5,2"){ err(); append(`<p class="cv-ko">Compare encore : ta bandelette est orangée.</p>`); return; }
						S.ph = 5.2; play("good"); el.querySelector(".cv-swatch").style.pointerEvents = "none";
						append(`<p class="cv-p"><b>pH 5,2</b>, alors qu'un rumen sain est entre 6 et 7. Qu'est-ce qui s'est passé ?</p>
							<div class="cv-cards">${[["acidose", "🌾", "L'orge, riche en amidon, a été fermentée trop vite : acidose"], ["virus", "🦠", "Un virus attaque le rumen"], ["eau", "💧", "Elle ne boit pas assez"]].map(([k, i, t]) => `<button class="cv-card" data-c="${k}"><i>${i}</i><span>${t}</span></button>`).join("")}</div>`);
						body.querySelector("[data-live] .cv-cards").onclick = e2 => {
							const c = e2.target.closest("[data-c]"); if(!c) return;
							if(c.dataset.c !== "acidose"){ err(); append(`<p class="cv-ko">Pense au changement de ration, et à ce que produisent les microbes du rumen.</p>`); return; }
							play("good"); body.querySelector("[data-live] .cv-cards").style.pointerEvents = "none";
							append(`${stars(sc())}<p class="cv-ok">✓ Acidose ruminale.</p><p class="cv-p">Le rumen est une cuve de fermentation : des milliards de <b>microbes</b> y digèrent l'herbe à la place de la vache. Trop d'amidon d'un coup, et ils produisent de l'<b>acide lactique</b> : le pH chute, le rumen s'arrête. Traitement : retirer l'orge, donner du foin, un peu de bicarbonate, et changer la ration progressivement.</p>${course("bio")}${next("geol", "Midi : la carrière →")}`);
						};
					};
				});
			};
		}
		hook(now => { rumenZone.material.opacity = listened ? 0 : .25 + .2*Math.sin(now/300); cow.children[1].rotation.z = Math.sin(now/1500)*.05; });
		stethoscope(rumenZone, () => { listened = true; play("chime"); render(); });
		render();
	}

	/* ---------- 3 · la carrière : dater les couches ---------- */
	function geol(){
		stage("geol", "3 · La carrière", "12 h 30"); stepErr = 0; quarry.visible = true;
		W.fly(new THREE.Vector3(14.5, 3, -13), 27, 1.15, -.5);
		const picked = [];
		show(`<div class="cv-h">La carrière derrière la ferme</div>
			${doc("En revenant, on passe par la carrière. Un sujet classique du concours : <b>touche les roches de la plus ancienne à la plus récente</b>. Deux principes : ce qui est dessous s'est déposé avant ; ce qui recoupe une couche est plus jeune qu'elle.")}
			<p class="cv-p" data-ord>Ordre : —</p><div data-live></div>`);
		W.setTaps(layerHits, id => {
			if(!id || picked.includes(id)) return;
			const want = GEO_ORDER[picked.length];
			if(id !== want){ err(); append(`<p class="cv-ko">${id === "filon" ? "Le filon traverse le sable : il est arrivé après lui." : id === "sol" && picked.length < 5 ? "Le sol recouvre tout, y compris le filon : c'est le plus récent." : "Pas encore : regarde ce qui est en dessous."}</p>`); return; }
			picked.push(id); play("pop");
			const h = layerHits.find(l => l.id === id).hit; h.material = h.material.clone(); h.material.emissive = new THREE.Color("#ffd27a"); h.material.emissiveIntensity = .35;
			body.querySelector("[data-ord]").textContent = "Ordre : " + picked.map(p => p === "filon" ? "Filon" : LAYERS.find(l => l.id === p).n).join(" → ");
			if(picked.length === GEO_ORDER.length){
				W.setTaps([], null); S.geo = picked; play("good");
				append(`${stars(sc())}<p class="cv-ok">✓ Grès, argile, calcaire, sable, puis le filon de basalte, enfin le sol.</p><p class="cv-p">Les couches se sont déposées les unes sur les autres (<b>superposition</b>). Le basalte, une roche volcanique, est monté à travers elles : il est plus jeune que le sable qu'il traverse (<b>recoupement</b>), mais plus vieux que le sol qui le recouvre. Les fossiles du calcaire diraient même l'âge de la mer d'alors.</p>${course("geol")}${next("champ", "L'après-midi : le champ →")}`);
			}
		});
	}

	/* ---------- 4 · le champ : une rotation sur trois ans ---------- */
	function champ(){
		stage("champ", "4 · Le champ", "15 h"); stepErr = 0; quarry.visible = false; field.visible = true;
		W.fly(new THREE.Vector3(-18, 1, 14), 32, .85, .3);
		const rot = [null, null, null]; let sel = null;
		const nOf = () => { let n = 80; const path = [n]; for(const k of rot){ if(!k) break; n += CROPS[k].n2; path.push(n); } return path; };
		const render = () => {
			const path = nOf(), cur = path[path.length - 1];
			show(`<div class="cv-h">Trois ans sur la même parcelle</div>
				${doc("L'éleveur veut cultiver cette parcelle trois ans de suite. <b>Choisis une culture, puis une année</b>. Garde de l'azote dans le sol, et ne mets jamais la même culture deux ans d'affilée.")}
				<div class="cv-chips">${Object.entries(CROPS).map(([k, c]) => `<button data-c="${k}" class="${sel === k ? "on" : ""}">${c.ic} ${c.n}</button>`).join("")}</div>
				<div class="cv-years">${rot.map((k, i) => `<div data-y="${i}" class="${k ? "on" : ""}">Année ${i + 1}<b>${k ? CROPS[k].ic : "＋"}</b>${k ? CROPS[k].n : ""}</div>`).join("")}</div>
				<p class="cv-p">Azote du sol : <b>${cur} kg/ha</b> ${cur < 40 ? "· le sol s'épuise" : ""}</p><div class="cv-gauge"><i style="width:${Math.max(4, Math.min(100, cur/1.6))}%;background:${cur < 40 ? "#c2571b" : "#3a9a5a"}"></i></div>
				<button class="cv-go" data-ok ${rot.every(Boolean) ? "" : "disabled"}>Valider la rotation</button><div data-live></div>`);
			body.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { sel = b.dataset.c; play("clic"); render(); });
			body.querySelectorAll("[data-y]").forEach(b => b.onclick = () => { if(!sel) return; const i = +b.dataset.y; rot[i] = sel; plant(i, sel); play("pop"); render(); });
			body.querySelector("[data-ok]").onclick = () => {
				const path2 = nOf(), repeat = rot.some((k, i) => i && k === rot[i - 1]), low = Math.min(...path2) < 40, legume = rot.includes("feverole"), legBeforeBle = rot.some((k, i) => k === "ble" && rot[i - 1] === "feverole");
				if(repeat){ err(); append(`<p class="cv-ko">Deux fois la même culture d'affilée : les maladies et les ravageurs de cette plante s'installent.</p>`); return; }
				if(low || !legume){ err(); append(`<p class="cv-ko">Le sol s'épuise en azote. Il manque une <b>légumineuse</b>, comme la féverole.</p>`); return; }
				S.rot = rot.slice(); play("good"); body.querySelector("[data-ok]").disabled = true;
				append(`${stars(stepErr === 0 && legBeforeBle ? 3 : stepErr <= 1 ? 2 : 1)}<p class="cv-ok">✓ ${rot.map(k => CROPS[k].n).join(" → ")}.</p><p class="cv-p">La féverole est une <b>légumineuse</b> : dans ses racines vivent des bactéries (<i>Rhizobium</i>) qui fixent l'azote de l'air. Elle enrichit le sol pour la culture suivante${legBeforeBle ? " : un blé après une féverole, c'est le grand classique." : "."} Moins d'engrais, moins de maladies : c'est l'agronomie.</p>${course("agro")}${next("oral", "Le soir : l'oral du concours →")}`);
			};
		};
		strips.forEach((_, i) => plant(i, null));
		render();
	}

	/* ---------- 5 · l'oral du concours, puis le choix ---------- */
	function oral(){
		stage("oral", "5 · L'oral", "18 h"); stepErr = 0; field.visible = false;
		W.fly(new THREE.Vector3(-6, 4, -1.5), 18, 1.15, 0);
		show(`<div class="cv-h">L'oral du concours B</div>
			${doc("Fin de journée. Imagine : c'est l'oral du concours, et le jury reprend ta journée. <b>« Pourquoi le chocolat est-il bien plus dangereux pour un chien que pour vous ? »</b>")}
			<div class="cv-cards" data-q>${[["lent", "🐢", "Le chien élimine la théobromine beaucoup plus lentement : elle s'accumule"], ["sucre", "🍬", "Le chien ne supporte pas le sucre"], ["allergie", "🤧", "Tous les chiens sont allergiques au cacao"]].sort(() => Math.random() - .5).map(([k, i, t]) => `<button class="cv-card" data-a="${k}"><i>${i}</i><span>${t}</span></button>`).join("")}</div><div data-live></div>`);
		body.querySelector("[data-q]").onclick = e => {
			const b = e.target.closest("[data-a]"); if(!b) return;
			if(b.dataset.a !== "lent"){ err(); append(`<p class="cv-ko">Le jury fronce les sourcils. Repense à la molécule et à son élimination.</p>`); return; }
			play("good"); body.querySelector("[data-q]").style.pointerEvents = "none";
			append(`${stars(sc())}<p class="cv-p">Le jury sourit : tu as relié biologie et chimie. Et maintenant, quelle école viserais-tu ?</p>
				<div class="cv-cards" data-s>${[["veto", "🩺", "École vétérinaire", "Soigner les animaux : quatre écoles en France, dont VetAgro Sup, Oniris, Alfort, Toulouse"], ["agro", "🌱", "École d'agronomie", "Nourrir la planète : agriculture, environnement, alimentation"]].map(([k, i, t, d]) => `<button class="cv-card" data-sch="${k}"><i>${i}</i><span>${t}<small>${d}</small></span></button>`).join("")}</div>${course("oral")}`);
			body.querySelector("[data-s]").onclick = e2 => { const c = e2.target.closest("[data-sch]"); if(!c) return; S.school = c.dataset.sch; play("win"); end(); };
		};
	}

	function end(){
		stage("oral", "Bilan", "19 h"); W.fly(new THREE.Vector3(-2, 2, 0), 30, 1, .3);
		const max = 15, s = S.stars, mention = s >= 13 ? "Très bien" : s >= 10 ? "Bien" : "Assez bien";
		ev("win", mention);
		show(`<div class="cv-k">${formation.name} · bilan</div><div class="cv-h">Fin de journée à la Clinique des Prés</div>
			<div class="cv-stars">${s} / ${max} ★ · ${mention}</div>
			<table class="cv-tbl"><tr><td>Pixel</td><td>intoxication au chocolat</td></tr><tr><td>Marguerite</td><td>acidose (pH ${S.ph ? "5,2" : "—"})</td></tr><tr><td>La carrière</td><td>${S.geo.length ? "6 roches datées" : "—"}</td></tr><tr><td>La rotation</td><td>${S.rot.length ? S.rot.map(k => CROPS[k].ic).join(" → ") : "—"}</td></tr><tr><td>École visée</td><td>${S.school === "veto" ? "vétérinaire" : S.school === "agro" ? "agronomie" : "—"}</td></tr><tr><td>Erreurs</td><td>${S.errors}</td></tr></table>
			<p class="cv-p">Biologie, chimie, géologie, agronomie : une journée de clinique rurale mobilise toutes les matières du <b>concours B</b>. La prépa s'y entraîne, en même temps que la Licence Sciences de la Vie : si le concours ne passe pas, la licence est là.</p>
			${jpoCard()}${openLead ? `<button class="cv-go" data-a="lead">📄 Recevoir la plaquette</button>` : ""}
			<a class="cv-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa et la licence ↗</a>
			<button class="cv-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="cv-alt" data-a="replay">Rejouer</button>`);
	}

	const STEPS = { chien, vache, geol, champ, oral, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a || !["lead", "fav", "replay"].includes(a)) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ Object.assign(S, { stars:0, errors:0, learned:new Set(), bpm:null, temp:null, asked:new Set(), ph:null, geo:[], rot:[], school:null }); for(const l of layerHits) l.hit.material.emissiveIntensity = 0; chien(); }
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		W.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".cv-x").addEventListener("click", close);

	W.place(new THREE.Vector3(0, 2, 0), 30, 1, .3);
	chien();      // ouverture à chaud : Pixel est déjà sur la table
	ev("start");
	ev("missions", [["1 · Pixel", chien], ["2 · Marguerite", vache], ["3 · La carrière", geol], ["4 · Le champ", champ], ["5 · L'oral", oral], ["Bilan", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, W, steth:() => stethCb && stethCb() };
}
