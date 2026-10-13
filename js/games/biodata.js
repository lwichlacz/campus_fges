/* « From Blood to Decision » — mini-jeu du Master Data Management in Biosciences (École du Numérique).
   En anglais, comme le master (enseigné 100 % en anglais). D'après la maquette des relations presse : un patient fatigué,
   une prise de sang, et la chaîne qui va de la biologie aux données, puis des données à la décision.
   - Mission 1 · build the pipeline : remettre dans l'ordre le parcours de l'échantillon (dont la pseudonymisation RGPD),
     écarter l'étape interdite ; les quatre phases (generation, preprocessing, analysis, interpretation) apparaissent ;
   - Mission 2 · clean the data : contrôle qualité de huit séquençages (score de qualité, lecture alignée, contamination, profondeur) ;
   - Mission 3 · find the variant : lire l'alignement, écarter l'erreur de séquençage et la variation bénigne, retenir HFE C282Y
     (hémochromatose héréditaire : surcharge en fer, fatigue chronique), puis formuler une recommandation prudente.
   Séquences et chiffres illustratifs ; contenu à relire par l'équipe pédagogique du master. */

const COURSES = {
	protect: ["M2", "Data protection", "Health data are among the most sensitive data there are. Pseudonymisation and GDPR rules come first, before any analysis."],
	stats:   ["M1", "Biostatistics", "Quality control is statistics: thresholds, distributions, outliers. One bad sample can bias a whole study."],
	bioinf:  ["M1", "Bioinformatics & databases", "Aligning reads to a reference genome and checking variant databases: the daily work of a bioinformatician."],
	disease: ["M1", "Disease biology", "Knowing the biology behind a variant, here iron metabolism, is what turns a letter change into a medical insight."],
	clin:    ["M2", "Clinical trials & epidemiology", "Data support decisions, they do not replace clinicians: confirm, test, and measure at population scale."]
};
// mention : codes du site (médailles), libellés en anglais
const MENTIONS = { "Très bien":"Highest distinction", "Bien":"Distinction", "Assez bien":"Pass" };

const CSS = `
.bd{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1f2a37;background:linear-gradient(160deg,#eef7f9,#f4f1fb);overflow:auto;animation:bdIn .35s ease both}
@keyframes bdIn{from{opacity:0}to{opacity:1}}
.bd *{box-sizing:border-box}
.bd-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;background:rgba(238,247,249,.92);backdrop-filter:blur(6px)}
.bd-chip{background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 4px 14px rgba(30,48,94,.1);white-space:nowrap}
.bd-chip.st{background:#1e305e;color:#fff}
.bd-chip.pt{color:#6b3fa0}
.bd-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(30,48,94,.15)}
.bd-grid{display:grid;grid-template-columns:270px minmax(0,1fr) 260px;gap:12px;padding:4px 12px 16px;max-width:1280px;margin:0 auto}
.bd-pan{background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:12px 14px;box-shadow:0 6px 18px rgba(30,48,94,.06)}
.bd-pan h4{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a}
.bd-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.bd-helix{width:100%;height:120px;display:block}
.bd-file p{margin:4px 0;font-size:13.5px;line-height:1.45}
.bd-file b{color:#1e305e}
.bd-mis .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.bd-mis h3{font:700 22px/1.2 Fraunces,Georgia,serif;margin:2px 0 6px}
.bd-mis p{margin:0 0 8px;font-size:14px;line-height:1.5}
.bd-live{font-weight:800;color:#1e305e;font-size:13.5px;margin:6px 0}
.bd-btn{border:0;border-radius:12px;padding:11px 14px;font:800 14.5px Nunito,sans-serif;cursor:pointer;background:#21b6ce;color:#0b2f67}
.bd-btn.dark{background:#1e305e;color:#fff}
.bd-btn.alt{background:#fff;border:2px solid #d3dae1;color:#1e305e}
.bd-btn:disabled{opacity:.45;cursor:default}
.bd-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.bd-term{font:600 12.5px/1.45 ui-monospace,Consolas,monospace;background:#16202b;color:#b9f3d0;border-radius:10px;padding:8px 10px;min-height:110px;max-height:260px;overflow:auto}
.bd-term .ko{color:#ff8b95}.bd-term .inf{color:#9ad7ff}
.bd-course{background:#f1ecfa;border-left:4px solid #8a5cc7;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}
.bd-course .tag{display:block;font-size:11px;font-weight:800;color:#6b3fa0;text-transform:uppercase;letter-spacing:.08em}
.bd-course b{display:block;margin:2px 0}
/* mission 1 : le pipeline */
.bd-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin:8px 0}
.bd-card{border:2px solid #dbe3ea;background:#fbfdff;border-radius:12px;padding:10px;text-align:left;font:700 13.5px/1.35 Nunito,sans-serif;cursor:pointer;display:flex;gap:8px;align-items:flex-start;color:#1f2a37}
.bd-card i{font-style:normal;font-size:20px;line-height:1}
.bd-card:hover{border-color:#21b6ce}
.bd-card.used{opacity:.3;pointer-events:none}
.bd-pipe{list-style:none;margin:8px 0;padding:0;counter-reset:s}
.bd-pipe li{counter-increment:s;display:flex;align-items:center;gap:10px;min-height:48px;border:2px dashed #c9d2db;border-radius:12px;padding:6px 10px;margin:6px 0;font-weight:700;font-size:13.5px;background:#fff;position:relative}
.bd-pipe li:before{content:counter(s);width:26px;height:26px;border-radius:50%;background:#1e305e;color:#fff;display:grid;place-items:center;font-size:12px;flex:none}
.bd-pipe li.full{border-style:solid;border-color:#21b6ce;cursor:pointer}
.bd-pipe li.bad{border-color:#ff4d5e;background:#fff3f4}
.bd-pipe li.ok{border-color:#3bd16f;background:#f1fcf5}
.bd-pipe li .ph{margin-left:auto;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b3fa0;background:#f1ecfa;border-radius:999px;padding:3px 9px;white-space:nowrap;animation:bdPop .4s ease both}
.bd-pipe li .emp{color:#8a95a1;font-weight:700}
@keyframes bdPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
/* mission 2 : contrôle qualité */
.bd-rules{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.bd-rules span{background:#eef7f9;border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:800;color:#0b7a8e}
.bd-tbl{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}
.bd-tbl th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5b6b7a;text-align:left;padding:6px;border-bottom:2px solid #e3e8ed}
.bd-tbl td{padding:7px 6px;border-bottom:1px solid #eef1f4;font-weight:700}
.bd-tbl td.off{color:#d6213a}
.bd-tbl tr.alex td:first-child{color:#6b3fa0}
.bd-tog{border:0;border-radius:999px;padding:6px 10px;font:800 12px Nunito,sans-serif;cursor:pointer;min-width:84px}
.bd-tog.keep{background:#dff6e8;color:#1c7a43}.bd-tog.drop{background:#ffe3e6;color:#b3132a}
.bd-tbl tr.wrong td{background:#fff3f4}
.bd-qc{width:100%;height:150px;display:block;margin:4px 0}
.bd-scroll{overflow-x:auto}
/* mission 3 : alignement */
.bd-pile{font:700 15px/1.25 ui-monospace,Consolas,monospace;background:#16202b;color:#d6dde6;border-radius:12px;padding:10px;overflow-x:auto;white-space:pre;user-select:none}
.bd-pile .ref{color:#82aaff}
.bd-pile .mm{color:#ff8b95;background:rgba(255,139,149,.12)}
.bd-pile .lq{color:#6b7480}
.bd-pile .col{cursor:pointer}
.bd-pile .col.sel{outline:2px solid #21b6ce;outline-offset:1px;border-radius:2px}
.bd-cand{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.bd-cand button{border:2px solid #dbe3ea;background:#fff;border-radius:12px;padding:8px 12px;font:800 13px Nunito,sans-serif;cursor:pointer}
.bd-cand button.sel{border-color:#21b6ce;background:#eef7f9}
.bd-db{background:#f6f8fa;border:1px solid #e3e8ed;border-radius:12px;padding:10px;font-size:13.5px;line-height:1.45;margin:6px 0}
.bd-db b{color:#1e305e}
.bd-choice{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.bd-choice button{border:2px solid #dbe3ea;background:#fff;border-radius:12px;padding:10px 12px;text-align:left;font:700 14px/1.4 Nunito,sans-serif;cursor:pointer;color:#1f2a37}
.bd-choice button:hover{border-color:#21b6ce}
/* cartes */
.bd-ov{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:14px;background:rgba(20,30,45,.35)}
.bd-ov[hidden]{display:none}
.bd-crd{max-width:520px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 50px rgba(20,30,45,.35);animation:bdUp .3s ease both}
@keyframes bdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.bd-crd h2{font:700 25px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.bd-crd .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.bd-crd p{font-size:14.5px;line-height:1.5;margin:0 0 10px}
.bd-crd ul{list-style:none;margin:0 0 12px;padding:0}
.bd-crd li{display:flex;gap:8px;align-items:center;background:#f2f5f7;border-radius:10px;padding:8px 10px;margin:5px 0;font-weight:700;font-size:14px}
.bd-crd li span{background:#1e305e;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px}
.bd-say{display:flex;gap:10px;align-items:flex-start;margin:8px 0}
.bd-say .av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:#eef7f9}
.bd-say .bub{background:#f2f5f7;border-radius:14px;padding:9px 12px;font-size:14px;line-height:1.45}
.bd-say.doc .av{background:#f1ecfa}
.bd-crd .bd-btn{width:100%;margin-top:6px}
.bd-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#1e305e;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:none}
.bd-big{font-size:46px;text-align:center;margin:4px 0}
.bd-lang{display:inline-block;background:#f1ecfa;color:#6b3fa0;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;margin-bottom:6px}
@media (max-width:900px){
	.bd-grid{grid-template-columns:minmax(0,1fr);padding:4px 10px 18px}
	.bd-pan{min-width:0}
	.bd-pile{font-size:12.5px}
	.bd-col{display:contents}
	#bdMis{order:1}#bdWork{order:2}#bdFile{order:3}#bdNote{order:4}#bdHelix{order:5}
	.bd-helix{height:90px}
	.bd-chip{padding:6px 10px;font-size:12.5px}
	#bdPt{display:none}
}
`;

export function openBiodata({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	if(!document.getElementById("bd-css")){ const st = document.createElement("style"); st.id = "bd-css"; st.textContent = CSS; document.head.appendChild(st); }
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "bd"; root.lang = "en";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-game From Blood to Decision");
	root.innerHTML = `
		<div class="bd-top"><span class="bd-chip st" id="bdSt">Bio-data lab</span><span class="bd-chip pt" id="bdPt">Patient: Alex, 27</span><span class="bd-chip" id="bdErr">0 error</span><button class="bd-x" aria-label="Close the game">×</button></div>
		<div class="bd-grid">
			<div class="bd-col">
				<div class="bd-pan" id="bdHelix"><h4>Sample P-0412</h4><canvas class="bd-helix" width="520" height="240"></canvas></div>
				<div class="bd-pan bd-file" id="bdFile"><h4>Patient file</h4>
					<p><b>Alex, 27</b>, student. Unusually tired for several months, joint pain. Rest and vitamins have not helped.</p>
					<p>Blood sample taken for a genetic analysis. In the lab, Alex becomes <b>P-0412</b>.</p></div>
			</div>
			<div class="bd-col">
				<div class="bd-pan bd-mis" id="bdMis"></div>
				<div class="bd-pan" id="bdWork"></div>
			</div>
			<div class="bd-col">
				<div class="bd-pan" id="bdNote"><h4>Lab notebook</h4><div class="bd-term" id="bdTerm"></div></div>
			</div>
		</div>
		<div class="bd-ov" id="bdOv"><div class="bd-crd" id="bdCard"></div></div>`;
	document.body.appendChild(root);
	const $ = s => root.querySelector(s);
	const S = { errors:0, mission:0, learned:new Set() };
	let closed = false;

	/* ---------- interface ---------- */
	const mis = $("#bdMis"), work = $("#bdWork"), term = $("#bdTerm");
	function log(t, cls = ""){ const d = document.createElement("div"); if(cls) d.className = cls; d.textContent = "> " + t; term.appendChild(d); while(term.children.length > 50) term.firstChild.remove(); term.scrollTop = term.scrollHeight; }
	function err(t){ S.errors++; play("bad"); $("#bdErr").textContent = `${S.errors} error${S.errors > 1 ? "s" : ""}`; if(t) log(t, "ko"); }
	function stage(t){ $("#bdSt").textContent = t; }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); return `<div class="bd-course"><span class="tag">📚 In the Master · ${y}</span><b>${n}</b>${t}</div>`; }
	function card(html){ $("#bdCard").innerHTML = html; $("#bdOv").hidden = false; }
	function uncard(){ $("#bdOv").hidden = true; }
	const shuffle = (a, seed = 7) => { let s = seed; const r = () => (s = (s*16807) % 2147483647)/2147483647; for(let i=a.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

	/* ---------- la double hélice qui tourne (en-tête) ---------- */
	const hc = $(".bd-helix"), hx = hc.getContext("2d");
	let raf = 0, t0 = performance.now(), helixHot = 0;
	function drawHelix(){
		raf = requestAnimationFrame(drawHelix);
		const t = (performance.now() - t0)/1000, W = hc.width, H = hc.height;
		hx.clearRect(0, 0, W, H);
		const base = ["#21b6ce", "#8a5cc7", "#e8963a", "#3bd16f"];
		for(let i=0;i<34;i++){
			const x = 20 + i*(W - 40)/33, a = t*1.6 + i*.45, y1 = H/2 + Math.sin(a)*H*.32, y2 = H/2 - Math.sin(a)*H*.32, z = Math.cos(a);
			hx.strokeStyle = i === helixHot ? "#ff4d5e" : base[i % 4]; hx.globalAlpha = .35 + .4*Math.abs(z); hx.lineWidth = i === helixHot ? 5 : 3;
			hx.beginPath(); hx.moveTo(x, y1); hx.lineTo(x, y2); hx.stroke();
			hx.globalAlpha = 1;
			for(const [y, f] of [[y1, z], [y2, -z]]){ hx.fillStyle = f > 0 ? "#1e305e" : "#9fb0c2"; hx.beginPath(); hx.arc(x, y, f > 0 ? 6 : 4.5, 0, Math.PI*2); hx.fill(); }
		}
	}
	drawHelix();

	/* ===================== MISSION 1 · build the pipeline ===================== */
	const STEPS = [
		{ id:"sample", i:"🩸", t:"Patient blood sample collected", ph:"Biological sample" },
		{ id:"pseudo", i:"🔒", t:"Pseudonymise the sample: Alex's name becomes code P-0412 (GDPR)", ph:"Data protection" },
		{ id:"seq",    i:"🧬", t:"DNA sequencing is performed", ph:"Data generation" },
		{ id:"clean",  i:"🧹", t:"Raw data are cleaned and organised (quality control)", ph:"Data preprocessing" },
		{ id:"ai",     i:"🖥️", t:"Bioinformatics and AI identify patterns or mutations", ph:"Data analysis" },
		{ id:"decide", i:"🩺", t:"Results support the medical team's decision", ph:"Interpretation" }
	];
	const TRAP = { id:"mail", i:"📧", t:"Email the raw file, with Alex's name, to a friend for a quick second opinion" };
	let m1 = null;
	function mission1(){
		S.mission = 1; stage("Mission 1 · Pipeline"); uncard();
		m1 = { slots:Array(6).fill(null), done:false, tries:0 };
		mis.innerHTML = `<span class="k">Mission 1 · data generation</span><h3>Build the bioscience data pipeline</h3>
			<p>Alex's blood sample has to become a useful medical decision. Tap the steps <b>in the right order</b> to build the pipeline. One card must <b>never</b> be part of it.</p>
			<p class="bd-live" id="m1live">6 steps to place</p>`;
		renderM1();
		log("Mission 1: build the pipeline for sample P-0412", "inf");
	}
	function renderM1(){
		const cards = shuffle([...STEPS, TRAP], 11);
		work.innerHTML = `<h4>Available steps</h4><div class="bd-cards">${cards.map(c => `<button class="bd-card ${m1.slots.includes(c.id) ? "used" : ""}" data-c="${c.id}"><i>${c.i}</i><span>${c.t}</span></button>`).join("")}</div>
			<h4>Your pipeline <small style="text-transform:none;letter-spacing:0;font-weight:700">(tap a step to remove it)</small></h4>
			<ol class="bd-pipe">${m1.slots.map((id, k) => { const c = id && (STEPS.find(s => s.id === id) || TRAP); return `<li class="${c ? "full" : ""}" data-s="${k}">${c ? `<i style="font-style:normal">${c.i}</i>${c.t}` : `<span class="emp">empty</span>`}</li>`; }).join("")}</ol>
			<div class="bd-row"><button class="bd-btn dark" id="m1check" ${m1.slots.every(Boolean) ? "" : "disabled"}>▶ Run the pipeline</button><button class="bd-btn alt" id="m1reset">Clear</button></div>`;
		work.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => {
			const k = m1.slots.indexOf(null); if(k < 0 || m1.done) return;
			m1.slots[k] = b.dataset.c; play("pop"); renderM1();
		}));
		work.querySelectorAll("li.full").forEach(li => li.addEventListener("click", () => { if(m1.done) return; m1.slots[+li.dataset.s] = null; renderM1(); }));
		$("#m1reset").addEventListener("click", () => { if(m1.done) return; m1.slots.fill(null); renderM1(); });
		$("#m1check").addEventListener("click", checkM1);
		const left = m1.slots.filter(s => !s).length;
		$("#m1live").textContent = left ? `${left} step${left > 1 ? "s" : ""} to place` : "Pipeline complete: run it!";
	}
	function checkM1(){
		m1.tries++;
		const s = m1.slots, lis = work.querySelectorAll(".bd-pipe li");
		if(s.includes("mail")){
			lis[s.indexOf("mail")].classList.add("bad");
			err("Blocked: identifiable health data must never leave the lab by email (GDPR, medical confidentiality)");
			$("#m1live").textContent = "One card has no place in a pipeline: remove it.";
			return;
		}
		// la pseudonymisation peut se faire au prélèvement ou juste après le séquençage, mais avant tout traitement des données
		const order = ["sample", "seq", "clean", "ai", "decide"], core = s.filter(x => x !== "pseudo");
		const okCore = order.every((id, k) => core[k] === id), pi = s.indexOf("pseudo"), okPseudo = pi > 0 && pi < s.indexOf("clean");
		if(okCore && okPseudo){
			m1.done = true; play("good");
			lis.forEach((li, k) => { li.classList.add("ok"); const st = STEPS.find(x => x.id === s[k]); li.insertAdjacentHTML("beforeend", `<span class="ph" style="animation-delay:${k*.12}s">${st.ph}</span>`); });
			log("Pipeline validated: sample → protection → generation → preprocessing → analysis → interpretation");
			$("#m1check").disabled = true;
			setTimeout(() => card(`<div class="k">Mission 1 complete</div><h2>From biology to data</h2>
				<p>Every analysis starts with a biological sample and ends with an interpretation. In between: data generation, preprocessing and analysis. And before anything else, <b>the patient's identity is protected</b>.</p>
				${course("protect")}<button class="bd-btn dark" data-a="m2">Mission 2 · clean the data →</button>`), 1300);
			return;
		}
		// ordre attendu, la pseudonymisation restant là où le joueur l'a mise si elle est permise (2e ou 3e)
		const ideal = pi === 2 ? ["sample", "seq", "pseudo", "clean", "ai", "decide"] : ["sample", "pseudo", "seq", "clean", "ai", "decide"];
		lis.forEach((li, k) => li.classList.toggle("bad", s[k] !== ideal[k]));
		err(!okPseudo ? "Pseudonymisation must happen before the data are processed" : "The order is not right yet: what has to exist before you can clean data?");
		$("#m1live").textContent = "Steps in red are in the wrong place.";
	}

	/* ===================== MISSION 2 · clean the data ===================== */
	// huit séquençages du même lot ; trois ne passent pas le contrôle qualité (P-0412 = Alex, il passe)
	const RUNS = [
		{ id:"P-0398", q:36, map:97, cont:.4, dp:42 },
		{ id:"P-0405", q:24, map:93, cont:.6, dp:38, why:"mean quality 24 < 30: too many uncertain bases" },
		{ id:"P-0412", q:35, map:96, cont:.3, dp:45, alex:true },
		{ id:"P-0417", q:34, map:95, cont:7.2, dp:40, why:"7.2 % contamination: the sample was mixed with foreign DNA" },
		{ id:"P-0421", q:37, map:98, cont:.2, dp:51 },
		{ id:"P-0426", q:33, map:92, cont:.8, dp:12, why:"depth 12× < 30×: too few reads to trust a variant" },
		{ id:"P-0430", q:31, map:91, cont:1.6, dp:33 },
		{ id:"P-0433", q:36, map:97, cont:.5, dp:47 }
	];
	const RULE = r => r.q >= 30 && r.map >= 90 && r.cont <= 2 && r.dp >= 30;
	let m2 = null;
	function mission2(){
		S.mission = 2; stage("Mission 2 · Quality control"); uncard();
		m2 = { keep:Object.fromEntries(RUNS.map(r => [r.id, true])), done:false };
		mis.innerHTML = `<span class="k">Mission 2 · data preprocessing</span><h3>Clean the data</h3>
			<p>The sequencer returned 8 samples from the same batch, Alex's included. Before any analysis, apply the lab's <b>quality rules</b>: keep only the samples that pass all four.</p>
			<div class="bd-rules"><span>Quality ≥ 30</span><span>Mapped reads ≥ 90 %</span><span>Contamination ≤ 2 %</span><span>Depth ≥ 30×</span></div>
			<p class="bd-live" id="m2live">Tap Keep / Exclude for each sample</p>`;
		renderM2();
		log("Mission 2: quality control of 8 sequencing runs", "inf");
	}
	function renderM2(wrong = []){
		work.innerHTML = `<h4>Mean base quality per sample (Phred score)</h4><canvas class="bd-qc" width="760" height="300"></canvas>
			<div class="bd-scroll"><table class="bd-tbl"><thead><tr><th>Sample</th><th>Quality</th><th>Mapped</th><th>Contam.</th><th>Depth</th><th>Decision</th></tr></thead><tbody>
			${RUNS.map(r => `<tr class="${r.alex ? "alex" : ""} ${wrong.includes(r.id) ? "wrong" : ""}"><td>${r.id}${r.alex ? " · Alex" : ""}</td><td class="${r.q < 30 ? "off" : ""}">${r.q}</td><td class="${r.map < 90 ? "off" : ""}">${r.map} %</td><td class="${r.cont > 2 ? "off" : ""}">${r.cont} %</td><td class="${r.dp < 30 ? "off" : ""}">${r.dp}×</td>
				<td><button class="bd-tog ${m2.keep[r.id] ? "keep" : "drop"}" data-r="${r.id}">${m2.keep[r.id] ? "✓ Keep" : "✗ Exclude"}</button></td></tr>`).join("")}
			</tbody></table></div>
			<div class="bd-row"><button class="bd-btn dark" id="m2run">▶ Run quality control</button></div>`;
		drawQC();
		work.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => { if(m2.done) return; m2.keep[b.dataset.r] = !m2.keep[b.dataset.r]; play("pop"); renderM2(); }));
		$("#m2run").addEventListener("click", checkM2);
		const ex = RUNS.filter(r => !m2.keep[r.id]).length;
		$("#m2live").textContent = `${8 - ex} kept · ${ex} excluded`;
	}
	function drawQC(){
		const c = work.querySelector(".bd-qc"), x = c.getContext("2d"), W = c.width, H = c.height, pad = 36, bw = (W - pad - 10)/RUNS.length;
		const Y = q => H - 30 - (H - 50)*(q - 15)/25;
		x.clearRect(0, 0, W, H);
		x.fillStyle = "rgba(255,77,94,.08)"; x.fillRect(pad, Y(30), W - pad - 10, Y(15) - Y(30));
		x.strokeStyle = "#d6213a"; x.setLineDash([8, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(pad, Y(30)); x.lineTo(W - 10, Y(30)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#d6213a"; x.font = "800 18px Nunito, sans-serif"; x.fillText("threshold 30", W - 130, Y(30) - 8);
		RUNS.forEach((r, i) => {
			const bx = pad + i*bw + bw*.18, w = bw*.64;
			x.fillStyle = r.alex ? "#8a5cc7" : m2.keep[r.id] ? "#21b6ce" : "#c9d2db";
			x.fillRect(bx, Y(r.q), w, Y(15) - Y(r.q));
			x.fillStyle = "#5b6b7a"; x.font = "700 16px Nunito, sans-serif"; x.fillText(r.id.slice(2), bx + 2, H - 8);
		});
		x.fillStyle = "#5b6b7a"; x.font = "700 15px Nunito, sans-serif"; x.fillText("40", 4, Y(40) + 5); x.fillText("30", 4, Y(30) + 5); x.fillText("20", 4, Y(20) + 5);
	}
	function checkM2(){
		const wrong = RUNS.filter(r => m2.keep[r.id] !== RULE(r)).map(r => r.id);
		if(!wrong.length){
			m2.done = true; play("good");
			RUNS.filter(r => !RULE(r)).forEach(r => log(`${r.id} excluded: ${r.why}`));
			log("5 samples passed QC, including P-0412 (Alex)");
			$("#m2run").disabled = true;
			setTimeout(() => card(`<div class="k">Mission 2 complete</div><h2>Clean data, honest results</h2>
				<p>Three samples were excluded: low quality, contamination, not enough depth. Analysed anyway, they could have produced <b>false mutations</b>. Alex's sample is clean: the analysis can start.</p>
				${course("stats")}<button class="bd-btn dark" data-a="m3">Mission 3 · find the variant →</button>`), 700);
			return;
		}
		// une erreur par contrôle raté (pas une par échantillon), le détail va dans le cahier de labo
		err(`Quality control failed: ${wrong.length} decision${wrong.length > 1 ? "s" : ""} to fix`);
		for(const id of wrong){ const r = RUNS.find(x => x.id === id); log(RULE(r) ? `${id} passes all four rules: keep it` : `${id} should be excluded: ${r.why}`, "ko"); }
		$("#m2live").textContent = `${wrong.length} decision${wrong.length > 1 ? "s" : ""} to fix (highlighted)`;
		renderM2(wrong);
	}

	/* ===================== MISSION 3 · find the variant ===================== */
	// alignement illustratif de lectures sur une portion du gène HFE ; trois positions candidates
	const REF = "TGGCAAGGGTAAACAGATCCCCTCCTACGTGCAC";
	const CANDS = {
		a:{ pos:6,  alt:"T", count:1, q:"low",  label:"Position A", db:"No entry in variant databases. A single read out of 12, with a low base-quality score: this is a <b>sequencing error</b>, not a real variant." },
		b:{ pos:15, alt:"A", count:12, q:"high", label:"Position B", db:"<b>HFE c.845G&gt;A · p.Cys282Tyr (C282Y)</b>. Classified <b>pathogenic</b>. Two copies (all reads) cause <b>hereditary haemochromatosis</b>: the body stores too much iron. Typical signs: chronic fatigue, joint pain." },
		c:{ pos:26, alt:"T", count:6, q:"high", label:"Position C", db:"Common variant, found in a large share of the general population. Classified <b>benign</b>: no known effect on health." }
	};
	const READS = (() => {
		const rows = [];
		for(let k=0;k<12;k++){
			const start = (k*3) % 7, len = REF.length - start - (k % 3);
			let s = " ".repeat(start);
			for(let p=start; p<start + len; p++){
				let ch = REF[p], cls = "";
				if(p === CANDS.b.pos){ ch = CANDS.b.alt; cls = "mm"; }
				else if(p === CANDS.c.pos && k % 2 === 0){ ch = CANDS.c.alt; cls = "mm"; }
				else if(p === CANDS.a.pos && k === 4){ ch = CANDS.a.alt; cls = "mm lq"; }
				s += cls ? `<span class="${cls} col" data-p="${p}">${ch}</span>` : `<span class="col" data-p="${p}">${ch === REF[p] ? "." : ch}</span>`;
			}
			rows.push(s);
		}
		return rows;
	})();
	let m3 = null;
	function mission3(){
		S.mission = 3; stage("Mission 3 · Variant"); uncard();
		m3 = { sel:null, looked:new Set(), reported:false, done:false };
		mis.innerHTML = `<span class="k">Mission 3 · data analysis & interpretation</span><h3>Find the variant</h3>
			<p>Alex's reads are aligned on the reference genome (top line, in blue). A dot means "same as the reference"; a red letter is a difference. Inspect the three candidate positions, <b>check the database</b>, then report the one that explains Alex's symptoms. <small>(Illustrative sequence.)</small></p>
			<p class="bd-live" id="m3live">Select a position</p>`;
		renderM3();
		log("Mission 3: 12 reads aligned on gene HFE (chromosome 6)", "inf");
	}
	function renderM3(){
		const refLine = `<span class="ref">${[...REF].map((ch, p) => `<span class="col" data-p="${p}">${ch}</span>`).join("")}</span>  reference`;
		work.innerHTML = `<h4>Read alignment · gene HFE</h4>
			<div class="bd-pile" id="pile">${refLine}\n${READS.join("\n")}</div>
			<div class="bd-cand">${Object.entries(CANDS).map(([k, c]) => `<button data-k="${k}" class="${m3.sel === k ? "sel" : ""}">${c.label} · ${c.count}/12 reads differ</button>`).join("")}</div>
			<div id="m3info"></div>`;
		work.querySelectorAll("[data-k]").forEach(b => b.addEventListener("click", () => select(b.dataset.k)));
		work.querySelectorAll("#pile .col").forEach(sp => sp.addEventListener("click", () => { const k = Object.keys(CANDS).find(k => CANDS[k].pos === +sp.dataset.p); if(k) select(k); }));
		if(m3.sel) showInfo();
	}
	function select(k){
		if(m3.reported) return;
		m3.sel = k; play("pop");
		helixHot = 6 + Object.keys(CANDS).indexOf(k)*9;
		work.querySelectorAll("#pile .col").forEach(sp => sp.classList.toggle("sel", +sp.dataset.p === CANDS[k].pos));
		work.querySelectorAll("[data-k]").forEach(b => b.classList.toggle("sel", b.dataset.k === k));
		showInfo();
	}
	function showInfo(){
		const k = m3.sel, c = CANDS[k], looked = m3.looked.has(k);
		$("#m3info").innerHTML = `<div class="bd-db"><b>${c.label}</b> · reference ${REF[c.pos]} → ${c.alt} in ${c.count} of 12 reads · base quality ${c.q}
			${looked ? `<br><br>🔎 ${c.db}` : ""}</div>
			<div class="bd-row">${looked ? "" : `<button class="bd-btn alt" id="m3db">🔎 Check the variant database</button>`}<button class="bd-btn dark" id="m3rep">Report this variant</button></div>`;
		$("#m3db") && $("#m3db").addEventListener("click", () => { m3.looked.add(k); log(`Database lookup: ${c.label}`); showInfo(); });
		$("#m3rep").addEventListener("click", report);
		$("#m3live").textContent = `${c.label} selected`;
	}
	function report(){
		const k = m3.sel;
		if(k !== "b"){ err(k === "a" ? "Reported a sequencing error: one low-quality read is not a variant" : "Reported a benign variant: frequent, and with no effect on health"); return; }
		m3.reported = true; play("good");
		log("Variant reported: HFE C282Y, homozygous (12/12 reads)");
		mis.querySelector("h3").textContent = "Advise the medical team";
		mis.querySelector("p").innerHTML = "You found a variant linked to iron overload. Which message do you send to Alex's doctor?";
		$("#m3live").textContent = "Choose the right message";
		const opts = shuffle([
			["ok", "The data show a variant linked to iron overload (HFE C282Y, two copies). We recommend iron blood tests (ferritin, transferrin saturation) and a specialist consultation to confirm."],
			["over", "The AI has diagnosed haemochromatosis with certainty: start the treatment today, no other test needed."],
			["under", "Genetic data cannot tell us anything: ignore the result and prescribe more rest."]
		], 5);
		work.innerHTML = `<h4>Your message to the medical team</h4><div class="bd-choice">${opts.map(([k, t]) => `<button data-m="${k}">${t}</button>`).join("")}</div>`;
		work.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => {
			if(m3.done) return;
			if(b.dataset.m === "ok"){ m3.done = true; play("win"); log("Message sent: confirm with iron tests and a specialist"); finale(); }
			else err(b.dataset.m === "over" ? "Data support decisions, they never replace clinicians and confirmation tests" : "The variant is a real lead: ignoring it would leave Alex without care");
		}));
	}

	/* ===================== fin ===================== */
	function finale(){
		const e = S.errors, code = e <= 2 ? "Très bien" : e <= 5 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", code);
		const order = ["protect", "stats", "bioinf", "disease", "clin"];
		S.learned.add("bioinf"); S.learned.add("disease"); S.learned.add("clin");
		card(`<div class="k">Lab validated · ${MENTIONS[code]}</div><h2>From biology to data, from data to decision</h2>
			<div class="bd-big">🧬✅</div>
			<p>Alex's blood test became a useful medical decision: a protected sample, clean data, a variant found and checked, and a careful message to the doctors. <b>This is what the Master in Data Management in Biosciences is about.</b> ${e ? `Errors on the way: ${e}.` : "Not a single error!"}</p>
			${course("bioinf")}${course("disease")}${course("clin")}
			<ul>${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="bd-btn dark" data-a="lead">📄 Get the programme brochure</button>` : ""}
			<a class="bd-alt" href="${formation.url}" target="_blank" rel="noopener">Discover the Master ↗</a>
			<button class="bd-alt" data-a="fav">${isFav() ? "♥ In my notebook" : "♡ Add to my notebook"}</button>
			<button class="bd-alt" data-a="replay">Play again</button>`);
	}
	function intro(){
		stage("Bio-data lab");
		mis.innerHTML = `<span class="k">Wenov · École du Numérique</span><h3>From Blood to Decision</h3><p>A patient, a blood test, and the data science that turns it into a medical decision.</p>`;
		work.innerHTML = `<p style="margin:0;font-size:14px;color:#5b6b7a">The missions will appear here.</p>`;
		card(`<span class="bd-lang">🇬🇧 In English, like the Master</span><div class="k">Mini-game · ${formation.name}</div><h2>From Blood to Decision</h2>
			<div class="bd-say"><div class="av">🧑</div><div class="bub">Doctor, I've been feeling unusually tired for several months, and the treatments I've tried haven't really helped.</div></div>
			<div class="bd-say doc"><div class="av">👩‍⚕️</div><div class="bub">Your symptoms could have several causes. I'd like to run a blood test and look more closely at your biological data.</div></div>
			<p>Can you help the medical team turn Alex's blood sample into a useful medical decision?</p>
			<ul><li><span>1</span>Build the data pipeline</li><li><span>2</span>Clean the sequencing data</li><li><span>3</span>Find the variant and advise the doctors</li></ul>
			<button class="bd-btn dark" data-a="m1">Start the analysis</button>`);
	}

	/* ---------- actions ---------- */
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "m1") return mission1();
		if(k === "m2") return mission2();
		if(k === "m3") return mission3();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ In my notebook" : "♡ Add to my notebook"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ S.errors = 0; S.learned = new Set(); helixHot = 0; $("#bdErr").textContent = "0 error"; term.innerHTML = ""; return mission1(); }
	});
	function close(){
		if(closed) return; closed = true;
		cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey);
		root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".bd-x").addEventListener("click", close);
	intro();
	onEvent && onEvent("start");
	if(window.campus) window.campus.game = { S, mission1, mission2, mission3, get m1(){ return m1; }, get m2(){ return m2; }, get m3(){ return m3; }, RUNS, RULE, CANDS };
}
