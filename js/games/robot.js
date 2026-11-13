/* « Panne avant lundi » — mini-jeu de la Licence Sciences pour l'Ingénieur (École du Numérique), clé « robot ».
   Un seul dossier : vendredi 15 h, la cellule robotique rejette une pièce sur cinq et le client attend 12 000 pièces
   lundi 8 h. Le joueur, stagiaire ingénieur, cherche les causes et répare, avec les gestes du métier :
     1. rejouer pas à pas (bouton d'homme mort) les cycles rejetés et relever où et quand le bras rate ;
     2. mesurer au comparateur le jeu du coude (approche par le haut, puis par le bas) et le compenser ;
     3. écarter une fausse piste (la pince « usée » : on mesure son serrage), puis relever sur le chronogramme
        le retard entre le capteur et la butée, et recaler la fermeture de la pince dans le cycle ;
     4. régler gain et amortissement de l'épaule sur la courbe de réponse, un seul réglage à la fois ;
     5. réapprendre la règle de la caméra sous les nouvelles LED, à partir de pièces contrôlées à la main.
   Final : une heure de production en 60 s (le taux de rebut tombe), mesure du temps de cycle, rapport au client.
   Tableau de bord : cadrans d'articulations, capteur d'effort de la pince, caméra de la pince, journal.
   Mise en scène illustrative (cellule, client et chiffres fictifs) ; contenu à relire par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makePerson } from "../kit.js?v=50ccfe85e2";
import { jpoCard } from "./jpo.js?v=50ccfe85e2";
import { palier } from "./palier.js?v=50ccfe85e2";

const SPEED = /[?&]vite/.test(location.search) ? 6 : 1;      // ?vite : tout va 6 fois plus vite (pour tester)
const MENTIONS = ["De justesse", "Assez bien", "Bien", "Très bien"];
const COURSES = {
	meca:   ["L1", "Mécanique et métrologie", "Une transmission n'est jamais parfaite : entre deux engrenages, il reste un peu de jeu. On le mesure au comparateur, en arrivant d'un côté puis de l'autre, et on le compense ou on change la pièce."],
	indus:  ["L2", "Robotique et systèmes industriels", "Un automate enchaîne son cycle au rythme des capteurs. Le chronogramme montre ses entrées et ses sorties dans le temps : c'est l'outil pour vérifier que chaque action arrive au bon moment."],
	auto:   ["L2", "Automatique et asservissement", "Une boucle compare sans cesse la consigne et la mesure. Le gain donne la force de rattrapage, l'amortissement freine avant la cible. On règle un paramètre à la fois en lisant la courbe de réponse."],
	vision: ["L3", "Vision par ordinateur et IA embarquée", "La caméra mesure, la règle décide. Une règle apprise sous un éclairage ne vaut plus sous un autre : on la réapprend sur des exemples contrôlés, puis on la teste sur des pièces neuves."]
};
const fr = (n, d = 1) => n.toFixed(d).replace(".", ",").replace("-", "−");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// géométrie du bras (unités ≈ mètres)
const SH = 1.2, L1 = 1.4, L2 = 1.3, TOOL = .45, CUBE = .3;
const D2R = Math.PI/180, R2D = 180/Math.PI;
const MM_PER_DEG = L2*1000*D2R;          // 1° au coude ≈ 22,7 mm au bout de l'avant-bras
const BELT = { z:1.75, y:.9, x0:-3.6, stop:.62 };
const SENSOR_X = BELT.stop - .3, VBELT = .75;   // capteur remonté de 30 cm mercredi ; pièce à 0,75 m/s → 0,6 s jusqu'à la butée
const PICK_Y = BELT.y + CUBE/2 + .02, UP_Y = BELT.y + .8;
const ARRIVE = (BELT.stop - (SENSOR_X - CUBE/2))/VBELT;  // 0,6 s entre le front du capteur et la butée
const BASE_CYCLE = 3.85, CYCLE_MAX = 4.7;       // temps de cycle = 3,85 s + temporisation ; lundi exige 4,7 s au plus
const SAT_SECONDS = 57600, ORDER = 12000;        // samedi 6 h - 22 h ; commande du client
const SERVO = { step:25, from:35, T:2, over:2, tol:1, settle:.65, kp0:40, kd0:3 };
const BACKLASH = .4;                             // jeu réel du coude, en degrés
const GRIP_N = 52, GRIP_SPEC = 40;               // serrage mesuré / exigé par le constructeur
const LUM_SHIFT = 12, OLD_TH = 70;               // les LED éclairent 12 points de plus ; seuil appris sous les néons
// pièces contrôlées à la main par Karim (luminosité mesurée sous les LED)
const SAMPLES = [[62, 1], [74, 1], [93, 0], [68, 1], [84, 0], [71, 1], [97, 0], [78, 1], [65, 1], [88, 0]];
const TESTLOT = [66, 90, 72, 61, 86, 77, 69, 95, 75, 63, 87, 70];       // lot neuf : bonnes ≤ 77, défauts ≥ 86
const COL = "#d9782d", COL_DEF = "#e9b27f";
const LOG = [
	{ k:"coude",   cyc:212, when:"mardi 9 h 14",    o:{ off:9 } },
	{ k:"capteur", cyc:217, when:"mercredi 15 h 02", o:{ tempo:.25 } },
	{ k:"servo",   cyc:223, when:"jeudi 16 h 40",   o:{ kp:SERVO.kp0, kd:SERVO.kd0, drop:true } },
	{ k:"vision",  cyc:231, when:"vendredi 8 h 05", o:{ lum:74 } }
];

const CSS = `
.rb{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#22303d;background:#e6eaee;overflow:auto;animation:rbIn .35s ease both}
@keyframes rbIn{from{opacity:0}to{opacity:1}}
.rb canvas.rb-3d{position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0}
.rb-grid{position:relative;z-index:1;display:grid;grid-template-columns:300px 1fr 290px;grid-template-rows:auto minmax(420px,1fr);gap:10px;padding:10px;min-height:100%;box-sizing:border-box;pointer-events:none}
.rb-grid>*{pointer-events:auto}
.rb-top{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rb-chip{background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 4px 14px rgba(30,48,94,.12);font-variant-numeric:tabular-nums}
.rb-chip.st{background:#1e305e;color:#fff}
.rb-chip.rj{background:#fde3e0;color:#a3271c;transition:background .4s,color .4s}
.rb-chip.rj.good{background:#dff3e6;color:#11603d}
.rb-x{margin-left:auto;width:44px;height:44px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(30,48,94,.15)}
.rb-col{display:flex;flex-direction:column;gap:10px;min-width:0}
.rb-pan{background:rgba(255,255,255,.95);border:1px solid #d3dae1;border-radius:14px;padding:10px 12px;box-shadow:0 6px 18px rgba(30,48,94,.08)}
.rb-pan h4{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a}
.rb-view{position:relative;border-radius:14px;border:1px solid #c9d2db;pointer-events:none;min-height:300px}
.rb-view .lbl{position:absolute;left:10px;top:8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a;font-weight:800;background:rgba(255,255,255,.8);padding:3px 8px;border-radius:6px}
.rb-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);max-width:92%;text-align:center;background:rgba(30,48,94,.9);color:#fff;font-weight:800;font-size:13px;padding:8px 14px;border-radius:14px;box-shadow:0 6px 18px rgba(30,48,94,.25);transition:opacity .4s}
.rb-hint:empty{opacity:0}
.rb-cam{position:relative;aspect-ratio:4/3;border-radius:10px;border:1px solid #c9d2db;overflow:hidden}
.rb-cam .rec{position:absolute;left:8px;top:6px;font:800 11px ui-monospace,Consolas,monospace;color:#d6213a;background:rgba(255,255,255,.75);padding:1px 6px;border-radius:5px}
.rb-cam .cross{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border:2px solid rgba(11,122,142,.8);border-radius:50%}
.rb-cam .hue{position:absolute;left:6px;right:6px;bottom:6px;font:800 12px/1.3 ui-monospace,Consolas,monospace;background:rgba(22,32,43,.88);color:#b9f3d0;padding:3px 7px;border-radius:5px;text-align:center}
.rb-cam .hue.ko{color:#ffb3ba}
.rb-cam .hue:empty{display:none}
.rb-gauges{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rb-g{text-align:center;font-size:11px;font-weight:800;color:#5b6b7a}
.rb-g .ring{width:60px;height:60px;margin:0 auto 3px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#21b6ce var(--a),#e3e8ed 0)}
.rb-g .ring b{width:46px;height:46px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:14px;color:#22303d}
.rb-force{width:100%;height:64px;display:block}
.rb-fval{font:800 13px ui-monospace,Consolas,monospace;color:#0b7a8e;float:right;margin-top:-22px}
.rb-term{font:600 12px/1.45 ui-monospace,Consolas,monospace;background:#16202b;color:#b9f3d0;border-radius:10px;padding:8px 10px;min-height:80px;max-height:140px;overflow:auto}
.rb-term .ko{color:#ff8b95}.rb-term .inf{color:#9ad7ff}
.rb-mis b.t{display:block;font:700 18px/1.2 Fraunces,Georgia,serif;margin:2px 0 4px}
.rb-mis p{margin:0 0 6px;font-size:13.5px;line-height:1.45}
.rb-mis .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.rb-say{background:#fff6e3;border-left:4px solid #e0a030;border-radius:10px;padding:7px 10px;font-size:13px;line-height:1.4;margin:6px 0}
.rb-say:empty{display:none}
.rb-say b{display:block;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#a66a10}
.rb-carnet{list-style:none;margin:6px 0 0;padding:0;font-size:12.5px;line-height:1.35}
.rb-carnet li{padding:5px 8px;border-radius:8px;background:#f2f5f7;margin:4px 0}
.rb-carnet li.ok{background:#e5f6ec}.rb-carnet li.no{background:#f1f1f1;color:#6b7680}.rb-carnet li.obs{background:#fdf1e7}
.rb-carnet:empty:before{content:"Rien encore : chaque mesure relevée s'inscrit ici.";color:#8a95a1;font-size:12px}
.rb-btn{border:0;border-radius:12px;padding:10px 12px;font:800 14px Nunito,sans-serif;cursor:pointer;background:#21b6ce;color:#0b2f67;width:100%;margin-top:6px;min-height:44px}
.rb-btn.alt{background:#fff;border:2px solid #d3dae1;color:#1e305e}
.rb-btn.dark{background:#1e305e;color:#fff}
.rb-btn:disabled{opacity:.45;cursor:default}
.rb-hold{display:block;width:100%;border:0;border-radius:14px;padding:14px 10px;font:900 15px Nunito,sans-serif;background:#f2c63c;color:#3b2a00;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 4px 0 #b8901c;min-height:56px}
.rb-hold.on{background:#3bd16f;box-shadow:0 1px 0 #1f8f48;transform:translateY(3px)}
.rb-small{font-size:12.5px;color:#5b6b7a;line-height:1.4;margin:6px 0}
.rb-log{list-style:none;margin:0 0 6px;padding:0;font-size:12.5px}
.rb-log li{display:flex;gap:6px;align-items:center;padding:5px 7px;border-radius:8px;background:#f2f5f7;margin:3px 0;font-weight:700}
.rb-log li.cur{background:#dff3f7;outline:2px solid #21b6ce}
.rb-log li.done{background:#e5f6ec;color:#11603d}
.rb-log li i{margin-left:auto;font-style:normal}
.rb-dial{width:160px;height:160px;display:block;margin:0 auto;cursor:pointer;touch-action:manipulation}
.rb-read{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}
.rb-read div{background:#f2f5f7;border-radius:10px;padding:5px 8px;font-size:11px;font-weight:800;color:#5b6b7a}
.rb-read b{display:block;font:800 17px ui-monospace,Consolas,monospace;color:#22303d}
.rb-in{display:flex;gap:6px;align-items:center;font-weight:800;font-size:13px;margin-top:6px}
.rb-in input{width:80px;font:800 16px ui-monospace,Consolas,monospace;padding:8px;border:2px solid #c9d2db;border-radius:10px;text-align:center}
.rb-in .rb-btn{width:auto;flex:1;margin:0}
.rb-plot{width:100%;height:auto;display:block;background:#f7f9fb;border-radius:8px;touch-action:manipulation}
.rb-plot.tap{cursor:crosshair;outline:2px dashed #21b6ce;outline-offset:2px}
.rb-knobs{display:flex;gap:10px;justify-content:space-around;margin:8px 0 2px;background:#2b3138;border-radius:12px;padding:10px 6px 8px;color:#dfe6ec}
.rb-knob{text-align:center;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;outline:none}
.rb-knob .kb{width:62px;height:62px;margin:0 auto 4px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#5d6873,#1d2228);border:3px solid #11161b;position:relative;cursor:ns-resize;touch-action:none;box-shadow:0 3px 8px rgba(0,0,0,.5)}
.rb-knob:focus-visible .kb{outline:3px solid #21b6ce}
.rb-knob .kb i{position:absolute;left:50%;top:5px;width:4px;height:18px;margin-left:-2px;background:#f2c63c;border-radius:2px;transform-origin:2px 26px}
.rb-knob b{display:block;font:800 18px ui-monospace,Consolas,monospace;color:#b9f3d0;letter-spacing:0}
.rb-ov{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:14px;background:rgba(20,30,45,.35)}
.rb-ov[hidden]{display:none}
.rb-card{max-width:520px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 50px rgba(20,30,45,.35);animation:rbUp .3s ease both}
@keyframes rbUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.rb-card h2{font:700 24px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.rb-card .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.rb-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.rb-card ul{list-style:none;margin:0 0 12px;padding:0}
.rb-card li{display:flex;gap:8px;align-items:flex-start;background:#f2f5f7;border-radius:10px;padding:8px 10px;margin:5px 0;font-size:13.5px;line-height:1.4}
.rb-card li span{background:#1e305e;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px;font-weight:800;flex:none}
.rb-card li.no{background:#f4f4f4;color:#5b6b7a}
.rb-course{background:#eef8fa;border-left:4px solid #21b6ce;border-radius:10px;padding:8px 10px;margin:8px 0;font-size:13px}
.rb-course .tag{display:block;font-size:11px;font-weight:800;color:#0b7a8e;text-transform:uppercase;letter-spacing:.08em}
.rb-course b{display:block;margin:2px 0}
.rb-memo{background:#fbf8ef;border:1px solid #e6dcc0;border-radius:10px;padding:8px 10px;font-size:13px;line-height:1.45;margin:8px 0}
.rb-memo b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7a6a14}
.rb-big{font-size:42px;text-align:center;margin:4px 0}
.rb-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#1e305e;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:none;min-height:40px}
@media (max-width:820px){
	.rb{overflow:hidden;--tb:calc(env(safe-area-inset-top) + 54px);--v3:max(34vh,200px)}
	.rb-grid{position:fixed;left:0;right:0;bottom:0;top:calc(var(--tb) + var(--v3) + 8px);display:flex;flex-direction:column;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 10px calc(14px + env(safe-area-inset-bottom))}
	.rb-top{position:fixed;left:0;right:0;top:0;height:var(--tb);box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 7px) 10px 7px;flex-wrap:nowrap;z-index:2;overflow:hidden}
	.rb-chip{padding:6px 9px;font-size:12px;white-space:nowrap}
	#rbClock{display:none}
	.rb-col{display:contents}
	.rb-view{position:fixed;left:10px;right:10px;top:var(--tb);height:var(--v3);min-height:0}
	#rbMis{order:2}#rbCtl{order:3}.p-cam{order:4}.p-f{order:5}.p-g{order:6}.p-term{order:7}
	.rb-cam{max-width:260px;margin:0 auto}
	.rb-hint{font-size:12px;padding:6px 10px;bottom:6px;max-width:86%}
}
`;

export function openRobot({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("rb-css")){ const st = document.createElement("style"); st.id = "rb-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	const root = document.createElement("div"); root.className = "rb"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Panne avant lundi");
	root.innerHTML = `<canvas class="rb-3d"></canvas>
		<div class="rb-grid">
			<div class="rb-top"><span class="rb-chip st" id="rbSt">Panne avant lundi</span><span class="rb-chip" id="rbClock">Ven. 15 h 00</span><span class="rb-chip rj" id="rbRej">Rebut 20 %</span><span class="rb-chip" id="rbErr">0 erreur</span><button class="rb-x" aria-label="Quitter le jeu">×</button></div>
			<div class="rb-col rb-colL">
				<div class="rb-pan" id="rbCtl"></div>
				<div class="rb-pan p-f"><h4>Capteur d'effort · pince</h4><span class="rb-fval" id="rbF">0 N</span><canvas class="rb-force" width="260" height="64"></canvas></div>
				<div class="rb-pan p-g"><h4>Articulations · consigne</h4><div class="rb-gauges">
					<div class="rb-g"><div class="ring" id="g1"><b>0</b></div>Base</div><div class="rb-g"><div class="ring" id="g2"><b>0</b></div>Épaule</div><div class="rb-g"><div class="ring" id="g3"><b>0</b></div>Coude</div></div></div>
			</div>
			<div class="rb-view"><span class="lbl">Cellule · vue 3D</span><span class="rb-hint" id="rbHint"></span></div>
			<div class="rb-col rb-colR">
				<div class="rb-pan p-cam"><h4>Caméra de la pince</h4><div class="rb-cam" id="rbCam"><span class="rec">● CAM 2</span><i class="cross"></i><b class="hue" id="rbHue"></b></div></div>
				<div class="rb-pan rb-mis" id="rbMis"></div>
				<div class="rb-pan p-term"><h4>Journal du contrôleur</h4><div class="rb-term" id="rbTerm"></div></div>
			</div>
		</div>
		<div class="rb-ov" id="rbOv"><div class="rb-card" id="rbCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const S = { step:"intro", errors:0, run:0, hold:false, min:15*60, rebut:20, notes:[], fix:{}, learned:new Set(), say:"" };
	let closed = false, gt = 0;
	const waits = [];
	const ABORT = { abort:true };

	/* ---------- scène ---------- */
	const canvas = $("canvas.rb-3d");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, stencil:true });   // 24 bits de profondeur sur iPhone
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.setClearColor("#e6eaee");
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#eef1f4");
	scene.add(new THREE.HemisphereLight("#ffffff", "#9aa5b1", 1.1));
	const sun = new THREE.DirectionalLight("#ffffff", 1.7); sun.position.set(4, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
	Object.assign(sun.shadow.camera, { left:-6, right:6, top:6, bottom:-6, near:1, far:30 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; scene.add(sun);
	const own = [];        // matériaux et géométries créés ici (ceux du kit sont partagés avec le campus : on ne les libère pas)
	const M = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color:c, roughness:.6, metalness:0, ...o }); own.push(m); return m; };
	const G = g => (own.push(g), g);
	const add = (geo, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; (parent || scene).add(m); return m; };
	const boxG = (w, h, d) => G(new THREE.BoxGeometry(w, h, d));
	const cylG = (a, b, h, s = 16) => G(new THREE.CylinderGeometry(a, b, h, s));
	add(G(new THREE.PlaneGeometry(30, 30)).rotateX(-Math.PI/2), M("#dfe4e9"), scene, 0, 0, 0, false);
	const grid = new THREE.GridHelper(30, 60, "#c4ccd4", "#d3d9df"); grid.position.y = .002; scene.add(grid);
	add(boxG(6.4, .02, .12), M("#f2c63c"), scene, -.4, .011, 3.0, false);            // marquage de sécurité au sol
	add(boxG(.12, .02, 5.2), M("#f2c63c"), scene, 2.8, .011, .4, false);

	/* ---------- le bras ---------- */
	const grey = M("#9aa3ad", { metalness:.5, roughness:.35 }), dark = M("#2b3138", { metalness:.3, roughness:.5 }), cyan = M("#21b6ce", { roughness:.45 }), white = M("#eef1f4", { roughness:.4 });
	add(cylG(.45, .55, .9, 24), grey, scene, 0, .45, 0);
	const base = new THREE.Group(); base.position.y = .9; scene.add(base);
	add(cylG(.42, .42, .3, 24), white, base, 0, .15, 0);
	const shoulder = new THREE.Group(); shoulder.position.y = SH - .9; base.add(shoulder);
	add(cylG(.24, .24, .5, 20).rotateX(Math.PI/2), dark, shoulder);
	add(boxG(L1, .26, .26), white, shoulder, L1/2, 0, 0); add(boxG(L1*.7, .06, .27), cyan, shoulder, L1/2, .1, 0, false);
	const elbow = new THREE.Group(); elbow.position.x = L1; shoulder.add(elbow);
	add(cylG(.19, .19, .42, 20).rotateX(Math.PI/2), dark, elbow);
	add(cylG(.13, .13, .44, 6).rotateX(Math.PI/2), M("#f2c63c"), elbow, 0, 0, 0, false);     // réducteur du coude (repère jaune)
	add(boxG(L2, .2, .2), white, elbow, L2/2, 0, 0); add(boxG(L2*.7, .05, .21), cyan, elbow, L2/2, .08, 0, false);
	const wrist = new THREE.Group(); wrist.position.x = L2; elbow.add(wrist);
	add(cylG(.13, .13, .32, 16).rotateX(Math.PI/2), dark, wrist);
	add(cylG(.08, .08, .16, 12), grey, wrist, 0, -.12, 0);
	add(boxG(.36, .07, .22), dark, wrist, 0, -.22, 0);
	const fingers = [-1, 1].map(s => add(boxG(.05, .26, .16), M("#f28a3c", { roughness:.5 }), wrist, s*.13, -.38, 0));
	const cam2 = new THREE.PerspectiveCamera(70, 4/3, .05, 40); cam2.position.set(0, -.27, .17); cam2.rotation.set(-Math.PI/2 + .22, 0, 0); wrist.add(cam2);

	/* ---------- postes ---------- */
	// palette de livraison (3 × 3 poches), bac de rebut, banc de mesure (comparateur + jauge d'effort), table de contrôle
	const PAL = { x:1.15, z:-1.4, y:.5 };
	add(boxG(1.1, .5, 1.1), M("#b98a55", { roughness:.8 }), scene, PAL.x, .25, PAL.z);
	const pockets = [];
	for(let i = 0; i < 9; i++){ const px = PAL.x + (i%3 - 1)*.34, pz = PAL.z + (Math.floor(i/3) - 1)*.34; pockets.push([px, pz]); add(boxG(.31, .012, .31), M("#5a4630"), scene, px, PAL.y + .006, pz, false); }
	const REJ = { x:-1.25, z:-1.35 };
	{
		const g = new THREE.Group(); g.position.set(REJ.x, 0, REJ.z); scene.add(g);
		const m = M("#c63b2c", { roughness:.55 });
		add(boxG(.9, .1, .9), m, g, 0, .05, 0);
		for(const [w, d, px, pz] of [[.9, .06, 0, .42], [.9, .06, 0, -.42], [.06, .9, .42, 0], [.06, .9, -.42, 0]]) add(boxG(w, .7, d), m, g, px, .35, pz);
		const t = document.createElement("canvas"); t.width = 128; t.height = 48; const x2 = t.getContext("2d"); x2.fillStyle = "#fff"; x2.font = "bold 30px Arial"; x2.textAlign = "center"; x2.fillText("REBUT", 64, 34);
		const tex = new THREE.CanvasTexture(t); own.push(tex);
		const tag = new THREE.Mesh(G(new THREE.PlaneGeometry(.7, .26)), new THREE.MeshBasicMaterial({ map:tex, transparent:true })); own.push(tag.material); tag.position.set(0, .45, .456); g.add(tag);
	}
	const BENCH = { x:1.75, z:.9 };
	add(boxG(.6, .55, 1.0), M("#cfd6dd"), scene, BENCH.x, .275, BENCH.z);
	const CMP = { x:BENCH.x, z:1.18, y:.82 };          // pointe du comparateur
	add(cylG(.03, .03, .5, 8), grey, scene, CMP.x + .2, .8, CMP.z);
	add(boxG(.2, .04, .04), grey, scene, CMP.x + .1, .95, CMP.z);
	const dial = add(cylG(.11, .11, .04, 24).rotateX(Math.PI/2), M("#f5f7f9"), scene, CMP.x + .2, 1.12, CMP.z + .05);
	const needle = add(boxG(.012, .09, .01), M("#d6213a"), scene, CMP.x + .2, 1.12, CMP.z + .075, false);
	needle.geometry.translate(0, .04, 0);
	add(cylG(.012, .012, .2, 6), grey, scene, CMP.x, CMP.y - .1 - .02, CMP.z);
	const JAUGE = { x:BENCH.x, z:.66 };
	add(boxG(.16, .2, .12), M("#1e305e"), scene, JAUGE.x, .65, JAUGE.z);
	add(boxG(.18, .03, .14), M("#f2c63c"), scene, JAUGE.x, .76, JAUGE.z, false);
	const TABLE = { x:-1.45, z:.32, y:.55 };
	add(boxG(1.7, .55, .8), M("#cfd6dd"), scene, TABLE.x, .275, TABLE.z);
	// lampe LED au-dessus de la cellule (posée mardi)
	const ledMat = M("#ffffff", { emissive:"#dfefff", emissiveIntensity:.9 });
	add(boxG(2.6, .06, .5), ledMat, scene, 0, 3.6, .3, false);
	for(const x of [-1.2, 1.2]) add(cylG(.01, .01, 1.4, 4), grey, scene, x, 4.3, .3, false);
	// tapis, butée, capteur
	const conv = new THREE.Group(); scene.add(conv);
	add(boxG(4.6, .12, .7), dark, conv, -1.4, BELT.y - .06, BELT.z);
	const beltTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#3c434b"; x.fillRect(0, 0, 64, 64); x.fillStyle = "#4b535c"; x.fillRect(0, 0, 8, 64); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(18, 1); own.push(t); return t; })();
	add(G(new THREE.PlaneGeometry(4.5, .62)).rotateX(-Math.PI/2), M("#ffffff", { map:beltTex, roughness:.8 }), conv, -1.4, BELT.y + .001, BELT.z, false);
	for(const x of [-3.4, -1.4, .6]) for(const z of [-.3, .3]) add(boxG(.08, BELT.y - .1, .08), grey, conv, x, (BELT.y - .1)/2, BELT.z + z);
	add(boxG(.06, .16, .7), M("#d6213a"), conv, BELT.stop + CUBE/2 + .03, BELT.y + .08, BELT.z);
	add(cylG(.05, .05, .5, 10), grey, conv, SENSOR_X, BELT.y + .25, BELT.z - .45);
	const ledS = M("#555", { emissive:"#000" });
	add(G(new THREE.SphereGeometry(.05, 10, 8)), ledS, conv, SENSOR_X, BELT.y + .52, BELT.z - .45, false);
	add(boxG(.02, .02, .7), M("#ffd23c", { emissive:"#ffb000", emissiveIntensity:.6 }), conv, SENSOR_X, BELT.y + .02, BELT.z, false);   // faisceau du capteur
	// Karim, technicien de maintenance
	const karim = makePerson(scene, false, "pro").g; karim.position.set(-3.1, 0, -.9); karim.rotation.y = 1.1; karim.scale.setScalar(.8);

	/* ---------- pièces ---------- */
	const parts = [];
	function makePart(color, x, y, z, extra = {}){
		const mesh = add(boxG(CUBE, CUBE, CUBE), M(color, { roughness:.45 }), scene, x, y + CUBE/2, z);
		const p = { mesh, held:false, vy:0, falling:false, onBelt:false, dx:0, rz:0, ...extra };
		parts.push(p); return p;
	}
	function dropPart(p){ scene.remove(p.mesh); const i = parts.indexOf(p); if(i >= 0) parts.splice(i, 1); }
	function clearParts(){ parts.slice().forEach(dropPart); held = null; }

	/* ---------- cinématique ---------- */
	const J = [30, 55, 95];          // consignes : base, épaule, coude (pliage) en degrés
	let osc = 0;                     // écart de l'épaule (oscillation de l'asservissement)
	let coudeReal = null;            // position réelle du coude quand on mesure le jeu (sinon = consigne)
	let gripOpen = true, grip = 1, held = null;
	const realJ = () => [J[0], J[1] + osc, coudeReal === null ? J[2] : coudeReal];
	function applyJoints(){
		const r = realJ();
		base.rotation.y = -r[0]*D2R; shoulder.rotation.z = r[1]*D2R; elbow.rotation.z = -r[2]*D2R;
		wrist.rotation.z = -(r[1] - r[2])*D2R;        // la pince reste verticale
	}
	function tip(j = realJ()){
		const a2 = j[1]*D2R, a3 = -j[2]*D2R;
		const r = L1*Math.cos(a2) + L2*Math.cos(a2 + a3), h = L1*Math.sin(a2) + L2*Math.sin(a2 + a3);
		return new THREE.Vector3(r*Math.cos(j[0]*D2R), SH + h - TOOL, r*Math.sin(j[0]*D2R));
	}
	function ik(p){
		const a1 = Math.atan2(p.z, p.x)*R2D, r = Math.hypot(p.x, p.z), yw = p.y + TOOL - SH;
		let D = Math.hypot(r, yw); D = Math.min(D, L1 + L2 - .001);
		const c3 = (D*D - L1*L1 - L2*L2)/(2*L1*L2), a3 = -Math.acos(clamp(c3, -1, 1));
		const a2 = Math.atan2(yw, r) - Math.atan2(L2*Math.sin(a3), L1 + L2*Math.cos(a3));
		return [a1, a2*R2D, -a3*R2D];
	}
	const V = (x, y, z) => new THREE.Vector3(x, y, z);

	/* ---------- horloge du jeu : tout se met en pause quand on lâche le bouton d'homme mort ---------- */
	function gwait(s){ return new Promise(r => waits.push({ t:gt + s, r })); }
	let motion = null;
	function moveJ(tj, dur){ return new Promise(res => { const from = J.slice(); let t = 0; motion = { res, step(d){ t += d; const k = Math.min(1, t/dur), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2; for(let i = 0; i < 3; i++) J[i] = from[i] + (tj[i] - from[i])*e; return k >= 1; } }; }); }
	function moveTo(target, speed = 120){
		const tj = ik(target);
		let d0 = tj[0] - J[0]; d0 = ((d0 + 540) % 360) - 180; tj[0] = J[0] + d0;
		return moveJ(tj, Math.max(.22, Math.max(...tj.map((v, i) => Math.abs(v - J[i])))/speed));
	}
	function resetRun(){
		S.run++;
		const m = motion; motion = null; if(m) m.res();
		waits.splice(0).forEach(w => w.r());
		osc = 0; coudeReal = null; S.hold = false; S.win = null; S.cmdPince = false;
	}
	const ck = tok => { if(closed || tok !== S.run) throw ABORT; };
	const safe = p => p.catch(e => { if(e !== ABORT) console.error(e); });

	/* ---------- asservissement de l'épaule : θ'' = P·(consigne − θ) − (D + 0,6)·θ' ---------- */
	const simCache = new Map();
	function servoSim(kp, kd){
		const key = kp + "/" + kd; if(simCache.has(key)) return simCache.get(key);
		const dt = 1/240, tr = []; let th = 0, v = 0;
		for(let i = 0; i < SERVO.T/dt; i++){ v += (kp*(SERVO.step - th) - (kd + .6)*v)*dt; th += v*dt; if(i % 4 === 0) tr.push(th); }
		const step = 4*dt, peak = Math.max(...tr), over = Math.max(0, peak - SERVO.step), tPeak = tr.indexOf(peak)*step;
		let settle = null;
		for(let i = tr.length - 1; i >= 0; i--) if(Math.abs(tr[i] - SERVO.step) > SERVO.tol){ settle = i + 1 < tr.length ? (i + 1)*step : null; break; }
		if(settle === null && Math.abs(tr[0] - SERVO.step) <= SERVO.tol) settle = 0;
		const r = { tr, step, over, settle, tPeak }; simCache.set(key, r); return r;
	}
	// levée de la pièce : l'épaule suit la réponse de son asservissement, base et coude suivent en douceur
	function lift(target, kp, kd, onPeak){
		const tj = ik(target), from = J.slice(), r = servoSim(kp, kd);
		let d0 = tj[0] - J[0]; d0 = ((d0 + 540) % 360) - 180; tj[0] = J[0] + d0;
		const dur = clamp((r.settle ?? 1.2) + .1, .55, 1.3), amp = tj[1] - from[1];
		let t = 0, fired = false;
		return new Promise(res => { motion = { res, step(d){
			t += d;
			const i = Math.min(r.tr.length - 1, Math.floor(t/r.step)), f = r.tr[i]/SERVO.step, k = Math.min(1, t/.45), e = k*k*(3 - 2*k);
			J[0] = from[0] + (tj[0] - from[0])*e; J[2] = from[2] + (tj[2] - from[2])*e;
			J[1] = from[1] + amp; osc = amp*(f - 1);
			if(!fired && t >= r.tPeak){ fired = true; onPeak && onPeak(r); }
			if(t >= dur){ osc = 0; return true; }
			return false;
		} }; });
	}

	/* ---------- interface ---------- */
	const ctl = $("#rbCtl"), mis = $("#rbMis"), term = $("#rbTerm");
	function log(t, cls = ""){ const d = document.createElement("div"); if(cls) d.className = cls; d.textContent = ">> " + t; term.appendChild(d); while(term.children.length > 40) term.firstChild.remove(); term.scrollTop = term.scrollHeight; }
	function err(t){ S.errors++; play("bad"); ev("err", t); $("#rbErr").textContent = `${S.errors} erreur${S.errors > 1 ? "s" : ""}`; if(t) log(t, "ko"); }
	function stage(t){ $("#rbSt").textContent = t; ev("stage", t); }
	function hint(t){ $("#rbHint").innerHTML = t || ""; }
	function addMin(m){ S.min += m; const h = Math.floor(S.min/60), mm = S.min % 60; $("#rbClock").textContent = `Ven. ${h} h ${String(mm).padStart(2, "0")}`; }
	function setRebut(v){ S.rebut = v; const c = $("#rbRej"); c.textContent = `Rebut ${fr(v, v < 10 && v % 1 ? 1 : 0)} %`; c.classList.toggle("good", v <= 5); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="rb-course"><span class="tag">📚 En ${formation.name} · ${y}</span><b>${n}</b>${t}</div>`; }
	function card(html){ $("#rbCard").innerHTML = html; $("#rbOv").hidden = false; }
	function uncard(){ $("#rbOv").hidden = true; }
	function say(t){ S.say = t; const el = $("#rbSay"); if(el) el.innerHTML = t ? `<b>Karim, technicien de maintenance</b>${t}` : ""; }
	function note(cls, t){ S.notes.push([cls, t]); renderNotes(); log(t.replace(/<[^>]+>/g, "")); }
	function renderNotes(){ const ul = $("#rbCarnet"); if(ul){ ul.innerHTML = S.notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join(""); ul.scrollTop = ul.scrollHeight; } }
	function dossier(kicker, title, html){
		mis.innerHTML = `<span class="k">${kicker}</span><b class="t">${title}</b>${html}<div class="rb-say" id="rbSay"></div><h4 style="margin:10px 0 0">Carnet de diagnostic</h4><ul class="rb-carnet" id="rbCarnet"></ul>`;
		say(""); renderNotes();
	}
	function camText(t, ko){ const h = $("#rbHue"); h.textContent = t || ""; h.classList.toggle("ko", !!ko); }
	function setGauges(){
		[[1, J[0], 360], [2, J[1], 180], [3, J[2], 180]].forEach(([i, v, max]) => { const el = $("#g" + i); el.style.setProperty("--a", `${Math.abs(v)/max*360}deg`); el.firstElementChild.textContent = Math.round(v); });
	}
	function setStep(key, label){ S.step = key; stage(label); uncard(); hint(""); camText(""); controls.enabled = true; }
	const cvs = (id, w, h) => `<canvas class="rb-plot" id="${id}" width="${w}" height="${h}"></canvas>`;
	// position d'un toucher dans un canvas, en pixels du canvas
	const cpos = (c, e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*c.width, (e.clientY - r.top)/r.height*c.height]; };

	/* ---------- capteur d'effort de la pince ---------- */
	const fc = $("canvas.rb-force"), fx = fc.getContext("2d"), force = new Array(130).fill(0);
	let fNow = 0, fTarget = 0;
	function drawForce(){
		fx.clearRect(0, 0, 260, 64);
		fx.strokeStyle = "#e3e8ed"; fx.lineWidth = 1;
		for(const n of [20, 40, 60]){ const y = 62 - n*.9; fx.beginPath(); fx.moveTo(0, y); fx.lineTo(260, y); fx.stroke(); }
		fx.setLineDash([4, 4]); fx.strokeStyle = "#d6213a"; const ys = 62 - GRIP_SPEC*.9; fx.beginPath(); fx.moveTo(0, ys); fx.lineTo(260, ys); fx.stroke(); fx.setLineDash([]);
		fx.fillStyle = "#d6213a"; fx.font = "800 10px Nunito, sans-serif"; fx.fillText(`exigé ${GRIP_SPEC} N`, 4, ys - 3);
		fx.beginPath(); force.forEach((f, i) => i ? fx.lineTo(i*2, 62 - f*.9) : fx.moveTo(0, 62 - f*.9)); fx.strokeStyle = "#0b7a8e"; fx.lineWidth = 2; fx.stroke();
		$("#rbF").textContent = `${Math.round(fNow)} N`;
	}

	/* ---------- pince ---------- */
	function grab(p, dx){
		gripOpen = false; held = p; p.held = true; p.onBelt = false; p.dx = dx; p.rz = dx ? -.5 : 0; fTarget = GRIP_N;
		play(dx ? "bad" : "pop");
	}
	function release(p, fall = true){
		gripOpen = true; fTarget = 0; if(held === p) held = null;
		p.held = false; p.mesh.rotation.z = p.rz;
		if(fall){ p.falling = true; p.vy = 0; }
	}
	function landing(x, z){
		if(Math.abs(x - REJ.x) < .38 && Math.abs(z - REJ.z) < .38) return .1;
		if(Math.abs(x - PAL.x) < .55 && Math.abs(z - PAL.z) < .55) return PAL.y;
		if(x > -3.7 && x < .9 && Math.abs(z - BELT.z) < .35) return BELT.y;
		return 0;
	}
	let pocketI = 0;
	function nextPocket(){
		if(pocketI >= 9){ pocketI = 0; parts.filter(p => p.placed).forEach(dropPart); log("Palette pleine : évacuée", "inf"); }
		return pockets[pocketI++];
	}

	/* ---------- un cycle de la cellule ----------
	   o : tempo (s entre capteur et fermeture), kp/kd (épaule), off (mm de décalage à la dépose), lum/seuil (caméra),
	       def (vraie pièce défectueuse), drop (la pièce s'échappe si ça dépasse trop), inhibit (sorties inhibées : on ne saisit pas),
	       mark(nom) appelé aux instants clés, pace (cadence réelle : cycle = 3,85 s + tempo) */
	async function cycle(tok, o){
		o = { tempo:.75, kp:40, kd:10, off:0, lum:65, seuil:OLD_TH, ...o };
		const mark = n => o.mark && o.mark(n);
		const p = makePart(o.def ? COL_DEF : COL, SENSOR_X - CUBE/2 - .35, BELT.y, BELT.z, { onBelt:true });
		if(tip().distanceTo(V(BELT.stop, PICK_Y, BELT.z)) > .05){ await moveTo(V(BELT.stop, UP_Y, BELT.z), 260); ck(tok); await moveTo(V(BELT.stop, PICK_Y, BELT.z), 200); ck(tok); }
		while(p.mesh.position.x + CUBE/2 < SENSOR_X){ await gwait(.02); ck(tok); }
		const ts = gt; mark("capteur");
		if(o.inhibit){
			await gwait(o.tempo); ck(tok); S.cmdPince = true; mark("pince");
			await gwait(1.3 - o.tempo); ck(tok); S.cmdPince = false; dropPart(p); return { ok:true };
		}
		await gwait(o.tempo); ck(tok);
		const early = p.mesh.position.x < BELT.stop - .015;
		grab(p, early ? Math.max(.06, BELT.stop - p.mesh.position.x) : 0); S.cmdPince = true;
		mark(early ? "early" : "pince");
		await gwait(.08); ck(tok);
		let dropped = false;
		await lift(V(BELT.stop, UP_Y, BELT.z), o.kp, o.kd, r => { if(o.drop && r.over > 4 && held === p){ dropped = true; p.dx = 0; release(p); S.cmdPince = false; mark("over"); } }); ck(tok);
		if(dropped){ await gwait(.8); ck(tok); setTimeout(() => dropPart(p), 1500); return { ok:false, cause:"servo", ts }; }
		await gwait(.12); ck(tok);
		const rej = o.lum > o.seuil;
		camText(`Luminosité ${o.lum} % · seuil ${o.seuil} % → ${rej ? "DÉFAUT" : "conforme"}`, rej); mark("vision");
		await gwait(o.pace ? .25 : .35); ck(tok); camText("");
		let res;
		if(rej){
			await moveTo(V(REJ.x, 1.4, REJ.z), 300); ck(tok);
			release(p); S.cmdPince = false; await gwait(.2); ck(tok);
			setTimeout(() => dropPart(p), 2500);
			res = { ok:false, cause:o.def ? "defaut" : "vision", ts };
		} else {
			const [px, pz] = nextPocket(), dxv = o.off*.008;
			await moveTo(V(px + dxv, 1.05, pz), 300); ck(tok);
			await moveTo(V(px + dxv, PAL.y + CUBE/2 + .02, pz), 240); ck(tok);
			const bad = early || Math.abs(o.off) > 3;
			release(p, false); S.cmdPince = false; p.placed = true;
			p.mesh.position.set(px + dxv + (early ? .05 : 0), PAL.y + CUBE/2 + (bad ? .05 : 0), pz);
			p.mesh.rotation.set(0, 0, bad ? (early ? -.45 : .3) : 0);
			mark("depose");
			await gwait(.1); ck(tok);
			await moveTo(V(px + dxv, 1.05, pz), 300); ck(tok);
			res = { ok:!bad, cause:early ? "capteur" : bad ? "coude" : null, ts };
		}
		await moveTo(V(BELT.stop, UP_Y, BELT.z), 300); ck(tok);
		if(o.pace){ const left = ts + o.tempo + BASE_CYCLE - .47 - gt; if(left > 0){ await gwait(left); ck(tok); } }
		return res;
	}

	/* ===================== INTRO ===================== */
	const MEMO = `<div class="rb-memo"><b>📒 Cahier de maintenance de la cellule</b>
		Mardi : néons de la cellule remplacés par une rampe LED.<br>
		Mercredi : tapis démonté pour nettoyage, capteur remonté.<br>
		Jeudi : épaule réglée « plus nerveuse » pour gagner en cadence (gain 20 → ${SERVO.kp0}, amortissement 6 → ${SERVO.kd0}).<br>
		Coude : aucune intervention depuis 3 ans.</div>`;
	/* ===================== 1 · OBSERVER : rejouer les cycles rejetés ===================== */
	const OBS_TXT = {
		coude:   () => `<b>Cycle 212 · dépose</b> : la pièce arrive <b>9 mm</b> à côté de sa poche et bascule. Pourtant la consigne du coude est la bonne.`,
		capteur: () => `<b>Cycle 217 · saisie</b> : la pince se ferme alors que la pièce <b>roule encore</b>. Elle est prise de travers.`,
		servo:   () => `<b>Cycle 223 · levée</b> : l'épaule dépasse sa consigne de <b>${fr(servoSim(SERVO.kp0, SERVO.kd0).over)}°</b> et oscille ; la pièce s'échappe.`,
		vision:  () => `<b>Cycle 231 · caméra</b> : luminosité 74 % > seuil ${OLD_TH} % → « défaut ». Contrôlée à la main, la pièce est <b>bonne</b>.`
	};
	const WIN_MARK = { coude:"depose", capteur:"early", servo:"over", vision:"vision" };
	function stepObs(){
		resetRun(); setStep("obs", "1 · Observer"); clearParts();
		S.obs = { i:0, found:new Set(), useless:0 };
		J.splice(0, 3, ...ik(V(BELT.stop, UP_Y, BELT.z)));
		const hot = !S.obsDone;
		dossier(hot ? `Panne avant lundi · ${formation.name}` : "Étape 1 · observer", "Où et quand le bras rate-t-il ?", `
			${hot ? `<p>Vendredi, 15 h. La cellule rejette <b>une pièce sur cinq</b>, et le client attend <b>${ORDER.toLocaleString("fr-FR")} pièces lundi 8 h</b>. Trouve pourquoi.</p>` : ""}
			<p>Le contrôleur a gardé les <b>4 derniers cycles rejetés</b>. Rejoue-les au ralenti : le bras n'avance que tant que tu <b>maintiens le bouton d'homme mort</b>, comme en mode manuel.</p>
			<p>Dès que quelque chose cloche, <b>lâche</b> : tout se fige. Puis <b>relève</b> l'instant.</p>`);
		say("Moi je te le dis : c'est la pince. Elle est usée, les pièces glissent. On en commande une neuve et c'est réglé.");
		ctl.innerHTML = `<h4>Boîte noire · cycles rejetés</h4><ul class="rb-log" id="obsLog"></ul>
			<button class="rb-hold" id="obsHold">▶ Maintenir pour avancer</button>
			<button class="rb-btn dark" id="obsRel" disabled>📍 Relever cet instant</button>
			<p class="rb-small">Clavier : maintiens Espace pour avancer, Entrée pour relever.</p>`;
		const hb = $("#obsHold");
		const on = e => { e.preventDefault(); S.hold = true; hb.classList.add("on"); $("#obsRel").disabled = true; };
		const off = () => { if(!S.hold) return; S.hold = false; hb.classList.remove("on"); $("#obsRel").disabled = !S.obs.running; };
		hb.addEventListener("pointerdown", on); ["pointerup", "pointerleave", "pointercancel"].forEach(n => hb.addEventListener(n, off));
		$("#obsRel").addEventListener("click", obsRelever);
		S.obs.off = off;
		renderObsLog(); obsCycle();
		hint("Maintiens le bouton jaune : le bras rejoue le cycle tant que tu appuies");
		log("Boîte noire : 4 cycles rejetés depuis mardi", "inf");
	}
	function renderObsLog(){
		const ul = $("#obsLog"); if(!ul) return;
		ul.innerHTML = LOG.map((c, i) => `<li class="${S.obs.found.has(c.k) ? "done" : i === S.obs.i ? "cur" : ""}">Cycle ${c.cyc} · ${c.when}<i>${S.obs.found.has(c.k) ? "✓ relevé" : i === S.obs.i ? "▶" : ""}</i></li>`).join("");
	}
	async function obsCycle(){
		const tok = S.run, c = LOG[S.obs.i];
		S.obs.running = true; S.win = null; S.obs.useless = 0; S.obs.t0 = gt;
		log(`Rejeu du cycle ${c.cyc} (${c.when})`, "inf");
		try {
			await cycle(tok, { ...c.o, mark:n => { if(n === WIN_MARK[c.k]) S.win = { k:c.k, until:gt + 1.6 }; } });
			ck(tok);
			await gwait(.6); ck(tok);
			S.obs.running = false; $("#obsRel").disabled = true;
			if(!S.obs.found.has(c.k)){ log("Cycle terminé sans relevé de la panne : on le rejoue", "inf"); hint("Le cycle a raté sans que tu le relèves : regarde bien, on le rejoue"); clearParts(); obsCycle(); }
		} catch(e){ if(e !== ABORT) console.error(e); }
	}
	function obsRelever(){
		if(S.step !== "obs" || S.hold || !S.obs.running) return;
		const c = LOG[S.obs.i];
		if(S.win && S.win.k === c.k && gt <= S.win.until){
			play("good"); S.obs.found.add(c.k); addMin(4);
			note("obs", "🔎 " + OBS_TXT[c.k]());
			if(c.k === "capteur") say("Tu vois ? Prise de travers : la pince est usée !");
			if(c.k === "servo") say("Ah, ça, c'est depuis jeudi. Le stagiaire d'avant a rendu l'épaule plus nerveuse.");
			if(c.k === "vision") say("Je l'ai regardée, celle-là : elle est parfaite. La caméra a des visions !");
			const tok = ++S.run; S.hold = false; S.win = null; $("#obsHold").classList.remove("on"); $("#obsRel").disabled = true;
			const m = motion; motion = null; m && m.res(); waits.splice(0).forEach(w => w.r());
			osc = 0; camText("");
			setTimeout(() => {
				if(closed || tok !== S.run) return;
				clearParts(); gripOpen = true; fTarget = 0;
				S.obs.i++; renderObsLog();
				if(S.obs.i < LOG.length){ hint("Cycle suivant : maintiens le bouton pour le rejouer"); obsCycle(); }
				else obsDone();
			}, 900);
		} else {
			S.obs.useless++; addMin(1);
			const r = realJ();
			log(`Relevé t = ${fr(gt - S.obs.t0, 2)} s : épaule ${fr(r[1])}°, coude ${fr(r[2])}°, consigne et mesure concordent. Rien d'anormal ici.`, "inf");
			hint("Rien d'anormal à cet instant : continue, et lâche dès que ça rate");
			if(S.obs.useless === 3) err("Trois relevés pour rien sur ce cycle : observe avant de relever");
		}
	}
	function obsDone(again){
		S.obs.running = false; hint(""); if(!again) play("win");
		const hot = !S.obsDone; S.obsDone = true;
		// fin de la scène d'ouverture : le palier, puis la carte de synthèse de l'étape 1
		if(hot) return palier({ id:"robot", onEvent:ev, openLead, quit:close,
			titre:"Quatre pannes trouvées, et ce n'est pas la pince.",
			texte:"Il reste à prouver chaque cause par une mesure (le jeu du coude, le capteur, l'asservissement de l'épaule, la caméra), à réparer, puis à relancer la production avant lundi.",
			suite:"Réparer la cellule (≈ 6 min)" }).then(() => { if(!closed) obsDone(true); });
		card(`<div class="k">Étape 1 · observation</div><h2>Quatre pannes, quatre endroits</h2>
			<p>Un rebut sur cinq, mais pas toujours au même moment : <b>à la saisie, à la levée, au contrôle caméra, à la dépose</b>. Quatre causes possibles, à prouver une par une.</p>
			<p>Relis le cahier de maintenance : chaque intervention de la semaine pointe vers un symptôme… sauf le coude, que personne n'a touché.</p>
			${MEMO}
			<button class="rb-btn dark" data-a="jeu">Commencer par le coude : la dépose décalée →</button>`);
	}

	/* ===================== 2 · LE JEU DU COUDE (comparateur) ===================== */
	function stepJeu(){
		resetRun(); setStep("jeu", "2 · Le coude"); clearParts(); gripOpen = true; fTarget = 0;
		const ref = ik(V(CMP.x, CMP.y + .02, CMP.z));
		S.jeu = { ref:ref[2], rel:[], dir:-1, done:false };
		J.splice(0, 3, ref[0], ref[1], ref[2] - .6);
		coudeReal = J[2] + BACKLASH/2;                 // le dernier mouvement était vers le haut
		controls.enabled = false;
		dossier("Étape 2 · mécanique", "Le coude a-t-il du jeu ?", `
			<p>Le comparateur touche la pince. Il lit la <b>position réelle</b>, au centième de millimètre ; le cadran du coude donne la <b>consigne</b> du moteur.</p>
			<p><b>Pilote le coude à la main</b> : glisse doucement vers le bas ou le haut sur la vue 3D (ou flèches du clavier). Amène l'aiguille à <b>0</b> en descendant et relève la consigne, puis passe un peu dessous et reviens à 0 <b>en remontant</b>, et relève encore.</p>`);
		say("Le coude ? Personne n'y a touché, il tourne très bien.");
		ctl.innerHTML = `<h4>Comparateur · touche le cadran pour relever</h4>
			<canvas class="rb-dial" id="jeuDial" width="320" height="320" tabindex="0" aria-label="Comparateur : relever la mesure"></canvas>
			<div class="rb-read"><div>Consigne coude<b id="jeuC">0</b></div><div>Pince (réel)<b id="jeuM">0</b></div></div>
			<ul class="rb-log" id="jeuRel"></ul>
			<div id="jeuFix"></div>
			<p class="rb-small">Au bout de l'avant-bras (1,3 m), 1° au coude ≈ ${fr(MM_PER_DEG)} mm.</p>`;
		$("#jeuDial").addEventListener("click", jeuRelever);
		$("#jeuDial").addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); jeuRelever(); } });
		hint("Glisse doucement vers le bas sur la vue 3D pour descendre la pince");
		log("Banc de mesure : comparateur sous la pince", "inf");
		drawDial();
	}
	const jeuMM = () => (coudeReal - S.jeu.ref)*MM_PER_DEG;
	function jog(d){
		if(S.step !== "jeu" || S.jeu.done || S.jeu.testing) return;
		J[2] = clamp(J[2] + d, S.jeu.ref - 1.2, S.jeu.ref + 1.2);
		if(d > 0) S.jeu.dir = 1; else if(d < 0) S.jeu.dir = -1;
		coudeReal = clamp(coudeReal, J[2] - BACKLASH/2, J[2] + BACKLASH/2);        // zone morte du réducteur
		drawDial();
	}
	function drawDial(){
		const c = $("#jeuDial"); if(!c) return;
		const x = c.getContext("2d"), mm = jeuMM(), W = 320;
		x.clearRect(0, 0, W, W);
		x.fillStyle = "#f5f7f9"; x.strokeStyle = "#1e305e"; x.lineWidth = 10; x.beginPath(); x.arc(160, 160, 148, 0, 7); x.fill(); x.stroke();
		x.fillStyle = "rgba(59,209,111,.25)"; x.beginPath(); x.moveTo(160, 160); x.arc(160, 160, 132, -Math.PI/2 - .14, -Math.PI/2 + .14); x.fill();
		x.strokeStyle = "#22303d"; x.fillStyle = "#22303d"; x.font = "800 20px Nunito, sans-serif"; x.textAlign = "center";
		for(let v = -10; v <= 10; v++){
			const a = -Math.PI/2 + v*.14, big = v % 5 === 0;
			x.lineWidth = big ? 4 : 2; x.beginPath(); x.moveTo(160 + Math.cos(a)*(big ? 108 : 120), 160 + Math.sin(a)*(big ? 108 : 120)); x.lineTo(160 + Math.cos(a)*134, 160 + Math.sin(a)*134); x.stroke();
			if(big) x.fillText(String(v).replace("-", "−"), 160 + Math.cos(a)*88, 167 + Math.sin(a)*88);
		}
		const out = Math.abs(mm) > 10.5, a = -Math.PI/2 + clamp(mm, -10.8, 10.8)*.14;
		x.strokeStyle = "#d6213a"; x.lineWidth = 6; x.lineCap = "round"; x.beginPath(); x.moveTo(160, 160); x.lineTo(160 + Math.cos(a)*125, 160 + Math.sin(a)*125); x.stroke(); x.lineCap = "butt";
		x.fillStyle = "#1e305e"; x.beginPath(); x.arc(160, 160, 12, 0, 7); x.fill();
		x.font = "800 22px ui-monospace, Consolas, monospace"; x.fillText(out ? "hors course" : `${mm >= 0 ? "+" : ""}${fr(mm, 1)} mm`, 160, 230);
		x.font = "800 15px Nunito, sans-serif"; x.fillStyle = "#5b6b7a"; x.fillText("mm", 160, 120);
		$("#jeuC").textContent = fr(J[2], 2) + "°";
		$("#jeuM").textContent = (mm >= 0 ? "+" : "") + fr(mm, 1) + " mm";
		needle.rotation.z = -clamp(mm, -10.8, 10.8)*.14;
	}
	function jeuRelever(){
		const s = S.jeu; if(S.step !== "jeu" || s.done || s.rel.length >= 2 || s.testing) return;
		const mm = jeuMM();
		if(Math.abs(mm) > 1){ addMin(1); hint(`L'aiguille est à ${fr(mm, 1)} mm : amène-la à 0 (±1 mm) avant de relever`); play("bad"); return; }
		if(s.rel.length === 1 && s.rel[0].dir === s.dir){ err("Deux relevés dans le même sens : il faut arriver à 0 une fois en descendant, une fois en remontant"); return; }
		s.rel.push({ c:J[2], dir:s.dir }); play("pop"); addMin(3);
		$("#jeuRel").innerHTML = s.rel.map(r => `<li>${r.dir > 0 ? "⬇ en descendant" : "⬆ en remontant"}<i>consigne ${fr(r.c, 2)}°</i></li>`).join("");
		log(`Relevé : aiguille à 0 ${s.dir > 0 ? "en descendant" : "en remontant"}, consigne coude ${fr(J[2], 2)}°`);
		if(s.rel.length === 1){ hint(s.dir > 0 ? "Maintenant, passe un peu sous 0, puis reviens à 0 en remontant" : "Maintenant, passe un peu au-dessus, puis reviens à 0 en descendant"); return; }
		const d = Math.abs(s.rel[0].c - s.rel[1].c); s.meas = d;
		note("", `📏 Même position réelle, deux consignes : ${fr(s.rel[0].c, 2)}° et ${fr(s.rel[1].c, 2)}°. Le coude a <b>${fr(d, 2)}° de jeu</b>, soit ${fr(d*MM_PER_DEG)} mm au bout du bras.`);
		hint("");
		$("#jeuFix").innerHTML = `<p class="rb-small"><b>Correction en attendant le réducteur neuf :</b> le contrôleur peut ajouter le jeu à la consigne quand le coude change de sens. Quelle compensation saisir ?</p>
			<label class="rb-in">Jeu à compenser <input id="jeuIn" inputmode="decimal" placeholder="0,00" aria-label="Compensation de jeu en degrés"> ° <button class="rb-btn" id="jeuGo">Appliquer et tester</button></label>`;
		$("#jeuGo").addEventListener("click", jeuApply);
		$("#jeuIn").addEventListener("keydown", e => { if(e.key === "Enter") jeuApply(); });
	}
	async function jeuApply(){
		const s = S.jeu; if(s.done || s.testing) return;
		const v = parseFloat(($("#jeuIn").value || "").replace(",", "."));
		if(!isFinite(v) || v < 0 || v > 3){ hint("Saisis un angle en degrés, par exemple 0,25"); return; }
		s.testing = true; $("#jeuGo").disabled = true; addMin(5);
		const resid = Math.abs(BACKLASH - v)*MM_PER_DEG, tok = S.run;
		log(`Compensation ${fr(v, 2)}° : essai aller-retour`, "inf");
		// essai : on arrive au point de dépose en descendant puis en remontant, la pince réelle doit tomber au même endroit
		try {
			for(const dir of [1, -1]){
				const target = s.ref + dir*.5;
				await moveJ([J[0], J[1], target], .5); ck(tok);
				coudeReal = J[2] - dir*(BACKLASH - v)/2; drawDial();
				await moveJ([J[0], J[1], s.ref], .6); ck(tok);
				coudeReal = s.ref - dir*(BACKLASH - v)/2; drawDial();
				await gwait(.5); ck(tok);
			}
		} catch(e){ if(e !== ABORT) console.error(e); return; }
		s.testing = false; $("#jeuGo").disabled = false;
		if(resid > 1.5){
			err(`Avec ${fr(v, 2)}°, il reste ${fr(resid)} mm d'écart entre les deux sens : reprends la valeur que tu as mesurée`);
			coudeReal = J[2] + BACKLASH/2; drawDial();
			return;
		}
		s.done = true; S.fix.comp = v; S.fix.compRes = resid; S.fix.jeu = s.meas ?? BACKLASH;
		play("win"); setRebut(S.rebut - 6); addMin(5);
		note("ok", `✅ Compensation de ${fr(v, 2)}° : l'écart entre les deux sens tombe à ${fr(resid)} mm. Réducteur à changer à la prochaine maintenance.`);
		say("0,4°, ça ne se voit pas à l'œil… et pourtant 9 mm au bout du bras. D'accord, je commande un réducteur.");
		setTimeout(() => card(`<div class="k">Étape 2 réussie · cause n° 1 prouvée</div><h2>Le coude a du jeu</h2>
			<p>Pour la même position réelle, la consigne change de <b>${fr(S.fix.jeu, 2)}°</b> selon le sens d'arrivée : c'est le jeu entre les dents du réducteur, usé après 3 ans. Au bout de 1,3 m de bras, ça fait les <b>9 mm</b> du cycle 212, mais seulement quand le coude change de sens : d'où un rebut de temps en temps.</p>
			${course("meca")}
			<button class="rb-btn dark" data-a="capt">Étape 3 · la saisie de travers →</button>`), 600);
	}

	/* ===================== 3 · FAUSSE PISTE (pince) PUIS CAPTEUR (chronogramme) ===================== */
	function stepCapteur(){
		resetRun(); setStep("capt", "3 · La saisie"); clearParts(); gripOpen = true; fTarget = 0;
		S.capt = { phase:"force", hold:0, cur:[], tempo:.25, rec:null };
		dossier("Étape 3 · systèmes industriels", "Pourquoi la pièce est-elle prise de travers ?", `
			<p>Karim accuse la pince. Avant de commander une pièce à 1 900 €, <b>mesure</b> : la pince serre sur la jauge d'effort, le constructeur exige <b>${GRIP_SPEC} N</b> au moins.</p>`);
		say("La pince neuve, c'est 1 900 € et trois jours de livraison. Mais au moins on sera tranquilles.");
		ctl.innerHTML = `<h4>Jauge d'effort</h4>
			<p class="rb-small">Le bras est posé sur la jauge. Maintiens pour fermer la pince, et garde-la fermée jusqu'à ce que l'effort se stabilise.</p>
			<button class="rb-hold" id="capHold">✊ Maintenir pour serrer</button>`;
		const tj = ik(V(JAUGE.x, .8, JAUGE.z));
		J.splice(0, 3, ...tj);
		const hb = $("#capHold");
		hb.addEventListener("pointerdown", e => { e.preventDefault(); if(S.capt.phase !== "force") return; S.hold = true; hb.classList.add("on"); gripOpen = false; fTarget = GRIP_N; });
		const off = () => { if(!S.hold) return; S.hold = false; hb.classList.remove("on"); gripOpen = true; fTarget = 0; if(S.capt.phase === "force" && S.capt.hold < 1.2) hint("Trop court : l'effort n'était pas encore stable. Garde la pince fermée plus longtemps."); S.capt.hold = 0; };
		["pointerup", "pointerleave", "pointercancel"].forEach(n => hb.addEventListener(n, off));
		S.capt.off = off;
		hint("Maintiens le bouton : la pince serre la jauge");
	}
	function captForceDone(){
		const s = S.capt; s.phase = "chrono"; S.hold = false; gripOpen = true; fTarget = 0; addMin(5); play("good");
		note("no", `❌ Fausse piste : la pince serre à <b>${GRIP_N} N</b>, le constructeur en exige ${GRIP_SPEC}. Elle n'est pas usée : pas de commande.`);
		say("52 newtons… Bon. J'annule la commande. Mais alors pourquoi elle prend les pièces de travers ?");
		$("#rbMis").querySelector("p").innerHTML = `La pince est hors de cause. Reste le <b>moment</b> où elle se ferme. Le capteur a été remonté mercredi : lance un cycle <b>sorties inhibées</b> (le programme tourne, la pince ne bouge pas) et lis le chronogramme.`;
		ctl.innerHTML = `<h4>Chronogramme · entrées et sorties</h4>${cvs("capPlot", 520, 300)}
			<p class="rb-small" id="capTxt">Lance un cycle pour enregistrer les signaux.</p>
			<button class="rb-btn" id="capRun">▶ Cycle sorties inhibées</button>`;
		$("#capRun").addEventListener("click", captRec);
		$("#capPlot").addEventListener("click", captTap);
		hint(""); drawChrono();
		safe((async () => { const tok = S.run; await moveTo(V(BELT.stop, UP_Y, BELT.z), 200); ck(tok); })());
	}
	async function captRec(){
		const s = S.capt; if(s.busy) return;
		s.busy = true; $("#capRun").disabled = true; s.rec = []; s.cur = []; addMin(3);
		const tok = S.run;
		try { await cycle(tok, { tempo:s.tempo, inhibit:true, kp:20, kd:6 }); ck(tok); } catch(e){ if(e !== ABORT) console.error(e); return; }
		s.busy = false; s.rec = chronoModel(s.tempo, true);
		s.phase = "mes"; $("#capRun").hidden = true;
		$("#capPlot").classList.add("tap");
		$("#capTxt").innerHTML = `Mesure le retard : <b>touche le front montant du capteur</b>, puis <b>celui de la butée</b>.`;
		hint("Touche les fronts sur le chronogramme pour poser les curseurs");
		drawChrono();
	}
	// signaux d'un cycle, à partir du front montant du capteur (le modèle de la ligne, au centième de seconde)
	function chronoModel(tempo, inhibit){
		const rec = [], early = !inhibit && tempo < ARRIVE - .02;
		for(let t = CH0.tmin; t <= CH0.tmax + 1e-9; t += .01){
			const c = t >= 0 && t < CUBE/VBELT;
			const b = !early && t >= ARRIVE && (inhibit || t < Math.max(tempo, ARRIVE) + .25);
			const p = t >= tempo && t < 1.3;
			rec.push({ t, c, b, p });
		}
		return rec;
	}
	const LANES = [["c", "Capteur (entrée)"], ["b", "Pièce en butée (entrée)"], ["p", "Fermer la pince (sortie)"]];
	const CH0 = { x0:22, x1:505, tmin:-.2, tmax:1.4, lane:(i) => 30 + i*88 };
	const tX = t => CH0.x0 + (CH0.x1 - CH0.x0)*(t - CH0.tmin)/(CH0.tmax - CH0.tmin);
	const Xt = x => CH0.tmin + (x - CH0.x0)/(CH0.x1 - CH0.x0)*(CH0.tmax - CH0.tmin);
	function edges(rec){ const e = []; for(const [k] of LANES){ let prev = false; for(const r of rec){ if(r[k] && !prev) e.push({ k, t:r.t }); prev = r[k]; } } return e; }
	function drawChrono(){
		const c = $("#capPlot"); if(!c) return;
		const x = c.getContext("2d"), s = S.capt;
		x.clearRect(0, 0, 520, 300);
		x.textAlign = "left";
		LANES.forEach(([k, n], i) => {
			const y = CH0.lane(i), col = ["#0b7a8e", "#1e305e", "#c9631f"][i];
			x.fillStyle = col; x.font = "800 21px Nunito, sans-serif"; x.fillText(n, CH0.x0, y + 4);
			x.strokeStyle = "#e3e8ed"; x.lineWidth = 1; x.beginPath(); x.moveTo(CH0.x0, y + 58); x.lineTo(CH0.x1, y + 58); x.stroke();
			if(!s.rec || !s.rec.length) return;
			x.strokeStyle = col; x.lineWidth = 4; x.beginPath();
			s.rec.forEach((r, j) => { const px = tX(r.t), py = y + (r[k] ? 18 : 58); j ? x.lineTo(px, py) : x.moveTo(px, py); });
			x.stroke();
		});
		x.fillStyle = "#8a95a1"; x.font = "700 18px Nunito, sans-serif"; x.textAlign = "center";
		for(let t = 0; t <= 1.21; t += .4) x.fillText(fr(t, 1) + " s", tX(t), 296);
		x.font = "800 19px Nunito, sans-serif";
		s.cur.forEach((cu, i) => { x.strokeStyle = "#d6213a"; x.lineWidth = 2; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(tX(cu.t), 30); x.lineTo(tX(cu.t), 278); x.stroke(); x.setLineDash([]); x.fillStyle = "#d6213a"; x.fillText(`t${i + 1}`, tX(cu.t) + 14, 282); });
		if(s.cur.length === 2){ const a = tX(s.cur[0].t), b = tX(s.cur[1].t); const lbl = `Δt = ${fr(Math.abs(s.cur[1].t - s.cur[0].t), 2)} s`, w = x.measureText(lbl).width + 14; x.fillStyle = "rgba(255,255,255,.92)"; x.fillRect((a + b)/2 - w/2, 92, w, 26); x.fillStyle = "#d6213a"; x.fillText(lbl, (a + b)/2, 112); }
		if(s.newT !== undefined){ x.fillStyle = "rgba(59,209,111,.85)"; x.fillRect(tX(s.newT) - 3, CH0.lane(2) + 12, 6, 50); }
	}
	function captTap(e){
		const s = S.capt, c = $("#capPlot");
		if(s.phase !== "mes" && s.phase !== "fix") return;
		const [px, py] = cpos(c, e), t = Xt(px), lane = clamp(Math.floor((py - 12)/88), 0, 2);
		if(s.phase === "mes"){
			const es = edges(s.rec).filter(ed => Math.abs(ed.t - t) < .14).sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t));
			const ed = es.find(x => x.k === LANES[lane][0]) || es[0];
			if(!ed){ hint("Touche plus près d'un front (le moment où un signal passe de bas à haut)"); return; }
			s.cur.push(ed); play("pop"); drawChrono();
			if(s.cur.length < 2) return;
			const ks = s.cur.map(x => x.k).sort().join("");
			if(ks !== "bc"){
				err(`Tu as mesuré entre « ${LANES.find(l => l[0] === s.cur[0].k)[1]} » et « ${LANES.find(l => l[0] === s.cur[1].k)[1]} » : il faut le capteur et la butée`);
				setTimeout(() => { s.cur = []; drawChrono(); }, 1200); return;
			}
			const dt = Math.abs(s.cur[1].t - s.cur[0].t); s.dt = dt; addMin(3);
			note("", `📏 Chronogramme : la pièce touche la butée <b>${fr(dt, 2)} s</b> après le capteur, mais la pince se ferme à ${fr(s.tempo, 2)} s. Le capteur, remonté de 45 cm, prévient trop tôt.`);
			say("Ah, mercredi on l'a remonté plus haut pour passer le balai… Mais si le robot arrive en retard, la pièce est déjà là et ça marche. D'où le « de temps en temps ».");
			s.phase = "fix";
			$("#capTxt").innerHTML = `Recale la sortie : <b>touche la ligne « Fermer la pince »</b> à l'instant où elle doit se fermer.<br>Temps de cycle = ${fr(BASE_CYCLE, 2)} s + ce délai. Pour livrer lundi : <b>${fr(CYCLE_MAX, 1)} s au plus</b>.`;
			hint("Touche la ligne orange au bon instant");
			return;
		}
		if(lane !== 2){ hint("Touche la ligne orange « Fermer la pince »"); return; }
		const nt = Math.round(clamp(t, 0, 1.4)/.05)*.05;
		s.newT = nt; drawChrono(); captVerify(nt);
	}
	async function captVerify(nt){
		const s = S.capt; if(s.busy) return;
		s.busy = true; s.phase = "verif"; addMin(4);
		const cyc = BASE_CYCLE + nt;
		log(`Fermeture de la pince à ${fr(nt, 2)} s après le capteur · temps de cycle ${fr(cyc, 2)} s`);
		$("#capTxt").innerHTML = `Essai avec la pince : fermeture à <b>${fr(nt, 2)} s</b>, temps de cycle <b>${fr(cyc, 2)} s</b>…`;
		const tok = S.run; s.rec = []; s.cur = []; drawChrono();
		let r;
		try { r = await cycle(tok, { tempo:nt, kp:20, kd:6 }); ck(tok); } catch(e){ if(e !== ABORT) console.error(e); return; }
		s.rec = chronoModel(nt, false); drawChrono();
		s.busy = false;
		if(r.cause === "capteur"){ err(`À ${fr(nt, 2)} s, la pièce roule encore : prise de travers. Elle n'arrive à la butée qu'à ${fr(ARRIVE, 2)} s.`); s.phase = "fix"; $("#capTxt").innerHTML = `Encore trop tôt. Touche à nouveau la ligne « Fermer la pince ».`; return; }
		if(nt < ARRIVE + .04){ err(`La pièce vient juste de toucher la butée et rebondit encore : garde une petite marge après ${fr(ARRIVE, 2)} s.`); s.phase = "fix"; $("#capTxt").innerHTML = `Garde une petite marge. Touche à nouveau la ligne « Fermer la pince ».`; return; }
		if(cyc > CYCLE_MAX + 1e-6){ err(`Pièce bien prise, mais ${fr(cyc, 2)} s par pièce : samedi, la cellule n'en sortira que ${Math.floor(SAT_SECONDS/cyc).toLocaleString("fr-FR")}, pas assez pour lundi`); s.phase = "fix"; $("#capTxt").innerHTML = `Trop lent pour lundi (${fr(CYCLE_MAX, 1)} s au plus). Touche à nouveau la ligne « Fermer la pince ».`; return; }
		s.phase = "done"; S.fix.tempo = nt; S.fix.dt = s.dt ?? ARRIVE; S.fix.cycle = cyc;
		play("win"); setRebut(S.rebut - 5);
		note("ok", `✅ Pince fermée à ${fr(nt, 2)} s après le capteur (pièce en butée à ${fr(S.fix.dt, 2)} s) : prise droite, ${fr(cyc, 2)} s par pièce.`);
		setTimeout(() => card(`<div class="k">Étape 3 réussie · cause n° 2 prouvée</div><h2>La pince n'y était pour rien</h2>
			<p>La pince serre ${GRIP_N} N : la changer n'aurait rien réparé. Le vrai coupable, c'est le <b>temps</b> : depuis que le capteur a été remonté, il prévient ${fr(S.fix.dt, 2)} s avant l'arrivée de la pièce. Quand le robot attendait déjà, il fermait trop tôt.</p>
			<p>Tu as recalé la fermeture à ${fr(nt, 2)} s : la pièce est en butée, et le cycle tient en ${fr(cyc, 2)} s.</p>
			${course("indus")}
			<button class="rb-btn dark" data-a="servo">Étape 4 · la pièce qui s'échappe →</button>`), 700);
	}

	/* ===================== 4 · ASSERVISSEMENT DE L'ÉPAULE ===================== */
	function stepServo(){
		resetRun(); setStep("servo", "4 · L'épaule"); clearParts();
		J.splice(0, 3, 0, SERVO.from, 100); applyJoints();
		const t = tip(), p = makePart(COL, t.x, t.y - CUBE/2 - .02, t.z); held = p; p.held = true; gripOpen = false; fTarget = GRIP_N;
		S.sv = { kp:SERVO.kp0, kd:SERVO.kd0, last:null, trials:[], running:false, done:false };
		dossier("Étape 4 · automatique", "Pourquoi la pièce s'échappe-t-elle ?", `
			<p>Depuis jeudi, l'épaule lève la pièce de ${SERVO.from}° à ${SERVO.from + SERVO.step}° beaucoup trop nerveusement. Il faut : <b>dépasser la consigne de ${SERVO.over}° au plus</b>, et être stable à ±${SERVO.tol}° <b>en ${fr(SERVO.settle, 2)} s au plus</b> (sinon, adieu la cadence).</p>
			<p>Tourne les boutons du variateur, lance un essai, lis la courbe. <b>Un seul réglage à la fois</b>, sinon tu ne sauras pas lequel a joué.</p>`);
		say("Le stagiaire voulait aller plus vite. Remettre l'ancien réglage ? Il était trop lent pour lundi, justement.");
		ctl.innerHTML = `<h4>Réponse de l'épaule (consigne en pointillés)</h4>${cvs("svPlot", 520, 280)}
			<div class="rb-knobs">
				<div class="rb-knob" tabindex="0" data-k="kp" aria-label="Gain"><div class="kb"><i></i></div>Gain<b id="svKp"></b></div>
				<div class="rb-knob" tabindex="0" data-k="kd" aria-label="Amortissement"><div class="kb"><i></i></div>Amortissement<b id="svKd"></b></div>
			</div>
			<p class="rb-small">Glisse sur un bouton vers le haut ou le bas pour le tourner (flèches au clavier).</p>
			<button class="rb-btn" id="svRun">▶ Essai : lever la pièce</button>`;
		ctl.querySelectorAll(".rb-knob").forEach(kn => {
			const k = kn.dataset.k, kb = kn.querySelector(".kb");
			let y0 = 0, v0 = 0, drag = false;
			kb.addEventListener("pointerdown", e => { if(S.sv.running || S.sv.done) return; drag = true; y0 = e.clientY; v0 = S.sv[k]; kb.setPointerCapture(e.pointerId); e.preventDefault(); });
			kb.addEventListener("pointermove", e => { if(!drag) return; const st = k === "kp" ? 5 : 1, n = Math.round((y0 - e.clientY)/14); setKnob(k, v0 + n*st); });
			const end = () => { drag = false; }; kb.addEventListener("pointerup", end); kb.addEventListener("pointercancel", end);
			kn.addEventListener("keydown", e => { const st = k === "kp" ? 5 : 1; if(e.key === "ArrowUp" || e.key === "ArrowRight"){ e.preventDefault(); setKnob(k, S.sv[k] + st); } if(e.key === "ArrowDown" || e.key === "ArrowLeft"){ e.preventDefault(); setKnob(k, S.sv[k] - st); } });
		});
		$("#svRun").addEventListener("click", servoTrial);
		syncKnobs(); plotServo(null, 0);
		hint("Lance d'abord un essai avec le réglage de jeudi pour voir le problème");
	}
	function setKnob(k, v){ if(S.sv.running || S.sv.done) return; const nv = k === "kp" ? clamp(v, 10, 60) : clamp(v, 0, 16); if(nv !== S.sv[k]){ S.sv[k] = nv; play("pop"); syncKnobs(); } }
	function syncKnobs(){
		$("#svKp").textContent = S.sv.kp; $("#svKd").textContent = S.sv.kd;
		root.querySelector('[data-k="kp"] i').style.transform = `rotate(${-135 + (S.sv.kp - 10)/50*270}deg)`;
		root.querySelector('[data-k="kd"] i').style.transform = `rotate(${-135 + S.sv.kd/16*270}deg)`;
	}
	function plotServo(r, upto){
		const c = $("#svPlot"); if(!c) return;
		const x = c.getContext("2d"), W = c.width, H = c.height, pad = 34, top = SERVO.from + SERVO.step + 16, bot = SERVO.from - 3;
		const X = t => pad + 6 + (W - pad - 14)*t/SERVO.T, Y = a => H - pad - (H - pad - 12)*(a - bot)/(top - bot);
		const tgt = SERVO.from + SERVO.step;
		x.clearRect(0, 0, W, H);
		x.fillStyle = "rgba(59,209,111,.18)"; x.fillRect(X(0), Y(tgt + SERVO.tol), X(SERVO.T) - X(0), Y(tgt - SERVO.tol) - Y(tgt + SERVO.tol));
		x.fillStyle = "rgba(255,77,94,.10)"; x.fillRect(X(0), Y(top), X(SERVO.T) - X(0), Y(tgt + SERVO.over) - Y(top));
		x.strokeStyle = "#c9d2db"; x.lineWidth = 1.5; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(X(SERVO.settle), 10); x.lineTo(X(SERVO.settle), H - pad); x.stroke();
		x.strokeStyle = "#1e305e"; x.lineWidth = 2; x.beginPath(); x.moveTo(X(0), Y(tgt)); x.lineTo(X(SERVO.T), Y(tgt)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#5b6b7a"; x.font = "800 20px Nunito, sans-serif"; x.textAlign = "left";
		x.fillText(`consigne ${tgt}°`, X(0) + 4, Y(tgt) + 24); x.fillText(`${fr(SERVO.settle, 2)} s`, X(SERVO.settle) + 5, H - pad - 8); x.fillStyle = "#d6213a"; x.fillText(`dépassement max ${SERVO.over}°`, X(0) + 4, Y(top) + 22);
		x.fillStyle = "#8a95a1"; x.fillText("0 s", X(0) - 4, H - 8); x.textAlign = "right"; x.fillText(fr(SERVO.T, 0) + " s", X(SERVO.T), H - 8);
		const curve = (tr, upTo, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); tr.forEach((a, i) => { if(i > upTo) return; const px = X(i*servoSim(10, 0).step), py = Y(clamp(SERVO.from + a, bot, top)); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); };
		S.sv.trials.slice(-4).forEach(tr => { if(tr.r !== r) curve(tr.r.tr, 1e9, "rgba(91,107,122,.3)", 2); });
		if(r) curve(r.tr, upto, "#0b7a8e", 3.5);
	}
	async function servoTrial(){
		const s = S.sv; if(s.running || s.done) return;
		const changed = s.last ? (s.last.kp !== s.kp) + (s.last.kd !== s.kd) : 1;
		if(s.last && changed === 0){ hint("Même réglage que l'essai précédent : tourne un bouton d'abord"); return; }
		if(changed === 2) err("Tu as changé le gain ET l'amortissement : si ça s'améliore, impossible de savoir lequel a joué. Un seul réglage à la fois.");
		s.running = true; $("#svRun").disabled = true; addMin(4);
		const r = servoSim(s.kp, s.kd), tok = S.run;
		s.trials.push({ kp:s.kp, kd:s.kd, r }); s.last = { kp:s.kp, kd:s.kd };
		log(`Essai ${s.trials.length} : gain ${s.kp}, amortissement ${s.kd}`);
		hint("");
		let t = 0;
		await new Promise(res => { motion = { res, step(d){ t += d; const i = Math.min(r.tr.length - 1, Math.floor(t/r.step)); J[1] = SERVO.from + r.tr[i]; plotServo(r, i); return t >= SERVO.T; } }; });
		if(closed || tok !== S.run) return;
		s.running = false; $("#svRun").disabled = false;
		const ok = r.over <= SERVO.over && r.settle !== null && r.settle <= SERVO.settle;
		const st = r.settle === null ? "jamais stable" : `stable en ${fr(r.settle, 2)} s`;
		if(ok){
			s.done = true; S.fix.kp = s.kp; S.fix.kd = s.kd; S.fix.over = r.over; S.fix.settle = r.settle;
			play("win"); setRebut(S.rebut - 4);
			note("ok", `✅ Épaule : gain ${s.kp}, amortissement ${s.kd} → dépassement ${fr(r.over)}°, ${st} (jeudi : ${fr(servoSim(SERVO.kp0, SERVO.kd0).over)}°).`);
			setTimeout(() => card(`<div class="k">Étape 4 réussie · cause n° 3 prouvée</div><h2>Rapide, mais sans fouetter</h2>
				<p>Jeudi, le gain a doublé et l'amortissement a baissé : le bras allait plus vite, mais dépassait de ${fr(servoSim(SERVO.kp0, SERVO.kd0).over)}° et lâchait les pièces. Avec <b>gain ${s.kp} et amortissement ${s.kd}</b>, il dépasse de ${fr(r.over)}° et se pose en ${fr(r.settle, 2)} s, en ${s.trials.length} essais.</p>
				${course("auto")}
				<button class="rb-btn dark" data-a="vision">Étape 5 · la caméra qui voit des défauts →</button>`), 600);
			return;
		}
		if(s.trials.length > 5) err();
		const why = r.over > SERVO.over ? `dépasse de ${fr(r.over)}° (max ${SERVO.over}°)` : `trop lent : ${st} (max ${fr(SERVO.settle, 2)} s)`;
		note("", `📏 Essai ${s.trials.length} · gain ${s.kp}, amortissement ${s.kd} : ${why}.`);
		hint(r.over > SERVO.over ? "Ça dépasse : quel bouton freine le bras avant la cible ?"
			: r.over > SERVO.tol ? `Il rebondit encore de ${fr(r.over)}° avant de se poser : freine encore un peu`
			: "Il arrive trop doucement : quel bouton donne plus de force pour rattraper la consigne ?");
	}

	/* ===================== 5 · VISION : réapprendre sous les LED ===================== */
	const samples = [];
	function stepVision(){
		resetRun(); setStep("vision", "5 · La caméra"); clearParts(); gripOpen = true; fTarget = 0;
		S.vi = { shot:new Set(), queue:[], th:null, done:false, busy:false };
		samples.length = 0;
		SAMPLES.forEach(([lum, good], i) => {
			const x = TABLE.x - .62 + (i % 5)*.31, z = TABLE.z + (i < 5 ? -.18 : .18);
			const p = makePart(good ? COL : COL_DEF, x, TABLE.y, z, { lum, good });
			const tag = add(boxG(.12, .01, .12), M(good ? "#2fa35a" : "#d6213a"), p.mesh, 0, CUBE/2 + .006, 0, false);
			samples.push(p); p.tag = tag;
		});
		J.splice(0, 3, ...ik(V(TABLE.x, 1.5, TABLE.z)));
		dossier("Étape 5 · vision", "La caméra a-t-elle changé d'avis ?", `
			<p>La caméra mesure la <b>luminosité</b> de chaque pièce : une pièce mal peinte paraît plus claire. Sa règle, apprise en septembre sous les néons : <b>défaut au-dessus de ${OLD_TH} %</b>.</p>
			<p>Karim a contrôlé 10 pièces à la main (pastille verte : bonne, rouge : défaut). <b>Touche chaque pièce</b> sur la table : le bras la photographie sous les LED.</p>`);
		say("Toutes celles-là, je les ai regardées une par une. Je te garantis les pastilles.");
		ctl.innerHTML = `<h4>Luminosité sous les LED · en haut les bonnes, en bas les défauts</h4>${cvs("viPlot", 520, 210)}
			<p class="rb-small" id="viTxt">0 / 10 pièces photographiées.</p>
			<button class="rb-btn" id="viTest" hidden>▶ Tester la règle sur un lot neuf</button>`;
		$("#viPlot").addEventListener("click", viTap);
		$("#viTest").addEventListener("click", viTest);
		hint("Touche une pièce sur la table de contrôle (à gauche du bras)");
		drawVision();
	}
	const VX = l => 26 + (l - 50)/50*468;
	function drawVision(test){
		const c = $("#viPlot"); if(!c) return;
		const x = c.getContext("2d"), s = S.vi;
		x.clearRect(0, 0, 520, 210);
		const g = x.createLinearGradient(VX(50), 0, VX(100), 0); g.addColorStop(0, "#c9631f"); g.addColorStop(1, "#f6d7b6");
		x.fillStyle = g; x.fillRect(VX(50), 92, VX(100) - VX(50), 14);
		x.fillStyle = "#5b6b7a"; x.font = "700 18px Nunito, sans-serif"; x.textAlign = "center";
		for(let l = 50; l <= 100; l += 10) x.fillText(l + " %", VX(l), 128);
		
		// ancien seuil
		x.strokeStyle = "#8a95a1"; x.setLineDash([5, 5]); x.lineWidth = 2; x.beginPath(); x.moveTo(VX(OLD_TH), 18); x.lineTo(VX(OLD_TH), 172); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#8a95a1"; x.fillText(`seuil de septembre ${OLD_TH} %`, VX(OLD_TH), 17);
		if(s.th !== null){ x.strokeStyle = "#1e305e"; x.lineWidth = 4; x.beginPath(); x.moveTo(VX(s.th), 26); x.lineTo(VX(s.th), 172); x.stroke(); x.fillStyle = "#1e305e"; x.font = "800 19px Nunito, sans-serif"; x.fillText(`nouveau seuil ${s.th} %`, VX(s.th), 190); }
		samples.forEach(p => {
			if(!s.shot.has(p)) return;
			const y = p.good ? 66 : 140, wrong = s.th !== null && ((p.lum > s.th) === !!p.good);
			x.fillStyle = p.good ? "#2fa35a" : "#d6213a"; x.beginPath(); x.arc(VX(p.lum), y, 12, 0, 7); x.fill();
			if(wrong){ x.strokeStyle = "#d6213a"; x.lineWidth = 3; x.beginPath(); x.arc(VX(p.lum), y, 18, 0, 7); x.stroke(); }
			if(!p.good || p.lum === 74){ x.fillStyle = "#22303d"; x.font = "700 16px Nunito, sans-serif"; x.fillText(p.lum, VX(p.lum), p.good ? 50 : 162); }
		});
		if(test) test.forEach(([l, ok], i) => { x.fillStyle = ok ? "#3bd16f" : "#d6213a"; x.fillRect(VX(l) - 3, 98 - 4, 6, 6); });
	}
	async function viShoot(p){
		const s = S.vi; if(s.done || s.shot.has(p)) return;
		if(s.busy){ if(!s.queue.includes(p)) s.queue.push(p); return; }        // touchée pendant que le bras bouge : on la photographie juste après
		s.busy = true; play("pop");
		const tok = S.run;
		try { await moveTo(V(p.mesh.position.x, TABLE.y + CUBE + .55, p.mesh.position.z), 220); ck(tok); await gwait(.25); ck(tok); } catch(e){ if(e !== ABORT) console.error(e); return; }
		s.busy = false; s.shot.add(p); addMin(1);
		camText(`Luminosité ${p.lum} % · pastille ${p.good ? "verte (bonne)" : "rouge (défaut)"}`, !p.good);
		log(`Photo : luminosité ${p.lum} % · ${p.good ? "bonne" : "défaut"}${p.good && p.lum > OLD_TH ? ` → l'ancienne règle la jetterait !` : ""}`, p.good && p.lum > OLD_TH ? "ko" : "");
		if(s.shot.size === 1) note("", `📏 La même pièce photographiée en septembre sous les néons : ${p.lum - LUM_SHIFT} %. Sous les LED : <b>${p.lum} %</b>. Les LED ajoutent <b>${LUM_SHIFT} points</b> à toutes les pièces.`);
		$("#viTxt").textContent = `${s.shot.size} / 10 pièces photographiées.`;
		drawVision();
		const nx = s.queue.shift(); if(nx){ viShoot(nx); return; }
		if(s.shot.size === SAMPLES.length){
			const fp = SAMPLES.filter(([l, g]) => g && l > OLD_TH).length;
			note("", `📏 Avec le seuil de septembre (${OLD_TH} %), <b>${fp} bonnes pièces sur 6</b> seraient jetées.`);
			$("#viTxt").innerHTML = `<b>Touche l'échelle</b> pour placer le nouveau seuil : au-dessus, défaut ; en dessous, bonne.`;
			$("#viPlot").classList.add("tap");
			hint("Place le nouveau seuil en touchant l'échelle");
		}
	}
	function viTap(e){
		const s = S.vi; if(s.done || s.shot.size < SAMPLES.length) return;
		const [px] = cpos($("#viPlot"), e);
		s.th = Math.round(clamp(50 + (px - 26)/468*50, 50, 100)); play("pop");
		const wrong = SAMPLES.filter(([l, g]) => (l > s.th) === !!g).length;
		$("#viTxt").innerHTML = wrong ? `Seuil ${s.th} % : <b>${wrong} exemple${wrong > 1 ? "s" : ""} mal classé${wrong > 1 ? "s" : ""}</b> (entourés).` : `Seuil ${s.th} % : les 10 exemples sont bien classés. Vérifie sur des pièces que la règle n'a jamais vues.`;
		$("#viTest").hidden = false;
		drawVision();
	}
	async function viTest(){
		const s = S.vi; if(s.done || s.th === null || s.busy) return;
		addMin(4);
		const res = TESTLOT.map(l => [l, (l > s.th) === (l >= 80)]), bad = res.filter(r => !r[1]).length, wrongEx = SAMPLES.filter(([l, g]) => (l > s.th) === !!g).length;
		drawVision(res);
		log(`Lot neuf de ${TESTLOT.length} pièces au seuil ${s.th} % : ${TESTLOT.length - bad} bien triées`);
		if(bad || wrongEx){ err(`Seuil ${s.th} % : ${bad} pièce${bad > 1 ? "s" : ""} du lot neuf mal triée${bad > 1 ? "s" : ""}. Le seuil doit passer entre la bonne la plus claire et le défaut le plus sombre.`); return; }
		s.done = true; S.fix.th = s.th; play("win"); setRebut(2);
		note("ok", `✅ Nouveau seuil ${s.th} % (entre la bonne la plus claire, 78 %, et le défaut le plus sombre, 84 %) : ${TESTLOT.length}/${TESTLOT.length} sur le lot neuf.`);
		setTimeout(() => card(`<div class="k">Étape 5 réussie · cause n° 4 prouvée</div><h2>La caméra avait raison… sous les néons</h2>
			<p>La règle de septembre était juste, mais pour un autre éclairage. Les LED ajoutent ${LUM_SHIFT} points à toutes les pièces : les bonnes un peu claires passaient au-dessus de ${OLD_TH} %. Réapprise sur 10 pièces contrôlées, testée sur ${TESTLOT.length} pièces neuves : la règle place le seuil à <b>${s.th} %</b>.</p>
			${course("vision")}
			<button class="rb-btn dark" data-a="prod">Relancer la production →</button>`), 600);
	}

	/* ===================== 6 · PRODUCTION (une heure en 60 s) ===================== */
	function stepProd(){
		resetRun(); setStep("prod", "Production"); clearParts(); pocketI = 0; gripOpen = true; fTarget = 0;
		const f = { comp:.4, compRes:0, jeu:.4, tempo:.75, dt:ARRIVE, cycle:BASE_CYCLE + .75, kp:40, kd:10, th:81, ...S.fix };
		f.over ??= servoSim(f.kp, f.kd).over; f.settle ??= servoSim(f.kp, f.kd).settle;
		S.fix = f;
		const hist = Array.from({ length:300 }, (_, i) => i % 5 === 0 ? 1 : 0);
		S.prod = { t:0, n:0, rej:0, win:hist, curve:[], top:[], taps:[], done:false, measured:null, real:0 };
		J.splice(0, 3, ...ik(V(BELT.stop, UP_Y, BELT.z)));
		dossier("Production · samedi", "La cellule repart", `
			<p>Une heure de production en 60 secondes. La courbe suit le <b>taux de rebut</b> sur les 300 dernières pièces : il part des 20 % de ce matin.</p>
			<p>Dernière mesure pour le rapport : le <b>temps de cycle</b>. Touche le chrono à chaque fois que la pince <b>se ferme</b>, deux fois de suite.</p>`);
		say("Si ça tient une heure, je signe pour samedi.");
		ctl.innerHTML = `<h4>Taux de rebut · 300 dernières pièces</h4>${cvs("prPlot", 520, 230)}
			<div class="rb-read"><div>Pièces produites<b id="prN">0</b></div><div>Rebut<b id="prR">20 %</b></div></div>
			<button class="rb-hold" id="prTop" style="background:#21b6ce;box-shadow:0 4px 0 #0b7a8e">⏱ Top : la pince se ferme</button>
			<p class="rb-small" id="prTxt">Chrono : en attente.</p>`;
		$("#prTop").addEventListener("pointerdown", e => { e.preventDefault(); prodTop(); });
		hint("Une heure de production en 60 s : regarde la courbe, et chronomètre un cycle");
		addMin(10); prodLoop();
	}
	function prodTop(){
		const p = S.prod; if(!p || p.done) return;
		p.taps.push(gt); play("pop");
		if(p.taps.length < 2){ $("#prTxt").textContent = "Top 1 enregistré : touche à la prochaine fermeture."; return; }
		const m = p.taps[p.taps.length - 1] - p.taps[p.taps.length - 2];
		if(Math.abs(m - S.fix.cycle) <= .35){
			p.measured = m; $("#prTxt").innerHTML = `Mesuré : <b>${fr(m, 1)} s</b> par pièce (contrôleur : ${fr(S.fix.cycle, 2)} s) ✓`;
			note("", `📏 Temps de cycle chronométré : <b>${fr(m, 1)} s</b> (${CYCLE_MAX.toString().replace(".", ",")} s au plus pour lundi).`);
			p.taps = [];
		} else { $("#prTxt").textContent = `Mesuré ${fr(m, 1)} s : ça ne colle pas avec un cycle. Re-touche à chaque fermeture de la pince.`; p.taps = [p.taps[p.taps.length - 1]]; }
	}
	async function prodLoop(){
		const tok = S.run, p = S.prod, f = S.fix;
		const lums = [64, 71, 67, 75, 92, 69, 62, 77, 66, 73, 70, 68, 63, 76, 65];
		let k = 0;
		try {
			while(gt - (p.t0 ??= gt) < 60){
				const lum = lums[k % lums.length], def = lum >= 86;
				const r = await cycle(tok, { tempo:f.tempo, kp:f.kp, kd:f.kd, off:f.compRes, lum, seuil:f.th, def, pace:true, mark:n => { if(n === "pince" || n === "early") S.prod.lastClose = gt; } });
				ck(tok); k++; p.real++;
				if(r.cause === "defaut"){ log("Rebut : vraie pièce mal moulée, écartée par la caméra ✓"); say("Celle-là, je l'ai vérifiée : bavure de moulage. La caméra a bien fait de la jeter."); }
			}
		} catch(e){ if(e !== ABORT) console.error(e); return; }
		prodEnd();
	}
	function prodTick(gdt){
		const p = S.prod; if(!p || p.done || p.t0 === undefined) return;
		const rate = 3600/S.fix.cycle/60;        // pièces simulées par seconde affichée (une heure en 60 s)
		p.acc = (p.acc || 0) + rate*gdt;
		while(p.acc >= 1){
			p.acc--; p.n++;
			const bad = (p.n*37 % 100) < 2 ? 1 : 0;         // 2 % de pièces réellement défectueuses chez le fournisseur
			p.rej += bad; p.win.push(bad); p.win.shift();
		}
		const pct = p.win.reduce((a, b) => a + b, 0)/p.win.length*100;
		if(!p.curve.length || gt - p.curve[p.curve.length - 1][0] > .25) p.curve.push([gt - p.t0, pct]);
		$("#prN") && ($("#prN").textContent = p.n.toLocaleString("fr-FR"));
		$("#prR") && ($("#prR").textContent = fr(pct, 1) + " %");
		setRebut(Math.round(pct*10)/10);
		drawProd(pct);
	}
	function drawProd(){
		const c = $("#prPlot"); if(!c) return;
		const x = c.getContext("2d"), W = 520, H = 230, X = t => 62 + (W - 76)*t/60, Y = v => H - 30 - (H - 50)*v/25;
		x.clearRect(0, 0, W, H);
		x.strokeStyle = "#e3e8ed"; x.lineWidth = 1; x.fillStyle = "#8a95a1"; x.font = "700 18px Nunito, sans-serif"; x.textAlign = "right";
		for(const v of [0, 5, 10, 15, 20, 25]){ x.beginPath(); x.moveTo(62, Y(v)); x.lineTo(W - 8, Y(v)); x.stroke(); x.fillText(v + " %", 54, Y(v) + 6); }
		x.textAlign = "center"; for(const t of [0, 15, 30, 45, 60]) x.fillText(`${t} min`, X(t), H - 6);
		x.strokeStyle = "#d6213a"; x.setLineDash([6, 5]); x.lineWidth = 2; x.beginPath(); x.moveTo(62, Y(20)); x.lineTo(W - 8, Y(20)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#d6213a"; x.textAlign = "left"; x.fillText("ce matin : 20 %", 70, Y(20) - 8);
		const pts = S.prod.curve; if(pts.length < 2) return;
		x.strokeStyle = "#0b7a8e"; x.lineWidth = 3.5; x.beginPath(); pts.forEach(([t, v], i) => i ? x.lineTo(X(t), Y(v)) : x.moveTo(X(t), Y(v))); x.stroke();
	}
	function prodEnd(){
		const p = S.prod; p.done = true; hint("");
		const pct = p.win.reduce((a, b) => a + b, 0)/p.win.length*100;
		S.fix.final = pct;
		play("win"); report();
	}

	/* ===================== RAPPORT AU CLIENT ===================== */
	function report(){
		const f = S.fix, e = S.errors, mention = MENTIONS[e <= 2 ? 3 : e <= 5 ? 2 : e <= 9 ? 1 : 0];
		const perSat = Math.floor(SAT_SECONDS/f.cycle), good = Math.floor(perSat*(1 - f.final/100));
		ev("win", mention);
		card(`<div class="k">Rapport au client · vendredi ${$("#rbClock").textContent.replace("Ven. ", "")}</div><h2>Livraison lundi : confirmée</h2>
			<p>Bonjour, voici ce que nous avons trouvé sur la cellule. <b>Quatre causes</b>, chacune prouvée par une mesure :</p>
			<ul>
				<li><span>Coude</span><div>Jeu de <b>${fr(f.jeu, 2)}°</b> au réducteur (comparateur, deux sens d'approche), soit ${fr(f.jeu*MM_PER_DEG)} mm en bout de bras. Compensé de ${fr(f.comp, 2)}° ; réducteur commandé.</div></li>
				<li><span>Capteur</span><div>Remonté mercredi : la pièce touche la butée <b>${fr(f.dt, 2)} s</b> après le signal (chronogramme). Pince fermée à ${fr(f.tempo, 2)} s au lieu de 0,25 s.</div></li>
				<li><span>Épaule</span><div>Réglage de jeudi : <b>${fr(servoSim(SERVO.kp0, SERVO.kd0).over)}°</b> de dépassement. Gain ${f.kp}, amortissement ${f.kd} : ${fr(f.over)}°, stable en ${fr(f.settle, 2)} s.</div></li>
				<li><span>Caméra</span><div>Les LED de mardi ajoutent <b>${LUM_SHIFT} points</b> de luminosité. Seuil réappris : ${OLD_TH} % → ${f.th} %, ${TESTLOT.length}/${TESTLOT.length} sur un lot neuf.</div></li>
				<li class="no"><span>Écarté</span><div>La pince : ${GRIP_N} N mesurés pour ${GRIP_SPEC} N exigés. Pas de changement.</div></li>
			</ul>
			<p><b>Résultat :</b> rebut de 20 % à <b>${fr(f.final, 1)} %</b> (des pièces réellement défectueuses). Cycle ${S.prod.measured ? `chronométré à ${fr(S.prod.measured, 1)} s` : `de ${fr(f.cycle, 2)} s`} : samedi, ${perSat.toLocaleString("fr-FR")} pièces, dont ${good.toLocaleString("fr-FR")} bonnes, pour ${ORDER.toLocaleString("fr-FR")} commandées.</p>
			<button class="rb-btn dark" data-a="send">✉️ Envoyer le rapport</button>`);
		S.mention = mention;
	}
	function finale(){
		const e = S.errors, mention = S.mention;
		card(`<div class="k">Dossier clos · mention ${mention}</div><h2>Tu as fait le travail d'un ingénieur</h2>
			<div class="rb-big">🦾✅</div>
			<p>Pas de pièce changée au hasard : tu as observé, mesuré, changé un seul facteur à la fois et prouvé chaque cause. Une pince neuve à 1 900 € n'aurait rien réparé. ${e ? `Erreurs en chemin : ${e}.` : "Sans une seule erreur !"}</p>
			<ul>${["meca", "indus", "auto", "vision"].map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="rb-btn dark" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="rb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la ${formation.name} ↗</a>
			<button class="rb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="rb-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- boucle ---------- */
	const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
	camera.position.set(6.6, 6.4, 9.2);
	const controls = new OrbitControls(camera, canvas);
	controls.target.set(-.4, .7, .2);
	if(matchMedia("(max-width:820px)").matches){ camera.position.set(4.6, 5.0, 6.4); controls.target.set(-.3, .8, .4); }       // téléphone : vue plus haute, toute la cellule dans le cadre
	controls.enableDamping = true; controls.maxPolarAngle = 1.45; controls.minDistance = 4; controls.maxDistance = 18; controls.update();
	let raf = 0, last = performance.now(), sized = "";
	function viewRect(el){
		const r = el.getBoundingClientRect(), H = innerHeight;
		return { x:r.left, y:H - r.bottom, w:r.width, h:r.height, visible:r.bottom > 0 && r.top < H && r.width > 10 && r.height > 10 };
	}
	function resize(){ if(!innerWidth || !innerHeight) return; sized = innerWidth + "x" + innerHeight; renderer.setSize(innerWidth, innerHeight, false); }
	addEventListener("resize", resize); resize();
	function tick(dt){
		let gdt = dt*SPEED;
		if(S.step === "obs") gdt *= S.hold ? .6 : 0;
		if(gdt > 0){
			gt += gdt;
			for(let i = waits.length - 1; i >= 0; i--) if(gt >= waits[i].t){ const w = waits.splice(i, 1)[0]; w.r(); }
			if(motion && motion.step(gdt)){ const r = motion.res; motion = null; r(); }
			// tapis : les pièces avancent jusqu'à la butée
			const q = parts.filter(p => p.onBelt && !p.held).sort((a, b) => b.mesh.position.x - a.mesh.position.x);
			q.forEach((p, i) => { p.mesh.position.x = Math.min(BELT.stop - i*(CUBE + .06), p.mesh.position.x + VBELT*gdt); });
			beltTex.offset.x = (beltTex.offset.x - VBELT*gdt/4.5*18) % 1;
		}
		applyJoints();
		const g0 = gdt > 0 || S.step !== "obs" ? Math.min(1, dt*SPEED*10) : 0;
		grip += ((gripOpen ? 1 : 0) - grip)*g0;
		fingers.forEach((f, i) => f.position.x = (i ? 1 : -1)*(.07 + .07*grip));
		const onSensor = parts.some(p => p.onBelt && Math.abs(p.mesh.position.x - SENSOR_X) < CUBE/2);
		ledS.emissive.set(onSensor ? "#3bd16f" : "#000"); ledS.color.set(onSensor ? "#3bd16f" : "#555");
		const tp = tip();
		for(const p of parts){
			if(p.held){ p.mesh.position.set(tp.x - p.dx, tp.y - CUBE/2 - .02, tp.z); p.mesh.rotation.set(0, 0, p.rz); continue; }
			if(p.falling && gdt > 0){
				p.vy -= 9.8*gdt; p.mesh.position.y += p.vy*gdt;
				const L = landing(p.mesh.position.x, p.mesh.position.z);
				if(p.mesh.position.y - CUBE/2 <= L){ p.mesh.position.y = L + CUBE/2; p.falling = false; play("pop"); }
			}
		}
		// effort de la pince
		if(gdt > 0 || S.step === "capt"){
			fNow += (fTarget - fNow)*Math.min(1, dt*SPEED*5);
			S.fTick = (S.fTick || 0) + dt*SPEED;
			if(S.fTick > .04){ S.fTick = 0; force.push(Math.max(0, fNow + (fNow > 1 ? (Math.random() - .5)*1.6 : 0))); force.shift(); }
		}
		if(S.step === "capt" && S.capt && S.capt.phase === "force" && S.hold){
			S.capt.hold += dt*SPEED;
			if(S.capt.hold > 1.4) captForceDone();
		}
		if(S.step === "prod" && gdt > 0) prodTick(gdt);
	}
	function render(){
		if(sized !== innerWidth + "x" + innerHeight) resize();
		if(!innerWidth || !innerHeight) return;
		setGauges(); drawForce();
		controls.update();
		renderer.setScissorTest(true);
		renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.setScissor(0, 0, innerWidth, innerHeight); renderer.clear();
		const v = viewRect($(".rb-view")), c = viewRect($("#rbCam"));
		if(v.visible){ camera.aspect = v.w/v.h; camera.updateProjectionMatrix(); renderer.setViewport(v.x, v.y, v.w, v.h); renderer.setScissor(v.x, v.y, v.w, v.h); renderer.render(scene, camera); }
		if(c.visible){ cam2.aspect = c.w/c.h; cam2.updateProjectionMatrix(); renderer.setViewport(c.x, c.y, c.w, c.h); renderer.setScissor(c.x, c.y, c.w, c.h); renderer.render(scene, cam2); }
		renderer.setScissorTest(false);
	}
	let pump = 0;
	function frame(now){
		raf = requestAnimationFrame(frame);
		const dt = Math.min((now - last)/1000, .05); last = now;
		if(!pump) tick(dt);
		render();
	}

	/* ---------- gestes dans la vue 3D : piloter le coude (étape 2), photographier une pièce (étape 5) ---------- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	let pDown = null;
	canvas.addEventListener("pointerdown", e => { pDown = { x:e.clientX, y:e.clientY, y0:e.clientY, id:e.pointerId }; if(S.step === "jeu"){ canvas.setPointerCapture(e.pointerId); hint(""); } });
	canvas.addEventListener("pointermove", e => {
		if(!pDown || S.step !== "jeu") return;
		const dy = e.clientY - pDown.y; pDown.y = e.clientY;
		jog(dy*.005);
	});
	canvas.addEventListener("pointerup", e => {
		const d = pDown; pDown = null; if(!d) return;
		if(S.step !== "vision" || Math.hypot(e.clientX - d.x, e.clientY - d.y0) > 8) return;
		const v = viewRect($(".rb-view"));
		ndc.set((e.clientX - v.x)/v.w*2 - 1, ((innerHeight - e.clientY) - v.y)/v.h*2 - 1);
		camera.aspect = v.w/v.h; camera.updateProjectionMatrix();
		ray.setFromCamera(ndc, camera);
		const hit = ray.intersectObjects(samples.map(p => p.mesh), true)[0];
		if(!hit){ return; }
		const p = samples.find(s => s.mesh === hit.object || s.mesh === hit.object.parent);
		if(p) viShoot(p);
	});
	canvas.addEventListener("pointercancel", () => { pDown = null; });

	/* ---------- actions ---------- */
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "obs") return stepObs();
		if(k === "jeu") return stepJeu();
		if(k === "capt") return stepCapteur();
		if(k === "servo") return stepServo();
		if(k === "vision") return stepVision();
		if(k === "prod") return stepProd();
		if(k === "send") return finale();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ close(); openRobot({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }); }
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); clearInterval(pump); resetRun();
		removeEventListener("resize", resize); document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp);
		controls.dispose();
		scene.remove(karim);           // géométries et matériaux du kit : partagés avec le campus, jamais libérés
		own.forEach(o => o.dispose());
		scene.clear();
		renderer.dispose(); renderer.forceContextLoss(); root.remove(); onClose && onClose();
	}
	function onKey(e){
		if(e.key === "Escape") return close();
		if(!$("#rbOv").hidden) return;
		if(S.step === "obs"){
			if(e.key === " "){ e.preventDefault(); if(!S.hold){ S.hold = true; $("#obsHold")?.classList.add("on"); $("#obsRel").disabled = true; } }
			if(e.key === "Enter"){ e.preventDefault(); obsRelever(); }
		}
		if(S.step === "jeu" && (e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.tagName !== "INPUT"){ e.preventDefault(); jog(e.key === "ArrowDown" ? .02 : -.02); }
	}
	function onKeyUp(e){ if(S.step === "obs" && e.key === " " && S.obs) S.obs.off(); }
	document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKeyUp);
	$(".rb-x").addEventListener("click", close);

	applyJoints(); setGauges(); stepObs();      // ouverture à chaud : la boîte noire tout de suite, le contexte tient en deux lignes
	raf = requestAnimationFrame(frame);
	ev("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	ev("missions", [["1 · Observer les cycles rejetés", stepObs], ["2 · Le jeu du coude", stepJeu], ["3 · Fausse piste et capteur", stepCapteur], ["4 · Asservissement de l'épaule", stepServo], ["5 · Vision sous les LED", stepVision], ["Production et rapport", stepProd]]);
	const api = { S, J, tip, ik, servoSim, cycle, get run(){ return S.run; }, stepObs, stepJeu, stepCapteur, stepServo, stepVision, stepProd, get gt(){ return gt; }, jog, jeuRelever, obsRelever, setKnob, servoTrial, viShoot, samples, viTap, viTest, captTap, prodTop,
		hold(v){ S.hold = v; }, snap:() => render() };
	if(window.campus) window.campus.game = api;
	if(SPEED > 1){ window.__robot = api; pump = setInterval(() => { if(!closed && !window.__robot.pause) tick(.01); }, 10); }
}
