/* « Le Dossier Deslaurier » — mini-jeu du Master Droit & Gestion du Patrimoine (ISEA).
   D'après le cas pratique de Jean-Daniel Wecxsteen (initiation à la gestion de patrimoine, L3) :
   la vie d'une famille lilloise de 1959 à aujourd'hui, et à chaque étape la question posée au conseiller.
   On raisonne avec le droit d'aujourd'hui. Famille fictive. Contenu à relire par l'équipe du master. */

const COURSES = {
	famille: ["Droit de la famille", "Régimes matrimoniaux, PACS, concubinage : qui possède quoi dans un couple, et que changer quand la vie change."],
	liquid:  ["Liquidation et partage", "Avant toute succession, on liquide le régime matrimonial : chacun reprend ses biens propres et sa part des biens communs."],
	succ:    ["Successions et libéralités", "Héritiers, réserve héréditaire, donation entre époux, testament : le cœur du métier de conseiller."],
	place:   ["Ingénierie financière", "Profil de l'épargnant, horizon, risque : construire une allocation entre épargne disponible, assurance-vie, actions et immobilier."],
	fisca:   ["Fiscalité patrimoniale", "Droits de succession et de donation, abattements, assurance-vie : transmettre mieux, dans le respect de la loi."]
};

const CSS = `
.gp{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#24302a;overflow:auto;animation:gpIn .35s ease both;
	background:radial-gradient(ellipse at 50% 15%,rgba(255,240,205,.16),transparent 60%),repeating-linear-gradient(0deg,#27463a 0 3px,#294a3d 3px 6px),#27463a}
@keyframes gpIn{from{opacity:0}to{opacity:1}}
.gp-top{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;background:linear-gradient(#1c3329ee,#1c332900)}
.gp-chip{background:rgba(255,251,240,.95);border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 6px 18px rgba(5,15,10,.3)}
.gp-stage{background:#b08a3e;color:#fff}
.gp-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,251,240,.95);font-size:22px;cursor:pointer}
.gp-wrap{max-width:560px;margin:0 auto;padding:4px 12px 40px}
.gp-card{background:#fffcf3;border-radius:6px;box-shadow:0 18px 40px rgba(5,15,10,.45);padding:20px 18px 18px;position:relative;animation:gpUp .35s cubic-bezier(.2,.8,.2,1) both;border-top:5px solid #b08a3e}
@keyframes gpUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.gp-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a6a24}
.gp-h{font:700 23px/1.15 Fraunces,Georgia,serif;margin:4px 0 6px;color:#1f3d31}
.gp-p{margin:0 0 12px;color:#4a5450;font-size:14.5px}
.gp-year{display:inline-block;font:700 13px Fraunces,Georgia,serif;background:#1f3d31;color:#f3e3b8;border-radius:6px;padding:3px 9px;margin-bottom:6px}
.gp-story{background:#f6efdc;border-left:4px solid #b08a3e;border-radius:4px;padding:10px 12px;margin:8px 0 12px;font-size:14px;color:#3d3528}
.gp-ask{display:block;margin-top:8px;color:#b3261e;font-weight:800;font-size:13.5px}
.gp-ask:before{content:"⚖ Gestion de patrimoine · "}
.gp-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:#1f3d31;color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;margin-top:12px;text-align:center;text-decoration:none}
.gp-alt{display:block;width:100%;border:2px solid #d9cfb4;border-radius:12px;padding:12px;background:#fff;color:#1f3d31;font:800 14px Nunito,sans-serif;cursor:pointer;margin-top:8px;text-align:center;text-decoration:none}
.gp-msg{min-height:20px;font-size:13.5px;font-weight:700;color:#4a5450;margin:6px 0}
.gp-msg.ko{color:#b3261e}.gp-msg.ok{color:#2c6a46}
.gp-opts{display:grid;gap:7px}
.gp-opt{text-align:left;border:2px solid #d9cfb4;background:#fff;border-radius:10px;padding:11px 12px;font:800 14.5px Nunito,sans-serif;cursor:pointer;color:#24302a}
.gp-opt:hover{border-color:#1f3d31}
.gp-opt.ok{border-color:#3d7a55;background:#eef8f0}.gp-opt.ko{border-color:#c4532f;background:#fdeceb}
.gp-opt[aria-pressed=true]{border-color:#1f3d31;box-shadow:0 0 0 3px rgba(31,61,49,.18)}
.gp-item{background:#fff;border:1px solid #e2d8bf;border-radius:8px;padding:9px 11px;margin:7px 0;font-size:14px}
.gp-item b{display:block;font:700 15px Fraunces,Georgia,serif;color:#1f3d31}
.gp-item small{color:#6f6a5c}
.gp-item.done{border-color:#3d7a55;background:#eef8f0}
.gp-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
.gp-acts button{border:2px solid #d9cfb4;background:#fff;border-radius:10px;padding:7px 10px;font:800 13px Nunito,sans-serif;cursor:pointer;color:#24302a}
.gp-acts button:hover{border-color:#1f3d31}
.gp-acts button.ko{border-color:#c4532f;background:#fdeceb}
.gp-why{display:block;margin-top:5px;color:#2c6a46;font-weight:700;font-size:13px}
.gp-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gp-cols h4{margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6f6a5c}
.gp-pick{display:block;width:100%;text-align:left;border:2px solid #e2d8bf;background:#fff;border-radius:8px;padding:8px;margin-bottom:6px;font:700 12.5px/1.3 Nunito,sans-serif;cursor:pointer;color:#24302a}
.gp-pick b{display:block;font-size:14px}
.gp-pick[aria-pressed=true]{border-color:#1f3d31;box-shadow:0 0 0 3px rgba(31,61,49,.18)}
.gp-pick.done{border-color:#3d7a55;background:#eef8f0;cursor:default}
.gp-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.gp-tbl th{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6f6a5c;text-align:left;padding:4px}
.gp-tbl td{padding:7px 4px;border-top:1px solid #e2d8bf;vertical-align:middle}
.gp-tbl td button{border:2px solid #d9cfb4;background:#fff;border-radius:8px;padding:5px 8px;font:800 12.5px Nunito,sans-serif;cursor:pointer;margin:2px 2px 2px 0}
.gp-tbl td button.on{border-color:#1f3d31;background:#1f3d31;color:#fff}
.gp-tbl td button.ok{border-color:#3d7a55;background:#3d7a55;color:#fff}
.gp-tbl td button.ko{border-color:#c4532f;background:#fdeceb}
.gp-course{background:#fff;border:2px solid #b08a3e;border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.gp-course .tag{display:inline-block;background:#f6ecd2;color:#7a5a1a;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.gp-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.gp-course span{font-size:14px;color:#4a5450}
.gp-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.gp-list li{background:#fff;border:1px solid #e2d8bf;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.gp-list li span{color:#8a6a24;font-weight:800;margin-right:6px}
.gp-tree{font:700 13px/1.5 Nunito,sans-serif;text-align:center;background:#fff;border:1px solid #e2d8bf;border-radius:8px;padding:10px;margin:8px 0;color:#1f3d31}
.gp-tree small{color:#6f6a5c;font-weight:600}
.gp-big{font-size:46px;text-align:center}
@media (max-width:440px){ .gp-h{font-size:20px} .gp-wrap{padding:4px 8px 40px} .gp-card{padding:16px 12px 14px} .gp-pick{font-size:11.5px;padding:6px} .gp-pick b{font-size:12.5px} .gp-tbl{font-size:12.5px} }
`;

export function openPatrimoine({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gp-css")){ const st = document.createElement("style"); st.id = "gp-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "gp"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Le Dossier Deslaurier");
	root.innerHTML = `<div class="gp-top"><span class="gp-chip gp-stage" id="gpStage">Dossier</span><span class="gp-chip" id="gpErr">⚖ 0 erreur</span><button class="gp-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gp-wrap"><div class="gp-card"></div></div>`;
	document.body.appendChild(root);
	const card = root.querySelector(".gp-card");
	const S = { errors:0, learned:new Set() };
	let closed = false;
	const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
	function show(html){ card.onclick = null; card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; root.scrollTo({ top:0, behavior:"smooth" }); }
	function stage(t){ root.querySelector("#gpStage").textContent = t; onEvent && onEvent("stage", t); }
	function err(){ S.errors++; play("bad"); onEvent && onEvent("err"); root.querySelector("#gpErr").textContent = `⚖ ${S.errors} erreur${S.errors > 1 ? "s" : ""}`; }
	function course(k){ const [n, t] = COURSES[k]; S.learned.add(k); return `<div class="gp-course"><span class="tag">📚 Au cœur du Master Droit & Gestion du Patrimoine</span><b>${n}</b><span>${t}</span></div>`; }
	const msg = (t, c) => { const m = card.querySelector(".gp-msg"); if(m){ m.className = "gp-msg " + (c || ""); m.textContent = t; } };
	const next = (a, label) => `<button class="gp-go" data-a="${a}">${label}</button>`;
	// question à choix unique : opts = [[valeur, texte, explication si mauvais]]
	function qcm(el, opts, good, onOk){
		el.innerHTML = `<div class="gp-opts">${shuffle(opts).map(([v, t]) => `<button class="gp-opt" data-q="${v}">${t}</button>`).join("")}</div><div class="gp-msg"></div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".gp-opt.ok")) return;
			const m = el.querySelector(".gp-msg");
			if(b.dataset.q !== good){ err(); b.classList.add("ko"); const o = opts.find(x => x[0] === b.dataset.q); m.className = "gp-msg ko"; m.textContent = o[2] || "Pas tout à fait."; return; }
			b.classList.add("ok"); play("good"); m.textContent = ""; onOk(el.querySelector("[data-after]"));
		}));
	}
	// classer des éléments : items = [{t, d, k, why}], cats = [[k, libellé]]
	function sorter(el, items, cats, onDone){
		const done = new Set();
		el.innerHTML = items.map((x, i) => `<div class="gp-item" data-i="${i}"><b>${x.t}</b><small>${x.d}</small><div class="gp-acts">${cats.map(([k, l]) => `<button data-k="${k}">${l}</button>`).join("")}</div></div>`).join("") + `<div class="gp-msg"></div><div data-after></div>`;
		el.addEventListener("click", e => {
			const b = e.target.closest("[data-k]"); if(!b) return;
			const box = b.closest("[data-i]"), x = items[+box.dataset.i];
			if(b.dataset.k !== x.k){ err(); b.classList.add("ko"); const m = el.querySelector(".gp-msg"); m.className = "gp-msg ko"; m.textContent = `${x.t} : ${x.hint || "relis bien la date et l'origine du bien."}`; return; }
			play("pop"); done.add(box.dataset.i); box.classList.add("done");
			box.querySelector(".gp-acts").outerHTML = `<span class="gp-why">✓ ${cats.find(c => c[0] === x.k)[1]} · ${x.why}</span>`;
			el.querySelector(".gp-msg").textContent = "";
			if(done.size === items.length){ play("chime"); onDone(el.querySelector("[data-after]")); }
		});
	}

	/* ---------- intro ---------- */
	function intro(){
		stage("Dossier");
		show(`<div class="gp-k">Mini-jeu · ${formation.name}</div><h2 class="gp-h">Le Dossier Deslaurier</h2>
			<div class="gp-big">📜⚖️</div>
			<p class="gp-p">Tu es <b>conseiller en gestion de patrimoine</b> à Lille. La famille Deslaurier (fictive) te confie son histoire, de 1959 à aujourd'hui : un mariage, un cabinet, une maison, un décès, un remariage… À chaque tournant de la vie, une question de patrimoine se pose. À toi d'y répondre.</p>
			<p class="gp-p"><small>D'après un cas pratique utilisé à l'ISEA en initiation à la gestion de patrimoine. On raisonne avec le droit d'aujourd'hui.</small></p>
			<ul class="gp-list"><li><span>1967</span>Le mariage sans contrat</li><li><span>1968-1985</span>Le cabinet, la maison, l'immeuble : à qui sont-ils ?</li><li><span>1991</span>Un décès, une succession, un capital à placer</li><li><span>1997 →</span>Contrats de mariage, remariage, concubinage, transmission</li></ul>
			${next("mariage", "Ouvrir le dossier")}`);
	}

	/* ---------- 1967 · le mariage ---------- */
	function mariage(){
		stage("1967 · Le mariage");
		show(`<span class="gp-year">1959 → 1967</span><h2 class="gp-h">Un mariage sans contrat</h2>
			<div class="gp-story">Paul, fils d'agriculteurs, arrive à Lille en 1959 avec 2 000 F en poche et devient aide-comptable dans le textile. Le 20 juin 1967, il épouse Jeannette Poirier. Ils ne font <b>pas de contrat de mariage</b>.<span class="gp-ask">Sous quel régime sont-ils mariés ?</span></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [
			["legal", "La communauté réduite aux acquêts"],
			["sep", "La séparation de biens", "Non : la séparation de biens suppose un contrat signé chez le notaire."],
			["meubles", "La communauté de meubles et acquêts", "C'était le régime légal… avant la réforme de 1966. Pour un mariage de 1967, ce n'est plus le cas."]
		], "legal", a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Sans contrat, c'est le <b>régime légal</b> depuis 1966 : ce que chacun possédait avant le mariage, ou reçoit par donation ou héritage, lui reste <b>propre</b> ; ce qui est acquis pendant le mariage, salaires compris, est <b>commun</b>.</p>
				<p class="gp-p"><b>Et si ce régime ne leur convient plus un jour ?</b></p><div data-q2></div>`;
			qcm(a.querySelector("[data-q2]"), [
				["chg", "Ils pourront changer de régime matrimonial devant notaire"],
				["fige", "Impossible : le régime est fixé pour toute la vie", "Si : la loi permet de changer de régime en cours de mariage, dans l'intérêt de la famille."],
				["div", "Il faudra divorcer puis se remarier", "Inutile ! Un acte notarié suffit."]
			], "chg", b => {
				b.innerHTML = `<p class="gp-p" style="margin-top:8px">Un acte chez le notaire suffit, dans l'intérêt de la famille (le juge n'intervient qu'en cas d'opposition, ou si un enfant mineur risque d'être lésé). Ne rien signer n'est donc pas forcément une erreur : c'est un choix, qu'il faut faire en connaissance de cause.</p>${course("famille")}${next("biens", "1968 · Le cabinet →")}`;
			});
		});
	}

	/* ---------- 1968-1985 · propres ou communs ---------- */
	function biens(){
		stage("1968-1985 · Les biens");
		show(`<span class="gp-year">1968 → 1985</span><h2 class="gp-h">À qui appartient quoi ?</h2>
			<div class="gp-story">1968 : Paul crée son <b>cabinet d'expertise comptable</b>. Naissent Jean-Baptiste (1968), puis les jumelles Élise et Louise (1973). En 1972, le couple s'endette pour acheter une <b>grande maison</b> ; en 1985, il achète un <b>immeuble</b> pour y installer le cabinet.<span class="gp-ask">Classe chaque bien du couple.</span></div>
			<div data-s></div>`);
		sorter(card.querySelector("[data-s]"), shuffle([
			{ t:"Les 2 000 F de 1959", d:"Donnés par son père, bien avant le mariage", k:"paul", why:"Paul les avait avant le mariage.", hint:"cet argent existait avant le mariage." },
			{ t:"Le cabinet d'expertise comptable", d:"Créé par Paul en 1968", k:"com", why:"Créé pendant le mariage : sa valeur est commune. Le diplôme et le droit d'exercer, eux, restent à Paul.", hint:"il a été créé pendant le mariage… même si seul Paul peut l'exercer." },
			{ t:"La maison de 1972", d:"Achetée à crédit pendant le mariage", k:"com", why:"Acquise pendant le mariage.", hint:"regarde la date d'achat." },
			{ t:"L'immeuble du cabinet", d:"Acheté en 1985 par M. et Mme Deslaurier", k:"com", why:"Acquis pendant le mariage, même s'il sert à l'activité de Paul.", hint:"il sert au cabinet de Paul, mais quand et comment a-t-il été acheté ?" },
			{ t:"L'épargne sur les salaires", d:"Économisée par Paul depuis 1967", k:"com", why:"Les gains et salaires sont communs.", hint:"les revenus du travail pendant le mariage…" },
			{ t:"La commode de la grand-mère", d:"Héritée par Jeannette (exemple ajouté au cas)", k:"jea", why:"Reçue par héritage : elle reste propre à Jeannette.", hint:"un héritage reste à celui qui le reçoit." }
		]), [["paul", "Propre à Paul"], ["com", "Commun"], ["jea", "Propre à Jeannette"]], a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px"><b>Imaginons qu'ils divorcent en 1990. Que devient le cabinet ?</b></p><div data-q></div>`;
			qcm(a.querySelector("[data-q]"), [
				["soulte", "Paul le garde, mais sa valeur entre dans le partage : il verse une compensation (une soulte) à Jeannette"],
				["paul", "Il reste à Paul sans rien devoir : c'est son diplôme", "Le diplôme est à Paul, mais le cabinet a une valeur, créée pendant le mariage : elle est commune."],
				["asso", "Jeannette devient associée du cabinet", "Elle n'est pas expert-comptable : elle ne peut pas exercer. Elle a droit à une part de la valeur, pas au métier."]
			], "soulte", b => {
				b.innerHTML = `<p class="gp-p" style="margin-top:8px">Même logique pour l'immeuble : bien commun, partagé en valeur, que Paul peut demander à garder (attribution préférentielle) en indemnisant Jeannette. C'est pour cela qu'un conseiller interroge toujours un chef d'entreprise sur son régime matrimonial.</p>${next("deces", "1991 · L'accident →")}`;
			});
		});
	}

	/* ---------- 1991 · le décès de Jeannette ---------- */
	function deces(){
		stage("1991 · La succession");
		show(`<span class="gp-year">2 juillet 1991</span><h2 class="gp-h">Le drame</h2>
			<div class="gp-story">Paul et Jeannette ont un grave accident de voiture. Jeannette décède deux jours plus tard, à 45 ans. Les enfants sont majeurs. Le notaire de famille, Maître Bonchamp, convoque Paul et les enfants.<span class="gp-ask">Avant même de parler d'héritage, que fait le notaire ?</span></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [
			["liq", "Il liquide la communauté : Paul reprend la moitié des biens communs, et seule l'autre moitié revient à la succession de Jeannette"],
			["tout", "Il partage tout le patrimoine du couple entre Paul et les enfants", "Non : la moitié des biens communs appartient déjà à Paul. Ce n'est pas un héritage, c'est sa part."],
			["enf", "Tout va aux enfants, Paul garde seulement ses biens propres", "Non : Paul a droit à sa moitié de la communauté, puis à ses droits de conjoint survivant."]
		], "liq", a => {
			a.innerHTML = `<div class="gp-tree">Patrimoine commun<br>↙ ↘<br>½ à Paul <small>(sa part)</small> · ½ succession de Jeannette <small>(+ ses biens propres)</small></div>
				<p class="gp-p">En 1972, le couple avait signé une <b>donation entre époux</b>. Avec trois enfants communs, quelles options offre-t-elle à Paul sur la succession de Jeannette ? <b>Coche les trois bonnes.</b></p>
				<div class="gp-opts" data-m>${shuffle([
					["a", "Toute la succession en usufruit", 1], ["b", "¼ en pleine propriété et ¾ en usufruit", 1], ["c", "La quotité disponible (¼ avec trois enfants) en pleine propriété", 1],
					["d", "La moitié en pleine propriété", 0], ["e", "Toute la succession en pleine propriété", 0]
				]).map(([v, t, g]) => `<button class="gp-opt" data-m="${v}" data-g="${g}" aria-pressed="false">${t}</button>`).join("")}</div>
				<button class="gp-go" data-check>Valider mes trois choix</button><div class="gp-msg"></div><div data-after></div>`;
			const zone = a;
			zone.querySelectorAll("button[data-m]").forEach(b => b.addEventListener("click", () => { if(zone.querySelector("[data-check]").disabled) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); }));
			zone.querySelector("[data-check]").addEventListener("click", ev => {
				const on = [...zone.querySelectorAll('button[data-m][aria-pressed="true"]')];
				const m = zone.querySelector(".gp-msg");
				if(on.length !== 3 || on.some(b => b.dataset.g !== "1")){ err(); m.className = "gp-msg ko"; m.textContent = on.length !== 3 ? "Il faut exactement trois options." : "Pas tout à fait : avec trois enfants, les enfants sont « réservataires » pour ¾ de la succession."; return; }
				ev.target.disabled = true; play("good"); m.textContent = "";
				zone.querySelectorAll("button[data-m]").forEach(b => b.classList.add(b.dataset.g === "1" ? "ok" : "ko"));
				zone.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Sans donation, Paul aurait eu le choix entre l'usufruit de tout et ¼ en pleine propriété. La donation élargit ses options. Ici, Paul ne veut pas rester en <b>indivision</b> avec ses enfants : on partage. Il garde la maison et une partie des titres ; les enfants reçoivent le reste du portefeuille, <b>3 000 000 F</b> à eux trois.</p>${course("liquid")}${course("succ")}${next("placer", "Conseiller les enfants →")}`;
			});
		});
	}

	/* ---------- 1991 · réinvestir ---------- */
	function placer(){
		stage("1991 · Placer l'héritage");
		const goals = [
			{ id:"livret", g:"Garder une réserve disponible à tout moment, sans risque", p:"Livret d'épargne" },
			{ id:"av", g:"Faire fructifier sur 8 ans et plus, et pouvoir désigner qui recevra le capital", p:"Assurance-vie" },
			{ id:"pea", g:"Investir en actions d'entreprises européennes, avec une fiscalité douce après 5 ans", p:"Plan d'épargne en actions (PEA)" },
			{ id:"immo", g:"Percevoir des revenus réguliers, adossés à un bien concret", p:"Immobilier locatif" }
		];
		const left = shuffle(goals), right = shuffle(goals), done = new Set(); let sL = null, sR = null;
		show(`<span class="gp-year">1991</span><h2 class="gp-h">Placer l'héritage</h2>
			<div class="gp-story">Jean-Baptiste, Élise et Louise reçoivent un portefeuille de titres. Ils viennent te voir.<span class="gp-ask">Comment réinvestir les fonds de la succession ?</span></div>
			<p class="gp-p">Un conseiller commence toujours par connaître son client : <b>objectifs, horizon, goût du risque</b>. Ensuite, chaque objectif a son outil. Relie un objectif à son placement.</p>
			<div class="gp-cols"><div><h4>🎯 Objectif</h4>${left.map(x => `<button class="gp-pick" data-l="${x.id}">${x.g}</button>`).join("")}</div>
			<div><h4>💼 Placement</h4>${right.map(x => `<button class="gp-pick" data-r="${x.id}"><b>${x.p}</b></button>`).join("")}</div></div>
			<div class="gp-msg"></div><div data-after></div>`);
		const tryPair = () => {
			if(!sL || !sR) return;
			const L = card.querySelector(`[data-l="${sL}"]`), R = card.querySelector(`[data-r="${sR}"]`);
			L.setAttribute("aria-pressed", "false"); R.setAttribute("aria-pressed", "false");
			if(sL === sR){ done.add(sL); L.classList.add("done"); R.classList.add("done"); play("pop"); msg("✓ Bien vu.", "ok"); }
			else { err(); msg("Ce placement ne répond pas à cet objectif. Pense à la disponibilité, à la durée et au risque.", "ko"); }
			sL = sR = null;
			if(done.size === goals.length){
				play("chime"); msg("");
				card.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Pas de placement miracle : on <b>diversifie</b> selon le profil de chacun. Louise, célibataire à Paris, n'aura pas les mêmes besoins que Jean-Baptiste. Et l'assurance-vie reviendra plus tard dans le dossier…</p>${course("place")}${next("contrats", "1997 · Le mariage d'Élise →")}`;
			}
		};
		card.onclick = e => {
			const l = e.target.closest("[data-l]"), r = e.target.closest("[data-r]");
			if(l && !done.has(l.dataset.l)){ card.querySelectorAll("[data-l]").forEach(b => b.setAttribute("aria-pressed", "false")); l.setAttribute("aria-pressed", "true"); sL = l.dataset.l; tryPair(); }
			if(r && !done.has(r.dataset.r)){ card.querySelectorAll("[data-r]").forEach(b => b.setAttribute("aria-pressed", "false")); r.setAttribute("aria-pressed", "true"); sR = r.dataset.r; tryPair(); }
		};
	}

	/* ---------- 1997 · les contrats de mariage ---------- */
	function contrats(){
		stage("1997 · Contrats de mariage");
		show(`<span class="gp-year">1997</span><h2 class="gp-h">Les contrats de mariage</h2>
			<div class="gp-story">Élise épouse Florent Perbeau, jeune ingénieur. Paul souhaite qu'un contrat de <b>séparation de biens</b> soit signé chez le notaire.<span class="gp-ask">Quels sont les types de contrats de mariage possibles ?</span></div>
			<p class="gp-p">Associe chaque régime à sa règle.</p><div data-s></div>`);
		sorter(card.querySelector("[data-s]"), shuffle([
			{ t:"Chacun reste seul propriétaire de tout ce qu'il achète, avant comme pendant le mariage", d:"", k:"sep", why:"Utile pour protéger la famille d'un entrepreneur des dettes de son activité.", hint:"aucun bien commun, ici." },
			{ t:"Tout est commun, même ce que chacun possédait avant le mariage", d:"", k:"univ", why:"Souvent choisi tard dans la vie, avec une clause qui attribue tout au survivant.", hint:"le régime le plus « communautaire » de tous." },
			{ t:"Séparés pendant le mariage, mais à la fin on partage l'enrichissement de chacun", d:"", k:"part", why:"Un régime hybride, prisé des couples où l'un est indépendant.", hint:"séparation d'abord, partage du gain à la fin." },
			{ t:"Les biens d'avant le mariage et les héritages restent propres, le reste est commun", d:"", k:"legal", why:"Le régime légal, celui des époux Deslaurier.", hint:"c'est le régime appliqué sans contrat." }
		]), [["legal", "Communauté réduite aux acquêts"], ["sep", "Séparation de biens"], ["part", "Participation aux acquêts"], ["univ", "Communauté universelle"]], a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">On peut aussi aménager chaque régime avec des clauses (par exemple une petite communauté pour la résidence principale dans une séparation de biens). Le notaire rédige ; le conseiller aide à choisir.</p>${next("remariage", "Paul se remarie →")}`;
		});
	}

	/* ---------- le remariage de Paul ---------- */
	function remariage(){
		stage("Le remariage");
		show(`<span class="gp-year">Plus tard</span><h2 class="gp-h">Une famille recomposée</h2>
			<div class="gp-story">Las de la solitude, Paul veut épouser Paulette Mercier, veuve, du même âge. Elle estime son patrimoine à 2 000 000 € et a des enfants de ses deux mariages.<span class="gp-ask">Quel contrat protège le mieux les enfants de chacun ?</span></div>
			<div data-q></div>`);
		qcm(card.querySelector("[data-q]"), [
			["sep", "La séparation de biens : chacun garde son patrimoine, qui ira à ses propres enfants"],
			["univ", "La communauté universelle avec attribution de tout au survivant", "Risqué : les enfants d'un premier mariage seraient privés de leur héritage jusqu'au second décès, et peuvent contester (action en retranchement). Source de conflits."],
			["rien", "Pas de contrat : la communauté légale suffit", "Leurs biens actuels resteraient propres, mais tout ce qu'ils achèteront ensemble deviendrait commun : le partage avec les enfants de chacun serait plus délicat."]
		], "sep", a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Avec des enfants de lits différents, la séparation de biens évite de mélanger les patrimoines. Pour protéger le conjoint survivant, on complète ensuite par une donation entre époux, un testament ou une assurance-vie, en respectant les droits de tous les enfants.</p>${next("concubin", "Jean-Baptiste et Sarah →")}`;
		});
	}

	/* ---------- Jean-Baptiste, en concubinage ---------- */
	function concubin(){
		stage("Le concubinage");
		const rows = [["Marié", "oui", "0"], ["Pacsé", "non", "0"], ["Concubin", "non", "60"]];
		const pick = {};
		show(`<span class="gp-year">Aujourd'hui</span><h2 class="gp-h">Ni marié, ni pacsé</h2>
			<div class="gp-story">Jean-Baptiste vit avec Sarah Dourdon, rencontrée pendant ses études à Paris. Ils n'ont pas voulu se pacser.<span class="gp-ask">Que se passerait-il en cas de décès ?</span></div>
			<p class="gp-p">Complète le tableau : selon le statut du couple, le survivant hérite-t-il sans testament ? Et combien paie-t-il de droits de succession ?</p>
			<table class="gp-tbl"><tr><th>Statut</th><th>Hérite sans testament ?</th><th>Droits</th></tr>
			${rows.map(([s], i) => `<tr><td><b>${s}</b></td><td><button data-c="${i}-h-oui">Oui</button><button data-c="${i}-h-non">Non</button></td><td><button data-c="${i}-d-0">0 %</button><button data-c="${i}-d-60">60 %</button></td></tr>`).join("")}</table>
			<button class="gp-go" data-check>Vérifier</button><div class="gp-msg"></div><div data-after></div>`);
		card.onclick = e => {
			const b = e.target.closest("[data-c]"); if(!b || card.querySelector("[data-check]").disabled) return;
			const [i, col] = b.dataset.c.split("-"); pick[i + col] = b.dataset.c.split("-")[2];
			b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
		};
		card.querySelector("[data-check]").addEventListener("click", ev => {
			if(Object.keys(pick).length < 6){ msg("Remplis toutes les cases.", "ko"); return; }
			let bad = 0;
			rows.forEach(([, h, d], i) => {
				[["h", h], ["d", d]].forEach(([c, v]) => {
					const btn = card.querySelector(`[data-c="${i}-${c}-${pick[i + c]}"]`);
					btn.classList.remove("on", "ok", "ko"); btn.classList.add(pick[i + c] === v ? "ok" : "ko"); if(pick[i + c] !== v) bad++;
				});
			});
			if(bad){ err(); msg(`${bad} case${bad > 1 ? "s" : ""} à corriger. Indice : le PACS exonère de droits, mais ne fait pas de l'autre un héritier.`, "ko"); return; }
			ev.target.disabled = true; play("good"); msg("✓ Tableau juste.", "ok");
			card.querySelector("[data-after]").innerHTML = `<p class="gp-p" style="margin-top:8px">Si Jean-Baptiste meurt, <b>Sarah n'hérite de rien</b> : ses biens iraient à son père et à ses sœurs. Et même avec un testament, elle paierait 60 % de droits. <b>Quel est le meilleur conseil, sans se marier ?</b></p><div data-q></div>`;
			qcm(card.querySelector("[data-after] [data-q]"), [
				["av", "Souscrire une assurance-vie qui désigne Sarah comme bénéficiaire"],
				["test", "Rédiger un testament en faveur de Sarah, et c'est tout", "Utile, mais Sarah paierait 60 % de droits de succession (après un abattement d'à peine 1 594 €)."],
				["rien", "Ne rien faire : la loi protège les couples qui vivent ensemble", "Non : pour la loi, un concubin est un étranger en matière de succession."]
			], "av", a => {
				a.innerHTML = `<p class="gp-p" style="margin-top:8px">Le capital d'une assurance-vie est transmis hors succession : pour des versements faits avant 70 ans, chaque bénéficiaire reçoit jusqu'à <b>152 500 €</b> sans impôt. Autre piste : se pacser et rédiger un testament, car le partenaire de PACS est exonéré de droits.</p>${course("fisca")}${next("transmettre", "Préparer la transmission →")}`;
			});
		});
	}

	/* ---------- préparer la succession de Paul ---------- */
	function transmettre(){
		stage("La transmission");
		show(`<span class="gp-year">Aujourd'hui</span><h2 class="gp-h">Préparer la succession</h2>
			<div class="gp-story">À la mort de ses parents, Paul a hérité du corps de ferme (250 000 €), qu'il loue, et de 100 000 € d'actions du CAC 40, gardées en souvenir. Louise est célibataire à Paris.<span class="gp-ask">Comment préparer la succession de Paul ? Et celle de Paulette ?</span></div>
			<p class="gp-p">Bon outil ou fausse bonne idée ?</p><div data-s></div>`);
		sorter(card.querySelector("[data-s]"), shuffle([
			{ t:"Une donation-partage à ses trois enfants", d:"De son vivant, devant notaire", k:"ok", why:"Chaque parent peut donner 100 000 € par enfant sans droits, tous les 15 ans ; et la donation-partage fige les valeurs, ce qui évite les disputes.", hint:"elle utilise des abattements et prévient les conflits." },
			{ t:"Donner la nue-propriété de la ferme, garder l'usufruit", d:"Paul continue de percevoir les loyers", k:"ok", why:"Les droits ne portent que sur la nue-propriété ; au décès, les enfants deviennent pleins propriétaires sans rien payer de plus.", hint:"Paul garde les loyers et transmet à moindre coût." },
			{ t:"Tout léguer à Paulette par testament", d:"Pour la protéger au maximum", k:"ko", why:"Impossible : avec trois enfants, ceux-ci ont droit à ¾ de la succession (la réserve héréditaire). Paul ne peut librement donner que ¼.", hint:"les enfants ont des droits que le testament ne peut pas effacer." },
			{ t:"Léguer la ferme aux enfants de Paulette", d:"Pour que tout le monde soit traité pareil", k:"ko", why:"Ils ne sont pas ses enfants : ils paieraient 60 % de droits, et ce legs empiéterait sur la réserve des enfants de Paul.", hint:"pour la loi, quel lien ont-ils avec Paul ?" },
			{ t:"Verser sur une assurance-vie, même après 70 ans", d:"En désignant ses enfants ou petits-enfants", k:"ok", why:"Après 70 ans, 30 500 € de versements sont exonérés pour l'ensemble des bénéficiaires, et tous les gains le sont aussi.", hint:"un outil vu chez Jean-Baptiste, qui fonctionne encore après 70 ans." }
		]), [["ok", "👍 Bon outil"], ["ko", "⚠️ Fausse bonne idée"]], a => {
			a.innerHTML = `<p class="gp-p" style="margin-top:8px">Pour Paulette, même logique : ses enfants, des deux mariages, sont ses héritiers réservataires ; Paul n'est pas leur père. Le conseiller bâtit deux stratégies en parallèle, et les coordonne avec le notaire et l'expert-comptable.</p>${course("succ")}${next("end", "Remettre mon bilan patrimonial")}`;
		});
	}

	/* ---------- bilan ---------- */
	function finale(){
		stage("Bilan patrimonial");
		const e = S.errors, mention = e <= 3 ? "Très bien" : e <= 8 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention);
		play("win");
		const order = ["famille", "liquid", "succ", "place", "fisca"].filter(k => S.learned.has(k));
		show(`<div class="gp-k">${formation.name} · bilan</div><h2 class="gp-h">Dossier bouclé !</h2>
			<div class="gp-big">📜✅</div>
			<p class="gp-p" style="text-align:center">Mention <b>${mention}</b> · ${e} erreur${e > 1 ? "s" : ""} en chemin.</p>
			<p class="gp-p">Mariage, entreprise, immobilier, décès, placements, famille recomposée : presque chaque moment de la vie pose une question de patrimoine. C'est le métier de conseiller en gestion de patrimoine ou de banquier privé, que prépare le master, en alternance sur 2 ans. Tu as touché à :</p>
			<ul class="gp-list">${order.map(k => `<li><span>📚</span>${COURSES[k][0]}</li>`).join("")}</ul>
			${openLead ? `<button class="gp-go" data-a="lead">📄 Recevoir la plaquette du master</button>` : ""}
			<a class="gp-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir le Master Droit & Gestion du Patrimoine ↗</a>
			<button class="gp-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gp-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const STEPS = { mariage, biens, deces, placer, contrats, remariage, concubin, transmettre, end:finale };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(STEPS[k]) return STEPS[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set() }); root.querySelector("#gpErr").textContent = "⚖ 0 erreur"; return intro(); }
	});
	function close(){ if(closed) return; closed = true; document.removeEventListener("keydown", onKey); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".gp-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["1967 · Le mariage", mariage], ["1968-1985 · Propres ou communs", biens], ["1991 · La succession", deces], ["1991 · Placer l'héritage", placer], ["1997 · Les contrats de mariage", contrats], ["Le remariage", remariage], ["Le concubinage", concubin], ["La transmission", transmettre], ["Bilan patrimonial", finale]]);
	if(window.campus) window.campus.game = { S, card, ...STEPS };
}
