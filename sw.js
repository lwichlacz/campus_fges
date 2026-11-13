/* Service worker du campus 3D : la borne de la JPO (et tout visiteur déjà venu) continue de marcher sans réseau.
   - À l'installation, tout le site est mis en cache : pages, modules (avec leur numéro ?v=), three.js, images.
   - Pages : réseau d'abord (pour voir les mises à jour), cache si le réseau manque ou tarde plus de 4 secondes.
   - Modules, images, three.js : cache d'abord. Un nouveau numéro de version change leur adresse, donc rien de périmé.
   - Polices Google : servies du cache, rafraîchies en arrière-plan.
   - Le reste (formulaire, météo, mesure d'audience) passe toujours par le réseau.
   VERSION et FILES sont réécrits par tools/version.py : ne pas les modifier à la main. */
const VERSION = "186e790aba";
const FILES = [
	"./",
	"index.html",
	"liste.html",
	"credits.html",
	"formations.json",
	"js/atrium.js?v=186e790aba",
	"js/audio.js?v=186e790aba",
	"js/bu.js?v=186e790aba",
	"js/chapelle.js?v=186e790aba",
	"js/city.js?v=186e790aba",
	"js/data.js?v=186e790aba",
	"js/details.js?v=186e790aba",
	"js/eura.js?v=186e790aba",
	"js/eura_far.js?v=186e790aba",
	"js/euramap.js?v=186e790aba",
	"js/games/affaires-data.js?v=186e790aba",
	"js/games/affaires.js?v=186e790aba",
	"js/games/audit.js?v=186e790aba",
	"js/games/biodata.js?v=186e790aba",
	"js/games/boutique.js?v=186e790aba",
	"js/games/cargo.js?v=186e790aba",
	"js/games/clinique.js?v=186e790aba",
	"js/games/comptoir.js?v=186e790aba",
	"js/games/crise.js?v=186e790aba",
	"js/games/dossier.js?v=186e790aba",
	"js/games/gaming.js?v=186e790aba",
	"js/games/guichet-data.js?v=186e790aba",
	"js/games/guichet.js?v=186e790aba",
	"js/games/jardin.js?v=186e790aba",
	"js/games/jourj.js?v=186e790aba",
	"js/games/jpo.js?v=186e790aba",
	"js/games/marquelle.js?v=186e790aba",
	"js/games/moniac.js?v=186e790aba",
	"js/games/palier.js?v=186e790aba",
	"js/games/patrimoine.js?v=186e790aba",
	"js/games/robot.js?v=186e790aba",
	"js/games/ruee-data.js?v=186e790aba",
	"js/games/ruee.js?v=186e790aba",
	"js/games/stage3d.js?v=186e790aba",
	"js/games/table.js?v=186e790aba",
	"js/games/tp.js?v=186e790aba",
	"js/hauteurs.js?v=186e790aba",
	"js/kit.js?v=186e790aba",
	"js/landmarks.js?v=186e790aba",
	"js/main.js?v=186e790aba",
	"js/monuments.js?v=186e790aba",
	"js/rame.js?v=186e790aba",
	"js/render.js?v=186e790aba",
	"js/station.js?v=186e790aba",
	"js/vauban.js?v=186e790aba",
	"js/vauban_far.js?v=186e790aba",
	"js/wenovin.js?v=186e790aba",
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
