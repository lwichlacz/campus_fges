/* L'atrium du bâtiment Michel Falise : briques, arcades, coursives d'acier,
   escaliers croisés et grande verrière. Vue « maison de poupée » : le mur côté
   caméra s'efface tout seul. */
import * as THREE from "three";
import { std, box, cyl, mesh, beam, gable, cached, windowBatch, makeStudent, R, rng, pick, BOXC } from "./kit.js";

const W = 34, D = 22, FL = 4.2, TOP = 16.4, RIDGE = 20;
const HX = W/2, HZ = D/2, GAL = 2.4;

function brickTexture(){
	const c = document.createElement("canvas"); c.width = c.height = 256;
	const x = c.getContext("2d");
	x.fillStyle = "#d7b8a2"; x.fillRect(0,0,256,256);
	const bh = 16, bw = 48;
	for(let r=0; r<256/bh; r++){
		const off = (r % 2) * bw/2;
		for(let k=-1; k<256/bw+1; k++){
			const l = 52 + Math.random()*10, s = 50 + Math.random()*12;
			x.fillStyle = `hsl(${10 + Math.random()*8}, ${s}%, ${l*.72}%)`;
			x.fillRect(k*bw + off + 2, r*bh + 2, bw - 3, bh - 3);
		}
	}
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
	return t;
}
function wallPlane(w, h, mat){
	const g = new THREE.PlaneGeometry(w, h);
	const uv = g.attributes.uv;
	for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*w/3, uv.getY(i)*h/3);
	const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
	return m;
}
function menuTexture(){
	const c = document.createElement("canvas"); c.width = 256; c.height = 160;
	const x = c.getContext("2d");
	x.fillStyle = "#2c2f2b"; x.fillRect(0,0,256,160);
	x.strokeStyle = "#a07a4e"; x.lineWidth = 10; x.strokeRect(5,5,246,150);
	x.fillStyle = "#f4ead6"; x.textAlign = "center";
	x.font = "bold 30px Georgia, serif"; x.fillText("Le Comptoir", 128, 50);
	x.font = "18px Georgia, serif"; x.fillStyle = "#e9c27a";
	x.fillText("Café · Thé · Cookies", 128, 88);
	x.fillText("~ ouvert ~", 128, 122);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createAtrium({ background }){
	const scene = new THREE.Scene();
	scene.background = background;
	const small = s => { s.g.scale.setScalar(.95); return s; };

	const hemi = new THREE.HemisphereLight("#fff1dd", "#6d5a4e", 1.1);
	const sun = new THREE.DirectionalLight("#fff3dc", 2.2);
	sun.position.set(-14, 40, 12); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, { left:-26, right:26, top:22, bottom:-22, near:5, far:80 });
	sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
	scene.add(hemi, sun);

	const brick = std("#ffffff", { map:brickTexture(), flatShading:false, roughness:.95 });
	const brickSolid = std("#a9533c");
	const steel = std("#8f979e", { roughness:.55, metalness:.35, flatShading:false });
	const steelDark = std("#6f777e", { roughness:.55, metalness:.35, flatShading:false });
	const mesh_ = std("#a9b0b6", { transparent:true, opacity:.32, roughness:.6, metalness:.3, flatShading:false, depthWrite:false, side:THREE.DoubleSide });
	const wood = std("#d6b384", { flatShading:false });
	const concrete = std("#9e9a95", { roughness:.55, flatShading:false });
	const glassRoof = new THREE.MeshStandardMaterial({ color:"#dcecf2", transparent:true, opacity:.16, roughness:.1, metalness:.1, side:THREE.DoubleSide, depthWrite:false });
	const roomGlow = std("#3a3226", { flatShading:false, emissive:"#ffd27d", emissiveIntensity:.9 });
	const glassDark = std("#55667a", { roughness:.25, metalness:.2, flatShading:false, emissive:"#ffc56e", emissiveIntensity:0 });
	const frame = std("#7f878e", { metalness:.3, roughness:.5 });
	const lampMat = std("#fff6e2", { emissive:"#ffe2a8", emissiveIntensity:1.2, flatShading:false });

	/* sol */
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI/2), concrete);
	floor.receiveShadow = true; scene.add(floor);
	// socle extérieur (visible en vue maquette)
	box(scene, W+2, .6, D+2, std("#7d746c"), 0, -.63, 0, 0, false);

	/* ---------- murs (un groupe par mur, masquable) ---------- */
	const walls = [];
	const defs = [
		{ p:[0,0,-HZ], ry:0, L:W, n:[0,0,1] },
		{ p:[0,0,HZ], ry:Math.PI, L:W, n:[0,0,-1] },
		{ p:[-HX,0,0], ry:Math.PI/2, L:D, n:[1,0,0] },
		{ p:[HX,0,0], ry:-Math.PI/2, L:D, n:[-1,0,0] }
	];
	const postGeo = cached("apost", () => new THREE.BoxGeometry(.08, 1, .08).translate(0,.5,0));
	const colGeo = cached("acol", () => new THREE.CylinderGeometry(.13,.13,1,8).translate(0,.5,0));
	for(const def of defs){
		const group = new THREE.Group(); scene.add(group);
		const h = new THREE.Object3D(); h.position.set(...def.p); h.rotation.y = def.ry; group.add(h);
		const wb = windowBatch(.5);
		const L = def.L;
		const plane = wallPlane(L, TOP, brick); plane.position.y = TOP/2; h.add(plane);
		// pilastres
		const bays = Math.round(L/4.2), bw = L/bays;
		for(let i=0;i<=bays;i++) box(h, .7, TOP, .45, brickSolid, -L/2 + i*bw, 0, .2);
		box(h, L, .5, .5, brickSolid, 0, TOP-.5, .22);
		// arcades du rez-de-chaussée (salles éclairées) et fenêtres des étages
		for(let i=0;i<bays;i++){
			const x = -L/2 + (i+.5)*bw;
			wb.win(h, x, 1.35, .05, bw*.62, 2.4, 0, { arch:true, door:true, lit:true });
			for(let f=1; f<4; f++) wb.win(h, x, f*FL + 1.55, .05, bw*.42, 1.7, 0, { arch:true });
		}
		wb.build(group, roomGlow, glassDark, frame);
		// coursives
		const inner = (def.L === W) ? W : D - 2*GAL;
		const rail = (def.L === W) ? W - 2*GAL : D - 2*GAL;
		const posts = [], cols = [];
		for(let f=1; f<4; f++){
			const y = f*FL;
			box(h, inner, .28, GAL, steel, 0, y-.28, GAL/2, 0);
			box(h, inner, .45, .12, steelDark, 0, y-.5, GAL, 0);
			box(h, rail, .07, .09, steel, 0, y+1.02, GAL-.05, 0, false);
			box(h, rail, .95, .03, mesh_, 0, y+.05, GAL-.05, 0, false);
			for(let x=-rail/2; x<=rail/2+.01; x+=rail/Math.round(rail/2.1)) posts.push([x, y, GAL-.05]);
		}
		for(let i=1;i<bays;i++){ const x = -L/2 + i*bw; if(Math.abs(x) <= rail/2 + .01) cols.push([x, GAL-.15]); }
		const d = new THREE.Object3D();
		const pim = new THREE.InstancedMesh(postGeo, steel, posts.length);
		posts.forEach(([x,y,z],i) => { d.position.set(x,y,z); d.scale.set(1,1.05,1); d.updateMatrix(); pim.setMatrixAt(i, d.matrix); });
		const cim = new THREE.InstancedMesh(colGeo, steel, Math.max(1, cols.length));
		cols.forEach(([x,z],i) => { d.position.set(x,0,z); d.scale.set(1,TOP,1); d.updateMatrix(); cim.setMatrixAt(i, d.matrix); });
		cim.count = cols.length; cim.castShadow = true;
		h.add(pim, cim);
		// pignon vitré au-dessus des murs latéraux
		if(def.L === D){ const tri = mesh(gable(.1, D, RIDGE-TOP), glassRoof, h, 0, TOP, 0, Math.PI/2, false); tri.renderOrder = 2; }
		walls.push({ group, p:new THREE.Vector3(...def.p), n:new THREE.Vector3(...def.n) });
	}

	/* ---------- verrière ---------- */
	const roof = new THREE.Group(); scene.add(roof);
	const slope = Math.hypot(HZ, RIDGE-TOP), ang = Math.atan2(RIDGE-TOP, HZ);
	for(const s of [-1,1]){
		const g = new THREE.Mesh(new THREE.PlaneGeometry(W, slope), glassRoof);
		g.position.set(0, (TOP+RIDGE)/2, s*HZ/2);
		g.rotation.x = -Math.PI/2 + (s < 0 ? -ang : ang);
		g.renderOrder = 2;
		roof.add(g);
	}
	const V = (x,y,z) => new THREE.Vector3(x,y,z);
	for(let x=-HX; x<=HX+.01; x+=W/12){
		beam(roof, V(x,TOP,-HZ), V(x,RIDGE,0), .14, .3, steel);
		beam(roof, V(x,RIDGE,0), V(x,TOP,HZ), .14, .3, steel);
	}
	for(const k of [.33,.66]){
		for(const s of [-1,1]) beam(roof, V(-HX, TOP + (RIDGE-TOP)*k, s*HZ*(1-k)), V(HX, TOP + (RIDGE-TOP)*k, s*HZ*(1-k)), .12, .12, steel);
	}
	beam(roof, V(-HX,RIDGE,0), V(HX,RIDGE,0), .2, .3, steel);
	for(let x=-HX+W/6; x<HX; x+=W/3){
		beam(roof, V(x,TOP,-HZ), V(x,TOP,HZ), .16, .22, steelDark);
		beam(roof, V(x,TOP,-HZ*.5), V(x,TOP+(RIDGE-TOP)*.5,0), .08, .08, steel);
		beam(roof, V(x,TOP,HZ*.5), V(x,TOP+(RIDGE-TOP)*.5,0), .08, .08, steel);
	}
	// luminaires suspendus
	for(const [x,z] of [[-9,-4],[-9,4],[3,-4],[3,4]]){
		box(roof, 7, .12, .22, lampMat, x, 13.2, z, 0, false);
		for(const s of [-1,1]) box(roof, .02, TOP-13.2, .02, steelDark, x + s*3.2, 13.3, z, 0, false);
	}

	/* ---------- escaliers croisés ---------- */
	const treadGeo = cached("tread", () => new THREE.BoxGeometry(1, .07, 1));
	const flights = [];
	function flight(x0, x1, y0, y1, z){
		const n = Math.round((y1-y0)/.2), run = (x1-x0)/n;
		for(let i=0;i<n;i++) flights.push([x0 + run*(i+.5), y0 + (y1-y0)*(i+1)/n, z, Math.abs(run)]);
		for(const s of [-1,1]){
			const zz = z + s*.95;
			beam(scene, V(x0,y0,zz), V(x1,y1,zz), .08, .32, steelDark);
			beam(scene, V(x0,y0+1,zz), V(x1,y1+1,zz), .06, .06, steel, false);
			const p = beam(scene, V(x0,y0+.52,zz), V(x1,y1+.52,zz), .02, .9, mesh_, false); p.castShadow = false;
		}
	}
	function landing(x0, x1, z0, z1, y){
		box(scene, x1-x0, .25, z1-z0, steel, (x0+x1)/2, y-.25, (z0+z1)/2);
		for(const [x,z] of [[x0+.1,z0+.1],[x1-.1,z0+.1],[x0+.1,z1-.1],[x1-.1,z1-.1]]) box(scene, .12, y-.25, .12, steel, x, 0, z);
	}
	flight(5, 12.5, 0, FL, 1);
	landing(12.5, HX-GAL+.01, -.05, 4, FL);
	flight(12.5, 5, FL, 2*FL, 3);
	landing(3, 5, -.05, 4, 2*FL);
	flight(5, 12.5, 2*FL, 3*FL, 1);
	landing(12.5, HX-GAL+.01, -.05, 4, 3*FL);
	{
		const im = new THREE.InstancedMesh(treadGeo, wood, flights.length), d = new THREE.Object3D();
		flights.forEach(([x,y,z,r],i) => { d.position.set(x,y,z); d.scale.set(r+.02, 1, 1.85); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		im.castShadow = true; im.receiveShadow = true; scene.add(im);
	}

	/* ---------- mobilier ---------- */
	const tables = [];
	for(let r=0;r<4;r++) for(let c=0;c<5;c++) tables.push([-8.5 + c*2.3, -5 + r*3.1]);
	{
		const top = new THREE.InstancedMesh(BOXC, wood, tables.length);
		const legs = new THREE.InstancedMesh(BOXC, std("#2e2c30"), tables.length*2);
		const seat = new THREE.InstancedMesh(BOXC, std("#c9a06b", { flatShading:false }), tables.length);
		const d = new THREE.Object3D();
		tables.forEach(([x,z],i) => {
			d.position.set(x, .78, z); d.scale.set(1.6,.06,.8); d.updateMatrix(); top.setMatrixAt(i, d.matrix);
			for(const s of [-1,1]){ d.position.set(x + s*.7, .38, z); d.scale.set(.07,.76,.7); d.updateMatrix(); legs.setMatrixAt(i*2 + (s>0), d.matrix); }
			d.position.set(x, .45, z + .9); d.scale.set(1.4,.06,.4); d.updateMatrix(); seat.setMatrixAt(i, d.matrix);
		});
		for(const m of [top, legs, seat]){ m.castShadow = true; m.receiveShadow = true; scene.add(m); }
	}
	// plantes
	const potM = std("#c98a5a"), leafM = std("#5f8f4a");
	for(const [x,z] of [[-14,-9.6],[-14,9.6],[14,-9.6],[14,9.6],[-2.1,-9.6],[-2.1,9.6],[6.4,-9.6],[6.4,9.6]]){
		cyl(scene, .45, .35, .7, potM, x, 0, z, 10);
		const l = mesh(cached("leaf", () => new THREE.IcosahedronGeometry(.8, 0)), leafM, scene, x, 1.25, z); l.scale.set(1, 1.2, 1);
	}

	/* ---------- Le Comptoir (café) ---------- */
	const cafe = new THREE.Group(); scene.add(cafe);
	const cafeWood = std("#8a5a3c"), cafeTop = std("#efe3cc");
	box(cafe, 1.3, 1.05, 6.4, cafeWood, -13.2, 0, 0);
	box(cafe, 1.55, .1, 6.7, cafeTop, -13.2, 1.05, 0);
	box(cafe, .6, .55, .5, std("#c4c8cc", { metalness:.6, roughness:.3 }), -13.4, 1.15, -1.8);
	cyl(cafe, .12, .12, .25, std("#f4f1ea"), -13, 1.15, -1.2, 10);
	cyl(cafe, .12, .12, .25, std("#e07a5f"), -13, 1.15, -.8, 10);
	for(let i=0;i<5;i++) mesh(cached("cookie", () => new THREE.CylinderGeometry(.13,.13,.05,10)), std("#c08a4e"), cafe, -13.1, 1.17 + i*.05, 1.6);
	for(const z of [-1.6, 0, 1.6]){ cyl(cafe, .3, .3, .07, cafeWood, -11.9, .82, z, 12); cyl(cafe, .05, .05, .82, std("#2e2c30"), -11.9, 0, z); }
	const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshStandardMaterial({ map:menuTexture(), roughness:.8 }));
	menu.position.set(-HX + .3, 2.75, 0); menu.rotation.y = Math.PI/2; cafe.add(menu);
	// guirlande
	const bulbs = [], bulbMat = std("#fff4d6", { emissive:"#ffcf7a", emissiveIntensity:1.6, flatShading:false });
	for(let i=0;i<=24;i++){
		const k = i/24, z = -3.6 + k*7.2, y = 3.85 - Math.sin(k*Math.PI)*.5;
		bulbs.push([-14.55, y, z]);
	}
	{
		const im = new THREE.InstancedMesh(cached("bulb", () => new THREE.SphereGeometry(.07, 8, 6)), bulbMat, bulbs.length), d = new THREE.Object3D();
		bulbs.forEach((b,i) => { d.position.set(...b); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		cafe.add(im);
	}
	const barista = small(makeStudent(cafe)); barista.g.position.set(-14.6, 0, .4); barista.g.rotation.y = Math.PI/2;
	const pickables = [];
	cafe.traverse(o => { if(o.isMesh){ o.userData.spot = "comptoir"; pickables.push(o); } });

	/* ---------- étudiants ---------- */
	const people = [];
	const seated = [];
	tables.forEach(([x,z]) => { if(rng() < .32){ const s = small(makeStudent(scene, true)); s.g.position.set(x + R(-.3,.3), 0, z + .95); s.g.rotation.y = Math.PI; seated.push({ ...s, ph:R(0,6) }); } });
	// promeneurs du rez-de-chaussée
	const LOOP = [[-10.4,7.4],[11,7.4],[11,-7.4],[-10.4,-7.4]];
	for(let i=0;i<7;i++){
		const s = small(makeStudent(scene));
		people.push({ ...s, kind:"loop", seg:Math.floor(rng()*4), t:rng(), speed:R(1.3,1.9), lane:R(-.6,.6), ph:R(0,6), wait:0, dir: rng() < .5 ? 1 : -1 });
	}
	// clients du café
	for(const z of [-1.6, 0]){ const s = small(makeStudent(scene, true)); s.g.position.set(-11.9, -.05, z); s.g.rotation.y = -Math.PI/2; seated.push({ ...s, ph:R(0,6) }); }
	// sur les coursives
	for(let i=0;i<6;i++){
		const f = 1 + (i % 3), zSide = i < 3 ? -1 : 1;
		const s = small(makeStudent(scene));
		people.push({ ...s, kind:"gallery", y:f*FL, z:zSide*(HZ - 1.2), x:R(-12,12), v:R(.9,1.5)*(rng()<.5?1:-1), ph:R(0,6), wait:0 });
	}

	function walk(s, x, y, z, dx, dz, t){
		s.g.position.set(x, y, z);
		const want = Math.atan2(dx, dz);
		let diff = want - s.g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
		s.g.rotation.y += diff*.15;
		const step = t*7 + s.ph;
		s.body.position.y = .65 + Math.abs(Math.sin(step))*.07;
		s.tassel.rotation.x = Math.sin(step)*.3;
	}
	const camLocal = new THREE.Vector3();
	function update(dt, t, camera){
		// murs côté caméra masqués
		for(const w of walls){ camLocal.subVectors(camera.position, w.p); w.group.visible = camLocal.dot(w.n) > -.5; }
		for(const s of people){
			if(s.wait > 0){ s.wait -= dt; continue; }
			if(s.kind === "loop"){
				const a = LOOP[s.seg], b = LOOP[(s.seg + s.dir + 4) % 4];
				const len = Math.hypot(b[0]-a[0], b[1]-a[1]);
				s.t += s.speed*dt/len;
				if(s.t >= 1){ s.t = 0; s.seg = (s.seg + s.dir + 4) % 4; if(rng() < .25) s.wait = R(1,4); continue; }
				const dx = (b[0]-a[0])/len, dz = (b[1]-a[1])/len;
				walk(s, a[0] + (b[0]-a[0])*s.t - dz*s.lane, 0, a[1] + (b[1]-a[1])*s.t + dx*s.lane, dx, dz, t);
			} else {
				s.x += s.v*dt;
				if(Math.abs(s.x) > 13){ s.v *= -1; s.x = Math.sign(s.x)*13; if(rng() < .5) s.wait = R(1,3); }
				walk(s, s.x, s.y, s.z, Math.sign(s.v), 0, t);
			}
		}
		for(const s of seated){ if(s.hatT === undefined) s.hat.position.y = 1.82 + Math.max(0, Math.sin(t*1.7 + s.ph))*.03; s.body.rotation.z = Math.sin(t + s.ph)*.03; }
		updateParty(dt, t);
	}
	/* ---------- remise de diplôme : confettis et toques en l'air ---------- */
	const CN = 320, confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(.22,.14), new THREE.MeshBasicMaterial({ side:THREE.DoubleSide }), CN);
	confetti.frustumCulled = false; confetti.count = 0; scene.add(confetti);
	const cf = Array.from({ length:CN }, () => ({ x:0, y:0, z:0, r:R(0,6), v:R(.8,1.6), ph:R(0,6) }));
	const CC = ["#d9a441","#8a2b4e","#2f6f8f","#e07a5f","#f4efe4","#3d7a55"], col = new THREE.Color();
	cf.forEach((c,i) => { col.set(CC[i % CC.length]); confetti.setColorAt(i, col); });
	let celebT = 0;
	const everyone = () => [...people, ...seated, barista];
	function celebrate(){
		celebT = 7;
		confetti.count = CN;
		for(const c of cf){ c.x = R(-14,14); c.y = R(14,24); c.z = R(-9,9); }
		for(const s of everyone()) s.hatT = R(0,.5);
	}
	const cd = new THREE.Object3D();
	function updateParty(dt, t){
		if(celebT <= 0) return;
		celebT -= dt;
		for(let i=0;i<CN;i++){
			const c = cf[i];
			c.y -= c.v*dt; c.x += Math.sin(t*2 + c.ph)*dt*.6; c.r += dt*3;
			if(c.y < .05) c.y = .05;
			cd.position.set(c.x, c.y, c.z); cd.rotation.set(c.r, c.r*.7, 0); cd.updateMatrix(); confetti.setMatrixAt(i, cd.matrix);
		}
		confetti.instanceMatrix.needsUpdate = true;
		for(const s of everyone()){
			if(s.hatT === undefined) continue;
			s.hatT += dt;
			const k = s.hatT - .5;
			const base = s.body.scale.y < 1 ? 1.82 : 1.62;
			if(k > 0 && k < 1.6){ s.hat.position.y = base + Math.sin(k/1.6*Math.PI)*4; s.hat.rotation.y += dt*9; }
			else if(k >= 1.6){ s.hat.position.y = base; s.hatT = undefined; }
		}
		if(celebT <= 0) confetti.count = 0;
	}

	function setNight(night){
		hemi.intensity = night ? .55 : 1.1;
		hemi.color.set(night ? "#c9b8ff" : "#fff1dd");
		sun.intensity = night ? .35 : 2.2;
		sun.color.set(night ? "#9fb0ff" : "#fff3dc");
		roomGlow.emissiveIntensity = night ? 1.5 : .9;
		glassDark.emissiveIntensity = night ? .5 : 0;
		lampMat.emissiveIntensity = night ? 2.4 : 1.2;
		bulbMat.emissiveIntensity = night ? 2.6 : 1.6;
	}

	return {
		scene, update, setNight, pickables, celebrate,
		home:{ pos:new THREE.Vector3(26, 21, 34), target:new THREE.Vector3(0, 4.5, 0) },
		limits:{ minDistance:12, maxDistance:75, minPolarAngle:.35, maxPolarAngle:1.38, box:[-14,14,-9,9] },
		pins:[
			{ id:"comptoir", icon:"☕", name:"Le Comptoir · mini-jeu", pos:[-13.2, 4.6, 0] },
			{ id:"salles", icon:"📚", name:"Les formations", pos:[0, 5.6, -HZ+1] },
			{ id:"sortir", icon:"🚪", name:"Ressortir", pos:[8, 3.2, HZ-1] }
		]
	};
}
