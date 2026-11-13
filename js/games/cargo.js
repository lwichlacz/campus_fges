/* « Cargo » — mini-jeu de la Licence Internationale Économie & Gestion (FGES), en anglais comme la licence (2026).
   Une carte du monde, de nuit, posée comme une maquette : des routes lumineuses partent de Lille vers Londres, Hambourg
   et Austin, un cargo traverse l'Atlantique, et Maya, la responsable export, tient le journal de bord.
   Beffroi Bikes (fabricant lillois de vélos électriques, fictif) ouvre son premier marché à l'étranger :
   1 · L1 maths et économie : le cours de la livre bouge en direct ; bloquer le bon taux (scène d'ouverture, une minute) ;
   2 · L1 microéconomie : régler le prix à Hambourg, la foule de cyclistes grossit ou fond, trouver le profit maximal ;
   3 · L2 commerce international : jouer une carte Incoterm, voir où le risque change de mains sur la route,
       puis subir un coup du sort en mer ou au port ;
   4 · L2 comportement organisationnel, comptabilité anglo-saxonne, L1 droit comparé : négocier en visio, en anglais ;
   5 · L2 business plan : une nouvelle tombe, les colonnes de profit montent ou s'effondrent, choisir le marché ;
   6 · L3 : l'année à l'étranger, un avion trace la route jusqu'à la ville choisie.
   Entreprise, personnes et chiffres sont fictifs et simplifiés. Contenu à relire par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { jpoCard } from "./jpo.js?v=c983301653";
import { palier } from "./palier.js?v=c983301653";

const COURSES = {
	fx:    ["L1", "Maths & economics", "Exchange rates move every second. Knowing how to protect a price from them is basic international finance."],
	micro: ["L1", "Microeconomics", "Demand, price, profit: the price that sells the most bikes is not the one that earns the most."],
	trade: ["L2", "International economics", "Incoterms, freight, insurance, customs: the rules that decide who pays when things go wrong at sea."],
	ob:    ["L2", "Organisational behaviour", "Negotiating with someone who does not work like you: anchor, concede for something, keep trust."],
	acc:   ["L2", "Anglo-Saxon accounting", "Revenue, net income, inventory: talking about your accounts in English without false friends."],
	law:   ["L1", "Comparative law", "Common law contracts are long because the law fills fewer gaps. Nothing suspicious about it."],
	bp:    ["L2", "Business plan", "Margin per unit, fixed costs, expected volume: is a market worth opening, this year?"],
	abroad:["L3", "A year abroad", "The third year is spent in one of about 200 partner universities, all over the world."]
};
const STEPS_UI = [["fx", "1 · Rate"], ["price", "2 · Price"], ["ship", "3 · Ship"], ["call", "4 · Call"], ["market", "5 · Market"], ["abroad", "6 · Abroad"]];
const NEED = 2150, POUNDS = 1900, COST = 1400;
const demand = p => Math.max(0, Math.round(2400 - .8*p));
const fmt = v => Math.round(v).toLocaleString("en-GB");
const eur = v => (v < 0 ? "−€" : "€") + fmt(Math.abs(v));

// les lieux, en longitude / latitude
const PLACES = {
	lille:[3.06, 50.63, "Lille"], antwerp:[4.4, 51.2, "Antwerp"], london:[-.13, 51.5, "London"], hamburg:[10, 53.55, "Hamburg"],
	houston:[-95.4, 29.8, "Houston"], austin:[-97.7, 30.3, "Austin"],
	montreal:[-73.6, 45.5, "Montréal"], dublin:[-6.3, 53.3, "Dublin"], seoul:[127, 37.6, "Seoul"], valencia:[-.4, 39.5, "Valencia"], bogota:[-74.1, 4.7, "Bogotá"]
};
const UNIS = ["montreal", "dublin", "seoul", "valencia", "bogota"];
// les trois marchés : marge par vélo, coûts fixes d'entrée, vélos attendus la première année
const MARKETS = {
	hamburg:{ name:"Germany", margin:760, fixed:228000, demand:640 },
	london:{ name:"United Kingdom", margin:685, fixed:137000, demand:260 },
	austin:{ name:"United States", margin:310, fixed:155000, demand:900 }
};
const profit = m => m.demand*m.margin - m.fixed;
const NEWS = [
	{ id:"calm", t:"Quiet week", d:"No news: the distributors' estimates stand." },
	{ id:"tariff", t:"Washington suspends tariffs on European e-bikes (in this game)", d:"US margin jumps from €310 to €640 a bike.", mod:M => { M.austin.margin = 640; } },
	{ id:"rival", t:"A German rival slashes its prices", d:"Hamburg now expects 420 bikes, not 640.", mod:M => { M.hamburg.demand = 420; } },
	{ id:"chain", t:"A London chain wants Beffroi Bikes in 30 shops", d:"UK estimate: 700 bikes instead of 260.", mod:M => { M.london.demand = 700; } }
];
// les cartes Incoterms (règles 2020, simplifiées) : où le risque passe à l'acheteur
const CARDS = {
	EXW:{ t:"EXW", n:"Ex Works", d:"She collects the bikes at our door in Lille. Everything after that is hers.", at:"lille" },
	FOB:{ t:"FOB", n:"Free On Board", d:"We bring them on board in Antwerp. She books and pays the ship.", at:"antwerp" },
	CIF:{ t:"CIF", n:"Cost, Insurance & Freight", d:"We pay the ship and insure the cargo to Houston. Risk passes on board in Antwerp.", at:"antwerp" },
	DDP:{ t:"DDP", n:"Delivered Duty Paid", d:"We deliver to her shop, US duties paid. Every risk is ours to the door.", at:"austin" }
};
const EVENTS = [
	{ id:"storm", t:"Storm in the North Atlantic", d:"Six bikes arrive with broken frames.", leg:"sea" },
	{ id:"strike", t:"Dockers' strike in Houston", d:"The container waits five days at the port.", leg:"port" },
	{ id:"customs", t:"Customs hold in Houston", d:"Paperwork check: duties and storage fees to pay before release.", leg:"port" }
];
function outcome(card, ev){
	if(card === "EXW") return { stars:1, who:"Jolene", txt:"Jolene has never imported anything: collecting a container in Lille herself is out of the question. She walks away before the ship even leaves." };
	if(card === "FOB") return { stars:2, who:"Jolene", txt:ev === "storm" ? "The risk was hers from Antwerp, and she had not insured the crossing: she loses six bikes and blames us anyway. FOB suits buyers used to shipping, not a first-time importer." : "Legally fine: after Antwerp, it is her problem. But a first-time importer struggling to book a ship and handle Houston on her own is not a happy first customer." };
	if(card === "CIF") return { stars:3, who:ev === "storm" ? "the insurer" : "Jolene", txt:ev === "storm" ? "The risk passed to Jolene in Antwerp, but we had insured the cargo for her: the insurer pays for the six frames. Nobody loses money, and she is impressed." : "We paid the ship and the insurance; from Houston she clears the bikes as importer. A classic deal for sea freight, clear for both sides." };
	return { stars:ev === "customs" ? 1 : 2, who:"us", txt:ev === "storm" ? "DDP: every risk is ours to her door. Six frames at our expense, and we had not insured them." : ev === "customs" ? "DDP means WE are the importer: duties, storage fees and US paperwork are all ours. Expensive for a first shipment." : "DDP: the strike delay is our problem, storage fees included. Jolene is delighted… at our expense." };
}
const CALL = [
	{ q:"Hi! Love the bikes. Straight question: can you do $1,800 a bike?", a:[
		["anchor", "Our price is €2,200, about $2,390. For 40 bikes, we can include insured shipping to Houston.", 2, "Anchor on your price, then trade a concession for volume: that's how you keep both margin and trust."],
		["yes", "Sure, no problem!", 0, "She is happy… and you just gave away more than €500 a bike. Never concede without getting something back."],
		["no", "Sorry, that's an insult.", -2, "Too blunt: she does not know you yet. A firm price can be said warmly."]] },
	{ q:"My bank wants your figures. What was your bottom line last year?", a:[
		["ni", "Our net income was €310,000, on €4.1 million revenue.", 2, "Net income is the bottom line; revenue is what you sell. Exactly the IFRS vocabulary."],
		["benefit", "Our benefit was €310,000.", 0, "False friend: in English, “benefit” is an advantage, not a profit. The word is net income (or profit)."],
		["turnover", "Our turnover was €310,000.", -1, "Turnover is revenue in British English, not profit. Her bank would think we sell almost nothing!"]] },
	{ q:"Great. My lawyer will send you a 40-page contract tonight. Can we sign tomorrow?", a:[
		["review", "Perfect, send it over: our legal team will review it and come back within 48 hours.", 2, "In common-law countries the law fills fewer gaps, so contracts spell everything out. You read it, you don't panic."],
		["short", "Forty pages? In France we sign two. Let's do two.", -1, "Different legal traditions: a long US contract is normal, not a trap. Imposing your format loses trust."],
		["sign", "Sure, I'll sign whatever you send.", -2, "Never sign unread, in any country."]] }
];

/* ---------- les continents, très simplifiés (longitude, latitude) ---------- */
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
const K = 1, ZOFF = 0;            // échelle de la carte : une unité = un degré
const P = (lon, lat, y = 0) => new THREE.Vector3(lon*K, y, -lat*K + ZOFF);
const at = id => P(PLACES[id][0], PLACES[id][1]);

const CSS = `
.cg{position:fixed;inset:0;z-index:40;background:#050d18;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#e9f7fa;overflow:hidden;animation:cgIn .4s ease both}
@keyframes cgIn{from{opacity:0}}
.cg canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.cg-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px 12px;pointer-events:none}
.cg-top>*{pointer-events:auto}
.cg-brand{font:700 13px Inter,system-ui,sans-serif;letter-spacing:.2em;color:#21b7cb;background:rgba(5,13,24,.7);border:1px solid rgba(33,183,203,.4);border-radius:999px;padding:7px 14px;white-space:nowrap}
.cg-steps{display:flex;gap:4px;overflow:auto;scrollbar-width:none}
.cg-steps span{font-size:11.5px;font-weight:800;color:rgba(233,247,250,.4);border:1px solid rgba(233,247,250,.15);border-radius:999px;padding:5px 9px;white-space:nowrap}
.cg-steps span.done{color:#7fe3b0;border-color:rgba(127,227,176,.4)}
.cg-steps span.now{color:#050d18;background:#21b7cb;border-color:#21b7cb}
.cg-x{margin-left:auto;flex:none;width:40px;height:40px;border-radius:50%;border:1px solid rgba(33,183,203,.5);background:rgba(5,13,24,.75);color:#21b7cb;font-size:22px;cursor:pointer}
.cg-hud{position:absolute;right:12px;top:62px;z-index:3;display:flex;flex-direction:column;gap:6px;align-items:flex-end;pointer-events:none}
.cg-hud span{background:rgba(5,13,24,.72);border:1px solid rgba(233,247,250,.15);border-radius:10px;padding:5px 10px;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums}
.cg-hud b{color:#21b7cb}
.cg-log{position:absolute;left:12px;top:62px;z-index:3;width:min(440px,calc(100% - 24px));background:rgba(5,13,24,.82);border:1px solid rgba(33,183,203,.35);border-radius:12px;padding:10px 12px;backdrop-filter:blur(6px);box-shadow:0 10px 30px rgba(0,0,0,.4)}
.cg-log small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb;margin-bottom:3px}
.cg-log p{margin:0;font:300 14.5px/1.45 Inter,system-ui,sans-serif;color:#e9f7fa;min-height:20px}
.cg-log p b{color:#fff}
.cg-dock{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:3;width:min(760px,calc(100% - 24px));max-height:52%;overflow:auto;background:rgba(9,22,38,.92);border:1px solid rgba(233,247,250,.14);border-radius:16px;padding:14px;box-sizing:border-box;box-shadow:0 18px 40px rgba(0,0,0,.5);scrollbar-width:thin}
.cg-dock:empty{display:none}
.cg-k{font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb}
.cg-h{font:300 20px/1.2 Tiempos Headline,Georgia,serif;margin:2px 0 6px;color:#fff}
.cg-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#e9f7fa}
.cg-p b{color:#fff}
.cg-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cg-big{font:300 30px/1 Tiempos Headline,Georgia,serif;font-variant-numeric:tabular-nums}
.cg-big small{display:block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#21b7cb;margin-bottom:4px}
.cg-ok{color:#7fe3b0}.cg-ko{color:#ff8a7a}
.cg-go{display:block;width:100%;border:0;border-radius:12px;padding:13px;margin-top:10px;background:#21b7cb;color:#0b1a2b;font:700 15.5px Inter,system-ui,sans-serif;cursor:pointer}
.cg-go:disabled{opacity:.35;cursor:default}
.cg-alt{display:block;width:100%;border:1px solid rgba(233,247,250,.25);border-radius:12px;padding:11px;margin-top:8px;background:transparent;color:#e9f7fa;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.cg-chart{display:block;width:100%;height:130px;border-radius:10px;background:#06111f;margin:8px 0}
.cg-range{width:100%;accent-color:#21b7cb;height:34px}
.cg-hand{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:8px 0 2px;perspective:900px}
.cg-card{flex:1 1 140px;max-width:170px;min-height:150px;border:0;border-radius:12px;padding:10px 9px;cursor:pointer;text-align:left;color:#0b1a2b;background:linear-gradient(160deg,#e9f7fa,#e9f7fa);box-shadow:0 0 0 2px #21b7cb inset,0 8px 18px rgba(0,0,0,.4);transition:transform .2s;animation:cgDeal .45s cubic-bezier(.2,.9,.3,1.2) both}
.cg-card:hover{transform:translateY(-6px)}
.cg-card b{display:block;font:700 26px Inter,system-ui,sans-serif;letter-spacing:.06em}
.cg-card i{display:block;font-style:normal;font-weight:800;font-size:12px;margin-bottom:6px;color:#0f3168}
.cg-card small{display:block;font-size:12px;line-height:1.3;color:#3a3020}
.cg-card.out{opacity:.25;pointer-events:none;transform:scale(.94)}
.cg-card.on{transform:translateY(-10px) scale(1.04);box-shadow:0 0 0 3px #0b1a2b inset,0 0 0 6px #21b7cb,0 14px 26px rgba(0,0,0,.5)}
@keyframes cgDeal{from{opacity:0;transform:translateY(40px) rotate(8deg)}}
.cg-ev{background:#3a1010;border:1px solid #ff8a7a;border-radius:10px;padding:9px 11px;margin:8px 0;animation:cgShake .5s}
.cg-ev b{display:block;color:#ffb3a8;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
@keyframes cgShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.cg-stars{font-size:20px;letter-spacing:3px;color:#21b7cb}
.cg-course{border-left:3px solid #21b7cb;background:rgba(33,183,203,.08);border-radius:6px;padding:8px 10px;margin:8px 0}
.cg-course small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#21b7cb}
.cg-course b{display:block;color:#fff}
.cg-course span{font-size:13px;color:#e9f7fa}
.cg-call{display:flex;gap:12px;align-items:flex-start;margin:4px 0 8px}
.cg-face{flex:none;width:74px;height:74px;border-radius:14px;background:linear-gradient(135deg,#ff7e5f,#21b7cb);display:grid;place-items:center;font:300 26px Tiempos Headline,Georgia,serif;color:#2a1508;position:relative;overflow:hidden}
.cg-face i{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:2px}
.cg-face i em{display:block;width:3px;height:6px;background:#2a1508;border-radius:2px;animation:cgTalk .5s infinite alternate}
.cg-face i em:nth-child(2){animation-delay:.15s}.cg-face i em:nth-child(3){animation-delay:.3s}
@keyframes cgTalk{to{height:14px}}
.cg-face.mute i{display:none}
.cg-bubble{flex:1;background:#0f3168;border-radius:4px 14px 14px 14px;padding:10px 12px;font-size:15px;line-height:1.4;color:#fff}
.cg-bubble small{display:block;font-size:11px;font-weight:800;color:#21b7cb;margin-bottom:2px}
.cg-opts{display:grid;gap:7px}
.cg-opt{text-align:left;border:1px solid rgba(233,247,250,.25);background:rgba(255,255,255,.04);border-radius:10px;padding:10px 12px;color:#e9f7fa;font:700 14px/1.35 Inter,system-ui,sans-serif;cursor:pointer}
.cg-opt:hover{border-color:#21b7cb}
.cg-trust{height:8px;border-radius:4px;background:rgba(233,247,250,.12);overflow:hidden;margin:4px 0 10px}
.cg-trust i{display:block;height:100%;background:linear-gradient(90deg,#ff8a7a,#21b7cb,#7fe3b0);transition:width .6s}
.cg-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0;font-variant-numeric:tabular-nums}
.cg-tbl td{padding:5px 4px;border-top:1px solid rgba(233,247,250,.12)}
.cg-tbl td:last-child{text-align:right;font-weight:800;color:#fff}
.cg-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:4px}
.cg-list li{font-size:13.5px;border-bottom:1px dashed rgba(233,247,250,.15);padding:3px 0}
.cg-list li span{color:#21b7cb;font-weight:900;margin-right:6px}
.cg-lang{display:inline-block;font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 9px;background:rgba(33,183,203,.15);color:#e9f7fa;margin-bottom:6px}
@media (max-width:759px){
	.cg-steps{display:none}
	.cg-hud{top:58px;flex-direction:row;right:auto;left:12px}
	.cg-log{top:94px;padding:8px 10px}
	.cg-log p{font-size:13px}
	.cg-dock{bottom:0;width:100%;max-height:50%;border-radius:16px 16px 0 0;padding:12px}
	.cg-card{min-height:120px;flex-basis:120px}
	.cg-card b{font-size:21px}
}`;

export function openCargo({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("cg-css")){ const st = document.createElement("style"); st.id = "cg-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "cg";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-game Cargo");
	root.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="cg-top"><span class="cg-brand">CARGO</span><div class="cg-steps">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div><button class="cg-x" aria-label="Close the game">×</button></div>
		<div class="cg-hud" aria-live="polite"><span>★ <b data-h="stars">0</b></span><span>Mistakes <b data-h="err">0</b></span></div>
		<div class="cg-log"><small>Logbook · Maya, export manager</small><p></p></div>
		<div class="cg-dock"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), dock = $(".cg-dock"), logP = $(".cg-log p");
	const S = { stars:0, errors:0, learned:new Set(), rate:null, price:null, card:null, event:null, trust:50, news:null, M:null, market:null, uni:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= la scène : une carte du monde, de nuit ================= */
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#050d18"); scene.fog = new THREE.Fog("#050d18", 170, 520);
	const camera = new THREE.PerspectiveCamera(40, 1, .5, 1400);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 4; controls.maxDistance = 320; controls.maxPolarAngle = 1.25; controls.minPolarAngle = .25;
	scene.add(new THREE.HemisphereLight("#9cc2ff", "#0b1220", .9));
	const moon = new THREE.DirectionalLight("#cfe0ff", 1.1); moon.position.set(-30, 60, 40); scene.add(moon);
	const own = [];
	const M = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color:c, roughness:.6, ...o }); own.push(m); return m; };
	const G = g => (own.push(g), g);

	// la carte, dessinée au canvas : océan, quadrillage, continents, lumières des villes
	const TW = 4096, TH = Math.round(TW*145/360);
	const mapC = document.createElement("canvas"); mapC.width = TW; mapC.height = TH;
	{
		const x = mapC.getContext("2d"), px = lon => (lon + 180)/360*TW, py = lat => (85 - lat)/145*TH;
		const g = x.createLinearGradient(0, 0, 0, TH); g.addColorStop(0, "#06152a"); g.addColorStop(.5, "#081c36"); g.addColorStop(1, "#051226"); x.fillStyle = g; x.fillRect(0, 0, TW, TH);
		x.strokeStyle = "rgba(127,184,230,.08)"; x.lineWidth = 2;
		for(let lon = -180; lon <= 180; lon += 15){ x.beginPath(); x.moveTo(px(lon), 0); x.lineTo(px(lon), TH); x.stroke(); }
		for(let lat = -60; lat <= 85; lat += 15){ x.beginPath(); x.moveTo(0, py(lat)); x.lineTo(TW, py(lat)); x.stroke(); }
		for(const poly of LAND){
			x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(px(lo), py(la)) : x.moveTo(px(lo), py(la))); x.closePath();
			x.fillStyle = "#2b5274"; x.fill(); x.lineWidth = 6; x.strokeStyle = "rgba(255,179,71,.35)"; x.stroke();
		}
		const rnd = (() => { let s = 7; return () => (s = (s*16807) % 2147483647)/2147483647; })();
		x.fillStyle = "rgba(255,214,140,.55)";
		for(const [lo, la] of [[3,50.6],[-.1,51.5],[2.3,48.9],[13.4,52.5],[10,53.5],[-74,40.7],[-118,34],[-87.6,41.9],[-95.4,29.8],[139.7,35.7],[127,37.6],[121.5,31.2],[77.2,28.6],[-46.6,-23.5],[-73.6,45.5],[-3.7,40.4],[12.5,41.9],[28.9,41],[31.2,30],[-6.3,53.3],[-74.1,4.7],[151.2,-33.9],[103.8,1.35]]){
			for(let i = 0; i < 40; i++){ const r = rnd()*14; const a = rnd()*7; x.beginPath(); x.arc(px(lo) + Math.cos(a)*r, py(la) + Math.sin(a)*r, 1.5 + rnd()*2.5, 0, 7); x.fill(); }
		}
	}
	const mapT = new THREE.CanvasTexture(mapC); mapT.colorSpace = THREE.SRGBColorSpace; mapT.anisotropy = renderer.capabilities.getMaxAnisotropy();
	const map = new THREE.Mesh(G(new THREE.PlaneGeometry(360, 145)), M("#ffffff", { map:mapT, roughness:.85, emissive:"#0b2440", emissiveIntensity:.25 }));
	map.rotation.x = -Math.PI/2; map.position.set(0, 0, -85*K + 145/2); scene.add(map);      // bord haut : 85° nord
	// l'Europe, dessinée plus finement : on la regarde de près
	const EU = [-15, 25, 40, 62];
	const euC = document.createElement("canvas"); euC.width = 2048; euC.height = Math.round(2048*(EU[3] - EU[2])/(EU[1] - EU[0]));
	{
		const x = euC.getContext("2d"), W2 = euC.width, H2 = euC.height, px = lon => (lon - EU[0])/(EU[1] - EU[0])*W2, py = lat => (EU[3] - lat)/(EU[3] - EU[2])*H2;
		const g = x.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, "#06172d"); g.addColorStop(1, "#081c36"); x.fillStyle = g; x.fillRect(0, 0, W2, H2);
		x.strokeStyle = "rgba(127,184,230,.08)"; x.lineWidth = 2;
		for(let lon = -15; lon <= 25; lon += 5){ x.beginPath(); x.moveTo(px(lon), 0); x.lineTo(px(lon), H2); x.stroke(); }
		for(let lat = 40; lat <= 62; lat += 5){ x.beginPath(); x.moveTo(0, py(lat)); x.lineTo(W2, py(lat)); x.stroke(); }
		for(const poly of LAND){ x.beginPath(); poly.forEach(([lo, la], i) => i ? x.lineTo(px(lo), py(la)) : x.moveTo(px(lo), py(la))); x.closePath(); x.fillStyle = "#2b5274"; x.fill(); x.lineWidth = 4; x.strokeStyle = "rgba(255,179,71,.4)"; x.stroke(); }
		x.fillStyle = "rgba(255,214,140,.6)";
		for(const [lo, la] of [[3.06,50.63],[-.13,51.5],[2.35,48.86],[4.4,51.2],[4.35,50.85],[10,53.55],[13.4,52.5],[6.96,50.94],[8.68,50.11],[11.58,48.14],[4.9,52.37],[-2.24,53.48],[-1.9,52.48],[-6.26,53.35],[-3.7,40.42],[-.38,39.47],[2.17,41.39]]){ for(let i = 0; i < 26; i++){ const a = Math.random()*7, r = Math.random()*16; x.beginPath(); x.arc(px(lo) + Math.cos(a)*r, py(la) + Math.sin(a)*r, 1.5 + Math.random()*2, 0, 7); x.fill(); } }
	}
	const euT = new THREE.CanvasTexture(euC); euT.colorSpace = THREE.SRGBColorSpace; euT.anisotropy = renderer.capabilities.getMaxAnisotropy(); own.push(euT);
	const eu = new THREE.Mesh(G(new THREE.PlaneGeometry((EU[1] - EU[0])*K, (EU[3] - EU[2])*K)), M("#ffffff", { map:euT, roughness:.85, emissive:"#0b2440", emissiveIntensity:.25 }));
	eu.rotation.x = -Math.PI/2; eu.position.set((EU[0] + EU[1])/2*K, .06, -(EU[2] + EU[3])/2*K); eu.material.polygonOffset = true; eu.material.polygonOffsetFactor = -2; scene.add(eu);
	// un socle, comme une maquette posée
	const base = new THREE.Mesh(G(new THREE.BoxGeometry(364, 2, 149)), M("#0d1a2a", { roughness:.9 })); base.position.set(0, -1.4, map.position.z); scene.add(base);

	// étiquettes de taille constante à l'écran
	function label(text, o = {}){
		const c = document.createElement("canvas"), x = c.getContext("2d"), f = `700 44px Inter, system-ui, sans-serif`;
		x.font = f; const w = Math.ceil(x.measureText(text).width) + 40, h = 70; c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "rgba(5,13,24,.85)"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 14); x.fill();
		x.strokeStyle = o.line || "rgba(255,179,71,.7)"; x.lineWidth = 3; x.stroke();
		x.fillStyle = o.fg || "#ffe2b0"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, sizeAttenuation:false }));
		const s = (o.size || .034)*(innerWidth < 760 ? .55 : 1);      /* sur téléphone, l'image décalée sous le panneau agrandit les étiquettes */ sp.scale.set(s*w/h, s, 1); sp.renderOrder = 20; own.push(t, sp.material);
		return sp;
	}
	// les repères des villes : un pilier lumineux, une étiquette, une zone à toucher
	const pins = {}, taps = [];
	for(const id of Object.keys(PLACES)){
		const g = new THREE.Group(); g.position.copy(at(id)); scene.add(g);
		const col = id === "lille" ? "#ffb347" : UNIS.includes(id) ? "#a9d2f3" : "#7fe3b0";
		const beam = new THREE.Mesh(G(new THREE.CylinderGeometry(.08, .08, 1.6, 10)), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.85 })); beam.position.y = .8; g.add(beam); own.push(beam.material);
		const dot = new THREE.Mesh(G(new THREE.SphereGeometry(.22, 14, 10)), new THREE.MeshBasicMaterial({ color:col })); dot.position.y = 1.65; g.add(dot); own.push(dot.material);
		const ring = new THREE.Mesh(G(new THREE.RingGeometry(.3, .45, 32)), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.6, side:THREE.DoubleSide })); ring.rotation.x = -Math.PI/2; ring.position.y = .03; g.add(ring); own.push(ring.material);
		const l = label(PLACES[id][2], { fg:col === "#ffb347" ? "#ffd38a" : "#e8f0f7" }); l.position.y = 2.4; g.add(l);
		const hit = new THREE.Mesh(G(new THREE.CylinderGeometry(1.4, 1.4, 4, 10)), new THREE.MeshBasicMaterial({ visible:false })); hit.position.y = 1.5; g.add(hit);
		taps.push({ hit, id });
		g.visible = ["lille"].includes(id);
		pins[id] = { g, ring, beam, dot, l };
	}
	const show = (...ids) => { for(const [k, p] of Object.entries(pins)){ p.g.visible = k === "lille" || ids.includes(k); p.l.visible = true; } };

	// les routes : des courbes lumineuses
	const routes = new THREE.Group(); scene.add(routes);
	const curveOf = pts => new THREE.CatmullRomCurve3(pts.map(([lo, la, y]) => P(lo, la, y ?? .12)));
	function routeLine(curve, col, r = .07){ const m = new THREE.Mesh(G(new THREE.TubeGeometry(curve, 160, r, 6, false)), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.9 })); own.push(m.material); routes.add(m); return m; }
	const ROUTES = {
		truck1:curveOf([[3.06, 50.63], [3.7, 50.95], [4.4, 51.2]]),
		sea:curveOf([[4.4, 51.2], [2.2, 51.3], [1.2, 50.6], [-4, 49.4], [-12, 47], [-30, 40, .5], [-55, 31, .5], [-75, 25], [-82, 23.5], [-89, 26], [-95.4, 29.8]]),
		truck2:curveOf([[-95.4, 29.8], [-96.6, 30.1], [-97.7, 30.3]]),
		uk:curveOf([[3.06, 50.63], [1.85, 50.95], [1.3, 51.1], [.6, 51.35], [-.13, 51.5]]),
		de:curveOf([[3.06, 50.63], [6, 51.4], [8, 52.6], [10, 53.55]])
	};

	// le cargo : une coque, des conteneurs
	const ship = new THREE.Group(); scene.add(ship); ship.visible = false;
	{
		const hull = new THREE.Mesh(G(new THREE.BoxGeometry(2.2, .5, .7)), M("#c8432f")); hull.position.y = .25; ship.add(hull);
		const deck = new THREE.Mesh(G(new THREE.BoxGeometry(2.2, .08, .7)), M("#2a2f38")); deck.position.y = .52; ship.add(deck);
		["#1f6fb2", "#e0a33a", "#3d9a6a", "#b23a5a", "#1f6fb2", "#e0a33a"].forEach((c, i) => { const b = new THREE.Mesh(G(new THREE.BoxGeometry(.5, .3, .28)), M(c)); b.position.set(-.6 + (i % 3)*.5, .72 + Math.floor(i/3)*.3, (i % 2 ? .15 : -.15)); ship.add(b); });
		const bridge = new THREE.Mesh(G(new THREE.BoxGeometry(.35, .6, .6)), M("#e8edf2")); bridge.position.set(.85, .8, 0); ship.add(bridge);
		const light = new THREE.PointLight("#ffd38a", 2, 6); light.position.set(.85, 1.3, 0); ship.add(light);
	}
	// le camion, pour les trajets terrestres
	const truck = new THREE.Group(); scene.add(truck); truck.visible = false;
	{ const c = new THREE.Mesh(G(new THREE.BoxGeometry(.9, .45, .4)), M("#1f6fb2")); c.position.set(-.15, .3, 0); truck.add(c); const cab = new THREE.Mesh(G(new THREE.BoxGeometry(.3, .35, .4)), M("#e8edf2")); cab.position.set(.45, .25, 0); truck.add(cab); }
	// le marqueur « le risque change de mains »
	const riskMark = new THREE.Group(); scene.add(riskMark); riskMark.visible = false;
	{ const cone = new THREE.Mesh(G(new THREE.ConeGeometry(.45, 1, 4)), new THREE.MeshBasicMaterial({ color:"#ff5a4f" })); cone.rotation.x = Math.PI; cone.position.y = 3.6; riskMark.add(cone); own.push(cone.material); const l = label("RISK → BUYER", { fg:"#ffb3a8", line:"#ff5a4f", size:.032 }); l.position.y = 4.6; riskMark.add(l); riskMark.userData.l = l; }
	// la foule de cyclistes à Hambourg (étape du prix)
	const crowd = new THREE.Group(); scene.add(crowd); crowd.visible = false;
	const riders = [];
	{
		const body = G(new THREE.CylinderGeometry(.06, .08, .32, 6)), wheel = G(new THREE.TorusGeometry(.09, .02, 6, 12));
		const cols = ["#7fe3b0", "#ffb347", "#a9d2f3", "#ff8a7a", "#e8f0f7"].map(c => M(c, { emissive:c, emissiveIntensity:.35 }));
		const center = at("hamburg");
		for(let i = 0; i < 36; i++){
			const g = new THREE.Group(), a = i*2.39996, r = .7 + Math.sqrt(i)*.38;
			g.position.set(center.x + Math.cos(a)*r, 0, center.z + Math.sin(a)*r); g.rotation.y = -a;
			const b = new THREE.Mesh(body, cols[i % 5]); b.position.y = .35; g.add(b);
			for(const dx of [-.12, .12]){ const w = new THREE.Mesh(wheel, cols[4]); w.position.set(dx, .1, 0); g.add(w); }
			crowd.add(g); riders.push(g);
		}
	}
	// les colonnes de profit (étape du marché)
	const pillars = {};
	for(const id of Object.keys(MARKETS)){
		const g = new THREE.Group(); g.position.copy(at(id)); g.position.x += id === "london" ? -6 : id === "hamburg" ? 4 : 0; g.position.z += id === "london" ? 2 : id === "hamburg" ? -2 : 0; scene.add(g); g.visible = false;
		const m = new THREE.Mesh(G(new THREE.BoxGeometry(3.4, 1, 3.4)), M("#7fe3b0", { emissive:"#7fe3b0", emissiveIntensity:.5, transparent:true, opacity:.9 })); m.position.y = .5; g.add(m);
		const l = label("", { size:.03 }); l.position.y = 2; g.add(l);
		pillars[id] = { g, m, l, h:1, target:1 };
	}
	function setPillarLabel(id, text, good){ const p = pillars[id]; p.g.remove(p.l); p.l = label(text, { size:.03, fg:good ? "#7fe3b0" : "#ffb3a8", line:good ? "#7fe3b0" : "#ff8a7a" }); p.g.add(p.l); }
	// l'avion de l'année d'échange
	const plane = new THREE.Group(); scene.add(plane); plane.visible = false;
	{ const f = new THREE.Mesh(G(new THREE.CylinderGeometry(.12, .08, 1.2, 8)), M("#e8f0f7")); f.rotation.z = Math.PI/2; plane.add(f); const w = new THREE.Mesh(G(new THREE.BoxGeometry(.3, .04, 1.3)), M("#a9d2f3")); plane.add(w); }

	/* --- mouvements : objets qui suivent une courbe, caméra qui se déplace --- */
	const movers = [];
	function travel(obj, curve, dur, done){ obj.visible = true; movers.push({ obj, curve, t0:performance.now(), dur, done }); }
	let cam = null;
	let lastFly = null, lastAspect = 0;
	function fly(target, dist, polar = .9, az = 0, dur = 1.6){ lastFly = [target, dist, polar, az];
		const t1 = target.clone(), p1 = new THREE.Vector3(Math.sin(polar)*Math.sin(az), Math.cos(polar), Math.sin(polar)*Math.cos(az)).multiplyScalar(Math.min(controls.maxDistance, dist*(camera.aspect < 1 ? Math.min(3.8, 1.1/camera.aspect) : 1))).add(t1);
		cam = { k:0, dur, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;

	/* --- toucher un lieu --- */
	let onTap = null, down = null;
	canvas.addEventListener("pointerdown", e => { down = { x:e.clientX, y:e.clientY }; });
	canvas.addEventListener("pointerup", e => {
		if(!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10){ down = null; return; }
		down = null; if(!onTap) return;
		// le lieu le plus proche du doigt, à l'écran : facile à toucher même quand la carte est vue de loin
		const r = canvas.getBoundingClientRect(), v = new THREE.Vector3();
		let best = null, bd = innerWidth < 760 ? 48 : 40;
		for(const t of taps){
			const p = pins[t.id]; if(t.id === "lille" || !p.g.visible) continue;
			p.dot.getWorldPosition(v); v.project(camera);
			const d = Math.hypot((v.x + 1)/2*r.width + r.left - e.clientX, (1 - v.y)/2*r.height + r.top - e.clientY);
			if(d < bd){ bd = d; best = t.id; }
		}
		if(best) onTap(best);
	});

	/* --- la boucle --- */
	let raf = 0, last = performance.now(), tick = null;
	function frame(now){
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(let i = movers.length - 1; i >= 0; i--){
			const m = movers[i], k = Math.min(1, (now - m.t0)/m.dur), p = m.curve.getPointAt(ease(k)), q = m.curve.getPointAt(Math.min(1, ease(k) + .01));
			m.obj.position.copy(p); if(q.distanceTo(p) > 1e-4) m.obj.lookAt(q.x, p.y, q.z); m.obj.rotateY(-Math.PI/2);
			if(k >= 1){ movers.splice(i, 1); m.done && m.done(); }
		}
		for(const p of Object.values(pins)) if(p.g.visible){ const s = 1 + .25*Math.sin(now/400); p.ring.scale.setScalar(s); p.ring.material.opacity = .7 - .3*(s - 1)*4; }
		for(const p of Object.values(pillars)) if(p.g.visible){ p.h += (p.target - p.h)*Math.min(1, dt*3); p.m.scale.y = Math.max(.02, p.h); p.m.position.y = p.m.scale.y/2; p.l.position.y = p.m.scale.y + .8; }
		// le cargo, le camion et l'avion restent lisibles, de près comme vus de l'espace
		for(const o of [ship, truck, plane]) if(o.visible) o.scale.setScalar(Math.max(.8, Math.min(3.4, camera.position.distanceTo(o.position)/26)));
		if(riskMark.visible) riskMark.children[0].position.y = 3.6 + Math.sin(now/250)*.2;
		if(ship.visible && !movers.some(m => m.obj === ship)) ship.position.y = Math.sin(now/500)*.03;
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		tick && tick(now, dt);
		if(Math.abs((dock.childElementCount ? Math.min(innerHeight*.55, dock.offsetHeight + 12) : 0) - VD) > 8) resize();
		controls.update();
		renderer.render(scene, camera);
	}
	// le centre de l'image remonte au-dessus du panneau du bas, pour que la scène ne se cache pas derrière
	let VD = -1;
	function resize(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		const d = dock.childElementCount ? Math.min(h*.55, dock.offsetHeight + 12) : 0; VD = d;
		if(d) camera.setViewOffset(w, h + d, 0, d, w, h); else camera.clearViewOffset();
		camera.updateProjectionMatrix();
		if(lastFly && Math.abs(camera.aspect - lastAspect) > .05){ lastAspect = camera.aspect; fly(...lastFly, .5); }
		lastAspect = camera.aspect;
	}
	addEventListener("resize", resize); resize();
	camera.position.copy(at("lille")).add(new THREE.Vector3(0, 12, 9)); controls.target.copy(at("lille"));

	/* ================= l'interface ================= */
	let sayT = 0;
	function say(html){
		clearInterval(sayT); const plain = html.replace(/<[^>]+>/g, ""); let i = 0; logP.textContent = "";
		sayT = setInterval(() => { if(closed) return clearInterval(sayT); i += 2; if(i >= plain.length){ clearInterval(sayT); logP.innerHTML = html; } else logP.textContent = plain.slice(0, i); }, 16);
	}
	function stage(k, label){
		root.querySelectorAll(".cg-steps span").forEach(s => { const i = STEPS_UI.findIndex(x => x[0] === s.dataset.s), n = STEPS_UI.findIndex(x => x[0] === k); s.className = i < n ? "done" : i === n ? "now" : ""; });
		ev("stage", label); onTap = null; tick = null;
	}
	const hud = () => { $('[data-h="stars"]').textContent = S.stars; $('[data-h="err"]').textContent = S.errors; };
	function stars(n){ S.stars += n; hud(); return `<div class="cg-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	function err(){ S.errors++; hud(); play("bad"); ev("err"); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="cg-course"><small>In the Licence · ${y}</small><b>${n}</b><span>${t}</span></div>`; }
	const dockHTML = html => { dock.innerHTML = html; dock.scrollTop = 0; };
	const next = (step, label) => `<button class="cg-go" data-next="${step}">${label}</button>`;
	dock.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });

	/* ---------- 1 · L1 · le cours de la livre, en direct (scène d'ouverture) ---------- */
	function fx(){
		stage("fx", "1 · Lock the rate"); show("london"); routes.clear(); routeLine(ROUTES.uk, "#ffb347", .05);
		fly(P(.4, 52.4), 15, .75, -.2);      // Londres et Lille sous le carnet de bord, pas derrière
		say("Morning! A London shop signed: <b>40 bikes at £1,900 each</b>, paid in pounds. We need at least <b>€2,150 a bike</b>. The pound moves every second: <b>lock the rate</b> with the bank when it's good. Don't wait too long…");
		const first = S.rate === null;
		dockHTML(`<div class="cg-k">${first ? `Mini-game · ${formation.name}` : "L1 · maths & economics"}</div>${first ? `<span class="cg-lang">🇬🇧 In English, like the Licence</span>` : ""}
			<div class="cg-h">£1,900 a bike… but how many euros?</div>
			<canvas class="cg-chart" width="700" height="130" style="height:96px"></canvas>
			<div class="cg-row"><div class="cg-big"><small>£1 =</small><span data-r>€1.1250</span></div><div class="cg-big"><small>per bike</small><span data-e>€2,137</span></div><div class="cg-big"><small>target</small>€2,150</div></div>
			<button class="cg-go" data-lock>🔒 Lock this rate</button>`);
		const cv = dock.querySelector("canvas"), cx = cv.getContext("2d"), hist = [];
		const t0 = performance.now(); let locked = false, rate = 1.125, newsShown = false;
		// la trajectoire : une hausse, puis la banque d'Angleterre baisse ses taux et la livre plonge
		const path = t => t < 9 ? 1.125 + .042*Math.sin(t/9*Math.PI/2) : t < 12.5 ? 1.167 - .004*(t - 9) : 1.153 - .065*Math.min(1, (t - 12.5)/6);
		tick = now => {
			if(locked) return;
			const t = (now - t0)/1000;
			rate = path(t) + Math.sin(t*7.3)*.0018 + Math.sin(t*2.1)*.0025;
			hist.push(rate); if(hist.length > 260) hist.shift();
			const e = POUNDS*rate, good = e >= NEED;
			dock.querySelector("[data-r]").textContent = "€" + rate.toFixed(4);
			const de = dock.querySelector("[data-e]"); de.textContent = eur(e); de.className = good ? "cg-ok" : "cg-ko";
			cx.fillStyle = "#06111f"; cx.fillRect(0, 0, 700, 130);
			const y = r => 120 - (r - 1.06)/(1.19 - 1.06)*110;
			cx.strokeStyle = "rgba(255,179,71,.6)"; cx.setLineDash([6, 6]); cx.beginPath(); cx.moveTo(0, y(NEED/POUNDS)); cx.lineTo(700, y(NEED/POUNDS)); cx.stroke(); cx.setLineDash([]);
			cx.fillStyle = "rgba(255,179,71,.8)"; cx.font = "700 14px Inter,system-ui,sans-serif"; cx.fillText("€2,150 a bike", 8, y(NEED/POUNDS) - 6);
			cx.strokeStyle = good ? "#7fe3b0" : "#ff8a7a"; cx.lineWidth = 3; cx.beginPath(); hist.forEach((r, i) => { const X = i/260*700; i ? cx.lineTo(X, y(r)) : cx.moveTo(X, y(r)); }); cx.stroke();
			pins.london.dot.material.color.set(good ? "#7fe3b0" : "#ff8a7a");
			if(t > 12.5 && !newsShown){ newsShown = true; play("alarm"); say("⚠ Breaking: the <b>Bank of England cuts its rates</b>. The pound is falling. Lock now, or hope it bounces back?"); }
			if(t > 24) lock(true);
		};
		dock.querySelector("[data-lock]").onclick = () => lock(false);
		function lock(auto){
			if(locked) return; locked = true; tick = null; S.rate = rate;
			const e = POUNDS*rate, n = e >= NEED ? (rate >= 1.155 ? 3 : 2) : 1;
			if(n === 1) err(); else play(n === 3 ? "good" : "chime");
			pins.london.dot.material.color.set(n > 1 ? "#7fe3b0" : "#ff8a7a");
			say(n === 3 ? "Beautiful timing. The bank guarantees that rate, whatever the pound does now." : n === 2 ? "Safe: above our €2,150. A little earlier and we'd have had more." : auto ? "The bank closed the window: we're stuck below our target. Waiting was a bet." : "Below our €2,150: we lose money on every bike. Locking too late hurts as much as locking too early.");
			dock.querySelector("[data-lock]").outerHTML = `${stars(n)}<p class="cg-p">Locked at <b>£1 = €${rate.toFixed(4)}</b>: <b>${eur(e)}</b> a bike, ${eur(e*40)} for the order. This is a <b>forward contract</b>: the bank fixes today the rate you'll get in three months, so the pound can fall without hurting you.</p>${course("fx")}${first ? "" : next("price", "Next: the right price →")}`;
			if(first) later(2400, () => palier({ id:"cargo", en:true, onEvent, openLead, quit:close,
				titre:`Rate locked: ${eur(e)} a bike. You just beat the currency market.`,
				texte:"Next: set your price in Germany, ship a container across the Atlantic (and survive what happens on the way), negotiate in English… then pick the market and your year abroad.",
				suite:"Ship the whole order (≈ 7 min)" }).then(price));
		}
	}

	/* ---------- 2 · L1 · microéconomie : le prix à Hambourg, et la foule qui va avec ---------- */
	function price(){
		stage("price", "2 · Price"); show("hamburg"); routes.clear(); routeLine(ROUTES.de, "#7fe3b0", .05); crowd.visible = true;
		fly(at("hamburg"), 15, .8, .4);
		say("Hamburg next. Each bike costs us <b>€1,400</b> to make. Slide the price: watch the crowd of buyers grow or shrink. Find the price that <b>earns the most</b>.");
		dockHTML(`<div class="cg-k">L1 · microeconomics</div><div class="cg-h">What price for Germany?</div>
			<input class="cg-range" type="range" min="1500" max="2800" step="50" value="1700" aria-label="Price per bike">
			<div class="cg-row"><div class="cg-big"><small>price</small><span data-p></span></div><div class="cg-big"><small>bikes sold</small><span data-q></span></div><div class="cg-big"><small>revenue</small><span data-rv></span></div><div class="cg-big"><small>profit</small><span data-pf></span></div></div>
			<button class="cg-go" data-set>Set this price</button>`);
		const rg = dock.querySelector("input");
		const upd = () => {
			const p = +rg.value, q = demand(p), pf = (p - COST)*q;
			dock.querySelector("[data-p]").textContent = eur(p); dock.querySelector("[data-q]").textContent = fmt(q);
			dock.querySelector("[data-rv]").textContent = eur(p*q); dock.querySelector("[data-pf]").textContent = eur(pf);
			const n = Math.round(q/40); riders.forEach((r, i) => { const on = i < n; r.visible = true; r.scale.setScalar(on ? 1 : .001); });
		};
		rg.addEventListener("input", () => { upd(); play("clic"); }); upd();
		dock.querySelector("[data-set]").onclick = () => {
			const p = +rg.value, gap = Math.abs(p - 2200), n = gap === 0 ? 3 : gap <= 100 ? 2 : 1; S.price = p;
			if(n === 1) err(); else play(n === 3 ? "good" : "chime");
			say(n === 3 ? "€2,200: 640 bikes, €512,000 profit. The best possible." : p < 2200 ? "Lots of bikes… but a thin margin on each. Profit peaks higher up." : "Fat margin, but the crowd has left. Profit peaks lower down.");
			rg.disabled = true;
			dock.querySelector("[data-set]").outerHTML = `${stars(n)}<p class="cg-p">The most <b>revenue</b> is at €1,500 (1,200 bikes, €1.8 m)… for only €120,000 of profit. The most <b>profit</b> is at <b>€2,200</b>: (2,200 − 1,400) × 640 = <b>€512,000</b>. Maximise profit, not sales.</p>${course("micro")}${next("ship", "Next: ship to Austin →")}`;
		};
	}

	/* ---------- 3 · L2 · commerce international : une carte Incoterm, une traversée, un coup du sort ---------- */
	function ship_(){
		stage("ship", "3 · Ship to Austin"); crowd.visible = false; show("antwerp", "houston", "austin"); routes.clear();
		routeLine(ROUTES.truck1, "#a9d2f3", .05); routeLine(ROUTES.sea, "#a9d2f3", .1); routeLine(ROUTES.truck2, "#a9d2f3", .05);
		fly(P(-45, 40), 125, .7, 0);
		say("Austin! Jolene runs a bike shop and has <b>never imported</b> anything. Who organises and pays the crossing, and who carries the risk at sea? <b>Play one Incoterm card.</b>");
		dockHTML(`<div class="cg-k">L2 · international economics</div><div class="cg-h">40 bikes, Lille → Austin</div>
			<div class="cg-hand">${Object.values(CARDS).map((c, i) => `<button class="cg-card" data-c="${c.t}" style="animation-delay:${i*80}ms"><b>${c.t}</b><i>${c.n}</i><small>${c.d}</small></button>`).join("")}</div><div data-res></div>`);
		const hand = dock.querySelector(".cg-hand");
		hand.onclick = e => {
			const b = e.target.closest("[data-c]"); if(!b || S.card) return;
			const k = b.dataset.c; S.card = k; play("stamp");
			hand.querySelectorAll(".cg-card").forEach(x => x.classList.add(x === b ? "on" : "out"));
			riskMark.position.copy(at(CARDS[k].at)); riskMark.visible = true;
			say(`${k}: the risk passes to Jolene at <b>${k === "DDP" ? "her own door" : PLACES[CARDS[k].at][2]}</b> (red marker). Let's sail…`);
			const E = S.event = EVENTS[Math.floor(Math.random()*EVENTS.length)];
			if(k === "EXW"){ later(1600, () => resolve(k, E)); return; }
			truck.position.copy(at("lille"));
			travel(truck, ROUTES.truck1, 1600, () => {
				truck.visible = false; ship.visible = true; play("metro");
				fly(P(-35, 40), 85, .75, 0, 2.5);
				travel(ship, ROUTES.sea, 6500, () => { play("chime"); fly(at("houston"), 18, .8, 0); travel(truck, ROUTES.truck2, 1400, () => {}); later(900, () => resolve(k, E)); });
				if(E.leg === "sea") later(3200, () => { play("alarm"); shake(); say(`⚠ <b>${E.t}</b>. ${E.d}`); });
			});
			if(E.leg === "port") later(9200, () => { play("alarm"); say(`⚠ <b>${E.t}</b>. ${E.d}`); });
		};
		function resolve(k, E){
			const o = outcome(k, E.id);
			if(o.stars === 1) err(); else play(o.stars === 3 ? "good" : "chime");
			dock.querySelector("[data-res]").innerHTML = `<div class="cg-ev"><b>⚠ ${E.t}</b>${E.d}</div>${stars(o.stars)}<p class="cg-p"><b>Who pays: ${o.who}.</b> ${o.txt}</p>
				${o.stars < 3 ? `<p class="cg-p"><b>Maya's tip:</b> for a first-time importer by sea, <b>CIF</b> is the classic: we handle and insure the crossing, she takes over in Houston.</p>` : ""}
				${course("trade")}${next("call", "Next: Jolene is calling →")}`;
			dock.scrollTop = dock.scrollHeight;
		}
	}
	let shakeT = 0;
	function shake(){ shakeT = performance.now(); const t0 = shakeT; const f = () => { if(closed || shakeT !== t0) return; const k = (performance.now() - t0)/600; if(k < 1){ ship.rotation.x = Math.sin(k*30)*.25*(1 - k); requestAnimationFrame(f); } else ship.rotation.x = 0; }; f(); }

	/* ---------- 4 · L2 · la négociation en anglais, en visio ---------- */
	function call(){
		stage("call", "4 · Call"); riskMark.visible = false; ship.visible = false; truck.visible = false; show("austin");
		fly(at("austin"), 14, .7, .5);
		say("Jolene is on video. Stay warm, stay precise, and mind your English: <b>her trust</b> decides the deal.");
		let i = 0;
		const render = () => {
			const c = CALL[i];
			dockHTML(`<div class="cg-k">L2 · organisational behaviour · in English</div><div class="cg-trust"><i style="width:${S.trust}%"></i></div>
				<div class="cg-call"><div class="cg-face">JP<i><em></em><em></em><em></em></i></div><div class="cg-bubble"><small>Jolene Park · Austin, TX</small>${c.q}</div></div>
				<div class="cg-opts">${c.a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, [k, t]]) => `<button class="cg-opt" data-o="${k}">${t}</button>`).join("")}</div><div data-r></div>`);
			later(2200, () => dock.querySelector(".cg-face")?.classList.add("mute"));
			dock.querySelector(".cg-opts").onclick = e => {
				const b = e.target.closest("[data-o]"); if(!b) return;
				const [, , d, why] = c.a.find(a => a[0] === b.dataset.o);
				S.trust = Math.max(0, Math.min(100, S.trust + d*12)); dock.querySelector(".cg-trust i").style.width = S.trust + "%";
				if(d < 2) err(); else play("good");
				dock.querySelectorAll(".cg-opt").forEach(x => { x.disabled = true; x.style.opacity = x === b ? 1 : .35; });
				const ck = ["ob", "acc", "law"][i];
				dock.querySelector("[data-r]").innerHTML = `<p class="cg-p" style="margin-top:8px">${d === 2 ? "✓ " : ""}${why}</p>${course(ck)}${i < CALL.length - 1 ? `<button class="cg-go" data-more>Next question →</button>` : `${stars(S.trust >= 80 ? 3 : S.trust >= 55 ? 2 : 1)}<p class="cg-p">Trust: <b>${S.trust} / 100</b>. ${S.trust >= 80 ? "Jolene signs: 40 bikes, and a second order if they sell." : "She'll think about it… a first deal is built on trust."}</p>${next("market", "Next: which market first? →")}`}`;
				const more = dock.querySelector("[data-more]"); if(more) more.onclick = () => { play("pop"); i++; render(); };
				dock.scrollTop = dock.scrollHeight;
			};
		};
		render();
	}

	/* ---------- 5 · L2 · business plan : la nouvelle, les colonnes, le choix ---------- */
	function market(){
		stage("market", "5 · Market"); show("hamburg", "london", "austin"); routes.clear();
		routeLine(ROUTES.de, "#7fe3b0", .05); routeLine(ROUTES.uk, "#7fe3b0", .05); routeLine(ROUTES.sea, "#7fe3b0", .06);
		fly(P(-42, 38), 205, .78, 0);
		for(const p of Object.values(pins)) p.l.visible = false;
		const Mk = S.M = JSON.parse(JSON.stringify(MARKETS)), n = S.news = S.news || NEWS[Math.floor(Math.random()*NEWS.length)]; n.mod && n.mod(Mk);
		const maxP = 450000;      // colonne de 14 unités au maximum
		const setP = (M2) => { for(const id of Object.keys(M2)){ const p = profit(M2[id]); pillars[id].g.visible = true; pillars[id].target = Math.max(.05, p/maxP*14); setPillarLabel(id, `${PLACES[id][2]} ${eur(p)}`, p > 150000); } };
		setP(MARKETS);
		say("The board can afford <b>one</b> market this year. Each column is the expected profit of year 1. Wait for this morning's news…");
		dockHTML(`<div class="cg-k">L2 · business plan</div><div class="cg-h">Which market first?</div>
			<table class="cg-tbl"><tr><td></td><td>🇩🇪</td><td>🇬🇧</td><td>🇺🇸</td></tr>
			<tr><td>Margin / bike</td>${["hamburg", "london", "austin"].map(k => `<td data-m="${k}">${eur(MARKETS[k].margin)}</td>`).join("")}</tr>
			<tr><td>Bikes expected</td>${["hamburg", "london", "austin"].map(k => `<td data-d="${k}">${fmt(MARKETS[k].demand)}</td>`).join("")}</tr>
			<tr><td>Fixed costs</td>${["hamburg", "london", "austin"].map(k => `<td>${eur(MARKETS[k].fixed)}</td>`).join("")}</tr></table>
			<p class="cg-p">Year-1 profit = bikes expected × margin − fixed costs.</p><div data-n></div>`);
		later(2600, () => {
			play(n.id === "calm" ? "chime" : "alarm"); setP(Mk);
			for(const k of Object.keys(Mk)){ dock.querySelector(`[data-m="${k}"]`).textContent = eur(Mk[k].margin); dock.querySelector(`[data-d="${k}"]`).textContent = fmt(Mk[k].demand); }
			dock.querySelector("[data-n]").innerHTML = `<div class="cg-ev" style="${n.id === "calm" ? "background:#10283a;border-color:#7fb8e6" : ""}"><b>📰 ${n.t}</b>${n.d}</div><p class="cg-p"><b>Tap the market</b> you recommend, on the map.</p>`;
			say("News is in. Look at the columns, then <b>tap a city</b>.");
			const best = Object.keys(Mk).sort((a, b) => profit(Mk[b]) - profit(Mk[a]))[0];
			onTap = id => {
				if(!Mk[id] || S.market) return;
				if(id !== best){ err(); say(`${Mk[id].name}: ${eur(profit(Mk[id]))}. Compare the three columns: the news moved one of them.`); return; }
				S.market = id; onTap = null; play("good");
				pillars[id].m.material.emissive.set("#ffb347"); pillars[id].m.material.color.set("#ffb347");
				say(`${Mk[id].name}: <b>${eur(profit(Mk[id]))}</b> expected in year 1. Board approved!`);
				dock.querySelector("[data-n]").insertAdjacentHTML("beforeend", `${stars(3)}${course("bp")}${next("abroad", "One last thing… →")}`);
				dock.scrollTop = dock.scrollHeight;
			};
		});
	}

	/* ---------- 6 · L3 · l'année à l'étranger ---------- */
	function abroad(){
		stage("abroad", "6 · A year abroad"); for(const p of Object.values(pillars)) p.g.visible = false; pins.lille.l.visible = false; routes.clear(); show(...UNIS);
		fly(P(25, 30), 230, .6, 0);
		say("Maya: <i>“Great work. You know what? In the Licence, your third year happens abroad.”</i> <b>Tap your city</b>: no wrong answer.");
		dockHTML(`<div class="cg-k">L3 · a year abroad</div><div class="cg-h">Where would you go?</div><p class="cg-p">About <b>200 partner universities</b>. Five examples are lit on the map: Montréal, Dublin, Seoul, Valencia, Bogotá.</p><div data-r></div>`);
		onTap = id => {
			if(!UNIS.includes(id) || S.uni) return;
			S.uni = id; onTap = null; play("swipe");
			const a = at("lille"), b = at(id), mid = a.clone().lerp(b, .5); mid.y = Math.max(10, a.distanceTo(b)*.25);
			const arc = new THREE.QuadraticBezierCurve3(a.clone().setY(1.7), mid, b.clone().setY(1.7)); routeLine(arc, "#a9d2f3", .08);
			fly(mid.clone().setY(0), Math.max(40, a.distanceTo(b)*1.1), .8, 0, 2);
			travel(plane, arc, 3000, () => { play("win"); later(600, end); });
			dock.querySelector("[data-r]").innerHTML = `<p class="cg-p">✈ Lille → <b>${PLACES[id][2]}</b>.</p><p class="cg-p" style="font-size:12.5px;opacity:.75">Example destinations: check the current list of partners with the Licence team.</p>${course("abroad")}`;
		};
	}

	/* ---------- le bilan ---------- */
	function end(){
		stage("abroad", "Report");
		const max = 15, s = S.stars, mention = s >= 13 ? "Très bien" : s >= 10 ? "Bien" : "Assez bien";
		ev("win", mention);
		const order = ["fx", "micro", "trade", "ob", "acc", "law", "bp", "abroad"].filter(k => S.learned.has(k));
		say("Logbook closed. See you in Lille… or wherever the ship takes you.");
		dockHTML(`<div class="cg-k">${formation.name} · report</div><div class="cg-h">First container delivered!</div>
			<div class="cg-stars">${s} / ${max} ★ · ${mention}</div>
			<table class="cg-tbl"><tr><td>Rate locked</td><td>${S.rate ? "€" + S.rate.toFixed(4) : "—"}</td></tr><tr><td>Price in Germany</td><td>${S.price ? eur(S.price) : "—"}</td></tr><tr><td>Incoterm played</td><td>${S.card || "—"}${S.event ? " · " + S.event.t : ""}</td></tr><tr><td>Jolene's trust</td><td>${S.trust} / 100</td></tr><tr><td>Market opened</td><td>${S.market ? MARKETS[S.market].name : "—"}</td></tr><tr><td>Year abroad</td><td>${S.uni ? PLACES[S.uni][2] : "—"}</td></tr><tr><td>Mistakes</td><td>${S.errors}</td></tr></table>
			<p class="cg-p">All in English, like the Licence. You touched ${order.length} courses:</p>
			<ul class="cg-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<p class="cg-p" style="font-size:12.5px;opacity:.8">Replay: the pound, the sea and the news won't behave the same way.</p>
			${jpoCard("en")}${openLead ? `<button class="cg-go" data-a="lead">📄 Get the Licence brochure</button>` : ""}
			<a class="cg-alt" href="${formation.url}" target="_blank" rel="noopener">Discover the ${formation.name} ↗</a>
			<button class="cg-alt" data-a="fav">${isFav() ? "♥ In my notebook" : "♡ Add to my notebook"}</button>
			<button class="cg-alt" data-a="replay">Play again</button>`);
	}

	const STEPS = { fx, price, ship:ship_, call, market, abroad, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ In my notebook" : "♡ Add to my notebook"; }
		if(a === "replay"){ Object.assign(S, { stars:0, errors:0, learned:new Set(), rate:null, price:null, card:null, event:null, trust:50, news:null, M:null, market:null, uni:null }); hud(); routes.clear(); plane.visible = false; fx(); }
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(sayT); timers.forEach(clearTimeout); timers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		controls.dispose(); routes.traverse(o => { if(o.geometry) o.geometry.dispose(); });
		own.forEach(o => o.dispose && o.dispose()); mapT.dispose();
		renderer.dispose(); renderer.forceContextLoss(); root.remove();
		onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".cg-x").addEventListener("click", close);

	raf = requestAnimationFrame(frame);
	fx();       // ouverture à chaud : le cours de la livre bouge déjà
	ev("start");
	ev("missions", [["1 · Lock the rate", fx], ["2 · Price in Germany", price], ["3 · Ship to Austin", ship_], ["4 · The call", call], ["5 · Which market", market], ["6 · Year abroad", abroad], ["Report", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, tap:id => onTap && onTap(id), get dock(){ return dock; }, camera, controls, pins };
}
