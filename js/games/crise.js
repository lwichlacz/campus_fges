/* « La cellule de crise » — mini-jeu de la Licence Management & Humanités (FGES).
   D'après le FGES Lab « messagerie de crise » (fges_games/fges-lab-man.html), passé en 3D dans la salle du conseil.
   Une chocolaterie fictive de Roubaix, un lot de boîtes mal scellées, un bad buzz. Quatre moments :
   trier l'info (faits ou rumeurs), décider (la balance : chiffres et philosophes), tenir l'équipe (le bon ton),
   parler au public (ethos, pathos, logos). Un seul geste d'un bout à l'autre : on LANCE les objets posés
   sur la table vers leur cible, d'un coup de doigt. Entreprise et personnages fictifs. Contenu à relire par l'équipe. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mountTable, MOBILE } from "./table.js?v=9499cca49c";

const COURSES = {
	erreur:   ["Erreur humaine : épistémologie de l'erreur et de l'illusion", "L2 · Séparer le fait vérifié de la croyance : la première compétence d'un manager en crise."],
	stats:    ["Statistiques descriptives", "L1 · 15 % de 4 200 boîtes : lire un chiffre avant de le commenter."],
	couts:    ["Gestion des coûts / Gestion budgétaire", "L2 · Le coût d'un rappel, face au coût d'une crise qui dure."],
	ethique:  ["Éthique de la conviction versus éthique de la responsabilité", "L3 · Agir selon ses principes, ou répondre des conséquences ? Le manager doit tenir les deux."],
	incert:   ["Le principe d'incertitude", "L2 · Décider sans tout savoir, et assumer sa part de risque."],
	humain:   ["Management humain : entre bienveillance et exigence", "L3 · Le bon ton dépend de la personne : rassurer, cadrer ou expliquer."],
	rh:       ["Management de la fonction RH", "L2 · Garder une équipe engagée quand tout va mal."],
	persuader:["Augmenter, persuader, convaincre", "L3 · Ethos, pathos, logos : la rhétorique d'Aristote au service d'un communiqué."],
	comm:     ["Communication d'entreprise", "L2 · Parler vite, juste et vrai, sans déni ni agressivité."],
	affaires: ["Éthique des affaires", "L3 · Reconnaître, rembourser, corriger : la confiance est un capital."]
};
const TIMELINE = [["Lundi 8 h", "8 h", ["intro"]], ["Trier l'info", "Info", ["tri"]], ["Décider", "Décider", ["balance"]], ["L'équipe", "Équipe", ["equipe"]], ["Le communiqué", "Comm.", ["communique"]], ["Bilan", "Bilan", ["end"]]];

const EXTRA_CSS = `
.cr-msgs{list-style:none;padding:0;margin:8px 0;display:grid;gap:7px}
.cr-msgs li{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid #ddd6c8;border-radius:10px;padding:8px 10px;font-size:13.8px;line-height:1.35;animation:tbUp .3s both}
.cr-msgs li.done{opacity:.4}
.cr-msgs li i{flex:none;font-style:normal;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-weight:800;color:#fff;font-size:13px}
.cr-msgs li b{display:block;font-size:11.5px;color:#6a6660;letter-spacing:.02em}
.cr-legend{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 2px}
.cr-legend span{flex:1;min-width:130px;border-radius:10px;padding:7px 9px;font-weight:800;font-size:12.5px;text-align:center}
.cr-legend .l{background:#e8f0fb;color:#2c5f9e}.cr-legend .r{background:#fbeee2;color:#a35d16}
.cr-gesture{display:flex;gap:10px;align-items:center;background:#22364d;color:#f3e3b8;border-radius:10px;padding:9px 12px;font-weight:800;font-size:13.5px;margin:8px 0}
.cr-gesture span{font-size:24px}
.cr-tok{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid #ddd6c8;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13.8px;line-height:1.35}
.cr-tok i{flex:none;font-style:normal;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 14px Fraunces,Georgia,serif;color:#fff}
.cr-tok b{display:block;font-size:12px;color:#22364d}
.cr-tok.ok{border-color:#3d7a55;background:#eef8f0}.cr-tok.ko{border-color:#c4532f;background:#fdeceb}.cr-tok.off{opacity:.45}
.cr-tok small{display:block;margin-top:3px;font-weight:800;font-size:11.5px}
.cr-tok.ok small{color:#2c6a46}.cr-tok.ko small{color:#b3261e}
.cr-weights{display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:13px;margin:8px 0;font-variant-numeric:tabular-nums}
.cr-weights span{flex:1;border-radius:8px;padding:6px 8px;text-align:center}
.cr-weights .a{background:#e8f0fb;color:#2c5f9e}.cr-weights .b{background:#fbeee2;color:#a35d16}
.cr-says{background:#fff;border:2px solid #22364d;border-radius:12px;padding:10px 12px;margin:8px 0;font-size:14.5px;font-weight:700;color:#22364d}
.cr-says b{display:block;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}
.cr-clock{height:8px;border-radius:5px;background:#ece6da;overflow:hidden;margin:6px 0 2px}
.cr-clock i{display:block;height:100%;background:linear-gradient(90deg,#c9822e,#b3261e);transition:width .1s linear}
.cr-ev{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#3b2a5a,#7a3e8f);color:#fff;border-radius:12px;padding:10px 12px;margin:8px 0;animation:tbUp .4s both}
.cr-ev i{font-style:normal;font-size:26px}
.cr-ev b{display:block;font:700 16px Fraunces,Georgia,serif}
.cr-ev small{opacity:.9;font-weight:700}
.cr-roles{display:flex;gap:6px;margin:8px 0}
.cr-roles span{flex:1;text-align:center;border-radius:8px;padding:6px;font-weight:800;font-size:12.5px;background:#f0ede6;color:#8a857a}
.cr-roles span.on{background:#22364d;color:#f3e3b8}
.tb-m.crise b{color:#b3261e}.tb-m.clim b{color:#2c6a46}.tb-m.st b{color:#c08a2e}
`;

/* ================= la salle du conseil, transformée en cellule de crise ================= */
const SKIN = "#e8c3a0";
function world(canvas){
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#1c2430"); scene.fog = new THREE.Fog("#1c2430", 60, 130);
	const camera = new THREE.PerspectiveCamera(38, 1, .1, 200);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 8; controls.maxDistance = 40; controls.maxPolarAngle = 1.25;
	scene.add(new THREE.HemisphereLight("#fff4e0", "#28323f", 1.05));
	const sun = new THREE.DirectionalLight("#fff0d8", 2.1); sun.position.set(-9, 18, 10); sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-18, right:18, top:18, bottom:-18, near:1, far:60 }); sun.shadow.bias = -.0005;
	scene.add(sun);

	const mats = {}, M = (c, o = {}) => mats[c + JSON.stringify(o)] || (mats[c + JSON.stringify(o)] = new THREE.MeshStandardMaterial({ color:c, roughness:.75, ...o }));
	const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
	const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
	const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
	function rod(parent, a, b, r, mat){
		const d = new THREE.Vector3().subVectors(b, a), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), mat);
		m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
	}

	/* --- la table ovale et le décor (Hôtel Académique : lambris, hautes fenêtres) --- */
	const RX = 11, RZ = 6.5, FY = -3.2;
	{
		const top = mesh(new THREE.CylinderGeometry(1, 1, .5, 72), M("#5a3826"), 0, -.25, 0); top.scale.set(RX + .4, 1, RZ + .4); scene.add(top);
		const cloth = mesh(new THREE.CylinderGeometry(1, 1, .04, 72), M("#2f4f46"), 0, .02, 0); cloth.scale.set(RX - .4, 1, RZ - .4); cloth.castShadow = false; scene.add(cloth);
		for(const [x, z] of [[-6, 0], [6, 0]]) scene.add(mesh(new THREE.CylinderGeometry(.9, 1.4, 2.7, 20), M("#4a2e1f"), x, FY + 1.35, z));
		const deco = new THREE.Group(); scene.add(deco);
		const still = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.receiveShadow = true; deco.add(m); return m; };
		const sbox = (w, h, d, c, x, y, z) => still(new THREE.BoxGeometry(w, h, d), M(c), x, y + h/2, z);
		const parquet = tex(256, 256, (x, w, h) => { for(let i = 0; i < 8; i++){ x.fillStyle = ["#6f4a2e", "#7a5234", "#654227", "#835a3a"][(i*3) % 4]; x.fillRect(0, i*32, w, 32); x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(0, i*32, w, 2); x.fillRect((i*83) % w, i*32, 2, 32); } });
		parquet.wrapS = parquet.wrapT = THREE.RepeatWrapping; parquet.repeat.set(10, 10);
		still(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map:parquet, roughness:.7 }), 0, FY, 0).rotation.x = -Math.PI/2;
		const rug = still(new THREE.CylinderGeometry(1, 1, .05, 64), M("#3b4f6b"), 0, FY + .03, 0); rug.scale.set(18, 1, 12);
		// murs : lambris clair, plinthe sombre, hautes fenêtres sur la cour
		sbox(90, 34, 1, "#e6dccb", 0, FY, -22); sbox(90, 6, 1.3, "#4a2e1f", 0, FY, -21.6);
		for(const sx of [-1, 1]){ sbox(1, 34, 70, "#e6dccb", sx*30, FY, 0); sbox(1.3, 6, 70, "#4a2e1f", sx*29.6, FY, 0); }
		const sky = tex(128, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#bcd6ea"); g.addColorStop(1, "#efe6d0"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(120,90,70,.35)"; for(let i = 0; i < 8; i++) x.fillRect(i*17, h*.7 - (i % 3)*16, 15, h); });
		for(const wx of [-16, 0, 16]){
			sbox(7.4, 17, .5, "#f3ece0", wx, FY + 7, -21.3);
			const g = still(new THREE.PlaneGeometry(6.2, 15.8), new THREE.MeshBasicMaterial({ map:sky }), wx, FY + 15.5, -21);
			g.receiveShadow = false;
			sbox(.25, 15.8, .2, "#f3ece0", wx, FY + 7.6, -20.9); sbox(6.2, .25, .2, "#f3ece0", wx, FY + 18, -20.9);
		}
		// un grand tableau de crise au mur : la courbe des mentions sur les réseaux
		const chart = tex(512, 256, (x, w, h) => { x.fillStyle = "#1e2a38"; x.fillRect(0, 0, w, h); x.strokeStyle = "#3a4a5e"; x.lineWidth = 2; for(let i = 1; i < 5; i++){ x.beginPath(); x.moveTo(30, i*h/5); x.lineTo(w - 20, i*h/5); x.stroke(); }
			x.strokeStyle = "#ef4d5e"; x.lineWidth = 7; x.beginPath(); [[30, 220], [110, 214], [190, 205], [260, 170], [320, 110], [380, 70], [440, 46], [492, 30]].forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke();
			x.fillStyle = "#f3e3b8"; x.font = "800 26px Nunito, sans-serif"; x.fillText("Mentions sur les réseaux · 24 h", 30, 36); });
		still(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map:chart }), -23, FY + 11, -21.2).receiveShadow = false;
		still(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshBasicMaterial({ map:chart }), 23, FY + 11, -21.2).receiveShadow = false;
	}

	/* --- étiquettes dessinées au canvas, plus grandes sur téléphone --- */
	let LS = 1;
	function drawLabel(sp, text, o){
		const c = sp.userData.c || (sp.userData.c = document.createElement("canvas")), x = c.getContext("2d");
		const f = `800 ${o.big ? 56 : 42}px Nunito, system-ui, sans-serif`; x.font = f;
		const w = Math.ceil(x.measureText(text).width) + 44, h = o.big ? 84 : 66;
		c.width = w; c.height = h; x.font = f;
		x.fillStyle = o.bg || "#fffcf3"; x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, h/2 - 2); x.fill();
		if(o.line){ x.strokeStyle = o.line; x.lineWidth = 4; x.stroke(); }
		x.fillStyle = o.fg || "#22364d"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w/2, h/2 + 3);
		if(sp.material.map) sp.material.map.dispose();
		const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; sp.material.map = t; sp.material.needsUpdate = true;
		const s = (o.size || .55)*LS; sp.scale.set(s*w/h, s, 1); sp.userData.base = sp.scale.clone().divideScalar(LS);
	}
	function label(text, o = {}){
		const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false, transparent:true }));
		sp.renderOrder = 10; sp.userData.o = o; drawLabel(sp, text, o); return sp;
	}

	/* --- petites animations --- */
	const anims = [];
	const anim = (dur, fn, done, delay = 0) => anims.push({ t0:performance.now() + delay, dur, fn, done });
	const ease = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
	const popIn = (g, s = 1, delay = 0) => { g.visible = true; g.scale.setScalar(.001); anim(420, k => g.scale.setScalar(Math.max(.001, s*(1 + .25*Math.sin(k*Math.PI))*k)), null, delay); };
	const popOut = (g, done) => { const s = g.scale.x; anim(300, k => g.scale.setScalar(Math.max(.001, s*(1 - k))), () => { g.visible = false; done && done(); }); };
	const shake = g => { const x0 = g.position.x; anim(500, k => g.position.x = x0 + Math.sin(k*Math.PI*6)*.18*(1 - k), () => g.position.x = x0); };
	const nod = g => { anim(600, k => g.rotation.x = Math.sin(k*Math.PI*2)*.22); };

	/* --- le dossier et la corbeille (moment 1) --- */
	const dossier = new THREE.Group(); dossier.position.set(-6.4, 0, -2.4); scene.add(dossier);
	dossier.add(box(2.6, 1.5, 1.8, "#c9a46a", 0, 0, 0), box(2.75, .25, 1.95, "#b08a52", 0, 1.5, 0));
	{ const lab = mesh(new THREE.PlaneGeometry(1.6, .7), new THREE.MeshStandardMaterial({ map:tex(256, 112, (x, w, h) => { x.fillStyle = "#fff8e8"; x.fillRect(0, 0, w, h); x.fillStyle = "#3b2a10"; x.font = "800 40px Nunito, sans-serif"; x.textAlign = "center"; x.fillText("FAITS", w/2, 72); }) }), 0, .8, .91); dossier.add(lab); }
	const dosLab = label("📁 Faits vérifiés", { size:.6, line:"#2c5f9e", fg:"#2c5f9e" }); dosLab.position.set(0, 2.6, 0); dossier.add(dosLab);
	const bin = new THREE.Group(); bin.position.set(6.4, 0, -2.4); scene.add(bin);
	bin.add(mesh(new THREE.CylinderGeometry(1.15, .85, 1.9, 24, 1, true), new THREE.MeshStandardMaterial({ color:"#8d96a3", metalness:.5, roughness:.4, side:THREE.DoubleSide }), 0, .95, 0));
	bin.add(mesh(new THREE.CylinderGeometry(.85, .85, .08, 24), M("#5e6670"), 0, .04, 0));
	const binRim = mesh(new THREE.TorusGeometry(1.15, .07, 8, 32), M("#5e6670", { metalness:.6 }), 0, 1.9, 0); binRim.rotation.x = Math.PI/2; bin.add(binRim);
	const binLab = label("🗑 Rumeurs", { size:.6, line:"#a35d16", fg:"#a35d16" }); binLab.position.set(0, 2.9, 0); bin.add(binLab);

	/* --- la balance (moment 2) --- */
	const bal = new THREE.Group(); bal.position.set(0, 0, -2.2); scene.add(bal);
	const brass = M("#c9a548", { metalness:.75, roughness:.32 });
	bal.add(mesh(new THREE.CylinderGeometry(1.1, 1.4, .35, 32), M("#3a2a1e"), 0, .17, 0), mesh(new THREE.CylinderGeometry(.16, .22, 5.2, 16), brass, 0, 2.8, 0));
	const PY = 5.4, ARM = 4.2;
	const beam = new THREE.Group(); beam.position.y = PY; bal.add(beam);
	beam.add(mesh(new THREE.BoxGeometry(ARM*2 + .4, .22, .26), brass), mesh(new THREE.SphereGeometry(.32, 18, 12), brass));
	const needle = mesh(new THREE.ConeGeometry(.12, 1.3, 8), M("#8f1d21")); needle.position.y = .75; beam.add(needle);
	const pans = { A:null, B:null };
	const PAN_COL = { A:"#2c5f9e", B:"#a35d16" };
	for(const s of ["A", "B"]){
		const p = new THREE.Group(); scene.add(p);
		p.add(mesh(new THREE.CylinderGeometry(1.55, 1.35, .22, 32), brass));
		const rim = mesh(new THREE.TorusGeometry(1.55, .06, 8, 40), brass); rim.rotation.x = Math.PI/2; rim.position.y = .11; p.add(rim);
		for(let i = 0; i < 3; i++){ const a = i*Math.PI*2/3 + .5; rod(p, new THREE.Vector3(Math.cos(a)*1.45, .1, Math.sin(a)*1.45), new THREE.Vector3(0, 2.5, 0), .03, brass); }
		const lab = label(s, { size:.6, bg:PAN_COL[s], fg:"#fff" }); lab.position.set(0, 3.1, 0); p.add(lab);
		const stack = new THREE.Group(); stack.position.y = .12; p.add(stack);
		pans[s] = { g:p, lab, stack, n:0, side:s };
	}
	let theta = 0, omega = 0, thTarget = 0;
	function panPos(s, out = new THREE.Vector3()){
		const sx = s === "A" ? -1 : 1;
		return out.set(bal.position.x + sx*Math.cos(theta)*ARM, bal.position.y + PY + sx*Math.sin(theta)*ARM - 2.5, bal.position.z);
	}
	function setWeights(a, b){ thTarget = Math.max(-.32, Math.min(.32, (a - b)*.06)); }
	function panLabel(s, text){ drawLabel(pans[s].lab, text, { size:.55, bg:PAN_COL[s], fg:"#fff" }); }
	function showBalance(on){
		for(const g of [bal, pans.A.g, pans.B.g, ...Object.values(BUSTS).map(b => b.g)]) if(on || g.visible) on ? popIn(g) : popOut(g);
		if(on){ theta = 0; omega = 0; thTarget = 0; for(const s of ["A", "B"]){ pans[s].stack.clear(); pans[s].n = 0; } }
	}
	function ingot(s, text, color = "#d9b25a", big = 1){
		const g = new THREE.Group(), p = pans[s];
		g.add(mesh(new THREE.BoxGeometry(1.2*big, .42, .6), M(color, { metalness:.6, roughness:.3 }), 0, .21, 0));
		const l = label(text, { size:.42, bg:"#1e2a38", fg:"#f3e3b8" }); l.position.set(0, .95 + p.n*.15, 0); g.add(l);
		g.position.set((p.n % 2 ? .35 : -.35), p.n*.45 + 5, 0); g.rotation.y = p.n*.7; p.stack.add(g); p.n++;
		const y1 = (p.n - 1)*.45;
		anim(650, k => g.position.y = y1 + (5 - y1)*(1 - k*k), () => { g.position.y = y1; anim(250, q => g.position.y = y1 + Math.sin(q*Math.PI)*.15); });
		return g;
	}

	/* --- les bustes des philosophes, au fond de la salle --- */
	const BUSTS = {};
	function bust(id, name, col, x, style){
		const g = new THREE.Group(); g.position.set(x, FY, -12.5); scene.add(g);
		const marble = M("#ece7dc", { roughness:.5 });
		g.add(box(1.5, 4.4, 1.5, "#d8d0c0", 0, 0, 0), box(1.8, .3, 1.8, col, 0, 4.4, 0));
		const head = new THREE.Group(); head.position.y = 6.15; g.add(head);
		const chest = mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI*2, 0, Math.PI/2), marble, 0, 4.7, 0); chest.scale.set(1.05, .75, .6); g.add(chest);
		g.add(mesh(new THREE.CylinderGeometry(.26, .3, .6, 12), marble, 0, 5.4, 0));
		head.add(mesh(new THREE.SphereGeometry(.55, 20, 16), marble));
		if(style === "beard"){ const b = mesh(new THREE.ConeGeometry(.42, .8, 14), marble, 0, -.5, .18); b.rotation.x = Math.PI; head.add(b); head.add(mesh(new THREE.SphereGeometry(.57, 16, 10, 0, Math.PI*2, 0, 1.2), marble, 0, .05, 0)); }
		if(style === "wig"){ for(const sx of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(.22, 12, 10), marble, sx*.52, -.05, -.05)); head.add(mesh(new THREE.SphereGeometry(.2, 12, 10), marble, 0, -.1, -.55)); }
		if(style === "side"){ for(const sx of [-1, 1]) head.add(mesh(new THREE.BoxGeometry(.12, .45, .25), marble, sx*.5, -.12, .1)); }
		if(style === "full"){ const b = mesh(new THREE.SphereGeometry(.45, 14, 10), marble, 0, -.42, .2); b.scale.set(1, .9, .8); head.add(b); }
		const l = label(name, { size:.55, bg:col, fg:"#fff" }); l.position.y = 7.4; g.add(l);
		BUSTS[id] = { g, head, x, col };
	}
	bust("aristote", "Aristote", "#c0612b", -9.6, "beard");
	bust("kant", "Kant", "#3e6fb0", -3.2, "wig");
	bust("mill", "Mill", "#2f8a5b", 3.2, "side");
	bust("weber", "Weber", "#7a6a3a", 9.6, "full");
	const bustHead = id => { const v = new THREE.Vector3(); BUSTS[id].head.getWorldPosition(v); return v; };

	/* --- les collègues, assis autour de la table (moment 3) --- */
	const PEOPLE = {};
	function person(id, name, col, hair, x){
		const g = new THREE.Group(); g.position.set(x, 0, -7.4); g.visible = false; scene.add(g);
		g.add(box(1.7, 2.6, .3, "#3a2a1e", 0, FY + 2.2, -.9));                        // dossier de la chaise
		const body = mesh(new THREE.CylinderGeometry(.62, .78, 2.6, 18), M(col), 0, FY + 3.6 - 1.3, 0); g.add(body);
		const head = new THREE.Group(); head.position.y = FY + 5.1; g.add(head);
		head.add(mesh(new THREE.SphereGeometry(.52, 20, 16), M(SKIN, { roughness:.6 })));
		head.add(mesh(new THREE.SphereGeometry(.55, 18, 12, 0, Math.PI*2, 0, 1.35), M(hair), 0, .06, -.04));
		for(const sx of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(.07, 8, 6), M("#1e1e1e"), sx*.19, .05, .48));
		const mood = mesh(new THREE.TorusGeometry(.75, .07, 8, 32), new THREE.MeshBasicMaterial({ color:"#ffd77a" }), 0, FY + 6, 0); mood.rotation.x = Math.PI/2; mood.visible = false; g.add(mood);
		const l = label(name, { size:.55, bg:col, fg:"#fff" }); l.position.y = FY + 6.6; g.add(l);
		PEOPLE[id] = { g, head, mood, x, gone:false };
	}
	person("chloe", "Chloé", "#4a78c8", "#5a3520", -5.6);
	person("marc", "Marc", "#c4532f", "#2a2a2a", 0);
	person("ines", "Inès", "#2f8a5b", "#1a1410", 5.6);
	function seat(id, on){ const p = PEOPLE[id]; p.gone = !on; if(on){ p.g.position.set(p.x, 0, -7.4); p.g.rotation.y = 0; popIn(p.g); } else p.g.visible = false; }
	function leave(id){
		const p = PEOPLE[id], x0 = p.g.position.x; p.gone = true; p.mood.visible = false;
		anim(400, k => p.g.rotation.y = k*(x0 >= 0 ? -1.4 : 1.4), () => anim(1300, k => { p.g.position.x = x0 + (x0 >= 0 ? 1 : -1)*k*16; p.g.position.y = Math.abs(Math.sin(k*Math.PI*8))*.25; }, () => p.g.visible = false));
	}
	function mood(id, c){ const p = PEOPLE[id]; p.mood.visible = !!c; if(c) p.mood.material.color.set(c); }
	const personPos = id => new THREE.Vector3(PEOPLE[id].g.position.x, 2.2, PEOPLE[id].g.position.z + .6);

	/* --- le communiqué (moment 4) : un panneau qui ne tient debout qu'avec ses trois appuis --- */
	const board = new THREE.Group(); board.position.set(0, 0, -3.6); board.visible = false; scene.add(board);
	const boardTilt = new THREE.Group(); board.add(boardTilt);
	const legs = {};
	[["pathos", -2.2, "#c2547a"], ["logos", 0, "#2c5f9e"], ["ethos", 2.2, "#2f8a5b"]].forEach(([k, x, c]) => {
		const lg = mesh(new THREE.CylinderGeometry(.16, .2, 1.6, 10), M(c), x, .8, 0); lg.scale.y = .25; boardTilt.add(lg);
		const l = label(k[0].toUpperCase() + k.slice(1), { size:.42, bg:c, fg:"#fff" }); l.position.set(x, -.2, .9); l.visible = false; boardTilt.add(l);
		legs[k] = { lg, l };
	});
	boardTilt.add(box(7.2, 3.9, .25, "#fbf8f2", 0, 1.6, 0));
	{ const head = mesh(new THREE.PlaneGeometry(7, 1), new THREE.MeshStandardMaterial({ map:tex(512, 72, (x, w, h) => { x.fillStyle = "#22364d"; x.fillRect(0, 0, w, h); x.fillStyle = "#f3e3b8"; x.font = "800 34px Nunito, sans-serif"; x.textAlign = "center"; x.fillText("COMMUNIQUÉ OFFICIEL", w/2, 48); }) }), 0, 4.95, .14); boardTilt.add(head); }
	const boardSlots = [new THREE.Vector3(-2.2, 2.9, .3), new THREE.Vector3(0, 2.9, .3), new THREE.Vector3(2.2, 2.9, .3)];
	function boardLeg(k){ const L = legs[k]; L.l.visible = true; anim(500, q => L.lg.scale.y = .25 + .75*ease(q)); }
	function boardReset(){ for(const k in legs){ legs[k].lg.scale.y = .25; legs[k].l.visible = false; } boardTilt.rotation.set(0, 0, 0); }
	function boardWobble(){ anim(900, k => boardTilt.rotation.z = Math.sin(k*Math.PI*5)*.12*(1 - k)); }
	function boardPublish(){ anim(700, k => boardTilt.position.y = Math.sin(k*Math.PI)*.6); }

	/* ================= les objets qu'on lance ================= */
	const TOK = new Map();         // id → { g, inner, hit, slot, state, data, kind }
	function tokenMesh(kind, o){
		const g = new THREE.Group();
		if(kind === "plane"){
			const geo = new THREE.BufferGeometry();
			geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -.9, -.75, 0, .6, 0, -.12, .5, 0, 0, -.9, 0, -.12, .5, .75, 0, .6], 3));
			geo.computeVertexNormals();
			const m = mesh(geo, new THREE.MeshStandardMaterial({ color:"#fbf8f2", side:THREE.DoubleSide, roughness:.6 })); m.position.y = .25; g.add(m);
			const tag = mesh(new THREE.CircleGeometry(.32, 20), new THREE.MeshBasicMaterial({ map:tex(64, 64, (x, w, h) => { x.fillStyle = o.color; x.beginPath(); x.arc(32, 32, 31, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "800 38px Nunito, sans-serif"; x.textAlign = "center"; x.fillText(o.n, 32, 46); }) }), 0, .3, .2);
			tag.rotation.x = -Math.PI/2; g.add(tag);
		} else if(kind === "card"){
			g.add(mesh(new THREE.BoxGeometry(1.15, .08, 1.5), M("#fbf8f2"), 0, .25, 0));
			const face = mesh(new THREE.PlaneGeometry(1.05, 1.4), new THREE.MeshBasicMaterial({ map:tex(96, 128, (x, w, h) => { x.fillStyle = "#fbf8f2"; x.fillRect(0, 0, w, h); x.fillStyle = "#22364d"; x.font = "800 62px Fraunces, Georgia, serif"; x.textAlign = "center"; x.fillText(o.n, w/2, 84); x.fillStyle = "#c08a2e"; x.fillRect(16, 104, w - 32, 6); }) }), 0, .3, 0);
			face.rotation.x = -Math.PI/2; g.add(face);
		} else {   // médaillon (philosophe, réponse)
			const disc = mesh(new THREE.CylinderGeometry(.62, .62, .18, 32), M(o.color, { metalness:.3, roughness:.4 }), 0, .7, 0); disc.rotation.x = Math.PI/2 - .5; g.add(disc);
			const face = mesh(new THREE.CircleGeometry(.54, 32), new THREE.MeshBasicMaterial({ map:tex(128, 128, (x, w, h) => { x.fillStyle = o.color; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; x.font = `800 ${o.n.length > 2 ? 30 : 58}px Fraunces, Georgia, serif`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(o.n, w/2, h/2 + 3); }) }));
			face.position.set(0, .7 + Math.sin(.5)*.095, Math.cos(.5)*.095); face.rotation.x = -.5; g.add(face);
			if(o.tag){ const l = label(o.tag, { size:.38, bg:o.color, fg:"#fff" }); l.position.y = 1.65; g.add(l); }
		}
		return g;
	}
	function addToken(id, kind, o, slot, from){
		const g = new THREE.Group(), inner = tokenMesh(kind, o); g.add(inner); scene.add(g);
		const hit = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), new THREE.MeshBasicMaterial({ visible:false })); hit.position.y = .5; hit.userData.tok = id; g.add(hit);
		const t = { id, g, inner, hit, slot:new THREE.Vector3(slot[0], 0, slot[1]), state:"flying", data:o, kind };
		TOK.set(id, t);
		if(from){ g.position.copy(from); flyTo(t, t.slot, { h:2.2, spin:kind === "plane" ? 0 : 1, done:() => t.state = "ready" }); }
		else { g.position.copy(t.slot); popIn(g); t.state = "ready"; }
		return t;
	}
	function removeToken(id, fade = true){ const t = TOK.get(id); if(!t) return; TOK.delete(id); if(fade) popOut(t.g, () => { t.g.parent && t.g.parent.remove(t.g); }); else t.g.parent && t.g.parent.remove(t.g); }
	function clearTokens(){ for(const id of [...TOK.keys()]) removeToken(id); select(null); }
	function flyTo(t, to, o = {}){
		t.state = "flying";
		const from = t.g.position.clone(), d = from.distanceTo(to), h = o.h ?? (.8 + d*.18), dur = o.dur || (420 + d*32);
		const fx = t.kind === "plane";
		anim(dur, k => {
			t.g.position.lerpVectors(from, to, k); t.g.position.y += h*4*k*(1 - k);
			if(fx){ t.inner.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) + Math.PI; t.inner.rotation.z = Math.sin(k*Math.PI)*.4; }
			else t.inner.rotation.y = k*Math.PI*2*(o.spin ?? 1);
		}, () => { t.inner.rotation.z = 0; o.done && o.done(); });
	}
	function back(t, delay = 600){
		setTimeout(() => { if(!TOK.has(t.id) || t.g.parent !== scene) return; flyTo(t, t.slot, { h:1.2, spin:.5, done:() => { t.state = "ready"; t.inner.rotation.set(0, 0, 0); } }); }, delay);
	}

	/* --- les cibles --- */
	const TARGETS = new Map();     // id → { pos(), r, hit }
	function setTargets(list){
		for(const T of TARGETS.values()) scene.remove(T.hit);
		TARGETS.clear();
		for(const T of list){
			const hit = new THREE.Mesh(new THREE.SphereGeometry(T.r, 10, 8), new THREE.MeshBasicMaterial({ visible:false }));
			hit.userData.target = T.id; scene.add(hit); TARGETS.set(T.id, { ...T, hit });
		}
	}

	/* --- le geste : saisir un objet, le lancer d'un coup de doigt (ou toucher l'objet puis sa cible) --- */
	const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmp = new THREE.Vector3();
	let grab = null, samples = [], selected = null, onThrow = null, enabled = true;
	const ring = mesh(new THREE.TorusGeometry(1.05, .07, 8, 40), new THREE.MeshBasicMaterial({ color:"#ffd77a" })); ring.rotation.x = Math.PI/2; ring.visible = false; ring.castShadow = false; scene.add(ring);
	function setRay(e){ const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1); ray.setFromCamera(ndc, camera); }
	function onPlane(x, y, h = 0){ setRay({ clientX:x, clientY:y }); plane.constant = -h; return ray.ray.intersectPlane(plane, new THREE.Vector3()); }
	function select(t){ selected = t; ring.visible = !!t; }
	canvas.addEventListener("pointerdown", e => {
		if(!enabled) return;
		setRay(e);
		const hits = ray.intersectObjects([...TOK.values()].filter(t => t.state === "ready").map(t => t.hit));
		if(hits.length){
			grab = TOK.get(hits[0].object.userData.tok); samples = [[performance.now(), e.clientX, e.clientY]];
			controls.enabled = false; canvas.setPointerCapture(e.pointerId); grab.state = "held";
			return;
		}
		// toucher une cible après avoir choisi un objet
		if(selected && selected.state === "ready"){
			const th = ray.intersectObjects([...TARGETS.values()].map(T => T.hit))[0];
			if(th){ const t = selected; select(null); throwAt(t, TARGETS.get(th.object.userData.target)); }
		}
	});
	canvas.addEventListener("pointermove", e => {
		if(!grab) return;
		samples.push([performance.now(), e.clientX, e.clientY]); if(samples.length > 12) samples.shift();
		// l'objet suit un peu le doigt, comme une pièce qu'on tire avant de la lancer
		const p = onPlane(e.clientX, e.clientY, .4);
		if(p){ tmp.subVectors(p, grab.slot); tmp.y = 0; if(tmp.length() > 1.3) tmp.setLength(1.3); grab.g.position.set(grab.slot.x + tmp.x, .45, grab.slot.z + tmp.z); }
	});
	function release(e){
		if(!grab) return;
		const t = grab; grab = null; controls.enabled = true;
		const now = performance.now(), first = samples[0];
		samples.push([now, e.clientX, e.clientY]);
		const recent = samples.filter(s => now - s[0] < 130), s0 = recent[0] || samples[samples.length - 2] || first;
		const dist = Math.hypot(e.clientX - first[1], e.clientY - first[2]);
		if(dist < 12){ t.g.position.copy(t.slot); t.state = "ready"; select(selected === t ? null : t); return; }
		const dt = Math.max(16, now - s0[0]), speed = Math.hypot(e.clientX - s0[1], e.clientY - s0[2])/dt;
		const a = onPlane(s0[1], s0[2]), b = onPlane(e.clientX, e.clientY);
		if(!a || !b || speed < .15){ flyTo(t, t.slot, { h:.4, done:() => t.state = "ready" }); return; }
		const dir = b.sub(a); dir.y = 0; dir.normalize();
		const range = Math.max(1.5, Math.min(20, speed/(canvas.clientHeight/620)*6.5));
		const start = t.g.position.clone(); start.y = 0;
		// visée tolérante : la cible la plus proche du trajet, si le lancer passe assez près
		let best = null, bd = 1e9;
		for(const T of TARGETS.values()){
			const P = T.pos(); const v = new THREE.Vector3(P.x - start.x, 0, P.z - start.z), along = v.dot(dir);
			if(along <= .5) continue;
			const perp = Math.sqrt(Math.max(0, v.lengthSq() - along*along));
			if(perp < T.r + .7 && along < range + T.r + 3.5 && along > range*.35 && perp < bd){ bd = perp; best = T; }
		}
		select(null);
		if(best) return throwAt(t, best);
		// raté : l'objet retombe sur la table et revient à sa place
		const land = start.addScaledVector(dir, Math.min(range, 9));
		const q = Math.hypot(land.x/(RX - 1), land.z/(RZ - 1)); if(q > 1){ land.x /= q; land.z /= q; }
		land.y = 0;
		flyTo(t, land, { done:() => { onThrow && onThrow(t, null); back(t, 500); } });
	}
	canvas.addEventListener("pointerup", release);
	canvas.addEventListener("pointercancel", release);
	function throwAt(t, T){
		const P = T.pos().clone();
		flyTo(t, P, { done:() => {
			const keep = onThrow ? onThrow(t, T.id) : false;
			if(!keep){ anim(260, k => t.g.position.y = P.y + Math.sin(k*Math.PI)*.6); back(t, 450); }
		} });
	}
	function attach(t, parent, local, scale = 1){
		t.state = "placed"; parent.attach(t.g); t.g.updateMatrixWorld();
		const from = t.g.position.clone();
		anim(260, k => { t.g.position.lerpVectors(from, local, k); t.g.scale.setScalar(1 + (scale - 1)*k); });
		t.inner.rotation.set(0, 0, 0);
	}

	/* --- caméra : des vues posées pour chaque moment --- */
	const VIEWS = {
		intro:[0, 16, 21, 0, 1, -2], tri:[0, 16, 18.5, 0, -.4, -1], balance:[0, 13.5, 21, 0, 4.2, -3.6],
		equipe:[0, 10.5, 19, 0, 3.4, -4.2], communique:[0, 12, 18.5, 0, 1.8, -2.6], end:[0, 18, 23, 0, 1, -3]
	};
	let cam = null;
	function look(k){ const v = VIEWS[k]; cam = { k:0, p0:camera.position.clone(), t0:controls.target.clone(), p1:new THREE.Vector3(v[0], v[1], v[2]), t1:new THREE.Vector3(v[3], v[4], v[5]) }; }

	/* --- boucle --- */
	let raf = 0, last = performance.now();
	function loop(now){
		raf = requestAnimationFrame(loop);
		const dt = Math.min(.05, (now - last)/1000); last = now;
		for(let i = anims.length - 1; i >= 0; i--){
			const a = anims[i], k = Math.min(1, (now - a.t0)/a.dur); if(k < 0) continue;
			a.fn(k); if(k >= 1){ anims.splice(i, 1); a.done && a.done(); }
		}
		// la balance : un ressort amorti vers l'angle donné par les poids
		omega += ((thTarget - theta)*16 - omega*2.6)*dt; theta += omega*dt; beam.rotation.z = theta;
		for(const s of ["A", "B"]) panPos(s, pans[s].g.position);
		// les objets prêts à lancer flottent doucement ; l'objet choisi est cerclé
		for(const t of TOK.values()) if(t.state === "ready"){ t.g.position.y = .08 + Math.abs(Math.sin(now/420 + t.slot.x))*.12; }
		if(selected){ ring.position.set(selected.g.position.x, .06, selected.g.position.z); ring.scale.setScalar(1 + .1*Math.sin(now/170)); }
		for(const T of TARGETS.values()) T.hit.position.copy(T.pos());
		for(const id in PEOPLE){ const p = PEOPLE[id]; if(p.mood.visible) p.mood.rotation.z += dt*2; }
		if(cam){ cam.k = Math.min(1, cam.k + dt/1.2); const e = ease(cam.k); camera.position.lerpVectors(cam.p0, cam.p1, e); controls.target.lerpVectors(cam.t0, cam.t1, e); if(cam.k >= 1) cam = null; }
		controls.update();
		renderer.render(scene, camera);
	}
	let VD = 0, VW = 1, VH = 1;
	function reserve(px){ VD = px; camera.setViewOffset(VW, VH + VD, 0, VD, VW, VH); camera.updateProjectionMatrix(); }
	function resize(w, h){
		VW = w; VH = h;
		const ls = w < 600 ? 1.35 : 1;
		if(ls !== LS){ LS = ls; scene.traverse(o => { if(o.isSprite && o.userData.base) o.scale.copy(o.userData.base).multiplyScalar(LS); }); }
		renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px"; camera.aspect = w/h; camera.fov = w/h < .9 ? 56 : 38; reserve(VD);
	}
	camera.position.set(0, 15, 19); controls.target.set(0, 1, -2);
	for(const g of [bal, pans.A.g, pans.B.g, dossier, bin, ...Object.values(BUSTS).map(b => b.g)]) g.visible = false;
	raf = requestAnimationFrame(loop);
	return {
		camera, scene, ray, resize, reserve, look, popIn, popOut, shake, nod, anim,
		addToken, removeToken, clearTokens, flyTo, back, attach, setTargets, TOK,
		set onThrow(f){ onThrow = f; }, set enabled(v){ enabled = v; if(!v){ grab = null; select(null); controls.enabled = true; } },
		dossier, bin, pans, panPos, setWeights, panLabel, showBalance, ingot, BUSTS, bustHead,
		PEOPLE, seat, leave, mood, personPos, board, boardSlots, boardLeg, boardReset, boardWobble, boardPublish, boardTilt,
		dispose(){ cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material && o.material.map) o.material.map.dispose(); }); }
	};
}

/* ================= le contenu ================= */
const MESSAGES = {
	fait:[
		{ who:"Karim · Qualité", col:"#2c5f9e", t:"Contrôle du lot B : 15 % des boîtes sont mal scellées. Le chocolat a pu blanchir." },
		{ who:"Léa · Service client", col:"#2f8a5b", t:"230 réclamations en 24 h, toutes enregistrées dans le logiciel du SAV." },
		{ who:"Sami · Logistique", col:"#c9822e", t:"Le reste du lot B est bloqué en entrepôt : 4 200 boîtes isolées." },
		{ who:"Nadia · Comptabilité", col:"#7a3e8f", t:"Le lot B représente 38 000 € de chiffre d'affaires, factures à l'appui." }
	],
	rumeur:[
		{ who:"Anonyme", col:"#6a6660", t:"J'ai lu sur les réseaux qu'on allait TOUS être licenciés demain !!" },
		{ who:"Compte inconnu", col:"#b3261e", t:"Paraît que le patron aurait déjà vendu l'usine en douce 😱" },
		{ who:"Un influenceur", col:"#c2547a", t:"Ce chocolat serait DANGEREUX, je le sens. Partagez !" },
		{ who:"Le cousin d'un collègue", col:"#8a857a", t:"Les machines sont pourries depuis des années, tout le monde le sait." }
	]
};
const PHILO = {
	kant:    { n:"K", name:"Kant", col:"#3e6fb0", side:"A", w:2, t:"Dire la vérité est un devoir, même quand elle coûte cher.", why:"Pour Kant, le devoir de vérité ne dépend pas des conséquences : il pèse pour le rappel." },
	weber:   { n:"W", name:"Weber", col:"#7a6a3a", side:"A", w:1.5, t:"Éthique de responsabilité : tu réponds des conséquences prévisibles, même improbables.", why:"La responsabilité, chez Weber, c'est répondre de ce qui peut arriver : elle plaide pour le rappel." },
	mill:    { n:"M", name:"Mill", col:"#2f8a5b", side:"B", w:1.5, t:"Inquiéter des milliers de clients pour 15 % de boîtes abîmées, est-ce le plus grand bien ?", why:"Mill compte les effets sur le bien-être de tous : ici, son calcul plaide pour attendre." },
	aristote:{ n:"A", name:"Aristote", col:"#c0612b", side:"B", w:1, t:"La prudence, c'est délibérer avant d'agir : une analyse de plus évite une panique.", why:"La prudence d'Aristote (la phronèsis) invite à délibérer d'abord : elle plaide pour attendre." }
};
const EVENTS = [
	{ k:"video", side:"A", w:1.5, icon:"📱", t:"Une vidéo devient virale", d:"Une cliente filme une boîte ouverte, chocolat blanchi. 80 000 vues en une heure." },
	{ k:"labo", side:"B", w:1, icon:"🧪", t:"Le labo rassure", d:"Premières analyses : le chocolat blanchi est moche, mais sans danger pour la santé." }
];
const TEAM = {
	chloe:{ name:"Chloé", role:"chargée de communication", col:"#4a78c8", need:"empathique",
		msg:"C'est la cata, la presse nous appelle sans arrêt… Qu'est-ce qu'on fait ?!",
		calm:"Merci… ça me rassure. Je m'occupe de canaliser les appels.", quit:"Je ne me sens pas soutenue du tout. Je sors prendre l'air." },
	marc:{ name:"Marc", role:"chef d'atelier", col:"#c4532f", need:"ferme",
		msg:"C'est la faute de la qualité, point. Je REFUSE de porter le chapeau !",
		calm:"Ok, reçu. On arrête de chercher un coupable, je retourne à l'atelier.", quit:"Si on me ménage comme ça, autant que je parte." },
	ines:{ name:"Inès", role:"conseillère au service client", col:"#2f8a5b", need:"rationnel",
		msg:"Je ne sais pas quoi répondre aux clients, c'est flou pour moi.",
		calm:"Parfait, c'est limpide. Je briefe l'équipe du service client.", quit:"Je suis encore plus perdue… Je ne peux pas travailler comme ça." }
};
const TONES = {
	empathique:{ n:"♥", tag:"Empathique", col:"#c2547a" },
	rationnel: { n:"≡", tag:"Rationnel", col:"#2c5f9e" },
	ferme:     { n:"!", tag:"Ferme", col:"#22364d" }
};
const REPLIES = {
	chloe:{ empathique:"Je comprends ton stress, Chloé, on est ensemble. Respire : j'ai un plan, et je prends la presse en charge.",
		rationnel:"Voici les faits : 15 % de défauts sur le lot B, déjà isolé. On applique le protocole, étape par étape.",
		ferme:"Calme-toi et applique les consignes. Ce n'est pas le moment de paniquer." },
	marc:{ empathique:"Je comprends ta frustration. Ce n'est la faute de personne, on est tous un peu responsables…",
		rationnel:"Analysons les responsabilités à partir des données, sans accusation hâtive.",
		ferme:"Stop, Marc. On ne cherche pas un coupable, on agit. Chacun assume sa part, maintenant." },
	ines:{ empathique:"Ne t'inquiète pas, Inès, tout va bien se passer, fais-toi confiance…",
		rationnel:"La marche à suivre : 1) reconnaître le défaut, 2) proposer le remboursement, 3) rassurer. C'est clair ?",
		ferme:"Applique la procédure standard, sans discuter." }
};
const FRAGS = recall => [
	{ id:"a", good:"pathos", t:"Nous comprenons votre déception et la prenons au sérieux." },
	{ id:"b", good:"logos", t:recall ? "Le lot B est retiré de la vente : 15 % de ses boîtes étaient mal scellées." : "15 % des boîtes du lot B étaient mal scellées ; le reste du lot est bloqué et analysé." },
	{ id:"c", good:"ethos", t:"Nous remboursons chaque boîte, car votre confiance passe avant tout." },
	{ id:"x", bad:"Déni", t:"Il n'y a aucun problème : ce sont des rumeurs malveillantes.", why:"Nier un défaut avéré, c'est perdre toute crédibilité dès la prochaine vidéo." },
	{ id:"y", bad:"Mensonge", t:"Nos chocolats sont parfaits et certifiés sans aucun défaut.", why:"Le contrôle qualité dit le contraire : un mensonge finit toujours par se savoir." },
	{ id:"z", bad:"Agressivité", t:"Ceux qui se plaignent n'avaient qu'à bien conserver leurs boîtes.", why:"Accuser les clients transforme un incident en scandale." }
];
const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const STARS = n => "★".repeat(n) + "☆".repeat(3 - n);
const VERDICT = ["", "À retravailler", "Bien vu", "Excellent"];
const LAMBERT = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#22364d"/><path d="M11 60c2-12 10-17 21-17s19 5 21 17" fill="#c08a2e"/><path d="M27 43l5 6 5-6" fill="#fffcf3"/><circle cx="32" cy="27" r="11" fill="${SKIN}"/><path d="M20 28c-1-11 6-17 13-17s13 6 11 17c-2-6-6-9-12-9s-10 3-12 9z" fill="#5a3520"/><path d="M20 28c-2 6-1 12 2 15l2-10z" fill="#5a3520"/><circle cx="28" cy="27" r="1.4" fill="#222"/><circle cx="36" cy="27" r="1.4" fill="#222"/><path d="M28.5 32.5c2 1.6 5 1.6 7 0" stroke="#8a3b2b" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;

/* ================= le jeu ================= */
export function openCrise({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const T = mountTable({
		id:"cr", label:"Cellule de crise", hint:"👆 Lance les objets d'un coup de doigt",
		theme:{ bg:"#1c2430", paper:"#fffcf3", paper2:"#f3eee4", ink:"#26303a", dark:"#22364d", accent:"#c08a2e", accentInk:"#8a5e14", gold:"#d9b25a", line:"#ddd6c8" },
		mentor:{ name:"Mme Lambert · DRH", svg:LAMBERT }, timeline:TIMELINE, extraCSS:EXTRA_CSS,
		meters:[
			{ k:"crise", label:"Crise", icon:"🔥", cls:"crise", fmt:v => Math.round(v) + " %" },
			{ k:"clim", label:"Équipe", icon:"🤝", cls:"clim", fmt:v => Math.round(v) + " / 100" },
			{ k:"stars", label:"Discernement", icon:"★", cls:"st", fmt:v => Math.round(v) + " ★" }
		]
	});
	T.onClose(() => { clearInterval(clockT); onClose && onClose(); });
	const W = world(T.canvas); T.bind(W);
	const { later, say, show, meter, card } = T;
	const S = { crise:75, clim:60, done:{}, learned:new Set(), recall:null, used:{} };
	const setM = (k, v) => { S[k] = Math.max(0, Math.min(100, v)); meter(k, S[k]); };
	const bump = (k, d) => setM(k, S[k] + d);
	meter("crise", S.crise); meter("clim", S.clim); meter("stars", 0);
	const totalStars = () => Object.values(S.done).reduce((a, b) => a + b, 0);
	const course = k => { S.learned.add(k); const [n, t] = COURSES[k]; return `<div class="tb-course"><span class="tag">📚 Au programme de la licence</span><b>${n}</b><span>${t}</span></div>`; };
	const slots = n => Array.from({ length:n }, (_, i) => [(i - (n - 1)/2)*Math.min(2.7, 14/n), 2.8]);
	const live = html => { const el = card.querySelector("[data-live]"); if(el) el.innerHTML = html; };
	let clockT = 0;
	function stage(text, step){ T.stage(text, step); W.look(step); onEvent && onEvent("stage", text); }
	function verdict(key, stars, txt){
		S.done[key] = stars; meter("stars", totalStars());
		play(stars === 3 ? "good" : stars === 2 ? "chime" : "bad");
		if(stars === 1) onEvent && onEvent("err");
		return `<div class="tb-verdict s${stars}"><span class="st">${STARS(stars)}</span>${VERDICT[stars]}</div><p class="tb-p">${txt}</p>`;
	}

	/* ---------- intro ---------- */
	function intro(){
		W.clearTokens(); W.setTargets([]); W.onThrow = null;
		stage("Cellule de crise", "intro"); T.showHint("");
		later(700, () => say("Merci d'être venu si vite. On a un vrai problème : je vous explique."));
		show(`<div class="tb-k">Mini-jeu · ${formation.name}</div><h2 class="tb-h">La cellule de crise</h2>
			<p class="tb-p"><b>Lundi, 8 h.</b> Une vidéo tourne sur les réseaux : des boîtes de la <b>Chocolaterie Verbrugge</b> (fictive, Roubaix) arrivent abîmées chez les clients. Le bad buzz monte.</p>
			<p class="tb-p">Dans la salle du conseil, tu diriges la cellule de crise avec Mme Lambert, la DRH. Quatre moments : <b>trier l'info</b>, <b>décider</b>, <b>tenir l'équipe</b>, <b>parler au public</b>.</p>
			<div class="cr-gesture"><span>👆</span>Un seul geste : prends un objet posé sur la table et lance-le d'un coup de doigt vers sa cible.</div>
			<ul class="tb-list"><li><span>🔥</span>La crise doit redescendre</li><li><span>🤝</span>L'équipe doit tenir</li><li><span>★</span>Ton discernement, moment par moment</li></ul>
			<p class="tb-p"><small>D'après un exercice de la Licence Management & Humanités. Entreprise, personnes et chiffres fictifs.</small></p>
			<button class="tb-go" data-a="tri">Entrer dans la cellule</button>`);
	}

	/* ---------- moment 1 : trier l'info ---------- */
	function tri(){
		W.clearTokens(); W.showBalance(false); W.board.visible = false;
		for(const g of [W.dossier, W.bin]) W.popIn(g);
		stage("1 · Trier l'info", "tri"); T.showHint("👆 Lance chaque message vers le dossier ou la corbeille");
		say("Les messages pleuvent. Avant d'agir, on trie : les faits au dossier, les rumeurs à la corbeille.");
		const queue = shuffle([...shuffle(MESSAGES.fait.slice()).slice(0, 3).map(m => ({ ...m, type:"fait" })), ...shuffle(MESSAGES.rumeur.slice()).slice(0, 3).map(m => ({ ...m, type:"rumeur" }))]);
		queue.forEach((m, i) => m.n = String(i + 1));
		const st = { errors:0, sorted:0, onTable:[], free:[0, 1, 2], spawned:0 };
		const pos = [[-3.8, 3.2], [0, 3.6], [3.8, 3.2]];
		show(`<span class="tb-year">Lundi · 8 h 05</span><h2 class="tb-h">Faits ou rumeurs ?</h2>
			<div class="tb-story">Les messages arrivent en avions de papier. Lis chacun, puis lance-le vers sa place. Un fait est sourcé, daté ou chiffré ; une rumeur, non.</div>
			<div class="cr-legend"><span class="l">📁 Dossier · fait vérifié</span><span class="r">🗑 Corbeille · rumeur</span></div>
			<div data-live></div>`);
		const render = () => live(`<ul class="cr-msgs">${queue.filter(m => m.shown).map(m => `<li class="${m.done ? "done" : ""}"><i style="background:${m.col}">${m.n}</i><span><b>✈ ${m.who}</b>${m.t}</span></li>`).reverse().join("")}</ul>
			<p class="tb-p" style="font-weight:800">${st.sorted} / ${queue.length} messages triés${st.errors ? ` · ${st.errors} erreur${st.errors > 1 ? "s" : ""}` : ""}</p>`);
		function spawn(){
			if(T.closed || st.spawned >= queue.length || !st.free.length) return;
			const m = queue[st.spawned++], k = st.free.shift(); m.slot = k; m.shown = true;
			W.addToken("msg" + m.n, "plane", { color:m.col, n:m.n, msg:m }, pos[k], new THREE.Vector3((Math.random() - .5)*10, 9, -16));
			play("pop"); render();
			if(st.free.length) later(1400, spawn);
		}
		W.setTargets([
			{ id:"fait", r:2, pos:() => new THREE.Vector3(W.dossier.position.x, 1.6, W.dossier.position.z) },
			{ id:"rumeur", r:1.8, pos:() => new THREE.Vector3(W.bin.position.x, 1.9, W.bin.position.z) }
		]);
		W.onThrow = (t, target) => {
			if(!target){ play("pop"); return false; }
			const m = t.data.msg;
			if(m.type === target){
				W.attach(t, scene(target), new THREE.Vector3(0, 1, 0), .4); later(300, () => W.removeToken(t.id));
				W.shake(target === "fait" ? W.dossier : W.bin);
				m.done = true; st.sorted++; st.free.push(m.slot); bump("crise", -3); play("good");
				render(); later(700, spawn);
				if(st.sorted === queue.length) later(900, endTri);
				return true;
			}
			st.errors++; bump("crise", 4); play("bad"); onEvent && onEvent("err");
			say(m.type === "rumeur" ? "Attention : pas de source, pas de preuve. Une rumeur ne va pas au dossier." : "Ce message est sourcé et chiffré : c'est un fait vérifié, on le garde.");
			render(); return false;
		};
		const scene = k => k === "fait" ? W.dossier : W.bin;
		later(800, spawn);
		function endTri(){
			W.onThrow = null; T.showHint("");
			const stars = st.errors === 0 ? 3 : st.errors <= 2 ? 2 : 1;
			say(stars === 3 ? "Impeccable : on sait enfin de quoi on parle." : "C'est trié. Retenez le réflexe : une info sans source attend qu'on la vérifie.");
			live(`${verdict("tri", stars, `Les faits tiennent en trois lignes : <b>15 % des boîtes du lot B</b> sont mal scellées, <b>230 réclamations</b> sont arrivées, le reste du lot est bloqué. Le reste n'était que bruit.`)}
				${course("erreur")}${course("stats")}<button class="tb-go" data-a="balance">2 · Décider →</button>`);
			T.scrollEnd();
		}
	}

	/* ---------- moment 2 : décider, sur la balance ---------- */
	function balance(){
		W.clearTokens(); for(const g of [W.dossier, W.bin]) if(g.visible) W.popOut(g);
		W.showBalance(true); W.panLabel("A", "A · Rappeler le lot"); W.panLabel("B", "B · Attendre les analyses");
		stage("2 · Décider", "balance"); T.showHint("👆 Lance chaque argument dans le plateau qu'il défend");
		say("Faut-il rappeler tout le lot ? Les chiffres pèsent déjà. À vous d'y ajouter des arguments.");
		const st = { A:0, B:0, contre:0, used:0, ev:null };
		const add = (s, w) => { st[s] += w; W.setWeights(st.A, st.B); render(); };
		later(500, () => { W.ingot("B", "Rappel : −60 000 €"); add("B", 2); play("pop"); });
		later(1100, () => { W.ingot("A", "230 réclamations"); add("A", 1.5); play("pop"); });
		const ids = shuffle(Object.keys(PHILO));
		ids.forEach((k, i) => later(1500 + i*260, () => { const P = PHILO[k]; W.addToken("ph" + k, "medal", { color:P.col, n:P.n, tag:P.name, k }, slots(4)[i], W.bustHead(k)); W.nod(W.BUSTS[k].head); play("pop"); }));
		const state = {};
		show(`<span class="tb-year">Lundi · 10 h</span><h2 class="tb-h">Rappeler le lot ?</h2>
			<div class="tb-story">Rappeler les 4 200 boîtes déjà vendues coûte <b>60 000 €</b> et fait parler. Attendre les analyses, c'est prendre un risque. Les philosophes du conseil t'ont chacun confié un argument : <b>lance-le dans le plateau qu'il défend</b>. Trois arguments au plus.</div>
			<div data-live></div><button class="tb-go" data-a="trancher" disabled>Le conseil tranche</button>`);
		const btn = () => card.querySelector('[data-a="trancher"]');
		function render(){
			live(`<div class="cr-weights"><span class="a">A · Rappeler : ${st.A.toLocaleString("fr-FR")}</span><span class="b">B · Attendre : ${st.B.toLocaleString("fr-FR")}</span></div>
				${st.ev ? `<div class="cr-ev"><i>${st.ev.icon}</i><span><b>${st.ev.t}</b><small>${st.ev.d}</small></span></div>` : ""}
				${ids.map(k => { const P = PHILO[k], s = state[k]; return `<div class="cr-tok ${s === "ok" ? "ok" : s === "ko" ? "ko" : st.used >= 3 && !s ? "off" : ""}"><i style="background:${P.col}">${P.n}</i><span><b>${P.name}</b>${P.t}${s === "ok" ? `<small>✓ Dans le plateau ${P.side}</small>` : s === "ko" ? `<small>✗ Contresens : ${P.why}</small>` : ""}</span></div>`; }).join("")}`);
			const b = btn(); if(b) b.disabled = !(st.used >= 2 && st.ev);
		}
		W.setTargets(["A", "B"].map(s => ({ id:s, r:1.9, pos:() => W.panPos(s).add(new THREE.Vector3(0, .5, 0)) })));
		W.onThrow = (t, target) => {
			if(!target) return false;
			const k = t.data.k, P = PHILO[k];
			if(st.used >= 3){ say("Trois arguments suffisent : le conseil n'a pas toute la journée."); return false; }
			if(P.side === target){
				const p = W.pans[target];
				W.attach(t, p.stack, new THREE.Vector3((p.n % 2 ? -.45 : .45), .2 + p.n*.3, .2), .7); p.n++;
				state[k] = "ok"; st.used++; add(target, P.w); W.nod(W.BUSTS[k].head); play("good");
				if(st.used === 2 && !st.ev) later(900, coup);
				if(st.used >= 3) for(const x of W.TOK.values()) if(x.state === "ready") W.removeToken(x.id);
				return true;
			}
			state[k] = "ko"; st.contre++; W.shake(W.BUSTS[k].head); play("bad"); onEvent && onEvent("err");
			say(`${P.name} ne dirait pas ça : ${P.why}`); render();
			return false;
		};
		function coup(){
			const E = pick(EVENTS); st.ev = E; play("chime");
			say(`Coup du sort : ${E.t.toLowerCase()} !`);
			W.ingot(E.side, E.icon + " " + E.t, "#4a4f58", 1.1); add(E.side, E.w);
			T.scrollEnd();
		}
		state.trancher = () => {
			W.onThrow = null; W.clearTokens(); T.showHint("");
			const side = st.A === st.B ? "A" : st.A > st.B ? "A" : "B"; S.recall = side === "A";
			const stars = st.contre === 0 ? 3 : st.contre === 1 ? 2 : 1;
			let txt, dc;
			if(side === "A"){ dc = -20; txt = "Le conseil rappelle le lot. 60 000 € de perdus et une journée difficile… mais on reprend la main : le rappel est annoncé avant que la presse ne le découvre."; bump("clim", 5); }
			else if(Math.random() < .5){ dc = -6; txt = "Le conseil attend. Les analyses reviennent rassurantes : le chocolat blanchi est sans danger. Le pari est passé, cette fois. Personne n'en saura rien… sauf l'équipe qualité, qui a compris le message."; }
			else { dc = 15; txt = "Le conseil attend… et une seconde vidéo sort le soir même. Le rappel arrive sous la contrainte, coûte 110 000 € et fait la une. Attendre avait un prix."; bump("clim", -10); }
			bump("crise", dc);
			say(side === "A" ? "Décision prise. Weber dirait : on a répondu des conséquences." : "Décision prise. Décider sans tout savoir, c'est le principe d'incertitude.");
			card.querySelector('[data-a="trancher"]').remove();
			live(`<div class="cr-weights"><span class="a">A · Rappeler : ${st.A.toLocaleString("fr-FR")}</span><span class="b">B · Attendre : ${st.B.toLocaleString("fr-FR")}</span></div>
				<div class="tb-story"><b>${side === "A" ? "Le lot est rappelé." : "Le conseil attend les analyses."}</b> ${txt}</div>
				${verdict("balance", stars, stars === 3 ? "Tu as lu chaque philosophe sans contresens : les arguments étaient à leur place." : "Un philosophe mal compris pèse du mauvais côté. Relis son principe : c'est lui qui dit de quel côté il penche.")}
				${course("couts")}${course("ethique")}${course("incert")}<button class="tb-go" data-a="equipe">3 · Tenir l'équipe →</button>`);
			T.scrollEnd();
		};
		trancherFn = state.trancher;
	}
	let trancherFn = null;

	/* ---------- moment 3 : tenir l'équipe ---------- */
	function equipe(){
		W.clearTokens(); W.showBalance(false);
		stage("3 · L'équipe", "equipe"); T.showHint("👆 Lance la réponse au bon ton vers ton collègue");
		const order = shuffle(Object.keys(TEAM)), st = { i:0, ok:0, res:{} };
		order.forEach((id, i) => later(200 + i*250, () => W.seat(id, true)));
		say("L'équipe arrive, sous tension. À chacun sa façon d'être aidé : écoutez avant de répondre.");
		show(`<span class="tb-year">Lundi · 11 h 30</span><h2 class="tb-h">Tenir l'équipe</h2>
			<div class="tb-story">Trois collègues t'interpellent, l'un après l'autre. Pour chacun, trois réponses sont posées devant toi : <b>empathique</b>, <b>rationnelle</b> ou <b>ferme</b>. Lance la bonne vers la personne qui parle, avant la fin du temps.</div>
			<div data-live></div>`);
		W.setTargets(order.map(id => ({ id, r:1.4, pos:() => W.personPos(id) })));
		function next(){
			clearInterval(clockT);
			if(st.i >= order.length) return later(700, endEquipe);
			const id = order[st.i], P = TEAM[id];
			W.clearTokens(); order.forEach(x => W.mood(x, null)); W.mood(id, "#ffd77a"); W.nod(W.PEOPLE[id].head); play("pop");
			later(400, () => shuffle(Object.keys(TONES)).forEach((k, i) => W.addToken("tone" + k, "medal", { color:TONES[k].col, n:TONES[k].n, tag:TONES[k].tag, tone:k }, slots(3)[i])));
			let left = 25;
			const draw = () => live(`<div class="cr-says"><b style="color:${P.col}">${P.name} · ${P.role}</b>« ${P.msg} »</div>
				<div class="cr-clock"><i style="width:${left/25*100}%"></i></div><p class="tb-p" style="font-size:12.5px;font-weight:800;margin:0 0 6px">${Math.ceil(left)} s</p>
				${Object.keys(TONES).map(k => `<div class="cr-tok"><i style="background:${TONES[k].col}">${TONES[k].n}</i><span><b>${TONES[k].tag}</b>${REPLIES[id][k]}</span></div>`).join("")}`);
			draw();
			clockT = setInterval(() => { if(T.closed) return clearInterval(clockT); left -= .1; const bar = card.querySelector(".cr-clock i"); if(bar) bar.style.width = Math.max(0, left/25*100) + "%"; const s = card.querySelector(".cr-clock + p"); if(s) s.textContent = Math.max(0, Math.ceil(left)) + " s";
				if(left <= 0){ clearInterval(clockT); answer(id, null); } }, 100);
			W.onThrow = (t, target) => {
				if(!target) return false;
				if(target !== id){ say(`Ce n'est pas ${TEAM[target].name} qui parle : réponds à ${P.name}.`); return false; }
				W.attach(t, W.PEOPLE[id].g, new THREE.Vector3(0, -1.2, .6), .3); later(250, () => W.removeToken(t.id));
				answer(id, t.data.tone); return true;
			};
		}
		function answer(id, tone){
			clearInterval(clockT); W.onThrow = null;
			for(const x of W.TOK.values()) if(x.state === "ready") W.removeToken(x.id);
			const P = TEAM[id], good = tone === P.need; st.res[id] = good;
			if(good){ st.ok++; bump("clim", 8); bump("crise", -5); W.mood(id, "#3fbf7f"); W.nod(W.PEOPLE[id].head); play("good"); }
			else { bump("clim", -15); bump("crise", 5); W.mood(id, "#ef4d5e"); W.shake(W.PEOPLE[id].head); play("bad"); onEvent && onEvent("err"); later(900, () => W.leave(id)); }
			const reply = tone ? REPLIES[id][tone] : "…";
			live(`<div class="cr-says"><b style="color:${P.col}">${P.name}</b>« ${P.msg} »</div>
				<div class="cr-says" style="border-color:#c08a2e"><b style="color:#8a5e14">Toi${tone ? " · " + TONES[tone].tag : " · trop tard"}</b>${tone ? "« " + reply + " »" : "Tu n'as pas répondu à temps."}</div>
				<div class="cr-says" style="border-color:${good ? "#3d7a55" : "#c4532f"}"><b style="color:${P.col}">${P.name}</b>« ${good ? P.calm : P.quit} »</div>
				${good ? "" : `<p class="tb-p">💡 ${P.name} avait besoin d'une réponse <b>${TONES[P.need].tag.toLowerCase()}</b>.</p>`}
				<button class="tb-go" data-a="nextcol">${st.i + 1 < order.length ? "Collègue suivant →" : "Faire le point →"}</button>`);
			say(good ? "Bien joué : le bon ton, au bon moment." : `${P.name} décroche. Le même message ne convient pas à tout le monde.`);
			st.i++;
		}
		nextCol = next;
		function endEquipe(){
			W.clearTokens(); T.showHint("");
			const stars = st.ok === 3 ? 3 : st.ok === 2 ? 2 : 1;
			say(stars === 3 ? "L'équipe est soudée. Maintenant, parlons au public." : "On a perdu du monde en route. Une équipe se tient personne par personne.");
			live(`${verdict("equipe", stars, `${st.ok} collègue${st.ok > 1 ? "s" : ""} sur 3 ${st.ok > 1 ? "sont restés" : "est resté"} dans la cellule. Rassurer Chloé, cadrer Marc, expliquer à Inès : le management humain se joue entre bienveillance et exigence.`)}
				${course("humain")}${course("rh")}<button class="tb-go" data-a="communique">4 · Le communiqué →</button>`);
			T.scrollEnd();
		}
		later(1200, next);
	}
	let nextCol = null;

	/* ---------- moment 4 : le communiqué ---------- */
	function communique(){
		W.clearTokens(); clearInterval(clockT);
		for(const id in W.PEOPLE) if(W.PEOPLE[id].g.visible) W.popOut(W.PEOPLE[id].g);
		W.boardReset(); W.popIn(W.board);
		stage("4 · Le communiqué", "communique"); T.showHint("👆 Lance trois fragments sur le communiqué");
		say("Dernière étape : le communiqué. Il ne tient debout que sur trois appuis : l'émotion, les faits, les valeurs.");
		const frags = shuffle(FRAGS(S.recall)), st = { placed:0, bad:0, roles:new Set() };
		frags.forEach((f, i) => f.n = String(i + 1));
		later(500, () => frags.forEach((f, i) => W.addToken("fr" + f.id, "card", { n:f.n, f }, slots(6)[i])));
		show(`<span class="tb-year">Lundi · 14 h</span><h2 class="tb-h">Parler au public</h2>
			<div class="tb-story">Compose le communiqué avec <b>trois fragments</b>. Aristote l'enseignait déjà : on convainc par l'émotion (<b>pathos</b>), par les faits (<b>logos</b>) et par la confiance qu'on inspire (<b>ethos</b>). Lance chaque bon fragment sur le panneau.</div>
			<div data-live></div>`);
		const render = msg => live(`<div class="cr-roles">${["pathos", "logos", "ethos"].map(k => `<span class="${st.roles.has(k) ? "on" : ""}">${k[0].toUpperCase() + k.slice(1)}</span>`).join("")}</div>
			${msg ? `<p class="tb-p" style="color:#b3261e;font-weight:800">${msg}</p>` : ""}
			<ul class="cr-msgs">${frags.map(f => `<li class="${f.placed ? "done" : ""}"><i style="background:#22364d">${f.n}</i><span>${f.t}</span></li>`).join("")}</ul>`);
		render();
		W.setTargets([{ id:"board", r:2.6, pos:() => new THREE.Vector3(W.board.position.x, 2.6, W.board.position.z + .3) }]);
		W.onThrow = (t, target) => {
			if(!target) return false;
			const f = t.data.f;
			if(f.good){
				W.attach(t, W.boardTilt, W.boardSlots[st.placed].clone().add(new THREE.Vector3(0, 0, 0)), 1); t.inner.rotation.x = Math.PI/2;
				f.placed = true; st.placed++; st.roles.add(f.good); W.boardLeg(f.good); bump("crise", -6); play("good");
				render(); if(st.placed === 3) later(700, publish);
				return true;
			}
			st.bad++; bump("crise", 5); W.boardWobble(); play("bad"); onEvent && onEvent("err");
			say(`${f.bad} : ${f.why}`); render(`${f.bad} ! ${f.why}`);
			return false;
		};
		function publish(){
			W.onThrow = null; W.clearTokens(); W.boardPublish(); T.showHint(""); play("win");
			const stars = st.bad === 0 ? 3 : st.bad === 1 ? 2 : 1;
			say("Publié. Un communiqué juste : il reconnaît, il explique, il répare.");
			live(`<div class="cr-roles"><span class="on">Pathos</span><span class="on">Logos</span><span class="on">Ethos</span></div>
				${verdict("communique", stars, `Le communiqué est en ligne : <i>« ${frags.filter(f => f.good).sort((a, b) => a.id.localeCompare(b.id)).map(f => f.t).join(" ")} »</i>`)}
				${course("persuader")}${course("comm")}${course("affaires")}<button class="tb-go" data-a="end">Voir le bilan →</button>`);
			T.scrollEnd();
		}
	}

	/* ---------- bilan ---------- */
	function finale(){
		W.clearTokens(); W.setTargets([]); clearInterval(clockT);
		W.popOut(W.board);
		for(const id in W.PEOPLE) if(!W.PEOPLE[id].gone) W.seat(id, true);
		stage("Bilan de la crise", "end");
		const st = totalStars(), max = 12;
		const [rank, line] = st >= 11 ? ["Directeur de crise", "Je n'aurais pas mieux fait. Vous avez du discernement."] : st >= 8 ? ["Manager confirmé", "Du bon travail. Quelques réflexes à affiner, et vous serez prêt."] : ["Manager en devenir", "Une crise, ça s'apprend. Rejouez : les messages et les coups du sort changent."];
		onEvent && onEvent("win", rank); play("win");
		later(500, () => say(line));
		const order = Object.keys(COURSES).filter(k => S.learned.has(k));
		show(`<div class="tb-k">${formation.name} · bilan</div><h2 class="tb-h">Crise maîtrisée ?</h2>
			<p class="tb-p" style="text-align:center;font-size:16px">Tu es <b>${rank}</b><br><span style="font-size:22px;color:#c08a2e">${st} / ${max} ★</span></p>
			<ul class="tb-sim"><li><span>🔥 Niveau de crise</span><b>${Math.round(S.crise)} %</b></li><li><span>🤝 Climat d'équipe</span><b>${Math.round(S.clim)} / 100</b></li><li><span>⚖ Décision</span><b>${S.recall ? "Rappel du lot" : "Attente des analyses"}</b></li></ul>
			<p class="tb-p">Trier l'information, décider sans tout savoir, parler juste à chacun, convaincre sans mentir : c'est le management éclairé que vise la licence, avec la gestion et la philosophie dans le même cursus. Tu as touché à :</p>
			<ul class="tb-list">${order.map(k => `<li><span>📚</span>${COURSES[k][0]}</li>`).join("")}</ul>
			${openLead ? `<button class="tb-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="tb-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Management & Humanités ↗</a>
			<button class="tb-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="tb-alt" data-a="replay">Rejouer : d'autres messages et d'autres coups du sort</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { tri, balance, equipe, communique, end:finale };
	T.root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a || a.disabled) return;
		const k = a.dataset.a; play("pop");
		if(k === "trancher") return trancherFn && trancherFn();
		if(k === "nextcol") return nextCol && nextCol();
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ T.close(); return openLead(); }
		if(k === "replay"){
			Object.assign(S, { crise:75, clim:60, done:{}, learned:new Set(), recall:null });
			meter("crise", 75); meter("clim", 60); meter("stars", 0);
			for(const id in W.PEOPLE){ W.PEOPLE[id].gone = false; W.PEOPLE[id].g.visible = false; }
			return intro();
		}
	});
	intro();
	onEvent && onEvent("start");
	// mode relecture : l'enseignant peut sauter directement à un moment
	onEvent && onEvent("missions", [["1 · Trier l'info", tri], ["2 · Décider", balance], ["3 · L'équipe", equipe], ["4 · Le communiqué", communique], ["Bilan", finale]]);
	if(window.campus) window.campus.game = { S, W, T, ...STEPS };
}
