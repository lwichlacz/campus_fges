/* « Mission Jardin Boulay » — mini-jeu de la Licence Sciences de la Vie.
   Le labo de licence fait l'inventaire du jardin botanique du campus :
   - L1 · terrain : trouver les petites bêtes cachées et les identifier avec une clé de détermination ;
   - L1 · écologie : construire le réseau trophique, prédire l'effet d'un insecticide ;
   - L2 · écologie quantitative : échantillonner une prairie par quadrats et estimer une population ;
   - L3 · génétique : refaire le croisement de Mendel et le vérifier en semant des graines.
   Les contenus sont volontairement simples et doivent être relus par un enseignant de la licence. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { std, mesh, box, cyl, cone, mulberry32 } from "../kit.js";

/* ---------- contenus (à valider par l'enseignant) ---------- */
const COURSES = {
	cle:    ["L1", "Biologie des organismes", "Classer le vivant : clés de détermination, embranchements, classes et ordres. Et beaucoup de terrain !"],
	reseau: ["L1", "Écologie", "Réseaux trophiques, flux d'énergie, et la lutte biologique pour protéger les cultures sans pesticides."],
	genet:  ["L2", "Génétique", "La transmission des caractères, de Mendel à l'ADN, et les tests statistiques pour vérifier une hypothèse."],
	quadrat:["L3", "Parcours Écologie opérationnelle", "Inventorier, échantillonner sans biais, estimer une population : le métier d'écologue de terrain."],
	biotech:["L3", "Parcours Biotechnologies", "Biologie moléculaire, microbiologie et bioprocédés : faire produire des molécules utiles par le vivant."],
	inge:   ["L3", "Parcours Ingénieur", "Modélisation, dimensionnement, génie des procédés : l'approche ingénieur appliquée au vivant, vers les écoles d'ingénieurs."]
};
// la spécialisation de L3 (une médaille par parcours)
export const PARCOURS = {
	eco:    { icon:"🌿", name:"Écologie opérationnelle", course:"quadrat", pitch:"Compter une population sauvage sans se tromper." },
	biotech:{ icon:"🧬", name:"Biotechnologies", course:"biotech", pitch:"Faire produire une enzyme par des bactéries, de la paillasse au bioréacteur." },
	inge:   { icon:"⚙️", name:"Ingénieur", course:"inge", pitch:"Concevoir et piloter la ferme urbaine du Palais Rameau." }
};
const SPECIES = {
	coccinelle:{ name:"Coccinelle à sept points", emoji:"🐞", taxon:"Insectes · ordre des Coléoptères", where:"sur le rosier",
		fact:"Une coccinelle dévore des dizaines de pucerons par jour : les jardiniers s'en servent comme insecticide naturel." },
	abeille:   { name:"Abeille domestique", emoji:"🐝", taxon:"Insectes · ordre des Hyménoptères", where:"au-dessus de la lavande",
		fact:"En butinant, elle transporte le pollen de fleur en fleur : c'est la pollinisation, indispensable à beaucoup de fruits." },
	araignee:  { name:"Épeire diadème", emoji:"🕷️", taxon:"Arachnides : ce n'est pas un insecte !", where:"sur la haie, dans sa toile",
		fact:"Huit pattes, pas d'antennes, pas d'ailes : l'araignée n'est pas un insecte, mais un arachnide." },
	lombric:   { name:"Lombric", emoji:"🪱", taxon:"Annélides (les vers de terre)", where:"près du compost",
		fact:"Il digère les feuilles mortes et aère le sol : un vrai laboureur, qui travaille gratuitement." },
	mesange:   { name:"Mésange bleue", emoji:"🐦", taxon:"Oiseaux · vertébrés", where:"dans un arbre",
		fact:"Au printemps, un couple de mésanges apporte des milliers de chenilles à ses petits." },
	herisson:  { name:"Hérisson d'Europe", emoji:"🦔", taxon:"Mammifères · vertébrés", where:"sous un buisson",
		fact:"Il chasse la nuit limaces, vers et insectes : un allié précieux du jardinier, et une espèce protégée." }
};
// clé de détermination (simplifiée) : chaque réponse mène à une question ou à une espèce
const KEY = {
	n0:{ q:"Son corps est couvert de…", opts:[["🪶 Plumes", "mesange"], ["🦔 Poils ou piquants", "herisson"], ["Ni l'un ni l'autre", "n1"]] },
	n1:{ q:"A-t-il des pattes ?", opts:[["Oui", "n2"], ["Non", "lombric"]] },
	n2:{ q:"Compte ses pattes : combien en a-t-il ?", opts:[["6 pattes", "n3"], ["8 pattes", "araignee"]] },
	n3:{ q:"Ses ailes de devant sont…", opts:[["Dures et colorées (des élytres)", "coccinelle"], ["Fines et transparentes", "abeille"]] }
};
const leadsTo = (node, sp) => node === sp || (KEY[node] && KEY[node].opts.some(o => leadsTo(o[1], sp)));
// réseau trophique : la flèche va de celui qui est mangé vers celui qui mange (le sens de l'énergie)
const WEB_NODES = {
	// [emoji, nom, x %, y %, « le … », « du … », « au … »]
	E:["🦅", "Épervier", 50, 9, "l'épervier", "de l'épervier", "à l'épervier"], M:["🐦", "Mésange", 26, 34, "la mésange", "de la mésange", "à la mésange"],
	H:["🦔", "Hérisson", 76, 34, "le hérisson", "du hérisson", "au hérisson"], C:["🐞", "Coccinelle", 14, 60, "la coccinelle", "de la coccinelle", "à la coccinelle"],
	P:["🟢", "Puceron", 42, 66, "le puceron", "du puceron", "au puceron"], L:["🪱", "Lombric", 78, 62, "le lombric", "du lombric", "au lombric"],
	R:["🌹", "Rosier", 30, 90, "le rosier", "du rosier", "au rosier"], F:["🍂", "Feuilles mortes", 76, 90, "les feuilles mortes", "des feuilles mortes", "aux feuilles mortes"]
};
const WEB_OK = new Set(["R>P", "P>C", "P>M", "C>M", "M>E", "F>L", "L>H", "C>H"]);
const WEB_NEED = [["R>P"], ["P>C"], ["P>M", "C>M"], ["M>E"], ["F>L"], ["L>H"]];

const CSS = `
.jd{position:fixed;inset:0;z-index:40;background:#a9c98f;font-family:Nunito,system-ui,sans-serif;color:#22301f;overflow:hidden;animation:jdIn .35s ease both}
@keyframes jdIn{from{opacity:0}to{opacity:1}}
.jd canvas.jd-3d{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.jd-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:3;pointer-events:none}
.jd-top>*{pointer-events:auto}
.jd-chip{background:rgba(250,252,244,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(20,40,10,.22);display:flex;gap:6px;align-items:center}
.jd-chip[hidden]{display:none}
.jd-stage{background:#2f6b45;color:#fff}
.jd-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(250,252,244,.95);font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(20,40,10,.22)}
.jd-coach{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:4;background:#fbfdf5;border-radius:16px;padding:11px 16px;font-weight:700;font-size:14px;box-shadow:0 10px 30px rgba(20,40,10,.3);max-width:min(520px,calc(100% - 24px));border-left:5px solid #7fb069}
.jd-coach[hidden]{display:none}
.jd-hint{position:absolute;right:12px;bottom:80px;z-index:4;border:0;border-radius:999px;padding:10px 14px;background:#fff7d6;font:800 14px Nunito,sans-serif;box-shadow:0 8px 20px rgba(20,40,10,.3);cursor:pointer}
.jd-hint[hidden]{display:none}
.jd-panel{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:12px;background:rgba(20,40,20,.3);overflow:auto}
.jd-panel[hidden]{display:none}
.jd-card{width:100%;max-width:470px;background:#fbfdf5;border-radius:24px;box-shadow:0 30px 80px rgba(10,30,10,.4);padding:20px 18px 18px;animation:jdUp .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes jdUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.jd-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2f6b45}
.jd-h{font:700 23px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px}
.jd-p{margin:0 0 12px;color:#4d5a48;font-size:14.5px}
.jd-go{display:block;width:100%;border:0;border-radius:16px;padding:14px;background:#2f6b45;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:10px;box-shadow:0 8px 20px rgba(47,107,69,.35);text-align:center;text-decoration:none}
.jd-go:disabled{opacity:.45;cursor:default}
.jd-alt{display:block;width:100%;border:2px solid #d5e3c6;border-radius:16px;padding:12px;background:#fff;color:#1e305e;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.jd-opts{display:grid;gap:7px}
.jd-opt{border:2px solid #d5e3c6;background:#fff;border-radius:14px;padding:11px 12px;font:800 15px Nunito,sans-serif;cursor:pointer;text-align:left;color:#22301f}
.jd-opt.ok{border-color:#3d7a55;background:#eef8f0}
.jd-opt.ko{border-color:#c4532f;background:#fdeceb}
.jd-draw{width:100%;height:auto;display:block;background:#f4f8ee;border:1px solid #d5e3c6;border-radius:16px;margin:4px 0 10px}
.jd-tax{background:#fff;border:2px solid #7fb069;border-radius:16px;padding:12px 14px;margin:6px 0}
.jd-tax b{display:block;font:700 18px Fraunces,Georgia,serif}
.jd-tax small{display:block;color:#2f6b45;font-weight:800;margin:2px 0 6px}
.jd-tax span{font-size:14px;color:#4d5a48}
.jd-course{background:#fff;border:2px solid #d9a441;border-radius:16px;padding:12px 14px;margin:10px 0 4px}
.jd-course .tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.jd-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.jd-course span{font-size:14px;color:#4d5a48}
.jd-path{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 8px}
.jd-path span{background:#eef5e6;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:800;color:#2f6b45}
.jd-web{position:relative;width:100%;aspect-ratio:1/1.02;background:#f4f8ee;border:1px solid #d5e3c6;border-radius:16px;margin:4px 0 8px;touch-action:manipulation}
.jd-web svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.jd-node{position:absolute;transform:translate(-50%,-50%);border:2px solid #d5e3c6;background:#fff;border-radius:14px;padding:4px 7px;font:800 12px Nunito,sans-serif;cursor:pointer;text-align:center;color:#22301f;min-width:64px}
.jd-node i{display:block;font-style:normal;font-size:22px;line-height:1.1}
.jd-node[aria-pressed=true]{border-color:#2f6b45;background:#e2f2e5;box-shadow:0 0 0 3px rgba(47,107,69,.25)}
.jd-node.shake{animation:jdShake .3s}
@keyframes jdShake{25%{transform:translate(calc(-50% - 5px),-50%)}75%{transform:translate(calc(-50% + 5px),-50%)}}
.jd-msg{min-height:20px;font-size:13.5px;font-weight:700;color:#4d5a48;margin-bottom:6px}
.jd-msg.ko{color:#b91c1c}.jd-msg.ok{color:#2f6b45}
.jd-cv{width:100%;height:auto;display:block;border-radius:16px;margin:4px 0 8px;touch-action:manipulation;cursor:pointer}
.jd-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.jd-row .jd-alt,.jd-row .jd-go{flex:1;margin-top:0}
.jd-tbl{width:100%;border-collapse:collapse;font-size:14px;margin:4px 0 10px}
.jd-tbl td{padding:7px 4px;border-bottom:1px solid #d5e3c6}
.jd-tbl td:last-child{text-align:right;font-weight:800}
.jd-tbl th{font-size:13px;padding:6px;background:#eef5e6;border:1px solid #d5e3c6}
.jd-pun{width:100%;border-collapse:collapse;margin:6px 0 10px;table-layout:fixed}
.jd-pun td,.jd-pun th{border:2px solid #d5e3c6;height:52px;text-align:center;font:800 18px Nunito,sans-serif}
.jd-pun th{background:#eef5e6;color:#2f6b45}
.jd-pun td{background:#fff;cursor:pointer}
.jd-pun td.ok{background:#eef8f0;border-color:#3d7a55}
.jd-pun td.ko{background:#fdeceb;border-color:#c4532f}
.jd-toks{display:flex;gap:8px;margin:4px 0 6px}
.jd-tok{flex:1;border:2px dashed #b9cfa4;background:#fff;border-radius:12px;padding:9px;font:800 16px Nunito,sans-serif;cursor:pointer;color:#22301f}
.jd-tok[aria-pressed=true]{border-style:solid;border-color:#2f6b45;background:#e2f2e5}
.jd-big{font-size:46px;text-align:center}
.jd-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.jd-list li{background:#fff;border:1px solid #d5e3c6;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
.jd-list li span{color:#2f6b45;font-weight:800;margin-right:6px}
.jd-found{display:flex;gap:4px;font-size:18px}
.jd-found i{font-style:normal;opacity:.25;filter:grayscale(1)}
.jd-found i.on{opacity:1;filter:none}
.jd-dna{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin:4px 0}
.jd-dna span{display:grid;place-items:center;height:34px;border-radius:9px;font:800 16px Nunito,sans-serif;color:#fff}
.jd-dna span.t{background:#fff;border:2px dashed #b9cfa4;color:#22301f}
.jd-dna span.cur{border:2px solid #2f6b45;box-shadow:0 0 0 3px rgba(47,107,69,.2)}
.b-A{background:#3d8a5a!important;color:#fff!important}.b-T{background:#c4532f!important;color:#fff!important}.b-G{background:#d9a441!important;color:#fff!important}.b-C{background:#3b6fb5!important;color:#fff!important}
.jd-keys4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:6px}
.jd-keys4 button{border:0;border-radius:14px;height:50px;font:800 22px Nunito,sans-serif;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.18);touch-action:manipulation}
.jd-keys4 button:active{transform:translateY(3px);box-shadow:none}
.jd-ctl{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d5e3c6;border-radius:14px;padding:7px 10px;margin-bottom:6px;font-weight:800;font-size:14px}
.jd-ctl b{min-width:66px;text-align:center;font-size:15px}
.jd-ctl b.bad{color:#b91c1c}
.jd-ctl button{width:40px;height:40px;border-radius:12px;border:2px solid #d5e3c6;background:#fff;font:800 18px Nunito,sans-serif;cursor:pointer;touch-action:manipulation;color:#22301f}
.jd-ctl button[aria-pressed=true]{border-color:#2f6b45;background:#e2f2e5}
.jd-ctl small{margin-left:auto;font-size:11.5px;color:#8a937f;text-align:right}
.jd-hold{display:block;width:100%;border:0;border-radius:18px;padding:16px;background:#3b6fb5;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 6px 0 #284f86}
.jd-hold:active{transform:translateY(4px);box-shadow:0 2px 0 #284f86}
.jd-par{display:grid;gap:8px}
.jd-par button{display:flex;gap:12px;align-items:center;text-align:left;border:2px solid #d5e3c6;background:#fff;border-radius:16px;padding:12px;cursor:pointer;font:inherit;color:#22301f}
.jd-par button:hover{border-color:#2f6b45}
.jd-par i{font-style:normal;font-size:30px}
.jd-par b{display:block;font:700 17px Fraunces,Georgia,serif}
.jd-par small{display:block;font-size:13px;color:#4d5a48}
.jd-par .done{margin-left:auto;font-size:20px}
.jd-ctl .lb{flex:none}
@media (max-width:440px){ .jd-ctl{flex-wrap:wrap;row-gap:4px} .jd-ctl .lb{flex-basis:100%} .jd-ctl small{order:9;flex-basis:100%;margin:0;text-align:left} .jd-ctl b{min-width:58px} }
@media (max-width:560px){ .jd-chip{font-size:12px;padding:6px 9px} .jd-h{font-size:20px} .jd-node{min-width:56px;font-size:11px;padding:3px 5px} .jd-node i{font-size:19px} }
`;

export function openJardin({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("jd-css")){ const st = document.createElement("style"); st.id = "jd-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const rnd = mulberry32(Date.now() % 100000);
	const root = document.createElement("div"); root.className = "jd"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Mission Jardin Boulay");
	root.innerHTML = `<canvas class="jd-3d"></canvas>
		<div class="jd-top">
			<span class="jd-chip jd-stage" id="jdStage">Mission Jardin</span>
			<span class="jd-chip" id="jdFound" hidden><span class="jd-found">${Object.values(SPECIES).map((s, i) => `<i data-f="${i}">${s.emoji}</i>`).join("")}</span></span>
			<button class="jd-x" aria-label="Quitter le jeu">×</button>
		</div>
		<div class="jd-coach" hidden></div>
		<button class="jd-hint" hidden>💡 Indice</button>
		<div class="jd-panel" hidden><div class="jd-card"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const card = $(".jd-card"), panel = $(".jd-panel"), coach = $(".jd-coach"), hintBtn = $(".jd-hint");

	/* ---------- scène 3D : le jardin botanique ---------- */
	const canvas = $("canvas.jd-3d");
	const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene(); scene.background = new THREE.Color("#bfe0f2"); scene.fog = new THREE.Fog("#bfe0f2", 30, 60);
	const camera = new THREE.PerspectiveCamera(45, 1, .3, 120);
	const controls = new OrbitControls(camera, canvas);
	Object.assign(controls, { enablePan:false, enableDamping:true, dampingFactor:.08, minDistance:6, maxDistance:28, minPolarAngle:.35, maxPolarAngle:1.22, rotateSpeed:.7 });
	scene.add(new THREE.HemisphereLight("#fdfbea", "#6b8a4e", 1.3));
	const sun = new THREE.DirectionalLight("#fff1d0", 2.2); sun.position.set(-8, 16, 10); sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left:-16, right:16, top:12, bottom:-12, near:1, far:50 });
	sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; scene.add(sun);

	const grassTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
		x.fillStyle = "#86b562"; x.fillRect(0,0,128,128);
		for(let i=0;i<900;i++){ x.fillStyle = `rgba(${rnd() < .5 ? "60,110,40" : "170,210,120"},${.15 + rnd()*.2})`; x.fillRect(rnd()*128, rnd()*128, 2, 3); }
		const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 6); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; })();
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 44).rotateX(-Math.PI/2), new THREE.MeshStandardMaterial({ map:grassTex, roughness:1 }));
	ground.receiveShadow = true; scene.add(ground);
	const gravel = std("#e3d3b0"), wood = std("#8a5a3c"), leaf = std("#4f8a3c"), leafDark = std("#3b6e2f"), trunk = std("#6b4a33"), soil = std("#6b4a33"), stone = std("#b9b4a8");
	// allées en croix et bordures
	box(scene, 22, .04, 1.6, gravel, 0, 0, 0, 0, false); box(scene, 1.6, .04, 16, gravel, 0, 0, 0, 0, false);
	// haie du fond, mur de briques, panneau
	box(scene, 22, 1.6, 1, leafDark, 0, 0, -7.5);
	box(scene, 24, 2.4, .4, std("#b5563d"), 0, 0, -8.6);
	box(scene, .12, 1.2, .12, wood, 1.6, 0, 1.4); box(scene, 1.4, .6, .08, std("#2f6b45"), 1.6, 1, 1.42);
	// arbres
	const tree = (x, z, s=1) => { cyl(scene, .25*s, .35*s, 2.2*s, trunk, x, 0, z, 7); const c = mesh(new THREE.IcosahedronGeometry(1.7*s, 0), leaf, scene, x, 3*s, z); c.scale.y = .85; mesh(new THREE.IcosahedronGeometry(1.2*s, 0), leafDark, scene, x + .7*s, 3.6*s, z - .3*s); };
	tree(-8.5, -4.5, 1.1); tree(8.6, 4.8, 1); tree(-9, 5.2, .9); tree(5, -5.5, 1.15);
	// massifs de fleurs (instanciés)
	const flowerGeo = new THREE.IcosahedronGeometry(.13, 0), stemGeo = new THREE.CylinderGeometry(.02, .02, .4, 4).translate(0, .2, 0);
	function bed(cx, cz, w, d, colors, n){
		box(scene, w, .18, d, soil, cx, 0, cz, 0, false);
		const fl = new THREE.InstancedMesh(flowerGeo, new THREE.MeshStandardMaterial({ roughness:.8, flatShading:true }), n);
		const st = new THREE.InstancedMesh(stemGeo, leaf, n);
		const o = new THREE.Object3D(), col = new THREE.Color();
		for(let i=0;i<n;i++){
			const x = cx + (rnd() - .5)*(w - .3), z = cz + (rnd() - .5)*(d - .3), h = .15 + rnd()*.25;
			o.position.set(x, .18, z); o.scale.set(1, 1 + h*2, 1); o.updateMatrix(); st.setMatrixAt(i, o.matrix);
			o.position.set(x, .58 + h*.8, z); o.scale.setScalar(.8 + rnd()*.6); o.updateMatrix(); fl.setMatrixAt(i, o.matrix);
			fl.setColorAt(i, col.set(colors[Math.floor(rnd()*colors.length)]));
		}
		fl.castShadow = true; scene.add(fl, st);
	}
	bed(-5, -2.6, 5, 2.4, ["#f2c14e", "#e07a5f", "#f4f1de", "#e9a6c4"], 90);
	bed(5.4, 2.8, 4.4, 2.2, ["#8e7cc3", "#a78bd8", "#7b68b6"], 80);           // lavande
	bed(-4.6, 3.2, 4, 2, ["#f4f1de", "#f2c14e"], 60);
	// rosier
	const rose = mesh(new THREE.IcosahedronGeometry(.9, 1), leaf, scene, -2.4, .8, -2.2); rose.scale.set(1.1, .9, 1);
	for(let i=0;i<9;i++){ const a = i*2.3; mesh(new THREE.IcosahedronGeometry(.16, 0), std("#d62839"), scene, -2.4 + Math.cos(a)*.75, .8 + Math.sin(i)*.35 + .3, -2.2 + Math.sin(a)*.65); }
	// buisson, compost, mare, banc
	mesh(new THREE.IcosahedronGeometry(1.1, 0), leafDark, scene, 7.4, .7, 5.6).scale.set(1.2, .8, 1);
	const comp = box(scene, 1.8, .7, 1.4, wood, -7.6, 0, 1.2); comp.material = std("#7a5a3a");
	box(scene, 1.6, .55, 1.2, std("#5a3f2a"), -7.6, .2, 1.2, 0, false);
	const pond = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24).rotateX(-Math.PI/2), std("#5fa8c8", { roughness:.2, flatShading:false })); pond.position.set(6, .03, -2.2); scene.add(pond);
	for(let i=0;i<10;i++){ const a = i/10*Math.PI*2; mesh(new THREE.DodecahedronGeometry(.28, 0), stone, scene, 6 + Math.cos(a)*1.9, .1, -2.2 + Math.sin(a)*1.9); }
	for(const [x,z] of [[5.6,-2.6],[6.5,-1.7]]){ const lp = new THREE.Mesh(new THREE.CircleGeometry(.3, 10).rotateX(-Math.PI/2), std("#4f8a3c")); lp.position.set(x, .05, z); scene.add(lp); }
	box(scene, 2, .1, .6, wood, 2.6, .5, -5.6); box(scene, .12, .5, .5, wood, 1.8, 0, -5.6); box(scene, .12, .5, .5, wood, 3.4, 0, -5.6);
	// prairie (quadrats) et serre (génétique)
	const meadow = { x:11, z:-.5 };
	{	// prairie fleurie, plus dense côté soleil, entourée d'une petite clôture
		const paq = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.08, 0), std("#fbfbf2"), 420), o = new THREE.Object3D();
		for(let i=0;i<420;i++){ let u, v; do { u = rnd(); v = rnd(); } while(rnd() > .15 + .85*Math.pow((u + v)/2, 1.6)); o.position.set(meadow.x - 2.5 + u*5, .1, meadow.z - 2 + v*4); o.updateMatrix(); paq.setMatrixAt(i, o.matrix); }
		scene.add(paq);
		const fence = std("#c9a77a");
		for(const [w, d, x, z] of [[5.2, .06, 0, -2.05], [5.2, .06, 0, 2.05], [.06, 4.1, -2.6, 0], [.06, 4.1, 2.6, 0]]) box(scene, w, .08, d, fence, meadow.x + x, .45, meadow.z + z, 0, false);
		for(const x of [-2.6, 0, 2.6]) for(const z of [-2.05, 2.05]) box(scene, .1, .55, .1, fence, meadow.x + x, 0, meadow.z + z);
	}
	const GH = { x:-1, z:5.6 };
	const glass = std("#dff2ff", { transparent:true, opacity:.28, roughness:.1, flatShading:false, depthWrite:false });
	box(scene, 6, 2.6, 3, glass, GH.x, 0, GH.z, 0, false);
	const frame = std("#f4f4f0");
	for(const dx of [-3, -1.5, 0, 1.5, 3]){ for(const dz of [-1.5, 1.5]) box(scene, .08, 2.6, .08, frame, GH.x + dx, 0, GH.z + dz, 0, false); box(scene, .08, .08, 3.05, frame, GH.x + dx, 2.6, GH.z, 0, false); }
	for(const dz of [-1.5, 1.5]) box(scene, 6.05, .08, .08, frame, GH.x, 2.6, GH.z + dz, 0, false);
	box(scene, 5.2, .7, 2.2, wood, GH.x, 0, GH.z, 0, false);

	/* ---------- les petites bêtes, cachées dans le jardin ---------- */
	const black = std("#1f1f1f"), hits = [];
	function creature(id, x, y, z, build){
		const g = new THREE.Group(); g.position.set(x, y, z); build(g); scene.add(g);
		const hit = new THREE.Mesh(new THREE.SphereGeometry(.9, 8, 6), new THREE.MeshBasicMaterial({ visible:false })); hit.userData.id = id; g.add(hit); hits.push(hit);
		return g;
	}
	const C = {};
	C.coccinelle = creature("coccinelle", -2.3, 1.62, -1.75, g => {
		const b = mesh(new THREE.SphereGeometry(.3, 14, 8, 0, Math.PI*2, 0, Math.PI/2), std("#d62828", { flatShading:false }), g); b.scale.set(1, .8, 1.2);
		mesh(new THREE.SphereGeometry(.13, 8, 6), black, g, 0, .03, .36);
		for(const [dx, dz] of [[0,.05],[.15,.15],[-.15,.15],[.17,-.12],[-.17,-.12],[.09,-.27],[-.09,-.27]]) mesh(new THREE.SphereGeometry(.05, 6, 4), black, g, dx, .2 - Math.abs(dz)*.25, dz);
	});
	C.abeille = creature("abeille", 5.2, 1.5, 2.6, g => {
		const ab = mesh(new THREE.SphereGeometry(.22, 10, 8), std("#f2c230"), g, 0, 0, -.14); ab.scale.set(1, 1, 1.4);
		for(const z of [-.08, -.22]){ const s = mesh(new THREE.TorusGeometry(.2, .035, 6, 14), black, g, 0, 0, z); s.scale.set(1, 1, 1); }
		mesh(new THREE.SphereGeometry(.15, 8, 6), std("#6b4423"), g, 0, 0, .16); mesh(new THREE.SphereGeometry(.11, 8, 6), black, g, 0, .02, .32);
		const wm = std("#e6f4ff", { transparent:true, opacity:.65, side:THREE.DoubleSide });
		for(const s of [-1, 1]){ const w = mesh(new THREE.CircleGeometry(.22, 10), wm, g, s*.2, .18, .08); w.rotation.set(-Math.PI/2 + .3, 0, s*.5); w.scale.set(1.3, .7, 1); }
	});
	C.araignee = creature("araignee", 3.2, 1.25, -6.85, g => {
		const web = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CircleGeometry(.75, 8)), new THREE.LineBasicMaterial({ color:"#ffffff" })); web.position.z = -.05; g.add(web);
		for(let i=0;i<8;i++){ const a = i/8*Math.PI*2; const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-.05), new THREE.Vector3(Math.cos(a)*.75, Math.sin(a)*.75, -.05)]), web.material); g.add(l); }
		const ab = mesh(new THREE.SphereGeometry(.2, 10, 8), std("#5a3a22"), g, 0, -.08, .1); ab.scale.set(1, 1.2, .8);
		mesh(new THREE.SphereGeometry(.12, 8, 6), std("#3a2414"), g, 0, .18, .1);
		for(let s of [-1, 1]) for(let i=0;i<4;i++){
			const p = [new THREE.Vector3(0, .15 - i*.07, .1), new THREE.Vector3(s*.3, .3 - i*.16, .18), new THREE.Vector3(s*.45, .2 - i*.2, .1)];
			g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color:"#1f1f1f" })));
		}
	});
	C.lombric = creature("lombric", -6.5, .12, 2.35, g => {
		const t = mesh(new THREE.TorusGeometry(.42, .09, 8, 20, Math.PI*1.4), std("#d98a8a", { flatShading:false }), g); t.rotation.x = -Math.PI/2;
		const t2 = mesh(new THREE.TorusGeometry(.3, .09, 8, 14, Math.PI), std("#d98a8a", { flatShading:false }), g, .72, 0, -.05); t2.rotation.set(-Math.PI/2, 0, Math.PI);
	});
	C.mesange = creature("mesange", 4.1, 3.05, -4.6, g => {
		const b = mesh(new THREE.SphereGeometry(.28, 10, 8), std("#f2d14a"), g); b.scale.set(1, .9, 1.25);
		const back = mesh(new THREE.SphereGeometry(.27, 10, 8, 0, Math.PI*2, 0, Math.PI/2), std("#5b8f6a"), g, 0, .03, 0); back.scale.set(1.02, .8, 1.27);
		const h = mesh(new THREE.SphereGeometry(.18, 10, 8), std("#ffffff"), g, 0, .2, .3);
		mesh(new THREE.SphereGeometry(.17, 10, 6, 0, Math.PI*2, 0, Math.PI/2.4), std("#2f6db5"), g, 0, .24, .3);
		const bk = mesh(new THREE.ConeGeometry(.05, .14, 6), std("#3a3a3a"), g, 0, .2, .5); bk.rotation.x = Math.PI/2;
		const tl = mesh(new THREE.BoxGeometry(.14, .04, .3), std("#2f6db5"), g, 0, .05, -.42); tl.rotation.x = -.3;
		box(scene, 1.6, .1, .1, trunk, 4.1, 2.68, -4.6);
	});
	C.herisson = creature("herisson", 6.4, .05, 5.3, g => {
		const b = mesh(new THREE.SphereGeometry(.5, 12, 8, 0, Math.PI*2, 0, Math.PI/2), std("#7a5230"), g); b.scale.set(1, .85, 1.25);
		for(let i=0;i<40;i++){ const a = rnd()*Math.PI*2, e = rnd()*1.2; const sp = mesh(new THREE.ConeGeometry(.04, .25, 4), std("#4a3020"), g, Math.cos(a)*Math.sin(e)*.48, Math.cos(e)*.42, Math.sin(a)*Math.sin(e)*.58); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sp.position.clone().normalize()); }
		const f = mesh(new THREE.ConeGeometry(.2, .45, 8), std("#c9a27a"), g, 0, .15, .62); f.rotation.x = Math.PI/2;
		mesh(new THREE.SphereGeometry(.06, 6, 4), black, g, 0, .15, .86);
	});
	// étincelle d'indice
	const spark = mesh(new THREE.OctahedronGeometry(.22), std("#fff3a0", { emissive:"#ffd84a", emissiveIntensity:1 }), scene, 0, -5, 0, 0, false);

	/* ---------- état ---------- */
	const S = { found:new Set(), errors:0, keyErrors:0, webErrors:0, quadErr:null, quadRandom:false, geneObs:null, learned:new Set(), parcours:null, troncErrors:0, modScore:0, done:new Set() };
	let sim = null;          // simulation en direct (bioréacteur, serre) : avancée à chaque image
	let stage = "intro", running = true, raf = 0, last = 0, closed = false, hintT = 0, fly = null;

	function layout(){
		const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h;
		camera.fov = w < h ? 58 : 45; camera.updateProjectionMatrix();
	}
	addEventListener("resize", layout); layout();
	const VIEWS = {
		jardin:  () => innerWidth < innerHeight ? [new THREE.Vector3(1.5, 18, 25), new THREE.Vector3(1.5, 0, 0)] : [new THREE.Vector3(1, 13, 15.5), new THREE.Vector3(1, 0, 0)],
		prairie: () => [new THREE.Vector3(meadow.x + 1, 6, meadow.z + 7), new THREE.Vector3(meadow.x, 0, meadow.z)],
		serre:   () => [new THREE.Vector3(GH.x, 5.5, GH.z + (innerWidth < innerHeight ? 9 : 6.5)), new THREE.Vector3(GH.x, .7, GH.z)]
	};
	function flyTo(v, dur=1.3){ const [p, t] = VIEWS[v](); fly = { p0:camera.position.clone(), t0:controls.target.clone(), p, t, k:0, dur }; }
	{ const [p, t] = VIEWS.jardin(); camera.position.copy(p).add(new THREE.Vector3(6, 6, 6)); controls.target.copy(t); }

	/* ---------- interface ---------- */
	function show(html){ card.innerHTML = html; panel.hidden = false; panel.scrollTop = 0; }
	function hide(){ panel.hidden = true; }
	function say(msg, ms){ coach.hidden = !msg; if(msg){ coach.textContent = msg; if(ms) setTimeout(() => { if(coach.textContent === msg) coach.hidden = true; }, ms); } }
	function course(key){ const [y, n, t] = COURSES[key]; S.learned.add(key); return `<div class="jd-course"><span class="tag">📚 En Licence Sciences de la Vie · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	function setStage(t){ $("#jdStage").textContent = t; say(null); }
	function err(kind){ S.errors++; if(kind) S[kind]++; play("bad"); }

	function intro(){
		stage = "intro";
		show(`<div class="jd-k">Mini-jeu · ${formation.name}</div><h2 class="jd-h">Mission Jardin Boulay</h2>
			<div class="jd-big">🔍🌿</div>
			<p class="jd-p">La Ville se demande si le jardin botanique du campus mérite le label <b>« refuge de biodiversité »</b>. Ton labo de licence est chargé de l'inventaire : observer, identifier, compter… et prouver tes résultats.</p>
			<ul class="jd-list"><li><span>L1</span>Identifier les espèces, comprendre qui mange qui</li><li><span>L2</span>Vérifier une loi de la génétique</li><li><span>L3</span>Ta spécialisation : 🌿 écologie, 🧬 biotech ou ⚙️ ingénieur</li></ul>
			<button class="jd-go" data-a="hunt">Entrer dans le jardin</button>`);
	}

	/* ---------- L1 · terrain : chasse et clé de détermination ---------- */
	function startHunt(){
		stage = "hunt"; hide(); flyTo("jardin", 1.6); setStage("L1 · Terrain"); $("#jdFound").hidden = false; hintT = 0;
		say("6 petites bêtes se cachent dans le jardin. Fais tourner la vue, zoome, et touche-les quand tu les repères 🔍", 7000);
	}
	function onFound(id){
		if(S.found.has(id)) return;
		play("pop"); hintBtn.hidden = true; spark.position.y = -5; say(null);
		identify(id);
	}
	function identify(id){
		stage = "key";
		let node = "n0"; const path = [];
		const render = msg => {
			const k = KEY[node];
			show(`<div class="jd-k">L1 · clé de détermination</div><h2 class="jd-h">Qui est-ce ?</h2>
				<canvas class="jd-draw" width="320" height="190"></canvas>
				${path.length ? `<div class="jd-path">${path.map(p => `<span>✓ ${p}</span>`).join("")}</div>` : ""}
				<p class="jd-p"><b>${k.q}</b></p>
				<div class="jd-msg ${msg ? "ko" : ""}">${msg || "Observe bien le dessin, puis réponds."}</div>
				<div class="jd-opts">${k.opts.map((o, i) => `<button class="jd-opt" data-k="${i}">${o[0]}</button>`).join("")}</div>`);
			drawSpecies(id, card.querySelector("canvas"));
		};
		card.onclick = e => {
			const b = e.target.closest("[data-k]"); if(!b) return;
			const [label, next] = KEY[node].opts[+b.dataset.k];
			if(!leadsTo(next, id)){ err("keyErrors"); b.classList.add("ko"); const m = card.querySelector(".jd-msg"); m.className = "jd-msg ko"; m.textContent = node === "n2" ? "Recompte bien les pattes sur le dessin…" : "Regarde mieux le dessin : ce n'est pas ça."; return; }
			play("pop"); path.push(label);
			if(SPECIES[next]){ card.onclick = null; return reveal(id); }
			node = next; render();
		};
		render();
	}
	function reveal(id){
		const sp = SPECIES[id]; S.found.add(id); play("good");
		root.querySelectorAll("[data-f]").forEach((el, i) => el.classList.toggle("on", S.found.has(Object.keys(SPECIES)[i])));
		C[id].visible = false;
		const done = S.found.size === 6;
		show(`<div class="jd-k">Espèce identifiée · ${S.found.size}/6</div><h2 class="jd-h">${sp.emoji} ${sp.name}</h2>
			<canvas class="jd-draw" width="320" height="190"></canvas>
			<div class="jd-tax"><small>${sp.taxon}</small><span>${sp.fact}</span></div>
			${done ? course("cle") : ""}
			<button class="jd-go" data-a="${done ? "web" : "resume"}">${done ? "Inventaire terminé : la suite →" : "Continuer la recherche"}</button>`);
		drawSpecies(id, card.querySelector("canvas"));
	}

	/* ---------- L1 · réseau trophique ---------- */
	function startWeb(){
		stage = "web"; setStage("L1 · Écologie"); $("#jdFound").hidden = true;
		const links = new Set(); let sel = null;
		show(`<div class="jd-k">L1 · écologie</div><h2 class="jd-h">Qui mange qui ?</h2>
			<p class="jd-p">Relie les espèces du jardin : touche celui qui <b>est mangé</b>, puis celui qui <b>le mange</b>. La flèche suit le chemin de l'énergie.</p>
			<div class="jd-web"><svg viewBox="0 0 100 102" preserveAspectRatio="none"><defs><marker id="jdArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#2f6b45"/></marker></defs><g></g></svg>
				${Object.entries(WEB_NODES).map(([k, [e, n, x, y]]) => `<button class="jd-node" data-n="${k}" style="left:${x}%;top:${y}%"><i>${e}</i>${n}</button>`).join("")}</div>
			<div class="jd-msg">Il faut au moins 6 bonnes flèches.</div>
			<div data-end></div>`);
		const msg = (t, cls) => { const m = card.querySelector(".jd-msg"); m.className = "jd-msg " + (cls || ""); m.textContent = t; };
		const draw = () => {
			card.querySelector("svg g").innerHTML = [...links].map(l => { const [a, b] = l.split(">"), A = WEB_NODES[a], B = WEB_NODES[b];
				const dx = B[2] - A[2], dy = B[3] - A[3], d = Math.hypot(dx, dy), k1 = 7/d, k2 = 1 - 8/d;
				return `<line x1="${A[2] + dx*k1}" y1="${A[3] + dy*k1}" x2="${A[2] + dx*k2}" y2="${A[3] + dy*k2}" stroke="#2f6b45" stroke-width="1.1" marker-end="url(#jdArr)"/>`; }).join("");
		};
		const complete = () => WEB_NEED.every(alts => alts.some(l => links.has(l)));
		card.onclick = e => {
			const b = e.target.closest("[data-n]"); if(!b || complete()) return;
			const k = b.dataset.n;
			if(!sel){ sel = k; b.setAttribute("aria-pressed", "true"); return; }
			card.querySelectorAll("[data-n]").forEach(n => n.setAttribute("aria-pressed", "false"));
			const a = sel; sel = null; if(a === k) return;
			const l = `${a}>${k}`, inv = `${k}>${a}`, A = WEB_NODES[a], B = WEB_NODES[k];
			const shake = () => { b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); };
			if(WEB_OK.has(l)){ if(!links.has(l)){ links.add(l); play("pop"); msg(`✓ ${A[1]} → ${B[1]} : l'énergie passe ${A[5]} ${B[6]}.`, "ok"); draw(); } }
			else if(WEB_OK.has(inv)){ err("webErrors"); shake(); msg(`Attention au sens : la flèche part de ce qui est mangé (${B[4]}) vers celui qui mange (${A[4]}).`, "ko"); }
			else { err("webErrors"); shake(); msg(`Non : ${B[4]} ne se nourrit pas ${A[5]}.`, "ko"); }
			if(complete()){ play("good"); card.onclick = null; perturbation(); }
		};
		function perturbation(){
			card.querySelector("[data-end]").innerHTML = `<p class="jd-p" style="margin-top:6px"><b>Le voisin pulvérise un insecticide.</b> Il tue les pucerons… mais aussi les coccinelles. Au printemps, les pucerons reviennent bien plus vite que leurs prédateurs. <b>Que deviennent les rosiers ?</b></p>
				<div class="jd-opts">${[["ok", "Ils sont plus attaqués qu'avant : plus aucun prédateur ne régule les pucerons"], ["no1", "Ils sont protégés pour de bon : les pucerons ont disparu"], ["no2", "Rien ne change : les rosiers ne sont pas dans la chaîne"]].sort(() => rnd() - .5).map(([v, t]) => `<button class="jd-opt" data-q="${v}">${t}</button>`).join("")}</div><div data-fin></div>`;
			card.onclick = e => {
				const o = e.target.closest("[data-q]"); if(!o || card.querySelector("[data-q].ok")) return;
				if(o.dataset.q !== "ok"){ err("webErrors"); o.classList.add("ko"); return; }
				o.classList.add("ok"); play("good"); card.onclick = null;
				card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:10px">Exact. C'est pour ça que les jardiniers et les agriculteurs pratiquent la <b>lutte biologique</b> : on lâche des coccinelles plutôt que de pulvériser. Le réseau trophique se régule tout seul.</p>${course("reseau")}<button class="jd-go" data-a="gene">Passer en L2 →</button>`;
			};
		}
	}

	/* ---------- L2 · quadrats ---------- */
	function startQuad(){
		stage = "quad"; setStage("L3 · Écologie opérationnelle"); flyTo("prairie");
		// la prairie : 10 × 10 quadrats d'un mètre carré, plus fleurie côté soleil (en bas à droite)
		const N = 10, cells = [];
		for(let j=0;j<N;j++) for(let i=0;i<N;i++){
			const lam = 1 + 11*Math.pow((i + j)/18, 1.6);
			const n = Math.min(14, Math.max(0, Math.round(lam*(.7 + rnd()*.6))));
			const seed = Math.floor(rnd()*1e6), pts = []; const r = mulberry32(seed);
			for(let k=0;k<n;k++) pts.push([.1 + r()*.8, .1 + r()*.8]);
			cells.push({ i, j, n, pts });
		}
		const total = cells.reduce((a, c) => a + c.n, 0);
		const chosen = [];
		show(`<div class="jd-k">L2 · écologie quantitative</div><h2 class="jd-h">Combien de pâquerettes ?</h2>
			<p class="jd-p">La prairie fait <b>100 m²</b>. Impossible de tout compter : on va <b>échantillonner</b>. Choisis <b>4 quadrats</b> d'un mètre carré (touche la carte), puis compte les fleurs dedans.</p>
			<canvas class="jd-cv" width="400" height="400" aria-label="Carte de la prairie"></canvas>
			<div class="jd-row"><button class="jd-alt" data-r>🎲 Au hasard</button><button class="jd-go" data-c disabled>Compter (0/4)</button></div>`);
		const cv = card.querySelector("canvas");
		const drawMap = () => {
			const x = cv.getContext("2d"), s = 40;
			x.fillStyle = "#8cc06a"; x.fillRect(0, 0, 400, 400);
			for(const c of cells){ for(const [u, v] of c.pts){ x.fillStyle = "#fffdf0"; x.beginPath(); x.arc(c.i*s + u*s, c.j*s + v*s, 2.2, 0, 7); x.fill(); } }
			x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 1;
			for(let k=1;k<N;k++){ x.beginPath(); x.moveTo(k*s, 0); x.lineTo(k*s, 400); x.moveTo(0, k*s); x.lineTo(400, k*s); x.stroke(); }
			x.font = "28px serif"; x.fillText("☀️", 360, 392);
			for(const c of chosen){ x.strokeStyle = "#8a2b4e"; x.lineWidth = 4; x.strokeRect(c.i*s + 2, c.j*s + 2, s - 4, s - 4); }
			const b = card.querySelector("[data-c]"); b.disabled = chosen.length < 4; b.textContent = `Compter (${chosen.length}/4)`;
		};
		drawMap();
		cv.onclick = e => {
			const r = cv.getBoundingClientRect(), i = Math.floor((e.clientX - r.left)/r.width*N), j = Math.floor((e.clientY - r.top)/r.height*N);
			const c = cells[j*N + i]; if(!c) return;
			const at = chosen.indexOf(c);
			if(at >= 0) chosen.splice(at, 1); else if(chosen.length < 4) chosen.push(c);
			S.quadRandom = false; play("pop"); drawMap();
		};
		card.onclick = e => {
			if(e.target.closest("[data-r]")){ chosen.length = 0; const pool = [...cells]; while(chosen.length < 4) chosen.push(pool.splice(Math.floor(rnd()*pool.length), 1)[0]); S.quadRandom = true; play("pop"); drawMap(); }
			if(e.target.closest("[data-c]") && chosen.length === 4){ card.onclick = null; count(0); }
		};
		const counts = [];
		function count(q){
			const c = chosen[q], tapped = new Set();
			show(`<div class="jd-k">L2 · quadrat ${q + 1}/4</div><h2 class="jd-h">Compte les pâquerettes</h2>
				<p class="jd-p">Touche chaque fleur du quadrat pour la compter.</p>
				<canvas class="jd-cv" width="400" height="400" aria-label="Quadrat à compter"></canvas>
				<div class="jd-msg">Compté : <b data-n>0</b></div>
				<button class="jd-go" data-ok ${c.n ? "disabled" : ""}>${c.n ? "Compte toutes les fleurs" : "Aucune fleur ici : quadrat suivant"}</button>`);
			const cv = card.querySelector("canvas");
			const draw = () => {
				const x = cv.getContext("2d");
				x.fillStyle = "#8cc06a"; x.fillRect(0, 0, 400, 400);
				x.strokeStyle = "#8a2b4e"; x.lineWidth = 8; x.strokeRect(4, 4, 392, 392);
				c.pts.forEach(([u, v], k) => {
					const px = u*400, py = v*400;
					x.fillStyle = "#fffdf0"; for(let p=0;p<8;p++){ const a = p/8*Math.PI*2; x.beginPath(); x.ellipse(px + Math.cos(a)*11, py + Math.sin(a)*11, 8, 4, a, 0, 7); x.fill(); }
					x.fillStyle = "#f2c14e"; x.beginPath(); x.arc(px, py, 6, 0, 7); x.fill();
					if(tapped.has(k)){ x.fillStyle = "rgba(47,107,69,.85)"; x.beginPath(); x.arc(px, py, 15, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "bold 16px Nunito, sans-serif"; x.textAlign = "center"; x.fillText(String([...tapped].indexOf(k) + 1), px, py + 6); }
				});
			};
			draw();
			cv.onclick = e => {
				const r = cv.getBoundingClientRect(), px = (e.clientX - r.left)/r.width*400, py = (e.clientY - r.top)/r.height*400;
				let best = -1, bd = 30;
				c.pts.forEach(([u, v], k) => { const d = Math.hypot(u*400 - px, v*400 - py); if(d < bd && !tapped.has(k)){ bd = d; best = k; } });
				if(best < 0) return;
				tapped.add(best); play("pop"); draw();
				card.querySelector("[data-n]").textContent = tapped.size;
				if(tapped.size === c.n){ const b = card.querySelector("[data-ok]"); b.disabled = false; b.textContent = q < 3 ? "Quadrat suivant →" : "J'ai mes 4 comptages →"; }
			};
			card.onclick = e => { if(e.target.closest("[data-ok]") && tapped.size === c.n){ card.onclick = null; counts.push(c.n); q < 3 ? count(q + 1) : estimate(); } };
		}
		function estimate(){
			const sum = counts.reduce((a, b) => a + b, 0), m = sum/4, est = Math.round(m*100);
			const opts = [...new Set([est, sum, Math.round(m*10)])];
			while(opts.length < 3) opts.push(est + 37*opts.length);
			show(`<div class="jd-k">L2 · estimation</div><h2 class="jd-h">Ta population estimée</h2>
				<table class="jd-tbl"><tr><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Moyenne</th></tr><tr>${counts.map(n => `<td style="text-align:center">${n}</td>`).join("")}<td style="text-align:center">${m.toLocaleString("fr-FR")}</td></tr></table>
				<p class="jd-p">En moyenne <b>${m.toLocaleString("fr-FR")} fleurs par m²</b>. La prairie fait 100 m². <b>Combien de pâquerettes au total ?</b></p>
				<div class="jd-opts">${opts.sort((a, b) => a - b).map(v => `<button class="jd-opt" data-e="${v}">≈ ${v.toLocaleString("fr-FR")} pâquerettes</button>`).join("")}</div><div data-fin></div>`);
			card.onclick = e => {
				const o = e.target.closest("[data-e]"); if(!o || card.querySelector("[data-e].ok")) return;
				if(+o.dataset.e !== est){ err(); o.classList.add("ko"); return; }
				o.classList.add("ok"); play("good"); card.onclick = null;
				const ecart = Math.round(Math.abs(est - total)/total*100); S.quadErr = ecart;
				const dense = counts.reduce((a, b) => a + b, 0)/4 > total/100;
				const verdict = ecart <= 15 ? `Très bonne estimation : seulement <b>${ecart} %</b> d'écart.`
					: S.quadRandom ? `<b>${ecart} %</b> d'écart : avec seulement 4 quadrats, le hasard peut jouer. Plus on fait de quadrats, plus l'estimation est précise.`
					: `<b>${ecart} %</b> d'écart ! Tu as choisi des quadrats ${dense ? "dans les zones les plus fleuries, côté soleil" : "dans les zones les moins fleuries"} : c'est un <b>biais d'échantillonnage</b>. Pour l'éviter, on tire les quadrats <b>au hasard</b>.`;
				S.modScore = ecart <= 20 ? 85 : ecart <= 35 ? 60 : 40;
				card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:10px">Le vrai nombre (on a tout compté pour toi) : <b>${total.toLocaleString("fr-FR")} pâquerettes</b>. ${verdict}</p>${course("quadrat")}<button class="jd-go" data-a="end">Rendre mon rapport de mission</button>`;
			};
		}
	}

	/* ---------- L3 · génétique : le croisement de Mendel ---------- */
	const pots = [];
	function startGene(){
		stage = "gene"; setStage("L2 · Génétique"); flyTo("serre");
		show(`<div class="jd-k">L3 · génétique</div><h2 class="jd-h">Le pari de Mendel</h2>
			<p class="jd-p">Dans la serre, des pois. En 1865, Gregor Mendel croise des pois à <b>fleurs violettes</b> et des pois à <b>fleurs blanches</b> (lignées pures). L'allèle <b>V</b> (violet) est <b>dominant</b>, l'allèle <b>b</b> (blanc) est <b>récessif</b>.</p>
			<p class="jd-p"><b>Les enfants (génération F1) sont tous Vb. De quelle couleur sont leurs fleurs ?</b></p>
			<div class="jd-opts">${[["v", "💜 Violettes"], ["b", "🤍 Blanches"], ["m", "🩷 Mauves, un mélange des deux"]].map(([v, t]) => `<button class="jd-opt" data-f1="${v}">${t}</button>`).join("")}</div><div data-s2></div>`);
		card.onclick = e => {
			const o = e.target.closest("[data-f1]"); if(!o || card.querySelector("[data-f1].ok")) return;
			if(o.dataset.f1 !== "v"){ err(); o.classList.add("ko"); if(o.dataset.f1 === "m") o.textContent += " · non, les caractères ne se mélangent pas"; return; }
			o.classList.add("ok"); play("good"); card.onclick = null; punnett();
		};
	}
	function punnett(){
		const want = { "0,0":"VV", "0,1":"Vb", "1,0":"Vb", "1,1":"bb" }, got = {};
		let sel = null;
		show(`<div class="jd-k">L3 · génétique</div><h2 class="jd-h">L'échiquier de croisement</h2>
			<p class="jd-p">On croise deux plantes F1 (<b>Vb × Vb</b>). Chaque parent donne un seul allèle. Remplis l'échiquier : choisis un génotype, puis touche une case.</p>
			<div class="jd-toks">${["VV", "Vb", "bb"].map(t => `<button class="jd-tok" data-t="${t}">${t}</button>`).join("")}</div>
			<table class="jd-pun"><tr><th>♀ \\ ♂</th><th>V</th><th>b</th></tr>
				<tr><th>V</th><td data-c="0,0"></td><td data-c="0,1"></td></tr>
				<tr><th>b</th><td data-c="1,0"></td><td data-c="1,1"></td></tr></table>
			<div data-s3></div>`);
		card.onclick = e => {
			const t = e.target.closest("[data-t]"), c = e.target.closest("[data-c]");
			if(t){ sel = t.dataset.t; card.querySelectorAll("[data-t]").forEach(b => b.setAttribute("aria-pressed", String(b === t))); return; }
			if(c && sel && !got[c.dataset.c]){
				const ok = want[c.dataset.c] === sel;
				c.textContent = sel; c.className = ok ? "ok" : "ko";
				if(!ok){ err(); setTimeout(() => { if(!got[c.dataset.c]){ c.textContent = ""; c.className = ""; } }, 700); return; }
				play("pop"); got[c.dataset.c] = sel;
				if(Object.keys(got).length === 4){ card.onclick = null; ratio(); }
			}
		};
	}
	function ratio(){
		card.querySelector("[data-s3]").innerHTML = `<p class="jd-p"><b>Quelle proportion de fleurs blanches attends-tu ?</b> (une fleur est blanche seulement si elle est bb)</p>
			<div class="jd-opts">${["1/4", "1/2", "3/4", "Aucune"].map(v => `<button class="jd-opt" data-p="${v}">${v}</button>`).join("")}</div><div data-s4></div>`;
		card.onclick = e => {
			const o = e.target.closest("[data-p]"); if(!o || card.querySelector("[data-p].ok")) return;
			if(o.dataset.p !== "1/4"){ err(); o.classList.add("ko"); return; }
			o.classList.add("ok"); play("good"); card.onclick = null;
			card.querySelector("[data-s4]").innerHTML = `<p class="jd-p" style="margin-top:10px">C'est la célèbre proportion <b>3 violettes pour 1 blanche</b>. Vérifions-la pour de vrai : semons 40 graines dans la serre.</p><button class="jd-go" data-a="sow">🌱 Semer 40 graines</button>`;
		};
	}
	function sow(){
		hide(); say("Les pois poussent… 🌱", 3000);
		pots.forEach(p => scene.remove(p.g)); pots.length = 0;
		let white = 0;
		for(let k=0;k<40;k++){
			const isW = rnd() < .25; if(isW) white++;
			const g = new THREE.Group(); g.position.set(GH.x - 2.25 + (k % 10)*.5, .7, GH.z - .75 + Math.floor(k/10)*.5);
			cyl(g, .13, .1, .2, std("#b5563d"), 0, 0, 0, 8);
			const st = cyl(g, .02, .02, .5, leaf, 0, .2, 0, 4);
			const fl = mesh(new THREE.IcosahedronGeometry(.11, 0), std(isW ? "#fbfbf6" : "#8e5cc7", { emissive:isW ? "#333" : "#2a1240", emissiveIntensity:.3 }), g, 0, .72, 0);
			g.scale.setScalar(.01); scene.add(g); pots.push({ g, t:-k*.06 });
		}
		S.geneObs = white;
		setTimeout(geneResult, 3600);
	}
	function geneResult(){
		const w = S.geneObs, v = 40 - w;
		show(`<div class="jd-k">L3 · résultats</div><h2 class="jd-h">${v} violettes, ${w} blanches</h2>
			<table class="jd-tbl"><tr><th></th><th>Violettes</th><th>Blanches</th></tr><tr><td>Observé</td><td style="text-align:center">${v}</td><td style="text-align:center">${w}</td></tr><tr><td>Attendu (3/4 · 1/4)</td><td style="text-align:center">30</td><td style="text-align:center">10</td></tr></table>
			<p class="jd-p"><b>${w === 10 ? "Pile la proportion attendue ! Mais si on recommence…" : `Tu n'as pas exactement 10 blanches. L'hypothèse de Mendel est-elle fausse ?`}</b></p>
			<div class="jd-opts">${[["ok", "Non : sur 40 graines, le hasard crée de petits écarts"], ["no", "Oui : Mendel s'est trompé"]].map(([k, t]) => `<button class="jd-opt" data-g="${k}">${t}</button>`).join("")}</div><div data-fin></div>`);
		card.onclick = e => {
			const o = e.target.closest("[data-g]"); if(!o || card.querySelector("[data-g].ok")) return;
			if(o.dataset.g !== "ok"){ err(); o.classList.add("ko"); return; }
			o.classList.add("ok"); play("good"); card.onclick = null;
			card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:10px">Bien vu. Pour trancher, les biologistes utilisent un <b>test statistique</b> (le test du χ², « khi-deux ») : il dit si l'écart est assez petit pour être dû au hasard. Mendel, lui, avait compté plus de 7 000 graines !</p>${course("genet")}<button class="jd-go" data-a="parcours">Choisir ma spécialisation de L3 →</button>`;
		};
	}


	/* ---------- L3 · le choix de la spécialisation ---------- */
	function chooseParcours(){
		stage = "parcours"; setStage("L3 · Spécialisation"); flyTo("jardin");
		S.troncErrors = S.errors;
		show(`<div class="jd-k">L3 · spécialisation</div><h2 class="jd-h">Ta troisième année, à toi de choisir</h2>
			<p class="jd-p">En L3, la licence se spécialise. Choisis ton parcours : tu pourras rejouer pour découvrir les autres.</p>
			<div class="jd-par">${Object.entries(PARCOURS).map(([k, p]) => `<button data-p="${k}"><i>${p.icon}</i><span><b>${p.name}</b><small>${p.pitch}</small></span>${S.done.has(k) ? '<span class="done">🏅</span>' : ""}</button>`).join("")}</div>`);
	}
	function startParcours(k){
		S.parcours = k; S.errors = S.troncErrors; S.modScore = 0;
		if(k === "eco") return startQuad();
		if(k === "biotech") return startBio();
		return startInge();
	}
	// petit graphique : axes, courbe(s) et nuage de points
	function plot(cv, { xmax, ymax, xl, yl, lines = [], pts = [], hline, xt = [], yt = [] }){
		const x = cv.getContext("2d"), W = cv.width, H = cv.height, L = 44, B = 30;
		const X = v => L + (W - L - 12)*v/xmax, Y = v => H - B - (H - B - 12)*v/ymax;
		x.clearRect(0, 0, W, H); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
		x.strokeStyle = "#d5e3c6"; x.lineWidth = 2; x.beginPath(); x.moveTo(L, 8); x.lineTo(L, H - B); x.lineTo(W - 8, H - B); x.stroke();
		x.fillStyle = "#8a937f"; x.font = "bold 13px Nunito, sans-serif"; x.fillText(yl, L + 6, 18); x.textAlign = "right"; x.fillText(xl, W - 10, H - B - 6);
		// graduations, pour pouvoir lire une valeur sur le graphique
		x.font = "bold 12px Nunito, sans-serif"; x.strokeStyle = "#eef3e6"; x.lineWidth = 1;
		for(const v of yt){ x.fillText(String(v), L - 6, Y(v) + 4); x.beginPath(); x.moveTo(L + 1, Y(v)); x.lineTo(W - 8, Y(v)); x.stroke(); }
		x.textAlign = "center";
		for(const v of xt){ x.fillText(String(v), X(v), H - B + 16); x.beginPath(); x.moveTo(X(v), H - B - 1); x.lineTo(X(v), 12); x.stroke(); }
		x.textAlign = "left"; x.font = "bold 13px Nunito, sans-serif";
		if(hline){ x.setLineDash([7, 5]); x.strokeStyle = hline.c; x.beginPath(); x.moveTo(L, Y(hline.v)); x.lineTo(W - 8, Y(hline.v)); x.stroke(); x.setLineDash([]); x.fillStyle = hline.c; x.textAlign = "right"; x.fillText(hline.t, W - 12, Y(hline.v) - 6); x.textAlign = "left"; }
		for(const l of lines){ x.strokeStyle = l.c; x.lineWidth = l.w || 3; x.beginPath(); l.d.forEach(([a, b], i) => i ? x.lineTo(X(a), Y(b)) : x.moveTo(X(a), Y(b))); x.stroke(); }
		x.fillStyle = "#2f6b45"; for(const [a, b] of pts){ x.beginPath(); x.arc(X(a), Y(b), 4.5, 0, 7); x.fill(); }
	}
	function qcm(el, opts, good, onOk, kind){
		el.innerHTML = `<div class="jd-opts">${opts.map(([v, t]) => `<button class="jd-opt" data-q="${v}">${t}</button>`).join("")}</div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector("[data-q].ok")) return;
			if(b.dataset.q !== String(good)){ err(kind); b.classList.add("ko"); return; }
			b.classList.add("ok"); play("good"); onOk(el.querySelector("[data-after]"));
		}));
	}

	/* ---------- L3 · parcours Biotechnologies : le labo de bioproduction ---------- */
	function startBio(){ stage = "bio"; setStage("L3 · Biotechnologies"); flyTo("serre"); S.bio = { pip:[] }; bioDNA(); }
	function bioDNA(){
		const tpl = "ATGCGTAC".split(""), comp = { A:"T", T:"A", G:"C", C:"G" }, got = [];
		const render = msg => {
			show(`<div class="jd-k">L3 · biotech · étape 1/5</div><h2 class="jd-h">Copier le gène de l'enzyme</h2>
				<p class="jd-p">Pour copier un gène par <b>PCR</b>, il faut une <b>amorce</b> : le brin complémentaire du début du gène. A s'apparie avec T, G avec C.</p>
				<div class="jd-dna">${tpl.map(b => `<span class="b-${b}">${b}</span>`).join("")}</div>
				<div class="jd-dna">${tpl.map((b, i) => `<span class="t ${i < got.length ? "b-" + got[i] : i === got.length ? "cur" : ""}">${got[i] || ""}</span>`).join("")}</div>
				<div class="jd-msg ${msg ? "ko" : ""}">${msg || "Touche les bases dans l'ordre pour construire l'amorce."}</div>
				${got.length < tpl.length ? `<div class="jd-keys4">${["A", "T", "G", "C"].map(b => `<button data-b="${b}" class="b-${b}">${b}</button>`).join("")}</div>` : ""}<div data-fin></div>`);
		};
		render();
		card.onclick = e => {
			const b = e.target.closest("[data-b]"); if(!b) return;
			const want = comp[tpl[got.length]];
			if(b.dataset.b !== want){ err(); render(`${tpl[got.length]} s'apparie avec ${want}, pas avec ${b.dataset.b}.`); return; }
			got.push(want); play("pop"); render();
			if(got.length === tpl.length){
				card.onclick = null; play("good");
				card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:8px">Amorce prête : <b>${got.join("")}</b>. La PCR va copier le gène des millions de fois en quelques heures.</p><button class="jd-go" data-a="bio-gel">Vérifier sur gel →</button>`;
			}
		};
	}
	function bioGel(){
		const wells = [[1000], [300], [750]].sort(() => rnd() - .5), good = wells.findIndex(w => w[0] === 750) + 1;
		show(`<div class="jd-k">L3 · biotech · étape 2/5</div><h2 class="jd-h">Lire le gel d'électrophorèse</h2>
			<p class="jd-p">Les fragments d'ADN migrent dans le gel : <b>les plus petits vont le plus loin</b>. À gauche, l'échelle de tailles. <b>Ton gène fait 750 paires de bases : quel puits le contient ?</b></p>
			<canvas class="jd-cv" width="400" height="260"></canvas><div data-q></div>`);
		const cv = card.querySelector("canvas"), x = cv.getContext("2d");
		const Y = bp => 40 + (1 - Math.log(bp/200)/Math.log(1300/200))*190;
		x.fillStyle = "#1f3550"; x.fillRect(0, 0, 400, 260);
		const lanes = [["Échelle", [1000, 750, 500, 250]], ["Puits 1", wells[0]], ["Puits 2", wells[1]], ["Puits 3", wells[2]]];
		lanes.forEach(([n, bands], i) => {
			const cx = 106 + i*88;
			x.fillStyle = "#0e1c2d"; x.fillRect(cx - 28, 18, 56, 10);
			x.fillStyle = "#cfe3ff"; x.font = "bold 13px Nunito, sans-serif"; x.textAlign = "center"; x.fillText(n, cx, 250);
			for(const bp of bands){ x.fillStyle = i ? "#ffe680" : "#a8c7ff"; x.shadowColor = x.fillStyle; x.shadowBlur = 8; x.fillRect(cx - 26, Y(bp) - 3, 52, 6); x.shadowBlur = 0; if(!i){ x.fillStyle = "#a8c7ff"; x.textAlign = "left"; x.fillText(bp + " pb", 4, Y(bp) + 4); } }
		});
		qcm(card.querySelector("[data-q]"), [[1, "Puits 1"], [2, "Puits 2"], [3, "Puits 3"]], good, el => {
			el.innerHTML = `<p class="jd-p" style="margin-top:8px">Exact : la bande du puits ${good} est à la hauteur du repère 750 pb. Ton gène est bien copié.</p><button class="jd-go" data-a="bio-pip">À la pipette →</button>`;
		});
	}
	function bioPip(){
		S.bio = S.bio || { pip:[] };
		let n = 0, vol = 0, holding = false;
		const render = msg => {
			show(`<div class="jd-k">L3 · biotech · étape 3/5</div><h2 class="jd-h">Dilutions en série</h2>
				<p class="jd-p">Ta culture est trop concentrée pour compter les bactéries. Dilue-la 3 fois au dixième : à chaque fois, prélève <b>100 µL</b> et verse-les dans 900 µL d'eau.</p>
				<canvas class="jd-cv" width="400" height="110"></canvas>
				<div class="jd-msg ${msg && msg.ko ? "ko" : msg ? "ok" : ""}">${msg ? msg.t : `Dilution ${n + 1}/3 : maintiens le bouton, relâche à 100 µL.`}</div>
				${n < 3 ? `<button class="jd-hold" data-hold>🧪 Maintiens pour aspirer</button>` : ""}<div data-fin></div>`);
			draw();
			const h = card.querySelector("[data-hold]");
			if(h){
				h.addEventListener("pointerdown", e => { e.preventDefault(); holding = true; vol = 0; });
				for(const ev of ["pointerup", "pointerleave", "pointercancel"]) h.addEventListener(ev, () => { if(holding){ holding = false; release(); } });
			}
		};
		const draw = () => {
			const cv = card.querySelector("canvas"); if(!cv) return;
			const x = cv.getContext("2d"), X = v => 20 + v/200*360;
			x.clearRect(0, 0, 400, 110); x.fillStyle = "#fff"; x.fillRect(0, 0, 400, 110);
			x.fillStyle = "#e2f2e5"; x.fillRect(X(85), 30, X(115) - X(85), 40);
			x.strokeStyle = "#b9cfa4"; x.lineWidth = 2; x.strokeRect(20, 30, 360, 40);
			x.fillStyle = "#3b6fb5"; x.fillRect(20, 34, X(vol) - 20, 32);
			x.fillStyle = "#4d5a48"; x.font = "bold 13px Nunito, sans-serif"; x.textAlign = "center";
			for(const v of [0, 50, 100, 150, 200]) x.fillText(v + " µL", X(v), 92);
			x.fillStyle = "#22301f"; x.font = "bold 18px Nunito, sans-serif"; x.fillText(Math.round(vol) + " µL", 200, 22);
		};
		sim = dt => { if(holding){ vol = Math.min(200, vol + dt*(45 + vol*.9)); draw(); if(vol >= 200){ holding = false; release(); } } };
		const release = () => {
			const v = Math.round(vol); S.bio.pip.push(v);
			if(v >= 85 && v <= 115){ n++; play("pop"); render({ t:`✓ ${v} µL : dilution ${n} réussie.` }); }
			else { err(); render({ t:`${v} µL : ${v < 85 ? "pas assez" : "trop"} ! Vide la pipette et recommence.`, ko:true }); }
			if(n === 3){ sim = null; finish(); }
		};
		const finish = () => {
			const el = card.querySelector("[data-fin]");
			el.innerHTML = `<p class="jd-p" style="margin-top:6px">Chaque étape divise la concentration par 10 (C₁V₁ = C₂V₂). <b>Quelle est la dilution finale ?</b></p><div data-q></div>`;
			qcm(el.querySelector("[data-q]"), [["30", "1/30"], ["1000", "1/1 000"], ["300", "1/300"]], "1000", a => {
				a.innerHTML = `<p class="jd-p" style="margin-top:8px">Exact : 1/10 × 1/10 × 1/10 = 1/1 000. Place au bioréacteur pour produire l'enzyme en grand.</p><button class="jd-go" data-a="bio-reac">Lancer le bioréacteur →</button>`;
			});
		};
		render();
	}
	function bioReactor(){
		S.bio = S.bio || { pip:[] };
		const R = { T:37, pH:7, od:.05, t:0, dur:24, dT:.04, dpH:-.012, ev:0 };
		const hist = [[0, .05]];
		show(`<div class="jd-k">L3 · biotech · étape 4/5</div><h2 class="jd-h">Le bioréacteur en direct</h2>
			<p class="jd-p">Tes bactéries poussent le mieux à <b>37 °C</b> et à <b>pH 7</b>. Garde-les dans cette zone pendant la culture : la courbe doit monter le plus haut possible.</p>
			<canvas class="jd-cv" width="400" height="170"></canvas>
			<div class="jd-ctl"><span class="lb">🌡️ Température</span><button data-c="T-">−</button><b data-v="T">37,0 °C</b><button data-c="T+">+</button><small>idéal 37 °C</small></div>
			<div class="jd-ctl"><span class="lb">🧪 pH</span><button data-c="pH-">−</button><b data-v="pH">7,0</b><button data-c="pH+">+</button><small>idéal 7</small></div>
			<div class="jd-msg" data-st>La culture démarre…</div><div data-fin></div>`);
		const fmt = v => v.toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 });
		const ui = () => {
			const t = card.querySelector('[data-v="T"]'), p = card.querySelector('[data-v="pH"]'); if(!t) return;
			t.textContent = fmt(R.T) + " °C"; t.classList.toggle("bad", Math.abs(R.T - 37) > 2);
			p.textContent = fmt(R.pH); p.classList.toggle("bad", Math.abs(R.pH - 7) > .5);
			plot(card.querySelector("canvas"), { xmax:R.dur, ymax:2, xl:"heures →", yl:"densité de bactéries", xt:[0, 6, 12, 18, 24], lines:[{ c:"#2f6b45", d:hist }], hline:{ v:1.67, c:"#d9a441", t:"objectif" } });
		};
		card.onclick = e => {
			const b = e.target.closest("[data-c]"); if(!b || R.t >= R.dur) return;
			const c = b.dataset.c; play("pop");
			if(c === "T+") R.T += .5; if(c === "T-") R.T -= .5; if(c === "pH+") R.pH += .1; if(c === "pH-") R.pH -= .1;
			ui();
		};
		sim = dt => {
			R.t += dt;
			if(R.ev === 0 && R.t > 7){ R.ev = 1; R.dT = .55; say("⚠️ Le chauffage s'emballe : surveille la température !", 3500); play("bad"); }
			if(R.ev === 1 && R.t > 11){ R.ev = 2; R.dT = .04; }
			if(R.ev === 2 && R.t > 14){ R.ev = 3; R.dpH = -.09; say("⚠️ Les bactéries acidifient le milieu : le pH baisse !", 3500); play("bad"); }
			R.T += R.dT*dt; R.pH += R.dpH*dt;
			const r = R.T > 43 ? -.15 : .22*Math.exp(-(((R.T - 37)/3)**2))*Math.exp(-(((R.pH - 7)/.6)**2));
			R.od = Math.max(.01, R.od + r*R.od*(1 - R.od/2)*dt);
			if(hist.length === 0 || R.t - hist[hist.length - 1][0] > .25) hist.push([Math.min(R.t, R.dur), R.od]);
			const st = card.querySelector("[data-st]");
			if(st) st.textContent = R.T > 43 ? "🔥 Trop chaud : les bactéries meurent !" : r > .15 ? "✓ Croissance rapide" : r > .05 ? "Croissance ralentie : corrige les réglages" : "⚠️ La culture ne pousse presque plus";
			ui();
			if(R.t >= R.dur){
				sim = null; card.onclick = null;
				const score = Math.min(100, Math.round(R.od/1.67*100)); S.bio.reac = score; S.modScore = score;
				play(score >= 70 ? "good" : "bad");
				card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:6px">Culture terminée : <b>${score} %</b> de l'objectif. ${score >= 85 ? "Excellent pilotage !" : score >= 60 ? "Correct, mais les écarts de température et de pH ont freiné la croissance." : "Les bactéries ont souffert : en bioprocédés, chaque degré compte."}</p><button class="jd-go" data-a="bio-col">Compter les bactéries →</button>`;
			}
		};
		ui();
	}
	function bioColonies(){
		const N = 28 + Math.floor(rnd()*22), pts = [];
		while(pts.length < N){ const a = rnd()*Math.PI*2, r = Math.sqrt(rnd())*165; const p = [200 + Math.cos(a)*r, 200 + Math.sin(a)*r]; if(pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 16)) pts.push(p); }
		const tapped = new Set();
		show(`<div class="jd-k">L3 · biotech · étape 5/5</div><h2 class="jd-h">Compter les colonies</h2>
			<p class="jd-p">Tu as étalé <b>0,1 mL</b> de la dilution au 1/1 000 sur une boîte de Petri. Chaque bactérie a formé une colonie. Touche-les toutes pour les compter.</p>
			<canvas class="jd-cv" width="400" height="400"></canvas><div class="jd-msg">Colonies comptées : <b data-n>0</b></div><div data-fin></div>`);
		const cv = card.querySelector("canvas");
		const draw = () => {
			const x = cv.getContext("2d");
			x.fillStyle = "#f4f8ee"; x.fillRect(0, 0, 400, 400);
			x.fillStyle = "#f3e6b8"; x.beginPath(); x.arc(200, 200, 185, 0, 7); x.fill(); x.strokeStyle = "#c9b98a"; x.lineWidth = 6; x.stroke();
			pts.forEach(([a, b], k) => { x.fillStyle = tapped.has(k) ? "#2f6b45" : "#fbfbf2"; x.beginPath(); x.arc(a, b, 7, 0, 7); x.fill(); x.strokeStyle = "#b9a76a"; x.lineWidth = 1.5; x.stroke(); });
		};
		draw();
		cv.onclick = e => {
			const r = cv.getBoundingClientRect(), px = (e.clientX - r.left)/r.width*400, py = (e.clientY - r.top)/r.height*400;
			let best = -1, bd = 22; pts.forEach(([a, b], k) => { const d = Math.hypot(a - px, b - py); if(d < bd && !tapped.has(k)){ bd = d; best = k; } });
			if(best < 0) return; tapped.add(best); play("pop"); draw(); card.querySelector("[data-n]").textContent = tapped.size;
			if(tapped.size === N){
				cv.onclick = null;
				const el = card.querySelector("[data-fin]");
				el.innerHTML = `<p class="jd-p" style="margin-top:6px"><b>${N} colonies</b> dans 0,1 mL d'une dilution au 1/1 000. <b>Combien de bactéries par mL dans ta culture ?</b></p><div data-q></div>`;
				const f = v => (N*v).toLocaleString("fr-FR");
				qcm(el.querySelector("[data-q]"), [["a", `${f(10000)} par mL`], ["b", `${f(1000)} par mL`], ["c", `${f(10)} par mL`]].sort(() => rnd() - .5), "a", a => {
					a.innerHTML = `<p class="jd-p" style="margin-top:8px">Exact : ${N} ÷ 0,1 mL × 1 000 = <b>${f(10000)} bactéries par mL</b>. C'est le calcul que font chaque jour les labos de biotech et de contrôle qualité.</p>${course("biotech")}<button class="jd-go" data-a="end">Rendre mon rapport de mission</button>`;
				});
			}
		};
	}

	/* ---------- L3 · parcours Ingénieur : la ferme urbaine du Palais Rameau ---------- */
	function startInge(){ stage = "inge"; setStage("L3 · Ingénieur"); flyTo("serre"); S.inge = {}; ingeSize(); }
	function ingeSize(){
		show(`<div class="jd-k">L3 · ingénieur · étape 1/3</div><h2 class="jd-h">Dimensionner la ferme</h2>
			<p class="jd-p">Le restaurant universitaire veut <b>60 salades par semaine</b>, toute l'année, cultivées hors-sol au Palais Rameau. Une salade met <b>5 semaines</b> à pousser.</p>
			<p class="jd-p"><b>Combien de salades doivent pousser en même temps ?</b></p><div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [["60", "60"], ["300", "300"], ["12", "12"]], "300", a => {
			a.innerHTML = `<p class="jd-p" style="margin-top:8px">60 par semaine × 5 semaines = <b>300 salades</b> en culture en permanence. Un bac accueille 12 salades : <b>combien de bacs ?</b></p><div data-q2></div>`;
			qcm(a.querySelector("[data-q2]"), [["25", "25 bacs"], ["5", "5 bacs"], ["36", "36 bacs"]], "25", b => {
				b.innerHTML = `<p class="jd-p" style="margin-top:8px">300 ÷ 12 = <b>25 bacs</b>. Chaque bac consomme 2 L de solution nutritive par heure. <b>Quelle pompe choisir ?</b></p><div data-q3></div>`;
				qcm(b.querySelector("[data-q3]"), [["a", "Pompe A · 30 L/h · 20 W"], ["b", "Pompe B · 60 L/h · 35 W"], ["c", "Pompe C · 120 L/h · 80 W"]], "b", c => {
					c.innerHTML = `<p class="jd-p" style="margin-top:8px">Il faut 25 × 2 = 50 L/h. La pompe A est trop faible, la C consomme plus du double pour rien : la <b>B</b> est le bon dimensionnement.</p><button class="jd-go" data-a="inge-model">Modéliser la croissance →</button>`;
				});
			});
		});
	}
	function ingeModel(){
		const K = 250, r = .2, t0 = 20, f = t => K/(1 + Math.exp(-r*(t - t0)));
		const pts = []; for(let d=2; d<=24; d+=2) pts.push([d, Math.max(2, f(d)*(.92 + rnd()*.16))]);
		show(`<div class="jd-k">L3 · ingénieur · étape 2/3</div><h2 class="jd-h">Modéliser la croissance</h2>
			<p class="jd-p">Les capteurs ont pesé une salade tous les 2 jours. Pour prévoir la récolte, il faut un <b>modèle</b>. <b>Quelle courbe décrit le mieux ces mesures ?</b></p>
			<canvas class="jd-cv" width="400" height="200"></canvas><div data-q></div>`);
		const cv = card.querySelector("canvas");
		const base = { xmax:36, ymax:280, xl:"jours →", yl:"masse (g)", pts, xt:[0, 5, 10, 15, 20, 25, 30, 35], yt:[100, 200] };
		plot(cv, base);
		qcm(card.querySelector("[data-q]"), [["lin", "Une droite : elle pousse toujours à la même vitesse"], ["exp", "Une exponentielle : elle accélère sans fin"], ["log", "Une courbe en S : lente, rapide, puis elle plafonne"]], "log", a => {
			const curve = []; for(let t=0; t<=36; t+=.5) curve.push([t, f(t)]);
			plot(cv, { ...base, lines:[{ c:"#2f6b45", d:curve }], hline:{ v:200, c:"#d9a441", t:"récolte : 200 g" } });
			a.innerHTML = `<p class="jd-p" style="margin-top:8px">C'est une <b>croissance logistique</b> : la salade plafonne vers 250 g. <b>D'après le modèle, vers quel jour atteint-elle 200 g ?</b></p><div data-q2></div>`;
			qcm(a.querySelector("[data-q2]"), [["20", "Jour 20"], ["27", "Jour 27"], ["35", "Jour 35"]], "27", b => {
				b.innerHTML = `<p class="jd-p" style="margin-top:8px">Exact : la courbe croise les 200 g vers le <b>jour 27</b>. Le modèle permet de planifier les récoltes… et les commandes du resto U.</p><button class="jd-go" data-a="inge-serre">Piloter la serre →</button>`;
			});
		});
	}
	const fr1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:1 });
	function ingeSerre(){
		S.inge = S.inge || {};
		const G = { L:60, EC:1.2, aer:false, T:22, t:0, dur:24, bio:0, kwh:0, budget:30, ev:0 };
		show(`<div class="jd-k">L3 · ingénieur · étape 3/3</div><h2 class="jd-h">Piloter la serre en direct</h2>
			<p class="jd-p">Fais pousser un maximum de salades <b>sans dépasser le budget énergie</b>. La lumière accélère la croissance mais consomme, les nutriments ont un réglage idéal.</p>
			<canvas class="jd-cv" width="400" height="150"></canvas>
			<div class="jd-ctl"><span class="lb">💡 Lumière</span><button data-c="L-">−</button><b data-v="L"></b><button data-c="L+">+</button><small>consomme de l'énergie</small></div>
			<div class="jd-ctl"><span class="lb">🧪 Nutriments</span><button data-c="E-">−</button><b data-v="E"></b><button data-c="E+">+</button><small>idéal autour de 1,8</small></div>
			<div class="jd-ctl"><span class="lb">🌬️ Aération</span><button data-c="A" aria-pressed="false" style="width:auto;padding:0 12px">Off</button><b data-v="T"></b><small>température</small></div>
			<div class="jd-msg" data-st></div><div data-fin></div>`);
		const ui = () => {
			const q = s => card.querySelector(s); if(!q('[data-v="L"]')) return;
			q('[data-v="L"]').textContent = G.L + " %";
			q('[data-v="E"]').textContent = G.EC.toLocaleString("fr-FR", { minimumFractionDigits:1, maximumFractionDigits:2 }); q('[data-v="E"]').classList.toggle("bad", Math.abs(G.EC - 1.8) > .5);
			q('[data-v="T"]').textContent = Math.round(G.T) + " °C"; q('[data-v="T"]').classList.toggle("bad", G.T > 28);
			const a = q('[data-c="A"]'); a.setAttribute("aria-pressed", String(G.aer)); a.textContent = G.aer ? "On" : "Off";
			const x = q("canvas").getContext("2d"), W = 400;
			x.clearRect(0, 0, W, 150); x.fillStyle = "#fff"; x.fillRect(0, 0, W, 150);
			x.font = "bold 17px Nunito, sans-serif"; x.fillStyle = "#4d5a48";
			x.fillText(`🥬 Croissance : ${Math.round(G.bio)} %`, 14, 30); x.fillText(`⚡ Énergie : ${fr1(G.kwh)} / ${G.budget} kWh`, 14, 95);
			x.fillStyle = "#eef5e6"; x.fillRect(14, 40, 372, 22); x.fillStyle = "#3d8a5a"; x.fillRect(14, 40, 372*Math.min(1, G.bio/100), 22);
			x.fillStyle = "#eef5e6"; x.fillRect(14, 105, 372, 22); x.fillStyle = G.kwh > G.budget ? "#c4532f" : "#d9a441"; x.fillRect(14, 105, 372*Math.min(1, G.kwh/G.budget), 22);
			x.fillStyle = "#4d5a48"; x.fillText(`⏱️ ${Math.max(0, Math.ceil(G.dur - G.t))} s`, 330, 30);
		};
		card.onclick = e => {
			const b = e.target.closest("[data-c]"); if(!b || G.t >= G.dur) return;
			const c = b.dataset.c; play("pop");
			if(c === "L+") G.L = Math.min(100, G.L + 10); if(c === "L-") G.L = Math.max(0, G.L - 10);
			if(c === "E+") G.EC = Math.min(3, G.EC + .2); if(c === "E-") G.EC = Math.max(.4, G.EC - .2);
			if(c === "A") G.aer = !G.aer;
			G.EC = Math.round(G.EC*10)/10; ui();
		};
		sim = dt => {
			G.t += dt;
			if(G.ev === 0 && G.t > 9){ G.ev = 1; say("🔥 Canicule sur Lille : la serre chauffe ! Pense à aérer.", 3500); play("bad"); }
			if(G.ev === 1 && G.t > 19){ G.ev = 2; say("La canicule est passée : l'aération n'est plus utile.", 3000); }
			const heat = G.ev === 1 ? 34 : 22, target = G.aer ? Math.min(heat, 23) : heat;
			G.T += (target - G.T)*Math.min(1, dt*.6);
			const g = (1 - Math.exp(-G.L/40))*Math.exp(-(((G.EC - 1.8)/.6)**2))*Math.exp(-(((G.T - 22)/6)**2));
			G.bio = Math.min(100, G.bio + g*dt*4.6);
			G.kwh += (G.L/100*1.3 + (G.aer ? .5 : 0) + .1)*dt;
			const st = card.querySelector("[data-st]");
			if(st) st.textContent = G.T > 28 ? "🥵 Trop chaud : les salades souffrent" : Math.abs(G.EC - 1.8) > .5 ? "Nutriments mal dosés : la croissance ralentit" : g > .6 ? "✓ Croissance optimale" : "Croissance moyenne";
			ui();
			if(G.t >= G.dur){
				sim = null; card.onclick = null;
				const over = Math.max(0, G.kwh - G.budget), score = Math.max(0, Math.min(100, Math.round(G.bio - over*4)));
				S.inge.serre = score; S.inge.kwh = G.kwh; S.modScore = score;
				play(score >= 70 ? "good" : "bad");
				card.querySelector("[data-fin]").innerHTML = `<p class="jd-p" style="margin-top:6px">Bilan : croissance ${Math.round(G.bio)} %, ${fr1(G.kwh)} kWh sur ${G.budget} autorisés${over > 0 ? ` (<b>dépassement de ${fr1(over)} kWh</b>)` : ""}. Score : <b>${score} %</b>. ${score >= 80 ? "Un vrai pilotage d'ingénieur : rendement et sobriété." : "L'ingénieur cherche le meilleur compromis entre rendement et énergie : rejoue pour l'améliorer."}</p>${course("inge")}<button class="jd-go" data-a="end">Rendre mon rapport de mission</button>`;
			}
		};
		ui();
	}

	/* ---------- rapport final ---------- */
	function finale(){
		stage = "end"; setStage("Rapport de mission");
		const e = S.errors, sc = S.modScore, P = PARCOURS[S.parcours || "eco"];
		const mention = e <= 3 && sc >= 70 ? "Très bien" : e <= 8 && sc >= 40 ? "Bien" : "Assez bien";
		S.done.add(S.parcours);
		onEvent && onEvent("win", mention, S.parcours);
		play("win"); flyTo("jardin", 2);
		const title = { eco:"Jardin labellisé « refuge de biodiversité » !", biotech:"Ton enzyme est produite !", inge:"La ferme urbaine est lancée !" }[S.parcours];
		const row = { eco:["Population de pâquerettes", `écart de ${S.quadErr} %`], biotech:["Bioréacteur", `${S.bio && S.bio.reac} % de l'objectif`], inge:["Serre du Palais Rameau", `${S.inge && S.inge.serre} %`] }[S.parcours];
		const others = Object.keys(PARCOURS).filter(k => k !== S.parcours);
		show(`<div class="jd-k">Licence Sciences de la Vie · parcours ${P.name}</div><h2 class="jd-h">${title}</h2>
			<div class="jd-big">🏅</div>
			<p class="jd-p" style="text-align:center">Mission accomplie, mention <b>${mention}</b>.</p>
			<table class="jd-tbl">
				<tr><td>Espèces identifiées</td><td>${[...S.found].map(id => SPECIES[id].emoji).join(" ")} (${S.found.size}/6)</td></tr>
				<tr><td>Proportion de Mendel</td><td>${S.geneObs == null ? "—" : `${40 - S.geneObs} 💜 · ${S.geneObs} 🤍`}</td></tr>
				<tr><td>${P.icon} ${row[0]}</td><td>${row[1]}</td></tr>
				<tr><td>Erreurs en chemin</td><td>${e}</td></tr></table>
			<p class="jd-p">Tu as touché à ${S.learned.size} cours de la licence (avec un stage chaque année pour pratiquer) :</p>
			<ul class="jd-list">${["cle", "reseau", "genet", P.course].filter(k => S.learned.has(k)).map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${others.map(k => `<button class="jd-alt" data-p="${k}">${PARCOURS[k].icon} Essayer le parcours ${PARCOURS[k].name}${S.done.has(k) ? " · 🏅" : ""}</button>`).join("")}
			${openLead ? `<button class="jd-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="jd-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Sciences de la Vie ↗</a>
			<button class="jd-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="jd-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	panel.addEventListener("click", e => {
		const pc = e.target.closest("[data-p]");
		if(pc && PARCOURS[pc.dataset.p]){ play("pop"); sim = null; card.onclick = null; return startParcours(pc.dataset.p); }
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "hunt") return startHunt();
		if(k === "resume"){ hide(); stage = "hunt"; hintT = 0; return; }
		if(k === "web") return startWeb();
		if(k === "quad") return startQuad();
		if(k === "gene") return startGene();
		if(k === "sow") return sow();
		if(k === "end") return finale();
		if(k === "parcours") return chooseParcours();
		if(k === "bio-gel") return bioGel();
		if(k === "bio-pip") return bioPip();
		if(k === "bio-reac") return bioReactor();
		if(k === "bio-col") return bioColonies();
		if(k === "inge-model") return ingeModel();
		if(k === "inge-serre") return ingeSerre();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){
			Object.assign(S, { found:new Set(), errors:0, keyErrors:0, webErrors:0, quadErr:null, quadRandom:false, geneObs:null, learned:new Set(), parcours:null, troncErrors:0, modScore:0 });
			Object.values(C).forEach(g => g.visible = true); pots.forEach(p => scene.remove(p.g)); pots.length = 0;
			root.querySelectorAll("[data-f]").forEach(el => el.classList.remove("on"));
			return intro();
		}
	});
	hintBtn.addEventListener("click", () => {
		const left = Object.keys(SPECIES).filter(id => !S.found.has(id)); if(!left.length) return;
		const id = left[0]; spark.position.copy(C[id].position).add(new THREE.Vector3(0, 1.1, 0));
		say(`Indice : regarde ${SPECIES[id].where} ✨`, 5000); play("chime");
	});
	// toucher une bête (sans confondre avec une rotation de la vue)
	const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
	canvas.addEventListener("pointerdown", e => { down = { x:e.clientX, y:e.clientY, t:performance.now() }; });
	canvas.addEventListener("pointerup", e => {
		if(!down || stage !== "hunt" || !panel.hidden) return;
		const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
		if(moved > 10 || dt > 500) return;
		ptr.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1); ray.setFromCamera(ptr, camera);
		const h = ray.intersectObjects(hits.filter(m => m.parent.visible), false)[0];
		if(h) onFound(h.object.userData.id);
	});

	function loop(t){
		if(closed) return;
		const dt = Math.min(.05, (t - (last || t))/1000); last = t;
		if(fly){ fly.k = Math.min(1, fly.k + dt/fly.dur); const e = fly.k < .5 ? 2*fly.k*fly.k : 1 - Math.pow(-2*fly.k + 2, 2)/2;
			camera.position.lerpVectors(fly.p0, fly.p, e); controls.target.lerpVectors(fly.t0, fly.t, e); if(fly.k >= 1) fly = null; }
		controls.enabled = !fly && stage === "hunt"; controls.update();
		// petites animations : l'abeille butine, la mésange sautille, l'indice brille
		C.abeille.position.y = 1.5 + Math.sin(t/260)*.12; C.abeille.position.x = 5.2 + Math.sin(t/900)*.5;
		C.mesange.rotation.y = Math.sin(t/700)*.6;
		spark.rotation.y += dt*3; spark.scale.setScalar(1 + Math.sin(t/150)*.2);
		if(stage === "hunt" && panel.hidden){ hintT += dt; if(hintT > 15 && hintBtn.hidden) hintBtn.hidden = false; }
		else hintBtn.hidden = true;
		if(sim) sim(dt);
		for(const p of pots){ p.t += dt; const k = Math.max(0, Math.min(1, p.t/1.2)); p.g.scale.setScalar(.01 + k*(2 - k)*.99); }
		renderer.render(scene, camera);
		raf = requestAnimationFrame(loop);
	}
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); removeEventListener("resize", layout); document.removeEventListener("keydown", onKey);
		controls.dispose(); renderer.dispose(); renderer.forceContextLoss();
		root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".jd-x").addEventListener("click", close);
	intro();
	raf = requestAnimationFrame(loop);
	onEvent && onEvent("start");
	// debug (?debug) : sauter les étapes pendant les tests
	if(window.campus) window.campus.game = { S, card, get stage(){ return stage; }, find:onFound, draw:drawSpecies, web:startWeb, quad:startQuad, gene:startGene, end:finale,
		parcours:chooseParcours, start:startParcours, bio:{ dna:bioDNA, gel:bioGel, pip:bioPip, reac:bioReactor, col:bioColonies }, inge:{ size:ingeSize, model:ingeModel, serre:ingeSerre },
		run(sec){ for(let i=0; i<sec*30 && sim; i++) sim(1/30); }, get sim(){ return sim; } };
}

/* ---------- les dessins de la loupe : ce que l'on doit observer pour répondre à la clé ---------- */
function drawSpecies(id, cv){
	const x = cv.getContext("2d");
	x.clearRect(0, 0, 320, 190); x.fillStyle = "#f4f8ee"; x.fillRect(0, 0, 320, 190);
	x.save(); x.translate(160, 98); x.lineCap = "round"; x.lineJoin = "round";
	const ell = (cx, cy, rx, ry, fill, rot=0) => { x.fillStyle = fill; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI*2); x.fill(); };
	const line = (pts, w, c) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); };
	if(id === "coccinelle"){
		for(const s of [-1, 1]) for(let i=0;i<3;i++) line([[s*30, -18 + i*20], [s*62, -30 + i*26], [s*74, -22 + i*30]], 4, "#1f1f1f");
		line([[-8, -62], [-20, -82]], 3, "#1f1f1f"); line([[8, -62], [20, -82]], 3, "#1f1f1f");
		ell(0, -56, 20, 15, "#1f1f1f");
		ell(0, 4, 48, 56, "#d62828");
		line([[0, -50], [0, 60]], 3, "#1f1f1f");
		for(const [a, b, r] of [[0, -42, 10], [-24, -14, 9], [24, -14, 9], [-28, 16, 8], [28, 16, 8], [-18, 40, 8], [18, 40, 8]]) ell(a, b, r, r, "#1f1f1f");
	}
	if(id === "abeille"){
		for(const s of [-1, 1]) for(let i=0;i<3;i++) line([[s*12, -36 + i*10], [s*44, -24 + i*16], [s*54, -6 + i*20]], 3.5, "#2b2b2b");
		line([[-6, -70], [-18, -88]], 3, "#2b2b2b"); line([[6, -70], [18, -88]], 3, "#2b2b2b");
		ell(0, -64, 14, 12, "#1f1f1f"); ell(0, -38, 20, 17, "#6b4423");
		x.save(); x.beginPath(); x.ellipse(0, 18, 28, 42, 0, 0, Math.PI*2); x.clip();
		x.fillStyle = "#f2c230"; x.fillRect(-30, -26, 60, 90); x.fillStyle = "#1f1f1f"; for(const y of [2, 22, 42]) x.fillRect(-30, y, 60, 9); x.restore();
		x.globalAlpha = .7; ell(-38, -48, 36, 16, "#cfe8ff", -.5); ell(38, -48, 36, 16, "#cfe8ff", .5); x.globalAlpha = 1;
		x.strokeStyle = "#7aa0b8"; x.lineWidth = 1.5; x.beginPath(); x.ellipse(-38, -48, 36, 16, -.5, 0, Math.PI*2); x.ellipse(38, -48, 36, 16, .5, 0, Math.PI*2); x.stroke();
	}
	if(id === "araignee"){
		for(const s of [-1, 1]) for(let i=0;i<4;i++) line([[s*10, -30 + i*9], [s*52, -62 + i*30], [s*88, -40 + i*34]], 4, "#2b2b2b");
		ell(0, -28, 22, 20, "#3a2414"); ell(0, 22, 32, 38, "#5a3a22");
		x.strokeStyle = "#e8d6b0"; x.lineWidth = 3; line([[0, 4], [0, 44]], 3, "#e8d6b0"); line([[-14, 20], [14, 20]], 3, "#e8d6b0");
		for(const [a, b] of [[-7, -38], [7, -38], [-3, -42], [3, -42]]) ell(a, b, 2.4, 2.4, "#fff");
	}
	if(id === "lombric"){
		const pts = []; for(let k=0;k<=40;k++){ const u = -120 + k*6; pts.push([u, Math.sin(u/28)*26]); }
		line(pts, 24, "#d98a8a");
		x.strokeStyle = "rgba(120,50,50,.45)"; x.lineWidth = 2;
		for(let k=1;k<40;k+=1){ const [a, b] = pts[k], [c, d] = pts[k + 1] || pts[k]; const ang = Math.atan2(d - b, c - a) + Math.PI/2; x.beginPath(); x.moveTo(a + Math.cos(ang)*11, b + Math.sin(ang)*11); x.lineTo(a - Math.cos(ang)*11, b - Math.sin(ang)*11); x.stroke(); }
		line(pts.slice(9, 14), 28, "#c76f73");
	}
	if(id === "mesange"){
		x.fillStyle = "#2f6db5"; x.beginPath(); x.moveTo(-50, 0); x.lineTo(-105, 18); x.lineTo(-98, 34); x.lineTo(-44, 20); x.fill();
		ell(0, 12, 58, 42, "#f2d14a");
		ell(-6, -2, 46, 26, "#5b8f6a", -.15);
		x.strokeStyle = "rgba(255,255,255,.4)"; x.lineWidth = 2; for(let i=0;i<4;i++){ x.beginPath(); x.arc(-20 + i*12, -2, 14, .2, 1.4); x.stroke(); }
		ell(48, -26, 27, 25, "#ffffff");
		x.fillStyle = "#2f6db5"; x.beginPath(); x.ellipse(48, -32, 27, 19, 0, Math.PI, Math.PI*2); x.fill();
		line([[26, -22], [70, -24]], 5, "#1f2b4a"); ell(58, -24, 4, 4, "#111");
		x.fillStyle = "#3a3a3a"; x.beginPath(); x.moveTo(72, -26); x.lineTo(90, -21); x.lineTo(72, -16); x.fill();
		line([[-6, 50], [-12, 80], [-24, 84]], 4, "#6b6b6b"); line([[14, 50], [16, 80], [4, 84]], 4, "#6b6b6b");
	}
	if(id === "herisson"){
		for(let k=0;k<70;k++){ const a = Math.PI + (k/70)*Math.PI*1.05 - .05, r1 = 46, r2 = 72 + (k % 3)*7; line([[-10 + Math.cos(a)*r1*1.5, 30 + Math.sin(a)*r1], [-10 + Math.cos(a)*r2*1.4, 30 + Math.sin(a)*r2]], 3, k % 2 ? "#4a3020" : "#6b4a33"); }
		ell(-10, 30, 72, 48, "#7a5230");
		x.fillStyle = "#c9a27a"; x.beginPath(); x.moveTo(48, 0); x.quadraticCurveTo(70, -4, 110, 26); x.lineTo(56, 48); x.fill();
		ell(110, 26, 7, 6, "#111"); ell(76, 14, 4, 4, "#111");
		for(const lx of [-50, -22, 14, 40]) line([[lx, 70], [lx, 84]], 7, "#5a3a22");
	}
	x.restore();
}
