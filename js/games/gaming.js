/* « Game Jam 48 h » — mini-jeu de la Licence Informatique (École du Numérique, Wenov).
   Un week-end de game jam dans la salle de l'École du Numérique, avec l'équipe du Projet Gaming de L1.
   Sur la table, la maquette 3D du jeu de plateforme de l'équipe : on la construit, on la programme, on y joue.
   - H+0  · L1 Projet Gaming, structures de données : poser les blocs du niveau, prouver qu'il est faisable (parcours en largeur) ;
   - H+6  · L1 programmation (Python) : écrire gravité, saut et sol du héros ; le code choisi tourne vraiment, puis on joue
            le niveau, poursuivi par un ennemi qui calcule son chemin avec le même parcours en largeur ;
   - H+20 · L1 bases de données, L2 back-end : la requête SQL du classement, servie par l'API du jeu ;
   - H+28 · parcours IoT et réalité virtuelle : lumière, brouillard et caméra, puis un tour en vue subjective ;
   - H+36 · réseaux et cloud, parcours Cyber : le jeu buzze, le serveur sature ; cache, serveurs, tricheur, scores signés ;
   - H+47 · le jury joue le niveau en direct et note l'équipe.
   Bonus : un éditeur de niveau libre, avec un lien à partager (?jeu=info&niveau=…).
   La lumière des fenêtres suit les 48 heures (vendredi 18 h → dimanche 17 h) ; le style choisi habille toute la salle.
   Équipe, joueurs et scores sont fictifs. Contenu à relire par un enseignant de la licence. */
import * as THREE from "three";
import { makePerson } from "../kit.js?v=5edcdae804";

const COURSES = {
	gaming: ["L1", "Projet Gaming", "Toute la première année, chaque équipe conçoit et programme son propre jeu vidéo : idée, niveaux, code, tests, présentation devant un jury."],
	algo:   ["L1-L2", "Structures de données et algorithmique", "Une file d'attente et un parcours en largeur suffisent à prouver qu'un niveau est faisable, ou à trouver le plus court chemin d'un personnage."],
	prog:   ["L1", "Programmation (Python)", "Variables, conditions, fonctions : quelques lignes de Python exécutées 60 fois par seconde font tomber, sauter et atterrir un personnage."],
	bdd:    ["L1", "Bases de données", "Ranger les parties dans une table et l'interroger en SQL : regrouper, calculer, trier, limiter."],
	back:   ["L2", "Développement back-end", "Le serveur reçoit les demandes du jeu, interroge la base et répond en JSON : c'est une API."],
	cloud:  ["L1-L3", "Réseaux et cloud", "Quand les joueurs affluent, on répartit la charge sur plusieurs serveurs et on garde en cache ce qui est demandé sans arrêt."],
	cyber:  ["L2", "Cybersécurité (parcours Cyber)", "Ne jamais faire confiance à ce qu'envoie l'ordinateur du joueur : le serveur vérifie tout ce qui compte."],
	crypto: ["L2", "Cryptologie (parcours Cyber)", "Hacher, chiffrer, signer : une signature calculée avec une clé secrète prouve qu'un message n'a pas été modifié en route."],
	vr:     ["L2-L3", "Réalité virtuelle et 3D (parcours IoT et VR)", "Une scène 3D, ce sont des objets, des lumières, du brouillard et une caméra : on les règle pour créer une ambiance, et pour qu'un casque affiche deux images 90 fois par seconde."]
};
const TEAM = { ines:["Inès", "graphisme"], yanis:["Yanis", "son et tests"] };
const STYLES = {
	neon:   { name:"Néon", icon:"🌃", side:"#4b34c9", top:"#2de2e6", hero:"#ff4fa3", sky:"#140f33", deco:"#ff4fa3", water:"#1fb8c9", glow:true,
		tex:"grid", floor:"#1c1838", accent:"#ff4fa3", head:"#7c5cff" },
	lille:  { name:"Briques de Lille", icon:"🧱", side:"#b5523b", top:"#efe6d4", hero:"#2f6f8f", sky:"#bfd9ec", deco:"#ffffff", water:"#4f86a8", glow:false,
		tex:"brick", floor:"#6e5646", accent:"#ffb36b", head:"#b5523b" },
	jungle: { name:"Jungle", icon:"🌴", side:"#7a5230", top:"#57b65a", hero:"#f2c63c", sky:"#c4ecd0", deco:"#2f7d43", water:"#3aa59b", glow:false,
		tex:"leaf", floor:"#4f6b45", accent:"#57b65a", head:"#2f7d43" }
};

/* ---------- le niveau (unités : 1 bloc) ---------- */
const N = 16, FLAG = 15, BUDGET = 3, MAXH = 6;
const BASE = [2,2,2,0,0,0,0,2,2,4,2,2,0,0,2,2];           // un trou de 4 cases, un mur de 2 blocs, un trou de 2 cases
const SOLUTION = { 5:1, 8:1 };                             // blocs posés d'office si l'on saute directement à une étape
const COINS = [[1.5, 3.4], [9.5, 5.5], [12.5, 3.6]];
const HW = .3, HH = .9;                                    // demi-largeur et hauteur du héros
const SPEED = 4.5, G_OK = 20, V_OK = 8;
// règle de saut du parcours en largeur : monter d'un bloc au plus, franchir jusqu'à 2 trous, rien de plus haut entre les deux
function canHop(H, a, b){
	const ha = H[a], hb = H[b], d = Math.abs(b - a);
	if(!ha || !hb || d < 1 || d > 3 || hb > ha + 1) return false;
	for(let c = Math.min(a, b) + 1; c < Math.max(a, b); c++) if(H[c] > Math.min(ha, hb)) return false;
	return true;
}
function bfs(H, from = 0, to = FLAG){
	const prev = Array(N).fill(-2), steps = [], q = [from];
	prev[from] = -1;
	while(q.length){
		const a = q.shift(), found = [];
		for(let b = Math.max(0, a - 3); b <= Math.min(N - 1, a + 3); b++) if(prev[b] === -2 && canHop(H, a, b)){ prev[b] = a; q.push(b); found.push(b); }
		steps.push({ c:a, found, q:[...q] });
	}
	const path = [];
	if(prev[to] !== -2) for(let c = to; c !== -1; c = prev[c]) path.unshift(c);
	return { steps, path, ok:prev[to] !== -2 };
}
const airtime = d => (V_OK + Math.sqrt(Math.max(0, V_OK*V_OK - 2*G_OK*d)))/G_OK;

/* ---------- les scores (H+20) ---------- */
const PARTIES = [["kraken", 2750], ["Maya", 1500], ["Zoé.dev", 2480], ["Lou_42", 2310], ["kraken", 2600], ["Maya", 1450], ["NeoPixel", 1840], ["Maya", 1400], ["Bitboy", 1490], ["Lou_42", 1200], ["Maya", 1380]];
const SQL = {
	agg:[["MAX(score)", "MAX(score)"], ["score", "score"], ["SUM(score)", "SUM(score)"]],
	grp:[["GROUP BY pseudo", "GROUP BY pseudo"], ["", "(rien)"]],
	ord:[["DESC", "DESC"], ["ASC", "ASC"]],
	lim:[["3", "3"], ["1", "1"], ["10", "10"]]
};
function runQuery({ agg, grp, ord, lim }){
	if(grp && agg === "score") return { error:"Erreur SQL : avec GROUP BY, chaque colonne doit être regroupée ou calculée. « score » ne l'est pas." };
	let rows;
	if(grp){
		const by = {};
		for(const [p, s] of PARTIES){ by[p] = by[p] || []; by[p].push(s); }
		rows = Object.entries(by).map(([p, l]) => [p, agg === "SUM(score)" ? l.reduce((a, b) => a + b, 0) : Math.max(...l)]);
	} else if(agg === "score") rows = PARTIES.map(r => [...r]);
	else { const best = PARTIES.reduce((a, b) => b[1] > a[1] ? b : a); rows = [[best[0], agg === "SUM(score)" ? PARTIES.reduce((a, r) => a + r[1], 0) : best[1]]]; }
	rows.sort((a, b) => ord === "DESC" ? b[1] - a[1] : a[1] - b[1]);
	return { rows:rows.slice(0, +lim) };
}

/* ---------- le serveur (H+36) ---------- */
const REQ = 5000, CAP = 1000, CACHE_HIT = .65, MAX_SRV = 3;
const loadOf = st => REQ*(st.cache ? 1 - CACHE_HIT : 1);
const utilOf = st => loadOf(st)/(st.servers*CAP);
const latencyOf = u => u >= 1 ? Infinity : Math.round(30/(1 - u));
// signature d'un score : empreinte (FNV-1a) de la clé secrète du serveur, du pseudo et du score
const KEY = "wenov-jam-2026";
function sign(pseudo, score){ let h = 0x811c9dc5; for(const ch of `${KEY}|${pseudo}|${score}`){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, "0").toUpperCase().replace(/(....)(....)/, "$1·$2"); }
const SIGNED = [["Lou_42", 2310, 2310], ["xX_Max_Xx", 2990, 1990], ["Zoé.dev", 2480, 2480]];     // pseudo, score reçu, score réellement signé

/* ---------- l'heure de la jam (H+0 = vendredi 18 h) ---------- */
const DAYS = ["vendredi", "samedi", "dimanche"];
function clockOf(h){ const t = 18 + h, d = Math.floor(t/24), hh = Math.floor(t % 24), mm = Math.round((t % 1)*60) % 60; return `${DAYS[Math.min(d, 2)]} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`; }
const SKY = [[0, "#141a33"], [5.5, "#141a33"], [7, "#f3b38a"], [9, "#a9d6f5"], [17, "#a9d6f5"], [19, "#f29b5e"], [21, "#141a33"], [24, "#141a33"]];
function skyAt(h){
	const t = (18 + h) % 24;
	for(let i = 0; i < SKY.length - 1; i++) if(t <= SKY[i + 1][0]){
		const [a, ca] = SKY[i], [b, cb] = SKY[i + 1], k = (t - a)/(b - a || 1);
		return new THREE.Color(ca).lerp(new THREE.Color(cb), k);
	}
	return new THREE.Color(SKY[0][1]);
}

const CSS = `
.gj{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1d2238;background:#11142a;animation:gjIn .35s ease both;
	--pw:400px;--vh:100%}
@keyframes gjIn{from{opacity:0}to{opacity:1}}
.gj-cv{position:fixed;left:0;top:0;width:calc(100% - var(--pw));height:var(--vh);display:block;touch-action:none;outline:none}
.gj-top{position:fixed;left:10px;top:10px;right:calc(var(--pw) + 10px);display:flex;gap:8px;align-items:center;z-index:2;pointer-events:none;flex-wrap:wrap}
.gj-top>*{pointer-events:auto}
.gj-chip{background:#fff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:13px;box-shadow:0 2px 10px rgba(0,0,0,.3);white-space:nowrap}
.gj-st{background:#7c5cff;color:#fff}
.gj-clock{background:#161a33;color:#ffd166;font-variant-numeric:tabular-nums;font-family:ui-monospace,Menlo,Consolas,monospace}
.gj-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.gj-hint{position:fixed;left:50%;transform:translateX(calc(-50% - var(--pw)/2));top:62px;z-index:2;background:#161a33e6;color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;font-size:13.5px;pointer-events:none;white-space:nowrap}
.gj-pad{position:fixed;left:0;width:calc(100% - var(--pw));bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 16px;box-sizing:border-box;z-index:2;pointer-events:none}
.gj-pad>div{display:flex;gap:10px}
.gj [hidden]{display:none!important}
.gj-pad button{pointer-events:auto;width:68px;height:68px;border-radius:50%;border:0;background:#ffffffde;font:800 26px Nunito,sans-serif;color:#3b2f80;box-shadow:0 4px 14px rgba(0,0,0,.35);touch-action:none;user-select:none;-webkit-user-select:none}
.gj-pad button[data-k=j]{width:86px;height:86px;background:#7c5cff;color:#fff;font-size:16px}
.gj-pad button.on{transform:scale(.92);filter:brightness(.92)}
.gj-pan{position:fixed;right:0;top:0;bottom:0;width:var(--pw);overflow:auto;overscroll-behavior:contain;background:#f6f4fc;box-sizing:border-box;padding:14px 16px 40px;z-index:3;box-shadow:-10px 0 40px rgba(0,0,0,.35)}
.gj-card{animation:gjCard .35s ease both}
@keyframes gjCard{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.gj-k{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6a4ce0}
.gj-h{font:700 23px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.gj-p{font-size:14.5px;line-height:1.5;margin:6px 0}
.gj-say{display:flex;gap:8px;align-items:flex-start;background:#fff;border-radius:12px;padding:9px 11px;margin:8px 0;font-size:14px;line-height:1.45;box-shadow:0 2px 8px rgba(40,30,90,.08)}
.gj-say i{font-style:normal;font-size:20px;line-height:1}
.gj-say b{color:#4b35b8}
.gj-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.gj-list li{background:#fff;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.gj-list li span{color:#6a4ce0;font-weight:800;margin-right:6px;font-family:ui-monospace,Menlo,monospace}
.gj-go{display:block;width:100%;margin-top:12px;border:0;border-radius:12px;padding:14px;font:800 16px Nunito,sans-serif;background:#7c5cff;color:#fff;cursor:pointer}
.gj-go:disabled{opacity:.5;cursor:default}
.gj-alt{display:block;width:100%;margin-top:8px;border:1.5px solid #d8d2f2;border-radius:12px;padding:11px;font:700 15px Nunito,sans-serif;background:#fff;color:#3b2f80;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.gj-styles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
.gj-styles button{border:2px solid #d8d2f2;border-radius:12px;background:#fff;padding:10px 4px;font:800 13px Nunito,sans-serif;color:#1d2238;cursor:pointer}
.gj-styles button i{display:block;font-style:normal;font-size:24px;margin-bottom:2px}
.gj-styles button.on{border-color:#7c5cff;background:#efeaff}
.gj-code{background:#161a33;color:#e6e8ff;border-radius:12px;padding:12px 12px;font:12.5px/1.8 ui-monospace,Menlo,Consolas,monospace;overflow-x:auto;white-space:pre}
.gj-code .kw{color:#c792ea}.gj-code .cm{color:#7f8bb3}
.gj-code select{font:12.5px ui-monospace,Menlo,monospace;background:#2c3266;color:#ffe08a;border:1px solid #5560a8;border-radius:6px;padding:1px 3px;cursor:pointer}
.gj-code select.ko{border-color:#ff6b6b;box-shadow:0 0 0 2px #ff6b6b55}
.gj-msg{border-radius:10px;padding:10px 12px;font-size:14px;font-weight:700;margin-top:8px;line-height:1.45}
.gj-msg.ok{background:#e7f6ec;color:#22693c}.gj-msg.ko{background:#fdeceb;color:#a3322a}.gj-msg.in{background:#eef0ff;color:#3b2f80}
.gj-rule{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.gj-rule span{background:#fff;border:1.5px solid #e1dbf5;border-radius:999px;padding:5px 10px;font-size:13px;font-weight:800}
.gj-q{font:700 14px/1.6 ui-monospace,Menlo,monospace;background:#161a33;color:#9dfcb4;border-radius:10px;padding:8px 12px;margin-top:8px;min-height:3.2em}
.gj-q em{color:#ffd166;font-style:normal}
.gj-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0;background:#fff;border-radius:10px;overflow:hidden}
.gj-tbl th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6e6a85;text-align:left;padding:5px 8px;background:#efedf7}
.gj-tbl td{padding:5px 8px;border-top:1px solid #ebe8f5;font-variant-numeric:tabular-nums}
.gj-opts{display:grid;gap:8px;margin-top:8px}
.gj-opt{border:1.5px solid #d8d2f2;border-radius:10px;background:#fff;padding:11px 12px;font:700 14px/1.4 Nunito,sans-serif;text-align:left;cursor:pointer;color:#1d2238}
.gj-opt.ok{border-color:#2f8a4f;background:#e7f6ec}.gj-opt.ko{border-color:#c0392b;background:#fdeceb}
.gj-srv{background:#fff;border-radius:12px;padding:12px;margin-top:8px;display:grid;gap:10px}
.gj-srv label{font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.gj-srv input[type=range]{width:100%;accent-color:#7c5cff}
.gj-srv input[type=checkbox]{width:22px;height:22px;accent-color:#7c5cff;flex:none}
.gj-meters{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.gj-meters div{background:#f4f2fb;border-radius:8px;padding:7px 9px;font-size:12px;font-weight:700;color:#5d5978}
.gj-meters b{display:block;font-size:17px;color:#1d2238;font-variant-numeric:tabular-nums}
.gj-meters .bad b{color:#c0392b}.gj-meters .ok b{color:#22693c}
.gj-json{background:#161a33;color:#9dfcb4;border-radius:10px;padding:10px 12px;font:12.5px/1.6 ui-monospace,Menlo,monospace;white-space:pre;overflow-x:auto;margin-top:8px}
.gj-course{background:#fff;border:2px solid #7c5cff;border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.gj-course .tag{display:inline-block;background:#efeaff;color:#4b35b8;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.gj-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.gj-course span{font-size:14px;color:#4f4a65}
.gj-seg{display:flex;gap:6px;flex-wrap:wrap}
.gj-seg button{flex:1;min-width:84px;border:2px solid #d8d2f2;border-radius:10px;background:#fff;padding:8px 6px;font:800 13px Nunito,sans-serif;color:#1d2238;cursor:pointer}
.gj-seg button.on{border-color:#7c5cff;background:#efeaff}
.gj-seg button:disabled,.gj-srv input:disabled{opacity:.6;cursor:default}
.gj-brief{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.gj-brief li{background:#fff;border-radius:8px;padding:8px 10px;font-size:13.5px;font-weight:700;display:flex;gap:8px;align-items:center}
.gj-brief li b{margin-left:auto;font-size:16px}
.gj-pk{display:grid;gap:8px;margin-top:8px}
.gj-pk>div{background:#161a33;color:#e6e8ff;border-radius:10px;padding:10px 12px;font:13px/1.6 ui-monospace,Menlo,monospace}
.gj-pk em{color:#ffd166;font-style:normal}
.gj-pk .row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center}
.gj-pk button{border:0;border-radius:8px;padding:7px 10px;font:800 13px Nunito,sans-serif;cursor:pointer;background:#3a4180;color:#fff}
.gj-pk button.ok{background:#2f8a4f}.gj-pk button.ko{background:#c0392b}.gj-pk button:disabled{cursor:default}
.gj-pk .st{font-weight:700;color:#9dfcb4}.gj-pk .st.bad{color:#ff8a8a}
.gj-link{width:100%;box-sizing:border-box;border:1.5px solid #d8d2f2;border-radius:10px;padding:10px;font:12.5px ui-monospace,Menlo,monospace;margin-top:8px;background:#fff;color:#1d2238}
.gj-shared{background:#fff4d6;border:2px solid #ffd166;border-radius:12px;padding:10px 12px;margin:8px 0;font-weight:800;font-size:14px}
.gj-notes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.gj-notes div{background:#fff;border-radius:10px;padding:10px 6px;text-align:center;font-size:12px;font-weight:800;color:#5d5978}
.gj-notes b{display:block;font:700 26px Fraunces,Georgia,serif;color:#4b35b8}
@media (max-width:820px){
	.gj{--pw:0px;--vh:46vh}
	.gj-pan{top:46vh;width:100%;box-shadow:0 -10px 30px rgba(0,0,0,.35);border-radius:16px 16px 0 0;padding-bottom:calc(30px + env(safe-area-inset-bottom))}
	.gj-top{top:calc(env(safe-area-inset-top) + 8px);right:10px;gap:6px}
	.gj-chip{padding:5px 9px;font-size:12px}
	.gj-x{width:36px;height:36px;font-size:20px}
	.gj-hint{transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 92px);font-size:12.5px}
	.gj-pad{bottom:auto;top:calc(46vh - 84px)}
	.gj-pad button{width:58px;height:58px;font-size:22px}
	.gj-pad button[data-k=j]{width:72px;height:72px;font-size:14px}
	.gj-h{font-size:21px}
}
`;

export function openGaming({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gj-css")){ const st = document.createElement("style"); st.id = "gj-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "gj"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Game Jam 48 h");
	root.innerHTML = `<canvas class="gj-cv" tabindex="0" aria-label="La salle de la game jam en 3D"></canvas>
		<div class="gj-top"><span class="gj-chip gj-st" id="gjSt">Game Jam 48 h</span><span class="gj-chip gj-clock" id="gjClock">H+00 · vendredi 18:00</span><span class="gj-chip" id="gjErr">🐞 0 erreur</span><button class="gj-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gj-hint" id="gjHint" hidden></div>
		<div class="gj-pad" id="gjPad" hidden><div><button data-k="l" aria-label="Gauche">◀</button><button data-k="r" aria-label="Droite">▶</button></div><button data-k="j" aria-label="Sauter">Sauter</button></div>
		<aside class="gj-pan"><div class="gj-card" id="gjCard"></div></aside>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const card = $("#gjCard"), pan = $(".gj-pan");
	const S = { errors:0, learned:new Set(), style:"neon", extra:Array(N).fill(0), custom:null, levelOk:false, phys:null, physOk:false, servers:1, cache:false, coins:0, falls:0, stomps:0,
		vr:{ el:60, col:"neutre", fog:0, cam:"table" }, vrActive:false, hour:0, hourShown:0, mode:"idle" };
	let closed = false;
	const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
	const heights = () => S.custom ? S.custom.slice() : BASE.map((h, i) => h + S.extra[i]);      // S.custom : niveau de l'éditeur libre
	const used = () => S.extra.reduce((a, b) => a + b, 0);

	/* ---------- scène ---------- */
	const canvas = $("canvas.gj-cv");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, stencil:true });   // 24 bits de profondeur sur iPhone
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#11142a");
	const camera = new THREE.PerspectiveCamera(45, 1, .05, 80);
	const hemi = new THREE.HemisphereLight("#ffffff", "#545a78", 1); scene.add(hemi);
	const sun = new THREE.DirectionalLight("#ffffff", 1.2); sun.position.set(-7, 9, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
	Object.assign(sun.shadow.camera, { left:-9, right:9, top:8, bottom:-8, near:1, far:30 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; scene.add(sun);
	const lamp = new THREE.PointLight("#ffe3b8", 14, 9, 1.6); lamp.position.set(0, 3.6, 0); scene.add(lamp);
	const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color:c, roughness:.7, metalness:0, ...o });
	const add = (geo, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; (parent || scene).add(m); return m; };
	const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
	function canvasTex(w, h){ const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, x:c.getContext("2d"), t }; }
	function fitText(x, text){
		let fs = 34; x.font = `800 ${fs}px Nunito, sans-serif`;
		while(x.measureText(text).width > 228 && fs > 14){ fs -= 2; x.font = `800 ${fs}px Nunito, sans-serif`; }
		x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 38);
	}
	function label(text, color = "#7c5cff", w = 1.3){
		const { c, x, t } = canvasTex(256, 72);
		x.fillStyle = color; x.beginPath(); x.roundRect(4, 4, 248, 64, 32); x.fill();
		fitText(x, text);
		const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:t })); s.scale.set(w, w*72/256, 1); s.renderOrder = 5; s.userData.canvas = c;
		return s;
	}

	// la salle
	const floorMat = M("#454a6b", { roughness:.95 }), wallMat = M("#ffffff", { roughness:.9 }), stripMat = M("#7c5cff", { emissive:"#7c5cff", emissiveIntensity:1.4 });
	// motif des murs selon le style : grille néon, briques, feuillage
	const wallTex = {};
	function wallTexture(kind){
		const { x, t } = canvasTex(256, 256);
		if(kind === "brick"){
			x.fillStyle = "#d8c6ae"; x.fillRect(0, 0, 256, 256);
			for(let r = 0; r < 8; r++) for(let i = -1; i < 5; i++){ x.fillStyle = ["#b5523b", "#a6463a", "#c0603f", "#9e4332"][(r*7 + i*3) & 3]; x.fillRect(i*64 + (r % 2 ? 32 : 0) + 2, r*32 + 2, 60, 28); }
		} else if(kind === "grid"){
			x.fillStyle = "#1e1a3d"; x.fillRect(0, 0, 256, 256);
			x.strokeStyle = "#3b2f86"; x.lineWidth = 2;
			for(let i = 0; i <= 256; i += 32){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
			x.fillStyle = "#ff4fa3"; for(let i = 0; i < 6; i++) x.fillRect(((i*3) % 8)*32 - 3, ((i*5) % 8)*32 - 3, 6, 6);
		} else {
			x.fillStyle = "#dcefd6"; x.fillRect(0, 0, 256, 256);
			for(let i = 0; i < 28; i++){ x.fillStyle = i % 3 ? "#b6dcab" : "#9ccc8f"; x.beginPath(); x.ellipse((i*97) % 256, (i*61) % 256, 22, 8, (i % 5)*.7, 0, 7); x.fill(); }
		}
		t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 2);
		return t;
	}
	add(new THREE.PlaneGeometry(17, 13).rotateX(-Math.PI/2), floorMat, scene, 0, 0, 0, false);
	add(new THREE.PlaneGeometry(17, 5), wallMat, scene, 0, 2.5, -6, false);
	add(new THREE.PlaneGeometry(13, 5).rotateY(Math.PI/2), wallMat, scene, -8.5, 2.5, .5, false);
	add(new THREE.PlaneGeometry(13, 5).rotateY(-Math.PI/2), wallMat, scene, 8.5, 2.5, .5, false);
	add(new THREE.PlaneGeometry(17, 5).rotateY(Math.PI), wallMat, scene, 0, 2.5, 6.9, false);       // mur du fond, invisible depuis la vue d'ensemble (vu de dos)
	add(boxG(17, .08, .06), stripMat, scene, 0, .1, -5.96, false);      // bandeau lumineux
	const winMat = new THREE.MeshBasicMaterial({ color:"#a9d6f5" });
	for(const z of [-3.6, -.2, 3.2]){
		add(new THREE.PlaneGeometry(2.4, 2.3).rotateY(Math.PI/2), winMat, scene, -8.47, 2.3, z, false);
		add(boxG(.08, 2.5, .1), M("#2b3048"), scene, -8.44, 2.3, z, false);
		add(boxG(.08, .1, 2.6), M("#2b3048"), scene, -8.44, 2.3, z, false);
	}
	// grand écran et compteur
	add(boxG(5.1, 3, .12), M("#1d2033"), scene, 0, 2.75, -5.92);
	const scr = canvasTex(1024, 576);
	add(new THREE.PlaneGeometry(4.9, 2.76), new THREE.MeshBasicMaterial({ map:scr.t, toneMapped:false }), scene, 0, 2.75, -5.85, false);
	const led = canvasTex(512, 96);
	add(boxG(2.7, .58, .1), M("#0d0f1c"), scene, 0, 4.6, -5.92, false);
	add(new THREE.PlaneGeometry(2.6, .49), new THREE.MeshBasicMaterial({ map:led.t, toneMapped:false }), scene, 0, 4.6, -5.86, false);
	// la grande table de l'équipe
	const tableTop = M("#f1eff7", { roughness:.5 });
	add(boxG(4.6, .08, 1.6), tableTop, scene, 0, .86, 0);
	for(const [x, z] of [[-2.2, -.7], [2.2, -.7], [-2.2, .7], [2.2, .7]]) add(boxG(.08, .82, .08), M("#9aa0b8"), scene, x, .41, z);
	// postes de l'équipe
	function desk(x, z, who){
		const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
		add(boxG(1.8, .06, .9), M("#d9d4ea"), g, 0, .74, 0); for(const sx of [-.85, .85]) add(boxG(.06, .72, .8), M("#9aa0b8"), g, sx, .36, 0);
		add(boxG(.5, .03, .34), M("#2b2f45", { metalness:.3 }), g, 0, .785, -.1);
		const scrM = M("#1d2238", { emissive:"#5a7bff", emissiveIntensity:.7 });
		const s = add(boxG(.5, .32, .02), scrM, g, 0, .95, -.27); s.rotation.x = -.18;
		add(boxG(.5, .05, .5), M("#3a3f5c"), g, 0, .45, .55); add(boxG(.5, .5, .06), M("#3a3f5c"), g, 0, .72, .8);
		const p = makePerson(g, true); p.g.position.set(0, 0, .55); p.g.rotation.y = Math.PI;
		const tag = label(TEAM[who][0], "#7c5cff", .9); tag.position.set(0, 2.55, .55); g.add(tag);
		return { g, p, scrM };
	}
	const ines = desk(-5.4, -2.4, "ines"), yanis = desk(-5.4, 1.2, "yanis");
	const zzz = label("Zzz…", "#3b2f80", .7); zzz.position.set(-5.2, 2.2, 1.75); zzz.visible = false; scene.add(zzz);
	// pizzas (à partir de H+20)
	const pizzas = new THREE.Group(); pizzas.position.set(4.6, 0, 3); pizzas.visible = false; scene.add(pizzas);
	add(boxG(1.2, .06, .8), M("#d9d4ea"), pizzas, 0, .7, 0); for(const sx of [-.55, .55]) add(boxG(.06, .68, .7), M("#9aa0b8"), pizzas, sx, .34, 0);
	for(let i = 0; i < 3; i++) add(boxG(.42, .05, .42), M("#e8d3a8"), pizzas, -.28, .76 + i*.055, 0, i === 2).rotation.y = i*.2;
	add(boxG(.44, .03, .44), M("#e8d3a8"), pizzas, .25, .74, 0);
	add(new THREE.CylinderGeometry(.18, .18, .02, 16), M("#e0703a"), pizzas, .25, .765, 0);

	/* ---------- la maquette du jeu, sur la table ---------- */
	const B = .22, Y0 = .92;
	const lv = new THREE.Group(); lv.position.set(-N*B/2, Y0, 0); lv.scale.setScalar(B); scene.add(lv);
	const toWorldX = x => -N*B/2 + x*B;
	const matSide = M("#4b34c9"), matTop = M("#2de2e6"), matExtra = M("#ffd166", { emissive:"#ffb703", emissiveIntensity:.25 });
	const heroMat = M("#ff4fa3"), skyMat = new THREE.MeshBasicMaterial({ color:"#140f33" }), waterMat = M("#1fb8c9", { transparent:true, opacity:.8, roughness:.2 }), decoMat = new THREE.MeshBasicMaterial({ color:"#ff4fa3", transparent:true, opacity:.55 });
	add(boxG(N + .6, .7, 1.9), M("#1d2033"), lv, N/2, -.75, 0);
	add(boxG(N, .1, 1.5), waterMat, lv, N/2, -.45, 0, false);
	add(new THREE.PlaneGeometry(N + .6, 7.2), skyMat, lv, N/2, 3.2, -1.05, false);
	for(const [x, y, w, h] of [[1.5, 5.2, 2.2, .5], [5, 6, 1.4, .4], [10.5, 5.6, 2.6, .5], [13.8, 6.3, 1.2, .35], [7.5, 4.6, .6, .6]]) add(new THREE.PlaneGeometry(w, h), decoMat, lv, x, y, -1.02, false);
	const blocks = new THREE.Group(); lv.add(blocks);
	const hit = [];
	for(let c = 0; c < N; c++){ const h = add(boxG(1, 8, 1.6), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false }), lv, c + .5, 3.6, 0, false); h.userData.col = c; hit.push(h); }
	const ghost = add(boxG(1, 1, 1.4), new THREE.MeshBasicMaterial({ color:"#ffd166", transparent:true, opacity:.45, depthWrite:false }), lv, 0, 0, 0, false); ghost.visible = false;
	const tiles = [];
	const BLOCK = boxG(.98, .98, 1.4), TOP = boxG(1, .2, 1.44);
	function buildLevel(){
		blocks.clear();
		const H = heights();
		for(let c = 0; c < N; c++){
			for(let y = 0; y < H[c]; y++){
				const mine = !S.custom && y >= BASE[c];
				const b = add(BLOCK, mine ? matExtra : matSide, blocks, c + .5, y + .5, 0);
				b.userData = { col:c, mine };
			}
			if(H[c] && (S.custom || !S.extra[c])) add(TOP, matTop, blocks, c + .5, H[c] - .08, 0).userData = { col:c };
			tiles[c].position.y = H[c] + .06;
		}
		flag.position.set(FLAG + .5, H[FLAG], 0);
		// pièces : fixes dans le niveau de la jam, posées au-dessus des colonnes 3, 8 et 12 dans un niveau libre
		if(S.custom) [3, 8, 12].forEach((c, i) => { coins[i].x = c + .5; coins[i].y = (H[c] || Math.max(H[c - 1] || 0, H[c + 1] || 0)) + 1.5; });
		else COINS.forEach(([x, y], i) => { coins[i].x = x; coins[i].y = y; });
		coins.forEach(c => c.m.position.set(c.x, c.y, 0));
		lv.updateMatrixWorld(true);      // les nouveaux blocs sont cliquables tout de suite, sans attendre l'affichage
	}
	for(let c = 0; c < N; c++){ const t = add(boxG(.9, .1, 1.46), new THREE.MeshBasicMaterial({ color:"#7dff9a", transparent:true, opacity:.9, toneMapped:false }), lv, c + .5, 0, 0, false); t.visible = false; tiles.push(t); }
	const flag = new THREE.Group(); lv.add(flag);
	add(new THREE.CylinderGeometry(.06, .06, 2.4, 8), M("#e6e8ff"), flag, 0, 1.2, 0);
	const cloth = add(boxG(1, .65, .05), M("#ffd166", { emissive:"#ff9f1c", emissiveIntensity:.35 }), flag, .52, 2.05, 0);
	const coins = COINS.map(([x, y]) => { const m = add(new THREE.CylinderGeometry(.28, .28, .08, 16).rotateX(Math.PI/2), M("#ffd166", { emissive:"#ffb703", emissiveIntensity:.5, metalness:.4, roughness:.3 }), lv, x, y, 0); return { m, x, y, got:false }; });
	// le héros : un cube qui sautille
	const hero = { x:.5, y:2, vy:0, ground:true, face:1, squash:0 };
	const heroG = new THREE.Group(); lv.add(heroG);
	const heroBody = add(boxG(.62, .62, .55), heroMat, heroG, 0, .36, 0);
	for(const s of [-1, 1]){ add(boxG(.13, .16, .04), M("#ffffff"), heroBody, s*.13, .07, .29, false); add(boxG(.07, .09, .03), M("#141a33"), heroBody, s*.13 + .02, .06, .31, false); }
	add(boxG(.06, .22, .06), M("#141a33"), heroBody, 0, .41, 0, false); add(new THREE.SphereGeometry(.08, 8, 6), M("#ffd166", { emissive:"#ffb703" }), heroBody, 0, .55, 0, false);
	// l'ennemi : un bug rouge qui calcule son chemin vers le héros par parcours en largeur
	const FOE_START = 9;
	const foe = { on:false, c:FOE_START, x:FOE_START + .5, y:4, from:FOE_START, to:FOE_START, hop:0, wait:1, dead:0 };
	const foeG = new THREE.Group(); foeG.visible = false; lv.add(foeG);
	const foeBody = add(boxG(.7, .5, .6), M("#e63946", { emissive:"#7a0d16", emissiveIntensity:.4 }), foeG, 0, .25, 0);
	for(const s of [-1, 1]){ add(boxG(.16, .1, .04), M("#ffffff"), foeBody, s*.15, .04, .31, false); add(boxG(.2, .045, .04), M("#141a33"), foeBody, s*.15, .13, .32, false).rotation.z = s*.45; }
	for(const s of [-.22, 0, .22]) add(new THREE.ConeGeometry(.08, .2, 4), M("#ffd166"), foeBody, s, .33, 0, false);
	for(const s of [-1, 1]) for(const z of [-.18, .18]) add(boxG(.06, .14, .06), M("#141a33"), foeG, s*.28, .02, z, false);
	function applyStyle(){
		const st = STYLES[S.style];
		matSide.color.set(st.side); matTop.color.set(st.top); heroMat.color.set(st.hero); skyMat.color.set(st.sky); decoMat.color.set(st.deco); waterMat.color.set(st.water);
		matTop.emissive.set(st.glow ? st.top : "#000"); matTop.emissiveIntensity = st.glow ? .45 : 0;
		heroMat.emissive.set(st.glow ? st.hero : "#000"); heroMat.emissiveIntensity = st.glow ? .3 : 0;
		wallMat.map = wallTex[st.tex] || (wallTex[st.tex] = wallTexture(st.tex)); wallMat.needsUpdate = true;
		floorMat.color.set(st.floor); stripMat.color.set(st.accent); stripMat.emissive.set(st.accent);
		drawScreen();
	}

	// podium des meilleurs joueurs (H+20), devant l'écran
	const podium = new THREE.Group(); podium.position.set(-3.5, 0, -4.3); podium.visible = false; scene.add(podium);
	const podiumPeople = [[0, .6, "#ffd166"], [-.9, .4, "#cfd6e4"], [.9, .25, "#e0a070"]].map(([x, h, c]) => {
		const g = new THREE.Group(); g.position.x = x; podium.add(g);
		add(boxG(.85, h, .8), M(c, { metalness:.25, roughness:.4 }), g, 0, h/2, 0);
		const p = makePerson(g); p.g.position.y = h; p.g.scale.multiplyScalar(.85);
		const tag = label("", "#7c5cff", .95); tag.position.set(0, h + 2.3, 0); g.add(tag);
		return { g, h, tag };
	});
	// le serveur (H+36)
	const racks = [], RACK_Z = -4.6;
	const ledMat = new THREE.MeshBasicMaterial({ color:"#3bd16f", toneMapped:false });
	for(let i = 0; i < 6; i++){
		const g = new THREE.Group(); g.position.set(3.9 + i*.66, 0, RACK_Z); g.visible = i === 0; scene.add(g);
		add(boxG(.56, 2, .8), M("#20232f", { metalness:.4, roughness:.5 }), g, 0, 1, 0);
		for(let k = 0; k < 7; k++) add(boxG(.44, .03, .02), ledMat, g, 0, .3 + k*.24, .41, false);
		const tag = label(`Serveur ${i + 1}`, "#20232f", .7); tag.position.set(0, 2.3, 0); g.add(tag);
		racks.push(g);
	}
	const alarm = add(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color:"#ff3b3b", toneMapped:false }), racks[0], 0, 2.08, 0, false); alarm.visible = false;
	const portal = new THREE.Group(); portal.position.set(7.2, 2.4, -1.6); portal.visible = false; scene.add(portal);
	add(new THREE.TorusGeometry(.75, .07, 10, 40).rotateY(Math.PI/2), new THREE.MeshBasicMaterial({ color:"#2de2e6", toneMapped:false }), portal, 0, 0, 0, false);
	{ const t = label("Internet : 5 000 joueurs", "#1d2238", 1.6); t.position.set(0, 1.05, 0); portal.add(t); }
	const PK = 80, pkMesh = new THREE.InstancedMesh(boxG(.11, .11, .11), new THREE.MeshBasicMaterial({ toneMapped:false }), PK);
	pkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pkMesh.visible = false; pkMesh.frustumCulled = false; scene.add(pkMesh);
	const pk = Array.from({ length:PK }, (_, i) => ({ t:i/PK, rack:0, drop:false, sp:.8 + Math.random()*.4 }));
	const pkCol = new THREE.Color(), pkObj = new THREE.Object3D();
	for(let i = 0; i < PK; i++) pkMesh.setColorAt(i, pkCol.set("#3bd16f"));
	const cheatPk = add(boxG(.26, .26, .26), new THREE.MeshBasicMaterial({ color:"#ff3b3b", toneMapped:false }), scene, 0, 0, 0, false); cheatPk.visible = false;
	const cheatTag = label("score : 999 999 en 3 s", "#c0392b", 1.5); cheatTag.visible = false; scene.add(cheatTag);
	// le jury (H+47)
	const jury = new THREE.Group(); jury.position.set(0, 0, 4.3); jury.visible = false; scene.add(jury);
	add(boxG(3.4, .06, .8), M("#2b2f45"), jury, 0, .74, 0); add(boxG(3.4, .7, .04), M("#7c5cff"), jury, 0, .4, -.38);
	const jurors = [-1.1, 0, 1.1].map(x => {
		add(boxG(.5, .05, .5), M("#3a3f5c"), jury, x, .45, .6);
		const p = makePerson(jury, true); p.g.position.set(x, 0, .6); p.g.rotation.y = Math.PI;
		const note = label("", "#ffd166", .8); note.position.set(x, 2.5, .6); note.visible = false; jury.add(note);
		return { p, note };
	});

	/* ---------- écran géant et compteur ---------- */
	let screenState = { kind:"title" };
	function drawScreen(){
		const { x } = scr, W = 1024, H = 576, st = STYLES[S.style];
		x.fillStyle = "#0f1226"; x.fillRect(0, 0, W, H);
		x.fillStyle = st.head; x.fillRect(0, 0, W, 64);
		x.fillStyle = "#fff"; x.font = "800 30px Nunito, sans-serif"; x.textBaseline = "middle"; x.textAlign = "left";
		x.fillText("GAME JAM 48 h · École du Numérique", 28, 33);
		x.textAlign = "right"; x.fillText(`Style : ${st.name}`, W - 28, 33);
		const k = screenState.kind;
		x.textAlign = "center";
		if(k === "title"){
			x.fillStyle = "#9aa3d6"; x.font = "700 30px Nunito, sans-serif"; x.fillText("Thème imposé", W/2, 170);
			x.fillStyle = "#ffd166"; x.font = "800 86px Nunito, sans-serif"; x.fillText("« RENTRER À TEMPS »", W/2, 260);
			x.fillStyle = "#e6e8ff"; x.font = "700 30px Nunito, sans-serif"; x.fillText("Un niveau, un héros, un drapeau. 48 heures.", W/2, 360);
			x.fillStyle = "#9aa3d6"; x.font = "700 26px Nunito, sans-serif"; x.fillText("Équipe : Inès (graphisme) · Yanis (son et tests) · toi (code)", W/2, 450);
		} else if(k === "code"){
			x.textAlign = "left"; x.font = "26px ui-monospace, Menlo, Consolas, monospace";
			const p = S.phys || {};
			const lines = [["def mettre_a_jour(heros, dt):", "#c792ea"], [`    heros.vy = heros.vy - ${p.g ?? "?"} * dt`, "#e6e8ff"], ["    if touche_saut and heros.au_sol:", "#e6e8ff"], [`        heros.vy = ${p.v ?? "?"}`, "#e6e8ff"], ["    heros.y = heros.y + heros.vy * dt", "#e6e8ff"], ["    if heros.y < sol:", "#e6e8ff"], [`        heros.y = ${p.sol ?? "?"}`, "#e6e8ff"], ["        heros.vy = 0", "#e6e8ff"], ["        heros.au_sol = True", "#e6e8ff"]];
			lines.forEach(([t, c], i) => { x.fillStyle = c; x.fillText(t, 60, 110 + i*42); });
			if(screenState.status){ x.textAlign = "center"; x.fillStyle = screenState.ok ? "#9dfcb4" : "#ff8a8a"; x.font = "800 34px Nunito, sans-serif"; x.fillText(screenState.status, W/2, 540); }
		} else if(k === "sql"){
			x.textAlign = "left"; x.fillStyle = "#9aa3d6"; x.font = "700 26px Nunito, sans-serif"; x.fillText(screenState.title || "Table « parties »", 60, 112);
			if(screenState.error){ x.fillStyle = "#ff8a8a"; x.font = "800 30px Nunito, sans-serif"; wrap(x, screenState.error, 60, 190, 900, 42); }
			else (screenState.rows || []).slice(0, 8).forEach(([p, s], i) => {
				const y = 165 + i*48; x.fillStyle = i % 2 ? "#161a33" : "#1b2040"; x.fillRect(48, y - 26, W - 96, 46);
				x.fillStyle = screenState.podium && i < 3 ? ["#ffd166", "#cfd6e4", "#e0a070"][i] : "#e6e8ff"; x.font = "800 30px Nunito, sans-serif";
				x.fillText(`${screenState.podium ? `${i + 1}.  ` : ""}${p}`, 70, y); x.textAlign = "right"; x.fillText(String(s).replace(/\B(?=(\d{3})+(?!\d))/g, " "), W - 70, y); x.textAlign = "left";
			});
		} else if(k === "srv"){
			const st2 = { servers:S.servers, cache:S.cache }, u = utilOf(st2), lat = latencyOf(u);
			x.fillStyle = u >= 1 ? "#ff8a8a" : u > .85 ? "#ffb066" : "#9dfcb4"; x.font = "800 64px Nunito, sans-serif";
			x.fillText(u >= 1 ? "ERREUR 503 · serveur saturé" : `${lat} ms`, W/2, 150);
			x.fillStyle = "#9aa3d6"; x.font = "700 28px Nunito, sans-serif";
			x.fillText(`${REQ.toLocaleString("fr-FR")} demandes/s · ${S.servers} serveur${S.servers > 1 ? "s" : ""} · cache ${S.cache ? "activé" : "désactivé"} · charge ${Math.round(u*100)} %`, W/2, 215);
			const hist = screenState.hist || [];
			x.strokeStyle = "#2b3466"; x.lineWidth = 2; x.strokeRect(80, 260, W - 160, 260);
			x.strokeStyle = "#ffd166"; x.setLineDash([10, 10]); x.beginPath(); const yl = 520 - 200/1000*260; x.moveTo(80, yl); x.lineTo(W - 80, yl); x.stroke(); x.setLineDash([]);
			x.fillStyle = "#ffd166"; x.font = "700 20px Nunito, sans-serif"; x.textAlign = "left"; x.fillText("objectif : 200 ms", 90, yl - 14);
			x.strokeStyle = "#2de2e6"; x.lineWidth = 4; x.beginPath();
			hist.forEach((v, i) => { const px = 80 + i/(Math.max(hist.length, 60) - 1)*(W - 160), py = 520 - Math.min(v, 1000)/1000*260; i ? x.lineTo(px, py) : x.moveTo(px, py); });
			x.stroke();
		} else if(k === "jury"){
			x.fillStyle = "#ffd166"; x.font = "800 60px Nunito, sans-serif"; x.fillText("Notes du jury", W/2, 150);
			(screenState.notes || []).forEach(([n, v], i) => { const cx = W/2 + (i - 1)*300; x.fillStyle = "#1b2040"; x.fillRect(cx - 130, 220, 260, 220); x.fillStyle = "#9aa3d6"; x.font = "700 28px Nunito, sans-serif"; x.fillText(n, cx, 270); x.fillStyle = "#fff"; x.font = "800 90px Nunito, sans-serif"; x.fillText(`${v}`, cx, 370); x.font = "700 26px Nunito, sans-serif"; x.fillStyle = "#9aa3d6"; x.fillText("/ 20", cx, 420); });
		}
		scr.t.needsUpdate = true;
	}
	function wrap(x, text, px, py, w, lh){ let line = "", y = py; for(const word of text.split(" ")){ const t = line ? line + " " + word : word; if(x.measureText(t).width > w){ x.fillText(line, px, y); line = word; y += lh; } else line = t; } x.fillText(line, px, y); }
	function setScreen(s){ screenState = s; drawScreen(); }
	function drawLed(h){
		const { x } = led, left = Math.max(0, 48 - h);
		x.fillStyle = "#07080f"; x.fillRect(0, 0, 512, 96);
		x.fillStyle = h >= 46 ? "#ff5a5a" : "#ff9f1c"; x.font = "700 42px ui-monospace, Menlo, Consolas, monospace"; x.textAlign = "center"; x.textBaseline = "middle";
		x.fillText(`H+${String(Math.floor(h)).padStart(2, "0")} · reste ${String(Math.ceil(left)).padStart(2, "0")} h`, 256, 50);
		led.t.needsUpdate = true;
		$("#gjClock").textContent = `H+${String(Math.floor(h)).padStart(2, "0")} · ${clockOf(h)}`;
	}
	function setHour(h){ if(h !== S.hour){ S.hour = h; play("swipe"); } }
	function ambiance(){
		const sky = skyAt(S.hourShown), day = Math.max(0, Math.min(1, (sky.r + sky.g + sky.b)/2.2));
		winMat.color.copy(sky);
		hemi.intensity = .55 + .6*day; sun.intensity = .35 + 1.1*day; sun.color.copy(sky).lerp(new THREE.Color("#ffffff"), .6);
		lamp.intensity = 10 + 12*(1 - day);
		if(S.vrActive){ hemi.intensity *= .3; sun.intensity *= .15; lamp.intensity *= .2; }      // pénombre : seule la lumière réglée éclaire la maquette
		pizzas.visible = S.hourShown >= 18;
		zzz.visible = S.hour === 36;
		yanis.p.g.rotation.x = S.hour === 36 ? .35 : 0;
	}

	/* ---------- caméra ---------- */
	const camP = new THREE.Vector3(0, 6, 11), camT = new THREE.Vector3(0, 1, 0), goalP = new THREE.Vector3(), goalT = new THREE.Vector3();
	let view = "room";
	const VIEWS = {
		room:  () => [[-1.6, 5.6, 10], [-1.6, 1.3, -1.5]],
		screen:() => [[-1.2, 5.8, 3.4], [-1.4, 1.9, -5]],
		rack:  () => [[2, 3.3, 3.8], [5.6, 1.6, -2.6]],
		jury:  () => [[-2.7, 3.1, -1], [0, 1.3, 4.4]],
		table: () => { const d = Math.min(7, (N*B/2 + .25)/(Math.tan(camera.fov*Math.PI/360)*camera.aspect)); return [[0, Y0 + 1.05 + d*.12, d], [0, Y0 + .55, 0]]; },
		top:   () => [[0, Y0 + 2.9, 2.3], [0, Y0 + .3, -.3]],
		fps:   () => { const hx = toWorldX(hero.x), hy = Y0 + Math.max(0, hero.y)*B; return [[hx - 3.2*B, hy + 2.3*B, .6*B], [hx + 4.5*B, hy + .3*B, 0]]; },      // à hauteur du héros, juste derrière lui
		follow:() => { const hx = Math.max(-1.25, Math.min(1.25, toWorldX(hero.x))), hy = Y0 + Math.max(0, hero.y)*B; const d = 2.5*Math.max(1, 1.45/camera.aspect); return [[hx, hy + .3 + d*.16, d], [hx, hy + .25, 0]]; }
	};
	function tickCamera(dt, t){
		const [p, tg] = VIEWS[view]();
		goalP.set(...p); goalT.set(...tg);
		if(view === "room"){ goalP.x += Math.sin(t*.15)*1.2; }
		const k = 1 - Math.exp(-dt*(view === "follow" || view === "fps" ? 5 : 2.6));
		camP.lerp(goalP, k); camT.lerp(goalT, k);
		camera.position.copy(camP); camera.lookAt(camT);
		const fov = view === "fps" ? 62 : 45;
		if(Math.abs(camera.fov - fov) > .05){ camera.fov += (fov - camera.fov)*Math.min(1, dt*4); camera.updateProjectionMatrix(); }
	}

	/* ---------- le moteur du jeu de plateforme ---------- */
	let run = null;
	const input = { l:false, r:false, j:false };
	let H = heights();
	function respawn(){ H = heights(); Object.assign(hero, { x:.5, y:H[0], vy:0, ground:true, face:1 }); }
	function resetCoins(){ coins.forEach(c => { c.got = false; c.m.visible = true; }); }
	const colOf = x => Math.floor(x);
	const solid = (c, y) => c < 0 || c >= N || y < H[c] - 1e-3;
	function groundUnder(x){ let g = 0; for(let c = colOf(x - HW + .02); c <= colOf(x + HW - .02); c++) if(c >= 0 && c < N) g = Math.max(g, H[c]); return g; }
	function moveX(dx){
		const before = [colOf(hero.x - HW), colOf(hero.x + HW - 1e-4)];
		hero.x += dx;
		const yb = hero.y + .02;
		if(dx > 0){ const c = colOf(hero.x + HW - 1e-4); if(c > before[1] && solid(c, yb)) hero.x = c - HW; }
		else if(dx < 0){ const c = colOf(hero.x - HW); if(c < before[0] && solid(c, yb)) hero.x = c + 1 + HW; }
	}
	function physStep(dt, vx, jump, P){
		if(vx) hero.face = Math.sign(vx);
		moveX(vx*dt);
		// le code écrit par le joueur, tel quel
		hero.vy = hero.vy - P.g*dt;
		if(jump && hero.ground){ hero.vy = P.v; hero.ground = false; if(run && run.mode !== "test") play("jump"); }
		hero.y = hero.y + hero.vy*dt;
		const sol = groundUnder(hero.x), wasGround = hero.ground;
		hero.ground = false;
		if(hero.y < sol && hero.y > sol - 1.2 || (hero.y < sol && P.sol !== "sol")){
			hero.y = P.sol === "sol" ? sol : P.sol === "0" ? 0 : hero.y + 1;
			if(!wasGround) hero.squash = 1;
			hero.vy = 0; hero.ground = true;
		}
	}
	function botInput(){
		if(!hero.ground) return { vx:run.airVx, j:false };
		const cur = colOf(hero.x), i = run.path.indexOf(cur);
		if(i < 0 || i === run.path.length - 1) return { vx:0, j:false };
		const a = run.path[i], b = run.path[i + 1], cx = a + .5;
		if(Math.abs(hero.x - cx) > .07) return { vx:Math.sign(cx - hero.x)*3, j:false };
		run.airVx = (b - a)/airtime(H[b] - H[a]);
		return { vx:run.airVx, j:true };
	}
	function startRun(mode, onEnd){
		H = heights(); respawn(); resetCoins();
		const P = S.phys && S.phys.g != null ? { g:+S.phys.g, v:+S.phys.v, sol:S.phys.sol } : { g:G_OK, v:V_OK, sol:"sol" };
		run = { mode, P, t:0, path:bfs(H).path, airVx:0, onEnd, fallsRun:0, stomps:0, lastCol:0 };
		view = "follow";
		foe.on = mode === "play" && !S.custom; if(foe.on) foeReset();
		$("#gjPad").hidden = mode !== "play";
		hint(mode === "play" ? (matchMedia("(pointer:coarse)").matches ? "◀ ▶ pour avancer, Sauter pour sauter" : "← → pour avancer · Espace pour sauter") : null);
		if(mode === "play") canvas.focus({ preventScroll:true });
	}
	function stopRun(){ run = null; if(foe.on){ foe.on = false; clearTiles(); } foeG.visible = false; $("#gjPad").hidden = true; hint(null); Object.keys(input).forEach(k => input[k] = false); root.querySelectorAll(".gj-pad .on").forEach(b => b.classList.remove("on")); }
	function endRun(outcome){ const r = run; stopRun(); r.onEnd && r.onEnd(outcome, r); }
	function tickRun(dt){
		if(!run) return;
		run.t += dt;
		const auto = run.mode !== "play";
		const steps = 3, h = dt/steps;
		for(let s = 0; s < steps && run; s++){
			const inp = auto ? botInput() : { vx:(input.r ? SPEED : 0) - (input.l ? SPEED : 0), j:input.j };
			physStep(h, inp.vx, inp.j, run.P);
			if(!auto && !hero.ground && !input.j && hero.vy > 3) hero.vy -= 30*h;      // saut plus court si l'on relâche
			for(const c of coins) if(!c.got && Math.abs(hero.x - c.x) < .6 && Math.abs(hero.y + .4 - c.y) < .7){ c.got = true; c.m.visible = false; if(run.mode !== "test"){ S.coins++; play("coin"); } }
			if(colOf(hero.x) === FLAG && hero.ground && Math.abs(hero.y - H[FLAG]) < .05){ play("win"); return endRun("win"); }
			if(hero.y < -2.5){
				if(run.mode === "test") return endRun("fell");
				S.falls++; run.fallsRun++; play("bad"); respawn(); resetCoins();
			}
			if(hero.y > 15) return endRun("flew");
		}
		if(!run) return;
		if(hero.ground && H[colOf(hero.x)]) run.lastCol = colOf(hero.x);
		tickFoe(dt);
		if(run && run.mode === "test" && run.t > 6.5) endRun("timeout");
	}
	function foeReset(){ foe.c = FOE_START; foe.x = FOE_START + .5; foe.y = H[FOE_START]; foe.hop = 0; foe.wait = 1.2; foe.dead = 0; foeG.scale.setScalar(1); }
	// le chemin calculé par l'ennemi s'allume en rouge sur la maquette
	function trail(path){ clearTiles(); path.slice(1).forEach(c => { const t = tiles[c]; t.visible = true; t.material.color.set("#ff5a5a"); t.material.opacity = .55; }); }
	function tickFoe(dt){
		if(!foe.on || !run) return;
		if(foe.dead > 0){ foe.dead -= dt; foeG.scale.setScalar(Math.max(.01, foe.dead/.6)); if(foe.dead <= 0) foeReset(); return; }
		if(foe.hop > 0){
			foe.hop = Math.max(0, foe.hop - dt/.45);
			const k = 1 - foe.hop;
			foe.x = foe.from + .5 + (foe.to - foe.from)*k; foe.y = H[foe.from] + (H[foe.to] - H[foe.from])*k + Math.sin(k*Math.PI)*1.1;
			if(!foe.hop){ foe.c = foe.to; foe.y = H[foe.c]; }
		} else if((foe.wait -= dt) <= 0){
			foe.wait = .5;
			const p = bfs(H, foe.c, run.lastCol).path;      // même règle de saut que le héros
			trail(p);
			if(p.length > 1){ foe.from = foe.c; foe.to = p[1]; foe.hop = 1; }
		}
		// contact : lui sauter dessus l'assomme, le toucher de côté renvoie au départ
		if(Math.abs(hero.x - foe.x) < .62 && hero.y < foe.y + .5 && hero.y + HH > foe.y){
			if(hero.vy < 0 && hero.y > foe.y + .22){ foe.dead = .6; foe.hop = 0; hero.vy = 7; S.stomps++; run.stomps++; play("stomp"); clearTiles(); }
			else { play("hurt"); S.falls++; run.fallsRun++; respawn(); resetCoins(); foeReset(); clearTiles(); }
		}
	}
	function drawHero(dt, t){
		heroG.position.set(hero.x, hero.y, 0);
		heroG.rotation.y += ((hero.face > 0 ? .5 : -.5) - heroG.rotation.y)*Math.min(1, dt*10);
		hero.squash = Math.max(0, hero.squash - dt*5);
		const sq = hero.ground ? 1 - .25*hero.squash : 1.08;
		heroBody.scale.set(1 + (1 - sq)*.8, sq, 1);
		heroBody.position.y = .36*sq + (hero.ground && !run ? Math.abs(Math.sin(t*3))*.06 : 0);
		cloth.rotation.y = Math.sin(t*3)*.25;
		foeG.visible = foe.on && !!run;
		if(foeG.visible){ foeG.position.set(foe.x, foe.y, 0); foeBody.position.y = .25 + (foe.hop || foe.dead ? 0 : Math.abs(Math.sin(t*6))*.05); foeG.rotation.y = Math.sign(hero.x - foe.x)*.4; }
		coins.forEach((c, i) => c.m.rotation.y = t*2.4 + i);
	}

	/* ---------- éditeur de niveau ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	function pick(e){
		const r = canvas.getBoundingClientRect();
		ndc.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1);
		ray.setFromCamera(ndc, camera);
		const b = ray.intersectObjects(blocks.children, false)[0];
		if(b) return { col:b.object.userData.col, block:b.object };
		const h = ray.intersectObjects(hit, false)[0];
		return h ? { col:h.object.userData.col } : null;
	}
	const editing = () => S.mode === "edit" || S.mode === "free";
	// un clic ajoute un bloc sur la colonne ; sur un bloc jaune (H+00) ou n'importe quel bloc (éditeur libre), il en retire un
	const removes = p => p.block && (S.mode === "free" || p.block.userData.mine);
	let down = null;
	canvas.addEventListener("pointerdown", e => { down = { x:e.clientX, y:e.clientY }; });
	canvas.addEventListener("pointermove", e => {
		if(!editing() || e.pointerType === "touch"){ ghost.visible = false; return; }
		const p = pick(e), Hh = heights();
		ghost.visible = !!(p && !removes(p) && Hh[p.col] < MAXH && (S.mode === "free" || used() < BUDGET));
		if(ghost.visible) ghost.position.set(p.col + .5, Hh[p.col] + .5, 0);
		canvas.style.cursor = p ? "pointer" : "";
	});
	canvas.addEventListener("pointerup", e => {
		if(!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
		down = null;
		if(!editing()) return;
		const p = pick(e); if(!p) return;
		if(S.mode === "free"){
			const Hc = S.custom;
			if(removes(p)){ if(Hc[p.col] <= (p.col === 0 || p.col === FLAG ? 1 : 0)){ play("bad"); return; } Hc[p.col]--; }
			else if(Hc[p.col] >= MAXH) return;
			else Hc[p.col]++;
			play("pop"); buildLevel(); clearTiles(); respawn(); ghost.visible = false;
			return;
		}
		if(removes(p)){ S.extra[p.col]--; play("pop"); }
		else if(used() >= BUDGET){ play("bad"); return editMsg("in", `Tu as posé tes ${BUDGET} blocs. Touche un bloc jaune pour le reprendre.`); }
		else if(heights()[p.col] >= MAXH) return;
		else { S.extra[p.col]++; play("pop"); }
		buildLevel(); clearTiles(); refreshBudget(); ghost.visible = false;
	});

	/* ---------- panneau ---------- */
	function show(html){ bfsAnim = null; card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; pan.scrollTo({ top:0, behavior:"smooth" }); }
	function stage(t){ $("#gjSt").textContent = t; onEvent && onEvent("stage", t); }
	function err(why){ S.errors++; play("bad"); onEvent && onEvent("err", why); $("#gjErr").textContent = `🐞 ${S.errors} erreur${S.errors > 1 ? "s" : ""}`; }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="gj-course"><span class="tag">📚 En Licence Informatique · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	const say = (who, t) => `<div class="gj-say"><i>${who === "ines" ? "🎨" : who === "yanis" ? "🎧" : who === "jury" ? "⚖️" : "📢"}</i><div><b>${TEAM[who] ? TEAM[who][0] : who === "jury" ? "Le jury" : "Annonce"}</b> · ${t}</div></div>`;
	function msg(el, cls, t){ el.className = "gj-msg " + cls; el.innerHTML = t; el.hidden = false; }
	function hint(t){ const h = $("#gjHint"); h.hidden = !t; if(t) h.textContent = t; }
	function qcm(el, opts, good, onOk){
		el.innerHTML = `<div class="gj-opts">${opts.map(([v, t]) => `<button class="gj-opt" data-q="${v}">${t}</button>`).join("")}</div><div class="gj-msg" hidden></div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".gj-opt.ok")) return;
			const o = opts.find(x => x[0] === b.dataset.q);
			if(b.dataset.q !== good){ err(b.textContent); b.classList.add("ko"); if(o[2]) msg(el.querySelector(".gj-msg"), "ko", o[2]); return; }
			b.classList.add("ok"); play("good"); el.querySelector(".gj-msg").hidden = true; onOk(el.querySelector("[data-after]"));
		}));
	}
	function setMode(m){ S.mode = m; if(m !== "edit" && m !== "free") ghost.visible = false; canvas.style.cursor = ""; }
	function scene0(){ stopRun(); clearTiles(); S.vrActive = false; scene.fog = null; dioSun.intensity = 0; podium.visible = false; portal.visible = false; pkMesh.visible = false; cheatPk.visible = false; cheatTag.visible = false; alarm.visible = false; jury.visible = false; jurors.forEach(j => j.note.visible = false); }

	/* ---------- intro ---------- */
	function intro(){
		scene0(); setMode("idle"); stage("Game Jam 48 h"); S.hour = 0; S.hourShown = 0; drawLed(0); view = "room"; respawn(); setScreen({ kind:"title" });
		show(`<div class="gj-k">Mini-jeu · ${formation.name}</div><h2 class="gj-h">Game Jam 48 h</h2>
			${SHARED ? `<div class="gj-shared">🎁 Quelqu'un t'a envoyé son niveau !<button class="gj-go" data-a="shared" style="margin-top:8px">🎮 Jouer à ce niveau</button></div>` : ""}
			<p class="gj-p">Vendredi 18 h, salle de l'École du Numérique à Wenov. Comme toutes les équipes de L1 du <b>Projet Gaming</b>, la tienne a <b>48 heures</b> pour créer un jeu vidéo et le présenter au jury.</p>
			${say("ines", "Le thème est tombé : <b>« Rentrer à temps »</b>. Un petit héros doit atteindre le drapeau. J'ai déjà posé la maquette du niveau sur la table. Tu choisis le style ?")}
			<div class="gj-styles">${Object.entries(STYLES).map(([k, s]) => `<button data-style="${k}" class="${k === S.style ? "on" : ""}"><i>${s.icon}</i>${s.name}</button>`).join("")}</div>
			<ul class="gj-list"><li><span>H+00</span>Dessiner un niveau faisable</li><li><span>H+06</span>Programmer le héros en Python</li><li><span>H+20</span>Mettre les scores en ligne</li><li><span>H+28</span>Créer l'ambiance en réalité virtuelle</li><li><span>H+36</span>Tenir quand le jeu buzze</li><li><span>H+47</span>Passer devant le jury</li></ul>
			<p class="gj-p" style="font-size:13px;color:#5d5978">Pas besoin de savoir programmer : tout s'apprend en licence.</p>
			<button class="gj-go" data-a="m1">C'est parti ⏱</button>`);
	}

	/* ---------- H+0 · le niveau (structures de données, parcours en largeur) ---------- */
	let bfsAnim = null;
	function clearTiles(){ tiles.forEach(t => { t.visible = false; t.scale.set(1, 1, 1); t.material.opacity = .9; }); }
	function refreshBudget(){ const b = card.querySelector("#gjBud"); if(b) b.textContent = `${BUDGET - used()} / ${BUDGET}`; }
	function editMsg(cls, t){ const m = card.querySelector("[data-live]"); if(m) msg(m, cls, t); }
	function mission1(){
		scene0(); setHour(0); stage("H+00 · Le niveau"); setMode("edit"); view = "table"; S.levelOk = false; S.custom = null;
		buildLevel(); respawn(); setScreen({ kind:"title" });
		show(`<div class="gj-k">H+00 · Projet Gaming · level design</div><h2 class="gj-h">Ce niveau est-il faisable ?</h2>
			${say("ines", "J'ai dessiné le niveau, mais je crois qu'il y a un trou trop large… et un mur trop haut. Tu as <b>3 blocs</b> pour arranger ça.")}
			<div class="gj-rule"><span>⬆️ monte 1 bloc au plus</span><span>↔️ saute 2 trous au plus</span></div>
			<p class="gj-p"><b>Touche une colonne</b> de la maquette pour y poser un bloc (touche un bloc jaune pour le reprendre). Blocs restants : <b id="gjBud">${BUDGET} / ${BUDGET}</b></p>
			<p class="gj-p">Ensuite, on ne devine pas : un <b>parcours en largeur</b> explore toutes les colonnes que le héros peut atteindre, en partant du début, avec une <b>file d'attente</b>.</p>
			<div class="gj-msg in" data-live>Le héros part de la colonne 0, le drapeau est sur la colonne 15.</div>
			<button class="gj-go" data-a="bfs">🔍 Lancer le parcours en largeur</button>
			<button class="gj-alt" data-a="reset">↺ Reprendre tous mes blocs</button><div data-end></div>`);
	}
	function startBfs(){
		if(S.mode !== "edit") return;
		const res = bfs(heights());
		setMode("bfs"); clearTiles();
		const live = card.querySelector("[data-live]");
		msg(live, "in", "Exploration…");
		$("#gjQ")?.remove();
		live.insertAdjacentHTML("afterend", `<div class="gj-q" id="gjQ">File : <em>[0]</em></div>`);
		card.querySelector("[data-a=bfs]").disabled = true;
		bfsAnim = { res, i:0, t:0, phase:"explore" };
	}
	function tickBfs(dt){
		if(!bfsAnim) return;
		const A = bfsAnim; A.t += dt;
		if(A.phase === "explore" && A.t > .42){
			A.t = 0;
			const s = A.res.steps[A.i++];
			if(!s){ A.phase = "path"; A.i = 0; return; }
			const tl = tiles[s.c]; tl.visible = true; tl.material.color.set(s.c === FLAG ? "#ffd166" : "#7dff9a"); tl.scale.set(1.3, 1, 1.3);
			play("pop");
			const q = $("#gjQ"); if(q) q.innerHTML = `On sort la colonne <em>${s.c}</em> de la file${s.found.length ? `, on y ajoute ${s.found.map(c => `<em>${c}</em>`).join(", ")}` : ""}.<br>File : <em>[${s.q.join(", ")}]</em>`;
		} else if(A.phase === "path"){
			if(!A.res.ok){ bfsAnim = null; return bfsDone(A.res); }
			if(A.t > .16){ A.t = 0; const c = A.res.path[A.i++]; if(c == null){ bfsAnim = null; return bfsDone(A.res); } tiles[c].material.color.set("#ffd166"); tiles[c].scale.set(1.15, 2.2, 1.15); }
		}
		tiles.forEach(t => { if(t.visible){ const k = Math.min(1, dt*6); t.scale.x += (1 - t.scale.x)*k; t.scale.z += (1 - t.scale.z)*k; } });
	}
	function bfsDone(res){
		const live = card.querySelector("[data-live]"); if(!live) return;
		if(!res.ok){
			setMode("edit"); card.querySelector("[data-a=bfs]").disabled = false;
			err("niveau impossible");
			const { far, why } = obstacle(heights(), res);
			return msg(live, "ko", `La file s'est vidée sans atteindre le drapeau : le héros ne dépasse pas la colonne ${far}. Ici, ${why} Déplace tes blocs et relance.`);
		}
		setMode("idle"); S.levelOk = true; play("good");
		msg(live, "ok", `✓ Le drapeau est atteignable ! En jaune : le plus court chemin trouvé, ${res.path.length - 1} sauts. ${used() < BUDGET ? `Et il te reste ${BUDGET - used()} bloc${BUDGET - used() > 1 ? "s" : ""} : niveau économe.` : ""}`);
		card.querySelector("[data-a=reset]").hidden = true; card.querySelector("[data-a=bfs]").hidden = true;
		card.querySelector("[data-end]").innerHTML = `${say("ines", "Parfait. Et Yanis a une idée : se servir du même parcours en largeur pour faire courir un ennemi vers le héros…")}${course("gaming")}${course("algo")}<button class="gj-go" data-a="m2">⏩ H+06 · Coder le héros</button>`;
	}
	// l'obstacle qui bloque : la première colonne pleine après la plus lointaine atteinte
	function obstacle(Hh, res){
		const far = Math.max(...res.steps.map(s => s.c)); let n = far + 1; while(n < N && !Hh[n]) n++;
		const holes = n - far - 1, up = Hh[n] - Hh[far];
		return { far, why:holes > 2 ? `après la colonne ${far}, il y a ${holes} cases vides : le héros n'en franchit que 2.` : `la colonne ${n} fait ${up} blocs de plus que la colonne ${far} : le héros ne monte qu'un bloc à la fois.` };
	}
	function ensureLevel(){ S.custom = null; if(!S.levelOk){ S.extra = Array(N).fill(0); for(const c in SOLUTION) S.extra[c] = SOLUTION[c]; S.levelOk = true; } buildLevel(); clearTiles(); }

	/* ---------- H+6 · la physique (programmation) ---------- */
	const PH = {
		g:[["20", "20"], ["-20", "-20"], ["0", "0"]],
		v:[["8", "8"], ["3", "3"], ["25", "25"]],
		sol:[["sol", "sol"], ["0", "0"], ["heros.y + 1", "heros.y + 1"]]
	};
	function mission2(){
		scene0(); ensureLevel(); setHour(6); stage("H+06 · Le héros"); setMode("idle"); view = "table"; respawn();
		S.phys = { g:null, v:null, sol:null }; S.physOk = false; setScreen({ kind:"code" });
		const sel = k => `<select data-p="${k}" aria-label="Valeur ${k}"><option value="">?</option>${shuffle(PH[k]).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
		show(`<div class="gj-k">H+06 · L1 programmation</div><h2 class="gj-h">Minuit : le héros ne tient pas debout</h2>
			${say("yanis", "Il est minuit, j'ai fini les bruitages. Mais le héros n'a pas encore de physique : il faut écrire la fonction qui tourne <b>60 fois par seconde</b>. En L1, on programme en <b>Python</b>.")}
			<div class="gj-code"><span class="kw">def</span> mettre_a_jour(heros, dt):
    heros.vy = heros.vy - ${sel("g")} * dt  <span class="cm"># gravité</span>
    <span class="kw">if</span> touche_saut <span class="kw">and</span> heros.au_sol:
        heros.vy = ${sel("v")}           <span class="cm"># élan du saut</span>
    heros.y = heros.y + heros.vy * dt
    <span class="kw">if</span> heros.y &lt; sol:               <span class="cm"># sous le sol ?</span>
        heros.y = ${sel("sol")}
        heros.vy = 0
        heros.au_sol = <span class="kw">True</span></div>
			<p class="gj-p" style="font-size:13px;color:#5d5978"><b>vy</b> : vitesse verticale (positive vers le haut) · <b>sol</b> : hauteur du bloc sous ses pieds · en blocs par seconde.</p>
			<div class="gj-msg in" data-live>Choisis les trois valeurs, puis Yanis teste le niveau avec ton code.</div>
			<button class="gj-go" data-a="test">▶ Tester avec ce code</button><div data-end></div>`);
		card.querySelectorAll("select[data-p]").forEach(s => s.addEventListener("change", () => { S.phys[s.dataset.p] = s.value || null; s.classList.remove("ko"); play("keys"); drawScreen(); }));
	}
	function diagnose(P){
		if(P.g === "-20") return ["g", "Le héros s'envole et ne redescend jamais : avec -20, on <b>ajoute</b> de la vitesse vers le haut à chaque image. La gravité doit faire <b>diminuer</b> vy."];
		if(P.g === "0") return ["g", "Sans gravité, le héros saute… et file en ligne droite vers le ciel : rien ne le fait retomber."];
		if(P.sol === "0") return ["sol", "Le héros s'enfonce dans le bloc : <b>heros.y = 0</b> le place tout en bas du monde, pas sur le sol sous ses pieds."];
		if(P.sol === "heros.y + 1") return ["sol", "Le héros grimpe tout seul par bonds : à chaque contact il remonte d'un bloc entier au lieu de se poser <b>sur</b> le sol."];
		if(P.v === "3") return ["v", "Saut trop faible : le héros décolle à peine (0,2 bloc) et tombe dans le premier trou."];
		if(P.v === "25") return ["v", "Saut beaucoup trop fort : le héros monte à 15 blocs et sort de l'écran. Personne ne pourrait viser une plateforme."];
		return null;
	}
	function testPhys(){
		const live = card.querySelector("[data-live]"), btn = card.querySelector("[data-a=test]");
		let missing = false;
		card.querySelectorAll("select[data-p]").forEach(s => { s.classList.toggle("ko", !s.value); if(!s.value) missing = true; });
		if(missing) return msg(live, "ko", "Choisis une valeur pour chaque trou avant de tester.");
		btn.disabled = true; card.querySelectorAll("select[data-p]").forEach(s => s.disabled = true);
		msg(live, "in", "🎧 Yanis lance le niveau avec ton code…");
		setScreen({ kind:"code", status:"Test en cours…" });
		startRun("test", outcome => {
			btn.disabled = false; card.querySelectorAll("select[data-p]").forEach(s => s.disabled = false);
			const d = diagnose(S.phys);
			if(outcome === "win" && !d){
				S.physOk = true; setScreen({ kind:"code", status:"✓ Test réussi", ok:true });
				msg(live, "ok", "✓ Le héros tombe, saute, atterrit… et atteint le drapeau. Ton code tourne pour de vrai !");
				btn.hidden = true;
				card.querySelector("[data-end]").innerHTML = `${say("yanis", "Trop bien ! J'ai lâché un <b>bug rouge</b> dans le niveau : il calcule son chemin vers toi avec le même <b>parcours en largeur</b> qu'à H+00 (ses cases s'allument en rouge). Saute-lui dessus ! Si tu bloques, je finis le niveau.")}<button class="gj-go" data-a="play">🎮 Jouer au niveau</button><button class="gj-alt" data-a="auto">🎧 Laisser Yanis jouer</button>`;
				return;
			}
			setScreen({ kind:"code", status:"✗ Bug !" });
			err(d ? d[0] : outcome);
			if(d) card.querySelector(`select[data-p=${d[0]}]`).classList.add("ko");
			msg(live, "ko", d ? d[1] : "Yanis a raté un saut : relance le test.");
			setTimeout(() => { if(!run) { respawn(); view = "table"; } }, 900);
		});
	}
	function playLevel(mode, after){
		const end = card.querySelector("[data-end]");
		end.innerHTML = `<div class="gj-msg in" data-play>${mode === "play" ? "Atteins le drapeau ! Ramasse les pièces, et saute sur le bug rouge." : "Yanis joue (il a mis le bug en pause)…"}</div>${mode === "play" ? `<button class="gj-alt" data-a="auto">🎧 Laisser Yanis finir</button>` : ""}`;
		const coinsBefore = S.coins;
		startRun(mode, (o, r) => {
			const got = S.coins - coinsBefore;
			after(o, got, r);
		});
		if(mode === "play") pan.scrollTo({ top:pan.scrollHeight, behavior:"smooth" });
	}
	function afterPlay2(o, got, r){
		view = "table";
		card.querySelector("[data-end]").innerHTML = `<div class="gj-msg ok">🏁 Drapeau atteint${r.mode === "play" ? ` : ${got} pièce${got > 1 ? "s" : ""} sur 3${r.stomps ? `, ${r.stomps} bug${r.stomps > 1 ? "s" : ""} écrasé${r.stomps > 1 ? "s" : ""}` : ""}${r.fallsRun ? `, ${r.fallsRun} retour${r.fallsRun > 1 ? "s" : ""} au départ` : ", sans tomber"}` : " par Yanis"}.</div>
			${course("prog")}<button class="gj-go" data-a="m3">⏩ H+20 · Les scores en ligne</button>`;
	}
	function ensurePhys(){ if(!S.physOk){ S.phys = { g:"20", v:"8", sol:"sol" }; S.physOk = true; } }

	/* ---------- H+20 · le classement (bases de données, back-end) ---------- */
	function mission3(){
		scene0(); ensureLevel(); ensurePhys(); setHour(20); stage("H+20 · Les scores"); setMode("idle"); view = "screen"; respawn();
		setScreen({ kind:"sql", rows:PARTIES, title:"Table « parties » (extrait)" });
		const sel = k => `<select data-s="${k}" aria-label="Morceau de requête ${k}">${shuffle(SQL[k]).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
		show(`<div class="gj-k">H+20 · L1 bases de données</div><h2 class="gj-h">Samedi 14 h : le podium des joueurs</h2>
			${say("ines", "On a mis une version en ligne et nos amis jouent déjà ! Chaque partie est enregistrée dans la table <b>parties</b>. Il faut afficher le <b>podium</b> : les 3 meilleurs joueurs, chacun une seule fois.")}
			<table class="gj-tbl"><tr><th>pseudo</th><th>score</th></tr>${PARTIES.slice(0, 6).map(([p, s]) => `<tr><td>${p}</td><td>${s}</td></tr>`).join("")}<tr><td colspan="2" style="color:#8a85a3">… ${PARTIES.length - 6} autres parties (à l'écran)</td></tr></table>
			<div class="gj-code">SELECT pseudo, ${sel("agg")} AS meilleur
FROM parties
${sel("grp")}
ORDER BY meilleur ${sel("ord")}
LIMIT ${sel("lim")};</div>
			<div class="gj-msg in" data-live>Compose la requête, puis exécute-la : le résultat s'affiche sur le grand écran.</div>
			<button class="gj-go" data-a="sql">▶ Exécuter la requête</button><div data-end></div>`);
	}
	function runSql(){
		const live = card.querySelector("[data-live]"), q = {};
		card.querySelectorAll("select[data-s]").forEach(s => q[s.dataset.s] = s.value);
		const r = runQuery(q);
		const ok = q.agg === "MAX(score)" && q.grp && q.ord === "DESC" && q.lim === "3";
		if(r.error){ setScreen({ kind:"sql", error:r.error, title:"Résultat" }); err("sql"); return msg(live, "ko", r.error + " Il faut un calcul, comme MAX(score)."); }
		setScreen({ kind:"sql", rows:r.rows, title:"Résultat de la requête", podium:ok });
		if(ok){
			play("good"); msg(live, "ok", "✓ Le podium est juste : chaque joueur une fois, avec son meilleur score.");
			card.querySelector("[data-a=sql]").hidden = true; card.querySelectorAll("select[data-s]").forEach(s => s.disabled = true);
			podium.visible = true; podiumPeople.forEach((p, i) => { p.g.position.y = -3; p.rise = .25*i; setLabel(p.tag, r.rows[i][0]); });
			card.querySelector("[data-end]").innerHTML = `<p class="gj-p" style="margin-top:10px">Le jeu ne parle jamais directement à la base : il appelle l'<b>API</b> de l'équipe, qui exécute ta requête et répond en JSON.</p>
				<div class="gj-json">GET /api/podium
→ [ { "pseudo": "${r.rows[0][0]}", "meilleur": ${r.rows[0][1]} },
    { "pseudo": "${r.rows[1][0]}", "meilleur": ${r.rows[1][1]} },
    { "pseudo": "${r.rows[2][0]}", "meilleur": ${r.rows[2][1]} } ]</div>
				${course("bdd")}${course("back")}<button class="gj-go" data-a="mvr">⏩ H+28 · L'ambiance en VR</button>`;
			return;
		}
		err("sql");
		const why = !q.grp && q.agg === "score" ? "kraken apparaît deux fois : sans <b>GROUP BY pseudo</b>, chaque partie est une ligne. Il faut regrouper les parties par joueur."
			: !q.grp ? "Une seule ligne : sans GROUP BY, le calcul porte sur toute la table d'un coup. Regroupe par joueur."
			: q.agg === "SUM(score)" ? "Maya passe en tête avec 4 parties moyennes : <b>SUM</b> additionne tout, ça récompense ceux qui jouent beaucoup, pas les meilleurs."
			: q.ord === "ASC" ? "C'est le podium des <b>pires</b> scores : ASC trie du plus petit au plus grand."
			: "Un podium, c'est 3 joueurs : regarde la ligne LIMIT.";
		msg(live, "ko", why);
	}
	function setLabel(s, text, color = "#7c5cff"){ const c = s.userData.canvas, x = c.getContext("2d"); x.clearRect(0, 0, 256, 72); x.fillStyle = color; x.beginPath(); x.roundRect(4, 4, 248, 64, 32); x.fill(); fitText(x, text); s.material.map.needsUpdate = true; }

	/* ---------- H+36 · le serveur tombe (réseaux, cloud, cyber) ---------- */
	let srv = null;
	function mission4(){
		scene0(); ensureLevel(); ensurePhys(); setHour(36); stage("H+36 · Le jeu buzze"); setMode("idle"); view = "rack";
		S.servers = 1; S.cache = false;
		srv = { hist:[], t:0, phase:"tune" };
		portal.visible = true; pkMesh.visible = true; racks.forEach((r, i) => r.visible = i < S.servers);
		setScreen({ kind:"srv", hist:srv.hist });
		show(`<div class="gj-k">H+36 · réseaux et cloud</div><h2 class="gj-h">Dimanche 6 h : 5 000 joueurs d'un coup</h2>
			${say("annonce", "Un streamer lillois a joué à votre jeu en direct cette nuit. <b>5 000 demandes par seconde</b> arrivent sur le classement… et votre unique serveur n'en traite que 1 000.")}
			${say("ines", "Yanis dort sur son clavier. Les joueurs voient « Erreur 503 ». On a de quoi payer <b>3 serveurs</b> pour le week-end, pas plus.")}
			<div class="gj-srv">
				<label>Serveurs<b id="gjN">1</b></label><input type="range" min="1" max="6" value="1" id="gjSrv" aria-label="Nombre de serveurs">
				<label><span>🗄️ Garder le podium en cache (recalculé toutes les 10 s au lieu d'à chaque demande)</span><input type="checkbox" id="gjCache"></label>
				<div class="gj-meters" id="gjMet"></div>
			</div>
			<div class="gj-msg in" data-live>Règle l'infrastructure : moins de 200 ms de réponse, 3 serveurs au plus.</div>
			<button class="gj-go" data-a="deploy">🚀 Mettre en production</button><div data-end></div>`);
		const upd = () => { S.servers = +$("#gjSrv").value; S.cache = $("#gjCache").checked; racks.forEach((r, i) => r.visible = i < S.servers); meters(); };
		$("#gjSrv").addEventListener("input", upd); $("#gjCache").addEventListener("change", () => { upd(); play("pop"); });
		meters();
	}
	function meters(){
		const u = utilOf(S), lat = latencyOf(u), el = $("#gjMet"); if(!el) return;
		$("#gjN").textContent = S.servers;
		el.innerHTML = `<div>Demandes à traiter<b>${Math.round(loadOf(S)).toLocaleString("fr-FR")}/s</b></div><div>Capacité<b>${(S.servers*CAP).toLocaleString("fr-FR")}/s</b></div>
			<div class="${u > .85 ? "bad" : "ok"}">Temps de réponse<b>${u >= 1 ? "> 3 s ⚠" : lat + " ms"}</b></div><div class="${S.servers > MAX_SRV ? "bad" : "ok"}">Budget<b>${S.servers} / ${MAX_SRV} serveurs</b></div>`;
	}
	function deploy(){
		const live = card.querySelector("[data-live]"), u = utilOf(S);
		if(S.servers > MAX_SRV){ err("budget"); return msg(live, "ko", `Ça tiendrait… mais ${S.servers} serveurs, c'est au-dessus du budget de l'équipe (${MAX_SRV}).${S.cache ? "" : " Indice : 65 % des demandes réclament exactement le même podium."}`); }
		if(u > .85){ err("lent"); return msg(live, "ko", u >= 1 ? `Toujours saturé : ${Math.round(loadOf(S)).toLocaleString("fr-FR")} demandes/s pour ${(S.servers*CAP).toLocaleString("fr-FR")} de capacité.${S.cache ? "" : " Indice : 65 % des demandes réclament exactement le même podium. Faut-il le recalculer à chaque fois ?"}` : `Presque : ${Math.round(u*100)} % de charge, ${latencyOf(u)} ms. Au moindre pic, ça recasse. Ajoute de la marge.`); }
		play("good"); srv.phase = "cheat";
		card.querySelector("[data-a=deploy]").hidden = true; $("#gjSrv").disabled = true; $("#gjCache").disabled = true;
		msg(live, "ok", `✓ ${latencyOf(u)} ms, ${S.servers} serveurs : le <b>cache</b> évite de recalculer le podium 3 250 fois par seconde, et la charge est <b>répartie</b> entre les serveurs.`);
		launchCheat("score : 999 999 en 3 s", "#ff3b3b");
		const end = card.querySelector("[data-end]");
		end.innerHTML = `${say("ines", "Attends… un paquet rouge : <b>« xX_Max_Xx : 999 999 points en 3 secondes »</b>. Le niveau rapporte au plus 3 pièces ! Il a modifié le jeu sur son ordinateur.")}<p class="gj-p"><b>Où faut-il vérifier les scores ?</b></p><div data-q></div>`;
		qcm(end.querySelector("[data-q]"), shuffle([
			["srv", "Sur le serveur : il refuse un score impossible (durée de la partie, pièces ramassées)"],
			["client", "Dans le jeu, sur l'ordinateur du joueur, avant l'envoi", "Le tricheur contrôle son ordinateur : il peut modifier le jeu et sauter cette vérification. Ce qui compte se vérifie là où il n'a pas la main."],
			["chiffre", "On chiffre le score pour qu'il ne puisse pas le lire", "Chiffrer protège un message des regards, mais n'empêche pas d'envoyer un faux score… chiffré."]
		]), "srv", x => {
			srv.phase = "blocked";
			x.innerHTML = `<p class="gj-p" style="margin-top:8px">🛡️ Le serveur rejette le paquet : <b>jamais confiance au client</b>. C'est la première règle des parcours Cyber, et du back-end.</p>
				${say("ines", "Max ne lâche pas : il prend une vraie partie à <b>1 990</b> points et change juste le chiffre en route. Le serveur ne peut pas deviner que c'est faux… sauf si chaque score est <b>signé</b>.")}
				<p class="gj-p">À la fin d'une partie, le serveur calcule une <b>signature</b> : l'empreinte de <i>clé secrète + pseudo + score</i>. Changer un seul chiffre change toute l'empreinte. Vérifie les trois scores qui arrivent :</p>
				<div class="gj-pk">${SIGNED.map(([p, s, real], i) => `<div data-i="${i}">${p} · <em>${s.toLocaleString("fr-FR")}</em> pts<br>signature reçue <em>${sign(p, real)}</em><div class="row"><button data-sig="check">🔏 Recalculer la signature</button></div></div>`).join("")}</div>
				<div class="gj-msg" hidden data-sigmsg></div><div data-sigend></div>`;
			setTimeout(() => { if(!closed && srv && !srv.maxDone) launchCheat("xX_Max_Xx : 2 990 pts", "#d9822b"); }, 1300);
			const done = new Set();
			x.querySelector(".gj-pk").addEventListener("click", e => {
				const b = e.target.closest("[data-sig]"); if(!b || b.disabled) return;
				const row = b.closest("[data-i]"), i = +row.dataset.i, [p, s, real] = SIGNED[i], good = s === real;
				if(b.dataset.sig === "check"){
					play("keys");
					const mine = sign(p, s);
					row.querySelector(".row").innerHTML = `<span class="st ${good ? "" : "bad"}">recalculée ${mine} ${good ? "= ✓" : "≠ ✗"}</span><button data-sig="ok">Accepter</button><button data-sig="no">Rejeter</button>`;
					return;
				}
				if(done.has(i)) return;
				const accept = b.dataset.sig === "ok", m = x.querySelector("[data-sigmsg]");
				if(accept !== good){ err("signature"); b.classList.add("ko"); return msg(m, "ko", accept ? "Les deux signatures ne correspondent pas : le score a été modifié après la partie. Il faut le rejeter." : "Les signatures sont identiques : ce score n'a pas été touché. Le rejeter, c'est punir un joueur honnête."); }
				done.add(i); b.classList.add("ok"); play("good"); m.hidden = true;
				row.querySelectorAll("button").forEach(z => z.disabled = true);
				if(!good){ srv.maxDone = true; srv.phase = "blocked"; }
				if(done.size === SIGNED.length) sigQuiz(x.querySelector("[data-sigend]"));
			});
		});
		pan.scrollTo({ top:pan.scrollHeight, behavior:"smooth" });
	}
	function launchCheat(text, color){ cheatPk.visible = true; cheatPk.scale.setScalar(1); cheatPk.material.color.set(color); setLabel(cheatTag, text, color); cheatTag.visible = true; srv.cheatT = 0; srv.phase = "cheat"; }
	function sigQuiz(el){
		el.innerHTML = `<p class="gj-p" style="margin-top:10px"><b>Pourquoi Max ne peut-il pas fabriquer la bonne signature pour 2 990 ?</b></p><div data-q></div>`;
		qcm(el.querySelector("[data-q]"), shuffle([
			["cle", "Il ne connaît pas la clé secrète : elle ne quitte jamais le serveur"],
			["long", "La signature est trop longue à recopier", "Recopier 8 caractères, c'est facile. Ce qui manque à Max, c'est de quoi les calculer."],
			["cesar", "Elle est protégée par un code de César", "Un code de César se casse en 25 essais. Ici, sans la clé secrète, impossible de calculer l'empreinte."]
		]), "cle", y => {
			y.innerHTML = `<p class="gj-p" style="margin-top:8px">🔏 C'est le principe d'une signature : sans la clé, impossible de produire une empreinte valide, et la moindre modification se voit. On en trouve partout : paiements, mises à jour, connexions sécurisées.</p>${course("cloud")}${course("cyber")}${course("crypto")}<button class="gj-go" data-a="m5">⏩ H+47 · Le jury</button>`;
			pan.scrollTo({ top:pan.scrollHeight, behavior:"smooth" });
		});
		pan.scrollTo({ top:pan.scrollHeight, behavior:"smooth" });
	}
	const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3();
	function bez(t, a, m, b, out){ const u = 1 - t; return out.set(u*u*a.x + 2*u*t*m.x + t*t*b.x, u*u*a.y + 2*u*t*m.y + t*t*b.y, u*u*a.z + 2*u*t*m.z + t*t*b.z); }
	function tickSrv(dt, t){
		if(!pkMesh.visible || !srv) return;
		const u = utilOf(S), speed = u >= 1 ? .22 : .5;
		P0.copy(portal.position);
		for(let i = 0; i < PK; i++){
			const p = pk[i];
			p.t += dt*speed*p.sp;
			if(p.t > 1){ p.t -= 1; p.rack = Math.floor(Math.random()*S.servers); p.drop = u >= 1 && Math.random() < Math.min(.85, u - .6); }
			const rx = racks[p.rack].position.x;
			P2.set(rx, 1.2, RACK_Z + .5); P1.set((P0.x + rx)/2, 3.6, (P0.z + RACK_Z)/2);
			bez(p.t, P0, P1, P2, pkObj.position);
			if(p.drop && p.t > .6){ pkObj.position.y -= (p.t - .6)*9; }
			pkObj.rotation.set(t*3 + i, t*2, 0); pkObj.updateMatrix();
			pkMesh.setMatrixAt(i, pkObj.matrix);
			pkMesh.setColorAt(i, pkCol.set(p.drop ? "#ff3b3b" : u > .85 ? "#ffb066" : "#3bd16f"));
		}
		pkMesh.instanceMatrix.needsUpdate = true; pkMesh.instanceColor.needsUpdate = true;
		ledMat.color.set(u >= 1 ? (Math.sin(t*14) > 0 ? "#ff3b3b" : "#5a1010") : u > .85 ? "#ffb066" : "#3bd16f");
		alarm.visible = u >= 1 && Math.sin(t*8) > 0;
		srv.al = (srv.al || 0) + dt;
		if(u >= 1 && srv.al > 1.5){ srv.al = 0; play("alarm"); }
		srv.t += dt;
		if(srv.t > .25){ srv.t = 0; const l = latencyOf(u); srv.hist.push(l === Infinity ? 1000 : l); if(srv.hist.length > 60) srv.hist.shift(); setScreen({ kind:"srv", hist:srv.hist }); }
		if(cheatPk.visible){
			srv.cheatT += dt*(srv.phase === "blocked" ? 1.2 : .35);
			const k = srv.phase === "blocked" ? Math.min(1, srv.cheatT) : Math.min(.82, srv.cheatT);
			P2.set(racks[0].position.x, 1.2, RACK_Z + .6); P1.set((P0.x + P2.x)/2, 3.9, (P0.z + RACK_Z)/2);
			bez(k, P0, P1, P2, cheatPk.position);
			cheatPk.rotation.set(t*2, t*3, 0);
			if(srv.phase === "blocked" && k >= 1){ cheatPk.scale.multiplyScalar(1 - dt*4); if(cheatPk.scale.x < .05){ cheatPk.visible = false; cheatTag.visible = false; cheatPk.scale.setScalar(1); } }
			cheatTag.position.copy(cheatPk.position).add(new THREE.Vector3(0, .45, 0));
		}
	}

	/* ---------- H+47 · le jury ---------- */
	function mission5(){
		scene0(); ensureLevel(); ensurePhys(); setHour(47); stage("H+47 · Le jury"); setMode("idle"); view = "jury"; respawn();
		jury.visible = true; setScreen({ kind:"title" });
		show(`<div class="gj-k">H+47 · Projet Gaming · soutenance</div><h2 class="gj-h">Dimanche 17 h : la démo</h2>
			${say("jury", "Une enseignante de la licence, une développeuse d'un studio lillois et une étudiante de L3. « Montrez-nous votre jeu : on veut voir le héros atteindre le drapeau. »")}
			${say("yanis", "Réveillé ! Tu présentes ? Si tu préfères, je joue pendant que tu expliques.")}
			<button class="gj-go" data-a="jplay">🎮 Je joue devant le jury</button><button class="gj-alt" data-a="jauto">🎧 Yanis joue, je commente</button><div data-end></div>`);
	}
	function juryRun(mode){
		card.querySelector("[data-a=jplay]").hidden = true; card.querySelector("[data-a=jauto]").hidden = true;
		playLevel(mode, (o, got, r) => {
			view = "jury";
			const gp = Math.max(10, Math.min(20, 13 + got*2 + Math.min(2, r.stomps) - Math.min(3, r.fallsRun) + (r.mode === "play" ? 1 : 0)));
			const tech = Math.max(10, Math.min(20, 19 - Math.ceil(S.errors/2)));
			const notes = [["Gameplay", gp], ["Technique", tech], ["Thème", 17]];
			setScreen({ kind:"jury", notes });
			jurors.forEach((j, i) => { setLabel(j.note, `${notes[i][1]} / 20`); j.note.visible = true; j.rise = i*.35; });
			play("win");
			card.querySelector("[data-end]").innerHTML = `<div class="gj-msg ok">🏁 Le héros est rentré à temps${r.mode === "play" ? `, ${got} pièce${got > 1 ? "s" : ""} sur 3` : ""}. Applaudissements dans la salle !</div>
				<div class="gj-notes">${notes.map(([n, v]) => `<div>${n}<b>${v}</b>/ 20</div>`).join("")}</div>
				${say("jury", tech >= 17 ? "« Un niveau prouvé faisable, un serveur qui tient la charge et des scores vérifiés : c'est rare en L1. »" : "« Le jeu tient debout et le serveur a survécu au buzz : bravo pour une première jam. »")}
				<button class="gj-go" data-a="end">Voir le bilan</button>`;
		});
	}

	/* ---------- bilan ---------- */
	function finale(quiet){
		scene0(); setMode("idle"); setHour(47); stage("Bilan de la jam"); view = "room";
		const e = S.errors, mention = e <= 2 ? "Très bien" : e <= 7 ? "Bien" : "Assez bien";
		if(quiet !== true){ onEvent && onEvent("win", mention); play("win"); }
		const order = ["gaming", "algo", "prog", "bdd", "back", "vr", "cloud", "cyber", "crypto"].filter(k => S.learned.has(k));
		show(`<div class="gj-k">Licence Informatique · bilan</div><h2 class="gj-h">48 heures, un jeu en ligne</h2>
			<p class="gj-p" style="text-align:center;font-size:40px;margin:4px 0">🏆🎮</p>
			<p class="gj-p" style="text-align:center">Jam réussie, mention <b>${mention}</b> (${e} erreur${e > 1 ? "s" : ""} en chemin).</p>
			<p class="gj-p">Niveau, physique, base de données, API, 3D, serveurs, sécurité : en un week-end, tu as touché à ${order.length} cours de la licence. En L2, on choisit son parcours (Data, Cyber, ou IoT et réalité virtuelle) ; la L3 peut se faire en alternance.</p>
			<ul class="gj-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="gj-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="gj-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Informatique ↗</a>
			<button class="gj-alt" data-a="free">🛠️ Bonus : créer mon propre niveau</button>
			<button class="gj-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gj-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- H+28 · l'ambiance en réalité virtuelle (parcours IoT et réalité virtuelle) ---------- */
	const dioSun = new THREE.DirectionalLight("#ffffff", 0); dioSun.target.position.set(0, Y0 + .4, 0); scene.add(dioSun, dioSun.target);
	const LIGHTS = { chaude:["Chaude", "#ffad66"], neutre:["Neutre", "#ffffff"], froide:["Froide", "#9cc3ff"] };
	const CAMS = { table:"De côté", top:"Plongée", fps:"Vue du héros" };
	function vrChecks(){
		const v = S.vr;
		return [["🌅", "Soleil couchant : lumière chaude et rasante", v.col === "chaude" && v.el <= 25],
			["🌫️", "Brume légère, mais le drapeau reste visible", v.fog >= 25 && v.fog <= 65],
			["🥽", "Caméra à hauteur du héros, comme dans un casque", v.cam === "fps"]];
	}
	function applyVr(){
		const v = S.vr, el = v.el*Math.PI/180;
		dioSun.intensity = S.vrActive ? 2.6 : 0; dioSun.color.set(LIGHTS[v.col][1]);
		dioSun.position.set(-Math.cos(el)*6, Y0 + .4 + Math.sin(el)*6, 2.2);
		scene.fog = S.vrActive && v.fog > 0 ? new THREE.FogExp2(new THREE.Color(LIGHTS[v.col][1]).lerp(new THREE.Color(STYLES[S.style].sky), .5), v.fog/100*.5) : null;
		if(!run) view = v.cam;
	}
	function brief(){ const el = $("#gjBrief"); if(el) el.innerHTML = vrChecks().map(([i, t, ok]) => `<li>${i} ${t}<b>${ok ? "✅" : "⬜"}</b></li>`).join(""); }
	function missionVR(){
		scene0(); ensureLevel(); ensurePhys(); setHour(28); stage("H+28 · L'ambiance VR"); setMode("idle"); respawn();
		S.vr = { el:60, col:"neutre", fog:0, cam:"table" }; S.vrActive = true; applyVr(); setScreen({ kind:"title" });
		show(`<div class="gj-k">H+28 · parcours IoT et réalité virtuelle</div><h2 class="gj-h">Samedi 22 h : le jeu est tout plat</h2>
			${say("ines", "Le jeu marche, mais il n'a aucune ambiance. Le jury note aussi l'image… et Yanis a apporté son <b>casque de réalité virtuelle</b> ! Voilà ce que je veux :")}
			<ul class="gj-brief" id="gjBrief"></ul>
			<div class="gj-srv">
				<label>☀️ Hauteur du soleil<b id="gjElv">60°</b></label><input type="range" min="5" max="85" value="60" id="gjEl" aria-label="Hauteur du soleil">
				<label>🎨 Couleur de la lumière</label><div class="gj-seg" data-g="col">${Object.entries(LIGHTS).map(([k, [n]]) => `<button data-v="${k}" class="${k === "neutre" ? "on" : ""}">${n}</button>`).join("")}</div>
				<label>🌫️ Brouillard<b id="gjFogv">0 %</b></label><input type="range" min="0" max="100" value="0" id="gjFog" aria-label="Densité du brouillard">
				<label>🎥 Caméra</label><div class="gj-seg" data-g="cam">${Object.entries(CAMS).map(([k, n]) => `<button data-v="${k}" class="${k === "table" ? "on" : ""}">${n}</button>`).join("")}</div>
			</div>
			<div class="gj-msg in" data-live>Règle la scène : la maquette change en direct.</div>
			<button class="gj-go" data-a="vrok">✅ Valider l'ambiance</button><div data-end></div>`);
		const upd = () => { S.vr.el = +$("#gjEl").value; S.vr.fog = +$("#gjFog").value; $("#gjElv").textContent = S.vr.el + "°"; $("#gjFogv").textContent = S.vr.fog + " %"; applyVr(); brief(); };
		$("#gjEl").addEventListener("input", upd); $("#gjFog").addEventListener("input", upd);
		card.querySelectorAll(".gj-seg").forEach(g => g.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if(!b || b.disabled) return; g.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); S.vr[g.dataset.g] = b.dataset.v; play("pop"); upd(); }));
		brief();
	}
	function vrValidate(){
		const live = card.querySelector("[data-live]"), v = S.vr, why = [];
		if(v.col !== "chaude") why.push(v.col === "froide" ? "Une lumière froide (bleutée) évoque la nuit ou l'aube, pas un coucher de soleil : choisis une lumière chaude." : "Une lumière neutre (blanche) n'a pas d'ambiance : un soleil couchant est orangé.");
		if(v.el > 25) why.push(`Un soleil à ${v.el}° est un soleil de midi, avec des ombres courtes. Rasant, c'est sous 25°.`);
		if(v.fog < 25) why.push(v.fog ? "Le brouillard est trop léger pour faire de la brume." : "Sans brouillard, pas de brume.");
		if(v.fog > 65) why.push(`À ${v.fog} %, le brouillard cache le drapeau : le joueur ne sait plus où aller.`);
		if(v.cam !== "fps") why.push("Dans un casque VR, on est dans la scène, à hauteur du personnage : choisis la vue du héros.");
		if(why.length){ err("vr"); return msg(live, "ko", why.join("<br>")); }
		play("good");
		msg(live, "ok", "✓ Coucher de soleil, brume et caméra à hauteur du héros : la scène a enfin une ambiance.");
		card.querySelector("[data-a=vrok]").hidden = true; card.querySelectorAll(".gj-srv input, .gj-seg button").forEach(i => i.disabled = true);
		card.querySelector("[data-end]").innerHTML = `${say("yanis", "Je mets le casque… Un casque VR calcule <b>deux images</b>, une par œil, <b>90 fois par seconde</b>. Le brouillard aide aussi : ce qui est caché n'a pas besoin d'être dessiné en détail.")}<button class="gj-go" data-a="vrtour">🥽 Faire un tour en VR avec Yanis</button>`;
	}
	function vrTour(){
		const end = card.querySelector("[data-end]"), b = card.querySelector("[data-a=vrtour]");
		if(!b || b.disabled) return;
		b.disabled = true;
		startRun("auto", () => { view = "fps"; end.insertAdjacentHTML("beforeend", `${course("vr")}<button class="gj-go" data-a="m4">⏩ H+36 · Le jeu buzze</button>`); pan.scrollTo({ top:pan.scrollHeight, behavior:"smooth" }); });
		view = "fps";
	}

	/* ---------- bonus · éditeur de niveau libre, à partager ---------- */
	const SHARED = (() => { const v = new URLSearchParams(location.search).get("niveau"); return v && /^[0-6]{16}$/.test(v) && +v[0] && +v[FLAG] ? [...v].map(Number) : null; })();
	const shareUrl = () => `${location.origin}${location.pathname}?jeu=info&niveau=${heights().join("")}`;
	function freeEditor(){
		scene0(); setMode("free"); stage("Bonus · Mon niveau"); view = "table"; ensurePhys();
		if(!S.custom) S.custom = heights();      // on part du niveau de la jam
		buildLevel(); respawn();
		show(`<div class="gj-k">Bonus · éditeur de niveau</div><h2 class="gj-h">À toi de créer</h2>
			<p class="gj-p"><b>Touche au-dessus d'une colonne</b> pour ajouter un bloc, <b>touche un bloc</b> pour enlever le plus haut. Le départ et le drapeau gardent au moins un bloc.</p>
			<div class="gj-rule"><span>⬆️ monte 1 bloc au plus</span><span>↔️ saute 2 trous au plus</span></div>
			<div class="gj-msg in" data-live>Avant de partager, le parcours en largeur vérifie que ton niveau est faisable.</div>
			<button class="gj-go" data-a="ftest">▶ Tester mon niveau</button>
			<button class="gj-alt" data-a="flink">🔗 Obtenir le lien de mon niveau</button>
			<button class="gj-alt" data-a="freset">↺ Repartir du niveau de la jam</button>
			<button class="gj-alt" data-a="bilan">← Retour au bilan</button><div data-end></div>`);
	}
	function freeCheck(){
		const Hh = heights(), res = bfs(Hh);
		clearTiles();
		if(res.ok){ res.path.forEach(c => { tiles[c].visible = true; tiles[c].material.color.set("#ffd166"); }); return true; }
		const { far, why } = obstacle(Hh, res); play("bad");
		msg(card.querySelector("[data-live]"), "ko", `Niveau impossible : le héros ne dépasse pas la colonne ${far}. Ici, ${why}`);
		return false;
	}
	function freeTest(){
		if(S.mode !== "free" || !freeCheck()) return;
		setMode("idle"); clearTiles();
		msg(card.querySelector("[data-live]"), "in", "À toi de jouer ton niveau !");
		startRun("play", (o, r) => { setMode("free"); view = "table"; msg(card.querySelector("[data-live]"), "ok", `🏁 Niveau réussi${r.fallsRun ? ` (${r.fallsRun} chute${r.fallsRun > 1 ? "s" : ""})` : ""} ! Tu peux le partager.`); });
	}
	function freeLink(){
		if(S.mode !== "free" || !freeCheck()) return;
		const url = shareUrl(), end = card.querySelector("[data-end]"), live = card.querySelector("[data-live]");
		end.innerHTML = `<input class="gj-link" readonly value="${url}" aria-label="Lien de ton niveau">${navigator.share ? `<button class="gj-alt" data-a="fshare">📤 Partager</button>` : ""}`;
		const inp = end.querySelector("input"); inp.addEventListener("focus", () => inp.select());
		(navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => msg(live, "ok", "✓ Lien copié ! Envoie-le : ton niveau s'ouvrira directement dans le campus."), () => msg(live, "in", "Copie le lien ci-dessous pour partager ton niveau."));
	}
	function sharedPlay(){
		scene0(); setMode("idle"); stage("Niveau partagé"); ensurePhys();
		S.custom = SHARED.slice(); buildLevel(); respawn();
		show(`<div class="gj-k">Game Jam 48 h · niveau partagé</div><h2 class="gj-h">Un niveau rien que pour toi</h2>
			<p class="gj-p">Quelqu'un a créé ce niveau dans l'éditeur du jeu de la Licence Informatique. Atteins le drapeau !</p>
			<div class="gj-msg in" data-live>Avance et saute de colonne en colonne jusqu'au drapeau.</div>
			<div data-end><button class="gj-alt" data-a="m1">Passer : faire la game jam en entier</button></div>`);
		startRun("play", (o, r) => {
			view = "table";
			msg(card.querySelector("[data-live]"), "ok", `🏁 Bravo, niveau terminé${r.fallsRun ? ` après ${r.fallsRun} chute${r.fallsRun > 1 ? "s" : ""}` : " sans tomber"} !`);
			card.querySelector("[data-end]").innerHTML = `<button class="gj-go" data-a="m1">🎮 Faire la game jam en entier</button><button class="gj-alt" data-a="free">🛠️ Créer mon propre niveau</button>`;
		});
	}

	/* ---------- actions ---------- */
	const GO = {
		m1:mission1, m2:mission2, m3:mission3, m4:mission4, m5:mission5, end:finale,
		bfs:startBfs, reset:() => { if(S.mode !== "edit") return; S.extra = Array(N).fill(0); buildLevel(); clearTiles(); refreshBudget(); },
		test:testPhys, play:() => playLevel("play", afterPlay2), auto:() => { if(run && run.mode === "play"){ stopRun(); } playLevel("auto", afterPlay2); },
		sql:runSql, deploy, jplay:() => juryRun("play"), jauto:() => juryRun("auto"),
		mvr:missionVR, vrok:vrValidate, vrtour:vrTour,
		free:freeEditor, ftest:freeTest, flink:freeLink, bilan:() => finale(true), shared:sharedPlay,
		fshare:() => navigator.share?.({ title:"Mon niveau · Game Jam 48 h", text:"Essaie de finir mon niveau dans le campus 3D de la FGES !", url:shareUrl() }).catch(() => {}),
		freset:() => { if(S.mode !== "free") return; S.custom = BASE.map((h, i) => h + S.extra[i]); buildLevel(); clearTiles(); respawn(); }
	};
	root.addEventListener("click", e => {
		const st = e.target.closest("[data-style]");
		if(st){ S.style = st.dataset.style; root.querySelectorAll("[data-style]").forEach(b => b.classList.toggle("on", b === st)); applyStyle(); play("pop"); view = "table"; return; }
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "auto" && card.querySelector("[data-a=jplay]")) return juryAuto();
		if(GO[k]) return GO[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set(), extra:Array(N).fill(0), custom:null, levelOk:false, phys:null, physOk:false, coins:0, falls:0, stomps:0 }); $("#gjErr").textContent = "🐞 0 erreur"; buildLevel(); return intro(); }
	});
	// pendant la démo devant le jury, « Laisser Yanis finir » reprend la même fin de partie
	function juryAuto(){ const cb = run && run.onEnd; stopRun(); startRun("auto", cb); card.querySelector("[data-a=auto]")?.remove(); }
	// commandes : clavier et boutons tactiles
	const KEYS = { ArrowLeft:"l", KeyA:"l", KeyQ:"l", ArrowRight:"r", KeyD:"r", Space:"j", ArrowUp:"j", KeyW:"j", KeyZ:"j" };
	function onKey(e){
		if(e.key === "Escape") return close();
		const k = KEYS[e.code];
		if(!k || !run || run.mode !== "play") return;
		e.preventDefault(); input[k] = e.type === "keydown";
	}
	document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKey);
	root.querySelectorAll(".gj-pad button").forEach(b => {
		const set = v => e => { e.preventDefault(); input[b.dataset.k] = v; b.classList.toggle("on", v); };
		b.addEventListener("pointerdown", set(true)); for(const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, set(false));
		b.addEventListener("contextmenu", e => e.preventDefault());
	});
	$(".gj-x").addEventListener("click", close);

	/* ---------- boucle ---------- */
	const clock = new THREE.Clock();
	let raf = 0;
	function resize(){ const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w/Math.max(1, h); camera.updateProjectionMatrix(); }
	addEventListener("resize", resize);
	function loop(){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
		if(canvas.width !== Math.floor(canvas.clientWidth*renderer.getPixelRatio())) resize();
		// les heures défilent jusqu'à l'heure de l'étape
		if(Math.abs(S.hourShown - S.hour) > .01){ S.hourShown += (S.hour - S.hourShown)*Math.min(1, dt*2.2); if(Math.abs(S.hourShown - S.hour) < .05) S.hourShown = S.hour; drawLed(S.hourShown); }
		ambiance();
		tickBfs(dt); tickRun(dt); tickSrv(dt, t); drawHero(dt, t);
		// l'équipe tape au clavier ; le podium et les notes montent
		[ines, yanis].forEach((d, i) => { if(!(i === 1 && S.hour === 36)) d.p.body.position.y = .95 + Math.abs(Math.sin(t*(7 + i*2)))*.015; d.scrM.emissiveIntensity = .6 + Math.sin(t*3 + i)*.15; });
		if(podium.visible) podiumPeople.forEach(p => { if(p.rise > 0){ p.rise -= dt; return; } p.g.position.y += (0 - p.g.position.y)*Math.min(1, dt*4); });
		jurors.forEach(j => { if(j.note.visible){ if(j.rise > 0){ j.rise -= dt; j.note.position.y = 1.4; } else j.note.position.y += (2.5 - j.note.position.y)*Math.min(1, dt*5); } });
		tickCamera(dt, t);
		renderer.render(scene, camera);
	}
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); removeEventListener("resize", resize);
		document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKey);
		renderer.dispose(); root.remove(); onClose && onClose();
	}

	applyStyle(); buildLevel(); respawn(); drawLed(0); resize(); intro(); loop();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["H+00 · Le niveau (algorithmique)", mission1], ["H+06 · Le héros (Python)", mission2], ["H+20 · Les scores (SQL, API)", mission3], ["H+28 · L'ambiance (réalité virtuelle)", missionVR], ["H+36 · Le serveur (réseau, cyber)", mission4], ["H+47 · Le jury", mission5], ["Bilan", finale], ["Bonus · Éditeur de niveau", freeEditor]]);
	if(window.campus) window.campus.game = { S, hero, foe, get run(){ return run; }, mission1, mission2, mission3, missionVR, mission4, mission5, finale, freeEditor, sharedPlay, bfs:(...a) => bfs(heights(), ...a), startRun, scene, camera, get view(){ return view; },
		advance(sec){ for(let i = 0; i < sec*60; i++){ tickBfs(1/60); tickRun(1/60); tickSrv(1/60, i/60); tickCamera(1/60, 0); } } };      // essais : faire avancer la simulation sans attendre l'affichage
}
