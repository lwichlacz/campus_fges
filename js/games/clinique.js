/* « Le troupeau du Riez » — mini-jeu de la Prépa concours B Véto et Agro (parcours de la Licence Sciences de la Vie, FGES, 2026).
   Le métier : vétérinaire rural·e (et, pour la dernière décision, ingénieur·e agronome). Le dossier : à la ferme du Riez
   (fictive, dans les Flandres), les génisses maigrissent depuis la rentrée ; la n° 27 tient à peine debout. L'éleveur,
   Rémi, accuse le nouvel aliment. La vraie cause : la grande douve du foie, un ver qui vit dans une zone humide du pré.
   Un seul dossier, six gestes du métier sur de vrais instruments, et une ordonnance qu'on signe :
   1 · l'examen (scène d'ouverture) : le ruban barymétrique autour de la poitrine (maths : P ≈ 80 × T³), le thermomètre
       jusqu'au bip, la paupière tirée pour voir la muqueuse (biologie : anémie) ;
   2 · le troupeau : marquer à la bombe les génisses maigres des deux prés ; le pré du haut, même aliment, sert de groupe
       témoin (maths : proportions) → la piste de l'aliment tombe ;
   3 · le sang : prise de sang à la queue, centrifugeuse à équilibrer (physique : rotation, centre de gravité),
       lecture de l'hématocrite (18 %) ;
   4 · les bouses : la flottation ne montre rien (physique, chimie : densité, poussée d'Archimède), la sédimentation
       et la décantation gardent le culot ; au microscope, mesurer un œuf de douve (140 µm) ;
   5 · le pré du bas : carotter le sol à la tarière (géologie : argile imperméable, sol hydromorphe), trouver les limnées,
       hôtes du parasite (biologie, écologie : un cycle à deux hôtes), clôturer la zone humide au doigt ;
   6 · l'ordonnance : régler le pistolet doseur pour la plus lourde du lot (maths : proportionnalité), puis signer.
   L'esprit de la prépa : un premier essai qui bute (ruban sur le ventre, thermomètre retiré trop tôt, rotor déséquilibré,
   culot versé à l'évier, dose du poids moyen) est barré au dossier, expliqué, puis refait avec la méthode.
   L'interface est le dossier de visite de la clinique ; la Dre Vasseur, vétérinaire associée, y colle ses mots.
   Ferme, personnes, animaux, produit et valeurs sont fictifs ou simplifiés ; écoles réelles citées comme débouchés.
   Contenu à relire par l'équipe de la prépa (docs/validation-veto.md). */
import { stage3d, THREE } from "./stage3d.js?v=979a7cec82";
import { jpoCard } from "./jpo.js?v=979a7cec82";
import { palier } from "./palier.js?v=979a7cec82";
import { soleil, modele, copie, recolorer, grain, guideGeste } from "./rendu.js?v=979a7cec82";

const SPEED = /[?&]vite/.test(location.search) ? 5 : 1;      // ?vite : attentes et animations 5 fois plus rapides (tests)

/* ---------- contenus (à valider par l'équipe de la prépa) ---------- */
const COURSES = {
	bio:    ["Biologie", "Physiologie animale, sang, parasites et leurs cycles de vie : la première épreuve du concours B, et le cœur de la Licence Sciences de la Vie."],
	maths:  ["Mathématiques", "Puissances, proportions, comparaison à un groupe témoin : les outils qui transforment des observations en preuve."],
	phys:   ["Physique", "Solides en rotation, centre de gravité, densité, poussée d'Archimède : la physique des appareils du labo."],
	chimie: ["Chimie", "Solutions, densité, séparation des mélanges : décanter, filtrer, c'est la chimie de paillasse."],
	geol:   ["Géologie", "Lire un sol, une roche, le chemin de l'eau : une épreuve à part entière du concours B."],
	eco:    ["Écologie et agronomie", "Cycles des parasites, zones humides, conduite du pâturage : soigner un troupeau, c'est aussi aménager une ferme. Le métier d'ingénieur·e agronome commence là."],
	colles: ["Colles et méthode", "Se tromper, comprendre pourquoi, recommencer : chaque semaine, les colles de la prépa entraînent à raisonner à voix haute."]
};
const TAG = 27;
const T_CHEST = 1.62, T_BELLY = 1.88, P_EXP = 420;      // tour de poitrine (m), tour de ventre (m), poids attendu à 18 mois (kg)
const kg = t => Math.round(80*t**3);                     // formule barymétrique simplifiée : 340 kg, 531 kg
const TEMP = 38.6, HCT = 18;                             // °C ; hématocrite (%), normale 24 à 46 %
const N_LOT = 12, N_SICK = 7;
const W_SICK = [305, 318, 326, 334, 340, 352, 378];      // poids au ruban des génisses maigres (kg)
const W_MEAN = Math.round(W_SICK.reduce((a, b) => a + b, 0)/W_SICK.length), DOSE = Math.ceil(Math.max(...W_SICK)/10);      // 336 kg ; 38 mL
const PRE_HA = 3.8;                                      // surface du pré du bas (ha) ; dans la scène : 25 × 20 unités
const WET = { x:90.6, z:2.4, rx:3.8, rz:4.8 };            // la zone humide, au bas du pré, le long du ru
const fr = (v, d = 1) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d });
const rng = seed => { let a = seed; return () => (a = (a*16807) % 2147483647)/2147483647; };
// au microscope : œufs de douve (dorés, 140 µm) et de strongles (gris, 80 µm) ; 1 pixel = 2 µm
const EGGS = [
	{ x:84, y:96, a:.45, l:70, w:40, gold:true }, { x:176, y:172, a:-.7, l:70, w:41, gold:true }, { x:178, y:72, a:1.95, l:68, w:39, gold:true },
	{ x:70, y:186, a:.2, l:40, w:23 }, { x:206, y:124, a:1.2, l:40, w:22 }
];
const EGGS_FLOT = [{ x:96, y:92, a:.3, l:40, w:23 }, { x:170, y:150, a:1.4, l:41, w:22 }, { x:122, y:200, a:-.5, l:39, w:22 }];
const DEBRIS = (() => { const r = rng(512), a = []; for(let i = 0; i < 46; i++) a.push({ x:10 + r()*240, y:10 + r()*240, r:2 + r()*6, c:r() < .5 ? "rgba(120,90,50,.45)" : "rgba(80,110,60,.35)" }); return a; })();

const CSS = `
.cr{position:fixed;inset:0;z-index:40;background:#e6eee3;font-family:Inter,Arial,sans-serif;font-weight:300;color:#0c2340;overflow:hidden;animation:crIn .4s ease both}
@keyframes crIn{from{opacity:0}}
.cr canvas.cr-3d{position:absolute;inset:0;display:block;touch-action:none}
.cr-x{position:absolute;right:12px;top:10px;z-index:6;width:40px;height:40px;border-radius:50%;border:0;background:#0f3168;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 12px rgba(15,49,104,.3)}
.cr-hud{position:absolute;left:12px;top:10px;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;right:476px;pointer-events:none}
.cr-tag{background:#fff;border-left:6px solid #21b7cb;border-radius:3px;padding:4px 9px;font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#0f3168;box-shadow:0 3px 10px rgba(15,49,104,.18);line-height:1.25}
.cr-tag b{display:block;font:300 15px Inter,Arial,sans-serif;letter-spacing:0}
.cr-steps{display:flex;gap:4px;flex-wrap:wrap}
.cr-steps span{background:rgba(255,255,255,.85);border:1.5px solid #c6d3df;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:700;color:#848487}
.cr-steps span.done{background:#0f3168;border-color:#0f3168;color:#fff}
.cr-steps span.now{background:#21b7cb;border-color:#21b7cb;color:#0f3168}
.cr-prv{position:absolute;right:60px;top:13px;z-index:5;background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;color:#0f3168;box-shadow:0 3px 10px rgba(15,49,104,.18)}
.cr-prv i{font-style:normal;color:#13808f}
.cr-hint{position:absolute;left:50%;transform:translateX(calc(-50% - 208px));top:88px;z-index:5;background:#0f3168;color:#fff;border-radius:999px;padding:8px 14px;font-size:14px;font-weight:700;box-shadow:0 4px 14px rgba(15,49,104,.3);white-space:nowrap;pointer-events:none;animation:crW .3s both}
.cr-hint:empty{display:none}
.cr-hint{white-space:normal;text-align:center;width:max-content;max-width:calc(100vw - 470px)}
.cr-book{position:absolute;right:12px;top:60px;bottom:12px;width:404px;z-index:3;overflow:auto;box-sizing:border-box;padding:0 16px 18px 44px;border-radius:4px 10px 10px 4px;overscroll-behavior:contain;scrollbar-width:thin;color:#0c2340;
	background:linear-gradient(90deg,#c8a46b 0 24px,#a9834c 24px 26px,transparent 26px) local,
		repeating-linear-gradient(transparent 0 25px,rgba(33,183,203,.2) 25px 26px) 0 64px local,#fffdf8;
	box-shadow:0 18px 40px rgba(15,49,104,.28),inset 0 0 0 1px #d8d2c4}
.cr-top{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:8px;align-items:center;margin:0 -16px 10px -18px;padding:10px 16px 8px 18px;background:#0f3168;color:#fff;font-size:11px;font-weight:700;border-radius:0 10px 0 0}
.cr-top b{font:300 16px "Tiempos Headline",Times New Roman,serif;color:#fff}
.cr-top span{color:#9fe6ef;text-align:right}
.cr-k{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#13808f}
.cr-h{font:300 24px/1.15 "Tiempos Headline",Times New Roman,serif;margin:2px 0 8px;color:#0f3168}
.cr-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#4f5c69}
.cr-p b{font-weight:700;color:#0c2340}
.cr-log{display:grid;gap:3px;margin:8px 0}
.cr-log:empty{display:none}
.cr-e{display:grid;grid-template-columns:42px 1fr;gap:6px;font-size:13.5px;line-height:1.45;color:#0c2340;animation:crW .35s both}
.cr-e time{font-weight:700;font-size:11px;color:#848487;padding-top:2px;font-variant-numeric:tabular-nums}
.cr-e.x .t{text-decoration:line-through;text-decoration-color:#b91c1c;text-decoration-thickness:2px;color:#848487}
.cr-e .why{display:block;color:#b91c1c;font-weight:700;font-size:12.5px}
.cr-e.p .t{font-weight:700}
.cr-e.p .t:before{content:"◆ ";color:#21b7cb}
@keyframes crW{from{opacity:0;transform:translateY(5px)}}
.cr-note{background:#fff6bf;padding:8px 11px 9px;margin:10px 2px;font-size:14px;line-height:1.42;color:#0c2340;transform:rotate(.6deg);box-shadow:0 3px 8px rgba(15,49,104,.18);animation:crW .35s both}
.cr-note small{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8a6d12;margin-bottom:2px}
.cr-note:empty{display:none}
.cr-num{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0}
.cr-num div{font:300 24px "Tiempos Headline",Times New Roman,serif;font-variant-numeric:tabular-nums;color:#0f3168}
.cr-num small{display:block;font:700 10px Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#848487}
.cr-graph{display:block;width:100%;background:#fff;border:1px solid #c9d6e3;border-radius:4px;margin:6px 0;touch-action:none}
.cr-graph[data-hct]{cursor:ew-resize}
.cr-graph[hidden]{display:none}
.cr-eye{display:block;margin:8px auto;width:210px;height:210px;border-radius:50%;box-shadow:0 0 0 8px #0f1a2c,0 0 0 10px #4f5c69;background:#000;touch-action:none;cursor:crosshair}
.cr-go{display:block;width:100%;border:0;border-radius:10px;padding:13px;margin-top:10px;background:#0f3168;color:#fff;font:700 15px Inter,Arial,sans-serif;cursor:pointer}
.cr-go:disabled{opacity:.35;cursor:default}
.cr-alt{display:block;width:100%;border:1.5px solid #9fb0c4;border-radius:10px;padding:11px;margin-top:8px;background:#fff;color:#0f3168;font:700 14px Inter,Arial,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.cr-go:focus-visible,.cr-alt:focus-visible{outline:3px solid #21b7cb;outline-offset:2px}
.cr-course{background:#fff;border:1.5px dashed #21b7cb;border-radius:8px;padding:8px 10px;margin:8px 0;animation:crW .35s both}
.cr-course small{display:block;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#13808f}
.cr-course b{display:block;font:300 17px "Tiempos Headline",Times New Roman,serif;color:#0f3168}
.cr-course span{font-size:13px;color:#4f5c69}
.cr-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0;background:#fff}
.cr-tbl td{padding:5px 4px;border-top:1px solid #d5dee7;vertical-align:top}.cr-tbl td:last-child{text-align:right;font-weight:700}
.cr-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:3px}
.cr-list li{font-size:13.5px;color:#0c2340}
.cr-list li:before{content:"◆ ";color:#21b7cb}
.cr-done{display:inline-block;border:3px solid #2f6b45;color:#2f6b45;font:700 13px Inter,Arial,sans-serif;letter-spacing:.14em;padding:3px 9px;border-radius:5px;transform:rotate(-5deg);margin:4px 0 8px}
@media (max-width:759px){
	.cr-hud{right:110px;gap:5px}
	.cr-steps span{padding:3px 7px;font-size:0;min-width:8px;min-height:8px}
	.cr-steps span.now{font-size:11px}
	.cr-tag{display:none}
	.cr-prv{right:58px;font-size:12px;padding:6px 10px}
	.cr-hint{transform:translateX(-50%);top:52px;font-size:13px;white-space:normal;text-align:center;width:max-content;max-width:calc(100% - 32px)}
	.cr-book{left:0;right:0;top:auto;bottom:0;width:auto;max-height:50%;border-radius:14px 14px 0 0;padding:0 12px 18px 38px}
	.cr-top{border-radius:14px 14px 0 0;margin:0 -12px 8px -14px;padding:9px 12px 7px 14px}
	.cr-h{font-size:21px}
	.cr-eye{width:170px;height:170px}
}`;

const STEP_UI = [["exam", "Examen"], ["lot", "Le troupeau"], ["sang", "Le sang"], ["copro", "Les bouses"], ["pre", "Le pré"], ["ord", "Ordonnance"]];

export function openClinique({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("cr-css")){ const st = document.createElement("style"); st.id = "cr-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "cr";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le troupeau du Riez");
	root.innerHTML = `<canvas class="cr-3d" aria-hidden="true"></canvas>
		<div class="cr-hud"><div class="cr-tag">ÉLEVAGE<b>Ferme du Riez</b></div><div class="cr-steps">${STEP_UI.map(([k, n]) => `<span data-s="${k}">${n}</span>`).join("")}</div></div>
		<div class="cr-prv">◆ Preuves <i data-prv>0 / 5</i></div><div class="cr-hint" aria-live="polite"></div>
		<button class="cr-x" aria-label="Quitter le jeu">×</button><div class="cr-book"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), book = $(".cr-book"), cv = $(".cr-3d");
	const S = { errors:0, learned:new Set(), proofs:[], clock:7*60 + 30, step:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms/SPEED); timers.add(t); return t; };

	/* ================= la scène : l'étable, les prés, le labo de la clinique ================= */
	const W = stage3d(cv, { panel:book, side:"right", panelW:416, bg:"#e6eee3", fog:[70, 170], minD:3, maxD:90, maxPolar:1.45, rotate:false, shadows:false, soin:{ env:.45 } });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#f4f8ff", "#8f8a74", .75));
	// le soleil, et une ombre douce qui suit la caméra d'un lieu à l'autre (étable, prés, labo)
	const SUN = soleil(W.renderer, scene, W.controls, { intensity:1.9, radius:20, dir:[-.5, 1, .6] });
	W.onFrame(SUN.follow);
	const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
	const own = x => G(x);                              // tout ce qui doit être libéré à la fermeture
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
	const tag = (t, o = {}) => label(t, { size:o.size || .022, bg:o.bg || "#0f3168", fg:o.fg || "#fff" });
	const lcd = (scr, big, small, col = "#9ff2ff") => scr.draw((x, w, h) => {
		x.fillStyle = "#0b1a2e"; x.fillRect(0, 0, w, h); x.fillStyle = col; x.textAlign = "center"; x.textBaseline = "middle";
		x.font = `700 ${Math.round(h*.46)}px Inter,Arial,sans-serif`; x.fillText(big, w/2, h*.44);
		if(small){ x.fillStyle = "#7fa6c4"; x.font = `700 ${Math.round(h*.18)}px Inter,Arial,sans-serif`; x.fillText(small, w/2, h*.84); }
	});

	/* --- les vaches flamandes (génisses) ---
	   Le modèle : « Farm Animals » de Quaternius (CC0, modeles/LICENCE-quaternius-farm.txt), recoloré en rouge flamand.
	   makeCow rend tout de suite un groupe vide avec ses repères (tête, marque) : le jeu démarre sans attendre ; le modèle
	   s'y glisse dès qu'il est chargé. S'il ne se charge pas, on garde l'ancienne vache en volumes simples. */
	const coatOk = M("#7b2f22", { roughness:.9 }), coatDull = M("#94604f", { roughness:1 }), ribM = M("#5c3127"), pinkM = M("#d9a596"), darkM = M("#161616"), tagM = M("#f3d23b"), markM = M("#1f5fbf", { roughness:.6 });
	const COWS = [], mixers = [];
	function makeCow({ thin = false, s = 1, x = 0, z = 0, ry = 0 } = {}){
		const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(s); scene.add(g);
		const w = thin ? .74 : 1, top = thin ? 2.67 : 2.75;
		const head = new THREE.Group(); head.position.set(2.35, thin ? 1.85 : 2.5, 0); g.add(head);
		const tail = new THREE.Group(); tail.position.set(-1.72, 2.45, 0); g.add(tail);
		const mark = mesh(G(new THREE.BoxGeometry(1.3, .06, .7)), markM, -.2, top + .02, 0, g); mark.visible = false;
		const c = { g, head, tail, thin, mark, w, top };
		COWS.push(c);
		return c;
	}
	/* l'ancienne vache, en volumes simples : le filet de sécurité si le modèle ne se charge pas */
	const bodyGeo = G(new THREE.CapsuleGeometry(.8, 1.9, 6, 14));
	const legGeo = G(new THREE.CylinderGeometry(.15, .12, 1.4, 8)); legGeo.translate(0, .7, 0);
	const neckGeo = G(new THREE.BoxGeometry(.9, .75, .6)), headGeo = G(new THREE.BoxGeometry(1, .62, .56)), muzGeo = G(new THREE.BoxGeometry(.36, .44, .5));
	const earGeo = G(new THREE.BoxGeometry(.12, .16, .42)), eyeGeo = G(new THREE.SphereGeometry(.07, 8, 6)), tagGeo = G(new THREE.BoxGeometry(.05, .14, .12));
	const ribGeo = G(new THREE.BoxGeometry(.07, .78, .05)), hipGeo = G(new THREE.SphereGeometry(.15, 8, 6)), spineGeo = G(new THREE.BoxGeometry(2.4, .09, .14));
	const tailGeo = G(new THREE.CylinderGeometry(.05, .04, 1.3, 6)); tailGeo.translate(0, -.65, 0);
	const tuftGeo = G(new THREE.SphereGeometry(.13, 8, 6));
	function cowSimple({ g, head, tail, thin, w, top }){
		const coat = thin ? coatDull : coatOk;
		const body = mesh(bodyGeo, coat, 0, 1.95, 0, g); body.rotation.z = Math.PI/2; body.scale.set(thin ? .9 : 1, 1, w);
		for(const [lx, lz] of [[1.1, .42], [1.1, -.42], [-1.1, .42], [-1.1, -.42]]) mesh(legGeo, coat, lx, 0, lz*w, g);
		mesh(neckGeo, coat, 1.75, thin ? 2.15 : 2.35, 0, g).rotation.z = thin ? .2 : -.45;
		head.rotation.z = thin ? -.35 : 0;
		mesh(headGeo, coat, 0, 0, 0, head); mesh(muzGeo, pinkM, .6, -.08, 0, head);
		for(const ez of [.36, -.36]) mesh(earGeo, coat, -.3, .22, ez, head).rotation.y = ez > 0 ? .3 : -.3;
		mesh(tagGeo, tagM, -.3, .17, .6, head);
		for(const ez of [.29, -.29]) mesh(eyeGeo, darkM, .12, .12, ez, head);
		tail.rotation.z = -.12; mesh(tailGeo, coat, 0, 0, 0, tail); mesh(tuftGeo, darkM, 0, -1.35, 0, tail);
		if(thin){
			for(const sz of [1, -1]) for(let i = 0; i < 3; i++) mesh(ribGeo, ribM, .1 + i*.3, 1.9, sz*(.8*w - .01), g);
			for(const hz of [.36, -.36]) mesh(hipGeo, coat, -1.1, 2.5, hz, g);
			mesh(spineGeo, ribM, -.1, top - .02, 0, g);
		}
	}
	/* le vrai modèle : une génisse en bon état broute (animation « Idle », chacune à son rythme) ; une maigre reste
	   immobile, tête basse, plus étroite, le poil terne, la colonne, les hanches et les côtes qui saillent */
	const COW_S = .6;                                   // le modèle mesure ≈ 9 unités de long : on le ramène à ≈ 5,4
	const coat = (base, rough) => m => { const n = m.clone(); n.roughness = rough; n.metalness = 0; n.color.set(base[m.name] || m.color); return n; };
	const OK_COL = { White:"#8a3524", Black:"#6a2519", Pink:"#d68a80" }, THIN_COL = { White:"#9a6552", Black:"#7d4a3b", Pink:"#c9938a" };
	function cowModel(c, gltf){
		const m = copie(gltf);
		m.rotation.y = Math.PI/2; m.scale.setScalar(COW_S);
		if(c.thin) m.scale.z = COW_S*.78;           // plus étroite (après rotation, l'axe z du modèle devient la largeur)
		recolorer(m, coat(c.thin ? THIN_COL : OK_COL, c.thin ? 1 : .82)).forEach(x => own(x));
		c.g.add(m);
		const bone = n => m.getObjectByName(n);
		if(c.thin){
			// tête basse : on fige le cou et la tête vers le bas, sans animation
			const neck = bone("Neck"), hd = bone("Head");
			if(neck) neck.rotation.x += .45; if(hd) hd.rotation.x += .25;
			c.g.updateMatrixWorld(true); m.traverse(n => { if(n.isSkinnedMesh){ n.skeleton.update(); n.computeBoundingSphere(); n.computeBoundingBox(); } });
			// la colonne, les hanches et les côtes qui saillent : posées sur la vraie surface du modèle (on la sonde au rayon)
			const ribRelief = G(new THREE.CapsuleGeometry(.04, .42, 3, 8)), ribTone = M("#7f4a3a", { roughness:1 });
			const rc = new THREE.Raycaster(), wv = (x, y, z) => c.g.localToWorld(V3(x, y, z)), lv = p => c.g.worldToLocal(p.clone());
			const hitAt = (from, to) => { const o = wv(...from), d = wv(...to).sub(o).normalize(); rc.set(o, d); const h = rc.intersectObject(m, true)[0]; return h ? lv(h.point) : null; };
			const backAt = x => (hitAt([x, 6, 0], [x, 0, 0]) || V3(x, c.top - .5, 0)).y;
			const yb = backAt(-.2);
			const sp = mesh(spineGeo, ribM, -.25, yb - .03, 0, c.g); sp.scale.set(.9, 1, 1);
			c.mark.position.y = yb + .04;                // la marque à la bombe, posée sur le dos
			for(const hz of [.27, -.27]){ const yh = (hitAt([-1.05, 6, hz], [-1.05, 0, hz]) || V3(0, yb, 0)).y; mesh(hipGeo, coatDull, -1.05, yh - .02, hz, c.g).scale.set(1.1, .8, 1.1); }
			for(const sz of [1, -1]) for(let i = 0; i < 4; i++){
				const x = -.35 + i*.27, y = yb - .62, f = hitAt([x, y, sz*3], [x, y, 0]);
				if(!f) continue;
				const r = mesh(ribRelief, ribTone, x, y, f.z + sz*.01, c.g); r.rotation.set(sz*.18, 0, .28); r.castShadow = false;
			}
		} else {
			const mix = new THREE.AnimationMixer(m), clip = gltf.animations[0];
			if(clip){ const a = mix.clipAction(clip); a.play(); a.time = Math.random()*clip.duration; a.timeScale = .7 + Math.random()*.5; }
			mixers.push(mix);
		}
		// la tête suit l'os de la tête : l'œil reste sous le doigt quand la génisse bouge
		const hd = bone("Head");
		if(hd){ m.updateMatrixWorld(true); const p = hd.getWorldPosition(new THREE.Vector3()); c.head.position.copy(c.g.worldToLocal(p)); c.head.position.x += .25; c.head.position.y -= .05; hd.attach(c.head); }
		c.model = m;
	}
	modele("modeles/vache.glb").then(gltf => { if(!closed) COWS.forEach(c => cowModel(c, gltf)); })
		.catch(() => { if(!closed) COWS.forEach(cowSimple); });
	W.onFrame((now, dt) => { for(const m of mixers) m.update(dt); });

	/* --- l'étable : la génisse 27 au cornadis, la caisse du vétérinaire --- */
	{
		const planks = W.canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#93714c"; x.fillRect(0, 0, w, h); x.fillStyle = "#7e5f3e"; for(let i = 0; i < w; i += 32) x.fillRect(i, 0, 3, h); });
		planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(6, 1);
		mesh(G(new THREE.PlaneGeometry(40, 24)), M("#ffffff", { roughness:.95, map:own(grain(W.renderer, "#b3ad9f", { n:5000, w:2, h:2, tilt:3, flecks:["rgba(0,0,0,.07)", "rgba(255,255,255,.08)"], repeat:[8, 5] })) }), 0, 0, 0).rotation.x = -Math.PI/2;
		mesh(G(new THREE.PlaneGeometry(9, 9)), M("#ffffff", { roughness:1, map:own(grain(W.renderer, "#d6bd72", { n:4200, w:1.4, h:16, tilt:3.2, flecks:["rgba(150,110,40,.35)", "rgba(255,240,180,.45)", "rgba(120,90,30,.25)"], repeat:[3, 3] })) }), -1, .02, 0).rotation.x = -Math.PI/2;       // la paille
		box(40, 11, .4, M("#ffffff", { map:planks }), 0, 0, -8);
		box(40, 1.6, .5, "#cfcac0", 0, 0, -7.6);
		box(.4, 11, 20, "#8b6a46", -20, 0, 2); box(.4, 11, 20, "#8b6a46", 20, 0, 2);
		box(40, .5, .5, "#21b7cb", 0, 7.4, -7.7);
		const sign = W.canvasTex(512, 140, x => { x.fillStyle = "#fffdf8"; x.fillRect(0, 0, 512, 140); x.fillStyle = "#0f3168"; x.font = "300 46px 'Tiempos Headline',Times New Roman,serif"; x.textAlign = "center"; x.fillText("Ferme du Riez", 256, 64); x.font = "700 21px Inter,Arial,sans-serif"; x.fillStyle = "#13808f"; x.fillText("Vaches flamandes · élevage fictif", 256, 108); });
		mesh(G(new THREE.PlaneGeometry(6, 1.65)), new THREE.MeshBasicMaterial({ map:sign }), -7, 5.6, -7.75);
		// le cornadis (barrière où les vaches passent la tête), et la table d'alimentation derrière
		for(let z = -4.4; z <= 4.4; z += 1.1) cyl(.07, .07, 3, steel, 2.05, .5, z);
		box(.16, .16, 9.2, steel, 2.05, 3.5, 0); box(.16, .16, 9.2, steel, 2.05, .45, 0);
		box(4, .7, 9.2, "#d8c27c", 4.6, 0, 0);
	}
	const c27 = makeCow({ thin:true });
	const c27L = tag(`Génisse n° ${TAG}`, { size:.022 }); c27L.position.set(-.2, 3.8, 0); c27.g.add(c27L);
	const bodyHit = hitBox(3.3, 1.6, 1.5, c27.g, -.1, 1.95, 0);
	const chestAt = new THREE.Object3D(); chestAt.position.set(.75, 2.4, .6); c27.g.add(chestAt);
	const eyeHit = hitBox(1, .9, .8, c27.head, .1, .1, .32);
	const tailHit = hitBox(.9, 2.2, 1.4, c27.g, -2.05, 1.5, 0);
	const conj = mesh(G(new THREE.BoxGeometry(.2, .05, .02)), M("#f1dcd8"), .12, .02, .3, c27.head); conj.visible = false;
	const ring = new THREE.Mesh(G(new THREE.TorusGeometry(1, .045, 6, 48)), M("#f3b23b", { roughness:.5 })); ring.rotation.y = Math.PI/2; ring.scale.set(.63, .76, 1); ring.position.y = 1.95; ring.visible = false; c27.g.add(ring);
	let ringGeo = null;
	// le cercle fantôme : où passer le ruban (il clignote tant que le ruban n'est pas posé)
	const guideRing = new THREE.Mesh(G(new THREE.TorusGeometry(1, .03, 6, 64)), M("#21b7cb", { transparent:true, opacity:.6, emissive:"#21b7cb", emissiveIntensity:.6, depthWrite:false }));
	guideRing.rotation.y = Math.PI/2; guideRing.scale.set(.63, .76, 1); guideRing.position.set(.75, 1.95, 0); guideRing.visible = false; c27.g.add(guideRing);
	W.onFrame(now => { if(guideRing.visible) guideRing.material.opacity = .35 + .35*Math.sin(now/260); });
	const headAt = new THREE.Vector3();
	function setRing(x, p){ if(ringGeo) ringGeo.dispose(); ringGeo = new THREE.TorusGeometry(1, .045, 6, 48, Math.max(.02, p)*Math.PI*2); ring.geometry = ringGeo; ring.position.x = x; ring.visible = p > 0; }
	// la caisse du vétérinaire : ruban, thermomètre, tube, pistolet doseur
	const KX = -.4, KZ = 3.7, KY = 1.3;
	box(3.6, KY, 1.8, "#dfe5ea", KX, 0, KZ); box(3.7, .1, 1.9, "#0f3168", KX, KY - .05, KZ);
	const rubanRoll = mesh(G(new THREE.CylinderGeometry(.34, .34, .2, 18)), M("#f3b23b"), KX - 1.35, KY + .34, KZ); rubanRoll.rotation.x = Math.PI/2;
	const rubanL = tag("Ruban"); rubanL.position.set(KX - 1.35, KY + 1.1, KZ); scene.add(rubanL);
	const thermo = new THREE.Group(); thermo.position.set(KX - .45, KY + .1, KZ + .3); scene.add(thermo);
	box(.8, .14, .16, "#e8ecef", 0, 0, 0, thermo); box(.4, .03, .03, steel, -.6, .05, 0, thermo);
	const thermoScr = screen(.5, .24, 200, 96, thermo, .15, .3, .1); thermoScr.m.rotation.x = -.6;
	const thermoHit = hitBox(1, 1, 1.2, thermo, 0, .3, 0);
	const thermoL = tag("Thermomètre"); thermoL.position.set(0, .9, 0); thermo.add(thermoL);
	const thermoHome = thermo.position.clone(), TH_AT = V3(-2.15, 2.05, .35);
	function makeTube(x, y, z, col, parent = scene){
		const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
		cyl(.11, .11, .9, glass, 0, 0, 0, g); cyl(.13, .13, .14, col, 0, .9, 0, g);
		const lg = G(new THREE.CylinderGeometry(.09, .09, 1, 10)); lg.translate(0, .5, 0);
		const liq = mesh(lg, M(col === "#c4362f" ? "#8e1b1b" : "#bfe0f5", { transparent:true, opacity:.9 }), 0, .02, 0, g);
		const set = f => { liq.visible = f > .01; liq.scale.y = Math.max(.01, f*.8); };
		const hit = hitBox(.6, 1.6, .6, g, 0, .6, 0);
		return { g, liq, set, hit, home:g.position.clone() };
	}
	const tube = makeTube(KX + .4, KY, KZ - .3, "#c4362f"); tube.set(0);
	const tubeL = tag("Tube"); tubeL.position.set(0, 1.5, 0); tube.g.add(tubeL);
	const TUBE_AT = V3(-2.0, 1.5, .45);
	const doseur = new THREE.Group(); doseur.position.set(KX + 1.25, KY + .3, KZ + .2); scene.add(doseur);
	mesh(G(new THREE.CylinderGeometry(.17, .17, 1.3, 14)), glass, 0, 0, 0, doseur).rotation.z = Math.PI/2;
	const dlg = G(new THREE.CylinderGeometry(.14, .14, 1, 12)); dlg.translate(0, .5, 0);
	const doseLiq = mesh(dlg, M("#e8b04a", { transparent:true, opacity:.85 }), .65, 0, 0, doseur); doseLiq.rotation.z = Math.PI/2;
	const plunger = new THREE.Group(); doseur.add(plunger);
	mesh(G(new THREE.CylinderGeometry(.04, .04, 1, 6)), steel, 0, 0, 0, plunger).rotation.z = Math.PI/2;
	box(.1, .5, .4, "#0f3168", -.5, -.25, 0, plunger);
	box(.2, .6, .2, "#33404f", .45, -.6, 0, doseur); mesh(G(new THREE.CylinderGeometry(.03, .03, .6, 6)), steel, 1, 0, 0, doseur).rotation.z = Math.PI/2;
	const doseHit = hitBox(1.6, 1.4, 1.2, doseur, -.2, 0, 0);
	const doseL = tag("Doseur"); doseL.position.set(0, .9, 0); doseur.add(doseL);
	// la table où l'on rédige l'ordonnance
	const OX = -12.5, OZ = 1.5, OY = 3;
	box(6.6, OY, 4.8, "#8b6a46", OX, 0, OZ);
	const BW = 1400, BH = 1000;
	const ordTex = W.canvasTex(BW, BH); ordTex.generateMipmaps = false; ordTex.minFilter = THREE.LinearFilter;
	const sheet = mesh(G(new THREE.PlaneGeometry(5.6, 4)), new THREE.MeshBasicMaterial({ map:ordTex }), OX, OY + .07, OZ); sheet.rotation.x = -Math.PI/2; sheet.visible = false;
	const sheetPaper = box(5.7, .04, 4.1, "#f1eee6", OX, OY, OZ); sheetPaper.visible = false;

	/* --- les deux prés : le haut, sec ; le bas, le long du marais --- */
	{
		const grass = (base, seed) => own(grain(W.renderer, base, { seed, n:9000, w:1.3, h:7, tilt:.9, flecks:["rgba(40,80,20,.22)", "rgba(210,235,150,.16)", "rgba(90,120,40,.2)"], repeat:[16, 8] }));
		mesh(G(new THREE.PlaneGeometry(62, 30)), M("#ffffff", { roughness:1, map:grass("#8bb75c", 11) }), 72, 0, 0).rotation.x = -Math.PI/2;
		// la campagne autour, jusqu'au brouillard : les prés ne flottent plus sur le vide
		{ const far = grass("#9cbf6e", 53); const t = far.clone(); t.repeat.set(60, 30); t.needsUpdate = true; own(t);
		  const g = mesh(G(new THREE.PlaneGeometry(420, 220)), M("#ffffff", { roughness:1, map:t }), 72, -.03, 0); g.rotation.x = -Math.PI/2; g.castShadow = false; }
		mesh(G(new THREE.PlaneGeometry(25, 20)), M("#ffffff", { roughness:1, map:grass("#6c9f4a", 29) }), 84.5, .01, 0).rotation.x = -Math.PI/2;
		box(1.3, .06, 22, "#5e9fc4", 97.6, 0, 0);                                          // le ru
		const post = G(new THREE.CylinderGeometry(.1, .1, 1.5, 6)); post.translate(0, .75, 0);
		const wood = M("#9c7a52");
		const fence = (x0, z0, x1, z1) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0)/2.5)); for(let i = 0; i <= n; i++) mesh(post, wood, x0 + (x1 - x0)*i/n, 0, z0 + (z1 - z0)*i/n); const wire = mesh(G(new THREE.CylinderGeometry(.03, .03, 1, 4)), "#6b6b6b", 0, 0, 0); stick(wire, V3(x0, 1.2, z0), V3(x1, 1.2, z1)); };
		fence(47, -10, 97, -10); fence(47, 10, 97, 10); fence(47, -10, 47, 10); fence(71, -10, 71, 10);
		// la haie d'arbres et les touffes d'herbe : modèles « Stylized Nature MegaKit » de Quaternius (CC0,
		// modeles/LICENCE-quaternius-nature.txt) ; à défaut, les arbres en volumes simples d'avant
		const treeSimple = () => { const tree = M("#4f7d3a"), trunk = M("#6b4f33"); for(let i = 0; i < 13; i++){ const x = 46 + i*4.2, s = 1.6 + (i % 3)*.4; cyl(.25, .3, 2, trunk, x, 0, -12.5); mesh(G(new THREE.SphereGeometry(s, 10, 8)), tree, x, 2 + s*.8, -12.5); } };
		modele("modeles/nature.glb").then(gltf => {
			if(closed) return;
			const r = rng(404), kinds = ["CommonTree_3", "CommonTree_5"].map(n => gltf.scene.getObjectByName(n)).filter(Boolean);
			if(!kinds.length) return treeSimple();
			for(let i = 0; i < 13; i++){
				const t = copie({ scene:kinds[i % kinds.length] }); t.position.set(46 + i*4.2 + (r() - .5)*1.2, 0, -12.8 + (r() - .5)*1.4);
				t.rotation.y = r()*Math.PI*2; t.scale.setScalar(.62 + r()*.2); scene.add(t);
			}
			const tuft = gltf.scene.getObjectByName("Grass_Common_Tall");
			if(tuft) for(let i = 0; i < 90; i++){
				const x = 48 + r()*48, z = -9.5 + r()*19; if(((x - WET.x)/WET.rx)**2 + ((z - WET.z)/WET.rz)**2 < 1.3) continue;      // pas d'herbe haute dans la boue
				const t = copie({ scene:tuft }, { cast:false }); t.position.set(x, 0, z); t.rotation.y = r()*Math.PI*2; t.scale.setScalar(.5 + r()*.5); scene.add(t);
			}
			scene.traverse(n => { if(n.isMesh && n.material && n.material.map && n.material.alphaTest === 0 && n.material.transparent){ n.material.alphaTest = .5; n.material.transparent = false; } });
		}).catch(() => { if(!closed) treeSimple(); });
		const reedM = M("#7d8a3d"), reed = G(new THREE.CylinderGeometry(.03, .05, 1.4, 4)); reed.translate(0, .7, 0);
		const r = rng(77);
		for(let i = 0; i < 70; i++){ const a = r()*Math.PI*2, d = .55 + r()*.5; const m = mesh(reed, reedM, WET.x + Math.cos(a)*WET.rx*d, 0, WET.z + Math.sin(a)*WET.rz*d); m.rotation.z = (r() - .5)*.4; }
		for(const [x, lab] of [[60, "Pré du haut"], [84, "Pré du bas, le long du marais"]]){
			box(3, .9, 1.1, "#9aa1aa", x, 0, 8.4); box(2.7, .2, .8, "#d9c27a", x, .8, 8.4);
			const l = tag(lab, { size:.024 }); l.position.set(x, 4.2, 10.5); scene.add(l);
			const a = tag("Aliment (le même)", { size:.018, bg:"#fff", fg:"#0f3168" }); a.position.set(x, 2.2, 8.4); scene.add(a);
		}
	}
	const mud = mesh(G(new THREE.CircleGeometry(1, 40)), M("#5b4a35", { roughness:1 }), WET.x, .03, WET.z); mud.rotation.x = -Math.PI/2; mud.scale.set(WET.rx, WET.rz, 1);
	const HERD = [];
	{
		const r = rng(2711), BAS_SICK = new Set([0, 2, 3, 5, 7, 8, 10]);
		const grid = (x0, x1, z0, z1, f) => { for(let i = 0; i < 12; i++){ const c = i % 4, l = Math.floor(i/4); f(i, x0 + (c + .5)*(x1 - x0)/4 + (r() - .5)*1.4, z0 + (l + .5)*(z1 - z0)/3 + (r() - .5)*1.2, (r() - .5)*1.1 + (r() < .5 ? 0 : Math.PI)); } };
		const add = (lot, i, x, z, ry, thin, young) => { const c = makeCow({ thin, s:young ? .76 : 1, x, z, ry }); Object.assign(c, { lot, young, hit:hitBox(4, 2.4, 1.5, c.g, .3, 1.8, 0), marked:false }); HERD.push(c); };
		grid(51.5, 69, -8.5, 6.5, (i, x, z, ry) => add("haut", i, x, z, ry, false, i === 6));
		grid(73, 85.5, -8.5, 6.5, (i, x, z, ry) => add("bas", i, x, z, ry, BAS_SICK.has(i), false));
	}
	// les trois piquets de carottage, du haut (A) au bas (C) du pré
	const STAKES = [["A", 76.5, -5.5, "Limon brun, sec et friable", ["#7a5636", "#86603c", "#946d45"]], ["B", 83, -.8, "Limon brun, frais", ["#6e4e32", "#7a5838", "#7f6345"]], ["C", 89.6, 3.4, "<b>Argile grise à taches de rouille, gorgée d'eau</b>", ["#5d5a55", "#74777a", "#8b5a2b"]]].map(([id, x, z, soil, cols]) => {
		const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
		cyl(.13, .13, 1.7, "#e8d6a8", 0, 0, 0, g); box(.5, .3, .06, "#21b7cb", 0, 1.4, .1, g);
		const l = tag(id, { size:.022 }); l.position.set(0, 2.4, 0); g.add(l);
		const core = new THREE.Group(); core.position.set(1.1, .2, .6); core.visible = false; g.add(core);
		cols.forEach((c, i) => { const m = mesh(G(new THREE.CylinderGeometry(.16, .16, .7, 10)), c, -.7 + i*.7, 0, 0, core); m.rotation.z = Math.PI/2; });
		return { id, x, z, soil, g, core, hit:hitBox(1.6, 2.6, 1.6, g, 0, 1, 0) };
	});
	const auger = new THREE.Group(); auger.visible = false; scene.add(auger);
	cyl(.07, .07, 2.6, steel, 0, 0, 0, auger); box(1.2, .14, .14, "#c4362f", 0, 2.6, 0, auger);
	const snailG = new THREE.Group(); scene.add(snailG);
	const fenceG = new THREE.Group(); scene.add(fenceG);
	const groundHit = hitBox(25, .1, 20, scene, 84.5, 0, 0);
	const shellGeo = G(new THREE.ConeGeometry(.22, .5, 10)), shellM = M("#6b5236", { roughness:.6 });
	const fPost = G(new THREE.CylinderGeometry(.09, .09, 1.2, 6)); fPost.translate(0, .6, 0);
	const fWire = G(new THREE.CylinderGeometry(.035, .035, 1, 4)), fPostM = M("#c9a46a"), fWireM = M("#f3b23b");

	/* --- le labo de la clinique : centrifugeuse, flottation, verre à pied, microscope --- */
	const LX = -46, Y = 3.2;
	{
		const ft = W.canvasTex(256, 256, x => { for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ x.fillStyle = (i + j) % 2 ? "#e9ecee" : "#dde1e5"; x.fillRect(i*32, j*32, 32, 32); } });
		ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(6, 3);
		mesh(G(new THREE.PlaneGeometry(40, 20)), M("#ffffff", { map:ft, roughness:.6 }), LX, 0, 0).rotation.x = -Math.PI/2;
		box(40, 12, .4, "#e3eaef", LX, 0, -6.4); box(.4, 12, 20, "#dbe3ea", LX - 20, 0, 0); box(.4, 12, 20, "#dbe3ea", LX + 20, 0, 0);
		box(34.4, .3, 4.6, "#f4f5f2", LX, Y - .3, -3.7); box(34, Y - .3, 4.2, "#0f3168", LX, 0, -3.8);
		box(40, .3, .5, "#21b7cb", LX, 11.2, -6.1);
		const sky = W.canvasTex(256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9cc8ea"); g.addColorStop(1, "#e8f1f6"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#8bb75c"; x.fillRect(0, h*.68, w, h); });
		box(11, 4.6, .3, "#f7f8f9", LX - 6, 6.2, -6.2); mesh(G(new THREE.PlaneGeometry(10.4, 4)), new THREE.MeshBasicMaterial({ map:sky }), LX - 6, 8.5, -6.0);
		const pos = W.canvasTex(420, 160, x => { x.fillStyle = "#fff"; x.fillRect(0, 0, 420, 160); x.fillStyle = "#0f3168"; x.font = "300 36px 'Tiempos Headline',Times New Roman,serif"; x.fillText("Clinique vétérinaire des Prés", 20, 64); x.font = "700 20px Inter,Arial,sans-serif"; x.fillStyle = "#13808f"; x.fillText("Laboratoire · clinique fictive", 20, 112); });
		mesh(G(new THREE.PlaneGeometry(5.2, 2)), new THREE.MeshBasicMaterial({ map:pos }), LX + 8, 8, -6.15);
	}
	// la centrifugeuse, son rotor à huit logements, son couvercle
	const cen = new THREE.Group(); cen.position.set(LX - 8, Y, -3.9); scene.add(cen);
	cyl(1.45, 1.55, 1.3, "#e8ecef", 0, 0, 0, cen);
	const rotor = new THREE.Group(); rotor.position.set(0, 1.32, 0); cen.add(rotor);
	cyl(1.1, 1.1, .12, steel, 0, 0, 0, rotor);
	const SLOTS = [];
	for(let i = 0; i < 8; i++){ const a = i*Math.PI/4, x = Math.cos(a)*.75, z = Math.sin(a)*.75; cyl(.17, .17, .16, "#33404f", x, .06, z, rotor); SLOTS.push({ i, at:new THREE.Object3D() }); SLOTS[i].at.position.set(x, .14, z); rotor.add(SLOTS[i].at); }
	const rotorHit = hitBox(2.3, .2, 2.3, rotor, 0, .04, 0);      // un seul disque touchable : le logement est celui dont l'angle est le plus proche
	const LID_OPEN = -1.9;
	const lid = new THREE.Group(); lid.position.set(0, 1.42, -1.45); lid.rotation.x = LID_OPEN; cen.add(lid);
	mesh(G(new THREE.CylinderGeometry(1.45, 1.45, .12, 24)), M("#cfd6dd"), 0, 0, 1.45, lid);
	const startBtn = box(.7, .36, .16, "#21b7cb", 0, .4, 1.52, cen);
	const startHit = hitBox(1.2, .9, .8, cen, 0, .55, 1.5);
	const startL = tag("START"); startL.position.set(0, -.1, 2.1); cen.add(startL);
	const cenL = tag("Centrifugeuse"); cenL.position.set(0, 3.1, 0); cen.add(cenL);
	const labBlood = makeTube(LX - 5.3, Y + .3, -3.0, "#c4362f"); labBlood.set(1);
	const labWater = makeTube(LX - 4.6, Y + .3, -3.0, "#1f5fbf"); labWater.set(1);
	box(1.8, .3, .7, "#cfd6dd", LX - 4.95, Y, -3.0);
	const lbL = tag("Sang", { size:.018 }); lbL.position.set(0, 1.5, 0); labBlood.g.add(lbL);
	const lwL = tag("Eau", { size:.018, bg:"#fff", fg:"#0f3168" }); lwL.position.set(0, 1.5, 0); labWater.g.add(lwL);
	// la flottation : un tube dans son portoir, une lamelle à côté
	box(1, .5, .7, "#cfd6dd", LX - 1.6, Y, -3.4);
	const flotT = makeTube(LX - 1.6, Y + .2, -3.4, "#e8ecef"); flotT.liq.material.color.set("#9c7a46"); flotT.set(1.1);
	const flotL = tag("Flottation", { size:.018 }); flotL.position.set(0, 1.6, 0); flotT.g.add(flotL);
	const lamelle = mesh(G(new THREE.BoxGeometry(.55, .03, .55)), M("#cfeaf5", { transparent:true, opacity:.75 }), LX - .4, Y + .02, -2.6);
	const lamHome = lamelle.position.clone();
	const lamHit = hitBox(1.2, .8, 1.2, scene, LX - .4, Y + .3, -2.6);
	const lamL = tag("Lamelle", { size:.018 }); lamL.position.set(LX - .4, Y + 1, -2.6); scene.add(lamL);
	// le verre à pied de la sédimentation, l'évier
	const verre = new THREE.Group(); const VERRE_HOME = V3(LX + 2, Y, -3.3); verre.position.copy(VERRE_HOME); scene.add(verre);
	cyl(.6, .6, .08, glass, 0, 0, 0, verre); cyl(.08, .08, .4, glass, 0, .08, 0, verre);
	mesh(G(new THREE.CylinderGeometry(.85, .2, 2.4, 24, 1, true)), glass, 0, 1.68, 0, verre);
	const vlg = G(new THREE.CylinderGeometry(.8, .2, 1, 20)); vlg.translate(0, .5, 0);
	const vLiq = mesh(vlg, M("#8a6a3e", { transparent:true, opacity:.85 }), 0, .5, 0, verre);
	const culot = mesh(G(new THREE.CylinderGeometry(.3, .19, .3, 14)), M("#4f3b26"), 0, .64, 0, verre);
	const vHit = hitBox(2, 3.2, 2, verre, 0, 1.6, 0);
	const verreL = tag("Verre à pied", { size:.018 }); verreL.position.set(0, 3.5, 0); verre.add(verreL);
	box(3, .1, 2.2, steel, LX + 5.6, Y, -3.6);
	mesh(G(new THREE.PlaneGeometry(2.5, 1.7)), M("#7e868f", { metalness:.6, roughness:.35 }), LX + 5.6, Y + .11, -3.6).rotation.x = -Math.PI/2;
	const sinkL = tag("Évier", { size:.018, bg:"#fff", fg:"#0f3168" }); sinkL.position.set(LX + 5.6, Y + 1, -3.6); scene.add(sinkL);
	const SINK_AT = V3(LX + 3.3, Y + .6, -3.5);
	const pourJet = mesh(G(new THREE.CylinderGeometry(.06, .06, 1, 8)), M("#c9b48a", { transparent:true, opacity:.8 }), 0, 0, 0); pourJet.visible = false;
	// le microscope
	const mic = new THREE.Group(); mic.position.set(LX + 9.5, Y, -3.9); scene.add(mic);
	box(1.8, .3, 2.2, "#0f3168", 0, 0, 0, mic); box(.45, 3.2, .6, "#0f3168", 0, .3, -.8, mic);
	box(1.7, .12, 1.4, "#22324f", 0, 1.5, .1, mic);
	cyl(.42, .42, .25, "#c9d2da", 0, 2.75, .05, mic); cyl(.12, .1, .5, "#f3b23b", 0, 2.3, .05, mic);
	const tubeM = mesh(G(new THREE.CylinderGeometry(.2, .2, 1.6, 14)), M("#e8ecef"), 0, 3.6, -.25, mic); tubeM.rotation.x = -.35;
	const micL = tag("Microscope", { size:.018 }); micL.position.set(0, 4.8, 0); mic.add(micL);
	const MIC_AT = V3(LX + 9.5, Y + 1.66, -3.8);

	scene.traverse(n => { if(n.isMesh && n.material && n.material.transparent) n.castShadow = false; });     // le verre ne fait pas d'ombre pleine

	/* --- la flèche qui montre quoi toucher --- */
	const arrow = label("▼", { size:.03, bg:"#21b7cb", fg:"#0f3168" }); arrow.visible = false; scene.add(arrow);
	let arrowAt = null; const tmp = new THREE.Vector3();
	// point(objet, hauteur de la flèche, geste) : la flèche dit où, le guide mime quoi faire (tap, hold, down, side, trace)
	const guide = guideGeste(root, W.camera, cv);
	function point(obj, dy = 1.6, k = "tap", o = {}){
		arrowAt = obj ? { obj, dy } : null; arrow.visible = !!obj;
		guide.show(obj, k, o);
	}
	W.onFrame(guide.update);
	W.onFrame(now => { if(!arrowAt) return; arrowAt.obj.getWorldPosition(tmp); arrow.position.set(tmp.x, tmp.y + arrowAt.dy + Math.sin(now/220)*.12, tmp.z); });

	/* --- petites animations --- */
	function tween(ms, fn, done){
		const t0 = performance.now();
		const off = W.onFrame(now => { const k = Math.min(1, (now - t0)/(ms/SPEED)); fn(W.ease(k), k); if(k >= 1){ off(); if(done && !closed) done(); } });
		return off;
	}
	function moveTo(g, to, ms = 400, arc = .8, done){ const from = g.position.clone(); return tween(ms, e => { g.position.lerpVectors(from, to, e); g.position.y += arc*4*e*(1 - e); }, done); }
	const wiggle = g => { const r0 = g.rotation.y; tween(420, (e, k) => g.rotation.y = r0 + Math.sin(k*Math.PI*6)*.1*(1 - k), () => g.rotation.y = r0); };

	/* --- la main : toucher, maintenir, faire glisser --- */
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
	// tests automatiques : chaque objet touchable, par son nom
	const OBJ = { chest:chestAt, body:bodyHit, eye:eyeHit, tail:tailHit, thermo:thermoHit, start:startHit, water:labWater.hit, blood:labBlood.hit, lamelle:lamHit, verre:vHit, mud, ground:groundHit, doseur:doseHit, sheet };
	SLOTS.forEach(s => OBJ["slot" + s.i] = s.at);
	STAKES.forEach(s => OBJ["stake" + s.id] = s.hit);
	HERD.forEach((c, i) => OBJ["cow" + i] = c.hit);

	/* ================= le dossier de visite ================= */
	let hooks = [];
	const hook = f => { let last = 0; hooks.push(W.onFrame(now => { const dt = last ? Math.min(.25, (now - last)/1000) : 0; last = now; f(now, dt); })); };
	const hint = t => { $(".cr-hint").textContent = t || ""; };
	const clock = (add = 0) => { S.clock += add; const m = S.clock % 1440; return `${String(Math.floor(m/60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
	function view(target, dDesk, dPhone, polar, az){ W.fly(target, innerWidth < 760 ? dPhone : dDesk, polar, az); }
	function stage(k, title){
		S.step = k;
		const i = STEP_UI.findIndex(s => s[0] === k);
		root.querySelectorAll(".cr-steps span").forEach((s, j) => s.className = k === "end" || j < i ? "done" : j === i ? "now" : "");
		ev("stage", title);
		targets = []; act = null; W.controls.enabled = true; hooks.forEach(off => off()); hooks = []; point(null); hint("");
	}
	function page(kicker, title, body){
		book.innerHTML = `<div class="cr-top"><b>Dossier de visite</b><span>Ferme du Riez · génisses</span></div>
			<div class="cr-k">${kicker}</div><h2 class="cr-h">${title}</h2>${body}<div class="cr-log" data-log></div><div class="cr-note" data-visa></div><div data-live></div>`;
		book.scrollTop = 0;
	}
	const scrollEnd = () => { book.scrollTop = book.scrollHeight; };
	function entry(t, o = {}){
		const el = book.querySelector("[data-log]"); if(!el) return null;
		const e = document.createElement("div"); e.className = "cr-e" + (o.proof ? " p" : "");
		e.innerHTML = `<time>${clock(o.min ?? 3)}</time><span class="t">${t}</span>`;
		el.appendChild(e); scrollEnd(); return e;
	}
	function strike(e, why){ if(!e) return; e.classList.add("x"); e.insertAdjacentHTML("beforeend", `<span></span><span class="why">barré : ${why}</span>`); scrollEnd(); }
	function visa(t){ const el = book.querySelector("[data-visa]"); if(el){ el.innerHTML = t ? `<small>Mot de la Dre Vasseur, vétérinaire associée</small>${t}` : ""; scrollEnd(); } }
	const live = html => { const el = book.querySelector("[data-live]"); if(el){ el.innerHTML = html; scrollEnd(); } };
	const append = html => { const el = book.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); scrollEnd(); } };
	const setTxt = (sel, t) => { const el = book.querySelector(sel); if(el) el.textContent = t; };
	function err(why){ S.errors++; play("bad"); ev("err", why); }
	function proof(k, t){
		if(!S.proofs.some(p => p[0] === k)) S.proofs.push([k, t]);
		$("[data-prv]").textContent = `${S.proofs.length} / 5`;
		play("chime"); return entry(t, { proof:true });
	}
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="cr-course"><small>En prépa concours B</small><b>${n}</b><span>${t}</span></div>`; }
	const next = (k, t) => `<button class="cr-go" data-a="next:${k}">${t}</button>`;

	/* ---------- 1 · l'examen de la génisse 27 (scène d'ouverture) ---------- */
	function examen(){
		stage("exam", "1 · Examiner la génisse 27");
		view(V3(.2, 1.5, 1.8), 13.5, 10, 1.08, .05);
		const first = !S.examDone;
		let rub = false, th = false, eyeOk = false, holding = false, t0 = 0, bip = false, tNow = 35.2, done = false;
		ring.visible = false; conj.visible = false; thermo.position.copy(thermoHome); lcd(thermoScr, "— °C");
		page(first ? `Mini-jeu · ${formation.name}` : "1 · L'examen", "Le troupeau du Riez",
			`${first ? `<p class="cr-p">Mardi, 7 h 30, dans les Flandres. Depuis la rentrée, les génisses de Rémi, éleveur de vaches flamandes à la <b>ferme du Riez</b>, maigrissent ; la <b>n° ${TAG}</b> tient à peine debout. Rémi accuse le <b>nouvel aliment</b>, acheté en septembre. Tu es <b>vétérinaire rural·e</b> : trouve la cause, prouve-la, soigne le troupeau.</p>` : ""}
			<p class="cr-p">Trois gestes d'examen, la génisse bloquée au cornadis : <b>passe le ruban</b> autour de sa poitrine (glisse sur elle, juste derrière les pattes avant), <b>maintiens le thermomètre</b> jusqu'au bip, et <b>tire sa paupière</b> vers le bas.</p>
			<div class="cr-num"><div><small>tour de poitrine</small><span data-r>—</span></div><div><small>température</small><span data-t>—</span></div><div><small>muqueuse</small><span data-m>—</span></div></div>
			<canvas class="cr-graph" width="640" height="210" data-eye hidden aria-label="La muqueuse de l'œil, comparée au nuancier"></canvas>`);
		function nextHint(){
			if(!rub){ point(chestAt, 1.3, "down"); guideRing.visible = true; hint("✋ Glisse de haut en bas sur sa poitrine, derrière les pattes avant"); }
			else if(!th){ guideRing.visible = false; point(thermo, 1.4, "hold", { gy:.3 }); hint("✋ Appuie sur le thermomètre et garde le doigt jusqu'au bip"); }
			else if(!eyeOk){ guideRing.visible = false; c27.head.getWorldPosition(headAt); view(headAt.clone().add(V3(.06, -.36, .32)), 4.6, 4, 1.05, .85); /* gros plan de trois quarts, entre les barreaux du cornadis */ point(eyeHit, .9, "down"); hint("✋ Glisse vers le bas sur l'œil pour tirer la paupière"); }
			else { point(null); hint(""); guideRing.visible = false; view(V3(.2, 1.5, 1.8), 13.5, 10, 1.08, .05); }
		}
		nextHint();
		function check(){
			if(done || !(rub && th && eyeOk)) return;
			done = true; S.examDone = true;
			proof("exam", `Génisse ${TAG} : ${kg(T_CHEST)} kg au lieu de ≈ ${P_EXP}, ${fr(TEMP)} °C, muqueuses pâles. Maigre et pâle, sans fièvre.`);
			append(`<p class="cr-p">Maigre, pâle, mais <b>sans fièvre</b> : ce n'est pas une infection brutale. Des muqueuses pâles, c'est souvent un sang pauvre en globules rouges, une <b>anémie</b>. Et Rémi le dit : la n° ${TAG} n'est pas la seule à fondre.</p>
				${course("bio")}${first ? "" : next("lot", "Voir le troupeau →")}`);
			if(first) later(2200, () => palier({ id:"clinique", onEvent, openLead, quit:close,
				titre:`La génisse ${TAG} est maigre et pâle, sans fièvre. Et elle n'est pas la seule.`,
				texte:"Rémi accuse l'aliment. Compare les deux prés, analyse le sang et les bouses, lis le sol du pré… puis signe l'ordonnance qui sauvera le troupeau.",
				suite:"Mener l'enquête (≈ 6 min)" }).then(troupeau));
		}
		function measured(zone){
			if(zone === "belly"){
				err("ruban sur le ventre");
				const e = entry(`Tour : ${fr(T_BELLY, 2)} m, soit ≈ ${kg(T_BELLY)} kg.`); strike(e, "le ruban était passé sur le ventre");
				visa(`${kg(T_BELLY)} kg pour une génisse qui a la peau sur les os ? Le ruban est passé sur le <b>ventre</b>, gonflé par la panse pleine d'herbe. La formule ne vaut que pour le <b>tour de poitrine, juste derrière les épaules</b>.`);
				later(900, () => { ring.visible = false; nextHint(); });
				return;
			}
			rub = true; play("good"); visa("");
			setTxt("[data-r]", fr(T_CHEST, 2) + " m");
			entry(`Tour de poitrine : ${fr(T_CHEST, 2)} m, donc ≈ ${kg(T_CHEST)} kg.`);
			append(`<p class="cr-p">Le poids d'un animal suit son volume, donc le <b>cube</b> de sa taille : P ≈ 80 × T³ (formule simplifiée). 80 × 1,62³ ≈ <b>${kg(T_CHEST)} kg</b>, quand une génisse de 18 mois en pèse ≈ ${P_EXP} : <b>−${Math.round((P_EXP - kg(T_CHEST))/P_EXP*100)} %</b>.</p>`);
			S.learned.add("maths");
			later(1100, () => { ring.visible = false; nextHint(); check(); });
		}
		function openEye(){
			eyeOk = true; play("good"); conj.visible = true; setTxt("[data-m]", "pâle");
			const c = book.querySelector("[data-eye]");
			if(c){ c.hidden = false; const x = c.getContext("2d"), w = c.width, h = c.height;
				x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
				x.fillStyle = "#7b2f22"; x.beginPath(); x.ellipse(170, 105, 150, 92, 0, 0, 7); x.fill();
				x.fillStyle = "#f1dcd8"; x.beginPath(); x.ellipse(170, 132, 96, 40, 0, 0, Math.PI); x.fill();
				x.fillStyle = "#1a1a1a"; x.beginPath(); x.ellipse(170, 100, 78, 50, 0, 0, 7); x.fill();
				x.fillStyle = "#4a3a30"; x.beginPath(); x.ellipse(170, 100, 36, 24, 0, 0, 7); x.fill();
				x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.arc(150, 86, 9, 0, 7); x.fill();
				x.font = "700 19px Inter,Arial,sans-serif"; x.fillStyle = "#0c2340"; x.fillText("Nuancier", 372, 32);
				[["#e0707f", "rose vif : normal"], ["#f1dcd8", "pâle, « porcelaine » : anémie"]].forEach(([col, t], i) => { x.fillStyle = col; x.fillRect(372, 52 + i*70, 54, 46); x.strokeStyle = "#c9d6e3"; x.strokeRect(372, 52 + i*70, 54, 46); x.fillStyle = "#4f5c69"; x.font = "300 17px Inter,Arial,sans-serif"; x.fillText(t, 434, 80 + i*70); });
				x.strokeStyle = "#b91c1c"; x.lineWidth = 3; x.beginPath(); x.moveTo(268, 150); x.lineTo(366, 145); x.stroke();
			}
			entry("Muqueuse de l'œil pâle, couleur porcelaine (rose vif attendu).");
			nextHint(); check();
		}
		targets = [
			{ hit:bodyHit, down:a => {
				if(rub) return;
				const lp = c27.g.worldToLocal(a.h.point.clone());
				a.zone = lp.x > .2 ? "chest" : "belly"; a.rx = a.zone === "chest" ? .75 : -.45; a.lx = a.x0; a.ly = a.y0; a.path = 0; point(null);
			}, move:(a, e) => {
				if(rub || !a.zone || a.fin) return;
				a.path += Math.hypot(e.clientX - a.lx, e.clientY - a.ly); a.lx = e.clientX; a.ly = e.clientY;
				const p = Math.min(1, a.path/(innerWidth < 760 ? 110 : 140)); setRing(a.rx, p);      // un seul glissé franc suffit
				if(p >= 1){ a.fin = true; play("swipe"); measured(a.zone); }
			}, up:a => { if(!rub && a.zone && !a.fin){ ring.visible = false; nextHint(); hint("✋ Glisse plus loin, jusque sous le ventre : le ruban doit faire tout le tour"); } } },
			{ hit:thermoHit, down:() => {
				if(th || holding) return;
				holding = true; bip = false; t0 = performance.now(); point(null); hint("⏳ Garde le doigt appuyé…");
				moveTo(thermo, TH_AT, 300, .5);
			}, up:() => {
				if(!holding) return; holding = false; moveTo(thermo, thermoHome, 300, .5);
				if(!bip){
					err("thermomètre retiré trop tôt");
					const e = entry(`Température : ${fr(tNow)} °C.`); strike(e, "thermomètre retiré avant le bip");
					visa(`${fr(tNow)} °C, ce serait une génisse glacée ! Le thermomètre n'avait pas fini de monter : il lui faut quelques secondes pour se mettre à la température de l'animal. On le laisse <b>jusqu'au bip</b>.`);
					lcd(thermoScr, "— °C"); nextHint(); return;
				}
				th = true; play("good"); visa(""); setTxt("[data-t]", fr(TEMP) + " °C");
				entry(`Température : ${fr(TEMP)} °C (normale : 38 à 39,5 °C). Pas de fièvre.`);
				nextHint(); check();
			} },
			{ hit:eyeHit, down:a => { a.ey = false; }, move:(a, e) => { if(eyeOk || a.ey) return; if(e.clientY - a.y0 > 18){ a.ey = true; openEye(); } }, tap:() => { if(!eyeOk) hint("✋ Glisse vers le bas, sur l'œil, pour tirer la paupière"); } }
		];
		hook(now => {
			if(!holding) return;
			const tt = (now - t0)/1000*SPEED;
			tNow = TEMP - (TEMP - 35.2)*Math.exp(-tt/.8);
			if(tt > 2.6 && !bip){ bip = true; tNow = TEMP; play("clic"); hint("🔔 Bip ! Tu peux lâcher"); }
			lcd(thermoScr, fr(bip ? TEMP : tNow) + " °C", bip ? "BIP" : "");
			setTxt("[data-t]", fr(bip ? TEMP : tNow) + " °C");
		});
	}

	/* ---------- 2 · le troupeau : deux prés, le même aliment ---------- */
	function troupeau(){
		stage("lot", "2 · Comparer les deux prés");
		if(innerWidth < 760) W.fly(V3(70.5, 0, -.5), 40, .9, 1.45); else W.fly(V3(70.5, 0, -.5), 52, .85, 1.15);      // sur téléphone, les deux prés de face, l'un derrière l'autre
		let marked = 0, done = false;
		HERD.forEach(c => { c.mark.visible = false; c.marked = false; c.g.visible = true; });
		page("2 · Au pré · maths", "Est-ce l'aliment ?",
			`<p class="cr-p">Rémi est formel : « C'est le nouvel aliment ! » Mais ses génisses vivent en deux lots : <b>douze au pré du haut</b>, <b>douze au pré du bas</b>, le long du marais. Et les deux lots reçoivent <b>le même aliment</b>, dans les mêmes auges.</p>
			<p class="cr-p"><b>Touche chaque génisse maigre</b> pour la marquer à la bombe : colonne et hanches qui saillent, côtes visibles, tête basse. Regarde bien les deux prés.</p>
			<div class="cr-num"><div><small>pré du haut</small><span data-h>0 / ${N_LOT}</span></div><div><small>pré du bas</small><span data-b>0 / ${N_LOT}</span></div></div>`);
		hint("👆 Marque à la bombe chaque génisse maigre");
		function markCow(c){
			if(done || c.marked) return;
			if(!c.thin){
				if(c.young){ err("génisse jeune marquée"); visa("Petite, oui, mais pas maigre : c'est la plus jeune du lot, elle a 12 mois. Dos plein, hanches couvertes, poil brillant. On juge l'<b>état</b> d'un animal, pas sa taille."); }
				else { err("génisse en bon état marquée"); visa("Celle-ci est en bon état : dos plein, hanches couvertes, poil rouge et brillant. Une génisse maigre a la colonne et les hanches qui saillent, les côtes visibles et le poil terne."); }
				wiggle(c.g); return;
			}
			c.marked = true; marked++; play("swipe"); visa("");
			c.mark.visible = true; c.mark.scale.setScalar(.01); tween(260, e => c.mark.scale.setScalar(Math.max(.01, e)));
			setTxt("[data-b]", `${marked} / ${N_LOT}`);
			if(marked < N_SICK) return;
			done = true; hint("");
			const pct = Math.round(N_SICK/N_LOT*100);
			proof("lot", `Pré du bas : ${N_SICK} génisses maigres sur ${N_LOT} (${pct} %) ; pré du haut : 0 sur ${N_LOT}, avec le même aliment. L'aliment est hors de cause.`);
			live(`<table class="cr-tbl"><tr><td>Pré du haut</td><td>0 / ${N_LOT} · 0 %</td></tr><tr><td>Pré du bas</td><td>${N_SICK} / ${N_LOT} · ${pct} %</td></tr></table>
				<p class="cr-p">Même aliment, même âge, même race… et pas une génisse maigre au pré du haut. Si l'aliment était en cause, les deux lots seraient touchés. Le pré du haut sert de <b>groupe témoin</b> : c'est le <b>pré du bas</b> qui rend malade. Mais comment ?</p>
				${course("maths")}${next("sang", "Prendre du sang à la génisse 27 →")}`);
		}
		targets = HERD.map(c => ({ hit:c.hit, tap:() => markCow(c) }));
	}

	/* ---------- 3 · le sang : prélever, centrifuger, lire l'hématocrite ---------- */
	function sang(){
		stage("sang", "3 · Le sang");
		view(V3(-2, 1.8, .6), 10, 7.5, 1.15, -.4);
		let fill = 0, holding = false, phase = "draw", slot = null, water = null, waterSel = false, tries = 0, busy = false, done = false;
		tube.set(0); tube.g.position.copy(tube.home);
		labBlood.g.position.copy(labBlood.home); labWater.g.position.copy(labWater.home); labBlood.g.visible = labWater.g.visible = true;
		rotor.rotation.y = 0; lid.rotation.x = LID_OPEN; cen.rotation.set(0, 0, 0);
		page("3 · Prise de sang · physique", "Le sang manque-t-il ?",
			`<p class="cr-p">Des muqueuses pâles font penser à une <b>anémie</b>. On la mesure par l'<b>hématocrite</b> : la part du volume du sang occupée par les globules rouges.</p>
			<p class="cr-p"><b>Maintiens le tube</b> contre la veine, sous la queue, le temps qu'il se remplisse.</p>
			<div class="cr-num"><div><small>tube</small><span data-f>0 %</span></div></div>`);
		point(tailHit, 1.6, "hold"); hint("✋ Appuie sous la queue et garde le doigt : le tube se remplit");
		const slotTargets = () => [{ hit:rotorHit, tap:a => { const lp = rotor.worldToLocal(a.h.point.clone()); slotTap(((Math.round(Math.atan2(lp.z, lp.x)/(Math.PI/4)) % 8) + 8) % 8); } }];
		targets = [{ hit:tailHit, down:() => { if(phase !== "draw") return; holding = true; point(null); moveTo(tube.g, TUBE_AT, 250, .4); },
			up:() => { if(!holding) return; holding = false; if(fill < 1){ moveTo(tube.g, tube.home, 250, .4); hint("✋ Garde le doigt jusqu'à ce que le tube soit plein"); point(tailHit, 1.6, "hold"); } } }];
		hook((now, dt) => {
			if(holding && phase === "draw"){
				fill = Math.min(1, fill + dt*.75*SPEED); tube.set(fill); setTxt("[data-f]", Math.round(fill*100) + " %");
				if(fill >= 1){ holding = false; phase = "lab"; play("good"); hint(""); moveTo(tube.g, tube.home, 300, .4); entry("Prise de sang à la veine de la queue : un tube de 5 mL, bouché.", { min:4 }); later(800, toLab); }
			}
		});
		function toLab(){
			view(V3(LX - 6.6, Y + .8, -3.4), 12, 8, 1.0, 0);
			append(`<p class="cr-p">Au labo de la clinique, la <b>centrifugeuse</b> fait tourner le tube à 3 000 tours par minute : les globules rouges, plus denses, filent au fond. <b>Touche un logement du rotor</b> pour y poser le tube de sang, puis lance l'appareil.</p>`);
			point(rotor, 1.3); hint("👆 Pose le tube de sang dans le rotor");
			targets = [...slotTargets(), { hit:startHit, tap:startTap }, { hit:labWater.hit, tap:waterTap }];
		}
		function placeIn(t, i){ const p = SLOTS[i].at.getWorldPosition(new THREE.Vector3()); moveTo(t.g, V3(p.x, p.y - .44, p.z), 400, 1); }
		function slotTap(i){
			if(busy || done) return;
			if(slot === null){ slot = i; play("pop"); placeIn(labBlood, i); point(startBtn, .8); hint("👆 Lance la centrifugeuse"); return; }
			if(waterSel && water === null){
				if(i === slot) return;
				if(i !== (slot + 4) % 8){ err("tube d'équilibrage mal placé"); visa("Pas pile en face : les deux masses doivent être <b>symétriques par rapport à l'axe</b>, sinon le rotor reste déséquilibré."); return; }
				water = i; play("pop"); placeIn(labWater, i); point(startBtn, .8); hint("👆 Lance la centrifugeuse"); visa("");
			}
		}
		function waterTap(){
			if(busy || done || slot === null || water !== null) return;
			waterSel = true; play("pop"); point(null); moveTo(labWater.g, V3(labWater.home.x, labWater.home.y + .9, labWater.home.z), 250, .2);
			hint("👆 Pose-le dans le logement pile en face du sang");
		}
		function startTap(){
			if(busy || done) return;
			if(slot === null){ hint("👆 Pose d'abord le tube de sang dans le rotor"); return; }
			if(waterSel && water === null){ hint("👆 Pose d'abord le tube d'eau en face"); return; }
			busy = true; play("clic"); point(null); hint("");
			tween(300, e => lid.rotation.x = LID_OPEN*(1 - e), () => { labBlood.g.visible = labWater.g.visible = false; });
			if(water === null){
				tries++;
				const t1 = performance.now();
				const off = W.onFrame(now => { const k = (now - t1)/1000*SPEED; rotor.rotation.y += .4; cen.rotation.z = Math.sin(k*38)*.05*Math.min(1, k); cen.position.x = LX - 8 + Math.sin(k*31)*.08*Math.min(1, k); });
				later(1500, () => {
					off(); cen.rotation.z = 0; cen.position.x = LX - 8; rotor.rotation.y = 0; err("rotor déséquilibré");
					const e = entry("Centrifugation lancée avec un seul tube."); strike(e, "arrêt d'urgence : rotor déséquilibré");
					visa(`Un seul tube : la masse n'est plus répartie autour de l'axe. À 3 000 tours par minute, le rotor tire d'un côté, la machine vibre et se coupe — ou casse. Méthode : <b>un tube d'eau de même masse, pile en face</b>, pour que le centre de gravité reste sur l'axe de rotation.`);
					tween(300, e2 => lid.rotation.x = LID_OPEN*e2); labBlood.g.visible = labWater.g.visible = true;
					busy = false; point(labWater.g, 1.6); hint("👆 Prends le tube d'eau d'équilibrage");
				});
				return;
			}
			const t1 = performance.now();
			const off = W.onFrame(now => { const k = Math.min(1, (now - t1)/1400*SPEED); rotor.rotation.y += .1 + k*.7; });
			later(2200, () => {
				off(); tween(300, e => lid.rotation.x = LID_OPEN*e); labBlood.g.visible = labWater.g.visible = true;
				entry("Centrifugation, 5 minutes, rotor équilibré par un tube d'eau.", { min:6 });
				labBlood.liq.material.color.set("#c9a23f"); reading();
			});
		}
		function reading(){
			hint("✋ Dans le dossier, place le trait à la limite entre globules et plasma");
			append(`<p class="cr-p">Dans le tube, deux couches : les <b>globules rouges</b> au fond, le <b>plasma</b> jaune au-dessus. <b>Fais glisser le trait</b> jusqu'à leur limite pour lire l'hématocrite.</p>
				<canvas class="cr-graph" width="640" height="190" data-hct aria-label="Tube centrifugé, avec l'échelle de l'hématocrite"></canvas>`);
			const c = book.querySelector("[data-hct]"), X0 = 50, L = 540;
			let cx = X0 + L*.6;
			const pct = () => Math.round((cx - X0)/L*100);
			function draw(ok){
				const x = c.getContext("2d"); x.clearRect(0, 0, 640, 190);
				x.fillStyle = "#8e1b1b"; x.fillRect(X0, 50, L*HCT/100, 46);
				x.fillStyle = "#f4f1ea"; x.fillRect(X0 + L*HCT/100, 50, 5, 46);
				x.fillStyle = "#f0d47a"; x.fillRect(X0 + L*HCT/100 + 5, 50, L*(1 - HCT/100) - 5, 46);
				x.strokeStyle = "#4f5c69"; x.lineWidth = 2; x.strokeRect(X0, 50, L, 46);
				x.fillStyle = "#848487"; x.font = "700 16px Inter,Arial,sans-serif";
				for(let p = 0; p <= 100; p += 10){ const X = X0 + L*p/100; x.fillRect(X - 1, 100, 2, p % 50 ? 8 : 14); if(p % 20 === 0) x.fillText(p + " %", X - 14, 134); }
				x.fillText("fond du tube", X0, 36); x.fillText("plasma", X0 + L - 60, 36);
				x.strokeStyle = ok ? "#2f6b45" : "#21b7cb"; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, 38); x.lineTo(cx, 108); x.stroke();
				x.fillStyle = ok ? "#2f6b45" : "#21b7cb"; x.beginPath(); x.arc(cx, 160, 16, 0, 7); x.fill();
				x.fillStyle = "#0c2340"; x.font = "700 20px Inter,Arial,sans-serif"; x.fillText(pct() + " %", Math.min(560, cx + 22), 168);
			}
			draw();
			let drag = false;
			const setX = e => { const r = c.getBoundingClientRect(); cx = Math.max(X0, Math.min(X0 + L, (e.clientX - r.left)/r.width*640)); draw(); };
			c.addEventListener("pointerdown", e => { if(done) return; drag = true; try { c.setPointerCapture(e.pointerId); } catch(x){} setX(e); });
			c.addEventListener("pointermove", e => { if(drag) setX(e); });
			const up = () => {
				if(!drag) return; drag = false;
				if(Math.abs(pct() - HCT) > 2){ hint("✋ Place le trait pile à la limite rouge / jaune"); return; }
				done = true; cx = X0 + L*HCT/100; draw(true); play("good"); hint(""); S.hct = HCT;
				proof("hct", `Hématocrite : ${HCT} % (normale : 24 à 46 %). La génisse ${TAG} est anémiée : elle perd du sang.`);
				append(`<p class="cr-p">Les globules rouges n'occupent que <b>${HCT} %</b> du sang, au lieu de 24 à 46 % : une <b>anémie</b> nette. Aucune plaie, aucun saignement visible : quelque chose lui prend du sang de l'intérieur. Un parasite ? Direction les bouses.</p>
					${course("phys")}${tries ? course("colles") : ""}${next("copro", "Analyser les bouses →")}`);
			};
			c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
		}
	}

	/* ---------- 4 · les bouses : flottation, sédimentation, microscope ---------- */
	function drawMic(c, eggs, measured, line){
		const x = c.getContext("2d");
		x.save(); x.clearRect(0, 0, 260, 260); x.beginPath(); x.arc(130, 130, 130, 0, 7); x.clip();
		x.fillStyle = eggs === EGGS ? "#e3ebf3" : "#eef1ea"; x.fillRect(0, 0, 260, 260);
		for(const d of DEBRIS){ x.fillStyle = d.c; x.beginPath(); x.arc(d.x, d.y, d.r, 0, 7); x.fill(); }
		for(const g of eggs){
			x.save(); x.translate(g.x, g.y); x.rotate(g.a);
			if(g.gold){
				const gr = x.createRadialGradient(-6, -5, 4, 0, 0, g.l/2); gr.addColorStop(0, "#f0c862"); gr.addColorStop(1, "#b9831f");
				x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, g.l/2, g.w/2, 0, 0, 7); x.fill();
				x.strokeStyle = "#7a5410"; x.lineWidth = 2.5; x.stroke();
				x.beginPath(); x.moveTo(g.l/2 - 9, -g.w/2 + 7); x.quadraticCurveTo(g.l/2 - 5, 0, g.l/2 - 9, g.w/2 - 7); x.stroke();      // l'opercule
				x.fillStyle = "rgba(122,84,16,.35)"; for(let i = 0; i < 7; i++){ x.beginPath(); x.arc(-g.l/4 + (i % 4)*8, -6 + Math.floor(i/4)*11, 4, 0, 7); x.fill(); }
			} else {
				x.fillStyle = "rgba(205,212,206,.9)"; x.beginPath(); x.ellipse(0, 0, g.l/2, g.w/2, 0, 0, 7); x.fill();
				x.strokeStyle = "#7d8a86"; x.lineWidth = 1.5; x.stroke();
				x.fillStyle = "rgba(110,120,115,.6)"; for(let i = 0; i < 6; i++){ x.beginPath(); x.arc(-8 + (i % 3)*8, -4 + Math.floor(i/3)*8, 3.5, 0, 7); x.fill(); }
			}
			x.restore();
		}
		if(line){ x.strokeStyle = measured ? "#21b7cb" : "#0f3168"; x.lineWidth = 3; x.beginPath(); x.moveTo(line[0], line[1]); x.lineTo(line[2], line[3]); x.stroke(); }
		if(measured){ x.fillStyle = "#0c2340"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText(measured, Math.min(200, measured === "140 µm" ? line[2] + 6 : 140), Math.max(24, line[3] - 8)); }
		x.restore();
	}
	function copro(){
		stage("copro", "4 · Les bouses");
		view(V3(LX + 1, Y + 1, -3.4), 15, 10, 1.0, 0);
		let phase = "flot", level = 1, settled = false, pouring = false, done = false, lost = 0, busy = false;
		lamelle.position.copy(lamHome); verre.position.copy(VERRE_HOME); verre.rotation.set(0, 0, 0); culot.visible = true; pourJet.visible = false;
		const setLevel = l => { level = l; vLiq.visible = l > .02; const r = .25 + .75*l; vLiq.scale.set(r, Math.max(.01, l*2.25), r); };
		setLevel(1); vLiq.material.color.set("#8a6a3e"); culot.scale.setScalar(.4);
		page("4 · Coproscopie · chimie, physique", "Un parasite dans les bouses ?",
			`<p class="cr-p">Les parasites du tube digestif et du foie pondent des œufs, qui sortent avec les bouses. Méthode habituelle, la <b>flottation</b> : la bouse est délayée dans de l'eau très salée, de densité 1,2 ; les œufs plus légers remontent et se collent à une lamelle posée sur le tube.</p>
			<p class="cr-p"><b>Pose la lamelle</b> sur le tube de flottation.</p>
			<canvas class="cr-eye" width="260" height="260" data-mic aria-label="Ce que l'on voit au microscope"></canvas>`);
		const mc = book.querySelector("[data-mic]");
		{ const x = mc.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 260, 260); }
		point(lamelle, 1.1); hint("👆 Pose la lamelle sur le tube");
		const lamTarget = { hit:lamHit, tap:() => {
			if(phase !== "flot" || busy) return; busy = true; play("pop"); point(null); hint("⏳ 10 minutes : les œufs légers remontent");
			moveTo(lamelle, V3(flotT.g.position.x, Y + 1.2, flotT.g.position.z), 400, .8, () => later(1600, () => {
				S.clock += 10;
				moveTo(lamelle, MIC_AT, 700, 1.4, () => {
					drawMic(mc, EGGS_FLOT);
					const e = entry("Flottation : 3 œufs de strongles, petits et gris. Aucun œuf de douve."); strike(e, "les œufs les plus lourds sont restés au fond");
					visa(`Trois œufs de <b>strongles</b>, un petit ver banal, qui n'explique pas une telle anémie. Mais la flottation a un angle mort : un œuf <b>plus dense que la solution</b> ne remonte pas, la poussée d'Archimède ne compense plus son poids. C'est le cas des œufs de <b>douve</b>, gros et lourds. Méthode : la <b>sédimentation</b>, on les laisse couler et on garde le fond.`);
					append(`<button class="cr-go" data-a="sedi">Refaire par sédimentation</button>`);
					busy = false;
				});
			}));
		} };
		targets = [lamTarget];
		actions.sedi = () => {
			if(phase !== "flot") return; phase = "sedi"; visa("");
			const b = book.querySelector('[data-a="sedi"]'); if(b) b.remove();
			append(`<p class="cr-p"><b>Sédimentation.</b> Dans le verre à pied, la bouse délayée dans de l'eau : les œufs lourds tombent au fond, dans le <b>culot</b>. <b>Maintiens le verre</b> pour verser l'eau du dessus dans l'évier, et lâche avant que le culot ne parte.</p>
				<div class="cr-num"><div><small>dans le verre</small><span data-l>100 %</span></div></div>`);
			view(V3(LX + 3.6, Y + 1.2, -3.4), 12.5, 8.5, 1.02, 0);
			settle();
		};
		function settle(){
			settled = false; culot.visible = true; culot.scale.setScalar(.4); vLiq.material.color.set("#8a6a3e"); setLevel(1); setTxt("[data-l]", "100 %");
			hint("⏳ 5 minutes de repos : tout tombe au fond");
			const c0 = new THREE.Color("#8a6a3e"), c1 = new THREE.Color("#cbbf9b");
			tween(1600, e => { vLiq.material.color.copy(c0).lerp(c1, e); culot.scale.setScalar(.4 + .6*e); }, () => {
				settled = true; S.clock += 5; point(verre, 3.6, "hold", { gy:1.6 }); hint("✋ Appuie sur le verre et garde le doigt pour verser l'eau du dessus");
				targets = [{ hit:vHit, down:startPour, up:stopPour }];
			});
		}
		function startPour(){ if(!settled || phase !== "sedi" || pouring) return; pouring = true; point(null); moveTo(verre, SINK_AT, 250, .3); }
		function stopPour(){
			if(!pouring) return; pouring = false; pourJet.visible = false;
			const r0 = verre.rotation.z; tween(300, e => verre.rotation.z = r0*(1 - e)); moveTo(verre, VERRE_HOME, 300, .3);
			if(level < .16){
				lost++; err("culot versé à l'évier");
				const e = entry("Culot parti dans l'évier."); strike(e, "versé trop loin : les œufs sont partis avec l'eau");
				visa("Le culot est parti avec l'eau, et les œufs avec lui. On recommence avec un autre morceau de bouse, et on lâche <b>dès que le fond trouble arrive au bord</b>.");
				later(700, settle); return;
			}
			if(level > .42){ hint("✋ Encore : verse l'eau claire du dessus"); point(verre, 3.6, "hold", { gy:1.6 }); return; }
			phase = "mic"; play("good"); hint(""); visa("");
			entry("Eau du dessus versée, culot gardé ; une goutte sur la lame, avec du bleu de méthylène.");
			drawMic(mc, EGGS); targets = [];
			append(`<p class="cr-p">Au microscope, le culot. <b>Trace un trait</b> d'un bout à l'autre d'un œuf pour le mesurer.</p>`);
			book.querySelector("[data-live]").appendChild(mc); scrollEnd();
			hint("✋ Au microscope, trace un trait sur la longueur d'un œuf");
		}
		hook((now, dt) => {
			if(!pouring) return;
			const target = -(.5 + (1 - level)*1.25);
			verre.rotation.z += (target - verre.rotation.z)*Math.min(1, dt*6);
			if(verre.rotation.z < -.45){
				setLevel(Math.max(0, level - dt*.3));
				pourJet.visible = level > .02;
				verre.updateMatrixWorld(); const lip = V3(.85, 2.85, 0).applyMatrix4(verre.matrixWorld);
				stick(pourJet, lip, V3(lip.x + .25, Y + .15, lip.z));
				if(level < .16){ culot.visible = false; vLiq.material.color.set("#6b5232"); }
				setTxt("[data-l]", Math.round(level*100) + " %");
			}
		});
		// mesurer un œuf, au doigt, dans l'oculaire
		let p0 = null;
		const mpos = e => { const r = mc.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*260, (e.clientY - r.top)/r.height*260]; };
		mc.addEventListener("pointerdown", e => { if(phase !== "mic" || done) return; p0 = mpos(e); try { mc.setPointerCapture(e.pointerId); } catch(x){} });
		mc.addEventListener("pointermove", e => { if(!p0) return; const p = mpos(e); drawMic(mc, EGGS, null, [...p0, ...p]); });
		const mup = e => {
			if(!p0) return; const p = mpos(e), a = p0; p0 = null;
			const L = Math.hypot(p[0] - a[0], p[1] - a[1]), mx = (a[0] + p[0])/2, my = (a[1] + p[1])/2;
			let best = null, bd = 30; for(const g of EGGS){ const d = Math.hypot(g.x - mx, g.y - my); if(d < bd){ bd = d; best = g; } }
			if(!best || L < 15){ drawMic(mc, EGGS); hint("✋ Trace un trait d'un bout à l'autre d'un œuf"); return; }
			if(!best.gold){ drawMic(mc, EGGS, `≈ ${Math.round(L*2/10)*10} µm`, [...a, ...p]); hint("≈ 80 µm, gris, coque fine : un strongle. Cherche plus gros"); return; }
			if(L < best.l*.6 || L > best.l*1.45){ drawMic(mc, EGGS, null, [...a, ...p]); hint("✋ Sur toute la longueur de l'œuf, d'un bout à l'autre"); return; }
			done = true; play("good"); hint(""); visa("");
			const ux = Math.cos(best.a)*best.l/2, uy = Math.sin(best.a)*best.l/2;
			drawMic(mc, EGGS, "140 µm", [best.x - ux, best.y - uy, best.x + ux, best.y + uy]);
			proof("douve", "Œufs de grande douve du foie (Fasciola hepatica) : jaune doré, operculés, 140 µm. Ce ver vit dans le foie et se nourrit de sang.");
			append(`<p class="cr-p">Des œufs <b>jaune doré</b>, fermés par un petit couvercle (l'opercule), longs de <b>140 µm</b> : ceux de la <b>grande douve du foie</b>. Ce ver plat vit dans les canaux du foie et se nourrit de sang : voilà l'anémie et la maigreur. Mais la douve ne passe pas d'une vache à l'autre : son cycle exige un petit escargot d'eau, la <b>limnée</b>. Où vit-elle, au pré du bas ?</p>
				${course("chimie")}${lost ? course("colles") : ""}${next("pre", "Retourner au pré du bas →")}`);
		};
		mc.addEventListener("pointerup", mup); mc.addEventListener("pointercancel", mup);
	}

	/* ---------- 5 · le pré du bas : le sol, la limnée, la clôture ---------- */
	function pre(){
		stage("pre", "5 · Le pré du bas");
		view(V3(85, 0, .5), 34, 22, .85, 0);
		const cored = new Set(), snails = []; let busy = false, drawing = false, pts = [], done = false;
		STAKES.forEach(s => s.core.visible = false); snailG.clear(); fenceG.clear(); auger.visible = false;
		HERD.forEach(c => { if(c.lot === "bas") c.g.visible = false; });         // Rémi a rentré le lot du bas : le pré est libre pour travailler
		page("5 · Au pré · géologie, écologie", "Où vit la limnée ?",
			`<p class="cr-p">Rémi a rentré les génisses du bas. Le pré descend en pente douce vers le ru. <b>Carotte le sol à la tarière</b> aux trois piquets, du haut (A) jusqu'au bas (C).</p>
			<table class="cr-tbl" data-soil>${STAKES.map(s => `<tr><td>${s.id} · ${{ A:"en haut", B:"au milieu", C:"en bas, près du ru" }[s.id]}</td><td data-c="${s.id}">—</td></tr>`).join("")}</table>`);
		point(STAKES[0].g, 3.6, "tap", { gy:1 }); hint("👆 Touche le piquet A pour carotter le sol");
		const stakeTargets = STAKES.map(s => ({ hit:s.hit, tap:() => coreAt(s) }));
		targets = stakeTargets;
		function coreAt(s){
			if(busy || cored.has(s.id)) return;
			busy = true; play("pop"); point(null);
			auger.visible = true; auger.position.set(s.x + .9, 1.2, s.z - .3); auger.rotation.y = 0;
			tween(900, (e, k) => { auger.position.y = 1.2 - 1.6*e; auger.rotation.y = k*Math.PI*6; }, () => {
				auger.visible = false; s.core.visible = true; cored.add(s.id); busy = false;
				const td = book.querySelector(`[data-c="${s.id}"]`); if(td) td.innerHTML = s.soil;
				if(cored.size < 3){ const n = STAKES.find(q => !cored.has(q.id)); point(n.g, 3.6, "tap", { gy:1 }); hint(`👆 Touche le piquet ${n.id}`); return; }
				entry("Trois carottages : limon sec en haut, argile grise détrempée en bas.");
				append(`<p class="cr-p">En bas, une <b>argile</b> : ses grains minuscules laissent à peine passer l'eau, elle est presque <b>imperméable</b>. L'eau de la pente et de la source s'y accumule. Le gris trahit un sol privé d'oxygène ; les taches de rouille, le fer qui s'oxyde quand l'eau baisse l'été : un <b>sol hydromorphe</b>, détrempé presque toute l'année. Le domaine de la limnée.</p>${course("geol")}`);
				point(mud, 1); hint("👆 Fouille la boue au bord du ru");
				targets = [{ hit:mud, tap:a => snailAt(a) }];
			});
		}
		function snailAt(a){
			if(snails.length >= 3) return;
			const p = a.h.point;
			if(snails.some(s => Math.hypot(s.x - p.x, s.z - p.z) < 1.4)){ hint("🔍 Cherche un peu plus loin dans la boue"); return; }
			const m = new THREE.Group(); m.position.set(p.x, .05, p.z); snailG.add(m);
			const sh = new THREE.Mesh(shellGeo, shellM); sh.rotation.z = -1.1; sh.position.y = .2; m.add(sh);
			m.scale.setScalar(.01); tween(300, e => m.scale.setScalar(Math.max(.01, e*1.3)));
			snails.push({ x:p.x, z:p.z }); play("pop");
			if(snails.length < 3){ hint(`🔍 Une limnée ! ${snails.length} / 3 : continue à fouiller`); return; }
			point(null);
			proof("limnee", "Limnées tronquées dans la zone humide, au bas du pré : l'escargot qui héberge la douve. Le pré du haut, sec, n'en a pas.");
			append(`<p class="cr-p">Des <b>limnées</b> : l'escargot dont la douve a besoin. Voici le cycle, qui passe par deux hôtes :</p>
				<canvas class="cr-graph" width="640" height="330" data-cycle aria-label="Le cycle de la grande douve du foie"></canvas>
				<p class="cr-p">Pour le casser sans traiter à vie, on coupe le maillon du pré : <b>trace au doigt une clôture</b> autour de la zone humide (la boue et les joncs), sans prendre plus de pré qu'il n'en faut.</p>`);
			drawCycle(book.querySelector("[data-cycle]"));
			hint("✋ Trace au doigt une boucle autour de la boue et des joncs");
			point(mud, 0, "trace", { r:innerWidth < 760 ? 60 : 95 }); arrow.visible = false;
			targets = [{ hit:groundHit, down:fenceDown, move:fenceMove, up:fenceUp }];
		}
		function drawCycle(c){
			if(!c) return; const x = c.getContext("2d"), cx = 320, cy = 165;
			const N = [["Douve adulte", "dans le foie"], ["Œufs", "dans les bouses"], ["Larve nageuse", "dans l'eau"], ["Limnée", "l'escargot hôte"], ["Larves enkystées", "sur l'herbe"], ["Génisse", "qui broute"]];
			const P = N.map((_, i) => { const a = -Math.PI/2 + i*Math.PI/3; return [cx + Math.cos(a)*215, cy + Math.sin(a)*118]; });
			x.strokeStyle = "#21b7cb"; x.lineWidth = 3; x.fillStyle = "#21b7cb";
			P.forEach((p, i) => { const q = P[(i + 1) % 6], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), ux = dx/L, uy = dy/L, s = [p[0] + ux*60, p[1] + uy*30], t = [q[0] - ux*60, q[1] - uy*30];
				x.beginPath(); x.moveTo(...s); x.lineTo(...t); x.stroke(); const ang = Math.atan2(t[1] - s[1], t[0] - s[0]); x.beginPath(); x.moveTo(...t); x.lineTo(t[0] - 12*Math.cos(ang - .4), t[1] - 12*Math.sin(ang - .4)); x.lineTo(t[0] - 12*Math.cos(ang + .4), t[1] - 12*Math.sin(ang + .4)); x.fill(); });
			P.forEach((p, i) => { const hot = i === 3 || i === 2; x.fillStyle = hot ? "#0f3168" : "#fff"; x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.beginPath(); x.roundRect(p[0] - 92, p[1] - 27, 184, 54, 10); x.fill(); x.stroke();
				x.textAlign = "center"; x.fillStyle = hot ? "#fff" : "#0c2340"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText(N[i][0], p[0], p[1] - 3); x.font = "300 15px Inter,Arial,sans-serif"; x.fillStyle = hot ? "#9fe6ef" : "#4f5c69"; x.fillText(N[i][1], p[0], p[1] + 17); });
			x.textAlign = "center"; x.fillStyle = "#13808f"; x.font = "700 15px Inter,Arial,sans-serif"; x.fillText("en bleu : la zone humide", cx, cy + 6); x.textAlign = "left";
		}
		const G0 = new THREE.Plane(V3(0, 1, 0), 0), gp = new THREE.Vector3();
		function addPt(x, z){
			const last = pts[pts.length - 1];
			pts.push([x, z]);
			mesh(fPost, fPostM, x, 0, z, fenceG);
			if(last){ const w = new THREE.Mesh(fWire, fWireM); fenceG.add(w); stick(w, V3(last[0], .95, last[1]), V3(x, .95, z)); }
		}
		function fenceDown(a){ if(done) return; point(null); fenceG.clear(); pts = []; drawing = true; visa(""); addPt(a.h.point.x, a.h.point.z); }
		function fenceMove(a, e){
			if(!drawing) return; setRay(e); if(!ray.ray.intersectPlane(G0, gp)) return;
			const last = pts[pts.length - 1]; if(Math.hypot(gp.x - last[0], gp.z - last[1]) >= .9) addPt(gp.x, gp.z);
		}
		const inside = (x, z) => { let c = false; for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){ const [xi, zi] = pts[i], [xj, zj] = pts[j]; if((zi > z) !== (zj > z) && x < (xj - xi)*(z - zi)/(zj - zi) + xi) c = !c; } return c; };
		function fenceUp(){
			if(!drawing) return; drawing = false;
			if(pts.length < 6){ fenceG.clear(); hint("✋ Trace une boucle complète autour de la boue et des joncs"); return; }
			const first = pts[0], last = pts[pts.length - 1], w = new THREE.Mesh(fWire, fWireM); fenceG.add(w); stick(w, V3(last[0], .95, last[1]), V3(first[0], .95, first[1]));
			let area = 0; for(let i = 0, j = pts.length - 1; i < pts.length; j = i++) area += (pts[j][0] + pts[i][0])*(pts[j][1] - pts[i][1]);
			const frac = Math.abs(area)/2/500;
			const rim = Array.from({ length:12 }, (_, i) => [WET.x + Math.cos(i*Math.PI/6)*WET.rx*.8, WET.z + Math.sin(i*Math.PI/6)*WET.rz*.8]);
			const out = snails.filter(s => !inside(s.x, s.z)).length + rim.filter(([x, z]) => !inside(x, z)).length + (inside(WET.x, WET.z) ? 0 : 1);
			if(out){ err("clôture qui laisse la zone humide"); visa("Une partie de la zone humide reste hors de ta clôture : les génisses y brouteraient l'herbe où attendent les larves. Englobe <b>toute la boue et les joncs</b>, et les limnées trouvées."); later(700, () => fenceG.clear()); return; }
			if(frac > .3){ err("clôture trop grande"); visa(`Ta clôture prend ${Math.round(frac*100)} % du pré : les génisses perdent de la bonne herbe pour rien. Serre <b>au plus près de la zone humide</b>.`); later(700, () => fenceG.clear()); return; }
			done = true; play("good"); hint(""); visa("");
			S.ha = Math.max(.1, Math.round(frac*PRE_HA*10)/10);
			entry(`Clôture posée autour de la zone humide : ${fr(S.ha)} ha mis en défens, sur ${fr(PRE_HA)} ha.`);
			append(`<p class="cr-p">Plus de génisses dans la zone humide : plus de larves avalées, plus d'œufs dans l'eau, plus de limnées infestées. Le cycle est <b>coupé</b>, et le reste du pré, sain, reste pâturé. Aménager la parcelle plutôt que traiter à vie : c'est déjà le métier d'<b>ingénieur·e agronome</b>.</p>
				${course("eco")}${next("ord", "Préparer le traitement →")}`);
		}
	}

	/* ---------- 6 · l'ordonnance : régler le doseur, signer ---------- */
	function ordonnance(){
		stage("ord", "6 · L'ordonnance");
		view(V3(KX + 1.3, KY + .4, KZ), 6.5, 5.5, 1.05, .05);
		let vol = 10, done = false;
		sheet.visible = sheetPaper.visible = false;
		const setDose = v => { vol = Math.round(Math.max(0, Math.min(60, v))); plunger.position.x = -.65 - vol/60*.9; doseLiq.visible = vol > 0; doseLiq.scale.y = Math.max(.01, vol/60*1.25); doseLiq.position.x = .65; setTxt("[data-d]", vol + " mL"); };
		page("6 · Le traitement · maths", "Régler le doseur",
			`<p class="cr-p">Les douze génisses du pré du bas recevront un <b>douvicide</b> par la bouche, au pistolet doseur. Posologie (produit fictif) : <b>1 mL pour 10 kg</b>. Le doseur se règle une fois pour tout le lot.</p>
			<table class="cr-tbl"><tr><td>Poids au ruban des génisses maigres</td><td>${W_SICK.join(" · ")} kg</td></tr><tr><td>Poids moyen</td><td>${W_MEAN} kg</td></tr></table>
			<p class="cr-p"><b>Fais glisser le piston</b> du doseur pour régler la dose, puis valide.</p>
			<div class="cr-num"><div><small>dose par génisse</small><span data-d>10 mL</span></div></div>
			<button class="cr-go" data-a="dose">Valider la dose</button>`);
		setDose(10);
		point(doseur, 1.2, "side"); hint("✋ Glisse le piston du doseur, à gauche ou à droite");
		targets = [{ hit:doseHit, down:a => { a.v0 = vol; point(null); }, move:(a, e) => { if(!done) setDose(a.v0 + (a.x0 - e.clientX)/4 + (a.y0 - e.clientY)/6); } }];
		actions.dose = () => {
			if(done) return;
			if(vol < DOSE){
				err("sous-dosage");
				const e = entry(`Doseur réglé à ${vol} mL.`); strike(e, "sous-dosage");
				visa(Math.abs(vol - W_MEAN/10) <= 1.5
					? `${vol} mL, c'est la dose du poids <b>moyen</b>. La génisse de 378 kg recevrait ${Math.round((378 - vol*10)/378*100)} % de trop peu : sous-dosées, des douves survivent… et leurs descendantes <b>résistent</b> au produit. Règle : on dose pour <b>la plus lourde du lot</b>.`
					: `Avec ${vol} mL, les plus lourdes ne reçoivent pas leur dose : des douves survivent, et deviennent résistantes. 1 mL pour 10 kg, réglé sur <b>la plus lourde du lot</b>.`);
				return;
			}
			if(vol > DOSE + 2){
				err("surdosage");
				const e = entry(`Doseur réglé à ${vol} mL.`); strike(e, "surdosage");
				visa(`${vol} mL, c'est plus que la dose de la plus lourde (${Math.max(...W_SICK)} kg) : du produit payé pour rien, et un foie déjà malade à ménager. 1 mL pour 10 kg, réglé sur <b>la plus lourde</b>, arrondi au mL au-dessus.`);
				return;
			}
			done = true; play("good"); visa(""); point(null); hint(""); S.dose = vol;
			const b = book.querySelector('[data-a="dose"]'); if(b) b.disabled = true;
			entry(`Doseur réglé à ${vol} mL : la dose de la plus lourde (${Math.max(...W_SICK)} kg) ; aucune n'est sous-dosée.`);
			later(900, signer);
		};
	}
	function signer(){
		view(V3(OX, OY, OZ), 12.5, 9, .2, 0);
		sheet.visible = sheetPaper.visible = true;
		let strokes = [], ink = 0, signed = false, drawing = false, lastP = null;
		const SIG = [860, 790, 1350, 970];
		const ROWS = [
			["Constat", `Pré du bas : ${N_SICK} / ${N_LOT} génisses maigres, anémiées (hématocrite ${S.hct ?? HCT} %) ; pré du haut : 0 / ${N_LOT}`],
			["Cause", "FASCIOLOSE : grande douve du foie (œufs à la coproscopie)"],
			["Origine", "Zone humide argileuse au bas du pré, limnées présentes"],
			["Traitement", `Douvicide (fictif), ${S.dose ?? DOSE} mL par génisse, par la bouche, tout le lot du bas`],
			["Prévention", `Zone humide clôturée (${fr(S.ha ?? .4)} ha) ; contrôle des bouses dans 6 semaines`],
			["Aliment", "Hors de cause : rien à changer"]
		];
		function draw(){
			ordTex.redraw((x, w, h) => {
				x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
				x.fillStyle = "#0f3168"; x.fillRect(0, 0, w, 110);
				x.fillStyle = "#fff"; x.font = "300 44px 'Tiempos Headline',Times New Roman,serif"; x.fillText("Ordonnance et compte rendu de visite", 50, 70);
				x.font = "700 21px Inter,Arial,sans-serif"; x.textAlign = "right"; x.fillText("Clinique vétérinaire des Prés (fictive)", w - 50, 68); x.textAlign = "left";
				x.fillStyle = "#4f5c69"; x.font = "300 24px Inter,Arial,sans-serif";
				x.fillText("Élevage : ferme du Riez (fictive), Rémi, éleveur · génisses flamandes de 18 mois", 50, 160);
				ROWS.forEach(([k, v], i) => {
					const y = 230 + i*86;
					x.fillStyle = i % 2 ? "#fffdf8" : "#eef5f7"; x.fillRect(40, y - 44, w - 80, 80);
					x.fillStyle = "#13808f"; x.font = "700 21px Inter,Arial,sans-serif"; x.fillText(k.toUpperCase(), 54, y + 6);
					x.fillStyle = i === 1 ? "#b91c1c" : "#0c2340"; x.font = `${i === 1 ? 700 : 300} 25px Inter,Arial,sans-serif`; x.fillText(v, 270, y + 6);
				});
				x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.strokeRect(SIG[0], SIG[1], SIG[2] - SIG[0], SIG[3] - SIG[1]);
				x.fillStyle = "#848487"; x.font = "700 18px Inter,Arial,sans-serif"; x.fillText("SIGNATURE DU OU DE LA VÉTÉRINAIRE", SIG[0] + 14, SIG[1] + 30);
				x.strokeStyle = "#0f3168"; x.lineWidth = 5; x.lineCap = "round"; x.lineJoin = "round";
				for(const s of strokes){ x.beginPath(); s.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
				if(signed){ x.save(); x.translate(420, 900); x.rotate(-.08); x.strokeStyle = x.fillStyle = "#2f6b45"; x.lineWidth = 6; x.globalAlpha = .85; x.strokeRect(-190, -42, 380, 84); x.font = "700 34px Inter,Arial,sans-serif"; x.textAlign = "center"; x.fillText("TRANSMIS À L'ÉLEVEUR", 0, 12); x.restore(); }
			});
		}
		draw();
		page("6 · Le verdict", "L'ordonnance",
			`<p class="cr-p">Tout est au dossier. Relis l'ordonnance, puis <b>signe dans le cadre</b>, en bas à droite : ta signature engage la clinique, et Rémi traitera son troupeau sur ta parole.</p>
			<ul class="cr-list">${S.proofs.length ? S.proofs.map(p => `<li>${p[1]}</li>`).join("") : "<li>(preuves des étapes précédentes)</li>"}</ul>`);
		hint("✍️ Signe dans le cadre, en bas à droite de l'ordonnance");
		const uvPx = h => h && h.uv ? [h.uv.x*BW, (1 - h.uv.y)*BH] : null;
		const inSig = p => p && p[0] > SIG[0] && p[0] < SIG[2] && p[1] > SIG[1] && p[1] < SIG[3];
		targets = [{ hit:sheet,
			down:a => { if(signed) return; const p = uvPx(a.h); if(!inSig(p)){ hint("✍️ Signe dans le cadre, en bas à droite"); return; } drawing = true; strokes.push([p]); lastP = p; },
			move:(a, e) => { if(!drawing) return; setRay(e); const h = ray.intersectObject(sheet)[0]; const p = uvPx(h); if(!inSig(p)) return; ink += Math.hypot(p[0] - lastP[0], p[1] - lastP[1]); lastP = p; strokes[strokes.length - 1].push(p); draw(); },
			up:() => {
				if(!drawing) return; drawing = false;
				if(ink < 260){ hint("✍️ Signe en entier dans le cadre"); return; }
				signed = true; play("tampon"); draw(); hint(""); entry("Ordonnance signée et remise à Rémi.", { min:5 }); later(1300, fin);
			} }];
	}

	/* ---------- bilan ---------- */
	function fin(){
		stage("end", "Bilan");
		view(V3(OX, OY, OZ), 13, 9.5, .5, 0);
		sheet.visible = sheetPaper.visible = true;
		play("win");
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 7 ? "Bien" : "Assez bien";
		ev("win", mention);
		const order = ["bio", "maths", "phys", "chimie", "geol", "eco", "colles"].filter(k => S.learned.has(k));
		page(`${formation.name} · bilan`, "Le troupeau est sauvé",
			`<span class="cr-done">DOSSIER RÉSOLU</span>
			<p class="cr-p">Six semaines plus tard, Rémi t'appelle : plus un œuf de douve dans les bouses, et les génisses du pré du bas reprennent du poids, la n° ${TAG} la première. La zone humide, clôturée, est devenue une mare à tritons. Et l'aliment ? Rémi le garde : il n'y était pour rien, preuve à l'appui.</p>
			<table class="cr-tbl"><tr><td>Mention</td><td>${mention}</td></tr><tr><td>Preuves au dossier</td><td>${S.proofs.length} / 5</td></tr><tr><td>Lignes barrées, erreurs</td><td>${e}</td></tr></table>
			<p class="cr-p">Tu as fait le travail d'un·e <b>vétérinaire rural·e</b> : examiner, mesurer, comparer à un groupe témoin, analyser le sang et les bouses, lire un sol, couper un cycle, doser un traitement. Biologie, chimie, physique, maths, géologie : ce sont les épreuves du <b>concours B</b>, que la prépa travaille en même temps que la <b>Licence Sciences de la Vie</b>, avec des colles chaque semaine. Le concours B ouvre les quatre écoles vétérinaires publiques (Alfort, VetAgro Sup à Lyon, Oniris à Nantes, Toulouse) et les écoles nationales d'agronomie (AgroParisTech, L'Institut Agro…). Et si le concours ne passe pas, la licence est là.</p>
			<ul class="cr-list">${order.map(k => `<li>${COURSES[k][0]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="cr-go" data-a="lead">📄 Recevoir la plaquette</button>` : ""}
			<a class="cr-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa et la licence ↗</a>
			<button class="cr-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="cr-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { exam:examen, lot:troupeau, sang, copro, pre, ord:ordonnance, sign:signer, end:fin };
	const actions = {};
	root.addEventListener("click", e => {
		const b = e.target.closest("[data-a]"); if(!b || b.disabled) return;
		const a = b.dataset.a; play("pop");
		if(a.startsWith("next:")) return STEPS[a.slice(5)]();
		if(actions[a]) return actions[a]();
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); b.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){
			Object.assign(S, { errors:0, learned:new Set(), proofs:[], clock:7*60 + 30, hct:undefined, ha:undefined, dose:undefined });
			$("[data-prv]").textContent = "0 / 5"; sheet.visible = sheetPaper.visible = false;
			examen();
		}
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		if(ringGeo) ringGeo.dispose();
		W.dispose(); hidden.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".cr-x").addEventListener("click", close);

	W.place(V3(.2, 1.5, 1.8), 13.5, 1.08, .05);
	examen();      // ouverture à chaud : la génisse 27 est au cornadis, sans écran de règles
	ev("start");
	ev("missions", [["1 · L'examen", examen], ["2 · Le troupeau", troupeau], ["3 · Le sang", sang], ["4 · Les bouses", copro], ["5 · Le pré du bas", pre], ["6 · L'ordonnance", ordonnance], ["Bilan", fin]]);
	if(window.campus) window.campus.game = { S, W, OBJ, STEPS, actions, HERD, EGGS, SLOTS };
}
