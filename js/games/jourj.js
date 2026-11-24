/* « La note de 8 h » — mini-jeu de la Prépa Grandes Écoles de Commerce (CUPGE, FGES, 2026).
   Le métier : chargé·e d'études, consultant·e junior. 21 h 47, un cabinet de conseil lillois, la nuit. Pavé, marque
   lilloise de baskets (fictive), perd ses clients ; sa PDG veut une recommandation pour 8 h. Le joueur dépouille la
   liasse posée sur son bureau, de la main, sur les vraies pièces :
     1 · les avis clients : passer le surligneur sur les phrases qui expliquent les départs (scène d'ouverture) ;
     2 · le courriel du directeur commercial contre le tableau des ventes : entourer les deux chiffres qui se
         contredisent (un fil rouge les relie), trouver d'où vient l'erreur (visites ≠ ventes), la ligne qui l'explique ;
     3 · l'article de presse contre le tableau (le marché −3 %, Pavé −18 %), puis le sondage biaisé, qu'on écarte ;
     4 · le rapport d'un actionnaire, en anglais : surligner les deux phrases qui comptent ;
     5 · le plan : lancer chaque fiche vers la partie I (constat), la partie II (recommandations) ou les écartées ;
     6 · la relecture : barrer au stylo rouge les trois fautes de la note imprimée ;
     7 · le comité de 8 h (le verdict) : chaque objection, en français ou en anglais, se réfute en posant la bonne fiche.
   La note se remplit à chaque preuve, dans le panneau : tout converge vers elle, puis vers le comité.
   Programme de la prépa (fiche fges.fr) : technique du document, tests TAGE (logique, français), culture générale,
   anglais écrit et oral, écrire pour convaincre, communication interpersonnelle et simulations d'entretien.
   Marque, cabinet, personnes, chiffres et documents sont fictifs ; écoles réelles citées comme débouchés.
   Contenu à relire par l'équipe de la prépa (docs/validation-prepa-cupge.md). */
import { stage3d, THREE } from "./stage3d.js?v=e370aeda6d";
import { makePerson } from "../kit.js?v=e370aeda6d";
import { jpoCard } from "./jpo.js?v=e370aeda6d";
import { palier } from "./palier.js?v=e370aeda6d";

const COURSES = {
	doc:    ["Prépa 1", "Technique du document", "Dépouiller une liasse, juger une source, ne garder que ce qui prouve : la base de toute synthèse."],
	logique:["Prépa 1 et 2", "Tests TAGE · logique", "Deux chiffres qui se contredisent, un pourcentage à recouper : le raisonnement qu'on entraîne chaque semaine."],
	lic:    ["En parallèle", "Licence Gestion ou Économie-Finance", "Taux de conversion, prix, canaux de vente : le management et l'économie de la licence que tu valides en même temps que la prépa."],
	cg:     ["Prépa 1", "Culture générale", "Conjoncture, marché, part de marché : replacer un dossier d'entreprise dans l'économie qui l'entoure."],
	en:     ["Chaque semestre", "Anglais écrit et oral, LV2", "Lire un rapport en anglais, répondre en anglais devant un comité : de l'anglais à chaque semestre, et une deuxième langue."],
	ecrire: ["Prépa 1 et 2", "Écrire pour convaincre", "Une problématique, un plan en deux parties, une preuve derrière chaque phrase : la note qui fait décider."],
	fr:     ["Prépa 1 et 2", "Tests TAGE · français", "Accords, homophones, tournures : une note qui part avec une faute perd la moitié de son crédit."],
	oral:   ["Prépa 1 à 3", "Communication interpersonnelle, simulations d'entretien", "Répondre à une objection, preuve en main, devant un comité ou un jury : on s'y entraîne avec des professionnels."],
	ast:    ["Prépa 2 et 3", "Concours AST1 et AST2", "En prépa 2, l'AST1 (IESEG, SKEMA, Grenoble EM, Tremplin, Passerelle) ; en prépa 3, l'AST2 (HEC, ESCP, emlyon, EDHEC, Audencia…), après un semestre à l'étranger."]
};
const STEPS_UI = [["avis", "Avis"], ["chiffres", "Chiffres"], ["marche", "Marché"], ["report", "Report"], ["plan", "Plan"], ["relecture", "Relecture"], ["comite", "Comité"]];
const PEOPLE = {
	helene:["Hélène Dufresne", "associée du cabinet", "HD", "#21b7cb"],
	claire:["Claire Vandamme", "PDG de Pavé", "CV", "#0f3168"],
	marc:  ["Marc Leclercq", "directeur commercial de Pavé", "ML", "#b0632a"],
	sarah: ["Sarah Whitfield", "administratrice, fonds Northbridge", "SW", "#5b4a8a"],
	me:    ["Toi", "consultant·e junior", "★", "#2f6b45"]
};
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const INK = "#1b2a44", RED = "#c62828", NAVY = "#0f3168", CYAN = "#21b7cb", GREEN = "#2f7d4a";
const SANS = "Inter,Arial,sans-serif", SERIF = "'Tiempos Headline', Times New Roman,serif";
const PXU = 240;      // pixels de texture par unité : des pièces lisibles, même sur téléphone

/* ---------- le plan (étape 5) : les fiches à lancer ---------- */
const PLAN = [
	{ id:"p1", t:"Le marché recule de 3 %,", s:"Pavé de 18 %", to:"I" },
	{ id:"p2", t:"Visites −5 %, ventes du site −35 %", s:"la conversion s'effondre", to:"I" },
	{ id:"p3", t:"Réparer le paiement", s:"sur téléphone, d'ici décembre", to:"II" },
	{ id:"p4", t:"Le paiement plante sur téléphone", s:"72 % des commandes y passent", to:"I" },
	{ id:"p5", t:"Campagne sur les réseaux", s:"pour le coloris « Brique »", to:"X" },
	{ id:"p6", t:"Expédier en 48 h", s:"depuis l'atelier de Roubaix", to:"II" },
	{ id:"p7", t:"Livraison en 9 jours,", s:"les leaders livrent en 48 h", to:"I" },
	{ id:"p8", t:"Une gamme d'entrée à 99 €", s:"sans toucher la gamme phare", to:"II" }
];
const PLAN_WHY = {
	I:"C'est un constat : il prouve, il ne propose rien. Sa place est dans la partie I.",
	II:"C'est une mesure à prendre : sa place est dans la partie II, celle des recommandations.",
	X:"Cette idée sort du sondage qu'on vient d'écarter. Et elle enverrait des visiteurs vers un paiement qui plante : au bac des écartées.",
	keep:"Ne jette pas une preuve : c'est elle qui fera décider Claire."
};
/* ---------- le comité (étape 7) ---------- */
const FICHES = [
	["conv", "Visites −5 %, ventes −35 %", "la conversion tombe de 2,0 à 1,4 %", "Pièces B et C"],
	["marche", "Marché −3 %, Pavé −18 %", "six fois plus que le marché", "Pièces B et D"],
	["sondage", "Sondage écarté", "212 abonnés déjà fans : pas représentatif", "Pièce F"],
	["mobile", "72 % des commandes sur téléphone", "et le paiement y plante", "Pièces A et E"],
	["livraison", "Livraison en 9 jours", "les leaders : 48 h ; au-delà de 5 j, 1 sur 2 annule", "Pièces A et E"],
	["prix", "Prix : 95 € → 119 €", "« trop cher pour de la toile »", "Pièces A et B"]
];
const QUESTIONS = [
	{ who:"marc", q:"Vos −35 % sur le site, je les conteste : mes chiffres à moi disent −5 %.", ok:"conv", mid:[],
		yes:"Vos −5 %, ce sont les <b>visites</b>. Les <b>ventes</b> du site, elles, baissent de 35 % : les clients viennent, mais n'achètent plus.", end:"… D'accord. Je regardais le mauvais compteur." },
	{ who:"sarah", en:true, q:"Frankly, isn't this just the market? Everybody is struggling this year.", ok:"marche", mid:[],
		yes:"<i>The market is down 3 %. Pavé is down 18 %, six times more. It isn't the market: it's our online shop.</i>", end:"<i>Fair point. Six times the market… that's on us, then.</i>" },
	{ who:"marc", q:"Nos clients adorent la marque : 87 % ! Une belle campagne sur les réseaux, et c'est reparti.", ok:"sondage", mid:[],
		yes:"Ce sondage n'interroge que 212 abonnés, déjà conquis. Et une campagne enverrait des visiteurs… vers un paiement qui plante.", end:"Bon. On garde la campagne pour après." },
	{ who:"claire", q:"Si je ne peux lancer qu'une seule chose lundi, laquelle ?", ok:"mobile", mid:["livraison"],
		yes:"Réparer le paiement sur téléphone : 72 % des commandes passent par là, et c'est là qu'on perd les clients.", end:"Clair. On commence par là." }
];
const SAND = 20;     // secondes pour répondre à une objection, preuve en main

const CSS = `
.ny{position:fixed;inset:0;z-index:40;background:#0b1426;font-family:Inter,Arial,sans-serif;font-weight:300;color:#e9f1f8;overflow:hidden;user-select:none;-webkit-user-select:none;animation:nyIn .4s ease both}
@keyframes nyIn{from{opacity:0}}
.ny canvas.ny-3d{position:absolute;inset:0;display:block;touch-action:none}
.ny-x{position:absolute;right:12px;top:10px;z-index:6;width:44px;height:44px;border-radius:50%;border:1px solid rgba(233,241,248,.4);background:rgba(11,20,38,.75);color:#fff;font-size:24px;line-height:1;cursor:pointer}
.ny-top{position:absolute;left:16px;top:10px;z-index:4;display:flex;align-items:center;gap:16px;pointer-events:none}
.ny-clock{display:flex;align-items:baseline;gap:10px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.ny-clock b{font:300 38px/1 'Tiempos Headline',Times New Roman,serif;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.02em}
.ny-clock span{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${CYAN}}
.ny-steps{display:flex;gap:4px;list-style:none;margin:0;padding:0}
.ny-steps li{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 8px;border-radius:999px;color:rgba(233,241,248,.45);border:1px solid rgba(233,241,248,.18)}
.ny-steps li.done{color:${CYAN};border-color:rgba(33,183,203,.5)}
.ny-steps li.now{background:${CYAN};border-color:${CYAN};color:#0b1426}
.ny-lost{position:absolute;left:150px;top:16px;z-index:5;font-weight:700;font-size:15px;color:#ff8a80;opacity:0;pointer-events:none}
.ny-lost.ny-on{animation:nyLost 1.4s ease both}
@keyframes nyLost{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
.ny-msg{position:absolute;left:16px;top:64px;z-index:4;width:min(440px,calc(100% - 420px));display:flex;gap:11px;align-items:flex-start;background:rgba(9,17,33,.9);border:1px solid rgba(33,183,203,.35);border-radius:14px;padding:12px 14px;box-shadow:0 14px 34px rgba(0,0,0,.4);backdrop-filter:blur(4px)}
.ny-msg:empty{display:none}
.ny-msg.pop{animation:nyPop .35s ease both}
@keyframes nyPop{from{opacity:0;transform:translateY(-6px)}}
.ny-av{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;color:#fff;border:2px solid rgba(255,255,255,.7)}
.ny-mt{flex:1;min-width:0}
.ny-mt small{display:block;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${CYAN};margin-bottom:2px}
.ny-mt small i{font-style:normal;font-weight:300;letter-spacing:.02em;text-transform:none;color:rgba(233,241,248,.6)}
.ny-mt p{margin:0;font-size:14.5px;line-height:1.45;color:#eef4fa}
.ny-mt p b{color:#fff;font-weight:700}
.ny-task{margin-top:8px!important;padding:6px 10px;border-radius:8px;background:rgba(33,183,203,.16);color:#bff3fa!important;font-weight:700;font-size:13.5px!important}
.ny-task:before{content:"✎ ";color:${CYAN}}
.ny-btn{margin-top:9px;border:0;border-radius:999px;padding:10px 18px;min-height:44px;background:${CYAN};color:#0b1426;font:700 14px Inter,Arial,sans-serif;cursor:pointer}
.ny-btn:focus-visible{outline:3px solid #fff}
.ny-sand{height:5px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:8px;overflow:hidden}
.ny-sand i{display:block;height:100%;background:linear-gradient(90deg,#ff8a80,${CYAN});transform-origin:left;animation:nySand linear both}
@keyframes nySand{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.ny-note{position:absolute;right:14px;top:64px;z-index:3;width:330px;max-height:calc(100% - 80px);overflow:auto;background:#fbfaf6;color:${INK};border-radius:4px;border-top:6px solid ${CYAN};box-shadow:0 22px 50px rgba(0,0,0,.5);scrollbar-width:thin;user-select:text;-webkit-user-select:text}
.ny-note-hd{display:block;width:100%;text-align:left;border:0;background:none;padding:14px 16px 8px;cursor:default;color:inherit;font:inherit}
.ny-note-hd .k{display:block;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${NAVY}}
.ny-note-hd b{display:block;font:300 20px/1.2 'Tiempos Headline',Times New Roman,serif;color:${NAVY};margin-top:3px}
.ny-note-hd em{display:none}
.ny-note.flash .ny-note-hd{animation:nyFlash .9s ease}
@keyframes nyFlash{30%{background:#d6f4f8}}
.ny-note-bd{padding:0 16px 14px}
.ny-meta{font-size:12px;color:#5a6577;border-bottom:1px solid #e3e0d6;padding-bottom:8px;margin-bottom:8px;line-height:1.5}
.ny-meta b{color:${INK};font-weight:700}
.ny-note h4{margin:10px 0 4px;font:700 11px Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${NAVY}}
.ny-note h5{margin:10px 0 4px;font:300 15px/1.3 'Tiempos Headline',Times New Roman,serif;color:${NAVY}}
.ny-note ul{list-style:none;margin:0;padding:0}
.ny-note li{position:relative;font-size:13px;line-height:1.4;padding:4px 0 4px 16px;border-bottom:1px dashed #e3e0d6;animation:nyIn .5s ease both}
.ny-note li:before{content:"";position:absolute;left:2px;top:10px;width:7px;height:7px;border-radius:2px;background:${CYAN}}
.ny-note li.x{color:#8a8f99;text-decoration:line-through}.ny-note li.x:before{background:#b9bdc6}
.ny-note li i{display:block;font-style:normal;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#7b8394}
.ny-empty{font-size:13px;color:#7b8394;font-style:italic;margin:6px 0}
.ny-ov{position:absolute;inset:0;z-index:8;display:grid;place-items:center;padding:14px;background:rgba(6,12,26,.55)}
.ny-ov[hidden]{display:none}
.ny-card{width:100%;max-width:580px;max-height:100%;overflow:auto;box-sizing:border-box;background:#fbfaf6;color:${INK};border-radius:6px;border-top:8px solid ${CYAN};padding:20px 20px 16px;box-shadow:0 26px 70px rgba(0,0,0,.5);user-select:text;-webkit-user-select:text}
.ny-card .k{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${NAVY};margin:0 0 4px}
.ny-card h2{font:300 30px/1.12 'Tiempos Headline',Times New Roman,serif;color:${NAVY};margin:2px 0 8px}
.ny-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.ny-stamp{display:inline-block;border:3px solid currentColor;border-radius:6px;padding:3px 10px;font:700 13px Inter,Arial,sans-serif;letter-spacing:.16em;transform:rotate(-4deg);margin:2px 0 10px}
.ny-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:6px 0 12px}
.ny-stats div{background:#eef6f8;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700;color:#5a6577}
.ny-stats b{display:block;font:300 20px 'Tiempos Headline',Times New Roman,serif;color:${NAVY}}
.ny-list{list-style:none;margin:0 0 10px;padding:0}
.ny-list li{font-size:13px;line-height:1.4;padding:6px 0;border-bottom:1px solid #e3e0d6}
.ny-list li span{display:inline-block;background:${NAVY};color:#fff;border-radius:4px;padding:1px 6px;font-size:10.5px;font-weight:700;margin-right:6px}
.ny-go{display:block;width:100%;border:0;border-radius:8px;padding:13px;margin-top:8px;min-height:48px;background:${NAVY};color:#fff;font:700 15px Inter,Arial,sans-serif;cursor:pointer}
.ny-alt{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;border:1.5px solid #cdd6e0;border-radius:8px;padding:11px;margin-top:8px;min-height:46px;background:#fff;color:${NAVY};font:700 14px Inter,Arial,sans-serif;cursor:pointer}
@media (max-width:759px){
	.ny-top{left:10px;top:8px}
	.ny-clock b{font-size:28px}
	.ny-clock span,.ny-steps{display:none}
	.ny-lost{left:96px;top:12px}
	.ny-x{right:8px;top:6px;width:40px;height:40px}
	.ny-msg{left:8px;right:8px;top:52px;width:auto;padding:9px 11px;gap:9px;border-radius:12px}
	.ny-av{width:30px;height:30px;font-size:11px}
	.ny-mt p{font-size:13.5px;line-height:1.4}
	.ny-task{font-size:13px!important;margin-top:6px!important}
	.ny-btn{margin-top:7px;min-height:42px;padding:9px 16px}
	.ny-note{left:0;right:0;top:auto;bottom:0;width:auto;max-height:52%;border-radius:12px 12px 0 0;border-top-width:5px}
	.ny-note-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;min-height:48px;box-sizing:border-box}
	.ny-note-hd .k{display:none}
	.ny-note-hd b{flex:1;font-size:16px;margin:0}
	.ny-note-hd em{display:block;font-style:normal;font-size:12px;font-weight:700;color:#fff;background:${NAVY};border-radius:999px;padding:4px 10px;white-space:nowrap}
	.ny-note:not(.open) .ny-note-bd{display:none}
	.ny-card{padding:16px 14px 12px}
	.ny-card h2{font-size:25px}
}
@media (prefers-reduced-motion:reduce){.ny,.ny-msg.pop,.ny-note li{animation:none}}
`;

export function openJourJ({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("ny-css")){ const st = document.createElement("style"); st.id = "ny-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "ny";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La note de 8 h");
	root.innerHTML = `<canvas class="ny-3d" aria-hidden="true"></canvas>
		<div class="ny-top"><div class="ny-clock"><b>21:47</b><span>Nuit blanche</span></div>
		<ol class="ny-steps">${STEPS_UI.map(([k, t]) => `<li data-s="${k}">${t}</li>`).join("")}</ol></div>
		<div class="ny-lost">−10 min</div>
		<button class="ny-x" aria-label="Quitter le jeu">×</button>
		<div class="ny-msg" aria-live="polite"></div>
		<aside class="ny-note" aria-label="Ta note de synthèse"><button class="ny-note-hd" type="button"></button><div class="ny-note-bd"></div></aside>
		<div class="ny-ov" hidden><div class="ny-card"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const cv = $("canvas"), msg = $(".ny-msg"), note = $(".ny-note"), noteHd = $(".ny-note-hd"), noteBd = $(".ny-note-bd"), clockEl = $(".ny-clock b"), lostEl = $(".ny-lost");
	const MOB = () => innerWidth < 760;

	const fresh = () => ({ pts:{}, errors:0, lost:0, learned:[], proofs:[], plan:null, answers:[], step:null, time:21*60 + 47, adopted:false });
	const S = fresh();
	let closed = false, GEN = 0, input = null, btnAuto = null;
	const timers = new Set();
	// toute attente du jeu passe par P : quand on saute d'étape (ou qu'on ferme), les anciennes attentes ne se résolvent plus
	const P = ex => { const g = GEN; return new Promise(res => ex(v => { if(!closed && g === GEN) res(v); })); };
	const wait = ms => P(r => { const t = setTimeout(() => { timers.delete(t); r(); }, ms); timers.add(t); });

	/* ================= la scène ================= */
	const W = stage3d(cv, { panel:note, side:"right", panelW:360, bg:"#0b1426", minD:1, maxD:500, maxPolar:1.5, minPolar:0, rotate:false, fov:38 });
	const { scene, camera, M, G, mesh, box, cyl, canvasTex, label } = W;
	const hemi = new THREE.HemisphereLight("#9fb6e0", "#1b2236", .75); scene.add(hemi);
	const moon = new THREE.DirectionalLight("#bcd0ff", .7); moon.position.set(-14, 26, -10); moon.castShadow = true;
	moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left:-20, right:20, top:20, bottom:-20, near:1, far:80 }); scene.add(moon);
	const lampLight = new THREE.PointLight("#ffd08a", 90, 40, 1.2); lampLight.position.set(11, 7, -4); scene.add(lampLight);

	/* --- le bureau du cabinet, la nuit : moquette, mur, grande fenêtre sur Lille, horloge, bureau, lampe --- */
	const FY = -11;
	mesh(G(new THREE.PlaneGeometry(120, 80)), M("#2a2f3c", { roughness:1 }), 0, FY, 0).rotation.x = -Math.PI/2;
	box(70, 32, .6, "#3a4255", 0, FY, -17);
	const night = canvasTex(1024, 640, (x, w, h) => {
		const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#07101f"); g.addColorStop(.7, "#14244a"); g.addColorStop(1, "#2b3b6a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
		for(let i = 0; i < 90; i++){ x.fillStyle = `rgba(255,255,255,${.2 + Math.random()*.5})`; x.fillRect(Math.random()*w, Math.random()*h*.45, 2, 2); }
		// les toits de Lille, et le beffroi éclairé
		x.fillStyle = "#0a1224"; for(let X = 0; X < w; X += 46 + Math.random()*40){ const bh = 90 + Math.random()*120; x.fillRect(X, h - bh, 50 + Math.random()*30, bh); }
		x.fillStyle = "#0d1630"; x.fillRect(640, h - 380, 54, 380); x.beginPath(); x.moveTo(632, h - 380); x.lineTo(667, h - 470); x.lineTo(702, h - 380); x.fill();
		x.fillStyle = "#ffd98a"; x.fillRect(655, h - 340, 24, 30);
		for(let i = 0; i < 160; i++){ x.fillStyle = Math.random() < .7 ? "#ffd98a" : "#9fd3ff"; x.globalAlpha = .5 + Math.random()*.5; x.fillRect(Math.random()*w, h - Math.random()*180, 5, 7); }
		x.globalAlpha = 1;
	});
	box(23, 16, .5, "#20283a", -8, -3, -16.6);
	mesh(G(new THREE.PlaneGeometry(22, 15)), new THREE.MeshBasicMaterial({ map:night }), -8, 4.5, -16.3);
	box(.4, 15, .3, "#20283a", -8, -3, -16.2); box(22, .4, .3, "#20283a", -8, 4.3, -16.2);
	// l'horloge murale : elle suit la nuit du joueur
	const clock = new THREE.Group(); clock.position.set(13, 8, -16.5); scene.add(clock);
	mesh(G(new THREE.CylinderGeometry(3, 3, .4, 40)), "#e8e4da", 0, 0, 0, clock).rotation.x = Math.PI/2;
	const dial = canvasTex(256, 256, (x, w) => { x.fillStyle = "#fbfaf6"; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.fillStyle = NAVY; for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; x.fillRect(128 + Math.cos(a)*104 - 4, 128 + Math.sin(a)*104 - 4, 8, 8); } });
	mesh(G(new THREE.CircleGeometry(2.8, 40)), new THREE.MeshBasicMaterial({ map:dial }), 0, 0, .22, clock);
	const hourH = new THREE.Group(), minH = new THREE.Group(); hourH.position.z = .3; minH.position.z = .34; clock.add(hourH, minH);
	mesh(G(new THREE.BoxGeometry(.22, 1.5, .05)), NAVY, 0, .7, 0, hourH); mesh(G(new THREE.BoxGeometry(.14, 2.3, .05)), NAVY, 0, 1.1, 0, minH);
	let shownMin = S.time;
	// le bureau : un grand plateau clair, des pieds sombres
	box(32, .6, 17, M("#4a3527", { roughness:.55 }), 0, -.6, 0);
	for(const sx of [-1, 1]) for(const sz of [-1, 1]) box(.7, 10.4, .7, "#2b2f36", sx*15, FY, sz*7.6);
	// la lampe de bureau
	{ const g = new THREE.Group(); g.position.set(12.5, 0, -5); scene.add(g);
		cyl(1, 1.1, .3, "#1f2430", 0, 0, 0, g); const arm = cyl(.1, .1, 6, "#1f2430", -.8, .3, 0, g); arm.rotation.z = .3;
		const sh = mesh(G(new THREE.ConeGeometry(1.3, 1.6, 24, 1, true)), M("#1f2430", { side:THREE.DoubleSide }), -1.9, 6, 0, g); sh.rotation.z = .5;
		mesh(G(new THREE.SphereGeometry(.35, 12, 8)), new THREE.MeshBasicMaterial({ color:"#fff3cf" }), -1.6, 5.3, 0, g); }
	// l'ordinateur portable : le courriel de Claire
	{ const g = new THREE.Group(); g.position.set(-11, 0, -4.6); g.rotation.y = .35; scene.add(g);
		box(6, .25, 4, M("#9aa1aa", { metalness:.5, roughness:.35 }), 0, 0, 0, g);
		const scr = new THREE.Group(); scr.position.set(0, .25, -2); scr.rotation.x = -.3; g.add(scr);
		mesh(G(new THREE.BoxGeometry(6, 3.9, .14)), "#2b2f36", 0, 1.95, 0, scr);
		const mail = canvasTex(560, 360, (x, w, h) => { x.fillStyle = "#f4f6f9"; x.fillRect(0, 0, w, h); x.fillStyle = NAVY; x.fillRect(0, 0, w, 44); x.fillStyle = "#fff"; x.font = `700 20px ${SANS}`; x.fillText("Messagerie · 21:47", 16, 29);
			x.fillStyle = INK; x.font = `700 22px ${SANS}`; x.fillText("Claire Vandamme · Pavé", 16, 84); x.font = `300 20px ${SANS}`; x.fillStyle = "#4a5568"; x.fillText("Objet : on perd nos clients", 16, 114);
			x.fillStyle = INK; x.font = `300 22px ${SANS}`; ["Hélène, nos ventes s'effondrent et personne", "ici n'est d'accord sur la raison.", "Il me faut une recommandation", "demain, 8 h, au comité. Claire"].forEach((l, i) => x.fillText(l, 16, 168 + i*36)); });
		mesh(G(new THREE.PlaneGeometry(5.6, 3.5)), new THREE.MeshBasicMaterial({ map:mail }), 0, 1.95, .08, scr); }
	// le mug, le stylo rouge
	{ const g = new THREE.Group(); g.position.set(12, 0, 4.5); scene.add(g); cyl(.8, .7, 1.8, NAVY, 0, 0, 0, g); cyl(.72, .72, .05, "#3b2416", 0, 1.7, 0, g); }
	const pen = cyl(.12, .12, 4, RED, 13.5, 0, 1.5); pen.position.y = .2; pen.rotation.set(0, .4, Math.PI/2);

	/* --- la salle du comité, le lendemain matin (plus loin dans la même scène) --- */
	const CX = 90, CF = -10.7;
	mesh(G(new THREE.PlaneGeometry(60, 50)), M("#c9c2b4", { roughness:.9 }), CX, CF, 0).rotation.x = -Math.PI/2;
	box(60, 30, .6, "#eceae4", CX, CF, -20);
	const dawn = canvasTex(1024, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9cc8ec"); g.addColorStop(.75, "#f4dfc4"); g.addColorStop(1, "#e7c9a5"); x.fillStyle = g; x.fillRect(0, 0, w, h);
		x.fillStyle = "#8d96a8"; for(let X = 0; X < w; X += 50 + Math.random()*40){ const bh = 50 + Math.random()*110; x.fillRect(X, h - bh, 46 + Math.random()*26, bh); } x.fillStyle = "#7d8698"; x.fillRect(470, h - 270, 46, 270); x.beginPath(); x.moveTo(462, h - 270); x.lineTo(493, h - 340); x.lineTo(524, h - 270); x.fill(); });
	mesh(G(new THREE.PlaneGeometry(40, 18)), new THREE.MeshBasicMaterial({ map:dawn }), CX, 6, -19.6);
	box(34, .7, 16, M("#5a3e2b", { roughness:.5 }), CX, -.7, -2);
	for(const sx of [-1, 1]) box(1.2, 10, 10, "#3e2a1d", CX + sx*14, CF, -2);
	const screenTex = canvasTex(800, 260, (x, w, h) => { x.fillStyle = NAVY; x.fillRect(0, 0, w, h); x.fillStyle = CYAN; x.fillRect(0, h - 10, w, 10); x.fillStyle = "#fff"; x.font = `300 64px ${SERIF}`; x.fillText("Pavé · comité de direction", 40, 120); x.font = `700 34px ${SANS}`; x.fillStyle = "#bff3fa"; x.fillText("Jeudi 19 novembre · 8 h · recommandation", 40, 190); });
	mesh(G(new THREE.PlaneGeometry(16, 5.2)), new THREE.MeshBasicMaterial({ map:screenTex }), CX + 21, 10, -19.5);
	const morning = new THREE.PointLight("#fff2dc", 220, 70, 1.1); morning.position.set(CX, 16, 6); scene.add(morning);
	const members = {};
	[["marc", -9, "pro"], ["claire", 0, "senior"], ["sarah", 9, "pro"]].forEach(([k, x, kind]) => {
		const p = makePerson(scene, true, kind); p.g.scale.setScalar(10.5); p.g.position.set(CX + x, CF, -14.5); members[k] = p;
		const l = label(`${PEOPLE[k][0]}`, { size:.026, bg:"#fbfaf6", fg:NAVY }); l.position.set(CX + x, 11.5, -14.5); scene.add(l);
		cyl(2.2, 2.4, 9.2, "#2b2f36", CX + x, CF, -16.6);      // le dossier du fauteuil
	});

	/* ================= les pièces : du papier, une face dessinée au canvas, des zones qu'on touche ================= */
	const docs = {}, live = new Set();
	function makeDoc(id, w, h, draw, o = {}){
		const c = document.createElement("canvas"); c.width = Math.round(w*PXU); c.height = Math.round(h*PXU);
		const x = c.getContext("2d"), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = W.renderer.capabilities.getMaxAnisotropy();
		const g = new THREE.Group(); scene.add(g);
		mesh(G(new THREE.BoxGeometry(w, .06, h)), M(o.paper || "#efece4"), 0, .03, 0, g);
		const face = new THREE.Mesh(G(new THREE.PlaneGeometry(w, h)), new THREE.MeshBasicMaterial({ map:t, toneMapped:false })); face.rotation.x = -Math.PI/2; face.position.y = .065; g.add(face);
		G(face.material);
		const D = { id, g, face, c, x, t, w, h, W:c.width, H:c.height, zones:{}, zl:{}, marks:[], live:null, dirty:true, draw };
		face.userData.doc = D; docs[id] = D; g.visible = false;
		return D;
	}
	function redraw(D){
		const x = D.x; D.zones = {}; D.zl = {};
		x.save(); x.globalCompositeOperation = "source-over"; x.fillStyle = "#fbfaf6"; x.fillRect(0, 0, D.W, D.H); D.draw(x, D); x.restore();
		x.save(); x.globalCompositeOperation = "multiply";
		const hl = (rects, col) => { x.fillStyle = col; for(const r of rects) x.fillRect(r[0] - 6, r[1] - 4, r[2] - r[0] + 12, r[3] - r[1] + 8); };
		for(const m of D.marks) if(m.type === "hl" && D.zl[m.z]) hl(D.zl[m.z], "#fff176");
		if(D.live && D.live.length > 1){ x.strokeStyle = "#fff176"; x.lineWidth = 44; x.lineCap = x.lineJoin = "round"; x.beginPath(); D.live.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)); x.stroke(); }
		x.restore();
		x.save();
		for(const m of D.marks){
			const r = D.zones[m.z];
			if(m.type === "circle" && r){ x.strokeStyle = m.c || RED; x.lineWidth = 6; for(const q of D.zl[m.z]) for(let k = 0; k < 2; k++){ x.beginPath(); x.ellipse((q[0] + q[2])/2 + k*3, (q[1] + q[3])/2 - k*2, (q[2] - q[0])/2 + 22 + k*4, (q[3] - q[1])/2 + 16 - k*3, -.03 + k*.05, 0, Math.PI*2); x.stroke(); } }
			if(m.type === "bad" && r){ x.strokeStyle = RED; x.lineWidth = 5; x.setLineDash([12, 9]); x.strokeRect(r[0] - 8, r[1] - 6, r[2] - r[0] + 16, r[3] - r[1] + 12); x.setLineDash([]); }
			if(m.type === "hint" && r){ x.strokeStyle = CYAN; x.lineWidth = 7; x.setLineDash([16, 10]); x.strokeRect(r[0] - 10, r[1] - 8, r[2] - r[0] + 20, r[3] - r[1] + 16); x.setLineDash([]); }
			if(m.type === "strike" && r){ const y = (r[1] + r[3])/2 + 2; x.strokeStyle = RED; x.lineWidth = 5; x.beginPath(); x.moveTo(r[0] - 4, y + 3); x.lineTo(r[2] + 4, y - 3); x.stroke(); x.fillStyle = RED; x.font = `italic 700 34px ${SANS}`; x.textAlign = "left"; x.fillText(m.fix, r[0], r[1] - 4); }
			if(m.type === "stamp"){ x.translate(D.W*.62, D.H*.42); x.rotate(-.22); x.globalAlpha = .85; x.strokeStyle = x.fillStyle = m.c || RED; x.lineWidth = 9; x.font = `700 78px ${SANS}`; x.textAlign = "center"; x.textBaseline = "middle"; const bw = x.measureText(m.text).width + 60; x.strokeRect(-bw/2, -60, bw, 120); x.fillText(m.text, 0, 4); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; }
		}
		x.restore();
		D.t.needsUpdate = true; D.dirty = false;
	}
	const mark = (D, m, ms) => { D.marks.push(m); D.dirty = true; if(ms) setTimeout(() => { const i = D.marks.indexOf(m); if(i >= 0){ D.marks.splice(i, 1); D.dirty = true; } }, ms); return m; };
	const zone = (D, z, r) => { const u = D.zones[z]; D.zones[z] = u ? [Math.min(u[0], r[0]), Math.min(u[1], r[1]), Math.max(u[2], r[2]), Math.max(u[3], r[3])] : r.slice(); const L = (D.zl[z] = D.zl[z] || []), q = L[L.length - 1]; if(q && Math.abs(q[1] - r[1]) < 2 && r[0] - q[2] < 40) q[2] = r[2]; else L.push(r.slice()); };      // les mots d'une même ligne forment un seul rectangle
	function txt(x, s, X, Y, size, o = {}){ x.font = `${o.i ? "italic " : ""}${o.w || 300} ${size}px ${o.serif ? SERIF : SANS}`; x.fillStyle = o.c || INK; x.textAlign = o.a || "left"; x.textBaseline = "alphabetic"; x.fillText(s, X, Y); return x.measureText(s).width; }
	// un texte qui passe à la ligne ; chaque morceau peut porter une zone (z), ou chaque mot (words) pour la relecture
	// espaces insécables à la française : « 3 % » ou « 119 € » ne se coupent jamais en fin de ligne
	const NB = " ";
	const nb = s => s.replace(/ ([%€»:;?!¹])/g, NB + "$1").replace(/« /g, "«" + NB).replace(/(\d) (\d{3})/g, "$1" + NB + "$2");
	function flow(x, D, tokens, X, Y, maxW, size, lh, o = {}){
		let cx = X, cy = Y, n = 0;
		for(const tk of tokens){
			const t = typeof tk === "string" ? { t:tk } : tk;
			x.font = `${t.i || o.i ? "italic " : ""}${t.b ? 700 : 300} ${size}px ${SANS}`; const sp = x.measureText(" ").width;
			for(const word of nb(t.t).split(" ")){
				if(!word) continue;
				const ww = x.measureText(word).width;
				if(cx + ww > X + maxW && cx > X){ cx = X; cy += lh; }
				x.fillStyle = t.c || o.c || INK; x.textAlign = "left"; x.fillText(word, cx, cy);
				const r = [cx, cy - size*.82, cx + ww, cy + size*.24];
				if(t.z) zone(D, t.z, r); else if(o.words) zone(D, "w" + (n++), r);
				cx += ww + sp;
			}
		}
		return cy;
	}
	function header(x, D, k, title, sub){
		x.fillStyle = NAVY; x.fillRect(0, 0, D.W, 12);
		txt(x, k, 40, 62, 26, { w:700, c:"#7b8394" });
		txt(x, title, 40, 112, 44, { serif:true, c:NAVY });
		if(sub) txt(x, sub, 40, 152, 26, { c:"#5a6577" });
		x.fillStyle = "#d9d5c8"; x.fillRect(40, sub ? 172 : 136, D.W - 80, 2);
	}

	/* --- pièce A : les avis clients --- */
	const AVIS = [
		["a1", "« Toujours aussi belles, je les porte tous les jours. »", "Léa, 17 ans · ★★★★★"],
		["a2", "« Commandées le 2, reçues le 11. Entre-temps, j'avais acheté ailleurs. »", "Yanis · ★★☆☆☆"],
		["a3", "« Le paiement plante sur mon téléphone, trois fois de suite. J'ai abandonné. »", "Chloé · ★☆☆☆☆"],
		["a4", "« J'adore le nouveau logo brodé sur le talon ! »", "Tom · ★★★★★"],
		["a5", "« 119 € pour des baskets en toile ? Elles étaient à 95 € l'an dernier. »", "Inès · ★★☆☆☆"],
		["a6", "« La boutique de la rue de Béthune est toujours aussi accueillante. »", "Paul · ★★★★☆"]
	];
	makeDoc("A", 4.6, 3.9, (x, D) => {
		header(x, D, "PIÈCE A · AVIS CLIENTS", "Ce que disent nos clients", "Site, boutique et réseaux · septembre-octobre 2026");
		let y = 226;
		for(const [z, q, who] of AVIS){ y = flow(x, D, [{ t:q, z }], 52, y, D.W - 104, 34, 42, { i:true }); txt(x, who, 52, y + 34, 24, { w:700, c:"#7b8394" }); y += 92; }
	});
	/* --- pièce B : le tableau des ventes --- */
	const ROWS = [
		["Boutique de Lille", "9 800", "9 600", "−2 %", "bout"],
		["Revendeurs", "14 000", "12 600", "−10 %", "rev"],
		["Site internet", "16 000", "10 400", "−35 %", "site"],
		["Total (paires vendues)", "39 800", "32 600", "−18 %", "total"],
		null,
		["Visites du site", "800 000", "760 000", "−5 %", "visites"],
		["Taux de conversion du site", "2,0 %", "1,4 %", "−0,6 pt", "conv"],
		["Prix moyen d'une paire", "95 €", "119 €", "+25 %", "prix"]
	];
	makeDoc("B", 4.8, 3.6, (x, D) => {
		header(x, D, "PIÈCE B · CONTRÔLE DE GESTION", "Ventes de Pavé", "Janvier-octobre, 2025 et 2026");
		const cols = [52, D.W*.56, D.W*.72, D.W - 52];
		let y = 222;
		["", "2025", "2026", "Écart"].forEach((h, i) => txt(x, h, cols[i], y, 26, { w:700, c:"#7b8394", a:i ? "right" : "left" }));
		y += 18;
		for(const r of ROWS){
			if(!r){ y += 16; x.fillStyle = "#d9d5c8"; x.fillRect(52, y - 4, D.W - 104, 2); continue; }
			y += 60; const bold = r[4] === "total";
			if(r[4] === "total"){ x.fillStyle = "#eef3f8"; x.fillRect(40, y - 42, D.W - 80, 58); }
			txt(x, r[0], cols[0], y, 32, { w:bold ? 700 : 300 }); txt(x, r[1], cols[1], y, 32, { a:"right" }); txt(x, r[2], cols[2], y, 32, { a:"right", w:bold ? 700 : 300 });
			const neg = r[3].startsWith("−");
			const ew = txt(x, r[3], cols[3], y, 32, { a:"right", w:700, c:neg ? "#a33a2a" : INK });
			zone(D, r[4] + "_ec", [cols[3] - ew, y - 28, cols[3], y + 8]);
			zone(D, r[4], [cols[0], y - 30, cols[3], y + 10]);
		}
		txt(x, "Source : logiciel de caisse et boutique en ligne de Pavé.", 52, D.H - 30, 22, { i:true, c:"#7b8394" });
	});
	/* --- pièce C : le courriel de Marc --- */
	makeDoc("C", 4.6, 2.75, (x, D) => {
		x.fillStyle = "#eef3f8"; x.fillRect(0, 0, D.W, 150);
		txt(x, "PIÈCE C · COURRIEL INTERNE · 18:05", 40, 50, 24, { w:700, c:"#7b8394" });
		txt(x, "De : Marc Leclercq, directeur commercial", 40, 92, 28, { w:700 });
		txt(x, "À : Claire Vandamme · Objet : ventes du site", 40, 130, 28);
		let y = flow(x, D, ["Claire, pas de panique. Sur le site, on n'est qu'à", { t:"−5 %¹.", z:"m5", b:true }, { t:"C'est la conjoncture : tout le marché souffre.", z:"conj" },
			"Je propose une grosse campagne sur les réseaux pour le coloris « Brique » : nos abonnés l'adorent (voir le sondage). Marc"], 40, 214, D.W - 80, 34, 46);
		x.fillStyle = "#d9d5c8"; x.fillRect(40, y + 30, 200, 2);
		flow(x, D, [{ t:"¹ Source : statistiques de fréquentation du site (nombre de visites), janvier-octobre.", z:"src" }], 40, y + 72, D.W - 80, 25, 32, { c:"#5a6577" });
	});
	/* --- pièce D : l'article de presse --- */
	makeDoc("D", 4.6, 2.7, (x, D) => {
		txt(x, "LE BEFFROI ÉCO", 40, 70, 46, { serif:true, c:INK }); txt(x, "PIÈCE D · 14 OCTOBRE 2026", D.W - 40, 66, 22, { w:700, c:"#7b8394", a:"right" });
		x.fillStyle = INK; x.fillRect(40, 90, D.W - 80, 4);
		txt(x, "Baskets : le marché marque le pas", 40, 156, 46, { serif:true, c:NAVY });
		flow(x, D, ["Après dix ans de croissance, les ventes de baskets reculent de", { t:"3 %", z:"m3", b:true }, "en France sur un an. « Les marques qui résistent livrent vite et soignent la vente sur mobile », note un analyste.",
			{ t:"Le budget des 15-24 ans reste stable.", z:"d3" }], 40, 222, D.W - 80, 34, 46);
	});
	/* --- pièce E : le rapport en anglais --- */
	const REPORT = [
		["e1", "Online now accounts for 41 % of sneaker sales in France."],
		["e2", "72 % of online sneaker orders are placed on a smartphone."],
		["e3", "Leading brands ship within 48 hours; beyond 5 days, one shopper in two cancels."],
		["e4", "Canvas sneakers remain popular with 15-24 year-olds."]
	];
	makeDoc("E", 4.6, 2.55, (x, D) => {
		header(x, D, "PIÈCE E · NORTHGATE INSIGHTS (UK)", "Sneaker Retail Report 2026", "Northern Europe · key findings");
		let y = 232;
		for(const [z, s] of REPORT){ x.fillStyle = CYAN; x.fillRect(46, y - 22, 12, 12); y = flow(x, D, [{ t:s, z }], 76, y, D.W - 120, 34, 44); y += 66; }
	});
	/* --- pièce F : le sondage --- */
	makeDoc("F", 3.4, 3.7, (x, D) => {
		const g = x.createLinearGradient(0, 0, D.W, D.H); g.addColorStop(0, "#f1e4f0"); g.addColorStop(1, "#e3eef8"); x.fillStyle = g; x.fillRect(0, 0, D.W, D.H);
		txt(x, "PIÈCE F · CAPTURE D'ÉCRAN", 36, 54, 22, { w:700, c:"#7b8394" });
		txt(x, "@pave.lille · story", 36, 100, 30, { w:700 });
		const w87 = txt(x, "87 %", D.W/2, 300, 150, { w:700, c:"#a3245b", a:"center" }); zone(D, "p87", [D.W/2 - w87/2, 190, D.W/2 + w87/2, 320]);
		flow(x, D, [{ t:"de nos abonnés adorent le nouveau coloris « Brique » ❤", z:"p87" }], 36, 380, D.W - 72, 34, 44);
		flow(x, D, [{ t:"212 réponses · sondage posté en story, visible par nos seuls abonnés · 3 octobre", z:"n212" }], 36, 560, D.W - 72, 27, 36, { c:"#4a5568" });
		txt(x, "Joint au courriel de Marc", 36, D.H - 34, 22, { i:true, c:"#7b8394" });
	}, { paper:"#e6e2f0" });
	/* --- la note imprimée, pour la relecture --- */
	const CHAPEAU = ["Pavé ne perd pas son marché : il perd ses acheteurs en ligne. Les visiteurs viennent toujours sur le site, mais la plupart repartent sans acheter. Trois causes ressortent des pièces que nous avons",
		{ t:"analysé", z:"f1" }, ": un paiement qui échoue sur téléphone, une livraison en neuf jours et une hausse de prix de 25 %.", { t:"Quelque", z:"f2" },
		"soit le budget, la priorité est de réparer le parcours d'achat, quitte", { t:"a", z:"f3" }, "reporter la campagne publicitaire."];
	const FAUTES = { f1:["analysées", "Avec « avoir », le participe s'accorde avec le complément placé avant : « les pièces ».", "les pièces que nous avons analysées"], f2:["Quel que", "Devant le verbe être : « quel que », en deux mots, accordé au nom (quel que soit le budget).", "quel que soit"], f3:["à", "« quitte à » : c'est la préposition, avec un accent.", "quitte à reporter"] };
	makeDoc("N", 4.7, 4.1, (x, D) => {
		txt(x, "NOTE DE SYNTHÈSE · CONFIDENTIEL", 44, 60, 24, { w:700, c:CYAN });
		txt(x, "À l'attention de Claire Vandamme · 19 novembre, 8 h", 44, 98, 26, { c:"#5a6577" });
		txt(x, "Pourquoi Pavé perd ses clients", 44, 160, 50, { serif:true, c:NAVY });
		let y = flow(x, D, CHAPEAU, 44, 236, D.W - 88, 34, 50, { words:true });
		y += 76; txt(x, "I. Un parcours d'achat cassé, pas une crise du marché", 44, y, 32, { w:700, c:NAVY });
		y += 52; txt(x, "II. Réparer avant de dépenser : trois mesures d'ici janvier", 44, y, 32, { w:700, c:NAVY });
	});
	/* --- les fiches (plan et comité) --- */
	function makeCard(id, t, s, src, col = CYAN){
		return makeDoc(id, 3.6, 2.1, (x, D) => {
			x.fillStyle = col; x.fillRect(0, 0, D.W, 16);
			let y = flow(x, D, [{ t, b:true }], 34, 92, D.W - 68, 48, 56);
			flow(x, D, [s], 34, y + 58, D.W - 68, 38, 46, { c:"#4a5568" });
			if(src) txt(x, src, 34, D.H - 26, 22, { w:700, c:"#7b8394" });
			zone(D, "all", [0, 0, D.W, D.H]);
		});
	}
	PLAN.forEach(p => makeCard(p.id, p.t, p.s, null, "#d9c27a"));
	FICHES.forEach(([k, t, s, src]) => makeCard("f_" + k, t, s, src));
	// les bacs du plan
	function tray(id, t, col){
		const g = new THREE.Group(); g.visible = false; scene.add(g);
		box(4.4, .12, 2.9, M("#e9e4d8"), 0, 0, 0, g);
		for(const [w, d, x, z] of [[4.4, .2, 0, -1.45], [4.4, .2, 0, 1.45], [.2, 2.9, -2.2, 0], [.2, 2.9, 2.2, 0]]) box(w, .5, d, col, x, 0, z, g);
		const tx = canvasTex(512, 160, (x, w, h) => { x.fillStyle = "#e9e4d8"; x.fillRect(0, 0, w, h); x.fillStyle = col; let fs = 58; do { x.font = `700 ${fs}px ${SANS}`; fs -= 2; } while(x.measureText(t).width > w - 30); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(t, w/2, h/2); });
		const lb = mesh(G(new THREE.PlaneGeometry(3.8, 1.2)), new THREE.MeshBasicMaterial({ map:tx }), 0, .14, 0, g); lb.rotation.x = -Math.PI/2;
		return { id, g, n:0 };
	}
	const TRAYS = { I:tray("I", "I · Constat", NAVY), II:tray("II", "II · Recommandations", GREEN), X:tray("X", "Écartées", RED) };

	/* ================= animations, fil rouge ================= */
	const tweens = new Set();
	const tween = (dur, fn) => P(r => tweens.add({ t:0, dur, fn, r }));
	function moveTo(obj, to, o = {}){
		const from = obj.position.clone(), r0 = obj.rotation.y, r1 = o.ry ?? 0, lift = o.lift ?? 1.4;
		obj.visible = true;
		return tween(o.dur || .55, k => { obj.position.lerpVectors(from, to, k); obj.position.y += lift*4*k*(1 - k); obj.rotation.y = r0 + (r1 - r0)*k; });
	}
	const extra = new THREE.Group(); scene.add(extra);       // fils rouges et objets de l'étape : effacés à la suivante
	const clearExtra = () => { for(const o of [...extra.children]){ extra.remove(o); o.geometry && o.geometry.dispose(); } };
	const threadMat = M(RED, { roughness:.5 });
	function zoneWorld(D, z){ const r = D.zones[z]; const px = (r[0] + r[2])/2, py = (r[1] + r[3])/2; return D.g.localToWorld(new THREE.Vector3((px/D.W - .5)*D.w, .12, (py/D.H - .5)*D.h)); }
	function thread(a, b){
		const mid = a.clone().add(b).multiplyScalar(.5); mid.y += .9;
		const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 30, .022, 6), threadMat);
		extra.add(tube);
		for(const p of [a, b]){ const pin = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), threadMat); pin.position.copy(p); extra.add(pin); }
	}
	// le surligneur, qui suit le doigt
	const marker = new THREE.Group(); marker.visible = false; scene.add(marker);
	{ const b = cyl(.32, .32, 3, "#f2d43a", 0, 0, 0, marker); b.position.y = 1.7; const tip = cyl(.2, .3, .5, "#fff176", 0, 0, 0, marker); tip.position.y = .1; marker.rotation.set(.5, 0, -.5); }

	W.onFrame(tick);
	function tick(now, dt){
		if(!isFinite(camera.position.x + W.controls.target.x)){ camera.position.set(0, 30, 12); W.controls.target.set(0, 0, 0); W.resize(); refit(); }      // fenêtre de taille nulle au lancement : on repart d'une caméra saine
		for(const tw of [...tweens]){ tw.t += dt; const k = Math.min(1, tw.t/tw.dur); tw.fn(W.ease(k)); if(k >= 1){ tweens.delete(tw); tw.r(); } }
		for(const D of Object.values(docs)) if(D.dirty && D.g.visible) redraw(D);
		const target = S.time; shownMin += (target - shownMin)*Math.min(1, dt*2.5);
		hourH.rotation.z = -(shownMin/720)*Math.PI*2; minH.rotation.z = -((shownMin % 60)/60)*Math.PI*2;
		for(const k in members){ const p = members[k]; p.g.position.y = CF + (p.bob > 0 ? Math.sin(p.bob*Math.PI)*.5 : 0); if(p.bob > 0) p.bob = Math.max(0, p.bob - dt*1.6); }
	}

	/* ================= cadrer la caméra sur une zone du bureau ================= */
	let lastFit = null, fitTop = 0;
	// la place libre à l'écran pour les pièces : sous le message, à côté de la note (ou au-dessus, sur téléphone)
	function area(){
		const vw = innerWidth, vh = innerHeight, mob = MOB(), d = mob ? Math.min(vh*.55, note.offsetHeight + 8) : 0;
		const mb = msg.innerHTML ? msg.getBoundingClientRect().bottom : 0;
		const top = Math.max(mob ? 150 : 110, mb + 10);
		return { top, aw:mob ? vw - 12 : vw - 360 - 40, ah:(mob ? vh - d : vh) - top - (mob ? 8 : 24) };
	}
	function fit(cx, cz, w, h, polar = .1, dur = 1){
		lastFit = [cx, cz, w, h, polar];
		const vw = innerWidth, vh = innerHeight, mob = MOB(), th = Math.tan(camera.fov*Math.PI/360);
		const d = mob ? Math.min(vh*.55, note.offsetHeight + 8) : 0, fullH = vh + d;
		const { top, aw, ah } = area(); fitTop = top;
		const Dd = fullH/(2*th)*Math.max(w/aw, h/ah);
		const visC = (mob ? vh - d : vh)/2, want = top + ah/2, wpp = 2*Dd*th/fullH;
		const k = camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1;
		W.fly(new THREE.Vector3(cx, 0, cz - (want - visC)*wpp*Math.cos(polar)), Dd/k, polar, 0, dur);
	}
	let lastView = null;
	const view = (t, dist, polar, az, dur = 1.2) => { lastFit = null; lastView = [t, dist, polar, az]; W.fly(t, dist, polar, az, dur); };
	function refit(){ if(lastFit) fit(...lastFit, .35); else if(lastView) W.fly(...lastView, .35); }
	addEventListener("resize", refit);
	noteHd.addEventListener("click", () => { if(!MOB()) return; note.classList.toggle("open"); play("pop"); setTimeout(refit, 60); });

	/* ================= poser des pièces sur le bureau ================= */
	const PILE = new THREE.Vector3(-12.5, 0, 3.6);
	let onDesk = [];
	async function lay(ids, o = {}){
		const gap = .45, list = ids.map(i => docs[i]), { aw, ah } = area();
		// côte à côte ou l'une sous l'autre : la disposition qui affiche les pièces le plus grand
		const rowW = list.reduce((s, D) => s + D.w, 0) + gap*(list.length - 1), rowH = Math.max(...list.map(D => D.h));
		const colW = Math.max(...list.map(D => D.w)), colH = list.reduce((s, D) => s + D.h, 0) + gap*(list.length - 1);
		const tall = Math.min(aw/colW, ah/colH) > Math.min(aw/rowW, ah/rowH);
		for(const D of onDesk) if(!ids.includes(D.id)){ const k = Math.random(); moveTo(D.g, new THREE.Vector3(PILE.x + k*.6, .08 + Math.random()*.1, PILE.z + k*.4), { ry:.3 + k*.3, dur:.5 }); }
		let tw = 0, th = 0;
		if(tall){ tw = Math.max(...list.map(D => D.w)); th = list.reduce((s, D) => s + D.h, 0) + gap*(list.length - 1); }
		else { tw = list.reduce((s, D) => s + D.w, 0) + gap*(list.length - 1); th = Math.max(...list.map(D => D.h)); }
		const cz = o.cz ?? .4;
		let cur = tall ? cz - th/2 : -tw/2;
		const moves = list.map((D, i) => {
			let p;
			if(tall){ p = new THREE.Vector3(0, .1 + i*.01, cur + D.h/2); cur += D.h + gap; }
			else { p = new THREE.Vector3(cur + D.w/2, .1 + i*.01, cz); cur += D.w + gap; }
			if(!D.g.visible){ D.g.position.copy(PILE).setY(.1); D.g.rotation.y = .4; }
			D.dirty = true; D.g.visible = true;
			return moveTo(D.g, p, { ry:0, dur:.6 });
		});
		onDesk = [...new Set([...onDesk, ...list])];
		fit(0, cz, tw + .6, th + .6, o.polar ?? .1);
		await Promise.all(moves);
	}

	/* ================= les gestes : toucher une zone, surligner, lancer ================= */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	const setRay = e => { const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); };
	function hitDoc(list){ const h = ray.intersectObjects(list.filter(D => D.g.visible).map(D => D.face), false)[0]; if(!h) return null; const D = h.object.userData.doc; return { D, p:{ x:h.uv.x*D.W, y:(1 - h.uv.y)*D.H }, w:h.point }; }
	// la zone touchée : on teste chaque ligne de la zone (une phrase sur deux lignes ne couvre pas tout son rectangle), la plus petite l'emporte
	function zoneAt(D, p, keys){ let best = null, ba = Infinity; for(const [z, rs] of Object.entries(D.zl)){ if(keys && !keys.includes(z)) continue; for(const r of rs) if(p.x >= r[0] - 12 && p.x <= r[2] + 12 && p.y >= r[1] - 12 && p.y <= r[3] + 12){ const a = (r[2] - r[0])*(r[3] - r[1]); if(a < ba){ ba = a; best = z; } } } return best; }
	let ptr = null;
	cv.addEventListener("pointerdown", e => {
		if(!input || e.button > 0) return;
		setRay(e); ptr = { x:e.clientX, y:e.clientY };
		if(input.type === "hl"){ const h = hitDoc([input.D]); if(h){ ptr.hl = [h.p]; input.D.live = ptr.hl; marker.visible = true; marker.position.copy(h.w); W.controls.enabled = false; cv.setPointerCapture(e.pointerId); } }
		if(input.type === "drag"){
			const h = ray.intersectObjects(input.items.map(it => it.D.face), false)[0];
			if(h){ const it = input.items.find(i => i.D.face === h.object); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1); const p = ray.ray.intersectPlane(plane, new THREE.Vector3()); if(p){ ptr.drag = { it, plane, off:it.D.g.position.clone().sub(p).setY(0), from:it.D.g.position.clone() }; W.controls.enabled = false; cv.setPointerCapture(e.pointerId); play("swipe"); } }
		}
	});
	cv.addEventListener("pointermove", e => {
		if(!ptr || !input) return; setRay(e);
		if(ptr.hl){ const h = hitDoc([input.D]); if(h){ ptr.hl.push(h.p); marker.position.copy(h.w); input.D.dirty = true; } }
		if(ptr.drag){ const p = ray.ray.intersectPlane(ptr.drag.plane, new THREE.Vector3()); if(p){ ptr.drag.it.D.g.position.copy(p.add(ptr.drag.off)).setY(1); } }
	});
	const endPtr = e => {
		if(!ptr || !input){ ptr = null; return; }
		const moved = Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y);
		W.controls.enabled = true; marker.visible = false;
		if(ptr.hl){
			const D = input.D, pts = ptr.hl; D.live = null; D.dirty = true;
			const xs = pts.map(p => p.x), span = Math.max(...xs) - Math.min(...xs);
			let best = null, bc = 0;
			for(const z of input.keys){ const r = D.zones[z]; if(!r) continue; const inn = pts.filter(p => p.y >= r[1] - 26 && p.y <= r[3] + 26 && p.x >= r[0] - 30 && p.x <= r[2] + 30); if(inn.length < 2) continue; const c = (Math.min(r[2], Math.max(...inn.map(p => p.x))) - Math.max(r[0], Math.min(...inn.map(p => p.x))))/Math.max(1, Math.min(r[2] - r[0], D.W*.55)); if(c > bc){ bc = c; best = z; } }
			if(best && bc >= .3) input.fn(best);
			else if(span < 30){ const z = zoneAt(D, pts[0], input.keys); if(z && input.tapped === z) input.fn(z); else { input.tapped = z; say(null, null, { hint:"Appuie et <b>glisse</b> le surligneur tout le long de la phrase." }); } }
		}
		else if(ptr.drag){ const { it, from } = ptr.drag; input.drop(it, it.D.g.position.clone(), from); }
		else if(input.type === "tap" && moved < 12){ setRay(e); const h = hitDoc(input.docs); if(h) input.fn(h.D, zoneAt(h.D, h.p, input.keys && input.keys[h.D.id]), h.p); }
		ptr = null;
	};
	cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);

	const tapTask = (docsList, fn, keys, auto) => P(res => { input = { type:"tap", docs:docsList, keys, fn:(D, z, p) => { if(fn(D, z, p)){ input = null; res(); } }, auto }; });
	const hlTask = (D, fn, keys, auto) => P(res => { input = { type:"hl", D, keys, fn:z => { if(fn(z)){ input = null; res(); } }, auto }; });
	const dragTask = (items, drop, auto) => P(res => { input = { type:"drag", items, drop:(it, pos, from) => { if(drop(it, pos, from)){ input = null; res(); } }, auto }; });

	/* ================= l'interface : messages, note, horloge ================= */
	let sayTimer = 0, lastSay = null;
	function say(who, html, o = {}){
		if(o.hint){ if(lastSay) render(lastSay.who, lastSay.html, { ...lastSay.o, extra:o.hint }); return; }
		lastSay = { who, html, o }; return render(who, html, o);
	}
	function render(who, html, o){
		const [n, role, ini, col] = PEOPLE[who];
		msg.innerHTML = `<div class="ny-av" style="background:${col}">${ini}</div><div class="ny-mt"><small>${n} <i>· ${role}</i></small><p>${html}</p>
			${o.extra ? `<p class="ny-task" style="background:rgba(255,138,128,.16);color:#ffd5d0!important">${o.extra}</p>` : o.task ? `<p class="ny-task">${o.task}</p>` : ""}
			${o.sand ? `<div class="ny-sand"><i style="animation-duration:${o.sand}s"></i></div>` : ""}
			${o.btn ? `<button class="ny-btn" type="button">${o.btn}</button>` : ""}</div>`;
		msg.classList.remove("pop"); void msg.offsetWidth; msg.classList.add("pop");
		if(lastFit && msg.getBoundingClientRect().bottom + 10 - fitTop > 30) fit(...lastFit, .5);      // seulement si le message grandit : la pièce ne bouge pas sous le doigt
		clearTimeout(sayTimer);
		if(o.btn) return P(r => { const b = msg.querySelector(".ny-btn"); const go = () => { btnAuto = null; play("pop"); r(); }; b.onclick = go; btnAuto = go; setTimeout(() => b.focus({ preventScroll:true }), 300); });
	}
	const next = (who, html, btn = "Continuer →") => say(who, html, { btn });
	function stage(k, title, time){
		S.step = k; ev("stage", title); input = null; btnAuto = null; clearExtra();
		root.querySelectorAll(".ny-steps li").forEach(li => { const i = STEPS_UI.findIndex(s => s[0] === li.dataset.s), n = STEPS_UI.findIndex(s => s[0] === k); li.className = i < n ? "done" : i === n ? "now" : ""; });
		S.time = Math.max(time, S.time); showClock();
	}
	const fmt = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m/60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
	const showClock = () => { clockEl.textContent = fmt(S.time); };
	function err(why, k){
		S.errors++; S.lost += 10; S.time += 10; showClock(); play("bad"); ev("err", why);
		if(k) S.errs[k] = (S.errs[k] || 0) + 1;
		lostEl.classList.remove("ny-on"); void lostEl.offsetWidth; lostEl.classList.add("ny-on");
	}
	function learn(...ks){ for(const k of ks) if(!S.learned.includes(k)) S.learned.push(k); }
	function proof(t, src, x){ S.proofs.push([t, src, x]); renderNote(); note.classList.remove("flash"); void note.offsetWidth; note.classList.add("flash"); }
	function renderNote(){
		const n = S.proofs.length;
		noteHd.innerHTML = `<span class="k">Ta note de synthèse</span><b>Pavé : pourquoi les clients partent</b><em>${S.plan ? "Plan ▾" : `${n} preuve${n > 1 ? "s" : ""} ▾`}</em>`;
		const li = ([t, src], x) => `<li${x ? ` class="x"` : ""}>${src ? `<i>${src}</i>` : ""}${t}</li>`;
		let body = `<div class="ny-meta"><b>Pour</b> Claire Vandamme, PDG · <b>Remise</b> jeudi, 8 h<br><b>Question</b> pourquoi Pavé perd-il ses clients, et que faire lundi ?</div>`;
		if(S.plan){
			body += `<h5>I. Un parcours d'achat cassé, pas une crise du marché</h5><ul>${S.plan.I.map(t => li([t])).join("") || `<li class="x">…</li>`}</ul>
				<h5>II. Réparer avant de dépenser</h5><ul>${S.plan.II.map(t => li([t])).join("") || `<li class="x">…</li>`}</ul>
				${S.plan.X.length ? `<h4>Écarté</h4><ul>${S.plan.X.map(t => li([t], true)).join("")}</ul>` : ""}`;
		} else body += `<h4>Preuves</h4>${n ? `<ul>${S.proofs.map(p => li(p, p[2])).join("")}</ul>` : `<p class="ny-empty">Ta note se remplit à chaque preuve trouvée dans la liasse.</p>`}`;
		noteBd.innerHTML = body;
	}
	const score = (k, v, max) => { S.pts[k] = [Math.max(0, v), max]; };

	/* ================= 1 · les avis clients (scène d'ouverture) ================= */
	async function avis(){
		stage("avis", "1 · Les avis clients", 21*60 + 47); S.errs = {};
		const A = docs.A; A.marks = []; A.dirty = true;
		W.place(new THREE.Vector3(-2, 2, -6), 40, 1.12, .3);
		say("helene", `<b>21 h 47.</b> Claire Vandamme, PDG de <b>Pavé</b>, les baskets lilloises, vient d'écrire : « On perd nos clients. Il me faut une recommandation <b>demain, 8 h</b>. » On commence par la voix des clients.`, { task:"Surligne les 3 avis qui expliquent pourquoi les clients partent" });
		await wait(1300);
		await lay(["A"]);
		const ok = { a2:["Livraison : commandées le 2, reçues le 11", "Pièce A"], a3:["Le paiement plante sur téléphone", "Pièce A"], a5:["Prix : 95 € l'an dernier, 119 € aujourd'hui", "Pièce A"] };
		const found = new Set();
		await hlTask(A, z => {
			if(found.has(z)) return false;
			if(ok[z]){ found.add(z); mark(A, { type:"hl", z }); play("good"); proof(...ok[z]); if(found.size < 3) say("helene", found.size === 1 ? "Oui. Une raison de partir. Il y en a d'autres." : "Encore une. Plus qu'une.", { task:`Surligne encore ${3 - found.size} avis` }); return found.size === 3; }
			mark(A, { type:"bad", z }, 900); err("avis positif surligné", "avis");
			say("helene", "Ça fait plaisir… mais ça n'explique pas pourquoi les clients <b>partent</b>.", { task:`Surligne encore ${3 - found.size} avis` });
			if(S.errs.avis >= 2) for(const k of Object.keys(ok)) if(!found.has(k)) mark(A, { type:"hint", z:k }, 2500);
			return false;
		}, AVIS.map(a => a[0]), () => { for(const z of Object.keys(ok)) input && input.fn(z); });
		score("avis", 3 - (S.errs.avis || 0), 3); learn("doc");
		await wait(600);
		say("helene", "Trois pistes : <b>la livraison, le paiement, le prix</b>. Mais un avis n'est pas une preuve. Il nous faut des chiffres.");
		await wait(1600);
	}

	/* ================= 2 · le chiffre qui ment ================= */
	async function chiffres(){
		stage("chiffres", "2 · Le chiffre qui ment", 22*60 + 30);
		const B = docs.B, C = docs.C;
		await lay(["C", "B"]);
		const at = (D, z, why, hintK) => { mark(D, { type:"bad", z }, 900); err(why, hintK); };
		// a) le chiffre de Marc
		say("helene", "Marc, le directeur commercial, a écrit à Claire à 18 h. Il a un chiffre, et une explication.", { task:"Entoure le chiffre de Marc sur les ventes du site" });
		await tapTask([C, B], (D, z) => {
			if(D === C && z === "m5"){ mark(C, { type:"circle", z }); play("good"); return true; }
			if(z && D === C) at(D, z, "courriel : pas le chiffre", "m5"); else if(z) say("helene", "D'abord le courriel de Marc : quel chiffre avance-t-il ?", { task:"Entoure le chiffre de Marc sur les ventes du site" });
			if((S.errs.m5 || 0) >= 2) mark(C, { type:"hint", z:"m5" }, 2500);
			return false;
		}, null, () => input.fn(C, "m5"));
		// b) le même chiffre dans le tableau
		say("helene", "−5 %, dit Marc. Vérifions dans le tableau des ventes.", { task:"Entoure la baisse des ventes du site dans le tableau" });
		await tapTask([B], (D, z) => {
			if(z === "site_ec" || z === "site"){ mark(B, { type:"circle", z:"site_ec" }); play("good"); thread(zoneWorld(C, "m5"), zoneWorld(B, "site_ec")); return true; }
			if(z === "visites_ec" || z === "visites"){ mark(B, { type:"bad", z:"visites_ec" }, 900); say("helene", "Tiens, −5 %… mais c'est la ligne des <b>visites</b>, pas des ventes. Et les ventes du site ?", { task:"Entoure la baisse des ventes du site" }); return false; }
			if(z){ at(B, z.replace(/_ec$/, "") + "_ec", "tableau : mauvaise ligne", "site"); if((S.errs.site || 0) >= 2) mark(B, { type:"hint", z:"site_ec" }, 2500); }
			return false;
		}, { B:ROWS.filter(Boolean).flatMap(r => [r[4] + "_ec", r[4]]) }, () => input.fn(B, "site_ec"));
		// c) d'où vient l'écart ?
		say("helene", "<b>−5 %</b> dans le courriel, <b>−35 %</b> dans le tableau. Les deux ne mesurent pas la même chose.", { task:"Trouve, dans le courriel, d'où vient le chiffre de Marc" });
		await tapTask([C, B], (D, z) => {
			if(D === C && z === "src"){ mark(C, { type:"circle", z }); play("good"); return true; }
			if(z){ mark(D, { type:"bad", z }, 900); err("source non trouvée", "src"); if((S.errs.src || 0) >= 2) mark(C, { type:"hint", z:"src" }, 2500); }
			return false;
		}, null, () => input.fn(C, "src"));
		// d) la ligne qui explique
		say("helene", "Des <b>visites</b>, pas des ventes ! Les gens viennent toujours sur le site. Alors que se passe-t-il une fois qu'ils y sont ?", { task:"Montre la ligne du tableau qui l'explique" });
		await tapTask([B], (D, z) => {
			if(z === "conv" || z === "conv_ec"){ mark(B, { type:"circle", z:"conv" }); play("good"); thread(zoneWorld(C, "src"), zoneWorld(B, "conv")); return true; }
			if(z === "visites" || z === "visites_ec"){ say("helene", "Les visites tiennent, oui : c'est la moitié de l'explication. Et ce que font les visiteurs ?", { task:"Montre la ligne du tableau qui l'explique" }); return false; }
			if(z){ mark(B, { type:"bad", z }, 900); err("tableau : pas la conversion", "conv"); if((S.errs.conv || 0) >= 2) mark(B, { type:"hint", z:"conv" }, 2500); }
			return false;
		}, { B:ROWS.filter(Boolean).flatMap(r => [r[4] + "_ec", r[4]]) }, () => input.fn(B, "conv"));
		proof("Visites −5 %, ventes du site −35 % : la conversion tombe de 2,0 % à 1,4 %", "Pièces B et C");
		const e = ["m5", "site", "src", "conv"].reduce((s, k) => s + (S.errs[k] || 0), 0);
		score("chiffres", 3 - e, 3); learn("logique", "lic");
		await next("helene", "Ils viennent, mais <b>n'achètent plus</b> : 2 visiteurs sur 100 achetaient, 1,4 aujourd'hui. Ça colle avec le paiement qui plante. Marc dit aussi « c'est la conjoncture ». Vérifions.");
	}

	/* ================= 3 · la conjoncture, et le sondage ================= */
	async function marche(){
		stage("marche", "3 · Le marché et le sondage", 23*60 + 40);
		const B = docs.B, D = docs.D, F = docs.F;
		for(const z of ["site_ec", "conv"]) B.marks = B.marks.filter(m => m.z !== z);
		await lay(["D", "B"]);
		say("helene", "Le <i>Beffroi Éco</i> a publié un article sur le marché de la basket. Comparons-le à Pavé.", { task:"Entoure le recul du marché, dans l'article" });
		await tapTask([D, B], (Dd, z) => {
			if(Dd === D && z === "m3"){ mark(D, { type:"circle", z }); play("good"); return true; }
			if(z){ mark(Dd, { type:"bad", z }, 900); err("article : pas le recul", "m3"); if((S.errs.m3 || 0) >= 2) mark(D, { type:"hint", z:"m3" }, 2500); }
			return false;
		}, { D:["m3", "d3"], B:ROWS.filter(Boolean).flatMap(r => [r[4] + "_ec", r[4]]) }, () => input.fn(D, "m3"));
		say("helene", "Le marché : −3 %. Et Pavé, sur l'ensemble de ses ventes ?", { task:"Entoure la baisse totale de Pavé dans le tableau" });
		await tapTask([B], (Dd, z) => {
			if(z === "total_ec" || z === "total"){ mark(B, { type:"circle", z:"total_ec" }); play("good"); thread(zoneWorld(D, "m3"), zoneWorld(B, "total_ec")); return true; }
			if(z === "site_ec" || z === "site"){ mark(B, { type:"bad", z:"site_ec" }, 900); err("comparer le site seul au marché", "tot"); say("helene", "Ça, c'est le site seul. On compare ce qui est comparable : <b>toutes</b> les ventes de Pavé avec tout le marché.", { task:"Entoure la baisse totale de Pavé" }); return false; }
			if(z){ mark(B, { type:"bad", z }, 900); err("tableau : pas le total", "tot"); if((S.errs.tot || 0) >= 2) mark(B, { type:"hint", z:"total_ec" }, 2500); }
			return false;
		}, { B:ROWS.filter(Boolean).flatMap(r => [r[4] + "_ec", r[4]]) }, () => input.fn(B, "total_ec"));
		proof("Marché −3 %, Pavé −18 % : six fois plus. Ce n'est pas la conjoncture", "Pièces B et D");
		learn("cg");
		await next("helene", "<b>−18 % contre −3 %</b> : Pavé recule six fois plus vite que son marché. La conjoncture n'explique pas tout : le problème est chez Pavé.");
		// le sondage
		clearExtra();
		const X = TRAYS.X; X.g.visible = true; X.g.position.set(camera.aspect < 1 ? 0 : 5.6, 0, camera.aspect < 1 ? 4.4 : .2);
		await lay(["F"], { cz:camera.aspect < 1 ? -.6 : -.2 });
		fit(camera.aspect < 1 ? 0 : 2.6, camera.aspect < 1 ? 1.2 : 0, camera.aspect < 1 ? 5 : 10.4, camera.aspect < 1 ? 9.2 : 4.6);
		say("helene", "Le sondage joint au courriel de Marc. Il veut bâtir sa campagne dessus. Peut-on le citer dans ta note ?", { task:"Entoure ce qui rend ce sondage peu fiable" });
		await tapTask([F], (Dd, z) => {
			if(z === "n212"){ mark(F, { type:"circle", z }); play("good"); return true; }
			if(z === "p87"){ mark(F, { type:"bad", z }, 900); err("sondage : le résultat n'est pas le défaut", "n212"); say("helene", "87 %, c'est la conclusion. Avant d'y croire : <b>qui</b> a répondu, et combien ?", { task:"Entoure ce qui rend ce sondage peu fiable" }); }
			if((S.errs.n212 || 0) >= 2) mark(F, { type:"hint", z:"n212" }, 2500);
			return false;
		}, { F:["p87", "n212"] }, () => input.fn(F, "n212"));
		mark(F, { type:"stamp", text:"ÉCARTÉE" }); play("stamp");
		say("helene", "212 abonnés, déjà fans de la marque : ils ne disent rien des clients qui partent. <b>Échantillon biaisé.</b>", { task:"Fais glisser la capture dans le bac « Écartées »" });
		await dragTask([{ D:F }], (it, pos, from) => {
			if(pos.distanceTo(X.g.position.clone().setY(1)) < 3.4){ moveTo(F.g, X.g.position.clone().setY(.4), { ry:.15, dur:.35, lift:.3 }); tween(.35, k => F.g.scale.setScalar(1 - .32*k)); play("pop"); onDesk = onDesk.filter(d => d !== F); return true; }
			moveTo(F.g, from, { dur:.3, lift:.3 }); return false;
		}, () => input.drop({ D:F }, X.g.position.clone().setY(1), F.g.position.clone()));
		proof("Sondage écarté : 212 abonnés déjà fans, pas représentatif", "Pièce F", true);
		score("marche", 3 - ["m3", "tot", "n212"].reduce((s, k) => s + (S.errs[k] || 0), 0), 3); learn("doc");
		await wait(700); X.g.visible = false; F.g.visible = false; F.g.scale.setScalar(1);
	}

	/* ================= 4 · le rapport, en anglais ================= */
	async function report(){
		stage("report", "4 · Le rapport en anglais", 1440 + 75);
		const E = docs.E;
		await lay(["E"]);
		say("helene", "1 h 15. Northbridge, le fonds britannique actionnaire de Pavé, a envoyé son étude de marché. <b>In English</b>, of course.", { task:"Surligne les 2 phrases qui expliquent la chute du site de Pavé" });
		const ok = { e2:["72 % des commandes en ligne passent par un téléphone", "Pièce E"], e3:["Les leaders livrent en 48 h ; au-delà de 5 jours, un client sur deux annule", "Pièce E"] };
		const why = { e1:"Intéressant : la vente en ligne pèse lourd. Mais ça n'explique pas pourquoi celle de <b>Pavé</b> s'effondre.", e4:"Plutôt une bonne nouvelle pour Pavé : ça n'explique pas la chute." };
		const found = new Set();
		await hlTask(E, z => {
			if(found.has(z)) return false;
			if(ok[z]){ found.add(z); mark(E, { type:"hl", z }); play("good"); proof(...ok[z]); if(found.size < 2) say("helene", z === "e2" ? "<i>72 % on a smartphone</i>… et chez Pavé, le paiement plante sur téléphone !" : "<i>Within 48 hours</i>… Pavé livre en neuf jours.", { task:"Surligne encore une phrase" }); return found.size === 2; }
			mark(E, { type:"bad", z }, 900); err("rapport : phrase hors sujet", "en"); say("helene", why[z], { task:`Surligne encore ${2 - found.size} phrase${found.size ? "" : "s"}` });
			if(S.errs.en >= 2) for(const k of Object.keys(ok)) if(!found.has(k)) mark(E, { type:"hint", z:k }, 2500);
			return false;
		}, REPORT.map(r => r[0]), () => { for(const z of Object.keys(ok)) input && input.fn(z); });
		score("report", 2 - (S.errs.en || 0), 2); learn("en");
		await next("helene", "Le rapport confirme les avis : les clients achètent <b>sur téléphone</b> et veulent être <b>livrés en deux jours</b>. Tu as tes preuves. Place au plan.");
	}

	/* ================= 5 · le plan : lancer chaque fiche dans sa partie ================= */
	async function plan(){
		stage("plan", "5 · Le plan de la note", 1440 + 180);
		S.plan = { I:[], II:[], X:[] }; renderNote();
		for(const D of onDesk) moveTo(D.g, new THREE.Vector3(PILE.x + Math.random()*.6, .1, PILE.z), { ry:.4, dur:.5 });
		onDesk = [];
		const tall = camera.aspect < 1;
		const POS = tall ? { I:[0, -4.2], II:[0, 4.6], X:[3.6, .2] } : { I:[-5.4, -.2], II:[5.4, -.2], X:[0, 3.8] };
		for(const [k, [x, z]] of Object.entries(POS)){ const t = TRAYS[k]; t.g.visible = true; t.g.position.set(x, 0, z); t.n = 0; }
		if(tall) TRAYS.X.g.position.set(0, 0, 8.4);
		const C0 = tall ? new THREE.Vector3(0, .3, .2) : new THREE.Vector3(0, .3, -.4);
		if(tall) fit(0, 2.1, 6, 15.6, .2); else fit(0, .9, 15.6, 9.4, .2);
		say("helene", "3 h. Une note qui fait décider tient en deux parties : <b>I, le constat</b> (ce que prouvent les pièces), <b>II, les recommandations</b> (ce qu'on fait lundi). Ce qui ne tient pas, aux écartées.", { task:"Fais glisser chaque fiche vers son bac" });
		const errs0 = S.errors;
		for(const p of PLAN){
			const D = docs[p.id]; D.g.position.copy(C0).setX(C0.x - 12); D.g.rotation.y = 0; D.dirty = true;
			await moveTo(D.g, C0, { dur:.45, lift:.6 });
			await dragTask([{ D }], (it, pos, from) => {
				let best = null, bd = 3.3;
				for(const k in TRAYS){ const dd = Math.hypot(pos.x - TRAYS[k].g.position.x, pos.z - TRAYS[k].g.position.z); if(dd < bd){ bd = dd; best = k; } }
				if(!best){ moveTo(D.g, from.clone().setY(.3), { dur:.25, lift:.2 }); return false; }
				if(best !== p.to){
					err("plan : mauvaise partie", "plan"); moveTo(D.g, C0, { dur:.35, lift:.4 });
					say("helene", p.to === "X" ? PLAN_WHY.X : best === "X" ? PLAN_WHY.keep : PLAN_WHY[p.to], { task:"Fais glisser la fiche vers son bac" });
					return false;
				}
				const t = TRAYS[best]; t.n++;
				moveTo(D.g, t.g.position.clone().add(new THREE.Vector3((t.n % 2 ? -.12 : .12), .2 + t.n*.07, -.1 + t.n*.05)), { ry:(t.n % 3 - 1)*.06, dur:.3, lift:.3 }).then(() => D.g.scale.setScalar(1));
				D.g.scale.setScalar(.95);
				play(best === "X" ? "swipe" : "good");
				S.plan[best].push(`${p.t} ${p.s}`); renderNote();
				if(best === "X") say("helene", "Bien vu : cette idée sort du sondage qu'on a écarté.", { task:"Fiche suivante" });
				else say("helene", best === "I" ? "Constat : partie I." : "Recommandation : partie II.", { task:"Fiche suivante" });
				return true;
			}, () => input.drop({ D }, TRAYS[p.to].g.position.clone(), C0.clone()));
		}
		const e = S.errors - errs0;
		score("plan", e === 0 ? 3 : e <= 2 ? 2 : e <= 4 ? 1 : 0, 3); learn("ecrire");
		await next("helene", "Ton plan tient : <b>I.</b> Pavé ne perd pas son marché, il perd ses acheteurs en ligne. <b>II.</b> Réparer le parcours d'achat avant de dépenser en publicité. On l'imprime.");
		for(const k in TRAYS) TRAYS[k].g.visible = false;
		for(const p of PLAN) docs[p.id].g.visible = false;
	}

	/* ================= 6 · la relecture ================= */
	async function relecture(){
		stage("relecture", "6 · La relecture", 1440 + 340);
		const N = docs.N; N.marks = []; N.dirty = true;
		N.g.position.set(10, .1, -8); N.g.visible = true;
		await lay(["N"]);
		say("helene", "5 h 40. La note sort de l'imprimante. Une faute, et Claire ne lira pas la suite.", { task:"Touche les 3 fautes au stylo rouge" });
		const found = new Set();
		await tapTask([N], (Dd, z) => {
			if(!z || found.has(z)) return false;
			if(FAUTES[z]){ found.add(z); mark(N, { type:"strike", z, fix:FAUTES[z][0] }); play("good"); say("helene", FAUTES[z][1], { task:found.size < 3 ? `Encore ${3 - found.size} faute${found.size < 2 ? "s" : ""}` : "La note est propre." }); return found.size === 3; }
			mark(N, { type:"bad", z }, 800); err("relecture : mot juste barré", "fr"); say("helene", "Ce mot-là est juste. Relis lentement, mot à mot.", { task:`Encore ${3 - found.size} faute${3 - found.size > 1 ? "s" : ""}` });
			if(S.errs.fr >= 2) for(const k of Object.keys(FAUTES)) if(!found.has(k)) mark(N, { type:"hint", z:k }, 2500);
			return false;
		}, null, () => { for(const z of Object.keys(FAUTES)) input && input.fn(N, z); });
		score("relecture", 3 - (S.errs.fr || 0), 3); learn("fr");
		await wait(1400);
		await next("helene", "Envoyée à 5 h 52. Dors deux heures. À 8 h, Claire, Marc et Sarah, de Northbridge, t'attendent. <b>Prends tes fiches.</b>", "Aller au comité →");
	}

	/* ================= 7 · le comité de 8 h ================= */
	async function comite(){
		stage("comite", "7 · Le comité de 8 h", 1440 + 480);
		for(const D of Object.values(docs)) D.g.visible = false;
		onDesk = [];
		scene.background = new THREE.Color("#e9eef3"); hemi.intensity = 1.3; hemi.color.set("#ffffff"); hemi.groundColor.set("#a89c8a"); lampLight.intensity = 0; moon.intensity = 1.2;
		moon.position.set(CX - 10, 30, 20); moon.target.position.set(CX, 0, 0); scene.add(moon.target);
		const tall = camera.aspect < 1;
		const fiches = FICHES.map(([k], i) => {
			const D = docs["f_" + k]; D.marks = []; D.dirty = true; D.g.visible = true;
			const col = tall ? i % 2 : i % 3, row = tall ? Math.floor(i/2) : Math.floor(i/3);
			D.home = tall ? new THREE.Vector3(CX - 1.95 + col*3.9, .55, -1.2 + row*2.45) : new THREE.Vector3(CX - 5.5 + col*5.5, .6, .9 + row*3.1);
			D.g.position.copy(D.home); D.g.rotation.set(.45, 0, 0); D.g.scale.setScalar(tall ? 1 : 1.35); D.k = k;      // inclinées vers le joueur, pour les lire
			return D;
		});
		// la caméra à la place du joueur : les trois visages au fond, les fiches devant soi
		const kk = camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1;
		view(new THREE.Vector3(CX, 4, tall ? -4 : -6), tall ? 44/kk : 34, tall ? .92 : .94, 0, 1.6);
		await next("claire", "Bonjour. J'ai lu votre note cette nuit : elle est claire. Mais Marc n'est pas d'accord, et Sarah représente notre actionnaire. <b>Répondez avec vos fiches.</b>", "Commencer");
		let total = 0;
		for(const q of QUESTIONS){
			const m = members[q.who]; m.bob = 1; play("chime");
			const t0 = performance.now();
			say(q.who, q.en ? `<i>${q.q}</i>` : q.q, { task:q.en ? "Pose la fiche qui répond (answer in English)" : "Pose la fiche qui répond", sand:SAND });
			let tries = 0, res = null;
			await tapTask(fiches, Dd => {
				tries++;
				const late = (performance.now() - t0)/1000 > SAND;
				if(Dd.k === q.ok) res = tries === 1 ? (late ? 2 : 3) : 1;
				else if(q.mid.includes(Dd.k)) res = tries === 1 ? (late ? 1 : 2) : 1;
				if(res){
					play(res >= 2 ? "good" : "chime");
					const p = m.g.position; moveTo(Dd.g, new THREE.Vector3(p.x*.4 + CX*.6, .3, -5.5), { dur:.55, lift:1.4 });
					return true;
				}
				mark(Dd, { type:"bad", z:"all" }, 900); err("comité : la fiche ne répond pas", "oral");
				if(tries >= 2){ res = 0; mark(docs["f_" + q.ok], { type:"hint", z:"all" }, 3000); say("helene", "Psst… c'était cette fiche-là. On la pose, et on enchaîne."); return true; }
				say(q.who, q.en ? "<i>That doesn't answer my question.</i>" : "Ça ne répond pas à ma question.", { task:"Pose la fiche qui répond" });
				return false;
			}, null, () => input.fn(docs["f_" + q.ok]));
			if(res === 0) await wait(1600);
			S.answers.push(res); total += res;
			await wait(500);
			if(res > 0){
				await next("me", q.yes + (q.mid.length && res < 3 && tries === 1 ? " <i>(une bonne fiche, mais pas la plus forte : 72 % des commandes passent par le téléphone)</i>" : ""), "Suite →");
				m.bob = 1;
				say(q.who, res >= 2 ? q.end : (q.en ? "<i>Hmm. You took your time.</i>" : "Hmm. Vous avez mis le temps."));
			} else say(q.who, q.en ? "<i>I'll need to read that again.</i>" : "Je note que ce point n'était pas prêt.");
			await wait(2000);
			const D = docs["f_" + q.ok]; moveTo(D.g, D.home, { dur:.4, lift:.4 });
		}
		score("comite", total, 12); learn("oral", "en", "ast");
		S.adopted = total >= 7;
		members.claire.bob = 1;
		await next("claire", S.adopted ? "Le comité <b>adopte votre plan</b>. Paiement mobile réparé d'ici décembre, expédition en 48 h, la campagne attendra. Merci : c'est exactement ce qu'il nous fallait." : "Le constat est juste, mais la défense était fragile. Je veux une deuxième version, <b>chiffres à l'appui</b>, pour lundi.", "Voir le verdict →");
	}

	/* ================= déroulé ================= */
	const ORDER = ["avis", "chiffres", "marche", "report", "plan", "relecture", "comite"];
	const STEPS = { avis, chiffres, marche, report, plan, relecture, comite };
	async function run(from = "avis"){
		const g = GEN;
		for(const k of ORDER.slice(ORDER.indexOf(from))){
			await STEPS[k](); if(closed || g !== GEN) return;
			if(k === "avis"){
				await P(r => palier({ id:"jourj", onEvent, openLead, quit:close,
					titre:"Trois raisons de partir, trouvées dans la voix des clients.",
					texte:"Il reste la nuit pour les prouver : démasquer le chiffre qui ment, écarter le sondage biaisé, lire le rapport anglais, bâtir le plan… puis défendre ta note à 8 h devant la direction.",
					suite:"Passer la nuit sur le dossier (≈ 6 min)" }).then(r));
				if(closed || g !== GEN) return;
			}
		}
		finish();
	}
	function jump(k){
		GEN++; input = null; btnAuto = null; tweens.clear(); clearExtra(); $(".ny-ov").hidden = true;
		scene.background = new THREE.Color("#0b1426"); hemi.intensity = .75; hemi.color.set("#9fb6e0"); hemi.groundColor.set("#1b2236"); lampLight.intensity = 90; moon.intensity = .7; moon.position.set(-14, 26, -10); moon.target.position.set(0, 0, 0);
		for(const D of Object.values(docs)){ D.g.visible = false; if(k === "avis") D.marks = []; D.dirty = true; }
		for(const t of Object.values(TRAYS)) t.g.visible = false;
		onDesk = []; S.errs = S.errs || {}; S.time = 0;
		if(ORDER.indexOf(k) > ORDER.indexOf("plan") && !S.plan){ S.plan = { I:PLAN.filter(p => p.to === "I").map(p => `${p.t} ${p.s}`), II:PLAN.filter(p => p.to === "II").map(p => `${p.t} ${p.s}`), X:[] }; }
		if(ORDER.indexOf(k) <= ORDER.indexOf("plan")) S.plan = null;
		renderNote(); run(k);
	}

	/* ================= le verdict ================= */
	function finish(){
		input = null; play("win");
		const got = Object.values(S.pts).reduce((s, v) => s + v[0], 0), max = Object.values(S.pts).reduce((s, v) => s + v[1], 0) || 1;
		const sc = Math.round(got/max*100);
		const mention = MENTIONS[sc >= 85 ? 3 : sc >= 65 ? 2 : sc >= 45 ? 1 : 0];
		ev("win", mention);
		const good = S.answers.filter(a => a >= 2).length;
		$(".ny-card").innerHTML = `<p class="k">Jeudi 19 novembre, 8 h 40 · comité de direction de Pavé</p>
			<h2>${S.adopted ? "Ton plan est adopté" : "Une deuxième version, pour lundi"}</h2>
			<span class="ny-stamp" style="color:${S.adopted ? GREEN : RED}">${S.adopted ? "RECOMMANDATION ADOPTÉE" : "À RETRAVAILLER"}</span>
			<p>Mention <b>${mention}</b> (${sc} / 100). Tu as fait, en une nuit, le métier de <b>consultant·e junior</b> : dépouiller une liasse, démasquer un chiffre qui ment, écarter une source biaisée, lire un rapport en anglais, bâtir un plan, relire, puis défendre ta note devant la direction, preuve en main.</p>
			<div class="ny-stats"><div>Preuves dans ta note<b>${S.proofs.length}</b></div><div>Objections bien défendues<b>${good} / ${QUESTIONS.length}</b></div><div>Le chiffre qui mentait<b>−5 % ≠ −35 %</b></div><div>Nuit perdue en erreurs<b>${S.lost} min</b></div></div>
			<p class="k">Ce que la prépa t'apprend, et que tu viens d'utiliser (${S.learned.length})</p>
			<ul class="ny-list">${S.learned.map(k => `<li><span>${COURSES[k][0]}</span><b>${COURSES[k][1]}</b> · ${COURSES[k][2]}</li>`).join("")}</ul>
			<p>Synthétiser un dossier, argumenter à l'écrit, convaincre à l'oral, en français comme en anglais : c'est ce que la prépa entraîne pendant deux ou trois ans, en même temps qu'une licence, pour les concours d'admission sur titre des grandes écoles de commerce.</p>
			${jpoCard()}${openLead ? `<button class="ny-go" data-a="lead">📄 Recevoir la plaquette de la prépa</button>` : ""}
			<a class="ny-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa ↗</a>
			<button class="ny-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="ny-alt" data-a="replay">Rejouer</button>`;
		$(".ny-ov").hidden = false; $(".ny-card").scrollTop = 0; msg.innerHTML = "";
	}
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ close(); openJourJ({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
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
	$(".ny-x").addEventListener("click", close);

	// ouverture à chaud : pas d'écran de règles, Hélène explique chaque geste au moment de le faire
	renderNote(); showClock();
	ev("start");
	ev("missions", STEPS_UI.map(([k, t], i) => [`${i + 1} · ${t}`, () => jump(k)]));
	run();
	if(window.campus) window.campus.game = { S, W, docs, jump, where:(id, z) => { const p = zoneWorld(docs[id], z).project(camera); return [Math.round((p.x + 1)/2*innerWidth), Math.round((1 - p.y)/2*innerHeight)]; }, pump:(n = 40) => { for(let i = 0; i < n; i++) tick(0, 1/30); }, auto:() => { if(btnAuto) btnAuto(); else if(input && input.auto) input.auto(); } };
}
