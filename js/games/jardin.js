/* « Le jardin se tait » — mini-jeu de la Licence Sciences de la Vie (chargeur « jardin »).
   Fin septembre, au jardin botanique Nicolas Boulay : les pollinisateurs disparaissent. Pourquoi, et que faire
   avant le printemps ? Un seul diagnostic, quatre indices notés dans le carnet de terrain (posé sur la table) :
   - L1 · terrain : trois suspects près des ruches, identifiés à la loupe avec une clé de détermination ;
   - L1 · écologie : l'insecticide du voisin ; prédire l'effet en cascade dans le réseau trophique, puis observer ;
   - L2 · écologie quantitative : lancer des quadrats au hasard, compter les fleurs, calculer la densité ;
   - L3 · génétique : compter les bourraches blanches du semis, retrouver le génotype des parents (3:1).
   Deux fausses pistes (la « guêpe » de la lavande, l'antenne-relais). À la fin, le rapport au jardinier :
   on agrafe une page du carnet à chaque cause retenue et à chacune des deux actions choisies.
   Personnage, rucher et chiffres sont fictifs. Contenus à relire par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { std, mesh, box, cyl, mulberry32 } from "../kit.js?v=5b80c6e132";
import { jpoCard } from "./jpo.js?v=5b80c6e132";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : animations 6 fois plus rapides (tests)

/* ---------- contenus (à valider par l'enseignant) ---------- */
const COURSES = {
	cle:    ["L1", "Biologie des organismes", "Classer le vivant avec une clé de détermination : observer un caractère, puis un autre, jusqu'à l'espèce. Et beaucoup de terrain !"],
	reseau: ["L1", "Écologie", "Réseaux trophiques, effets en cascade d'une perturbation, et la lutte biologique pour protéger les plantes sans pesticides."],
	quadrat:["L2", "Écologie quantitative", "Échantillonner au hasard, estimer une densité, comparer deux inventaires : compter le vivant sans tout compter."],
	genet:  ["L3", "Génétique", "La transmission des caractères, de Mendel à l'ADN, et confronter une hypothèse aux comptages."]
};
// les trois suspects des ruches et la clé de détermination (simplifiée) qui les sépare
const TAXA = {
	syrphe:  { name:"Syrphe ceinturé", latin:"Episyrphus balteatus", taxon:"Insectes · Diptères (les mouches)",
		fact:"Il imite une guêpe pour effrayer les oiseaux (c'est du mimétisme), mais il n'a pas de dard et butine : c'est un pollinisateur, pas un suspect !" },
	crabro:  { name:"Frelon européen", latin:"Vespa crabro", taxon:"Insectes · Hyménoptères · Vespidés",
		fact:"Espèce indigène : il chasse surtout d'autres insectes et ne s'attaque que rarement aux ruches. Il a sa place dans le jardin : on ne le détruit pas." },
	velutina:{ name:"Frelon asiatique", latin:"Vespa velutina", taxon:"Insectes · Hyménoptères · Vespidés",
		fact:"Espèce exotique envahissante, arrivée en France vers 2004. Il chasse en vol stationnaire devant les ruches : les abeilles n'osent plus sortir butiner." },
	guepe:   { name:"Guêpe commune", latin:"Vespula vulgaris", taxon:"Insectes · Hyménoptères · Vespidés", fact:"" }
};
const KEY = {
	k1:{ look:"ailes", what:"les ailes", q:"Combien d'ailes ?", a:[["Deux ailes, une seule paire", "syrphe"], ["Quatre ailes, deux paires", "k2"]] },
	k2:{ look:"thorax", what:"le thorax", q:"De quelle couleur est le thorax ?", a:[["Brun-roux", "crabro"], ["Noir", "k3"]] },
	k3:{ look:"abdomen", what:"l'abdomen et le bout des pattes", q:"Abdomen et pattes ?", a:[["Abdomen sombre à un large anneau orange, bout des pattes jaune", "velutina"], ["Abdomen jaune rayé de noir", "guepe"]] }
};
const leadsTo = (n, sp) => n === sp || (KEY[n] && KEY[n].a.some(o => leadsTo(o[1], sp)));
// réseau trophique : la flèche va de celui qui est mangé vers celui qui mange
const NET = {
	H:["🟠", "Frelons asiatiques", 80, 10], C:["🐞", "Coccinelles", 20, 32], A:["🐝", "Abeilles", 80, 44],
	P:["🟢", "Pucerons", 20, 60], F:["🌼", "Graines des fleurs", 80, 80], R:["🌹", "Rosiers sains", 20, 88]
};
const NET_LINKS = [["R", "P"], ["P", "C"], ["F", "A"], ["A", "H"]];
const TRUTH = { P:"↑", C:"↓", A:"↓", F:"↓", R:"↓" };
const RELEVE = { P:["Pucerons par rameau", "4", "31"], C:["Coccinelles sur les rosiers", "9", "1"], A:["Abeilles sur la lavande (10 min)", "38", "14"],
	F:["Graines par fleur de bourrache (4 au plus)", "3,6", "1,9"], R:["Feuilles saines des rosiers", "90 %", "55 %"] };
const WHY = {
	P:"Les pucerons reviennent les premiers : ils se reproduisent très vite et n'ont plus de prédateurs. C'est l'effet rebond.",
	C:"Les coccinelles sont tuées par le produit, et repeuplent beaucoup plus lentement que leurs proies.",
	A:"Le produit dérive sur la lavande : les abeilles qui butinent sont touchées.",
	F:"Moins d'abeilles, moins de pollinisation : moins de graines.",
	R:"Plus de pucerons, plus de feuilles abîmées : l'insecticide a aggravé le problème."
};
// le carnet : pistes du jardinier et indices
const PISTES = [["guepes", "« Des guêpes rôdent près des ruches »"], ["voisin", "« Le voisin traite ses rosiers »"], ["prairie", "« La prairie fleurit moins »"],
	["semis", "« Des bourraches blanches dans mon semis »"], ["antenne", "« L'antenne-relais du toit voisin » (rumeur)"]];
const CLUES = [
	["L1 · terrain", "Frelon asiatique (invasif) en vol stationnaire devant les ruches : il chasse les abeilles."],
	["L1 · réseau trophique", "Insecticide du voisin : coccinelles ↓, pucerons ↑, abeilles ↓, graines ↓. Effet en cascade."],
	["L2 · quadrats", "Prairie : %D fleurs/m² (4 quadrats au hasard) contre 12 en 2023 : deux fois moins."],
	["L3 · génétique", "Semis : %W bourraches blanches sur 32, environ 1/4. Parents Bb × Bb. Blanches 3 fois moins visitées."],
	["fausse piste", "La « guêpe » de la lavande est un syrphe : un pollinisateur, pas un suspect."]
];
const PAGES = [["p1", "🟠 p.1 Frelon"], ["p2", "💨 p.2 Insecticide"], ["p3", "🌼 p.3 Quadrats"], ["p4", "🤍 p.4 Semis"], ["p5", "🪰 p.5 Syrphe"]];
const HYPS = [
	["h1", "Un prédateur chasse les abeilles devant les ruches", ["p1"]],
	["h2", "Un produit chimique tue ou affaiblit les insectes", ["p2"]],
	["h3", "Les pollinisateurs trouvent moins de fleurs à butiner", ["p3"]],
	["h4", "Une partie des fleurs attire moins les pollinisateurs", ["p4"]],
	["h5", "Les insectes rayés de la lavande sont des guêpes dangereuses", null, "La page 5 prouve le contraire : c'est un syrphe, un pollinisateur."],
	["h6", "Les ondes de l'antenne-relais font fuir les abeilles", null, "Aucune mesure ne la soutient : une rumeur ne devient pas une cause sans preuve."]
];
const ACTIONS = [
	["a1", "Faire détruire le nid de frelons asiatiques par un professionnel, et poser des grilles d'entrée sur les ruches", "p1"],
	["a2", "Expliquer au voisin la loi Labbé, et lui proposer des coccinelles contre les pucerons (lutte biologique)", "p2"],
	["a3", "Semer des fleurs sauvages locales dans la prairie, et la faucher plus tard", "p3"],
	["a4", "Ressemer avec des graines de bourrache bleue de lignée pure (BB)", "p4"],
	["a5", "Poser des pièges sucrés contre tous les insectes rayés du jardin", null, "Ces pièges tueraient aussi les syrphes, les frelons européens et les abeilles (page 5)."],
	["a6", "Déplacer les ruches loin de l'antenne-relais", null, "Aucun indice ne relie l'antenne aux abeilles : c'est une action sans preuve."]
];

const CSS = `
.jd{position:fixed;inset:0;z-index:40;background:#a9c98f;font-family:Nunito,system-ui,sans-serif;color:#22301f;overflow:hidden;animation:jdIn .35s ease both}
@keyframes jdIn{from{opacity:0}to{opacity:1}}
.jd canvas.jd-3d{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.jd-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:3;pointer-events:none}
.jd-top>*{pointer-events:auto}
.jd-chip{background:rgba(250,252,244,.95);border:0;border-radius:999px;padding:7px 12px;font:800 13px Nunito,sans-serif;color:#22301f;box-shadow:0 6px 18px rgba(20,40,10,.22);display:flex;gap:6px;align-items:center}
button.jd-chip{cursor:pointer}
.jd-stage{background:#2f6b45;color:#fff}
.jd-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(250,252,244,.95);font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(20,40,10,.22)}
.jd-coach{position:absolute;left:50%;top:62px;transform:translateX(-50%);z-index:4;background:#fbfdf5;border-radius:16px;padding:10px 15px;font-weight:700;font-size:14px;box-shadow:0 10px 30px rgba(20,40,10,.3);width:max-content;max-width:min(520px,calc(100% - 24px));box-sizing:border-box;border-left:5px solid #7fb069}
.jd-coach[hidden],.jd-bar[hidden],.jd-hint[hidden],.jd-panel[hidden],.jd-peek[hidden]{display:none}
.jd-bar{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:4;display:flex;gap:10px;align-items:center;background:#fbf6e6;border:2px solid #d9c58f;border-radius:18px;padding:9px 10px 9px 15px;box-shadow:0 10px 30px rgba(20,40,10,.3);width:max-content;max-width:calc(100% - 24px);box-sizing:border-box;font-weight:800;font-size:14.5px}
.jd-bar button{border:0;border-radius:12px;padding:10px 14px;background:#2f6b45;color:#fff;font:800 14px Nunito,sans-serif;cursor:pointer;white-space:nowrap}
.jd-bar button[hidden]{display:none}
.jd-hint{position:absolute;right:12px;bottom:84px;z-index:4;border:0;border-radius:999px;padding:10px 14px;background:#fff7d6;font:800 14px Nunito,sans-serif;box-shadow:0 8px 20px rgba(20,40,10,.3);cursor:pointer}
.jd-panel{position:absolute;inset:0;z-index:5;display:grid;place-items:start center;padding:12px;background:rgba(20,40,20,.3);overflow:auto}
.jd-panel.side{background:transparent;place-items:end end;pointer-events:none}
.jd-panel.side .jd-card{pointer-events:auto;max-width:400px;max-height:calc(100% - 70px);overflow:auto;margin:0}
.jd-card{width:100%;max-width:480px;margin:auto 0;box-sizing:border-box;background:#fbfdf5;border-radius:22px;box-shadow:0 30px 80px rgba(10,30,10,.4);padding:18px 18px 16px;animation:jdUp .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes jdUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.jd-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2f6b45}
.jd-h{font:700 22px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px}
.jd-p{margin:0 0 10px;color:#4d5a48;font-size:14.5px;line-height:1.4}
.jd-letter{background:#fffdf3;border:1px solid #e3d9b8;border-radius:12px;padding:12px 14px;font:italic 15px/1.45 Georgia,serif;color:#3a3324;margin:6px 0 10px;box-shadow:inset 0 0 0 3px #fbf5e1}
.jd-go{display:block;width:100%;border:0;border-radius:16px;padding:13px;background:#2f6b45;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:10px;box-shadow:0 8px 20px rgba(47,107,69,.35);text-align:center;text-decoration:none}
.jd-go:disabled{opacity:.4;cursor:default;box-shadow:none}
.jd-alt{display:block;width:100%;border:2px solid #d5e3c6;border-radius:16px;padding:11px;background:#fff;color:#1e305e;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.jd-msg{min-height:20px;font-size:13.5px;font-weight:700;color:#4d5a48;margin:4px 0 6px;line-height:1.35}
.jd-msg.ko{color:#b91c1c}.jd-msg.ok{color:#2f6b45}
.jd-lens{width:100%;height:auto;display:block;background:#eef3e4;border:1px solid #d5e3c6;border-radius:16px;margin:4px 0 6px;touch-action:none;cursor:none}
.jd-look{display:flex;gap:8px;align-items:center;background:#eef5e6;border-radius:12px;padding:7px 10px;font-weight:800;font-size:13.5px;color:#2f6b45;margin-bottom:6px}
.jd-look.done{background:#e2f2e5}
.jd-leads{display:grid;gap:7px}
.jd-lead{border:2px solid #d5e3c6;background:#fff;border-radius:14px;padding:10px 12px;font:800 14.5px Nunito,sans-serif;cursor:pointer;text-align:left;color:#22301f}
.jd-lead:disabled{opacity:.45;cursor:default}
.jd-lead.ko{border-color:#c4532f;background:#fdeceb}
.jd-path{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 6px}
.jd-path span{background:#eef5e6;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:800;color:#2f6b45}
.jd-tax{background:#fff;border:2px solid #7fb069;border-radius:16px;padding:11px 14px;margin:6px 0}
.jd-tax b{display:block;font:700 18px Fraunces,Georgia,serif}
.jd-tax i{color:#4d5a48}
.jd-tax small{display:block;color:#2f6b45;font-weight:800;margin:2px 0 6px}
.jd-tax span{font-size:14px;color:#4d5a48}
.jd-course{background:#fff;border:2px solid #d9a441;border-radius:16px;padding:11px 14px;margin:10px 0 4px}
.jd-course .tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.jd-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.jd-course span{font-size:14px;color:#4d5a48}
.jd-note{background:#f6f0dc;border-left:4px solid #b5563d;border-radius:8px;padding:9px 12px;font:italic 14.5px/1.4 Georgia,serif;color:#3a3324;margin:6px 0}
.jd-web{position:relative;width:100%;aspect-ratio:1/1.04;background:#f4f8ee;border:1px solid #d5e3c6;border-radius:16px;margin:4px 0 6px}
.jd-web svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.jd-node{position:absolute;transform:translate(-50%,-50%);border:2px solid #d5e3c6;background:#fff;border-radius:14px;padding:4px 6px 5px;font:800 11.5px/1.15 Nunito,sans-serif;cursor:ns-resize;text-align:center;color:#22301f;width:92px;touch-action:none;user-select:none;-webkit-user-select:none}
.jd-node i{display:block;font-style:normal;font-size:20px;line-height:1.1}
.jd-node em{display:block;font-style:normal;font-size:19px;line-height:1;margin-top:3px;color:#8a937f}
.jd-node.up em{color:#b5563d}.jd-node.down em{color:#3b6fb5}
.jd-node.ok{border-color:#3d7a55;background:#eef8f0}.jd-node.ko{border-color:#c4532f;background:#fdeceb}
.jd-node.fixed{cursor:default}
.jd-spray{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fdeceb;border:2px dashed #c4532f;border-radius:12px;padding:4px 8px;font:800 12px Nunito,sans-serif;color:#9c2b1a}
.jd-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 10px}
.jd-tbl td,.jd-tbl th{padding:6px 5px;border-bottom:1px solid #d5e3c6;text-align:center}
.jd-tbl td:first-child{text-align:left}
.jd-tbl th{font-size:12.5px;background:#eef5e6}
.jd-tbl .ok{color:#2f6b45;font-weight:800}.jd-tbl .ko{color:#b91c1c;font-weight:800}
.jd-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
.jd-pad button{border:0;border-radius:12px;height:44px;background:#eef5e6;font:800 19px Nunito,sans-serif;color:#22301f;cursor:pointer;box-shadow:0 3px 0 #c9dab7}
.jd-pad button:active{transform:translateY(2px);box-shadow:none}
.jd-pad button.okk{background:#2f6b45;color:#fff;box-shadow:0 3px 0 #1f4a30}
.jd-disp{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px}
.jd-disp output{flex:1;min-height:42px;border:2px solid #b9cfa4;border-radius:12px;background:#fff;font:800 24px Nunito,sans-serif;text-align:right;padding:4px 12px;color:#1e305e}
.jd-par{display:flex;gap:10px;justify-content:center;margin:4px 0 8px}
.jd-parent{flex:1;max-width:170px;background:#fff;border:2px solid #d5e3c6;border-radius:16px;padding:8px;text-align:center;font-weight:800;font-size:13px}
.jd-parent i{display:block;font-style:normal;font-size:30px}
.jd-al{display:flex;gap:6px;justify-content:center;margin-top:6px}
.jd-al button{width:46px;height:46px;border-radius:12px;border:2px solid #b9cfa4;background:#f4f8ee;font:800 22px Georgia,serif;cursor:pointer;color:#1e305e}
.jd-pun{width:100%;border-collapse:collapse;margin:4px 0 8px;table-layout:fixed}
.jd-pun td,.jd-pun th{border:2px solid #d5e3c6;height:40px;text-align:center;font:800 17px Georgia,serif}
.jd-pun th{background:#eef5e6;color:#2f6b45}
.jd-pun td.w{background:#f2f2ee;color:#6b6b6b}.jd-pun td.b{background:#e3ebfb;color:#2b4a9c}
.jd-pages{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}
.jd-pages button{border:2px solid #d9c58f;background:#f6f0dc;border-radius:10px;padding:6px 9px;font:800 12.5px Nunito,sans-serif;color:#3a3324;cursor:pointer}
.jd-pages button[aria-pressed=true]{border-color:#2f6b45;background:#2f6b45;color:#fff;transform:translateY(-2px);box-shadow:0 4px 10px rgba(20,40,10,.25)}
.jd-pages button.fp{border-style:dashed}
.jd-rows{display:grid;gap:6px;margin-bottom:6px}
.jd-row{display:flex;gap:8px;align-items:center;border:2px solid #d5e3c6;background:#fff;border-radius:12px;padding:8px 10px;cursor:pointer;text-align:left;font:700 13.5px/1.3 Nunito,sans-serif;color:#22301f;width:100%}
.jd-row span{flex:1;min-width:0}
.jd-row b{flex:none;min-width:58px;text-align:center;border-radius:8px;padding:4px 6px;font-size:12px;background:#f1f1ec;color:#8a937f}
.jd-row.jd-pin b{background:#2f6b45;color:#fff}
.jd-row.jd-out b{background:#fdeceb;color:#9c2b1a}
.jd-row.ok{border-color:#3d7a55}.jd-row.ko{border-color:#c4532f;background:#fff6f4}
.jd-row small{display:block;font-weight:700;color:#9c2b1a;margin-top:3px}
.jd-row.ok small{color:#2f6b45}
.jd-big{font-size:44px;text-align:center}
.jd-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.jd-list li{background:#fff;border:1px solid #d5e3c6;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
.jd-list li span{color:#2f6b45;font-weight:800;margin-right:6px}
.jd-peek{position:absolute;inset:0;z-index:6;background:rgba(20,30,20,.55);display:grid;place-items:center;padding:14px}
.jd-peek div{width:100%;max-width:760px;background:#fbfdf5;border-radius:18px;padding:12px;box-shadow:0 30px 80px rgba(0,0,0,.4)}
.jd-peek img{width:100%;height:auto;display:block;border-radius:10px}
@media (max-width:560px){ .jd-web{aspect-ratio:1/1.22} .jd-chip{font-size:12px;padding:6px 9px} .jd-h{font-size:20px} .jd-node{width:80px;font-size:10.5px} .jd-node i{font-size:17px}
	.jd-panel.side{place-items:end center} .jd-panel.side .jd-card{max-height:52%} .jd-coach{top:58px;font-size:13px} }
`;

export function openJardin({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("jd-css")){ const st = document.createElement("style"); st.id = "jd-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	let rnd = mulberry32(Date.now() % 100000);
	const root = document.createElement("div"); root.className = "jd"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le jardin se tait");
	root.innerHTML = `<canvas class="jd-3d"></canvas>
		<div class="jd-top">
			<span class="jd-chip jd-stage" id="jdStage">Le jardin se tait</span>
			<button class="jd-chip" id="jdBook" aria-label="Ouvrir le carnet de terrain">📓 Carnet · <b>0/4</b></button>
			<button class="jd-x" aria-label="Quitter le jeu">×</button>
		</div>
		<div class="jd-coach" hidden></div>
		<div class="jd-bar" hidden><span></span><button hidden></button></div>
		<button class="jd-hint" hidden>💡 Indice</button>
		<div class="jd-panel" hidden><div class="jd-card"></div></div>
		<div class="jd-peek" hidden><div><img alt="Le carnet de terrain : pistes et indices"><button class="jd-alt" data-peek>Refermer le carnet</button></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const card = $(".jd-card"), panel = $(".jd-panel"), coach = $(".jd-coach"), hintBtn = $(".jd-hint"), bar = $(".jd-bar"), peek = $(".jd-peek");

	/* ---------- scène 3D : le jardin botanique ---------- */
	const canvas = $("canvas.jd-3d");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, stencil:true });   // 24 bits de profondeur sur iPhone
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#c6dfee"); scene.fog = new THREE.Fog("#c6dfee", 32, 64);
	const camera = new THREE.PerspectiveCamera(45, 1, .1, 120);
	const controls = new OrbitControls(camera, canvas);
	Object.assign(controls, { enablePan:false, enableDamping:true, dampingFactor:.08, minDistance:1.2, maxDistance:30, minPolarAngle:.15, maxPolarAngle:1.25, rotateSpeed:.7 });
	scene.add(new THREE.HemisphereLight("#fdf6e0", "#6b8a4e", 1.25));
	const sun = new THREE.DirectionalLight("#ffe9c4", 2.1); sun.position.set(-9, 13, 10); sun.castShadow = true;   // soleil bas de fin septembre
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-16, right:16, top:12, bottom:-12, near:1, far:50 });
	sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun);

	const grassTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
		x.fillStyle = "#8db462"; x.fillRect(0,0,128,128);
		for(let i=0;i<900;i++){ x.fillStyle = `rgba(${rnd() < .5 ? "70,110,40" : "180,200,120"},${.15 + rnd()*.2})`; x.fillRect(rnd()*128, rnd()*128, 2, 3); }
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 44).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:grassTex, roughness:1 }));
	ground.receiveShadow = true; scene.add(ground);
	const gravel = std("#e3d3b0"), wood = std("#8a5a3c"), leaf = std("#4f8a3c"), leafDark = std("#3b6e2f"), trunk = std("#6b4a33"), soil = std("#6b4a33"), stone = std("#b9b4a8");
	box(scene, 19.6, .04, 1.6, gravel, -1.2, 0, 0, 0, false); box(scene, 1.6, .04, 16, gravel, 0, 0, 0, 0, false);      // l'allée s'arrête à la prairie
	box(scene, 22, 1.6, 1, leafDark, 0, 0, -7.5);                        // haie du fond
	box(scene, 24, 2.4, .4, std("#b5563d"), 0, 0, -8.6);                // mur de briques, côté voisin
	box(scene, 24, .12, .55, std("#9a4632"), 0, 2.4, -8.6, 0, false);
	const tree = (x, z, s=1, fruit) => { cyl(scene, .25*s, .35*s, 2.2*s, trunk, x, 0, z, 7); const c = mesh(new THREE.IcosahedronGeometry(1.7*s, 0), leaf, scene, x, 3*s, z); c.scale.y = .85; mesh(new THREE.IcosahedronGeometry(1.2*s, 0), leafDark, scene, x + .7*s, 3.6*s, z - .3*s);
		if(fruit) for(let i=0;i<4;i++){ const a = i*1.9; mesh(new THREE.SphereGeometry(.12, 8, 6), std("#c8452f", { flatShading:false }), scene, x + Math.cos(a)*1.3*s, 2.4*s + (i%2)*.4, z + Math.sin(a)*1.3*s); } };
	tree(-8.5, -4.5, 1.1, true); tree(8.6, 4.8, 1); tree(-9, 5.2, .9, true); tree(5, -5.5, 1.15);
	// massifs de fleurs (instanciés)
	const flowerGeo = new THREE.IcosahedronGeometry(.13, 0), stemGeo = new THREE.CylinderGeometry(.02, .02, .4, 4).translate(0, .2, 0);
	function bed(cx, cz, w, d, colors, n){
		box(scene, w, .18, d, soil, cx, 0, cz, 0, false);
		const fl = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ roughness:.8, flatShading:true }), n);
		const st = new THREE.InstancedMesh(stemGeo, leaf, n);
		const o = new THREE.Object3D(), col = new THREE.Color();
		for(let i=0;i<n;i++){
			const x = cx + (rnd() - .5)*(w - .3), z = cz + (rnd() - .5)*(d - .3), h = .15 + rnd()*.25;
			o.position.set(x, .18, z); o.scale.set(1, 1 + h*2, 1); o.updateMatrix(); st.setMatrixAt(i, o.matrix);
			o.position.set(x, .58 + h*.8, z); o.scale.setScalar(.8 + rnd()*.6); o.updateMatrix(); fl.setMatrixAt(i, o.matrix);
			fl.setColorAt(i, col.set(colors[Math.floor(rnd()*colors.length)]));
		}
		fl.castShadow = true; scene.add(fl, st);
	}
	bed(-5, -2.6, 5, 2.4, ["#f2c14e", "#e07a5f", "#f4f1de", "#e9a6c4"], 70);
	bed(5.4, 2.8, 4.4, 2.2, ["#8e7cc3", "#a78bd8", "#7b68b6"], 80);           // lavande
	// rosier, avec ses pucerons et ses coccinelles
	const ROSE = new THREE.Vector3(-2.4, .8, -2.2);
	const rose = mesh(new THREE.IcosahedronGeometry(.9, 1), leaf, scene, ROSE.x, ROSE.y, ROSE.z); rose.scale.set(1.1, .9, 1);
	for(let i=0;i<9;i++){ const a = i*2.3; mesh(new THREE.IcosahedronGeometry(.16, 0), std("#d62839"), scene, ROSE.x + Math.cos(a)*.75, ROSE.y + Math.sin(i)*.35 + .3, ROSE.z + Math.sin(a)*.65); }
	const aphids = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 5, 4), std("#8fd14f"), 220);
	{ const o = new THREE.Object3D(); for(let i=0;i<220;i++){ const a = rnd()*Math.PI*2, e = rnd()*1.3; o.position.set(ROSE.x + Math.cos(a)*Math.sin(e)*1.0, ROSE.y + Math.cos(e)*.82, ROSE.z + Math.sin(a)*Math.sin(e)*.9); o.updateMatrix(); aphids.setMatrixAt(i, o.matrix); } }
	aphids.count = 24; scene.add(aphids);
	const ladybirds = new THREE.Group(); scene.add(ladybirds);
	for(let i=0;i<7;i++){ const a = .3 + i*.85, b = mesh(new THREE.SphereGeometry(.07, 10, 6, 0, Math.PI*2, 0, Math.PI/2), std("#d62828", { flatShading:false }), ladybirds, ROSE.x + Math.cos(a)*1.0, ROSE.y + .25 + (i%3)*.15, ROSE.z + Math.sin(a)*.9); b.lookAt(ROSE.x, ROSE.y - 2, ROSE.z); b.rotateX(-Math.PI/2); }
	// la mare et le compost
	const pond = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24).rotateX(-Math.PI/2), std("#5fa8c8", { roughness:.2, flatShading:false })); pond.position.set(6, .03, -2.2); scene.add(pond);
	for(let i=0;i<10;i++){ const a = i/10*Math.PI*2; mesh(new THREE.DodecahedronGeometry(.28, 0), stone, scene, 6 + Math.cos(a)*1.9, .1, -2.2 + Math.sin(a)*1.9); }
	box(scene, 1.8, .7, 1.4, std("#7a5a3a"), -7.6, 0, 1.2); box(scene, 1.6, .55, 1.2, std("#5a3f2a"), -7.6, .2, 1.2, 0, false);
	box(scene, 2, .1, .6, wood, 2.6, .5, -5.6); box(scene, .12, .5, .5, wood, 1.8, 0, -5.6); box(scene, .12, .5, .5, wood, 3.4, 0, -5.6);
	// l'insecticide du voisin : un nuage qui passe par-dessus le mur
	const mist = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color:"#f4f1ea", size:.55, transparent:true, opacity:0, depthWrite:false }));
	{ const p = []; for(let i=0;i<70;i++) p.push(-6 + rnd()*7, 2.2 + rnd()*1.6, -9.4 + rnd()*2.4); mist.geometry.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); }
	scene.add(mist);
	// le pulvérisateur du voisin, qui dépasse du mur
	const sprayer = new THREE.Group(); scene.add(sprayer); sprayer.position.set(-3.4, 2.5, -9);
	cyl(sprayer, .02, .02, .9, std("#3a3a3a"), 0, 0, 0, 5).rotation.x = .9; mesh(new THREE.SphereGeometry(.05, 6, 4), std("#c4532f"), sprayer, 0, .55, .45);

	/* ---------- le rucher et les trois suspects ---------- */
	const HIVE = new THREE.Vector3(7.3, 0, 6.3);
	const hiveWood = std("#e8d8b0"), hiveRoof = std("#6f7a80");
	for(const dx of [-.75, .75]){
		const hx = HIVE.x + dx;
		box(scene, .7, .35, .6, std("#7a5a3a"), hx, 0, HIVE.z);
		box(scene, .62, .34, .55, hiveWood, hx, .35, HIVE.z); box(scene, .62, .3, .55, hiveWood, hx, .7, HIVE.z);
		box(scene, .72, .07, .65, hiveRoof, hx, 1.0, HIVE.z);
		box(scene, .3, .03, .02, std("#2a2a2a"), hx, .4, HIVE.z + .28, 0, false);       // trou de vol
		box(scene, .4, .02, .12, hiveWood, hx, .37, HIVE.z + .33, 0, false);            // planche d'envol
	}
	for(let i=0;i<14;i++){ const b = mesh(new THREE.SphereGeometry(.035, 6, 4), std(i % 2 ? "#7a5a1a" : "#3a2a12"), scene, HIVE.x - 1.2 + rnd()*2.4, .03, HIVE.z + .5 + rnd()*.9, rnd()*3, false); b.scale.set(1, .6, 1.8); }   // abeilles mortes
	const SPH = new THREE.SphereGeometry(1, 12, 8), WING = new THREE.CircleGeometry(1, 12);
	function insect3d(kind){
		const c = { velutina:{ th:"#1c1a18", ab:"#2a221c", band:"#e8902a", head:"#e89a2c", wing:"#8a6a40", leg:"#f2c230" },
			crabro:{ th:"#8a3a1e", ab:"#f2c230", band:"#7a3518", head:"#e0b030", wing:"#c8a060", leg:"#8a3a1e" },
			syrphe:{ th:"#3a3a24", ab:"#e8902a", band:"#1f1f1f", head:"#a33a1e", wing:"#e6f4ff", leg:"#d9a441" } }[kind];
		const g = new THREE.Group();
		mesh(SPH, std(c.ab, { flatShading:false }), g, 0, 0, -.17).scale.set(.085, .075, .16);
		const band = mesh(SPH, std(c.band, { flatShading:false }), g, 0, 0, kind === "crabro" ? -.06 : -.23); band.scale.set(.088, .078, .045);
		if(kind === "syrphe") mesh(SPH, std(c.band, { flatShading:false }), g, 0, 0, -.15).scale.set(.088, .078, .03);
		mesh(SPH, std(c.th, { flatShading:false }), g, 0, 0, 0).scale.setScalar(.075);
		mesh(SPH, std(c.head, { flatShading:false }), g, 0, 0, .1).scale.set(.07, .06, .05);
		const wm = std(c.wing, { transparent:true, opacity:.45, side:THREE.DoubleSide, flatShading:false });
		for(const s of [-1, 1]){ const w = mesh(WING, wm, g, s*.12, .06, -.06, 0, false); w.rotation.set(-Math.PI/2, 0, s*.35); w.scale.set(.16, .05, 1); }
		const lm = new THREE.LineBasicMaterial({ color:c.leg });
		for(const s of [-1, 1]) for(let j=0;j<3;j++) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(s*.05, -.03, .03 - j*.05), new THREE.Vector3(s*.14, -.08, .05 - j*.08), new THREE.Vector3(s*.17, -.16, .06 - j*.1)]), lm));
		g.scale.setScalar(kind === "syrphe" ? 1.7 : 2);
		return g;
	}
	const SPEC = {
		velutina:{ pos:new THREE.Vector3(HIVE.x - .4, .75, HIVE.z + 1.1), where:"en vol stationnaire devant les ruches" },
		syrphe:  { pos:new THREE.Vector3(4.6, 1.15, 2.9), where:"au-dessus de la lavande" },
		crabro:  { pos:new THREE.Vector3(8.35, 1.5, 5.15), where:"sur le tronc de l'arbre, près des ruches" }
	};
	const hits = [];
	for(const [id, s] of Object.entries(SPEC)){
		const g = insect3d(id); g.position.copy(s.pos); scene.add(g); s.g = g;
		if(id === "velutina") g.lookAt(HIVE.x - .4, .75, HIVE.z);
		if(id === "crabro"){ g.rotation.set(-Math.PI/2 + .2, 0, .3); }
		const hit = new THREE.Mesh(new THREE.SphereGeometry(.6, 8, 6), new THREE.MeshBasicMaterial({ visible:false })); hit.position.copy(s.pos); hit.userData.id = id; scene.add(hit); hits.push(hit);
		const tag = mesh(new THREE.ConeGeometry(.09, .22, 4), std("#2f6b45", { emissive:"#2f6b45", emissiveIntensity:.3 }), scene, s.pos.x, s.pos.y + .5, s.pos.z, 0, false); tag.rotation.x = Math.PI; tag.visible = false; s.tag = tag;
	}
	// abeilles qui butinent encore la lavande
	const bees = []; for(let i=0;i<7;i++){ const b = new THREE.Group(); mesh(SPH, std("#e2b23a", { flatShading:false }), b).scale.set(.06, .055, .1); mesh(SPH, std("#2a2a2a", { flatShading:false }), b, 0, 0, -.04).scale.set(.062, .057, .025); scene.add(b); bees.push(b); }
	let beeN = 5;

	/* ---------- la prairie : quadrats ---------- */
	const MEAD = { x0:8.5, z0:-2.5, nx:5, nz:4 };
	box(scene, 5.2, .02, 4.2, std("#7fae58"), MEAD.x0 + 2.5, 0, MEAD.z0 + 2, 0, false);
	{ const fence = std("#c9a77a"), cx = MEAD.x0 + 2.5, cz = MEAD.z0 + 2;
		for(const [w, d, x, z] of [[5.2, .06, 0, -2.05], [5.2, .06, 0, 2.05], [.06, 4.1, -2.6, 0], [.06, 4.1, 2.6, 0]]) box(scene, w, .08, d, fence, cx + x, .45, cz + z, 0, false);
		for(const x of [-2.6, 0, 2.6]) for(const z of [-2.05, 2.05]) box(scene, .1, .55, .1, fence, cx + x, 0, cz + z); }
	const PETAL = new THREE.CylinderGeometry(.065, .065, .015, 10), HEART = new THREE.SphereGeometry(.025, 6, 4);
	let cells = [], petals = null, hearts = null, quads = [], qCur = -1;
	const quadMat = std("#e9b22c");
	function buildMeadow(){
		if(petals){ scene.remove(petals, hearts); petals.dispose(); hearts.dispose(); }
		quads.forEach(q => scene.remove(q.g)); quads = []; qCur = -1;
		const combo = [[5, 7, 4, 8], [6, 6, 5, 7], [7, 4, 6, 7], [8, 5, 6, 5], [4, 7, 8, 5]][Math.floor(rnd()*5)];
		const ids = [...Array(MEAD.nx*MEAD.nz).keys()].sort(() => rnd() - .5), land = ids.slice(0, 4);
		cells = [];
		for(let k=0;k<MEAD.nx*MEAD.nz;k++){
			const ci = k % MEAD.nx, cj = Math.floor(k/MEAD.nx), at = land.indexOf(k);
			const n = at >= 0 ? combo[at] : 3 + Math.floor(rnd()*7), fl = [];
			let guard = 0;      // fleurs loin des bords : aucune à cheval sur le cadre
			while(fl.length < n && guard++ < 400){ const x = MEAD.x0 + ci + .18 + rnd()*.64, z = MEAD.z0 + cj + .18 + rnd()*.64; if(fl.every(f => Math.hypot(f.x - x, f.z - z) > .16)) fl.push({ x, z, done:false }); }
			cells.push({ ci, cj, cx:MEAD.x0 + ci + .5, cz:MEAD.z0 + cj + .5, fl, land:at });
		}
		const all = cells.flatMap(c => c.fl);
		petals = new THREE.InstancedMesh(PETAL, std("#ffffff"), all.length); hearts = new THREE.InstancedMesh(HEART, std("#f2c14e"), all.length);
		const o = new THREE.Object3D(), col = new THREE.Color("#fbfbf2");
		all.forEach((f, i) => { f.i = i; o.position.set(f.x, .07, f.z); o.rotation.set(0, 0, 0); o.updateMatrix(); petals.setMatrixAt(i, o.matrix); petals.setColorAt(i, col); o.position.y = .085; o.updateMatrix(); hearts.setMatrixAt(i, o.matrix); });
		scene.add(petals, hearts);
	}
	function quadFrame(){
		const g = new THREE.Group();
		for(const [w, d, x, z] of [[1.04, .04, 0, -.5], [1.04, .04, 0, .5], [.04, 1.04, -.5, 0], [.04, 1.04, .5, 0]]) box(g, w, .035, d, quadMat, x, 0, z);
		scene.add(g); return g;
	}

	/* ---------- le semis de bourrache (génétique) ---------- */
	const SEMIS = { x:-4.6, z:3.2 };
	box(scene, 4, .18, 2, soil, SEMIS.x, 0, SEMIS.z, 0, false);
	box(scene, .08, .7, .08, wood, SEMIS.x + 2.15, 0, SEMIS.z + 1.05); box(scene, .7, .38, .05, std("#f4efe0"), SEMIS.x + 2.15, .55, SEMIS.z + 1.08, 0, false);
	let plants = [], leaves = null, blooms = null, marks = [];
	function buildSemis(){
		if(leaves){ scene.remove(leaves, blooms); leaves.dispose(); blooms.dispose(); }
		marks.forEach(m => scene.remove(m)); marks = [];
		const white = new Set([...Array(32).keys()].sort(() => rnd() - .5).slice(0, 9));
		plants = [];
		for(let k=0;k<32;k++){ const c = k % 8, r = Math.floor(k/8); plants.push({ x:SEMIS.x - 1.575 + c*.45 + (rnd() - .5)*.08, z:SEMIS.z - .675 + r*.45 + (rnd() - .5)*.08, white:white.has(k), done:false }); }
		leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.14, 0), std("#5b8f45"), 32);
		blooms = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.062, 0), std("#ffffff"), 32*5);
		const o = new THREE.Object3D(), blue = new THREE.Color("#3f6fe0"), wh = new THREE.Color("#f8f8f2");
		plants.forEach((p, k) => {
			o.position.set(p.x, .28, p.z); o.scale.set(1, 1.1, 1); o.rotation.set(0, rnd()*3, 0); o.updateMatrix(); leaves.setMatrixAt(k, o.matrix);
			for(let j=0;j<5;j++){ const a = j*1.26 + rnd(), r = j ? .075 : 0; o.position.set(p.x + Math.cos(a)*r, .5 + (j ? rnd()*.06 : .08), p.z + Math.sin(a)*r); o.scale.set(1, .45, 1); o.updateMatrix(); blooms.setMatrixAt(k*5 + j, o.matrix); blooms.setColorAt(k*5 + j, p.white ? wh : blue); }
		});
		leaves.castShadow = true; scene.add(leaves, blooms);
	}

	/* ---------- la table de terrain et le carnet ---------- */
	const DESK = new THREE.Vector3(1.75, 0, 3.7);
	box(scene, 1.5, .05, .95, std("#c9a77a"), DESK.x, .72, DESK.z);
	for(const [dx, dz] of [[-.68, -.4], [.68, -.4], [-.68, .4], [.68, .4]]) box(scene, .05, .72, .05, std("#6b6b6b"), DESK.x + dx, 0, DESK.z + dz);
	box(scene, 1.0, .025, .68, std("#2f5a3c"), DESK.x, .77, DESK.z, 0, false);               // couverture du carnet
	const carnetCv = document.createElement("canvas"); carnetCv.width = 1024; carnetCv.height = 700;
	const carnetTex = new THREE.CanvasTexture(carnetCv); carnetTex.colorSpace = THREE.SRGBColorSpace; carnetTex.anisotropy = 8;
	const pages = new THREE.Mesh(new THREE.PlaneGeometry(.96, .656).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:carnetTex, roughness:.9 }));
	pages.position.set(DESK.x, .797, DESK.z); scene.add(pages);
	{ const lo = new THREE.Group(); lo.position.set(DESK.x + .58, .8, DESK.z + .2); scene.add(lo);      // la loupe et le crayon
		const ring = mesh(new THREE.TorusGeometry(.09, .014, 8, 24), std("#b08a3a", { metalness:.6, roughness:.4, flatShading:false }), lo); ring.rotation.x = Math.PI/2;
		mesh(new THREE.CircleGeometry(.085, 20).rotateX(-Math.PI/2), std("#dff2ff", { transparent:true, opacity:.4 }), lo, 0, .002, 0, 0, false);
		const h = mesh(new THREE.CylinderGeometry(.016, .02, .2, 8), std("#3a2414"), lo, .15, 0, .1); h.rotation.set(Math.PI/2, 0, -1); h.rotation.order = "YXZ";
		const pen = mesh(new THREE.CylinderGeometry(.008, .008, .2, 6), std("#e0b030"), scene, DESK.x - .58, .79, DESK.z + .1); pen.rotation.set(Math.PI/2, 0, .4); }
	// une caisse et un filet à papillons appuyés contre la table
	box(scene, .5, .35, .4, std("#a87c4f"), DESK.x - 1.05, 0, DESK.z + .1);
	{ const net = cyl(scene, .015, .015, 1.4, std("#8a5a3c"), DESK.x + .95, 0, DESK.z - .35, 5); net.rotation.z = -.25;
		const hoop = mesh(new THREE.TorusGeometry(.18, .012, 6, 18), std("#cccccc"), scene, DESK.x + 1.32, 1.42, DESK.z - .35); hoop.rotation.y = Math.PI/2; }

	// étincelle d'indice
	const spark = mesh(new THREE.OctahedronGeometry(.16), std("#fff3a0", { emissive:"#ffd84a", emissiveIntensity:1 }), scene, 0, -5, 0, 0, false);

	/* ---------- état ---------- */
	const fresh = () => ({ errors:0, ids:new Set(), clue:0, pistes:{ guepes:"?", voisin:"?", prairie:"?", semis:"?", antenne:"?" }, counts:[], dens:null, whites:0, report:null, actions:[], learned:new Set(), t0:performance.now() });
	const S = fresh();
	let stage = "intro", raf = 0, last = 0, closed = false, hintT = 0, fly = null, toss = null, mistT = -1, shownW = 0, shownH = 0;
	const timers = new Set();
	const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if(!closed) fn(); }, ms/SPEED); timers.add(id); return id; };

	function layout(){
		const w = innerWidth || 800, h = innerHeight || 600; shownW = innerWidth; shownH = innerHeight;
		renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = w < h ? 60 : 45; camera.updateProjectionMatrix();
	}
	addEventListener("resize", layout); layout();
	const portrait = () => innerWidth < innerHeight;
	const VIEWS = {
		jardin: () => portrait() ? [[1.5, 19, 25], [1.5, 0, 0]] : [[1, 13, 16], [1, 0, 0]],
		rucher: () => portrait() ? [[5.4, 5.2, 13.4], [6.4, .8, 4.2]] : [[4.6, 3.8, 11.2], [6.6, .8, 4.3]],
		voisin: () => portrait() ? [[1.2, 7.5, 6.5], [-2.6, 1, -4.6]] : [[1.5, 5.2, 4.6], [-2.8, 1.2, -4.8]],
		prairie:() => portrait() ? [[12.4, 9, 6.4], [11, 0, -.5]] : [[13.2, 5.6, 4.6], [11, 0, -.4]],
		quad:   () => { const c = cells[qCur] || cells[0]; return portrait() ? [[c.cx, 2.9, c.cz + .55], [c.cx, 0, c.cz]] : [[c.cx, 2.0, c.cz + .8], [c.cx, 0, c.cz]]; },
		semis:  () => portrait() ? [[SEMIS.x, 5.2, SEMIS.z + 4.4], [SEMIS.x, .2, SEMIS.z]] : [[SEMIS.x, 3.4, SEMIS.z + 3.4], [SEMIS.x, .2, SEMIS.z]],
		carnet: () => portrait() ? [[DESK.x, 2.45, DESK.z + .5], [DESK.x, .78, DESK.z - .28]] : [[DESK.x + .62, 1.9, DESK.z + .82], [DESK.x + .5, .78, DESK.z - .02]]
	};
	function flyTo(v, dur=1.3){ const [p, t] = VIEWS[v](); fly = { p0:camera.position.clone(), t0:controls.target.clone(), p:new THREE.Vector3(...p), t:new THREE.Vector3(...t), k:0, dur:dur/SPEED, v }; }
	{ const [p, t] = VIEWS.jardin(); camera.position.set(p[0] + 6, p[1] + 6, p[2] + 6); controls.target.set(...t); }

	/* ---------- interface ---------- */
	function show(html, side){ card.innerHTML = html; panel.hidden = false; panel.classList.toggle("side", !!side); panel.scrollTop = 0; card.scrollTop = 0; setBar(null); }
	function hide(){ panel.hidden = true; card.onclick = null; }
	function say(msg, ms){ coach.hidden = !msg; if(msg){ coach.innerHTML = msg; if(ms) later(() => { if(coach.innerHTML === msg) coach.hidden = true; }, ms*SPEED); } }
	function setBar(text, btn, fn){
		bar.hidden = !text; if(!text) return;
		bar.querySelector("span").innerHTML = text; const b = bar.querySelector("button");
		b.hidden = !btn; if(btn){ b.textContent = btn; b.onclick = () => { play("pop"); fn(); }; }
	}
	function course(key){ const [y, n, t] = COURSES[key]; S.learned.add(key); return `<div class="jd-course"><span class="tag">📚 En Licence Sciences de la Vie · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	function setStage(t){ $("#jdStage").textContent = t; say(null); hintT = 0; onEvent && onEvent("stage", t); }
	function err(why){ S.errors++; play("bad"); onEvent && onEvent("err", why || ""); }
	const msgEl = (t, cls) => { const m = card.querySelector(".jd-msg"); if(m){ m.className = "jd-msg " + (cls || ""); m.innerHTML = t; } };
	const fr = v => v.toLocaleString("fr-FR");

	/* ---------- le carnet de terrain (texture de l'objet 3D) ---------- */
	function wrap(x, s, px, py, maxW, lh){ const words = String(s).split(" "); let line = "", y = py;
		for(const w of words){ const t = line ? line + " " + w : w; if(x.measureText(t).width > maxW && line){ x.fillText(line, px, y); line = w; y += lh; } else line = t; }
		if(line) x.fillText(line, px, y); return y + lh; }
	function drawCarnet(){
		const x = carnetCv.getContext("2d"), W = 1024, H = 700;
		x.fillStyle = "#f6f0dc"; x.fillRect(0, 0, W, H);
		x.strokeStyle = "rgba(80,110,160,.22)"; x.lineWidth = 2; for(let y = 96; y < H - 20; y += 36){ x.beginPath(); x.moveTo(20, y); x.lineTo(W - 20, y); x.stroke(); }
		x.strokeStyle = "rgba(196,83,47,.35)"; for(const m of [62, 574]){ x.beginPath(); x.moveTo(m, 20); x.lineTo(m, H - 20); x.stroke(); }
		const g = x.createLinearGradient(482, 0, 542, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(.5, "rgba(60,40,10,.28)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(482, 0, 60, H);
		x.fillStyle = "#23402c"; x.font = "italic bold 40px Georgia, serif"; x.fillText("Le jardin se tait", 74, 70);
		x.fillStyle = "#3a3324"; x.font = "italic 23px Georgia, serif";
		let y = wrap(x, "Pourquoi les pollinisateurs disparaissent-ils ? Que faire avant le printemps ?", 74, 122, 400, 36);
		x.font = "bold 22px Georgia, serif"; x.fillStyle = "#23402c"; x.fillText("Les pistes de Thibault", 74, y + 8); y += 46;
		for(const [k, t] of PISTES){
			const st = S.pistes[k]; x.font = "bold 26px Georgia, serif"; x.fillStyle = st === "✓" ? "#2f6b45" : st === "✗" ? "#b5563d" : st === "~" ? "#c27a1a" : "#9a9a8a";
			x.fillText(st === "~" ? "±" : st, 74, y); x.font = "italic 21px Georgia, serif"; x.fillStyle = "#3a3324"; y = wrap(x, t, 108, y, 380, 30) + 6;
		}
		x.fillStyle = "#23402c"; x.font = "italic bold 34px Georgia, serif"; x.fillText("Indices", 588, 70);
		let y2 = 122;
		CLUES.forEach(([lab, txt], i) => {
			const got = i < 4 ? i < S.clue : S.clue >= 1;
			if(i === 4 && !got) return;
			x.font = "bold 20px Georgia, serif"; x.fillStyle = got ? (i === 4 ? "#7a7a6a" : "#b5563d") : "#b9b4a8"; x.fillText(`p.${i + 1} · ${lab}`, 588, y2); y2 += 28;
			x.font = "italic 19px Georgia, serif"; x.fillStyle = i === 4 ? "#6a6a5a" : "#3a3324";
			y2 = got ? wrap(x, txt.replace("%D", fr(S.dens || 6)).replace("%W", S.whites || 9), 600, y2, 400, 26) + 10 : (x.fillText("…", 600, y2), y2 + 34);
			if(i === 4){ x.strokeStyle = "#7a7a6a"; x.lineWidth = 2; x.strokeRect(582, y2 - 120, 420, 112); }
		});
		carnetTex.needsUpdate = true;
		$("#jdBook b").textContent = `${S.clue}/4`;
	}
	drawCarnet();
	function note(n, pistes){ say(null); S.clue = Math.max(S.clue, n); Object.assign(S.pistes, pistes); drawCarnet(); play("chime"); }

	/* ---------- le dossier ---------- */
	function intro(){
		stage = "intro"; setStage("Le dossier");
		show(`<div class="jd-k">Mini-jeu · ${formation.name}</div><h2 class="jd-h">Le jardin se tait</h2>
			<div class="jd-letter">« Fin septembre. Cet été, je n'ai presque pas vu d'abeilles ni de bourdons, et les pommiers ont donné trois fois moins de fruits. Le jardin se tait. Je commande les semis et le matériel avant le printemps : dis-moi pourquoi, et quoi faire. »<br><b>Thibault, jardinier du jardin botanique Nicolas Boulay</b></div>
			<p class="jd-p">Ton labo de licence mène l'enquête. Ton carnet de terrain t'attend sur la table : <b>cinq pistes</b> à vérifier, <b>quatre indices</b> à trouver. Attention, toutes les pistes ne sont pas bonnes.</p>
			<button class="jd-go" data-a="carnet">Ouvrir le carnet de terrain</button>`);
	}
	function openCarnet(){
		stage = "carnet0"; flyTo("carnet", 1.8);
		show(`<div class="jd-k">Le carnet de terrain</div><h2 class="jd-h">Cinq pistes, quatre indices</h2>
			<p class="jd-p">À gauche, les pistes de Thibault. À droite, la place des indices. Chaque observation de ton enquête s'y écrira : c'est lui que tu présenteras au jardinier à la fin.</p>
			<p class="jd-p">Première piste : <b>« des guêpes rôdent près des ruches »</b>. Le rucher est au fond du jardin.</p>
			<button class="jd-go" data-a="hunt">Aller au rucher →</button>`, true);
	}

	/* ---------- Indice 1 · L1 terrain : les suspects du rucher, à la loupe ---------- */
	function startHunt(){
		stage = "hunt"; hide(); flyTo("rucher", 1.6); setStage("Indice 1 · Terrain (L1)");
		Object.values(SPEC).forEach(s => s.tag.visible = false); S.ids.clear();
		huntBar();
		say("Devant les ruches, des abeilles mortes. Trois insectes rayés traînent autour : touche chacun pour l'examiner à la loupe 🔍", 7000);
	}
	const huntBar = () => setBar(`Suspects examinés : <b>${S.ids.size}/3</b>`);
	function examine(id){
		stage = "key"; say(null); spark.position.y = -5; hintBtn.hidden = true;
		let node = "k1", seen = {}; const path = [];
		const render = () => {
			const k = KEY[node];
			show(`<div class="jd-k">L1 · clé de détermination · ${SPEC[id].where}</div><h2 class="jd-h">${k.q}</h2>
				${path.length ? `<div class="jd-path">${path.map(p => `<span>✓ ${p}</span>`).join("")}</div>` : ""}
				<canvas class="jd-lens" width="320" height="220" aria-label="Le spécimen sous la loupe"></canvas>
				<div class="jd-look ${seen[k.look] ? "done" : ""}">${seen[k.look] ? "✓ Observé. Que vois-tu ?" : `🔍 Promène la loupe sur <b>${k.what}</b>`}</div>
				<div class="jd-leads">${k.a.map((o, i) => `<button class="jd-lead" data-k="${i}" ${seen[k.look] ? "" : "disabled"}>${o[0]}</button>`).join("")}</div>
				<div class="jd-msg"></div>`);
			lens(card.querySelector("canvas"), id, k.look, () => {
				if(seen[k.look]) return; seen[k.look] = true; play("pop");
				card.querySelectorAll("[data-k]").forEach(b => b.disabled = false);
				const l = card.querySelector(".jd-look"); l.classList.add("done"); l.innerHTML = "✓ Observé. Que vois-tu ?";
			});
		};
		card.onclick = e => {
			const b = e.target.closest("[data-k]"); if(!b || b.disabled) return;
			const [label, next] = KEY[node].a[+b.dataset.k];
			if(!leadsTo(next, id)){ err(`clé : ${label}`); b.classList.add("ko"); b.disabled = true; msgEl(node === "k1" ? "Recompte : sous la loupe, les ailes se superposent." : node === "k2" ? "Regarde la couleur du thorax, juste derrière la tête." : "Regarde la couleur des anneaux et le bout des pattes.", "ko"); return; }
			play("pop"); path.push(label);
			if(TAXA[next]){ card.onclick = null; return reveal(id); }
			node = next; render();
		};
		render();
	}
	function reveal(id){
		const t = TAXA[id]; S.ids.add(id); SPEC[id].tag.visible = true; play("good");
		const done = S.ids.size === 3;
		show(`<div class="jd-k">Identifié · ${S.ids.size}/3</div><h2 class="jd-h">${t.name}</h2>
			<canvas class="jd-lens" width="320" height="220" style="cursor:default"></canvas>
			<div class="jd-tax"><i>${t.latin}</i><small>${t.taxon}</small><span>${t.fact}</span></div>
			<button class="jd-go" data-a="${done ? "clue1" : "back"}">${done ? "Faire le point →" : "Reposer le spécimen et continuer"}</button>`);
		lens(card.querySelector("canvas"), id, null);
	}
	function clue1(){
		note(1, { guepes:"~" }); flyTo("carnet");
		show(`<div class="jd-k">Indice 1 noté · page 1</div><h2 class="jd-h">Un chasseur devant les ruches</h2>
			<div class="jd-note">Frelon asiatique en vol stationnaire devant les ruches : il attrape les abeilles au retour. Elles restent cloîtrées et ne butinent plus.</div>
			<p class="jd-p">La piste de Thibault était à moitié juste : la « guêpe » de la lavande est un <b>syrphe</b>, une mouche qui imite les guêpes et qui pollinise ! Et le frelon européen est indigène : ce n'est pas lui. <b>Page 5 du carnet : fausse piste écartée.</b></p>
			${course("cle")}<button class="jd-go" data-a="web">Piste suivante : le voisin →</button>`, true);
	}

	/* ---------- Indice 2 · L1 réseau trophique : prédire, puis observer ---------- */
	function startWeb(){
		stage = "web"; setStage("Indice 2 · Réseau trophique (L1)"); flyTo("voisin"); mistT = 0;
		aphids.count = 24; ladybirds.visible = true; beeN = 5;
		hide();
		say("Thibault s'en souvient : en juin, un nuage blanc est passé par-dessus le mur. Le voisin avait ressorti un vieux bidon d'insecticide pour ses rosiers. Par chance, Thibault avait fait un relevé la veille.", 5000);
		later(webPredict, 4200);
	}
	function webPredict(){
		const pred = {};
		show(`<div class="jd-k">L1 · écologie · prédire</div><h2 class="jd-h">Et dans six semaines ?</h2>
			<p class="jd-p">Prédis d'abord, le relevé de Thibault tranchera. Le produit tue les insectes qu'il touche : pucerons, coccinelles… et abeilles. Les flèches vont de celui qui est mangé vers celui qui le mange. <b>Glisse chaque case vers le haut ou vers le bas</b> (ou touche-la) : augmentera ou diminuera ?</p>
			<div class="jd-web"><svg viewBox="0 0 100 104" preserveAspectRatio="none"><defs><marker id="jdArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#2f6b45"/></marker></defs>${netLines()}</svg>
				<span class="jd-spray">💨 Insecticide</span>
				${Object.entries(NET).map(([k, [e, n, x, y]]) => `<button class="jd-node ${TRUTH[k] ? "" : "fixed"}" data-n="${k}" style="left:${x}%;top:${y}%"><i>${e}</i>${n}<em>${TRUTH[k] ? "?" : ""}</em></button>`).join("")}</div>
			<div class="jd-msg">Pointillés : l'abeille pollinise les fleurs, qui font des graines.</div>
			<button class="jd-go" data-obs disabled>Observer six semaines plus tard</button>`);
		const set = (b, v) => { const k = b.dataset.n; pred[k] = v; b.classList.toggle("up", v === "↑"); b.classList.toggle("down", v === "↓"); b.querySelector("em").textContent = v; play("pop");
			card.querySelector("[data-obs]").disabled = Object.keys(TRUTH).some(k => !pred[k]); };
		let down = null;
		card.querySelectorAll(".jd-node:not(.fixed)").forEach(b => {
			b.addEventListener("pointerdown", e => { down = { y:e.clientY, b }; b.setPointerCapture && b.setPointerCapture(e.pointerId); });
			b.addEventListener("pointerup", e => { if(!down || down.b !== b) return; const dy = e.clientY - down.y; down = null;
				set(b, dy < -12 ? "↑" : dy > 12 ? "↓" : pred[b.dataset.n] === "↑" ? "↓" : "↑"); });
			b.addEventListener("click", e => { if(e.detail === 0) set(b, pred[b.dataset.n] === "↑" ? "↓" : "↑"); });     // clavier
		});
		card.onclick = e => { if(e.target.closest("[data-obs]") && !e.target.closest("[data-obs]").disabled){ card.onclick = null; observe(pred); } };
		if(window.campus && window.campus.game) window.campus.game.predict = (o) => card.querySelectorAll(".jd-node:not(.fixed)").forEach(b => set(b, o[b.dataset.n]));
	}
	function netLines(){
		const L = (a, b, dash, ox = 0) => { const A = NET[a], B = NET[b], dx = B[2] - A[2], dy = B[3] - A[3], d = Math.hypot(dx, dy), k1 = 9/d, k2 = 1 - 10/d;
			return `<line x1="${A[2] + dx*k1 + ox}" y1="${A[3] + dy*k1}" x2="${A[2] + dx*k2 + ox}" y2="${A[3] + dy*k2}" stroke="${dash ? "#c27a1a" : "#2f6b45"}" stroke-width="1" ${dash ? 'stroke-dasharray="2 1.6"' : 'marker-end="url(#jdArr)"'}/>`; };
		const S2 = (b) => { const B = NET[b]; return `<line x1="50" y1="52" x2="${50 + (B[2] - 50)*.62}" y2="${52 + (B[3] - 52)*.62}" stroke="#c4532f" stroke-width=".8" stroke-dasharray="1.4 1.4"/>`; };
		return NET_LINKS.map(([a, b]) => L(a, b, false, a === "F" ? -3 : 0)).join("") + L("A", "F", true, 3) + ["P", "C", "A"].map(S2).join("");
	}
	function observe(pred){
		hide(); say("Six semaines plus tard, mi-juillet… 🗓️", 3200);
		mistT = -1; let k = 0;
		const grow = setInterval(() => { if(closed) return clearInterval(grow); k++; aphids.count = Math.min(200, 24 + k*9); if(k === 4) ladybirds.visible = false; beeN = Math.max(2, 5 - Math.floor(k/5)); if(k >= 20) clearInterval(grow); }, 120/SPEED);
		timers.add(grow);
		later(() => {
			let bad = 0;
			const rows = Object.keys(TRUTH).map(n => { const ok = pred[n] === TRUTH[n]; if(!ok){ bad++; } const [lab, a, b] = RELEVE[n];
				return `<tr><td>${lab}</td><td>${a}</td><td>${b}</td><td class="${ok ? "ok" : "ko"}">${pred[n]} ${ok ? "✓" : "✗"}</td></tr>`; }).join("");
			const wrong = Object.keys(TRUTH).filter(n => pred[n] !== TRUTH[n]);
			wrong.forEach(n => err(`prédiction ${NET[n][1]} : ${pred[n]}`));
			play(bad ? "bad" : "good");
			show(`<div class="jd-k">L1 · écologie · observer</div><h2 class="jd-h">Le relevé de mi-juillet</h2>
				<table class="jd-tbl"><tr><th>Relevé</th><th>Avant</th><th>Après</th><th>Ta prédiction</th></tr>${rows}</table>
				${wrong.length ? wrong.map(n => `<p class="jd-p">✗ <b>${NET[n][1]}</b> : ${WHY[n]}</p>`).join("") : `<p class="jd-p">✓ Tout juste, même le piège des pucerons !</p>`}
				<p class="jd-p">${wrong.includes("P") ? "" : WHY.P + " "}Un seul produit, et c'est tout le réseau qui bascule : un <b>effet en cascade</b>.</p>
				<button class="jd-go" data-a="clue2">Noter l'indice →</button>`);
			Object.assign(S, { webBad:bad });
		}, 3400);
	}
	function clue2(){
		note(2, { voisin:"✓" }); flyTo("carnet");
		show(`<div class="jd-k">Indice 2 noté · page 2</div><h2 class="jd-h">L'insecticide du voisin</h2>
			<div class="jd-note">Coccinelles ↓, pucerons ↑, abeilles ↓, graines ↓. Et ce produit est interdit aux jardiniers amateurs depuis 2019 (loi Labbé).</div>
			<p class="jd-p">Pour les pucerons, il existe une parade : la <b>lutte biologique</b>. On lâche des larves de coccinelles, et le réseau se régule tout seul.</p>
			${course("reseau")}<button class="jd-go" data-a="quad">Piste suivante : la prairie →</button>`, true);
	}

	/* ---------- Indice 3 · L2 quadrats : lancer au hasard, compter, calculer ---------- */
	function startQuad(){
		stage = "throw"; setStage("Indice 3 · Quadrats (L2)"); hide(); flyTo("prairie");
		if(quads.length) buildMeadow(); S.counts = []; S.dens = null;
		say("Le protocole : lancer le cadre d'un mètre carré <b>sans viser</b>, pour tirer les quadrats au hasard. Même semaine, même méthode qu'en 2023.", 7000);
		throwBar();
	}
	const throwBar = () => setBar(`Touche la prairie pour lancer le quadrat · <b>${quads.length}/4</b>`);
	function throwQuad(){
		if(toss || quads.length >= 4) return;
		const c = cells.find(c => c.land === quads.length); qCur = cells.indexOf(c);
		const g = quadFrame(), from = new THREE.Vector3(MEAD.x0 + 2.5, 1.3, MEAD.z0 + 4.6);
		g.position.copy(from); quads.push({ g, c });
		toss = { g, from, to:new THREE.Vector3(c.cx, .02, c.cz), k:0, spin:(rnd() - .5)*8 };
		play("pop"); say(null); setBar(null);
	}
	function landed(){
		stage = "count"; flyTo("quad", 1); const c = cells[qCur];
		countBar(c);
		if(quads.length === 1) say("Touche chaque fleur <b>à l'intérieur</b> du cadre pour la compter, puis note ton total.", 6000);
	}
	const countBar = c => setBar(`Quadrat ${quads.length}/4 · fleurs comptées : <b>${c.fl.filter(f => f.done).length}</b>`, "Noter ce comptage", () => {
		const n = c.fl.filter(f => f.done).length;
		if(n < c.fl.length){ err(`quadrat : ${n} sur ${c.fl.length}`); say(`Il reste des fleurs dans le cadre : regarde bien dans les coins.`, 3500); return; }
		S.counts.push(n); play("good"); setBar(null);
		if(S.counts.length < 4){ stage = "throw"; flyTo("prairie", 1); throwBar(); }
		else later(quadCalc, 400);
	});
	function tapFlower(p){
		const c = cells[qCur]; if(!c) return;
		if(Math.abs(p.x - c.cx) > .55 || Math.abs(p.z - c.cz) > .55){ say("Hors du cadre : on ne compte que l'intérieur du quadrat.", 2500); return; }
		let best = null, bd = .14; for(const f of c.fl){ const d = Math.hypot(f.x - p.x, f.z - p.z); if(!f.done && d < bd){ bd = d; best = f; } }
		if(!best) return;
		best.done = true; petals.setColorAt(best.i, new THREE.Color("#3d9a5c")); petals.instanceColor.needsUpdate = true; play("pop"); countBar(c);
	}
	function quadCalc(){
		stage = "calc"; flyTo("prairie", 1);
		const sum = S.counts.reduce((a, b) => a + b, 0);
		show(`<div class="jd-k">L2 · écologie quantitative</div><h2 class="jd-h">La densité de fleurs</h2>
			<table class="jd-tbl"><tr>${S.counts.map((n, i) => `<th>Quadrat ${i + 1}</th>`).join("")}</tr><tr>${S.counts.map(n => `<td style="text-align:center;font-weight:800;font-size:17px">${n} fleurs</td>`).join("")}</tr></table>
			<p class="jd-p">Chaque quadrat mesure 1 m². <b>Combien de fleurs par m², en moyenne ?</b></p>
			<div data-pad></div><div class="jd-msg"></div><div data-s2></div>`);
		pad(card.querySelector("[data-pad]"), "fleurs / m²", v => {
			if(v !== sum/4){ err(`densité : ${v}`); msgEl(v === sum ? "Ça, c'est le total des 4 quadrats : il faut le partager entre 4 m²." : "Additionne les 4 comptages, puis divise par 4 quadrats de 1 m².", "ko"); return false; }
			S.dens = v; play("good"); msgEl(`✓ (${S.counts.join(" + ")}) ÷ 4 = <b>${v} fleurs par m²</b>.`, "ok");
			card.querySelector("[data-s2]").innerHTML = `<div class="jd-note">Inventaire de 2023, même semaine, même protocole : <b>12 fleurs par m²</b>.</div>
				<p class="jd-p"><b>Combien de fois moins de fleurs aujourd'hui ?</b></p><div data-pad2></div><div class="jd-msg" data-m2></div>`;
			pad(card.querySelector("[data-pad2]"), "fois moins", r => {
				const m2 = card.querySelector("[data-m2]");
				if(Math.abs(r - 12/v) > .05){ err(`rapport : ${r}`); m2.className = "jd-msg ko"; m2.textContent = `Divise la densité de 2023 par celle d'aujourd'hui : 12 ÷ ${v}.`; return false; }
				play("good"); m2.className = "jd-msg ok"; m2.innerHTML = `✓ 12 ÷ ${v} = ${fr(Math.round(12/v*100)/100)} : <b>deux fois moins de fleurs</b>.`;
				m2.insertAdjacentHTML("afterend", `<p class="jd-p" style="margin-top:6px">Un cercle vicieux : moins de pollinisateurs, moins de graines ; moins de graines, moins de fleurs l'année suivante ; moins de fleurs, moins de nourriture pour les pollinisateurs.</p><button class="jd-go" data-a="clue3">Noter l'indice →</button>`);
				return true;
			});
			return true;
		});
	}
	function clue3(){
		note(3, { prairie:"✓" }); flyTo("carnet");
		show(`<div class="jd-k">Indice 3 noté · page 3</div><h2 class="jd-h">Deux fois moins de fleurs</h2>
			<div class="jd-note">${fr(S.dens)} fleurs par m² contre 12 en 2023. La fauche n'a pas changé : c'est la prairie qui s'appauvrit.</div>
			<p class="jd-p">Les quadrats ont été tirés <b>au hasard</b> : choisis à la main, on vise sans le vouloir les coins les plus fleuris, et l'estimation est biaisée.</p>
			${course("quadrat")}<button class="jd-go" data-a="gene">Piste suivante : le semis →</button>`, true);
	}

	/* ---------- Indice 4 · L3 génétique : compter, puis retrouver les parents ---------- */
	function startGene(){
		stage = "semis"; setStage("Indice 4 · Génétique (L3)"); hide(); flyTo("semis");
		plants.forEach(p => p.done = false); marks.forEach(m => scene.remove(m)); marks = []; S.whites = 0;
		say("Thibault a semé l'an dernier les graines de deux bourraches bleues du jardin : <b>32 pieds</b>. Et voilà des fleurs blanches… Touche chaque pied blanc pour le compter.", 7000);
		semisBar();
	}
	const semisBar = () => setBar(`Pieds blancs comptés : <b>${S.whites}</b> sur 32`, "Noter ce comptage", () => {
		const n = plants.filter(p => p.white).length;
		if(S.whites < n){ err(`semis : ${S.whites} sur ${n}`); say("Il reste des pieds blancs : regarde aussi au fond du massif.", 3500); return; }
		play("good"); later(geneHyp, 300);
	});
	function tapPlant(p){
		let best = null, bd = .3; for(const q of plants){ const d = Math.hypot(q.x - p.x, q.z - p.z); if(d < bd){ bd = d; best = q; } }
		if(!best) return;
		if(!best.white){ say("Celui-ci est bleu : on ne compte que les blancs.", 1800); return; }
		if(best.done) return;
		best.done = true; S.whites++; play("pop");
		const m = mesh(new THREE.ConeGeometry(.05, .16, 6), std("#e9622c"), scene, best.x, .78, best.z, 0, false); m.rotation.x = Math.PI; marks.push(m);
		semisBar();
	}
	function geneHyp(){
		stage = "hyp"; setBar(null);
		const W = plants.filter(p => p.white).length, al = [["B", "B"], ["B", "B"]];
		show(`<div class="jd-k">L3 · génétique · l'hypothèse</div><h2 class="jd-h">${32 - W} bleues, ${W} blanches</h2>
			<p class="jd-p">Le gène de la couleur a deux allèles : <b>B</b> (bleu, dominant) et <b>b</b> (blanc, récessif). Une fleur n'est blanche que si elle est <b>bb</b>. Les deux parents étaient bleus. <b>Touche les allèles pour trouver leur génotype</b> : l'échiquier calcule ce qu'on devrait observer.</p>
			<div class="jd-par">${[0, 1].map(p => `<div class="jd-parent"><i data-pi="${p}">💙</i>Parent ${p + 1}<div class="jd-al">${[0, 1].map(i => `<button data-al="${p},${i}">B</button>`).join("")}</div></div>`).join("")}</div>
			<table class="jd-pun"></table>
			<div class="jd-msg" data-exp></div>
			<button class="jd-go" data-val>Confronter aux ${W} blanches comptées</button><div data-s2></div>`);
		const upd = () => {
			al.forEach((a, p) => { card.querySelector(`[data-pi="${p}"]`).textContent = a[0] === "b" && a[1] === "b" ? "🤍" : "💙"; a.forEach((v, i) => card.querySelector(`[data-al="${p},${i}"]`).textContent = v); });
			const cell = (x, y) => [x, y].sort().reverse().join("").replace("bB", "Bb");
			let w = 0; const rows = al[0].map(g1 => `<tr><th>${g1}</th>${al[1].map(g2 => { const c = cell(g1, g2); if(c === "bb") w++; return `<td class="${c === "bb" ? "w" : "b"}">${c}</td>`; }).join("")}</tr>`).join("");
			card.querySelector(".jd-pun").innerHTML = `<tr><th>♀ \\ ♂</th>${al[1].map(g => `<th>${g}</th>`).join("")}</tr>${rows}`;
			const parentWhite = al.some(a => a[0] === "b" && a[1] === "b");
			const exp = 32*w/4, m = card.querySelector("[data-exp]");
			m.className = "jd-msg" + (parentWhite ? " ko" : "");
			m.innerHTML = parentWhite ? "Impossible : un parent bb aurait eu des fleurs blanches." : `Attendu : <b>${w}/4</b> de blanches, soit <b>${fr(exp)}</b> sur 32. Observé : <b>${W}</b>.`;
			card.querySelector("[data-val]").disabled = parentWhite;
			return w;
		};
		upd();
		card.onclick = e => {
			const b = e.target.closest("[data-al]");
			if(b){ const [p, i] = b.dataset.al.split(",").map(Number); al[p][i] = al[p][i] === "B" ? "b" : "B"; play("pop"); upd(); return; }
			const v = e.target.closest("[data-val]"); if(!v || v.disabled) return;
			const w = upd(), g = al.map(a => a.join("").replace("bB", "Bb")).join(" × ");
			if(w !== 1){ err(`hypothèse ${g}`); card.querySelector("[data-exp]").className = "jd-msg ko"; card.querySelector("[data-exp]").innerHTML = `${g} : aucune fleur blanche ne pourrait apparaître. Or tu en as compté ${W}. Hypothèse rejetée, essaie autre chose.`; return; }
			card.onclick = null; play("good");
			card.querySelectorAll("[data-al],[data-val]").forEach(x => x.disabled = true);
			card.querySelector("[data-s2]").innerHTML = `<p class="jd-p" style="margin-top:8px">✓ <b>Bb × Bb</b> : on attend 3 bleues pour 1 blanche, soit 24 et 8. Tu as compté ${32 - W} et ${W} : l'écart est petit, il vient du hasard (un test du χ² le confirmerait). Il y a deux ans, une bourrache blanche poussait à côté : son pollen a apporté l'allèle b.</p>
				<div class="jd-note">Thibault a aussi noté les visites pendant 30 minutes : <b>69 visites</b> sur les 23 pieds bleus, <b>9 visites</b> sur les 9 pieds blancs.</div>
				<p class="jd-p"><b>Combien de visites par pied bleu ?</b></p><div data-pad></div><div class="jd-msg" data-m3></div>`;
			pad(card.querySelector("[data-pad]"), "visites / pied", r => {
				const m3 = card.querySelector("[data-m3]");
				if(r !== 3){ err(`visites : ${r}`); m3.className = "jd-msg ko"; m3.textContent = "Divise le nombre de visites par le nombre de pieds bleus : 69 ÷ 23."; return false; }
				play("good"); m3.className = "jd-msg ok"; m3.innerHTML = "✓ 3 visites par pied bleu, 1 par pied blanc : les blanches sont <b>3 fois moins visitées</b>.";
				m3.insertAdjacentHTML("afterend", `<p class="jd-p" style="margin-top:6px">Et arracher les blanches ne suffira pas : parmi les bleues, deux sur trois sont <b>Bb</b> en moyenne, et portent l'allèle blanc en cachette.</p><button class="jd-go" data-a="clue4">Noter l'indice →</button>`);
				return true;
			});
		};
	}
	function clue4(){
		note(4, { semis:"✓" }); flyTo("carnet");
		show(`<div class="jd-k">Indice 4 noté · page 4</div><h2 class="jd-h">Un allèle caché dans le semis</h2>
			<div class="jd-note">${S.whites || 9} blanches sur 32, environ 1/4 : parents Bb × Bb, blanc récessif. Les blanches sont trois fois moins visitées.</div>
			<p class="jd-p">Le carnet est complet. Reste la piste de l'antenne-relais : <b>aucune</b> de tes mesures ne la concerne.</p>
			${course("genet")}<button class="jd-go" data-a="report">Rédiger le rapport pour Thibault →</button>`, true);
	}

	/* ---------- le rapport : agrafer une page du carnet à chaque cause et à chaque action ---------- */
	function report(){
		stage = "report"; setStage("Rapport au jardinier"); flyTo("carnet");
		let sel = null; const pin = {};
		show(`<div class="jd-k">Rapport · 1/2 · les causes</div><h2 class="jd-h">Quelles causes sont prouvées ?</h2>
			<p class="jd-p"><b>Choisis une page du carnet, puis touche la cause qu'elle prouve</b> pour l'y agrafer. Une cause sans preuve, touche-la pour l'<b>écarter</b>.</p>
			<div class="jd-pages">${PAGES.map(([k, t]) => `<button data-pg="${k}" class="${k === "p5" ? "fp" : ""}" aria-pressed="false">${t}</button>`).join("")}</div>
			<div class="jd-rows">${HYPS.map(([k, t]) => `<button class="jd-row" data-h="${k}"><span>${t}<small></small></span><b>?</b></button>`).join("")}</div>
			<div class="jd-msg"></div><button class="jd-go" data-v disabled>Valider les causes</button>`);
		const ui = () => {
			HYPS.forEach(([k]) => { const r = card.querySelector(`[data-h="${k}"]`), v = pin[k]; r.classList.toggle("jd-pin", !!v && v !== "x"); r.classList.toggle("jd-out", v === "x"); r.querySelector("b").textContent = !v ? "?" : v === "x" ? "✗ écartée" : "📎 " + v.replace("p", "p."); });
			card.querySelectorAll("[data-pg]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pg === sel)));
			card.querySelector("[data-v]").disabled = HYPS.some(([k]) => !pin[k]);
		};
		card.onclick = e => {
			const pg = e.target.closest("[data-pg]");
			if(pg){ if(pg.dataset.pg === "p5"){ msgEl("La page 5 ne prouve aucune cause : elle sert à en <b>écarter</b> une.", "ko"); sel = null; ui(); return; } sel = sel === pg.dataset.pg ? null : pg.dataset.pg; play("pop"); msgEl(sel ? "Touche maintenant la cause que cette page prouve." : ""); ui(); return; }
			const r = e.target.closest("[data-h]");
			if(r && !card.querySelector("[data-v]").dataset.done){ const k = r.dataset.h; play("pop");
				if(sel){ pin[k] = sel; sel = null; msgEl(""); } else pin[k] = pin[k] === "x" ? undefined : "x";
				ui(); return; }
			const v = e.target.closest("[data-v]");
			if(v && !v.disabled && !v.dataset.done){
				v.dataset.done = "1"; let bad = 0;
				HYPS.forEach(([k, , ok, why]) => {
					const r = card.querySelector(`[data-h="${k}"]`), good = ok ? ok.includes(pin[k]) : pin[k] === "x";
					r.classList.add(good ? "ok" : "ko");
					if(!good){ bad++; err(`cause ${k} : ${pin[k]}`); r.querySelector("small").textContent = ok ? `Preuve attendue : ${ok[0].replace("p", "page ")}.` : why; }
					else if(!ok) r.querySelector("small").textContent = "Écartée à raison.";
				});
				S.report = { bad };
				play(bad ? "bad" : "good");
				v.outerHTML = `<p class="jd-p">${bad ? `${bad} erreur${bad > 1 ? "s" : ""} : on ne retient une cause que si une mesure la prouve.` : "✓ Quatre causes prouvées, deux pistes écartées : un diagnostic solide."}</p><button class="jd-go" data-a="actions">Choisir les deux actions →</button>`;
			}
		};
		ui();
		if(window.campus && window.campus.game) window.campus.game.pin = o => { Object.assign(pin, o); ui(); };
	}
	function actions(){
		let sel = null; const pin = {};
		show(`<div class="jd-k">Rapport · 2/2 · les actions</div><h2 class="jd-h">Deux actions avant le printemps</h2>
			<p class="jd-p">Thibault n'a le temps et le budget que pour <b>deux actions</b>. Chacune doit être <b>justifiée par une page du carnet</b> : choisis la page, puis l'action qu'elle justifie.</p>
			<div class="jd-pages">${PAGES.map(([k, t]) => `<button data-pg="${k}" class="${k === "p5" ? "fp" : ""}" aria-pressed="false">${t}</button>`).join("")}</div>
			<div class="jd-rows">${ACTIONS.map(([k, t]) => `<button class="jd-row" data-h="${k}"><span>${t}<small></small></span><b>—</b></button>`).join("")}</div>
			<div class="jd-msg"></div><button class="jd-go" data-v disabled>Envoyer le rapport à Thibault</button>`);
		const n = () => Object.values(pin).filter(Boolean).length;
		const ui = () => {
			ACTIONS.forEach(([k]) => { const r = card.querySelector(`[data-h="${k}"]`); r.classList.toggle("jd-pin", !!pin[k]); r.querySelector("b").textContent = pin[k] ? "📎 " + pin[k].replace("p", "p.") : "—"; });
			card.querySelectorAll("[data-pg]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pg === sel)));
			card.querySelector("[data-v]").disabled = n() !== 2;
		};
		card.onclick = e => {
			const pg = e.target.closest("[data-pg]");
			if(pg){ sel = sel === pg.dataset.pg ? null : pg.dataset.pg; play("pop"); msgEl(sel ? "Touche l'action que cette page justifie." : ""); ui(); return; }
			const r = e.target.closest("[data-h]");
			if(r && !card.querySelector("[data-v]").dataset.done){ const k = r.dataset.h; play("pop");
				if(pin[k] && !sel){ pin[k] = undefined; msgEl(""); }
				else if(!sel) msgEl("Choisis d'abord la page du carnet qui justifie cette action.", "ko");
				else if(!pin[k] && n() >= 2) msgEl("Deux actions seulement : retire d'abord une agrafe.", "ko");
				else { pin[k] = sel; sel = null; msgEl(""); }
				ui(); return; }
			const v = e.target.closest("[data-v]");
			if(v && !v.disabled && !v.dataset.done){
				v.dataset.done = "1"; let bad = 0; S.actions = [];
				ACTIONS.forEach(([k, t, ok, why]) => { if(!pin[k]) return;
					const r = card.querySelector(`[data-h="${k}"]`), good = ok && pin[k] === ok; S.actions.push({ t, good });
					r.classList.add(good ? "ok" : "ko");
					if(!good){ bad++; err(`action ${k} : ${pin[k]}`); r.querySelector("small").textContent = ok ? `C'est la ${ok.replace("p", "page ")} qui la justifie.` : why; }
					else r.querySelector("small").textContent = "✓ Justifiée.";
				});
				S.report.actBad = bad; play(bad ? "bad" : "good");
				v.outerHTML = `<button class="jd-go" data-a="end">Lire la réponse de Thibault →</button>`;
			}
		};
		ui();
		if(window.campus && window.campus.game) window.campus.game.pin = o => { Object.assign(pin, o); ui(); };
	}

	/* ---------- fin ---------- */
	function finale(){
		stage = "end"; setStage("Réponse du jardinier"); flyTo("jardin", 2); beeN = 7; aphids.count = 24; ladybirds.visible = true;
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 7 ? "Bien" : e <= 12 ? "Assez bien" : "De justesse";
		onEvent && onEvent("win", mention);
		play("win");
		const min = Math.max(1, Math.round((performance.now() - S.t0)/60000));
		const acts = S.actions, good = acts.filter(a => a.good).length;
		show(`<div class="jd-k">Licence Sciences de la Vie · diagnostic rendu</div><h2 class="jd-h">Le jardin chantera au printemps</h2>
			<div class="jd-letter">« Merci ! ${good === 2 ? "Tes deux actions sont justifiées : je les lance cet hiver" : good === 1 ? "Je lance ton action justifiée cet hiver, et je réfléchis à l'autre" : "Tes actions ne s'appuient pas sur le carnet : je relis tes indices avant de dépenser quoi que ce soit"}. Je garde ton carnet pour la réunion du jardin. »<br><b>Thibault</b></div>
			<p class="jd-p" style="text-align:center">Diagnostic posé en ${min} min, mention <b>${mention}</b>.</p>
			<table class="jd-tbl">
				<tr><td>Indices du carnet</td><td>${S.clue}/4</td></tr>
				<tr><td>Fausses pistes</td><td>syrphe et antenne : ${S.report && S.report.bad === 0 ? "écartées ✓" : "à revoir"}</td></tr>
				${acts.map(a => `<tr><td colspan="2" style="text-align:left">${a.good ? "✓" : "✗"} ${a.t}</td></tr>`).join("")}
				<tr><td>Erreurs en chemin</td><td>${e}</td></tr></table>
			<p class="jd-p">Les cours de la licence que tu as utilisés :</p>
			<ul class="jd-list">${Object.keys(COURSES).map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<p class="jd-p">En L3, la licence se spécialise : <b>écologie opérationnelle</b>, <b>biotechnologies</b> ou <b>parcours ingénieur</b>, avec un stage chaque année.</p>
			${jpoCard()}${openLead ? `<button class="jd-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="jd-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Sciences de la Vie ↗</a>
			<button class="jd-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="jd-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- pavé numérique (on écrit le résultat de son calcul) ---------- */
	function pad(el, unit, onOk){
		let s = "";
		el.innerHTML = `<div class="jd-disp"><output>&nbsp;</output><span>${unit}</span></div>
			<div class="jd-pad">${["7", "8", "9", "⌫", "4", "5", "6", ",", "1", "2", "3", "0"].map(k => `<button data-d="${k}">${k}</button>`).join("")}<button class="okk" data-d="ok" style="grid-column:span 4">Valider</button></div>`;
		const out = el.querySelector("output"), shown = () => out.innerHTML = s || "&nbsp;";
		const key = k => {
			if(el.dataset.done) return;
			if(k === "⌫") s = s.slice(0, -1); else if(k === "ok"){ if(!s) return; const v = parseFloat(s.replace(",", ".")); if(onOk(v)){ el.dataset.done = "1"; el.querySelector(".jd-pad").remove(); document.removeEventListener("keydown", kb); } else { s = ""; } }
			else if(k === ","){ if(!s.includes(",")) s = (s || "0") + ","; } else if(s.length < 6) s += k;
			shown();
		};
		const kb = e => { if(!el.isConnected) return document.removeEventListener("keydown", kb); if(/^[0-9]$/.test(e.key)) key(e.key); else if(e.key === "," || e.key === ".") key(","); else if(e.key === "Backspace") key("⌫"); else if(e.key === "Enter") key("ok"); };
		document.addEventListener("keydown", kb);
		el.addEventListener("click", e => { const b = e.target.closest("[data-d]"); if(b){ play("pop"); key(b.dataset.d); } });
		el.type = v => { for(const ch of String(v)) key(ch === "." ? "," : ch); key("ok"); };
	}

	/* ---------- actions ---------- */
	panel.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "carnet") return openCarnet();
		if(k === "hunt") return startHunt();
		if(k === "back"){ hide(); stage = "hunt"; hintT = 0; huntBar(); return; }
		if(k === "clue1") return clue1();
		if(k === "web") return startWeb();
		if(k === "clue2") return clue2();
		if(k === "quad") return startQuad();
		if(k === "clue3") return clue3();
		if(k === "gene") return startGene();
		if(k === "clue4") return clue4();
		if(k === "report") return report();
		if(k === "actions") return actions();
		if(k === "end") return finale();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){
			Object.assign(S, fresh()); rnd = mulberry32(Date.now() % 100000);
			buildMeadow(); buildSemis(); drawCarnet(); Object.values(SPEC).forEach(s => s.tag.visible = false);
			return intro();
		}
	});
	$("#jdBook").addEventListener("click", () => { play("pop"); peek.querySelector("img").src = carnetCv.toDataURL("image/jpeg", .85); peek.hidden = false; });
	peek.addEventListener("click", e => { if(e.target === peek || e.target.closest("[data-peek]")) peek.hidden = true; });
	hintBtn.addEventListener("click", () => {
		play("chime"); hintT = 0; hintBtn.hidden = true;
		if(stage === "hunt"){ const id = Object.keys(SPEC).find(i => !S.ids.has(i)); if(!id) return; spark.position.copy(SPEC[id].pos).add(new THREE.Vector3(0, .6, 0)); say(`Indice : un suspect t'attend ${SPEC[id].where} ✨`, 5000); }
		if(stage === "throw") say("Touche n'importe où sur la prairie : le cadre part tout seul, au hasard.", 4000);
		if(stage === "count"){ const f = cells[qCur].fl.find(f => !f.done); if(f){ spark.position.set(f.x, .35, f.z); say("Indice : il en reste une là ✨", 4000); } }
		if(stage === "semis"){ const p = plants.find(p => p.white && !p.done); if(p){ spark.position.set(p.x, 1, p.z); say("Indice : un pied blanc ici ✨", 4000); } }
	});
	// toucher la scène (sans confondre avec une rotation de la vue)
	const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
	const groundAt = (e, y) => { const r = canvas.getBoundingClientRect(); ptr.set((e.clientX - r.left)/r.width*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1); ray.setFromCamera(ptr, camera); const p = new THREE.Vector3(); return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), p) ? p : null; };
	canvas.addEventListener("pointerdown", e => { down = { x:e.clientX, y:e.clientY, t:performance.now() }; });
	canvas.addEventListener("pointerup", e => {
		if(!down || !panel.hidden || fly) return;
		const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
		if(moved > 12 || dt > 600) return;
		tap(e);
	});
	function tap(e){
		hintT = 0;
		if(stage === "hunt"){
			groundAt(e, 0); const h = ray.intersectObjects(hits, false)[0];
			if(h){ play("pop"); examine(h.object.userData.id); }
		}
		else if(stage === "throw"){ const p = groundAt(e, 0); if(p && p.x > MEAD.x0 - 1.5 && p.x < MEAD.x0 + 6.5 && p.z > MEAD.z0 - 1.5 && p.z < MEAD.z0 + 5.5) throwQuad(); else say("Touche la prairie, à droite, derrière la petite clôture.", 3000); }
		else if(stage === "count"){ const p = groundAt(e, .07); if(p) tapFlower(p); }
		else if(stage === "semis"){ const p = groundAt(e, .5); if(p) tapPlant(p); }
	}

	/* ---------- boucle ---------- */
	function frame(t){
		if(closed) return;
		if(innerWidth !== shownW || innerHeight !== shownH) layout();
		const dt = Math.min(.05, (t - (last || t))/1000)*SPEED; last = t;
		if(fly){ fly.k = Math.min(1, fly.k + dt/(fly.dur*SPEED)); const e = fly.k < .5 ? 2*fly.k*fly.k : 1 - Math.pow(-2*fly.k + 2, 2)/2;
			camera.position.lerpVectors(fly.p0, fly.p, e); controls.target.lerpVectors(fly.t0, fly.t, e); if(fly.k >= 1) fly = null; }
		if(toss){ toss.k = Math.min(1, toss.k + dt/.9); const k = toss.k;
			toss.g.position.lerpVectors(toss.from, toss.to, k); toss.g.position.y += Math.sin(k*Math.PI)*1.3; toss.g.rotation.y = toss.spin*(1 - k); toss.g.rotation.x = (1 - k)*1.2;
			if(k >= 1){ toss.g.rotation.set(0, 0, 0); toss = null; play("pop"); landed(); } }
		controls.enabled = !fly && ["hunt", "throw", "semis"].includes(stage); controls.update();
		const s = t/1000*SPEED;
		// le frelon fait du sur-place devant les ruches, le syrphe aussi au-dessus de la lavande
		SPEC.velutina.g.position.set(SPEC.velutina.pos.x + Math.sin(s*1.3)*.08, SPEC.velutina.pos.y + Math.sin(s*7)*.03, SPEC.velutina.pos.z);
		SPEC.syrphe.g.position.set(SPEC.syrphe.pos.x + (Math.sin(s*.7) > .9 ? .2 : 0), SPEC.syrphe.pos.y + Math.sin(s*9)*.02, SPEC.syrphe.pos.z);
		bees.forEach((b, i) => { b.visible = i < beeN; const a = s*.6 + i*1.7; b.position.set(5.4 + Math.cos(a)*(1.3 + (i%3)*.4), .95 + Math.sin(s*2 + i)*.15, 2.8 + Math.sin(a*1.3)*.7); b.rotation.y = -a; });
		if(mistT >= 0){ mistT += dt; mist.material.opacity = Math.min(.55, mistT*.3)*(mistT > 5 ? Math.max(0, 1 - (mistT - 5)/3) : 1); mist.position.z = Math.min(3.5, mistT*.7); sprayer.rotation.x = Math.sin(s*4)*.15; }
		else mist.material.opacity = 0;
		spark.rotation.y += dt*3; spark.scale.setScalar(1 + Math.sin(s*6)*.2);
		Object.values(SPEC).forEach(sp => { if(sp.tag.visible) sp.tag.position.y = sp.pos.y + .5 + Math.sin(s*3)*.04; });
		if(["hunt", "throw", "count", "semis"].includes(stage) && panel.hidden && !fly && !toss){ hintT += dt/SPEED; if(hintT > 15 && hintBtn.hidden) hintBtn.hidden = false; }
		else hintBtn.hidden = true;
		renderer.render(scene, camera);
	}
	function loop(t){ if(closed) return; frame(t); raf = requestAnimationFrame(loop); }
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers.clear();
		removeEventListener("resize", layout); document.removeEventListener("keydown", onKey);
		controls.dispose(); carnetTex.dispose(); grassTex.dispose();
		renderer.dispose(); renderer.forceContextLoss();      // les géométries du kit sont partagées avec le campus : on ne les libère pas
		root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape"){ if(!peek.hidden) peek.hidden = true; else close(); } }
	document.addEventListener("keydown", onKey);
	$(".jd-x").addEventListener("click", close);
	buildMeadow(); buildSemis();
	intro();
	raf = requestAnimationFrame(loop);
	let pump = 0;      // ?vite : l'affichage avance même quand le navigateur bride requestAnimationFrame (tests automatiques)
	if(SPEED > 1) pump = setInterval(() => frame(performance.now()), 40);
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	const ensure = n => { if(S.clue < n){ S.clue = n; if(n >= 1) S.pistes.guepes = "~"; if(n >= 2) S.pistes.voisin = "✓"; if(n >= 3){ S.pistes.prairie = "✓"; S.dens = S.dens || 6; } if(n >= 4){ S.pistes.semis = "✓"; S.whites = S.whites || 9; } drawCarnet(); } };
	const jump = (n, fn) => () => { panel.hidden = true; ensure(n); fn(); };
	onEvent && onEvent("missions", [["Indice 1 · Terrain (L1)", jump(0, startHunt)], ["Indice 2 · Réseau trophique (L1)", jump(1, startWeb)], ["Indice 3 · Quadrats (L2)", jump(2, startQuad)],
		["Indice 4 · Génétique (L3)", jump(3, startGene)], ["Rapport au jardinier", jump(4, report)]]);
	// debug (?debug) : piloter le jeu pendant les tests
	if(window.campus) window.campus.game = { S, card, get stage(){ return stage; }, examine, hunt:jump(0, startHunt), web:jump(1, startWeb), quad:jump(2, startQuad), gene:jump(3, startGene), report:jump(4, report), end:finale,
		throwQ:throwQuad, cells:() => cells, qCur:() => qCur, flower:f => tapFlower(f), plants:() => plants, plant:p => tapPlant(p), bar:() => bar.querySelector("button").click(),
		type:v => { const el = [...card.querySelectorAll(".jd-pad")].pop(); el && el.parentNode.type(v); },
		snap:() => frame(performance.now()), get fly(){ return fly; }, camera };
}

/* ---------- la loupe : le spécimen est flou à l'œil nu, net sous la lentille ---------- */
const ZONES = {
	ailes:  (x, y) => Math.abs(x) > 20 && Math.abs(x) < 125 && y > -68 && y < 32,
	thorax: (x, y) => Math.abs(x) < 28 && y > -60 && y < -6,
	abdomen:(x, y) => (Math.abs(x) < 34 && y > -12 && y < 76) || (Math.abs(x) > 48 && Math.abs(x) < 86 && y > -76 && y < 16)
};
function lens(cv, id, look, onSeen){
	const HI = 3, W = 320, H = 220, hi = document.createElement("canvas"); hi.width = W*HI; hi.height = H*HI;
	{ const x = hi.getContext("2d"); x.fillStyle = "#eef3e4"; x.fillRect(0, 0, hi.width, hi.height); x.setTransform(HI, 0, 0, HI, W/2*HI, (H/2 + 4)*HI); drawInsect(x, id); }
	// vu à l'œil nu : on réduit fortement puis on agrandit en deux temps, les petits détails se fondent dans le flou
	const tiny = document.createElement("canvas"); tiny.width = 40; tiny.height = 28; tiny.getContext("2d").drawImage(hi, 0, 0, 40, 28);
	const lo = document.createElement("canvas"); lo.width = 120; lo.height = 84; const lx = lo.getContext("2d"); lx.imageSmoothingQuality = "high"; lx.drawImage(tiny, 0, 0, 120, 84);
	const x = cv.getContext("2d");
	let at = look ? null : [W/2, H/2 + 4], dwell = 0, lastT = 0;
	const draw = () => {
		x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(look ? lo : hi, 0, 0, W, H);
		if(!look || !at) { if(look){ x.fillStyle = "rgba(34,48,31,.55)"; x.font = "bold 13px Nunito, sans-serif"; x.textAlign = "center"; x.fillText("Vu à l'œil nu : promène la loupe dessus", W/2, H - 10); } return; }
		const [px, py] = at, R = 54, M = 2.3;
		x.save(); x.beginPath(); x.arc(px, py, R, 0, Math.PI*2); x.clip();
		const sw = R*2/M*HI; x.drawImage(hi, px*HI - sw/2, py*HI - sw/2, sw, sw, px - R, py - R, R*2, R*2); x.restore();
		x.strokeStyle = "#8a6a2a"; x.lineWidth = 6; x.beginPath(); x.arc(px, py, R, 0, Math.PI*2); x.stroke();
		x.strokeStyle = "#3a2414"; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.moveTo(px + R*.72, py + R*.72); x.lineTo(px + R*1.25, py + R*1.25); x.stroke();
	};
	draw();
	if(!look) return;
	const move = e => {
		const r = cv.getBoundingClientRect(); at = [(e.clientX - r.left)/r.width*W, (e.clientY - r.top)/r.height*H]; draw();
		const now = performance.now(), inZone = ZONES[look](at[0] - W/2, at[1] - (H/2 + 4));
		if(inZone){ dwell += lastT ? Math.min(120, now - lastT) : 60; if(dwell > 350/SPEED) onSeen && onSeen(); } lastT = now;
	};
	cv.addEventListener("pointermove", move); cv.addEventListener("pointerdown", e => { lastT = 0; move(e); });
	cv.lookAt = (dx, dy) => { for(let i=0;i<8;i++) move({ clientX:cv.getBoundingClientRect().left + (W/2 + dx)/W*cv.getBoundingClientRect().width, clientY:cv.getBoundingClientRect().top + (H/2 + 4 + dy)/H*cv.getBoundingClientRect().height }); };
}
/* vue de dessus, tête en haut : ce qu'il faut observer pour avancer dans la clé */
function drawInsect(x, id){
	const ell = (cx, cy, rx, ry, f, rot=0) => { x.fillStyle = f; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI*2); x.fill(); };
	const line = (pts, w, c) => { x.strokeStyle = c; x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
	const P = {
		velutina:{ wing:"rgba(110,75,35,.34)", edge:"rgba(70,45,20,.75)", leg:"#3a2a1c", tip:"#f2c230", head:"#d98a2a", face:"#e8a43a", thorax:"#1c1a18", seg:["#2a221c", "#2a221c", "#2a221c", "#e8902a", "#e8902a"], line:"#d9a441", n:4 },
		crabro:  { wing:"rgba(200,140,60,.30)", edge:"rgba(140,90,30,.7)", leg:"#8a3a1e", tip:"#9a4a22", head:"#c8701e", face:"#e0b030", thorax:"#8a3a1e", seg:["#7a3518", "#f2c230", "#f2c230", "#f2c230", "#f2c230"], line:"#1f1f1f", n:4 },
		syrphe:  { wing:"rgba(215,232,245,.42)", edge:"rgba(120,140,160,.7)", leg:"#c99a3a", tip:"#c99a3a", head:"#9a2e18", face:"#c86a2a", thorax:"#3a3a24", seg:["#1f1f1f", "#e8902a", "#e8902a", "#e8902a", "#e8902a"], line:"#1f1f1f", n:2 }
	}[id];
	// pattes : trois paires, le dernier article (tarse) a sa propre couleur
	for(const s of [-1, 1]) for(let j=0;j<3;j++){
		const a = [s*14, -40 + j*9], b = [s*46, -56 + j*26], c = [s*60, -62 + j*38], d = [s*66, -66 + j*42];
		line([a, b, c], 4.5, P.leg); line([c, d], 4.5, P.tip);
	}
	// antennes
	for(const s of [-1, 1]) line(id === "syrphe" ? [[s*4, -76], [s*8, -86]] : [[s*6, -74], [s*18, -92], [s*30, -96]], 3, "#2b2b2b");
	// abdomen à anneaux
	x.save(); x.beginPath(); x.ellipse(0, 26, 24, 40, 0, 0, Math.PI*2); x.clip();
	P.seg.forEach((c, i) => { x.fillStyle = c; x.fillRect(-30, -14 + i*16, 60, 16); if(P.line && id === "velutina" && i < 3){ x.fillStyle = P.line; x.fillRect(-30, -14 + i*16 + 13, 60, 3); } });
	if(id === "crabro") for(let i=1;i<5;i++) for(const s of [-1, 1]){ x.fillStyle = "#1f1f1f"; x.beginPath(); x.moveTo(s*4, -14 + i*16); x.lineTo(s*12, -14 + i*16); x.lineTo(s*8, -14 + i*16 + 7); x.fill(); }
	if(id === "syrphe") for(let i=1;i<5;i++){ x.fillStyle = "#1f1f1f"; x.fillRect(-30, -14 + i*16 + 9, 60, 4); x.fillRect(-30, -14 + i*16, 60, 2); }
	x.restore();
	ell(0, -30, 19, 21, P.thorax);
	if(id === "crabro"){ ell(0, -34, 8, 10, "#2a1a10"); }
	if(id === "syrphe"){ x.fillStyle = "rgba(220,200,120,.6)"; for(const s of [-1, 1]) x.fillRect(s*7 - 1.5, -46, 3, 26); }
	// tête : le syrphe a de gros yeux qui se touchent
	if(id === "syrphe"){ ell(0, -60, 20, 13, P.head); line([[0, -72], [0, -50]], 1.5, "#5a1a0a"); }
	else { ell(0, -60, 17, 12, P.head); ell(0, -56, 11, 6, P.face); ell(-11, -62, 5, 8, "#1f1f1f"); ell(11, -62, 5, 8, "#1f1f1f"); }
	// ailes : deux paires chez les Hyménoptères, une seule chez les Diptères (plus deux balanciers)
	for(const s of [-1, 1]){
		x.save(); x.fillStyle = P.wing; x.strokeStyle = P.edge; x.lineWidth = 1.6;
		x.beginPath(); x.ellipse(s*60, -24, 58, 15, s*.22, 0, Math.PI*2); x.fill(); x.stroke();
		x.beginPath(); x.moveTo(s*12, -32); x.lineTo(s*96, -14); x.moveTo(s*30, -28); x.lineTo(s*72, -30); x.stroke();      // nervures
		if(P.n === 4){ x.beginPath(); x.ellipse(s*48, -4, 38, 11, s*.38, 0, Math.PI*2); x.fill(); x.stroke(); }
		else { line([[s*14, -14], [s*20, -8]], 2, "#8a7a5a"); ell(s*21, -7, 3.5, 3.5, "#d9c58f"); }
		x.restore();
	}
}
