/* « L'Enquête de l'auditeur » — mini-jeu de la Licence Comptabilité-Finance-Audit (ISEA), en 3D (2026).
   Un bureau de cabinet d'audit, au bâtiment Michel Falise. La trésorerie d'une PME fictive fond sans raison :
   le joueur enquête avec les outils de chaque année, de la main, sur le bureau :
   - L1 · comptabilité : glisser chaque pièce dans sa bannette (charge, produit, immobilisation) ;
   - L1 · fiscalité : calculer le TTC sur la calculatrice ;
   - L1 · rapprochement bancaire : pointer au crayon chaque ligne du relevé vers sa facture ;
   - L2 · contrôle de gestion : repérer la barre qui dérape, calculer l'écart ;
   - L3 · audit : frapper chaque pièce du bon tampon ;
   - L3 · droit des sociétés et enquête : lire le Kbis, tendre le fil rouge entre les indices.
   La fiche est une feuille de travail d'auditeur sur son porte-bloc ; la responsable laisse des notes de revue.
   Entreprise, personnes, sociétés et documents sont fictifs. Contenu à relire par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mountTable, MOBILE } from "./table.js?v=fdd5d880ac";
import { jpoCard } from "./jpo.js?v=fdd5d880ac";

const COURSES = {
	compta:   ["L1", "Comptabilité financière", "Classer chaque opération : une charge, un produit, ou un investissement qui s'amortit sur plusieurs années."],
	fisca:    ["L1", "Fiscalité", "TVA collectée, TVA déductible, hors taxe et toutes taxes comprises : le quotidien d'un comptable."],
	banque:   ["L1", "Rapprochement bancaire", "Chaque mouvement du compte doit correspondre à une pièce justificative. Sinon, on cherche pourquoi."],
	cdg:      ["L2", "Contrôle de gestion", "Comparer le budget au réel, analyser les écarts et alerter la direction à temps."],
	audit:    ["L3", "Pratique de l'expertise comptable (en alternance)", "Contrôler les pièces, collecter des preuves et alerter : la démarche de l'auditeur, que l'on approfondit ensuite en master Comptabilité-Contrôle-Audit."],
	societes: ["L3", "Droit des sociétés", "Lire un Kbis : forme, capital, siège, dirigeant. Une société sans salarié, créée il y a deux mois et domiciliée chez le comptable, ça se remarque."]
};
const euro = v => v.toLocaleString("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " €";
const euro0 = v => v.toLocaleString("fr-FR") + " €";
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[c]);

// les feuilles du dossier de travail, comme dans un vrai cabinet : A, B, C…
const TABS = [["A", "Pièces", "tri"], ["B", "TVA", "tva"], ["C", "Banque", "bank"], ["D", "Budget", "budget"], ["E", "Contrôle", "stamp"], ["F", "Enquête", "board"], ["G", "Rapport", "end"]];
const TIMELINE = [["Dossier", "Dossier", ["intro"]], ...TABS.map(([l, n, k]) => [n, l, [k]])];

const EXTRA_CSS = `
/* l'enquête : la fiche devient une feuille de travail d'auditeur, pincée sur un porte-bloc ; ni frise ni bulle */
.tb.aw .tb-tl,.tb.aw .tb-bubble{display:none!important}
.tb.aw .tb-chip{background:#1e305e;color:#fff;box-shadow:0 4px 12px rgba(20,30,50,.25)}
.tb.aw .tb-stage{background:#fffdf6;color:#1e305e}
.tb.aw .tb-x{background:#1e305e;color:#fff;box-shadow:0 4px 12px rgba(20,30,50,.25)}
.tb.aw .tb-m{background:rgba(255,253,246,.95)}
.tb.aw .tb-m.prv b{color:#2f6b45}.tb.aw .tb-m.err b{color:#b91c1c}
.tb.aw .tb-hint{background:#1e305e;color:#fff;box-shadow:0 4px 12px rgba(20,30,50,.25)}
.tb.aw .tb-wrap{background:#7b5a3c;padding:26px 9px 9px;box-sizing:border-box;border-radius:12px;box-shadow:0 22px 44px rgba(20,25,35,.45),inset 0 0 0 2px #6a4b30;scrollbar-width:thin;overscroll-behavior:contain}
@media (min-width:${MOBILE}px){ .tb.aw .tb-wrap{top:56px;right:16px;bottom:14px;width:404px} }
@media (max-width:${MOBILE - 1}px){ .tb.aw .tb-wrap{padding:20px 6px 0;border-radius:16px 16px 0 0} }
.tb.aw .tb-card{border:0;border-radius:3px;padding:14px 14px 20px 32px;box-shadow:0 2px 6px rgba(0,0,0,.28);font-variant-numeric:tabular-nums;
	background:linear-gradient(90deg,transparent 22px,#e7a9a9 22px 23.5px,transparent 23.5px),repeating-linear-gradient(#fbfaf3 0 25px,#d8e6dc 25px 26px)}
@media (max-width:${MOBILE - 1}px){ .tb.aw .tb-card{border-radius:3px 3px 0 0;padding:12px 12px 24px 28px;background:linear-gradient(90deg,transparent 18px,#e7a9a9 18px 19.5px,transparent 19.5px),repeating-linear-gradient(#fbfaf3 0 25px,#d8e6dc 25px 26px)} }
.aw-clip{position:absolute;top:-24px;left:50%;transform:translateX(-50%);width:118px;height:34px;border-radius:9px 9px 5px 5px;background:linear-gradient(#e4e7eb,#9aa2ab);box-shadow:0 3px 6px rgba(0,0,0,.35),inset 0 -3px 0 rgba(0,0,0,.15)}
.aw-clip:after{content:"";position:absolute;left:50%;top:7px;width:30px;height:9px;border-radius:5px;transform:translateX(-50%);background:#7b5a3c;box-shadow:inset 0 2px 3px rgba(0,0,0,.4)}
.aw-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-top:6px}
.aw-hd b{display:block;font:700 16px/1.2 Fraunces,Georgia,serif;color:#1e305e}
.aw-hd small{display:block;font-size:11.5px;font-weight:700;color:#6a6f78}
.aw-ref{flex:none;border:2px solid #1e305e;border-radius:4px;padding:2px 8px;text-align:center;font-size:10px;font-weight:800;letter-spacing:.08em;color:#1e305e;background:#fffdf6}
.aw-ref b{font:800 18px/1.1 Nunito,sans-serif}
.aw-meta{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:11.5px;font-weight:700;color:#6a6f78;margin:6px 0 4px}
.aw-meta i{font-family:Caveat,"Segoe Print","Bradley Hand",cursive;font-style:normal;font-size:16px;color:#1e3f8a}
.aw-tabs{display:flex;gap:3px;margin:6px 0 10px}
.aw-tabs span{flex:1;text-align:center;border-radius:4px 4px 0 0;padding:3px 0 2px;font-size:11px;font-weight:900;background:#e8e4d8;color:#9a958a;border-bottom:2px solid #d6d0c0}
.aw-tabs span.past{background:#dfeee3;color:#2f6b45;border-color:#9cc7a8}
.aw-tabs span.now{background:#1e305e;color:#fff;border-color:#1e305e}
.aw-k{font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8a2b4e}
.aw-h{font:700 21px/1.15 Fraunces,Georgia,serif;margin:2px 0 6px;color:#1b2140}
.aw-p{margin:0 0 9px;color:#3e434c;font-size:14px;line-height:1.5}
.aw-tm{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11.5px;font-weight:800;color:#6a6f78;margin:0 0 8px}
.aw-tm b{color:#2f6b45}.aw-tm b.r{color:#b91c1c}
.aw-pc{background:#fff;border:1px solid #ddd6c6;border-radius:4px;padding:8px 10px;margin:6px 0 8px;font-size:13.5px;box-shadow:0 2px 5px rgba(40,25,10,.08);animation:awIn .3s both}
.aw-pc .hd{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7a6f63}
.aw-pc .tt{font:700 15.5px Fraunces,Georgia,serif;margin:2px 0;color:#1b2140}
.aw-pc .ln{display:flex;justify-content:space-between;gap:8px;border-top:1px dashed #e3dccd;padding-top:3px;margin-top:3px}
.aw-pc .ln b{white-space:nowrap}
.aw-pc small{color:#6a6f78}
@keyframes awIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.aw-notes:empty{display:none}
.aw-note{position:relative;margin:8px 0 8px 4px;padding:2px 0 2px 10px;border-left:3px solid #c0362c;font:600 19px/1.15 Caveat,"Segoe Print","Bradley Hand",cursive;color:#b0281f;transform:rotate(-.6deg);animation:awIn .35s both}
.aw-note small{display:block;font:800 9.5px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#c0362c;opacity:.75}
.aw-opts{display:grid;gap:6px;margin:6px 0}
.aw-opt{display:flex;gap:9px;align-items:flex-start;text-align:left;border:1.5px solid #d6d0c0;background:#fffdf6;border-radius:6px;padding:9px 10px;font:700 14px/1.3 Nunito,sans-serif;cursor:pointer;color:#22262e}
.aw-opt:before{content:"";flex:none;width:15px;height:15px;border:2px solid #1e305e;border-radius:3px;margin-top:1px;background:#fff}
.aw-opt:hover{border-color:#1e305e}
.aw-opt.ok{border-color:#3d7a55;background:#eef8f0}.aw-opt.ok:before{content:"✓";color:#2f6b45;font:900 13px/15px Nunito;text-align:center;border-color:#2f6b45}
.aw-opt.ko{border-color:#c4532f;background:#fdeceb;text-decoration:line-through;color:#7a4038}.aw-opt.ko:before{content:"✗";color:#b91c1c;font:900 13px/15px Nunito;text-align:center;border-color:#b91c1c}
.aw-ok{color:#2f6b45;font-weight:800;font-size:13.5px;margin:4px 0}
.aw-course{background:#fff;border:2px solid #d9a441;border-radius:8px;padding:9px 11px;margin:9px 0 4px;animation:awIn .35s both}
.aw-course .tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:11.5px;border-radius:999px;padding:2px 8px;margin-bottom:4px}
.aw-course b{display:block;font:700 15.5px Fraunces,Georgia,serif;margin-bottom:2px;color:#1b2140}
.aw-course span{font-size:13px;color:#4f4a55}
.tb.aw .tb-go{background:#1e305e;border-radius:8px;font-size:15px;padding:12px}
.tb.aw .tb-alt{border-radius:8px;border:1.5px solid #c9c2b0;background:#fffdf6;color:#1e305e}
.aw-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.aw-tbl td,.aw-tbl th{padding:5px 3px;border-top:1px solid #ddd6c6;text-align:right}
.aw-tbl th{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#7a6f63;border-top:0}
.aw-tbl td:first-child,.aw-tbl th:first-child{text-align:left}
.aw-tbl tr.hot td{background:#fdeceb;font-weight:800}
.aw-list{list-style:none;padding:0;margin:6px 0;display:grid;gap:4px}
.aw-list li{font-size:13.5px;font-weight:700;border-bottom:1px dashed #d6d0c0;padding:3px 0}
.aw-list li span{color:#8a2b4e;font-weight:900;margin-right:6px}
.aw-sig{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin:12px 0 4px;font-size:11.5px;font-weight:700;color:#6a6f78}
.aw-sig i{font:600 24px Caveat,"Segoe Print",cursive;color:#1e3f8a;transform:rotate(-4deg);display:inline-block}
.aw-done{display:inline-block;border:3px solid #2f6b45;color:#2f6b45;font:900 13px Nunito,sans-serif;letter-spacing:.14em;padding:3px 9px;border-radius:5px;transform:rotate(-6deg);margin:4px 0 8px}
`;

/* ================= le bureau du cabinet, au bâtiment Michel Falise ================= */
const PX = 96;              // pixels de texture par unité, pour des documents lisibles
function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#dfe3e6"); scene.fog = new THREE.Fog("#dfe3e6", 70, 140);
	const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 36; controls.maxPolarAngle = 1.3;
	// pas de rotation libre : sur un bureau, un geste qui rate une pièce ne doit pas faire tourner la pièce entière
	controls.enableRotate = false;
	scene.add(new THREE.HemisphereLight("#ffffff", "#b7b2a8", 1.3));
	const sun = new THREE.DirectionalLight("#fff6e8", 1.9); sun.position.set(-12, 22, 10); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-20, right:20, top:20, bottom:-20, near:1, far:70 }); sun.shadow.bias = -.0005;
	scene.add(sun);
	const maxAniso = renderer.capabilities.getMaxAnisotropy();

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.75, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? M(c) : c, x, y + h/2, z);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
	const hidden = new THREE.MeshBasicMaterial({ visible:false });

	/* --- la pièce : moquette, murs clairs, fenêtre à stores, étagère de classeurs, le bureau --- */
	const FY = -12;
	{
		const deco = new THREE.Group(); scene.add(deco);
		const still = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; deco.add(m); return m; };
		const sbox = (w, h, d, c, x, y, z) => still(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? M(c) : c, x, y + h/2, z);
		const carpet = tex(128, 128, (x, w, h) => { x.fillStyle = "#7c8188"; x.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ x.fillStyle = Math.random() < .5 ? "#868b92" : "#72777e"; x.fillRect(Math.random()*w, Math.random()*h, 2, 2); } x.strokeStyle = "#6e737a"; x.strokeRect(0, 0, w, h); });
		carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(20, 20);
		still(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ map:carpet, roughness:.95 }), 0, FY, 0).rotation.x = -Math.PI/2;
		sbox(90, 40, 1, "#e9ecef", 0, FY, -11); sbox(90, .8, 1.2, "#c9ced3", 0, FY, -10.6);
		for(const sx of [-1, 1]) sbox(1, 40, 70, "#e3e7ea", sx*32, FY, 0);
		// grande fenêtre à stores vénitiens, en plein jour
		const sky = tex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9cc4e4"); g.addColorStop(1, "#e9eef0"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#c9cdd2"; x.fillRect(0, h*.66, w, h); x.fillStyle = "#a9afb7"; for(let i = 0; i < 5; i++) x.fillRect(8 + i*24, h*.72, 14, 18); });
		sbox(14.6, 17, .5, "#f7f8f9", -21, FY + 14, -10.4);
		still(new THREE.PlaneGeometry(13.6, 16), new THREE.MeshBasicMaterial({ map:sky }), -21, FY + 22.5, -10.1);
		for(let i = 0; i < 22; i++){ const s = sbox(13.6, .12, .5, "#eef0f2", -21, FY + 15 + i*.68, -9.8); s.rotation.x = .5; }
		// étagère de classeurs : un cabinet comptable, c'est d'abord des classeurs
		sbox(14, .4, 3, "#c9b08a", 20, FY + 12, -9.4); sbox(14, .4, 3, "#c9b08a", 20, FY + 18, -9.4);
		const spines = ["#1e305e", "#8a2b4e", "#2f6b45", "#d9a441", "#1e305e", "#5d6b7a", "#8a2b4e", "#2f6b45", "#1e305e", "#c4532f"];
		const tags = ["2022", "2023", "2024", "2025", "TVA", "Paie", "Banque", "Achats", "Ventes", "Immo."];
		for(let row = 0; row < 2; row++) for(let i = 0; i < 9; i++){
			const k = (i + row*4) % spines.length, x0 = 13.8 + i*1.45, y0 = FY + 12.4 + row*6;
			const sp = sbox(1.25, 5.2, 2.6, spines[k], x0, y0, -9.3);
			const lab = still(new THREE.PlaneGeometry(.9, 2.2), new THREE.MeshBasicMaterial({ map:tex(48, 120, (x, w, h) => { x.fillStyle = "#fbf8ef"; x.fillRect(0, 0, w, h); x.fillStyle = "#22262e"; x.font = "800 18px Nunito, sans-serif"; x.save(); x.translate(w/2 + 6, h - 8); x.rotate(-Math.PI/2); x.fillText(tags[(i + row*3) % tags.length], 0, 0); x.restore(); }) }), x0, y0 + 2.9, -7.99);
			sp.castShadow = false; lab.receiveShadow = false;
		}
		// le grand tableau de liège, au mur derrière le bureau
		const cork = tex(256, 128, (x, w, h) => { x.fillStyle = "#b98d5d"; x.fillRect(0, 0, w, h); for(let i = 0; i < 2600; i++){ x.fillStyle = ["#a77c4f", "#c79c6b", "#b08453", "#8e6a43"][i % 4]; x.fillRect(Math.random()*w, Math.random()*h, 1.5, 1.5); } });
		sbox(22, 12, .6, "#6b4a2e", 0, 2.6, -10.5);
		still(new THREE.PlaneGeometry(21, 11), new THREE.MeshStandardMaterial({ map:cork, roughness:1 }), 0, 8.6, -10.18);
		// une plante, un radiateur sous la fenêtre
		still(new THREE.CylinderGeometry(1.4, 1.1, 3, 18), M("#ece7dc"), 27, FY + 1.5, -6);
		for(let i = 0; i < 7; i++) still(new THREE.SphereGeometry(1.4 + (i % 3)*.3, 10, 8), M(["#4f7a45", "#5d8a4f", "#44683c"][i % 3]), 27 + Math.cos(i)*1, FY + 4.5 + (i % 4)*1.1, -6 + Math.sin(i)*1);
		sbox(12, 4, .8, "#f2f3f4", -21, FY + 6, -10.1);
	}
	// le bureau : plateau stratifié clair, chant chêne, pieds métal
	{
		scene.add(box(27, .5, 14.6, M("#efebe3", { roughness:.55 }), 0, -.5, 0));
		const edge = box(27.2, .18, 14.8, "#b8925f", 0, -.62, 0); scene.add(edge);
		for(const sx of [-1, 1]) for(const sz of [-1, 1]) scene.add(box(.6, 11.4, .6, M("#5f656d", { metalness:.6, roughness:.35 }), sx*12.6, FY, sz*6.6));
		// lampe, ordinateur portable (le logiciel comptable ouvert), mug, pot à crayons
		const lamp = new THREE.Group(); lamp.position.set(11.6, 0, -5.2); scene.add(lamp);
		const metal = M("#2b2f36", { metalness:.5, roughness:.4 });
		lamp.add(mesh(new THREE.CylinderGeometry(.9, 1, .3, 24), metal, 0, .15, 0));
		const arm = mesh(new THREE.CylinderGeometry(.09, .09, 5, 8), metal, -.9, 2.6, .4); arm.rotation.z = .35; lamp.add(arm);
		const shade = mesh(new THREE.ConeGeometry(1.1, 1.4, 24, 1, true), M("#2b2f36", { side:THREE.DoubleSide }), -2, 5, .4); shade.rotation.z = .3; lamp.add(shade);
		lamp.add(mesh(new THREE.SphereGeometry(.3, 12, 10), new THREE.MeshBasicMaterial({ color:"#fff6dc" }), -2.1, 4.45, .4));
		const lap = new THREE.Group(); lap.position.set(-10.6, 0, -4.4); lap.rotation.y = .45; scene.add(lap);
		lap.add(box(5, .22, 3.4, M("#9aa1aa", { metalness:.5, roughness:.35 }), 0, 0, 0));
		const scr = new THREE.Group(); scr.position.set(0, .22, -1.7); scr.rotation.x = -.28; lap.add(scr);
		scr.add(mesh(new THREE.BoxGeometry(5, 3.3, .14), M("#2b2f36"), 0, 1.65, 0));
		scr.add(mesh(new THREE.PlaneGeometry(4.6, 2.9), new THREE.MeshBasicMaterial({ map:tex(460, 290, (x, w, h) => {
			x.fillStyle = "#f4f6f9"; x.fillRect(0, 0, w, h); x.fillStyle = "#1e305e"; x.fillRect(0, 0, w, 34); x.fillStyle = "#fff"; x.font = "800 17px Nunito, sans-serif"; x.fillText("ERP · Grand livre · 2026", 12, 23);
			x.font = "700 13px Nunito, sans-serif"; const rows = [["401000", "Fournisseurs", "12 480,00"], ["411000", "Clients", "18 930,50"], ["512000", "Banque", "6 214,37"], ["601000", "Achats matières", "3 150,00"], ["622600", "Honoraires", "2 950,00"], ["706000", "Ventes", "41 260,00"]];
			rows.forEach((r, i) => { const y = 62 + i*36; x.fillStyle = i % 2 ? "#ffffff" : "#e9eef5"; x.fillRect(8, y - 22, w - 16, 32); x.fillStyle = r[0] === "622600" ? "#b91c1c" : "#22262e"; x.fillText(r[0], 18, y); x.fillText(r[1], 100, y); x.textAlign = "right"; x.fillText(r[2] + " €", w - 18, y); x.textAlign = "left"; });
		}) }), 0, 1.65, .08));
		const mug = new THREE.Group(); mug.position.set(-11.6, 0, 5.4); scene.add(mug);
		mug.add(mesh(new THREE.CylinderGeometry(.62, .55, 1.4, 20), M("#1e305e"), 0, .7, 0), mesh(new THREE.CylinderGeometry(.55, .55, .05, 20), M("#4a2c1a"), 0, 1.3, 0));
		const hd = mesh(new THREE.TorusGeometry(.35, .08, 8, 16), M("#1e305e"), .7, .75, 0); mug.add(hd);
		const pens = new THREE.Group(); pens.position.set(11.9, 0, -1.4); scene.add(pens);
		pens.add(mesh(new THREE.CylinderGeometry(.55, .55, 1.5, 16, 1, true), M("#5f656d", { side:THREE.DoubleSide, metalness:.5 }), 0, .75, 0));
		[["#c4362f", .2], ["#2f6b45", -.2], ["#1e3f8a", .05], ["#d9a441", -.1]].forEach(([c, a], i) => { const p = mesh(new THREE.CylinderGeometry(.07, .07, 2.4, 6), M(c), Math.cos(i*1.6)*.2, 1.6, Math.sin(i*1.6)*.2); p.rotation.z = a; pens.add(p); });
	}

	/* --- étiquettes dessinées au canvas, plus grandes sur téléphone --- */
	let LS = 1;
	function drawLabel(sp, text, o){
		const c = sp.userData.c || (sp.userData.c = document.createElement("canvas")), x = c.getContext("2d");
		const f = `800 ${o.big ? 56 : 42}px Nunito, system-ui, sans-serif`; x.font = f;
		const w = Math.ceil(x.measureText(text).width) + 44, h = o.big ? 84 : 66;
		c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "#1e305e"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 12); x.fill();
		x.fillStyle = o.fg || "#ffffff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 3);
		if(sp.material.map) sp.material.map.dispose();
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sp.material.map = t; sp.material.needsUpdate = true;
		const s = (o.size || .55)*LS; sp.scale.set(s*w/h, s, 1); sp.userData.base = sp.scale.clone().divideScalar(LS);
	}
	function label(text, o = {}){ const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false, transparent:true })); sp.renderOrder = 10; drawLabel(sp, text, o); return sp; }

	/* --- petites animations --- */
	const anims = [];
	const anim = (dur, fn, done, delay = 0) => anims.push({ t0:performance.now() + delay, dur, fn, done });
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const popIn = (g, s = 1) => { g.visible = true; g.scale.setScalar(.001); anim(380, k => g.scale.setScalar(Math.max(.001, s*(1 + .2*Math.sin(k*Math.PI))*k))); };
	const popOut = (g, done) => { if(!g.visible){ done && done(); return; } const s = g.scale.x || 1; anim(260, k => g.scale.setScalar(Math.max(.001, s*(1 - k))), () => { g.visible = false; g.scale.setScalar(1); done && done(); }); };
	const wiggle = g => { const r0 = g.rotation.y; anim(480, k => g.rotation.y = r0 + Math.sin(k*Math.PI*6)*.08*(1 - k), () => g.rotation.y = r0); };
	function fly(g, to, o = {}){
		const from = g.position.clone(), d = from.distanceTo(to), h = o.h ?? Math.min(3, .6 + d*.15), dur = o.dur || (300 + d*28);
		const r0 = g.rotation.y, r1 = o.ry ?? r0, s0 = g.scale.x, s1 = o.s ?? s0;
		anim(dur, k => { const e = ease(k); g.position.lerpVectors(from, to, e); g.position.y += h*4*e*(1 - e); g.rotation.y = r0 + (r1 - r0)*e; g.scale.setScalar(s0 + (s1 - s0)*e); }, o.done);
	}
	// le tremblement de caméra, au coup de tampon
	let shakeT = 0, shakeA = 0;
	const shakeCam = (a = .22) => { shakeT = performance.now(); shakeA = a; };

	/* --- les documents : du papier, une face dessinée au canvas, qu'on peut redessiner (coches, tampons) --- */
	function wrap(x, s, px, py, maxW, lh){ const words = String(s).split(" "); let line = ""; for(const w of words){ const t = line ? line + " " + w : w; if(x.measureText(t).width > maxW && line){ x.fillText(line, px, py); py += lh; line = w; } else line = t; } if(line) x.fillText(line, px, py); return py; }
	function doc(w, h, draw, o = {}){
		const px = o.px || PX, g = new THREE.Group();
		const c = document.createElement("canvas"); c.width = Math.round(w*px); c.height = Math.round(h*px);
		const x = c.getContext("2d"), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
		const paper = mesh(new THREE.BoxGeometry(w, .05, h), M("#f1eee6"), 0, .025, 0); g.add(paper);
		const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:t, color:"#f4f4f4" })); face.rotation.x = -Math.PI/2; face.position.y = .056; g.add(face);
		const D = { g, c, x, t, w, h, px, hit:paper, state:{}, redraw(){ x.save(); draw(x, c.width, c.height, D); x.restore(); t.needsUpdate = true; } };
		paper.userData.doc = D; D.redraw();
		return D;
	}
	const T = (x, s, px, py, size, o = {}) => { x.font = `${o.w || 700} ${size}px ${o.f || "Nunito, system-ui, sans-serif"}`; x.fillStyle = o.c || "#22262e"; x.textAlign = o.a || "left"; x.fillText(s, px, py); };
	// le coup de tampon : un cadre et un mot, l'encre qui bave un peu, des manques, quelques éclaboussures
	function ink(D, text, color, lx, lz, rot){
		const x = D.x, s = D.px/PX, cx = (lx + D.w/2)*D.px, cy = (lz + D.h/2)*D.px;
		x.save(); x.translate(cx, cy); x.rotate(rot);
		const fs = 46*s; x.font = `900 ${fs}px Nunito, system-ui, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
		const bw = x.measureText(text).width + 44*s, bh = fs + 30*s;
		x.globalAlpha = .88; x.strokeStyle = x.fillStyle = color; x.lineWidth = 6*s;
		x.beginPath(); x.roundRect(-bw/2, -bh/2, bw, bh, 8*s); x.stroke(); x.fillText(text, 0, 3*s);
		// manques d'encre : des grains de papier qui ressortent
		x.globalAlpha = .5; x.fillStyle = "#fffdf8";
		for(let i = 0; i < 70; i++) x.fillRect((Math.random() - .5)*bw, (Math.random() - .5)*bh, (1 + Math.random()*2.5)*s, (1 + Math.random()*2.5)*s);
		// éclaboussures au bord du cadre
		x.globalAlpha = .55; x.fillStyle = color;
		for(let i = 0; i < 9; i++){ const a = Math.random()*Math.PI*2; x.beginPath(); x.arc(Math.cos(a)*(bw/2 + 6*s)*Math.random()*1.1, Math.sin(a)*(bh/2 + 6*s), (1 + Math.random()*2.6)*s, 0, 7); x.fill(); }
		x.restore(); D.t.needsUpdate = true;
		// puis l'encre bave dans le papier pendant une demi-seconde
		let n = 0;
		anim(520, k => {
			if(k*5 < n) return; n++;
			x.save(); x.translate(cx, cy); x.rotate(rot); x.globalAlpha = .07; x.strokeStyle = x.fillStyle = color; x.shadowColor = color; x.shadowBlur = (3 + n*2)*s;
			x.font = `900 ${fs}px Nunito, system-ui, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.lineWidth = (6 + n)*s;
			x.beginPath(); x.roundRect(-bw/2, -bh/2, bw, bh, 8*s); x.stroke(); x.fillText(text, 0, 3*s); x.restore(); D.t.needsUpdate = true;
		});
	}
	const dyn = new THREE.Group(); scene.add(dyn);        // les documents d'une étape, effacés à la suivante

	/* --- les trois bannettes (L1 · tri) --- */
	const trays = new THREE.Group(); scene.add(trays);
	const TRAY = {};
	[["charge", "📉 Charges", "#c4532f", -7], ["produit", "📈 Produits", "#3d7a55", 0], ["invest", "🏭 Immobilisations", "#2c5f9e", 7]].forEach(([k, name, col, x]) => {
		const g = new THREE.Group(); g.position.set(x, 0, -3.6); trays.add(g);
		const m = M(col, { roughness:.45 }).clone();
		g.add(box(5, .14, 5.8, m, 0, 0, 0), box(5, 1, .14, m, 0, 0, -2.9), box(.14, 1, 5.8, m, -2.5, 0, 0), box(.14, 1, 5.8, m, 2.5, 0, 0), box(5, .4, .14, m, 0, 0, 2.9));
		const l = label(name, { size:.62, bg:col }); l.position.set(0, 2.2, -1.6); g.add(l);
		TRAY[k] = { g, m, n:0, pos:() => new THREE.Vector3(x, 1, -3.6), hl:on => m.emissive.set(on ? col : "#000000").multiplyScalar(on ? .35 : 1) };
	});

	/* --- la calculatrice (L1 · TVA, L2 · écart) --- */
	const calc = new THREE.Group(); calc.position.set(8.4, 0, 2.8); scene.add(calc);
	calc.add(box(4.4, .5, 6.4, M("#2e333b", { roughness:.5 }), 0, 0, 0));
	let calcS = "", calcShow = "0", onCalc = null;
	const lcdC = document.createElement("canvas"); lcdC.width = 380; lcdC.height = 110;
	const lcdT = new THREE.CanvasTexture(lcdC); lcdT.colorSpace = THREE.SRGBColorSpace;
	const lcd = mesh(new THREE.PlaneGeometry(3.8, 1.1), new THREE.MeshBasicMaterial({ map:lcdT }), 0, .52, -2.4); lcd.rotation.x = -Math.PI/2; calc.add(lcd);
	function lcdDraw(){ const x = lcdC.getContext("2d"); x.fillStyle = "#b9c7a5"; x.fillRect(0, 0, 380, 110); x.fillStyle = "#1d2a1a"; x.textAlign = "right"; x.font = `700 ${calcShow.length > 11 ? 44 : 64}px "Courier New", monospace`; x.fillText(calcShow, 362, 80); lcdT.needsUpdate = true; }
	lcdDraw();
	const KEYS = [["C", "←", "÷", "×"], ["7", "8", "9", "−"], ["4", "5", "6", "+"], ["1", "2", "3", "="], ["0", "00", ",", "OK"]];
	const keyHits = [];
	KEYS.forEach((row, r) => row.forEach((k, c) => {
		const op = "÷×−+=←".includes(k), col = k === "OK" ? "#3d7a55" : k === "C" ? "#c4532f" : op ? "#5d6b7a" : "#e7e9ec";
		const key = new THREE.Group(); key.position.set(-1.5 + c*1, .5, -1.1 + r*.98); calc.add(key);
		key.add(mesh(new THREE.BoxGeometry(.8, .26, .78), M(col, { roughness:.5 }), 0, .13, 0));
		const face = new THREE.Mesh(new THREE.PlaneGeometry(.74, .72), new THREE.MeshBasicMaterial({ map:tex(64, 64, (x, w, h) => { x.fillStyle = col; x.fillRect(0, 0, w, h); x.fillStyle = col === "#e7e9ec" ? "#22262e" : "#fff"; x.font = `900 ${k.length > 1 ? 24 : 34}px Nunito, sans-serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(k, w/2, h/2 + 2); }) }));
		face.rotation.x = -Math.PI/2; face.position.y = .265; key.add(face);
		const hit = new THREE.Mesh(new THREE.BoxGeometry(.98, .6, .96), hidden); hit.position.y = .2; hit.userData.tap = "key:" + k; key.add(hit); keyHits.push(hit);
		key.userData.k = k; hit.userData.key = key;
	}));
	const pretty = s => s.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−").replace(/\./g, ",");
	function calcEval(s){ s = s.replace(/[+\-*/]+$/, ""); if(!/^[0-9.+\-*/]+$/.test(s)) return null; try { const v = Function('"use strict";return (' + s + ")")(); return isFinite(v) ? Math.round(v*100)/100 : null; } catch(e){ return null; } }
	function calcKey(k){
		const map = { "÷":"/", "×":"*", "−":"-", "+":"+" };
		if(k === "C"){ calcS = ""; calcShow = "0"; }
		else if(k === "←"){ calcS = calcS.slice(0, -1); calcShow = calcS ? pretty(calcS) : "0"; }
		else if(map[k]){ if(!calcS) calcS = "0"; calcS = calcS.replace(/[+\-*/]$/, "") + map[k]; calcShow = pretty(calcS); }
		else if(k === "=" || k === "OK"){
			const v = calcEval(calcS || "0");
			if(v === null){ calcS = ""; calcShow = "Erreur"; }
			else { calcS = String(v); calcShow = v.toLocaleString("fr-FR", { maximumFractionDigits:2 }); if(k === "OK" && onCalc) onCalc(v); }
		}
		else { const d = k === "," ? "." : k; if(d === "." && /\.[0-9]*$/.test(calcS)) return lcdDraw(); calcS += d; calcShow = pretty(calcS); }
		lcdDraw();
	}
	function calcReset(){ calcS = ""; calcShow = "0"; lcdDraw(); }

	/* --- le tableau de bord du trimestre (L2) : budget en filigrane, réel en plein --- */
	const chart = new THREE.Group(); chart.position.set(-3.2, 0, .4); scene.add(chart);
	const chartBars = [];
	function buildChart(rows){
		chart.clear(); chartBars.length = 0;
		const base = doc(18, 7.2, (x, w, h) => { x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h); T(x, "Tableau de bord · 3e trimestre · réel / budget (HT)", 24, 44, 30, { w:800, c:"#1e305e" }); x.fillStyle = "rgba(30,48,94,.18)"; x.fillRect(w - 330, h - 52, 26, 26); T(x, "budget (100 %)", w - 296, h - 31, 22, { c:"#1e305e", w:800 }); x.fillStyle = "#3d5a8f"; x.fillRect(w - 140, h - 52, 26, 26); T(x, "réel", w - 106, h - 31, 22, { c:"#1e305e", w:800 }); });
		base.g.position.set(0, 0, 0); chart.add(base.g);
		rows.forEach((r, i) => {
			const x = (i - 2)*3.4, pct = r[2]/r[1], hB = 2.4, hR = 2.4*Math.min(pct, 3.4);
			const g = new THREE.Group(); g.position.set(x, .06, -.2); chart.add(g);
			const ghost = mesh(new THREE.BoxGeometry(1.7, hB, 1.7), new THREE.MeshStandardMaterial({ color:"#1e305e", transparent:true, opacity:.18 }), 0, hB/2, 0); ghost.castShadow = false; g.add(ghost);
			const mat = new THREE.MeshStandardMaterial({ color:"#3d5a8f", roughness:.5 });
			const solid = mesh(new THREE.BoxGeometry(1.2, hR, 1.2), mat, 0, hR/2, 0); g.add(solid);
			const name = label(r[0], { size:.48, bg:"#fffdf6", fg:"#1e305e" }); name.position.set(0, .4, 1.9); g.add(name);
			const val = label(Math.round(pct*100) + " %", { size:.5, bg:"#1e305e" }); val.position.set(0, hR + .8, 0); g.add(val);
			const hit = new THREE.Mesh(new THREE.BoxGeometry(2.8, Math.max(hB, hR) + 1.6, 3.4), hidden); hit.position.set(0, (Math.max(hB, hR) + 1.6)/2 - .2, .6); hit.userData.tap = "bar:" + i; g.add(hit);
			chartBars.push({ g, hit, mat, solid, hR });
		});
	}
	function barMark(i, col){ const b = chartBars[i]; if(!b) return; b.mat.color.set(col); b.mat.emissive.set(col).multiplyScalar(.25); }

	/* --- le relevé et les factures (L1 · rapprochement) --- */
	const bank = new THREE.Group(); scene.add(bank);
	let bankState = null;
	function buildBank(lines, invoices){
		bank.clear();
		const st = bankState = { lines, invoices, done:new Set(), sel:null, sus:false, rows:[], invs:{} };
		const R = doc(7.8, 9.6, (x, w, h) => {
			x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
			x.fillStyle = "#16486b"; x.fillRect(0, 0, w, 84); T(x, "Banque des Flandres", 24, 52, 32, { w:900, c:"#fff" }); T(x, "(fictive)", w - 24, 52, 20, { a:"right", c:"#cfe0ee" });
			T(x, "Relevé de compte n° 9 · La Fabrique à Gaufres", 24, 128, 22, { w:800 }); T(x, "Période : du 1er juillet au 30 septembre", 24, 160, 19, { c:"#6a6f78" });
			T(x, "Libellé", 70, 214, 18, { w:800, c:"#6a6f78" }); T(x, "Montant", w - 24, 214, 18, { w:800, c:"#6a6f78", a:"right" });
			lines.forEach((l, i) => {
				const y = 240 + i*118, done = st.done.has(l.id), sus = st.sus && l.id === "x", sel = st.sel === l.id;
				x.fillStyle = sus ? "#fbdcd9" : done ? "#e3f2e7" : sel ? "#fff0bf" : i % 2 ? "#fffdf8" : "#f3f1ea"; x.fillRect(12, y, w - 24, 104);
				T(x, l.l, 70, y + 46, 22, { w:800 }); T(x, `${l.m > 0 ? "+" : "−"} ${euro(Math.abs(l.m))}`, w - 24, y + 84, 26, { w:900, a:"right", c:l.m > 0 ? "#2f6b45" : "#22262e" });
				if(done) T(x, "✓", 22, y + 64, 44, { w:900, c:"#2f6b45" });
				if(sus) T(x, "?", 26, y + 66, 48, { w:900, c:"#b91c1c" });
			});
		});
		R.g.position.set(-4.9, 0, .5); bank.add(R.g); st.R = R;
		lines.forEach((l, i) => {
			const z = -R.h/2 + (240 + i*118 + 52)/PX;
			const hit = new THREE.Mesh(new THREE.BoxGeometry(R.w, .5, 1.15), hidden); hit.position.set(0, .25, z); R.g.add(hit); hit.userData.row = l.id;
			st.rows.push({ id:l.id, hit, anchor:() => new THREE.Vector3(R.g.position.x + R.w/2 - .25, .12, R.g.position.z + z) });
		});
		const P = [[2.9, -2.4], [7.9, -2.4], [2.9, 3.4], [7.9, 3.4]];
		invoices.forEach((v, i) => {
			const D = doc(4.4, 5.2, (x, w, h) => {
				x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h); x.fillStyle = v.col; x.fillRect(0, 0, w, 16);
				T(x, v.sale ? "FACTURE DE VENTE" : "FACTURE", 20, 58, 20, { w:900, c:"#6a6f78" });
				x.font = "700 30px Fraunces, Georgia, serif"; x.fillStyle = "#1b2140"; wrap(x, v.l, 20, 104, w - 40, 34);
				T(x, "Total HT", 20, h - 140, 22, { c:"#6a6f78" }); T(x, euro(v.ht), w - 20, h - 140, 24, { a:"right", w:800 });
				T(x, "Total TTC", 20, h - 90, 24, { w:800 }); T(x, euro(v.ttc), w - 20, h - 90, 30, { a:"right", w:900 });
				if(st.done.has(v.id)){ x.globalAlpha = .9; T(x, "✓ pointé", w - 20, h - 26, 28, { a:"right", w:900, c:"#2f6b45" }); x.globalAlpha = 1; }
			});
			D.g.position.set(P[i][0], 0, P[i][1]); bank.add(D.g); st.invs[v.id] = D;
		});
		return st;
	}
	const bankRedraw = () => { if(!bankState) return; bankState.R.redraw(); for(const D of Object.values(bankState.invs)) D.redraw(); };

	/* --- les tampons de l'auditeur (L3) --- */
	const stamps = new THREE.Group(); scene.add(stamps);
	const STAMPS = {};
	{
		// le présentoir : quatre tampons en carré, et le tampon encreur
		stamps.add(box(7.4, .3, 7, "#7b5a3c", 3.9, 0, 1.3));
		stamps.add(box(2.6, .35, 1.8, "#22262e", 9.2, 0, 1.6), box(2.3, .06, 1.5, "#3a2a5a", 9.2, .35, 1.6));
		[["ok", "CONFORME", "#2f6b45", "CONFORME"], ["tva", "TVA ERRONÉE", "#b91c1c", "TVA FAUSSE"], ["just", "SANS JUSTIFICATIF", "#b91c1c", "SANS JUSTIF."], ["dbl", "DOUBLON", "#b91c1c", "DOUBLON"]].forEach(([k, t, col, short], i) => {
			const g = new THREE.Group(); const home = new THREE.Vector3(2.2 + (i % 2)*3.5, .3, -.5 + Math.floor(i/2)*3.8); g.position.copy(home); stamps.add(g);
			g.add(mesh(new THREE.BoxGeometry(1.7, .5, 1.1), M("#3b3f46"), 0, .25, 0), mesh(new THREE.BoxGeometry(1.6, .12, 1), M(col), 0, .06, 0));
			g.add(mesh(new THREE.CylinderGeometry(.2, .26, 1.5, 12), M("#a77c4f"), 0, 1.25, 0), mesh(new THREE.SphereGeometry(.55, 18, 14), M("#8a6440", { roughness:.5 }), 0, 2.2, 0));
			const l = label(short, { size:.4, bg:col }); l.position.set(0, 3.1, 0); g.add(l);
			const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 2.6), hidden); hit.position.y = 1.4; g.add(hit);
			STAMPS[k] = { id:k, g, home, hit, text:t, col };
		});
	}

	/* --- le tableau d'enquête (L3) : quatre pièces punaisées, et le Kbis bien lisible --- */
	const pins = new THREE.Group(); scene.add(pins);
	const BOARD = {};
	function pinDoc(id, w, h, cx, cy, draw, px){
		const D = doc(w, h, draw, { px });
		D.g.position.set(cx, cy, -10.1); D.g.rotation.x = Math.PI/2; D.g.rotation.y = (Math.random() - .5)*.04; pins.add(D.g);
		const pin = new THREE.Group(); pin.position.set(w/2 - .42, .3, -h/2 + .32); D.g.add(pin);           // dans le coin, sans cacher l'en-tête
		pin.add(mesh(new THREE.CylinderGeometry(.05, .05, .5, 6), M("#9aa1aa", { metalness:.7 }), 0, 0, 0), mesh(new THREE.SphereGeometry(.28, 14, 10), M("#c4362f", { roughness:.35 }), 0, .3, 0));
		D.pin = () => { const v = new THREE.Vector3(); pin.getWorldPosition(v); v.z += .35; return v; };
		D.center = () => new THREE.Vector3(cx, cy, -9.8);
		D.id = id; BOARD[id] = D; return D;
	}
	const head = (x, w, col, t) => { x.fillStyle = "#fffdf8"; x.fillRect(0, 0, x.canvas.width, x.canvas.height); x.fillStyle = col; x.fillRect(0, 0, w, 60); T(x, t, 22, 42, 23, { w:900, c:"#fff" }); };
	pinDoc("kbis", 6.4, 8.4, -5.4, 8.7, (x, w, h, D) => {
		const s = w/(6.4*PX);
		x.fillStyle = "#fffef9"; x.fillRect(0, 0, w, h);
		x.strokeStyle = "#1e305e"; x.lineWidth = 3*s; x.strokeRect(14*s, 14*s, w - 28*s, h - 28*s);
		T(x, "GREFFE DU TRIBUNAL DE COMMERCE DE LILLE MÉTROPOLE", w/2, 72*s, 17*s, { a:"center", w:800, c:"#1e305e" });
		T(x, "Extrait Kbis", w/2, 128*s, 46*s, { a:"center", w:700, f:"Fraunces, Georgia, serif", c:"#1b2140" });
		T(x, "Extrait d'immatriculation principale au registre", w/2, 160*s, 17*s, { a:"center", c:"#3e434c" });
		T(x, "du commerce et des sociétés · à jour au 2 octobre 2026", w/2, 182*s, 17*s, { a:"center", c:"#3e434c" });
		let y = 220*s;
		const sec = t => { x.fillStyle = "#e6e9f1"; x.fillRect(28*s, y - 22*s, w - 56*s, 30*s); T(x, t, 36*s, y, 15*s, { w:900, c:"#1e305e" }); y += 40*s; };
		const row = (k, v, hl) => {
			if(hl && D.state.hl){ x.fillStyle = "rgba(255,226,74,.7)"; x.fillRect(250*s, y - 21*s, w - 280*s, 29*s); }
			T(x, k, 36*s, y, 15*s, { c:"#6a6f78", w:700 }); x.font = `800 ${16*s}px Nunito, sans-serif`; x.fillStyle = "#1b2140"; y = wrap(x, v, 254*s, y, w - 290*s, 22*s) + 32*s;
		};
		sec("IDENTIFICATION DE LA PERSONNE MORALE");
		row("Immatriculation", "000 482 117 R.C.S. Lille Métropole");
		row("Date d'immatriculation", "04/08/2026");
		row("Dénomination", "DUPONT CONSEIL SERVICES");
		row("Forme juridique", "SARL à associé unique (EURL)");
		row("Capital social", "1 000,00 euros");
		row("Adresse du siège", "14 rue des Lilas, 59000 Lille", true);
		sec("GESTION, DIRECTION, ADMINISTRATION");
		row("Gérante", "DUPONT Sylvie");
		row("Domicile personnel", "14 rue des Lilas, 59000 Lille", true);
		sec("RENSEIGNEMENTS RELATIFS À L'ACTIVITÉ");
		row("Activité", "Conseil pour les affaires et autres conseils de gestion");
		row("Début d'activité", "04/08/2026");
		row("Salariés", "aucun");
		x.save(); x.translate(w/2, h*.6); x.rotate(-.5); x.globalAlpha = .07; T(x, "FICTIF", 0, 0, 150*s, { a:"center", w:900, c:"#1e305e" }); x.restore();
		T(x, "Document fictif créé pour un jeu pédagogique. Société et personnes imaginaires.", w/2, h - 30*s, 13*s, { a:"center", c:"#8a8f98" });
	}, 150);
	pinDoc("rib", 5, 3.2, 1.2, 11.4, (x, w, h) => {
		head(x, w, "#16486b", "RELEVÉ D'IDENTITÉ BANCAIRE");
		T(x, "Titulaire du compte", 22, 104, 18, { c:"#6a6f78" }); T(x, "DUPONT CONSEIL SERVICES", 22, 136, 26, { w:900 });
		T(x, "Banque des Flandres (fictive)", 22, 176, 18, { c:"#6a6f78" });
		T(x, "IBAN", 22, 226, 18, { c:"#6a6f78" }); T(x, "FR76 •••• •••• •••• •••• 4821", 22, 262, 23, { w:900, f:"'Courier New', monospace" });
	});
	pinDoc("morel", 5, 3.8, 6.6, 11, (x, w, h) => {
		head(x, w, "#5d6b7a", "FICHE SALARIÉ · confidentiel");
		T(x, "MOREL Julien", 22, 106, 30, { w:700, f:"Fraunces, Georgia, serif", c:"#1b2140" });
		T(x, "Comptable de l'entreprise, depuis 2019", 22, 144, 19, { c:"#3e434c" });
		T(x, "Adresse", 22, 192, 17, { c:"#6a6f78" }); T(x, "14 rue des Lilas, 59000 Lille", 22, 222, 22, { w:800 });
		T(x, "IBAN de paie", 22, 270, 17, { c:"#6a6f78" }); T(x, "FR76 •••• •••• •••• •••• 4821", 22, 304, 23, { w:900, f:"'Courier New', monospace" });
	});
	pinDoc("benali", 5, 3.8, 3.6, 5.6, (x, w, h) => {
		head(x, w, "#5d6b7a", "FICHE SALARIÉ · confidentiel");
		T(x, "BENALI Inès", 22, 106, 30, { w:700, f:"Fraunces, Georgia, serif", c:"#1b2140" });
		T(x, "Commerciale, depuis 2022", 22, 144, 19, { c:"#3e434c" });
		T(x, "Adresse", 22, 192, 17, { c:"#6a6f78" }); T(x, "3 place du Concert, 59800 Lille", 22, 222, 22, { w:800 });
		T(x, "IBAN de paie", 22, 270, 17, { c:"#6a6f78" }); T(x, "FR76 •••• •••• •••• •••• 0937", 22, 304, 23, { w:900, f:"'Courier New', monospace" });
	});

	/* --- fils et traits de crayon --- */
	const links = new THREE.Group(); scene.add(links);
	function stick(m, a, b){ const d = new THREE.Vector3().subVectors(b, a), L = Math.max(.001, d.length()); m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
	function link(a, b, col, r = .06){ const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), M(col, { roughness:.6 })); m.castShadow = true; stick(m, a, b); links.add(m); return m; }
	const live = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 8), M("#4a4a52")); live.visible = false; scene.add(live);

	/* ================= la main : saisir, glisser, déposer — ou toucher ================= */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), tmp = new THREE.Vector3();
	let drags = [], zones = [], onDrop = null, onTap = null, onPick = null, enabled = true, grab = null, tapHit = null, selected = null, hover = null;
	const ring = mesh(new THREE.TorusGeometry(1.6, .08, 8, 40), new THREE.MeshBasicMaterial({ color:"#d9a441" })); ring.rotation.x = Math.PI/2; ring.visible = false; ring.castShadow = false; scene.add(ring);
	function setRay(e){ const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); }
	function planePoint(e, d){
		setRay(e);
		if(d.wall){ plane.set(new THREE.Vector3(0, 0, 1), 9.6); } else plane.set(new THREE.Vector3(0, 1, 0), -(d.lift ?? .12));
		return ray.ray.intersectPlane(plane, new THREE.Vector3());
	}
	const scr = v => { const r = canvas.getBoundingClientRect(), p = v.clone().project(camera); return [(p.x + 1)/2*r.width + r.left, (1 - p.y)/2*r.height + r.top]; };
	// zones de dépôt très larges : lâché tout près d'une zone, c'est elle ; sinon, celle que vise le geste
	// (dans un cône d'environ 35°, même lâché à mi-chemin) ; sinon la plus proche dans un grand rayon
	function pickZone(d, x0, y0, x1, y1){
		const r = canvas.getBoundingClientRect(), m = Math.min(r.width, r.height), Rc = m*.05 + 20, R = m*.3 + 40;
		const zs = zones.filter(z => z.id !== d?.self).map(z => { const [zx, zy] = scr(z.pos()); return { z, zx, zy, dd:Math.hypot(x1 - zx, y1 - zy) }; }).sort((a, b) => a.dd - b.dd);
		if(!zs.length) return null;
		if(zs[0].dd < Rc) return zs[0].z;
		const gx = x1 - x0, gy = y1 - y0, gl = Math.hypot(gx, gy);
		if(gl >= 36){
			let best = null, ba = .62;
			for(const o of zs){ const vx = o.zx - x0, vy = o.zy - y0, vl = Math.hypot(vx, vy); if(vl < 1) continue;
				const a = Math.acos(Math.max(-1, Math.min(1, (vx*gx + vy*gy)/(vl*gl)))); if(a < ba){ ba = a; best = o.z; } }
			if(best) return best;
		}
		return zs[0].dd < R ? zs[0].z : null;
	}
	function setHover(z){ if(hover === z) return; if(hover){ hover.hl ? hover.hl(false) : hover.obj && hover.obj.scale.setScalar(1); } hover = z; if(z){ z.hl ? z.hl(true) : z.obj && z.obj.scale.setScalar(1.05); } }
	function select(d){ selected = d; ring.visible = !!(d && d.g && !d.wall); if(onPick) onPick(d ? d.id : null); }
	canvas.addEventListener("pointerdown", e => {
		if(!enabled) return;
		setRay(e);
		const dh = ray.intersectObjects(drags.map(d => d.hit), false)[0];
		if(dh){ const d = drags.find(x => x.hit === dh.object); grab = { d, x0:e.clientX, y0:e.clientY, moved:false }; controls.enabled = false; canvas.setPointerCapture(e.pointerId); return; }
		const th = ray.intersectObjects(keyHits.filter(h => calc.visible).concat(chartBars.filter(() => chart.visible).map(b => b.hit), extraTaps), false)[0];
		tapHit = { id:th ? th.object.userData.tap : null, x0:e.clientX, y0:e.clientY, obj:th && th.object };
	});
	canvas.addEventListener("pointermove", e => {
		if(!grab) return;
		const d = grab.d;
		if(!grab.moved && Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) < 9) return;
		if(!grab.moved){ grab.moved = true; select(null); if(d.line){ live.material = M(d.line.col || "#4a4a52"); live.visible = true; } else if(d.g) anim(120, k => d.g.position.y = d.home.y + (d.lift - d.home.y)*k); }
		const p = planePoint(e, d); if(!p) return;
		if(d.line) stick(live, d.line.from(), p);
		else if(d.g){ d.g.position.set(p.x, d.lift, p.z); }
		setHover(pickZone(d, grab.x0, grab.y0, e.clientX, e.clientY));
	});
	function release(e){
		if(grab){
			const { d, moved, x0, y0 } = grab; grab = null; controls.enabled = true; live.visible = false; setHover(null);
			if(!moved){ if(d.tap && onTap) return onTap(d.id); select(selected === d ? null : d); return; }
			const z = pickZone(d, x0, y0, e.clientX, e.clientY);
			if(z && onDrop) return onDrop(d, z.id);
			goHome(d); return;
		}
		if(!tapHit) return;
		const t = tapHit; tapHit = null;
		if(Math.hypot(e.clientX - t.x0, e.clientY - t.y0) > 10) return;
		if(t.id){
			if(t.id.startsWith("key:")){ const key = t.obj.userData.key; anim(140, k => key.position.y = .5 - Math.sin(k*Math.PI)*.12); calcKey(t.id.slice(4)); }
			if(onTap) onTap(t.id); return;
		}
		// toucher la cible après avoir choisi un objet
		if(selected){ const z = pickZone(selected, e.clientX, e.clientY, e.clientX, e.clientY); const d = selected; select(null); if(z && onDrop) return onDrop(d, z.id); }
		if(onTap) onTap(null);
	}
	canvas.addEventListener("pointerup", release);
	canvas.addEventListener("pointercancel", release);
	function goHome(d){ if(d.g) fly(d.g, d.home, { h:.6, dur:320 }); }
	const extraTaps = [];

	/* --- caméra : une vue posée par étape, recadrée quand on zoome sur une pièce du tableau --- */
	const VIEWS = {
		intro:[0, 15, 19, 0, 2.6, -3], tri:[0, 16.5, 13.5, 0, 0, -.6], tva:[5.2, 12.5, 12.5, 5.2, 0, 2.2], bank:[.4, 24, 10.5, .4, 0, .4],
		budget:[-1.5, 12, 17, -1.5, 2.6, -.2], budget2:[2.8, 13, 15, 2.8, 1, .6], stamp:[.6, 14, 12.5, .6, 0, 1.2], board:[0, 9.2, 9, 0, 8.6, -10], end:[0, 12, 15, 0, 6.6, -8]
	};
	let cam = null;
	function look(k, v = VIEWS[k]){
		const p1 = new THREE.Vector3(v[0], v[1], v[2]), t1 = new THREE.Vector3(v[3], v[4], v[5]);
		// écran étroit (téléphone en hauteur) : on recule un peu, pour garder tout le bureau dans le cadre
		if(k && camera.aspect < 1) p1.sub(t1).multiplyScalar(1 + (1 - camera.aspect)*.55).add(t1);
		cam = { k:0, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	function zoomDoc(D){
		const c = D.center(), half = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
		const dist = Math.max(D.h/2*1.12/half, D.w/2*1.12/(half*camera.aspect)) + .3;
		look(null, [c.x, c.y, c.z + dist, c.x, c.y, c.z]);
	}

	/* --- boucle --- */
	let raf = 0, last = performance.now();
	const off = new THREE.Vector3();
	function loop(now){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(let i = anims.length - 1; i >= 0; i--){
			const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); if(k < 0) continue;
			a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); }
		}
		if(selected && selected.g){ ring.position.set(selected.g.position.x, .1, selected.g.position.z); ring.scale.setScalar(1 + .08*Math.sin(now/170)); }
		if(cam){ cam.k = Math.min(1, cam.k + dt/1.1); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.update();
		const sk = (now - shakeT)/280;
		if(sk < 1){ const a = shakeA*(1 - sk); off.set((Math.random() - .5)*a, (Math.random() - .5)*a*.6, (Math.random() - .5)*a); camera.position.add(off); }
		renderer.render(scene, camera);
		if(sk < 1) camera.position.sub(off);
	}
	let VD = 0, VW = 1, VH = 1;
	function reserve(px){
		VD = px;
		// champ horizontal à peu près constant (environ 56°), calculé sur le cadre complet : la scène ne se rétrécit ni sur téléphone, ni sous les compteurs
		const a = VW/(VH + VD);
		camera.fov = Math.max(34, Math.min(66, THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(28))/a))));
		camera.setViewOffset(VW, VH + VD, 0, VD, VW, VH); camera.updateProjectionMatrix();
	}
	function resize(w, h){
		VW = w; VH = h;
		const ls = w < 600 ? 1.3 : 1;
		if(ls !== LS){ LS = ls; scene.traverse(o => { if(o.isSprite && o.userData.base) o.scale.copy(o.userData.base).multiplyScalar(LS); }); }
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px"; camera.aspect = w/h;
		reserve(VD);
	}
	camera.position.set(0, 18, 22); controls.target.set(0, 2, -3);
	const GROUPS = { trays, calc, chart, bank, stamps, pins };
	for(const g of Object.values(GROUPS)) g.visible = false;
	function only(list){ for(const [k, g] of Object.entries(GROUPS)){ if(list.includes(k)){ if(!g.visible) popIn(g); } else if(g.visible) popOut(g); } }
	function reset(){
		drags = []; zones = []; onDrop = onTap = onPick = null; select(null); setHover(null); grab = null; live.visible = false; extraTaps.length = 0;
		for(const o of [...dyn.children]) dyn.remove(o);
		links.clear(); onCalc = null; calcReset();
		for(const k in TRAY) TRAY[k].n = 0;
		for(const s of Object.values(STAMPS)){ s.g.position.copy(s.home); s.g.rotation.set(0, 0, 0); }
		for(const D of Object.values(BOARD)){ D.g.scale.setScalar(1); D.state.hl = false; D.redraw(); }
	}
	raf = requestAnimationFrame(loop);
	return {
		camera, scene, ray, resize, reserve, look, zoomDoc, anim, fly, popIn, popOut, wiggle, shakeCam, only, reset,
		doc, ink, T, wrap, dyn, TRAY, calcReset, buildChart, barMark, buildBank, bankRedraw, STAMPS, BOARD, link, stick, links,
		get bankState(){ return bankState; },
		setDrags(l){ drags = l; }, setZones(l){ zones = l; },
		set onDrop(f){ onDrop = f; }, set onTap(f){ onTap = f; }, set onPick(f){ onPick = f; }, set onCalc(f){ onCalc = f; },
		set enabled(v){ enabled = v; if(!v){ grab = null; select(null); controls.enabled = true; } },
		goHome, select,
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); renderer.forceContextLoss(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material && o.material.map) o.material.map.dispose(); }); }
	};
}

/* ================= le contenu ================= */
const PIECES = [
	{ t:"Moulins du Nord", d:"600 kg de farine T45", m:820, k:"charge", col:"#9c6d3e", no:"2026-77", why:"La farine est consommée pour produire : c'est une charge." },
	{ t:"Hôtel Bellevue", d:"48 coffrets de gaufres pour les chambres", m:1150, k:"produit", col:"#3d7a55", no:"V-0412", client:"Hôtel Bellevue", why:"Une vente à un client : c'est un produit." },
	{ t:"Fours Pro Équipement", d:"Four à gaufres professionnel double plaque", m:6400, k:"invest", col:"#5d6b7a", no:"FP-1180", why:"Le four servira des années : c'est une immobilisation, amortie sur sa durée d'utilisation, pas une charge d'un coup." },
	{ t:"Énergie Hauts-de-France", d:"Électricité du trimestre, boutique et atelier", m:1260, k:"charge", col:"#d9a441", no:"EHF-88231", why:"L'électricité est consommée : c'est une charge." },
	{ t:"Caisse de la boutique", d:"Ticket Z · ventes du samedi", m:2380, k:"produit", col:"#3d7a55", no:"Z-0931", client:"Clients au comptoir", why:"Les ventes en boutique sont des produits." },
	{ t:"Garage du Port", d:"Camionnette de livraison d'occasion", m:18000, k:"invest", col:"#2c5f9e", no:"GP-2207", why:"Un véhicule utilisé plusieurs années : c'est une immobilisation." }
];
const KIND = { charge:"📉 Charge", produit:"📈 Produit", invest:"🏭 Immobilisation" };
const AUDIT_DOCS = [
	{ id:"dupont", hd:"Facture n° 118", t:"Dupont Conseil Services", d:"« Mission de conseil » · aucun détail, aucun bon de commande signé", lines:[["Total HT", "2 450,00 €"], ["TVA 20 %", "490,00 €"], ["Total TTC", "2 940,00 €"]], ok:false, r:"just" },
	{ id:"impr", hd:"Facture n° 5531", t:"Imprimerie Lilloise", d:"500 flyers pour le salon · bon de commande n° 44", lines:[["Total HT", "300,00 €"], ["TVA 20 %", "66,00 €"], ["Total TTC", "366,00 €"]], ok:false, r:"tva" },
	{ id:"moulins", hd:"Facture n° 2026-77", t:"Moulins du Nord", d:"600 kg de farine · bon de commande n° 41 signé", lines:[["Total HT", "820,00 €"], ["TVA 5,5 %", "45,10 €"], ["Total TTC", "865,10 €"]], ok:true },
	{ id:"frais", hd:"Note de frais", t:"Inès Benali, commerciale", d:"Déjeuner avec l'acheteur de l'Hôtel Bellevue · mardi 12 mars · ticket joint", lines:[["Montant TTC", "64,00 €"]], ok:true }
];
const REASON = { ok:"Conforme", tva:"TVA erronée", just:"Sans justificatif", dbl:"Doublon" };

/* ================= le jeu ================= */
export function openAudit({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	if(!document.getElementById("aw-font")){ const l = document.createElement("link"); l.id = "aw-font"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap"; document.head.appendChild(l); }
	const T = mountTable({
		id:"aw", label:"Enquête", hint:"",
		theme:{ bg:"#dfe3e6", paper:"#fbfaf3", paper2:"#eef3ea", ink:"#22262e", dark:"#1e305e", accent:"#1e305e", accentInk:"#8a2b4e", gold:"#d9a441", line:"#d6d0c0" },
		mentor:{ name:"", svg:"" }, timeline:TIMELINE, extraCSS:EXTRA_CSS, noTimeline:true,
		meters:[
			{ k:"err", label:"Erreurs", icon:"🔎", cls:"err", fmt:v => Math.round(v) },
			{ k:"prv", label:"Preuves", icon:"📎", cls:"prv", fmt:v => Math.round(v) + " / 5" }
		]
	});
	T.onClose(() => onClose && onClose());
	const W = world(T.canvas); T.bind(W);
	const { later, meter, card } = T;
	const S = { errors:0, learned:new Set(), found:0, proofs:0 };
	meter("err", 0); meter("prv", 0);
	let tab = "intro";

	/* --- la feuille de travail --- */
	function sheet(step, ref, title, body){
		tab = step;
		const n = TABS.findIndex(t => t[2] === step);
		T.show(`<i class="aw-clip"></i>
			<header class="aw-hd"><div><b>La Fabrique à Gaufres</b><small>Audit des comptes · 3e trimestre 2026</small></div><div class="aw-ref">RÉF.<b>${ref}</b></div></header>
			<div class="aw-meta"><span>Préparé par : <i>toi, en alternance</i></span><span>Revu par : <i>C. Roussel</i></span></div>
			<nav class="aw-tabs">${TABS.map(([l, , k], i) => `<span class="${i < n || (n < 0 && step === "end") ? "past" : i === n ? "now" : ""}" title="${TABS[i][1]}">${l}</span>`).join("")}</nav>
			${title}${body}<div class="aw-notes" data-notes></div><div data-live></div>`);
	}
	const live = html => { const el = card.querySelector("[data-live]"); if(el) el.innerHTML = html; };
	const append = html => { const el = card.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); T.scrollEnd(); } };
	// les notes de revue de la responsable, à l'encre rouge
	function note(text){ const el = card.querySelector("[data-notes]"); if(!el) return; el.innerHTML = `<div class="aw-note"><small>Note de revue · C. Roussel</small>${text}</div>`; }
	const clearNote = () => { const el = card.querySelector("[data-notes]"); if(el) el.innerHTML = ""; };
	const h2 = (k, t) => `<div class="aw-k">${k}</div><h2 class="aw-h">${t}</h2>`;
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="aw-course"><span class="tag">📚 En Licence Comptabilité-Finance-Audit · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	function stage(t, step){ T.stage(t, step); W.look(step); onEvent && onEvent("stage", t); T.showHint(""); }
	function err(){ S.errors++; meter("err", S.errors); play("bad"); onEvent && onEvent("err"); }
	function proof(){ S.proofs++; meter("prv", S.proofs); }
	function qcm(el, opts, good, onOk){
		el.innerHTML = `<div class="aw-opts">${opts.map(([v, t]) => `<button class="aw-opt" data-q="${v}">${t}</button>`).join("")}</div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".aw-opt.ok")) return;
			if(b.dataset.q !== String(good)){ err(); b.classList.add("ko"); return; }
			b.classList.add("ok"); play("good"); onOk(el.querySelector("[data-after]")); T.scrollEnd();
		}));
	}
	const go = (a, t) => `<button class="tb-go" data-a="${a}">${t}</button>`;
	const pcHTML = (hd, tt, d, lines) => `<div class="aw-pc"><div class="hd"><span>${hd}</span></div><div class="tt">${esc(tt)}</div><small>${esc(d)}</small>${lines.map(([a, b]) => `<div class="ln"><span>${a}</span><b>${b}</b></div>`).join("")}</div>`;
	function enter(){ W.reset(); clearNote(); }

	// une facture posée sur le bureau, dessinée comme une vraie
	function invoiceDoc(p, w = 5.2, h = 6.6){
		return W.doc(w, h, (x, cw, ch) => {
			x.fillStyle = "#fffdf8"; x.fillRect(0, 0, cw, ch); x.fillStyle = p.col || "#5d6b7a"; x.fillRect(0, 0, cw, 74);
			W.T(x, p.t, 22, 48, 28, { w:900, c:"#fff" });
			W.T(x, p.k === "produit" ? "FACTURE DE VENTE" : p.hd ? p.hd.toUpperCase() : "FACTURE", 22, 118, 22, { w:900, c:"#1b2140" });
			if(p.no) W.T(x, "n° " + p.no, cw - 22, 118, 19, { a:"right", c:"#6a6f78" });
			W.T(x, p.k === "produit" ? "Client : " + p.client : "Client : La Fabrique à Gaufres", 22, 154, 19, { c:"#3e434c" });
			x.fillStyle = "#e3dccd"; x.fillRect(22, 176, cw - 44, 2);
			x.font = "700 23px Nunito, sans-serif"; x.fillStyle = "#22262e"; W.wrap(x, p.d, 22, 216, cw - 44, 30);
			const L = p.lines || [["Total HT", euro(p.m)]];
			L.forEach(([a, b], i) => { const y = ch - 40 - (L.length - 1 - i)*46; W.T(x, a, 22, y, 22, { w:i === L.length - 1 ? 900 : 700, c:i === L.length - 1 ? "#1b2140" : "#3e434c" }); W.T(x, b, cw - 22, y, i === L.length - 1 ? 28 : 23, { a:"right", w:900 }); });
		});
	}

	/* ---------- intro ---------- */
	function intro(){
		enter(); W.only([]); stage("Enquête", "intro");
		// le dossier fermé, posé au milieu du bureau
		const folder = W.doc(6.4, 8.2, (x, w, h) => { x.fillStyle = "#d9b98a"; x.fillRect(0, 0, w, h); x.fillStyle = "#c9a874"; x.fillRect(0, 0, w, 40); x.fillStyle = "#fffdf6"; x.fillRect(90, 230, w - 180, 250); x.strokeStyle = "#1e305e"; x.lineWidth = 3; x.strokeRect(90, 230, w - 180, 250);
			W.T(x, "DOSSIER D'AUDIT", w/2, 290, 30, { a:"center", w:900, c:"#1e305e" }); W.T(x, "La Fabrique à Gaufres", w/2, 350, 30, { a:"center", w:700, f:"Fraunces, Georgia, serif", c:"#1b2140" }); W.T(x, "3e trimestre 2026", w/2, 400, 24, { a:"center", c:"#3e434c" });
			W.T(x, "CONFIDENTIEL", w/2, 560, 34, { a:"center", w:900, c:"#b91c1c" }); });
		folder.g.position.set(0, 0, 1.2); folder.g.rotation.y = -.08; W.dyn.add(folder.g);
		sheet("intro", "000", h2(`Mini-jeu · ${esc(formation.name)}`, "L'Enquête de l'auditeur"), `
			<p class="aw-p"><b>La Fabrique à Gaufres</b> (entreprise fictive), 12 salariés à Lille. Sa gérante, Mme Garnier, ne comprend pas : les ventes sont bonnes, mais la trésorerie fond. Elle a fait appel à ton cabinet.</p>
			<p class="aw-p">Tu es <b>auditeur en alternance</b>, à ton bureau du bâtiment Michel Falise. Le dossier est sur la table : à toi de trouver où part l'argent, <b>avec tes mains</b>. Glisse les pièces, tape sur la calculatrice, tends les fils, frappe les tampons.</p>
			<ul class="aw-list"><li><span>L1</span>Trier les pièces, calculer la TVA, rapprocher la banque</li><li><span>L2</span>Analyser les écarts du budget</li><li><span>L3</span>Contrôler les pièces, lire le Kbis, confondre le coupable</li></ul>
			<div class="aw-tm"><span><b>✓</b> pointé</span><span><b class="r">?</b> à justifier</span><span><b>Σ</b> recalculé</span></div>`);
		live(go("tri", "Ouvrir le dossier"));
	}

	/* ---------- A · L1 · trier les pièces dans les bannettes ---------- */
	function tri(){
		enter(); W.only(["trays"]); stage("L1 · Comptabilité", "tri"); T.showHint("✋ Glisse chaque pièce dans sa bannette");
		const docs = shuffle(PIECES.map(p => ({ ...p })));
		let i = 0, cur = null;
		sheet("tri", "A-1", h2("L1 · comptabilité financière", "Trier les pièces"), `<p class="aw-p">Avant d'enquêter, il faut des comptes propres. Prends chaque pièce posée devant toi et <b>glisse-la dans sa bannette</b> : charge, produit ou immobilisation.</p>`);
		function render(){ const p = docs[i]; live(`<div class="aw-k" style="margin-top:4px">Pièce ${Math.min(i + 1, docs.length)} / ${docs.length}</div>${p ? pcHTML(p.k === "produit" ? "Pièce de vente" : "Pièce d'achat", p.t, p.d, [["Montant HT", euro(p.m)]]) : ""}`); }
		function next(){
			if(i >= docs.length) return done();
			const p = docs[i]; cur = invoiceDoc(p);
			const home = new THREE.Vector3(0, 0, 3.4);
			cur.g.position.set(16, 0, 3.4); cur.g.rotation.y = (Math.random() - .5)*.12; W.dyn.add(cur.g); W.fly(cur.g, home, { h:.4, dur:500 });
			W.setDrags([{ id:"piece", g:cur.g, hit:cur.hit, home, lift:1.3 }]);
			play("pop"); render();
		}
		W.setZones(Object.entries(W.TRAY).map(([k, t]) => ({ id:k, pos:t.pos, hl:t.hl })));
		W.onDrop = (d, z) => {
			const p = docs[i];
			if(z !== p.k){
				err(); W.goHome(d); later(330, () => W.wiggle(cur.g));
				note(p.k === "invest" ? "Ce bien va servir plusieurs années… est-ce vraiment une dépense du trimestre ?" : `Pas « ${KIND[z].slice(3)} » : regarde ce que représente cette pièce.`);
				return;
			}
			const t = W.TRAY[z], g = cur.g; W.setDrags([]);
			W.fly(g, new THREE.Vector3(t.g.position.x, .2 + t.n*.07, t.g.position.z), { s:.82, ry:(Math.random() - .5)*.3, dur:380 }); t.n++;
			play("good"); note(`✓ ${p.why}`);
			i++; later(520, next);
		};
		later(400, next);
		function done(){
			W.setDrags([]); T.showHint(""); play("chime");
			live(`<p class="aw-ok">✓ Six pièces classées : 2 charges, 2 produits, 2 immobilisations.</p>${go("tva", "Calculer la TVA →")}`); T.scrollEnd();
		}
	}

	/* ---------- B · L1 · la TVA, sur la calculatrice ---------- */
	function tva(){
		enter(); W.only(["calc"]); stage("L1 · Fiscalité", "tva"); T.showHint("👆 Calcule le TTC, puis appuie sur OK");
		const p = { t:"Cartonnages de Flandre", hd:"Facture n° E-2207", col:"#8a6440", d:"1 000 boîtes à gaufres en carton", lines:[["Total HT", "400,00 €"], ["TVA 20 %", "?"], ["Total TTC", "?"]] };
		const D = invoiceDoc(p); D.g.position.set(2.2, 0, 2.4); D.g.rotation.y = .05; W.dyn.add(D.g); W.popIn(D.g);
		sheet("tva", "B-1", h2("L1 · fiscalité", "Et la TVA ?"), `<p class="aw-p">La facture d'emballages fait <b>400 € hors taxe</b>, avec une TVA à <b>20 %</b>. Combien l'entreprise paie-t-elle au total, toutes taxes comprises ? <b>Calcule-le sur la calculatrice</b>, puis appuie sur <b>OK</b>.</p>
			${pcHTML("Pièce d'achat · n° E-2207", p.t, p.d, p.lines)}`);
		let solved = false;
		W.onCalc = v => {
			if(solved) return;
			if(Math.abs(v - 480) < .01){
				solved = true; play("good"); T.showHint(""); W.onCalc = null;
				p.lines = [["Total HT", "400,00 €"], ["TVA 20 %", "80,00 €"], ["Total TTC", "Σ 480,00 €"]]; D.redraw();
				clearNote();
				live(`<p class="aw-ok">Σ 400 × 20 % = 80 € de TVA, soit 480 € TTC.</p><p class="aw-p">Ces 80 € ne sont pas une charge : l'entreprise les récupère auprès de l'État (TVA déductible). Attention, le taux dépend du produit : la farine et les gaufres, produits alimentaires, sont au taux réduit de <b>5,5 %</b>.</p>${course("compta")}${course("fisca")}${go("bank", "Passer au relevé bancaire →")}`); T.scrollEnd();
				return;
			}
			err();
			note(Math.abs(v - 80) < .01 ? "80 €, c'est la TVA seule. Le TTC, c'est le hors taxe plus la TVA." : Math.abs(v - 420) < .01 ? "Tu as ajouté 20 €, pas 20 %. 20 % de 400, c'est 400 × 0,2." : Math.abs(v - 320) < .01 ? "La TVA s'ajoute au hors taxe, elle ne se retranche pas." : "Pas tout à fait. Indice : 400 + 400 × 20 %.");
		};
	}

	/* ---------- C · L1 · rapprochement bancaire, au crayon ---------- */
	function bank(){
		enter(); W.only(["bank"]); stage("L1 · Banque", "bank"); T.showHint("✏️ Tire un trait d'une ligne du relevé vers sa facture");
		const lines = shuffle([
			{ id:"a", l:"PRLV MOULINS DU NORD", m:-865.1 }, { id:"b", l:"VIR HOTEL BELLEVUE", m:1213.25 }, { id:"c", l:"PRLV CARTONNAGES FLANDRE", m:-480 },
			{ id:"d", l:"VIR FOURS PRO EQUIPEMENT", m:-7680 }, { id:"x", l:"VIR DUPONT CONSEIL SERVICES", m:-2940 }
		]);
		const invoices = shuffle([
			{ id:"a", l:"Moulins du Nord", ht:820, ttc:865.1, col:"#9c6d3e" }, { id:"b", l:"Hôtel Bellevue", ht:1150, ttc:1213.25, col:"#3d7a55", sale:true },
			{ id:"c", l:"Cartonnages de Flandre", ht:400, ttc:480, col:"#8a6440" }, { id:"d", l:"Fours Pro Équipement", ht:6400, ttc:7680, col:"#5d6b7a" }
		]);
		const st = W.buildBank(lines, invoices);
		sheet("bank", "C-1", h2("L1 · rapprochement bancaire", "Le relevé ne ment pas"), `<p class="aw-p">Chaque mouvement du compte doit avoir sa pièce justificative. <b>Tire un trait de crayon</b> depuis une ligne du relevé jusqu'à la facture qui lui correspond (ou touche la ligne, puis la facture). Attention : la banque voit les montants <b>TTC</b>.</p>`);
		const render = () => live(`<div class="aw-k" style="margin-top:4px">${st.done.size} / 4 lignes pointées</div>`);
		render();
		W.setDrags(st.rows.filter(r => !st.done.has(r.id)).map(r => ({ id:r.id, hit:r.hit, line:{ from:r.anchor, col:"#4a4a52" }, lift:.12 })));
		W.setZones(invoices.map(v => ({ id:v.id, pos:() => st.invs[v.id].g.position.clone().setY(.1), obj:st.invs[v.id].g })));
		W.onPick = id => { st.sel = id; st.R.redraw(); };
		W.onDrop = (d, z) => {
			st.sel = null;
			if(d.id === "x"){ note("Aucune facture ne correspond à cette ligne… garde-la pour la fin."); W.bankRedraw(); return; }
			if(d.id !== z){ err(); note("Les montants ne correspondent pas : compare avec le TTC de la facture."); W.bankRedraw(); return; }
			const row = st.rows.find(r => r.id === d.id), inv = st.invs[z];
			W.link(row.anchor(), inv.g.position.clone().setX(inv.g.position.x - inv.w/2 + .2).setY(.12), "#2f6b45", .05);
			st.done.add(z); W.bankRedraw(); play("pop"); clearNote(); render();
			W.setDrags(st.rows.filter(r => !st.done.has(r.id)).map(r => ({ id:r.id, hit:r.hit, line:{ from:r.anchor, col:"#4a4a52" }, lift:.12 })));
			if(st.done.size === 4){
				W.setDrags([]); st.sus = true; W.bankRedraw(); play("chime"); T.showHint(""); proof();
				append(`<p class="aw-p" style="margin-top:6px"><b>Il reste une ligne : − 2 940,00 € vers « Dupont Conseil Services ».</b> Aucune facture dans le dossier. Que conclus-tu ?</p><div data-q></div>`);
				qcm(card.querySelector("[data-live] [data-q]"), shuffle([["sus", "Mouvement sans justificatif : à creuser"], ["ok", "C'est normal, les petites dépenses n'ont pas besoin de pièce"], ["err", "C'est sûrement une erreur de la banque"]]), "sus", a => {
					a.innerHTML = `<p class="aw-p" style="margin-top:8px">Bon réflexe : un paiement sans pièce justificative est un signal d'alerte. Gardons-le en tête…</p>${course("banque")}${go("budget", "Passer en L2 : le budget →")}`;
				});
			}
		};
	}

	/* ---------- D · L2 · contrôle de gestion : la barre qui dérape, puis l'écart ---------- */
	function budget(){
		enter(); W.only(["chart"]); stage("L2 · Contrôle de gestion", "budget"); T.showHint("👆 Touche la barre dont l'écart est anormal");
		const rows = [["Farine et matières", 3000, 3150], ["Électricité", 1200, 1260], ["Emballages", 900, 880], ["Prestations de services", 500, 2950], ["Salaires", 21000, 21000]];
		W.buildChart(rows);
		sheet("budget", "D-1", h2("L2 · contrôle de gestion", "Le budget dérape"), `<p class="aw-p">Sur le bureau, le tableau de bord du trimestre : en filigrane le <b>budget</b>, en plein le <b>réel</b>, <b>hors taxe</b> comme toujours en gestion. <b>Touche la barre dont l'écart est anormal.</b></p>
			<table class="aw-tbl"><tr><th>Poste</th><th>Budget</th><th>Réel</th></tr>${rows.map((r, k) => `<tr data-r="${k}"><td>${r[0]}</td><td>${euro0(r[1])}</td><td>${euro0(r[2])}</td></tr>`).join("")}</table>`);
		let found = false;
		W.onTap = id => {
			if(found || !id || !id.startsWith("bar:")) return;
			const k = +id.slice(4);
			if(k !== 3){ err(); W.barMark(k, "#d9a441"); note("Un écart de quelques pour cent, ça arrive (prix, saison). Cherche un écart vraiment anormal."); return; }
			found = true; W.barMark(3, "#c4362f"); play("good"); clearNote();
			card.querySelector('tr[data-r="3"]').classList.add("hot");
			later(600, () => { W.only(["chart", "calc"]); W.look("budget2"); T.showHint("👆 Calcule l'écart (réel − budget), puis OK"); });
			append(`<p class="aw-p" style="margin-top:6px"><b>De combien les prestations de services dépassent-elles le budget ?</b> Calcule l'écart (réel − budget) sur la calculatrice, puis appuie sur <b>OK</b>.</p>`);
			let solved = false;
			W.onCalc = v => {
				if(solved) return;
				if(Math.abs(v - 2450) < .01){
					solved = true; W.onCalc = null; T.showHint(""); play("chime"); proof(); clearNote();
					append(`<p class="aw-ok">Σ 2 950 − 500 = 2 450 € hors taxe.</p><p class="aw-p">Soit, avec 20 % de TVA, <b>2 940 € : exactement le virement sans justificatif</b> vers Dupont Conseil Services ! Le contrôleur de gestion a repéré le problème grâce au budget.</p>${course("cdg")}${go("stamp", "Passer en L3 : l'audit →")}`);
					return;
				}
				err();
				note(Math.abs(v - 2940) < .01 ? "2 940 €, c'est un montant TTC. En gestion, on compare le budget et le réel hors taxe." : Math.abs(v + 2450) < .01 ? "Dans l'autre sens : réel moins budget." : "Pas tout à fait : 2 950 € de réel, 500 € de budget.");
			};
		};
	}

	/* ---------- E · L3 · audit : frapper chaque pièce du bon tampon ---------- */
	function stamp(){
		enter(); W.only(["stamps"]); stage("L3 · Audit", "stamp"); T.showHint("✋ Prends un tampon et frappe la pièce");
		const docs = shuffle(AUDIT_DOCS.map(d => ({ ...d })));
		let i = 0, cur = null;
		const C = new THREE.Vector3(-3.6, 0, .9);
		sheet("stamp", "E-1", h2("L3 · audit (en alternance)", "Tamponner les pièces"), `<p class="aw-p">Examine chaque pièce du trimestre. Si elle est correcte, frappe-la du tampon <b>CONFORME</b>. Sinon, choisis le tampon qui dit <b>la raison</b> de l'anomalie. Vérifie les calculs !</p>`);
		const summary = () => docs.slice(0, i).map(d => `<div class="ln"><span>${esc(d.t)}</span><b style="color:${d.ok ? "#2f6b45" : "#b91c1c"}">${d.ok ? "Conforme" : REASON[d.r]}</b></div>`).join("");
		function render(){ const d = docs[i]; live(`${i ? `<div class="aw-pc"><div class="hd"><span>Pièces tamponnées</span></div>${summary()}</div>` : ""}${d ? `<div class="aw-k">Pièce ${i + 1} / ${docs.length}</div>${pcHTML(d.hd, d.t, d.d, d.lines)}` : ""}`); T.scrollEnd(); }
		function next(){
			if(i >= docs.length) return done();
			const d = docs[i];
			cur = invoiceDoc({ t:d.t, hd:d.hd, d:d.d, lines:d.lines, col:d.id === "frais" ? "#8a2b4e" : d.id === "dupont" ? "#4a4f58" : "#5d6b7a" }, 5.6, 7);
			cur.g.position.set(-16, 0, C.z); W.dyn.add(cur.g); W.fly(cur.g, C, { h:.4, dur:500 });
			play("pop"); render();
		}
		W.setDrags(Object.values(W.STAMPS).map(s => ({ id:s.id, g:s.g, hit:s.hit, home:s.home, lift:3.4 })));
		W.setZones([{ id:"piece", pos:() => C.clone().setY(.5), obj:null }]);
		let busy = false;
		W.onDrop = (dr, z) => {
			const d = docs[i], s = W.STAMPS[dr.id];
			if(busy || !d || !cur){ W.goHome(dr); return; }
			const good = d.ok ? dr.id === "ok" : dr.id === d.r;
			const over = new THREE.Vector3(C.x + (Math.random() - .5)*.8, 2.6, C.z + .6 + (Math.random() - .5)*.6);
			busy = true;
			W.fly(s.g, over, { h:.2, dur:170, done:() => {
				if(!good){
					// la main hésite au-dessus de la pièce : la responsable arrête le geste
					W.anim(360, k => s.g.position.y = 2.6 - Math.sin(k*Math.PI)*.9, () => { W.wiggle(s.g); W.goHome(dr); busy = false; });
					err();
					note(d.ok ? `${esc(d.t)} : regarde bien, tout est justifié et les calculs sont justes.` : dr.id === "ok" ? `${esc(d.t)} : quelque chose cloche, vérifie les calculs et les justificatifs.` : `${esc(d.t)} : il y a bien une anomalie, mais pas celle-là.`);
					return;
				}
				// le coup de tampon : descente sèche, choc, encre, rebond
				W.anim(110, k => s.g.position.y = 2.6 - 2.55*k*k, () => {
					play("tampon"); W.shakeCam(.28); if(navigator.vibrate) try { navigator.vibrate(25); } catch(e){}
					const lx = over.x - cur.g.position.x, lz = over.z - cur.g.position.z;
					W.ink(cur, s.text, s.col, lx, lz, -.14 + (Math.random() - .5)*.16);
					W.anim(160, k => cur.g.position.y = -Math.sin(k*Math.PI)*.05);
					W.anim(260, k => s.g.position.y = .05 + 2.6*k, () => { W.goHome(dr); }, 120);
					if(!d.ok){ S.found++; if(d.id === "dupont") proof(); }
					clearNote();
					i++;
					const g = cur.g, pile = W.dyn.children.filter(o => o.userData.piled).length;
					later(700, () => { g.userData.piled = true; W.fly(g, new THREE.Vector3(-9.2, .06 + pile*.06, 2.4), { s:.7, ry:(Math.random() - .5)*.4, dur:420 }); busy = false; next(); });
				});
			} });
		};
		later(400, next);
		function done(){
			W.setDrags([]); T.showHint(""); play("chime");
			live(`<div class="aw-pc"><div class="hd"><span>Pièces tamponnées</span></div>${summary()}</div>
				<p class="aw-p">Deux anomalies : une erreur de TVA (300 × 20 % = 60 €, pas 66 €) et la fameuse facture <b>Dupont Conseil Services</b>, floue et sans bon de commande. Qui se cache derrière cette société ?</p>${go("board", "Ouvrir le tableau d'enquête →")}`); T.scrollEnd();
		}
	}

	/* ---------- F · L3 · le tableau d'enquête : lire le Kbis, tendre le fil rouge ---------- */
	const LINKS = { "morel|rib":"iban", "kbis|morel":"adresse" };
	function board(){
		enter(); W.only(["pins"]); stage("L3 · Enquête", "board"); T.showHint("🧵 Tends un fil entre deux pièces · touche une pièce pour la lire");
		const found = new Set(); let zoomed = null;
		sheet("board", "F-1", h2("L3 · audit · tableau d'enquête", "Qui se cache derrière Dupont Conseil ?"), `<p class="aw-p">Au mur, quatre pièces : le <b>Kbis</b> de la société, son <b>RIB</b> et deux fiches salariés. <b>Touche une pièce</b> pour la lire de près. Puis <b>tends un fil rouge</b> entre deux pièces qui partagent un indice. Il y en a deux à trouver.</p>`);
		const render = () => live(`<div class="aw-k" style="margin-top:4px">${found.size} / 2 indices reliés</div>${[...found].map(k => `<p class="aw-ok">${k === "iban" ? "✓ Même IBAN : l'argent de Dupont Conseil arrive sur le compte de paie de Julien Morel." : "✓ Même adresse : la société et sa gérante sont domiciliées chez Julien Morel."}</p>`).join("")}`);
		render();
		const B = W.BOARD;
		W.setDrags(Object.values(B).map(D => ({ id:D.id, self:D.id, hit:D.hit, wall:true, tap:true, line:{ from:D.pin, col:"#c4362f" } })));
		W.setZones(Object.values(B).map(D => ({ id:D.id, pos:D.center, obj:D.g })));
		W.onTap = id => {
			if(zoomed || !id || !B[id]){ zoomed = null; W.look("board"); return; }
			zoomed = id; W.zoomDoc(B[id]); play("pop");
		};
		W.onDrop = (d, z) => {
			if(zoomed){ zoomed = null; W.look("board"); }
			const k = [d.id, z].sort().join("|"), what = LINKS[k];
			if(!what){ err(); note(k === "kbis|rib" ? "Même société, c'est normal. Cherche la personne qui se cache derrière." : "Ces deux pièces n'ont rien en commun. Compare les adresses et les IBAN."); return; }
			if(found.has(what)){ note("Ce fil est déjà tendu."); return; }
			found.add(what); W.link(B[d.id].pin(), B[z].pin(), "#c4362f"); play("good"); proof(); clearNote();
			if(what === "adresse"){ B.kbis.state.hl = true; B.kbis.redraw(); }
			render();
			if(found.size === 2){
				W.setDrags([]); T.showHint(""); W.onTap = null;
				append(`<p class="aw-p" style="margin-top:6px">Une société <b>sans salarié</b>, créée il y a deux mois, dont la gérante habite chez le comptable, et dont le compte est celui de sa paie. Julien Morel a monté une <b>société écran</b>, avec un <b>prête-nom</b>, pour se payer de fausses « missions de conseil ». <b>Que fait l'auditeur maintenant ?</b></p><div data-q></div>`);
				qcm(card.querySelector("[data-live] [data-q]"), shuffle([["ok", "Il documente ses preuves et alerte la gérante dans son rapport"], ["post", "Il publie l'affaire sur les réseaux sociaux"], ["rien", "Il ne dit rien : ce n'est pas son rôle"]]), "ok", x => {
					x.innerHTML = `<p class="aw-p" style="margin-top:8px">C'est la <b>déontologie</b> de l'auditeur : indépendance, preuves solides, confidentialité, et alerte des bonnes personnes. La gérante pourra porter plainte et récupérer les sommes.</p>${course("societes")}${course("audit")}${go("end", "Rendre mon rapport d'audit")}`;
				});
			}
		};
	}

	/* ---------- G · rapport final ---------- */
	function finale(){
		enter(); W.only(["pins"]); stage("Rapport d'audit", "end");
		const B = W.BOARD; B.kbis.state.hl = true; B.kbis.redraw();
		later(500, () => { W.link(B.morel.pin(), B.rib.pin(), "#c4362f"); W.link(B.kbis.pin(), B.morel.pin(), "#c4362f"); });
		const e = S.errors, mention = e <= 2 ? "Très bien" : e <= 6 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention); play("win");
		const order = ["compta", "fisca", "banque", "cdg", "audit", "societes"].filter(k => S.learned.has(k));
		sheet("end", "G-1", h2("Licence Comptabilité-Finance-Audit · rapport", "Fraude démasquée !"), `
			<span class="aw-done">AFFAIRE RÉSOLUE</span>
			<p class="aw-p">Mission accomplie, mention <b>${mention}</b>.</p>
			<table class="aw-tbl"><tr><td>Montant détourné ce trimestre</td><td><b>2 940,00 €</b></td></tr><tr><td>Anomalies trouvées</td><td><b>${S.found} / 2</b></td></tr><tr><td>Preuves réunies</td><td><b>${S.proofs} / 5</b></td></tr><tr><td>Erreurs en chemin</td><td><b>${e}</b></td></tr></table>
			<p class="aw-p">Tu as fait le travail d'un comptable, d'un contrôleur de gestion et d'un auditeur, et touché à ${order.length} cours de la licence (en L3, en alternance dans un cabinet ou une entreprise) :</p>
			<ul class="aw-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<div class="aw-sig"><span>Rapport revu et approuvé</span><i>C. Roussel</i></div>`);
		live(`${jpoCard()}${openLead ? go("lead", "📄 Recevoir la plaquette de la licence") : ""}
			<a class="tb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Comptabilité-Finance-Audit ↗</a>
			<button class="tb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="tb-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { tri, tva, bank, budget, stamp, board, end:finale };
	T.root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a || a.disabled) return;
		const k = a.dataset.a; play("pop");
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ T.close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set(), found:0, proofs:0 }); meter("err", 0); meter("prv", 0); return intro(); }
	});
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["L1 · Trier les pièces", tri], ["L1 · La TVA", tva], ["L1 · Rapprochement bancaire", bank], ["L2 · Budget et réel", budget], ["L3 · Tamponner les pièces", stamp], ["L3 · Tableau d'enquête", board], ["Rapport d'audit", finale]]);
	if(window.campus) window.campus.game = { S, W, T, card, ...STEPS };
}
