/* Le quartier Vauban reconstruit d'après OpenStreetMap : façades lilloises,
   toitures, rues, trottoirs, parcs, la Deûle. Tout est fusionné en quelques
   maillages pour rester léger, sauf les bâtiments « à visiter » (POI) qui
   restent séparés pour être cliquables. */
import * as THREE from "three";
import { std, mulberry32 } from "./kit.js";

const FH = 2.3, BAY = 1.4;
const HOUSE_WALLS = ["#b5563d","#a84e3a","#c46a4a","#9c4a38","#b9603f","#efe6d6","#e6d9c1","#d9cbb5","#f3eee6","#cdbfa8","#e9d3b4","#c9c2b8"];
const CAMPUS_WALLS = ["#a9533c","#ebe6dc","#c9b8a0"];
const ROOFS = ["#4f5767","#5d6170","#8d4a3a","#4a505d"];

/* ---------- textures de façade ---------- */
function facade(wall, style){
	/* 128 px, contours adoucis et contraste modéré : les fenêtres lointaines ne « fourmillent » plus. */
	const c = document.createElement("canvas"); c.width = c.height = 128;
	const x = c.getContext("2d");
	x.fillStyle = wall; x.fillRect(0,0,128,128);
	const brick = /^#[9a-c]/i.test(wall) && style !== "glass";
	if(brick){ x.fillStyle = "rgba(0,0,0,.05)"; for(let y=6;y<128;y+=8) x.fillRect(0,y,128,2); }
	x.filter = "blur(.8px)";
	if(style === "house"){
		x.fillStyle = "#e9e0cf"; x.fillRect(38,16,52,80);
		x.fillStyle = "#4a5a70"; x.fillRect(44,22,40,68);
		x.fillStyle = "#e9e0cf"; x.fillRect(62,22,4,68); x.fillRect(44,52,40,4);
		x.fillStyle = "rgba(255,255,255,.75)"; x.fillRect(34,94,60,6);
	} else if(style === "campus"){
		x.fillStyle = "#e2dcd0"; x.fillRect(8,24,112,72);
		x.fillStyle = "#4b5d74"; x.fillRect(12,28,104,64);
		x.fillStyle = "#e2dcd0"; x.fillRect(62,28,4,64);
	} else if(style === "sport"){
		x.fillStyle = "#4b5d74"; x.fillRect(0,12,128,28);
		x.fillStyle = "#8a2b4e"; x.fillRect(0,44,128,8);
	} else if(style === "glass"){
		x.fillStyle = "#cfe3e6"; x.fillRect(0,0,128,128);
		x.fillStyle = "#f6f3ec"; for(let i=0;i<128;i+=32) x.fillRect(i,0,6,128); x.fillRect(0,0,128,6); x.fillRect(0,64,128,4);
	}
	x.filter = "none";
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
	return t;
}
function litMap(style, seed){
	const r = mulberry32(seed);
	const c = document.createElement("canvas"); c.width = 128; c.height = 64;
	const x = c.getContext("2d");
	x.fillStyle = "#000"; x.fillRect(0,0,128,64);
	for(let i=0;i<8;i++) for(let j=0;j<4;j++){
		if(r() > .45) continue;
		x.fillStyle = r() < .7 ? "#ffc979" : "#ffe3b0";
		if(style === "house") x.fillRect(i*16 + 5.5, j*16 + 2.8, 5, 8.5);
		else x.fillRect(i*16 + 1.5, j*16 + 3.5, 13, 8);
	}
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1/8, 1/4); t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/* ---------- accumulateurs de géométrie ---------- */
function bucket(){ return { pos:[], nor:[], uv:[] }; }
function tri(B, a, b, c, n, ua=[0,0], ub=[0,0], uc=[0,0]){
	const e1x=b[0]-a[0], e1y=b[1]-a[1], e1z=b[2]-a[2], e2x=c[0]-a[0], e2y=c[1]-a[1], e2z=c[2]-a[2];
	const cx=e1y*e2z-e1z*e2y, cy=e1z*e2x-e1x*e2z, cz=e1x*e2y-e1y*e2x;
	if(cx*n[0] + cy*n[1] + cz*n[2] < 0){ [b,c] = [c,b]; [ub,uc] = [uc,ub]; }
	B.pos.push(...a,...b,...c); B.nor.push(...n,...n,...n); B.uv.push(...ua,...ub,...uc);
}
function toGeo(B){
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3));
	g.setAttribute("normal", new THREE.Float32BufferAttribute(B.nor, 3));
	g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
	g.computeBoundingSphere();
	return g;
}
const ring = flat => { const p = []; for(let i=0;i<flat.length;i+=2) p.push([flat[i], flat[i+1]]); return p; };
function signedArea(p){ let s = 0; for(let i=0;i<p.length;i++){ const a = p[i], b = p[(i+1)%p.length]; s += a[0]*b[1] - b[0]*a[1]; } return s/2; }
function capTris(B, p, y, uvFn){
	const contour = p.map(([x,z]) => new THREE.Vector2(x, z));
	let ids;
	try { ids = THREE.ShapeUtils.triangulateShape(contour, []); } catch(e){ return; }
	for(const [i,j,k] of ids) tri(B, [p[i][0],y,p[i][1]], [p[j][0],y,p[j][1]], [p[k][0],y,p[k][1]], [0,1,0], uvFn(p[i]), uvFn(p[j]), uvFn(p[k]));
}
export function pointInPoly(x, z, p){
	let ins = false;
	for(let i=0, j=p.length-1; i<p.length; j=i++){
		const [xi,zi] = p[i], [xj,zj] = p[j];
		if(((zi > z) !== (zj > z)) && x < (xj-xi)*(z-zi)/(zj-zi) + xi) ins = !ins;
	}
	return ins;
}

/* ---------- un bâtiment ---------- */
function addBuilding(Bw, Br, Bf, rec){
	const [kind, lv, , roof, flat] = rec;
	let p = ring(flat);
	if(signedArea(p) < 0) p = p.reverse();
	const H = kind === 3 ? lv*3.2 : kind === 6 ? 2.2 : kind === 4 ? lv*FH*1.35 : lv*FH;
	let per = (rec[2]*3.7) % 5;
	for(let i=0;i<p.length;i++){
		const a = p[i], b = p[(i+1)%p.length];
		const dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx, dz);
		if(len < .01) continue;
		const n = [dz/len, 0, -dx/len];
		const u0 = per/BAY, u1 = (per+len)/BAY, v1 = H/FH;
		tri(Bw, [a[0],0,a[1]], [b[0],0,b[1]], [b[0],H,b[1]], n, [u0,0], [u1,0], [u1,v1]);
		tri(Bw, [a[0],0,a[1]], [b[0],H,b[1]], [a[0],H,a[1]], n, [u0,0], [u1,v1], [u0,v1]);
		per += len;
	}
	if(roof){
		const [cx, cz, ang, L, D] = roof;
		const ux = Math.cos(ang), uz = Math.sin(ang), wx = -uz, wz = ux;
		const L2 = L/2 + .2, D2 = D/2 + .25, rh = Math.min(D*.55, 3.4);
		const P = (s, t, y) => [cx + ux*s + wx*t, y, cz + uz*s + wz*t];
		const e1 = P(-L2,-D2,H), e2 = P(L2,-D2,H), e3 = P(L2,D2,H), e4 = P(-L2,D2,H), r1 = P(-L2,0,H+rh), r2 = P(L2,0,H+rh);
		const nl = Math.hypot(rh, D2);
		const n1 = [-wx*rh/nl, D2/nl, -wz*rh/nl], n2 = [wx*rh/nl, D2/nl, wz*rh/nl];
		tri(Br, e1, e2, r2, n1, [0,0], [L,0], [L,1]); tri(Br, e1, r2, r1, n1, [0,0], [L,1], [0,1]);
		tri(Br, e3, e4, r1, n2, [0,0], [L,0], [L,1]); tri(Br, e3, r1, r2, n2, [0,0], [L,1], [0,1]);
		const g1 = P(-L/2,-D/2,H), g4 = P(-L/2,D/2,H), q1 = P(-L/2,0,H+rh), g2 = P(L/2,-D/2,H), g3 = P(L/2,D/2,H), q2 = P(L/2,0,H+rh);
		const W = [.02,.02];
		tri(Bw, g1, g4, q1, [-ux,0,-uz], W, W, W); tri(Bw, g2, g3, q2, [ux,0,uz], W, W, W);
	} else {
		capTris(Bf, p, H, ([x,z]) => [x*.2, z*.2]);
	}
	return H;
}

export function buildCity(scene, MAP, opts={}){
	const out = { walls:[], roofs:[], flats:[], pois:{}, poiMats:{}, lampSpots:[], trees:[], parkTrees:[], ground:{} };
	const poiIndex = new Map(Object.entries(MAP.pois).filter(([,v]) => v && v.i !== undefined).map(([k,v]) => [v.i, k]));

	/* matériaux */
	const litHouse = litMap("house", 7), litCampus = litMap("campus", 11);
	const wallMat = (hex, style) => {
		const m = new THREE.MeshStandardMaterial({ map:facade(hex, style), roughness:.92, emissive:"#ffffff", emissiveIntensity:0, emissiveMap: style === "house" ? litHouse : litCampus });
		out.walls.push(m); return m;
	};
	const houseMats = HOUSE_WALLS.map(c => wallMat(c, "house"));
	const campusMats = CAMPUS_WALLS.map(c => wallMat(c, "campus"));
	const sportMat = wallMat("#d8d2c6", "sport");
	const glassMat = wallMat("#cfe3e6", "glass");
	const roofMats = ROOFS.map(c => { const m = std(c, { roughness:.8 }); m.userData.base = c; out.roofs.push(m); return m; });
	const flatMat = std("#77737b", { flatShading:false }); flatMat.userData.base = "#77737b"; out.flats.push(flatMat);
	const glassRoof = new THREE.MeshStandardMaterial({ color:"#d9eef0", transparent:true, opacity:.55, roughness:.1, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
	out.glassRoof = glassRoof;

	const groups = new Map();   // clé matériau -> { w, r, f }
	const get = (key) => { if(!groups.has(key)) groups.set(key, { w:bucket(), r:bucket(), f:bucket() }); return groups.get(key); };
	const spires = [];
	MAP.buildings.forEach((rec, i) => {
		const [kind, , col] = rec;
		if(opts.exclude){ const f = rec[4]; let cx = 0, cz = 0; for(let k=0;k<f.length;k+=2){ cx += f[k]; cz += f[k+1]; } if(opts.exclude(cx/(f.length/2), cz/(f.length/2))) return; }
		let wm;
		if(kind === 0 || kind === 2 || kind === 6) wm = houseMats[col % houseMats.length];
		else if(kind === 1) wm = campusMats[col % campusMats.length];
		else if(kind === 3) wm = sportMat;
		else if(kind === 4) wm = houseMats[0];
		else wm = glassMat;
		const rm = roofMats[(col + i) % (kind === 0 ? 4 : 2)];
		const poi = poiIndex.get(i);
		if(poi === "rizomm") wm = campusMats[0];
		if(poi){
			const G = { w:bucket(), r:bucket(), f:bucket() };
			const H = addBuilding(G.w, G.r, G.f, rec);
			const grp = new THREE.Group(); scene.add(grp);
			const w2 = wm.clone(), r2 = rm.clone(), f2 = kind === 5 ? glassRoof : flatMat.clone();
			out.walls.push(w2); out.roofs.push(r2); if(f2 !== glassRoof) out.flats.push(f2);
			for(const [B, m] of [[G.w, w2], [G.r, r2], [G.f, f2]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.castShadow = me.receiveShadow = true; grp.add(me); }
			out.pois[poi] = { group:grp, H, mats:[w2, r2, f2] };
			return;
		}
		const g = get(wm.uuid + "|" + rm.uuid);
		g.wm = wm; g.rm = rm;
		const H = addBuilding(g.w, g.r, (kind === 5 ? get("glassroof").f : g.f), rec);
		if(kind === 5) get("glassroof").fm = glassRoof;
		if(kind === 4 && rec[3]){ const [cx,cz,ang,L] = rec[3]; spires.push([cx + Math.cos(ang)*L*.42, cz + Math.sin(ang)*L*.42, H]); }
	});
	for(const g of groups.values()){
		for(const [B, m] of [[g.w, g.wm], [g.r, g.rm], [g.f, g.fm || flatMat]]){
			if(!B.pos.length || !m) continue;
			const me = new THREE.Mesh(toGeo(B), m); me.castShadow = me.receiveShadow = true; scene.add(me);
		}
	}
	for(const [x,z,H] of spires){
		const s = new THREE.Mesh(new THREE.ConeGeometry(1.6, 13, 8).translate(0,6.5,0), roofMats[0]);
		s.position.set(x, H, z); s.castShadow = true; scene.add(s);
		const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4, 3.2).translate(0,2,0), houseMats[0]);
		b.position.set(x, H - 1, z); b.castShadow = true; scene.add(b);
	}

	/* ---------- rues & trottoirs ---------- */
	const roadM = std("#57525c", { flatShading:false, side:THREE.DoubleSide });
	const pedM = std("#c9b9a1", { flatShading:false, side:THREE.DoubleSide });
	const walkM = std("#cbc1b2", { flatShading:false, side:THREE.DoubleSide });
	const curbM = std("#bdb2a3", { flatShading:false, side:THREE.DoubleSide });
	out.ground.walk = walkM;
	const BR = bucket(), BP = bucket(), BW = bucket();
	function ribbon(B, pts, w, y){
		const hw = w/2;
		for(let i=0;i+3<pts.length;i+=2){
			const ax = pts[i], az = pts[i+1], bx = pts[i+2], bz = pts[i+3];
			const dx = bx-ax, dz = bz-az, l = Math.hypot(dx,dz); if(l < .01) continue;
			const nx = -dz/l*hw, nz = dx/l*hw;
			const A = [ax+nx,y,az+nz], Bq = [ax-nx,y,az-nz], C = [bx-nx,y,bz-nz], D = [bx+nx,y,bz+nz];
			tri(B, A, Bq, C, [0,1,0]); tri(B, A, C, D, [0,1,0]);
		}
		for(let i=0;i<pts.length;i+=2){
			const cx = pts[i], cz = pts[i+1], n = 8;
			for(let k=0;k<n;k++){
				const a0 = k/n*Math.PI*2, a1 = (k+1)/n*Math.PI*2;
				tri(B, [cx,y,cz], [cx+Math.cos(a0)*hw,y,cz+Math.sin(a0)*hw], [cx+Math.cos(a1)*hw,y,cz+Math.sin(a1)*hw], [0,1,0]);
			}
		}
	}
	for(const [w, code, pts] of MAP.roads){
		ribbon(BW, pts, w + 2.6, .035);
		ribbon(code === 1 ? BP : BR, pts, w, code === 1 ? .085 : .07);
		if(code !== 1){
			for(let i=0;i+3<pts.length;i+=2){
				const ax = pts[i], az = pts[i+1], bx = pts[i+2], bz = pts[i+3];
				const dx = bx-ax, dz = bz-az, l = Math.hypot(dx,dz);
				const step = code === 2 ? 9 : 14;
				for(let s = step*.5; s < l; s += step){
					const k = s/l, side = (Math.floor(s/step) % 2) ? 1 : -1;
					out.lampSpots.push([ax + dx*k + (-dz/l)*(w/2 + 1)*side, az + dz*k + (dx/l)*(w/2 + 1)*side]);
				}
			}
		}
	}
	for(const [B, m, y] of [[BW, walkM], [BR, roadM], [BP, pedM]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.receiveShadow = true; scene.add(me); }

	/* ---------- espaces verts ---------- */
	const lawnM = std("#9cb257", { flatShading:false, side:THREE.DoubleSide }); out.ground.lawn = lawnM;
	const pitchM = std("#6fa35a", { flatShading:false, side:THREE.DoubleSide });
	const BL = bucket(), BPi = bucket();
	const rnd = mulberry32(42);
	for(const [code, flat] of MAP.greens){
		let p = ring(flat); if(p.length < 3) continue;
		capTris(code === 1 ? BPi : BL, p, .05, () => [0,0]);
		const A = Math.abs(signedArea(p));
		const xs = p.map(q => q[0]), zs = p.map(q => q[1]);
		const n = code === 2 ? Math.round(A/14) : Math.round(A/40);
		for(let k=0, tries=0; k<n && tries<n*8; tries++){
			const x = Math.min(...xs) + rnd()*(Math.max(...xs)-Math.min(...xs)), z = Math.min(...zs) + rnd()*(Math.max(...zs)-Math.min(...zs));
			if(!pointInPoly(x, z, p)) continue;
			out.parkTrees.push({ x, z, k: rnd() < .25 ? "c" : "d", s:.7 + rnd()*.5 });
			k++;
		}
	}
	for(const [far, flat] of MAP.parks){
		const p = ring(flat);
		capTris(BL, p, .04, () => [0,0]);
		const A = Math.abs(signedArea(p)), xs = p.map(q => q[0]), zs = p.map(q => q[1]);
		const n = Math.min(260, Math.round(A/(far === "Bois de Boulogne" ? 9 : 22)));
		for(let k=0, tries=0; k<n && tries<n*6; tries++){
			const x = Math.min(...xs) + rnd()*(Math.max(...xs)-Math.min(...xs)), z = Math.min(...zs) + rnd()*(Math.max(...zs)-Math.min(...zs));
			if(!pointInPoly(x, z, p)) continue;
			out.parkTrees.push({ x, z, k: rnd() < .35 ? "c" : "d", s:.8 + rnd()*.6 });
			k++;
		}
	}
	for(const [B, m] of [[BL, lawnM], [BPi, pitchM]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.receiveShadow = true; scene.add(me); }

	/* ---------- la Deûle ---------- */
	const waterM = std("#6e9aa4", { roughness:.25, metalness:.1, flatShading:false, side:THREE.DoubleSide });
	const quayM = std("#cbbfae", { flatShading:false, side:THREE.DoubleSide });
	out.ground.water = waterM;
	const BQ = bucket(), BWa = bucket();
	for(const pts of MAP.canals){ ribbon(BQ, pts, 10.5, .025); ribbon(BWa, pts, 8, .045); }
	for(const [B, m] of [[BQ, quayM], [BWa, waterM]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.receiveShadow = true; scene.add(me); }

	/* arbres d'alignement */
	for(let i=0;i<MAP.trees.length;i+=2) out.trees.push({ x:MAP.trees[i], z:MAP.trees[i+1], k:"d", s:.85 + rnd()*.3 });

	/* saisons & nuit */
	out.setSeason = S => {
		for(const m of out.roofs) m.color.set(S.snowy ? "#dfe6ee" : m.userData.base);
		for(const m of out.flats) m.color.set(S.snowy ? "#e6ebf1" : m.userData.base);
		lawnM.color.set(S.lawn); pitchM.color.set(S.snowy ? "#e9eff7" : "#6fa35a");
		walkM.color.set(S.snowy ? "#e3e7ee" : "#cbc1b2");
	};
	out.setNight = night => {
		for(const m of out.walls) m.emissiveIntensity = night ? 1.25 : 0;
		glassRoof.emissiveIntensity = night ? .8 : 0;
		waterM.color.set(night ? "#2c3f5c" : "#6e9aa4");
	};
	return out;
}
