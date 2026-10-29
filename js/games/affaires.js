/* « Une journée de chargé d'affaires » — mini-jeu du Master Management des Banques et Institutions Financières (MBIF).
   Le geste métier du chargé d'affaires en cinq rendez-vous, un par thème : l'écoute, la sensibilité, la bienveillance,
   l'accompagnement et l'expertise. On ne découvre pas un portefeuille de clients, on découvre des personnes.
   Une agence en maquette 3D (coupe de maison de poupée) ; à chaque rendez-vous, la caméra plonge dans l'univers du client :
   l'iceberg de Karim, le salon de Mme Lefèvre, le pont d'Inès et Tom, l'usine de Duval Textiles, la tour de la famille Martin.
   Le joueur choisit l'ordre de ses rendez-vous. Clients fictifs. Contenu à relire par l'équipe du master. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MOBILE = 760;
const THEMES = [["ecoute", "Écoute", "👂"], ["sens", "Sensibilité", "🔎"], ["bienv", "Bienveillance", "🤝"], ["accomp", "Accompagnement", "🧭"], ["expert", "Expertise", "🎓"]];
const MOOD_ICON = { neutre:"😐", inquiet:"😟", agace:"😠", rassure:"🙂", ravi:"😄" };
const MOOD_TXT = { neutre:"Neutre", inquiet:"Inquiet", agace:"Agacé", rassure:"Rassuré", ravi:"Ravi" };

const CSS = `
.ca{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1d2a36;background:#16222c;animation:caIn .35s ease both;overflow:hidden}
@keyframes caIn{from{opacity:0}to{opacity:1}}
.ca canvas{position:absolute;left:0;top:0;display:block;touch-action:none}
.ca-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;pointer-events:none}
.ca-top>*{pointer-events:auto}
.ca-chip{background:rgba(251,250,246,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(5,10,20,.3)}
.ca-stage{background:#1f6f78;color:#fff}
.ca-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(251,250,246,.95);font-size:22px;cursor:pointer}
.ca-meters{position:absolute;z-index:2;left:12px;top:60px;display:flex;flex-wrap:wrap;gap:6px;pointer-events:none;max-width:calc(100% - 24px)}
.ca-m{background:rgba(251,250,246,.94);border-radius:10px;padding:5px 10px;font-size:13px;font-weight:800;box-shadow:0 4px 12px rgba(5,10,20,.25);display:flex;flex-direction:column;line-height:1.15}
.ca-m[hidden]{display:none}
.ca-m small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#5f6b75}
.ca-m.pop{animation:caPop .5s ease}
@keyframes caPop{40%{transform:scale(1.15)}}
.ca-hint{position:absolute;z-index:2;left:12px;background:rgba(10,20,30,.7);color:#e9f1f5;font-size:12px;font-weight:700;border-radius:999px;padding:5px 10px;pointer-events:none}
.ca-wrap{position:absolute;z-index:2;top:62px;right:12px;bottom:12px;width:420px;overflow:auto;border-radius:8px;scrollbar-width:thin}
.ca-card{background:#fbfaf6;border-radius:8px;box-shadow:0 18px 40px rgba(5,10,20,.45);padding:18px 18px 16px;position:relative;animation:caUp .35s cubic-bezier(.2,.8,.2,1) both;border-top:5px solid #1f6f78;min-height:calc(100% - 21px)}
@keyframes caUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:${MOBILE - 1}px){
	.ca-wrap{left:0;right:0;bottom:0;width:auto;border-radius:16px 16px 0 0;box-shadow:0 -10px 30px rgba(5,10,20,.35)}
	.ca-card{border-radius:16px 16px 0 0;padding:14px 14px 22px}
}
.ca-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1f6f78}
.ca-h{font:700 22px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px;color:#16324f}
.ca-p{margin:0 0 10px;color:#46525c;font-size:14.5px}
.ca-time{display:inline-block;font:700 13px Fraunces,Georgia,serif;background:#16324f;color:#f1e6c8;border-radius:6px;padding:3px 9px;margin-bottom:6px}
.ca-story{background:#eef4f5;border-left:4px solid #1f6f78;border-radius:4px;padding:10px 12px;margin:8px 0 12px;font-size:14px;color:#2b3a44}
.ca-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:#16324f;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:12px;text-align:center;text-decoration:none}
.ca-go[disabled]{opacity:.4;cursor:default}
.ca-alt{display:block;width:100%;border:2px solid #d5dde2;border-radius:12px;padding:12px;background:#fff;color:#16324f;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.ca-themes{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.ca-themes li{background:#fff;border:1px solid #dfe5e8;border-radius:8px;padding:8px 12px;font-size:14px}
.ca-themes li b{color:#16324f}
.ca-qn{display:flex;align-items:center;justify-content:space-between;margin:4px 0 8px;font-weight:800;font-size:14px;color:#16324f}
.ca-qn i{font-style:normal;letter-spacing:3px;font-size:18px}
.ca-qs{display:grid;gap:8px}
.ca-q{display:flex;gap:10px;align-items:center;text-align:left;border:2px solid #d5dde2;background:#fff;border-radius:12px;padding:12px;min-height:52px;font:800 14.5px/1.3 Nunito,sans-serif;cursor:pointer;color:#1d2a36;transition:border-color .2s,transform .15s}
.ca-q:before{content:"💬";font-size:18px}
.ca-q.nb:before{content:none}
.ca-q:hover:not([disabled]){border-color:#16324f;transform:translateX(3px)}
.ca-q[disabled]{cursor:default;opacity:.45}
.ca-q.used{opacity:.6;text-decoration:line-through}
.ca-q.ok{border-color:#3d7a55;background:#eef8f0;opacity:1;text-decoration:none}.ca-q.ko{border-color:#c4532f;background:#fdeceb;opacity:1;text-decoration:none}
.ca-log{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:8px}
.ca-log li{background:#fff;border:1px solid #dfe5e8;border-radius:10px;padding:9px 12px;font-size:13.5px;animation:caUp .3s both}
.ca-log li q{display:block;font-weight:800;color:#16324f;margin-bottom:3px}
.ca-log li q:before,.ca-log li q:after{content:""}
.ca-log li span{display:block;color:#46525c;font-style:italic}
.ca-tag{display:inline-block;margin-top:5px;font-size:12px;font-weight:800;border-radius:999px;padding:2px 9px}
.ca-tag.ok{background:#e3f4ea;color:#23704a}.ca-tag.mid{background:#f6efdc;color:#8a6a24}.ca-tag.ko{background:#fbe7e5;color:#b3261e}
.ca-ice{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.ca-ice li{border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700;background:#eaf3f8;color:#1d4a66}
.ca-ice li.top{background:#fff;border:2px solid #9cc4d9}
.ca-ice li.miss{background:#f1f1f1;color:#8a8f94;font-style:italic}
.ca-verdict{border-radius:10px;padding:10px 12px;margin:10px 0 8px;font-weight:800;font-size:15px;display:flex;align-items:center;gap:10px;animation:caUp .35s both}
.ca-verdict .st{font-size:20px;letter-spacing:2px}
.ca-verdict.s3{background:#e3f4ea;color:#23704a}.ca-verdict.s2{background:#f6efdc;color:#8a6a24}.ca-verdict.s1,.ca-verdict.s0{background:#fbe7e5;color:#b3261e}
.ca-tip{background:#fff8e6;border-left:4px solid #e0a33a;border-radius:4px;padding:8px 10px;font-size:13.5px;margin:8px 0}
.ca-course{background:#fff;border:2px solid #1f6f78;border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.ca-course .tag{display:inline-block;background:#e2f0f1;color:#1f5a62;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.ca-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.ca-course span{font-size:14px;color:#46525c}
.ca-epi{background:#16324f;color:#f1e6c8;border-radius:10px;padding:10px 12px;font-size:14px;margin:10px 0}
.ca-epi b{color:#fff}
.ca-agenda{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.ca-agenda button{width:100%;display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #dfe5e8;border-radius:10px;padding:8px 10px;font:13.5px Nunito,sans-serif;text-align:left;cursor:pointer;color:#1d2a36;transition:border-color .2s,transform .15s}
.ca-agenda button:hover:not([disabled]){border-color:#1f6f78;transform:translateX(3px)}
.ca-agenda button[disabled]{cursor:default}
.ca-agenda .h{font:700 13px Fraunces,Georgia,serif;color:#16324f;min-width:52px}
.ca-agenda .w{flex:1;line-height:1.25}.ca-agenda .w b{display:block;font-size:14px}.ca-agenda .w small{color:#5f6b75}
.ca-agenda .s{font-weight:800;font-size:12px;white-space:nowrap;color:#1f6f78}
.ca-agenda button.done{background:#f3f8f5}.ca-agenda button.done .s{color:#23704a;font-size:14px;letter-spacing:1px}
.ca-radar{display:block;margin:6px auto;width:100%;max-width:300px}
.ca-loupe{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:14px;color:#16324f;margin:6px 0}
.ca-loupe i{font-style:normal;font-size:17px;letter-spacing:2px}
.ca-objs summary{cursor:pointer;font-weight:800;font-size:13px;color:#1f6f78;margin:8px 0}
.ca-objs div{display:flex;flex-wrap:wrap;gap:6px}
.ca-objs button{border:2px solid #d5dde2;background:#fff;border-radius:999px;padding:6px 11px;font:800 12.5px Nunito,sans-serif;cursor:pointer;color:#1d2a36}
.ca-objs button[disabled]{opacity:.45;cursor:default}
.ca-found{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.ca-found li{background:#fff8e6;border-left:4px solid #e0a33a;border-radius:6px;padding:7px 10px;font-size:13.5px;font-weight:700;animation:caUp .3s both}
.ca-found li.no{background:#f4f4f4;border-color:#c9cdd1;color:#6f767c;font-weight:600}
.ca-plank{display:flex;gap:4px;margin:6px 0 10px}
.ca-plank i{flex:1;height:10px;border-radius:3px;background:#e3e7ea}
.ca-plank i.on{background:#9a6a3a}
.ca-who{font-weight:800;color:#16324f;font-size:14.5px;margin:4px 0 8px}
.ca-who span{color:#46525c;font-weight:700;font-style:italic}
.ca-exp{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ca-exp button{border:2px solid #d5dde2;background:#fff;border-radius:12px;padding:10px 8px;font:800 13px/1.25 Nunito,sans-serif;cursor:pointer;color:#1d2a36;text-align:center;min-height:64px}
.ca-exp button span{display:block;font-size:22px;margin-bottom:2px}
.ca-exp button:hover:not([disabled]){border-color:#16324f}
.ca-exp button[disabled]{opacity:.45;cursor:default}
.ca-exp button.ok{border-color:#3d7a55;background:#eef8f0;opacity:1}.ca-exp button.ko{border-color:#c4532f;background:#fdeceb;opacity:1}
.ca-years{display:flex;gap:6px;margin:4px 0 10px}
.ca-years span{flex:1;text-align:center;font:700 12px Fraunces,Georgia,serif;border-radius:6px;padding:4px 0;background:#e3e7ea;color:#7a858d}
.ca-years span.on{background:#16324f;color:#f1e6c8}.ca-years span.ok{background:#3d7a55;color:#fff}.ca-years span.ko{background:#c4532f;color:#fff}
.ca-needs{list-style:none;padding:0;margin:6px 0 10px;display:grid;gap:5px}
.ca-needs li{font-size:13.5px;font-weight:700;padding:6px 10px;border-radius:8px;background:#f1f3f5;color:#46525c}
.ca-needs li.on{background:#e3f4ea;color:#23704a}
.ca-needs li.on:before{content:"✓ "}
.ca-prods{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.ca-prods button{display:flex;gap:8px;align-items:center;text-align:left;border:2px solid #d5dde2;background:#fff;border-radius:10px;padding:8px;font:800 12.5px/1.2 Nunito,sans-serif;cursor:pointer;color:#1d2a36}
.ca-prods button i{font-style:normal;font-size:20px}
.ca-prods button small{display:block;font-weight:600;color:#5f6b75;font-size:11.5px;margin-top:2px}
.ca-prods button:hover:not([disabled]){border-color:#16324f}
.ca-prods button[disabled]{opacity:.4;cursor:default}
.ca-prods button.ok{border-color:#3d7a55;background:#eef8f0;opacity:1}.ca-prods button.ko{border-color:#c4532f;background:#fdeceb;opacity:1}
.ca-cr{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0 10px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 0 0 1px #e3e7ea}
.ca-cr td{padding:6px 10px;border-top:1px solid #e3e7ea}.ca-cr td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.ca-cr tr.t td{background:#eef4f5;font-weight:800;color:#16324f}.ca-cr tr.neg td:last-child{color:#b3261e}
.ca-sig{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ca-sig button{border:2px solid #d5dde2;background:#fff;border-radius:12px;padding:10px;font:700 13px/1.3 Nunito,sans-serif;text-align:left;cursor:pointer;color:#1d2a36}
.ca-sig button b{display:block;font:700 18px Fraunces,Georgia,serif;color:#16324f;margin-bottom:2px}
.ca-sig button[aria-pressed=true]{border-color:#16324f;box-shadow:0 0 0 3px rgba(22,50,79,.18)}
.ca-sig button.ok{border-color:#3d7a55;background:#eef8f0}.ca-sig button.ko{border-color:#c4532f;background:#fdeceb}.ca-sig button.miss{border-color:#e0a33a;background:#fff8e6}
.ca-boss{background:linear-gradient(135deg,#16324f,#1f6f78);color:#fff;border-radius:12px;padding:10px 12px;margin-bottom:10px;display:flex;gap:10px;align-items:center}
.ca-boss i{font-style:normal;font-size:28px}.ca-boss b{display:block;font:700 17px Fraunces,Georgia,serif}.ca-boss small{opacity:.85;font-weight:700}
@media (max-width:520px){ .ca-sig{grid-template-columns:1fr} }
.ca-bubble{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;pointer-events:auto;cursor:pointer;transition:opacity .3s,transform .3s}
.ca-bubble.off{opacity:0;transform:translateY(8px);pointer-events:none}
.ca-bubble .av{flex:none;width:54px;height:54px;border-radius:50%;background:#16324f;display:grid;place-items:center;font-size:30px;box-shadow:0 4px 10px rgba(0,0,0,.35)}
.ca-bubble.k .av{background:#e0a33a}
.ca-bubble p{flex:1;position:relative;margin:0;background:#fbfaf6;border:2px solid #16324f;border-radius:14px;padding:8px 14px;font-size:14.5px;font-weight:700;line-height:1.35;color:#16324f;box-shadow:0 8px 20px rgba(0,0,0,.3);min-height:20px}
.ca-bubble p:before{content:"";position:absolute;left:-9px;top:50%;width:14px;height:14px;background:#fbfaf6;border:2px solid #16324f;border-top:0;border-right:0;transform:translateY(-50%) rotate(45deg)}
.ca-bubble p b{display:block;font:800 10.5px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#1f6f78;margin-bottom:2px}
@media (max-width:520px){ .ca-bubble .av{width:40px;height:40px;font-size:22px} .ca-bubble p{font-size:12.5px;padding:6px 10px} .ca-m{padding:4px 8px;font-size:12px} .ca-m small{display:none} .ca-h{font-size:19px} .ca-q{font-size:13.5px;padding:10px} .ca-prods{grid-template-columns:1fr} }
`;

/* ================= la maquette 3D ================= */
// les univers des clients, posés autour de l'agence
const U = { karim:new THREE.Vector3(70, 0, 0), lefevre:new THREE.Vector3(-70, 0, 0), couple:new THREE.Vector3(0, 0, -80), duval:new THREE.Vector3(70, 0, -80), martin:new THREE.Vector3(-70, 0, -80) };
const BOT = -7.2;                                // fond de la mer, sous l'iceberg de Karim
const LEVELS = [1, -2, -4.2, -6.6];              // niveau de l'eau : il baisse à chaque besoin découvert
const SLOTS = [[-1.7, -1.1, 3.55], [1.6, -3.3, 3.45], [-.4, -5.4, 3.2]];

function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#16222c"); scene.fog = new THREE.Fog("#16222c", 60, 130);
	const camera = new THREE.PerspectiveCamera(36, 1, .1, 260);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 5; controls.maxDistance = 40; controls.maxPolarAngle = 1.45;
	scene.add(new THREE.HemisphereLight("#fff6e8", "#2a3a48", 1.15));
	// un seul soleil porte les ombres : il suit la caméra d'un univers à l'autre
	const sun = new THREE.DirectionalLight("#fff3dc", 2.1); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-15, right:15, top:15, bottom:-15, near:1, far:60 }); sun.shadow.bias = -.0005;
	scene.add(sun, sun.target);
	const light = c => { sun.position.set(c.x - 8, 18, c.z + 12); sun.target.position.copy(c); };
	light(new THREE.Vector3());

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.75, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
	// un texte dessiné sur une texture ne doit jamais déborder : on réduit la police jusqu'à ce qu'il tienne
	const fitFont = (x, text, maxW, size, weight = 800, family = "Nunito, sans-serif") => { let s = size; do { x.font = `${weight} ${s}px ${family}`; } while(x.measureText(text).width > maxW && --s > 8); return s; };
	const add = (...o) => { scene.add(...o); return o[0]; };
	const group = (c, parent = scene) => { const g = new THREE.Group(); g.position.copy(c); parent.add(g); return g; };
	const roof = (w, h, d, c) => { const sh = new THREE.Shape(); sh.moveTo(-w/2, 0); sh.lineTo(0, h); sh.lineTo(w/2, 0); sh.closePath(); return mesh(new THREE.ExtrudeGeometry(sh, { depth:d, bevelEnabled:false }), M(c)); };
	const sway = [], pendulums = [], wobble = [], spin = [];

	/* --- étiquettes (sprites dessinés au canvas), plus grandes sur téléphone --- */
	let LS = 1;
	function drawLabel(sp, text, o){
		const c = sp.userData.c || (sp.userData.c = document.createElement("canvas")), x = c.getContext("2d");
		const f = `800 ${o.big ? 60 : 44}px Nunito, system-ui, sans-serif`; x.font = f;
		const w = Math.ceil(x.measureText(text).width) + (o.bg ? 44 : 12), h = o.big ? 88 : 68;
		c.width = w; c.height = h; x.font = f;
		if(o.bg){ x.fillStyle = o.bg; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, h/2 - 2); x.fill(); if(o.line){ x.strokeStyle = o.line; x.lineWidth = 4; x.stroke(); } }
		x.fillStyle = o.fg || "#16324f"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 3);
		if(sp.material.map) sp.material.map.dispose();
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sp.material.map = t; sp.material.needsUpdate = true;
		const s = (o.size || .55)*LS; sp.scale.set(s*w/h, s, 1);
	}
	function label(text, o = {}){
		o = { bg:"#fbfaf6", ...o };
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false, transparent:true }));
		sp.renderOrder = 10; sp.userData.o = o; drawLabel(sp, text, o); return sp;
	}
	const relabel = (sp, text, o) => drawLabel(sp, text, { ...sp.userData.o, ...(o || {}) });

	/* --- les personnages : des pions à visage, qui changent d'expression (inquiet, neutre, rassuré, ravi, agacé) --- */
	function drawFace(x, mood, skin, hair){
		// le visage est dessiné en grand : il doit se lire même quand le pion est loin
		const W = 256, H = 128, cx = 64, ey = 58, my = 80;
		x.fillStyle = skin; x.fillRect(0, 0, W, H);
		if(hair){ x.fillStyle = hair; x.fillRect(0, 0, W, 30); x.fillRect(112, 0, 144, 92); x.fillRect(0, 0, 18, 92); }
		x.strokeStyle = x.fillStyle = "#2a1d14"; x.lineCap = "round"; x.lineWidth = 5;
		const line = (a, b, c, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); };
		const curve = (a, b, cx2, cy2, c, d) => { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(cx2, cy2, c, d); x.stroke(); };
		for(const s of [-1, 1]){
			if(mood === "ravi"){ x.beginPath(); x.arc(cx + s*14, ey + 4, 6.5, Math.PI*1.1, Math.PI*1.9); x.stroke(); }
			else { x.beginPath(); x.ellipse(cx + s*14, ey, 4.6, mood === "inquiet" ? 7 : 6, 0, 0, Math.PI*2); x.fill(); }
			if(mood === "inquiet") line(cx + s*7, ey - 16, cx + s*21, ey - 10);
			if(mood === "agace") line(cx + s*7, ey - 9, cx + s*21, ey - 16);
		}
		if(mood === "ravi" || mood === "rassure"){ x.fillStyle = "rgba(225,95,95,.45)"; for(const s of [-1, 1]){ x.beginPath(); x.arc(cx + s*24, my - 8, 6.5, 0, Math.PI*2); x.fill(); } x.fillStyle = "#2a1d14"; }
		if(mood === "ravi"){ x.beginPath(); x.moveTo(cx - 14, my - 4); x.quadraticCurveTo(cx, my + 18, cx + 14, my - 4); x.closePath(); x.fill(); }
		else if(mood === "rassure") curve(cx - 11, my - 2, cx, my + 9, cx + 11, my - 2);
		else if(mood === "inquiet") curve(cx - 10, my + 4, cx, my - 6, cx + 10, my + 4);
		else if(mood === "agace") curve(cx - 10, my + 6, cx, my - 4, cx + 10, my + 6);
		else line(cx - 9, my, cx + 9, my);
	}
	const P = {};                                // id → personnage
	function person(id, o){
		const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); scene.add(g);
		const m = M(o.body, { roughness:.5 });
		inner.add(mesh(new THREE.CylinderGeometry(.42, .46, .16, 28), m, 0, .08, 0));
		inner.add(mesh(new THREE.CylinderGeometry(.16, .34, .84, 24), m, 0, .56, 0));
		inner.add(mesh(new THREE.CylinderGeometry(.24, .2, .1, 24), M(o.collar || o.body), 0, 1, 0));
		const fc = document.createElement("canvas"); fc.width = 256; fc.height = 128;
		const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
		inner.add(mesh(new THREE.SphereGeometry(.27, 32, 20), new THREE.MeshStandardMaterial({ map:ft, roughness:.6 }), 0, 1.3, 0));
		if(o.hat) o.hat(inner);
		const icon = label("", { bg:null, size:.62, big:1 }); icon.position.set(.32, 1.95, 0); icon.visible = false; g.add(icon);
		let name = null;
		if(o.name){ name = label(o.name, { size:.36, fg:"#fff", bg:o.tag || "#16324f" }); name.position.y = 2.05; g.add(name); }
		if(o.small) g.scale.setScalar(.82);
		const p = P[id] = { id, g, inner, icon, name, mood:"neutre", walk:null, react:null, phase:Math.random()*6,
			setMood(md){ p.mood = md; drawFace(fc.getContext("2d"), md, o.skin || "#f1c9a5", o.hair); ft.needsUpdate = true;
				const ic = { inquiet:"💦", agace:"💢", ravi:"✨" }[md]; icon.visible = !!ic; if(ic) relabel(icon, ic); },
			setHair(c){ o.hair = c; p.setMood(p.mood); } };
		p.setMood("neutre");
		return p;
	}
	const toque = inner => { const w = M("#ffffff", { roughness:.9 }); inner.add(mesh(new THREE.CylinderGeometry(.22, .2, .26, 20), w, 0, 1.62, 0)); for(const [x, z] of [[-.1, 0], [.1, 0], [0, .1], [0, -.1], [0, 0]]) inner.add(mesh(new THREE.SphereGeometry(.15, 14, 10), w, x, 1.8, z)); };
	const casque = inner => inner.add(mesh(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI*2, 0, Math.PI/2), M("#e9b62c", { roughness:.4 }), 0, 1.36, 0));
	const sac = inner => inner.add(mesh(new THREE.BoxGeometry(.3, .24, .12), M("#5a2d1e"), .38, .5, .05));
	const chignon = inner => inner.add(mesh(new THREE.SphereGeometry(.13, 12, 10), M("#d8d4cf"), 0, 1.5, -.18));

	/* --- l'agence : une coupe de maison de poupée, posée sur la table --- */
	const clock = { t:8*60 + 55, h:null, m:null }, steam = { at:null };
	{
		const tiles = tex(256, 256, (x, w) => { for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? "#e9e2d2" : "#dfd6c3"; x.fillRect(i*64, j*64, 64, 64); } x.strokeStyle = "rgba(0,0,0,.08)"; x.lineWidth = 2; for(let i = 0; i <= 4; i++){ x.beginPath(); x.moveTo(i*64, 0); x.lineTo(i*64, w); x.stroke(); x.beginPath(); x.moveTo(0, i*64); x.lineTo(w, i*64); x.stroke(); } });
		tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(5, 3.5);
		add(mesh(new THREE.BoxGeometry(19, .5, 13), [M("#5b4636"), M("#5b4636"), new THREE.MeshStandardMaterial({ map:tiles, roughness:.8 }), M("#5b4636"), M("#5b4636"), M("#5b4636")], 0, -.25, 0));
		add(box(19, 3.2, .3, "#efe9dc", 0, 0, -6.35), box(.3, 3.2, 13, "#efe9dc", -9.35, 0, 0));
		add(box(19, .35, .34, "#1f6f78", 0, 0, -6.33), box(.34, .35, 13, "#1f6f78", -9.33, 0, 0));
		// fenêtres sur la rue, au fond
		const sky = new THREE.MeshBasicMaterial({ map:tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#bcdcef"); g.addColorStop(1, "#f2ead6"); x.fillStyle = g; x.fillRect(0, 0, w, h); }) });
		for(const wx of [-7, -4.3]){ add(box(2.6, 1.9, .1, "#2e3d48", wx, .9, -6.2)); add(mesh(new THREE.PlaneGeometry(2.3, 1.6), sky, wx, 1.85, -6.13)).castShadow = false; add(box(.06, 1.6, .06, "#2e3d48", wx, 1.05, -6.1)); }
		// enseigne de l'agence (fictive)
		const sign = tex(512, 160, (x, w, h) => { x.fillStyle = "#16324f"; x.fillRect(0, 0, w, h); x.fillStyle = "#e0a33a"; x.fillRect(0, h - 14, w, 14); x.fillStyle = "#fff"; x.textAlign = "center"; fitFont(x, "Agence Vauban", w - 60, 56, 700, "Fraunces, Georgia, serif"); x.fillText("Agence Vauban", w/2, 74); fitFont(x, "PARTICULIERS · PROFESSIONNELS · ENTREPRISES", w - 48, 24); x.fillStyle = "#cfe0ea"; x.fillText("PARTICULIERS · PROFESSIONNELS · ENTREPRISES", w/2, 118); });
		add(mesh(new THREE.PlaneGeometry(3.4, 1.06), new THREE.MeshStandardMaterial({ map:sign }), -1, 2.3, -6.18)).castShadow = false;
		// l'accueil, où Sophie dirige l'agence
		add(box(3.2, 1.05, .9, "#16324f", -1.6, 0, -4.4), box(3.4, .08, 1.05, "#e9e2d2", -1.6, 1.05, -4.4));
		add(box(.5, .34, .05, "#222", -.9, 1.13, -4.6));
		// la salle d'attente
		for(const z of [-4.4, -3, -1.6, -.2, 1.2, 2.6]){ add(box(.8, .45, .8, "#1f6f78", -8.5, 0, z), box(.16, .9, .8, "#1f6f78", -8.95, .45, z)); }
		add(mesh(new THREE.CylinderGeometry(.8, .8, .08, 24), M("#c9b48f"), -6.9, .5, -.9), mesh(new THREE.CylinderGeometry(.08, .1, .5, 10), M("#555"), -6.9, .25, -.9));
		["#c0392b", "#2f5d9e", "#e0a33a"].forEach((c, i) => { const r = add(box(.5, .03, .66, c, -6.95 + i*.12, .54 + i*.03, -.9 - i*.08)); r.rotation.y = i*.3 - .3; });
		// la vitre du bureau du chargé d'affaires
		add(mesh(new THREE.BoxGeometry(.08, 2.5, 4.8), new THREE.MeshStandardMaterial({ color:"#bfe0ee", transparent:true, opacity:.28, roughness:.1 }), 1, 1.25, -3.8)).castShadow = false;
		add(box(.14, .12, 4.8, "#2e3d48", 1, 2.5, -3.8), box(.14, 2.6, .14, "#2e3d48", 1, 0, -1.4));
		// le bureau : le chargé d'affaires (toi) tourne le dos à la caméra, le client nous fait face
		add(mesh(new THREE.CylinderGeometry(2.8, 2.8, .03, 40), M("#a8c5c9"), 5, .015, -3));
		add(box(3.2, .85, 1.3, "#8a6a4a", 5, 0, -3), box(3.4, .08, 1.45, "#a9875f", 5, .85, -3));
		const screen = group(new THREE.Vector3(6.3, 0, -2.9)); screen.rotation.y = -.5;
		screen.add(box(.9, .58, .05, "#1d1d1d", 0, 1.05, 0), box(.12, .2, .12, "#333", 0, .93, 0));
		add(box(.5, .05, .7, "#f4f1ea", 4.2, .93, -3.1));
		steam.at = add(mesh(new THREE.CylinderGeometry(.11, .1, .22, 14), M("#e0a33a"), 3.75, 1.04, -2.7));
		for(const x of [4.3, 5.7]) add(box(.7, .42, .7, "#3d4a55", x, 0, -4.4), box(.7, .8, .14, "#3d4a55", x, .42, -4.83));
		add(box(.8, .45, .8, "#16324f", 5, 0, -1.4));
		// l'horloge murale : la journée avance de rendez-vous en rendez-vous
		add(mesh(new THREE.CylinderGeometry(.62, .62, .08, 36).rotateX(Math.PI/2), M("#fbfaf6"), 5, 2.45, -6.15));
		add(mesh(new THREE.TorusGeometry(.62, .05, 8, 36), M("#16324f"), 5, 2.45, -6.12));
		for(let i = 0; i < 12; i++){ const a = i/12*Math.PI*2; add(box(.04, .1, .02, "#16324f", 5 + Math.sin(a)*.5, 2.45 + Math.cos(a)*.5 - .05, -6.09)).rotation.z = -a; }
		const hand = (len, w) => { const g = group(new THREE.Vector3(5, 2.45, -6.07)); const h = new THREE.Mesh(new THREE.BoxGeometry(w, len, .02), M("#16324f")); h.position.y = len/2 - .05; g.add(h); return g; };
		clock.h = hand(.32, .06); clock.m = hand(.48, .04);
		// plantes (elles ondulent un peu)
		for(const [x, z] of [[8.4, -5.6], [-8.5, 4.6], [-4.4, -5.6]]) plant(scene, x, z);
	}
	function plant(parent, x, z, s = 1){
		parent.add(mesh(new THREE.CylinderGeometry(.42*s, .32*s, .7*s, 16), M("#c26b3c"), x, .35*s, z));
		const leaves = new THREE.Group(); leaves.position.set(x, .7*s, z); parent.add(leaves); sway.push(leaves);
		for(let i = 0; i < 7; i++){ const l = mesh(new THREE.ConeGeometry(.16*s, 1.1*s, 6), M(i % 2 ? "#3f7a4a" : "#559157"), Math.cos(i*.9)*.18*s, .5*s, Math.sin(i*.9)*.18*s); l.rotation.set(Math.sin(i*.9)*.5, 0, -Math.cos(i*.9)*.5); leaves.add(l); }
		return leaves;
	}

	/* --- objets à toucher sur la maquette (la loupe de Mme Lefèvre) --- */
	const pickables = [];
	let onPick = null, down = null;
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	const hitMat = new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false });
	function pickable(id, obj, r){ const hit = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), hitMat); hit.position.y = r*.6; hit.userData.pick = id; obj.add(hit); pickables.push(hit); }
	canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
	canvas.addEventListener("pointerup", e => {
		if(!onPick || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
		const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1);
		ray.setFromCamera(ndc, camera);
		const hit = ray.intersectObjects(pickables)[0];
		if(hit) onPick(hit.object.userData.pick);
	});

	/* ===== 1. l'univers de Karim : sa boulangerie au sommet d'un iceberg ===== */
	const water = { mesh:null, level:LEVELS[0] };
	const slotGroups = [];
	const flour = { origin:new THREE.Vector3() }, oven = { pos:new THREE.Vector3() };
	{
		const G = group(U.karim), at = (o, x, y, z) => { if(x !== undefined) o.position.set(x, y, z); G.add(o); return o; };
		at(mesh(new THREE.CylinderGeometry(11, 11.4, .6, 64), M("#d8c79a")), 0, BOT - .3, 0);
		at(mesh(new THREE.TorusGeometry(10.9, .12, 8, 96).rotateX(Math.PI/2), M("#2e3d48")), 0, BOT, 0);
		// algues qui ondulent et rochers
		for(let i = 0; i < 14; i++){ const a = i*2.4, r = 6.5 + (i % 3)*1.3; const s = at(new THREE.Group(), Math.cos(a)*r, BOT, Math.sin(a)*r); sway.push(s); for(let k = 0; k < 3; k++){ const c = mesh(new THREE.ConeGeometry(.12, 1 + k*.5, 5), M(k % 2 ? "#2f6b4a" : "#3f8a55")); c.position.set((k - 1)*.15, .5 + k*.2, 0); s.add(c); } }
		for(let i = 0; i < 8; i++){ const a = i*.8 + .3, r = 8 + (i % 2); at(mesh(new THREE.DodecahedronGeometry(.4 + (i % 3)*.25), M("#7d7a72")), Math.cos(a)*r, BOT + .2, Math.sin(a)*r); }
		// l'iceberg : un bloc de glace irrégulier, et sa pointe aplatie où se tient la boulangerie
		const ice = new THREE.MeshStandardMaterial({ color:"#eaf6fc", roughness:.35, metalness:.05, flatShading:true });
		const blob = (sx, sy, sz, y, seed) => { const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position; for(let i = 0; i < p.count; i++){ const k = 1 + .09*Math.sin(i*12.9898 + seed)*Math.cos(i*4.1 + seed); p.setXYZ(i, p.getX(i)*k, p.getY(i)*k, p.getZ(i)*k); } g.computeVertexNormals(); const m = mesh(g, ice); m.scale.set(sx, sy, sz); return at(m, 0, y, 0); };
		blob(4.3, 4.7, 3.5, -3.4, 1); blob(2.7, 1, 2.3, 1.3, 2);
		at(mesh(new THREE.CylinderGeometry(2.5, 2.8, .5, 9), ice), 0, 2, 0);
		// la boulangerie, la fumée du four en panne et la farine qui vole
		const shop = new THREE.Group();
		shop.add(box(1.9, 1.25, 1.4, "#f3e1c0", 0, 0, 0));
		const r = roof(2.1, .8, 1.6, "#a0522d"); r.position.set(0, 1.25, -.8); shop.add(r);
		shop.add(box(.5, .8, .05, "#6b3a1f", -.4, 0, .71), box(.6, .5, .05, "#ffe4a8", .45, .4, .71));
		const store = tex(256, 64, (x, w) => { x.fillStyle = "#6b3a1f"; x.fillRect(0, 0, w, 64); x.fillStyle = "#ffe9b8"; x.textAlign = "center"; fitFont(x, "Boulangerie", w - 24, 34, 700, "Fraunces, Georgia, serif"); x.fillText("Boulangerie", w/2, 44); });
		shop.add(mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshStandardMaterial({ map:store }), 0, 1.0, .72));
		for(let i = 0; i < 4; i++) shop.add(mesh(new THREE.CapsuleGeometry(.05, .4, 4, 8).rotateZ(Math.PI/2.4), M("#c98a3a"), .3 + i*.08, .45, .78));
		at(shop, -.7, 2.25, -.5);
		const ov = new THREE.Group();
		ov.add(box(1.1, .9, .9, "#4a4f55", 0, 0, 0), box(.7, .4, .05, "#2a2a2a", 0, .25, .46), box(.2, .7, .2, "#5b6066", .3, .9, -.2));
		at(ov, 1.25, 2.25, .35);
		oven.pos.set(U.karim.x + 1.55, 3.95, U.karim.z + .15);
		at(label("La demande : un crédit pour le four", { size:.42, bg:"#fbfaf6", line:"#9cc4d9" }), 1.1, 4.3, .4);
		flour.origin.set(U.karim.x - .9, 2.6, U.karim.z + .4);
		// l'eau : une colonne translucide dont le niveau baisse à chaque besoin découvert
		water.mesh = at(new THREE.Mesh(new THREE.CylinderGeometry(10.6, 10.6, 1, 64), new THREE.MeshStandardMaterial({ color:"#1c6a9e", transparent:true, opacity:.84, roughness:.3, metalness:0, depthWrite:false })), 0, 0, 0);
		water.mesh.renderOrder = 2;
		// trois blocs de glace givrés cachent les besoins que Karim n'a pas dits
		for(const [x, y, z] of SLOTS){
			const g = at(new THREE.Group(), x, y, z);
			const frost = mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color:"#f4fbff", roughness:.95, flatShading:true })); frost.scale.set(1.35, 1.05, .75); g.add(frost);
			const q = label("?", { bg:null, fg:"#7fb2cc", size:.9, big:1 }); q.position.set(0, 0, .9); q.material.depthTest = true; g.add(q);
			slotGroups.push({ g, frost, q, content:null, lab:null });
		}
	}
	// poissons et mouettes
	const fish = [], gulls = [];
	for(let i = 0; i < 4; i++){ const f = new THREE.Group(); f.add(mesh(new THREE.SphereGeometry(.25, 12, 8).scale(1.6, 1, .7), M(i % 2 ? "#f08a3a" : "#f2c33a"))); f.add(mesh(new THREE.ConeGeometry(.2, .35, 4).rotateZ(Math.PI/2), M("#e0702a"), -.5, 0, 0)); scene.add(f); fish.push({ f, r:6.4 + i*.8, y:-2.2 - i*1.1, s:.35 + i*.07, a:i*1.7 }); }
	for(let i = 0; i < 2; i++){ const g = new THREE.Group(); for(const s of [-1, 1]){ const w = mesh(new THREE.BoxGeometry(.6, .04, .16), M("#fbfaf6")); w.position.x = s*.28; w.rotation.z = s*.35; g.add(w); } scene.add(g); gulls.push({ g, c:U.karim, r:5 + i*2, y:6.5 + i, s:.5 - i*.15, a:i*3 }); }

	/* ===== 2. l'univers de Mme Lefèvre : son salon, plein de signaux faibles ===== */
	const clues = {};
	const cat = { body:null };
	{
		const G = group(U.lefevre), at = (o, x, y, z) => { if(x !== undefined) o.position.set(x, y, z); G.add(o); return o; };
		at(mesh(new THREE.CylinderGeometry(8.6, 8.9, .5, 48), M("#6b4a2e")), 0, -.25, 0);
		const parquet = tex(128, 128, (x, w) => { for(let i = 0; i < 8; i++){ x.fillStyle = ["#a7794d", "#b08356", "#9c6f45"][i % 3]; x.fillRect(0, i*16, w, 16); x.fillStyle = "rgba(0,0,0,.2)"; x.fillRect(0, i*16, w, 1); x.fillRect((i*37) % w, i*16, 1, 16); } });
		parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(4, 4);
		at(mesh(new THREE.CylinderGeometry(8.5, 8.5, .04, 48), new THREE.MeshStandardMaterial({ map:parquet, roughness:.7 })), 0, .02, 0);
		at(mesh(new THREE.CylinderGeometry(3.4, 3.4, .03, 40), M("#8f3a3a")), .3, .05, .9);
		at(mesh(new THREE.TorusGeometry(3.2, .06, 6, 60).rotateX(Math.PI/2), M("#d9b25a")), .3, .07, .9);
		// murs tapissés, fenêtre aux rideaux qui ondulent, horloge comtoise au balancier
		const wall = tex(128, 128, (x, w) => { x.fillStyle = "#e9d9b8"; x.fillRect(0, 0, w, w); x.fillStyle = "#d9c49c"; for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++) if((i + j) % 2){ x.beginPath(); x.arc(i*16 + 8, j*16 + 8, 3, 0, 7); x.fill(); } });
		wall.wrapS = wall.wrapT = THREE.RepeatWrapping; wall.repeat.set(6, 2);
		const wm = new THREE.MeshStandardMaterial({ map:wall, roughness:.9 });
		at(mesh(new THREE.BoxGeometry(13, 4.2, .3), wm), 0, 2.1, -6); at(mesh(new THREE.BoxGeometry(.3, 4.2, 10), wm), -6.5, 2.1, -1);
		at(box(13, .6, .34, "#6b4a2e", 0, 0, -5.98)); at(box(.34, .6, 10, "#6b4a2e", -6.48, 0, -1));
		at(box(2.6, 2.2, .1, "#f4efe4", -2.6, 1.3, -5.84)); at(mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ map:tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#a9cbe0"); g.addColorStop(1, "#e8dcc4"); x.fillStyle = g; x.fillRect(0, 0, w, h); }) })), -2.6, 2.4, -5.78);
		for(const s of [-1, 1]){ const c = at(new THREE.Group(), -2.6 + s*1.45, 3.55, -5.7); c.add(box(.5, 2.5, .12, "#a33b3b", 0, -2.5, 0)); sway.push(c); }
		at(box(.9, 2.8, .55, "#5a3a22", -5.6, 0, -4.9)); at(mesh(new THREE.CylinderGeometry(.3, .3, .05, 24).rotateX(Math.PI/2), M("#f4efe4"), -5.6, 2.35, -4.6));
		const pend = at(new THREE.Group(), -5.6, 1.9, -4.6); pend.add(box(.04, 1.1, .04, "#c9a548", 0, -1.1, 0), mesh(new THREE.CylinderGeometry(.16, .16, .04, 20).rotateX(Math.PI/2), M("#c9a548", { metalness:.6, roughness:.3 }), 0, -1.15, 0)); pendulums.push(pend);
		// le fauteuil où elle s'assoit, le canapé, la table basse et le thé
		at(box(1.3, .5, 1.2, "#6b7f5a", -1.6, 0, -1.4)); at(box(1.3, 1.2, .3, "#6b7f5a", -1.6, .5, -1.95)); for(const s of [-1, 1]) at(box(.25, .75, 1.2, "#5d6f4e", -1.6 + s*.65, 0, -1.4));
		at(box(3, .5, 1.1, "#8a6d4e", 2.6, 0, -3.4)); at(box(3, 1, .3, "#8a6d4e", 2.6, .5, -3.85));
		at(mesh(new THREE.CylinderGeometry(1, 1, .08, 28), M("#7a5636"), .4, .55, .5)); at(mesh(new THREE.CylinderGeometry(.12, .16, .55, 10), M("#5a3a22"), .4, .27, .5));
		for(const [x, z] of [[.1, .3], [.75, .55]]) at(mesh(new THREE.CylinderGeometry(.1, .08, .14, 14), M("#f4efe4"), x, .66, z));
		at(mesh(new THREE.SphereGeometry(.22, 16, 12), M("#f4efe4"), .35, .78, .9));
		// les indices (et les fausses pistes) que la loupe peut révéler
		const clue = (id, obj, x, z, r, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; G.add(obj); clues[id] = obj; pickable(id, obj, r); return obj; };
		{	// le manteau de son mari, toujours au portemanteau
			const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 10), M("#3a2616"), 0, 1.3, 0), mesh(new THREE.CylinderGeometry(.35, .4, .08, 16), M("#3a2616"), 0, .04, 0));
			g.add(box(.75, 1.45, .32, "#4d4a3f", 0, .95, .22)); g.add(mesh(new THREE.CylinderGeometry(.3, .3, .04, 18), M("#2b2a26"), 0, 2.5, .2), mesh(new THREE.CylinderGeometry(.18, .2, .25, 18), M("#2b2a26"), 0, 2.62, .2));
			clue("manteau", g, -5.2, 2.6, 1.3, .6);
		}
		{	// le buffet : la photo de Théo et le courrier du notaire
			at(box(3.4, 1.1, .8, "#6b4a2e", 3.2, 0, -5.4));
			const photo = new THREE.Group();
			photo.add(box(.75, .9, .07, "#c9a548", 0, 0, 0));
			photo.add(mesh(new THREE.PlaneGeometry(.6, .72), new THREE.MeshStandardMaterial({ map:tex(96, 120, (x, w, h) => { x.fillStyle = "#cfe0ea"; x.fillRect(0, 0, w, h); x.fillStyle = "#2a2a3a"; x.beginPath(); x.arc(48, 52, 18, 0, 7); x.fill(); x.fillRect(22, 74, 52, 46); x.fillStyle = "#e7b894"; x.beginPath(); x.arc(48, 56, 13, 0, 7); x.fill(); x.fillStyle = "#1a1a24"; x.fillRect(26, 30, 44, 8); x.fillRect(44, 22, 8, 8); x.fillStyle = "#e0a33a"; x.fillRect(66, 34, 3, 18); }) }), 0, .45, .04));
			photo.add(box(.06, .5, .3, "#c9a548", 0, 0, -.18));
			clue("photo", photo, 2.2, -5.25, .9, .15).position.y = 1.1;
			const letter = new THREE.Group(); const env = box(.8, .55, .03, "#f2ead6", 0, 0, 0); env.rotation.x = -.25; letter.add(env);
			letter.add(mesh(new THREE.CylinderGeometry(.08, .08, .04, 14).rotateX(Math.PI/2), M("#9b1c1c"), 0, .28, .06));
			const nl = label("Étude notariale", { size:.22, bg:null, fg:"#3b2a10" }); nl.position.set(0, .4, .1); nl.material.depthTest = true; letter.add(nl);
			clue("notaire", letter, 3.9, -5.15, .9, -.1).position.y = 1.1;
		}
		{	// des factures pas ouvertes, sur la petite table
			at(mesh(new THREE.CylinderGeometry(.55, .55, .06, 20), M("#7a5636"), 2.6, .7, 1.4)); at(mesh(new THREE.CylinderGeometry(.06, .08, .7, 10), M("#5a3a22"), 2.6, .35, 1.4));
			const g = new THREE.Group(); for(let i = 0; i < 6; i++){ const e = box(.6, .03, .4, i % 2 ? "#f2ead6" : "#fbf7ee", 0, i*.035, 0); e.rotation.y = (i - 3)*.18; g.add(e); }
			const r = label("!", { bg:"#c0392b", fg:"#fff", size:.28 }); r.position.set(.25, .35, 0); r.material.depthTest = true; g.add(r);
			clue("factures", g, 2.6, 1.4, .8).position.y = .73;
		}
		{	// fausses pistes : le chat qui dort, la télé, les plantes
			const c = new THREE.Group(), fur = M("#d9822b");
			cat.body = mesh(new THREE.SphereGeometry(.45, 16, 12), fur, 0, .3, 0); cat.body.scale.set(1.4, .7, 1); c.add(cat.body);
			c.add(mesh(new THREE.SphereGeometry(.26, 14, 10), fur, .6, .35, .1)); for(const z of [-.02, .22]) c.add(mesh(new THREE.ConeGeometry(.08, .16, 4), fur, .68, .58, z));
			c.add(mesh(new THREE.CapsuleGeometry(.07, .7, 4, 8).rotateZ(Math.PI/2), fur, -.7, .15, .3));
			clue("chat", c, -.9, 2.2, .9, .4);
			const tv = new THREE.Group(); tv.add(box(1.4, .7, .6, "#3a2a1e", 0, 0, 0), box(1.4, .85, .1, "#111", 0, .75, 0));
			tv.add(mesh(new THREE.PlaneGeometry(1.25, .72), new THREE.MeshBasicMaterial({ map:tex(64, 40, (x) => { const g = x.createLinearGradient(0, 0, 64, 40); g.addColorStop(0, "#5aa0e0"); g.addColorStop(1, "#e05a9a"); x.fillStyle = g; x.fillRect(0, 0, 64, 40); x.fillStyle = "#ffe066"; x.fillRect(20, 14, 24, 12); }) }), 0, 1.17, .06));
			clue("tele", tv, 5.6, -.6, 1, -1.2);
			const pl = new THREE.Group(); plant(pl, 0, 0, 1.2); pl.add(mesh(new THREE.CylinderGeometry(.18, .22, .4, 12), M("#4f8a6e"), .7, .2, .2));
			clue("plante", pl, 5.4, 2.6, 1);
		}
	}

	/* ===== 3. l'univers d'Inès et Tom : un pont à construire au-dessus du vide ===== */
	const bridge = { planks:[], river:null };
	{
		const G = group(U.couple), at = (o, x, y, z) => { if(x !== undefined) o.position.set(x, y, z); G.add(o); return o; };
		at(box(16, .4, 11, "#6b5a45", 0, -4.6, 0));
		const rt = tex(64, 64, (x, w) => { x.fillStyle = "#2f86b8"; x.fillRect(0, 0, w, w); x.strokeStyle = "rgba(255,255,255,.45)"; x.lineWidth = 3; for(let i = 0; i < 5; i++){ x.beginPath(); x.moveTo(0, i*13 + 4); x.quadraticCurveTo(32, i*13 - 4, 64, i*13 + 4); x.stroke(); } });
		rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(1, 3); bridge.river = rt;
		at(mesh(new THREE.PlaneGeometry(4.4, 11).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:rt, roughness:.2 })), 0, -4.15, 0);
		for(const s of [-1, 1]){
			at(box(6, 6.2, 11, "#a7744a", s*5, -4.2, 0)); at(box(6, .3, 11, "#7da35a", s*5, 2, 0));
			for(let i = 0; i < 5; i++) at(mesh(new THREE.DodecahedronGeometry(.5 + (i % 2)*.3), M("#8a5f3c")), s*(2.2 + (i % 2)*.2), -3.8 + i*1.2, -4 + i*2);
			for(const z of [-.95, .95]) at(box(.18, 1, .18, "#5a3a22", s*2.15, 2.3, z));
		}
		for(const z of [-.95, .95]) at(mesh(new THREE.CylinderGeometry(.03, .03, 4.3, 6).rotateZ(Math.PI/2), M("#c9a26a")), 0, 3.15, z);
		for(let i = 0; i < 5; i++){ const p = at(box(.74, .14, 1.8, "#9a6a3a", 0, 0, 0), -1.6 + i*.8, 2.1, 0); p.scale.setScalar(.001); p.visible = false; bridge.planks.push(p); }
		// leur futur chez-eux, et les cartons du déménagement
		const home = at(new THREE.Group(), 6, 2.3, -2.6);
		home.add(box(2.4, 2.4, 2, "#f1e2c6", 0, 0, 0)); const r = roof(2.7, 1.1, 2.2, "#c0392b"); r.position.set(0, 2.4, -1.1); home.add(r);
		for(const x of [-.6, .6]) home.add(box(.5, .5, .05, "#9fc3d8", x, 1.4, 1.01)); home.add(box(.5, .9, .05, "#6b3a1f", 0, 0, 1.01));
		const sold = label("🔑 Leur futur chez-eux", { size:.42, bg:"#fbfaf6", line:"#c0392b" }); sold.position.set(0, 4.1, 0); home.add(sold);
		for(const [x, y, z, s] of [[4.4, 2.3, 2.6, 1], [5.2, 2.3, 2.9, .9], [4.8, 2.95, 2.7, .8], [5.9, 2.3, 2.2, .8]]){ const c = at(new THREE.Group(), x, y, z); c.add(box(.7*s, .6*s, .6*s, "#c9a26a", 0, 0, 0), box(.72*s, .06*s, .12*s, "#8d7a5a", 0, .6*s, 0)); wobble.push(c); }
		gulls.push(...[0, 1].map(i => { const g = new THREE.Group(); for(const s of [-1, 1]){ const w = mesh(new THREE.BoxGeometry(.6, .04, .16), M("#fbfaf6")); w.position.x = s*.28; w.rotation.z = s*.35; g.add(w); } scene.add(g); return { g, c:U.couple, r:4 + i*2.5, y:6 + i, s:.45, a:i*2 }; }));
	}

	/* ===== 4. l'univers de Duval Textiles : une usine qui grandit sur un plateau tournant ===== */
	const factory = { plat:null, grow:{}, cloud:null, rain:null, sunL:null, bolt:null, year:null, truck:null, puffs:[] };
	{
		const G = group(U.duval), at = (o, x, y, z, p = G) => { if(x !== undefined) o.position.set(x, y, z); p.add(o); return o; };
		const plat = factory.plat = at(new THREE.Group(), 0, 0, -1);
		at(mesh(new THREE.CylinderGeometry(8.6, 8.9, .5, 56), M("#7c868c")), 0, -.25, 0, plat);
		at(mesh(new THREE.CylinderGeometry(8.5, 8.5, .04, 56), M("#9aa59a")), 0, .02, 0, plat);
		at(mesh(new THREE.RingGeometry(6.6, 7.6, 56).rotateX(-Math.PI/2), M("#4a4f55")), 0, .05, 0, plat);
		// l'usine : toits en dents de scie, cheminée, bobines de fil qui tournent
		const usine = at(new THREE.Group(), 0, 0, -.6, plat);
		usine.add(box(5.2, 2, 3.4, "#b85c3c", 0, 0, 0));
		for(let i = 0; i < 4; i++){ const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1.3, 0); sh.lineTo(1.3, .9); sh.closePath(); const t = mesh(new THREE.ExtrudeGeometry(sh, { depth:3.4, bevelEnabled:false }), M("#8a8f94")); t.position.set(-2.6 + i*1.3, 2, -1.7); usine.add(t); usine.add(box(.05, .8, 3.3, "#bfe0ee", -1.3 + i*1.3, 2, 0)); }
		usine.add(box(1.2, 1.2, .06, "#5a3a22", -1.2, 0, 1.71));
		const brand = label("DUVAL TEXTILES", { size:.4, bg:"#16324f", fg:"#fff" }); brand.position.set(.9, 1.5, 1.8); usine.add(brand);
		usine.add(mesh(new THREE.CylinderGeometry(.3, .4, 4.6, 16), M("#9b4a33"), 2.1, 2.3, -1.2));
		factory.chimney = new THREE.Vector3(U.duval.x, 4.8, U.duval.z);
		for(let i = 0; i < 3; i++){ const b = mesh(new THREE.CylinderGeometry(.32, .32, .7, 18), M(["#c0392b", "#2f5d9e", "#e0a33a"][i]), 0, 0, 0); b.position.set(-1.6 + i*.8, .35, 2.4); usine.add(b); spin.push(b); }
		// ce qui pousse quand l'entreprise est bien accompagnée
		const exp = at(new THREE.Group(), -4.4, 0, 2.2, plat); exp.add(box(2.4, 1.4, 1.8, "#d9d2c3", 0, 0, 0), box(2.5, .12, 1.9, "#6b6b6b", 0, 1.4, 0)); const fl = label("🇩🇪 Export", { size:.36 }); fl.position.y = 2; exp.add(fl); factory.grow.export = exp;
		const coins = at(new THREE.Group(), 4.2, 0, 2.4, plat); for(let i = 0; i < 3; i++) for(let k = 0; k < 4 + i; k++) coins.add(mesh(new THREE.CylinderGeometry(.24, .24, .08, 18), M("#d9a93a", { metalness:.7, roughness:.3 }), (i - 1)*.55, .05 + k*.09, 0)); const cl = label("💶 Trésorerie", { size:.36 }); cl.position.y = 1.3; coins.add(cl); factory.grow.coins = coins;
		const hall = at(new THREE.Group(), 4.3, 0, -1.6, plat); hall.add(box(2.4, 1.6, 2.2, "#e8eef0", 0, 0, 0)); for(let i = 0; i < 3; i++){ const s = box(.7, .05, 1.9, "#1d3557", -.8 + i*.8, 1.62, 0); s.rotation.z = .2; hall.add(s); } const hl = label("⚙️ Machine neuve", { size:.36 }); hl.position.y = 2.4; hall.add(hl); factory.grow.machine = hall;
		Object.values(factory.grow).forEach(g => { g.visible = false; g.scale.setScalar(.001); });
		// un camion fait le tour de l'usine
		const tr = factory.truck = at(new THREE.Group(), 7.1, 0, 0, plat); tr.add(box(1.4, .8, .7, "#f4f1ea", -.3, .15, 0), box(.5, .6, .66, "#1f6f78", .6, .15, 0)); for(const x of [-.6, .5]) for(const z of [-.33, .33]) tr.add(mesh(new THREE.CylinderGeometry(.15, .15, .1, 12).rotateX(Math.PI/2), M("#222"), x, .15, z));
		// devant le plateau, une estrade fixe pour M. Duval et les experts
		at(mesh(new THREE.CylinderGeometry(4.6, 4.8, .3, 40, 1, false, -Math.PI/2.6, Math.PI/1.3), M("#cfc9bb")), 0, -.15, 8.2);
		// la météo de l'entreprise : nuage, pluie, éclair ou soleil
		const cloud = factory.cloud = at(new THREE.Group(), 0, 7.6, -1);
		for(const [x, y, z, r] of [[0, 0, 0, 1.1], [1, -.2, .2, .85], [-1, -.2, -.1, .9], [.4, .5, 0, .8], [-.5, .4, .2, .7]]) cloud.add(mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshStandardMaterial({ color:"#c9ced3", roughness:1 }), x, y, z));
		cloud.visible = false;
		const rg = new THREE.BufferGeometry(), rp = new Float32Array(60*3); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
		factory.rain = at(new THREE.Points(rg, new THREE.PointsMaterial({ color:"#9fc3e8", size:.12 })), 0, 0, 0); factory.rain.visible = false;
		factory.sunL = at(label("☀️", { bg:null, size:1.8, big:1 }), 0, 8, -1); factory.sunL.visible = false;
		factory.bolt = at(label("⚡", { bg:null, size:1.8, big:1 }), .4, 5.8, -1); factory.bolt.visible = false;
		factory.year = at(label("2026", { size:.7, bg:"#16324f", fg:"#f1e6c8" }), -5.4, 5.4, -1);
		// les signaux de risque de 2029 : des stocks de fil qui s'entassent, une facture qui ne se paie pas
		const stock = factory.stock = at(new THREE.Group(), -3.4, 0, 2.6, plat);
		for(let i = 0; i < 14; i++){ const r = i < 6 ? 0 : i < 11 ? 1 : 2, k = i < 6 ? i : i < 11 ? i - 6 : i - 11; stock.add(mesh(new THREE.CylinderGeometry(.3, .3, .62, 14).rotateZ(Math.PI/2), M(["#9aa7b4", "#c9d1d8", "#7f8c99"][i % 3]), -1.25 + k*.62 + r*.31, .3 + r*.56, 0)); }
		const sl = factory.stockLab = label("📦 Stocks de fil", { size:.34 }); sl.position.y = 2.1; stock.add(sl);
		const unpaid = factory.unpaid = at(new THREE.Group(), 3.4, 0, 6.6);
		unpaid.add(box(.9, .05, 1.2, "#fbf7ee", 0, 1.3, 0), mesh(new THREE.CylinderGeometry(.05, .05, 1.3, 8), M("#5a3a22"), 0, .65, 0));
		const ul = factory.unpaidLab = label("🧾 Autolux : facture impayée", { size:.34, bg:"#fff", line:"#c0392b" }); ul.position.y = 1.9; unpaid.add(ul);
		[stock, unpaid].forEach(g => { g.visible = false; g.scale.setScalar(.001); });
	}

	/* ===== 5. l'univers de la famille Martin : la tour d'équilibre devant leur maison ===== */
	const tower = { g:null, blocks:[], tilt:0, falling:false };
	{
		const G = group(U.martin), at = (o, x, y, z) => { if(x !== undefined) o.position.set(x, y, z); G.add(o); return o; };
		at(mesh(new THREE.CylinderGeometry(8.6, 8.9, .5, 56), M("#5a4636")), 0, -.25, 0);
		at(mesh(new THREE.CylinderGeometry(8.5, 8.5, .04, 56), M("#7fae5c")), 0, .02, 0);
		const house = at(new THREE.Group(), -1.5, 0, -4.2);
		house.add(box(5.2, 2.3, 3, "#f1ece2", 0, 0, 0), box(5.5, .2, 3.3, "#4a4f55", 0, 2.3, 0), box(2.6, 1.3, 2.2, "#f1ece2", 1.2, 2.5, -.3), box(2.8, .16, 2.4, "#4a4f55", 1.2, 3.8, -.3));
		for(const x of [-1.6, -.2, 1.2]) house.add(box(.9, 1.3, .05, "#9fc3d8", x, .5, 1.51));
		const pool = at(mesh(new THREE.BoxGeometry(3.6, .12, 1.8), new THREE.MeshStandardMaterial({ color:"#4fb3d9", roughness:.1, metalness:.1 })), 3.9, .08, -2.6); tower.pool = pool;
		at(box(3.9, .1, 2.1, "#e9e2d2", 3.9, 0, -2.6));
		const tree = at(new THREE.Group(), -5.6, 0, -.8); tree.add(mesh(new THREE.CylinderGeometry(.2, .28, 1.8, 10), M("#6b4a2e"), 0, .9, 0)); const crown = new THREE.Group(); crown.position.y = 1.8; tree.add(crown); sway.push(crown);
		for(const [x, y, z, r] of [[0, .6, 0, 1.1], [.6, .3, .3, .8], [-.6, .4, -.2, .85], [0, 1.2, .1, .75]]) crown.add(mesh(new THREE.SphereGeometry(r, 14, 10), M("#4f8a45"), x, y, z));
		// le socle de pierre où l'on empile la solution
		at(mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.4, 20), M("#cfc9bb")), 0, .7, 2);
		at(mesh(new THREE.CylinderGeometry(1.25, 1.25, .12, 20), M("#b8b1a2")), 0, 1.46, 2);
		tower.g = at(new THREE.Group(), 0, 1.52, 2);
		const pl = label("🏛️ La solution des Martin", { size:.3, bg:"#fbfaf6", line:"#16324f" }); at(pl, 0, .3, 3.5);
		gulls.push(...[0].map(i => { const g = new THREE.Group(); for(const s of [-1, 1]){ const w = mesh(new THREE.BoxGeometry(.5, .04, .14), M("#3a3a3a")); w.position.x = s*.24; w.rotation.z = s*.35; g.add(w); } scene.add(g); return { g, c:U.martin, r:5, y:6, s:.4, a:1 }; }));
	}

	/* --- l'agence : une ambiance tendue après un management raté --- */
	const tension = label("⚡ Ambiance tendue", { size:.45, bg:"#fbe7e5", fg:"#b3261e" }); tension.position.set(-1.6, 3.4, -2); tension.visible = false; scene.add(tension);

	/* --- les personnages --- */
	person("toi", { body:"#24365c", collar:"#f4f1ea", hair:"#3b2a1e" });
	person("sophie", { body:"#8f1d3a", hair:"#2a1a14", skin:"#e7b894" });
	const KARIM = { body:"#f4f1ea", collar:"#e0a33a", skin:"#c99068", hat:toque }, LEF = { body:"#7a4f9e", hair:"#d8d4cf", hat:chignon }, INES = { body:"#d97a5b", hair:"#2a1a14", skin:"#b98264", small:1 }, TOM = { body:"#4a8f8a", hair:"#8a5a2e", small:1 }, DUV = { body:"#3a4a5c", hair:"#6b6b6b", hat:casque }, MAR = { body:"#2e3b2e", hair:"#c9c2b6", collar:"#c9a548" };
	person("karim", { ...KARIM, name:"Karim", tag:"#e0a33a" }); person("karimU", KARIM);
	person("lefevre", { ...LEF, hat:inner => { chignon(inner); sac(inner); }, name:"Mme Lefèvre", tag:"#7a4f9e" }); person("lefevreU", LEF);
	person("ines", { ...INES, name:"Inès", tag:"#d97a5b" }); person("inesU", INES);
	person("tom", { ...TOM, name:"Tom", tag:"#4a8f8a" }); person("tomU", TOM);
	person("duval", { ...DUV, name:"M. Duval", tag:"#3a4a5c" }); person("duvalU", { ...DUV, hat:null });
	person("clara", { body:"#5b7fa6", hair:"#5a3a22" });
	person("martin", { ...MAR, name:"Famille Martin", tag:"#2e3b2e" }); person("martinU", MAR); person("martinF", { body:"#8c5a7a", hair:"#e3ddd2", collar:"#c9a548" });
	person("toiC", { body:"#24365c", collar:"#f4f1ea", hair:"#3b2a1e", name:"Toi", tag:"#1f6f78" });
	// l'équipe de l'agence, pour le défi de directeur d'agence
	person("leo", { body:"#3d6b8f", collar:"#f4f1ea", hair:"#2a1a14", name:"Léo", tag:"#3d6b8f" });
	person("nadia", { body:"#b3563f", collar:"#f4f1ea", hair:"#4a2a1a", skin:"#c99068", name:"Nadia", tag:"#b3563f" });
	person("samir", { body:"#5a7a3a", collar:"#f4f1ea", hair:"#1a1a1a", skin:"#b07850", name:"Samir", tag:"#5a7a3a" });
	person("didier", { body:"#5b5f66", collar:"#c9a548", hair:"#3a2a1e", name:"Didier, son fils", tag:"#5b5f66" });
	const EXPERT_COL = { inter:"#2f7d6b", ct:"#c9a227", cb:"#3a6ea5", patri:"#7a3e8f", wait:"#9aa0a6" };
	for(const k in EXPERT_COL) person("x_" + k, { body:EXPERT_COL[k], collar:"#f4f1ea", hair:"#3b2a1e" });
	const SEATS = { karim:-4.4, lefevre:-3, ines:-1.6, tom:-.2, duval:1.2, martin:2.6 };
	const at = (id, c, x, y, z, ry = 0) => { const p = P[id]; p.walk = null; p.g.visible = true; p.g.position.set(c.x + x, y, c.z + z); p.g.rotation.y = ry; };
	// les clients en salle d'attente se tournent vers nous : on voit leurs visages dès la vue d'ensemble
	function seat(id){ const p = P[id]; p.g.visible = true; p.walk = null; p.g.position.set(-7.9, 0, SEATS[id]); p.g.rotation.y = .45; }
	function resetPeople(){
		P.toi.g.position.set(5, 0, -1.6); P.toi.g.rotation.y = Math.PI;
		P.sophie.g.position.set(-1.6, 0, -5.3); P.sophie.g.rotation.y = 0;
		for(const id in SEATS) seat(id);
		P.ines.setMood("inquiet"); P.tom.setMood("inquiet"); P.martin.setMood("rassure"); P.karim.setMood("inquiet"); P.lefevre.setMood("inquiet"); P.duval.setMood("neutre");
		at("karimU", U.karim, .4, 2.25, 1.4);
		at("lefevreU", U.lefevre, -1.6, .5, -1.25);
		at("toiC", U.couple, -3.4, 2.3, .3, 1.2); at("inesU", U.couple, 3, 2.3, .1, -1.2); at("tomU", U.couple, 4.1, 2.3, .7, -1.2);
		at("duvalU", U.duval, -1, 0, 8.4); at("clara", U.duval, -2.4, 0, 8.6); P.clara.g.visible = false;
		for(const k in EXPERT_COL) at("x_" + k, U.duval, 6, 0, 9.5); for(const k in EXPERT_COL) P["x_" + k].g.visible = false;
		at("martinU", U.martin, -2.1, 0, 2.6); at("martinF", U.martin, 2.1, 0, 2.6);
		for(const id of ["leo", "nadia", "samir", "didier"]) P[id].g.visible = false;
		tension.visible = false;
	}
	resetPeople();

	/* --- animations --- */
	const anims = [];
	const easeIO = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	function anim(dur, fn, done, key){
		if(key) for(let i = anims.length - 1; i >= 0; i--) if(anims[i].key === key) anims.splice(i, 1);
		anims.push({ t0:performance.now(), dur, fn, done, key });
	}
	function walk(id, pts, done, face){ const p = P[id]; p.walk = { pts:pts.map(([x, z]) => new THREE.Vector3(x, p.g.position.y, z)), i:0, done, face }; }
	function hop(id, n = 1){ const p = P[id]; anim(420*n, k => { p.inner.position.y = Math.abs(Math.sin(Math.PI*k*n))*.7; }, () => p.inner.position.y = 0, "hop" + id); }
	// réaction en direct : le client se penche vers toi (+1) ou recule (−1)
	function react(id, v){ const p = P[id]; p.react = { v, until:performance.now() + 1400 }; if(v < 0) shake(p.g, .08); }
	function shake(o, amp = .18){ const x0 = o.position.x; anim(500, k => { o.position.x = x0 + Math.sin(k*Math.PI*7)*amp*(1 - k); }, () => o.position.x = x0, "shake" + o.id); }
	function pop(o, on, dur = 500){ o.visible = true; const s0 = on ? .001 : o.scale.x; anim(dur, k => o.scale.setScalar(Math.max(.001, on ? (k < .7 ? k/.7*1.15 : 1.15 - (k - .7)/.3*.15) : s0*(1 - k))), () => { if(!on) o.visible = false; }, "pop" + o.id); }
	function setClock(h, m, dur = 1500){ const from = clock.t, to = h*60 + m; anim(dur, k => { clock.t = from + (to - from)*easeIO(k); }, null, "clock"); }

	/* --- Karim : l'eau, les vagues, la glace qui se brise --- */
	const rings = [], shards = [];
	function ripple(c, y, n = 3, big){
		for(let i = 0; i < n; i++) setTimeout(() => {
			const r = new THREE.Mesh(new THREE.TorusGeometry(1, big ? .12 : .07, 6, 48).rotateX(Math.PI/2), new THREE.MeshBasicMaterial({ color:"#e8f6ff", transparent:true, opacity:.8 }));
			r.position.set(c.x + (Math.random() - .5)*4, y + .05, c.z + 2 + Math.random()*2); scene.add(r);
			rings.push({ r, t0:performance.now(), big, y });
		}, i*220);
	}
	function setLevel(i){
		const from = water.level, to = LEVELS[i]; anim(1800, k => { water.level = from + (to - from)*easeIO(k); }, null, "water"); ripple(U.karim, water.level, 4);
		// la caméra descend avec l'eau, pour bien cadrer le besoin découvert tout au fond
		const v = VIEWS.karim; look(v[0], v[1] - i*1.1, v[2] + i*.5, v[3], v[4] - i*.75, v[5], 1.8, 0, v[6]);
	}
	function wave(){ ripple(U.karim, water.level, 6, true); const m = water.mesh; anim(1400, k => { m.rotation.z = Math.sin(k*Math.PI*5)*.02*(1 - k); m.rotation.x = Math.cos(k*Math.PI*4)*.015*(1 - k); }, null, "wave"); }
	function burst(wp, color = "#f4fbff", n = 10){ for(let i = 0; i < n; i++){ const sh = mesh(new THREE.TetrahedronGeometry(.18), M(color)); sh.position.copy(wp); scene.add(sh); shards.push({ m:sh, v:new THREE.Vector3((Math.random() - .5)*5, Math.random()*4 + 1, Math.random()*3 + 1), t0:performance.now() }); } }
	function reveal(i, build, text){
		const s = slotGroups[i]; if(!s || s.content) return;
		const c = build(); c.scale.setScalar(.001); s.g.add(c); s.content = c;
		s.q.visible = false;
		const f0 = s.frost.scale.clone();
		anim(500, k => s.frost.scale.copy(f0).multiplyScalar(Math.max(.001, 1 - k)), () => s.frost.visible = false);
		anim(700, k => c.scale.setScalar(Math.max(.001, 1.5*(k < .7 ? k/.7*1.1 : 1.1 - (k - .7)/.3*.1))));
		burst(s.g.getWorldPosition(new THREE.Vector3()));
		s.lab = label(text, { size:.55, bg:"#fbfaf6", line:"#2b7fb5" }); s.lab.position.set(0, 1.45, .4); s.lab.renderOrder = 12; s.g.add(s.lab);
	}
	function unknown(i){ const s = slotGroups[i]; if(s.content) return; relabel(s.q, "?", { fg:"#b3261e" }); s.lab = label("Besoin non découvert", { size:.45, bg:"#f1f1f1", fg:"#8a8f94" }); s.lab.position.set(0, 1.3, .4); s.g.add(s.lab); }
	function resetIce(){ resetCash(); water.level = LEVELS[0]; slotGroups.forEach(s => { if(s.content) s.g.remove(s.content); if(s.lab) s.g.remove(s.lab); s.content = s.lab = null; s.frost.visible = true; s.frost.scale.set(1.35, 1.05, .75); s.q.visible = true; relabel(s.q, "?", { fg:"#7fb2cc" }); }); }
	const NEEDS = {
		boutique:() => { const g = new THREE.Group(); g.add(box(1.2, .8, .8, "#f6dca0", 0, -.4, 0)); const r = roof(1.36, .45, .9, "#c0392b"); r.position.set(0, .4, -.45); g.add(r); const two = label("2", { bg:"#16324f", fg:"#fff", size:.5 }); two.position.set(0, -.05, .5); g.add(two); return g; },
		seul:() => { const g = new THREE.Group(); const k = new THREE.Group(); k.add(mesh(new THREE.CylinderGeometry(.3, .34, .12, 18), M("#f4f1ea"), 0, -.55, 0), mesh(new THREE.CylinderGeometry(.12, .24, .6, 14), M("#f4f1ea"), 0, -.2, 0), mesh(new THREE.SphereGeometry(.22, 14, 10), M("#c99068"), 0, .22, 0), mesh(new THREE.CylinderGeometry(.16, .15, .2, 14), M("#ffffff"), 0, .45, 0)); k.position.x = -.45; k.rotation.z = .3; g.add(k); g.add(mesh(new THREE.CylinderGeometry(.36, .36, .16, 22).rotateX(Math.PI/2), M("#c0392b"), .45, -.15, 0)); for(const s of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(.1, 10, 8), M("#c0392b"), .45 + s*.25, .2, 0)); const t = label("3:00", { bg:"#fbfaf6", fg:"#c0392b", size:.36 }); t.position.set(.45, -.15, .25); g.add(t); return g; },
		treso:() => { const g = new THREE.Group(), pk = M("#f2a7b5"); g.add(mesh(new THREE.SphereGeometry(.42, 18, 12).scale(1.25, 1, 1), pk, -.2, -.2, 0), mesh(new THREE.CylinderGeometry(.13, .13, .12, 14).rotateZ(Math.PI/2), pk, .37, -.2, 0)); for(const z of [-.18, .18]) g.add(mesh(new THREE.ConeGeometry(.1, .18, 4), pk, -.05, .2, z)); g.add(box(.5, .6, .06, "#fbfaf6", .62, -.6, .1)); const a = label("AOÛT", { bg:"#c0392b", fg:"#fff", size:.3 }); a.position.set(.62, -.1, .2); g.add(a); return g; }
	};

	/* --- Mme Lefèvre : la loupe --- */
	const marks = {};
	function markClue(id, text, good){
		const o = clues[id]; if(!o || marks[id]) return;
		const g = new THREE.Group(); g.position.copy(o.position); o.parent.add(g); marks[id] = g;
		if(good){ const ring = mesh(new THREE.TorusGeometry(.9, .07, 8, 36).rotateX(Math.PI/2), new THREE.MeshBasicMaterial({ color:"#e0a33a" })); ring.position.y = .06; g.add(ring); g.userData.ring = ring; }
		const top = new THREE.Box3().setFromObject(o).max.y - o.parent.position.y;
		const l = label(text, good ? { size:.4, bg:"#fff8e6", line:"#e0a33a" } : { size:.36, bg:"#eceff1", fg:"#6f767c" }); l.position.y = top + .5; g.add(l);
		const s0 = o.scale.x; anim(600, k => o.scale.setScalar(s0*(1 + .2*Math.sin(Math.PI*k))), () => o.scale.setScalar(s0));
		if(good) burst(o.getWorldPosition(new THREE.Vector3()).setY(1.5), "#ffd77a", 8);
	}
	function resetClues(){ for(const id in marks){ marks[id].parent.remove(marks[id]); delete marks[id]; } }

	/* --- Inès et Tom : les planches du pont --- */
	let nPlanks = 0;
	function plank(add){
		if(add){
			if(nPlanks >= 5) return; const p = bridge.planks[nPlanks++];
			const from = P.toiC.g.position.clone().sub(U.couple).setY(3.4), to = new THREE.Vector3(-1.6 + (nPlanks - 1)*.8, 2.1, 0);
			p.visible = true; p.scale.setScalar(1); p.rotation.set(0, 0, 0);
			anim(800, k => { p.position.lerpVectors(from, to, easeIO(k)); p.position.y += Math.sin(Math.PI*k)*2; p.rotation.z = (1 - k)*4; }, () => ripple(U.couple, -4.1, 0));
		} else {
			if(!nPlanks) return; const p = bridge.planks[--nPlanks], y0 = p.position.y;
			anim(1100, k => { p.rotation.z = k*2.4; p.rotation.x = k*.8; p.position.y = y0 - k*k*6.2; }, () => { p.visible = false; ripple(U.couple, -4.1, 3, true); });
		}
	}
	function resetBridge(){ resetGauge(); nPlanks = 0; bridge.planks.forEach(p => { p.visible = false; p.scale.setScalar(.001); }); }

	/* --- Duval Textiles : la météo, les experts, ce qui pousse --- */
	let weather = "none";
	function setWeather(w){
		weather = w; const c = factory.cloud;
		if(w === "none"){ c.visible = false; factory.rain.visible = factory.sunL.visible = factory.bolt.visible = false; return; }
		if(w === "sun"){ pop(c, false); factory.rain.visible = false; factory.sunL.visible = true; factory.sunL.material.opacity = 1; anim(2600, k => { factory.sunL.material.opacity = 1 - Math.max(0, k - .6)/.4; }, () => factory.sunL.visible = false); return; }
		c.visible = true; const dark = w === "storm";
		c.children.forEach(s => s.material.color.set(dark ? "#4a4f57" : "#c9ced3"));
		anim(700, k => c.scale.setScalar((dark ? 1.4 : .8)*Math.min(1, .4 + k)), null, "cloud");
		factory.rain.visible = dark;
		if(dark){ let n = 0; const flash = () => { factory.bolt.visible = true; setTimeout(() => factory.bolt.visible = false, 180); if(++n < 3) setTimeout(flash, 420); }; flash(); shake(factory.plat, .25); }
	}
	function grow(k){ if(k === "clara"){ at("clara", U.duval, -6, 0, 9.4); walk("clara", [[U.duval.x - 2.4, U.duval.z + 8.6]], () => { hop("clara"); hop("duvalU"); }, 0); return; } const g = factory.grow[k]; if(g) pop(g, true, 900); }
	// les experts mobilisés restent aux côtés de M. Duval, côte à côte
	let xSlot = 0;
	function expert(k, good, done){
		const id = "x_" + k; at(id, U.duval, 6.5, 0, 9.6);
		walk(id, [[U.duval.x + 1.1 + (good ? xSlot++ : xSlot)*1.1, U.duval.z + 8.6 - (good ? 0 : .3)]], () => {
			P[id].g.rotation.y = 0;
			if(good){ P[id].setMood("ravi"); hop(id); done && done(); }
			else { P[id].setMood("agace"); shake(P[id].g, .12); setTimeout(() => walk(id, [[U.duval.x + 6.5, U.duval.z + 9.6]], () => P[id].g.visible = false), 900); done && done(); }
		});
	}
	// les signaux de risque apparaissent ; ceux que le joueur repère reçoivent un ⚠️
	function alerts(on){ for(const g of [factory.stock, factory.unpaid]){ if(on) pop(g, true, 800); else { g.visible = false; g.scale.setScalar(.001); if(g.userData.flag){ g.remove(g.userData.flag); g.userData.flag = null; } } } }
	function flag(k){ const g = k === "stock" ? factory.stock : factory.unpaid; if(g.userData.flag) return; const f = label("⚠️", { bg:null, size:1, big:1 }); f.position.y = 2.9; g.add(f); g.userData.flag = f; shake(g, .15); }
	function resetFactory(){ xSlot = 0; alerts(false); relabel(factory.stockLab, "📦 Stocks de fil", { bg:"#fbfaf6", fg:"#16324f", line:null }); relabel(factory.unpaidLab, "🧾 Autolux : facture impayée", { bg:"#fff", fg:"#16324f" }); Object.values(factory.grow).forEach(g => { g.visible = false; g.scale.setScalar(.001); }); setWeather("none"); relabel(factory.year, "2026"); P.duvalU.setHair("#6b6b6b"); }

	/* --- famille Martin : la tour --- */
	function stack(color, text, good){
		// le nom du produit est imprimé sur la face avant du bloc : il ne peut plus être caché par les blocs voisins
		const face = tex(512, 140, (x, w, h) => {
			x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(0, h - 10, w, 10); x.fillRect(0, 0, w, 4);
			x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 4;
			// sur une ligne si elle reste grande, sinon sur deux lignes (plus lisible de loin)
			if(fitFont(x, text, w - 40, 58) >= 48 || text.split(" ").length < 3) return x.fillText(text, w/2, h/2);
			const words = text.split(" "), cut = Math.ceil(words.length/2), l1 = words.slice(0, cut).join(" "), l2 = words.slice(cut).join(" ");
			const s = Math.min(fitFont(x, l1, w - 40, 52), fitFont(x, l2, w - 40, 52)); x.font = `800 ${s}px Nunito, sans-serif`;
			x.fillText(l1, w/2, h*.3); x.fillText(l2, w/2, h*.7);
		});
		const side = M(color), b = mesh(new THREE.BoxGeometry(1.9, .52, 1.15).translate(0, .26, 0), [side, side, side, side, new THREE.MeshStandardMaterial({ map:face, roughness:.6 }), side]);
		const i = tower.blocks.length, off = good ? (Math.random() - .5)*.08 : (i % 2 ? -.38 : .38);
		const y1 = i*.54; b.position.set(off, y1 + 6, 0); tower.g.add(b); tower.blocks.push(b);
		anim(650, k => { b.position.y = y1 + 6*(1 - k*k); }, () => { burst(b.getWorldPosition(new THREE.Vector3()), "#e9e2d2", 5); if(!good){ tower.tilt += .085; } });
	}
	function collapse(){
		tower.falling = true;
		tower.blocks.forEach((b, i) => { const v = new THREE.Vector3((Math.random() - .5)*3 + (i % 2 ? -1 : 1), 2 + Math.random()*2, (Math.random() - .2)*2.4), p0 = b.position.clone(), r0 = Math.random()*3;
			anim(1300, k => { b.position.set(p0.x + v.x*k*1.6, Math.max(-1.3, p0.y + v.y*k*1.3 - 9*k*k), p0.z + v.z*k*1.6); b.rotation.set(r0*k, 0, (i % 2 ? 2 : -2)*k); }); });
	}
	function resetTower(){ resetDoc(); tower.blocks.forEach(b => tower.g.remove(b)); tower.blocks = []; tower.tilt = 0; tower.falling = false; tower.g.rotation.set(0, 0, 0); }

	/* --- Karim : la trésorerie mois par mois, une pile de pièces au pied de la boulangerie --- */
	const CASH_M = [2700, 2700, 2700, 2600, 2600, 2500, 1800, 900, 2400, 2800, 2900, 3100];      // ce que dégage la boulangerie chaque mois (août : le quartier se vide)
	const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
	const coinGeo = new THREE.CylinderGeometry(.22, .22, .08, 18);
	const cash = { g:null, coins:[], lab:null, run:0 };
	function cashYear(pay, done){
		const run = ++cash.run;
		if(!cash.g){
			cash.g = group(new THREE.Vector3(U.karim.x - 1.7, 2.25, U.karim.z + 1.2));
			for(let i = 0; i < 26; i++){ const c = mesh(coinGeo, M("#d9a93a", { metalness:.7, roughness:.3 }), (i % 2)*.03, .05 + i*.085, 0); c.visible = false; cash.g.add(c); cash.coins.push(c); }
			cash.lab = label(" ", { size:.42 }); cash.lab.position.y = 3; cash.g.add(cash.lab);
		}
		cash.g.visible = true;
		let m = 0;
		const step = () => {
			if(run !== cash.run) return;
			if(m >= 12){ done && done(); return; }
			const left = CASH_M[m] - 300 - pay, n = Math.max(0, Math.round(left/120));
			cash.coins.forEach((c, i) => c.visible = i < n);
			relabel(cash.lab, `${MONTHS[m]} : ${left >= 0 ? "+" : "−"} ${Math.abs(left).toLocaleString("fr-FR")} €`, left < 0 ? { bg:"#fbe7e5", fg:"#b3261e", line:"#b3261e" } : { bg:"#fbfaf6", fg:"#16324f", line:null });
			// les mensualités s'envolent vers la banque
			const top = cash.g.position.clone().setY(2.4 + n*.085);
			for(let i = 0; i < Math.min(6, Math.round((pay + 300)/250)); i++) setTimeout(() => { const c = mesh(coinGeo, M("#d9a93a", { metalness:.7, roughness:.3 })); c.position.copy(top); scene.add(c); const p0 = top.clone(), p1 = top.clone().add(new THREE.Vector3(-4, 3, 2)); anim(600, k => { c.position.lerpVectors(p0, p1, k); c.position.y += Math.sin(Math.PI*k)*1.5; c.rotation.x = k*9; }, () => scene.remove(c)); }, i*70);
			if(left < 0){ shake(cash.g, .2); burst(top, "#c0392b", 6); }
			m++; setTimeout(step, m === 8 ? 1400 : 650);
		};
		step();
	}
	function resetCash(){ cash.run++; if(cash.g) cash.g.visible = false; }

	/* --- Inès et Tom : la jauge du taux d'endettement, au-dessus du vide --- */
	const gauge = { g:null, fill:null, lab:null, v:0 }, GH = 2.25;      // hauteur de la jauge pour 50 %
	function setGauge(v){
		if(!gauge.g){
			const g = gauge.g = group(new THREE.Vector3(U.couple.x - 4.4, 2.3, U.couple.z - 2.4));
			g.add(box(.8, 2.4, .3, "#e9edf0", 0, 0, 0));
			gauge.fill = mesh(new THREE.BoxGeometry(.56, 1, .34).translate(0, .5, 0), new THREE.MeshStandardMaterial({ color:"#3d7a55" }), 0, .08, 0); gauge.fill.scale.y = .001; g.add(gauge.fill);
			const lim = .08 + 35/50*GH; g.add(box(1.1, .07, .4, "#c0392b", 0, lim - .035, 0));
			const ll = label("35 % max", { size:.32, bg:"#fbfaf6", fg:"#c0392b" }); ll.position.set(1.25, lim, 0); g.add(ll);
			gauge.lab = label(" ", { size:.4 }); gauge.lab.position.y = 2.9; g.add(gauge.lab);
		}
		gauge.g.visible = true;
		const from = gauge.v; gauge.v = v;
		anim(1200, k => { gauge.fill.scale.y = Math.max(.001, (from + (v - from)*easeIO(k))/50*GH); }, null, "gauge");
		gauge.fill.material.color.set(v >= 35 ? "#c0392b" : v >= 30 ? "#e0a33a" : "#3d7a55");
		relabel(gauge.lab, `📊 Endettement : ${v} %`, { fg:v >= 35 ? "#b3261e" : "#16324f" });
		if(v >= 35) shake(gauge.g, .12);
	}
	function resetGauge(){ gauge.v = 0; if(gauge.g){ gauge.g.visible = false; gauge.fill.scale.y = .001; } }

	/* --- Duval : les signaux manqués en 2029 ont des conséquences en 2031 --- */
	function consequence(k){
		if(k === "stock"){ const s = factory.stock; pop(s, true, 400); setTimeout(() => anim(900, q => s.scale.set(1 + .7*q, 1 + .9*q, 1 + .4*q)), 450); relabel(factory.stockLab, "📦 Les stocks débordent", { bg:"#fbe7e5", fg:"#b3261e", line:"#b3261e" }); }
		else { const u = factory.unpaid; pop(u, true, 400); relabel(factory.unpaidLab, "❌ Autolux en faillite", { bg:"#fbe7e5", fg:"#b3261e" }); setTimeout(() => { shake(u, .3); burst(u.getWorldPosition(new THREE.Vector3()).setY(2), "#c0392b", 10); }, 500); }
	}

	/* --- Martin : le document « profil client » signé, posé sur un pupitre --- */
	const doc = { g:null, paper:null };
	function profileDoc(profil, ok){
		if(!doc.g){
			doc.g = group(new THREE.Vector3(U.martin.x + 3.2, 0, U.martin.z + 4.2));
			const d = new THREE.Group(); d.scale.setScalar(1.5); d.rotation.y = -.35; doc.g.add(d);
			d.add(mesh(new THREE.CylinderGeometry(.08, .1, 1.1, 10), M("#5a3a22"), 0, .55, 0), box(1.5, .06, 1.1, "#6b4a2e", 0, 1.1, 0));
			doc.paper = mesh(new THREE.PlaneGeometry(1.2, 1.2*340/256), new THREE.MeshStandardMaterial({ roughness:.9 }), 0, 1.5, .05); doc.paper.rotation.x = -.85; d.add(doc.paper);
			// le stylo est posé sur le bord du pupitre, pas sur le texte
			d.add(mesh(new THREE.CylinderGeometry(.03, .03, .8, 8).rotateZ(Math.PI/2), M("#16324f"), 0, 1.16, .5));
		}
		const date = new Date().toLocaleDateString("fr-FR");
		const t = tex(256, 340, (x, w, h) => {
			x.fillStyle = "#fffdf6"; x.fillRect(0, 0, w, h); x.fillStyle = "#16324f"; x.fillRect(0, 0, w, 36);
			x.fillStyle = "#fff"; x.textAlign = "center"; fitFont(x, "PROFIL CLIENT", w - 24, 18); x.fillText("PROFIL CLIENT", w/2, 25);
			x.textAlign = "left"; x.fillStyle = "#2b3a44";
			["M. et Mme Martin", "Objectifs : retraite, enfants,", "protection du conjoint", "Horizon : 6 ans et plus", "Tolérance au risque : faible", "Connaissances : livrets, AV"].forEach((l, i) => { fitFont(x, l, w - 32, 14, 700); x.fillText(l, 16, 64 + i*22); });
			const pr = "Profil retenu : " + profil.toUpperCase(); fitFont(x, pr, w - 32, 16); x.fillStyle = ok ? "#23704a" : "#b3261e"; x.fillText(pr, 16, 204);
			x.fillStyle = "#6f767c"; x.font = "600 12px Nunito, sans-serif"; x.fillText("Signé le " + date, 16, 230);
			// les deux signatures en bas à gauche, le tampon en bas à droite : rien ne se chevauche
			x.strokeStyle = "#16324f"; x.lineWidth = 2; for(const [ox, oy] of [[18, 268], [18, 312]]){ x.beginPath(); x.moveTo(ox, oy); for(let i = 0; i < 6; i++) x.quadraticCurveTo(ox + 8 + i*12, oy - 16 + (i % 2)*28, ox + 12 + i*12, oy - 2); x.stroke(); }
			x.save(); x.translate(186, 292); x.rotate(-.25); x.strokeStyle = x.fillStyle = ok ? "#23704a" : "#b3261e"; x.lineWidth = 3; x.strokeRect(-46, -16, 92, 32); x.font = "800 14px Nunito, sans-serif"; x.textAlign = "center"; x.fillText(ok ? "CONFORME" : "À REVOIR", 0, 5); x.restore();
		});
		if(doc.paper.material.map) doc.paper.material.map.dispose();
		doc.paper.material.map = t; doc.paper.material.needsUpdate = true;
		pop(doc.g, true, 700);
	}
	function resetDoc(){ if(doc.g){ doc.g.visible = false; doc.g.scale.setScalar(.001); } }

	/* --- caméra : elle vole d'un endroit à l'autre, en arc quand on plonge dans l'univers du client --- */
	let cam = null;
	// r : demi-largeur de la scène à garder dans le cadre. Sur écran large comme sur téléphone, la caméra recule
	// jusqu'à ce que toute la largeur tienne (et pas seulement la hauteur)
	function look(px, py, pz, tx, ty, tz, dur = 1.3, arc = 0, r = 0){
		const t1 = new THREE.Vector3(tx, ty, tz), p = new THREE.Vector3(px, py, pz), d = p.distanceTo(t1);
		const visW = d*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*VW/VH;
		const fit = Math.min(2.6, Math.max(1.2, 1.2/camera.aspect, r ? r/visW : 0));
		cam = { p0:camera.position.clone(), t0:controls.target.clone(), p1:p.sub(t1).multiplyScalar(fit).add(t1), t1, k:0, dur, arc };
		light(t1.clone().setY(0));
	}
	// [position de la caméra, point visé, demi-largeur à garder visible]
	const VIEWS = {
		agence:[-.5, 15, 15.5, -.5, 0, -.5, 12.8],
		bureau:[5, 3.1, 1.4, 5, 1.3, -4.2, 2.6],
		karim:[U.karim.x + 3, 5.5, 22, U.karim.x, -1.4, 0, 10],
		lefevre:[U.lefevre.x + 1, 10.5, 12, U.lefevre.x - .2, .8, -1.2, 9.5],
		couple:[U.couple.x + 1, 10, U.couple.z + 16, U.couple.x + .3, 2, U.couple.z, 11],
		duval:[U.duval.x + 1, 10.5, U.duval.z + 24, U.duval.x, 3.1, U.duval.z + 3, 12],
		martin:[U.martin.x + 1.5, 8.5, U.martin.z + 17, U.martin.x, 2.4, U.martin.z + .5, 10]
	};
	const view = (v, dur = 1.3, arc = 0) => { const [px, py, pz, tx, ty, tz, r] = VIEWS[v]; look(px, py, pz, tx, ty, tz, dur, arc, r); };

	/* --- boucle --- */
	let raf = 0, last = performance.now();
	const flourGeo = new THREE.BufferGeometry(), FN = 90, fp = new Float32Array(FN*3), fv = [];
	for(let i = 0; i < FN; i++) fv.push([Math.random(), (Math.random() - .5)*.6, Math.random()*.5 + .2, (Math.random() - .5)*.6]);
	flourGeo.setAttribute("position", new THREE.BufferAttribute(fp, 3));
	scene.add(new THREE.Points(flourGeo, new THREE.PointsMaterial({ color:"#ffffff", size:.07, transparent:true, opacity:.85 })));
	const puffs = (n, c, op) => Array.from({ length:n }, (_, i) => { const p = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshStandardMaterial({ color:c, transparent:true, opacity:op })); scene.add(p); return { p, k:i/n }; });
	const ovenP = puffs(7, "#5d6166", .6), chimP = puffs(7, "#e8e8e8", .55), steamP = puffs(4, "#ffffff", .5), teaP = puffs(4, "#ffffff", .5);
	steamP.forEach(s => s.p.scale.setScalar(.25)); teaP.forEach(s => s.p.scale.setScalar(.3));
	const teaCup = new THREE.Vector3(U.lefevre.x + .1, .75, U.lefevre.z + .3);
	function loop(now){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(.05, (now - last)/1000); last = now; const t = now/1000;
		for(let i = anims.length - 1; i >= 0; i--){ const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); } }
		// personnages : marche, posture selon l'humeur, réaction en direct
		for(const id in P){
			const p = P[id]; if(!p.g.visible) continue;
			if(p.walk){
				const w = p.walk, tg = w.pts[w.i], d = tg.clone().sub(p.g.position); d.y = 0; const L = d.length();
				if(L < .05){ if(++w.i >= w.pts.length){ p.walk = null; p.inner.position.y = 0; p.inner.rotation.z = 0; if(w.face != null) p.g.rotation.y = w.face; w.done && w.done(); } }
				else { p.g.position.addScaledVector(d, Math.min(1, dt*3.2/L)); const a = Math.atan2(d.x, d.z); p.g.rotation.y += Math.atan2(Math.sin(a - p.g.rotation.y), Math.cos(a - p.g.rotation.y))*Math.min(1, dt*10); p.inner.position.y = Math.abs(Math.sin(t*11 + p.phase))*.14; p.inner.rotation.z = Math.sin(t*11 + p.phase)*.06; }
				continue;
			}
			const md = p.mood, ph = t + p.phase, re = p.react && now < p.react.until ? p.react.v : 0;
			const lean = re ? re*.32 : md === "rassure" ? .1 : md === "agace" ? -.16 : md === "inquiet" ? .05 : 0;
			p.inner.rotation.x += (lean - p.inner.rotation.x)*Math.min(1, dt*(re ? 10 : 6));
			p.inner.position.z += ((re < 0 ? -.25 : 0) - p.inner.position.z)*Math.min(1, dt*8);
			p.inner.rotation.z = md === "inquiet" ? Math.sin(ph*22)*.012 : md === "agace" ? Math.sin(ph*3)*.04 : 0;
			p.inner.scale.y = md === "inquiet" ? .95 : 1 + Math.sin(ph*2)*.012;
			if(md === "ravi" && !anims.some(a => a.key === "hop" + id)) p.inner.position.y = Math.abs(Math.sin(ph*5))*.14;
			if(p.icon.visible) p.icon.position.y = 1.95 + Math.sin(ph*3)*.06;
		}
		// l'agence : l'horloge, les plantes, la vapeur du café
		clock.h.rotation.z = -(clock.t/60)/12*Math.PI*2; clock.m.rotation.z = -(clock.t % 60)/60*Math.PI*2;
		sway.forEach((s, i) => { s.rotation.z = Math.sin(t*1.3 + i)*.05; s.rotation.x = Math.cos(t*1.1 + i)*.04; });
		const rise = (arr, base, h, sp, spread = .04) => arr.forEach(s => { const k = (s.k + t*sp) % 1; s.p.position.set(base.x + Math.sin(k*9)*spread, base.y + k*h, base.z); s.p.material.opacity = (s.p.userData.op || (s.p.userData.op = s.p.material.opacity))*(1 - k); s.p.scale.setScalar((s.p.userData.s0 || (s.p.userData.s0 = s.p.scale.x))*(1 + k*2)); });
		rise(steamP, steam.at.position.clone().setY(1.2), .6, .35); rise(teaP, teaCup, .7, .3);
		// Karim : la farine qui vole, la fumée du four en panne, l'eau, les poissons
		for(let i = 0; i < FN; i++){ const v = fv[i]; v[0] = (v[0] + dt*v[2]*.5) % 1; const k = v[0]; fp[i*3] = flour.origin.x + v[1] + Math.sin(k*7 + i)*.35; fp[i*3 + 1] = flour.origin.y + k*1.6 - .3; fp[i*3 + 2] = flour.origin.z + v[3] + k*.6; }
		flourGeo.attributes.position.needsUpdate = true;
		ovenP.forEach(s => { const k = (s.k + t*.22) % 1; s.p.position.set(oven.pos.x + Math.sin(k*5)*.2 + k*.6, oven.pos.y - .7 + k*2.4, oven.pos.z); s.p.scale.setScalar(.6 + k*2.2); s.p.material.opacity = .55*(1 - k); });
		water.mesh.scale.y = water.level - BOT; water.mesh.position.y = BOT + (water.level - BOT)/2;
		fish.forEach(f => { f.a += dt*f.s; const y = Math.min(f.y, water.level - .6), c = U.karim; f.f.position.set(c.x + Math.cos(f.a)*f.r, y + Math.sin(f.a*3)*.2, c.z + Math.sin(f.a)*f.r); f.f.lookAt(c.x + Math.cos(f.a + .1)*f.r, y, c.z + Math.sin(f.a + .1)*f.r); f.f.rotateY(Math.PI/2); });
		gulls.forEach(g => { g.a += dt*g.s; g.g.position.set(g.c.x + Math.cos(g.a)*g.r, g.y + Math.sin(g.a*2)*.4, g.c.z + Math.sin(g.a)*g.r); g.g.rotation.y = -g.a; g.g.children.forEach((w, i) => w.rotation.z = (i ? 1 : -1)*(.35 + Math.sin(t*9)*.35)); });
		for(let i = rings.length - 1; i >= 0; i--){ const r = rings[i], k = (now - r.t0)/1600; if(k >= 1){ scene.remove(r.r); r.r.geometry.dispose(); rings.splice(i, 1); continue; } r.r.scale.setScalar(.4 + k*(r.big ? 7 : 4)); r.r.material.opacity = .8*(1 - k); }
		for(let i = shards.length - 1; i >= 0; i--){ const s = shards[i], k = (now - s.t0)/1000; if(k >= 1){ scene.remove(s.m); shards.splice(i, 1); continue; } s.v.y -= dt*9; s.m.position.addScaledVector(s.v, dt); s.m.rotation.x += dt*8; s.m.scale.setScalar(1 - k); }
		// Mme Lefèvre : le balancier, le chat qui respire, les indices qui brillent
		pendulums.forEach(p => p.rotation.z = Math.sin(t*2.6)*.28);
		cat.body.scale.y = .7 + Math.sin(t*1.8)*.04;
		for(const id in marks){ const r = marks[id].userData.ring; if(r) r.scale.setScalar(1 + .1*Math.sin(t*4)); }
		// Inès et Tom : la rivière coule, les cartons tremblent un peu
		bridge.river.offset.y = (bridge.river.offset.y - dt*.4) % 1;
		wobble.forEach((c, i) => c.rotation.z = Math.sin(t*3 + i*1.7)*.03);
		// Duval Textiles : le plateau tourne, les bobines, le camion, la fumée, la pluie
		factory.plat.rotation.y += dt*.12;
		spin.forEach(s => s.rotation.y += dt*3);
		const ta = t*.5; factory.truck.position.set(Math.cos(ta)*7.1, 0, Math.sin(ta)*7.1); factory.truck.rotation.y = -ta - Math.PI/2;
		chimP.forEach(s => { const k = (s.k + t*.18) % 1; const c = factory.chimney; s.p.position.set(c.x + 1.2 + Math.sin(k*4)*.3 + k*.8, c.y + k*3, c.z - 1.6); s.p.scale.setScalar(.6 + k*2.4); s.p.material.opacity = .5*(1 - k); });
		if(factory.rain.visible){ const a = factory.rain.geometry.attributes.position; for(let i = 0; i < a.count; i++){ const k = ((i*.137 + t*1.2) % 1); a.setXYZ(i, ((i*7.3) % 5) - 2.5, 7 - k*6.5, ((i*3.1) % 3) - 2.5); } a.needsUpdate = true; }
		// famille Martin : la piscine miroite, la tour penche
		tower.pool.material.color.setHSL(.55, .6, .55 + Math.sin(t*2)*.04);
		if(!tower.falling) tower.g.rotation.z += ((tower.tilt ? tower.tilt + Math.sin(t*3)*tower.tilt*.25 : 0) - tower.g.rotation.z)*Math.min(1, dt*3);
		if(cam){ cam.k = Math.min(1, cam.k + dt/cam.dur); const e = easeIO(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); camera.position.y += Math.sin(Math.PI*e)*cam.arc; controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.enabled = !cam;
		controls.update();
		renderer.render(scene, camera);
	}
	// une bande de la vue est réservée à la bulle de dialogue : en bas sur ordinateur, en haut sur téléphone
	let VD = 0, VW = 1, VH = 1, VTOP = false;
	function reserve(px, top = false){ VD = px; VTOP = top; camera.setViewOffset(VW, VH + VD, 0, top ? 0 : VD, VW, VH); camera.updateProjectionMatrix(); }
	function resize(w, h){
		w = Math.max(1, w); h = Math.max(1, h);      // fenêtre masquée : taille nulle
		VW = w; VH = h;
		const ls = w < 600 ? 1.3 : 1;
		if(ls !== LS){ scene.traverse(o => { if(o.isSprite) o.scale.multiplyScalar(ls/LS); }); LS = ls; }
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px"; camera.aspect = w/h; camera.fov = w/h < .9 ? 50 : 36; reserve(VD, VTOP);
	}
	camera.position.set(-.5, 26, 26); controls.target.set(0, 0, -1);
	raf = requestAnimationFrame(loop);
	return {
		P, U, water, walk, hop, react, shake, setClock, setLevel, wave, reveal, unknown, resetIce, resetPeople, seat, NEEDS, view, look, resize, reserve, camera,
		markClue, resetClues, plank, resetBridge, setWeather, grow, expert, resetFactory, factory, alerts, flag,
		cashYear, setGauge, consequence, profileDoc, tension:on => tension.visible = on, stack, collapse, resetTower, tower,
		place:at, setYear:y => relabel(factory.year, String(y)),
		set onPick(f){ onPick = f; canvas.style.cursor = f ? "zoom-in" : ""; },
		talk(id){ const p = P[id]; if(p) anim(900, k => { p.inner.scale.y = 1 + Math.sin(k*Math.PI*6)*.03; }, () => p.inner.scale.y = 1, "talk" + id); },
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
	};
}

/* ================= les rendez-vous ================= */
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const STARS = n => "★".repeat(n) + "☆".repeat(3 - n);
const andJoin = a => a.length > 1 ? a.slice(0, -1).join(", ") + " et " + a[a.length - 1] : a.join("");

const CLIENTS = {
	karim:{ h:[9, 0], who:"Karim, boulanger", kind:"Professionnel", theme:"ecoute", pawns:["karim"], u:["karimU"], av:"🧑‍🍳", name:"Karim", stage:"L'iceberg de Karim",
		hello:"Bonjour ! Mon four m'a lâché ce matin. Il me faudrait un crédit, vite.",
		story:"Karim, 38 ans, tient une boulangerie dans le Vieux-Lille depuis six ans. Client de l'agence, il a pris rendez-vous ce matin en urgence.<br><br><b>Sa demande :</b> un crédit pour remplacer son four, tombé en panne.",
		gesture:"👂 <b>Le geste métier : l'écoute.</b> Comprendre avant de conseiller. Ce que Karim demande n'est peut-être que la partie visible…", enter:"Écouter Karim" },
	lefevre:{ h:[10, 30], who:"Mme Lefèvre", kind:"Particulier", theme:"sens", pawns:["lefevre"], u:["lefevreU"], av:"👵", name:"Mme Lefèvre", stage:"Chez Mme Lefèvre",
		hello:"Bonjour… Je viens juste pour faire un virement à mon fils. Ce ne sera pas long.",
		story:"Mme Lefèvre, 74 ans, est cliente de l'agence depuis quarante ans. D'habitude, c'est son mari qui venait. Aujourd'hui, elle est seule.<br><br><b>Sa demande :</b> un simple virement.",
		gesture:"🔎 <b>Le geste métier : la sensibilité.</b> Percevoir au-delà des demandes exprimées : les signaux faibles, les moments de vie.", enter:"Entrer dans son univers" },
	couple:{ h:[14, 0], who:"Inès et Tom", kind:"Premier achat", theme:"bienv", pawns:["ines", "tom"], u:["inesU", "tomU"], av:"👫", name:"Inès et Tom", stage:"Le pont d'Inès et Tom",
		hello:"Bonjour… On vient pour notre premier achat. On est un peu stressés, en fait.",
		story:"Inès, 27 ans, infirmière, et Tom, 29 ans, technicien, ont trouvé un deux-pièces à Lambersart. C'est leur premier rendez-vous dans une banque pour un crédit immobilier.<br><br><b>Leur demande :</b> savoir s'ils peuvent emprunter.",
		gesture:"🤝 <b>Le geste métier : la bienveillance.</b> Accueillir sans jugement, rassurer, respecter le rythme de chacun.", enter:"Construire la confiance" },
	duval:{ h:[15, 30], who:"Duval Textiles", kind:"Entreprise", theme:"accomp", pawns:["duval"], u:["duvalU"], av:"👷", name:"M. Duval", stage:"Duval Textiles",
		hello:"Bonjour ! Les affaires tournent, mais j'ai l'impression que tout va trop vite.",
		story:"M. Duval, 54 ans, dirige Duval Textiles à Roubaix : 40 salariés, du tissu technique pour l'automobile. L'entreprise est cliente de l'agence depuis vingt ans.<br><br><b>Sa demande :</b> « Qu'on fasse le point. »",
		gesture:"🧭 <b>Le geste métier : l'accompagnement.</b> Être présent dans la durée, anticiper, mobiliser les bons interlocuteurs au bon moment.", enter:"Voir l'entreprise grandir" },
	martin:{ h:[17, 0], who:"Famille Martin", kind:"Client patrimonial", theme:"expert", pawns:["martin"], u:["martinU", "martinF"], av:"👴", name:"M. et Mme Martin", stage:"La tour des Martin",
		hello:"Bonsoir ! Nous avons vendu notre cabinet d'architectes. Et maintenant, que faire de tout ça ?",
		story:"Jacques et Hélène Martin, 58 et 56 ans, viennent de vendre leur cabinet d'architectes. Ils ont deux enfants, Léa et Hugo, et veulent s'arrêter de travailler dans six ans.<br><br><b>Leur demande :</b> une solution pour organiser leur patrimoine.",
		gesture:"🎓 <b>Le geste métier : l'expertise.</b> Proposer des solutions personnalisées, et s'appuyer sur des expertises complémentaires quand c'est nécessaire.", enter:"Construire leur solution" }
};
const ORDER = ["karim", "lefevre", "couple", "duval", "martin"];

// Karim : une banque de questions, six tirées à chaque partie (une bonne par besoin caché, trois maladroites)
const Q_GOOD = {
	seul:[["Comment se passent vos journées au fournil ?", "Debout à 3 h, seul au fournil depuis six ans… Honnêtement, je suis épuisé."],
		["Qui vous aide au quotidien à la boulangerie ?", "Personne. Je fais tout seul, du pétrin à la caisse. Je n'ai pas pris de vacances depuis trois ans."]],
	boutique:[["Où voyez-vous la boulangerie dans trois ans ?", "Mon rêve ? Une deuxième boutique à Wazemmes. Le samedi, la file d'attente déborde sur le trottoir !"],
		["Quels projets vous tiennent à cœur en ce moment ?", "J'ai repéré un local à Wazemmes… Ouvrir une deuxième boutique, j'y pense tous les soirs."]],
	treso:[["Comment votre activité évolue-t-elle au fil de l'année ?", "L'hiver, ça tourne bien. Mais en août, les étudiants partent : ma trésorerie est à sec chaque été."],
		["Y a-t-il des périodes plus difficiles pour vous ?", "L'été ! Le quartier se vide, le chiffre d'affaires chute, et je dois quand même payer la farine."]]
};
const Q_LAB = { seul:"😓 Seul au fournil depuis 6 ans", boutique:"🏪 Ouvrir une 2e boutique", treso:"📉 Trésorerie à sec en été" };
const Q_BAD = [
	{ t:"Combien voulez-vous emprunter exactement ?", kind:"mid", mood:"neutre", rep:"Euh… 25 000 €, le prix du four.", lesson:"Question fermée : elle confirme la demande, mais ne révèle rien de neuf." },
	{ t:"Votre four, il est de quelle marque ?", kind:"mid", mood:"neutre", rep:"Un vieux modèle… Pourquoi, ça change quelque chose ?", lesson:"Une question de détail : elle ne fait pas avancer la compréhension du besoin." },
	{ t:"Avez-vous pensé à notre carte Premium ?", kind:"ko", mood:"agace", rep:"Je suis venu pour mon four, pas pour une carte…", lesson:"Proposer un produit avant d'avoir compris le client casse la confiance." },
	{ t:"Avez-vous une caution ou des garanties ?", kind:"ko", mood:"inquiet", rep:"Déjà ? Vous pensez que je ne pourrai pas rembourser ?", lesson:"Trop tôt : les garanties viendront, mais d'abord comprendre le projet." },
	{ t:"Vous êtes sûr de vouloir vous endetter ?", kind:"ko", mood:"inquiet", rep:"Vous pensez que c'est une mauvaise idée ? Je n'ai pas le choix, sans four…", lesson:"Une question qui juge : le client se ferme au lieu de se confier." }
];
const NEED_TXT = { seul:"le fait que vous soyez seul au fournil", boutique:"votre projet de deuxième boutique", treso:"vos étés difficiles côté trésorerie" };

// Mme Lefèvre : les signaux faibles du salon
const CLUES = {
	manteau:{ good:1, name:"Le portemanteau", lab:"🧥 Le manteau de son mari", txt:"Le manteau de son mari, toujours accroché à l'entrée : un deuil récent." },
	notaire:{ good:1, name:"La lettre sur le buffet", lab:"✉️ Courrier du notaire", txt:"Une lettre de l'étude notariale : une succession est en cours." },
	photo:{ good:1, name:"Le cadre photo", lab:"🎓 Théo, son petit-fils", txt:"Théo, son petit-fils, en tenue de remise de diplôme : elle aimerait l'aider pour ses études." },
	factures:{ good:1, name:"Les enveloppes", lab:"📬 Factures pas ouvertes", txt:"Des factures pas ouvertes : c'est son mari qui gérait les comptes, elle se sent perdue." },
	chat:{ name:"Le chat", lab:"🐈 Rien à signaler", txt:"" }, tele:{ name:"La télévision", lab:"📺 Rien à signaler", txt:"" }, plante:{ name:"Les plantes", lab:"🪴 Rien à signaler", txt:"" }
};

// Inès et Tom : cinq échanges, trois tons possibles
const TALK = [
	{ who:"tomU", line:"On n'a jamais fait ça… On a peur de poser des questions bêtes.", a:[
		["good", "Il n'y a pas de question bête. On va prendre le temps qu'il faut, ensemble."],
		["ko", "Vous auriez dû vous renseigner un peu avant de venir."],
		["mid", "Pas d'inquiétude, c'est simple : je remplis le dossier et vous signez."]] },
	{ who:"inesU", line:"Mon CDI a commencé il y a quatre mois… c'est un problème ?", a:[
		["good", "Pas du tout. On va regarder votre situation dans son ensemble, pas seulement la date du contrat."],
		["ko", "Aïe, quatre mois… Ça risque de coincer."],
		["mid", "Le taux d'endettement maximal est de 35 %, c'est tout ce qui compte."]] },
	{ who:"tomU", line:"Il faut que je vous dise… on a encore un petit crédit pour la voiture.", a:[
		["good", "Merci de me le dire : c'est important pour bien vous conseiller. On va l'intégrer."],
		["ko", "Encore un crédit ? Ça commence mal."],
		["mid", "D'accord. Question suivante."]] },
	{ who:"inesU", line:"Et si un jour on n'arrive plus à payer les mensualités ?", a:[
		["good", "C'est une vraie question. On va choisir une mensualité qui vous laisse respirer, et une assurance emprunteur adaptée."],
		["ko", "Il faudra vous serrer la ceinture, c'est le jeu."],
		["mid", "Ça n'arrive presque jamais, ne vous en faites pas."]] },
	{ who:"tomU", line:"On peut réfléchir avant de s'engager ?", a:[
		["good", "Bien sûr. Je vous envoie une simulation et on se revoit la semaine prochaine. De toute façon, la loi vous laisse dix jours de réflexion avant d'accepter l'offre."],
		["ko", "Si vous hésitez, c'est peut-être que vous n'êtes pas prêts."],
		["mid", "Il faudrait signer vite, les taux peuvent remonter."]] }
];
const TALK_FB = { good:"✓ Bienveillant : le couple se détend", mid:"≈ Correct, mais froid ou pressant", ko:"✗ Jugement : le couple se ferme" };

// Duval Textiles : quatre tournants, et le bon interlocuteur à mobiliser au bon moment
const EXPERTS = { inter:["🌍", "Spécialiste du commerce international"], ct:["💶", "Spécialiste du financement court terme"], cb:["🏗️", "Spécialiste du crédit-bail"], patri:["🏛️", "Ingénierie patrimoniale"], wait:["⏳", "Attendre de voir"] };
const EVENTS = [
	{ y:2027, t:"Un client allemand veut doubler ses commandes", d:"Belle opportunité… mais M. Duval n'a jamais exporté : sécuriser les paiements, financer le stock, gérer les délais.", good:"inter", grow:"export",
		ok:"Le spécialiste du commerce international sécurise les paiements (crédit documentaire) et finance les commandes : les camions partent pour l'Allemagne.", ko:"Sans accompagnement, le client allemand paie avec quatre mois de retard : la trésorerie plonge." },
	{ y:2029, t:"Les clients paient à 60 jours", d:"Les commandes affluent, mais il faut acheter le fil tout de suite. Chaque fin de mois, la trésorerie se tend.", good:"ct", grow:"coins",
		ok:"L'affacturage transforme les factures en trésorerie immédiate : l'usine tourne sans à-coups.", ko:"Faute de solution à temps, M. Duval paie ses fournisseurs en retard : l'un d'eux suspend ses livraisons." },
	{ y:2031, t:"Une nouvelle machine à 800 000 €", d:"Une machine à tisser plus moderne et plus économe en énergie. L'investissement est lourd pour une PME de 40 salariés.", good:"cb", grow:"machine",
		ok:"Le crédit-bail finance la machine sans vider la trésorerie : l'usine produit plus, en consommant moins.", ko:"L'achat comptant assèche la trésorerie : l'entreprise doit reporter ses embauches." },
	{ y:2033, t:"M. Duval a 61 ans", d:"Il pense à la retraite. Sa fille Clara travaille dans l'entreprise, mais rien n'est préparé pour la transmission.", good:"patri", grow:"clara",
		ok:"L'ingénierie patrimoniale, avec un notaire et un avocat, prépare sur plusieurs années la transmission à Clara, en limitant la fiscalité.", ko:"Rien n'est anticipé : quand M. Duval tombe malade, l'entreprise se retrouve sans dirigeant." }
];

// famille Martin : leurs objectifs, et les « blocs » qu'on peut empiler
const M_NEEDS = { reserve:"Garder une réserve disponible", retraite:"Compléter leurs revenus à la retraite, dans 6 ans", conjoint:"Protéger l'autre en cas de coup dur", enfants:"Aider leurs deux enfants à démarrer" };
const PRODUCTS = [
	{ id:"epargne", ic:"🐷", t:"Épargne de précaution", d:"Livrets, disponibles à tout moment", need:"reserve", col:"#4a8f8a" },
	{ id:"per", ic:"🌅", t:"Plan d'épargne retraite", d:"Des revenus pour plus tard", need:"retraite", col:"#e0a33a" },
	{ id:"av", ic:"🛡️", t:"Assurance-vie", d:"Épargne souple, transmission facilitée", need:"retraite", col:"#2f5d9e" },
	{ id:"prev", ic:"❤️", t:"Prévoyance", d:"Protéger le conjoint en cas de coup dur", need:"conjoint", col:"#c0392b" },
	{ id:"notaire", ic:"🤝", t:"Notaire partenaire", d:"Organiser une donation aux enfants", need:"enfants", col:"#6b4a8f" },
	{ id:"platinum", ic:"💳", t:"Carte Platinum", d:"Prestige et assurances voyage", bad:"Un produit de prestige ne répond à aucun de leurs objectifs.", col:"#9aa0a6" },
	{ id:"revolving", ic:"🔁", t:"Crédit renouvelable", d:"Une réserve d'argent… à crédit", bad:"Ils ont de l'épargne : leur proposer un crédit coûteux n'a pas de sens.", col:"#7a7a7a" },
	{ id:"structure", ic:"🎢", t:"Produit structuré complexe", d:"Rendement élevé, capital non garanti", bad:"Incompatible avec leur profil prudent : le devoir de conseil interdit de le leur recommander.", col:"#555b60" }
];

export function openAffaires({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("ca-css")){ const st = document.createElement("style"); st.id = "ca-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "ca"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Une journée de chargé d'affaires");
	root.innerHTML = `<canvas aria-hidden="true"></canvas><div class="ca-top"><span class="ca-chip ca-stage" id="caStage">Agence</span><button class="ca-x" aria-label="Quitter le jeu">×</button></div>
		<div class="ca-meters" aria-live="polite"><span class="ca-m"><small>🕘 Heure</small><b data-m="h">8 h 55</b></span><span class="ca-m" data-mood hidden><small data-who>Client</small><b data-m="mood">😐 Neutre</b></span><span class="ca-m" data-score hidden><small data-sk>Score</small><b data-m="score">0</b></span></div>
		<div class="ca-hint">↻ Fais tourner la maquette</div>
		<div class="ca-bubble off" title="Toucher pour masquer"><span class="av"></span><p><b></b><span></span></p></div>
		<div class="ca-wrap"><div class="ca-card"></div></div>`;
	document.body.appendChild(root);
	const canvas = root.querySelector("canvas"), wrap = root.querySelector(".ca-wrap"), card = root.querySelector(".ca-card"), hint = root.querySelector(".ca-hint"), bubble = root.querySelector(".ca-bubble"), meters = root.querySelector(".ca-meters");
	const W = world(canvas);
	function layout(){
		const w = innerWidth, h = innerHeight;
		if(w >= MOBILE){ W.resize(w - 444, h); hint.style.top = "112px"; Object.assign(bubble.style, { left:"12px", right:"456px", top:"auto", bottom:"14px" }); W.reserve(96); }
		// sur téléphone : la maquette en haut, le texte en bas, la bulle tout en haut et qui s'efface seule
		else { hint.hidden = true; const top = Math.round(h*.5); wrap.style.top = top + "px"; W.resize(w, top); Object.assign(bubble.style, { left:"8px", right:"8px", top:"96px", bottom:"auto" }); W.reserve(70, true); }
	}
	addEventListener("resize", layout); layout();
	canvas.addEventListener("pointerdown", () => hint.hidden = true, { once:true });

	const S = { score:{}, errors:0, busy:false, cur:null, where:null };
	let closed = false, gen = 0;
	// chaque rendez-vous a sa « génération » : les minuteries d'un rendez-vous abandonné ne touchent pas au suivant
	const later = (ms, f) => { const g = gen; setTimeout(() => { if(!closed && g === gen) f(); }, ms); };
	const show = html => { card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; wrap.scrollTo({ top:0, behavior:"smooth" }); };
	const scrollEnd = () => later(80, () => wrap.scrollTo({ top:wrap.scrollHeight, behavior:"smooth" }));
	const stage = t => { root.querySelector("#caStage").textContent = t; onEvent && onEvent("stage", t); };
	function meter(k, v){ const el = meters.querySelector(`[data-m="${k}"]`); if(el.textContent === v) return; el.textContent = v; el.parentNode.classList.remove("pop"); void el.offsetWidth; el.parentNode.classList.add("pop"); }
	function chips(scoreLabel){ meters.querySelector("[data-mood]").hidden = !S.cur; meters.querySelector("[data-score]").hidden = !scoreLabel; if(scoreLabel) meters.querySelector("[data-sk]").textContent = scoreLabel; if(S.cur) meters.querySelector("[data-who]").textContent = CLIENTS[S.cur].name; }
	function clockTo(h, m){ W.setClock(h, m); meter("h", `${h} h ${String(m).padStart(2, "0")}`); }
	// l'humeur du client : sur tous ses pions (à l'agence et dans son univers)
	function mood(md){ const C = CLIENTS[S.cur]; [...C.pawns, ...C.u].forEach(id => W.P[id].setMood(md)); meter("mood", MOOD_ICON[md] + " " + MOOD_TXT[md]); }
	function react(v){ const C = CLIENTS[S.cur]; (S.where ? C.u : C.pawns).forEach(id => W.react(id, v)); }
	// les répliques : la bulle de la directrice d'agence ou du client, écrite lettre à lettre
	let sayT = 0, hideT = 0;
	function say(who, text, pawn){
		const C = CLIENTS[who] || SPK[who], [av, name] = C ? [C.av, C.name] : ["👩‍💼", "Sophie · directrice d'agence"], sp = bubble.querySelector("p span");
		clearInterval(sayT); clearTimeout(hideT);
		bubble.classList.toggle("k", !!C); bubble.querySelector(".av").textContent = av; bubble.querySelector("p b").textContent = name;
		bubble.classList.remove("off"); sp.textContent = ""; let i = 0;
		W.talk(pawn || (C ? (S.where ? C.u[0] : C.pawns[0]) : "sophie"));
		sayT = setInterval(() => { if(closed) return clearInterval(sayT); sp.textContent = text.slice(0, ++i); if(i >= text.length) clearInterval(sayT); }, 18);
		if(innerWidth < MOBILE) hideT = setTimeout(() => bubble.classList.add("off"), 2800 + text.length*45);
	}
	bubble.addEventListener("click", () => bubble.classList.add("off"));
	// les cours cités sont ceux du programme officiel du master (fiche fges.fr)
	const course = (list, d) => `<div class="ca-course"><span class="tag">📚 Dans le programme du Master MBIF</span><b>${list.join(" · ")}</b><span>${d}</span></div>`;
	const verdict = (s, names) => `<div class="ca-verdict s${s}"><span class="st">${STARS(s)}</span>${names[s]}</div>`;

	/* ---------- intro : l'agence ouvre ---------- */
	function intro(){
		stage("Agence Vauban"); W.view("agence", 2.2);
		later(800, () => say(null, "Bienvenue à l'agence ! Tes clients t'attendent déjà… Un conseil : écoute-les vraiment."));
		show(`<div class="ca-k">Mini-jeu · ${formation.name}</div><h2 class="ca-h">Une journée de chargé d'affaires</h2>
			<p class="ca-p">Tu es <b>chargé d'affaires</b> à l'agence Vauban. Dans ta salle d'attente, des clients (fictifs) : un boulanger, une retraitée, un jeune couple, un patron de PME, une famille. Derrière chaque dossier, il y a <b>une personne, une histoire, un projet</b>.</p>
			<p class="ca-p">Chaque rendez-vous met à l'épreuve un geste du métier :</p>
			<ul class="ca-themes">${THEMES.map(([, n, ic], i) => `<li>${ic} <b>${n}</b> · ${["comprendre avant de conseiller", "percevoir au-delà des demandes", "instaurer la confiance", "être présent dans la durée", "apporter la réponse juste"][i]}</li>`).join("")}</ul>
			<p class="ca-p">Reçois tes clients dans l'ordre que tu veux (2 à 3 minutes chacun). À la fin de la journée, ce n'est pas ton chiffre d'affaires qu'on regarde : c'est ton <b>profil de chargé d'affaires</b>.</p>
			<button class="ca-go" data-a="agenda">Ouvrir mon agenda</button>`);
	}
	/* ---------- l'agenda du jour et le profil ---------- */
	function radar(){
		const c = 140, R = 92, pt = (i, v) => { const a = -Math.PI/2 + i*Math.PI*2/5; return [c + Math.cos(a)*R*v, c + Math.sin(a)*R*v]; };
		const poly = v => THEMES.map((_, i) => pt(i, v(i)).map(n => n.toFixed(1)).join(",")).join(" ");
		const val = i => Math.max(.04, (S.score[THEMES[i][0]] || 0)/3);
		return `<svg class="ca-radar" viewBox="-40 0 360 280" role="img" aria-label="Profil de chargé d'affaires">
			${[1, 2, 3].map(l => `<polygon points="${poly(() => l/3)}" fill="none" stroke="#d5dde2" stroke-width="1.2"/>`).join("")}
			${THEMES.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#d5dde2"/>`; }).join("")}
			<polygon points="${poly(val)}" fill="rgba(31,111,120,.35)" stroke="#1f6f78" stroke-width="2.5" stroke-linejoin="round"/>
			${THEMES.map(([k, n, ic], i) => { const [x, y] = pt(i, 1.22); return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12.5" font-weight="800" fill="${S.score[k] != null ? "#16324f" : "#9aa5ad"}">${ic} ${n}</text>`; }).join("")}
		</svg>`;
	}
	const done = id => S.score[CLIENTS[id].theme] != null;
	function agenda(){
		gen++; S.cur = null; S.where = null; S.busy = false; W.onPick = null; chips();
		bubble.classList.add("off");          // pas de réplique d'un rendez-vous précédent qui traîne
		const left = ORDER.filter(id => !done(id));
		if(!left.length) return S.mgmt == null ? manage() : finale();
		stage("Mon agenda"); W.view("agence", 1.6);
		const n = ORDER.length - left.length;
		show(`<div class="ca-k">${formation.name}</div><h2 class="ca-h">${n ? "Ma journée, pour l'instant" : "Mon agenda du jour"}</h2>
			<p class="ca-p">${n ? `${n} rendez-vous sur 5. Qui reçois-tu maintenant ?` : "Cinq rendez-vous, cinq gestes du métier. Choisis par qui commencer."}</p>
			<ul class="ca-agenda">${ORDER.map(id => { const C = CLIENTS[id], th = THEMES.find(t => t[0] === C.theme), d = done(id);
				return `<li><button class="${d ? "done" : ""}" ${d ? "disabled" : `data-c="${id}"`}><span class="h">${C.h[0]} h ${String(C.h[1]).padStart(2, "0")}</span><span class="w"><b>${C.who}</b><small>${C.kind} · ${th[2]} ${th[1]}</small></span><span class="s">${d ? STARS(S.score[C.theme]) : "Recevoir →"}</span></button></li>`; }).join("")}</ul>
			${n ? `<p class="ca-p" style="text-align:center;margin:10px 0 0"><b>Mon profil de chargé d'affaires</b></p>${radar()}` : ""}`);
		if(n) later(500, () => say(null, pick(["Ton prochain client t'attend !", "Belle matinée ! Qui reçois-tu maintenant ?", "Garde le rythme : chaque client mérite toute ton attention."])));
	}

	/* ---------- un rendez-vous : le client traverse l'agence, puis on plonge dans son univers ---------- */
	function receive(id){
		gen++; S.cur = id; S.where = null; S.busy = false;
		const C = CLIENTS[id];
		W.resetPeople(); ORDER.filter(done).forEach(k => CLIENTS[k].pawns.forEach(p => W.P[p].g.visible = false));
		RESET[id]();
		chips(); mood(id === "duval" ? "neutre" : id === "martin" ? "rassure" : "inquiet");
		stage(`${C.h[0]} h · ${C.name}`); clockTo(...C.h);
		W.view("agence", 1.2);
		say(null, `${C.name}, c'est à toi !`);
		// les clients traversent l'agence jusqu'au bureau (un seul : au centre ; un couple : sur les deux chaises)
		const spots = C.pawns.length > 1 ? [4.3, 5.7] : [5];
		C.pawns.forEach((p, i) => { const z = W.P[p].g.position.z; W.walk(p, [[-6.6, z + .6], [-.4, -.6 + i*.5], [2.8, -.7 + i*.5], [2.8, -4.3], [spots[i], -4.4]], i ? null : () => {
			if(S.where || S.cur !== id) return; W.view("bureau", 1.3); later(900, () => !S.where && say(id, C.hello)); }, 0); });
		later(700, () => !S.where && W.view("bureau", 3.4));
		show(`<span class="ca-time">${C.h[0]} h ${String(C.h[1]).padStart(2, "0")} · Rendez-vous</span><h2 class="ca-h">${C.who}</h2>
			<div class="ca-story">${C.story}</div>
			<p class="ca-p">${C.gesture}</p>
			<button class="ca-go" data-a="enter">${C.enter}</button>`);
	}
	function enter(){
		const id = S.cur, C = CLIENTS[id]; S.where = id;
		stage(C.stage);
		// la caméra plonge dans l'univers du client
		W.view(id, 2.4, 14);
		later(2200, () => { C.u.forEach((p, i) => setTimeout(() => W.hop(p), i*150)); play("pop"); });
		PLAY[id]();
	}
	function finish(stars, html){
		S.score[CLIENTS[S.cur].theme] = stars;
		play(stars >= 3 ? "good" : stars >= 2 ? "chime" : "bad");
		show(html + `<button class="ca-go" data-a="bye">Raccompagner ${CLIENTS[S.cur].name}</button>`);
	}
	function bye(){
		const id = S.cur, C = CLIENTS[id], stars = S.score[C.theme];
		S.where = null; W.onPick = null; chips();
		const end = C.h[0]*60 + C.h[1] + 30;
		stage("Agence Vauban"); clockTo(Math.floor(end/60), end % 60);
		W.view("bureau", 2.2, 12);
		later(2200, () => {
			if(stars >= 2){ mood("ravi"); C.pawns.forEach(p => W.hop(p, 2)); } else mood(stars ? "rassure" : "neutre");
			say(id, BYE[id](stars));
			later(1400, () => { C.pawns.forEach((p, i) => W.walk(p, [[2.8 + i*.4, -4.3], [2.8 + i*.4, -.7], [i*.6, 4.5], [i*.6, 7.5]], () => W.P[p].g.visible = false)); W.view("agence", 2.4); });
		});
		show(`<span class="ca-time">Quelques mois plus tard</span><h2 class="ca-h">Des nouvelles de ${C.name}</h2>
			<div class="ca-epi">${EPI[id](stars)}</div>
			<button class="ca-go" data-a="agenda">${ORDER.every(done) ? "Voir le bilan de ma journée" : "Retour à mon agenda"}</button>`);
	}

	/* ===== 1. Karim : l'écoute ===== */
	const K = { asked:[], found:[], qs:[] };
	function karimPlay(){
		Object.assign(K, { asked:[], found:[], loan:null });
		chips("Besoins découverts"); meter("score", "0 / 3");
		later(2300, () => say(null, "Ce que Karim dit, c'est la pointe de l'iceberg. Tu as le temps de poser 3 questions : fais apparaître ce qui est caché sous l'eau."));
		const good = Object.entries(Q_GOOD).map(([need, v]) => { const [t, rep] = pick(v); return { id:need, t, rep, need, mood:need === "boutique" ? "ravi" : "rassure" }; });
		const bad = shuffle(Q_BAD).slice(0, 3).map((q, i) => ({ ...q, id:"b" + i }));
		K.qs = shuffle([...good, ...bad]);
		show(`<span class="ca-time">9 h 05 · L'écoute</span><h2 class="ca-h">Sous la surface</h2>
			<p class="ca-p">Le rendez-vous dure vingt minutes : tu n'as le temps de poser que <b>trois questions</b>. Lesquelles feront baisser l'eau ?</p>
			<div class="ca-qn">Questions restantes <i data-left>💬💬💬</i></div>
			<div class="ca-qs">${K.qs.map(q => `<button class="ca-q" data-q="${q.id}">${q.t}</button>`).join("")}</div>
			<ul class="ca-log"></ul><div data-next></div>`);
	}
	function ask(id){
		if(S.busy || K.asked.length >= 3 || K.asked.includes(id)) return;
		const q = K.qs.find(x => x.id === id); K.asked.push(id); S.busy = true;
		card.querySelectorAll(".ca-q").forEach(b => { b.disabled = true; if(b.dataset.q === id) b.classList.add("used"); });
		card.querySelector("[data-left]").textContent = "💬".repeat(3 - K.asked.length) || "—";
		play("pop");
		later(350, () => {
			say("karim", q.rep); mood(q.mood);
			let tag;
			if(q.need){
				K.found.push(q.need); const i = K.found.length - 1;
				W.setLevel(K.found.length); W.reveal(i, W.NEEDS[q.need], Q_LAB[q.need]); react(1);
				play("good"); meter("score", `${K.found.length} / 3`);
				tag = `<span class="ca-tag ok">✓ Besoin découvert · question ouverte</span>`;
			} else {
				W.wave(); react(-1);
				if(q.kind === "ko"){ play("bad"); S.errors++; onEvent && onEvent("err"); } else play("chime");
				tag = `<span class="ca-tag ${q.kind}">${q.kind === "ko" ? "✗" : "≈"} ${q.lesson}</span>`;
			}
			card.querySelector(".ca-log").insertAdjacentHTML("beforeend", `<li><q>${q.t}</q><span>« ${q.rep} »</span>${tag}</li>`);
			scrollEnd();
			later(1300, () => {
				S.busy = false;
				if(K.asked.length < 3) return card.querySelectorAll(".ca-q").forEach(b => b.disabled = b.classList.contains("used"));
				reformuler();
			});
		});
	}
	// reformuler : montrer à Karim qu'on a compris, avant de proposer quoi que ce soit
	function reformuler(){
		const n = K.found.length;
		const full = n ? `Si je résume : il vous faut un four rapidement, mais j'entends aussi ${andJoin(K.found.map(k => NEED_TXT[k]))}. On regarde tout ça ensemble ?` : "Si je résume : il vous faut un four, rapidement. Y a-t-il autre chose qui vous préoccupe ?";
		const opts = shuffle([["good", full], ["mid", "Donc, un crédit de 25 000 € pour le four. Je lance le dossier."], ["ko", "Parfait : un crédit express pour le four, et je vous ajoute la carte Premium."]]);
		card.querySelector("[data-next]").innerHTML = `<p class="ca-p" style="margin-top:14px"><b>Dernière étape : reformuler.</b> Avant de proposer quoi que ce soit, montre à Karim que tu l'as compris.</p>
			<div class="ca-qs">${opts.map(([k, t]) => `<button class="ca-q" data-r="${k}">${t}</button>`).join("")}</div>`;
		scrollEnd();
		say(null, "Trois questions, c'est fait. Maintenant, reformule : c'est comme ça qu'il saura que tu l'as écouté.");
	}
	function reformulate(k){
		if(S.busy) return; S.busy = true;
		card.querySelectorAll("[data-r]").forEach(b => { b.disabled = true; if(b.dataset.r === k) b.classList.add("used"); });
		const n = K.found.length, stars = k === "good" ? n : Math.max(0, n - 1);
		if(k === "ko"){ S.errors++; onEvent && onEvent("err"); }
		for(let i = n; i < 3; i++) W.unknown(i);
		const md = k === "good" ? (n >= 2 ? "ravi" : "rassure") : k === "mid" ? "neutre" : "agace";
		mood(md); react(k === "good" ? 1 : -1); if(md === "ravi") W.hop("karimU", 2);
		say("karim", k === "good" ? (n >= 2 ? "Exactement ! Vous êtes le premier à me poser ces questions." : "Oui… c'est ça. Merci de m'avoir écouté.") : k === "mid" ? "Euh… oui, d'accord. Le four, quoi." : "Encore cette carte ? Bon… pour le four, alors.");
		K.stars = stars;
		later(1100, analyse);
	}
	// l'analyse financière : lire le compte de résultat de la boulangerie pour fixer le montant du prêt
	function analyse(){
		S.busy = false;
		say(null, "Bien écouté ! Maintenant, les chiffres. Regarde son compte de résultat avant de proposer un montant.");
		const opts = shuffle([["good", "25 000 € sur 5 ans", "environ 460 € par mois"], ["mid", "25 000 € sur 2 ans", "environ 1 090 € par mois"], ["ko", "60 000 € sur 3 ans", "le four et la 2e boutique tout de suite · environ 1 780 € par mois"]]);
		show(`<span class="ca-time">9 h 20 · L'analyse</span><h2 class="ca-h">Les chiffres de la boulangerie</h2>
			<p class="ca-p">Le compte de résultat simplifié de Karim, sur un an :</p>
			<table class="ca-cr"><tr><td>Chiffre d'affaires</td><td>240 000 €</td></tr>
				<tr class="neg"><td>Achats (farine, beurre, œufs…)</td><td>− 84 000 €</td></tr>
				<tr class="neg"><td>Loyer et charges du local</td><td>− 30 000 €</td></tr>
				<tr class="neg"><td>Rémunération de Karim et cotisations</td><td>− 60 000 €</td></tr>
				<tr class="neg"><td>Énergie, assurances, divers</td><td>− 36 000 €</td></tr>
				<tr class="t"><td>Disponible pour rembourser</td><td>30 000 € / an, soit 2 500 € / mois</td></tr>
				<tr class="neg"><td>Déjà remboursé : le prêt de sa camionnette</td><td>− 300 € / mois</td></tr></table>
			<p class="ca-p">Le four coûte 25 000 €. Quel prêt proposes-tu ? <small>(taux de 4 %, chiffres simplifiés)</small></p>
			<div class="ca-qs">${opts.map(([k, t, d]) => `<button class="ca-q nb" data-k="${k}"><span>💶 <b>${t}</b><br><small>${d}</small></span></button>`).join("")}</div><div data-res></div>`);
	}
	function loan(k){
		if(S.busy || K.loan) return; S.busy = true;
		card.querySelectorAll("[data-k]").forEach(b => { b.disabled = true; if(b.dataset.k === k) b.classList.add(k === "good" ? "ok" : "ko"); });
		const heard = K.found.includes("treso");
		const stars = k === "good" ? K.stars : Math.max(0, K.stars - (k === "ko" || heard ? 1 : 0));
		if(k === "ko"){ S.errors++; onEvent && onEvent("err"); }
		play(k === "good" ? "good" : "bad"); react(k === "good" ? 1 : -1); mood(k === "good" ? "ravi" : "inquiet");
		const txt = { good:"460 € par mois, plus les 300 € de la camionnette : 760 €, moins d'un tiers des 2 500 € qu'il dégage. Karim garde de la marge pour l'été. La deuxième boutique aura son propre plan de financement, quand le projet sera mûr.",
			mid:`1 090 € plus 300 € : 1 390 € par mois, plus de la moitié de ce qu'il dégage. En août, quand le chiffre d'affaires chute, Karim serait à découvert.${heard ? " Il te l'avait pourtant dit !" : ""}`,
			ko:"1 780 € plus 300 € : 2 080 € par mois, plus de 80 % de ce qu'il dégage. Beaucoup trop risqué : la boutique mérite d'abord une étude à part." }[k];
		say("karim", k === "good" ? "460 € par mois ? Ça, je peux le tenir, même en août !" : "Hum… ça me paraît lourd, vous êtes sûr ?");
		// l'année de Karim défile sur la maquette : la pile de pièces, ce qui reste chaque mois après les remboursements
		const pay = { good:460, mid:1090, ko:1780 }[k];
		card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px">📅 Regarde l'année de Karim défiler sur la maquette : la pile de pièces, c'est ce qu'il lui reste chaque mois.</p>`;
		W.look(W.U.karim.x - 1, 7.5, 14.5, W.U.karim.x - 1, 2.6, W.U.karim.z + .5, 1.4, 0, 4.5);
		W.cashYear(pay, () => {
			card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${k}">${k === "good" ? "✓ Un prêt à sa mesure : jamais à découvert" : "✗ Une mensualité trop lourde : découvert en été"}</span><br>${txt}</p>
				<button class="ca-go" data-a="karimEnd">Voir le bilan du rendez-vous</button>`;
			scrollEnd();
		});
		K.loan = k; K.stars2 = stars; scrollEnd(); S.busy = false;
	}
	function karimEnd(){
		const stars = K.stars2, n = K.found.length;
		const missing = ["seul", "boutique", "treso"].filter(x => !K.found.includes(x));
		finish(stars, `<span class="ca-time">9 h 25 · Le bilan</span><h2 class="ca-h">L'iceberg de Karim</h2>
			${verdict(stars, ["Écoute à retravailler", "Écoute partielle", "Bonne écoute", "Écoute remarquable"])}
			<ul class="ca-ice"><li class="top">☁️ Ce qu'il a dit : un crédit pour le four</li>${K.found.map(x => `<li>🧊 ${Q_LAB[x]}</li>`).join("")}${missing.map(x => `<li class="miss">❓ Resté sous l'eau : ${Q_LAB[x].slice(3)}</li>`).join("")}</ul>
			<p class="ca-p">${n === 3 ? "Tu as fait émerger tout l'iceberg. Tu peux proposer bien plus qu'un crédit : un prêt pour le four, une solution de trésorerie pour l'été, un premier pas vers l'embauche d'un apprenti, et un rendez-vous dans six mois pour la deuxième boutique." : "Un four, c'est la demande. Mais derrière, Karim avait d'autres besoins : les découvrir, c'est l'aider vraiment… et c'est construire une relation qui dure."}</p>
			<p class="ca-p">💶 Le prêt : ${K.loan === "good" ? "25 000 € sur 5 ans, une mensualité qui laisse de la marge." : "une mensualité trop lourde pour la boulangerie."}</p>
			<div class="ca-tip">💡 <b>Le réflexe du chargé d'affaires :</b> des <b>questions ouvertes</b> (« comment », « où vous voyez-vous… ») font parler le client. Les questions fermées confirment, les produits proposés trop tôt referment la discussion. Puis on <b>reformule</b>, et on vérifie avec les <b>chiffres</b> ce que le client peut vraiment rembourser.</div>
			${course(["Entrée en relation – produits d'épargne bancaire", "Analyse des besoins et risques financiers", "Décisions et techniques de financement des professionnels"], "Écouter, reformuler, lire les comptes d'un professionnel et dimensionner son financement : du premier rendez-vous au dossier de crédit.")}`);
	}

	/* ===== 2. Mme Lefèvre : la sensibilité ===== */
	const L = { left:6, found:[], tried:[] };
	function lefevrePlay(){
		Object.assign(L, { left:6, found:[], tried:[], comp:null, approach:null });
		chips("Signaux repérés"); meter("score", "0 / 4");
		later(2300, () => say(null, "Elle dit qu'elle vient pour un virement… Regarde autour d'elle. Touche les objets qui te disent quelque chose."));
		show(`<span class="ca-time">10 h 35 · La sensibilité</span><h2 class="ca-h">Ce qu'elle ne dit pas</h2>
			<p class="ca-p">Mme Lefèvre ne parle que de son virement. Mais son univers en dit beaucoup plus. Avec ta <b>loupe</b>, touche les objets de la maquette pour repérer les <b>signaux faibles</b>.</p>
			<div class="ca-loupe">Coups de loupe <i data-left>${"🔍".repeat(L.left)}</i></div>
			<ul class="ca-found"></ul>
			<details class="ca-objs"><summary>Ou choisis dans la liste des objets</summary><div>${shuffle(Object.keys(CLUES)).map(k => `<button data-o="${k}">${CLUES[k].name}</button>`).join("")}</div></details>
			<div data-next></div>`);
		W.onPick = loupe;
	}
	function loupe(id){
		if(S.busy || !L.left || L.tried.includes(id)) return;
		const c = CLUES[id]; L.tried.push(id); L.left--;
		card.querySelector(`[data-o="${id}"]`).disabled = true;
		card.querySelector("[data-left]").textContent = "🔍".repeat(L.left) || "—";
		W.markClue(id, c.lab, c.good);
		if(c.good){ L.found.push(id); meter("score", `${L.found.length} / 4`); play("good"); W.react("lefevreU", 1);
			card.querySelector(".ca-found").insertAdjacentHTML("beforeend", `<li>${c.txt}</li>`); }
		else { play("pop"); card.querySelector(".ca-found").insertAdjacentHTML("beforeend", `<li class="no">${c.lab}</li>`); }
		scrollEnd();
		if(L.found.length === 4 || !L.left){ W.onPick = null; S.busy = true; later(900, approach); }
	}
	function approach(){
		const opts = shuffle([["good", "Je suis désolé pour votre mari. Comment vous sentez-vous pour gérer tout ça ? On peut prendre le temps d'en parler, si vous le souhaitez."],
			["mid", "Bien. Passons à votre virement, madame Lefèvre."],
			["ko", "Avec la succession, vous allez recevoir de l'argent : on pourrait le placer rapidement !"]]);
		card.querySelector("[data-next]").innerHTML = `<p class="ca-p" style="margin-top:14px"><b>Avant de passer au virement</b>, que lui dis-tu ?</p>
			<div class="ca-qs">${opts.map(([k, t]) => `<button class="ca-q" data-l="${k}">${t}</button>`).join("")}</div>`;
		scrollEnd(); S.busy = false;
		say(null, L.found.length >= 3 ? "Tu as vu ce qui se passe dans sa vie. Maintenant, trouve les mots justes." : "Tu n'as pas tout vu… mais tu peux encore lui ouvrir une porte.");
	}
	function lefevreEnd(k){
		if(S.busy) return; S.busy = true;
		card.querySelectorAll("[data-l]").forEach(b => { b.disabled = true; if(b.dataset.l === k) b.classList.add(k === "good" ? "ok" : "ko"); });
		const f = L.found.length, base = f >= 4 ? 3 : f >= 3 ? 2 : f >= 2 ? 1 : 0, stars = k === "good" ? base : Math.max(0, base - (k === "ko" ? 2 : 1));
		if(k === "ko"){ S.errors++; onEvent && onEvent("err"); }
		mood(k === "good" ? "rassure" : k === "ko" ? "agace" : "neutre"); react(k === "good" ? 1 : -1);
		say("lefevre", k === "good" ? "Merci… C'est Robert qui s'occupait de tout. Je ne sais même pas par où commencer." : k === "ko" ? "Placer ? Robert n'est parti que depuis trois mois…" : "Oui… le virement.");
		Object.assign(L, { approach:k, stars });
		later(1600, transferStep);
	}
	// la conformité : le virement demandé au profit de son fils, et le risque d'abus de faiblesse
	function transferStep(){
		S.busy = false;
		W.place("didier", W.U.lefevre, -4.2, 0, 3.6, 2.4); W.P.didier.setMood("agace");
		say("lefevre", "Didier, mon fils, m'attend dans l'entrée. Il dit que c'est urgent, pour une affaire… Je ne sais pas trop.");
		const opts = shuffle([["good", "Prendre le temps : la recevoir seule, vérifier qu'elle comprend et souhaite ce virement, et en parler à Sophie et au service conformité avant de l'exécuter."],
			["ko", "Exécuter le virement : c'est son argent, et c'est son fils."],
			["mid", "Refuser le virement et demander à Didier de partir."]]);
		show(`<span class="ca-time">10 h 50 · La conformité</span><h2 class="ca-h">Le virement</h2>
			<div class="ca-story">Mme Lefèvre te tend un ordre de virement de <b>18 000 €</b> vers le compte de son fils Didier. Didier l'a accompagnée, il attend dans l'entrée et s'impatiente.</div>
			<p class="ca-p">Les virements vers Didier sur son compte :</p>
			<table class="ca-cr"><tr><td>12 août (un mois après le décès)</td><td>5 000 €</td></tr><tr><td>23 septembre</td><td>8 000 €</td></tr><tr class="t"><td>Aujourd'hui</td><td>18 000 €</td></tr></table>
			<p class="ca-p"><b>Que fais-tu ?</b></p>
			<div class="ca-qs">${opts.map(([k, t]) => `<button class="ca-q" data-v="${k}">${t}</button>`).join("")}</div><div data-res></div>`);
	}
	function transfer(k){
		if(S.busy || L.comp) return; S.busy = true; L.comp = k;
		card.querySelectorAll("[data-v]").forEach(b => { b.disabled = true; if(b.dataset.v === k) b.classList.add(k === "good" ? "ok" : "ko"); });
		const D_ = W.P.didier, out = () => W.walk("didier", [[W.U.lefevre.x - 7.5, W.U.lefevre.z + 4.5]], () => D_.g.visible = false);
		if(k === "good"){ play("good"); mood("rassure"); react(1); say("lefevre", "Vous avez raison… Je me sens bousculée, en ce moment. Merci de prendre le temps."); setTimeout(out, 900); }
		else if(k === "ko"){ play("bad"); S.errors++; onEvent && onEvent("err"); D_.setMood("ravi"); W.hop("didier", 2); mood("inquiet"); say("lefevre", "Bon… Si Didier dit que c'est urgent."); }
		else { play("chime"); D_.setMood("agace"); W.shake(D_.g, .15); mood("inquiet"); say("lefevre", "Oh… Didier va être furieux. C'est quand même mon fils…"); setTimeout(out, 1200); }
		card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${k}">${k === "good" ? "✓ Vigilance et respect de la cliente" : k === "mid" ? "≈ Protecteur, mais tu décides à sa place" : "✗ Signaux d'alerte ignorés"}</span><br>${{
			good:"Deuil récent, comptes qu'elle ne gérait pas, virements de plus en plus gros, pression d'un proche : ce sont des signaux d'un possible <b>abus de faiblesse</b>. Le chargé d'affaires ne décide pas à la place de la cliente : il vérifie son consentement, lui laisse le temps, et alerte sa hiérarchie et la conformité.",
			mid:"Tu protèges Mme Lefèvre, mais tu décides à sa place et tu accuses son fils, peut-être de bonne foi. Il fallait d'abord l'écouter seule, puis en référer à ta hiérarchie.",
			ko:"Trois virements en deux mois, de plus en plus gros, juste après un deuil, sous la pression d'un proche : tu n'as pas vu les signaux d'un possible abus de faiblesse." }[k]}</p>
			<button class="ca-go" data-a="lefevreFinish">Voir le bilan du rendez-vous</button>`;
		scrollEnd(); S.busy = false;
	}
	function lefevreFinish(){
		const k = L.approach, stars = Math.max(0, L.stars - (L.comp === "good" ? 0 : 1));
		const miss = ["manteau", "notaire", "photo", "factures"].filter(x => !L.found.includes(x));
		finish(stars, `<span class="ca-time">11 h 00 · Le bilan</span><h2 class="ca-h">Les signaux faibles</h2>
			${verdict(stars, ["Sensibilité à développer", "Sensibilité partielle", "Belle sensibilité", "Sensibilité remarquable"])}
			<ul class="ca-found">${L.found.map(x => `<li>${CLUES[x].txt}</li>`).join("")}${miss.map(x => `<li class="no">Pas vu : ${CLUES[x].txt}</li>`).join("")}</ul>
			<p class="ca-p">🛡️ Le virement de 18 000 € : ${L.comp === "good" ? "tu as pris le temps de vérifier, et alerté ta hiérarchie." : L.comp === "mid" ? "refusé d'office, sans écouter la cliente." : "exécuté malgré les signaux d'alerte."}</p>
			<p class="ca-p">${k === "good" ? "Mme Lefèvre est venue pour un virement. Elle repart avec un rendez-vous pour faire le point sur la succession, ses comptes, et le projet d'aider Théo. Et surtout : quelqu'un l'a vue." : k === "ko" ? "Parler placement à une veuve en plein deuil, c'est la blesser. Le bon produit au mauvais moment est un mauvais conseil." : "Tu es passé directement au virement : Mme Lefèvre repart seule avec ses factures et sa succession. Elle n'osera peut-être pas revenir."}</p>
			<div class="ca-tip">💡 <b>Le réflexe du chargé d'affaires :</b> repérer les <b>moments de vie</b> (deuil, naissance, retraite, études…) et les signaux faibles, puis ouvrir la porte avec tact, au rythme du client. Et rester vigilant : une personne fragilisée peut être la cible d'un abus de faiblesse, le banquier doit savoir le repérer et alerter.</div>
			${course(["Stratégies du conseil", "Droit bancaire", "Contrôles et audits internes", "Éthique et finance"], "Accompagner un client fragilisé : écouter, adapter son approche, repérer les opérations inhabituelles et alerter, sans jamais décider à sa place.")}`);
	}

	/* ===== 3. Inès et Tom : la bienveillance ===== */
	const B = { i:0, good:0, calc:null };
	function couplePlay(){
		Object.assign(B, { i:0, good:0, calc:null });
		chips("Planches posées"); meter("score", "0 / 5");
		later(2300, () => say(null, "Avant de parler, fais tes calculs : la bienveillance, c'est aussi ne pas laisser un couple s'endetter plus qu'il ne peut."));
		calcStep();
	}
	// la rigueur avant la bienveillance : le taux d'endettement (mensualités ÷ revenus)
	function calcStep(){
		const opts = shuffle([["ko1", "Environ 18 %"], ["good", "Environ 29 %"], ["ko2", "Environ 40 %"]]);
		show(`<span class="ca-time">14 h 05 · Les calculs</span><h2 class="ca-h">Peuvent-ils emprunter ?</h2>
			<table class="ca-cr"><tr><td>Salaire net d'Inès</td><td>2 150 € / mois</td></tr><tr><td>Salaire net de Tom</td><td>1 850 € / mois</td></tr>
				<tr class="t"><td>Revenus du couple</td><td>4 000 € / mois</td></tr><tr class="neg"><td>Mensualité du prêt envisagé (assurance comprise)</td><td>1 150 € / mois</td></tr></table>
			<p class="ca-p"><b>Quel est leur taux d'endettement</b> (mensualités ÷ revenus) ?</p>
			<div class="ca-qs">${opts.map(([k, t]) => `<button class="ca-q nb" data-t="${k}">📊 ${t}</button>`).join("")}</div><div data-res></div>`);
	}
	function calc(k){
		if(B.calc) return; B.calc = k === "good" ? "ok" : "ko";
		card.querySelectorAll("[data-t]").forEach(b => { b.disabled = true; if(b.dataset.t === k) b.classList.add(k === "good" ? "ok" : "ko"); else if(b.dataset.t === "good") b.classList.add("ok"); });
		play(k === "good" ? "good" : "bad"); if(k !== "good"){ S.errors++; onEvent && onEvent("err"); }
		W.setGauge(29);
		card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${k === "good" ? "ok" : "ko"}">${k === "good" ? "✓ Bien calculé" : "✗ Pas tout à fait"}</span><br>1 150 ÷ 4 000 = 28,75 %, soit environ 29 %. En France, le Haut Conseil de stabilité financière demande aux banques de ne pas dépasser, sauf exception, 35 % d'endettement, assurance comprise. Le projet passe… pour l'instant.</p>
			<button class="ca-go" data-a="talk">Recevoir Inès et Tom</button>`;
		scrollEnd();
	}
	const moodsB = ["inquiet", "inquiet", "neutre", "rassure", "rassure", "ravi"];
	function talkStep(){
		const T = TALK[B.i];
		show(`<span class="ca-time">14 h 05 · La bienveillance</span><h2 class="ca-h">Le pont de la confiance</h2>
			<div class="ca-plank">${[0, 1, 2, 3, 4].map(i => `<i data-pk="${i}"></i>`).join("")}</div>
			<p class="ca-who">${T.who === "inesU" ? "Inès" : "Tom"} : <span>« ${T.line} »</span></p>
			<div class="ca-qs">${shuffle(T.a).map(([k, t]) => `<button class="ca-q" data-b="${k}">${t}</button>`).join("")}</div>
			<p class="ca-p" style="margin-top:10px;font-size:13px;color:#7a858d">Échange ${B.i + 1} sur ${TALK.length}</p><div data-res></div>`);
		paintPlanks();
		later(300, () => say("couple", T.line, T.who));
	}
	function paintPlanks(){ card.querySelectorAll("[data-pk]").forEach((e, i) => e.classList.toggle("on", i < planks)); }
	let planks = 0;
	function answer(k){
		if(S.busy) return; S.busy = true;
		card.querySelectorAll("[data-b]").forEach(b => { b.disabled = true; if(b.dataset.b === k) b.classList.add(k === "good" ? "ok" : "ko"); });
		if(k === "good"){ B.good++; planks = Math.min(5, planks + 1); W.plank(true); react(1); play("good"); }
		else { if(planks){ planks--; W.plank(false); } react(-1); play(k === "ko" ? "bad" : "chime"); if(k === "ko"){ S.errors++; onEvent && onEvent("err"); } }
		meter("score", `${planks} / 5`);
		const lvl = Math.max(0, Math.min(5, planks + (k === "ko" ? -1 : 0)));
		mood(k === "ko" ? "agace" : moodsB[lvl]);
		paintPlanks();
		card.querySelector("[data-res]").innerHTML = `<span class="ca-tag ${k}">${TALK_FB[k]}</span>`;
		// le crédit auto avoué par Tom change le calcul : on le montre, et on laisse le temps de le lire
		if(B.i === 2) W.setGauge(35);
		if(B.i === 2) card.querySelector("[data-res]").insertAdjacentHTML("beforeend", `<div class="ca-tip">📊 Avec le crédit auto (250 € par mois) : (1 150 + 250) ÷ 4 000 = <b>35 %</b>, pile la limite. On pourra allonger la durée du prêt ou attendre la fin du crédit auto : c'est le rôle du conseiller de trouver la solution.</div>`);
		scrollEnd();
		later(B.i === 2 ? 4200 : 1500, () => { S.busy = false; if(++B.i < TALK.length) talkStep(); else coupleEnd(); });
	}
	function coupleEnd(){
		const stars = Math.max(0, (B.good >= 5 ? 3 : B.good >= 4 ? 2 : B.good >= 3 ? 1 : 0) - (B.calc === "ko" ? 1 : 0)), full = planks >= 5;
		if(full){
			mood("ravi");
			W.walk("inesU", [[W.U.couple.x - 2.6, W.U.couple.z - .5]], null); W.walk("tomU", [[W.U.couple.x - 2.6, W.U.couple.z + .5]], () => { W.hop("inesU", 2); W.hop("tomU", 2); W.hop("toiC"); });
			say("couple", "On l'a fait ! Merci de nous avoir pris au sérieux.", "inesU");
		} else say("couple", planks >= 3 ? "Merci… On va réfléchir à tout ça." : "On va peut-être voir une autre banque…", "tomU");
		later(full ? 2600 : 1200, () => finish(stars, `<span class="ca-time">14 h 30 · Le bilan</span><h2 class="ca-h">${full ? "Le pont est construit !" : "Un pont inachevé"}</h2>
			${verdict(stars, ["Bienveillance à travailler", "Bienveillance fragile", "Belle bienveillance", "Bienveillance exemplaire"])}
			<p class="ca-p">${full ? "Inès et Tom ont traversé : ils te font confiance. Ils repartent avec une simulation claire, et l'envie de revenir te voir." : `${B.good} réponse${B.good > 1 ? "s" : ""} bienveillante${B.good > 1 ? "s" : ""} sur 5. Un premier achat, c'est souvent le projet d'une vie : chaque jugement, chaque pression éloigne le client.`}</p>
			<p class="ca-p">📊 Le calcul du taux d'endettement : ${B.calc === "ok" ? "juste, et c'est lui qui t'a permis de rassurer avec des faits." : "à revoir : sans chiffres justes, on rassure à tort."}</p>
			<div class="ca-tip">💡 <b>Le réflexe du chargé d'affaires :</b> accueillir sans juger, rassurer avec des faits (des calculs justes), laisser le temps de décider. D'ailleurs, la loi l'impose : après avoir reçu l'offre de prêt immobilier, l'emprunteur dispose de dix jours de réflexion avant de pouvoir l'accepter.</div>
			${course(["Entrée en relation – produits d'épargne bancaire", "Droit bancaire", "Négociation"], "Accueillir, rassurer, appliquer les règles d'octroi du crédit et le devoir de conseil : accompagner un premier achat, de la simulation à la signature.")}`));
	}

	/* ===== 4. Duval Textiles : l'accompagnement ===== */
	const D = { i:0, res:[] };
	function duvalPlay(){
		Object.assign(D, { i:0, res:[], sig:null, sigSel:[], sigDone:false });
		chips("Bons relais"); meter("score", "0 / 4");
		later(2300, () => say(null, "Tu vas suivre Duval Textiles pendant des années. À chaque tournant, mobilise le bon interlocuteur… au bon moment."));
		eventStep();
	}
	// en 2029, avant de choisir l'expert : lire le tableau de bord de l'entreprise et repérer les signaux de risque
	const SIGNALS = [
		{ id:"ca", v:"+ 18 %", t:"Chiffre d'affaires sur un an", why:"Une croissance saine : rien d'inquiétant." },
		{ id:"stock", alert:1, v:"+ 45 %", t:"Stocks de fil, alors que les ventes ne progressent que de 18 %", why:"Du fil acheté et payé, mais pas encore vendu : de la trésorerie qui dort dans l'entrepôt." },
		{ id:"client", alert:1, v:"95 jours", t:"Délai de paiement d'Autolux, le premier client (60 jours prévus)", why:"Le premier client paie de plus en plus tard : risque d'impayé, et trésorerie qui fond." },
		{ id:"staff", v:"40", t:"Salariés, effectif stable", why:"Rien d'anormal." }
	];
	function signalStep(){
		const E = EVENTS[D.i]; D.sigSel = [];
		W.setWeather("cloud"); yearLabel(E.y); W.alerts(true);
		show(`<span class="ca-time">${E.y} · Le tableau de bord</span><h2 class="ca-h">Quelque chose cloche…</h2>
			<div class="ca-years">${EVENTS.map((e, i) => `<span class="${D.res[i] === true ? "ok" : D.res[i] === false ? "ko" : i === D.i ? "on" : ""}">${e.y}</span>`).join("")}</div>
			<p class="ca-p">Avant d'agir, lis les chiffres de Duval Textiles. <b>Quels signaux t'inquiètent ?</b> (touche-les)</p>
			<div class="ca-sig">${shuffle(SIGNALS).map(s => `<button data-s="${s.id}" aria-pressed="false"><b>${s.v}</b>${s.t}</button>`).join("")}</div>
			<div data-res></div><button class="ca-go" data-a="sigOk" disabled>Valider mon analyse</button>`);
		later(300, () => say(null, "Un bon chargé d'affaires lit les chiffres de ses clients avant qu'ils l'appellent. Regarde bien."));
	}
	function toggleSignal(id){
		if(D.sigDone) return;
		const b = card.querySelector(`[data-s="${id}"]`), on = b.getAttribute("aria-pressed") !== "true";
		b.setAttribute("aria-pressed", on); D.sigSel = on ? [...D.sigSel, id] : D.sigSel.filter(x => x !== id);
		card.querySelector('[data-a="sigOk"]').disabled = !D.sigSel.length; play("pop");
	}
	function sigOk(){
		D.sigDone = true;
		const good = D.sigSel.filter(id => SIGNALS.find(s => s.id === id).alert), wrong = D.sigSel.length - good.length;
		D.sig = { good:good.length, wrong };
		card.querySelectorAll("[data-s]").forEach(b => { const s = SIGNALS.find(x => x.id === b.dataset.s), sel = D.sigSel.includes(s.id); b.disabled = true; const cls = s.alert ? (sel ? "ok" : "miss") : sel ? "ko" : null; if(cls) b.classList.add(cls); });
		good.forEach(id => W.flag(id === "stock" ? "stock" : "client"));
		play(good.length === 2 && !wrong ? "good" : "chime");
		if(good.length === 2 && !wrong) react(1);
		card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${good.length === 2 && !wrong ? "ok" : "mid"}">${good.length === 2 && !wrong ? "✓ Les deux signaux repérés" : `${good.length} signal${good.length > 1 ? "s" : ""} sur 2${wrong ? `, ${wrong} fausse alerte` : ""}`}</span></p>
			<ul class="ca-found">${SIGNALS.filter(s => s.alert).map(s => `<li>⚠️ ${s.why}</li>`).join("")}</ul>`;
		card.querySelector('[data-a="sigOk"]').outerHTML = `<button class="ca-go" data-a="sigNext">Choisir l'interlocuteur →</button>`;
		scrollEnd();
	}
	function eventStep(){
		const E = EVENTS[D.i];
		if(D.i === 1 && !D.sigDone) return signalStep();
		W.setWeather("cloud"); yearLabel(E.y);
		// 2031 : les signaux manqués en 2029 ont grossi
		const missed = D.i === 2 && D.sig ? SIGNALS.filter(s => s.alert && !D.sigSel.includes(s.id)) : [];
		missed.forEach(s => later(600, () => { W.consequence(s.id === "stock" ? "stock" : "client"); play("bad"); }));
		if(missed.length) later(700, () => { mood("inquiet"); react(-1); });
		show(`<span class="ca-time">${E.y} · L'accompagnement</span><h2 class="ca-h">${E.t}</h2>
			<div class="ca-years">${EVENTS.map((e, i) => `<span class="${D.res[i] === true ? "ok" : D.res[i] === false ? "ko" : i === D.i ? "on" : ""}">${e.y}</span>`).join("")}</div>
			${missed.length ? `<div class="ca-tip" style="border-color:#c0392b;background:#fdeceb">⚠️ <b>Les signaux que tu n'as pas vus en 2029 ont grossi :</b> ${missed.map(s => s.id === "stock" ? "les stocks débordent, 200 000 € de fil dorment dans l'entrepôt" : "Autolux a fait faillite, 120 000 € de factures ne seront jamais payées").join(" ; ")}. Sans la trésorerie, ce projet sera plus dur à financer.</div>` : ""}
			<div class="ca-story">${E.d}</div>
			<p class="ca-p"><b>Qui mobilises-tu ?</b></p>
			<div class="ca-exp">${Object.entries(EXPERTS).map(([k, [ic, n]]) => `<button data-x="${k}"><span>${ic}</span>${n}</button>`).join("")}</div><div data-res></div>`);
		later(300, () => say("duval", pick(["Dites, j'ai une question…", "Il se passe quelque chose, j'aimerais votre avis.", "On a besoin de vous !"]), "duvalU"));
	}
	// les années passent : M. Duval grisonne
	function yearLabel(y){ W.setYear(y); if(y >= 2031) W.P.duvalU.setHair(y >= 2033 ? "#d0d0d0" : "#9a9a9a"); }
	function mobilize(k){
		if(S.busy) return; S.busy = true;
		const E = EVENTS[D.i], ok = k === E.good;
		card.querySelectorAll("[data-x]").forEach(b => { b.disabled = true; if(b.dataset.x === k) b.classList.add(ok ? "ok" : "ko"); else if(b.dataset.x === E.good && !ok) b.classList.add("ok"); });
		D.res[D.i] = ok;
		const after = () => {
			if(ok){ W.setWeather("sun"); W.grow(E.grow); play("good"); react(1); mood(D.i === 3 ? "ravi" : "rassure"); }
			else { W.setWeather("storm"); play("bad"); react(-1); mood("inquiet"); S.errors++; onEvent && onEvent("err"); }
			meter("score", `${D.res.filter(Boolean).length} / 4`);
			say("duval", ok ? pick(["Parfait, vous avez vu juste !", "Heureusement que vous étiez là.", "Exactement ce qu'il nous fallait !"]) : "Aïe… on aurait dû s'y prendre autrement.", "duvalU");
			card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${ok ? "ok" : "ko"}">${ok ? "✓ Le bon relais, au bon moment" : k === "wait" ? "✗ Trop tard : attendre, c'est subir" : "✗ Pas le bon interlocuteur"}</span><br>${ok ? E.ok : E.ko}</p>
				<button class="ca-go" data-a="${D.i < EVENTS.length - 1 ? "nextEvent" : "duvalEnd"}">${D.i < EVENTS.length - 1 ? `Avancer en ${EVENTS[D.i + 1].y} →` : "Faire le bilan"}</button>`;
			scrollEnd(); S.busy = false;
		};
		if(k === "wait") after(); else W.expert(k, ok, after);
	}
	function duvalEnd(){
		// 4 bons relais + 2 signaux repérés = 6 ; une fausse alerte retire un point
		const n = D.res.filter(Boolean).length, sg = D.sig ? D.sig.good - D.sig.wrong : 0, tot = n + sg;
		const stars = tot >= 6 ? 3 : tot >= 4 ? 2 : tot >= 3 ? 1 : 0;
		W.setWeather("none");
		finish(stars, `<span class="ca-time">2034 · Le bilan</span><h2 class="ca-h">Huit ans aux côtés de Duval Textiles</h2>
			${verdict(stars, ["Accompagnement à construire", "Accompagnement irrégulier", "Bon accompagnement", "Accompagnement exemplaire"])}
			<div class="ca-years">${EVENTS.map((e, i) => `<span class="${D.res[i] ? "ok" : "ko"}">${e.y}</span>`).join("")}</div>
			<p class="ca-p">📊 Les signaux de risque de 2029 : ${D.sig ? `${D.sig.good} sur 2 repérés${D.sig.wrong ? `, ${D.sig.wrong} fausse alerte` : ""}` : "non analysés"}.</p>
			<p class="ca-p">${n === 4 ? "Export, trésorerie, investissement, transmission : à chaque tournant, tu as anticipé et mobilisé le bon expert. Clara reprend une entreprise solide." : "Chaque tournant manqué a coûté cher à l'entreprise. Le chargé d'affaires n'est pas seul : son rôle est aussi de faire venir les bons experts au bon moment."}</p>
			<div class="ca-tip">💡 <b>Le réflexe du chargé d'affaires :</b> être <b>présent dans la durée</b>, anticiper les transitions (croissance, export, investissement, transmission) et coordonner les experts de la banque et ses partenaires.</div>
			${course(["Risque sur la clientèle professionnelle et PME", "Gestion des flux bancaires internationaux", "Droit du financement de l'entreprise", "Holdings – LBO – Transmission d'entreprises"], "Détecter les risques, financer la croissance et l'export, préparer la transmission : accompagner une PME à chaque étape de sa vie.")}`);
	}

	/* ===== 5. La famille Martin : l'expertise ===== */
	const T = { picked:[], bad:0 };
	// la conformité d'abord : connaître le client (objectifs, horizon, tolérance au risque, connaissances) avant tout conseil
	const PROFILE_Q = [
		["horizon", "Dans combien de temps aurez-vous besoin de cet argent ?", "Dans six ans pour la retraite. Et plus tard, pour aider Léa et Hugo."],
		["risque", "Si vos placements perdaient 20 % en un an, comment réagiriez-vous ?", "On ne dormirait plus ! Cet argent, c'est trente ans de travail."],
		["savoir", "Quels placements connaissez-vous ?", "Le livret A et l'assurance-vie en euros. La Bourse, on n'y connaît rien."]
	];
	function martinPlay(){
		Object.assign(T, { picked:[], bad:0, ended:false, asked:[], profile:null });
		chips("Objectifs couverts"); meter("score", "0 / 4");
		later(2300, () => say(null, "Avant de proposer quoi que ce soit, la réglementation t'impose de connaître leur profil. Pose-leur les questions."));
		show(`<span class="ca-time">17 h 05 · La conformité</span><h2 class="ca-h">Leur profil d'investisseur</h2>
			<p class="ca-p">Le <b>devoir de conseil</b> impose de connaître le client avant de lui proposer un placement : ses objectifs, son horizon, sa tolérance au risque, ses connaissances. Pose les trois questions.</p>
			<div class="ca-qs">${PROFILE_Q.map(([k, q]) => `<button class="ca-q" data-m="${k}">${q}</button>`).join("")}</div>
			<ul class="ca-log"></ul><div data-next></div>`);
	}
	function profileAsk(k){
		if(T.asked.includes(k)) return; T.asked.push(k);
		const [, q, a] = PROFILE_Q.find(x => x[0] === k);
		card.querySelector(`[data-m="${k}"]`).disabled = true; card.querySelector(`[data-m="${k}"]`).classList.add("used");
		say("martin", a, T.asked.length % 2 ? "martinF" : "martinU"); play("pop");
		card.querySelector(".ca-log").insertAdjacentHTML("beforeend", `<li><q>${q}</q><span>« ${a} »</span></li>`);
		if(T.asked.length === 3) card.querySelector("[data-next]").innerHTML = `<p class="ca-p" style="margin-top:14px"><b>Quel est leur profil ?</b></p>
			<div class="ca-qs">${[["prudent", "🛡️ Prudent", "préserver le capital avant tout"], ["equilibre", "⚖️ Équilibré", "accepter un peu de risque pour un meilleur rendement"], ["dynamique", "🚀 Dynamique", "viser la performance, quitte à perdre"]].map(([k, t, d]) => `<button class="ca-q nb" data-pf="${k}"><span><b>${t}</b><br><small>${d}</small></span></button>`).join("")}</div>`;
		scrollEnd();
	}
	function profile(k){
		if(T.profile) return; T.profile = k;
		const ok = k === "prudent";
		// le profil est consigné dans un document signé par les clients : la traçabilité du conseil
		W.profileDoc({ prudent:"prudent", equilibre:"équilibré", dynamique:"dynamique" }[k], ok);
		later(500, () => { W.hop("martinU"); W.hop("martinF"); });
		card.querySelectorAll("[data-pf]").forEach(b => { b.disabled = true; if(b.dataset.pf === k) b.classList.add(ok ? "ok" : "ko"); else if(b.dataset.pf === "prudent" && !ok) b.classList.add("ok"); });
		play(ok ? "good" : "bad"); if(!ok){ S.errors++; onEvent && onEvent("err"); }
		card.querySelector("[data-next]").insertAdjacentHTML("beforeend", `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${ok ? "ok" : "ko"}">${ok ? "✓ Profil prudent" : "✗ Leur profil est prudent"}</span><br>Une baisse de 20 % les empêcherait de dormir, ils ne connaissent pas la Bourse et partent à la retraite dans six ans : tout ce que tu leur proposeras devra respecter ce profil.<br>📝 Le profil est consigné dans un document qu'ils signent (sur la maquette) : le conseil est <b>tracé</b>, comme l'exige la réglementation.</p>
			<button class="ca-go" data-a="products">Construire leur solution →</button>`);
		scrollEnd();
	}
	function products(){
		later(300, () => say(null, "Chaque produit est un bloc de leur solution. Les bons s'emboîtent. Les mauvais font pencher la tour… et elle peut tomber."));
		show(`<span class="ca-time">17 h 15 · L'expertise</span><h2 class="ca-h">La tour des Martin</h2>
			<p class="ca-p">Construis leur solution, bloc par bloc (5 au maximum). Couvre leurs <b>quatre objectifs</b> sans rien d'inutile.</p>
			<ul class="ca-needs">${Object.entries(M_NEEDS).map(([k, t]) => `<li data-n="${k}">${t}</li>`).join("")}</ul>
			<div class="ca-prods">${shuffle(PRODUCTS).map(p => `<button data-p="${p.id}"><i>${p.ic}</i><span>${p.t}<small>${p.d}</small></span></button>`).join("")}</div>
			<div data-res></div><button class="ca-go" data-a="martinEnd" disabled>Présenter ma solution</button>`);
	}
	function stackProduct(id){
		if(S.busy || T.picked.includes(id) || T.picked.length >= 5) return;
		const p = PRODUCTS.find(x => x.id === id); T.picked.push(id);
		const b = card.querySelector(`[data-p="${id}"]`); b.disabled = true; b.classList.add(p.bad ? "ko" : "ok");
		W.stack(p.col, `${p.ic} ${p.t}`, !p.bad);
		play(p.bad ? "bad" : "pop");
		if(p.bad){ T.bad++; react(-1); mood("agace"); S.errors++; onEvent && onEvent("err");
			card.querySelector("[data-res]").insertAdjacentHTML("beforeend", `<p class="ca-p"><span class="ca-tag ko">✗ ${p.t} : ${p.bad}</span></p>`); }
		else { react(1); mood(covered().length >= 3 ? "ravi" : "rassure"); }
		const cov = covered();
		card.querySelectorAll("[data-n]").forEach(li => li.classList.toggle("on", cov.includes(li.dataset.n)));
		meter("score", `${cov.length} / 4`);
		card.querySelector('[data-a="martinEnd"]').disabled = false;
		if(T.bad >= 2){ S.busy = true; card.querySelectorAll("[data-p], [data-a='martinEnd']").forEach(x => x.disabled = true); later(900, () => { W.collapse(); play("bad"); say("martin", "Tout s'écroule… Ce n'est pas du tout ce que nous voulions.", "martinU"); later(1500, martinEnd); }); return; }
		if(T.picked.length >= 5) card.querySelectorAll("[data-p]").forEach(x => x.disabled = true);
		scrollEnd();
	}
	const covered = () => [...new Set(T.picked.map(id => PRODUCTS.find(x => x.id === id).need).filter(Boolean))];
	function martinEnd(){
		if(T.ended) return; T.ended = true; S.busy = true; card.querySelector('[data-a="martinEnd"]')?.setAttribute("disabled", "");
		const cov = covered().length, fell = T.bad >= 2, stars = fell ? 0 : Math.max(0, Math.min(3, cov - 1 - T.bad) - (T.profile === "prudent" ? 0 : 1));
		if(!fell){ mood(stars >= 3 ? "ravi" : stars >= 2 ? "rassure" : "neutre"); say("martin", stars >= 3 ? "C'est exactement ce dont nous avions besoin. Et merci de nous orienter vers le notaire !" : "Intéressant… mais il nous manque encore quelque chose.", "martinF"); if(stars >= 3){ W.hop("martinU", 2); W.hop("martinF", 2); } }
		const miss = Object.keys(M_NEEDS).filter(k => !covered().includes(k));
		later(1200, () => finish(stars, `<span class="ca-time">17 h 30 · Le bilan</span><h2 class="ca-h">${fell ? "La tour s'est effondrée" : "La solution des Martin"}</h2>
			${verdict(stars, ["Expertise à consolider", "Expertise partielle", "Bonne expertise", "Expertise remarquable"])}
			<ul class="ca-needs">${Object.entries(M_NEEDS).map(([k, t]) => `<li class="${miss.includes(k) ? "" : "on"}">${t}</li>`).join("")}</ul>
			<p class="ca-p">${fell ? "Deux produits inadaptés, et la confiance s'écroule. L'expertise, ce n'est pas vendre plus : c'est proposer juste." : miss.length ? `Il manque : ${miss.map(k => M_NEEDS[k].toLowerCase()).join(", ")}.` : "Réserve disponible, retraite, protection du conjoint, aide aux enfants avec le notaire : une solution sur mesure, sans rien d'inutile."}</p>
			<p class="ca-p">🛡️ Leur profil : ${T.profile === "prudent" ? "bien identifié (prudent)." : "mal identifié : ils sont prudents."}</p>
			<div class="ca-tip">💡 <b>Le réflexe du chargé d'affaires :</b> le <b>devoir de conseil</b> passe d'abord par la connaissance du client (objectifs, horizon, tolérance au risque, connaissances) : la réglementation l'impose avant de recommander un placement, et le conseil doit être tracé. Puis on part des <b>objectifs</b>, pas du catalogue. Et on sait passer la main : un notaire pour une donation, un conseiller en gestion de patrimoine pour une stratégie plus fine.</div>
			${course(["Épargne Assurance Vie", "Épargne salariale – Madelin – PEE – PERCO", "Stratégies patrimoniales et fiscales des particuliers", "Stratégie d'allocation d'actifs"], "Connaître le profil du client, construire une solution d'épargne, de retraite et de transmission adaptée, et travailler avec les experts partenaires.")}`));
	}

	/* ---------- au revoir et épilogues ---------- */
	const BYE = {
		karim:s => s >= 2 ? "Merci ! Je repars avec bien plus qu'un four." : "Merci pour le crédit. À bientôt.",
		lefevre:s => s >= 2 ? "Merci de m'avoir écoutée. Je reviendrai la semaine prochaine." : "Au revoir.",
		couple:s => s >= 2 ? "Merci ! On a hâte de vous revoir pour la suite." : "Merci… On va réfléchir.",
		duval:s => s >= 2 ? "Vingt ans qu'on travaille ensemble, et ça continue !" : "Bon… On fera mieux la prochaine fois.",
		martin:s => s >= 2 ? "Merci pour vos conseils. Nous sommes rassurés." : "Nous allons y réfléchir. Bonne soirée."
	};
	const EPI = {
		karim:s => { const e = [K.found.includes("seul") && "a embauché Lucas, son premier apprenti", K.found.includes("treso") && "a passé son premier été sans découvert", K.found.includes("boutique") && "visite un local à Wazemmes avec toi"].filter(Boolean);
			return `🥖 Le nouveau four tourne à plein régime.${e.length ? ` Et Karim <b>${andJoin(e)}</b>.` : " Mais Karim, toujours seul au fournil, songe à vendre…"}`; },
		lefevre:s => s >= 2 ? "👵 Mme Lefèvre a réglé la succession avec le notaire, ouvert une épargne pour les études de Théo, et elle passe dire bonjour à chaque fois qu'elle vient en ville." : "👵 Mme Lefèvre a reçu une relance pour une facture impayée. Elle a fini par confier ses comptes à son fils, dans une autre banque.",
		couple:s => s >= 2 ? "🔑 Inès et Tom ont signé, après leurs dix jours de réflexion. Ils t'ont envoyé une photo de leur crémaillère." : "🔑 Inès et Tom ont finalement emprunté dans une autre banque, où on les a mieux écoutés.",
		duval:s => s >= 2 ? "🏭 Duval Textiles emploie aujourd'hui 55 personnes. Clara a repris l'entreprise, et c'est toi qu'elle appelle en premier." : "🏭 Duval Textiles a traversé des années difficiles. Clara a repris l'entreprise… et cherche une nouvelle banque.",
		martin:s => s >= 2 ? "🌅 Jacques et Hélène ont pris leur retraite comme prévu. Léa a acheté son premier appartement grâce à la donation préparée avec le notaire." : "🌅 Les Martin ont confié leur patrimoine à un cabinet de gestion privée. Ils ne sont pas revenus."
	};

	/* ---------- 18 h : Sophie te confie l'agence, le défi de directeur d'agence ---------- */
	const MGMT = [
		{ who:"leo", t:"Léo, conseiller arrivé il y a six mois, n'a pas atteint ses objectifs. Il se décourage.", line:"Je crois que je ne suis pas fait pour ce métier…", a:[
			["good", "Le recevoir en tête-à-tête : l'écouter, reconnaître ses progrès, et fixer avec lui deux objectifs atteignables."],
			["ko", "Le recadrer en réunion d'équipe, pour que tout le monde comprenne."],
			["mid", "Ne rien dire : ça passera tout seul."]],
			res:{ good:"Léo se sent soutenu. Le mois suivant, il signe son premier gros dossier.", ko:"Humilié devant ses collègues, Léo pose sa démission.", mid:"Livré à lui-même, Léo continue de douter… et ses clients le sentent." } },
		{ who:"nadia", t:"Nadia et Samir veulent tous les deux leurs congés la première semaine d'août.", line:"J'ai posé ma demande en janvier ! Et Samir aussi veut cette semaine-là…", a:[
			["good", "Les réunir, comprendre les contraintes de chacun et trouver ensemble un compromis équitable, en alternant d'une année sur l'autre."],
			["mid", "Premier arrivé, premier servi : Nadia a demandé avant."],
			["ko", "Refuser les deux demandes, sans explication."]],
			res:{ good:"Samir part la première semaine cette année (ses enfants sont en vacances), Nadia la prochaine. L'équipe reste soudée.", mid:"C'est la règle, mais Samir se sent oublié : l'ambiance se tend.", ko:"Nadia et Samir sont furieux, et toute l'équipe se méfie de toi." } },
		{ who:"samir", t:"Le siège fixe un objectif : vendre 50 cartes Premium ce mois-ci.", line:"Alors on doit en proposer à tous nos clients ?", a:[
			["good", "Partager l'objectif, mais rappeler qu'on ne propose la carte qu'aux clients pour qui elle est utile : c'est le devoir de conseil."],
			["ko", "Pousser l'équipe à la proposer à chaque client, quoi qu'il arrive."],
			["mid", "Ignorer l'objectif du siège."]],
			res:{ good:"L'agence vend 38 cartes, toutes utiles à leurs clients. Aucune réclamation : le siège salue la qualité des ventes.", ko:"50 cartes vendues… et 12 clients mécontents qui demandent à être remboursés.", mid:"Le siège te rappelle à l'ordre : diriger, c'est aussi porter les objectifs, à sa façon." } }
	];
	const G = { i:0, good:0 };
	function manage(){
		gen++; S.cur = null; S.where = null; S.busy = false; chips(); Object.assign(G, { i:0, good:0, res:[] });
		stage("Directeur d'agence d'un jour"); clockTo(18, 0);
		W.resetPeople(); for(const id in { karim:1, lefevre:1, ines:1, tom:1, duval:1, martin:1 }) W.P[id].g.visible = false;
		[["leo", -3.4, -2.2], ["nadia", -1.6, -1.7], ["samir", .2, -2.2]].forEach(([id, x, z]) => { W.place(id, { x:0, z:0 }, x, 0, z, .1); W.P[id].setMood("neutre"); });
		W.walk("toi", [[3, -.6], [-1.6, .6]], () => W.P.toi.g.rotation.y = Math.PI, Math.PI);
		W.look(-1.6, 6.5, 5.6, -1.6, .8, -2.2, 2, 0, 3.6);
		later(500, () => say(null, "Belle journée ! Demain je suis en formation : c'est toi qui diriges l'agence. Trois situations t'attendent."));
		show(`<div class="ca-boss"><i>🏢</i><span><b>Directeur d'agence d'un jour</b><small>Un des débouchés du master : diriger une agence et son équipe.</small></span></div>
			<p class="ca-p">Sophie te confie l'agence et son équipe : <b>Léo, Nadia et Samir</b>. Un directeur d'agence ne gère pas seulement des clients : il fait grandir ses conseillers, arbitre, et porte les objectifs de la banque sans oublier le devoir de conseil.</p>
			<button class="ca-go" data-a="mgmtStep">Prendre les commandes</button>`);
	}
	function mgmtStep(){
		const Q = MGMT[G.i];
		show(`<div class="ca-boss"><i>🏢</i><span><b>Situation ${G.i + 1} sur ${MGMT.length}</b><small>Directeur d'agence d'un jour</small></span></div>
			<div class="ca-story">${Q.t}</div>
			<p class="ca-who">${SPK[Q.who].name} : <span>« ${Q.line} »</span></p>
			<div class="ca-qs">${shuffle(Q.a).map(([k, t]) => `<button class="ca-q" data-g="${k}">${t}</button>`).join("")}</div><div data-res></div>`);
		W.P[Q.who].setMood("inquiet"); W.react(Q.who, 1);
		later(300, () => say(Q.who, Q.line));
	}
	function decide(k){
		if(S.busy) return; S.busy = true;
		const Q = MGMT[G.i];
		card.querySelectorAll("[data-g]").forEach(b => { b.disabled = true; if(b.dataset.g === k) b.classList.add(k === "good" ? "ok" : "ko"); });
		if(k === "good"){ G.good++; W.P[Q.who].setMood("ravi"); W.hop(Q.who, 2); play("good"); }
		else { W.P[Q.who].setMood(k === "ko" ? "agace" : "inquiet"); W.react(Q.who, -1); play(k === "ko" ? "bad" : "chime"); if(k === "ko"){ S.errors++; onEvent && onEvent("err"); } }
		G.res[G.i] = k;
		// Léo humilié démissionne : il quitte l'agence sous nos yeux
		if(Q.who === "leo" && k === "ko") later(1200, () => W.walk("leo", [[-3.4, 1.5], [0, 4.5], [0, 7.5]], () => W.P.leo.g.visible = false));
		if(G.res.filter(r => r === "ko").length >= 2 || (G.i === MGMT.length - 1 && G.good <= 1)) W.tension(true);
		const last = G.i === MGMT.length - 1;
		card.querySelector("[data-res]").innerHTML = `<p class="ca-p" style="margin-top:12px"><span class="ca-tag ${k}">${k === "good" ? "✓ Un vrai manager" : k === "mid" ? "≈ Ça se discute" : "✗ L'équipe en pâtit"}</span><br>${Q.res[k]}</p>
			<button class="ca-go" data-a="${last ? "mgmtEnd" : "mgmtNext"}">${last ? "Voir le bilan de ma journée" : "Situation suivante →"}</button>`;
		scrollEnd(); S.busy = false;
	}
	const SPK = { leo:{ av:"🧑‍💼", name:"Léo", pawns:["leo"], u:["leo"] }, nadia:{ av:"👩‍💼", name:"Nadia", pawns:["nadia"], u:["nadia"] }, samir:{ av:"🧔", name:"Samir", pawns:["samir"], u:["samir"] } };

	/* ---------- la fin de la journée ---------- */
	function finale(){
		gen++; S.cur = null; chips();
		stage("Fin de journée"); clockTo(18, 30); W.view("agence", 2);
		const tot = THEMES.reduce((a, [k]) => a + (S.score[k] || 0), 0);
		const [rank, mention] = tot >= 13 ? ["Chargé d'affaires confirmé", "Très bien"] : tot >= 9 ? ["Chargé d'affaires", "Bien"] : ["Chargé d'affaires junior", "Assez bien"];
		// tous les clients reviennent saluer, avec l'équipe de l'agence
		W.resetPeople();
		ORDER.forEach((id, i) => CLIENTS[id].pawns.forEach((p, j) => { W.place(p, { x:0, z:0 }, -4 + i*2.2 + j*.7, 0, 3.4); W.P[p].setMood("ravi"); }));
		// l'équipe porte les traces de tes décisions : Léo absent s'il a démissionné, une ambiance tendue si le management a raté
		const R = S.mgmtRes || [], quit = R[0] === "ko", tense = S.mgmt != null && S.mgmt <= 1;
		const team = [["leo", -3.4, -2.2], ["nadia", -1.6, -1.7], ["samir", .2, -2.2]].filter(([id]) => !(id === "leo" && quit));
		team.forEach(([id, x, z]) => { W.place(id, { x:0, z:0 }, x, 0, z, .1); W.P[id].setMood(tense || R[{ leo:0, nadia:1, samir:2 }[id]] === "ko" ? "agace" : S.mgmt >= 2 ? "ravi" : "neutre"); });
		W.tension(tense);
		later(600, () => { ORDER.forEach((id, i) => CLIENTS[id].pawns.forEach(p => setTimeout(() => W.hop(p, 2), i*150))); W.hop("sophie", 2); if(S.mgmt >= 2 && !tense) team.forEach(([p], i) => setTimeout(() => W.hop(p, 2), 300 + i*120)); });
		later(800, () => say(null, tot >= 13 ? "Quelle journée ! Un jour, c'est toi qui dirigeras cette agence." : tot >= 9 ? "Belle journée ! Tes clients repartent contents." : "Une journée formatrice. Demain, tu les écouteras encore mieux !"));
		onEvent && onEvent("win", mention); play("win");
		const best = THEMES.slice().sort((a, b) => (S.score[b[0]] || 0) - (S.score[a[0]] || 0))[0];
		show(`<div class="ca-k">${formation.name} · bilan</div><h2 class="ca-h">Fin de journée !</h2>
			<p class="ca-p" style="text-align:center;font-size:16px">Tu es <b>${rank}</b><br><span style="font-size:22px;color:#e0a33a">${tot} / 15 ★</span></p>
			${radar()}
			${S.mgmt != null ? `<div class="ca-boss"><i>🏢</i><span><b>Directeur d'agence d'un jour : ${S.mgmt} / 3</b><small>${S.mgmt >= 3 ? "Ton équipe te suivrait n'importe où." : S.mgmt >= 2 ? "Un bon début de manager." : "Manager, ça s'apprend : le master a un cours de management d'équipe."}</small></span></div>
				${quit || tense ? `<p class="ca-p" style="color:#b3261e;font-weight:700">${[quit && "🚪 Léo a démissionné : il manque à l'équipe ce soir.", tense && "⚡ L'ambiance est tendue dans l'agence : Nadia et Samir t'en veulent."].filter(Boolean).join("<br>")}</p>` : ""}` : ""}
			<p class="ca-p">Ton point fort : <b>${best[2]} ${best[1]}</b>. Écouter, percevoir, rassurer, accompagner, conseiller : c'est le métier de chargé d'affaires, que le master prépare en alternance sur 2 ans, avec des débouchés comme conseiller patrimonial ou directeur d'agence.</p>
			${openLead ? `<button class="ca-go" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="ca-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master MBIF ↗</a>
			<button class="ca-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="ca-alt" data-a="replay">Rejouer une nouvelle journée</button>`);
	}

	/* ---------- mise en place de chaque univers ---------- */
	const RESET = { karim:() => W.resetIce(), lefevre:() => W.resetClues(), couple:() => { W.resetBridge(); planks = 0; }, duval:() => W.resetFactory(), martin:() => W.resetTower() };
	const PLAY = { karim:karimPlay, lefevre:lefevrePlay, couple:couplePlay, duval:duvalPlay, martin:martinPlay };

	/* ---------- actions ---------- */
	const STEPS = { agenda, enter, bye, nextEvent:() => { D.i++; eventStep(); }, duvalEnd, martinEnd, karimEnd, talk:talkStep, sigOk, sigNext:eventStep, products,
		mgmtStep, mgmtNext:() => { G.i++; mgmtStep(); }, mgmtEnd:() => { S.mgmt = G.good; S.mgmtRes = G.res.slice(); finale(); }, lefevreFinish };
	root.addEventListener("click", e => {
		const t = e.target;
		const kk = t.closest("[data-k]"); if(kk) return loan(kk.dataset.k);
		const tt = t.closest("[data-t]"); if(tt) return calc(tt.dataset.t);
		const s = t.closest("[data-s]"); if(s) return toggleSignal(s.dataset.s);
		const m = t.closest(".ca-card [data-m]"); if(m) return profileAsk(m.dataset.m);
		const pf = t.closest("[data-pf]"); if(pf) return profile(pf.dataset.pf);
		const g = t.closest("[data-g]"); if(g) return decide(g.dataset.g);
		const v = t.closest("[data-v]"); if(v) return transfer(v.dataset.v);
		const c = t.closest("[data-c]"); if(c) return receive(c.dataset.c);
		const q = t.closest("[data-q]"); if(q) return ask(q.dataset.q);
		const r = t.closest("[data-r]"); if(r) return reformulate(r.dataset.r);
		const o = t.closest("[data-o]"); if(o) return loupe(o.dataset.o);
		const l = t.closest("[data-l]"); if(l) return lefevreEnd(l.dataset.l);
		const b = t.closest("[data-b]"); if(b) return answer(b.dataset.b);
		const x = t.closest("[data-x]"); if(x) return mobilize(x.dataset.x);
		const p = t.closest("[data-p]"); if(p) return stackProduct(p.dataset.p);
		const a = t.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ S.score = {}; S.mgmt = null; S.mgmtRes = null; S.errors = 0; W.resetPeople(); return agenda(); }
	});
	function close(){ if(closed) return; closed = true; removeEventListener("resize", layout); document.removeEventListener("keydown", onKey); W.dispose(); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".ca-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	const jump = id => () => { receive(id); later(300, enter); };
	onEvent && onEvent("missions", [["Mon agenda", agenda], ["9 h · Karim (écoute)", jump("karim")], ["10 h 30 · Mme Lefèvre (sensibilité)", jump("lefevre")], ["14 h · Inès et Tom (bienveillance)", jump("couple")], ["15 h 30 · Duval Textiles (accompagnement)", jump("duval")], ["17 h · Famille Martin (expertise)", jump("martin")], ["18 h · Directeur d'agence d'un jour", () => { ORDER.forEach(id => S.score[CLIENTS[id].theme] ??= 2); manage(); }], ["Fin de journée", () => { ORDER.forEach(id => S.score[CLIENTS[id].theme] ??= 2); S.mgmt ??= 2; finale(); }]]);
	if(window.campus) window.campus.game = { S, card, W, receive, enter, agenda, finale, manage, ...STEPS };
}
