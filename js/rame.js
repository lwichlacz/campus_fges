/* L'intérieur d'une rame VAL de la ligne 2, pendant le trajet Vauban ⇄ Wenov.
   Vue depuis l'arrière de la voiture : sièges, barres, portes, plan de ligne lumineux, passagers variés,
   et la vitre frontale (le VAL roule sans conducteur) sur le tunnel. La rame marque l'arrêt à chaque station :
   sa vitesse s'annule pile au moment où le quai défile le long des vitres. */
import * as THREE from "three";
import { std, box, cyl, makePerson, mulberry32 } from "./kit.js?v=f5913cb4c8";

const LEN = 16, HW = 1.8, H = 3.1, GAP = 90;          // voiture : 16 × 3,6 ; 90 unités entre deux stations

function lineTex(){
	const c = document.createElement("canvas"); c.width = 1024; c.height = 120;
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
	return { c, t };
}
function paintLine({ c, t }, names, here, next){
	const x = c.getContext("2d"), n = names.length, x0 = 70, x1 = 954;
	x.fillStyle = "#11151d"; x.fillRect(0, 0, 1024, 120);
	x.fillStyle = "#d6213a"; x.fillRect(x0, 46, x1 - x0, 10);
	x.fillStyle = "#d6213a"; x.fillRect(14, 30, 40, 40); x.fillStyle = "#fff"; x.font = "bold 26px Arial"; x.textAlign = "center"; x.fillText("2", 34, 60);
	names.forEach((name, i) => {
		const px = x0 + (x1 - x0)*i/(n - 1);
		x.beginPath(); x.arc(px, 51, i === here ? 13 : 10, 0, 7); x.fillStyle = i < here ? "#d6213a" : i === here ? "#ffd28f" : "#11151d"; x.fill();
		x.lineWidth = 4; x.strokeStyle = i === next ? "#ffd28f" : "#d6213a"; x.stroke();
		x.fillStyle = i === next ? "#ffd28f" : i <= here ? "#ffffff" : "#9aa3b1"; x.font = `${i === next ? "bold " : ""}20px Arial`;
		x.fillText(name.replace(" – ", " - "), px, 94);
	});
	t.needsUpdate = true;
}
function platformTex(name){
	const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
	x.fillStyle = "#eef0ee"; x.fillRect(0, 0, 512, 128);
	x.fillStyle = "#d6213a"; x.fillRect(0, 86, 512, 10);
	x.fillStyle = "#2b3442"; x.fillRect(110, 24, 300, 42);
	x.fillStyle = "#fff"; x.font = `bold ${name.length > 20 ? 17 : 22}px Arial`; x.textAlign = "center"; x.fillText(name, 260, 52);
	const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(5, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createRame(){
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#0c0e13");
	const camera = new THREE.PerspectiveCamera(62, innerWidth/innerHeight, .1, 260);
	scene.add(new THREE.HemisphereLight("#fff6e6", "#3a3d45", 1.05));
	const lamp = new THREE.PointLight("#fff1d6", 22, 30, 1.6); lamp.position.set(0, 2.8, 0); scene.add(lamp);

	const car = new THREE.Group(); scene.add(car);
	const panel = std("#dfe2e6", { flatShading:false }), dark = std("#2b2f36", { flatShading:false }), steel = std("#b9bec6", { metalness:.6, roughness:.3, flatShading:false });
	const seatM = std("#2f5d8a", { flatShading:false }), seatM2 = std("#d6213a", { flatShading:false });
	const glass = new THREE.MeshStandardMaterial({ color:"#a9c2d0", transparent:true, opacity:.14, roughness:.05, metalness:.2, depthWrite:false });
	box(car, LEN, .12, HW*2, std("#5a5e66", { flatShading:false }), 0, -.12, 0, 0, false);              // plancher
	box(car, LEN, .12, HW*2, panel, 0, H, 0, 0, false);                                                // plafond
	for(const sx of [-.7, .7]) box(car, LEN - 1, .05, .35, std("#fff6e2", { emissive:"#fff1d0", emissiveIntensity:1.5, flatShading:false }), 0, H - .06, sx, 0, false);
	const DOORS = [-3.2, 3.2];
	for(const sz of [-1, 1]){
		const z = sz*HW;
		box(car, LEN, 1.05, .08, panel, 0, 0, z, 0, false);                                            // bas de caisse
		box(car, LEN, .75, .08, panel, 0, 2.35, z, 0, false);                                          // haut
		const win = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 1.3), glass); win.position.set(0, 1.7, z); win.rotation.y = sz > 0 ? Math.PI : 0; car.add(win);
		for(let x=-LEN/2; x<=LEN/2 + .01; x+=2) box(car, .12, 1.3, .1, dark, x, 1.05, z, 0, false);    // montants des vitres
		for(const dx of DOORS){
			box(car, 1.8, 2.25, .1, std("#c7ccd3", { flatShading:false }), dx, 0, z*.98, 0, false);   // portes
			box(car, .06, 2.25, .12, dark, dx, 0, z*.97, 0, false);
			const sig = new THREE.Mesh(new THREE.BoxGeometry(.5, .08, .05), std("#7fd1b9", { emissive:"#7fd1b9", emissiveIntensity:1.2 })); sig.position.set(dx, 2.42, z*.96); car.add(sig);
		}
		// sièges longitudinaux entre les portes et aux extrémités
		for(const [x0, x1] of [[-7.6, -4.4], [-2, 2], [4.4, 7.6]]){
			const L = x1 - x0, xc = (x0 + x1)/2;
			box(car, L, .5, .7, dark, xc, 0, z - sz*.42, 0, false);
			box(car, L, .14, .72, sz > 0 ? seatM : seatM2, xc, .5, z - sz*.44, 0, false);
			box(car, L, .7, .12, sz > 0 ? seatM : seatM2, xc, .62, z - sz*.12, 0, false);
		}
	}
	// barres de maintien
	for(const x of [-5.8, -3.2, 3.2, 5.8]) for(const z of [-1.05, 1.05]) cyl(car, .05, .05, H, steel, x, 0, z, 8);      // barres près des portes, l'allée reste dégagée
	for(const sz of [-.9, .9]){ const r = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, LEN - 1, 8).rotateZ(Math.PI/2), steel); r.position.set(0, 2.55, sz); car.add(r); }
	// avant de la rame : grande vitre frontale ; arrière (derrière la caméra) fermé
	box(car, .12, 1.0, HW*2, panel, -LEN/2, 0, 0, 0, false); box(car, .12, .55, HW*2, panel, -LEN/2, 2.6, 0, 0, false);
	const front = new THREE.Mesh(new THREE.PlaneGeometry(HW*2, 1.6), glass); front.position.set(-LEN/2, 1.8, 0); front.rotation.y = Math.PI/2; car.add(front);
	box(car, .12, H, HW*2, panel, LEN/2, 0, 0, 0, false);
	// plans de ligne lumineux au-dessus des portes
	const maps = [];
	for(const sz of [-1, 1]) for(const dx of DOORS){
		const L = lineTex(); maps.push(L);
		const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .3), new THREE.MeshBasicMaterial({ map:L.t }));
		m.position.set(dx, 2.78, sz*(HW - .1)); m.rotation.y = sz > 0 ? Math.PI : 0; car.add(m);
	}
	// passagers variés
	const r = mulberry32(44), riders = [];
	for(const [x, sz] of [[-6.6, 1], [-5.3, -1], [-1.2, 1], [.9, -1], [4.8, 1], [-.2, -1], [-7.1, -1]]){
		const p = makePerson(car, true); p.g.position.set(x, -.15, sz*(HW - .55)); p.g.rotation.y = sz > 0 ? Math.PI : 0; riders.push({ ...p, ph:r()*6 });
	}
	for(const [x, z, ry] of [[-3.2, .45, Math.PI/2], [2.6, -.55, -Math.PI/2], [-1.4, -.5, 2.6]]){
		const p = makePerson(car); p.g.position.set(x, 0, z); p.g.rotation.y = ry; riders.push({ ...p, ph:r()*6, standing:true });
	}

	/* le tunnel : tube sombre, lumières et anneaux qui défilent */
	const tube = new THREE.Mesh(new THREE.BoxGeometry(600, 5.2, 7.4), std("#1d2026", { side:THREE.BackSide, flatShading:false }));
	tube.position.y = 1.5; scene.add(tube);
	const lights = new THREE.Group(); scene.add(lights);
	const lightG = new THREE.BoxGeometry(.9, .14, .14), lightM = std("#ffd9a0", { emissive:"#ffcf8a", emissiveIntensity:2 });
	const ribM = std("#2c3038", { flatShading:false });
	for(let x=-240; x<=240; x+=8){
		for(const z of [-3.55, 3.55]){ const l = new THREE.Mesh(lightG, lightM); l.position.set(x, 2.6, z); lights.add(l); }
		const rib = new THREE.Mesh(new THREE.BoxGeometry(.25, 5.2, 7.4), ribM); rib.position.set(x + 4, 1.5, 0); rib.scale.set(1, 1, 1); lights.add(rib);
	}
	// les ribs pleins masqueraient la vue : on n'en garde que le pourtour
	lights.children.filter(o => o.geometry.parameters && o.geometry.parameters.height === 5.2).forEach(o => { o.scale.set(1, .06, 1); o.position.y = 4.05; });

	/* les quais des stations, à GAP unités d'intervalle */
	const quays = [];
	function buildQuays(names){
		quays.forEach(q => scene.remove(q.g)); quays.length = 0;
		names.forEach((name, i) => {
			const g = new THREE.Group(); scene.add(g);
			const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 4.6), new THREE.MeshStandardMaterial({ map:platformTex(name), emissive:"#ffffff", emissiveIntensity:.25 }));
			wall.position.set(0, 1.8, -7.2); g.add(wall);
			box(g, 60, .9, 3.6, std("#b9b4ac", { flatShading:false }), 0, -.5, -5.2, 0, false);
			box(g, 60, .06, .3, std("#f2c63c"), 0, .42, -3.55, 0, false);
			for(let x=-24; x<=24; x+=8) box(g, 3.5, .1, .5, std("#fff6e2", { emissive:"#fff1d0", emissiveIntensity:1.6 }), x, 4.4, -5.4, 0, false);
			const wait = []; for(let k=0;k<5;k++){ const p = makePerson(g); p.g.position.set(-20 + k*9 + r()*3, .4, -5.6 - r()*.8); p.g.rotation.y = Math.PI/2*(r() < .5 ? 1 : -1); wait.push(p); }
			const glow = new THREE.PointLight("#fff1d6", 0, 40, 1.5); glow.position.set(0, 3.5, -5); g.add(glow);
			quays.push({ g, glow, at:i*GAP });
		});
	}

	const st = { on:false, t:0, step:1, n:2, names:[], here:0, onStation:null };
	function start({ names, step, onStation }){
		st.on = true; st.t = 0; st.step = step; st.names = names; st.n = names.length; st.here = 0; st.onStation = onStation;
		buildQuays(names);
		maps.forEach(m => paintLine(m, names, 0, 1));
		camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
	}
	function stop(){ st.on = false; }
	const look = new THREE.Vector3();
	function update(dt, t){
		if(!st.on) return;
		st.t += dt;
		// position le long de la ligne : vitesse nulle à chaque station (p entier)
		const p = st.t/st.step, d = GAP*(p - Math.sin(2*Math.PI*p)/(2*Math.PI)), v = GAP*(1 - Math.cos(2*Math.PI*p))/st.step;
		const here = Math.min(st.n - 1, Math.floor(p + .5));
		if(here !== st.here){ st.here = here; maps.forEach(m => paintLine(m, st.names, here, Math.min(st.n - 1, here + 1))); if(st.onStation) st.onStation(here); }
		lights.position.x = (d % 8);
		for(const q of quays){
			q.g.position.x = d - q.at;          // la rame avance vers -x : un quai devant elle est à x < 0
			const near = Math.max(0, 1 - Math.abs(q.g.position.x)/45);
			q.g.visible = Math.abs(q.g.position.x) < 70; q.glow.intensity = near*30;
		}
		// la caméra (au fond de la voiture) se balance avec la vitesse
		const sway = Math.min(1, v/40);
		camera.position.set(LEN/2 - .6, 2.05 + Math.sin(t*9)*.015*sway, .1 + Math.sin(t*2.3)*.04*sway);
		look.set(-LEN/2, 1.65, -.1 + Math.sin(t*1.7)*.05);
		camera.lookAt(look);
		camera.rotation.z += Math.sin(t*3.1)*.006*sway;
		for(const rd of riders){ rd.body.rotation.z = Math.sin(t*2.2 + rd.ph)*(rd.standing ? .05 : .025)*(.3 + sway); }
	}
	return { scene, camera, start, stop, update, get on(){ return st.on; } };
}
