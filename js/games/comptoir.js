/* « Le Comptoir » — mini-jeu de la Licence Gestion.
   Piloter une entreprise pour de vrai : le café de l'atrium, en 3D.
   - Chaque journée : on décide (prix, stock, équipe), puis on gère le service en direct.
   - Chaque année : un exercice concret avec SES chiffres (compte de résultat, coût de revient,
     seuil de rentabilité, décision d'investissement) qui révèle le cours de la licence.
   Les chiffres sont volontairement simples et doivent être relus par un enseignant de la licence. */
import * as THREE from "three";
import { makeStudent, std, box, cyl, mesh, mulberry32 } from "../kit.js";

/* ---------- Économie du Comptoir (à valider par l'enseignant) ---------- */
const ECO = { amortVelo:7, cafe:.25, lait:.20, gobelet:.10, tasse:.55, croissantAchat:.45, croissantPrix:1.2, salaire:25,
	attach:.45, cappu:.65, service:1.6, eclair:3.2, tip:.5, interim:38 };
const COMPO = [["Café", .25], ["Lait", .20], ["Gobelet", .10]];
const DAY_LEN = 40;
// « gerant » (par défaut) : on pilote la matinée avec des leviers de gestion.
// « caisse » (?caisse) : variante où l'on compose soi-même les commandes, gardée pour comparer.
const MODE = /[?&]caisse/.test(location.search) ? "caisse" : "gerant";
const BASE_K = MODE === "caisse" ? 1.2 : 1;   // en mode caisse, le joueur sert aussi : plus de clients
const LEV = { happy:.7, happyLen:10, happyBoost:1.8, happyRep:.04, renfort:15, reassortN:10, reassortPrix:.8, reassortDelai:8, cookie:.3 };
const DAYS = [
	{ year:"L1", title:"Jour 1 · L'ouverture", base:40, patience:14, tuto:true, event:"groupe" },
	{ year:"L1", title:"Jour 2 · Premier vrai rush", base:50, patience:10, exAfter:"compte", event:"lait" },
	{ year:"L2", title:"Jour 3 · La rentrée de L2", base:54, patience:10, exBefore:"cout", event:"malade" },
	{ year:"L3", title:"Jour 4 · Le Comptoir grandit", base:58, patience:9, exBefore:"invest", event:"story" }
];
const MENTIONS = { caisse:[240, .78, 120, .66], gerant:[110, .85, 80, .76] };   // [Très bien : résultat, satisfaction, Bien : résultat, satisfaction]
const COURSES = {
	prix:   ["L1", "Marketing", "Fixer un prix, c'est arbitrer entre le nombre de clients et la marge sur chacun."],
	stock:  ["L2", "Logistique", "Commander juste assez : la rupture fait fuir les clients, le surplus part à la poubelle."],
	rh:     ["L1", "Gestion des ressources humaines", "Dimensionner l'équipe selon l'activité : le rush de 10 h ne se gère pas seul."],
	compte: ["L1", "Comptabilité financière", "Le compte de résultat récapitule les produits et les charges : leur différence, c'est le résultat."],
	cout:   ["L2", "Gestion des coûts", "Le coût de revient additionne tout ce que coûte un produit. Le seuil de rentabilité dit combien en vendre pour couvrir les charges fixes."],
	invest: ["L3", "Décision d'investissement", "Un investissement se juge sur ce qu'il rapporte dans le temps : le délai de récupération en est la mesure la plus simple."]
};
const euro = v => (Math.round(v*100)/100).toLocaleString("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " €";
const euro0 = v => Math.round(v).toLocaleString("fr-FR") + " €";
const priceFactor = p => Math.max(.25, Math.min(1.25, 1.55 - .3*p));

const CSS = `
.cz{position:fixed;inset:0;z-index:40;background:#2b1d16;font-family:Nunito,system-ui,sans-serif;color:#2b2233;overflow:hidden;animation:czIn .35s ease both}
@keyframes czIn{from{opacity:0}to{opacity:1}}
.cz canvas.cz-3d{position:absolute;inset:0;width:100%;height:100%;display:block}
.cz-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:3;pointer-events:none}
.cz-top>*{pointer-events:auto}
.cz-chip{background:rgba(255,248,236,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(40,20,10,.25);display:flex;gap:6px;align-items:center}
.cz-chip b{font-size:15px}
.cz-day{background:#21b6ce;color:#0b2f67} .cz-day:empty{display:none}
.cz-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,248,236,.95);font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(40,20,10,.25)}
.cz-bar{width:70px;height:8px;border-radius:8px;background:#ead9bf;overflow:hidden}
.cz-bar i{display:block;height:100%;background:linear-gradient(90deg,#c4532f,#d9a441,#3d7a55);transition:width .4s}
.cz-bubbles{position:absolute;inset:0;z-index:2;pointer-events:none}
.cz-bub{position:absolute;left:0;top:0;pointer-events:none;transform-origin:50% 100%}
.cz-bub span{display:flex;align-items:center;gap:2px;background:#fff;border-radius:16px;padding:5px 8px;font-size:17px;box-shadow:0 4px 12px rgba(40,20,10,.3);border:3px solid var(--ring,#3d7a55);transition:transform .15s}
.cz-bub.mine span{border-color:#d9a441;box-shadow:0 0 0 4px rgba(242,193,78,.55),0 4px 12px rgba(40,20,10,.3);transform:scale(1.1)}
.cz-bub.angry span{border-color:#c4532f;background:#fde8e8}
.cz-bub.busy span{border-color:#d9a441;opacity:.85}
.cz.tall .cz-bub span{font-size:13px;padding:3px 6px;border-width:2px;border-radius:12px}
.cz-pop{position:absolute;z-index:3;font-weight:800;font-size:15px;color:#2f6b45;text-shadow:0 1px 0 #fff,0 0 8px #fff;pointer-events:none;animation:czPop 1.1s ease-out forwards}
.cz-pop.bad{color:#b91c1c}
@keyframes czPop{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-46px)}}
.cz-coach{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:4;background:#fff8ec;border-radius:16px;padding:11px 16px;font-weight:700;font-size:14px;box-shadow:0 10px 30px rgba(40,20,10,.35);max-width:min(520px,calc(100% - 24px));border-left:5px solid #d9a441}
.cz-coach[hidden]{display:none}
.cz.serving .cz-coach{bottom:150px}
.cz-tray{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:4;width:min(440px,calc(100% - 20px));background:#fff8ec;border-radius:20px;padding:10px;box-shadow:0 12px 34px rgba(40,20,10,.4)}
.cz-tray[hidden]{display:none}
.cz-order{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;margin:0 4px 8px;min-height:30px}
.cz-order .it{font-size:24px;opacity:.4;filter:grayscale(1);transition:.15s}
.cz-order .it.on{opacity:1;filter:none;transform:scale(1.15)}
.cz-order .sp{margin-left:auto;color:#0b7a8e}
.cz-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.cz-keys button{border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 2px #ead9bf,0 4px 0 #ead9bf;padding:10px 4px 8px;font:800 30px/1 Nunito,sans-serif;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;color:#2b2233}
.cz-keys button small{display:block;font-size:12px;margin-top:4px;color:#5b4f5f}
.cz-keys button:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px #ead9bf}
.cz-keys button.ko{animation:czShake .3s}
@keyframes czShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.cz-lev{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:4;width:min(460px,calc(100% - 20px));background:#fff8ec;border-radius:20px;padding:10px;box-shadow:0 12px 34px rgba(40,20,10,.4)}
.cz-lev[hidden]{display:none}
.cz-lrow{display:flex;align-items:center;gap:8px;margin:0 2px 8px;font-weight:800;font-size:14px}
.cz-lrow button{width:38px;height:38px;border-radius:12px;border:2px solid #ead9bf;background:#fff;font:800 20px Nunito,sans-serif;cursor:pointer;touch-action:manipulation;color:#2b2233}
.cz-lrow b{min-width:62px;text-align:center;font-size:17px}
.cz-lrow b.happy{color:#c2410c}
.cz-lrow .q{margin-left:auto;font-size:13px;color:#5b4f5f;background:#fff;border:1px solid #ead9bf;border-radius:999px;padding:5px 10px}
.cz-lrow .q.hot{color:#b91c1c;border-color:#f3b4a8;background:#fdeceb}
.cz-lbtns{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.cz-lbtns button{position:relative;overflow:hidden;border:0;border-radius:16px;background:#fff;box-shadow:inset 0 0 0 2px #ead9bf,0 4px 0 #ead9bf;padding:8px 4px 7px;font:800 13px/1.15 Nunito,sans-serif;cursor:pointer;touch-action:manipulation;color:#2b2233}
.cz-lbtns button i{display:block;font-style:normal;font-size:24px;margin-bottom:2px}
.cz-lbtns button small{display:block;font-size:11px;color:#8a7d86;margin-top:2px;font-weight:700}
.cz-lbtns button:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px #ead9bf}
.cz-lbtns button:disabled{opacity:.42;cursor:default}
.cz-lbtns button.glow{box-shadow:inset 0 0 0 3px #d9a441,0 4px 0 #d9a441;animation:czGlow 1s ease-in-out infinite alternate}
@keyframes czGlow{to{background:#fff3d6}}
.cz-lbtns button .bar{position:absolute;left:0;bottom:0;height:4px;background:#21b6ce;width:var(--p,0%)}
.cz.gerant .cz-bub{pointer-events:auto;cursor:pointer}
.cz.gerant .cz-bub.warn span{animation:czWarn .6s ease-in-out infinite alternate}
.cz.gerant .cz-bub.warn span::after{content:"🍪";font-size:15px;margin-left:3px}
@keyframes czWarn{to{transform:scale(1.12)}}
.cz-res.neg b{color:#b91c1c}.cz-res.pos b{color:#2f6b45}
.cz-ff{background:#1e305e;color:#fff}
.cz-ff[hidden]{display:none}
.cz-banner{position:absolute;left:50%;top:20%;z-index:4;background:#3d7a55;color:#fff;font:800 17px/1.3 Nunito,sans-serif;padding:12px 20px;border-radius:18px;box-shadow:0 12px 30px rgba(20,60,30,.4);text-align:center;width:max-content;max-width:88%;pointer-events:none;animation:czBan 3s ease forwards}
@keyframes czBan{0%{opacity:0;transform:translate(-50%,10px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-10px)}}
.cz-panel{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:12px;background:rgba(43,26,20,.35);overflow:auto}
.cz-panel[hidden]{display:none}
.cz-card{width:100%;max-width:470px;background:#fff8ec;border-radius:24px;box-shadow:0 30px 80px rgba(20,10,5,.45);padding:20px 18px 18px;animation:czUp .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes czUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.cz-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e}
.cz-h{font:700 23px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px}
.cz-p{margin:0 0 12px;color:#5b4f5f;font-size:14.5px}
.cz-row{background:#fff;border:1px solid #ead9bf;border-radius:16px;padding:11px 13px;margin-bottom:8px}
.cz-row .t{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:14px}
.cz-row small{display:block;color:#8a7d86;font-weight:700;font-size:12px;margin-top:3px}
.cz-row input[type=range]{width:100%;accent-color:#0b7a8e;margin-top:8px}
.cz-step{display:flex;align-items:center;gap:8px}
.cz-step button{width:36px;height:36px;border-radius:12px;border:2px solid #ead9bf;background:#fff;font:800 18px Nunito,sans-serif;cursor:pointer}
.cz-step b{min-width:42px;text-align:center;font-size:17px}
.cz-seg{display:flex;gap:6px}
.cz-seg button{flex:1;border:2px solid #ead9bf;background:#fff;border-radius:12px;padding:8px 4px;font:800 14px Nunito,sans-serif;cursor:pointer}
.cz-seg button[aria-pressed=true]{border-color:#0b7a8e;background:#e4f6f9;color:#0b7a8e}
.cz-go{display:block;width:100%;border:0;border-radius:16px;padding:14px;background:#21b6ce;color:#0b2f67;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:10px;box-shadow:0 8px 20px rgba(20,140,160,.35);text-align:center;text-decoration:none}
.cz-go:disabled{opacity:.45;cursor:default}
.cz-alt{display:block;width:100%;border:2px solid #ead9bf;border-radius:16px;padding:12px;background:#fff;color:#1e305e;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.cz-hint{font-size:12.5px;font-weight:700;color:#7a6a3a;background:#fbefd0;border-radius:10px;padding:6px 10px;margin-top:8px}
.cz-tbl{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 10px}
.cz-tbl td{padding:7px 4px;border-bottom:1px solid #ead9bf}
.cz-tbl td:last-child{text-align:right;font-weight:800}
.cz-tbl tr.tot td{border-bottom:0;font-size:15.5px}
.cz-pos{color:#2f6b45}.cz-neg{color:#b91c1c}
.cz-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}
.cz-tok{border:2px dashed #d9b98a;background:#fff;border-radius:12px;padding:9px 12px;font:800 15px Nunito,sans-serif;cursor:pointer}
.cz-tok[aria-pressed=true]{border-style:solid;border-color:#0b7a8e;background:#e4f6f9}
.cz-tok.used{opacity:.3;pointer-events:none}
.cz-slot{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;border:2px dashed #ead9bf;background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:7px;font:700 14px Nunito,sans-serif;cursor:pointer;text-align:left}
.cz-slot b{min-width:80px;text-align:right}
.cz-slot.ok{border-style:solid;border-color:#3d7a55;background:#eef8f0}
.cz-slot.ko{border-style:solid;border-color:#c4532f;background:#fdeceb}
.cz-opts{display:grid;gap:7px}
.cz-opt{border:2px solid #ead9bf;background:#fff;border-radius:14px;padding:11px 12px;font:800 15px Nunito,sans-serif;cursor:pointer;text-align:left}
.cz-opt.ok{border-color:#3d7a55;background:#eef8f0}
.cz-opt.ko{border-color:#c4532f;background:#fdeceb}
.cz-course{background:#fff;border:2px solid #d9a441;border-radius:16px;padding:12px 14px;margin:10px 0 4px}
.cz-course .tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.cz-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.cz-course span{font-size:14px;color:#5b4f5f}
.cz-chart{width:100%;height:150px;display:block;background:#fff;border:1px solid #ead9bf;border-radius:14px;margin:6px 0 10px}
.cz-big{font-size:50px;text-align:center}
.cz-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.cz-list li{background:#fff;border:1px solid #ead9bf;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
.cz-list li span{color:#0b7a8e;font-weight:800;margin-right:6px}
@media (max-width:560px){ .cz-chip{font-size:12px;padding:6px 9px} .cz-bar{width:46px} .cz-h{font-size:20px} }
`;

export function openComptoir({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("cz-css")){ const st = document.createElement("style"); st.id = "cz-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "cz"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le Comptoir");
	root.innerHTML = `<canvas class="cz-3d"></canvas>
		<div class="cz-top">
			<span class="cz-chip cz-day" id="czDay"></span>
			<span class="cz-chip">🕗 <b id="czClock">8:00</b></span>
			<span class="cz-chip cz-res" title="Résultat de la matinée en direct">📈 <b id="czRes">0 €</b></span>
			<span class="cz-chip">🥐 <b id="czStock">0</b></span>
			<span class="cz-chip">😊 <span class="cz-bar"><i id="czSat" style="width:60%"></i></span></span>
			<span class="cz-chip cz-ff" id="czFF" hidden>⏩ accéléré</span>
			<button class="cz-x" aria-label="Quitter le jeu">×</button>
		</div>
		<div class="cz-bubbles"></div>
		<div class="cz-coach" hidden></div>
		<div class="cz-lev" hidden>
			<div class="cz-lrow"><span>💶 Prix</span><button data-l="pm" aria-label="Baisser le prix">−</button><b id="czPrice">2,00 €</b><button data-l="pp" aria-label="Monter le prix">+</button><span class="q" id="czQ">File : 0</span></div>
			<div class="cz-lbtns">
				<button data-l="happy"><i>🎉</i>Happy hour<small>−30 % · 10 s</small><span class="bar"></span></button>
				<button data-l="renfort"><i>📞</i>Renfort<small>+1 barista · ${LEV.renfort} €</small></button>
				<button data-l="reassort"><i>🚚</i>Croissants<small>+${LEV.reassortN} à ${euro(LEV.reassortPrix)}</small><span class="bar"></span></button>
			</div></div>
		<div class="cz-tray" hidden><div class="cz-order" aria-live="polite"></div>
			<div class="cz-keys"><button data-k="cafe" aria-label="Café (touche 1)">☕<small>Café</small></button><button data-k="lait" aria-label="Lait (touche 2)">🥛<small>Lait</small></button><button data-k="croissant" aria-label="Croissant (touche 3)">🥐<small>Croissant</small></button></div></div>
		<div class="cz-panel" hidden><div class="cz-card"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const card = $(".cz-card"), panel = $(".cz-panel"), coach = $(".cz-coach"), bubbles = $(".cz-bubbles"), tray = MODE === "caisse" ? $(".cz-tray") : $(".cz-lev");
	root.classList.add(MODE);

	/* ---------- scène 3D : le café ---------- */
	const canvas = $("canvas.cz-3d");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#3a2a22");
	const camera = new THREE.PerspectiveCamera(38, 1, .5, 100);
	scene.add(new THREE.HemisphereLight("#fff1dd", "#6d5a4e", 1.15));
	const sun = new THREE.DirectionalLight("#ffe7c2", 1.9); sun.position.set(-6, 12, 8); sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-12, right:12, top:10, bottom:-10, near:1, far:40 });
	sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun);

	const planks = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
		x.fillStyle = "#c99a6b"; x.fillRect(0,0,128,128); for(let i=0;i<4;i++){ x.fillStyle = i % 2 ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.04)"; x.fillRect(0, i*32, 128, 32); } x.fillStyle = "rgba(60,30,10,.18)"; for(let i=0;i<4;i++) x.fillRect(0, i*32, 128, 3);
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); t.colorSpace = THREE.SRGBColorSpace; return t; })();
	// sur téléphone (écran en hauteur), la file d'attente descend vers l'écran au lieu de filer vers la droite :
	// la salle tient alors dans la largeur et remplit toute la hauteur
	const TALL = innerWidth < innerHeight; root.classList.toggle("tall", TALL);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:planks, roughness:.85 }));
	floor.position.set(3, 0, 4); floor.receiveShadow = true; scene.add(floor);
	const brick = std("#b5563d"), cream = std("#efe3cc"), wood = std("#8a5a3c"), dark = std("#2e2c30");
	box(scene, 24, 6, .4, brick, 3, 0, -2.6);
	for(const x of [-6.5, 7, 12]){ box(scene, 2.2, 3, .2, std("#3b4d63"), x, 1.4, -2.4); box(scene, 2.5, .25, .3, cream, x, 1.25, -2.35); }
	box(scene, .4, 6, 18, brick, -9, 0, 4);
	// comptoir, machine, vitrine
	box(scene, 6.6, 1.05, 1.3, wood, -.2, 0, 0);
	box(scene, 6.9, .1, 1.5, cream, -.2, 1.05, 0);
	box(scene, .9, .7, .6, std("#c4c8cc", { metalness:.6, roughness:.3 }), -2.6, 1.15, -.2);
	cyl(scene, .12, .12, .3, std("#f4f1ea"), -2, 1.15, .2, 10); cyl(scene, .12, .12, .3, std("#e07a5f"), -1.7, 1.15, .2, 10);
	const vitrine = new THREE.Mesh(new THREE.BoxGeometry(1.8, .6, .9).translate(0,.3,0), std("#dcecf2", { transparent:true, opacity:.35, roughness:.1 }));
	vitrine.position.set(1.7, 1.15, 0); scene.add(vitrine);
	const croissantGeo = new THREE.TorusGeometry(.13, .07, 6, 10, Math.PI*1.3).rotateX(Math.PI/2);
	const croissants = new THREE.InstancedMesh(croissantGeo, std("#d9a441"), 12); croissants.position.set(1.7, 1.25, 0); scene.add(croissants);
	{ const d = new THREE.Object3D(); for(let i=0;i<12;i++){ d.position.set(-.65 + (i%6)*.26, (i<6 ? 0 : .02), i<6 ? -.18 : .18); d.rotation.y = i*.7; d.updateMatrix(); croissants.setMatrixAt(i, d.matrix); } }
	// ardoise du menu (prix en direct)
	const menuCv = document.createElement("canvas"); menuCv.width = 512; menuCv.height = 300;
	const menuTex = new THREE.CanvasTexture(menuCv); menuTex.colorSpace = THREE.SRGBColorSpace;
	const menu = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9), new THREE.MeshStandardMaterial({ map:menuTex, roughness:.9 })); menu.position.set(-.2, 3.3, -2.38); scene.add(menu);
	function paintMenu(){
		const x = menuCv.getContext("2d");
		x.fillStyle = "#2c2f2b"; x.fillRect(0,0,512,300); x.strokeStyle = "#a07a4e"; x.lineWidth = 14; x.strokeRect(7,7,498,286);
		x.fillStyle = "#f4ead6"; x.textAlign = "center"; x.font = "bold 46px Georgia, serif"; x.fillText("Le Comptoir", 256, 70);
		x.textAlign = "left"; x.font = "34px Georgia, serif"; x.fillStyle = "#f4ead6";
		x.fillText("Café / cappuccino", 50, 150); x.fillText("Croissant", 50, 220);
		x.textAlign = "right"; x.fillStyle = "#e9c27a"; x.fillText(euro(curPrice()), 462, 150); x.fillText(euro(ECO.croissantPrix), 462, 220);
		menuTex.needsUpdate = true;
	}
	// porte, tables, plantes
	if(TALL){
		// porte au premier plan : deux montants et un rai de lumière au sol, rien qui cache la file
		box(scene, .3, 3.2, .3, wood, 5.1, 0, 10.4); box(scene, .3, 3.2, .3, wood, 7.3, 0, 10.4); box(scene, 2.5, .3, .3, wood, 6.2, 3.1, 10.4);
		const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.4).rotateX(-Math.PI/2), std("#fff3d6", { emissive:"#ffe2a8", emissiveIntensity:.5, transparent:true, opacity:.55 }));
		glow.position.set(6.2, .02, 9.6); scene.add(glow);
	} else {
		box(scene, .3, 3.2, .3, wood, 9.3, 0, 2.2); box(scene, .3, 3.2, .3, wood, 9.3, 0, 4.4); box(scene, .3, .3, 2.5, wood, 9.3, 3.1, 3.3);
		const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3), std("#fff3d6", { emissive:"#ffe2a8", emissiveIntensity:.6 })); doorGlow.position.set(9.45, 1.5, 3.3); doorGlow.rotation.y = -Math.PI/2; scene.add(doorGlow);
	}
	const TABLES = TALL ? [[-1.6, 6.2],[1.2, 8.2]] : [[-6, 3.5],[-3.5, 4.8]];
	for(const [x,z] of TABLES){ cyl(scene, .7, .7, .08, wood, x, .78, z, 14); cyl(scene, .07, .07, .78, dark, x, 0, z, 6); }
	for(const [x,z] of TALL ? [[-3.4, -1.7],[7.6, -1.8]] : [[-8.2, -1.6],[8.4, -1.8]]){ cyl(scene, .4, .32, .6, std("#c98a5a"), x, 0, z, 10); mesh(new THREE.IcosahedronGeometry(.7, 0), std("#5f8f4a"), scene, x, 1.15, z); }
	const deco = [];
	const SEATS = TALL ? [[-2.2, 6.2, Math.PI/2],[-1, 6.2, -Math.PI/2],[1.2, 9, Math.PI]] : [[-6.6, 3.5, Math.PI/2],[-5.4, 3.5, -Math.PI/2],[-3.5, 5.6, Math.PI]];
	for(const [x,z,r] of SEATS){ const s = makeStudent(scene, true); s.g.scale.setScalar(.9); s.g.position.set(x, -.1, z); s.g.rotation.y = r; deco.push(s); }
	// baristas
	const BX = [-2.2, -.2, 1.8];
	const baristas = BX.map(x => { const s = makeStudent(scene); s.g.scale.setScalar(.9); s.g.position.set(x, 0, -1.05); const apron = new THREE.Mesh(new THREE.BoxGeometry(.6,.55,.08), std("#21b6ce")); apron.position.set(0,.6,.32); s.g.add(apron); return { s, cust:null, t:0 }; });
	// ta caisse : le poste du joueur, au bout du comptoir (tablier doré, étoile au-dessus)
	const PX = 3.0;
	const me = makeStudent(scene); me.g.scale.setScalar(.9); me.g.position.set(PX, 0, -1.05);
	{ const apron = new THREE.Mesh(new THREE.BoxGeometry(.6,.55,.08), std("#d9a441")); apron.position.set(0,.6,.32); me.g.add(apron); }
	const star = mesh(new THREE.OctahedronGeometry(.2), std("#f2c14e", { emissive:"#d9a441", emissiveIntensity:.6 }), scene, PX, 3.05, -1.05, 0, false);
	const P = { cust:null, got:{}, t:0, streak:0 };
	if(MODE === "gerant"){
		me.g.visible = star.visible = false;
		const s = makeStudent(scene); s.g.scale.setScalar(.9); s.g.position.set(PX, 0, -1.05); s.g.visible = false;
		const apron = new THREE.Mesh(new THREE.BoxGeometry(.6,.55,.08), std("#e07a5f")); apron.position.set(0,.6,.32); s.g.add(apron);
		baristas.push({ s, cust:null, t:0 }); BX.push(PX);
	}
	const BOT = { delay:null, choice:null };    // debug : joueur automatique pour l'équilibrage

	/* ---------- état ---------- */
	const S = { day:0, price:2.0, stock:30, staff:2, rep:.6, bike:false, results:[], learned:new Set(), seuil:null, totalProfit:0 };
	const rnd = mulberry32(Date.now() % 100000);
	let running = false, raf = 0, last = 0, closed = false;
	let D = null;    // journée en cours

	function layout(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		// recule la caméra juste assez pour voir du comptoir à la porte (≈ 13 m de large), même sur téléphone
		const portrait = TALL, aspect = w/h;
		camera.fov = portrait ? 46 : 40;
		const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) * aspect;
		const dist = portrait ? 5.9 / halfW : Math.max(17, 7 / halfW), tx = portrait ? 2.1 : 3, tz = portrait ? 4.4 : 1.6;
		const dir = new THREE.Vector3(0, portrait ? 1 : .56, portrait ? .62 : .63).normalize();
		camera.position.set(tx + dir.x*dist, .6 + dir.y*dist, tz + dir.z*dist);
		camera.lookAt(tx, .6, tz);
		camera.updateProjectionMatrix();
	}
	addEventListener("resize", layout); layout();

	/* ---------- clients ---------- */
	const SERVE_Z = 1.45, Q0 = TALL ? [3.6, 0, 3.7] : [3.7, 0, 2.3], DOOR = TALL ? [6.2, 0, 10.6] : [9.6, 0, 3.3];
	const qPos = TALL ? (i => [Q0[0] + (i % 2 ? 1.9 : 0), 0, Q0[2] + i*.7]) : (i => [Q0[0] + i*.95, 0, Q0[2] + i*.13]);
	const ICON = { cafe:"☕", lait:"🥛", croissant:"🥐" }, KEYS = ["cafe", "lait", "croissant"];
	const orderIcons = o => KEYS.filter(k => o[k]).map(k => ICON[k]).join("");
	const drinkCost = o => ECO.cafe + ECO.gobelet + (o.lait ? ECO.lait + D.laitExtra : 0);
	function newCustomer(){
		const s = makeStudent(scene); s.g.scale.setScalar(.9); s.g.position.set(DOOR[0], 0, DOOR[2]);
		const el = document.createElement("div"); el.className = "cz-bub";
		const order = { cafe:true, lait: rnd() < ECO.cappu, croissant: rnd() < ECO.attach };
		const c = { ...s, el, state:"in", target:null, patience:D.def.patience, order, dead:false, noCappu:false, happy: D.happyT > 0 };
		if(D.noLait && order.lait){ if(rnd() < .45) c.noCappu = true; else order.lait = false; }
		el.innerHTML = `<span>${orderIcons(order)}</span>`;
		if(MODE === "gerant") el.addEventListener("pointerdown", e => { e.stopPropagation(); cookie(c); });
		bubbles.appendChild(el);
		return c;
	}
	function sell(c, byPlayer){
		const pr = c.happy ? Math.round(S.price*LEV.happy*100)/100 : S.price;
		let amount = pr; D.cups++; D.var += drinkCost(c.order);
		let msg = "+" + euro(pr);
		if(c.order.croissant){
			if(D.stock > 0){ D.stock--; D.croissantsSold++; amount += ECO.croissantPrix; msg = "+" + euro(amount); }
			else { D.ruptures++; D.satAcc -= .4; popAt(c, "Plus de croissants !", true); }
		}
		D.ca += amount; D.satAcc += c.patience/D.def.patience > .5 ? 1 : .6; D.served++;
		// au-delà de 2,60 €, les étudiants trouvent ça cher (et le font savoir)
		if(pr > 2.6){ D.satAcc -= (pr - 2.6)*1.1; if(rnd() < .18) setTimeout(() => popAt(c, "C'est cher…", true), 250); }
		play("pop");
		popAt(c, msg);
		c.state = "out"; c.target = [DOOR[0], 0, DOOR[2] + .8];
		const cup = new THREE.Mesh(new THREE.CylinderGeometry(.08,.07,.18,8), std("#f4f1ea")); cup.position.set(.35, .9, .15); c.g.add(cup);
		c.el.remove();
	}

	/* ---------- ta caisse : composer la commande, vite et sans gaspiller ---------- */
	function takeMine(){
		const c = D.queue.shift(); P.cust = c; P.got = {}; P.t = 0;
		c.patience = Math.max(c.patience, 6);
		c.state = "toBar"; c.target = [PX, 0, SERVE_Z]; c.el.classList.add("mine");
		renderTray();
	}
	function renderTray(){
		const c = P.cust, o = $(".cz-order"), streak = P.streak ? `<span class="sp">⚡ ×${P.streak}</span>` : "";
		if(!c){ o.innerHTML = `<span style="color:#8a7d86">Ta caisse est libre…</span>${streak}`; return; }
		o.innerHTML = `<span>Ta caisse :</span>` + KEYS.filter(k => c.order[k]).map(k => `<span class="it${P.got[k] ? " on" : ""}">${ICON[k]}</span>`).join("") + streak;
	}
	function tap(k){
		if(!running || !D || D.pause || !P.cust) return;
		const c = P.cust;
		if(c.order[k] && !P.got[k]){ P.got[k] = true; play("pop"); }
		else {
			// mauvais ingrédient : il part à la poubelle, et ça se retrouve dans les achats
			P.streak = 0; play("bad");
			const btn = root.querySelector(`[data-k="${k}"]`); btn.classList.remove("ko"); void btn.offsetWidth; btn.classList.add("ko");
			if(k === "croissant"){ if(D.stock > 0){ D.stock--; D.gaspiCroissants++; popAt(me, "Croissant gâché !", true); } }
			else { D.gaspi += ECO[k]; popAt(me, `Gaspillé : −${euro(ECO[k])}`, true); }
		}
		if(KEYS.every(x => !c.order[x] || P.got[x])) serveMine();
		renderTray();
	}
	function serveMine(){
		const c = P.cust; P.cust = null;
		const fast = P.t <= ECO.eclair;
		P.streak = fast ? P.streak + 1 : 0;
		D.mine++;
		sell(c, true);
		if(fast && P.streak % 3 === 0){
			D.ca += ECO.tip; D.tips += ECO.tip;
			setTimeout(() => popAt(me, `⚡ Service éclair ×${P.streak} : pourboire +${euro(ECO.tip)}`), 350);
			play("chime");
		}
		if(D.tutoStep === 1){
			D.tutoStep = 2;
			say("Bravo ! Tes baristas servent les autres clients. Sois rapide : 3 services éclair d'affilée rapportent un pourboire ⚡");
			setTimeout(() => { if(running && D.tutoStep === 2){ D.tutoStep = 3; say("En haut, 📈 ton résultat en direct : il part du négatif, car les salaires et les croissants sont déjà payés. Chaque vente le fait remonter."); } }, 6000);
			setTimeout(() => { if(D && D.tutoStep === 3){ D.tutoStep = 4; say(null); } }, 14000);
		}
	}
	/* ---------- leviers du gérant : chaque geste a un coût, visible tout de suite sur le résultat ---------- */
	function curPrice(){ return Math.round(S.price*(D && running && D.happyT > 0 ? LEV.happy : 1)*100)/100; }
	function lever(k){
		if(!running || !D || D.pause) return;
		if(k === "pm" || k === "pp"){
			S.price = Math.round(Math.max(1, Math.min(3.5, S.price + (k === "pp" ? .1 : -.1)))*10)/10;
			D.priceMoves++; paintMenu(); play("pop");
		}
		if(k === "happy" && !D.happyUsed){
			D.happyUsed = true; D.happyT = LEV.happyLen; D.happyAt = D.t; S.rep = Math.min(1, S.rep + LEV.happyRep); paintMenu(); play("chime");
			banner(`🎉 Happy hour ! ${euro(curPrice())} le café pour les clients qui arrivent dans les ${LEV.happyLen} secondes`);
		}
		if(k === "renfort" && !D.renfortAt && D.active < baristas.length){
			D.renfortAt = D.t; D.extraSal += LEV.renfort;
			const b = baristas[D.active]; b.s.g.visible = true; b.cust = null; D.active++;
			play("good"); banner(`📞 Un renfort arrive au comptoir (+${LEV.renfort} € de salaire)`);
		}
		if(k === "reassort" && D.reassortT <= 0){
			D.reassortT = LEV.reassortDelai; D.reassortN++; D.extraAchats += LEV.reassortN*LEV.reassortPrix; play("pop");
			popAt({ g:{ position:{ x:DOOR[0], z:DOOR[2] } } }, `🚚 Livraison dans ${LEV.reassortDelai} s`);
		}
		renderLevers();
	}
	function cookie(c){
		if(MODE !== "gerant" || !running || D.pause || !(c.state === "queue" || c.state === "walk")) return;
		if(c.patience/D.def.patience > .45){ popAt(c, "Il est encore patient 🙂"); return; }
		c.patience = D.def.patience*.85; D.cookies++; D.extraAchats += LEV.cookie;
		c.el.classList.remove("warn"); play("pop"); popAt(c, `🍪 Geste commercial : −${euro(LEV.cookie)}`);
		hint("cookieDone", null);
	}
	function renderLevers(){
		if(MODE !== "gerant" || !D) return;
		const pr = $("#czPrice"); pr.textContent = euro(curPrice()); pr.classList.toggle("happy", D.happyT > 0);
		const q = $("#czQ"), n = D.queue.length; q.textContent = `File : ${n}`; q.classList.toggle("hot", n >= 5);
		const hb = tray.querySelector('[data-l="happy"]'), rb = tray.querySelector('[data-l="renfort"]'), cb = tray.querySelector('[data-l="reassort"]');
		hb.disabled = D.happyUsed && D.happyT <= 0; hb.style.setProperty("--p", D.happyT > 0 ? (D.happyT/LEV.happyLen*100) + "%" : "0%");
		hb.classList.toggle("glow", !D.happyUsed && n === 0 && D.t > 6 && D.t < DAY_LEN*.8);
		rb.disabled = !!D.renfortAt || D.active >= baristas.length;
		rb.classList.toggle("glow", !rb.disabled && n >= 5);
		cb.disabled = D.reassortT > 0; cb.style.setProperty("--p", D.reassortT > 0 ? ((1 - D.reassortT/LEV.reassortDelai)*100) + "%" : "0%");
		cb.classList.toggle("glow", !cb.disabled && D.stock <= 4 && D.t < DAY_LEN*.85);
	}
	// conseils contextuels : seulement pendant la première matinée, une fois chacun
	function hint(key, msg){
		if(!D || D.hints[key]) return;
		D.hints[key] = true;
		if(msg && D.def.tuto){ say(msg); const t = msg; setTimeout(() => { if(coach.textContent === t) say(null); }, 6500); }
	}
	function botLevers(){
		const L = BOT.lev; if(!L) return;
		const n = D.queue.length;
		if(L.includes("r") && n >= 5 && !D.renfortAt && D.t < DAY_LEN*.6) lever("renfort");
		if(L.includes("s") && D.stock <= 3 && D.reassortT <= 0 && D.t < DAY_LEN*.8) lever("reassort");
		if(L.includes("h") && n === 0 && !D.happyUsed && D.t > DAY_LEN*.7 && D.t < DAY_LEN*.85) lever("happy");
		if(L.includes("c")) D.queue.forEach(c => { if(c.patience/D.def.patience < .3) cookie(c); });
	}
	function noLaitFor(c){ if(c.order.lait){ c.order.lait = false; c.el.innerHTML = `<span>${orderIcons(c.order)}</span>`; } }
	function banner(txt){ const b = document.createElement("div"); b.className = "cz-banner"; b.textContent = txt; root.appendChild(b); setTimeout(() => b.remove(), 3000); }

	/* ---------- imprévus : une décision de gestionnaire en plein service ---------- */
	const EVENTS = {
		groupe(){
			const n = 12, pv = Math.round(S.price*.8*100)/100, gain = n*(pv - ECO.tasse);
			return { h:"Une commande groupée !", p:`Le secrétariat veut <b>${n} cappuccinos</b> pour une réunion, à <b>${euro(pv)}</b> pièce (20 % de remise). Pour la préparer, tes baristas devront s'arrêter <b>6 secondes</b>.`,
				opts:[["✅ J'accepte la commande", () => { D.ca += n*pv; D.var += n*ECO.tasse; D.cups += n; D.bBusy = 6; return `Commande groupée : ${n} × (${euro(pv)} − ${euro(ECO.tasse)}) = +${euro(gain)} de marge… mais la file va s'allonger !`; }],
					["❌ Je refuse : mes clients d'abord", () => `Commande refusée : ton équipe reste sur la file, mais tu laisses passer ${euro(gain)} de marge.`]] };
		},
		lait(){
			return { h:"Rupture de lait !", p:`Le livreur est bloqué dans les bouchons. La supérette d'en face vend du lait, mais plus cher : <b>+0,30 €</b> par cappuccino.`,
				opts:[["🛒 J'achète à la supérette", () => { D.laitExtra = .3; return "Lait d'appoint : un cappuccino te coûte maintenant 0,85 € au lieu de 0,55 €. Ta marge fond, mais tout le monde est servi."; }],
					["🚫 Plus de cappuccino ce matin", () => { D.noLait = true; D.queue.forEach(noLaitFor); if(P.cust){ noLaitFor(P.cust); renderTray(); } baristas.forEach(b => b.cust && noLaitFor(b.cust)); return "Plus de cappuccino : certains prendront un expresso, d'autres vont repartir."; }]] };
		},
		malade(){
			const solo = S.staff === 1, sup = ECO.interim - ECO.salaire;
			return { h:"Un barista est malade 🤒", p:`${solo ? "Ton seul barista" : "Un de tes baristas"} a la grippe. Une agence d'intérim peut envoyer un remplaçant tout de suite, mais plus cher : <b>${euro0(ECO.interim)}</b> la matinée au lieu de ${euro0(ECO.salaire)}.`,
				opts:[[`📞 J'appelle l'intérim (+${euro0(sup)})`, () => { D.extraSal += sup; return `Intérim : l'équipe reste au complet, pour ${euro0(sup)} de salaires en plus.`; }],
					[solo ? "💪 Je tiens le Comptoir seul·e" : "💪 On fait sans lui", () => {
						D.active = D.active - 1; D.extraSal -= ECO.salaire;
						const b = baristas[D.active]; b.s.g.visible = false; if(b.cust){ const c = b.cust; b.cust = null; sell(c, false); }
						return `Une personne en moins : ${euro0(ECO.salaire)} de salaire en moins ce matin, mais ${solo ? "tu es seul·e face à la file" : "la file va s'allonger"}.`; }]] };
		},
		story(){
			const n = 10, cost = n*ECO.tasse;
			return { h:"Une story Instagram ?", p:`Une étudiante très suivie sur le campus propose de parler du Comptoir dans sa story, contre <b>${n} cappuccinos offerts</b> (coût : ${euro(cost)}).`,
				opts:[["📸 Banco !", () => {
						D.extraAchats += cost; S.rep = Math.min(1, S.rep + .05);
						for(let i=0;i<12;i++) D.arrivals.push(D.t + 2 + rnd()*Math.max(2, DAY_LEN*.92 - D.t - 2));
						D.arrivals.sort((a, b) => a - b);
						return `Story publiée : ${euro(cost)} de cafés offerts… et une douzaine de clients en plus. C'est un coût d'acquisition client.`; }],
					["🙅 Non merci", () => "Pas de story : aucune dépense, mais pas de nouveaux clients non plus."]] };
		}
	};
	function showEvent(){
		D.pause = true; say(null); tray.hidden = true;
		const ev = EVENTS[D.def.event]();
		const choose = i => { card.removeEventListener("click", h); const note = ev.opts[i][1](); D.notes.push(note); hide(); tray.hidden = false; D.pause = false; say(note); const t = D.t; setTimeout(() => { if(D && D.t >= t && coach.textContent === note) say(null); }, 6500); };
		const h = e => { const b = e.target.closest("[data-ev]"); if(b){ play("pop"); choose(+b.dataset.ev); } };
		if(BOT.choice != null) return choose(BOT.choice);
		show(`<div class="cz-k">${D.def.year} · imprévu ⚡</div><h2 class="cz-h">${ev.h}</h2><p class="cz-p">${ev.p}</p>
			<div class="cz-opts">${ev.opts.map((o, i) => `<button class="cz-opt" data-ev="${i}">${o[0]}</button>`).join("")}</div>`);
		card.addEventListener("click", h);
		play("chime");
	}
	const v3 = new THREE.Vector3();
	function screenOf(c, y=2.25){ v3.set(c.g.position.x, y, c.g.position.z).project(camera); return [(v3.x*.5+.5)*innerWidth, (-v3.y*.5+.5)*innerHeight]; }
	function popAt(c, txt, bad){
		const [x, y] = screenOf(c, 2.6);
		const p = document.createElement("div"); p.className = "cz-pop" + (bad ? " bad" : ""); p.textContent = txt; p.style.left = x + "px"; p.style.top = y + "px";
		root.appendChild(p); setTimeout(() => p.remove(), 1100);
	}

	/* ---------- une journée de service ---------- */
	function arrivals(n){
		const out = [];
		while(out.length < n){ const t = rnd(), f = .55 + 1.2*Math.exp(-(((t-.5)/.14)**2)); if(rnd()*1.75 < f) out.push(t*DAY_LEN*.92); }
		return out.sort((a,b) => a-b);
	}
	function startDay(){
		const def = DAYS[S.day];
		const n = Math.round(def.base*BASE_K * priceFactor(S.price) * (.75 + .5*S.rep) * (.92 + rnd()*.16));
		D = { def, t:0, arrivals:arrivals(n), next:0, queue:[], all:[], ca:0, cups:0, served:0, lost:0, ruptures:0, croissantsSold:0, satAcc:0,
			stock:S.stock, bought:S.stock, expected:n, deliveries: S.bike && S.day === 3 ? 6 : 0,
			var:0, gaspi:0, gaspiCroissants:0, tips:0, mine:0, extraAchats:0, extraSal:0, laitExtra:0, noLait:false, active:S.staff, bBusy:0,
			pause:false, evAt:DAY_LEN*(.4 + rnd()*.12), evDone:!def.event, notes:[], breakEven:false, tutoStep:0,
			planPF:priceFactor(S.price), happyT:0, happyUsed:false, happyAt:0, happyGain:0, renfortAt:0, reassortT:0, reassortN:0, cookies:0, skipped:0, priceMoves:0, hints:{} };
		baristas.forEach((b, i) => { b.s.g.visible = i < S.staff; b.cust = null; });
		Object.assign(P, { cust:null, got:{}, t:0, streak:0 });
		running = true; tray.hidden = false; root.classList.add("serving");
		if(MODE === "caisse") renderTray(); else { renderLevers(); paintMenu(); }
		$("#czDay").textContent = `${def.year} · ${def.title.split(" · ")[0]}`;
		if(def.tuto && MODE === "caisse"){
			D.tutoStep = 1;
			say("Un client arrive à TA caisse ⭐ : compose sa commande avec les boutons du bas ☕ 🥛 🥐. Attention, un mauvais ingrédient part à la poubelle !");
		}
		if(def.tuto && MODE === "gerant") hint("start", "Tes baristas servent les clients. Toi, tu es le gérant : en bas, tes leviers pour piloter la matinée en direct 👇");
		onEvent && S.day === 0 && onEvent("start");
	}
	function say(msg){ coach.hidden = !msg; if(msg) coach.textContent = msg; }
	function stepDay(dt){
		if(D.pause) return;
		D.t += dt; D.bBusy = Math.max(0, D.bBusy - dt);
		if(!D.evDone && D.t >= D.evAt){ D.evDone = true; showEvent(); if(D.pause) return; }
		if(MODE === "gerant"){
			if(D.happyT > 0){ D.happyT -= dt; if(D.happyT <= 0){ paintMenu(); popAt({ g:{ position:{ x:1, z:0 } } }, "Fin de la happy hour"); } }
			if(D.reassortT > 0){ D.reassortT -= dt; if(D.reassortT <= 0){ D.stock += LEV.reassortN; play("pop"); popAt({ g:{ position:{ x:1.7, z:0 } } }, `🥐 +${LEV.reassortN} croissants livrés`); } }
			botLevers();
		}
		while(D.next < D.arrivals.length && D.arrivals[D.next] <= D.t){
			D.next++;
			// en mode gérant, le prix affiché à l'instant attire ou fait fuir les passants
			let extra = 0;
			if(MODE === "gerant"){
				const ratio = priceFactor(curPrice())/D.planPF*(D.happyT > 0 ? LEV.happyBoost : 1);
				if(ratio < 1 && rnd() > ratio){ D.skipped++; if(rnd() < .5) popAt({ g:{ position:{ x:DOOR[0], z:DOOR[2] } } }, "👀 Trop cher…", true); continue; }
				if(ratio > 1 && rnd() < ratio - 1){ extra = 1; if(D.happyT > 0) D.happyGain++; }
			}
			for(let e = 0; e <= extra; e++){
			const c = newCustomer(); D.all.push(c);
			const balk = D.queue.length >= 7 ? "😤" : c.noCappu ? "🙁" : null;
			if(balk){
				c.state = "balk"; c.target = [DOOR[0], 0, DOOR[2] + 1.2]; D.lost++; D.satAcc -= .5; c.el.classList.add("angry"); c.el.innerHTML = `<span>${balk}</span>`; setTimeout(() => c.el.remove(), 1200);
				if(c.noCappu) popAt(c, "Pas de cappuccino ?", true);
			}
			else { c.state = "walk"; D.queue.push(c); }
			}
		}
		// livraisons du vélo cargo (L3) : des commandes en plus, préparées entre deux clients
		if(D.deliveries > 0 && D.t > 8 && rnd() < dt*.35){ D.deliveries--; D.ca += S.price + ECO.croissantPrix*.5; D.var += ECO.tasse; D.cups++; D.served++; D.satAcc += 1; }
		// ta caisse prend le premier client libre, puis les baristas
		if(MODE === "caisse" && !P.cust && D.queue.length) takeMine();
		if(P.cust){
			const c = P.cust; P.t += dt; c.patience -= dt;
			const k = Math.max(0, c.patience/D.def.patience);
			c.el.style.setProperty("--ring", k > .55 ? "#3d7a55" : k > .25 ? "#d9a441" : "#c4532f");
			if(BOT.delay != null && P.t >= BOT.delay){ KEYS.forEach(x => { if(c.order[x]) P.got[x] = true; }); serveMine(); renderTray(); }
			else if(c.patience <= 0){
				P.cust = null; P.streak = 0; D.lost++; D.satAcc -= 1;
				c.state = "angry"; c.target = [DOOR[0], 0, DOOR[2] + 1];
				c.el.classList.add("angry"); c.el.innerHTML = "<span>😠</span>"; setTimeout(() => c.el.remove(), 1400);
				popAt(me, "Client parti de ta caisse !", true); play("bad"); renderTray();
			}
		}
		star.position.y = 3.05 + Math.sin(D.t*4)*.1; star.rotation.y += dt*2;
		for(let i=0;i<D.active;i++){
			const b = baristas[i];
			if(!b.cust && D.queue.length && D.bBusy <= 0){
				const c = D.queue.shift(); b.cust = c; b.t = 0; c.state = "toBar"; c.target = [BX[i], 0, SERVE_Z]; c.el.classList.add("busy");
			}
			if(b.cust){
				const c = b.cust;
				// le barista prépare pendant que le client s'approche ; il sert dès qu'il est au comptoir
				b.t += dt; b.s.body.rotation.z = Math.sin(D.t*12)*.06;
				if(c.state === "atBar" && b.t >= ECO.service){ b.cust = null; sell(c, false); }
			}
		}
		// file d'attente : place, patience
		D.queue.forEach((c, i) => {
			c.target = qPos(i);
			if(c.state === "queue" || c.state === "walk"){
				c.patience -= dt;
				const k = Math.max(0, c.patience/D.def.patience);
				c.el.style.setProperty("--ring", k > .55 ? "#3d7a55" : k > .25 ? "#d9a441" : "#c4532f");
				if(MODE === "gerant"){ c.el.classList.toggle("warn", k < .45 && k > 0); if(k < .45) hint("cookie", "Un client s'impatiente : touche-le pour lui offrir un cookie 🍪 (geste commercial, 0,30 €). C'est moins cher que de le perdre !"); }
				if(c.patience <= 0){
					c.state = "angry"; c.target = [DOOR[0], 0, DOOR[2] + 1]; D.lost++; D.satAcc -= 1;
					c.el.classList.add("angry"); c.el.innerHTML = "<span>😠</span>"; setTimeout(() => c.el.remove(), 1400);
					play("bad");
				}
			}
		});
		D.queue = D.queue.filter(c => c.state === "queue" || c.state === "walk");
		// déplacements
		for(const c of D.all){
			if(c.dead) continue;
			const tg = c.target; if(!tg) continue;
			const p = c.g.position, dx = tg[0]-p.x, dz = tg[2]-p.z, dd = Math.hypot(dx, dz);
			if(dd > .05){
				const sp = Math.min(dd, dt*3.4); p.x += dx/dd*sp; p.z += dz/dd*sp;
				c.g.rotation.y = Math.atan2(dx, dz); c.body.position.y = .65 + Math.abs(Math.sin(D.t*12 + c.patience))*.06;
			} else {
				c.body.position.y = .65;
				if(c.state === "walk") c.state = "queue";
				if(c.state === "toBar"){ c.state = "atBar"; c.g.rotation.y = Math.PI; }
				if(c.state === "out" || c.state === "angry" || c.state === "balk"){ c.dead = true; scene.remove(c.g); }
			}
			if(!c.dead && (c.state === "queue" || c.state === "walk" || c.state === "toBar" || c.state === "atBar")){
				const [x, y] = screenOf(c);
				c.el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;
			}
		}
		// affichage
		const h = 8 + Math.min(1, D.t/DAY_LEN)*4, mm = Math.floor((h % 1)*60);
		$("#czClock").textContent = `${Math.floor(h)}:${String(mm).padStart(2,"0")}`;
		if(MODE === "gerant"){
			renderLevers();
			if(D.queue.length >= 5) hint("queue", "La file s'allonge ! Appelle un renfort 📞, ou monte un peu ton prix pour calmer l'affluence.");
			if(D.stock <= 4 && D.t < DAY_LEN*.85) hint("stock", "Bientôt plus de croissants ! Un réassort express 🚚 coûte plus cher, mais évite la rupture.");
			if(D.hints.queue && !D.queue.length && D.t > 10 && D.t < DAY_LEN*.75) hint("calm", "C'est calme… Une happy hour 🎉 attirerait du monde, mais à prix réduit.");
		}
		const res = liveResult();
		$("#czRes").textContent = (res < 0 ? "−" : "+") + euro0(Math.abs(res));
		$(".cz-res").classList.toggle("neg", res < 0); $(".cz-res").classList.toggle("pos", res >= 0);
		if(!D.breakEven && res >= 0){
			D.breakEven = true; play("good");
			banner(S.learned.has("cout") ? `🎉 Seuil de rentabilité atteint au ${D.served}ᵉ client ! La suite, c'est du bénéfice.` : "🎉 Charges couvertes ! À partir de maintenant, chaque vente est du bénéfice.");
		}
		$("#czStock").textContent = D.stock;
		const sat = satisfaction(); $("#czSat").style.width = Math.round(sat*100) + "%";
		croissants.count = Math.min(12, D.stock);
		// fin de journée : plus d'arrivée et la salle est vide
		if(D.t >= DAY_LEN && D.next >= D.arrivals.length && !D.queue.length && !P.cust && baristas.every(b => !b.cust)) endDay();
	}
	const fixedCosts = () => S.staff*ECO.salaire + D.extraSal + (S.bike && S.day === 3 ? ECO.amortVelo : 0);
	const liveResult = () => D.ca - D.var - D.gaspi - D.extraAchats - D.bought*ECO.croissantAchat - fixedCosts();
	const idle = () => D && running && !D.pause && !D.queue.length && !P.cust && baristas.every(b => !b.cust) && D.happyT <= 0
		&& (D.next >= D.arrivals.length || D.arrivals[D.next] - D.t > .8);
	const satisfaction = () => D && (D.served + D.lost) ? Math.max(0, Math.min(1, .5 + D.satAcc/((D.served + D.lost)*2))) : S.rep;

	function endDay(){
		running = false; tray.hidden = true; root.classList.remove("serving"); $("#czFF").hidden = true;
		const lev = { happyUsed:D.happyUsed, happyGain:D.happyGain, renfortAt:D.renfortAt, reassortN:D.reassortN, cookies:D.cookies, skipped:D.skipped };
		paintMenu();
		D.all.forEach(c => { if(!c.dead){ scene.remove(c.g); c.dead = true; } c.el.remove(); });
		const achats = D.var + D.gaspi + D.extraAchats + D.bought*ECO.croissantAchat, salaires = S.staff*ECO.salaire + D.extraSal;
		const amort = S.bike && S.day === 3 ? ECO.amortVelo : 0;
		const res = { ca:D.ca, achats, salaires, amort, resultat:D.ca - achats - salaires - amort, served:D.served, lost:D.lost, ruptures:D.ruptures, left:D.stock, cups:D.cups, sat:satisfaction(), expected:D.expected,
			gaspi:D.gaspi, gaspiCroissants:D.gaspiCroissants, tips:D.tips, mine:D.mine, notes:D.notes, lev };
		S.results.push(res); S.totalProfit += res.resultat;
		S.rep = Math.max(.1, Math.min(1, S.rep*.4 + res.sat*.6));
		say(null);
		play(res.resultat >= 0 ? "good" : "bad");
		showResults(res);
	}

	/* ---------- panneaux ---------- */
	function show(html){ card.innerHTML = html; panel.hidden = false; card.scrollTop = 0; }
	function hide(){ panel.hidden = true; }
	function courseCard(key){ const [y, n, t] = COURSES[key]; S.learned.add(key); return `<div class="cz-course"><span class="tag">📚 En Licence Gestion · ${y}</span><b>${n}</b><span>${t}</span></div>`; }

	function intro(){
		show(`<div class="cz-k">Mini-jeu · ${formation.name}</div><h2 class="cz-h">Le Comptoir</h2>
			<div class="cz-big">☕</div>
			<p class="cz-p">Tu reprends le café de l'atrium pendant ta licence. Chaque matin, tu fixes le prix, tu commandes les croissants et tu organises ton équipe. Puis c'est le service : ${MODE === "caisse" ? "tu tiens toi-même la caisse, tu composes les commandes au plus vite" : "tu pilotes en direct (prix, happy hour, renfort, réassort, gestes commerciaux)"} et tu réagis aux imprévus… pour prouver que tu sais piloter une entreprise.</p>
			<ul class="cz-list"><li><span>L1</span>Prix, équipe et compte de résultat</li><li><span>L2</span>Coût de revient et seuil de rentabilité</li><li><span>L3</span>Investir pour grandir</li></ul>
			<button class="cz-go" data-a="prep">Ouvrir le Comptoir</button>`);
	}
	function prep(){
		const def = DAYS[S.day];
		paintMenu(); $("#czDay").textContent = `${def.year} · ${def.title.split(" · ")[0]}`;
		const est = () => Math.round(def.base*BASE_K * priceFactor(S.price) * (.75 + .5*S.rep));
		const render = () => {
			const n = est(), marge = S.price - ECO.tasse, fixe = S.staff*ECO.salaire;
			const cap = Math.round(DAY_LEN/ECO.service*S.staff*.85);
			const capHint = n > cap + 8 ? "⚠️ Ton équipe risque d'être débordée au rush de 10 h." : n < cap*.55 ? "Ton équipe sera peu occupée : beaucoup de salaires pour peu de clients." : "Équipe bien dimensionnée pour l'affluence prévue.";
			card.querySelector("[data-est]").textContent = `≈ ${n} clients`;
			card.querySelector("[data-marge]").textContent = euro(marge);
			card.querySelector("[data-cap]").textContent = capHint;
			card.querySelector("[data-price]").textContent = euro(S.price);
			card.querySelector("[data-stock]").textContent = S.stock;
			card.querySelectorAll("[data-staff]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.staff === S.staff)));
			const sv = card.querySelector("[data-seuil]");
			if(sv) sv.textContent = marge > 0 ? `${Math.ceil(fixe/marge)} cafés pour payer l'équipe` : "Tu vends à perte !";
			paintMenu();
		};
		show(`<div class="cz-k">${def.year} · préparation</div><h2 class="cz-h">${def.title}</h2>
			<p class="cz-p">${def.tuto ? "Avant d'ouvrir, trois décisions de gestionnaire. Pour cette première journée, on t'a préparé des réglages raisonnables : tu peux les garder." : "Ajuste tes décisions selon la journée d'hier."}</p>
			<div class="cz-row"><div class="t">💶 Prix du café <span data-price></span></div>
				<input type="range" min="1" max="3.5" step=".1" value="${S.price}" aria-label="Prix du café">
				<small>Affluence prévue : <b data-est></b> · marge sur chaque café : <b data-marge></b> (un cappuccino te coûte ${euro(ECO.tasse)})</small>
				${S.learned.has("cout") ? `<div class="cz-hint">Seuil de rentabilité : <b data-seuil></b></div>` : ""}</div>
			<div class="cz-row"><div class="t">🥐 Croissants à commander <span class="cz-step"><button data-st="-5" aria-label="5 de moins">−</button><b data-stock></b><button data-st="5" aria-label="5 de plus">+</button></span></div>
				<small>${euro(ECO.croissantAchat)} pièce, revendus ${euro(ECO.croissantPrix)}. Environ un client sur deux en prend un. Les invendus sont perdus.</small></div>
			<div class="cz-row"><div class="t">👩‍🍳 Baristas</div>
				<div class="cz-seg" style="margin-top:8px">${[1,2,3].map(n => `<button data-staff="${n}">${n}</button>`).join("")}</div>
				<small>${euro0(ECO.salaire)} de salaire chacun pour la matinée.</small><div class="cz-hint" data-cap></div></div>
			<button class="cz-go" data-a="open">Ouvrir les portes ▶</button>`);
		card.querySelector("input[type=range]").addEventListener("input", e => { S.price = +e.target.value; render(); });
		render();
	}
	function showResults(r){
		const def = DAYS[S.day];
		const tips = [];
		if(MODE === "caisse"){
			tips.push(`⭐ Tu as servi <b>${r.mine} client${r.mine > 1 ? "s" : ""}</b> toi-même${r.tips ? `, avec ${euro(r.tips)} de pourboires grâce à tes services éclair` : ""}.`);
			if(r.gaspi > 0 || r.gaspiCroissants) tips.push(`🗑️ Gaspillage à ta caisse : ${euro(r.gaspi + r.gaspiCroissants*ECO.croissantAchat)}, compté dans tes achats.`);
		} else {
			const L = r.lev, at = t => { const h = 8 + t/DAY_LEN*4; return `${Math.floor(h)} h ${String(Math.floor((h % 1)*60)).padStart(2, "0")}`; };
			if(L.happyUsed) tips.push(`🎉 Happy hour : <b>${L.happyGain} client${L.happyGain > 1 ? "s" : ""} en plus</b>, mais à prix réduit.`);
			if(L.renfortAt) tips.push(`📞 Renfort appelé à ${at(L.renfortAt)} : ${euro0(LEV.renfort)} de salaire en plus${L.renfortAt > DAY_LEN*.6 ? ", un peu tard pour être rentable" : ""}.`);
			if(L.reassortN) tips.push(`🚚 ${L.reassortN} réassort${L.reassortN > 1 ? "s" : ""} express : ${L.reassortN*LEV.reassortN} croissants à ${euro(LEV.reassortPrix)} au lieu de ${euro(ECO.croissantAchat)}. Mieux vaut bien commander le matin !`);
			if(L.cookies) tips.push(`🍪 ${L.cookies} geste${L.cookies > 1 ? "s" : ""} commercia${L.cookies > 1 ? "ux" : "l"} (${euro(L.cookies*LEV.cookie)}) : autant de clients gardés.`);
			if(L.skipped > 3) tips.push(`👀 ${L.skipped} passants ont trouvé ton prix trop cher et ne sont pas entrés.`);
		}
		r.notes.forEach(n => tips.push("⚡ " + n));
		if(r.lost > 3) tips.push(`<b>${r.lost} clients sont repartis</b> sans être servis : au rush de 10 h, il fallait ${MODE === "caisse" ? "plus de baristas ou un service plus rapide à ta caisse" : "plus de baristas, un renfort plus tôt ou des gestes commerciaux"}.`);
		if(r.ruptures > 2) tips.push(`<b>Rupture de croissants</b> ${r.ruptures} fois : la demande dépassait ta commande.`);
		if(r.left > 8) tips.push(`<b>${r.left} croissants invendus</b>, soit ${euro(r.left*ECO.croissantAchat)} jetés.`);
		if(S.price < 1.7) tips.push("Prix très bas : beaucoup de monde, mais une marge minuscule sur chaque café.");
		if(S.price > 2.6) tips.push("Prix élevé : chaque café rapporte, mais les étudiants trouvent ça cher. Ta réputation baisse, et avec elle l'affluence de demain.");
		if(r.lost <= 3 && r.ruptures <= 2 && r.left <= 8 && S.price >= 1.7 && S.price <= 2.6) tips.push("Belle matinée : prix, stock et équipe étaient bien réglés.");
		const cls = v => v >= 0 ? "cz-pos" : "cz-neg";
		show(`<div class="cz-k">${def.year} · fin de matinée</div><h2 class="cz-h">${r.resultat >= 0 ? "Une matinée rentable" : "Une matinée à perte"}</h2>
			<table class="cz-tbl">
				<tr><td>Ventes (${r.served} clients servis)</td><td class="cz-pos">+ ${euro(r.ca)}</td></tr>
				<tr><td>Achats (café, lait, gobelets, croissants)</td><td class="cz-neg">− ${euro(r.achats)}</td></tr>
				<tr><td>Salaires (${S.staff} barista${S.staff > 1 ? "s" : ""}${r.lev && r.lev.renfortAt ? " + 1 renfort" : ""}${r.salaires !== S.staff*ECO.salaire + (r.lev && r.lev.renfortAt ? LEV.renfort : 0) ? ", imprévu compris" : ""})</td><td class="cz-neg">− ${euro(r.salaires)}</td></tr>
				${r.amort ? `<tr><td>Amortissement du vélo cargo <small style="color:#8a7d86">(3 000 € étalés sur 3 ans)</small></td><td class="cz-neg">− ${euro(r.amort)}</td></tr>` : ""}
				<tr class="tot"><td><b>Résultat</b></td><td class="${cls(r.resultat)}">${r.resultat >= 0 ? "+" : "−"} ${euro(Math.abs(r.resultat))}</td></tr>
			</table>
			<div class="cz-hint" style="background:#fff;border:1px solid #ead9bf;color:#5b4f5f;line-height:1.5">${tips.join("<br>")}</div>
			<button class="cz-go" data-a="next">Continuer</button>`);
	}
	function next(){
		const def = DAYS[S.day];
		if(def.exAfter === "compte" && !S.learned.has("compte")) return exCompte();
		S.day++;
		if(S.day >= DAYS.length) return finale();
		if(DAYS[S.day].year !== def.year){ onEvent && onEvent("act", S.day + 1); play("stamp"); }
		const nd = DAYS[S.day];
		if(nd.exBefore === "cout" && !S.learned.has("cout")) return exCout();
		if(nd.exBefore === "invest" && !S.learned.has("invest")) return exInvest();
		prep();
	}

	/* ---------- exercice L1 : le compte de résultat (avec SES chiffres) ---------- */
	function exCompte(){
		const r = S.results[S.results.length - 1];
		const vals = { ca:Math.round(r.ca), achats:Math.round(r.achats), sal:Math.round(r.salaires) };
		const res = vals.ca - vals.achats - vals.sal;
		const toks = [["ca", vals.ca], ["sal", vals.sal], ["achats", vals.achats]];
		let sel = null; const placed = {};
		show(`<div class="cz-k">L1 · exercice</div><h2 class="cz-h">Ton compte de résultat</h2>
			<p class="cz-p">Ton expert-comptable veut le compte de résultat de la matinée. Touche un montant, puis la ligne où il va.</p>
			<div class="cz-chips">${toks.map(([k,v]) => `<button class="cz-tok" data-tok="${k}">${v} €</button>`).join("")}</div>
			<button class="cz-slot" data-slot="ca">Chiffre d'affaires <small style="color:#8a7d86">(produits)</small><b>…</b></button>
			<button class="cz-slot" data-slot="achats">Achats consommés <small style="color:#8a7d86">(charges)</small><b>…</b></button>
			<button class="cz-slot" data-slot="sal">Salaires <small style="color:#8a7d86">(charges)</small><b>…</b></button>
			<div data-q hidden><p class="cz-p" style="margin-top:8px"><b>Et le résultat de la matinée ?</b></p><div class="cz-opts">
				${[res, vals.ca - vals.achats, vals.ca + vals.achats - vals.sal].sort(() => rnd() - .5).map(v => `<button class="cz-opt" data-res="${v}">${v} €</button>`).join("")}</div></div>
			<div data-done></div>`);
		card.addEventListener("click", function h(e){
			const t = e.target.closest("[data-tok]"), s = e.target.closest("[data-slot]"), o = e.target.closest("[data-res]");
			if(t){ sel = t.dataset.tok; card.querySelectorAll("[data-tok]").forEach(b => b.setAttribute("aria-pressed", String(b === t))); return; }
			if(s && sel){
				const ok = s.dataset.slot === sel;
				s.classList.toggle("ok", ok); s.classList.toggle("ko", !ok);
				s.querySelector("b").textContent = ok ? toks.find(x => x[0] === sel)[1] + " €" : "Pas ici";
				play(ok ? "pop" : "bad");
				if(ok){ placed[sel] = true; card.querySelector(`[data-tok="${sel}"]`).classList.add("used"); sel = null; }
				if(Object.keys(placed).length === 3) card.querySelector("[data-q]").hidden = false;
				return;
			}
			if(o && !card.querySelector(".cz-opt.ok")){
				const ok = +o.dataset.res === res;
				o.classList.add(ok ? "ok" : "ko"); play(ok ? "good" : "bad");
				if(ok){
					card.removeEventListener("click", h);
					card.querySelector("[data-done]").innerHTML = `<p class="cz-p" style="margin-top:10px">Exact : ${vals.ca} − ${vals.achats} − ${vals.sal} = <b>${res} €</b>. ${res >= 0 ? "Ton activité crée de la valeur." : "Tes charges dépassent tes produits : il faudra ajuster."}</p>${courseCard("compte")}<button class="cz-go" data-a="next">Passer en L2 →</button>`;
				} else o.textContent += " · non";
			}
		});
	}

	/* ---------- exercice L2 : coût de revient et seuil de rentabilité ---------- */
	function exCout(){
		const fixe = S.staff*ECO.salaire;
		show(`<div class="cz-k">L2 · exercice</div><h2 class="cz-h">Combien te coûte un cappuccino ?</h2>
			<p class="cz-p">Pour fixer un bon prix, il faut d'abord connaître son <b>coût de revient</b>. Voici ce que contient chaque tasse :</p>
			<table class="cz-tbl">${COMPO.map(([n, v]) => `<tr><td>${n}</td><td>${euro(v)}</td></tr>`).join("")}</table>
			<div class="cz-opts" data-s1>${[.45, .55, .65].map(v => `<button class="cz-opt" data-c="${v}">${euro(v)}</button>`).join("")}</div>
			<div data-s2></div>`);
		card.addEventListener("click", function h(e){
			const o = e.target.closest("[data-c]");
			if(o && !card.querySelector("[data-s1] .ok")){
				const ok = +o.dataset.c === ECO.tasse; o.classList.add(ok ? "ok" : "ko"); play(ok ? "good" : "bad");
				if(ok) step2();
				return;
			}
			const s = e.target.closest("[data-seuilopt]");
			if(s && !card.querySelector("[data-s2] .ok")){
				const ok = +s.dataset.seuilopt === S.seuil; s.classList.add(ok ? "ok" : "ko"); play(ok ? "good" : "bad");
				if(ok){ card.removeEventListener("click", h); card.querySelector("[data-end]").innerHTML = `${courseCard("cout")}<p class="cz-p">Désormais, ton seuil de rentabilité s'affiche quand tu fixes ton prix.</p><button class="cz-go" data-a="prep">Préparer la journée</button>`; }
			}
		});
		function step2(){
			const marge = S.price - ECO.tasse;
			S.seuil = marge > 0 ? Math.ceil(fixe/marge) : 999;
			const opts = [S.seuil, Math.ceil(fixe/S.price), Math.ceil(fixe/ECO.tasse)].filter((v, i, a) => a.indexOf(v) === i);
			while(opts.length < 3) opts.push(S.seuil + 9*opts.length);
			card.querySelector("[data-s2]").innerHTML = `<p class="cz-p" style="margin-top:12px">Exact, <b>${euro(ECO.tasse)}</b> la tasse. Avec un prix de ${euro(S.price)}, chaque café te laisse <b>${euro(marge)}</b> de marge.</p>
				<p class="cz-p">Ton équipe te coûte <b>${euro0(fixe)}</b> par matinée, quoi qu'il arrive. <b>Combien de cafés vendre pour payer les salaires ?</b></p>
				<canvas class="cz-chart" width="560" height="190"></canvas>
				<div class="cz-opts">${opts.sort((a,b) => a-b).map(v => `<button class="cz-opt" data-seuilopt="${v}">${v} cafés</button>`).join("")}</div><div data-end></div>`;
			drawChart(card.querySelector("canvas"), marge, fixe);
		}
	}
	function drawChart(cv, marge, fixe){
		const x = cv.getContext("2d"), W = cv.width, H = cv.height, P = 34, maxN = Math.max(60, Math.ceil(fixe/Math.max(marge, .2)*1.6));
		const maxV = Math.max(fixe*1.6, marge*maxN);
		const X = n => P + (W - P - 12)*n/maxN, Y = v => H - P + 6 - (H - P - 12)*v/maxV;
		x.clearRect(0,0,W,H); x.font = "bold 15px Nunito, sans-serif";
		x.strokeStyle = "#ead9bf"; x.lineWidth = 2; x.beginPath(); x.moveTo(P, Y(0)); x.lineTo(W-8, Y(0)); x.moveTo(P, Y(0)); x.lineTo(P, 8); x.stroke();
		x.strokeStyle = "#c4532f"; x.setLineDash([8,6]); x.beginPath(); x.moveTo(P, Y(fixe)); x.lineTo(W-8, Y(fixe)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#c4532f"; x.fillText(`Salaires : ${Math.round(fixe)} €`, P + 6, Y(fixe) - 8);
		x.strokeStyle = "#3d7a55"; x.lineWidth = 4; x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(maxN), Y(marge*maxN)); x.stroke();
		x.fillStyle = "#3d7a55"; x.fillText("Marge cumulée", X(maxN*.62), Y(marge*maxN*.62) - 12);
		x.fillStyle = "#8a7d86"; x.fillText("cafés vendus →", W - 128, H - 8);
	}

	/* ---------- exercice L3 : investir dans un vélo cargo ---------- */
	function exInvest(){
		const cout = 3000, livr = 30, marge = 1.5, gain = livr*marge, delai = Math.round(cout/gain);
		show(`<div class="cz-k">L3 · exercice</div><h2 class="cz-h">Un vélo cargo pour livrer Wenov ?</h2>
			<p class="cz-p">Un fournisseur te propose un vélo cargo à <b>${euro0(cout)}</b>. Avec, tu pourrais livrer les bureaux d'Euratechnologies : environ <b>${livr} livraisons par semaine</b>, avec <b>${euro(marge)}</b> de marge chacune.</p>
			<p class="cz-p"><b>En combien de semaines le vélo serait-il remboursé ?</b></p>
			<div class="cz-opts" data-s1>${[20, delai, 150].map(v => `<button class="cz-opt" data-d="${v}">${v} semaines</button>`).join("")}</div>
			<div data-s2></div>`);
		card.addEventListener("click", function h(e){
			const o = e.target.closest("[data-d]");
			if(o && !card.querySelector("[data-s1] .ok")){
				const ok = +o.dataset.d === delai; o.classList.add(ok ? "ok" : "ko"); play(ok ? "good" : "bad");
				if(ok) card.querySelector("[data-s2]").innerHTML = `<p class="cz-p" style="margin-top:10px">${livr} × ${euro(marge)} = <b>${euro0(gain)} par semaine</b>, donc ${euro0(cout)} ÷ ${euro0(gain)} ≈ <b>${delai} semaines</b>, un peu plus d'une année universitaire. C'est ton <b>délai de récupération</b>.</p>
					<p class="cz-p"><b>Alors, tu investis ?</b></p>
					<div class="cz-opts"><button class="cz-opt" data-buy="1">🚲 J'achète : le Comptoir livre dès ce matin</button><button class="cz-opt" data-buy="0">⏳ Pas maintenant : je garde ma trésorerie</button></div><div data-end></div>`;
				return;
			}
			const b = e.target.closest("[data-buy]");
			if(b && !card.querySelector("[data-buy].ok")){
				S.bike = b.dataset.buy === "1"; b.classList.add("ok"); play("good");
				card.removeEventListener("click", h);
				card.querySelector("[data-end]").innerHTML = `<p class="cz-p" style="margin-top:10px">${S.bike ? "Bon pari si la demande tient : les livraisons s'ajoutent à ton service." : "Prudent : pas de risque, mais pas de nouvelles ventes non plus."} Les deux choix se défendent, tout dépend de ta trésorerie et de ta confiance dans la demande.</p>${courseCard("invest")}<button class="cz-go" data-a="prep">Préparer la journée</button>`;
			}
		});
	}

	/* ---------- bilan final ---------- */
	function finale(){
		const tot = S.totalProfit, sat = S.results.reduce((a, r) => a + r.sat, 0)/S.results.length;
		const [tb, tbS, b, bS] = MENTIONS[MODE];
		const mention = tot >= tb && sat >= tbS ? "Très bien" : tot >= b && sat >= bS ? "Bien" : tot >= 0 ? "Assez bien" : null;
		S.learned.add("prix"); S.learned.add("stock"); S.learned.add("rh");
		onEvent && onEvent("win", mention || "De justesse");
		play("win");
		const order = ["prix","rh","compte","stock","cout","invest"].filter(k => S.learned.has(k));
		show(`<div class="cz-k">Licence Gestion · diplôme</div><h2 class="cz-h">${mention ? `Diplômé·e, mention ${mention} !` : "Diplômé·e… de justesse !"}</h2>
			<div class="cz-big">🎓</div>
			<p class="cz-p" style="text-align:center">La mention tient compte de ton résultat <b>et</b> de la satisfaction de tes clients.</p>
			<table class="cz-tbl">${S.results.map((r, i) => `<tr><td>${DAYS[i].title}</td><td class="${r.resultat >= 0 ? "cz-pos" : "cz-neg"}">${r.resultat >= 0 ? "+" : "−"} ${euro(Math.abs(r.resultat))}</td></tr>`).join("")}
				<tr><td>Satisfaction moyenne des clients</td><td>${Math.round(sat*100)} %</td></tr>
				<tr class="tot"><td><b>Résultat cumulé</b></td><td class="${tot >= 0 ? "cz-pos" : "cz-neg"}">${tot >= 0 ? "+" : "−"} ${euro(Math.abs(tot))}</td></tr></table>
			<p class="cz-p">En quatre matinées, tu as fait le travail d'un gestionnaire, et touché à ${order.length} cours de la licence :</p>
			<ul class="cz-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="cz-go" data-a="lead">📄 Recevoir la plaquette de la Licence Gestion</button>` : ""}
			<a class="cz-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Gestion ↗</a>
			<button class="cz-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="cz-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions & boucle ---------- */
	card.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(a){
			const k = a.dataset.a; play("pop");
			if(k === "prep") return prep();
			if(k === "open"){ hide(); return startDay(); }
			if(k === "next") return next();
			if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
			if(k === "lead"){ close(); return openLead(); }
			if(k === "replay"){ Object.assign(S, { day:0, price:2.0, stock:30, staff:2, rep:.6, bike:false, results:[], learned:new Set(), seuil:null, totalProfit:0 }); return intro(); }
		}
		const st = e.target.closest("[data-st]"); if(st){ S.stock = Math.max(0, Math.min(80, S.stock + +st.dataset.st)); card.querySelector("[data-stock]").textContent = S.stock; return; }
		const sf = e.target.closest("[data-staff]"); if(sf){ S.staff = +sf.dataset.staff; card.querySelectorAll("[data-staff]").forEach(b => b.setAttribute("aria-pressed", String(b === sf))); const ev = card.querySelector("input[type=range]"); ev && ev.dispatchEvent(new Event("input")); }
	});
	function loop(t){
		if(closed) return;
		const dt = Math.min(.05, (t - (last || t))/1000); last = t;
		if(running){
			const ff = idle(); $("#czFF").hidden = !ff;
			for(let i = 0; i < (ff ? 3 : 1) && running; i++) stepDay(dt);
		}
		for(const d of deco) d.hat.position.y = 1.82 + Math.max(0, Math.sin(t/600 + d.g.position.x))*.03;
		renderer.render(scene, camera);
		raf = requestAnimationFrame(loop);
	}
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); removeEventListener("resize", layout); document.removeEventListener("keydown", onKey);
		renderer.dispose(); renderer.forceContextLoss();
		root.remove(); onClose && onClose();
	}
	function onKey(e){
		if(e.key === "Escape") return close();
		if(!running) return;
		if(MODE === "caisse"){
			const k = { "1":"cafe", "&":"cafe", a:"cafe", "2":"lait", "é":"lait", z:"lait", "3":"croissant", '"':"croissant", e:"croissant" }[e.key.toLowerCase()];
			if(k){ e.preventDefault(); tap(k); }
		} else {
			const k = { "-":"pm", arrowleft:"pm", "+":"pp", "=":"pp", arrowright:"pp", "1":"happy", "&":"happy", "2":"renfort", "é":"renfort", "3":"reassort", '"':"reassort" }[e.key.toLowerCase()];
			if(k){ e.preventDefault(); lever(k); }
		}
	}
	tray.addEventListener("pointerdown", e => {
		const b = e.target.closest("[data-k]"); if(b){ e.preventDefault(); tap(b.dataset.k); }
		const l = e.target.closest("[data-l]"); if(l && !l.disabled){ e.preventDefault(); lever(l.dataset.l); }
	});
	document.addEventListener("keydown", onKey);
	$(".cz-x").addEventListener("click", close);
	paintMenu();
	intro();
	raf = requestAnimationFrame(loop);
	// debug (?debug) : faire avancer la simulation sans attendre l'affichage
	if(window.campus) window.campus.game = { S, BOT, P, get D(){ return D; }, get running(){ return running; },
		step(sec, draw=true){ for(let i=0;i<sec*30 && running;i++) stepDay(1/30); if(draw) renderer.render(scene, camera); }, card };
}
