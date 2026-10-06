/* « L'Enquête de l'auditeur » — mini-jeu de la Licence Comptabilité-Finance-Audit (ISEA).
   La trésorerie d'une PME fictive fond sans raison : le joueur enquête avec les outils de chaque année.
   - L1 · comptabilité financière : trier les pièces (charge, produit, investissement), calculer une TVA ;
   - L1 · rapprochement bancaire : relier le relevé et les factures, isoler le virement sans justificatif ;
   - L2 · contrôle de gestion : écart budget / réel sur le trimestre ;
   - L3 · audit : tamponner les pièces, relier les indices, rendre ses conclusions avec déontologie.
   Entreprise, personnes et sociétés sont fictives. Contenu à relire par un enseignant de la licence. */

const COURSES = {
	compta: ["L1", "Comptabilité financière", "Classer chaque opération : une charge, un produit, ou un investissement qui s'amortit sur plusieurs années."],
	fisca:  ["L1", "Fiscalité", "TVA collectée, TVA déductible, hors taxe et toutes taxes comprises : le quotidien d'un comptable."],
	banque: ["L1", "Rapprochement bancaire", "Chaque mouvement du compte doit correspondre à une pièce justificative. Sinon, on cherche pourquoi."],
	cdg:    ["L2", "Contrôle de gestion", "Comparer le budget au réel, analyser les écarts et alerter la direction à temps."],
	audit:  ["L3", "Audit et expertise comptable (en alternance)", "Vérifier les comptes d'une entreprise, collecter des preuves et rendre une opinion indépendante."]
};
const euro = v => v.toLocaleString("fr-FR", { minimumFractionDigits:2, maximumFractionDigits:2 }) + " €";
const euro0 = v => v.toLocaleString("fr-FR") + " €";

const CSS = `
.au{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#2b2233;overflow:auto;animation:auIn .35s ease both;
	background:radial-gradient(ellipse at 50% 20%,rgba(255,236,200,.18),transparent 60%),repeating-linear-gradient(90deg,#6e4a32 0 46px,#694630 46px 92px),#6e4a32}
@keyframes auIn{from{opacity:0}to{opacity:1}}
.au-top{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;background:linear-gradient(#4a3020ee,#4a302000)}
.au-chip{background:rgba(255,250,240,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(20,10,5,.3)}
.au-stage{background:#1e305e;color:#fff}
.au-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,250,240,.95);font-size:22px;cursor:pointer}
.au-wrap{max-width:560px;margin:0 auto;padding:4px 12px 40px}
.au-card{background:#fffdf6;border-radius:6px;box-shadow:0 18px 40px rgba(20,10,5,.45);padding:20px 18px 18px;position:relative;animation:auUp .35s cubic-bezier(.2,.8,.2,1) both}
.au-card:before{content:"";position:absolute;inset:0;border-radius:6px;background:repeating-linear-gradient(transparent 0 27px,rgba(30,48,94,.05) 27px 28px);pointer-events:none}
@keyframes auUp{from{opacity:0;transform:translateY(14px) rotate(-.6deg)}to{opacity:1;transform:none}}
.au-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a2b4e}
.au-h{font:700 23px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px}
.au-p{margin:0 0 12px;color:#4f4a55;font-size:14.5px;position:relative}
.au-conf{display:inline-block;border:2px solid #b91c1c;color:#b91c1c;font:800 11px Nunito,sans-serif;letter-spacing:.14em;padding:3px 8px;transform:rotate(-3deg);margin-bottom:8px}
.au-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:#1e305e;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:12px;position:relative;text-align:center;text-decoration:none}
.au-alt{display:block;width:100%;border:2px solid #d8d0c0;border-radius:12px;padding:12px;background:#fff;color:#1e305e;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none;position:relative}
.au-msg{min-height:20px;font-size:13.5px;font-weight:700;color:#4f4a55;margin:6px 0;position:relative}
.au-msg.ko{color:#b91c1c}.au-msg.ok{color:#2f6b45}
.au-doc{position:relative;background:#fff;border:1px solid #e3dccd;border-radius:4px;padding:10px 12px;margin:8px 0;box-shadow:0 3px 8px rgba(40,25,10,.12);font-size:13.5px}
.au-doc:nth-child(odd){transform:rotate(-.5deg)}.au-doc:nth-child(even){transform:rotate(.4deg)}
.au-doc .hd{display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#7a6f63}
.au-doc .tt{font:700 16px Fraunces,Georgia,serif;margin:3px 0}
.au-doc .ln{display:flex;justify-content:space-between;gap:8px;border-top:1px dashed #e3dccd;padding-top:4px;margin-top:4px}
.au-doc .ln b{white-space:nowrap}
.au-doc small{color:#7a6f63}
.au-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.au-acts button,.au-opt{border:2px solid #d8d0c0;background:#fff;border-radius:10px;padding:8px 10px;font:800 13.5px Nunito,sans-serif;cursor:pointer;color:#2b2233}
.au-acts button:hover,.au-opt:hover{border-color:#1e305e}
.au-opts{display:grid;gap:7px;position:relative}
.au-opt{text-align:left;padding:11px 12px;font-size:14.5px}
.au-opt.ok,.au-acts button.ok{border-color:#3d7a55;background:#eef8f0}
.au-opt.ko,.au-acts button.ko{border-color:#c4532f;background:#fdeceb}
.au-stamp{position:absolute;right:10px;top:8px;font:800 15px Nunito,sans-serif;letter-spacing:.1em;padding:4px 9px;border:3px solid;border-radius:6px;transform:rotate(-12deg);animation:auStamp .25s cubic-bezier(.2,1.6,.4,1) both;background:rgba(255,255,255,.7)}
.au-stamp.ok{color:#2f6b45}.au-stamp.ko{color:#b91c1c}
@keyframes auStamp{from{transform:rotate(-12deg) scale(2.2);opacity:0}to{transform:rotate(-12deg) scale(1);opacity:1}}
.au-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative}
.au-cols h4{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a6f63}
.au-item{display:block;width:100%;text-align:left;border:2px solid #e3dccd;background:#fff;border-radius:8px;padding:7px 8px;margin-bottom:6px;font:700 12.5px/1.25 Nunito,sans-serif;cursor:pointer;color:#2b2233}
.au-item b{display:block;font-size:14px}
.au-item .n,.au-item b{white-space:nowrap}
.au-item b{white-space:normal}
.au-item[aria-pressed=true]{border-color:#1e305e;box-shadow:0 0 0 3px rgba(30,48,94,.18)}
.au-item.done{border-color:#3d7a55;background:#eef8f0;cursor:default}
.au-item.sus{border-color:#b91c1c;background:#fdeceb}
.au-tbl{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0;position:relative}
.au-tbl th{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#7a6f63;text-align:right;padding:4px}
.au-tbl th:first-child,.au-tbl td:first-child{text-align:left}
.au-tbl td{padding:8px 4px;border-top:1px solid #e3dccd;text-align:right}
.au-tbl tr.pick{cursor:pointer}
.au-tbl tr.pick:hover td{background:#f6f1e6}
.au-tbl tr.ok td{background:#fdeceb;font-weight:800}
.au-tbl tr.ko td{background:#fff3e0}
.au-board{position:relative;background:#c9a77a;border-radius:8px;padding:12px;box-shadow:inset 0 0 0 6px #8a6a44}
.au-board svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.au-pins{display:grid;grid-template-columns:1fr 1fr;gap:10px;position:relative}
.au-pin{position:relative;background:#fffdf6;border:0;border-radius:3px;padding:12px 8px 8px;font:700 12.5px/1.3 Nunito,sans-serif;text-align:left;cursor:pointer;box-shadow:0 4px 10px rgba(30,15,5,.3);color:#2b2233}
.au-pin:before{content:"";position:absolute;top:-5px;left:50%;width:12px;height:12px;border-radius:50%;background:#c4362f;transform:translateX(-50%);box-shadow:0 2px 3px rgba(0,0,0,.4)}
.au-pin b{display:block;font:700 14px Fraunces,Georgia,serif;margin-bottom:3px}
.au-pin[aria-pressed=true]{box-shadow:0 0 0 3px #1e305e,0 4px 10px rgba(30,15,5,.3)}
.au-pin.hit{box-shadow:0 0 0 3px #b91c1c,0 4px 10px rgba(30,15,5,.3)}
.au-course{background:#fff;border:2px solid #d9a441;border-radius:10px;padding:12px 14px;margin:10px 0 4px;position:relative}
.au-course .tag{display:inline-block;background:#fbefd0;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.au-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.au-course span{font-size:14px;color:#4f4a55}
.au-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px;position:relative}
.au-list li{background:#fff;border:1px solid #e3dccd;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.au-list li span{color:#8a2b4e;font-weight:800;margin-right:6px}
.au-big{font-size:46px;text-align:center;position:relative}
@media (max-width:440px){ .au-cols{gap:6px} .au-item{font-size:11px;padding:6px} .au-item b{font-size:12.5px} .au-h{font-size:20px} .au-wrap{padding:4px 8px 40px} .au-card{padding:16px 12px 14px} }
`;

export function openAudit({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("au-css")){ const st = document.createElement("style"); st.id = "au-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "au"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu L'Enquête de l'auditeur");
	root.innerHTML = `<div class="au-top"><span class="au-chip au-stage" id="auStage">Enquête</span><span class="au-chip" id="auErr">🔎 0 erreur</span><button class="au-x" aria-label="Quitter le jeu">×</button></div>
		<div class="au-wrap"><div class="au-card"></div></div>`;
	document.body.appendChild(root);
	const card = root.querySelector(".au-card");
	const S = { errors:0, learned:new Set(), found:0 };
	let closed = false;
	const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
	function show(html, keep){
		card.innerHTML = html;
		if(keep) return;                     // mise à jour sur place (ex. tampon) : ni animation ni retour en haut
		card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; root.scrollTo({ top:0, behavior:"smooth" });
	}
	function stage(t){ root.querySelector("#auStage").textContent = t; }
	function err(){ S.errors++; play("bad"); root.querySelector("#auErr").textContent = `🔎 ${S.errors} erreur${S.errors > 1 ? "s" : ""}`; }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="au-course"><span class="tag">📚 En Licence Comptabilité-Finance-Audit · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	function qcm(el, opts, good, onOk){
		el.innerHTML = `<div class="au-opts">${opts.map(([v, t]) => `<button class="au-opt" data-q="${v}">${t}</button>`).join("")}</div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".au-opt.ok")) return;
			if(b.dataset.q !== String(good)){ err(); b.classList.add("ko"); return; }
			b.classList.add("ok"); play("good"); onOk(el.querySelector("[data-after]"));
		}));
	}

	/* ---------- intro ---------- */
	function intro(){
		stage("Enquête");
		show(`<span class="au-conf">DOSSIER CONFIDENTIEL</span><div class="au-k">Mini-jeu · ${formation.name}</div><h2 class="au-h">L'Enquête de l'auditeur</h2>
			<div class="au-big">🕵️📁</div>
			<p class="au-p"><b>La Fabrique à Gaufres</b> (entreprise fictive), 12 salariés à Lille. Sa gérante, Mme Garnier, ne comprend pas : les ventes sont bonnes, mais la trésorerie fond. Elle fait appel à ton cabinet. Tu es <b>auditeur en alternance</b> : à toi de trouver où part l'argent.</p>
			<ul class="au-list"><li><span>L1</span>Trier les pièces, calculer la TVA, rapprocher la banque</li><li><span>L2</span>Analyser les écarts du budget</li><li><span>L3</span>Mener l'audit et confondre le coupable</li></ul>
			<button class="au-go" data-a="sort">Ouvrir le dossier</button>`);
	}

	/* ---------- L1 · trier les pièces ---------- */
	function sortDocs(){
		stage("L1 · Comptabilité");
		const docs = shuffle([
			{ t:"Moulins du Nord", d:"Facture · 600 kg de farine", m:820, k:"charge", why:"La farine est consommée pour produire : c'est une charge." },
			{ t:"Hôtel Bellevue", d:"Facture de vente · 48 coffrets de gaufres", m:1150, k:"produit", why:"Une vente à un client : c'est un produit." },
			{ t:"Fours Pro Équipement", d:"Facture · four à gaufres professionnel", m:6400, k:"invest", why:"Le four servira des années : c'est une immobilisation, amortie sur sa durée d'utilisation, pas une charge d'un coup." },
			{ t:"Énergie Hauts-de-France", d:"Facture · électricité du trimestre", m:1260, k:"charge", why:"L'électricité est consommée : c'est une charge." },
			{ t:"Caisse de la boutique", d:"Ticket Z · ventes du samedi", m:2380, k:"produit", why:"Les ventes en boutique sont des produits." },
			{ t:"Garage du Port", d:"Facture · camionnette de livraison", m:18000, k:"invest", why:"Un véhicule utilisé plusieurs années : c'est une immobilisation." }
		]);
		let i = 0;
		const render = msg => {
			const d = docs[i];
			show(`<div class="au-k">L1 · comptabilité financière · pièce ${i + 1}/${docs.length}</div><h2 class="au-h">Trier les pièces</h2>
				<p class="au-p">Avant d'enquêter, il faut des comptes propres. Pour chaque pièce : est-ce une <b>charge</b>, un <b>produit</b> ou un <b>investissement</b> ?</p>
				<div class="au-doc"><div class="hd"><span>${d.k === "produit" ? "Pièce de vente" : "Pièce d'achat"}</span><span>HT</span></div><div class="tt">${d.t}</div><small>${d.d}</small><div class="ln"><span>Montant</span><b>${euro(d.m)}</b></div></div>
				<div class="au-acts"><button data-k="charge">📉 Charge</button><button data-k="produit">📈 Produit</button><button data-k="invest">🏭 Investissement</button></div>
				<div class="au-msg ${msg ? msg.c : ""}">${msg ? msg.t : ""}</div><div data-next></div>`);
		};
		render();
		card.onclick = e => {
			const b = e.target.closest("[data-k]"); if(!b || card.querySelector("[data-next] button")) return;
			const d = docs[i];
			if(b.dataset.k !== d.k){ err(); b.classList.add("ko"); const m = card.querySelector(".au-msg"); m.className = "au-msg ko"; m.textContent = d.k === "invest" ? "Indice : ce bien va servir plusieurs années…" : "Pas tout à fait : regarde ce que représente cette pièce."; return; }
			b.classList.add("ok"); play("pop");
			const m = card.querySelector(".au-msg"); m.className = "au-msg ok"; m.textContent = "✓ " + d.why;
			card.querySelector("[data-next]").innerHTML = `<button class="au-go" data-a="${i < docs.length - 1 ? "sort-next" : "tva"}">${i < docs.length - 1 ? "Pièce suivante →" : "Calculer la TVA →"}</button>`;
		};
		sortNext = () => { i++; render(); };
	}
	let sortNext = () => {};
	function tva(){
		card.onclick = null;
		show(`<div class="au-k">L1 · fiscalité</div><h2 class="au-h">Et la TVA ?</h2>
			<p class="au-p">La facture d'emballages fait <b>400 € hors taxe</b>, avec une TVA à <b>20 %</b>. Combien l'entreprise paie-t-elle au total (TTC) ?</p>
			<div class="au-doc"><div class="hd"><span>Pièce d'achat</span><span>n° E-2207</span></div><div class="tt">Cartonnages de Flandre</div><small>1 000 boîtes à gaufres</small><div class="ln"><span>Total HT</span><b>400,00 €</b></div><div class="ln"><span>TVA 20 %</span><b>?</b></div><div class="ln"><span>Total TTC</span><b>?</b></div></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), shuffle([["480", "480 €"], ["420", "420 €"], ["320", "320 €"]]), "480", a => {
			a.innerHTML = `<p class="au-p" style="margin-top:8px">400 × 20 % = 80 € de TVA, soit <b>480 € TTC</b>. Ces 80 € ne sont pas une charge : l'entreprise les récupère auprès de l'État (TVA déductible).</p>${course("compta")}${course("fisca")}<button class="au-go" data-a="bank">Passer au relevé bancaire →</button>`;
		});
	}

	/* ---------- L1 · rapprochement bancaire ---------- */
	function bank(){
		stage("L1 · Banque");
		const lines = shuffle([
			{ id:"a", l:"PRLV MOULINS DU NORD", m:-984 },
			{ id:"b", l:"VIR HOTEL BELLEVUE", m:1380 },
			{ id:"c", l:"PRLV CARTONNAGES FLANDRE", m:-480 },
			{ id:"d", l:"VIR FOURS PRO EQUIPEMENT", m:-7680 },
			{ id:"x", l:"VIR DUPONT CONSEIL SERVICES", m:-2940 }
		]);
		const invoices = shuffle([
			{ id:"a", l:"Moulins du Nord", s:"820,00 € HT · 984,00 € TTC" },
			{ id:"b", l:"Hôtel Bellevue (vente)", s:"1 150,00 € HT · 1 380,00 € TTC" },
			{ id:"c", l:"Cartonnages de Flandre", s:"400,00 € HT · 480,00 € TTC" },
			{ id:"d", l:"Fours Pro Équipement", s:"6 400,00 € HT · 7 680,00 € TTC" }
		]);
		const done = new Set(); let selL = null, selI = null;
		show(`<div class="au-k">L1 · rapprochement bancaire</div><h2 class="au-h">Le relevé ne ment pas</h2>
			<p class="au-p">Chaque mouvement du compte doit avoir sa pièce justificative. Touche une ligne du relevé, puis la facture qui lui correspond (attention : la banque voit les montants <b>TTC</b>).</p>
			<div class="au-cols"><div><h4>🏦 Relevé de compte</h4>${lines.map(x => `<button class="au-item" data-l="${x.id}"><b>${x.m > 0 ? "+" : "−"} ${euro(Math.abs(x.m))}</b>${x.l}</button>`).join("")}</div>
			<div><h4>🧾 Factures</h4>${invoices.map(x => `<button class="au-item" data-i="${x.id}"><b>${x.l}</b>${x.s.split(" · ").map(v => `<span class="n">${v}</span>`).join(" · ")}</button>`).join("")}</div></div>
			<div class="au-msg"></div><div data-end></div>`);
		const msg = (t, c) => { const m = card.querySelector(".au-msg"); m.className = "au-msg " + (c || ""); m.textContent = t; };
		const tryPair = () => {
			if(!selL || !selI) return;
			const L = card.querySelector(`[data-l="${selL}"]`), I = card.querySelector(`[data-i="${selI}"]`);
			L.setAttribute("aria-pressed", "false"); I.setAttribute("aria-pressed", "false");
			if(selL === selI){ done.add(selL); L.classList.add("done"); I.classList.add("done"); play("pop"); msg("✓ Rapproché : le montant TTC correspond.", "ok"); }
			else { err(); msg("Les montants ne correspondent pas : compare avec le TTC de la facture.", "ko"); }
			selL = selI = null;
			if(done.size === 4){
				card.querySelector('[data-l="x"]').classList.add("sus"); play("chime");
				card.querySelector("[data-end]").innerHTML = `<p class="au-p" style="margin-top:6px"><b>Il reste une ligne : − 2 940,00 € vers « Dupont Conseil Services ».</b> Aucune facture dans le dossier. Que conclus-tu ?</p><div data-q></div>`;
				qcm(card.querySelector("[data-end] [data-q]"), shuffle([["sus", "🚩 Mouvement sans justificatif : à creuser"], ["ok", "C'est normal, les petites dépenses n'ont pas besoin de pièce"], ["err", "C'est sûrement une erreur de la banque"]]), "sus", a => {
					a.innerHTML = `<p class="au-p" style="margin-top:8px">Bon réflexe : un paiement sans pièce justificative est un signal d'alerte. Gardons-le en tête…</p>${course("banque")}<button class="au-go" data-a="budget">Passer en L2 : le budget →</button>`;
				});
			}
		};
		card.onclick = e => {
			const l = e.target.closest("[data-l]"), i = e.target.closest("[data-i]");
			if(l && !done.has(l.dataset.l) && l.dataset.l !== "x"){ card.querySelectorAll("[data-l]").forEach(b => b.setAttribute("aria-pressed", "false")); l.setAttribute("aria-pressed", "true"); selL = l.dataset.l; tryPair(); }
			else if(l && l.dataset.l === "x" && done.size < 4){ msg("Aucune facture ne correspond à cette ligne… continue avec les autres.", ""); }
			if(i && !done.has(i.dataset.i)){ card.querySelectorAll("[data-i]").forEach(b => b.setAttribute("aria-pressed", "false")); i.setAttribute("aria-pressed", "true"); selI = i.dataset.i; tryPair(); }
		};
	}

	/* ---------- L2 · contrôle de gestion ---------- */
	function budget(){
		stage("L2 · Contrôle de gestion");
		card.onclick = null;
		const rows = [["Farine et matières", 3000, 3150], ["Électricité", 1200, 1260], ["Emballages", 900, 880], ["Prestations de services", 500, 3440], ["Salaires", 21000, 21000]];
		show(`<div class="au-k">L2 · contrôle de gestion</div><h2 class="au-h">Le budget dérape</h2>
			<p class="au-p">Voici le budget du trimestre et les dépenses réelles. <b>Touche la ligne dont l'écart est anormal.</b></p>
			<table class="au-tbl"><tr><th>Poste</th><th>Budget</th><th>Réel</th></tr>${rows.map((r, k) => `<tr class="pick" data-r="${k}"><td>${r[0]}</td><td>${euro0(r[1])}</td><td>${euro0(r[2])}</td></tr>`).join("")}</table>
			<div class="au-msg"></div><div data-end></div>`);
		card.onclick = e => {
			const tr = e.target.closest("[data-r]"); if(!tr || card.querySelector("tr.ok")) return;
			if(+tr.dataset.r !== 3){ err(); tr.classList.add("ko"); const m = card.querySelector(".au-msg"); m.className = "au-msg ko"; m.textContent = "Écart faible, ça arrive (prix, saison). Cherche un écart vraiment anormal."; return; }
			tr.classList.add("ok"); play("good"); card.onclick = null;
			card.querySelector(".au-msg").textContent = "";
			card.querySelector("[data-end]").innerHTML = `<p class="au-p" style="margin-top:6px"><b>De combien les prestations de services dépassent-elles le budget ?</b> (écart = réel − budget)</p><div data-q></div>`;
			qcm(card.querySelector("[data-end] [data-q]"), shuffle([["2940", "2 940 €"], ["3940", "3 940 €"], ["688", "688 €"]]), "2940", a => {
				a.innerHTML = `<p class="au-p" style="margin-top:8px">3 440 − 500 = <b>2 940 €</b>… <b>exactement le virement sans justificatif</b> vers Dupont Conseil Services ! Le contrôleur de gestion a repéré le problème grâce au budget.</p>${course("cdg")}<button class="au-go" data-a="audit">Passer en L3 : l'audit →</button>`;
			});
		};
	}

	/* ---------- L3 · audit : tamponner les pièces ---------- */
	const REASONS = [["tva", "TVA mal calculée"], ["just", "Prestation floue, sans bon de commande"], ["dbl", "Facture en double"]];
	function audit(){
		stage("L3 · Audit");
		const docs = shuffle([
			{ id:"dupont", hd:"Facture n° 118", t:"Dupont Conseil Services", d:"« Mission de conseil » · aucun détail, aucun bon de commande signé", lines:[["Total HT", "2 450,00 €"], ["TVA 20 %", "490,00 €"], ["Total TTC", "2 940,00 €"]], ok:false, r:"just" },
			{ id:"impr", hd:"Facture n° 5531", t:"Imprimerie Lilloise", d:"500 flyers pour le salon", lines:[["Total HT", "300,00 €"], ["TVA 20 %", "66,00 €"], ["Total TTC", "366,00 €"]], ok:false, r:"tva" },
			{ id:"moulins", hd:"Facture n° 2024-77", t:"Moulins du Nord", d:"600 kg de farine · bon de commande n° 41 signé", lines:[["Total HT", "820,00 €"], ["TVA 20 %", "164,00 €"], ["Total TTC", "984,00 €"]], ok:true },
			{ id:"frais", hd:"Note de frais", t:"Inès Benali, commerciale", d:"Déjeuner avec l'acheteur de l'Hôtel Bellevue · mardi 12 mars · ticket joint", lines:[["Montant", "64,00 €"]], ok:true }
		]);
		const st = {}; let first = true;
		const render = () => {
			show(`<div class="au-k">L3 · audit (en alternance)</div><h2 class="au-h">Tamponner les pièces</h2>
				<p class="au-p">Examine chaque pièce du trimestre. Si elle est correcte, tamponne <b>Conforme</b>. Sinon, choisis <b>la raison</b> de l'anomalie.</p>
				${docs.map(d => `<div class="au-doc" data-d="${d.id}">${st[d.id] ? `<span class="au-stamp ${st[d.id] === "ok" ? "ok" : "ko"}">${st[d.id] === "ok" ? "CONFORME" : "ANOMALIE"}</span>` : ""}
					<div class="hd"><span>${d.hd}</span></div><div class="tt">${d.t}</div><small>${d.d}</small>${d.lines.map(([a, b]) => `<div class="ln"><span>${a}</span><b>${b}</b></div>`).join("")}
					${st[d.id] ? "" : `<div class="au-acts"><button data-s="ok">✓ Conforme</button>${REASONS.map(([k, t]) => `<button data-s="${k}">⚠ ${t}</button>`).join("")}</div>`}</div>`).join("")}
				<div class="au-msg"></div><div data-end></div>`, !first);
			first = false;
			if(Object.keys(st).length === docs.length){
				play("chime");
				card.querySelector("[data-end]").innerHTML = `<p class="au-p">Deux anomalies : une erreur de TVA (300 × 20 % = 60 €, pas 66 €) et la fameuse facture <b>Dupont Conseil Services</b>, floue et sans bon de commande. Qui se cache derrière cette société ?</p><button class="au-go" data-a="board">Ouvrir le tableau d'enquête →</button>`;
			}
		};
		render();
		card.onclick = e => {
			const b = e.target.closest("[data-s]"); if(!b) return;
			const d = docs.find(x => x.id === b.closest("[data-d]").dataset.d), s = b.dataset.s;
			const good = d.ok ? s === "ok" : s === d.r;
			if(!good){
				err(); b.classList.add("ko");
				const m = card.querySelector(".au-msg"); m.className = "au-msg ko";
				m.textContent = d.ok ? `${d.t} : regarde bien, tout est justifié et les calculs sont justes.` : s === "ok" ? `${d.t} : quelque chose cloche, vérifie les calculs et les justificatifs.` : `${d.t} : il y a bien une anomalie, mais pas celle-là.`;
				return;
			}
			st[d.id] = d.ok ? "ok" : "ko"; play(d.ok ? "pop" : "stamp"); if(!d.ok) S.found++;
			render();
		};
	}
	/* ---------- L3 · tableau d'enquête : relier les indices ---------- */
	function board(){
		const pins = shuffle([
			{ id:"rib", t:"RIB · Dupont Conseil Services", d:"IBAN FR76 3000 4021 •••• 4821" },
			{ id:"kbis", t:"Extrait Kbis · Dupont Conseil", d:"Société créée il y a 2 mois · siège : 14 rue des Lilas, Lille" },
			{ id:"morel", t:"Fiche salarié · Julien Morel", d:"Comptable de l'entreprise · 14 rue des Lilas, Lille · IBAN •••• 4821" },
			{ id:"benali", t:"Fiche salarié · Inès Benali", d:"Commerciale · 3 place du Concert, Lille · IBAN •••• 0937" }
		]);
		const links = new Set(["morel|rib", "kbis|morel"]);      // clés triées par ordre alphabétique
		let sel = null;
		show(`<div class="au-k">L3 · audit · tableau d'enquête</div><h2 class="au-h">Qui se cache derrière Dupont Conseil ?</h2>
			<p class="au-p">Relie <b>deux pièces</b> qui partagent un indice : touche la première, puis la seconde.</p>
			<div class="au-board"><div class="au-pins">${pins.map(p => `<button class="au-pin" data-p="${p.id}"><b>${p.t}</b>${p.d}</button>`).join("")}</div></div>
			<div class="au-msg"></div><div data-end></div>`);
		card.onclick = e => {
			const b = e.target.closest("[data-p]"); if(!b || card.querySelector(".au-pin.hit")) return;
			if(!sel){ sel = b; b.setAttribute("aria-pressed", "true"); return; }
			const a = sel.dataset.p, c = b.dataset.p; sel.setAttribute("aria-pressed", "false"); sel = null;
			if(a === c) return;
			const k = [a, c].sort().join("|");
			const m = card.querySelector(".au-msg");
			if(!links.has(k)){ err(); m.className = "au-msg ko"; m.textContent = "Ces deux pièces n'ont rien en commun. Compare les adresses et les IBAN."; return; }
			card.querySelector(`[data-p="${a}"]`).classList.add("hit"); card.querySelector(`[data-p="${c}"]`).classList.add("hit"); play("good");
			m.className = "au-msg ok"; m.textContent = k.includes("rib") ? "✓ Même IBAN : l'argent de Dupont Conseil arrive sur le compte de Julien Morel !" : "✓ Même adresse : la société est domiciliée chez Julien Morel !";
			card.onclick = null;
			card.querySelector("[data-end]").innerHTML = `<p class="au-p" style="margin-top:6px">Le comptable a créé une <b>société fictive</b> et se paie de fausses « missions de conseil ». <b>Que fait l'auditeur maintenant ?</b></p><div data-q></div>`;
			qcm(card.querySelector("[data-end] [data-q]"), shuffle([["ok", "Il documente ses preuves et alerte la gérante dans son rapport"], ["post", "Il publie l'affaire sur les réseaux sociaux"], ["rien", "Il ne dit rien : ce n'est pas son rôle"]]), "ok", x => {
				x.innerHTML = `<p class="au-p" style="margin-top:8px">C'est la <b>déontologie</b> de l'auditeur : indépendance, preuves solides, confidentialité, et alerte des bonnes personnes. La gérante pourra porter plainte et récupérer les sommes.</p>${course("audit")}<button class="au-go" data-a="end">Rendre mon rapport d'audit</button>`;
			});
		};
	}

	/* ---------- rapport final ---------- */
	function finale(){
		stage("Rapport d'audit"); card.onclick = null;
		const e = S.errors, mention = e <= 2 ? "Très bien" : e <= 6 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention);
		play("win");
		const order = ["compta", "fisca", "banque", "cdg", "audit"].filter(k => S.learned.has(k));
		show(`<span class="au-conf">AFFAIRE RÉSOLUE</span><div class="au-k">Licence Comptabilité-Finance-Audit · rapport</div><h2 class="au-h">Fraude démasquée !</h2>
			<div class="au-big">🕵️✅</div>
			<p class="au-p" style="text-align:center">Mission accomplie, mention <b>${mention}</b>.</p>
			<table class="au-tbl"><tr><td>Montant détourné ce trimestre</td><td><b>2 940,00 €</b></td></tr><tr><td>Anomalies trouvées</td><td><b>${S.found} / 2</b></td></tr><tr><td>Erreurs en chemin</td><td><b>${e}</b></td></tr></table>
			<p class="au-p">Tu as fait le travail d'un comptable, d'un contrôleur de gestion et d'un auditeur, et touché à ${order.length} cours de la licence (en L3, en alternance dans un cabinet ou une entreprise) :</p>
			<ul class="au-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="au-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="au-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Comptabilité-Finance-Audit ↗</a>
			<button class="au-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="au-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "sort") return sortDocs();
		if(k === "sort-next") return sortNext();
		if(k === "tva") return tva();
		if(k === "bank") return bank();
		if(k === "budget") return budget();
		if(k === "audit") return audit();
		if(k === "board") return board();
		if(k === "end") return finale();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set(), found:0 }); root.querySelector("#auErr").textContent = "🔎 0 erreur"; return intro(); }
	});
	function close(){ if(closed) return; closed = true; document.removeEventListener("keydown", onKey); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".au-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	if(window.campus) window.campus.game = { S, card, sort:sortDocs, tva, bank, budget, audit, board, end:finale };
}
