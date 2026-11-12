/* Service worker du campus 3D : la borne de la JPO (et tout visiteur déjà venu) continue de marcher sans réseau.
   - À l'installation, tout le site est mis en cache : pages, modules (avec leur numéro ?v=), three.js, images.
   - Pages : réseau d'abord (pour voir les mises à jour), cache si le réseau manque ou tarde plus de 4 secondes.
   - Modules, images, three.js : cache d'abord. Un nouveau numéro de version change leur adresse, donc rien de périmé.
   - Polices Google : servies du cache, rafraîchies en arrière-plan.
   - Le reste (formulaire, météo, mesure d'audience) passe toujours par le réseau.
   VERSION et FILES sont réécrits par tools/version.py : ne pas les modifier à la main. */
const VERSION = "fdd5d880ac";
const FILES = [
	"./",
	"index.html",
	"liste.html",
	"credits.html",
	"formations.json",
	"js/atrium.js?v=fdd5d880ac",
	"js/audio.js?v=fdd5d880ac",
	"js/bu.js?v=fdd5d880ac",
	"js/chapelle.js?v=fdd5d880ac",
	"js/city.js?v=fdd5d880ac",
	"js/data.js?v=fdd5d880ac",
	"js/details.js?v=fdd5d880ac",
	"js/eura.js?v=fdd5d880ac",
	"js/eura_far.js?v=fdd5d880ac",
	"js/euramap.js?v=fdd5d880ac",
	"js/games/affaires.js?v=fdd5d880ac",
	"js/games/audit.js?v=fdd5d880ac",
	"js/games/biodata.js?v=fdd5d880ac",
	"js/games/boutique.js?v=fdd5d880ac",
	"js/games/comptoir.js?v=fdd5d880ac",
	"js/games/crise.js?v=fdd5d880ac",
	"js/games/dossier.js?v=fdd5d880ac",
	"js/games/gaming.js?v=fdd5d880ac",
	"js/games/guichet-data.js?v=fdd5d880ac",
	"js/games/guichet.js?v=fdd5d880ac",
	"js/games/jardin.js?v=fdd5d880ac",
	"js/games/jpo.js?v=fdd5d880ac",
	"js/games/patrimoine.js?v=fdd5d880ac",
	"js/games/robot.js?v=fdd5d880ac",
	"js/games/ruee-data.js?v=fdd5d880ac",
	"js/games/ruee.js?v=fdd5d880ac",
	"js/games/table.js?v=fdd5d880ac",
	"js/games/telephone.js?v=fdd5d880ac",
	"js/hauteurs.js?v=fdd5d880ac",
	"js/kit.js?v=fdd5d880ac",
	"js/landmarks.js?v=fdd5d880ac",
	"js/main.js?v=fdd5d880ac",
	"js/monuments.js?v=fdd5d880ac",
	"js/rame.js?v=fdd5d880ac",
	"js/render.js?v=fdd5d880ac",
	"js/station.js?v=fdd5d880ac",
	"js/vauban.js?v=fdd5d880ac",
	"js/vauban_far.js?v=fdd5d880ac",
	"js/wenovin.js?v=fdd5d880ac",
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
