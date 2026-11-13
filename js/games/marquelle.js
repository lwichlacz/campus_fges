/* « Marquelle » — mini-jeu de la Licence Administration Économique, Sociale et Environnementale (FGES, 2026).
   Une ville miniature, en plein jour : la filature vient de fermer au milieu des maisons, et ses habitants vivent leur
   journée (le marché le matin, la sortie de l'école, la gare à 17 h). Le joueur, stagiaire à la mairie, porte le projet :
   1 · méthodes d'enquête : faire tourner l'horloge de la ville et interroger les habitants, quotas à remplir
       (si l'on n'enquête qu'au marché à 10 h, on ne parle qu'aux retraités) — scène d'ouverture, une minute ;
   2 · institutions : la ville est posée sur ses échelons (département, région, État) ; renvoyer chaque demande au bon ;
   3 · transitions : aménager la friche case par case, sous une carte de chaleur, avec des jauges qui réagissent ;
   4 · finances publiques : verser les piles de pièces dans les bocaux investissement et fonctionnement
       (l'emprunt rebondit sur le fonctionnement : c'est la règle d'or) ; une nouvelle change les subventions ;
   5 · économie sociale et solidaire : accrocher la bonne enseigne sur le tiers-lieu ;
   6 · le conseil municipal : convaincre les élus indécis un par un, avec les arguments du projet, puis voter.
   Commune, personnes et chiffres sont fictifs. Programme de la licence et contenus à relire par l'équipe pédagogique. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makePerson, std } from "../kit.js?v=d3fe9a7862";
import { jpoCard } from "./jpo.js?v=d3fe9a7862";
import { palier } from "./palier.js?v=d3fe9a7862";

const COURSES = {
	enq:   ["L2", "Méthodes d'enquête", "Un échantillon doit ressembler à la population : âges, activités, horaires. Sinon, l'enquête dit ce qu'on veut entendre."],
	inst:  ["L1", "Institutions et droit public", "Commune, département, région, État : qui fait quoi. Le b.a.-ba des concours de la fonction publique."],
	trans: ["L3", "Transitions et territoires", "Emplois, chaleur urbaine, sols perméables : aménager, c'est arbitrer entre des objectifs qui se contredisent."],
	fin:   ["L2", "Finances publiques", "Investissement et fonctionnement, subventions, emprunt : le budget d'une collectivité a ses règles d'or."],
	ess:   ["L2", "Économie sociale et solidaire", "Associations, coopératives, SCIC : entreprendre autrement, au service de l'intérêt collectif."],
	pol:   ["L3", "Action publique et démocratie locale", "Un projet ne vaut rien sans majorité : écouter les élus, répondre à leurs priorités, convaincre."]
};
const STEPS_UI = [["enq", "1 · Écouter"], ["inst", "2 · Échelons"], ["plan", "3 · Aménager"], ["fin", "4 · Budget"], ["ess", "5 · Enseigne"], ["vote", "6 · Conseil"]];
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/[  ]/g, " ");
const euro = v => fr(v) + " €";
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- les habitants : leur profil, leur réponse, où ils sont selon l'heure ---------- */
const CAT = { student:"jeune", senior:"retraite", pro:"actif", casual:"actif" };
const CAT_LABEL = { jeune:"Jeunes (16-25 ans)", actif:"Actifs", retraite:"Retraités" };
const QUOTA = { jeune:2, actif:3, retraite:2 };
const WISH = { tiers:"Un tiers-lieu (ateliers, café, emplois)", jardins:"Des jardins et des arbres", parking:"Un parking", logements:"Des logements", commerces:"Des commerces" };
const SPOT = { M:[-13.5, 1.8], C:[12.5, 9], G:[14, -6], E:[-9.5, 9.5], H1:[-17, -15], H2:[16, 15], H3:[-17, 15], H4:[6, -16], S1:[-4, 7], S2:[5, -8], S3:[-6, -9], OUT:null };
const PEOPLE = [
	["senior", "Jeanine, 74 ans", "parking", "Un parking ! Le samedi, on ne trouve jamais de place pour le marché.", ["M", "M", "H1", "H1"]],
	["senior", "Marcel, 81 ans", "parking", "Avant, je garais devant l'usine. Faites un parking.", ["M", "H1", "S3", "H1"]],
	["senior", "Odile, 69 ans", "jardins", "Des arbres, de l'ombre… l'été, la place est un four.", ["M", "M", "E", "H3"]],
	["senior", "Gérard, 77 ans", "parking", "Mes enfants viennent en voiture le dimanche. Un parking, voilà.", ["M", "H3", "H3", "H3"]],
	["senior", "Annie, 72 ans", "jardins", "Un jardin partagé, j'irais tous les jours.", ["M", "H1", "S1", "H1"]],
	["senior", "René, 79 ans", "parking", "Du stationnement. Le reste, c'est des lubies.", ["M", "H4", "H4", "H4"]],
	["student", "Inès, 19 ans", "tiers", "Un atelier vélo et un café où réviser ! Ici, il n'y a rien pour nous.", ["OUT", "C", "G", "C"]],
	["student", "Yanis, 17 ans", "tiers", "Un lieu pour bricoler, réparer, se retrouver. Et des petits boulots.", ["OUT", "OUT", "G", "S1"]],
	["student", "Léa, 22 ans", "logements", "Des petits logements : je veux rester à Marquelle, mais tout est trop cher.", ["OUT", "OUT", "G", "H2"]],
	["student", "Hugo, 20 ans", "tiers", "Une ressourcerie ! On récupère, on répare, on revend.", ["OUT", "OUT", "S2", "C"]],
	["student", "Maëlle, 18 ans", "tiers", "Un café-concert. Le soir, la ville est morte.", ["OUT", "OUT", "G", "C"]],
	["pro", "Karim, 41 ans, ex-ouvrier de la filature", "tiers", "Du travail. Une ressourcerie, un atelier : des emplois pour ceux de l'usine.", ["OUT", "C", "E", "H2"]],
	["pro", "Sophie, 36 ans, infirmière", "tiers", "Un lieu de vie, avec un café et des ateliers pour les enfants.", ["OUT", "C", "E", "H4"]],
	["pro", "Julien, 45 ans, artisan", "tiers", "Des ateliers à louer : je cherche un local depuis deux ans.", ["M", "C", "S2", "H2"]],
	["pro", "Nadia, 39 ans, comptable", "logements", "Des logements pour les familles. Mon fils ne trouve rien.", ["OUT", "OUT", "E", "H3"]],
	["pro", "Thomas, 33 ans, ingénieur", "tiers", "Un coworking : je travaille à Lille, je pourrais rester ici deux jours par semaine.", ["OUT", "OUT", "G", "C"]],
	["pro", "Aïcha, 47 ans, aide-soignante", "jardins", "Des jardins partagés, pour que les gamins voient pousser quelque chose.", ["OUT", "OUT", "E", "S1"]],
	["pro", "Bruno, 52 ans, chauffeur", "logements", "Des logements, mais pas des tours.", ["OUT", "C", "S3", "H1"]],
	["casual", "Jordan, 28 ans, en recherche d'emploi", "tiers", "N'importe quoi qui embauche. Une ressourcerie, ça forme des gens.", ["M", "S3", "G", "C"]],
	["casual", "Clara, 31 ans, graphiste", "tiers", "Un tiers-lieu avec des ateliers partagés : j'y serais tous les jours.", ["S2", "C", "S1", "S2"]],
	["casual", "Mehdi, 26 ans, livreur", "commerces", "Une boulangerie, une épicerie. Il faut tout faire en voiture.", ["OUT", "S2", "S2", "H4"]],
	["casual", "Lucie, 29 ans, maraîchère", "jardins", "Des jardins, et un marché de producteurs.", ["OUT", "OUT", "S3", "S3"]]
];
const SLOTS = [["10 h", "Le marché"], ["13 h", "La pause déjeuner"], ["17 h", "Sortie de l'école, gare"], ["20 h", "Le soir, chez soi"]];

/* ---------- les échelons ---------- */
const LEVELS = [["commune", "Commune de Marquelle", "#2f6b45"], ["dep", "Département du Nord", "#2c5f9e"], ["region", "Région Hauts-de-France", "#8a2b4e"], ["etat", "État", "#5d6b7a"]];
const ASKS = [
	{ t:"Inscrire mon fils en CP à l'école Jean-Jaurès", from:"une maman, à la sortie de l'école", k:"commune", why:"Les écoles maternelles et élémentaires relèvent de la commune.", at:"E" },
	{ t:"Le toit du gymnase du collège fuit", from:"la principale du collège", k:"dep", why:"Les collèges relèvent du département.", at:"S1" },
	{ t:"Depuis la fermeture, je demande le RSA", from:"un ancien ouvrier", k:"dep", why:"Le RSA est financé par le département (et versé par la CAF).", at:"S3" },
	{ t:"Le TER de 7 h 12 est encore supprimé", from:"des usagers, à la gare", k:"region", why:"Les trains régionaux (TER) sont organisés par la région.", at:"G" },
	{ t:"Une aide pour reprendre une partie de la filature", from:"un repreneur", k:"region", why:"La région est chef de file du développement économique et des aides aux entreprises.", at:"S2" },
	{ t:"Plus d'agents au commissariat de police nationale", from:"les commerçants du marché", k:"etat", why:"La police nationale relève de l'État ; la commune n'a que sa police municipale.", at:"M" }
];

/* ---------- l'aménagement de la friche ---------- */
const TILES = {
	ressourcerie:{ n:"Ressourcerie", ic:"♻️", jobs:8, perm:false, heat:.3, col:"#3d7a55", tiers:true },
	atelier:{ n:"Atelier vélo", ic:"🚲", jobs:4, perm:false, heat:.3, col:"#2c5f9e", tiers:true },
	cafe:{ n:"Café solidaire", ic:"☕", jobs:5, perm:false, heat:.3, col:"#b0703a", tiers:true },
	jardins:{ n:"Jardins partagés", ic:"🥕", jobs:1, perm:true, heat:-.3, col:"#6aa84f" },
	arbres:{ n:"Îlot de fraîcheur", ic:"🌳", jobs:0, perm:true, heat:-.5, col:"#2e7d4f" },
	parking:{ n:"Parking", ic:"🅿️", jobs:0, perm:false, heat:.5, col:"#6b6f78", park:20 },
	logements:{ n:"Logements", ic:"🏠", jobs:0, perm:false, heat:.3, col:"#c49a6c", lodge:12 }
};
const BETON = .25;        // une case de friche bétonnée, avant travaux : +0,25 °C
const PLOTS = [];
for(let r = 0; r < 3; r++) for(let c = 0; c < 4; c++) PLOTS.push({ id:r*4 + c, x:-4.5 + c*3, z:-2.8 + r*2.8, tile:null });

/* ---------- le budget ---------- */
const INVEST = 1500000, FONCT = 120000;
const NEWS = [
	{ id:"calme", t:"Les financeurs confirment leurs aides", d:"Région 30 %, État 20 %, Département 10 %.", aides:[["Région", 30], ["État · fonds vert", 20], ["Département", 10]] },
	{ id:"region", t:"La Région plafonne son aide à 20 %", d:"Budget régional serré : la commune devra emprunter davantage.", aides:[["Région", 20], ["État · fonds vert", 20], ["Département", 10]] },
	{ id:"feder", t:"L'Europe s'en mêle : 10 % du FEDER", d:"Le fonds européen de développement régional finance les friches.", aides:[["Région", 30], ["État · fonds vert", 20], ["Département", 10], ["Europe · FEDER", 10]] }
];

/* ---------- l'enseigne ---------- */
const SIGNS = [
	{ id:"scic", t:"SCIC", d:"Société coopérative d'intérêt collectif", col:"#2f6b45", ok:true, why:"Salariés, habitants, associations et la commune (jusqu'à 50 % du capital) en sont associés : une personne, une voix, et la majorité des bénéfices reste dans le projet." },
	{ id:"asso", t:"Association", d:"Loi 1901", col:"#5d6b7a", why:"Possible, mais la commune ne peut pas codiriger une association sans risque juridique, et le lieu vend (objets réparés, cafés) : une coopérative s'y prête mieux." },
	{ id:"sarl", t:"SARL", d:"Société commerciale classique", col:"#8a6440", why:"Les associés se partagent les bénéfices, et une commune ne peut pas, en principe, entrer au capital d'une société commerciale ordinaire." },
	{ id:"regie", t:"Régie municipale", d:"La mairie gère tout", col:"#2c5f9e", why:"La commune porterait seule tout le risque, sans les habitants ni les salariés aux décisions." }
];

/* ---------- le conseil municipal ---------- */
const CONCERNS = { budget:["💶", "le budget"], climat:["🌳", "le climat"], emploi:["🧑‍🔧", "l'emploi"], parking:["🚗", "le stationnement"] };
const UNDECIDED = ["budget", "budget", "budget", "climat", "climat", "climat", "emploi", "emploi", "parking", "parking"];

const CSS = `
.mq{position:fixed;inset:0;z-index:40;background:#cfe6f5;font-family:Nunito,system-ui,sans-serif;color:#1d2a22;overflow:hidden;animation:mqIn .4s ease both}
@keyframes mqIn{from{opacity:0}}
.mq canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.mq-mast{position:absolute;left:12px;top:10px;z-index:3;background:#fffdf7;border-radius:4px;box-shadow:0 6px 18px rgba(30,40,30,.18);padding:6px 12px 7px;max-width:calc(100% - 90px);border-top:4px solid #1d2a22}
.mq-mast small{display:block;font:900 10px Nunito,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#7a2e1e}
.mq-mast b{display:block;font:700 18px/1.15 Georgia,"Times New Roman",serif;color:#1d2a22}
.mq-x{position:absolute;right:12px;top:10px;z-index:3;width:40px;height:40px;border-radius:50%;border:0;background:#1d2a22;color:#fffdf7;font-size:22px;cursor:pointer}
.mq-steps{position:absolute;left:12px;bottom:12px;z-index:3;display:flex;gap:4px;flex-wrap:wrap;max-width:calc(100% - 430px)}
.mq-steps span{font-size:11.5px;font-weight:800;background:rgba(255,253,247,.85);color:#8a948c;border-radius:999px;padding:4px 9px}
.mq-steps span.done{color:#2f6b45}.mq-steps span.now{background:#2f6b45;color:#fff}
.mq-hud{position:absolute;right:62px;top:14px;z-index:3;display:flex;gap:6px}
.mq-hud span{background:#fffdf7;border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:800;box-shadow:0 4px 12px rgba(30,40,30,.15)}
.mq-panel{position:absolute;right:12px;top:62px;bottom:12px;width:390px;z-index:3;overflow:auto;background:#fffdf7;border-radius:14px;box-shadow:0 16px 40px rgba(30,40,30,.25);padding:14px;box-sizing:border-box;scrollbar-width:thin}
.mq-say{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
.mq-av{flex:none;width:42px;height:42px;border-radius:50%;background:#2f6b45;color:#fff;display:grid;place-items:center;font:900 15px Nunito,sans-serif}
.mq-say p{margin:0;background:#eef5ee;border-radius:4px 14px 14px 14px;padding:8px 11px;font-size:14px;line-height:1.45}
.mq-say p small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#2f6b45;margin-bottom:2px}
.mq-k{font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#7a2e1e}
.mq-h{font:700 20px/1.2 Georgia,"Times New Roman",serif;margin:2px 0 8px}
.mq-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#3a463e}
.mq-clock{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:6px 0 10px}
.mq-clock button{border:2px solid #d5dccf;background:#fff;border-radius:10px;padding:7px 2px;font:900 15px Nunito,sans-serif;cursor:pointer;color:#1d2a22}
.mq-clock button small{display:block;font-size:10.5px;font-weight:700;color:#6b756c}
.mq-clock button.on{border-color:#2f6b45;background:#2f6b45;color:#fff}.mq-clock button.on small{color:#d7ead9}
.mq-quota{display:grid;gap:5px;margin:4px 0 8px}
.mq-quota div{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800}
.mq-quota div span{flex:1}
.mq-quota i{display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #9aa79c;margin-left:3px}
.mq-quota i.f{background:#2f6b45;border-color:#2f6b45}
.mq-quote{background:#fff;border-left:4px solid #2f6b45;border-radius:4px;padding:7px 10px;margin:6px 0;font-size:13.5px;box-shadow:0 2px 6px rgba(30,40,30,.08)}
.mq-quote b{display:block;font-size:12px;color:#6b756c}
.mq-quote.full{border-color:#c4532f;opacity:.8}
.mq-bars{display:grid;gap:4px;margin:6px 0}
.mq-bars div{display:grid;grid-template-columns:120px 1fr 34px;gap:6px;align-items:center;font-size:12.5px;font-weight:700}
.mq-bars em{display:block;height:12px;border-radius:6px;background:#2f6b45}
.mq-bars em.b{background:#c4532f}
.mq-go{display:block;width:100%;border:0;border-radius:12px;padding:13px;margin-top:10px;background:#2f6b45;color:#fff;font:900 15.5px Nunito,sans-serif;cursor:pointer}
.mq-go:disabled{opacity:.35;cursor:default}
.mq-alt{display:block;width:100%;border:2px solid #d5dccf;border-radius:12px;padding:11px;margin-top:8px;background:#fff;color:#1d2a22;font:800 14px Nunito,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.mq-ask{background:#fff7e6;border:2px solid #e0a33a;border-radius:10px;padding:9px 11px;margin:6px 0;font-size:14px}
.mq-ask b{display:block;font-size:15px}
.mq-ask small{color:#6b756c}
.mq-ok{color:#2f6b45;font-weight:800;font-size:13.5px;margin:4px 0}
.mq-pal{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:6px 0}
.mq-pal button{display:flex;gap:6px;align-items:center;border:2px solid #d5dccf;background:#fff;border-radius:10px;padding:7px 8px;font:800 13px Nunito,sans-serif;cursor:pointer;color:#1d2a22;text-align:left}
.mq-pal button i{font-style:normal;font-size:18px}
.mq-pal button.on{border-color:#2f6b45;box-shadow:0 0 0 3px rgba(47,107,69,.2)}
.mq-gauges{display:grid;gap:6px;margin:8px 0}
.mq-g{font-size:12.5px;font-weight:800}
.mq-g span{display:flex;justify-content:space-between}
.mq-g em{display:block;height:9px;border-radius:5px;background:#e3e8e0;overflow:hidden;margin-top:2px}
.mq-g em i{display:block;height:100%;border-radius:5px;transition:width .4s,background .4s}
.mq-news{background:#1d2a22;color:#fffdf7;border-radius:6px;padding:8px 10px;margin:6px 0;font-size:13.5px}
.mq-news b{display:block;font:700 15px Georgia,serif;color:#ffd77a}
.mq-course{border:2px solid #e0a33a;border-radius:10px;padding:8px 10px;margin:8px 0;background:#fffaf0}
.mq-course small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#a0661a}
.mq-course b{display:block;font:700 15px Georgia,serif}
.mq-course span{font-size:13px;color:#4a564e}
.mq-stars{font-size:20px;letter-spacing:3px;color:#e0a33a}
.mq-cards{display:grid;gap:6px;margin:6px 0}
.mq-card{display:flex;gap:8px;align-items:center;text-align:left;border:2px solid #d5dccf;background:#fff;border-radius:10px;padding:8px 10px;font:700 13px/1.3 Nunito,sans-serif;cursor:pointer;color:#1d2a22}
.mq-card i{font-style:normal;font-size:22px}
.mq-card.on{border-color:#2f6b45;box-shadow:0 0 0 3px rgba(47,107,69,.2)}
.mq-card.weak{opacity:.55}
.mq-votes{font:900 26px Nunito,sans-serif;font-variant-numeric:tabular-nums;margin:4px 0}
.mq-votes small{font-size:12px;color:#6b756c;font-weight:800}
.mq-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.mq-tbl td{padding:5px 3px;border-top:1px solid #e3e8e0}.mq-tbl td:last-child{text-align:right;font-weight:800}
.mq-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:4px}
.mq-list li{font-size:13.5px;border-bottom:1px dashed #d5dccf;padding:3px 0}
.mq-list li span{color:#7a2e1e;font-weight:900;margin-right:6px}
.mq-tag{position:absolute;z-index:2;pointer-events:none;transform:translate(-50%,-100%);background:#fffdf7;border-radius:8px;padding:3px 7px;font-size:12px;font-weight:800;box-shadow:0 3px 8px rgba(30,40,30,.25);white-space:nowrap}
@media (max-width:759px){
	.mq-panel{left:0;right:0;top:auto;bottom:0;width:auto;max-height:50%;border-radius:16px 16px 0 0}
	.mq-steps{display:none}
	.mq-hud{top:62px;right:auto;left:12px}
	.mq-mast b{font-size:15px}
}`;

export function openMarquelle({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("mq-css")){ const st = document.createElement("style"); st.id = "mq-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "mq";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Marquelle");
	root.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="mq-mast"><small>La Gazette de Marquelle</small><b data-head>La filature ferme ses portes</b></div>
		<button class="mq-x" aria-label="Quitter le jeu">×</button>
		<div class="mq-hud" aria-live="polite"><span>★ <b data-h="stars">0</b></span><span>Erreurs <b data-h="err">0</b></span></div>
		<div class="mq-steps">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div>
		<div class="mq-panel"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), panel = $(".mq-panel");
	const S = { stars:0, errors:0, learned:new Set(), slot:0, met:[], plan:null, news:null, sign:null, votes:0 };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= la ville miniature ================= */
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#cfe6f5"); scene.fog = new THREE.Fog("#cfe6f5", 130, 300);
	const camera = new THREE.PerspectiveCamera(38, 1, .5, 500);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 12; controls.maxDistance = 240; controls.maxPolarAngle = 1.2; controls.minPolarAngle = .35;
	const hemi = new THREE.HemisphereLight("#ffffff", "#8a9a7a", 1.25); scene.add(hemi);
	const sun = new THREE.DirectionalLight("#fff3dc", 2); sun.position.set(-20, 40, 18); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30, near:1, far:120 }); sun.shadow.bias = -.0006; scene.add(sun);
	const own = [];
	const M = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color:c, roughness:.85, flatShading:true, ...o }); own.push(m); return m; };
	const G = g => (own.push(g), g);
	function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
	const box = (w, h, d, c, x, y, z, parent) => mesh(G(new THREE.BoxGeometry(w, h, d)), typeof c === "string" ? M(c) : c, x, y + h/2, z, parent);
	function roof(w, d, h, c, x, y, z, parent = scene, ry = 0){
		const s = new THREE.Shape(); s.moveTo(-d/2, 0); s.lineTo(d/2, 0); s.lineTo(0, h); s.closePath();
		const g = G(new THREE.ExtrudeGeometry(s, { depth:w, bevelEnabled:false })); g.translate(0, 0, -w/2); g.rotateY(Math.PI/2);
		const m = mesh(g, typeof c === "string" ? M(c) : c, x, y, z, parent); m.rotation.y = ry; return m;
	}
	function label(text, o = {}){
		const c = document.createElement("canvas"), x = c.getContext("2d"), f = `900 40px Nunito, system-ui, sans-serif`;
		x.font = f; const w = Math.ceil(x.measureText(text).width) + 36, h = 62; c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "#fffdf7"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 12); x.fill();
		x.fillStyle = o.fg || "#1d2a22"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, sizeAttenuation:false }));
		const s = (o.size || .03)*(innerWidth < 760 ? .55 : 1);      /* sur téléphone, l'image décalée sous le panneau agrandit les étiquettes */ sp.scale.set(s*w/h, s, 1); sp.renderOrder = 20; own.push(t, sp.material);
		return sp;
	}

	// le socle, les rues, l'herbe
	const town = new THREE.Group(); scene.add(town);
	box(48, 1.2, 48, "#6f8f5a", 0, -1.2, 0, town);
	box(48.4, .4, 48.4, "#5a4a36", 0, -1.6, 0, town);
	for(const [w, d, x, z] of [[48, 2.4, 0, -9.6], [48, 2.4, 0, 5.6], [2.4, 48, -9, 0], [2.4, 48, 9, 0]]) box(w, .06, d, "#8d9196", x, 0, z, town);
	// la filature : une halle de briques, un toit en dents de scie, une cheminée
	const usine = new THREE.Group(); scene.add(usine);
	box(13, 3.4, 8.2, "#a0523d", 0, 0, 0, usine);
	for(let i = 0; i < 5; i++){ const r = roof(8.2, 2.6, 1.4, "#5d4a40", -5.2 + i*2.6, 3.4, 0, usine); r.rotation.y = Math.PI/2; }
	mesh(G(new THREE.CylinderGeometry(.55, .75, 10, 10)), M("#8f4535"), 5.6, 5, -3.2, usine);
	for(let i = 0; i < 6; i++) box(1.2, 1.4, .1, "#3a4652", -5 + i*2, 1, 4.12, usine);
	const sign0 = label("FILATURE DELATTRE · FERMÉE", { bg:"#7a2e1e", fg:"#fff", size:.026 }); sign0.position.set(0, 6.2, 4); usine.add(sign0);
	// la mairie, le marché, l'école, la gare, le café
	const mairie = new THREE.Group(); mairie.position.set(0, 0, -15.5); scene.add(mairie);
	box(9, 4.4, 4.4, "#f1e7d0", 0, 0, 0, mairie); roof(9, 4.6, 1.8, "#4a5560", 0, 4.4, 0, mairie);
	box(1.6, 1.6, .2, "#fffdf7", 0, 5.4, 2.3, mairie); mesh(G(new THREE.CylinderGeometry(.05, .05, 3, 6)), M("#555"), 3.8, 6, 1.6, mairie);
	box(.9, .2, .02, "#0055a4", 4.25, 7.1, 1.6, mairie); box(.9, .2, .02, "#ffffff", 4.25, 6.9, 1.6, mairie); box(.9, .2, .02, "#ef4135", 4.25, 6.7, 1.6, mairie);
	const lm = label("Mairie"); lm.position.set(0, 8, 0); mairie.add(lm);
	const marche = new THREE.Group(); marche.position.set(-14, 0, -4.5); scene.add(marche);
	["#c4532f", "#e0a33a", "#2c5f9e", "#2f6b45", "#8a2b4e", "#e0a33a"].forEach((c, i) => { const x = -3 + (i % 3)*3, z = -1.6 + Math.floor(i/3)*3.2; box(2.2, .9, 1.2, "#c9b08a", x, 0, z, marche); box(2.4, .1, 1.6, c, x, 1.9, z, marche); for(const dx of [-1, 1]) box(.08, 1.9, .08, "#555", x + dx, 0, z - .7, marche); });
	box(9, .08, 5.5, "#c9c2b0", 0, 0, 5.8, marche);
	const lmk = label("Marché"); lmk.position.set(0, 4, 0); marche.add(lmk);
	const ecole = new THREE.Group(); ecole.position.set(-14.5, 0, 12); scene.add(ecole);
	box(8, 3, 4, "#e9d8b0", 0, 0, -1, ecole); roof(8, 4.2, 1.4, "#a0523d", 0, 3, -1, ecole); box(8, .5, .1, "#7a8a6a", 0, 0, 2.4, ecole);
	const le = label("École"); le.position.set(0, 6, 0); ecole.add(le);
	const gare = new THREE.Group(); gare.position.set(15.5, 0, -5); scene.add(gare);
	box(4, 2.6, 3, "#d9cbb0", -1, 0, 0, gare); roof(4, 3.2, 1, "#4a5560", -1, 2.6, 0, gare); box(1.4, .5, 14, "#b0b4b8", 2.6, 0, 0, gare);
	box(1.1, 1.3, 5, "#e8e8e8", 3.6, .1, -2, gare); box(1.12, .35, 5, "#1f6fb2", 3.6, .9, -2, gare);
	const lg = label("Gare TER"); lg.position.set(0, 5, 0); gare.add(lg);
	const cafe = new THREE.Group(); cafe.position.set(14.5, 0, 12); scene.add(cafe);
	box(5, 2.6, 4, "#e9c9a0", 0, 0, 0, cafe); roof(5, 4.2, 1.2, "#a0523d", 0, 2.6, 0, cafe); box(5, .15, 1.6, "#c4532f", 0, 1.9, 2.6, cafe);
	const lc = label("Café"); lc.position.set(0, 5, 0); cafe.add(lc);
	// les maisons, les arbres
	const houseCols = ["#efe3cf", "#e9d8b0", "#f3ede0", "#dcc7a8", "#e8dccb"], roofCols = ["#a0523d", "#8f4535", "#4a5560", "#b0603f"];
	const houseAt = [];
	for(let x = -21; x <= 21; x += 4.2) for(const z of [-21, 21]) houseAt.push([x, z]);
	for(let z = -16; z <= 16; z += 4.2) for(const x of [-21.5, 21.5]) houseAt.push([x, z]);
	houseAt.push([-4.5, -15], [4.5, 15], [-3.5, 14.5], [3.5, -21]);
	houseAt.forEach(([x, z], i) => { if(Math.abs(z) < 3 && Math.abs(x) > 20) return; const h = 2.2 + (i % 3)*.5; box(3, h, 3, houseCols[i % 5], x, 0, z, town); roof(3.2, 3.2, 1.3, roofCols[i % 4], x, h, z, town); });
	const trees = [[-6, 10], [6, 11], [-17, -10], [17, 4], [-4, -12], [11, -14], [-11, 3], [19, -18], [-19, 7], [2, 19]];
	for(const [x, z] of trees){ mesh(G(new THREE.CylinderGeometry(.15, .2, 1.2, 6)), M("#6b4a2e"), x, .6, z); mesh(G(new THREE.IcosahedronGeometry(1.1, 0)), M("#4f7a45"), x, 1.9, z); }

	/* --- les habitants --- */
	const people = PEOPLE.map(([kind, name, wish, quote, spots], i) => {
		const p = makePerson(scene, false, kind); p.g.scale.multiplyScalar(1.45);
		const hit = new THREE.Mesh(G(new THREE.CylinderGeometry(.7, .7, 2.6, 8)), new THREE.MeshBasicMaterial({ visible:false })); hit.position.y = 1.2; p.g.add(hit);
		const mark = label("✓", { bg:"#2f6b45", fg:"#fff", size:.026 }); mark.position.y = 2.9; mark.visible = false; p.g.add(mark);
		const jit = [Math.cos(i*2.4)*2.2, Math.sin(i*1.7)*1.5];
		return { i, kind, cat:CAT[kind], name, wish, quote, spots, p, hit, mark, jit, from:new THREE.Vector3(), to:new THREE.Vector3(), t:1 };
	});
	function spotOf(h, slot){
		const k = h.spots[slot]; if(k === "OUT") return null;
		const [x, z] = SPOT[k]; return new THREE.Vector3(x + h.jit[0], 0, z + h.jit[1]);
	}
	function placeAll(slot, instant){
		for(const h of people){
			const to = spotOf(h, slot);
			if(!to){ h.p.g.visible = false; h.t = 1; continue; }
			if(!h.p.g.visible || instant){ h.p.g.visible = true; h.p.g.position.copy(to); h.t = 1; continue; }
			h.from.copy(h.p.g.position); h.to.copy(to); h.t = 0;
		}
	}
	placeAll(0, true);

	/* --- les échelons, sous la ville --- */
	const plates = new THREE.Group(); scene.add(plates); plates.visible = false;
	const plateHits = [];
	LEVELS.forEach(([k, name, col], i) => {
		if(i === 0) return;
		const r = 27 + i*6.5, y = -2.2 - i*2.4;
		const m = mesh(G(new THREE.CylinderGeometry(r, r + .8, 1.6, 48)), M(col, { roughness:.6 }), 0, y, 0, plates); m.receiveShadow = true;
		const l = label(name, { bg:col, fg:"#fff", size:.03 }); l.position.set(0, y + 1.2, r - 1); plates.add(l);
		plateHits.push({ k, m, l });
	});
	{ const l = label(LEVELS[0][1], { bg:LEVELS[0][2], fg:"#fff", size:.03 }); l.position.set(0, 1.2, 25.5); plates.add(l); plateHits.push({ k:"commune", m:town.children[0], l }); }

	/* --- les parcelles de la friche --- */
	const plots = new THREE.Group(); scene.add(plots); plots.visible = false;
	const heatMats = [];
	for(const P of PLOTS){
		const g = new THREE.Group(); g.position.set(P.x, 0, P.z); plots.add(g);
		const slab = mesh(G(new THREE.BoxGeometry(2.8, .12, 2.6)), M("#a7a39a"), 0, .06, 0, g);
		const heat = new THREE.Mesh(G(new THREE.PlaneGeometry(2.8, 2.6)), new THREE.MeshBasicMaterial({ color:"#ff5a3a", transparent:true, opacity:0, depthWrite:false })); heat.rotation.x = -Math.PI/2; heat.position.y = .14; g.add(heat); heatMats.push(heat.material);
		const content = new THREE.Group(); g.add(content);
		P.g = g; P.slab = slab; P.heat = heat; P.content = content;
	}
	function buildTile(P){
		P.content.clear(); const t = P.tile && TILES[P.tile]; if(!t) return;
		const c = P.content;
		if(P.tile === "jardins"){ box(2.4, .2, 2.2, "#6b4a2e", 0, .12, 0, c); for(let i = 0; i < 6; i++) mesh(G(new THREE.ConeGeometry(.18, .5, 5)), M(["#6aa84f", "#8bc34a", "#e0a33a"][i % 3]), -.8 + (i % 3)*.8, .55, i < 3 ? -.5 : .5, c); }
		else if(P.tile === "arbres"){ box(2.6, .14, 2.4, "#6f9a55", 0, .12, 0, c); for(const [x, z] of [[-.7, -.6], [.7, -.5], [0, .6]]){ mesh(G(new THREE.CylinderGeometry(.1, .14, .8, 6)), M("#6b4a2e"), x, .6, z, c); mesh(G(new THREE.IcosahedronGeometry(.7, 0)), M("#2e7d4f"), x, 1.4, z, c); } }
		else if(P.tile === "parking"){ box(2.7, .14, 2.5, "#55595f", 0, .12, 0, c); [["#c4532f", -.7], ["#2c5f9e", 0], ["#e0a33a", .7]].forEach(([col, x]) => box(.5, .4, 1, col, x, .26, 0, c)); }
		else if(P.tile === "logements"){ box(2.4, 3.2, 2.2, t.col, 0, .12, 0, c); roof(2.6, 2.4, .9, "#8f4535", 0, 3.32, 0, c); }
		else { box(2.5, 1.6, 2.2, t.col, 0, .12, 0, c); box(2.7, .15, 2.4, "#e8e2d4", 0, 1.72, 0, c); }
		const l = label(t.ic, { size:.03 }); l.position.y = P.tile === "logements" ? 4.6 : 2.6; c.add(l);
	}

	/* --- les bocaux du budget, les piles de pièces --- */
	const jars = new THREE.Group(); jars.position.set(0, 0, 0); scene.add(jars); jars.visible = false;
	const JARS = {};
	[["invest", "Investissement", -4.2, INVEST], ["fonct", "Fonctionnement", 4.2, FONCT]].forEach(([k, name, x, need]) => {
		const g = new THREE.Group(); g.position.set(x, 4.2, -1); jars.add(g);
		const glass = new THREE.Mesh(G(new THREE.CylinderGeometry(2, 2, 5, 32, 1, true)), new THREE.MeshStandardMaterial({ color:"#cfe6f5", transparent:true, opacity:.35, side:THREE.DoubleSide, roughness:.1 })); own.push(glass.material); glass.position.y = 2.5; g.add(glass);
		mesh(G(new THREE.CylinderGeometry(2.05, 2.05, .25, 32)), M("#8d9196"), 0, 0, 0, g);
		const fill = mesh(G(new THREE.CylinderGeometry(1.85, 1.85, 1, 32)), M("#e0a33a", { metalness:.5, roughness:.35 }), 0, .1, 0, g); fill.scale.y = .001;
		const line = mesh(G(new THREE.TorusGeometry(2.02, .05, 6, 40)), new THREE.MeshBasicMaterial({ color:"#c4532f" }), 0, 4.6, 0, g); line.rotation.x = Math.PI/2;
		const l = label(name, { size:.028 }); l.position.y = 6.2; g.add(l);
		JARS[k] = { g, fill, need, sum:0, k };
	});
	box(14, .4, 5, "#c9b08a", 0, 3.8, -1, jars); box(26, .4, 7.4, "#c9b08a", 0, 3.8, 6.4, jars);
	for(const [x, z] of [[-6.5, -3], [6.5, -3], [-12.5, 9.6], [12.5, 9.6], [-12.5, 3.2], [12.5, 3.2]]) box(.3, 3.8, .3, "#8a6440", x, 0, z, jars);
	const stacks = new THREE.Group(); scene.add(stacks); stacks.visible = false;

	/* --- les enseignes --- */
	const signs = new THREE.Group(); scene.add(signs); signs.visible = false;
	const signHits = [];
	SIGNS.forEach((s, i) => {
		const g = new THREE.Group(); g.position.set(-6 + i*4, 0, 9); signs.add(g);
		mesh(G(new THREE.CylinderGeometry(.06, .06, 3.2, 6)), M("#555"), 0, 1.6, 0, g);
		const c = document.createElement("canvas"); c.width = 360; c.height = 150; const x = c.getContext("2d");
		x.fillStyle = s.col; x.beginPath(); x.roundRect(4, 4, 352, 142, 16); x.fill(); x.fillStyle = "#fff"; x.textAlign = "center";
		x.font = "900 56px Nunito, sans-serif"; x.fillText(s.t, 180, 72); x.font = "700 21px Nunito, sans-serif"; x.fillText(s.d, 180, 118);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; own.push(t);
		const board = mesh(G(new THREE.BoxGeometry(3.4, 1.4, .1)), [M(s.col), M(s.col), M(s.col), M(s.col), new THREE.MeshStandardMaterial({ map:t }), M(s.col)], 0, 3.6, 0, g);
		signHits.push({ id:s.id, g, board });
	});

	/* --- l'hémicycle du conseil municipal --- */
	const hall = new THREE.Group(); hall.position.set(0, 0, -70); scene.add(hall); hall.visible = false;
	mesh(G(new THREE.CylinderGeometry(20, 20, .4, 48)), M("#a9876a"), 0, -.2, 0, hall);
	box(30, 3, .6, "#efe3cf", 0, 0, -12, hall); box(4, 1.4, 2, "#6b4a2e", 0, 0, -8, hall);
	const flagM = label("Conseil municipal · Marquelle", { size:.03 }); flagM.position.set(0, 4, -12); hall.add(flagM);
	const seats = [];
	{
		// 33 sièges en trois rangs, face à la tribune ; la majorité à gauche, l'opposition à droite, dix indécis répartis
		const pos = [];
		[[7, 9], [10.5, 11], [14, 13]].forEach(([r, n]) => { for(let i = 0; i < n; i++){ const a = Math.PI*(.1 + .8*i/(n - 1)); pos.push([Math.cos(a)*r, -8 + Math.sin(a)*r, a]); } });
		pos.sort((p, q) => q[2] - p[2]);      // de gauche (angle grand) à droite
		const und = shuffle(UNDECIDED.slice()), undIdx = new Set([2, 5, 8, 11, 14, 17, 20, 23, 26, 29]);
		let pour = 14, u = 0;
		pos.forEach(([x, z], i) => {
			const sk = undIdx.has(i) ? { k:"ind", c:und[u++] } : pour-- > 0 ? { k:"pour" } : { k:"contre" };
			const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(0 - x, -8 - z); hall.add(g);
			box(1.2, .5, 1, "#6b4a2e", 0, 0, 0, g);
			const p = makePerson(g, true, ["pro", "senior", "casual", "pro"][i % 4]); p.g.position.set(0, .1, .1); p.g.scale.multiplyScalar(.8);
			const chip = mesh(G(new THREE.CylinderGeometry(.35, .35, .12, 16)), new THREE.MeshBasicMaterial({ color:sk.k === "pour" ? "#2f6b45" : sk.k === "contre" ? "#c4532f" : "#9aa1aa" }), 0, 2.6, 0, g); own.push(chip.material);
			let tag = null; if(sk.k === "ind"){ tag = label(CONCERNS[sk.c][0], { size:.022 }); tag.position.y = 3.4; g.add(tag); }
			const hit = new THREE.Mesh(G(new THREE.CylinderGeometry(.9, .9, 3, 8)), new THREE.MeshBasicMaterial({ visible:false })); hit.position.y = 1.4; g.add(hit);
			seats.push({ i, g, p, chip, tag, hit, k:sk.k, c:sk.c, won:false });
		});
	}

	/* --- caméra, décalage sous le panneau --- */
	let cam = null;
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	let lastFly = null, lastAspect = 0;
	function fly(target, dist, polar = .85, az = .35, dur = 1.6){ lastFly = [target, dist, polar, az];
		const t1 = target.clone(), p1 = new THREE.Vector3(Math.sin(polar)*Math.sin(az), Math.cos(polar), Math.sin(polar)*Math.cos(az)).multiplyScalar(Math.min(controls.maxDistance, dist*(camera.aspect < 1 ? Math.min(3.8, 1.1/camera.aspect) : 1))).add(t1);
		cam = { k:0, dur, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	let VO = "";
	function resize(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		if(w < 760){ const d = Math.min(h*.5, panel.offsetHeight + 8); camera.setViewOffset(w, h + d, 0, d, w, h); VO = "b" + d; }
		else { const pw = 402; camera.setViewOffset(w + pw, h, pw, 0, w, h); VO = "r"; }
		camera.updateProjectionMatrix();
		if(lastFly && Math.abs(camera.aspect - lastAspect) > .05){ lastAspect = camera.aspect; fly(...lastFly, .5); }
		lastAspect = camera.aspect;
	}
	addEventListener("resize", resize); resize();
	camera.position.set(22, 30, 34); controls.target.set(0, 0, 0);

	/* --- toucher, glisser --- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4.6);
	let onTap = null, tapTargets = () => [], down = null, drag = null, onDrop = null, dragables = [];
	const setRay = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); };
	canvas.addEventListener("pointerdown", e => {
		down = { x:e.clientX, y:e.clientY };
		if(!dragables.length) return;
		setRay(e);
		const h = ray.intersectObjects(dragables.map(d => d.hit), true)[0];
		if(h){ const d = dragables.find(q => q.hit === h.object || q.hit.children.includes(h.object)); if(d){ drag = d; controls.enabled = false; canvas.setPointerCapture(e.pointerId); } }
	});
	canvas.addEventListener("pointermove", e => {
		if(!drag) return; setRay(e);
		const p = ray.ray.intersectPlane(groundPlane, new THREE.Vector3()); if(p){ drag.g.position.set(p.x, 5.2, p.z); }
	});
	canvas.addEventListener("pointerup", e => {
		if(drag){ const d = drag; drag = null; controls.enabled = true; onDrop && onDrop(d); return; }
		if(!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10){ down = null; return; }
		down = null; if(!onTap) return;
		setRay(e);
		const list = tapTargets(), h = ray.intersectObjects(list.map(t => t.hit), true)[0];
		if(h){ const t = list.find(q => q.hit === h.object || (q.hit.children && q.hit.children.includes(h.object))); onTap(t ? t.id : null); }
		else onTap(null);
	});

	/* --- la boucle --- */
	let raf = 0, last = performance.now(), tick = null;
	function frame(now){
		raf = requestAnimationFrame(frame);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(const h of people){
			if(h.t < 1){
				h.t = Math.min(1, h.t + dt/1.6); const e = ease(h.t);
				h.p.g.position.lerpVectors(h.from, h.to, e); h.p.g.position.y = Math.abs(Math.sin(h.t*Math.PI*6))*.12*(1 - h.t);
				const dx = h.to.x - h.from.x, dz = h.to.z - h.from.z; if(Math.hypot(dx, dz) > .1) h.p.g.rotation.y = Math.atan2(dx, dz);
			}
		}
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		tick && tick(now, dt);
		if(innerWidth < 760 && VO !== "b" + Math.min(innerHeight*.5, panel.offsetHeight + 8)) resize();
		controls.update();
		renderer.render(scene, camera);
	}

	/* ================= l'interface ================= */
	function stage(k, title, head){
		root.querySelectorAll(".mq-steps span").forEach(s => { const i = STEPS_UI.findIndex(x => x[0] === s.dataset.s), n = STEPS_UI.findIndex(x => x[0] === k); s.className = i < n ? "done" : i === n ? "now" : ""; });
		if(askTag){ scene.remove(askTag); askTag = null; }
		$("[data-head]").textContent = head; ev("stage", title); stepErr = 0; onTap = null; tick = null; dragables = []; onDrop = null; tapTargets = () => [];
	}
	const hud = () => { $('[data-h="stars"]').textContent = S.stars; $('[data-h="err"]').textContent = S.errors; };
	function stars(n){ S.stars += n; hud(); return `<div class="mq-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	let stepErr = 0, askTag = null;      // erreurs de l'étape en cours (pour ses étoiles), demande affichée au-dessus de la ville
	function err(){ S.errors++; stepErr++; hud(); play("bad"); ev("err"); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="mq-course"><small>En licence AES-E · ${y}</small><b>${n}</b><span>${t}</span></div>`; }
	const sayHTML = t => `<div class="mq-say"><span class="mq-av">SL</span><p><small>Sophie Lefebvre, directrice des services</small>${t}</p></div>`;
	function show(html){ panel.innerHTML = html; panel.scrollTop = 0; }
	const append = html => { const el = panel.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); panel.scrollTop = panel.scrollHeight; } };
	const next = (k, t) => `<button class="mq-go" data-next="${k}">${t}</button>`;
	panel.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });

	/* ---------- 1 · écouter la ville : l'horloge, les habitants, les quotas (scène d'ouverture) ---------- */
	function enq(){
		stage("enq", "1 · Écouter la ville", "La filature ferme : que faire de la friche ?");
		usine.visible = true; plots.visible = false; plates.visible = false; jars.visible = false; stacks.visible = false; signs.visible = false; hall.visible = false; town.visible = true;
		S.met = []; S.slot = 0; S.full = 0; for(const h of people) h.mark.visible = false; placeAll(0, false);
		fly(new THREE.Vector3(0, 0, 1), 50, .88, .3);
		const first = !S.enqDone;
		const render = () => {
			const n = { jeune:0, actif:0, retraite:0 }; for(const i of S.met) n[people[i].cat]++;
			show(`${sayHTML(first ? `Bienvenue à la mairie ! La filature Delattre vient de fermer : <b>120 emplois</b>, <b>deux hectares</b> de friche. Avant de décider, on écoute les habitants. <b>Touche-les</b> pour les interroger, et respecte les quotas : il faut un échantillon qui ressemble à Marquelle.` : `On refait l'enquête : <b>touche les habitants</b>, et change l'heure pour croiser tout le monde.`)}
				<div class="mq-k">${first ? `Mini-jeu · ${formation.name}` : "L2 · méthodes d'enquête"}</div><div class="mq-h">Qui veut quoi ?</div>
				<div class="mq-clock">${SLOTS.map(([h, d], i) => `<button data-slot="${i}" class="${S.slot === i ? "on" : ""}">${h}<small>${d}</small></button>`).join("")}</div>
				<div class="mq-quota">${Object.keys(QUOTA).map(c => `<div><span>${CAT_LABEL[c]}</span>${Array.from({ length:QUOTA[c] }, (_, j) => `<i class="${j < n[c] ? "f" : ""}"></i>`).join("")}</div>`).join("")}</div>
				<div data-live></div>`);
			panel.querySelectorAll("[data-slot]").forEach(b => b.onclick = () => { const s = +b.dataset.slot; if(s === S.slot) return; S.slot = s; play("swipe"); placeAll(s); render(); });
		};
		render();
		tapTargets = () => people.filter(h => h.p.g.visible).map(h => ({ id:h.i, hit:h.hit }));
		onTap = id => {
			if(id === null || id === undefined) return;
			const h = people[id];
			if(S.met.includes(id)){ append(`<div class="mq-quote"><b>${h.name}</b>Déjà interrogé·e.</div>`); return; }
			const n = S.met.filter(i => people[i].cat === h.cat).length;
			if(n >= QUOTA[h.cat]){ play("bad"); S.full = (S.full || 0) + 1; append(`<div class="mq-quote full"><b>${h.name} · quota « ${CAT_LABEL[h.cat]} » déjà rempli</b>Cherche d'autres habitants : change l'heure, va où ils sont.</div>`); return; }
			S.met.push(id); h.mark.visible = true; play("pop");
			const bubble = `<div class="mq-quote"><b>${h.name} · ${CAT_LABEL[h.cat]}</b>« ${h.quote} »</div>`;
			render(); append(bubble);
			if(S.met.length === 7) later(700, done);
		};
		function done(){
			onTap = null; play("chime");
			const tally = {}; for(const i of S.met){ const w = people[i].wish; tally[w] = (tally[w] || 0) + 1; }
			const market = people.filter(h => h.spots[0] === "M"), mt = {}; for(const h of market) mt[h.wish] = (mt[h.wish] || 0) + 1;
			const keys = Object.keys(WISH), top = keys.sort((a, b) => (tally[b] || 0) - (tally[a] || 0))[0];
			const n = (S.full || 0) <= 1 ? 3 : (S.full || 0) <= 3 ? 2 : 1;
			if(n === 3) play("good");
			append(`${stars(n)}<p class="mq-p"><b>Ton échantillon par quotas</b> (7 habitants) :</p>
				<div class="mq-bars">${Object.keys(WISH).map(k => `<div><span>${WISH[k].split(" (")[0]}</span><em style="width:${(tally[k] || 0)/7*100}%"></em><b>${tally[k] || 0}</b></div>`).join("")}</div>
				<p class="mq-p"><b>Si tu n'avais interrogé que le marché de 10 h</b> (${market.length} personnes, presque toutes retraitées) :</p>
				<div class="mq-bars">${Object.keys(WISH).map(k => `<div><span>${WISH[k].split(" (")[0]}</span><em class="b" style="width:${(mt[k] || 0)/market.length*100}%"></em><b>${mt[k] || 0}</b></div>`).join("")}</div>
				<p class="mq-p">Au marché, un mardi matin, le parking l'emporte. Dans un échantillon qui ressemble à la ville, c'est <b>${WISH[top].toLowerCase()}</b>. L'heure et le lieu de l'enquête décident de qui répond.</p>${course("enq")}${first ? "" : next("inst", "Suite : les échelons →")}`);
			S.enqDone = true;
			if(first) later(2400, () => palier({ id:"marquelle", onEvent, openLead, quit:close,
				titre:"Tu as entendu la vraie Marquelle, pas seulement son marché.",
				texte:"Il reste un mois avant le conseil municipal : renvoyer chaque demande au bon échelon, aménager la friche, boucler le budget, choisir la structure… et gagner le vote.",
				suite:"Porter tout le projet (≈ 6 min)" }).then(inst));
		}
	}

	/* ---------- 2 · les échelons : renvoyer chaque demande à la bonne collectivité ---------- */
	function inst(){
		stage("inst", "2 · Les échelons", "La mairie croule sous les demandes");
		plates.visible = true;
		fly(new THREE.Vector3(0, -5, 10), 118, 1.05, .15, 2);
		const asks = shuffle(ASKS.slice()); let i = 0;
		show(`${sayHTML("Tout le monde vient nous voir, mais tout ne relève pas de la mairie. La ville est posée sur ses <b>échelons</b> : département, région, État. <b>Touche l'échelon</b> qui doit traiter chaque demande.")}
			<div class="mq-k">L1 · institutions et droit public</div><div class="mq-h">À qui transmettre ?</div><div data-ask></div><div data-live></div>`);
		const render = () => {
			const a = asks[i]; if(askTag){ scene.remove(askTag); askTag = null; }
			if(!a) return done();
			panel.querySelector("[data-ask]").innerHTML = `<div class="mq-ask"><small>Demande ${i + 1} / ${asks.length} · ${a.from}</small><b>« ${a.t} »</b></div>`;
			askTag = label("📨 " + a.t.slice(0, 28) + (a.t.length > 28 ? "…" : ""), { size:.026, bg:"#fff7e6" }); const [x, z] = SPOT[a.at]; askTag.position.set(x, 4, z); scene.add(askTag);
		};
		tapTargets = () => plateHits.map(p => ({ id:p.k, hit:p.m }));
		onTap = k => {
			const a = asks[i]; if(!a || !k) return;
			if(k !== a.k){ err(); append(`<p class="mq-p" style="color:#a0381e">✗ Pas « ${LEVELS.find(l => l[0] === k)[1]} ». ${a.k === "commune" ? "Celle-ci, c'est bien pour nous." : a.k === "dep" ? "Collèges, RSA, action sociale : pense au département." : a.k === "region" ? "Lycées, TER, aides aux entreprises : la région." : "Aucune collectivité locale ne dirige la police nationale."}</p>`); return; }
			play("good"); append(`<p class="mq-ok">✓ ${LEVELS.find(l => l[0] === k)[1]} : ${a.why}</p>`);
			i++; render();
		};
		render();
		function done(){
			onTap = null; if(askTag){ scene.remove(askTag); askTag = null; }
			const n = stepErr === 0 ? 3 : stepErr <= 2 ? 2 : 1; play("chime");
			append(`${stars(n)}<p class="mq-p">Pour la friche, il faudra donc frapper à plusieurs portes : la <b>région</b> pour l'emploi et les entreprises, l'<b>État</b> et le <b>département</b> pour les aides.</p>${course("inst")}${next("plan", "Suite : aménager la friche →")}`);
		}
	}

	/* ---------- 3 · aménager la friche, sous la carte de chaleur ---------- */
	function plan(){
		stage("plan", "3 · Aménager la friche", "Que construire sur la friche ?");
		plates.visible = false; usine.visible = false; plots.visible = true; placeAll(3);      // le soir : les habitants rentrent chez eux
		for(const P of PLOTS){ P.tile = null; buildTile(P); }
		fly(new THREE.Vector3(0, 0, 0), 26, .72, .25);
		let pick = "ressourcerie", heatOn = true, tries = 0;
		const stats = () => {
			let jobs = 0, perm = 0, T = 0, park = 0, lodge = 0, tiers = 0;
			for(const P of PLOTS){ const t = P.tile && TILES[P.tile]; if(!t){ T += BETON; continue; } jobs += t.jobs; if(t.perm) perm++; T += t.heat; park += t.park || 0; lodge += t.lodge || 0; if(t.tiers) tiers++; }
			return { jobs, perm, T, park, lodge, tiers, garden:PLOTS.some(P => P.tile === "jardins") };
		};
		const gauge = (name, txt, pct, ok) => `<div class="mq-g"><span>${ok ? "✅" : "⬜"} ${name}<b>${txt}</b></span><em><i style="width:${Math.max(4, Math.min(100, pct))}%;background:${ok ? "#2f6b45" : "#e0a33a"}"></i></em></div>`;
		const render = () => {
			const s = stats();
			const ok = { jobs:s.jobs >= 20, perm:s.perm >= 6, T:s.T <= .5, wish:s.tiers >= 1 && s.garden };
			show(`${sayHTML("Douze parcelles. <b>Choisis un aménagement, puis touche une parcelle</b>. Les habitants veulent un tiers-lieu et des jardins ; le maire veut des emplois ; et l'été, cette dalle de béton est un four. La carte de chaleur te dira où ça chauffe.")}
				<div class="mq-k">L3 · transitions et territoires</div><div class="mq-h">Douze parcelles, quatre objectifs</div>
				<div class="mq-pal">${Object.entries(TILES).map(([k, t]) => `<button data-t="${k}" class="${pick === k ? "on" : ""}"><i>${t.ic}</i>${t.n}</button>`).join("")}<button data-t="">🧹 Vider</button></div>
				<div class="mq-gauges">
					${gauge("Emplois créés", s.jobs + " / 20", s.jobs/20*100, ok.jobs)}
					${gauge("Sol perméable", s.perm + " / 12 parcelles (6 min.)", s.perm/12*100, ok.perm)}
					${gauge("Chaleur l'été", (s.T >= 0 ? "+" : "") + fr(s.T, 1) + " °C (≤ +0,5)", (3 - s.T)/3.5*100, ok.T)}
					${gauge("Envies des habitants", (s.tiers ? "tiers-lieu ✓ " : "tiers-lieu ✗ ") + (s.garden ? "jardins ✓" : "jardins ✗"), (s.tiers ? 50 : 0) + (s.garden ? 50 : 0), ok.wish)}
				</div>
				<button class="mq-alt" data-heat>${heatOn ? "🌡️ Masquer" : "🌡️ Afficher"} la carte de chaleur</button>
				<button class="mq-go" data-ok>Valider l'aménagement</button><div data-live></div>`);
			panel.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { pick = b.dataset.t || null; play("clic"); render(); });
			panel.querySelector("[data-heat]").onclick = () => { heatOn = !heatOn; paintHeat(); render(); };
			panel.querySelector("[data-ok]").onclick = () => {
				const s2 = stats(), good = s2.jobs >= 20 && s2.perm >= 6 && s2.T <= .5 && s2.tiers >= 1 && s2.garden;
				if(!good){ tries++; err(); append(`<p class="mq-p" style="color:#a0381e">✗ Pas encore : ${[s2.jobs < 20 ? "trop peu d'emplois" : "", s2.perm < 6 ? "trop de sol imperméable" : "", s2.T > .5 ? "la friche reste un îlot de chaleur" : "", !(s2.tiers >= 1 && s2.garden) ? "les envies des habitants ne sont pas là" : ""].filter(Boolean).join(", ")}.</p>`); return; }
				S.plan = s2; onTap = null; play("good");
				panel.querySelector("[data-ok]").disabled = true; panel.querySelectorAll("[data-t]").forEach(b => b.disabled = true);
				append(`${stars(tries === 0 ? 3 : tries === 1 ? 2 : 1)}<p class="mq-p"><b>${s2.jobs} emplois</b>, <b>${s2.perm} parcelles</b> de sol vivant, la chaleur passe de +3 °C à <b>${s2.T >= 0 ? "+" : ""}${fr(s2.T, 1)} °C</b>${s2.park ? `, ${s2.park} places de parking` : ""}${s2.lodge ? `, ${s2.lodge} logements` : ""}. Chaque case est un arbitrage : un parking ne crée aucun emploi et chauffe, un jardin rafraîchit mais emploie peu.</p>${course("trans")}${next("fin", "Suite : le budget →")}`);
			};
		};
		function paintHeat(){ PLOTS.forEach((P, i) => { const t = P.tile && TILES[P.tile], h = t ? t.heat : BETON; const m = heatMats[i]; m.opacity = heatOn ? Math.min(.65, Math.abs(h)*1.2) : 0; m.color.set(h > 0 ? "#ff5a3a" : "#3a8dff"); }); }
		tapTargets = () => PLOTS.map(P => ({ id:P.id, hit:P.slab }));
		onTap = id => { if(id === null) return; const P = PLOTS[id]; P.tile = pick; buildTile(P); paintHeat(); play(pick ? "pop" : "swipe"); render(); };
		paintHeat(); render();
	}

	/* ---------- 4 · le budget : verser les piles dans les bocaux ---------- */
	function fin(){
		stage("fin", "4 · Le budget", "Qui paie la reconversion ?");
		plots.visible = true; jars.visible = true; stacks.visible = true; stacks.clear();
		fly(new THREE.Vector3(0, 4.5, 2), 30, .95, 0);
		const n = S.news = S.news || NEWS[Math.floor(Math.random()*NEWS.length)];
		const subs = n.aides.map(([who, p]) => ({ id:who, t:`${who} · ${p} %`, short:who.split(" · ")[0], v:INVEST*p/100, jar:"invest", kind:"sub" }));
		const totSub = n.aides.reduce((a, [, p]) => a + p, 0), emprunt = INVEST*(100 - totSub)/100;
		const piles = shuffle([...subs, { id:"emprunt", t:`Emprunt de la commune`, short:"Emprunt", v:emprunt, jar:"invest", kind:"emprunt" }, { id:"recettes", t:"Recettes du lieu (ventes, loyers)", short:"Recettes", v:80000, jar:"fonct", kind:"rec" }, { id:"impots", t:"Budget communal (impôts locaux)", short:"Impôts locaux", v:40000, jar:"fonct", kind:"rec" }]);
		for(const j of Object.values(JARS)){ j.sum = 0; j.fill.scale.y = .001; }
		const dr = piles.map((p, i) => {
			const g = new THREE.Group(), home = new THREE.Vector3(-9 + (i % 4)*6, 4.2, 4.6 + Math.floor(i/4)*3.4); g.position.copy(home); stacks.add(g);
			const h = Math.max(.3, p.jar === "invest" ? p.v/INVEST*4.5 : p.v/FONCT*4.5);
			const coin = mesh(G(new THREE.CylinderGeometry(.75, .75, h, 20)), M(p.kind === "emprunt" ? "#c4532f" : p.kind === "rec" ? "#2c5f9e" : "#e0a33a", { metalness:.4, roughness:.4 }), 0, h/2, 0, g);
			const l = label(`${p.short} · ${fr(p.v/1000)} k€`, { size:.022 }); l.position.y = h + .8; g.add(l);
			return { id:p.id, p, g, hit:coin, home, h };
		});
		dragables = dr;
		show(`${sayHTML("Deux bocaux, deux budgets : l'<b>investissement</b> (les travaux, une fois) et le <b>fonctionnement</b> (faire vivre le lieu, chaque année). <b>Glisse chaque pile dans le bon bocal</b> jusqu'aux traits rouges. Attention, l'argent ne va pas n'importe où.")}
			<div class="mq-news"><b>📰 ${n.t}</b>${n.d}</div>
			<div class="mq-k">L2 · finances publiques</div><div class="mq-h">${euro(INVEST)} de travaux, ${euro(FONCT)} par an</div><div data-live></div>`);
		const JX = { invest:new THREE.Vector3(-4.2, 4.6, -1), fonct:new THREE.Vector3(4.2, 4.6, -1) };
		let placed = 0;
		onDrop = d => {
			const pos = d.g.position, near = Object.entries(JX).find(([, v]) => Math.hypot(pos.x - v.x, pos.z - v.z) < 3.2);
			const back = () => { const from = d.g.position.clone(), t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0)/300); d.g.position.lerpVectors(from, d.home, ease(k)); if(k < 1 && !closed) requestAnimationFrame(f); }; f(); };
			if(!near){ back(); return; }
			const [jk] = near;
			if(jk !== d.p.jar){
				err(); back();
				append(`<p class="mq-p" style="color:#a0381e">✗ ${d.p.kind === "emprunt" ? "<b>Règle d'or</b> : une commune n'emprunte jamais pour payer ses dépenses de fonctionnement, seulement pour investir." : d.p.kind === "sub" ? "Ces subventions sont versées pour les travaux : elles vont à l'investissement." : "Les recettes du lieu et le budget courant financent le fonctionnement, chaque année."}</p>`);
				return;
			}
			const J = JARS[jk]; J.sum += d.p.v; J.fill.scale.y = Math.max(.001, J.sum/J.need*4.5); J.fill.position.y = .1 + J.fill.scale.y/2;
			stacks.remove(d.g); dragables = dragables.filter(q => q !== d); placed++; play("coin");
			append(`<p class="mq-ok">✓ ${d.p.t} → ${jk === "invest" ? "investissement" : "fonctionnement"}</p>`);
			if(placed === dr.length){
				const share = Math.round((100 - totSub));
				append(`${stars(stepErr === 0 ? 3 : stepErr <= 2 ? 2 : 1)}<p class="mq-p">Les deux bocaux sont pleins. La commune emprunte <b>${euro(emprunt)}</b>, soit <b>${share} %</b> des travaux ; la loi lui impose d'en financer au moins 20 % elle-même. ${n.id === "region" ? "La Région ayant réduit son aide, l'emprunt monte à la moitié des travaux." : n.id === "feder" ? "Grâce au FEDER, l'emprunt baisse de 150 000 €." : ""}</p>${course("fin")}${next("ess", "Suite : l'enseigne du lieu →")}`);
				S.budget = { emprunt, share };
			}
		};
	}

	/* ---------- 5 · l'enseigne : la bonne structure de l'économie sociale et solidaire ---------- */
	function ess(){
		stage("ess", "5 · L'enseigne", "Qui fera vivre le tiers-lieu ?");
		jars.visible = false; stacks.visible = false; plots.visible = true; usine.visible = false; signs.visible = true;
		fly(new THREE.Vector3(0, 2, 5), 24, .9, .15);
		show(`${sayHTML("Le lieu vendra (objets réparés, cafés), créera des emplois, et doit associer <b>salariés, habitants, associations et la commune</b> aux décisions, sans enrichir des actionnaires. <b>Touche l'enseigne</b> à accrocher sur la façade.")}
			<div class="mq-k">L2 · économie sociale et solidaire</div><div class="mq-h">Quelle structure ?</div><div data-live></div>`);
		tapTargets = () => signHits.map(s => ({ id:s.id, hit:s.board }));
		onTap = id => {
			if(!id || S.sign) return;
			const s = SIGNS.find(q => q.id === id), sh = signHits.find(q => q.id === id);
			if(!s.ok){ err(); const g = sh.g, r0 = g.rotation.z, t0 = performance.now(); const f = () => { const k = (performance.now() - t0)/500; g.rotation.z = k < 1 ? Math.sin(k*20)*.15*(1 - k) : r0; if(k < 1 && !closed) requestAnimationFrame(f); }; f(); append(`<p class="mq-p" style="color:#a0381e">✗ ${s.t} : ${s.why}</p>`); return; }
			S.sign = id; play("good"); onTap = null;
			const g = sh.g, from = g.position.clone(), to = new THREE.Vector3(0, 1.4, 4.2), t0 = performance.now();
			const f = () => { const k = Math.min(1, (performance.now() - t0)/900); g.position.lerpVectors(from, to, ease(k)); g.position.y += Math.sin(k*Math.PI)*2; if(k < 1 && !closed) requestAnimationFrame(f); }; f();
			for(const o of signHits) if(o !== sh) o.g.visible = false;
			append(`${stars(stepErr === 0 ? 3 : stepErr === 1 ? 2 : 1)}<p class="mq-ok">✓ SCIC : société coopérative d'intérêt collectif.</p><p class="mq-p">${s.why} Une entreprise, au service du territoire.</p>${course("ess")}${next("vote", "Jeudi, 19 h : le conseil municipal →")}`);
		};
	}

	/* ---------- 6 · le conseil municipal : convaincre les indécis, puis voter ---------- */
	function vote(){
		stage("vote", "6 · Le conseil municipal", "Ce soir, le conseil vote");
		signs.visible = false; hall.visible = true;
		const center = new THREE.Vector3(0, 1, -69);
		fly(center, 25, .82, Math.PI, 2.2);      // vu depuis la tribune, face aux élus
		const P = S.plan || { jobs:20, perm:6, T:0, park:0, lodge:0 }, B = S.budget || { emprunt:450000, share:30 };
		const ARGS = {
			budget:{ ic:"💶", t:`La commune n'emprunte que ${euro(B.emprunt)} (${B.share} %) : le reste, ce sont des subventions.`, ok:true },
			climat:{ ic:"🌳", t:`${P.perm} parcelles de sol perméable, et la friche passe de +3 °C à ${P.T >= 0 ? "+" : ""}${fr(P.T, 1)} °C l'été.`, ok:true },
			emploi:{ ic:"🧑‍🔧", t:`${P.jobs} emplois dans le tiers-lieu, d'abord pour les anciens de la filature.`, ok:true },
			parking:{ ic:"🚗", t:P.park ? `${P.park} places de parking conservées pour le marché.` : "Aucune place de parking prévue…", ok:!!P.park }
		};
		let sel = null;
		for(const s of seats){ s.won = false; s.chip.material.color.set(s.k === "pour" ? "#2f6b45" : s.k === "contre" ? "#c4532f" : "#9aa1aa"); }
		const count = () => seats.filter(s => s.k === "pour" || s.won).length;
		const render = () => {
			const v = count();
			show(`${sayHTML("33 élus, il faut <b>17 voix</b>. La majorité en a 14, l'opposition votera contre. Restent <b>10 indécis</b> : au-dessus de chacun, ce qui le préoccupe. <b>Choisis un argument, puis touche l'élu</b> qu'il peut convaincre.")}
				<div class="mq-k">L3 · action publique et démocratie locale</div><div class="mq-h">Gagner le vote</div>
				<div class="mq-votes">${v} <small>voix pour sur 33 · il en faut 17</small></div>
				<div class="mq-cards">${Object.entries(ARGS).map(([k, a]) => `<button class="mq-card ${sel === k ? "on" : ""} ${a.ok ? "" : "weak"}" data-arg="${k}"><i>${a.ic}</i>${a.t}</button>`).join("")}</div>
				<button class="mq-go" data-vote ${v >= 17 ? "" : "disabled"}>Passer au vote</button><div data-live></div>`);
			panel.querySelectorAll("[data-arg]").forEach(b => b.onclick = () => { sel = b.dataset.arg; play("clic"); render(); });
			panel.querySelector("[data-vote]").onclick = doVote;
		};
		tapTargets = () => seats.filter(s => s.k === "ind" && !s.won).map(s => ({ id:s.i, hit:s.hit }));
		onTap = id => {
			if(id === null) return;
			const s = seats.find(q => q.i === id); if(!s) return;
			if(!sel){ append(`<p class="mq-p">Cet élu s'inquiète pour <b>${CONCERNS[s.c][1]}</b>. Choisis d'abord un argument.</p>`); return; }
			const a = ARGS[sel];
			if(sel !== s.c){ err(); append(`<p class="mq-p" style="color:#a0381e">✗ Lui, c'est <b>${CONCERNS[s.c][1]}</b> qui le préoccupe.</p>`); return; }
			if(!a.ok){ err(); append(`<p class="mq-p" style="color:#a0381e">✗ « Aucune place de parking ? Alors c'est non. » Ton aménagement ne répond pas à ses inquiétudes.</p>`); return; }
			s.won = true; s.chip.material.color.set("#2f6b45"); if(s.tag) s.tag.visible = false; play("good"); render();
		};
		function doVote(){
			onTap = null; const v = count();
			let k = 0; seats.forEach(s => later(60*k++, () => { s.p.g.position.y = .5; play("clic"); later(200, () => s.p.g.position.y = .1); }));
			later(60*33 + 400, () => {
				play("win");
				const n = v >= 22 ? 3 : v >= 19 ? 2 : 1;
				panel.querySelector("[data-vote]").disabled = true;
				append(`${stars(n)}<p class="mq-p"><b>${v} voix pour, ${33 - v} contre ou abstention : la délibération est adoptée.</b> ${v < 22 ? "Une majorité étroite : chaque indécis convaincu compte, et chaque arbitrage d'aménagement aussi." : "Une large majorité : le projet démarre dans de bonnes conditions."}</p>${course("pol")}<button class="mq-go" data-next="end">Lire la Gazette de demain</button>`);
				S.votes = v;
			});
		}
		render();
	}

	/* ---------- le bilan : la Gazette du lendemain ---------- */
	function end(){
		stage("vote", "Bilan", "Friche Delattre : le tiers-lieu est voté !");
		hall.visible = false; plots.visible = true; signs.visible = true;
		fly(new THREE.Vector3(0, 0, 0), 40, .8, .5, 2);
		const max = 18, s = S.stars, mention = s >= 16 ? "Très bien" : s >= 12 ? "Bien" : "Assez bien";
		ev("win", mention);
		const P = S.plan, order = ["inst", "enq", "fin", "ess", "trans", "pol"].filter(k => S.learned.has(k));
		show(`<div class="mq-k">La Gazette de Marquelle · le lendemain</div><div class="mq-h">« Friche Delattre : le tiers-lieu est voté »</div>
			<div class="mq-stars">${s} / ${max} ★ · ${mention}</div>
			<table class="mq-tbl"><tr><td>Habitants interrogés</td><td>${S.met.length} (par quotas)</td></tr>${P ? `<tr><td>Emplois créés</td><td>${P.jobs}</td></tr><tr><td>Chaleur l'été</td><td>+3 → ${P.T >= 0 ? "+" : ""}${fr(P.T, 1)} °C</td></tr>` : ""}${S.budget ? `<tr><td>Emprunt de la commune</td><td>${euro(S.budget.emprunt)}</td></tr>` : ""}<tr><td>Structure</td><td>${S.sign ? "SCIC" : "—"}</td></tr><tr><td>Vote du conseil</td><td>${S.votes ? S.votes + " / 33" : "—"}</td></tr><tr><td>Erreurs</td><td>${S.errors}</td></tr></table>
			<p class="mq-p">Tu as fait le travail d'un chargé de mission en collectivité. ${order.length} cours de la licence :</p>
			<ul class="mq-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<p class="mq-p">Après la licence : les concours de la fonction publique, l'économie sociale et solidaire, la RSE en entreprise… <small>Rejoue : les financeurs et les élus ne diront pas toujours la même chose.</small></p>
			${jpoCard()}${openLead ? `<button class="mq-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="mq-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la licence AES-E ↗</a>
			<button class="mq-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="mq-alt" data-a="replay">Rejouer</button>`);
	}

	const STEPS = { enq, inst, plan, fin, ess, vote, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){
			Object.assign(S, { stars:0, errors:0, learned:new Set(), slot:0, met:[], plan:null, news:null, sign:null, votes:0, budget:null });
			for(const sh of signHits){ sh.g.visible = true; } SIGNS.forEach((s, i) => signHits[i].g.position.set(-6 + i*4, 0, 9));
			hud(); enq();
		}
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers.clear();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		controls.dispose(); own.forEach(o => o.dispose && o.dispose());      // les personnages du kit gardent leurs géométries, partagées avec le campus
		renderer.dispose(); renderer.forceContextLoss(); root.remove();
		onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".mq-x").addEventListener("click", close);

	raf = requestAnimationFrame(frame);
	enq();      // ouverture à chaud : la ville vit déjà, on interroge tout de suite
	ev("start");
	ev("missions", [["1 · Écouter la ville", enq], ["2 · Les échelons", inst], ["3 · Aménager la friche", plan], ["4 · Le budget", fin], ["5 · L'enseigne", ess], ["6 · Le conseil municipal", vote], ["Bilan", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, tap:id => onTap && onTap(id), drop:(id, jar) => { const d = dragables.find(q => q.id === id); if(!d) return "absent"; d.g.position.set(jar === "invest" ? -4.2 : 4.2, 5.2, -1); onDrop && onDrop(d); return "ok"; }, camera, controls, people, PLOTS, seats };
}
