/* « Faut-il monter les taux ? » — mini-jeu de la Prépa D2 Économie-Gestion (FGES, avec Marcq Institution, 2026).
   Le métier : économiste au service de conjoncture d'une banque centrale (fictive). Mercredi, 14 h : l'inflation
   vient de bondir à 4,2 % sur un an ; Bernard Vasseur, membre du Conseil, veut monter le taux directeur de 0,50 point
   au vote de jeudi, 9 h. La gouverneure attend la note du service : un seul dossier, cinq gestes du métier :
     1 · l'indice des prix : arracher du graphique les couches volatiles (énergie, alimentation) pour voir l'inflation
         sous-jacente (scène d'ouverture, une minute) — statistique, indices pondérés ;
     2 · l'enquête des prévisionnistes, en anglais : poser le curseur sur la médiane, que la moyenne cache — statistique ;
     3 · les salaires : poser le calque des prix (base 100) sur la courbe des salaires et lire le pouvoir d'achat —
         microéconomie, indices ; la « spirale prix-salaires » de Bernard n'est pas là ;
     4 · la machine : sur une MONIAC (Phillips, 1949) réglée sur le pays, tourner la vanne du taux, tirer le levier et
         regarder la plume tracer l'inflation jusqu'en 2028 ; trouver le taux qui ramène à 2 % — macroéconomie, modèle ;
     5 · le Conseil (le verdict) : à chaque objection, poser la bonne pièce sur le rétroprojecteur, avant la fin du sablier.
   Chaque pièce remplit la note au Conseil, dans le panneau. Banque, personnes et chiffres sont fictifs et simplifiés ;
   contenu à relire par l'équipe de la prépa (docs/validation-prepa-d2.md). */
import { stage3d, THREE } from "./stage3d.js?v=f94719518b";
import { makePerson } from "../kit.js?v=f94719518b";
import { jpoCard } from "./jpo.js?v=f94719518b";
import { palier } from "./palier.js?v=f94719518b";

const COURSES = {
	stats: ["Statistique", "Indices et pondérations", "Un indice des prix est une moyenne pondérée : avant de réagir, on regarde d'où vient la hausse."],
	macro: ["Macroéconomie", "Inflation et politique monétaire", "Choc d'énergie importé ou économie qui surchauffe ? Une banque centrale ne répond pas de la même façon aux deux."],
	en:    ["50 % des cours en anglais", "Economics in English", "Lire une enquête, répondre à un membre étranger du Conseil : en D2, la moitié des cours se font en anglais."],
	med:   ["Mathématiques", "Médiane, moyenne, valeurs extrêmes", "Une seule prévision extrême suffit à tirer la moyenne ; la médiane, elle, ne bouge pas."],
	micro: ["Microéconomie", "Salaire réel et pouvoir d'achat", "Ramener les salaires aux prix, en base 100 : les ménages rattrapent-ils, ou poussent-ils l'inflation ?"],
	modele:["Modélisation · histoire de la pensée", "Modèles macroéconomiques", "De la machine hydraulique de Phillips (1949) aux modèles des banques centrales : simuler avant de décider. Le taux pèse sur l'investissement des entreprises, avec retard."],
	gestion:["Gestion", "Coût du capital", "Quand le taux monte, un projet d'usine qui rapportait assez n'est plus rentable : l'investissement recule, puis l'emploi."],
	oral:  ["Prépa D2", "Oraux et exposés", "Défendre une analyse chiffrée devant un jury : l'oral de l'ENS Paris-Saclay et des magistères s'y prépare chaque semaine."],
	conc:  ["Après la D2", "ENS Paris-Saclay, magistères, Pré-Master EDHEC", "La D2 prépare l'ENS Paris-Saclay (économie-gestion), les magistères d'économie et le Pré-Master de l'EDHEC, avec la Licence internationale d'économie-gestion de la FGES en parallèle. Plus tard : économiste en banque centrale, à l'INSEE, dans un service d'études, chercheur·se…"]
};
const STEPS_UI = [["indice", "Indice"], ["enquete", "Enquête"], ["salaires", "Salaires"], ["machine", "Machine"], ["conseil", "Conseil"]];
const PEOPLE = {
	yasmine: ["Yasmine Benali", "cheffe du service de conjoncture", "YB", "#21b7cb"],
	bernard: ["Bernard Vasseur", "membre du Conseil", "BV", "#b0632a"],
	james:   ["James Whitaker", "membre externe du Conseil", "JW", "#5b4a8a"],
	mathilde:["Mathilde Rousseau", "gouverneure", "MR", "#0f3168"],
	me:      ["Toi", "économiste junior", "★", "#2f6b45"]
};
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const INK = "#0c2340", GREY = "#4f5c69", LIGHT = "#848487", RED = "#c62828", NAVY = "#0f3168", CYAN = "#21b7cb", GREEN = "#2f7d4a";
const SANS = "Inter,Arial,sans-serif", SERIF = "'Tiempos Headline', Times New Roman,serif";
const PXU = 240;      // pixels de texture par unité : des pièces lisibles, même sur téléphone
const fr = (v, d = 1) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d });
const sm = v => { v = Math.max(0, Math.min(1, v)); return v*v*(3 - 2*v); };
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/* ---------- pièce 1 : l'indice des prix, contributions en points (nov. 2024 → oct. 2026) ---------- */
const MONTHS = 24;
const LAYERS = [      // de bas en haut
	{ k:"serv", n:"Services", c:NAVY, end:1.0, why:"Les services (loyers, coiffeurs, restaurants…) suivent les salaires d'ici : c'est le cœur de l'inflation, on le garde." },
	{ k:"ener", n:"Énergie", c:"#e07b24", end:1.8, peel:true },
	{ k:"alim", n:"Alimentation", c:"#7fae3e", end:0.9, peel:true },
	{ k:"bien", n:"Biens manufacturés", c:CYAN, end:0.5, why:"Les biens manufacturés : 0,5 point, sans à-coup depuis deux ans. Rien de volatil, on le garde." }
];
function contrib(k, m){
	const t = m/(MONTHS - 1);
	if(k === "serv") return 1.0 + .06*Math.sin(m*.8)*(1 - t);
	if(k === "bien") return .5 + .05*Math.cos(m*.6)*(1 - t);
	if(k === "alim") return .3 + .6*sm((m - 6)/16);
	return .1 + 1.7*sm((m - 9)/14);
}
/* ---------- pièce 2 : l'enquête des prévisionnistes (inflation attendue en 2028) ---------- */
const FORECASTS = [1.6, 1.8, 1.9, 1.9, 2.0, 2.0, 2.1, 2.1, 2.1, 2.2, 2.2, 2.3, 2.4, 2.6, 8.0];      // moyenne 2,48 · médiane 2,1
const MEAN = FORECASTS.reduce((s, v) => s + v, 0)/FORECASTS.length;
/* ---------- pièce 3 : salaires et prix, base 100 en janvier 2022 (58 mois, jusqu'en octobre 2026) ---------- */
const NM = 58;
const wage = m => 100 + 13.5*Math.pow(m/(NM - 1), 1.15);
const price = m => 100 + 17*(1 - Math.pow(1 - m/(NM - 1), 1.6));
/* ---------- la machine : le taux et la trajectoire de l'inflation ---------- */
const RATE0 = 3.25, BERNARD = 3.75;
const infl2028 = r => 2.0 - 1.2*(r - RATE0);
const chom2028 = r => 7.4 + 1.4*(r - RATE0);
const hist = m => 2.4 - .5*sm(m/14) + 2.3*sm((m - 19)/15);      // janv. 2024 → oct. 2026 (m = 0…34)
const proj = (m, r) => { const t = (m - 34)/25; return 2.0 + 2.2*(1 - t)*(1 - t) - 1.2*(r - RATE0)*Math.pow(t, 1.5); };      // → déc. 2028 (m = 59)
/* ---------- le Conseil ---------- */
const QUESTIONS = [
	{ who:"bernard", q:"4,2 % d'inflation, plus du double de la cible ! Il faut frapper fort : +0,50 point.", ok:"A",
		yes:"La hausse vient de l'énergie et de l'alimentation : 2,7 points sur 4,2. L'inflation sous-jacente est à 2,0 %, pile la cible. Un taux ne fera pas baisser le prix du gaz.", end:"… L'énergie, oui. Mais les salaires ?" },
	{ who:"bernard", q:"Les salaires ont pris 13,5 % depuis 2022. La spirale prix-salaires a commencé.", ok:"B",
		yes:"Les prix ont pris 17 % sur la même période : le pouvoir d'achat a perdu 3 %. Les salariés rattrapent, ils ne poussent pas les prix.", end:"Rattraper… Admettons." },
	{ who:"james", en:true, q:"But forecasters are worried: the average forecast for 2028 is 2.5 %. Expectations are drifting.", ok:"D",
		yes:"<i>The average is pulled up by one forecaster at 8 %. The median is 2.1 %: expectations are anchored.</i>", end:"<i>One outlier… Fair enough. Anchored, then.</i>" },
	{ who:"mathilde", q:"Et si nous suivons quand même Bernard : +0,50 point ?", ok:"E",
		yes:"La machine est formelle : à 3,75 %, l'inflation tombe à 1,4 % en 2028, sous la cible, et le chômage monte à 8,1 %. Le maintien à 3,25 % la ramène à 2,0 %.", end:"Merci. Je crois que le Conseil est prêt à voter." }
];
const SAND = 20;     // secondes pour répondre à une objection

const CSS = `
.mo{position:fixed;inset:0;z-index:40;background:#dfe6ee;font-family:Inter,Arial,sans-serif;font-weight:300;color:${INK};overflow:hidden;user-select:none;-webkit-user-select:none;animation:moIn .4s ease both}
@keyframes moIn{from{opacity:0}}
.mo canvas.mo-3d{position:absolute;inset:0;display:block;touch-action:none}
.mo-x{position:absolute;right:12px;top:10px;z-index:6;width:44px;height:44px;border-radius:50%;border:1px solid rgba(15,49,104,.3);background:rgba(255,255,255,.85);color:${NAVY};font-size:24px;line-height:1;cursor:pointer}
.mo-top{position:absolute;left:16px;top:10px;z-index:4;display:flex;align-items:center;gap:14px;pointer-events:none}
.mo-clock{display:flex;flex-direction:column;background:${NAVY};color:#fff;border-radius:6px;padding:5px 12px 6px;box-shadow:0 6px 18px rgba(12,35,64,.25)}
.mo-clock b{font:300 26px/1.05 'Tiempos Headline',Times New Roman,serif;font-variant-numeric:tabular-nums}
.mo-clock span{font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#bff3fa}
.mo-steps{display:flex;gap:4px;list-style:none;margin:0;padding:0}
.mo-steps li{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:3px;color:${LIGHT};background:rgba(255,255,255,.75);border:1px solid rgba(15,49,104,.15)}
.mo-steps li.done{color:${NAVY};border-color:rgba(33,183,203,.7)}
.mo-steps li.now{background:${NAVY};border-color:${NAVY};color:#fff}
.mo-lost{position:absolute;left:130px;top:18px;z-index:5;font-weight:700;font-size:15px;color:${RED};opacity:0;pointer-events:none}
.mo-lost.mo-on{animation:moLost 1.4s ease both}
@keyframes moLost{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
.mo-msg{position:absolute;left:16px;top:72px;z-index:4;width:min(440px,calc(100% - 410px));display:flex;gap:11px;align-items:flex-start;background:#fff;border-left:5px solid ${CYAN};border-radius:4px;padding:11px 14px;box-shadow:0 12px 30px rgba(12,35,64,.22)}
.mo-msg:empty{display:none}
.mo-msg.pop{animation:moPop .35s ease both}
@keyframes moPop{from{opacity:0;transform:translateY(-6px)}}
.mo-av{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:12.5px;color:#fff}
.mo-mt{flex:1;min-width:0}
.mo-mt small{display:block;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${NAVY};margin-bottom:2px}
.mo-mt small i{font-style:normal;font-weight:300;letter-spacing:.02em;text-transform:none;color:${LIGHT}}
.mo-mt p{margin:0;font-size:14.5px;line-height:1.45;color:${INK}}
.mo-mt p b{font-weight:700}
.mo-task{margin-top:8px!important;padding:6px 10px;border-radius:4px;background:#e4f6f9;color:${NAVY}!important;font-weight:700;font-size:13.5px!important}
.mo-task:before{content:"→ ";color:${CYAN}}
.mo-task.ko{background:#fdecea;color:#8e1f1f!important}.mo-task.ko:before{content:"! ";color:${RED}}
.mo-btn{margin-top:9px;border:0;border-radius:4px;padding:10px 18px;min-height:44px;background:${NAVY};color:#fff;font:700 14px Inter,Arial,sans-serif;cursor:pointer}
.mo-btn:focus-visible{outline:3px solid ${CYAN}}
.mo-sand{height:5px;border-radius:3px;background:#e3e8ee;margin-top:8px;overflow:hidden}
.mo-sand i{display:block;height:100%;background:linear-gradient(90deg,${RED},${CYAN});transform-origin:left;animation:moSand linear both}
@keyframes moSand{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.mo-note{position:absolute;right:14px;top:64px;z-index:3;width:310px;max-height:calc(100% - 80px);overflow:auto;background:#fff;color:${INK};border-radius:4px;box-shadow:0 18px 44px rgba(12,35,64,.3);scrollbar-width:thin}
.mo-note-hd{display:block;width:100%;text-align:left;border:0;background:${NAVY};color:#fff;padding:12px 16px 10px;cursor:default;font:inherit}
.mo-note-hd .k{display:block;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#bff3fa}
.mo-note-hd b{display:block;font:300 19px/1.2 'Tiempos Headline',Times New Roman,serif;margin-top:3px}
.mo-note-hd em{display:none}
.mo-note.flash .mo-note-hd{animation:moFlash .9s ease}
@keyframes moFlash{30%{background:${CYAN}}}
.mo-note-bd{padding:10px 14px 14px}
.mo-q{font-size:12.5px;line-height:1.45;color:${GREY};margin:0 0 8px}
.mo-q b{color:${INK}}
.mo-tiles{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.mo-tile{border:1px solid #dde3ea;border-radius:4px;padding:6px 9px 7px;min-height:52px;box-sizing:border-box}
.mo-tile small{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${LIGHT}}
.mo-tile b{display:block;font:300 22px/1.15 'Tiempos Headline',Times New Roman,serif;color:#b7c0ca;font-variant-numeric:tabular-nums}
.mo-tile i{display:block;font-style:normal;font-size:11px;color:${GREY};line-height:1.3}
.mo-tile.ok{border-color:${CYAN};background:#f0fbfc}.mo-tile.ok b{color:${NAVY}}
.mo-tile.wide{grid-column:1 / -1}
.mo-tile.hot b{color:${RED}}
.mo-bern{margin-top:8px;font-size:12px;line-height:1.4;color:#8a4a1c;background:#fbf1e8;border-radius:4px;padding:6px 9px}
.mo-ov{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:14px;background:rgba(12,35,64,.45)}
.mo-ov[hidden]{display:none}
.mo-card{width:100%;max-width:580px;max-height:100%;overflow:auto;box-sizing:border-box;background:#fff;color:${INK};border-radius:6px;border-top:8px solid ${NAVY};padding:20px 20px 16px;box-shadow:0 26px 70px rgba(0,0,0,.45);user-select:text;-webkit-user-select:text}
.mo-card .k{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${NAVY};margin:0 0 4px}
.mo-card h2{font:300 30px/1.12 'Tiempos Headline',Times New Roman,serif;color:${NAVY};margin:2px 0 8px}
.mo-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px;color:${INK}}
.mo-stamp{display:inline-block;border:3px solid currentColor;border-radius:6px;padding:3px 10px;font:700 13px Inter,Arial,sans-serif;letter-spacing:.16em;transform:rotate(-3deg);margin:2px 0 10px}
.mo-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:6px 0 12px}
.mo-stats div{background:#eef6f8;border-radius:4px;padding:7px 10px;font-size:12px;font-weight:700;color:${GREY}}
.mo-stats b{display:block;font:300 20px 'Tiempos Headline',Times New Roman,serif;color:${NAVY}}
.mo-list{list-style:none;margin:0 0 10px;padding:0}
.mo-list li{font-size:13px;line-height:1.4;padding:6px 0;border-bottom:1px solid #e3e8ee}
.mo-list li span{display:inline-block;background:${NAVY};color:#fff;border-radius:3px;padding:1px 6px;font-size:10.5px;font-weight:700;margin-right:6px}
.mo-go{display:block;width:100%;border:0;border-radius:4px;padding:13px;margin-top:8px;min-height:48px;background:${NAVY};color:#fff;font:700 15px Inter,Arial,sans-serif;cursor:pointer}
.mo-alt{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border:1.5px solid #cdd6e0;border-radius:4px;padding:11px;margin-top:8px;min-height:46px;background:#fff;color:${NAVY};font:700 14px Inter,Arial,sans-serif;cursor:pointer}
@media (max-width:759px){
	.mo-top{left:10px;top:8px}
	.mo-clock{padding:4px 9px}
	.mo-clock b{font-size:21px}
	.mo-clock span{font-size:9.5px}
	.mo-steps{display:none}
	.mo-lost{left:112px;top:14px}
	.mo-x{right:8px;top:6px;width:40px;height:40px}
	.mo-msg{left:8px;right:8px;top:58px;width:auto;padding:9px 11px;gap:9px}
	.mo-av{width:30px;height:30px;font-size:11px}
	.mo-mt p{font-size:13.5px;line-height:1.4}
	.mo-task{font-size:13px!important;margin-top:6px!important}
	.mo-btn{margin-top:7px;min-height:42px;padding:9px 16px}
	.mo-note{left:0;right:0;top:auto;bottom:0;width:auto;max-height:52%;border-radius:10px 10px 0 0}
	.mo-note-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;min-height:48px;box-sizing:border-box}
	.mo-note-hd .k{display:none}
	.mo-note-hd b{flex:1;font-size:16px;margin:0}
	.mo-note-hd em{display:block;font-style:normal;font-size:12px;font-weight:700;color:${NAVY};background:#fff;border-radius:999px;padding:4px 10px;white-space:nowrap}
	.mo-note:not(.open) .mo-note-bd{display:none}
	.mo-card{padding:16px 14px 12px}
	.mo-card h2{font-size:25px}
}
@media (prefers-reduced-motion:reduce){.mo,.mo-msg.pop{animation:none}}
`;

export function openMoniac({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("mo-css")){ const st = document.createElement("style"); st.id = "mo-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "mo";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Faut-il monter les taux ?");
	root.innerHTML = `<canvas class="mo-3d" aria-hidden="true"></canvas>
		<div class="mo-top"><div class="mo-clock"><b>Mer. 14:00</b><span>Conseil jeudi 9 h</span></div>
		<ol class="mo-steps">${STEPS_UI.map(([k, t]) => `<li data-s="${k}">${t}</li>`).join("")}</ol></div>
		<div class="mo-lost">−15 min</div>
		<button class="mo-x" aria-label="Quitter le jeu">×</button>
		<div class="mo-msg" aria-live="polite"></div>
		<aside class="mo-note" aria-label="Ta note au Conseil"><button class="mo-note-hd" type="button"></button><div class="mo-note-bd"></div></aside>
		<div class="mo-ov" hidden><div class="mo-card"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const cv = $("canvas"), msg = $(".mo-msg"), note = $(".mo-note"), noteHd = $(".mo-note-hd"), noteBd = $(".mo-note-bd"), clockEl = $(".mo-clock b"), clockSub = $(".mo-clock span"), lostEl = $(".mo-lost");
	const MOB = () => innerWidth < 760;

	const fresh = () => ({ pts:{}, errs:{}, errors:0, lost:0, learned:[], tiles:{}, runs:[], answers:[], step:null, time:14*60, adopted:false });
	const S = fresh();
	// l'état des pièces, qui se dessinent d'après lui
	const PEEL = { gone:new Set(), drag:null };
	const SV = { x:null, locked:false, hint:false };
	const CQ = { aligned:false };
	let rate = BERNARD, running = null;
	let closed = false, GEN = 0, input = null, btnAuto = null;
	const timers = new Set();
	// toute attente du jeu passe par P : quand on saute d'étape (ou qu'on ferme), les anciennes attentes ne se résolvent plus
	const P = ex => { const g = GEN; return new Promise(res => ex(v => { if(!closed && g === GEN) res(v); })); };
	const wait = ms => P(r => { const t = setTimeout(() => { timers.delete(t); r(); }, ms); timers.add(t); });

	/* ================= la scène : le service de conjoncture, en plein jour ================= */
	const W = stage3d(cv, { panel:note, side:"right", panelW:330, bg:"#dfe6ee", minD:1, maxD:500, maxPolar:1.5, minPolar:0, rotate:false, fov:38 });
	const { scene, camera, M, G, mesh, box, cyl, canvasTex, label } = W;
	const hemi = new THREE.HemisphereLight("#ffffff", "#9a8f80", 1.05); scene.add(hemi);
	const sun = new THREE.DirectionalLight("#fff4e0", 1.25); sun.position.set(-20, 34, 18); sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30, near:1, far:120 }); scene.add(sun);

	const FY = -11;
	const parquet = canvasTex(512, 512, (x, w, h) => { x.fillStyle = "#b8916a"; x.fillRect(0, 0, w, h); for(let i = 0; i < 16; i++){ x.fillStyle = i % 2 ? "#ad865f" : "#c09a72"; x.fillRect(0, i*32, w, 30); x.fillStyle = "rgba(60,40,20,.25)"; x.fillRect(((i*137) % w), i*32, 2, 30); } });
	parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(10, 4);
	mesh(G(new THREE.PlaneGeometry(220, 80)), M("#ffffff", { map:parquet, roughness:.75 }), -20, FY, 0).rotation.x = -Math.PI/2;
	box(220, 34, .6, "#eef0ec", -20, FY, -17);
	// les fenêtres : Lille, l'après-midi
	const city = canvasTex(1024, 512, (x, w, h) => {
		const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9cc8ec"); g.addColorStop(.7, "#dfeefa"); g.addColorStop(1, "#f1ead9"); x.fillStyle = g; x.fillRect(0, 0, w, h);
		x.fillStyle = "#a7b0bd"; for(let X = 0; X < w; X += 44 + (X*7 % 37)){ const bh = 70 + (X*13 % 110); x.fillRect(X, h - bh, 46 + (X % 25), bh); }
		x.fillStyle = "#8d96a8"; x.fillRect(600, h - 300, 50, 300); x.beginPath(); x.moveTo(592, h - 300); x.lineTo(625, h - 380); x.lineTo(658, h - 300); x.fill();
	});
	for(const wx of [-10, 8]){
		mesh(G(new THREE.PlaneGeometry(15, 13)), new THREE.MeshBasicMaterial({ map:city }), wx, 6, -16.6);
		box(15.8, .5, .6, "#f7f7f4", wx, -.75, -16.4); box(15.8, .5, .6, "#f7f7f4", wx, 12.3, -16.4); box(.4, 13, .4, "#f7f7f4", wx, -.5, -16.3);
	}
	// une bibliothèque de rapports
	{ const g = new THREE.Group(); g.position.set(21, FY, -15.6); scene.add(g);
		box(9, 20, 1.6, "#6b4d34", 0, 0, 0, g);
		const cols = ["#0f3168", "#21b7cb", "#c9c2b4", "#8a2a2a", "#4f5c69", "#e0a03a"];
		for(let r = 0; r < 4; r++) for(let i = 0; i < 11; i++) box(.62, 3 + (i*7 % 5)*.18, 1.2, cols[(i + r*3) % cols.length], -4 + i*.78, 1.2 + r*4.6, .5, g); }
	// le bureau
	box(32, .6, 17, M("#c9a77f", { roughness:.55 }), 0, -.6, 0);
	for(const sx of [-1, 1]) for(const sz of [-1, 1]) box(.7, 10.4, .7, "#3a3f47", sx*15, FY, sz*7.6);
	// l'écran : le flash de l'institut statistique
	{ const g = new THREE.Group(); g.position.set(11.5, 0, -5.4); g.rotation.y = -.3; scene.add(g);
		box(1.6, .2, 1.2, "#2b2f36", 0, 0, 0, g); box(.3, 2.2, .3, "#2b2f36", 0, .2, 0, g);
		mesh(G(new THREE.BoxGeometry(7, 4.2, .2)), "#2b2f36", 0, 4.3, 0, g);
		const flash = canvasTex(640, 380, (x, w, h) => { x.fillStyle = "#f4f6f9"; x.fillRect(0, 0, w, h); x.fillStyle = NAVY; x.fillRect(0, 0, w, 50); x.fillStyle = "#fff"; x.font = `700 22px ${SANS}`; x.fillText("Institut de la statistique · 14:00", 18, 33);
			x.fillStyle = LIGHT; x.font = `700 20px ${SANS}`; x.fillText("PRIX À LA CONSOMMATION · OCTOBRE", 18, 100);
			x.fillStyle = RED; x.font = `300 110px ${SERIF}`; x.fillText("+4,2 %", 18, 230);
			x.fillStyle = INK; x.font = `300 24px ${SANS}`; x.fillText("sur un an (septembre : +3,1 %)", 18, 280); x.fillText("Cible de la banque centrale : 2 %", 18, 320); });
		mesh(G(new THREE.PlaneGeometry(6.6, 3.9)), new THREE.MeshBasicMaterial({ map:flash, toneMapped:false }), 0, 4.3, .11, g); }
	// le mug
	{ const g = new THREE.Group(); g.position.set(12.5, 0, 4.5); scene.add(g); cyl(.8, .7, 1.8, CYAN, 0, 0, 0, g); cyl(.72, .72, .05, "#3b2416", 0, 1.7, 0, g); }

	/* --- la machine de Phillips (MONIAC), contre le mur de gauche --- */
	const MX = -52, MZ = -9, MS = 1.45;
	const mach = new THREE.Group(); mach.position.set(MX, FY, MZ); mach.scale.setScalar(MS); scene.add(mach);
	box(16, 14, .5, "#7a4e2a", 0, .5, -.4, mach); box(16.6, .5, 2.2, "#4a2e1a", 0, 0, .4, mach);
	const plate = label("MONIAC · Phillips, 1949", { size:.02, bg:"#0d2a4a", fg:"#ffd27a" }); plate.position.set(0, 15.2, 0); mach.add(plate);
	const glass = new THREE.MeshStandardMaterial({ color:"#d9ecff", transparent:true, opacity:.22, roughness:.05, side:THREE.DoubleSide });
	const waterM = new THREE.MeshStandardMaterial({ color:"#2f8cff", emissive:"#0d4a9a", emissiveIntensity:.35, transparent:true, opacity:.88 });
	function tank(name, x, y, w, h, start){
		const g = new THREE.Group(); g.position.set(x, y, .5); mach.add(g);
		mesh(G(new THREE.BoxGeometry(w, h, 1.2)), glass, 0, h/2, 0, g);
		const water = mesh(G(new THREE.BoxGeometry(w - .15, 1, 1.05)), waterM, 0, 0, 0, g);
		const l = label(name, { size:.016, bg:"#0d2a4a", fg:"#eaf2ff" }); l.center.set(.5, 0); l.position.set(0, h + .3, .6); g.add(l);
		const T = { g, water, h, level:start, target:start, set(v){ T.target = v; } };
		return T;
	}
	const TK = {
		G:tank("GOVERNMENT", -5.5, 10, 2.4, 2.6, .5),
		Y:tank("NATIONAL INCOME", 0, 5, 3.6, 5.4, .6),
		C:tank("CONSUMPTION", -5.5, 3, 2.4, 3.6, .6),
		I:tank("INVESTMENT", 5.5, 1.6, 2.4, 3.2, .5),
		S:tank("SAVINGS", 5.5, 8.6, 2.4, 2.6, .55)
	};
	const pipeM = M("#c9a24a", { metalness:.7, roughness:.3 });
	const pipes = [
		[[-5.5, 10, 1.1], [-2.6, 10, 1.1], [-.8, 9.6, 1.1], [-.6, 10.4, 1.1]],
		[[0, 5, 1.1], [-2, 4.2, 1.1], [-4.3, 4.5, 1.1]],
		[[-5.5, 3, 1.1], [-3.4, 2.4, 1.1], [-1.2, 5.6, 1.1]],
		[[1.8, 9, 1.1], [3.6, 9.4, 1.1], [4.4, 9.8, 1.1]],
		[[5.5, 8.6, 1.1], [4.4, 7.2, 1.3], [5.5, 4.9, 1.1]],
		[[5.5, 1.6, 1.1], [3.2, 2.4, 1.1], [1.6, 5.4, 1.1]]
	].map(pts => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); mesh(G(new THREE.TubeGeometry(c, 30, .12, 8, false)), pipeM, 0, 0, 0, mach); return c; });
	const drops = [];
	for(let i = 0; i < 42; i++){ const d = mesh(G(new THREE.SphereGeometry(.09, 8, 6)), waterM, 0, 0, 0, mach); d.visible = false; drops.push({ d, pipe:i % pipes.length, t:Math.random() }); }
	let flowOn = 0;
	// la vanne du taux d'intérêt, entre l'épargne et l'investissement
	const wheel = new THREE.Group(); wheel.position.set(4.4, 7.2, 1.45); mach.add(wheel);
	const red = M("#b3261e", { metalness:.3, roughness:.4 });
	mesh(G(new THREE.TorusGeometry(.95, .11, 10, 32)), red, 0, 0, 0, wheel);
	for(let i = 0; i < 3; i++){ const s = mesh(G(new THREE.BoxGeometry(1.9, .12, .12)), red, 0, 0, 0, wheel); s.rotation.z = i*Math.PI/3; }
	mesh(G(new THREE.CylinderGeometry(.22, .22, .3, 16)), red, 0, 0, 0, wheel).rotation.x = Math.PI/2;
	const hitM = new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false });
	const wheelHit = new THREE.Mesh(G(new THREE.SphereGeometry(1.8, 12, 8)), hitM); wheel.add(wheelHit);
	const dial = canvasTex(320, 120, () => {});
	const drawDial = () => dial.redraw((x, w, h) => { x.fillStyle = "#0d2a4a"; x.fillRect(0, 0, w, h); x.strokeStyle = "#ffd27a"; x.lineWidth = 4; x.strokeRect(4, 4, w - 8, h - 8); x.fillStyle = "#ffd27a"; x.font = `700 22px ${SANS}`; x.textAlign = "center"; x.fillText("INTEREST RATE", w/2, 38); x.fillStyle = "#fff"; x.font = `700 52px ${SANS}`; x.fillText(`${fr(rate, 2)} %`, w/2, 98); });
	drawDial();
	mesh(G(new THREE.PlaneGeometry(2.4, .9)), new THREE.MeshBasicMaterial({ map:dial, toneMapped:false }), 6.75, 6.9, 1.2, mach);
	// le levier
	const lever = new THREE.Group(); lever.position.set(7.4, 1.4, 1.2); mach.add(lever);
	box(.9, .5, .7, "#2b2f36", 0, 0, 0, lever);
	const arm = new THREE.Group(); arm.position.y = .4; lever.add(arm);
	cyl(.09, .09, 2.2, "#9aa1aa", 0, 0, 0, arm); mesh(G(new THREE.SphereGeometry(.3, 14, 10)), "#b3261e", 0, 2.25, 0, arm);
	arm.rotation.z = .5;
	const leverHit = new THREE.Mesh(G(new THREE.BoxGeometry(2.4, 3.6, 1.6)), hitM); leverHit.position.y = 1.4; lever.add(leverHit);
	{ const l = label("RUN", { size:.018, bg:"#b3261e", fg:"#fff" }); l.position.set(.9, 3.1, .2); lever.add(l); }
	// la table traçante : la plume dessine l'inflation jusqu'en 2028
	const plotT = canvasTex(1100, 680, () => {});
	const PB = new THREE.Group(); PB.position.set(MX + 21.5, FY, MZ + .2); scene.add(PB);
	const PW = 17, PH = 10.5, PYc = 14;
	box(PW + .7, PH + .8, .4, "#4a2e1a", 0, PYc - PH/2 - .4, 0, PB); for(const sx of [-1, 1]) box(.4, PYc - PH/2, .4, "#4a2e1a", sx*(PW/2 - .8), 0, 0, PB);
	mesh(G(new THREE.PlaneGeometry(PW, PH)), new THREE.MeshBasicMaterial({ map:plotT, toneMapped:false }), 0, PYc, .22, PB);
	const pen = mesh(G(new THREE.ConeGeometry(.22, .8, 10)), "#b3261e", 0, PYc, .5, PB); pen.rotation.z = Math.PI;
	function drawPlot(x, w, h, live){
		x.fillStyle = "#fbf8ef"; x.fillRect(0, 0, w, h);
		x.strokeStyle = "rgba(33,183,203,.18)"; x.lineWidth = 1; for(let i = 0; i < w; i += 22){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for(let j = 0; j < h; j += 22){ x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
		const L = w*.08, R = w*.78, T = h*.16, B = h*.86, X = m => L + m/59*(R - L), Y = v => B - v/5*(B - T);
		x.fillStyle = INK; x.font = `700 ${Math.round(h*.045)}px ${SANS}`; x.textAlign = "left"; x.fillText("INFLATION · forecast to 2028 (%)", L, h*.08);
		x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(L, T); x.lineTo(L, B); x.lineTo(R, B); x.stroke();
		x.font = `300 ${Math.round(h*.036)}px ${SANS}`; x.fillStyle = GREY; x.textAlign = "right";
		for(let v = 0; v <= 5; v++){ x.fillText(String(v), L - 8, Y(v) + 7); }
		x.textAlign = "center"; for(let yr = 0; yr < 5; yr++) x.fillText(String(2024 + yr), X(yr*12 + 6), B + h*.06);
		x.fillStyle = "rgba(33,183,203,.18)"; x.fillRect(L, Y(2.1), R - L, Y(1.9) - Y(2.1));
		x.strokeStyle = CYAN; x.setLineDash([10, 8]); x.lineWidth = 2; x.beginPath(); x.moveTo(L, Y(2)); x.lineTo(R, Y(2)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#0f8a9c"; x.textAlign = "left"; x.font = `700 ${Math.round(h*.036)}px ${SANS}`; x.fillText("target 2 %", R + 10, Y(2) + 6);
		x.strokeStyle = "#c9c2b4"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X(34), T); x.lineTo(X(34), B); x.stroke();
		x.fillStyle = LIGHT; x.font = `300 ${Math.round(h*.032)}px ${SANS}`; x.textAlign = "center"; x.fillText("today", X(34), T - 6);
		x.strokeStyle = INK; x.lineWidth = 4; x.lineJoin = "round"; x.beginPath(); for(let m = 0; m <= 34; m++){ m ? x.lineTo(X(m), Y(hist(m))) : x.moveTo(X(m), Y(hist(m))); } x.stroke();
		let pp = null;
		const runs = live ? [...S.runs, live] : S.runs;
		runs.forEach((run, i) => {
			const last = i === runs.length - 1, k = run.k ?? 1, mEnd = 34 + 25*k;
			x.strokeStyle = last ? (Math.abs(infl2028(run.r) - 2) < .05 && k >= 1 ? GREEN : "#b3261e") : "#b8b2a6"; x.lineWidth = last ? 4.5 : 2.5;
			x.beginPath(); for(let m = 34; m <= mEnd + .001; m += .5){ m > 34 ? x.lineTo(X(m), Y(proj(m, run.r))) : x.moveTo(X(m), Y(proj(m, run.r))); } x.stroke();
			if(k >= 1){ x.fillStyle = last ? x.strokeStyle : "#9d968a"; x.font = `700 ${Math.round(h*.034)}px ${SANS}`; x.textAlign = "left"; x.fillText(`${fr(run.r, 2)} % → ${fr(infl2028(run.r))} %`, R + 10, Y(infl2028(run.r)) + (last ? -10 : 18)); }
			if(last) pp = [X(mEnd), Y(proj(mEnd, run.r))];
		});
		const lr = runs[runs.length - 1];
		if(lr && (lr.k ?? 1) >= 1){ x.fillStyle = INK; x.font = `700 ${Math.round(h*.038)}px ${SANS}`; x.textAlign = "left"; x.fillText(`unemployment 2028: ${fr(chom2028(lr.r))} %`, L + 14, T + h*.05); }
		return pp;
	}
	const redrawPlot = live => { let pp = null; plotT.redraw((x, w, h) => { pp = drawPlot(x, w, h, live); }); if(pp){ pen.position.set((pp[0]/1100 - .5)*PW, PYc + (.5 - pp[1]/680)*PH + .4, .5); } };
	redrawPlot();

	/* --- la salle du Conseil, le lendemain matin (plus loin dans la même scène) --- */
	const CX = 120, CF = -10.7;
	mesh(G(new THREE.PlaneGeometry(60, 50)), M("#c9c2b4", { roughness:.9 }), CX, CF, 0).rotation.x = -Math.PI/2;
	box(60, 34, .6, "#ece7dc", CX, CF, -20);
	for(const sx of [-1, 1]) box(.5, 30, 40, "#d8cfbf", CX + sx*24, CF, -2);
	const screenT = canvasTex(1280, 760, (x, w, h) => { x.fillStyle = "#f7f9fb"; x.fillRect(0, 0, w, h); x.fillStyle = NAVY; x.fillRect(0, 0, w, 110); x.fillStyle = "#fff"; x.font = `300 56px ${SERIF}`; x.fillText("Conseil de politique monétaire", 40, 74); x.fillStyle = INK; x.font = `300 40px ${SANS}`; x.fillText("Jeudi 9 h · décision sur le taux directeur (aujourd'hui : 3,25 %)", 40, 220); });
	mesh(G(new THREE.PlaneGeometry(18, 10.7)), new THREE.MeshBasicMaterial({ map:screenT, toneMapped:false }), CX + 5, 15, -19.6);
	box(34, .7, 16, M("#5a3e2b", { roughness:.5 }), CX, -.7, -2);
	for(const sx of [-1, 1]) box(1.2, 10, 10, "#3e2a1d", CX + sx*14, CF, -2);
	// le rétroprojecteur
	const PJ = new THREE.Vector3(CX, 0, -2.6);
	{ const g = new THREE.Group(); g.position.copy(PJ); scene.add(g);
		box(4.2, 1, 4.2, "#d9dde2", 0, 0, 0, g); mesh(G(new THREE.BoxGeometry(3.8, .06, 3.8)), M("#bfefff", { emissive:"#21b7cb", emissiveIntensity:.35 }), 0, 1.03, 0, g);
		box(.25, 4.4, .25, "#9aa1aa", 2.2, 0, -1.6, g); box(1.2, .9, 1.2, "#2b2f36", 1.4, 4.2, -1.6, g); }
	const members = {};
	[["bernard", -9, "pro"], ["mathilde", 0, "senior"], ["james", 9, "pro"]].forEach(([k, x, kind]) => {
		const p = makePerson(scene, true, kind); p.g.scale.setScalar(10.5); p.g.position.set(CX + x, CF, -14.5); members[k] = p;
		const l = label(PEOPLE[k][0], { size:.026, bg:"#ffffff", fg:NAVY }); l.position.set(CX + x, 11.5, -14.5); scene.add(l);
		cyl(2.2, 2.4, 9.2, "#2b2f36", CX + x, CF, -16.6);
	});

	const sheetTags = [["1 · Indice", "A"], ["2 · Enquête", "D"], ["3 · Salaires", "B"], ["4 · Machine", "E"]].map(([t]) => { const l = label(t, { size:.02, bg:NAVY, fg:"#fff" }); l.visible = false; scene.add(l); return l; });

	/* ================= les pièces : du papier, une face dessinée au canvas ================= */
	const docs = {};
	function makeDoc(id, w, h, draw, o = {}){
		const c = document.createElement("canvas"); c.width = Math.round(w*PXU); c.height = Math.round(h*PXU);
		const x = c.getContext("2d"), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = W.renderer.capabilities.getMaxAnisotropy();
		const g = new THREE.Group(); scene.add(g);
		if(!o.film) mesh(G(new THREE.BoxGeometry(w, .06, h)), M("#efece4"), 0, .03, 0, g);
		const face = new THREE.Mesh(G(new THREE.PlaneGeometry(w, h)), new THREE.MeshBasicMaterial({ map:t, toneMapped:false, transparent:!!o.film })); face.rotation.x = -Math.PI/2; face.position.y = .065; g.add(face);
		if(o.film) face.renderOrder = 5;
		G(face.material);
		const D = { id, g, face, c, x, t, w, h, W:c.width, H:c.height, zones:{}, dirty:true, draw, film:o.film };
		face.userData.doc = D; docs[id] = D; g.visible = false;
		return D;
	}
	function redraw(D){
		const x = D.x; D.zones = {};
		x.save();
		if(D.film){ x.clearRect(0, 0, D.W, D.H); x.fillStyle = "rgba(214,232,246,.32)"; x.fillRect(0, 0, D.W, D.H); }
		else { x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, D.W, D.H); }
		D.draw(x, D); x.restore();
		D.t.needsUpdate = true; D.dirty = false;
	}
	function txt(x, s, X, Y, size, o = {}){ x.font = `${o.i ? "italic " : ""}${o.w || 300} ${size}px ${o.serif ? SERIF : SANS}`; x.fillStyle = o.c || INK; x.textAlign = o.a || "left"; x.textBaseline = "alphabetic"; x.fillText(s, X, Y); return x.measureText(s).width; }
	function header(x, D, k, title, sub){
		x.fillStyle = NAVY; x.fillRect(0, 0, D.W, 12);
		txt(x, k, 40, 60, 25, { w:700, c:LIGHT });
		txt(x, title, 40, 110, 44, { serif:true, c:NAVY });
		if(sub) txt(x, sub, 40, 150, 25, { c:GREY });
	}
	const stamp = (x, D, text, c, X, Y) => { x.save(); x.translate(X, Y); x.rotate(-.12); x.globalAlpha = .9; x.strokeStyle = x.fillStyle = c; x.lineWidth = 7; x.font = `700 40px ${SANS}`; x.textAlign = "center"; x.textBaseline = "middle"; const bw = x.measureText(text).width + 40; x.strokeRect(-bw/2, -36, bw, 72); x.fillText(text, 0, 3); x.restore(); };

	/* --- pièce 1 : l'indice des prix --- */
	const A = makeDoc("A", 5.4, 3.6, (x, D) => {
		header(x, D, "PIÈCE 1 · INSTITUT DE LA STATISTIQUE", "D'où vient la hausse des prix ?", "Inflation sur un an, en points, par poste · nov. 2024 – oct. 2026");
		const px0 = 110, px1 = D.W*.6, py0 = 200, py1 = D.H - 92; D.geo = { px0, px1, py0, py1 };
		const X = m => px0 + m/(MONTHS - 1)*(px1 - px0), Y = v => py1 - v/5*(py1 - py0);
		x.strokeStyle = "#e3e0d6"; x.lineWidth = 2;
		for(let v = 0; v <= 5; v++){ x.beginPath(); x.moveTo(px0, Y(v)); x.lineTo(px1, Y(v)); x.stroke(); txt(x, String(v), px0 - 18, Y(v) + 9, 26, { a:"right", c:GREY }); }
		txt(x, "nov. 2024", px0, py1 + 40, 24, { c:GREY }); txt(x, "oct. 2026", px1, py1 + 40, 24, { c:GREY, a:"right" });
		// la pile des couches
		const stack = m => { let b = 0; const o = {}; for(const L of LAYERS){ if(PEEL.gone.has(L.k)) continue; const v = contrib(L.k, m); o[L.k] = [b, b + v]; b += v; } o.top = b; return o; };
		D.stack = stack;
		const band = (k, dx = 0, dy = 0) => { x.beginPath(); for(let m = 0; m < MONTHS; m++){ const s = stack(m)[k]; m ? x.lineTo(X(m) + dx, Y(s[1]) + dy) : x.moveTo(X(m) + dx, Y(s[1]) + dy); } for(let m = MONTHS - 1; m >= 0; m--) x.lineTo(X(m) + dx, Y(stack(m)[k][0]) + dy); x.closePath(); };
		for(const L of LAYERS){
			if(PEEL.gone.has(L.k)) continue;
			if(PEEL.drag && PEEL.drag.k === L.k){ band(L.k); x.save(); x.setLineDash([10, 8]); x.strokeStyle = L.c; x.lineWidth = 3; x.stroke(); x.restore(); continue; }
			band(L.k); x.fillStyle = L.c; x.globalAlpha = .88; x.fill(); x.globalAlpha = 1;
		}
		// la courbe du total
		x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); for(let m = 0; m < MONTHS; m++){ const t = stack(m).top; m ? x.lineTo(X(m), Y(t)) : x.moveTo(X(m), Y(t)); } x.stroke();
		const top = stack(MONTHS - 1).top, core = PEEL.gone.size === 2;
		txt(x, core ? "sous-jacente" : PEEL.gone.size ? "reste" : "inflation", px1 + 12, Y(top) - 6, 24, { w:700, c:INK }); txt(x, PEEL.gone.size ? `${fr(top)} pt` : "4,2 %", px1 + 12, Y(top) + 24, 28, { w:700, c:core ? GREEN : RED });
		x.strokeStyle = CYAN; x.setLineDash([12, 9]); x.lineWidth = 3; x.beginPath(); x.moveTo(px0, Y(2)); x.lineTo(px1, Y(2)); x.stroke(); x.setLineDash([]);
		txt(x, "cible 2 %", px0 + 10, Y(2) - 10, 24, { w:700, c:"#0f8a9c" });
		// la légende : chaque étiquette est une poignée
		const lx = D.W*.755, lw = D.W - 30 - lx;
		let ly = 200;
		for(const L of [...LAYERS].reverse()){
			const gone = PEEL.gone.has(L.k);
			x.fillStyle = gone ? "#f1efe9" : "#ffffff"; x.strokeStyle = gone ? "#d9d5c8" : L.c; x.lineWidth = 3; x.fillRect(lx, ly, lw, 92); x.strokeRect(lx, ly, lw, 92);
			x.fillStyle = gone ? "#c9c5ba" : L.c; x.fillRect(lx, ly, 18, 92);
			txt(x, L.n, lx + 32, ly + 38, 25, { w:700, c:gone ? "#a8a49a" : INK });
			txt(x, gone ? "retiré du graphique" : `${fr(L.end)} point`, lx + 32, ly + 74, 24, { c:gone ? "#a8a49a" : GREY });
			D.zones["lg_" + L.k] = [lx, ly, lx + lw, ly + 92];
			ly += 110;
		}
		if(core){ txt(x, "1,5 point sur les ¾ du panier", lx, ly + 30, 23, { w:700, c:GREEN }); txt(x, "= +2,0 % sur un an", lx, ly + 62, 23, { w:700, c:GREEN }); }
		// la couche qu'on arrache suit le doigt
		if(PEEL.drag){ const L = LAYERS.find(l => l.k === PEEL.drag.k); band(L.k, PEEL.drag.dx, PEEL.drag.dy); x.fillStyle = L.c; x.globalAlpha = .7; x.fill(); x.globalAlpha = 1; x.strokeStyle = "#fff"; x.lineWidth = 3; x.stroke(); }
	});
	function layerAt(D, p){
		for(const L of LAYERS){ const r = D.zones["lg_" + L.k]; if(r && p.x >= r[0] && p.x <= r[2] && p.y >= r[1] && p.y <= r[3]) return PEEL.gone.has(L.k) ? null : L.k; }
		const { px0, px1, py0, py1 } = D.geo;
		if(p.x < px0 - 10 || p.x > px1 + 10 || p.y < py0 - 20 || p.y > py1 + 10) return null;
		const m = Math.max(0, Math.min(MONTHS - 1, Math.round((p.x - px0)/(px1 - px0)*(MONTHS - 1)))), v = (py1 - p.y)/(py1 - py0)*5, s = D.stack(m);
		let best = null, bd = .25;
		for(const L of LAYERS){ const r = s[L.k]; if(!r) continue; const d = v < r[0] ? r[0] - v : v > r[1] ? v - r[1] : 0; if(d < bd){ bd = d; best = L.k; } }
		return best;
	}

	/* --- pièce 2 : l'enquête des prévisionnistes, en anglais --- */
	const Dd = makeDoc("D", 5.2, 3.1, (x, D) => {
		header(x, D, "PIECE 2 · SURVEY OF PROFESSIONAL FORECASTERS · Q4 2026", "What will inflation be in 2028?", "15 forecasters, one dot each (%)");
		const ax0 = 90, ax1 = D.W*.74, base = D.H - 120, brk = D.W - 120;
		const vx = v => v > 3 ? brk : ax0 + (v - 1.5)/1.3*(ax1 - ax0);
		D.geo = { ax0, ax1, base, brk, vx };
		x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(ax0 - 20, base); x.lineTo(ax1 + 30, base); x.moveTo(ax1 + 70, base); x.lineTo(D.W - 50, base); x.stroke();
		x.lineWidth = 3; for(const o of [30, 52]){ x.beginPath(); x.moveTo(ax1 + o - 8, base + 14); x.lineTo(ax1 + o + 8, base - 14); x.stroke(); }
		for(let i = 0; i <= 13; i++){ const v = 1.5 + i*.1, X = vx(v); x.beginPath(); x.moveTo(X, base); x.lineTo(X, base + (i % 2 ? 10 : 18)); x.stroke(); if(i % 2 === 0) txt(x, v.toFixed(1), X, base + 50, 25, { a:"center", c:GREY }); }
		x.beginPath(); x.moveTo(brk, base); x.lineTo(brk, base + 18); x.stroke(); txt(x, "8.0", brk, base + 50, 25, { a:"center", c:GREY });
		const seen = {};
		for(const v of FORECASTS){ const n = seen[v] = (seen[v] || 0) + 1, X = vx(v), Y = base - 34 - (n - 1)*52; x.fillStyle = v > 3 ? "#b3261e" : NAVY; x.beginPath(); x.arc(X, Y, 21, 0, 7); x.fill(); }
		txt(x, "“Doomsday Capital”", brk, base - 80, 22, { a:"center", i:true, c:"#b3261e" });
		const mx = vx(MEAN); x.strokeStyle = "#b3261e"; x.setLineDash([8, 7]); x.lineWidth = 2.5; x.beginPath(); x.moveTo(mx, 190); x.lineTo(mx, base); x.stroke(); x.setLineDash([]);
		txt(x, "Average: 2.5 %", mx + 14, 214, 25, { w:700, c:"#b3261e" });
		if(SV.x != null){
			const cx = SV.x; x.strokeStyle = SV.locked ? GREEN : CYAN; x.lineWidth = 7; x.beginPath(); x.moveTo(cx, 180); x.lineTo(cx, base + 6); x.stroke();
			x.fillStyle = SV.locked ? GREEN : CYAN; x.beginPath(); x.moveTo(cx - 26, base + 60); x.lineTo(cx + 26, base + 60); x.lineTo(cx, base + 24); x.fill();
			if(SV.locked) txt(x, "Median: 2.1 %", cx - 14, 180, 30, { w:700, c:GREEN, a:"right" });
		}
		if(SV.hint && !SV.locked){ let i = 0; const seen2 = {}; for(const v of FORECASTS){ i++; const n = seen2[v] = (seen2[v] || 0) + 1, X = vx(v), Y = base - 34 - (n - 1)*52; txt(x, String(i), X, Y + 9, 22, { a:"center", w:700, c:"#fff" }); } }
	});

	/* --- pièce 3 : les salaires, et le calque des prix --- */
	const PL = { px0:110, py0:200, yMin:95, yMax:120 };
	const plotXY = (D, m, v) => { const px1 = D.W - 70, py1 = D.H - 80; return [PL.px0 + m/(NM - 1)*(px1 - PL.px0), py1 - (v - PL.yMin)/(PL.yMax - PL.yMin)*(py1 - PL.py0)]; };
	const B = makeDoc("B", 5.0, 3.5, (x, D) => {
		header(x, D, "PIÈCE 3 · SALAIRES", "Salaire moyen par tête", "Indice, base 100 en janvier 2022");
		const py1 = D.H - 80, px1 = D.W - 70;
		x.strokeStyle = "#e3e0d6"; x.lineWidth = 2;
		for(let v = 95; v <= 120; v += 5){ const [, Y] = plotXY(D, 0, v); x.beginPath(); x.moveTo(PL.px0, Y); x.lineTo(px1, Y); x.stroke(); txt(x, String(v), PL.px0 - 16, Y + 9, 25, { a:"right", c:GREY }); }
		for(let yr = 0; yr < 5; yr++){ const [X] = plotXY(D, yr*12, 100); txt(x, String(2022 + yr), X + 4, py1 + 40, 24, { c:GREY }); x.beginPath(); x.moveTo(X, py1); x.lineTo(X, py1 + 10); x.stroke(); }
		const [ox, oy] = plotXY(D, 0, 100); D.cross = [ox, oy];
		x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.arc(ox, oy, 16, 0, 7); x.moveTo(ox - 26, oy); x.lineTo(ox + 26, oy); x.moveTo(ox, oy - 26); x.lineTo(ox, oy + 26); x.stroke();
		if(CQ.aligned){
			x.beginPath(); for(let m = 0; m < NM; m++){ const [X, Y] = plotXY(D, m, price(m)); m ? x.lineTo(X, Y) : x.moveTo(X, Y); } for(let m = NM - 1; m >= 0; m--){ const [X, Y] = plotXY(D, m, wage(m)); x.lineTo(X, Y); } x.closePath(); x.fillStyle = "rgba(198,40,40,.16)"; x.fill();
			x.strokeStyle = RED; x.lineWidth = 4; x.beginPath(); for(let m = 0; m < NM; m++){ const [X, Y] = plotXY(D, m, price(m)); m ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
			const [ex, ey] = plotXY(D, NM - 1, price(NM - 1)); txt(x, "prix 117", ex - 8, ey + 34, 26, { w:700, c:RED, a:"right" });
			const [gx, gy] = plotXY(D, 40, (price(40) + wage(40))/2);
			txt(x, "pouvoir d'achat : −3 %", gx, gy + 11, 30, { w:700, c:RED, a:"center" });
			stamp(x, D, "PAS DE SPIRALE", GREEN, D.W*.36, D.H*.42);
		}
		x.strokeStyle = "#1d5fa8"; x.lineWidth = 5; x.beginPath(); for(let m = 0; m < NM; m++){ const [X, Y] = plotXY(D, m, wage(m)); m ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
		const [wx, wy] = plotXY(D, NM - 1, wage(NM - 1)); txt(x, "salaires 113,5", wx - 8, wy + 44, 26, { w:700, c:"#1d5fa8", a:"right" });
		// l'annotation de Bernard, à la main
		x.save(); x.translate(D.W*.3, D.H*.27); x.rotate(-.05); txt(x, "+13,5 % : la spirale ! — B.V.", 0, 0, 34, { i:true, w:700, c:"#b0632a" }); x.restore();
	});
	const Cq = makeDoc("Cq", 5.0, 3.5, (x, D) => {
		x.strokeStyle = "rgba(15,49,104,.5)"; x.lineWidth = 4; x.strokeRect(4, 4, D.W - 8, D.H - 8);
		txt(x, "CALQUE · PRIX À LA CONSOMMATION", 40, 60, 25, { w:700, c:RED });
		txt(x, "base 100 en janvier 2022", 40, 96, 25, { c:RED });
		x.strokeStyle = RED; x.lineWidth = 4; x.beginPath(); for(let m = 0; m < NM; m++){ const [X, Y] = plotXY(D, m, price(m)); m ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
		const [ox, oy] = plotXY(D, 0, 100); D.cross = [ox, oy];
		x.lineWidth = 3; x.beginPath(); x.arc(ox, oy, 16, 0, 7); x.moveTo(ox - 30, oy); x.lineTo(ox + 30, oy); x.moveTo(ox, oy - 30); x.lineTo(ox, oy + 30); x.stroke();
		txt(x, "100", ox + 22, oy - 18, 26, { w:700, c:RED });
	}, { film:true });

	/* --- pièce 4 : la sortie de la table traçante, pour le Conseil --- */
	const E = makeDoc("E", 5.0, 3.1, (x, D) => { drawPlot(x, D.W, D.H); txt(x, "PIÈCE 4 · MACHINE", D.W - 30, 40, 22, { w:700, c:LIGHT, a:"right" }); });

	/* ================= animations ================= */
	const tweens = new Set();
	const tween = (dur, fn) => P(r => tweens.add({ t:0, dur, fn, r }));
	function moveTo(obj, to, o = {}){
		const from = obj.position.clone(), r0 = obj.rotation.y, r1 = o.ry ?? 0, lift = o.lift ?? 1.4;
		obj.visible = true;
		return tween(o.dur || .55, k => { obj.position.lerpVectors(from, to, k); obj.position.y += lift*4*k*(1 - k); obj.rotation.y = r0 + (r1 - r0)*k; });
	}

	W.onFrame(tick);
	function tick(now, dt){
		if(!isFinite(camera.position.x + W.controls.target.x)){ camera.position.set(0, 30, 12); W.controls.target.set(0, 0, 0); W.resize(); refit(); }
		for(const tw of [...tweens]){ tw.t += dt; const k = Math.min(1, tw.t/tw.dur); tw.fn(W.ease(k)); if(k >= 1){ tweens.delete(tw); tw.r(); } }
		for(const D of Object.values(docs)) if(D.dirty && D.g.visible) redraw(D);
		for(const T of Object.values(TK)){ T.level += (T.target - T.level)*Math.min(1, dt*1.8); const hh = Math.max(.02, Math.min(1, T.level))*(T.h - .2); T.water.scale.y = hh; T.water.position.y = .1 + hh/2; }
		for(const q of drops){ q.d.visible = flowOn > 0; if(!flowOn) continue; q.t = (q.t + dt*.5) % 1; q.d.position.copy(pipes[q.pipe].getPointAt(q.t)); }
		if(flowOn > 0) flowOn = Math.max(0, flowOn - dt);
		wheel.rotation.z += ((-(rate - 2.5)*2.4) - wheel.rotation.z)*Math.min(1, dt*8);
		for(const k in members){ const p = members[k]; p.g.position.y = CF + (p.bob > 0 ? Math.sin(p.bob*Math.PI)*.5 : 0); if(p.bob > 0) p.bob = Math.max(0, p.bob - dt*1.6); }
	}

	/* ================= cadrer la caméra sur une zone du bureau ================= */
	let lastFit = null, fitTop = 0;
	function area(){
		const vw = innerWidth, vh = innerHeight, mob = MOB(), d = mob ? Math.min(vh*.55, note.offsetHeight + 8) : 0;
		const mb = msg.innerHTML ? msg.getBoundingClientRect().bottom : 0;
		const top = Math.max(mob ? 150 : 110, mb + 10);
		return { top, aw:mob ? vw - 12 : vw - 330 - 40, ah:(mob ? vh - d : vh) - top - (mob ? 8 : 24) };
	}
	function fit(cx, cz, w, h, polar = .1, dur = 1){
		lastFit = [cx, cz, w, h, polar];
		const vh = innerHeight, mob = MOB(), th = Math.tan(camera.fov*Math.PI/360);
		const d = mob ? Math.min(vh*.55, note.offsetHeight + 8) : 0, fullH = vh + d;
		const { top, aw, ah } = area(); fitTop = top;
		const Dd = fullH/(2*th)*Math.max(w/aw, h/ah);
		const visC = (mob ? vh - d : vh)/2, want = top + ah/2, wpp = 2*Dd*th/fullH;
		const k = camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1;
		W.fly(new THREE.Vector3(cx, 0, cz - (want - visC)*wpp*Math.cos(polar)), Dd/k, polar, 0, dur);
	}
	let lastView = null, lastFront = null;
	const view = (t, dist, polar, az, dur = 1.2) => { lastFit = null; lastFront = null; lastView = [t, dist, polar, az]; W.fly(t, dist, polar, az, dur); };
	// un cadrage de face (la machine, debout) : la boîte w × h tient dans la place libre, sous le message
	function fitFront(cx, cy, cz, w, h, dur = 1.4){
		const vh = innerHeight, mob = MOB(), th = Math.tan(camera.fov*Math.PI/360);
		const d = mob ? Math.min(vh*.55, note.offsetHeight + 8) : 0, fullH = vh + d;
		const { top, aw, ah } = area();
		const Dd = fullH/(2*th)*Math.max(w/aw, h/ah);
		const visC = (mob ? vh - d : vh)/2, want = top + ah/2, wpp = 2*Dd*th/fullH;
		const k = camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1;
		view(new THREE.Vector3(cx, cy + (want - visC)*wpp, cz), Dd/k, 1.5, 0, dur);
		lastFront = [cx, cy, cz, w, h];
	}
	function refit(){ if(lastFit) fit(...lastFit, .35); else if(lastFront) fitFront(...lastFront, .35); else if(lastView) W.fly(...lastView, .35); }
	addEventListener("resize", refit);
	noteHd.addEventListener("click", () => { if(!MOB()) return; note.classList.toggle("open"); play("pop"); setTimeout(refit, 60); });

	/* ================= poser des pièces sur le bureau ================= */
	const PILE = new THREE.Vector3(-12.5, 0, 3.6);
	let onDesk = [];
	async function lay(ids, o = {}){
		const gap = .45, list = ids.map(i => docs[i]), { aw, ah } = area();
		const rowW = list.reduce((s, D) => s + D.w, 0) + gap*(list.length - 1), rowH = Math.max(...list.map(D => D.h));
		const colW = Math.max(...list.map(D => D.w)), colH = list.reduce((s, D) => s + D.h, 0) + gap*(list.length - 1);
		const tall = Math.min(aw/colW, ah/colH) > Math.min(aw/rowW, ah/rowH);
		for(const D of onDesk) if(!ids.includes(D.id)){ const k = Math.random(); moveTo(D.g, new THREE.Vector3(PILE.x + k*.6, .08 + Math.random()*.1, PILE.z + k*.4), { ry:.3 + k*.3, dur:.5 }); }
		const tw = tall ? colW : rowW, th = tall ? colH : rowH;
		const cz = o.cz ?? .4;
		let cur = tall ? cz - th/2 : -tw/2;
		const moves = list.map((D, i) => {
			let p;
			if(tall){ p = new THREE.Vector3(0, .1 + i*.01, cur + D.h/2); cur += D.h + gap; }
			else { p = new THREE.Vector3(cur + D.w/2, .1 + i*.01, cz); cur += D.w + gap; }
			if(!D.g.visible){ D.g.position.copy(PILE).setY(.1); D.g.rotation.set(0, .4, 0); }
			D.dirty = true; D.g.visible = true;
			return moveTo(D.g, p, { ry:0, dur:.6 });
		});
		onDesk = [...new Set([...onDesk, ...list])];
		if(!o.nofit) fit(0, cz, tw + .6, th + .6, o.polar ?? .1);
		await Promise.all(moves);
	}

	/* ================= les gestes : un seul système de pointeur, chaque étape fournit ses réactions ================= */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	const setRay = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); };
	// le point visé, en pixels de la pièce (même hors de la pièce : on prolonge son plan)
	function docPt(D){
		const n = new THREE.Vector3(0, 1, 0).applyQuaternion(D.g.getWorldQuaternion(new THREE.Quaternion()));
		const o = D.g.localToWorld(new THREE.Vector3(0, .065, 0));
		const hit = ray.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), new THREE.Vector3());
		if(!hit) return { x:-1e4, y:-1e4, in:false, w:null };
		const l = D.g.worldToLocal(hit.clone()), s = D.g.scale.x;
		const x = (l.x/D.w + .5)*D.W, y = (l.z/D.h + .5)*D.H;
		return { x, y, in:D.g.visible && x >= 0 && x <= D.W && y >= 0 && y <= D.H, w:hit, s };
	}
	const groundPt = y => ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), new THREE.Vector3());
	let ptr = null;
	cv.addEventListener("pointerdown", e => {
		if(!input || e.button > 0) return;
		setRay(e); ptr = { x:e.clientX, y:e.clientY, cap:false };
		if(input.down && input.down(e, ptr)){ ptr.cap = true; W.controls.enabled = false; try{ cv.setPointerCapture(e.pointerId); } catch(_){} }
	});
	cv.addEventListener("pointermove", e => { if(!ptr || !ptr.cap || !input) return; setRay(e); input.move && input.move(e, ptr); });
	const endPtr = e => {
		if(!ptr) return;
		const p = ptr; ptr = null; W.controls.enabled = true;
		if(!input) return; setRay(e);
		const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
		if(p.cap) input.up && input.up(e, moved, p); else if(moved < 12 && input.tap) input.tap(e);
	};
	cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
	// une tâche : ses réactions au pointeur, et done() qui la termine
	const task = make => P(res => { const T = make(() => { if(input === T) input = null; res(); }); input = T; });

	/* ================= l'interface : messages, note, horloge ================= */
	let lastSay = null;
	function say(who, html, o = {}){
		if(o.hint){ if(lastSay) render(lastSay.who, lastSay.html, { ...lastSay.o, ko:o.hint }); return; }
		lastSay = { who, html, o }; return render(who, html, o);
	}
	function render(who, html, o){
		const [n, role, ini, col] = PEOPLE[who];
		msg.innerHTML = `<div class="mo-av" style="background:${col}">${ini}</div><div class="mo-mt"><small>${n} <i>· ${role}</i></small><p>${html}</p>
			${o.ko ? `<p class="mo-task ko">${o.ko}</p>` : o.task ? `<p class="mo-task">${o.task}</p>` : ""}
			${o.sand ? `<div class="mo-sand"><i style="animation-duration:${o.sand}s;animation-delay:-${o.t0 ? Math.min(o.sand, (performance.now() - o.t0)/1000).toFixed(2) : 0}s"></i></div>` : ""}
			${o.btn ? `<button class="mo-btn" type="button">${o.btn}</button>` : ""}</div>`;
		msg.classList.remove("pop"); void msg.offsetWidth; msg.classList.add("pop");
		if(lastFit && msg.getBoundingClientRect().bottom + 10 - fitTop > 30) fit(...lastFit, .5);
		if(o.btn) return P(r => { const b = msg.querySelector(".mo-btn"); const go = () => { btnAuto = null; play("pop"); r(); }; b.onclick = go; btnAuto = go; setTimeout(() => b.focus({ preventScroll:true }), 300); });
	}
	const next = (who, html, btn = "Continuer →") => say(who, html, { btn });
	function stage(k, title, time){
		S.step = k; ev("stage", title); input = null; btnAuto = null;
		root.querySelectorAll(".mo-steps li").forEach(li => { const i = STEPS_UI.findIndex(s => s[0] === li.dataset.s), n = STEPS_UI.findIndex(s => s[0] === k); li.className = i < n ? "done" : i === n ? "now" : ""; });
		S.time = Math.max(time, S.time); showClock();
	}
	const fmt = m => { const d = m >= 1440 ? "Jeu." : "Mer."; m = Math.round(m) % 1440; return `${d} ${String(Math.floor(m/60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
	function showClock(){ clockEl.textContent = fmt(S.time); const left = 1440 + 540 - S.time; clockSub.textContent = left > 0 ? `Conseil dans ${Math.floor(left/60)} h${left % 60 ? String(left % 60).padStart(2, "0") : ""}` : "Le Conseil siège"; }
	function err(why, k){
		S.errors++; S.lost += 15; S.time += 15; showClock(); play("bad"); ev("err", why);
		if(k) S.errs[k] = (S.errs[k] || 0) + 1;
		lostEl.classList.remove("mo-on"); void lostEl.offsetWidth; lostEl.classList.add("mo-on");
	}
	function learn(...ks){ for(const k of ks) if(!S.learned.includes(k)) S.learned.push(k); }
	const TILES = [
		["infl", "Inflation sur un an", "4,2 %", "flash de 14 h", "hot"],
		["core", "Sous-jacente", "", "hors énergie et alimentation"],
		["exp", "Anticipations 2028", "", "médiane des prévisionnistes"],
		["real", "Pouvoir d'achat", "", "salaires ÷ prix, depuis 2022"],
		["rate", "Taux recommandé", "", "aujourd'hui : 3,25 %", "wide"]
	];
	function tile(k, v, sub){ S.tiles[k] = [v, sub]; renderNote(); note.classList.remove("flash"); void note.offsetWidth; note.classList.add("flash"); }
	function renderNote(){
		const n = Object.keys(S.tiles).length;
		noteHd.innerHTML = `<span class="k">Note au Conseil · jeudi 9 h</span><b>Faut-il monter les taux ?</b><em>${n} / 4 ▾</em>`;
		noteBd.innerHTML = `<p class="mo-q"><b>Pour</b> Mathilde Rousseau, gouverneure · <b>Question</b> l'inflation bondit : faut-il monter le taux directeur ?</p>
			<div class="mo-tiles">${TILES.map(([k, t, v0, sub0, cl]) => { const v = S.tiles[k]; return `<div class="mo-tile${v || v0 ? " ok" : ""}${cl ? " " + cl : ""}"><small>${t}</small><b>${v ? v[0] : v0 || "?"}</b><i>${v ? v[1] : sub0}</i></div>`; }).join("")}</div>
			<div class="mo-bern"><b>Proposition de Bernard Vasseur :</b> monter de 0,50 point, à 3,75 %.</div>`;
	}
	const score = (k, v, max) => { S.pts[k] = [Math.max(0, Math.min(max, v)), max]; };

	/* ================= 1 · l'indice des prix (scène d'ouverture) ================= */
	async function indice(){
		stage("indice", "1 · L'indice des prix", 14*60);
		PEEL.gone.clear(); PEEL.drag = null; A.dirty = true;
		W.place(new THREE.Vector3(2, 2, -6), 40, 1.12, .25);
		say("yasmine", `<b>14 h.</b> L'inflation vient de tomber : <b>4,2 %</b> sur un an, deux fois la cible. Bernard Vasseur veut monter les taux de 0,50 point au Conseil de <b>jeudi, 9 h</b>. Avant de suivre, on regarde d'où vient la hausse.`, { task:"Arrache du graphique les 2 postes volatils, qui ne disent rien de l'économie d'ici" });
		await wait(1300);
		await lay(["A"]);
		await task(done => ({
			down(){ const p = docPt(A); if(!p.in) return false; const k = layerAt(A, p); if(!k) return false; PEEL.drag = { k, x0:p.x, y0:p.y, dx:0, dy:0 }; A.dirty = true; play("swipe"); return true; },
			move(){ const p = docPt(A); if(!PEEL.drag || !p.w) return; PEEL.drag.dx = p.x - PEEL.drag.x0; PEEL.drag.dy = p.y - PEEL.drag.y0; A.dirty = true; },
			up(){
				const d = PEEL.drag; PEEL.drag = null; A.dirty = true; if(!d) return;
				const L = LAYERS.find(l => l.k === d.k);
				if(Math.hypot(d.dx, d.dy) < 150){ say(null, null, { hint:`Attrape la couche « ${L.n} » et <b>tire-la</b> hors du graphique.` }); return; }
				if(!L.peel){ err("indice : poste stable arraché", "peel"); say("yasmine", L.why, { task:"Arrache les postes volatils : ceux qui bondissent avec les cours mondiaux" }); return; }
				PEEL.gone.add(d.k); play("good");
				if(PEEL.gone.size < 2){ say("yasmine", d.k === "ener" ? "L'énergie : 1,8 point à elle seule, et ses prix se fixent sur les marchés mondiaux, pas ici. Il reste un poste qui bondit avec la météo et les cours." : "L'alimentation : récoltes, cours mondiaux, météo. Volatile. Il reste un poste qui suit les cours mondiaux.", { task:"Arrache encore un poste volatil" }); return; }
				done();
			},
			auto(){ PEEL.gone.add("ener"); PEEL.gone.add("alim"); A.dirty = true; done(); }
		}));
		tile("core", "2,0 %", "1,5 point sur ¾ du panier");
		score("indice", 3 - (S.errs.peel || 0), 3); learn("stats", "macro");
		await wait(500);
		say("yasmine", "Sans l'énergie et l'alimentation, il reste <b>1,5 point</b> pour les trois quarts du panier : l'inflation <b>sous-jacente</b> est à <b>2,0 %</b>, pile la cible. Le choc vient du gaz et des récoltes, pas de l'économie d'ici.");
		await wait(2200);
	}

	/* ================= 2 · l'enquête des prévisionnistes (en anglais) ================= */
	async function enquete(){
		stage("enquete", "2 · L'enquête, en anglais", 16*60);
		SV.x = null; SV.locked = false; SV.hint = false; redraw(Dd); SV.x = Dd.geo.vx(MEAN); Dd.dirty = true;
		await lay(["D"]);
		await next("james", "<i>Hi! Before tomorrow's vote: the new survey of professional forecasters. The average forecast for 2028 is 2.5 %. If expectations drift up, inflation will stick. That worries me.</i>", "Regarder l'enquête →");
		say("yasmine", "James regarde la <b>moyenne</b>. Méfie-toi : une moyenne se laisse tirer par un seul extrême. Cherche la <b>médiane</b> : la prévision du milieu, autant de points au-dessous qu'au-dessus.", { task:"Slide the cursor to the median forecast, then let go" });
		await task(done => ({
			down(){ const p = docPt(Dd); if(!p.in) return false; SV.x = Math.max(60, Math.min(Dd.W - 60, p.x)); Dd.dirty = true; play("swipe"); return true; },
			move(){ const p = docPt(Dd); if(!p.w) return; SV.x = Math.max(60, Math.min(Dd.W - 60, p.x)); Dd.dirty = true; },
			up(){
				const { vx } = Dd.geo; let below = 0, at = 0, above = 0;
				for(const v of FORECASTS){ const d = vx(v) - SV.x; if(Math.abs(d) < 24) at++; else if(d < 0) below++; else above++; }
				if(below === above && at > 0){ SV.x = vx(2.1); SV.locked = true; Dd.dirty = true; play("good"); done(); return; }
				err("enquête : pas la médiane", "med"); if((S.errs.med || 0) >= 2){ SV.hint = true; Dd.dirty = true; }
				say("yasmine", `Sous le curseur : <b>${below}</b> point${below > 1 ? "s" : ""} à gauche, <b>${above}</b> à droite. La médiane coupe les 15 en deux : 7 de chaque côté, et elle au milieu.`, { task:"Slide the cursor to the median forecast" });
			},
			auto(){ SV.x = Dd.geo.vx(2.1); SV.locked = true; Dd.dirty = true; done(); }
		}));
		tile("exp", "2,1 %", "médiane ; moyenne 2,5 %");
		score("enquete", 2 - (S.errs.med || 0), 2); learn("med", "en");
		await next("yasmine", "<b>2,1 %.</b> Quatorze prévisionnistes sur quinze attendent entre 1,6 et 2,6 %. Un seul, à 8 %, tire la moyenne à 2,5 %. Les anticipations sont <b>ancrées</b> : les marchés croient au retour à 2 %.");
	}

	/* ================= 3 · les salaires et le calque des prix ================= */
	async function salaires(){
		stage("salaires", "3 · Les salaires", 18*60 + 30);
		CQ.aligned = false; B.dirty = true; Cq.dirty = true; Cq.g.scale.setScalar(1);
		await lay(["B"], { nofit:true });
		const tall = camera.aspect < 1;
		const off = tall ? new THREE.Vector3(.4, .3, 2.4) : new THREE.Vector3(1.5, .3, 1.0);
		Cq.g.visible = true; Cq.g.position.copy(B.g.position).add(new THREE.Vector3(-14, 0, 2)); Cq.g.rotation.set(0, .5, 0);
		moveTo(Cq.g, B.g.position.clone().add(off), { ry:.14, dur:.7 });
		if(tall) fit(.2, .4 + 1.2, 5.8, 3.5 + 2.4 + .8); else fit(.75, .4 + .5, 5 + 1.5 + .8, 3.5 + 1.0 + .8);
		say("yasmine", "18 h 30. Bernard a annoté la courbe des salaires : « +13,5 %, la spirale ! » Mais +13,5 %, <b>comparé à quoi ?</b> J'ai tiré les prix sur un calque, dans la même base 100.", { task:"Fais glisser le calque des prix pour poser son « 100 » sur celui des salaires" });
		const crossW = D => { const [px, py] = D.cross; return D.g.localToWorld(new THREE.Vector3((px/D.W - .5)*D.w, .1, (py/D.H - .5)*D.h)); };
		let drag = null;
		await task(done => ({
			down(){ const p = docPt(Cq); if(!p.in) return false; const g = groundPt(.4); if(!g) return false; Cq.g.rotation.y = 0; drag = Cq.g.position.clone().sub(g).setY(0); play("swipe"); return true; },
			move(){ const g = groundPt(.4); if(!g || !drag) return; Cq.g.position.copy(g.add(drag)).setY(.4); },
			up(){
				drag = null; Cq.g.rotation.y = 0;
				const gap = crossW(Cq).sub(crossW(B)).setY(0);
				if(gap.length() < .45){ moveTo(Cq.g, Cq.g.position.clone().sub(gap).setY(.2), { dur:.25, lift:0 }).then(() => { CQ.aligned = true; B.dirty = true; Cq.g.visible = false; }); play("good"); done(); return; }
				if(gap.length() < 1.6) say(null, null, { hint:"Presque : les deux croix « 100 » doivent tomber l'une sur l'autre." });
			},
			auto(){ Cq.g.visible = false; CQ.aligned = true; B.dirty = true; done(); }
		}));
		await wait(400);
		tile("real", "−3 %", "salaires 113,5 · prix 117");
		score("salaires", 2, 2); learn("micro");
		await next("yasmine", "Les salaires ont pris 13,5 %… mais les prix <b>17 %</b>. Le pouvoir d'achat a <b>perdu 3 %</b> depuis 2022 : les salariés rattrapent, ils ne poussent pas les prix. Pas de spirale. Reste à savoir ce que ferait une hausse de taux : on va voir la machine.");
		Cq.g.visible = false;
	}

	/* ================= 4 · la machine de Phillips ================= */
	async function machine(){
		stage("machine", "4 · La machine", 21*60);
		for(const D of onDesk){ D.g.visible = false; } onDesk = [];
		rate = BERNARD; drawDial(); S.runs = []; redrawPlot();
		fitFront(MX + 13, FY + 11.5, MZ + 1, 34, 24, 1.6);
		say("yasmine", "21 h. La MONIAC de Phillips, réglée sur notre économie : l'eau, c'est l'argent. La vanne rouge, c'est le <b>taux</b> : elle freine le crédit, donc l'investissement. Bernard l'a laissée sur sa proposition, <b>3,75 %</b>.", { task:"Tourne la vanne (glisse à gauche ou à droite), puis tire le levier RUN : il faut 2 % en 2028" });
		const hits = o => ray.intersectObject(o, true).length > 0;
		let turn = null;
		await task(done => ({
			down(e, p){ if(running) return false; if(hits(wheelHit)){ turn = { x:p.x, r0:rate }; play("clic"); return true; } return false; },
			move(e){ if(!turn) return; const r = Math.max(2.5, Math.min(4.5, turn.r0 + Math.round((e.clientX - turn.x)/38)*.25)); if(r !== rate){ rate = r; drawDial(); play("clic"); } },
			up(){ turn = null; },
			tap(){ if(running) return; if(hits(leverHit)) run(done); else if(hits(wheelHit)) say(null, null, { hint:"Pour tourner la vanne : appuie dessus et <b>glisse</b> vers la droite (plus haut) ou la gauche (plus bas)." }); },
			auto(){ if(running) return; rate = RATE0; drawDial(); run(done); }
		}));
		async function run(done){
			if(running) return;
			const r = rate, R = running = { r, k:0 }; S.time += 30; showClock(); play("swipe");
			tween(.4, k => { arm.rotation.z = .5 - k; }).then(() => tween(.5, k => { arm.rotation.z = -.5 + k; }));
			flowOn = 3.2; TK.I.set(.85 - (r - 2.5)*.32); TK.Y.set(.62 - (r - RATE0)*.22); TK.C.set(.6 - (r - RATE0)*.15); TK.S.set(.55 + (r - RATE0)*.2);
			await tween(2.8, k => { R.k = k; redrawPlot(R); });
			S.runs.push({ r }); running = null; redrawPlot(); E.dirty = true;
			const v = infl2028(r), c = chom2028(r);
			if(Math.abs(v - 2) < .05){ play("good"); done(); return; }
			play("bad");
			if(r > RATE0) say("yasmine", `À ${fr(r, 2)} % : <b>${fr(v)} %</b> en 2028, sous la cible, et le chômage monte à <b>${fr(c)} %</b>. Trop fort : on casserait l'investissement et l'emploi pour un choc d'énergie qui retombe tout seul.`, { task:"Tourne la vanne, puis tire le levier RUN : vise 2 % en 2028" });
			else say("yasmine", `À ${fr(r, 2)} % : <b>${fr(v)} %</b> en 2028, au-dessus de la cible. Baisser maintenant, c'est trop tôt : l'économie n'en a pas besoin.`, { task:"Tourne la vanne, puis tire le levier RUN : vise 2 % en 2028" });
		}
		tile("rate", "3,25 % · maintien", `inflation 2028 : 2,0 % · chômage ${fr(chom2028(RATE0))} %`);
		score("machine", 4 - S.runs.length, 3); learn("modele", "gestion");
		await next("yasmine", `<b>Maintien à 3,25 %</b> : l'inflation revient à <b>2,0 %</b> fin 2028, quand le choc d'énergie s'efface. ${S.runs.length > 1 ? "Et tu as vu ce que donne la proposition de Bernard. " : ""}La plume confirme ta note. Imprime le tracé : demain, 9 h, tu présentes.`, "Aller au Conseil →");
	}

	/* ================= 5 · le Conseil de 9 h ================= */
	async function conseil(){
		stage("conseil", "5 · Le Conseil de 9 h", 1440 + 540);
		for(const D of Object.values(docs)) D.g.visible = false;
		onDesk = [];
		const tall = camera.aspect < 1;
		const order = ["A", "D", "B", "E"];
		const sheets = order.map((id, i) => {
			const D = docs[id]; D.dirty = true; D.g.visible = true;
			const s = tall ? .76 : .66, col = tall ? i % 2 : i, row = tall ? Math.floor(i/2) : 0;
			D.home = tall ? new THREE.Vector3(CX - 2.15 + col*4.3, .55 + row*.02, 1.9 + row*3.25) : new THREE.Vector3(CX - 5.4 + col*3.6, .6, 3.4);
			D.tilt = tall ? .15 : .45; D.g.position.copy(D.home); D.g.rotation.set(D.tilt, 0, 0); D.g.scale.setScalar(s); D.s = s;
			return D;
		});
		const kk = tall ? Math.min(3.6, 1.1/camera.aspect) : 1;
		view(new THREE.Vector3(CX, tall ? 2 : 7, tall ? 0 : -6), tall ? 50/kk : 46, tall ? .78 : 1.15, 0, 1.6);
		sheetTags.forEach((t, i) => { const D = sheets[i]; t.visible = true; t.position.copy(D.home).add(new THREE.Vector3(0, .9, -D.h*D.s/2 - .1)); });
		const screen = D => screenT.redraw((x, w, h) => { x.fillStyle = "#f7f9fb"; x.fillRect(0, 0, w, h); if(!D) return; const k = Math.min((w - 60)/D.W, (h - 60)/D.H); x.drawImage(D.c, (w - D.W*k)/2, (h - D.H*k)/2, D.W*k, D.H*k); });
		await next("mathilde", "Bonjour. J'ai lu la note du service : elle recommande le <b>maintien</b>. Bernard n'est pas d'accord, et James a des doutes. <b>Répondez avec vos pièces</b>, sur le rétroprojecteur.", "Commencer");
		let total = 0;
		for(const q of QUESTIONS){
			const m = members[q.who]; m.bob = 1; play("chime");
			const t0 = performance.now();
			say(q.who, q.en ? `<i>${q.q}</i>` : q.q, { task:q.en ? "Pose la pièce qui répond sur le rétroprojecteur (answer in English)" : "Pose la pièce qui répond sur le rétroprojecteur", sand:SAND, t0 });
			let tries = 0, res = null, drag = null;
			const pick = D => {
				tries++;
				const late = (performance.now() - t0)/1000 > SAND;
				if(D.id === q.ok){ res = tries === 1 ? (late ? 2 : 3) : 1; play(res >= 2 ? "good" : "chime"); moveTo(D.g, PJ.clone().setY(1.2), { dur:.45, lift:1 }); screen(D); return true; }
				err("Conseil : la pièce ne répond pas", "oral"); moveTo(D.g, D.home, { dur:.35, lift:.4 });
				if(tries >= 2){ res = 0; screen(docs[q.ok]); say("yasmine", "Psst… c'était cette pièce-là. Je la projette, on enchaîne."); return true; }
				say(null, null, { hint:q.en ? "<i>That doesn't answer my question.</i> Une autre pièce ?" : "« Ça ne répond pas à ma question. » Une autre pièce ?" });
				return false;
			};
			const sheetAt = () => { for(const D of sheets){ const p = docPt(D); if(p.in) return D; } return null; };
			await task(done => ({
				down(){ const D = sheetAt(); if(!D) return false; const g = groundPt(1.2); if(!g) return false; drag = { D, off:D.g.position.clone().sub(g).setY(0) }; D.g.rotation.x = 0; play("swipe"); return true; },
				move(){ if(!drag) return; const g = groundPt(1.2); if(g) drag.D.g.position.copy(g.add(drag.off)).setY(1.2); },
				up(e, moved){
					const d = drag; drag = null; if(!d) return;
					d.D.g.rotation.x = d.D.tilt;
					const onPJ = Math.hypot(d.D.g.position.x - PJ.x, d.D.g.position.z - PJ.z) < 3;
					if(onPJ || moved < 12){ if(pick(d.D)) done(); }
					else moveTo(d.D.g, d.D.home, { dur:.3, lift:.3 });
				},
				auto(){ pick(docs[q.ok]); done(); }
			}));
			if(res === 0) await wait(1600);
			S.answers.push(res); total += res;
			await wait(500);
			if(res > 0){
				await next("me", q.yes, "Suite →");
				m.bob = 1;
				say(q.who, res >= 2 ? q.end : (q.en ? "<i>Hmm. You took your time.</i>" : "Hmm. Vous avez mis le temps."));
			} else say(q.who, q.en ? "<i>I'll need to read that again.</i>" : "Je note que ce point n'était pas prêt.");
			await wait(2000);
			const D = docs[q.ok]; D.g.rotation.x = D.tilt; moveTo(D.g, D.home, { dur:.4, lift:.4 }); screen(null);
		}
		score("conseil", total, 12); learn("oral", "en");
		S.adopted = total >= 7;
		members.mathilde.bob = 1;
		await next("mathilde", S.adopted ? "Nous passons au vote. <b>Sept voix contre deux : le taux est maintenu à 3,25 %.</b> Bernard votera contre, c'est son droit. Merci : votre note a fait la décision." : "Nous passons au vote. <b>Cinq voix contre quatre : +0,25 point.</b> Votre analyse était juste, mais la défense n'a pas convaincu tout le monde.", "Voir le verdict →");
	}

	/* ================= déroulé ================= */
	const ORDER = ["indice", "enquete", "salaires", "machine", "conseil"];
	const STEPS = { indice, enquete, salaires, machine, conseil };
	async function run(from = "indice"){
		const g = GEN;
		for(const k of ORDER.slice(ORDER.indexOf(from))){
			await STEPS[k](); if(closed || g !== GEN) return;
			if(k === "indice"){
				await P(r => palier({ id:"moniac", onEvent, openLead, quit:close,
					titre:"L'inflation sous-jacente est à 2,0 % : le choc vient de l'énergie.",
					texte:"La nuit pour bâtir la note : démasquer une moyenne trompeuse en anglais, comparer salaires et prix, faire tourner la machine de Phillips… puis défendre ta recommandation devant le Conseil, à 9 h.",
					suite:"Préparer le Conseil (≈ 6 min)" }).then(r));
				if(closed || g !== GEN) return;
			}
		}
		finish();
	}
	// sauter à une étape : les pièces des étapes d'avant sont faites
	function jump(k){
		GEN++; input = null; btnAuto = null; running = null; tweens.clear(); $(".mo-ov").hidden = true; sheetTags.forEach(t => t.visible = false);
		for(const D of Object.values(docs)){ D.g.visible = false; D.g.rotation.set(0, 0, 0); D.g.scale.setScalar(1); D.dirty = true; }
		onDesk = []; S.time = 0;
		const i = ORDER.indexOf(k);
		if(i > 0){ PEEL.gone = new Set(["ener", "alim"]); S.tiles.core = ["2,0 %", "1,5 point sur ¾ du panier"]; }
		if(i > 1){ if(!Dd.geo) redraw(Dd); SV.x = Dd.geo.vx(2.1); SV.locked = true; S.tiles.exp = ["2,1 %", "médiane ; moyenne 2,5 %"]; }
		if(i > 2){ CQ.aligned = true; S.tiles.real = ["−3 %", "salaires 113,5 · prix 117"]; }
		if(i > 3){ if(!S.runs.length) S.runs = [{ r:BERNARD }, { r:RATE0 }]; S.tiles.rate = ["3,25 % · maintien", "inflation 2028 : 2,0 %"]; }
		if(i <= 3){ S.runs = []; delete S.tiles.rate; }
		if(i <= 2){ CQ.aligned = false; delete S.tiles.real; }
		if(i <= 1){ SV.locked = false; delete S.tiles.exp; }
		if(i === 0){ PEEL.gone.clear(); delete S.tiles.core; }
		redrawPlot(); renderNote(); run(k);
	}

	/* ================= le verdict ================= */
	function finish(){
		input = null; btnAuto = null; play("win");
		const got = Object.values(S.pts).reduce((s, v) => s + v[0], 0), max = Object.values(S.pts).reduce((s, v) => s + v[1], 0) || 1;
		const sc = Math.round(got/max*100);
		const mention = MENTIONS[sc >= 85 ? 3 : sc >= 65 ? 2 : sc >= 45 ? 1 : 0];
		ev("win", mention);
		const good = S.answers.filter(a => a >= 2).length;
		$(".mo-card").innerHTML = `<p class="k">Jeudi, 9 h 40 · Conseil de politique monétaire</p>
			<h2>${S.adopted ? "Le taux est maintenu" : "Le Conseil monte de 0,25 point"}</h2>
			<span class="mo-stamp" style="color:${S.adopted ? GREEN : RED}">${S.adopted ? "RECOMMANDATION SUIVIE" : "RECOMMANDATION ÉCARTÉE"}</span>
			<p>Mention <b>${mention}</b> (${sc} / 100). Tu as fait, en une nuit, le métier d'<b>économiste en banque centrale</b> : décomposer un indice, lire une enquête en anglais sans te laisser piéger par la moyenne, ramener les salaires aux prix, faire tourner un modèle de l'économie, puis défendre ta recommandation devant le Conseil, pièce en main.</p>
			<div class="mo-stats"><div>Inflation sous-jacente<b>2,0 %</b></div><div>Objections bien défendues<b>${good} / ${QUESTIONS.length}</b></div><div>Essais à la machine<b>${S.runs.length}</b></div><div>Nuit perdue en erreurs<b>${S.lost} min</b></div></div>
			<p class="k">Ce que la prépa D2 t'apprend, et que tu viens d'utiliser (${S.learned.length})</p>
			<ul class="mo-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span><b>${COURSES[k][1]}</b> · ${COURSES[k][2]}</li>`).join("")}</ul>
			<ul class="mo-list"><li><span>${COURSES.conc[0]}</span><b>${COURSES.conc[1]}</b> · ${COURSES.conc[2]}</li></ul>
			${jpoCard()}${openLead ? `<button class="mo-go" data-a="lead">📄 Recevoir la plaquette de la prépa D2</button>` : ""}
			<a class="mo-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa D2 ↗</a>
			<button class="mo-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="mo-alt" data-a="replay">Rejouer</button>`;
		$(".mo-ov").hidden = false; $(".mo-card").scrollTop = 0; msg.innerHTML = "";
	}
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openMoniac({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});

	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); tweens.clear(); input = null;
		removeEventListener("resize", refit); document.removeEventListener("keydown", onKey);
		if(window.campus && window.campus.game && window.campus.game.S === S) delete window.campus.game;
		for(const D of Object.values(docs)) D.t.dispose();
		W.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".mo-x").addEventListener("click", close);

	// ouverture à chaud : pas d'écran de règles, Yasmine explique chaque geste au moment de le faire
	renderNote(); showClock();
	ev("start");
	ev("missions", STEPS_UI.map(([k, t], i) => [`${i + 1} · ${t}`, () => jump(k)]));
	run();
	if(window.campus) window.campus.game = { S, W, docs, jump, PEEL, SV, CQ,
		where:(id, px, py) => { const D = docs[id]; const p = D.g.localToWorld(new THREE.Vector3((px/D.W - .5)*D.w, .1, (py/D.H - .5)*D.h)).project(camera); return [Math.round((p.x + 1)/2*innerWidth), Math.round((1 - p.y)/2*innerHeight)]; },
		at:o => { const p = (o.getWorldPosition ? o.getWorldPosition(new THREE.Vector3()) : o.clone()).project(camera); return [Math.round((p.x + 1)/2*innerWidth), Math.round((1 - p.y)/2*innerHeight)]; },
		wheel:wheelHit, lever:leverHit, PJ,
		pump:(n = 40) => { for(let i = 0; i < n; i++) tick(0, 1/30); }, auto:() => { if(btnAuto) btnAuto(); else if(input && input.auto) input.auto(); } };
}
