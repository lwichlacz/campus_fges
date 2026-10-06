/* La chapelle universitaire, restaurée en 2020 : nef blanche, voûte d'ogives
   aux clés dorées, tribunes bordeaux, vitraux, chœur surélevé. Les murs et la
   voûte ne sont visibles que de l'intérieur : vue « maquette » automatique. */
import * as THREE from "three";
import { std, cyl, box, makeStudent, R, rng, mulberry32 } from "./kit.js";

const NX = 6.5, AX = 10.5, Z0 = -20, Z1 = 18, BAYZ = 4;
const SPRING = 11.5, RISE = 5.5, AISLE_H = 8;

function canvasTex(w, h, draw, srgb=true){
	const c = document.createElement("canvas"); c.width = w; c.height = h;
	draw(c.getContext("2d"), w, h);
	const t = new THREE.CanvasTexture(c); if(srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
	return t;
}
const GLASS = ["#2a4c9c","#b22a2a","#e0b23a","#3f8a4f","#6b3f8f","#8fb6e0","#c8552e","#1f6f8b"];
function lancet(x, cx, top, bottom, w, rnd, glowOnly){
	x.save();
	x.beginPath();
	x.moveTo(cx - w/2, bottom); x.lineTo(cx - w/2, top + w*.9);
	x.quadraticCurveTo(cx - w/2, top, cx, top - w*.15);
	x.quadraticCurveTo(cx + w/2, top, cx + w/2, top + w*.9);
	x.lineTo(cx + w/2, bottom); x.closePath();
	x.clip();
	for(let yy = top - w; yy < bottom; yy += 9) for(let xx = cx - w/2; xx < cx + w/2; xx += 7){
		x.fillStyle = GLASS[Math.floor(rnd()*GLASS.length)];
		x.fillRect(xx, yy, 7, 9);
	}
	x.fillStyle = "rgba(255,240,200,.35)";
	x.beginPath(); x.ellipse(cx, (top+bottom)/2, w*.28, (bottom-top)*.22, 0, 0, Math.PI*2); x.fill();
	x.strokeStyle = glowOnly ? "#000" : "#2a2230"; x.lineWidth = 1.2;
	for(let yy = top - w; yy < bottom; yy += 9){ x.beginPath(); x.moveTo(cx - w/2, yy); x.lineTo(cx + w/2, yy); x.stroke(); }
	for(let xx = cx - w/2; xx < cx + w/2; xx += 7){ x.beginPath(); x.moveTo(xx, top - w); x.lineTo(xx, bottom); x.stroke(); }
	x.restore();
	x.strokeStyle = glowOnly ? "#000" : "#e9e1cf"; x.lineWidth = 4;
	x.beginPath(); x.moveTo(cx - w/2, bottom); x.lineTo(cx - w/2, top + w*.9); x.quadraticCurveTo(cx - w/2, top, cx, top - w*.15); x.quadraticCurveTo(cx + w/2, top, cx + w/2, top + w*.9); x.lineTo(cx + w/2, bottom); x.stroke();
}

/* ---------- petit constructeur de géométrie fusionnée ---------- */
function bucket(){ return { pos:[], nor:[], uv:[] }; }
function tri(B, a, b, c, n, ua=[0,0], ub=[0,0], uc=[0,0]){
	const e1 = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], e2 = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
	const cr = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
	if(cr[0]*n[0] + cr[1]*n[1] + cr[2]*n[2] < 0){ [b,c] = [c,b]; [ub,uc] = [uc,ub]; }
	B.pos.push(...a,...b,...c); B.nor.push(...n,...n,...n); B.uv.push(...ua,...ub,...uc);
}
function quad(B, a, b, c, d, n){ tri(B, a, b, c, n); tri(B, a, c, d, n); }
function bar(B, a, b, w){
	const d = new THREE.Vector3(b[0]-a[0], b[1]-a[1], b[2]-a[2]); const len = d.length(); d.normalize();
	const up = Math.abs(d.y) > .9 ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0);
	const s1 = new THREE.Vector3().crossVectors(d, up).normalize().multiplyScalar(w/2);
	const s2 = new THREE.Vector3().crossVectors(d, s1).normalize().multiplyScalar(w/2);
	const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b);
	const corners = [[1,1],[-1,1],[-1,-1],[1,-1]].map(([i,j]) => s1.clone().multiplyScalar(i).add(s2.clone().multiplyScalar(j)));
	for(let k=0;k<4;k++){
		const c0 = corners[k], c1 = corners[(k+1)%4];
		const n = c0.clone().add(c1).normalize();
		quad(B, A.clone().add(c0).toArray(), Bv.clone().add(c0).toArray(), Bv.clone().add(c1).toArray(), A.clone().add(c1).toArray(), n.toArray());
	}
}
function toMesh(B, mat, shadow=true){
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3));
	g.setAttribute("normal", new THREE.Float32BufferAttribute(B.nor, 3));
	g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
	const m = new THREE.Mesh(g, mat); m.castShadow = shadow; m.receiveShadow = true;
	return m;
}
const vaultY = x => SPRING + RISE*Math.pow(Math.max(0, 1 - Math.abs(x)/NX), .55);

export function createChapelle({ background }){
	const scene = new THREE.Scene();
	scene.background = background;
	const hemi = new THREE.HemisphereLight("#fff7ea", "#c9b9a2", 1.25);
	const sun = new THREE.DirectionalLight("#fff0d6", 1.6);
	sun.position.set(-26, 22, 6); sun.target.position.set(0, 0, -2); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, { left:-24, right:24, top:24, bottom:-24, near:5, far:80 });
	sun.shadow.bias = -.0005;
	scene.add(hemi, sun, sun.target);

	const white = std("#f4efe4", { flatShading:false, roughness:.85 });
	const cream = std("#ebe1cd", { flatShading:false, roughness:.8 });
	const burgundy = std("#6e1f33", { flatShading:false, roughness:.85 });
	const gold = std("#d9a441", { metalness:.6, roughness:.35, emissive:"#ffcf6e", emissiveIntensity:.35, flatShading:false });
	const inward = (mat) => { const m = mat.clone(); m.side = THREE.FrontSide; return m; };

	/* sol en pierre claire */
	const floorTex = canvasTex(128, 128, (x) => {
		x.fillStyle = "#e9e3d6"; x.fillRect(0,0,128,128);
		x.strokeStyle = "#cfc6b4"; x.lineWidth = 2;
		for(let i=0;i<=128;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,128); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(128,i); x.stroke(); }
	});
	floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(AX, (Z1-Z0)/2);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(AX*2, Z1-Z0).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:floorTex, roughness:.45 }));
	floor.position.z = (Z0+Z1)/2; floor.receiveShadow = true; scene.add(floor);
	const aisle = new THREE.Mesh(new THREE.PlaneGeometry(1.8, Z1-Z0-6).rotateX(-Math.PI/2), std("#d6d2cb", { flatShading:false, roughness:.3 }));
	aisle.position.set(0, .01, (Z0+Z1)/2 + 3); scene.add(aisle);
	box(scene, AX*2+2, .6, Z1-Z0+2, std("#bdb3a3"), 0, -.63, (Z0+Z1)/2, 0, false);

	/* ---------- bas-côtés : murs à vitraux ---------- */
	const seed = mulberry32(77);
	const vitrail = (glowOnly) => canvasTex(128, 256, (x, w, h) => {
		const r = mulberry32(5);
		x.fillStyle = glowOnly ? "#000" : "#f4efe4"; x.fillRect(0,0,w,h);
		lancet(x, 40, 52, 230, 30, r, glowOnly); lancet(x, 88, 52, 230, 30, r, glowOnly);
		if(!glowOnly){ x.fillStyle = "#e9e1cf"; x.fillRect(0, 236, w, 6); }
	});
	const vMap = vitrail(false), vGlow = vitrail(true);
	for(const t of [vMap, vGlow]){ t.wrapS = THREE.RepeatWrapping; t.repeat.set((Z1-Z0)/BAYZ, 1); }
	const vitrailMat = new THREE.MeshStandardMaterial({ map:vMap, emissiveMap:vGlow, emissive:"#ffffff", emissiveIntensity:.85, roughness:.8 });
	for(const s of [-1,1]){
		const w = new THREE.Mesh(new THREE.PlaneGeometry(Z1-Z0, AISLE_H), vitrailMat);
		w.position.set(s*AX, AISLE_H/2, (Z0+Z1)/2); w.rotation.y = -s*Math.PI/2; w.receiveShadow = true; scene.add(w);
		const ceil = new THREE.Mesh(new THREE.PlaneGeometry(AX-NX, Z1-Z0).rotateX(Math.PI/2), white);
		ceil.position.set(s*(NX+AX)/2, AISLE_H, (Z0+Z1)/2); scene.add(ceil);
	}

	/* ---------- tribunes (ouvertures bordeaux) ---------- */
	const tribTex = canvasTex(128, 112, (x, w, h) => {
		x.fillStyle = "#f4efe4"; x.fillRect(0,0,w,h);
		for(const cx of [36, 92]){
			x.fillStyle = "#6e1f33";
			x.beginPath(); x.moveTo(cx-20, h-14); x.lineTo(cx-20, 40); x.quadraticCurveTo(cx-20, 14, cx, 8); x.quadraticCurveTo(cx+20, 14, cx+20, 40); x.lineTo(cx+20, h-14); x.closePath(); x.fill();
			x.fillStyle = "#f4efe4"; x.fillRect(cx-2, 34, 4, h-48);
			x.strokeStyle = "#e3d8c2"; x.lineWidth = 3; x.stroke();
			x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(cx-14, 50, 9, 30); x.fillRect(cx+5, 50, 9, 30);
		}
		x.fillStyle = "#e9dfca"; x.fillRect(0, h-14, w, 14);
		x.fillStyle = "#d8c9a8"; for(let i=4;i<w;i+=12) x.fillRect(i, h-12, 6, 10);
	});
	tribTex.wrapS = THREE.RepeatWrapping; tribTex.repeat.set((Z1-Z0)/BAYZ, 1);
	const tribMat = new THREE.MeshStandardMaterial({ map:tribTex, roughness:.85 });
	const sideG = { "-1":new THREE.Group(), "1":new THREE.Group() };
	scene.add(sideG[-1], sideG[1]);
	for(const s of [-1,1]){
		const t = new THREE.Mesh(new THREE.PlaneGeometry(Z1-Z0, SPRING - AISLE_H), tribMat);
		t.position.set(s*NX, (SPRING + AISLE_H)/2, (Z0+Z1)/2); t.rotation.y = -s*Math.PI/2; scene.add(t);
		box(sideG[s], .45, .35, Z1-Z0, cream, s*NX, AISLE_H - .2, (Z0+Z1)/2, 0, false);
		box(sideG[s], .5, .3, Z1-Z0, cream, s*NX, SPRING - .3, (Z0+Z1)/2, 0, false);
	}

	/* ---------- colonnes & arcades ---------- */
	const archShape = () => {
		const s = new THREE.Shape(), Rr = 2.0, c = 1.6 - Rr;
		s.moveTo(-2, 0); s.lineTo(-1.6, 0);
		for(let k=1;k<=12;k++){ const x = -1.6 + 1.6*k/12; s.lineTo(x, Math.sqrt(Math.max(0, Rr*Rr - (x + c)**2))); }
		for(let k=1;k<=12;k++){ const x = 1.6*k/12; s.lineTo(x, Math.sqrt(Math.max(0, Rr*Rr - (x - c)**2))); }
		s.lineTo(2, 0); s.lineTo(2, 2.05); s.lineTo(-2, 2.05); s.closePath();
		return s;
	};
	const archGeo = new THREE.ExtrudeGeometry(archShape(), { depth:.7, bevelEnabled:false }).rotateY(Math.PI/2).translate(-.35, 0, 0);
	for(const s of [-1,1]){
		const G = sideG[s];
		for(let z = Z0 + BAYZ; z < Z1; z += BAYZ){
			cyl(G, .48, .55, .5, cream, s*NX, 0, z, 10);
			cyl(G, .4, .4, 5.4, white, s*NX, .5, z, 12);
			box(G, 1.05, .45, 1.05, cream, s*NX, 5.6, z);
			cyl(G, .14, .14, SPRING - 6, cream, s*(NX - .35), 6, z, 8);
		}
		for(let z = Z0 + BAYZ/2; z < Z1; z += BAYZ){
			const a = new THREE.Mesh(archGeo, white); a.position.set(s*NX, 6, z); a.castShadow = a.receiveShadow = true; G.add(a);
		}
	}

	/* ---------- voûte d'ogives ---------- */
	const VB = bucket(), VBb = bucket(), RB = bucket();
	const xs = Array.from({ length:17 }, (_,i) => -NX + i*NX*2/16);
	for(let z = Z0; z < Z1 - .01; z += 1){
		const B = z < Z0 + BAYZ ? VBb : VB;
		for(let i=0;i<xs.length-1;i++){
			const x0 = xs[i], x1 = xs[i+1], y0 = vaultY(x0), y1 = vaultY(x1);
			const tx = x1 - x0, ty = y1 - y0, l = Math.hypot(tx, ty);
			let n = [-ty/l, tx/l, 0];
			const mx = (x0+x1)/2, my = (y0+y1)/2;
			if(n[0]*(0 - mx) + n[1]*(SPRING - my) < 0) n = n.map(v => -v);
			quad(B, [x0,y0,z], [x1,y1,z], [x1,y1,z+1], [x0,y0,z+1], n);
		}
	}
	const vMat = new THREE.MeshStandardMaterial({ color:"#f6f1e7", roughness:.9 });
	const vMatB = new THREE.MeshStandardMaterial({ color:"#6e1f33", roughness:.9 });
	scene.add(toMesh(VB, vMat, false), toMesh(VBb, vMatB, false));
	const rosettes = [];
	const keyMat = gold.clone(); keyMat.transparent = true;      // clés de voûte : s'estompent avec les nervures
	for(let z = Z0; z <= Z1 + .01; z += BAYZ){
		for(let i=0;i<xs.length-1;i++) bar(RB, [xs[i], vaultY(xs[i]) - .06, z], [xs[i+1], vaultY(xs[i+1]) - .06, z], .11);
		rosettes.push([0, vaultY(0) - .12, z]);
		if(z + BAYZ > Z1) continue;
		for(const dir of [1,-1]){
			let prev = null;
			for(let k=0;k<=12;k++){
				const s = k/12, x = dir*(-NX + 2*NX*s), zz = z + BAYZ*s;
				const p = [x, vaultY(x) - .1, zz];
				if(prev) bar(RB, prev, p, .08);
				prev = p;
			}
		}
		rosettes.push([0, vaultY(0) - .12, z + BAYZ/2]);
	}
	bar(RB, [0, SPRING + RISE - .1, Z0], [0, SPRING + RISE - .1, Z1], .1);
	// vue « maquette » d'en haut, la voûte disparaît : ses nervures s'estompent pour ne pas barrer la nef
	const ribMat = cream.clone(); ribMat.transparent = true;
	scene.add(toMesh(RB, ribMat, false));
	{
		const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.32, .32, .12, 14), keyMat, rosettes.length), d = new THREE.Object3D();
		rosettes.forEach((p,i) => { d.position.set(...p); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		scene.add(im);
	}

	/* ---------- murs d'extrémité ---------- */
	const endTex = canvasTex(256, 336, (x, w, h) => {
		const r = mulberry32(9);
		x.fillStyle = "#f4efe4"; x.fillRect(0,0,w,h);
		x.fillStyle = "#6e1f33"; x.fillRect(64, 150, 128, 70);
		for(const cx of [88, 128, 168]){
			x.fillStyle = "#f4efe4"; x.beginPath(); x.moveTo(cx-14, 216); x.lineTo(cx-14, 172); x.quadraticCurveTo(cx-14, 156, cx, 150); x.quadraticCurveTo(cx+14, 156, cx+14, 172); x.lineTo(cx+14, 216); x.closePath(); x.fill();
			x.fillStyle = "#d8c9a8"; x.beginPath(); x.ellipse(cx, 184, 6, 14, 0, 0, Math.PI*2); x.fill(); x.beginPath(); x.arc(cx, 166, 5, 0, 7); x.fill();
		}
		x.fillStyle = "#d9a441"; x.fillRect(125, 100, 6, 44); x.fillRect(112, 112, 32, 6);
		lancet(x, 100, 60, 140, 22, r, false); lancet(x, 156, 60, 140, 22, r, false);
		x.fillStyle = "#e9e1cf"; x.fillRect(56, 220, 144, 8);
	});
	const endWall = new THREE.Mesh(new THREE.PlaneGeometry(NX*2, 17.5), new THREE.MeshStandardMaterial({ map:endTex, roughness:.85 }));
	endWall.position.set(0, 8.75, Z0); scene.add(endWall);
	for(const s of [-1,1]){
		const side = new THREE.Mesh(new THREE.PlaneGeometry(AX-NX, AISLE_H), white);
		side.position.set(s*(NX+AX)/2, AISLE_H/2, Z0); scene.add(side);
	}
	const roseTex = canvasTex(256, 336, (x, w, h) => {
		const r = mulberry32(13);
		x.fillStyle = "#f4efe4"; x.fillRect(0,0,w,h);
		lancet(x, 128, 50, 200, 90, r, false);
		x.fillStyle = "#cdbfa6"; x.fillRect(30, 236, 196, 10);
	});
	const entry = new THREE.Mesh(new THREE.PlaneGeometry(NX*2, 17.5), new THREE.MeshStandardMaterial({ map:roseTex, roughness:.85, emissive:"#ffffff", emissiveIntensity:.15, emissiveMap:roseTex }));
	entry.position.set(0, 8.75, Z1); entry.rotation.y = Math.PI; scene.add(entry);
	for(const s of [-1,1]){ const p = new THREE.Mesh(new THREE.PlaneGeometry(AX-NX, AISLE_H), white); p.position.set(s*(NX+AX)/2, AISLE_H/2, Z1); p.rotation.y = Math.PI; scene.add(p); }

	/* ---------- chœur ---------- */
	const stone = std("#e3dccd", { flatShading:false });
	box(scene, NX*2, 1.2, 5, stone, 0, 0, Z0 + 2.5);
	for(let k=0;k<4;k++) box(scene, NX*2 - 2 - k*.6, 1.2 - k*.3, .7, stone, 0, 0, Z0 + 5.35 + k*.7);
	box(scene, 5.2, 4.6, .3, std("#1f1c22"), 0, 1.2, Z0 + .2);
	box(scene, 2.6, 1.05, 1.1, std("#efe8da"), 0, 1.2, Z0 + 3);
	box(scene, 2.7, .08, 1.2, std("#a8273d"), 0, 2.25, Z0 + 3);
	box(scene, .6, 1.3, .5, std("#9b6b45"), -3.2, 1.2, Z0 + 4.2);
	const flames = [];
	for(const x of [-.9, .9]){
		cyl(scene, .07, .07, .45, std("#f6f1e6"), x, 2.33, Z0 + 3, 8);
		const f = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), std("#ffd27a", { emissive:"#ffb347", emissiveIntensity:2.5, flatShading:false }));
		f.position.set(x, 2.86, Z0 + 3); f.scale.y = 1.6; scene.add(f); flames.push(f);
	}

	/* ---------- chaises ---------- */
	const chairs = [];
	for(let z = Z0 + 9; z < Z1 - 3; z += 1.15) for(const s of [-1,1]) for(let c=0;c<7;c++) chairs.push([s*(1.35 + c*.68), z]);
	{
		const wood = std("#d8b285", { flatShading:false }), frame = std("#c4c6c8", { metalness:.5, roughness:.4 });
		const seat = new THREE.InstancedMesh(new THREE.BoxGeometry(.56,.06,.5), wood, chairs.length);
		const back = new THREE.InstancedMesh(new THREE.BoxGeometry(.56,.52,.05), wood, chairs.length);
		const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.46,.44), frame, chairs.length);
		const d = new THREE.Object3D();
		chairs.forEach(([x,z],i) => {
			d.position.set(x, .48, z); d.updateMatrix(); seat.setMatrixAt(i, d.matrix);
			d.position.set(x, .78, z + .24); d.rotation.x = -.1; d.updateMatrix(); back.setMatrixAt(i, d.matrix); d.rotation.x = 0;
			d.position.set(x, .23, z); d.updateMatrix(); legs.setMatrixAt(i, d.matrix);
		});
		legs.material.wireframe = false; legs.material.transparent = true; legs.material.opacity = .35;
		for(const m of [seat, back, legs]){ m.castShadow = true; m.receiveShadow = true; scene.add(m); }
	}

	/* ---------- spots de corniche ---------- */
	const spots = [];
	for(const s of [-1,1]) for(let z = Z0 + 1; z < Z1; z += 2) spots.push([s*(NX - .3), SPRING + .05, z]);
	const spotMat = std("#fff8e8", { emissive:"#fff1cf", emissiveIntensity:2, flatShading:false });
	{
		const im = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), spotMat, spots.length), d = new THREE.Object3D();
		spots.forEach((p,i) => { d.position.set(...p); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		scene.add(im);
	}

	/* ---------- quelques étudiants ---------- */
	const people = [];
	const small = s => { s.g.scale.setScalar(.85); return s; };
	chairs.forEach(([x,z]) => { if(rng() < .07){ const s = small(makeStudent(scene, true)); s.g.position.set(x, -.25, z - .05); s.g.rotation.y = Math.PI; people.push({ ...s, ph:R(0,6) }); } });
	const walkers = [];
	for(let i=0;i<3;i++){ const s = small(makeStudent(scene)); walkers.push({ ...s, z:R(Z0+8, Z1-4), v:R(.7,1.1)*(i%2?1:-1), x:(i-1)*.25, ph:R(0,6) }); }

	/* ---------- poussière dans la lumière ---------- */
	const N = 220, dust = new Float32Array(N*3), seedD = mulberry32(3);
	for(let i=0;i<N;i++){ dust[i*3] = (seedD()*2-1)*AX; dust[i*3+1] = seedD()*14 + .5; dust[i*3+2] = Z0 + seedD()*(Z1-Z0); }
	const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dust, 3));
	const dustMat = new THREE.PointsMaterial({ color:"#fff3d6", size:.035, transparent:true, opacity:.4, depthWrite:false });
	const dustPts = new THREE.Points(dg, dustMat); scene.add(dustPts);

	const pickables = [];
	const ringMat = gold;
	function update(dt, t, camera){
		if(camera){
			for(const s of [-1,1]) sideG[s].visible = camera.position.x*s < AX;
			const above = camera.position.y > SPRING + RISE + 1, o = above ? .18 : 1;
			ribMat.opacity += (o - ribMat.opacity)*Math.min(1, dt*6); ribMat.depthWrite = ribMat.opacity > .9;
			keyMat.opacity = ribMat.opacity; keyMat.depthWrite = ribMat.depthWrite;
		}
		for(const f of flames){ f.scale.y = 1.5 + Math.sin(t*13 + f.position.x*5)*.15 + Math.sin(t*7.3)*.1; }
		const a = dg.attributes.position.array;
		for(let i=0;i<N;i++){ a[i*3+1] += Math.sin(t*.3 + i)*.002 + .002; a[i*3] += Math.cos(t*.2 + i*1.7)*.002; if(a[i*3+1] > 15) a[i*3+1] = .5; }
		dg.attributes.position.needsUpdate = true;
		for(const p of people){ p.hat.position.y = 1.82 + Math.max(0, Math.sin(t*1.2 + p.ph))*.02; }
		for(const w of walkers){
			w.z += w.v*dt;
			if(w.z > Z1 - 3 || w.z < Z0 + 7.5){ w.v *= -1; }
			w.g.position.set(w.x, 0, w.z); w.g.rotation.y = w.v > 0 ? 0 : Math.PI;
			w.body.position.y = .65 + Math.abs(Math.sin(t*6 + w.ph))*.06;
		}
		if(glowBoost > 0){ glowBoost = Math.max(0, glowBoost - dt*.35); vitrailMat.emissiveIntensity = baseGlow + glowBoost; }
	}
	let baseGlow = .85, glowBoost = 0;
	function setNight(night){
		hemi.intensity = night ? .7 : 1.25;
		sun.intensity = night ? .15 : 1.6;
		baseGlow = night ? .3 : .85; vitrailMat.emissiveIntensity = baseGlow + glowBoost;
		spotMat.emissiveIntensity = night ? 3 : 2;
		dustMat.opacity = night ? .22 : .4;
	}
	function lightUp(){ glowBoost = 1.4; }

	return {
		scene, update, setNight, pickables, lightUp,
		home:{ pos:new THREE.Vector3(19, 30, 32), target:new THREE.Vector3(0, 4, -3) },
		limits:{ minDistance:10, maxDistance:62, minPolarAngle:.3, maxPolarAngle:1.45, box:[-8,8,-16,14] },
		pins:[
			{ id:"cloches", icon:"🔔", name:"Faire sonner les cloches", pos:[0, 4.2, Z0 + 3] },
			{ id:"vitraux", icon:"🪟", name:"Les vitraux", pos:[-AX + .5, 7.6, 2] },
			{ id:"sortir", icon:"🚪", name:"Ressortir", pos:[0, 3.2, Z1 - 1.5] }
		]
	};
}
