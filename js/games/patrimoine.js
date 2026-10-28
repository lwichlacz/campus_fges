/* « Le Dossier Deslaurier » — mini-jeu du Master Droit & Gestion du Patrimoine (ISEA).
   D'après le cas pratique de Jean-Daniel Wecxsteen (initiation à la gestion de patrimoine, L3) :
   la vie d'une famille lilloise de 1959 à aujourd'hui, et à chaque étape la question posée au conseiller.
   Une maquette 3D (pions de la famille, cabinet, maison, immeuble, ferme, zones « propre » et « commun »)
   suit le dossier : les biens se rangent dans leur zone, la communauté se partage au décès, l'héritage se place…
   On raisonne avec le droit d'aujourd'hui. Famille fictive. Contenu à relire par l'équipe du master. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COURSES = {
	famille: ["Droit de la famille", "Régimes matrimoniaux, PACS, concubinage : qui possède quoi dans un couple, et que changer quand la vie change."],
	liquid:  ["Liquidation et partage", "Avant toute succession, on liquide le régime matrimonial : chacun reprend ses biens propres et sa part des biens communs."],
	succ:    ["Successions et libéralités", "Héritiers, réserve héréditaire, donation entre époux, testament : le cœur du métier de conseiller."],
	place:   ["Ingénierie financière", "Profil de l'épargnant, horizon, risque : construire une allocation entre épargne disponible, assurance-vie, actions et immobilier."],
	fisca:   ["Fiscalité patrimoniale", "Droits de succession et de donation, abattements, assurance-vie : transmettre mieux, dans le respect de la loi."]
};
const MOBILE = 760;
// frise : libellé, libellé court (téléphone), étapes du jeu
const TIMELINE = [["1959", "1959", ["intro"]], ["1967", "1967", ["mariage"]], ["1972", "1972", ["maison"]], ["1985", "1985", ["immeuble"]], ["1991", "1991", ["deces", "placer"]], ["1997", "1997", ["contrats"]], ["Remariage", "Remar.", ["remariage"]], ["Aujourd'hui", "Auj.", ["concubin", "transmettre", "end"]]];

const CSS = `
.gp{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#24302a;background:#1d3a2f;animation:gpIn .35s ease both;overflow:hidden}
@keyframes gpIn{from{opacity:0}to{opacity:1}}
.gp canvas{position:absolute;left:0;top:0;display:block;touch-action:none}
.gp-top{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;pointer-events:none}
.gp-top>*{pointer-events:auto}
.gp-chip{background:rgba(255,251,240,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(5,15,10,.3)}
.gp-stage{background:#b08a3e;color:#fff}
.gp-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,251,240,.95);font-size:22px;cursor:pointer}
.gp-tl{position:absolute;z-index:2;left:12px;bottom:12px;background:rgba(20,16,12,.72);border-radius:14px;padding:8px 12px 6px;pointer-events:none;box-sizing:border-box;backdrop-filter:blur(4px)}
.gp-tl-bar{position:relative;height:4px;border-radius:2px;background:rgba(243,227,184,.18);margin:5px 6px 0}
.gp-tl-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:#d9b25a;transition:width .9s cubic-bezier(.4,0,.2,1)}
.gp-tl ol{list-style:none;margin:-9px 0 0;padding:0;display:flex;justify-content:space-between}
.gp-tl li{flex:1;text-align:center;font-size:11.5px;font-weight:800;color:rgba(243,227,184,.45);transition:color .4s}
.gp-tl li:first-child{text-align:left}.gp-tl li:last-child{text-align:right}
.gp-tl li:before{content:"";display:block;width:10px;height:10px;border-radius:50%;background:#4a3f33;border:2px solid rgba(243,227,184,.35);margin:0 auto 4px;transition:all .4s}
.gp-tl li:first-child:before{margin-left:0}.gp-tl li:last-child:before{margin-right:0}
.gp-tl li.past{color:rgba(243,227,184,.8)}.gp-tl li.past:before{background:#d9b25a;border-color:#d9b25a}
.gp-tl li.now{color:#ffd77a}.gp-tl li.now:before{background:#ffd77a;border-color:#fff;box-shadow:0 0 0 4px rgba(255,215,122,.3);transform:scale(1.25)}
.gp-tl .s{display:none}
@media (max-width:520px){ .gp-tl .l{display:none} .gp-tl .s{display:inline} .gp-tl li{font-size:10.5px} .gp-tl{padding:7px 9px 5px} }
.gp-hint{position:absolute;z-index:2;left:12px;bottom:70px;background:rgba(15,30,24,.7);color:#f3e3b8;font-size:12px;font-weight:700;border-radius:999px;padding:5px 10px;pointer-events:none}
.gp-wrap{position:absolute;z-index:2;top:62px;right:12px;bottom:12px;width:420px;overflow:auto;border-radius:8px;scrollbar-width:thin}
.gp-card{background:#fffcf3;border-radius:8px;box-shadow:0 18px 40px rgba(5,15,10,.45);padding:18px 18px 16px;position:relative;animation:gpUp .35s cubic-bezier(.2,.8,.2,1) both;border-top:5px solid #b08a3e;min-height:calc(100% - 21px)}
@keyframes gpUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (max-width:${MOBILE - 1}px){
	.gp-wrap{left:0;right:0;bottom:0;width:auto;border-radius:16px 16px 0 0;box-shadow:0 -10px 30px rgba(5,15,10,.35)}
	.gp-card{border-radius:16px 16px 0 0;padding:14px 14px 22px}
	.gp-hint,.gp-tl{bottom:auto}
}
.gp-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24}
.gp-h{font:700 22px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px;color:#1f3d31}
.gp-p{margin:0 0 10px;color:#4a5450;font-size:14.5px}
.gp-year{display:inline-block;font:700 13px Fraunces,Georgia,serif;background:#1f3d31;color:#f3e3b8;border-radius:6px;padding:3px 9px;margin-bottom:6px}
.gp-story{background:#f6efdc;border-left:4px solid #b08a3e;border-radius:4px;padding:10px 12px;margin:8px 0 12px;font-size:14px;color:#3d3528}
.gp-ask{display:block;margin-top:8px;color:#b3261e;font-weight:800;font-size:13.5px}
.gp-ask:before{content:"⚖ Gestion de patrimoine · "}
.gp-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:#1f3d31;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:12px;text-align:center;text-decoration:none}
.gp-alt{display:block;width:100%;border:2px solid #d9cfb4;border-radius:12px;padding:12px;background:#fff;color:#1f3d31;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.gp-msg{min-height:20px;font-size:13.5px;font-weight:700;color:#4a5450;margin:6px 0}
.gp-msg.ko{color:#b3261e}.gp-msg.ok{color:#2c6a46}
.gp-opts{display:grid;gap:7px}
.gp-opt{text-align:left;border:2px solid #d9cfb4;background:#fff;border-radius:10px;padding:10px 12px;font:800 14px Nunito,sans-serif;cursor:pointer;color:#24302a}
.gp-opt:hover{border-color:#1f3d31}
.gp-opt.ok{border-color:#3d7a55;background:#eef8f0}.gp-opt.ko{border-color:#c4532f;background:#fdeceb}
.gp-opt[aria-pressed=true]{border-color:#1f3d31;box-shadow:0 0 0 3px rgba(31,61,49,.18)}
.gp-n{font-size:12px;font-weight:800;color:#8a6a24;margin-bottom:4px}
.gp-item{background:#fff;border:2px solid #b08a3e;border-radius:10px;padding:10px 12px;margin:6px 0;font-size:14px}
.gp-item b{display:block;font:700 16px Fraunces,Georgia,serif;color:#1f3d31}
.gp-item small{color:#6f6a5c}
.gp-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.gp-acts button{border:2px solid #d9cfb4;background:#fff;border-radius:10px;padding:8px 10px;font:800 13px Nunito,sans-serif;cursor:pointer;color:#24302a;display:flex;align-items:center;gap:6px}
.gp-acts button i{width:12px;height:12px;border-radius:50%;display:inline-block}
.gp-acts button:hover{border-color:#1f3d31}
.gp-acts button.ko{border-color:#c4532f;background:#fdeceb}
.gp-why{display:block;margin-top:6px;color:#2c6a46;font-weight:700;font-size:13px}
.gp-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gp-cols h4{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6f6a5c}
.gp-pick{display:block;width:100%;text-align:left;border:2px solid #e2d8bf;background:#fff;border-radius:8px;padding:8px;margin-bottom:6px;font:700 12.5px/1.3 Nunito,sans-serif;cursor:pointer;color:#24302a}
.gp-pick b{display:block;font-size:14px}
.gp-pick[aria-pressed=true]{border-color:#1f3d31;box-shadow:0 0 0 3px rgba(31,61,49,.18)}
.gp-pick.done{border-color:#3d7a55;background:#eef8f0;cursor:default}
.gp-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.gp-tbl th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6f6a5c;text-align:left;padding:4px}
.gp-tbl td{padding:7px 4px;border-top:1px solid #e2d8bf;vertical-align:middle}
.gp-tbl td button{border:2px solid #d9cfb4;background:#fff;border-radius:8px;padding:5px 8px;font:800 12.5px Nunito,sans-serif;cursor:pointer;margin:2px 2px 2px 0}
.gp-tbl td button.on{border-color:#1f3d31;background:#1f3d31;color:#fff}
.gp-tbl td button.ok{border-color:#3d7a55;background:#3d7a55;color:#fff}
.gp-tbl td button.ko{border-color:#c4532f;background:#fdeceb}
.gp-course{background:#fff;border:2px solid #b08a3e;border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.gp-course .tag{display:inline-block;background:#f6ecd2;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.gp-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.gp-course span{font-size:14px;color:#4a5450}
.gp-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.gp-list li{background:#fff;border:1px solid #e2d8bf;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.gp-list li span{color:#8a6a24;font-weight:800;margin-right:6px}
@media (max-width:440px){ .gp-h{font-size:19px} .gp-pick{font-size:11.5px;padding:6px} .gp-pick b{font-size:12.5px} .gp-tbl{font-size:12.5px} .gp-story{font-size:13.5px} }
.gp-meters{position:absolute;z-index:2;left:12px;top:60px;max-width:calc(100% - 24px);display:flex;flex-wrap:wrap;gap:6px;pointer-events:none}
.gp-m{background:rgba(255,251,240,.94);border-radius:10px;padding:5px 10px;font-size:12.5px;font-weight:800;box-shadow:0 4px 12px rgba(5,15,10,.25);display:flex;flex-direction:column;line-height:1.15;min-width:64px}
.gp-m small{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6f6a5c}
.gp-m.fam b{color:#2c6a46}.gp-m.fisc b{color:#7a5a1a}.gp-m.conf b{color:#b3261e}.gp-m.st b{color:#b08a3e}
.gp-m.pop{animation:gpPop .5s ease}
@keyframes gpPop{40%{transform:scale(1.15)}}
.gp-goal{background:#eef5f0;border-radius:8px;padding:8px 10px;font-weight:800;font-size:13.5px;color:#1f3d31;margin:0 0 6px}
.gp-pre{background:#fff;border:1px dashed #b08a3e;border-radius:8px;padding:8px 10px;font-size:13.5px;color:#3d3528;margin:0 0 8px}
.gp-hand{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:12px 0 4px;perspective:900px}
.gp-c{position:relative;width:calc((100% - 16px)/3);max-width:124px;min-height:168px;border:0;border-radius:12px;padding:10px 7px 8px;cursor:pointer;text-align:center;color:#24302a;font-family:Nunito,sans-serif;
	background:linear-gradient(160deg,#fffdf6,#f1e5c6);box-shadow:0 0 0 2px #b08a3e inset,0 0 0 5px #fffdf6 inset,0 0 0 6px #d9c79a inset,0 8px 16px rgba(40,25,10,.25);
	transform:rotate(var(--r));animation:gpDeal .5s cubic-bezier(.2,.9,.3,1.2) both;animation-delay:var(--d);transition:transform .2s,box-shadow .2s,opacity .3s,filter .3s}
@keyframes gpDeal{from{opacity:0;transform:translateY(60px) rotate(18deg) scale(.7)}}
.gp-c .ic{display:block;font-size:34px;line-height:1.1;margin:4px 0 6px}
.gp-c b{display:block;font:700 14px/1.15 Fraunces,Georgia,serif;color:#1f3d31;margin-bottom:5px}
.gp-c small{display:block;font-size:11.5px;line-height:1.25;color:#5d584b}
.gp-c:hover{transform:translateY(-6px) rotate(0)}
.gp-c.sel{transform:translateY(-12px) rotate(0) scale(1.04);box-shadow:0 0 0 3px #1f3d31 inset,0 0 0 6px #fffdf6 inset,0 0 0 7px #d9c79a inset,0 14px 24px rgba(31,61,49,.35)}
.gp-c.out{opacity:.3;filter:grayscale(1);transform:scale(.92);pointer-events:none}
.gp-c.played{pointer-events:none;animation:gpPlay .7s ease both}
@keyframes gpPlay{0%{transform:translateY(-12px)}45%{transform:translateY(-30px) rotateY(90deg) scale(1.1)}100%{transform:translateY(-8px) rotateY(0) scale(1.06)}}
.gp-c .stamp{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-12deg);font:800 18px Nunito,sans-serif;letter-spacing:1px;padding:3px 8px;border:3px solid;border-radius:8px;background:rgba(255,255,255,.85);animation:gpStamp .3s cubic-bezier(.2,1.6,.4,1) both;white-space:nowrap}
.gp-c .stamp.s3{color:#2c6a46}.gp-c .stamp.s2{color:#a07a1f}.gp-c .stamp.s1{color:#b3261e}
@keyframes gpStamp{from{transform:translate(-50%,-50%) rotate(-12deg) scale(2.4);opacity:0}}
.gp-playbtn{display:block;width:100%;border:0;border-radius:12px;padding:13px;background:#b08a3e;color:#fff;font:800 15px Nunito,sans-serif;cursor:pointer;margin-top:10px;animation:gpUp .3s both}
.gp-pickhint{text-align:center;font-size:12.5px;font-weight:700;color:#6f6a5c;margin-top:6px}
.gp-verdict{border-radius:10px;padding:10px 12px;margin:12px 0 8px;font-weight:800;font-size:15px;display:flex;align-items:center;gap:10px;animation:gpUp .35s both}
.gp-verdict .st{font-size:20px;letter-spacing:2px}
.gp-verdict.s3{background:#eaf6ee;color:#2c6a46}.gp-verdict.s2{background:#fbf3df;color:#8a6a24}.gp-verdict.s1{background:#fdeceb;color:#b3261e}
.gp-delta{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.gp-delta span{font-size:12.5px;font-weight:800;border-radius:999px;padding:3px 9px;background:#f3eee0}
.gp-tip{background:#fff8e6;border-left:4px solid #b08a3e;border-radius:4px;padding:8px 10px;font-size:13.5px;margin:8px 0}
.gp-real{font-style:italic;color:#6f6a5c;font-size:13.5px;margin:6px 0}
.gp-sim{font-variant-numeric:tabular-nums;font-size:13.5px;margin:6px 0;padding:0;list-style:none}
.gp-sim li{display:flex;justify-content:space-between;gap:8px;border-top:1px dashed #e2d8bf;padding:4px 0}
.gp-bubble{position:absolute;z-index:3;display:flex;align-items:flex-end;gap:8px;max-width:440px;pointer-events:auto;cursor:pointer;transition:opacity .3s,transform .3s}
.gp-bubble.follow svg{display:none}
.gp-bubble.follow p{margin:0;border-radius:14px 14px 14px 2px}
.gp-bubble.off{opacity:0;transform:translateY(8px);pointer-events:none}
.gp-bubble svg{flex:none;width:74px;height:74px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.gp-bubble p{position:relative;margin:0 0 14px;background:#fffcf3;border:2px solid #1f3d31;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:15px;font-weight:700;line-height:1.4;color:#1f3d31;box-shadow:0 8px 20px rgba(0,0,0,.3);min-height:20px}
.gp-bubble p b{display:block;font:800 10.5px Nunito,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8a6a24;margin-bottom:2px}
.gp-cs{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#3b2a5a,#7a3e8f);color:#fff;border-radius:12px;padding:10px 12px;margin-bottom:10px;animation:gpCs .7s cubic-bezier(.2,1.4,.4,1) both}
.gp-cs i{font-style:normal;font-size:30px;animation:gpDie 1s ease both}
.gp-cs b{font:700 18px Fraunces,Georgia,serif;display:block}
.gp-cs small{opacity:.85;font-weight:700}
@keyframes gpCs{from{opacity:0;transform:rotateX(90deg)}}
@keyframes gpDie{0%{transform:rotate(0)}70%{transform:rotate(720deg) scale(1.3)}100%{transform:rotate(720deg)}}
.gp-clock{font:700 26px Fraunces,Georgia,serif;text-align:center;color:#1f3d31;margin:8px 0}
@media (max-width:520px){ .gp-bubble svg{width:52px;height:52px} .gp-bubble p{font-size:13px;padding:7px 10px;margin-bottom:8px} .gp-meters{gap:4px;left:8px;right:60px} .gp-m{min-width:0;padding:4px 7px;font-size:12px} .gp-m small{display:none}
	.gp-m.fam b:before{content:"💰 "}.gp-m.fisc b:before{content:"🏛 "}.gp-m.conf b:before{content:"⚡ "} }
@media (max-width:440px){ .gp-c{min-height:150px;padding:8px 5px} .gp-c .ic{font-size:28px} .gp-c b{font-size:12.5px} .gp-c small{font-size:10.5px} .gp-m{min-width:56px;font-size:11.5px;padding:4px 8px} }
`;

/* ================= la maquette 3D ================= */
const COL = { lea:"#e58fb0", paul:"#2f5d9e", jeannette:"#c2547a", jb:"#3c8d6e", elise:"#d07a3a", louise:"#c9a227", florent:"#4a7f9e", paulette:"#7a3e8f", pk:"#a77cc4", sarah:"#b8476b",
	zP:"#8fb3e0", zC:"#e8c766", zJ:"#eaa6bd" };
function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#241c15"); scene.fog = new THREE.Fog("#241c15", 70, 140);
	const camera = new THREE.PerspectiveCamera(36, 1, .1, 200);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 7; controls.maxDistance = 42; controls.maxPolarAngle = 1.3;
	scene.add(new THREE.HemisphereLight("#fff6e0", "#2a4a3c", 1.1));
	const sun = new THREE.DirectionalLight("#fff1d6", 2.2); sun.position.set(-8, 16, 10); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-16, right:16, top:16, bottom:-16, near:1, far:50 }); sun.shadow.bias = -.0005;
	scene.add(sun);

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.75, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);

	// le plateau : un grand guéridon en bois recouvert de papier
	const board = new THREE.Group(); scene.add(board);
	board.add(mesh(new THREE.CylinderGeometry(14.2, 14.6, .8, 64), M("#6e4a32"), 0, -.4, 0));
	board.add(mesh(new THREE.CylinderGeometry(13.6, 13.6, .06, 64), M("#efe6cf"), 0, .03, 0));
	const rim = mesh(new THREE.TorusGeometry(13.62, .07, 8, 96), M("#b08a3e", { metalness:.6, roughness:.35 }), 0, .06, 0); rim.rotation.x = Math.PI/2; board.add(rim);

	/* --- le décor : l'étude de Maître Bonchamp, notaire de la famille (fictif) --- */
	{
		const FY = -7, deco = new THREE.Group(); scene.add(deco);
		const still = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; deco.add(m); return m; };
		const sbox = (w, h, d, c, x, y, z) => still(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
		const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
		// parquet en points de Hongrie simplifié, tapis, pied du guéridon
		const parquet = tex(256, 256, (x, w, h) => { for(let i = 0; i < 8; i++){ x.fillStyle = ["#7a5234", "#835a3a", "#6f4a2e", "#8a6040"][(i*3) % 4]; x.fillRect(0, i*32, w, 32); x.fillStyle = "rgba(0,0,0,.28)"; x.fillRect(0, i*32, w, 2); x.fillRect((i*97) % w, i*32, 2, 32); x.fillRect((i*97 + 128) % w, i*32, 2, 32); } });
		parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(9, 9);
		still(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ map:parquet, roughness:.7 }), 0, FY, 0).rotation.x = -Math.PI/2;
		still(new THREE.CylinderGeometry(21, 21, .05, 64), M("#6b2328"), 0, FY + .03, 0);
		still(new THREE.TorusGeometry(19.6, .25, 6, 96), M("#b08a3e"), 0, FY + .06, 0).rotation.x = Math.PI/2;
		still(new THREE.CylinderGeometry(1.4, 2.1, 6.4, 32), M("#5e3e29"), 0, FY + 3.2, 0);
		still(new THREE.CylinderGeometry(4.2, 4.8, .5, 32), M("#5e3e29"), 0, FY + .25, 0);
		// murs lambrissés
		sbox(80, 36, 1, "#2f4a3e", 0, FY, -32); sbox(80, 7, 1.4, "#5e3e29", 0, FY, -31.6);
		for(const sx of [-1, 1]){ sbox(1, 36, 80, "#2f4a3e", sx*38, FY, 0); sbox(1.4, 7, 80, "#5e3e29", sx*37.6, FY, 0); }
		// grande fenêtre au fond, lumière du jour sur Lille
		sbox(11, 19, .6, "#e9dcc0", 0, FY + 8, -31.3);
		const glass = still(new THREE.PlaneGeometry(9.6, 17.6), new THREE.MeshBasicMaterial({ map:tex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#cfe3f2"); g.addColorStop(1, "#f4ead2"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(90,110,120,.35)"; for(let i = 0; i < 9; i++) x.fillRect(i*15, h*.72 - (i % 3)*14, 13, h); }) }), 0, FY + 16.8, -30.9);
		glass.receiveShadow = false;
		sbox(.3, 17.6, .3, "#e9dcc0", 0, FY + 8, -30.8); sbox(9.6, .3, .3, "#e9dcc0", 0, FY + 16.8, -30.8);
		// bibliothèques de part et d'autre, remplies de codes et de répertoires
		const books = [];
		for(const bx of [-19, 19]){
			sbox(14, 23, 2.6, "#4a3020", bx, FY, -30.2);
			for(let k = 0; k < 6; k++){
				const y = FY + .6 + k*3.7; sbox(13.2, .25, 2.4, "#3a2416", bx, y, -29.9);
				let x = bx - 6.4;
				while(x < bx + 6.2){ const w = .35 + Math.random()*.35, h = 2.2 + Math.random()*1.1; if(Math.random() < .08){ x += .6; continue; } books.push([x + w/2, y + .25 + h/2, -29.6, w, h]); x += w + .03; }
			}
		}
		const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness:.7 }), books.length);
		const PAL = ["#8f1d21", "#8f1d21", "#1f4d3a", "#6b3a1f", "#23395b", "#b08a3e", "#5a1a2a"], mtx = new THREE.Matrix4(), col = new THREE.Color();
		books.forEach(([x, y, z, w, h], i) => { mtx.makeScale(w, h, 1.9); mtx.setPosition(x, y, z); bm.setMatrixAt(i, mtx); bm.setColorAt(i, col.set(PAL[(i*7 + (i >> 3)) % PAL.length])); });
		deco.add(bm);
		// plaque de l'étude, entre la bibliothèque et la fenêtre
		const plaque = tex(512, 128, (x, w, h) => { x.fillStyle = "#c9a548"; x.fillRect(0, 0, w, h); x.strokeStyle = "#7a5a1a"; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = "#3b2a10"; x.textAlign = "center"; x.font = "700 44px Fraunces, Georgia, serif"; x.fillText("Maître Bonchamp", w/2, 62); x.font = "800 26px Nunito, sans-serif"; x.fillText("NOTAIRE", w/2, 100); });
		still(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshStandardMaterial({ map:plaque, metalness:.4, roughness:.4 }), -8.75, FY + 13, -31.4);
		// deux plantes dans les angles
		for(const sx of [-1, 1]){
			still(new THREE.CylinderGeometry(1.4, 1.1, 2.6, 20), M("#8a4b2c"), sx*31, FY + 1.3, -26);
			for(let i = 0; i < 6; i++) still(new THREE.SphereGeometry(1.5 + (i % 2)*.4, 12, 10), M(i % 2 ? "#3f6b3a" : "#4f7d45"), sx*31 + Math.cos(i)*1.1, FY + 3.6 + i*.7, -26 + Math.sin(i*2)*1.1);
		}
		// sur le bureau, en bordure du plateau : lampe de banquier, dossiers, tampon, stylo
		const lamp = new THREE.Group(); lamp.position.set(9, 0, -9.4); lamp.rotation.y = -.6; scene.add(lamp);
		const brass = M("#c9a548", { metalness:.8, roughness:.3 });
		lamp.add(mesh(new THREE.CylinderGeometry(.7, .8, .18, 24), brass, 0, .09, 0), mesh(new THREE.CylinderGeometry(.08, .08, 1.9, 10), brass, 0, 1, 0));
		const shade = mesh(new THREE.CylinderGeometry(.5, .9, .7, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color:"#1f6b45", roughness:.3, side:THREE.DoubleSide }), 0, 2, .2); shade.rotation.set(Math.PI/2.3, Math.PI/2, 0); lamp.add(shade);
		const bulb = new THREE.PointLight("#ffd9a0", 6, 9, 1.6); bulb.position.set(0, 1.7, .6); lamp.add(bulb);
		const dossiers = new THREE.Group(); dossiers.position.set(-9.2, 0, -9); dossiers.rotation.y = .5; scene.add(dossiers);
		["#d8c08a", "#c9b07a", "#e2cc98", "#bfa36b"].forEach((c, i) => { const d = mesh(new THREE.BoxGeometry(2.2, .16, 2.9), M(c), (i % 2)*.12, .08 + i*.17, -(i % 2)*.1); d.rotation.y = (i - 1.5)*.05; dossiers.add(d); });
		const cover = mesh(new THREE.PlaneGeometry(1.9, 1.1), new THREE.MeshStandardMaterial({ map:tex(256, 148, (x, w, h) => { x.fillStyle = "#fff8e8"; x.fillRect(0, 0, w, h); x.fillStyle = "#3b2a10"; x.textAlign = "center"; x.font = "700 30px Fraunces, Georgia, serif"; x.fillText("Dossier", w/2, 62); x.fillText("Deslaurier", w/2, 104); }) }), .12, .78, -.3); cover.rotation.x = -Math.PI/2; dossiers.add(cover);
		const tampon = new THREE.Group(); tampon.position.set(-4.4, 0, -12.2); scene.add(tampon);
		tampon.add(mesh(new THREE.BoxGeometry(1.4, .14, 1), M("#2a2a2a"), 1.1, .07, 0), mesh(new THREE.CylinderGeometry(.35, .35, .18, 20), M("#8f1d21"), 0, .09, 0), mesh(new THREE.CylinderGeometry(.12, .16, .7, 12), M("#6b3a1f"), 0, .53, 0), mesh(new THREE.SphereGeometry(.24, 14, 10), M("#6b3a1f"), 0, .95, 0));
		const stylo = mesh(new THREE.CylinderGeometry(.07, .07, 2, 10), M("#111", { metalness:.5, roughness:.3 }), 4, .1, -12.2); stylo.rotation.set(0, 0, Math.PI/2); stylo.rotation.y = .4; scene.add(stylo);
	}

	/* --- étiquettes (sprites dessinés au canvas), plus grandes sur téléphone --- */
	let LS = 1;
	function drawLabel(sp, text, o){
		const c = sp.userData.c || (sp.userData.c = document.createElement("canvas")), x = c.getContext("2d");
		const f = `800 ${o.big ? 60 : 44}px Nunito, system-ui, sans-serif`; x.font = f;
		const w = Math.ceil(x.measureText(text).width) + (o.bg ? 44 : 12), h = o.big ? 88 : 68;
		c.width = w; c.height = h; x.font = f;
		if(o.bg){ x.fillStyle = o.bg; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, h/2 - 2); x.fill(); if(o.line){ x.strokeStyle = o.line; x.lineWidth = 4; x.stroke(); } }
		x.fillStyle = o.fg || "#1f3d31"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 3);
		if(sp.material.map) sp.material.map.dispose();
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sp.material.map = t; sp.material.needsUpdate = true;
		const s = (o.size || .55)*LS; sp.scale.set(s*w/h, s, 1);
	}
	function label(text, o = {}){
		o = { bg:"#fffcf3", ...o };
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false, transparent:true }));
		sp.renderOrder = 10; sp.userData.o = o; sp.userData.cur = text; drawLabel(sp, text, o); return sp;
	}
	const relabel = (sp, text, o) => { sp.userData.cur = text; drawLabel(sp, text, { ...sp.userData.o, ...(o || {}) }); };

	/* --- les objets du dossier --- */
	const O = {};                 // id → { g (position), inner (rebond, secousse), s (échelle), label }
	function add(id, inner, text, o = {}){
		const g = new THREE.Group(), wrap = new THREE.Group(); wrap.add(inner); g.add(wrap);
		g.visible = false; g.scale.setScalar(.001); scene.add(g);
		const top = new THREE.Box3().setFromObject(inner).max.y;
		const rec = O[id] = { id, g, inner:wrap, s:o.s || 1, top };
		if(text){ rec.text0 = text; rec.label = label(text, o.lab); rec.label.position.y = top + (o.dy ?? .45); g.add(rec.label); }
		return rec;
	}
	function pawn(c, small){
		const p = new THREE.Group(), m = M(c, { roughness:.45 });
		p.add(mesh(new THREE.CylinderGeometry(.42, .46, .16, 28), m, 0, .08, 0));
		p.add(mesh(new THREE.CylinderGeometry(.14, .32, .82, 24), m, 0, .55, 0));
		p.add(mesh(new THREE.CylinderGeometry(.24, .2, .1, 24), m, 0, .98, 0));
		p.add(mesh(new THREE.SphereGeometry(.24, 24, 16), m, 0, 1.24, 0));
		if(small) p.scale.setScalar(.74);
		return p;
	}
	const PEOPLE = [["paul", "Paul"], ["jeannette", "Jeannette"], ["jb", "Jean-Baptiste", 1], ["elise", "Élise", 1], ["louise", "Louise", 1], ["florent", "Florent"], ["paulette", "Paulette"], ["sarah", "Sarah"], ["pk1", "Enfants de Paulette", 1], ["pk2", "", 1], ["lea", "Léa", 1]];
	for(const [id, n, small] of PEOPLE) add(id, pawn(COL[id] || COL.pk, small), n, { lab:{ size:.46 }, dy:.3 });

	function roofed(w, h, d, wall, roof){
		const g = new THREE.Group();
		g.add(box(w, h, d, wall, 0, 0, 0));
		const sh = new THREE.Shape(); sh.moveTo(-w/2 - .12, 0); sh.lineTo(0, w*.42); sh.lineTo(w/2 + .12, 0); sh.closePath();
		const r = mesh(new THREE.ExtrudeGeometry(sh, { depth:d + .24, bevelEnabled:false }), M(roof), 0, h, -d/2 - .12); g.add(r);
		g.add(box(w*.18, h*.5, .05, "#5a3d2b", 0, 0, d/2));
		for(const x of [-w*.3, w*.3]) g.add(box(w*.16, w*.16, .05, "#9fc3d8", x, h*.5, d/2));
		return g;
	}
	{	// biens
		const g = new THREE.Group(); [[0, 0], [.32, .12], [-.2, .3]].forEach(([x, z], i) => { for(let k = 0; k < 3 + i; k++) g.add(mesh(new THREE.CylinderGeometry(.22, .22, .07, 20), M("#d9a93a", { metalness:.7, roughness:.3 }), x, .035 + k*.075, z)); });
		add("f2000", g, "2 000 F");
		const e = g.clone(); e.scale.setScalar(1.3); add("epargne", e, "Épargne sur salaires");
		const h = g.clone(); h.scale.setScalar(1.6); add("heritage", h, "Héritage des enfants");
		const ap = new THREE.Group(); ap.add(box(1.3, 1.9, 1.2, "#cfc6b4", 0, 0, 0)); for(const y of [.5, 1.2]) for(const x of [-.32, .32]) ap.add(box(.28, .34, .04, "#9fc3d8", x, y, .6)); ap.add(box(1.4, .08, 1.3, "#8d8577", 0, 1.9, 0));
		add("apt", ap, "Studio de 1959");
		const cab = roofed(2, 1.3, 1.6, "#e9dcc0", "#7b4a3a"); cab.add(box(.9, .3, .05, "#1f3d31", 0, .95, .82)); add("cabinet", cab, "Cabinet (1968)");
		add("maison", roofed(2.6, 1.5, 2, "#f4efe6", "#4f5966"), "Maison (1972)");
		const im = new THREE.Group(); im.add(box(1.9, 3.2, 1.6, "#a5533c", 0, 0, 0)); for(let y = 0; y < 4; y++) for(const x of [-.55, 0, .55]) im.add(box(.3, .4, .04, "#d8e6ee", x, .35 + y*.72, .8)); im.add(box(2, .1, 1.7, "#6a3426", 0, 3.2, 0));
		add("immeuble", im, "Immeuble (1985)");
		const co = new THREE.Group(); co.add(box(1, .8, .5, "#7a4b2a", 0, .1, 0)); for(const y of [.32, .62]) co.add(box(.86, .02, .04, "#4c2c17", 0, y, .25)); for(const x of [-.4, .4]) co.add(box(.08, .1, .08, "#4c2c17", x, 0, .18));
		add("commode", co, "Commode héritée");
		const fe = new THREE.Group(); fe.add(roofed(3, 1.5, 2, "#b33a2e", "#5b5f63")); fe.add(mesh(new THREE.CylinderGeometry(.45, .45, 2.6, 20), M("#c8ccd0"), 2.1, 1.3, -.3)); fe.add(mesh(new THREE.SphereGeometry(.45, 20, 10, 0, Math.PI*2, 0, Math.PI/2), M("#9aa0a6"), 2.1, 2.6, -.3));
		add("ferme", fe, "Corps de ferme · 250 000 €");
		const ti = new THREE.Group(); for(let k = 0; k < 5; k++){ const p = box(.9, .03, 1.2, "#ffffff", 0, k*.035, 0); p.rotation.y = (k - 2)*.06; ti.add(p); } [.25, .45, .7].forEach((h, i) => ti.add(box(.16, h, .16, "#2c6a46", -.25 + i*.25, .2, -.2)));
		add("titres", ti, "Actions CAC 40 · 100 000 €");
		const li = new THREE.Group(); li.add(box(.8, .14, 1.1, "#2f5d9e", 0, 0, 0)); li.add(box(.6, .02, .3, "#e8c766", 0, .14, .2)); add("livret", li, "Livret");
		const av = new THREE.Group(); av.add(box(1.2, 1.2, 1, "#3d4a52", 0, 0, 0)); av.add(mesh(new THREE.CylinderGeometry(.2, .2, .08, 20), M("#d9a93a", { metalness:.7, roughness:.3 }), 0, .6, .52).rotateX(Math.PI/2)); add("av", av, "Assurance-vie");
		const pe = new THREE.Group(); [.4, .7, 1.1, 1.6].forEach((h, i) => pe.add(box(.28, h, .4, "#2c6a46", -.48 + i*.32, 0, 0))); add("pea", pe, "PEA · actions");
		add("loc", roofed(1.6, 1.1, 1.4, "#e7d7bf", "#9a5a3a"), "Immobilier locatif");
		add("appart", roofed(2.2, 1.4, 1.8, "#efe3d0", "#55606b"), "Chez Jean-Baptiste et Sarah");
		const heart = add("heart", new THREE.Group(), null); heart.label = label("❤️", { bg:null, size:.9, big:1 }); heart.label.position.y = .6; heart.g.add(heart.label);
	}
	// zones « propre / commun » : disques au sol ; la communauté est faite de deux demi-disques qui se séparent au décès
	function zone(id, r, c, text, theta){
		const geo = theta == null ? new THREE.CylinderGeometry(r, r, .06, 48) : new THREE.CylinderGeometry(r, r, .06, 32, 1, false, theta, Math.PI);
		const m = mesh(geo, new THREE.MeshStandardMaterial({ color:c, roughness:.9, transparent:true, opacity:.85 }), 0, .07, 0); m.castShadow = false; m.userData.zone = id;
		const rec = add(id, m, null); rec.mesh = m;
		if(text){ rec.label = label(text, { size:.5, fg:"#fff", bg:new THREE.Color(c).multiplyScalar(.7).getStyle() }); rec.label.position.set(theta == null ? 0 : (theta > 1 ? -r*.45 : r*.45), .35, r*.62); rec.g.add(rec.label); }
		return rec;
	}
	zone("zP", 2.6, COL.zP, "Propre à Paul"); zone("zJ", 2.6, COL.zJ, "Propre à Jeannette");
	zone("zCL", 2.9, COL.zC, "", Math.PI); zone("zCR", 2.9, COL.zC, "", 0);
	const comLab = add("lCom", new THREE.Group(), null); comLab.label = label("Commun", { size:.55, fg:"#fff", bg:"#a8862e" }); comLab.label.position.set(0, .35, 0); comLab.g.add(comLab.label);
	// parcelles des couples (contrats, remariage)
	zone("plA", 2.4, "#eaa6bd", "Biens d'Élise"); zone("plB", 2.4, "#8fb3e0", "Biens de Florent"); zone("plC", 2.4, COL.zC, "Commun");
	{	const f = new THREE.Group(); for(let i = 0; i < 7; i++) f.add(box(.12, .7, .12, "#7a5a3a", 0, 0, -2.4 + i*.8)); for(const y of [.25, .55]) f.add(box(.06, .08, 5, "#8d6a46", 0, y, 0)); add("fence", f, null); }
	const cross = add("cross", new THREE.Group(), null); cross.label = label("✗", { bg:null, fg:"#c0392b", size:1.3, big:1 }); cross.label.position.y = .4; cross.g.add(cross.label);
	const bolt = add("bolt", new THREE.Group(), null); bolt.label = label("⚡", { bg:null, size:1.4, big:1 }); bolt.label.position.y = 1.4; bolt.g.add(bolt.label);
	{	// le fisc : un petit temple à colonnes, où partent les droits de succession
		const f = new THREE.Group(), st = "#e4e0d6";
		f.add(box(3, .3, 2, "#cfc9bb", 0, 0, 0)); for(let i = 0; i < 4; i++) f.add(mesh(new THREE.CylinderGeometry(.14, .16, 1.6, 12), M(st), -1.1 + i*.73, 1.1, .6));
		f.add(box(2.6, 1.6, 1.1, "#d8d2c4", 0, .3, -.35)); f.add(box(3.1, .22, 2.1, "#cfc9bb", 0, 1.9, 0));
		const sh = new THREE.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(0, .7); sh.lineTo(1.6, 0); sh.closePath();
		f.add(mesh(new THREE.ExtrudeGeometry(sh, { depth:2.1, bevelEnabled:false }), M(st), 0, 2.12, -1.05));
		add("fisc", f, "🏛 Le fisc");
		add("creancier", pawn("#55595e"), "Créancier", { lab:{ size:.46, bg:"#e7e2d6" }, dy:.3 });
		const ac = new THREE.Group(); ac.add(box(.7, 2.6, .7, "#c0392b", 0, 0, 0)); ac.add(box(.9, .12, .9, "#7b241c", 0, 2.6, 0)); add("action", ac, "Une seule action");
		const cc = new THREE.Group(); [[0, 0], [.3, .2]].forEach(([x, z], i) => { for(let k = 0; k < 2 + i; k++) cc.add(mesh(new THREE.CylinderGeometry(.22, .22, .07, 20), M("#b9b4a8", { metalness:.6, roughness:.35 }), x, .035 + k*.075, z)); }); add("compte", cc, "Compte courant");
	}

	/* --- Maître Bonchamp en personne : il fait le tour du plateau et vient se placer devant le joueur quand il parle --- */
	const NOT = new THREE.Group(), notInner = new THREE.Group(); NOT.add(notInner); scene.add(NOT);
	{
		const suit = M("#23232b", { roughness:.55 }), skin = M("#f1c9a5"), white = M("#f4f1ea"), black = M("#111");
		notInner.add(mesh(new THREE.CylinderGeometry(.44, .48, .16, 28), suit, 0, .08, 0));
		notInner.add(mesh(new THREE.CylinderGeometry(.2, .36, .9, 24), suit, 0, .6, 0));
		notInner.add(mesh(new THREE.BoxGeometry(.16, .26, .06), white, 0, .9, .2));                       // plastron
		notInner.add(mesh(new THREE.BoxGeometry(.16, .08, .05), M("#8f1d21"), 0, 1.02, .24));               // nœud papillon
		notInner.add(mesh(new THREE.SphereGeometry(.26, 24, 16), skin, 0, 1.3, 0));
		notInner.add(mesh(new THREE.SphereGeometry(.275, 24, 12, 0, Math.PI*2, 0, Math.PI*.42), white, 0, 1.33, -.03));   // cheveux blancs
		for(const x of [-.09, .09]){ const g = mesh(new THREE.TorusGeometry(.06, .014, 6, 16), black, x, 1.32, .245); notInner.add(g); }
		notInner.scale.setScalar(1.15);
	}
	const notLab = label("Maître Bonchamp", { size:.36, fg:"#fff", bg:"#1f3d31" }); notLab.position.y = 2.05; NOT.add(notLab);
	const notTalk = label("💬", { bg:null, size:.75, big:1 }); notTalk.position.set(.5, 2.55, 0); notTalk.visible = false; NOT.add(notTalk);
	let NR = 10.4, na = .5, nt = .5, nside = 1, talkUntil = 0;
	NOT.position.set(NR*Math.sin(na), 0, NR*Math.cos(na));
	const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
	// il vient se placer à l'avant du plateau, une fois à gauche, une fois à droite : on le voit marcher
	function notaryTalk(ms){
		const p = cam ? cam.p1 : camera.position, t = cam ? cam.t1 : controls.target;
		const az = Math.atan2(p.x - t.x, p.z - t.z);
		nside = -nside; nt = az + nside*(NR < 10 ? 1.2 : .5);
		talkUntil = performance.now() + ms + Math.abs(wrapA(nt - na))*NR/4.5*1000;
	}
	const headV = new THREE.Vector3();
	function notaryHead(){
		headV.set(NOT.position.x, 2.3, NOT.position.z).project(camera);
		const r = canvas.getBoundingClientRect();
		return { x:r.left + (headV.x + 1)/2*r.width, y:r.top + (1 - headV.y)/2*r.height, visible:headV.z < 1 && Math.abs(headV.x) < 1.05 && Math.abs(headV.y) < 1.05 };
	}
	function notaryTick(dt, now){
		const d = wrapA(nt - na), walking = Math.abs(d) > .002;
		if(walking){ const st = Math.sign(d)*Math.min(Math.abs(d), dt*4.5/NR); na += st; NOT.position.set(NR*Math.sin(na), 0, NR*Math.cos(na)); }
		// cap : dans le sens de la marche, sinon vers la caméra
		const face = walking ? na + Math.sign(d)*Math.PI/2 : Math.atan2(camera.position.x - NOT.position.x, camera.position.z - NOT.position.z);
		NOT.rotation.y += wrapA(face - NOT.rotation.y)*Math.min(1, dt*8);
		const talking = !walking && now < talkUntil;
		notInner.position.y = walking ? Math.abs(Math.sin(now/90))*.16 : 0;
		notInner.rotation.z = walking ? Math.sin(now/90)*.06 : talking ? Math.sin(now/160)*.04 : 0;
		notInner.scale.y = 1.15*(talking ? 1 + Math.sin(now/110)*.025 : 1);
		notTalk.visible = talking; if(talking) notTalk.position.y = 2.55 + Math.sin(now/200)*.06;
	}

	// anneau sous l'objet à classer
	const ring = mesh(new THREE.TorusGeometry(1, .06, 8, 48), new THREE.MeshBasicMaterial({ color:"#b08a3e" }), 0, .12, 0); ring.rotation.x = Math.PI/2; ring.visible = false; scene.add(ring);

	/* --- animations --- */
	const anims = [];
	const easeIO = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const easeBack = k => 1 + 2.2*Math.pow(k - 1, 3) + 1.2*Math.pow(k - 1, 2);
	function anim(rec, key, dur, fn, done){
		const a = { rec, key, t0:performance.now(), dur, fn, done };
		for(let i = anims.length - 1; i >= 0; i--) if(rec && anims[i].rec === rec && anims[i].key === key) anims.splice(i, 1);
		anims.push(a);
	}
	function popIn(id, delay = 0){
		const r = O[id]; if(!r) return; r.g.visible = true; r.g.scale.setScalar(.001); r.out = false;
		setTimeout(() => { if(r.out) return; r.g.visible = true; anim(r, "scale", 450, k => r.g.scale.setScalar(Math.max(.001, r.s*easeBack(k)))); }, delay);
	}
	function popOut(id){
		const r = O[id]; if(!r || !r.g.visible || r.out) return; r.out = true; const s0 = r.g.scale.x;
		anim(r, "scale", 260, k => r.g.scale.setScalar(Math.max(.001, s0*(1 - k))), () => { if(r.out) r.g.visible = false; });
	}
	function moveTo(id, x, z, arc = 1.6, dur = 800){
		const r = O[id]; if(!r) return; const p0 = r.g.position.clone(), p1 = new THREE.Vector3(x, 0, z);
		anim(r, "pos", dur, k => { const e = easeIO(k); r.g.position.lerpVectors(p0, p1, e); r.g.position.y = Math.sin(Math.PI*k)*arc; });
	}
	function place(id, x, z, delay){ const r = O[id]; if(!r) return; if(r.g.visible && !r.out) moveTo(id, x, z, .8); else { r.g.position.set(x, 0, z); popIn(id, delay); } }
	function shake(id){ const r = O[id]; if(!r) return; anim(r, "shake", 450, k => { r.inner.position.x = Math.sin(k*Math.PI*6)*.18*(1 - k); }); }
	function hop(id, delay = 0){ const r = O[id]; if(!r) return; setTimeout(() => anim(r, "hop", 500, k => { r.inner.position.y = Math.sin(Math.PI*k)*.8; }), delay); }
	function glow(id){ const r = O[id]; if(!r) return; anim(r, "glow", 600, k => r.inner.scale.setScalar(1 + .22*Math.sin(Math.PI*k))); }
	// un jeton (pièce d'or ou feuille) vole d'un objet à un autre
	const coinGeo = new THREE.CylinderGeometry(.2, .2, .06, 18), docGeo = new THREE.BoxGeometry(.5, .03, .65);
	function fly(from, to, n = 1, kind = "coin"){
		const a = O[from], b = O[to]; if(!a || !b) return;
		for(let i = 0; i < n; i++){
			const t = mesh(kind === "coin" ? coinGeo : docGeo, kind === "coin" ? M("#d9a93a", { metalness:.7, roughness:.3 }) : M("#ffffff"));
			const p0 = a.g.position.clone().setY(a.top*.6 + .3), p1 = b.g.position.clone().setY(.4);
			t.position.copy(p0); t.visible = false; scene.add(t);
			setTimeout(() => { t.visible = true; anim(null, null, 900, k => { t.position.lerpVectors(p0, p1, easeIO(k)); t.position.y += Math.sin(Math.PI*k)*2.4; t.rotation.z = k*8; }, () => scene.remove(t)); }, i*160);
		}
	}
	function mourn(id, on){
		const r = O[id]; if(!r) return;
		r.inner.traverse(m => { if(!m.isMesh) return; if(on){ m.userData.m0 = m.userData.m0 || m.material; m.material = M("#9a9a9a", { transparent:true, opacity:.4 }); } else if(m.userData.m0) m.material = m.userData.m0; });
		if(r.label) r.label.material.opacity = on ? .5 : 1;
	}
	function setPlot(id, color, text){ const r = O[id]; r.mesh.material.color.set(color); relabel(r.label, text, { bg:new THREE.Color(color).multiplyScalar(.7).getStyle() }); }
	function grow(id, f, dur = 2600){ const r = O[id]; if(!r) return; const s0 = r.inner.scale.x; anim(r, "glow", dur, k => r.inner.scale.setScalar(s0 + (f - s0)*easeIO(k))); }
	function rename(id, text){ const r = O[id]; if(r && r.label) relabel(r.label, text); }
	function pose(id, x, z, delay){ const r = O[id]; r.g.position.set(x, 0, z); r.out = false; popIn(id, delay); }
	// un éclair entre deux objets : le conflit
	function zap(a, b){ const A = O[a].g.position, B = O[b].g.position; pose("bolt", (A.x + B.x)/2, (A.z + B.z)/2); shake(a); shake(b); setTimeout(() => popOut("bolt"), 1600); }
	function scaleTo(id, s){ const r = O[id]; r.s = s; if(r.g.visible) { const s0 = r.g.scale.x; anim(r, "scale", 450, k => r.g.scale.setScalar(s0 + (s - s0)*easeIO(k))); } }

	/* --- caméra --- */
	let cam = null;
	// plus l'écran est étroit, plus on recule pour garder le plateau dans le cadre
	function look(px, py, pz, tx, ty, tz){
		const t1 = new THREE.Vector3(tx, ty, tz), fit = Math.min(1.9, Math.max(1, 1.35/camera.aspect));
		cam = { p0:camera.position.clone(), t0:controls.target.clone(), p1:new THREE.Vector3(px, py, pz).sub(t1).multiplyScalar(fit).add(t1), t1, k:0 };
	}

	/* --- les époques : où se trouve chaque objet --- */
	const ZP = [-7.2, 1], ZC = [0, 1.6], ZJ = [7.2, 1];
	const slots = {};
	const SLOT = [[-1.1, -.7], [1.1, -.7], [0, .9], [-1.3, 1.1], [1.3, 1.1], [0, -1.7]];
	function slot(z){ const c = { zP:ZP, zC:ZC, zJ:ZJ }[z]; const i = slots[z] = (slots[z] || 0) + 1; const [dx, dz] = SLOT[(i - 1) % SLOT.length]; return [c[0] + dx, c[1] + dz]; }
	const ZONES = { zP:[...ZP], zCL:[...ZC], zCR:[...ZC], lCom:[...ZC], zJ:[...ZJ] };
	const ERAS = {
		intro:   { cam:[0, 7, 27, 0, 3, -6], at:{ paul:[0, 1], apt:[-2.6, -1.5], f2000:[1.6, 1.6] } },
		mariage: { cam:[0, 10, 15, 0, .4, .6], at:{ paul:[-3.2, 1.2], jeannette:[3.2, 1.2], plA:[-3.2, .8], plB:[3.2, .8], f2000:[-4.6, 2.4] } },
		maison:  { cam:[0, 19, 17, 0, 0, 1], zones:1, at:{ paul:[-1.4, -3.8], jeannette:[1.4, -3.8], jb:[0, -2.9], f2000:[-7.2, 1.6], cabinet:[-1.2, .9], maison:[1.3, 2] } },
		immeuble:{ cam:[0, 19, 18, 0, 0, 0], zones:1, at:{ paul:[-1.6, -3.8], jeannette:[1.6, -3.8], jb:[-.8, -2.9], elise:[0, -2.7], louise:[.8, -2.9], f2000:[-7.2, 1.6], cabinet:[-1.2, .9], maison:[1.3, 2], epargne:[-.6, 3.2], immeuble:[0, -7.6] } },
		deces:   { cam:[0, 20, 17, 0, 0, 1.6], zones:1, at:{ paul:[-7.2, -2.4], jeannette:[7.2, -2.4], jb:[-1.5, 6.6], elise:[0, 7], louise:[1.5, 6.6],
			f2000:[-7.2, 1.6], cabinet:[-1.6, .6], maison:[-1, 2.8], immeuble:[1.6, .4], epargne:[1.2, 2.8], commode:[7.2, 1.4] } },
		placer:  { cam:[0, 11, 16, 0, .6, 0], at:{ jb:[-1.6, 4], elise:[0, 4.5], louise:[1.6, 4], heritage:[0, .9], livret:[-6.6, -1], av:[-4, -3.2], pea:[-1.3, -4.2], loc:[1.4, -4.2], action:[4.1, -3.2], compte:[6.6, -1] } },
		contrats:{ cam:[0, 10, 14, 0, .4, 0], at:{ elise:[-3.2, 1.2], florent:[3.2, 1.2], plA:[-3.2, .8], plB:[3.2, .8] } },
		remariage:{ cam:[0, 11, 15, 0, .4, 0], at:{ paul:[-4, .4], paulette:[4, .4], jb:[-5.6, 2.4], elise:[-4, 2.9], louise:[-2.4, 2.4], pk1:[3.2, 2.6], pk2:[4.8, 2.6], plA:[-4, 1.4], plB:[4, 1.4] } },
		concubin:{ cam:[0, 9, 15, 0, .8, 0], at:{ jb:[-2.8, 1.8], sarah:[0, 2.2], appart:[-2.6, -2.2], fisc:[4.6, -2] } },
		transmettre:{ cam:[0, 13, 17, 0, .4, .8], at:{ fisc:[6.8, -4.4], paul:[0, -2.4], paulette:[3.2, -2.4], ferme:[-4.6, -3.4], titres:[-2.2, -.6], jb:[-4.4, 3.6], elise:[-2.8, 4.2], louise:[-1.2, 4.4], pk1:[3.6, 4], pk2:[5.2, 3.6] } },
		end:     { cam:[0, 7, 26, 0, 2.5, -5], at:{ paul:[-.9, -1], paulette:[.9, -1], florent:[-6.6, 1.2], elise:[-5.1, 1.9], louise:[-3.5, 2.6], jb:[-1.8, 3.1], sarah:[-.2, 3.4], pk1:[2.8, 2.6], pk2:[4.5, 1.9] } }
	};
	function era(name){
		const E = ERAS[name]; for(const k in slots) delete slots[k];
		const at = { ...E.at, ...(E.zones ? ZONES : {}) };
		let n = 0;
		for(const id in O){
			const r = O[id]; mourn(id, false); r.inner.position.set(0, 0, 0); r.inner.scale.setScalar(1); if(r.label && r.text0 && r.label.userData.cur !== r.text0) relabel(r.label, r.text0);
			if(at[id]) place(id, at[id][0], at[id][1], (n++)*60);
			else popOut(id);
		}
		O.zCL.mesh.material.color.set(COL.zC); O.zCR.mesh.material.color.set(COL.zC);
		halves(false);
		["plA", "plB", "plC"].forEach(id => O[id].s = 1);
		ring.visible = false; focusId = null;
		look(...E.cam);
	}
	function halves(text){
		for(const [id, t, x] of [["zCL", text ? "½ à Paul" : "", -1.4], ["zCR", text ? "Succession de Jeannette" : "", 1.4]]){
			const r = O[id];
			if(!r.label){ r.label = label(" ", { size:.55, fg:"#fff", bg:"#a8862e" }); r.g.add(r.label); }
			r.label.visible = !!t; if(t){ relabel(r.label, t); r.label.position.set(x, .35, 3.4); }
		}
	}
	let focusId = null;
	function focus(id){ focusId = id; ring.visible = !!id; }

	/* --- toucher : choisir une zone directement sur la maquette --- */
	let onZone = null, down = null;
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
	canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
	canvas.addEventListener("pointerup", e => {
		if(!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || !onZone) return;
		const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1);
		ray.setFromCamera(ndc, camera);
		const hit = ray.intersectObjects(["zP", "zCL", "zCR", "zJ", "plA", "plB", "plC"].map(k => O[k].mesh).filter(m => O[m.userData.zone].g.visible))[0];
		if(hit) onZone(hit.object.userData.zone);
	});

	/* --- boucle --- */
	let raf = 0, last = performance.now();
	function loop(now){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(let i = anims.length - 1; i >= 0; i--){
			const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); if(k < 0) continue;
			a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); }
		}
		if(focusId && O[focusId]){ const r = O[focusId]; ring.position.x = r.g.position.x; ring.position.z = r.g.position.z; ring.scale.setScalar(1.1 + .12*Math.sin(now/180)); if(!anims.some(a => a.rec === r && a.key === "hop")) r.inner.position.y = Math.abs(Math.sin(now/260))*.35; }
		notaryTick(dt, now);
		if(cam){ cam.k = Math.min(1, cam.k + dt/1.3); const e = easeIO(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.update();
		renderer.render(scene, camera);
	}
	function resize(w, h){
		const ls = w < 600 ? 1.3 : 1;
		NR = w < 600 ? 7.8 : 10.4; NOT.position.set(NR*Math.sin(na), 0, NR*Math.cos(na));      // sur téléphone, il se poste sur les côtés du plateau, la frise cachant l'avant
		if(ls !== LS){ scene.traverse(o => { if(o.isSprite) o.scale.multiplyScalar(ls/LS); }); LS = ls; }
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px"; camera.aspect = w/h; camera.fov = w/h < .9 ? 50 : 36; camera.updateProjectionMatrix(); }
	camera.position.set(0, 22, 26); controls.target.set(0, 0, 0);
	raf = requestAnimationFrame(loop);
	return {
		O, era, popIn, popOut, moveTo, shake, hop, glow, fly, mourn, focus, slot, halves, setPlot, scaleTo, look, resize, grow, rename, pose, zap,
		set onZone(f){ onZone = f; canvas.style.cursor = f ? "pointer" : ""; },
		get onZone(){ return onZone; }, camera, notaryTalk, notaryHead,
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
	};
}

/* ================= le jeu : une main de cartes à chaque tournant de la vie ================= */
// les cartes « outils » du conseiller
const CARDS = {
	legal:   ["💍", "Régime légal", "Ne rien signer : communauté réduite aux acquêts."],
	sep:     ["🧱", "Séparation de biens", "Chacun garde ce qu'il a et ce qu'il achète."],
	part:    ["⚖️", "Participation aux acquêts", "Séparés pendant, on partage l'enrichissement à la fin."],
	univ:    ["🌐", "Communauté universelle", "Tout est commun, même ce qu'on avait avant."],
	dde:     ["🎁", "Donation entre époux", "Élargit les droits du conjoint qui survit."],
	test:    ["📜", "Testament", "Désigne qui reçoit la part libre du patrimoine."],
	av:      ["🛡️", "Assurance-vie", "Un capital pour le bénéficiaire choisi, hors succession."],
	rien:    ["🤷", "Ne rien prévoir", "La loi décidera à ta place."],
	commun:  ["🏢", "Acheter à deux", "L'immeuble devient un bien commun du couple."],
	sci:     ["🏛️", "SCI familiale", "Une société civile achète et loue au cabinet."],
	loc:     ["🔑", "Rester locataire", "Pas d'achat : le cabinet paie un loyer."],
	partage: ["✂️", "Partager tout de suite", "Chacun reçoit sa part, fin de l'indivision."],
	indiv:   ["🔗", "Rester en indivision", "Tout le monde possède tout, ensemble."],
	vendre:  ["🏷️", "Tout vendre", "On vend tout, maison comprise, et on partage."],
	livret:  ["📘", "Livret d'épargne", "Disponible à tout moment, sans risque, peu rémunéré."],
	avp:     ["🛡️", "Assurance-vie", "Placement long terme, fiscalité douce après 8 ans."],
	pea:     ["📈", "Actions diversifiées", "Des dizaines d'entreprises : ça monte et ça descend."],
	immo:    ["🏘️", "Immobilier locatif", "Un appartement loué : des loyers réguliers."],
	action:  ["🎰", "Une seule action à la mode", "Tout miser sur la valeur qui monte le plus."],
	compte:  ["🏦", "Compte courant", "Laisser l'argent sur le compte, sans y toucher."],
	pacs:    ["🤝", "PACS + testament", "Se pacser et rédiger un testament l'un pour l'autre."],
	dp:      ["👨‍👧‍👦", "Donation-partage", "Donner de son vivant, à parts égales, chez le notaire."],
	np:      ["🗝️", "Donner la nue-propriété", "Donner la ferme et garder l'usufruit (les loyers)."],
	testP:   ["📜", "Tout léguer à Paulette", "Un testament en faveur de sa nouvelle épouse."],
	legs:    ["🏚️", "Ferme aux enfants de Paulette", "Un legs pour traiter tout le monde pareil."],
	// cartes des coups du sort
	hsep:    ["🗂️", "Un compte à son nom", "Placé à part, avec la preuve de l'héritage."],
	hcom:    ["🔀", "Le compte joint", "Mélangé à l'épargne du couple."],
	hach:    ["🛠️", "Rénover la maison", "Financer des travaux dans la maison commune."],
	aref:    ["🚫", "Refuser et vérifier", "Consulter les listes noires de l'AMF."],
	ainv:    ["💸", "Investir 50 000 €", "À 15 %, c'est trop beau pour passer à côté !"],
	ates:    ["🧪", "Tester avec 10 000 €", "Juste pour voir si ça marche."],
	kven:    ["😱", "Tout vendre", "Sauver ce qui reste, vite !"],
	kgar:    ["🧘", "Garder et patienter", "Il n'a pas besoin de cet argent avant longtemps."],
	kach:    ["🛒", "Racheter un peu", "Profiter des prix bas."],
	cliv:    ["📘", "Puiser dans son livret", "L'épargne de précaution, c'est fait pour ça."],
	cact:    ["📉", "Vendre ses actions", "Même si elles sont en baisse ce mois-ci."],
	ccre:    ["💳", "Un crédit à la consommation", "Pour ne pas toucher à ses placements."],
	ldiv:    ["🧺", "Diversifier", "Précaution, assurance-vie, actions… et un petit plaisir."],
	ltou:    ["🛍️", "Tout dépenser", "Voyages, voiture : on ne vit qu'une fois !"],
	lcry:    ["🪙", "Tout sur une cryptomonnaie", "Un ami a fait ×10 l'an dernier."],
	nabt:    ["🍼", "Donner 31 865 € à Léa", "L'abattement grand-parent → petit-enfant."],
	nlat:    ["⏳", "Attendre la succession", "Elle recevra bien quelque chose plus tard."],
	nliv:    ["🐷", "Lui ouvrir un livret", "Avec quelques centaines d'euros."]
};
const euro = v => Math.round(v).toLocaleString("fr-FR") + " €";
// Maître Bonchamp, le notaire de la famille (fictif), en portrait
const NOTAIRE = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#1f3d31"/><path d="M10 60c2-12 10-17 22-17s20 5 22 17" fill="#2b2b33"/><path d="M26 43l6 8 6-8" fill="#fff"/><path d="M28 50l4-3 4 3-4 3z" fill="#8f1d21"/>
	<circle cx="32" cy="28" r="13" fill="#f1c9a5"/><path d="M19 25c0-9 6-13 13-13s13 4 13 13c-3-4-7-6-13-6s-10 2-13 6z" fill="#d9d4cc"/>
	<circle cx="27" cy="29" r="3.6" fill="none" stroke="#3b2a10" stroke-width="1.6"/><circle cx="37" cy="29" r="3.6" fill="none" stroke="#3b2a10" stroke-width="1.6"/><path d="M30.6 29h2.8" stroke="#3b2a10" stroke-width="1.6"/>
	<circle cx="27" cy="29" r="1.1" fill="#3b2a10"/><circle cx="37" cy="29" r="1.1" fill="#3b2a10"/><path d="M28 35.5q4 3 8 0" stroke="#8a4b3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M27 33.5q5-2 10 0" stroke="#d9d4cc" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;
const REACT = {
	3:["Remarquable ! Je n'aurais pas mieux conseillé.", "Voilà un conseil digne d'un associé du cabinet.", "Parfait. Je prépare l'acte.", "Bravo ! La famille vous doit une fière chandelle."],
	2:["Pas mal… mais on pouvait faire mieux.", "C'est défendable. Jetez tout de même un œil au conseil de l'expert.", "Correct, sans plus. La famille s'en sortira."],
	1:["Aïe… J'ai bien peur que la famille le regrette.", "Hum. Ce n'est pas ce que j'aurais conseillé.", "Ouille ! Relisez vite le conseil de l'expert."]
};
const pick = a => a[Math.floor(Math.random()*a.length)];
const STARS = n => "★".repeat(n) + "☆".repeat(3 - n);
const VERDICT = ["", "Conseil risqué", "Bon conseil", "Excellent conseil"];

export function openPatrimoine({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gp-css")){ const st = document.createElement("style"); st.id = "gp-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "gp"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le Dossier Deslaurier");
	root.innerHTML = `<canvas aria-hidden="true"></canvas><div class="gp-top"><span class="gp-chip gp-stage" id="gpStage">Dossier</span><button class="gp-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gp-meters" aria-live="polite"><span class="gp-m fam"><small>💰 Famille</small><b data-m="fam">0 €</b></span><span class="gp-m fisc"><small>🏛 Fisc</small><b data-m="fisc">0 €</b></span><span class="gp-m conf"><small>⚡ Conflits</small><b data-m="conf">0</b></span><span class="gp-m st"><small>Conseils</small><b data-m="stars">0 ★</b></span></div>
		<div class="gp-hint">↻ Fais tourner la maquette</div>
		<div class="gp-tl" aria-label="Frise des années"><div class="gp-tl-bar"><i></i></div><ol>${TIMELINE.map(([l, s]) => `<li><span class="l">${l}</span><span class="s">${s}</span></li>`).join("")}</ol></div>
		<div class="gp-bubble off" title="Toucher pour masquer">${NOTAIRE}<p><b>Maître Bonchamp</b><span></span></p></div>
		<div class="gp-wrap"><div class="gp-card"></div></div>`;
	document.body.appendChild(root);
	const bubble = root.querySelector(".gp-bubble");
	const canvas = root.querySelector("canvas"), wrap = root.querySelector(".gp-wrap"), card = root.querySelector(".gp-card"), hint = root.querySelector(".gp-hint"), tl = root.querySelector(".gp-tl"), meters = root.querySelector(".gp-meters");
	const W = world(canvas);
	function layoutBubble(){
		if(innerWidth >= MOBILE) Object.assign(bubble.style, { left:"auto", right:"456px", top:"auto", bottom:"74px", maxWidth:Math.min(380, innerWidth - 444 - 120) + "px" });
		else Object.assign(bubble.style, { left:"8px", right:"8px", top:"96px", bottom:"auto", maxWidth:"none" });
	}
	function layout(){
		const w = innerWidth, h = innerHeight;
		if(w >= MOBILE){ wrap.style.top = ""; hint.style.top = ""; tl.style.top = ""; tl.style.width = (w - 444 - 24) + "px"; W.resize(w - 444, h);
			layoutBubble(); }
		else { const top = Math.round(h*.44); wrap.style.top = top + "px"; tl.style.top = (top - 56) + "px"; tl.style.width = (w - 24) + "px"; hint.style.top = (top - 90) + "px"; W.resize(w, top + 16);
			layoutBubble(); }
	}
	let curEra = "intro";
	const onResize = () => { layout(); frise(curEra); };
	addEventListener("resize", onResize); layout();
	canvas.addEventListener("pointerdown", () => hint.hidden = true, { once:true });

	const S = { fam:0, fisc:0, conf:0, stars:0, errors:0, learned:new Set(), dde:null, done:{} };
	let closed = false;
	const show = html => { card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; wrap.scrollTo({ top:0, behavior:"smooth" }); };
	const later = (ms, f) => setTimeout(() => { if(!closed) f(); }, ms);
	const scrollEnd = () => later(80, () => wrap.scrollTo({ top:wrap.scrollHeight, behavior:"smooth" }));
	function stage(t, era){ root.querySelector("#gpStage").textContent = t; onEvent && onEvent("stage", t); W.era(era); frise(era); }
	function frise(era){
		curEra = era;
		const n = TIMELINE.findIndex(x => x[2].includes(era)), li = tl.querySelectorAll("li");
		li.forEach((x, i) => { x.classList.toggle("past", i < n); x.classList.toggle("now", i === n); });
		const bar = tl.querySelector(".gp-tl-bar").getBoundingClientRect();
		const dot = el => { const r = el.getBoundingClientRect(); return el === li[0] ? r.left + 7 : el === li[li.length - 1] ? r.right - 7 : r.left + r.width/2; };
		tl.querySelector(".gp-tl-bar i").style.width = Math.max(0, dot(li[n]) - bar.left) + "px";
	}
	// compteurs : ils défilent jusqu'à leur nouvelle valeur
	function meter(k, v){
		const el = meters.querySelector(`[data-m="${k}"]`), from = S[k]; S[k] = v;
		const short = v => Math.abs(v) >= 1e6 ? (v/1e6).toLocaleString("fr-FR", { maximumFractionDigits:2 }) + " M€" : Math.abs(v) >= 1e4 ? Math.round(v/1000) + " k€" : euro(v);
		const fmt = k === "fam" || k === "fisc" ? (innerWidth < 520 ? short : euro) : k === "stars" ? x => Math.round(x) + " ★" : x => Math.round(x);
		const t0 = performance.now();
		const step = now => { const q = Math.min(1, (now - t0)/900); el.textContent = fmt(from + (v - from)*(1 - Math.pow(1 - q, 3))); if(q < 1 && !closed) requestAnimationFrame(step); };
		requestAnimationFrame(step);
		if(v !== from){ el.parentNode.classList.remove("pop"); void el.offsetWidth; el.parentNode.classList.add("pop"); }
	}
	// Maître Bonchamp commente : le texte s'écrit lettre à lettre ; sur téléphone, la bulle s'efface seule
	let sayT = 0, hideT = 0;
	function say(text){
		if(!text) return;
		const sp = bubble.querySelector("span"); clearInterval(sayT); clearTimeout(hideT);
		bubble.classList.remove("off"); sp.textContent = ""; let i = 0;
		W.notaryTalk(1200 + text.length*40);
		sayT = setInterval(() => { if(closed) return clearInterval(sayT); sp.textContent = text.slice(0, ++i); if(i >= text.length) clearInterval(sayT); }, 18);
		if(innerWidth < MOBILE) hideT = setTimeout(() => bubble.classList.add("off"), 2600 + text.length*45);
	}
	bubble.addEventListener("click", () => bubble.classList.add("off"));
	// sur ordinateur, la bulle suit la tête du notaire sur la maquette ; sinon, elle reste à sa place fixe
	(function follow(){
		if(closed) return; requestAnimationFrame(follow);
		const h = W.notaryHead(), on = innerWidth >= MOBILE && h.visible;
		bubble.classList.toggle("follow", on);
		if(!on){ layoutBubble(); return; }
		const cw = innerWidth - 444, bw = bubble.offsetWidth, bh = bubble.offsetHeight;
		const x = Math.max(8, Math.min(cw - bw - 8, h.x - 18)), y = Math.max(110, Math.min(innerHeight - bh - 70, h.y - bh - 4));
		Object.assign(bubble.style, { left:x + "px", top:y + "px", right:"auto", bottom:"auto" });
	})();
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="gp-course"><span class="tag">📚 Au cœur du Master Droit & Gestion du Patrimoine</span><b>${n}</b><span>${t}</span></div>`; }
	// le régime d'un couple, sur ses deux parcelles
	function regime(k, A, B, z = .8){
		const O = W.O;
		W.setPlot("plA", A[1], A[0]); W.setPlot("plB", B[1], B[0]); W.popOut("fence");
		if(k === "univ"){ W.popOut("plA"); W.popOut("plB"); W.setPlot("plC", COL.zC, "Tout est commun"); O.plC.s = 1.9; W.pose("plC", 0, z); }
		else {
			for(const [id, x] of [["plA", -Math.abs(O.plA.g.position.x) || -3.2], ["plB", Math.abs(O.plB.g.position.x) || 3.2]]) if(!O[id].g.visible || O[id].out) W.pose(id, x, z);
			if(k === "legal"){ W.setPlot("plC", COL.zC, "Commun"); O.plC.s = .8; W.pose("plC", 0, z + 2.6); }
			else if(k === "part"){ W.setPlot("plC", COL.zC, "Gains partagés à la fin"); O.plC.s = .55; W.pose("plC", 0, z + 3.4); }
			else { W.popOut("plC"); O.fence.g.position.set(0, 0, z); W.popIn("fence"); }
		}
	}

	/* ---------- moteur d'un événement : on distribue la main, le joueur joue, on voit les conséquences ---------- */
	function deal(E){
		stage(E.stage, E.era);
		const n = E.pick || 1;
		say(E.say);
		if(E.cs) later(150, () => play("chime"));
		show(`${E.cs ? `<div class="gp-cs"><i>🎲</i><span><b>Coup du sort !</b><small>Une carte tirée au hasard : chaque partie est différente.</small></span></div>` : ""}<span class="gp-year">${E.year}</span><h2 class="gp-h">${E.title}</h2>
			<div class="gp-story">${E.story}<span class="gp-ask">${E.ask}</span></div>
			${E.pre ? `<div class="gp-pre">${E.pre()}</div>` : ""}
			<p class="gp-goal">🎯 ${E.goal}</p>
			<div class="gp-hand">${E.cards.map((k, i) => { const [ic, t, d] = CARDS[k]; return `<button class="gp-c" data-c="${k}" style="--r:${((i - (E.cards.length - 1)/2)*3).toFixed(1)}deg;--d:${200 + i*90}ms"><span class="ic">${ic}</span><b>${t}</b><small>${d}</small></button>`; }).join("")}</div>
			<div class="gp-pickhint">${n > 1 ? `Choisis ${n} cartes` : "Choisis une carte"}</div><div data-play></div><div data-res></div>`);
		E.setup && E.setup();
		later(250, () => play("pop"));
		const hand = card.querySelector(".gp-hand"), sel = [];
		hand.onclick = e => {
			const c = e.target.closest(".gp-c"); if(!c || hand.dataset.done) return;
			const k = c.dataset.c, i = sel.indexOf(k);
			if(i >= 0){ sel.splice(i, 1); c.classList.remove("sel"); }
			else { if(sel.length >= n){ const old = sel.shift(); hand.querySelector(`[data-c="${old}"]`).classList.remove("sel"); } sel.push(k); c.classList.add("sel"); }
			play("pop");
			card.querySelector("[data-play]").innerHTML = sel.length === n ? `<button class="gp-playbtn">${n > 1 ? `Jouer ces ${n} cartes` : `Jouer « ${CARDS[sel[0]][1]} »`}</button>` : "";
			if(sel.length === n) scrollEnd();
		};
		card.querySelector("[data-play]").onclick = e => {
			if(!e.target.closest(".gp-playbtn")) return;
			hand.dataset.done = 1; card.querySelector("[data-play]").innerHTML = ""; card.querySelector(".gp-pickhint").remove();
			hand.querySelectorAll(".gp-c").forEach(c => c.classList.add(sel.includes(c.dataset.c) ? "played" : "out"));
			play("stamp");
			resolve(E, E.out(sel.length > 1 ? sel : sel[0]), sel);
		};
	}
	function resolve(E, o, sel){
		o.fx && o.fx();
		later(o.wait || 900, () => {
			say(o.say || pick(REACT[o.stars]));
			const hand = card.querySelector(".gp-hand");
			sel.forEach(k => { const c = hand.querySelector(`[data-c="${k}"]`); c.insertAdjacentHTML("beforeend", `<span class="stamp s${o.stars}">${STARS(o.stars)}</span>`); });
			play(o.stars === 3 ? "good" : o.stars === 2 ? "chime" : "bad");
			if(o.stars === 1){ S.errors++; onEvent && onEvent("err"); }
			S.done[E.key] = o.stars;
			meter("stars", Object.values(S.done).reduce((a, b) => a + b, 0));
			if(o.fam) meter("fam", S.fam + o.fam);
			if(o.fisc) meter("fisc", S.fisc + o.fisc);
			if(o.conf) meter("conf", S.conf + o.conf);
			const d = [o.fam ? `<span>💰 ${o.fam > 0 ? "+" : "−"} ${euro(Math.abs(o.fam))} pour la famille</span>` : "", o.fisc ? `<span>🏛 ${euro(o.fisc)} au fisc</span>` : "", o.conf ? `<span>⚡ ${o.conf} conflit${o.conf > 1 ? "s" : ""}</span>` : ""].join("");
			card.querySelector("[data-res]").innerHTML = `<div class="gp-verdict s${o.stars}"><span class="st">${STARS(o.stars)}</span>${VERDICT[o.stars]}</div>
				${d ? `<div class="gp-delta">${d}</div>` : ""}<p class="gp-p">${o.txt}</p>
				${o.stars < 3 && E.best ? `<div class="gp-tip">💡 <b>Le conseil de l'expert :</b> ${E.best}</div>` : ""}
				${E.real ? `<p class="gp-real">${E.real}</p>` : ""}${(E.courses || []).map(course).join("")}
				<button class="gp-go" data-a="${E.next}">${E.nextLabel}</button>`;
			// on montre le verdict (la carte jouée juste au-dessus), pas le bas de la page
			later(80, () => { const v = card.querySelector(".gp-verdict"), h = card.querySelector(".gp-hand"); wrap.scrollTo({ top:Math.max(0, (innerWidth < MOBILE ? v.offsetTop - 12 : h.offsetTop - 12)), behavior:"smooth" }); });
			E.after && later(1800, E.after);
		});
	}

	/* ---------- les événements du dossier ---------- */
	const EV = {};
	EV.mariage = { key:"mariage", say:"Bonjour ! Je suis Maître Bonchamp, notaire de la famille. Un mariage, c'est aussi un contrat… même quand on n'en signe pas !", stage:"1967 · Le mariage", era:"mariage", year:"20 juin 1967", title:"Un mariage… et un futur cabinet",
		story:"Paul, fils d'agriculteurs, est arrivé à Lille en 1959 avec 2 000 F en poche. Aide-comptable dans le textile, il prépare ses diplômes d'expert-comptable et compte ouvrir son cabinet. Il épouse Jeannette Poirier.",
		ask:"Faut-il un contrat de mariage ?", goal:"Un régime adapté à un futur chef d'entreprise, qui protège aussi le couple.",
		setup:() => { W.setPlot("plA", COL.zP, "Biens de Paul"); W.setPlot("plB", COL.zJ, "Biens de Jeannette"); },
		cards:["legal", "sep", "univ"],
		out: k => ({ ...({
			legal:{ stars:2, txt:"Équilibré : ce que le couple construira sera partagé. Mais les dettes du futur cabinet pourront atteindre les biens communs." },
			sep:{ stars:3, txt:"Bon réflexe pour un futur chef d'entreprise : les créanciers du cabinet ne pourront pas saisir les biens de Jeannette. À compléter plus tard par une donation entre époux, pour la protéger." },
			univ:{ stars:1, txt:"Tout serait commun, y compris ce que chacun possède déjà, et tout serait exposé aux risques du futur cabinet. Un choix rare à 27 ans." }
		})[k], fx:() => regime(k, ["Biens de Paul", COL.zP], ["Biens de Jeannette", COL.zJ]) }),
		best:"pour un futur chef d'entreprise, la séparation de biens met le patrimoine du conjoint à l'abri des dettes professionnelles.",
		real:"Dans le vrai dossier, Paul et Jeannette n'ont rien signé : la suite se joue avec le régime légal. Bonne nouvelle, on peut changer de régime en cours de mariage, par acte notarié.",
		after:() => regime("legal", ["Biens de Paul", COL.zP], ["Biens de Jeannette", COL.zJ]),
		courses:["famille"], next:"maison", nextLabel:"1972 · La maison →" };

	EV.maison = { key:"maison", say:"Une maison à crédit, deux jeunes parents… C'est le moment de penser à l'imprévu.", stage:"1972 · La maison", era:"maison", year:"Juin 1972", title:"Une maison, et une inquiétude",
		story:"Le cabinet, créé en 1968, se développe vite. Jean-Baptiste a 4 ans. Paul et Jeannette s'endettent pour acheter une grande maison en proche banlieue : elle est <b>commune</b>. Chez le notaire, Paul s'inquiète : « Et s'il arrivait quelque chose à l'un de nous ? »",
		ask:"Comment protéger celui qui resterait ?", goal:"Protéger le conjoint survivant. Ce choix comptera plus tard…",
		cards:["dde", "test", "av", "rien"],
		out: k => { S.dde = k; return {
			dde:{ stars:3, txt:"Le grand classique, réciproque et révocable : au premier décès, le survivant pourra choisir entre plusieurs options, plus larges que celles prévues par la loi.", fx:() => { W.fly("paul", "jeannette", 1, "doc"); later(500, () => W.fly("jeannette", "paul", 1, "doc")); } },
			test:{ stars:2, txt:"Ça fonctionne, mais il faut que chacun rédige le sien, et la donation entre époux offre plus d'options au survivant.", fx:() => W.fly("paul", "jeannette", 1, "doc") },
			av:{ stars:2, txt:"Un capital pour le survivant, versé hors succession : utile, mais ça ne règle pas le sort de la maison ni des autres biens.", fx:() => { W.pose("av", 4, -2.4); later(500, () => W.fly("paul", "av", 3)); } },
			rien:{ stars:1, txt:"La loi protège un peu le conjoint, mais avec moins de choix. Et un accident n'arrive pas qu'aux autres…", fx:() => W.shake("jeannette") }
		}[k]; },
		best:"la donation entre époux (dite « au dernier vivant ») : simple, réciproque, et elle élargit les options du survivant.",
		next:"immeuble", nextLabel:"1985 · L'immeuble →" };

	EV.immeuble = { key:"immeuble", say:"Acheter les murs de son cabinet : excellente idée. Reste à savoir qui en sera propriétaire.", stage:"1985 · L'immeuble", era:"immeuble", year:"1985", title:"Des murs pour le cabinet",
		story:"Les jumelles Élise et Louise sont nées en 1973. Le cabinet poursuit sa croissance. Paul, jusque-là locataire, veut acheter un immeuble pour y installer son activité.",
		ask:"Comment acheter les locaux professionnels ?", goal:"Loger le cabinet sans tout mélanger entre vie privée et vie professionnelle.",
		cards:["commun", "sci", "loc"],
		out: k => ({
			commun:{ stars:2, txt:"Acheté pendant le mariage, l'immeuble est <b>commun</b>. En cas de divorce, il entre dans le partage : Paul pourra demander à le garder, en indemnisant Jeannette.", fx:() => W.moveTo("immeuble", 2.8, -.6) },
			sci:{ stars:3, txt:"Une société civile immobilière achète l'immeuble et le loue au cabinet : les loyers nourrissent le patrimoine privé, et l'on pourra transmettre l'immeuble par parts, petit à petit.", fx:() => { W.rename("immeuble", "Immeuble · SCI familiale"); W.moveTo("immeuble", 0, -6); later(700, () => W.fly("cabinet", "immeuble", 3)); } },
			loc:{ stars:1, txt:"Le cabinet continue de payer un loyer à quelqu'un d'autre : aucun patrimoine ne se construit.", fx:() => { W.rename("immeuble", "Immeuble d'un bailleur"); later(300, () => W.fly("cabinet", "immeuble", 4)); } }
		}[k]),
		best:"une SCI familiale qui loue au cabinet : on sépare le professionnel du privé, et la transmission se fait par parts.",
		real:"Dans le vrai dossier, M. et Mme Deslaurier achètent l'immeuble ensemble : il est commun.",
		after:() => { W.rename("immeuble", "Immeuble (1985)"); W.moveTo("immeuble", 2.8, -.6); },
		next:"deces", nextLabel:"1991 · L'accident →" };

	EV.deces = { key:"deces", say:"Quelle tristesse… Je dois pourtant ouvrir la succession. Et d'abord, liquider la communauté.", stage:"1991 · La succession", era:"deces", year:"2 juillet 1991", title:"Le drame",
		story:"Paul et Jeannette ont un grave accident de voiture. Jeannette décède deux jours plus tard, à 45 ans. Le notaire de famille, Maître Bonchamp, convoque Paul et les enfants, tous majeurs.",
		ask:"Comment régler la succession ?",
		pre:() => `<b>D'abord, le notaire liquide la communauté :</b> Paul reprend sa moitié des biens communs ; seule l'autre moitié forme la succession de Jeannette.<br>${{
			dde:"✓ <b>Grâce à ta donation entre époux de 1972</b>, Paul peut choisir : tout en usufruit, ¼ en pleine propriété et ¾ en usufruit, ou ¼ en pleine propriété (la quotité disponible).",
			test:"Le testament de Jeannette lui laisse la quotité disponible : ¼ en pleine propriété.",
			av:"L'assurance-vie lui verse un capital ; pour le reste, il n'a que les options de la loi : l'usufruit de tout, ou ¼ en pleine propriété.",
			rien:"⚠ Sans rien de prévu en 1972, Paul n'a que les options de la loi : l'usufruit de tout, ou ¼ en pleine propriété."
		}[S.dde || "rien"]}`,
		goal:"Paul ne veut pas rester en indivision avec ses enfants.",
		cards:["partage", "indiv", "vendre"],
		setup:() => {
			later(900, () => W.mourn("jeannette", true));
			later(1700, () => { W.popOut("lCom"); W.halves(true); W.moveTo("zCL", -1.2, 1.6, .3); W.moveTo("cabinet", -2.6, .4, .5); W.moveTo("maison", -2.2, 2.8, .5); W.moveTo("zCR", 1.2, 1.6, .3); W.moveTo("immeuble", 2.6, .2, .5); W.moveTo("epargne", 2.4, 2.8, .5); W.moveTo("commode", 5, 2.6, .8); });
		},
		out: k => ({
			partage:{ stars:3, fam:457000, txt:"Paul garde la maison et une partie des titres ; les enfants reçoivent le reste du portefeuille : 3 000 000 F, environ 457 000 € d'aujourd'hui. Chacun est libre.", fx:() => ["jb", "elise", "louise"].forEach((c, i) => later(i*250, () => W.fly("zCR", c, 3))) },
			indiv:{ stars:1, fam:457000, conf:1, say:"« Nul n'est tenu de demeurer dans l'indivision » : article 815 du Code civil. Les disputes arrivent vite…", txt:"Tout le monde possède tout : chaque décision demande l'accord de chacun. Les disputes guettent, et « nul n'est tenu de rester dans l'indivision » : un enfant pourra exiger le partage.", fx:() => { W.zap("jb", "louise"); } },
			vendre:{ stars:1, fam:411000, txt:"On vend aussi la maison familiale, avec environ 10 % de frais, alors que Paul voulait y rester.", fx:() => { W.popOut("maison"); ["jb", "elise", "louise"].forEach((c, i) => later(i*250, () => W.fly("zCR", c, 2))); } }
		}[k]),
		best:"un partage amiable chez le notaire, qui respecte le souhait de Paul de garder la maison.",
		courses:["liquid", "succ"], next:"placer", nextLabel:"Conseiller les enfants →" };

	const MULT = { livret:1.3, avp:1.6, pea:1.9, immo:1.7, action:.3, compte:1 };
	const OBJ = { livret:"livret", avp:"av", pea:"pea", immo:"loc", action:"action", compte:"compte" };
	EV.placer = { key:"placer", say:"Trois jeunes gens et un beau capital : prudence et diversification, je vous prie.", stage:"1991 · Placer l'héritage", era:"placer", year:"1991", title:"Placer l'héritage",
		story:"Jean-Baptiste (23 ans), Élise et Louise (18 ans) ont reçu environ 457 000 € à eux trois. Ils te confient leur épargne.",
		ask:"Comment réinvestir les fonds de la succession ?", goal:"Choisis 3 placements (un tiers chacun), puis on avance de 10 ans.", pick:3,
		cards:["livret", "avp", "pea", "immo", "action", "compte"],
		out: ks => {
			const part = 457000/3, res = ks.map(k => [k, part*MULT[k]]), tot = res.reduce((a, [, v]) => a + v, 0);
			const stars = ks.includes("action") ? 1 : ks.includes("compte") ? 2 : 3;
			return { stars, fam:Math.round(tot - 457000), wait:3400, say:ks.includes("action") ? "Tout sur une seule action ? J'en ai vu, des fortunes s'envoler…" : null,
				txt:`<div class="gp-clock" data-clock>1991</div><ul class="gp-sim">${res.map(([k, v]) => `<li><span>${CARDS[k][0]} ${CARDS[k][1]} · ×${String(MULT[k]).replace(".", ",")}</span><b>${euro(v)}</b></li>`).join("")}<li><span><b>Total en 2001</b></span><b>${euro(tot)}</b></li></ul>
					${ks.includes("action") ? "La valeur à la mode s'est effondrée (souvenez-vous de la bulle internet de 2000) : ne jamais tout miser sur une seule entreprise. " : ""}${ks.includes("compte") ? "L'argent qui dort sur un compte courant ne rapporte rien, et l'inflation le grignote. " : ""}<small>Rendements illustratifs : les performances passées ne préjugent pas des performances futures.</small>`,
				fx:() => {
					Object.values(OBJ).forEach(id => { if(!ks.some(k => OBJ[k] === id)) W.popOut(id); });
					ks.forEach((k, i) => later(i*300, () => W.fly("heritage", OBJ[k], 3)));
					later(1100, () => { W.popOut("heritage"); ks.forEach(k => W.grow(OBJ[k], Math.max(.35, Math.pow(MULT[k], .9)), 2200)); });
					const t0 = performance.now();
					const tick = () => { if(closed) return; const c = card.querySelector("[data-clock]"); const y = Math.min(2001, 1991 + Math.floor((performance.now() - t0 - 1100)/220)); if(c) c.textContent = Math.max(1991, y); if(y < 2001) requestAnimationFrame(tick); };
					requestAnimationFrame(tick);
				} };
		},
		best:"diversifier entre épargne disponible, assurance-vie, actions et immobilier, selon l'âge et les projets de chacun.",
		courses:["place"], next:"contrats", nextLabel:"1997 · Le mariage d'Élise →" };

	EV.contrats = { key:"contrats", say:"Le jeune Florent veut créer son entreprise ? Alors parlons contrat de mariage !", stage:"1997 · Contrats de mariage", era:"contrats", year:"1997", title:"Élise se marie",
		story:"Élise, 24 ans, épouse Florent Perbeau, jeune ingénieur qui rêve de créer son entreprise. Paul insiste pour qu'ils passent chez le notaire avant le mariage.",
		ask:"Quels sont les types de contrats de mariage possibles ?", goal:"Protéger l'héritage d'Élise. Et si l'entreprise de Florent faisait faillite ?",
		setup:() => { W.setPlot("plA", "#eaa6bd", "Biens d'Élise"); W.setPlot("plB", "#8fb3e0", "Biens de Florent"); },
		cards:["legal", "sep", "part", "univ"],
		out: k => {
			const res = {
				sep:{ stars:3, txt:"<b>Simulation :</b> l'entreprise de Florent fait faillite. Seuls les biens de Florent répondent de ses dettes : l'héritage d'Élise est à l'abri.", from:"plB", n:2 },
				part:{ stars:3, txt:"<b>Simulation :</b> l'entreprise de Florent fait faillite. Pendant le mariage, les patrimoines sont séparés : l'héritage d'Élise est à l'abri. Le partage de l'enrichissement n'aura lieu qu'à la fin du régime.", from:"plB", n:2 },
				legal:{ stars:2, fam:-40000, txt:"<b>Simulation :</b> l'entreprise de Florent fait faillite. Les biens communs du couple (environ 40 000 € d'épargne) peuvent être saisis ; l'héritage d'Élise, qui lui est propre, reste protégé.", from:"plC", n:3 },
				univ:{ stars:1, fam:-190000, txt:"<b>Simulation :</b> l'entreprise de Florent fait faillite. Tout est commun, héritage d'Élise compris : les créanciers peuvent tout saisir, environ 190 000 €.", from:"plC", n:6 }
			}[k];
			return { ...res, wait:2600, fx:() => {
				regime(k, ["Biens d'Élise", "#eaa6bd"], ["Biens de Florent", "#8fb3e0"]);
				later(1000, () => { W.pose("creancier", 0, 6.2); later(600, () => { W.moveTo("creancier", 0, 4.2, .4); later(700, () => W.fly(res.from, "creancier", res.n)); }); });
			} };
		},
		best:"la séparation de biens (ou la participation aux acquêts) quand un conjoint prend des risques professionnels.",
		real:"Dans le vrai dossier, Élise et Florent signent une séparation de biens, comme le souhaitait Paul. La faillite n'était qu'une simulation !",
		next:"remariage", nextLabel:"Paul se remarie →" };

	EV.remariage = { key:"remariage", say:"Un remariage, Paul ? Félicitations ! Pensons aux enfants de chacun.", stage:"Le remariage", era:"remariage", year:"Plus tard", title:"Une famille recomposée",
		story:"Las de la solitude, Paul veut épouser Paulette Mercier, veuve, du même âge. Elle estime son patrimoine à 2 000 000 € et a des enfants de ses deux mariages.",
		ask:"Quels contrats possibles, avec leurs avantages et inconvénients ?", goal:"Que chacun puisse transmettre à ses propres enfants.",
		setup:() => { W.setPlot("plA", COL.zP, "Patrimoine de Paul"); W.setPlot("plB", "#b99ad6", "Patrimoine de Paulette (2 M€)"); },
		cards:["sep", "legal", "univ"],
		out: k => ({
			sep:{ stars:3, txt:"Chacun garde son patrimoine, qui ira à ses propres enfants. Avec deux familles, c'est le choix le plus clair.", fx:() => { W.O.fence.g.position.set(0, 0, 1.4); W.popIn("fence"); later(600, () => ["jb", "elise", "louise", "pk1", "pk2"].forEach((id, i) => W.hop(id, i*100))); } },
			legal:{ stars:2, txt:"Leurs biens actuels restent propres, mais tout ce qu'ils achèteront ensemble deviendra commun : le partage entre deux familles sera plus délicat.", fx:() => { W.setPlot("plC", COL.zC, "Futurs achats communs"); W.O.plC.s = .7; W.pose("plC", 0, 4); } },
			univ:{ stars:1, conf:2, txt:"Avec une attribution de tout au survivant, les enfants du premier qui décède n'héritent de rien… jusqu'au second décès. Les enfants d'un autre lit peuvent agir en justice (action en retranchement) : conflits assurés.", fx:() => { W.moveTo("plA", -2, 1.4, .2); W.moveTo("plB", 2, 1.4, .2); later(700, () => W.zap("louise", "pk1")); later(1300, () => W.zap("jb", "pk2")); } }
		}[k]),
		best:"la séparation de biens dans une famille recomposée, complétée par des outils pour protéger le conjoint.",
		next:"paulette", nextLabel:"Protéger Paulette →" };

	EV.paulette = { key:"paulette", say:"Paul tient à protéger Paulette. Attention à la réserve de ses enfants…", stage:"Le remariage", era:"remariage", year:"Plus tard", title:"Et si Paul partait le premier ?",
		story:"Paul et Paulette se marient sous le régime de la séparation de biens. Paul veut maintenant que Paulette ne se retrouve pas démunie s'il décède avant elle.",
		ask:"Comment protéger Paulette ?", goal:"Protéger Paulette sans léser les trois enfants de Paul.",
		setup:() => { W.setPlot("plA", COL.zP, "Patrimoine de Paul"); W.setPlot("plB", "#b99ad6", "Patrimoine de Paulette (2 M€)"); W.O.fence.g.position.set(0, 0, 1.4); W.popIn("fence"); },
		cards:["dde", "av", "testP", "rien"],
		out: k => ({
			dde:{ stars:3, txt:"La donation entre époux donne à Paulette des droits plus larges, dans la limite de ce que la loi réserve aux enfants de Paul.", fx:() => W.fly("paul", "paulette", 1, "doc") },
			av:{ stars:3, txt:"Un capital pour Paulette, versé hors succession : les enfants de Paul gardent leur part de l'héritage.", fx:() => { W.pose("av", 2, -1.8); later(500, () => W.fly("paul", "av", 3)); } },
			testP:{ stars:1, conf:1, txt:"Avec trois enfants, Paul ne peut léguer librement que ¼ de son patrimoine (le reste est leur réserve héréditaire) : ils pourront faire réduire le testament.", fx:() => { W.pose("cross", 2, -.6); later(1600, () => W.popOut("cross")); W.zap("elise", "paulette"); } },
			rien:{ stars:1, txt:"Comme il y a des enfants qui ne sont pas les siens, Paulette n'aurait droit qu'à ¼ en pleine propriété, et à rien sur la maison si elle n'y a pas de droits propres.", fx:() => W.shake("paulette") }
		}[k]),
		best:"une donation entre époux ou une assurance-vie au profit de Paulette, en respectant la réserve des enfants.",
		courses:["succ"], next:"concubin", nextLabel:"Jean-Baptiste et Sarah →" };

	EV.concubin = { key:"concubin", say:"Ni mariés, ni pacsés… Beaucoup de couples ignorent ce que cela implique.", stage:"Le concubinage", era:"concubin", year:"Aujourd'hui", title:"Ni marié, ni pacsé",
		story:"Jean-Baptiste vit avec Sarah Dourdon, rencontrée pendant ses études à Paris. Ils n'ont pas voulu se pacser. Il n'a pas d'enfant.",
		ask:"Que se passerait-il en cas de décès ?", goal:"Simulation : Jean-Baptiste laisse 300 000 €. Que Sarah en reçoive le plus possible.",
		setup:() => { W.O.heart.g.position.set(-1.4, 0, 2); later(800, () => W.popIn("heart")); },
		cards:["rien", "test", "pacs", "av"],
		out: k => {
			const r = {
				rien:{ stars:1, sarah:0, fisc:0, say:"Pour la loi, Sarah est étrangère à la succession. Cruel, mais c'est ainsi.", txt:"Sarah ne reçoit <b>rien</b> : pour la loi, un concubin n'est pas un héritier. Tout va au père et aux sœurs de Jean-Baptiste." },
				test:{ stars:1, sarah:120956, fisc:179044, txt:"Sarah hérite grâce au testament, mais comme concubine elle paie <b>60 %</b> de droits, après un abattement de seulement 1 594 €." },
				av:{ stars:2, sarah:270500, fisc:29500, txt:"Pour des versements faits avant 70 ans, Sarah reçoit <b>152 500 € sans impôt</b>, puis 20 % au-delà. Très efficace, même sans être pacsés." },
				pacs:{ stars:3, sarah:300000, fisc:0, txt:"Le partenaire de PACS est <b>exonéré</b> de droits. Avec un testament (sans enfant, Jean-Baptiste n'a pas d'héritier réservataire), Sarah reçoit tout." }
			}[k];
			return { ...r, fam:r.sarah, wait:2400, fx:() => {
				W.popOut("heart"); W.mourn("jb", true);
				later(500, () => { if(r.sarah) W.fly("appart", "sarah", Math.max(1, Math.round(r.sarah/50000))); else { W.mourn("sarah", true); W.shake("sarah"); } });
				if(r.fisc) later(900, () => W.fly("appart", "fisc", Math.max(1, Math.round(r.fisc/30000))));
			} };
		},
		best:"se pacser et rédiger un testament, ou souscrire une assurance-vie au profit de Sarah.",
		real:"Ce n'était qu'une simulation : Jean-Baptiste va très bien !",
		after:() => { W.mourn("jb", false); W.mourn("sarah", false); W.hop("jb"); },
		courses:["fisca"], next:"transmettre", nextLabel:"Préparer la transmission →" };

	EV.transmettre = { key:"transmettre", say:"Paul, il est temps d'organiser votre succession. Mieux vaut tard que jamais !", stage:"La transmission", era:"transmettre", year:"Aujourd'hui", title:"Préparer la succession de Paul",
		story:"Paul a aujourd'hui 86 ans. À la mort de ses parents, il a hérité du corps de ferme (250 000 €), qu'il loue, et de 100 000 € d'actions gardées en souvenir. Avec la maison et ses titres, son patrimoine atteint environ 650 000 €.",
		ask:"Comment préparer la succession de M. Deslaurier ?", goal:"Joue 2 cartes : transmettre à ses enfants, payer moins de droits, éviter les disputes. Sans rien faire : environ 65 000 € de droits.", pick:2,
		cards:["dp", "np", "av", "testP", "legs", "rien"],
		out: ks => {
			let fisc = 65000, conf = ks.includes("dp") ? 0 : 1;
			const lines = [];
			const E = {
				dp:() => { fisc -= 5000; lines.push("👨‍👧‍👦 La donation-partage fige la valeur des biens donnés : plus de dispute possible sur ce que vaut la ferme."); },
				np:() => { fisc -= 8000; lines.push("🗝️ Les droits ne portent que sur la nue-propriété ; Paul garde les loyers, et au décès les enfants deviennent pleins propriétaires sans rien payer de plus."); },
				av:() => { fisc -= 6000; lines.push("🛡️ Après 70 ans, 30 500 € de versements sont exonérés pour l'ensemble des bénéficiaires, et tous les gains le sont aussi."); },
				testP:() => { conf += 1; lines.push("📜 Paul ne peut léguer librement que ¼ : les enfants feront réduire le testament."); },
				legs:() => { fisc += 150000; conf += 1; lines.push("🏚️ Les enfants de Paulette ne sont pas ceux de Paul : ils paieraient 60 % de droits sur la ferme, et le legs empiète sur la réserve des enfants de Paul."); },
				rien:() => lines.push("🤷 Rien de prévu : les droits et les risques de dispute restent entiers.")
			};
			ks.forEach(k => E[k]());
			if(conf && !ks.includes("dp")) lines.push("⚡ Sans donation-partage, les enfants se disputent sur la valeur de la ferme.");
			const bad = ks.some(k => k === "testP" || k === "legs"), good = ks.filter(k => ["dp", "np", "av"].includes(k)).length;
			return { stars:bad ? 1 : good === 2 ? 3 : 2, fam:650000 - fisc, fisc, conf, wait:2200, say:bad ? null : "Bien joué. Mais retenez la leçon : le fisc rappelle les donations des 15 dernières années. Anticipez !",
				txt:`${lines.map(l => `${l}<br>`).join("")}<br><b>Le piège :</b> à 86 ans, une donation est « rappelée » par le fisc si Paul décède dans les 15 ans. Le vrai conseil, c'était d'anticiper bien plus tôt !`,
				fx:() => {
					["jb", "elise", "louise"].forEach((c, i) => later(i*250, () => W.fly("paul", c, 3)));
					later(900, () => W.fly("paul", "fisc", Math.max(1, Math.round(fisc/25000))));
					if(conf) later(1500, () => W.zap("jb", "elise"));
					if(ks.includes("legs")) later(400, () => W.fly("ferme", "pk1", 2));
				} };
		},
		best:"combiner donation-partage, donation de la nue-propriété et assurance-vie… et commencer le plus tôt possible.",
		real:"Pour Paulette, même logique : ses enfants, des deux mariages, sont ses héritiers réservataires. Le conseiller bâtit deux stratégies en parallèle, avec le notaire.",
		courses:["succ"], next:"end", nextLabel:"Voir mon bilan →" };


	/* ---------- les coups du sort : 3 tirés au hasard par partie, un par période ---------- */
	const CS = {
		heritage:{ key:"heritage", cs:1, era:"immeuble", year:"1987", title:"Héritage surprise", say:"Coup du sort ! Une vieille tante pense à Jeannette…",
			story:"Une tante de Jeannette décède et lui laisse l'équivalent de 30 000 €. Jeannette se demande quoi en faire.",
			ask:"Où mettre cet héritage ?", goal:"Garder la trace de ce qui appartient à Jeannette.",
			setup:() => { W.rename("heritage", "Héritage de Jeannette"); W.pose("heritage", 5.6, 5.2); },
			cards:["hsep", "hcom", "hach"],
			out: k => ({
				hsep:{ stars:3, txt:"Placé à part, avec la preuve de son origine, l'héritage reste <b>propre</b> à Jeannette : il lui reviendrait en cas de divorce, et ira à sa succession.", fx:() => W.moveTo("heritage", 7.2, 2.6) },
				hcom:{ stars:1, txt:"Mélangé au compte joint, l'argent devient impossible à distinguer : faute de preuve, il sera présumé <b>commun</b>.", fx:() => W.moveTo("heritage", .6, 3.4) },
				hach:{ stars:2, txt:"Possible : la communauté devra une <b>récompense</b> à Jeannette, c'est-à-dire lui rendre cette somme au moment du partage. Encore faut-il garder les factures !", fx:() => { W.fly("heritage", "maison", 4); later(900, () => W.popOut("heritage")); } }
			})[k],
			best:"garder l'héritage sur un compte au nom de Jeannette, avec la preuve de son origine." },
		arnaque:{ key:"arnaque", cs:1, era:"immeuble", year:"1988", title:"Le placement miracle", say:"Coup du sort ! Méfiance, un beau parleur vient d'entrer…",
			story:"Un démarcheur très sympathique propose à Paul un placement « garanti à 15 % par an, sans aucun risque ». Il faut signer vite, dit-il : l'offre expire ce soir.",
			ask:"Que fait Paul ?", goal:"Protéger l'épargne de la famille.",
			setup:() => { W.rename("creancier", "Démarcheur"); const p = W.O.paul.g.position; W.pose("creancier", p.x + 2.4, p.z + 1.6); },
			cards:["aref", "ainv", "ates"],
			out: k => ({
				aref:{ stars:3, txt:"« Garanti, sans risque, et vite » : les trois signes d'une arnaque. Un rendement élevé va toujours avec un risque élevé. On vérifie l'intermédiaire (registre de l'ORIAS, listes noires de l'AMF).", fx:() => { W.shake("creancier"); later(700, () => W.popOut("creancier")); } },
				ainv:{ stars:1, fam:-50000, say:"Envolés, les 50 000 €… et le démarcheur avec.", txt:"L'argent a disparu avec le démarcheur. Un conseiller vérifie toujours qu'un intermédiaire est autorisé (ORIAS, AMF).", fx:() => { W.fly("paul", "creancier", 5); later(1300, () => { W.moveTo("creancier", 12, 9, 1.2, 1200); later(1300, () => W.popOut("creancier")); }); } },
				ates:{ stars:1, fam:-10000, txt:"Les escrocs versent parfois de faux intérêts au début, pour attirer plus d'argent. Ici, les 10 000 € ont disparu.", fx:() => { W.fly("paul", "creancier", 2); later(1000, () => { W.moveTo("creancier", 12, 9, 1.2, 1200); later(1300, () => W.popOut("creancier")); }); } }
			})[k],
			best:"refuser, et vérifier l'intermédiaire sur les listes de l'AMF et le registre de l'ORIAS." },
		chomage:{ key:"chomage", cs:1, era:"placer", year:"1995", title:"Un coup dur pour Louise", say:"Coup du sort ! Louise a besoin d'aide…",
			story:"Louise perd son emploi à Paris. Il lui faut environ 15 000 € pour tenir quelques mois, le temps de retrouver un poste.",
			ask:"Où trouver l'argent ?", goal:"Passer le cap sans abîmer son patrimoine.",
			setup:() => { W.pose("livret", -6.6, -1); W.shake("louise"); },
			cards:["cliv", "cact", "ccre"],
			out: k => ({
				cliv:{ stars:3, txt:"C'est exactement le rôle de l'<b>épargne de précaution</b> : quelques mois de dépenses, disponibles tout de suite, sans risque.", fx:() => W.fly("livret", "louise", 3) },
				cact:{ stars:2, fam:-5000, txt:"Possible, mais vendre au mauvais moment coûte cher : environ 5 000 € de moins-value.", fx:() => W.shake("louise") },
				ccre:{ stars:1, fam:-3000, txt:"Emprunter sans revenus, c'est risquer le surendettement, et payer des intérêts (environ 3 000 €).", fx:() => W.shake("louise") }
			})[k],
			best:"toujours garder une épargne de précaution disponible : c'est elle qui sert dans les coups durs." },
		loto:{ key:"loto", cs:1, era:"placer", year:"1994", title:"Le gros lot !", say:"Coup du sort ! Pour une fois, une bonne nouvelle…",
			story:"Louise gagne 100 000 € au loto ! Elle a 21 ans, est célibataire et vit à Paris.",
			ask:"Que faire de ce gain ?", goal:"Que ce coup de chance dure.",
			setup:() => { W.rename("compte", "Gain du loto · 100 000 €"); W.pose("compte", 3.4, 3); W.hop("louise"); },
			cards:["ldiv", "ltou", "lcry"],
			out: k => ({
				ldiv:{ stars:3, fam:100000, txt:"Les gains des jeux de hasard ne sont pas imposés en France. Bien répartis (précaution, assurance-vie, actions… et un petit plaisir), ils peuvent changer une vie.", fx:() => W.fly("compte", "louise", 5) },
				ltou:{ stars:1, txt:"Beaucoup de gagnants dépensent tout en quelques années. Un plaisir, oui ; tout, non.", fx:() => { W.fly("compte", "louise", 2); later(800, () => W.popOut("compte")); } },
				lcry:{ stars:1, fam:30000, txt:"Un actif très spéculatif : il peut faire ×10… ou perdre 70 %. Ici, il ne reste que 30 000 €. Jamais tout sur un seul placement !", fx:() => { W.grow("compte", .4, 1500); later(1500, () => W.fly("compte", "louise", 1)); } }
			})[k],
			best:"diversifier : une épargne de précaution, du long terme (assurance-vie, actions), et un petit plaisir." },
		krach:{ key:"krach", cs:1, era:"remariage", year:"2008", title:"Krach boursier", say:"Coup du sort ! Les marchés s'effondrent, Jean-Baptiste panique…",
			story:"Crise financière de 2008 : les actions de Jean-Baptiste perdent 40 % en quelques semaines. Il n'a pas besoin de cet argent avant longtemps, mais il t'appelle, paniqué.",
			ask:"Que lui conseiller ?", goal:"Ne pas transformer une baisse en perte.",
			setup:() => { W.pose("pea", -5.6, -1.2); later(300, () => W.grow("pea", .6, 900)); W.shake("jb"); },
			cards:["kven", "kgar", "kach"],
			out: k => ({
				kgar:{ stars:3, txt:"Vendre au plus bas, c'est figer la perte. Avec un horizon long, on patiente : les marchés ont fini par remonter.", fx:() => W.grow("pea", 1.15, 2000) },
				kach:{ stars:2, txt:"Investir un peu dans la baisse peut payer, à condition de ne pas toucher à l'épargne de précaution.", fx:() => { W.fly("jb", "pea", 2); W.grow("pea", 1.25, 2000); } },
				kven:{ stars:1, fam:-40000, txt:"En vendant au plus bas, Jean-Baptiste a figé une perte d'environ 40 000 €. Les marchés ont fini par remonter… sans lui.", fx:() => { W.fly("pea", "jb", 2); later(900, () => W.popOut("pea")); } }
			})[k],
			best:"avec un horizon long, ne pas vendre dans la panique ; et ne placer en actions que l'argent dont on n'a pas besoin." },
		naissance:{ key:"naissance", cs:1, era:"remariage", year:"Plus tard", title:"Une naissance", say:"Coup du sort ! Un heureux événement chez Élise…",
			story:"Élise et Florent ont une petite fille, Léa. Paul, grand-père comblé, veut l'aider dès maintenant.",
			ask:"Comment aider Léa ?", goal:"Transmettre à sa petite-fille sans droits.",
			setup:() => { W.pose("lea", -4, 4.2); W.hop("lea", 400); },
			cards:["nabt", "nlat", "nliv"],
			out: k => ({
				nabt:{ stars:3, fam:31865, txt:"Chaque grand-parent peut donner <b>31 865 €</b> à chaque petit-enfant sans droits, tous les 15 ans. Ses parents géreront la somme jusqu'à sa majorité.", fx:() => W.fly("paul", "lea", 4) },
				nlat:{ stars:1, txt:"Léa n'est pas l'héritière de Paul tant que ses parents sont là. Attendre, c'est se priver d'un abattement qui lui est réservé.", fx:() => W.shake("lea") },
				nliv:{ stars:2, fam:500, txt:"Un joli geste, mais l'abattement de 31 865 € reste inutilisé.", fx:() => W.fly("paul", "lea", 1) }
			})[k],
			best:"utiliser l'abattement de 31 865 € entre grand-parent et petit-enfant, renouvelable tous les 15 ans." }
	};
	// tirage : une carte par période, sans doublon (le démarcheur peut venir en 1988 ou plus tard)
	const POOLS = { A:[["heritage", "arnaque"], "deces", "1991 · L'accident →"], B:[["chomage", "loto"], "contrats", "1997 · Le mariage d'Élise →"], C:[["krach", "naissance", "arnaque"], "concubin", "Jean-Baptiste et Sarah →"] };
	let plan = {};
	function draw(){
		plan = {}; const used = new Set();
		for(const P of ["A", "B", "C"]){ const k = pick(POOLS[P][0].filter(x => !used.has(x))); used.add(k); plan[P] = k; }
	}
	function coup(P, key){
		const k = key || plan[P], E = { ...CS[k], stage:"🎲 Coup du sort", next:POOLS[P][1], nextLabel:POOLS[P][2] };
		if(k === "arnaque" && P === "C"){ E.era = "remariage"; E.year = "2009"; }
		// après le remariage : les parcelles de Paul et de Paulette, séparées par la clôture
		if(E.era === "remariage"){ const own = E.setup; E.setup = () => { W.setPlot("plA", COL.zP, "Patrimoine de Paul"); W.setPlot("plB", "#b99ad6", "Patrimoine de Paulette (2 M€)"); W.O.fence.g.position.set(0, 0, 1.4); W.popIn("fence"); own && own(); }; }
		deal(E);
	}
	EV.immeuble.next = "cs:A"; EV.placer.next = "cs:B"; EV.paulette.next = "cs:C";
	draw();

	/* ---------- intro et bilan ---------- */
	function intro(){
		stage("Dossier", "intro");
		later(700, () => say("Bienvenue dans mon étude ! Asseyez-vous, la famille Deslaurier a besoin de vos conseils."));
		show(`<div class="gp-k">Mini-jeu · ${formation.name}</div><h2 class="gp-h">Le Dossier Deslaurier</h2>
			<p class="gp-p">Tu es <b>conseiller en gestion de patrimoine</b>. Dans l'étude de Maître Bonchamp, la famille Deslaurier (fictive) te confie sa vie, de 1959 à aujourd'hui : mariage, cabinet, maison, accident, héritage, remariage…</p>
			<p class="gp-p">À chaque tournant, tu reçois une <b>main de cartes</b> : contrat de mariage, donation, testament, assurance-vie, SCI… Joue la bonne, et regarde les conséquences sur la maquette : l'argent va-t-il à la famille, au fisc, ou finit-il en dispute ?</p>
			<p class="gp-p">Attention : entre deux étapes, des <b>coups du sort</b> tirés au hasard (héritage surprise, krach, gros lot…) rendent chaque partie différente.</p>
			<ul class="gp-list"><li><span>💰</span>Ce qui revient à la famille</li><li><span>🏛</span>Ce qui part au fisc</li><li><span>⚡</span>Les conflits</li><li><span>★</span>La qualité de tes conseils</li></ul>
			<p class="gp-p"><small>D'après un cas pratique utilisé à l'ISEA en initiation à la gestion de patrimoine. Droit d'aujourd'hui, chiffres simplifiés.</small></p>
			<button class="gp-go" data-a="mariage">Distribuer les cartes</button>`);
	}
	function finale(){
		stage("Bilan patrimonial", "end");
		const st = Object.values(S.done).reduce((a, b) => a + b, 0), max = (Object.keys(EV).length + 3)*3;
		const [rank, mention] = st >= max*.87 ? ["Associé du cabinet", "Très bien"] : st >= max*.67 ? ["Conseiller confirmé", "Bien"] : ["Conseiller junior", "Assez bien"];
		later(600, () => say(st >= max*.87 ? "Je vous propose de devenir associé ! Votre place est au cabinet." : st >= max*.67 ? "Du bon travail. Encore un peu d'expérience, et vous serez associé." : "Un début prometteur… Rejouez, les cartes seront différentes !"));
		onEvent && onEvent("win", mention);
		play("win");
		if(S.done.naissance) later(300, () => W.pose("lea", -5.7, 3.4));
		later(900, () => ["paul", "paulette", "jb", "elise", "louise", "florent", "sarah", "pk1", "pk2", "lea"].forEach((id, i) => W.hop(id, i*110)));
		const order = ["famille", "liquid", "succ", "place", "fisca"].filter(k => S.learned.has(k));
		show(`<div class="gp-k">${formation.name} · bilan</div><h2 class="gp-h">Dossier bouclé !</h2>
			<p class="gp-p" style="text-align:center;font-size:16px">Tu es <b>${rank}</b><br><span style="font-size:22px;color:#b08a3e">${st} / ${max} ★</span></p>
			<ul class="gp-sim"><li><span>💰 Pour la famille</span><b>${euro(S.fam)}</b></li><li><span>🏛 Au fisc</span><b>${euro(S.fisc)}</b></li><li><span>⚡ Conflits</span><b>${S.conf}</b></li></ul>
			<p class="gp-p">Mariage, entreprise, immobilier, décès, placements, famille recomposée : presque chaque moment de la vie pose une question de patrimoine. C'est le métier de conseiller en gestion de patrimoine ou de banquier privé, que prépare le master, en alternance sur 2 ans. Tu as touché à :</p>
			<ul class="gp-list">${order.map(k => `<li><span>📚</span>${COURSES[k][0]}</li>`).join("")}</ul>
			${openLead ? `<button class="gp-go" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="gp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master Droit & Gestion du Patrimoine ↗</a>
			<button class="gp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gp-alt" data-a="replay">Rejouer : d'autres coups du sort t'attendent</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { end:finale };
	for(const k in EV) STEPS[k] = () => deal(EV[k]);
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k.startsWith("cs:")) return coup(k.slice(3));
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ draw(); Object.assign(S, { errors:0, learned:new Set(), dde:null, done:{} }); ["fam", "fisc", "conf", "stars"].forEach(m => meter(m, 0)); return intro(); }
	});
	function close(){ if(closed) return; closed = true; removeEventListener("resize", onResize); document.removeEventListener("keydown", onKey); W.dispose(); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".gp-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["1967 · Le mariage", STEPS.mariage], ["1972 · La maison", STEPS.maison], ["1985 · L'immeuble", STEPS.immeuble], ["1991 · La succession", STEPS.deces], ["1991 · Placer l'héritage", STEPS.placer], ["1997 · Le mariage d'Élise", STEPS.contrats], ["Le remariage", STEPS.remariage], ["Protéger Paulette", STEPS.paulette], ["Le concubinage", STEPS.concubin], ["La transmission", STEPS.transmettre], ["Bilan patrimonial", finale],
		["🎲 Héritage surprise", () => coup("A", "heritage")], ["🎲 Le placement miracle", () => coup("A", "arnaque")], ["🎲 Le chômage de Louise", () => coup("B", "chomage")], ["🎲 Le gros lot", () => coup("B", "loto")], ["🎲 Krach boursier", () => coup("C", "krach")], ["🎲 Une naissance", () => coup("C", "naissance")]]);
	if(window.campus) window.campus.game = { S, card, W, EV, coup, ...STEPS };
}
