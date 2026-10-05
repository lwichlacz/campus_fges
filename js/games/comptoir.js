/* Mini-jeu « Le Comptoir » — Licence Gestion.
   Le joueur reprend le café de l'atrium pendant ses 3 années de licence.
   Chaque décision = une carte à glisser, et chaque carte révèle le cours qui va avec. */

const GAUGES = [
	{ k:"t", icon:"💰", name:"Trésorerie" },
	{ k:"c", icon:"☕", name:"Clients" },
	{ k:"e", icon:"🤝", name:"Équipe" },
	{ k:"r", icon:"🌱", name:"Réputation" }
];
const LOSE = {
	t:"La caisse est vide : Le Comptoir ne peut plus payer ses fournisseurs.",
	c:"Plus personne ne passe commander… les tasses restent sur l'étagère.",
	e:"Ton équipe a démissionné. Difficile de servir 300 cafés tout seul !",
	r:"Le bouche-à-oreille est terrible : le Comptoir a mauvaise réputation."
};

const ACTS = [
	{ year:"L1", title:"Première année", sub:"Stage de 4 semaines au Comptoir", cards:[
		{ who:"🧑‍🍳", name:"Inès, l'ancienne gérante", text:"Le café ne fait aucune pub. On lance une carte de fidélité, ou on baisse tous les prix de 10 % ?",
			a:{ label:"Carte de fidélité", d:{ c:10, t:-5 } }, b:{ label:"Baisser les prix", d:{ c:12, t:-18 } },
			course:"Marketing", tip:"Fidéliser un client coûte souvent bien moins cher que d'en conquérir un nouveau. Baisser les prix, c'est la solution la plus chère." },
		{ who:"📒", name:"Marc, le comptable", text:"Tes tickets de caisse s'entassent dans une boîte à chaussures depuis septembre…",
			a:{ label:"Faire la compta chaque semaine", d:{ t:8, e:-5 } }, b:{ label:"On verra en fin d'année", d:{ t:-16, r:-4 } },
			course:"Comptabilité financière", tip:"Enregistrer chaque opération au fil de l'eau, c'est savoir à tout moment si l'entreprise gagne ou perd de l'argent." },
		{ who:"👩‍🎓", name:"Léa, candidate barista", text:"Je peux travailler 10 h par semaine à côté de mes cours. Mais je veux un vrai contrat.",
			a:{ label:"Contrat étudiant en règle", d:{ e:12, t:-6 } }, b:{ label:"La payer « au black »", d:{ e:-10, r:-18, t:6 } },
			course:"Gestion des ressources humaines & droit", tip:"Un contrat clair protège l'employé et l'employeur. Le travail non déclaré expose à de lourdes sanctions." },
		{ who:"📊", name:"Ton prof de statistiques", text:"Tu as regardé tes ventes heure par heure ? Il y a peut-être une surprise…",
			a:{ label:"Analyser les données", d:{ c:10, e:6 } }, b:{ label:"Pas le temps", d:{ c:-8 } },
			course:"Statistiques", tip:"Les données révèlent un rush à 10 h, entre deux cours : il faut deux baristas à ce moment-là, pas à 15 h." }
	]},
	{ year:"L2", title:"Deuxième année", sub:"Stage de 4 semaines : tu pilotes les coûts", cards:[
		{ who:"🥐", name:"Le fournisseur de viennoiseries", text:"Je te fais −20 % si tu prends 200 croissants par jour. Marché conclu ?",
			a:{ label:"Négocier 100 à −10 %", d:{ t:10, r:4 } }, b:{ label:"Accepter les 200", d:{ t:-10, r:-12 } },
			course:"Achat & négociation", tip:"Une remise n'est une bonne affaire que si tu vends tout. Sinon, c'est du gaspillage… et de l'argent jeté." },
		{ who:"🧮", name:"Ton tableau de coûts", text:"Ton cappuccino te coûte 1,40 € à produire. Tu le vends 1,50 €.",
			a:{ label:"Passer à 2,20 €", d:{ t:16, c:-5 } }, b:{ label:"Garder le prix", d:{ t:-12, c:5 } },
			course:"Gestion des coûts", tip:"Le coût de revient inclut le lait, le café, mais aussi le temps de travail et la machine. 10 centimes de marge ne couvrent rien." },
		{ who:"📦", name:"Sam, le livreur", text:"Rupture de lait d'avoine un lundi sur deux. Les clients râlent.",
			a:{ label:"Créer un stock de sécurité", d:{ c:10, t:-5 } }, b:{ label:"Commander au jour le jour", d:{ c:-10, t:4 } },
			course:"Logistique", tip:"Le stock de sécurité absorbe les imprévus. Bien dimensionné, il évite les ruptures sans immobiliser trop d'argent." },
		{ who:"🎲", name:"Ton équipe du jeu d'entreprise", text:"On a monté un budget prévisionnel pour le Comptoir. On s'y tient ?",
			a:{ label:"Suivre le budget chaque mois", d:{ t:12, e:4 } }, b:{ label:"Improviser", d:{ t:-12 } },
			course:"Contrôle budgétaire", tip:"Comparer chaque mois le réel au budget permet de corriger le tir avant qu'il ne soit trop tard." }
	]},
	{ year:"L3", title:"Troisième année", sub:"Stage de 6 semaines : tu fais grandir le Comptoir", cards:[
		{ who:"🚲", name:"Un client de Wenov", text:"Et si vous livriez nos bureaux ? Il vous faudrait un vélo cargo à 3 000 €.",
			a:{ label:"Calculer la rentabilité, puis investir", d:{ t:-8, c:14, r:6 } }, b:{ label:"Refuser", d:{ c:-6 } },
			course:"Décision d'investissement", tip:"Un investissement se juge sur les gains futurs qu'il rapporte : ici, 40 livraisons par semaine le remboursent en quelques mois." },
		{ who:"💻", name:"Une start-up du campus", text:"On vous propose un site de click & collect, prêt en deux semaines.",
			a:{ label:"Lancer le click & collect", d:{ c:10, t:-5 } }, b:{ label:"Rester 100 % comptoir", d:{ c:-6 } },
			course:"E-commerce", tip:"Commander en ligne pendant le cours, récupérer entre deux salles : le numérique crée de nouvelles ventes." },
		{ who:"🧾", name:"L'expert-comptable", text:"Attention : sur place ou à emporter, la TVA n'est pas toujours la même.",
			a:{ label:"Appliquer le bon taux", d:{ t:8 } }, b:{ label:"Tout au même taux", d:{ t:-20, r:-6 } },
			course:"Fiscalité", tip:"Les taux de TVA dépendent du produit et de la façon de le consommer. Une erreur peut coûter un redressement fiscal." },
		{ who:"💡", name:"Ton équipe", text:"Après le rush des partiels, tout le monde est épuisé…",
			a:{ label:"Prime et planning participatif", d:{ e:16, t:-8 } }, b:{ label:"Ne rien changer", d:{ e:-16 } },
			course:"Management & motivation", tip:"Reconnaissance, autonomie, équité : une équipe motivée sert mieux et reste plus longtemps." }
	]}
];

const CSS = `
.cg{position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:12px;background:rgba(43,26,20,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:cgIn .35s ease both;font-family:Nunito,system-ui,sans-serif;color:#2b2233}
@keyframes cgIn{from{opacity:0}to{opacity:1}}
.cg-box{position:relative;width:100%;max-width:440px;max-height:100%;overflow:auto;background:#fff8ec;border-radius:28px;box-shadow:0 30px 80px rgba(40,20,10,.4);padding:18px 18px 20px}
.cg-x{position:absolute;top:12px;right:12px;width:38px;height:38px;border:0;border-radius:50%;background:#f6ead6;font-size:22px;cursor:pointer}
.cg-kick{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a2b4e}
.cg-h{font:700 24px/1.15 Fraunces,Georgia,serif;margin:4px 40px 4px 0}
.cg-sub{color:#6b5f6a;font-size:14px;margin:0 0 12px}
.cg-gauges{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0 14px}
.cg-g{background:#fff;border:1px solid #ead9bf;border-radius:16px;padding:8px 6px 7px;text-align:center;position:relative}
.cg-g b{display:block;font-size:20px;line-height:1}
.cg-g small{display:block;font-size:10.5px;font-weight:800;color:#8a7d86;margin-top:3px}
.cg-bar{height:7px;border-radius:9px;background:#f1e4cf;margin-top:6px;overflow:hidden}
.cg-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#d9a441,#8a2b4e);transition:width .6s cubic-bezier(.2,.8,.2,1)}
.cg-g.low .cg-bar i{background:#c4532f}
.cg-g .dot{position:absolute;top:-5px;right:-3px;width:12px;height:12px;border-radius:50%;background:#2b2233;transform:scale(0);transition:transform .15s ease}
.cg-g .dot.on{transform:scale(1)} .cg-g .dot.big{width:16px;height:16px;top:-7px;right:-5px}
.cg-g.pulse{animation:cgPulse .5s ease}
@keyframes cgPulse{50%{transform:scale(1.08)}}
.cg-stage{position:relative;height:290px;margin-bottom:12px}
.cg-card{position:absolute;inset:0;background:#fff;border:1px solid #ead9bf;border-radius:24px;padding:18px 18px 16px;box-shadow:0 10px 26px rgba(60,35,20,.12);touch-action:none;user-select:none;cursor:grab;display:flex;flex-direction:column;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .35s ease}
.cg-card.drag{transition:none;cursor:grabbing}
.cg-who{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.cg-av{width:56px;height:56px;border-radius:50%;background:#f6ead6;display:grid;place-items:center;font-size:30px;flex:none}
.cg-name{font-weight:800;font-size:14px;color:#8a7d86}
.cg-text{font:600 19px/1.35 Fraunces,Georgia,serif;margin:0;flex:1}
.cg-hint{position:absolute;top:14px;padding:6px 12px;border-radius:12px;font-weight:800;font-size:13px;color:#fff;opacity:0;transition:opacity .1s}
.cg-hint.l{left:14px;background:#2f6f8f} .cg-hint.r{right:14px;background:#8a2b4e}
.cg-swipe{font-size:12px;color:#8a7d86;font-weight:700;text-align:center;margin-top:8px}
.cg-ch{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cg-b{border:0;border-radius:16px;padding:13px 10px;font:800 14px Nunito,sans-serif;cursor:pointer;transition:transform .12s ease}
.cg-b:hover{transform:translateY(-2px)}
.cg-b.l{background:#e3eff4;color:#1f4f66} .cg-b.r{background:#f7e1e8;color:#6d1f3c}
.cg-main{display:block;width:100%;border:0;border-radius:16px;padding:14px;background:#8a2b4e;color:#fff;font:800 15px Nunito,sans-serif;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px}
.cg-alt{display:block;width:100%;border:2px solid #ead9bf;border-radius:16px;padding:12px;background:#fff;color:#1e305e;font:800 14px Nunito,sans-serif;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px}
.cg-lesson{background:#fff;border:1px solid #ead9bf;border-radius:22px;padding:18px;animation:cgPop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes cgPop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.cg-tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:4px 10px;margin-bottom:8px}
.cg-lesson h4{font:700 19px/1.2 Fraunces,Georgia,serif;margin:0 0 6px}
.cg-lesson p{margin:0;color:#5b4f5f;font-size:14.5px}
.cg-list{list-style:none;padding:0;margin:10px 0 4px;display:grid;gap:6px}
.cg-list li{background:#fff;border:1px solid #ead9bf;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
.cg-list li span{color:#8a2b4e;font-weight:800;margin-right:6px}
.cg-big{font-size:54px;text-align:center;margin:6px 0}
.cg-steps{display:flex;gap:6px;margin:0 0 10px}
.cg-steps i{flex:1;height:5px;border-radius:5px;background:#ead9bf}
.cg-steps i.on{background:#d9a441}
@media (max-height:700px){.cg-stage{height:250px}.cg-text{font-size:17px}}
`;

export function openComptoir({ formation, audio, isFav, toggleFav, onClose, onEvent }){
	if(!document.getElementById("cg-css")){ const s = document.createElement("style"); s.id = "cg-css"; s.textContent = CSS; document.head.appendChild(s); }
	const root = document.createElement("div"); root.className = "cg"; root.setAttribute("role","dialog"); root.setAttribute("aria-modal","true");
	root.innerHTML = `<div class="cg-box"><button class="cg-x" aria-label="Fermer">×</button><div class="cg-body"></div></div>`;
	document.body.appendChild(root);
	const body = root.querySelector(".cg-body");
	const play = n => audio && audio.play(n);
	let G, act, idx, learned, startT, busy = false;

	const close = () => { document.removeEventListener("keydown", onKey); root.remove(); onClose && onClose(); };
	root.querySelector(".cg-x").addEventListener("click", close);
	root.addEventListener("click", e => { if(e.target === root) close(); });
	let keyHandler = null;
	function onKey(e){ if(e.key === "Escape") close(); else if(keyHandler) keyHandler(e); }
	document.addEventListener("keydown", onKey);

	function gaugesHTML(){
		return `<div class="cg-gauges">${GAUGES.map(g => `<div class="cg-g ${G[g.k] < 25 ? "low" : ""}" data-g="${g.k}"><span class="dot"></span><b>${g.icon}</b><div class="cg-bar"><i style="width:${G[g.k]}%"></i></div><small>${g.name}</small></div>`).join("")}</div>`;
	}
	function stepsHTML(){ return `<div class="cg-steps">${ACTS[act].cards.map((_,i) => `<i class="${i < idx ? "on" : ""}"></i>`).join("")}</div>`; }

	function intro(){
		keyHandler = null;
		body.innerHTML = `
			<div class="cg-kick">Mini-jeu · ${formation.name}</div>
			<h2 class="cg-h">Le Comptoir</h2>
			<div class="cg-big">☕</div>
			<p class="cg-sub">Tu reprends le petit café de l'atrium pendant tes trois années de licence. Chaque décision fait bouger quatre jauges : si l'une tombe à zéro, le Comptoir ferme. Tiens bon jusqu'au diplôme !</p>
			<ul class="cg-list">${GAUGES.map(g => `<li><span>${g.icon}</span>${g.name}</li>`).join("")}</ul>
			<button class="cg-main" data-go>Ouvrir le Comptoir</button>`;
		body.querySelector("[data-go]").addEventListener("click", () => { play("pop"); start(); });
	}
	function start(){
		G = { t:50, c:50, e:50, r:50 }; act = 0; idx = 0; learned = []; startT = Date.now();
		onEvent && onEvent("start");
		actCard();
	}
	function actCard(){
		const A = ACTS[act];
		keyHandler = e => { if(e.key === "Enter") card(); };
		body.innerHTML = `
			<div class="cg-kick">${A.year} · ${A.title}</div>
			<h2 class="cg-h">${A.sub}</h2>
			${gaugesHTML()}
			<div class="cg-big">${["🌱","🌿","🌳"][act]}</div>
			<p class="cg-sub" style="text-align:center">Glisse les cartes à gauche ou à droite, ou touche un bouton.</p>
			<button class="cg-main" data-go>C'est parti</button>`;
		body.querySelector("[data-go]").addEventListener("click", () => { play("pop"); card(); });
	}
	function card(){
		busy = false;
		const A = ACTS[act], C = A.cards[idx];
		body.innerHTML = `
			<div class="cg-kick">${A.year} · carte ${idx+1}/${A.cards.length}</div>
			${stepsHTML()}
			${gaugesHTML()}
			<div class="cg-stage"><div class="cg-card" tabindex="0">
				<span class="cg-hint l">${C.a.label}</span><span class="cg-hint r">${C.b.label}</span>
				<div class="cg-who"><div class="cg-av">${C.who}</div><div class="cg-name">${C.name}</div></div>
				<p class="cg-text">${C.text}</p>
				<div class="cg-swipe">← glisse →</div>
			</div></div>
			<div class="cg-ch"><button class="cg-b l" data-c="a">← ${C.a.label}</button><button class="cg-b r" data-c="b">${C.b.label} →</button></div>`;
		const el = body.querySelector(".cg-card"), hl = el.querySelector(".cg-hint.l"), hr = el.querySelector(".cg-hint.r");
		const preview = side => {
			const d = side ? C[side].d : {};
			body.querySelectorAll(".cg-g").forEach(g => {
				const v = Math.abs(d[g.dataset.g] || 0), dot = g.querySelector(".dot");
				dot.classList.toggle("on", v > 0); dot.classList.toggle("big", v >= 12);
			});
		};
		body.querySelectorAll("[data-c]").forEach(b => {
			b.addEventListener("mouseenter", () => preview(b.dataset.c));
			b.addEventListener("mouseleave", () => preview(null));
			b.addEventListener("click", () => choose(b.dataset.c, el));
		});
		keyHandler = e => { if(e.key === "ArrowLeft") choose("a", el); if(e.key === "ArrowRight") choose("b", el); };
		let x0 = null, dx = 0;
		el.addEventListener("pointerdown", e => { x0 = e.clientX; dx = 0; el.classList.add("drag"); el.setPointerCapture(e.pointerId); });
		el.addEventListener("pointermove", e => {
			if(x0 === null) return;
			dx = e.clientX - x0;
			el.style.transform = `translateX(${dx}px) rotate(${dx/18}deg)`;
			const k = Math.min(1, Math.abs(dx)/90);
			hl.style.opacity = dx < 0 ? k : 0; hr.style.opacity = dx > 0 ? k : 0;
			preview(Math.abs(dx) > 30 ? (dx < 0 ? "a" : "b") : null);
		});
		const end = () => {
			if(x0 === null) return;
			x0 = null; el.classList.remove("drag");
			if(Math.abs(dx) > 90) choose(dx < 0 ? "a" : "b", el);
			else { el.style.transform = ""; hl.style.opacity = hr.style.opacity = 0; preview(null); }
		};
		el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
	}
	function choose(side, el){
		if(busy) return; busy = true;
		const A = ACTS[act], C = A.cards[idx], ch = C[side];
		keyHandler = null;
		play("swipe");
		el.style.transform = `translateX(${side === "a" ? -480 : 480}px) rotate(${side === "a" ? -24 : 24}deg)`;
		el.style.opacity = 0;
		let sum = 0;
		for(const [k,v] of Object.entries(ch.d)){ G[k] = Math.max(0, Math.min(100, G[k] + v)); sum += v; }
		body.querySelectorAll(".cg-g").forEach(g => {
			const k = g.dataset.g;
			g.querySelector(".cg-bar i").style.width = G[k] + "%";
			g.classList.toggle("low", G[k] < 25);
			g.querySelector(".dot").classList.remove("on");
			if(ch.d[k]){ g.classList.remove("pulse"); void g.offsetWidth; g.classList.add("pulse"); }
		});
		learned.push({ year:A.year, course:C.course });
		setTimeout(() => {
			const dead = GAUGES.find(g => G[g.k] <= 0);
			if(dead) return lose(dead.k);
			play(sum >= 0 ? "good" : "bad");
			lesson(C, ch);
		}, 420);
	}
	function lesson(C, ch){
		const A = ACTS[act];
		keyHandler = e => { if(e.key === "Enter" || e.key === "ArrowRight") next(); };
		body.innerHTML = `
			<div class="cg-kick">${A.year} · carte ${idx+1}/${A.cards.length}</div>
			${stepsHTML()}
			${gaugesHTML()}
			<div class="cg-lesson">
				<span class="cg-tag">📚 En Licence Gestion · ${A.year}</span>
				<h4>${C.course}</h4>
				<p><b>Ton choix : ${ch.label}.</b> ${C.tip}</p>
			</div>
			<button class="cg-main" data-go>Suivant →</button>`;
		body.querySelector("[data-go]").addEventListener("click", next);
	}
	function next(){
		idx++;
		if(idx < ACTS[act].cards.length) return card();
		play("stamp");
		onEvent && onEvent("act", act + 2);
		const A = ACTS[act];
		act++; idx = 0;
		if(act >= ACTS.length) return win();
		keyHandler = e => { if(e.key === "Enter") actCard(); };
		body.innerHTML = `
			<div class="cg-kick">${A.year} validée ✓</div>
			<h2 class="cg-h">Stage réussi !</h2>
			${gaugesHTML()}
			<p class="cg-sub">Cette année, tu as utilisé :</p>
			<ul class="cg-list">${A.cards.map(c => `<li><span>${A.year}</span>${c.course}</li>`).join("")}</ul>
			<button class="cg-main" data-go>Passer en ${ACTS[act].year} →</button>`;
		body.querySelector("[data-go]").addEventListener("click", () => { play("pop"); actCard(); });
	}
	function lose(k){
		play("bad");
		onEvent && onEvent("lose");
		keyHandler = e => { if(e.key === "Enter") start(); };
		body.innerHTML = `
			<div class="cg-kick">${ACTS[act].year} · aïe</div>
			<h2 class="cg-h">Le Comptoir ferme ses portes…</h2>
			${gaugesHTML()}
			<div class="cg-big">🥲</div>
			<p class="cg-sub" style="text-align:center">${LOSE[k]}<br>Pas de panique : c'est exactement ce qu'on apprend à éviter en Licence Gestion.</p>
			<button class="cg-main" data-go>Retenter ma chance</button>
			<a class="cg-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Gestion</a>`;
		body.querySelector("[data-go]").addEventListener("click", () => { play("pop"); start(); });
	}
	function win(){
		play("win");
		const avg = (G.t + G.c + G.e + G.r)/4;
		const mention = avg >= 70 ? "Très bien" : avg >= 58 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", Math.round(avg));
		keyHandler = null;
		const fav = isFav();
		body.innerHTML = `
			<div class="cg-kick">Licence Gestion · diplôme</div>
			<h2 class="cg-h">Diplômé·e, mention ${mention} !</h2>
			${gaugesHTML()}
			<div class="cg-big">🎓</div>
			<p class="cg-sub">En trois ans au Comptoir, tu as touché à ${learned.length} cours de la Licence Gestion :</p>
			<ul class="cg-list">${learned.map(l => `<li><span>${l.year}</span>${l.course}</li>`).join("")}</ul>
			<a class="cg-main" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Gestion</a>
			<button class="cg-alt" data-fav>${fav ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="cg-alt" data-go>Rejouer</button>`;
		body.querySelector("[data-go]").addEventListener("click", () => { play("pop"); start(); });
		const fb = body.querySelector("[data-fav]");
		fb.addEventListener("click", () => { toggleFav(); fb.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; play("pop"); });
	}
	intro();
}
