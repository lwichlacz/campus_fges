/* « Le dossier de la friche » — mini-jeu de la Licence Administration Économique, Sociale et Environnementale (FGES × ESSLIL, 2026).
   Le métier : chargé·e de mission dans une collectivité. À Marquelle (ville miniature, fictive), la filature Delattre a fermé ;
   le dossier de demande de subvention pour reconvertir la friche part vendredi prochain, après le vote du conseil municipal.
   Chaque geste du métier, sur une vraie pièce, ajoute une pièce au parapheur ; le conseil municipal est le verdict :
   1 · l'enquête de terrain (scène d'ouverture, une minute) : tourner l'aiguille de l'horloge de la ville et interroger
       les habitants là où ils sont, avec des quotas → note d'enquête ;
   2 · le devis : mesurer la cour au mètre ruban sur la maquette, puis entourer la quantité fausse du devis → devis vérifié ;
   3 · la maquette budgétaire : barrer au stylo rouge ce qui est mal imputé (investissement / fonctionnement, règle d'or) ;
   4 · le tour de table des financeurs : tirer chaque aide jusqu'à son plafond, sous la barre légale des 80 %, et rayer
       l'aide d'un échelon qui n'est pas compétent → plan de financement ;
   5 · le projet de délibération : l'assembler dans l'ordre (visas, considérants, articles), sans l'article piège ;
   6 · le conseil municipal : répondre à chaque élu indécis avec la bonne pièce du parapheur, puis le vote.
   Commune, personnes, entreprises et chiffres sont fictifs et simplifiés. Contenus à relire par l'équipe pédagogique
   (docs/validation-licence-aese.md). */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makePerson } from "../kit.js?v=bdcaa97fc1";
import { jpoCard } from "./jpo.js?v=bdcaa97fc1";
import { palier } from "./palier.js?v=bdcaa97fc1";

/* ---------- les cours (disciplines de la licence, fiche fges.fr ; la maquette par année n'est pas encore publiée) ---------- */
const COURSES = {
	enq:   ["Sociologie", "Méthodes d'enquête", "Un échantillon doit ressembler à la population : âges, activités, horaires. Sinon, l'enquête dit ce qu'on veut entendre."],
	env:   ["Sciences de l'environnement", "Transitions et territoires", "Désimperméabiliser, planter, dépolluer : rendre une friche à la ville sans en faire un îlot de chaleur. Et vérifier chaque devis : c'est l'argent public."],
	fin:   ["Économie et gestion", "Finances publiques", "Deux sections, une règle d'or : on n'emprunte que pour investir. Ce qui revient chaque année se paie avec des recettes de chaque année."],
	ess:   ["Économie sociale et solidaire", "Entreprendre autrement", "Une SCIC associe salariés, habitants, associations et la commune : une personne, une voix, et les bénéfices restent dans le projet."],
	inst:  ["Droit public", "Collectivités territoriales", "Commune, intercommunalité, département, région, État, Europe : chacun ses compétences. Depuis la loi NOTRe (2015), les aides aux entreprises reviennent à la région."],
	acte:  ["Droit public", "Actes administratifs", "Visas, considérants, articles : une délibération est un acte juridique. Elle est transmise au préfet, qui en contrôle la légalité."],
	pol:   ["Science politique", "Action publique locale", "Un bon dossier ne suffit pas : il faut une majorité. Écouter chaque élu, répondre à sa crainte, preuve à l'appui."]
};
const STEPS_UI = [["enq", "Enquête"], ["metre", "Devis"], ["budget", "Budget"], ["plan", "Financeurs"], ["delib", "Délibération"], ["conseil", "Conseil"]];
const DAYS = { enq:["Lundi", "9 h", "J−11"], metre:["Mardi", "10 h", "J−10"], budget:["Mercredi", "14 h", "J−9"], plan:["Jeudi", "11 h", "J−8"], delib:["Vendredi", "17 h", "J−7"], conseil:["Jeudi", "19 h", "J−1"], end:["Vendredi", "12 h", "Jour J"] };
const PIECES = [
	{ id:"enq", ic:"📋", n:"Note d'enquête" },
	{ id:"devis", ic:"📐", n:"Devis vérifié" },
	{ id:"budget", ic:"📊", n:"Maquette budgétaire" },
	{ id:"plan", ic:"🤝", n:"Plan de financement" },
	{ id:"delib", ic:"📜", n:"Projet de délibération" }
];
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/[  ]/g, " ");
const euro = v => fr(v) + " €";
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 1 · les habitants : leur profil, leur réponse, où ils sont selon l'heure ---------- */
const CAT = { student:"jeune", senior:"retraite", pro:"actif", casual:"actif" };
const CAT_LABEL = { jeune:"Jeunes (16-25 ans)", actif:"Actifs", retraite:"Retraités" };
const QUOTA = { jeune:2, actif:3, retraite:2 };
const WISH = { tiers:"Un lieu d'activités et d'emplois", jardins:"Des jardins et des arbres", parking:"Un parking", logements:"Des logements", commerces:"Des commerces" };
const SPOT = { M:[-13.5, 1.8], C:[12.5, 9], G:[14, -6], E:[-9.5, 9.5], H1:[-17, -15], H2:[16, 15], H3:[-17, 15], H4:[6, -16], S1:[-4, 7], S2:[5, -12.5], S3:[-6, -12.5], OUT:null };
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
// l'horloge de la ville : quatre moments, et l'angle de l'aiguille des heures sur le cadran
const SLOTS = [["10 h", "le marché", 300], ["13 h", "la pause de midi", 30], ["17 h", "l'école, la gare", 150], ["20 h", "le soir, chez soi", 240]];

/* ---------- 2 · la cour de la filature et son devis ---------- */
const U = 5;                                              // 1 unité de la maquette = 5 m
const COUR = { x0:-6, x1:6, z0:-8.4, z1:-4.4 };           // 60 m × 20 m = 1 200 m²
const DEVIS_PU = 80, DEVIS_Q = 2400, REAL_Q = 1200;
const CELLS = {
	forf: "L'installation de chantier au forfait, c'est normal : clôtures, base de vie, signalisation.",
	pu:   "80 € le m² pour retirer l'enrobé, décompacter et apporter de la terre végétale : c'est dans les prix du marché.",
	arb:  "20 arbres sur la cour : c'est ce que prévoit le projet, un tous les 60 m² environ.",
	pua:  "450 € l'arbre planté, tuteuré et arrosé deux ans : prix courant pour un arbre de 2-3 m."
};

/* ---------- 3 · la maquette budgétaire préparée par l'adjoint aux finances ---------- */
const MAQ = [
	{ id:"etude", sec:"inv", t:"Étude de programmation", v:50000, why:"Une étude qui prépare des travaux s'impute en investissement, avec eux." },
	{ id:"depol", sec:"inv", t:"Dépollution des sols", v:320000, why:"La dépollution remet en état un terrain de la commune : c'est un investissement." },
	{ id:"halle", sec:"inv", t:"Réhabilitation de la halle", v:720000, why:"Rénover un bâtiment qui servira des décennies : investissement." },
	{ id:"cour", sec:"inv", t:"Cour désimperméabilisée (devis vérifié)", v:110000, why:"Des travaux qui durent : investissement." },
	{ id:"equip", sec:"inv", t:"Équipement des ateliers et de la ressourcerie", v:100000, why:"Des machines et des établis qui serviront des années : investissement." },
	{ id:"assur", sec:"inv", t:"Assurance et entretien de la halle", v:24000, an:true, wrong:true, note:"→ fonctionnement : ça revient chaque année" },
	{ id:"chauf", sec:"inv", t:"Chauffage et électricité de la halle", v:16000, an:true, wrong:true, note:"→ fonctionnement : ça revient chaque année" },
	{ id:"loyer", sec:"rec", t:"Loyer versé par la SCIC qui fera vivre le tiers-lieu", v:40000, an:true, why:"C'est la recette qui équilibre le fonctionnement : la SCIC exploite le lieu et paie un loyer à la commune." },
	{ id:"emp", sec:"rec", t:"Emprunt pour l'entretien et le chauffage", v:40000, an:true, wrong:true, note:"Règle d'or : jamais d'emprunt pour le fonctionnement" }
];
const TOTAL = 1300000;                                     // les cinq dépenses d'investissement

/* ---------- 4 · les financeurs, leurs compétences, leurs plafonds ---------- */
const LEVELS = [
	["agglo", "Agglomération", "déchets, eau, bus", "#2a7f8f"],
	["dep", "Département", "social, collèges, communes", "#2c5f9e"],
	["region", "Région", "économie, lycées, TER", "#7a3b69"],
	["etat", "État", "Fonds vert, préfecture", "#4d5b6b"],
	["europe", "Europe", "FEDER, via la Région", "#1f3f8f"]
];
const FUND = [
	{ id:"etat", lv:"etat", n:"État · Fonds vert", d:"Recyclage des friches : dépollution, désimperméabilisation", cap:260000, col:"#4d5b6b" },
	{ id:"feder", lv:"europe", n:"Europe · FEDER", d:"Reconversion des friches industrielles", cap:260000, col:"#1f3f8f" },
	{ id:"region", lv:"region", n:"Région Hauts-de-France", d:"Développement économique : ateliers, emplois", cap:300000, col:"#7a3b69" },
	{ id:"dep", lv:"dep", n:"Département du Nord", d:"Soutien aux investissements des communes", cap:130000, col:"#2c5f9e" },
	{ id:"agglo", lv:"agglo", n:"Agglomération · fonds de concours", d:"Compétence déchets : la ressourcerie", cap:100000, col:"#2a7f8f" }
];
const TRAP = { n:"Département du Nord", d:"Aide directe aux artisans qui loueront les ateliers", v:150000 };
const SCALE = 330000, STEP = 10000, MAXPUB = TOTAL*.8, MAIRE = 300000;    // le maire : pas plus de 300 000 € à la charge de la commune

/* ---------- 5 · les morceaux du projet de délibération ---------- */
const STRIPS = [
	{ id:"vu1", cat:0, t:"Vu le code général des collectivités territoriales ;" },
	{ id:"vu2", cat:0, t:"Vu l'avis de la commission « Transitions et cadre de vie » ;" },
	{ id:"cons1", cat:1, t:"Considérant que la fermeture de la filature Delattre laisse 120 salariés sans emploi et deux hectares de friche polluée ;" },
	{ id:"cons2", cat:1, t:"Considérant que l'enquête menée auprès d'un échantillon d'habitants fait ressortir le besoin d'un lieu d'activités et d'emplois ;" },
	{ id:"art1", cat:2, t:"approuve le projet de reconversion de la friche en tiers-lieu, géré par une SCIC, pour 1 300 000 € HT de travaux ;" },
	{ id:"art2", cat:2, t:"approuve le plan de financement annexé : {AIDES} d'aides publiques, {COMMUNE} à la charge de la commune ;" },
	{ id:"art3", cat:2, t:"autorise le maire à solliciter les subventions, les travaux ne commençant qu'une fois chaque dossier déclaré complet, et à signer toute pièce s'y rapportant." },
	{ id:"trap", cat:2, trap:true, t:"autorise le démarrage immédiat des travaux, sans attendre la réponse des financeurs." }
];
const CAT_NAME = ["les visas (« Vu… »)", "les considérants", "les articles"];

/* ---------- 6 · le conseil municipal : 33 élus, 12 pour, 15 contre, 6 indécis ---------- */
const ELUS = [
	{ n:"Mme Leroy", r:"conseillère, quartier du marché", obj:"J'ai fait le tour du marché samedi : tout le monde réclame un parking !", p:"enq", ok:"Sept habitants choisis par quotas, à toutes les heures… et pas seulement au marché. D'accord." },
	{ n:"M. Dufour", r:"adjoint aux travaux", obj:"Ces entreprises gonflent toujours leurs devis. Qui les a vérifiés ?", p:"devis", ok:"Mesurée au mètre près, et 96 000 € économisés ? Je vous suis." },
	{ n:"Mme Benali", r:"commission des finances", obj:"Et chaque année ? On va emprunter pour chauffer la halle ?", p:"budget", ok:"Le loyer de la SCIC couvre l'entretien et le chauffage, sans emprunt. La règle d'or est tenue." },
	{ n:"M. Vasseur", r:"opposition modérée", obj:"Encore le contribuable de Marquelle qui va tout payer !", p:"plan", ok:"{PCT} % payés par l'État, la Région, l'Europe et les autres… Je vote pour." },
	{ n:"Mme Caron", r:"ancienne juriste", obj:"Attention : si les travaux commencent avant l'accord des financeurs, ils ne paieront rien.", p:"delib", ok:"Aucun démarrage avant que les dossiers soient complets : c'est écrit noir sur blanc. Parfait." },
	{ n:"M. Delcourt", r:"groupe écologiste", obj:"Une friche, c'est du béton. Vous allez en rajouter ?", p:"devis", ok:"1 200 m² rendus à la pleine terre et 20 arbres : là, je signe." }
];
const POUR = 12, SIEGES = 33, MAJ = 17;
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];

const CSS = `
.mf{position:fixed;inset:0;z-index:40;background:#cfe6f5;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#14213d;overflow:hidden;animation:mfIn .4s ease both;user-select:none;-webkit-user-select:none}
@keyframes mfIn{from{opacity:0}}
.mf canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.mf-top{position:absolute;left:0;right:0;top:0;z-index:4;display:flex;gap:8px;align-items:flex-start;padding:calc(env(safe-area-inset-top) + 10px) 12px 0;pointer-events:none}
.mf-top>*{pointer-events:auto}
.mf-cal{background:#fff;border-radius:6px;box-shadow:0 6px 16px rgba(15,49,104,.22);overflow:hidden;text-align:center;min-width:96px}
.mf-cal small{display:block;background:#0f3168;color:#fff;font:700 9.5px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px}
.mf-cal b{display:block;font:300 21px/1.1 "Tiempos Headline",Georgia,serif;margin-top:4px;color:#0f3168}
.mf-cal span{display:block;font-size:12.5px;font-weight:700}
.mf-cal em{display:block;font:700 11px Inter,system-ui,sans-serif;font-style:normal;color:#0f3168;background:#21b7cb;margin-top:4px;padding:2px 0}
.mf-cal.flip{animation:mfFlip .6s ease}
@keyframes mfFlip{0%{transform:rotateX(0)}40%{transform:rotateX(80deg)}100%{transform:rotateX(0)}}
.mf-title{background:rgba(255,255,255,.94);border-radius:8px;padding:6px 12px 7px;box-shadow:0 6px 16px rgba(15,49,104,.18)}
.mf-title small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0f3168;opacity:.75}
.mf-title b{display:block;font:300 18px/1.2 "Tiempos Headline",Georgia,serif;color:#0f3168}
.mf-bord{display:flex;gap:4px;align-items:center;background:rgba(255,255,255,.94);border-radius:8px;padding:5px 7px;box-shadow:0 6px 16px rgba(15,49,104,.18)}
.mf-bord i{font-style:normal;width:30px;height:30px;display:grid;place-items:center;border-radius:5px;border:2px dashed #b7c3d4;font-size:16px;filter:grayscale(1);opacity:.4;transition:all .4s}
.mf-bord i.on{border:2px solid #0f3168;background:#e9f7fa;filter:none;opacity:1}
.mf-bord i.new{animation:mfBump .9s ease}
@keyframes mfBump{0%{transform:scale(1)}35%{transform:scale(1.45)}100%{transform:scale(1)}}
.mf-rat{background:#fff;border-radius:999px;padding:8px 12px;font-weight:700;font-size:13px;color:#c0392b;box-shadow:0 6px 16px rgba(15,49,104,.18);white-space:nowrap}
.mf-rat.bump{animation:mfBump .6s ease}
.mf-x{margin-left:auto;width:42px;height:42px;flex:none;border-radius:50%;border:0;background:#0f3168;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 16px rgba(15,49,104,.25)}
.mf-folder{position:absolute;z-index:3;top:70px;right:14px;bottom:14px;width:420px;background:#0f3168;border-radius:10px;padding:24px 9px 9px;box-sizing:border-box;box-shadow:0 18px 40px rgba(15,49,104,.35);display:flex;flex-direction:column}
.mf-folder:before{content:"Friche Delattre · demande de subvention";position:absolute;left:14px;top:6px;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb}
.mf-folder:after{content:"";position:absolute;right:26px;top:0;bottom:0;width:7px;background:#21b7cb;opacity:.85;pointer-events:none;border-radius:2px}
.mf-sheet{position:relative;flex:1;overflow:auto;background:#fff;border-radius:3px;padding:14px 16px 20px;box-shadow:0 2px 8px rgba(0,0,0,.3);scrollbar-width:thin;overscroll-behavior:contain;overflow-x:hidden;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;z-index:1}
.mf-dh{display:flex;gap:10px;align-items:center;border-bottom:2px solid #0f3168;padding-bottom:8px;margin-bottom:10px}
.mf-blason{flex:none;width:30px;height:34px;background:#0f3168;color:#fff;display:grid;place-items:center;font:300 17px "Tiempos Headline",Georgia,serif;border-radius:3px 3px 15px 15px}
.mf-dh div{flex:1;min-width:0}
.mf-dh small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#56657a}
.mf-dh b{display:block;font:300 18px/1.2 "Tiempos Headline",Georgia,serif;color:#0f3168}
.mf-ref{flex:none;border:2px solid #0f3168;border-radius:4px;padding:2px 7px;font:700 10.5px Inter,system-ui,sans-serif;color:#0f3168;text-align:center}
.mf-postit{background:#fff4a8;padding:9px 11px 10px;margin:4px 2px 12px;box-shadow:0 4px 10px rgba(80,70,0,.18);transform:rotate(-.8deg);font-size:13.5px;line-height:1.45;color:#3a3410}
.mf-postit b.who{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7a6a00;margin-bottom:2px}
.mf-k{font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#56657a;margin:12px 0 4px}
.mf-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#2c3a52}
.mf-ok{color:#1f7a4d;font-weight:700;font-size:13.5px;margin:6px 0}
.mf-ko{color:#c0392b;font-weight:700;font-size:13.5px;margin:6px 0}
.mf-tip{color:#56657a;font-size:13px;margin:6px 0;font-style:italic}
.mf-go{display:block;width:100%;border:0;border-radius:10px;padding:13px;margin-top:12px;background:#0f3168;color:#fff;font:700 15.5px Inter,system-ui,sans-serif;cursor:pointer;min-height:48px}
.mf-go:disabled{opacity:.35;cursor:default}
.mf-alt{display:block;width:100%;border:2px solid #c9d2df;border-radius:10px;padding:11px;margin-top:8px;background:#fff;color:#0f3168;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box;min-height:46px}
.mf-course{border-left:4px solid #21b7cb;background:#e9f7fa;border-radius:0 8px 8px 0;padding:8px 11px;margin:10px 0}
.mf-course small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#0f3168}
.mf-course b{display:block;font:300 16px "Tiempos Headline",Georgia,serif;color:#0f3168;margin:1px 0 2px}
.mf-course span{font-size:13px;color:#2c3a52}
.mf-piece{display:flex;gap:10px;align-items:center;background:#0f3168;color:#fff;border-radius:8px;padding:9px 12px;margin:10px 0;animation:mfUp .5s ease both}
.mf-piece i{font-style:normal;font-size:24px}
.mf-piece small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#21b7cb}
@keyframes mfUp{from{opacity:0;transform:translateY(10px)}}
.mf-enq{display:flex;gap:12px;align-items:center;margin:6px 0 4px}
.mf-clock{flex:none;width:120px;height:120px;touch-action:none;cursor:grab}
.mf-clock:active{cursor:grabbing}
.mf-clock:focus{outline:none}.mf-clock:focus-visible{outline:3px solid #21b7cb;border-radius:50%}
.mf-clock .face{fill:#fffdf6;stroke:#0f3168;stroke-width:3}
.mf-clock .tk{stroke:#9aa7ba;stroke-width:1.5}
.mf-clock .mk{fill:#c9d2df}.mf-clock .mk.on{fill:#21b7cb}
.mf-clock text{font:700 9px Inter,system-ui,sans-serif;fill:#0f3168;text-anchor:middle;dominant-baseline:middle}
.mf-clock .hand{stroke:#0f3168;stroke-width:4.5;stroke-linecap:round}
.mf-clock .hub{fill:#0f3168}
.mf-now{font:300 17px/1.2 "Tiempos Headline",Georgia,serif;color:#0f3168;margin-bottom:6px}
.mf-now small{display:block;font:700 11px Inter,system-ui,sans-serif;color:#56657a}
.mf-quota{display:grid;gap:4px;flex:1;min-width:0}
.mf-quota div{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700}
.mf-quota div span{flex:1}
.mf-quota i{display:inline-block;width:15px;height:15px;border-radius:50%;border:2px solid #9aa7ba}
.mf-quota i.f{background:#0f3168;border-color:#0f3168}
.mf-quote{background:#f4f7fb;border-left:3px solid #0f3168;border-radius:3px;padding:6px 10px;margin:6px 0;font-size:13.5px;animation:mfUp .3s ease both}
.mf-quote b{display:block;font-size:11.5px;font-weight:700;color:#56657a}
.mf-quote.full{border-color:#c0392b}
.mf-bars{display:grid;gap:4px;margin:6px 0}
.mf-bars div{display:grid;grid-template-columns:118px 1fr 22px;gap:6px;align-items:center;font-size:12px;font-weight:700}
.mf-bars em{display:block;height:11px;border-radius:2px;background:#0f3168}
.mf-bars.b em{background:#9aa7ba}
.mf-meas{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0 10px}
.mf-meas div{border:2px dashed #c9d2df;border-radius:6px;padding:6px 8px;font-size:12.5px;font-weight:700;color:#56657a}
.mf-meas div b{display:block;font:300 18px "Tiempos Headline",Georgia,serif;color:#9aa7ba}
.mf-meas div.on{border:2px solid #f2c230;background:#fffbe6}.mf-meas div.on b{color:#0f3168}
.mf-devis{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}
.mf-devis th{font:700 10px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#56657a;text-align:left;border-bottom:1px solid #0f3168;padding:4px 3px}
.mf-devis td{border-bottom:1px dashed #d4dae3;padding:5px 3px;vertical-align:middle}
.mf-devis td:last-child,.mf-devis th:last-child{text-align:right;white-space:nowrap}
.mf-devis tr.tot td{border-bottom:0;border-top:2px solid #0f3168;font-weight:700}
.mf-cell{border:0;background:none;border-bottom:2px dotted #21b7cb;font:300 13px Inter,system-ui,sans-serif;color:#14213d;cursor:pointer;padding:6px 3px;white-space:nowrap;border-radius:2px}
.mf-cell:hover{background:#e9f7fa}
.mf-cell.no{animation:mfShake .35s}
.mf-cell.circ{border:2.5px solid #c0392b;border-radius:50%;padding:4px 6px;color:#8a94a6;text-decoration:line-through}
.mf-fix{font:italic 300 15px "Tiempos Headline",Georgia,serif;color:#c0392b;margin-left:4px;white-space:nowrap}
@keyframes mfShake{0%,100%{transform:none}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.mf-sec{font:700 11px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:#0f3168;padding:4px 8px;margin:12px 0 2px;display:flex;justify-content:space-between}
.mf-sub{font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#56657a;margin:6px 0 0;padding:0 6px}
.mf-line{position:relative;display:flex;justify-content:space-between;gap:10px;padding:10px 6px;border-bottom:1px dashed #d4dae3;touch-action:pan-y;cursor:crosshair;font-size:13.5px;transition:background .2s,color .3s}
.mf-line:hover{background:#fff6f4}
.mf-line b{font-weight:700;white-space:nowrap}
.mf-line:after{content:"";position:absolute;left:4px;top:50%;height:3px;border-radius:2px;background:#c0392b;width:calc(var(--s,0)*(100% - 8px));transform:rotate(-.6deg);pointer-events:none}
.mf-line.struck{color:#8a94a6;cursor:default;background:none}
.mf-line.struck:after{width:calc(100% - 8px);transition:width .2s}
.mf-line.moved{animation:mfUp .5s ease both;background:#f4fbf7}
.mf-line .nt{display:block;font:italic 300 13.5px "Tiempos Headline",Georgia,serif;color:#c0392b}
.mf-line.moved .nt{color:#1f7a4d}
.mf-line.no{animation:mfShake .35s}
.mf-tot{display:flex;justify-content:space-between;font-weight:700;border-top:2px solid #0f3168;padding:6px;font-size:13.5px}
.mf-bal{display:inline-block;border-radius:999px;padding:2px 9px;font:700 11.5px Inter,system-ui,sans-serif;background:#fde3df;color:#c0392b}
.mf-bal.ok{background:#dcf3e6;color:#1f7a4d}
.mf-stack{position:relative;height:30px;display:flex;border-radius:4px;background:#0f3168;margin:30px 0 32px;overflow:visible}
.mf-stack i{display:block;height:100%;transition:width .25s}
.mf-stack i.trap{background:repeating-linear-gradient(45deg,#c0392b 0 6px,#e8a29a 6px 12px)}
.mf-stack .mk{position:absolute;top:-24px;bottom:-4px;width:0;border-left:2px dashed #c0392b}
.mf-stack .mk span{position:absolute;top:0;font:700 10.5px Inter,system-ui,sans-serif;color:#c0392b;white-space:nowrap;transform:translateX(-100%);padding-right:4px}
.mf-stack .mk.m{border-left-color:#0f3168;top:-4px;bottom:-24px}
.mf-stack .mk.m span{top:auto;bottom:0;color:#0f3168}
.mf-stat{display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:700;margin:2px 0 8px;flex-wrap:wrap}
.mf-stat .bad{color:#c0392b}.mf-stat .good{color:#1f7a4d}
.mf-fund{padding:8px 2px 10px;border-bottom:1px dashed #d4dae3}
.mf-fund b{display:block;font-size:13.5px;font-weight:700}
.mf-fund small{display:block;font-size:12px;color:#56657a}
.mf-track{position:relative;height:34px;background:#eef2f6;border-radius:6px;touch-action:none;cursor:ew-resize;margin-top:6px}
.mf-track .fill{position:absolute;left:0;top:0;bottom:0;border-radius:6px 0 0 6px;transition:width .08s}
.mf-track .cap{position:absolute;top:-4px;bottom:-4px;width:3px;background:#c0392b;border-radius:2px}
.mf-track .cap:after{content:"plafond";position:absolute;left:5px;top:-1px;font:700 9.5px Inter,system-ui,sans-serif;color:#c0392b}
.mf-track .cap.hit{animation:mfBump .4s}
.mf-track .knob{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;border:3px solid #0f3168;box-shadow:0 2px 5px rgba(0,0,0,.25)}
.mf-track .v{position:absolute;top:50%;transform:translateY(-50%);font-size:13px;font-weight:700;color:#0f3168;white-space:nowrap}
.mf-track .v.in{color:#fff}
.mf-act{border:1px solid #c9d2df;border-radius:3px;padding:10px 12px;background:#fbfcfe;font:300 13.5px/1.5 "Tiempos Headline",Georgia,serif;color:#14213d;min-height:60px}
.mf-act p{margin:0 0 5px;animation:mfUp .35s ease both}
.mf-act .ph{color:#9aa7ba;font-style:italic}
.mf-act .dc{font-weight:700;letter-spacing:.06em;text-align:center;margin:8px 0}
.mf-strips{display:grid;gap:6px;margin:8px 0}
.mf-strip{display:block;width:100%;text-align:left;border:1px solid #c9d2df;border-radius:4px;background:#fffdf6;padding:9px 11px;font:300 13.5px/1.4 "Tiempos Headline",Georgia,serif;color:#14213d;cursor:pointer;box-shadow:0 2px 0 #c9d2df;transition:transform .15s}
.mf-strip:hover{transform:translateY(-1px)}
.mf-strip.no{animation:mfShake .35s;border-color:#c0392b}
.mf-strip.gone{text-decoration:line-through;color:#c0392b;opacity:.55;pointer-events:none}
.mf-obj{background:#f4f7fb;border-radius:4px 14px 14px 14px;padding:9px 12px;margin:6px 0 10px;font-size:14.5px;line-height:1.45;border:2px solid #0f3168;animation:mfUp .3s ease both}
.mf-obj small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#56657a}
.mf-pcs{display:grid;gap:6px}
.mf-pc{display:flex;gap:9px;align-items:flex-start;text-align:left;border:2px solid #c9d2df;background:#fff;border-radius:8px;padding:8px 10px;font:300 13px/1.35 Inter,system-ui,sans-serif;color:#14213d;cursor:pointer;min-height:48px}
.mf-pc:hover{border-color:#0f3168}
.mf-pc i{font-style:normal;font-size:20px}
.mf-pc b{display:block;font-size:13px;font-weight:700}
.mf-votes{font:300 28px "Tiempos Headline",Georgia,serif;color:#0f3168;margin:4px 0}
.mf-votes small{font:700 12px Inter,system-ui,sans-serif;color:#56657a}
.mf-elus{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0}
.mf-elus span{font-size:11.5px;font-weight:700;border-radius:999px;padding:3px 8px;background:#eef2f6;color:#56657a}
.mf-elus span.y{background:#dcf3e6;color:#1f7a4d}.mf-elus span.n{background:#fde3df;color:#c0392b}
.mf-stamp{display:inline-block;border:3px solid #1f7a4d;color:#1f7a4d;border-radius:6px;padding:5px 12px;font:700 13px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;transform:rotate(-4deg);margin:6px 0 10px;animation:mfStamp .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes mfStamp{from{opacity:0;transform:rotate(-4deg) scale(2.2)}}
.mf-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.mf-tbl td{padding:5px 3px;border-top:1px solid #e3e8ef}.mf-tbl td:last-child{text-align:right;font-weight:700}
.mf-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:4px}
.mf-list li{font-size:13.5px;border-bottom:1px dashed #d4dae3;padding:3px 0}
.mf-list li span{color:#0f3168;font-weight:700;margin-right:6px}
.mf-tape{position:absolute;z-index:2;transform:translate(-50%,-140%);background:#f2c230;color:#14213d;font:700 13px Inter,system-ui,sans-serif;border-radius:6px;padding:3px 8px;pointer-events:none;box-shadow:0 3px 8px rgba(0,0,0,.25);white-space:nowrap}
.mf-steps{position:absolute;left:12px;bottom:12px;z-index:2;display:flex;gap:4px;flex-wrap:wrap;max-width:calc(100% - 470px)}
.mf-steps span{font-size:11.5px;font-weight:700;background:rgba(255,255,255,.85);color:#8a94a6;border-radius:999px;padding:4px 9px}
.mf-steps span.done{color:#0f3168}.mf-steps span.now{background:#0f3168;color:#fff}
@media (max-width:759px){
	.mf-top{gap:6px;padding:calc(env(safe-area-inset-top) + 8px) 8px 0}
	.mf-title,.mf-rat,.mf-steps{display:none}
	.mf-cal{display:flex;align-items:center;gap:6px;min-width:0;padding:0 8px 0 0}
	.mf-cal small{display:none}
	.mf-cal b{font-size:15px;margin:0;padding:8px 0 8px 9px}
	.mf-cal span{font-size:12px}
	.mf-cal em{margin:0;padding:2px 6px;border-radius:999px}
	.mf-bord{padding:4px 5px;gap:3px}
	.mf-bord i{width:26px;height:26px;font-size:14px}
	.mf-x{width:40px;height:40px}
	.mf-folder{left:0;right:0;bottom:0;top:auto;width:auto;height:54%;border-radius:14px 14px 0 0;padding:22px 5px 0}
	.mf-folder:after{right:18px}
	.mf-sheet{padding:12px 12px 26px;border-radius:3px 3px 0 0}
	.mf-dh{padding-bottom:6px;margin-bottom:8px}.mf-dh b{font-size:16px}
	.mf-postit{font-size:13px;padding:8px 10px}
	.mf-bars div{grid-template-columns:104px 1fr 20px}
}`;

export function openMarquelle({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("mf-css")){ const st = document.createElement("style"); st.id = "mf-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "mf";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le dossier de la friche");
	root.innerHTML = `<canvas aria-hidden="true"></canvas>
		<div class="mf-top">
			<div class="mf-cal" aria-live="polite"><small>Mairie de Marquelle</small><b data-day>Lundi</b><span data-hour>9 h</span><em data-j>J−11</em></div>
			<div class="mf-title"><small>Chargé·e de mission</small><b>Le dossier de la friche</b></div>
			<div class="mf-bord" aria-label="Pièces du parapheur">${PIECES.map(p => `<i data-p="${p.id}" title="${p.n}">${p.ic}</i>`).join("")}</div>
			<span class="mf-rat" title="Ratures sur le dossier : chaque erreur en laisse une">✎ Ratures <b data-rat>0</b></span>
			<button class="mf-x" aria-label="Quitter le jeu">×</button>
		</div>
		<div class="mf-steps">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div>
		<div class="mf-folder"><div class="mf-sheet"></div></div>
		<div class="mf-tape" hidden></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const canvas = $("canvas"), sheet = $(".mf-sheet"), folder = $(".mf-folder"), tapeTag = $(".mf-tape");
	const fresh = () => ({ rat:0, learned:new Set(), pieces:new Set(), slot:0, met:[], full:0, enqDone:false, top:"tiers", topN:0,
		meas:{ L:0, W:0 }, devisOK:false, struck:new Set(), amounts:{}, trapStruck:false, placed:[], elus:{}, votes:0, adopted:false, stepRat:0 });
	const S = fresh();
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };
	const MOB = () => innerWidth < 760;

	/* ================= la ville miniature ================= */
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#cfe6f5"); scene.fog = new THREE.Fog("#cfe6f5", 140, 320);
	const camera = new THREE.PerspectiveCamera(38, 1, .5, 500);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 12; controls.maxDistance = 240; controls.maxPolarAngle = 1.2; controls.minPolarAngle = .2;
	const hemi = new THREE.HemisphereLight("#ffffff", "#8a9a7a", 1.25); scene.add(hemi);
	const sun = new THREE.DirectionalLight("#fff3dc", 2); sun.position.set(-20, 40, 18); sun.castShadow = true;
	const SH = innerWidth < 760 ? 1024 : 2048;
	sun.shadow.mapSize.set(SH, SH); Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30, near:1, far:120 }); sun.shadow.bias = -.0006; scene.add(sun);
	const own = [];
	const M = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color:c, roughness:.85, flatShading:true, ...o }); own.push(m); return m; };
	const G = g => (own.push(g), g);
	function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
	const box = (w, h, d, c, x, y, z, parent) => mesh(G(new THREE.BoxGeometry(w, h, d)), typeof c === "string" ? M(c) : c, x, y + h/2, z, parent);
	function roof(w, d, h, c, x, y, z, parent = scene){
		const s = new THREE.Shape(); s.moveTo(-d/2, 0); s.lineTo(d/2, 0); s.lineTo(0, h); s.closePath();
		const g = G(new THREE.ExtrudeGeometry(s, { depth:w, bevelEnabled:false })); g.translate(0, 0, -w/2); g.rotateY(Math.PI/2);
		return mesh(g, typeof c === "string" ? M(c) : c, x, y, z, parent);
	}
	function label(text, o = {}){
		const c = document.createElement("canvas"), x = c.getContext("2d"), f = `700 40px Inter, system-ui, sans-serif`;
		x.font = f; const w = Math.ceil(x.measureText(text).width) + 36, h = 62; c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "#ffffff"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, 12); x.fill();
		x.fillStyle = o.fg || "#0f3168"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 2);
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, sizeAttenuation:false }));
		const s = (o.size || .03)*(innerWidth < 760 ? .6 : 1); sp.scale.set(s*w/h, s, 1); sp.renderOrder = 20; own.push(t, sp.material);
		return sp;
	}

	// le socle, les rues
	const town = new THREE.Group(); scene.add(town);
	box(48, 1.2, 48, "#6f8f5a", 0, -1.2, 0, town);
	box(48.4, .4, 48.4, "#5a4a36", 0, -1.6, 0, town);
	for(const [w, d, x, z] of [[48, 2.4, 0, -9.6], [48, 2.4, 0, 5.6], [2.4, 48, -9, 0], [2.4, 48, 9, 0]]) box(w, .06, d, "#8d9196", x, 0, z, town);
	// la filature : une halle de briques, un toit en dents de scie, une cheminée
	const usine = new THREE.Group(); scene.add(usine);
	box(13, 3.4, 8.2, "#a0523d", 0, 0, 0, usine);
	for(let i = 0; i < 5; i++){ const r = roof(8.2, 2.6, 1.4, "#5d4a40", -5.2 + i*2.6, 3.4, 0, usine); r.rotation.y = Math.PI/2; }
	mesh(G(new THREE.CylinderGeometry(.55, .75, 10, 10)), M("#8f4535"), 5.6, 5, 3.2, usine);
	for(let i = 0; i < 6; i++) box(1.2, 1.4, .1, "#3a4652", -5 + i*2, 1, 4.12, usine);
	const signOld = label("FILATURE DELATTRE · FERMÉE", { bg:"#7a2e1e", fg:"#fff", size:.026 }); signOld.position.set(0, 6.4, 0); usine.add(signOld);
	const signNew = label("TIERS-LIEU DE LA FILATURE", { bg:"#0f3168", fg:"#fff", size:.028 }); signNew.position.set(0, 6.4, 0); signNew.visible = false; usine.add(signNew);
	// la cour bétonnée de la filature (au nord de la halle), ses fissures et ses herbes folles ; la version désimperméabilisée
	const cour = new THREE.Group(); scene.add(cour);
	box(COUR.x1 - COUR.x0, .05, COUR.z1 - COUR.z0, "#a9a59c", (COUR.x0 + COUR.x1)/2, 0, (COUR.z0 + COUR.z1)/2, cour);
	for(const [x, z] of [[-4.6, -7.6], [-1.2, -5.2], [2.4, -7.9], [4.9, -5.6], [.6, -6.8]]) mesh(G(new THREE.ConeGeometry(.16, .4, 5)), M("#6f8f3a"), x, .25, z, cour);
	for(const [x, z, l, r] of [[-3, -6, 2.6, .5], [3, -7, 2, -.7], [0, -5.2, 1.6, .2]]){ const k = box(l, .02, .06, "#6c6a64", x, .05, z, cour); k.rotation.y = r; }
	const after = new THREE.Group(); scene.add(after); after.visible = false;
	box(COUR.x1 - COUR.x0 - .2, .08, COUR.z1 - COUR.z0 - .2, "#6aa84f", (COUR.x0 + COUR.x1)/2, 0, (COUR.z0 + COUR.z1)/2, after);
	for(let i = 0; i < 10; i++){ const x = COUR.x0 + .9 + (i % 5)*2.55, z = i < 5 ? -7.6 : -5.2; mesh(G(new THREE.CylinderGeometry(.08, .1, .7, 6)), M("#6b4a2e"), x, .45, z, after); mesh(G(new THREE.IcosahedronGeometry(.55, 0)), M("#2e7d4f"), x, 1.15, z, after); }
	// la mairie, le marché, l'école, la gare, le café
	const mairie = new THREE.Group(); mairie.position.set(0, 0, -15.5); scene.add(mairie);
	box(9, 4.4, 4.4, "#f1e7d0", 0, 0, 0, mairie); roof(9, 4.6, 1.8, "#4a5560", 0, 4.4, 0, mairie);
	box(1.6, 1.6, .2, "#fffdf7", 0, 5.4, 2.3, mairie); mesh(G(new THREE.CylinderGeometry(.05, .05, 3, 6)), M("#555"), 3.8, 6, 1.6, mairie);
	box(.9, .2, .02, "#0055a4", 4.25, 7.1, 1.6, mairie); box(.9, .2, .02, "#ffffff", 4.25, 6.9, 1.6, mairie); box(.9, .2, .02, "#ef4135", 4.25, 6.7, 1.6, mairie);
	// l'horloge de la mairie : son aiguille suit celle du cadran de l'enquête
	const clockHand = box(.12, .62, .05, "#0f3168", 0, 0, 0); clockHand.geometry.translate(0, .26, 0); mairie.add(clockHand); clockHand.position.set(0, 6.2, 2.42);
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
	const houseCols = ["#efe3cf", "#e9d8b0", "#f3ede0", "#dcc7a8", "#e8dccb"], roofCols = ["#a0523d", "#8f4535", "#4a5560", "#b0603f"];
	const houseAt = [];
	for(let x = -21; x <= 21; x += 4.2) for(const z of [-21, 21]) houseAt.push([x, z]);
	for(let z = -16; z <= 16; z += 4.2) for(const x of [-21.5, 21.5]) houseAt.push([x, z]);
	houseAt.push([-7.5, -15.5], [4.5, 15], [-3.5, 14.5]);
	houseAt.forEach(([x, z], i) => { if(Math.abs(z) < 3 && Math.abs(x) > 20) return; const h = 2.2 + (i % 3)*.5; box(3, h, 3, houseCols[i % 5], x, 0, z, town); roof(3.2, 3.2, 1.3, roofCols[i % 4], x, h, z, town); });
	for(const [x, z] of [[-6, 10], [6, 11], [-17, -10], [17, 4], [-4, -12.5], [11, -14], [19, -18], [-19, 7], [1.5, 17.4]]){ mesh(G(new THREE.CylinderGeometry(.15, .2, 1.2, 6)), M("#6b4a2e"), x, .6, z); mesh(G(new THREE.IcosahedronGeometry(1.1, 0)), M("#4f7a45"), x, 1.9, z); }

	/* --- les habitants --- */
	const people = PEOPLE.map(([kind, name, wish, quote, spots], i) => {
		const p = makePerson(scene, false, kind); p.g.scale.multiplyScalar(1.45);
		const hit = new THREE.Mesh(G(new THREE.CylinderGeometry(.75, .75, 2.8, 8)), new THREE.MeshBasicMaterial({ visible:false })); own.push(hit.material); hit.position.y = 1.2; p.g.add(hit);
		const mark = label("✓", { bg:"#1f7a4d", fg:"#fff", size:.026 }); mark.position.y = 2.9; mark.visible = false; p.g.add(mark);
		return { i, kind, cat:CAT[kind], name, wish, quote, spots, p, hit, mark, from:new THREE.Vector3(), to:new THREE.Vector3(), t:1 };
	});
	function spotOf(h, slot, n){
		const k = h.spots[slot]; if(k === "OUT") return null;
		const [x, z] = SPOT[k], r = n ? 1.35*Math.sqrt(n + .5) : 0, a = n*2.39996;
		return new THREE.Vector3(x + Math.cos(a)*r, 0, z + Math.sin(a)*r);
	}
	function placeAll(slot, instant){
		const count = {};
		for(const h of people){
			const k = h.spots[slot], n = count[k] = (count[k] ?? -1) + 1;
			const to = spotOf(h, slot, n);
			if(!to){ h.p.g.visible = false; h.t = 1; continue; }
			if(!h.p.g.visible || instant){ h.p.g.visible = true; h.p.g.position.copy(to); h.t = 1; continue; }
			h.from.copy(h.p.g.position); h.to.copy(to); h.t = 0;
		}
	}
	placeAll(0, true);

	/* --- les échelons, sous la ville --- */
	const plates = new THREE.Group(); scene.add(plates); plates.visible = false;
	const PL = {};
	LEVELS.forEach(([k, name, comp, col], i) => {
		const r = 27 + i*6.2, y = -2.2 - i*2.4;
		const mat = M(col, { roughness:.6 });
		const m = mesh(G(new THREE.CylinderGeometry(r, r + .8, 1.6, 48)), mat, 0, y, 0, plates); m.receiveShadow = true;
		const l = label(`${name} · ${comp}`, { bg:col, fg:"#fff", size:.026 }); l.position.set(0, y + 1.1, r - .6); plates.add(l);
		PL[k] = { m, mat, col:new THREE.Color(col), y, r, l, name, comp, colS:col, amt:null };
	});
	function plateAmount(lv, v){
		const P = PL[lv]; if(!P) return;
		if(P.amt === v) return; P.amt = v;
		P.mat.emissive = P.col.clone(); P.mat.emissiveIntensity = v > 0 ? .45 : 0;
		const old = P.l, l = label(v > 0 ? `${P.name} · + ${euro(v)}` : `${P.name} · ${P.comp}`, v > 0 ? { bg:"#21b7cb", fg:"#0f3168", size:.028 } : { bg:P.colS, fg:"#fff", size:.026 });
		l.position.copy(old.position); plates.remove(old); plates.add(l); P.l = l;      // l'ancienne texture est libérée à la fermeture (liste own)
	}

	/* --- le mètre ruban --- */
	const tapeG = new THREE.Group(); scene.add(tapeG);
	const tapeMat = new THREE.MeshBasicMaterial({ color:"#f2c230" }); own.push(tapeMat);
	const TAPEGEO = G(new THREE.BoxGeometry(1, .06, .24));
	const ENDGEO = G(new THREE.CylinderGeometry(.18, .18, .1, 12));
	function placeTape(t, a, b){
		const dx = b.x - a.x, dz = b.z - a.z, L = Math.max(.01, Math.hypot(dx, dz));
		t.bar.scale.set(L, 1, 1); t.bar.position.set((a.x + b.x)/2, .12, (a.z + b.z)/2); t.bar.rotation.y = Math.atan2(-dz, dx);
		t.e0.position.set(a.x, .12, a.z); t.e1.position.set(b.x, .12, b.z);
	}
	function newTape(){ const t = { bar:new THREE.Mesh(TAPEGEO, tapeMat), e0:new THREE.Mesh(ENDGEO, tapeMat), e1:new THREE.Mesh(ENDGEO, tapeMat) }; tapeG.add(t.bar, t.e0, t.e1); return t; }
	const CORNERS = [[COUR.x0, COUR.z0], [COUR.x1, COUR.z0], [COUR.x0, COUR.z1], [COUR.x1, COUR.z1]].map(([x, z]) => new THREE.Vector3(x, 0, z));
	function snap(p){ p = new THREE.Vector3(Math.max(COUR.x0, Math.min(COUR.x1, p.x)), 0, Math.max(COUR.z0, Math.min(COUR.z1, p.z))); let best = null, d = 1.6; for(const c of CORNERS){ const k = Math.hypot(c.x - p.x, c.z - p.z); if(k < d){ d = k; best = c; } } return best ? best.clone() : p; }

	/* --- l'hémicycle du conseil municipal --- */
	const hall = new THREE.Group(); hall.position.set(0, 0, -70); scene.add(hall); hall.visible = false;
	mesh(G(new THREE.CylinderGeometry(20, 20, .4, 48)), M("#a9876a"), 0, -.2, 0, hall);
	box(30, 3, .6, "#efe3cf", 0, 0, -12, hall); box(4, 1.4, 2, "#6b4a2e", 0, 0, -8, hall);
	box(.9, .2, .02, "#0055a4", -1.2, 2.4, -11.65, hall); box(.9, .2, .02, "#ffffff", -1.2, 2.2, -11.65, hall); box(.9, .2, .02, "#ef4135", -1.2, 2, -11.65, hall);
	const flagM = label("Conseil municipal de Marquelle", { size:.028 }); flagM.position.set(0, 4.2, -12); hall.add(flagM);
	const seats = [];
	{
		const pos = [];
		[[7, 9], [10.5, 11], [14, 13]].forEach(([r, n]) => { for(let i = 0; i < n; i++){ const a = Math.PI*(.1 + .8*i/(n - 1)); pos.push([Math.cos(a)*r, -8 + Math.sin(a)*r, a]); } });
		pos.sort((p, q) => q[2] - p[2]);      // de gauche (angle grand) à droite
		const undIdx = [6, 11, 15, 19, 23, 28];
		let pour = POUR;
		pos.forEach(([x, z], i) => {
			const u = undIdx.indexOf(i);
			const k = u >= 0 ? "ind" : pour-- > 0 ? "pour" : "contre";
			const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(0 - x, -8 - z); hall.add(g);
			box(1.2, .5, 1, "#6b4a2e", 0, 0, 0, g);
			const p = makePerson(g, true, ["pro", "senior", "casual", "pro"][i % 4]); p.g.position.set(0, .1, .1); p.g.scale.multiplyScalar(.8);
			const chip = mesh(G(new THREE.CylinderGeometry(.35, .35, .12, 16)), new THREE.MeshBasicMaterial({ color:"#9aa1aa" }), 0, 2.6, 0, g); own.push(chip.material);
			let tag = null, tagOk = null, tagNo = null;
			if(u >= 0){
				tag = label("?", { bg:"#21b7cb", fg:"#0f3168", size:.03 }); tag.position.y = 3.5; g.add(tag);
				tagOk = label("✓", { bg:"#1f7a4d", fg:"#fff", size:.03 }); tagOk.position.y = 3.5; tagOk.visible = false; g.add(tagOk);
				tagNo = label("✗", { bg:"#c0392b", fg:"#fff", size:.03 }); tagNo.position.y = 3.5; tagNo.visible = false; g.add(tagNo);
			}
			const hit = new THREE.Mesh(G(new THREE.CylinderGeometry(1, 1, 3.4, 8)), new THREE.MeshBasicMaterial({ visible:false })); own.push(hit.material); hit.position.y = 1.5; g.add(hit);
			seats.push({ i, g, p, chip, tag, tagOk, tagNo, hit, k, u });
		});
	}
	function paintSeats(){
		for(const s of seats){
			const st = s.u >= 0 ? S.elus[s.u] : null;
			s.chip.material.color.set(s.k === "pour" || st === "y" ? "#1f7a4d" : s.k === "contre" || st === "n" ? "#c0392b" : "#9aa1aa");
			if(s.tag){ s.tag.visible = !st; s.tagOk.visible = st === "y"; s.tagNo.visible = st === "n"; }
		}
	}

	/* --- caméra, décalage sous la chemise --- */
	let cam = null;
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	let lastFly = null, lastAspect = 0;
	function fly(target, dist, polar = .85, az = .35, dur = 1.6){ lastFly = [target, dist, polar, az];
		const t1 = target.clone(), p1 = new THREE.Vector3(Math.sin(polar)*Math.sin(az), Math.cos(polar), Math.sin(polar)*Math.cos(az)).multiplyScalar(Math.min(controls.maxDistance, dist*(camera.aspect < 1 ? Math.min(3.6, 1.1/camera.aspect) : 1))).add(t1);
		cam = { k:0, dur, p0:camera.position.clone(), t0:controls.target.clone(), p1, t1 };
	}
	let VO = "";
	function resize(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		if(w < 760){ const d = Math.min(h*.54, folder.offsetHeight + 4); camera.setViewOffset(w, h + d, 0, d, w, h); VO = "b" + d; }
		else { const pw = 440; camera.setViewOffset(w + pw, h, pw, 0, w, h); VO = "r"; }
		camera.updateProjectionMatrix();
		if(lastFly && Math.abs(camera.aspect - lastAspect) > .05){ lastAspect = camera.aspect; fly(...lastFly, .5); }
		lastAspect = camera.aspect;
	}
	addEventListener("resize", resize); resize();
	camera.position.set(22, 30, 34); controls.target.set(0, 0, 0);
	function sky(evening){
		const c = evening ? "#25365a" : "#cfe6f5"; scene.background.set(c); scene.fog.color.set(c);
		hemi.intensity = evening ? .95 : 1.25; sun.intensity = evening ? 1.1 : 2; sun.color.set(evening ? "#ffd8a8" : "#fff3dc");
	}

	/* --- toucher, mesurer --- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.05);
	let onTap = null, tapTargets = () => [], down = null, tapeMode = false, tape = null, onMeasure = null;
	const setRay = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); };
	const groundAt = e => { setRay(e); return ray.ray.intersectPlane(ground, new THREE.Vector3()); };
	const toScreen = v => { const p = v.clone().project(camera), r = canvas.getBoundingClientRect(); return { x:(p.x + 1)/2*r.width, y:(1 - p.y)/2*r.height }; };
	function showTapeTag(a, b){
		const L = Math.hypot(b.x - a.x, b.z - a.z)*U, s = toScreen(new THREE.Vector3((a.x + b.x)/2, .2, (a.z + b.z)/2));
		tapeTag.hidden = false; tapeTag.textContent = fr(L) + " m"; tapeTag.style.left = s.x + "px"; tapeTag.style.top = s.y + "px";
	}
	canvas.addEventListener("pointerdown", e => {
		down = { x:e.clientX, y:e.clientY };
		if(!tapeMode) return;
		const p = groundAt(e); if(!p) return;
		if(p.x < COUR.x0 - 2 || p.x > COUR.x1 + 2 || p.z < COUR.z0 - 2 || p.z > COUR.z1 + 2) return;
		const a = snap(p); tape = { a, b:a.clone(), t:newTape() }; placeTape(tape.t, a, a);
		canvas.setPointerCapture(e.pointerId); play("clic");
	});
	canvas.addEventListener("pointermove", e => {
		if(!tape) return; const p = groundAt(e); if(!p) return;
		tape.b = snap(p); placeTape(tape.t, tape.a, tape.b); showTapeTag(tape.a, tape.b);
	});
	canvas.addEventListener("pointerup", e => {
		if(tape){ const t = tape; tape = null; tapeTag.hidden = true; onMeasure && onMeasure(t); down = null; return; }
		if(!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10){ down = null; return; }
		down = null; if(!onTap) return;
		setRay(e);
		const list = tapTargets(), h = ray.intersectObjects(list.map(t => t.hit), false)[0];
		const t = h && list.find(q => q.hit === h.object);
		onTap(t ? t.id : null);
	});

	/* --- la boucle --- */
	let raf = 0, last = performance.now();
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
		const aim = -SLOTS[S.slot][2]*Math.PI/180;      // l'aiguille de l'horloge de la mairie rattrape le cadran
		clockHand.rotation.z += (aim - clockHand.rotation.z)*Math.min(1, dt*5);
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		if(innerWidth < 760 && VO !== "b" + Math.min(innerHeight*.54, folder.offsetHeight + 4)) resize();
		controls.update();
		renderer.render(scene, camera);
	}

	/* ================= la chemise, le parapheur, les ratures ================= */
	let cur = "enq";
	function stage(k, title){
		cur = k; timers.forEach(clearTimeout); timers.clear();      // rien de l'étape précédente ne doit écrire dans la nouvelle feuille
		const ki = STEPS_UI.findIndex(x => x[0] === k);
		root.querySelectorAll(".mf-steps span").forEach((s, i) => { s.className = ki < 0 ? "done" : i < ki ? "done" : i === ki ? "now" : ""; });
		const [d, h, j] = DAYS[k]; $("[data-day]").textContent = d; $("[data-hour]").textContent = h; $("[data-j]").textContent = j;
		const cal = $(".mf-cal"); cal.classList.remove("flip"); void cal.offsetWidth; cal.classList.add("flip");
		ev("stage", title); S.stepRat = 0; onTap = null; tapTargets = () => []; tapeMode = false; onMeasure = null; tapeTag.hidden = true;
		controls.enabled = true; signOld.visible = true; signNew.visible = false; after.visible = false; cour.visible = true;
	}
	const hud = () => { $("[data-rat]").textContent = S.rat; };
	function err(why){ S.rat++; S.stepRat++; hud(); const r = $(".mf-rat"); r.classList.remove("bump"); void r.offsetWidth; r.classList.add("bump"); play("bad"); ev("err", why); }
	function course(k){ const [d, n, t] = COURSES[k]; S.learned.add(k); return `<div class="mf-course"><small>En licence AESe · ${d}</small><b>${n}</b><span>${t}</span></div>`; }
	function addPiece(id){
		S.pieces.add(id); play("stamp");
		const el = root.querySelector(`.mf-bord [data-p="${id}"]`); el.classList.add("on", "new"); later(1000, () => el.classList.remove("new"));
		const p = PIECES.find(q => q.id === id);
		return `<div class="mf-piece"><i>${p.ic}</i><div><small>Agrafée au parapheur</small><b>${p.n}</b></div></div>`;
	}
	const head = (t, ref) => `<div class="mf-dh"><span class="mf-blason" aria-hidden="true">M</span><div><small>Ville de Marquelle · Pôle développement</small><b>${t}</b></div><span class="mf-ref">${ref}</span></div>`;
	const postit = t => `<div class="mf-postit"><b class="who">Sophie · directrice générale des services</b>${t}</div>`;
	function show(html){ sheet.innerHTML = html; sheet.scrollTop = 0; }
	const live = () => sheet.querySelector("[data-live]");
	const append = html => { const el = live(); if(el){ el.insertAdjacentHTML("beforeend", html); later(30, () => el.lastElementChild && el.lastElementChild.scrollIntoView({ block:"nearest", behavior:"smooth" })); } };
	const next = (k, t) => `<button class="mf-go" data-next="${k}">${t}</button>`;
	sheet.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });
	const stepStars = () => S.stepRat === 0 ? "Sans rature." : S.stepRat === 1 ? "Une rature." : S.stepRat + " ratures.";

	// le geste du stylo rouge : glisser le doigt (ou la souris) sur une ligne pour la barrer
	function strikeable(el, cb){
		let x0 = null, w = 1;
		el.addEventListener("pointerdown", e => { if(el.classList.contains("struck") || el.classList.contains("moved")) return; x0 = e.clientX; w = el.getBoundingClientRect().width; try { el.setPointerCapture(e.pointerId); } catch(_){} });
		el.addEventListener("pointermove", e => { if(x0 === null) return; el.style.setProperty("--s", Math.max(0, Math.min(1, (e.clientX - x0)/(w*.55)))); });
		el.addEventListener("pointerup", e => {
			if(x0 === null) return; const k = (e.clientX - x0)/(w*.55); x0 = null;
			if(k >= .8){ el.style.setProperty("--s", 1); cb(el); }
			else { el.style.setProperty("--s", 0); if(Math.abs(k) < .06) append(`<p class="mf-tip">✎ Pour barrer une ligne, glisse le doigt dessus, de gauche à droite.</p>`); }
		});
		el.addEventListener("pointercancel", () => { x0 = null; el.style.setProperty("--s", 0); });
	}

	/* ---------- 1 · l'enquête de terrain : l'horloge, les habitants, les quotas (scène d'ouverture) ---------- */
	function enq(){
		stage("enq", "1 · L'enquête de terrain");
		sky(false); town.visible = true; usine.visible = true; cour.visible = true; plates.visible = false; hall.visible = false;
		S.met = []; S.full = 0; S.slot = 0; for(const h of people) h.mark.visible = false; placeAll(0, true);
		fly(new THREE.Vector3(MOB() ? 0 : 1.5, 0, MOB() ? -1 : 1), MOB() ? 50 : 55, .88, .3);
		const first = !S.enqDone;
		show(`${head("Note d'enquête · reconversion de la friche", "Pièce 1")}
			<div class="mf-enq">
				<svg class="mf-clock" viewBox="-60 -60 120 120" role="slider" aria-label="Heure de l'enquête" aria-valuetext="10 h" tabindex="0">
					<circle class="face" r="56"/>
					${Array.from({ length:12 }, (_, i) => { const a = i*Math.PI/6; return `<line class="tk" x1="${Math.sin(a)*47}" y1="${-Math.cos(a)*47}" x2="${Math.sin(a)*52}" y2="${-Math.cos(a)*52}"/>`; }).join("")}
					${SLOTS.map(([h, , deg], i) => { const a = deg*Math.PI/180; return `<circle class="mk" data-mk="${i}" cx="${Math.sin(a)*36}" cy="${-Math.cos(a)*36}" r="10"/><text x="${Math.sin(a)*36}" y="${-Math.cos(a)*36 + .5}">${h.replace(" h", "")}</text>`; }).join("")}
					<line class="hand" x1="0" y1="0" x2="0" y2="-26"/><circle class="hub" r="5"/>
				</svg>
				<div style="flex:1;min-width:0"><div class="mf-now" data-now></div><div class="mf-quota" data-quota></div></div>
			</div>
			${postit(first ? `Bienvenue dans l'équipe ! La filature a fermé : <b>120 emplois</b>, deux hectares de friche. Le dossier de subvention part <b>vendredi prochain</b>, après le vote du conseil. D'abord, on écoute la ville. <b>Tourne l'aiguille</b> pour changer d'heure, et <b>touche les habitants</b> pour les interroger. Respecte les quotas : ton échantillon doit ressembler à Marquelle.` : `On refait l'enquête : tourne l'aiguille et touche les habitants, là où ils sont.`)}
			<div data-live></div>`);
		const svg = sheet.querySelector(".mf-clock"), hand = svg.querySelector(".hand");
		let angle = SLOTS[S.slot][2];
		const setHand = a => { angle = a; hand.setAttribute("transform", `rotate(${a})`); };
		const nearest = a => { let best = 0, d = 999; SLOTS.forEach(([, , deg], i) => { const k = Math.abs(((a - deg + 540) % 360) - 180); if(k < d){ d = k; best = i; } }); return best; };
		const paintClock = () => {
			svg.querySelectorAll(".mk").forEach(m => m.classList.toggle("on", +m.dataset.mk === S.slot));
			svg.setAttribute("aria-valuetext", SLOTS[S.slot][0]);
			sheet.querySelector("[data-now]").innerHTML = `${SLOTS[S.slot][0]}<small>${SLOTS[S.slot][1]}</small>`;
			const n = { jeune:0, actif:0, retraite:0 }; for(const i of S.met) n[people[i].cat]++;
			sheet.querySelector("[data-quota]").innerHTML = Object.keys(QUOTA).map(c => `<div><span>${CAT_LABEL[c]}</span>${Array.from({ length:QUOTA[c] }, (_, j) => `<i class="${j < n[c] ? "f" : ""}"></i>`).join("")}</div>`).join("");
		};
		const goSlot = s => { setHand(SLOTS[s][2]); if(s === S.slot) return; S.slot = s; play("swipe"); placeAll(s); paintClock(); };
		const angleOf = e => { const r = svg.getBoundingClientRect(); return (Math.atan2(e.clientX - (r.left + r.width/2), -(e.clientY - (r.top + r.height/2)))*180/Math.PI + 360) % 360; };
		let dragging = false;
		svg.addEventListener("pointerdown", e => { dragging = true; try { svg.setPointerCapture(e.pointerId); } catch(_){} setHand(angleOf(e)); });
		svg.addEventListener("pointermove", e => { if(dragging) setHand(angleOf(e)); });
		svg.addEventListener("pointerup", e => { if(!dragging) return; dragging = false; goSlot(nearest(angleOf(e))); });
		svg.addEventListener("pointercancel", () => { dragging = false; setHand(SLOTS[S.slot][2]); });
		svg.addEventListener("keydown", e => { if(e.key === "ArrowRight" || e.key === "ArrowUp"){ e.preventDefault(); goSlot((S.slot + 1) % 4); } if(e.key === "ArrowLeft" || e.key === "ArrowDown"){ e.preventDefault(); goSlot((S.slot + 3) % 4); } });
		setHand(angle); paintClock();
		S.goSlot = goSlot;
		tapTargets = () => people.filter(h => h.p.g.visible).map(h => ({ id:h.i, hit:h.hit }));
		onTap = id => {
			if(id === null || id === undefined) return;
			const h = people[id];
			if(S.met.includes(id)){ append(`<div class="mf-quote"><b>${h.name}</b>Déjà interrogé·e.</div>`); return; }
			const n = S.met.filter(i => people[i].cat === h.cat).length;
			if(n >= QUOTA[h.cat]){ play("bad"); S.full++; append(`<div class="mf-quote full"><b>${h.name} · quota « ${CAT_LABEL[h.cat]} » déjà rempli</b>Il te manque d'autres profils : tourne l'aiguille, va où ils sont.</div>`); return; }
			S.met.push(id); h.mark.visible = true; play("pop"); paintClock();
			append(`<div class="mf-quote"><b>${h.name} · ${CAT_LABEL[h.cat]}</b>« ${h.quote} »</div>`);
			if(S.met.length === 7){ onTap = null; later(700, done); }
		};
		function done(){
			play("chime");
			const tally = {}; for(const i of S.met){ const w = people[i].wish; tally[w] = (tally[w] || 0) + 1; }
			const market = people.filter(h => h.spots[0] === "M"), mt = {}; for(const h of market) mt[h.wish] = (mt[h.wish] || 0) + 1;
			const keys = Object.keys(WISH), top = keys.slice().sort((a, b) => (tally[b] || 0) - (tally[a] || 0))[0];
			S.top = top; S.topN = tally[top] || 0;
			append(`<p class="mf-p"><b>Ton échantillon par quotas</b> (7 habitants) :</p>
				<div class="mf-bars">${keys.map(k => `<div><span>${WISH[k]}</span><em style="width:${(tally[k] || 0)/7*100}%"></em><b>${tally[k] || 0}</b></div>`).join("")}</div>
				<p class="mf-p"><b>Si tu n'avais interrogé que le marché de 10 h</b> (${market.length} personnes, presque toutes retraitées) :</p>
				<div class="mf-bars b">${keys.map(k => `<div><span>${WISH[k]}</span><em style="width:${(mt[k] || 0)/market.length*100}%"></em><b>${mt[k] || 0}</b></div>`).join("")}</div>
				<p class="mf-p">Au marché, le parking l'emporte. Dans un échantillon qui ressemble à la ville, c'est <b>${WISH[top].toLowerCase()}</b>. Garde cette note : au conseil, quelqu'un te parlera du marché.</p>
				${addPiece("enq")}${course("enq")}${first ? "" : next("metre", "Suite : vérifier le devis →")}`);
			S.enqDone = true;
			if(first) later(2600, () => palier({ id:"marquelle", onEvent, openLead, quit:close,
				titre:"Ton enquête dit ce que veut Marquelle, pas seulement son marché.",
				texte:"Il reste onze jours : vérifier le devis, monter le budget, convaincre les financeurs, rédiger la délibération… puis la défendre devant le conseil municipal.",
				suite:"Monter tout le dossier (≈ 6 min)" }).then(() => { if(!closed && cur === "enq") metre(); }));
		}
	}

	/* ---------- 2 · le devis : mesurer la cour, entourer ce qui cloche ---------- */
	function metre(){
		stage("metre", "2 · Le devis de la cour");
		sky(false); town.visible = true; usine.visible = true; cour.visible = true; plates.visible = false; hall.visible = false;
		S.slot = 1; placeAll(1);
		tapeG.clear(); tapeG.visible = true; S.meas = { L:0, W:0 }; S.devisOK = false;
		controls.enabled = false; tapeMode = true;
		signOld.visible = false;
		fly(new THREE.Vector3(0, 0, -6.4), MOB() ? 21 : 22, .3, Math.PI);      // vue du nord, presque à la verticale : la halle ne cache pas la cour
		const qte = DEVIS_Q, tot = 5000 + qte*DEVIS_PU + 20*450;
		show(`${head("Devis n° 2026-118 · Terrassements Vandamme", "Pièce 2")}
			${postit(`L'entreprise nous facture la désimperméabilisation de la cour : on retire le béton, on rend la terre à la pluie, on plante. Avant de signer, on vérifie. <b>Mesure la cour au mètre ruban</b> sur la maquette : glisse d'un coin à l'autre, dans la longueur puis dans la largeur.`)}
			<div class="mf-meas"><div data-m="L">Longueur<b>— m</b></div><div data-m="W">Largeur<b>— m</b></div></div>
			<table class="mf-devis"><tr><th>Désignation</th><th>Quantité</th><th>P. U.</th><th>Montant HT</th></tr>
				<tr><td>Installation de chantier</td><td><button class="mf-cell" data-c="forf">forfait</button></td><td></td><td>5 000 €</td></tr>
				<tr><td>Désimperméabilisation de la cour (enrobé retiré, sol décompacté, terre végétale)</td><td><button class="mf-cell" data-c="qte">${fr(qte)} m²</button></td><td><button class="mf-cell" data-c="pu">${DEVIS_PU} €</button></td><td data-t="qte">${euro(qte*DEVIS_PU)}</td></tr>
				<tr><td>Arbres plantés et tuteurés</td><td><button class="mf-cell" data-c="arb">20 arbres</button></td><td><button class="mf-cell" data-c="pua">450 €</button></td><td>9 000 €</td></tr>
				<tr class="tot"><td colspan="3">Total HT</td><td data-t="tot">${euro(tot)}</td></tr></table>
			<p class="mf-tip">Une fois la cour mesurée, <b>entoure</b> (touche) la valeur du devis qui ne tient pas.</p>
			<div data-live></div>`);
		const paintMeas = () => {
			for(const k of ["L", "W"]){ const d = sheet.querySelector(`[data-m="${k}"]`); d.classList.toggle("on", !!S.meas[k]); d.querySelector("b").textContent = S.meas[k] ? S.meas[k] + " m" : "— m"; }
			if(S.meas.L && S.meas.W && !S.areaShown){ S.areaShown = true; play("good"); append(`<p class="mf-ok">📐 Surface réelle de la cour : ${S.meas.L} m × ${S.meas.W} m = <b>${fr(S.meas.L*S.meas.W)} m²</b>. Compare avec le devis.</p>`); }
		};
		S.areaShown = false;
		onMeasure = t => {
			const dx = Math.abs(t.b.x - t.a.x)*U, dz = Math.abs(t.b.z - t.a.z)*U, L = Math.hypot(dx, dz);
			if(L < 3){ tapeG.remove(t.t.bar, t.t.e0, t.t.e1); return; }
			if(dx > dz*3 && Math.abs(L - 60) <= 3){ S.meas.L = 60; play("pop"); }
			else if(dz > dx*3 && Math.abs(L - 20) <= 2){ S.meas.W = 20; play("pop"); }
			else { tapeG.remove(t.t.bar, t.t.e0, t.t.e1); append(`<p class="mf-tip">📏 ${fr(L)} m : mesure un côté entier de la cour, d'un coin à l'autre (le ruban s'accroche aux coins).</p>`); return; }
			paintMeas();
		};
		sheet.querySelectorAll("[data-c]").forEach(b => b.onclick = () => cell(b.dataset.c, b));
		function cell(c, b){
			if(S.devisOK) return;
			b = b || sheet.querySelector(`[data-c="${c}"]`);
			if(!(S.meas.L && S.meas.W)){ append(`<p class="mf-tip">Sur quoi t'appuies-tu ? Mesure d'abord la cour, dans la longueur et dans la largeur.</p>`); return; }
			if(c !== "qte"){ err("devis : " + c); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); append(`<p class="mf-ko">✗ ${CELLS[c]}</p>`); return; }
			S.devisOK = true; tapeMode = false; controls.enabled = true; signOld.visible = true; play("good");
			b.classList.add("circ"); b.insertAdjacentHTML("afterend", `<br><span class="mf-fix">${fr(REAL_Q)} m²</span>`);
			sheet.querySelector('[data-t="qte"]').innerHTML = `<s>${euro(DEVIS_Q*DEVIS_PU)}</s><br><span class="mf-fix">${euro(REAL_Q*DEVIS_PU)}</span>`;
			sheet.querySelector('[data-t="tot"]').innerHTML = `<s>${euro(tot)}</s><br><span class="mf-fix">${euro(5000 + REAL_Q*DEVIS_PU + 9000)}</span>`;
			append(`<p class="mf-ok">✓ Le devis compte ${fr(DEVIS_Q)} m² ; la cour en fait ${fr(REAL_Q)}. L'entreprise a compté deux fois la surface : <b>${euro((DEVIS_Q - REAL_Q)*DEVIS_PU)}</b> de trop. Devis corrigé : <b>110 000 €</b>.</p>
				<p class="mf-p">${stepStars()} En commande publique, on vérifie les quantités et on fait jouer la concurrence : c'est l'argent des habitants.</p>
				${addPiece("devis")}${course("env")}${next("budget", "Suite : la maquette budgétaire →")}`);
		}
		S.cell = cell;
	}

	/* ---------- 3 · la maquette budgétaire : barrer ce qui est mal imputé ---------- */
	function budget(){
		stage("budget", "3 · La maquette budgétaire");
		sky(false); town.visible = true; usine.visible = true; plates.visible = false; hall.visible = false; tapeG.visible = false;
		S.slot = 2; placeAll(2);
		fly(new THREE.Vector3(0, 1, -3), MOB() ? 40 : 44, .8, .55);      // la halle et sa cour : ce que la maquette finance
		S.struck = new Set();
		const line = q => `<div class="mf-line" data-l="${q.id}"><span>${q.t}${q.an ? " <small>(par an)</small>" : ""}<span class="nt" hidden></span></span><b>${euro(q.v)}</b></div>`;
		show(`${head("Maquette budgétaire · tiers-lieu de la filature", "Pièce 3")}
			${postit(`L'adjoint aux finances a préparé la maquette… un peu vite. Le budget d'une commune a <b>deux sections</b> : l'<b>investissement</b> (ce qui dure : travaux, équipements) et le <b>fonctionnement</b> (ce qui revient chaque année). Et on n'emprunte <b>que</b> pour investir. <b>Barre au stylo rouge</b> les lignes qui n'ont rien à faire là : glisse le doigt dessus.`)}
			<div class="mf-sec"><span>Section d'investissement</span><span>dépenses</span></div>
			<div data-sec="inv">${MAQ.filter(q => q.sec === "inv").map(line).join("")}</div>
			<div class="mf-tot"><span>Total investissement</span><span data-tot="inv"></span></div>
			<div class="mf-sec"><span>Section de fonctionnement</span><span>chaque année</span></div>
			<div class="mf-sub">Dépenses</div><div data-sec="fct"><div class="mf-line" style="cursor:default;color:#9aa7ba" data-empty><span>(aucune)</span><b>0 €</b></div></div>
			<div class="mf-sub">Recettes</div><div data-sec="rec">${MAQ.filter(q => q.sec === "rec").map(line).join("")}</div>
			<div class="mf-tot"><span>Équilibre du fonctionnement</span><span data-bal></span></div>
			<div data-live></div>`);
		const totals = () => {
			const inv = MAQ.filter(q => q.sec === "inv" && !S.struck.has(q.id)).reduce((a, q) => a + q.v, 0);
			const dep = MAQ.filter(q => q.sec === "inv" && q.wrong && S.struck.has(q.id)).reduce((a, q) => a + q.v, 0);
			const rec = MAQ.filter(q => q.sec === "rec" && !S.struck.has(q.id)).reduce((a, q) => a + q.v, 0);
			sheet.querySelector('[data-tot="inv"]').textContent = euro(inv);
			const ok = dep === rec && S.struck.has("emp");
			sheet.querySelector("[data-bal]").innerHTML = `${euro(dep)} / ${euro(rec)} <span class="mf-bal ${ok ? "ok" : ""}">${ok ? "équilibré, sans emprunt" : S.struck.has("emp") ? "déséquilibré" : "emprunt : interdit"}</span>`;
		};
		totals();
		sheet.querySelectorAll("[data-l]").forEach(el => strikeable(el, () => strike(el.dataset.l)));
		function strike(id){
			const q = MAQ.find(x => x.id === id), el = sheet.querySelector(`[data-l="${id}"]`);
			if(!el || S.struck.has(id)) return;
			if(!q.wrong){ err("maquette : " + id); el.style.setProperty("--s", 0); el.classList.remove("no"); void el.offsetWidth; el.classList.add("no"); append(`<p class="mf-ko">✗ « ${q.t} » : ${q.why}</p>`); return; }
			S.struck.add(id); el.classList.add("struck"); play("swipe");
			const nt = el.querySelector(".nt"); nt.hidden = false; nt.textContent = q.note;
			if(q.sec === "inv") later(650, () => {
				const empty = sheet.querySelector("[data-empty]"); if(empty) empty.remove();
				el.remove(); el.classList.remove("struck"); el.classList.add("moved"); el.style.setProperty("--s", 0); el.style.cursor = "default";
				sheet.querySelector('[data-sec="fct"]').appendChild(el); totals();
			});
			totals();
			if(MAQ.filter(x => x.wrong).every(x => S.struck.has(x.id))) later(800, done);
		}
		function done(){
			totals(); play("good");
			append(`<p class="mf-ok">✓ Investissement : <b>${euro(TOTAL)}</b> de travaux, à financer (c'est l'étape suivante). Fonctionnement : 40 000 € de charges chaque année, couvertes par le loyer de la SCIC. <b>Pas un euro d'emprunt</b> pour payer le chauffage.</p>
				<p class="mf-p">${stepStars()} La SCIC (société coopérative d'intérêt collectif) fera vivre le lieu : salariés, habitants, associations et la commune en sont associés.</p>
				${addPiece("budget")}${course("fin")}${course("ess")}${next("plan", "Suite : le tour de table des financeurs →")}`);
		}
		S.strike = strike;
	}

	/* ---------- 4 · le plan de financement : les échelons, leurs compétences, leurs plafonds ---------- */
	function plan(){
		stage("plan", "4 · Le tour de table des financeurs");
		sky(false); town.visible = true; usine.visible = true; plates.visible = true; hall.visible = false;
		fly(new THREE.Vector3(0, -6, 6), MOB() ? 95 : 120, 1.05, .2, 2);
		S.amounts = {}; S.trapStruck = false; for(const f of FUND){ S.amounts[f.id] = 0; plateAmount(f.lv, 0); }
		show(`${head(`Plan de financement · ${euro(TOTAL)} HT`, "Pièce 4")}
			${postit(`Sous la ville, ses échelons : chacun ses <b>compétences</b>, chacun ses aides. <b>Tire chaque aide</b> jusqu'où elle peut aller. Deux règles : la commune paie <b>au moins 20 %</b> (la loi), et <b>pas plus de 300 000 €</b> (le maire). Et l'adjoint a ajouté une ligne de son côté : vérifie que chaque financeur a le droit de payer ce qu'on lui demande.`)}
			<div class="mf-stack" data-stack></div>
			<div class="mf-stat" data-stat></div>
			<div data-funds>${FUND.map(f => `<div class="mf-fund"><b>${f.n}</b><small>${f.d} · plafond ${euro(f.cap)}</small>
				<div class="mf-track" data-f="${f.id}" role="slider" tabindex="0" aria-label="${f.n}" aria-valuemin="0" aria-valuemax="${f.cap}"><div class="fill" style="background:${f.col}"></div><div class="cap" style="left:${f.cap/SCALE*100}%"></div><div class="knob"></div><span class="v"></span></div></div>`).join("")}
				<div class="mf-line" data-trap style="margin-top:6px"><span><b style="font-weight:700">${TRAP.n}</b> <small>(ajouté par l'adjoint)</small><br><small>${TRAP.d}</small><span class="nt" hidden></span></span><b>${euro(TRAP.v)}</b></div>
			</div>
			<button class="mf-go" data-ok>Agrafer le plan de financement</button>
			<div data-live></div>`);
		const aids = () => FUND.reduce((a, f) => a + S.amounts[f.id], 0) + (S.trapStruck ? 0 : TRAP.v);
		const paint = () => {
			const A = aids(), rest = TOTAL - A;
			sheet.querySelector("[data-stack]").innerHTML = FUND.map(f => `<i style="width:${S.amounts[f.id]/TOTAL*100}%;background:${f.col}" title="${f.n}"></i>`).join("")
				+ (S.trapStruck ? "" : `<i class="trap" style="width:${TRAP.v/TOTAL*100}%"></i>`)
				+ `<div class="mk" style="left:80%"><span>80 % : plafond légal des aides</span></div><div class="mk m" style="left:${(TOTAL - MAIRE)/TOTAL*100}%"><span>commune ≤ 300 000 €</span></div>`;
			const legal = A <= MAXPUB, maire = rest <= MAIRE;
			sheet.querySelector("[data-stat]").innerHTML = `<span>Aides : ${euro(A)} (${fr(A/TOTAL*100, 1)} %)</span><span class="${legal && maire ? "good" : "bad"}">Commune : ${euro(rest)} (${fr(rest/TOTAL*100, 1)} %)</span>`;
			for(const f of FUND){
				const t = sheet.querySelector(`[data-f="${f.id}"]`), v = S.amounts[f.id], k = v/SCALE*100;
				t.querySelector(".fill").style.width = k + "%"; t.querySelector(".knob").style.left = k + "%";
				const lab = t.querySelector(".v"); lab.textContent = euro(v); lab.classList.toggle("in", k >= 55); lab.style.left = k < 55 ? `calc(${k}% + 18px)` : "auto"; lab.style.right = k >= 55 ? `calc(${100 - k}% + 18px)` : "auto";
				t.setAttribute("aria-valuenow", v);
			}
		};
		const setAmount = (id, v, bump) => {
			const f = FUND.find(q => q.id === id); if(!f) return;
			v = Math.max(0, Math.round(v/STEP)*STEP);
			if(v > f.cap){ v = f.cap; if(bump && S.amounts[id] !== f.cap){ const c = sheet.querySelector(`[data-f="${id}"] .cap`); c.classList.remove("hit"); void c.offsetWidth; c.classList.add("hit"); play("clic"); } }
			S.amounts[id] = v; paint();
		};
		sheet.querySelectorAll("[data-f]").forEach(t => {
			const id = t.dataset.f; let on = false;
			const at = e => { const r = t.getBoundingClientRect(); return (e.clientX - r.left)/r.width*SCALE; };
			t.addEventListener("pointerdown", e => { on = true; try { t.setPointerCapture(e.pointerId); } catch(_){} setAmount(id, at(e), true); });
			t.addEventListener("pointermove", e => { if(on) setAmount(id, at(e), true); });
			const end = () => { if(!on) return; on = false; plateAmount(FUND.find(q => q.id === id).lv, S.amounts[id]); play("coin"); };
			t.addEventListener("pointerup", end); t.addEventListener("pointercancel", end);
			t.addEventListener("keydown", e => { const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? STEP : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -STEP : 0; if(d){ e.preventDefault(); setAmount(id, S.amounts[id] + d, true); plateAmount(FUND.find(q => q.id === id).lv, S.amounts[id]); } });
		});
		const trapEl = sheet.querySelector("[data-trap]");
		const strikeTrap = () => {
			if(S.trapStruck) return; S.trapStruck = true; trapEl.classList.add("struck"); play("swipe");
			const nt = trapEl.querySelector(".nt"); nt.hidden = false; nt.textContent = "Loi NOTRe : les aides aux entreprises, c'est la Région";
			paint(); append(`<p class="mf-ok">✓ Bien vu : depuis la loi NOTRe (2015), le Département ne peut plus aider directement les entreprises. C'est la Région, chef de file du développement économique, qui finance les ateliers.</p>`);
		};
		strikeable(trapEl, strikeTrap);
		sheet.querySelector("[data-ok]").onclick = validate;
		function validate(){
			if(S.planOK) return;
			const A = aids(), rest = TOTAL - A;
			if(!S.trapStruck){ err("plan : département"); append(`<p class="mf-ko">✗ L'instructeur rejettera la ligne du Département : il n'a plus le droit d'aider directement des entreprises (loi NOTRe, 2015). Raye-la.</p>`); return; }
			if(A > MAXPUB){ err("plan : plus de 80 %"); append(`<p class="mf-ko">✗ ${fr(A/TOTAL*100, 1)} % d'aides publiques : c'est illégal. La commune qui porte le projet doit en payer au moins 20 % elle-même. Redescends une aide.</p>`); return; }
			if(rest > MAIRE){ err("plan : commune trop chargée"); append(`<p class="mf-ko">✗ La commune paierait ${euro(rest)} : le maire a fixé 300 000 € au plus. Va chercher chaque financeur jusqu'à son plafond.</p>`); return; }
			S.planOK = true; S.aids = A; play("good");
			sheet.querySelectorAll("[data-f]").forEach(t => t.style.pointerEvents = "none"); sheet.querySelector("[data-ok]").disabled = true;
			append(`<p class="mf-ok">✓ ${euro(A)} d'aides (${fr(A/TOTAL*100, 1)} %), et ${euro(rest)} pour la commune, empruntés pour investir : c'est permis. Cinq financeurs, chacun dans sa compétence.</p>
				<p class="mf-p">${stepStars()}</p>${addPiece("plan")}${course("inst")}${next("delib", "Vendredi, 17 h : la délibération →")}`);
		}
		S.planOK = false; S.setAmount = (id, v) => { setAmount(id, v); plateAmount(FUND.find(q => q.id === id).lv, S.amounts[id]); }; S.strikeTrap = () => { trapEl.style.setProperty("--s", 1); strikeTrap(); }; S.validate = validate;
		paint();
	}

	/* ---------- 5 · le projet de délibération : l'assembler dans l'ordre ---------- */
	function delib(){
		stage("delib", "5 · Le projet de délibération");
		sky(false); scene.background.set("#f2c9a3"); scene.fog.color.set("#f2c9a3"); sun.color.set("#ffc890"); sun.intensity = 1.4;      // vendredi, 17 h : le soleil se couche
		town.visible = true; usine.visible = true; plates.visible = false; hall.visible = false;
		S.slot = 3; placeAll(3);
		fly(new THREE.Vector3(0, 3, -15), MOB() ? 34 : 38, .9, -.35);
		const A = S.aids || 1020000, rest = TOTAL - A;
		const txt = s => s.t.replace("{AIDES}", euro(A)).replace("{COMMUNE}", euro(rest));
		S.placed = []; let cat = 0, art = 0;
		show(`${head("Projet de délibération n° 2026-47", "Pièce 5")}
			${postit(`La convocation du conseil part ce soir, avec le projet de délibération : la loi impose <b>cinq jours francs</b> pour que les élus le lisent. Assemble-le dans l'ordre d'un acte : d'abord les <b>visas</b> (« Vu… »), puis les <b>considérants</b>, puis les <b>articles</b> (le projet, son financement, l'autorisation donnée au maire). <b>Touche chaque morceau</b> pour le poser. L'un d'eux ne doit pas y figurer.`)}
			<div class="mf-act" data-act><p class="ph">Le conseil municipal,</p></div>
			<div class="mf-k">Tes brouillons</div>
			<div class="mf-strips">${shuffle(STRIPS.slice()).map(s => `<button class="mf-strip" data-st="${s.id}">${s.cat === 2 ? "Article · " : ""}${txt(s)}</button>`).join("")}</div>
			<div data-live></div>`);
		const act = sheet.querySelector("[data-act]");
		const left = c => STRIPS.filter(s => s.cat === c && !s.trap && !S.placed.includes(s.id)).length;
		function place(id){
			const s = STRIPS.find(q => q.id === id), b = sheet.querySelector(`[data-st="${id}"]`);
			if(!s || !b || S.placed.includes(id) || b.classList.contains("gone")) return;
			if(s.trap){ err("délibération : travaux immédiats"); b.classList.add("gone"); append(`<p class="mf-ko">✗ Surtout pas ! Des travaux commencés avant que le dossier soit déclaré complet ne sont plus subventionnables : l'État, la Région et l'Europe ne paieraient rien. Article rayé.</p>`); return; }
			while(cat < s.cat && left(cat) === 0) cat++;
			if(s.cat !== cat){ err("délibération : ordre"); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); append(`<p class="mf-ko">✗ Pas encore : il manque ${CAT_NAME[cat]}. Un acte suit toujours le même ordre : visas, considérants, puis la décision.</p>`); return; }
			const ARTS = ["art1", "art2", "art3"], need = ARTS.find(a => !S.placed.includes(a));
			if(s.cat === 2 && id !== need){ err("délibération : ordre des articles"); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); append(`<p class="mf-ko">✗ Pas dans cet ordre : on approuve d'abord le projet, puis son financement, et seulement ensuite on autorise le maire à agir.</p>`); return; }
			S.placed.push(id); b.remove(); play("pop");
			if(s.cat === 2 && art === 0){ act.insertAdjacentHTML("beforeend", `<p class="dc">Après en avoir délibéré, DÉCIDE :</p>`); }
			act.insertAdjacentHTML("beforeend", s.cat === 2 ? `<p><b>Article ${++art}.</b> Le conseil ${txt(s)}</p>` : `<p>${txt(s)}</p>`);
			if(STRIPS.filter(q => !q.trap).every(q => S.placed.includes(q.id))) later(500, done);
		}
		sheet.querySelectorAll("[data-st]").forEach(b => b.onclick = () => place(b.dataset.st));
		function done(){
			const tb = sheet.querySelector('[data-st="trap"]');
			if(tb && !tb.classList.contains("gone")){ tb.classList.add("gone"); append(`<p class="mf-tip">L'article « démarrage immédiat des travaux » reste dans le tiroir : sans accord des financeurs, pas de travaux.</p>`); }
			play("good");
			append(`<p class="mf-ok">✓ Le projet de délibération part avec la convocation. Jeudi, le conseil votera ; ensuite, l'acte sera transmis au préfet, qui en contrôle la légalité.</p>
				<p class="mf-p">${stepStars()}</p>${addPiece("delib")}${course("acte")}${next("conseil", "Jeudi, 19 h : le conseil municipal →")}`);
		}
		S.place = place;
	}

	/* ---------- 6 · le conseil municipal : chaque indécis, sa crainte, sa preuve ---------- */
	function pieceText(id){
		const A = S.aids || 1020000, pct = Math.round(A/TOTAL*100);
		return {
			enq:`7 habitants interrogés par quotas, à quatre heures de la journée : « ${WISH[S.top || "tiers"].toLowerCase()} » en tête. Au seul marché de 10 h, le parking gagnait.`,
			devis:`Cour mesurée : 60 m × 20 m = 1 200 m², et non 2 400. Devis ramené de 206 000 € à 110 000 €, avec 20 arbres en pleine terre.`,
			budget:`Fonctionnement : 40 000 € par an (entretien, chauffage), couverts par le loyer de la SCIC. Aucun emprunt hors investissement.`,
			plan:`${euro(A)} d'aides (${pct} %) : État, Europe, Région, Département, agglomération. Commune : ${euro(TOTAL - A)}.`,
			delib:`Visas, considérants, trois articles. L'article 3 l'écrit : aucun démarrage des travaux avant que chaque dossier soit déclaré complet.`
		}[id];
	}
	function conseil(){
		stage("conseil", "6 · Le conseil municipal");
		sky(true); hall.visible = true; plates.visible = false;
		S.elus = {}; S.sel = null; paintSeats();
		fly(new THREE.Vector3(0, 0, -70.5), MOB() ? 30 : 34, .72, Math.PI, 2.2);      // vu depuis la tribune : les 33 élus dans le cadre
		const count = () => POUR + Object.values(S.elus).filter(v => v === "y").length;
		const render = () => {
			const v = count(), handled = Object.keys(S.elus).length;
			const e = S.sel !== null ? ELUS[S.sel] : null;
			show(`${head("Séance du conseil municipal · point n° 7", "Verdict")}
				${handled === 0 && !e ? postit(`33 élus, il faut <b>17 voix</b>. La majorité en a 12, l'opposition votera contre. Restent <b>6 indécis</b>, marqués d'un « ? ». <b>Touche un indécis</b> pour l'écouter, puis <b>produis la pièce du parapheur</b> qui répond à sa crainte. Attention : une mauvaise pièce, et il votera contre.`) : ""}
				<div class="mf-votes">${v} <small>voix pour sur 33 · il en faut 17</small></div>
				<div class="mf-elus">${ELUS.map((x, i) => `<span class="${S.elus[i] === "y" ? "y" : S.elus[i] === "n" ? "n" : ""}">${x.n}</span>`).join("")}</div>
				${e ? `<div class="mf-obj"><small>${e.n} · ${e.r}</small>« ${e.obj} »</div>
					<div class="mf-k">Le parapheur · quelle pièce lui montres-tu ?</div>
					<div class="mf-pcs">${PIECES.map(p => `<button class="mf-pc" data-pc="${p.id}"><i>${p.ic}</i><span><b>${p.n}</b>${pieceText(p.id)}</span></button>`).join("")}</div>`
					: handled < ELUS.length ? `<p class="mf-tip">Touche un élu marqué « ? » dans l'hémicycle.</p>` : ""}
				<div data-live></div>`);
			sheet.querySelectorAll("[data-pc]").forEach(b => b.onclick = () => produce(b.dataset.pc));
		};
		tapTargets = () => seats.filter(s => s.u >= 0 && !S.elus[s.u]).map(s => ({ id:s.u, hit:s.hit }));
		onTap = u => { if(u === null || u === undefined || S.elus[u]) return; S.sel = u; play("pop"); render(); const s = seats.find(q => q.u === u); s.p.g.position.y = .35; later(250, () => s.p.g.position.y = .1); };
		function produce(pid){
			if(S.sel === null) return;
			const u = S.sel, e = ELUS[u]; S.sel = null;
			if(pid === e.p){ S.elus[u] = "y"; play("good"); paintSeats(); render(); append(`<p class="mf-ok">✓ ${e.n} : « ${e.ok.replace("{PCT}", Math.round((S.aids || 1020000)/TOTAL*100))} »</p>`); }
			else { S.elus[u] = "n"; err("conseil : " + e.n); paintSeats(); render(); append(`<p class="mf-ko">✗ ${e.n} : « Ça ne répond pas à ma question. » Elle ou il votera contre.</p>`); }
			if(Object.keys(S.elus).length === ELUS.length) later(900, vote);
		}
		function vote(){
			onTap = null; const v = count(); S.votes = v; S.adopted = v >= MAJ;
			let k = 0; seats.forEach(s => { const yes = s.k === "pour" || S.elus[s.u] === "y"; if(yes) later(50*k++, () => { s.p.g.position.y = .55; play("clic"); }); });
			later(50*k + 600, () => {
				seats.forEach(s => s.p.g.position.y = .1);
				if(S.adopted){
					play("win");
					append(`<p class="mf-ok" style="font-size:15px">Adoptée : ${v} voix pour, ${SIEGES - v} contre.</p><p class="mf-p">${v >= 19 ? "Une belle majorité : le projet part avec le soutien de la ville." : "De justesse : chaque élu convaincu a compté."} Demain midi, le dossier part chez les financeurs.</p>
						${course("pol")}<button class="mf-go" data-next="end">Vendredi, 12 h : déposer le dossier →</button>`);
				} else {
					play("bad");
					append(`<p class="mf-ko" style="font-size:15px">Rejetée : ${v} voix pour, il en fallait ${MAJ}.</p><p class="mf-p">Le dossier ne partira pas vendredi. Le maire réunit un nouveau conseil : relis tes pièces, et réponds à chacun avec la bonne.</p><button class="mf-go" data-next="conseil">Reprendre la séance</button>`);
				}
			});
		}
		S.produce = produce; S.pickElu = u => onTap(u);
		render();
	}

	/* ---------- le dépôt du dossier : l'instructeur, le bilan ---------- */
	function end(){
		stage("end", "Le dépôt du dossier");
		sky(false); hall.visible = false; plates.visible = false; town.visible = true; usine.visible = true;
		after.visible = true; cour.visible = false; signOld.visible = false; signNew.visible = true; tapeG.visible = false;
		S.slot = 1; placeAll(1, true);
		fly(new THREE.Vector3(0, 0, -3), MOB() ? 38 : 40, .8, .5, 2);
		const r = S.rat, mi = r <= 1 ? 3 : r <= 4 ? 2 : r <= 7 ? 1 : 0, mention = MENTIONS[mi];
		ev("win", mention);
		const A = S.aids || 1020000;
		const order = ["enq", "env", "fin", "ess", "inst", "acte", "pol"].filter(k => S.learned.has(k));
		show(`${head("Accusé de réception · dossier de subvention", "Déposé")}
			<div class="mf-stamp">Dossier complet</div>
			<p class="mf-p">L'instructeur de la préfecture a tout vérifié : le devis tient, le budget respecte la règle d'or, chaque financeur reste dans sa compétence et sous 80 %, la délibération est votée, et les travaux n'ont pas commencé.</p>
			<div class="mf-k">Mention ${mention} · ${r} rature${r > 1 ? "s" : ""}</div>
			<table class="mf-tbl">
				<tr><td>Habitants interrogés (par quotas)</td><td>${S.met.length || 7}</td></tr>
				<tr><td>Économisé sur le devis</td><td>96 000 €</td></tr>
				<tr><td>Travaux</td><td>${euro(TOTAL)}</td></tr>
				<tr><td>Aides obtenues</td><td>${euro(A)} (${Math.round(A/TOTAL*100)} %)</td></tr>
				<tr><td>Emprunt pour le fonctionnement</td><td>0 €</td></tr>
				<tr><td>Vote du conseil</td><td>${S.votes || MAJ} / 33</td></tr></table>
			<p class="mf-p">Tu viens de faire le métier de <b>chargé·e de mission en collectivité</b> : écouter un territoire, compter juste, connaître qui fait quoi, écrire le droit… et convaincre. ${order.length} disciplines de la licence AESe :</p>
			<ul class="mf-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			<p class="mf-p">Après la licence : les concours de la fonction publique (catégorie A, collectivités territoriales), les métiers de la transition écologique, l'économie sociale et solidaire, ou un master à l'ESSLIL ou à la FGES.</p>
			${jpoCard()}${openLead ? `<button class="mf-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="mf-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la licence AESe ↗</a>
			<button class="mf-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="mf-alt" data-a="replay">Rejouer</button>`);
	}

	const STEPS = { enq, metre, budget, plan, delib, conseil, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){
			const keep = S.enqDone; Object.assign(S, fresh()); S.enqDone = keep;
			root.querySelectorAll(".mf-bord i").forEach(i => i.classList.remove("on"));
			after.visible = false; cour.visible = true; signOld.visible = true; signNew.visible = false; tapeG.clear(); tapeG.visible = true;
			for(const k in PL) plateAmount(k, 0);
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
	$(".mf-x").addEventListener("click", close);

	raf = requestAnimationFrame(frame);
	enq();      // ouverture à chaud : la ville vit déjà, on interroge tout de suite
	ev("start");
	ev("missions", [["1 · L'enquête de terrain", enq], ["2 · Le devis de la cour", metre], ["3 · La maquette budgétaire", budget], ["4 · Les financeurs", plan], ["5 · La délibération", delib], ["6 · Le conseil municipal", conseil], ["Le dépôt du dossier", end]]);
	// pour les tests automatiques : chaque geste, sans la main
	const hook = { S, ...STEPS, tap:id => onTap && onTap(id), slot:s => S.goSlot && S.goSlot(s), people, seats, camera, controls,
		measure:(k) => { if(!onMeasure) return "pas d'étape"; const t = { a:k === "L" ? CORNERS[0].clone() : CORNERS[0].clone(), b:k === "L" ? CORNERS[1].clone() : CORNERS[2].clone(), t:newTape() }; placeTape(t.t, t.a, t.b); onMeasure(t); return S.meas; },
		cell:c => S.cell && S.cell(c), strike:id => S.strike && S.strike(id), setAmount:(id, v) => S.setAmount && S.setAmount(id, v), strikeTrap:() => S.strikeTrap && S.strikeTrap(), validate:() => S.validate && S.validate(),
		place:id => S.place && S.place(id), elu:u => S.pickElu && S.pickElu(u), produce:p => S.produce && S.produce(p) };
	const attach = (n = 0) => { if(closed) return; if(window.campus) window.campus.game = hook; else if(n < 40) later(500, () => attach(n + 1)); };      // le campus peut finir de démarrer après l'ouverture du jeu (?jeu=aese)
	attach();
}
