/* « The Lone Star order » — mini-jeu de la Licence Internationale Économie & Gestion (FGES), en anglais comme la licence (2026).
   Le métier : analyste export chez Beffroi Bikes (fabricant lillois de vélos électriques, fictif). Première commande américaine :
   120 vélos pour Lone Star Cycles, à Austin, 282 000 $ payables par lettre de crédit. Le bateau part d'Anvers vendredi à 17 h.
   Une seule question : sera-t-on payé ? Chaque jour de la semaine, un geste du métier sur une vraie pièce ajoute une pièce
   au dossier export (même modèle que L'Enquête de l'auditeur, CFA) :
   1 · lundi, la lettre de crédit (scène d'ouverture, une minute) : la relire ligne à ligne contre le contrat signé et entourer
       au stylo rouge les trois écarts (montant, Incoterm, date d'expédition) → demande d'amendement ;
   2 · mardi, la carte de la route : poser le drapeau du risque et celui des frais là où ils passent à l'acheteuse (CIF) ;
   3 · mercredi, l'écran du cambiste : vendre ses dollars à terme, au bon moment, sous le cours budget → contrat à terme ;
   4 · jeudi, le rayon du magasin d'Austin : glisser l'étiquette du prix conseillé entre le plancher du distributeur
       et le prix du leader → prix public américain ;
   5 · vendredi, la présentation des documents : tirer au crayon chaque exigence du crédit vers la preuve, sur la facture,
       le connaissement et le certificat d'assurance, et démasquer le « FREIGHT COLLECT » → documents conformes, paiement.
   Entreprises, banques, personnes, navire et chiffres sont fictifs et simplifiés. Contenus à relire par l'équipe pédagogique
   (docs/validation-licence-lieg.md). */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { jpoCard } from "./jpo.js?v=ff1070917c";
import { palier } from "./palier.js?v=ff1070917c";

/* ---------- les cours (intitulés et années à faire valider) ---------- */
const COURSES = {
	law:   ["L1", "Contract law", "A letter of credit is a promise from the buyer's bank, separate from the sales contract: the bank pays only if every document matches the credit, to the letter. So you check it the day it arrives."],
	eng:   ["L1 to L3", "Business English", "Contracts, SWIFT messages, bills of lading, calls with Austin: the whole Licence is taught in English, the working language of trade."],
	trade: ["L2", "International economics & trade", "Incoterms® 2020 split costs and risks between seller and buyer. Under CIF there are two different points: the risk passes on board, the costs stop at the port of destination."],
	fin:   ["L2", "International finance", "Paid in dollars in 60 days, but our costs are in euros. A forward contract fixes today the rate of tomorrow: an exporter sells its future dollars."],
	mkt:   ["L2", "International marketing", "A floor set by costs and the distributor's margin, a ceiling set by the competition, and a position the product can justify: that's how a price is set abroad."],
	docs:  ["L3", "Trade operations & documentary credit", "Strict compliance: one word on the bill of lading can block $282,000. Export teams check every document before the bank does."],
	abroad:["L3", "A year abroad", "The third year is spent in one of about 200 partner universities, all over the world."]
};
const DAYS = {
	lc:["Mon 23 Nov", "09:10", "4 days to sailing"], route:["Tue 24 Nov", "10:30", "3 days to sailing"], fx:["Wed 25 Nov", "14:05", "2 days to sailing"],
	price:["Thu 26 Nov", "16:20", "1 day to sailing"], docs:["Fri 27 Nov", "11:00", "sails today, 17:00"], end:["Fri 27 Nov", "17:00", "at sea"]
};
const STEPS_UI = [["lc", "Mon"], ["route", "Tue"], ["fx", "Wed"], ["price", "Thu"], ["docs", "Fri"]];
const PIECES = [
	{ id:"lc", ic:"📝", n:"L/C amendment" },
	{ id:"route", ic:"⚓", n:"CIF & insurance" },
	{ id:"fx", ic:"💱", n:"Forward contract" },
	{ id:"price", ic:"🏷️", n:"US price" },
	{ id:"docs", ic:"📑", n:"Documents" }
];
const fmt = v => Math.round(v).toLocaleString("en-GB");
const usd = v => "$" + fmt(v);
const eur = v => "€" + fmt(v);
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 1 · le contrat signé, et la lettre de crédit reçue lundi matin ---------- */
const TOTAL = 282000, NEED = 240000, BUDGET = TOTAL/NEED;          // 1,1750 : au-dessus, on touche moins de 240 000 €
const CONTRACT = [
	["Goods", "120 e-bikes Beffroi Urban E7"], ["Price", "USD 2,350 a bike"], ["Total", "USD 282,000"],
	["Incoterms® 2020", "CIF Houston"], ["Shipment", "MV Scheldt Star, sails from Antwerp on 27 November 2026"], ["Payment", "Letter of credit, 60 days after the bill of lading date"]
];
const LC_ROWS = [
	{ id:"no", tag:":20:", k:"Credit number", v:"GCNB-26-4471", ok:"Just the bank's reference: nothing to compare with the contract." },
	{ id:"app", tag:":50:", k:"Applicant (buyer)", v:"Lone Star Cycles LLC, Austin", ok:"The right buyer, spelled exactly as in the contract. Banks check names to the letter." },
	{ id:"ben", tag:":59:", k:"Beneficiary (seller)", v:"Beffroi Bikes SAS, Lille", ok:"That's us, spelled correctly. Fine." },
	{ id:"amt", tag:":32B:", k:"Amount", v:"USD 228,000.00", bad:"USD 228,000? The contract says 120 × $2,350 = <b>USD 282,000</b>. Two digits swapped: the bank never pays more than the credit, we'd lose $54,000." },
	{ id:"goods", tag:":45A:", k:"Goods and Incoterm", v:"120 e-bikes Urban E7, FOB Antwerp", bad:"<b>FOB Antwerp?</b> We signed <b>CIF Houston</b>: we pay the ship and the insurance. Our documents would never match this credit." },
	{ id:"ports", tag:":44E/F:", k:"Port of loading / discharge", v:"Antwerp / Houston", ok:"Antwerp to Houston: exactly what we agreed." },
	{ id:"ship", tag:":44C:", k:"Latest shipment date", v:"20 November 2026", bad:"Latest shipment <b>20 November</b>, but our ship sails on <b>27 November</b>: we'd be late by the credit's own terms, and unpaid." },
	{ id:"pay", tag:":42C:", k:"Payment", v:"60 days after B/L date", ok:"60 days after the bill of lading date: as agreed." },
	{ id:"exp", tag:":31D:", k:"Expiry date and place", v:"31 December 2026, Lille", ok:"Expiry in Lille at the end of December: enough time to present our documents after sailing." }
];

/* ---------- 2 · la route : les cinq escales, sur la carte posée sur le bureau ---------- */
const STOPS = {
	lille:  { n:"Lille · our warehouse", x:6.1, z:-.3 },
	antwerp:{ n:"Antwerp · on board", x:4.45, z:-1.75 },
	sea:    { n:"Mid-Atlantic", x:-.2, z:-1.7 },
	houston:{ n:"Houston · port", x:-4.9, z:2.55 },
	austin: { n:"Austin · her shop", x:-6.5, z:.9 }
};
const FLAG_HELP = {
	risk:{ lille:"At our door? That's EXW. Under CIF we still truck the bikes to Antwerp and load the ship.", sea:"Risk doesn't change hands somewhere in the ocean: the rule names a precise point.", houston:"The classic CIF trap! We pay the ship to Houston, but the risk passes earlier.", austin:"To her door? That's DDP, not what we signed." },
	cost:{ lille:"That's EXW: she'd pay the truck and the ship.", antwerp:"That would be FOB: she'd book and pay the ship. CIF means Cost, Insurance and Freight… to Houston.", sea:"Freight is paid for the whole crossing, up to the port of destination.", austin:"From Houston to Austin, the truck and US duties are hers. Paying them would be DDP." }
};

/* ---------- 4 · le rayon d'Austin : les concurrents (fictifs) ---------- */
const LANDED = 2600, FLOOR = Math.ceil(LANDED/.7), LEADER = 4999;    // coût rendu Austin par vélo ; marge du distributeur ≥ 30 % du prix public
const RIVALS = [
	{ n:"BigBox Cruiser", p:1299, r:"40 km range", c:"#9aa3ad" },
	{ n:"Trailhawk City", p:2499, r:"60 km range", c:"#c4532f" },
	{ n:"Austin Volt", p:3499, r:"80 km range", c:"#d9a441" },
	{ n:"Velo Nord Premium", p:4999, r:"130 km · made in NL", c:"#2f6b45" }
];
const priceX = p => -7 + (p - 1000)/5000*14;
const xPrice = x => 1000 + (x + 7)/14*5000;

/* ---------- 5 · les documents : ce que le crédit exige, et où le prouver ---------- */
const REQS = [
	{ id:"r_amt", t:"Commercial invoice for USD 282,000.00", f:"inv_total" },
	{ id:"r_date", t:"Bill of lading: shipped on board by 30 Nov 2026", f:"bl_date" },
	{ id:"r_frt", t:"Bill of lading marked FREIGHT PREPAID", f:"bl_freight" },
	{ id:"r_ins", t:"Insurance for 110 %: USD 310,200.00", f:"ins_sum" }
];

const CSS = `
.cg{position:fixed;inset:0;z-index:40;background:#dfe5e8;font-family:Inter,Arial,sans-serif;font-weight:300;color:#0c2340;overflow:hidden;animation:cgIn .4s ease both}
@keyframes cgIn{from{opacity:0}}
.cg canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.cg-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px 12px;pointer-events:none}
.cg-top>*{pointer-events:auto}
.cg-brand{font:700 12px Inter,Arial,sans-serif;letter-spacing:.16em;color:#fff;background:#0f3168;border-radius:6px;padding:8px 12px;white-space:nowrap}
.cg-week{display:flex;gap:3px}
.cg-week span{font-size:11.5px;font-weight:800;color:#848487;background:rgba(255,255,255,.75);border-radius:5px;padding:6px 8px}
.cg-week span.done{color:#1d6b49;background:#e3f2e9}
.cg-week span.now{color:#fff;background:#21b7cb}
.cg-clock{font-size:12.5px;font-weight:800;color:#0c2340;background:rgba(255,255,255,.88);border-radius:6px;padding:7px 10px;white-space:nowrap;font-variant-numeric:tabular-nums}
.cg-clock b{color:#0f3168}.cg-clock i{font-style:normal;color:#c0362c}
.cg-err{font-size:12.5px;font-weight:800;background:rgba(255,255,255,.88);border-radius:6px;padding:7px 10px;white-space:nowrap}
.cg-err b{color:#c0362c}
.cg-x{margin-left:auto;flex:none;width:40px;height:40px;border-radius:50%;border:0;background:#0f3168;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 12px rgba(15,49,104,.3)}
.cg-bot{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:3;width:min(780px,calc(100% - 24px));display:flex;flex-direction:column;gap:8px;pointer-events:none}
.cg-bot>*{pointer-events:auto}
.cg-msg{position:relative;z-index:3;width:100%;display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:4px 14px 14px 14px;padding:9px 12px;box-shadow:0 8px 24px rgba(12,35,64,.18);border-left:4px solid #21b7cb;box-sizing:border-box}
.cg-av{flex:none;width:34px;height:34px;border-radius:50%;background:#0f3168;color:#fff;display:grid;place-items:center;font:700 15px Inter,Arial,sans-serif;font-style:normal}
.cg-msg small{display:block;font:700 10.5px Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#4f5c69;margin-bottom:2px}
.cg-msg p{margin:0;font:300 14.5px/1.42 Inter,Arial,sans-serif;color:#0c2340;min-height:20px}
.cg-msg p b{font-weight:700}
.cg-msg.warn{border-left-color:#c0362c}
.cg-dock{position:relative;width:100%;max-height:34vh;overflow:auto;background:#fffdf8;border-radius:12px;padding:10px 14px 12px;box-sizing:border-box;box-shadow:0 14px 36px rgba(12,35,64,.28);scrollbar-width:thin;overscroll-behavior:contain}
.cg-file{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 8px;padding-bottom:7px;border-bottom:1px dashed #d6dbe0}
.cg-file span{font-size:11px;font-weight:800;color:#a4a9ae;border:1px dashed #c8cdd2;border-radius:5px;padding:3px 7px;white-space:nowrap}
.cg-file span.got{color:#0f3168;border:1px solid #21b7cb;background:#e9f7fa;animation:cgPop .45s cubic-bezier(.2,.9,.3,1.4) both}
@keyframes cgPop{from{transform:scale(.6);opacity:0}}
.cg-hint{font-size:13px;font-weight:800;color:#0f3168;margin:0 0 6px}
.cg-k{font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb}
.cg-h{font:300 21px/1.2 Tiempos Headline,Times New Roman,serif;margin:2px 0 6px;color:#0c2340}
.cg-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#4f5c69}
.cg-p b{color:#0c2340;font-weight:700}
.cg-ok{color:#1d6b49;font-weight:700;font-size:14px;margin:4px 0 8px}
.cg-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 8px;font-variant-numeric:tabular-nums}
.cg-tbl td{padding:4px 4px;border-top:1px solid #e3e7ea;vertical-align:top;color:#4f5c69}
.cg-tbl td:last-child{text-align:right;font-weight:700;color:#0c2340}
.cg-tbl tr.hot td{background:#fdeceb}
.cg-row{display:flex;flex-wrap:wrap;gap:6px 16px;margin:2px 0 6px}
.cg-big{font:300 24px/1 Tiempos Headline,Times New Roman,serif;font-variant-numeric:tabular-nums;color:#0c2340}
.cg-big small{display:block;font:800 10.5px Inter,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#848487;margin-bottom:4px}
.cg-big .g{color:#1d6b49}.cg-big .r{color:#c0362c}
.cg-go{display:block;width:100%;border:0;border-radius:10px;padding:13px;margin-top:8px;background:#0f3168;color:#fff;font:700 15.5px Inter,Arial,sans-serif;cursor:pointer}
.cg-go:disabled{opacity:.35;cursor:default}
.cg-alt{display:block;width:100%;border:1.5px solid #c8cdd2;border-radius:10px;padding:11px;margin-top:8px;background:#fff;color:#0f3168;font:700 14px Inter,Arial,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.cg-course{border-left:3px solid #21b7cb;background:#e9f7fa;border-radius:6px;padding:7px 10px;margin:8px 0}
.cg-course small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#0f3168}
.cg-course b{display:block;color:#0c2340;font-weight:700}
.cg-course span{font-size:13px;color:#4f5c69}
.cg-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:4px}
.cg-list li{font-size:13.5px;border-bottom:1px dashed #d6dbe0;padding:3px 0}
.cg-list li span{color:#21b7cb;font-weight:900;margin-right:6px}
.cg-lang{display:inline-block;font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 9px;background:#e9f7fa;color:#0f3168;margin-bottom:4px}
.cg-mob{display:none}
.cg-done{display:inline-block;border:3px solid #1d6b49;color:#1d6b49;font:700 13px Inter,Arial,sans-serif;letter-spacing:.14em;padding:3px 9px;border-radius:5px;transform:rotate(-5deg);margin:4px 0 8px}
@media (max-width:759px){
	.cg-mob{display:block}
	.cg-week,.cg-brand{display:none}
	.cg-top{padding:8px;gap:6px}
	.cg-clock,.cg-err{font-size:11px;padding:6px 7px}
	.cg-t{display:none}
	.cg-x{width:36px;height:36px;font-size:20px}
	.cg-bot{left:0;bottom:0;transform:none;width:100%;gap:0}
	.cg-msg{position:fixed;top:56px;left:8px;width:calc(100% - 16px);padding:7px 10px}
	.cg-msg p{font-size:13px;line-height:1.38}
	.cg-av{width:28px;height:28px;font-size:13px}
	.cg-dock{max-height:40vh;border-radius:14px 14px 0 0;padding:8px 12px 12px}
	.cg-h{font-size:18px}
	.cg-p{font-size:13.5px}
	.cg-file{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-bottom:6px;padding-bottom:5px}
	.cg-file span{font-size:10px;padding:2px 5px}
	.cg-dock{max-height:32vh}
	.cg-msg p{max-height:22vh;overflow:auto}
}`;

export function openCargo({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("cg-css2")){ const st = document.createElement("style"); st.id = "cg-css2"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "cg";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-game: The Lone Star order");
	root.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="cg-top"><span class="cg-brand">BEFFROI BIKES · EXPORT</span><div class="cg-week">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div>
			<span class="cg-clock" data-clock></span><span class="cg-err">Mistakes <b data-err>0</b></span><button class="cg-x" aria-label="Close the game">×</button></div>
		<div class="cg-bot"><div class="cg-msg" aria-live="polite"><i class="cg-av">M</i><div><small>Maya Dubois · export manager</small><p></p></div></div>
		<div class="cg-dock"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), dock = $(".cg-dock"), msg = $(".cg-msg"), msgP = $(".cg-msg p"), topBar = $(".cg-top");
	const S = { errors:0, learned:new Set(), pieces:new Set(), rate:null, msrp:null, reissued:false, lcFound:0 };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= la scène : le bureau export, chez Beffroi Bikes, à Lille ================= */
	const PX = 100;
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#dfe5e8"); scene.fog = new THREE.Fog("#dfe5e8", 80, 160);
	const camera = new THREE.PerspectiveCamera(40, 1, .1, 300);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.enableRotate = false; controls.minDistance = 5; controls.maxDistance = 90;
	scene.add(new THREE.HemisphereLight("#ffffff", "#b9b2a6", 1.25));
	const sun = new THREE.DirectionalLight("#fff3e2", 1.9); sun.position.set(14, 26, 12); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-22, right:22, top:22, bottom:-22, near:1, far:80 }); sun.shadow.bias = -.0005;
	scene.add(sun);
	const maxAniso = renderer.capabilities.getMaxAnisotropy();
	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.7, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, typeof mat === "string" ? M(mat) : mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y + h/2, z);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
	const hidden = new THREE.MeshBasicMaterial({ visible:false });
	const T = (x, s, px, py, size, o = {}) => { x.font = `${o.w || 400} ${size}px ${o.f || "Inter,Arial,sans-serif"}`; x.fillStyle = o.c || "#0c2340"; x.textAlign = o.a || "left"; x.fillText(s, px, py); };
	function wrap(x, s, px, py, maxW, lh){ const words = String(s).split(" "); let line = ""; for(const w of words){ const t = line ? line + " " + w : w; if(x.measureText(t).width > maxW && line){ x.fillText(line, px, py); py += lh; line = w; } else line = t; } if(line) x.fillText(line, px, py); return py; }

	/* --- le décor : parquet, murs clairs, grande fenêtre sur l'entrepôt, planisphère, horloges, un vélo --- */
	const FY = -12;
	{
		const deco = new THREE.Group(); scene.add(deco);
		const still = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; deco.add(m); return m; };
		const sbox = (w, h, d, c, x, y, z) => still(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? M(c) : c, x, y + h/2, z);
		const wood = tex(256, 256, (x, w, h) => { x.fillStyle = "#b48a5e"; x.fillRect(0, 0, w, h); for(let i = 0; i < 8; i++){ x.fillStyle = i % 2 ? "#a97f54" : "#bb9266"; x.fillRect(0, i*32, w, 30); } x.strokeStyle = "rgba(60,35,15,.25)"; for(let i = 0; i < 8; i++){ x.beginPath(); x.moveTo(0, i*32); x.lineTo(w, i*32); x.stroke(); x.beginPath(); x.moveTo((i*97) % w, i*32); x.lineTo((i*97) % w, i*32 + 30); x.stroke(); } });
		wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(10, 10);
		still(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ map:wood, roughness:.8 }), 0, FY, 0).rotation.x = -Math.PI/2;
		sbox(90, 40, 1, "#eef1f3", 0, FY, -12); sbox(90, .8, 1.2, "#c9ced3", 0, FY, -11.6);
		for(const sx of [-1, 1]) sbox(1, 40, 70, "#e7ebee", sx*34, FY, 0);
		// la fenêtre sur l'entrepôt : des cartons de vélos, un conteneur sur sa remorque
		const yard = tex(512, 256, (x, w, h) => {
			const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#a9cbe6"); g.addColorStop(.55, "#e6eef2"); g.addColorStop(.56, "#9aa2a8"); g.addColorStop(1, "#7f878d"); x.fillStyle = g; x.fillRect(0, 0, w, h);
			x.fillStyle = "#b04a35"; x.fillRect(250, 120, 220, 70); x.fillStyle = "rgba(0,0,0,.18)"; for(let i = 0; i < 11; i++) x.fillRect(256 + i*20, 124, 3, 62);
			x.fillStyle = "#fff"; x.font = "700 15px Inter,Arial,sans-serif"; x.fillText("SCHELDT STAR LINE", 290, 160);
			x.fillStyle = "#2a2f36"; x.fillRect(240, 190, 240, 8); for(const cx of [270, 300, 440]){ x.beginPath(); x.arc(cx, 204, 9, 0, 7); x.fill(); }
			for(let i = 0; i < 14; i++){ x.fillStyle = i % 2 ? "#c9a46c" : "#bf9a61"; x.fillRect(20 + (i % 7)*30, 150 - Math.floor(i/7)*30, 28, 28); x.fillStyle = "#0f3168"; x.fillRect(26 + (i % 7)*30, 160 - Math.floor(i/7)*30, 16, 4); }
		});
		sbox(26, 15, .5, "#f7f8f9", -14, FY + 15, -11.4);
		still(new THREE.PlaneGeometry(25, 14), new THREE.MeshBasicMaterial({ map:yard }), -14, FY + 22.5, -11.1);
		sbox(.4, 14, .6, "#f7f8f9", -14, FY + 15.5, -11);
		// le planisphère de l'export, avec ses épingles
		const world = tex(1024, 512, (x, w, h) => {
			x.fillStyle = "#f3efe4"; x.fillRect(0, 0, w, h); x.fillStyle = "#c9dbe6"; x.fillRect(16, 16, w - 32, h - 32);
			const px = lon => 16 + (lon + 180)/360*(w - 32), py = lat => 16 + (85 - lat)/145*(h - 32);
			x.fillStyle = "#f3efe4"; x.strokeStyle = "#9db3c2"; x.lineWidth = 2;
			for(const poly of LAND){ x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(px(lo), py(la)) : x.moveTo(px(lo), py(la))); x.closePath(); x.fill(); x.stroke(); }
			x.strokeStyle = "#c0362c"; x.setLineDash([8, 6]); x.lineWidth = 3; x.beginPath(); x.moveTo(px(4.4), py(51.2)); x.quadraticCurveTo(px(-45), py(36), px(-95.4), py(29.8)); x.stroke(); x.setLineDash([]);
			for(const [lo, la] of [[3.06, 50.63], [-97.7, 30.3], [-.13, 51.5], [10, 53.5]]){ x.fillStyle = "#c0362c"; x.beginPath(); x.arc(px(lo), py(la), 7, 0, 7); x.fill(); }
			x.fillStyle = "#0f3168"; x.font = "700 26px Inter,Arial,sans-serif"; x.fillText("BEFFROI BIKES · WHERE WE SELL", 36, h - 30);
		});
		sbox(17, 9, .3, "#0f3168", 12, FY + 18, -11.4);
		still(new THREE.PlaneGeometry(16.4, 8.4), new THREE.MeshBasicMaterial({ map:world }), 12, FY + 22.5, -11.2);
		// les horloges : Lille et Austin, sept heures d'écart
		[["LILLE", 9, 22], ["AUSTIN", 2, 26.5]].forEach(([n, hr, xx]) => {
			const t = tex(256, 300, (x, w, h) => {
				x.fillStyle = "#fff"; x.beginPath(); x.arc(128, 128, 120, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = "#0f3168"; x.stroke();
				x.fillStyle = "#0c2340"; for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; x.fillRect(128 + Math.sin(a)*98 - 3, 128 - Math.cos(a)*98 - 3, 6, 6); }
				const ha = hr/12*Math.PI*2, ma = .2*Math.PI*2; x.lineCap = "round";
				x.lineWidth = 9; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ha)*55, 128 - Math.cos(ha)*55); x.stroke();
				x.lineWidth = 6; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ma)*85, 128 - Math.cos(ma)*85); x.stroke();
				x.font = "700 34px Inter,Arial,sans-serif"; x.textAlign = "center"; x.fillText(n, 128, 292);
			});
			const m = still(new THREE.PlaneGeometry(3.4, 4), new THREE.MeshBasicMaterial({ map:t, transparent:true }), xx, FY + 30, -11.3);
		});
		// un Urban E7 d'exposition, contre le mur
		const bike = miniBike("#21b7cb", 3.2); bike.position.set(29, FY, -9.5); bike.rotation.y = -.2; deco.add(bike);
		// une plante
		still(new THREE.CylinderGeometry(1.4, 1.1, 3, 18), M("#eceae4"), -29, FY + 1.5, -8);
		for(let i = 0; i < 7; i++) still(new THREE.SphereGeometry(1.4 + (i % 3)*.3, 10, 8), M(["#4f7a45", "#5d8a4f", "#44683c"][i % 3]), -29 + Math.cos(i), FY + 4.5 + (i % 4)*1.1, -8 + Math.sin(i));
	}
	// un petit vélo, pour le rayon d'Austin et le décor
	function miniBike(col, s = 1){
		const g = new THREE.Group(), frame = M(col, { roughness:.4 }), dark = M("#22262e");
		for(const x of [-.55, .55]) g.add(mesh(new THREE.TorusGeometry(.32, .05, 8, 24), dark, x, .37, 0));
		const bar = (x1, y1, x2, y2, r = .035) => { const a = new THREE.Vector3(x1, y1, 0), b = new THREE.Vector3(x2, y2, 0), d = b.clone().sub(a); const m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), frame); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); };
		bar(-.55, .37, -.05, .37); bar(-.05, .37, .35, .82); bar(-.55, .37, -.2, .8); bar(-.2, .8, .35, .82); bar(.55, .37, .4, .95); bar(.4, .95, .3, 1.02, .03);
		g.add(mesh(new THREE.BoxGeometry(.32, .1, .1), dark, -.22, .86, 0));
		g.add(mesh(new THREE.BoxGeometry(.42, .12, .12), M("#2b2f36"), .1, .64, 0));
		g.scale.setScalar(s);
		return g;
	}

	/* --- le bureau : chêne, pieds acier ; ordinateur, mug, téléphone --- */
	{
		const oak = tex(512, 256, (x, w, h) => { x.fillStyle = "#c9a173"; x.fillRect(0, 0, w, h); for(let i = 0; i < 70; i++){ x.strokeStyle = `rgba(120,80,40,${.06 + Math.random()*.08})`; x.lineWidth = 1 + Math.random()*2; x.beginPath(); const y = Math.random()*h; x.moveTo(0, y); x.bezierCurveTo(w*.3, y + 8, w*.6, y - 8, w, y + 4); x.stroke(); } });
		scene.add(mesh(new THREE.BoxGeometry(32, .6, 18), new THREE.MeshStandardMaterial({ map:oak, roughness:.6 }), 0, -.3, 0));
		for(const sx of [-1, 1]) for(const sz of [-1, 1]) scene.add(box(.7, 11.4, .7, M("#3b4048", { metalness:.6, roughness:.35 }), sx*15, FY, sz*8));
		const lap = new THREE.Group(); lap.position.set(-13.2, 0, -6.2); lap.rotation.y = .5; scene.add(lap);
		lap.add(box(4.6, .2, 3.2, M("#9aa1aa", { metalness:.5, roughness:.35 }), 0, 0, 0));
		const scr = new THREE.Group(); scr.position.set(0, .2, -1.6); scr.rotation.x = -.3; lap.add(scr);
		scr.add(mesh(new THREE.BoxGeometry(4.6, 3, .12), "#2b2f36", 0, 1.5, 0));
		scr.add(mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map:tex(420, 260, (x, w, h) => { x.fillStyle = "#f4f6f9"; x.fillRect(0, 0, w, h); x.fillStyle = "#0f3168"; x.fillRect(0, 0, w, 34); T(x, "Inbox · export@beffroi-bikes", 12, 23, 16, { w:700, c:"#fff" }); [["Lone Star Cycles", "Re: first order 🚲"], ["Gulf Coast Nat. Bank", "L/C GCNB-26-4471"], ["Scheldt Star Line", "Booking confirmed"], ["Banque des Flandres", "FX forward desk"]].forEach(([a, b], i) => { T(x, a, 14, 66 + i*48, 15, { w:700 }); T(x, b, 14, 86 + i*48, 14, { c:"#4f5c69" }); }); }) }), 0, 1.5, .07));
		const mug = new THREE.Group(); mug.position.set(13.4, 0, -6.4); scene.add(mug);
		mug.add(mesh(new THREE.CylinderGeometry(.62, .55, 1.4, 20), "#21b7cb", 0, .7, 0), mesh(new THREE.CylinderGeometry(.55, .55, .05, 20), "#4a2c1a", 0, 1.3, 0));
		mug.add(mesh(new THREE.TorusGeometry(.35, .08, 8, 16), "#21b7cb", .7, .75, 0));
	}

	/* --- étiquettes 3D --- */
	let LS = 1;
	function label(text, o = {}){
		const c = document.createElement("canvas"), x = c.getContext("2d"), f = `700 ${o.big ? 54 : 42}px Inter,Arial,sans-serif`;
		x.font = f; const w = Math.ceil(x.measureText(text).width) + 40, h = o.big ? 80 : 64; c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "#0f3168"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 12); x.fill();
		x.fillStyle = o.fg || "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true })); sp.renderOrder = 10;
		const s = o.size || .6; sp.userData.base = new THREE.Vector3(s*w/h, s, 1); sp.scale.copy(sp.userData.base).multiplyScalar(LS);
		return sp;
	}

	/* --- les documents : du papier, une face dessinée au canvas, qu'on redessine (cercles, tampons) --- */
	function doc(w, h, draw, o = {}){
		const g = new THREE.Group();
		const c = document.createElement("canvas"); c.width = Math.round(w*PX); c.height = Math.round(h*PX);
		const x = c.getContext("2d"), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
		const paper = mesh(new THREE.BoxGeometry(w, o.thick || .05, h), o.body || "#f1eee6", 0, (o.thick || .05)/2, 0); g.add(paper);
		const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:t, color:"#f6f6f6" })); face.rotation.x = -Math.PI/2; face.position.y = (o.thick || .05) + .006; g.add(face);
		const D = { g, c, x, t, w, h, hit:paper, state:{}, redraw(){ x.save(); draw(x, c.width, c.height, D); x.restore(); t.needsUpdate = true; },
			at(px, py, y = .12){ g.updateMatrix(); return new THREE.Vector3(px/PX - w/2, y, py/PX - h/2).applyMatrix4(g.matrix); } };
		D.redraw();
		return D;
	}
	// une zone à toucher posée sur un document (coordonnées en pixels du canvas)
	function spot(D, px, py, pw, ph, id){
		const m = new THREE.Mesh(new THREE.BoxGeometry(pw/PX, .3, ph/PX), hidden); m.position.set((px + pw/2)/PX - D.w/2, .15, (py + ph/2)/PX - D.h/2);
		m.userData.id = id; D.g.add(m); return m;
	}
	// le coup de tampon : un cadre, un mot, l'encre un peu irrégulière
	function ink(D, text, color, cx, cy, rot, fs = 46){
		const x = D.x; x.save(); x.translate(cx, cy); x.rotate(rot);
		x.font = `700 ${fs}px Inter,Arial,sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
		const bw = x.measureText(text).width + 40, bh = fs + 28;
		x.globalAlpha = .86; x.strokeStyle = x.fillStyle = color; x.lineWidth = 6;
		x.beginPath(); x.roundRect(-bw/2, -bh/2, bw, bh, 8); x.stroke(); x.fillText(text, 0, 3);
		x.globalAlpha = .5; x.fillStyle = "#fffdf8"; for(let i = 0; i < 60; i++) x.fillRect((Math.random() - .5)*bw, (Math.random() - .5)*bh, 1 + Math.random()*2.5, 1 + Math.random()*2.5);
		x.restore(); D.t.needsUpdate = true;
	}
	// le cercle au stylo rouge, tracé progressivement
	function circle(x, cx, cy, rx, ry, k, col = "#c0362c"){
		x.save(); x.strokeStyle = col; x.lineWidth = 5; x.lineCap = "round"; x.globalAlpha = .9;
		x.beginPath(); x.ellipse(cx, cy, rx, ry, -.03, -2.2, -2.2 + Math.PI*2.15*k); x.stroke(); x.restore();
	}

	/* --- petites animations --- */
	const anims = [];
	const anim = (dur, fn, done, delay = 0) => anims.push({ t0:performance.now() + delay, dur, fn, done });
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const popIn = g => { g.visible = true; g.scale.setScalar(.001); anim(380, k => g.scale.setScalar(Math.max(.001, (1 + .15*Math.sin(k*Math.PI))*k))); };
	function fly(g, to, o = {}){
		const from = g.position.clone(), d = from.distanceTo(to), h = o.h ?? Math.min(2.5, .5 + d*.15), dur = o.dur || (280 + d*26);
		anim(dur, k => { const e = ease(k); g.position.lerpVectors(from, to, e); g.position.y += h*4*e*(1 - e); }, o.done);
	}
	const wiggle = g => { const r0 = g.rotation.y; anim(480, k => g.rotation.y = r0 + Math.sin(k*Math.PI*6)*.1*(1 - k), () => g.rotation.y = r0); };
	let shakeT = 0;
	const shakeCam = () => { shakeT = performance.now(); };

	/* --- le stylo rouge, qui va entourer --- */
	const pen = new THREE.Group(); scene.add(pen);
	{
		const body = mesh(new THREE.CylinderGeometry(.13, .13, 2.6, 10), "#c0362c", 0, 1.3, 0); pen.add(body);
		pen.add(mesh(new THREE.ConeGeometry(.13, .4, 10), "#e9e3d6", 0, -.2, 0)); pen.children[1].rotation.x = Math.PI;
		pen.add(mesh(new THREE.CylinderGeometry(.14, .14, .6, 10), "#22262e", 0, 2.4, 0));
		pen.rotation.z = -.5; pen.position.set(11, .2, 5); pen.visible = false;
	}
	const penHome = new THREE.Vector3(11, .2, 5);

	/* --- les groupes de chaque journée --- */
	const G = { lc:new THREE.Group(), route:new THREE.Group(), fx:new THREE.Group(), shop:new THREE.Group(), docs:new THREE.Group() };
	for(const g of Object.values(G)){ scene.add(g); g.visible = false; }
	function only(list){ for(const [k, g] of Object.entries(G)){ if(list.includes(k)){ if(!g.visible) popIn(g); } else g.visible = false; } }

	/* ================= la main : toucher, glisser, tirer un trait ================= */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane();
	let taps = [], drags = [], zones = [], onTap = null, onDrop = null, onMove = null, grab = null, down = null, sel = null;
	const live = mesh(new THREE.CylinderGeometry(.05, .05, 1, 8), "#4a4a52"); live.visible = false; scene.add(live);
	const links = new THREE.Group(); scene.add(links);
	function stick(m, a, b){ const d = new THREE.Vector3().subVectors(b, a), L = Math.max(.001, d.length()); m.position.copy(a).addScaledVector(d, .5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
	function link(a, b, col, r = .05){ const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), M(col, { roughness:.6 })); stick(m, a, b); links.add(m); return m; }
	function setRay(e){ const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); }
	function planePoint(e, y){ setRay(e); plane.set(new THREE.Vector3(0, 1, 0), -y); return ray.ray.intersectPlane(plane, new THREE.Vector3()); }
	const scr = v => { const r = canvas.getBoundingClientRect(), p = v.clone().project(camera); return [(p.x + 1)/2*r.width + r.left, (1 - p.y)/2*r.height + r.top]; };
	// la zone visée : d'abord celle sous le doigt ; sinon celle que vise le geste (cône d'environ 35°) ; sinon la plus proche
	function pickZone(d, x0, y0, x1, y1, e){
		if(!zones.length) return null;
		if(e){ setRay(e); const h = ray.intersectObjects(zones.filter(z => z.hit).map(z => z.hit), false)[0]; if(h) return zones.find(z => z.hit === h.object); }
		const r = canvas.getBoundingClientRect(), m = Math.min(r.width, r.height), Rc = m*.05 + 22, R = d && d.strict ? m*.08 + 26 : m*.25 + 40;
		const zs = zones.map(z => { const [zx, zy] = scr(z.pos()); return { z, zx, zy, dd:Math.hypot(x1 - zx, y1 - zy) }; }).sort((a, b) => a.dd - b.dd);
		if(zs[0].dd < Rc) return zs[0].z;
		if(d && !d.strict){
			const gx = x1 - x0, gy = y1 - y0, gl = Math.hypot(gx, gy);
			if(gl >= 36){ let best = null, ba = .62;
				for(const o of zs){ const vx = o.zx - x0, vy = o.zy - y0, vl = Math.hypot(vx, vy); if(vl < 1) continue; const a = Math.acos(Math.max(-1, Math.min(1, (vx*gx + vy*gy)/(vl*gl)))); if(a < ba){ ba = a; best = o.z; } }
				if(best) return best; }
		}
		return zs[0].dd < R ? zs[0].z : null;
	}
	function select(d){ sel = d; if(d && d.onSel) d.onSel(true); }
	canvas.addEventListener("pointerdown", e => {
		setRay(e);
		const dh = ray.intersectObjects(drags.map(d => d.hit), false)[0];
		if(dh){ const d = drags.find(x => x.hit === dh.object); grab = { d, x0:e.clientX, y0:e.clientY, moved:false }; controls.enabled = false; try { canvas.setPointerCapture(e.pointerId); } catch(_){} return; }
		down = { x:e.clientX, y:e.clientY };
	});
	canvas.addEventListener("pointermove", e => {
		if(!grab) return;
		const d = grab.d;
		if(!grab.moved && Math.hypot(e.clientX - grab.x0, e.clientY - grab.y0) < 8) return;
		if(!grab.moved){ grab.moved = true; if(sel && sel.onSel) sel.onSel(false); sel = null; if(d.line){ live.material = M(d.line.col || "#4a4a52"); live.visible = true; } }
		const p = planePoint(e, d.lift ?? .12); if(!p) return;
		if(d.line) stick(live, d.line.from(), p);
		else if(d.g){
			if(d.axis === "x"){ d.g.position.x = Math.max(d.min, Math.min(d.max, p.x)); }
			else d.g.position.set(p.x, d.lift, p.z);
		}
		onMove && onMove(d, p);
	});
	function release(e){
		if(grab){
			const { d, moved, x0, y0 } = grab; grab = null; controls.enabled = true; live.visible = false;
			if(!moved){ if(d.tapId && onTap){ onTap(d.tapId); return; } if(sel && sel.onSel) sel.onSel(false); select(sel === d ? null : d); return; }
			if(d.free){ onDrop && onDrop(d, null); return; }
			const z = pickZone(d, x0, y0, e.clientX, e.clientY, e);
			if(z && onDrop) return onDrop(d, z.id);
			if(d.g) fly(d.g, d.home, { h:.5, dur:300 });
			return;
		}
		if(!down) return;
		const t = down; down = null;
		if(Math.hypot(e.clientX - t.x, e.clientY - t.y) > 10) return;
		setRay(e);
		if(sel){ const z = pickZone(sel, e.clientX, e.clientY, e.clientX, e.clientY, e); const d = sel; if(d.onSel) d.onSel(false); sel = null; if(z && onDrop) return onDrop(d, z.id); }
		const th = ray.intersectObjects(taps.map(t => t.hit), false)[0];
		if(onTap) onTap(th ? taps.find(t => t.hit === th.object).id : null);
	}
	canvas.addEventListener("pointerup", release);
	canvas.addEventListener("pointercancel", release);
	function clearInput(){ taps = []; drags = []; zones = []; onTap = onDrop = onMove = null; grab = null; sel = null; live.visible = false; }

	/* --- caméra : on cadre un rectangle du bureau dans la zone libre, entre le message de Maya et le panneau du bas --- */
	let view = null, cam = null, lay = { w:1, h:1, top:0, dk:0, F:1 };
	function measure(){
		const w = innerWidth, h = innerHeight;
		const mr = msg.getBoundingClientRect(), up = mr.top < h/2;      // téléphone : le message en haut ; ordinateur : au-dessus du panneau
		const top = Math.max(topBar.getBoundingClientRect().bottom, up ? mr.bottom + 4 : 0);
		const dk = Math.max(0, h - Math.min(dock.childElementCount ? dock.getBoundingClientRect().top : h, up ? h : mr.top) + 4);
		return { w, h, top:Math.min(top, h*.45), dk:Math.min(dk, h*.5) };
	}
	function resize(){
		lay = measure(); const { w, h, top, dk } = lay;
		renderer.setSize(w, h, false);
		const y = Math.max(0, dk - top), F = h + Math.abs(dk - top); lay.F = F;
		camera.aspect = w/F; camera.setViewOffset(w, F, 0, y, w, h); camera.updateProjectionMatrix();
		const ls = w < 600 ? 1.35 : 1;
		if(ls !== LS){ LS = ls; scene.traverse(o => { if(o.isSprite && o.userData.base) o.scale.copy(o.userData.base).multiplyScalar(LS); }); }
		if(view) look(view, .45);
	}
	// view : { c:[x, z], w, d, tilt } — un rectangle du bureau à faire tenir à l'écran
	function look(v, dur = 1.1){
		view = v;
		const t = Math.tan(THREE.MathUtils.degToRad(camera.fov/2)), free = Math.max(140, lay.h - lay.top - lay.dk);
		const tv = t*free/lay.F, th = t*lay.w/lay.F, tilt = v.tilt ?? .42;
		const dist = Math.max((v.d*Math.cos(tilt)/2)/tv + v.d*Math.sin(tilt)/2, (v.w/2)/th + v.d*Math.sin(tilt)/2)*1.04;
		const t1 = new THREE.Vector3(v.c[0], v.y || 0, v.c[1]), p1 = t1.clone().add(new THREE.Vector3(0, Math.cos(tilt), Math.sin(tilt)).multiplyScalar(dist));
		cam = { k:0, dur, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	addEventListener("resize", resize);

	/* --- la boucle --- */
	let raf = 0, last = performance.now(), tick = null, lastLay = "";
	const off = new THREE.Vector3();
	function frame(now){
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(let i = anims.length - 1; i >= 0; i--){ const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); if(k < 0) continue; a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); } }
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		tick && tick(now, dt);
		// le panneau du bas ou le message changent de taille : on recadre
		const m = measure(), key = `${m.w}|${m.h}|${Math.round(m.top/10)}|${Math.round(m.dk/10)}`;
		if(key !== lastLay){ lastLay = key; resize(); }
		controls.update();
		const sk = (now - shakeT)/260;
		if(sk < 1){ off.set((Math.random() - .5)*.2*(1 - sk), 0, (Math.random() - .5)*.2*(1 - sk)); camera.position.add(off); }
		renderer.render(scene, camera);
		if(sk < 1) camera.position.sub(off);
	}

	/* ================= l'interface ================= */
	let sayT = 0;
	function say(html, warn){
		clearInterval(sayT); msg.classList.toggle("warn", !!warn);
		const plain = html.replace(/<[^>]+>/g, ""); let i = 0;
		// la hauteur finale tout de suite : le cadrage de la scène ne bouge pas pendant que le texte s'écrit
		msgP.style.minHeight = ""; msgP.innerHTML = html; msgP.style.minHeight = msgP.offsetHeight + "px"; msgP.textContent = "";
		sayT = setInterval(() => { if(closed) return clearInterval(sayT); i += 3; if(i >= plain.length){ clearInterval(sayT); msgP.innerHTML = html; } else msgP.textContent = plain.slice(0, i); }, 14);
	}
	let cur = "lc";
	function stage(k, title){
		cur = k; clearInput(); links.clear(); pen.visible = false; tick = null;
		const n = STEPS_UI.findIndex(x => x[0] === k);
		root.querySelectorAll(".cg-week span").forEach((s, i) => s.className = k === "end" || i < n ? "done" : i === n ? "now" : "");
		const [d, h, left] = DAYS[k]; $("[data-clock]").innerHTML = `<b>${d}</b><span class="cg-t"> · ${h}</span> · ⛴ <i>${left}</i>`;
		ev("stage", title);
	}
	const fileHTML = () => `<div class="cg-file" aria-label="Export file">${PIECES.map(p => `<span class="${S.pieces.has(p.id) ? "got" : ""}">${p.ic} ${p.n}</span>`).join("")}</div>`;
	function dockHTML(html){ dock.innerHTML = fileHTML() + html; dock.scrollTop = 0; }
	const append = html => { const el = dock.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); dock.scrollTop = dock.scrollHeight; } };
	const setLive = html => { const el = dock.querySelector("[data-live]"); if(el) el.innerHTML = html; };
	function piece(id){ S.pieces.add(id); const f = dock.querySelector(".cg-file"); if(f) f.outerHTML = fileHTML(); }
	function err(){ S.errors++; $("[data-err]").textContent = S.errors; play("bad"); ev("err"); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="cg-course"><small>In the Licence · ${y}</small><b>${n}</b><span>${t}</span></div>`; }
	const next = (step, t) => `<button class="cg-go" data-next="${step}">${t}</button>`;
	dock.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });

	/* ================= 1 · lundi : la lettre de crédit contre le contrat ================= */
	const contractDoc = doc(6.8, 9.6, (x, w, h) => {
		x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
		x.strokeStyle = "#0f3168"; x.lineWidth = 3; x.strokeRect(16, 16, w - 32, h - 32);
		T(x, "SALES CONTRACT", w/2, 84, 40, { a:"center", w:300, f:"Tiempos Headline,Times New Roman,serif" });
		T(x, "No. BB-US-001 · signed on 16 November 2026", w/2, 120, 20, { a:"center", c:"#4f5c69" });
		T(x, "Seller: Beffroi Bikes SAS, Lille (France)", 40, 172, 21, { w:700 });
		T(x, "Buyer: Lone Star Cycles LLC, Austin (Texas)", 40, 204, 21, { w:700 });
		let y = 262;
		for(const [k, v] of CONTRACT){
			x.fillStyle = "#e9f7fa"; x.fillRect(32, y - 26, w - 64, 34); T(x, k.toUpperCase(), 44, y - 2, 17, { w:800, c:"#0f3168" });
			x.font = "700 26px Inter,Arial,sans-serif"; x.fillStyle = "#0c2340"; y = wrap(x, v, 44, y + 40, w - 88, 32) + 58;
		}
		T(x, "For the seller", 60, h - 92, 17, { c:"#848487" }); T(x, "For the buyer", w - 60, h - 92, 17, { c:"#848487", a:"right" });
		T(x, "M. Dubois", 60, h - 50, 34, { f:"Times New Roman,serif", c:"#0f3168" }); T(x, "J. Whitaker", w - 60, h - 50, 34, { f:"Times New Roman,serif", c:"#0f3168", a:"right" });
	});
	contractDoc.g.position.set(-4.7, 0, .3); contractDoc.g.rotation.y = .03; G.lc.add(contractDoc.g);
	const LC_TOP = 196, LC_ROW = 96;
	const lcDoc = doc(8.4, 11, (x, w, h, D) => {
		x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
		x.fillStyle = "#16486b"; x.fillRect(0, 0, w, 82); T(x, "Gulf Coast National Bank", 26, 52, 32, { w:800, c:"#fff" }); T(x, "(fictitious) · Houston", w - 26, 52, 19, { a:"right", c:"#cfe0ee" });
		T(x, "IRREVOCABLE DOCUMENTARY CREDIT", 26, 128, 29, { w:800, c:"#0f3168" });
		T(x, "SWIFT MT700 · received Monday 23 November 2026, 08:12", 26, 160, 19, { c:"#848487" });
		LC_ROWS.forEach((r, i) => {
			const y = LC_TOP + i*LC_ROW, k = D.state[r.id];
			x.fillStyle = i % 2 ? "#fffdf8" : "#f4f2ec"; x.fillRect(12, y, w - 24, LC_ROW - 4);
			T(x, r.tag, 24, y + 34, 17, { w:700, c:"#848487" }); T(x, r.k, 112, y + 34, 19, { w:700, c:"#4f5c69" });
			T(x, r.v, 112, y + 76, 29, { w:700 });
			if(D.state["x" + r.id]){ x.save(); x.globalAlpha = .55; T(x, "✓", w - 30, y + 70, 34, { w:800, c:"#1d6b49", a:"right" }); x.restore(); }
			if(k){ x.font = "700 29px Inter,Arial,sans-serif"; const tw = x.measureText(r.v).width; circle(x, 112 + tw/2, y + 66, tw/2 + 22, 30, k); if(k >= 1) T(x, "≠ contract", w - 24, y + 34, 18, { w:800, c:"#c0362c", a:"right" }); }
		});
		T(x, "Fictitious document created for an educational game.", w/2, h - 14, 15, { a:"center", c:"#a4a9ae" });
	}, { thick:.06 });
	lcDoc.g.position.set(3.4, 0, .1); lcDoc.g.rotation.y = -.02; G.lc.add(lcDoc.g);
	const lcHits = LC_ROWS.map((r, i) => ({ hit:spot(lcDoc, 12, LC_TOP + i*LC_ROW, lcDoc.c.width - 24, LC_ROW - 4, r.id), id:r.id }));

	function lc(){
		stage("lc", "Mon · The letter of credit"); only(["lc"]); pen.visible = true; pen.position.copy(penHome);
		for(const r of LC_ROWS){ lcDoc.state[r.id] = 0; lcDoc.state["x" + r.id] = false; } lcDoc.redraw();
		const first = !S.pieces.size && !S.played;
		S.lcFound = 0;
		const narrow = innerWidth < 760;
		look(narrow ? { c:[3.4, .1], w:8.8, d:11.8, tilt:.3 } : { c:[-.5, .2], w:17.6, d:11.4, tilt:.32 });
		say(first ? "Morning! Big news: Lone Star Cycles in Austin ordered <b>120 bikes, $282,000</b>. Their bank just sent the <b>letter of credit</b>. The bank will pay us only if everything matches it… so check it against our contract. <b>Circle every line that doesn't match.</b>"
			: "The letter of credit from Austin. <b>Circle every line that doesn't match the contract</b>: there are three.");
		dockHTML(`<div class="cg-k">${first ? `Mini-game · ${formation.name}` : "Monday · contract law & business English"}</div>${first ? `<span class="cg-lang">🇬🇧 In English, like the Licence</span>` : ""}
			<div class="cg-h">The contract vs the letter of credit</div>
			<p class="cg-hint">🖊️ Tap a line of the credit to circle it in red</p>
			<p class="cg-p cg-mob" aria-label="Signed contract"><b>Contract</b>: 120 bikes × $2,350 = <b data-c="amt">USD 282,000</b> · <b data-c="goods">CIF Houston</b> · ship sails <b data-c="ship">27 Nov</b> · paid 60 days after the B/L.</p>
			<div data-live><p class="cg-p" data-count><b>0 / 3</b> discrepancies circled</p></div>`);
		taps = lcHits;
		let busy = false;
		onTap = id => {
			if(!id || busy) return;
			const r = LC_ROWS.find(x => x.id === id);
			if(lcDoc.state[id] || lcDoc.state["x" + id]) return;
			const i = LC_ROWS.indexOf(r), target = lcDoc.at(560, LC_TOP + i*LC_ROW + 66, .3);
			busy = true;
			fly(pen, target, { h:1.2, dur:300, done:() => {
				if(!r.bad){
					err(); lcDoc.state["x" + id] = true; lcDoc.redraw(); wiggle(pen); say(r.ok + " <b>Look for what differs from the contract.</b>", true);
					busy = false; later(350, () => { if(!busy) fly(pen, penHome, { dur:350 }); });
					return;
				}
				play("good");
				anim(520, k => { lcDoc.state[id] = k; lcDoc.redraw(); pen.position.x = target.x + Math.cos(-2.2 + k*6.8)*1.6; pen.position.z = target.z + Math.sin(-2.2 + k*6.8)*.3; }, () => {
					lcDoc.state[id] = 1; lcDoc.redraw(); busy = false; S.lcFound++;
					say(r.bad);
					const c = dock.querySelector("[data-count]"); if(c) c.innerHTML = `<b>${S.lcFound} / 3</b> discrepancies circled`;
					const hb = dock.querySelector(`[data-c="${id}"]`); if(hb) hb.style.cssText = "background:#fdeceb;color:#c0362c";
					if(S.lcFound === 3) later(700, lcDone);
				});
			} });
		};
		function lcDone(){
			taps = []; onTap = null; fly(pen, penHome, { dur:350 }); play("tampon"); shakeCam();
			ink(lcDoc, "AMENDMENT REQUESTED", "#c0362c", lcDoc.c.width*.6, 140, -.06, 40);
			piece("lc"); play("chime");
			say("Three discrepancies. I'm sending an <b>amendment request</b> to Gulf Coast National Bank right now: <b>USD 282,000, CIF Houston, latest shipment 30 November</b>. Never ship before the credit is right.");
			setLive(`<p class="cg-ok">✓ 3 / 3 · amount, Incoterm, shipment date</p><p class="cg-p">The bank does not read the contract: it only checks that our documents match <b>its</b> credit. A credit that contradicts the contract is a credit that will not pay.</p>${course("law")}${course("eng")}${first ? "" : next("route", "Tuesday: who carries the risk? →")}`);
			dock.scrollTop = dock.scrollHeight;
			if(first) later(2400, () => palier({ id:"cargo", en:true, onEvent, openLead, quit:close,
				titre:"Three traps found in the letter of credit. Without you, the bank would never have paid.",
				texte:"Next: who carries the risk at sea, the dollar to lock in, the US price to set… and the shipping documents to check before Friday's ship.",
				suite:"Close the whole export file (≈ 6 min)" }).then(route));
		}
	}

	/* ================= 2 · mardi : où le risque et les frais changent de mains (CIF) ================= */
	const chart = doc(15, 9.6, (x, w, h, D) => {
		const u = PX, cx = v => (v + 7.5)*u, cz = v => (v + 4.8)*u;
		x.fillStyle = "#d7e7ef"; x.fillRect(0, 0, w, h);
		x.strokeStyle = "rgba(15,49,104,.08)"; x.lineWidth = 2; for(let i = 1; i < 15; i++){ x.beginPath(); x.moveTo(i*u, 0); x.lineTo(i*u, h); x.stroke(); } for(let i = 1; i < 10; i++){ x.beginPath(); x.moveTo(0, i*u); x.lineTo(w, i*u); x.stroke(); }
		const land = pts => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(cx(a), cz(b)) : x.moveTo(cx(a), cz(b))); x.closePath(); x.fillStyle = "#efe7d4"; x.fill(); x.strokeStyle = "#b8a785"; x.lineWidth = 3; x.stroke(); };
		land([[4.2, -4.8], [3.9, -3], [4.5, -2.2], [4.35, -1.3], [3.7, .2], [3.2, 1.6], [3.7, 3.2], [4.4, 4.8], [7.5, 4.8], [7.5, -4.8]]);
		land([[2.3, -4.1], [3.2, -4.3], [3.4, -3.3], [2.9, -2.4], [2.2, -2.7]]);
		land([[-7.5, -4.8], [-4.4, -4.8], [-3.6, -3.2], [-4.1, -1.4], [-3.3, -.2], [-3.9, 1.3], [-4.4, 2.2], [-5.6, 2.9], [-6.2, 4.1], [-5.6, 4.8], [-7.5, 4.8]]);
		T(x, "EUROPE", cx(5.8), cz(3.6), 30, { w:800, c:"#b8a785", a:"center" }); T(x, "NORTH AMERICA", cx(-5.9), cz(-3.6), 26, { w:800, c:"#b8a785", a:"center" });
		T(x, "ATLANTIC OCEAN", cx(-.2), cz(1.4), 30, { w:800, c:"rgba(15,49,104,.35)", a:"center" });
		const path = (pts, dash, col, lw) => { x.save(); x.setLineDash(dash); x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(cx(a), cz(b)) : x.moveTo(cx(a), cz(b))); x.stroke(); x.restore(); };
		path([[6.1, -.3], [5.2, -1.1], [4.45, -1.75]], [10, 8], "#4f5c69", 5);
		path([[4.45, -1.75], [2.1, -2.0], [-.2, -1.7], [-2.6, -.1], [-3.8, 1.9], [-4.9, 2.55]], [18, 10], "#0f3168", 6);
		path([[-4.9, 2.55], [-5.8, 1.7], [-6.5, .9]], [10, 8], "#4f5c69", 5);
		for(const s of Object.values(STOPS)){ x.fillStyle = "#fff"; x.beginPath(); x.arc(cx(s.x), cz(s.z), 20, 0, 7); x.fill(); x.lineWidth = 5; x.strokeStyle = "#0f3168"; x.stroke(); }
		x.fillStyle = "rgba(255,253,248,.9)"; x.fillRect(18, h - 92, 560, 74); x.strokeStyle = "#0f3168"; x.lineWidth = 2; x.strokeRect(18, h - 92, 560, 74);
		T(x, "Shipping route · order BB-US-001", 34, h - 58, 24, { w:800, c:"#0f3168" }); T(x, "Incoterms® 2020: CIF Houston", 34, h - 28, 22, { c:"#4f5c69" });
	});
	chart.g.position.set(0, 0, .2); G.route.add(chart.g);
	const stopPos = id => chart.at((STOPS[id].x + 7.5)*PX, (STOPS[id].z + 4.8)*PX, .1);
	const stopLabels = {};
	for(const [id, s] of Object.entries(STOPS)){ const l = label(s.n, { size:.5, bg:"#fffdf8", fg:"#0f3168" }); l.position.copy(stopPos(id)).add(new THREE.Vector3(0, 1.9, id === "antwerp" ? -.9 : id === "lille" ? .6 : .2)); G.route.add(l); stopLabels[id] = l; }
	// les maquettes : l'entrepôt, les grues, le magasin, et le porte-conteneurs
	{
		const at = id => stopPos(id);
		const wh = box(1.2, .7, .9, "#c9cdd2", 0, 0, 0); wh.position.copy(at("lille")).add(new THREE.Vector3(.6, .05 + .35, .6)); G.route.add(wh);
		for(const id of ["antwerp", "houston"]){ const c = new THREE.Group(); c.position.copy(at(id)).add(new THREE.Vector3(id === "antwerp" ? .55 : -.6, .05, id === "antwerp" ? .55 : .5)); c.add(box(.12, 1.6, .12, "#d9a441", 0, 0, 0), box(1.2, .12, .12, "#d9a441", -.35, 1.5, 0)); G.route.add(c); }
		const shop = new THREE.Group(); shop.position.copy(at("austin")).add(new THREE.Vector3(-.5, .05, .6)); shop.add(box(1, .6, .7, "#e8e2d4", 0, 0, 0), box(1.1, .08, .3, "#c0362c", 0, .55, .38)); G.route.add(shop);
	}
	const seaCurve = new THREE.CatmullRomCurve3([[4.45, -1.75], [2.1, -2.0], [-.2, -1.7], [-2.6, -.1], [-3.8, 1.9], [-4.9, 2.55]].map(([a, b]) => chart.at((a + 7.5)*PX, (b + 4.8)*PX, .12)));
	const ship = new THREE.Group(); G.route.add(ship);
	{
		ship.add(box(1.3, .3, .42, "#c0362c", 0, 0, 0), box(1.3, .05, .42, "#2a2f38", 0, .3, 0));
		["#1f6fb2", "#d9a441", "#2f6b45", "#8a2b4e", "#1f6fb2", "#d9a441"].forEach((c, i) => ship.add(box(.3, .18, .16, c, -.35 + (i % 3)*.3, .35 + Math.floor(i/3)*.18, i % 2 ? .1 : -.1)));
		ship.add(box(.22, .4, .36, "#e8edf2", .5, .3, 0));
	}
	function placeShip(k){ const p = seaCurve.getPointAt(k), q = seaCurve.getPointAt(Math.min(1, k + .01)); ship.position.copy(p); ship.lookAt(q.x, p.y, q.z); ship.rotateY(-Math.PI/2); }
	// les deux drapeaux
	function flag(col, text){
		const g = new THREE.Group();
		g.add(mesh(new THREE.CylinderGeometry(.42, .5, .16, 20), "#22262e", 0, .08, 0), mesh(new THREE.CylinderGeometry(.05, .05, 2.2, 8), "#5f656d", 0, 1.2, 0));
		const f = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.25, 0), new THREE.Vector3(1.1, 1.95, 0), new THREE.Vector3(0, 1.6, 0)]), new THREE.MeshStandardMaterial({ color:col, side:THREE.DoubleSide })); f.geometry.computeVertexNormals(); f.castShadow = true; g.add(f);
		const l = label(text, { size:.42, bg:col }); l.position.y = 2.75; g.add(l);
		const hit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 1.8), hidden); hit.position.y = 1.3; g.add(hit);
		g.userData.hit = hit; return g;
	}
	const flags = { risk:flag("#c0362c", "⚠ RISK → buyer"), cost:flag("#0f3168", "€ OUR COSTS") };
	const flagHome = { risk:new THREE.Vector3(9, 0, -2.2), cost:new THREE.Vector3(9, 0, 1.6) };
	for(const k in flags) G.route.add(flags[k]);

	function route(){
		stage("route", "Tue · Who carries the risk"); only(["route"]);
		for(const k in flags){ flags[k].position.copy(flagHome[k]); flags[k].rotation.y = 0; }
		placeShip(0);
		look(innerWidth < 760 ? { c:[.9, .2], w:18.6, d:10.4, tilt:.42 } : { c:[1.2, .4], w:21, d:11.6, tilt:.45 });
		say("The amendment came back: <b>CIF Houston</b>, at last. Before the forwarder books the container: <b>where does the risk pass to Jolene, and where do our costs stop?</b> Plant both flags on the route.");
		dockHTML(`<div class="cg-k">Tuesday · international economics & trade</div><div class="cg-h">CIF Houston: who pays, who risks?</div>
			<p class="cg-hint">✋ Drag each flag to a stop on the route</p>
			<p class="cg-p"><b>C</b>ost, <b>I</b>nsurance and <b>F</b>reight: under Incoterms® 2020, the costs and the risk don't pass at the same place. Read the route: our warehouse, the quay at Antwerp, the ocean, the port of Houston, Jolene's shop.</p>
			<div data-live></div>`);
		const placed = {};
		drags = Object.keys(flags).map(k => ({ id:k, g:flags[k], hit:flags[k].userData.hit, home:flagHome[k], lift:.6 }));
		zones = Object.keys(STOPS).map(id => ({ id, pos:() => stopPos(id) }));
		onDrop = (d, z) => {
			const good = d.id === "risk" ? z === "antwerp" : z === "houston";
			const to = stopPos(z).add(new THREE.Vector3(d.id === "risk" ? -.35 : .35, -.1, d.id === "risk" ? .25 : -.25));
			if(!good){
				err(); fly(d.g, to, { h:.3, dur:200, done:() => { wiggle(d.g); later(420, () => fly(d.g, d.home, { h:.6, dur:380 })); } });
				say(FLAG_HELP[d.id][z], true); return;
			}
			play("good"); fly(d.g, to, { h:.3, dur:240 });
			placed[d.id] = true; drags = drags.filter(x => x.id !== d.id);
			say(d.id === "risk" ? "Yes: <b>the risk passes once the bikes are on board in Antwerp.</b> From then on, a storm is Jolene's problem…" : "Yes: <b>we pay the freight to the port of Houston.</b> Then the truck to Austin and US duties are hers.");
			append(`<p class="cg-ok">✓ ${d.id === "risk" ? "Risk → on board, Antwerp" : "Our costs → port of Houston"}</p>`);
			if(placed.risk && placed.cost) later(900, routeDone);
		};
		function routeDone(){
			play("swipe"); say("Watch the crossing: the ship carries <b>Jolene's risk</b>… on <b>our</b> freight. So who insures it?");
			anim(4200, k => placeShip(k), () => {
				play("chime"); piece("route");
				say("That's why CIF makes <b>us</b> buy the insurance, for Jolene: at least <b>110 % of the price</b>. If a storm hits mid-Atlantic, her loss is covered. I've ordered the certificate: <b>USD 310,200</b>.");
				append(`<p class="cg-p">Two points under CIF: the <b>risk</b> passes on board at Antwerp, the <b>costs</b> run to Houston. In between, the buyer carries a risk we pay to transport: hence the insurance we take out for her, <b>110 % × $282,000 = $310,200</b>.</p>${course("trade")}${next("fx", "Wednesday: the dollar →")}`);
			});
		}
	}

	/* ================= 3 · mercredi : vendre ses dollars à terme, sur l'écran du cambiste ================= */
	const FXW = 11, FXH = 7.2;
	const fxState = { t0:0, hist:[], rate:1.166, done:false, last:0 };
	const fxDoc = doc(FXW, FXH, (x, w, h, D) => {
		const s = fxState;
		x.fillStyle = "#0f1d2e"; x.fillRect(0, 0, w, h);
		x.fillStyle = "#16486b"; x.fillRect(0, 0, w, 70); T(x, "Banque des Flandres · FX forward desk", 26, 46, 28, { w:800, c:"#fff" }); T(x, "(fictitious)", w - 26, 46, 19, { c:"#cfe0ee", a:"right" });
		T(x, "EUR/USD · 60-day forward · 1 € =", 30, 116, 24, { w:700, c:"#9fb4c8" });
		const above = s.rate > BUDGET;
		T(x, "$" + s.rate.toFixed(4), 30, 182, 64, { w:300, c:above ? "#ff8a7a" : "#7fe3b0" });
		T(x, "Your break-even: $" + BUDGET.toFixed(4), w - 30, 116, 22, { w:700, c:"#ffb347", a:"right" });
		// la courbe
		const X0 = 30, X1 = w - 30, Y0 = 212, Y1 = 452, lo = 1.150, hi = 1.195, yy = r => Y1 - (r - lo)/(hi - lo)*(Y1 - Y0);
		x.fillStyle = "#081525"; x.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
		x.fillStyle = "rgba(255,138,122,.1)"; x.fillRect(X0, Y0, X1 - X0, yy(BUDGET) - Y0);
		x.strokeStyle = "#ffb347"; x.setLineDash([10, 8]); x.lineWidth = 2; x.beginPath(); x.moveTo(X0, yy(BUDGET)); x.lineTo(X1, yy(BUDGET)); x.stroke(); x.setLineDash([]);
		T(x, "above: less than €240,000", X1 - 10, yy(BUDGET) - 10, 18, { c:"#ffb347", a:"right", w:700 });
		x.strokeStyle = above ? "#ff8a7a" : "#7fe3b0"; x.lineWidth = 4; x.beginPath();
		s.hist.forEach((r, i) => { const X = X0 + i/240*(X1 - X0), Y = yy(Math.max(lo, Math.min(hi, r))); i ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
		// les deux ordres
		const btn = (bx, t1, t2, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(bx, 492, 500, 190, 16); x.fill(); T(x, t1, bx + 250, 566, 36, { w:800, c:"#fff", a:"center" }); T(x, t2, bx + 250, 620, 24, { w:700, c:"rgba(255,255,255,.85)", a:"center" }); T(x, "60-day forward", bx + 250, 656, 19, { c:"rgba(255,255,255,.65)", a:"center" }); };
		btn(30, "SELL USD 282,000", `you receive ≈ ${eur(TOTAL/s.rate)}`, "#1d6b49");
		btn(w - 530, "BUY USD 282,000", `you pay ≈ ${eur(TOTAL/s.rate)}`, "#8a2b4e");
		if(s.done){ x.fillStyle = "rgba(15,29,46,.6)"; x.fillRect(0, 70, w, h - 70); }
	}, { thick:.2, body:"#2b2f36" });
	fxDoc.g.position.set(0, 0, .4); G.fx.add(fxDoc.g);
	const fxHits = [{ id:"sell", hit:spot(fxDoc, 30, 492, 500, 190, "sell") }, { id:"buy", hit:spot(fxDoc, FXW*PX - 530, 492, 500, 190, "buy") }];
	// le costing, posé à côté
	const costDoc = doc(4.6, 6, (x, w, h) => {
		x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h); x.fillStyle = "#0f3168"; x.fillRect(0, 0, w, 56); T(x, "COSTING · BB-US-001", 20, 38, 22, { w:800, c:"#fff" });
		const rows = [["Bikes (ex-works)", "€204,000"], ["Truck to Antwerp", "€3,000"], ["Freight to Houston", "€8,500"], ["Insurance 110 %", "€1,500"], ["Our margin", "€23,000"]];
		rows.forEach(([a, b], i) => { T(x, a, 20, 110 + i*52, 21); T(x, b, w - 20, 110 + i*52, 22, { w:700, a:"right" }); });
		x.fillStyle = "#0c2340"; x.fillRect(20, 368, w - 40, 3);
		T(x, "We need", 20, 414, 24, { w:800 }); T(x, "€240,000", w - 20, 414, 28, { w:800, a:"right", c:"#c0362c" });
		T(x, "Jolene pays", 20, 470, 22); T(x, "USD 282,000", w - 20, 470, 24, { w:800, a:"right" });
		T(x, "in 60 days", 20, 504, 20, { c:"#848487" });
	});
	costDoc.g.position.set(-8.1, 0, .4); costDoc.g.rotation.y = .06; G.fx.add(costDoc.g);
	const fxPath = t => t < 7 ? 1.1655 + .0035*Math.sin(t*.9) : t < 15 ? 1.1655 + .022*((t - 7)/8) : 1.1875 - .0155*Math.min(1, (t - 15)/8) + .0055*Math.sin((t - 15)*.7);

	function fx(){
		stage("fx", "Wed · The dollar"); only(["fx"]);
		Object.assign(fxState, { t0:performance.now(), hist:[], rate:1.1655, done:false, last:0 }); fxDoc.redraw();
		look(innerWidth < 760 ? { c:[0, .4], w:11.6, d:7.8, tilt:.28 } : { c:[-1.7, .4], w:19.6, d:8, tilt:.3 });
		say("Jolene's bank will pay <b>USD 282,000 in 60 days</b>, but our costs are in euros: we need <b>€240,000</b>. If the euro climbs, every dollar buys fewer euros. The bank quotes a <b>forward rate</b> live: <b>place the right order while we're still above €240,000</b>.");
		dockHTML(`<div class="cg-k">Wednesday · international finance</div><div class="cg-h">Lock in the dollar</div>
			<p class="cg-hint">👆 Tap the right order on the bank's screen, at the right moment</p>
			<div class="cg-row"><div class="cg-big"><small>1 € =</small><span data-r>$1.1655</span></div><div class="cg-big"><small>we'd receive</small><span data-e>€241,956</span></div><div class="cg-big"><small>we need</small>€240,000</div></div>
			<div data-live></div>`);
		let news = false;
		tick = now => {
			if(fxState.done) return;
			const t = (now - fxState.t0)/1000;
			fxState.rate = fxPath(t) + Math.sin(t*6.1)*.0007 + Math.sin(t*2.3)*.0011;
			if(now - fxState.last > 90){
				fxState.last = now; fxState.hist.push(fxState.rate); if(fxState.hist.length > 240) fxState.hist.shift(); fxDoc.redraw();
				const r = dock.querySelector("[data-r]"), e = dock.querySelector("[data-e]");
				if(r){ r.textContent = "$" + fxState.rate.toFixed(4); e.textContent = eur(TOTAL/fxState.rate); e.className = fxState.rate > BUDGET ? "r" : "g"; }
			}
			if(t > 7 && !news){ news = true; play("alarm"); say("⚠ Breaking: <b>the ECB hints at a rate rise</b>, and the euro is climbing. Every cent up costs us about €2,000…", true); }
		};
		taps = fxHits;
		onTap = id => {
			if(!id || fxState.done) return;
			if(id === "buy"){ err(); say("Buy dollars? We're going to <b>receive</b> dollars from Jolene. Buying more would double our exposure: an exporter <b>sells</b> its future dollars.", true); return; }
			const r = fxState.rate;
			if(r > BUDGET){ err(); say(`At $${r.toFixed(4)}, our $282,000 make only <b>${eur(TOTAL/r)}</b>: below our €240,000. The right order, the wrong moment. Watch the curve.`, true); return; }
			fxState.done = true; S.rate = r; tick = null; fxDoc.redraw();
			play("tampon"); shakeCam(); ink(fxDoc, "DEAL CONFIRMED", "#7fe3b0", FXW*PX/2, 330, -.05, 52); piece("fx");
			const e = TOTAL/r;
			say(`Done: <b>$282,000 sold forward at $${r.toFixed(4)}</b>. Whatever the euro does now, we'll receive <b>${eur(e)}</b> in January.`);
			setLive(`<p class="cg-ok">✓ Forward contract: USD 282,000 at ${r.toFixed(4)} → ${eur(e)}</p><p class="cg-p">A <b>forward contract</b> fixes today the rate of a future exchange. The exporter <b>sells</b> the dollars it will receive: the euro can rise, our ${eur(e)} won't move.</p>${course("fin")}${next("price", "Thursday: the US price →")}`);
			dock.scrollTop = dock.scrollHeight;
		};
	}

	/* ================= 4 · jeudi : le prix conseillé, sur le rayon d'Austin ================= */
	{
		const g = G.shop;
		g.add(box(16, .3, 4.4, "#e8e2d4", 0, 0, -3.2));
		const sign = doc(16, 2.6, (x, w, h) => { x.fillStyle = "#0c2340"; x.fillRect(0, 0, w, h); T(x, "LONE STAR CYCLES", w/2, 130, 84, { w:300, f:"Tiempos Headline,Times New Roman,serif", c:"#fff", a:"center" }); T(x, "E-BIKES · AUSTIN, TEXAS", w/2, 200, 34, { w:700, c:"#d9a441", a:"center" }); });
		sign.g.rotation.x = Math.PI/2; sign.g.position.set(0, 3.4, -5.45); g.add(sign.g);
		for(const r of RIVALS){
			const x0 = priceX(r.p), b = miniBike(r.c, 1.6); b.position.set(x0, .3, -3.6); g.add(b);
			const tag = doc(2.7, 1.6, (x, w, h) => { x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h); x.fillStyle = r.c; x.fillRect(0, 0, w, 12); T(x, r.n, w/2, 52, 22, { w:800, a:"center" }); T(x, usd(r.p), w/2, 104, 38, { w:800, a:"center", c:"#0c2340" }); T(x, r.r, w/2, 142, 19, { a:"center", c:"#4f5c69" }); });
			tag.g.rotation.x = .9; tag.g.position.set(x0, .9, -1.4); g.add(tag.g);
		}
	}
	const rail = doc(16, 1.9, (x, w, h, D) => {
		x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h);
		const px = p => (priceX(p) + 8)*PX;
		if(D.state.band){ x.fillStyle = "rgba(29,107,73,.16)"; x.fillRect(px(FLOOR), 0, px(LEADER) - px(FLOOR), h); }
		x.fillStyle = "#0c2340"; x.fillRect(px(1000), 60, px(6000) - px(1000), 4);
		for(let p = 1000; p <= 6000; p += 500){ x.fillRect(px(p) - 1.5, p % 1000 ? 50 : 40, 3, p % 1000 ? 24 : 34); if(!(p % 1000)) T(x, usd(p), px(p), 118, 24, { w:700, a:"center" }); }
		for(const r of RIVALS){ x.fillStyle = r.c; x.beginPath(); x.moveTo(px(r.p), 58); x.lineTo(px(r.p) - 10, 34); x.lineTo(px(r.p) + 10, 34); x.fill(); }
		T(x, "Recommended retail price (MSRP), in US dollars", 20, h - 18, 19, { c:"#848487" });
	});
	rail.g.position.set(0, 0, 1.7); G.shop.add(rail.g);
	const myTag = new THREE.Group(); G.shop.add(myTag);
	let tagPrice = 2999;
	const tagDoc = doc(2.9, 1.9, (x, w, h, D) => {
		x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, h); x.fillStyle = "#21b7cb"; x.fillRect(0, 0, w, 14);
		T(x, "Beffroi Urban E7", w/2, 54, 22, { w:800, a:"center" }); T(x, usd(tagPrice), w/2, 112, 44, { w:800, a:"center", c:"#0f3168" }); T(x, "120 km · made in Lille", w/2, 154, 19, { a:"center", c:"#4f5c69" });
		x.strokeStyle = "#21b7cb"; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
	}, { thick:.12 });
	myTag.add(tagDoc.g); tagDoc.g.position.z = 1.55;
	const myBike = miniBike("#21b7cb", 1.4); myBike.position.set(0, 0, .15); myTag.add(myBike);
	const tagHit = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 5.6), hidden); tagHit.position.set(0, .6, .4); myTag.add(tagHit);
	const snapPrice = x => Math.max(1099, Math.min(5999, Math.round(xPrice(x)/100)*100 - 1));

	function price(){
		stage("price", "Thu · The US price"); only(["shop"]);
		tagPrice = 2999; myTag.position.set(priceX(tagPrice), 0, 0); tagDoc.redraw(); rail.state.band = false; rail.redraw();
		look(innerWidth < 760 ? { c:[0, -1.2], w:16.6, d:10.4, tilt:.55, y:.8 } : { c:[0, -1.4], w:17.6, d:10.4, tilt:.6, y:1 });
		say("Jolene needs our <b>recommended retail price</b> for the US launch. Her shop: <b>Lone Star keeps at least 30 %</b> of the shelf price, and each bike costs her <b>$2,600</b> landed in Austin. <b>Slide our price tag</b> to the right price, and let go.");
		dockHTML(`<div class="cg-k">Thursday · international marketing</div><div class="cg-h">Where does our bike sit on her shelf?</div>
			<p class="cg-hint">✋ Slide the blue price tag along the rail, then let go</p>
			<div class="cg-row"><div class="cg-big"><small>MSRP</small><span data-p>$2,999</span></div><div class="cg-big"><small>Lone Star's margin</small><span data-m></span></div></div>
			<div data-live></div>`);
		const upd = () => {
			const m = (tagPrice - LANDED)/tagPrice, el = dock.querySelector("[data-m]");
			dock.querySelector("[data-p]").textContent = usd(tagPrice);
			if(el){ el.textContent = `${Math.round(m*100)} % · ${usd(tagPrice - LANDED)}`; el.className = m >= .3 ? "g" : "r"; }
		};
		upd();
		let done = false;
		drags = [{ id:"tag", g:myTag, hit:tagHit, axis:"x", min:priceX(1099), max:priceX(5999), lift:.12, free:true }];
		onMove = d => { const p = snapPrice(d.g.position.x); if(p !== tagPrice){ tagPrice = p; tagDoc.redraw(); upd(); play("clic"); } };
		onDrop = d => {
			if(done) return;
			d.g.position.x = priceX(tagPrice); d.g.position.y = 0;
			if(tagPrice < FLOOR){ err(); say(`At ${usd(tagPrice)}, Lone Star keeps only <b>${Math.round((tagPrice - LANDED)/tagPrice*100)} %</b>. Below its 30 %, Jolene won't push our bike: the shop needs its margin too.`, true); return; }
			if(tagPrice >= LEADER){ err(); say(`${usd(tagPrice)}: dearer than the Velo Nord Premium, which goes further. Texan shoppers would walk straight past us.`, true); return; }
			done = true; drags = []; S.msrp = tagPrice; play("good"); piece("price"); rail.state.band = true; rail.redraw();
			say(`<b>${usd(tagPrice)}</b>: Jolene loves it. Premium, but below the leader: <b>120 km of range and “made in France”</b> justify it.${tagPrice === 3999 ? " And $3,999 is a classic psychological price." : ""}`);
			setLive(`<p class="cg-ok">✓ MSRP ${usd(tagPrice)} · Lone Star keeps ${Math.round((tagPrice - LANDED)/tagPrice*100)} %</p><p class="cg-p"><b>Floor</b>: $2,600 ÷ 0.7 = <b>${usd(FLOOR)}</b>, or the distributor won't sell us. <b>Ceiling</b>: the leader at ${usd(LEADER)}, which goes further. In between, a <b>premium</b> position the product can justify (green zone).</p>${course("mkt")}${next("docs", "Friday: the documents →")}`);
			dock.scrollTop = dock.scrollHeight;
		};
	}

	/* ================= 5 · vendredi : les documents contre le crédit, au crayon ================= */
	const DW = 6.3, DH = 7.6;
	const head = (x, w, col, t, sub) => { x.fillStyle = "#fffdf8"; x.fillRect(0, 0, w, x.canvas.height); x.fillStyle = col; x.fillRect(0, 0, w, 64); T(x, t, 22, 42, 25, { w:800, c:"#fff" }); if(sub) T(x, sub, 22, 98, 19, { c:"#848487" }); };
	const field = (x, D, id, bx, by, bw, bh, k, v, o = {}) => {
		const st = D.state[id];
		x.fillStyle = st === "bad" ? "#fdeceb" : st === "ok" ? "#e3f2e9" : "#f3f6f8"; x.fillRect(bx, by, bw, bh);
		x.strokeStyle = st === "bad" ? "#c0362c" : st === "ok" ? "#1d6b49" : "#9fb0bf"; x.lineWidth = 3; x.strokeRect(bx, by, bw, bh);
		T(x, k, bx + 14, by + 30, 17, { w:800, c:"#4f5c69" }); T(x, v, bx + 14, by + bh - 20, o.fs || 30, { w:800, c:o.c || "#0c2340" });
		if(st === "bad"){ x.font = `800 ${o.fs || 30}px Inter,Arial,sans-serif`; const tw = x.measureText(v).width; circle(x, bx + 14 + tw/2, by + bh - 30, tw/2 + 18, 28, 1); }
	};
	const reqDoc = doc(DW, DH, (x, w, h, D) => {
		head(x, w, "#16486b", "AMENDED CREDIT GCNB-26-4471", "Documents required · Gulf Coast National Bank");
		REQS.forEach((r, i) => {
			const y = 140 + i*150, st = D.state[r.id];
			x.fillStyle = st === "ok" ? "#e3f2e9" : st === "bad" ? "#fdeceb" : st === "sel" ? "#fff0bf" : "#f4f2ec"; x.fillRect(16, y, w - 32, 132);
			T(x, `${i + 1}.`, 30, y + 46, 26, { w:800, c:"#0f3168" });
			x.font = "700 25px Inter,Arial,sans-serif"; x.fillStyle = "#0c2340"; wrap(x, r.t, 70, y + 46, w - 150, 32);
			x.fillStyle = st === "ok" ? "#1d6b49" : "#0f3168"; x.beginPath(); x.arc(w - 46, y + 66, 18, 0, 7); x.fill();
			if(st === "ok") T(x, "✓", w - 46, y + 76, 24, { w:800, c:"#fff", a:"center" });
		});
	});
	const invDoc = doc(DW, DH, (x, w, h, D) => {
		head(x, w, "#0f3168", "COMMERCIAL INVOICE", "No. BB-26-118 · Beffroi Bikes SAS, Lille");
		T(x, "Buyer: Lone Star Cycles LLC, Austin", 22, 150, 21, { w:700 });
		T(x, "120 × e-bike Urban E7 @ USD 2,350.00", 22, 196, 21);
		T(x, "Incoterms® 2020: CIF Houston", 22, 232, 21);
		field(x, D, "inv_date", 22, 290, w - 44, 120, "INVOICE DATE", "27 November 2026", { fs:28 });
		field(x, D, "inv_total", 22, 460, w - 44, 150, "TOTAL AMOUNT", "USD 282,000.00", { fs:40 });
		T(x, "M. Dubois", w - 30, h - 40, 32, { f:"Times New Roman,serif", c:"#0f3168", a:"right" });
	});
	const blDoc = doc(DW, DH, (x, w, h, D) => {
		head(x, w, "#5d6b7a", "BILL OF LADING · original", "No. SSL-ANR-55821 · Scheldt Star Line (fictitious)");
		T(x, "Consignee: to the order of Gulf Coast Nat. Bank", 22, 146, 19, { w:700 });
		T(x, "MV Scheldt Star · Antwerp → Houston", 22, 180, 19);
		T(x, "1 × 40' container · 120 cartons · e-bikes", 22, 214, 19);
		field(x, D, "bl_date", 22, 260, w - 44, 130, "SHIPPED ON BOARD", "27 NOV 2026", { fs:36 });
		field(x, D, "bl_freight", 22, 430, w - 44, 150, "FREIGHT", S.reissued ? "FREIGHT PREPAID" : "FREIGHT COLLECT", { fs:40, c:S.reissued ? "#1d6b49" : "#0c2340" });
		T(x, "Signed for the carrier, Antwerp", 22, h - 34, 18, { c:"#848487" });
		if(S.reissued){ x.save(); x.globalAlpha = .8; T(x, "REISSUED", w - 30, h - 34, 22, { w:800, c:"#c0362c", a:"right" }); x.restore(); }
	});
	const insDoc = doc(DW, DH, (x, w, h, D) => {
		head(x, w, "#2f6b45", "INSURANCE CERTIFICATE", "No. FL-7731 · Flandres Assurances (fictitious)");
		T(x, "Voyage: Antwerp → Houston, MV Scheldt Star", 22, 150, 19);
		T(x, "Cover: Institute Cargo Clauses (A)", 22, 184, 19);
		field(x, D, "ins_who", 22, 240, w - 44, 130, "ASSURED", "Beffroi Bikes SAS", { fs:30 });
		field(x, D, "ins_sum", 22, 420, w - 44, 150, "SUM INSURED (110 %)", "USD 310,200.00", { fs:38 });
	});
	const FIELDS = {
		inv_total:[invDoc, 22, 460, DW*PX - 44, 150], inv_date:[invDoc, 22, 290, DW*PX - 44, 120],
		bl_date:[blDoc, 22, 260, DW*PX - 44, 130], bl_freight:[blDoc, 22, 430, DW*PX - 44, 150],
		ins_who:[insDoc, 22, 240, DW*PX - 44, 130], ins_sum:[insDoc, 22, 420, DW*PX - 44, 150]
	};
	for(const D of [reqDoc, invDoc, blDoc, insDoc]) G.docs.add(D.g);
	const fieldHits = {};
	for(const [id, [D, bx, by, bw, bh]] of Object.entries(FIELDS)) fieldHits[id] = spot(D, bx, by, bw, bh, id);
	const reqHits = REQS.map((r, i) => spot(reqDoc, 16, 140 + i*150, DW*PX - 32, 132, r.id));
	const fieldPos = id => { const [D, bx, by, bw, bh] = FIELDS[id]; return D.at(bx + 12, by + bh/2, .1); };

	function docs(){
		stage("docs", "Fri · The documents"); only(["docs"]);
		S.reissued = false;
		for(const D of [reqDoc, invDoc, blDoc, insDoc]){ D.state = {}; D.redraw(); D.g.visible = true; }
		const narrow = innerWidth < 760 || innerWidth/innerHeight < 1.05;
		const P = narrow ? [[-3.4, -4.1], [3.4, -4.1], [-3.4, 4.1], [3.4, 4.1]] : [[-10.2, 0], [-3.4, 0], [3.4, 0], [10.2, 0]];
		[reqDoc, invDoc, blDoc, insDoc].forEach((D, i) => { D.g.position.set(P[i][0], 0, P[i][1]); D.g.rotation.y = (i % 2 ? -.015 : .015); });
		look(narrow ? { c:[0, 0], w:14.2, d:16.4, tilt:.2 } : { c:[0, 0], w:28.6, d:8.2, tilt:.25 });
		say("Ship's gone… almost: it sails at 17:00. The forwarder sent the documents. The bank will pay <b>only if each one proves what the credit demands</b>. Draw a pencil line from each requirement to its proof. If a document says something else: <b>tap the faulty box</b> to flag it.");
		dockHTML(`<div class="cg-k">Friday · trade operations & documentary credit</div><div class="cg-h">Will the bank pay?</div>
			<p class="cg-hint">✏️ Drag from a requirement to the box that proves it · tap a box that's wrong</p>
			<div data-live><p class="cg-p" data-count><b>0 / 4</b> requirements proven</p></div>`);
		const okSet = new Set();
		const reqAnchor = r => { const i = REQS.findIndex(x => x.id === r); return reqDoc.at(DW*PX - 46, 140 + i*150 + 66, .12); };
		const setDrags = () => { drags = REQS.filter(r => !okSet.has(r.id)).map((r, i) => ({ id:r.id, hit:reqHits[REQS.indexOf(r)], line:{ from:() => reqAnchor(r.id), col:"#4a4a52" }, lift:.12, strict:true, onSel:on => { reqDoc.state[r.id] = on ? "sel" : reqDoc.state[r.id] === "sel" ? undefined : reqDoc.state[r.id]; reqDoc.redraw(); } })); };
		setDrags();
		zones = Object.keys(FIELDS).map(id => ({ id, hit:fieldHits[id], pos:() => fieldPos(id) }));
		taps = Object.keys(FIELDS).map(id => ({ id, hit:fieldHits[id] }));
		const count = () => { const c = dock.querySelector("[data-count]"); if(c) c.innerHTML = `<b>${okSet.size} / 4</b> requirements proven`; };
		const docOf = id => FIELDS[id][0];
		let flagged = false;
		function flagFreight(byLink){
			if(flagged) return; flagged = true;
			blDoc.state.bl_freight = "bad"; blDoc.redraw(); reqDoc.state.r_frt = "bad"; reqDoc.redraw(); play(byLink ? "alarm" : "good");
			if(byLink){ const m = link(reqAnchor("r_frt"), fieldPos("bl_freight"), "#c0362c"); m.userData.red = true; }
			say(`<b>FREIGHT COLLECT!</b> Under CIF we <b>paid</b> the freight: the credit demands “freight prepaid”. With this B/L, the bank would refuse to pay: it's a <b>discrepancy</b>. Call the forwarder, fast, before the ship sails.`, true);
			append(`<p class="cg-p" style="margin-top:6px">⚠ <b>Discrepancy</b>: the bill of lading says FREIGHT COLLECT, the credit demands FREIGHT PREPAID.</p><button class="cg-go" data-call>📞 Ask the forwarder to reissue the bill of lading</button>`);
			dock.querySelector("[data-call]").onclick = reissue;
		}
		function reissue(){
			const b = dock.querySelector("[data-call]"); if(b) b.disabled = true; play("pop");
			say("Antwerp, 15:20: “Our mistake, sorry! New original coming over, <b>freight prepaid</b>.”");
			const home = blDoc.g.position.clone();
			fly(blDoc.g, home.clone().add(new THREE.Vector3(0, 0, -14)), { h:2, dur:450, done:() => {
				S.reissued = true; blDoc.state.bl_freight = undefined; reqDoc.state.r_frt = undefined; blDoc.redraw(); reqDoc.redraw();
				links.children.filter(m => m.userData.red).forEach(m => links.remove(m));
				blDoc.g.position.copy(home).add(new THREE.Vector3(0, 0, -14)); fly(blDoc.g, home, { h:2, dur:500, done:() => { play("tampon"); shakeCam(); if(b) b.outerHTML = `<p class="cg-ok">✓ New bill of lading: FREIGHT PREPAID. Link requirement 3 again.</p>`; } });
			} });
		}
		onTap = id => {
			if(!id) return;
			if(id === "bl_freight" && !S.reissued){ flagFreight(false); return; }
			if(okSet.size < 4) say("This box is fine. <b>Drag from a requirement</b> (on the credit) to the box that proves it.");
		};
		onDrop = (d, z) => {
			const r = REQS.find(x => x.id === d.id);
			if(d.id === "r_frt" && z === "bl_freight" && !S.reissued){
				if(!flagged){ err(); flagFreight(true); }
				return;
			}
			if(z !== r.f){ err(); say(`That box doesn't prove “${r.t}”. ${docOf(z) === docOf(r.f) ? "Right document, wrong box." : "Look on another document."}`, true); return; }
			if(d.id === "r_frt" && !S.reissued) return;
			okSet.add(d.id); link(reqAnchor(d.id), fieldPos(z), "#1d6b49"); play("good");
			reqDoc.state[d.id] = "ok"; reqDoc.redraw(); docOf(z).state[z] = "ok"; docOf(z).redraw();
			setDrags(); count();
			if(okSet.size === 4){
				drags = []; taps = []; onTap = null; play("chime"); piece("docs");
				say("Every requirement proven, every document compliant. <b>Off to the bank</b>, before 17:00!");
				append(`<p class="cg-ok">✓ 4 / 4 · invoice, shipment date, freight prepaid, insurance 110 %</p><p class="cg-p">That's <b>strict compliance</b>: the bank checks the documents, not the bikes. One wrong word, and $282,000 wait… or never come.</p>${course("docs")}${next("end", "Present the documents to the bank →")}`);
			}
		};
	}

	/* ================= le bilan : la banque paie ================= */
	function end(){
		stage("end", "Report"); only(["route"]); pen.visible = false;
		for(const k in flags){ flags[k].position.copy(stopPos(k === "risk" ? "antwerp" : "houston")).add(new THREE.Vector3(k === "risk" ? -.35 : .35, -.1, k === "risk" ? .25 : -.25)); }
		placeShip(0); anim(9000, k => placeShip(k*.92));
		look(innerWidth < 760 ? { c:[.9, .2], w:18.6, d:10.4, tilt:.42 } : { c:[1.2, .4], w:21, d:11.6, tilt:.45 });
		const e = S.errors, mention = e <= 2 ? "Très bien" : e <= 6 ? "Bien" : "Assez bien";
		ev("win", mention); play("win");
		const rate = S.rate || 1.17, eurs = TOTAL/rate;
		const order = ["law", "eng", "trade", "fin", "mkt", "docs", "abroad"]; course("abroad");
		say(`Banque des Flandres, 16:45: <b>“Documents compliant.”</b> Payment of <b>$282,000</b> on 26 January. The MV Scheldt Star is at sea, and the file is closed. Brilliant week!`);
		dockHTML(`<div class="cg-k">${formation.name} · export file closed</div><div class="cg-h">We'll be paid: ${eur(eurs)}</div>
			<span class="cg-done">DOCUMENTS COMPLIANT</span>
			<p class="cg-p">Mission accomplished, grade: <b>${{ "Très bien":"excellent", "Bien":"very good", "Assez bien":"good" }[mention]}</b>.</p>
			<table class="cg-tbl"><tr><td>Letter of credit</td><td>3 discrepancies, amended</td></tr><tr><td>Incoterm</td><td>CIF Houston · insured 110 %</td></tr><tr><td>Forward rate</td><td>${S.rate ? "$" + S.rate.toFixed(4) : "—"} → ${eur(eurs)}</td></tr><tr><td>US price (MSRP)</td><td>${S.msrp ? usd(S.msrp) : "—"}</td></tr><tr><td>Bill of lading</td><td>${S.reissued ? "reissued: freight prepaid" : "—"}</td></tr><tr><td>Mistakes</td><td>${e}</td></tr></table>
			<p class="cg-p">One week of an export analyst, all in English, like the Licence. You touched ${order.length} of its courses:</p>
			<ul class="cg-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<p class="cg-p" style="font-size:12.5px">And in L3, a year in one of about 200 partner universities, anywhere in the world.</p>
			${jpoCard("en")}${openLead ? `<button class="cg-go" data-a="lead">📄 Get the Licence brochure</button>` : ""}
			<a class="cg-alt" href="${formation.url}" target="_blank" rel="noopener">Discover the ${formation.name} ↗</a>
			<button class="cg-alt" data-a="fav">${isFav() ? "♥ In my notebook" : "♡ Add to my notebook"}</button>
			<button class="cg-alt" data-a="replay">Play again</button>`);
	}

	const STEPS = { lc, route, fx, price, docs, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ In my notebook" : "♡ Add to my notebook"; }
		if(a === "replay"){ Object.assign(S, { errors:0, learned:new Set(), pieces:new Set(), rate:null, msrp:null, reissued:false, lcFound:0, played:true }); $("[data-err]").textContent = 0; lc(); }
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(sayT); timers.forEach(clearTimeout); timers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		controls.dispose();
		scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } });
		renderer.dispose(); renderer.forceContextLoss(); root.remove();
		if(window.campus && window.campus.game && window.campus.game.S === S) window.campus.game = null;
		onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".cg-x").addEventListener("click", close);

	resize();
	camera.position.set(0, 26, 22); controls.target.set(0, 0, 0);
	raf = requestAnimationFrame(frame);
	lc();       // ouverture à chaud : la lettre de crédit vient d'arriver
	ev("start");
	ev("missions", [["Mon · The letter of credit", lc], ["Tue · Who carries the risk", route], ["Wed · The dollar", fx], ["Thu · The US price", price], ["Fri · The documents", docs], ["Report", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, get dock(){ return dock; }, camera, controls,
		tap:id => onTap && onTap(id), drop:(d, z) => { const dr = drags.find(x => x.id === d); if(dr && onDrop) onDrop(dr, z); },
		slide:p => { const d = drags.find(x => x.id === "tag"); if(!d) return; d.g.position.x = priceX(p); onMove && onMove(d); onDrop && onDrop(d, null); },
		get rate(){ return fxState.rate; } };
}

/* ---------- les continents, très simplifiés (longitude, latitude), pour le planisphère du mur ---------- */
const LAND = [
	[[-165,65],[-140,70],[-110,73],[-85,70],[-75,62],[-60,55],[-66,45],[-75,38],[-80,31],[-81,25],[-83,29],[-90,29],[-97,27],[-97,20],[-90,16],[-83,9],[-78,8],[-85,12],[-95,16],[-105,20],[-112,30],[-118,34],[-124,40],[-125,48],[-135,58],[-150,60],[-165,61]],
	[[-52,60],[-42,60],[-20,70],[-20,80],[-60,82],[-70,76],[-56,68]],
	[[-78,8],[-60,10],[-50,0],[-35,-6],[-38,-15],[-48,-25],[-58,-38],[-65,-55],[-72,-50],[-72,-30],[-70,-18],[-80,-5],[-80,2]],
	[[-10,36],[-9,43],[-2,44],[-4,48],[2,51],[8,54],[10,58],[5,62],[15,69],[28,71],[40,68],[60,70],[100,77],[140,72],[180,68],[170,60],[160,52],[140,48],[130,42],[122,30],[120,22],[108,18],[105,10],[100,2],[97,16],[90,22],[80,15],[77,8],[72,20],[60,25],[50,30],[48,30],[55,25],[58,20],[52,15],[44,12],[35,30],[36,36],[28,41],[22,36],[15,38],[12,44],[8,44],[3,42],[-5,36]],
	[[-17,15],[-17,21],[-10,30],[-5,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-2],[40,-15],[35,-25],[20,-35],[17,-30],[12,-18],[13,-5],[9,4],[-8,5],[-15,10]],
	[[-5,50],[1,51],[2,53],[-1,55],[-2,58],[-6,58],[-5,55],[-3,53],[-5,52]], [[-10,52],[-6,52],[-6,55],[-10,54]], [[-24,64],[-14,64],[-14,66],[-22,66]],
	[[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-25],[150,-37],[140,-38],[132,-32],[115,-34]],
	[[130,31],[136,34],[141,38],[141,45],[139,40],[133,34]], [[126,34],[129,35],[129,38],[126,38]], [[172,-34],[178,-38],[172,-46],[167,-46]],
	[[95,5],[105,-6],[115,-8],[120,-2],[110,2]], [[44,-14],[50,-15],[48,-25],[44,-22]]
];
