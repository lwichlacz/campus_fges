/* Le quartier Vauban reconstruit d'après OpenStreetMap : façades lilloises,
   toitures, rues, trottoirs, parcs, la Deûle. Tout est fusionné en quelques
   maillages pour rester léger, sauf les bâtiments « à visiter » (POI) qui
   restent séparés pour être cliquables. */
import * as THREE from "three";
import { std, mulberry32 } from "./kit.js?v=3dca105270";
import { TIME } from "./render.js?v=3dca105270";
import { HAUTEURS } from "./hauteurs.js?v=3dca105270";

const FH = 2.3, BAY = 1.4;
let FHc = FH;          // hauteur d'un étage pour la carte en cours (MAP.fh : à l'échelle de l'Hôtel Académique)
const HOUSE_WALLS = ["#b5563d","#a84e3a","#c46a4a","#9c4a38","#b9603f","#efe6d6","#e6d9c1","#d9cbb5","#f3eee6","#cdbfa8","#e9d3b4","#c9c2b8"];
const CAMPUS_WALLS = ["#a9533c","#ebe6dc","#c9b8a0"];
// ardoises (0, 1, 3, 7), tuiles flamandes (2, 4, 5), zinc (6) ; la teinte vue sur la photo aérienne (rec[8]) prime
const ROOFS = ["#4f5767","#5d6170","#8d4a3a","#4a505d","#a9583c","#b86a4b","#7f8791","#3b3d42"];
const ROOF_OF = { 1:[2,4,5], 2:[0,3,1], 3:[6] };          // matériau réel du toit (BD TOPO) -> teintes

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
	} else if(style === "modern"){
		// immeuble des années 1950-1980 : bandeaux de fenêtres en longueur, allège pleine
		glass(6, 34, 116, 50);
		x.fillStyle = "rgba(255,255,255,.18)"; x.fillRect(0, 92, 128, 10);      // nez de dalle
		x.fillStyle = wall; x.fillRect(60, 34, 8, 50);
	} else if(style === "recent"){
		// bâtiment récent : grandes baies toute hauteur, cadre sombre
		x.fillStyle = "#3b3f46"; x.fillRect(14, 8, 100, 108);
		glass(20, 14, 88, 96);
		x.fillStyle = "rgba(59,63,70,.6)"; x.fillRect(62, 14, 4, 96);
	} else if(style === "sport"){
		glass(0, 12, 128, 30);
		x.fillStyle = "#8a2b4e"; x.fillRect(0,48,128,10);
	} else if(style === "office"){
		// mur-rideau : grands vitrages pleine hauteur, montants fins réguliers (bureaux d'Euratechnologies)
		const dark = wall === "#2f3b4a" || wall === "#3b4656";
		const g = x.createLinearGradient(0, 0, 128, 128);
		g.addColorStop(0, dark ? "#7891ab" : "#a9bfcc"); g.addColorStop(1, dark ? "#4a5d74" : "#7a93a4");
		x.fillStyle = g; x.fillRect(6, 8, 116, 104);
		x.fillStyle = wall; x.fillRect(0, 112, 128, 16); x.fillRect(60, 0, 8, 128);
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
	// la forme de toutes les fenêtres ; laquelle s'allume, et dans quelle teinte, se décide dans le shader (softenFar)
	for(let i=0;i<8;i++) for(let j=0;j<4;j++){
		x.fillStyle = "#ffffff";
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
export function softenFar(mat, nightU){
	mat.onBeforeCompile = sh => {
		if(nightU){ sh.uniforms.uNight = nightU; sh.uniforms.uTime = TIME; sh.fragmentShader = "uniform float uNight; uniform float uTime;\n" + sh.fragmentShader; }
		sh.fragmentShader = sh.fragmentShader
			.replace("#include <map_fragment>", `float farBias = ${MIP_BIAS.toFixed(2)} * smoothstep( ${BIAS_NEAR.toFixed(1)}, ${BIAS_FAR.toFixed(1)}, length( vViewPosition ) );
#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv, farBias );
	diffuseColor *= sampledDiffuseColor;
#endif`)
			.replace("#include <emissivemap_fragment>", `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv, farBias );
	totalEmissiveRadiance *= emissiveColor.rgb;
	${nightU ? `#if defined( USE_MAP ) && defined( USE_COLOR )
	{ // chaque fenêtre de chaque bâtiment (la teinte du bâtiment sert de graine) : allumée ou non, et sa couleur
	  vec2 cell = floor( vMapUv + 0.001 );
	  float bh = dot( vColor, vec3( 91.7, 37.3, 13.1 ) );
	  float h1 = fract( sin( dot( cell, vec2( 12.9898, 78.233 ) ) + bh )*43758.5453 );
	  float h2 = fract( h1*7.31 + 0.17 ), h3 = fract( h1*13.7 + 0.53 );
	  float on = step( h1*0.92 + 0.04, uNight*0.56 );
	  // une fenêtre sur dix change d'état de temps en temps (quelqu'un rentre, quelqu'un se couche)
	  if( h2 < 0.1 ){ float per = 25.0 + h3*55.0; on = step( 0.45, fract( sin( floor( ( uTime + h1*300.0 )/per ) + h1*91.0 )*43758.5453 ) )*step( 0.05, uNight ); }
	  vec3 col = h3 < 0.55 ? vec3( 1.0, 0.7, 0.36 ) : ( h3 < 0.8 ? vec3( 1.0, 0.85, 0.6 ) : ( h3 < 0.93 ? vec3( 0.8, 0.88, 1.0 )
	           : vec3( 0.42, 0.58, 1.0 )*( 0.7 + 0.3*sin( uTime*9.0 + h1*40.0 )*sin( uTime*3.7 + h1*5.0 ) ) ) );          // écran de télévision
	  totalEmissiveRadiance *= col*on; }
	#endif` : ""}
#endif`);
	};
	mat.customProgramCacheKey = () => nightU ? "softenFar|night2" : "softenFar";
}

/* ---------- accumulateurs de géométrie ---------- */
function bucket(){ return { pos:[], nor:[], uv:[], col:[] }; }
let TINT = [1, 1, 1];
function tri(B, a, b, c, n, ua=[0,0], ub=[0,0], uc=[0,0]){
	const e1x=b[0]-a[0], e1y=b[1]-a[1], e1z=b[2]-a[2], e2x=c[0]-a[0], e2y=c[1]-a[1], e2z=c[2]-a[2];
	const cx=e1y*e2z-e1z*e2y, cy=e1z*e2x-e1x*e2z, cz=e1x*e2y-e1y*e2x;
	if(cx*n[0] + cy*n[1] + cz*n[2] < 0){ [b,c] = [c,b]; [ub,uc] = [uc,ub]; }
	B.pos.push(...a,...b,...c); B.nor.push(...n,...n,...n); B.uv.push(...ua,...ub,...uc); B.col.push(...TINT,...TINT,...TINT);
}
function toGeo(B){
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3));
	g.setAttribute("normal", new THREE.Float32BufferAttribute(B.nor, 3));
	g.setAttribute("uv", new THREE.Float32BufferAttribute(B.uv, 2));
	g.setAttribute("color", new THREE.Float32BufferAttribute(B.col, 3));
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
export function polyDist(x, z, p){ let d = 1e9; for(let i=0, j=p.length-1; i<p.length; j=i++) d = Math.min(d, segDist(x, z, p[j][0], p[j][1], p[i][0], p[i][1])); return d; }
let SITE = null;
function site(MAP){
	if(SITE && SITE.MAP === MAP) return SITE;
	const polys = MAP.buildings.map(r => { const f = r[4], p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); const xs = p.map(q => q[0]), zs = p.map(q => q[1]); return { p, bb:[Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] }; });
	const rect = o => { const c = Math.cos(o.ang), s = Math.sin(o.ang), L = o.L/2 + 1, D = o.D/2 + 1; return [[-L,-D],[L,-D],[L,D],[-L,D]].map(([a,b]) => [o.x + a*c - b*s, o.z + a*s + b*c]); };
	const hand = [MAP.ha && rect(MAP.ha), MAP.falise && rect(MAP.falise)].filter(Boolean);
	if(MAP.blan){ const f = MAP.blan.pts, p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); hand.push(p); }
	for(const f of MAP.hand || []) hand.push(ring(f));          // emprises faites main d'un autre quartier (Wenov…)
	const waterPolys = (MAP.water || []).map(ring);
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
	// grille de 8 × 8 pour les tronçons de rue : on ne mesure que les rues proches (au-delà de 8 m, « pas de rue »)
	const RG = 8, rgrid = new Map();
	MAP.roads.forEach(([w, , p]) => { for(let i=0;i+3<p.length;i+=2){
		const s = [w, p[i], p[i+1], p[i+2], p[i+3]], m = w/2;
		for(let a = Math.floor((Math.min(p[i], p[i+2]) - m)/RG); a <= Math.floor((Math.max(p[i], p[i+2]) + m)/RG); a++)
			for(let b = Math.floor((Math.min(p[i+1], p[i+3]) - m)/RG); b <= Math.floor((Math.max(p[i+1], p[i+3]) + m)/RG); b++){ const kk = key(a, b); if(!rgrid.has(kk)) rgrid.set(kk, []); rgrid.get(kk).push(s); }
	} });
	const roadGap = (x, z) => {
		let g = 1e9, best = null; const ca = Math.floor(x/RG), cb = Math.floor(z/RG);
		for(let a = ca - 1; a <= ca + 1; a++) for(let b = cb - 1; b <= cb + 1; b++) for(const s of rgrid.get(key(a, b)) || []){
			const d = segDist(x, z, s[1], s[2], s[3], s[4]) - s[0]/2; if(d < g){ g = d; best = s; }
		}
		return { g, best };
	};
	const inWater = (x, z) => (MAP.canals || []).some(p => { for(let i=0;i+3<p.length;i+=2) if(segDist(x, z, p[i], p[i+1], p[i+2], p[i+3]) < 5.6) return true; return false; })
		|| waterPolys.some(p => pointInPoly(x, z, p) || polyDist(x, z, p) < 1);
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
/* Toit à pans brisés (mansarde lilloise) sur une emprise quelconque : le pourtour est rentré de d vers l'intérieur
   (sommets en onglet). Renvoie null si l'emprise est trop étroite ou trop découpée pour ce retrait. */
function insetRing(p, d){
	const n = p.length, q = [];
	if(n > 40) return null;
	for(let i=0;i<n;i++){
		const a = p[(i+n-1)%n], b = p[i], c = p[(i+1)%n];
		const l1 = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, l2 = Math.hypot(c[0]-b[0], c[1]-b[1]) || 1;
		const n1x = -(b[1]-a[1])/l1, n1z = (b[0]-a[0])/l1, n2x = -(c[1]-b[1])/l2, n2z = (c[0]-b[0])/l2;
		const k = 1 + n1x*n2x + n1z*n2z;
		if(k < .35) return null;                                    // angle trop aigu
		q.push([b[0] + d*(n1x + n2x)/k, b[1] + d*(n1z + n2z)/k]);
	}
	// chaque côté garde son sens, et le contour rentré ne se recoupe pas
	for(let i=0;i<n;i++){ const a = p[i], b = p[(i+1)%n], qa = q[i], qb = q[(i+1)%n]; if((b[0]-a[0])*(qb[0]-qa[0]) + (b[1]-a[1])*(qb[1]-qa[1]) <= 0) return null; }
	if(signedArea(q) < .5) return null;
	const cross = (a, b, c) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
	for(let i=0;i<n;i++) for(let j=i+2;j<n;j++){
		if(i === 0 && j === n-1) continue;
		const a = q[i], b = q[i+1], c = q[j], e = q[(j+1)%n];
		if(cross(a,b,c)*cross(a,b,e) < 0 && cross(c,e,a)*cross(c,e,b) < 0) return null;
	}
	return q;
}
/* Emprise poussée vers l'extérieur de quelques centimètres : deux bâtiments dont les emprises se chevauchent
   (OpenStreetMap et BD TOPO) n'ont plus de murs exactement dans le même plan, qui « scintillaient » en se disputant les pixels. */
function nudgeRing(p, d){
	const n = p.length;
	return p.map((b, i) => {
		const a = p[(i+n-1)%n], c = p[(i+1)%n];
		const l1 = Math.hypot(b[0]-a[0], b[1]-a[1]) || 1, l2 = Math.hypot(c[0]-b[0], c[1]-b[1]) || 1;
		const n1x = (b[1]-a[1])/l1, n1z = -(b[0]-a[0])/l1, n2x = (c[1]-b[1])/l2, n2z = -(c[0]-b[0])/l2;
		const k = Math.max(.35, 1 + n1x*n2x + n1z*n2z);
		return [b[0] + d*(n1x + n2x)/k, b[1] + d*(n1z + n2z)/k];
	});
}
function addBuilding(Bw, Br, Bf, rec, i=0, extras=null){
	const [kind, lv, , roof, flat] = rec;
	const rh = rec.length > 5 ? rec[5] : -1;         // hauteur réelle du toit (BD TOPO) ; -1 : inconnue
	let p = ring(flat);
	if(signedArea(p) < 0) p = p.reverse();
	p = nudgeRing(p, rec.inset ? -.15 : .01 + ((i*.618034) % 1)*.04);      // de 1 à 5 cm, différent d'un bâtiment à l'autre (15 cm en retrait : voir overlapFix)
	// léger décalage par bâtiment : deux toits voisins ne sont jamais au même niveau (pas de clignotement)
	const k = FHc/FH, H = (kind === 3 ? lv*3.2*k : kind === 6 ? 2.2*k : kind === 4 ? lv*FHc*1.35 : kind === 7 ? lv*FHc*1.25 : lv*FHc) + (i % 7)*.035;
	let mans = null;
	if(!roof && rh > 0) for(const d of [rh*.5, rh*.32, rh*.2]) if(d >= .3 && (mans = insetRing(p, d))){ mans.d = d; break; }
	const flatRoof = !roof && !mans && kind !== 5;
	const tr = mulberry32(i*131 + 17), wv = .9 + tr()*.17, wh = (tr() - .5)*.05;
	const wallTint = [wv*(1 + wh), wv, wv*(1 - wh)], rv = .84 + tr()*.3, roofTint = [rv*(1 + (tr() - .5)*.08), rv, rv*(1 + (tr() - .5)*.1)];
	TINT = wallTint;
	let per = (rec[2]*3.7) % 5;
	for(let i=0;i<p.length;i++){
		const a = p[i], b = p[(i+1)%p.length];
		const dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx, dz);
		if(len < .01) continue;
		const n = [dz/len, 0, -dx/len];
		const bay = BAY*FHc/FH, u0 = per/bay, u1 = (per+len)/bay, v1 = H/FHc;
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
		const L2 = L/2, D2 = D/2 + eave, rh = rec.length > 5 && rec[5] > 0 ? Math.min(rec[5], D*.75) : Math.min(D*.55, 3.4);
		const P = (s, t, y) => [cx + ux*s + wx*t, y, cz + uz*s + wz*t];
		const e1 = P(-L2,-D2,H), e2 = P(L2,-D2,H), e3 = P(L2,D2,H), e4 = P(-L2,D2,H), r1 = P(-L2,0,H+rh), r2 = P(L2,0,H+rh);
		const nl = Math.hypot(rh, D2);
		TINT = roofTint;
		const n1 = [-wx*rh/nl, D2/nl, -wz*rh/nl], n2 = [wx*rh/nl, D2/nl, wz*rh/nl];
		tri(Br, e1, e2, r2, n1, [0,0], [L,0], [L,1]); tri(Br, e1, r2, r1, n1, [0,0], [L,1], [0,1]);
		tri(Br, e3, e4, r1, n2, [0,0], [L,0], [L,1]); tri(Br, e3, r1, r2, n2, [0,0], [L,1], [0,1]);
		const g1 = P(-L/2,-D/2,H), g4 = P(-L/2,D/2,H), q1 = P(-L/2,0,H+rh), g2 = P(L/2,-D/2,H), g3 = P(L/2,D/2,H), q2 = P(L/2,0,H+rh);
		const W = [.02,.02];
		TINT = wallTint;
		tri(Bw, g1, g4, q1, [-ux,0,-uz], W, W, W); tri(Bw, g2, g3, q2, [ux,0,uz], W, W, W);
		// dalle sous le toit : ferme l'emprise là où le toit rectangulaire ne la couvre pas (formes irrégulières, toit raccourci)
		capTris(Bf, p, H - .03, ([x,z]) => [x*.22, z*.22]);
	} else if(mans){
		// pans brisés tout autour, terrasson presque plat au sommet
		const d = mans.d, T = H + rh;
		TINT = roofTint;
		let per2 = 0;
		for(let k=0;k<p.length;k++){
			const a = p[k], b = p[(k+1)%p.length], qa = mans[k], qb = mans[(k+1)%p.length];
			const dx = b[0]-a[0], dz = b[1]-a[1], len = Math.hypot(dx, dz);
			if(len < .01) continue;
			const nx = dz/len, nz = -dx/len, nl = Math.hypot(rh, d);
			const nrm = [nx*rh/nl, d/nl, nz*rh/nl];
			const s = nl/1.6;
			tri(Br, [a[0],H,a[1]], [b[0],H,b[1]], [qb[0],T,qb[1]], nrm, [per2,0], [per2+len,0], [per2+len,s]);
			tri(Br, [a[0],H,a[1]], [qb[0],T,qb[1]], [qa[0],T,qa[1]], nrm, [per2,0], [per2+len,s], [per2,s]);
			per2 += len;
		}
		// terrasson : zinc gris (toit plat) dès qu'il est grand, dans la teinte du toit sur une petite maison
		TINT = [1, 1, 1];
		if(Math.abs(signedArea(mans)) > 20) capTris(Bf, mans, T, ([x,z]) => [x*.22, z*.22]);
		else { TINT = roofTint; capTris(Br, mans, T, ([x,z]) => [x*.5, z*.5]); }
	} else {
		TINT = roofTint;
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
	TINT = [1, 1, 1];
	return H;
}

export function buildCity(scene, MAP, opts={}){
	FHc = MAP.fh || FH;
	// niveaux corrigés d'après les hauteurs de l'IGN (js/hauteurs.js), seulement si le bâtiment est bien celui attendu
	if(MAP.ha) for(const [i, cx, cz, lv] of HAUTEURS){
		const f = MAP.buildings[i] && MAP.buildings[i][4]; if(!f) continue;
		let x = 0, z = 0; for(let k=0;k<f.length;k+=2){ x += f[k]; z += f[k+1]; }
		if(Math.hypot(x/(f.length/2) - cx, z/(f.length/2) - cz) < .05) MAP.buildings[i][1] = lv;
	}
	const out = { walls:[], roofs:[], flats:[], pois:{}, poiMats:{}, lampSpots:[], trees:[], parkTrees:[], ground:{}, nightU:{ value:0 } };
	const poiIndex = new Map(Object.entries(MAP.pois).filter(([,v]) => v && v.i !== undefined).map(([k,v]) => [v.i, k]));

	/* matériaux */
	const litHouse = litMap("house", 7), litCampus = litMap("campus", 11);
	const wallMat = (hex, style) => {
		const m = new THREE.MeshStandardMaterial({ map:facade(hex, style), roughness: style === "office" ? .38 : .92, metalness: style === "office" ? .25 : 0, emissive:"#ffffff", emissiveIntensity:0, emissiveMap: style === "house" ? litHouse : litCampus, vertexColors:true });
		softenFar(m, out.nightU);
		out.walls.push(m); return m;
	};
	const houseMats = HOUSE_WALLS.map(c => wallMat(c, "house"));
	// façades selon l'époque réelle (BD TOPO) : immeubles des années 1950-1980, bâtiments récents (créées au besoin)
	const eraMats = { 1:[], 2:[] };
	const eraMat = (style, col) => eraMats[style][col] || (eraMats[style][col] = wallMat(HOUSE_WALLS[col], style === 1 ? "modern" : "recent"));
	const campusMats = CAMPUS_WALLS.map(c => wallMat(c, "campus"));
	const sportMat = wallMat("#d8d2c6", "sport");
	const glassMat = wallMat("#cfe3e6", "glass");
	const officeMats = opts.offices ? ["#2f3b4a", "#d6d9dc", "#3b4656", "#c4c9ce"].map(c => wallMat(c, "office")) : [];
	// ardoises : des rangs doux dans le sens de la pente (sans trait fin, pour ne pas « fourmiller » de loin)
	const slateTex = (() => {
		const c = document.createElement("canvas"); c.width = 16; c.height = 128; const x = c.getContext("2d");
		x.fillStyle = "#ffffff"; x.fillRect(0, 0, 16, 128);
		for(let j=0; j<8; j++){ const g = x.createLinearGradient(0, j*16, 0, j*16 + 16); g.addColorStop(0, "rgba(0,0,0,.02)"); g.addColorStop(.75, "rgba(0,0,0,.09)"); g.addColorStop(1, "rgba(0,0,0,.16)"); x.fillStyle = g; x.fillRect(0, j*16, 16, 16); }
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1, 1.6); t.anisotropy = 4; return t;
	})();
	const roofMats = ROOFS.map(c => { const m = std(c, { roughness:.8, map:slateTex, vertexColors:true }); m.userData.base = c; out.roofs.push(m); return m; });
	const roofTex = (() => {
		const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
		x.fillStyle = "#ffffff"; x.fillRect(0,0,64,64);
		x.fillStyle = "rgba(0,0,0,.08)"; for(let i=0;i<64;i+=16) x.fillRect(i,0,2,64);
		x.fillStyle = "rgba(0,0,0,.05)"; for(let i=0;i<64;i+=32) x.fillRect(0,i,64,2);
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
	})();
	const flatMat = new THREE.MeshStandardMaterial({ color:"#8a857f", map:roofTex, roughness:.95, vertexColors:true }); flatMat.userData.base = "#8a857f"; out.flats.push(flatMat);
	// toits plats vus d'avion : gravier clair, gris, bitume sombre, végétalisé
	const flatMats = { 11:flatMat };
	for(const [k, c] of [[10, "#a8a39a"], [12, "#626369"], [13, "#7f8c5c"]]){ const m = flatMat.clone(); m.color.set(c); m.userData.base = c; out.flats.push(m); flatMats[k] = m; }
	const extras = [];
	const glassRoof = new THREE.MeshStandardMaterial({ color:"#d9eef0", transparent:true, opacity:.55, roughness:.1, metalness:.2, emissive:"#ffd08a", emissiveIntensity:0 });
	out.glassRoof = glassRoof;

	const groups = new Map();   // clé matériau -> { w, r, f }
	const get = (key) => { if(!groups.has(key)) groups.set(key, { w:bucket(), r:bucket(), f:bucket() }); return groups.get(key); };
	const spires = [], oldRoofs = [];
	const S = site(MAP); let flattened = 0; out.inBuilding = S.inBuilding; out.inHand = S.inHand; out.roadGap = S.roadGap; out.stats = { get flattened(){ return flattened; } };
	// deux emprises superposées pour un même immeuble (OpenStreetMap et BD TOPO) : murs et toits confondus, qui clignotent.
	// La plus petite disparaît si elle ne dépasse pas l'autre en hauteur ; plus haute, elle rentre de 15 cm.
	const overlapFix = new Map();
	{
		const P = MAP.buildings.map(r => { const f = r[4], p = []; for(let k=0;k<f.length;k+=2) p.push([f[k], f[k+1]]); const xs = p.map(q => q[0]), zs = p.map(q => q[1]); return { p, A:Math.abs(signedArea(p)), bb:[Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] }; });
		const G = 12, grid = new Map();
		P.forEach((o, k) => { for(let a = Math.floor(o.bb[0]/G); a <= Math.floor(o.bb[2]/G); a++) for(let b = Math.floor(o.bb[1]/G); b <= Math.floor(o.bb[3]/G); b++){ const kk = a*100003 + b; if(!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(k); } });
		const pairs = new Set();
		for(const list of grid.values()) for(const i of list) for(const j of list){
			if(j <= i || pairs.has(i*4096 + j)) continue; pairs.add(i*4096 + j);
			const A = P[i], B = P[j], x0 = Math.max(A.bb[0], B.bb[0]), x1 = Math.min(A.bb[2], B.bb[2]), z0 = Math.max(A.bb[1], B.bb[1]), z1 = Math.min(A.bb[3], B.bb[3]);
			if(x1 <= x0 || z1 <= z0) continue;
			const small = A.A < B.A ? i : j, big = small === i ? j : i;
			if(poiIndex.has(small)) continue;
			const st = Math.max(.25, Math.sqrt((x1 - x0)*(z1 - z0)/400)); let n = 0;
			for(let x = x0 + st/2; x < x1; x += st) for(let z = z0 + st/2; z < z1; z += st) if(pointInPoly(x, z, A.p) && pointInPoly(x, z, B.p)) n++;
			if(n*st*st < .6*P[small].A) continue;
			overlapFix.set(small, MAP.buildings[small][1] <= MAP.buildings[big][1] ? "drop" : "inset");
		}
		out.stats.overlaps = overlapFix.size;
	}
	MAP.buildings.forEach((rec, i) => {
		const fix = overlapFix.get(i);
		if(fix === "drop") return;
		if(fix === "inset"){ rec = rec.slice(); rec.inset = true; }
		// un toit à deux pentes ne doit ni mordre sur le voisin, ni laisser l'emprise à découvert
		// (sans place pour deux pentes, un toit de hauteur connue devient un toit à pans brisés)
		if(rec[3] && rec[0] !== 4){ const fit = S.roofFit(rec, i); if(!fit) flattened++; const inset = rec.inset; rec = rec.slice(); rec[3] = fit || 0; rec.inset = inset; }
		const [kind, , col] = rec, style = rec[6] || 0;
		if(opts.exclude){ const f = rec[4]; let cx = 0, cz = 0; for(let k=0;k<f.length;k+=2){ cx += f[k]; cz += f[k+1]; } if(opts.exclude(cx/(f.length/2), cz/(f.length/2))) return; }
		let wm;
		if(kind === 0 || kind === 2 || kind === 6) wm = houseMats[col % houseMats.length];
		else if(kind === 1) wm = campusMats[col % campusMats.length];
		else if(kind === 3) wm = sportMat;
		else if(kind === 7) wm = officeMats[col % officeMats.length] || campusMats[1];
		else if(kind === 4) wm = houseMats[0];
		else wm = glassMat;
		if(style && (kind === 0 || kind === 2)) wm = eraMat(style, col % HOUSE_WALLS.length);
		const real = ROOF_OF[rec[7]], seen = rec.length > 8 ? rec[8] : -1;
		const rm = seen >= 0 && seen < 8 ? roofMats[seen] : real ? roofMats[real[i % real.length]] : roofMats[(col + i) % (kind === 0 ? 4 : 2)];
		const fm = flatMats[seen] || flatMat;
		const poi = poiIndex.get(i);
		if(poi === "rizomm") wm = campusMats[0];
		if(poi){
			const G = { w:bucket(), r:bucket(), f:bucket() };
			const ex = [], H = addBuilding(G.w, G.r, G.f, rec, i, ex);
			const grp = new THREE.Group(); scene.add(grp);
			if(ex.length) roofKit(ex, grp);          // ses blocs techniques disparaissent avec lui s'il est remplacé
			const w2 = wm.clone(), r2 = rm.clone(), f2 = kind === 5 ? glassRoof : flatMat.clone();
			softenFar(w2, out.nightU);
			out.walls.push(w2); out.roofs.push(r2); if(f2 !== glassRoof) out.flats.push(f2);
			for(const [B, m] of [[G.w, w2], [G.r, r2], [G.f, f2]]){ if(!B.pos.length) continue; const me = new THREE.Mesh(toGeo(B), m); me.castShadow = me.receiveShadow = true; grp.add(me); }
			out.pois[poi] = { group:grp, H, mats:[w2, r2, f2] };
			return;
		}
		const g = get(wm.uuid + "|" + rm.uuid + "|" + fm.uuid);
		g.wm = wm; g.rm = rm; if(fm !== flatMat) g.fm = fm;
		const H = addBuilding(g.w, g.r, (kind === 5 ? get("glassroof").f : g.f), rec, i, extras);
		// maison ancienne à deux pentes : cheminées aux murs mitoyens, lucarnes côté rue
		if(kind === 0 && rec[3] && !(rec[6] > 0)) oldRoofs.push([rec[3], H, rec.length > 5 && rec[5] > 0 ? Math.min(rec[5], rec[3][4]*.75) : Math.min(rec[3][4]*.55, 3.4), i]);
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
		// lucarnes et cheminées des toits anciens (maisons lilloises), instanciées
		const lucBody = [], lucRoof = [], chim = [];
		for(const [[cx, cz, ang, L, D, eave = .25], H, rh, i] of oldRoofs){
			const r = mulberry32(i*977 + 5), ux = Math.cos(ang), uz = Math.sin(ang), wx = -uz, wz = ux, D2 = D/2;
			const top = H + rh;
			// cheminées : au faîtage, à un bout ou aux deux (murs mitoyens)
			for(const e of r() < .55 ? [-1, 1] : [r() < .5 ? -1 : 1]) chim.push([cx + ux*e*(L/2 - .3), top - .35, cz + uz*e*(L/2 - .3), ang]);
			// lucarnes : sur le pan qui regarde la rue la plus proche
			if(L < 1.8 || rh < 1) continue;
			const side = S.roadGap(cx + wx*(D2 + 2), cz + wz*(D2 + 2)).g < S.roadGap(cx - wx*(D2 + 2), cz - wz*(D2 + 2)).g ? 1 : -1;
			const n = Math.min(3, Math.max(1, Math.floor(L/2.3))), t = D2*.52, y = H + rh*(1 - t/D2) - .15;
			for(let k=0;k<n;k++){
				if(n > 1 && r() < .2) continue;
				const s = (k - (n - 1)/2)*(L/n);
				lucBody.push([cx + ux*s + wx*t*side, y, cz + uz*s + wz*t*side, ang + (side > 0 ? 0 : Math.PI)]);
			}
		}
		const dO = new THREE.Object3D();
		const inst = (geo, mat, list, sc) => {
			const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
			list.forEach(([x, y, z, a], k) => { dO.position.set(x, y, z); dO.rotation.set(0, -a, 0); dO.scale.set(...sc); dO.updateMatrix(); m.setMatrixAt(k, dO.matrix); });
			m.count = list.length; m.castShadow = m.receiveShadow = true; scene.add(m); return m;
		};
		// lucarne : façade claire avec sa fenêtre (repère local : x le long du faîtage, z vers la rue)
		const lb = new THREE.BoxGeometry(.85, .95, 1).translate(0, .47, -.1);
		const lw = new THREE.BoxGeometry(.5, .6, .04).translate(0, .45, .41);
		const lr = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-.55, 0), new THREE.Vector2(.55, 0), new THREE.Vector2(0, .5)]), { depth:1.15, bevelEnabled:false }).translate(0, .93, -.67);
		const white = g => { g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1), 3)); return g; };
		inst(lb, std("#ece4d4"), lucBody, [1, 1, 1]);
		inst(lw, std("#3e4c5e", { roughness:.3 }), lucBody, [1, 1, 1]);
		inst(white(lr), roofMats[0], lucBody, [1, 1, 1]);
		inst(new THREE.BoxGeometry(.55, 1.25, .95).translate(0, .62, 0), std("#7d3f2f"), chim, [1, 1, 1]);
		inst(new THREE.BoxGeometry(.7, .12, 1.1).translate(0, 1.3, 0), std("#cfc5b5"), chim, [1, 1, 1]);
		out.stats.dormers = lucBody.length; out.stats.chimneys = chim.length;
	}
	roofKit(extras, scene);
	function roofKit(extras, parent){
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
		parent.add(unit, sky);
	}
	// ces formes n'ont pas de teinte par sommet : on leur en donne une neutre (matériaux en vertexColors)
	const white = g => { g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1), 3)); return g; };
	for(const [x,z,H] of spires){
		const s = new THREE.Mesh(white(new THREE.ConeGeometry(1.6, 13, 8).translate(0,6.5,0)), roofMats[0]);
		s.position.set(x, H, z); s.castShadow = true; scene.add(s);
		const b = new THREE.Mesh(white(new THREE.BoxGeometry(3.2, 4, 3.2).translate(0,2,0)), houseMats[0]);
		b.position.set(x, H - 1, z); b.castShadow = true; scene.add(b);
	}

	/* ---------- rues & trottoirs ---------- */
	/* Les couches du sol se recouvrent (pelouses, terrains, trottoirs, rues, eau) à quelques centimètres d'écart :
	   de loin, la carte graphique ne sait plus laquelle est devant et elles « scintillent ». On leur donne un ordre
	   explicite par décalage de profondeur, du dessous vers le dessus : quai, eau, trottoir, pelouse, terrain, rue, piéton (le sol est encore dessous). */
	const layer = (m, k) => { m.polygonOffset = true; m.polygonOffsetFactor = k; m.polygonOffsetUnits = k*2; return m; };
	const roadM = layer(std("#57525c", { flatShading:false, side:THREE.DoubleSide }), -1);
	const pedM = layer(std("#c9b9a1", { flatShading:false, side:THREE.DoubleSide }), -2);
	const walkM = layer(std("#cbc1b2", { flatShading:false, side:THREE.DoubleSide }), 2);
	out.ground.road = roadM; out.ground.ped = pedM; out.ground.walk = walkM;
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
	const lawnM = layer(std("#9cb257", { flatShading:false, side:THREE.DoubleSide }), 1); out.ground.lawn = lawnM;
	const pitchM = layer(std("#6fa35a", { flatShading:false, side:THREE.DoubleSide }), 0);
	const BL = bucket(), BPi = bucket();
	const rnd = mulberry32(42);
	for(const [code, flat] of MAP.greens){
		let p = ring(flat); if(p.length < 3) continue;
		capTris(code === 1 ? BPi : BL, p, code === 1 ? .062 : .05, () => [0,0]);
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
	const waterM = layer(std("#6e9aa4", { roughness:.07, metalness:.18, envMapIntensity:1.45, flatShading:false, side:THREE.DoubleSide }), 4);          // très lisse : le ciel, le soleil et la lune s'y reflètent
	const quayM = layer(std("#cbbfae", { flatShading:false, side:THREE.DoubleSide }), 5);          // sous l'eau (le quai est plus large que le plan d'eau)
	out.ground.water = waterM;
	const BQ = bucket(), BWa = bucket();
	for(const pts of MAP.canals){ ribbon(BQ, pts, 10.5, .025); ribbon(BWa, pts, 8, .045); }
	for(const f of MAP.water || []) capTris(BWa, ring(f), .02, () => [0,0]);      // rivière en surfaces (la Deûle large)
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
	/* night : booléen, ou de 0 (jour) à 1 (nuit) pendant une transition : les fenêtres s'allument une à une */
	const waterDay = new THREE.Color("#6e9aa4"), waterNight = new THREE.Color("#2c3f5c");
	out.setNight = night => {
		const k = +night; out.nightU.value = k;
		for(const m of out.walls) m.emissiveIntensity = k > 0 ? 1.25 : 0;
		glassRoof.emissiveIntensity = .8*k;
		waterM.color.lerpColors(waterDay, waterNight, k);
	};
	return out;
}
