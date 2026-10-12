/* Le quartier d'Euratechnologies (Bois-Blancs, Lille), autour du campus Wenov et de l'École du Numérique.
   Tout vient d'OpenStreetMap (js/euramap.js, généré par tools/build_eura.py), sauf trois bâtiments faits main
   d'après photos : Wenov (Lalou+Lebec, 2022 : béton clair, patio planté sur pilotis, volume vitré),
   le Blan-Lafont (filature de coton de 1896, siège d'Euratechnologies depuis 2009) et sa tour.
   Chargé à la demande, comme l'atrium : une seule scène de quartier à la fois (léger sur téléphone). */
import * as THREE from "three";
import { std, box, cyl, cone, mesh, makeStudent, mulberry32 } from "./kit.js";
import { buildCity, pointInPoly } from "./city.js";
import { EMAP } from "./euramap.js";

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
function brickArches(){
	// filature : brique rouge, grandes baies cintrées
	const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
	x.fillStyle = "#a9533c"; x.fillRect(0, 0, 128, 128);
	x.fillStyle = "rgba(0,0,0,.08)"; for(let y=0; y<128; y+=8) x.fillRect(0, y, 128, 2);
	x.fillStyle = "#d9c9b0"; x.fillRect(30, 18, 68, 92);
	x.fillStyle = "#4f6276"; x.beginPath(); x.moveTo(36, 106); x.lineTo(36, 46); x.arc(64, 46, 28, Math.PI, 0); x.lineTo(92, 106); x.fill();
	x.fillStyle = "rgba(217,201,176,.7)"; x.fillRect(62, 22, 4, 84); x.fillRect(36, 70, 56, 3);
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
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

	const city = buildCity(scene, EMAP, { offices:true });

	/* ---------- Wenov ---------- */
	const W = ring(EMAP.wenov.pts), WC = cen(W);
	const wen = new THREE.Group(); scene.add(wen);
	const white = std("#efede8"), slabM = std("#f6f4ef");
	const gridTex = concreteGrid(), FH = 1.45, NF = 5;                       // R+4, ~3,6 m par niveau
	gridTex.repeat.set(1/1.6, 1/FH);
	const facadeM = new THREE.MeshStandardMaterial({ map:gridTex, roughness:.85, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:litGrid() });
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
	ringSlab(patio, null, .06, std("#d9d4ca", { flatShading:false }), 0, wen);
	const patioTrees = [];
	{ const r = mulberry32(9); for(let k=0;k<7;k++){ const t = .25 + r()*.5, s = .25 + r()*.5; const p0 = patio[0], p1 = patio[1], p3 = patio[3];
		patioTrees.push({ x:p0[0] + (p1[0]-p0[0])*t + (p3[0]-p0[0])*s, z:p0[1] + (p1[1]-p0[1])*t + (p3[1]-p0[1])*s, s:.85 + r()*.35 }); } }
	const yellow = std("#f2c63c");
	for(let k=0;k<5;k++){ const q = patioTrees[k]; box(wen, 1.3, .35, .45, yellow, q.x + 1.6, 0, q.z + .4, k); }
	// toiture : édicules et panneaux
	const roofY = NF*FH + .08;
	for(let k=0;k<4;k++){ const p = W[k]; box(wen, 2.4, 1.2, 1.8, std("#c9c6bf"), p[0] + (WC[0]-p[0])*.18, roofY, p[1] + (WC[1]-p[1])*.18, k*.4); }

	/* ---------- le Blan-Lafont et sa tour ---------- */
	const BL = ring(EMAP.blan.pts);
	const brickTex = brickArches(); brickTex.repeat.set(1/2.4, 1/2);
	const brickM = new THREE.MeshStandardMaterial({ map:brickTex, roughness:.9, emissive:"#ffffff", emissiveIntensity:0, emissiveMap:litGrid() });
	const BH = 8;                                                             // ~20 m
	ringSlab(BL, null, BH, brickM, 0, scene);
	ringSlab(offset(BL, -.25), null, .35, std("#8f4632"), BH, scene);
	// sheds vitrés de la filature
	{
		const [bx, bz] = cen(BL), ang = EMAP.blan.ang;
		const xs = BL.map(([x, z]) => (x - bx)*Math.cos(ang) + (z - bz)*Math.sin(ang)), zs = BL.map(([x, z]) => -(x - bx)*Math.sin(ang) + (z - bz)*Math.cos(ang));
		const L = Math.max(...xs) - Math.min(...xs), D = Math.max(...zs) - Math.min(...zs);
		const shed = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.1, 0), new THREE.Vector2(1.1, 0), new THREE.Vector2(1.1, 1.25)]), { depth:D*.62, bevelEnabled:false }).translate(0, 0, -D*.31);
		const shedM = std("#cfe2e8", { transparent:true, opacity:.85, roughness:.2, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
		const grp = new THREE.Group(); grp.position.set(bx, BH + .3, bz); grp.rotation.y = -ang; scene.add(grp);
		const n = Math.floor(L*.62/2.2);
		for(let k=0;k<n;k++) mesh(shed, shedM, grp, -L*.31 + k*2.2 + 1.1, 0, 0, 0);
		var shedMat = shedM;
	}
	const T = EMAP.blan.tower, TH = 15;
	const tower = new THREE.Group(); tower.position.set(T.x, 0, T.z); tower.rotation.y = -T.ang; scene.add(tower);
	const tw = Math.max(3.2, Math.min(T.L, 6)), td = Math.max(3.2, Math.min(T.D, 6));
	const towerTex = brickArches(); towerTex.repeat.set(1/2, 1/2.2);
	box(tower, tw, TH, td, new THREE.MeshStandardMaterial({ map:towerTex, roughness:.9 }), 0, 0, 0);
	box(tower, tw + .5, .5, td + .5, std("#8f4632"), 0, TH - 2.2, 0);
	box(tower, tw + .7, .6, td + .7, std("#d9c9b0"), 0, TH, 0);
	const spire = new THREE.Mesh(new THREE.ConeGeometry(Math.max(tw, td)*.72, 6.5, 4).rotateY(Math.PI/4).translate(0, 3.25, 0), std("#4f5767"));
	spire.position.y = TH + .6; spire.castShadow = true; tower.add(spire);
	for(const s of [-1, 1]) for(const ax of [0, 1]){
		const c = mesh(new THREE.CircleGeometry(.9, 18), std("#f4efe4", { emissive:"#ffe2a8", emissiveIntensity:0 }), tower, ax ? s*(tw/2 + .02) : 0, TH - 3.6, ax ? 0 : s*(td/2 + .02), ax ? s*Math.PI/2 : (s < 0 ? Math.PI : 0), false);
		c.userData.clock = true;
	}

	/* ---------- métro ligne 2 : Canteleu – Euratechnologies ---------- */
	const M = EMAP.spots.metro;
	if(M){
		for(const [x, z] of (M.exits.length ? M.exits : [[M.x, M.z]])){
			box(scene, 2.2, .1, 3.2, std("#55525a"), x, .05, z);
			const pole = cyl(scene, .07, .07, 3.4, std("#3b3a40"), x + 1.3, 0, z, 6);
			const sign = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .12), new THREE.MeshStandardMaterial({ map:metroSign(), emissive:"#ffffff", emissiveMap:metroSign(), emissiveIntensity:.15 }));
			sign.position.set(x + 1.3, 3.6, z); scene.add(sign);
		}
	}

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
	const trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .34, 2.4, 6).translate(0, 1.2, 0), std("#6b4a35"), trees.length);
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

	/* ---------- la Deûle : une péniche passe ---------- */
	let barge = null;
	{
		const polys = EMAP.water.map(ring).filter(p => p.length > 8);
		const big = polys.sort((a, b) => b.length - a.length)[0];
		if(big){
			// axe principal du bras de rivière le plus proche de Wenov
			const near = big.filter(([x, z]) => Math.hypot(x, z) < 160);
			const pts = near.length > 10 ? near : big, [mx, mz] = cen(pts);
			let sxx = 0, szz = 0, sxz = 0; for(const [x, z] of pts){ sxx += (x-mx)**2; szz += (z-mz)**2; sxz += (x-mx)*(z-mz); }
			const a = .5*Math.atan2(2*sxz, sxx - szz), ux = Math.cos(a), uz = Math.sin(a);
			const along = pts.map(([x, z]) => (x-mx)*ux + (z-mz)*uz), L = Math.min(Math.max(...along) - Math.min(...along), 220);
			const g = new THREE.Group(); scene.add(g);
			box(g, 2.2, .9, 9, std("#2f3a4a"), 0, -.2, 0);
			box(g, 2.0, .9, 2.4, std("#efe6d6"), 0, .7, -3);
			box(g, 2.1, .25, 5, std("#7b4a33"), 0, .7, 1.4);
			barge = { g, mx, mz, ux, uz, L, t:.2, dir:1, ok:p => pointInPoly(p[0], p[1], big) };
		}
	}

	/* ---------- étudiants et passants sur les vrais trottoirs ---------- */
	const WN = []; for(let i=0;i<EMAP.walk.n.length;i+=2) WN.push([EMAP.walk.n[i], EMAP.walk.n[i+1]]);
	const ADJ = WN.map(() => []); for(let i=0;i<EMAP.walk.e.length;i+=3){ const [a, b, w] = EMAP.walk.e.slice(i, i+3); ADJ[a].push([b, w]); ADJ[b].push([a, w]); }
	const rr = mulberry32(77), pick = a => a[Math.floor(rr()*a.length)];
	const starts = WN.map((_, i) => i).filter(i => ADJ[i].length && Math.hypot(WN[i][0], WN[i][1]) < 70);
	const walkers = [];
	for(let i=0; i<28 && starts.length; i++){
		const s = makeStudent(scene), from = pick(starts), nb = pick(ADJ[from]);
		Object.assign(s, { from, to:nb[0], w:nb[1], t:rr(), speed:1.5 + rr()*.7, wait:0, side:rr() < .5 ? -1 : 1, ph:rr()*6 });
		walkers.push(s);
	}
	// sur le parvis de Wenov, des groupes qui discutent
	for(let k=0;k<4;k++){ const q = patioTrees[k]; for(const a of [0, Math.PI]){ const s = makeStudent(scene); s.g.position.set(q.x + Math.sin(a)*.8 - 1, 0, q.z + Math.cos(a)*.8); s.g.rotation.y = a + Math.PI; Object.assign(s, { chat:true, ph:rr()*6 }); walkers.push(s); } }

	function update(dt, t){
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
		if(barge){
			barge.t += dt*barge.dir*.012;
			if(barge.t > .45 || barge.t < -.45) barge.dir *= -1;
			const x = barge.mx + barge.ux*barge.t*barge.L, z = barge.mz + barge.uz*barge.t*barge.L;
			barge.g.position.set(x, .25 + Math.sin(t*1.2)*.04, z);
			barge.g.rotation.y = Math.atan2(barge.ux*barge.dir, barge.uz*barge.dir);
			barge.g.visible = barge.ok([x, z]);
		}
	}

	/* ---------- ambiance (saison, nuit) ---------- */
	const canopyCol = new THREE.Color();
	function setAmbiance(S, L, night){
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
	}
	function setNight(night){
		facadeM.emissiveIntensity = night ? 1.1 : 0; brickM.emissiveIntensity = night ? .8 : 0;
		shopM.emissiveIntensity = night ? .9 : 0; glassM.emissiveIntensity = night ? .55 : 0; shedMat.emissiveIntensity = night ? .7 : 0;
		lampMat.emissiveIntensity = night ? 2.2 : 0;
		tower.traverse(o => { if(o.userData.clock) o.material.emissiveIntensity = night ? 1.2 : 0; });
		city.setNight(night);
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
		scene, update, setNight, setAmbiance, places, zone:true,
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
