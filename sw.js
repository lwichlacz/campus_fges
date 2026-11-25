/* Service worker du campus 3D : la borne de la JPO (et tout visiteur déjà venu) continue de marcher sans réseau.
   - À l'installation, tout le site est mis en cache : pages, modules (avec leur numéro ?v=), three.js, images.
   - Pages : réseau d'abord (pour voir les mises à jour), cache si le réseau manque ou tarde plus de 4 secondes.
   - Modules, images, three.js : cache d'abord. Un nouveau numéro de version change leur adresse, donc rien de périmé.
   - Polices Google : servies du cache, rafraîchies en arrière-plan.
   - Le reste (formulaire, météo, mesure d'audience) passe toujours par le réseau.
   VERSION et FILES sont réécrits par tools/version.py : ne pas les modifier à la main. */
const VERSION = "af8a8a599e";
const FILES = [
	"./",
	"index.html",
	"liste.html",
	"credits.html",
	"formations.json",
	"js/atrium.js?v=af8a8a599e",
	"js/audio.js?v=af8a8a599e",
	"js/bu.js?v=af8a8a599e",
	"js/chapelle.js?v=af8a8a599e",
	"js/citadelle.js?v=af8a8a599e",
	"js/citadelle_osm.js?v=af8a8a599e",
	"js/city.js?v=af8a8a599e",
	"js/data.js?v=af8a8a599e",
	"js/details.js?v=af8a8a599e",
	"js/eura.js?v=af8a8a599e",
	"js/eura_details.js?v=af8a8a599e",
	"js/eura_extra.js?v=af8a8a599e",
	"js/eura_far.js?v=af8a8a599e",
	"js/euramap.js?v=af8a8a599e",
	"js/games/affaires-data.js?v=af8a8a599e",
	"js/games/affaires.js?v=af8a8a599e",
	"js/games/audit.js?v=af8a8a599e",
	"js/games/biodata.js?v=af8a8a599e",
	"js/games/boutique.js?v=af8a8a599e",
	"js/games/cargo.js?v=af8a8a599e",
	"js/games/clinique.js?v=af8a8a599e",
	"js/games/coldchain.js?v=af8a8a599e",
	"js/games/comptoir.js?v=af8a8a599e",
	"js/games/crise.js?v=af8a8a599e",
	"js/games/dossier.js?v=af8a8a599e",
	"js/games/gaming.js?v=af8a8a599e",
	"js/games/guichet-data.js?v=af8a8a599e",
	"js/games/guichet.js?v=af8a8a599e",
	"js/games/jardin.js?v=af8a8a599e",
	"js/games/jourj.js?v=af8a8a599e",
	"js/games/jpo.js?v=af8a8a599e",
	"js/games/marquelle.js?v=af8a8a599e",
	"js/games/moniac.js?v=af8a8a599e",
	"js/games/palier.js?v=af8a8a599e",
	"js/games/patrimoine.js?v=af8a8a599e",
	"js/games/rendu.js?v=af8a8a599e",
	"js/games/robot.js?v=af8a8a599e",
	"js/games/ruee-data.js?v=af8a8a599e",
	"js/games/ruee.js?v=af8a8a599e",
	"js/games/stage3d.js?v=af8a8a599e",
	"js/games/studio.js?v=af8a8a599e",
	"js/games/table.js?v=af8a8a599e",
	"js/games/tp.js?v=af8a8a599e",
	"js/hauteurs.js?v=af8a8a599e",
	"js/kit.js?v=af8a8a599e",
	"js/landmarks.js?v=af8a8a599e",
	"js/main.js?v=af8a8a599e",
	"js/monuments.js?v=af8a8a599e",
	"js/rame.js?v=af8a8a599e",
	"js/render.js?v=af8a8a599e",
	"js/station.js?v=af8a8a599e",
	"js/vauban.js?v=af8a8a599e",
	"js/vauban_far.js?v=af8a8a599e",
	"js/wenovin.js?v=af8a8a599e",
	"vendor/three-0.165.0/build/three.module.min.js",
	"vendor/three-0.165.0/examples/jsm/controls/OrbitControls.js",
	"vendor/three-0.165.0/examples/jsm/environments/RoomEnvironment.js",
	"vendor/three-0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js",
	"vendor/three-0.165.0/examples/jsm/libs/meshopt_decoder.module.js",
	"vendor/three-0.165.0/examples/jsm/loaders/GLTFLoader.js",
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
	"vendor/three-0.165.0/examples/jsm/utils/SkeletonUtils.js",
	"img/apercu.jpg",
	"img/carte.jpg",
	"img/embleme-ucl.svg",
	"img/fges%20logo.png",
	"img/icone.png",
	"img/logo-fges.png",
	"img/logo-fges.svg",
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
