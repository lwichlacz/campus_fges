/* Repères du quartier : plaques de rue lilloises aux carrefours, jalonnement « M » du campus jusqu'aux stations,
   et les lieux réels (boulangeries, cafés, pharmacies…) en petites étiquettes qui apparaissent de près.
   Chaque famille est dessinée en un seul maillage (atlas de textes) pour rester légère. */
import * as THREE from "three";
import { std } from "./kit.js?v=cc2a4e3c29";

const FONT = `"Inter", "Helvetica Neue", Arial, sans-serif`;

/* Atlas : une grande toile découpée en cases ; draw(ctx, i, x, y, w, h) dessine la case i. */
function atlas(n, cw, ch, draw){
	const cols = Math.floor(2048/cw), rows = Math.ceil(n/cols);
	const c = document.createElement("canvas"); c.width = 2048; c.height = THREE.MathUtils.ceilPowerOfTwo(Math.max(ch, rows*ch));
	const x = c.getContext("2d");
	for(let i=0;i<n;i++) draw(x, i, (i % cols)*cw, Math.floor(i/cols)*ch, cw, ch);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
	const uv = i => { const u0 = (i % cols)*cw/c.width, v0 = 1 - (Math.floor(i/cols) + 1)*ch/c.height; return [u0, v0, u0 + cw/c.width, v0 + ch/c.height]; };
	return { tex:t, uv };
}
function fit(x, text, max, size, weight = 700){
	let s = size; x.font = `${weight} ${s}px ${FONT}`;
	while(x.measureText(text).width > max && s > 14){ s -= 2; x.font = `${weight} ${s}px ${FONT}`; }
	if(x.measureText(text).width > max){ while(text.length > 4 && x.measureText(text + "…").width > max) text = text.slice(0, -1); text += "…"; }
	return text;
}
function rrect(x, a, b, w, h, r){ x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

/* quadrilatère vertical (deux faces lisibles) dans un tampon de géométrie */
function plate(B, cx, y, cz, dx, dz, w, h, uv){
	const hx = dx*w/2, hz = dz*w/2, nx = -dz, nz = dx;
	const [u0, v0, u1, v1] = uv;
	for(const side of [1, -1]){
		const ax = cx - hx*side, az = cz - hz*side, bx = cx + hx*side, bz = cz + hz*side;     // la face arrière est lue de l'autre côté
		const o = nx*.02*side, p = nz*.02*side;
		const P = [[ax+o, y, az+p], [bx+o, y, bz+p], [bx+o, y+h, bz+p], [ax+o, y+h, az+p]];
		const U = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
		for(const k of [0, 1, 2, 0, 2, 3]){ B.p.push(...P[k]); B.n.push(nx*side, 0, nz*side); B.u.push(...U[k]); }
	}
}
function toMesh(B, mat){
	const g = new THREE.BufferGeometry();
	g.setAttribute("position", new THREE.Float32BufferAttribute(B.p, 3));
	g.setAttribute("normal", new THREE.Float32BufferAttribute(B.n, 3));
	g.setAttribute("uv", new THREE.Float32BufferAttribute(B.u, 2));
	g.computeBoundingSphere();
	return new THREE.Mesh(g, mat);
}

export function buildLandmarks(scene, MAP, { inBuilding = () => false, inHand = () => false, roadGap = () => ({ g:9 }), home = [0, 6] } = {}){
	const free = (x, z, m) => !inBuilding(x, z, m) && roadGap(x, z).g > .25;          // sur un trottoir, ni dans un mur ni sur une chaussée
	const out = { group:new THREE.Group(), mats:[] };
	scene.add(out.group);
	const posts = [];          // [x, z, hauteur]

	/* ---------- plaques de rue (émail bleu, lettres blanches) ---------- */
	const names = MAP.streets || [];
	if(names.length){
		const A = atlas(names.length, 512, 112, (x, i, a, b, w, h) => {
			x.fillStyle = "#1d3f78"; rrect(x, a + 4, b + 6, w - 8, h - 12, 14); x.fill();
			x.strokeStyle = "#f4f1e8"; x.lineWidth = 5; rrect(x, a + 14, b + 16, w - 28, h - 32, 8); x.stroke();
			x.fillStyle = "#f4f1e8"; x.textAlign = "center"; x.textBaseline = "middle";
			const t = fit(x, names[i], w - 60, 40);
			x.fillText(t, a + w/2, b + h/2 + 2);
		});
		const B = { p:[], n:[], u:[] }, placed = [];
		for(const r of MAP.roads){
			const [w, code, pts, ni] = r;
			if(ni == null || ni < 0) continue;
			let len = 0; for(let i=0;i+3<pts.length;i+=2) len += Math.hypot(pts[i+2]-pts[i], pts[i+3]-pts[i+1]);
			if(len < 14) continue;
			// une plaque à chaque bout du tronçon, côté droit en entrant (comme à l'angle des maisons)
			for(const [i0, sgn] of [[0, 1], [pts.length - 4, -1]]){
				const ax = pts[i0], az = pts[i0+1], bx = pts[i0+2], bz = pts[i0+3];
				const l = Math.hypot(bx - ax, bz - az); if(l < .5) continue;
				const dx = (bx - ax)/l, dz = (bz - az)/l;
				const ex = sgn > 0 ? ax : bx, ez = sgn > 0 ? az : bz;
				const nx = -dz*sgn, nz = dx*sgn;
				let px, pz, ok = false;
				for(const kk of [4, 6.5, 9]) for(const o of [1.25, .8]){
					if(ok || kk > l*.6 + 4) continue;
					const k = kk*sgn; px = ex + dx*k + nx*(w/2 + o); pz = ez + dz*k + nz*(w/2 + o);
					ok = free(px, pz, .15);
				}
				if(!ok) continue;
				if(placed.some(([x, z, n]) => n === ni && Math.hypot(x - px, z - pz) < 26)) continue;
				placed.push([px, pz, ni]);
				plate(B, px, 2.45, pz, dx, dz, 2.1, .46, A.uv(ni));
				posts.push([px, pz, 2.95]);
			}
		}
		const m = new THREE.MeshStandardMaterial({ map:A.tex, roughness:.45, metalness:.1, emissive:"#ffffff", emissiveMap:A.tex, emissiveIntensity:.08, transparent:true, alphaTest:.5 });
		out.mats.push(m); out.plates = m;
		const me = toMesh(B, m); me.castShadow = false; out.group.add(me);
		out.nPlates = placed.length;
	}

	/* ---------- jalonnement vers les stations de métro (ligne 2) ---------- */
	const W = MAP.walk, st = MAP.stations || [];
	if(W && W.n && st.length){
		const N = W.n.length/2, adj = Array.from({ length:N }, () => []);
		const nx_ = i => W.n[i*2], nz_ = i => W.n[i*2+1];
		for(let k=0;k<W.e.length;k+=3){ const a = W.e[k], b = W.e[k+1], d = Math.hypot(nx_(a) - nx_(b), nz_(a) - nz_(b)); adj[a].push([b, d]); adj[b].push([a, d]); }
		const nearest = (x, z) => { let best = 0, bd = 1e9; for(let i=0;i<N;i++){ const d = Math.hypot(nx_(i) - x, nz_(i) - z); if(d < bd){ bd = d; best = i; } } return best; };
		const path = (s, t) => {
			const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
			dist[s] = 0;
			for(;;){
				let u = -1, ud = Infinity; for(let i=0;i<N;i++) if(!done[i] && dist[i] < ud){ ud = dist[i]; u = i; }
				if(u < 0 || u === t) break; done[u] = 1;
				for(const [v, d] of adj[u]) if(dist[u] + d < dist[v]){ dist[v] = dist[u] + d; prev[v] = u; }
			}
			const p = []; for(let v = t; v >= 0; v = prev[v]) p.unshift(v);
			return p[0] === s ? p : [];
		};
		const A = atlas(st.length*3, 512, 112, (x, i, a, b, w, h) => {
			const s = st[Math.floor(i/3)], arrow = ["↑", "←", "→"][i % 3];
			x.fillStyle = "#f6f4ef"; rrect(x, a + 4, b + 6, w - 8, h - 12, 12); x.fill();
			x.fillStyle = "#d6213a"; rrect(x, a + 16, b + 18, h - 36, h - 36, 8); x.fill();
			x.fillStyle = "#fff"; x.font = `800 52px ${FONT}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("M", a + 16 + (h - 36)/2, b + h/2 + 3);
			x.fillStyle = "#1e2430"; x.textAlign = "left";
			const t = fit(x, s.name, w - h - 110, 38, 800); x.fillText(t, a + h + 2, b + h/2 + 2);
			x.font = `800 54px ${FONT}`; x.textAlign = "right"; x.fillText(arrow, a + w - 22, b + h/2 + 3);
		});
		const B = { p:[], n:[], u:[] }, from = nearest(...home);
		out.nSigns = 0; out.routes = {};
		st.forEach((s, si) => {
			const p = path(from, nearest(s.x, s.z));
			out.routes[s.id] = p.map(i => [nx_(i), nz_(i)]);          // l'itinéraire à pied (repris par la promenade en vue piéton)
			let last = -1e9, run = 0;
			for(let k=1;k<p.length-1;k++){
				const a = p[k-1], b = p[k], c = p[k+1];
				run += Math.hypot(nx_(b) - nx_(a), nz_(b) - nz_(a));
				if(adj[b].length < 3 || run - last < 30) continue;          // aux carrefours, au plus un panneau tous les 30 m environ
				const ix = nx_(b) - nx_(a), iz = nz_(b) - nz_(a), ox = nx_(c) - nx_(b), oz = nz_(c) - nz_(b);
				const il = Math.hypot(ix, iz) || 1, ol = Math.hypot(ox, oz) || 1;
				const cr = (ix*oz - iz*ox)/(il*ol), dt = (ix*ox + iz*oz)/(il*ol);
				const turn = dt > .7 ? 0 : (cr > 0 ? 2 : 1);          // repère du jeu : z vers le bas de l'écran, le produit en croix positif tourne à droite
				const dx = ix/il, dz = iz/il;
				// à droite avant le carrefour, face au marcheur
				let px = nx_(b) - dx*3.2 - dz*2.6, pz = nz_(b) - dz*3.2 + dx*2.6;
				if(!free(px, pz, .3)){ px = nx_(b) - dx*3.2 + dz*2.6; pz = nz_(b) - dz*3.2 - dx*2.6; if(!free(px, pz, .3)) continue; }
				plate(B, px, 2.9, pz, -dz, dx, 2.4, .52, A.uv(si*3 + turn));
				posts.push([px, pz, 3.45]);
				last = run; out.nSigns++;
			}
		});
		const m = new THREE.MeshStandardMaterial({ map:A.tex, roughness:.5, emissive:"#ffffff", emissiveMap:A.tex, emissiveIntensity:.1, transparent:true, alphaTest:.5 });
		out.mats.push(m); out.signs = m;
		const me = toMesh(B, m); me.castShadow = false; out.group.add(me);
	}

	/* ---------- les poteaux des plaques et des panneaux (instanciés) ---------- */
	if(posts.length){
		const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05, .06, 1, 6).translate(0, .5, 0), std("#3a3f47", { metalness:.4, roughness:.5 }), posts.length);
		const d = new THREE.Object3D();
		posts.forEach(([x, z, h], i) => { d.position.set(x, 0, z); d.scale.set(1, h, 1); d.updateMatrix(); pole.setMatrixAt(i, d.matrix); });
		pole.castShadow = true; out.group.add(pole);
	}

	/* ---------- lieux réels : étiquettes toujours face à la caméra, visibles de près ---------- */
	const P = MAP.places || [];
	if(P.length){
		// un commerce d'OpenStreetMap est souvent pointé au milieu de son immeuble : l'étiquette sort sur le trottoir le plus proche
		const walled = (x, z, m) => inBuilding(x, z, m) || inHand(x, z);
		const outside = (x, z) => {
			if(!walled(x, z, .5)) return [x, z];
			for(let r = 1; r <= 30; r += .75) for(let k = 0; k < 24; k++){
				const a = k/24*Math.PI*2, px = x + Math.cos(a)*r, pz = z + Math.sin(a)*r;
				if(!walled(px, pz, 1.2)) return [px, pz];
			}
			return [x, z];
		};
		const spots = P.map(([x, z]) => outside(x, z));

		// rues commerçantes : quatre lieux ou plus à moins de 9 m forment une bulle « 6 commerces »,
		// qui se déplie en étiquettes séparées quand on s'approche (moins de 34 m)
		const groups = [], inGroup = new Array(P.length).fill(-1);
		P.forEach((_, i) => {
			if(inGroup[i] >= 0) return;
			const near = P.map((_, j) => j).filter(j => inGroup[j] < 0 && Math.hypot(spots[j][0] - spots[i][0], spots[j][1] - spots[i][1]) < 9);
			if(near.length < 4) return;
			near.forEach(j => inGroup[j] = groups.length);
			groups.push(near);
		});
		const labels = [
			...P.map((p, i) => ({ draw:"place", i, x:spots[i][0], y:3.4, z:spots[i][1], mode:inGroup[i] >= 0 ? 1 : 0 })),
			...groups.map(g => ({ draw:"group", g, x:g.reduce((s, j) => s + spots[j][0], 0)/g.length, y:4.2, z:g.reduce((s, j) => s + spots[j][1], 0)/g.length, mode:2 }))
		];
		// deux étiquettes voisines (bulle dépliée comprise) s'empilent au lieu de se recouvrir
		const placed = [];
		for(const l of labels.filter(l => l.mode < 2)){
			while(placed.some(o => Math.hypot(o.x - l.x, o.z - l.z) < 7 && Math.abs(o.y - l.y) < 1.1)) l.y += 1.15;
			placed.push(l);
		}
		const A = atlas(labels.length, 512, 96, (x, k, a, b, w, h) => {
			const L = labels[k];
			x.fillStyle = L.draw === "group" ? "rgba(30,48,94,.94)" : "rgba(255,252,246,.94)"; rrect(x, a + 4, b + 8, w - 8, h - 16, (h - 16)/2); x.fill();
			x.strokeStyle = "rgba(30,36,48,.18)"; x.lineWidth = 3; x.stroke();
			x.textBaseline = "middle"; x.textAlign = "left";
			if(L.draw === "group"){
				const icons = [...new Set(L.g.map(j => P[j][2]))].slice(0, 4);
				x.font = `38px ${FONT}`; icons.forEach((ic, n) => x.fillText(ic, a + 20 + n*44, b + h/2 + 2));
				x.fillStyle = "#fff8ec"; x.font = `800 34px ${FONT}`;
				x.fillText(`${L.g.length} commerces`, a + 32 + icons.length*44, b + h/2 + 2);
			} else {
				const [, , icon, name] = P[L.i];
				x.font = `44px ${FONT}`; x.fillText(icon, a + 22, b + h/2 + 2);
				x.fillStyle = "#1e2430";
				const t = fit(x, name, w - 110, 34, 700); x.fillText(t, a + 84, b + h/2 + 2);
			}
		});
		const quad = new THREE.PlaneGeometry(1, 1).translate(0, .5, 0);
		const geo = new THREE.InstancedBufferGeometry().copy(quad);
		const off = new Float32Array(labels.length*4), pos = new Float32Array(labels.length*3), mode = new Float32Array(labels.length);
		labels.forEach((l, k) => { off.set(A.uv(k), k*4); pos.set([l.x, l.y, l.z], k*3); mode[k] = l.mode; });
		geo.setAttribute("aUV", new THREE.InstancedBufferAttribute(off, 4));
		geo.setAttribute("aPos", new THREE.InstancedBufferAttribute(pos, 3));
		geo.setAttribute("aMode", new THREE.InstancedBufferAttribute(mode, 1));
		geo.instanceCount = labels.length;
		const m = new THREE.ShaderMaterial({
			uniforms:{ uMap:{ value:A.tex }, uNear:{ value:55 }, uFar:{ value:85 }, uDim:{ value:1 }, uSplit:{ value:34 }, uLum:{ value:1 } },
			vertexShader:`
				attribute vec4 aUV; attribute vec3 aPos; attribute float aMode; varying vec2 vUv; varying float vA;
				uniform float uNear, uFar, uSplit;
				void main(){
					vec4 mv = modelViewMatrix*vec4(aPos, 1.0);
					float d = -mv.z, s = clamp(d*.03, .55, 2.6);
					mv.xy += vec2((position.x)*s*5.3, position.y*s);
					vA = (1.0 - smoothstep(uNear, uFar, d))*smoothstep(4.0, 9.0, d);
					if(aMode > 1.5) vA *= smoothstep(uSplit - 2.0, uSplit + 3.0, d);          // la bulle, de loin
					else if(aMode > .5) vA *= 1.0 - smoothstep(uSplit - 3.0, uSplit + 2.0, d);  // ses étiquettes, de près
					vUv = vec2(mix(aUV.x, aUV.z, uv.x), mix(aUV.y, aUV.w, uv.y));
					gl_Position = projectionMatrix*mv;
				}`,
			fragmentShader:`
				uniform sampler2D uMap; uniform float uDim, uLum; varying vec2 vUv; varying float vA;
				void main(){
					vec4 c = texture2D(uMap, vUv); c.rgb *= uLum;
					c.a *= vA*uDim; if(c.a < .02) discard;
					gl_FragColor = c;
					#include <colorspace_fragment>
				}`,
			// toujours lisibles de près, même derrière un toit ou une lucarne (elles s'effacent au-delà de 85 m)
			transparent:true, depthWrite:false, depthTest:false
		});
		const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = 5;
		out.group.add(me); out.labels = m; out.nPlaces = P.length; out.nGroups = groups.length;

		// vitrines : sur la façade derrière chaque étiquette, éclairées la nuit
		const shops = [];
		P.forEach(([x0, z0], i) => {
			const [x, z] = spots[i];
			let dx = x0 - x, dz = z0 - z, l = Math.hypot(dx, dz);
			if(l < .3){          // lieu déjà sur le trottoir : la façade la plus proche, s'il y en a une à moins de 6 m
				let best = null;
				for(let k = 0; k < 16 && !best; k++) for(let r = .5; r <= 6; r += .5){ const a = k/16*Math.PI*2; if(walled(x + Math.cos(a)*r, z + Math.sin(a)*r, 0)){ if(!best || r < best[2]) best = [Math.cos(a), Math.sin(a), r]; break; } }
				if(!best) return; dx = best[0]; dz = best[1]; l = 1;
			}
			dx /= l; dz /= l;
			let r = 0; while(r < 12 && !walled(x + dx*r, z + dz*r, 0)) r += .1;
			if(r >= 12) return;
			while(r > 0 && walled(x + dx*(r - .01), z + dz*(r - .01), 0)) r -= .01;          // au centimètre près
			shops.push([x + dx*(r - .05), z + dz*(r - .05), Math.atan2(-dx, -dz)]);
		});
		if(shops.length){
			const vt = (() => { const c = document.createElement("canvas"); c.width = 128; c.height = 96; const x = c.getContext("2d");
				x.fillStyle = "#2a2e35"; x.fillRect(0, 0, 128, 96);
				const g = x.createLinearGradient(0, 8, 0, 92); g.addColorStop(0, "#ffe2a8"); g.addColorStop(1, "#d98f4e"); x.fillStyle = g; x.fillRect(6, 8, 116, 84);
				x.fillStyle = "rgba(90,60,40,.55)"; for(const y of [34, 60]) x.fillRect(10, y, 108, 4);
				for(let k = 0; k < 14; k++){ x.fillStyle = ["#b0624a", "#6d8c6a", "#5d7da0", "#c9a640"][k % 4]; x.fillRect(12 + k*7.6, 22, 5, 12); x.fillRect(14 + k*7.6, 48, 4, 12); }
				x.fillStyle = "#2a2e35"; x.fillRect(62, 8, 4, 84);
				const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
			const sm = new THREE.MeshStandardMaterial({ map:vt, emissive:"#ffffff", emissiveMap:vt, emissiveIntensity:.05, roughness:.3, color:"#8a8f96" });
			const vit = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.4, 1.7).translate(0, 1.15, 0), sm, shops.length), d = new THREE.Object3D();
			shops.forEach(([x, z, a], k) => { d.position.set(x, 0, z); d.rotation.set(0, a, 0); d.updateMatrix(); vit.setMatrixAt(k, d.matrix); });
			vit.receiveShadow = true; out.group.add(vit); out.shops = sm; out.nShops = shops.length;
		}
	}
	/* de nuit, plaques et panneaux restent lisibles (éclairage public) */
	out.setNight = k => {
		if(out.plates) out.plates.emissiveIntensity = .08 + .5*k;
		if(out.signs) out.signs.emissiveIntensity = .1 + .6*k;
		if(out.labels) out.labels.uniforms.uLum.value = 1 - .4*k;          // de nuit, pas d'étiquette éblouissante
		if(out.shops){ out.shops.emissiveIntensity = .05 + 1.3*k; out.shops.color.setScalar(.55 + .45*k); }          // vitrines allumées
	};
	return out;
}
