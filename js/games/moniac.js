/* « La machine de l'économiste » — mini-jeu de la Prépa D2 Économie-Gestion (FGES, avec Marcq Institution, 2026).
   Dans un amphithéâtre boisé trône une machine hydraulique inspirée de la MONIAC (Bill Phillips, 1949) : de l'eau
   colorée y joue l'argent qui circule entre revenu, consommation, épargne et dépense publique.
   1 · macroéconomie : ouvrir la vanne de dépense publique juste ce qu'il faut ; le revenu monte par vagues
       successives (le multiplicateur), et la première intuition déborde (scène d'ouverture, une minute) ;
   2 · macroéconomie : les ménages épargnent davantage, le réservoir du revenu baisse : le paradoxe de l'épargne ;
   3 · microéconomie, en anglais : un tournoi de dilemme du prisonnier contre trois adversaires ;
   4 · statistique et économétrie : une corrélation trompeuse, et la variable cachée qui l'explique ;
   puis les débouchés : ENS Paris-Saclay, magistères, écoles.
   Modèles simplifiés ; contenu à relire par l'équipe de la prépa. */
import { stage3d, THREE } from "./stage3d.js?v=9db2c7b8a3";
import { makePerson } from "../kit.js?v=9db2c7b8a3";
import { jpoCard } from "./jpo.js?v=9db2c7b8a3";
import { palier } from "./palier.js?v=9db2c7b8a3";

const COURSES = {
	macro: ["Macroéconomie", "Revenu, consommation, multiplicateur : comment une dépense se propage dans toute l'économie."],
	keynes:["Histoire de la pensée économique", "Keynes, le paradoxe de l'épargne, et pourquoi la vertu d'un ménage peut devenir le problème d'un pays."],
	game:  ["Microeconomics · game theory (in English)", "Strategies, payoffs, cooperation: the maths of decisions that depend on others."],
	stats: ["Statistique et économétrie", "Corrélation n'est pas causalité : chercher la variable cachée avant de conclure."],
	conc:  ["Les concours", "La D2 prépare l'ENS Paris-Saclay (économie-gestion), les magistères d'économie et le Pré-Master de l'EDHEC, avec en parallèle la Licence internationale d'économie-gestion de la FGES."]
};
const STEPS_UI = [["mult", "1 · Multiplicateur"], ["epargne", "2 · Épargne"], ["game", "3 · Game theory"], ["stats", "4 · Corrélation"]];
const Y0 = 400, TARGET = 500;
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d });
// dilemme du prisonnier : [mon gain, son gain] selon (moi, lui)
const PAY = { CC:[3, 3], CD:[0, 5], DC:[5, 0], DD:[1, 1] };
const BOTS = [
	{ id:"defect", n:"Max", s:"always defects", play:() => "D" },
	{ id:"tft", n:"Rapoport", s:"copies your last move", play:h => h.length ? h[h.length - 1] : "C" },
	{ id:"nice", n:"Grace", s:"always cooperates", play:() => "C" }
];
// villes (fictives) : glaces vendues, noyades, température moyenne
const TOWNS = [[12, 2, 14], [18, 3, 17], [25, 4, 20], [30, 6, 23], [38, 7, 26], [44, 8, 28], [15, 3, 15], [34, 6, 24], [22, 4, 19], [41, 8, 27]];

const CSS = `
.mn{position:fixed;inset:0;z-index:40;background:#1a1410;font-family:Inter,system-ui,sans-serif;font-weight:300;color:#e9f7fa;overflow:hidden;animation:mnIn .4s ease both}
@keyframes mnIn{from{opacity:0}}
.mn canvas.mn-3d{position:absolute;inset:0;display:block;touch-action:none}
.mn-x{position:absolute;right:12px;top:10px;z-index:4;width:40px;height:40px;border-radius:50%;border:1px solid #e9f7fa;background:#0f3168;color:#fff;font-size:22px;cursor:pointer}
.mn-steps{position:absolute;left:12px;top:10px;z-index:3;display:flex;gap:5px;flex-wrap:wrap;max-width:calc(100% - 470px)}
.mn-steps span{font:700 12px Inter,system-ui,sans-serif;border:1px solid rgba(233,247,250,.35);border-radius:3px;padding:5px 9px;color:#7f98bd;background:rgba(15,49,104,.75)}
.mn-steps span.done{color:#9cf0c4}.mn-steps span.now{background:#e9f7fa;color:#0f3168}
.mn-bp{position:absolute;right:14px;top:58px;bottom:14px;width:396px;z-index:3;overflow:auto;box-sizing:border-box;padding:16px;border-radius:4px;scrollbar-width:thin;
	background-color:#0f3168;background-image:linear-gradient(rgba(233,247,250,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(233,247,250,.08) 1px,transparent 1px);background-size:22px 22px;border:2px solid #e9f7fa;box-shadow:0 20px 50px rgba(0,0,0,.5)}
.mn-k{font:300 11px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e9f7fa}
.mn-h{font:300 21px/1.2 Tiempos Headline,Georgia,serif;margin:3px 0 8px;color:#fff}
.mn-p{margin:0 0 9px;font-size:14px;line-height:1.5;color:#e9f7fa}
.mn-p b{color:#fff}
.mn-prof{border:1px dashed #e9f7fa;padding:7px 10px;margin:8px 0;font-size:13.5px;line-height:1.45}
.mn-prof small{display:block;font:300 10.5px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#21b7cb}
.mn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin:6px 0}
.mn-num{font:300 26px Tiempos Headline,Georgia,serif;font-variant-numeric:tabular-nums}
.mn-num small{display:block;font:700 10px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#e9f7fa}
.mn-range{width:100%;accent-color:#21b7cb;height:34px}
.mn-go{display:block;width:100%;border:0;border-radius:4px;padding:13px;margin-top:10px;background:#21b7cb;color:#0f3168;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}
.mn-go:disabled{opacity:.35}
.mn-alt{display:block;width:100%;border:1px solid #e9f7fa;border-radius:4px;padding:11px;margin-top:8px;background:transparent;color:#e9f7fa;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box}
.mn-log{font:300 12.5px/1.5 Inter,system-ui,sans-serif;color:#9cf0c4;background:rgba(0,0,0,.25);padding:7px 9px;margin:8px 0;min-height:20px;max-height:140px;overflow:auto}
.mn-ok{color:#9cf0c4;font-weight:800;font-size:13.5px;margin:6px 0}.mn-ko{color:#ff9a8a;font-weight:800;font-size:13.5px;margin:6px 0}
.mn-course{border:1px solid #21b7cb;border-radius:3px;padding:8px 10px;margin:8px 0;background:rgba(33,183,203,.06)}
.mn-course small{display:block;font:300 10px Inter,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#21b7cb}
.mn-course b{display:block;color:#fff}.mn-course span{font-size:13px;color:#e9f7fa}
.mn-stars{font-size:20px;letter-spacing:3px;color:#21b7cb}
.mn-cd{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
.mn-cd button{border:2px solid #e9f7fa;background:transparent;color:#fff;border-radius:6px;padding:12px;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}
.mn-cd button:hover{background:rgba(233,247,250,.15)}
.mn-mat{width:100%;border-collapse:collapse;font:300 13px Inter,system-ui,sans-serif;margin:6px 0;text-align:center}
.mn-mat td,.mn-mat th{border:1px solid rgba(233,247,250,.4);padding:5px}
.mn-mat th{color:#e9f7fa;font-weight:700}
.mn-opts{display:grid;gap:6px;margin:6px 0}
.mn-opts button{text-align:left;border:1px solid #e9f7fa;background:transparent;color:#e9f7fa;border-radius:4px;padding:9px 11px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}
.mn-opts button:hover{background:rgba(233,247,250,.12)}
.mn-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.mn-tbl td{padding:5px 3px;border-top:1px solid rgba(233,247,250,.25)}.mn-tbl td:last-child{text-align:right;font-weight:800;color:#fff}
@media (max-width:759px){
	.mn-bp{left:0;right:0;top:auto;bottom:0;width:auto;max-height:55%;border-radius:10px 10px 0 0}
	.mn-steps{display:none}
}`;

export function openMoniac({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	const play = n => audio && audio.play(n);
	const ev = (...a) => onEvent && onEvent(...a);
	if(!document.getElementById("mn-css")){ const st = document.createElement("style"); st.id = "mn-css"; st.textContent = CSS; document.head.appendChild(st); }
	const root = document.createElement("div"); root.className = "mn";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu La machine de l'économiste");
	root.innerHTML = `<canvas class="mn-3d" aria-hidden="true"></canvas>
		<div class="mn-steps">${STEPS_UI.map(([k, t]) => `<span data-s="${k}">${t}</span>`).join("")}</div>
		<button class="mn-x" aria-label="Quitter le jeu">×</button><div class="mn-bp"></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s), bp = $(".mn-bp");
	const S = { stars:0, errors:0, learned:new Set(), G:null, tries:0, score:0, played:{}, ans:null };
	let closed = false;
	const timers = new Set();
	const later = (ms, f) => { const t = setTimeout(() => { timers.delete(t); if(!closed) f(); }, ms); timers.add(t); return t; };

	/* ================= l'amphithéâtre et la machine ================= */
	const W = stage3d($("canvas"), { panel:bp, side:"right", panelW:412, bg:"#1a1410", fog:[40, 100], minD:5, maxD:90, maxPolar:1.45 });
	const { scene, M, G, mesh, box, cyl, label } = W;
	scene.add(new THREE.HemisphereLight("#ffe9c7", "#2a1a10", .55));
	const spot = new THREE.SpotLight("#fff1d6", 300, 50, .6, .5, 1.4); spot.position.set(0, 22, 12); spot.target.position.set(0, 6, -4); spot.castShadow = true; scene.add(spot, spot.target);
	const wood = W.canvasTex(256, 256, (x, w, h) => { x.fillStyle = "#5a3a22"; x.fillRect(0, 0, w, h); for(let i = 0; i < 40; i++){ x.strokeStyle = `rgba(${i % 2 ? "90,58,34" : "70,44,24"},.8)`; x.beginPath(); x.moveTo(0, i*6.4); x.bezierCurveTo(w*.3, i*6.4 + 4, w*.6, i*6.4 - 4, w, i*6.4 + 2); x.stroke(); } });
	wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(6, 4);
	mesh(G(new THREE.PlaneGeometry(60, 40)), M("#ffffff", { map:wood, roughness:.7 }), 0, 0, 0).rotation.x = -Math.PI/2;
	box(60, 18, .5, M("#ffffff", { map:wood }), 0, 0, -12);
	for(let r = 0; r < 4; r++) for(let i = -3; i <= 3; i++){ const a = i*.18, R = 14 + r*3; box(2.4, .9 + r*.6, 1.2, "#4a2e1a", Math.sin(a)*R, 0, Math.cos(a)*R - 2); }
	const title = label("MONIAC · Phillips, 1949", { size:.026, bg:"#0d2a4a", fg:"#ffd27a", font:"Inter, system-ui, sans-serif" }); title.position.set(0, 15.4, -10); scene.add(title);
	// la machine : un panneau de bois, des réservoirs de verre, des tuyaux, de l'eau
	const mach = new THREE.Group(); mach.position.set(0, 0, -9); scene.add(mach);
	box(16, 14, .5, "#7a4e2a", 0, .5, -.4, mach); box(16.6, .5, 2.2, "#4a2e1a", 0, 0, .4, mach);
	const glass = new THREE.MeshStandardMaterial({ color:"#d9ecff", transparent:true, opacity:.22, roughness:.05, side:THREE.DoubleSide });
	const waterM = new THREE.MeshStandardMaterial({ color:"#2f8cff", emissive:"#0d4a9a", emissiveIntensity:.35, transparent:true, opacity:.88 });
	function tank(name, x, y, w, h, start){
		const g = new THREE.Group(); g.position.set(x, y, .5); mach.add(g);
		mesh(G(new THREE.BoxGeometry(w, h, 1.2)), glass, 0, h/2, 0, g);
		const water = mesh(G(new THREE.BoxGeometry(w - .15, 1, 1.05)), waterM, 0, 0, 0, g);
		const l = label(name, { size:.022, bg:"#0d2a4a", fg:"#eaf2ff", font:"Inter, system-ui, sans-serif" }); l.center.set(.5, 0); l.position.set(0, h + .3, .6); g.add(l);      // ancrée par le bas : l'étiquette se pose sur le réservoir sans le masquer
		const T = { g, water, h, level:start, target:start, set(v){ T.target = v; } };
		return T;
	}
	const TK = {
		G:tank("Dépense publique", -5.5, 10, 2.4, 2.6, .2),
		Y:tank("Revenu national", 0, 5, 3.6, 5.4, .4),
		C:tank("Consommation", -5.5, 3, 2.4, 3.6, .55),
		S:tank("Épargne", 5.5, 3, 2.4, 3.6, .2),
		T:tank("Impôts", 5.5, 8.6, 2.4, 2.6, .25)
	};
	const pipeM = M("#c9a24a", { metalness:.7, roughness:.3 });
	const pipes = [
		[[-5.5, 10, 1.1], [-2.6, 10, 1.1], [-.8, 9.6, 1.1], [-.6, 10.4, 1.1]],
		[[0, 5, 1.1], [-2, 4.2, 1.1], [-4.3, 4.5, 1.1]],
		[[-5.5, 3, 1.1], [-3.4, 2.4, 1.1], [-1.2, 5.6, 1.1]],
		[[1.8, 5.4, 1.1], [3.6, 4.6, 1.1], [4.4, 5.6, 1.1]],
		[[1.8, 8.6, 1.1], [3.6, 9.4, 1.1], [4.4, 9.8, 1.1]]
	].map(pts => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); mesh(G(new THREE.TubeGeometry(c, 30, .12, 8, false)), pipeM, 0, 0, 0, mach); return c; });
	// des gouttes qui circulent dans les tuyaux quand la machine tourne
	const drops = [];
	for(let i = 0; i < 40; i++){ const d = mesh(G(new THREE.SphereGeometry(.09, 8, 6)), waterM, 0, 0, 0, mach); d.visible = false; drops.push({ d, pipe:i % pipes.length, t:Math.random() }); }
	let flowOn = 0;
	W.onFrame((now, dt) => {
		for(const T of Object.values(TK)){ T.level += (T.target - T.level)*Math.min(1, dt*1.8); const hh = Math.max(.02, Math.min(1, T.level))*(T.h - .2); T.water.scale.y = hh; T.water.position.y = .1 + hh/2; }
		for(const q of drops){ q.d.visible = flowOn > 0; if(!flowOn) continue; q.t = (q.t + dt*.5) % 1; q.d.position.copy(pipes[q.pipe].getPointAt(q.t)); }
		if(flowOn > 0) flowOn -= dt;
	});
	// la table du tournoi (théorie des jeux)
	const duel = new THREE.Group(); duel.position.set(14, 0, 2); scene.add(duel); duel.visible = false;
	box(4, .2, 2.4, "#3a2a1a", 0, 2.4, 0, duel); for(const [x, z] of [[-1.8, -1], [1.8, -1], [-1.8, 1], [1.8, 1]]) box(.15, 2.4, .15, "#2a1a10", x, 0, z, duel);
	const me = makePerson(duel, true, "student"); me.g.position.set(0, .1, 2.2); me.g.rotation.y = Math.PI;
	const bot = makePerson(duel, true, "pro"); bot.g.position.set(0, .1, -2.2);
	const botLabel = { l:label("?", { size:.024 }) }; botLabel.l.position.set(0, 4.4, -2.2); duel.add(botLabel.l);
	const coins = new THREE.Group(); coins.position.set(0, 2.5, 0); duel.add(coins);
	function setBot(name){ duel.remove(botLabel.l); botLabel.l = label(name, { size:.024, bg:"#0d2a4a", fg:"#fff" }); botLabel.l.position.set(0, 4.4, -2.2); duel.add(botLabel.l); }
	function chips(a, b){ coins.clear(); for(let i = 0; i < Math.min(a, 30); i++){ const c = new THREE.Mesh(G(new THREE.CylinderGeometry(.18, .18, .06, 14)), M("#ffd27a", { metalness:.6 })); c.position.set(-1.2 + (i % 5)*.38, .03 + Math.floor(i/5)*.07, .6); coins.add(c); } for(let i = 0; i < Math.min(b, 30); i++){ const c = new THREE.Mesh(G(new THREE.CylinderGeometry(.18, .18, .06, 14)), M("#9cc4ff", { metalness:.6 })); c.position.set(-1.2 + (i % 5)*.38, .03 + Math.floor(i/5)*.07, -.6); coins.add(c); } }
	// le tableau du nuage de points (corrélation)
	const plotTex = W.canvasTex(1024, 720, (x, w, h) => { x.fillStyle = "#0d2a4a"; x.fillRect(0, 0, w, h); });
	box(12.4, 8.8, .3, "#c9a24a", -16, 3.6, -11.4); mesh(G(new THREE.PlaneGeometry(12, 8.4)), new THREE.MeshBasicMaterial({ map:plotTex }), -16, 8, -11.2);
	function drawPlot(colorByTemp){
		plotTex.redraw((x, w, h) => {
			x.fillStyle = "#0d2a4a"; x.fillRect(0, 0, w, h);
			const P = (gl, nd) => [110 + (gl - 10)/36*(w - 180), h - 90 - nd/9*(h - 170)];
			x.strokeStyle = "#9cc4ff"; x.lineWidth = 4; x.beginPath(); x.moveTo(110, 60); x.lineTo(110, h - 90); x.lineTo(w - 50, h - 90); x.stroke();
			x.fillStyle = "#eaf2ff"; x.font = "700 30px Inter,system-ui,sans-serif"; x.fillText("Noyades", 20, 50); x.fillText("Glaces vendues (milliers)", w - 520, h - 30);
			for(const [gl, nd, t] of TOWNS){ const [X, Y] = P(gl, nd); x.fillStyle = colorByTemp ? `hsl(${220 - (t - 14)/14*220},90%,60%)` : "#ffd27a"; x.beginPath(); x.arc(X, Y, 16, 0, 7); x.fill(); }
			if(colorByTemp){ x.font = "700 26px Inter,system-ui,sans-serif"; x.fillStyle = "hsl(220,90%,65%)"; x.fillText("14 °C", w - 250, 50); x.fillStyle = "hsl(0,90%,60%)"; x.fillText("28 °C", w - 130, 50); }
		});
	}
	drawPlot(false);

	/* ================= l'interface ================= */
	let stepHooks = [];
	function stage(k, title){
		root.querySelectorAll(".mn-steps span").forEach(s => { const i = STEPS_UI.findIndex(x => x[0] === s.dataset.s), n = STEPS_UI.findIndex(x => x[0] === k); s.className = i < n ? "done" : i === n ? "now" : ""; });
		ev("stage", title); W.clearInput(); stepHooks.forEach(f => f()); stepHooks = [];
	}
	const prof = t => `<div class="mn-prof"><small>Pr. Laurent Okoye · amphi D2</small>${t}</div>`;
	function stars(n){ S.stars += n; return `<div class="mn-stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</div>`; }
	let stepErr = 0;
	function err(){ S.errors++; stepErr++; play("bad"); ev("err"); }
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="mn-course"><small>En prépa D2</small><b>${n}</b><span>${t}</span></div>`; }
	const show = html => { bp.innerHTML = html; bp.scrollTop = 0; };
	const append = html => { const el = bp.querySelector("[data-live]"); if(el){ el.insertAdjacentHTML("beforeend", html); bp.scrollTop = bp.scrollHeight; } };
	const next = (k, t) => `<button class="mn-go" data-next="${k}">${t}</button>`;
	bp.addEventListener("click", e => { const b = e.target.closest("[data-next]"); if(b){ play("pop"); STEPS[b.dataset.next](); } });
	const lvl = y => Math.min(1.05, y/900);      // hauteur d'eau du réservoir du revenu

	/* ---------- 1 · le multiplicateur (scène d'ouverture) ---------- */
	function mult(){
		stage("mult", "1 · Le multiplicateur"); stepErr = 0;
		W.fly(new THREE.Vector3(0, 7.5, -8.5), 34, 1.36, 0);
		const first = !S.multDone;
		TK.Y.set(lvl(Y0)); TK.G.set(.2); TK.C.set(.55); TK.S.set(.2); TK.T.set(.25);
		let g = 60, running = false;
		const render = () => {
			show(`${first ? `<div class="mn-k">Mini-jeu · ${formation.name}</div>` : `<div class="mn-k">Macroéconomie</div>`}<div class="mn-h">Relancer l'économie, sans la noyer</div>
				${prof(`${first ? "Bienvenue en D2. Cette machine, c'est l'économie : l'eau, c'est l'argent. " : ""}Le revenu national est à <b>${Y0}</b>. Le gouvernement veut <b>${TARGET}</b>. Les ménages consomment <b>75 %</b> de chaque euro reçu. Combien de dépense publique faut-il injecter ?`)}
				<input class="mn-range" type="range" min="5" max="120" step="5" value="${g}" aria-label="Dépense publique">
				<div class="mn-row"><div class="mn-num"><small>dépense publique</small><span data-g>${g}</span></div><div class="mn-num"><small>revenu national</small><span data-y>${Y0}</span></div></div>
				<button class="mn-go" data-open>Ouvrir la vanne</button><div class="mn-log" data-log></div><div data-live></div>`);
			bp.querySelector("input").oninput = e => { g = +e.target.value; bp.querySelector("[data-g]").textContent = g; TK.G.set(.2 + g/150); };
			bp.querySelector("[data-open]").onclick = () => { if(!running) run(); };
		};
		function run(){
			running = true; S.tries++; play("swipe"); bp.querySelector("[data-open]").disabled = true; bp.querySelector("input").disabled = true;
			let y = Y0, inj = g, k = 0; const log = bp.querySelector("[data-log]"); log.innerHTML = "";
			const step = () => {
				if(closed) return;
				y += inj; flowOn = 1.2; TK.Y.set(lvl(y)); TK.C.set(.55 + Math.min(.4, (y - Y0)/800)); TK.G.set(Math.max(.05, .2 + g/150 - k*.05));
				log.insertAdjacentHTML("beforeend", `Tour ${k + 1} : +${fr(inj, 1)} → revenu ${fr(y, 1)}<br>`); log.scrollTop = log.scrollHeight;
				bp.querySelector("[data-y]").textContent = fr(y);
				k++; inj *= .75;
				if(k < 7) later(520, step); else later(400, () => done(y + inj*4));
			};
			step();
		}
		function done(yEnd){
			running = false; TK.Y.set(lvl(yEnd)); bp.querySelector("[data-y]").textContent = fr(yEnd);
			if(Math.abs(yEnd - TARGET) > 6){
				err();
				append(`<p class="mn-ko">Revenu final : <b>${fr(yEnd)}</b>. ${yEnd > TARGET ? "Le réservoir déborde !" : "Pas assez."}</p>${prof(`Chaque euro dépensé devient le revenu de quelqu'un, qui en dépense 75 %, qui devient le revenu d'un autre… Au total, ×1 + 0,75 + 0,75² + … = <b>1 ÷ (1 − 0,75) = 4</b>. C'est le <b>multiplicateur</b>. Pour +100, il fallait donc…`)}<button class="mn-go" data-again>Réessayer</button>`);
				bp.querySelector("[data-again]").onclick = () => { TK.Y.set(lvl(Y0)); play("pop"); render(); };
				return;
			}
			S.G = g; play("good");
			append(`${stars(S.tries === 1 ? 3 : S.tries === 2 ? 2 : 1)}<p class="mn-ok">Revenu ${fr(yEnd)} : objectif atteint avec seulement ${g} de dépense.</p><p class="mn-p">25 de dépense publique créent 100 de revenu : le <b>multiplicateur keynésien</b> vaut 1 ÷ (1 − 0,75) = 4. En vrai, impôts et importations le réduisent, et toute la difficulté est de l'estimer.</p>${course("macro")}${first ? "" : next("epargne", "Suite : quand les ménages épargnent →")}`);
			S.multDone = true;
			if(first) later(2400, () => palier({ id:"moniac", onEvent, openLead, quit:close,
				titre:"Tu as trouvé le multiplicateur avec de l'eau. Keynes aurait aimé.",
				texte:"La suite : le paradoxe de l'épargne sur la même machine, un tournoi de théorie des jeux en anglais, et une corrélation qui ment.",
				suite:"Faire tourner toute la machine (≈ 6 min)" }).then(epargne));
		}
		TK.G.set(.2 + g/150);
		render();
	}

	/* ---------- 2 · le paradoxe de l'épargne ---------- */
	function epargne(){
		stage("epargne", "2 · Le paradoxe de l'épargne"); stepErr = 0;
		W.fly(new THREE.Vector3(1.5, 7, -8.5), 32, 1.35, .2);
		let s = 25; const I = 100;
		const Y = sv => I/(sv/100);            // à l'équilibre, l'épargne égale l'investissement : Y = I ÷ s
		const render = () => {
			const y = Y(s);
			TK.Y.set(lvl(y)); TK.S.set(.2 + s/100); TK.C.set(.35 + (100 - s)/200);
			show(`<div class="mn-k">Macroéconomie · Keynes</div><div class="mn-h">Et si tout le monde épargnait ?</div>
				${prof("Une crise fait peur : les ménages décident d'épargner davantage. <b>Tourne la vanne de l'épargne</b> et regarde le réservoir du revenu. Les entreprises, elles, investissent toujours 100.")}
				<input class="mn-range" type="range" min="20" max="50" step="5" value="${s}" aria-label="Taux d'épargne">
				<div class="mn-row"><div class="mn-num"><small>taux d'épargne</small>${s} %</div><div class="mn-num"><small>revenu</small>${fr(y)}</div><div class="mn-num"><small>épargne totale</small>${fr(y*s/100)}</div></div>
				<div data-live></div>${s >= 40 ? `<p class="mn-p"><b>Que devient l'épargne totale du pays ?</b></p><div class="mn-opts">${[["meme", "Elle ne bouge pas : le revenu a baissé d'autant"], ["plus", "Elle augmente, puisque chacun épargne plus"], ["zero", "Elle tombe à zéro"]].sort(() => Math.random() - .5).map(([k, t]) => `<button data-q="${k}">${t}</button>`).join("")}</div>` : ""}`);
			bp.querySelector("input").oninput = e => { s = +e.target.value; flowOn = .8; play("clic"); render(); };
			const q = bp.querySelector(".mn-opts"); if(q) q.onclick = e => {
				const b = e.target.closest("[data-q]"); if(!b) return;
				if(b.dataset.q !== "meme"){ err(); append(`<p class="mn-ko">Regarde les chiffres : l'épargne totale reste à ${fr(y*s/100)}.</p>`); return; }
				play("good"); q.style.pointerEvents = "none";
				append(`${stars(stepErr === 0 ? 3 : 2)}<p class="mn-ok">✓ Le paradoxe de l'épargne.</p><p class="mn-p">Ce qui est sage pour un ménage ne l'est pas forcément pour tous : si chacun consomme moins, les entreprises vendent moins, les revenus baissent… et l'épargne totale reste la même, avec un pays plus pauvre. Keynes l'a formalisé en 1936.</p>${course("keynes")}${next("game", "Next: a game theory tournament →")}`);
			};
		};
		render();
	}

	/* ---------- 3 · le tournoi (en anglais) ---------- */
	function game(){
		stage("game", "3 · Game theory"); stepErr = 0; duel.visible = true;
		W.fly(new THREE.Vector3(14, 3, 2), 13, 1.1, .5);
		let b = 0, round = 0, mine = 0, his = 0; const hist = [], hisHist = [], totals = [];
		const ROUNDS = 4;
		const start = () => { const B = BOTS[b]; setBot(`${B.n}`); round = 0; mine = 0; his = 0; hist.length = 0; hisHist.length = 0; chips(0, 0); render(); };
		const render = () => {
			const B = BOTS[b];
			show(`<div class="mn-k">Microeconomics · in English</div><div class="mn-h">The prisoner's dilemma tournament</div>
				${prof("Each round, you and your opponent secretly choose to <b>Cooperate</b> or <b>Defect</b>. Your goal: the most points over the whole tournament.")}
				<table class="mn-mat"><tr><th></th><th>He cooperates</th><th>He defects</th></tr><tr><th>You cooperate</th><td>3 · 3</td><td>0 · 5</td></tr><tr><th>You defect</th><td>5 · 0</td><td>1 · 1</td></tr></table>
				<p class="mn-p">Opponent ${b + 1} / 3: <b>${B.n}</b> · round ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} · you <b>${mine}</b>, him <b>${his}</b></p>
				<div class="mn-cd"><button data-m="C">🤝 Cooperate</button><button data-m="D">🗡️ Defect</button></div><div class="mn-log" data-log>${hist.map((m, i) => `R${i + 1}: you ${m} · ${B.n} ${hisHist[i]}`).join("<br>")}</div><div data-live></div>`);
			bp.querySelector(".mn-cd").onclick = e => {
				const x = e.target.closest("[data-m]"); if(!x || round >= ROUNDS) return;
				const m = x.dataset.m, o = B.play(hist); const [p, q] = PAY[m + o]; mine += p; his += q; hist.push(m); hisHist.push(o); round++; chips(mine, his); play(p >= 3 ? "coin" : "clic");
				if(round < ROUNDS) return render();
				totals.push([B.n, mine, his]); S.score += mine;
				render();
				append(`<p class="mn-ok">${B.n} ${B.s}. You: ${mine}, ${B.n}: ${his}.</p>${b < BOTS.length - 1 ? `<button class="mn-go" data-nx>Next opponent</button>` : ""}`);
				const nx = bp.querySelector("[data-nx]"); if(nx) nx.onclick = () => { b++; play("pop"); start(); }; else finish();
			};
		};
		function finish(){
			append(`<p class="mn-p">Total: <b>${S.score}</b> points (best possible: 38). In the 1980s, Robert Axelrod ran this tournament with real strategies sent by researchers. <b>Which one won?</b></p>
				<div class="mn-opts">${[["tft", "Tit for Tat: cooperate first, then copy the other"], ["defect", "Always defect"], ["random", "Play at random"]].sort(() => Math.random() - .5).map(([k, t]) => `<button data-a="${k}">${t}</button>`).join("")}</div>`);
			bp.querySelector("[data-live] .mn-opts").onclick = e => {
				const x = e.target.closest("[data-a]"); if(!x) return;
				if(x.dataset.a !== "tft"){ err(); append(`<p class="mn-ko">Not this one. Think of Rapoport, your second opponent…</p>`); return; }
				play("good"); bp.querySelector("[data-live] .mn-opts").style.pointerEvents = "none";
				append(`${stars(S.score >= 32 && stepErr === 0 ? 3 : S.score >= 24 ? 2 : 1)}<p class="mn-ok">✓ Tit for Tat, by Anatol Rapoport.</p><p class="mn-p">Nice (never defect first), retaliatory, forgiving, clear: that's how cooperation survives among self-interested players. The best move against Max was to defect; against Grace, defecting pays… but would you trust someone who exploits the kind?</p>${course("game")}${next("stats", "Suite : une corrélation trompeuse →")}`);
			};
		}
		start();
	}

	/* ---------- 4 · corrélation n'est pas causalité ---------- */
	function stats(){
		stage("stats", "4 · Corrélation"); stepErr = 0; duel.visible = false; drawPlot(false);
		W.fly(new THREE.Vector3(-16, 8, -11), 14, 1.45, .25);
		show(`<div class="mn-k">Statistique et économétrie</div><div class="mn-h">Les glaces font-elles se noyer ?</div>
			${prof("Dix villes. Plus on y vend de glaces, plus il y a de noyades : la corrélation est très forte. Un député propose d'<b>interdire les glaces</b> l'été. Avant de conclure, <b>colore les points selon la température</b>.")}
			<button class="mn-go" data-col>🌡️ Colorer selon la température</button><div data-live></div>`);
		bp.querySelector("[data-col]").onclick = () => {
			drawPlot(true); play("chime"); bp.querySelector("[data-col]").disabled = true;
			append(`<p class="mn-p">Les villes chaudes (en rouge) sont en haut à droite, les froides en bas à gauche. <b>Que conclus-tu ?</b></p><div class="mn-opts">${[["temp", "La chaleur fait vendre des glaces et fait se baigner : elle explique les deux"], ["glace", "Les glaces provoquent bien les noyades"], ["hasard", "C'est un pur hasard"]].sort(() => Math.random() - .5).map(([k, t]) => `<button data-a="${k}">${t}</button>`).join("")}</div>`);
			bp.querySelector("[data-live] .mn-opts").onclick = e => {
				const x = e.target.closest("[data-a]"); if(!x) return;
				if(x.dataset.a !== "temp"){ err(); append(`<p class="mn-ko">${x.dataset.a === "glace" ? "Rien ne montre que l'une cause l'autre : cherche ce qui varie avec les deux." : "Dix villes alignées ainsi, ce n'est pas le hasard."}</p>`); return; }
				play("good"); bp.querySelector("[data-live] .mn-opts").style.pointerEvents = "none";
				append(`${stars(stepErr === 0 ? 3 : 2)}<p class="mn-ok">✓ Une variable confondante : la température.</p><p class="mn-p">Corrélation n'est pas causalité. L'économètre cherche les variables cachées, compare ce qui est comparable, et ne conseille une politique qu'avec un vrai lien de cause à effet.</p>${course("stats")}${next("end", "Le bilan →")}`);
			};
		};
	}

	function end(){
		stage("stats", "Bilan"); duel.visible = false;
		W.fly(new THREE.Vector3(0, 7, -8), 36, 1.3, .15);
		flowOn = 3; TK.Y.set(lvl(TARGET)); play("win");
		const s = S.stars, mention = s >= 11 ? "Très bien" : s >= 8 ? "Bien" : "Assez bien";
		ev("win", mention);
		show(`<div class="mn-k">${formation.name} · bilan</div><div class="mn-h">La machine tourne rond</div>
			<div class="mn-stars">${s} / 12 ★ · ${mention}</div>
			<table class="mn-tbl"><tr><td>Dépense publique trouvée</td><td>${S.G ?? "—"}</td></tr><tr><td>Tournoi</td><td>${S.score} / 38 points</td></tr><tr><td>Erreurs</td><td>${S.errors}</td></tr></table>
			<p class="mn-p">Macroéconomie, histoire de la pensée, théorie des jeux en anglais, économétrie : c'est le cœur de la D2. Une prépa exigeante, à moitié en anglais, avec une licence en parallèle.</p>
			${course("conc")}
			${jpoCard()}${openLead ? `<button class="mn-go" data-x="lead">📄 Recevoir la plaquette de la prépa D2</button>` : ""}
			<a class="mn-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la prépa D2 ↗</a>
			<button class="mn-alt" data-x="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="mn-alt" data-x="replay">Rejouer</button>`);
	}

	const STEPS = { mult, epargne, game, stats, end };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-x]")?.dataset.x; if(!a) return;
		play("pop");
		if(a === "lead"){ close(); openLead(); }
		if(a === "fav"){ toggleFav(); e.target.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; }
		if(a === "replay"){ Object.assign(S, { stars:0, errors:0, learned:new Set(), G:null, tries:0, score:0, played:{}, ans:null }); mult(); }
	});
	function close(){
		if(closed) return; closed = true;
		timers.forEach(clearTimeout); timers.clear(); document.removeEventListener("keydown", onKey);
		W.dispose(); root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".mn-x").addEventListener("click", close);

	W.place(new THREE.Vector3(0, 6, -6), 30, 1.3, 0);
	mult();      // ouverture à chaud : la machine attend sa vanne
	ev("start");
	ev("missions", [["1 · Le multiplicateur", mult], ["2 · Le paradoxe de l'épargne", epargne], ["3 · Game theory", game], ["4 · Corrélation", stats], ["Bilan", end]]);
	if(window.campus) window.campus.game = { S, ...STEPS, W };
}
