/* « Le jour J » — mini-jeu de la Prépa Grandes Écoles de Commerce (CUPGE, FGES, 2026).
   Le jour du concours d'admission sur titre, dans le grand hall d'une école : des rangées de tables, une horloge
   immense qui avance pour de vrai, un jury de trois personnes au fond, et le tableau des résultats.
   1 · logique (TAGE) : cinq questions contre la montre, l'horloge du hall tourne (scène d'ouverture, une minute) ;
   2 · expression : toucher le mot fautif dans chaque phrase ;
   3 · culture générale : remettre cinq événements dans l'ordre, sur la frise du hall ;
   4 · anglais : compléter un courriel professionnel ;
   5 · l'entretien de personnalité : trois questions du jury, une carte d'expérience pour y répondre, et des visages
       qui s'éclairent ou se ferment ;
   6 · le tableau des résultats : admis en AST1 ou en AST2.
   Écoles réelles citées comme débouchés ; personnes et questions fictives. Contenu à relire par l'équipe de la prépa. */
import { stage3d, THREE } from "./stage3d.js?v=c983301653";
import { makePerson } from "../kit.js?v=c983301653";
import { jpoCard } from "./jpo.js?v=c983301653";
import { palier } from "./palier.js?v=c983301653";

const COURSES = {
	tage:  ["Prépa 2", "Tests TAGE · logique", "Suites, calcul, raisonnement : des tests chronométrés qu'on apprend à apprivoiser, semaine après semaine."],
	fr:    ["Prépa 2", "Tests TAGE · français", "Accords, homophones, tournures : écrire juste, et vite."],
	cg:    ["Prépa 1", "Culture générale", "Situer un événement, relier l'histoire à l'économie : la culture qui fait la différence à l'oral."],
	en:    ["Prépa 2", "Anglais et LV2", "Écrire et parler en contexte professionnel, avant un semestre à l'étranger en prépa 3."],
	oral:  ["Prépa 2", "Entretiens de motivation", "Raconter ses expériences pour montrer qui l'on est : on s'y entraîne devant des jurys blancs."],
	ast:   ["Prépa 2 et 3", "Concours AST1 et AST2", "En prépa 2, les écoles en AST1 (Audencia, SKEMA, Grenoble EM, NEOMA, KEDGE…) ; en prépa 3, l'AST2 (HEC, ESCP, emlyon, EDHEC…) ou un master sélectif."]
};
const STEPS_UI = [["tage", "Logique"], ["fr", "Français"], ["cg", "Culture G"], ["en", "Anglais"], ["oral", "Entretien"], ["res", "Résultats"]];
const TAGE = [
	{ q:"Quel nombre complète la suite : 2, 6, 12, 20, 30, … ?", a:["42", "40", "36", "44"], ok:"42", why:"On ajoute 4, 6, 8, 10… puis 12." },
	{ q:"Combien font 15 % de 240 ?", a:["36", "24", "32", "40"], ok:"36", why:"10 % = 24, 5 % = 12 : 36." },
	{ q:"« S'il pleut, Paul prend son parapluie. » Paul n'a pas de parapluie. Donc…", a:["Il ne pleut pas", "Il pleut", "On ne peut rien dire", "Paul est mouillé"], ok:"Il ne pleut pas", why:"Si A entraîne B, alors « non B » entraîne « non A » : c'est la contraposée." },
	{ q:"Livre est à lire ce que fourchette est à…", a:["manger", "couteau", "cuisine", "assiette"], ok:"manger", why:"Un objet et son usage." },
	{ q:"Un article coûte 80 € après une remise de 20 %. Quel était son prix ?", a:["100 €", "96 €", "104 €", "120 €"], ok:"100 €", why:"80 € = 80 % du prix : 80 ÷ 0,8 = 100." }
];
const FRENCH = [
	{ s:"Les dossiers que j'ai envoyé sont complets.", bad:"envoyé", fix:"envoyés", why:"Avec avoir, le participe s'accorde avec le COD placé avant : « les dossiers »." },
	{ s:"Il a quand même réussit son entretien.", bad:"réussit", fix:"réussi", why:"Participe passé de réussir : réussi." },
	{ s:"Quelque soit le résultat, je reste motivée.", bad:"Quelque", fix:"Quel que", why:"Devant le verbe être : « quel que », accordé au nom (quel que soit, quelle que soit)." },
	{ s:"Malgré qu'il soit tard, le jury continue.", bad:"Malgré", fix:"Bien que", why:"« Malgré que » est fautif : on dit « bien que » ou « malgré » suivi d'un nom." }
];
const EVENTS = [["rome", "Traité de Rome", 1957], ["mur", "Chute du mur de Berlin", 1989], ["euro", "Billets et pièces en euros", 2002], ["lehman", "Faillite de Lehman Brothers", 2008], ["paris", "Accord de Paris sur le climat", 2015]];
const MAIL = [
	{ t:"I am writing ___ my application for the summer internship.", a:["regarding", "about of", "for to"], ok:"regarding" },
	{ t:"Please find ___ my CV and cover letter.", a:["attached", "joined", "linked to"], ok:"attached", why:"« Joined » est un faux ami : en anglais, une pièce jointe est « attached »." },
	{ t:"I look forward to ___ from you.", a:["hearing", "hear", "be hearing"], ok:"hearing", why:"« Look forward to » est suivi d'un verbe en -ing." }
];
const CARDS = {
	bde:{ ic:"🎟️", t:"Trésorière du BDE", d:"un budget de 12 000 €, un gala à boucler" },
	stage:{ ic:"🍫", t:"Stage chez un artisan chocolatier", d:"refaire sa boutique en ligne, +30 % de commandes" },
	dublin:{ ic:"🇮🇪", t:"Semestre à Dublin", d:"seule, en anglais, loin de tout repère" },
	echec:{ ic:"🧗", t:"Un premier concours raté", d:"et ce que j'ai changé ensuite" },
	resto:{ ic:"🍲", t:"Bénévole aux Restos du cœur", d:"deux hivers, le samedi matin" }
};
const JURY = [
	{ who:"Le président du jury", q:"Racontez-nous une situation où vous avez dû gérer de l'argent ou des responsabilités.", best:"bde", ok:["stage"] },
	{ who:"La DRH", q:"Parlez-nous d'un échec, et de ce que vous en avez fait.", best:"echec", ok:[] },
	{ who:"L'ancien élève", q:"Pourquoi notre école, qui envoie tous ses étudiants à l'étranger ?", best:"dublin", ok:[] }
];

const CSS = `
.jj{position:fixed;inset:0;z-index:40;background:#e9f7fa;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#e9f7fa;overflow:hidden;animation:jjIn .4s ease both}
@keyframes jjIn{from{opacity:0}}
.jj canvas.jj-3d{position:absolute;inset:0;display:block;touch-action:none}
.jj-x{position:absolute;right:12px;top:10px;z-index:4;width:40px;height:40px;border-radius:50%;border:1px solid #21b7cb;background:#14161c;color:#21b7cb;font-size:22px;cursor:pointer}
.jj-top{position:absolute;left:12px;top:10px;z-index:3;display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100% - 470px)}
.jj-top span{background:#14161c;border:1px solid rgba(33,183,203,.35);border-radius:4px;padding:5px 10px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#8e8676}
.jj-top span.done{color:#21b7cb}.jj-top span.now{background:#21b7cb;color:#14161c}
.jj-timer{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:3;background:#14161c;border:2px solid #21b7cb;border-radius:6px;padding:4px 14px;font:300 22px/1.1 Tiempos Headline,Georgia,serif;color:#fff;font-variant-numeric:tabular-nums}
.jj-timer.hot{color:#ff7a6a;border-color:#ff7a6a}
.jj-timer:empty{display:none}
.jj-card{position:absolute;right:14px;top:58px;bottom:14px;width:394px;z-index:3;overflow:auto;background:#14161c;border:1px solid rgba(33,183,203,.5);border-radius:4px;padding:18px;box-sizing:border-box;box-shadow:0 20px 50px rgba(0,0,0,.45);scrollbar-width:thin}
.jj-k{font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#21b7cb}
.jj-h{font:300 26px/1.15 Tiempos Headline,Georgia,serif;color:#fff;margin:4px 0 10px}
.jj-p{margin:0 0 10px;font-size:14px;line-height:1.55;color:#d8cfbb}
.jj-p b{color:#fff}
.jj-whisper{border-left:2px solid #21b7cb;padding:6px 0 6px 12px;margin:10px 0;font:italic 300 14px/1.45 Inter,system-ui,sans-serif;color:#e9f7fa}
.jj-whisper small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb;font-style:normal}
.jj-q{font:300 19px/1.35 Tiempos Headline,Georgia,serif;color:#fff;margin:6px 0 10px}
.jj-opts{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.jj-opts button,.jj-list button{border:1px solid rgba(33,183,203,.5);background:transparent;color:#e9f7fa;border-radius:3px;padding:11px 10px;font:700 14.5px Inter,system-ui,sans-serif;cursor:pointer;text-align:left}
.jj-opts button:hover,.jj-list button:hover{background:rgba(33,183,203,.12)}
.jj-opts button.ok{border-color:#7fd19b;color:#7fd19b}.jj-opts button.ko{border-color:#ff7a6a;color:#ff7a6a;text-decoration:line-through}
.jj-list{display:grid;gap:7px}
.jj-sent{font:300 18px/1.7 Tiempos Headline,Georgia,serif;color:#fff;margin:8px 0}
.jj-sent span{cursor:pointer;border-bottom:1px dotted rgba(33,183,203,.6);padding:0 1px}
.jj-sent span:hover{background:rgba(33,183,203,.18)}
.jj-sent span.ko{color:#ff7a6a;text-decoration:line-through}.jj-sent span.ok{color:#7fd19b}
.jj-ok{color:#7fd19b;font-weight:800;font-size:13.5px;margin:6px 0}.jj-ko{color:#ff7a6a;font-weight:800;font-size:13.5px;margin:6px 0}
.jj-go{display:block;width:100%;border:0;border-radius:3px;padding:13px;margin-top:12px;background:#21b7cb;color:#14161c;font:700 15px Inter,system-ui,sans-serif;letter-spacing:.04em;cursor:pointer}
.jj-go:disabled{opacity:.35}
.jj-alt{display:block;width:100%;border:1px solid rgba(33,183,203,.5);border-radius:3px;padding:11px;margin-top:8px;background:transparent;color:#e9f7fa;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.jj-course{border:1px solid rgba(33,183,203,.4);border-radius:3px;padding:9px 11px;margin:10px 0}
.jj-course small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb}
.jj-course b{display:block;font:300 17px Tiempos Headline,Georgia,serif;color:#fff}.jj-course span{font-size:13px;color:#b9b09c}
.jj-stars{font-size:20px;letter-spacing:3px;color:#21b7cb}
.jj-cards{display:grid;gap:7px;margin:8px 0}
.jj-cards button{display:flex;gap:10px;align-items:center;text-align:left;border:1px solid rgba(33,183,203,.5);background:linear-gradient(135deg,#1d2028,#14161c);color:#e9f7fa;border-radius:6px;padding:10px 12px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
.jj-cards button i{font-style:normal;font-size:24px}
.jj-cards button small{display:block;font-weight:600;font-size:12px;color:#b9b09c}
.jj-cards button:disabled{opacity:.3}
.jj-faces{display:flex;gap:8px;margin:8px 0}
.jj-faces div{flex:1;text-align:center;border:1px solid rgba(33,183,203,.3);border-radius:4px;padding:6px 2px;font-size:11px;color:#b9b09c}
.jj-faces div b{display:block;font-size:26px}
.jj-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.jj-tbl td{padding:6px 3px;border-top:1px solid rgba(33,183,203,.2)}.jj-tbl td:last-child{text-align:right;color:#fff;font-weight:800}
@media (max-width:759px){
	.jj-card{left:0;right:0;top:auto;bottom:0;width:auto;max-height:55%;border-radius:10px 10px 0 0}
	.jj-top{display:none}
	.jj-opts{grid-template-columns:1fr}
}`;

export function openJourJ({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("jj-css")){ const st = document.createElement("style"); st.id = "jj-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "jj";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le jour J");
	root.innerHTML = `<canvas class="jj-3d" aria-hidden="true"></canvas>
		<div class="jj-top">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div><div class="jj-timer"></div>
		<button class="jj-x" aria-label="Quitter le jeu">×</button><div class="jj-card"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), card = $(".jj-card"), timerEl = $(".jj-timer");
	const S = { stars:0, errors:0, learned:new Set(), tage:0, fr:0, cg:0, en:0, oral:0, used:new Set() };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= le grand hall ================= */
	const W = stage3d($("canvas"), { panel:card, side:"right", panelW:410, bg:"#efe8da", fog:[60, 140], minD:5, maxD:120, maxPolar:1.4 });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#fff8ec", "#8a7a64", 1.1));
	const sun = new THREE.DirectionalLight("#fff1d6", 1.6); sun.position.set(-20, 30, 15); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-30, right:30, top:30, bottom:-30 }); scene.add(sun);
	const marble = W.canvasTex(256, 256, (x, w, h) => { for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){ x.fillStyle = (i + j) % 2 ? "#e9e1d0" : "#2a2a30"; x.fillRect(i*64, j*64, 64, 64); } x.strokeStyle = "rgba(255,255,255,.08)"; for(let k = 0; k < 30; k++){ x.beginPath(); x.moveTo(Math.random()*w, Math.random()*h); x.bezierCurveTo(Math.random()*w, Math.random()*h, Math.random()*w, Math.random()*h, Math.random()*w, Math.random()*h); x.stroke(); } });
	marble.wrapS = marble.wrapT = THREE.RepeatWrapping; marble.repeat.set(10, 8);
	mesh(G(new THREE.PlaneGeometry(60, 48)), M("#ffffff", { map:marble, roughness:.35 }), 0, 0, 0).rotation.x = -Math.PI/2;
	box(60, 16, .6, "#e7dcc4", 0, 0, -20); box(.6, 16, 48, "#e2d6bc", -30, 0, 0); box(.6, 16, 48, "#e2d6bc", 30, 0, 0);
	for(let i = 0; i < 6; i++){ cyl(.8, .9, 15, "#f2ead8", -25 + i*10, 0, -18.5); }
	box(60, 1, .8, "#c9a24a", 0, 15, -19.6);
	// l'horloge du hall : ses aiguilles suivent le chronomètre de l'épreuve
	const clock = new THREE.Group(); clock.position.set(0, 10, -19.5); scene.add(clock);
	mesh(G(new THREE.CylinderGeometry(3.2, 3.2, .3, 48)), "#14161c", 0, 0, 0, clock).rotation.x = Math.PI/2;
	const face = W.canvasTex(512, 512, (x, w, h) => { x.fillStyle = "#fbf6ea"; x.beginPath(); x.arc(256, 256, 250, 0, 7); x.fill(); x.fillStyle = "#14161c"; x.font = "300 52px Tiempos Headline,Georgia,serif"; x.textAlign = "center"; x.textBaseline = "middle"; ["XII", "III", "VI", "IX"].forEach((t, i) => { const a = i*Math.PI/2 - Math.PI/2; x.fillText(t, 256 + Math.cos(a)*190, 256 + Math.sin(a)*190); }); for(let i = 0; i < 60; i++){ const a = i/60*Math.PI*2; x.fillRect(256 + Math.cos(a)*228 - 2, 256 + Math.sin(a)*228 - 2, i % 5 ? 3 : 7, i % 5 ? 3 : 7); } });
	mesh(G(new THREE.CircleGeometry(3, 48)), new THREE.MeshBasicMaterial({ map:face }), 0, 0, .17, clock);
	const handM = mesh(G(new THREE.BoxGeometry(.12, 2.4, .05)), "#14161c", 0, 1.1, .22, clock); const minHand = new THREE.Group(); minHand.position.z = .2; clock.add(minHand); minHand.add(handM);
	const secHand = new THREE.Group(); secHand.position.z = .26; clock.add(secHand); mesh(G(new THREE.BoxGeometry(.05, 2.7, .03)), "#c0392b", 0, 1.2, 0, secHand);
	let clockT = 0, clockRun = false;
	W.onFrame((now, dt) => { if(clockRun) clockT += dt; secHand.rotation.z = -clockT/60*Math.PI*2*6; minHand.rotation.z = -clockT/600*Math.PI*2*3; });
	// les rangées de tables, dont la tienne
	let myDesk = null;
	for(let r = 0; r < 4; r++) for(let c = 0; c < 5; c++){
		const g = new THREE.Group(); g.position.set(-12 + c*6, 0, -6 + r*5); scene.add(g);
		box(3.2, .12, 1.8, "#6b4a2e", 0, 2.4, 0, g); for(const [x, z] of [[-1.4, -.7], [1.4, -.7], [-1.4, .7], [1.4, .7]]) box(.1, 2.4, .1, "#3a2a1a", x, 0, z, g);
		box(2.2, .02, 1.4, "#fbf8f0", 0, 2.52, 0, g);
		if(r === 2 && c === 2) myDesk = g;
		else if((r + c) % 3){ const p = makePerson(g, true, (r*5 + c) % 2 ? "student" : "pro"); p.g.scale.setScalar(2.1); p.g.position.set(0, .1, 1.65); p.g.rotation.y = Math.PI; }      // le hall est bâti à l'échelle 2 (tables de 2,4 m) : les candidats aussi
	}
	const lamp = new THREE.PointLight("#ffd27a", 30, 8, 1.5); lamp.position.set(0, 5, 0); myDesk.add(lamp);
	{ const l = label("Ta table · n° 47", { size:.024, bg:"#14161c", fg:"#c9a24a" }); l.position.set(0, 4.2, 0); myDesk.add(l); }
	// la frise du hall (culture générale)
	const frise = W.canvasTex(1600, 300, (x, w, h) => { x.fillStyle = "#14161c"; x.fillRect(0, 0, w, h); });
	box(16.4, 3.4, .2, "#c9a24a", 18, 5.2, -19.4); mesh(G(new THREE.PlaneGeometry(16, 3)), new THREE.MeshBasicMaterial({ map:frise }), 18, 6.9, -19.25);
	function drawFrise(list){
		frise.redraw((x, w, h) => {
			x.fillStyle = "#14161c"; x.fillRect(0, 0, w, h); x.strokeStyle = "#c9a24a"; x.lineWidth = 6; x.beginPath(); x.moveTo(60, h/2); x.lineTo(w - 60, h/2); x.stroke();
			x.textAlign = "center"; list.forEach((e, i) => { const X = 160 + i*(w - 320)/4; x.fillStyle = "#c9a24a"; x.beginPath(); x.arc(X, h/2, 16, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "300 46px Tiempos Headline,Georgia,serif"; x.fillText(e[2], X, h/2 - 50); x.font = "700 26px Inter,system-ui,sans-serif"; x.fillStyle = "#e8d9b0"; const words = e[1].split(" "); const half = Math.ceil(words.length/2); x.fillText(words.slice(0, half).join(" "), X, h/2 + 60); x.fillText(words.slice(half).join(" "), X, h/2 + 92); });
		});
	}
	drawFrise([]);
	// le jury, au fond du hall
	const juryG = new THREE.Group(); juryG.position.set(-18, 0, -12); juryG.rotation.y = .5; scene.add(juryG);
	box(9, .2, 2.4, "#3a2a1a", 0, 2.6, 0, juryG); box(9, 1.4, .2, "#3a2a1a", 0, 1.2, 1.1, juryG); for(const x of [-4.3, 4.3]) box(.2, 2.6, 2.2, "#3a2a1a", x, 0, 0, juryG);
	box(9, .05, 2.2, "#1f5a3a", 0, 2.8, 0, juryG);
	const jurors = [-3, 0, 3].map((x, i) => { const p = makePerson(juryG, true, i === 1 ? "senior" : "pro"); p.g.scale.setScalar(2.1); p.g.position.set(x, .1, -2); const l = label(["Président", "DRH", "Ancien élève"][i], { size:.022, bg:"#14161c", fg:"#c9a24a" }); l.position.set(x, 5.4, -2); juryG.add(l); return p; });
	const chair = new THREE.Group(); chair.position.set(0, 0, 3.4); juryG.add(chair); box(1.2, 1.4, 1.2, "#6b4a2e", 0, 0, 0, chair);
	// le tableau des résultats
	const results = W.canvasTex(1024, 1300, (x, w, h) => { x.fillStyle = "#14161c"; x.fillRect(0, 0, w, h); });
	const board = new THREE.Group(); board.position.set(28.5, 0, 4); board.rotation.y = -Math.PI/2; scene.add(board);
	box(9.4, 12.4, .3, "#c9a24a", 0, 1.6, 0, board); mesh(G(new THREE.PlaneGeometry(9, 12)), new THREE.MeshBasicMaterial({ map:results }), 0, 7.8, .17, board);

	/* ================= l'interface ================= */
	let stepHooks = [];
	function stage(k, title){
		root.querySelectorAll(".jj-top span").forEach(s => { const i = STEPS_UI.findIndex(x => x[0] === s.dataset.s), n = STEPS_UI.findIndex(x => x[0] === k); s.className = i < n ? "done" : i === n ? "now" : ""; });
		ev("stage", title); W.clearInput(); stepHooks.forEach(f => f()); stepHooks = []; timerEl.textContent = ""; timerEl.classList.remove("hot"); clockRun = false;
	}
	const whisper = t => `<div class="jj-whisper"><small>Inès, admise l'an dernier</small>${t}</div>`;
	function stars(n){ S.stars += n; return `<div class="jj-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	function err(){ S.errors++; play("bad"); ev("err"); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="jj-course"><small>${y}</small><b>${n}</b><span>${t}</span></div>`; }
	const show = html => { card.innerHTML = html; card.scrollTop = 0; };
	const append = html => { const el = card.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); card.scrollTop = card.scrollHeight; } };
	const next = (k, t) => `<button class="jj-go" data-next="${k}">${t}</button>`;
	card.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });
	const shuffle = a => a.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
	// un compte à rebours, affiché en haut et sur l'horloge du hall
	function countdown(sec, onEnd){
		let left = sec; clockRun = true; timerEl.textContent = "1:15";
		const fmt = s => `${Math.floor(s/60)}:${String(Math.ceil(s % 60) === 60 ? 0 : Math.ceil(s % 60)).padStart(2, "0")}`;
		const off = W.onFrame((now, dt) => { left -= dt; timerEl.textContent = fmt(Math.max(0, left)); timerEl.classList.toggle("hot", left < 15); if(left <= 0){ off(); clockRun = false; onEnd(); } });
		stepHooks.push(off);
		return () => { off(); clockRun = false; return left; };
	}

	/* ---------- 1 · logique, contre la montre (scène d'ouverture) ---------- */
	function tage(){
		stage("tage", "1 · Logique (TAGE)");
		W.fly(new THREE.Vector3(0, 6, -10), 26, 1.2, .15);
		const first = !S.tageDone;
		let i = 0, good = 0, done = false;
		const stop = countdown(75, () => finish(true));
		const render = () => {
			const t = TAGE[i];
			show(`${first ? `<div class="jj-k">Mini-jeu · ${formation.name}</div>` : ""}<div class="jj-h">Épreuve de logique</div>
				${first ? `<p class="jj-p">Le jour J. Table 47, dans le grand hall. <b>Cinq questions, une minute et quart</b>. L'horloge tourne déjà.</p>` : ""}
				<p class="jj-k">Question ${i + 1} / 5</p><p class="jj-q">${t.q}</p>
				<div class="jj-opts">${shuffle(t.a).map(a => `<button data-o="${a}">${a}</button>`).join("")}</div><div data-live></div>`);
			card.querySelector(".jj-opts").onclick = e => {
				const b = e.target.closest("[data-o]"); if(!b || done) return;
				const ok = b.dataset.o === t.ok; b.classList.add(ok ? "ok" : "ko");
				if(ok){ good++; play("good"); } else { err(); card.querySelector(`[data-o="${t.ok}"]`).classList.add("ok"); }
				card.querySelectorAll(".jj-opts button").forEach(x => x.disabled = true);
				append(`<p class="${ok ? "jj-ok" : "jj-ko"}">${t.why}</p>`);
				later(ok ? 700 : 1500, () => { if(done) return; i++; if(i < TAGE.length) render(); else finish(false); });
			};
		};
		function finish(timeout){
			if(done) return; done = true; const left = stop(); S.tage = good;
			const n = good === 5 ? 3 : good >= 3 ? 2 : 1;
			show(`<div class="jj-h">Épreuve de logique</div>${stars(n)}
				<p class="jj-p">${timeout ? "<b>Temps écoulé.</b> " : ""}<b>${good} / 5</b>${!timeout ? `, avec ${Math.round(left)} s d'avance` : ""}.</p>
				${whisper(good >= 4 ? "Pas mal pour un premier jour ! En prépa, on fait ces tests chaque semaine : on finit par voir les pièges venir." : "Normal de buter au début. En prépa, on s'entraîne chaque semaine : la vitesse vient avec les réflexes.")}
				${course("tage")}${first ? "" : next("fr", "Épreuve suivante : français →")}`);
			S.tageDone = true;
			if(first) later(2200, () => palier({ id:"jourj", onEvent, openLead, quit:close,
				titre:`${good} / 5 en logique. Le concours ne fait que commencer.`,
				texte:"Encore le français, la culture générale, l'anglais… puis l'entretien face au jury, et le tableau des résultats.",
				suite:"Passer tout le concours (≈ 6 min)" }).then(fr));
		}
		render();
	}

	/* ---------- 2 · français : toucher le mot fautif ---------- */
	function fr(){
		stage("fr", "2 · Français");
		W.fly(myDesk.position.clone().setY(2.6), 9, .7, .2);
		let i = 0, good = 0;
		const render = () => {
			const f = FRENCH[i];
			show(`<div class="jj-h">Expression française</div><p class="jj-p">Chaque phrase contient <b>une faute</b>. Touche le mot fautif.</p>
				<p class="jj-k">Phrase ${i + 1} / 4</p><p class="jj-sent">${f.s.split(" ").map(w => `<span data-w="${w.replace(/[.,]/g, "")}">${w}</span>`).join(" ")}</p><div data-live></div>`);
			let tried = false;
			card.querySelector(".jj-sent").onclick = e => {
				const s = e.target.closest("[data-w]"); if(!s || s.classList.contains("ok")) return;
				if(s.dataset.w !== f.bad){ err(); tried = true; s.classList.add("ko"); return; }
				s.classList.add("ok"); s.textContent = f.fix + (s.textContent.endsWith(".") ? "." : ""); play("good"); if(!tried) good++;
				append(`<p class="jj-ok">${f.why}</p>`);
				later(1300, () => { i++; if(i < FRENCH.length) render(); else end(); });
			};
		};
		function end(){ S.fr = good; show(`<div class="jj-h">Expression française</div>${stars(good === 4 ? 3 : good >= 2 ? 2 : 1)}<p class="jj-p"><b>${good} / 4</b> du premier coup.</p>${course("fr")}${next("cg", "Épreuve suivante : culture générale →")}`); }
		render();
	}

	/* ---------- 3 · culture générale : la frise du hall ---------- */
	function cg(){
		stage("cg", "3 · Culture générale");
		W.fly(new THREE.Vector3(18, 7, -19), 14, 1.35, 0);
		const placed = []; let errs = 0;
		drawFrise([]);
		const render = () => {
			show(`<div class="jj-h">Culture générale</div><p class="jj-p">Touche les cinq événements <b>du plus ancien au plus récent</b> : ils s'accrochent un à un sur la frise du hall.</p>
				<div class="jj-list">${shuffle(EVENTS.filter(e => !placed.includes(e))).map(e => `<button data-e="${e[0]}">${e[1]}</button>`).join("")}</div><div data-live></div>`);
			card.querySelector(".jj-list").onclick = e => {
				const b = e.target.closest("[data-e]"); if(!b) return;
				const ev2 = EVENTS.find(x => x[0] === b.dataset.e), want = EVENTS[placed.length];
				if(ev2 !== want){ err(); errs++; append(`<p class="jj-ko">${ev2[1]} : pas encore. Quel événement vient avant ?</p>`); return; }
				placed.push(ev2); play("pop"); drawFrise(placed);
				if(placed.length < EVENTS.length) return render();
				S.cg = Math.max(0, 5 - errs);
				show(`<div class="jj-h">Culture générale</div>${stars(errs === 0 ? 3 : errs <= 2 ? 2 : 1)}<p class="jj-p">1957, 1989, 2002, 2008, 2015 : de la construction européenne à la crise financière et au climat, toute l'économie d'aujourd'hui tient sur cette frise. À l'oral, savoir situer un événement fait souvent la différence.</p>${course("cg")}${next("en", "Épreuve suivante : anglais →")}`);
			};
		};
		render();
	}

	/* ---------- 4 · anglais : le courriel ---------- */
	function en(){
		stage("en", "4 · Anglais");
		W.fly(myDesk.position.clone().setY(2.6), 9, .7, -.2);
		let i = 0, good = 0;
		const render = () => {
			const m = MAIL[i];
			show(`<div class="jj-h">English</div><p class="jj-p">Complete the email to the internship manager.</p>
				<p class="jj-k">Blank ${i + 1} / 3</p><p class="jj-q">${m.t.replace("___", "<b style='color:#21b7cb'>_____</b>")}</p>
				<div class="jj-opts">${shuffle(m.a).map(a => `<button data-o="${a}">${a}</button>`).join("")}</div><div data-live></div>`);
			let tried = false;
			card.querySelector(".jj-opts").onclick = e => {
				const b = e.target.closest("[data-o]"); if(!b) return;
				if(b.dataset.o !== m.ok){ err(); tried = true; b.classList.add("ko"); if(m.why) append(`<p class="jj-ko">${m.why}</p>`); return; }
				b.classList.add("ok"); play("good"); if(!tried) good++;
				later(900, () => { i++; if(i < MAIL.length) render(); else { S.en = good; show(`<div class="jj-h">English</div>${stars(good === 3 ? 3 : good === 2 ? 2 : 1)}<p class="jj-p"><b>${good} / 3</b> at first try.</p>${course("en")}${next("oral", "L'après-midi : l'entretien →")}`); } });
			};
		};
		render();
	}

	/* ---------- 5 · l'entretien de personnalité ---------- */
	function oral(){
		stage("oral", "5 · L'entretien");
		W.fly(new THREE.Vector3(-18, 3.4, -12), 15, 1.2, .5);      // assez bas pour voir le visage des jurés au-dessus de la table
		let i = 0, score = 0;
		const mood = [0, 0, 0];
		const faces = () => `<div class="jj-faces">${["Président", "DRH", "Ancien élève"].map((n, k) => `<div><b>${mood[k] > 0 ? "🙂" : mood[k] < 0 ? "😒" : "😐"}</b>${n}</div>`).join("")}</div>`;
		const render = () => {
			const j = JURY[i];
			show(`<div class="jj-h">L'entretien de personnalité</div>${faces()}
				<p class="jj-k">${j.who}</p><p class="jj-q">« ${j.q} »</p>
				<p class="jj-p">Choisis l'expérience que tu racontes :</p>
				<div class="jj-cards">${Object.entries(CARDS).map(([k, c]) => `<button data-c="${k}" ${S.used.has(k) ? "disabled" : ""}><i>${c.ic}</i><span>${c.t}<small>${c.d}</small></span></button>`).join("")}</div><div data-live></div>`);
			card.querySelector(".jj-cards").onclick = e => {
				const b = e.target.closest("[data-c]"); if(!b || b.disabled) return;
				const k = b.dataset.c; S.used.add(k);
				const pts = k === j.best ? 2 : j.ok.includes(k) ? 1 : 0; score += pts; mood[i] = pts ? 1 : -1;
				const jr = jurors[i]; jr.g.position.y = .1 + (pts ? .12 : 0); later(400, () => jr.g.position.y = .1);
				if(pts === 2) play("good"); else if(pts === 1) play("chime"); else err();
				append(`${faces()}<p class="${pts ? "jj-ok" : "jj-ko"}">${pts === 2 ? "Le jury prend des notes, visiblement intéressé." : pts === 1 ? "Correct, mais une autre expérience répondait mieux." : "Le jury attendait autre chose : réponds à la question posée."}</p>
					${whisper(i === 0 ? "Un budget, des chiffres, un résultat : le jury adore les preuves concrètes." : i === 1 ? "L'échec, c'est la question piège. Ce qu'ils veulent entendre, c'est ce que tu as changé ensuite." : "Une école qui envoie tout le monde à l'étranger veut sentir que tu en es capable.")}
					<button class="jj-go" data-more>${i < JURY.length - 1 ? "Question suivante" : "Fin de l'entretien"}</button>`);
				card.querySelectorAll(".jj-cards button").forEach(x => x.disabled = true);
				card.querySelector("[data-more]").onclick = () => { play("pop"); i++; if(i < JURY.length) render(); else { S.oral = score; show(`<div class="jj-h">L'entretien de personnalité</div>${faces()}${stars(score >= 6 ? 3 : score >= 4 ? 2 : 1)}<p class="jj-p">On ne récite pas son CV : on choisit <b>l'expérience qui répond</b> à la question, et on en tire une leçon.</p>${course("oral")}${next("res", "18 h : les résultats →")}`); } };
			};
		};
		render();
	}

	/* ---------- 6 · le tableau des résultats ---------- */
	function res(){
		stage("res", "6 · Les résultats");
		W.fly(new THREE.Vector3(28, 7.8, 4), 25, 1.45, -Math.PI/2);
		const total = S.tage*2 + S.fr*2 + S.cg*2 + S.en*2 + S.oral*3, max = 10 + 8 + 10 + 6 + 18;
		const ast2 = total >= max*.72;
		const names = ["A. Benali", "C. Dubois", "M. Lefèvre", "TOI", "J. Martin", "S. Nguyen", "L. Petit", "R. Garcia", "E. Moreau", "K. Diallo"].sort();
		results.redraw((x, w, h) => {
			x.fillStyle = "#14161c"; x.fillRect(0, 0, w, h); x.fillStyle = "#c9a24a"; x.textAlign = "center"; x.font = "300 56px Tiempos Headline,Georgia,serif"; x.fillText("Liste des admis", w/2, 110);
			x.font = "700 30px Inter,system-ui,sans-serif"; x.fillStyle = "#e8d9b0"; x.fillText(ast2 ? "Admission sur titre · AST2" : "Admission sur titre · AST1", w/2, 160);
			names.forEach((n, i) => { const y = 260 + i*95; x.fillStyle = n === "TOI" ? "#c9a24a" : "rgba(255,255,255,.06)"; x.fillRect(80, y - 60, w - 160, 80); x.fillStyle = n === "TOI" ? "#14161c" : "#fff"; x.font = `${n === "TOI" ? 900 : 600} 44px Inter,system-ui,sans-serif`; x.textAlign = "left"; x.fillText(n === "TOI" ? "★ TOI" : n, 120, y); });
		});
		play("win");
		const s = S.stars, mention = s >= 13 ? "Très bien" : s >= 10 ? "Bien" : "Assez bien";
		ev("win", mention);
		show(`<div class="jj-k">${formation.name} · résultats</div><div class="jj-h">Admis${ast2 ? " en AST2" : " en AST1"} !</div>
			<div class="jj-stars">${s} / 15 ★ · ${mention}</div>
			<table class="jj-tbl"><tr><td>Logique</td><td>${S.tage} / 5</td></tr><tr><td>Français</td><td>${S.fr} / 4</td></tr><tr><td>Culture générale</td><td>${S.cg} / 5</td></tr><tr><td>Anglais</td><td>${S.en} / 3</td></tr><tr><td>Entretien</td><td>${S.oral} / 6</td></tr><tr><td>Total</td><td>${total} / ${max}</td></tr></table>
			<p class="jj-p">${ast2 ? "Ton score ouvre les portes de l'<b>AST2</b> : HEC, ESCP, emlyon, EDHEC… C'est l'objectif de la prépa 3, avec un semestre à l'étranger." : "Ton score ouvre les portes de l'<b>AST1</b> : Audencia, SKEMA, Grenoble EM, NEOMA, KEDGE… C'est l'objectif de la prépa 2. Et la prépa 3 vise l'AST2."} En parallèle, la licence : un diplôme assuré, quoi qu'il arrive aux concours.</p>
			${course("ast")}
			${jpoCard()}${openLead ? `<button class="jj-go" data-a="lead">📄 Recevoir la plaquette de la prépa</button>` : ""}
			<a class="jj-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa ↗</a>
			<button class="jj-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="jj-alt" data-a="replay">Rejouer</button>`);
	}

	const STEPS = { tage, fr, cg, en, oral, res };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ Object.assign(S, { stars:0, errors:0, learned:new Set(), tage:0, fr:0, cg:0, en:0, oral:0, used:new Set() }); clockT = 0; tage(); }
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		W.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".jj-x").addEventListener("click", close);

	W.place(new THREE.Vector3(0, 4, 0), 40, 1.1, .2);
	tage();      // ouverture à chaud : l'horloge tourne déjà
	ev("start");
	ev("missions", [["1 · Logique", tage], ["2 · Français", fr], ["3 · Culture générale", cg], ["4 · Anglais", en], ["5 · L'entretien", oral], ["6 · Résultats", res]]);
	if(window.campus) window.campus.game = { S, ...STEPS, W };
}
