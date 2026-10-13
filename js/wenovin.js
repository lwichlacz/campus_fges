/* L'intérieur de Wenov (rez-de-chaussée et patio), vu en « maison de poupée » comme l'atrium :
   le patio planté sur pilotis du rendu des architectes (Lalou+Lebec), une salle de l'École du Numérique,
   l'espace du Campus Cyber Hauts-de-France, le coworking et son café, le hall et la passerelle de l'étage.
   Les murs côté caméra s'effacent tout seuls. */
import * as THREE from "three";
import { std, box, cyl, mesh, beam, makeStudent, makePerson, mulberry32 } from "./kit.js?v=412b8ca7b6";

const W = 44, D = 34, FL = 4.2, WING = 8;
const HX = W/2, HZ = D/2, PX = HX - WING, PZ = HZ - WING;      // patio : 28 × 18

function canvasTex(w, h, draw){
	const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function codeTex(seed, title){
	const r = mulberry32(seed);
	return canvasTex(256, 160, (x, w, h) => {
		x.fillStyle = "#18202c"; x.fillRect(0, 0, w, h);
		const cols = ["#7fd1b9", "#e6c07b", "#c792ea", "#82aaff", "#d6dde6"];
		let y = title ? 34 : 14;
		if(title){ x.fillStyle = "#21b6ce"; x.fillRect(0, 0, w, 22); x.fillStyle = "#0b2f67"; x.font = "bold 14px Arial"; x.fillText(title, 10, 16); }
		while(y < h - 8){
			let xx = 10 + Math.floor(r()*3)*14;
			const n = 1 + Math.floor(r()*4);
			for(let k=0;k<n;k++){ const l = 14 + r()*60; x.fillStyle = cols[Math.floor(r()*cols.length)]; x.fillRect(xx, y, l, 5); xx += l + 8; }
			y += 11;
		}
	});
}
function socTex(){
	return canvasTex(512, 200, (x, w, h) => {
		x.fillStyle = "#0e1726"; x.fillRect(0, 0, w, h);
		// carte stylisée et points d'alerte
		x.fillStyle = "#1e3350"; for(let i=0;i<220;i++){ const a = (i*37)%100/100, b = (i*61)%100/100; x.fillRect(20 + a*260, 30 + b*140, 4, 4); }
		x.fillStyle = "#ff5a6a"; [[90,80],[180,60],[230,130]].forEach(([a,b]) => { x.beginPath(); x.arc(a, b, 6, 0, 7); x.fill(); });
		x.fillStyle = "#21b6ce"; x.font = "bold 16px Arial"; x.fillText("SOC · supervision", 300, 30);
		// courbes
		x.strokeStyle = "#7fd1b9"; x.lineWidth = 3; x.beginPath(); for(let i=0;i<=20;i++) x.lineTo(300 + i*10, 120 - Math.sin(i*.7)*22 - i*1.2); x.stroke();
		x.strokeStyle = "#e6c07b"; x.beginPath(); for(let i=0;i<=20;i++) x.lineTo(300 + i*10, 160 - Math.cos(i*.5)*14); x.stroke();
		x.fillStyle = "#ff5a6a"; x.fillRect(300, 172, 120, 16); x.fillStyle = "#fff"; x.font = "bold 12px Arial"; x.fillText("ALERTE · phishing", 306, 184);
	});
}
function gridTex(){
	return canvasTex(128, 128, (x) => {
		x.fillStyle = "#e9e6df"; x.fillRect(0, 0, 128, 128);
		const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, "#9bb3c6"); g.addColorStop(1, "#6f879b");
		x.fillStyle = g; x.fillRect(14, 16, 36, 96); x.fillRect(78, 16, 36, 96);
	});
}
function wall(parent, w, h, mat, x, z, ry){
	const g = new THREE.PlaneGeometry(w, h).translate(0, h/2, 0);
	const uv = g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*w/3.2, uv.getY(i)*h/FL);
	const m = new THREE.Mesh(g, mat); m.position.set(x, 0, z); m.rotation.y = ry; m.receiveShadow = true; parent.add(m); return m;
}

export function createWenovIn({ background }){
	const scene = new THREE.Scene();
	scene.background = background;
	const hemi = new THREE.HemisphereLight("#fff4e4", "#6d6a66", 1.2);
	const sun = new THREE.DirectionalLight("#fff1d6", 2.1);
	sun.position.set(-18, 42, 22); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, { left:-30, right:30, top:26, bottom:-26, near:5, far:90 });
	sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
	scene.add(hemi, sun);

	const white = std("#f2f0eb"), floorM = std("#cfcac1", { flatShading:false }), patioM = std("#d9d4ca", { flatShading:false });
	const wood = std("#c79a6a"), dark = std("#2b2f36"), yellow = std("#f2c63c"), cyan = std("#21b6ce"), navy = std("#1e305e");
	const glass = new THREE.MeshStandardMaterial({ color:"#cfe2ea", transparent:true, opacity:.28, roughness:.1, metalness:.1, side:THREE.DoubleSide, depthWrite:false });
	glass.forceSinglePass = true;
	const concrete = new THREE.MeshStandardMaterial({ map:gridTex(), roughness:.85, side:THREE.DoubleSide });
	const lampM = std("#fff6e2", { emissive:"#ffe2a8", emissiveIntensity:1.1, flatShading:false });

	/* sol, patio, socle */
	/* Sol d'un seul tenant : rien n'est empilé à quelques centimètres (sinon les téléphones, dont la profondeur est
	   moins précise, font scintiller les surfaces). Le sol des ailes entoure le patio sans le recouvrir ;
	   les joints des dalles du patio sont dessinés dans sa texture. */
	box(scene, W + 2, .6, D + 2, std("#8c867e"), 0, -.9, 0, 0, false);                           // socle, bien sous le sol
	const ringShape = new THREE.Shape([new THREE.Vector2(-W/2, -D/2), new THREE.Vector2(W/2, -D/2), new THREE.Vector2(W/2, D/2), new THREE.Vector2(-W/2, D/2)]);
	ringShape.holes.push(new THREE.Path([new THREE.Vector2(-PX, -PZ), new THREE.Vector2(-PX, PZ), new THREE.Vector2(PX, PZ), new THREE.Vector2(PX, -PZ)]));
	const fl = new THREE.Mesh(new THREE.ShapeGeometry(ringShape).rotateX(-Math.PI/2), floorM); fl.receiveShadow = true; scene.add(fl);
	const dalles = canvasTex(256, 256, (x) => { x.fillStyle = "#d9d4ca"; x.fillRect(0, 0, 256, 256); x.fillStyle = "#c4beb3"; x.fillRect(0, 0, 256, 6); x.fillRect(0, 0, 6, 256); });
	dalles.wrapS = dalles.wrapT = THREE.RepeatWrapping; dalles.repeat.set(PX*2/2.2, PZ*2/2.2);
	patioM.map = dalles; patioM.color.set("#ffffff");
	const pa = new THREE.Mesh(new THREE.PlaneGeometry(PX*2, PZ*2).rotateX(-Math.PI/2), patioM); pa.receiveShadow = true; scene.add(pa);

	/* murs extérieurs (trame de façade) : celui côté caméra s'efface */
	const walls = [];
	for(const def of [
		{ w:W, x:0, z:-HZ, ry:0, n:[0,0,-1] }, { w:W, x:0, z:HZ, ry:Math.PI, n:[0,0,1] },
		{ w:D, x:-HX, z:0, ry:Math.PI/2, n:[-1,0,0] }, { w:D, x:HX, z:0, ry:-Math.PI/2, n:[1,0,0] }
	]){
		const g = new THREE.Group(); scene.add(g);
		wall(g, def.w, FL, concrete, def.x, def.z, def.ry);
		box(g, def.ry % Math.PI === 0 ? def.w : .5, .4, def.ry % Math.PI === 0 ? .5 : def.w, white, def.x, FL, def.z);
		walls.push({ group:g, p:new THREE.Vector3(def.x, 0, def.z), n:new THREE.Vector3(...def.n) });
	}

	/* pilotis et vitrages côté patio, passerelle de l'étage (comme sur le rendu) */
	const cols = [];
	for(let x=-PX; x<=PX + .01; x+=3.5){ cols.push([x, -PZ], [x, PZ]); }
	for(let z=-PZ + 3.6; z<PZ - .01; z+=3.6){ cols.push([-PX, z], [PX, z]); }
	{
		const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(.34, .34, FL*2, 10).translate(0, FL, 0), white, cols.length), d = new THREE.Object3D();
		cols.forEach(([x, z], i) => { d.position.set(x, 0, z); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
		im.castShadow = im.receiveShadow = true; scene.add(im);
	}
	for(const [w, x, z, ry] of [[PX*2, 0, -PZ + .9, 0], [PZ*2 - 2, -PX + .9, 0, Math.PI/2], [PZ*2 - 2, PX - .9, 0, Math.PI/2]]){
		const m = new THREE.Mesh(new THREE.PlaneGeometry(w, FL - .3).translate(0, (FL - .3)/2, 0), glass); m.position.set(x, 0, z); m.rotation.y = ry; scene.add(m);
	}
	// passerelle de l'étage le long du patio, avec garde-corps vitré
	// (pas de passerelle au nord : elle masquerait la salle de cours et le Campus Cyber)
	for(const [w, d, x, z] of [[2.4, PZ*2, -PX + 1.2, 0], [2.4, PZ*2, PX - 1.2, 0]]){
		box(scene, w, .35, d, white, x, FL*2 - .35, z);
		box(scene, .06, 1.1, d, glass, x + (x < 0 ? 1.2 : -1.2), FL*2, z);
	}
	// escalier du hall vers la passerelle
	beam(scene, new THREE.Vector3(PX + 3.4, 0, PZ - 1), new THREE.Vector3(PX + 3.4, FL*2 - .35, -PZ + 6), 2.2, .3, white);

	/* patio : arbres en jardinières, bancs jaunes, étudiants */
	const r = mulberry32(12);
	const canopy = std("#6f9a4e"), canopy2 = std("#8fae55"), trunk = std("#6b4a35");
	const trees = [[-9, -3], [-2, 3], [6, -4], [11, 3], [-12, 4]];
	for(const [x, z] of trees){
		cyl(scene, 1.4, 1.5, .55, std("#bdb7ab"), x, 0, z, 12);
		cyl(scene, .22, .3, 4.2, trunk, x, .5, z, 6);
		mesh(new THREE.IcosahedronGeometry(2.3, 0), r() < .5 ? canopy : canopy2, scene, x, 5.6, z, r()*3);
		mesh(new THREE.IcosahedronGeometry(1.6, 0), canopy2, scene, x + .8, 7.1, z - .4, r()*3);
	}
	const people = [], seated = [];
	for(const [x, z, ry] of [[-6, 6, 0], [3, -6.5, Math.PI], [8, 6.5, 0]]){
		box(scene, 2.2, .45, .7, yellow, x, 0, z, 0);
		const s = makePerson(scene, true); s.g.position.set(x - .5, -.15, z + (ry ? -.35 : .35)); s.g.rotation.y = ry; seated.push({ ...s, ph:r()*6 });
	}
	for(const [x, z] of [[-1, -1], [4, 1.5], [-6, -5]]){
		for(const a of [0, Math.PI*.9]){ const s = makePerson(scene); s.g.position.set(x + Math.sin(a)*.8, 0, z + Math.cos(a)*.8); s.g.rotation.y = a + Math.PI; people.push({ ...s, ph:r()*6 }); }
	}

	/* aile nord, à gauche : une salle de l'École du Numérique */
	const zN = -HZ + WING/2;
	const screenBig = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), new THREE.MeshStandardMaterial({ map:codeTex(3, "École du Numérique · L1 Projet Gaming"), emissive:"#ffffff", emissiveMap:codeTex(3, "École du Numérique · L1 Projet Gaming"), emissiveIntensity:.55 }));
	screenBig.position.set(-11.5, 2.3, -HZ + .12); scene.add(screenBig);
	const monTex = [codeTex(7), codeTex(8), codeTex(9)];
	const monM = monTex.map(t => new THREE.MeshStandardMaterial({ map:t, emissive:"#ffffff", emissiveMap:t, emissiveIntensity:.5 }));
	for(let row=0; row<2; row++) for(let k=0; k<5; k++){
		const x = -19 + k*3.6, z = zN + .6 + row*2.4;
		box(scene, 2.8, .1, 1, wood, x, .9, z); box(scene, 2.6, .9, .9, dark, x, 0, z, 0, false);
		const mon = new THREE.Mesh(new THREE.BoxGeometry(1, .62, .06), dark); mon.position.set(x, 1.38, z - .3); scene.add(mon);
		const sc = new THREE.Mesh(new THREE.PlaneGeometry(.92, .54), monM[(row*5 + k) % 3]); sc.position.set(x, 1.38, z - .235); scene.add(sc);
		if((row + k) % 3 !== 2){ const s = makeStudent(scene, true); s.g.scale.setScalar(1.05); s.g.position.set(x, -.1, z + .75); s.g.rotation.y = Math.PI; seated.push({ ...s, ph:r()*6 }); }
	}
	box(scene, .1, FL, WING, glass, -.6, 0, zN);         // cloison vitrée entre la salle et le Campus Cyber

	/* aile nord, à droite : le Campus Cyber Hauts-de-France */
	const soc = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.2), new THREE.MeshStandardMaterial({ map:socTex(), emissive:"#ffffff", emissiveMap:socTex(), emissiveIntensity:.7 }));
	soc.position.set(11, 2.4, -HZ + .12); scene.add(soc);
	const alert = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .3), std("#ff5a6a", { emissive:"#ff5a6a", emissiveIntensity:1 })); alert.position.set(15.4, 4.15, -HZ + .14); scene.add(alert);
	const redT = codeTex(21), redM = new THREE.MeshStandardMaterial({ map:redT, emissive:"#ffffff", emissiveMap:redT, emissiveIntensity:.5 });
	for(let k=0; k<6; k++){
		const a = -.5 + k*.2, x = 11 + Math.sin(a)*7.4, z = zN + 3 - Math.cos(a)*2.2;
		box(scene, 2.2, .1, .9, std("#3b4656"), x, .9, z, -a); box(scene, 2, .9, .8, dark, x, 0, z, -a, false);
		for(const o of [-.55, .55]){ const sc = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), k % 2 ? redM : monM[k % 3]); sc.position.set(x + Math.cos(a)*o, 1.4, z - .25); sc.rotation.y = -a; scene.add(sc); }
		if(k % 3 !== 1){ const s = makePerson(scene, true, "pro"); s.g.position.set(x, -.1, z + .8); s.g.rotation.y = Math.PI - a; seated.push({ ...s, ph:r()*6 }); }
	}
	box(scene, 3.2, 2.2, .3, cyan, 19.5, 0, zN + 3.2, -Math.PI/2);     // panneau d'accueil cyan

	/* aile ouest : coworking et café */
	box(scene, 1.2, 1.1, 6, wood, -HX + 1.6, 0, 2);
	box(scene, 1.4, .1, 6.2, std("#efe8dc"), -HX + 1.6, 1.1, 2);
	box(scene, .7, .6, .5, std("#c4c8cc", { metalness:.6, roughness:.3 }), -HX + 1.6, 1.2, .4);
	const menu = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), new THREE.MeshStandardMaterial({ map:canvasTex(256, 120, (x) => { x.fillStyle = "#2c2f2b"; x.fillRect(0, 0, 256, 120); x.fillStyle = "#f4ead6"; x.font = "bold 26px Georgia"; x.textAlign = "center"; x.fillText("Café · coworking", 128, 50); x.fillStyle = "#e9c27a"; x.font = "18px Georgia"; x.fillText("espresso · thé · cookies", 128, 88); }) }));
	menu.position.set(-HX + .12, 2.6, 2); menu.rotation.y = Math.PI/2; scene.add(menu);
	for(const [x, z] of [[-16.5, -5], [-16.5, 8], [-18.8, 12.5]]){
		cyl(scene, .8, .8, .08, wood, x, .78, z, 14); cyl(scene, .07, .07, .78, dark, x, 0, z, 6);
		for(const a of [0, Math.PI]){ const s = makePerson(scene, true); s.g.position.set(x + Math.sin(a)*1.1, -.15, z + Math.cos(a)*1.1); s.g.rotation.y = a + Math.PI; seated.push({ ...s, ph:r()*6 }); }
		box(scene, .6, 1.1, .6, std("#5f8f4a"), x + 1.5, 0, z + 1.5);
	}
	box(scene, WING, .1, .1, glass, -HX + WING/2, 0, -PZ);

	/* aile est : hall d'accueil (banque, signalétique) */
	box(scene, 3.6, 1.1, 1.2, white, HX - 4, 0, 6);
	box(scene, 3.8, .1, 1.4, cyan, HX - 4, 1.1, 6);
	const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.2), new THREE.MeshStandardMaterial({ map:canvasTex(320, 80, (x) => { x.fillStyle = "#1e305e"; x.fillRect(0, 0, 320, 80); x.fillStyle = "#21b6ce"; x.font = "bold 46px Arial"; x.textAlign = "center"; x.fillText("WENOV", 160, 58); }) }));
	sign.position.set(HX - .12, 3, 3); sign.rotation.y = -Math.PI/2; scene.add(sign);
	{ const s = makePerson(scene, false, "pro"); s.g.position.set(HX - 4, 0, 7.6); people.push({ ...s, ph:r()*6 }); }

	/* aile est : plateau robotique (le mini-jeu de la Licence Sciences pour l'Ingénieur) */
	let robotArm = null;
	{
		const rx = HX - 4, rz = -4, steelM = std("#9aa3ad", { metalness:.5, roughness:.35 }), wM = std("#eef1f4");
		// estrade : marquage jaune puis plateau gris, en marches nettes (pas de surfaces à quelques millimètres du sol)
		box(scene, 5.2, .1, 4.4, std("#f2c63c"), rx, 0, rz, 0, false);
		box(scene, 4.8, .1, 4, std("#dfe4e9"), rx, .1, rz, 0, false);
		cyl(scene, .35, .42, .8, steelM, rx - .2, .2, rz, 18);          // hors de l'ombre de la passerelle
		const arm = new THREE.Group(); arm.position.set(rx - .2, 1, rz); arm.rotation.y = .6; scene.add(arm);
		const up = new THREE.Mesh(new THREE.BoxGeometry(1.3, .22, .22).translate(.65, 0, 0), wM); up.rotation.z = .9; up.castShadow = true; arm.add(up);
		const fo = new THREE.Mesh(new THREE.BoxGeometry(1.1, .18, .18).translate(.55, 0, 0), wM); fo.position.set(Math.cos(.9)*1.3, Math.sin(.9)*1.3, 0); fo.rotation.z = -.5; fo.castShadow = true; arm.add(fo);
		const band = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, .23).translate(.65, .1, 0), cyan); band.rotation.z = .9; arm.add(band);
		robotArm = { arm, up, fo, band };
		box(scene, .6, .5, 2.6, std("#3c434b"), rx + 1.7, .2, rz, 0, true);                       // petit tapis
		for(const [dz, c] of [[-.7, "#2f7fd1"], [.2, "#d9782d"], [.9, "#2f7fd1"]]) box(scene, .26, .26, .26, std(c), rx + 1.7, .74, rz + dz, 0, true);
		const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshStandardMaterial({ map:codeTex(31, "Cellule robotique · L1-L3"), emissive:"#ffffff", emissiveMap:codeTex(31, "Cellule robotique · L1-L3"), emissiveIntensity:.55 }));
		scr.position.set(HX - .12, 2.4, rz); scr.rotation.y = -Math.PI/2; scene.add(scr);
	}

	/* aile sud : le laboratoire bio-data (mini-jeu du Master Data Management in Biosciences) */
	{
		const lz = PZ + 4, labW = std("#f4f6f8"), steel = std("#c4c8cc", { metalness:.6, roughness:.3 });
		box(scene, 7.4, .1, 3.4, std("#e9e2f5"), -4, 0, lz, 0, false);                         // sol du labo, légèrement teinté
		box(scene, 5.6, .95, 1.1, labW, -4, 0, lz + 1);                                      // paillasse
		box(scene, 5.8, .08, 1.3, std("#2f3a4a"), -4, .95, lz + 1);
		box(scene, 1.3, .9, .9, std("#e7e8ec"), -6, 1.03, lz + 1);                            // séquenceur
		box(scene, .9, .12, .05, cyan, -6, 1.6, lz + .54);
		for(let k=0;k<6;k++) cyl(scene, .07, .07, .4, std(["#c0392b", "#8a5cc7", "#21b6ce"][k % 3]), -4.4 + k*.22, 1.03, lz + .9, 8);   // tubes
		cyl(scene, .35, .35, .45, steel, -2.4, 1.03, lz + 1.1, 14);                           // centrifugeuse
		const dna = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshStandardMaterial({ map:codeTex(41, "Bio-data lab · Master DMB"), emissive:"#ffffff", emissiveMap:codeTex(41, "Bio-data lab · Master DMB"), emissiveIntensity:.55 }));
		dna.position.set(-4, 2.6, HZ - .14); dna.rotation.y = Math.PI; scene.add(dna);
		{ const s = makePerson(scene, false, "pro"); s.g.position.set(-1.6, 0, lz + .1); s.g.rotation.y = Math.PI; people.push({ ...s, ph:r()*6 }); }
	}

	/* plafonniers */
	for(const [x, z] of [[-14, zN], [-7, zN], [8, zN], [15, zN], [-HX + 4, -4], [-HX + 4, 8], [HX - 4, 0]]) box(scene, 2.4, .08, .4, lampM, x, FL - .1, z, 0, false);

	const camLocal = new THREE.Vector3();
	function update(dt, t, camera){
		for(const w of walls){ camLocal.subVectors(camera.position, w.p); w.group.visible = camLocal.dot(w.n) < .5; }
		for(const s of seated){ s.body.rotation.z = Math.sin(t*1.1 + s.ph)*.03; s.hat.position.y = 1.82 + Math.max(0, Math.sin(t*1.7 + s.ph))*.03; }
		for(const s of people){ s.body.rotation.z = Math.sin(t*1.3 + s.ph)*.04; }
		alert.visible = Math.sin(t*4) > -.2;
		// le bras du plateau travaille : il va chercher une pièce sur le tapis et la ramène (attire l'œil vers le mini-jeu)
		if(robotArm){
			const k = t*.8, a = .9 + Math.sin(k*2)*.22, { arm, up, fo, band } = robotArm;
			arm.rotation.y = .1 + Math.sin(k)*.6;
			up.rotation.z = band.rotation.z = a;
			fo.position.set(Math.cos(a)*1.3, Math.sin(a)*1.3, 0); fo.rotation.z = -.5 + Math.sin(k*2 + 1)*.35;
		}
	}
	function setNight(night){
		hemi.intensity = night ? .8 : 1.2; sun.intensity = night ? .7 : 2.1;
		lampM.emissiveIntensity = night ? 1.8 : 1.1;
	}
	const spot = (x, z) => ({ target:[x, 1.2, z], cam:[x + 3, 30, z + 15] });      // en plongée, au-dessus des passerelles
	return {
		scene, update, setNight,
		home:{ pos:new THREE.Vector3(4, 50, 40), target:new THREE.Vector3(0, 1, -3) },
		limits:{ minDistance:12, maxDistance:85, minPolarAngle:.35, maxPolarAngle:1.32, box:[-20, 20, -15, 15] },
		spots:{ salle:spot(-11, zN + 2), cyber:spot(11, zN + 2), hiptown:spot(-HX + 4, 3) },
		pins:[
			{ id:"salle", icon:"💻", name:"Salles de l'École du Numérique", pos:[-11, 5.6, zN] },
			{ id:"cyber", icon:"🛡️", name:"Campus Cyber Hauts-de-France", pos:[11, 5.6, zN] },
			{ id:"hiptown", icon:"☕", name:"Coworking et café", pos:[-HX + 4, 5, 3] },
			{ id:"robot", icon:"🦾", name:"Plateau robotique · mini-jeu", pos:[HX - 4, 4.6, -4] },
			{ id:"biolab", icon:"🧬", name:"Laboratoire bio-data · mini-jeu (en anglais)", pos:[-4, 4.6, PZ + 4] },
			{ id:"sortir", icon:"🚪", name:"Ressortir dans le quartier", pos:[HX - 4, 4.4, 12] }
		]
	};
}
