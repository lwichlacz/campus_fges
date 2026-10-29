/* Film de présentation du campus FGES en 3D (3 min 09, Full HD), tourné dans le vrai campus, à jour.
   Tournage image par image : l'horloge et la boucle du campus sont pilotées (tools/film/pilote.js), chaque image est
   rendue à l'instant exact en 2560×1440 puis réduite en 1920×1080, et encodée en H.264 + AAC dans le navigateur
   (WebCodecs) : aucune saccade, même sur une machine lente.

   Montage (calé sur la musique, 80 bpm, docs/validation-web/voix/musique.py) :
   ouverture · la promesse (découvrir le campus, découvrir les formations, les essayer) · 01 découvrir le campus
   (travellings) · 02 découvrir les formations, entité par entité (FGES, ISEA, EDN), les 40 formations
   avec leur mini-jeu ou « mini-jeu en préparation » · 03 les essayer (les mini-jeux) · la relecture · signature.

   Usage :  python tools/serve.py   et   python tools/film/recepteur.py   (reçoit la vidéo, port 8767)
            musique : cd docs/validation-web/voix && python musique.py   (→ musique-film.wav, 189 s)
            ouvrir http://localhost:8765/?debug, puis dans la console :
              const F = await import("/tools/film/film.js");
              await F.apercu(56)          // une image à 56 s → tools/film/_apercu.jpg
              await F.planche(4)          // une image toutes les 4 s → tools/film/_planche.jpg
              F.tourner()                 // tout le film ; avancement dans F.etat()
   Résultat : docs/validation-web/media/campus-3d.mp4, puis python docs/validation-web/build.py (page de relecture). */
import { FORMATIONS, GAMES, GAME_INFO } from "/js/data.js";
import * as P from "/tools/film/pilote.js";
import { createRame } from "/js/rame.js";

const W = 1920, H = 1080, FPS = 30, RENDU = 2;                  // image finale · rendu 3D en 2560×1440 (1280×720 ×2)
const NAVY = "#0c1a38", INK = "#13254a", CYAN = "#21b6ce", CYAN_L = "#7fdcec", CREAM = "#f6f1e7", WHITE = "#ffffff", MUTED = "rgba(232,238,248,.74)";
const ENT = {
	FGES: { name:"FGES", long:"Faculté de Gestion, Économie, Sciences", color:"#21b6ce", ink:"#0b2f67" },
	ISEA: { name:"ISEA", long:"Institut Supérieur d'Expertise et d'Audit", color:"#a0335f", ink:"#ffffff" },
	EDN:  { name:"EDN", long:"École du Numérique", color:"#d6a227", ink:"#1f1a10" }
};
const DISP = "Fraunces, Georgia, serif", BODY = "Nunito, system-ui, sans-serif";
// formations nouvelles : nom court et niveau affichés dans le film, mention « nouvelle formation »
const NOUVELLES = {
	veto: { name:"Prépa Véto", level:"prepa" },
	d2: { name:"Prépa D2", level:"prepa" },
	aese: { name:"Licence AESe", level:"L" },
	mre: { level:"M" }                     // nom complet, à la demande de l'équipe du master
};
const TOUTES = FORMATIONS.map(f => NOUVELLES[f.id] ? { ...f, ...NOUVELLES[f.id] } : f), NB = TOUTES.length, NEUVE = new Set(Object.keys(NOUVELLES));
const F = Object.fromEntries(TOUTES.map(f => [f.id, f]));
const LEVEL = { prep:"Année préparatoire", prepa:"Prépa", L:"Licence", LP:"Licence pro", M:"Master", DU:"Diplôme universitaire" };
const STEPS = {
	gestion:["L1 · Prix, équipe et compte de résultat", "L2 · Coût de revient", "L3 · Investir pour grandir"],
	cfa:["L1 · Pièces, TVA et banque", "L2 · Écarts de budget", "L3 · Mener l'audit"],
	sv:["L1 · Identifier les espèces", "L2 · Génétique de Mendel", "L3 · Choisir sa spécialité"],
	spi:["L1 · Piloter le bras robot", "L2 · Programmer et régler", "L3 · Vision par ordinateur"],
	info:["L1 · Un niveau et un héros en Python", "L1 · Les scores en ligne en SQL", "L2 · Réalité virtuelle et 5 000 joueurs"],
	dmb:["M1 · Données et séquençage", "M1 · Statistiques et IA", "M2 · Compte rendu clinique"],
	dgp:["M1 · Contrat de mariage et donation", "M1 · Successions et fiscalité", "M2 · Conseiller une famille"],
	mbif:["M1 · Écouter et analyser un client", "M1 · Crédit et taux d'endettement", "M2 · Diriger une agence"]
};
// intitulés raccourcis sur les cartes des mini-jeux, quand la grille passe à 4 colonnes
const COURT = { mbif:"Master Banques & Institutions Financières", dgp:"Master Droit & Gestion du Patrimoine" };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a)/(b - a));
const sine = x => -(Math.cos(Math.PI*x) - 1)/2;
const out3 = x => 1 - Math.pow(1 - x, 3);
const out5 = x => 1 - Math.pow(1 - x, 5);
const inout = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
const life = (t, a, b, fi = .6, fo = .6) => Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b));

/* ---------- trajectoires de caméra : courbes de Catmull-Rom, vitesse douce ---------- */
function cr(P, u){
	const n = P.length - 1, x = clamp(u)*n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
	const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
	return p1.map((_, k) => .5*(2*p1[k] + (-p0[k] + p2[k])*f + (2*p0[k] - 5*p1[k] + 4*p2[k] - p3[k])*f*f + (-p0[k] + 3*p1[k] - 3*p2[k] + p3[k])*f*f*f));
}
const path = (cams, tgts, e = sine) => u => [cr(cams, e(u)), cr(tgts, e(u))];
const orbit = (c, r, h, a0, a1, dh = 0) => u => { const k = sine(u), a = a0 + (a1 - a0)*k; return [[c[0] + r*Math.cos(a), c[1] + h + dh*k, c[2] + r*Math.sin(a)], c]; };

// travelling autour d'un cadrage du site : on part de sa position de caméra, on tourne de da0 à da1 radians
// autour du lieu et on avance de k0 à k1 fois la distance (k < 1 : on se rapproche)
const around = (tg, cam0, k0, k1, da0, da1, dy = 0) => u => {
	const e = sine(u), k = k0 + (k1 - k0)*e, a = da0 + (da1 - da0)*e;
	const v = [cam0[0] - tg[0], cam0[1] - tg[1], cam0[2] - tg[2]], ca = Math.cos(a), sa = Math.sin(a);
	return [[tg[0] + (v[0]*ca - v[2]*sa)*k, tg[1] + v[1]*k + dy*e, tg[2] + (v[0]*sa + v[2]*ca)*k], tg];
};
const HA = [[0, 8, -3], [16, 30, 43]], JARDIN = [[-28, 2, -37], [-14, 25, -1]], FALISE = [[9, 5, -37], [29, 40, 13]], WENOV = [[1, 6, 7], [30, 36, 71]];

/* ---------- le montage ---------- */
const ids = s => s.split(" ");
const SHOTS = [
	// ouverture
	// descente plongeante (45 à 50° sous l'horizon) : l'horizon et le lointain dans la brume restent hors cadre
	{ d:9, scene:"ext", cam:path([[150, 330, 190], [95, 200, 125], [48, 95, 70]], [[-10, 0, -30], [-4, 2, -16], [0, 6, -4]]), ov:"ouverture" },
	// la promesse
	{ d:12, scene:"ext", blur:.85, cam:around(...HA, 1.5, 1.25, .9, .5, 26), ov:"promesse" },
	// 01 · découvrir le campus : bâtiments, vie étudiante, métro, Euratechnologies
	{ d:7, scene:"ext", chap:"01 · Découvrir le campus", cam:around(...HA, 1.15, .85, -.5, .15), lt:["Hôtel Académique", "Le cœur historique de l'Université, depuis 1881"] },
	{ d:6, scene:"ext", cam:path([[5, 18, 27], [2.5, 13.5, 19], [1.5, 12, 16]], [[0, 7, -2], [0, 8, -3], [0, 9, -4]]), lt:["La cour d'honneur", "Le portail, les pelouses et le grand cèdre"] },
	{ d:5.5, scene:"chapelle", cam:around([0, 4, -3], [19, 30, 32], .9, .7, -.2, .2), lt:["La chapelle universitaire", "Néogothique des années 1920, restaurée en 2020"] },
	{ d:4.5, scene:"ext", cam:around([-47.6, 4, -9.8], [-33.6, 30.8, 26.2], 1.1, .9, .3, -.15), lt:["BU Vauban", "300 000 ouvrages et 338 places pour travailler"] },
	{ d:5.5, scene:"bibli", cam:around([-1, 1.5, -1], [24, 24, 30], .95, .75, -.25, .2), lt:["À l'intérieur de la BU", "La bibliothèque universitaire du campus"] },
	{ d:4.5, scene:"ext", cam:around([-8, 6, -37], [6, 34, -1], .95, .72, -.3, .2, -4), lt:["Rizomm", "Un bâtiment intelligent, alimenté à 73 % par le soleil"] },
	{ d:4, scene:"ext", cam:around(...JARDIN, 1.2, 1, .35, -.1), lt:["Jardin botanique Nicolas Boulay", "Un poumon vert au milieu du campus"] },
	{ d:5.5, scene:"ext", cam:around(...FALISE, 1.05, .85, -.35, .25), lt:["Bâtiment Michel Falise", "Les formations de la FGES et de l'ISEA"] },
	{ d:6, scene:"atrium", cam:path([[-30, 17, 30], [-21, 12, 23], [-13, 9, 17]], [[2, 5, 0], [4, 4.8, 0], [6, 4.8, -1]]), lt:["L'atrium", "Le cœur de la vie étudiante à Vauban"] },
	{ d:4, scene:"ext", cam:around([54.7, 5, 93.6], [68.7, 26.4, 129.6], .9, .72, -.25, .15, -3), lt:["Salle omnisports Norbert Segard", "Avec aussi le restaurant universitaire et la Maison de l'étudiant"] },
	{ d:5.5, scene:"ext", cam:around([105, 6, 53], [119, 40, 89], .85, .68, .3, -.1, -6), lt:["Palais Rameau", "L'agriculture urbaine, rouvert en 2025"] },
	{ d:4, scene:"ext", cam:around([-343.5, 3, 17.5], [-382, 30, 10], 1.1, .85, -.25, .25), lt:["Métro Cormontaigne", "La ligne 2, au pied du campus"] },
	{ d:7, scene:"rame", cam:() => [[0, 0, 0], [0, 0, -1]], lt:["Ligne 2 · direction Euratechnologies", "Trois stations jusqu'à Wenov"] },
	{ d:6.5, scene:"eura", cam:path([[-9, 95, 207], [14, 60, 130], [30, 36, 72]], [[-19, 0, 22], [-6, 3, 14], [1, 6, 7]]), lt:["Euratechnologies", "Le quartier du numérique, au bord de la Deûle"] },
	{ d:5.5, scene:"eura", cam:around(...WENOV, 1, .8, -.3, .2), lt:["Wenov", "Le campus de l'École du Numérique"] },
	// 02 · découvrir les formations
	{ d:3, scene:"eura", blur:.9, chap:"02 · Découvrir les formations", cam:orbit([1, 8, 7], 80, 50, 1.3, 1.5), ov:"compteur" },
	{ d:3, scene:"ext", blur:.65, cam:orbit([9, 6, -37], 58, 32, .9, 1.1), ent:"FGES", ov:"entite", info:`${TOUTES.filter(f => f.school === "FGES").length} formations · Campus Vauban` },
	{ d:5, scene:"ext", blur:.9, cam:orbit([9, 6, -37], 58, 32, 1.1, 1.3), ent:"FGES", grid:{ t:"Prépas", list:ids("apes cupge veto d2") } },
	{ d:7, scene:"ext", blur:.9, cam:orbit([9, 6, -37], 58, 32, 1.3, 1.65), ent:"FGES", grid:{ t:"Licences", list:ids("sv mh gestion ecofi lieg lpabf aese") } },
	{ d:8, scene:"ext", blur:.9, cam:orbit([0, 8, -3], 60, 30, 1.2, 1.75), ent:"FGES", grid:{ t:"Masters et parcours", list:ids("ecoop mdd im mrc me frd mbif mre duhm") } },
	{ d:3, scene:"atrium", blur:.65, cam:orbit([0, 4.5, 0], 34, 16, .6, .8), ent:"ISEA", ov:"entite", info:"6 formations · Campus Vauban" },
	{ d:9, scene:"atrium", blur:.9, cam:orbit([0, 4.5, 0], 34, 16, .8, 1.4), ent:"ISEA", grid:{ t:"Licence, masters et diplômes universitaires", list:ids("cfa cca dgp cgao duiacg dusp") } },
	{ d:3, scene:"eura", blur:.65, cam:orbit([1, 8, 7], 64, 30, 1.2, 1.35), ent:"EDN", ov:"entite", info:"14 formations · Euratechnologies" },
	{ d:6.5, scene:"wenovin", blur:.9, cam:orbit([0, 1, -3], 42, 32, 1.2, 1.6), ent:"EDN", grid:{ t:"Licences et masters", list:ids("info spi mn iasi dia cyber jn") } },
	{ d:6.5, scene:"wenovin", blur:.9, cam:orbit([0, 1, -3], 42, 32, 1.6, 2.0), ent:"EDN", grid:{ t:"Masters et diplômes universitaires", list:ids("dmb ebmd mtn duia duric ducse ducc") } },
	// 03 · les essayer
	{ d:15, scene:"wenovin", blur:.92, chap:"03 · Les essayer", cam:orbit([0, 1, -3], 44, 30, 2.0, 2.7), ov:"jeux" },
	// la relecture
	{ d:9, scene:"eura", blur:.8, cam:path([[30, 36, 72], [10, 70, 150], [-9, 110, 240]], [[1, 6, 7], [-8, 2, 16], [-19, 0, 22]]), ov:"relecture" },
	// signature
	{ d:9, scene:"eura", blur:.95, cam:path([[-9, 110, 240], [-9, 140, 300]], [[-19, 0, 22], [-19, 0, 22]]), ov:"signature" }
];
let acc = 0; for(const s of SHOTS){ s.t0 = acc; acc += s.d; }
const TOTAL = acc;
const shotAt = T => { let i = SHOTS.findIndex(s => T < s.t0 + s.d); return i < 0 ? SHOTS.length - 1 : i; };
export function controle(){
	const vues = SHOTS.flatMap(s => s.grid ? s.grid.list : []);
	return { manquantes:TOUTES.map(f => f.id).filter(id => !vues.includes(id)), inconnues:vues.filter(id => !F[id]), doublons:vues.filter((id, i) => vues.indexOf(id) !== i), total:vues.length, duree:TOTAL };
}

/* ---------- outils de dessin ---------- */
function rr(c, x, y, w, h, r){ c.beginPath(); c.roundRect(x, y, w, h, r); }
function font(c, w, s, f = BODY){ c.font = `${w} ${s}px ${f}`; }
function text(c, s, x, y, { size = 32, weight = 700, fam = BODY, color = WHITE, align = "left", a = 1, track = 0, base = "alphabetic" } = {}){
	if(a <= 0 || !s) return;
	c.save(); c.globalAlpha *= a; font(c, weight, size, fam); c.fillStyle = color; c.textAlign = align; c.textBaseline = base;
	if(track) c.letterSpacing = track + "px";
	c.fillText(s, x, y); c.restore();
}
// texte qui monte derrière un masque (typographie animée)
function rise(c, s, x, y, p, opts = {}){
	if(p <= 0) return;
	const size = opts.size || 32, k = out5(clamp(p));
	c.save(); c.beginPath(); c.rect(0, y - size*1.15, W, size*1.5); c.clip();
	text(c, s, x, y + (1 - k)*size*1.3, { ...opts, a:(opts.a ?? 1)*clamp(p*3) });
	c.restore();
}
function fitSize(c, s, max, size, weight = 700, fam = BODY){ font(c, weight, size, fam); while(size > 12 && c.measureText(s).width > max){ size--; font(c, weight, size, fam); } return size; }
function line(c, x, y, w, p, color = CYAN, th = 4){ if(p <= 0) return; c.save(); c.fillStyle = color; c.fillRect(x, y, w*out3(p), th); c.restore(); }
function wrap(c, s, max, size, weight = 700, fam = BODY){ font(c, weight, size, fam); const out = []; let l = ""; for(const w of s.split(" ")){ const t = l ? l + " " + w : w; if(c.measureText(t).width > max && l){ out.push(l); l = w; } else l = t; } if(l) out.push(l); return out; }

// icônes au trait, dessinées progressivement
function icon(c, kind, x, y, s, p, color){
	if(p <= 0) return;
	c.save(); c.translate(x, y); c.scale(s/100, s/100); c.strokeStyle = color; c.lineWidth = 5; c.lineCap = c.lineJoin = "round";
	c.setLineDash([600]); c.lineDashOffset = 600*(1 - out3(p)); c.beginPath();
	if(kind === "campus"){ c.moveTo(8, 88); c.lineTo(92, 88); c.moveTo(18, 88); c.lineTo(18, 44); c.lineTo(50, 18); c.lineTo(82, 44); c.lineTo(82, 88); c.moveTo(40, 88); c.lineTo(40, 62); c.lineTo(60, 62); c.lineTo(60, 88); c.moveTo(50, 18); c.lineTo(50, 4); }
	else if(kind === "formations"){ c.moveTo(50, 26); c.quadraticCurveTo(30, 14, 8, 18); c.lineTo(8, 80); c.quadraticCurveTo(30, 76, 50, 88); c.quadraticCurveTo(70, 76, 92, 80); c.lineTo(92, 18); c.quadraticCurveTo(70, 14, 50, 26); c.lineTo(50, 88); }
	else if(kind === "jeux"){ c.roundRect(6, 30, 88, 46, 22); c.moveTo(28, 44); c.lineTo(28, 62); c.moveTo(19, 53); c.lineTo(37, 53); c.moveTo(68, 48); c.arc(66, 48, 2, 0, 7); c.moveTo(78, 58); c.arc(76, 58, 2, 0, 7); }
	else if(kind === "check"){ c.moveTo(20, 52); c.lineTo(42, 72); c.lineTo(80, 30); }
	c.stroke(); c.restore();
}

/* ---------- habillage permanent ---------- */
export const FX = { grain:true, blur:true, vignette:true };      // effets activables (mesure de fluidité)
let grain = null;
function makeGrain(){ const g = document.createElement("canvas"); g.width = g.height = 256; const x = g.getContext("2d"), d = x.createImageData(256, 256); for(let i = 0; i < d.data.length; i += 4){ const v = Math.random()*255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return g; }
function finish(c, T){
	// vignettage, grain, fondu d'entrée et de sortie
	const v = c.createRadialGradient(W/2, H/2, H*.35, W/2, H/2, H*.95); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(5,10,25,.42)");
	if(FX.vignette){ c.fillStyle = v; c.fillRect(0, 0, W, H); }
	grain ||= makeGrain();
	if(FX.grain)
	c.save(); c.globalAlpha = .045; c.globalCompositeOperation = "overlay"; const ox = Math.random()*256, oy = Math.random()*256;
	c.translate(-ox, -oy); c.fillStyle = c.createPattern(grain, "repeat"); c.fillRect(0, 0, W + 256, H + 256); c.restore();
	const k = Math.max(1 - seg(T, 0, 1.2), seg(T, TOTAL - 1.6, TOTAL));
	if(k > 0){ c.fillStyle = `rgba(0,0,0,${k})`; c.fillRect(0, 0, W, H); }
}
function letterbox(c, T){
	// bandes cinéma (2,39:1) sur les plans de campus, qui entrent et sortent en douceur
	const i = shotAt(T), S = SHOTS[i], t = T - S.t0;
	const prev = SHOTS[i - 1], next = SHOTS[i + 1];
	let k = S.lb ? 1 : 0;
	if(S.lb && !(prev && prev.lb)) k = out3(seg(t, 0, .8));
	if(S.lb && !(next && next.lb)) k = Math.min(k, 1 - inout(seg(t, S.d - .8, S.d)));
	if(k <= 0) return;
	const h = (H - W/2.39)/2*k;
	c.fillStyle = "#000"; c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
}
// passage d'un chapitre à l'autre : trois bandes de couleur qui balaient l'image
function wipes(c, T){
	for(const S of SHOTS){
		if(!S.chap) continue;
		const u = (T - (S.t0 - .45))/.9; if(u <= 0 || u >= 1) continue;
		[NAVY, CYAN, "#f6f1e7"].forEach((col, i) => {
			const p = clamp((u - i*.07)/.79), x0 = -W*.45 + (W*2.7)*inout(p);          // à mi-course la bande couvre tout l'écran : la coupe ne se voit pas
			c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(x0 - 2000, 0); c.lineTo(x0 + 700, 0); c.lineTo(x0 + 500, H); c.lineTo(x0 - 2200, H); c.closePath(); c.fill(); c.restore();
		});
	}
}
// fondu au bleu nuit quand on change de lieu sans transition de chapitre
function dips(c, T){
	for(let i = 1; i < SHOTS.length; i++){
		const S = SHOTS[i], P = SHOTS[i - 1]; if(S.scene === P.scene || S.chap) continue;
		const k = 1 - Math.abs(T - S.t0)/.45; if(k > 0){ c.fillStyle = `rgba(12,26,56,${sine(k)})`; c.fillRect(0, 0, W, H); }
	}
}

/* ---------- les habillages de chaque plan ---------- */
function chapter(c, S, t){
	if(!S.chap) return;
	const a = life(t, .5, 3.6, .5, .6); if(a <= 0) return;
	const [n, title] = S.chap.split(" · ");
	const y = S.lb ? (H - W/2.39)/2 + 74 : 96;
	text(c, n, 96, y, { size:22, weight:800, color:CYAN, a, track:3 });
	line(c, 140, y - 8, 46, seg(t, .6, 1.2), CYAN, 3);
	rise(c, title.toUpperCase(), 200, y, seg(t, .7, 1.4), { size:22, weight:800, track:4, a });
}
function lowerThird(c, [title, sub], t, d, lb){
	const a = life(t, .7, d, .5, .5); if(a <= 0) return;
	const yb = lb ? H - (H - W/2.39)/2 - 70 : H - 120;
	c.save(); c.globalAlpha = a; c.fillStyle = CYAN; c.fillRect(96, yb - 74, 6, 92*out3(seg(t, .7, 1.2))); c.restore();
	rise(c, title, 126, yb - 22, seg(t, .8, 1.5), { size:52, fam:DISP, a });
	rise(c, sub, 128, yb + 18, seg(t, 1.05, 1.75), { size:26, weight:600, color:MUTED, a });
}
function ouverture(c, t, d){
	const a = 1 - seg(t, d - 1, d - .2);
	rise(c, "UNIVERSITÉ CATHOLIQUE DE LILLE", W/2, 418, seg(t, 1.3, 2.1), { size:22, weight:800, color:CYAN_L, align:"center", track:6, a });
	rise(c, "Le campus FGES", W/2, 560, seg(t, 1.8, 2.8), { size:150, fam:DISP, align:"center", a });
	line(c, W/2 - 160, 606, 320, seg(t, 2.6, 3.4)*a, CYAN, 5);
	rise(c, "en 3D", W/2, 690, seg(t, 3, 3.8), { size:64, fam:DISP, color:CYAN_L, align:"center", a });
	rise(c, `Une visite. ${NB} formations. Des mini-jeux pour les essayer.`, W/2, 790, seg(t, 4.2, 5.2), { size:30, weight:700, color:MUTED, align:"center", a });
}
function promesse(c, t, d){
	const a1 = life(t, .3, 5.6, .4, .5);
	rise(c, "Choisir une formation,", 200, 470, seg(t, .4, 1.2), { size:96, fam:DISP, a:a1 });
	rise(c, "c'est d'abord se projeter.", 200, 590, seg(t, 1.3, 2.1), { size:96, fam:DISP, color:CYAN_L, a:a1 });
	const P = [["campus", "01", "Découvrir le campus", "Vauban et Euratechnologies, reconstitués à l'échelle"], ["formations", "02", "Découvrir les formations", `${NB} formations, de la prépa au master`], ["jeux", "03", "Les essayer", "Un mini-jeu pour vivre ce que font les étudiants"]];
	const a2 = life(t, 5.8, d, .4, .6), cw = 500, gap = 80, x0 = (W - 3*cw - 2*gap)/2;
	P.forEach(([k, n, title, sub], i) => {
		const t0 = 6 + i*.55, p = seg(t, t0, t0 + .9); if(p <= 0) return;
		const x = x0 + i*(cw + gap), y = 360;
		icon(c, k, x, y, 120, seg(t, t0, t0 + 1.4), CYAN_L);
		text(c, n, x + cw - 4, y + 40, { size:28, weight:800, color:"rgba(127,220,236,.55)", align:"right", a:a2*p, track:2 });
		line(c, x, y + 170, cw, p*a2, "rgba(255,255,255,.35)", 2);
		rise(c, title, x, y + 240, seg(t, t0 + .2, t0 + 1), { size:fitSize(c, title, cw, 44, 700, DISP), fam:DISP, a:a2 });
		wrap(c, sub, cw, 26, 600).forEach((l, j) => rise(c, l, x, y + 296 + j*38, seg(t, t0 + .35, t0 + 1.15), { size:26, weight:600, color:MUTED, a:a2 }));
	});
}
function compteur(c, t, d){
	const a = life(t, .2, d + .3, .4, .3), n = Math.round(NB*out3(seg(t, .3, 1.6)));
	text(c, String(n), W/2 - 30, 560, { size:260, fam:DISP, align:"right", a, color:WHITE });
	rise(c, "formations", W/2, 470, seg(t, .5, 1.2), { size:64, fam:DISP, a });
	rise(c, "réparties dans trois entités", W/2, 540, seg(t, .8, 1.5), { size:32, weight:700, color:MUTED, a });
	let xx = W/2;
	Object.values(ENT).forEach((e, i) => {
		font(c, 800, 26); const w = c.measureText(e.name).width + 48, x = xx; xx += w + 14;
		const p = out3(seg(t, 1.2 + i*.25, 1.8 + i*.25)); if(p <= 0) return;
		c.save(); c.globalAlpha = a*p; rr(c, x, 590 + (1 - p)*20, w, 52, 26); c.fillStyle = e.color; c.fill(); c.restore();
		text(c, e.name, x + 24, 625 + (1 - p)*20, { size:26, weight:800, color:e.ink, a:a*p });
	});
}
function entite(c, S, t, d){
	const e = ENT[S.ent], p = inout(seg(t, 0, .7)), q = 1 - inout(seg(t, d - .5, d + .2));
	// bandeau de couleur qui s'ouvre de la gauche
	c.save(); c.globalAlpha = .96*Math.min(1, q*1.2); c.fillStyle = e.color; c.fillRect(0, 0, W*.5*p, H); c.restore();
	c.save(); c.beginPath(); c.rect(0, 0, W*.5*p, H); c.clip();
	text(c, "ENTITÉ", 120, 380, { size:24, weight:800, color:e.ink, track:6, a:q });
	text(c, e.name, 116, 520, { size:fitSize(c, e.name, W*.5 - 200, 150, 700, DISP), fam:DISP, color:e.ink, a:q });
	c.restore();
	wrap(c, e.long, W*.5 - 200, 52, 700, DISP).forEach((l, j, arr) => rise(c, l, W*.5 + 100, 500 - (arr.length - 1)*64 + j*64, seg(t, .5 + j*.12, 1.2 + j*.12), { size:52, fam:DISP, a:q }));
	rise(c, S.info, W*.5 + 102, 570, seg(t, .75, 1.45), { size:30, weight:700, color:MUTED, a:q });
}
function grid(c, S, t, d){
	const e = ENT[S.ent], L = S.grid.list, a = life(t, 0, d, .3, .5);
	// pastille de l'entité et titre du groupe
	font(c, 800, 22); const w = c.measureText(e.name.toUpperCase()).width + 40 + 3*e.name.length;
	c.save(); c.globalAlpha = a; rr(c, 160, 118, w, 44, 22); c.fillStyle = e.color; c.fill(); c.restore();
	text(c, e.name.toUpperCase(), 180, 148, { size:22, weight:800, color:e.ink, a, track:3 });
	rise(c, S.grid.t, 160, 238, seg(t, .15, .8), { size:62, fam:DISP, a });
	const cols = 2, cw = 780, ch = 118, gx = 40, gy = 20, x0 = 160, y0 = 300;
	L.forEach((id, i) => {
		const f = F[id], g = GAMES[id] ? GAME_INFO[GAMES[id]] : null;
		const t0 = .35 + i*.11, p = out5(seg(t, t0, t0 + .7))*a; if(p <= 0) return;
		const alone = i === L.length - 1 && L.length % cols;          // dernière carte seule sur sa ligne : centrée
		const x = alone ? x0 + (cw + gx)/2 : x0 + (i % cols)*(cw + gx), y = y0 + Math.floor(i/cols)*(ch + gy) + (1 - p)*30;
		c.save(); c.globalAlpha = p;
		rr(c, x, y, cw, ch, 16); c.fillStyle = "rgba(255,255,255,.96)"; c.fill();
		c.fillStyle = e.color; c.fillRect(x, y + 16, 6, ch - 32);
		text(c, (f.id === "cupge" ? "Prépa et licence" : LEVEL[f.level]).toUpperCase(), x + 34, y + 38, { size:16, weight:800, color:"#6b7590", track:2 });
		const name = f.name.replace(/^(Licence Pro|Licence|Master|DU|Prépa) /, m => m);
		text(c, name, x + 34, y + 76, { size:fitSize(c, name, cw - 68, 30, 800), weight:800, color:INK });
		// badge du mini-jeu
		const s = g ? `🎮  Mini-jeu « ${g.title} »` : NEUVE.has(id) ? "Nouvelle formation · mini-jeu en préparation" : "Mini-jeu en préparation";
		font(c, 800, 17); const bw = c.measureText(s).width + 28;
		rr(c, x + 34, y + 88, bw, 28, 14); c.fillStyle = g ? "#dff5e6" : "#eef0f5"; c.fill();
		text(c, s, x + 48, y + 108, { size:17, weight:800, color:g ? "#1d7a43" : "#6b7590" });
		c.restore();
	});
}
function jeux(c, t, d){
	const a = life(t, 0, d, .3, .6);
	rise(c, "Un mini-jeu par formation", 160, 238, seg(t, .4, 1.2), { size:72, fam:DISP, a });
	rise(c, "Quelques minutes pour vivre ce que font vraiment les étudiants.", 162, 300, seg(t, .7, 1.5), { size:32, weight:700, color:MUTED, a });
	// grille calculée sur le nombre de jeux : 3 colonnes jusqu'à 6 jeux, 4 au-delà
	const ready = FORMATIONS.filter(f => GAMES[f.id]), nc = ready.length > 6 ? 4 : 3, gx = nc > 3 ? 28 : 40, gy = 36, ch = 270;
	const cw = nc > 3 ? 410 : 520, x0 = (W - nc*cw - (nc - 1)*gx)/2, y0 = 370;
	ready.forEach((f, i) => {
		const g = GAME_INFO[GAMES[f.id]], e = ENT[f.school], t0 = 1.6 + i*.3, p = out5(seg(t, t0, t0 + .8))*a; if(p <= 0) return;
		const x = x0 + (i % nc)*(cw + gx), y = y0 + Math.floor(i/nc)*(ch + gy) + (1 - p)*40;
		c.save(); c.globalAlpha = p;
		rr(c, x, y, cw, ch, 20); c.fillStyle = "rgba(255,255,255,.97)"; c.fill();
		c.fillStyle = e.color; c.fillRect(x, y, cw, 8);
		// sur 4 colonnes : icône plus petite, et nom court pour les intitulés trop longs
		const ic = nc > 3 ? 44 : 54, tx = nc > 3 ? 88 : 110, nom = nc > 3 && COURT[f.id] || f.name;
		font(c, 400, ic, "system-ui, 'Apple Color Emoji', sans-serif"); c.textBaseline = "alphabetic"; c.fillText(g.icon, x + 26, y + 82);
		text(c, g.title, x + tx, y + 64, { size:fitSize(c, g.title, cw - tx - 24, 32, 700, DISP), fam:DISP, color:INK });
		text(c, nom, x + tx, y + 96, { size:fitSize(c, nom, cw - tx - 24, 19, 700), weight:700, color:"#5b6580" });
		(STEPS[f.id] || []).forEach((s, j) => {
			const q = seg(t, t0 + .5 + j*.18, t0 + .9 + j*.18);
			c.save(); c.globalAlpha = p*q; rr(c, x + 30, y + 128 + j*44, cw - 60, 36, 10); c.fillStyle = "#f1f3f8"; c.fill(); c.restore();
			text(c, s, x + 46, y + 153 + j*44, { size:fitSize(c, s, cw - 92, 19, 700), weight:700, color:INK, a:p*q });
		});
		c.restore();
	});
	const all = FORMATIONS.length, n = ready.length;
	rise(c, `${n} jouables aujourd'hui · les ${all - n} suivants construits avec chaque équipe pédagogique`, W/2, 1000, seg(t, 4.6, 5.4), { size:28, weight:800, color:CYAN_L, align:"center", a });
}
function relecture(c, t, d){
	const a = life(t, 0, d, .3, .6);
	rise(c, "Avant de les montrer aux candidats,", 200, 380, seg(t, .3, 1.1), { size:72, fam:DISP, a });
	rise(c, "chaque jeu est relu par son équipe pédagogique.", 200, 470, seg(t, .9, 1.7), { size:72, fam:DISP, color:CYAN_L, a });
	["Juste sur le fond", "Fidèle à la formation", "Au bon niveau"].forEach((s, i) => {
		const t0 = 2.6 + i*.5, p = seg(t, t0, t0 + .7); if(p <= 0) return;
		const x = 200 + i*540, y = 600;
		c.save(); c.globalAlpha = a*clamp(p*2); c.beginPath(); c.arc(x + 36, y + 36, 36, 0, 7); c.fillStyle = CYAN; c.fill(); c.restore();
		icon(c, "check", x + 6, y + 6, 60, seg(t, t0 + .1, t0 + .8), NAVY);
		rise(c, s, x + 96, y + 50, seg(t, t0 + .15, t0 + .85), { size:38, weight:800, a });
	});
	rise(c, "Votre relecture : environ 15 minutes, sur la page de chaque jeu.", 200, 820, seg(t, 4.6, 5.4), { size:32, weight:700, color:MUTED, a });
}
function signature(c, t, d, logo){
	const p = inout(seg(t, 0, 1));
	c.save(); c.globalAlpha = .9*p; c.fillStyle = NAVY; c.fillRect(0, 0, W, H); c.restore();
	const k = out5(seg(t, .4, 1.4));
	c.save(); c.globalAlpha = k; rr(c, W/2 - 520, 250 + (1 - k)*30, 1040, 230, 26); c.fillStyle = CREAM; c.fill();
	if(logo.complete && logo.naturalWidth){ const lw = 560, lh = lw*logo.naturalHeight/logo.naturalWidth; c.drawImage(logo, W/2 - lw/2, 250 + (230 - lh)/2 + (1 - k)*30, lw, lh); }
	c.restore();
	rise(c, "Le campus FGES en 3D", W/2, 620, seg(t, 1, 1.8), { size:84, fam:DISP, align:"center" });
	rise(c, "Découvrir le campus  ·  Découvrir les formations  ·  Les essayer", W/2, 690, seg(t, 1.4, 2.2), { size:32, weight:700, color:CYAN_L, align:"center" });
	rise(c, "lwichlacz.github.io/campus_fges", W/2, 790, seg(t, 2, 2.8), { size:26, weight:700, color:MUTED, align:"center", track:1 });
	text(c, "Bâtiments et photos aériennes : © IGN · Carte : © contributeurs OpenStreetMap", W/2, 1010, { size:18, weight:600, color:"rgba(232,238,248,.45)", align:"center", a:seg(t, 2.4, 3.2) });
}

/* ---------- une image du film ---------- */
let small = null;
function compose(c, img, T, logo){
	const i = shotAt(T), S = SHOTS[i], t = T - S.t0;
	c.drawImage(img, 0, 0, W, H);
	// fond flouté et assombri derrière les textes et les cartes (flou par réduction-agrandissement)
	const prev = SHOTS[i - 1], next = SHOTS[i + 1];
	let b = S.blur || 0;
	if(b){ if(!(prev && prev.blur)) b *= sine(seg(t, 0, .9)); if(!(next && next.blur)) b *= 1 - sine(seg(t, S.d - .9, S.d)); }
	if(b > 0 && FX.blur){
		small ||= Object.assign(document.createElement("canvas"), { width:320, height:180 });
		const sc = small.getContext("2d"); sc.filter = "blur(5px)"; sc.drawImage(img, -12, -7, 344, 194);
		c.save(); c.globalAlpha = clamp(b*1.1); c.imageSmoothingQuality = "high"; c.drawImage(small, 0, 0, W, H); c.restore();
		c.fillStyle = `rgba(12,26,56,${.62*b})`; c.fillRect(0, 0, W, H);
	}
	if(S.lt) lowerThird(c, S.lt, t, S.d, S.lb);
	if(S.ov === "ouverture") ouverture(c, t, S.d);
	if(S.ov === "promesse") promesse(c, t, S.d);
	if(S.ov === "compteur") compteur(c, t, S.d);
	if(S.ov === "entite") entite(c, S, t, S.d);
	if(S.grid) grid(c, S, t, S.d);
	if(S.ov === "jeux") jeux(c, t, S.d);
	if(S.ov === "relecture") relecture(c, t, S.d);
	if(S.ov === "signature") signature(c, t, S.d, logo);
	letterbox(c, T);
	chapter(c, S, t);
	dips(c, T);
	wipes(c, T);
	finish(c, T);
}

/* ---------- installation ---------- */
let ctx = null, logo = null, cur = null, T = null;
async function installer(){
	const C = window.campus; if(!C) throw new Error("Ouvrir le site avec ?debug");
	T = C.THREE;
	await P.preparer({ qualite:"haute", heure:"jour" });
	for(const id of ["atrium", "wenovin", "eura", "chapelle", "bibli"]){ const ld = C.loadInterior(id); for(let i = 0; i < 400 && !C.interiors?.[id]; i++){ P.pas(); await new Promise(r => setTimeout(r, 5)); } await ld; }
	const ctl = controle(); if(ctl.manquantes.length || ctl.inconnues.length || ctl.doublons.length) throw new Error("Formations : " + JSON.stringify(ctl));
	await document.fonts.load(`600 40px ${DISP}`); await document.fonts.load(`800 20px ${BODY}`); await document.fonts.load(`700 20px ${BODY}`);
	cadre(C);
	// pas de bulles de noms dans le film, ni à Vauban ni à Euratechnologies (le shader des étiquettes se reconnaît à son
	// uniforme uSplit) ; pas de feuilles qui tombent non plus : une feuille qui passe devant l'objectif remplit le cadre
	for(const sc of [C.scene, ...Object.values(C.interiors || {}).map(i => i?.scene)]) sc?.traverse(o => {
		if(o.material?.uniforms?.uSplit) o.visible = false;
		if(o.isInstancedMesh && !o.frustumCulled && o.geometry?.type === "PlaneGeometry" && o.geometry.parameters?.width === 1 && o.geometry.parameters?.height === 1 && o.material?.isMeshBasicMaterial) o.visible = false;
	});
	// la rame de la ligne 2, filmée de l'intérieur
	rame = createRame(); rame.camera.fov = 52;
	// pas de logo.decode() : il attend une image affichée, et le pilote suspend l'affichage
	logo = new Image(); await Promise.race([new Promise(r => { logo.onload = logo.onerror = r; logo.src = "/img/logo-fges.png"; }), new Promise(r => setTimeout(r, 4000))]);
	const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
	ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high";
	cur = null;
	return cv;
}
// rendu verrouillé en 2560×1440 et en 16/9 à chaque image : si la fenêtre change de taille pendant le tournage,
// le site recalcule ses proportions, et l'image serait déformée
function cadre(C){
	const R = C.renderer, cam = C.camera;
	if(R.getPixelRatio() !== RENDU || R.domElement.width !== 1280*RENDU || R.domElement.height !== 720*RENDU){ R.setPixelRatio(RENDU); R.setSize(1280, 720, false); C.post?.setSize(1280, 720, RENDU); }
	if(cam.aspect !== 16/9){ cam.aspect = 16/9; cam.updateProjectionMatrix(); }
	if(rame && rame.camera.aspect !== 16/9){ rame.camera.aspect = 16/9; rame.camera.updateProjectionMatrix(); }
}
let rame = null, rameShot = null, rameT = 0;
const LINE2 = ["Cormontaigne", "Port de Lille", "Bois Blancs", "Canteleu – Euratechnologies"];
const free = C => Object.assign(C.controls, { enableDamping:false, autoRotate:false, minDistance:0, maxDistance:1e4, minPolarAngle:0, maxPolarAngle:Math.PI });
function placer(C, lieu){ if(lieu === cur || lieu === "rame") return; cur = lieu; if(lieu === "ext") C.placeExt("ha"); else C.placeIn(lieu); free(C); for(let k = 0; k < 3; k++) P.pas(0); }
// une image du film : lieu installé, caméra posée, campus avancé de dt (ms), rendu, habillage
const MESURE = { pas:0, habillage:0, encodage:0 };      // millisecondes cumulées (Date.now : l'horloge du pilote est figée)
function image(C, T, dt){
	const i = shotAt(T), S = SHOTS[i];
	placer(C, S.scene); cadre(C);
	const [p, look] = S.cam(clamp((T - S.t0)/S.d)); if(S.scene !== "rame") C.view(...p, ...look);
	let m0 = Date.now(); P.pas(dt); MESURE.pas += Date.now() - m0;
	if(S.scene === "rame"){
		// à bord : la rame quitte Cormontaigne, s'arrête à Port de Lille et repart
		const t = T - S.t0;
		if(rameShot !== S || t < rameT){ rame.start({ names:LINE2, step:3.6 }); rameShot = S; rameT = 0; rame.camera.aspect = 16/9; rame.camera.updateProjectionMatrix(); }
		rame.update(Math.max(0, t - rameT), T); rameT = t;
		C.renderer.setRenderTarget(null); C.renderer.render(rame.scene, rame.camera);
	}
	m0 = Date.now(); compose(ctx, C.renderer.domElement, Math.min(T, TOTAL - .001), logo); MESURE.habillage += Date.now() - m0;
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
export async function tourner({ sortie = "docs/validation-web/media/campus-3d.mp4", musique = "/docs/validation-web/voix/musique-film.wav", debit = 4_500_000, recepteur = "http://127.0.0.1:8767/film" } = {}){
	try {
		ETAT = { phase:"installation" };
		const cv = await installer(), C = window.campus;
		const { Muxer, ArrayBufferTarget } = await import("https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs");
		const SR = 48000, N = Math.round(TOTAL*FPS);
		const mux = new Muxer({ target:new ArrayBufferTarget(), fastStart:"in-memory", firstTimestampBehavior:"offset",
			video:{ codec:"avc", width:W, height:H, frameRate:FPS }, audio:{ codec:"aac", numberOfChannels:2, sampleRate:SR } });
		let fail = null;
		const venc = new VideoEncoder({ output:(ch, meta) => mux.addVideoChunk(ch, meta), error:e => fail = e });
		// encodeur matériel du Mac demandé explicitement (sinon le navigateur peut retomber sur l'encodage logiciel, 10 fois plus lent)
		const vcfg = { codec:"avc1.640028", width:W, height:H, bitrate:debit, framerate:FPS, latencyMode:"quality", avc:{ format:"avc" }, hardwareAcceleration:"prefer-hardware" };
		if(!(await VideoEncoder.isConfigSupported(vcfg)).supported) delete vcfg.hardwareAcceleration;
		venc.configure(vcfg);
		// une pause qui n'est pas ralentie quand l'onglet est en arrière-plan
		const mc = new MessageChannel(), souffle = () => new Promise(r => { mc.port1.onmessage = r; mc.port2.postMessage(0); });
		const t0 = performance.now ? Date.now() : 0;
		// une seconde de campus avant la première image (lumières, ombres, lointain)
		cur = null; for(let k = 0; k < 30; k++) image(C, 0, 1000/FPS);
		for(let f = 0; f < N; f++){
			if(fail) throw fail;
			image(C, f/FPS, 1000/FPS);
			const e0 = Date.now();
			const vf = new VideoFrame(cv, { timestamp:Math.round(f*1e6/FPS), duration:Math.round(1e6/FPS) });
			venc.encode(vf, { keyFrame:f % (FPS*2) === 0 }); vf.close();
			while(venc.encodeQueueSize > 6) await new Promise(r => venc.addEventListener("dequeue", r, { once:true }));
			MESURE.encodage += Date.now() - e0;
			if(f % 10 === 0){ ETAT = { phase:"images", image:f, total:N, pct:Math.round(f/N*100), ecoule:Math.round((Date.now() - t0)/1000), msParImage:{ pas:Math.round(MESURE.pas/(f + 1)), habillage:Math.round(MESURE.habillage/(f + 1)), encodage:Math.round(MESURE.encodage/(f + 1)) } }; await souffle(); }
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
/* Retouche : retourne seulement certains plans (sans le son), chacun dans tools/film/_plan-<i>.mp4,
   puis  python tools/film/raccord.py  les recolle dans le film existant. Pour un nouveau mini-jeu :
   F.retoucher(F.plansJeux(["dgp", "mbif"]))  (la scène des jeux et les grilles où figurent ces formations).
   Le tournage étant image par image, un plan retourné tombe exactement à sa place. */
export const plansJeux = (ids = Object.keys(GAMES)) => SHOTS.map((s, i) => (s.ov === "jeux" || s.grid?.list.some(id => ids.includes(id))) ? i : -1).filter(i => i >= 0);
export async function retoucher(plans = plansJeux(), { debit = 4_500_000, recepteur = "http://127.0.0.1:8767/film" } = {}){
	const faits = [];
	try {
		ETAT = { phase:"installation" };
		const cv = await installer(), C = window.campus;
		const { Muxer, ArrayBufferTarget } = await import("https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs");
		const mc = new MessageChannel(), souffle = () => new Promise(r => { mc.port1.onmessage = r; mc.port2.postMessage(0); });
		for(const i of plans){
			const S = SHOTS[i], f0 = Math.round(S.t0*FPS), f1 = Math.round((S.t0 + S.d)*FPS);
			const mux = new Muxer({ target:new ArrayBufferTarget(), fastStart:"in-memory", video:{ codec:"avc", width:W, height:H, frameRate:FPS } });
			let fail = null;
			const venc = new VideoEncoder({ output:(ch, meta) => mux.addVideoChunk(ch, meta), error:e => fail = e });
			const vcfg = { codec:"avc1.640028", width:W, height:H, bitrate:debit, framerate:FPS, latencyMode:"quality", avc:{ format:"avc" }, hardwareAcceleration:"prefer-hardware" };
			if(!(await VideoEncoder.isConfigSupported(vcfg)).supported) delete vcfg.hardwareAcceleration;
			venc.configure(vcfg);
			// une seconde de campus avant la première image du plan
			cur = null; for(let k = 0; k < 30; k++) image(C, f0/FPS, 1000/FPS);
			for(let f = f0; f < f1; f++){
				if(fail) throw fail;
				image(C, f/FPS, 1000/FPS);
				const vf = new VideoFrame(cv, { timestamp:Math.round((f - f0)*1e6/FPS), duration:Math.round(1e6/FPS) });
				venc.encode(vf, { keyFrame:(f - f0) % (FPS*2) === 0 }); vf.close();
				while(venc.encodeQueueSize > 6) await new Promise(r => venc.addEventListener("dequeue", r, { once:true }));
				if(f % 10 === 0){ ETAT = { phase:"images", plan:i, image:f - f0, total:f1 - f0, faits:faits.length, sur:plans.length }; await souffle(); }
			}
			await venc.flush(); venc.close(); if(fail) throw fail;
			mux.finalize();
			const sortie = `tools/film/_plan-${i}.mp4`;
			await fetch(recepteur + "?sortie=" + encodeURIComponent(sortie), { method:"POST", body:new Blob([mux.target.buffer], { type:"video/mp4" }) }).then(r => r.text());
			faits.push({ plan:i, debut:f0/FPS, fin:f1/FPS, fichier:sortie });
		}
		const avant = await fetch("/tools/film/_plans.json", { cache:"no-store" }).then(r => r.ok ? r.json() : { plans:[] }).catch(() => ({ plans:[] }));
		const liste = JSON.stringify({ fps:FPS, plans:[...avant.plans.filter(p => !plans.includes(p.plan)), ...faits] });
		await fetch(recepteur + "?sortie=" + encodeURIComponent("tools/film/_plans.json"), { method:"POST", body:liste });
		ETAT = { phase:"fini", plans:faits };
	} catch(e){ ETAT = { phase:"erreur", erreur:String(e && e.stack || e), plans:faits }; }
	return ETAT;
}
// affiche : une image du film, en JPEG
export async function affiche(t = 5.4, sortie = "docs/validation-web/img/affiche.jpg"){ return apercu(t, sortie); }
