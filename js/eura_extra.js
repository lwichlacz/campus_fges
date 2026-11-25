/* Euratechnologies, ce que la photo aérienne montre et que le quartier généré n'avait pas (js/eura_details.js,
   tools/build_eura_details.py) :
   - le jardin Le Blan-Lafont : ses vraies allées (OpenStreetMap), et entre elles une trame de parterres (pelouses, massifs,
     prairie fleurie, haies basses), bordée d'alignements d'arbres, sans les arbres « devinés » au milieu ;
   - les quais de la Deûle : margelle de pierre au bord de l'eau et alignement d'arbres sur chaque rive ;
   - les passerelles sur la Deûle (tablier d'acier, garde-corps). */
import * as THREE from "three";
import { std } from "./kit.js?v=22644ce8bd";

const P2 = f => { const p = []; for(let i=0;i<f.length;i+=2) p.push([f[i], f[i+1]]); return p; };
function pointIn(x, z, p){ let ins = false; for(let i=0, j=p.length-1; i<p.length; j=i++){ const [xi,zi] = p[i], [xj,zj] = p[j]; if(((zi > z) !== (zj > z)) && x < (xj-xi)*(z-zi)/(zj-zi) + xi) ins = !ins; } return ins; }
const area = p => { let a = 0; for(let i=0;i<p.length;i++){ const q = p[i], r = p[(i+1) % p.length]; a += q[0]*r[1] - r[0]*q[1]; } return Math.abs(a)/2; };
function obbAngle(p){
	let best = null;
	for(let i=0;i<p.length;i++){
		const a = p[i], b = p[(i+1) % p.length], ang = Math.atan2(b[1]-a[1], b[0]-a[0]), c = Math.cos(ang), s = Math.sin(ang);
		const us = p.map(([x, z]) => x*c + z*s), vs = p.map(([x, z]) => -x*s + z*c), A = (Math.max(...us) - Math.min(...us))*(Math.max(...vs) - Math.min(...vs));
		if(!best || A < best.A) best = { A, ang };
	}
	return best.ang;
}
function strip(segs, w, y, mat, parent){
	// rubans posés au sol le long de polylignes : [points], largeur w
	const pos = [];
	for(const p of segs) for(let i=0;i+1<p.length;i++){
		const [ax, az] = p[i], [bx, bz] = p[i+1], l = Math.hypot(bx-ax, bz-az) || 1, nx = -(bz-az)/l*w/2, nz = (bx-ax)/l*w/2;
		pos.push(ax+nx, y, az+nz, bx+nx, y, bz+nz, bx-nx, y, bz-nz, ax+nx, y, az+nz, bx-nx, y, bz-nz, ax-nx, y, az-nz);
		for(let k=0;k<8;k++){ const a0 = k/8*Math.PI*2, a1 = (k+1)/8*Math.PI*2, r = w/2; pos.push(bx, y - .002, bz, bx + Math.cos(a1)*r, y - .002, bz + Math.sin(a1)*r, bx + Math.cos(a0)*r, y - .002, bz + Math.sin(a0)*r); }
	}
	const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
	const m = new THREE.Mesh(g, mat); m.receiveShadow = true; parent.add(m); return m;
}

export function euraDetails({ scene, EMAP, D, city }){
	const out = { trees:[], gardenPoly:null };
	const water = EMAP.water.map(P2), inWater = (x, z) => water.some(w => pointIn(x, z, w));
	const free = (x, z, m = .6) => !inWater(x, z) && !city.inBuilding(x, z, m) && city.roadGap(x, z).g > .7;

	/* ---------- le jardin Le Blan-Lafont ---------- */
	if(D && D.garden){
		const G = P2(D.garden); out.gardenPoly = G;
		const ang = obbAngle(G), c = Math.cos(ang), s = Math.sin(ang);
		const sh = new THREE.Shape(G.map(([x, z]) => new THREE.Vector2(x, -z)));
		for(const w of water){ const [wx, wz] = w[0]; if(pointIn(wx, wz, G) && area(w) < area(G)*.6) sh.holes.push(new THREE.Path(w.map(([x, z]) => new THREE.Vector2(x, -z)))); }          // bassins et noues
		const mat = std("#86a85a", { flatShading:false, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-2 });
		const U = { uGa:{ value:new THREE.Vector2(c, s) } };
		mat.onBeforeCompile = sh2 => {
			Object.assign(sh2.uniforms, U);
			sh2.vertexShader = sh2.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vGW;").replace("#include <project_vertex>", "#include <project_vertex>\n	vGW = ( modelMatrix*vec4( transformed, 1.0 ) ).xz;");
			sh2.fragmentShader = sh2.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec2 uGa; varying vec2 vGW;")
				.replace("#include <color_fragment>", `#include <color_fragment>
	{ // trame de parterres alignée sur le jardin : 7 × 4,5 unités, allée de gravier entre deux, haie basse au bord
	  vec2 q = vec2( dot( vGW, uGa ), dot( vGW, vec2( -uGa.y, uGa.x ) ) ), cell = vec2( 7.0, 4.5 );
	  vec2 id = floor( q/cell ), f = fract( q/cell )*cell;
	  float h = fract( sin( dot( id, vec2( 12.9898, 78.233 ) ) )*43758.5453 );
	  vec3 c = diffuseColor.rgb;
	  vec3 bed = h < 0.4 ? c : h < 0.62 ? vec3( 0.29, 0.42, 0.22 ) : h < 0.8 ? vec3( 0.66, 0.64, 0.38 ) : mix( vec3( 0.62, 0.3, 0.32 ), vec3( 0.78, 0.62, 0.36 ), step( 0.5, fract( q.x*1.4 ) ) );
	  float path = 1.0 - step( 0.22, f.x )*step( f.x, cell.x - 0.22 )*step( 0.22, f.y )*step( f.y, cell.y - 0.22 );
	  float hedge = ( 1.0 - path )*( 1.0 - step( 0.75, f.x )*step( f.x, cell.x - 0.75 )*step( 0.75, f.y )*step( f.y, cell.y - 0.75 ) )*step( 0.5, fract( h*7.0 ) );
	  c = mix( bed, vec3( 0.25, 0.36, 0.2 ), hedge );
	  c = mix( c, vec3( 0.7, 0.68, 0.55 ), path*0.75 );          // sentiers entre les parterres : discrets, les vraies allées dominent
	  diffuseColor.rgb = c; }`);
		};
		mat.customProgramCacheKey = () => "jardinblan";
		const gm = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2), mat); gm.position.y = .075; gm.receiveShadow = true; scene.add(gm);
		// les vraies allées
		const gravel = std("#e2d6bd", { flatShading:false });
		strip(D.paths.filter(([k]) => k !== "pedestrian").map(([, f]) => P2(f)), 1.1, .1, gravel, scene);
		strip(D.paths.filter(([k]) => k === "pedestrian").map(([, f]) => P2(f)), 2.2, .105, std("#cfc6b3", { flatShading:false }), scene);
		// alignements sur le pourtour, un arbre tous les 3,6
		const [gx, gz] = [G.reduce((a, q) => a + q[0], 0)/G.length, G.reduce((a, q) => a + q[1], 0)/G.length];
		for(let i=0;i<G.length;i++){
			const a = G[i], b = G[(i+1) % G.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]);
			for(let t = 1.8; t < L; t += 3.6){
				let x = a[0] + (b[0]-a[0])*t/L, z = a[1] + (b[1]-a[1])*t/L; const dl = Math.hypot(gx - x, gz - z) || 1; x += (gx - x)/dl*1.4; z += (gz - z)/dl*1.4;
				if(pointIn(x, z, G) && free(x, z)) out.trees.push({ x, z, k:"d", s:1 });
			}
		}
	}

	/* ---------- quais de la Deûle : margelle et alignements ---------- */
	const big = water.filter(w => area(w) > 400);
	const stone = std("#cfc3ae", { flatShading:false }), wallM = std("#8f8677", { flatShading:false });
	const pos = [], wpos = [];
	for(const w of big){
		const cw = (() => { let a = 0; for(let i=0;i<w.length;i++){ const q = w[i], r = w[(i+1) % w.length]; a += q[0]*r[1] - r[0]*q[1]; } return a > 0 ? 1 : -1; })();
		for(let i=0;i<w.length;i++){
			const [ax, az] = w[i], [bx, bz] = w[(i+1) % w.length], l = Math.hypot(bx-ax, bz-az); if(l < .2) continue;
			// normale vers la terre (hors de l'eau)
			let nx = (bz-az)/l*cw, nz = -(bx-ax)/l*cw;
			const mx = (ax+bx)/2, mz = (az+bz)/2; if(inWater(mx + nx*.3, mz + nz*.3)){ nx = -nx; nz = -nz; }
			const W = .45, y = .32;
			pos.push(ax, y, az, bx, y, bz, bx + nx*W, y, bz + nz*W, ax, y, az, bx + nx*W, y, bz + nz*W, ax + nx*W, y, az + nz*W);
			wpos.push(ax, -.3, az, bx, -.3, bz, bx, y, bz, ax, -.3, az, bx, y, bz, ax, y, az);
			// un arbre tous les 3,4 sur la rive
			for(let t = 1.7; t < l; t += 3.4){
				const x = ax + (bx-ax)*t/l + nx*2.4, z = az + (bz-az)*t/l + nz*2.4;
				if(free(x, z) && !(out.gardenPoly && pointIn(x, z, out.gardenPoly)) && out.trees.every(q => Math.hypot(q.x - x, q.z - z) > 2.6)) out.trees.push({ x, z, k:"d", s:1.1 });
			}
		}
	}
	for(const [arr, m] of [[pos, stone], [wpos, wallM]]){
		const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals();
		const me = new THREE.Mesh(g, m); me.material.side = THREE.DoubleSide; me.receiveShadow = true; scene.add(me);
	}

	/* ---------- passerelles sur la Deûle ---------- */
	const steel = std("#3b3f46", { roughness:.5, metalness:.4 }), deck = std("#8e8a83");
	for(const [, f] of D ? D.footbridges : []){
		const p = P2(f), [ax, az] = p[0], [bx, bz] = p[p.length-1], L = Math.hypot(bx-ax, bz-az), a = Math.atan2(bx-ax, bz-az);
		const g = new THREE.Group(); g.position.set((ax+bx)/2, 0, (az+bz)/2); g.rotation.y = a; scene.add(g);
		const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); };
		add(new THREE.BoxGeometry(1.5, .18, L + 1), deck, 0, 1.05, 0);
		add(new THREE.BoxGeometry(1.6, .3, L + 1), steel, 0, .82, 0);
		for(const x of [-.74, .74]){ add(new THREE.BoxGeometry(.05, .05, L + 1), steel, x, 1.62, 0); for(let z = -L/2; z <= L/2; z += 1.2) add(new THREE.BoxGeometry(.04, .5, .04), steel, x, 1.37, z); }
	}
	return out;
}
