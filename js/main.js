/* Campus FGES — le quartier Vauban, l'interface et les intérieurs (atrium, chapelle). */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { rng, R, pick, BOX, BOXC, cached, std, mesh, box, cyl, cone, gable, mansard, windowBatch, makeStudent, makePerson, beam } from "./kit.js";
import { TIME, bakeStatic, proxyInstances, blobShadow, blobMaterial, createSky, createPost, contactShade, windSway, waterRipples, windowsGate, GLINT, CLOUDS, cloudShade, createRain } from "./render.js";
import { FORMATIONS as F, GAMES, GAME_INFO, PROFILES, PLACES, LIFE, SEASONS, NIGHT, GOLDEN, SEASON_ORDER, PLAQUETTES, CATALOGUE_PLAQUETTES, LEAD_ENDPOINT } from "./data.js";
import { MAP } from "./vauban.js";
import { buildLandmarks } from "./landmarks.js";
import { buildMonuments } from "./monuments.js";
import { buildCity, pointInPoly, polyDist } from "./city.js";
import { buildStation } from "./station.js";
import { createRame } from "./rame.js";
import { Audio } from "./audio.js";
import { DETAILS } from "./details.js";

// lieu → mini-jeu qui s'y trouve (badge sur l'épingle, bouton dans la fiche)
const GAME_AT = {};   // lieu → mini-jeux qui s'y trouvent (un lieu peut en accueillir plusieurs)
for(const [k, g] of Object.entries(GAME_INFO)) (GAME_AT[g.where] = GAME_AT[g.where] || []).push(k);

const store = {
	get(k,d){ try{ const v = localStorage.getItem("campusfges:"+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
	set(k,v){ try{ localStorage.setItem("campusfges:"+k, JSON.stringify(v)); }catch(e){} }
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = Math.min(innerWidth, innerHeight) < 720;
const $ = id => document.getElementById(id);
const V = (x,y,z) => new THREE.Vector3(x,y,z);

/* =====================================================================
   Moteur
   ===================================================================== */
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:"high-performance" }); }
catch(e){
	$("loader").innerHTML = '<p style="padding:24px;text-align:center">Ton navigateur ne peut pas afficher le campus en 3D.<br><a href="liste.html">Découvre toutes nos formations en version liste</a>.</p>';
	throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;     // le quartier est immobile : la carte d'ombres n'est recalculée que si le soleil ou la vue bouge
let shadowDirty = true;
// rendu des couleurs « Neutral » (Khronos) : fidèle aux teintes choisies, sans virer à l'orange ni saturer les rouges comme ACES
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
$("scene").appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, innerWidth/innerHeight, 2, 1100);
camera.position.set(260, 160, -60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.screenSpacePanning = false;
controls.enabled = false;
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = .3;
/* Zone du quartier dessinée à l'échelle réelle (campus + chemin jusqu'aux stations de métro) : la caméra peut s'y promener. */
const ZONE = MAP.zone ? MAP.zone.reduce((a, v, i) => (i % 2 ? a[a.length-1].push(v) : a.push([v]), a), []) : null;
const zx = ZONE ? ZONE.map(p => p[0]) : [0], zz = ZONE ? ZONE.map(p => p[1]) : [0];
const EXT_LIMITS = { minDistance:22, maxDistance:300, minPolarAngle:.3, maxPolarAngle:1.2, box:[Math.min(-260, Math.min(...zx) + 10), 230, -320, Math.max(150, Math.max(...zz) - 10)] };
let limits = EXT_LIMITS;
function applyLimits(l){ limits = l; Object.assign(controls, { minDistance:l.minDistance, maxDistance:l.maxDistance, minPolarAngle:l.minPolarAngle, maxPolarAngle:l.maxPolarAngle }); }
applyLimits(EXT_LIMITS);

const hemi = new THREE.HemisphereLight();
scene.add(hemi);
const sun = new THREE.DirectionalLight();
sun.castShadow = true;
sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left:-95, right:95, top:75, bottom:-75, near:10, far:330 });
sun.shadow.bias = -.0005;
sun.shadow.normalBias = .04;
scene.add(sun, sun.target);
scene.fog = new THREE.Fog("#f5dcb6", 170, 430);

/* ---------- fenêtres & matériaux des bâtiments faits main ---------- */
const WB = windowBatch(.55);
const win = WB.win;
const glassLit = std("#2f3c54", { roughness:.3, metalness:.15, flatShading:false, emissive:"#ffb25e", emissiveIntensity:0 });
const glassDark = std("#2f3c54", { roughness:.3, metalness:.15, flatShading:false });
const frameMat = std("#efe3cf");
const slateMats = [];
function mats(brick, stone="#e8d9bf"){
	const m = { brick:std(brick), stone:std(stone), slate:std("#4f5767",{roughness:.8}), dark:std("#2b2a33") };
	slateMats.push(m.slate);
	return m;
}
function dormer(g, x, y, z, ry, style, M){
	const d = new THREE.Group(); d.position.set(x,y,z); d.rotation.y = ry; g.add(d);
	if(style === "slate"){
		box(d, 1.5, 1.6, 2, M.stone, 0, 0, -.1);
		mesh(gable(2.2, 1.9, 1.1), M.slate, d, 0, 1.6, -.1, Math.PI/2);
		win(d, 0, .85, .9, .75, 1);
	} else {
		box(d, 1.6, 1.7, 2, M.brick, 0, 0, -.1);
		mesh(gable(.3, 1.9, 1.5), M.brick, d, 0, 1.7, .75, Math.PI/2);
		mesh(gable(2, 1.8, 1.3), M.slate, d, 0, 1.7, -.3, Math.PI/2);
		win(d, 0, .85, .9, .75, .9, 0, { arch: style === "brickTall" });
	}
}
function wing(parent, o){
	const g = new THREE.Group(); g.position.set(o.x, 0, o.z); g.rotation.y = o.ry || 0; parent.add(g);
	const { L, D, m:M } = o, fh = o.fh || 3.4, Fl = o.floors, H = Fl*fh;
	const faces = o.faces || "fb";
	box(g, L, H, D, M.brick, 0, 0, 0);
	box(g, L+.3, M.base ? 1.1 : .7, D+.3, M.base || M.stone, 0, 0, 0);          // soubassement (pierre bleue à l'Hôtel Académique)
	if(o.bands !== false) for(let f=1; f<Fl; f++) box(g, L+.16, .24, D+.16, M.stone, 0, f*fh-.12, 0);
	box(g, L+.5, .4, D+.5, M.stone, 0, H, 0);
	const top = H + .4;
	const ww = o.ww || 1.3, wh = o.wh || fh*.5, sp = o.sp || 3.2;
	const row = len => { const n = Math.max(1, Math.floor((len-1.6)/sp)); return Array.from({length:n}, (_,i) => (i-(n-1)/2)*sp); };
	for(let f=0; f<Fl; f++){
		const y = f*fh + fh*.48;
		if(faces.includes("f")) for(const x of row(L)) win(g, x, y, D/2, ww, wh, 0, { arch:o.arch });
		if(faces.includes("b")) for(const x of row(L)) win(g, x, y, -D/2, ww, wh, Math.PI, { arch:o.arch });
		if(faces.includes("s")) for(const z of row(D)) { win(g, L/2, y, z, ww, wh, Math.PI/2, { arch:o.arch }); win(g, -L/2, y, z, ww, wh, -Math.PI/2, { arch:o.arch }); }
	}
	const rh = o.rh || D*.55;
	if(o.roof === "gable"){
		mesh(gable(L+.6, D+1, rh), M.slate, g, 0, top, 0);
		if(o.gableEnds){ const t = gable(.5, D+.6, rh+.6); mesh(t, M.brick, g, L/2+.12, top-.1, 0); mesh(t, M.brick, g, -L/2-.12, top-.1, 0); }   // dépasse du toit (L/2+.3) : jamais dans le même plan
	} else if(o.roof === "mansard"){
		mesh(mansard(L+.4, D+.6, rh), M.slate, g, 0, top, 0);
	} else if(o.roof === "parapet"){
		mesh(gable(L-.4, D-.6, rh), M.slate, g, 0, top, 0);
		box(g, L+.5, 1, .35, M.stone, 0, top, D/2+.08); box(g, L+.5, 1, .35, M.stone, 0, top, -D/2-.08);
		box(g, .35, 1, D+.5, M.stone, L/2+.08, top, 0); box(g, .35, 1, D+.5, M.stone, -L/2-.08, top, 0);
		for(const x of row(L).map(v => v + sp/2).slice(0,-1).concat([-L/2+.2, L/2-.2])){
			for(const s of [1,-1]){ box(g, .45, 1.4, .45, M.stone, x, top, s*(D/2+.08)); cone(g, .32, 1.3, M.stone, x, top+1.4, s*(D/2+.08), 4, Math.PI/4); }
		}
		for(let f=1; f<Fl; f++) box(g, L, .75, .4, M.stone, 0, f*fh-.1, D/2+.22);
	}
	if(o.dormers){
		const n = o.dormers;
		let zf, y;
		if(o.roof === "mansard"){ const hw = (D+.6)/2; zf = hw - 1.15; y = top + rh*.8*(1.15/1.3) - .55; }
		else { const hw = (D+1)/2; zf = D/2*.55; y = top + rh*(1 - zf/hw) - .6; }
		const span = L - 5;
		for(let i=0;i<n;i++){
			const x = n === 1 ? 0 : -span/2 + span*i/(n-1);
			dormer(g, x, y, zf, 0, o.dstyle, M);
			if(!o.oneSide) dormer(g, x, y, -zf, Math.PI, o.dstyle, M);
		}
	}
	return g;
}

/* =====================================================================
   Sol & quartier (OpenStreetMap)
   ===================================================================== */
// le sol passe derrière toutes les couches posées dessus (eau, quais, trottoirs, pelouses…), même vues de biais
const groundMat = Object.assign(std("#a9b05c", { flatShading:false }), { polygonOffset:true, polygonOffsetFactor:6, polygonOffsetUnits:12 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 80).rotateX(-Math.PI/2), groundMat);
/* Dans la zone à l'échelle réelle, le sol suit la photo aérienne de l'IGN (img/sol.png) : herbe dans les jardins,
   cour pavée ailleurs (parkings, cœurs d'îlots minéraux). Au-delà, tout reste en herbe. */
const solU = { uSol:{ value:null }, uSolBox:{ value:new THREE.Vector4(0, 0, 1, 1) }, uPaved:{ value:new THREE.Color("#b3aa9b") }, uSolOn:{ value:0 } };
if(MAP.sol){
	const [x0, z0, w, h] = MAP.sol;
	solU.uSolBox.value.set(x0, z0, w, h);
	new THREE.TextureLoader().load("img/sol.png", t => { t.flipY = false; t.colorSpace = THREE.NoColorSpace; solU.uSol.value = t; solU.uSolOn.value = 1; });
	groundMat.onBeforeCompile = sh => {
		Object.assign(sh.uniforms, solU);
		sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vSolXZ;")
			.replace("#include <project_vertex>", "#include <project_vertex>\n	vSolXZ = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;");
		sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D uSol; uniform vec4 uSolBox; uniform vec3 uPaved; uniform float uSolOn; varying vec2 vSolXZ;")
			.replace("#include <color_fragment>", `#include <color_fragment>
	{ vec2 st = ( vSolXZ - uSolBox.xy )/uSolBox.zw;
	  if( uSolOn > 0.5 && st.x > 0.0 && st.y > 0.0 && st.x < 1.0 && st.y < 1.0 ){
	    float veg = smoothstep( 0.25, 0.75, texture2D( uSol, st ).r );
	    diffuseColor.rgb = mix( uPaved, diffuseColor.rgb, veg ); } }`);
	};
	groundMat.customProgramCacheKey = () => "sol";
}
ground.receiveShadow = true; scene.add(ground);
/* Repère « historique » de l'Hôtel Académique (ancienne racine en z = -6), calé sur la carte. */
const HAG = new THREE.Group();
{
	const a = MAP.ha.ang, c = Math.cos(a), s = Math.sin(a);
	const rx = MAP.ha.x + .75*s, rz = MAP.ha.z - .75*c;
	HAG.position.set(rx - 6*s, 0, rz + 6*c);
	HAG.rotation.y = -a;
	scene.add(HAG); HAG.updateMatrixWorld(true);
}
const city = buildCity(scene, MAP);
const lawnMat = city.ground.lawn, waterMat = city.ground.water;
// ombres de nuages sur le sol, les rues, les toits et les façades
for(const m of [groundMat, lawnMat, city.ground.road, city.ground.ped, city.ground.walk, ...city.roofs, ...city.flats, ...city.walls]) if(m) cloudShade(m);
const rain = createRain(scene);
// rues mouillées : chaussée et trottoirs plus sombres et brillants sous la pluie
const wetBase = [city.ground.road, city.ground.ped].map(m => ({ m, c:m.color.clone(), r:m.roughness }));
function setWet(on){
	for(const { m, c, r } of wetBase){ m.color.copy(c).multiplyScalar(on ? .7 : 1); m.roughness = on ? .26 : r; m.metalness = on ? .15 : 0; }
	const w = city.ground.walk; w.color.multiplyScalar(on ? .74 : 1); w.roughness = on ? .32 : .92; w.metalness = on ? .1 : 0;
	if(on) solU.uPaved.value.multiplyScalar(.74);
}
const woodMat = std("#9b6b45"), benchLeg = std("#3a3540");
function flat(parent, w, d, mat, x, z, y=.03, ry=0){
	const m = new THREE.Mesh(BOX, mat); m.scale.set(w, .04, d); m.position.set(x, y-.02, z); m.rotation.y = ry; m.receiveShadow = true; parent.add(m); return m;
}
function bench(parent, x, z, ry){
	const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = ry; parent.add(g);
	box(g, 2.2, .14, .7, woodMat, 0, .55, 0);
	box(g, 2.2, .55, .12, woodMat, 0, .75, -.32);
	for(const s of [-1,1]) box(g, .12, .55, .6, benchLeg, s*.95, 0, 0);
}

/* =====================================================================
   Hôtel Académique (+ chapelle) posé sur son emprise réelle
   ===================================================================== */
const pickables = [];
function register(root, id){ root.traverse(o => { if(o.isMesh){ o.userData.place = id; if(!pickables.includes(o)) pickables.push(o); } }); }
const ball = () => cached("ball", () => new THREE.SphereGeometry(.2, 8, 6));
let cedarMat, flags = [], clockHands;
function flagTexture(kind){
	const c = document.createElement("canvas"); c.width = 96; c.height = 64;
	const x = c.getContext("2d");
	if(kind === "fr"){ x.fillStyle="#1f3f8f"; x.fillRect(0,0,32,64); x.fillStyle="#f4f1ea"; x.fillRect(32,0,32,64); x.fillStyle="#d1343b"; x.fillRect(64,0,32,64); }
	else if(kind === "eu"){ x.fillStyle="#1f3f9a"; x.fillRect(0,0,96,64); x.fillStyle="#f6cf3a"; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; x.beginPath(); x.arc(48+Math.cos(a)*19, 32+Math.sin(a)*19, 2.6, 0, 7); x.fill(); } }
	else { x.fillStyle="#8a2b4e"; x.fillRect(0,0,96,64); x.fillStyle="#f4e6c8"; x.fillRect(0,26,96,12); }
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function signTexture(lines){
	const c = document.createElement("canvas"); c.width = 512; c.height = 220;
	const x = c.getContext("2d");
	x.fillStyle = "#6b4a35"; x.fillRect(0,0,512,220);
	x.fillStyle = "#f6ead6"; x.fillRect(12,12,488,196);
	x.fillStyle = "#0b7a8e"; x.textAlign = "center";
	x.font = "bold 54px Georgia, serif"; x.fillText(lines[0], 256, 96);
	x.fillStyle = "#5b4f5f"; x.font = "28px Georgia, serif"; x.fillText(lines[1], 256, 150);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function buildHA(){
	const cs = MAP.ha.chapelSide;
	const root = new THREE.Group(); root.position.set(0,0,-6); HAG.add(root);
	const M = mats("#a9533c"); PLACES.ha.mats = M;
	M.base = std("#56606b");          // de bas en haut : pierre bleue, brique, pierre blanche, ardoise (Louis Dutouquet, 1879-1881)
	wing(root, { x:0, z:-9, L:46, D:11, floors:3, roof:"gable", rh:6.5, dormers:8, dstyle:"slate", m:M, faces:"fbs", sp:3.3 });
	for(const x of [-16,-5.3,10.5,16]) box(root, 1, 3.2, 1.3, M.brick, x, 12.5, -12.4);
	// pinacles de pierre aux angles de la grande aile
	for(const x of [-23.2, 23.2]) for(const z of [-3.6, -14.4]){ box(root, .7, 1.6, .7, M.stone, x, 10.6, z); cone(root, .5, 2.4, M.stone, x, 12.2, z, 4, Math.PI/4); }
	// l'observatoire astronomique (1888-1889) posé sur le toit, sa coupole de zinc
	const obs = new THREE.Group(); obs.position.set(-cs*8, 15.2, -9); root.add(obs);
	cyl(obs, 1.7, 1.7, 2.2, M.stone, 0, 0, 0, 12);
	const dome = new THREE.Mesh(new THREE.SphereGeometry(1.85, 14, 8, 0, Math.PI*2, 0, Math.PI/2), std("#9aa5b1", { metalness:.4, roughness:.45 }));
	dome.position.y = 2.2; obs.add(dome);
	box(obs, .5, 1.6, 3.5, M.dark, 0, 2.3, 0);          // la fente de la coupole

	const P = new THREE.Group(); P.position.set(0,0,-2.5); root.add(P);
	const ph = 13.6, pd = 7, pl = 14;
	box(P, pl, ph, pd, M.brick, 0, 0, 0);
	box(P, pl+.3, 1.1, pd+.3, M.base, 0, 0, 0);
	box(P, 7, ph, .3, M.stone, 0, 0, pd/2);
	for(let f=1; f<4; f++) box(P, pl+.16, .24, pd+.16, M.stone, 0, f*3.4-.12, 0);
	box(P, pl+.5, .4, pd+.5, M.stone, 0, ph, 0);
	box(P, 6.6, .35, 1.2, M.stone, 0, 6.5, pd/2+.5);
	box(P, 6.6, .8, .2, M.stone, 0, 6.85, pd/2+1);
	const fz = pd/2 + .3;
	for(let f=1; f<4; f++){
		for(const x of [-1.6,0,1.6]) win(P, x, f*3.4+1.35, fz, .95, 1.4, 0, { arch:true });
		for(const x of [-5.3,5.3]) win(P, x, f*3.4+1.6, pd/2, 1.3, 1.7);
	}
	for(const x of [-2.3,0,2.3]) win(P, x, 1.2, fz, 1.6, 2, 0, { arch:true, door:true });
	for(const x of [-5.3,5.3]) win(P, x, 1.3, pd/2, 1.3, 1.8, 0, { arch:true });
	mesh(gable(pl+.4, pd+1, 5.5), M.slate, P, 0, ph+.4, 0);
	const G = new THREE.Group(); G.position.set(0, ph+.4, pd/2-.1); P.add(G);
	mesh(gable(1.2, 7.6, 8), M.stone, G, 0, 0, 0, Math.PI/2);
	mesh(gable(.3, 6.2, 6.5), M.brick, G, 0, .3, .55, Math.PI/2);
	mesh(gable(6, 7.2, 7.4), M.slate, G, 0, 0, -3, Math.PI/2);
	for(const x of [-1.3,0,1.3]) win(G, x, 1.2, .75, .75, 1.2, 0, { arch:true });
	const clock = new THREE.Group(); clock.position.set(0, 4, .75); G.add(clock);
	const face = new THREE.Mesh(cached("clock", () => new THREE.CylinderGeometry(1.05,1.05,.2,28).rotateX(Math.PI/2)), std("#f6efe2", { flatShading:false }));
	face.castShadow = true; clock.add(face);
	const handM = std("#2b2a33"), hourHand = new THREE.Group(), minHand = new THREE.Group();
	hourHand.position.z = minHand.position.z = .14;
	clock.add(hourHand, minHand);
	const hh = new THREE.Mesh(BOX, handM); hh.scale.set(.12,.55,.04); hourHand.add(hh);
	const mh = new THREE.Mesh(BOX, handM); mh.scale.set(.08,.85,.04); minHand.add(mh);
	clockHands = { hourHand, minHand };
	hourHand.userData.dynamic = minHand.userData.dynamic = true;
	box(G, .16, 1.6, .16, M.dark, 0, 7.6, 0);
	box(G, .8, .16, .16, M.dark, 0, 8.6, 0);
	for(const s of [-1,1]){
		const x = s*3.75, z = pd/2 + .45;
		cyl(P, .95, .25, 1.4, M.stone, x, 3, z);
		cyl(P, .95, .95, 13.4, M.stone, x, 4.4, z);
		cyl(P, 1.1, 1.1, .35, M.stone, x, 17.8, z);
		cone(P, 1.2, 4.6, M.slate, x, 18.15, z);
		mesh(ball(), M.dark, P, x, 22.9, z);
	}
	P.traverse(o => { o.userData.chime = true; });

	// la chapelle (aile à galeries et pinacles) et l'aile aux pignons de brique
	// chapelle Saint-Joseph (1911-1924) : croix latine, deux rangs de baies superposées, grand toit d'ardoise au-dessus du parapet
	const chapel = wing(root, { x:cs*19, z:5, ry:-cs*Math.PI/2, L:22, D:10, floors:2, fh:5, roof:"parapet", rh:6.6, m:M, faces:"fbs", arch:true, ww:1.7, wh:2.3, sp:3.6, bands:false });
	const tr = wing(chapel, { x:1.5, z:0, ry:Math.PI/2, L:15, D:6.5, floors:2, fh:5, roof:"gable", rh:5.4, m:M, faces:"fb", arch:true, ww:1.6, wh:2.3, sp:3.4, bands:false });
	for(const s of [-1, 1]){ cone(tr, .45, 2.6, M.stone, 0, 10.4 + 5.4*.0, s*7.55, 4, Math.PI/4); }
	cyl(root, .5, .7, 2.2, M.stone, cs*14.6, 10.4, 15.6);
	wing(root, { x:-cs*19, z:5, ry:cs*Math.PI/2, L:22, D:10, floors:3, roof:"gable", rh:5.6, dormers:5, dstyle:"brick", m:M, faces:"fbs", gableEnds:true });
	// (pas de tour d'angle : la BD TOPO ne relève aucun volume à plus de 4,8 m au-dessus des gouttières)
	register(root, "ha");
	register(chapel, "chapelle");
	LIFE.chapelle.anchor = chapel;

	// cour d'honneur
	flat(HAG, 27.6, 20, lawnMat, 0, 0, .05);
	const wallM = std("#d9cbb2"), iron = std("#2c2a30");
	for(const s of [-1,1]){
		box(HAG, 11, .7, .5, wallM, s*8.5, 0, 10.3);
		box(HAG, 11, .08, .08, iron, s*8.5, 1.7, 10.3);
		for(let x=3.4; x<=14; x+=.8) box(HAG, .07, 1.1, .07, iron, s*x, .7, 10.3);
		box(HAG, .8, 2.6, .8, wallM, s*3, 0, 10.3);
		cone(HAG, .55, .7, wallM, s*3, 2.6, 10.3, 4, Math.PI/4);
	}
	flat(HAG, 2.8, 15, std("#dec59c", { flatShading:false }), 0, 3, .07);
	flat(HAG, 18, 2.4, std("#dec59c", { flatShading:false }), 0, 0, .07);
	cyl(HAG, .45, .6, 4, std("#6b4a35"), cs*8, 0, 5);
	cedarMat = std("#3e5a3c");
	[[5.2,0],[4.4,2.2],[3.6,4.3],[2.7,6.3],[1.7,8.2]].forEach(([r,y]) => {
		const c = mesh(cached(`cd${r}`, () => new THREE.ConeGeometry(r, 3, 9).translate(0,1.5,0)), cedarMat, HAG, cs*8 + R(-.4,.4), 3.2 + y, 5 + R(-.4,.4), R(0,3));
		c.scale.y = .8;
	});
	[["fr",-cs*3.6],["eu",-cs*5.2],["bx",-cs*6.8]].forEach(([k, x]) => {
		cyl(HAG, .07, .09, 11, std("#e8e4dc"), x, 0, -2.4);
		const geo = new THREE.PlaneGeometry(2.2, 1.45, 10, 1).translate(1.1, 0, 0);
		const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map:flagTexture(k), side:THREE.DoubleSide, roughness:.9 }));
		f.position.set(x+.05, 10.1, -2.4); f.userData.dynamic = true; HAG.add(f);
		flags.push({ mesh:f, base:geo.attributes.position.array.slice(), ph:R(0,6) });
	});
	for(const [x,z,r] of [[-5,8.4,0],[5,8.4,0],[cs*12,-1,-cs*Math.PI/2]]) bench(HAG, x, z, r);
	// pancarte et station de vélos sur le trottoir du boulevard
	const sg = new THREE.Group(); sg.position.set(-cs*10, 0, 11.3); HAG.add(sg);
	for(const s of [-1,1]) box(sg, .2, 2.4, .2, woodMat, s*1.8, 0, 0);
	const board = new THREE.Mesh(BOXC, [woodMat, woodMat, woodMat, woodMat, new THREE.MeshStandardMaterial({ map:signTexture(["Campus Vauban","FGES · ISEA · Université Catholique"]), roughness:.85 }), woodMat]);
	board.scale.set(3.9, 1.7, .16); board.position.y = 1.7; board.castShadow = true; sg.add(board);
	mesh(gable(4.2, .6, .4), std("#4f5767"), sg, 0, 2.55, 0);
	const red = std("#c8463f"), grey = std("#4a4a52"), tyre = std("#222024");
	const wheel = cached("wheel", () => new THREE.TorusGeometry(.33, .05, 6, 14));
	for(let i=0;i<6;i++){
		const b = new THREE.Group(); b.position.set(cs*(5 + i*1.1), 0, 11.6); b.rotation.y = Math.PI/2 + R(-.05,.05); HAG.add(b);
		for(const s of [-1,1]) mesh(wheel, tyre, b, s*.55, .38, 0, 0);
		const f1 = new THREE.Mesh(BOXC, i % 3 ? red : grey); f1.scale.set(1.1,.07,.07); f1.position.set(0,.62,0); f1.rotation.z = -.15; b.add(f1);
		box(b, .07, .45, .07, i % 3 ? red : grey, -.2, .4, 0);
		box(b, .3, .06, .14, tyre, -.22, .86, 0);
		box(b, .06, .06, .5, grey, .45, .92, 0);
	}
}

/* =====================================================================
   Bâtiment Michel Falise : quatre ailes autour de l'atrium vitré
   ===================================================================== */
let faliseGlass, atriumRoof, atriumGlow;
function buildFalise(){
	const Fm = MAP.falise;
	const root = new THREE.Group(); root.position.set(Fm.x, 0, Fm.z); root.rotation.y = -Fm.ang; scene.add(root);
	const M = mats("#c45a3b", "#ead9c2"); PLACES.falise.mats = M;
	// côtés mitoyens (Rizomm, maisons de la rue) : 40 cm de retrait pour que le débord du toit ne morde pas sur les voisins
	const L = Fm.L, D = Fm.D - .8, wd = 6.4, H = 3*3.4;
	// 18,5 m à la gouttière (BD TOPO) : cinq niveaux sous le comble à lucarnes
	const common = { floors:5, fh:3*3.4/5, roof:"mansard", rh:4, m:M, arch:true, ww:1.15, wh:1.25, sp:2.9, bands:false, dstyle:"brickTall" };
	wing(root, { ...common, x:0, z:D/2 - wd/2, L, D:wd, faces:"fb", dormers:5 });
	wing(root, { ...common, x:0, z:-(D/2 - wd/2), ry:Math.PI, L, D:wd, faces:"fb", dormers:5 });
	wing(root, { ...common, rh:3.85, x:L/2 - wd/2, z:0, ry:Math.PI/2, L:D - 2*wd, D:wd, faces:"fb", dormers:1 });
	wing(root, { ...common, rh:3.85, x:-(L/2 - wd/2), z:0, ry:-Math.PI/2, L:D - 2*wd, D:wd, faces:"fb", dormers:1 });
	// l'atrium et sa verrière, visibles depuis le ciel
	const iL = L - 2*wd, iD = D - 2*wd;
	box(root, iL, .1, iD, std("#9e9a95", { flatShading:false }), 0, 0, 0);
	atriumGlow = std("#fff2d8", { emissive:"#ffd391", emissiveIntensity:0, flatShading:false });
	for(const x of [-iL/4, iL/4]) for(const z of [-1.4, 1.4]) box(root, 1.6, .8, .8, std("#d6b384"), x, .1, z);
	for(let k=0;k<2;k++) box(root, iL*.35, .12, .25, atriumGlow, -iL*.22 + k*iL*.44, 8.4, 0);
	atriumRoof = new THREE.MeshStandardMaterial({ color:"#dcecf2", transparent:true, opacity:.32, roughness:.1, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0, side:THREE.DoubleSide, depthWrite:false });
	const gl = mesh(gable(iL + .4, iD + .4, 2.6), atriumRoof, root, 0, H + .45, 0, 0, false); gl.renderOrder = 3;
	const steel = std("#8f979e", { metalness:.35, roughness:.5 });
	for(let x = -iL/2; x <= iL/2 + .01; x += iL/5){
		beam(root, V(x, H+.45, -iD/2), V(x, H+3.05, 0), .12, .16, steel);
		beam(root, V(x, H+3.05, 0), V(x, H+.45, iD/2), .12, .16, steel);
	}
	beam(root, V(-iL/2, H+3.05, 0), V(iL/2, H+3.05, 0), .18, .2, steel);
	// rotonde et couronne de verre, sur la façade qui donne sur le jardin
	const [face, off] = Fm.rotunda || ["+z", 0];
	const Pv = new THREE.Group(); root.add(Pv); Pv.scale.setScalar(.78);
	if(face === "+x"){ Pv.position.set(L/2 - .6, 0, off); Pv.rotation.y = Math.PI/2; }
	else if(face === "-x"){ Pv.position.set(-L/2 + .6, 0, off); Pv.rotation.y = -Math.PI/2; }
	else if(face === "-z"){ Pv.position.set(off, 0, -D/2 + .6); Pv.rotation.y = Math.PI; }
	else Pv.position.set(off, 0, D/2 - .6);
	const r = 6.2, h = 10.6/.78;
	cyl(Pv, r, r, h, M.brick, 0, 0, 0, 8).rotation.y = Math.PI/8;
	const ap = r*Math.cos(Math.PI/8);
	for(let k=-2; k<=2; k++){ const a = Math.PI/8 + k*Math.PI/4; if(Math.cos(a) < .05) continue; box(Pv, .9, h-.25, 1.3, M.brick, Math.sin(a)*r, 0, Math.cos(a)*r, a); }
	for(const a of [-Math.PI/4, 0, Math.PI/4]){
		const x = Math.sin(a)*ap, z = Math.cos(a)*ap, big = a === 0;
		win(Pv, x, big ? 1.5 : 1.35, z, big ? 2.4 : 1.7, big ? 2.6 : 2.3, a, { arch:true, door:true });
		win(Pv, x, 7.6, z, big ? 2.3 : 1.8, 3.6, a, { arch:true });
	}
	faliseGlass = std("#cfe2e8", { transparent:true, opacity:.6, roughness:.15, metalness:.2, emissive:"#ffc77a", emissiveIntensity:0 });
	const crown = cyl(Pv, 6.5, 6.5, 3, faliseGlass, 0, h, 0, 8); crown.rotation.y = Math.PI/8; crown.castShadow = false;
	const white = std("#f3f1ec");
	cyl(Pv, 6.9, 6.9, .5, white, 0, h-.2, 0, 8).rotation.y = Math.PI/8;
	cyl(Pv, 6.9, 6.9, .35, white, 0, h+3, 0, 8).rotation.y = Math.PI/8;
	for(let k=0;k<8;k++){ const a = Math.PI/8 + k*Math.PI/4; box(Pv, .18, 3, .18, white, Math.sin(a)*6.55, h, Math.cos(a)*6.55); }
	register(root, "falise");
	PLACES.falise.root = root;

	// le jardin entre l'Hôtel Académique et Michel Falise (l'espace libre de l'îlot)
	scene.updateMatrixWorld(true);
	const facePt = Pv.localToWorld(V(0, 0, 0));
	const back = HAG.localToWorld(V(0, 0, -20.5)).z;           // façade arrière de l'Hôtel Académique
	const g0 = facePt.z + 4.2, g1 = back - .6, gz = (g0 + g1)/2, gd = g1 - g0, gx = facePt.x;
	flat(scene, 30, gd, lawnMat, gx - 3, gz, .06);
	const gravel = std("#dec59c", { flatShading:false });
	flat(scene, 2.6, gd, gravel, gx, gz, .1);
	flat(scene, 26, 2.2, gravel, gx - 3, gz, .1);
	for(const [x,z] of [[-9, -3.2],[7, -3.4],[-11, 3.2],[8.5, 3.2]]) picnic(scene, gx + x, gz + z);
	for(const x of [-4.5, 4.5]) bench(scene, gx + x, g1 - 1.2, Math.PI);
	const planter = std("#b9ad9a");
	for(const x of [-3.6, 3.6]) box(scene, 2.6, .6, .9, planter, gx + x, 0, g0 + .8);
	for(const [x,z] of [[-15, -4],[13, -4.5],[-15, 4],[-4, 4.6],[12, 4.4]]) gardenTrees.push({ x:gx + x, z:gz + z, k:"d", s:R(.8,1.05) });
	for(const [x,z] of [[-3, -1],[3, 2]]) for(let k=0;k<2;k++){ const s = makeStudent(scene), a = k ? Math.PI : 0; s.g.position.set(gx + x + Math.sin(a)*.75, 0, gz + z + Math.cos(a)*.75); s.g.rotation.y = a + Math.PI; gardenChat.push(s); }
}
const gardenTrees = [], gardenChat = [], extraCrowd = [];
function picnic(parent, x, z){
	const g = new THREE.Group(); g.position.set(x,0,z); parent.add(g);
	box(g, 2.8, .14, 1.2, woodMat, 0, .85, 0);
	for(const s of [-1,1]) box(g, 2.8, .12, .4, woodMat, 0, .5, s*1);
	for(const s of [-1,1]) box(g, .14, .85, 1.1, woodMat, s*1.1, 0, 0);
}

/* =====================================================================
   Euratechnologies : Wenov et le Blan-Lafont
   ===================================================================== */
let wenovGlass;
const pineMats = [];
function buildWenov(){
	const bp = MAP.blan.pts, n = bp.length/2;
	let cx = 0, cz = 0; for(let i=0;i<bp.length;i+=2){ cx += bp[i]; cz += bp[i+1]; } cx /= n; cz /= n;
	// le Blan-Lafont : grande filature de brique
	const brick = std("#a9533c"), M = mats("#a9533c");
	const pts = []; for(let i=0;i<bp.length;i+=2) pts.push(new THREE.Vector2(bp[i], -bp[i+1]));
	const shape = new THREE.Shape(pts);
	const blan = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth:9, bevelEnabled:false }).rotateX(-Math.PI/2), brick);
	blan.castShadow = blan.receiveShadow = true; scene.add(blan);
	const ang = MAP.blan.ang;
	const sheds = new THREE.Group(); sheds.position.set(cx, 9, cz); sheds.rotation.y = -ang; scene.add(sheds);
	for(let k=-3;k<=3;k++) mesh(extrudeShed(), std("#cfe2e8", { transparent:true, opacity:.8 }), sheds, 0, 0, k*3.2, 0);
	const chim = cyl(scene, 1.1, 1.5, 22, brick, cx + Math.cos(ang)*14, 0, cz + Math.sin(ang)*14, 10);
	// Wenov ne se voit plus depuis Vauban : on le rejoint uniquement en métro (ligne 2, station Cormontaigne)
	wenovGlass = std("#ffffff", { emissive:"#ffd08a", emissiveIntensity:0 });
	buildMetroVauban();
	LIFE.euratech = { x:cx, z:cz };
}
/* Station Cormontaigne (ligne 2), rue de Turenne : la porte d'entrée vers Wenov */
/* Les stations de la ligne 2 côté Vauban (Cormontaigne, Port de Lille) : bouches réelles, îlot de bâtiments réels
   autour (js/vauban.js), et une station souterraine pour les cinématiques d'arrivée. */
const vStations = {};
function buildMetroVauban(){
	const metal = std("#2f3a4a", { metalness:.4, roughness:.4 }), dark = std("#3c3a40"), pave = std("#c9c0b2", { flatShading:false });
	const tex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#d6213a"; x.fillRect(0,0,64,64); x.fillStyle = "#fff"; x.font = "bold 48px Arial"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("M", 32, 35); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
	const signM = new THREE.MeshStandardMaterial({ map:tex, emissive:"#ffffff", emissiveMap:tex, emissiveIntensity:.25 });
	for(const st of MAP.stations || []){
		const exits = st.exits.length ? st.exits : [[st.x, st.z]];
		const grp = new THREE.Group(); scene.add(grp);
		const cx = exits.reduce((a, e) => a + e[0], 0)/exits.length, cz = exits.reduce((a, e) => a + e[1], 0)/exits.length;
		exits.forEach(([x, z], i) => {
			// trémie d'escalier, garde-corps, et le totem « M » sur la première bouche
			const a = Math.atan2(-z, -x);
			const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = -a; grp.add(e);
			flat(e, 4, 6.4, pave, 0, 0, .11);
			box(e, 1.6, .2, 3.4, dark, 0, 0, 0);
			for(const sx of [-.95, .95]) box(e, .1, .9, 3.4, metal, sx, .2, 0);
			{ cyl(e, .1, .1, 4.6, metal, 1.4, 0, -2, 6); const sg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, .16), signM); sg.position.set(1.4, 4.9, -2); e.add(sg); }
		});
		register(grp, st.id);
		const d = Math.hypot(cx, cz + 4) || 1, ux = -cx/d, uz = -(cz + 4)/d;
		Object.assign(LIFE[st.id], { pin:[cx, 8, cz], target:[cx, 1, cz], cam:[cx - ux*38 + uz*10, 30, cz - uz*38 - ux*10] });
		vStations[st.id] = buildStation(scene, { exit:exits[0], face:[0, -4], name:st.name });
	}
	const c = LIFE.cormontaigne;
	if(c && c.target) Object.assign(PLACES.wenov, { target:c.target, cam:c.cam });
}
function extrudeShed(){
	return cached("shed", () => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.6,0), new THREE.Vector2(1.6,0), new THREE.Vector2(1.6,2.2)]), { depth:20, bevelEnabled:false }).rotateY(Math.PI/2).translate(-10,0,0));
}

/* =====================================================================
   Citadelle, Jardin Vauban et son kiosque
   ===================================================================== */
function starShape(rOut, rIn, n=5){
	const s = new THREE.Shape();
	for(let i=0;i<=n*2;i++){ const r = i % 2 ? rIn : rOut, a = i*Math.PI/n - Math.PI/2; const x = Math.cos(a)*r, y = Math.sin(a)*r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
	return s;
}
// la vraie Citadelle (MAP.citadel) : enceinte bastionnée de Vauban en brique, rempart engazonné, place d'armes ;
// les douves sont dessinées avec l'eau du quartier (MAP.water), les bâtiments avec la ville (MAP.buildings)
let citadelTurf = null;
const citadelRing = MAP.citadel ? (() => { const f = MAP.citadel.outline, p = []; for(let i=0;i<f.length;i+=2) p.push([f[i], f[i+1]]); return p; })() : null;
const inCitadel = (x, z) => citadelRing ? pointInPoly(x, z, citadelRing) : Math.hypot(x - MAP.citadelle[0], z - MAP.citadelle[1]) < 56;
function buildCitadelleReal(){
	const [cx, cz] = MAP.citadelle, P = citadelRing;
	const shape = pts => new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x - cx, -(z - cz))));
	const inner = P.map(([x, z]) => [cx + (x - cx)*.8, cz + (z - cz)*.8]);          // le rempart fait un cinquième du rayon
	const ring = shape(P); ring.holes.push(new THREE.Path(inner.map(([x, z]) => new THREE.Vector2(x - cx, -(z - cz)))));
	const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
	const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth:3.4, bevelEnabled:false }).rotateX(-Math.PI/2), std("#a9533c"));
	wall.castShadow = wall.receiveShadow = true; g.add(wall);
	const turf = std("#8fa957", { flatShading:false }); citadelTurf = turf;          // rempart engazonné (sans décalage de profondeur : il est bien au-dessus de la brique)
	const top = new THREE.Mesh(new THREE.ShapeGeometry(ring).rotateX(-Math.PI/2), turf); top.position.y = 3.46; top.receiveShadow = true; g.add(top);
	const cordS = shape(P.map(([x, z]) => [cx + (x - cx)*1.004, cz + (z - cz)*1.004]));
	cordS.holes.push(new THREE.Path(P.map(([x, z]) => new THREE.Vector2((x - cx)*.985, -(z - cz)*.985))));
	const cord = new THREE.Mesh(new THREE.ExtrudeGeometry(cordS, { depth:.25, bevelEnabled:false }).rotateX(-Math.PI/2), std("#e3d7c1"));
	cord.position.y = 3.2; g.add(cord);                                                             // cordon de pierre blanche
	const court = new THREE.Mesh(new THREE.ShapeGeometry(shape(inner)).rotateX(-Math.PI/2), std("#cdbf9f", { flatShading:false })); court.position.y = .08;          // place d'armes en gravier court.receiveShadow = true; g.add(court);
	LIFE.citadelle.pos = V(cx, 0, cz);
	register(g, "citadelle");
}
function buildCitadelle(){
	if(citadelRing) return buildCitadelleReal();
	const [cx, cz] = MAP.citadelle;
	const slab = (shape, h, mat, y) => { const g = new THREE.ExtrudeGeometry(shape, { depth:h, bevelEnabled:false }).rotateX(-Math.PI/2); const m = new THREE.Mesh(g, mat); m.position.set(cx, y, cz); m.receiveShadow = m.castShadow = true; scene.add(m); return m; };
	slab(starShape(52, 34), .1, waterMat, .03).castShadow = false;
	slab(starShape(45, 29), 2.4, std("#a9533c"), 0);
	slab(starShape(43.5, 28), .35, lawnMat, 2.4);
	const g = new THREE.Group(); g.position.set(cx, 2.75, cz); scene.add(g);
	const M = mats("#b4603f");
	for(let i=0;i<5;i++){ const a = i/5*Math.PI*2 + Math.PI/5; wing(g, { x:Math.cos(a)*15, z:Math.sin(a)*15, ry:-Math.PI/2 - a, L:16, D:6, floors:2, fh:3.2, roof:"gable", rh:3.6, m:M, faces:"f", sp:3 }); }
	cyl(g, 1.8, 1.8, 6, std("#e8d9bf"), 0, 0, -4, 10);
	cone(g, 2.2, 4.5, M.slate, 0, 6, -4, 10);
	const cp = V(cx, 0, cz);
	LIFE.citadelle.pos = cp;
	register(g, "citadelle");
}
function buildKiosque(){
	const jv = MAP.parks.find(p => p[0] === "Jardin Vauban");
	if(!jv) return;
	const p = jv[1]; let x = 0, z = 0; for(let i=0;i<p.length;i+=2){ x += p[i]; z += p[i+1]; } x /= p.length/2; z /= p.length/2;
	const k = new THREE.Group(); k.position.set(x, 0, z); scene.add(k);
	const stone = std("#ddd2c0"), iron = std("#2f5a48"), roofM = std("#3f6b5a");
	cyl(k, 4.2, 4.4, .8, stone, 0, 0, 0, 8);
	for(let i=0;i<8;i++){ const a = i/8*Math.PI*2; cyl(k, .1, .1, 3.2, iron, Math.cos(a)*3.8, .8, Math.sin(a)*3.8, 6); }
	cyl(k, 4.4, 4.4, .25, iron, 0, 4, 0, 8);
	cone(k, 5, 2.4, roofM, 0, 4.25, 0, 8);
	mesh(ball(), std("#d9a441"), k, 0, 6.7, 0);
	for(const [bx,bz,r] of [[-6,-5,.6],[6,-5,-.6]]) bench(k, bx, bz, r);
}

/* =====================================================================
   La ville continue à l'horizon (silhouettes instanciées)
   ===================================================================== */
/* Faces jamais vues d'en haut (dessous des volumes posés au sol) retirées : le lointain compte ses triangles. */
function withoutFaces(geo, drop){
	const g = geo.index ? geo.toNonIndexed() : geo.clone(), n = g.attributes.normal.array, keep = [];
	for(let t=0; t<n.length/9; t++) if(!drop(n[t*9], n[t*9+1], n[t*9+2])) keep.push(t);
	const out = new THREE.BufferGeometry();
	for(const [k, a] of Object.entries(g.attributes)){
		const s = a.itemSize, arr = new Float32Array(keep.length*3*s);
		keep.forEach((t, j) => arr.set(a.array.subarray(t*3*s, (t+1)*3*s), j*3*s));
		out.setAttribute(k, new THREE.BufferAttribute(arr, s));
	}
	return out;
}
/* Le lointain est découpé en carreaux : chaque carreau hors du cadre (derrière la caméra, au-delà de la brume)
   n'est pas dessiné. Dans chaque carreau, les bâtiments sont rangés du plus visible au moins visible : une qualité
   plus basse n'en dessine que le début (setFarLevel). */
const FAR_TILE = 150;
// rang 0 : grands volumes, gardés même en qualité basse ; rang 1 : ajoutés en moyenne ; rang 2 : tout, en haute
const farRank = (d, v) => v >= 30 || (d < 200 && v >= 12) ? 0 : d < 260 || v >= 14 ? 1 : 2;
function farTiles(items, at){
	const tiles = new Map();
	for(const it of items){
		const [x, z] = at(it), k = Math.floor(x/FAR_TILE) + "," + Math.floor(z/FAR_TILE);
		if(!tiles.has(k)) tiles.set(k, []);
		tiles.get(k).push(it);
	}
	return [...tiles.values()];
}
function fitInstances(m, counts){
	m.computeBoundingSphere();          // sur toutes les instances : la sphère reste juste quand on en dessine moins
	m.counts = counts; m.frustumCulled = true;
	return m;
}
function buildHorizon(F){
	// les vrais bâtiments au-delà de la zone à l'échelle réelle (BD TOPO), en miniature puisque le lointain est compressé ;
	// la Citadelle et Euratechnologies ont leurs propres modèles
	const blockedFar = (x, z) => {
		if(inCitadel(x, z)) return true;
		if(LIFE.euratech && Math.hypot(x-LIFE.euratech.x, z-LIFE.euratech.z) < 60) return true;
		return false;
	};
	// valeurs entières du fichier : positions et tailles au dixième, angle au centième, hauteur du toit au dixième
	const spots = F.map(([x, z, a, w, dp, lv, rh, col, rm]) => [x/10, z/10, a/100, w/10, dp/10, lv, rh/10, col, rm])
		.filter(([x, z]) => !blockedFar(x, z) && !monuments.covers(x, z) && !(ZONE && pointInPoly(x, z, ZONE)));
	spots.forEach((s, i) => s.push(i));          // la teinte du toit dépend du rang d'origine
	const H0 = (MAP.fh || 2.3)*.85;
	for(const s of spots) s.rank = farRank(Math.hypot(s[0], s[1]), Math.max(.8, s[3])*Math.max(.8, s[4])*s[5]);
	const bodyGeo = withoutFaces(BOX, (nx, ny) => ny < -.5), roofGeo = withoutFaces(gable(1, 1, 1), (nx, ny) => ny < -.5);
	const wallMat = std("#ffffff"), roofMat = std("#ffffff");
	const d = new THREE.Object3D(), c = new THREE.Color(), tiles = [];
	const walls = ["#b5563d","#a84e3a","#c46a4a","#9c4a38","#b9603f","#efe6d6","#e6d9c1","#d9cbb5","#f3eee6","#cdbfa8","#e9d3b4","#c9c2b8"];
	const roofs = { 0:["#4f5767","#5d6170","#8d4a3a"], 1:["#8d4a3a","#7a4234","#9a5a43"], 2:["#4f5767","#4a505d"], 3:["#7f8791"] };
	for(const list of farTiles(spots, s => s)){
		list.sort((a, b) => a.rank - b.rank);
		const roofed = list.filter(s => s[6] > 0);
		const upTo = (arr, lv) => arr.filter(s => s.rank <= lv).length;
		const body = new THREE.InstancedMesh(bodyGeo, wallMat, list.length);
		const roof = new THREE.InstancedMesh(roofGeo, roofMat, Math.max(1, roofed.length));
		const base = [];
		list.forEach(([x, z, ang, w, dp, lv, rh, col], j) => {
			d.position.set(x, 0, z); d.rotation.set(0, -ang, 0); d.scale.set(Math.max(.8, w), lv*H0, Math.max(.8, dp)); d.updateMatrix(); body.setMatrixAt(j, d.matrix);
			c.set(walls[col % walls.length]); body.setColorAt(j, c);
		});
		roofed.forEach(([x, z, ang, w, dp, lv, rh, col, rm, i], j) => {
			const r = (i*.618) % 1, rc = roofs[rm] || roofs[0];
			d.position.set(x, lv*H0, z); d.rotation.set(0, -ang, 0); d.scale.set(Math.max(.8, w) + .3, Math.min(rh, dp*.6), Math.max(.8, dp) + .3); d.updateMatrix(); roof.setMatrixAt(j, d.matrix);
			base.push(rc[Math.floor(r*rc.length)]); c.set(base[j]); roof.setColorAt(j, c);
		});
		roof.count = roofed.length;
		fitInstances(body, [0, 1, 2].map(lv => upTo(list, lv)));
		fitInstances(roof, [0, 1, 2].map(lv => upTo(roofed, lv)));
		body.castShadow = roof.castShadow = false; body.receiveShadow = true;
		if(roofed.length) scene.add(roof);
		scene.add(body);
		tiles.push({ body, roof, base });
	}
	return { tiles, spots, meshes: tiles.flatMap(t => t.base.length ? [t.body, t.roof] : [t.body]) };
}
/* niveau de détail du lointain : 0 grands volumes, 1 allégé, 2 tout */
function setFarLevel(level){
	if(horizon) for(const m of horizon.meshes) m.count = m.counts[level];
	if(farWood) for(const m of farWood.meshes){ m.count = m.counts[level]; m.visible = m.count > 0; }
}
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* =====================================================================
   Construction
   ===================================================================== */
/* =====================================================================
   Palais Rameau (Junia) : halle de 1878 posée sur son emprise réelle.
   Pavillon d'entrée à deux tours et dômes à bulbe, maçonnerie rayée crème / brique,
   grande halle couverte de zinc avec lanterne octogonale, serre-rotonde vitrée à l'arrière.
   ===================================================================== */
const zincMats = [];
let rameauGlass = null;
function buildRameau(){
	const P = MAP.pois.rameau, rec = P && MAP.buildings[P.i];
	if(!rec || !city.pois.rameau) return;
	const f = rec[4], pts = []; for(let k=0;k<f.length;k+=2) pts.push([f[k], f[k+1]]);
	// rectangle minimal (calé sur une arête) pour trouver l'axe long du bâtiment
	let best = null;
	for(let i=0;i<pts.length;i++){
		const a = pts[i], b = pts[(i+1)%pts.length], an = Math.atan2(b[1]-a[1], b[0]-a[0]), c = Math.cos(an), s = Math.sin(an);
		const us = pts.map(q => q[0]*c + q[1]*s), vs = pts.map(q => -q[0]*s + q[1]*c);
		const A = (Math.max(...us) - Math.min(...us))*(Math.max(...vs) - Math.min(...vs));
		if(!best || A < best.A) best = { A, an, du:Math.max(...us) - Math.min(...us), dv:Math.max(...vs) - Math.min(...vs) };
	}
	const axis = best.du >= best.dv ? best.an : best.an + Math.PI/2;
	const ctr = [pts.reduce((a,q) => a + q[0], 0)/pts.length, pts.reduce((a,q) => a + q[1], 0)/pts.length];
	// la rotonde (beaucoup de sommets rapprochés) marque l'arrière : l'axe va de l'entrée vers elle
	let fwd = [Math.cos(axis), Math.sin(axis)];
	const along = q => (q[0]-ctr[0])*fwd[0] + (q[1]-ctr[1])*fwd[1];
	const tA = Math.min(...pts.map(along)), tB = Math.max(...pts.map(along));
	if(pts.filter(q => along(q) < tA + 7).length > pts.filter(q => along(q) > tB - 7).length) fwd = [-fwd[0], -fwd[1]];
	const side = [fwd[1], -fwd[0]];
	const LL = pts.map(q => [(q[0]-ctr[0])*side[0] + (q[1]-ctr[1])*side[1], (q[0]-ctr[0])*fwd[0] + (q[1]-ctr[1])*fwd[1]]);
	const T0 = Math.min(...LL.map(q => q[1])), T1 = Math.max(...LL.map(q => q[1])), len = T1 - T0;
	const span = sel => { const s = LL.filter(sel); return s.length ? [Math.min(...s.map(q => q[0])), Math.max(...s.map(q => q[0]))] : [-3, 3]; };
	const pav = span(q => q[1] < T0 + 2.5), hall = span(q => Math.abs(q[1] - (T0 + len*.4)) < len*.22);
	const circ = LL.filter(q => q[1] > T1 - 8.6);
	const R0 = Math.min(4.6, Math.max(3.2, circ.length ? (Math.max(...circ.map(q => q[0])) - Math.min(...circ.map(q => q[0])))/2 : 4));
	const RX = circ.length ? (Math.max(...circ.map(q => q[0])) + Math.min(...circ.map(q => q[0])))/2 : 0;
	const rotZ = T1 - R0, hallZ0 = T0 + len*.12, hallZ1 = rotZ - R0 - len*.055;
	const root = new THREE.Group(); root.position.set(ctr[0], 0, ctr[1]); root.rotation.y = Math.atan2(fwd[0], fwd[1]); scene.add(root);
	// local : x = côté (side), z = de l'entrée vers la rotonde (fwd) ; rotation.y = atan2(fwd) envoie +z sur fwd et +x sur side

	// matériaux : bandes crème et brique (texture répétée selon la hauteur), pierre, zinc, ardoise des bulbes, verre
	const stripeTex = (() => { const c = document.createElement("canvas"); c.width = 16; c.height = 64; const x = c.getContext("2d");
		x.fillStyle = "#efe4cf"; x.fillRect(0, 0, 16, 64); x.fillStyle = "#bd5f47"; x.fillRect(0, 38, 16, 9); x.fillRect(0, 51, 16, 4); x.fillStyle = "rgba(120,90,60,.18)"; x.fillRect(0, 18, 16, 1);
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
	const striped = h => { const t = stripeTex.clone(); t.needsUpdate = true; t.repeat.set(1, Math.max(1, Math.round(h/1.1))); return new THREE.MeshStandardMaterial({ map:t, roughness:.9 }); };
	const stone = std("#f0e6d2"), zinc = std("#9aa5b1", { metalness:.3, roughness:.45 }), onion = std("#3b414c", { roughness:.6 });
	const glass = std("#d3e7ef", { transparent:true, opacity:.42, roughness:.1, metalness:.2, emissive:"#ffd391", emissiveIntensity:0, depthWrite:false });
	const steel = std("#8d969e", { metalness:.4, roughness:.45 }), dark = std("#2b2a33"), white = std("#eef1f2");
	// toiture de la serre : verre bleuté plus dense, comme sur les photos
	const roofGlass = std("#a9c6d8", { transparent:true, opacity:.78, roughness:.08, metalness:.35, emissive:"#ffd391", emissiveIntensity:0, depthWrite:false });
	zincMats.push(zinc); rameauGlass = [glass, roofGlass];
	const sbox = (w, h, d, x, y, z) => box(root, w, h, d, striped(h), x, y, z);
	// toit à 4 pans (tronc de pyramide) : base w1 × l1, sommet w2 × l2
	const frustum = (w1, l1, w2, l2, h) => {
		const a = [[-w1/2,0,-l1/2],[w1/2,0,-l1/2],[w1/2,0,l1/2],[-w1/2,0,l1/2]], b = [[-w2/2,h,-l2/2],[w2/2,h,-l2/2],[w2/2,h,l2/2],[-w2/2,h,l2/2]];
		const v = []; for(let i=0;i<4;i++){ const j = (i+1)%4; v.push(...a[i], ...b[j], ...a[j], ...a[i], ...b[i], ...b[j]); }
		if(w2 > .01 && l2 > .01) v.push(...b[0], ...b[2], ...b[1], ...b[0], ...b[3], ...b[2]);
		const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
	};
	const onionGeo = r => new THREE.LatheGeometry([[0,0],[1,0],[1.22,.32],[1.3,.68],[1.18,1.05],[.9,1.36],[.52,1.66],[.22,1.92],[.06,2.15],[0,2.25]].map(([a,b]) => new THREE.Vector2(a*r, b*r)), 16);
	const urn = (x, y, z) => { cyl(root, .2, .26, .45, stone, x, y, z, 8); mesh(new THREE.SphereGeometry(.3, 10, 8), stone, root, x, y + .66, z); };

	// --- la halle : angles avant arrondis, fenêtres cintrées, toit de zinc à claire-voie, lanterne octogonale ---
	const HW = hall[1] - hall[0], HX = (hall[0] + hall[1])/2, HL = hallZ1 - hallZ0, HZ = (hallZ0 + hallZ1)/2, H = 6.6;
	const rr = Math.min(2.2, HW*.16);
	sbox(HW, H, HL - rr, HX, 0, HZ + rr/2);
	sbox(HW - 2*rr, H, rr + .02, HX, 0, hallZ0 + rr/2);
	for(const sx of [-1, 1]) cyl(root, rr, rr, H, striped(H), HX + sx*(HW/2 - rr), 0, hallZ0 + rr, 16);
	box(root, HW + .3, .45, HL + .3, stone, HX, H - .1, HZ);
	box(root, HW + .2, .5, HL + .2, stone, HX, 0, HZ);
	const nWin = Math.max(3, Math.floor((HL - 3)/3.1));
	for(let k=0;k<nWin;k++){ const z = hallZ0 + 2.8 + k*((HL - 4.4)/Math.max(1, nWin - 1)); for(const sx of [-1, 1]) win(root, HX + sx*HW/2, 3, z, 1.2, 2.3, sx*Math.PI/2, { arch:true }); }
	const CW = HW*.62, CL = HL*.86;
	mesh(frustum(HW + .4, HL + .4, CW, CL, 1.5), zinc, root, HX, H + .35, HZ);
	box(root, CW, 1.6, CL, white, HX, H + 1.85, HZ);
	for(let k=0;k<Math.floor(CL/1.6);k++){ const z = HZ - CL/2 + .8 + k*1.6; for(const sx of [-1, 1]) box(root, .1, 1.2, 1.2, glass, HX + sx*(CW/2 + .03), H + 2.05, z); }
	mesh(frustum(CW + .4, CL + .4, .2, CL*.55, 2.4), zinc, root, HX, H + 3.45, HZ);
	const lzz = HZ + HL*.08;
	cyl(root, 2.3, 2.3, 1.6, white, HX, H + 4.6, lzz, 8).rotation.y = Math.PI/8;
	for(let k=0;k<8;k++){ const a = Math.PI/8 + k*Math.PI/4; box(root, .5, 1.1, .08, glass, HX + Math.sin(a)*2.32, H + 4.85, lzz + Math.cos(a)*2.32, a); }
	mesh(new THREE.ConeGeometry(2.6, 2.2, 8).translate(0, 1.1, 0), zinc, root, HX, H + 6.2, lzz).rotation.y = Math.PI/8;
	cyl(root, .08, .08, 1, steel, HX, H + 8.4, lzz, 6);
	for(const sx of [-1, 1]) for(const z of [hallZ0 + rr, hallZ1 - .3]) urn(HX + sx*(HW/2 - .25), H + .35, z);

	// --- pavillon d'entrée : grand arc, loggia, fronton, et ses deux tours à belvédère et bulbe ---
	const PW = Math.max(6.4, pav[1] - pav[0]), PX = (pav[0] + pav[1])/2, PZ0 = T0, PZ1 = hallZ0 + .6, PD = PZ1 - PZ0, PH = 8.6;
	sbox(PW, PH, PD, PX, 0, (PZ0 + PZ1)/2);
	box(root, PW + .3, .5, PD + .3, stone, PX, 0, (PZ0 + PZ1)/2);
	win(root, PX, 2.3, PZ0, PW*.36, 3.4, Math.PI, { arch:true, door:true });
	box(root, PW*.36 + .7, .3, .3, stone, PX, 4.05 + PW*.18 + .2, PZ0 - .1);
	box(root, PW*.58, .35, .5, stone, PX, PH*.66, PZ0 - .05);
	for(let k=0;k<5;k++) win(root, PX + (k - 2)*PW*.11, PH*.79, PZ0, PW*.07, .9, Math.PI, { arch:true, lit:false });
	box(root, PW + .4, .45, PD + .4, stone, PX, PH, (PZ0 + PZ1)/2);
	mesh(gable(1.4, PW*.52, 1.4), striped(1.4), root, PX, PH + .45, PZ0 + 1.3, Math.PI/2);
	const TW = Math.min(2.6, PW*.3), TH = 12.2;
	for(const sx of [-1, 1]){
		const tx = PX + sx*(PW/2 - TW/2 + .15), tz = PZ0 + TW/2 - .15;
		sbox(TW, TH, TW, tx, 0, tz);
		box(root, TW + .3, .4, TW + .3, stone, tx, TH, tz);
		win(root, tx, 6.4, tz - TW/2, .55, 1.2, Math.PI, { arch:true });
		win(root, tx, 3.4, tz - TW/2, .55, 1.2, Math.PI, { arch:true });
		box(root, TW*.62, 1.9, TW*.62, dark, tx, TH + .4, tz);
		for(const [ax, az] of [[-1,-1],[1,-1],[1,1],[-1,1]]) box(root, .36, 1.9, .36, stone, tx + ax*(TW/2 - .1), TH + .4, tz + az*(TW/2 - .1));
		box(root, TW + .35, .4, TW + .35, stone, tx, TH + 2.3, tz);
		mesh(onionGeo(TW*.42), onion, root, tx, TH + 2.7, tz);
		cone(root, .1, 1.1, steel, tx, TH + 2.7 + TW*.42*2.25, tz, 6);
	}

	// --- passage puis serre-rotonde vitrée à deux étages, encadrée de cheminées rayées ---
	const cz0 = hallZ1 - .2, cz1 = rotZ - R0 + .6, cw = Math.min(6, HW*.42);
	sbox(cw, 4.6, cz1 - cz0, HX, 0, (cz0 + cz1)/2);
	box(root, cw + .3, .35, cz1 - cz0 + .3, stone, HX, 4.6, (cz0 + cz1)/2);
	cyl(root, R0, R0, 1.1, stone, RX, 0, rotZ, 16);
	const drum = cyl(root, R0 - .1, R0 - .1, 3.4, glass, RX, 1.1, rotZ, 16); drum.castShadow = false;
	for(let k=0;k<16;k++){ const a = k/16*Math.PI*2; box(root, .12, 3.4, .12, steel, RX + Math.sin(a)*(R0 - .05), 1.1, rotZ + Math.cos(a)*(R0 - .05)); }
	const tier = new THREE.Mesh(new THREE.CylinderGeometry(R0*.72, R0 + .3, 1, 16, 1, true).translate(0, .5, 0), roofGlass); tier.position.set(RX, 4.5, rotZ); root.add(tier);
	mesh(new THREE.TorusGeometry(R0 + .25, .06, 4, 32).rotateX(Math.PI/2), steel, root, RX, 4.55, rotZ);
	cyl(root, R0*.7, R0*.7, 2, glass, RX, 5.5, rotZ, 16).castShadow = false;
	for(let k=0;k<12;k++){ const a = k/12*Math.PI*2; box(root, .1, 2, .1, steel, RX + Math.sin(a)*R0*.7, 5.5, rotZ + Math.cos(a)*R0*.7); }
	mesh(new THREE.ConeGeometry(R0*.82, 2.1, 16).translate(0, 1.05, 0), roofGlass, root, RX, 7.5, rotZ).castShadow = false;
	for(let k=0;k<16;k++){ const a = k/16*Math.PI*2; beam(root, V(RX + Math.sin(a)*R0*.82, 7.5, rotZ + Math.cos(a)*R0*.82), V(RX, 9.6, rotZ), .06, .06, steel); }
	mesh(new THREE.TorusGeometry(R0*.82, .06, 4, 32).rotateX(Math.PI/2), steel, root, RX, 7.55, rotZ);
	cyl(root, .55, .55, .8, glass, RX, 9.6, rotZ, 8); cone(root, .7, .7, steel, RX, 10.4, rotZ, 8);
	for(const sx of [-1, 1]){ cyl(root, .42, .42, 6.4, striped(6.4), HX + sx*(cw/2 + .45), 0, cz1 - .3, 12); cyl(root, .5, .5, .3, stone, HX + sx*(cw/2 + .45), 6.4, cz1 - .3, 12); }

	// l'ancien bloc générique d'OpenStreetMap laisse la place
	city.pois.rameau.group.visible = false;
	city.pois.rameau.H = TH + 4;
	register(root, "rameau");
}

buildHA(); buildFalise(); buildWenov(); buildCitadelle(); buildKiosque(); buildRameau();
const monuments = buildMonuments(scene, MAP);
const landmarks = buildLandmarks(scene, MAP, { inBuilding:city.inBuilding, roadGap:city.roadGap, home:[0, 14] });
let horizon = null, farWood = null;          // le lointain arrive après le campus (js/vauban_far.js), voir loadFar
WB.build(scene, glassLit, glassDark, frameMat);
scene.updateMatrixWorld(true);

/* Le Rizomm : toiture couverte de panneaux solaires */
if(city.pois.rizomm){
	const P = MAP.buildings[MAP.pois.rizomm.i][4], q = [];
	for(let i=0;i<P.length;i+=2) q.push([P[i], P[i+1]]);
	const xs = q.map(v => v[0]), zs = q.map(v => v[1]), H = city.pois.rizomm.H, spots = [];
	for(let x = Math.min(...xs) + 1.2; x < Math.max(...xs) - 1; x += 1.9) for(let z = Math.min(...zs) + 1.2; z < Math.max(...zs) - 1; z += 1.5)
		if(pointInPoly(x, z, q) && pointInPoly(x + .9, z, q) && pointInPoly(x - .9, z, q) && pointInPoly(x, z + .8, q) && pointInPoly(x, z - .8, q)) spots.push([x, z]);
	const panel = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, .06, 1.05), std("#24365a", { roughness:.3, metalness:.4, flatShading:false }), spots.length);
	const d = new THREE.Object3D();
	spots.forEach(([x,z],i) => { d.position.set(x, H + .45, z); d.rotation.set(-.32, 0, 0); d.updateMatrix(); panel.setMatrixAt(i, d.matrix); });
	panel.castShadow = true; scene.add(panel);
	city.pois.rizomm.group.add(panel);
}

/* repères des lieux (épingles, cibles, caméras) */
{
	const hp = HAG.localToWorld(V(0, 27, -12)), ht = HAG.localToWorld(V(0, 6, -4));
	Object.assign(PLACES.ha, { pin:hp.toArray(), target:ht.toArray(), cam:[ht.x + 16, 30, ht.z + 46] });
	const Fm = MAP.falise;
	Object.assign(PLACES.falise, { pin:[Fm.x, 19, Fm.z], target:[Fm.x, 4, Fm.z + 6], cam:[Fm.x + 20, 40, Fm.z + 56] });
	const cp = LIFE.chapelle.anchor.localToWorld(V(0, 13, 0));
	Object.assign(LIFE.chapelle, { pin:cp.toArray(), target:[cp.x, 4, cp.z], cam:[cp.x + 12, 24, cp.z + 34] });
	for(const id of ["rizomm","bu","resto","all","maison","sport","residence","rameau","jardin"]){
		const p = MAP.pois[id]; if(!p || !LIFE[id]) continue;
		const top = city.pois[id] ? city.pois[id].H : 1;
		Object.assign(LIFE[id], { pin:[p.x, top + 4, p.z], target:[p.x, 2, p.z], cam:[p.x + 14, top + 24, p.z + 36] });
		if(city.pois[id]) register(city.pois[id].group, id);
	}
	// station de terrain de la « Mission Jardin » : une petite tente de biologiste dans le jardin botanique
	if(MAP.pois.jardin && GAME_AT.jardin){
		const j = MAP.pois.jardin, sx = j.x + 5, sz = j.z + 4, st = new THREE.Group();
		st.position.set(sx, 0, sz);
		const wood = std("#8a5a3c"), green = std("#2f6b45");
		for(const [dx, dz] of [[-1.3,-1],[1.3,-1],[-1.3,1],[1.3,1]]) cyl(st, .06, .06, 2.2, wood, dx, 0, dz, 6);
		const roof = mesh(new THREE.ConeGeometry(2.1, 1.1, 4).rotateY(Math.PI/4).translate(0, .55, 0), green, st, 0, 2.2, 0); roof.scale.set(1.05, 1, .8);
		box(st, 2.4, .08, 1.2, std("#f4f1e6"), 0, .9, 0);
		for(const dx of [-1, 1]) box(st, .08, .9, 1, wood, dx, 0, 0);
		mesh(new THREE.TorusGeometry(.22, .05, 6, 16), std("#d9a441"), st, .5, 1.25, 0).rotation.x = -.6;
		box(st, .6, .25, .4, std("#dfeee0"), -.5, .98, 0);
		const sci = makeStudent(st); sci.g.position.set(.2, 0, 1.4); sci.g.scale.setScalar(.9); extraCrowd.push(sci.g);
		scene.add(st);
	}
	const [cx, cz] = MAP.citadelle;
	Object.assign(LIFE.citadelle, { pin:[cx, 18, cz], target:[cx, 2, cz], cam:[cx + 40, 70, cz + 95] });
}

/* =====================================================================
   Végétation
   ===================================================================== */
// un arbre du jardin ne pousse jamais dans un bâtiment voisin (emprises OpenStreetMap)
const inOsmBuilding = (x, z) => MAP.buildings.some(r => { const f = r[4], p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); return pointInPoly(x, z, p); });
const trees = [...city.trees, ...city.parkTrees, ...gardenTrees.filter(t => !inOsmBuilding(t.x, t.z))];
const hp0 = HAG.localToWorld(V(0,0,0));
for(const [x,z] of [[-12,-14],[12,-14],[-20,-10]]) { const p = HAG.localToWorld(V(x,0,z)); trees.push({ x:p.x, z:p.z, k:"d", s:1 }); }
const decid = trees.filter(t => t.k === "d"), conif = trees.filter(t => t.k === "c");
trees.forEach(t => { t.c = rng(); });
const trunkIM = new THREE.InstancedMesh(cached("trunk", () => new THREE.CylinderGeometry(.22,.34,2.4,6,1,true).translate(0,1.2,0)), std("#6b4a35"), trees.length);
const canopyIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std("#ffffff"), decid.length*2);
const conifIM = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7).translate(0,.5,0), std("#ffffff"), Math.max(1, conif.length*2));
[trunkIM, canopyIM, conifIM].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
{
	const d = new THREE.Object3D();
	trees.forEach((t,i) => { d.position.set(t.x,0,t.z); d.rotation.set(0,0,0); d.scale.setScalar(t.s); d.updateMatrix(); trunkIM.setMatrixAt(i, d.matrix); });
	decid.forEach((t,i) => {
		const s = t.s;
		d.position.set(t.x, 3.6*s, t.z); d.rotation.set(R(0,1), R(0,3), R(0,1)); d.scale.set(2.2*s, 1.9*s, 2.2*s); d.updateMatrix(); canopyIM.setMatrixAt(i*2, d.matrix);
		d.position.set(t.x + R(-1,1)*s, 5*s, t.z + R(-1,1)*s); d.scale.set(1.45*s, 1.35*s, 1.45*s); d.updateMatrix(); canopyIM.setMatrixAt(i*2+1, d.matrix);
	});
	conif.forEach((t,i) => {
		const s = t.s;
		d.rotation.set(0, R(0,3), 0);
		d.position.set(t.x, 1.4*s, t.z); d.scale.set(2.2*s, 4*s, 2.2*s); d.updateMatrix(); conifIM.setMatrixAt(i*2, d.matrix);
		d.position.set(t.x, 3.6*s, t.z); d.scale.set(1.5*s, 3.3*s, 1.5*s); d.updateMatrix(); conifIM.setMatrixAt(i*2+1, d.matrix);
	});
	conifIM.count = conif.length*2;
}
/* Le lointain : les vrais bâtiments en miniature et les bois (Bois de Boulogne…) plantés d'après la photo aérienne.
   Chargé une fois le campus affiché ; ses arbres, sans tronc, ne projettent pas d'ombre. */
function nearCanal(x, z, r){
	for(const c of MAP.canals) for(let i=0;i+3<c.length;i+=2){
		const ax = c[i], az = c[i+1], dx = c[i+2] - ax, dz = c[i+3] - az, l2 = dx*dx + dz*dz || 1;
		const k = Math.max(0, Math.min(1, ((x - ax)*dx + (z - az)*dz)/l2));
		if(Math.hypot(x - ax - k*dx, z - az - k*dz) < r) return true;
	}
	return false;
}
function buildFarWood(f){
	const [cx, cz] = MAP.citadelle, fr = mulberry(11), list = [];
	for(let i=0;i<f.length;i+=2){
		const x = f[i]/10, z = f[i+1]/10;
		if(inCitadel(x, z) || (LIFE.euratech && Math.hypot(x - LIFE.euratech.x, z - LIFE.euratech.z) < 60)) continue;
		if(nearCanal(x, z, 6.5)) continue;          // pas d'arbre dans la Deûle ni sur son quai
		list.push({ x, z, k: fr() < .22 ? "c" : "d", s:.95 + fr()*.4, c:fr() });
	}
	const d = new THREE.Object3D();
	// deux volumes par arbre : le principal (instances 0…n-1), puis la touffe du dessus (n…2n-1), omise en qualité moyenne
	for(const t of list){
		const s = t.s;
		if(t.k === "d"){
			d.position.set(t.x, 3.2*s, t.z); d.rotation.set(fr(), fr()*3, fr()); d.scale.set(2.2*s, 1.9*s, 2.2*s); d.updateMatrix(); t.m0 = d.matrix.clone();
			d.position.set(t.x + (fr() - .5)*2*s, 4.6*s, t.z + (fr() - .5)*2*s); d.scale.set(1.45*s, 1.35*s, 1.45*s); d.updateMatrix(); t.m1 = d.matrix.clone();
		} else {
			d.rotation.set(0, fr()*3, 0);
			d.position.set(t.x, .6*s, t.z); d.scale.set(2.2*s, 4.6*s, 2.2*s); d.updateMatrix(); t.m0 = d.matrix.clone();
			d.position.set(t.x, 3*s, t.z); d.scale.set(1.5*s, 3.3*s, 1.5*s); d.updateMatrix(); t.m1 = d.matrix.clone();
		}
	}
	const groups = [];
	for(const tile of farTiles(list, t => [t.x, t.z])) for(const [k, src] of [["d", canopyIM], ["c", conifIM]]){
		const trees = tile.filter(t => t.k === k), n = trees.length; if(!n) continue;
		const m = new THREE.InstancedMesh(src.geometry, src.material, n*2);
		trees.forEach((t, i) => { m.setMatrixAt(i, t.m0); m.setMatrixAt(n + i, t.m1); });
		fitInstances(m, [0, n, n*2]);
		m.receiveShadow = true; m.castShadow = false;
		scene.add(m);
		groups.push({ m, trees, conifer:k === "c" });
	}
	return { groups, meshes:groups.map(g => g.m) };
}
function paintFar(S){
	const c = new THREE.Color();
	if(horizon) for(const t of horizon.tiles){
		if(!t.base.length) continue;
		t.base.forEach((b, i) => { c.set(S.snowy ? "#dfe6ee" : b); t.roof.setColorAt(i, c); });
		t.roof.instanceColor.needsUpdate = true;
	}
	if(!farWood) return;
	for(const { m, trees, conifer } of farWood.groups){
		const n = trees.length;
		trees.forEach((t, i) => {
			if(conifer){ c.set(S.conifer); m.setColorAt(i, c); c.set(S.snowy ? "#e8eef6" : S.conifer).offsetHSL(0,0,.03); m.setColorAt(n + i, c); }
			else { c.set(S.trees[Math.floor(t.c*S.trees.length)]); m.setColorAt(i, c); c.set(S.trees[Math.floor(((t.c*7.3)%1)*S.trees.length)]); m.setColorAt(n + i, c); }
		});
		m.instanceColor.needsUpdate = true;
	}
}
let farLoading = false;
function loadFar(){
	if(farLoading) return; farLoading = true;
	import("./vauban_far.js").then(({ FAR }) => {
		horizon = buildHorizon(FAR.far);
		farWood = buildFarWood(FAR.ftrees);
		paintFar(season);
		setFarLevel(QUALITY[quality].horizon);
		shadowDirty = true;
	}).catch(() => { farLoading = false; });
}
const bushes = [];
for(const [lx, lz, n, rad] of [[-10,-3,6,2.2],[10,6,6,2.2],[-4,6,5,1.6],[6,-1,4,1.4],[-11,8,4,1.5]]){
	for(let i=0;i<n;i++){ const p = HAG.localToWorld(V(lx + R(-rad,rad), 0, lz + R(-rad,rad))); bushes.push({ x:p.x, z:p.z, s:R(.5,.85), c:rng() }); }
}
const bushIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std("#ffffff"), bushes.length);
{
	const d = new THREE.Object3D();
	bushes.forEach((b,i) => { d.position.set(b.x, b.s*.55, b.z); d.rotation.set(R(0,1),R(0,3),0); d.scale.set(b.s*1.2, b.s, b.s*1.2); d.updateMatrix(); bushIM.setMatrixAt(i, d.matrix); });
	bushIM.castShadow = true; bushIM.receiveShadow = true; scene.add(bushIM);
}

/* =====================================================================
   Réverbères (un seul nuage de halos)
   ===================================================================== */
const lampSpots = city.lampSpots;
const poleIM = new THREE.InstancedMesh(cached("pole", () => new THREE.CylinderGeometry(.08,.12,3.8,6).translate(0,1.9,0)), std("#2c2a30"), lampSpots.length);
const lampMat = std("#fff3d6", { emissive:"#ffd28a", emissiveIntensity:0, flatShading:false });
const headIM = new THREE.InstancedMesh(new THREE.SphereGeometry(.28, 8, 5), lampMat, lampSpots.length);
const glowTex = (() => {
	const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
	const g = x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,215,150,1)"); g.addColorStop(.35,"rgba(255,190,110,.35)"); g.addColorStop(1,"rgba(255,180,90,0)");
	x.fillStyle = g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c);
})();
const glowPos = new Float32Array(lampSpots.length*3);
{
	const d = new THREE.Object3D();
	lampSpots.forEach(([x,z],i) => {
		d.position.set(x,0,z); d.updateMatrix(); poleIM.setMatrixAt(i, d.matrix);
		d.position.set(x,3.95,z); d.updateMatrix(); headIM.setMatrixAt(i, d.matrix);
		glowPos.set([x, 3.95, z], i*3);
	});
	poleIM.castShadow = true; scene.add(poleIM, headIM);
}
const glowGeo = new THREE.BufferGeometry(); glowGeo.setAttribute("position", new THREE.BufferAttribute(glowPos, 3));
const glowPts = new THREE.Points(glowGeo, new THREE.PointsMaterial({ map:glowTex, size:4.2, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, sizeAttenuation:true }));
glowPts.visible = false; scene.add(glowPts);

/* =====================================================================
   Étudiants sur les trottoirs (réseau des rues réelles)
   ===================================================================== */
const WN = []; for(let i=0;i<MAP.walk.n.length;i+=2) WN.push([MAP.walk.n[i], MAP.walk.n[i+1]]);
const WE = []; for(let i=0;i<MAP.walk.e.length;i+=3) WE.push([MAP.walk.e[i], MAP.walk.e[i+1], MAP.walk.e[i+2]]);
// allées de la cour d'honneur, reliées au boulevard
const court = [[0,-3.5],[0,2],[-9,-5],[9,4],[0,9.5]].map(([x,z]) => { const p = HAG.localToWorld(V(x,0,z)); return [p.x, p.z]; });
const c0 = WN.length; WN.push(...court);
for(const [a,b] of [[0,1],[1,2],[1,3],[1,4]]) WE.push([c0+a, c0+b, 2.4]);
{
	let best = 0, bd = 1e9; const g = court[4];
	for(let i=0;i<c0;i++){ const d = Math.hypot(WN[i][0]-g[0], WN[i][1]-g[1]); if(d < bd){ bd = d; best = i; } }
	WE.push([c0+4, best, 1]);
}
const ADJ = WN.map(() => []);
WE.forEach(([a,b,w], k) => { ADJ[a].push([b,w]); ADJ[b].push([a,w]); });
const students = [];
const startNodes = WN.map((_,i) => i).filter(i => ADJ[i].length && Math.hypot(WN[i][0], WN[i][1] + 10) < 75);
for(let i=0; i<34; i++){
	const s = makeStudent(scene);
	const from = i < 8 ? c0 + (i % 4) : pick(startNodes), nb = pick(ADJ[from]);
	Object.assign(s, { from, to:nb[0], w:nb[1], t:rng(), speed:R(1.5,2.2), wait:0, side:rng() < .5 ? -1 : 1, ph:R(0,6), hx:0, hz:-10, range:85 });
	students.push(s);
}
// passants du quartier : autour des deux stations de métro, et sur le chemin entre le campus et chaque station
{
	const around = (x, z, r) => WN.map((_,i) => i).filter(i => ADJ[i].length && Math.hypot(WN[i][0] - x, WN[i][1] - z) < r);
	for(const st of MAP.stations || []){
		for(const [hx, hz, n, range] of [[st.x, st.z, 9, 60], [(st.x + 0)/2, (st.z - 10)/2, 7, 80]]){
			const near = around(hx, hz, 45); if(!near.length) continue;
			for(let i=0; i<n; i++){
				const s = makePerson(scene), from = pick(near), nb = pick(ADJ[from]);
				Object.assign(s, { from, to:nb[0], w:nb[1], t:rng(), speed:R(1.3,2), wait:0, side:rng() < .5 ? -1 : 1, ph:R(0,6), hx, hz, range });
				students.push(s);
			}
		}
	}
}
for(const [lx,lz] of [[-6,-1],[-4.5,7.5],[6,7.5]]){
	for(let k=0;k<2;k++){
		const s = makeStudent(scene), a = k ? Math.PI : 0, p = HAG.localToWorld(V(lx + Math.sin(a)*.75, 0, lz + Math.cos(a)*.75));
		s.g.position.copy(p); s.g.rotation.y = a + Math.PI - MAP.ha.ang;
		Object.assign(s, { chat:true, ph:R(0,6) });
		students.push(s);
	}
}
for(const s of gardenChat) students.push(Object.assign(s, { chat:true, ph:R(0,6) }));
function updateStudents(dt, t){
	for(const s of students){
		if(s.off) continue;
		if(s.chat){ s.body.rotation.z = Math.sin(t*1.3 + s.ph)*.04; s.hat.position.y = 1.62 + Math.max(0, Math.sin(t*2.2 + s.ph))*.04; continue; }
		if(s.wait > 0){ s.wait -= dt; s.body.position.y = .65; continue; }
		const [x1,z1] = WN[s.from], [x2,z2] = WN[s.to];
		const len = Math.hypot(x2-x1, z2-z1) || 1;
		s.t += s.speed*dt/len;
		if(s.t >= 1){
			const nb = ADJ[s.to].filter(([n]) => n !== s.from);
			const next = nb.length && rng() < .9 ? pick(nb) : pick(ADJ[s.to]);
			s.from = s.to; s.to = next[0]; s.w = next[1]; s.t = 0;
			const far = n => Math.hypot(WN[n][0] - s.hx, WN[n][1] - s.hz);
			if(far(s.from) > s.range && rng() < .7){ const back = ADJ[s.from].find(([n]) => far(n) < far(s.from)); if(back){ s.to = back[0]; s.w = back[1]; } }
			if(rng() < .25) s.wait = R(1, 5);
			continue;
		}
		const dx = (x2-x1)/len, dz = (z2-z1)/len, off = s.side*(s.w/2 + .75);
		const x = x1 + (x2-x1)*s.t - dz*off, z = z1 + (z2-z1)*s.t + dx*off;
		s.g.position.set(x, 0, z);
		let diff = Math.atan2(dx, dz) - s.g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
		s.g.rotation.y += diff*Math.min(1, dt*6);
		const step = t*s.speed*4.2 + s.ph;
		s.body.position.y = .65 + Math.abs(Math.sin(step))*.07;
		s.body.rotation.z = Math.sin(step)*.05;
		s.tassel.rotation.x = Math.sin(step)*.3;
	}
}

/* =====================================================================
   Petites vies : canards, nuages, oiseaux, pigeons, particules, fumée
   ===================================================================== */
const ducks = [];
// la Deûle : les plus longs tronçons (Port de Lille, bras de la Citadelle), parcourus par les péniches et les canards
const canalLen = c => { let L = 0; for(let i=0;i+3<c.length;i+=2) L += Math.hypot(c[i+2]-c[i], c[i+3]-c[i+1]); return L; };
const deule = MAP.canals.filter(c => canalLen(c) > 60).sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
{
	for(let i=0;i<8;i++){
		const c = deule[i % Math.min(3, deule.length)] || [0,0,1,1];
		const g = new THREE.Group();
		const b = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), std(i ? "#8a6a4a" : "#f4f1ea", { flatShading:false })); b.scale.set(1,.65,1.4);
		const h = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8), std(i ? "#2f6b4a" : "#f4f1ea", { flatShading:false })); h.position.set(0,.38,.5);
		const k = new THREE.Mesh(BOXC, std("#e8963a")); k.scale.set(.14,.07,.22); k.position.set(0,.34,.78);
		g.add(b,h,k); scene.add(g);
		ducks.push({ g, ph:R(0,6), line:c, k0:R(0,1) });
	}
}
/* Péniches et bateau de promenade : ils suivent le canal à petite vitesse, aller et retour. */
const boats = [];
function along(c, s){
	// point et direction à la distance s le long de la polyligne c
	for(let i=0;i+3<c.length;i+=2){
		const l = Math.hypot(c[i+2]-c[i], c[i+3]-c[i+1]);
		if(s <= l || i + 4 >= c.length){ const f = l ? Math.min(1, s/l) : 0; return [c[i] + (c[i+2]-c[i])*f, c[i+1] + (c[i+3]-c[i+1])*f, Math.atan2(c[i+2]-c[i], c[i+3]-c[i+1])]; }
		s -= l;
	}
	return [c[0], c[1], 0];
}
{
	const hullM = std("#2b2f36"), deckM = std("#7c3a2c"), cabM = std("#eef0ec"), winM = std("#3a4a5f", { roughness:.3 }), tarpM = std("#2f5d4a");
	const make = (L, W, kind) => {
		const g = new THREE.Group();
		box(g, W, .7, L, hullM, 0, -.2, 0);
		box(g, W*.98, .12, L*.98, deckM, 0, .5, 0);
		if(kind === "peniche"){
			box(g, W*.8, .55, L*.62, tarpM, 0, .55, L*.08);               // cale bâchée
			box(g, W*.8, 1.3, L*.16, cabM, 0, .55, -L*.4);                // timonerie à l'arrière
			box(g, W*.82, .35, L*.1, winM, 0, 1.45, -L*.36);
		} else {
			box(g, W*.7, .9, L*.45, cabM, 0, .55, -L*.05);
			box(g, W*.72, .3, L*.4, winM, 0, 1.05, -L*.05);
		}
		g.traverse(o => { if(o.isMesh) o.castShadow = true; });
		g.userData.dynamic = true;          // pas de fusion avec le décor fixe (bakeStatic)
		scene.add(g); return g;
	};
	const plan = [[0, "peniche", 9, 1.6, .5], [0, "peniche", 8, 1.5, .4], [1, "promenade", 3.6, 1.1, .8]];
	for(const [ci, kind, L, W, v] of plan){
		const c = deule[ci]; if(!c) continue;
		const len = canalLen(c);
		boats.push({ g:make(L, W, kind), c, len, v, s:R(.1, .9)*len, dir:rng() < .5 ? 1 : -1, L });
	}
}
function updateBoats(dt, t){
	for(const b of boats){
		b.s += b.v*b.dir*dt;
		if(b.s > b.len - b.L/2){ b.s = b.len - b.L/2; b.dir = -1; }
		if(b.s < b.L/2){ b.s = b.L/2; b.dir = 1; }
		const [x, z, a] = along(b.c, b.s);
		b.g.position.set(x, .12 + Math.sin(t*1.1 + b.L)*.03, z);
		b.g.rotation.set(Math.sin(t*.9 + b.L)*.01, a + (b.dir < 0 ? Math.PI : 0), 0);
	}
}
const cloudMat = new THREE.MeshLambertMaterial({ color:"#ffffff", flatShading:true });
const clouds = [];
for(let i=0;i<12;i++){
	const g = new THREE.Group(), n = 3 + Math.floor(rng()*3);
	for(let k=0;k<n;k++){ const m = new THREE.Mesh(cached("cl", () => new THREE.IcosahedronGeometry(1,1)), cloudMat); m.position.set(k*3.2 - n*1.6, R(-.6,.8), R(-1.5,1.5)); m.scale.setScalar(R(2.4,4)); g.add(m); }
	g.position.set(R(-300,300), R(60,80), R(-300,120)); g.scale.y = .6;
	scene.add(g); clouds.push({ g, v:R(1,2.4) });
}
const birdMat = std("#3a3230");
function makeBird(){
	const b = new THREE.Group();
	const body = new THREE.Mesh(BOXC, birdMat); body.scale.set(.26,.2,.75);
	const wl = new THREE.Group(), wr = new THREE.Group();
	const wlm = new THREE.Mesh(BOXC, birdMat); wlm.scale.set(1,.04,.42); wlm.position.x = -.5; wl.add(wlm);
	const wrm = new THREE.Mesh(BOXC, birdMat); wrm.scale.set(1,.04,.42); wrm.position.x = .5; wr.add(wrm);
	b.add(body, wl, wr);
	return { b, wl, wr };
}
const flocks = [];
let nextFlock = 6;
function spawnFlock(){
	const g = new THREE.Group();
	const ang = R(0, Math.PI*2), dir = V(Math.cos(ang), 0, Math.sin(ang)), c = controls.target;
	g.position.set(c.x - dir.x*170, R(26,36), c.z - dir.z*170);
	g.rotation.y = Math.atan2(dir.x, dir.z);
	const birds = [], n = 3 + Math.floor(rng()*4);
	for(let i=0;i<n;i++){
		const { b, wl, wr } = makeBird();
		b.position.set((i%2 ? 1 : -1)*Math.ceil(i/2)*1.8, R(-.6,.6), -Math.ceil(i/2)*1.6);
		g.add(b); birds.push({ wl, wr, ph:R(0,6) });
	}
	scene.add(g);
	flocks.push({ g, dir, birds, life:0 });
}
function updateFlocks(dt, t){
	nextFlock -= dt;
	if(nextFlock <= 0 && !night && !reduceMotion){ spawnFlock(); nextFlock = R(14, 28); }
	for(let i=flocks.length-1; i>=0; i--){
		const f = flocks[i];
		f.life += dt;
		f.g.position.addScaledVector(f.dir, 9*dt);
		for(const b of f.birds){ const a = Math.sin(t*9 + b.ph)*.6; b.wl.rotation.z = a; b.wr.rotation.z = -a; }
		if(f.life > 40){ scene.remove(f.g); flocks.splice(i,1); }
	}
}
const pigeonBody = std("#8d909a", { flatShading:false }), pigeonHead = std("#6a6f7c", { flatShading:false });
const pigeons = [];
for(let i=0;i<9;i++){
	const g = new THREE.Group();
	const body = new THREE.Mesh(cached("pgb", () => new THREE.SphereGeometry(.24, 10, 8)), pigeonBody); body.scale.set(1,.85,1.45); body.castShadow = true;
	const head = new THREE.Mesh(cached("pgh", () => new THREE.SphereGeometry(.13, 8, 6)), pigeonHead); head.position.set(0,.2,.3);
	const wl = new THREE.Group(), wr = new THREE.Group();
	for(const [w,s] of [[wl,-1],[wr,1]]){ const m = new THREE.Mesh(BOXC, pigeonBody); m.scale.set(.6,.04,.3); m.position.x = s*.3; w.add(m); w.visible = false; }
	g.add(body, head, wl, wr);
	const home = V(-17 + i*4.2 + R(-.8,.8), 17.25, -15);
	g.position.copy(home); g.rotation.y = R(-1,1) + (rng() < .5 ? 0 : Math.PI);
	g.scale.setScalar(1.3);
	HAG.add(g);
	pigeons.push({ g, head, wl, wr, home, mode:"sit", t:R(0,5), vel:V(0,0,0), from:V(0,0,0) });
}
function scarePigeons(){
	for(const p of pigeons){
		if(p.mode !== "sit") continue;
		p.mode = "fly"; p.t = R(-.3, 0);
		const a = R(-1.2, 1.2) + (rng() < .5 ? 0 : Math.PI);
		p.vel.set(Math.sin(a)*R(5,8), R(4,6.5), Math.cos(a)*R(5,8));
		p.g.rotation.y = Math.atan2(p.vel.x, p.vel.z);
	}
}
function updatePigeons(dt, t){
	for(const p of pigeons){
		p.t += dt;
		const flapping = p.mode === "fly" || p.mode === "land";
		p.wl.visible = p.wr.visible = flapping;
		if(flapping){ const a = Math.sin(t*22 + p.home.x)*.9; p.wl.rotation.z = a; p.wr.rotation.z = -a; }
		if(p.mode === "sit"){
			if(p.t > 3){ p.t = R(-3, 0); p.g.rotation.y += R(-.8,.8); }
			p.head.position.y = .2 - Math.max(0, Math.sin(t*3 + p.home.x*2))*.05;
		} else if(p.mode === "fly"){
			if(p.t < 0) continue;
			p.g.position.addScaledVector(p.vel, dt); p.vel.y += dt*.4;
			if(p.t > 6){ p.mode = "away"; p.g.visible = false; p.t = R(-22, -12); }
		} else if(p.mode === "away"){
			if(p.t >= 0){ p.mode = "land"; p.t = 0; p.g.visible = true; p.from.copy(p.home).add(V(R(-25,25), R(14,22), R(18,30))); }
		} else if(p.mode === "land"){
			const k = Math.min(1, p.t/4), e = 1 - Math.pow(1-k, 3);
			p.g.position.lerpVectors(p.from, p.home, e);
			p.g.rotation.y = Math.atan2(p.home.x - p.from.x, p.home.z - p.from.z);
			if(k >= 1){ p.mode = "sit"; p.t = 0; }
		}
	}
}
const PMAX = 420;
const partIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1), new THREE.MeshBasicMaterial({ side:THREE.DoubleSide }), PMAX);
partIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
partIM.frustumCulled = false;
scene.add(partIM);
const parts = Array.from({ length:PMAX }, () => ({ x:0, y:-10, z:0, rx:R(0,6), ry:R(0,6), vr:R(.5,2), ph:R(0,6), sp:R(.7,1.3) }));
function respawn(p, top){ const c = controls.target; p.x = c.x + R(-80,80); p.z = c.z + R(-60,60); p.y = top ? R(28,40) : R(0,40); }
const dummy = new THREE.Object3D();
function updateParts(dt, t){
	const P = season.parts;
	for(let i=0;i<partIM.count;i++){
		const p = parts[i];
		p.y -= P.speed*p.sp*dt;
		p.x += Math.sin(t*.9 + p.ph)*P.sway*dt;
		p.z += Math.cos(t*.7 + p.ph)*P.sway*.5*dt;
		p.ry += p.vr*.5*dt;
		if(p.y < .05) respawn(p, true);
		dummy.position.set(p.x, p.y, p.z); dummy.rotation.set(-1.1 + Math.sin(t*1.3 + p.ph)*.35, p.ry, Math.cos(t*1.1 + p.ph)*.3); dummy.scale.set(P.w, P.h, 1); dummy.updateMatrix();
		partIM.setMatrixAt(i, dummy.matrix);
	}
	partIM.instanceMatrix.needsUpdate = true;
}
const smoke = [];
const smokeSpots = [[-16,15.7,-18.4],[10.5,15.7,-18.4],[16,15.7,-18.4]];
for(let i=0;i<36;i++){
	const m = new THREE.Mesh(cached("sm", () => new THREE.IcosahedronGeometry(.6,0)), new THREE.MeshLambertMaterial({ color:"#d9d4e6", transparent:true, opacity:0, depthWrite:false }));
	m.visible = false; m.userData.dynamic = true; HAG.add(m); smoke.push({ m, life:1 + i/36*6, src:i%3 });
}
function updateSmoke(dt){
	const on = night || !!season.snowy;
	for(const s of smoke){
		s.life += dt;
		if(s.life > 6){ s.life = 0; const [x,y,z] = smokeSpots[s.src]; s.m.position.set(x + R(-.2,.2), y, z + R(-.2,.2)); }
		const k = s.life/6;
		s.m.visible = on;
		s.m.position.y += dt*1.1; s.m.position.x += dt*.5;
		s.m.scale.setScalar(.6 + k*2.2);
		s.m.material.opacity = Math.sin(Math.PI*k)*.35;
	}
}

/* =====================================================================
   Allègement du rendu : le décor immobile est fusionné par matériau, les petits personnages sont instanciés
   ===================================================================== */
// une ombre ronde au pied de chaque passant (ils ne projettent plus d'ombre dans la carte d'ombres)
for(const g of [...students.map(s => s.g), ...extraCrowd]){ const b = blobShadow(); b.scale.setScalar(1.05); b.position.y = .08; g.add(b); }
const crowd = proxyInstances(scene, [...students.map(s => s.g), ...extraCrowd, ...pigeons.map(p => p.g), ...ducks.map(d => d.g), ...clouds.map(c => c.g)]);
bakeStatic(scene);
pickables.length = 0;
scene.traverse(o => { if(o.isMesh && o.userData.place && o.layers.mask === 1) pickables.push(o); });
{
	// ombre de contact au pied des murs, vent dans les arbres, vaguelettes, fenêtres qui s'allument une à une
	const seen = new Set();
	scene.traverse(o => { const m = o.material; if(!o.isMesh || !m || Array.isArray(m) || seen.has(m)) return; seen.add(m); if(m.isMeshStandardMaterial && !m.transparent) contactShade(m); });
	windSway(canopyIM.material, .06); windSway(conifIM.material, .035); windSway(bushIM.material, .03);
	waterRipples(waterMat);
	windowsGate(glassLit, city.nightU);
}

/* =====================================================================
   Ciel : dégradé, brume, soleil (ou lune), rendu dans un cube qui sert aussi de reflet (environnement)
   ===================================================================== */
const skyCanvas = document.createElement("canvas"); skyCanvas.width = 2; skyCanvas.height = 256;
const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace = THREE.SRGBColorSpace;      // fond des intérieurs
function paintSky(top, bot){
	const x = skyCanvas.getContext("2d"), g = x.createLinearGradient(0,0,0,256);
	g.addColorStop(0, top); g.addColorStop(.75, bot); g.addColorStop(1, bot);
	x.fillStyle = g; x.fillRect(0,0,2,256); skyTex.needsUpdate = true;
}
const sky = createSky(renderer);
scene.background = sky.background;
const ENV_I = .5, HEMI_K = .72;     // part de la lumière qui vient des reflets du ciel ; la lumière hémisphérique baisse d'autant
scene.environmentIntensity = ENV_I;

/* =====================================================================
   Ambiance : saison × moment de la journée
   La lumière passe en douceur d'une ambiance à l'autre ; au crépuscule (heure réelle), les fenêtres s'allument une à une.
   ===================================================================== */
let seasonKey = store.get("season", "automne"); if(!SEASONS[seasonKey]) seasonKey = "automne";
let timeMode = store.get("time", "auto"); if(!["auto","jour","doree","nuit"].includes(timeMode)) timeMode = "auto";
let season = SEASONS[seasonKey], night = false;
const realNight = () => { const h = new Date().getHours(); return h < 7 || h >= 19; };
const realGolden = () => new Date().getHours() === 18;          // la dernière heure avant la nuit
let golden = false;
/* Météo : réelle (Open-Meteo, coordonnées du campus, sans donnée personnelle) ou choisie dans le menu */
const WEATHERS = [["auto","🛰️ Réelle"],["soleil","☀️ Soleil"],["nuageux","⛅ Nuageux"],["pluie","🌧️ Pluie"],["brouillard","🌫️ Brouillard"]];
let weatherMode = store.get("weather", "auto"); if(!WEATHERS.some(([k]) => k === weatherMode)) weatherMode = "auto";
let realWeather = "soleil", weather = "soleil";
const weatherNow = () => weatherMode === "auto" ? realWeather : weatherMode;
function fetchWeather(){
	fetch("https://api.open-meteo.com/v1/forecast?latitude=50.6327&longitude=3.0464&current=weather_code,cloud_cover")
		.then(r => r.json()).then(d => {
			const c = d.current.weather_code, cc = d.current.cloud_cover;          // codes météo de l'OMM
			const w = (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95 ? "pluie" : (c === 45 || c === 48) ? "brouillard"
				: (c >= 71 && c <= 77) || c === 85 || c === 86 || c === 3 || cc > 60 ? "nuageux" : "soleil";
			if(w !== realWeather){ realWeather = w; if(weatherMode === "auto" && light) applyAmbiance(false, 4); }
		}).catch(() => {});
}
fetchWeather(); setInterval(fetchWeather, 30*60000);
// la météo change la lumière visée : ciel gris et soleil voilé sous la pluie, laiteux dans le brouillard
function weatherize(o){
	const W = weatherNow();
	if(W === "pluie" || W === "brouillard"){
		const grey = new THREE.Color(night ? "#2b2f3b" : W === "pluie" ? "#97a0ab" : "#dadde0");
		for(const c of ["skyTop","skyBot","fog","cloud"]) o[c].lerp(grey, W === "pluie" ? .78 : .72);
		o.hemiSky.lerp(grey, .5); o.sun.lerp(grey, .4);
		o.sunI *= W === "pluie" ? .22 : .42; o.hemiI *= 1.12;
		if(W === "pluie") o.exposure *= .92;
		else { o.skyBot.copy(o.fog); o.skyTop.lerp(o.fog, .6); }          // dans le brouillard, le ciel se fond dans la brume
	} else if(W === "nuageux"){
		o.sunI *= .82;
		for(const c of ["skyTop","skyBot"]) o[c].lerp(new THREE.Color(night ? "#262a38" : "#c2c8d0"), .38);
	}
	return o;
}
const LCOL = ["skyTop","skyBot","fog","hemiSky","hemiGround","sun","cloud"], LNUM = ["hemiI","sunI","exposure","nightK"];
const lightOf = (L, k) => { const o = { sunPos:V(...L.sunPos), nightK:L.nightK ?? k }; for(const c of LCOL) o[c] = new THREE.Color(L[c]); for(const n of LNUM) if(n !== "nightK") o[n] = L[n]; return o; };
const copyLight = l => { const o = { ...l, sunPos:l.sunPos.clone() }; for(const c of LCOL) o[c] = l[c].clone(); return o; };
let light = null, lightTween = null;
function showLight(){
	const st = light, k = st.nightK;
	scene.fog.color.copy(st.fog);
	hemi.color.copy(st.hemiSky); hemi.groundColor.copy(st.hemiGround); hemi.intensity = st.hemiI*HEMI_K;
	sun.color.copy(st.sun); sun.intensity = st.sunI;
	renderer.toneMappingExposure = st.exposure*.94;
	cloudMat.color.copy(st.cloud);
	sky.set(st); sky.renderBackground();
	const lamp = THREE.MathUtils.smoothstep(k, .12, .5);
	glassLit.emissiveIntensity = k > 0 ? 1.7 : 0;          // fenêtre par fenêtre : voir windowsGate
	lampMat.emissiveIntensity = 2.2*lamp;
	glowPts.visible = lamp > .01; glowPts.material.opacity = lamp;
	faliseGlass.emissiveIntensity = .9*k;
	if(rameauGlass) rameauGlass.forEach(m => m.emissiveIntensity = .8*k);
	atriumRoof.emissiveIntensity = .55*k;
	atriumGlow.emissiveIntensity = .4 + 1.6*k;
	wenovGlass.emissiveIntensity = .28*k;
	city.setNight(k); landmarks.setNight(k); monuments.setNight(k);
	// paillettes sur l'eau : la lune la nuit (argentée), le soleil le jour, orangé à l'heure dorée
	GLINT.dir.value.copy(st.sunPos).normalize();
	GLINT.color.value.copy(st.sun).multiplyScalar(k > .5 ? 2.6 : golden ? 2.2 : .9);
	blobMaterial().opacity = .34 - .18*k;
	if(post) post.setNight(k);
}
function stepLight(dt){
	if(!lightTween) return;
	const T = lightTween; T.k = Math.min(1, T.k + dt/T.dur);
	const e = ease(T.k);
	for(const c of LCOL) light[c].lerpColors(T.a[c], T.b[c], e);
	for(const n of LNUM) light[n] = T.a[n] + (T.b[n] - T.a[n])*e;
	light.sunPos.lerpVectors(T.a.sunPos, T.b.sunPos, e);
	showLight(); shadowDirty = true;
	if(T.k >= 1) lightTween = null;
}
function applyAmbiance(instant, dur = 1.8){
	season = SEASONS[seasonKey];
	night = timeMode === "nuit" || (timeMode === "auto" && realNight());
	golden = !night && (timeMode === "doree" || (timeMode === "auto" && realGolden()));
	const S = season, L = night ? NIGHT : golden ? GOLDEN : S.day;
	paintSky(L.skyTop, L.skyBot);
	document.body.style.background = L.fog;
	groundMat.color.set(S.grass);
	if(citadelTurf) citadelTurf.color.set(S.lawn);
	solU.uPaved.value.set(S.snowy ? "#dde3ec" : "#b3aa9b");
	slateMats.forEach(m => m.color.set(S.slate));
	zincMats.forEach(m => m.color.set(S.snowy ? "#dfe6ee" : "#9aa5b1"));
	cedarMat.color.set(S.conifer); pineMats.forEach(m => m.color.set(S.conifer));
	city.setSeason(S);
	const c = new THREE.Color();
	decid.forEach((t,i) => {
		c.set(S.trees[Math.floor(t.c*S.trees.length)]); canopyIM.setColorAt(i*2, c);
		c.set(S.trees[Math.floor(((t.c*7.3)%1)*S.trees.length)]); canopyIM.setColorAt(i*2+1, c);
	});
	conif.forEach((t,i) => { c.set(S.conifer); conifIM.setColorAt(i*2, c); c.set(S.snowy ? "#e8eef6" : S.conifer).offsetHSL(0,0,.03); conifIM.setColorAt(i*2+1, c); });
	if(canopyIM.instanceColor) canopyIM.instanceColor.needsUpdate = true;
	if(conifIM.instanceColor) conifIM.instanceColor.needsUpdate = true;
	bushes.forEach((b,i) => { c.set(S.bush[Math.floor(b.c*S.bush.length)]); bushIM.setColorAt(i, c); });
	bushIM.instanceColor.needsUpdate = true;
	paintFar(S);
	// lumière : tout de suite au chargement, en fondu ensuite
	weather = weatherNow();
	const target = weatherize(lightOf(L, night ? 1 : 0));
	CLOUDS.value = night ? 0 : weather === "soleil" ? .3 : weather === "nuageux" ? .6 : 0;
	rain.set(weather === "pluie" ? (night ? .7 : 1) : 0);
	setWet(weather === "pluie");
	fogFollow(true);
	sky.set(target); scene.environment = sky.renderEnvironment();
	if(!light || instant || reduceMotion){ light = copyLight(target); lightTween = null; showLight(); }
	else { lightTween = { a:copyLight(light), b:target, k:0, dur }; sky.set(light); }
	shadowDirty = true;
	partIM.count = reduceMotion ? 0 : Math.round(S.parts.n*QUALITY[quality].parts);
	for(let i=0;i<PMAX;i++){ c.set(S.parts.colors[i % S.parts.colors.length]); partIM.setColorAt(i, c); respawn(parts[i], false); }
	partIM.instanceColor.needsUpdate = true;
	for(const k in interiors) if(interiors[k]) interiors[k].setAmbiance ? interiors[k].setAmbiance(S, L, night) : interiors[k].setNight(night);
	Audio.setAmbience({ night, snowy:!!S.snowy, outside: mode === "ext" });
	$("btnTheme").innerHTML = `${S.icon}${night ? "🌙" : golden ? "🌇" : "☀️"} <span class="lbl">${S.label}</span>`;
	renderAmbiancePop();
}
function renderAmbiancePop(){
	$("segSeason").innerHTML = SEASON_ORDER.map(k => `<button data-season="${k}" aria-pressed="${k === seasonKey}">${SEASONS[k].icon} ${SEASONS[k].label}</button>`).join("");
	$("segWeather").innerHTML = WEATHERS.map(([k,l]) => `<button data-weather="${k}" aria-pressed="${k === weatherMode}">${l}</button>`).join("");
	$("segTime").innerHTML = [["auto","🕰️ Heure réelle"],["jour","☀️ Jour"],["doree","🌇 Heure dorée"],["nuit","🌙 Nuit"]].map(([k,l]) => `<button data-time="${k}" aria-pressed="${k === timeMode}">${l}</button>`).join("");
	$("segQuality").innerHTML = [["auto",`⚙️ Auto${qualityMode === "auto" ? ` (${QUALITY[quality].label})` : ""}`],["haute","Haute"],["moyenne","Moyenne"],["basse","Basse"]].map(([k,l]) => `<button data-quality="${k}" aria-pressed="${k === qualityMode}">${l}</button>`).join("");
}
$("ambiance").addEventListener("click", e => {
	const s = e.target.closest("[data-season]"), t = e.target.closest("[data-time]"), w = e.target.closest("[data-weather]");
	if(s){ seasonKey = s.dataset.season; store.set("season", seasonKey); }
	if(t){ timeMode = t.dataset.time; store.set("time", timeMode); }
	if(w){ weatherMode = w.dataset.weather; store.set("weather", weatherMode); }
	if(s || t || w){ Audio.play("pop"); applyAmbiance(); }
	const q = e.target.closest("[data-quality]");
	if(q){ Audio.play("pop"); qualityMode = q.dataset.quality; store.set("quality", qualityMode); setQuality(qualityMode === "auto" ? guessQuality() : qualityMode); }
	if(e.target.closest("[data-replay]")){ $("ambiance").hidden = true; closePanel(); if(mode !== "ext") exitInterior(true); else playIntro(); }
});
setInterval(() => { if(timeMode === "auto" && (realNight() !== night || (!night && realGolden() !== golden))) applyAmbiance(false, 8); }, 60000);     // crépuscule lent

/* =====================================================================
   Intérieurs : atrium (Falise) et chapelle (Hôtel Académique)
   ===================================================================== */
const interiors = { atrium:null, chapelle:null, eura:null, wenovin:null };
/* Les intérieurs et le mini-jeu ne sont chargés qu'au besoin (et préchargés quand le navigateur est libre). */
const MAKERS = { atrium:() => import("./atrium.js").then(m => m.createAtrium), chapelle:() => import("./chapelle.js").then(m => m.createChapelle), eura:() => import("./eura.js").then(m => m.createEura), wenovin:() => import("./wenovin.js").then(m => m.createWenovIn) };
const GAME_LOADERS = {
	comptoir:() => import("./games/comptoir.js").then(m => m.openComptoir),
	jardin:() => import("./games/jardin.js").then(m => m.openJardin),
	audit:() => import("./games/audit.js").then(m => m.openAudit),
	robot:() => import("./games/robot.js").then(m => m.openRobot)
};
const loadGame = () => Object.values(GAME_LOADERS).forEach(l => l());
function prefetchLater(){
	const go = () => {
		MAKERS.atrium(); MAKERS.chapelle(); loadGame();
		// les intérieurs les plus visités et la rame sont construits, et leurs shaders préparés, pendant que le navigateur est libre
		setTimeout(() => {
			loadInterior("atrium").then(() => loadInterior("chapelle")).then(() => {
				rame = rame || createRame();
				return renderer.compileAsync(rame.scene, rame.camera);
			}).catch(() => {});
		}, 2500);
	};
	("requestIdleCallback" in window) ? requestIdleCallback(go, { timeout:8000 }) : setTimeout(go, 4000);
}
const RETURN = { atrium:"falise", chapelle:"chapelle", eura:"cormontaigne", wenovin:"wenov" };
let mode = "ext";
function fade(mid){
	const f = $("fade"); f.classList.add("on");
	setTimeout(() => { mid(); setTimeout(() => f.classList.remove("on"), 80); }, 420);
}
function loadInterior(id){
	return interiors[id] ? Promise.resolve() : MAKERS[id]().then(make => {
		interiors[id] = make({ background:skyTex }); qualityInterior(interiors[id]);
		if(interiors[id].setAmbiance) interiors[id].setAmbiance(season, night ? NIGHT : season.day, night); else interiors[id].setNight(night);
		// shaders préparés à l'avance (en parallèle si le navigateur le permet) : pas d'à-coup à l'entrée
		return renderer.compileAsync(interiors[id].scene, camera).catch(() => {});
	});
}
// installe une scène (intérieur ou quartier) derrière un écran opaque : caméra au point de départ, épingles, sons
function placeIn(id){
	const I = interiors[id];
	mode = id; fly = null;
	applyLimits(I.limits);
	camera.position.copy(I.home.pos); controls.target.copy(I.home.target);
	buildPins();
	Audio.setAmbience({ outside: id === "eura" });
}
function placeExt(back){
	mode = "ext"; fly = null;
	applyLimits(EXT_LIMITS);
	Audio.setAmbience({ outside:true });
	const p = PLACES[back] || LIFE[back];
	camera.position.set(...p.cam); controls.target.set(...p.target);
	buildPins();
}
const WELCOME = {
	atrium:"Bienvenue dans l'atrium de Michel Falise ✨ Passe au Comptoir pour jouer !",
	chapelle:"Bienvenue dans la chapelle universitaire ✨",
	eura:"Bienvenue à Euratechnologies 💡 le quartier de l'École du Numérique",
	wenovin:"Bienvenue dans Wenov 💡 salles de l'École du Numérique, Campus Cyber et coworking"
};
function enterInterior(id, then, quiet){
	if(id === "eura" && mode !== "wenovin"){ goEura(); return; }      // le quartier se rejoint en métro
	closePanel(); setHover(null); Audio.play("pop");
	const f = $("fade"); f.classList.add("on");
	Promise.all([loadInterior(id), new Promise(r => setTimeout(r, 420))]).then(() => {
		setTimeout(() => f.classList.remove("on"), 80);
		placeIn(id);
		const I = interiors[id];
		const tgt = I.home.target.clone(), pos = I.home.pos.clone().sub(tgt).multiplyScalar(innerWidth < innerHeight ? 1.5 : .82).add(tgt);
		if(innerWidth < innerHeight && id === "atrium"){ tgt.x -= 4; pos.x -= 4; }
		if(!quiet) flyTo(pos, tgt, 2.2);
		if(!quiet) setTimeout(() => toast(WELCOME[id], 4200), 600);
		if(then) setTimeout(then, quiet ? 120 : 900);
	}).catch(() => { f.classList.remove("on"); toast("Impossible d'ouvrir ce lieu : vérifie ta connexion et réessaie.", 3500); });
}
function exitInterior(replay, then, dest){
	const back = RETURN[mode];
	closePanel(); Audio.play("pop");
	if(mode === "wenovin"){ enterInterior("eura", () => { focusEura("wenov", false); if(then) then(); }, true); return; }
	if(mode === "eura"){ rideBack(dest || store.get("lastStation", "cormontaigne"), then); return; }
	fade(() => {
		placeExt(back);
		if(replay) playIntro();
		if(then) setTimeout(then, 80);
	});
}

/* =====================================================================
   Métro ligne 2 : Vauban (Cormontaigne) ⇄ Wenov (Canteleu – Euratechnologies)
   La rame roule pendant que la scène suivante se charge derrière ; on peut passer.
   ===================================================================== */
const LINE2 = ["Cormontaigne", "Port de Lille", "Bois Blancs", "Canteleu – Euratechnologies"];
// annonces en station, avec la synthèse vocale du navigateur (seulement si le son est activé)
function announce(text){
	if(!Audio.on || !("speechSynthesis" in window)) return;
	try {
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "fr-FR"; u.rate = .98; u.pitch = 1.05; u.volume = .9;
		const v = speechSynthesis.getVoices().find(v => /^fr(-|_)FR/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
		if(v) u.voice = v;
		speechSynthesis.cancel(); speechSynthesis.speak(u);
	} catch(e){}
}
let rame = null;      // l'intérieur de la rame, créé au premier trajet
const STATION_NAME = { cormontaigne:"Cormontaigne", portdelille:"Port de Lille" };
// stations parcourues entre une station de Vauban et Canteleu – Euratechnologies (dans le sens du trajet)
const lineFrom = (vs, toEura) => { const l = LINE2.slice(LINE2.indexOf(STATION_NAME[vs] || "Cormontaigne")); return toEura ? l : l.reverse(); };
let riding = false;
function rideMetro(toEura, swap, then, vs = "cormontaigne", arrive3D = true){
	if(riding) return; riding = true;
	closePanel(); setHover(null); if(tour) stopTour();
	const st = lineFrom(vs, toEura), M = $("metro");
	$("mtDir").textContent = toEura ? "Direction Saint-Philibert" : "Direction C.H. Dron";
	$("mtStations").innerHTML = st.map((n, i) => `<li class="${i === 0 ? "on here" : ""}">${n}</li>`).join("");
	$("mtNext").textContent = st[1];
	M.classList.add("on"); Audio.play("metro"); buzz(20);
	// quand l'arrivée se joue en 3D, le trajet s'arrête juste avant le terminus
	const last = arrive3D && !reduceMotion ? st.length - 2 : st.length - 1;
	const inside = !reduceMotion;
	const dur = reduceMotion ? 1400 : inside ? 2200*(last + .4) : 3800, step = dur/(last + .4), lis = [...$("mtStations").children], timers = [];
	// à bord : l'intérieur de la rame en 3D, la rame marque l'arrêt à chaque station
	M.classList.toggle("in3d", inside);
	document.body.classList.add("riding");
	if(inside){
		rame = rame || createRame();
		rame.start({ names:st, step, onStation:i => { if(i > 0 && i < st.length - 1) announce(`${st[i]}. Prochain arrêt : ${st[i + 1]}`); } });
		setTimeout(() => announce(`Prochain arrêt : ${st[1]}`), 700);
	}
	for(let i=1; i<=last; i++) timers.push(setTimeout(() => {
		lis.forEach((li, k) => { li.classList.toggle("on", k <= i); li.classList.toggle("here", k === i); });
		$("mtNext").textContent = i < st.length - 1 ? st[i + 1] : st[i];
		if(i === st.length - 1) M.querySelector(".mt-next small").textContent = "Terminus pour toi";
	}, i*step - 250));
	let skip; const skipped = new Promise(r => skip = r);
	$("mtSkip").onclick = () => { Audio.play("pop"); skip(); };
	const work = Promise.resolve().then(swap);
	Promise.all([work, Promise.race([new Promise(r => setTimeout(r, dur)), skipped])]).then(() => {
		timers.forEach(clearTimeout);
		M.classList.remove("on"); riding = false; document.body.classList.remove("riding");
		if(rame) rame.stop();
		setTimeout(() => { M.querySelector(".mt-next small").textContent = "Prochain arrêt"; }, 500);
		if(then) setTimeout(then, 150);
	}).catch(() => { M.classList.remove("on"); riding = false; document.body.classList.remove("riding"); if(rame) rame.stop(); toast("Impossible de rejoindre Wenov : vérifie ta connexion et réessaie.", 3500); });
}

/* =====================================================================
   Intro : on arrive par la Citadelle et le Bois de Boulogne
   ===================================================================== */
let intro = null;
function playIntro(){
	const h = homeView(), [cx, cz] = MAP.citadelle;
	intro = {
		k:0, dur:10,
		pos:new THREE.CatmullRomCurve3([V(cx + 120, 95, cz - 90), V(cx + 30, 70, cz + 60), V(cx - 60, 62, cz + 140), h.pos.clone().lerp(V(60, 80, 140), .35), h.pos]),
		tgt:new THREE.CatmullRomCurve3([V(cx, 0, cz), V(cx - 20, 0, cz + 30), V(20, 0, -40), V(5, 0, -12), h.target])
	};
	controls.enabled = false;
	$("pins").classList.remove("on"); $("dock").classList.remove("on");
	$("introCap").classList.add("on");
	$("skip").hidden = false;
}
function endIntro(){
	if(!intro) return;
	const h = homeView();
	intro = null;
	camera.position.copy(h.pos); controls.target.copy(h.target);
	controls.enabled = true;
	$("introCap").classList.remove("on"); $("skip").hidden = true; $("pins").classList.add("on");
	store.set("introSeen", true);
	afterArrival();
}
$("skip").addEventListener("click", endIntro);

/* =====================================================================
   Interface
   ===================================================================== */
let profile = store.get("profile", null); if(!PROFILES[profile]) profile = null;
let favs = new Set(store.get("favs", []));
let stamps = new Set(store.get("stamps", []));
// tampons du quartier Euratechnologies (récompensent l'exploration autour de Wenov)
const EURA_STAMPS = ["wenov", "cyber", "blan", "pionnieres"];
let euraStamps = new Set(store.get("euraStamps", []));
let medals = store.get("medals", {});        // { comptoir:"Bien", … } : la meilleure mention de chaque mini-jeu
let medalsSub = store.get("medalsSub", {});  // { jardin:{ biotech:"Bien" } } : les parcours réussis d'un jeu à parcours
const MENTION_RANK = ["De justesse", "Assez bien", "Bien", "Très bien"];
let found = new Set(store.get("found", []));
let entered = false, current = null;
let musicWanted = store.get("music", true);

function toast(msg, ms=3200){
	const t = $("toast"); t.textContent = msg; t.classList.add("on");
	t.classList.toggle("side", innerWidth > 720 && $("panel").classList.contains("on"));     // centré dans la partie libre, pas sur la fiche
	clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms);
}
const buzz = ms => { try { if(touch && !reduceMotion && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(ms); } catch(e){} };
function refreshHud(){
	$("carnetN").textContent = favs.size;
	$("btnProfile").innerHTML = profile ? `${PROFILES[profile].icon} <span class="lbl">${PROFILES[profile].label}</span>` : "👤";
	$("btnMusic").textContent = Audio.on ? "🎵" : "🔇";
	$("btnMusic").setAttribute("aria-pressed", String(Audio.on));
	$("moreProfile").innerHTML = profile ? `${PROFILES[profile].icon} ${PROFILES[profile].label} · changer` : "👤 Mon profil";
	$("moreMusic").textContent = Audio.on ? "🎵 Musique : oui" : "🔇 Musique : non";
	buildCarousel();
}
document.querySelectorAll(".profile").forEach(b => {
	b.setAttribute("aria-pressed", String(b.dataset.p === profile));
	b.addEventListener("click", () => {
		profile = b.dataset.p; store.set("profile", profile);
		document.querySelectorAll(".profile").forEach(o => o.setAttribute("aria-pressed", String(o === b)));
		$("go").disabled = false;
	});
});
$("musicPref").checked = musicWanted;
$("go").disabled = !profile;
$("go").addEventListener("click", enter);
function enter(){
	musicWanted = $("musicPref").checked; store.set("music", musicWanted);
	if(musicWanted) Audio.enable(); else Audio.disable();
	$("welcome").classList.add("gone");
	refreshHud();
	if(entered){ if(current) openPanel(current); return; }
	entered = true;
	controls.autoRotate = false;
	$("hud").classList.add("on"); $("pins").classList.add("on");
	buildPins();
	if(!store.get("introSeen", false) && !reduceMotion) playIntro();
	else { flyHome(2.4); setTimeout(afterArrival, 2300); }
}
const startHint = () => isPhone() ? "Fais défiler les cartes du bas pour visiter 👇" : "Commence par l'Hôtel Académique : touche-le pour entrer 🏛️";
function afterArrival(){
	$("dock").classList.add("on");
	if(BORNE) return;
	if(!store.get("onboarded", false)) setTimeout(() => startCoach(), 600);
	else setTimeout(() => !gamePaused && toast(stamps.has("ha") ? "Content de te revoir sur le campus 👋" : startHint(), 4500), 500);
}
$("btnProfile").addEventListener("click", () => { closePanel(); $("welcome").classList.remove("gone"); });
$("btnTheme").addEventListener("click", e => { e.stopPropagation(); $("ambiance").hidden = !$("ambiance").hidden; });
$("btnMetro").addEventListener("click", () => {
	Audio.play("pop"); store.set("metroSeen", true); $("btnMetro").classList.remove("pulse");
	if(tour) stopTour();
	if(current === "nav:metro") closePanel(); else openPanel("nav:metro");
});
if(!store.get("metroSeen", false)) $("btnMetro").classList.add("pulse");      // il clignote doucement tant qu'on ne l'a pas essayé
$("btnMore").addEventListener("click", e => { e.stopPropagation(); Audio.play("pop"); $("ambiance").hidden = !$("ambiance").hidden; });
$("moreProfile").addEventListener("click", () => { $("ambiance").hidden = true; $("btnProfile").click(); });
$("moreMusic").addEventListener("click", () => $("btnMusic").click());
document.addEventListener("click", e => { if(!$("ambiance").hidden && !e.target.closest("#ambiance") && !e.target.closest("#btnTheme") && !e.target.closest("#btnMore")) $("ambiance").hidden = true; });
$("btnMusic").addEventListener("click", () => {
	if(Audio.on){ Audio.disable(); musicWanted = false; } else { Audio.enable(); musicWanted = true; }
	store.set("music", musicWanted); $("musicPref").checked = musicWanted; refreshHud();
});
$("btnHome").addEventListener("click", () => { closePanel(); if(mode !== "ext") exitInterior(); else flyHome(1.4); });

$("close").addEventListener("click", closePanel);
addEventListener("keydown", e => { if(e.key === "Escape" && !$("lead").hidden){ closeLead(); return; } if(e.key === "Escape"){ closePanel(); $("ambiance").hidden = true; if(intro) endIntro(); if(coach) endCoach(); if(tour) stopTour(); } });

/* ---------- Épingles : formations (grandes) et lieux de vie (petites) ---------- */
let pins = [];
function buildPins(){
	$("pins").innerHTML = "";
	let list;
	if(mode !== "ext") list = interiors[mode].pins.map(p => ({ ...p, act:() => interiorAction(p.id), place: interiors[mode].zone ? p.id : undefined }));
	else list = [
		...Object.entries(PLACES).filter(([id]) => id !== "wenov").map(([id,p]) => ({ id, icon:p.icon, name:p.name, pos:p.pin, act:() => selectPlace(id), place:id, game:!!GAME_AT[id] })),
		...Object.entries(LIFE).filter(([,p]) => p.pin).map(([id,p]) => ({ id, icon:p.icon, name:p.name, pos:p.pin, act:() => selectPlace(id), place:id, life:true, game:!!GAME_AT[id] }))
	];
	pins = list.map(p => {
		const b = document.createElement("button");
		b.className = "pin" + (p.life ? " life" : "") + (p.game ? " hasgame" : "");
		b.setAttribute("aria-label", p.name);
		const done = p.place && (mode === "eura" ? euraStamps.has(p.place) : stamps.has(p.place) || found.has(p.place));
		b.innerHTML = `<span><em>${p.icon}</em><i>${p.name}</i><s>${done ? "✓" : ""}</s></span>`;
		b.addEventListener("click", p.act);
		if(p.place){ b.addEventListener("mouseenter", () => setHover(p.place)); b.addEventListener("mouseleave", () => setHover(null)); }
		$("pins").appendChild(b);
		return { ...p, el:b, v:V(...p.pos) };
	});
}
const v3 = new THREE.Vector3(), v3b = new THREE.Vector3();
function updatePins(){
	const W = innerWidth, Hh = innerHeight, shown = [];
	// sur téléphone, la fiche ouverte ne laisse qu'une bande de ciel : seule l'épingle du lieu affiché y reste
	const solo = W <= 720 && panelShift && current, TOP = W <= 720 ? 112 : 96;     // sous la barre du haut
	for(const p of pins){
		v3.copy(p.v).project(camera);
		let x = (v3.x*.5 + .5)*W, y = (-v3.y*.5 + .5)*Hh, edge = false, hide = false;
		const behind = v3.z > 1;
		if(solo && p.place !== current) hide = true;
		else if(p.life){
			const dist = camera.position.distanceTo(p.v);
			p.far = p.far ? dist > 215 : dist > 240;          // hystérésis : pas de clignotement au seuil
			hide = behind || p.far;
		} else if(mode === "ext" && !behind && y < TOP && p.place && (() => { const t = (PLACES[p.place] || LIFE[p.place]).target; if(!t) return false; v3b.set(...t).project(camera); const tx = (v3b.x*.5+.5)*W, ty = (-v3b.y*.5+.5)*Hh; return v3b.z < 1 && tx > 0 && tx < W && ty > 0 && ty < Hh; })()){
			y = TOP;      // le bâtiment est à l'écran : l'épingle reste en haut, sans flèche
		} else if(mode === "ext" && W <= 720 && (behind || x < 16 || x > W - 16 || y < TOP || y > Hh - (carouselOn ? 170 : 80))){
			hide = true;
		} else if(mode === "ext" && W > 720 && (behind || x < 40 || x > W - 40 || y < TOP || y > Hh - 30)){
			// lieu hors champ : l'épingle reste collée au bord, avec une flèche
			if(behind){ x = W - x; y = Hh - y; }
			const cx = W/2, cy = Hh/2, dx = x - cx, dy = y - cy;
			const k = Math.min((W/2 - 70)/Math.abs(dx || 1e-6), (Hh/2 - 70)/Math.abs(dy || 1e-6));
			x = cx + dx*Math.min(k, 1e6); y = cy + dy*Math.min(k, 1e6) + 30;
			edge = true;
		} else if(behind) hide = true;
		p.nx = x; p.ny = y; p.nedge = edge; p.nhide = hide;
		if(!hide) shown.push(p);
	}
	// lisibilité : les épingles des bâtiments ne se recouvrent jamais (elles s'empilent),
	// et une petite épingle « vie de campus » s'efface si elle cache le nom d'un bâtiment
	// (l'épingle active déplie son nom : on la remesure)
	const box = p => { if(!p.w || p.place === hovered){ p.w = p.el.offsetWidth || 120; p.h = p.el.offsetHeight || 36; } return [p.nx - p.w/2 - 4, p.ny - p.h - 10, p.nx + p.w/2 + 4, p.ny + 4]; };
	const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
	const big = shown.filter(p => !p.life).sort((a, b) => a.nedge - b.nedge), placed = [];
	for(const p of big){
		box(p); p.nx = Math.min(Math.max(p.nx, p.w/2 + 8), W - p.w/2 - 8);      // jamais coupée par le bord de l'écran
		for(let n=0; n<4; n++){
			const o = placed.find(q => hit(box(p), q)); if(!o) break;
			p.ny = o[3] + p.h + 12;                              // juste en dessous de l'épingle déjà placée…
			if(p.ny > Hh - 70) p.ny = o[1] - 6;                  // …ou au-dessus si on sort de l'écran
		}
		placed.push(box(p));
	}
	for(const p of shown) if(p.life && placed.some(r => hit(box(p), r))) p.nhide = true;
	for(const p of pins){
		if(p.nhide !== p.hid){ p.el.classList.toggle("hidden", p.nhide); p.hid = p.nhide; }
		if(p.nhide) continue;
		if(p.nedge !== p.edge){ p.el.classList.toggle("edge", p.nedge); p.edge = p.nedge; p.w = 0; }
		const rx = Math.round(p.nx), ry = Math.round(p.ny);
		if(rx !== p.rx || ry !== p.ry){ p.rx = rx; p.ry = ry; p.el.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-100%)`; }
	}
}
/* ---------- Quartier Euratechnologies : on y entre depuis Wenov, on y circule de lieu en lieu ---------- */
function focusEura(id, open = true){
	const p = interiors.eura && interiors.eura.places[id];
	if(!p){ if(open && (LIFE[id] || PLACES[id])) openPanel(id); return; }
	flyTo(V(...p.cam), V(...p.target), 1.4);
	if(open){ openPanel(id); Audio.play("pop"); euraStamp(id); }
}
function euraStamp(id){
	if(!EURA_STAMPS.includes(id) || euraStamps.has(id)) return;
	euraStamps.add(id); store.set("euraStamps", [...euraStamps]);
	for(const pin of pins) if(pin.place === id) pin.el.querySelector("s").textContent = "✓";
	const n = euraStamps.size, p = PLACES[id] || LIFE[id];
	setTimeout(() => {
		Audio.play("stamp"); buzz([20, 60, 30]);
		toast(n === EURA_STAMPS.length ? "🏅 Quartier Euratechnologies complété : tous les tampons sont dans ton carnet !" : `Tampon Euratechnologies : ${p.name} (${n}/${EURA_STAMPS.length})`, 3200);
		if(n === EURA_STAMPS.length){ Audio.play("win"); setTimeout(() => { if(tour) pauseTour(true); openBadge(); }, 2600); }
	}, 900);
}
/* ---------- Badge « Explorateur Euratechnologies » : une image carrée à partager (stories, réseaux) ---------- */
let badgeBlob = null;
function drawBadge(){
	const S = 1080, c = document.createElement("canvas"); c.width = c.height = S; const x = c.getContext("2d");
	const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, "#1e305e"); g.addColorStop(1, "#0b4f6c"); x.fillStyle = g; x.fillRect(0, 0, S, S);
	x.fillStyle = "rgba(33,182,206,.08)"; for(let i=0;i<14;i++){ x.beginPath(); x.arc(S/2, 470, 120 + i*42, 0, 7); x.lineWidth = 2; x.strokeStyle = "rgba(33,182,206,.12)"; x.stroke(); }
	// médaille
	x.beginPath(); x.arc(S/2, 440, 250, 0, 7); x.fillStyle = "#21b6ce"; x.fill();
	x.beginPath(); x.arc(S/2, 440, 226, 0, 7); x.fillStyle = "#fff8ec"; x.fill();
	x.textAlign = "center"; x.fillStyle = "#0b7a8e"; x.font = "800 34px Nunito, Arial"; x.fillText("BADGE", S/2, 300);
	x.fillStyle = "#1e305e"; x.font = "700 64px Fraunces, Georgia, serif"; x.fillText("Explorateur", S/2, 380);
	x.font = "700 46px Fraunces, Georgia, serif"; x.fillText("Euratechnologies", S/2, 440);
	const icons = EURA_STAMPS.map(id => (PLACES[id] || LIFE[id]).icon);
	x.font = "64px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
	icons.forEach((ic, i) => x.fillText(ic, S/2 - 165 + i*110, 545));
	// ruban
	x.fillStyle = "#f2c63c"; x.beginPath(); x.moveTo(S/2 - 300, 690); x.lineTo(S/2 + 300, 690); x.lineTo(S/2 + 270, 760); x.lineTo(S/2 + 300, 830); x.lineTo(S/2 - 300, 830); x.lineTo(S/2 - 270, 760); x.closePath(); x.fill();
	x.fillStyle = "#1e305e"; x.font = "800 34px Nunito, Arial"; x.fillText("4 / 4 tampons · quartier Wenov", S/2, 772);
	x.fillStyle = "#fff8ec"; x.font = "700 30px Nunito, Arial"; x.fillText("Wenov · Campus Cyber · Blan-Lafont · squares des pionnières", S/2, 900);
	x.fillStyle = "rgba(255,248,236,.75)"; x.font = "700 26px Nunito, Arial";
	x.fillText(`Campus FGES en 3D · École du Numérique · ${new Date().toLocaleDateString("fr-FR", { month:"long", year:"numeric" })}`, S/2, 960);
	return new Promise(res => { const logo = new Image(); logo.onload = () => { x.fillStyle = "#fff8ec"; const w = 300, h = w*logo.height/logo.width; x.beginPath(); x.roundRect(S/2 - w/2 - 18, 40, w + 36, h + 28, 18); x.fill(); x.drawImage(logo, S/2 - w/2, 54, w, h); res(c); }; logo.onerror = () => res(c); logo.src = "img/logo-fges.png"; });
}
function openBadge(){
	$("badge").hidden = false; Audio.play("pop");
	drawBadge().then(c => { $("badgeImg").src = c.toDataURL("image/png"); c.toBlob(b => badgeBlob = b, "image/png"); });
}
$("badge").addEventListener("click", async e => {
	const b = e.target.closest("[data-badge]");
	if(e.target === $("badge") || (b && b.dataset.badge === "close")){ $("badge").hidden = true; return; }
	if(!b || !badgeBlob) return;
	const file = new File([badgeBlob], "badge-explorateur-euratechnologies.png", { type:"image/png" });
	const url = location.origin + location.pathname;
	if(b.dataset.badge === "share" && navigator.canShare && navigator.canShare({ files:[file] })){
		try { await navigator.share({ files:[file], title:"Explorateur Euratechnologies", text:`J'ai exploré le quartier de l'École du Numérique en 3D avec la FGES 🏅 ${url}` }); } catch(x){}
		return;
	}
	if(b.dataset.badge === "share" && navigator.share){ try { await navigator.share({ title:"Explorateur Euratechnologies", text:"J'ai exploré le quartier de l'École du Numérique en 3D avec la FGES 🏅", url }); } catch(x){} return; }
	const a = document.createElement("a"); a.href = URL.createObjectURL(badgeBlob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
// vs : la station de Vauban d'où l'on part (Cormontaigne ou Port de Lille)
function goEura(id, vs){
	if(mode === "eura"){ if(id) focusEura(id); return; }
	if(mode === "wenovin"){ enterInterior("eura", () => id && focusEura(id), true); return; }
	vs = vs || store.get("lastStation", "cormontaigne");
	store.set("lastStation", vs);
	rideMetro(true, () => loadInterior("eura").then(() => placeIn("eura")), () => {
		// première venue : visite guidée du quartier ; ensuite, droit au lieu demandé
		const first = !store.get("euraToured", false);
		const p = interiors.eura.places[id || "wenov"];
		playCine(interiors.eura.arrival, "arrive", V(...p.cam), V(...p.target), () => {
			if(first){ store.set("euraToured", true); startTour(); }
			else if(id) focusEura(id);
			else toast(WELCOME.eura, 4200);
		});
	}, vs);
}
// retour vers Vauban : la rame quitte Canteleu en 3D, trajet, puis elle entre en station à Cormontaigne ou Port de Lille
function rideBack(vs, then){
	if(!vStations[vs]) vs = "cormontaigne";
	store.set("lastStation", vs);
	const p = LIFE[vs];
	playCine(interiors.eura.arrival, "depart", camera.position.clone(), controls.target.clone(), () => {
		rideMetro(false, () => placeExt(vs), () => {
			playCine(vStations[vs], "arrive", V(...p.cam), V(...p.target), () => { if(then) then(); else toast(`Retour au campus Vauban par ${p.name.replace("Métro ", "la station ")} 👋`, 3200); });
		}, vs);
	});
}
/* Cinématiques de métro en 3D (arrivée ou départ de la rame dans une station souterraine) */
let cine = null;
function playCine(A, kind, a, b, done){
	if(!A || reduceMotion){ if(kind === "arrive"){ camera.position.copy(a); controls.target.copy(b); } done(); return; }
	controls.enabled = false; $("pins").classList.remove("on"); $("dock").classList.remove("on");
	A.start(kind, a, b);
	cine = { A, kind, done, end:[a.clone(), b.clone()], fov:camera.fov };
	$("cineSkip").hidden = false;
	cine.chime = setTimeout(() => Audio.play("good"), kind === "arrive" ? 4500 : 3400);     // portes qui s'ouvrent / se ferment
	cine.voice = setTimeout(() => announce(kind === "arrive" ? (A.name || "") : "Attention à la fermeture des portes."), kind === "arrive" ? 3800 : 2700);
}
function endArrival(skipped){
	if(!cine) return;
	const cine0 = cine, { A, kind, done, end } = cine; clearTimeout(cine.chime); clearTimeout(cine.voice); cine = null;
	A.stop(); controls.enabled = true; $("pins").classList.add("on"); $("cineSkip").hidden = true; $("fade").classList.remove("on");
	$("dock").classList.add("on");
	if(camera.fov !== cine0.fov){ camera.fov = cine0.fov; camera.updateProjectionMatrix(); }
	if(skipped && kind === "arrive"){ camera.position.copy(end[0]); controls.target.copy(end[1]); }
	done();
}
$("cineSkip").addEventListener("click", () => { Audio.play("pop"); endArrival(true); });
function interiorAction(id){
	if(mode === "eura"){ focusEura(id); return; }
	if(mode === "wenovin"){
		if(id === "sortir") exitInterior();
		else if(id === "robot") openGame("spi");
		else { const I = interiors.wenovin, p = I.spots[id]; if(p) flyTo(V(...p.cam), V(...p.target), 1.2); openPanel(id === "salle" ? "wenov" : id); Audio.play("pop"); }
		return;
	}
	if(id === "comptoir") openGame("gestion");
	else if(id === "salles") openPanel("falise");
	else if(id === "sortir") exitInterior();
	else if(id === "cloches"){ Audio.play("chime"); if(!Audio.on) toast("🔔 Dong ! (active le son 🎵 pour entendre les cloches)", 2600); }
	else if(id === "vitraux"){ interiors.chapelle.lightUp(); Audio.play("stamp"); toast("Les vitraux ont été restaurés en 2020 avec toute la chapelle ✨", 3600); }
}

/* ---------- Survol et clic dans la scène ---------- */
let hovered = null;
const placeMats = id => (PLACES[id] && PLACES[id].mats) ? Object.values(PLACES[id].mats) : (city.pois[id] ? city.pois[id].mats : (id === "chapelle" ? Object.values(PLACES.ha.mats) : []));
let tinted = new Set(), matchSet = new Set();
function tint(id, on){
	for(const m of placeMats(id)) if(m){
		if(m.map) on ? m.color.setRGB(1.25,1.18,1.08) : m.color.setRGB(1,1,1);
		else if(m.emissive && m.emissiveMap == null) on ? m.emissive.setRGB(.09,.055,.02) : m.emissive.setRGB(0,0,0);
	}
}
function refreshTints(){
	const want = new Set(matchSet); if(hovered) want.add(hovered);
	for(const id of tinted) if(!want.has(id)) tint(id, false);
	for(const id of want) if(!tinted.has(id)) tint(id, true);
	tinted = want;
}
function setHover(id){
	if(hovered === id) return;
	hovered = id;
	for(const p of pins){ p.el.classList.toggle("hover", p.place === id && !!id); p.w = 0; }
	refreshTints();
	renderer.domElement.style.cursor = id ? "pointer" : "";
}
/* Résultats de recherche : les bâtiments concernés s'allument, avec le nombre de formations. */
function setMatches(counts){
	matchSet = new Set(counts ? Object.keys(counts) : []);
	for(const p of pins){
		if(p.life || !p.place) continue;
		const n = counts && counts[p.place];
		p.el.classList.toggle("match", !!n);
		p.el.classList.toggle("dim", !!counts && !n);
		let b = p.el.querySelector(".cnt");
		if(n){ if(!b){ b = document.createElement("b"); b.className = "cnt"; p.el.querySelector("span").appendChild(b); } b.textContent = n; }
		else if(b) b.remove();
	}
	refreshTints();
}
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
function hitAt(cx, cy){
	ptr.set(cx/innerWidth*2-1, -(cy/innerHeight)*2+1);
	ray.setFromCamera(ptr, camera);
	return ray.intersectObjects(mode !== "ext" ? (interiors[mode].pickables || []) : pickables, false)[0] || null;      // le quartier et Wenov n'ont pas de bâtiment cliquable
}
let down = null, lastChime = -99;
renderer.domElement.addEventListener("pointerdown", e => { down = { x:e.clientX, y:e.clientY }; if(tour && !tour.paused) pauseTour(true); });
renderer.domElement.addEventListener("pointerup", e => {
	if(!down || !entered || intro) return;
	const moved = Math.hypot(e.clientX-down.x, e.clientY-down.y); down = null;
	if(moved >= 7) return;
	const hit = hitAt(e.clientX, e.clientY);
	if(!hit) return;
	if(mode !== "ext"){ if(hit.object.userData.spot) interiorAction(hit.object.userData.spot); return; }
	if(hit.object.userData.chime) ringBells();
	selectPlace(hit.object.userData.place);
});
renderer.domElement.addEventListener("pointermove", e => {
	if(!entered || e.pointerType !== "mouse" || e.buttons || intro) return;
	const hit = hitAt(e.clientX, e.clientY);
	if(mode !== "ext"){ renderer.domElement.style.cursor = hit ? "pointer" : ""; return; }
	setHover(hit ? hit.object.userData.place : null);
});
function ringBells(){
	const now = clock.elapsedTime;
	if(now - lastChime < 8) return;
	lastChime = now;
	Audio.play("chime");
	setTimeout(scarePigeons, 250);
	if(!Audio.on) toast("🔔 Dong ! (active le son 🎵 pour entendre le carillon)", 2600);
}

/* ---------- Panneau ---------- */
function formationCard(f){
	const meta = [f.seats ? `${f.seats} places` : null, f.rhythm].filter(Boolean).join(" · ");
	const game = GAMES[f.id];
	return `<article class="fcard ${game ? "has-game" : ""}">
		<div class="top"><span class="school s-${f.school}">${f.school}</span><button class="fav" data-fav="${f.id}" aria-pressed="${favs.has(f.id)}" aria-label="Ajouter au carnet">${favs.has(f.id) ? "♥" : "♡"}</button></div>
		<h4 data-detail="${f.id}" role="button" tabindex="0" style="cursor:pointer">${f.name}</h4><p class="meta">${meta}</p><p class="pitch">${f.pitch}</p>
		<button class="btn alt" data-detail="${f.id}" style="margin-top:10px;padding:10px">📖 Programme, débouchés, admission</button>
		${game ? `<button class="play" data-game="${f.id}">${GAME_INFO[game].icon} Jouer : ${GAME_INFO[game].title}</button>` : ""}
		<div class="row">${game ? `<span class="soon ok">${GAME_INFO[game].icon} ${GAME_INFO[game].title}</span>` : `<span class="soon">🎮 Mini-jeu bientôt</span>`}<a class="link" href="${f.url}" target="_blank" rel="noopener">Voir la fiche →</a></div>
	</article>`;
}
const listFor = place => F.filter(f => f.place === place && PROFILES[profile].levels.includes(f.level));
function groupBySchool(list){
	const order = ["FGES","ISEA","EDN"], names = { FGES:"FGES", ISEA:"ISEA · École d'expertise et d'audit", EDN:"École du Numérique" };
	return order.filter(s => list.some(f => f.school === s))
		.map(s => `<h3>${names[s]}</h3>` + list.filter(f => f.school === s).map(formationCard).join("")).join("");
}
function otherPlaceHint(place){
	const others = ["falise","wenov","ha"].filter(p => p !== place && listFor(p).length);
	return others.length ? `Pour ton profil, va plutôt voir : <b>${others.map(p => PLACES[p].name).join("</b> ou <b>")}</b>.` : "";
}
function haBody(){
	const tip = `<div class="tipline">🔔 Psst… touche la tour de l'horloge.</div>`;
	if(profile === "lycee") return `<h3>Ton parcours</h3><ol class="steps">
		<li><b>Explore</b> le bâtiment Michel Falise (juste derrière) et Wenov : c'est là qu'ont lieu les licences.</li>
		<li><b>Joue</b> et garde les formations qui te plaisent dans ton carnet avec le ♡.</li>
		<li><b>Candidate</b> sur Parcoursup en formulant tes vœux.</li></ol>
		<a class="btn main" href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener">Ouvrir Parcoursup</a>
		<button class="btn alt" data-carnet>📒 Voir mon carnet</button>${tip}`;
	if(profile === "bac3") return `<h3>Ton parcours</h3><ol class="steps">
		<li><b>Explore</b> Michel Falise (masters FGES et ISEA) et Wenov (masters du numérique et de la finance).</li>
		<li><b>Garde</b> tes masters préférés dans ton carnet avec le ♡.</li>
		<li><b>Candidate</b> en M1 sur Mon Master. En M2 ou hors Espace économique européen : plateforme Agora.</li></ol>
		<a class="btn main" href="https://www.monmaster.gouv.fr/" target="_blank" rel="noopener">Ouvrir Mon Master</a>
		<button class="btn alt" data-carnet>📒 Voir mon carnet</button>${tip}`;
	return `<h3>Formation continue</h3>${listFor("ha").map(formationCard).join("")}
		<div class="empty">Les autres DU sont au bâtiment Michel Falise (ISEA) et à Wenov (cyber, IA).</div>${tip}`;
}
function carnetBody(){
	const list = F.filter(f => favs.has(f.id));
	const st = Object.keys(PLACES).map(id => `<div class="stamp ${stamps.has(id) ? "got" : ""}"><i>${PLACES[id].icon}</i>${PLACES[id].name.replace("Bâtiment ","")}</div>`).join("");
	const lifeIds = Object.keys(LIFE).filter(id => LIFE[id].pin);
	const lf = lifeIds.map(id => `<span class="lifechip ${found.has(id) ? "got" : ""}" title="${LIFE[id].name}">${LIFE[id].icon}</span>`).join("");
	const gk = Object.keys(GAME_INFO), won = gk.filter(k => medals[k]);
	const md = gk.map(k => `<button class="medal ${medals[k] ? "got" : ""}" data-game="${GAME_INFO[k].fid}" title="${GAME_INFO[k].title}"><i>${medals[k] ? "🏅" : GAME_INFO[k].icon}</i><b>${GAME_INFO[k].title}</b><small>${medals[k] ? "Mention " + medals[k] : "À jouer"}${GAME_INFO[k].parcours ? ` · ${Object.keys(medalsSub[k] || {}).length}/${GAME_INFO[k].parcours.length} parcours` : ""}</small></button>`).join("");
	return `<h3>Mes médailles (${won.length}/${gk.length})</h3><div class="medals">${md}</div>
		<h3>Tampons de visite</h3><div class="stamps">${st}</div>
		${euraStamps.size >= EURA_STAMPS.length ? `<button class="badgebtn" data-openbadge><i>🏅</i><span><b>Badge Explorateur Euratechnologies</b><small>Revoir et partager mon badge</small></span></button>` : ""}
		<h3>Tampons Euratechnologies (${EURA_STAMPS.filter(id => euraStamps.has(id)).length}/${EURA_STAMPS.length})</h3><div class="stamps">${EURA_STAMPS.map(id => { const p = PLACES[id] || LIFE[id]; return `<div class="stamp ${euraStamps.has(id) ? "got" : ""}"><i>${p.icon}</i>${p.name.replace("Campus ", "").replace("Les squares des pionnières", "Pionnières")}</div>`; }).join("")}</div>
		<h3>Lieux de vie découverts (${lifeIds.filter(id => found.has(id)).length}/${lifeIds.length})</h3><div class="lifes">${lf}</div>
		<h3>Mes formations (${list.length})</h3>
		${list.length ? list.map(formationCard).join("") : `<div class="empty">Ton carnet est vide. Entre dans un bâtiment et touche ♡ sur une formation.</div>`}
		${list.length ? `<button class="btn main" data-plaquette>📄 Recevoir les plaquettes de mon carnet</button>` : ""}`;
}
function linksHTML(p){
	if(!p || !p.links || !p.links.length) return "";
	return `<h3>En savoir plus</h3><div class="links">` + p.links.map(l => `<a class="btn link-out" href="${l.url}" target="_blank" rel="noopener">${l.label}<span aria-hidden="true">↗</span></a>`).join("") + `</div>`;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" })[c]);
const norm = t => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const HAY = Object.fromEntries(F.map(f => { const d = DETAILS[f.id] || {}; return [f.id, norm([f.name, f.pitch, f.school, f.rhythm, (d.p || []).map(x => x.join(" ")).join(" "), d.j || "", d.a || "", d.k || "", PLACES[f.place] ? PLACES[f.place].name : ""].join(" "))]; }));
const LVL = { L:["prep","L"], M:["LP","M"], DU:["DU"], tout:["prep","L","LP","M","DU"] };
let fq = "", flv = "toi", panelBack = null;
function searchFormations(){
	const levels = flv === "toi" ? PROFILES[profile].levels : LVL[flv];
	const toks = norm(fq).split(/\s+/).filter(Boolean);
	return F.filter(f => levels.includes(f.level) && toks.every(t => HAY[f.id].includes(t)));
}
function renderFList(){
	const res = searchFormations(), by = {};
	res.forEach(f => (by[f.place] = by[f.place] || []).push(f));
	$("flist").innerHTML = res.length ? ["falise","wenov","ha"].filter(p => by[p]).map(p =>
		`<div class="grp"><h3>${PLACES[p].icon} ${PLACES[p].name} · ${by[p].length}</h3><button data-fly="${p}">📍 Voir</button></div>` +
		by[p].map(f => `<button class="frow" data-detail="${f.id}"><span class="tx"><b>${f.name}</b><small>${f.school} · ${f.rhythm}</small></span>${GAMES[f.id] ? '<span class="g" title="Mini-jeu">🎮</span>' : ""}${favs.has(f.id) ? '<span class="g">♥</span>' : ""}<span class="chev">›</span></button>`).join("")
	).join("") : `<div class="noresult">Aucune formation ne correspond${fq ? ` à « ${esc(fq)} »` : ""}. Essaie un autre mot ou le filtre « Tout ».</div>`;
	setMatches(fq || flv !== "toi" ? Object.fromEntries(Object.entries(by).map(([k,v]) => [k, v.length])) : null);
}
function candidater(f){
	if(f.level === "prep" || f.level === "L") return `<a class="btn alt wide" href="https://www.parcoursup.gouv.fr/" target="_blank" rel="noopener">Candidater sur Parcoursup ↗</a>`;
	if(f.level === "M") return `<a class="btn alt wide" href="https://www.monmaster.gouv.fr/" target="_blank" rel="noopener">Candidater en M1 sur Mon Master ↗</a>`;
	return `<a class="btn alt wide" href="${f.url}" target="_blank" rel="noopener">Comment candidater ↗</a>`;
}
function detailView(f){
	const d = DETAILS[f.id] || {}, P = PLACES[f.place];
	const backLbl = panelBack === "nav:formations" ? "Formations" : panelBack === "carnet" ? "Mon carnet" : panelBack && (PLACES[panelBack] || LIFE[panelBack]) ? (PLACES[panelBack] || LIFE[panelBack]).name : null;
	const head = `${backLbl ? `<button class="back" data-back>← ${backLbl}</button>` : ""}<div class="kick">${f.school} · ${P ? P.name : ""}</div><h2>${f.name}</h2><p>${f.pitch}</p>
		<div class="facts">${[f.seats ? `${f.seats} places` : null, f.rhythm].filter(Boolean).map(x => `<span>${x}</span>`).join("")}</div>`;
	const gk = GAMES[f.id], g = gk && GAME_INFO[gk];
	const teaser = g ? `<button class="gteaser" data-game="${f.id}"><span class="gic">${g.icon}</span><span><b>${g.title}</b><small>Le mini-jeu de cette formation · ${g.dur}${medals[gk] ? ` · 🏅 ${medals[gk]}` : ""}</small></span><span class="gplay">${medals[gk] ? "Rejouer" : "Jouer"} ▶</span></button>` : "";
	const body = teaser + (d.p ? `<h3>Au programme</h3><ul class="prog">${d.p.map(([k,v]) => `<li><b>${k}</b><span>${v}</span></li>`).join("")}</ul>` : "") +
		(d.j ? `<div class="info"><b>Et après ?</b> ${d.j}</div>` : "") +
		(d.a ? `<div class="info"><b>Admission :</b> ${d.a}</div>` : "") +
		`<div class="acts">
			<button class="btn main wide" data-lead="${f.id}">📄 Recevoir la plaquette</button>
			<button class="btn alt" data-favd="${f.id}">${favs.has(f.id) ? "♥ Dans mon carnet" : "♡ Garder"}</button>
			<button class="btn alt" data-fly="${f.place}">📍 Voir le bâtiment</button>
			${candidater(f)}
			<a class="more wide" href="${f.url}" target="_blank" rel="noopener">Fiche officielle sur fges.fr ↗</a>
		</div>
		<div class="stickycta"><button class="btn alt fv" data-favd="${f.id}" data-short aria-label="Garder dans mon carnet">${favs.has(f.id) ? "♥" : "♡"}</button><button class="btn main" data-lead="${f.id}">📄 Recevoir la plaquette</button></div>`;
	return [head, body];
}
function gameHere(id){
	return (GAME_AT[id] || []).map(k => { const g = GAME_INFO[k];
		return `<button class="gteaser" data-game="${g.fid}"><span class="gic">${g.icon}</span><span><b>${g.title}</b><small>${F.find(f => f.id === g.fid).name} · ${g.dur}${medals[k] ? ` · 🏅 ${medals[k]}` : ""}</small></span><span class="gplay">${medals[k] ? "Rejouer" : "Jouer"} ▶</span></button>`; }).join("");
}
let justWon = null;      // après une victoire, la vue Jeux félicite et suggère la suite
function jeuxView(){
	const mine = PROFILES[profile].levels;
	const list = Object.entries(GAME_INFO).map(([k, g]) => ({ k, g, f:F.find(f => f.id === g.fid) }))
		.sort((a, b) => (a.k === justWon) - (b.k === justWon) || (!!medals[a.k]) - (!!medals[b.k]) || mine.includes(b.f.level) - mine.includes(a.f.level));
	const won = Object.keys(GAME_INFO).filter(k => medals[k]).length, total = Object.keys(GAME_INFO).length;
	const head = `<div class="kick">Mini-jeux · ${won}/${total} médaille${won > 1 ? "s" : ""}</div><h2>Joue une formation</h2>
		<p>Chaque jeu te fait vivre une formation en quelques minutes, avec de vrais exercices de cours.</p>`;
	const wf = justWon && GAME_INFO[justWon].fid;
	const banner = justWon ? `<div class="wonbar">🏅 Médaille <b>${GAME_INFO[justWon].title}</b> : mention ${medals[justWon]} !
		<div class="wonacts"><button class="btn main" data-lead="${wf}">📄 Recevoir la plaquette</button><button class="btn alt" data-favd="${wf}">${favs.has(wf) ? "♥ Dans mon carnet" : "♡ Garder"}</button></div>
		<small>Tu as aimé ? Essaie aussi :</small></div>` : "";
	const card = ({ k, g, f }) => `<div class="gcard ${medals[k] ? "got" : ""}">
			<div class="gtop"><span class="gic">${g.icon}</span><span><b>${g.title}</b><small>${f.name}</small></span>${medals[k] ? `<span class="gmed" title="Mention ${medals[k]}">🏅</span>` : ""}</div>
			<p>${g.pitch}</p>
			${g.parcours ? `<div class="gpar">${g.parcours.map(([id, ic, n]) => `<span class="${medalsSub[k] && medalsSub[k][id] ? "got" : ""}" title="${medalsSub[k] && medalsSub[k][id] ? "Mention " + medalsSub[k][id] : "À découvrir"}">${ic} ${n}${medalsSub[k] && medalsSub[k][id] ? " ✓" : ""}</span>`).join("")}</div>` : ""}
			<div class="gmeta"><button data-place="${g.where}">📍 ${g.whereLabel}</button><span>⏱️ ${g.dur}</span>${mine.includes(f.level) ? "" : `<span>${f.level === "M" ? "Master" : f.level === "DU" ? "Formation continue" : "Licence"}</span>`}</div>
			<button class="play wide" data-game="${g.fid}">${medals[k] ? `Rejouer · mention ${medals[k]}` : "🎮 Jouer"}</button>
		</div>`;
	const body = banner + list.map(card).join("") + `<div class="empty">D'autres jeux arrivent : un par formation, conçus avec leurs enseignants.</div>`;
	justWon = null;
	return [head, body];
}
/* Le métro : raccourci toujours visible (bouton M de la barre du haut) vers les stations de la ligne 2 */
function metroView(){
	const strip = `<div class="mstrip">${LINE2.map(n => `<span>${n.replace(" – ", "<br>")}</span>`).join("")}</div>`;
	if(mode === "eura" || mode === "wenovin"){
		const head = `<div class="kick">Ligne 2 · métro VAL</div><h2>Retour au campus Vauban</h2><p>La station Canteleu – Euratechnologies est à quelques minutes de Wenov. Choisis ta station d'arrivée :</p>`;
		const body = strip + [["portdelille", 2], ["cormontaigne", 3]].map(([id, n]) => `<div class="mline"><i>M</i><span><b>${LIFE[id].name.replace("Métro ", "")}</b><small>${n} stations · ${LIFE[id].kicker.replace("Ligne 2 · ", "")}</small>
			<div class="acts2"><button class="btn main" data-go="vauban:${id}">🚇 Y aller</button></div></span></div>`).join("") +
			(mode === "eura" ? `<button class="btn alt" data-place="metro">📍 Voir la station Canteleu – Euratechnologies</button>` : "");
		return [head, body];
	}
	const head = `<div class="kick">Ligne 2 · métro VAL</div><h2>Le métro vers Wenov</h2><p>Le campus de l'École du Numérique, au cœur d'Euratechnologies, n'est qu'à quelques stations. Choisis ta station de départ :</p>`;
	const body = strip + [["cormontaigne", 3], ["portdelille", 2]].map(([id, n]) => `<div class="mline"><i>M</i><span><b>${LIFE[id].name.replace("Métro ", "")}</b><small>${n} stations jusqu'à Wenov · ${LIFE[id].kicker.replace("Ligne 2 · ", "")}</small>
		<div class="acts2"><button class="btn main" data-go="eura:${id}">🚇 Partir vers Wenov</button><button class="btn alt" data-place="${id}">📍 Voir la station</button></div></span></div>`).join("");
	return [head, body];
}
function lieuxView(){
	const row = (id, p, sub, done) => `<button class="lieu" data-place="${id}"><span class="ic">${p.icon}</span><span><b>${p.name}</b><small>${sub}</small></span>${done ? '<span class="ok">✓</span>' : ""}</button>`;
	const head = `<div class="kick">Explorer</div><h2>Les lieux du campus</h2><p>Touche un lieu : la caméra t'y emmène.</p>`;
	const body = `<h3>Bâtiments des formations</h3>` + Object.entries(PLACES).map(([id,p]) => row(id, p, p.kicker, stamps.has(id))).join("") +
		`<h3>À visiter à l'intérieur</h3>
		<button class="lieu" data-go="atrium"><span class="ic">✨</span><span><b>L'atrium de Michel Falise</b><small>Le Comptoir et son mini-jeu</small></span></button>
		<button class="lieu" data-go="chapelle"><span class="ic">⛪</span><span><b>La chapelle universitaire</b><small>Voûtes, vitraux et cloches</small></span></button>
		<h3>Quartier Euratechnologies · École du Numérique</h3>
		<button class="lieu" data-go="eura"><span class="ic">🏙️</span><span><b>Explorer le quartier en 3D</b><small>Wenov, le Blan-Lafont, la Deûle, le métro ligne 2</small></span></button>` +
		Object.entries(LIFE).filter(([,p]) => p.zone === "eura").map(([id,p]) => row(id, p, p.kicker, false)).join("") +
		`<h3>Vie de campus</h3>` + Object.entries(LIFE).filter(([,p]) => p.pin).map(([id,p]) => row(id, p, p.kicker, found.has(id))).join("");
	return [head, body];
}
function syncDock(){
	const on = { formations: current === "nav:formations", lieux: current === "nav:lieux", jeux: current === "nav:jeux", carnet: current === "carnet", visite: !!tour };
	document.querySelectorAll("[data-dock]").forEach(b => b.setAttribute("aria-pressed", String(!!on[b.dataset.dock])));
}
function openPanel(id){
	if(!(String(id).startsWith("f:"))) panelBack = null;
	current = id;
	let head, body;
	if(id === "nav:formations"){
		head = `<div class="kick">Trouver ta formation</div><h2>Formations</h2>
			<div class="search"><input id="fsearch" type="search" placeholder="Data, finance, biologie, alternance…" value="${esc(fq)}" autocomplete="off" aria-label="Rechercher une formation"></div>
			<div class="fchips" id="fchips">${[["toi","Pour toi"],["L","Licences"],["M","Masters"],["DU","Formation continue"],["tout","Tout"]].map(([k,l]) => `<button data-flv="${k}" aria-pressed="${flv === k}">${l}</button>`).join("")}</div>`;
		body = `<div id="flist"></div>`;
	} else if(id === "nav:lieux"){
		[head, body] = lieuxView();
	} else if(id === "nav:jeux"){
		[head, body] = jeuxView();
	} else if(id === "nav:metro"){
		[head, body] = metroView();
	} else if(String(id).startsWith("f:")){
		const f = F.find(x => x.id === id.slice(2));
		[head, body] = detailView(f);
	} else if(id === "carnet"){
		head = `<div class="kick">Ton carnet</div><h2>Mon carnet de campus</h2><p>Tes tampons, les lieux découverts et les formations que tu as gardées.</p>`;
		body = carnetBody();
	} else if(LIFE[id]){
		const p = LIFE[id];
		head = `<div class="kick">${p.zone === "eura" ? "Euratechnologies" : "Vie de campus"} · ${p.kicker}</div><h2>${p.icon} ${p.name}</h2><p>${p.text}</p><div class="facts">${p.facts.map(f => `<span>${f}</span>`).join("")}</div>`;
		body = (id === "metro" && mode === "eura"
				? `<button class="btn atrium eura" data-go="vauban:portdelille">🚇 Vers Port de Lille · 2 stations</button><button class="btn atrium eura" data-go="vauban:cormontaigne">🚇 Vers Cormontaigne · 3 stations</button>`
				: p.action ? `<button class="btn atrium${p.metro ? " eura" : ""}" data-go="${p.action.go}">${p.action.label}</button>` : "") + gameHere(id) +
			(p.zone === "eura" ? `<h3>Et les formations ?</h3><div class="empty">L'<b>École du Numérique</b> et plusieurs masters FGES ont leurs cours dans <b>Wenov</b>, au cœur du quartier.</div><button class="btn alt" data-place="wenov">💡 Les formations de Wenov</button>`
			: `<h3>Et les formations ?</h3><div class="empty">Elles t'attendent à l'<b>Hôtel Académique</b>, au <b>bâtiment Michel Falise</b> et à <b>Wenov</b>.</div><button class="btn alt" data-place="falise">🧱 Aller à Michel Falise</button>`);
	} else {
		const p = PLACES[id];
		head = `<div class="kick">${p.kicker}</div><h2>${p.name}</h2><p>${p.text}</p><div class="facts">${p.facts.map(f => `<span>${f}</span>`).join("")}</div>`;
		if(id === "ha") body = haBody();
		else {
			const list = listFor(id);
			body = list.length ? groupBySchool(list) : `<div class="empty">Pas de formation pour ton profil ici. ${otherPlaceHint(id)}</div>`;
			if(id === "falise" && mode === "ext") body = `<button class="btn atrium" data-go="atrium">✨ Entrer dans l'atrium</button>` + body;
			if(id === "wenov" && mode === "ext") body = `<button class="btn atrium eura" data-go="eura">🚇 Prendre le métro jusqu'à Wenov</button>` + body;
			if(id === "wenov" && mode === "eura") body = `<button class="btn atrium eura" data-go="wenovin">✨ Entrer dans Wenov</button>` + body;
			body = gameHere(id) + body;
		}
	}
	if(!String(id).startsWith("nav:") && !String(id).startsWith("f:")) body += linksHTML(LIFE[id] || PLACES[id]);
	$("phead").innerHTML = head; $("pbody").innerHTML = body; $("pbody").scrollTop = 0;
	if(isPhone() && !$("panel").classList.contains("on")){ sheet.h = sheetSnaps()[1]; $("panel").style.height = sheet.h + "px"; }
	$("panel").classList.add("on");
	panelShift = true;
	$("toast").classList.toggle("side", innerWidth > 720);          // un message déjà affiché se range à côté de la fiche
	if(id === "nav:formations"){
		const inp = $("fsearch");
		inp.addEventListener("input", () => { fq = inp.value; renderFList(); });
		renderFList();
		if(matchMedia("(pointer:fine)").matches) setTimeout(() => inp.focus({ preventScroll:true }), 350);
	} else setMatches(null);
	syncDock();
}
function closePanel(){ $("panel").classList.remove("on"); current = null; panelShift = false; setMatches(null); syncDock(); }
$("panel").addEventListener("click", e => {
	if(e.target.closest("#close")) return;
	const lv = e.target.closest("[data-flv]"); if(lv){ flv = lv.dataset.flv; document.querySelectorAll("[data-flv]").forEach(b => b.setAttribute("aria-pressed", String(b === lv))); renderFList(); return; }
	if(e.target.closest("[data-back]")){ const b = panelBack; openPanel(b); return; }
	const det = e.target.closest("[data-detail]"); if(det){ if(!String(current).startsWith("f:")) panelBack = current; openPanel("f:" + det.dataset.detail); Audio.play("pop"); return; }
	const fd = e.target.closest("[data-favd]"); if(fd){
		toggleFav(fd.dataset.favd); const on = favs.has(fd.dataset.favd);
		$("pbody").querySelectorAll(`[data-favd="${fd.dataset.favd}"]`).forEach(b => b.textContent = b.hasAttribute("data-short") ? (on ? "♥" : "♡") : on ? "♥ Dans mon carnet" : "♡ Garder");
		if(on) buzz(15);
		return; }
	const fl = e.target.closest("[data-fly]"); if(fl){ if(fl.dataset.fly === "wenov") goEura("wenov"); else flyToPlace(fl.dataset.fly); return; }
	const fav = e.target.closest("[data-fav]");
	if(fav){ toggleFav(fav.dataset.fav); fav.setAttribute("aria-pressed", String(favs.has(fav.dataset.fav))); fav.textContent = favs.has(fav.dataset.fav) ? "♥" : "♡"; if(current === "carnet" && !favs.has(fav.dataset.fav)) openPanel("carnet"); return; }
	const g = e.target.closest("[data-game]"); if(g){ openGame(g.dataset.game); return; }
	if(e.target.closest("[data-openbadge]")){ openBadge(); return; }
	const go = e.target.closest("[data-go]"); if(go){
		const [k, arg] = go.dataset.go.split(":");
		if(k === "vauban") mode === "wenovin" ? exitInterior(false, () => exitInterior(false, null, arg)) : exitInterior(false, null, arg);
		else if(k === "eura") goEura(null, arg); else enterInterior(go.dataset.go);
		return; }
	const pl = e.target.closest("[data-place]"); if(pl){ selectPlace(pl.dataset.place); return; }
	if(e.target.closest("[data-carnet]")) openPanel("carnet");
	if(e.target.closest("[data-plaquette]")) openLead([...favs]);
	const ld = e.target.closest("[data-lead]"); if(ld) openLead([ld.dataset.lead]);
});
function toggleFav(id){
	if(favs.has(id)) favs.delete(id); else { favs.add(id); toast("Ajouté à ton carnet 📒", 1600); Audio.play("pop"); }
	store.set("favs", [...favs]); refreshHud();
}
function openGame(fid){
	const f = F.find(x => x.id === fid);
	const kind = GAMES[fid];
	if(!f || !GAME_LOADERS[kind]) return;
	$("ambiance").hidden = true;
	let won = false, mention = null;
	gamePaused = true;
	GAME_LOADERS[kind]().then(open => open({
		openLead:() => openLead([fid]),
		formation:f, audio:Audio,
		isFav:() => favs.has(fid), toggleFav:() => toggleFav(fid),
		onEvent:(ev, v, sub) => {
			if(ev !== "win") return;
			won = true; mention = v;
			if(sub){ const m = { ...(medalsSub[kind] || {}) }; if(MENTION_RANK.indexOf(v) > MENTION_RANK.indexOf(m[sub])) m[sub] = v; medalsSub = { ...medalsSub, [kind]:m }; store.set("medalsSub", medalsSub); }
			if(MENTION_RANK.indexOf(v) > MENTION_RANK.indexOf(medals[kind])){ medals = { ...medals, [kind]:v }; store.set("medals", medals); }
		},
		onClose:() => {
			gamePaused = false;
			const suggest = () => { justWon = kind; openPanel("nav:jeux"); };
			if(won && kind === "comptoir"){
				const party = () => { interiors.atrium.celebrate(); Audio.play("win"); toast("🎓 Bravo, diplômé·e ! Toute l'atrium fête ta réussite !", 4500); setTimeout(suggest, 4200); };
				if(mode === "atrium") party(); else enterInterior("atrium", party);
			} else if(won){ Audio.play("win"); buzz([30, 70, 30, 70, 60]); suggest(); }      // le bandeau de la vue Jeux annonce la médaille
			else if(current) openPanel(current);
		}
	})).catch(() => { gamePaused = false; toast("Impossible de lancer le mini-jeu : vérifie ta connexion.", 3500); });
}
function flyToPlace(id, dur){
	if(mode === "eura" && interiors.eura.places[id]){ focusEura(id, false); return true; }
	const p = PLACES[id] || LIFE[id];
	if(!p || !p.target) return false;
	if(mode !== "ext"){ exitInterior(false, () => flyToPlace(id, dur)); return true; }
	const tg = V(...p.target), a = innerWidth/innerHeight;
	const k = a < 1 ? THREE.MathUtils.clamp(1.6/a, 1.6, 3) : 1;
	flyTo(V(...p.cam).sub(tg).multiplyScalar(k).add(tg), tg, dur || (id === "wenov" || id === "citadelle" ? 3.2 : 1.5));
	return true;
}
function selectPlace(id){
	setHover(null);
	if((mode === "eura" && interiors.eura.places[id]) || (LIFE[id] && LIFE[id].zone === "eura") || id === "wenov"){ if(tour) stopTour(); if(id === "wenov") markVisited(id); goEura(id); return; }
	const p = PLACES[id] || LIFE[id];
	if(!p || !p.target) return;
	if(tour) stopTour();
	if(mode !== "ext"){ exitInterior(false, () => selectPlace(id)); return; }
	lastPlace = id;
	flyToPlace(id);
	openPanel(id);
	Audio.play("pop");
	markVisited(id);
}
function markVisited(id){
	const p = PLACES[id] || LIFE[id];
	const mark = () => { for(const pin of pins) if(pin.place === id) pin.el.querySelector("s").textContent = "✓"; };
	if(PLACES[id] && !stamps.has(id)){
		stamps.add(id); store.set("stamps", [...stamps]); mark();
		setTimeout(() => { Audio.play("stamp"); buzz([20, 60, 30]); toast(stamps.size === 3 ? "Tour du campus terminé ! Ouvre ton carnet 📒" : `Tampon obtenu : ${p.name} (${stamps.size}/3)`, 3000); }, 900);
	} else if(LIFE[id] && !found.has(id)){
		found.add(id); store.set("found", [...found]); mark();
		const total = Object.keys(LIFE).filter(k => LIFE[k].pin).length;
		setTimeout(() => toast(`Lieu de vie découvert : ${p.name} (${found.size}/${total})`, 2600), 900);
	}
}

/* =====================================================================
   Formulaire plaquettes → relais serveur → CRM
   (la clé du CRM n'est jamais dans le navigateur ; l'adresse du relais se règle
    avec window.CAMPUS_LEAD_API sur la page d'intégration)
   ===================================================================== */
const LEAD_API = window.CAMPUS_LEAD_API || LEAD_ENDPOINT || "api/lead";
// version de test en ligne (GitHub Pages, Netlify, Cloudflare…) ou ?demo : le formulaire ne transmet rien
const LEAD_DEMO = !window.CAMPUS_LEAD_API && !LEAD_ENDPOINT && (/[?&]demo/.test(location.search) || /\.(github\.io|netlify\.app|pages\.dev)$/.test(location.hostname));
let leadOpenedAt = 0;
function openLead(ids){
	const list = (ids && ids.length ? ids : [...favs]).map(id => F.find(f => f.id === id)).filter(Boolean);
	$("leadList").innerHTML = list.length
		? list.map(f => `<label><input type="checkbox" name="f" value="${f.id}" checked><span>${f.name}<br><small style="color:var(--muted)">${f.school}</small></span></label>`).join("")
		: `<p class="lead-p" style="margin:0">Aucune formation choisie : on t'enverra une présentation générale de la FGES.</p>`;
	const form = $("leadForm").querySelector("form");
	form.querySelector(".lead-err").hidden = true;
	$("leadForm").hidden = false; $("leadDone").hidden = true;
	$("lead").hidden = false;
	leadOpenedAt = Date.now();
	if(tour) pauseTour(true);
	setTimeout(() => form.email.focus({ preventScroll:true }), 60);
}
function closeLead(){ $("lead").hidden = true; }
$("lead").addEventListener("click", e => { if(e.target.closest("[data-lead-close]") || e.target === $("lead")) closeLead(); });
$("leadForm").querySelector("form").addEventListener("submit", async e => {
	e.preventDefault();
	const form = e.currentTarget, err = form.querySelector(".lead-err"), btn = form.querySelector("button[type=submit]");
	const fail = (msg, field) => { err.textContent = msg; err.hidden = false; if(field){ field.setAttribute("aria-invalid", "true"); field.focus(); } };
	err.hidden = true; form.email.removeAttribute("aria-invalid");
	const email = form.email.value.trim();
	if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return fail("Indique une adresse e-mail valide.", form.email);
	if(!form.consentement.checked) return fail("Coche la case de consentement pour qu'on puisse te recontacter.", form.consentement);
	const chosen = [...form.querySelectorAll("input[name=f]:checked")].map(i => F.find(f => f.id === i.value)).filter(Boolean);
	const qs = new URLSearchParams(location.search);
	const body = {
		prenom:form.prenom.value, nom:form.nom.value, email, telephone:form.telephone.value, code_postal:form.code_postal.value,
		consentement:true, tracking:form.tracking.checked, website:form.website.value, elapsed:Date.now() - leadOpenedAt,
		formations:chosen.map(f => ({ id:f.id, name:f.name, school:f.school })),
		utm_source:qs.get("utm_source") || "", utm_medium:qs.get("utm_medium") || "", utm_campaign:qs.get("utm_campaign") || ""
	};
	btn.disabled = true; btn.textContent = "Envoi…";
	try {
		const r = LEAD_DEMO ? { ok:true } : await fetch(LEAD_API, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(body) });
		const res = LEAD_DEMO ? { ok:true, dryRun:true } : await r.json().catch(() => ({}));
		if(!r.ok || !res.ok) throw new Error(res.error || "Envoi impossible pour le moment.");
		store.set("leadSent", true);
		Audio.play("win");
		// plaquette PDF quand on l'a, sinon le catalogue de toutes les plaquettes
		const direct = chosen.filter(f => PLAQUETTES[f.id]);
		$("leadDoneP").textContent = (direct.length
			? `Voici ${direct.length > 1 ? "tes plaquettes" : "ta plaquette"}. L'équipe de la FGES pourra aussi te recontacter pour répondre à tes questions.`
			: "Toutes nos plaquettes sont à feuilleter ci-dessous. L'équipe de la FGES pourra aussi te recontacter pour répondre à tes questions.") + (res.dryRun ? " (Mode essai : rien n'a été transmis au CRM.)" : "");
		const missing = chosen.length === 0 || chosen.some(f => !PLAQUETTES[f.id]);
		$("leadLinks").innerHTML =
			direct.map(f => `<a class="dl" href="${PLAQUETTES[f.id]}" target="_blank" rel="noopener">📄 Plaquette · ${f.name}<span>↓</span></a>`).join("") +
			(missing ? `<a class="dl" href="${CATALOGUE_PLAQUETTES}" target="_blank" rel="noopener">📚 Feuilleter nos plaquettes<span>↗</span></a>` : "") +
			chosen.map(f => `<a href="${f.url}" target="_blank" rel="noopener">${f.name} sur fges.fr<span>↗</span></a>`).join("");
		$("leadForm").hidden = true; $("leadDone").hidden = false;
		form.reset();
	} catch(x){
		fail(x.message || "Envoi impossible pour le moment. Réessaie dans un instant.");
	} finally { btn.disabled = false; btn.textContent = "Recevoir les plaquettes"; }
});

/* =====================================================================
   Barre de navigation
   ===================================================================== */
document.querySelectorAll("[data-dock]").forEach(b => b.addEventListener("click", () => {
	const k = b.dataset.dock;
	Audio.play("pop");
	if(coach) endCoach();
	if(k === "visite"){ tour ? stopTour() : startTour(); return; }
	const view = k === "formations" ? "nav:formations" : k === "lieux" ? "nav:lieux" : k === "jeux" ? "nav:jeux" : "carnet";
	if(tour) stopTour();
	if(current === view){ closePanel(); return; }
	openPanel(view);
}));

/* =====================================================================
   Téléphone : carrousel des lieux et fiche à tirer
   - les cartes du bas défilent au pouce, la caméra vole vers le lieu de la carte centrale ;
   - la fiche se tire (réduite, moitié, plein écran) et se ferme d'un glissement vers le bas ;
   - la caméra garde le lieu visé au milieu de ce qui reste visible au-dessus.
   ===================================================================== */
const isPhone = () => innerWidth <= 720;
const car = $("carousel");
let carouselOn = false, carIdx = 0, carSettle = 0, lastPlace = null;
function carouselIds(){
	if(mode === "eura") return [...Object.keys(interiors.eura.places), "_vauban"];
	const life = Object.keys(LIFE).filter(k => LIFE[k].pin);
	return ["_hub", "ha", "falise", ...life.filter(k => GAME_AT[k]), "cormontaigne", "portdelille", ...life.filter(k => !GAME_AT[k] && !LIFE[k].metro)].filter(k => k.startsWith("_") || PLACES[k] || LIFE[k]);
}
let carMode = null;
function buildCarousel(){
	const nGames = Object.keys(GAME_INFO).length, nWon = Object.keys(GAME_INFO).filter(k => medals[k]).length;
	const left = car.scrollLeft;
	car.innerHTML = carouselIds().map(id => {
		if(id === "_eura") return `<button class="ccard hub eura" data-id="_eura"><span class="gic">🏙️</span><span><b>Quartier Euratechnologies</b><small>Wenov, le Blan-Lafont, la Deûle, le métro</small></span><span class="go-c">Explorer</span></button>`;
		if(id === "_vauban") return `<button class="ccard hub" data-id="_vauban"><span class="gic">🚇</span><span><b>Retour au campus Vauban</b><small>Ligne 2 · par ${STATION_NAME[store.get("lastStation", "cormontaigne")] || "Cormontaigne"}</small></span><span class="go-c">Y aller</span></button>`;
		if(id === "_hub") return `<button class="ccard hub" data-id="_hub"><span class="gic">🎮</span><span><b>Joue une formation</b><small>${nWon ? `${nWon}/${nGames} médaille${nWon > 1 ? "s" : ""} · ` : ""}${nGames} mini-jeux · 6 à 7 min</small></span><span class="go-c">Jouer</span></button>`;
		const p = PLACES[id] || LIFE[id], games = (GAME_AT[id] || []).length, done = stamps.has(id) || found.has(id);
		const n = PLACES[id] && profile ? listFor(id).length : 0;
		const sub = LIFE[id] && LIFE[id].metro ? `Ligne 2 → Wenov · ${lineFrom(id, true).length - 1} stations` : PLACES[id] ? (n ? `${n} formation${n > 1 ? "s" : ""} pour toi` : p.kicker) : p.kicker;
		return `<button class="ccard" data-id="${id}"><span class="gic">${p.icon}</span><span><b>${p.name}${done ? ' <span class="ok">✓</span>' : ""}</b><small>${games ? `🎮 ${games} jeu${games > 1 ? "x" : ""} · ` : ""}${sub}</small></span><span class="go-c">Voir</span></button>`;
	}).join("");
	car.children[carIdx]?.classList.add("cur");
	car.scrollLeft = left;
}
function carouselShow(id){       // recale le carrousel sur un lieu, sans faire voler la caméra
	const i = carouselIds().indexOf(id), c = car.children[i];
	if(!c) return;
	carIdx = i;
	[...car.children].forEach((x, j) => x.classList.toggle("cur", j === i));
	car.scrollTo({ left:c.offsetLeft - (car.clientWidth - c.offsetWidth)/2, behavior:"instant" });
}
car.addEventListener("scroll", () => { clearTimeout(carSettle); carSettle = setTimeout(() => {
	const cards = [...car.children], mid = car.scrollLeft + car.clientWidth/2;
	let best = 0, bd = Infinity;
	cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth/2 - mid); if(d < bd){ bd = d; best = i; } });
	if(best === carIdx) return;
	carIdx = best; cards.forEach((c, i) => c.classList.toggle("cur", i === best));
	const id = cards[best].dataset.id;
	Audio.play("pop");
	lastPlace = id === "_hub" ? null : id;
	if(id === "_hub" || id === "_vauban"){ setHover(null); if(mode === "eura"){ const I = interiors.eura; flyTo(I.home.pos.clone(), I.home.target.clone(), 1.4); } else flyHome(1.4); }
	else if(id === "_eura"){ setHover(null); flyToPlace("wenov"); }
	else { flyToPlace(id); setHover(id); }
}, 120); }, { passive:true });
car.addEventListener("click", e => {
	const c = e.target.closest(".ccard"); if(!c) return;
	if(c.dataset.id === "_hub"){ Audio.play("pop"); openPanel("nav:jeux"); }
	else if(c.dataset.id === "_eura") goEura();
	else if(c.dataset.id === "_vauban") exitInterior();
	else if(LIFE[c.dataset.id] && LIFE[c.dataset.id].metro) goEura("wenov", c.dataset.id);
	else if(mode === "eura") focusEura(c.dataset.id);
	else selectPlace(c.dataset.id);
});
function syncCarousel(){          // appelé à chaque image : n'agit que si l'état change
	const zone = mode === "ext" || mode === "eura";
	if(zone && carMode !== mode){ carMode = mode; carIdx = 0; buildCarousel(); car.scrollLeft = 0; }
	const on = isPhone() && entered && zone && !intro && !cine && !tour && !coach && !gamePaused && $("dock").classList.contains("on") && !$("panel").classList.contains("on");
	document.body.classList.toggle("inside", mode !== "ext");
	if(on === carouselOn) return;
	carouselOn = on; car.classList.toggle("on", on);
	if(on && lastPlace) carouselShow(lastPlace);
	if(on && hovered == null && carIdx > 0) setHover(car.children[carIdx]?.dataset.id || null);
}

const sheet = { h:0 };
const panelEl = $("panel"), pbody = $("pbody");
function sheetSnaps(){
	const a = innerHeight - $("dock").offsetHeight - 10;
	return [Math.round(a*.4), Math.round(a*.64), a];
}
function setSheet(h, anim){ sheet.h = h; panelEl.classList.toggle("dragging", !anim); panelEl.style.height = h + "px"; }
function sheetRelease(v){          // v : vitesse en px/ms, positive vers le bas
	const [lo, mid, hi] = sheetSnaps(), h = sheet.h;
	if(h < lo*.7 || (v > .9 && h <= mid + 4)){ closePanel(); return; }
	let to = [lo, mid, hi].reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
	if(v > .45) to = h > mid ? mid : lo;
	else if(v < -.45) to = h < mid ? mid : hi;
	setSheet(to, true);
}
let drag = null;
const dragStart = (y, from) => { drag = { y0:y, h0:sheet.h || panelEl.offsetHeight, y:y, t:performance.now(), v:0, moved:false, from }; };
const dragMove = y => {
	const now = performance.now(), dt = Math.max(1, now - drag.t);
	drag.v = .7*drag.v + .3*((y - drag.y)/dt); drag.y = y; drag.t = now;
	if(Math.abs(y - drag.y0) > 4) drag.moved = true;
	setSheet(Math.max(60, Math.min(sheetSnaps()[2], drag.h0 + (drag.y0 - y))), false);
};
const dragEnd = () => {
	const d = drag; drag = null; if(!d) return;
	if(!d.moved){ if(d.from === "grab"){ const [, mid, hi] = sheetSnaps(); setSheet(sheet.h >= hi - 4 ? mid : hi, true); } else panelEl.classList.remove("dragging"); return; }
	sheetRelease(d.v);
};
// en-tête de la fiche (et sa poignée) : on la tire directement
panelEl.querySelector(".ph").addEventListener("pointerdown", e => {
	if(!isPhone() || e.button > 0 || e.target.closest("button:not(.grab),input,a,select,textarea,label")) return;
	dragStart(e.clientY, e.target.closest(".grab") ? "grab" : "head");
	try { e.currentTarget.setPointerCapture(e.pointerId); } catch(x){}
});
panelEl.querySelector(".ph").addEventListener("pointermove", e => { if(drag && drag.from !== "body") dragMove(e.clientY); });
panelEl.querySelector(".ph").addEventListener("pointerup", () => { if(drag && drag.from !== "body") dragEnd(); });
panelEl.querySelector(".ph").addEventListener("pointercancel", () => { if(drag && drag.from !== "body") dragEnd(); });
// contenu : tiré vers le bas quand il est déjà en haut, ou vers le haut tant que la fiche n'est pas en plein écran
let touchY = null;
pbody.addEventListener("touchstart", e => { touchY = isPhone() ? e.touches[0].clientY : null; }, { passive:true });
pbody.addEventListener("touchmove", e => {
	if(touchY == null) return;
	const y = e.touches[0].clientY;
	if(!drag){
		const dy = y - touchY;
		if(Math.abs(dy) < 6) return;
		const atTop = pbody.scrollTop <= 0, full = sheet.h >= sheetSnaps()[2] - 4;
		if((dy > 0 && atTop) || (dy < 0 && !full)) dragStart(touchY, "body"); else { touchY = null; return; }
	}
	e.preventDefault(); dragMove(y);
}, { passive:false });
pbody.addEventListener("touchend", () => { touchY = null; if(drag && drag.from === "body") dragEnd(); });
pbody.addEventListener("touchcancel", () => { touchY = null; if(drag && drag.from === "body") dragEnd(); });
addEventListener("resize", () => {
	if(!isPhone()){ panelEl.style.height = ""; sheet.h = 0; }
	else if(panelEl.classList.contains("on")) setSheet(Math.min(sheet.h || sheetSnaps()[1], sheetSnaps()[2]), false);
});
// décalage vertical de la vue (px) : le lieu visé reste au milieu de l'espace libre entre la barre du haut et la fiche
function phoneOffsetY(){
	const top = 64, dock = $("dock").offsetHeight;
	const bottom = panelEl.classList.contains("on") ? dock + (sheet.h || panelEl.offsetHeight) : carouselOn ? dock + 96 : dock;
	return Math.min(innerHeight*.36, Math.max(0, (bottom - top)/2));
}

/* =====================================================================
   Visite guidée : la caméra enchaîne les lieux, une carte raconte chacun
   ===================================================================== */
const TOUR_IDS = ["ha","chapelle","falise","rizomm","jardin","bu","resto","all","maison","sport","residence","rameau","citadelle","cormontaigne"];
const STOP = 9;
let tour = null;
const firstSentence = t => { const m = t.match(/^.{20,240}?[.!?](?=\s|$)/); if(m) return m[0]; const c = t.slice(0, 200); return c.slice(0, c.lastIndexOf(" ")) + "…"; };
const EURA_TOUR = ["wenov", "cyber", "blan", "berges", "pionnieres", "factory", "frenchtech", "metro"];
function startTour(idle){
	if(mode === "wenovin"){ exitInterior(false, () => startTour(idle)); return; }
	if(mode !== "ext" && mode !== "eura"){ exitInterior(false, () => startTour(idle)); return; }
	closePanel(); setHover(null);
	tour = { stops: mode === "eura" ? EURA_TOUR.filter(id => interiors.eura.places[id]) : TOUR_IDS.filter(id => (PLACES[id] || LIFE[id]) && (PLACES[id] || LIFE[id]).target), i:-1, t:0, paused:false };
	$("tour").hidden = false;
	goStop(0);
	syncDock();
	if(!idle) toast("Visite guidée : laisse-toi porter, ou touche ⏸ pour prendre la main", 3200);
}
function goStop(i){
	const n = tour.stops.length;
	tour.i = (i + n) % n; tour.t = 0;
	const id = tour.stops[tour.i], p = PLACES[id] || LIFE[id];
	flyToPlace(id, 2.6);
	$("tourK").textContent = mode === "eura" ? "Quartier Euratechnologies" : PLACES[id] ? "Bâtiment des formations" : "Vie de campus";
	$("tourDots").textContent = `${tour.i + 1} / ${n}`;
	$("tourT").textContent = `${p.icon} ${p.name}`;
	$("tourP").textContent = firstSentence(p.text);
	if(mode === "eura") euraStamp(id); else markVisited(id, true);
}
function pauseTour(v){ if(!tour) return; tour.paused = v; $("tourPause").textContent = v ? "▶" : "⏸"; $("tourPause").setAttribute("aria-label", v ? "Reprendre" : "Pause"); if(v) controls.autoRotate = false; }
function stopTour(){ if(!tour) return; tour = null; $("tour").hidden = true; controls.autoRotate = false; syncDock(); }
$("tour").addEventListener("click", e => {
	const b = e.target.closest("[data-tour]"); if(!b || !tour) return;
	const a = b.dataset.tour;
	if(a === "next") goStop(tour.i + 1);
	else if(a === "prev") goStop(tour.i - 1);
	else if(a === "pause") pauseTour(!tour.paused);
	else if(a === "stop") stopTour();
	else if(a === "open"){ const id = tour.stops[tour.i]; pauseTour(true); openPanel(id); }
});
function updateTour(dt){
	if(!tour || fly || intro) return;
	if(!tour.paused){
		tour.t += dt;
		controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = .5;
		if(tour.t > STOP) goStop(tour.i + 1);
	}
	$("tourBar").style.width = Math.min(100, tour.t/STOP*100).toFixed(1) + "%";
}

/* =====================================================================
   Accueil guidé (première visite)
   ===================================================================== */
const touch = matchMedia("(pointer:coarse)").matches;
const BORNE = /[?&]borne/.test(location.search);
const COACH = [
	{ ic:"👆", k:"1 / 3 · Se déplacer", t: touch ? "Glisse un doigt pour tourner" : "Glisse pour tourner autour du campus",
	  p: touch ? "Pince avec deux doigts pour zoomer. Fais défiler les cartes du bas : la caméra t'emmène à chaque lieu." : "Molette pour zoomer, clic droit pour te déplacer. Le bouton ⌂ te ramène à la vue d'ensemble." },
	{ ic:"🏛️", k:"2 / 3 · Explorer", t:"Touche un bâtiment ou une épingle", p:"La barre du bas t'emmène directement aux formations, aux lieux du campus ou dans une visite guidée.", dock:true },
	{ ic:"♡", k:"3 / 3 · Garder", t:"Garde les formations qui te plaisent", p:"Touche ♡ sur une formation : elle rejoint ton carnet 📒, avec tes tampons de visite." }
];
let coach = null;
function startCoach(){ coach = { i:0 }; showCoach(); }
function showCoach(){
	const c = COACH[coach.i];
	$("coachIc").textContent = c.ic; $("coachK").textContent = c.k; $("coachT").textContent = c.t; $("coachP").textContent = c.p;
	$("coachNext").textContent = coach.i === COACH.length - 1 ? "C'est parti !" : "Suivant";
	$("coach").hidden = false;
	$("dock").classList.toggle("pulse", !!c.dock);
}
function endCoach(){ coach = null; $("coach").hidden = true; $("dock").classList.remove("pulse"); store.set("onboarded", true); }
$("coach").addEventListener("click", e => {
	const b = e.target.closest("[data-coach]"); if(!b) return;
	Audio.play("pop");
	if(b.dataset.coach === "skip" || coach.i === COACH.length - 1){ endCoach(); if(b.dataset.coach !== "skip") toast(startHint(), 4000); return; }
	coach.i++; showCoach();
});

/* =====================================================================
   Caméra
   ===================================================================== */
let fly = null, panelShift = false, offX = 0, offY = 0;
function flyTo(pos, target, dur){
	const p0 = camera.position.clone(), t0 = controls.target.clone(), far = Math.max(p0.distanceTo(pos), t0.distanceTo(target));
	if(fly && fly.fov0) camera.fov = fly.fov0;
	// à l'extérieur, un long trajet passe en arc au-dessus des toits (jamais dans un intérieur : il y a un plafond)
	const outside = mode === "ext" && !cine;
	fly = { p0, t0, p1:pos, t1:target, k:0, dur: reduceMotion ? .01 : Math.max(dur, Math.min(3.4, .9 + far/150)),
		arc: outside ? Math.min(45, far*.2) : 0, fov0: outside && far > 40 ? camera.fov : 0 };
	controls.enabled = false;
}
function homeView(){
	const a = innerWidth/innerHeight, dist = a < 1 ? 230 : 165, t = V(0,0,-14);
	return { pos: t.clone().add(V(.18, .55, .82).normalize().multiplyScalar(dist)), target:t };
}
/* La brume commence toujours un peu derrière le point regardé : le campus reste net,
   même quand la caméra recule (vue d'ensemble sur téléphone), et seul l'horizon s'estompe. */
function fogFollow(force){
	const d = camera.position.distanceTo(controls.target), Q = QUALITY[quality];
	let near = Math.max(170, d*1.05), far = Math.max(Q.far, near + 260);
	if(weather === "brouillard"){ near = Math.max(30, d*.5); far = near + 240; }          // brouillard du matin : le lointain disparaît
	else if(weather === "pluie"){ near = Math.max(90, d*.7); far = Math.max(near + 200, Q.far*.85); }
	if(!force && Math.abs(far - scene.fog.far) < 8 && Math.abs(near - scene.fog.near) < 8) return;
	scene.fog.near = near; scene.fog.far = far;
	camera.far = far + 60; camera.updateProjectionMatrix();
}
function flyHome(d){ const h = homeView(); flyTo(h.pos, h.target, d); }
/* La source d'ombre suit la caméra par pas d'un texel : sans ça, les bords d'ombre « grouillent ». */
const _sx = new THREE.Vector3(), _sy = new THREE.Vector3(), _sz = new THREE.Vector3(), _up = new THREE.Vector3(0,1,0);
const _sunWas = new THREE.Vector3();
function placeSun(L){
	const t = controls.target;
	_sunWas.copy(sun.position);
	_sz.copy(L.sunPos);
	const dist = _sz.length(); _sz.normalize();
	_sx.crossVectors(_up, _sz).normalize(); _sy.crossVectors(_sz, _sx);
	const texel = (sun.shadow.camera.right - sun.shadow.camera.left)/sun.shadow.mapSize.x;
	const a = Math.round(t.dot(_sx)/texel)*texel, b = Math.round(t.dot(_sy)/texel)*texel, c = Math.round(t.dot(_sz)/4)*4;
	sun.target.position.set(0,0,0).addScaledVector(_sx, a).addScaledVector(_sy, b).addScaledVector(_sz, c);
	sun.position.copy(sun.target.position).addScaledVector(_sz, dist);
	sun.target.updateMatrixWorld();
	return sun.position.distanceToSquared(_sunWas) > 1e-6;
}
const ease = k => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k+2, 3)/2;

/* =====================================================================
   Boucle
   ===================================================================== */
const clock = new THREE.Clock();
let first = true, lastMinute = -1;
/* =====================================================================
   Qualité graphique : devinée au départ, ajustée si l'appareil peine
   ===================================================================== */
const QUALITY = {
	haute:   { label:"haute",   ratio: small ? 1.5 : 2, shadows:true,  map:small ? 1024 : 2048, parts:1,  horizon:2, crowd:1,   far:430, rank:2, post:true,  ao:!small },
	moyenne: { label:"moyenne", ratio:1.25,             shadows:true,  map:1024,                parts:.5, horizon:1, crowd:.7,  far:390, rank:1, post:false, ao:false },
	basse:   { label:"basse",   ratio:1,                shadows:false, map:512,                 parts:0,  horizon:0, crowd:.45, far:320, rank:0, post:false, ao:false }
};
/* Post-traitement (qualité haute) : chargé à la demande, la première fois qu'on passe en qualité haute */
let post = null, postOn = false, postLoading = null;
function wantPost(on){
	postOn = on;
	if(!on || post || postLoading) return;
	postLoading = createPost(renderer, scene, camera).then(p => {
		post = p; postLoading = null;
		post.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
		post.setNight(light ? light.nightK : 0);
	}).catch(e => { console.warn("post-traitement indisponible", e); postLoading = null; postOn = false; });
}
let qualityMode = store.get("quality", "auto"); if(!["auto","haute","moyenne","basse"].includes(qualityMode)) qualityMode = "auto";
let quality = "haute";
function guessQuality(){
	const remembered = store.get("qualityAuto", null);
	if(remembered && QUALITY[remembered]) return remembered;
	let gpu = "";
	try { const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"); gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""; } catch(e){}
	const weakGpu = /mali|adreno \(?tm\)? ?[1-5]\d\d|powervr|intel.*hd graphics [2-5]|swiftshader|llvmpipe|software/i.test(gpu);
	const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4;
	if(weakGpu && (small || cores <= 4)) return "basse";
	if(weakGpu || small || cores <= 4 || mem <= 4) return "moyenne";
	return "haute";
}
function shadowsOn(light, on, size){
	light.castShadow = on;
	if(light.shadow.mapSize.x !== size){ light.shadow.mapSize.set(size, size); if(light.shadow.map){ light.shadow.map.dispose(); light.shadow.map = null; } }
}
function qualityInterior(I){
	const Q = QUALITY[quality];
	I.scene.traverse(o => { if(o.isDirectionalLight) shadowsOn(o, Q.shadows, Math.min(Q.map*2, 2048)); });
}
function setQuality(level){
	quality = level;
	const Q = QUALITY[level];
	renderer.setPixelRatio(Math.min(devicePixelRatio, Q.ratio)*perf.dyn);
	renderer.setSize(innerWidth, innerHeight);
	wantPost(Q.post);
	if(post) post.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
	shadowsOn(sun, Q.shadows, Q.map);
	shadowDirty = true;
	setFarLevel(Q.horizon);
	const walkers = students.filter(s => !s.chat); walkers.forEach((s, i) => { s.off = (i + .5)/walkers.length > Q.crowd; s.g.visible = !s.off; });
	fogFollow(true);
	for(const k in interiors) if(interiors[k]) qualityInterior(interiors[k]);
	partIM.count = reduceMotion ? 0 : Math.round(season.parts.n*Q.parts);
	renderAmbiancePop();
}
/* En mode auto : la résolution s'ajuste en continu (60 → 100 %) pour garder l'image fluide ;
   si l'image reste sous ~30 i/s malgré tout, on descend d'un cran de qualité. */
const perf = { acc:0, n:0, slow:0, cool:6, dyn:1, test:null, good:0, ceil:1.01, locked:false };
function setDyn(v){
	perf.dyn = v;
	renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY[quality].ratio)*v);
	renderer.setSize(innerWidth, innerHeight);
	if(post) post.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
}
function watchPerf(rawDt){
	if(qualityMode !== "auto" || document.hidden || !entered || intro || rawDt > .25) return;
	perf.cool -= rawDt; perf.acc += rawDt; perf.n++;
	if(perf.acc < 1.5) return;
	const fps = perf.n/perf.acc; perf.acc = 0; perf.n = 0;
	if(perf.cool > 0) return;
	// on vient de baisser la résolution : si ce n'est pas plus fluide, ce n'est pas elle qui limite (écran bridé à 30 i/s…) → on revient
	if(perf.test){
		const T = perf.test; perf.test = null; perf.cool = 1;
		if(fps < T.fps + 3){ setDyn(T.dyn); perf.locked = true; } else perf.ceil = T.dyn;
		return;
	}
	if(fps < 48 && !perf.locked && perf.dyn > .62){ perf.test = { fps, dyn:perf.dyn }; setDyn(Math.max(.6, perf.dyn - .12)); perf.good = 0; perf.cool = .5; return; }
	if(fps > 57){ if(perf.dyn < 1 && perf.dyn + .1 < perf.ceil && ++perf.good >= 3){ setDyn(Math.min(1, perf.dyn + .1)); perf.good = 0; perf.cool = 1; } }
	else perf.good = 0;
	perf.slow = fps < 30 ? perf.slow + 1 : 0;
	if(perf.slow >= 2 && QUALITY[quality].rank > 0){
		const next = quality === "haute" ? "moyenne" : "basse";
		setQuality(next); store.set("qualityAuto", next);
		perf.slow = 0; perf.cool = 6;
		toast(`Qualité graphique ajustée (${QUALITY[next].label}) pour plus de fluidité`, 2600);
	}
}
/* ?perf : relevé affiché en haut de l'écran, pour les essais sur de vrais téléphones (toucher le relevé le copie) */
const perfHud = /[?&]perf/.test(location.search) ? (() => {
	let gpu = "?";
	try { const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"); gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "?"; } catch(e){}
	const el = document.createElement("pre");
	el.style.cssText = "position:fixed;top:4px;left:4px;z-index:9999;margin:0;padding:6px 8px;font:11px/1.35 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.62);border-radius:6px;white-space:pre-wrap;max-width:80vw";
	el.addEventListener("click", () => { navigator.clipboard?.writeText(el.textContent).then(() => toast("Relevé copié"), () => {}); });
	document.body.appendChild(el);
	renderer.info.autoReset = false;          // une image peut compter plusieurs passes (ombres, post-traitement)
	const S = { acc:0, n:0, worst:0, tris:0, calls:0 };
	return {
		begin(){ renderer.info.reset(); },
		end(rawDt){
			S.acc += rawDt; S.n++; S.worst = Math.max(S.worst, rawDt);
			S.tris = Math.max(S.tris, renderer.info.render.triangles); S.calls = Math.max(S.calls, renderer.info.render.calls);
			if(S.acc < .5) return;
			const pr = renderer.getPixelRatio();
			el.textContent = [
				`${(S.n/S.acc).toFixed(0)} i/s · pire image ${(S.worst*1000).toFixed(0)} ms`,
				`${(S.tris/1000).toFixed(0)} k triangles · ${S.calls} appels`,
				`qualité ${quality} (${qualityMode}) · résolution ×${pr.toFixed(2)} (${Math.round(innerWidth*pr)}×${Math.round(innerHeight*pr)})`,
				`lointain ${horizon ? "chargé" : "en attente"} · ${navigator.hardwareConcurrency || "?"} cœurs · ${navigator.deviceMemory || "?"} Go`,
				gpu
			].join("\n");
			S.acc = S.n = S.worst = S.tris = S.calls = 0;
		}
	};
})() : null;

let gamePaused = false;     // le campus ne se dessine pas pendant un mini-jeu (une seule scène 3D à la fois)
function frame(){
	if(gamePaused){ clock.getDelta(); requestAnimationFrame(frame); return; }
	const rawDt = clock.getDelta(), dt = Math.min(rawDt, .05), t = clock.elapsedTime;
	watchPerf(rawDt);
	if(perfHud) perfHud.begin();
	TIME.value = t;
	stepLight(dt);

	if(cine){
		cine.A.tick(dt);
		const r = cine.A.cam();
		camera.position.copy(r.pos); controls.target.copy(r.target); camera.lookAt(controls.target);
		// sur le quai, un champ de vision plus large (surtout en portrait) ; on revient à la normale pendant le fondu
		const fov = r.under ? (innerWidth < innerHeight ? 74 : 54) : cine.fov;
		if(camera.fov !== fov){ camera.fov = fov; camera.updateProjectionMatrix(); }
		$("fade").classList.toggle("on", !!r.fade);          // fondu au pied de l'escalier
		if(r.done){ $("fade").classList.remove("on"); endArrival(); }
	} else if(intro){
		intro.k = Math.min(1, intro.k + dt/intro.dur);
		const e = ease(intro.k);
		camera.position.copy(intro.pos.getPoint(e)); controls.target.copy(intro.tgt.getPoint(e));
		camera.lookAt(controls.target);
		$("introCap").textContent = intro.k < .35 ? "Lille · la Citadelle" : intro.k < .62 ? "Le quartier Vauban" : "L'Université Catholique";
		if(intro.k >= 1) endIntro();
	} else {
		if(fly){
			fly.k = Math.min(1, fly.k + dt/fly.dur);
			const e = ease(fly.k);
			camera.position.lerpVectors(fly.p0, fly.p1, e);
			controls.target.lerpVectors(fly.t0, fly.t1, e);
			const bump = Math.sin(Math.PI*e);
			if(fly.arc) camera.position.y += bump*fly.arc;
			if(fly.fov0){ camera.fov = fly.fov0 + 3.5*bump; camera.updateProjectionMatrix(); }
			if(fly.k >= 1){ if(fly.fov0){ camera.fov = fly.fov0; camera.updateProjectionMatrix(); } fly = null; controls.enabled = entered; }
		}
		updateTour(dt);
		const b = limits.box;
		controls.target.x = THREE.MathUtils.clamp(controls.target.x, b[0], b[1]);
		controls.target.z = THREE.MathUtils.clamp(controls.target.z, b[2], b[3]);
		controls.update();
	}

	// fiche ouverte (ordinateur : à droite) ou fiche / carrousel (téléphone : en bas) : la vue se décale
	const phone = isPhone(), k5 = Math.min(1, dt*5);
	offX += ((!phone && panelShift ? 210 : 0) - offX)*k5;
	offY += ((phone ? phoneOffsetY() : 0) - offY)*(drag ? 1 : k5);
	if(Math.abs(offX) > .5 || Math.abs(offY) > .5) camera.setViewOffset(innerWidth, innerHeight, offX, offY, innerWidth, innerHeight);
	else if(camera.view && camera.view.enabled) camera.clearViewOffset();

	if(rame && rame.on){
		rame.update(dt, t);
		renderer.shadowMap.autoUpdate = true;
		draw(rame.scene, rame.camera);
	} else if(mode !== "ext"){
		interiors[mode].update(dt, t, camera);
		renderer.shadowMap.autoUpdate = true;
		draw(interiors[mode].scene, camera);
	} else {
		if(placeSun(light)) shadowDirty = true;
		updateStudents(dt, t);
		updateFlocks(dt, t);
		updatePigeons(dt, t);
		if(partIM.count) updateParts(dt, t);
		updateSmoke(dt);
		updateBoats(dt, t);
		rain.follow(camera.position);
		for(const d of ducks){
			const c = d.line, n = c.length/2 - 1; if(n < 1) continue;
			const k = ((Math.sin(t*.02 + d.ph)*.5 + .5)*.8 + .1)*n, i = Math.floor(k), f = k - i;
			const x = c[i*2] + (c[i*2+2]-c[i*2])*f, z = c[i*2+1] + (c[i*2+3]-c[i*2+1])*f;
			d.g.position.set(x + Math.sin(d.ph)*1.5, .14 + Math.sin(t*1.6 + d.ph)*.04, z);
			d.g.rotation.y = Math.atan2(c[i*2+2]-c[i*2], c[i*2+3]-c[i*2+1]) + (Math.cos(t*.02 + d.ph) < 0 ? Math.PI : 0);
		}
		for(const c of clouds){ c.g.position.x += c.v*dt; if(c.g.position.x > 320) c.g.position.x = -320; }
		for(const f of flags){
			const pos = f.mesh.geometry.attributes.position;
			for(let i=0;i<pos.count;i++){ const x = f.base[i*3]; pos.array[i*3+2] = Math.sin(x*2.2 - t*3 + f.ph)*.16*(x/2.2); }
			pos.needsUpdate = true;
		}
		const now = new Date(), mins = now.getMinutes() + now.getSeconds()/60, hrs = (now.getHours()%12) + mins/60;
		clockHands.minHand.rotation.z = -mins/60*Math.PI*2;
		clockHands.hourHand.rotation.z = -hrs/12*Math.PI*2;
		if(now.getMinutes() === 0 && lastMinute === 59 && entered){ Audio.play("chime"); setTimeout(scarePigeons, 250); }
		lastMinute = now.getMinutes();
		if(mode === "ext") fogFollow();
		crowd.update();
		// la rame et la station souterraine bougent pendant les cinématiques : ombres en continu ; sinon à la demande
		renderer.shadowMap.autoUpdate = !!cine;
		if(shadowDirty){ renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
		draw(scene, camera, true);
	}
	if(entered){ syncCarousel(); updatePins(); }
	if(perfHud) perfHud.end(rawDt);
	if(first){ first = false; performance.mark("campus-ready"); setTimeout(() => $("loader").classList.add("gone"), 150); prefetchLater(); setTimeout(loadFar, 400); }
	requestAnimationFrame(frame);
}
addEventListener("resize", () => {
	camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
	renderer.setSize(innerWidth, innerHeight);
	if(post) post.setSize(innerWidth, innerHeight, renderer.getPixelRatio());
	shadowDirty = true;
});
/* Rendu d'une image : directement, ou par le post-traitement en qualité haute (occlusion ambiante dehors seulement) */
function draw(sc, cam, outside){
	if(post && postOn) post.render(sc, cam, outside && QUALITY[quality].ao);
	else renderer.render(sc, cam);
}
/* =====================================================================
   Écran de veille : sans interaction, la visite guidée se lance seule.
   ?borne : mode stand (JPO, salons) — pas d'accueil, visite en boucle.
   ===================================================================== */
const IDLE_MS = BORNE ? 30000 : 60000;
let lastInput = performance.now(), idleTour = false;
for(const ev of ["pointerdown","keydown","wheel","touchstart"]){
	addEventListener(ev, () => {
		lastInput = performance.now();
		if(idleTour && tour){ idleTour = false; stopTour(); }
	}, { passive:true, capture:true });
}
setInterval(() => {
	// jamais pendant un mini-jeu, le formulaire, ou (hors borne) quand le visiteur lit un panneau
	if(!entered || tour || intro || coach || cine || riding || !$("badge").hidden || mode !== "ext" || gamePaused || !$("lead").hidden || !$("welcome").classList.contains("gone")) return;
	if(!BORNE && (current || !$("ambiance").hidden)) return;
	if(performance.now() - lastInput > IDLE_MS){ idleTour = true; startTour(true); }
}, 2000);

applyAmbiance(true);
setQuality(qualityMode === "auto" ? guessQuality() : qualityMode);
refreshHud();
if(BORNE){
	profile = profile || "lycee";
	$("musicPref").checked = false;
	enter();
	lastInput = -1e9;      // la visite démarre dès la fin de l'intro
}
if(/[?&]debug/.test(location.search)) window.campus = { THREE, scene, camera, controls, renderer, city, selectPlace, enterInterior, exitInterior, openGame, PLACES, LIFE, MAP, interiors, get mode(){ return mode; },
	view(px,py,pz,tx,ty,tz){ fly = null; intro = null; camera.position.set(px,py,pz); controls.target.set(tx,ty,tz); controls.update(); if(entered) updatePins(); },
	set(k,v){ if(k === "season") seasonKey = v; if(k === "time") timeMode = v; applyAmbiance(true); }, setQuality, get post(){ return post; }, crowd, get quality(){ return quality; }, get far(){ return { horizon, farWood }; } };
requestAnimationFrame(frame);
