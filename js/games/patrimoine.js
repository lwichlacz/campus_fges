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
const TIMELINE = [["1959", "1959", ["intro"]], ["1967", "1967", ["mariage"]], ["1968-1985", "1968", ["biens"]], ["1991", "1991", ["deces", "placer"]], ["1997", "1997", ["contrats"]], ["Remariage", "Remar.", ["remariage"]], ["Aujourd'hui", "Auj.", ["concubin", "transmettre", "end"]]];          // en dessous : maquette en haut, dossier en bas

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
`;

/* ================= la maquette 3D ================= */
const COL = { paul:"#2f5d9e", jeannette:"#c2547a", jb:"#3c8d6e", elise:"#d07a3a", louise:"#c9a227", florent:"#4a7f9e", paulette:"#7a3e8f", pk:"#a77cc4", sarah:"#b8476b",
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
		sp.renderOrder = 10; sp.userData.o = o; drawLabel(sp, text, o); return sp;
	}
	const relabel = (sp, text, o) => drawLabel(sp, text, { ...sp.userData.o, ...(o || {}) });

	/* --- les objets du dossier --- */
	const O = {};                 // id → { g (position), inner (rebond, secousse), s (échelle), label }
	function add(id, inner, text, o = {}){
		const g = new THREE.Group(), wrap = new THREE.Group(); wrap.add(inner); g.add(wrap);
		g.visible = false; g.scale.setScalar(.001); scene.add(g);
		const top = new THREE.Box3().setFromObject(inner).max.y;
		const rec = O[id] = { id, g, inner:wrap, s:o.s || 1, top };
		if(text){ rec.label = label(text, o.lab); rec.label.position.y = top + (o.dy ?? .45); g.add(rec.label); }
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
	const PEOPLE = [["paul", "Paul"], ["jeannette", "Jeannette"], ["jb", "Jean-Baptiste", 1], ["elise", "Élise", 1], ["louise", "Louise", 1], ["florent", "Florent"], ["paulette", "Paulette"], ["sarah", "Sarah"], ["pk1", "Enfants de Paulette", 1], ["pk2", "", 1]];
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
		mariage: { cam:[0, 8, 13, 0, .8, 0], at:{ paul:[-.8, 1], jeannette:[.8, 1], apt:[-3, -2], f2000:[-2.5, 1.6] } },
		biens:   { cam:[0, 21, 17, 0, 0, 1.6], zones:1, at:{ paul:[-1.6, -4.6], jeannette:[1.6, -4.6], jb:[-.8, -3.6], elise:[0, -3.4], louise:[.8, -3.6],
			f2000:[-7.6, 6.4], cabinet:[-4.6, 7], maison:[-1.5, 7.4], immeuble:[1.6, 7.4], epargne:[4.5, 7], commode:[7.4, 6.4] } },
		deces:   { cam:[0, 20, 17, 0, 0, 1.6], zones:1, at:{ paul:[-7.2, -2.4], jeannette:[7.2, -2.4], jb:[-1.5, 6.6], elise:[0, 7], louise:[1.5, 6.6],
			f2000:[-7.2, 1.6], cabinet:[-1.6, .6], maison:[-1, 2.8], immeuble:[1.6, .4], epargne:[1.2, 2.8], commode:[7.2, 1.4] } },
		placer:  { cam:[0, 10, 15, 0, .6, .4], at:{ jb:[-1.6, 4], elise:[0, 4.5], louise:[1.6, 4], heritage:[0, .6], livret:[-5.4, -2], av:[-1.8, -3], pea:[1.8, -3], loc:[5.4, -2] } },
		contrats:{ cam:[0, 10, 14, 0, .4, 0], at:{ elise:[-3.2, 1.2], florent:[3.2, 1.2], plA:[-3.2, .8], plB:[3.2, .8] } },
		remariage:{ cam:[0, 11, 15, 0, .4, 0], at:{ paul:[-4, .4], paulette:[4, .4], jb:[-5.6, 2.4], elise:[-4, 2.9], louise:[-2.4, 2.4], pk1:[3.2, 2.6], pk2:[4.8, 2.6], plA:[-4, 1.4], plB:[4, 1.4] } },
		concubin:{ cam:[0, 8, 13, 0, .8, 0], at:{ jb:[-1, 1.4], sarah:[1, 1.4], appart:[0, -1.6] } },
		transmettre:{ cam:[0, 13, 17, 0, .4, .8], at:{ paul:[0, -2.4], paulette:[3.2, -2.4], ferme:[-4.6, -3.4], titres:[-2.2, -.6], jb:[-4.4, 3.6], elise:[-2.8, 4.2], louise:[-1.2, 4.4], pk1:[3.6, 4], pk2:[5.2, 3.6] } },
		end:     { cam:[0, 7, 26, 0, 2.5, -5], at:{ paul:[-.9, -1], paulette:[.9, -1], florent:[-6.6, 1.2], elise:[-5.1, 1.9], louise:[-3.5, 2.6], jb:[-1.8, 3.1], sarah:[-.2, 3.4], pk1:[2.8, 2.6], pk2:[4.5, 1.9] } }
	};
	function era(name){
		const E = ERAS[name]; for(const k in slots) delete slots[k];
		const at = { ...E.at, ...(E.zones ? ZONES : {}) };
		let n = 0;
		for(const id in O){
			const r = O[id]; mourn(id, false); r.inner.position.set(0, 0, 0); r.inner.scale.setScalar(1);
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
		if(cam){ cam.k = Math.min(1, cam.k + dt/1.3); const e = easeIO(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.update();
		renderer.render(scene, camera);
	}
	function resize(w, h){
		const ls = w < 600 ? 1.3 : 1;
		if(ls !== LS){ scene.traverse(o => { if(o.isSprite) o.scale.multiplyScalar(ls/LS); }); LS = ls; }
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px"; camera.aspect = w/h; camera.fov = w/h < .9 ? 50 : 36; camera.updateProjectionMatrix(); }
	camera.position.set(0, 22, 26); controls.target.set(0, 0, 0);
	raf = requestAnimationFrame(loop);
	return {
		O, era, popIn, popOut, moveTo, shake, hop, glow, fly, mourn, focus, slot, halves, setPlot, scaleTo, look, resize,
		set onZone(f){ onZone = f; canvas.style.cursor = f ? "pointer" : ""; },
		get onZone(){ return onZone; }, camera,
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); }); }
	};
}

/* ================= le jeu ================= */
export function openPatrimoine({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gp-css")){ const st = document.createElement("style"); st.id = "gp-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "gp"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le Dossier Deslaurier");
	root.innerHTML = `<canvas aria-hidden="true"></canvas><div class="gp-top"><span class="gp-chip gp-stage" id="gpStage">Dossier</span><span class="gp-chip" id="gpErr">⚖ 0 erreur</span><button class="gp-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gp-hint">↻ Fais tourner la maquette</div>
		<div class="gp-tl" aria-label="Frise des années"><div class="gp-tl-bar"><i></i></div><ol>${TIMELINE.map(([l, s]) => `<li><span class="l">${l}</span><span class="s">${s}</span></li>`).join("")}</ol></div><div class="gp-wrap"><div class="gp-card"></div></div>`;
	document.body.appendChild(root);
	const canvas = root.querySelector("canvas"), wrap = root.querySelector(".gp-wrap"), card = root.querySelector(".gp-card"), hint = root.querySelector(".gp-hint"), tl = root.querySelector(".gp-tl");
	const W = world(canvas);
	function layout(){
		const w = innerWidth, h = innerHeight;
		if(w >= MOBILE){ wrap.style.top = ""; hint.style.top = ""; tl.style.top = ""; tl.style.width = (w - 444 - 24) + "px"; W.resize(w - 444, h); }
		else { const top = Math.round(h*.44); wrap.style.top = top + "px"; tl.style.top = (top - 56) + "px"; tl.style.width = (w - 24) + "px"; hint.style.top = (top - 90) + "px"; W.resize(w, top + 16); }
	}
	let curEra = "intro";
	const onResize = () => { layout(); frise(curEra); };
	addEventListener("resize", onResize); layout();
	canvas.addEventListener("pointerdown", () => hint.hidden = true, { once:true });

	const S = { errors:0, learned:new Set() };
	let closed = false;
	const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
	function show(html){ card.onclick = null; W.onZone = null; W.focus(null); card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; wrap.scrollTo({ top:0, behavior:"smooth" }); }
	function stage(t, era){ root.querySelector("#gpStage").textContent = t; onEvent && onEvent("stage", t); W.era(era); frise(era); }
	// la frise avance avec le dossier
	function frise(era){
		curEra = era;
		const n = TIMELINE.findIndex(x => x[2].includes(era)), li = tl.querySelectorAll("li");
		li.forEach((x, i) => { x.classList.toggle("past", i < n); x.classList.toggle("now", i === n); });
		const bar = tl.querySelector(".gp-tl-bar").getBoundingClientRect();
		const dot = el => { const r = el.getBoundingClientRect(); return el === li[0] ? r.left + 7 : el === li[li.length - 1] ? r.right - 7 : r.left + r.width/2; };
		tl.querySelector(".gp-tl-bar i").style.width = Math.max(0, dot(li[n]) - bar.left) + "px";
	}
	function err(){ S.errors++; play("bad"); onEvent && onEvent("err"); root.querySelector("#gpErr").textContent = `⚖ ${S.errors} erreur${S.errors > 1 ? "s" : ""}`; }
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="gp-course"><span class="tag">📚 Au cœur du Master Droit & Gestion du Patrimoine</span><b>${n}</b><span>${t}</span></div>`; }
	const msg = (t, c, el = card) => { const m = el.querySelector(".gp-msg"); if(m){ m.className = "gp-msg " + (c || ""); m.textContent = t; } };
	const next = (a, label) => `<button class="gp-go" data-a="${a}">${label}</button>`;
	const scrollEnd = () => setTimeout(() => wrap.scrollTo({ top:wrap.scrollHeight, behavior:"smooth" }), 60);
	// question à choix unique : opts = [[valeur, texte, explication si mauvais]] ; hooks : ko(valeur) pour animer la maquette
	function qcm(el, opts, good, onOk, ko){
		el.innerHTML = `<div class="gp-opts">${shuffle(opts).map(([v, t]) => `<button class="gp-opt" data-q="${v}">${t}</button>`).join("")}</div><div class="gp-msg"></div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".gp-opt.ok")) return;
			if(b.dataset.q !== good){ err(); b.classList.add("ko"); msg(opts.find(x => x[0] === b.dataset.q)[2] || "Pas tout à fait.", "ko", el); ko && ko(b.dataset.q); return; }
			b.classList.add("ok"); play("good"); msg("", "", el); onOk(el.querySelector("[data-after]")); scrollEnd();
		}));
	}
	// classer des éléments un par un ; sur la maquette, l'objet sautille et l'on peut toucher sa zone
	function sorter(el, items, cats, onDone, hk = {}){
		let i = 0;
		const render = () => {
			const x = items[i];
			el.innerHTML = `<div class="gp-n">${i + 1} / ${items.length}</div><div class="gp-item"><b>${x.t}</b>${x.d ? `<small>${x.d}</small>` : ""}<div class="gp-acts">${cats.map(([k, l, c]) => `<button data-k="${k}">${c ? `<i style="background:${c}"></i>` : ""}${l}</button>`).join("")}</div></div><div class="gp-msg"></div><div data-after></div>`;
			hk.show && hk.show(x);
		};
		render();
		if(hk.zones) W.onZone = z => { const k = hk.zones[z]; const b = k && el.querySelector(`.gp-acts [data-k="${k}"]`); b && b.click(); };
		el.onclick = e => {
			if(e.target.closest("[data-nx]")){ i++; render(); return; }
			const b = e.target.closest(".gp-acts [data-k]"); if(!b) return;
			const x = items[i];
			if(b.dataset.k !== x.k){ err(); b.classList.add("ko"); msg(`${x.hint || "relis bien l'origine du bien."}`, "ko", el); hk.ko && hk.ko(x, b.dataset.k); return; }
			play("pop"); hk.ok && hk.ok(x);
			el.querySelector(".gp-acts").outerHTML = `<span class="gp-why">✓ ${cats.find(c => c[0] === x.k)[1]} · ${x.why}</span>`;
			msg("", "", el);
			if(i < items.length - 1) el.querySelector("[data-after]").innerHTML = `<button class="gp-go" data-nx>Suivant →</button>`;
			else { W.onZone = null; W.focus(null); play("chime"); el.onclick = null; onDone(el.querySelector("[data-after]")); }
			scrollEnd();
		};
	}

	/* ---------- intro ---------- */
	function intro(){
		stage("Dossier", "intro");
		show(`<div class="gp-k">Mini-jeu · ${formation.name}</div><h2 class="gp-h">Le Dossier Deslaurier</h2>
			<p class="gp-p">Tu es <b>conseiller en gestion de patrimoine</b> à Lille. La famille Deslaurier (fictive) te confie son histoire, de 1959 à aujourd'hui : un mariage, un cabinet, une maison, un décès, un remariage… Sur la maquette, la famille et ses biens prennent place au fil du dossier. À chaque tournant de la vie, une question de patrimoine se pose : à toi d'y répondre.</p>
			<p class="gp-p"><small>D'après un cas pratique utilisé à l'ISEA en initiation à la gestion de patrimoine. On raisonne avec le droit d'aujourd'hui.</small></p>
			<ul class="gp-list"><li><span>1967</span>Le mariage sans contrat</li><li><span>1968-1985</span>Le cabinet, la maison, l'immeuble : à qui sont-ils ?</li><li><span>1991</span>Un décès, une succession, un capital à placer</li><li><span>1997 →</span>Contrats de mariage, remariage, concubinage, transmission</li></ul>
			${next("mariage", "Ouvrir le dossier")}`);
	}

	/* ---------- 1967 · le mariage ---------- */
	function mariage(){
		stage("1967 · Le mariage", "mariage");
		show(`<span class="gp-year">1959 → 1967</span><h2 class="gp-h">Un mariage sans contrat</h2>
			<div class="gp-story">Paul, fils d'agriculteurs, arrive à Lille en 1959 avec 2 000 F en poche et devient aide-comptable dans le textile. Le 20 juin 1967, il épouse Jeannette Poirier. Ils ne font <b>pas de contrat de mariage</b>.<span class="gp-ask">Sous quel régime sont-ils mariés ?</span></div>
			<div data-q></div>`);
		setTimeout(() => { W.hop("paul"); W.hop("jeannette", 150); }, 700);
		qcm(card.querySelector("[data-q]"), [
			["legal", "La communauté réduite aux acquêts"],
			["sep", "La séparation de biens", "Non : la séparation de biens suppose un contrat signé chez le notaire."],
			["meubles", "La communauté de meubles et acquêts", "C'était le régime légal… avant la réforme de 1966. Pour un mariage de 1967, ce n'est plus le cas."]
		], "legal", a => {
			["zP", "zCL", "zCR", "lCom", "zJ"].forEach((id, i) => { const [x, z] = { zP:[-7.2, 1], zJ:[7.2, 1] }[id] || [0, 1.6]; W.O[id].g.position.set(x, 0, z); W.popIn(id, i*90); });
			W.look(0, 19, 17, 0, 0, 1.4);
			setTimeout(() => { const [x, z] = W.slot("zP"); W.moveTo("f2000", x, z); W.moveTo("paul", -1.3, -1.2, .6); W.moveTo("jeannette", 1.3, -1.2, .6); }, 600);
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Sans contrat, c'est le <b>régime légal</b> depuis 1966 : ce que chacun possédait avant le mariage, ou reçoit par donation ou héritage, lui reste <b>propre</b> ; ce qui est acquis pendant le mariage, salaires compris, est <b>commun</b>. Les 2 000 F de Paul vont donc dans sa zone « propre ».</p>
				<p class="gp-p"><b>Et si ce régime ne leur convient plus un jour ?</b></p><div data-q2></div>`;
			qcm(a.querySelector("[data-q2]"), [
				["chg", "Ils pourront changer de régime matrimonial devant notaire"],
				["fige", "Impossible : le régime est fixé pour toute la vie", "Si : la loi permet de changer de régime en cours de mariage, dans l'intérêt de la famille."],
				["div", "Il faudra divorcer puis se remarier", "Inutile ! Un acte notarié suffit."]
			], "chg", b => {
				b.innerHTML = `<p class="gp-p" style="margin-top:8px">Un acte chez le notaire suffit, dans l'intérêt de la famille (le juge n'intervient qu'en cas d'opposition, ou si un enfant mineur risque d'être lésé). Ne rien signer n'est donc pas forcément une erreur : c'est un choix, qu'il faut faire en connaissance de cause.</p>${course("famille")}${next("biens", "1968 · Le cabinet →")}`;
			});
		});
	}

	/* ---------- 1968-1985 · propres ou communs ---------- */
	function biens(){
		stage("1968-1985 · Les biens", "biens");
		show(`<span class="gp-year">1968 → 1985</span><h2 class="gp-h">À qui appartient quoi ?</h2>
			<div class="gp-story">1968 : Paul crée son <b>cabinet d'expertise comptable</b>. Naissent Jean-Baptiste (1968), puis les jumelles Élise et Louise (1973). En 1972, le couple s'endette pour acheter une <b>grande maison</b> ; en 1985, il achète un <b>immeuble</b> pour y installer le cabinet.<span class="gp-ask">Range chaque bien dans sa zone.</span></div>
			<p class="gp-p"><small>Touche le bouton, ou directement la zone sur la maquette.</small></p>
			<div data-s></div>`);
		sorter(card.querySelector("[data-s]"), shuffle([
			{ id:"f2000", t:"Les 2 000 F de 1959", d:"Donnés par son père, bien avant le mariage", k:"paul", why:"Paul les avait avant le mariage.", hint:"Cet argent existait avant le mariage." },
			{ id:"cabinet", t:"Le cabinet d'expertise comptable", d:"Créé par Paul en 1968", k:"com", why:"Créé pendant le mariage : sa valeur est commune. Le diplôme et le droit d'exercer, eux, restent à Paul.", hint:"Il a été créé pendant le mariage… même si seul Paul peut l'exercer." },
			{ id:"maison", t:"La maison de 1972", d:"Achetée à crédit pendant le mariage", k:"com", why:"Acquise pendant le mariage.", hint:"Regarde la date d'achat." },
			{ id:"immeuble", t:"L'immeuble du cabinet", d:"Acheté en 1985 par M. et Mme Deslaurier", k:"com", why:"Acquis pendant le mariage, même s'il sert à l'activité de Paul.", hint:"Il sert au cabinet de Paul, mais quand et comment a-t-il été acheté ?" },
			{ id:"epargne", t:"L'épargne sur les salaires", d:"Économisée par Paul depuis 1967", k:"com", why:"Les gains et salaires sont communs.", hint:"Les revenus du travail pendant le mariage…" },
			{ id:"commode", t:"La commode de la grand-mère", d:"Héritée par Jeannette (exemple ajouté au cas)", k:"jea", why:"Reçue par héritage : elle reste propre à Jeannette.", hint:"Un héritage reste à celui qui le reçoit." }
		]), [["paul", "Propre à Paul", COL.zP], ["com", "Commun", COL.zC], ["jea", "Propre à Jeannette", COL.zJ]], a => {
			W.look(0, 16, 15, 0, 0, 1.4);
			a.innerHTML = `<p class="gp-p" style="margin-top:8px"><b>Imaginons qu'ils divorcent en 1990. Que devient le cabinet ?</b></p><div data-q></div>`;
			setTimeout(() => W.glow("cabinet"), 500);
			qcm(a.querySelector("[data-q]"), [
				["soulte", "Paul le garde, mais sa valeur entre dans le partage : il verse une compensation (une soulte) à Jeannette"],
				["paul", "Il reste à Paul sans rien devoir : c'est son diplôme", "Le diplôme est à Paul, mais le cabinet a une valeur, créée pendant le mariage : elle est commune."],
				["asso", "Jeannette devient associée du cabinet", "Elle n'est pas expert-comptable : elle ne peut pas exercer. Elle a droit à une part de la valeur, pas au métier."]
			], "soulte", b => {
				W.fly("paul", "jeannette", 4);
				b.innerHTML = `<p class="gp-p" style="margin-top:8px">Même logique pour l'immeuble : bien commun, partagé en valeur, que Paul peut demander à garder (attribution préférentielle) en indemnisant Jeannette. C'est pour cela qu'un conseiller interroge toujours un chef d'entreprise sur son régime matrimonial.</p>${next("deces", "1991 · L'accident →")}`;
			}, () => W.shake("cabinet"));
		}, {
			show: x => W.focus(x.id),
			zones: { zP:"paul", zCL:"com", zCR:"com", zJ:"jea" },
			ok: x => { const [px, pz] = W.slot({ paul:"zP", com:"zC", jea:"zJ" }[x.k]); W.moveTo(x.id, px, pz); W.focus(null); },
			ko: x => W.shake(x.id)
		});
	}

	/* ---------- 1991 · le décès de Jeannette ---------- */
	function deces(){
		stage("1991 · La succession", "deces");
		setTimeout(() => W.mourn("jeannette", true), 900);
		show(`<span class="gp-year">2 juillet 1991</span><h2 class="gp-h">Le drame</h2>
			<div class="gp-story">Paul et Jeannette ont un grave accident de voiture. Jeannette décède deux jours plus tard, à 45 ans. Les enfants sont majeurs. Le notaire de famille, Maître Bonchamp, convoque Paul et les enfants.<span class="gp-ask">Avant même de parler d'héritage, que fait le notaire ?</span></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [
			["liq", "Il liquide la communauté : Paul reprend la moitié des biens communs, et seule l'autre moitié revient à la succession de Jeannette"],
			["tout", "Il partage tout le patrimoine du couple entre Paul et les enfants", "Non : la moitié des biens communs appartient déjà à Paul. Ce n'est pas un héritage, c'est sa part."],
			["enf", "Tout va aux enfants, Paul garde seulement ses biens propres", "Non : Paul a droit à sa moitié de la communauté, puis à ses droits de conjoint survivant."]
		], "liq", a => {
			// la communauté se coupe en deux : une moitié rejoint Paul, l'autre forme la succession
			W.popOut("lCom"); W.halves(true);
			W.moveTo("zCL", -1.2, 1.6, .3); W.moveTo("cabinet", -2.6, .4, .5); W.moveTo("maison", -2.2, 2.8, .5);
			W.moveTo("zCR", 1.2, 1.6, .3); W.moveTo("immeuble", 2.6, .2, .5); W.moveTo("epargne", 2.4, 2.8, .5);
			W.moveTo("commode", 5, 2.6, .8);
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Sur la maquette, la zone commune se coupe en deux. La moitié de Paul est à lui ; la <b>succession</b> de Jeannette, c'est l'autre moitié, plus ses biens propres.</p>
				<p class="gp-p">En 1972, le couple avait signé une <b>donation entre époux</b>. Avec trois enfants communs, quelles options offre-t-elle à Paul sur la succession de Jeannette ? <b>Coche les trois bonnes.</b></p>
				<div class="gp-opts" data-m>${shuffle([
					["a", "Toute la succession en usufruit", 1], ["b", "¼ en pleine propriété et ¾ en usufruit", 1], ["c", "La quotité disponible (¼ avec trois enfants) en pleine propriété", 1],
					["d", "La moitié en pleine propriété", 0], ["e", "Toute la succession en pleine propriété", 0]
				]).map(([v, t, g]) => `<button class="gp-opt" data-m="${v}" data-g="${g}" aria-pressed="false">${t}</button>`).join("")}</div>
				<button class="gp-go" data-check>Valider mes trois choix</button><div class="gp-msg"></div><div data-after></div>`;
			a.querySelectorAll("button[data-m]").forEach(b => b.addEventListener("click", () => { if(a.querySelector("[data-check]").disabled) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); }));
			a.querySelector("[data-check]").addEventListener("click", ev => {
				const on = [...a.querySelectorAll('button[data-m][aria-pressed="true"]')];
				if(on.length !== 3 || on.some(b => b.dataset.g !== "1")){ err(); msg(on.length !== 3 ? "Il faut exactement trois options." : "Pas tout à fait : avec trois enfants, les enfants sont « réservataires » pour ¾ de la succession.", "ko", a); return; }
				ev.target.disabled = true; play("good"); msg("", "", a);
				a.querySelectorAll("button[data-m]").forEach(b => b.classList.add(b.dataset.g === "1" ? "ok" : "ko"));
				// partage : Paul garde la maison, les enfants reçoivent le portefeuille
				W.fly("zCR", "jb", 2); setTimeout(() => W.fly("zCR", "elise", 2), 250); setTimeout(() => W.fly("zCR", "louise", 2), 500);
				setTimeout(() => { W.hop("jb"); W.hop("elise", 120); W.hop("louise", 240); }, 1400);
				a.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Sans donation, Paul aurait eu le choix entre l'usufruit de tout et ¼ en pleine propriété. La donation élargit ses options. Ici, Paul ne veut pas rester en <b>indivision</b> avec ses enfants : on partage. Il garde la maison et une partie des titres ; les enfants reçoivent le reste du portefeuille, <b>3 000 000 F</b> à eux trois.</p>${course("liquid")}${course("succ")}${next("placer", "Conseiller les enfants →")}`;
				scrollEnd();
			});
		});
	}

	/* ---------- 1991 · réinvestir ---------- */
	function placer(){
		stage("1991 · Placer l'héritage", "placer");
		const goals = [
			{ id:"livret", g:"Garder une réserve disponible à tout moment, sans risque", p:"Livret d'épargne" },
			{ id:"av", g:"Faire fructifier sur 8 ans et plus, et pouvoir désigner qui recevra le capital", p:"Assurance-vie" },
			{ id:"pea", g:"Investir en actions d'entreprises européennes, avec une fiscalité douce après 5 ans", p:"Plan d'épargne en actions (PEA)" },
			{ id:"loc", g:"Percevoir des revenus réguliers, adossés à un bien concret", p:"Immobilier locatif" }
		];
		const left = shuffle(goals), right = shuffle(goals), done = new Set(); let sL = null, sR = null;
		show(`<span class="gp-year">1991</span><h2 class="gp-h">Placer l'héritage</h2>
			<div class="gp-story">Jean-Baptiste, Élise et Louise reçoivent un portefeuille de titres. Ils viennent te voir.<span class="gp-ask">Comment réinvestir les fonds de la succession ?</span></div>
			<p class="gp-p">Un conseiller commence toujours par connaître son client : <b>objectifs, horizon, goût du risque</b>. Ensuite, chaque objectif a son outil. Relie un objectif à son placement.</p>
			<div class="gp-cols"><div><h4>🎯 Objectif</h4>${left.map(x => `<button class="gp-pick" data-l="${x.id}">${x.g}</button>`).join("")}</div>
			<div><h4>💼 Placement</h4>${right.map(x => `<button class="gp-pick" data-r="${x.id}"><b>${x.p}</b></button>`).join("")}</div></div>
			<div class="gp-msg"></div><div data-after></div>`);
		const tryPair = () => {
			if(!sL || !sR) return;
			const L = card.querySelector(`[data-l="${sL}"]`), R = card.querySelector(`[data-r="${sR}"]`);
			L.setAttribute("aria-pressed", "false"); R.setAttribute("aria-pressed", "false");
			if(sL === sR){ done.add(sL); L.classList.add("done"); R.classList.add("done"); play("pop"); msg("✓ Bien vu.", "ok"); W.fly("heritage", sL, 3); setTimeout(() => W.glow(sL), 900); W.focus(null); }
			else { err(); msg("Ce placement ne répond pas à cet objectif. Pense à la disponibilité, à la durée et au risque.", "ko"); W.shake(sR); }
			sL = sR = null;
			if(done.size === goals.length){
				play("chime"); msg("");
				card.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Pas de placement miracle : on <b>diversifie</b> selon le profil de chacun. Louise, célibataire à Paris, n'aura pas les mêmes besoins que Jean-Baptiste. Et l'assurance-vie reviendra plus tard dans le dossier…</p>${course("place")}${next("contrats", "1997 · Le mariage d'Élise →")}`;
				scrollEnd();
			}
		};
		card.onclick = e => {
			const l = e.target.closest("[data-l]"), r = e.target.closest("[data-r]");
			if(l && !done.has(l.dataset.l)){ card.querySelectorAll("[data-l]").forEach(b => b.setAttribute("aria-pressed", "false")); l.setAttribute("aria-pressed", "true"); sL = l.dataset.l; tryPair(); }
			if(r && !done.has(r.dataset.r)){ card.querySelectorAll("[data-r]").forEach(b => b.setAttribute("aria-pressed", "false")); r.setAttribute("aria-pressed", "true"); sR = r.dataset.r; W.focus(sR); tryPair(); }
		};
	}

	/* ---------- 1997 · les contrats de mariage ---------- */
	// chaque régime se voit sur les parcelles d'Élise et de Florent
	function regime(k){
		const O = W.O;
		W.setPlot("plA", "#eaa6bd", "Biens d'Élise"); W.setPlot("plB", "#8fb3e0", "Biens de Florent");
		W.popOut("fence");
		if(k === "univ"){ W.popOut("plA"); W.popOut("plB"); W.setPlot("plC", COL.zC, "Tout est commun"); O.plC.g.position.set(0, 0, .8); O.plC.s = 1.9; W.popIn("plC"); }
		else {
			for(const id of ["plA", "plB"]) if(!O[id].g.visible || O[id].out){ O[id].g.position.set(id === "plA" ? -3.2 : 3.2, 0, .8); W.popIn(id); }
			if(k === "legal"){ W.setPlot("plC", COL.zC, "Commun"); O.plC.g.position.set(0, 0, 2.2); O.plC.s = 1; W.popIn("plC"); }
			else if(k === "part"){ W.setPlot("plC", COL.zC, "Gains partagés à la fin"); O.plC.g.position.set(0, 0, 4.2); O.plC.s = .6; W.popIn("plC"); }
			else { W.popOut("plC"); O.fence.g.position.set(0, 0, .8); W.popIn("fence"); }
		}
	}
	function contrats(){
		stage("1997 · Contrats de mariage", "contrats");
		setTimeout(() => { W.hop("elise"); W.hop("florent", 150); }, 700);
		show(`<span class="gp-year">1997</span><h2 class="gp-h">Les contrats de mariage</h2>
			<div class="gp-story">Élise épouse Florent Perbeau, jeune ingénieur. Paul souhaite qu'un contrat de <b>séparation de biens</b> soit signé chez le notaire.<span class="gp-ask">Quels sont les types de contrats de mariage possibles ?</span></div>
			<p class="gp-p">Associe chaque règle à son régime : la maquette montre le patrimoine du couple.</p><div data-s></div>`);
		sorter(card.querySelector("[data-s]"), shuffle([
			{ t:"Chacun reste seul propriétaire de tout ce qu'il achète, avant comme pendant le mariage", k:"sep", why:"Utile pour protéger la famille d'un entrepreneur des dettes de son activité.", hint:"Aucun bien commun, ici." },
			{ t:"Tout est commun, même ce que chacun possédait avant le mariage", k:"univ", why:"Souvent choisi tard dans la vie, avec une clause qui attribue tout au survivant.", hint:"Le régime le plus « communautaire » de tous." },
			{ t:"Séparés pendant le mariage, mais à la fin on partage l'enrichissement de chacun", k:"part", why:"Un régime hybride, prisé des couples où l'un est indépendant.", hint:"Séparation d'abord, partage du gain à la fin." },
			{ t:"Les biens d'avant le mariage et les héritages restent propres, le reste est commun", k:"legal", why:"Le régime légal, celui des époux Deslaurier.", hint:"C'est le régime appliqué sans contrat." }
		]), [["legal", "Communauté réduite aux acquêts"], ["sep", "Séparation de biens"], ["part", "Participation aux acquêts"], ["univ", "Communauté universelle"]], a => {
			setTimeout(() => regime("sep"), 1800);
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">On peut aussi aménager chaque régime avec des clauses (par exemple une petite communauté pour la résidence principale dans une séparation de biens). Le notaire rédige ; le conseiller aide à choisir. Élise et Florent, eux, signent une séparation de biens.</p>${next("remariage", "Paul se remarie →")}`;
		}, { ok: x => regime(x.k), ko: () => { W.shake("elise"); W.shake("florent"); } });
	}

	/* ---------- le remariage de Paul ---------- */
	function remariage(){
		stage("Le remariage", "remariage");
		W.setPlot("plA", COL.zP, "Patrimoine de Paul"); W.setPlot("plB", "#b99ad6", "Patrimoine de Paulette (2 M€)");
		setTimeout(() => { W.hop("paul"); W.hop("paulette", 150); }, 700);
		show(`<span class="gp-year">Plus tard</span><h2 class="gp-h">Une famille recomposée</h2>
			<div class="gp-story">Las de la solitude, Paul veut épouser Paulette Mercier, veuve, du même âge. Elle estime son patrimoine à 2 000 000 € et a des enfants de ses deux mariages.<span class="gp-ask">Quel contrat protège le mieux les enfants de chacun ?</span></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [
			["sep", "La séparation de biens : chacun garde son patrimoine, qui ira à ses propres enfants"],
			["univ", "La communauté universelle avec attribution de tout au survivant", "Risqué : les enfants d'un premier mariage seraient privés de leur héritage jusqu'au second décès, et peuvent contester (action en retranchement). Source de conflits."],
			["rien", "Pas de contrat : la communauté légale suffit", "Leurs biens actuels resteraient propres, mais tout ce qu'ils achèteront ensemble deviendrait commun : le partage avec les enfants de chacun serait plus délicat."]
		], "sep", a => {
			W.O.fence.g.position.set(0, 0, 1.4); W.popIn("fence");
			setTimeout(() => { W.hop("jb"); W.hop("elise", 100); W.hop("louise", 200); W.hop("pk1", 300); W.hop("pk2", 400); }, 500);
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Avec des enfants de lits différents, la séparation de biens évite de mélanger les patrimoines. Pour protéger le conjoint survivant, on complète ensuite par une donation entre époux, un testament ou une assurance-vie, en respectant les droits de tous les enfants.</p>${next("concubin", "Jean-Baptiste et Sarah →")}`;
		}, v => { if(v === "univ"){ W.moveTo("plA", -2, 1.4, .2); W.moveTo("plB", 2, 1.4, .2); setTimeout(() => { W.moveTo("plA", -4, 1.4, .2); W.moveTo("plB", 4, 1.4, .2); W.shake("pk1"); W.shake("pk2"); }, 900); } });
	}

	/* ---------- Jean-Baptiste, en concubinage ---------- */
	function concubin(){
		stage("Le concubinage", "concubin");
		const rows = [["Marié", "oui", "0"], ["Pacsé", "non", "0"], ["Concubin", "non", "60"]];
		const pick = {};
		show(`<span class="gp-year">Aujourd'hui</span><h2 class="gp-h">Ni marié, ni pacsé</h2>
			<div class="gp-story">Jean-Baptiste vit avec Sarah Dourdon, rencontrée pendant ses études à Paris. Ils n'ont pas voulu se pacser.<span class="gp-ask">Que se passerait-il en cas de décès ?</span></div>
			<p class="gp-p">Complète le tableau : selon le statut du couple, le survivant hérite-t-il sans testament ? Et combien paie-t-il de droits de succession ?</p>
			<table class="gp-tbl"><tr><th>Statut</th><th>Hérite sans testament ?</th><th>Droits</th></tr>
			${rows.map(([s], i) => `<tr><td><b>${s}</b></td><td><button data-c="${i}-h-oui">Oui</button><button data-c="${i}-h-non">Non</button></td><td><button data-c="${i}-d-0">0 %</button><button data-c="${i}-d-60">60 %</button></td></tr>`).join("")}</table>
			<button class="gp-go" data-check>Vérifier</button><div class="gp-msg"></div><div data-after></div>`);
		setTimeout(() => { W.O.heart.g.position.set(0, 0, 1.4); W.popIn("heart"); }, 900);
		card.onclick = e => {
			const b = e.target.closest("[data-c]"); if(!b || card.querySelector("[data-check]").disabled) return;
			const [i, col, v] = b.dataset.c.split("-"); pick[i + col] = v;
			b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
		};
		card.querySelector("[data-check]").addEventListener("click", ev => {
			if(Object.keys(pick).length < 6){ msg("Remplis toutes les cases.", "ko"); return; }
			let bad = 0;
			rows.forEach(([, h, d], i) => {
				[["h", h], ["d", d]].forEach(([c, v]) => {
					const btn = card.querySelector(`[data-c="${i}-${c}-${pick[i + c]}"]`);
					btn.classList.remove("on", "ok", "ko"); btn.classList.add(pick[i + c] === v ? "ok" : "ko"); if(pick[i + c] !== v) bad++;
				});
			});
			if(bad){ err(); msg(`${bad} case${bad > 1 ? "s" : ""} à corriger. Indice : le PACS exonère de droits, mais ne fait pas de l'autre un héritier.`, "ko"); return; }
			ev.target.disabled = true; play("good"); msg("✓ Tableau juste.", "ok");
			W.popOut("heart"); W.mourn("sarah", true);
			card.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Si Jean-Baptiste meurt, <b>Sarah n'hérite de rien</b> : ses biens iraient à son père et à ses sœurs. Et même avec un testament, elle paierait 60 % de droits. <b>Quel est le meilleur conseil, sans se marier ?</b></p><div data-q></div>`;
			scrollEnd();
			qcm(card.querySelector("[data-after] [data-q]"), [
				["av", "Souscrire une assurance-vie qui désigne Sarah comme bénéficiaire"],
				["test", "Rédiger un testament en faveur de Sarah, et c'est tout", "Utile, mais Sarah paierait 60 % de droits de succession (après un abattement d'à peine 1 594 €)."],
				["rien", "Ne rien faire : la loi protège les couples qui vivent ensemble", "Non : pour la loi, un concubin est un étranger en matière de succession."]
			], "av", a => {
				W.mourn("sarah", false); W.O.av.g.position.set(2.6, 0, 2.4); W.popIn("av"); setTimeout(() => { W.fly("jb", "av", 4); W.hop("sarah", 900); }, 500);
				a.innerHTML = `<p class="gp-p" style="margin-top:8px">Le capital d'une assurance-vie est transmis hors succession : pour des versements faits avant 70 ans, chaque bénéficiaire reçoit jusqu'à <b>152 500 €</b> sans impôt. Autre piste : se pacser et rédiger un testament, car le partenaire de PACS est exonéré de droits.</p>${course("fisca")}${next("transmettre", "Préparer la transmission →")}`;
			});
		});
	}

	/* ---------- préparer la succession de Paul ---------- */
	function transmettre(){
		stage("La transmission", "transmettre");
		const kids = ["jb", "elise", "louise"];
		show(`<span class="gp-year">Aujourd'hui</span><h2 class="gp-h">Préparer la succession</h2>
			<div class="gp-story">À la mort de ses parents, Paul a hérité du corps de ferme (250 000 €), qu'il loue, et de 100 000 € d'actions du CAC 40, gardées en souvenir. Louise est célibataire à Paris.<span class="gp-ask">Comment préparer la succession de Paul ? Et celle de Paulette ?</span></div>
			<p class="gp-p">Bon outil ou fausse bonne idée ?</p><div data-s></div>`);
		const fx = {
			dp: () => kids.forEach((k, i) => setTimeout(() => W.fly("paul", k, 2), i*220)),
			np: () => kids.forEach((k, i) => setTimeout(() => W.fly("ferme", k, 1, "doc"), i*220)),
			av: () => kids.forEach((k, i) => setTimeout(() => W.fly("titres", k, 1), i*220)),
			testament: () => { W.O.cross.g.position.set(1.1, 0, -2.4); W.popIn("cross"); setTimeout(() => W.popOut("cross"), 1600); },
			legs: () => { W.O.cross.g.position.set(4.4, 0, 3.8); W.popIn("cross"); setTimeout(() => W.popOut("cross"), 1600); }
		};
		sorter(card.querySelector("[data-s]"), shuffle([
			{ fx:"dp", t:"Une donation-partage à ses trois enfants", d:"De son vivant, devant notaire", k:"ok", why:"Chaque parent peut donner 100 000 € par enfant sans droits, tous les 15 ans ; et la donation-partage fige les valeurs, ce qui évite les disputes.", hint:"Elle utilise des abattements et prévient les conflits." },
			{ fx:"np", t:"Donner la nue-propriété de la ferme, garder l'usufruit", d:"Paul continue de percevoir les loyers", k:"ok", why:"Les droits ne portent que sur la nue-propriété ; au décès, les enfants deviennent pleins propriétaires sans rien payer de plus.", hint:"Paul garde les loyers et transmet à moindre coût." },
			{ fx:"testament", t:"Tout léguer à Paulette par testament", d:"Pour la protéger au maximum", k:"ko", why:"Impossible : avec trois enfants, ceux-ci ont droit à ¾ de la succession (la réserve héréditaire). Paul ne peut librement donner que ¼.", hint:"Les enfants ont des droits que le testament ne peut pas effacer." },
			{ fx:"legs", t:"Léguer la ferme aux enfants de Paulette", d:"Pour que tout le monde soit traité pareil", k:"ko", why:"Ils ne sont pas ses enfants : ils paieraient 60 % de droits, et ce legs empiéterait sur la réserve des enfants de Paul.", hint:"Pour la loi, quel lien ont-ils avec Paul ?" },
			{ fx:"av", t:"Verser sur une assurance-vie, même après 70 ans", d:"En désignant ses enfants ou petits-enfants", k:"ok", why:"Après 70 ans, 30 500 € de versements sont exonérés pour l'ensemble des bénéficiaires, et tous les gains le sont aussi.", hint:"Un outil vu chez Jean-Baptiste, qui fonctionne encore après 70 ans." }
		]), [["ok", "👍 Bon outil"], ["ko", "⚠️ Fausse bonne idée"]], a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Pour Paulette, même logique : ses enfants, des deux mariages, sont ses héritiers réservataires ; Paul n'est pas leur père. Le conseiller bâtit deux stratégies en parallèle, et les coordonne avec le notaire et l'expert-comptable.</p>${course("succ")}${next("end", "Remettre mon bilan patrimonial")}`;
		}, { ok: x => fx[x.fx](), ko: () => W.shake("paul") });
	}

	/* ---------- bilan ---------- */
	function finale(){
		stage("Bilan patrimonial", "end");
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 8 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention);
		play("win");
		setTimeout(() => ["paul", "paulette", "jb", "elise", "louise", "florent", "sarah", "pk1", "pk2"].forEach((id, i) => W.hop(id, i*110)), 900);
		const order = ["famille", "liquid", "succ", "place", "fisca"].filter(k => S.learned.has(k));
		show(`<div class="gp-k">${formation.name} · bilan</div><h2 class="gp-h">Dossier bouclé !</h2>
			<p class="gp-p" style="text-align:center;font-size:16px">Mention <b>${mention}</b> · ${e} erreur${e > 1 ? "s" : ""} en chemin.</p>
			<p class="gp-p">Mariage, entreprise, immobilier, décès, placements, famille recomposée : presque chaque moment de la vie pose une question de patrimoine. C'est le métier de conseiller en gestion de patrimoine ou de banquier privé, que prépare le master, en alternance sur 2 ans. Tu as touché à :</p>
			<ul class="gp-list">${order.map(k => `<li><span>📚</span>${COURSES[k][0]}</li>`).join("")}</ul>
			${openLead ? `<button class="gp-go" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="gp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master Droit & Gestion du Patrimoine ↗</a>
			<button class="gp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gp-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { mariage, biens, deces, placer, contrats, remariage, concubin, transmettre, end:finale };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set() }); root.querySelector("#gpErr").textContent = "⚖ 0 erreur"; return intro(); }
	});
	function close(){ if(closed) return; closed = true; removeEventListener("resize", onResize); document.removeEventListener("keydown", onKey); W.dispose(); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".gp-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["1967 · Le mariage", mariage], ["1968-1985 · Propres ou communs", biens], ["1991 · La succession", deces], ["1991 · Placer l'héritage", placer], ["1997 · Les contrats de mariage", contrats], ["Le remariage", remariage], ["Le concubinage", concubin], ["La transmission", transmettre], ["Bilan patrimonial", finale]]);
	if(window.campus) window.campus.game = { S, card, W, ...STEPS };
}
