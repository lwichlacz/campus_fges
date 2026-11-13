/* « La salle de TP » — mini-jeu de l'APES, année préparatoire aux études scientifiques (FGES, 2026).
   Le soir, une salle de travaux pratiques ; la porte est fermée par quatre cadenas. Chacun s'ouvre avec le résultat
   d'une vraie manipulation : un dosage goutte à goutte, un pendule chronométré, un microscope à régler, une courbe à
   redresser. À chaque fois, le premier essai bute (verser trop vite, mesurer une seule période, commencer au plus fort
   grossissement, tracer la mauvaise courbe), puis l'atelier de méthode montre comment faire : c'est le cœur de l'APES,
   apprendre à apprendre. La valeur de g, trouvée au pendule, se retrouve à la fin sur la courbe.
   Personnes fictives ; valeurs simplifiées. Contenu à relire par l'équipe de l'APES. */
import { stage3d, THREE } from "./stage3d.js?v=e7c881c81b";
import { jpoCard } from "./jpo.js?v=e7c881c81b";
import { palier } from "./palier.js?v=e7c881c81b";

const COURSES = {
	chimie: ["Chimie", "Dosages, concentrations, équivalence : la chimie des solutions, en TP comme en cours."],
	phys:   ["Physique", "Mesurer, estimer son incertitude, relier une mesure à une loi : la démarche du physicien."],
	svtu:   ["SVTU", "Sciences de la vie, de la Terre et de l'Univers : observer le vivant, du microscope à l'écosystème."],
	maths:  ["Mathématiques", "Fonctions, changements de variable, modèles : les outils qui transforment une mesure en loi."],
	metho:  ["Ateliers de méthodologie", "Organiser son travail, refaire autrement ce qui a raté, comprendre plutôt qu'apprendre par cœur."]
};
const LOCKS = [["chimie", "⚗️", "Chimie"], ["phys", "⏱️", "Physique"], ["svtu", "🔬", "SVTU"], ["maths", "📈", "Maths"]];
const VEQ = 12.4, CB = .10, VA = 20, L = .5, GRAV = 9.81, T0 = 2*Math.PI*Math.sqrt(L/GRAV);
const fr = (v, d = 1) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d });
const DROP = [[.2, .21], [.3, .43], [.4, .79], [.5, 1.21], [.6, 1.78]];       // chute d'une bille : t (s), d (m)
const SLIDES = [
	{ id:"elodee", n:"Feuille d'élodée", ans:"veg", why:"Des cellules rectangulaires, une paroi bien nette et des chloroplastes verts : une cellule végétale." },
	{ id:"joue", n:"Frottis de joue", ans:"ani", why:"Des cellules aplaties aux contours irréguliers, un noyau, et pas de paroi : des cellules animales (les tiennes !)." },
	{ id:"yaourt", n:"Goutte de yaourt", ans:"bac", why:"De minuscules bâtonnets, sans noyau : des bactéries, les lactobacilles qui font le yaourt." }
];

const CSS = `
.tp{position:fixed;inset:0;z-index:40;background:#141c2b;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#eef3ea;overflow:hidden;animation:tpIn .4s ease both}
@keyframes tpIn{from{opacity:0}}
.tp canvas.tp-3d{position:absolute;inset:0;display:block;touch-action:none}
.tp-x{position:absolute;right:12px;top:10px;z-index:4;width:40px;height:40px;border-radius:50%;border:2px solid #c9d8c2;background:#22382c;color:#fff;font-size:22px;cursor:pointer}
.tp-locks{position:absolute;left:12px;top:10px;z-index:3;display:flex;gap:6px}
.tp-locks span{display:flex;align-items:center;gap:5px;background:rgba(20,28,43,.82);border:1px solid rgba(238,243,234,.2);border-radius:999px;padding:6px 10px;font-size:12.5px;font-weight:800;color:#9aa5b1}
.tp-locks span.open{color:#9fe0a8;border-color:#9fe0a8}
.tp-locks span.now{color:#21b7cb;border-color:#21b7cb}
.tp-board{position:absolute;right:12px;top:60px;bottom:12px;width:400px;z-index:3;overflow:auto;box-sizing:border-box;padding:16px;border-radius:6px;scrollbar-width:thin;
	background:radial-gradient(ellipse at 30% 20%,#2f4a3b,#22382c 70%);border:10px solid #7a5a3a;box-shadow:inset 0 0 40px rgba(0,0,0,.45),0 18px 40px rgba(0,0,0,.5)}
.tp-chalk{font:300 22px/1.15 Inter,system-ui,sans-serif;color:#e9f7fa;margin:0 0 6px}
.tp-chalk small{display:block;font:700 10.5px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb;margin-bottom:2px}
.tp-k{font-size:10.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#21b7cb}
.tp-h{font:300 30px/1.05 Inter,system-ui,sans-serif;color:#fff;margin:2px 0 8px}
.tp-p{margin:0 0 8px;font-size:14px;line-height:1.5;color:#dfe7da}
.tp-p b{color:#fff}
.tp-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:6px 0}
.tp-num{font:300 26px Tiempos Headline,Georgia,serif;font-variant-numeric:tabular-nums}
.tp-num small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#a9c0a8}
.tp-btn{border:2px solid #e9f7fa;background:transparent;color:#e9f7fa;border-radius:12px;padding:11px 14px;font:700 14.5px Inter,system-ui,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none}
.tp-btn.on{background:#e9f7fa;color:#22382c}
.tp-btn:disabled{opacity:.35;cursor:default}
.tp-go{display:block;width:100%;border:0;border-radius:12px;padding:13px;margin-top:10px;background:#21b7cb;color:#22382c;font:700 15.5px Inter,system-ui,sans-serif;cursor:pointer}
.tp-go:disabled{opacity:.35}
.tp-alt{display:block;width:100%;border:2px solid rgba(233,247,250,.45);border-radius:12px;padding:11px;margin-top:8px;background:transparent;color:#e9f7fa;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.tp-note{border-left:3px solid #21b7cb;padding:4px 0 4px 10px;margin:8px 0;font:300 20px/1.15 Inter,system-ui,sans-serif;color:#e9f7fa}
.tp-ko{color:#ffb3a1;font-weight:800;font-size:13.5px;margin:6px 0}
.tp-ok{color:#9fe0a8;font-weight:800;font-size:13.5px;margin:6px 0}
.tp-course{border:2px dashed rgba(33,183,203,.6);border-radius:10px;padding:8px 10px;margin:8px 0}
.tp-course small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#21b7cb}
.tp-course b{display:block;font:300 22px Inter,system-ui,sans-serif;color:#fff}
.tp-course span{font-size:13px;color:#dfe7da}
.tp-stars{font-size:20px;letter-spacing:3px;color:#21b7cb}
.tp-view{display:block;margin:8px auto;border-radius:50%;box-shadow:0 0 0 8px #111,0 0 0 10px #555;background:#000;touch-action:none}
.tp-graph{display:block;width:100%;border-radius:8px;background:#1d3226;margin:8px 0}
.tp-range{width:100%;accent-color:#21b7cb;height:34px}
.tp-opts{display:grid;gap:6px;margin:6px 0}
.tp-opts button{text-align:left;border:2px solid rgba(233,247,250,.4);background:transparent;color:#e9f7fa;border-radius:10px;padding:9px 11px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
.tp-opts button:hover{border-color:#21b7cb}
.tp-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.tp-tbl td{padding:4px 3px;border-top:1px dashed rgba(233,247,250,.25)}.tp-tbl td:last-child{text-align:right;font-weight:800}
.tp-list{margin:6px 0;padding:0;list-style:none;display:grid;gap:3px}
.tp-list li{font-size:13.5px}
@media (max-width:759px){
	.tp-board{left:0;right:0;top:auto;bottom:0;width:auto;max-height:55%;border-width:8px 8px 0;border-radius:14px 14px 0 0}
	.tp-locks span b{display:none}
}`;

export function openTP({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("tp-css")){ const st = document.createElement("style"); st.id = "tp-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "tp";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La salle de TP");
	root.innerHTML = `<canvas class="tp-3d" aria-hidden="true"></canvas>
		<div class="tp-locks">${LOCKS.map(([k, ic, n]) => `<span data-l="${k}">${ic} <b>${n}</b> 🔒</span>`).join("")}</div>
		<button class="tp-x" aria-label="Quitter le jeu">×</button><div class="tp-board"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), board = $(".tp-board");
	const S = { stars:0, errors:0, learned:new Set(), open:new Set(), veq:null, g:null, slope:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= la salle ================= */
	const W = stage3d($("canvas"), { panel:board, side:"right", panelW:412, bg:"#141c2b", fog:[40, 90], minD:5, maxD:80, maxPolar:1.35 });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#cfd9ff", "#2a2320", .7));
	const lamp1 = new THREE.PointLight("#ffe2b0", 60, 30, 1.6); lamp1.position.set(-6, 9, 2); lamp1.castShadow = true; scene.add(lamp1);
	const lamp2 = new THREE.PointLight("#ffe2b0", 60, 30, 1.6); lamp2.position.set(6, 9, 2); scene.add(lamp2);
	// sol en carreaux, murs, fenêtre de nuit, néons
	const tiles = W.canvasTex(256, 256, (x, w, h) => { for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ x.fillStyle = (i + j) % 2 ? "#cfc9bb" : "#bdb6a6"; x.fillRect(i*32, j*32, 32, 32); } });
	tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(4, 3);
	mesh(G(new THREE.PlaneGeometry(36, 24)), M("#ffffff", { map:tiles, roughness:.6 }), 0, 0, 0).rotation.x = -Math.PI/2;
	box(36, 12, .4, "#3b4a63", 0, 0, -10);
	box(.4, 12, 24, "#34425a", -18, 0, 2); box(.4, 12, 24, "#34425a", 18, 0, 2);
	box(36, 1.2, .5, "#2a3446", 0, 0, -9.8);
	const night = W.canvasTex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b1430"); g.addColorStop(1, "#24305a"); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#fff"; for(let i = 0; i < 30; i++) x.fillRect(Math.random()*w, Math.random()*h*.7, 1.5, 1.5); x.fillStyle = "#f7e6b0"; x.beginPath(); x.arc(96, 28, 10, 0, 7); x.fill(); });
	mesh(G(new THREE.PlaneGeometry(6, 5)), new THREE.MeshBasicMaterial({ map:night }), 17.7, 7, -2).rotation.y = -Math.PI/2;
	box(.3, .2, 5.4, "#e8e8e8", 17.6, 4.4, -2); box(.3, 5.4, .2, "#e8e8e8", 17.6, 4.4, -2);
	// le tableau noir, où la courbe s'écrira
	const graphTex = W.canvasTex(1024, 640, (x, w, h) => { x.fillStyle = "#26402f"; x.fillRect(0, 0, w, h); });
	box(14.4, 7.4, .3, "#7a5a3a", -8, 3.4, -9.7);
	mesh(G(new THREE.PlaneGeometry(14, 7)), new THREE.MeshStandardMaterial({ map:graphTex, roughness:.95 }), -8, 7.1, -9.5);
	// la porte et ses quatre cadenas
	const door = new THREE.Group(); door.position.set(9.5, 0, -9.7); scene.add(door);
	const leaf = new THREE.Group(); leaf.position.set(-2.2, 0, 0); door.add(leaf);
	box(4.4, 8.4, .3, "#6b4a2e", 2.2, 0, 0, leaf);
	box(4.8, .4, .5, "#4a3420", 0, 8.4, 0, door); box(.3, 8.4, .5, "#4a3420", -2.35, 0, 0, door); box(.3, 8.4, .5, "#4a3420", 2.35, 0, 0, door);
	const padlocks = {};
	LOCKS.forEach(([k, ic], i) => {
		const g = new THREE.Group(); g.position.set(3.7, 5.6 - i*1.2, .3); leaf.add(g);
		const body = box(.7, .55, .25, "#c9a227", 0, -.3, 0, g); body.material = M("#c9a227", { metalness:.7, roughness:.3 });
		const shackle = mesh(G(new THREE.TorusGeometry(.22, .06, 8, 16, Math.PI)), M("#c0c4c8", { metalness:.8, roughness:.25 }), 0, .25, 0, g);
		const l = label(ic, { size:.022, bg:"#141c2b", fg:"#fff" }); l.position.set(-.7, 0, .1); g.add(l);
		padlocks[k] = { g, body, shackle };
	});
	const doorLabel = label("Sortie · 4 cadenas", { size:.026, bg:"#141c2b", fg:"#ffd57a" }); doorLabel.position.set(0, 9.2, .3); door.add(doorLabel);
	function openLock(k){
		S.open.add(k); const p = padlocks[k], t0 = performance.now();
		const off = W.onFrame(now => { const q = Math.min(1, (now - t0)/600); p.shackle.position.y = .25 + q*.35; p.body.material.emissive.set("#3ad06a").multiplyScalar(q*.5); if(q >= 1) off(); });
		root.querySelector(`[data-l="${k}"]`).className = "open"; root.querySelector(`[data-l="${k}"]`).innerHTML = `${LOCKS.find(l => l[0] === k)[1]} <b>${LOCKS.find(l => l[0] === k)[2]}</b> 🔓`;
		play("chime");
	}
	// les paillasses
	for(const x of [-7, 7]){ box(9, .3, 4, "#f2f0ea", x, 3.2, 2); box(8.6, 3.2, .2, "#3a3f48", x, 0, 3.8); for(const dx of [-4.2, 4.2]) box(.3, 3.2, 3.8, "#3a3f48", x + dx, 0, 2); }
	// burette, support, erlenmeyer (chimie)
	const chem = new THREE.Group(); chem.position.set(-8.5, 3.5, 2); scene.add(chem);
	cyl(.6, .6, .1, "#2a2f38", 0, 0, 0, chem); cyl(.05, .05, 6, "#9aa1aa", -.5, 0, 0, chem); box(.9, .08, .08, "#9aa1aa", -.1, 5.2, 0, chem);
	const glass = new THREE.MeshStandardMaterial({ color:"#cfe6ff", transparent:true, opacity:.42, roughness:.05, side:THREE.DoubleSide });
	mesh(G(new THREE.CylinderGeometry(.12, .12, 3.6, 16, 1, true)), glass, .35, 4.3, 0, chem);
	const buretteLiq = mesh(G(new THREE.CylinderGeometry(.1, .1, 1, 16)), M("#7fb8ff", { transparent:true, opacity:.85 }), .35, 4.3, 0, chem);
	mesh(G(new THREE.CylinderGeometry(.04, .02, .4, 8)), glass, .35, 2.3, 0, chem);
	const drop = mesh(G(new THREE.SphereGeometry(.05, 8, 6)), M("#cfe6ff"), .35, 2, 0, chem); drop.visible = false;
	mesh(G(new THREE.CylinderGeometry(.25, .75, 1.3, 24, 1, true)), glass, .35, .75, 0, chem);
	const erlenLiq = mesh(G(new THREE.CylinderGeometry(.48, .7, .5, 24)), new THREE.MeshStandardMaterial({ color:"#f4f4f4", transparent:true, opacity:.75, roughness:.2 }), .35, .35, 0, chem);
	// microscope (SVTU)
	const scope = new THREE.Group(); scope.position.set(-4, 3.5, 2.2); scene.add(scope);
	box(1.2, .2, 1.4, "#2a2f38", 0, 0, 0, scope); box(.3, 2.2, .3, "#2a2f38", 0, 0, -.5, scope); box(1, .1, .9, "#2a2f38", 0, .9, 0, scope);
	mesh(G(new THREE.CylinderGeometry(.18, .18, 1.6, 16)), M("#e8e8e8"), 0, 2.3, -.1, scope).rotation.x = -.35;
	const turret = mesh(G(new THREE.CylinderGeometry(.35, .35, .2, 16)), M("#9aa1aa", { metalness:.6 }), 0, 1.6, 0, scope);
	// pendule (physique)
	const pend = new THREE.Group(); pend.position.set(7, 3.5, 2); scene.add(pend);
	box(1.6, .15, 1, "#2a2f38", 0, 0, 0, pend); box(.12, 5.4, .12, "#9aa1aa", -.6, 0, 0, pend); box(1.6, .12, .12, "#9aa1aa", .2, 5.3, 0, pend);
	const arm = new THREE.Group(); arm.position.set(.6, 5.3, 0); pend.add(arm);
	mesh(G(new THREE.CylinderGeometry(.01, .01, 3.6, 4)), M("#dddddd"), 0, -1.8, 0, arm);
	mesh(G(new THREE.SphereGeometry(.28, 18, 14)), M("#c9a227", { metalness:.6, roughness:.3 }), 0, -3.7, 0, arm);
	let swing = null;      // instant de lâcher du pendule
	W.onFrame(now => { if(swing === null){ arm.rotation.z = 0; return; } const t = (now - swing)/1000; arm.rotation.z = .3*Math.cos(2*Math.PI*t/T0); });

	/* ================= l'interface ================= */
	function stage(k, title){
		root.querySelectorAll(".tp-locks span").forEach(s => { if(!S.open.has(s.dataset.l)) s.className = s.dataset.l === k ? "now" : ""; });
		ev("stage", title); W.clearInput(); stepHooks.forEach(f => f()); stepHooks = [];
	}
	let stepHooks = [];      // les animations d'une étape, arrêtées à la suivante
	const hook = f => stepHooks.push(W.onFrame(f));
	const chalk = t => `<p class="tp-chalk"><small>M. Diallo, atelier de méthode</small>${t}</p>`;
	function stars(n){ S.stars += n; return `<div class="tp-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	function err(){ S.errors++; play("bad"); ev("err"); }
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="tp-course"><small>À l'APES</small><b>${n}</b><span>${t}</span></div>`; }
	const show = html => { board.innerHTML = html; board.scrollTop = 0; };
	const append = html => { const el = board.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); board.scrollTop = board.scrollHeight; } };
	const next = (k, t) => `<button class="tp-go" data-next="${k}">${t}</button>`;
	board.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });
	// un bouton qu'on maintient (souris, doigt, barre d'espace)
	function holdButton(btn, on, off){
		const start = e => { e.preventDefault(); btn.classList.add("on"); on(); }, stop = () => { if(btn.classList.contains("on")){ btn.classList.remove("on"); off(); } };
		btn.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(n => btn.addEventListener(n, stop));
	}

	/* ---------- 1 · chimie : le dosage, goutte à goutte (scène d'ouverture) ---------- */
	function chimie(){
		stage("chimie", "1 · Chimie : le dosage");
		W.fly(new THREE.Vector3(-8.2, innerWidth < 760 ? 5.3 : 6.2, 2), innerWidth < 760 ? 15 : 13, 1.12, .2);      // téléphone : visée plus basse, l'erlenmeyer reste au-dessus du tableau
		const first = !S.chimDone;
		let V = 0, flow = 0, tries = 0, dropMode = false;
		const render = () => {
			show(`${first ? `<div class="tp-k">Mini-jeu · ${formation.name}</div>` : ""}<div class="tp-h">Premier cadenas : le dosage</div>
				${first ? `<p class="tp-p">Il est 19 h, la salle de TP est fermée à clé de l'intérieur. Quatre cadenas, quatre manipulations. <b>Tu as les mains, j'ai la méthode.</b></p>` : ""}
				<p class="tp-p">Dans l'erlenmeyer, 20 mL d'acide et quelques gouttes de phénolphtaléine. Verse la soude de la burette : à l'<b>équivalence</b>, la solution vire au <b>rose pâle</b>. Arrête-toi pile à ce moment.</p>
				<div class="tp-row"><div class="tp-num"><small>volume versé</small><span data-v>0,0 mL</span></div></div>
				<div class="tp-row"><button class="tp-btn" data-pour>Maintenir pour verser</button>${dropMode ? `<button class="tp-btn" data-drop>💧 Une goutte</button>` : ""}</div>
				<button class="tp-go" data-eq>C'est l'équivalence !</button><div data-live></div>`);
			holdButton(board.querySelector("[data-pour]"), () => { flow = 1.4; }, () => { flow = 0; });
			const db = board.querySelector("[data-drop]"); if(db) db.onclick = () => { V += .05; play("pop"); drip(); upd(); };
			board.querySelector("[data-eq]").onclick = judge;
			upd();
		};
		const colorOf = v => v < VEQ - .02 ? "#f4f4f4" : v <= VEQ + .3 ? "#f7b6d2" : "#d6168a";
		function upd(){
			const el = board.querySelector("[data-v]"); if(el) el.textContent = fr(V, 2).replace(/0$/, "") + " mL";
			erlenLiq.material.color.set(colorOf(V)); buretteLiq.scale.y = Math.max(.05, 3.4*(1 - V/25)); buretteLiq.position.y = 2.6 + buretteLiq.scale.y/2;
			erlenLiq.scale.y = 1 + V/20;
		}
		let dt0 = 0;
		function drip(){ drop.visible = true; drop.position.y = 2; dt0 = performance.now(); }
		hook((now, dt) => { if(flow > 0){ V += flow*dt; if(now - dt0 > 140) drip(); upd(); } if(drop.visible){ drop.position.y -= dt*8; if(drop.position.y < 1) drop.visible = false; } });
		function judge(){
			flow = 0; tries++;
			if(V < VEQ - .02){ err(); append(`<p class="tp-ko">Toujours incolore : l'acide n'est pas encore neutralisé. Continue.</p>`); return; }
			if(V > VEQ + .3){
				err(); play("bad");
				append(`<p class="tp-ko">Rose fuchsia : tu as dépassé l'équivalence (${fr(V, 2)} mL). On ne peut pas revenir en arrière.</p>${chalk("Méthode : un premier dosage <b>rapide</b> pour situer l'équivalence, puis on recommence : vite jusqu'à 11 mL, et <b>goutte à goutte</b> ensuite.")}<button class="tp-go" data-redo>Rincer et recommencer</button>`);
				board.querySelector("[data-redo]").onclick = () => { V = 0; dropMode = true; play("swipe"); render(); };
				return;
			}
			S.veq = Math.round(V*100)/100; play("good");
			const n = tries === 1 && !dropMode ? 3 : dropMode && tries <= 2 ? 3 : 2;
			const ca = CB*S.veq/VA;
			board.querySelector("[data-eq]").disabled = true;
			append(`${stars(n)}<p class="tp-ok">Rose pâle à ${fr(S.veq, 2)} mL : c'est l'équivalence.</p>
				<p class="tp-p">À l'équivalence, la soude a neutralisé tout l'acide : c<sub>acide</sub> = c<sub>soude</sub> × V<sub>éq</sub> ÷ V<sub>acide</sub> = 0,10 × ${fr(S.veq, 2)} ÷ 20 = <b>${fr(ca, 3)} mol/L</b>.</p>
				${dropMode ? course("metho") : ""}${course("chimie")}${first ? "" : next("phys", "Cadenas suivant : le pendule →")}`);
			openLock("chimie"); S.chimDone = true;
			if(first) later(2400, () => palier({ id:"tp", onEvent, openLead, quit:close,
				titre:"Premier cadenas ouvert. Ici, on apprend à rater, puis à réussir.",
				texte:"Trois cadenas encore : chronométrer un pendule pour trouver g, régler un microscope sans se perdre, redresser une courbe… et retrouver g à la fin.",
				suite:"Ouvrir les trois autres (≈ 6 min)" }).then(phys));
		}
		render();
	}

	/* ---------- 2 · physique : le pendule, une période puis dix ---------- */
	function phys(){
		stage("phys", "2 · Physique : le pendule");
		W.fly(new THREE.Vector3(7, 6, 2), 13, 1.1, -.2);
		swing = performance.now();
		let mode = 1, t0 = null, results = [];
		const render = () => {
			show(`<div class="tp-h">Deuxième cadenas : le pendule</div>
				<p class="tp-p">Un fil de <b>50 cm</b>, une bille. Sa période T donne g, l'intensité de la pesanteur : <b>g = 4π² L ÷ T²</b>. Le code du cadenas, c'est g.</p>
				<p class="tp-p">${mode === 1 ? "Mesure <b>une période</b> : Départ quand la bille passe tout à droite, Stop quand elle y revient." : "Cette fois, mesure <b>dix périodes</b> d'affilée, puis on divise par dix."}</p>
				<div class="tp-row"><div class="tp-num"><small>chronomètre</small><span data-c>0,00 s</span></div><div class="tp-num"><small>oscillations</small><span data-n>—</span></div></div>
				<div class="tp-row"><button class="tp-btn" data-go>Départ</button><button class="tp-btn" data-stop disabled>Stop</button></div><div data-live></div>`);
			board.querySelector("[data-go]").onclick = () => { t0 = performance.now(); play("clic"); board.querySelector("[data-go]").disabled = true; board.querySelector("[data-stop]").disabled = false; };
			board.querySelector("[data-stop]").onclick = stop;
		};
		hook(now => {
			if(t0 === null) return; const el = board.querySelector("[data-c]"); if(!el) return;
			const t = (now - t0)/1000; el.textContent = fr(t, 2) + " s"; board.querySelector("[data-n]").textContent = Math.floor(t/T0);
		});
		function stop(){
			const t = (performance.now() - t0)/1000; t0 = null; play("clic");
			const n = mode === 1 ? 1 : 10, T = t/n, g = 4*Math.PI**2*L/(T*T), e = Math.abs(g - GRAV)/GRAV;
			results.push({ mode, t, T, g });
			if(mode === 1){
				if(e > .5){ err(); append(`<p class="tp-ko">${fr(t, 2)} s pour une période ? Le pendule en met environ ${fr(T0, 2)}. Réessaie, ou passe à la méthode.</p>`); }
				else append(`<p class="tp-p">T = ${fr(T, 2)} s, donc g = <b>${fr(g, 2)} m/s²</b> : ${e < .05 ? "pas mal !" : `à ${Math.round(e*100)} % de la vraie valeur.`}</p>`);
				append(`${chalk(`Ton doigt réagit avec environ 0,1 s de retard au départ et à l'arrivée. Sur une période de 1,4 s, c'est énorme. Mesure <b>10 périodes</b> : la même erreur est divisée par 10.`)}<button class="tp-go" data-ten>Mesurer dix périodes</button>`);
				board.querySelector("[data-ten]").onclick = () => { mode = 10; play("pop"); render(); };
				return;
			}
			if(e > .08){ err(); append(`<p class="tp-ko">g = ${fr(g, 2)} m/s² : trop loin. Compte bien dix allers-retours complets, et recommence.</p>`); board.querySelector("[data-go]").disabled = false; board.querySelector("[data-stop]").disabled = true; return; }
			S.g = g; play("good"); const n2 = e < .02 ? 3 : 2;
			const one = results.find(r => r.mode === 1);
			append(`${stars(n2)}<p class="tp-ok">10 T = ${fr(t, 2)} s, T = ${fr(T, 3)} s, g = ${fr(g, 2)} m/s².</p>
				<p class="tp-p">${one ? `Avec une seule période, tu trouvais ${fr(one.g, 1)}. ` : ""}La valeur de référence est 9,81 m/s². Mesurer plus longtemps pour diviser son erreur : un réflexe qui servira toute ta vie de scientifique.</p>
				${course("phys")}${next("svtu", "Cadenas suivant : le microscope →")}`);
			openLock("phys");
		}
		render();
	}

	/* ---------- 3 · SVTU : le microscope, du plus faible au plus fort grossissement ---------- */
	function svtu(){
		stage("svtu", "3 · SVTU : le microscope");
		swing = null;
		W.fly(new THREE.Vector3(-4, 5, 2.2), 8, .95, .35);
		let si = 0, obj = 40, focus = 12, target = 0, prepared = false, fails = 0;
		const targets = { 4:52, 10:55, 40:58 };
		const render = () => {
			const s = SLIDES[si];
			show(`<div class="tp-h">Troisième cadenas : le microscope</div>
				<p class="tp-p">Trois lames : identifie chaque type de cellule. Lame ${si + 1} / 3 : <b>${s.n}</b>.</p>
				<canvas class="tp-view" width="240" height="240" aria-label="Ce que l'on voit au microscope"></canvas>
				<div class="tp-row">${[4, 10, 40].map(o => `<button class="tp-btn ${obj === o ? "on" : ""}" data-obj="${o}">×${o}</button>`).join("")}</div>
				<input class="tp-range" type="range" min="0" max="100" step="1" value="${focus}" aria-label="Vis de mise au point">
				<div class="tp-opts">${[["veg", "Cellule végétale"], ["ani", "Cellule animale"], ["bac", "Bactérie"]].map(([k, t]) => `<button data-id="${k}">${t}</button>`).join("")}</div>${fails ? chalk("Méthode : on commence <b>toujours au ×4</b>, on fait la mise au point, puis ×10, on refait le point, et seulement ensuite ×40.") : ""}<div data-live></div>`);
			board.querySelectorAll("[data-obj]").forEach(b => b.onclick = () => {
				const o = +b.dataset.obj, wasFocused = Math.abs(focus - targets[obj]) < 6;
				if(o === 40 && obj !== 10){ prepared = false; } else if(o === 40) prepared = wasFocused;
				obj = o; play("clic"); render();
			});
			board.querySelector("input").oninput = e => { focus = +e.target.value; draw(); };
			board.querySelector(".tp-opts").onclick = e => { const b = e.target.closest("[data-id]"); if(b) identify(b.dataset.id); };
			draw();
		};
		// la lame, vue à l'oculaire : plus le grossissement est fort, plus l'image est sombre et le champ étroit
		function draw(){
			const cv = board.querySelector(".tp-view"); if(!cv) return; const x = cv.getContext("2d"), s = SLIDES[si];
			const lost = obj === 40 && !prepared;
			const off = Math.abs(focus - targets[obj]) + (lost ? 30 : 0);
			const zoom = obj === 4 ? .35 : obj === 10 ? .7 : 1.6;
			x.save(); x.clearRect(0, 0, 240, 240); x.beginPath(); x.arc(120, 120, 120, 0, 7); x.clip();
			x.fillStyle = s.id === "elodee" ? "#e9f3d6" : s.id === "joue" ? "#efe6ee" : "#f2efe4"; x.fillRect(0, 0, 240, 240);
			x.filter = `blur(${Math.min(14, off/3)}px)`; x.translate(120, 120); x.scale(zoom, zoom); x.translate(-120, -120);
			const rnd = (() => { let a = si*99 + 7; return () => (a = (a*16807) % 2147483647)/2147483647; })();
			if(s.id === "elodee"){ for(let r = -2; r < 8; r++) for(let c = -2; c < 6; c++){ const X = c*58 + (r % 2)*20, Y = r*34; x.strokeStyle = "#3f6b2a"; x.lineWidth = 4; x.strokeRect(X, Y, 56, 32); x.fillStyle = "#4f9a3a"; for(let k = 0; k < 7; k++){ x.beginPath(); x.ellipse(X + 6 + rnd()*44, Y + 6 + rnd()*20, 4, 3, 0, 0, 7); x.fill(); } } }
			else if(s.id === "joue"){ for(let k = 0; k < 14; k++){ const X = rnd()*300 - 30, Y = rnd()*300 - 30; x.fillStyle = "rgba(200,170,200,.55)"; x.strokeStyle = "#9b7a9b"; x.lineWidth = 2; x.beginPath(); for(let a = 0; a < 7; a++){ const R = 30 + rnd()*14, an = a/7*Math.PI*2; a ? x.lineTo(X + Math.cos(an)*R, Y + Math.sin(an)*R) : x.moveTo(X + Math.cos(an)*R, Y + Math.sin(an)*R); } x.closePath(); x.fill(); x.stroke(); x.fillStyle = "#6b3f7a"; x.beginPath(); x.arc(X, Y, 5, 0, 7); x.fill(); } }
			else { x.strokeStyle = "#6b5a8a"; x.lineCap = "round"; x.lineWidth = 3; for(let k = 0; k < 160; k++){ const X = rnd()*260 - 10, Y = rnd()*260 - 10, a = rnd()*3; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a)*9, Y + Math.sin(a)*9); x.stroke(); } }
			x.restore();
			x.fillStyle = `rgba(0,0,0,${obj === 40 ? (lost ? .82 : .35) : obj === 10 ? .12 : 0})`; x.beginPath(); x.arc(120, 120, 120, 0, 7); x.fill();
		}
		function identify(id){
			const s = SLIDES[si], sharp = Math.abs(focus - targets[obj]) < 6 && (obj !== 40 || prepared);
			if(!sharp){
				fails++; err();
				if(fails === 1){ render(); append(`<p class="tp-ko">On ne distingue rien de net : impossible de conclure. Au ×40 d'emblée, on se perd sur la lame.</p>`); }
				else append(`<p class="tp-ko">Image floue : refais la mise au point avant d'identifier.</p>`);
				return;
			}
			if(obj === 4 && s.id === "yaourt"){ err(); append(`<p class="tp-ko">Au ×4, ces points sont trop petits pour savoir ce que c'est : monte en grossissement.</p>`); return; }
			if(id !== s.ans){ err(); append(`<p class="tp-ko">Regarde mieux : ${s.id === "elodee" ? "une paroi rigide et des grains verts ?" : s.id === "joue" ? "une paroi ? des chloroplastes ?" : "y a-t-il un noyau ?"}</p>`); return; }
			play("good"); append(`<p class="tp-ok">✓ ${s.why}</p>`);
			si++;
			if(si < SLIDES.length){ later(1200, () => { obj = 4; prepared = false; focus = 20; render(); }); return; }
			append(`${stars(fails <= 1 ? 3 : fails <= 3 ? 2 : 1)}${course("svtu")}${course("metho")}${next("maths", "Dernier cadenas : la courbe →")}`);
			openLock("svtu");
		}
		render();
	}

	/* ---------- 4 · maths : redresser la courbe, retrouver g ---------- */
	function maths(){
		stage("maths", "4 · Maths : la courbe");
		W.fly(new THREE.Vector3(-8, 7, -9), 16, 1.3, .32);
		let axis = "t", a = 2.5, tries = 0;
		const render = () => {
			show(`<div class="tp-h">Dernier cadenas : la courbe</div>
				<p class="tp-p">On a filmé la chute d'une bille : la distance parcourue <b>d</b> à cinq instants <b>t</b>. Trouve la loi : fais passer une <b>droite par l'origine</b> au plus près des points, puis valide.</p>
				<canvas class="tp-graph" width="640" height="380"></canvas>
				<div class="tp-row"><button class="tp-btn ${axis === "t" ? "on" : ""}" data-ax="t">d en fonction de t</button><button class="tp-btn ${axis === "t2" ? "on" : ""}" data-ax="t2" ${tries ? "" : "disabled"}>d en fonction de t²</button></div>
				<input class="tp-range" type="range" min="0.5" max="8" step="0.05" value="${a}" aria-label="Pente de la droite">
				<div class="tp-row"><div class="tp-num"><small>pente</small><span data-a>${fr(a, 2)}</span></div></div>
				<button class="tp-go" data-ok>Valider la droite</button><div data-live></div>`);
			board.querySelectorAll("[data-ax]").forEach(b => b.onclick = () => { if(b.disabled) return; axis = b.dataset.ax; play("clic"); render(); });
			board.querySelector("input").oninput = e => { a = +e.target.value; board.querySelector("[data-a]").textContent = fr(a, 2); draw(); };
			board.querySelector("[data-ok]").onclick = validate;
			draw();
		};
		function draw(){
			const cv = board.querySelector(".tp-graph"); if(!cv) return;
			const xs = DROP.map(([t]) => axis === "t" ? t : t*t), xmax = axis === "t" ? .7 : .4;
			const paint = (x, w, h) => {
				x.fillStyle = cv === null ? "#26402f" : "#1d3226"; x.fillRect(0, 0, w, h);
				const P = (vx, vy) => [60 + vx/xmax*(w - 90), h - 50 - vy/2*(h - 80)];
				x.strokeStyle = "rgba(244,241,228,.85)"; x.lineWidth = 3; x.beginPath(); x.moveTo(...P(0, 2)); x.lineTo(...P(0, 0)); x.lineTo(...P(xmax, 0)); x.stroke();
				x.fillStyle = "#f4f1e4"; x.font = `700 ${Math.round(w/22)}px Inter,system-ui,sans-serif`; x.fillText("d (m)", 10, 30); x.fillText(axis === "t" ? "t (s)" : "t² (s²)", w - 80, h - 12);
				x.strokeStyle = "#ffd57a"; x.lineWidth = 4; x.beginPath(); x.moveTo(...P(0, 0)); x.lineTo(...P(xmax, a*xmax)); x.stroke();
				x.fillStyle = "#9fe0a8"; DROP.forEach(([, d], i) => { const [X, Y] = P(xs[i], d); x.beginPath(); x.arc(X, Y, w/90, 0, 7); x.fill(); });
			};
			paint(cv.getContext("2d"), cv.width, cv.height);
			graphTex.redraw((x, w, h) => { x.fillStyle = "#26402f"; x.fillRect(0, 0, w, h); x.save(); x.scale(w/cv.width, h/cv.height); paint(x, cv.width, cv.height); x.restore(); });
		}
		const fitErr = () => { const xs = DROP.map(([t]) => axis === "t" ? t : t*t); return Math.sqrt(DROP.reduce((s, [, d], i) => s + (d - a*xs[i])**2, 0)/DROP.length); };
		function validate(){
			tries++;
			if(axis === "t"){
				err();
				append(`<p class="tp-ko">Écart moyen : ${fr(fitErr(), 2)} m. Les points dessinent une courbe : aucune droite ne passe par eux.</p>${chalk("Méthode : quand les points courbent, on <b>change de variable</b>. Pour une chute, essaie d en fonction de <b>t²</b>.")}`);
				board.querySelector('[data-ax="t2"]').disabled = false; return;
			}
			if(fitErr() > .05){ err(); append(`<p class="tp-ko">Les points sont alignés, mais ta droite passe à côté (écart ${fr(fitErr(), 2)} m). Ajuste la pente.</p>`); return; }
			S.slope = a; play("good");
			const g2 = 2*a;
			board.querySelector("[data-ok]").disabled = true;
			append(`${stars(tries <= 2 ? 3 : tries <= 4 ? 2 : 1)}<p class="tp-ok">d = ${fr(a, 2)} × t² : une droite parfaite.</p>
				<p class="tp-p">Or la chute libre suit d = ½ g t². Donc g = 2 × ${fr(a, 2)} = <b>${fr(g2, 1)} m/s²</b>. ${S.g ? `Au pendule, tu avais trouvé ${fr(S.g, 2)} : <b>deux expériences, une même loi</b>.` : ""}</p>
				${course("maths")}${next("end", "Ouvrir la porte")}`);
			openLock("maths");
		}
		render();
	}

	/* ---------- la porte s'ouvre : le bilan ---------- */
	function end(){
		stage("end", "Bilan"); swing = null;
		W.fly(new THREE.Vector3(8, 4.5, -8), 22, 1.2, -.35);
		const t0 = performance.now(), offD = W.onFrame(now => { const k = Math.min(1, (now - t0)/1400); leaf.rotation.y = -W.ease(k)*1.4; if(k >= 1) offD(); });
		play("win");
		const max = 12, s = S.stars, mention = s >= 11 ? "Très bien" : s >= 8 ? "Bien" : "Assez bien";
		ev("win", mention);
		show(`<div class="tp-k">${formation.name} · bilan</div><div class="tp-h">La porte s'ouvre !</div>
			<div class="tp-stars">${s} / ${max} ★ · ${mention}</div>
			<table class="tp-tbl"><tr><td>Équivalence du dosage</td><td>${S.veq ? fr(S.veq, 2) + " mL" : "—"}</td></tr><tr><td>g au pendule</td><td>${S.g ? fr(S.g, 2) + " m/s²" : "—"}</td></tr><tr><td>g sur la courbe</td><td>${S.slope ? fr(2*S.slope, 1) + " m/s²" : "—"}</td></tr><tr><td>Erreurs</td><td>${S.errors}</td></tr></table>
			<p class="tp-p">Quatre fois, le premier essai a buté, et quatre fois la méthode t'a fait réussir. C'est l'APES : une année pour prendre pied en sciences avant la licence, en <b>Sciences de la Vie</b> ou en <b>Maths-Physique-Chimie</b> (avec bases de données et programmation au second semestre). Petit effectif, suivi personnalisé, et ensuite la licence de ton choix : Sciences de la Vie, Sciences du Numérique, Management & Numérique, une prépa ingénieur ou PASS.</p>
			<ul class="tp-list">${[...S.learned].map(k => `<li>✓ ${COURSES[k][0]}</li>`).join("")}</ul>
			${jpoCard()}${openLead ? `<button class="tp-go" data-a="lead">📄 Recevoir la plaquette de l'APES</button>` : ""}
			<a class="tp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir l'APES ↗</a>
			<button class="tp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="tp-alt" data-a="replay">Rejouer</button>`);
	}

	const STEPS = { chimie, phys, svtu, maths, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]")?.dataset.a; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){
			Object.assign(S, { stars:0, errors:0, learned:new Set(), open:new Set(), veq:null, g:null, slope:null });
			leaf.rotation.y = 0; for(const [k, p] of Object.entries(padlocks)){ p.shackle.position.y = .25; p.body.material.emissive.set("#000"); }
			root.querySelectorAll(".tp-locks span").forEach(s => { s.className = ""; s.innerHTML = s.innerHTML.replace("🔓", "🔒"); });
			chimie();
		}
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		W.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".tp-x").addEventListener("click", close);

	W.place(new THREE.Vector3(0, 4, 0), 24, 1.1, 0);
	chimie();      // ouverture à chaud : la burette est déjà remplie
	ev("start");
	ev("missions", [["1 · Le dosage", chimie], ["2 · Le pendule", phys], ["3 · Le microscope", svtu], ["4 · La courbe", maths], ["Bilan", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, W };
}
