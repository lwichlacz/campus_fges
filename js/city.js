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
	/* Fenêtres dessinées sans traits de moins d'un pixel (pas de croisillons fins ni de joints de brique) :
	   ce sont ces lignes trop fines qui « fourmillaient » dès que la caméra bougeait. */
	const c = document.createElement("canvas"); c.width = c.height = 128;
	const x = c.getContext("2d");
	x.fillStyle = wall; x.fillRect(0,0,128,128);
	const glass = (x0, y0, w, h) => {
		const g = x.createLinearGradient(0, y0, 0, y0 + h);
		g.addColorStop(0, "#56677d"); g.addColorStop(1, "#3a4a5f");
		x.fillStyle = g; x.fillRect(x0, y0, w, h);
	};
	x.filter = "blur(1px)";
	if(style === "house"){
		x.fillStyle = "#e4d9c6"; x.fillRect(36,14,56,84);          // encadrement épais
		glass(44, 22, 40, 68);
		x.fillStyle = "rgba(228,217,198,.35)"; x.fillRect(61,22,6,68);   // croisillon discret
		x.fillStyle = "#e9e0cf"; x.fillRect(32,96,64,8);           // appui
	} else if(style === "campus"){
		x.fillStyle = "#ddd6c9"; x.fillRect(6,22,116,76);
		glass(14, 30, 100, 60);
		x.fillStyle = "rgba(221,214,201,.35)"; x.fillRect(60,30,8,60);
	} else if(style === "sport"){
		glass(0, 12, 128, 30);
		x.fillStyle = "#8a2b4e"; x.fillRect(0,48,128,10);
	} else if(style === "glass"){
		x.fillStyle = "#cfe3e6"; x.fillRect(0,0,128,128);
		x.fillStyle = "#f2efe8"; x.fillRect(0,0,128,10); x.fillRect(0,0,10,128); x.fillRect(64,0,8,128); x.fillRect(0,62,128,8);
	}
	x.filter = "none";
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
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

/* De loin, une fenêtre ne fait que 2 ou 3 pixels : on lit la texture un peu plus floue
   (biais de mipmap) pour qu'elle ne « fourmille » pas quand la caméra bouge.
   Le flou est progressif : nul de près (façades nettes), maximal au loin. */
const MIP_BIAS = .8, BIAS_NEAR = 40, BIAS_FAR = 140;
export function softenFar(mat){
	mat.onBeforeCompile = sh => {
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <map_fragment>", `float farBias = ${MIP_BIAS.toFixed(2)} * smoothstep( ${BIAS_NEAR.toFixed(1)}, ${BIAS_FAR.toFixed(1)}, length( vViewPosition ) );
#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv, farBias );
	diffuseColor *= sampledDiffuseColor;
#endif`)
			.replace("#include <emissivemap_fragment>", `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv, farBias );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`);
	};
	mat.customProgramCacheKey = () => "softenFar";
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
/* ---------- réverbères : toujours sur un trottoir libre ----------
   Candidats en quinconce le long des rues, au bord du trottoir. Un candidat est refusé s'il tombe
   dans un bâtiment (avec une marge), sur la chaussée d'une autre rue (carrefours), dans l'eau,
   sur une emprise faite main (Hôtel Académique, Michel Falise, Wenov) ou trop près d'un autre :
   on essaie alors le trottoir d'en face, sinon on n'en pose pas. */
function segDist(x, z, ax, az, bx, bz){
	const dx = bx - ax, dz = bz - az, l2 = dx*dx + dz*dz || 1;
	const t = Math.max(0, Math.min(1, ((x - ax)*dx + (z - az)*dz)/l2));
	return Math.hypot(x - ax - t*dx, z - az - t*dz);
}
function polyDist(x, z, p){ let d = 1e9; for(let i=0, j=p.length-1; i<p.length; j=i++) d = Math.min(d, segDist(x, z, p[j][0], p[j][1], p[i][0], p[i][1])); return d; }
let SITE = null;
function site(MAP){
	if(SITE && SITE.MAP === MAP) return SITE;
	const polys = MAP.buildings.map(r => { const f = r[4], p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); const xs = p.map(q => q[0]), zs = p.map(q => q[1]); return { p, bb:[Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] }; });
	const rect = o => { const c = Math.cos(o.ang), s = Math.sin(o.ang), L = o.L/2 + 1, D = o.D/2 + 1; return [[-L,-D],[L,-D],[L,D],[-L,D]].map(([a,b]) => [o.x + a*c - b*s, o.z + a*s + b*c]); };
	const hand = [MAP.ha && rect(MAP.ha), MAP.falise && rect(MAP.falise)].filter(Boolean);
	if(MAP.blan){ const f = MAP.blan.pts, p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); hand.push(p); }
	// grille de 10 × 10 : on ne teste que les bâtiments proches
	const G = 10, grid = new Map(), key = (a, b) => a*100003 + b;
	polys.forEach((o, k) => { for(let a = Math.floor(o.bb[0]/G); a <= Math.floor(o.bb[2]/G); a++) for(let b = Math.floor(o.bb[1]/G); b <= Math.floor(o.bb[3]/G); b++){ const kk = key(a, b); if(!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(k); } });
	const near = (x, z) => grid.get(key(Math.floor(x/G), Math.floor(z/G))) || [];
	const inBuilding = (x, z, M) => {
		const ks = M > 0 ? [...new Set([-M, M].flatMap(dx => [-M, M].flatMap(dz => near(x + dx, z + dz))))] : near(x, z);
		return ks.some(k => { const { p, bb } = polys[k]; return x > bb[0] - M && x < bb[2] + M && z > bb[1] - M && z < bb[3] + M && (pointInPoly(x, z, p) || (M > 0 && polyDist(x, z, p) < M)); });
	};
	// surface (m²) d'un toit rectangulaire qui tombe sur un bâtiment voisin
	const overNeighbours = (i, cx, cz, ang, L, D2) => {
		const ux = Math.cos(ang), uz = Math.sin(ang), own = polys[i].p; let over = 0;
		for(let s = -L/2 + .25; s < L/2; s += .5) for(let t = -D2 + .25; t < D2; t += .5){
			const x = cx + ux*s - uz*t, z = cz + uz*s + ux*t;
			if(!pointInPoly(x, z, own) && near(x, z).some(k => k !== i && pointInPoly(x, z, polys[k].p))) over += .25;
		}
		return over;
	};
	// le toit tel quel, puis sans débord de gouttière, puis un peu raccourci ; sinon null (toit plat)
	const roofFit = (rec, i) => {
		const [cx, cz, ang, L, D] = rec[3];
		for(const [l, eave] of [[L, .25], [L, 0], [L*.92, 0], [L*.85, 0]])
			if(overNeighbours(i, cx, cz, ang, l, D/2 + eave) <= .3) return [cx, cz, ang, l, D, eave];
		return null;
	};
	// marge entre le point et le bord de la chaussée la plus proche (négatif = sur la chaussée)
	const roadGap = (x, z) => { let g = 1e9, best = null; MAP.roads.forEach(([w, , p]) => { for(let i=0;i+3<p.length;i+=2){ const d = segDist(x, z, p[i], p[i+1], p[i+2], p[i+3]) - w/2; if(d < g){ g = d; best = [w, p[i], p[i+1], p[i+2], p[i+3]]; } } }); return { g, best }; };
	const inWater = (x, z) => (MAP.canals || []).some(p => { for(let i=0;i+3<p.length;i+=2) if(segDist(x, z, p[i], p[i+1], p[i+2], p[i+3]) < 5.6) return true; return false; });
	const inHand = (x, z) => hand.some(p => pointInPoly(x, z, p));
	return SITE = { MAP, inBuilding, roadGap, inWater, inHand, roofFit };
}
/* Arbres : un arbre d'alignement OSM tombé sur la chaussée (nos rues sont un peu plus larges que les vraies)
   est ramené sur le trottoir ; un arbre dans un bâtiment ou sans place libre est retiré. */
function settleTrees(MAP, trees){
	const S = site(MAP);
	return trees.filter(t => {
		if(S.inBuilding(t.x, t.z, .4)) return false;
		const { g, best } = S.roadGap(t.x, t.z);
		if(g >= .5) return true;
		const [w, ax, az, bx, bz] = best, dx = bx - ax, dz = bz - az, l2 = dx*dx + dz*dz || 1;
		const k = Math.max(0, Math.min(1, ((t.x - ax)*dx + (t.z - az)*dz)/l2)), px = ax + dx*k, pz = az + dz*k;
		let nx = t.x - px, nz = t.z - pz, n = Math.hypot(nx, nz);
		if(n < .05){ nx = -dz; nz = dx; n = Math.hypot(nx, nz); }
		const x = px + nx/n*(w/2 + 1.1), z = pz + nz/n*(w/2 + 1.1);
		if(S.inBuilding(x, z, .4) || S.roadGap(x, z).g < .5 || S.inWater(x, z)) return false;
		t.x = x; t.z = z; return true;
	});
}
function placeLamps(MAP, spots){
	const S = site(MAP);
	const free = (x, z) => !S.inBuilding(x, z, .3) && S.roadGap(x, z).g > .45 - 1e-6 && !S.inWater(x, z) && !S.inHand(x, z) && spots.every(([a, b]) => Math.hypot(a - x, b - z) > 7);
	for(const [w, code, pts] of MAP.roads){
		if(code === 1) continue;                                  // pas de réverbère sur les rues piétonnes
		const step = code === 2 ? 9 : 14, off = w/2 + .7;          // au milieu du trottoir (1,3 de large)
		// on avance le long de toute la rue (distance cumulée), pas segment par segment
		let run = 0, next = step*.5, n = 0;
		for(let i=0;i+3<pts.length;i+=2){
			const ax = pts[i], az = pts[i+1], bx = pts[i+2], bz = pts[i+3];
			const dx = bx-ax, dz = bz-az, l = Math.hypot(dx,dz); if(l < .01) continue;
			const nx = -dz/l, nz = dx/l;
			while(next <= run + l){
				const k = (next - run)/l, cx = ax + dx*k, cz = az + dz*k, side = (n++ % 2) ? 1 : -1;
				for(const sd of [side, -side]){
					const x = cx + nx*off*sd, z = cz + nz*off*sd;
					if(free(x, z)){ spots.push([x, z]); break; }
				}
				next += step;
			}
			run += l;
		}
	}
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
const PARAPET = .45;
function addBuilding(Bw, Br, Bf, rec, i=0, extras=null){
	const [kind, lv, , roof, flat] = rec;
	let p = ring(flat);
	if(signedArea(p) < 0) p = p.reverse();
	// léger décalage par bâtiment : deux toits voisins ne sont jamais au même niveau (pas de clignotement)
	const H = (kind === 3 ? lv*3.2 : kind === 6 ? 2.2 : kind === 4 ? lv*FH*1.35 : lv*FH) + (i % 7)*.035;
	const flatRoof = !roof && kind !== 5;
	let per = (rec[2]*3.7) % 5;
	for(let i=0;i<p.length;i++){
		const a = p[i], b = p[(i+1)%p.length];
		const dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx, dz);
		if(len < .01) continue;
		const n = [dz/len, 0, -dx/len];
		const u0 = per/BAY, u1 = (per+len)/BAY, v1 = H/FH;
		tri(Bw, [a[0],0,a[1]], [b[0],0,b[1]], [b[0],H,b[1]], n, [u0,0], [u1,0], [u1,v1]);
		tri(Bw, [a[0],0,a[1]], [b[0],H,b[1]], [a[0],H,a[1]], n, [u0,0], [u1,v1], [u0,v1]);
		if(flatRoof){
			// acrotère : le mur dépasse un peu du toit plat (couleur pleine, sans fenêtre)
			const W = [.02,.02], T = H + PARAPET;
			tri(Bw, [a[0],H,a[1]], [b[0],H,b[1]], [b[0],T,b[1]], n, W, W, W);
			tri(Bw, [a[0],H,a[1]], [b[0],T,b[1]], [a[0],T,a[1]], n, W, W, W);
		}
		per += len;
	}
	if(roof){
		const [cx, cz, ang, L, D, eave = .25] = roof;
		const ux = Math.cos(ang), uz = Math.sin(ang), wx = -uz, wz = ux;
		const L2 = L/2, D2 = D/2 + eave, rh = Math.min(D*.55, 3.4);
		const P = (s, t, y) => [cx + ux*s + wx*t, y, cz + uz*s + wz*t];
		const e1 = P(-L2,-D2,H), e2 = P(L2,-D2,H), e3 = P(L2,D2,H), e4 = P(-L2,D2,H), r1 = P(-L2,0,H+rh), r2 = P(L2,0,H+rh);
		const nl = Math.hypot(rh, D2);
		const n1 = [-wx*rh/nl, D2/nl, -wz*rh/nl], n2 = [wx*rh/nl, D2/nl, wz*rh/nl];
		tri(Br, e1, e2, r2, n1, [0,0], [L,0], [L,1]); tri(Br, e1, r2, r1, n1, [0,0], [L,1], [0,1]);
		tri(Br, e3, e4, r1, n2, [0,0], [L,0], [L,1]); tri(Br, e3, r1, r2, n2, [0,0], [L,1], [0,1]);
		const g1 = P(-L/2,-D/2,H), g4 = P(-L/2,D/2,H), q1 = P(-L/2,0,H+rh), g2 = P(L/2,-D/2,H), g3 = P(L/2,D/2,H), q2 = P(L/2,0,H+rh);
		const W = [.02,.02];
		tri(Bw, g1, g4, q1, [-ux,0,-uz], W, W, W); tri(Bw, g2, g3, q2, [ux,0,uz], W, W, W);
		// dalle sous le toit : ferme l'emprise là où le toit rectangulaire ne la couvre pas (formes irrégulières, toit raccourci)
		capTris(Bf, p, H - .03, ([x,z]) => [x*.22, z*.22]);
	} else {
		capTris(Bf, p, H, ([x,z]) => [x*.22, z*.22]);
		// éléments techniques sur les grands toits plats (climatisation, verrières)
		if(flatRoof && extras){
			const A = Math.abs(signedArea(p));
			if(A > 60){
				const r = mulberry32(i*7 + 3), xs = p.map(q => q[0]), zs = p.map(q => q[1]);
				const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
				const want = Math.min(6, 1 + Math.floor(A/90));
				for(let k=0, t=0; k<want && t<40; t++){
					const x = x0 + r()*(x1-x0), z = z0 + r()*(z1-z0);
					if(!pointInPoly(x, z, p) || !pointInPoly(x+1.2, z, p) || !pointInPoly(x-1.2, z, p) || !pointInPoly(x, z+1.2, p) || !pointInPoly(x, z-1.2, p)) continue;
					extras.push([x, H, z, r() < .3 ? 1 : 0, r()]);
					k++;
				}
			}
		}
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
		softenFar(m);
		out.walls.push(m); return m;
	};
	const houseMats = HOUSE_WALLS.map(c => wallMat(c, "house"));
	const campusMats = CAMPUS_WALLS.map(c => wallMat(c, "campus"));
	const sportMat = wallMat("#d8d2c6", "sport");
	const glassMat = wallMat("#cfe3e6", "glass");
	const roofMats = ROOFS.map(c => { const m = std(c, { roughness:.8 }); m.userData.base = c; out.roofs.push(m); return m; });
	const roofTex = (() => {
		const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
		x.fillStyle = "#ffffff"; x.fillRect(0,0,64,64);
		x.fillStyle = "rgba(0,0,0,.08)"; for(let i=0;i<64;i+=16) x.fillRect(i,0,2,64);
		x.fillStyle = "rgba(0,0,0,.05)"; for(let i=0;i<64;i+=32) x.fillRect(0,i,64,2);
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
	})();
	const flatMat = new THREE.MeshStandardMaterial({ color:"#8a857f", map:roofTex, roughness:.95 }); flatMat.userData.base = "#8a857f"; out.flats.push(flatMat);
	const extras = [];
	const glassRoof = new THREE.MeshStandardMaterial({ color:"#d9eef0", transparent:true, opacity:.55, roughness:.1, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
	out.glassRoof = glassRoof;

	const groups = new Map();   // clé matériau -> { w, r, f }
	const get = (key) => { if(!groups.has(key)) groups.set(key, { w:bucket(), r:bucket(), f:bucket() }); return groups.get(key); };
	const spires = [];
	const S = site(MAP); let flattened = 0; out.stats = { get flattened(){ return flattened; } };
	MAP.buildings.forEach((rec, i) => {
		// un toit à deux pentes ne doit ni mordre sur le voisin, ni laisser l'emprise à découvert
		if(rec[3] && rec[0] !== 4){ const fit = S.roofFit(rec, i); if(!fit) flattened++; rec = [rec[0], rec[1], rec[2], fit || 0, rec[4]]; }
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
			const H = addBuilding(G.w, G.r, G.f, rec, i, extras);
			const grp = new THREE.Group(); scene.add(grp);
			const w2 = wm.clone(), r2 = rm.clone(), f2 = kind === 5 ? glassRoof : flatMat.clone();
			out.walls.push(w2); out.roofs.push(r2); if(f2 !== glassRoof) out.flats.push(f2);
			for(const [B, m] of [[G.w, w2], [G.r, r2], [G.f, f2]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.castShadow = me.receiveShadow = true; grp.add(me); }
			out.pois[poi] = { group:grp, H, mats:[w2, r2, f2] };
			return;
		}
		const g = get(wm.uuid + "|" + rm.uuid);
		g.wm = wm; g.rm = rm;
		const H = addBuilding(g.w, g.r, (kind === 5 ? get("glassroof").f : g.f), rec, i, extras);
		if(kind === 5) get("glassroof").fm = glassRoof;
		if(kind === 4 && rec[3]){ const [cx,cz,ang,L] = rec[3]; spires.push([cx + Math.cos(ang)*L*.42, cz + Math.sin(ang)*L*.42, H]); }
	});
	for(const g of groups.values()){
		for(const [B, m] of [[g.w, g.wm], [g.r, g.rm], [g.f, g.fm || flatMat]]){
			if(!B.pos.length || !m) continue;
			const me = new THREE.Mesh(toGeo(B), m); me.castShadow = me.receiveShadow = true; scene.add(me);
		}
	}
	{
		// blocs techniques et petites verrières, instanciés
		const unit = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0,.5,0), std("#b9b6b0"), extras.length);
		const sky = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0,.5,0), std("#9fc3cf", { roughness:.2, metalness:.3 }), extras.length);
		const d = new THREE.Object3D(); let nu = 0, ns = 0;
		for(const [x, H, z, kind, r] of extras){
			d.position.set(x, H, z); d.rotation.set(0, r*Math.PI, 0);
			if(kind){ d.scale.set(2.2, .35, 1.4); d.updateMatrix(); sky.setMatrixAt(ns++, d.matrix); }
			else { d.scale.set(.9 + r*.8, .7 + r*.5, .8 + r*.6); d.updateMatrix(); unit.setMatrixAt(nu++, d.matrix); }
		}
		unit.count = nu; sky.count = ns;
		unit.castShadow = true; unit.receiveShadow = true;
		scene.add(unit, sky);
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
	}
	placeLamps(MAP, out.lampSpots);
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
	out.trees = settleTrees(MAP, out.trees); out.parkTrees = settleTrees(MAP, out.parkTrees);

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
