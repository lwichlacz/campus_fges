/* Rendu soigné des mini-jeux (nov. 2026) : ce qui fait passer une scène de « maquette » à « image finie ».
   - un ton neutre (Khronos PBR Neutral) : les couleurs de la charte restent justes, sans le délavage de l'ACES ;
   - une lumière d'ambiance (studio générique) : reflets doux sur le verre, le métal, le plastique ;
   - des ombres douces qui suivent la caméra : une seule carte d'ombre nette, où que l'on regarde ;
   - les modèles 3D (glTF compressés meshopt), chargés une fois et clonés, animations comprises.
   Tout est réglable par jeu, et tout se dégrade sans casser : si un modèle manque, le jeu garde sa forme simple. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const PHONE = () => innerWidth < 760 || matchMedia("(pointer:coarse)").matches;

/* --- l'éclairage d'ensemble --- */
export function soigner(renderer, scene, o = {}){
	renderer.toneMapping = THREE.NeutralToneMapping;
	renderer.toneMappingExposure = o.exposure ?? 1;
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	const pm = new THREE.PMREMGenerator(renderer);
	const room = new RoomEnvironment();
	const env = pm.fromScene(room, .04).texture;
	room.traverse(n => { if(n.isMesh){ n.geometry.dispose(); n.material.dispose(); } });
	pm.dispose();
	scene.environment = env;
	scene.environmentIntensity = o.env ?? .55;
	return env;
}

/* --- le soleil et son ombre douce, recentrée sur ce que regarde la caméra --- */
export function soleil(renderer, scene, controls, o = {}){
	const sun = new THREE.DirectionalLight(o.color || "#fff3e0", o.intensity ?? 1.6);
	const dir = new THREE.Vector3(...(o.dir || [-.45, 1, .55])).normalize();
	const R = o.radius || 22, phone = PHONE();
	if(o.shadows !== false){
		renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		sun.castShadow = true;
		const s = phone ? 1024 : 2048; sun.shadow.mapSize.set(s, s);
		const c = sun.shadow.camera; c.left = c.bottom = -R; c.right = c.top = R; c.near = 1; c.far = R*5;
		sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 4;
	}
	scene.add(sun, sun.target);
	const at = new THREE.Vector3();
	function follow(){
		at.copy(controls.target);
		// on cale la carte d'ombre sur sa propre grille de texels : sinon l'ombre « grésille » quand la caméra bouge
		const step = 2*R/(sun.shadow.mapSize.x || 2048);
		at.x = Math.round(at.x/step)*step; at.z = Math.round(at.z/step)*step;
		sun.target.position.copy(at); sun.position.copy(at).addScaledVector(dir, R*2.2);
	}
	follow();
	return { sun, follow };
}

/* --- les modèles --- */
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
export function modele(url){
	if(!cache.has(url)) cache.set(url, new Promise((ok, ko) => loader.load(url, ok, undefined, ko)));
	return cache.get(url);
}
/* une copie indépendante (squelette compris), qui porte et reçoit les ombres */
export function copie(gltf, o = {}){
	const root = cloneSkinned(gltf.scene);
	root.traverse(n => {
		if(!n.isMesh) return;
		n.castShadow = o.cast !== false; n.receiveShadow = o.receive !== false;
		n.frustumCulled = !n.isSkinnedMesh;      // un modèle animé déborde de sa boîte d'origine : on ne le fait pas disparaître trop tôt
	});
	return root;
}
/* remplace chaque matériau par une copie (ou par ce que renvoie f) : pour recolorer un modèle sans toucher aux autres */
export function recolorer(root, f){
	const seen = new Map();
	root.traverse(n => {
		if(!n.isMesh) return;
		const swap = m => { if(!seen.has(m)) seen.set(m, f(m) || m); return seen.get(m); };
		n.material = Array.isArray(n.material) ? n.material.map(swap) : swap(n.material);
	});
	return [...new Set(seen.values())];
}

/* --- le sol : une herbe, une paille, un carrelage qui ne soient pas des aplats --- */
export function grain(renderer, base, o = {}){
	const S = o.size || 256, c = document.createElement("canvas"); c.width = c.height = S;
	const x = c.getContext("2d"); x.fillStyle = base; x.fillRect(0, 0, S, S);
	let seed = o.seed || 7; const r = () => (seed = (seed*16807) % 2147483647)/2147483647;
	const cols = o.flecks || ["rgba(0,0,0,.06)", "rgba(255,255,255,.07)"];
	for(let i = 0; i < (o.n || 2600); i++){
		x.fillStyle = cols[i % cols.length];
		const px = r()*S, py = r()*S, w = (o.w || 1.6)*(.5 + r()), h = (o.h || 5)*(.5 + r());
		x.save(); x.translate(px, py); x.rotate((r() - .5)*(o.tilt ?? .5)); x.fillRect(-w/2, -h/2, w, h); x.restore();
	}
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
	if(o.repeat) t.repeat.set(...o.repeat);
	return t;
}

/* --- le guide de geste ---
   Un point de contact (blanc cerclé de cyan) posé sur l'objet, qui mime le geste : tap (toucher), hold (maintenir),
   down (glisser vers le bas), side (glisser de côté), trace (tracer une boucle). La flèche du jeu dit où ; le guide dit
   quoi faire. Règle de conception : on guide la MANIPULATION (prendre, poser, maintenir, glisser), jamais la DÉCISION
   (quelle pièce, quelle dose, quel logement) : la réflexion reste au joueur.
   Usage : const g = guideGeste(conteneur, camera, canevas) ; g.show(objet3D, "hold", { gy:.3, r:90 }) ; g.hide() ;
   g.update() à chaque image (ou W.onFrame(g.update)). */
const GUIDE_CSS = `.g3-g{position:absolute;left:0;top:0;z-index:4;width:0;height:0;pointer-events:none;transition:opacity .2s}
.g3-g[hidden]{display:block;opacity:0}
.g3-g i,.g3-g u{position:absolute;left:-16px;top:-16px;width:32px;height:32px;border-radius:50%;box-sizing:border-box}
.g3-g i{background:rgba(255,255,255,.95);border:3px solid #21b7cb;box-shadow:0 3px 12px rgba(15,49,104,.4)}
.g3-g u{border:3px solid #21b7cb;opacity:0}
.g3-g b{position:absolute;display:none;border-left:3px dashed rgba(255,255,255,.95);filter:drop-shadow(0 1px 2px rgba(15,49,104,.6))}
.g3-g[data-k=tap] i{animation:g3Tap 1.3s ease-in-out infinite}
.g3-g[data-k=tap] u{animation:g3Ripple 1.3s ease-out infinite}
@keyframes g3Tap{0%,60%,100%{transform:scale(1)}30%{transform:scale(.78)}}
@keyframes g3Ripple{0%,25%{transform:scale(.6);opacity:0}35%{opacity:.9}100%{transform:scale(2.4);opacity:0}}
.g3-g[data-k=hold] i{animation:g3Hold 2.2s ease-in-out infinite}
.g3-g[data-k=hold] u{animation:g3HoldRing 2.2s linear infinite}
@keyframes g3Hold{0%,100%{transform:scale(1)}12%,80%{transform:scale(.8)}}
@keyframes g3HoldRing{0%,12%{transform:scale(.9);opacity:0}15%{opacity:1}80%{transform:scale(2);opacity:1}100%{transform:scale(2);opacity:0}}
.g3-g[data-k=down] b{display:block;left:-1.5px;top:-50px;height:120px}
.g3-g[data-k=down] i{animation:g3Down 1.6s cubic-bezier(.4,0,.3,1) infinite}
@keyframes g3Down{0%{transform:translateY(-50px);opacity:0}12%{opacity:1}70%{transform:translateY(70px);opacity:1}100%{transform:translateY(70px);opacity:0}}
.g3-g[data-k=side] b{display:block;border-left:0;border-top:3px dashed rgba(255,255,255,.95);left:-50px;top:-1.5px;width:100px;height:0}
.g3-g[data-k=side] i{animation:g3Side 2s ease-in-out infinite}
@keyframes g3Side{0%,100%{transform:translateX(-50px)}50%{transform:translateX(50px)}}
.g3-g[data-k=trace] i{animation:g3Trace 2.4s linear infinite}
@keyframes g3Trace{from{transform:rotate(0) translateX(var(--r,70px)) rotate(0)}to{transform:rotate(360deg) translateX(var(--r,70px)) rotate(-360deg)}}
.g3-g[data-k=trace] b{display:block;border:3px dashed rgba(255,255,255,.9);border-radius:50%;left:calc(-1*var(--r,70px));top:calc(-1*var(--r,70px));width:calc(2*var(--r,70px));height:calc(2*var(--r,70px));box-sizing:border-box}
@media (prefers-reduced-motion:reduce){.g3-g i,.g3-g u{animation:none!important}}`;
export function guideGeste(host, camera, canvas){
	if(!document.getElementById("g3-css")){ const st = document.createElement("style"); st.id = "g3-css"; st.textContent = GUIDE_CSS; document.head.appendChild(st); }
	const el = document.createElement("div"); el.className = "g3-g"; el.hidden = true; el.setAttribute("aria-hidden", "true");
	el.innerHTML = "<u></u><b></b><i></i>"; host.appendChild(el);
	let at = null; const v = new THREE.Vector3();
	return {
		el,
		show(obj, k = "tap", o = {}){ at = obj ? { obj, dy:o.gy || 0 } : null; el.hidden = !obj; el.dataset.k = k; el.style.setProperty("--r", (o.r || 70) + "px"); },
		hide(){ at = null; el.hidden = true; },
		update(){
			if(!at) return;
			at.obj.getWorldPosition(v); v.y += at.dy; v.project(camera);
			if(v.z > 1){ el.style.opacity = 0; return; }
			el.style.opacity = ""; el.style.transform = `translate(${(v.x + 1)/2*canvas.clientWidth}px,${(1 - v.y)/2*canvas.clientHeight}px)`;
		},
		dispose(){ el.remove(); }
	};
}
