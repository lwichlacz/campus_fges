/* Pilotage image par image du campus 3D, pour le tournage et les contrôles de rendu.
   L'horloge (performance.now) et la boucle d'affichage (requestAnimationFrame) sont prises en main :
   chaque appel à pas() calcule exactement une image, à l'instant voulu, même si l'onglet est en arrière-plan.

   Usage, dans la console (site ouvert avec ?debug) :
     const P = await import("/tools/film/pilote.js"); await P.prendre();
     P.pas(1000/30);                 // avance d'1/30 s et dessine une image
     P.scintillement([x,y,z], [cx,cy,cz])   // pixels qui « scintillent » sur ce plan (surfaces superposées)
     P.rendre();                     // rend la main au navigateur */
let pn = null, vt = null, queue = [], manual = false, rafOrig = null, grab = false, last = null, cap = null, cx = null, orig = null;

export async function prendre(){
	const C = window.campus; if(!C) throw new Error("Ouvrir le site avec ?debug");
	if(!pn){
		pn = performance.now.bind(performance);
		performance.now = () => vt ?? pn();
		rafOrig = window.requestAnimationFrame.bind(window);
		window.requestAnimationFrame = cb => { if(manual){ queue.push(cb); return queue.length; } return rafOrig(cb); };
		cap = document.createElement("canvas"); cx = cap.getContext("2d", { willReadFrequently:true });
		const R = C.renderer; orig = R.render.bind(R);
		R.render = (s, c) => { orig(s, c); if(grab && R.getRenderTarget() === null){ grab = false; cap.width = R.domElement.width; cap.height = R.domElement.height; cx.drawImage(R.domElement, 0, 0); last = cx.getImageData(0, 0, cap.width, cap.height); } };
	}
	manual = true; vt = pn();
	// la boucle du campus se réinscrit à la fin de sa prochaine image (un aperçu d'écran suffit à la déclencher)
	for(let i = 0; i < 400 && !queue.length; i++) await new Promise(r => setTimeout(r, 25));
	return queue.length > 0;
}
export function pas(dtMs = 1000/30, image = false){ vt += dtMs; grab = image; const q = queue; queue = []; q.forEach(f => f(vt)); return image ? last : null; }
export const temps = () => vt;
// enregistre une image (ImageData ou canvas) en JPEG via tools/film/recepteur.py, pour la regarder hors du navigateur
export async function photo(img, sortie = "tools/film/_apercu.jpg", qualite = .9){
	let cv = img;
	if(!(img instanceof HTMLCanvasElement)){ cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height; cv.getContext("2d").putImageData(img, 0, 0); }
	const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", qualite));
	return fetch("http://127.0.0.1:8767/film?sortie=" + encodeURIComponent(sortie), { method:"POST", body:blob }).then(r => r.text());
}
export function rendre(){ manual = false; vt = null; const q = queue; queue = []; q.forEach(f => rafOrig(f)); }

/* Surfaces superposées : on rend deux fois le même plan en ne changeant que le plan proche de la caméra.
   Rien ne bouge à l'écran, seule la précision de profondeur change : les pixels qui changent sont ceux où
   deux surfaces sont au même endroit. On ne garde que les zones pleines (pas les contours d'une seule ligne). */
// la scène affichée : Vauban, ou un lieu chargé à part (Euratechnologies, intérieurs)
export const scene = () => { const C = window.campus; return C.mode === "ext" ? C.scene : C.interiors[C.mode].scene; };
export function scintillement(p, t, { seuil = 40, dn = .05 } = {}){
	const C = window.campus, cam = C.camera, n0 = cam.near;
	C.view(...p, ...t); pas(0); pas(0); const a = pas(0, true);
	cam.near = n0 + dn; cam.updateProjectionMatrix(); const b = pas(0, true);
	cam.near = n0; cam.updateProjectionMatrix();
	const W = a.width, H = a.height, on = new Uint8Array(W*H);
	for(let i = 0; i < W*H; i++){ const k = i*4; on[i] = (Math.abs(a.data[k]-b.data[k]) + Math.abs(a.data[k+1]-b.data[k+1]) + Math.abs(a.data[k+2]-b.data[k+2])) > seuil ? 1 : 0; }
	const zones = [];
	for(let y = 2; y < H - 2; y++) for(let x = 2; x < W - 2; x++){ const i = y*W + x; if(!on[i]) continue; let s = 0; for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++) s += on[i + dy*W + dx]; if(s >= 13) zones.push(i); }
	// ce qui se superpose : les deux premières surfaces sous quelques pixels des zones
	const T = C.THREE, ray = new T.Raycaster(), cas = {}, step = Math.max(1, Math.floor(zones.length/60)), sc = scene();
	for(let j = 0; j < zones.length; j += step){
		const i = zones[j]; ray.setFromCamera(new T.Vector2((i % W)/W*2 - 1, -(Math.floor(i/W)/H*2 - 1)), cam);
		const h = ray.intersectObjects(sc.children, true).filter(h => h.object.visible && h.object.material && h.object.material.visible !== false).slice(0, 2);
		if(h.length < 2 || h[1].distance - h[0].distance > .005) continue;
		const k = h[0].point.toArray().map(v => Math.round(v/5)*5).join(",");
		cas[k] = (cas[k] || 0) + 1;
	}
	return { zones:zones.length, superposees:Object.entries(cas).sort((a, b) => b[1] - a[1]).slice(0, 10) };
}

// carte des pixels qui changent avec la précision de profondeur (magenta), enregistrée en JPEG pour la regarder
export async function carte(p, t, sortie = "tools/film/_carte.jpg", { seuil = 40, dn = .05 } = {}){
	const C = window.campus, cam = C.camera, n0 = cam.near;
	C.view(...p, ...t); pas(0); pas(0); const a = pas(0, true);
	cam.near = n0 + dn; cam.updateProjectionMatrix(); const b = pas(0, true);
	cam.near = n0; cam.updateProjectionMatrix();
	const out = new ImageData(a.width, a.height);
	for(let i = 0; i < a.data.length; i += 4){
		const on = Math.abs(a.data[i]-b.data[i]) + Math.abs(a.data[i+1]-b.data[i+1]) + Math.abs(a.data[i+2]-b.data[i+2]) > seuil;
		out.data[i] = on ? 255 : a.data[i]*.6; out.data[i+1] = on ? 0 : a.data[i+1]*.6; out.data[i+2] = on ? 255 : a.data[i+2]*.6; out.data[i+3] = 255;
	}
	return photo(out, sortie);
}

/* Clignotement vu en mouvement : trois images, la caméra avançant de quelques centimètres à chaque fois.
   Un pixel qui change puis revient à sa couleur d'origine « clignote » (un simple contour qui glisse ne revient pas). */
export async function clignote(p, t, { pasCm = 2, seuil = 60, sortie = null } = {}){
	const C = window.campus, d = pasCm/100, dir = new C.THREE.Vector3(t[0] - p[0], 0, t[2] - p[2]).normalize();
	const side = [-dir.z*d, 0, dir.x*d], img = [];
	for(let k = 0; k < 3; k++){ C.view(p[0] + side[0]*k, p[1], p[2] + side[2]*k, t[0] + side[0]*k, t[1], t[2] + side[2]*k); pas(0); img.push(pas(0, true)); }
	const [a, b, c] = img, out = new ImageData(a.width, a.height); let n = 0;
	const D = (x, y, i) => Math.abs(x.data[i]-y.data[i]) + Math.abs(x.data[i+1]-y.data[i+1]) + Math.abs(x.data[i+2]-y.data[i+2]);
	for(let i = 0; i < a.data.length; i += 4){
		const on = D(a, b, i) > seuil && D(b, c, i) > seuil && D(a, c, i) < seuil/3; if(on) n++;
		out.data[i] = on ? 255 : a.data[i]*.6; out.data[i+1] = on ? 0 : a.data[i+1]*.6; out.data[i+2] = on ? 255 : a.data[i+2]*.6; out.data[i+3] = 255;
	}
	C.view(...p, ...t);
	if(sortie) await photo(out, sortie);
	return n;
}

// installation pour un tournage ou un contrôle : temps clair, interface masquée, qualité choisie, lieu chargé
export async function preparer({ qualite = "haute", lieu = "ext", heure = null } = {}){
	const C = window.campus;
	await prendre();
	for(let i = 0; i < 60; i++) pas();
	document.querySelector('[data-weather=soleil]')?.click();
	C.setQuality(qualite); if(C.perf){ C.perf.locked = true; C.perf.dyn = 1; }
	if(heure) C.set("time", heure);
	document.querySelectorAll("#welcome, #hud, #pins, #dock, #toast, #ambiance").forEach(e => e && (e.style.visibility = "hidden"));
	if(lieu !== "ext"){ const ld = C.loadInterior(lieu); for(let i = 0; i < 400 && !C.interiors?.[lieu]; i++){ pas(); await new Promise(r => setTimeout(r, 5)); } await ld; C.placeIn(lieu); }
	for(let i = 0; i < 30; i++) pas();
	return C.mode;
}
