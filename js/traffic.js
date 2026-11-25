/* Circulation : des voitures roulent sur la voie de droite des rues carrossables (OpenStreetMap), changent de rue aux
   carrefours, allument leurs phares la nuit ; des cyclistes longent le trottoir. Tout est instancié (quelques appels de
   dessin) ; le nombre suit la qualité graphique. Ni ombre portée (la carte d'ombres est figée), mais une ombre douce au sol. */
import * as THREE from "three";
import { std } from "./kit.js?v=af8698b034";

const nk = (x, z) => Math.round(x*2) + "," + Math.round(z*2);

export function createTraffic(scene, MAP, { cars = 46, bikes = 14, seed = 9 } = {}){
	let s = seed; const rnd = () => (s = (s*16807) % 2147483647)/2147483647;
	// le réseau : chaque rue carrossable avec ses longueurs cumulées, et les rues qui se touchent à chaque nœud
	const roads = [], at = new Map();
	MAP.roads.forEach(([w, code, p]) => {
		if(code === 1 || w < 2.4 || p.length < 4) return;
		const pts = []; for(let i=0;i<p.length;i+=2) pts.push([p[i], p[i+1]]);
		const cum = [0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]));
		if(cum[cum.length-1] < 6) return;
		const r = { w, pts, cum, L:cum[cum.length-1], a:nk(...pts[0]), b:nk(...pts[pts.length-1]) };
		roads.push(r);
		for(const k of [r.a, r.b]){ if(!at.has(k)) at.set(k, []); at.get(k).push(r); }
	});
	const pose = (r, d) => {
		d = Math.max(0, Math.min(r.L, d));
		let i = 1; while(i < r.cum.length - 1 && r.cum[i] < d) i++;
		const a = r.pts[i-1], b = r.pts[i], l = (r.cum[i] - r.cum[i-1]) || 1, t = (d - r.cum[i-1])/l;
		return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, (b[0]-a[0])/l, (b[1]-a[1])/l];
	};
	const spawn = (o, lane) => {
		o.r = roads[Math.floor(rnd()*roads.length)]; o.dir = rnd() < .5 ? 1 : -1; o.d = rnd()*o.r.L; o.lane = lane;
	};
	const next = o => {
		const end = o.dir > 0 ? o.r.b : o.r.a, opts = (at.get(end) || []).filter(q => q !== o.r);
		if(!opts.length){ o.dir = -o.dir; return; }          // impasse : demi-tour
		const q = opts[Math.floor(rnd()*opts.length)];
		o.r = q; o.dir = q.a === end ? 1 : -1; o.d = o.dir > 0 ? 0 : q.L;
	};
	if(!roads.length) return { update(){}, setLevel(){}, setNight(){}, meshes:[] };

	const PAL = ["#e9e9ea", "#8b9096", "#2d3138", "#6f1f22", "#22324f", "#c9c4b8", "#4f5a4a", "#b8bcc2", "#1f1f22", "#a33a2c"];
	const carList = Array.from({ length:cars }, () => { const o = { v:2.6 + rnd()*1.2, c:PAL[Math.floor(rnd()*PAL.length)] }; spawn(o, .28); return o; });
	const bikeList = Array.from({ length:bikes }, () => { const o = { v:1.1 + rnd()*.4 }; spawn(o, .44); return o; });

	const shadowMat = new THREE.MeshBasicMaterial({ color:"#1d1622", transparent:true, opacity:.26, depthWrite:false });
	const IM = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true; scene.add(m); return m; };
	const body = IM(new THREE.BoxGeometry(.74, .3, 1.75).translate(0, .3, 0), std("#ffffff", { roughness:.35, metalness:.25, flatShading:false }), cars);
	const cab = IM(new THREE.BoxGeometry(.64, .25, .95).translate(0, .57, -.08), std("#26303c", { roughness:.12, metalness:.2, flatShading:false }), cars);
	const lightsF = IM(new THREE.BoxGeometry(.6, .07, .02).translate(0, .33, .88), std("#fff6e0", { emissive:"#ffe2a8", emissiveIntensity:0 }), cars);
	const lightsR = IM(new THREE.BoxGeometry(.6, .07, .02).translate(0, .33, -.88), std("#7a1414", { emissive:"#ff2a1a", emissiveIntensity:.15 }), cars);
	const shade = IM(new THREE.PlaneGeometry(.95, 2).rotateX(-Math.PI/2).translate(0, .085, 0), shadowMat, cars + bikes);
	const bikeG = IM(new THREE.BoxGeometry(.06, .34, .7).translate(0, .2, 0), std("#2b2b2e"), bikes);
	const rider = IM(new THREE.CapsuleGeometry(.14, .34, 3, 8).translate(0, .66, -.04), std("#ffffff", { flatShading:false }), bikes);
	const head = IM(new THREE.SphereGeometry(.11, 8, 6).translate(0, 1.02, -.02), std("#e0ac84", { flatShading:false }), bikes);
	const col = new THREE.Color(), RIDER = ["#c9675a", "#2f6f8f", "#d9a441", "#3d7a55", "#1e305e", "#8a2b4e"];
	carList.forEach((o, i) => body.setColorAt(i, col.set(o.c)));
	bikeList.forEach((o, i) => rider.setColorAt(i, col.set(RIDER[i % RIDER.length])));

	const d = new THREE.Object3D(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
	let nCars = cars, nBikes = bikes;
	const place = (o, y = 0) => {
		const [x, z, tx, tz] = pose(o.r, o.d), sx = tx*o.dir, sz = tz*o.dir, off = o.r.w*o.lane;
		d.position.set(x - sz*off, y, z + sx*off); d.rotation.set(0, Math.atan2(sx, sz), 0); d.updateMatrix();
		return d.matrix;
	};
	function update(dt){
		dt = Math.min(dt, .1);
		carList.forEach((o, i) => {
			if(i >= nCars){ for(const m of [body, cab, lightsF, lightsR, shade]) m.setMatrixAt(i, ZERO); return; }
			o.d += o.v*dt*o.dir;
			if(o.d > o.r.L || o.d < 0) next(o);
			const M = place(o);
			for(const m of [body, cab, lightsF, lightsR, shade]) m.setMatrixAt(i, M);
		});
		bikeList.forEach((o, i) => {
			const k = cars + i;
			if(i >= nBikes){ for(const m of [bikeG, rider, head]) m.setMatrixAt(i, ZERO); shade.setMatrixAt(k, ZERO); return; }
			o.d += o.v*dt*o.dir;
			if(o.d > o.r.L || o.d < 0) next(o);
			const M = place(o);
			for(const m of [bikeG, rider, head]) m.setMatrixAt(i, M);
			d.scale.set(.45, 1, .45); d.updateMatrix(); shade.setMatrixAt(k, d.matrix); d.scale.set(1, 1, 1);
		});
		for(const m of [body, cab, lightsF, lightsR, shade, bikeG, rider, head]) m.instanceMatrix.needsUpdate = true;
	}
	return {
		update,
		meshes:[body, cab, lightsF, lightsR, shade, bikeG, rider, head],
		setLevel(k){ nCars = Math.round(cars*k); nBikes = Math.round(bikes*k); },
		setNight(k){ lightsF.material.emissiveIntensity = 2.4*k; lightsR.material.emissiveIntensity = .15 + 1.6*k; },
		setVisible(v){ for(const m of [body, cab, lightsF, lightsR, shade, bikeG, rider, head]) m.visible = v; }
	};
}
