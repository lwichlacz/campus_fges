/* « Cellule robotique Wenov » — mini-jeu de la Licence Sciences pour l'Ingénieur (École du Numérique).
   Un vrai bras 3D à trois articulations (base, épaule, coude) et sa pince, piloté par le joueur :
   - L1 · mécanique, systèmes numériques : piloter les articulations à la main, saisir et déposer une pièce ;
   - L2 · robotique, systèmes industriels : programmer le cycle d'une ligne (capteur, saisie, dépose) ;
   - L2 · automatique : régler l'asservissement du moteur d'épaule (gain et amortissement) sur la courbe de réponse ;
   - L3 · vision par ordinateur, IA embarquée : régler la règle de tri à partir d'exemples, puis trier en automatique.
   Tableau de bord : cadrans d'articulations, courbe d'effort, caméra sur la pince, terminal.
   Mise en scène illustrative ; contenu à relire par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COURSES = {
	meca:   ["L1", "Mécanique et systèmes numériques", "Un bras robot est une chaîne d'articulations : chaque angle déplace tout ce qui suit. Trois articulations, trois degrés de liberté pour atteindre un point de l'espace."],
	indus:  ["L2", "Robotique et systèmes industriels", "Sur une ligne de production, le robot répète un cycle programmé (attendre, saisir, déplacer, déposer). Un capteur lui dit quand agir : c'est le travail d'un microcontrôleur ou d'un automate."],
	auto:   ["L2", "Automatique et asservissement", "Un moteur ne sait pas s'arrêter pile tout seul : une boucle compare sans cesse la position voulue et la position mesurée. Le gain donne la force de rattrapage, l'amortissement freine avant la cible. Bien réglés, le bras est rapide et ne secoue pas sa charge."],
	vision: ["L3", "Vision par ordinateur et IA embarquée", "La caméra mesure chaque pièce ; à partir d'exemples étiquetés, on fixe la règle qui décide. Une règle mal réglée trie mal, même avec un robot parfait."]
};
// géométrie du bras (unités ≈ mètres)
const SH = 1.2, L1 = 1.4, L2 = 1.3, TOOL = .45;
const D2R = Math.PI/180, R2D = 180/Math.PI;
const CUBE = .3;

const CSS = `
.rb{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#22303d;background:#e6eaee;overflow:auto;animation:rbIn .35s ease both}
@keyframes rbIn{from{opacity:0}to{opacity:1}}
.rb canvas.rb-3d{position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0}
.rb-grid{position:relative;z-index:1;display:grid;grid-template-columns:260px 1fr 290px;grid-template-rows:auto minmax(420px,1fr);gap:10px;padding:10px;min-height:100%;box-sizing:border-box;pointer-events:none}
.rb-grid>*{pointer-events:auto}
.rb-top{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rb-chip{background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 4px 14px rgba(30,48,94,.12)}
.rb-chip.st{background:#1e305e;color:#fff}
.rb-chip.live{color:#0b7a8e}
.rb-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(30,48,94,.15)}
.rb-col{display:flex;flex-direction:column;gap:10px;min-width:0}
.rb-pan{background:rgba(255,255,255,.94);border:1px solid #d3dae1;border-radius:14px;padding:10px 12px;box-shadow:0 6px 18px rgba(30,48,94,.08)}
.rb-pan h4{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a}
.rb-view{position:relative;border-radius:14px;border:1px solid #c9d2db;pointer-events:none;min-height:300px}
.rb-view .lbl{position:absolute;left:10px;top:8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a;font-weight:800;background:rgba(255,255,255,.8);padding:3px 8px;border-radius:6px}
.rb-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);white-space:nowrap;background:rgba(30,48,94,.88);color:#fff;font-weight:800;font-size:13px;padding:8px 14px;border-radius:999px;box-shadow:0 6px 18px rgba(30,48,94,.25);animation:rbHint 1.4s ease-in-out infinite alternate;transition:opacity .4s}
.rb-hint[hidden]{display:block;opacity:0}
@keyframes rbHint{from{transform:translate(calc(-50% - 10px),0)}to{transform:translate(calc(-50% + 10px),0)}}
.rb-cam{position:relative;aspect-ratio:4/3;border-radius:10px;border:1px solid #c9d2db;background:transparent;overflow:hidden}
.rb-cam .rec{position:absolute;left:8px;top:6px;font:800 11px ui-monospace,Consolas,monospace;color:#d6213a;background:rgba(255,255,255,.75);padding:1px 6px;border-radius:5px}
.rb-cam .cross{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border:2px solid rgba(11,122,142,.8);border-radius:50%}
.rb-cam .cross:before,.rb-cam .cross:after{content:"";position:absolute;background:rgba(11,122,142,.8)}
.rb-cam .cross:before{left:50%;top:-10px;bottom:-10px;width:2px;margin-left:-1px}.rb-cam .cross:after{top:50%;left:-10px;right:-10px;height:2px;margin-top:-1px}
.rb-cam .hue{position:absolute;right:8px;bottom:6px;font:800 12px ui-monospace,Consolas,monospace;background:rgba(22,32,43,.85);color:#b9f3d0;padding:2px 7px;border-radius:5px}
.rb-cam .hue:empty{display:none}
.rb-gauges{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rb-g{text-align:center;font-size:11px;font-weight:800;color:#5b6b7a}
.rb-g .ring{width:64px;height:64px;margin:0 auto 3px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#21b6ce var(--a),#e3e8ed 0)}
.rb-g .ring b{width:48px;height:48px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:15px;color:#22303d}
.rb-sl{display:grid;grid-template-columns:62px 1fr 40px;align-items:center;gap:6px;font-size:12.5px;font-weight:800;margin:6px 0}
.rb-sl input{width:100%;accent-color:#21b6ce}
.rb-sl span{text-align:right;color:#0b7a8e}
.rb-btn{border:0;border-radius:12px;padding:10px 12px;font:800 14px Nunito,sans-serif;cursor:pointer;background:#21b6ce;color:#0b2f67;width:100%;margin-top:6px}
.rb-btn.alt{background:#fff;border:2px solid #d3dae1;color:#1e305e}
.rb-btn.dark{background:#1e305e;color:#fff}
.rb-btn:disabled{opacity:.45;cursor:default}
.rb-force{width:100%;height:70px;display:block}
.rb-term{font:600 12.5px/1.45 ui-monospace,Consolas,monospace;background:#16202b;color:#b9f3d0;border-radius:10px;padding:8px 10px;min-height:92px;max-height:160px;overflow:auto}
.rb-term .ko{color:#ff8b95}.rb-term .inf{color:#9ad7ff}
.rb-mis b.t{display:block;font:700 18px/1.2 Fraunces,Georgia,serif;margin:2px 0 4px}
.rb-mis p{margin:0 0 6px;font-size:13.5px;line-height:1.45}
.rb-mis .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.rb-mis .live{font-weight:800;color:#1e305e;font-size:13px}
.rb-course{background:#eef8fa;border-left:4px solid #21b6ce;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}
.rb-course .tag{display:block;font-size:11px;font-weight:800;color:#0b7a8e;text-transform:uppercase;letter-spacing:.08em}
.rb-course b{display:block;margin:2px 0}
.rb-blocks{display:grid;grid-template-columns:1fr;gap:5px}
.rb-blk{border:0;border-radius:10px;padding:8px 10px;text-align:left;font:800 13px Nunito,sans-serif;background:#eef1f4;cursor:pointer}
.rb-blk:hover{background:#dff3f7}
.rb-prog{counter-reset:s;list-style:none;margin:6px 0;padding:0;min-height:40px;border:2px dashed #c9d2db;border-radius:10px}
.rb-prog li{counter-increment:s;display:flex;align-items:center;gap:6px;padding:6px 8px;font-size:13px;font-weight:800;border-bottom:1px solid #e3e8ed}
.rb-prog li:before{content:counter(s);width:20px;height:20px;border-radius:50%;background:#1e305e;color:#fff;display:grid;place-items:center;font-size:11px;flex:none}
.rb-prog li.run{background:#dff3f7}
.rb-prog li button{margin-left:auto;border:0;background:none;cursor:pointer;font-size:15px;color:#8a95a1}
.rb-prog:empty:before{content:"Touche les blocs pour composer le cycle";display:block;padding:10px;color:#8a95a1;font-size:12.5px;text-align:center}
.rb-hue{position:relative;height:56px;margin:8px 4px 4px;border-radius:8px;background:linear-gradient(90deg,hsl(0,70%,55%),hsl(60,70%,55%),hsl(120,70%,55%),hsl(180,70%,55%),hsl(240,70%,55%))}
.rb-hue i{position:absolute;top:8px;width:14px;height:14px;margin-left:-7px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.rb-hue i.a{top:30px}
.rb-hue i.err{outline:3px solid #ff4d5e}
.rb-hue .th{position:absolute;top:-4px;bottom:-4px;width:3px;margin-left:-1px;background:#1e305e;border-radius:2px}
.rb-resp{width:100%;height:120px;display:block;background:#f7f9fb;border-radius:8px;margin:2px 0 4px}
.rb-legend{display:flex;justify-content:space-between;font-size:12px;font-weight:800;margin-top:2px}
.rb-ov{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:14px;background:rgba(20,30,45,.35)}
.rb-ov[hidden]{display:none}
.rb-card{max-width:480px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 50px rgba(20,30,45,.35);animation:rbUp .3s ease both}
@keyframes rbUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.rb-card h2{font:700 24px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.rb-card .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.rb-card p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.rb-card ul{list-style:none;margin:0 0 12px;padding:0}
.rb-card li{display:flex;gap:8px;align-items:center;background:#f2f5f7;border-radius:10px;padding:8px 10px;margin:5px 0;font-weight:700;font-size:14px}
.rb-card li span{background:#1e305e;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px}
.rb-big{font-size:46px;text-align:center;margin:4px 0}
.rb-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#1e305e;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:none}
@media (max-width:820px){
	/* téléphone : barre et vue 3D fixes en haut, seules les commandes défilent dessous */
	.rb{overflow:hidden;--tb:calc(env(safe-area-inset-top) + 54px);--v3:max(36vh,210px)}
	.rb-grid{position:fixed;left:0;right:0;bottom:0;top:calc(var(--tb) + var(--v3) + 8px);display:flex;flex-direction:column;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 10px calc(14px + env(safe-area-inset-bottom))}
	.rb-top{position:fixed;left:0;right:0;top:0;height:var(--tb);box-sizing:border-box;padding:calc(env(safe-area-inset-top) + 7px) 10px 7px;flex-wrap:nowrap;z-index:2}
	.rb-chip{padding:6px 10px;font-size:12.5px;white-space:nowrap}
	#rbSys{overflow:hidden;text-overflow:ellipsis;min-width:0}
	.rb-col{display:contents}
	.rb-view{position:fixed;left:10px;right:10px;top:var(--tb);height:var(--v3);min-height:0}
	#rbMis{order:2}#rbCtl{order:3}.p-cam{order:4}.p-g{order:5}.p-f{order:6}.p-term{order:7}
	.rb-cam{max-width:260px;margin:0 auto}
}
`;

export function openRobot({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("rb-css")){ const st = document.createElement("style"); st.id = "rb-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "rb"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Cellule robotique Wenov");
	root.innerHTML = `<canvas class="rb-3d"></canvas>
		<div class="rb-grid">
			<div class="rb-top"><span class="rb-chip st" id="rbSt">Cellule robotique</span><span class="rb-chip live" id="rbSys">● Simulation prête</span><span class="rb-chip" id="rbErr">0 erreur</span><button class="rb-x" aria-label="Quitter le jeu">×</button></div>
			<div class="rb-col rb-colL">
				<div class="rb-pan p-g"><h4>Angles des articulations</h4><div class="rb-gauges">
					<div class="rb-g"><div class="ring" id="g1"><b>0</b></div>Base</div><div class="rb-g"><div class="ring" id="g2"><b>0</b></div>Épaule</div><div class="rb-g"><div class="ring" id="g3"><b>0</b></div>Coude</div></div></div>
				<div class="rb-pan p-f"><h4>Effort moteur</h4><canvas class="rb-force" width="240" height="70"></canvas></div>
				<div class="rb-pan" id="rbCtl"></div>
			</div>
			<div class="rb-view"><span class="lbl">Simulateur 3D</span><span class="rb-hint" hidden>👆 Glisse pour tourner autour du bras</span></div>
			<div class="rb-col rb-colR">
				<div class="rb-pan p-cam"><h4>Caméra de la pince</h4><div class="rb-cam" id="rbCam"><span class="rec">● CAM 2</span><i class="cross"></i><b class="hue" id="rbHue"></b></div></div>
				<div class="rb-pan rb-mis" id="rbMis"></div>
				<div class="rb-pan p-term"><h4>Terminal</h4><div class="rb-term" id="rbTerm"></div></div>
			</div>
		</div>
		<div class="rb-ov" id="rbOv"><div class="rb-card" id="rbCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const S = { errors:0, mission:0, learned:new Set() };
	let closed = false;

	/* ---------- scène ---------- */
	const canvas = $("canvas.rb-3d");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, stencil:true });   // 24 bits de profondeur sur iPhone
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.setClearColor("#e6eaee");
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#eef1f4");
	scene.add(new THREE.HemisphereLight("#ffffff", "#9aa5b1", 1.1));
	const sun = new THREE.DirectionalLight("#ffffff", 1.8); sun.position.set(4, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
	Object.assign(sun.shadow.camera, { left:-6, right:6, top:6, bottom:-6, near:1, far:30 }); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; scene.add(sun);
	const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color:c, roughness:.6, metalness:0, ...o });
	const add = (geo, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; (parent || scene).add(m); return m; };
	const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
	// sol de la cellule
	add(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI/2), M("#dfe4e9"), scene, 0, 0, 0, false);
	const grid = new THREE.GridHelper(30, 60, "#c4ccd4", "#d3d9df"); grid.position.y = .002; scene.add(grid);
	add(boxG(5.6, .02, .12), M("#f2c63c"), scene, .2, .011, 3.1, false);          // marquage de sécurité au sol

	/* ---------- le bras ---------- */
	const grey = M("#9aa3ad", { metalness:.5, roughness:.35 }), dark = M("#2b3138", { metalness:.3, roughness:.5 }), cyan = M("#21b6ce", { roughness:.45 }), white = M("#eef1f4", { roughness:.4 });
	const pedestal = add(new THREE.CylinderGeometry(.45, .55, .9, 24), grey, scene, 0, .45, 0);
	const base = new THREE.Group(); base.position.y = .9; scene.add(base);
	add(new THREE.CylinderGeometry(.42, .42, .3, 24), white, base, 0, .15, 0);
	const shoulder = new THREE.Group(); shoulder.position.y = SH - .9; base.add(shoulder);
	add(new THREE.CylinderGeometry(.24, .24, .5, 20).rotateX(Math.PI/2), dark, shoulder);
	add(boxG(L1, .26, .26), white, shoulder, L1/2, 0, 0); add(boxG(L1*.7, .06, .27), cyan, shoulder, L1/2, .1, 0, false);
	const elbow = new THREE.Group(); elbow.position.x = L1; shoulder.add(elbow);
	add(new THREE.CylinderGeometry(.19, .19, .42, 20).rotateX(Math.PI/2), dark, elbow);
	add(boxG(L2, .2, .2), white, elbow, L2/2, 0, 0); add(boxG(L2*.7, .05, .21), cyan, elbow, L2/2, .08, 0, false);
	const wrist = new THREE.Group(); wrist.position.x = L2; elbow.add(wrist);
	add(new THREE.CylinderGeometry(.13, .13, .32, 16).rotateX(Math.PI/2), dark, wrist);
	add(new THREE.CylinderGeometry(.08, .08, .16, 12), grey, wrist, 0, -.12, 0);
	add(boxG(.36, .07, .22), dark, wrist, 0, -.22, 0);
	const fingers = [-1, 1].map(s => add(boxG(.05, .26, .16), M("#f28a3c", { roughness:.5 }), wrist, s*.13, -.38, 0));
	// caméra embarquée sur la pince (vue de dessous, vers les doigts)
	const cam2 = new THREE.PerspectiveCamera(70, 4/3, .05, 40); cam2.position.set(0, -.27, .17); cam2.rotation.set(-Math.PI/2 + .22, 0, 0); wrist.add(cam2);

	/* ---------- postes : socle de pièce, bacs, tapis ---------- */
	const stand = add(boxG(.6, .55, .6), M("#cfd6dd"), scene, 1.46, .275, 1.22);
	const bins = {};
	function makeBin(key, x, z, color, label){
		const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
		const m = M(color, { roughness:.55 });
		add(boxG(.9, .1, .9), m, g, 0, .05, 0);
		for(const [w, d, px, pz] of [[.9, .06, 0, .42], [.9, .06, 0, -.42], [.06, .9, .42, 0], [.06, .9, -.42, 0]]) add(boxG(w, .7, d), m, g, px, .35, pz);
		const t = document.createElement("canvas"); t.width = 128; t.height = 48; const x2 = t.getContext("2d"); x2.fillStyle = "#fff"; x2.font = "bold 30px Arial"; x2.textAlign = "center"; x2.fillText(label, 64, 34);
		const tag = new THREE.Mesh(new THREE.PlaneGeometry(.7, .26), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(t), transparent:true })); tag.position.set(0, .45, .456); g.add(tag);
		bins[key] = { g, x, z, half:.36 };
		return g;
	}
	makeBin("main", 1.15, -1.4, "#3b4c5f", "BAC");
	makeBin("orange", -1.25, -1.35, "#d9782d", "ORANGE");
	makeBin("bleu", .15, -1.85, "#2f6f8f", "BLEU");
	const BELT = { z:1.75, y:.9, x0:-3.6, stop:.62 };
	const conv = new THREE.Group(); scene.add(conv);
	add(boxG(4.6, .12, .7), dark, conv, -1.4, BELT.y - .06, BELT.z);
	const beltTex = (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#3c434b"; x.fillRect(0, 0, 64, 64); x.fillStyle = "#4b535c"; x.fillRect(0, 0, 8, 64); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(18, 1); return t; })();
	add(new THREE.PlaneGeometry(4.5, .62).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:beltTex, roughness:.8 }), conv, -1.4, BELT.y + .001, BELT.z, false);
	for(const x of [-3.4, -1.4, .6]) for(const z of [-.3, .3]) add(boxG(.08, BELT.y - .1, .08), grey, conv, x, (BELT.y - .1)/2, BELT.z + z);
	const stopper = add(boxG(.06, .16, .7), M("#d6213a"), conv, BELT.stop + .2, BELT.y + .08, BELT.z);
	const sensor = add(new THREE.CylinderGeometry(.05, .05, .5, 10), grey, conv, BELT.stop, BELT.y + .25, BELT.z - .45);
	const sensorLed = add(new THREE.SphereGeometry(.05, 10, 8), M("#555", { emissive:"#000" }), conv, BELT.stop, BELT.y + .52, BELT.z - .45, false);
	conv.visible = false;

	/* ---------- pièces ---------- */
	const parts = [];
	function makePart(color, x, y, z, extra = {}){
		const mesh = add(boxG(CUBE, CUBE, CUBE), M(color, { roughness:.45 }), scene, x, y + CUBE/2, z);
		const p = { mesh, held:false, vy:0, falling:false, onBelt:false, ...extra };
		parts.push(p); return p;
	}
	function clearParts(){ parts.forEach(p => scene.remove(p.mesh)); parts.length = 0; held = null; }

	/* ---------- cinématique ---------- */
	const J = [30, 55, 95];          // base, épaule, coude (pliage) en degrés
	let gripOpen = true, grip = 1, held = null;
	function applyJoints(){
		base.rotation.y = -J[0]*D2R;
		shoulder.rotation.z = J[1]*D2R;
		elbow.rotation.z = -J[2]*D2R;
		wrist.rotation.z = -(J[1] - J[2])*D2R;        // la pince reste verticale
	}
	function tip(j = J){
		const a2 = j[1]*D2R, a3 = -j[2]*D2R;
		const r = L1*Math.cos(a2) + L2*Math.cos(a2 + a3), h = L1*Math.sin(a2) + L2*Math.sin(a2 + a3);
		return new THREE.Vector3(r*Math.cos(j[0]*D2R), SH + h - TOOL, r*Math.sin(j[0]*D2R));
	}
	function ik(p){
		const a1 = Math.atan2(p.z, p.x)*R2D, r = Math.hypot(p.x, p.z), yw = p.y + TOOL - SH;
		let D = Math.hypot(r, yw); D = Math.min(D, L1 + L2 - .001);
		const c3 = (D*D - L1*L1 - L2*L2)/(2*L1*L2), a3 = -Math.acos(Math.max(-1, Math.min(1, c3)));
		const a2 = Math.atan2(yw, r) - Math.atan2(L2*Math.sin(a3), L1 + L2*Math.cos(a3));
		return [a1, a2*R2D, -a3*R2D];
	}
	// collision : la pince ne descend jamais dans le sol, les bacs ou le tapis
	function floorAt(x, z){
		let f = 0;
		if(Math.abs(x - 1.46) < .3 && Math.abs(z - 1.22) < .3) f = .55;
		if(conv.visible && x > -3.7 && x < .9 && Math.abs(z - BELT.z) < .35) f = BELT.y;
		for(const b of Object.values(bins)) if(Math.abs(x - b.x) < .45 && Math.abs(z - b.z) < .45) f = Math.max(f, (Math.abs(x - b.x) > b.half || Math.abs(z - b.z) > b.half) ? .7 : .1);
		return f;
	}

	/* ---------- interface ---------- */
	const ctl = $("#rbCtl"), mis = $("#rbMis"), term = $("#rbTerm");
	function log(t, cls = ""){ const d = document.createElement("div"); if(cls) d.className = cls; d.textContent = ">> " + t; term.appendChild(d); while(term.children.length > 40) term.firstChild.remove(); term.scrollTop = term.scrollHeight; }
	function err(t){ S.errors++; play("bad"); onEvent && onEvent("err", t); $("#rbErr").textContent = `${S.errors} erreur${S.errors > 1 ? "s" : ""}`; if(t) log(t, "ko"); }
	function stage(t){ $("#rbSt").textContent = t; onEvent && onEvent("stage", t); }
	function sys(t){ $("#rbSys").textContent = "● " + t; }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="rb-course"><span class="tag">📚 En ${formation.name} · ${y}</span><b>${n}</b>${t}</div>`; }
	function card(html){ $("#rbCard").innerHTML = html; $("#rbOv").hidden = false; }
	function uncard(){ $("#rbOv").hidden = true; }
	function setGauges(){
		[[1, J[0], 360], [2, J[1], 180], [3, J[2], 180]].forEach(([i, v, max]) => { const el = $("#g" + i); el.style.setProperty("--a", `${Math.abs(v)/max*360}deg`); el.firstElementChild.textContent = Math.round(v); });
	}

	/* ---------- effort moteur (courbe) ---------- */
	const fc = $("canvas.rb-force"), fx = fc.getContext("2d"), force = new Array(120).fill(0);
	let lastJ = J.slice();
	function drawForce(dt){
		const v = J.reduce((s, a, i) => s + Math.abs(a - lastJ[i]), 0)/Math.max(dt, .001); lastJ = J.slice();
		const load = held ? 22 : 0, grav = Math.cos(J[1]*D2R)*18 + 10;
		force.push(Math.min(100, grav + load + v*.25 + Math.random()*2)); force.shift();
		fx.clearRect(0, 0, 240, 70);
		fx.strokeStyle = "#e3e8ed"; fx.lineWidth = 1; for(let y=10; y<70; y+=20){ fx.beginPath(); fx.moveTo(0, y); fx.lineTo(240, y); fx.stroke(); }
		fx.beginPath(); force.forEach((f, i) => fx.lineTo(i*2, 68 - f*.6)); fx.lineTo(240, 70); fx.lineTo(0, 70); fx.fillStyle = "rgba(33,182,206,.18)"; fx.fill();
		fx.beginPath(); force.forEach((f, i) => i ? fx.lineTo(i*2, 68 - f*.6) : fx.moveTo(0, 68 - f*.6)); fx.strokeStyle = "#0b7a8e"; fx.lineWidth = 2; fx.stroke();
	}

	/* ---------- pince : saisir / lâcher ---------- */
	function closeGrip(){
		gripOpen = false;
		const t = tip();
		const p = parts.find(p => !p.held && !p.falling && Math.hypot(p.mesh.position.x - t.x, p.mesh.position.z - t.z) < .2 && Math.abs(p.mesh.position.y - t.y) < .2);
		if(p){ held = p; p.held = true; p.onBelt = false; play("good"); log("Saisie : OK (capteur de pince)"); return true; }
		log("Saisie : rien entre les doigts", "inf"); return false;
	}
	function openGrip(){
		gripOpen = true;
		if(!held) return null;
		const p = held; held = null; p.held = false; p.falling = true; p.vy = 0;
		return p;
	}
	function landing(p){
		const x = p.mesh.position.x, z = p.mesh.position.z;
		for(const [k, b] of Object.entries(bins)) if(Math.abs(x - b.x) < b.half - .1 && Math.abs(z - b.z) < b.half - .1) return { y:.1, bin:k };
		return { y:floorAt(x, z), bin:null };
	}

	/* ---------- mouvements programmés (interpolation des articulations) ---------- */
	let motion = null;
	function moveTo(target, speed = 80){
		const tj = ik(target);
		let d0 = tj[0] - J[0]; d0 = ((d0 + 540) % 360) - 180; tj[0] = J[0] + d0;
		const dur = Math.max(.35, Math.max(...tj.map((v, i) => Math.abs(v - J[i])))/speed);
		return new Promise(res => { motion = { from:J.slice(), to:tj, t:0, dur, res }; });
	}
	const wait = ms => new Promise(r => setTimeout(r, ms));
	const above = (x, z, y) => new THREE.Vector3(x, y, z);

	/* ===================== MISSION 1 · L1 · Prends la main ===================== */
	let m1 = null;
	function mission1(){
		S.mission = 1; stage("Mission 1 · L1"); sys("Pilotage manuel");
		conv.visible = false; clearParts(); uncard();
		J.splice(0, 3, 0, 70, 110); gripOpen = true;
		m1 = { part:makePart("#2f7fd1", 1.46, .55, 1.22), done:false, dropped:0 };
		mis.innerHTML = `<span class="k">Mission 1 · L1 · mécanique</span><b class="t">Prends la main</b>
			<p>Pilote les <b>trois articulations</b> du bras pour saisir la <b>pièce bleue</b> sur son socle, puis dépose-la dans le <b>BAC</b> gris.</p>
			<p class="live" id="m1live"></p>`;
		ctl.innerHTML = `<h4>Commande manuelle</h4>
			<label class="rb-sl">Base<input type="range" min="-180" max="180" step="1" data-j="0"><span></span></label>
			<label class="rb-sl">Épaule<input type="range" min="0" max="150" step="1" data-j="1"><span></span></label>
			<label class="rb-sl">Coude<input type="range" min="0" max="160" step="1" data-j="2"><span></span></label>
			<button class="rb-btn" id="m1grip">✊ Fermer la pince</button>`;
		syncSliders();
		ctl.querySelectorAll("input[data-j]").forEach(inp => inp.addEventListener("input", () => {
			const j = +inp.dataset.j, prev = J[j]; J[j] = +inp.value;
			const t = tip();
			if(t.y < floorAt(t.x, t.z) + .08 || t.y < .08){ J[j] = prev; inp.value = prev; if(!m1.bumped){ m1.bumped = true; err("Collision évitée : la pince touche une surface. Remonte l'épaule."); setTimeout(() => m1 && (m1.bumped = false), 1200); } }
			syncSliders(true);
		}));
		$("#m1grip").addEventListener("click", () => {
			play("pop");
			if(gripOpen){ closeGrip(); } else { const p = openGrip(); if(p) log("Pince ouverte : la pièce tombe"); }
			$("#m1grip").textContent = gripOpen ? "✊ Fermer la pince" : "✋ Ouvrir la pince";
		});
		log("Mission 1 : pilotage manuel des articulations", "inf");
		log("Indice : tourne la BASE vers la pièce, puis descends avec l'ÉPAULE et le COUDE");
	}
	function syncSliders(keep){
		ctl.querySelectorAll("input[data-j]").forEach(inp => { const j = +inp.dataset.j; if(!keep) inp.value = J[j]; inp.nextElementSibling.textContent = Math.round(J[j]) + "°"; });
	}
	function m1tick(){
		if(!m1 || m1.done) return;
		const t = tip(), p = m1.part.mesh.position;
		const d = Math.hypot(p.x - t.x, p.z - t.z, p.y - t.y);
		const live = $("#m1live");
		if(live) live.textContent = held ? "Pièce saisie ✓ : vise le BAC puis ouvre la pince" : `Distance pince ↔ pièce : ${d.toFixed(2).replace(".", ",")} m${d < .25 ? " · ferme la pince !" : ""}`;
	}
	function m1landed(p, where){
		if(where.bin === "main"){ m1.done = true; play("win"); log("Pièce déposée dans le bac ✓"); setTimeout(() => card(`<div class="k">Mission 1 réussie</div><h2>Tu as piloté un bras robot</h2>
			<p>Trois articulations, trois angles : la base oriente, l'épaule et le coude règlent la portée et la hauteur. C'est la <b>cinématique</b> d'un robot.</p>
			${course("meca")}<button class="rb-btn dark" data-a="m2">Mission 2 · programmer la cellule →</button>`), 700); }
		else { err("La pièce est tombée hors du bac. Elle revient sur son socle."); setTimeout(() => { if(!m1 || m1.done) return; p.mesh.position.set(1.46, .55 + CUBE/2, 1.22); }, 900); }
	}

	/* ===================== MISSION 2 · L2 · Programme la cellule ===================== */
	const BLOCKS = {
		wait: ["⏳", "Attendre une pièce (capteur)"],
		belt: ["↘️", "Aller au-dessus du tapis"],
		grip: ["✊", "Saisir"],
		bin:  ["↗️", "Aller au-dessus du bac"],
		drop: ["✋", "Déposer"]
	};
	let m2 = null;
	function mission2(){
		S.mission = 2; stage("Mission 2 · L2"); sys("Ligne de production");
		uncard(); clearParts(); m1 = null; conv.visible = true; gripOpen = true;
		J.splice(0, 3, 40, 80, 110);
		m2 = { prog:[], running:false, delivered:0, spawn:0, stop:false };
		mis.innerHTML = `<span class="k">Mission 2 · L2 · robotique industrielle</span><b class="t">Programme la cellule</b>
			<p>Des pièces arrivent sur le <b>tapis</b> et s'arrêtent contre la butée rouge. Compose le <b>cycle</b> que le robot va répéter pour les ranger dans le <b>BAC</b>.</p>
			<p class="live" id="m2live">Pièces rangées : 0 / 3</p>`;
		ctl.innerHTML = `<h4>Blocs de programme</h4><div class="rb-blocks">${Object.entries(BLOCKS).map(([k, [i, t]]) => `<button class="rb-blk" data-b="${k}">${i} ${t}</button>`).join("")}</div>
			<h4 style="margin-top:10px">Cycle (répété en boucle)</h4><ol class="rb-prog" id="m2prog"></ol>
			<button class="rb-btn" id="m2run">▶ Lancer le cycle</button><button class="rb-btn alt" id="m2clr">Effacer</button>`;
		ctl.querySelectorAll("[data-b]").forEach(b => b.addEventListener("click", () => { if(m2.running || m2.prog.length >= 8) return; play("pop"); m2.prog.push(b.dataset.b); renderProg(); }));
		$("#m2clr").addEventListener("click", () => { if(m2.running) return; m2.prog = []; renderProg(); });
		$("#m2run").addEventListener("click", runProg);
		renderProg();
		log("Mission 2 : la ligne démarre. Une pièce toutes les 4 s.", "inf");
	}
	function renderProg(){
		const ol = $("#m2prog"); if(!ol) return;
		ol.innerHTML = m2.prog.map((k, i) => `<li data-i="${i}">${BLOCKS[k][0]} ${BLOCKS[k][1]}<button data-del="${i}" aria-label="Retirer">✕</button></li>`).join("");
		ol.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); if(m2.running) return; m2.prog.splice(+b.dataset.del, 1); renderProg(); }));
	}
	const beltPart = () => parts.find(p => p.onBelt && !p.held && Math.abs(p.mesh.position.x - BELT.stop) < .06);
	async function runProg(){
		if(m2.running) return;
		if(!m2.prog.length){ log("Le cycle est vide : ajoute des blocs", "ko"); return; }
		m2.running = true; $("#m2run").disabled = true; sys("Cycle en cours");
		log("Lancement du cycle", "inf");
		let failed = false;
		for(let cycle = 0; cycle < 4 && !failed && m2.delivered < 3 && !closed; cycle++){
			for(let i = 0; i < m2.prog.length && !failed && !closed; i++){
				const k = m2.prog[i];
				$("#m2prog").querySelectorAll("li").forEach((li, j) => li.classList.toggle("run", j === i));
				log(BLOCKS[k][1] + "…");
				if(k === "wait"){
					let w = 0; while(!beltPart() && w < 90 && !closed){ await wait(100); w++; }
					if(!beltPart()){ failed = true; err("Délai dépassé : aucune pièce au capteur"); }
					else log("Capteur : pièce présente ✓");
				} else if(k === "belt"){
					await moveTo(above(BELT.stop, BELT.z, BELT.y + .8));
				} else if(k === "grip"){
					const t = tip();
					if(Math.hypot(t.x - BELT.stop, t.z - BELT.z) > .3 && Math.hypot(t.x - bins.main.x, t.z - bins.main.z) > .3){ failed = true; err("Saisir : la pince n'est au-dessus de rien"); break; }
					await moveTo(above(t.x, t.z, Math.max(floorAt(t.x, t.z), BELT.y) + CUBE/2), 60);
					const ok = closeGrip(); await wait(250);
					await moveTo(above(t.x, t.z, BELT.y + .8), 60);
					if(!ok){ failed = true; err("Saisie ratée : la pièce n'était pas encore arrivée. Pense au capteur !"); }
				} else if(k === "bin"){
					await moveTo(above(bins.main.x, bins.main.z, 1.35));
				} else if(k === "drop"){
					if(!held){ failed = true; err("Déposer : la pince est vide"); break; }
					const t = tip(), p = openGrip(); await wait(500);
					if(Math.hypot(t.x - bins.main.x, t.z - bins.main.z) > .35){ failed = true; err("Pièce lâchée hors du bac"); }
				}
			}
			if(!failed && !closed){
				log(`Fin du cycle ${cycle + 1}`, "inf");
				if(m2.delivered === 0 && cycle === 0 && !parts.some(p => p.inBin)){ failed = true; err("Le cycle s'est terminé sans ranger de pièce : vérifie l'ordre des blocs"); }
			}
		}
		$("#m2prog") && $("#m2prog").querySelectorAll("li").forEach(li => li.classList.remove("run"));
		m2.running = false; if($("#m2run")) $("#m2run").disabled = false;
		if(closed) return;
		if(m2.delivered >= 3){ sys("Production OK"); play("win"); setTimeout(() => card(`<div class="k">Mission 2 réussie</div><h2>Ta cellule tourne toute seule</h2>
			<p>Attendre le capteur, se placer, saisir, déplacer, déposer… et recommencer. Un automate répète ce cycle des milliers de fois par jour, sans se tromper d'ordre.</p>
			${course("indus")}<button class="rb-btn dark" data-a="ms">Mission 3 · régler le moteur →</button>`), 600); }
		else { sys("Cycle arrêté"); log("Corrige le cycle puis relance-le", "inf"); }
	}
	function m2tick(dt){
		if(!m2 || S.mission !== 2) return;
		m2.spawn -= dt;
		const queue = parts.filter(p => p.onBelt).length;
		if(m2.spawn <= 0 && queue < 3 && m2.delivered + parts.filter(p => p.onBelt || p.held).length < 4){ m2.spawn = 4; makePart("#2f7fd1", BELT.x0, BELT.y, BELT.z, { onBelt:true }); }
	}

	/* ===================== MISSION 3 · L2 · Règle le moteur (asservissement) ===================== */
	// épaule : θ'' = P·(cible − θ) − (D + frottement)·θ'  (le bras porte une pièce : il ne doit ni traîner, ni osciller)
	const SERVO = { from:40, to:80, T:2.5, tol:2, over:4, settle:1.5 };
	let ms = null;
	function servoSim(kp, kd){
		const dt = 1/240, tr = []; let th = SERVO.from, v = 0;
		for(let i = 0; i < SERVO.T/dt; i++){ v += (kp*(SERVO.to - th) - (kd + .6)*v)*dt; th += v*dt; if(i % 4 === 0) tr.push(th); }
		const step = 4*dt, over = Math.max(0, Math.max(...tr) - SERVO.to);
		let settle = null;
		for(let i = 0; i < tr.length; i++) if(tr.slice(i).every(x => Math.abs(x - SERVO.to) <= SERVO.tol)){ settle = i*step; break; }
		return { tr, step, over, settle };
	}
	function missionServo(){
		S.mission = "servo"; stage("Mission 3 · L2"); sys("Banc de réglage");
		uncard(); clearParts(); m2 = null; conv.visible = false;
		J.splice(0, 3, 0, SERVO.from, 100); applyJoints();
		const t = tip(), p = makePart("#c94f2c", t.x, t.y - .02, t.z); held = p; p.held = true; gripOpen = false;
		ms = { kp:6, kd:0, running:false, tries:0, done:false };
		mis.innerHTML = `<span class="k">Mission 3 · L2 · automatique</span><b class="t">Règle le moteur</b>
			<p>Le moteur de l'épaule doit lever la pièce de <b>${SERVO.from}°</b> à <b>${SERVO.to}°</b> : vite, sans dépasser la cible de plus de ${SERVO.over}°, et stable à ±${SERVO.tol}° en moins de ${String(SERVO.settle).replace(".", ",")} s. Règle le <b>gain</b> (la force de rattrapage) et l'<b>amortissement</b> (le frein), puis lance l'essai.</p>
			<p class="live" id="mslive">Réglage d'usine : regarde d'abord ce qu'il donne</p>`;
		ctl.innerHTML = `<h4>Réponse du moteur d'épaule</h4>
			<canvas class="rb-resp" id="msplot" width="480" height="240"></canvas>
			<label class="rb-sl" style="grid-template-columns:100px 1fr 40px">Gain (P)<input type="range" min="2" max="60" step="1" id="mskp"><span id="mskpv"></span></label>
			<label class="rb-sl" style="grid-template-columns:100px 1fr 40px">Amortiss. (D)<input type="range" min="0" max="14" step=".5" id="mskd"><span id="mskdv"></span></label>
			<button class="rb-btn" id="msrun">▶ Lancer l'essai</button>`;
		const sync = () => { $("#mskp").value = ms.kp; $("#mskd").value = ms.kd; $("#mskpv").textContent = ms.kp; $("#mskdv").textContent = String(ms.kd).replace(".", ","); };
		$("#mskp").addEventListener("input", e => { ms.kp = +e.target.value; sync(); });
		$("#mskd").addEventListener("input", e => { ms.kd = +e.target.value; sync(); });
		$("#msrun").addEventListener("click", runServo);
		sync(); plotServo(null, 0);
		log("Mission 3 : banc de réglage du moteur d'épaule (charge : 1 pièce)", "inf");
	}
	function plotServo(r, upto){
		const c = $("#msplot"); if(!c) return;
		const x = c.getContext("2d"), W = c.width, H = c.height, pad = 26;
		const X = t => pad + (W - pad - 8)*t/SERVO.T, Y = a => H - pad - (H - pad - 10)*(a - 30)/70;       // angles de 30° à 100°
		x.clearRect(0, 0, W, H);
		x.fillStyle = "rgba(59,209,111,.18)"; x.fillRect(X(0), Y(SERVO.to + SERVO.tol), X(SERVO.T) - X(0), Y(SERVO.to - SERVO.tol) - Y(SERVO.to + SERVO.tol));
		x.fillStyle = "rgba(255,77,94,.10)"; x.fillRect(X(0), Y(100), X(SERVO.T) - X(0), Y(SERVO.to + SERVO.over) - Y(100));
		x.strokeStyle = "#c9d2db"; x.lineWidth = 1.5; x.setLineDash([6, 6]);
		x.beginPath(); x.moveTo(X(SERVO.settle), 10); x.lineTo(X(SERVO.settle), H - pad); x.stroke(); x.setLineDash([]);
		x.strokeStyle = "#1e305e"; x.lineWidth = 2; x.beginPath(); x.moveTo(X(0), Y(SERVO.to)); x.lineTo(X(SERVO.T), Y(SERVO.to)); x.stroke();
		x.fillStyle = "#5b6b7a"; x.font = "800 18px Nunito, sans-serif";
		x.fillText("cible " + SERVO.to + "°", X(0) + 6, Y(SERVO.to) - 8); x.fillText(String(SERVO.settle).replace(".", ",") + " s", X(SERVO.settle) + 6, H - pad - 6);
		x.fillText("0 s", X(0) - 4, H - 4); x.fillText(String(SERVO.T).replace(".", ",") + " s", X(SERVO.T) - 40, H - 4);
		if(!r) return;
		x.strokeStyle = "#0b7a8e"; x.lineWidth = 3.5; x.beginPath();
		r.tr.forEach((a, i) => { if(i > upto) return; const px = X(i*r.step), py = Y(Math.max(30, Math.min(100, a))); i ? x.lineTo(px, py) : x.moveTo(px, py); });
		x.stroke();
	}
	async function runServo(){
		if(ms.running || ms.done) return;
		ms.running = true; ms.tries++; $("#msrun").disabled = true; sys("Essai en cours");
		const r = servoSim(ms.kp, ms.kd);
		log(`Essai ${ms.tries} : gain ${ms.kp}, amortissement ${String(ms.kd).replace(".", ",")}`);
		const t0 = performance.now();
		await new Promise(res => {
			const step = () => {
				if(closed) return res();
				const t = Math.min(SERVO.T, (performance.now() - t0)/1000), i = Math.min(r.tr.length - 1, Math.floor(t/r.step));
				J[1] = r.tr[i]; plotServo(r, i);
				if(t < SERVO.T) requestAnimationFrame(step); else res();
			};
			requestAnimationFrame(step);
		});
		if(closed) return;
		ms.running = false; $("#msrun").disabled = false;
		const ok = r.over <= SERVO.over && r.settle !== null && r.settle <= SERVO.settle;
		const over = r.over.toFixed(1).replace(".", ","), st = r.settle === null ? "jamais" : r.settle.toFixed(2).replace(".", ",") + " s";
		if(ok){
			ms.done = true; sys("Moteur réglé"); play("win");
			$("#mslive").textContent = `Dépassement ${over}° · stable en ${st} ✓`;
			log(`Réglage validé : dépassement ${over}°, stable en ${st}`);
			setTimeout(() => card(`<div class="k">Mission 3 réussie</div><h2>Ton moteur est rapide et doux</h2>
				<p>Trop de gain, le bras fouette et oscille ; trop d'amortissement, il traîne. Entre les deux, il arrive vite et s'arrête net : c'est le réglage d'un asservissement, comme dans un drone ou une voiture autonome.</p>
				${course("auto")}<button class="rb-btn dark" data-a="m3">Mission 4 · donner des yeux au robot →</button>`), 500);
			return;
		}
		// le premier essai (réglage d'usine) sert à voir le problème : il ne compte pas comme une erreur
		if(ms.tries > 1) err();
		sys("Réglage à revoir");
		const hint = r.settle === null && r.over > 12 ? "Ça oscille : ajoute de l'amortissement (D)"
			: r.over > SERVO.over ? `Dépassement de ${over}° : la pièce serait secouée, augmente l'amortissement (D)`
			: "Trop lent : augmente le gain (P), ou réduis l'amortissement";
		$("#mslive").textContent = `Dépassement ${over}° · stable : ${st}. ${hint}`;
		log(hint, ms.tries > 1 ? "ko" : "inf");
	}

	/* ===================== MISSION 4 · L3 · Vision ===================== */
	// teintes mesurées par la caméra (degrés) ; « orange » vs « bleu », avec deux cas limites dus à la lampe jaune de la cellule
	// (une pièce orange qui paraît jaune, une bleue qui tire sur le vert) : la couleur affichée est celle que voit la caméra
	const TRAIN = [[14, "orange"], [22, "orange"], [30, "orange"], [41, "orange"], [58, "orange"], [178, "bleu"], [190, "bleu"], [203, "bleu"], [212, "bleu"], [165, "bleu"]];
	const TEST = [33, 196, 55, 170, 18, 208, 47, 184];
	const truth = h => h < 110 ? "orange" : "bleu";
	let m3 = null;
	function mission3(){
		S.mission = 3; stage("Mission 4 · L3"); sys("Vision");
		uncard(); clearParts(); m2 = null; conv.visible = true; gripOpen = true;
		J.splice(0, 3, 40, 80, 110);
		m3 = { th:200, running:false, i:0, ok:0, done:false };
		mis.innerHTML = `<span class="k">Mission 4 · L3 · vision et IA embarquée</span><b class="t">Donne-lui des yeux</b>
			<p>La caméra mesure la <b>teinte</b> de chaque pièce. Voici 10 exemples déjà étiquetés : règle la <b>frontière</b> qui sépare les pièces <b>orange</b> des <b>bleues</b>. Attention : sous la lampe jaune de la cellule, une pièce orange peut paraître jaune, et une bleue tirer sur le vert. Puis lance le tri automatique.</p>
			<p class="live" id="m3live">Objectif : au moins 7 pièces sur 8 bien triées</p>`;
		ctl.innerHTML = `<h4>Entraînement : exemples étiquetés</h4>
			<div class="rb-hue" id="m3hue"></div>
			<div class="rb-legend"><span>● haut : orange</span><span>● bas : bleu</span></div>
			<label class="rb-sl" style="grid-template-columns:62px 1fr 46px">Frontière<input type="range" min="0" max="240" step="1" id="m3th"><span id="m3thv"></span></label>
			<p class="live" id="m3train" style="font-size:13px;font-weight:800;margin:4px 0"></p>
			<button class="rb-btn" id="m3run">▶ Lancer le tri automatique</button>`;
		$("#m3th").value = m3.th;
		$("#m3th").addEventListener("input", e => { m3.th = +e.target.value; renderHue(); });
		$("#m3run").addEventListener("click", runSort);
		renderHue();
		log("Mission 4 : la caméra de la pince mesure la teinte (0 à 240°)", "inf");
	}
	function renderHue(){
		const el = $("#m3hue"); if(!el) return;
		const errs = TRAIN.filter(([h, l]) => (h < m3.th ? "orange" : "bleu") !== l).length;
		el.innerHTML = TRAIN.map(([h, l]) => `<i class="${l === "orange" ? "" : "a"} ${(h < m3.th ? "orange" : "bleu") !== l ? "err" : ""}" style="left:${h/240*100}%;background:hsl(${h},70%,55%)" title="${h}°"></i>`).join("") + `<span class="th" style="left:${m3.th/240*100}%"></span>`;
		$("#m3thv").textContent = m3.th + "°";
		$("#m3train").textContent = errs ? `Erreurs sur les exemples : ${errs} (entourées en rouge)` : "Aucune erreur sur les exemples ✓";
	}
	async function runSort(){
		if(m3.running) return;
		m3.running = true; m3.ok = 0; $("#m3run").disabled = true; $("#m3th").disabled = true; sys("Tri automatique");
		clearParts();
		for(let i = 0; i < TEST.length && !closed; i++){
			const h = TEST[i];
			const p = makePart(`hsl(${h},70%,55%)`, BELT.stop - 1.4, BELT.y, BELT.z, { onBelt:true, hue:h });
			let w = 0; while(!beltPart() && w < 80 && !closed){ await wait(100); w++; }
			await moveTo(above(BELT.stop, BELT.z, BELT.y + .8), 140);
			$("#rbHue").textContent = `Teinte : ${h}°`;
			await moveTo(above(BELT.stop, BELT.z, BELT.y + CUBE/2), 110);
			closeGrip(); await wait(150);
			const guess = h < m3.th ? "orange" : "bleu", good = guess === truth(h);
			log(`Pièce ${i + 1} : teinte ${h}° → bac ${guess} ${good ? "✓" : "✗ (c'était " + truth(h) + ")"}`, good ? "" : "ko");
			await moveTo(above(BELT.stop, BELT.z, BELT.y + .8), 130);
			$("#rbHue").textContent = "";
			const b = bins[guess];
			await moveTo(above(b.x, b.z, 1.35), 150);
			openGrip(); await wait(250);
			if(good) m3.ok++; else err();
			$("#m3live").textContent = `Bien triées : ${m3.ok} / ${i + 1}`;
		}
		if(closed) return;
		m3.running = false; $("#m3run").disabled = false; $("#m3th").disabled = false;
		if(m3.ok >= 7){ sys("Tri validé"); finale(); }
		else { sys("Tri à revoir"); log(`Seulement ${m3.ok} / 8 : déplace la frontière pour ne plus te tromper sur les exemples limites`, "inf"); }
	}

	/* ===================== fin ===================== */
	function finale(){
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 8 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention);
		play("win");
		const order = ["meca", "indus", "auto"].filter(k => S.learned.has(k)).concat("vision");
		card(`<div class="k">Cellule validée · mention ${mention}</div><h2>Tu as fait le travail d'un ingénieur robotique</h2>
			<div class="rb-big">🦾✅</div>
			${course("vision")}
			<p>En quatre missions, tu as touché à ${order.length} cours de la licence : piloter un bras, programmer une ligne, régler un moteur, donner la vue à une machine. ${e ? `Erreurs en chemin : ${e}.` : "Sans une seule erreur !"}</p>
			<ul>${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="rb-btn dark" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="rb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la ${formation.name} ↗</a>
			<button class="rb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="rb-alt" data-a="replay">Rejouer</button>`);
	}
	function intro(){
		stage("Cellule robotique"); conv.visible = true; clearParts();
		makePart("#2f7fd1", 1.46, .55, 1.22);
		card(`<div class="k">Mini-jeu · ${formation.name}</div><h2>Cellule robotique Wenov</h2>
			<div class="rb-big">🦾</div>
			<p>Bienvenue sur le plateau robotique de l'<b>École du Numérique</b>. Ta mission : faire fonctionner cette cellule, avec les outils de chaque année de la licence.</p>
			<ul><li><span>L1</span>Piloter les articulations du bras</li><li><span>L2</span>Programmer le cycle de la ligne</li><li><span>L2</span>Régler le moteur d'une articulation</li><li><span>L3</span>Lui donner des yeux pour trier</li></ul>
			<button class="rb-btn dark" data-a="m1">Entrer dans la cellule</button>`);
	}

	/* ---------- boucle ---------- */
	const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
	camera.position.set(6.4, 5.4, 7.6);
	const controls = new OrbitControls(camera, canvas);
	controls.target.set(-.1, .8, .1);
	if(matchMedia("(max-width:820px)").matches){ camera.position.set(6.2, 5.2, 7.4); controls.target.set(-.3, 1.05, .3); }       // vue plus basse et plus large sur téléphone : le bras entier dans le cadre
	controls.enableDamping = true; controls.maxPolarAngle = 1.45; controls.minDistance = 4; controls.maxDistance = 18; controls.update();
	const clock = new THREE.Clock();
	let raf = 0;
	function viewRect(el){
		const r = el.getBoundingClientRect(), H = innerHeight;
		return { x:r.left, y:H - r.bottom, w:r.width, h:r.height, visible:r.bottom > 0 && r.top < H && r.width > 10 && r.height > 10 };
	}
	function resize(){ renderer.setSize(innerWidth, innerHeight, false); }
	addEventListener("resize", resize); resize();
	function loop(){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
		// mouvement programmé
		if(motion){
			motion.t += dt;
			const k = Math.min(1, motion.t/motion.dur), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
			for(let i=0;i<3;i++) J[i] = motion.from[i] + (motion.to[i] - motion.from[i])*e;
			if(k >= 1){ const r = motion.res; motion = null; r(); }
		}
		applyJoints();
		grip += ((gripOpen ? 1 : 0) - grip)*Math.min(1, dt*10);
		fingers.forEach((f, i) => f.position.x = (i ? 1 : -1)*(.07 + .07*grip));
		// pièces : tenue, chute, tapis
		const tp = tip();
		const queue = parts.filter(p => p.onBelt && !p.held).sort((a, b) => b.mesh.position.x - a.mesh.position.x);
		queue.forEach((p, i) => { const lim = BELT.stop - i*(CUBE + .08); p.mesh.position.x = Math.min(lim, p.mesh.position.x + dt*.9); });
		beltTex.offset.x -= dt*.9/4.5*18 % 1;
		sensorLed.material.emissive.set(beltPart() ? "#3bd16f" : "#000"); sensorLed.material.color.set(beltPart() ? "#3bd16f" : "#555");
		for(const p of parts){
			if(p.held){ p.mesh.position.set(tp.x, tp.y - .02, tp.z); continue; }
			if(p.falling){
				p.vy -= 9.8*dt; p.mesh.position.y += p.vy*dt;
				const L = landing(p);
				if(p.mesh.position.y - CUBE/2 <= L.y){
					p.mesh.position.y = L.y + CUBE/2; p.falling = false; p.inBin = L.bin;
					if(S.mission === 1 && m1) m1landed(p, L);
					if(S.mission === 2 && m2 && L.bin === "main"){ m2.delivered++; const live = $("#m2live"); if(live) live.textContent = `Pièces rangées : ${m2.delivered} / 3`; log(`Pièce rangée ✓ (${m2.delivered}/3)`); play("good"); }
					if(L.bin && L.bin !== "main") setTimeout(() => scene.remove(p.mesh), 2500);
				}
			}
		}
		m1tick(); m2tick(dt);
		if(Math.round(t*30) % 2 === 0) { setGauges(); drawForce(dt*2); }
		controls.update();
		// rendu : vue principale dans le cadre central, caméra de la pince dans son cadre
		renderer.setScissorTest(true);
		renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.setScissor(0, 0, innerWidth, innerHeight); renderer.clear();
		const v = viewRect($(".rb-view")), c = viewRect($("#rbCam"));
		if(v.visible){ camera.aspect = v.w/v.h; camera.updateProjectionMatrix(); renderer.setViewport(v.x, v.y, v.w, v.h); renderer.setScissor(v.x, v.y, v.w, v.h); renderer.render(scene, camera); }
		if(c.visible){ cam2.aspect = c.w/c.h; cam2.updateProjectionMatrix(); renderer.setViewport(c.x, c.y, c.w, c.h); renderer.setScissor(c.x, c.y, c.w, c.h); renderer.render(scene, cam2); }
		renderer.setScissorTest(false);
	}

	/* ---------- actions ---------- */
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "m1") return mission1();
		if(k === "m2") return mission2();
		if(k === "ms") return missionServo();
		if(k === "m3") return mission3();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ S.errors = 0; S.learned = new Set(); $("#rbErr").textContent = "0 erreur"; term.innerHTML = ""; return mission1(); }
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); removeEventListener("resize", resize); document.removeEventListener("keydown", onKey);
		controls.dispose(); renderer.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".rb-x").addEventListener("click", close);
	// sur écran tactile, au premier lancement : la vue 3D se tourne au doigt (indication jusqu'au premier geste)
	{
		let seen = false; try { seen = localStorage.getItem("campusfges:rbHint") === "1"; } catch(e){}
		const h = $(".rb-hint");
		if(!seen && matchMedia("(pointer: coarse)").matches){
			let shown = false;
			const hide = () => { h.hidden = true; try { localStorage.setItem("campusfges:rbHint", "1"); } catch(e){} };
			// montrée quand la carte d'accueil se ferme (la vue est alors visible)
			const mo = new MutationObserver(() => { if($("#rbOv").hidden && !shown){ shown = true; h.hidden = false; setTimeout(hide, 7000); mo.disconnect(); } });
			mo.observe($("#rbOv"), { attributes:true, attributeFilter:["hidden"] });
			canvas.addEventListener("pointerdown", () => { if(shown) hide(); });
		}
	}
	applyJoints(); setGauges(); intro(); loop();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["L1 · Prends la main", mission1], ["L2 · Programme la cellule", mission2], ["L2 · Règle le moteur", missionServo], ["L3 · Donne-lui des yeux", mission3]]);
	if(window.campus) window.campus.game = { S, J, tip, ik, mission1, mission2, missionServo, mission3, get ms(){ return ms; }, get m2(){ return m2; }, get m3(){ return m3; } };
}
