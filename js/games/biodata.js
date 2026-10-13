/* « From Blood to Decision » — mini-jeu du Master Data Management in Biosciences (École du Numérique).
   En anglais, comme le master (enseigné 100 % en anglais), et au niveau d'un candidat en master (bac+3/4) : environ 12 à 15 minutes.
   D'après la maquette des relations presse (un patient fatigué, une prise de sang, « from biology to data, from data to decision »),
   prolongée du cas individuel à l'étude de cohorte, en six missions :
   1. data governance : minimisation et pseudonymisation du dossier, chaîne complète (consentement, hébergeur certifié HDS) ;
   2. sequencing QC : coupe des lectures sur la courbe de qualité par position, contrôle de 8 échantillons
      (dont une inversion d'échantillons repérée par le contrôle du sexe génétique et un doublon) ;
   3. variant interpretation : fréquence allélique (VAF) et zygotie, classement de type ACMG à partir de preuves ;
   4. cohort biostatistics : 240 patients simulés, choix du test sur une distribution asymétrique, p-value, effet du sexe ;
   5. machine learning : choix des variables (fuites de données), découpage par patient, seuil sur la courbe ROC ;
   6. report & ethics : compte rendu clinique prudent, découverte fortuite (BRCA2) traitée selon le consentement.
   Cas : hémochromatose HFE C282Y homozygote. Séquences, cohorte et chiffres sont simulés ; contenu à relire par l'équipe du master. */

const COURSES = {
	protect: ["M2", "Data protection & health data", "GDPR, data minimisation, pseudonymisation, certified hosting (HDS): health data are handled before they are analysed."],
	biotech: ["M1", "Biotechnologies", "Sequencers make errors that grow along each read. Knowing the technology tells you where to trim and what to distrust."],
	stats:   ["M1", "Biostatistics", "Thresholds, distributions, the right test for skewed data, and what a p-value really says."],
	bioinf:  ["M1", "Bioinformatics & databases", "Aligning reads, measuring allele fractions, querying ClinVar and population databases to classify a variant."],
	disease: ["M1", "Disease biology", "HFE haemochromatosis: iron absorption, incomplete penetrance, and why men and women differ."],
	epi:     ["M2", "Epidemiology", "From one patient to a cohort: confounding, stratification, effect sizes with their uncertainty."],
	ml:      ["M1", "AI & machine learning", "Feature selection, data leakage, patient-level validation, ROC curves and decision thresholds."],
	bigdata: ["M2", "Data mining & Big Data", "Pipelines that scale from one genome to thousands, and models that stay honest on new data."],
	clin:    ["M2", "Clinical trials & regulation", "Reports that clinicians can act on, consent, and incidental findings handled the right way."]
};
const MENTIONS = { "Très bien":"Highest distinction", "Bien":"Distinction", "Assez bien":"Pass" };
const NM = 6;

/* ---------- petite boîte à outils ---------- */
function rng(seed){ let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
function gauss(r){ return Math.sqrt(-2*Math.log(r() + 1e-9))*Math.cos(2*Math.PI*r()); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n-1)/2] : (s[n/2-1] + s[n/2])/2) : 0; };
const fmt = (v, d = 0) => v.toFixed(d);
function shuffle(a, seed){ const r = rng(seed); for(let i=a.length-1;i>0;i--){ const j = Math.floor(r()*(i+1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- la cohorte simulée (consultation « fatigue inexpliquée ») ---------- */
function makeCohort(){
	const r = rng(2026), P = [];
	for(let i=0;i<240;i++){
		const g = i < 24 ? 2 : i < 84 ? 1 : 0, sex = r() < .5 ? "M" : "F", male = sex === "M";
		const ts = clamp(g === 2 ? (male ? 62 : 50) + 15*gauss(r) : g === 1 ? 38 + 10*gauss(r) : 30 + 9*gauss(r), 8, 98);
		const fmed = g === 2 ? (male ? 600 : 250) : g === 1 ? (male ? 190 : 130) : (male ? 130 : 75);
		const fer = fmed*Math.exp((g === 2 ? .7 : .6)*gauss(r));
		const alt = clamp((g === 2 && male ? 45 : 28) + 11*gauss(r), 8, 140);
		const hb = (male ? 14.6 : 13.1) + 1.1*gauss(r);
		const age = Math.round(22 + r()*50);
		const phleb = g === 2 && r() < .7 ? 2 + Math.floor(r()*18) : 0;          // saignées déjà faites : connues seulement après le diagnostic
		P.push({ g, sex, ts, fer, alt, hb, age, phleb, key:g === 2 ? r()*.35 : r() });
	}
	// numéro d'inscription : les homozygotes, adressés d'abord par l'hépatologie, ont souvent les premiers numéros (une fuite)
	[...P].sort((a, b) => a.key - b.key).forEach((p, k) => p.id = k + 1);
	P.forEach((p, k) => p.test = ((k*7919) % 10) < 3);          // 30 % des patients en test, découpés par patient
	return P;
}

/* ---------- régression logistique (descente de gradient) et courbe ROC ---------- */
function fitPredict(P, feats){
	const tr = P.filter(p => !p.test), te = P.filter(p => p.test);
	const val = (p, f) => f === "sex" ? (p.sex === "M" ? 1 : 0) : f === "fer" ? Math.log(p.fer) : p[f];
	const mu = {}, sd = {};
	for(const f of feats){ const v = tr.map(p => val(p, f)); mu[f] = v.reduce((s, x) => s + x, 0)/v.length; sd[f] = Math.sqrt(v.reduce((s, x) => s + (x - mu[f])**2, 0)/v.length) || 1; }
	const X = p => feats.map(f => (val(p, f) - mu[f])/sd[f]);
	let w = feats.map(() => 0), b = -1.5;
	for(let it=0; it<400; it++){
		const gw = w.map(() => 0); let gb = 0;
		for(const p of tr){ const x = X(p), z = b + x.reduce((s, v, k) => s + v*w[k], 0), e = 1/(1 + Math.exp(-z)) - (p.g === 2 ? 1 : 0); gb += e; x.forEach((v, k) => gw[k] += e*v); }
		b -= .3*gb/tr.length; w = w.map((v, k) => v - .3*gw[k]/tr.length);
	}
	return te.map(p => ({ y:p.g === 2 ? 1 : 0, s:1/(1 + Math.exp(-(b + X(p).reduce((s, v, k) => s + v*w[k], 0)))) }));
}
function rocOf(pred){
	const pos = pred.filter(p => p.y).length, neg = pred.length - pos, pts = [];
	for(let t=0; t<=1.0001; t+=.01){ const tp = pred.filter(p => p.y && p.s >= t).length, fp = pred.filter(p => !p.y && p.s >= t).length; pts.push({ t, sens:tp/pos, spec:1 - fp/neg }); }
	let auc = 0; const sorted = [...pts].sort((a, b) => (1 - a.spec) - (1 - b.spec) || a.sens - b.sens);
	for(let i=1;i<sorted.length;i++) auc += ((1 - sorted[i].spec) - (1 - sorted[i-1].spec))*(sorted[i].sens + sorted[i-1].sens)/2;
	return { pts, auc:Math.min(1, Math.max(0, auc)), pos, neg };
}

const CSS = `
.bd{position:fixed;inset:0;z-index:40;font-family:Nunito,system-ui,sans-serif;color:#1f2a37;background:linear-gradient(160deg,#eef7f9,#f4f1fb);overflow:auto;animation:bdIn .35s ease both}
@keyframes bdIn{from{opacity:0}to{opacity:1}}
.bd *{box-sizing:border-box}
.bd-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;background:rgba(238,247,249,.94);backdrop-filter:blur(6px)}
.bd-chip{background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 4px 14px rgba(30,48,94,.1);white-space:nowrap}
.bd-chip.st{background:#1e305e;color:#fff}
.bd-chip.pt{color:#6b3fa0}
.bd-dots{display:flex;gap:5px;align-items:center;background:#fff;border-radius:999px;padding:9px 12px;box-shadow:0 4px 14px rgba(30,48,94,.1)}
.bd-dots i{width:10px;height:10px;border-radius:50%;background:#dbe3ea}
.bd-dots i.on{background:#21b6ce}.bd-dots i.done{background:#8a5cc7}
.bd-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(30,48,94,.15)}
.bd-grid{display:grid;grid-template-columns:260px minmax(0,1fr) 280px;gap:12px;padding:4px 12px 16px;max-width:1340px;margin:0 auto}
.bd-pan{background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:12px 14px;box-shadow:0 6px 18px rgba(30,48,94,.06);min-width:0}
.bd-pan h4{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a}
.bd-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.bd-helix{width:100%;height:110px;display:block}
.bd-file p{margin:4px 0;font-size:13px;line-height:1.45}
.bd-file b{color:#1e305e}
.bd-skills{display:flex;flex-wrap:wrap;gap:5px}
.bd-skills span{background:#f1ecfa;color:#6b3fa0;border-radius:999px;padding:3px 9px;font-size:11.5px;font-weight:800}
.bd-skills em{font-style:normal;color:#8a95a1;font-size:12.5px}
.bd-mis .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.bd-mis h3{font:700 22px/1.2 Fraunces,Georgia,serif;margin:2px 0 6px}
.bd-mis p{margin:0 0 8px;font-size:14px;line-height:1.55}
.bd-step{display:inline-block;background:#eef7f9;color:#0b7a8e;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;margin-bottom:6px}
.bd-live{font-weight:800;color:#1e305e;font-size:13.5px;margin:6px 0}
.bd-btn{border:0;border-radius:12px;padding:11px 14px;font:800 14.5px Nunito,sans-serif;cursor:pointer;background:#21b6ce;color:#0b2f67}
.bd-btn.dark{background:#1e305e;color:#fff}
.bd-btn.alt{background:#fff;border:2px solid #d3dae1;color:#1e305e}
.bd-btn:disabled{opacity:.45;cursor:default}
.bd-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
.bd-term{font:600 12.5px/1.45 ui-monospace,Consolas,monospace;background:#16202b;color:#b9f3d0;border-radius:10px;padding:8px 10px;min-height:120px;max-height:300px;overflow:auto}
.bd-term .ko{color:#ff8b95}.bd-term .inf{color:#9ad7ff}
.bd-code{font:600 12px/1.5 ui-monospace,Consolas,monospace;background:#16202b;color:#d6dde6;border-radius:10px;padding:8px 10px;white-space:pre;overflow-x:auto;margin:8px 0 0}
.bd-code .c{color:#7d8896}.bd-code .s{color:#e6c07b}.bd-code .k{color:#c792ea}
.bd-course{background:#f1ecfa;border-left:4px solid #8a5cc7;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}
.bd-course .tag{display:block;font-size:11px;font-weight:800;color:#6b3fa0;text-transform:uppercase;letter-spacing:.08em}
.bd-course b{display:block;margin:2px 0}
.bd-fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin:8px 0}
.bd-field{border:2px solid #dbe3ea;border-radius:12px;padding:9px 10px;background:#fbfdff}
.bd-field b{display:block;font-size:12px;color:#5b6b7a;text-transform:uppercase;letter-spacing:.05em}
.bd-field span{display:block;font-weight:800;margin:2px 0 6px;font-size:14px}
.bd-field.bad{border-color:#ff4d5e;background:#fff3f4}
.bd-seg{display:flex;gap:4px}
.bd-seg button{flex:1;border:0;border-radius:8px;padding:6px 4px;font:800 12px Nunito,sans-serif;cursor:pointer;background:#eef1f4;color:#4b5866}
.bd-seg button.on.keep{background:#dff6e8;color:#1c7a43}.bd-seg button.on.tr{background:#fff1d6;color:#8a5a00}.bd-seg button.on.rm{background:#ffe3e6;color:#b3132a}
.bd-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin:8px 0}
.bd-card{border:2px solid #dbe3ea;background:#fbfdff;border-radius:12px;padding:10px;text-align:left;font:700 13.5px/1.35 Nunito,sans-serif;cursor:pointer;display:flex;gap:8px;align-items:flex-start;color:#1f2a37}
.bd-card i{font-style:normal;font-size:20px;line-height:1}
.bd-card:hover{border-color:#21b6ce}
.bd-card.used{opacity:.3;pointer-events:none}
.bd-pipe{list-style:none;margin:8px 0;padding:0;counter-reset:s}
.bd-pipe li{counter-increment:s;display:flex;align-items:center;gap:10px;min-height:46px;border:2px dashed #c9d2db;border-radius:12px;padding:6px 10px;margin:6px 0;font-weight:700;font-size:13.5px;background:#fff}
.bd-pipe li:before{content:counter(s);width:26px;height:26px;border-radius:50%;background:#1e305e;color:#fff;display:grid;place-items:center;font-size:12px;flex:none}
.bd-pipe li.full{border-style:solid;border-color:#21b6ce;cursor:pointer}
.bd-pipe li.bad{border-color:#ff4d5e;background:#fff3f4}.bd-pipe li.ok{border-color:#3bd16f;background:#f1fcf5}
.bd-pipe li .ph{margin-left:auto;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b3fa0;background:#f1ecfa;border-radius:999px;padding:3px 9px;white-space:nowrap;animation:bdPop .4s ease both}
.bd-pipe li .emp{color:#8a95a1}
@keyframes bdPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.bd-rules{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.bd-rules span{background:#eef7f9;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800;color:#0b7a8e}
.bd-scroll{overflow-x:auto}
.bd-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin:6px 0;min-width:640px}
.bd-tbl th{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5b6b7a;text-align:left;padding:6px 5px;border-bottom:2px solid #e3e8ed}
.bd-tbl td{padding:7px 5px;border-bottom:1px solid #eef1f4;font-weight:700}
.bd-tbl tr.alex td:first-child{color:#6b3fa0}
.bd-tbl tr.wrong td{background:#fff3f4}
.bd-tog{border:0;border-radius:999px;padding:6px 10px;font:800 12px Nunito,sans-serif;cursor:pointer;min-width:84px}
.bd-tog.keep{background:#dff6e8;color:#1c7a43}.bd-tog.drop{background:#ffe3e6;color:#b3132a}
.bd-chart{width:100%;display:block;margin:4px 0;background:#fbfdff;border-radius:10px}
.bd-slider{display:grid;grid-template-columns:150px 1fr 70px;gap:10px;align-items:center;font-weight:800;font-size:13.5px;margin:8px 0}
.bd-slider input{width:100%;accent-color:#21b6ce}
.bd-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:8px 0}
.bd-kpi div{background:#f6f8fa;border-radius:12px;padding:8px 10px}
.bd-kpi b{display:block;font-size:20px;color:#1e305e}
.bd-kpi span{font-size:11.5px;font-weight:800;color:#5b6b7a;text-transform:uppercase;letter-spacing:.05em}
.bd-kpi .good b{color:#1c7a43}.bd-kpi .bad b{color:#b3132a}
.bd-pile{font:700 15px/1.25 ui-monospace,Consolas,monospace;background:#16202b;color:#d6dde6;border-radius:12px;padding:10px;overflow-x:auto;white-space:pre;user-select:none}
.bd-pile .ref{color:#82aaff}.bd-pile .mm{color:#ff8b95;background:rgba(255,139,149,.12)}.bd-pile .lq{color:#6b7480}
.bd-var{border:2px solid #dbe3ea;border-radius:14px;padding:10px 12px;margin:8px 0;background:#fbfdff}
.bd-var.bad{border-color:#ff4d5e}
.bd-var h5{margin:0 0 6px;font-size:14.5px}
.bd-ev{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin:6px 0}
.bd-ev div{background:#fff;border:1px solid #e3e8ed;border-radius:10px;padding:6px 8px;font-size:12.5px;line-height:1.4}
.bd-ev div b{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5b6b7a}
.bd-opts{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.bd-opts button{border:2px solid #dbe3ea;background:#fff;border-radius:999px;padding:6px 11px;font:800 12.5px Nunito,sans-serif;cursor:pointer;color:#1f2a37}
.bd-opts button.on{border-color:#21b6ce;background:#e4f6f9}
.bd-choice{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.bd-choice button{border:2px solid #dbe3ea;background:#fff;border-radius:12px;padding:10px 12px;text-align:left;font:700 14px/1.45 Nunito,sans-serif;cursor:pointer;color:#1f2a37}
.bd-choice button:hover{border-color:#21b6ce}
.bd-choice button.on{border-color:#21b6ce;background:#e4f6f9}
.bd-choice button.bad{border-color:#ff4d5e;background:#fff3f4}
.bd-feat{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin:8px 0}
.bd-feat label{display:flex;gap:8px;align-items:flex-start;border:2px solid #dbe3ea;border-radius:12px;padding:8px 10px;font-weight:700;font-size:13px;cursor:pointer;background:#fbfdff}
.bd-feat label.on{border-color:#21b6ce;background:#e4f6f9}
.bd-feat small{display:block;color:#5b6b7a;font-weight:600}
.bd-consent{background:#f6f8fa;border:1px dashed #b9c4cf;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.6;margin:8px 0}
.bd-ov{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:14px;background:rgba(20,30,45,.35)}
.bd-ov[hidden]{display:none}
.bd-crd{max-width:560px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 50px rgba(20,30,45,.35);animation:bdUp .3s ease both}
@keyframes bdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.bd-crd h2{font:700 25px/1.15 Fraunces,Georgia,serif;margin:4px 0 8px}
.bd-crd .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0b7a8e;font-weight:800}
.bd-crd p{font-size:14.5px;line-height:1.55;margin:0 0 10px}
.bd-crd ul{list-style:none;margin:0 0 12px;padding:0}
.bd-crd li{display:flex;gap:8px;align-items:center;background:#f2f5f7;border-radius:10px;padding:7px 10px;margin:5px 0;font-weight:700;font-size:13.5px}
.bd-crd li span{background:#1e305e;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px;flex:none}
.bd-say{display:flex;gap:10px;align-items:flex-start;margin:8px 0}
.bd-say .av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:#eef7f9}
.bd-say .bub{background:#f2f5f7;border-radius:14px;padding:9px 12px;font-size:14px;line-height:1.45}
.bd-say.doc .av{background:#f1ecfa}
.bd-crd .bd-btn{width:100%;margin-top:6px}
.bd-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#1e305e;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:none}
.bd-big{font-size:46px;text-align:center;margin:4px 0}
.bd-lang{display:inline-block;background:#f1ecfa;color:#6b3fa0;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;margin:0 6px 6px 0}
@media (max-width:980px){
	.bd-grid{grid-template-columns:minmax(0,1fr);padding:4px 10px 18px}
	.bd-col{display:contents}
	#bdMis{order:1}#bdWork{order:2}#bdNote{order:3}#bdFile{order:4}#bdSkills{order:5}#bdHelix{order:6}
	.bd-helix{height:80px}
	.bd-chip{padding:6px 10px;font-size:12.5px}
	#bdPt,.bd-dots{display:none}
	.bd-pile{font-size:12.5px}
	.bd-slider{grid-template-columns:1fr 70px}.bd-slider span:first-child{grid-column:1/-1}
}
`;

export function openBiodata({ formation, audio, isFav, toggleFav, onClose, onEvent, openLead }){
	let st = document.getElementById("bd-css");
	if(!st){ st = document.createElement("style"); st.id = "bd-css"; document.head.appendChild(st); }
	st.textContent = CSS;
	const play = n => audio && audio.play(n);
	const root = document.createElement("div"); root.className = "bd"; root.lang = "en";
	root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Mini-game From Blood to Decision");
	root.innerHTML = `
		<div class="bd-top"><span class="bd-chip st" id="bdSt">Bio-data lab</span><span class="bd-dots" id="bdDots">${"<i></i>".repeat(NM)}</span><span class="bd-chip pt" id="bdPt">Patient: Alex, 27 · P-0412</span><span class="bd-chip" id="bdErr">0 error</span><button class="bd-x" aria-label="Close the game">×</button></div>
		<div class="bd-grid">
			<div class="bd-col">
				<div class="bd-pan" id="bdHelix"><h4>Sample P-0412</h4><canvas class="bd-helix" width="520" height="220"></canvas></div>
				<div class="bd-pan bd-file" id="bdFile"><h4>Case file</h4>
					<p><b>Alex, 27</b>, student. Unusually tired for months, joint pain. Rest and vitamins have not helped.</p>
					<p>First blood tests: <b>ferritin 1,140 µg/L</b>, <b>transferrin saturation 78 %</b> (both high).</p>
					<p>A targeted gene panel is ordered. In the lab, Alex becomes <b>P-0412</b>.</p></div>
				<div class="bd-pan" id="bdSkills"><h4>Master skills unlocked</h4><div class="bd-skills" id="bdSk"><em>None yet</em></div></div>
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
	const S = { errors:0, mission:0, learned:new Set(), done:new Set() };
	let closed = false;
	const cohort = makeCohort();

	/* ---------- interface commune ---------- */
	const mis = $("#bdMis"), work = $("#bdWork"), term = $("#bdTerm");
	function log(t, cls = ""){ const d = document.createElement("div"); if(cls) d.className = cls; d.textContent = "> " + t; term.appendChild(d); while(term.children.length > 60) term.firstChild.remove(); term.scrollTop = term.scrollHeight; }
	function err(t){ S.errors++; play("bad"); $("#bdErr").textContent = `${S.errors} error${S.errors > 1 ? "s" : ""}`; if(t) log(t, "ko"); }
	function stage(t){ $("#bdSt").textContent = t; }
	function dots(){ root.querySelectorAll("#bdDots i").forEach((d, k) => { d.className = S.done.has(k + 1) ? "done" : (S.mission === k + 1 ? "on" : ""); }); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); renderSkills(); return `<div class="bd-course"><span class="tag">📚 In the Master · ${y}</span><b>${n}</b>${t}</div>`; }
	function renderSkills(){ const sk = [...S.learned].map(k => `<span>${COURSES[k][1]}</span>`); $("#bdSk").innerHTML = sk.length ? sk.join("") : "<em>None yet</em>"; }
	function card(html){ $("#bdCard").innerHTML = html; $("#bdOv").hidden = false; $("#bdCard").scrollTop = 0; }
	function uncard(){ $("#bdOv").hidden = true; }
	function begin(n, title, kicker, html){
		S.mission = n; uncard(); stage(`Mission ${n}/${NM} · ${title}`); dots();
		mis.innerHTML = `<span class="k">Mission ${n} · ${kicker}</span><h3>${title}</h3>${html}`;
		root.scrollTop = 0;
	}
	function complete(n, title, text, courses, next){
		S.done.add(n); dots(); play("good");
		setTimeout(() => card(`<div class="k">Mission ${n} complete</div><h2>${title}</h2><p>${text}</p>${courses.map(course).join("")}
			${next ? `<button class="bd-btn dark" data-a="${next[0]}">${next[1]} →</button>` : ""}`), 700);
	}
	const code = s => `<div class="bd-code">${s}</div>`;

	/* ---------- double hélice animée ---------- */
	const hc = $(".bd-helix"), hx = hc.getContext("2d");
	let raf = 0, helixHot = -1;
	const t0 = performance.now();
	(function drawHelix(){
		raf = requestAnimationFrame(drawHelix);
		const t = (performance.now() - t0)/1000, W = hc.width, H = hc.height, base = ["#21b6ce", "#8a5cc7", "#e8963a", "#3bd16f"];
		hx.clearRect(0, 0, W, H);
		for(let i=0;i<34;i++){
			const x = 20 + i*(W - 40)/33, a = t*1.6 + i*.45, y1 = H/2 + Math.sin(a)*H*.32, y2 = H/2 - Math.sin(a)*H*.32, z = Math.cos(a);
			hx.strokeStyle = i === helixHot ? "#ff4d5e" : base[i % 4]; hx.globalAlpha = .35 + .4*Math.abs(z); hx.lineWidth = i === helixHot ? 6 : 3;
			hx.beginPath(); hx.moveTo(x, y1); hx.lineTo(x, y2); hx.stroke(); hx.globalAlpha = 1;
			for(const [y, f] of [[y1, z], [y2, -z]]){ hx.fillStyle = f > 0 ? "#1e305e" : "#9fb0c2"; hx.beginPath(); hx.arc(x, y, f > 0 ? 6 : 4.5, 0, Math.PI*2); hx.fill(); }
		}
	})();

	/* ---------- graphiques (canvas) ---------- */
	function chart(id, w = 760, h = 300){ const c = work.querySelector("#" + id); c.width = w; c.height = h; const x = c.getContext("2d"); x.clearRect(0, 0, w, h); x.font = "700 16px Nunito, sans-serif"; return [x, w, h]; }
	function axes(x, w, h, pad, ylab, xlab){
		x.strokeStyle = "#c9d2db"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(pad, 10); x.lineTo(pad, h - pad); x.lineTo(w - 10, h - pad); x.stroke();
		x.fillStyle = "#5b6b7a"; x.font = "800 15px Nunito, sans-serif";
		if(xlab) x.fillText(xlab, w - 10 - x.measureText(xlab).width, h - 6);
		if(ylab){ x.save(); x.translate(14, 14 + x.measureText(ylab).width); x.rotate(-Math.PI/2); x.fillText(ylab, 0, 0); x.restore(); }
	}
	// question à choix : la bonne réponse fait avancer, les autres coûtent une erreur et s'expliquent
	function q1(choices, onOk, explain){
		const el = work.querySelector(".bd-choice");
		el.innerHTML = choices.map(([k, t]) => `<button data-k="${k}">${t}</button>`).join("");
		let done = false;
		el.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
			if(done) return;
			if(b.dataset.k === "ok"){ done = true; b.classList.add("on"); play("good"); onOk(); }
			else if(!b.classList.contains("bad")){ b.classList.add("bad"); err(explain[b.dataset.k]); }
		}));
	}

	/* ===================== MISSION 1 · data governance ===================== */
	const FIELDS = [
		{ id:"name", f:"Full name", v:"Alex Martin", a:"rm", why:"Directly identifying: it never enters a research dataset." },
		{ id:"ssn", f:"Social security number", v:"1 98 03 59 350 …", a:"rm", why:"Directly identifying, and not needed for any analysis." },
		{ id:"mail", f:"E-mail address", v:"alex.m@…", a:"rm", why:"Identifying and useless for the analysis." },
		{ id:"dob", f:"Date of birth", v:"14/03/1998", a:"tr", why:"Keep the information, not the precision: transform it into an age (27) or an age band." },
		{ id:"zip", f:"Postcode", v:"59000 Lille", a:"tr", why:"A full postcode helps re-identify someone: keep only the département (59)." },
		{ id:"sex", f:"Sex", v:"Male", a:"keep", why:"Needed: penetrance of haemochromatosis differs by sex." },
		{ id:"sym", f:"Symptoms", v:"Fatigue, joint pain", a:"keep", why:"The clinical question itself." },
		{ id:"fer", f:"Ferritin", v:"1,140 µg/L", a:"keep", why:"Key biomarker for iron overload." },
		{ id:"ts", f:"Transferrin saturation", v:"78 %", a:"keep", why:"Key biomarker for iron overload." },
		{ id:"code", f:"Sample code", v:"P-0412", a:"keep", why:"The pseudonym that links data and sample without revealing who Alex is." }
	];
	const PIPE = [
		{ id:"consent", i:"✍️", t:"Informed consent signed (diagnosis, research, secondary findings)", ph:"Ethics" },
		{ id:"sample",  i:"🩸", t:"Blood sample collected", ph:"Biological sample" },
		{ id:"pseudo",  i:"🔒", t:"Pseudonymise: Alex becomes P-0412", ph:"Data protection" },
		{ id:"seq",     i:"🧬", t:"DNA sequencing of the gene panel", ph:"Data generation" },
		{ id:"hds",     i:"🏛️", t:"Store raw data on a certified health-data host (HDS)", ph:"Data storage" },
		{ id:"qc",      i:"🧹", t:"Quality control and preprocessing of the reads", ph:"Data preprocessing" },
		{ id:"call",    i:"🖥️", t:"Variant calling and interpretation", ph:"Data analysis" },
		{ id:"report",  i:"🩺", t:"Report validated by a clinical biologist, discussed with Alex", ph:"Interpretation" }
	];
	const TRAP = { id:"cloud", i:"☁️", t:"Upload the raw genome to a free public cloud drive to share it with a partner lab" };
	let m1 = null;
	function mission1(){
		begin(1, "Data governance", "data protection",
			`<span class="bd-step">Step 1 of 2 · minimise the data</span><p>Alex's record is about to enter the lab's research database. GDPR asks for <b>data minimisation</b>: for each field, decide whether it is <b>kept</b>, <b>transformed</b> (made less precise) or <b>removed</b>.</p><p class="bd-live" id="m1live"></p>`);
		m1 = { ans:Object.fromEntries(FIELDS.map(f => [f.id, "keep"])), slots:Array(PIPE.length).fill(null) };
		renderFields();
		log("Mission 1: record P-0412 enters the research database", "inf");
	}
	function renderFields(bad = []){
		work.innerHTML = `<h4>Alex's record</h4><div class="bd-fields">${FIELDS.map(f => `<div class="bd-field ${bad.includes(f.id) ? "bad" : ""}"><b>${f.f}</b><span>${f.v}</span>
			<div class="bd-seg" data-f="${f.id}">${[["keep", "Keep"], ["tr", "Transform"], ["rm", "Remove"]].map(([k, l]) => `<button class="${k} ${m1.ans[f.id] === k ? "on" : ""}" data-v="${k}">${l}</button>`).join("")}</div></div>`).join("")}</div>
			<div class="bd-row"><button class="bd-btn dark" id="m1a">▶ Export the research dataset</button></div>`;
		work.querySelectorAll(".bd-seg").forEach(sg => sg.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m1.ans[sg.dataset.f] = b.dataset.v; play("pop"); renderFields(bad.filter(id => id !== sg.dataset.f)); })));
		$("#m1a").addEventListener("click", () => {
			const wrong = FIELDS.filter(f => m1.ans[f.id] !== f.a);
			if(wrong.length){ err(`Export blocked by the data protection officer: ${wrong.length} field${wrong.length > 1 ? "s" : ""} to reconsider`); wrong.slice(0, 3).forEach(f => log(`${f.f}: ${f.why}`, "ko")); $("#m1live").textContent = "Fields in red need another decision."; return renderFields(wrong.map(f => f.id)); }
			log("Dataset exported: 3 fields removed, 2 generalised, 5 kept"); play("good");
			mis.querySelector(".bd-step").textContent = "Step 2 of 2 · the full chain";
			mis.querySelector("p").innerHTML = "Now order the full chain, from consent to the report. One card must <b>never</b> be part of it.";
			renderPipe();
		});
	}
	function renderPipe(){
		const cards = shuffle([...PIPE, TRAP], 11);
		work.innerHTML = `<h4>Available steps</h4><div class="bd-cards">${cards.map(c => `<button class="bd-card ${m1.slots.includes(c.id) ? "used" : ""}" data-c="${c.id}"><i>${c.i}</i><span>${c.t}</span></button>`).join("")}</div>
			<h4>Your pipeline <small style="text-transform:none;letter-spacing:0">(tap a step to remove it)</small></h4>
			<ol class="bd-pipe">${m1.slots.map((id, k) => { const c = id && (PIPE.find(s => s.id === id) || TRAP); return `<li class="${c ? "full" : ""}" data-s="${k}">${c ? `<i style="font-style:normal">${c.i}</i>${c.t}` : `<span class="emp">empty</span>`}</li>`; }).join("")}</ol>
			<div class="bd-row"><button class="bd-btn dark" id="m1b" ${m1.slots.every(Boolean) ? "" : "disabled"}>▶ Run the pipeline</button><button class="bd-btn alt" id="m1r">Clear</button></div>`;
		work.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { const k = m1.slots.indexOf(null); if(k < 0) return; m1.slots[k] = b.dataset.c; play("pop"); renderPipe(); }));
		work.querySelectorAll("li.full").forEach(li => li.addEventListener("click", () => { m1.slots[+li.dataset.s] = null; renderPipe(); }));
		$("#m1r").addEventListener("click", () => { m1.slots.fill(null); renderPipe(); });
		$("#m1b").addEventListener("click", checkPipe);
		const left = m1.slots.filter(s => !s).length;
		$("#m1live").textContent = left ? `${left} step${left > 1 ? "s" : ""} to place` : "Pipeline complete: run it!";
	}
	function checkPipe(){
		const s = m1.slots, lis = work.querySelectorAll(".bd-pipe li");
		if(s.includes("cloud")){ lis[s.indexOf("cloud")].classList.add("bad"); return err("Blocked: health data may only be stored and shared through certified, contractual channels (HDS, GDPR)"); }
		// la pseudonymisation : au prélèvement ou juste après le séquençage, toujours avant le stockage et le traitement
		const ideal = s.indexOf("pseudo") === 3 ? ["consent", "sample", "seq", "pseudo", "hds", "qc", "call", "report"] : PIPE.map(p => p.id);
		if(s.every((id, k) => id === ideal[k])){
			lis.forEach((li, k) => { li.classList.add("ok"); li.insertAdjacentHTML("beforeend", `<span class="ph" style="animation-delay:${k*.1}s">${PIPE.find(p => p.id === s[k]).ph}</span>`); });
			log("Pipeline validated: consent → sample → protection → generation → storage → preprocessing → analysis → interpretation");
			$("#m1b").disabled = true;
			setTimeout(() => complete(1, "Governance first", "Before a single base is sequenced, the patient has consented, the data are minimised and pseudonymised, and the storage is certified. In health data science, this is not paperwork: it is what makes the rest legal and trustworthy.", ["protect"], ["m2", "Mission 2 · sequencing QC"]), 900);
			return;
		}
		lis.forEach((li, k) => li.classList.toggle("bad", s[k] !== ideal[k]));
		err(s[0] !== "consent" ? "Nothing happens before the patient's informed consent" : "Some steps are in the wrong place (in red)");
	}

	/* ===================== MISSION 2 · sequencing QC ===================== */
	const QPOS = p => p <= 100 ? 36 - p*.008 : 36 - .8 - .012*(p - 100)**2;          // qualité moyenne (Phred) par position, lectures de 150 bases
	const RUNS = [
		{ id:"P-0398", q:36, map:97, cont:.4, dp:42, sex:"F", y:.00, conc:61 },
		{ id:"P-0405", q:24, map:93, cont:.6, dp:38, sex:"M", y:.21, conc:58, why:"mean quality 24 < 30" },
		{ id:"P-0412", q:35, map:96, cont:.3, dp:45, sex:"M", y:.24, conc:60, alex:true },
		{ id:"P-0417", q:34, map:95, cont:7.2, dp:40, sex:"F", y:.01, conc:62, why:"7.2 % contamination by foreign DNA" },
		{ id:"P-0421", q:37, map:98, cont:.2, dp:51, sex:"F", y:.19, conc:59, why:"declared female but many chrY reads: probable sample swap" },
		{ id:"P-0426", q:35, map:96, cont:.5, dp:47, sex:"M", y:.23, conc:99.8, twin:"P-0433", why:"99.8 % genotype concordance with P-0433: the same person sequenced twice (keep the deeper run)" },
		{ id:"P-0430", q:31, map:91, cont:1.6, dp:33, sex:"M", y:.22, conc:57 },
		{ id:"P-0433", q:36, map:97, cont:.5, dp:52, sex:"M", y:.22, conc:99.8, twin:"P-0426" }
	];
	const PASS = r => r.q >= 30 && r.map >= 90 && r.cont <= 2 && r.dp >= 30 && (r.sex === "M" ? r.y > .1 : r.y < .05) && !(r.conc > 99 && r.dp < 50);
	let m2 = null;
	function mission2(){
		begin(2, "Sequencing quality control", "data preprocessing",
			`<span class="bd-step">Step 1 of 2 · trim the reads</span><p>Each read is 150 bases long, and sequencers lose accuracy towards the end of the read. Choose where to <b>trim</b>: keep only positions where the mean quality is at least <b>Phred 25</b> (about 1 error in 300 bases), while keeping as much data as possible.</p><p class="bd-live" id="m2live"></p>`);
		m2 = { trim:150, keep:Object.fromEntries(RUNS.map(r => [r.id, true])) };
		renderTrim();
		log("Mission 2: run 2026-10-13, 8 samples, 2 × 150 bp reads", "inf");
	}
	function renderTrim(){
		work.innerHTML = `<h4>Mean base quality by position in the read</h4><canvas class="bd-chart" id="m2c"></canvas>
			<div class="bd-slider"><span>Trim reads at base</span><input type="range" min="60" max="150" step="1" value="${m2.trim}" id="m2s"><b id="m2v"></b></div>
			<div class="bd-kpi" id="m2k"></div>
			${code(`<span class="c"># preprocessing step of the pipeline</span>\n<span class="k">trim</span> --input P-0412_R1.fastq --max-length <span class="s" id="m2code">${m2.trim}</span> --min-quality <span class="s">25</span>`)}
			<div class="bd-row"><button class="bd-btn dark" id="m2a">▶ Apply trimming</button></div>`;
		const s = $("#m2s"); s.addEventListener("input", () => { m2.trim = +s.value; drawTrim(); });
		$("#m2a").addEventListener("click", () => {
			const q = QPOS(m2.trim);
			if(q < 25){ err(`At base ${m2.trim}, mean quality is ${fmt(q, 1)}: below 25, you keep too many errors`); return; }
			if(m2.trim < 120){ err(`Trimming at ${m2.trim} throws away ${fmt(100 - m2.trim/1.5)} % of good data: you can keep more`); return; }
			log(`Reads trimmed at base ${m2.trim}: mean quality ≥ 25 everywhere`); play("good");
			mis.querySelector(".bd-step").textContent = "Step 2 of 2 · sample-level checks";
			mis.querySelector("p").innerHTML = "Now check the 8 samples of the run and keep only those that pass <b>every</b> rule. Two checks catch human errors, not machine errors: the <b>genetic sex</b> (a woman has no chromosome Y) and <b>genotype concordance</b> (two samples 99.8 % identical are the same person: keep only the deeper run).";
			renderQC();
		});
		drawTrim();
	}
	function drawTrim(){
		const [x, w, h] = chart("m2c"), pad = 40, X = p => pad + (w - pad - 12)*(p - 1)/149, Y = q => h - pad - (h - pad - 14)*(q - 10)/28;
		axes(x, w, h, pad, "Phred", "position in read");
		x.fillStyle = "rgba(255,77,94,.08)"; x.fillRect(pad, Y(25), w - pad - 12, Y(10) - Y(25));
		x.strokeStyle = "#d6213a"; x.setLineDash([8, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(pad, Y(25)); x.lineTo(w - 12, Y(25)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "#d6213a"; x.fillText("Phred 25", pad + 8, Y(25) - 6);
		x.strokeStyle = "#21b6ce"; x.lineWidth = 3; x.beginPath();
		for(let p=1;p<=150;p++){ const q = Math.max(10, QPOS(p)); p === 1 ? x.moveTo(X(p), Y(q)) : x.lineTo(X(p), Y(q)); }
		x.stroke();
		x.fillStyle = "rgba(30,48,94,.12)"; x.fillRect(X(m2.trim), 10, w - 12 - X(m2.trim), h - pad - 10);
		x.strokeStyle = "#1e305e"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(X(m2.trim), 10); x.lineTo(X(m2.trim), h - pad); x.stroke();
		x.fillStyle = "#5b6b7a"; for(const p of [1, 50, 100, 150]) x.fillText(p, X(p) - (p === 150 ? 28 : 8), h - pad + 18);
		let e = 0; for(let p=1;p<=m2.trim;p++) e += Math.pow(10, -QPOS(p)/10);
		const q = QPOS(m2.trim);
		$("#m2v").textContent = m2.trim; const cs = $("#m2code"); if(cs) cs.textContent = m2.trim;
		$("#m2k").innerHTML = `<div class="${m2.trim >= 120 ? "good" : "bad"}"><b>${fmt(m2.trim/1.5)} %</b><span>bases kept</span></div><div class="${q >= 25 ? "good" : "bad"}"><b>${fmt(q, 1)}</b><span>quality at cut</span></div><div><b>${fmt(e/m2.trim*1e4, 1)}</b><span>errors / 10,000 bases</span></div>`;
	}
	function renderQC(wrong = []){
		work.innerHTML = `<div class="bd-rules"><span>Quality ≥ 30</span><span>Mapped ≥ 90 %</span><span>Contamination ≤ 2 %</span><span>Depth ≥ 30×</span><span>Sex check</span><span>Concordance &lt; 99 %</span></div>
			<div class="bd-scroll"><table class="bd-tbl"><thead><tr><th>Sample</th><th>Qual.</th><th>Mapped</th><th>Contam.</th><th>Depth</th><th>Declared sex</th><th>chrY reads</th><th>Max concordance</th><th>Decision</th></tr></thead><tbody>
			${RUNS.map(r => `<tr class="${r.alex ? "alex" : ""} ${wrong.includes(r.id) ? "wrong" : ""}"><td>${r.id}${r.alex ? " · Alex" : ""}</td><td>${r.q}</td><td>${r.map} %</td><td>${r.cont} %</td><td>${r.dp}×</td><td>${r.sex === "M" ? "Male" : "Female"}</td><td>${fmt(r.y, 2)} %</td><td>${r.conc} %${r.twin ? ` <small>(${r.twin})</small>` : ""}</td>
				<td><button class="bd-tog ${m2.keep[r.id] ? "keep" : "drop"}" data-r="${r.id}">${m2.keep[r.id] ? "✓ Keep" : "✗ Exclude"}</button></td></tr>`).join("")}
			</tbody></table></div>
			<div class="bd-row"><button class="bd-btn dark" id="m2b">▶ Release the samples for analysis</button></div>`;
		work.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => { m2.keep[b.dataset.r] = !m2.keep[b.dataset.r]; play("pop"); renderQC(wrong.filter(id => id !== b.dataset.r)); }));
		$("#m2b").addEventListener("click", () => {
			const bad = RUNS.filter(r => m2.keep[r.id] !== PASS(r)).map(r => r.id);
			if(bad.length){ err(`QC failed: ${bad.length} decision${bad.length > 1 ? "s" : ""} to fix`); bad.forEach(id => { const r = RUNS.find(x => x.id === id); log(PASS(r) ? `${id}: passes every rule, keep it` : `${id}: ${r.why}`, "ko"); }); $("#m2live").textContent = "Rows in red need another decision."; return renderQC(bad); }
			RUNS.filter(r => !PASS(r)).forEach(r => log(`${r.id} excluded: ${r.why}`));
			$("#m2b").disabled = true;
			complete(2, "Clean data, honest results", "You trimmed the noisy ends of the reads, then excluded four samples: one of poor quality, one contaminated, one swapped (a 'woman' with a Y chromosome) and one sequenced twice. Analysed anyway, they would have produced false variants, or worse, results given to the wrong patient.", ["biotech", "stats"], ["m3", "Mission 3 · variant interpretation"]);
		});
	}

	/* ===================== MISSION 3 · variant interpretation ===================== */
	const REF = "TGGCAAGGGTAAACAGATCCCCTCCTACGTGCAC";
	const CAND = { a:{ pos:6, alt:"T", n:1, lq:true, z:"art" }, b:{ pos:15, alt:"A", n:12, z:"hom" }, c:{ pos:26, alt:"T", n:6, z:"het" } };
	const READS = (() => {
		const rows = [];
		for(let k=0;k<12;k++){
			const start = (k*3) % 7, len = REF.length - start - (k % 3); let s = " ".repeat(start);
			for(let p=start; p<start + len; p++){
				let ch = REF[p], cls = "";
				if(p === CAND.b.pos){ ch = "A"; cls = "mm"; }
				else if(p === CAND.c.pos && k % 2 === 0){ ch = "T"; cls = "mm"; }
				else if(p === CAND.a.pos && k === 4){ ch = "T"; cls = "mm lq"; }
				s += cls ? `<span class="${cls}">${ch}</span>` : ".";
			}
			rows.push(s);
		}
		return rows;
	})();
	const VARS = [
		{ id:"b", name:"HFE c.845G>A · p.(Cys282Tyr) · C282Y", ans:["P"], ev:[["Population", "Allele frequency ~6 % in North-Western Europe"], ["ClinVar", "Pathogenic (many submitters, expert-panel review)"], ["Function", "Breaks a disulfide bond: the HFE protein no longer reaches the cell surface"], ["Case data", "Homozygotes strongly over-represented among patients with iron overload"]] },
		{ id:"c", name:"Position C · common synonymous change", ans:["B", "LB"], ev:[["Population", "Allele frequency 31 % in the general population"], ["ClinVar", "Benign (multiple submitters)"], ["Prediction", "Synonymous: same amino acid, no predicted splicing effect"], ["Case data", "As frequent in patients as in controls"]] },
		{ id:"d", name:"HFE rare missense change (from a relative's report)", ans:["VUS"], ev:[["Population", "Absent from population databases"], ["ClinVar", "No entry"], ["Prediction", "In-silico tools disagree (2 damaging, 2 tolerated)"], ["Case data", "Reported once, in a single family"]] }
	];
	const CLASSES = [["P", "Pathogenic"], ["LP", "Likely pathogenic"], ["VUS", "Uncertain (VUS)"], ["LB", "Likely benign"], ["B", "Benign"]];
	let m3 = null;
	function mission3(){
		begin(3, "Variant interpretation", "bioinformatics",
			`<span class="bd-step">Step 1 of 2 · zygosity from the reads</span><p>Alex's reads are aligned on gene HFE (reference in blue; a dot = same base as the reference). For each candidate position, compute the <b>variant allele fraction</b> (VAF = reads with the change ÷ all reads) and decide: <b>artefact</b>, <b>heterozygous</b> (~50 %) or <b>homozygous</b> (~100 %). <small>(Illustrative sequence.)</small></p><p class="bd-live" id="m3live"></p>`);
		m3 = { z:{}, cls:{} };
		renderZyg();
		log("Mission 3: 12 reads over HFE exon 4 (chromosome 6)", "inf");
	}
	function renderZyg(bad = []){
		work.innerHTML = `<h4>Read alignment · HFE</h4><div class="bd-pile"><span class="ref">${REF}</span>  reference\n${READS.join("\n")}</div>
			${Object.entries(CAND).map(([k, c]) => `<div class="bd-var ${bad.includes(k) ? "bad" : ""}"><h5>Position ${k.toUpperCase()} · ${REF[c.pos]} → ${c.alt} · ${c.n} of 12 reads${c.lq ? " · low base quality" : ""}</h5>
				<div class="bd-opts" data-z="${k}">${[["art", "Artefact"], ["het", "Heterozygous"], ["hom", "Homozygous"]].map(([v, l]) => `<button class="${m3.z[k] === v ? "on" : ""}" data-v="${v}">${l}</button>`).join("")}</div></div>`).join("")}
			<div class="bd-row"><button class="bd-btn dark" id="m3a">▶ Call the genotypes</button></div>`;
		work.querySelectorAll("[data-z]").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m3.z[g.dataset.z] = b.dataset.v; helixHot = 6 + "abc".indexOf(g.dataset.z)*9; play("pop"); renderZyg(bad.filter(k => k !== g.dataset.z)); })));
		$("#m3a").addEventListener("click", () => {
			const wrong = Object.keys(CAND).filter(k => m3.z[k] !== CAND[k].z);
			if(wrong.length){ err(`Genotype call rejected: ${wrong.length} position${wrong.length > 1 ? "s" : ""} to review`); wrong.forEach(k => log(`Position ${k.toUpperCase()}: VAF = ${CAND[k].n}/12 = ${fmt(CAND[k].n/12*100)} %${CAND[k].lq ? ", on a single low-quality base" : ""}`, "ko")); return renderZyg(wrong); }
			log("Genotypes called: A artefact (VAF 8 %), B homozygous (VAF 100 %), C heterozygous (VAF 50 %)"); play("good");
			mis.querySelector(".bd-step").textContent = "Step 2 of 2 · classify the variants";
			mis.querySelector("p").innerHTML = "A genotype is not a diagnosis. Classify each variant on the <b>5-tier scale</b> used by clinical labs (ACMG), from the evidence gathered in the databases.";
			renderCls();
		});
	}
	function renderCls(bad = []){
		work.innerHTML = VARS.map(v => `<div class="bd-var ${bad.includes(v.id) ? "bad" : ""}"><h5>${v.name}</h5><div class="bd-ev">${v.ev.map(([a, b]) => `<div><b>${a}</b>${b}</div>`).join("")}</div>
			<div class="bd-opts" data-v="${v.id}">${CLASSES.map(([c, l]) => `<button class="${m3.cls[v.id] === c ? "on" : ""}" data-c="${c}">${l}</button>`).join("")}</div></div>`).join("") +
			`<div class="bd-row"><button class="bd-btn dark" id="m3b">▶ Submit the classification</button></div>`;
		work.querySelectorAll(".bd-opts[data-v]").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m3.cls[g.dataset.v] = b.dataset.c; play("pop"); renderCls(bad.filter(id => id !== g.dataset.v)); })));
		$("#m3b").addEventListener("click", () => {
			const wrong = VARS.filter(v => !v.ans.includes(m3.cls[v.id])).map(v => v.id);
			if(wrong.length){ err("The clinical biologist sends the classification back"); wrong.forEach(id => log({ b:"C282Y: frequent, but strong functional and case evidence: it is pathogenic", c:"31 % of the population and synonymous: benign", d:"Rare but with no solid evidence either way: this is exactly what a VUS is" }[id], "ko")); return renderCls(wrong); }
			log("C282Y pathogenic · common change benign · rare missense VUS");
			complete(3, "A variant, read and weighed", "You measured allele fractions to tell an artefact from real genotypes, then weighed population, database, functional and case evidence. Alex is homozygous for C282Y, the cause of most hereditary haemochromatosis in Europe. And a rare variant with no evidence stays a VUS: it is not reported as a cause.", ["bioinf", "disease"], ["m4", "Mission 4 · cohort biostatistics"]);
		});
	}

	/* ===================== MISSION 4 · cohort biostatistics ===================== */
	const hom = cohort.filter(p => p.g === 2), oth = cohort.filter(p => p.g !== 2);
	function mannWhitneyZ(a, b){
		const all = [...a.map(v => [v, 0]), ...b.map(v => [v, 1])].sort((x, y) => x[0] - y[0]);
		let ra = 0; all.forEach(([, g], i) => { if(!g) ra += i + 1; });
		const n1 = a.length, n2 = b.length, U = ra - n1*(n1 + 1)/2;
		return (U - n1*n2/2)/Math.sqrt(n1*n2*(n1 + n2 + 1)/12);
	}
	function mission4(){
		begin(4, "Cohort biostatistics", "biostatistics & epidemiology",
			`<span class="bd-step">Step 1 of 3 · choose the test</span><p>Alex is one of <b>240 patients</b> seen for unexplained fatigue in the same clinic (simulated cohort). <b>24</b> are C282Y homozygous. Does their ferritin differ from the others'? Look at the distribution first.</p>`);
		renderTest();
		log("Mission 4: cohort of 240 patients loaded (24 C282Y/C282Y)", "inf");
	}
	function renderTest(){
		work.innerHTML = `<h4>Ferritin, all 240 patients (µg/L)</h4><canvas class="bd-chart" id="m4h"></canvas>
			<p style="margin:6px 0;font-weight:700">Which approach is appropriate to compare ferritin between homozygotes and the others?</p><div class="bd-choice"></div>`;
		const [x, w, h] = chart("m4h"), pad = 40, max = 2500, nb = 25, bins = Array(nb).fill(0);
		cohort.forEach(p => bins[Math.min(nb - 1, Math.floor(p.fer/max*nb))]++);
		const top = Math.max(...bins), bw = (w - pad - 12)/nb;
		axes(x, w, h, pad, "patients", "ferritin (µg/L)");
		bins.forEach((n, i) => { x.fillStyle = "#21b6ce"; const bh = (h - pad - 14)*n/top; x.fillRect(pad + i*bw + 1, h - pad - bh, bw - 2, bh); });
		x.fillStyle = "#5b6b7a"; for(const v of [0, 500, 1000, 1500, 2000]) x.fillText(v, pad + v/max*(w - pad - 12) - 8, h - pad + 18);
		q1(shuffle([
			["ok", "The distribution is strongly right-skewed: use a Mann–Whitney test, or a t-test on log(ferritin)."],
			["t", "A Student t-test on raw ferritin: it is the standard test to compare two means."],
			["chi", "A chi-square test on the ferritin values."]
		], 3), stepPval, { t:"Raw ferritin is heavily skewed with extreme values: a t-test on it is unreliable", chi:"Chi-square compares counts in categories, not a continuous measure" });
	}
	function stepPval(){
		const z = mannWhitneyZ(hom.map(p => p.fer), oth.map(p => p.fer)), mh = median(hom.map(p => p.fer)), mo = median(oth.map(p => p.fer));
		log(`Mann–Whitney: z = ${fmt(z, 1)}, p < 0.001 · median ferritin ×${fmt(mh/mo, 1)} in homozygotes`);
		mis.querySelector(".bd-step").textContent = "Step 2 of 3 · read the p-value";
		mis.querySelector("p").innerHTML = `Result: median ferritin is <b>${fmt(mh/mo, 1)} times higher</b> in C282Y homozygotes (Mann–Whitney, <b>p &lt; 0.001</b>). What does this p-value mean?`;
		work.innerHTML = `<div class="bd-kpi"><div><b>${fmt(mh)}</b><span>median ferritin · homozygous</span></div><div><b>${fmt(mo)}</b><span>median · others</span></div><div class="good"><b>p &lt; 0.001</b><span>Mann–Whitney</span></div></div>
			${code(`<span class="k">from</span> scipy.stats <span class="k">import</span> mannwhitneyu\nmannwhitneyu(ferritin[hom], ferritin[others])   <span class="c"># z = ${fmt(z, 1)}</span>`)}
			<div class="bd-choice"></div>`;
		q1(shuffle([
			["ok", "If there were truly no difference between the groups, a difference at least this large would be very unlikely to appear by chance."],
			["prob", "There is less than a 0.1 % probability that the two groups have the same ferritin."],
			["clin", "The difference is clinically important, because the p-value is very small."]
		], 8), stepSex, { prob:"Classic trap: the p-value is computed assuming no difference; it is not the probability that this hypothesis is true", clin:"Statistical significance says nothing about clinical importance: look at the effect size" });
	}
	function stepSex(){
		mis.querySelector(".bd-step").textContent = "Step 3 of 3 · men and women";
		mis.querySelector("p").innerHTML = "Split by sex: the picture changes. What should the study report?";
		work.innerHTML = `<h4>Median ferritin by genotype and sex (µg/L)</h4><canvas class="bd-chart" id="m4s"></canvas><div class="bd-choice"></div>`;
		const [x, w, h] = chart("m4s"), pad = 40, groups = [["Hom. · men", hom.filter(p => p.sex === "M")], ["Hom. · women", hom.filter(p => p.sex === "F")], ["Others · men", oth.filter(p => p.sex === "M")], ["Others · women", oth.filter(p => p.sex === "F")]];
		axes(x, w, h, pad, "µg/L", "");
		const max = Math.max(...groups.map(([, g]) => median(g.map(p => p.fer))))*1.2, bw = (w - pad - 12)/4;
		groups.forEach(([l, g], i) => {
			const m = median(g.map(p => p.fer)), bh = (h - pad - 30)*m/max;
			x.fillStyle = i < 2 ? "#8a5cc7" : "#21b6ce"; x.globalAlpha = i % 2 ? .6 : 1; x.fillRect(pad + i*bw + bw*.2, h - pad - bh, bw*.6, bh); x.globalAlpha = 1;
			x.fillStyle = "#1e305e"; x.fillText(fmt(m), pad + i*bw + bw*.38, h - pad - bh - 6);
			x.fillStyle = "#5b6b7a"; x.font = "700 14px Nunito, sans-serif"; x.fillText(`${l} (n=${g.length})`, pad + i*bw + 6, h - pad + 18); x.font = "700 16px Nunito, sans-serif";
		});
		q1(shuffle([
			["ok", "Penetrance is higher in men (women lose iron through menstruation and pregnancy): report results stratified by sex, not only pooled."],
			["pool", "Sex is irrelevant: report the pooled result only, it has more statistical power."],
			["prot", "Women carry a protective version of the genotype."]
		], 13), () => { log("Results reported by sex: penetrance differs between men and women"); complete(4, "From one patient to a population", "You chose a test suited to skewed data, read the p-value for what it is, and spotted that sex modifies the effect. Exactly the reasoning of an epidemiological study: effect sizes, uncertainty, and the right sub-groups.", ["epi"], ["m5", "Mission 5 · machine learning"]); },
		{ pool:"Pooling hides that the effect differs strongly between men and women", prot:"Same genotype in both sexes: the difference comes from physiology (iron losses), not from the DNA" });
	}

	/* ===================== MISSION 5 · machine learning ===================== */
	const FEATS = [
		{ id:"ts", l:"Transferrin saturation", d:"routine blood test" },
		{ id:"fer", l:"Ferritin (log)", d:"routine blood test" },
		{ id:"sex", l:"Sex", d:"from the record" },
		{ id:"alt", l:"ALT liver enzyme", d:"routine blood test" },
		{ id:"hb", l:"Haemoglobin", d:"routine blood test" },
		{ id:"age", l:"Age", d:"from the record" },
		{ id:"phleb", l:"Number of phlebotomies already done", d:"treatment history", leak:true },
		{ id:"id", l:"Patient enrolment number", d:"administrative", leak:true }
	];
	let m5 = null;
	function mission5(){
		begin(5, "Machine learning for screening", "AI & data mining",
			`<span class="bd-step">Step 1 of 3 · choose the features</span><p>Genetic tests are expensive. The clinic wants a model that uses <b>routine data</b> to decide who should be offered HFE testing (target: C282Y homozygous). Choose the input features, train, then validate. Beware of features that would not be available, or would not make sense, <b>at the time of the decision</b>.</p>`);
		m5 = { feats:new Set(["ts", "fer", "phleb", "id"]), thr:.5, roc:null, need:.6 };
		renderFeats();
		log("Mission 5: 240 patients, 30 % held out as test set", "inf");
	}
	function renderFeats(res){
		work.innerHTML = `<h4>Candidate features</h4><div class="bd-feat">${FEATS.map(f => `<label class="${m5.feats.has(f.id) ? "on" : ""}" data-f="${f.id}">${m5.feats.has(f.id) ? "☑" : "☐"} <span>${f.l}<small>${f.d}</small></span></label>`).join("")}</div>
			${res ? `<div class="bd-kpi"><div class="${res.auc > .97 ? "bad" : "good"}"><b>${fmt(res.auc, 3)}</b><span>AUC on test set</span></div></div>` : ""}
			${code(`<span class="k">from</span> sklearn.linear_model <span class="k">import</span> LogisticRegression\nX = cohort[[${[...m5.feats].map(f => `<span class="s">"${f}"</span>`).join(", ")}]]\nmodel = LogisticRegression().fit(X[train], y[train])`)}
			<div class="bd-row"><button class="bd-btn alt" id="m5t">⚙ Train and evaluate</button><button class="bd-btn dark" id="m5a" ${res ? "" : "disabled"}>Validate the feature set</button></div>`;
		work.querySelectorAll("[data-f]").forEach(l => l.addEventListener("click", () => { const f = l.dataset.f; m5.feats.has(f) ? m5.feats.delete(f) : m5.feats.add(f); m5.roc = null; play("pop"); renderFeats(); }));
		$("#m5t").addEventListener("click", () => {
			if(!m5.feats.size) return;
			const roc = rocOf(fitPredict(cohort, [...m5.feats]));
			m5.roc = roc; log(`Trained on ${[...m5.feats].join(", ")} → AUC ${fmt(roc.auc, 3)}`);
			renderFeats(roc);
		});
		$("#m5a").addEventListener("click", () => {
			const leak = FEATS.filter(f => f.leak && m5.feats.has(f.id));
			if(leak.length){ err(`Data leakage: ${leak.map(f => f.l.toLowerCase()).join(" and ")} cannot be used to decide who to test`); log("An AUC close to 1 on a medical question is a warning sign, not a victory", "ko"); return; }
			if(!m5.feats.has("ts") && !m5.feats.has("fer")){ err("Without the iron markers the model has nothing useful to learn from"); return; }
			if(!m5.roc || m5.roc.auc < .8){ err("Train the model and reach a useful performance (AUC ≥ 0.80)"); return; }
			log(`Feature set validated, no leakage, AUC ${fmt(m5.roc.auc, 3)}`); play("good");
			stepSplit();
		});
	}
	function stepSplit(){
		mis.querySelector(".bd-step").textContent = "Step 2 of 3 · validation design";
		mis.querySelector("p").innerHTML = "In the real dataset, each patient has <b>3 visits</b> (720 rows). How do you split training and test data?";
		work.innerHTML = `<div class="bd-choice"></div>`;
		q1(shuffle([
			["ok", "Split by patient: all visits of a given patient go either to training or to test (grouped split)."],
			["rows", "Shuffle the 720 rows and keep 30 % of them for test."],
			["sex", "Train on men and test on women."]
		], 21), stepRoc, { rows:"The same patient would appear in training and test: the score would be optimistic, the model partly recognises people", sex:"Train and test must come from the same population, otherwise you measure something else" });
	}
	function stepRoc(){
		log("GroupShuffleSplit(groups=patient_id): no patient in both sets");
		const roc = rocOf(fitPredict(cohort, [...m5.feats]));
		const best = Math.max(0, ...roc.pts.filter(p => p.sens >= .9).map(p => p.spec));
		m5.roc = roc; m5.thr = .15; m5.need = Math.max(.3, Math.min(.6, best - .05));
		mis.querySelector(".bd-step").textContent = "Step 3 of 3 · decision threshold";
		mis.querySelector("p").innerHTML = `For screening, missing a homozygous patient is worse than an extra genetic test. Set the threshold so that <b>sensitivity ≥ 90 %</b> while keeping <b>specificity ≥ ${fmt(m5.need*100)} %</b>.`;
		work.innerHTML = `<h4>ROC curve on the test set · AUC ${fmt(roc.auc, 3)}</h4><canvas class="bd-chart" id="m5r" style="max-width:620px"></canvas>
			<div class="bd-slider"><span>Risk threshold</span><input type="range" min="0" max="30" value="15" id="m5s"><b id="m5v"></b></div>
			<p style="margin:0;font-size:12.5px;color:#5b6b7a">Only 10 % of the clinic's patients are homozygous, so predicted risks are low: the useful thresholds are low too.</p>
			<div class="bd-kpi" id="m5k"></div>
			<div class="bd-row"><button class="bd-btn dark" id="m5b">▶ Deploy in the clinic</button></div>`;
		const s = $("#m5s"); s.addEventListener("input", () => { m5.thr = +s.value/100; drawRoc(); });
		$("#m5b").addEventListener("click", () => {
			const p = pointAt(m5.thr);
			if(p.sens < .9){ err(`Sensitivity ${fmt(p.sens*100)} %: too many homozygous patients would be missed`); return; }
			if(p.spec < m5.need){ err(`Specificity ${fmt(p.spec*100)} %: almost everyone gets tested, the model brings nothing`); return; }
			log(`Threshold ${fmt(m5.thr, 2)}: sensitivity ${fmt(p.sens*100)} %, specificity ${fmt(p.spec*100)} %`);
			$("#m5b").disabled = true;
			complete(5, "A model that stays honest", "You removed features that leak the answer, validated on patients the model had never seen, and chose a threshold for a screening goal rather than for a pretty score. That is the difference between a demo and a tool a hospital can trust.", ["ml", "bigdata"], ["m6", "Mission 6 · report & ethics"]);
		});
		drawRoc();
	}
	const pointAt = t => m5.roc.pts.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
	function drawRoc(){
		const [x, w, h] = chart("m5r", 620, 380), pad = 44, X = v => pad + (w - pad - 14)*v, Y = v => h - pad - (h - pad - 14)*v;
		axes(x, w, h, pad, "sensitivity", "1 − specificity");
		x.strokeStyle = "#c9d2db"; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(1), Y(1)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "rgba(59,209,111,.12)"; x.fillRect(X(0), Y(1), X(1 - m5.need) - X(0), Y(.9) - Y(1));
		x.strokeStyle = "#21b6ce"; x.lineWidth = 3; x.beginPath();
		[...m5.roc.pts].sort((a, b) => (1 - a.spec) - (1 - b.spec) || a.sens - b.sens).forEach((p, i) => i ? x.lineTo(X(1 - p.spec), Y(p.sens)) : x.moveTo(X(1 - p.spec), Y(p.sens)));
		x.stroke();
		const p = pointAt(m5.thr), ok = p.sens >= .9 && p.spec >= m5.need;
		x.fillStyle = ok ? "#1c7a43" : "#d6213a"; x.beginPath(); x.arc(X(1 - p.spec), Y(p.sens), 9, 0, Math.PI*2); x.fill();
		$("#m5v").textContent = fmt(m5.thr, 2);
		const tp = Math.round(p.sens*m5.roc.pos), fp = Math.round((1 - p.spec)*m5.roc.neg);
		$("#m5k").innerHTML = `<div class="${p.sens >= .9 ? "good" : "bad"}"><b>${fmt(p.sens*100)} %</b><span>sensitivity</span></div><div class="${p.spec >= m5.need ? "good" : "bad"}"><b>${fmt(p.spec*100)} %</b><span>specificity</span></div><div><b>${tp}/${m5.roc.pos}</b><span>homozygotes found</span></div><div><b>${fp}</b><span>extra genetic tests</span></div>`;
	}

	/* ===================== MISSION 6 · report & ethics ===================== */
	const REPORT = [
		{ t:"Finding", o:[["ok", "Homozygous HFE c.845G>A p.(Cys282Tyr) detected (12/12 reads, VAF 100 %)."], ["over", "C282Y found: the patient has haemochromatosis."], ["vague", "Three HFE mutations found, including position A."]] },
		{ t:"Interpretation", o:[["ok", "Genotype consistent with HFE haemochromatosis; penetrance is incomplete, iron studies are needed to confirm iron overload."], ["cert", "Penetrance is complete: severe disease is certain."], ["vus", "Result of uncertain significance."]] },
		{ t:"Recommendation", o:[["ok", "Repeat transferrin saturation and ferritin, specialist referral; offer cascade testing to first-degree relatives with genetic counselling."], ["mail", "Start phlebotomies today and inform the family by e-mail."], ["none", "No follow-up needed."]] }
	];
	const WHY6 = { over:"A genotype is not a diagnosis: iron studies confirm the disease", vague:"Position A was a sequencing artefact: it does not belong in a report", cert:"Penetrance of C282Y homozygosity is incomplete, especially in women", vus:"C282Y is pathogenic, not uncertain", mail:"Treatment needs confirmation; relatives are informed through genetic counselling, never by e-mail", none:"A pathogenic genotype with high iron markers needs follow-up" };
	let m6 = null;
	function mission6(){
		begin(6, "Report & ethics", "clinical trials & regulation",
			`<span class="bd-step">Step 1 of 2 · the clinical report</span><p>Write the conclusion of Alex's report, one sentence per section. It will be read by a doctor, then explained to Alex: it must be <b>exact, cautious and actionable</b>.</p>`);
		m6 = { pick:{} };
		renderReport();
		log("Mission 6: drafting report P-0412", "inf");
	}
	function renderReport(bad = []){
		work.innerHTML = REPORT.map((sec, i) => `<div class="bd-var ${bad.includes(i) ? "bad" : ""}"><h5>${sec.t}</h5><div class="bd-choice" data-i="${i}">${shuffle([...sec.o], 30 + i).map(([k, t]) => `<button class="${m6.pick[i] === k ? "on" : ""}" data-k="${k}">${t}</button>`).join("")}</div></div>`).join("") +
			`<div class="bd-row"><button class="bd-btn dark" id="m6a">▶ Sign the report</button></div>`;
		work.querySelectorAll(".bd-choice[data-i]").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m6.pick[g.dataset.i] = b.dataset.k; play("pop"); renderReport(bad.filter(i => i !== +g.dataset.i)); })));
		$("#m6a").addEventListener("click", () => {
			const wrong = REPORT.map((s, i) => i).filter(i => m6.pick[i] !== "ok");
			if(wrong.length){ err("The clinical biologist refuses to sign"); wrong.forEach(i => log(WHY6[m6.pick[i]] || `${REPORT[i].t}: choose a sentence`, "ko")); return renderReport(wrong); }
			log("Report signed and sent to Alex's doctor"); play("good");
			mis.querySelector(".bd-step").textContent = "Step 2 of 2 · an unexpected finding";
			mis.querySelector("p").innerHTML = "While re-checking the run, the pipeline flags something else in Alex's data: a <b>pathogenic BRCA2 variant</b> (higher risk of several cancers). It has nothing to do with fatigue. What do you do?";
			work.innerHTML = `<div class="bd-consent">📄 <b>Alex's consent form (signed in mission 1)</b><br>☑ Analysis for the diagnosis of fatigue and iron overload<br>☑ Pseudonymised use for research<br>☑ <b>To be informed of actionable secondary findings</b></div><div class="bd-choice"></div>`;
			q1(shuffle([
				["ok", "Alex asked to be informed of actionable findings: confirm the variant, then disclose it through a dedicated genetic counselling consultation."],
				["hide", "Say nothing: it is unrelated to the question the doctor asked."],
				["foot", "Add it as a footnote at the bottom of the fatigue report sent to the GP."]
			], 40), () => { log("Secondary finding: confirmation, then genetic counselling consultation"); S.done.add(6); dots(); play("win"); setTimeout(finale, 500); },
			{ hide:"Alex explicitly consented to be told about actionable findings: hiding it would break that consent", foot:"A cancer-risk finding is never disclosed as a footnote: it needs confirmation and a dedicated counselling consultation" });
		});
	}

	/* ===================== fin ===================== */
	function finale(){
		const e = S.errors, code = e <= 3 ? "Très bien" : e <= 8 ? "Bien" : "Assez bien";
		onEvent && onEvent("win", code);
		const order = ["protect", "biotech", "stats", "bioinf", "disease", "epi", "ml", "bigdata", "clin"];
		card(`<div class="k">Case closed · ${MENTIONS[code]}</div><h2>From biology to data, from data to decision</h2>
			<div class="bd-big">🧬📊🩺</div>
			<p>Alex's blood test became a decision: governed data, clean reads, a variant weighed on evidence, a cohort analysed without traps, a screening model that stays honest, and a report that respects consent. <b>This is what the Master in Data Management in Biosciences is about.</b> ${e ? `Errors on the way: ${e}.` : "Not a single error!"}</p>
			${course("clin")}
			<ul>${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${openLead ? `<button class="bd-btn dark" data-a="lead">📄 Get the programme brochure</button>` : ""}
			<a class="bd-alt" href="${formation.url}" target="_blank" rel="noopener">Discover the Master ↗</a>
			<button class="bd-alt" data-a="fav">${isFav() ? "♥ In my notebook" : "♡ Add to my notebook"}</button>
			<button class="bd-alt" data-a="replay">Play again</button>`);
	}
	function intro(){
		stage("Bio-data lab"); dots();
		mis.innerHTML = `<span class="k">Wenov · École du Numérique</span><h3>From Blood to Decision</h3><p>Six missions, the way a health data scientist works: governance, sequencing quality, variant interpretation, cohort statistics, machine learning, clinical reporting.</p>`;
		work.innerHTML = `<p style="margin:0;font-size:14px;color:#5b6b7a">The missions will appear here.</p>`;
		card(`<span class="bd-lang">🇬🇧 In English, like the Master</span><span class="bd-lang">⏱ 12–15 min</span><div class="k">Mini-game · ${formation.name}</div><h2>From Blood to Decision</h2>
			<div class="bd-say"><div class="av">🧑</div><div class="bub">Doctor, I've been feeling unusually tired for several months, and the treatments I've tried haven't really helped.</div></div>
			<div class="bd-say doc"><div class="av">👩‍⚕️</div><div class="bub">Your iron levels are very high. I'd like a genetic analysis and a closer look at your biological data.</div></div>
			<p>You join the health data team. Take Alex's sample from consent to the medical decision, then scale up to the whole cohort.</p>
			<ul><li><span>1</span>Data governance (GDPR, consent)</li><li><span>2</span>Sequencing quality control</li><li><span>3</span>Variant interpretation</li><li><span>4</span>Cohort biostatistics</li><li><span>5</span>Machine learning for screening</li><li><span>6</span>Clinical report & ethics</li></ul>
			<button class="bd-btn dark" data-a="m1">Start the case</button>`);
	}

	/* ---------- actions ---------- */
	const GO = { m1:mission1, m2:mission2, m3:mission3, m4:mission4, m5:mission5, m6:mission6 };
	root.addEventListener("click", e => {
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(GO[k]) return GO[k]();
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ In my notebook" : "♡ Add to my notebook"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ S.errors = 0; S.learned = new Set(); S.done = new Set(); helixHot = -1; renderSkills(); $("#bdErr").textContent = "0 error"; term.innerHTML = ""; return mission1(); }
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
	if(window.campus) window.campus.game = { S, GO, cohort, FIELDS, RUNS, PASS, CAND, VARS, REPORT, get m5(){ return m5; }, fitPredict, rocOf };
}
