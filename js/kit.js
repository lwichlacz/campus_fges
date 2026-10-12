/* Boîte à outils 3D partagée : formes primitives, prismes, fenêtres instanciées, étudiants. */
import * as THREE from "three";

export function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export const rng = mulberry32(1881);
export const R = (a,b) => a + (b-a)*rng();
export const pick = arr => arr[Math.floor(rng()*arr.length)];

export const BOX = new THREE.BoxGeometry(1,1,1).translate(0,.5,0);    // posée au sol
export const BOXC = new THREE.BoxGeometry(1,1,1);                      // centrée
export const ARCH = new THREE.CylinderGeometry(1,1,1,14,1,false,Math.PI/2,Math.PI).rotateX(Math.PI/2);

const cache = new Map();
export function cached(key, make){ if(!cache.has(key)) cache.set(key, make()); return cache.get(key); }

export function std(color, o={}){ return new THREE.MeshStandardMaterial(Object.assign({ color, roughness:.92, metalness:0, flatShading:true }, o)); }

export function mesh(geo, mat, parent, x=0, y=0, z=0, ry=0, shadow=true){
	const m = new THREE.Mesh(geo, mat);
	m.position.set(x,y,z); m.rotation.y = ry;
	m.castShadow = shadow; m.receiveShadow = true;
	parent.add(m); return m;
}
export function box(parent, w, h, d, mat, x, y, z, ry=0, shadow=true){
	const m = mesh(BOX, mat, parent, x, y, z, ry, shadow);
	m.scale.set(w,h,d); return m;
}
export function cyl(parent, rt, rb, h, mat, x, y, z, seg=8){
	return mesh(cached(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt,rb,h,seg).translate(0,h/2,0)), mat, parent, x, y, z);
}
export function cone(parent, r, h, mat, x, y, z, seg=8, ry=0){
	return mesh(cached(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r,h,seg).translate(0,h/2,0)), mat, parent, x, y, z, ry);
}
/* Poutre entre deux points (escaliers, rampes, fermes de verrière). */
export function beam(parent, a, b, w, h, mat, shadow=true){
	const m = new THREE.Mesh(BOXC, mat);
	const d = new THREE.Vector3().subVectors(b, a);
	m.scale.set(w, h, d.length());
	m.position.copy(a).addScaledVector(d, .5);
	m.lookAt(b.x, b.y, b.z);
	m.castShadow = shadow; m.receiveShadow = true;
	parent.add(m); return m;
}
/* Prisme : profil (z,y) extrudé le long de x, centré. */
export function extrudeX(pts, L){
	return cached("e"+pts.join(";")+"|"+L, () => {
		const s = new THREE.Shape();
		s.moveTo(pts[0][0], pts[0][1]);
		for(let i=1;i<pts.length;i++) s.lineTo(pts[i][0], pts[i][1]);
		s.closePath();
		const g = new THREE.ExtrudeGeometry(s, { depth:L, bevelEnabled:false });
		g.rotateY(Math.PI/2); g.translate(-L/2,0,0);
		return g;
	});
}
export const gable = (L,D,H) => extrudeX([[-D/2,0],[D/2,0],[0,H]], L);
export const mansard = (L,D,H) => extrudeX([[-D/2,0],[D/2,0],[D/2-1.3,H*.8],[D/2-3,H],[-D/2+3,H],[-D/2+1.3,H*.8]], L);

/* Fenêtres : on les déclare partout, puis on les dessine en 6 maillages instanciés. */
export function windowBatch(litRatio=.55){
	const list = [];
	return {
		win(g, x, y, z, w, h, ry=0, o={}){
			list.push({ g, x, y, z, w, h, ry, arch:!!o.arch, lit: o.door ? !!o.lit : (o.lit !== undefined ? o.lit : rng() < litRatio) });
		},
		build(scene, glassLit, glassDark, frameMat){
			scene.updateMatrixWorld(true);
			const L = { gl:[], gd:[], al:[], ad:[], f:[], fa:[] };
			const d = new THREE.Object3D();
			const push = (arr, r, py, sx, sy, sz, off) => {
				d.position.set(r.x + Math.sin(r.ry)*off, py, r.z + Math.cos(r.ry)*off);
				d.rotation.set(0, r.ry, 0); d.scale.set(sx, sy, sz); d.updateMatrix();
				arr.push(new THREE.Matrix4().multiplyMatrices(r.g.matrixWorld, d.matrix));
			};
			for(const r of list){
				push(r.lit ? L.gl : L.gd, r, r.y, r.w, r.h, .14, .09);
				push(L.f, r, r.y, r.w+.34, r.h+.3, .16, .06);
				if(r.arch){
					const ay = r.y + r.h/2;
					push(r.lit ? L.al : L.ad, r, ay, r.w/2, r.w/2, .14, .09);
					push(L.fa, r, ay, r.w/2+.17, r.w/2+.17, .16, .06);
				}
			}
			const mk = (geo, mat, arr) => {
				if(!arr.length) return;
				const im = new THREE.InstancedMesh(geo, mat, arr.length);
				arr.forEach((m,i) => im.setMatrixAt(i, m));
				im.receiveShadow = true;
				scene.add(im);
			};
			mk(BOXC, glassLit, L.gl); mk(BOXC, glassDark, L.gd);
			mk(ARCH, glassLit, L.al); mk(ARCH, glassDark, L.ad);
			mk(BOXC, frameMat, L.f); mk(ARCH, frameMat, L.fa);
		}
	};
}

/* Étudiants : une capsule, une tête… et la toque qui fait tout le personnage. */
const SKIN = ["#f1c9a5","#e0ac84","#c68b62","#8d5a3b","#f5d5bd"];
const SWEATER = ["#d9a441","#8a2b4e","#2f6f8f","#e07a5f","#3d7a55","#1e305e","#c9675a","#6b5b95"];
const capMat = std("#1e305e"), tasselMat = std("#e2b13c");
const BODY = new THREE.CapsuleGeometry(.36, .55, 4, 10);
const HEAD = new THREE.SphereGeometry(.3, 12, 10);
const CAPC = new THREE.CylinderGeometry(.26,.3,.18,10);
const bodyMats = SWEATER.map(c => std(c, { flatShading:false }));
const skinMats = SKIN.map(c => std(c, { flatShading:false }));
export function makeStudent(parent, seated=false){
	const g = new THREE.Group();
	const body = new THREE.Mesh(BODY, pick(bodyMats)); body.position.y = .65; body.castShadow = true;
	const head = new THREE.Mesh(HEAD, pick(skinMats)); head.position.y = 1.42; head.castShadow = true;
	const hat = new THREE.Group(); hat.position.y = 1.62; hat.rotation.z = R(-.12,.12);
	const board = new THREE.Mesh(BOXC, capMat); board.scale.set(.82,.06,.82); board.rotation.y = Math.PI/4; board.position.y = .1; board.castShadow = true;
	const cap = new THREE.Mesh(CAPC, capMat);
	const tassel = new THREE.Mesh(BOXC, tasselMat); tassel.scale.set(.05,.32,.05); tassel.position.set(.38,-.05,.1);
	hat.add(board, cap, tassel);
	g.add(body, head, hat);
	if(!seated && rng() < .45){ const bag = new THREE.Mesh(BOXC, pick(bodyMats)); bag.scale.set(.5,.55,.25); bag.position.set(0,.85,-.38); bag.castShadow = true; g.add(bag); }
	if(seated){ body.scale.y = .75; body.position.y = .95; head.position.y = 1.62; hat.position.y = 1.82; }
	g.scale.setScalar(1.25);
	g.userData.dynamic = true;
	parent.add(g);
	return { g, body, hat, tassel };
}

/* Passants variés (quartier Euratechnologies, métro) : étudiants sans toque, actifs, seniors, casques audio…
   Même forme que makeStudent ({ g, body, hat, tassel }) pour réutiliser les mêmes animations. */
const HAIR = ["#2b1d14","#4a3020","#6b4423","#c9a15a","#a8502a","#1b1b1f"].map(c => std(c, { flatShading:false }));
const GREY = std("#cfcfd2", { flatShading:false });
const PALETTE = {
	student:["#2f6f8f","#3d7a55","#e07a5f","#6b5b95","#d9a441","#c9675a","#21b6ce","#8a8f99"],
	pro:["#2b3442","#3b3f47","#1e305e","#5b6470","#7a5c48"],
	senior:["#b9a88f","#8c7a63","#6f7d6a","#a3605a"],
	casual:["#d64550","#f2c63c","#4e8f6a","#3a6ea5","#e8e2d6","#2f2f35"]
};
const KIND_W = [["student",.42],["pro",.28],["casual",.2],["senior",.1]];
const matsBy = {}; for(const k in PALETTE) matsBy[k] = PALETTE[k].map(c => std(c, { flatShading:false }));
const HAIRCAP = new THREE.SphereGeometry(.315, 12, 8, 0, Math.PI*2, 0, Math.PI*.55);
export function makePerson(parent, seated=false, kind=null){
	if(!kind){ let r = rng(); kind = KIND_W.find(([, w]) => (r -= w) < 0)?.[0] || "student"; }
	const g = new THREE.Group();
	const body = new THREE.Mesh(BODY, pick(matsBy[kind])); body.position.y = .65; body.castShadow = true;
	const head = new THREE.Mesh(HEAD, pick(skinMats)); head.position.y = 1.42; head.castShadow = true;
	const hat = new THREE.Group(); hat.position.y = 1.62;
	const hairM = kind === "senior" ? GREY : pick(HAIR);
	const cap = new THREE.Mesh(HAIRCAP, hairM); cap.position.y = -.17; cap.rotation.x = -.15; hat.add(cap);
	if(kind !== "pro" && rng() < .35){ const tail = new THREE.Mesh(BOXC, hairM); tail.scale.set(.42,.42,.16); tail.position.set(0,-.32,-.24); hat.add(tail); }   // cheveux longs
	if(kind === "casual" && rng() < .5){ const beanie = new THREE.Mesh(CAPC, pick(matsBy.casual)); beanie.scale.set(1.15,1.1,1.15); beanie.position.y = .02; hat.add(beanie); }
	if(kind === "casual" || (kind === "student" && rng() < .3)){                                                  // casque audio
		const band = new THREE.Mesh(new THREE.TorusGeometry(.32, .035, 6, 14, Math.PI), std("#26262b")); band.position.y = -.12; band.rotation.y = Math.PI/2; hat.add(band);
	}
	const tassel = new THREE.Object3D(); hat.add(tassel);
	g.add(body, head, hat);
	if(!seated){
		if(kind === "student" && rng() < .7){ const bag = new THREE.Mesh(BOXC, pick(bodyMats)); bag.scale.set(.5,.55,.25); bag.position.set(0,.85,-.38); bag.castShadow = true; g.add(bag); }
		if(kind === "pro" && rng() < .7){ const brief = new THREE.Mesh(BOXC, std("#3a2a20")); brief.scale.set(.42,.32,.1); brief.position.set(.48,.42,0); g.add(brief); }
	}
	if(seated){ body.scale.y = .75; body.position.y = .95; head.position.y = 1.62; hat.position.y = 1.82; }
	g.scale.setScalar(1.25*(kind === "senior" ? .95 : .92 + rng()*.14));
	g.userData.dynamic = true;
	parent.add(g);
	return { g, body, hat, tassel, kind };
}
