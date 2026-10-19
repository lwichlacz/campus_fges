/* Tournage du film de présentation (100 s, Full HD) dans le vrai campus 3D.
   Les titres sont dessinés en coordonnées 1280×720 puis agrandis ; le campus est rendu en 2560×1440 puis réduit
   (bords lissés, sans escaliers).
   Le campus est filmé en direct ; les titres et les panneaux de formations sont dessinés par-dessus ;
   la musique (docs/validation-web/voix, mix.py --duree 100) est mêlée à l'enregistrement.

   Usage :  python3 tools/serve.py   et   python3 tools/film/recepteur.py   (reçoit la vidéo, port 8767)
            ouvrir http://localhost:8765/?debug dans Chrome (fenêtre visible), puis dans la console :
            (await import("/tools/film/film.js")).tourner()
   Résultat : docs/validation-web/media/campus-3d.mp4 (puis build.py pour la page de relecture).

   Toutes les formations du site apparaissent, avec leur mini-jeu s'il existe, sinon « mini-jeu à venir ». */
import { FORMATIONS, GAMES, GAME_INFO } from "/js/data.js";

const W = 1280, H = 720, FPS = 30, OUT_W = 1920, OUT_H = 1080, RENDU = 2;      // titres en 1280×720 · vidéo en 1920×1080 · rendu 3D en 2560×1440
const NAVY = "rgba(9,17,38,.82)", CYAN = "#5fd3e6", WHITE = "#ffffff", MUTED = "rgba(235,240,250,.72)", GREEN = "#7ee2a0";
const DISP = "Fraunces, Georgia, serif", BODY = "Nunito, system-ui, sans-serif";
const F = Object.fromEntries(FORMATIONS.map(f => [f.id, f]));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a)/(b - a));
const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
const out = x => 1 - Math.pow(1 - x, 3);
const life = (t, a, b, fi = .6, fo = .6) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v)*k);

/* ---------- les plans ---------- */
// cam(t local, durée) → [position, cible] ; scene : lieu à installer avant le plan
const move = (p0, t0, p1, t1) => (u) => { const k = ease(u); return [lerp(p0, p1, k), lerp(t0, t1, k)]; };
const orbit = (c, r, h, a0, a1) => (u) => { const a = a0 + (a1 - a0)*u; return [[c[0] + r*Math.cos(a), c[1] + h, c[2] + r*Math.sin(a)], c]; };
const games = id => GAMES[id] ? GAME_INFO[GAMES[id]] : null;
const ids = s => s.split(" ");
const SHOTS = [
	{ d:7, scene:"ext", cam:move([230, 170, 330], [0, 4, -10], [70, 70, 130], [0, 6, -3]), over:"titre" },
	{ d:7, scene:"ext", cam:orbit([0, 8, -3], 50, 22, 1.25, 1.75), lower:["Hôtel Académique", "Le campus de Vauban, reconstitué à l'échelle à partir des données de l'IGN"] },
	{ d:12, scene:"ext", cam:orbit([9, 6, -37], 54, 30, 1.0, 1.75), panel:{ k:"Faculté de Gestion, Économie & Sciences · Michel Falise", t:"Licences et prépas", list:ids("apes sv mh gestion ecofi cupge lieg cfa lpabf") } },
	{ d:11, scene:"atrium", cam:orbit([0, 4.5, 0], 36, 15, .9, 1.6), panel:{ k:"FGES et ISEA · l'atrium de Michel Falise", t:"Masters et diplômes d'université", list:ids("ecoop mdd im mrc cca dgp cgao duiacg dusp duhm") } },
	{ d:4, scene:"eura", card:["Direction Euratechnologies", "À dix minutes en métro, le quartier de l'École du Numérique"], cam:move([-9, 95, 207], [-19, 0, 22], [-9, 95, 207], [-19, 0, 22]) },
	{ d:8, scene:"eura", cam:move([-9, 95, 207], [-19, 0, 22], [29.6, 36, 71], [0.85, 6, 7]), lower:["Wenov · Euratechnologies", "Le bâtiment de l'École du Numérique, au bord de la Deûle"] },
	{ d:11, scene:"eura", cam:orbit([0.85, 8, 7], 66, 30, 1.15, 1.75), panel:{ k:"À Wenov", t:"Licences du numérique et masters de gestion", list:ids("info spi mn me frd mbif") } },
	{ d:12, scene:"wenovin", cam:orbit([0, 1, -3], 42, 34, 1.2, 1.9), panel:{ k:"École du Numérique · intérieur de Wenov", t:"Masters du numérique", list:ids("iasi dia cyber jn dmb ebmd mtn") } },
	{ d:8, scene:"wenovin", cam:orbit([0, 1, -3], 42, 34, 1.9, 2.3), panel:{ k:"École du Numérique", t:"Diplômes d'université", list:ids("duia duric ducse ducc") } },
	{ d:12, scene:"eura", cam:move([29.6, 36, 71], [0.85, 6, 7], [-9, 120, 260], [-19, 0, 22]), over:"bilan" },
	{ d:8, scene:"eura", cam:move([-9, 120, 260], [-19, 0, 22], [-9, 150, 320], [-19, 0, 22]), over:"fin" }
];
const TOTAL = SHOTS.reduce((s, x) => s + x.d, 0);
// chaque formation du site doit apparaître une fois, et une seule
export function controle(){
	const vues = SHOTS.flatMap(s => s.panel ? s.panel.list : []);
	return { manquantes:FORMATIONS.map(f => f.id).filter(id => !vues.includes(id)), inconnues:vues.filter(id => !F[id]), doublons:vues.filter((id, i) => vues.indexOf(id) !== i), total:vues.length };
}

/* ---------- dessin des titres ---------- */
function rr(c, x, y, w, h, r){ c.beginPath(); c.roundRect(x, y, w, h, r); }
function text(c, s, x, y, { size = 24, weight = 700, fam = BODY, color = WHITE, align = "left", a = 1 } = {}){
	if(a <= 0) return; c.save(); c.globalAlpha *= a; c.font = `${weight} ${size}px ${fam}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "middle"; c.fillText(s, x, y); c.restore();
}
function fit(c, s, max, size, weight = 700, fam = BODY){ c.font = `${weight} ${size}px ${fam}`; while(size > 12 && c.measureText(s).width > max){ size--; c.font = `${weight} ${size}px ${fam}`; } return size; }
function badge(c, g, x, y, a){
	const s = g ? `🎮 Mini-jeu « ${g.title} »` : "Mini-jeu à venir";
	c.save(); c.globalAlpha *= a; c.font = `800 14px ${BODY}`;
	const w = Math.min(420, c.measureText(s).width + 20);
	rr(c, x, y - 12, w, 24, 12); c.fillStyle = g ? "rgba(126,226,160,.2)" : "rgba(255,255,255,.12)"; c.fill();
	c.fillStyle = g ? GREEN : MUTED; c.textBaseline = "middle"; c.fillText(s, x + 10, y, 400);
	c.restore();
}
function panel(c, p, t, d){
	const a = life(t, .2, d, .7, .6), n = p.list.length, rowH = 56, h = 104 + n*rowH, x = 770, y = Math.max(30, (H - h)/2), w = 480;
	if(a <= 0) return;
	c.save(); c.globalAlpha = a; rr(c, x, y, w, h, 18); c.fillStyle = NAVY; c.fill(); c.restore();
	text(c, p.k.toUpperCase(), x + 24, y + 30, { size:fit(c, p.k.toUpperCase(), w - 48, 13, 800), weight:800, color:CYAN, a });
	text(c, p.t, x + 24, y + 64, { size:fit(c, p.t, w - 48, 26, 700, DISP), fam:DISP, a });
	p.list.forEach((id, i) => {
		const f = F[id], k = out(seg(t, .5 + i*.22, 1.1 + i*.22))*a; if(k <= 0) return;
		const ry = y + 104 + i*rowH + (1 - k)*10;
		c.save(); c.globalAlpha = k;
		text(c, f.name, x + 24, ry + 14, { size:fit(c, f.name, w - 48, 19, 800), weight:800 });
		badge(c, games(id), x + 24, ry + 40, 1);
		c.restore();
	});
}
function lower(c, [title, sub], t, d){
	const a = life(t, .4, d, .7, .6); if(a <= 0) return;
	c.save(); c.globalAlpha = a; const g = c.createLinearGradient(0, H - 180, 0, H); g.addColorStop(0, "rgba(9,17,38,0)"); g.addColorStop(1, "rgba(9,17,38,.85)"); c.fillStyle = g; c.fillRect(0, H - 180, W, 180); c.restore();
	c.save(); c.globalAlpha = a; c.fillStyle = CYAN; c.fillRect(56, H - 112, 6, 64); c.restore();
	text(c, title, 80, H - 94, { size:34, fam:DISP, a });
	text(c, sub, 80, H - 58, { size:20, weight:600, color:MUTED, a });
}
function titre(c, t, d){
	const a = life(t, .6, d, .9, .7); if(a <= 0) return;
	c.save(); c.globalAlpha = a*.55; const g = c.createRadialGradient(W/2, H/2, 80, W/2, H/2, 700); g.addColorStop(0, "rgba(9,17,38,.7)"); g.addColorStop(1, "rgba(9,17,38,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
	text(c, "FACULTÉ DE GESTION, ÉCONOMIE & SCIENCES · UNIVERSITÉ CATHOLIQUE DE LILLE", W/2, 270, { size:16, weight:800, color:CYAN, align:"center", a });
	text(c, "Le campus FGES en 3D", W/2, 340, { size:78, fam:DISP, align:"center", a });
	text(c, "Toutes nos formations, et un mini-jeu pour chacune", W/2, 410, { size:28, weight:700, align:"center", a:a*out(seg(t, 1.4, 2.2)) });
}
function card(c, [title, sub], t, d){
	c.fillStyle = "#0b1730"; c.fillRect(0, 0, W, H);
	const a = life(t, .2, d, .6, .6);
	text(c, title, W/2, H/2 - 24, { size:52, fam:DISP, align:"center", a });
	text(c, sub, W/2, H/2 + 34, { size:24, weight:600, color:MUTED, align:"center", a });
}
function bilan(c, t, d){
	const a = life(t, .3, d, .8, .5); if(a <= 0) return;
	const all = FORMATIONS.length, ready = FORMATIONS.filter(f => GAMES[f.id]);
	c.save(); c.globalAlpha = a; c.fillStyle = "rgba(9,17,38,.72)"; c.fillRect(0, 0, W, H); c.restore();
	text(c, `${all} formations, un mini-jeu pour chacune`, W/2, 120, { size:46, fam:DISP, align:"center", a });
	text(c, `${ready.length} sont déjà jouables, les ${all - ready.length} autres sont en préparation`, W/2, 172, { size:24, weight:700, color:CYAN, align:"center", a });
	const cw = 360, chh = 120, gap = 22, x0 = (W - 3*cw - 2*gap)/2;
	ready.forEach((r, i) => {
		const g = games(r.id), k = out(seg(t, 1 + i*.25, 1.7 + i*.25))*a; if(k <= 0) return;
		const x = x0 + (i % 3)*(cw + gap), y = 230 + Math.floor(i/3)*(chh + gap) + (1 - k)*16;
		c.save(); c.globalAlpha = k; rr(c, x, y, cw, chh, 16); c.fillStyle = "rgba(255,255,255,.95)"; c.fill();
		c.font = "40px system-ui, 'Apple Color Emoji', sans-serif"; c.textBaseline = "middle"; c.fillText(g.icon, x + 20, y + chh/2);
		text(c, g.title, x + 82, y + 44, { size:fit(c, g.title, cw - 100, 22, 700, DISP), fam:DISP, color:"#13254a" });
		text(c, r.name, x + 82, y + 76, { size:fit(c, r.name, cw - 100, 15, 700), weight:700, color:"#55607a" });
		c.restore();
	});
	text(c, "Les prochains mini-jeux sont construits avec les équipes de chaque formation.", W/2, 560, { size:22, weight:700, align:"center", a:a*seg(t, 3.5, 4.3) });
}
function fin(c, t, d, logo){
	const a = seg(t, .2, 1.2);
	c.save(); c.globalAlpha = a*.85; c.fillStyle = "#0b1730"; c.fillRect(0, 0, W, H); c.restore();
	c.save(); c.globalAlpha = a; rr(c, W/2 - 380, 150, 760, 400, 26); c.fillStyle = "#f7f2e9"; c.fill();
	if(logo.complete) c.drawImage(logo, W/2 - 190, 185, 380, 114);
	c.restore();
	text(c, "Votre relecture rend chaque jeu plus juste.", W/2, 360, { size:32, fam:DISP, color:"#13254a", align:"center", a });
	text(c, "Jouez, notez, envoyez : environ 15 minutes.", W/2, 410, { size:22, weight:700, color:"#55607a", align:"center", a:a*seg(t, 1, 1.8) });
	text(c, "Merci !", W/2, 480, { size:36, fam:DISP, color:"#0b7a8e", align:"center", a:seg(t, 2, 2.8) });
}

// pendant un panneau (à droite), le cadrage glisse vers la gauche pour que le bâtiment reste visible
function decale(ca, shot, t){
	const S = SHOTS[shot], dx = S && S.panel ? 250*ease(life(t, 0, S.d, 1.4, 1.2)) : 0;
	if(dx > .5) ca.setViewOffset(W, H, dx, 0, W, H); else if(ca.view?.enabled) ca.clearViewOffset();
}
function compose(c, img, shot, t, logo){
	const S = SHOTS[shot];
	c.drawImage(img, 0, 0, W, H);
	if(S.card) card(c, S.card, t, S.d);
	if(S.lower) lower(c, S.lower, t, S.d);
	if(S.panel) panel(c, S.panel, t, S.d);
	if(S.over === "titre") titre(c, t, S.d);
	if(S.over === "bilan") bilan(c, t, S.d);
	if(S.over === "fin") fin(c, t, S.d, logo);
	// fondu au noir aux changements de lieu
	const nx = SHOTS[shot + 1], prev = SHOTS[shot - 1];
	const fadeOut = nx && nx.scene !== S.scene ? seg(t, S.d - .5, S.d) : 0, fadeIn = prev && prev.scene !== S.scene ? 1 - seg(t, 0, .5) : 0;
	if(Math.max(fadeOut, fadeIn) > 0 && !S.card){ c.fillStyle = `rgba(11,23,48,${Math.max(fadeOut, fadeIn)})`; c.fillRect(0, 0, W, H); }
}

/* ---------- aperçu d'une image : apercu(n° du plan, seconde dans le plan) ---------- */
export async function apercu(shot, t){
	const C = window.campus;
	await document.fonts.load(`700 40px ${DISP}`); await document.fonts.load(`800 20px ${BODY}`);
	const S = SHOTS[shot]; if(S.scene !== "ext"){ await C.loadInterior(S.scene); C.placeIn(S.scene); } else if(C.mode !== "ext") C.placeExt("ha");
	Object.assign(C.controls, { enableDamping:false, minDistance:0, maxDistance:1e4, minPolarAngle:0, maxPolarAngle:Math.PI, autoRotate:false });
	const R = C.renderer; R.setPixelRatio(RENDU); R.setSize(W, H, false); C.camera.aspect = W/H; C.camera.updateProjectionMatrix(); C.post?.setSize(W, H, RENDU);
	const [p, tg] = S.cam(clamp(t/S.d)); C.view(...p, ...tg);
	const logo = new Image(); logo.src = "/img/logo-fges.png"; await logo.decode().catch(() => {});
	let cv = document.getElementById("apercu");
	if(!cv){ cv = document.createElement("canvas"); cv.id = "apercu"; cv.width = OUT_W; cv.height = OUT_H; cv.style.cssText = "position:fixed;inset:0;width:100vw;height:auto;z-index:99;background:#000"; document.body.append(cv); }
	const c = cv.getContext("2d"); c.setTransform(OUT_W/W, 0, 0, OUT_H/H, 0, 0); c.imageSmoothingQuality = "high";
	const err = await new Promise(r => { const orig = R.render.bind(R); R.render = (a, b) => { if(b === C.camera) decale(b, shot, t); orig(a, b); if(R.getRenderTarget() === null){ R.render = orig; try { compose(c, R.domElement, shot, t, logo); r(null); } catch(e){ r(String(e.stack || e)); } } }; });
	return err || SHOTS.map((x, i) => `${i}:${x.d}s`).join(" ");
}

/* ---------- tournage ---------- */
export async function tourner({ recepteur = "http://127.0.0.1:8767/film", musique = "/docs/validation-web/voix/musique-film.wav", sortie = "docs/validation-web/media/campus-3d-brut.mp4" } = {}){
	const C = window.campus; if(!C) throw new Error("Ouvrir le site avec ?debug");
	const ctl = controle(); if(ctl.manquantes.length || ctl.inconnues.length || ctl.doublons.length) throw new Error("Formations : " + JSON.stringify(ctl));
	await document.fonts.load(`700 40px ${DISP}`); await document.fonts.load(`800 20px ${BODY}`);
	for(const id of ["eura", "wenovin", "atrium"]) await C.loadInterior(id);
	// résolution figée en 16/9, qualité haute, heure dorée
	C.setQuality("haute"); C.perf.locked = true; C.perf.dyn = 1;
	C.set("time", "doree");
	const R = C.renderer, cam = C.camera;
	R.setPixelRatio(RENDU); R.setSize(W, H, false); cam.aspect = W/H; cam.updateProjectionMatrix(); C.post?.setSize(W, H, RENDU);
	C.controls.autoRotate = false; C.controls.enableDamping = false;
	document.querySelectorAll("#welcome, #hud, #pins, #dock, #toast").forEach(e => e && (e.style.visibility = "hidden"));
	const logo = new Image(); logo.src = "/img/logo-fges.png";
	// image composée : le rendu 3D + les titres
	const cv = document.createElement("canvas"); cv.width = OUT_W; cv.height = OUT_H; const c = cv.getContext("2d");
	c.setTransform(OUT_W/W, 0, 0, OUT_H/H, 0, 0); c.imageSmoothingQuality = "high";
	let t0 = 0, shot = 0, shotStart = 0, scene = "ext", done = false, frames = 0;
	const free = () => Object.assign(C.controls, { enableDamping:false, minDistance:0, maxDistance:1e4, minPolarAngle:0, maxPolarAngle:Math.PI });      // plans larges : sans les limites de la visite
	const place = s => { if(s === scene) return; scene = s; if(s === "ext") C.placeExt("ha"); else C.placeIn(s); free(); };
	free();
	const now = () => (performance.now() - t0)/1000;
	const orig = R.render.bind(R);
	R.render = (sc, ca) => {
		if(t0 && !done && SHOTS[shot] && ca === cam) decale(ca, shot, now() - shotStart);
		orig(sc, ca);
		if(R.getRenderTarget() !== null || !t0 || done) return;
		frames++;
		try { compose(c, R.domElement, shot, now() - shotStart, logo); } catch(e){ (window.__filmErr ||= []).push(String(e.stack || e)); }
	};
	// caméra : chaque image, avant le rendu suivant
	function steer(){
		if(done) return;
		let t = now() - shotStart;
		while(SHOTS[shot] && t >= SHOTS[shot].d){ shotStart += SHOTS[shot].d; shot++; t = now() - shotStart; }
		if(!SHOTS[shot]){ done = true; return; }
		const S = SHOTS[shot]; place(S.scene);
		const [p, tg] = S.cam(clamp(t/S.d));
		C.view(...p, ...tg);
		requestAnimationFrame(steer);
	}
	// musique
	const ac = new AudioContext(), dest = ac.createMediaStreamDestination();
	const buf = await fetch(musique).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b));
	const src = ac.createBufferSource(); src.buffer = buf; src.connect(dest);
	const stream = cv.captureStream(FPS); stream.addTrack(dest.stream.getAudioTracks()[0]);
	const mime = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4"].find(m => MediaRecorder.isTypeSupported(m));
	const rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:5_000_000, audioBitsPerSecond:128_000 });
	const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
	// premier lieu installé et rendu une seconde avant de lancer l'enregistrement
	place("ext"); C.view(...SHOTS[0].cam(0)[0], ...SHOTS[0].cam(0)[1]);
	await new Promise(r => setTimeout(r, 1500));
	t0 = performance.now(); shotStart = 0; rec.start(1000); src.start(); steer();
	await new Promise(r => { const iv = setInterval(() => { if(now() >= TOTAL + .2){ clearInterval(iv); r(); } }, 100); });
	done = true; rec.stop(); src.stop();
	await new Promise(r => rec.onstop = r);
	R.render = orig;
	const blob = new Blob(chunks, { type:mime });
	window.__film = blob;          // gardé : renvoyer avec envoyer() si le récepteur ne répondait pas
	const res = await fetch(recepteur + "?sortie=" + encodeURIComponent(sortie), { method:"POST", body:blob });
	return { mime, taille:blob.size, duree:TOTAL, imagesParSeconde:+(frames/TOTAL).toFixed(1), recu:await res.text() };
}

// renvoie la dernière vidéo tournée (si l'envoi a échoué)
export async function envoyer({ recepteur = "http://127.0.0.1:8767/film", sortie = "docs/validation-web/media/campus-3d.mp4" } = {}){
	return fetch(recepteur + "?sortie=" + encodeURIComponent(sortie), { method:"POST", body:window.__film }).then(r => r.text());
}
