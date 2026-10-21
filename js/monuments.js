/* Monuments faits main sur l'horizon : églises du quartier (nef, bas-côtés, toit d'ardoise, abside, clocher et flèche),
   cathédrale de la Treille, beffroi de l'Hôtel de Ville, tours d'Euralille. Positions et tailles : MAP.monuments
   (tools/build_map.py), déjà mises à l'échelle du lointain. De nuit, ils sont éclairés comme en vrai. */
import * as THREE from "three";
import { std, BOX } from "./kit.js?v=f5913cb4c8";

export function buildMonuments(scene, MAP){
	const brick = std("#a5523c"), stone = std("#e2d6c0"), slate = std("#4c5464"), dark = std("#2c3038"), copper = std("#7fa595");
	const glass = std("#6d8fb8", { roughness:.18, metalness:.45 }), concrete = std("#d8d6d0");
	const lit = [brick, stone, concrete];
	const out = { group:new THREE.Group(), list:[] };
	scene.add(out.group);
	const blk = (g, w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(BOX, m); o.scale.set(w, h, d); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
	const cone = (g, r, h, m, x, y, z, seg = 8, ry = Math.PI/8) => { const o = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg).translate(0, h/2, 0), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
	const gableRoof = (g, L, W, H, m, x, y, z) => {
		const s = new THREE.Shape([new THREE.Vector2(-W/2, 0), new THREE.Vector2(W/2, 0), new THREE.Vector2(0, H)]);
		const o = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:L, bevelEnabled:false }).translate(0, 0, -L/2), m);
		o.position.set(x, y, z); g.add(o); return o;
	};
	// clocher : tour carrée, chambre des cloches (baies sombres), flèche octogonale et clochetons
	const steeple = (g, s, hT, top, x, z, spire = true) => {
		blk(g, s, hT, s, brick, x, 0, z);
		blk(g, s*1.04, hT*.05, s*1.04, stone, x, hT*.62, z);
		for(const [dx, dz, w, d] of [[0, s/2, s*.5, .05], [0, -s/2, s*.5, .05], [s/2, 0, .05, s*.5], [-s/2, 0, .05, s*.5]]) blk(g, w || .05, hT*.16, d || .05, dark, x + dx*1.01, hT*.72, z + dz*1.01);
		if(spire){
			cone(g, s*.62, Math.max(1, top - hT), slate, x, hT, z);
			for(const [dx, dz] of [[1,1],[1,-1],[-1,1],[-1,-1]]) cone(g, s*.1, s*.6, slate, x + dx*s*.42, hT, z + dz*s*.42, 6, 0);
		} else blk(g, s*1.06, s*.12, s*1.06, stone, x, hT, z);
	};
	const church = (m, square) => {
		const g = new THREE.Group(), L = m.L, W = m.W, H = Math.max(1.4, m.h);
		const tw = Math.min(W*.42, L*.22), apse = W*.3;
		const nL = L - tw - apse*.6, nz = (tw - apse*.6)/2*m.west;                        // la nef entre le clocher et l'abside
		blk(g, W, H*.62, nL, brick, 0, 0, nz);                                          // bas-côtés
		blk(g, W*.56, H, nL, brick, 0, 0, nz);                                          // nef
		gableRoof(g, nL, W*.62, W*.42, slate, 0, H, nz);
		gableRoof(g, nL, W*1.02, W*.18, slate, 0, H*.62, nz);
		const az = -m.west*(L/2 - apse);                                                // abside au chevet (à l'est)
		const ap = new THREE.Mesh(new THREE.CylinderGeometry(apse, apse, H, 10, 1, false, 0, Math.PI).translate(0, H/2, 0), brick);
		ap.rotation.y = m.west > 0 ? Math.PI : 0; ap.position.set(0, 0, az); g.add(ap);
		const ar = new THREE.Mesh(new THREE.ConeGeometry(apse*1.02, W*.36, 10, 1, false, 0, Math.PI).translate(0, W*.18, 0), slate);
		ar.rotation.y = ap.rotation.y; ar.position.set(0, H, az); g.add(ar);
		steeple(g, tw, Math.max(H*1.9, (m.top - H)*.45 + H), m.top, 0, m.west*(L/2 - tw/2), !square);
		return g;
	};
	const MAKE = {
		eglise:m => church(m, false),
		eglise_carree:m => church(m, true),
		cathedrale:m => {
			// Notre-Dame-de-la-Treille : longue nef néogothique très haute, transept, chevet ; façade ouest en marbre clair
			const g = new THREE.Group(), L = m.L, W = m.W, H = m.h;
			blk(g, W*.55, H, L*.82, brick, 0, 0, 0);
			blk(g, W, H*.55, L*.7, brick, 0, 0, 0);
			gableRoof(g, L*.82, W*.6, W*.5, slate, 0, H, 0);
			blk(g, W*1.5, H, W*.5, brick, 0, 0, -m.west*L*.12);                          // transept
			gableRoof(g, W*.5, W*1.5, W*.5, slate, 0, H, -m.west*L*.12).rotation.y = Math.PI/2;
			blk(g, W*.7, H*1.15, W*.12, stone, 0, 0, m.west*L*.42);                      // façade de marbre
			cone(g, W*.12, m.top - H, slate, 0, H + W*.4, -m.west*L*.12, 8);              // flèche de la croisée
			return g;
		},
		beffroi:m => {
			// le beffroi (104 m) qui s'affine par étages, et l'Hôtel de Ville en brique à ses pieds
			const g = new THREE.Group(), s = Math.max(3.2, m.L*1.4), T = m.top;
			blk(g, s*5, T*.13, s*1.7, brick, s*2.2, 0, 0);
			blk(g, s, T*.62, s, brick, 0, 0, 0);
			blk(g, s*.86, T*.18, s*.86, brick, 0, T*.62, 0);
			for(const r of [0, Math.PI/2]) blk(g, s*.92, s*.4, .06, stone, 0, T*.66, 0, r);     // cadrans de l'horloge
			blk(g, s*.6, T*.1, s*.6, stone, 0, T*.8, 0);
			cone(g, s*.42, T*.1, copper, 0, T*.9, 0, 8);
			return g;
		},
		tour:m => {
			const g = new THREE.Group(), s = m.L;
			const t = new THREE.Mesh(new THREE.CylinderGeometry(s*.42, s*.5, m.top, 12).translate(0, m.top/2, 0), glass); g.add(t);
			blk(g, s*1.2, m.top*.08, s*1.2, concrete, 0, 0, 0);
			return g;
		},
		tour_botte:m => {
			// la « botte de ski » : tour fine et haute posée sur un long socle
			const g = new THREE.Group(), L = m.L, W = m.W;
			blk(g, W*.7, m.top, W*.7, glass, -L*.25, 0, 0);
			blk(g, W*.74, m.top*.04, W*.74, concrete, -L*.25, m.top, 0);
			blk(g, L, m.top*.18, W*.7, glass, 0, 0, 0);
			blk(g, L*1.01, m.top*.015, W*.72, concrete, 0, m.top*.18, 0);
			return g;
		}
	};
	for(const m of MAP.monuments || []){
		const make = MAKE[m.kind]; if(!make) continue;
		const g = make(m);
		g.position.set(m.x, 0, m.z);
		g.rotation.y = Math.PI/2 - m.ang;          // l'axe long du modèle (z local) suit l'axe réel (angle m.ang dans le plan x-z)
		g.traverse(o => { if(o.isMesh){ o.castShadow = false; o.receiveShadow = true; } });
		out.group.add(g); out.list.push({ m, g });
	}
	// de nuit, les monuments sont mis en lumière (chaud sur la brique et la pierre)
	for(const mat of lit){ mat.emissive.set("#ffb36b"); mat.emissiveIntensity = 0; }
	out.setNight = k => { for(const mat of lit) mat.emissiveIntensity = .22*k; glass.emissive.set("#ffd9a0"); glass.emissiveIntensity = .12*k; };
	// les bâtiments génériques du lointain à leur place sont retirés (buildHorizon)
	out.covers = (x, z) => (MAP.monuments || []).some(m => Math.hypot(x - m.x, z - m.z) < Math.max(m.L, m.W)*.55 + 1);
	return out;
}
