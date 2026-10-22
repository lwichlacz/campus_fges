/* Le quartier d'Euratechnologies (Bois-Blancs, Lille), autour du campus Wenov et de l'École du Numérique.
   Comme Vauban : OpenStreetMap, BD TOPO et photo aérienne de l'IGN (js/euramap.js, généré par tools/build_eura.py),
   à la même échelle verticale (un étage = 1,64 unité), avec plaques de rue, jalonnement « M » et lieux réels. Trois bâtiments faits main
   d'après photos : Wenov (Lalou+Lebec, 2022 : béton clair, patio planté sur pilotis, volume vitré),
   le Blan-Lafont (filature de coton de 1896, siège d'Euratechnologies depuis 2009) et sa tour.
   Chargé à la demande, comme l'atrium : une seule scène de quartier à la fois (léger sur téléphone). */
import * as THREE from "three";
import { std, box, cyl, cone, mesh, beam, makePerson, mulberry32 } from "./kit.js?v=5edcdae804";
import { buildCity, pointInPoly, softenFar } from "./city.js?v=5edcdae804";
import { buildStation } from "./station.js?v=5edcdae804";
import { EMAP } from "./euramap.js?v=5edcdae804";
import { buildLandmarks } from "./landmarks.js?v=5edcdae804";
import { waterRipples, cloudShade, createRain, CLOUDS } from "./render.js?v=5edcdae804";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ring = f => { const p = []; for(let i=0;i<f.length;i+=2) p.push([f[i], f[i+1]]); return p; };
const cen = p => [p.reduce((s, q) => s + q[0], 0)/p.length, p.reduce((s, q) => s + q[1], 0)/p.length];

function concreteGrid(){
	// trame de Wenov : béton clair, fenêtres verticales régulières
	const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
	x.fillStyle = "#e9e6df"; x.fillRect(0, 0, 128, 128);
	const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, "#6c8296"); g.addColorStop(1, "#465a6e");
	x.fillStyle = g; x.fillRect(14, 16, 36, 96); x.fillRect(78, 16, 36, 96);
	x.fillStyle = "rgba(233,230,223,.5)"; x.fillRect(30, 16, 4, 96); x.fillRect(94, 16, 4, 96);
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function canvasTex(draw, w = 128, h = 128, color = true){
	const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if(color) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// filature (photos) : brique rouge, une grande baie rectangulaire par travée et par niveau, pilastres, menuiseries claires
function millWindows(tower){
	return canvasTex(x => {
		x.fillStyle = "#a65a43"; x.fillRect(0, 0, 128, 128);
		x.fillStyle = "rgba(0,0,0,.07)"; for(let y=0; y<128; y+=6) x.fillRect(0, y, 128, 1.5);
		x.fillStyle = "#94503c"; x.fillRect(0, 0, 10, 128); x.fillRect(118, 0, 10, 128);          // pilastres
		const [a, b] = tower ? [44, 40] : [26, 76];
		x.fillStyle = "#d8d4cc"; x.fillRect(a - 3, 16, b + 6, 98);
		const g = x.createLinearGradient(0, 18, 0, 112); g.addColorStop(0, "#5f7d90"); g.addColorStop(1, "#3c5162");
		x.fillStyle = g; x.fillRect(a, 19, b, 92);
		x.fillStyle = "#d8d4cc"; x.fillRect(a, 62, b, 3); if(!tower) x.fillRect(a + b/2 - 1.5, 19, 3, 92);
		x.fillStyle = "#7d4433"; x.fillRect(a - 5, 10, b + 10, 6);                                     // linteau
	});
}
function millLit(tower){
	const r = mulberry32(tower ? 13 : 8);
	return canvasTex(x => { x.fillStyle = "#000"; x.fillRect(0, 0, 128, 128); if(r() < .75){ x.fillStyle = "#ffd9a0"; const [a, b] = tower ? [44, 40] : [26, 76]; x.fillRect(a, 19, b, 92); } }, 128, 128, false);
}
// Black Diamond : socle de brique rouge en claustra devant le parking
function latticeBrick(){
	return canvasTex(x => {
		x.fillStyle = "#9c4a36"; x.fillRect(0, 0, 128, 128);
		x.fillStyle = "#2a1c18";
		for(let j=0;j<8;j++) for(let i=0;i<8;i++) x.fillRect(i*16 + (j % 2 ? 8 : 2), j*16 + 5, 6, 6);
	});
}
// bureaux en métal laqué noir : bandeaux vitrés, châssis noirs
function darkOffices(){
	return canvasTex(x => {
		x.fillStyle = "#24272c"; x.fillRect(0, 0, 128, 128);
		const g = x.createLinearGradient(0, 20, 0, 108); g.addColorStop(0, "#71879a"); g.addColorStop(1, "#4b5d6d");
		x.fillStyle = g; x.fillRect(6, 22, 116, 84);
		x.fillStyle = "#1b1d21"; for(const xx of [6, 44, 82, 120]) x.fillRect(xx - 3, 22, 6, 84); x.fillRect(6, 62, 116, 4);
	});
}
function officeLit(){
	const r = mulberry32(21);
	return canvasTex(x => { x.fillStyle = "#000"; x.fillRect(0, 0, 128, 128); for(const xx of [9, 47, 85]) if(r() < .6){ x.fillStyle = "#e8f0ff"; x.fillRect(xx, 22, 32, 84); } }, 128, 128, false);
}
function litGrid(){
	const r = mulberry32(5), c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
	x.fillStyle = "#000"; x.fillRect(0, 0, 128, 128);
	for(const xx of [14, 78]) if(r() < .7){ x.fillStyle = "#ffd28f"; x.fillRect(xx, 16, 36, 96); }
	return new THREE.CanvasTexture(c);
}
// une forme (contour + trou) extrudée en hauteur, posée au sol
function ringSlab(outer, hole, h, mat, y, parent, uvScale=1){
	const sh = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)));
	if(hole) sh.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z)).reverse()));
	const g = new THREE.ExtrudeGeometry(sh, { depth:h, bevelEnabled:false }).rotateX(-Math.PI/2);
	if(uvScale !== 1){ const uv = g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*uvScale, uv.getY(i)*uvScale); }
	const m = new THREE.Mesh(g, mat); m.position.y = y; m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
const inset = (p, k) => { const [cx, cz] = cen(p); return p.map(([x, z]) => [cx + (x - cx)*k, cz + (z - cz)*k]); };
// contour décalé vers l'intérieur d'une distance d (polygone convexe)
function offset(p, d){
	const n = p.length, out = [];
	const ccw = p.reduce((s, a, i) => { const b = p[(i+1)%n]; return s + a[0]*b[1] - b[0]*a[1]; }, 0) > 0 ? 1 : -1;
	const lines = p.map((a, i) => { const b = p[(i+1)%n], dx = b[0]-a[0], dz = b[1]-a[1], l = Math.hypot(dx, dz); const nx = -dz/l*ccw, nz = dx/l*ccw; return [a[0]+nx*d, a[1]+nz*d, dx/l, dz/l]; });
	for(let i=0;i<n;i++){
		const [x1, z1, u1, v1] = lines[(i+n-1)%n], [x2, z2, u2, v2] = lines[i];
		const den = u1*v2 - v1*u2; if(Math.abs(den) < 1e-6){ out.push([x2, z2]); continue; }
		const t = ((x2-x1)*v2 - (z2-z1)*u2)/den; out.push([x1 + u1*t, z1 + v1*t]);
	}
	return out;
}

export function createEura({ background }){
	const scene = new THREE.Scene();
	scene.background = background;
	scene.fog = new THREE.Fog("#f3e4cb", 220, 560);
	const hemi = new THREE.HemisphereLight("#ffe8c4", "#7d5b3c", 1.15);
	const sun = new THREE.DirectionalLight("#ffcf8f", 2.5);
	sun.position.set(-70, 62, 50); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, { left:-110, right:110, top:110, bottom:-110, near:10, far:320 });
	sun.shadow.bias = -.0007; sun.shadow.normalBias = .05;
	scene.add(hemi, sun, sun.target);

	const ground = new THREE.Mesh(new THREE.CircleGeometry(520, 48).rotateX(-Math.PI/2), std("#a9b05c", { flatShading:false }));
	ground.position.y = -.02; ground.receiveShadow = true; scene.add(ground);
	// sol d'après la photo aérienne de l'IGN (img/sol_eura.png) : herbe dans les jardins, cour pavée ailleurs (comme à Vauban)
	if(EMAP.sol){
		const [x0, z0, w, h] = EMAP.sol, gm = ground.material;
		const U = { uSol:{ value:null }, uSolBox:{ value:new THREE.Vector4(x0, z0, w, h) }, uPaved:{ value:new THREE.Color("#b3aa9b") }, uSolOn:{ value:0 } };
		new THREE.TextureLoader().load("img/sol_eura.png", t => { t.flipY = false; t.colorSpace = THREE.NoColorSpace; U.uSol.value = t; U.uSolOn.value = 1; });
		gm.polygonOffset = true; gm.polygonOffsetFactor = 6; gm.polygonOffsetUnits = 12;
		gm.onBeforeCompile = sh => {
			Object.assign(sh.uniforms, U);
			sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vSolXZ;")
				.replace("#include <project_vertex>", "#include <project_vertex>\n	vSolXZ = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;");
			sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D uSol; uniform vec4 uSolBox; uniform vec3 uPaved; uniform float uSolOn; varying vec2 vSolXZ;")
				.replace("#include <color_fragment>", `#include <color_fragment>
	{ vec2 st = ( vSolXZ - uSolBox.xy )/uSolBox.zw;
	  if( uSolOn > 0.5 && st.x > 0.0 && st.y > 0.0 && st.x < 1.0 && st.y < 1.0 ){
	    float veg = smoothstep( 0.25, 0.75, texture2D( uSol, st ).r );
	    diffuseColor.rgb = mix( uPaved, diffuseColor.rgb, veg ); } }`);
		};
		gm.customProgramCacheKey = () => "sol";
	}

	// pas de pelouse OpenStreetMap sous Wenov (fait main) : elle affleurerait sous le patio et les pilotis
	{ const blk = ring(EMAP.wenov.street); EMAP.greens = EMAP.greens.filter(([, f]) => { const p = ring(f), [cx, cz] = cen(p); return !pointInPoly(cx, cz, blk); }); }
	const city = buildCity(scene, EMAP, { offices:true });
	// horizon : les vrais bâtiments des environs (js/eura_far.js), chargés après le quartier, en un seul lot de volumes
	import("./eura_far.js?v=5edcdae804").then(({ EFAR }) => {
		const n = EFAR.length/7, geo = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0);
		const im = new THREE.InstancedMesh(geo, std("#ffffff"), n), d = new THREE.Object3D(), c = new THREE.Color();
		const TINT = [["#a9533c", "#9a4a36", "#b8664a", "#8e4a3c"], ["#d8cfc0", "#cbbfa9", "#e2d9c8"], ["#b9b4ab", "#a7a39b", "#c9c4ba", "#8f949b"]];
		for(let i=0;i<n;i++){
			const k = i*7, T = TINT[EFAR[k+6]] || TINT[2];
			d.position.set(EFAR[k]/10, 0, EFAR[k+1]/10); d.rotation.set(0, -EFAR[k+2]/100, 0);
			d.scale.set(Math.max(.6, EFAR[k+3]/10), Math.max(.6, EFAR[k+5]/10), Math.max(.6, EFAR[k+4]/10)); d.updateMatrix();
			im.setMatrixAt(i, d.matrix); im.setColorAt(i, c.set(T[(k*7 + EFAR[k]) % T.length]));
		}
		im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
	}).catch(() => {});
	// plaques de rue, panneaux « M » de Wenov jusqu'à la station, lieux réels du quartier
	const landmarks = buildLandmarks(scene, EMAP, { inBuilding:city.inBuilding, roadGap:city.roadGap, home:[0, -12] });

	/* ---------- Wenov ---------- */
	const W = ring(EMAP.wenov.pts), WC = cen(W);
	const wen = new THREE.Group(); scene.add(wen);
	const white = std("#efede8"), slabM = std("#f6f4ef");
	const gridTex = concreteGrid(), FH = 2.16, NF = 5;                       // R+4 : 20,5 m à l'acrotère (PSS-archi), à l'échelle de Vauban
	gridTex.repeat.set(1/1.6, 1/FH);
	const facadeM = new THREE.MeshStandardMaterial({ map:gridTex, roughness:.85, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:litGrid() }); softenFar(facadeM);
	const patio = inset(W, .5);
	const shopM = std("#6f8497", { roughness:.3, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
	// rez-de-chaussée en retrait sur pilotis : commerces vitrés (cafés, coworking)
	ringSlab(offset(W, 1.2), offset(patio, -1.2), FH, shopM, 0, wen);
	{
		const cols = [];
		for(const poly of [W, patio]) for(let i=0;i<poly.length;i++){
			const a = poly[i], b = poly[(i+1)%poly.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.max(2, Math.round(l/3.2));
			for(let k=0;k<n;k++){ const t = (k + .5)/n; cols.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]); }
		}
		const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.32, .32, FH, 8).translate(0, FH/2, 0), white, cols.length), d = new THREE.Object3D();
		cols.forEach(([x, z], i) => { d.position.set(x, 0, z); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		im.castShadow = im.receiveShadow = true; wen.add(im);
	}
	for(let f=1; f<NF; f++){
		ringSlab(W, patio, FH - .22, facadeM, f*FH, wen);
		ringSlab(offset(W, -.35), offset(patio, .35), .22, slabM, f*FH - .22, wen);     // nez de dalle qui dépasse
	}
	ringSlab(offset(W, -.35), offset(patio, .35), .3, slabM, NF*FH - .22, wen);
	// volume vitré à l'angle, face au Blan-Lafont et à la cour de Bretagne
	const corner = W[0], toC = [WC[0] - corner[0], WC[1] - corner[1]], tl = Math.hypot(...toC);
	const gx = corner[0] + toC[0]/tl*5.2, gz = corner[1] + toC[1]/tl*5.2;
	const glassM = new THREE.MeshStandardMaterial({ color:"#a9c7d6", roughness:.12, metalness:.35, transparent:true, opacity:.88, emissive:"#ffd08a", emissiveIntensity:0 });
	const gb = box(wen, 7.4, NF*FH + .6, 7.4, glassM, gx, 0, gz, -Math.atan2(W[1][1] - W[0][1], W[1][0] - W[0][0]));
	// patio : dalle claire, grands arbres, bancs jaunes (comme sur le rendu des architectes)
	ringSlab(patio, null, .12, std("#d9d4ca", { flatShading:false }), 0, wen);
	const patioTrees = [];
	{ const r = mulberry32(9); for(let k=0;k<7;k++){ const t = .25 + r()*.5, s = .25 + r()*.5; const p0 = patio[0], p1 = patio[1], p3 = patio[3];
		patioTrees.push({ x:p0[0] + (p1[0]-p0[0])*t + (p3[0]-p0[0])*s, z:p0[1] + (p1[1]-p0[1])*t + (p3[1]-p0[1])*s, s:.85 + r()*.35 }); } }
	const yellow = std("#f2c63c");
	for(let k=0;k<5;k++){ const q = patioTrees[k]; box(wen, 1.3, .35, .45, yellow, q.x + 1.6, 0, q.z + .4, k); }
	// toiture : édicules et panneaux
	const roofY = NF*FH + .08;
	for(let k=0;k<4;k++){ const p = W[k]; box(wen, 2.4, 1.2, 1.8, std("#c9c6bf"), p[0] + (WC[0]-p[0])*.18, roofY, p[1] + (WC[1]-p[1])*.18, k*.4); }

	/* ---------- le Blan-Lafont et sa tour (d'après les photos de Wikimedia Commons) ----------
	   Filatures Lafont (1896) et Le Blan (1900), réunies en 2009 par Brossy & Associés autour d'un atrium vitré de 1 600 m².
	   Brique rouge, cinq niveaux de grandes baies rectangulaires entre pilastres, frise sous la corniche, attique vitré sombre
	   en retrait avec un auvent rouge ; la tour de 1896, plus haute d'un tiers, crénelée, aux baies géminées en plein cintre,
	   coiffée d'un haut pavillon d'ardoise ; une tour d'escalier plus fine à l'autre bout. */
	const BL = ring(EMAP.blan.pts);
	const brickTex = millWindows(); brickTex.repeat.set(1/1.9, 1/1.76);           // une travée de 3,6 m, un niveau de 3,3 m
	const brickM = new THREE.MeshStandardMaterial({ map:brickTex, roughness:.9, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:millLit() }); softenFar(brickM);
	const BH = 8.8;                                                           // 16,6 m à la gouttière (BD TOPO), à l'échelle de Vauban
	ringSlab(BL, null, BH, brickM, 0, scene);
	ringSlab(BL, null, .25, std("#77746e"), BH, scene);                        // toit-terrasse
	const friezeM = std("#8f4632"), atticM = std("#2d333c", { roughness:.35, metalness:.25, emissive:"#ffd08a", emissiveIntensity:0 });
	{
		const ccw = BL.reduce((s, a, i) => { const b = BL[(i+1)%BL.length]; return s + a[0]*b[1] - b[0]*a[1]; }, 0) > 0 ? 1 : -1;
		for(let i=0;i<BL.length;i++){
			const a = BL[i], b = BL[(i+1)%BL.length], dx = b[0]-a[0], dz = b[1]-a[1], l = Math.hypot(dx, dz);
			if(l < 1.2) continue;
			const nx = -dz/l*ccw, nz = dx/l*ccw, mx = (a[0]+b[0])/2, mz = (a[1]+b[1])/2, ry = -Math.atan2(dz, dx);
			box(scene, l + .2, .45, .3, friezeM, mx - nx*.05, BH - .75, mz - nz*.05, ry, false);          // frise de brique sous la corniche
			if(l > 4) box(scene, l - 2.4, 1.25, .25, atticM, mx + nx*1.3, BH + .25, mz + nz*1.3, ry, false);   // attique vitré en retrait
		}
	}
	// l'atrium : grande verrière entre les deux filatures (la bande claire vue d'avion)
	{
		const [bx, bz] = cen(BL), ang = EMAP.blan.ang;
		const xs = BL.map(([x, z]) => (x - bx)*Math.cos(ang) + (z - bz)*Math.sin(ang)), zs = BL.map(([x, z]) => -(x - bx)*Math.sin(ang) + (z - bz)*Math.cos(ang));
		const L = Math.max(...xs) - Math.min(...xs), D = Math.max(...zs) - Math.min(...zs);
		const shed = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.1, 0), new THREE.Vector2(1.1, 0), new THREE.Vector2(0, .7)]), { depth:D*.5, bevelEnabled:false }).translate(0, 0, -D*.25);
		const shedM = std("#cfe2e8", { transparent:true, opacity:.85, roughness:.2, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
		const grp = new THREE.Group(); grp.position.set(bx, BH + .25, bz); grp.rotation.y = -ang; scene.add(grp);
		const n = Math.floor(L*.5/2.2);
		for(let k=0;k<n;k++) mesh(shed, shedM, grp, -L*.25 + k*2.2 + 1.1, 0, 0, 0);
		var shedMat = shedM;
	}
	const T = EMAP.blan.tower, TH = 13.2;                                      // ≈ 25 m au sommet des créneaux, ≈ 32 m au faîte (photos, PSS-archi)
	const tower = new THREE.Group(); tower.position.set(T.x, 0, T.z); tower.rotation.y = -T.ang; scene.add(tower);
	const tw = 4.6, td = 4.6;
	const towerTex = millWindows(true); towerTex.repeat.set(1/2.3, 1/1.76);
	const towerM = new THREE.MeshStandardMaterial({ map:towerTex, roughness:.9, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:millLit(true) }); softenFar(towerM);
	box(tower, tw, TH - 2.2, td, towerM, 0, 0, 0);
	const brickPlain = std("#a65a43");
	box(tower, tw, 2.2, td, brickPlain, 0, TH - 2.2, 0);                       // étage des baies géminées
	box(tower, tw + .35, .5, td + .35, friezeM, 0, TH - .5, 0);                // mâchicoulis
	for(let k=0;k<4;k++) for(let j=0;j<5;j++){                                 // créneaux
		const t_ = (j + .5)/5 - .5, ax = k % 2, sg = k < 2 ? 1 : -1;
		box(tower, ax ? .32 : .5, .45, ax ? .5 : .32, brickPlain, ax ? sg*(tw/2 + .02) : t_*tw, TH, ax ? t_*td : sg*(td/2 + .02));
	}
	const archM = std("#25303b", { emissive:"#ffe2a8", emissiveIntensity:0 });
	for(const s of [-1, 1]) for(const ax of [0, 1]) for(const o of [-.45, .45]){
		// baies géminées en plein cintre, sur chaque face
		const px = ax ? s*(tw/2 + .03) : o, pz = ax ? o : s*(td/2 + .03), ry = ax ? s*Math.PI/2 : (s < 0 ? Math.PI : 0);
		const w = mesh(new THREE.PlaneGeometry(.55, 1.1), archM, tower, px, TH - 1.55, pz, ry, false); w.userData.clock = true;
		const top = mesh(new THREE.CircleGeometry(.275, 12, 0, Math.PI), archM, tower, px, TH - 1, pz, ry, false); top.userData.clock = true;
	}
	for(const s of [-1, 1]) mesh(new THREE.PlaneGeometry(1.3, .45), std("#e8dcc6"), tower, 0, TH - 3.2, s*(td/2 + .03), s < 0 ? Math.PI : 0, false);   // la date, 1896
	// pavillon d'ardoise : pyramide tronquée très raide, petit épi de faîtage
	const slate = std("#5d6573", { roughness:.55 });
	const pav = new THREE.Mesh(new THREE.CylinderGeometry((tw/2)*.62*Math.SQRT2, (tw/2 + .1)*Math.SQRT2, 3.9, 4, 1).rotateY(Math.PI/4).translate(0, 1.95, 0), slate);
	pav.position.y = TH + .25; pav.castShadow = true; tower.add(pav);
	box(tower, tw*.62*.95, .12, td*.62*.95, slate, 0, TH + 4.15, 0);
	cyl(tower, .05, .05, 1.1, std("#2b2a30"), 0, TH + 4.27, 0, 6);
	// l'auvent rouge, en porte-à-faux sur l'attique, près de la tour
	{
		const [bx, bz] = cen(BL), vx = bx - T.x, vz = bz - T.z, vl = Math.hypot(vx, vz);
		box(scene, 7, .18, 2.6, std("#c8302c"), T.x + vx/vl*7, BH + 1.55, T.z + vz/vl*7, -T.ang);
	}
	// la tour d'escalier de l'aile Lafont, plus fine, à l'angle opposé
	{
		let far_ = BL[0], fd = 0;
		for(const p of BL){ const d = Math.hypot(p[0] - T.x, p[1] - T.z); if(d > fd){ fd = d; far_ = p; } }
		const [bx, bz] = cen(BL), kx = bx - far_[0], kz = bz - far_[1], kl = Math.hypot(kx, kz);
		const sx = far_[0] + kx/kl*1.6, sz = far_[1] + kz/kl*1.6, H2 = BH + 2.4;
		const st = new THREE.Group(); st.position.set(sx, 0, sz); st.rotation.y = -EMAP.blan.ang; scene.add(st);
		box(st, 2.4, H2, 2.4, towerM, 0, 0, 0);
		box(st, 2.7, .35, 2.7, friezeM, 0, H2 - .35, 0);
		for(let k=0;k<4;k++) for(let j=0;j<3;j++){ const t_ = (j + .5)/3 - .5, ax = k % 2, sg = k < 2 ? 1 : -1; box(st, ax ? .25 : .4, .35, ax ? .4 : .25, brickPlain, ax ? sg*1.21 : t_*2.4, H2, ax ? t_*2.4 : sg*1.21); }
		const lan = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.4, 4).rotateY(Math.PI/4).translate(0, .7, 0), slate); lan.position.y = H2 + .1; st.add(lan);
	}

	/* ---------- Le Diamant (« Black Diamond », PDAA Pranlas-Descours, 2018) : socle de brique rouge à claustra
	   (le parking silo), étage du sport, bureaux en métal laqué noir ; remplace le volume générique ---------- */
	const pois = city.pois || {};
	const footprint = k => { const b = EMAP.pois[k] && EMAP.buildings[EMAP.pois[k].i]; return b ? ring(b[4]) : null; };
	if(footprint("diamant") && pois.diamant){
		pois.diamant.group.visible = false;
		const F = footprint("diamant"), FH2 = 1.64;
		const lat = latticeBrick(); lat.repeat.set(1/1.6, 1/1.6);
		ringSlab(F, null, FH2*2.5, new THREE.MeshStandardMaterial({ map:lat, roughness:.9 }), 0, scene);
		const off = darkOffices(); off.repeat.set(1/1.8, 1/FH2);
		const offM = new THREE.MeshStandardMaterial({ map:off, roughness:.4, metalness:.3, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:officeLit() }); softenFar(offM);
		ringSlab(F, null, FH2*2.5, offM, FH2*2.5, scene);
		ringSlab(F, null, .3, std("#1f2226"), FH2*5, scene);
		var diamantM = offM;
	}

	/* ---------- La French Tech Lille : bureaux vitrés à double peau de lames de verre verticales (Barbarito Bancel),
	   face au Blan-Lafont sur la cour de Bretagne ---------- */
	if(footprint("frenchtech") && pois.frenchtech){
		pois.frenchtech.group.visible = false;
		const F = footprint("frenchtech"), H3 = 1.64*5;
		const glass = new THREE.MeshStandardMaterial({ color:"#9fc3c9", roughness:.12, metalness:.35, transparent:true, opacity:.9, emissive:"#ffe2a8", emissiveIntensity:0 });
		ringSlab(F, null, H3, glass, 0, scene);
		for(const y of [0, H3]) ringSlab(F, null, .22, std("#e7e8e6"), y - (y ? .1 : 0), scene);
		const fins = [];
		for(let i=0;i<F.length;i++){
			const a = F[i], b = F[(i+1)%F.length], l = Math.hypot(b[0]-a[0], b[1]-a[1]), n = Math.floor(l/.55);
			for(let k=1;k<n;k++){ const t_ = k/n; fins.push([a[0] + (b[0]-a[0])*t_, a[1] + (b[1]-a[1])*t_, Math.atan2(b[1]-a[1], b[0]-a[0])]); }
		}
		const [fx, fz] = cen(F);
		const finIM = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, H3 - .3, .7).translate(0, (H3 - .3)/2 + .15, 0), std("#cfe6e8", { transparent:true, opacity:.55, roughness:.1, metalness:.4 }), fins.length), d = new THREE.Object3D();
		fins.forEach(([x, z, a], i) => { const ox = x - fx, oz = z - fz, ol = Math.hypot(ox, oz) || 1; d.position.set(x + ox/ol*.35, 0, z + oz/ol*.35); d.rotation.set(0, -a, 0); d.updateMatrix(); finIM.setMatrixAt(i, d.matrix); });
		scene.add(finIM);
		var ftGlass = glass;
	}

	/* ---------- métro ligne 2 : Canteleu – Euratechnologies ---------- */
	const M = EMAP.spots.metro;
	if(M){
		for(const [x, z] of (M.exits.length ? M.exits : [[M.x, M.z]])){
			box(scene, 2.2, .1, 3.2, std("#55525a"), x, .1, z);
			const pole = cyl(scene, .07, .07, 3.4, std("#3b3a40"), x + 1.3, 0, z, 6);
			const sign = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .12), new THREE.MeshStandardMaterial({ map:metroSign(), emissive:"#ffffff", emissiveMap:metroSign(), emissiveIntensity:.15 }));
			sign.position.set(x + 1.3, 3.6, z); scene.add(sign);
		}
	}

	/* ---------- la station souterraine (ligne 2) et l'arrivée de la rame ---------- */
	const arrival = M ? buildStation(scene, { exit:(M.exits && M.exits[0]) || [M.x, M.z], face:WC, name:"Canteleu – Euratechnologies" }) : null;

	/* ---------- station V'Lille « Euratechnologies » ---------- */
	if(EMAP.spots.vlille){
		const { x, z } = EMAP.spots.vlille, red = std("#d6213a"), dark = std("#2b2a30");
		box(scene, .5, 1.8, .5, red, x - 2.6, 0, z);
		for(let k=0;k<5;k++){
			const b = new THREE.Group(); b.position.set(x - 1.6 + k*.9, 0, z); scene.add(b);
			for(const dz of [-.45, .45]) mesh(new THREE.TorusGeometry(.32, .06, 6, 14), dark, b, 0, .34, dz, Math.PI/2);
			box(b, .08, .08, .9, red, 0, .55, 0); box(b, .5, .06, .08, dark, 0, .9, -.35);
		}
	}

	/* ---------- végétation et réverbères ---------- */
	const trees = [...city.trees, ...city.parkTrees, ...patioTrees.map(t => ({ ...t, k:"d" }))];
	const R = mulberry32(31); trees.forEach(t => t.c = R());
	const trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .34, 2.4, 6, 1, true).translate(0, 1.2, 0), std("#6b4a35"), trees.length);
	const canopyIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std("#ffffff"), trees.length*2);
	{
		const d = new THREE.Object3D();
		trees.forEach((t, i) => {
			const s = t.s || 1;
			d.position.set(t.x, 0, t.z); d.rotation.set(0, 0, 0); d.scale.setScalar(s); d.updateMatrix(); trunkIM.setMatrixAt(i, d.matrix);
			d.position.set(t.x, 3.6*s, t.z); d.rotation.set(R(), R()*3, R()); d.scale.set(2.2*s, 1.9*s, 2.2*s); d.updateMatrix(); canopyIM.setMatrixAt(i*2, d.matrix);
			d.position.set(t.x + (R() - .5)*2*s, 5*s, t.z + (R() - .5)*2*s); d.scale.set(1.45*s, 1.35*s, 1.45*s); d.updateMatrix(); canopyIM.setMatrixAt(i*2 + 1, d.matrix);
		});
		[trunkIM, canopyIM].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
	}
	const spots = city.lampSpots;
	const lampMat = std("#fff3d6", { emissive:"#ffd28a", emissiveIntensity:0, flatShading:false });
	const poleIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.08, .12, 3.8, 6).translate(0, 1.9, 0), std("#2c2a30"), Math.max(1, spots.length));
	const headIM = new THREE.InstancedMesh(new THREE.SphereGeometry(.28, 10, 8), lampMat, Math.max(1, spots.length));
	{ const d = new THREE.Object3D(); spots.forEach(([x, z], i) => { d.position.set(x, 0, z); d.updateMatrix(); poleIM.setMatrixAt(i, d.matrix); d.position.set(x, 3.95, z); d.updateMatrix(); headIM.setMatrixAt(i, d.matrix); }); poleIM.count = headIM.count = spots.length; scene.add(poleIM, headIM); }

	/* ---------- la Deûle, comme à Vauban : péniches et bateau de promenade qui naviguent, bateaux amarrés le long
	   des quais (photos du quai Hegel et de la gare d'eau), canards, reflets du soleil sur l'eau ---------- */
	const waterPolys = EMAP.water.map(ring);
	const inWater = (x, z) => waterPolys.some(p => pointInPoly(x, z, p));
	const lineLen = c => { let L = 0; for(let i=0;i+3<c.length;i+=2) L += Math.hypot(c[i+2]-c[i], c[i+3]-c[i+1]); return L; };
	const deule = (EMAP.canals || []).slice().sort((a, b) => lineLen(b) - lineLen(a))[0];
	const along = (c, d) => {
		for(let i=0;i+3<c.length;i+=2){
			const l = Math.hypot(c[i+2]-c[i], c[i+3]-c[i+1]);
			if(d <= l || i + 4 >= c.length){ const f = l ? Math.min(1, d/l) : 0; return [c[i] + (c[i+2]-c[i])*f, c[i+1] + (c[i+3]-c[i+1])*f, Math.atan2(c[i+2]-c[i], c[i+3]-c[i+1])]; }
			d -= l;
		}
		return [c[0], c[1], 0];
	};
	const boats = [], moored = [], ducks = [];
	if(deule){
		const len = lineLen(deule);
		const hullM = std("#2b2f36"), deckM = std("#7c3a2c"), cabM = std("#eef0ec"), winM = std("#3a4a5f", { roughness:.3 }), tarpM = std("#2f5d4a"), redM = std("#9b2f2a");
		const make = (L, W, kind) => {
			const g = new THREE.Group();
			box(g, W, .7, L, kind === "logement" ? redM : hullM, 0, -.2, 0);
			box(g, W*.98, .12, L*.98, deckM, 0, .5, 0);
			if(kind === "peniche"){
				box(g, W*.8, .55, L*.62, tarpM, 0, .55, L*.08);
				box(g, W*.8, 1.3, L*.16, cabM, 0, .55, -L*.4);
				box(g, W*.82, .35, L*.1, winM, 0, 1.45, -L*.36);
			} else if(kind === "logement"){                            // péniche-logement : longue cabine blanche à hublots
				box(g, W*.82, 1.1, L*.7, cabM, 0, .55, -L*.04);
				box(g, W*.84, .32, L*.66, winM, 0, .95, -L*.04);
				box(g, W*.6, .5, L*.12, cabM, 0, 1.65, -L*.3);
			} else {
				box(g, W*.7, .9, L*.45, cabM, 0, .55, -L*.05);
				box(g, W*.72, .3, L*.4, winM, 0, 1.05, -L*.05);
			}
			g.traverse(o => { if(o.isMesh) o.castShadow = true; });
			scene.add(g); return g;
		};
		const r = mulberry32(31);
		for(const [kind, L, W, v] of [["peniche", 9, 1.6, .55], ["peniche", 8, 1.5, .45], ["promenade", 3.6, 1.1, .9]])
			boats.push({ g:make(L, W, kind), L, v, s:(.15 + r()*.7)*len, dir:r() < .5 ? 1 : -1 });
		// amarrés le long d'un quai : on cherche, de part et d'autre de l'axe, le bord de l'eau
		for(let k=0;k<5;k++){
			const d = len*(.3 + k*.09 + r()*.04), [x, z, a] = along(deule, d), nx = Math.cos(a), nz = -Math.sin(a);
			for(const sg of [1, -1]){
				let off = 0; for(let o=2; o<14; o+=.5){ if(inWater(x + nx*o*sg, z + nz*o*sg)) off = o; else break; }
				if(off < 4) continue;
				const kind = k % 2 ? "logement" : "peniche", Lb = kind === "logement" ? 7 : 9;
				const g = make(Lb, 1.6, kind); g.position.set(x + nx*(off - 1.4)*sg, .12, z + nz*(off - 1.4)*sg); g.rotation.y = a;
				moored.push({ g, ph:r()*6 }); break;
			}
		}
		for(let i=0;i<6;i++){
			const g = new THREE.Group();
			const b = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), std(i ? "#8a6a4a" : "#f4f1ea", { flatShading:false })); b.scale.set(1, .65, 1.4);
			const h = new THREE.Mesh(new THREE.SphereGeometry(.26, 10, 8), std(i ? "#2f6b4a" : "#f4f1ea", { flatShading:false })); h.position.set(0, .38, .5);
			const k = new THREE.Mesh(new THREE.BoxGeometry(.14, .07, .22), std("#e8963a")); k.position.set(0, .34, .78);
			g.add(b, h, k); scene.add(g);
			ducks.push({ g, ph:r()*6, d0:(.35 + r()*.3)*len, off:(r() - .5)*6 });
		}
		var deuleLen = len;
	}
	waterRipples(city.ground.water);          // reflets et paillettes du soleil (ou de la lune), comme sur la Deûle de Vauban

	/* ---------- étudiants et passants sur les vrais trottoirs ---------- */
	const WN = []; for(let i=0;i<EMAP.walk.n.length;i+=2) WN.push([EMAP.walk.n[i], EMAP.walk.n[i+1]]);
	const ADJ = WN.map(() => []); for(let i=0;i<EMAP.walk.e.length;i+=3){ const [a, b, w] = EMAP.walk.e.slice(i, i+3); ADJ[a].push([b, w]); ADJ[b].push([a, w]); }
	const rr = mulberry32(77), pick = a => a[Math.floor(rr()*a.length)];
	const starts = WN.map((_, i) => i).filter(i => ADJ[i].length && Math.hypot(WN[i][0], WN[i][1]) < 70);
	const walkers = [];
	for(let i=0; i<28 && starts.length; i++){
		const s = makePerson(scene), from = pick(starts), nb = pick(ADJ[from]);
		Object.assign(s, { from, to:nb[0], w:nb[1], t:rr(), speed:1.5 + rr()*.7, wait:0, side:rr() < .5 ? -1 : 1, ph:rr()*6 });
		walkers.push(s);
	}
	// sur le parvis de Wenov, des groupes qui discutent
	for(let k=0;k<4;k++){ const q = patioTrees[k]; for(const a of [0, Math.PI]){ const s = makePerson(scene); s.g.position.set(q.x + Math.sin(a)*.8 - 1, 0, q.z + Math.cos(a)*.8); s.g.rotation.y = a + Math.PI; Object.assign(s, { chat:true, ph:rr()*6 }); walkers.push(s); } }

	/* ---------- météo, comme à Vauban : pluie et rues mouillées, brouillard, ombres de nuages ---------- */
	const rain = createRain(scene);
	for(const m of [ground.material, city.ground.lawn, city.ground.road, city.ground.ped, city.ground.walk, ...city.roofs, ...city.flats, ...city.walls, brickM, towerM, facadeM]) if(m) cloudShade(m);
	const wetBase = [city.ground.road, city.ground.ped, city.ground.walk].filter(Boolean).map(m => ({ m, c:m.color.clone(), r:m.roughness }));
	function setWeather(w, night){
		rain.set(w === "pluie" ? (night ? .7 : 1) : 0);
		for(const { m, c, r } of wetBase){ m.color.copy(c).multiplyScalar(w === "pluie" ? .72 : 1); m.roughness = w === "pluie" ? .28 : r; m.metalness = w === "pluie" ? .12 : 0; }
		// brume : le lointain disparaît dans le brouillard du matin, s'estompe sous la pluie
		scene.fog.near = w === "brouillard" ? 40 : w === "pluie" ? 120 : 220;
		scene.fog.far = w === "brouillard" ? 260 : w === "pluie" ? 430 : 560;
	}

	function update(dt, t, camera){
		if(camera) rain.follow(camera.position);
		for(const s of walkers){
			if(s.chat){ s.body.rotation.z = Math.sin(t*1.3 + s.ph)*.04; continue; }
			if(s.wait > 0){ s.wait -= dt; continue; }
			const [x1, z1] = WN[s.from], [x2, z2] = WN[s.to], len = Math.hypot(x2-x1, z2-z1) || 1;
			s.t += s.speed*dt/len;
			if(s.t >= 1){
				const nb = ADJ[s.to].filter(([n]) => n !== s.from), next = nb.length && rr() < .9 ? pick(nb) : pick(ADJ[s.to]);
				s.from = s.to; s.to = next[0]; s.w = next[1]; s.t = 0;
				if(Math.hypot(...WN[s.from]) > 110 && rr() < .7){ const back = ADJ[s.from].find(([n]) => Math.hypot(...WN[n]) < Math.hypot(...WN[s.from])); if(back){ s.to = back[0]; s.w = back[1]; } }
				if(rr() < .2) s.wait = 1 + rr()*4;
				continue;
			}
			const dx = (x2-x1)/len, dz = (z2-z1)/len, off = s.side*(s.w/2 + .75);
			s.g.position.set(x1 + (x2-x1)*s.t - dz*off, 0, z1 + (z2-z1)*s.t + dx*off);
			let diff = Math.atan2(dx, dz) - s.g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
			s.g.rotation.y += diff*Math.min(1, dt*6);
			const step = t*s.speed*4.2 + s.ph;
			s.body.position.y = .65 + Math.abs(Math.sin(step))*.07; s.body.rotation.z = Math.sin(step)*.05;
		}
		for(const b of boats){
			b.s += b.v*b.dir*dt;
			if(b.s > deuleLen - b.L){ b.s = deuleLen - b.L; b.dir = -1; }
			if(b.s < b.L){ b.s = b.L; b.dir = 1; }
			const [x, z, a] = along(deule, b.s);
			b.g.position.set(x, .12 + Math.sin(t*1.1 + b.L)*.03, z);
			b.g.rotation.set(Math.sin(t*.9 + b.L)*.01, a + (b.dir < 0 ? Math.PI : 0), 0);
			b.g.visible = inWater(x, z);
		}
		for(const m of moored) m.g.position.y = .12 + Math.sin(t*.8 + m.ph)*.025;
		for(const d of ducks){
			const k = d.d0 + Math.sin(t*.02 + d.ph)*30, [x, z, a] = along(deule, k);
			d.g.position.set(x + Math.cos(a)*d.off, .14 + Math.sin(t*1.6 + d.ph)*.04, z - Math.sin(a)*d.off);
			d.g.rotation.y = a + (Math.cos(t*.02 + d.ph) < 0 ? Math.PI : 0);
			d.g.visible = inWater(d.g.position.x, d.g.position.z);
		}
	}

	/* ---------- ambiance (saison, nuit) ---------- */
	const canopyCol = new THREE.Color();
	function setAmbiance(S, L, night, W){
		// W : la lumière déjà ajustée à la météo (ciel gris sous la pluie, laiteux dans le brouillard) et la météo elle-même
		if(W && W.light) L = W.light;
		scene.fog.color.set(L.fog);
		hemi.color.set(L.hemiSky); hemi.groundColor.set(L.hemiGround); hemi.intensity = L.hemiI;
		sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.sunPos);
		ground.material.color.set(S.grass);
		city.setSeason(S); city.setNight(night);
		trees.forEach((t, i) => {
			canopyCol.set(S.trees[Math.floor(t.c*S.trees.length)]); canopyIM.setColorAt(i*2, canopyCol);
			canopyCol.set(S.trees[Math.floor(((t.c*7.3)%1)*S.trees.length)]); canopyIM.setColorAt(i*2 + 1, canopyCol);
		});
		if(canopyIM.instanceColor) canopyIM.instanceColor.needsUpdate = true;
		setNight(night);
		setWeather(W ? W.weather : "soleil", night);
	}
	function setNight(night){
		facadeM.emissiveIntensity = night ? 1.1 : 0; brickM.emissiveIntensity = night ? .8 : 0; towerM.emissiveIntensity = night ? .6 : 0; atticM.emissiveIntensity = night ? .7 : 0;
		if(diamantM) diamantM.emissiveIntensity = night ? .8 : 0; if(ftGlass) ftGlass.emissiveIntensity = night ? .6 : 0;
		shopM.emissiveIntensity = night ? .9 : 0; glassM.emissiveIntensity = night ? .55 : 0; shedMat.emissiveIntensity = night ? .7 : 0;
		lampMat.emissiveIntensity = night ? 2.2 : 0;
		tower.traverse(o => { if(o.userData.clock) o.material.emissiveIntensity = night ? 1.2 : 0; });
		city.setNight(night); landmarks.setNight(night ? 1 : 0);
	}

	/* ---------- lieux : épingles et points de vue ---------- */
	const sp = EMAP.spots, P = EMAP.pois, [bx, bz] = cen(BL);
	const at = (x, z, y, d = 30, h = 26) => ({ pin:[x, y, z], target:[x, Math.min(6, y*.4), z], cam:[x + d*.45, h, z + d] });
	const places = {
		wenov:    { icon:"💡", name:"Wenov · École du Numérique", ...at(WC[0], WC[1], NF*FH + 6, 64, 36) },
		cyber:    { icon:"🛡️", name:"Campus Cyber Hauts-de-France", ...at(W[1][0], W[1][1], NF*FH + 4, 44, 28) },
		blan:     { icon:"🏭", name:"Le Blan-Lafont · Euratechnologies", ...at(bx, bz, BH + 9, 74, 44) },
		factory:  P.factory && { icon:"🛏️", name:"Student Factory", ...at(P.factory.x, P.factory.z, 12, 46, 30) },
		metro:    M && { icon:"🚇", name:"Métro · Canteleu – Euratechnologies", ...at(M.x, M.z, 6, 44, 30) },
		frenchtech: P.frenchtech && { icon:"🚀", name:"La French Tech Lille", ...at(P.frenchtech.x, P.frenchtech.z, 11, 46, 30) },
		pionnieres: sp.ada && { icon:"👩‍💻", name:"Les squares des pionnières", ...at((sp.ada.x + sp.hedy.x)/2, (sp.ada.z + sp.hedy.z)/2, 5, 56, 36) },
		berges:   sp.jardinblan && { icon:"🌊", name:"Les berges de la Deûle", ...at(sp.jardinblan.x, sp.jardinblan.z, 5, 52, 32) }
	};
	for(const k in places) if(!places[k]) delete places[k];
	const pins = Object.entries(places).map(([id, p]) => ({ id, icon:p.icon, name:p.name, pos:p.pin }));

	return {
		scene, update, setNight, setAmbiance, places, zone:true, arrival,
		home:{ pos:V(WC[0] - 10, 95, WC[1] + 200), target:V(WC[0] - 20, 0, WC[1] + 15) },
		limits:{ minDistance:18, maxDistance:240, minPolarAngle:.3, maxPolarAngle:1.2, box:[-150, 150, -150, 160] },
		pins
	};
}
function metroSign(){
	const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
	x.fillStyle = "#d6213a"; x.fillRect(0, 0, 64, 64);
	x.fillStyle = "#ffffff"; x.font = "bold 48px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("M", 32, 35);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
