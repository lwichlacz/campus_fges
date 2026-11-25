/* La Citadelle de Lille (Vauban, 1667-1671) d'après OpenStreetMap (js/citadelle_osm.js, tools/build_citadelle.py).
   Ce qui était une étoile pleine au dessus plat devient une vraie fortification :
   - chaque muraille de l'extrait (escarpe, mur de soutènement, demi-lunes Saint-Georges et Sainte-Barbe) reçoit le profil
     de Vauban : parement de brique incliné côté fossé, cordon de pierre blanche, parapet de terre engazonné, banquette,
     terre-plein, puis talus intérieur jusqu'au sol ;
   - une guérite de pierre à la pointe de chaque bastion ;
   - les fossés en eau (Fossé des Pêcheurs, Canal de la Tortue), les ponts, la Porte Dauphine (porte de secours,
     tournée vers la campagne au sud-ouest ; position approchée) ;
   - à l'intérieur, la forêt qui couvre aujourd'hui l'enceinte, et la place d'armes réduite à son pentagone de gravier,
     fermé par l'anneau des bâtiments ; la chapelle, la poudrière de Turenne et le corps de garde faits main.
   Rien n'est instancié ici : bakeStatic (js/render.js) fusionne tout par matériau. */
import * as THREE from "three";
import { std } from "./kit.js?v=22644ce8bd";

const P2 = f => { const p = []; for(let i=0;i<f.length;i+=2) p.push([f[i], f[i+1]]); return p; };
function pointIn(x, z, p){ let ins = false; for(let i=0, j=p.length-1; i<p.length; j=i++){ const [xi,zi] = p[i], [xj,zj] = p[j]; if(((zi > z) !== (zj > z)) && x < (xj-xi)*(z-zi)/(zj-zi) + xi) ins = !ins; } return ins; }
function segD(x, z, ax, az, bx, bz){ const dx = bx-ax, dz = bz-az, l2 = dx*dx + dz*dz || 1, t = Math.max(0, Math.min(1, ((x-ax)*dx + (z-az)*dz)/l2)); return Math.hypot(x - ax - t*dx, z - az - t*dz); }
function hull(pts){
	pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cr = (o, a, b) => (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]), lo = [], hi = [];
	for(const p of pts){ while(lo.length >= 2 && cr(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
	for(const p of pts.slice().reverse()){ while(hi.length >= 2 && cr(hi[hi.length-2], hi[hi.length-1], p) <= 0) hi.pop(); hi.push(p); }
	return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// une ligne décalée de d (normale gauche), sommets en onglet (limité)
function miters(p){
	const n = p.length, out = [];
	for(let i=0;i<n;i++){
		const a = p[Math.max(0, i-1)], b = p[i], c = p[Math.min(n-1, i+1)];
		const d1 = i > 0 ? norm2(b[0]-a[0], b[1]-a[1]) : null, d2 = i < n-1 ? norm2(c[0]-b[0], c[1]-b[1]) : null;
		const n1 = d1 && [-d1[1], d1[0]], n2 = d2 && [-d2[1], d2[0]];
		let m = n1 && n2 ? norm2(n1[0] + n2[0], n1[1] + n2[1]) : (n1 || n2);
		const k = n1 && n2 ? Math.max(.35, m[0]*n1[0] + m[1]*n1[1]) : 1;
		out.push([m[0]/k, m[1]/k]);
	}
	return out;
}
function norm2(x, z){ const l = Math.hypot(x, z) || 1; return [x/l, z/l]; }

/* petit constructeur de géométrie (triangles indépendants, normales de face) */
function builder(){
	const pos = [], uv = [], col = [];
	return {
		tri(a, b, c, ua = [0,0], ub = [0,0], uc = [0,0], k = [1,1,1]){ pos.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); col.push(...k, ...k, ...k); },
		quad(a, b, c, d, ua, ub, uc, ud, k){ this.tri(a, b, c, ua, ub, uc, k); this.tri(a, c, d, ua, uc, ud, k); },
		geo(){
			if(!pos.length) return null;
			const g = new THREE.BufferGeometry();
			g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
			g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
			g.computeVertexNormals(); g.computeBoundingSphere();
			return g;
		}
	};
}
function brickTexture(){
	const c = document.createElement("canvas"); c.width = 64; c.height = 64; const x = c.getContext("2d");
	x.fillStyle = "#ffffff"; x.fillRect(0, 0, 64, 64);
	for(let j=0;j<8;j++){
		x.fillStyle = "rgba(255,255,255,.0)";
		for(let i=0;i<4;i++){ x.fillStyle = `rgba(0,0,0,${.03 + ((i*7 + j*13) % 5)*.018})`; x.fillRect(i*16 + (j % 2)*8, j*8, 15, 7); }
		x.fillStyle = "rgba(255,240,220,.18)"; x.fillRect(0, j*8 + 7, 64, 1);
	}
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	return t;
}

/* Profils, du fossé vers l'intérieur : [décalage vers l'extérieur, hauteur, matière (0 brique, 1 pierre, 2 herbe)] */
const PROFILE = {
	0:[[.55, 0, 0], [0, 2.65, 1], [.06, 2.68, 1], [.06, 2.92, 2], [-.9, 3.3, 2], [-1.7, 3.3, 2], [-2.2, 2.95, 2], [-4.4, 2.9, 2], [-8.2, .04, 2]],   // muraille (escarpe du corps de place, demi-lunes)
	1:[[.35, 0, 0], [0, 1.75, 1], [.05, 1.78, 1], [.05, 1.98, 2], [-1.6, 2.05, 2], [-5.0, .04, 2]],                                                    // mur de soutènement (contrescarpe, ouvrages)
	3:[[.2, 0, 0], [.2, 1.1, 1], [-.2, 1.1, 1], [-.2, 0, 0]]                                                                                          // mur simple
};
const MAT_SHADE = [[.98, .96, .95], [1, 1, 1], [1, 1, 1]];

export function buildCitadel({ scene, CIT, MAP, outline, waterMat, turf }){
	const [cx, cz] = MAP.citadelle;
	const g = new THREE.Group(); scene.add(g);
	const brick = std("#94503c", { flatShading:false, map:brickTexture(), vertexColors:true, roughness:.9 });
	const stone = std("#e4d8c2", { flatShading:false, vertexColors:true });
	const grass = turf; grass.vertexColors = true; grass.flatShading = false;
	const B = [builder(), builder(), builder()];          // brique, pierre, herbe
	const walls = CIT.walls.filter(([k]) => k !== 2).map(([k, , name, f]) => ({ k, name, p:P2(f) })).filter(w => w.p.length >= 2);
	const salients = [];

	for(const w of walls){
		const p = w.p, prof = PROFILE[w.k], m = miters(p);
		// l'extérieur : le côté le plus loin du centre de la Citadelle (au milieu de la muraille)
		const mi = Math.floor((p.length - 1)/2), a = p[mi], b = p[Math.min(p.length-1, mi+1)];
		const mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2, d = norm2(b[0]-a[0], b[1]-a[1]), nl = [-d[1], d[0]];
		const side = Math.hypot(mx + nl[0] - cx, mz + nl[1] - cz) > Math.hypot(mx - nl[0] - cx, mz - nl[1] - cz) ? 1 : -1;
		const at = (i, o, y) => [p[i][0] + m[i][0]*o*side, y, p[i][1] + m[i][1]*o*side];
		let run = 0; const L = [0];
		for(let i=1;i<p.length;i++){ run += Math.hypot(p[i][0]-p[i-1][0], p[i][1]-p[i-1][1]); L.push(run); }
		for(let i=0;i+1<p.length;i++){
			for(let j=0;j+1<prof.length;j++){
				const [o0, y0, mat] = prof[j], [o1, y1] = prof[j+1];
				const v0 = y0*(mat === 0 ? 1 : .5) + (mat === 2 ? o0*.5 : 0), v1 = y1*(mat === 0 ? 1 : .5) + (mat === 2 ? o1*.5 : 0);
				// le pied du mur plus sombre (humidité), le haut du talus plus clair
				const k = mat === 0 ? [.82, .8, .8] : MAT_SHADE[mat];
				const q = [at(i, o0, y0), at(i+1, o0, y0), at(i+1, o1, y1), at(i, o1, y1)];
				B[mat].quad(q[0], q[1], q[2], q[3], [L[i], v0], [L[i+1], v0], [L[i+1], v1], [L[i], v1], k);
			}
		}
		// bouts de la muraille : la coupe du profil, fermée jusqu'au sol
		for(const i of [0, p.length - 1]){
			const pts2 = prof.map(([o, y]) => new THREE.Vector2(o, y)).concat([new THREE.Vector2(prof[prof.length-1][0], 0)]);
			let ids; try { ids = THREE.ShapeUtils.triangulateShape(pts2, []); } catch(e){ continue; }
			for(const [x, y, z] of ids) B[2].tri(at(i, pts2[x].x, pts2[x].y), at(i, pts2[y].x, pts2[y].y), at(i, pts2[z].x, pts2[z].y));
		}
		// pointes de bastion : angle saillant vers l'extérieur
		if(w.k === 0) for(let i=1;i+1<p.length;i++){
			const u = norm2(p[i][0]-p[i-1][0], p[i][1]-p[i-1][1]), v = norm2(p[i+1][0]-p[i][0], p[i+1][1]-p[i][1]);
			const turn = Math.acos(Math.max(-1, Math.min(1, u[0]*v[0] + u[1]*v[1])));
			const out = [m[i][0]*side, m[i][1]*side], far = Math.hypot(p[i][0] + out[0] - cx, p[i][1] + out[1] - cz) > Math.hypot(p[i][0] - cx, p[i][1] - cz);
			const convex = (u[0]*v[1] - u[1]*v[0])*side > 0;
			if(turn > 1.0 && far && convex) salients.push({ x:p[i][0] + out[0]*.25, z:p[i][1] + out[1]*.25, ry:Math.atan2(out[0], out[1]), h:prof[1][1] });
		}
	}
	for(const [i, m] of [brick, stone, grass].entries()){ const geo = B[i].geo(); if(!geo) continue; const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; g.add(me); }

	// guérites (échauguettes) de pierre aux pointes des bastions
	const slate = std("#4a4f5c");
	const corbel = new THREE.CylinderGeometry(.42, .12, .5, 10).translate(0, -.25, 0), body = new THREE.CylinderGeometry(.4, .4, .95, 10).translate(0, .47, 0);
	const roof = new THREE.ConeGeometry(.5, .6, 10).translate(0, 1.25, 0), slit = new THREE.BoxGeometry(.08, .32, .05).translate(0, .55, .4);
	const dark = std("#2a2226");
	for(const s of salients){
		const t = new THREE.Group(); t.position.set(s.x, s.h + .1, s.z); t.rotation.y = s.ry; g.add(t);
		for(const [geo, mat] of [[corbel, stone], [body, stone], [roof, slate], [slit, dark]]){ const me = new THREE.Mesh(geo, mat); me.castShadow = true; t.add(me); }
	}

	// les fossés en eau de l'extrait (sous l'eau du quartier là où elle existe déjà)
	if(waterMat) for(const [, f] of CIT.water){
		const sh = new THREE.Shape(P2(f).map(([x, z]) => new THREE.Vector2(x, -z)));
		const me = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2), waterMat); me.position.y = .012; me.receiveShadow = true; g.add(me);
	}
	// les ponts : tablier de pierre et parapets
	const deck = std("#b9ae9e"), para = std("#d9cdb8");
	for(const f of CIT.bridges){
		const sh = new THREE.Shape(P2(f).map(([x, z]) => new THREE.Vector2(x, -z)));
		const me = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:.35, bevelEnabled:false }).rotateX(-Math.PI/2), deck); me.position.y = .55; me.castShadow = me.receiveShadow = true; g.add(me);
		const ed = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:.35, bevelEnabled:false }).rotateX(-Math.PI/2), para);
		ed.scale.set(1, 1.6, 1); ed.position.y = .9; ed.visible = false; g.add(ed);          // (gardé pour un garde-corps plus fin plus tard)
	}

	// sol de l'enceinte : sous-bois (la forêt pousse partout, sauf sur la place d'armes)
	const outlineP = outline;
	const floorGeo = new THREE.ShapeGeometry(new THREE.Shape(outlineP.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI/2);
	floorGeo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(floorGeo.attributes.position.count*3).fill(.74), 3));          // sous-bois : plus sombre que le gazon des remparts
	const floor = new THREE.Mesh(floorGeo, grass);
	floor.position.y = .03; floor.receiveShadow = true; g.add(floor);

	// place d'armes : le pentagone des bâtiments du centre, en gravier rose
	const inside = MAP.buildings.map(r => P2(r[4])).filter(p => { const [x, z] = p[0]; return pointIn(x, z, outlineP); });
	let ccx = 0, ccz = 0; inside.forEach(p => { ccx += p[0][0]; ccz += p[0][1]; }); ccx /= inside.length || 1; ccz /= inside.length || 1;
	const core = inside.filter(p => Math.hypot(p[0][0] - ccx, p[0][1] - ccz) < 34);
	const h = hull(core.flat());
	const place = h.map(([x, z]) => { const d = norm2(x - ccx, z - ccz); return [x + d[0]*2.2, z + d[1]*2.2]; });
	const gravel = std("#cdb49a", { flatShading:false });
	const pm = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(place.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI/2), gravel);
	pm.position.y = .07; pm.receiveShadow = true; g.add(pm);

	// la forêt : un arbre tous les 2,6 environ, hors de la place, des murailles (parement et parapet), de l'eau et des bâtiments
	const water = (MAP.citadel.water || []).map(P2).concat(CIT.water.map(([, f]) => P2(f)));
	const rnd = (() => { let s = 7; return () => (s = (s*16807) % 2147483647)/2147483647; })();
	const xs = outlineP.map(q => q[0]), zs = outlineP.map(q => q[1]), trees = [];
	const nearWall = (x, z) => walls.some(w => { for(let i=0;i+1<w.p.length;i++) if(segD(x, z, w.p[i][0], w.p[i][1], w.p[i+1][0], w.p[i+1][1]) < (w.k === 0 ? 2.4 : 1.3)) return true; return false; });
	for(let x = Math.min(...xs); x < Math.max(...xs); x += 2.6) for(let z = Math.min(...zs); z < Math.max(...zs); z += 2.6){
		const tx = x + (rnd() - .5)*2.2, tz = z + (rnd() - .5)*2.2;
		if(!pointIn(tx, tz, outlineP) || pointIn(tx, tz, place) || water.some(w => pointIn(tx, tz, w)) || nearWall(tx, tz)) continue;
		if(inside.some(b => pointIn(tx, tz, b))) continue;
		trees.push({ x:tx, z:tz, k: rnd() < .22 ? "c" : "d", s:.85 + rnd()*.45 });
	}
	namedBuildings(g, CIT);
	return { group:g, trees:trees.slice(0, 900), place, salients:salients.length };
}

/* rectangle orienté d'une emprise : centre, angle du plus long côté, longueur, largeur */
function obb(p){
	let best = null;
	for(let i=0;i<p.length;i++){
		const a = p[i], b = p[(i+1) % p.length], ang = Math.atan2(b[1]-a[1], b[0]-a[0]), c = Math.cos(ang), s_ = Math.sin(ang);
		const us = p.map(([x, z]) => x*c + z*s_), vs = p.map(([x, z]) => -x*s_ + z*c);
		const L = Math.max(...us) - Math.min(...us), D = Math.max(...vs) - Math.min(...vs);
		if(!best || L*D < best.A){ const u0 = (Math.max(...us) + Math.min(...us))/2, v0 = (Math.max(...vs) + Math.min(...vs))/2; best = { A:L*D, ang, L, D, x:u0*c - v0*s_, z:u0*s_ + v0*c }; }
	}
	if(best.D > best.L){ best.ang += Math.PI/2; [best.L, best.D] = [best.D, best.L]; }
	return best;
}
/* Les trois bâtiments nommés de l'enceinte, faits main d'après leur emprise OpenStreetMap :
   la chapelle (nef de brique, façade de pierre à fronton, petit clocheton), la poudrière de Turenne (magasin à poudre :
   murs épais, contreforts, grand toit d'ardoise), le corps de garde (pavillon bas, arcade de pierre). */
export const HAND_NAMES = ["Chapelle", "Poudrière de Turenne", "Corps de garde"];
function namedBuildings(g, CIT){
	const brick = std("#98503b"), stone = std("#e6dac4"), slate = std("#4a4f5c"), dark = std("#2a2226");
	for(const [name, , f] of CIT.named){
		if(!HAND_NAMES.includes(name)) continue;
		const o = obb(P2(f)), G = new THREE.Group(); G.position.set(o.x, 0, o.z); G.rotation.y = -o.ang; g.add(G);
		const add = (geo, m, x, y, z, ry = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.y = ry; me.castShadow = me.receiveShadow = true; G.add(me); return me; };
		const gable = (L, D, H) => { const sh = new THREE.Shape([new THREE.Vector2(-D/2, 0), new THREE.Vector2(D/2, 0), new THREE.Vector2(0, H)]); return new THREE.ExtrudeGeometry(sh, { depth:L, bevelEnabled:false }).translate(0, 0, -L/2).rotateY(Math.PI/2); };
		const { L, D } = o;
		if(name === "Chapelle"){
			const H = 4.6;
			add(new THREE.BoxGeometry(L, H, D), brick, 0, H/2, 0);
			add(gable(L + .3, D + .4, D*.55), slate, 0, H, 0);
			const fx = L/2 + .08;                                                          // façade de pierre au bout de la nef
			add(new THREE.BoxGeometry(.2, H + .2, D + .1), stone, fx, (H + .2)/2, 0);
			add(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-D/2, 0), new THREE.Vector2(D/2, 0), new THREE.Vector2(0, D*.55)]), { depth:.22, bevelEnabled:false }).rotateY(Math.PI/2), stone, fx - .11, H + .2, 0);
			for(const z of [-D/2 + .25, D/2 - .25]) add(new THREE.BoxGeometry(.3, H + .3, .3), stone, fx + .05, (H + .3)/2, z);
			add(new THREE.BoxGeometry(.06, 1.7, .9), dark, fx + .12, .85, 0);
			add(new THREE.CircleGeometry(.45, 12, 0, Math.PI), dark, fx + .13, 1.7, 0, Math.PI/2);
			add(new THREE.CircleGeometry(.4, 16), dark, fx + .13, H - .5, 0, Math.PI/2);          // oculus
			for(let k = -2; k <= 2; k++) if(k) add(new THREE.BoxGeometry(.7, 1.8, .06), dark, k*L/6, 2.4, D/2 + .03);
			for(let k = -2; k <= 2; k++) if(k) add(new THREE.BoxGeometry(.7, 1.8, .06), dark, k*L/6, 2.4, -D/2 - .03);
			const bx = L/2 - 1.2, by = H + D*.4;                                           // clocheton
			add(new THREE.CylinderGeometry(.5, .55, 1.1, 8), stone, bx, by + .55, 0);
			add(new THREE.ConeGeometry(.62, 1.1, 8), slate, bx, by + 1.65, 0);
			add(new THREE.SphereGeometry(.09, 6, 4), std("#d9a441", { metalness:.5, roughness:.35 }), bx, by + 2.25, 0);
		} else if(name === "Poudrière de Turenne"){
			const H = 2.6;
			add(new THREE.BoxGeometry(L, H, D), brick, 0, H/2, 0);
			add(gable(L + .4, D + .6, D*.75), slate, 0, H, 0);
			const n = Math.max(2, Math.round(L/2.2));
			for(let k=0;k<n;k++){ const x = -L/2 + (k + .5)*L/n; for(const s of [1, -1]){ const c = add(new THREE.BoxGeometry(.55, H*.95, .7), brick, x, H*.95/2, s*(D/2 + .3)); c.scale.y = 1; } }
			add(new THREE.BoxGeometry(L + .1, .25, D + .1), stone, 0, .12, 0);
			add(new THREE.BoxGeometry(.06, 1.3, .7), dark, L/2 + .03, .65, 0);
		} else {
			const H = 2.4;
			add(new THREE.BoxGeometry(L, H, D), brick, 0, H/2, 0);
			const roofG = new THREE.ConeGeometry(Math.hypot(L, D)/2*1.05, 1.6, 4, 1).rotateY(Math.PI/4); roofG.scale(L/Math.hypot(L, D)*1.41, 1, D/Math.hypot(L, D)*1.41);
			add(roofG, slate, 0, H + .8, 0);
			const n = Math.max(2, Math.round(L/1.6));
			add(new THREE.BoxGeometry(L + .05, .3, .18), stone, 0, H - .15, D/2 + .05);
			for(let k=0;k<n;k++){ const x = -L/2 + (k + .5)*L/n; add(new THREE.BoxGeometry(.8, 1.4, .06), dark, x, .85, D/2 + .03); add(new THREE.BoxGeometry(.2, H - .3, .2), stone, x - L/n/2, (H - .3)/2, D/2 + .08); }
		}
	}
}
export function handExclude(CIT){
	const polys = CIT.named.filter(([n]) => HAND_NAMES.includes(n)).map(([, , f]) => P2(f));
	return (x, z) => polys.some(p => pointIn(x, z, p));
}

/* Porte Dauphine (1670) : la porte de secours, côté campagne, tournée vers le sud-ouest (Lambersart). Plus modeste que la
   Porte Royale : pavillon de brique, arcade de pierre, fronton, pont sur le fossé. Position approchée (non relevée). */
export function porteDauphine(parent, at, ry){
	const G = new THREE.Group(); G.position.set(at[0], 0, at[1]); G.rotation.y = ry; parent.add(G);
	const brick = std("#9a4f3b"), stone = std("#e6dac4"), dark = std("#2a2226"), slate = std("#4a4f5c");
	const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; G.add(me); return me; };
	add(new THREE.BoxGeometry(5.6, 4.2, 2.8), brick, 0, 2.1, -.5);
	add(new THREE.BoxGeometry(3.8, 4.4, .3), stone, 0, 2.2, 1.0);
	add(new THREE.BoxGeometry(1.6, 2.3, .2), dark, 0, 1.15, 1.18);
	add(new THREE.CircleGeometry(.8, 14, 0, Math.PI), dark, 0, 2.3, 1.29);
	const tri = new THREE.Shape([new THREE.Vector2(-2, 0), new THREE.Vector2(2, 0), new THREE.Vector2(0, 1.1)]);
	add(new THREE.ExtrudeGeometry(tri, { depth:.4, bevelEnabled:false }), stone, 0, 4.4, .8);
	add(new THREE.BoxGeometry(6, .22, 3.2), slate, 0, 4.3, -.5);
	add(new THREE.BoxGeometry(2.2, .3, 9), std("#bdb2a3"), 0, .65, 5.6);
	for(const x of [-1.2, 1.2]) add(new THREE.BoxGeometry(.22, .45, 9), stone, x, 1.0, 5.6);
	return G;
}

/* L'esplanade du Champ de Mars (OpenStreetMap, relation 10754117) : grande place minérale au pied de la Citadelle, côté ville,
   bordée d'alignements d'arbres ; le parking y occupe des rangées de voitures (hors foires et cirque). */
export function champDeMars(scene, CIT){
	const trees = [];
	for(const f of CIT.champ || []){
		const p = P2(f);
		const sh = new THREE.Shape(p.map(([x, z]) => new THREE.Vector2(x, -z)));
		const me = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(-Math.PI/2), std("#b7b1a6", { flatShading:false, roughness:.95 }));
		me.position.y = .055; me.receiveShadow = true; scene.add(me);
		// alignements : un arbre tous les 3 unités le long du bord, un peu en retrait
		const xs = p.map(q => q[0]), zs = p.map(q => q[1]), cx = xs.reduce((a, b) => a + b)/p.length, cz = zs.reduce((a, b) => a + b)/p.length;
		for(let i=0;i<p.length;i++){
			const a = p[i], b = p[(i+1) % p.length], L = Math.hypot(b[0]-a[0], b[1]-a[1]);
			for(let t = 1.5; t < L; t += 3){
				let x = a[0] + (b[0]-a[0])*t/L, z = a[1] + (b[1]-a[1])*t/L; const d = norm2(cx - x, cz - z); x += d[0]*1.2; z += d[1]*1.2;
				if(pointIn(x, z, p)) trees.push({ x, z, k:"d", s:1.05 });
			}
		}
		// rangées de voitures garées, perpendiculaires au plus long côté
		const o = obb(p), c = Math.cos(o.ang), s_ = Math.sin(o.ang), spots = [];
		let seed = 3; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
		for(let u = -o.L/2 + 4; u < o.L/2 - 4; u += .95) for(let v = -o.D/2 + 4; v < o.D/2 - 4; v += 5.2) for(const dv of [-1.05, 1.05]){
			const x = o.x + u*c - (v + dv)*s_, z = o.z + u*s_ + (v + dv)*c;
			if(pointIn(x, z, p) && rnd() < .62) spots.push([x, z, rnd()]);
		}
		if(spots.length){
			const body = new THREE.InstancedMesh(new THREE.BoxGeometry(.72, .32, 1.7).translate(0, .26, 0), std("#ffffff", { roughness:.45, metalness:.2 }), spots.length);
			const cab = new THREE.InstancedMesh(new THREE.BoxGeometry(.62, .26, .9).translate(0, .55, -.1), std("#2c3440", { roughness:.2, metalness:.3 }), spots.length);
			const d = new THREE.Object3D(), col = new THREE.Color(), PAL = ["#e9e9ea", "#8b9096", "#2d3138", "#6f1f22", "#22324f", "#c9c4b8", "#4f5a4a"];
			spots.forEach(([x, z, r], i) => { d.position.set(x, .055, z); d.rotation.y = -o.ang + (r < .5 ? 0 : Math.PI); d.updateMatrix(); body.setMatrixAt(i, d.matrix); cab.setMatrixAt(i, d.matrix); body.setColorAt(i, col.set(PAL[Math.floor(r*997) % PAL.length])); });
			for(const m of [body, cab]){ m.castShadow = true; m.receiveShadow = true; scene.add(m); }
		}
	}
	return trees;
}
