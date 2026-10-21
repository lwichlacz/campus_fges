/* Film de présentation du campus FGES 3D (environ 2 min, Full HD), tourné dans le vrai campus.
   Tournage image par image : l'horloge et la boucle du campus sont pilotées (tools/film/pilote.js), chaque image est
   rendue à l'instant exact en 2560×1440 puis réduite en 1920×1080, et encodée en H.264 dans le navigateur (WebCodecs).
   Aucune saccade, même si la fenêtre est en arrière-plan ou si l'ordinateur est lent.
   Les titres et les panneaux sont dessinés par-dessus, en coordonnées 1280×720 agrandies (texte net en 1080p).

   Usage :  python tools/serve.py   et   python tools/film/recepteur.py   (reçoit la vidéo, port 8767)
            musique : python docs/validation-web/voix/mix.py --duree 124 --sortie docs/validation-web/voix/musique-film.wav
            ouvrir http://localhost:8765/?debug, puis dans la console :
              const F = await import("/tools/film/film.js");
              await F.apercu(12.5)        // une image à 12,5 s → tools/film/_apercu.jpg
              F.tourner()                 // tout le film ; avancement dans F.etat()
   Résultat : docs/validation-web/media/campus-3d.mp4, puis python docs/validation-web/build.py (page de relecture).

   Toutes les formations du site apparaissent une fois, avec leur mini-jeu s'il existe, sinon « mini-jeu à venir ». */
import { FORMATIONS, GAMES, GAME_INFO } from "/js/data.js";
import * as P from "/tools/film/pilote.js";

const W = 1280, H = 720, FPS = 30, OUT_W = 1920, OUT_H = 1080, RENDU = 2;
const NAVY = "#0a1530", CYAN = "#5fd3e6", GOLD = "#f4c46b", WHITE = "#ffffff", MUTED = "rgba(235,240,250,.74)", GREEN = "#7ee2a0";
const DISP = "Fraunces, Georgia, serif", BODY = "Nunito, system-ui, sans-serif";
const F = Object.fromEntries(FORMATIONS.map(f => [f.id, f]));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a)/(b - a));
const smooth = x => x*x*x*(x*(x*6 - 15) + 10);                       // départ et arrivée en douceur
const out = x => 1 - Math.pow(1 - x, 3);
const life = (t, a, b, fi = .6, fo = .6) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));
const ids = s => s.split(" ");
const games = id => GAMES[id] ? GAME_INFO[GAMES[id]] : null;

/* ---------- mouvements de caméra ---------- */
let T = null;
// trajectoire courbe (Catmull-Rom) pour la caméra et pour le point visé, parcourue avec un départ et une arrivée en douceur
function path(pts, tgs){
	const cp = new T.CatmullRomCurve3(pts.map(v => new T.Vector3(...v)), false, "centripetal");
	const ct = new T.CatmullRomCurve3((tgs.length > 1 ? tgs : [tgs[0], tgs[0]]).map(v => new T.Vector3(...v)), false, "centripetal");
	return u => { const k = smooth(u); return [cp.getPoint(k).toArray(), ct.getPoint(k).toArray()]; };
}
// tour lent autour d'un point, avec une légère montée (effet grue)
const orbit = (c, r, h0, h1, a0, a1) => u => { const k = .15*u + .85*smooth(u), a = a0 + (a1 - a0)*k, h = h0 + (h1 - h0)*k; return [[c[0] + r*Math.cos(a), c[1] + h, c[2] + r*Math.sin(a)], c]; };

/* ---------- découpage ---------- */
// les lieux sont lus dans le campus (bâtiments de Vauban, épingles d'Euratechnologies) : le film suit le site s'il change
function plans(C){
	const PL = C.PLACES, LI = C.LIFE, E = C.interiors.eura.places;
	const ha = PL.ha.target, fal = PL.falise.target, ch = LI.chapelle.target, jb = LI.jardin.target, wv = E.wenov.target, bl = E.blan.target;
	return [
		{ d:9, lieu:"ext", cam:path([[190, 105, 270], [120, 82, 185], [58, 56, 112]], [[40, 0, 70], [16, 3, 25], [0, 8, -4]]), over:"ouverture" },
		{ d:8, lieu:"ext", cam:orbit([0, 4, -14], 175, 92, 86, 1.05, 1.55), over:"chiffres" },
		{ d:8, lieu:"ext", cam:path([[-6, 7.5, 21], [5, 12, 25], [20, 30, 50]], [[ha[0], 13, ha[2]], [ha[0], 10, ha[2]], [ha[0], 6, ha[2] - 2]]),
			lower:["Hôtel Académique", "60 boulevard Vauban, le cœur historique de l'Université Catholique de Lille"] },
		{ d:7, lieu:"ext", cam:path([[4, 30, 36], [-24, 32, 14], [-46, 36, -6]], [[ch[0], 5, ch[2]], [(ch[0] + jb[0])/2, 3, (ch[2] + jb[2])/2], [jb[0], 2, jb[2]]]),
			lower:["La chapelle et le jardin botanique", "Entre les bâtiments, la vie du campus de Vauban"] },
		{ d:12, lieu:"ext", cam:orbit(fal, 60, 30, 36, .95, 1.75), panel:{ k:"Faculté de Gestion, Économie & Sciences · Michel Falise", t:"Licences et prépas", list:ids("apes sv mh gestion ecofi cupge lieg cfa lpabf") } },
		{ d:11, lieu:"atrium", cam:orbit([0, 4.5, 0], 36, 13, 17, .9, 1.65), panel:{ k:"FGES et ISEA · l'atrium de Michel Falise", t:"Masters et diplômes d'université", list:ids("ecoop mdd im mrc cca dgp cgao duiacg dusp duhm") } },
		{ d:5, lieu:"atrium", cam:orbit([0, 4.5, 0], 36, 17, 18, 1.65, 1.75), over:"metro" },
		{ d:8, lieu:"eura", cam:path([[wv[0] - 20, 120, wv[2] + 250], [wv[0] + 30, 62, wv[2] + 130], [wv[0] + 34, 38, wv[2] + 68]], [[bl[0], 0, bl[2]], [(bl[0] + wv[0])/2, 4, (bl[2] + wv[2])/2], [wv[0], 6, wv[2]]]),
			lower:["Euratechnologies", "Le quartier du numérique de Lille, au bord de la Deûle"] },
		{ d:11, lieu:"eura", cam:orbit(wv, 68, 30, 38, 1.15, 1.85), panel:{ k:"Wenov · Euratechnologies", t:"Licences du numérique et masters de gestion", list:ids("info spi mn me frd mbif") } },
		{ d:11, lieu:"wenovin", cam:orbit([0, 1, -3], 42, 30, 26, 1.2, 1.85), panel:{ k:"École du Numérique · à l'intérieur de Wenov", t:"Masters du numérique", list:ids("iasi dia cyber jn dmb ebmd mtn") } },
		{ d:8, lieu:"wenovin", cam:orbit([0, 1, -3], 42, 26, 24, 1.85, 2.3), panel:{ k:"École du Numérique", t:"Diplômes d'université", list:ids("duia duric ducse ducc") } },
		{ d:12, lieu:"eura", cam:orbit([(bl[0] + wv[0])/2, 2, (bl[2] + wv[2])/2], 150, 70, 80, 2.2, 2.75), over:"jeux" },
		{ d:8, lieu:"ext", cam:orbit([0, 4, -14], 190, 80, 100, 2.4, 2.85), over:"relecture" },
		{ d:6, lieu:"ext", cam:orbit([0, 4, -14], 190, 100, 108, 2.85, 3.05), over:"fin" }
	];
}
let SHOTS = null, TOTAL = 0;
// chaque formation du site doit apparaître une fois, et une seule
export function controle(){
	const vues = (SHOTS || plans(window.campus)).flatMap(s => s.panel ? s.panel.list : []);
	return { manquantes:FORMATIONS.map(f => f.id).filter(id => !vues.includes(id)), inconnues:vues.filter(id => !F[id]), doublons:vues.filter((id, i) => vues.indexOf(id) !== i), total:vues.length };
}

/* ---------- habillage ---------- */
function rr(c, x, y, w, h, r){ c.beginPath(); c.roundRect(x, y, w, h, r); }
function text(c, s, x, y, { size = 24, weight = 700, fam = BODY, color = WHITE, align = "left", a = 1, track = 0 } = {}){
	if(a <= 0) return; c.save(); c.globalAlpha *= a; c.font = `${weight} ${size}px ${fam}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = "middle";
	if(track) c.letterSpacing = `${track}px`;
	c.fillText(s, x, y); c.restore();
}
function fit(c, s, max, size, weight = 700, fam = BODY){ c.font = `${weight} ${size}px ${fam}`; while(size > 12 && c.measureText(s).width > max){ size--; c.font = `${weight} ${size}px ${fam}`; } return size; }
// verre dépoli : l'image du campus floutée et assombrie derrière le panneau
function glass(c, img, x, y, w, h, r, a, tint = "rgba(10,21,48,.5)"){
	if(a <= 0) return;
	c.save(); c.globalAlpha = a; rr(c, x, y, w, h, r); c.clip();
	c.filter = "blur(14px) brightness(.62) saturate(1.15)"; c.drawImage(img, -20, -20, W + 40, H + 40); c.filter = "none";
	c.fillStyle = tint; c.fillRect(x, y, w, h);
	c.restore();
	c.save(); c.globalAlpha = a*.9; rr(c, x + .5, y + .5, w - 1, h - 1, r); c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 1; c.stroke(); c.restore();
}
function vignette(c){
	const g = c.createRadialGradient(W/2, H/2, H*.45, W/2, H/2, H*1.05);
	g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(5,10,25,.42)");
	c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function badge(c, g, x, y, a){
	const s = g ? `Mini-jeu « ${g.title} »` : "Mini-jeu à venir";
	c.save(); c.globalAlpha *= a; c.font = `800 13px ${BODY}`;
	const w = Math.min(400, c.measureText(s).width + (g ? 34 : 20));
	rr(c, x, y - 11, w, 22, 11); c.fillStyle = g ? "rgba(126,226,160,.18)" : "rgba(255,255,255,.1)"; c.fill();
	if(g){ c.fillStyle = GREEN; c.beginPath(); c.arc(x + 13, y, 4, 0, 7); c.fill(); }
	c.fillStyle = g ? GREEN : MUTED; c.textBaseline = "middle"; c.fillText(s, x + (g ? 24 : 10), y + .5, 370);
	c.restore();
}
function panel(c, img, p, t, d){
	const a = life(t, .3, d, .8, .7), n = p.list.length, rowH = n > 8 ? 50 : 56, h = 108 + n*rowH, w = 476, x = W - w - 44, y = Math.max(28, (H - h)/2);
	if(a <= 0) return;
	const slide = (1 - out(seg(t, .3, 1.3)))*30;
	c.save(); c.translate(slide, 0);
	glass(c, img, x, y, w, h, 20, a);
	c.save(); c.globalAlpha = a; c.fillStyle = CYAN; c.fillRect(x + 24, y + 22, 28, 3); c.restore();
	text(c, p.k.toUpperCase(), x + 24, y + 42, { size:fit(c, p.k.toUpperCase(), w - 48, 12, 800), weight:800, color:CYAN, a, track:1 });
	text(c, p.t, x + 24, y + 76, { size:fit(c, p.t, w - 48, 27, 600, DISP), weight:600, fam:DISP, a });
	p.list.forEach((id, i) => {
		const f = F[id], k = out(seg(t, .7 + i*.2, 1.3 + i*.2))*a; if(k <= 0) return;
		const ry = y + 110 + i*rowH + (1 - k)*8;
		c.save(); c.globalAlpha = k;
		text(c, f.name, x + 24, ry + 12, { size:fit(c, f.name, w - 48, 18, 800), weight:800 });
		badge(c, games(id), x + 24, ry + 36, 1);
		c.restore();
	});
	c.restore();
}
function lower(c, img, [title, sub], t, d){
	const a = life(t, .5, d, .8, .7); if(a <= 0) return;
	c.save(); c.globalAlpha = a; const g = c.createLinearGradient(0, H - 210, 0, H); g.addColorStop(0, "rgba(5,10,25,0)"); g.addColorStop(1, "rgba(5,10,25,.82)"); c.fillStyle = g; c.fillRect(0, H - 210, W, 210); c.restore();
	const k = out(seg(t, .5, 1.4));
	c.save(); c.globalAlpha = a; c.fillStyle = CYAN; c.fillRect(64, H - 118, 4, 70*k); c.restore();
	text(c, title, 88 - (1 - k)*20, H - 98, { size:38, weight:600, fam:DISP, a });
	text(c, sub, 88 - (1 - k)*20, H - 58, { size:19, weight:700, color:MUTED, a:a*seg(t, .9, 1.6) });
}
function ouverture(c, t, d){
	const a = life(t, .8, d, 1.2, .8); if(a <= 0) return;
	c.save(); c.globalAlpha = a*.6; const g = c.createRadialGradient(W/2, H/2, 60, W/2, H/2, 720); g.addColorStop(0, "rgba(5,10,25,.75)"); g.addColorStop(1, "rgba(5,10,25,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
	text(c, "FACULTÉ DE GESTION, ÉCONOMIE & SCIENCES · UNIVERSITÉ CATHOLIQUE DE LILLE", W/2, 262, { size:14, weight:800, color:CYAN, align:"center", a, track:2 });
	const k = out(seg(t, .8, 2.2));
	text(c, "Le campus FGES en 3D", W/2, 334 + (1 - k)*14, { size:80, weight:600, fam:DISP, align:"center", a:a*k });
	text(c, "Toutes nos formations, à visiter et à jouer", W/2, 408, { size:27, weight:700, align:"center", a:a*out(seg(t, 1.8, 2.8)) });
	c.save(); c.globalAlpha = a*seg(t, 2.2, 3); c.fillStyle = GOLD; c.fillRect(W/2 - 40*out(seg(t, 2.2, 3.2)), 448, 80*out(seg(t, 2.2, 3.2)), 3); c.restore();
}
function chiffres(c, img, t, d){
	const a = life(t, .4, d, .8, .7); if(a <= 0) return;
	const n = FORMATIONS.length, jeux = FORMATIONS.filter(f => GAMES[f.id]).length;
	const items = [[n, "formations", "licences, masters, prépas et diplômes d'université"], [2, "campus", "Vauban et Euratechnologies, reconstitués à l'échelle"], [jeux, "mini-jeux jouables", "un par formation à terme, conçus avec les équipes"]];
	const cw = 330, gap = 28, x0 = (W - 3*cw - 2*gap)/2, y = 230, h = 230;
	c.save(); c.globalAlpha = a; c.fillStyle = "rgba(5,10,25,.32)"; c.fillRect(0, 0, W, H); c.restore();
	text(c, "LE PROJET", W/2, 168, { size:14, weight:800, color:CYAN, align:"center", a, track:3 });
	text(c, "Un lycéen visite le campus depuis son téléphone… et joue une formation", W/2, 200, { size:24, weight:600, fam:DISP, align:"center", a });
	items.forEach(([v, l, s], i) => {
		const k = out(seg(t, .8 + i*.35, 1.6 + i*.35))*a; if(k <= 0) return;
		const x = x0 + i*(cw + gap), yy = y + (1 - k)*16;
		glass(c, img, x, yy, cw, h, 22, k);
		const shown = Math.round(v*out(seg(t, .9 + i*.35, 2.3 + i*.35)));
		text(c, String(shown), x + cw/2, yy + 82, { size:84, weight:600, fam:DISP, color:GOLD, align:"center", a:k });
		text(c, l, x + cw/2, yy + 148, { size:24, weight:800, align:"center", a:k });
		text(c, s, x + cw/2, yy + 184, { size:fit(c, s, cw - 36, 15, 700), weight:700, color:MUTED, align:"center", a:k });
	});
}
function metro(c, t, d){
	c.fillStyle = NAVY; c.fillRect(0, 0, W, H);
	const a = life(t, .2, d, .5, .5);
	const g = c.createRadialGradient(W/2, H*.4, 50, W/2, H*.4, 700); g.addColorStop(0, "rgba(95,211,230,.12)"); g.addColorStop(1, "rgba(95,211,230,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
	const x0 = 300, x1 = 980, y = 380, k = out(seg(t, .5, 3));
	c.save(); c.globalAlpha = a; c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
	c.strokeStyle = CYAN; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + (x1 - x0)*k, y); c.stroke();
	for(const [x, on] of [[x0, true], [x1, k > .98]]){ c.fillStyle = on ? CYAN : "#33415e"; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.fillStyle = NAVY; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }
	c.fillStyle = WHITE; c.beginPath(); c.roundRect(x0 + (x1 - x0)*k - 22, y - 14, 44, 28, 10); c.fill();
	c.fillStyle = NAVY; c.font = `800 15px ${BODY}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("M", x0 + (x1 - x0)*k, y + 1);
	c.restore();
	text(c, "Vauban", x0, y + 44, { size:22, weight:800, align:"center", a });
	text(c, "Cormontaigne", x0, y + 70, { size:15, weight:700, color:MUTED, align:"center", a });
	text(c, "Euratechnologies", x1, y + 44, { size:22, weight:800, align:"center", a:a*seg(t, 2.4, 3) });
	text(c, "Canteleu – Euratechnologies", x1, y + 70, { size:15, weight:700, color:MUTED, align:"center", a:a*seg(t, 2.4, 3) });
	text(c, "Direction Euratechnologies", W/2, 230, { size:50, weight:600, fam:DISP, align:"center", a });
	text(c, "À dix minutes en métro, le quartier de l'École du Numérique", W/2, 284, { size:22, weight:700, color:MUTED, align:"center", a:a*seg(t, .6, 1.3) });
}
function jeux(c, img, t, d){
	const a = life(t, .3, d, .8, .6); if(a <= 0) return;
	c.save(); c.globalAlpha = a; c.fillStyle = "rgba(5,10,25,.56)"; c.fillRect(0, 0, W, H); c.restore();
	const all = FORMATIONS.length, ready = FORMATIONS.filter(f => GAMES[f.id]);
	text(c, "LES MINI-JEUX", W/2, 92, { size:14, weight:800, color:CYAN, align:"center", a, track:3 });
	text(c, `${ready.length} formations ont déjà leur mini-jeu`, W/2, 132, { size:42, weight:600, fam:DISP, align:"center", a });
	text(c, `Quelques minutes pour faire ce que font vraiment les étudiants · les ${all - ready.length} autres sont en préparation`, W/2, 174, { size:18, weight:700, color:MUTED, align:"center", a:a*seg(t, .8, 1.5) });
	const cw = 372, chh = 176, gap = 20, x0 = (W - 3*cw - 2*gap)/2, y0 = 214;
	ready.forEach((r, i) => {
		const g = games(r.id), k = out(seg(t, 1.1 + i*.28, 1.8 + i*.28))*a; if(k <= 0) return;
		const x = x0 + (i % 3)*(cw + gap), y = y0 + Math.floor(i/3)*(chh + gap) + (1 - k)*18;
		c.save(); c.globalAlpha = k; rr(c, x, y, cw, chh, 18); c.fillStyle = "rgba(250,248,243,.97)"; c.fill(); c.restore();
		c.save(); c.globalAlpha = k; c.font = "44px system-ui, 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif"; c.textBaseline = "middle"; c.fillText(g.icon, x + 22, y + 48); c.restore();
		text(c, g.title, x + 84, y + 40, { size:fit(c, g.title, cw - 104, 23, 600, DISP), weight:600, fam:DISP, color:"#13254a", a:k });
		text(c, r.name, x + 84, y + 68, { size:fit(c, r.name, cw - 104, 14, 800), weight:800, color:"#0b7a8e", a:k });
		c.save(); c.globalAlpha = k; c.fillStyle = "#e8e3d8"; c.fillRect(x + 22, y + 94, cw - 44, 1); c.restore();
		const line = `${g.dur} · ${g.whereLabel}`;
		text(c, line, x + 22, y + 120, { size:fit(c, line, cw - 44, 15, 700), weight:700, color:"#55607a", a:k });
		text(c, "Jouable sur ordinateur et téléphone", x + 22, y + 146, { size:14, weight:700, color:"#2f8a4f", a:k });
	});
}
function relecture(c, img, t, d){
	const a = life(t, .3, d, .8, .6); if(a <= 0) return;
	c.save(); c.globalAlpha = a; c.fillStyle = "rgba(5,10,25,.36)"; c.fillRect(0, 0, W, H); c.restore();
	text(c, "AVANT LA MISE EN LIGNE", W/2, 150, { size:14, weight:800, color:CYAN, align:"center", a, track:3 });
	text(c, "Chaque mini-jeu est relu par son équipe pédagogique", W/2, 192, { size:38, weight:600, fam:DISP, align:"center", a });
	const steps = [["1", "Jouer", "le mini-jeu de sa formation, environ 15 minutes"], ["2", "Noter", "ce qui est juste, ce qui est à corriger"], ["3", "Envoyer", "nous corrigeons avant de le montrer aux candidats"]];
	const cw = 340, gap = 26, x0 = (W - 3*cw - 2*gap)/2, y = 262, h = 190;
	steps.forEach(([n, ti, s], i) => {
		const k = out(seg(t, .8 + i*.45, 1.5 + i*.45))*a; if(k <= 0) return;
		const x = x0 + i*(cw + gap), yy = y + (1 - k)*16;
		glass(c, img, x, yy, cw, h, 22, k);
		c.save(); c.globalAlpha = k; c.fillStyle = GOLD; c.beginPath(); c.arc(x + cw/2, yy + 52, 26, 0, 7); c.fill(); c.restore();
		text(c, n, x + cw/2, yy + 53, { size:26, weight:800, color:NAVY, align:"center", a:k });
		text(c, ti, x + cw/2, yy + 110, { size:28, weight:600, fam:DISP, align:"center", a:k });
		text(c, s, x + cw/2, yy + 148, { size:fit(c, s, cw - 36, 16, 700), weight:700, color:MUTED, align:"center", a:k });
	});
}
function fin(c, t, d, logo){
	const a = seg(t, .2, 1.2);
	c.save(); c.globalAlpha = a*.88; c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.restore();
	const k = out(seg(t, .3, 1.4));
	c.save(); c.globalAlpha = a; rr(c, W/2 - 390, 132 + (1 - k)*14, 780, 440, 28); c.fillStyle = "#f7f2e9"; c.fill(); c.restore();
	c.save(); c.globalAlpha = a; if(logo.complete && logo.naturalWidth) c.drawImage(logo, W/2 - 180, 168 + (1 - k)*14, 360, 360*logo.naturalHeight/logo.naturalWidth); c.restore();
	text(c, "Le campus FGES en 3D", W/2, 360, { size:40, weight:600, fam:DISP, color:"#13254a", align:"center", a });
	text(c, "lwichlacz.github.io/campus_fges", W/2, 408, { size:20, weight:800, color:"#0b7a8e", align:"center", a:a*seg(t, .9, 1.6) });
	text(c, "Votre relecture rend chaque jeu plus juste. Merci !", W/2, 478, { size:22, weight:700, color:"#55607a", align:"center", a:seg(t, 1.6, 2.4) });
}

// pendant un panneau (à droite), le cadrage glisse vers la gauche pour que le bâtiment reste visible
function decale(ca, S, t){
	const dx = S.panel ? 240*smooth(life(t, 0, S.d, 1.6, 1.4)) : 0;
	if(dx > .5) ca.setViewOffset(W, H, dx, 0, W, H); else if(ca.view?.enabled) ca.clearViewOffset();
}
function compose(c, img, i, t, logo){
	const S = SHOTS[i];
	c.drawImage(img, 0, 0, W, H);
	vignette(c);
	if(S.lower) lower(c, img, S.lower, t, S.d);
	if(S.panel) panel(c, img, S.panel, t, S.d);
	if(S.over === "ouverture") ouverture(c, t, S.d);
	if(S.over === "chiffres") chiffres(c, img, t, S.d);
	if(S.over === "metro") metro(c, t, S.d);
	if(S.over === "jeux") jeux(c, img, t, S.d);
	if(S.over === "relecture") relecture(c, img, t, S.d);
	if(S.over === "fin") fin(c, t, S.d, logo);
	// fondus : au noir au début et à la fin, enchaînés aux changements de lieu
	const nx = SHOTS[i + 1], pv = SHOTS[i - 1];
	let f = 0;
	if(i === 0) f = 1 - seg(t, 0, 1.2);
	if(nx && nx.lieu !== S.lieu && S.over !== "metro") f = Math.max(f, seg(t, S.d - .45, S.d));
	if(pv && pv.lieu !== S.lieu && pv.over !== "metro") f = Math.max(f, 1 - seg(t, 0, .45));
	if(pv && pv.over === "metro") f = Math.max(f, 1 - seg(t, 0, .6));
	if(!nx) f = Math.max(f, seg(t, S.d - .8, S.d));
	if(f > 0){ c.fillStyle = `rgba(5,10,25,${f})`; c.fillRect(0, 0, W, H); }
}

/* ---------- installation ---------- */
let ctx = null, logo = null, cur = null;
async function installer(){
	const C = window.campus; if(!C) throw new Error("Ouvrir le site avec ?debug");
	T = C.THREE;
	await P.preparer({ qualite:"haute", heure:"jour" });
	for(const id of ["atrium", "wenovin", "eura"]){ const ld = C.loadInterior(id); for(let i = 0; i < 400 && !C.interiors?.[id]; i++){ P.pas(); await new Promise(r => setTimeout(r, 5)); } await ld; }
	SHOTS = plans(C); TOTAL = SHOTS.reduce((s, x) => s + x.d, 0);
	const ctl = controle(); if(ctl.manquantes.length || ctl.inconnues.length || ctl.doublons.length) throw new Error("Formations : " + JSON.stringify(ctl));
	await document.fonts.load(`600 40px ${DISP}`); await document.fonts.load(`800 20px ${BODY}`); await document.fonts.load(`700 20px ${BODY}`);
	const R = C.renderer, cam = C.camera;
	R.setPixelRatio(RENDU); R.setSize(W, H, false); cam.aspect = W/H; cam.updateProjectionMatrix(); C.post?.setSize(W, H, RENDU);
	logo = new Image(); logo.src = "/img/logo-fges.png"; await logo.decode().catch(() => {});
	const cv = document.createElement("canvas"); cv.width = OUT_W; cv.height = OUT_H;
	ctx = cv.getContext("2d"); ctx.setTransform(OUT_W/W, 0, 0, OUT_H/H, 0, 0); ctx.imageSmoothingQuality = "high";
	cur = null;
	return cv;
}
const free = C => Object.assign(C.controls, { enableDamping:false, autoRotate:false, minDistance:0, maxDistance:1e4, minPolarAngle:0, maxPolarAngle:Math.PI });
function placer(C, lieu){ if(lieu === cur) return; cur = lieu; if(lieu === "ext") C.placeExt("ha"); else C.placeIn(lieu); free(C); for(let k = 0; k < 3; k++) P.pas(0); }
// une image du film : caméra posée, campus avancé de dt, rendu, habillage
function image(C, tg, dt){
	let i = 0, t0 = 0; while(i < SHOTS.length - 1 && tg >= t0 + SHOTS[i].d){ t0 += SHOTS[i].d; i++; }
	const S = SHOTS[i], t = tg - t0;
	placer(C, S.lieu);
	const [p, look] = S.cam(clamp(t/S.d)); C.view(...p, ...look);
	decale(C.camera, S, t);
	P.pas(dt);
	compose(ctx, C.renderer.domElement, i, t, logo);
	return i;
}

/* ---------- aperçu : une image à l'instant t (secondes), enregistrée en JPEG ---------- */
export async function apercu(t, sortie = "tools/film/_apercu.jpg"){
	const cv = ctx ? ctx.canvas : await installer(), C = window.campus;
	cur = null; for(let k = 0; k < 4; k++) image(C, t, 1000/FPS);
	const i = image(C, t, 0);
	return { plan:i, total:TOTAL, ecrit:await P.photo(cv, sortie, .92) };
}
// planche contact : une image toutes les n secondes, pour relire tout le film d'un coup d'œil
export async function planche(n = 4, sortie = "tools/film/_planche.jpg"){
	const cv = ctx ? ctx.canvas : await installer(), C = window.campus;
	const cols = 5, tw = 384, th = 216, k = Math.ceil(TOTAL/n), rows = Math.ceil(k/cols);
	const pc = document.createElement("canvas"); pc.width = cols*tw; pc.height = rows*th; const x = pc.getContext("2d");
	x.fillStyle = "#000"; x.fillRect(0, 0, pc.width, pc.height); x.font = "700 16px sans-serif"; x.fillStyle = "#fff";
	for(let j = 0; j < k; j++){
		const t = j*n + n/2; cur = null; for(let q = 0; q < 3; q++) image(C, t, 1000/FPS); image(C, t, 0);
		x.drawImage(cv, (j % cols)*tw, Math.floor(j/cols)*th, tw, th); x.fillText(`${t.toFixed(1)} s`, (j % cols)*tw + 8, Math.floor(j/cols)*th + 20);
	}
	return P.photo(pc, sortie, .85);
}

/* ---------- tournage ---------- */
let ETAT = { phase:"repos" };
export const etat = () => ETAT;
export async function tourner({ sortie = "docs/validation-web/media/campus-3d.mp4", musique = "/docs/validation-web/voix/musique-film.wav", debit = 5_500_000, recepteur = "http://127.0.0.1:8767/film" } = {}){
	try {
		ETAT = { phase:"installation" };
		const cv = await installer(), C = window.campus;
		const { Muxer, ArrayBufferTarget } = await import("https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs");
		const SR = 48000, N = Math.round(TOTAL*FPS);
		const mux = new Muxer({ target:new ArrayBufferTarget(), fastStart:"in-memory", firstTimestampBehavior:"offset",
			video:{ codec:"avc", width:OUT_W, height:OUT_H, frameRate:FPS }, audio:{ codec:"aac", numberOfChannels:2, sampleRate:SR } });
		let fail = null;
		const venc = new VideoEncoder({ output:(ch, meta) => mux.addVideoChunk(ch, meta), error:e => fail = e });
		venc.configure({ codec:"avc1.640028", width:OUT_W, height:OUT_H, bitrate:debit, framerate:FPS, latencyMode:"quality", avc:{ format:"avc" } });
		// une pause qui n'est pas ralentie quand l'onglet est en arrière-plan
		const mc = new MessageChannel(), souffle = () => new Promise(r => { mc.port1.onmessage = r; mc.port2.postMessage(0); });
		const t0 = performance.now ? Date.now() : 0;
		// une seconde de campus avant la première image (lumières, ombres, lointain)
		cur = null; for(let k = 0; k < 30; k++) image(C, 0, 1000/FPS);
		for(let f = 0; f < N; f++){
			if(fail) throw fail;
			image(C, f/FPS, 1000/FPS);
			const vf = new VideoFrame(cv, { timestamp:Math.round(f*1e6/FPS), duration:Math.round(1e6/FPS) });
			venc.encode(vf, { keyFrame:f % (FPS*2) === 0 }); vf.close();
			while(venc.encodeQueueSize > 6) await new Promise(r => venc.addEventListener("dequeue", r, { once:true }));
			if(f % 10 === 0){ ETAT = { phase:"images", image:f, total:N, pct:Math.round(f/N*100), ecoule:Math.round((Date.now() - t0)/1000) }; await souffle(); }
		}
		await venc.flush(); venc.close();
		// la bande-son, rééchantillonnée en 48 kHz stéréo
		ETAT = { phase:"son" };
		const raw = await fetch(musique).then(r => { if(!r.ok) throw new Error("Musique introuvable : " + musique); return r.arrayBuffer(); });
		const buf = await new OfflineAudioContext(2, Math.ceil(TOTAL*SR), SR).decodeAudioData(raw);
		const aenc = new AudioEncoder({ output:(ch, meta) => mux.addAudioChunk(ch, meta), error:e => fail = e });
		aenc.configure({ codec:"mp4a.40.2", sampleRate:SR, numberOfChannels:2, bitrate:160_000 });
		const L = buf.getChannelData(0), Rr = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L, total = Math.min(buf.length, Math.round(TOTAL*SR));
		for(let s = 0; s < total; s += 1024){
			const n = Math.min(1024, total - s), d = new Float32Array(n*2);
			d.set(L.subarray(s, s + n), 0); d.set(Rr.subarray(s, s + n), n);
			const ad = new AudioData({ format:"f32-planar", sampleRate:SR, numberOfFrames:n, numberOfChannels:2, timestamp:Math.round(s/SR*1e6), data:d });
			aenc.encode(ad); ad.close();
		}
		await aenc.flush(); aenc.close();
		if(fail) throw fail;
		mux.finalize();
		const blob = new Blob([mux.target.buffer], { type:"video/mp4" });
		window.__film = blob;
		ETAT = { phase:"envoi", taille:blob.size };
		const recu = await fetch(recepteur + "?sortie=" + encodeURIComponent(sortie), { method:"POST", body:blob }).then(r => r.text());
		ETAT = { phase:"fini", duree:TOTAL, images:N, taille:blob.size, recu, ecoule:Math.round((Date.now() - t0)/1000) };
	} catch(e){ ETAT = { phase:"erreur", erreur:String(e && e.stack || e) }; }
	return ETAT;
}
// affiche : une image du film, en JPEG
export async function affiche(t = 5.4, sortie = "docs/validation-web/img/affiche.jpg"){ return apercu(t, sortie); }
