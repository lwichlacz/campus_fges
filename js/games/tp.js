/* « L'eau des Tilleuls » — mini-jeu de l'APES, année préparatoire aux études scientifiques (FGES, 2026).
   Le métier : technicien·ne d'analyse dans un laboratoire des eaux. Le dossier : à l'école des Tilleuls (fictive),
   douze élèves ont la gastro depuis jeudi, tous ont mangé à la cantine. L'eau du robinet est-elle en cause ?
   Un seul échantillon, six gestes du métier, sur de vrais outils, et un verdict qu'on signe :
   1 · prélever au robinet de la cantine : flamber le bec, laisser couler jusqu'à une température stable, remplir
       le flacon stérile (physique : équilibre thermique ; maths : une courbe qui tend vers un palier) ;
   2 · doser le chlore sur place, goutte à goutte, à la burette (chimie : dosage DPD/FAS, équivalence) ;
   3 · les nitrates au spectrophotomètre : faire le zéro, mesurer les étalons, tracer la droite d'étalonnage et y lire
       l'échantillon (physique : absorbance ; maths : proportionnalité, lecture graphique) — la piste des parents ;
   4 · les bactéries : filtrer, incuber, compter les colonies bleues d'E. coli (biologie ; maths : ramener à 100 mL) ;
   5 · le microscope : mise au point, objectif ×100 à immersion, mesurer un bacille (biologie, optique) ;
   6 · le bulletin d'analyse : juger chaque résultat face à sa limite, puis signer.
   L'esprit de l'APES (ateliers méthodologiques, « apprendre à apprendre ») : un premier essai bâclé fausse la preuve
   (flacon rempli avec l'eau qui dormait dans le tuyau, dosage versé à flot, étalon mesuré sans zéro, boîte
   indénombrable) ; on ne gomme jamais, on barre dans le cahier de labo, on explique, puis on refait avec la méthode.
   L'interface est le cahier de laboratoire, à petits carreaux ; la responsable, Nadia Keller, y laisse ses visas.
   École, laboratoire, personnes et valeurs sont fictifs ou simplifiés. Contenu à relire par l'équipe de l'APES. */
import { stage3d, THREE } from "./stage3d.js?v=7bd4e1b800";
import { jpoCard } from "./jpo.js?v=7bd4e1b800";
import { palier } from "./palier.js?v=7bd4e1b800";

const SPEED = /[?&]vite/.test(location.search) ? 5 : 1;      // ?vite : attentes et animations 5 fois plus rapides (tests)

/* ---------- contenus (à valider par l'équipe de l'APES) ---------- */
const COURSES = {
	phys:   ["Physique", "Mesurer, attendre l'équilibre, relier une mesure à une loi : de la température de l'eau à la lumière qu'elle absorbe."],
	chimie: ["Chimie", "Solutions, concentrations, dosages et équivalence : la chimie des TP, celle qui dit ce qu'il y a dans un verre d'eau."],
	maths:  ["Mathématiques", "Fonctions, proportionnalité, droite qui passe au plus près des points : les outils qui transforment une mesure en résultat."],
	svtu:   ["Sciences de la Vie, de la Terre et de l'Univers", "La cellule, les micro-organismes, le microscope : observer le vivant (parcours Sciences de la Vie)."],
	metho:  ["Ateliers méthodologiques", "Ne jamais gommer : barrer, dater, expliquer, puis refaire autrement. Apprendre à apprendre, dès le premier semestre."]
};
const T_HOT = 19.6, T_NET = 12.4, V_PIPE = 2.6;      // °C de l'eau qui dormait dans le tuyau, °C du réseau, litres « d'inertie »
const VEQ = 4.0, K_CL = .01;                            // équivalence du dosage (mL de FAS) ; 1 mL de FAS dilué = 0,01 mg/L de chlore libre
const STD = [[10, .127], [25, .306], [50, .618]];       // étalons de nitrates (mg/L) et leur absorbance
const A_BLANK = .085, A_ECH = .236;                      // absorbance du blanc (cuve + réactif), de l'échantillon
const N_BLUE = 14, N_PINK = 6;                          // colonies sur la membrane, pour 10 mL filtrés
const SAMPLE = "2026-1147";
const fr = (v, d = 1) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d });
const rng = seed => { let a = seed; return () => (a = (a*16807) % 2147483647)/2147483647; };
const COLS = (() => {
	const r = rng(4242), out = []; let guard = 0;
	while(out.length < N_BLUE + N_PINK && guard++ < 6000){
		const a = r()*Math.PI*2, d = Math.sqrt(r())*.34, x = .5 + Math.cos(a)*d, y = .5 + Math.sin(a)*d;
		if(out.some(c => Math.hypot(c.x - x, c.y - y) < .085)) continue;
		out.push({ x, y, blue:out.length < N_BLUE, r:.017 + r()*.009 });
	}
	return out;
})();
const RODS = (() => { const r = rng(99), a = []; for(let i = 0; i < 24; i++) a.push({ x:20 + r()*220, y:20 + r()*220, a:r()*Math.PI, l:24 + r()*8 }); return a; })();

const CSS = `
.lb{position:fixed;inset:0;z-index:40;background:#e7edf1;font-family:Inter,Arial,sans-serif;font-weight:300;color:#0f3168;overflow:hidden;animation:lbIn .4s ease both}
@keyframes lbIn{from{opacity:0}}
.lb canvas.lb-3d{position:absolute;inset:0;display:block;touch-action:none}
.lb-x{position:absolute;right:12px;top:10px;z-index:6;width:40px;height:40px;border-radius:50%;border:0;background:#0f3168;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 12px rgba(15,49,104,.3)}
.lb-hud{position:absolute;left:12px;top:10px;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;right:476px;pointer-events:none}
.lb-tag{background:#fff;border-left:6px solid #21b7cb;border-radius:3px;padding:4px 9px;font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#0f3168;box-shadow:0 3px 10px rgba(15,49,104,.18);line-height:1.25}
.lb-tag b{display:block;font:300 15px Inter,Arial,sans-serif;letter-spacing:0}
.lb-steps{display:flex;gap:4px;flex-wrap:wrap}
.lb-steps span{background:rgba(255,255,255,.85);border:1.5px solid #c6d3df;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:700;color:#7d8ca3}
.lb-steps span.done{background:#0f3168;border-color:#0f3168;color:#fff}
.lb-steps span.now{background:#21b7cb;border-color:#21b7cb;color:#0f3168}
.lb-prv{position:absolute;right:60px;top:13px;z-index:5;background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;color:#0f3168;box-shadow:0 3px 10px rgba(15,49,104,.18)}
.lb-prv i{font-style:normal;color:#13808f}
.lb-hint{position:absolute;left:50%;transform:translateX(calc(-50% - 208px));top:64px;z-index:5;background:#0f3168;color:#fff;border-radius:999px;padding:8px 14px;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(15,49,104,.3);white-space:nowrap;pointer-events:none;animation:lbW .3s both}
.lb-hint:empty{display:none}
.lb-book{position:absolute;right:12px;top:60px;bottom:12px;width:404px;z-index:3;overflow:auto;box-sizing:border-box;padding:16px 16px 18px 46px;border-radius:4px 10px 10px 4px;overscroll-behavior:contain;scrollbar-width:thin;color:#0f3168;
	background:radial-gradient(circle at 15px 11px,#c5ced8 0 4.5px,#9aa7b5 4.6px 5.4px,transparent 5.8px) 0 0/30px 22px repeat-y local,
		linear-gradient(90deg,transparent 34px,rgba(185,28,28,.32) 34px 35.5px,transparent 35.5px) local,
		linear-gradient(rgba(33,183,203,.15) 1px,transparent 1px) 0 0/13px 13px local,
		linear-gradient(90deg,rgba(33,183,203,.15) 1px,transparent 1px) 0 0/13px 13px local,#fdfefe;
	box-shadow:0 18px 40px rgba(15,49,104,.28),inset 0 0 0 1px #d5dee7}
.lb-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline;border-bottom:2px solid #0f3168;padding-bottom:4px;margin-bottom:8px;font-size:11px;font-weight:700;color:#5b6b85}
.lb-top b{font:300 16px "Tiempos Headline",Times New Roman,serif;color:#0f3168}
.lb-k{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#13808f}
.lb-h{font:300 24px/1.15 "Tiempos Headline",Times New Roman,serif;margin:2px 0 8px;color:#0f3168}
.lb-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#22335a}
.lb-p b{font-weight:700;color:#0f3168}
.lb-log{display:grid;gap:3px;margin:8px 0}
.lb-log:empty{display:none}
.lb-e{display:grid;grid-template-columns:42px 1fr;gap:6px;font-size:13.5px;line-height:1.45;color:#0f3168;animation:lbW .35s both}
.lb-e time{font-weight:700;font-size:11px;color:#5b6b85;padding-top:2px;font-variant-numeric:tabular-nums}
.lb-e.x .t{text-decoration:line-through;text-decoration-color:#b91c1c;text-decoration-thickness:2px;color:#7a869a}
.lb-e .why{display:block;color:#b91c1c;font-weight:700;font-size:12.5px}
.lb-e.p .t{font-weight:700}
.lb-e.p .t:before{content:"◆ ";color:#21b7cb}
@keyframes lbW{from{opacity:0;transform:translateY(5px)}}
.lb-visa{background:#e9f7fa;border-left:4px solid #21b7cb;padding:6px 10px;margin:8px 0;font-size:14px;line-height:1.42;color:#0f3168;transform:rotate(-.4deg);box-shadow:0 2px 6px rgba(15,49,104,.12);animation:lbW .35s both}
.lb-visa small{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#13808f}
.lb-visa:empty{display:none}
.lb-num{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0}
.lb-num div{font:300 26px "Tiempos Headline",Times New Roman,serif;font-variant-numeric:tabular-nums;color:#0f3168}
.lb-num small{display:block;font:700 10px Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#5b6b85}
.lb-graph{display:block;width:100%;background:#fff;border:1px solid #c9d6e3;border-radius:4px;margin:6px 0;touch-action:none;cursor:crosshair}
.lb-eye{display:block;margin:8px auto;width:210px;height:210px;border-radius:50%;box-shadow:0 0 0 8px #0f1a2c,0 0 0 10px #5b6b85;background:#000;touch-action:none;cursor:crosshair}
.lb-go{display:block;width:100%;border:0;border-radius:10px;padding:13px;margin-top:10px;background:#0f3168;color:#fff;font:700 15px Inter,Arial,sans-serif;cursor:pointer}
.lb-go:disabled{opacity:.35;cursor:default}
.lb-alt{display:block;width:100%;border:1.5px solid #9fb0c4;border-radius:10px;padding:11px;margin-top:8px;background:#fff;color:#0f3168;font:700 14px Inter,Arial,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.lb-go:focus-visible,.lb-alt:focus-visible{outline:3px solid #21b7cb;outline-offset:2px}
.lb-ok{color:#2f6b45;font-weight:700;font-size:13.5px;margin:6px 0}
.lb-ko{color:#b91c1c;font-weight:700;font-size:13.5px;margin:6px 0}
.lb-course{background:#fff;border:1.5px dashed #21b7cb;border-radius:8px;padding:8px 10px;margin:8px 0;animation:lbW .35s both}
.lb-course small{display:block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#13808f}
.lb-course b{display:block;font:300 17px "Tiempos Headline",Times New Roman,serif;color:#0f3168}
.lb-course span{font-size:13px;color:#22335a}
.lb-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0;background:#fff}
.lb-tbl td{padding:5px 4px;border-top:1px solid #d5dee7}.lb-tbl td:last-child{text-align:right;font-weight:700}
.lb-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:3px}
.lb-list li{font-size:13.5px}
.lb-list li:before{content:"◆ ";color:#21b7cb}
.lb-done{display:inline-block;border:3px solid #2f6b45;color:#2f6b45;font:700 13px Inter,Arial,sans-serif;letter-spacing:.14em;padding:3px 9px;border-radius:5px;transform:rotate(-5deg);margin:4px 0 8px}
@media (max-width:759px){
	.lb-hud{right:110px;gap:5px}
	.lb-steps span{padding:3px 7px;font-size:0;min-width:8px;min-height:8px}
	.lb-steps span.now{font-size:11px}
	.lb-tag{display:none}
	.lb-prv{right:58px;font-size:12px;padding:6px 10px}
	.lb-hint{transform:translateX(-50%);top:52px;font-size:13px;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 32px)}
	.lb-book{left:0;right:0;top:auto;bottom:0;width:auto;max-height:50%;border-radius:14px 14px 0 0;padding:12px 12px 18px 42px}
	.lb-h{font-size:21px}
	.lb-eye{width:170px;height:170px}
}`;

const STEP_UI = [["prel", "Prélever"], ["cl", "Chlore"], ["nit", "Nitrates"], ["bac", "Bactéries"], ["mic", "Microscope"], ["bul", "Bulletin"]];

export function openTP({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("lb-css")){ const st = document.createElement("style"); st.id = "lb-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "lb";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu L'eau des Tilleuls");
	root.innerHTML = `<canvas class="lb-3d" aria-hidden="true"></canvas>
		<div class="lb-hud"><div class="lb-tag">ÉCHANTILLON<b>${SAMPLE}</b></div><div class="lb-steps">${STEP_UI.map(([k, n]) => `<span data-s="${k}">${n}</span>`).join("")}</div></div>
		<div class="lb-prv">◆ Preuves <i data-prv>0 / 5</i></div><div class="lb-hint" aria-live="polite"></div>
		<button class="lb-x" aria-label="Quitter le jeu">×</button><div class="lb-book"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), book = $(".lb-book"), cv = $(".lb-3d");
	const S = { errors:0, learned:new Set(), proofs:[], clock:8*60 + 40, step:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms/SPEED); timers.add(t); return t; };

	/* ================= la scène : la cantine de l'école, puis le laboratoire ================= */
	const W = stage3d(cv, { panel:book, side:"right", panelW:416, bg:"#e7edf1", fog:[50, 120], minD:3, maxD:60, maxPolar:1.45, rotate:false, shadows:false });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#ffffff", "#b8b2a6", 1.25));
	const sun = new THREE.DirectionalLight("#fff4e2", 1.5); sun.position.set(-10, 20, 14); scene.add(sun);
	const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
	const Y = 3.2;                                      // dessus des paillasses et du comptoir
	const glass = M("#dcecff", { transparent:true, opacity:.3, roughness:.05, depthWrite:false, side:THREE.DoubleSide });
	const steel = M("#b9c1c9", { metalness:.7, roughness:.3 });
	const hidden = new THREE.MeshBasicMaterial({ visible:false });
	function hitBox(w, h, d, parent, x = 0, y = 0, z = 0){ const m = new THREE.Mesh(G(new THREE.BoxGeometry(w, h, d)), hidden); m.position.set(x, y, z); parent.add(m); return m; }
	function screen(w, h, pw, ph, parent, x, y, z){
		const t = W.canvasTex(pw, ph), mat = new THREE.MeshBasicMaterial({ map:t });
		const m = mesh(G(new THREE.PlaneGeometry(w, h)), mat, x, y, z, parent); m.castShadow = m.receiveShadow = false;
		return { m, t, draw:f => t.redraw(f) };
	}
	function stick(m, a, b){ const d = new THREE.Vector3().subVectors(b, a), L = Math.max(.001, d.length()); m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }
	const tiles = (a, b, n = 8) => W.canvasTex(256, 256, x => { for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i*256/n, j*256/n, 256/n, 256/n); } });
	const lcd = (scr, big, small, col = "#9ff2ff") => scr.draw((x, w, h) => {
		x.fillStyle = "#0b1a2e"; x.fillRect(0, 0, w, h); x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "middle";
		x.font = `700 ${Math.round(h*.46)}px Inter,Arial,sans-serif`; x.fillText(big, w/2, h*.44);
		if(small){ x.fillStyle = "#7fa6c4"; x.font = `700 ${Math.round(h*.16)}px Inter,Arial,sans-serif`; x.fillText(small, w/2, h*.84); }
	});

	/* --- la cantine de l'école des Tilleuls (fictive), à l'écart --- */
	const CX = 60;
	{
		const ft = tiles("#d9d4c8", "#cfc8b9"); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 3);
		mesh(G(new THREE.PlaneGeometry(26, 18)), M("#ffffff", { map:ft, roughness:.7 }), CX, 0, 0).rotation.x = -Math.PI/2;
		const wt = tiles("#f7f7f2", "#eef0ea", 16); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(4, 2);
		box(26, 12, .4, M("#ffffff", { map:wt }), CX, 0, -5.6);
		box(.4, 12, 18, "#e8ebe4", CX - 13, 0, 0); box(.4, 12, 18, "#e8ebe4", CX + 13, 0, 0);
		box(26, .5, .5, "#21b7cb", CX, 2.4, -5.3);                              // la frise de l'école
		box(16, Y, 3.6, "#dfe3e6", CX, 0, -3.6); box(16.2, .14, 3.8, "#c9cfd5", CX, Y - .14, -3.6);
		// dessins d'enfants et affiche de la cantine
		const art = W.canvasTex(512, 160, x => {
			x.fillStyle = "#fff"; x.fillRect(0, 0, 512, 160); x.fillStyle = "#0f3168"; x.font = "300 44px 'Tiempos Headline',Times New Roman,serif"; x.textAlign = "center";
			x.fillText("Cantine des Tilleuls", 256, 70); x.font = "700 22px Inter,Arial,sans-serif"; x.fillStyle = "#13808f"; x.fillText("Bon appétit ! · école élémentaire (fictive)", 256, 118);
		});
		mesh(G(new THREE.PlaneGeometry(7, 2.2)), new THREE.MeshBasicMaterial({ map:art }), CX - 4, 8.6, -5.35);
		["#f3b23b", "#4fa3d9", "#e2617f", "#7cc06e"].forEach((c, i) => {
			const d = W.canvasTex(128, 128, x => { x.fillStyle = "#fffdf6"; x.fillRect(0, 0, 128, 128); x.fillStyle = c; x.beginPath(); x.arc(64, 54, 30, 0, 7); x.fill(); x.fillStyle = "#0f3168"; x.fillRect(30, 96, 68, 8); x.fillRect(58, 84, 12, 30); });
			const m = mesh(G(new THREE.PlaneGeometry(1.8, 1.8)), new THREE.MeshBasicMaterial({ map:d }), CX + 3.5 + i*2.2, 8.4 + (i % 2)*.4, -5.35); m.rotation.z = (i % 2 ? -.06 : .05);
		});
		// une rangée de petites tables et de chaises, derrière
		for(let i = 0; i < 3; i++){ box(4, .2, 2.4, "#f3b23b", CX - 6 + i*6, 2.2, 4); for(const dx of [-1.6, 1.6]) box(.2, 2.2, .2, "#9aa1aa", CX - 6 + i*6 + dx, 0, 4); }
	}
	// l'évier inox et le robinet
	box(4, .12, 2.6, steel, CX + 1, Y, -3.4);
	mesh(G(new THREE.PlaneGeometry(3.4, 2.1)), M("#7e868f", { metalness:.6, roughness:.35 }), CX + 1, Y + .13, -3.4).rotation.x = -Math.PI/2;
	cyl(.13, .15, 1.8, steel, CX + 1, Y, -4.6);
	mesh(G(new THREE.CylinderGeometry(.1, .1, 1.25, 12)), steel, CX + 1, Y + 1.7, -4.0).rotation.x = Math.PI/2;
	cyl(.1, .08, .25, steel, CX + 1, Y + 1.45, -3.4);
	const NOZ = V3(CX + 1, Y + 1.45, -3.4);
	const handle = new THREE.Group(); handle.position.set(CX + 1, Y + 1.85, -4.6); scene.add(handle);
	box(1.3, .14, .22, "#e5e9ec", .55, 0, 0, handle); cyl(.12, .12, .16, steel, 0, -.05, 0, handle);
	const handleHit = hitBox(2.6, 1.2, 1.8, handle, .5, 0, 0);
	const stream = mesh(G(new THREE.CylinderGeometry(.07, .07, 1, 10)), M("#bfe3ff", { transparent:true, opacity:.7, roughness:.1 }), 0, 0, 0); stream.visible = false;
	stick(stream, NOZ, V3(CX + 1, Y + .15, -3.4));
	// le thermomètre numérique, sa sonde dans le jet
	const thermo = new THREE.Group(); thermo.position.set(CX + 3.8, Y, -3.2); scene.add(thermo);
	box(1.8, 1.2, .5, "#22324f", 0, 0, 0, thermo);
	const thermoScr = screen(1.5, .8, 300, 160, thermo, 0, .62, .26);
	const probe = mesh(G(new THREE.CylinderGeometry(.03, .03, 1, 6)), steel, 0, 0, 0); stick(probe, V3(CX + 3.0, Y + 1, -3.2), V3(CX + 1.12, Y + .9, -3.4));
	const thermoL = label("Thermomètre", { size:.022, bg:"#0f3168", fg:"#fff" }); thermoL.position.set(0, 1.75, 0); thermo.add(thermoL);
	// le chalumeau, pour flamber le bec du robinet
	const torch = new THREE.Group(); torch.position.set(CX - 1.7, Y, -2.1); scene.add(torch);
	cyl(.3, .3, 1.2, "#c4362f", 0, 0, 0, torch); cyl(.08, .13, .6, steel, 0, 1.2, 0, torch);
	const flame = mesh(G(new THREE.ConeGeometry(.16, .7, 12)), new THREE.MeshBasicMaterial({ color:"#5ab4ff", transparent:true, opacity:.85 }), 0, 2.15, 0, torch); flame.visible = false;
	const torchHit = hitBox(1.4, 2.6, 1.4, torch, 0, 1.1, 0);
	const torchL = label("Chalumeau", { size:.022, bg:"#0f3168", fg:"#fff" }); torchL.position.set(0, 2.9, 0); torch.add(torchL);
	// le flacon stérile, au bouchon bleu (le même revient au labo)
	function makeFlask(x, y, z){
		const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
		cyl(.5, .5, 1.45, glass, 0, 0, 0, g); cyl(.22, .5, .35, glass, 0, 1.45, 0, g); cyl(.22, .22, .3, glass, 0, 1.8, 0, g);
		const cap = cyl(.27, .27, .28, "#1f5fbf", 0, 2.08, 0, g);
		const lg = G(new THREE.CylinderGeometry(.45, .45, 1, 20)); lg.translate(0, .5, 0);
		const liq = mesh(lg, M("#bfe0f5", { transparent:true, opacity:.8 }), 0, .04, 0, g);
		cyl(.51, .51, .04, "#ffffff", 0, 1.2, 0, g);                            // le trait de remplissage
		const hit = hitBox(1.7, 3, 1.7, g, 0, 1.2, 0);
		const set = f => { liq.visible = f > .01; liq.scale.y = Math.max(.01, f*1.4); };
		set(0);
		return { g, cap, liq, set, hit, home:g.position.clone() };
	}
	const flask = makeFlask(CX - 3.1, Y, -2.3);
	const flaskL = label("Flacon stérile", { size:.022, bg:"#0f3168", fg:"#fff" }); flaskL.position.set(0, 2.9, 0); flask.g.add(flaskL);
	// la burette du dosage du chlore, sur le comptoir
	const bur = new THREE.Group(); bur.position.set(CX - 5.6, Y, -3.6); scene.add(bur);
	box(1.6, .12, 1.2, "#33404f", -.3, 0, 0, bur); cyl(.05, .05, 6.6, "#9aa1aa", -.9, 0, 0, bur); box(1, .14, .14, "#9aa1aa", -.45, 6, 0, bur);
	cyl(.13, .13, 4.2, glass, 0, 1.75, 0, bur);
	const blg = G(new THREE.CylinderGeometry(.1, .1, 1, 12)); blg.translate(0, .5, 0);
	const burLiq = mesh(blg, M("#f1eccd", { transparent:true, opacity:.85 }), 0, 1.76, 0, bur);
	for(let i = 0; i <= 5; i++) box(.14, .015, .02, "#0f3168", -.1, 5.8 - i*.8, .12, bur);           // graduations
	cyl(.03, .06, .35, glass, 0, 1.15, 0, bur);
	cyl(.09, .09, .3, "#e8ecef", 0, 1.5, 0, bur);
	const cock = new THREE.Group(); cock.position.set(0, 1.62, .18); bur.add(cock);
	box(.7, .12, .1, "#21b7cb", 0, -.06, 0, cock);
	const cockHit = hitBox(1.8, 1.4, 1.6, bur, 0, 1.6, .3);
	const erl = new THREE.Group(); erl.position.set(CX - 5.6, Y, -3.6); scene.add(erl);
	mesh(G(new THREE.CylinderGeometry(.24, .8, 1.15, 24, 1, true)), glass, 0, .58, 0, erl);
	const elg = G(new THREE.CylinderGeometry(.55, .78, 1, 24)); elg.translate(0, .5, 0);
	const erlLiq = mesh(elg, M("#ee6fae", { transparent:true, opacity:.9 }), 0, .02, 0, erl); erlLiq.scale.y = .4;
	const drop = mesh(G(new THREE.SphereGeometry(.06, 8, 6)), M("#f1eccd"), 0, 0, 0); drop.visible = false;
	const jet = mesh(G(new THREE.CylinderGeometry(.03, .03, 1, 6)), M("#f1eccd", { transparent:true, opacity:.8 }), 0, 0, 0); jet.visible = false;
	stick(jet, V3(CX - 5.6, Y + 1.15, -3.6), V3(CX - 5.6, Y + .45, -3.6));
	const burL = label("Burette (FAS)", { size:.022, bg:"#0f3168", fg:"#fff" }); burL.position.set(0, 6.6, 0); bur.add(burL);

	/* --- le laboratoire d'analyses des eaux (fictif) --- */
	{
		const ft = tiles("#e9ecee", "#dde1e5"); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(6, 3);
		mesh(G(new THREE.PlaneGeometry(40, 20)), M("#ffffff", { map:ft, roughness:.6 }), 0, 0, 0).rotation.x = -Math.PI/2;
		box(40, 12, .4, "#e3eaef", 0, 0, -6.4); box(.4, 12, 20, "#dbe3ea", -20, 0, 0); box(.4, 12, 20, "#dbe3ea", 20, 0, 0);
		box(34.4, .3, 4.6, "#f4f5f2", 0, Y - .3, -3.7); box(34, Y - .3, 4.2, "#0f3168", 0, 0, -3.8);
		for(let i = 0; i < 9; i++) box(.06, 2.4, .02, "#2a4a80", -15 + i*3.75, .3, -1.68);                  // portes des placards
		box(40, .3, .5, "#21b7cb", 0, 11.2, -6.1);
		// la fenêtre sur la cour, en plein jour
		const sky = W.canvasTex(256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9cc8ea"); g.addColorStop(1, "#e8f1f6"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#b9c4cc"; x.fillRect(0, h*.7, w, h); x.fillStyle = "#93a3af"; for(let i = 0; i < 6; i++) x.fillRect(10 + i*42, h*.55, 30, h*.3); });
		box(11, 4.6, .3, "#f7f8f9", -4, 6.2, -6.2);
		mesh(G(new THREE.PlaneGeometry(10.4, 4)), new THREE.MeshBasicMaterial({ map:sky }), -4, 8.5, -6.0);
		box(.2, 4, .2, "#f7f8f9", -4, 6.5, -5.95);
		// étagère de flacons de réactifs
		box(10, .2, 1.2, "#cfd6dd", 10, 7.4, -5.6);
		["#1f5fbf", "#c4362f", "#f3b23b", "#2f6b45", "#7a5aa8", "#1f5fbf", "#e8ecef", "#c4362f"].forEach((c, i) => { cyl(.32, .32, .9, M(c, { roughness:.4 }), 5.8 + i*1.15, 7.6, -5.6); cyl(.14, .14, .25, "#e8ecef", 5.8 + i*1.15, 8.5, -5.6); });
		// l'affiche des limites de qualité (simplifiée)
		const pos = W.canvasTex(300, 400, x => {
			x.fillStyle = "#fff"; x.fillRect(0, 0, 300, 400); x.fillStyle = "#0f3168"; x.fillRect(0, 0, 300, 60); x.fillStyle = "#fff"; x.font = "700 22px Inter,Arial,sans-serif"; x.fillText("Eau potable", 18, 38);
			x.fillStyle = "#0f3168"; x.font = "700 19px Inter,Arial,sans-serif";
			[["E. coli", "0 / 100 mL"], ["Coliformes", "0 / 100 mL"], ["Nitrates", "≤ 50 mg/L"], ["Chlore libre", "≥ 0,1 mg/L*"]].forEach(([a, b], i) => { x.fillText(a, 18, 110 + i*64); x.fillStyle = "#13808f"; x.fillText(b, 18, 136 + i*64); x.fillStyle = "#0f3168"; });
			x.font = "300 14px Inter,Arial,sans-serif"; x.fillText("* repère du réseau", 18, 384);
		});
		mesh(G(new THREE.PlaneGeometry(3, 4)), new THREE.MeshBasicMaterial({ map:pos }), 15.5, 7.6, -6.15);
	}
	// le spectrophotomètre, son écran, sa touche ZÉRO, le portoir de cuves
	const spec = new THREE.Group(); spec.position.set(-10, Y, -3.9); scene.add(spec);
	box(3.8, 1.5, 2.6, "#eef1f4", 0, 0, 0, spec); box(.8, .1, .8, "#1a2230", -1.1, 1.5, -.2, spec);
	const specScr = screen(1.9, .95, 380, 190, spec, .55, .78, 1.31);
	const zeroKey = new THREE.Group(); zeroKey.position.set(.9, 1.5, -.3); spec.add(zeroKey);
	box(.9, .22, .6, "#21b7cb", 0, 0, 0, zeroKey);
	const zeroL = label("ZÉRO", { size:.022, bg:"#0f3168", fg:"#fff" }); zeroL.position.set(0, .7, 0); zeroKey.add(zeroL);
	const zeroHit = hitBox(1.5, 1.2, 1.3, zeroKey, 0, .3, 0);
	const specL = label("Spectrophotomètre", { size:.022, bg:"#0f3168", fg:"#fff" }); specL.position.set(-.6, 2.6, 0); spec.add(specL);
	const SLOT = V3(-11.1, Y + 1.0, -4.1);
	box(4.4, .4, 1, "#cfd6dd", -6, Y, -2.6);
	const CUVES = [{ id:"blanc", c:0, n:"Blanc" }, ...STD.map(([c, a]) => ({ id:"s" + c, c, a, n:c + " mg/L" })), { id:"ech", c:null, a:A_ECH, n:"Éch." }];
	CUVES.forEach((q, i) => {
		const g = new THREE.Group(); g.position.set(-7.6 + i*.8, Y + .4, -2.6); scene.add(g);
		box(.36, .95, .36, glass, 0, 0, 0, g);
		const k = q.c === null ? A_ECH/.618 : q.c/50;
		box(.3, .72, .3, M(new THREE.Color("#fbfbf6").lerp(new THREE.Color("#e19a12"), k).getStyle(), { transparent:true, opacity:.88 }), 0, .03, 0, g);
		const l = label(q.n, { size:.016, bg:q.c === null ? "#21b7cb" : "#fff", fg:"#0f3168" }); l.position.set(0, 1.45, 0); g.add(l);
		Object.assign(q, { g, home:g.position.clone(), hit:hitBox(.75, 2, 1.2, g, 0, .6, 0) });
	});
	// la rampe de filtration, le flacon prélevé, le bec Bunsen, la boîte de Petri, l'étuve
	const filt = new THREE.Group(); filt.position.set(-1, Y, -4.1); scene.add(filt);
	box(2.6, .7, 1.6, "#9aa3ad", 0, 0, 0, filt); cyl(.35, .35, .15, steel, 0, .7, 0, filt);
	cyl(.62, .62, 2.4, glass, 0, .85, 0, filt);
	const flg = G(new THREE.CylinderGeometry(.57, .57, 1, 20)); flg.translate(0, .5, 0);
	const funLiq = mesh(flg, M("#cfe8f8", { transparent:true, opacity:.75 }), 0, .87, 0, filt); funLiq.visible = false;
	const FUN_H = 2.2;                                     // hauteur de 100 mL dans l'entonnoir
	[[10, "10 mL"], [100, "100 mL"]].forEach(([v, t]) => { cyl(.63, .63, .03, "#0f3168", 0, .87 + FUN_H*v/100, 0, filt); const l = label(t, { size:.016, bg:"#fff", fg:"#0f3168" }); l.position.set(1.25, .87 + FUN_H*v/100, .3); filt.add(l); });
	const flask2 = makeFlask(1.5, Y, -2.5); flask2.set(.85);
	const flask2L = label("Ton flacon", { size:.02, bg:"#0f3168", fg:"#fff" }); flask2L.position.set(0, 2.9, 0); flask2.g.add(flask2L);
	const pourJet = mesh(G(new THREE.CylinderGeometry(.06, .06, 1, 8)), M("#cfe8f8", { transparent:true, opacity:.75 }), 0, 0, 0); pourJet.visible = false;
	const bunsen = new THREE.Group(); bunsen.position.set(2.1, Y, -4.7); scene.add(bunsen);
	cyl(.4, .45, .15, "#33404f", 0, 0, 0, bunsen); cyl(.1, .1, 1.1, steel, 0, .15, 0, bunsen);
	const bflame = mesh(G(new THREE.ConeGeometry(.13, .6, 10)), new THREE.MeshBasicMaterial({ color:"#5ab4ff", transparent:true, opacity:.7 }), 0, 1.55, 0, bunsen);
	const dish = new THREE.Group(); const DISH_HOME = V3(-1.3, Y, -2.2); dish.position.copy(DISH_HOME); scene.add(dish);
	cyl(1.3, 1.3, .16, glass, 0, 0, 0, dish);
	const dishTex = W.canvasTex(512, 512);
	const dishTop = mesh(G(new THREE.CircleGeometry(1.24, 48)), new THREE.MeshBasicMaterial({ map:dishTex, transparent:true }), 0, .1, 0, dish); dishTop.rotation.x = -Math.PI/2;
	dish.visible = false;
	const etuve = new THREE.Group(); etuve.position.set(4.8, Y, -4.4); scene.add(etuve);
	box(3.2, 3.2, 2.6, "#e3e7eb", 0, 0, 0, etuve); box(2.8, 2.8, .1, "#2a3446", 0, .2, 1.25, etuve);
	const door = new THREE.Group(); door.position.set(-1.6, 0, 1.36); etuve.add(door);
	box(3.2, 3.2, .14, "#cfd6dd", 1.6, 0, 0, door); box(2.2, 1.6, .05, "#3a4a62", 1.6, .9, .08, door);
	const etuveScr = screen(1.6, .6, 320, 120, etuve, 0, 3.55, 1.2); etuveScr.m.position.y = 3.6;
	const etuveL = label("Étuve 36 °C", { size:.02, bg:"#0f3168", fg:"#fff" }); etuveL.position.set(0, 4.4, 1); etuve.add(etuveL);
	// le microscope
	const mic = new THREE.Group(); mic.position.set(9.8, Y, -3.9); scene.add(mic);
	box(1.8, .3, 2.2, "#0f3168", 0, 0, 0, mic); box(.45, 3.2, .6, "#0f3168", 0, .3, -.8, mic);
	box(1.7, .12, 1.4, "#22324f", 0, 1.5, .1, mic); box(1.3, .03, .45, "#e8f2fb", 0, 1.62, .1, mic); box(.5, .01, .3, "#d97ab0", 0, 1.655, .1, mic);
	const turret = new THREE.Group(); turret.position.set(0, 2.75, .05); mic.add(turret);
	cyl(.42, .42, .25, "#c9d2da", 0, 0, 0, turret);
	const objA = cyl(.12, .1, .45, "#e8ecef", .22, -.45, 0, turret), objB = cyl(.14, .1, .75, "#f3b23b", -.22, -.75, 0, turret);
	const tube = mesh(G(new THREE.CylinderGeometry(.2, .2, 1.6, 14)), M("#e8ecef"), 0, 3.6, -.25, mic); tube.rotation.x = -.35;
	const turretHit = hitBox(1.6, 1.2, 1.4, mic, 0, 2.7, .05);
	const knob = new THREE.Group(); knob.position.set(.45, 1.15, -.8); mic.add(knob);
	const knobM = mesh(G(new THREE.CylinderGeometry(.45, .45, .3, 18)), M("#9aa1aa", { metalness:.6, roughness:.35 }), 0, 0, 0, knob); knobM.rotation.z = Math.PI/2; knobM.position.x = .2;
	box(.04, .7, .12, "#0f3168", .37, -.35, 0, knob);
	const knobHit = hitBox(1.6, 1.6, 1.6, knob, .5, 0, 0);
	const knobL = label("Mise au point", { size:.018, bg:"#0f3168", fg:"#fff" }); knobL.position.set(1.3, .3, 0); knob.add(knobL);
	const turL = label("Objectifs", { size:.018, bg:"#0f3168", fg:"#fff" }); turL.position.set(-1.2, 0, 0); turret.add(turL);
	const oil = new THREE.Group(); oil.position.set(11.6, Y, -2.4); scene.add(oil);
	cyl(.25, .25, .6, "#d9b04a", 0, 0, 0, oil); cyl(.08, .14, .3, "#e8ecef", 0, .6, 0, oil);
	const oilHit = hitBox(1.1, 1.6, 1.1, oil, 0, .5, 0);
	const oilL = label("Huile à immersion", { size:.018, bg:"#0f3168", fg:"#fff" }); oilL.position.set(0, 1.4, 0); oil.add(oilL);
	// le bulletin d'analyse, posé au bout de la paillasse
	const BW = 1400, BH = 1000;
	const bulTex = W.canvasTex(BW, BH); bulTex.generateMipmaps = false; bulTex.minFilter = THREE.LinearFilter;      // lu de près : pas de mipmaps (sinon la feuille peut sortir uniforme)
	const bul = mesh(G(new THREE.PlaneGeometry(5.6, 4)), new THREE.MeshBasicMaterial({ map:bulTex }), 14.6, Y + .07, -3.6); bul.rotation.x = -Math.PI/2; bul.visible = false;
	const bulPaper = box(5.7, .04, 4.1, "#f1eee6", 14.6, Y, -3.6); bulPaper.visible = false;
	const pen = new THREE.Group(); pen.position.set(17.6, Y + .1, -2.4); pen.rotation.y = .5; scene.add(pen);
	mesh(G(new THREE.CylinderGeometry(.07, .07, 1.6, 8)), M("#0f3168"), 0, 0, 0, pen).rotation.z = Math.PI/2;

	/* --- la flèche qui montre quoi toucher --- */
	const arrow = label("▼", { size:.03, bg:"#21b7cb", fg:"#0f3168" }); arrow.visible = false; scene.add(arrow);
	let arrowAt = null; const tmp = new THREE.Vector3();
	function point(obj, dy = 1.6){ arrowAt = obj ? { obj, dy } : null; arrow.visible = !!obj; }
	W.onFrame(now => { if(!arrowAt) return; arrowAt.obj.getWorldPosition(tmp); arrow.position.set(tmp.x, tmp.y + arrowAt.dy + Math.sin(now/220)*.12, tmp.z); });

	/* --- petites animations --- */
	function tween(ms, fn, done){
		const t0 = performance.now();
		const off = W.onFrame(now => { const k = Math.min(1, (now - t0)/(ms/SPEED)); fn(W.ease(k), k); if(k >= 1){ off(); if(done && !closed) done(); } });
		return off;
	}
	function moveTo(g, to, ms = 400, arc = .8, done){ const from = g.position.clone(); return tween(ms, e => { g.position.lerpVectors(from, to, e); g.position.y += arc*4*e*(1 - e); }, done); }
	const wiggle = g => { const r0 = g.rotation.y; tween(420, (e, k) => g.rotation.y = r0 + Math.sin(k*Math.PI*6)*.1*(1 - k), () => g.rotation.y = r0); };

	/* --- la main : toucher, maintenir, faire glisser un objet --- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let targets = [], act = null;
	const setRay = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, W.camera); };
	const shown = o => { for(let n = o; n; n = n.parent) if(!n.visible && n.material !== hidden) return false; return true; };
	function pick(e){
		setRay(e); const live = targets.filter(t => shown(t.hit));
		const h = ray.intersectObjects(live.map(t => t.hit), true)[0]; if(!h) return null;
		const t = live.find(t => { for(let n = h.object; n; n = n.parent) if(n === t.hit) return true; return false; });
		return t ? { t, h } : null;
	}
	cv.addEventListener("pointerdown", e => {
		const r = pick(e); if(!r) return;
		act = { t:r.t, h:r.h, x0:e.clientX, y0:e.clientY, moved:false };
		try { cv.setPointerCapture(e.pointerId); } catch(x){}
		W.controls.enabled = false;
		r.t.down && r.t.down(act, e);
	});
	cv.addEventListener("pointermove", e => {
		if(!act) return;
		if(Math.hypot(e.clientX - act.x0, e.clientY - act.y0) > 8) act.moved = true;
		act.t.move && act.t.move(act, e);
	});
	const release = e => { if(!act) return; const a = act; act = null; W.controls.enabled = true; a.t.up && a.t.up(a, e); if(!a.moved && a.t.tap) a.t.tap(a, e); };
	cv.addEventListener("pointerup", release); cv.addEventListener("pointercancel", release);
	// test automatique : toucher un objet de la scène par son nom
	const OBJ = { torch:torchHit, handle:handleHit, flask:flask.hit, cock:cockHit, zero:zeroHit, flask2:flask2.hit, dish:dishTop, turret:turretHit, knob:knobHit, oil:oilHit, bul };
	CUVES.forEach(q => OBJ["cuve:" + q.id] = q.hit);

	/* ================= le cahier de laboratoire ================= */
	let hooks = [];
	// le temps réel écoulé (et pas l'image plafonnée à 50 ms) : verser, remplir, chauffer suivent la montre, même sur un téléphone lent
	const hook = f => { let last = 0; hooks.push(W.onFrame(now => { const dt = last ? Math.min(.25, (now - last)/1000) : 0; last = now; f(now, dt); })); };
	const hint = t => { $(".lb-hint").textContent = t || ""; };
	const clock = (add = 0) => { S.clock += add; const d = Math.floor(S.clock/1440), m = S.clock % 1440; return `${["", "mar. ", "mer. ", "jeu. "][Math.min(d, 3)]}${String(Math.floor(m/60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
	function view(target, dDesk, dPhone, polar, az){ W.fly(target, innerWidth < 760 ? dPhone : dDesk, polar, az); }
	function stage(k, title){
		S.step = k;
		const i = STEP_UI.findIndex(s => s[0] === k);
		root.querySelectorAll(".lb-steps span").forEach((s, j) => s.className = k === "end" || j < i ? "done" : j === i ? "now" : "");
		ev("stage", title);
		targets = []; act = null; W.controls.enabled = true; hooks.forEach(off => off()); hooks = []; point(null); hint("");
	}
	function page(kicker, title, body){
		book.innerHTML = `<div class="lb-top"><b>Cahier de laboratoire</b><span>Éch. ${SAMPLE} · école des Tilleuls</span></div>
			<div class="lb-k">${kicker}</div><h2 class="lb-h">${title}</h2>${body}<div class="lb-log" data-log></div><div class="lb-visa" data-visa></div><div data-live></div>`;
		book.scrollTop = 0;
	}
	const scrollEnd = () => { book.scrollTop = book.scrollHeight; };
	function entry(t, o = {}){
		const el = book.querySelector("[data-log]"); if(!el) return null;
		const e = document.createElement("div"); e.className = "lb-e" + (o.proof ? " p" : "");
		e.innerHTML = `<time>${clock(o.min ?? 3)}</time><span class="t">${t}</span>`;
		el.appendChild(e); scrollEnd(); return e;
	}
	function strike(e, why){ if(!e) return; e.classList.add("x"); e.insertAdjacentHTML("beforeend", `<span></span><span class="why">barré : ${why}</span>`); scrollEnd(); }
	function visa(t){ const el = book.querySelector("[data-visa]"); if(el){ el.innerHTML = t ? `<small>Visa · Nadia Keller, responsable du labo</small>${t}` : ""; scrollEnd(); } }
	const live = html => { const el = book.querySelector("[data-live]"); if(el){ el.innerHTML = html; } };
	const append = html => { const el = book.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); scrollEnd(); } };
	function err(why){ S.errors++; play("bad"); ev("err", why); }
	function proof(k, t){
		if(!S.proofs.some(p => p[0] === k)) S.proofs.push([k, t]);
		$("[data-prv]").textContent = `${S.proofs.length} / 5`;
		play("chime"); return entry(t, { proof:true });
	}
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="lb-course"><small>À l'APES</small><b>${n}</b><span>${t}</span></div>`; }
	const next = (k, t) => `<button class="lb-go" data-a="next:${k}">${t}</button>`;

	/* ---------- 1 · prélever au robinet de la cantine (scène d'ouverture) ---------- */
	function prelever(){
		stage("prel", "1 · Prélever à la cantine");
		view(V3(CX + .3, Y + 1.3, -3), 13.5, 9.6, 1.12, .05);
		const first = !S.prelDone;
		let vStable = null, open = 0, vflow = 0, flamed = false, fill = 0, filling = false, tFill = 0, done = false, warned = false, drawT = 0;
		const curve = [];
		flask.g.position.copy(flask.home); flask.set(0); flask.cap.visible = false; flask.g.rotation.set(0, 0, 0); handle.rotation.y = 0; stream.visible = false;
		const temp = () => T_NET + (T_HOT - T_NET)*Math.exp(-vflow/V_PIPE);
		page(first ? `Mini-jeu · ${formation.name}` : "1 · Le prélèvement", "L'eau des Tilleuls",
			`${first ? `<p class="lb-p">Lundi, 8 h 40. Depuis jeudi, <b>douze élèves de l'école des Tilleuls</b> ont la gastro, et tous ont mangé à la cantine. L'eau du robinet est-elle en cause ? Tu es <b>technicien·ne au laboratoire des eaux</b> : tout commence par un bon prélèvement.</p>` : ""}
			<p class="lb-p"><b>Flambe le bec</b> du robinet au chalumeau, <b>ouvre le robinet</b> (fais glisser la manette), puis <b>maintiens le flacon</b> sous le jet pour le remplir jusqu'au trait blanc.</p>
			<div class="lb-num"><div><small>température de l'eau</small><span data-t>—</span></div><div><small>eau écoulée</small><span data-v>0 L</span></div></div>
			<canvas class="lb-graph" width="640" height="220" data-g aria-label="Température de l'eau en fonction du volume écoulé"></canvas>`);
		lcd(thermoScr, "— °C");
		point(torch, 3.3); hint("👆 Touche le chalumeau");
		function drawCurve(){
			const c = book.querySelector("[data-g]"); if(!c) return; const x = c.getContext("2d"), w = c.width, h = c.height;
			x.clearRect(0, 0, w, h); const P = (v, t) => [50 + v/14*(w - 70), h - 30 - (t - 10)/11*(h - 50)];
			x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.beginPath(); x.moveTo(...P(0, 21)); x.lineTo(...P(0, 10)); x.lineTo(...P(14, 10)); x.stroke();
			x.fillStyle = "#5b6b85"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText("°C", 8, 26); x.fillText("litres écoulés", w - 150, h - 6);
			for(const t of [12, 16, 20]){ const [, yy] = P(0, t); x.fillText(t, 14, yy + 6); }
			x.setLineDash([6, 6]); x.strokeStyle = "#21b7cb"; x.beginPath(); x.moveTo(...P(0, T_NET)); x.lineTo(...P(14, T_NET)); x.stroke(); x.setLineDash([]);
			x.strokeStyle = "#b91c1c"; x.lineWidth = 3; x.beginPath(); curve.forEach(([v, t], i) => i ? x.lineTo(...P(Math.min(v, 14), t)) : x.moveTo(...P(v, t))); x.stroke();
		}
		drawCurve();
		const readout = () => { const t = book.querySelector("[data-t]"), v = book.querySelector("[data-v]"); if(t) t.textContent = fr(temp()) + " °C"; if(v) v.textContent = fr(vflow) + " L"; };
		function setOpen(o){ open = Math.max(0, Math.min(1, o)); handle.rotation.y = open*1.3; stream.visible = open > .02; stream.scale.x = stream.scale.z = .4 + open*.9; }
		function flameIt(){
			if(flamed){ return; }
			play("swipe"); point(null);
			const home = torch.position.clone(); torch.rotation.z = 0;
			moveTo(torch, V3(NOZ.x - .9, NOZ.y - 1.9, NOZ.z + .5), 450, .6, () => {
				torch.rotation.z = -.5; flame.visible = true;
				const off = W.onFrame(now => { flame.scale.set(1, .8 + Math.sin(now/40)*.2, 1); });
				later(1400, () => { off(); flame.visible = false; torch.rotation.z = 0; moveTo(torch, home, 450, .6); flamed = true; entry("Bec du robinet flambé au chalumeau."); point(handle, 1); hint("👉 Fais glisser la manette pour ouvrir le robinet"); });
			});
		}
		const notYet = () => { visa("D'abord <b>flamber le bec</b> : sinon on analyse les microbes collés au robinet, pas ceux de l'eau."); wiggle(torch); };
		targets = [
			{ hit:torchHit, tap:flameIt },
			{ hit:handleHit, down:a => { a.o0 = open; },
				move:(a, e) => { if(!flamed) return; setOpen(a.o0 + (e.clientX - a.x0)/150 + (a.y0 - e.clientY)/300); },
				up:a => { if(!flamed){ notYet(); return; } if(!a.moved) setOpen(open > .05 ? 0 : 1); if(open > .05 && !warned){ warned = true; entry("Robinet ouvert : l'eau coule, le thermomètre est dans le jet."); point(flask.g, 3.3); hint("✋ Maintiens le flacon sous le jet"); } } },
			{ hit:flask.hit, down:() => {
				if(done) return;
				if(!flamed){ notYet(); return; }
				if(open < .05){ hint("👉 Ouvre d'abord le robinet"); wiggle(handle); return; }
				filling = true; tFill = Math.max(tFill, temp());
				moveTo(flask.g, V3(NOZ.x, Y + .02, NOZ.z), 180, .3);
			}, up:() => { if(!filling) return; filling = false; judge(); } }
		];
		hook((now, dt) => {
			if(open > 0){ vflow += open*.75*dt*SPEED; if(vStable === null && temp() - T_NET < .12) vStable = vflow; if(curve.length === 0 || vflow - curve[curve.length - 1][0] > .08) curve.push([vflow, temp()]); }
			if(filling && open > .02){ fill += open*.4*dt; tFill = Math.max(tFill, temp()); flask.set(Math.min(1.05, fill)); if(fill > 1.04){ filling = false; judge(); } }
			if(now - drawT > 100){ drawT = now; if(open > 0 || vflow > 0){ lcd(thermoScr, fr(temp()) + " °C", fr(vflow) + " L écoulés"); readout(); drawCurve(); } }
		});
		function judge(){
			if(done) return;
			if(fill < .72){ hint("✋ Continue jusqu'au trait blanc"); return; }
			if(tFill > T_NET + .3){
				err("prélèvement trop tôt");
				const e = entry(`Flacon rempli à ${fr(tFill)} °C.`); strike(e, "c'est l'eau qui dormait dans le tuyau");
				visa(`À ${fr(tFill)} °C, ce n'est pas l'eau du réseau : c'est celle qui a <b>dormi tout le week-end dans le tuyau</b>, à la température de la pièce. Elle ne dit rien de ce que boivent les élèves à midi. Méthode : on laisse couler <b>jusqu'à ce que la température ne bouge plus</b>, puis on prélève. Regarde la courbe.`);
				fill = 0; tFill = 0; tween(300, e2 => flask.set(1 - e2)); moveTo(flask.g, flask.home, 300, .3); hint("⏳ Attends que la température ne bouge plus"); return;
			}
			if(fill > 1){
				err("flacon trop plein"); const e = entry(`Flacon rempli à ras bord.`); strike(e, "plus d'air sous le bouchon");
				visa("Rempli à ras bord, on ne peut plus agiter l'échantillon avant l'analyse. On vide, on recommence, en s'arrêtant au trait.");
				fill = 0; tFill = 0; tween(300, e2 => flask.set(1 - e2)); return;
			}
			done = true; play("good"); flask.cap.visible = true; moveTo(flask.g, flask.home, 350, .4); setOpen(0); point(null); hint("");
			S.prelDone = true; S.vStable = Math.round(vStable ?? vflow); visa("");
			entry(`Flacon stérile rempli à ${fr(T_NET)} °C, bouché, étiqueté ${SAMPLE}, mis en glacière.`);
			proof("temp", `Au premier jet, ${fr(T_HOT)} °C ; ${fr(T_NET)} °C après ${S.vStable} L : l'eau stagnait dans le tuyau de la cantine.`);
			live(`<p class="lb-p">La courbe descend puis se pose sur un <b>palier</b> : la température du réseau. Il a fallu ${S.vStable} litres pour vider l'eau qui stagnait, tiédie, dans la canalisation de la cantine. Note-le : ça comptera.</p>
				${course("phys")}${first ? "" : next("cl", "Doser le chlore sur place →")}`);
			if(first) later(2200, () => palier({ id:"tp", onEvent, openLead, quit:close,
				titre:"Ton échantillon est prêt. Et l'eau dormait dans les tuyaux de la cantine.",
				texte:"Est-ce elle qui rend les élèves malades ? Dose le chlore, chasse les nitrates, compte les bactéries, observe-les au microscope… puis signe le bulletin d'analyse.",
				suite:"Analyser l'échantillon (≈ 6 min)" }).then(chlore));
		}
	}

	/* ---------- 2 · le chlore, dosé sur place, goutte à goutte ---------- */
	function chlore(){
		stage("cl", "2 · Doser le chlore");
		view(V3(CX - 5.2, Y + 2.6, -3.6), 13.5, 8, 1.15, -.3);
		let V = 0, open = 0, crossOpen = null, tries = 0, done = false, dropT = 0, dropOn = false, prev = 0;
		const setOpen = o => { open = Math.max(0, Math.min(1, o)); cock.rotation.z = open*Math.PI/2; jet.visible = open > .3; };
		const color = () => { const k = Math.pow(Math.max(0, 1 - V/VEQ), .6); erlLiq.material.color.set("#f6f6f4").lerp(new THREE.Color("#ee6fae"), k); };
		const reset = () => { V = 0; crossOpen = null; setOpen(0); color(); burLiq.scale.y = 4.1; erlLiq.scale.y = .4; upd(); };
		page("2 · Sur place · chimie", "Reste-t-il du chlore ?",
			`<p class="lb-p">Le chlore protège l'eau des microbes sur tout le trajet, mais il s'use : on le dose <b>sur place</b>. Dans l'erlenmeyer, 100 mL d'eau et du réactif DPD : le chlore la colore en <b>rose</b>. La solution de la burette (FAS) le détruit : quand le rose disparaît, c'est l'<b>équivalence</b>.</p>
			<p class="lb-p"><b>Tourne le robinet de la burette</b> : glisse vers le haut pour ouvrir (un peu : goutte à goutte, beaucoup : à flot), touche-le pour fermer. Puis note le volume.</p>
			<div class="lb-num"><div><small>FAS versé</small><span data-v>0,00 mL</span></div></div>
			<button class="lb-go" data-a="note">Noter le volume dans le cahier</button>`);
		function upd(){ const el = book.querySelector("[data-v]"); if(el) el.textContent = fr(V, 2) + " mL"; }
		reset();
		point(cock, .9); hint("✋ Glisse le robinet de la burette vers le haut pour l'ouvrir");
		targets = [{ hit:cockHit, down:a => { a.o0 = open; }, move:(a, e) => { if(!done) setOpen(a.o0 + (a.y0 - e.clientY)/160); }, up:a => { if(done) return; point(null); if(!a.moved){ setOpen(open > .02 ? 0 : .12); play("clic"); } hint(open > .02 ? "👆 Touche le robinet pour fermer, puis note le volume" : ""); } }];
		hook((now, dt) => {
			if(open > .02 && !done){
				const rate = .08 + 2.6*open*open;
				V += rate*dt;
				if(prev < VEQ && V >= VEQ) crossOpen = open;
				prev = V; color(); upd();
				burLiq.scale.y = Math.max(.05, 4.1*(1 - V/25)); erlLiq.scale.y = .4 + V/60;
				if(open <= .3 && now - dropT > Math.max(90, 50/(rate*1000)*1000)){ dropT = now; dropOn = true; drop.position.set(CX - 5.6, Y + 1.12, -3.6); drop.visible = true; }
			}
			if(dropOn){ drop.position.y -= dt*7; if(drop.position.y < Y + .5){ drop.visible = false; dropOn = false; } }
		});
		actions.note = () => {
			if(done) return;
			setOpen(0); tries++;
			if(V < VEQ - .04){ err("dosage arrêté trop tôt"); visa("Encore rose, même pâle : il reste du chlore à détruire. Continue, doucement."); return; }
			if((crossOpen !== null && crossOpen > .3) || V > VEQ + .3){
				err("dosage versé à flot");
				const e = entry(`Équivalence à ${fr(V, 2)} mL, soit ${fr(V*K_CL, 2)} mg/L de chlore.`); strike(e, "le rose a disparu pendant que ça coulait à flot");
				visa(`Combien de gouttes de trop étaient déjà tombées quand le rose a disparu ? Impossible à dire, et ta valeur ferait croire à <b>${fr(V*K_CL, 2)} mg/L</b> : de quoi déclarer l'eau protégée. On barre. Nouvel échantillon, et la méthode : <b>à flot jusqu'à 3 mL</b>, puis <b>goutte à goutte</b> jusqu'à ce que le rose s'efface.`);
				later(900, () => { reset(); play("swipe"); hint("💧 À flot jusqu'à 3 mL, puis goutte à goutte"); });
				return;
			}
			done = true; play("good"); point(null); hint(""); visa("");
			S.cl = Math.round(V*100)/100*K_CL;
			entry(`Équivalence à ${fr(V, 2)} mL de FAS${tries > 1 ? ", goutte à goutte" : ""}.`);
			proof("cl", `Chlore libre : ${fr(S.cl, 2)} mg/L au robinet de la cantine (0,3 mg/L à la sortie de l'usine).`);
			const b = book.querySelector('[data-a="note"]'); if(b) b.disabled = true;
			live(`<p class="lb-p">${fr(V, 2)} mL × 0,01 = <b>${fr(S.cl, 2)} mg/L</b>. Le distributeur mesure 0,3 mg/L à la sortie de l'usine. Ici, presque plus rien : dans l'eau immobile, le chlore s'est usé, et plus rien ne tient les microbes en respect.</p>
				${course("chimie")}${tries > 1 ? course("metho") : ""}${next("nit", "Rapporter le flacon au labo →")}`);
			scrollEnd();
		};
	}

	/* ---------- 3 · les nitrates : zéro, étalons, droite d'étalonnage ---------- */
	function nitrates(){
		stage("nit", "3 · Les nitrates");
		view(V3(-8.4, Y + 1, -3.2), 11, 7.6, 1.0, .1);
		let zeroed = false, inSlot = null, busy = false, slope = .006, lineOk = false, sampleA = null, cRead = null, done = false, mode = null;
		const pts = {};
		CUVES.forEach(q => q.g.position.copy(q.home));
		const disp = (a, sub) => lcd(specScr, a === null ? "— — —" : "A = " + fr(a, 3), sub || "λ = 415 nm");
		disp(null, zeroed ? "zéro fait" : "pas de zéro");
		page("3 · Au labo · physique, chimie, maths", "Les nitrates des champs ?",
			`<p class="lb-p">Les parents accusent les champs d'à côté : leurs engrais lâchent des <b>nitrates</b> dans l'eau. Plus il y en a, plus l'eau traitée par le réactif jaunit, et plus elle <b>absorbe la lumière</b> du spectrophotomètre (son absorbance A). Pour traduire A en concentration, il faut une <b>droite d'étalonnage</b>.</p>
			<p class="lb-p"><b>Touche une cuve</b> pour la mettre dans l'appareil : le blanc (eau et réactif, sans nitrates), puis les étalons à 10, 25 et 50 mg/L, enfin ton échantillon.</p>
			<canvas class="lb-graph" width="640" height="400" data-g aria-label="Absorbance en fonction de la concentration en nitrates"></canvas>`);
		point(CUVES[0].g, 1.9); hint("👆 Mets le blanc dans l'appareil");
		const gc = book.querySelector("[data-g]");
		const GP = (c, a) => [64 + c/60*(640 - 90), 400 - 50 - a/.8*(400 - 80)];
		function draw(){
			const x = gc.getContext("2d"), w = 640, h = 400; x.clearRect(0, 0, w, h);
			x.strokeStyle = "rgba(33,183,203,.25)"; x.lineWidth = 1;
			for(let c = 0; c <= 60; c += 10){ const [X] = GP(c, 0); x.beginPath(); x.moveTo(X, 30); x.lineTo(X, h - 50); x.stroke(); }
			for(let a = 0; a <= .8; a += .1){ const [, Yy] = GP(0, a); x.beginPath(); x.moveTo(64, Yy); x.lineTo(w - 26, Yy); x.stroke(); }
			x.strokeStyle = "#0f3168"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(...GP(0, .8)); x.lineTo(...GP(0, 0)); x.lineTo(...GP(60, 0)); x.stroke();
			x.fillStyle = "#5b6b85"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText("A", 30, 34); x.fillText("nitrates (mg/L)", w - 170, h - 12);
			for(const c of [0, 25, 50]){ const [X] = GP(c, 0); x.fillText(c, X - 8, h - 30); }
			for(const a of [.2, .4, .6]){ const [, Yy] = GP(0, a); x.fillText(fr(a), 18, Yy + 6); }
			if(mode){ x.strokeStyle = lineOk ? "#21b7cb" : "#13808f"; x.lineWidth = 4; x.beginPath(); x.moveTo(...GP(0, 0)); x.lineTo(...GP(60, slope*60)); x.stroke();
				if(!lineOk){ const [X, Yy] = GP(55, slope*55); x.fillStyle = "#21b7cb"; x.beginPath(); x.arc(X, Yy, 14, 0, 7); x.fill(); x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.stroke(); } }
			if(sampleA !== null){ x.setLineDash([8, 6]); x.strokeStyle = "#b91c1c"; x.lineWidth = 2; const [, Yy] = GP(0, sampleA); x.beginPath(); x.moveTo(64, Yy); x.lineTo(w - 26, Yy); x.stroke();
				if(cRead !== null){ const [X, Y2] = GP(cRead, slope*cRead); x.beginPath(); x.moveTo(X, h - 50); x.lineTo(X, Y2); x.stroke(); x.setLineDash([]); x.fillStyle = "#b91c1c"; x.beginPath(); x.arc(X, Y2, 9, 0, 7); x.fill(); x.font = "700 20px Inter,Arial,sans-serif"; x.fillText(fr(cRead, 0) + " mg/L", X + 10, h - 58); }
				x.setLineDash([]); }
			for(const [c, a] of Object.entries(pts)){ const [X, Yy] = GP(+c, a); x.fillStyle = "#0f3168"; x.beginPath(); x.arc(X, Yy, 8, 0, 7); x.fill(); }
		}
		draw();
		const gpos = e => { const r = gc.getBoundingClientRect(); const px = (e.clientX - r.left)/r.width*640, py = (e.clientY - r.top)/r.height*400; return [(px - 64)/(640 - 90)*60, (400 - 50 - py)/(400 - 80)*.8]; };
		let gdrag = false;
		gc.addEventListener("pointerdown", e => { if(!mode || done) return; gdrag = true; try { gc.setPointerCapture(e.pointerId); } catch(x){} gmove(e); });
		gc.addEventListener("pointermove", e => { if(gdrag) gmove(e); });
		const gup = () => { if(!gdrag) return; gdrag = false; gjudge(); };
		gc.addEventListener("pointerup", gup); gc.addEventListener("pointercancel", gup);
		function gmove(e){
			const [c, a] = gpos(e);
			if(mode === "line" && !lineOk){ if(c > 4) slope = Math.max(.002, Math.min(.03, a/c)); }
			else if(mode === "read" && sampleA !== null){ cRead = Math.max(0, Math.min(60, c)); }
			draw();
		}
		function gjudge(){
			if(mode === "line" && !lineOk){
				const rms = Math.sqrt(STD.reduce((s, [c, a]) => s + (a - slope*c)**2, 0)/STD.length);
				if(rms > .02){ hint("✋ Rapproche la droite des points"); visa("Ta droite passe à côté des points : elle doit passer par l'origine (le blanc) et au plus près des trois étalons."); return; }
				lineOk = true; play("good"); visa(""); draw();
				entry(`Droite d'étalonnage : A = ${fr(slope, 4)} × C (passe par l'origine et par les trois étalons).`);
				point(CUVES[4].g, 1.9); hint("👆 Mesure ton échantillon");
				return;
			}
			if(mode === "read" && sampleA !== null && cRead !== null){
				if(Math.abs(slope*cRead - sampleA) > .012){ hint("✋ Ton point doit être à la hauteur de la ligne rouge"); return; }
				done = true; S.nit = Math.round(sampleA/slope); play("good"); hint(""); point(null);
				proof("nit", `Nitrates : ${S.nit} mg/L, pour une limite de 50 mg/L. La piste des champs ne tient pas.`);
				live(`<p class="lb-p">L'échantillon absorbe ${fr(sampleA, 3)} : sur ta droite, c'est <b>${S.nit} mg/L</b> de nitrates, bien sous la limite de 50 mg/L. Les champs ne sont pas en cause : c'est une <b>fausse piste</b>, et l'écarter preuve à l'appui fait aussi partie du métier.</p>
					${course("maths")}${next("bac", "Chercher les bactéries →")}`);
				scrollEnd();
			}
		}
		function slotIn(q){
			busy = true; play("pop"); point(null);
			const go = () => moveTo(q.g, SLOT, 450, 1.2, () => { inSlot = q; later(500, () => { busy = false; read(q); }); });
			if(inSlot && inSlot !== q){ const o = inSlot; inSlot = null; moveTo(o.g, o.home, 350, .8, go); } else go();
		}
		function back(q, ms = 900){ later(ms, () => { if(inSlot === q){ inSlot = null; moveTo(q.g, q.home, 350, .8); } }); }
		function read(q){
			const a = q.id === "blanc" ? 0 : q.a;
			const shown = zeroed ? a : a + A_BLANK;
			disp(shown, zeroed ? "zéro fait" : "pas de zéro");
			if(q.id === "blanc"){
				if(zeroed){ hint(""); back(q, 600); return; }
				point(zeroKey, 1.3); hint("👆 Appuie sur ZÉRO"); return;
			}
			if(q.id === "ech"){
				if(!lineOk){ visa("D'abord la droite d'étalonnage : sans elle, une absorbance ne dit rien de la concentration."); back(q); return; }
				sampleA = a; mode = "read"; entry(`Échantillon ${SAMPLE} : A = ${fr(a, 3)}.`); draw(); hint("✋ Dans le cahier, glisse sur la ligne rouge jusqu'à la droite"); back(q, 1200); return;
			}
			if(!zeroed){
				err("mesure sans zéro");
				const e = entry(`Étalon ${q.c} mg/L : A = ${fr(shown, 3)}.`); strike(e, "appareil pas mis à zéro");
				visa(`L'appareil n'a pas été mis à zéro : il compte aussi la lumière absorbée par la cuve et le réactif (${fr(A_BLANK, 3)}). Tous tes points seraient décalés. Méthode : <b>le blanc d'abord, puis ZÉRO</b>, et seulement ensuite les étalons.`);
				back(q, 700); later(800, () => { point(CUVES[0].g, 1.9); hint("👆 Mets le blanc dans l'appareil"); }); return;
			}
			if(pts[q.c] === undefined){ pts[q.c] = a; entry(`Étalon ${q.c} mg/L : A = ${fr(a, 3)}.`); draw(); }
			back(q, 700);
			if(STD.every(([c]) => pts[c] !== undefined) && !mode){
				pts[0] = 0; mode = "line"; draw(); point(null); hint("✋ Dans le cahier, fais tourner la droite (point cyan)");
				visa("Trois étalons et le blanc. Les points s'alignent : l'absorbance est <b>proportionnelle</b> à la concentration. Trace la droite qui passe par l'origine, au plus près des points.");
			} else if(!mode){ const n = CUVES.find(c => c.c && pts[c.c] === undefined); if(n) point(n.g, 1.9); hint("👆 Mesure les étalons"); }
		}
		targets = [
			...CUVES.map(q => ({ hit:q.hit, tap:() => { if(busy || done || inSlot === q) return; slotIn(q); } })),
			{ hit:zeroHit, tap:() => {
				play("clic");
				if(!inSlot){ hint("👆 Mets d'abord le blanc dans l'appareil"); return; }
				if(inSlot.id !== "blanc"){ err("zéro sur un étalon"); visa("Le zéro se fait sur le <b>blanc</b> (eau et réactif, sans nitrates), jamais sur un étalon : sinon tout serait décalé."); return; }
				if(zeroed) return;
				zeroed = true; disp(0, "zéro fait"); entry("Zéro fait sur le blanc (cuve + réactif)."); back(inSlot, 500);
				later(600, () => { point(CUVES[1].g, 1.9); hint("👆 Mesure les étalons"); });
			} }
		];
	}

	/* ---------- 4 · les bactéries : filtrer, incuber, compter ---------- */
	function bacteries(){
		stage("bac", "4 · Les bactéries");
		view(V3(1.2, Y + 1.2, -3.2), 12, 8, 1.0, .1);
		let pass = S.bacPass || 1, vol = 0, pouring = false, pourT = 0, phase = "pour", counted = 0, done = false;
		COLS.forEach(c => { c.mark = false; c.miss = false; });
		dish.visible = false; dish.position.copy(DISH_HOME); funLiq.visible = false; flask2.g.position.copy(flask2.home); flask2.g.rotation.set(0, 0, 0); flask2.set(.85); door.rotation.y = 0;
		lcd(etuveScr, "36,0 °C", "étuve", "#ffd27a");
		const target = () => pass === 1 ? 100 : 10;
		page("4 · Au labo · biologie", "Des bactéries dans l'eau ?",
			`<p class="lb-p">Les microbes de la gastro viennent souvent d'une pollution par des matières fécales. Leur témoin : la bactérie <b>E. coli</b>. On filtre l'eau sur une membrane qui retient les bactéries, on la pose sur une gélose, et en une nuit à 36 °C, chaque bactérie devient une <b>colonie</b> visible : bleue pour E. coli, rose pour les autres coliformes.</p>
			<p class="lb-p" data-proto><b>Protocole : filtre ${target()} mL.</b> Maintiens ton flacon pour verser jusqu'au trait.</p>
			<div class="lb-num"><div><small>eau dans l'entonnoir</small><span data-v>0 mL</span></div><div><small>E. coli comptées</small><span data-n>—</span></div></div>`);
		const upd = () => { const v = book.querySelector("[data-v]"); if(v) v.textContent = Math.round(vol) + " mL"; const n = book.querySelector("[data-n]"); if(n && phase === "count") n.textContent = counted; };
		point(flask2.g, 3.3); hint(`✋ Maintiens le flacon pour verser ${target()} mL`);
		const POUR = V3(-.2, Y + 3.9, -4.1);
		function drawDish(mode){
			dishTex.redraw((x, w, h) => {
				x.clearRect(0, 0, w, h); x.fillStyle = "#e9dcb4"; x.beginPath(); x.arc(w/2, h/2, w/2, 0, 7); x.fill();
				x.fillStyle = "#f6f5ef"; x.beginPath(); x.arc(w/2, h/2, w*.42, 0, 7); x.fill();
				x.save(); x.beginPath(); x.arc(w/2, h/2, w*.42, 0, 7); x.clip();
				x.strokeStyle = "rgba(60,90,130,.3)"; x.lineWidth = 1.5;
				for(let i = 0; i < w; i += 30){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
				if(mode === "over"){ const r = rng(7); for(let i = 0; i < 560; i++){ const a = r()*7, d = Math.sqrt(r())*w*.42; x.fillStyle = r() < .7 ? "rgba(51,71,159,.85)" : "rgba(214,71,140,.85)"; x.beginPath(); x.arc(w/2 + Math.cos(a)*d, h/2 + Math.sin(a)*d, 5 + r()*8, 0, 7); x.fill(); } }
				if(mode === "count") for(const c of COLS){
					const cx = c.x*w, cy = c.y*h, R = c.r*w;
					x.fillStyle = c.blue ? "#33479f" : "#d6478c"; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
					x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.arc(cx - R*.3, cy - R*.3, R*.35, 0, 7); x.fill();
					if(c.mark){ x.fillStyle = "#111"; x.beginPath(); x.arc(cx, cy, R*.45, 0, 7); x.fill(); }
					if(c.miss){ x.strokeStyle = "#b91c1c"; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - R, cy - R); x.lineTo(cx + R, cy + R); x.moveTo(cx + R, cy - R); x.lineTo(cx - R, cy + R); x.stroke(); }
				}
				x.restore();
			});
		}
		function startPour(){
			if(phase !== "pour") return;
			pouring = true; pourT = 0; point(null);
			moveTo(flask2.g, POUR, 220, .3); tween(220, e => flask2.g.rotation.z = e*1.9);
		}
		function stopPour(){
			if(!pouring) return; pouring = false; pourJet.visible = false;
			moveTo(flask2.g, flask2.home, 300, .3); tween(300, e => flask2.g.rotation.z = 1.9*(1 - e));
			const t = target();
			if(vol < t*.85){ hint(`✋ Continue jusqu'au trait des ${t} mL`); return; }
			if(vol > t*1.2){
				err("trop d'eau filtrée");
				const e = entry(`${Math.round(vol)} mL versés au lieu de ${t}.`); strike(e, "volume au-delà du trait");
				visa(`Trop versé : le résultat se ramène à un volume précis. On vide l'entonnoir et on recommence${t === 10 ? ", doucement : 10 mL, c'est quelques secondes" : ""}.`);
				later(500, () => { vol = 0; funLiq.visible = false; upd(); point(flask2.g, 3.3); }); return;
			}
			phase = "filter"; hint(""); play("swipe");
			const v0 = vol; tween(1200, e => { vol = v0*(1 - e); funLiq.scale.y = Math.max(.01, FUN_H*vol/100); upd(); }, () => {
				funLiq.visible = false;
				entry(`${Math.round(v0)} mL filtrés ; membrane posée sur gélose chromogène à la pince flambée.`);
				dish.visible = true; drawDish("none"); dish.position.copy(DISH_HOME); dish.scale.setScalar(.01);
				tween(350, e => dish.scale.setScalar(Math.max(.01, e)));
				phase = "incub"; point(dish, 1.2); hint("👆 Mets la boîte à l'étuve");
			});
		}
		function incubate(){
			if(phase !== "incub") return;
			phase = "wait"; point(null); hint(""); play("pop");
			tween(500, e => door.rotation.y = -e*1.6);
			moveTo(dish, V3(etuve.position.x, Y + 1.1, etuve.position.z), 600, 1.4, () => {
				tween(400, e => door.rotation.y = -1.6*(1 - e));
				const t0 = performance.now();
				const off = W.onFrame(now => { const h = Math.min(21, (now - t0)/2600*SPEED*21); lcd(etuveScr, `${Math.floor(h)} h`, "36,0 °C", "#ffd27a"); });
				later(2700, () => {
					off(); lcd(etuveScr, "21 h", "36,0 °C", "#ffd27a"); S.clock += 21*60; drawDish(pass === 1 ? "over" : "count");
					tween(400, e => door.rotation.y = -e*1.6);
					moveTo(dish, V3(-1.3, Y + .05, -2.4), 600, 1.4, () => { tween(400, e => door.rotation.y = -1.6*(1 - e)); look(); });
				});
			});
		}
		function look(){
			view(V3(-1.3, Y, -2.4), 5.2, 4.2, .12, 0);
			if(pass === 1){
				const e = entry("Boîte n° 1 (100 mL) : des centaines de colonies, qui se touchent.", { min:2 }); strike(e, "indénombrable : rien de prouvé");
				visa("Au-delà de 300 colonies, elles se chevauchent : on ne peut plus compter, donc <b>on ne peut rien prouver</b>. Ce n'est pas un échec, c'est une information : l'eau est très chargée. Méthode : filtrer <b>dix fois moins d'eau</b>, 10 mL, puis multiplier par 10 pour revenir à 100 mL.");
				append(`<button class="lb-go" data-a="redo">Refaire avec 10 mL</button>`); return;
			}
			phase = "count"; upd(); hint("👆 Touche chaque colonie bleue pour la pointer au feutre");
			visa("On ne compte que les <b>bleues</b> (E. coli) : chaque colonie pointée reçoit un point de feutre, pour ne pas la compter deux fois.");
		}
		actions.redo = () => {
			if(pass !== 1) return; pass = 2; S.bacPass = 2; play("pop"); visa("");
			const b = book.querySelector('[data-a="redo"]'); if(b) b.remove();
			dish.visible = false; vol = 0; phase = "pour"; upd();
			const p = book.querySelector("[data-proto]"); if(p) p.innerHTML = `<b>Protocole corrigé : filtre 10 mL.</b> Maintiens ton flacon, et lâche tôt.`;
			view(V3(1.2, Y + 1.2, -3.2), 12, 8, 1.0, .1); point(flask2.g, 3.3); hint("✋ Verse 10 mL seulement");
		};
		function countTap(a){
			if(phase !== "count" || done) return;
			const uv = a.h.uv; if(!uv) return;
			const px = uv.x, py = 1 - uv.y;
			let best = null, bd = .075;
			for(const c of COLS){ const d = Math.hypot(c.x - px, c.y - py); if(d < bd){ bd = d; best = c; } }
			if(!best) return;
			if(!best.blue){ if(!best.miss){ best.miss = true; err("colonie rose comptée"); visa("Rose : c'est un autre coliforme, pas E. coli. On ne pointe que les colonies <b>bleues</b>."); drawDish("count"); } return; }
			if(best.mark){ hint("Déjà pointée"); return; }
			best.mark = true; counted++; play("pop"); drawDish("count"); upd();
			if(counted === N_BLUE){
				done = true; hint(""); S.ecoli = N_BLUE*10; S.colis = (N_BLUE + N_PINK)*10;
				proof("ecoli", `E. coli : ${N_BLUE} colonies dans 10 mL, soit ${S.ecoli} par 100 mL (limite : 0).`);
				entry(`Coliformes (bleues + roses) : ${N_BLUE + N_PINK} dans 10 mL, soit ${S.colis} par 100 mL.`, { min:1 });
				visa("");
				live(`<p class="lb-p">${N_BLUE} colonies dans 10 mL, donc <b>${N_BLUE} × 10 = ${S.ecoli} E. coli par 100 mL</b>. La limite de l'eau potable est de <b>zéro</b>. L'eau de la cantine a été souillée par une pollution d'origine fécale.</p>
					${course("svtu")}${pass === 2 ? course("metho") : ""}${next("mic", "Confirmer au microscope →")}`);
				scrollEnd();
			}
		}
		targets = [
			{ hit:flask2.hit, down:startPour, up:stopPour },
			{ hit:dishTop, tap:a => { if(phase === "incub") incubate(); else countTap(a); } }
		];
		hook((now, dt) => {
			if(!pouring) return;
			pourT += dt;
			const t = target(), rate = vol < t*.7 ? (t > 50 ? 26 : 10) : (t > 50 ? 8 : 3);       // à flot, puis doucement à l'approche du trait
			vol += rate*dt; funLiq.visible = true; funLiq.scale.y = Math.max(.01, FUN_H*Math.min(vol, 125)/100); upd();
			flask2.set(Math.max(.1, .85 - vol/200));
			pourJet.visible = true; stick(pourJet, V3(POUR.x - .9, POUR.y + .6, POUR.z), V3(-1, Y + .9 + FUN_H*Math.min(vol, 110)/100, -4.1));
			if(vol > 130) stopPour();
		});
	}

	/* ---------- 5 · le microscope : mise au point, ×100 à immersion, mesurer ---------- */
	function microscope(){
		stage("mic", "5 · Le microscope");
		view(V3(10.2, Y + 2, -3.4), 8.5, 6.4, 1.05, -.25);
		let obj = 10, oiled = false, focus = 12, measured = null, done = false, oilWarned = false, oilT = 0;
		turret.rotation.y = 0;
		page("5 · Au labo · biologie, optique", "À quoi ressemblent-elles ?",
			`<p class="lb-p">On prélève une colonie bleue, on l'étale sur une lame et on la colore (coloration de Gram). Au microscope, on vérifie la <b>forme</b> et la <b>taille</b> de la bactérie.</p>
			<p class="lb-p"><b>Fais tourner la vis de mise au point</b> (glisse vers le haut ou le bas), change d'<b>objectif</b>, puis touche une bactérie dans l'oculaire pour la mesurer.</p>
			<canvas class="lb-eye" width="260" height="260" aria-label="Ce que l'on voit dans l'oculaire"></canvas>
			<div class="lb-num"><div><small>objectif</small><span data-o>×10</span></div><div><small>netteté</small><span data-f>floue</span></div></div>`);
		const eye = book.querySelector(".lb-eye");
		const tgt = () => obj === 10 ? 40 : 52;
		const sharp = () => Math.abs(focus - tgt()) < 4 && (obj === 10 || oiled);
		function draw(){
			const x = eye.getContext("2d"), off = Math.abs(focus - tgt()) + (obj === 100 && !oiled ? 16 : 0);
			x.save(); x.clearRect(0, 0, 260, 260); x.beginPath(); x.arc(130, 130, 130, 0, 7); x.clip();
			x.fillStyle = "#f4eef2"; x.fillRect(0, 0, 260, 260);
			x.filter = `blur(${Math.min(10, off/2.2)}px)`;
			if(obj === 10){ x.fillStyle = "#c2417f"; for(const b of RODS) for(let k = 0; k < 3; k++){ x.beginPath(); x.arc((b.x*.37 + k*71) % 250 + 5, (b.y*.41 + k*89) % 250 + 5, 1.8, 0, 7); x.fill(); } }
			else { x.strokeStyle = "#c2417f"; x.lineCap = "round"; x.lineWidth = 10; for(const b of RODS){ const dx = Math.cos(b.a)*b.l/2, dy = Math.sin(b.a)*b.l/2; x.beginPath(); x.moveTo(b.x - dx, b.y - dy); x.lineTo(b.x + dx, b.y + dy); x.stroke(); } }
			x.filter = "none";
			if(obj === 100 && !oiled){ x.fillStyle = "rgba(10,14,24,.55)"; x.fillRect(0, 0, 260, 260); }
			if(measured){ const b = measured, dx = Math.cos(b.a)*b.l/2, dy = Math.sin(b.a)*b.l/2;
				x.strokeStyle = "#21b7cb"; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x - dx, b.y - dy + 16); x.lineTo(b.x + dx, b.y + dy + 16); x.stroke();
				x.fillStyle = "#0f3168"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText("2 µm", b.x + 14, b.y + 40); }
			x.restore();
			const o = book.querySelector("[data-o]"), f = book.querySelector("[data-f]");
			if(o) o.textContent = "×" + obj + (obj === 100 ? (oiled ? " · huile" : " · sans huile") : "");
			if(f) f.textContent = sharp() ? "nette" : "floue";
		}
		draw();
		point(knob, 1.1); hint("✋ Glisse sur la vis de mise au point");
		eye.addEventListener("pointerdown", e => {
			if(done) return;
			const r = eye.getBoundingClientRect(), px = (e.clientX - r.left)/r.width*260, py = (e.clientY - r.top)/r.height*260;
			if(obj === 10){ visa("À ×10, les bactéries ne sont que des points : impossible de les mesurer. Passe au fort grossissement."); point(turret, 1); return; }
			if(!sharp()){ hint("✋ Fais d'abord la mise au point"); return; }
			let best = null, bd = 40; for(const b of RODS){ const d = Math.hypot(b.x - px, b.y - py); if(d < bd){ bd = d; best = b; } }
			if(!best) return;
			measured = best; done = true; play("good"); draw(); hint(""); point(null);
			proof("gram", "Bacilles roses (Gram négatif) de 2 µm sur 0,5 µm : c'est bien la forme d'E. coli.");
			live(`<p class="lb-p">Des <b>bâtonnets</b> (bacilles) roses après la coloration de Gram, longs de 2 µm, un demi-millième de millimètre : ce sont des <b>cellules sans noyau</b>, des bactéries. Leur forme confirme ce que disait la gélose : E. coli.</p>
				${course("svtu")}${next("bul", "Remplir et signer le bulletin →")}`);
			scrollEnd();
		});
		targets = [
			{ hit:knobHit, down:a => { a.f0 = focus; }, move:(a, e) => { focus = Math.max(0, Math.min(100, a.f0 + (a.y0 - e.clientY)*.25)); knob.rotation.x = focus*.08; draw(); if(sharp() && obj === 10 && !S.micFocus10){ S.micFocus10 = true; entry("Mise au point à ×10 : des petits points roses."); point(turret, 1); hint("👆 Passe à l'objectif ×100"); } }, up:() => { if(obj === 100 && !oiled && Math.abs(focus - tgt()) < 6 && !oilWarned){ oilWarned = true; oilHelp(); } } },
			{ hit:turretHit, tap:() => {
				obj = obj === 10 ? 100 : 10; play("clic"); tween(300, e => turret.rotation.y = (obj === 100 ? e : 1 - e)*Math.PI); draw();
				if(obj === 100 && !oiled){ point(knob, 1.1); hint("✋ Refais la mise au point"); oilT = performance.now(); later(3500, () => { if(obj === 100 && !oiled && !oilWarned){ oilWarned = true; oilHelp(); } }); }
				else if(obj === 100 && oiled) hint("✋ Ajuste la mise au point");
			} },
			{ hit:oilHit, tap:() => {
				if(oiled) return; play("pop");
				const home = oil.position.clone();
				moveTo(oil, V3(mic.position.x, Y + 2.3, mic.position.z + .1), 400, .6, () => { later(300, () => moveTo(oil, home, 400, .6)); oiled = true; entry("Une goutte d'huile à immersion sur la lame."); draw(); point(knob, 1.1); hint(obj === 100 ? "✋ Ajuste la mise au point" : "👆 Passe à l'objectif ×100"); visa(""); });
			} }
		];
		function oilHelp(){ err("×100 sans huile"); visa("Sans huile, l'image reste sombre et floue : la lumière se disperse dans l'air entre la lame et l'objectif ×100. Méthode : <b>une goutte d'huile à immersion</b>, qui a le même indice que le verre."); point(oil, 1.4); hint("👆 Dépose une goutte d'huile"); }
	}

	/* ---------- 6 · le bulletin d'analyse : juger, puis signer ---------- */
	function bulletin(){
		stage("bul", "6 · Le bulletin d'analyse");
		view(V3(14.6, Y, -3.6), 10, 8.4, .2, 0);
		bul.visible = bulPaper.visible = true;
		const cl = S.cl ?? .04, nit = S.nit ?? 19, ecoli = S.ecoli ?? 140, colis = S.colis ?? 200;
		const ROWS = [
			["Nitrates", `${nit} mg/L`, "≤ 50 mg/L", "C", "19 mg/L pour une limite de 50 mg/L : c'est sous la limite, donc conforme."],
			["Escherichia coli", `${ecoli} /100 mL`, "0 /100 mL", "NC", `${ecoli} pour une limite de 0 : il ne doit y en avoir aucune.`],
			["Coliformes totaux", `${colis} /100 mL`, "0 /100 mL", "NC", "Les coliformes, bleus et roses, doivent eux aussi être absents."],
			["Chlore libre", `${fr(cl, 2)} mg/L`, "repère ≥ 0,1", "NC", "Sous le repère du réseau : le chlore ne protège plus l'eau."]
		];
		const mark = ROWS.map(() => "");
		let strokes = [], ink = 0, signed = false, drawing = false, lastP = null;
		const RY = i => 340 + i*92, SIG = [870, 760, 1350, 960];
		const verdict = () => mark.every(Boolean) ? (mark.includes("NC") ? "EAU NON CONFORME : NE PAS BOIRE" : "Eau conforme aux limites de qualité") : "";
		function draw(){
			bulTex.redraw((x, w, h) => {
				x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
				x.fillStyle = "#0f3168"; x.fillRect(0, 0, w, 110);
				x.fillStyle = "#fff"; x.font = "300 44px 'Tiempos Headline',Times New Roman,serif"; x.fillText("Bulletin d'analyse", 50, 70);
				x.font = "700 22px Inter,Arial,sans-serif"; x.textAlign = "right"; x.fillText(`Laboratoire des eaux (fictif) · n° ${SAMPLE}`, w - 50, 68); x.textAlign = "left";
				x.fillStyle = "#22335a"; x.font = "300 24px Inter,Arial,sans-serif";
				x.fillText("Prélèvement : école élémentaire des Tilleuls (fictive), robinet de la cantine, lundi 8 h 52", 50, 160);
				x.fillText(`Température au prélèvement : ${fr(T_NET)} °C (${fr(T_HOT)} °C au premier jet)`, 50, 200);
				x.font = "700 20px Inter,Arial,sans-serif"; x.fillStyle = "#5b6b85";
				[["PARAMÈTRE", 50], ["RÉSULTAT", 470], ["LIMITE / RÉFÉRENCE", 760], ["CONFORMITÉ", 1080]].forEach(([t, X]) => x.fillText(t, X, 280));
				ROWS.forEach((r, i) => {
					const y = RY(i);
					x.fillStyle = i % 2 ? "#fffdf8" : "#f1f5f9"; x.fillRect(40, y - 40, w - 80, 86);
					x.fillStyle = "#0f3168"; x.font = "700 28px Inter,Arial,sans-serif"; x.fillText(r[0], 50, y + 10);
					x.font = "700 30px Inter,Arial,sans-serif"; x.fillText(r[1], 470, y + 10);
					x.font = "300 26px Inter,Arial,sans-serif"; x.fillText(r[2], 760, y + 10);
					const m = mark[i];
					x.strokeStyle = m ? (m === "C" ? "#2f6b45" : "#b91c1c") : "#21b7cb"; x.lineWidth = 4; x.setLineDash(m ? [] : [10, 8]);
					x.beginPath(); x.roundRect(1070, y - 30, 270, 66, 10); x.stroke(); x.setLineDash([]);
					x.fillStyle = m === "C" ? "#2f6b45" : m === "NC" ? "#b91c1c" : "#13808f"; x.font = `700 ${m ? 26 : 22}px Inter,Arial,sans-serif`; x.textAlign = "center";
					x.fillText(m === "C" ? "Conforme" : m === "NC" ? "Non conforme" : "touche ici", 1205, y + 12); x.textAlign = "left";
				});
				const v = verdict();
				x.fillStyle = "#0f3168"; x.font = "700 22px Inter,Arial,sans-serif"; x.fillText("CONCLUSION", 50, 740);
				x.fillStyle = v.startsWith("EAU NON") ? "#b91c1c" : "#2f6b45"; x.font = "700 30px Inter,Arial,sans-serif"; x.fillText(v || "…", 50, 785);
				x.fillStyle = "#22335a"; x.font = "300 21px Inter,Arial,sans-serif";
				if(v.startsWith("EAU NON")){ ["Eau restée stagnante dans la canalisation de la cantine,", "chlore épuisé : contamination d'origine fécale.", "Nitrates conformes (piste des champs écartée)."].forEach((t, i) => x.fillText(t, 50, 830 + i*32)); }
				x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.strokeRect(SIG[0], SIG[1], SIG[2] - SIG[0], SIG[3] - SIG[1]);
				x.fillStyle = "#5b6b85"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText("SIGNATURE DU TECHNICIEN · DE LA TECHNICIENNE", SIG[0] + 14, SIG[1] + 30);
				x.strokeStyle = "#0f3168"; x.lineWidth = 5; x.lineCap = "round"; x.lineJoin = "round";
				for(const s of strokes){ x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
				if(signed){ x.save(); x.translate(1130, 712); x.rotate(-.08); x.scale(.75, .75); x.strokeStyle = x.fillStyle = "#2f6b45"; x.lineWidth = 6; x.globalAlpha = .85; x.strokeRect(-150, -42, 300, 84); x.font = "700 40px Inter,Arial,sans-serif"; x.textAlign = "center"; x.fillText("VALIDÉ", 0, 14); x.restore(); }
			});
		}
		draw();
		page("6 · Le verdict", "Le bulletin d'analyse",
			`<p class="lb-p">Tout est dans ton cahier. Sur le bulletin, <b>touche chaque case de la colonne Conformité</b> pour juger le résultat face à sa limite. Puis <b>signe</b> dans le cadre : ta signature engage le laboratoire. La mairie fermera, ou non, l'eau de la cantine sur ta parole.</p>
			<ul class="lb-list">${S.proofs.length ? S.proofs.map(p => `<li>${p[1]}</li>`).join("") : "<li>(preuves des étapes précédentes)</li>"}</ul>`);
		hint("👆 Touche les cases de la colonne Conformité");
		const uvPx = h => h.uv ? [h.uv.x*BW, (1 - h.uv.y)*BH] : null;
		const inSig = p => p && p[0] > SIG[0] && p[0] < SIG[2] && p[1] > SIG[1] && p[1] < SIG[3];
		targets = [{ hit:bul,
			down:(a, e) => {
				if(signed) return;
				const p = uvPx(a.h);
				if(!inSig(p)) return;
				if(!mark.every(Boolean)){ visa("Avant de signer, remplis toute la colonne <b>Conformité</b>."); return; }
				const bad = ROWS.findIndex((r, i) => mark[i] !== r[3]);
				if(bad >= 0){ err("bulletin faux"); visa(`Le stylo s'arrête. Relis la ligne <b>${ROWS[bad][0]}</b> : ${ROWS[bad][4]}`); return; }
				drawing = true; strokes.push([p]); lastP = p;
			},
			move:(a, e) => {
				if(!drawing) return; setRay(e);
				const h = ray.intersectObject(bul)[0]; const p = h && uvPx(h); if(!inSig(p)) return;
				ink += Math.hypot(p[0] - lastP[0], p[1] - lastP[1]); lastP = p; strokes[strokes.length - 1].push(p); draw();
			},
			up:() => {
				if(!drawing) return; drawing = false;
				if(ink < 260){ hint("✍️ Signe en entier dans le cadre"); return; }
				signed = true; play("tampon"); draw(); hint(""); entry("Bulletin signé et transmis à la mairie et à l'Agence régionale de santé.", { min:6 }); later(1300, fin);
			},
			tap:a => {
				if(signed) return;
				const p = uvPx(a.h); if(!p) return;
				const i = ROWS.findIndex((r, k) => p[0] > 1060 && p[0] < 1350 && Math.abs(p[1] - RY(k)) < 44);
				if(i < 0){ if(!inSig(p) && mark.every(Boolean)) hint("✍️ Signe dans le cadre, en bas à droite"); return; }
				mark[i] = mark[i] === "C" ? "NC" : "C"; play("clic"); draw();
				if(mark.every(Boolean)) hint("✍️ Signe dans le cadre, en bas à droite");
			}
		}];
	}

	/* ---------- bilan ---------- */
	function fin(){
		stage("end", "Bilan");
		view(V3(14.6, Y, -3.4), 9, 8, .5, 0);
		bul.visible = bulPaper.visible = true;
		play("win");
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 7 ? "Bien" : "Assez bien";
		ev("win", mention);
		const order = ["phys", "chimie", "maths", "svtu", "metho"].filter(k => S.learned.has(k));
		page(`${formation.name} · bilan`, "Bulletin signé",
			`<span class="lb-done">ANALYSE VALIDÉE</span>
			<p class="lb-p">L'eau de la cantine était bien en cause. Sur ta signature, la mairie coupe le robinet ; le réseau de l'école est <b>purgé et rechloré</b>, et les élèves boivent de l'eau en bouteille jusqu'à une nouvelle analyse, conforme. Les nitrates des champs ? Hors de cause, preuve à l'appui.</p>
			<table class="lb-tbl"><tr><td>Mention</td><td>${mention}</td></tr><tr><td>Preuves au cahier</td><td>${S.proofs.length} / 5</td></tr><tr><td>Lignes barrées, erreurs</td><td>${e}</td></tr></table>
			<p class="lb-p">Tu as fait le travail d'un·e technicien·ne d'analyse : prélever, doser, étalonner, compter, observer, conclure. Et plusieurs fois, le premier essai a raté : on a barré, compris, refait. C'est le cœur de l'APES, une année pour <b>prendre pied en sciences</b> avant la suite, en petit effectif avec un suivi personnalisé, en parcours <b>Sciences de la Vie</b> ou <b>Maths-Physique-Chimie</b>. Ensuite : licence Sciences de la Vie, Informatique ou une autre licence scientifique, portail santé, prépa ingénieur, BUT ou BTS scientifique…</p>
			<ul class="lb-list">${order.map(k => `<li>${COURSES[k][0]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="lb-go" data-a="lead">📄 Recevoir la plaquette de l'APES</button>` : ""}
			<a class="lb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir l'APES ↗</a>
			<button class="lb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="lb-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { prel:prelever, cl:chlore, nit:nitrates, bac:bacteries, mic:microscope, bul:bulletin, end:fin };
	const actions = {};
	root.addEventListener("click", e => {
		const b = e.target.closest("[data-a]"); if(!b || b.disabled) return;
		const a = b.dataset.a; play("pop");
		if(a.startsWith("next:")) return STEPS[a.slice(5)]();
		if(actions[a]) return actions[a]();
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); b.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){
			Object.assign(S, { errors:0, learned:new Set(), proofs:[], clock:8*60 + 40, cl:undefined, nit:undefined, ecoli:undefined, colis:undefined, bacPass:1, micFocus10:false });
			$("[data-prv]").textContent = "0 / 5"; bul.visible = bulPaper.visible = false; dish.visible = false;
			prelever();
		}
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		W.dispose(); hidden.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".lb-x").addEventListener("click", close);

	W.place(V3(CX, 4, -2), 22, 1.1, 0);
	prelever();      // ouverture à chaud : au robinet de la cantine, sans écran de règles
	ev("start");
	ev("missions", [["1 · Prélever", prelever], ["2 · Le chlore", chlore], ["3 · Les nitrates", nitrates], ["4 · Les bactéries", bacteries], ["5 · Le microscope", microscope], ["6 · Le bulletin", bulletin], ["Bilan", fin]]);
	if(window.campus) window.campus.game = { S, W, OBJ, STEPS, actions, COLS, RODS, dish, bul };
}
