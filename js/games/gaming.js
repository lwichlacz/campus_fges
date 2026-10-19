/* « Projet Gaming » — mini-jeu de la Licence Informatique (École du Numérique, Wenov).
   Le joueur rejoint le Projet Gaming de L1 : un petit jeu de balle qu'il faut programmer, puis faire vivre en ligne.
   - L1 · programmation : compléter la fonction de rebond, la tester sur deux tirs (le code tourne vraiment) ;
   - L1 · bases de données : composer la requête SQL du tableau des meilleurs scores ;
   - L2 · cryptologie (parcours Cyber) : déchiffrer un message codé par décalage, choisir comment stocker les mots de passe ;
   - L3 · machine learning (parcours Data) : régler un détecteur de tricheurs, sans accuser les innocents.
   Joueurs, pseudos et scores sont fictifs. Contenu à relire par un enseignant de la licence. */

const COURSES = {
	prog:   ["L1", "Programmation et Projet Gaming", "Variables, conditions, fonctions… et un jeu vidéo à construire en équipe pendant toute la première année."],
	bdd:    ["L1", "Bases de données", "Ranger les données dans des tables et les interroger en SQL : le cœur de presque toutes les applications."],
	crypto: ["L2", "Cryptologie (parcours Cyber)", "Chiffrer, déchiffrer, hacher : protéger les données et comprendre comment on les attaque."],
	ml:     ["L3", "Machine learning (parcours Data)", "Apprendre à partir des données pour prédire ou détecter, en mesurant ses erreurs."]
};
const SCORES = [["NeoPixel", 1840, 7], ["Lou_42", 2310, 9], ["kraken", 960, 4], ["Zoé.dev", 2750, 11], ["Bitboy", 1490, 6], ["Maya", 2105, 8], ["xX_Max_Xx", 640, 3], ["Inès", 1975, 8]];
const SECRET = "LE TOURNOI COMMENCE A MIDI";
const SHIFT = 3;
const caesar = (s, k) => s.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));

const CSS = `
.gm{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1d2238;overflow:auto;animation:gmIn .35s ease both;
	background:radial-gradient(circle at 20% 10%,#2b3570 0,#151a36 55%,#0e1126 100%)}
@keyframes gmIn{from{opacity:0}to{opacity:1}}
.gm-top{position:sticky;top:0;z-index:3;display:flex;gap:8px;align-items:center;padding:10px;background:linear-gradient(#0e1126ee,#0e112600)}
.gm-chip{background:#fff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.gm-stage{background:#7c5cff;color:#fff}
.gm-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.gm-wrap{max-width:720px;margin:0 auto;padding:6px 14px 48px}
.gm-card{background:#fff;border-radius:18px;padding:20px 18px 18px;box-shadow:0 18px 50px rgba(0,0,0,.35);animation:gmCard .35s ease both}
@keyframes gmCard{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.gm-k{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6a4ce0}
.gm-h{font:700 24px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.gm-p{font-size:15px;line-height:1.5;margin:6px 0}
.gm-big{font-size:46px;text-align:center}
.gm-list{list-style:none;padding:0;margin:8px 0;display:grid;gap:6px}
.gm-list li{background:#f4f2fb;border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700}
.gm-list li span{color:#6a4ce0;font-weight:800;margin-right:6px}
.gm-go{display:block;width:100%;margin-top:12px;border:0;border-radius:12px;padding:14px;font:800 16px Nunito,sans-serif;background:#7c5cff;color:#fff;cursor:pointer}
.gm-go:disabled{opacity:.5;cursor:default}
.gm-alt{display:block;width:100%;margin-top:8px;border:1.5px solid #d8d2f2;border-radius:12px;padding:11px;font:700 15px Nunito,sans-serif;background:#fff;color:#3b2f80;cursor:pointer;text-align:center;text-decoration:none}
.gm-code{background:#161a33;color:#e6e8ff;border-radius:12px;padding:12px 14px;font:13.5px/1.75 ui-monospace,Menlo,Consolas,monospace;overflow-x:auto;white-space:pre}
.gm-code .kw{color:#c792ea}.gm-code .cm{color:#7f8bb3}
.gm-code select{font:13px ui-monospace,Menlo,monospace;background:#2c3266;color:#ffe08a;border:1px solid #5560a8;border-radius:6px;padding:2px 4px;cursor:pointer}
.gm-code select.ko{border-color:#ff6b6b;box-shadow:0 0 0 2px #ff6b6b55}
.gm-cv{display:block;width:100%;max-width:520px;margin:10px auto;border-radius:12px;background:#0e1126;aspect-ratio:520 / 260}
.gm-msg{border-radius:10px;padding:10px 12px;font-size:14px;font-weight:700;margin-top:8px}
.gm-msg.ok{background:#e7f6ec;color:#22693c}.gm-msg.ko{background:#fdeceb;color:#a3322a}.gm-msg.in{background:#eef0ff;color:#3b2f80}
.gm-tbl{width:100%;border-collapse:collapse;font-size:14px;margin:6px 0}
.gm-tbl th{font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#6e6a85;text-align:left;padding:4px 6px}
.gm-tbl td{padding:6px;border-top:1px solid #ebe8f5;font-variant-numeric:tabular-nums}
.gm-opts{display:grid;gap:8px;margin-top:8px}
.gm-opt{border:1.5px solid #d8d2f2;border-radius:10px;background:#fff;padding:11px 12px;font:700 14.5px Nunito,sans-serif;text-align:left;cursor:pointer;color:#1d2238}
.gm-opt.ok{border-color:#2f8a4f;background:#e7f6ec}.gm-opt.ko{border-color:#c0392b;background:#fdeceb}
.gm-cipher{font:700 20px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-align:center;background:#161a33;color:#9dfcb4;border-radius:12px;padding:14px 10px;word-break:break-word}
.gm-range{width:100%;accent-color:#7c5cff}
.gm-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-weight:800;font-size:14px}
.gm-row label{flex:1;min-width:200px}
.gm-course{background:#fff;border:2px solid #7c5cff;border-radius:10px;padding:12px 14px;margin:10px 0 4px}
.gm-course .tag{display:inline-block;background:#efeaff;color:#4b35b8;font-weight:800;font-size:12px;border-radius:999px;padding:3px 9px;margin-bottom:6px}
.gm-course b{display:block;font:700 17px Fraunces,Georgia,serif;margin-bottom:3px}
.gm-course span{font-size:14px;color:#4f4a65}
@media (max-width:440px){ .gm-h{font-size:21px} .gm-card{padding:16px 12px 14px} .gm-code{font-size:12px} }
`;

export function openGaming({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("gm-css")){ const st = document.createElement("style"); st.id = "gm-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "gm"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-jeu Projet Gaming");
	root.innerHTML = `<div class="gm-top"><span class="gm-chip gm-stage" id="gmStage">Projet Gaming</span><span class="gm-chip" id="gmErr">🐞 0 erreur</span><button class="gm-x" aria-label="Quitter le jeu">×</button></div>
		<div class="gm-wrap"><div class="gm-card"></div></div>`;
	document.body.appendChild(root);
	const card = root.querySelector(".gm-card");
	const S = { errors:0, learned:new Set() };
	let closed = false, anim = 0;
	const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
	function show(html){ cancelAnimationFrame(anim); card.onclick = null; card.innerHTML = html; card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; root.scrollTo({ top:0, behavior:"smooth" }); }
	function stage(t){ root.querySelector("#gmStage").textContent = t; onEvent && onEvent("stage", t); }
	function err(why){ S.errors++; play("bad"); onEvent && onEvent("err", why); root.querySelector("#gmErr").textContent = `🐞 ${S.errors} erreur${S.errors > 1 ? "s" : ""}`; }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="gm-course"><span class="tag">📚 En Licence Informatique · ${y}</span><b>${n}</b><span>${t}</span></div>`; }
	function msg(el, cls, t){ el.className = "gm-msg " + cls; el.textContent = t; el.hidden = false; }
	function qcm(el, opts, good, onOk){
		el.innerHTML = `<div class="gm-opts">${opts.map(([v, t]) => `<button class="gm-opt" data-q="${v}">${t}</button>`).join("")}</div><div data-after></div>`;
		el.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => {
			if(el.querySelector(".gm-opt.ok")) return;
			if(b.dataset.q !== good){ err(b.textContent); b.classList.add("ko"); return; }
			b.classList.add("ok"); play("good"); onOk(el.querySelector("[data-after]"));
		}));
	}

	/* ---------- intro ---------- */
	function intro(){
		stage("Projet Gaming");
		show(`<div class="gm-k">Mini-jeu · ${formation.name}</div><h2 class="gm-h">Projet Gaming</h2>
			<div class="gm-big">🎮👾</div>
			<p class="gm-p">En L1, chaque équipe de la licence construit son propre <b>jeu vidéo</b> pendant toute l'année. Le tien : un jeu de balle à deux raquettes. Il bugue, il n'a pas encore de tableau des scores… et il va vite attirer des tricheurs. À toi de jouer, avec les outils de chaque année.</p>
			<ul class="gm-list"><li><span>L1</span>Programmer le rebond de la balle</li><li><span>L1</span>Afficher les meilleurs scores en SQL</li><li><span>L2</span>Protéger les comptes des joueurs (Cyber)</li><li><span>L3</span>Repérer les tricheurs avec les données (Data)</li></ul>
			<p class="gm-p" style="font-size:13.5px;color:#5d5978">Pas besoin de savoir programmer : tout s'apprend en licence.</p>
			<button class="gm-go" data-a="m1">Ouvrir le code du jeu</button>`);
	}

	/* ---------- L1 · programmation : la fonction de rebond ---------- */
	const BL = {
		a:[["raquette.y", "raquette.y"], ["0", "0"], ["balle.y", "balle.y"]],
		b:[["raquette.y + raquette.hauteur", "raquette.y + raquette.hauteur"], ["raquette.hauteur", "raquette.hauteur"], ["600", "600"]],
		c:[["-balle.vx", "-balle.vx"], ["0", "0"], ["balle.vx + 1", "balle.vx + 1"]]
	};
	function mission1(){
		stage("L1 · Programmation");
		const sel = k => `<select data-b="${k}" aria-label="Trou ${k.toUpperCase()}"><option value="">?</option>${shuffle(BL[k]).map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
		show(`<div class="gm-k">L1 · programmation · Projet Gaming</div><h2 class="gm-h">La balle traverse la raquette !</h2>
			<p class="gm-p">Ton équipe a écrit la fonction qui fait rebondir la balle sur la raquette de gauche, mais il manque trois morceaux. Complète-les, puis <b>teste</b> : le jeu tire une balle <b>sur</b> la raquette (elle doit rebondir), puis une balle <b>au-dessus</b> et une <b>en dessous</b> (elles doivent sortir).</p>
			<div class="gm-code"><span class="kw">function</span> rebond(balle, raquette) {
  <span class="kw">if</span> (balle.x &lt;= raquette.x + raquette.largeur
      &amp;&amp; balle.y &gt;= ${sel("a")}
      &amp;&amp; balle.y &lt;= ${sel("b")}) {
    balle.vx = ${sel("c")};  <span class="cm">// la balle repart dans l'autre sens</span>
  }
}</div>
			<canvas class="gm-cv" width="520" height="260" aria-label="Terrain de jeu : test de la fonction de rebond"></canvas>
			<div class="gm-msg in">Le terrain : la raquette à gauche, la balle arrive de la droite.</div>
			<button class="gm-go" data-a="run">▶ Tester le code</button><div data-end></div>`);
		drawPong(null);
	}
	function drawPong(st){
		const cv = card.querySelector(".gm-cv"); if(!cv) return;
		const c = cv.getContext("2d"), P = { x:24, y:95, largeur:12, hauteur:70 };
		c.fillStyle = "#0e1126"; c.fillRect(0, 0, 520, 260);
		c.strokeStyle = "#2b3466"; c.setLineDash([8, 10]); c.beginPath(); c.moveTo(260, 0); c.lineTo(260, 260); c.stroke(); c.setLineDash([]);
		c.fillStyle = "#7c5cff"; c.fillRect(P.x, P.y, P.largeur, P.hauteur);
		if(st){ c.fillStyle = st.hit === false ? "#ff6b6b" : "#9dfcb4"; c.beginPath(); c.arc(st.x, st.y, 8, 0, 7); c.fill();
			if(st.label){ c.fillStyle = "#e6e8ff"; c.font = "700 15px Nunito, sans-serif"; c.fillText(st.label, 290, 30); } }
		return P;
	}
	function runPong(){
		const card1 = card, m = card.querySelector(".gm-msg"), btn = card.querySelector("[data-a=run]");
		const pick = {}; let missing = false;
		card.querySelectorAll("select[data-b]").forEach(s => { pick[s.dataset.b] = s.value; s.classList.toggle("ko", !s.value); if(!s.value) missing = true; });
		if(missing) return msg(m, "ko", "Choisis une valeur pour chaque trou avant de tester.");
		btn.disabled = true;
		// le code choisi est réellement exécuté sur deux tirs
		const P = { x:24, y:95, largeur:12, hauteur:70 };
		const lo = b => pick.a === "raquette.y" ? P.y : pick.a === "0" ? 0 : b.y;
		const hi = () => pick.b === "raquette.y + raquette.hauteur" ? P.y + P.hauteur : pick.b === "raquette.hauteur" ? P.hauteur : 600;
		const bounce = b => pick.c === "-balle.vx" ? -b.vx : pick.c === "0" ? 0 : b.vx + 1;
		const shots = [{ y:130, vy:0, label:"Tir 1 : sur la raquette" }, { y:40, vy:0, label:"Tir 2 : au-dessus" }, { y:220, vy:0, label:"Tir 3 : en dessous" }];
		let i = 0, b = null, t0 = 0;
		const results = [];
		function next(){
			if(i >= shots.length) return done();
			const s = shots[i]; b = { x:480, y:s.y, vx:-6, vy:s.vy }; t0 = 0;
			anim = requestAnimationFrame(step);
		}
		function step(){
			if(card1 !== card || !card.querySelector(".gm-cv")) return;
			t0++;
			b.x += b.vx; b.y += b.vy;
			if(b.x - 8 <= P.x + P.largeur && b.vx < 0 && b.y >= lo(b) && b.y <= hi()) b.vx = bounce(b);
			const s = shots[i];
			let res = null;
			if(b.x < -10) res = "sortie";
			else if(b.vx > 0 && b.x > 300) res = "rebond";
			else if(t0 > 200) res = b.vx === 0 ? "arrêt" : "sortie";
			drawPong({ x:b.x, y:b.y, label:s.label });
			if(res){ results.push(res); i++; setTimeout(next, 350); return; }
			anim = requestAnimationFrame(step);
		}
		function done(){
			btn.disabled = false;
			const [r1, r2, r3] = results;
			if(r1 === "rebond" && r2 === "sortie" && r3 === "sortie"){
				play("good"); msg(m, "ok", "✓ Tir 1 : la balle rebondit. Tirs 2 et 3 : elles sortent. Ton rebond fonctionne !");
				btn.hidden = true; card.querySelectorAll("select").forEach(s => s.disabled = true);
				card.querySelector("[data-end]").innerHTML = `${course("prog")}<p class="gm-p">Une <b>condition</b> (if), des <b>variables</b> (balle.x, raquette.y) et une <b>fonction</b> : les briques de tous les programmes, vues dès la L1.</p><button class="gm-go" data-a="m2">Mission suivante : les scores</button>`;
				return;
			}
			let why = "Le code ne fait pas ce qu'on attend : relis chaque trou.";
			if(pick.c === "0") why = "Tir 1 : la balle s'arrête net contre la raquette. Pour repartir dans l'autre sens, il faut inverser la vitesse : -balle.vx.";
			else if(pick.c === "balle.vx + 1") why = "Tir 1 : la balle ralentit et colle à la raquette ! Ajouter 1 ne fait que freiner la balle : pour qu'elle reparte, il faut inverser sa vitesse (-balle.vx).";
			else if(r2 === "rebond") why = "Tir 2 : la balle rebondit sur du vide, au-dessus de la raquette ! La balle doit être plus bas que le haut de la raquette : balle.y >= raquette.y.";
			else if(r3 === "rebond") why = "Tir 3 : la balle rebondit sur du vide, sous la raquette ! La balle doit être plus haut que le bas de la raquette : balle.y <= raquette.y + raquette.hauteur.";
			else if(r1 !== "rebond") why = "Tir 1 : la balle traverse la raquette. Vérifie les bornes : la balle doit être entre raquette.y et raquette.y + raquette.hauteur.";
			err(why.split(" ! ")[0]); msg(m, "ko", why);
		}
		next();
	}

	/* ---------- L1 · bases de données : le tableau des scores ---------- */
	function mission2(){
		stage("L1 · Bases de données");
		const sel = (k, opts) => `<select data-q="${k}" aria-label="${k}"><option value="">?</option>${opts.map(o => `<option>${o}</option>`).join("")}</select>`;
		show(`<div class="gm-k">L1 · bases de données</div><h2 class="gm-h">Le podium des meilleurs joueurs</h2>
			<p class="gm-p">Les parties sont enregistrées dans la table <b>scores</b>. L'écran d'accueil du jeu doit afficher le <b>podium</b> : les <b>3 meilleurs scores</b>, du plus haut au plus bas. Compose la requête SQL.</p>
			<table class="gm-tbl"><thead><tr><th colspan="3">Table scores · ${SCORES.length} lignes</th></tr><tr><th>pseudo</th><th>score</th><th>niveau</th></tr></thead><tbody>${SCORES.slice(0, 4).map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}<tr><td colspan="3" style="color:#8a86a3">… et ${SCORES.length - 4} autres lignes</td></tr></tbody></table>
			<div class="gm-code"><span class="kw">SELECT</span> ${sel("col", shuffle(["pseudo, score", "niveau", "*"]))}
<span class="kw">FROM</span> ${sel("from", shuffle(["scores", "joueurs"]))}
<span class="kw">ORDER BY</span> score ${sel("ord", shuffle(["DESC", "ASC"]))}
<span class="kw">LIMIT</span> ${sel("lim", shuffle(["3", "10", "1"]))};</div>
			<button class="gm-go" data-a="sql">▶ Exécuter la requête</button>
			<div class="gm-msg in" hidden></div><div data-res></div><div data-end></div>`);
	}
	function runSql(){
		const q = {}; let missing = false;
		card.querySelectorAll("select[data-q]").forEach(s => { q[s.dataset.q] = s.value; s.classList.toggle("ko", !s.value); if(!s.value) missing = true; });
		const m = card.querySelector(".gm-msg"), res = card.querySelector("[data-res]");
		if(missing) return msg(m, "ko", "Choisis une valeur dans chaque liste.");
		if(q.from === "joueurs"){ res.innerHTML = ""; err("table joueurs inexistante"); return msg(m, "ko", "Erreur SQL : la table « joueurs » n'existe pas. Les parties sont rangées dans la table scores."); }
		const cols = q.col === "*" ? ["pseudo", "score", "niveau"] : q.col === "niveau" ? ["niveau"] : ["pseudo", "score"];
		const rows = [...SCORES].sort((a, b) => q.ord === "DESC" ? b[1] - a[1] : a[1] - b[1]).slice(0, +q.lim);
		const idx = { pseudo:0, score:1, niveau:2 };
		res.innerHTML = `<table class="gm-tbl"><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[idx[c]]}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
		if(q.ord === "ASC"){ err("ORDER BY ASC"); return msg(m, "ko", "Ce sont les plus petits scores ! ASC trie du plus petit au plus grand ; pour un podium, il faut DESC."); }
		if(q.lim !== "3"){ err("LIMIT " + q.lim); return msg(m, "ko", q.lim === "1" ? "Il ne reste que le premier : le podium en veut trois." : "Trop de lignes : LIMIT fixe le nombre de résultats, il en faut trois."); }
		if(q.col === "niveau"){ err("colonne niveau seule"); return msg(m, "ko", "On ne voit que des niveaux : impossible de savoir qui est sur le podium. Il faut le pseudo et le score."); }
		play("good");
		msg(m, "ok", q.col === "*" ? "✓ Le bon podium ! (avec * on récupère toutes les colonnes ; pseudo, score suffisait.)" : "✓ Le podium s'affiche : Zoé.dev, Lou_42 et Maya.");
		card.querySelector("[data-a=sql]").hidden = true; card.querySelectorAll("select").forEach(s => s.disabled = true);
		card.querySelector("[data-end]").innerHTML = `${course("bdd")}<button class="gm-go" data-a="m3">Mission suivante : la sécurité</button>`;
	}

	/* ---------- L2 · cryptologie (parcours Cyber) ---------- */
	function mission3(){
		stage("L2 · Cryptologie");
		const coded = caesar(SECRET, SHIFT);
		show(`<div class="gm-k">L2 · cryptologie · parcours Cyber</div><h2 class="gm-h">Un message codé dans le chat du jeu</h2>
			<p class="gm-p">Un joueur a posté ce message chiffré par <b>décalage</b> (le code de César : chaque lettre est décalée du même nombre de rangs dans l'alphabet). Trouve le décalage pour le lire.</p>
			<div class="gm-cipher" data-out>${coded}</div>
			<div class="gm-row"><label>Décalage : <b data-k>0</b><input class="gm-range" type="range" min="0" max="25" value="0" aria-label="Décalage"></label></div>
			<button class="gm-go" data-a="crack">C'est lisible !</button><div class="gm-msg in" hidden></div><div data-end></div>`);
		const r = card.querySelector("input[type=range]");
		r.addEventListener("input", () => { card.querySelector("[data-k]").textContent = r.value; card.querySelector("[data-out]").textContent = caesar(coded, -r.value); });
	}
	function crack(){
		const k = +card.querySelector("input[type=range]").value, m = card.querySelector(".gm-msg");
		if(k !== SHIFT){ err("décalage " + k); return msg(m, "ko", "Ce n'est pas encore du français. Fais glisser le curseur jusqu'à lire une phrase."); }
		play("good"); msg(m, "ok", `✓ « ${SECRET.toLowerCase()} » : un décalage de 3. Avec seulement 25 possibilités, un ordinateur casse ce code en un instant.`);
		card.querySelector("[data-a=crack]").hidden = true; card.querySelector("input[type=range]").disabled = true;
		const end = card.querySelector("[data-end]");
		end.innerHTML = `<p class="gm-p" style="margin-top:10px"><b>Le jeu a maintenant des comptes joueurs.</b> Comment stocker leurs mots de passe dans la base de données ?</p><div data-q></div>`;
		qcm(end.querySelector("[data-q]"), shuffle([["hash", "Les « hacher » avec un sel : on ne garde qu'une empreinte, impossible à inverser"], ["clair", "En clair : c'est plus simple pour les renvoyer aux joueurs qui les oublient"], ["cesar", "Chiffrés avec le code de César, comme le message"]]), "hash", x => {
			x.innerHTML = `<p class="gm-p" style="margin-top:8px">À la connexion, on hache le mot de passe tapé et on compare les empreintes. Si la base fuit, les pirates n'obtiennent que des empreintes ; le <b>sel</b>, différent pour chaque joueur, empêche de les retrouver avec des tables toutes faites.</p>${course("crypto")}<button class="gm-go" data-a="m4">Mission suivante : les tricheurs</button>`;
		});
	}

	/* ---------- L3 · machine learning (parcours Data) : le détecteur de tricheurs ---------- */
	// précision des tirs (%) et temps de réaction moyen (ms) de 28 joueurs ; t = tricheur (logiciel de visée), vérifié à la main
	const PLAYERS = [[52,310],[61,280],[47,350],[66,260],[58,295],[71,240],[44,380],[63,270],[55,330],[69,250],[49,300],[74,225],[60,315],[57,265],[65,290],[53,345],[68,235],[62,305],[50,320],[72,255],
		[86,205,"pro"],[95,120,"t"],[97,95,"t"],[93,135,"t"],[98,110,"t"],[91,150,"t"],[89,190,"pro"],[90,175]];
	function mission4(){
		stage("L3 · Machine learning");
		show(`<div class="gm-k">L3 · machine learning · parcours Data</div><h2 class="gm-h">Des tricheurs dans le classement</h2>
			<p class="gm-p">Certains joueurs utilisent un logiciel de visée automatique. Chaque point est un joueur : à droite, ceux qui visent juste ; en haut, ceux qui réagissent vite. Règle les deux seuils : le jeu <b>signale</b> les joueurs dans la zone rouge.</p>
			<p class="gm-p"><b>Objectif :</b> signaler les 5 tricheurs connus, sans accuser plus d'un joueur honnête.</p>
			<canvas class="gm-cv" width="520" height="300" style="aspect-ratio:520 / 300" aria-label="Nuage de points des joueurs : précision et temps de réaction"></canvas>
			<div class="gm-row"><label>Précision au moins : <b data-pv>80</b> %<input class="gm-range" data-p type="range" min="50" max="99" value="80"></label>
			<label>Réaction en moins de : <b data-rv>250</b> ms<input class="gm-range" data-r type="range" min="80" max="350" step="5" value="250"></label></div>
			<div class="gm-msg in" data-live></div>
			<button class="gm-go" data-a="ml">Valider le détecteur</button><div data-end></div>`);
		const upd = () => drawPlayers();
		card.querySelectorAll(".gm-range").forEach(r => r.addEventListener("input", upd));
		upd();
	}
	function thresholds(){ return [+card.querySelector("[data-p]").value, +card.querySelector("[data-r]").value]; }
	function drawPlayers(reveal){
		const cv = card.querySelector(".gm-cv"); if(!cv) return;
		const c = cv.getContext("2d"), W = 520, H = 300, [P, R] = thresholds();
		card.querySelector("[data-pv]").textContent = P; card.querySelector("[data-rv]").textContent = R;
		const X = p => 40 + (p - 40)/60*(W - 60), Y = r => 20 + (r - 80)/320*(H - 60);
		c.fillStyle = "#0e1126"; c.fillRect(0, 0, W, H);
		c.fillStyle = "rgba(255,107,107,.16)"; c.fillRect(X(P), Y(80), W - 20 - X(P), Y(R) - Y(80));
		c.strokeStyle = "#ff6b6b"; c.lineWidth = 2; c.strokeRect(X(P), Y(80), W - 20 - X(P), Y(R) - Y(80));
		c.fillStyle = "#8a92c4"; c.font = "12px Nunito, sans-serif";
		c.fillText("précision des tirs →", W - 150, H - 12); c.save(); c.translate(14, 150); c.rotate(-Math.PI/2); c.fillText("← réaction plus rapide", -60, 0); c.restore();
		let caught = 0, wrong = 0;
		for(const [p, r, k] of PLAYERS){
			const flag = p >= P && r <= R;
			if(flag && k === "t") caught++; if(flag && k !== "t") wrong++;
			c.beginPath(); c.arc(X(p), Y(r), 6, 0, 7);
			c.fillStyle = reveal ? (k === "t" ? "#ff6b6b" : "#9dfcb4") : (flag ? "#ffb4b4" : "#c9cdf0"); c.fill();
		}
		const live = card.querySelector("[data-live]");
		if(live) live.textContent = `Signalés : ${caught + wrong} joueur${caught + wrong > 1 ? "s" : ""}.`;
		return { caught, wrong };
	}
	function validateMl(){
		const { caught, wrong } = drawPlayers(true), m = card.querySelector("[data-live]");
		if(caught < 5){ err(`${caught}/5 tricheurs`); drawPlayers(); return msg(m, "ko", `Seulement ${caught} tricheur${caught > 1 ? "s" : ""} sur 5 signalé${caught > 1 ? "s" : ""} : la zone rouge est trop petite. (Les points rouges étaient les tricheurs.)`); }
		if(wrong > 1){ err(`${wrong} innocents signalés`); setTimeout(() => drawPlayers(), 1600); return msg(m, "ko", `Les 5 tricheurs sont pris… mais ${wrong} joueurs honnêtes aussi : ce sont des faux positifs. Resserre les seuils.`); }
		play("good");
		msg(m, "ok", wrong ? "✓ 5 tricheurs sur 5, et un seul joueur honnête signalé par erreur : un très bon détecteur, mais pas parfait." : "✓ 5 tricheurs sur 5, sans aucun innocent : un détecteur parfait sur ces données.");
		card.querySelector("[data-a=ml]").hidden = true; card.querySelectorAll(".gm-range").forEach(r => r.disabled = true);
		const end = card.querySelector("[data-end]");
		end.innerHTML = `<p class="gm-p" style="margin-top:10px">Demain, un joueur professionnel très rapide est signalé. <b>Que fait le studio ?</b></p><div data-q></div>`;
		qcm(end.querySelector("[data-q]"), shuffle([["humain", "Un modérateur vérifie ses parties avant toute sanction"], ["ban", "Bannissement automatique : le modèle ne se trompe pas"], ["off", "On supprime le détecteur : il est injuste"]]), "humain", x => {
			x.innerHTML = `<p class="gm-p" style="margin-top:8px">Aucun modèle n'est parfait : il y a toujours des <b>faux positifs</b>. En data, on mesure ces erreurs et on garde un humain dans la boucle quand une décision touche une personne.</p>${course("ml")}<button class="gm-go" data-a="end">Voir le bilan du projet</button>`;
		});
	}

	/* ---------- bilan ---------- */
	function finale(){
		stage("Bilan du Projet Gaming");
		const e = S.errors, mention = e <= 2 ? "Très bien" : e <= 6 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", mention);
		play("win");
		const order = ["prog", "bdd", "crypto", "ml"].filter(k => S.learned.has(k));
		show(`<div class="gm-k">Licence Informatique · bilan</div><h2 class="gm-h">Ton jeu est en ligne !</h2>
			<div class="gm-big">🏆🎮</div>
			<p class="gm-p" style="text-align:center">Projet réussi, mention <b>${mention}</b> (${e} erreur${e > 1 ? "s" : ""} en chemin).</p>
			<p class="gm-p">Tu as programmé, interrogé une base de données, protégé des comptes et entraîné un détecteur : ${order.length} cours de la licence, de la L1 à la L3. En L2, on choisit son parcours (Data, Cyber, ou IoT et réalité virtuelle) ; la L3 peut se faire en alternance.</p>
			<ul class="gm-list">${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="gm-go" data-a="lead">📄 Recevoir la plaquette de la licence</button>` : ""}
			<a class="gm-alt" href="${formation.url}" target="_blank" rel="noopener">Découvrir la Licence Informatique ↗</a>
			<button class="gm-alt" data-a="fav">${isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"}</button>
			<button class="gm-alt" data-a="replay">Rejouer</button>`);
	}

	/* ---------- actions ---------- */
	const GO = { m1:mission1, m2:mission2, m3:mission3, m4:mission4, run:runPong, sql:runSql, crack, ml:validateMl, end:finale };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(GO[k]) return GO[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ Dans mon carnet" : "♡ Ajouter à mon carnet"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ Object.assign(S, { errors:0, learned:new Set() }); root.querySelector("#gmErr").textContent = "🐞 0 erreur"; return intro(); }
	});
	function close(){ if(closed) return; closed = true; cancelAnimationFrame(anim); document.removeEventListener("keydown", onKey); root.remove(); onClose && onClose(); }
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	root.querySelector(".gm-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["L1 · Programmer le rebond", mission1], ["L1 · Le podium en SQL", mission2], ["L2 · Cryptologie", mission3], ["L3 · Détecteur de tricheurs", mission4], ["Bilan", finale]]);
	if(window.campus) window.campus.game = { S, card, mission1, mission2, mission3, mission4, finale };
}
