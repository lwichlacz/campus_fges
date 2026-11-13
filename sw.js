/* Service worker du campus 3D : la borne de la JPO (et tout visiteur déjà venu) continue de marcher sans réseau.
   - À l'installation, tout le site est mis en cache : pages, modules (avec leur numéro ?v=), three.js, images.
   - Pages : réseau d'abord (pour voir les mises à jour), cache si le réseau manque ou tarde plus de 4 secondes.
   - Modules, images, three.js : cache d'abord. Un nouveau numéro de version change leur adresse, donc rien de périmé.
   - Polices Google : servies du cache, rafraîchies en arrière-plan.
   - Le reste (formulaire, météo, mesure d'audience) passe toujours par le réseau.
   VERSION et FILES sont réécrits par tools/version.py : ne pas les modifier à la main. */
const VERSION = "c97a9c5f6a";
const FILES = [
	"./",
	"index.html",
	"liste.html",
	"credits.html",
	"formations.json",
	"js/atrium.js?v=c97a9c5f6a",
	"js/audio.js?v=c97a9c5f6a",
	"js/bu.js?v=c97a9c5f6a",
	"js/chapelle.js?v=c97a9c5f6a",
	"js/city.js?v=c97a9c5f6a",
	"js/data.js?v=c97a9c5f6a",
	"js/details.js?v=c97a9c5f6a",
	"js/eura.js?v=c97a9c5f6a",
	"js/eura_far.js?v=c97a9c5f6a",
	"js/euramap.js?v=c97a9c5f6a",
	"js/games/affaires-data.js?v=c97a9c5f6a",
	"js/games/affaires.js?v=c97a9c5f6a",
	"js/games/audit.js?v=c97a9c5f6a",
	"js/games/biodata.js?v=c97a9c5f6a",
	"js/games/boutique.js?v=c97a9c5f6a",
	"js/games/cargo.js?v=c97a9c5f6a",
	"js/games/clinique.js?v=c97a9c5f6a",
	"js/games/comptoir.js?v=c97a9c5f6a",
	"js/games/crise.js?v=c97a9c5f6a",
	"js/games/dossier.js?v=c97a9c5f6a",
	"js/games/gaming.js?v=c97a9c5f6a",
	"js/games/guichet-data.js?v=c97a9c5f6a",
	"js/games/guichet.js?v=c97a9c5f6a",
	"js/games/jardin.js?v=c97a9c5f6a",
	"js/games/jourj.js?v=c97a9c5f6a",
	"js/games/jpo.js?v=c97a9c5f6a",
	"js/games/marquelle.js?v=c97a9c5f6a",
	"js/games/moniac.js?v=c97a9c5f6a",
	"js/games/palier.js?v=c97a9c5f6a",
	"js/games/patrimoine.js?v=c97a9c5f6a",
	"js/games/robot.js?v=c97a9c5f6a",
	"js/games/ruee-data.js?v=c97a9c5f6a",
	"js/games/ruee.js?v=c97a9c5f6a",
	"js/games/stage3d.js?v=c97a9c5f6a",
	"js/games/table.js?v=c97a9c5f6a",
	"js/games/tp.js?v=c97a9c5f6a",
	"js/hauteurs.js?v=c97a9c5f6a",
	"js/kit.js?v=c97a9c5f6a",
	"js/landmarks.js?v=c97a9c5f6a",
	"js/main.js?v=c97a9c5f6a",
	"js/monuments.js?v=c97a9c5f6a",
	"js/rame.js?v=c97a9c5f6a",
	"js/render.js?v=c97a9c5f6a",
	"js/station.js?v=c97a9c5f6a",
	"js/vauban.js?v=c97a9c5f6a",
	"js/vauban_far.js?v=c97a9c5f6a",
	"js/wenovin.js?v=c97a9c5f6a",
	"vendor/three-0.165.0/build/three.module.min.js",
	"vendor/three-0.165.0/examples/jsm/controls/OrbitControls.js",
	"vendor/three-0.165.0/examples/jsm/math/SimplexNoise.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/EffectComposer.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/GTAOPass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/MaskPass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/OutputPass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/Pass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/RenderPass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/ShaderPass.js",
	"vendor/three-0.165.0/examples/jsm/postprocessing/UnrealBloomPass.js",
	"vendor/three-0.165.0/examples/jsm/shaders/CopyShader.js",
	"vendor/three-0.165.0/examples/jsm/shaders/GTAOShader.js",
	"vendor/three-0.165.0/examples/jsm/shaders/LuminosityHighPassShader.js",
	"vendor/three-0.165.0/examples/jsm/shaders/OutputShader.js",
	"vendor/three-0.165.0/examples/jsm/shaders/PoissonDenoiseShader.js",
	"vendor/three-0.165.0/examples/jsm/utils/BufferGeometryUtils.js",
	"img/apercu.jpg",
	"img/carte.jpg",
	"img/embleme-ucl.svg",
	"img/fges%20logo.png",
	"img/icone.png",
	"img/logo-fges.png",
	"img/sol.png",
	"img/sol_eura.png"
];
const CACHE = "campus-" + VERSION, RUNTIME = "campus-runtime";
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener("install", e => {
	e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
	e.waitUntil(caches.keys()
		.then(keys => Promise.all(keys.filter(k => k.startsWith("campus-") && k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))))
		.then(() => self.clients.claim()));
});

function timeout(ms){ return new Promise((_, no) => setTimeout(() => no(new Error("délai")), ms)); }

self.addEventListener("fetch", e => {
	const req = e.request;
	if(req.method !== "GET") return;
	const url = new URL(req.url);

	if(req.mode === "navigate"){
		e.respondWith(Promise.race([fetch(req), timeout(4000)])
			.then(res => { if(res.ok){ const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); } return res; })
			.catch(async () => (await caches.match(req, { ignoreSearch:true })) || (await caches.match("index.html")) || Response.error()));
		return;
	}
	if(FONTS.test(req.url)){
		e.respondWith(caches.open(RUNTIME).then(async c => {
			const hit = await c.match(req);
			const net = fetch(req).then(res => { if(res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit);
			return hit || net;
		}));
		return;
	}
	if(url.origin !== location.origin) return;
	e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
		if(res.ok && !url.pathname.startsWith("/api/")){ const copy = res.clone(); caches.open(RUNTIME).then(c => c.put(req, copy)); }
		return res;
	})));
});
