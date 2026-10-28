/* La BU Vauban de l'intérieur : grande salle de lecture vitrée, tables à lampes vertes, rayonnages,
   mezzanine sous la verrière, salles de travail en groupe et banque d'accueil.
   Vue « maquette » : deux murs pleins (vitrage du fond, mur du nom à gauche), les deux autres à hauteur d'appui. */
import * as THREE from "three";
import { std, box, cyl, mesh, makePerson, R, mulberry32, BOX } from "./kit.js?v=3422913b24";

const X0 = -20, X1 = 20, Z0 = -12, Z1 = 12, HT = 8.6, MZ = 4.2, MZ1 = -5;      // salle, hauteur, mezzanine (de Z0 à MZ1)

function canvasTex(w, h, draw, rep){
	const c = document.createElement("canvas"); c.width = w; c.height = h;
	draw(c.getContext("2d"), w, h);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
	return t;
}

export function createBU({ background }){
	const scene = new THREE.Scene();
	scene.background = background;
	const hemi = new THREE.HemisphereLight("#f4f7ff", "#cdbb9f", 1.2);
	const sun = new THREE.DirectionalLight("#fff3df", 1.5);
	sun.position.set(18, 30, -26); sun.target.position.set(0, 0, 0); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, { left:-28, right:28, top:28, bottom:-28, near:5, far:90 });
	sun.shadow.bias = -.0005;
	scene.add(hemi, sun, sun.target);
	const rnd = mulberry32(77);

	// ---------- sol, murs ----------
	// joints peu contrastés : un trait sombre d'un pixel « grésille » dès que la caméra bouge
	const parquet = canvasTex(256, 256, (x, w, h) => {
		x.fillStyle = "#a9835e"; x.fillRect(0, 0, w, h);
		for(let r = 0; r < 16; r++){ let px = -(r*37 % 90); while(px < w){ const L = 60 + (r*13 + px) % 70; const v = 176 + ((r*7 + px*3) % 30); x.fillStyle = `rgb(${v},${v*.78|0},${v*.55|0})`; x.fillRect(px, r*16, L - 1, 15); px += L; } }
	}, [6, 6]);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:parquet, roughness:.6 }));
	floor.receiveShadow = true; scene.add(floor);
	box(scene, X1 - X0 + 1, .5, Z1 - Z0 + 1, std("#9b9387"), 0, -.55, 0, 0, false);          // socle 5 cm sous le parquet (jamais dans le même plan)

	// le vitrage du fond : montants fins, le square et ses bouleaux derrière
	const glazing = canvasTex(1024, 256, (x, w, h) => {
		const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#b9d6ea"); g.addColorStop(.6, "#e3eef3"); g.addColorStop(1, "#9fb59a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
		for(let k = 0; k < 26; k++){ const tx = k*40 + (k*17 % 23); x.fillStyle = "#eae6dc"; x.fillRect(tx, 120, 4, 136); x.fillStyle = ["#9fb35a", "#c8b34a", "#7f9c4f"][k % 3]; x.beginPath(); x.ellipse(tx + 2, 110, 20, 34, 0, 0, 7); x.fill(); }
		x.fillStyle = "#5d6670"; for(let px = 0; px <= w; px += 64) x.fillRect(px - 2, 0, 4, h); x.fillRect(0, 124, w, 4); x.fillRect(0, 0, w, 6);
	});
	const glassWall = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, HT), new THREE.MeshStandardMaterial({ map:glazing, emissive:"#ffffff", emissiveMap:glazing, emissiveIntensity:.55, roughness:.2 }));
	glassWall.position.set(0, HT/2, Z0); scene.add(glassWall);
	// le mur du nom, à gauche : enduit clair, bandeau de granité rouge (comme le grand mur extérieur)
	const nameWall = canvasTex(1024, 220, (x, w, h) => {
		x.fillStyle = "#f1eee8"; x.fillRect(0, 0, w, h);
		x.fillStyle = "#8a2a2c"; x.fillRect(0, 150, w, 70);
		// grains proches du fond : pas de points clairs qui grésillent
		for(let k = 0; k < 2500; k++){ x.fillStyle = ["#a63c3a", "#6d1d20", "#9a3a36"][k % 3]; x.fillRect((k*733) % w, 150 + (k*97) % 70, 2, 2); }
		x.fillStyle = "#1f2b3c"; x.font = "600 30px Arial, sans-serif"; x.textAlign = "center";
		x.fillText("BIBLIOTHÈQUE UNIVERSITAIRE", w/2, 70); x.font = "800 52px Arial, sans-serif"; x.fillText("VAUBAN", w/2, 126);
	});
	const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0, HT), new THREE.MeshStandardMaterial({ map:nameWall, roughness:.85 }));
	leftWall.position.set(X0, HT/2, 0); leftWall.rotation.y = Math.PI/2; leftWall.receiveShadow = true; scene.add(leftWall);
	// murs avant et droit à hauteur d'appui (on voit dedans), avec un chapeau gris
	const sill = std("#e8e4dc"), cap = std("#5d6670", { metalness:.3 });
	box(scene, X1 - X0, 1, .3, sill, 0, 0, Z1); box(scene, X1 - X0 + .1, .08, .4, cap, 0, 1, Z1);
	box(scene, .3, 1, Z1 - Z0 - .6, sill, X1, 0, -.3); box(scene, .4, .08, Z1 - Z0 - .6, cap, X1, 1, -.3);          // s'arrête contre l'appui avant
	box(scene, 3.2, .1, .5, std("#d9a83a"), -6, 0, Z1 + .05);          // le seuil de l'entrée (doré)

	// ---------- mezzanine ----------
	const white = std("#f4f2ee", { flatShading:false }), steel = std("#4b5560", { metalness:.5, roughness:.4, flatShading:false });
	box(scene, 31.9, .35, MZ1 - Z0 - .1, white, -4.05 + .1, MZ - .35, (Z0 + MZ1)/2 + .05);          // 5 à 10 cm du vitrage et du mur : pas de faces confondues
	for(let x = -18; x <= 10; x += 7) cyl(scene, .18, .18, MZ - .35, steel, x, 0, MZ1 - .4, 12);
	const glassM = new THREE.MeshStandardMaterial({ color:"#cfe4ea", transparent:true, opacity:.28, roughness:.1, depthWrite:false });
	const rail = new THREE.Mesh(new THREE.PlaneGeometry(32, 1.05), glassM); rail.position.set(-4, MZ + .52, MZ1); scene.add(rail);
	box(scene, 32, .06, .08, steel, -4, MZ + 1.05, MZ1);
	// escalier droit, de la salle à la mezzanine
	const wood = std("#c4925e", { flatShading:false });
	for(let k = 0; k < 14; k++) box(scene, 1.8, .3, .5, k % 2 ? wood : std("#b9844f"), 13.2, k*.3, 1.5 - k*.5);
	box(scene, 2.2, .35, 1.1, white, 13.2, MZ - .35, MZ1 - .8);          // palier, juste derrière la dernière marche

	// ---------- rayonnages (instanciés) : un meuble = un caisson de bois et deux faces de livres ----------
	const books = canvasTex(256, 192, (x, w, h) => {
		x.fillStyle = "#8a6440"; x.fillRect(0, 0, w, h);
		const cols = ["#b0624a", "#d6b46a", "#6d8c6a", "#8f5a6e", "#c98f4f", "#5d7da0", "#e8e0cc", "#3f5b75", "#a8463e", "#7b8c3a"];
		for(let s = 0; s < 4; s++){ let px = 4; const y0 = s*48 + 6; while(px < w - 6){ const bw = 4 + rnd()*6, bh = 30 + rnd()*10; x.fillStyle = cols[Math.floor(rnd()*cols.length)]; x.fillRect(px, y0 + 40 - bh, bw, bh); x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(px + 1, y0 + 44 - bh, bw - 2, 2); px += bw + .6; if(rnd() < .04) px += 10; } x.fillStyle = "#6e4f33"; x.fillRect(0, y0 + 40, w, 6); }
	});
	const bookMat = new THREE.MeshStandardMaterial({ map:books, roughness:.8 }), caseMat = std("#d8c3a2", { flatShading:false });
	const cases = [];          // [x, y, z, angle, longueur]
	for(let x = -17; x <= 9; x += 3.2){ cases.push([x, 0, -8.6, Math.PI/2, 5.4]); cases.push([x, MZ, -9.1, Math.PI/2, 4.4]); }
	for(const z of [2.6, 5.8]) for(const x of [8.5, 15]) cases.push([x, 0, z, 0, 5.2]);
	cases.push([8.5, 0, -.6, 0, 5.2]);          // (à droite, l'escalier de la mezzanine)
	{
		const H = 2.1, D = .55, d = new THREE.Object3D();
		const frame = new THREE.InstancedMesh(BOX, caseMat, cases.length), face = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).translate(0, .5, 0), bookMat, cases.length*2);
		cases.forEach(([x, y, z, a, L], k) => {
			d.position.set(x, y, z); d.rotation.set(0, a, 0); d.scale.set(L, H, D); d.updateMatrix(); frame.setMatrixAt(k, d.matrix);
			for(const s of [1, -1]){ d.position.set(x + Math.sin(a)*s*(D/2 + .02), y + .08, z + Math.cos(a)*s*(D/2 + .02)); d.rotation.set(0, a + (s > 0 ? 0 : Math.PI), 0); d.scale.set(L - .16, H - .2, 1); d.updateMatrix(); face.setMatrixAt(k*2 + (s > 0 ? 0 : 1), d.matrix); }
		});
		frame.castShadow = frame.receiveShadow = face.receiveShadow = true; scene.add(frame, face);
	}

	// ---------- salle de lecture : longues tables, lampes vertes, chaises, lecteurs ----------
	const tableTop = std("#d9b98c", { flatShading:false }), legM = std("#3a3f47", { metalness:.4 });
	const shade = new THREE.MeshStandardMaterial({ color:"#2f6b45", emissive:"#ffe2a0", emissiveIntensity:.04, roughness:.35, metalness:.2 });
	const people = [], chairs = [], lamps = [];
	const tables = [];
	for(const x of [-14.5, -7.5]) for(const z of [-1.5, 2.6, 6.7]) tables.push([x, z]);
	for(const [tx, tz] of tables){
		box(scene, 5.6, .08, 1.5, tableTop, tx, .76, tz);
		for(const s of [-1, 1]) box(scene, .1, .76, 1.3, legM, tx + s*2.5, 0, tz);
		for(const s of [-1, 1]){ const lx = tx + s*1.4; cyl(scene, .045, .045, .38, legM, lx, .84, tz, 6); const l = mesh(new THREE.CylinderGeometry(.08, .22, .14, 10, 1, true), shade, scene, lx, 1.25, tz); lamps.push(l); }
		for(let k = 0; k < 4; k++) for(const s of [-1, 1]){
			const cx = tx - 2.1 + k*1.4, cz = tz + s*1.05;
			chairs.push([cx, cz, s > 0 ? Math.PI : 0]);
			if(rnd() < .45){ const p = makePerson(scene, true); p.g.scale.setScalar(.85); p.g.position.set(cx, -.2, cz - s*.05); p.g.rotation.y = s > 0 ? Math.PI : 0; people.push({ ...p, ph:R(0, 6) });
				const book = box(scene, .42, .03, .3, std(["#e8e0cc", "#b0624a", "#5d7da0"][k % 3]), cx, .84, tz + s*.4); book.rotation.y = R(-.3, .3); }
		}
	}
	{
		const seat = new THREE.InstancedMesh(BOX, std("#3f6b8f", { flatShading:false }), chairs.length), back = new THREE.InstancedMesh(BOX, std("#3f6b8f", { flatShading:false }), chairs.length), legs = new THREE.InstancedMesh(BOX, legM, chairs.length), d = new THREE.Object3D();
		chairs.forEach(([x, z, a], k) => {
			d.rotation.set(0, a, 0);
			d.position.set(x, .44, z); d.scale.set(.48, .06, .46); d.updateMatrix(); seat.setMatrixAt(k, d.matrix);
			d.position.set(x - Math.sin(a)*.22, .5, z - Math.cos(a)*.22); d.scale.set(.44, .46, .05); d.updateMatrix(); back.setMatrixAt(k, d.matrix);
			d.position.set(x, 0, z); d.scale.set(.4, .44, .38); d.updateMatrix(); legs.setMatrixAt(k, d.matrix);
		});
		for(const m of [seat, back, legs]){ m.castShadow = true; m.receiveShadow = true; scene.add(m); }
	}
	// suspensions linéaires au-dessus des tables
	const lightM = new THREE.MeshStandardMaterial({ color:"#ffffff", emissive:"#fff1d6", emissiveIntensity:1.2 });
	for(const [tx, tz] of tables) box(scene, 4.4, .08, .22, lightM, tx, 3.6, tz, 0, false);          // (sans fils : trop fins, ils scintillent)

	// ---------- banque d'accueil ----------
	const desk = new THREE.Group(); desk.position.set(-1, 0, 9.4); scene.add(desk);
	box(desk, 4.6, 1.05, .9, std("#f4f2ee", { flatShading:false }), 0, 0, 0);
	box(desk, 4.8, .06, 1.1, std("#c4925e", { flatShading:false }), 0, 1.05, -.05);
	box(desk, 4.5, .14, .03, std("#d9a83a"), 0, .7, .48);
	for(const x of [-1.2, 1.2]){ box(desk, .5, .32, .04, std("#1d232b"), x, 1.15, -.25); }
	const libr = makePerson(desk); libr.g.position.set(.3, 0, -.9); libr.g.rotation.y = Math.PI*0; libr.g.scale.setScalar(1.1);
	const signTex = canvasTex(512, 96, (x, w, h) => { x.fillStyle = "#1f2b3c"; x.fillRect(0, 0, w, h); x.fillStyle = "#f4f2ee"; x.font = "700 40px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("ACCUEIL · PRÊT · RETOUR", w/2, h/2 + 2); });
	const sign = new THREE.Mesh(new THREE.PlaneGeometry(4, .75), new THREE.MeshStandardMaterial({ map:signTex, emissive:"#ffffff", emissiveMap:signTex, emissiveIntensity:.3 }));
	sign.position.set(-1, 3.1, 9.4); scene.add(sign);
	for(const s of [-1, 1]) box(scene, .05, 1, .05, steel, -1 + s*1.8, 3.4, 9.4, 0, false);

	// ---------- salles de travail en groupe : boîtes vitrées, une table, quatre étudiants ----------
	for(const [rx, rz] of [[8.5, 10], [15.2, 10]]){
		const g = new THREE.Group(); g.position.set(rx, 0, rz); scene.add(g);
		for(const [w, d, x, z] of [[5.5, .06, 0, -1.6], [.06, 3.2, -2.8, 0], [.06, 3.2, 2.8, 0]]){ const p = box(g, w, 2.6, d, glassM, x, 0, z, 0, false); p.renderOrder = 2; }
		for(const [w, d, x, z] of [[5.5, .08, 0, -1.6], [.08, 3.3, -2.8, 0], [.08, 3.3, 2.8, 0], [5.5, .08, 0, 1.6]]) box(g, w, .08, d, steel, x, 2.6, z);          // cadre, sans plafond : on voit dedans
		box(g, 2.4, .06, 1.1, tableTop, 0, .76, -.1); box(g, .1, .76, .8, legM, 0, 0, -.1);
		const scr = box(g, 1.6, .9, .05, std("#1d232b", { emissive:"#5d7da0", emissiveIntensity:.4 }), 0, 1.2, -1.5);
		for(const [x, z, a] of [[-.7, -.85, 0], [.7, -.85, 0], [-.7, .65, Math.PI], [.7, .65, Math.PI]]){ const p = makePerson(g, true); p.g.scale.setScalar(.85); p.g.position.set(x, -.2, z); p.g.rotation.y = a; people.push({ ...p, ph:R(0, 6) }); }
		const lbl = canvasTex(256, 64, (x, w, h) => { x.fillStyle = "#f4f2ee"; x.fillRect(0, 0, w, h); x.fillStyle = "#1f2b3c"; x.font = "700 30px Arial, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(rx < 12 ? "Salle Vauban" : "Salle Schuman", w/2, h/2); });
		const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .4), new THREE.MeshStandardMaterial({ map:lbl })); plate.position.set(0, 2.35, -1.54); plate.rotation.y = Math.PI; g.add(plate);
	}

	// ---------- plantes, lecteurs à la mezzanine, passants ----------
	const pot = std("#e8e4dc"), leaf = std("#4f7d4a");
	for(const [x, z] of [[-18.6, 10.8], [3.6, 10.8], [18.6, -1.5], [-18.6, -3.6]]){ cyl(scene, .35, .28, .6, pot, x, 0, z, 10); for(let k = 0; k < 4; k++) mesh(new THREE.IcosahedronGeometry(.45, 0), leaf, scene, x + Math.sin(k*2.1)*.25, 1 + k*.28, z + Math.cos(k*2.1)*.25); }
	// à la mezzanine, des tables le long du garde-corps, face à la salle
	for(const x of [-12, -1]){ box(scene, 3.4, .06, 1, tableTop, x, MZ + .76, MZ1 - .55); for(const s of [-1, 1]){ const p = makePerson(scene, true); p.g.scale.setScalar(.85); p.g.position.set(x + s*.8, MZ - .2, MZ1 - 1.4); people.push({ ...p, ph:R(0, 6) }); } }
	const walkers = [];
	for(let i = 0; i < 3; i++){ const p = makePerson(scene); walkers.push({ ...p, x:2.4 + i*.5, z:R(-3, 8), v:R(.6, .9)*(i % 2 ? 1 : -1), ph:R(0, 6) }); }

	function update(dt, t){
		for(const p of people) p.body.rotation.x = Math.sin(t*.7 + p.ph)*.03;
		for(const w of walkers){
			w.z += w.v*dt; if(w.z > 8.5 || w.z < -3.5) w.v *= -1;
			w.g.position.set(w.x, 0, w.z); w.g.rotation.y = w.v > 0 ? 0 : Math.PI;
			w.body.position.y = .65 + Math.abs(Math.sin(t*6 + w.ph))*.05;
		}
	}
	function setNight(night){
		hemi.intensity = night ? .55 : 1.2; sun.intensity = night ? .1 : 1.5;
		glassWall.material.emissiveIntensity = night ? .08 : .55;
		shade.emissiveIntensity = night ? 1.6 : .04; lightM.emissiveIntensity = night ? 2.2 : 1.2;
	}

	return {
		scene, update, setNight, pickables:[],
		home:{ pos:new THREE.Vector3(24, 24, 30), target:new THREE.Vector3(-1, 1.5, -1) },
		limits:{ minDistance:8, maxDistance:62, minPolarAngle:.3, maxPolarAngle:1.42, box:[-16, 16, -10, 10] },
		pins:[
			{ id:"accueil", icon:"🛎️", name:"Accueil · prêt et retour", pos:[-1, 3.2, 9.4] },
			{ id:"lecture", icon:"💡", name:"La salle de lecture", pos:[-11, 2.4, 2.6] },
			{ id:"rayons", icon:"📚", name:"Les rayonnages", pos:[12, 3, 2.6] },
			{ id:"groupes", icon:"👥", name:"Salles de travail en groupe", pos:[12, 3.6, 10] },
			{ id:"mezzanine", icon:"🪜", name:"La mezzanine", pos:[-6, MZ + 2.4, -8.6] },
			{ id:"sortir", icon:"🚪", name:"Ressortir", pos:[-6, 1.8, Z1] }
		]
	};
}
