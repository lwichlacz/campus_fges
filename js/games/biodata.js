/* « From Blood to Decision » — mini-jeu du Master Data Management in Biosciences (École du Numérique).
   En anglais, comme le master (enseigné 100 % en anglais), et au niveau d'un candidat en master (bac+3/4) : environ 8 à 10 minutes.
   D'après la maquette des relations presse (un patient fatigué, une prise de sang, « from biology to data, from data to decision »),
   prolongée du cas individuel à l'étude de cohorte, en quatre missions (contrôle qualité du séquençage et compte rendu clinique retirés le 12/11/2026 pour tenir en 10 minutes) :
   1. data governance : minimisation et pseudonymisation du dossier, chaîne complète (consentement, hébergeur certifié HDS) ;
   2. variant interpretation : fréquence allélique (VAF) et zygotie, classement de type ACMG à partir de preuves,
      puis découverte fortuite (BRCA2) traitée selon le consentement signé en mission 1 ;
   3. cohort biostatistics : 240 patients simulés, choix du test sur une distribution asymétrique, p-value, effet du sexe ;
   4. machine learning : choix des variables (fuites de données), découpage par patient, seuil sur la courbe ROC ;
   Cas : hémochromatose HFE C282Y homozygote. Séquences, cohorte et chiffres sont simulés ; contenu à relire par l'équipe du master.
   Retours du master du 13/11/2026 : retour, indice et « passer » à chaque étape ; vocabulaire simplifié (« mutation »,
   « harmful / harmless ») ; chaîne de données en six étapes ; statistiques et score du modèle expliqués plus simplement ;
   plus de compteur d'erreurs ni de mention : une découverte, pas un test. */

import * as THREE from "three";
import { jpoCard } from "./jpo.js?v=979a7cec82";
import { palier } from "./palier.js?v=979a7cec82";
import { coldChain } from "./coldchain.js?v=979a7cec82";

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
const NM = 4;

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


/* ---------- portraits d'Alex et de la médecin, dans le style low-poly du campus (rendus une fois en 3D) ---------- */
function portraits(){
	const out = {};
	let r;
	try { r = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true }); }
	catch(e){ return out; }
	const S = 320; r.setPixelRatio(1); r.setSize(S, S, false);
	const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color:c, roughness:.85, flatShading:true }, o));
	const add = (g, geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); g.add(me); return me; };
	const SPH = new THREE.IcosahedronGeometry(1, 1), BOX = new THREE.BoxGeometry(1, 1, 1);
	function scene(build, bg){
		const sc = new THREE.Scene();
		sc.add(new THREE.HemisphereLight("#fff3e0", "#7d6a5a", 1.6));
		const sun = new THREE.DirectionalLight("#fff1dc", 2.2); sun.position.set(2.5, 3, 4); sc.add(sun);
		const g = new THREE.Group(); sc.add(g); build(g);
		const cam = new THREE.PerspectiveCamera(30, 1, .1, 50); cam.position.set(.4, 1.5, 3.5); cam.lookAt(0, 1.22, 0);
		r.render(sc, cam);
		// fond rond coloré, comme les pastilles du site
		const c = document.createElement("canvas"); c.width = c.height = S; const x = c.getContext("2d");
		const gr = x.createRadialGradient(S/2, S*.42, S*.1, S/2, S/2, S*.5); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
		x.fillStyle = gr; x.beginPath(); x.arc(S/2, S/2, S/2, 0, Math.PI*2); x.fill();
		x.save(); x.beginPath(); x.arc(S/2, S/2, S/2, 0, Math.PI*2); x.clip(); x.drawImage(r.domElement, 0, 0); x.restore();
		sc.traverse(o => { if(o.isMesh) o.material.dispose(); });
		return c.toDataURL("image/png");
	}
	const torso = (g, m) => {
		add(g, new THREE.CylinderGeometry(.5, .78, 1.1, 8), m, 0, .45, 0);
		for(const s of [-1, 1]) add(g, SPH, m, s*.47, .88, 0, .3, .22, .3);
	};
	const eyes = (g, skin, tired) => {
		const dark = mat("#22252b", { roughness:.4 });
		for(const s of [-1, 1]){
			add(g, SPH, mat("#ffffff"), s*.15, 1.47, .37, .075, .06, .04);
			add(g, SPH, dark, s*.15, 1.465, .405, .04, .045, .02);
			if(tired){
				add(g, BOX, skin, s*.15, 1.515, .39, .17, .06, .05).rotation.z = -s*.15;              // paupières lourdes
				add(g, SPH, mat("#c7a0a8"), s*.15, 1.385, .385, .08, .028, .02);                      // cernes
			}
		}
	};
	// Alex : 27 ans, roux, veste bleue à capuche, tee-shirt vert-gris, l'air fatigué
	out.alex = scene(g => {
		const skin = mat("#f1c9a5"), jacket = mat("#2f5592"), hair = mat("#b5562b");
		torso(g, jacket);
		add(g, BOX, mat("#9fb2a6"), 0, .66, .58, .3, .68, .06).rotation.x = -.25;                    // tee-shirt dans l'ouverture
		add(g, BOX, mat("#1f3c6e"), 0, .62, .62, .03, .6, .03).rotation.x = -.25;                    // fermeture éclair
		add(g, new THREE.TorusGeometry(.36, .1, 6, 14), jacket, 0, 1.0, -.08).rotation.x = Math.PI/2.1;   // capuche
		add(g, new THREE.CylinderGeometry(.16, .18, .28, 8), skin, 0, 1.08, 0);
		add(g, SPH, skin, 0, 1.45, 0, .42, .47, .42);
		add(g, SPH, hair, 0, 1.64, -.04, .45, .3, .45);                                               // calotte
		for(let k=0;k<5;k++){ const m = add(g, new THREE.ConeGeometry(.11, .26, 5), hair, -.24 + k*.12, 1.76, .3 - Math.abs(k - 2)*.04); m.rotation.set(1.25, 0, (k - 2)*.22); }   // mèches en avant
		for(const s of [-1, 1]) add(g, SPH, skin, s*.42, 1.44, 0, .07, .1, .06);                       // oreilles
		eyes(g, skin, true);
		add(g, BOX, mat("#a8604f"), 0, 1.27, .39, .14, .025, .02).rotation.z = .05;                  // bouche
		add(g, SPH, skin, 0, 1.38, .43, .055, .07, .05);                                              // nez
	}, ["#f6eefc", "#d9c8ef"]);
	// la médecin : blouse blanche sur une tenue bleu FGES, stéthoscope, lunettes, chignon
	out.doctor = scene(g => {
		const skin = mat("#c68b62"), coat = mat("#f4f4f1"), hair = mat("#2b2a33"), metal = mat("#3a3f47", { roughness:.35, metalness:.5 });
		torso(g, coat);
		add(g, BOX, mat("#21b6ce"), 0, .7, .58, .28, .62, .05).rotation.x = -.25;                    // tenue bleu FGES
		for(const s of [-1, 1]){ const l = add(g, BOX, mat("#dcdcd6"), s*.17, .72, .61, .1, .6, .04); l.rotation.set(-.25, 0, s*.35); }   // revers
		add(g, BOX, mat("#1e305e"), .33, .6, .62, .2, .09, .02).rotation.x = -.25;                   // badge
		add(g, new THREE.CylinderGeometry(.16, .18, .28, 8), skin, 0, 1.08, 0);
		for(const s of [-1, 1]){ const t = add(g, new THREE.CylinderGeometry(.022, .022, .5, 6), metal, s*.13, .78, .64); t.rotation.set(-.25, 0, s*.18); }   // stéthoscope autour du cou
		add(g, new THREE.TorusGeometry(.17, .022, 6, 14, Math.PI), metal, 0, 1.0, .5).rotation.x = -.5;
		add(g, new THREE.CylinderGeometry(.07, .07, .03, 12), metal, -.08, .5, .68).rotation.x = Math.PI/2 - .25;
		add(g, SPH, skin, 0, 1.45, 0, .42, .47, .42);
		add(g, SPH, hair, 0, 1.66, -.06, .45, .3, .46);
		for(const s of [-1, 1]){ add(g, SPH, hair, s*.37, 1.42, -.1, .13, .34, .22); add(g, SPH, hair, s*.33, 1.16, -.16, .12, .2, .18); }   // cheveux mi-longs
		add(g, SPH, hair, 0, 1.62, -.44, .2, .2, .2);                                                 // chignon
		for(const s of [-1, 1]) add(g, SPH, skin, s*.42, 1.44, 0, .07, .1, .06);
		eyes(g, skin, false);
		for(const s of [-1, 1]) add(g, new THREE.TorusGeometry(.1, .016, 6, 16), metal, s*.15, 1.47, .43);   // lunettes
		add(g, BOX, metal, 0, 1.48, .44, .1, .016, .016);
		add(g, new THREE.TorusGeometry(.09, .018, 6, 12, Math.PI), mat("#8c3b34"), 0, 1.3, .4).rotation.z = Math.PI;   // sourire
		add(g, SPH, skin, 0, 1.38, .43, .055, .07, .05);
	}, ["#e9f8fb", "#bfe6ee"]);
	r.dispose(); r.forceContextLoss && r.forceContextLoss();
	return out;
}

const CSS = `
.bd{position:fixed;inset:0;z-index:40;font-family:Inter,Arial,sans-serif;font-weight:300;color:#1f2a37;background:linear-gradient(160deg,#fdf8ec,#fdf8ec);overflow:auto;animation:bdIn .35s ease both}
@keyframes bdIn{from{opacity:0}to{opacity:1}}
.bd *{box-sizing:border-box}
.bd-top{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;background:rgba(253,248,236,.94);backdrop-filter:blur(6px)}
.bd-chip{background:#fff;border-radius:999px;padding:7px 12px;font-weight:800;font-size:13px;box-shadow:0 4px 14px rgba(15,49,104,.1);white-space:nowrap}
.bd-chip.st{background:#0f3168;color:#fff}
.bd-chip.pt{color:#6b3fa0}
.bd-dots{display:flex;gap:5px;align-items:center;background:#fff;border-radius:999px;padding:9px 12px;box-shadow:0 4px 14px rgba(15,49,104,.1)}
.bd-dots i{width:10px;height:10px;border-radius:50%;background:#dbe3ea}
.bd-dots i.on{background:#cb971a}.bd-dots i.done{background:#96711a}
.bd-x{margin-left:auto;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 14px rgba(15,49,104,.15)}
.bd-grid{display:grid;grid-template-columns:260px minmax(0,1fr) 280px;gap:12px;padding:4px 12px 16px;max-width:1340px;margin:0 auto}
.bd-pan{background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:12px 14px;box-shadow:0 6px 18px rgba(15,49,104,.06);min-width:0}
.bd-pan h4{margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b7a}
.bd-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.bd-helix{width:100%;height:110px;display:block}
.bd-file p{margin:4px 0;font-size:13px;line-height:1.45}
.bd-file b{color:#0f3168}
.bd-skills{display:flex;flex-wrap:wrap;gap:5px}
.bd-skills span{background:#fdf8ec;color:#6b3fa0;border-radius:999px;padding:3px 9px;font-size:11.5px;font-weight:800}
.bd-skills em{font-style:normal;color:#8a95a1;font-size:12.5px}
.bd-mis .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#96711a;font-weight:800}
.bd-mis h3{font:300 22px/1.2 Tiempos Headline,Times New Roman,serif;margin:2px 0 6px}
.bd-mis p{margin:0 0 8px;font-size:14px;line-height:1.55}
.bd-step{display:inline-block;background:#fdf8ec;color:#96711a;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;margin-bottom:6px}
.bd-live{font-weight:800;color:#0f3168;font-size:13.5px;margin:6px 0}
.bd-live:empty{display:none}
.bd-help{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.bd-hb{border:1px solid #d3dae1;background:#fff;border-radius:999px;padding:7px 12px;min-height:36px;font:700 13px Inter,Arial,sans-serif;color:#0f3168;cursor:pointer}
.bd-hb:hover{border-color:#cb971a}
.bd-hb:disabled{opacity:.4;cursor:default}
.bd-hb[data-h="skip"]{margin-left:auto}
.bd-hint{margin-top:8px;background:#fdf8ec;border-left:4px solid #cb971a;border-radius:0 10px 10px 0;padding:8px 10px;font-size:13.5px;line-height:1.5}
.bd-hint[hidden]{display:none}
.bd-score{background:#f6f8fa;border-radius:12px;padding:8px 10px;font-size:13.5px;line-height:1.5;margin:4px 0 8px}
.bd-gauge{margin:8px 0;background:#f6f8fa;border-radius:12px;padding:10px 12px}
.bd-gauge .bar{position:relative;height:10px;border-radius:999px;background:linear-gradient(90deg,#ffd7db,#dff6e8 60%,#dff6e8 90%,#ffd7db)}
.bd-gauge .bar i{position:absolute;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#0f3168;border:3px solid #fff;box-shadow:0 2px 6px rgba(15,49,104,.3)}
.bd-gauge .lab{display:flex;justify-content:space-between;gap:8px;margin-top:6px;font-size:12px;font-weight:700;color:#5b6b7a}
.bd-gauge .lab b{color:#0f3168;font-size:14px}
.bd-gauge p{margin:4px 0 0;font-weight:700;font-size:13.5px}
.bd-gauge.good p{color:#1c7a43}.bd-gauge.bad p{color:#b3132a}
.bd-btn{border:0;border-radius:12px;padding:11px 14px;font:700 14.5px Inter,Arial,sans-serif;cursor:pointer;background:#cb971a;color:#0f3168}
.bd-btn.dark{background:#0f3168;color:#fff}
.bd-btn.alt{background:#fff;border:2px solid #d3dae1;color:#0f3168}
.bd-btn:disabled{opacity:.45;cursor:default}
.bd-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
.bd-term{font:300 12.5px/1.45 Inter,Arial,sans-serif;background:#16202b;color:#b9f3d0;border-radius:10px;padding:8px 10px;min-height:120px;max-height:300px;overflow:auto}
.bd-term .ko{color:#ff8b95}.bd-term .inf{color:#fdf8ec}
.bd-code{font:300 12px/1.5 Inter,Arial,sans-serif;background:#16202b;color:#d6dde6;border-radius:10px;padding:8px 10px;white-space:pre;overflow-x:auto;margin:8px 0 0}
.bd-code .c{color:#7d8896}.bd-code .s{color:#cb971a}.bd-code .k{color:#cb971a}
.bd-course{background:#fdf8ec;border-left:4px solid #96711a;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:13px}
.bd-course .tag{display:block;font-size:11px;font-weight:800;color:#6b3fa0;text-transform:uppercase;letter-spacing:.08em}
.bd-course b{display:block;margin:2px 0}
.bd-fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin:8px 0}
.bd-field{border:2px solid #dbe3ea;border-radius:12px;padding:9px 10px;background:#fbfdff}
.bd-field b{display:block;font-size:12px;color:#5b6b7a;text-transform:uppercase;letter-spacing:.05em}
.bd-field span{display:block;font-weight:800;margin:2px 0 6px;font-size:14px}
.bd-field.bad{border-color:#ff4d5e;background:#fff3f4}
.bd-seg{display:flex;gap:4px}
.bd-seg button{flex:1;border:0;border-radius:8px;padding:6px 4px;font:700 12px Inter,Arial,sans-serif;cursor:pointer;background:#eef1f4;color:#4b5866}
.bd-seg button.on.keep{background:#dff6e8;color:#1c7a43}.bd-seg button.on.tr{background:#fdf8ec;color:#96711a}.bd-seg button.on.rm{background:#ffe3e6;color:#b3132a}
.bd-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin:8px 0}
.bd-card{border:2px solid #dbe3ea;background:#fbfdff;border-radius:12px;padding:10px;text-align:left;font:300 13.5px/1.35 Inter,Arial,sans-serif;cursor:pointer;display:flex;gap:8px;align-items:flex-start;color:#1f2a37}
.bd-card i{font-style:normal;font-size:20px;line-height:1}
.bd-card:hover{border-color:#cb971a}
.bd-card.used{opacity:.3;pointer-events:none}
.bd-pipe{list-style:none;margin:8px 0;padding:0;counter-reset:s}
.bd-pipe li{counter-increment:s;display:flex;align-items:center;gap:10px;min-height:46px;border:2px dashed #c9d2db;border-radius:12px;padding:6px 10px;margin:6px 0;font-weight:700;font-size:13.5px;background:#fff}
.bd-pipe li:before{content:counter(s);width:26px;height:26px;border-radius:50%;background:#0f3168;color:#fff;display:grid;place-items:center;font-size:12px;flex:none}
.bd-pipe li.full{border-style:solid;border-color:#cb971a;cursor:pointer}
.bd-pipe li.bad{border-color:#ff4d5e;background:#fff3f4}.bd-pipe li.ok{border-color:#3bd16f;background:#f1fcf5}
.bd-pipe li .ph{margin-left:auto;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b3fa0;background:#fdf8ec;border-radius:999px;padding:3px 9px;white-space:nowrap;animation:bdPop .4s ease both}
.bd-pipe li .emp{color:#8a95a1}
@keyframes bdPop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.bd-rules{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.bd-rules span{background:#fdf8ec;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800;color:#96711a}
.bd-scroll{overflow-x:auto}
.bd-tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin:6px 0;min-width:640px}
.bd-tbl th{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5b6b7a;text-align:left;padding:6px 5px;border-bottom:2px solid #e3e8ed}
.bd-tbl td{padding:7px 5px;border-bottom:1px solid #eef1f4;font-weight:700}
.bd-tbl tr.alex td:first-child{color:#6b3fa0}
.bd-tbl tr.wrong td{background:#fff3f4}
.bd-tog{border:0;border-radius:999px;padding:6px 10px;font:700 12px Inter,Arial,sans-serif;cursor:pointer;min-width:84px}
.bd-tog.keep{background:#dff6e8;color:#1c7a43}.bd-tog.drop{background:#ffe3e6;color:#b3132a}
.bd-chart{width:100%;display:block;margin:4px 0;background:#fbfdff;border-radius:10px}
.bd-slider{display:grid;grid-template-columns:150px 1fr 70px;gap:10px;align-items:center;font-weight:800;font-size:13.5px;margin:8px 0}
.bd-slider input{width:100%;accent-color:#cb971a}
.bd-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:8px 0}
.bd-kpi div{background:#f6f8fa;border-radius:12px;padding:8px 10px}
.bd-kpi b{display:block;font-size:20px;color:#0f3168}
.bd-kpi span{font-size:11.5px;font-weight:800;color:#5b6b7a;text-transform:uppercase;letter-spacing:.05em}
.bd-kpi .good b{color:#1c7a43}.bd-kpi .bad b{color:#b3132a}
.bd-pile{font:300 15px/1.25 Inter,Arial,sans-serif;background:#16202b;color:#d6dde6;border-radius:12px;padding:10px;overflow-x:auto;white-space:pre;user-select:none}
.bd-pile .ref{color:#cb971a}.bd-pile .mm{color:#ff8b95;background:rgba(255,139,149,.12)}.bd-pile .lq{color:#6b7480}
.bd-var{border:2px solid #dbe3ea;border-radius:14px;padding:10px 12px;margin:8px 0;background:#fbfdff}
.bd-var.bad{border-color:#ff4d5e}
.bd-var h5{margin:0 0 6px;font-size:14.5px}
.bd-ev{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px;margin:6px 0}
.bd-ev div{background:#fff;border:1px solid #e3e8ed;border-radius:10px;padding:6px 8px;font-size:12.5px;line-height:1.4}
.bd-ev div b{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#5b6b7a}
.bd-opts{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.bd-opts button{border:2px solid #dbe3ea;background:#fff;border-radius:999px;padding:6px 11px;font:700 12.5px Inter,Arial,sans-serif;cursor:pointer;color:#1f2a37}
.bd-opts button.on{border-color:#cb971a;background:#fdf8ec}
.bd-choice{display:flex;flex-direction:column;gap:8px;margin:8px 0}
.bd-choice button{border:2px solid #dbe3ea;background:#fff;border-radius:12px;padding:10px 12px;text-align:left;font:700 14px/1.45 Inter,Arial,sans-serif;cursor:pointer;color:#1f2a37}
.bd-choice button:hover{border-color:#cb971a}
.bd-choice button.on{border-color:#cb971a;background:#fdf8ec}
.bd-choice button.bad{border-color:#ff4d5e;background:#fff3f4}
.bd-feat{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin:8px 0}
.bd-feat label{display:flex;gap:8px;align-items:flex-start;border:2px solid #dbe3ea;border-radius:12px;padding:8px 10px;font-weight:700;font-size:13px;cursor:pointer;background:#fbfdff}
.bd-feat label.on{border-color:#cb971a;background:#fdf8ec}
.bd-feat small{display:block;color:#5b6b7a;font-weight:600}
.bd-consent{background:#f6f8fa;border:1px dashed #b9c4cf;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.6;margin:8px 0}
.bd-ov{position:fixed;inset:0;z-index:5;display:grid;place-items:center;padding:14px;background:rgba(20,30,45,.35)}
.bd-ov[hidden]{display:none}
.bd-crd{max-width:560px;width:100%;max-height:100%;overflow:auto;background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 20px 50px rgba(20,30,45,.35);animation:bdUp .3s ease both}
@keyframes bdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.bd-crd h2{font:300 25px/1.15 Tiempos Headline,Times New Roman,serif;margin:4px 0 8px}
.bd-crd .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#96711a;font-weight:800}
.bd-crd p{font-size:14.5px;line-height:1.55;margin:0 0 10px}
.bd-crd ul{list-style:none;margin:0 0 12px;padding:0}
.bd-crd li{display:flex;gap:8px;align-items:center;background:#f2f5f7;border-radius:10px;padding:7px 10px;margin:5px 0;font-weight:700;font-size:13.5px}
.bd-crd li span{background:#0f3168;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px;flex:none}
.bd-say{display:flex;gap:10px;align-items:flex-start;margin:8px 0}
.bd-say .av{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:#fdf8ec;overflow:hidden}
.bd-say .av img{width:100%;height:100%;display:block}
.bd-who{display:flex;gap:10px;align-items:center;margin-bottom:6px}
.bd-who img{width:64px;height:64px;border-radius:50%;flex:none}
.bd-duo{display:flex;justify-content:center;gap:14px;margin:6px 0 10px}
.bd-duo img{width:92px;height:92px;border-radius:50%;box-shadow:0 8px 20px rgba(15,49,104,.18)}
.bd-say .bub{background:#f2f5f7;border-radius:14px;padding:9px 12px;font-size:14px;line-height:1.45}
.bd-say.doc .av{background:#fdf8ec}
.bd-crd .bd-btn{width:100%;margin-top:6px}
.bd-alt{display:block;text-align:center;margin-top:8px;font-weight:800;color:#0f3168;background:none;border:0;cursor:pointer;width:100%;font-size:14px;text-decoration:none}
.bd-big{font-size:46px;text-align:center;margin:4px 0}
.bd-lang{display:inline-block;background:#fdf8ec;color:#6b3fa0;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:800;margin:0 6px 6px 0}
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
		<div class="bd-top"><span class="bd-chip st" id="bdSt">Bio-data lab</span><span class="bd-dots" id="bdDots">${"<i></i>".repeat(NM)}</span><span class="bd-chip pt" id="bdPt">Patient: Alex, 27 · P-0412</span><button class="bd-x" aria-label="Close the game">×</button></div>
		<div class="bd-grid">
			<div class="bd-col">
				<div class="bd-pan" id="bdHelix"><h4>Sample P-0412</h4><canvas class="bd-helix" width="520" height="220"></canvas></div>
				<div class="bd-pan bd-file" id="bdFile"><h4>Case file</h4>
					<div class="bd-who" id="bdWho"></div>
					<p><b>Alex, 27</b>, student. Unusually tired for months, joint pain. Rest and vitamins have not helped.</p>
					<p>First blood tests: <b>ferritin 1,140 µg/L</b>, <b>transferrin saturation 78 %</b> (both high).</p>
					<p>An <b>exome</b> is sequenced, then analysed first on the genes of iron overload (a virtual gene panel). In the lab, Alex becomes <b>P-0412</b>.</p></div>
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
	const S = { errors:0, mission:0, step:0, learned:new Set(), done:new Set() };
	let closed = false;
	const cohort = makeCohort();
	const PT = portraits();
	const av = (k, emoji) => PT[k] ? `<img src="${PT[k]}" alt="">` : emoji;

	/* ---------- interface commune ---------- */
	const mis = $("#bdMis"), work = $("#bdWork"), term = $("#bdTerm");
	const seen = new Set();
	function log(t, cls = ""){ const d = document.createElement("div"); if(cls) d.className = cls; d.textContent = "> " + t; term.appendChild(d); while(term.children.length > 60) term.firstChild.remove(); term.scrollTop = term.scrollHeight; }
	function logOnce(k, t){ if(seen.has(k)) return; seen.add(k); log(t, "inf"); }
	// une erreur s'explique dans le carnet, sans compteur ni note : c'est une découverte, pas un test (master DMB, 13/11/2026)
	function err(t){ S.errors++; play("bad"); onEvent && onEvent("err", t); if(t) log(t, "ko"); }
	function stage(t){ $("#bdSt").textContent = t; onEvent && onEvent("stage", t); }
	function dots(){ root.querySelectorAll("#bdDots i").forEach((d, k) => { d.className = S.done.has(k + 1) ? "done" : (S.mission === k + 1 ? "on" : ""); }); }
	function course(k){ const [y, n, t] = COURSES[k]; S.learned.add(k); renderSkills(); return `<div class="bd-course"><span class="tag">📚 In the Master · ${y}</span><b>${n}</b>${t}</div>`; }
	function renderSkills(){ const sk = [...S.learned].map(k => `<span>${COURSES[k][1]}</span>`); $("#bdSk").innerHTML = sk.length ? sk.join("") : "<em>None yet</em>"; }
	function card(html){ $("#bdCard").innerHTML = html; $("#bdOv").hidden = false; $("#bdCard").scrollTop = 0; }
	function uncard(){ $("#bdOv").hidden = true; }
	const MIS = { 1:["Data governance", "data protection"], 2:["Reading Alex's DNA", "bioinformatics"], 3:["From one patient to 240", "biostatistics & epidemiology"], 4:["A model to decide who gets tested", "AI & data mining"] };

	/* ---------- les étapes : retour, indice, passer ----------
	   Chaque étape (STEPS, plus bas) sait s'afficher depuis zéro, donner un indice et se résoudre seule : le joueur n'est
	   jamais bloqué et peut revenir en arrière (demandé par le master DMB le 13/11/2026). « Passer » montre la bonne réponse. */
	function show(i, intro){
		const s = STEPS[i], n = s.m, inM = STEPS.filter(t => t.m === n);
		S.step = i; S.mission = n; S.hinted = false; uncard();
		stage(`Mission ${n}/${NM} · ${MIS[n][0]}`); dots();
		mis.innerHTML = `<span class="k">Mission ${n} · ${MIS[n][1]}</span><h3>${MIS[n][0]}</h3>
			<span class="bd-step">Step ${inM.indexOf(s) + 1} of ${inM.length} · ${s.label}</span>${intro}<p class="bd-live" id="bdLive"></p>
			<div class="bd-help"><button class="bd-hb" data-h="back"${i ? "" : " disabled"}>← Back</button><button class="bd-hb" data-h="hint">💡 Hint</button><button class="bd-hb" data-h="skip">Skip →</button></div>
			<div class="bd-hint" id="bdHint" hidden></div>`;
		root.scrollTop = 0;
	}
	const live = t => { const l = $("#bdLive"); if(l) l.textContent = t; };
	const go = i => { if(!closed && STEPS[i]) STEPS[i].enter(i); };
	const next = () => go(S.step + 1);
	let helpLock = 0;
	function help(h){
		const s = STEPS[S.step]; if(!s || closed || S.cold) return;
		if(h === "back"){ play("pop"); return go(S.step - 1); }
		if(h === "hint"){
			const b = $("#bdHint"); b.hidden = false; b.innerHTML = `💡 ${s.hint}`;
			if(!S.hinted){ S.hinted = true; log(`Hint: ${s.hint}`, "inf"); onEvent && onEvent("hint", s.label); }
			return;
		}
		if(h === "skip"){
			if(performance.now() < helpLock) return;      // un double clic ne saute pas deux étapes
			helpLock = performance.now() + 900;
			log("Step skipped: here is the answer", "inf"); onEvent && onEvent("skip", s.label);
			s.skip();
		}
	}
	function complete(n, title, text, courses, nxt){
		const at = S.step;
		S.done.add(n); dots(); play("good");
		setTimeout(() => { if(closed || S.step !== at) return;
			card(`<div class="k">Mission ${n} complete</div><h2>${title}</h2><p>${text}</p>${courses.map(course).join("")}
				<button class="bd-btn dark" data-a="${nxt[0]}">${nxt[1]} →</button>`); }, 700);
	}
	const okChoice = () => work.querySelector('.bd-choice button[data-k="ok"]')?.click();
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
	function chart(id, w = 760, h = 300){ const c = work.querySelector("#" + id); c.width = w; c.height = h; const x = c.getContext("2d"); x.clearRect(0, 0, w, h); x.font = "700 16px Inter,Arial,sans-serif"; return [x, w, h]; }
	function axes(x, w, h, pad, ylab, xlab){
		x.strokeStyle = "#c9d2db"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(pad, 10); x.lineTo(pad, h - pad); x.lineTo(w - 10, h - pad); x.stroke();
		x.fillStyle = "#5b6b7a"; x.font = "700 15px Inter,Arial,sans-serif";
		if(xlab) x.fillText(xlab, w - 10 - x.measureText(xlab).width, h - 6);
		if(ylab){ x.save(); x.translate(14, 14 + x.measureText(ylab).width); x.rotate(-Math.PI/2); x.fillText(ylab, 0, 0); x.restore(); }
	}
	// question à choix : la bonne réponse fait avancer, les autres s'expliquent dans le carnet
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
		{ id:"name", f:"Full name", v:"Alex Martin", a:"rm", why:"It says who Alex is: it never enters a research dataset." },
		{ id:"ssn", f:"Social security number", v:"1 98 03 59 350 …", a:"rm", why:"It says who Alex is, and no analysis needs it." },
		{ id:"mail", f:"E-mail address", v:"alex.m@…", a:"rm", why:"It says who Alex is, and is useless for the analysis." },
		{ id:"dob", f:"Date of birth", v:"14/03/1998", a:"tr", why:"Keep the information, not the precision: an age (27) is enough." },
		{ id:"zip", f:"Postcode", v:"59000 Lille", a:"tr", why:"A full postcode helps find someone again: keep only the département (59)." },
		{ id:"sex", f:"Sex", v:"Male", a:"keep", why:"Needed: this iron overload hits men harder than women." },
		{ id:"sym", f:"Symptoms", v:"Fatigue, joint pain", a:"keep", why:"The medical question itself." },
		{ id:"fer", f:"Ferritin", v:"1,140 µg/L", a:"keep", why:"Key blood marker of iron overload." },
		{ id:"ts", f:"Transferrin saturation", v:"78 %", a:"keep", why:"Key blood marker of iron overload." },
		{ id:"code", f:"Sample code", v:"P-0412", a:"keep", why:"The pseudonym that links data and sample without revealing who Alex is." }
	];
	// six étapes au plus (master DMB, 13/11/2026) : le contrôle qualité est retiré, analyse et compte rendu ne font plus qu'une
	const PIPE = [
		{ id:"consent", i:"✍️", t:"Alex signs the consent form (diagnosis, research, unexpected findings)", ph:"Ethics" },
		{ id:"sample",  i:"🩸", t:"Blood sample collected", ph:"Biological sample" },
		{ id:"pseudo",  i:"🔒", t:"Pseudonymise: Alex becomes P-0412", ph:"Data protection" },
		{ id:"seq",     i:"🧬", t:"Read the DNA (sequencing)", ph:"Data generation" },
		{ id:"hds",     i:"🏛️", t:"Store the raw data on a certified health-data host (HDS)", ph:"Data storage" },
		{ id:"report",  i:"🩺", t:"Find the mutation; a clinical biologist validates the report and discusses it with Alex", ph:"Analysis & decision" }
	];
	const TRAP = { id:"cloud", i:"☁️", t:"Upload the raw DNA data to a free public cloud drive to share it with a partner lab" };
	let m1 = null;
	const newM1 = () => ({ ans:Object.fromEntries(FIELDS.map(f => [f.id, "keep"])), slots:Array(PIPE.length).fill(null) });
	function m1Fields(i){
		m1 = m1 || newM1();
		show(i, `${S.teased ? "" : `<div class="bd-say"><div class="av">${av("alex", "🧑")}</div><div class="bub">I've been unusually tired for months, and nothing helps.</div></div>
			<div class="bd-say doc"><div class="av">${av("doctor", "👩‍⚕️")}</div><div class="bub">Your iron levels are very high. I'd like a genetic analysis.</div></div>
			<p>🇬🇧 In English, like the Master. You join the health data team: take Alex's sample from consent to the medical decision.</p>`}<p>Alex's record is about to enter the lab's research database. The GDPR says: keep <b>only what the research needs</b>. For each field, decide whether it is <b>kept</b>, <b>blurred</b> (made less precise) or <b>removed</b>.</p>`);
		renderFields();
		logOnce("m1", "Mission 1: record P-0412 enters the research database");
		// ouverture à chaud : la première fois, la minimisation se fait à la main, sur le tube, dans la biobanque
		if(!S.teased && !S.cold){
			S.cold = coldChain({ host:root, fields:FIELDS, av, play,
				onHelp:k => { log(k === "hint" ? "Hint asked in the biobank" : "Biobank step skipped: here is the answer", "inf"); onEvent && onEvent(k, "biobank"); },
				onWrong:list => { err(`Storage blocked by the data protection officer: ${list.length} strip${list.length > 1 ? "s" : ""} to reconsider`); list.slice(0, 3).forEach(f => log(`${f.f}: ${f.why}`, "ko")); },
				onDone:() => { S.cold = null; FIELDS.forEach(f => m1.ans[f.id] = f.a); renderFields(); $("#m1a").click(); } });
		}
	}
	function renderFields(bad = []){
		work.innerHTML = `<h4>Alex's record</h4><div class="bd-fields">${FIELDS.map(f => `<div class="bd-field ${bad.includes(f.id) ? "bad" : ""}"><b>${f.f}</b><span>${f.v}</span>
			<div class="bd-seg" data-f="${f.id}">${[["keep", "Keep"], ["tr", "Blur"], ["rm", "Remove"]].map(([k, l]) => `<button class="${k} ${m1.ans[f.id] === k ? "on" : ""}" data-v="${k}">${l}</button>`).join("")}</div></div>`).join("")}</div>
			<div class="bd-row"><button class="bd-btn dark" id="m1a">▶ Export the research dataset</button></div>`;
		work.querySelectorAll(".bd-seg").forEach(sg => sg.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m1.ans[sg.dataset.f] = b.dataset.v; play("pop"); renderFields(bad.filter(id => id !== sg.dataset.f)); })));
		$("#m1a").addEventListener("click", () => {
			const wrong = FIELDS.filter(f => m1.ans[f.id] !== f.a);
			if(wrong.length){ err(`Export blocked by the data protection officer: ${wrong.length} field${wrong.length > 1 ? "s" : ""} to reconsider`); wrong.slice(0, 3).forEach(f => log(`${f.f}: ${f.why}`, "ko")); renderFields(wrong.map(f => f.id)); return live("Fields in red need another decision."); }
			log("Dataset exported: 3 fields removed, 2 blurred, 5 kept"); play("good");
			$("#m1a").disabled = true;
			if(S.teased) return next();
			// fin de la scène d'ouverture : le dossier d'Alex est prêt pour la recherche
			S.teased = true;
			const at = S.step;
			setTimeout(() => !closed && palier({ id:"biodata", en:true, onEvent, openLead, quit:close,
				titre:"Alex's record is GDPR-ready: minimised and pseudonymised.",
				texte:"Next: put the data chain in order, read Alex's DNA to find the mutation behind the iron overload, then scale up to 240 patients and a screening model.",
				suite:"Solve the whole case (≈ 8 min)" }).then(() => { if(!closed && S.step === at) next(); }), 1200);
		});
	}
	function m1Pipe(i){
		m1 = m1 || newM1();
		show(i, `<p>Now put the chain in order, from consent to the report. One card must <b>never</b> be part of it.</p>`);
		renderPipe();
	}
	function renderPipe(){
		const cards = shuffle([...PIPE, TRAP], 11);
		work.innerHTML = `<h4>Available steps</h4><div class="bd-cards">${cards.map(c => `<button class="bd-card ${m1.slots.includes(c.id) ? "used" : ""}" data-c="${c.id}"><i>${c.i}</i><span>${c.t}</span></button>`).join("")}</div>
			<h4>Your chain <small style="text-transform:none;letter-spacing:0">(tap a step to remove it)</small></h4>
			<ol class="bd-pipe">${m1.slots.map((id, k) => { const c = id && (PIPE.find(s => s.id === id) || TRAP); return `<li class="${c ? "full" : ""}" data-s="${k}">${c ? `<i style="font-style:normal">${c.i}</i>${c.t}` : `<span class="emp">empty</span>`}</li>`; }).join("")}</ol>
			<div class="bd-row"><button class="bd-btn dark" id="m1b" ${m1.slots.every(Boolean) ? "" : "disabled"}>▶ Run the chain</button><button class="bd-btn alt" id="m1r">Clear</button></div>`;
		work.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { const k = m1.slots.indexOf(null); if(k < 0) return; m1.slots[k] = b.dataset.c; play("pop"); renderPipe(); }));
		work.querySelectorAll("li.full").forEach(li => li.addEventListener("click", () => { m1.slots[+li.dataset.s] = null; renderPipe(); }));
		$("#m1r").addEventListener("click", () => { m1.slots.fill(null); renderPipe(); });
		$("#m1b").addEventListener("click", checkPipe);
		const left = m1.slots.filter(s => !s).length;
		live(left ? `${left} step${left > 1 ? "s" : ""} to place` : "Chain complete: run it!");
	}
	function checkPipe(){
		const s = m1.slots, lis = work.querySelectorAll(".bd-pipe li");
		if(s.includes("cloud")){ lis[s.indexOf("cloud")].classList.add("bad"); return err("Blocked: health data may only be stored and shared through certified, contractual channels (HDS, GDPR)"); }
		// la pseudonymisation : au prélèvement ou juste après le séquençage, toujours avant le stockage et l'analyse
		const ideal = s.indexOf("pseudo") === 3 ? ["consent", "sample", "seq", "pseudo", "hds", "report"] : PIPE.map(p => p.id);
		if(s.every((id, k) => id === ideal[k])){
			lis.forEach((li, k) => { li.classList.add("ok"); li.insertAdjacentHTML("beforeend", `<span class="ph" style="animation-delay:${k*.1}s">${PIPE.find(p => p.id === s[k]).ph}</span>`); });
			log("Chain validated: consent → sample → protection → DNA reading → storage → analysis and decision");
			$("#m1b").disabled = true;
			const at = S.step;
			setTimeout(() => S.step === at && complete(1, "Governance first", "Before a single letter of DNA is read, Alex has agreed, the data are minimised and pseudonymised, and the storage is certified. In health data science, this is not paperwork: it is what makes the rest legal and trustworthy.", ["protect"], ["next", "Mission 2 · reading Alex's DNA"]), 900);
			return;
		}
		lis.forEach((li, k) => li.classList.toggle("bad", s[k] !== ideal[k]));
		err(s[0] !== "consent" ? "Nothing happens before the patient's consent" : "Some steps are in the wrong place (in red)");
	}

	/* ===================== MISSION 2 · reading Alex's DNA ===================== */
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
	// vocabulaire simplifié (master DMB, 13/11/2026) : « mutation », « harmful / harmless », plus de « variant » ni de « genotype »
	const VARS = [
		{ id:"b", name:"HFE C282Y (c.845G>A), the mutation Alex carries on both copies", ans:["P"], ev:[["Population", "Common in North-Western Europe: about 6 % of gene copies carry it"], ["ClinVar database", "Harmful (pathogenic), confirmed by many labs and an expert panel"], ["Lab studies", "The HFE protein no longer reaches the surface of the cell"], ["Patients", "Found on both copies in most people with this iron overload"]] },
		{ id:"c", name:"Position C · a “silent” change (same protein)", ans:["B", "LB"], ev:[["Population", "31 % of gene copies in the general population"], ["ClinVar database", "Harmless (benign), several labs"], ["Prediction", "Silent: the protein stays exactly the same"], ["Patients", "As frequent in patients as in healthy people"]] },
		{ id:"d", name:"HFE · a rare change, seen in a relative's report", ans:["VUS"], ev:[["Population", "Never seen in population databases"], ["ClinVar database", "No entry"], ["Prediction", "Prediction tools disagree: 2 say harmful, 2 harmless"], ["Patients", "Seen once, in a single family"]] }
	];
	const CLASSES = [["P", "Harmful"], ["LP", "Probably harmful"], ["VUS", "Uncertain"], ["LB", "Probably harmless"], ["B", "Harmless"]];
	let m3 = null;
	function m2Reads(i){
		m3 = m3 || { z:{}, cls:{} };
		show(i, `<p>Alex's DNA has been read many times over: each line below is one <b>read</b> of the same piece of the HFE gene. The top line, in gold, is the reference; a dot means “same letter as the reference”. At three positions, some reads show another letter. Count them, then decide:</p>
			<div class="bd-rules"><span>a single faint letter → reading error</span><span>about half the reads → mutation on one copy</span><span>all the reads → mutation on both copies</span></div>
			<p><small>12 of the 45 reads are shown; the full set gives the same picture. Illustrative sequence.</small></p>`);
		renderZyg();
		logOnce("m2", "Mission 2: HFE gene (chromosome 6), 45 reads, 12 shown");
	}
	function renderZyg(bad = []){
		work.innerHTML = `<h4>Alex's reads · HFE gene</h4><div class="bd-pile"><span class="ref">${REF}</span>  reference\n${READS.join("\n")}</div>
			${Object.entries(CAND).map(([k, c]) => `<div class="bd-var ${bad.includes(k) ? "bad" : ""}"><h5>Position ${k.toUpperCase()} · ${REF[c.pos]} → ${c.alt} · ${c.n} of 12 reads${c.lq ? " · faint letter (low quality)" : ""}</h5>
				<div class="bd-opts" data-z="${k}">${[["art", "Reading error"], ["het", "One copy (heterozygous)"], ["hom", "Both copies (homozygous)"]].map(([v, l]) => `<button class="${m3.z[k] === v ? "on" : ""}" data-v="${v}">${l}</button>`).join("")}</div></div>`).join("")}
			<div class="bd-row"><button class="bd-btn dark" id="m3a">▶ Confirm</button></div>`;
		work.querySelectorAll("[data-z]").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m3.z[g.dataset.z] = b.dataset.v; helixHot = 6 + "abc".indexOf(g.dataset.z)*9; play("pop"); renderZyg(bad.filter(k => k !== g.dataset.z)); })));
		$("#m3a").addEventListener("click", () => {
			const wrong = Object.keys(CAND).filter(k => m3.z[k] !== CAND[k].z);
			if(wrong.length){ err(`Not quite: ${wrong.length} position${wrong.length > 1 ? "s" : ""} to review`); wrong.forEach(k => log(`Position ${k.toUpperCase()}: ${CAND[k].n} of 12 reads = ${fmt(CAND[k].n/12*100)} %${CAND[k].lq ? ", on a single faint letter" : ""}`, "ko")); return renderZyg(wrong); }
			log("A: reading error (1 read of 12) · B: both copies (12 of 12) · C: one copy (6 of 12)"); play("good");
			$("#m3a").disabled = true;
			next();
		});
	}
	function m2Sort(i){
		m3 = m3 || { z:{}, cls:{} };
		show(i, `<p>Finding a mutation is not a diagnosis. Labs sort each one on a <b>5-level scale</b>, from <b>harmful</b> (pathogenic) to <b>harmless</b> (benign), using the evidence found in the databases. Sort these three.</p>`);
		renderCls();
	}
	function renderCls(bad = []){
		work.innerHTML = VARS.map(v => `<div class="bd-var ${bad.includes(v.id) ? "bad" : ""}"><h5>${v.name}</h5><div class="bd-ev">${v.ev.map(([a, b]) => `<div><b>${a}</b>${b}</div>`).join("")}</div>
			<div class="bd-opts" data-v="${v.id}">${CLASSES.map(([c, l]) => `<button class="${m3.cls[v.id] === c ? "on" : ""}" data-c="${c}">${l}</button>`).join("")}</div></div>`).join("") +
			`<div class="bd-row"><button class="bd-btn dark" id="m3b">▶ Submit</button></div>`;
		work.querySelectorAll(".bd-opts[data-v]").forEach(g => g.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { m3.cls[g.dataset.v] = b.dataset.c; play("pop"); renderCls(bad.filter(id => id !== g.dataset.v)); })));
		$("#m3b").addEventListener("click", () => {
			const wrong = VARS.filter(v => !v.ans.includes(m3.cls[v.id])).map(v => v.id);
			if(wrong.length){ err("The clinical biologist sends it back"); wrong.forEach(id => log({ b:"C282Y is common, but the evidence that it causes iron overload is strong: harmful", c:"Carried by 31 % of people, and the protein is unchanged: harmless", d:"Rare, but no solid evidence either way: that is exactly “uncertain”" }[id], "ko")); return renderCls(wrong); }
			log("C282Y harmful · silent change harmless · rare change uncertain"); play("good");
			$("#m3b").disabled = true;
			next();
		});
	}
	function m2Finding(i){
		show(i, `<p>The analysis flags something else in Alex's DNA: a <b>harmful BRCA2 mutation</b> (higher risk of several cancers). It has nothing to do with the fatigue. Read the consent form Alex signed in mission 1, then decide what to do.</p>`);
		work.innerHTML = `<div class="bd-consent">📄 <b>Alex's consent form (signed in mission 1)</b><br>☑ Analysis to explain my fatigue and iron overload<br>☑ Use for research, without my name<br>☑ <b>Tell me about unexpected findings if something can be done about them</b></div><div class="bd-choice"></div>`;
		q1(shuffle([
			["ok", "Alex asked to be told: check the result again, then announce it in a dedicated appointment with a genetic counsellor."],
			["hide", "Say nothing: it has nothing to do with the doctor's question."],
			["foot", "Mention it in a footnote of the fatigue report sent to the GP."]
		], 40), () => { log("Unexpected finding: checked again, then announced by a genetic counsellor");
			complete(2, "A mutation, read and weighed", "You told real mutations from a reading error, then weighed the evidence. Alex carries C282Y on both copies of HFE: the cause of most hereditary iron overload (haemochromatosis) in Europe. A rare change with no evidence stays “uncertain”. And the unexpected BRCA2 finding follows Alex's consent: checked, then announced by a genetic counsellor.", ["bioinf", "disease", "clin"], ["next", "Mission 3 · from one patient to 240"]); },
			{ hide:"Alex asked in writing to be told: hiding it would break that consent", foot:"A cancer risk is never announced in a footnote: it is checked, then explained in a dedicated appointment" });
	}

	/* ===================== MISSION 3 · cohort biostatistics ===================== */
	const hom = cohort.filter(p => p.g === 2), oth = cohort.filter(p => p.g !== 2);
	function mannWhitneyZ(a, b){
		const all = [...a.map(v => [v, 0]), ...b.map(v => [v, 1])].sort((x, y) => x[0] - y[0]);
		let ra = 0; all.forEach(([, g], i) => { if(!g) ra += i + 1; });
		const n1 = a.length, n2 = b.length, U = ra - n1*(n1 + 1)/2;
		return (U - n1*n2/2)/Math.sqrt(n1*n2*(n1 + n2 + 1)/12);
	}
	function m3Test(i){
		show(i, `<p>Alex is one of <b>240 patients</b> seen for unexplained fatigue in the same clinic (simulated). <b>24</b> of them carry C282Y on both copies, like Alex. Is their ferritin (the body's iron stock) different from the others'? Look at the distribution first.</p>`);
		work.innerHTML = `<h4>Ferritin, all 240 patients (µg/L)</h4><canvas class="bd-chart" id="m4h"></canvas>
			<p style="margin:6px 0;font-weight:700">Which approach is right to compare the two groups?</p><div class="bd-choice"></div>`;
		const [x, w, h] = chart("m4h"), pad = 40, max = 2500, nb = 25, bins = Array(nb).fill(0);
		cohort.forEach(p => bins[Math.min(nb - 1, Math.floor(p.fer/max*nb))]++);
		const top = Math.max(...bins), bw = (w - pad - 12)/nb;
		axes(x, w, h, pad, "patients", "ferritin (µg/L)");
		bins.forEach((n, i) => { x.fillStyle = "#21b6ce"; const bh = (h - pad - 14)*n/top; x.fillRect(pad + i*bw + 1, h - pad - bh, bw - 2, bh); });
		x.fillStyle = "#5b6b7a"; for(const v of [0, 500, 1000, 1500, 2000]) x.fillText(v, pad + v/max*(w - pad - 12) - 8, h - pad + 18);
		logOnce("m3", "Mission 3: 240 patients loaded (24 with C282Y on both copies)");
		q1(shuffle([
			["ok", "Most values are low and a few are huge (a skewed distribution): use a Mann–Whitney test, or a t-test on log(ferritin)."],
			["t", "A Student t-test on raw ferritin: it is the standard test to compare two means."],
			["chi", "A chi-square test on the ferritin values."]
		], 3), next, { t:"Raw ferritin is very skewed, with extreme values: a t-test on it is unreliable", chi:"Chi-square compares counts in categories, not a measurement like ferritin" });
	}
	// étapes 2 et 3 simplifiées (master DMB, 13/11/2026) : phrases courtes, pas de code, le sens avant la formule
	function m3Pval(i){
		const z = mannWhitneyZ(hom.map(p => p.fer), oth.map(p => p.fer)), mh = median(hom.map(p => p.fer)), mo = median(oth.map(p => p.fer));
		show(i, `<p>Patients with C282Y on both copies have a median ferritin <b>${fmt(mh/mo, 1)} times higher</b> than the others. The test gives <b>p &lt; 0.001</b>. What does that tell you?</p>`);
		work.innerHTML = `<div class="bd-kpi"><div><b>${fmt(mh)}</b><span>median ferritin · C282Y on both copies</span></div><div><b>${fmt(mo)}</b><span>median · other patients</span></div><div class="good"><b>p &lt; 0.001</b><span>Mann–Whitney test</span></div></div>
			<div class="bd-choice"></div>`;
		logOnce("m3p", `Mann–Whitney: z = ${fmt(z, 1)}, p < 0.001 · median ferritin ×${fmt(mh/mo, 1)}`);
		q1(shuffle([
			["ok", "If the two groups were really the same, a gap this big would almost never happen by chance."],
			["prob", "There is a 0.1 % chance that the two groups are the same."],
			["clin", "The gap matters for patients, because p is tiny."]
		], 8), next, { prob:"Common trap: p is calculated by imagining there is no difference. It cannot be the chance that there is none", clin:"A small p only says the gap is not chance. Whether it matters for patients depends on how big the gap is" });
	}
	function m3Sex(i){
		show(i, `<p>Now split the patients by sex. With C282Y on both copies, <b>men</b> store far more iron than <b>women</b>. What should the study report?</p>`);
		work.innerHTML = `<h4>Median ferritin (µg/L) · “2 copies” = C282Y on both copies</h4><canvas class="bd-chart" id="m4s"></canvas><div class="bd-choice"></div>`;
		const [x, w, h] = chart("m4s"), pad = 40, groups = [["2 copies · men", hom.filter(p => p.sex === "M")], ["2 copies · women", hom.filter(p => p.sex === "F")], ["Others · men", oth.filter(p => p.sex === "M")], ["Others · women", oth.filter(p => p.sex === "F")]];
		axes(x, w, h, pad, "µg/L", "");
		const max = Math.max(...groups.map(([, g]) => median(g.map(p => p.fer))))*1.2, bw = (w - pad - 12)/4;
		groups.forEach(([l, g], i) => {
			const m = median(g.map(p => p.fer)), bh = (h - pad - 30)*m/max;
			x.fillStyle = i < 2 ? "#8a5cc7" : "#21b6ce"; x.globalAlpha = i % 2 ? .6 : 1; x.fillRect(pad + i*bw + bw*.2, h - pad - bh, bw*.6, bh); x.globalAlpha = 1;
			x.fillStyle = "#1e305e"; x.fillText(fmt(m), pad + i*bw + bw*.38, h - pad - bh - 6);
			x.fillStyle = "#5b6b7a"; x.font = "700 14px Inter,Arial,sans-serif"; x.fillText(`${l} (${g.length})`, pad + i*bw + 6, h - pad + 18); x.font = "700 16px Inter,Arial,sans-serif";
		});
		q1(shuffle([
			["ok", "Report men and women separately: women lose iron every month (periods, pregnancy), so the mutation shows less."],
			["pool", "Report only the overall result: more patients means more reliable."],
			["prot", "Women carry a protective version of the mutation."]
		], 13), () => { log("Results reported for men and women separately"); complete(3, "From one patient to a population", "You chose a test that fits skewed data, read the p-value for what it really says, and saw that men and women differ. That is how an epidemiological study reasons: how big is the effect, how sure are we, and for whom.", ["stats", "epi"], ["next", "Mission 4 · a model to decide who gets tested"]); },
		{ pool:"Mixing everyone hides that the effect is very different in men and women", prot:"The mutation is the same in both sexes: the difference comes from the body (iron lost every month), not from the DNA" });
	}

	/* ===================== MISSION 4 · machine learning ===================== */
	const FEATS = [
		{ id:"ts", l:"Transferrin saturation", d:"routine blood test" },
		{ id:"fer", l:"Ferritin (log)", d:"routine blood test" },
		{ id:"sex", l:"Sex", d:"from the record" },
		{ id:"alt", l:"ALT liver enzyme", d:"routine blood test" },
		{ id:"hb", l:"Haemoglobin", d:"routine blood test" },
		{ id:"age", l:"Age", d:"from the record" },
		{ id:"phleb", l:"Blood-letting treatments already received", d:"treatment history", leak:true },
		{ id:"id", l:"Patient enrolment number", d:"administrative", leak:true }
	];
	let m5 = null;
	// le score du modèle expliqué simplement (master DMB, 13/11/2026) : une jauge de 0,5 (pile ou face) à 1 (jamais faux)
	const verdict = auc => auc > .97 ? ["bad", "Too good to be true: something gives the answer away."] : auc >= .8 ? ["good", "Useful: far better than a coin toss."] : ["bad", "Weak: the model misses too much."];
	function m4Feats(i){
		m5 = m5 || { feats:new Set(["ts", "fer", "phleb", "id"]), thr:.15, roc:null, need:.6 };
		show(i, `<p>A genetic test is expensive. The clinic wants a model that looks at <b>routine data</b> and says who should get the HFE test. Tick what the model may use, train it, then validate. Careful: only use what the doctor knows <b>at the moment of deciding</b>.</p>
			<div class="bd-score"><b>The model's score (AUC)</b> goes from <b>0.5</b>, no better than tossing a coin, to <b>1</b>, never wrong. On a real medical question, an almost perfect score usually means the model is cheating: it has been given the answer.</div>`);
		renderFeats(m5.roc);
		logOnce("m4", "Mission 4: 240 patients, 30 % kept aside to test the model");
	}
	function renderFeats(res){
		const v = res && verdict(res.auc);
		work.innerHTML = `<h4>What the model may use</h4><div class="bd-feat">${FEATS.map(f => `<label class="${m5.feats.has(f.id) ? "on" : ""}" data-f="${f.id}">${m5.feats.has(f.id) ? "☑" : "☐"} <span>${f.l}<small>${f.d}</small></span></label>`).join("")}</div>
			${res ? `<div class="bd-gauge ${v[0]}"><div class="bar"><i style="left:${clamp((res.auc - .5)/.5, 0, 1)*100}%"></i></div><div class="lab"><span>0.5 · coin toss</span><b>score ${fmt(res.auc, 2)}</b><span>1 · never wrong</span></div><p>${v[1]}</p></div>` : ""}
			${code(`<span class="k">from</span> sklearn.linear_model <span class="k">import</span> LogisticRegression\nX = cohort[[${[...m5.feats].map(f => `<span class="s">"${f}"</span>`).join(", ")}]]\nmodel = LogisticRegression().fit(X[train], y[train])`)}
			<div class="bd-row"><button class="bd-btn alt" id="m5t">⚙ Train and test</button><button class="bd-btn dark" id="m5a" ${res ? "" : "disabled"}>Validate this choice</button></div>`;
		work.querySelectorAll("[data-f]").forEach(l => l.addEventListener("click", () => { const f = l.dataset.f; m5.feats.has(f) ? m5.feats.delete(f) : m5.feats.add(f); m5.roc = null; play("pop"); renderFeats(); }));
		$("#m5t").addEventListener("click", () => {
			if(!m5.feats.size) return;
			const roc = rocOf(fitPredict(cohort, [...m5.feats]));
			m5.roc = roc; log(`Trained on ${[...m5.feats].join(", ")} → score (AUC) ${fmt(roc.auc, 3)}`);
			renderFeats(roc);
		});
		$("#m5a").addEventListener("click", () => {
			const leak = FEATS.filter(f => f.leak && m5.feats.has(f.id));
			if(leak.length){ err(`The model is cheating: ${leak.map(f => f.l.toLowerCase()).join(" and ")} give${leak.length > 1 ? "" : "s"} the answer away, the doctor can't use ${leak.length > 1 ? "them" : "it"} to decide`); log("A score close to 1 on a medical question is a warning sign, not a victory", "ko"); return; }
			if(!m5.feats.has("ts") && !m5.feats.has("fer")){ err("Without the iron markers (ferritin, transferrin saturation), the model has nothing useful to learn from"); return; }
			if(!m5.roc || m5.roc.auc < .8){ err("Train the model first, and reach a useful score (at least 0.80)"); return; }
			log(`Choice validated: nothing gives the answer away, score ${fmt(m5.roc.auc, 3)}`); play("good");
			$("#m5a").disabled = true;
			next();
		});
	}
	function m4Split(i){
		m5 = m5 || { feats:new Set(["ts", "fer", "sex"]), thr:.15, roc:null, need:.6 };
		show(i, `<p>In the real data, each patient came <b>3 times</b> (720 lines). To check the model honestly, some data are kept aside for a final test. How do you split them?</p>`);
		work.innerHTML = `<div class="bd-choice"></div>`;
		q1(shuffle([
			["ok", "By patient: all the visits of one patient go either to training or to the test."],
			["rows", "Shuffle the 720 lines and keep 30 % of them for the test."],
			["sex", "Train on men, test on women."]
		], 21), () => { log("Split by patient: nobody is in both training and test"); next(); },
		{ rows:"The same patient would be in both: the model would partly recognise people it has already seen, and its score would look better than it is", sex:"Training and test must come from the same kind of patients, otherwise you measure something else" });
	}
	function m4Thr(i){
		m5 = m5 || { feats:new Set(["ts", "fer", "sex"]), thr:.15, roc:null, need:.6 };
		const roc = rocOf(fitPredict(cohort, [...m5.feats]));
		const best = Math.max(0, ...roc.pts.filter(p => p.sens >= .9).map(p => p.spec));
		m5.roc = roc; m5.thr = .15; m5.need = Math.max(.3, Math.min(.6, best - .05));
		show(i, `<p>The model gives each patient a risk. Above the <b>threshold</b> you choose, the patient is offered the genetic test. Missing someone with the mutation is worse than one test too many: find <b>at least 90 %</b> of them, while sparing <b>at least ${fmt(m5.need*100)} %</b> of the other patients a test for nothing.</p>`);
		work.innerHTML = `<h4>Each point of the curve is one threshold · model score ${fmt(roc.auc, 2)}</h4><canvas class="bd-chart" id="m5r" style="max-width:620px"></canvas>
			<div class="bd-slider"><span>Risk threshold</span><input type="range" min="0" max="30" value="15" id="m5s" aria-label="Risk threshold"><b id="m5v"></b></div>
			<p style="margin:0;font-size:12.5px;color:#5b6b7a">Lower threshold: more patients found, but more tests for nothing. Aim for the green zone.</p>
			<div class="bd-kpi" id="m5k"></div>
			<div class="bd-row"><button class="bd-btn dark" id="m5b">▶ Use it in the clinic</button></div>`;
		const s = $("#m5s"); s.addEventListener("input", () => { m5.thr = +s.value/100; drawRoc(); });
		$("#m5b").addEventListener("click", () => {
			const p = pointAt(m5.thr);
			if(p.sens < .9){ err(`Only ${fmt(p.sens*100)} % found: too many patients with the mutation would be missed. Lower the threshold`); return; }
			if(p.spec < m5.need){ err(`Only ${fmt(p.spec*100)} % spared: almost everyone gets tested, the model brings nothing. Raise the threshold`); return; }
			log(`Threshold ${fmt(m5.thr, 2)}: ${fmt(p.sens*100)} % found (sensitivity), ${fmt(p.spec*100)} % spared (specificity)`);
			$("#m5b").disabled = true;
			complete(4, "A model that stays honest", "You removed what gave the answer away, tested the model on patients it had never seen, and chose a threshold for a real goal (miss nobody) rather than for a nice score. That is the difference between a demo and a tool a hospital can trust.", ["ml", "bigdata"], ["end", "Close the case"]);
		});
		drawRoc();
	}
	const pointAt = t => m5.roc.pts.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
	function drawRoc(){
		const [x, w, h] = chart("m5r", 620, 380), pad = 44, X = v => pad + (w - pad - 14)*v, Y = v => h - pad - (h - pad - 14)*v;
		axes(x, w, h, pad, "patients found", "tests for nothing");
		x.strokeStyle = "#c9d2db"; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(X(0), Y(0)); x.lineTo(X(1), Y(1)); x.stroke(); x.setLineDash([]);
		x.fillStyle = "rgba(59,209,111,.12)"; x.fillRect(X(0), Y(1), X(1 - m5.need) - X(0), Y(.9) - Y(1));
		x.strokeStyle = "#21b6ce"; x.lineWidth = 3; x.beginPath();
		[...m5.roc.pts].sort((a, b) => (1 - a.spec) - (1 - b.spec) || a.sens - b.sens).forEach((p, i) => i ? x.lineTo(X(1 - p.spec), Y(p.sens)) : x.moveTo(X(1 - p.spec), Y(p.sens)));
		x.stroke();
		const p = pointAt(m5.thr), ok = p.sens >= .9 && p.spec >= m5.need;
		x.fillStyle = ok ? "#1c7a43" : "#d6213a"; x.beginPath(); x.arc(X(1 - p.spec), Y(p.sens), 9, 0, Math.PI*2); x.fill();
		$("#m5v").textContent = fmt(m5.thr, 2);
		const tp = Math.round(p.sens*m5.roc.pos), fp = Math.round((1 - p.spec)*m5.roc.neg);
		$("#m5k").innerHTML = `<div class="${p.sens >= .9 ? "good" : "bad"}"><b>${fmt(p.sens*100)} %</b><span>found (sensitivity)</span></div><div class="${p.spec >= m5.need ? "good" : "bad"}"><b>${fmt(p.spec*100)} %</b><span>spared (specificity)</span></div><div><b>${tp}/${m5.roc.pos}</b><span>patients found</span></div><div><b>${fp}</b><span>tests for nothing</span></div>`;
	}

	/* ---------- les étapes, dans l'ordre ---------- */
	const STEPS = [
		{ m:1, label:"keep only what is needed", enter:m1Fields,
			hint:"Three fields say who Alex is and are useless for research. Two are useful but too precise: think “age” instead of “date of birth”. Everything medical stays, and so does the sample code.",
			skip:() => { FIELDS.forEach(f => m1.ans[f.id] = f.a); renderFields(); $("#m1a").click(); } },
		{ m:1, label:"the full chain", enter:m1Pipe,
			hint:"Nothing starts before Alex agrees. Alex's name disappears (pseudonymisation) before the data are stored. And health data never go to a free public cloud.",
			skip:() => { m1.slots = PIPE.map(p => p.id); renderPipe(); checkPipe(); } },
		{ m:2, label:"read the DNA", enter:m2Reads,
			hint:"Count the coloured letters in each column. A single faint letter is the machine misreading, not Alex's DNA. Half the reads = one copy, all the reads = both copies.",
			skip:() => { Object.entries(CAND).forEach(([k, c]) => m3.z[k] = c.z); renderZyg(); $("#m3a").click(); } },
		{ m:2, label:"harmful or harmless?", enter:m2Sort,
			hint:"Being common does not make a mutation harmless: weigh all four pieces of evidence. When the evidence is missing or contradictory, the honest answer is “uncertain”.",
			skip:() => { VARS.forEach(v => m3.cls[v.id] = v.ans[0]); renderCls(); $("#m3b").click(); } },
		{ m:2, label:"an unexpected finding", enter:m2Finding,
			hint:"Read the last box ticked on the consent form.", skip:okChoice },
		{ m:3, label:"choose the test", enter:m3Test,
			hint:"Look at the shape: most patients on the left, a long tail to the right. Tests that expect a bell curve do badly here.", skip:okChoice },
		{ m:3, label:"what p means", enter:m3Pval,
			hint:"A p-value starts from “imagine there is no difference at all” and asks: how surprising is what we see?", skip:okChoice },
		{ m:3, label:"men and women", enter:m3Sex,
			hint:"Think about what women lose every month, and what it does to the iron stock.", skip:okChoice },
		{ m:4, label:"what the model may use", enter:m4Feats,
			hint:"Two boxes are only known once the diagnosis is made, or have nothing to do with health: they give the answer away. The iron markers are the heart of the model.",
			skip:() => { m5.feats = new Set(["ts", "fer", "sex", "alt"]); m5.roc = rocOf(fitPredict(cohort, [...m5.feats])); renderFeats(m5.roc); $("#m5a").click(); } },
		{ m:4, label:"a fair test", enter:m4Split,
			hint:"A fair exam uses questions the student has never seen. Here, the questions are patients.", skip:okChoice },
		{ m:4, label:"the threshold", enter:m4Thr,
			hint:"Move the slider slowly and watch the dot: stop when it is in the green zone and both boxes below are green.",
			skip:() => {
				let bestV = 15, bestSpec = -1;
				for(let v = 0; v <= 30; v++){ const p = pointAt(v/100); if(p.sens >= .9 && p.spec >= m5.need && p.spec > bestSpec){ bestSpec = p.spec; bestV = v; } }
				const s = $("#m5s"); s.value = bestV; m5.thr = bestV/100; drawRoc(); $("#m5b").click();
			} }
	];

	/* ===================== fin ===================== */
	function finale(){
		// plus de mention à l'écran (master DMB, 13/11/2026) ; le campus garde la trace d'un jeu terminé
		onEvent && onEvent("win", "Très bien");
		const order = ["protect", "bioinf", "disease", "clin", "stats", "epi", "ml", "bigdata"];
		card(`<div class="k">Case closed</div><h2>From biology to data, from data to decision</h2>
			${PT.alex ? `<div class="bd-duo"><img src="${PT.alex}" alt="Alex"><img src="${PT.doctor}" alt="Alex's doctor"></div>
			<div class="bd-say"><div class="av">${av("alex", "🧑")}</div><div class="bub">Thanks to all of you, I finally know why I was so exhausted. And my brother is getting tested too.</div></div>` : `<div class="bd-big">🧬📊🩺</div>`}
			<p>Alex's blood test became a decision: protected data, a mutation weighed on evidence, a finding handled as Alex asked, 240 patients analysed without traps, and a screening model that stays honest. <b>This is what the Master in Data Management in Biosciences is about.</b></p>
			<ul>${order.map(k => `<li><span>${COURSES[k][0]}</span>${COURSES[k][1]}</li>`).join("")}</ul>
			${jpoCard("en")}${openLead ? `<button class="bd-btn dark" data-a="lead">📄 Get the programme brochure</button>` : ""}
			<a class="bd-alt" href="${formation.url}" target="_blank" rel="noopener">Discover the Master ↗</a>
			<button class="bd-alt" data-a="fav">${isFav() ? "♥ In my notebook" : "♡ Add to my notebook"}</button>
			<button class="bd-alt" data-a="replay">Play again</button>`);
	}
	/* ---------- actions ---------- */
	root.addEventListener("click", e => {
		const h = e.target.closest("[data-h]"); if(h) return help(h.dataset.h);
		const a = e.target.closest("[data-a]"); if(!a) return;
		const k = a.dataset.a; play("pop");
		if(k === "next") return next();
		if(k === "end"){ play("win"); return finale(); }
		if(k === "fav"){ toggleFav(); a.textContent = isFav() ? "♥ In my notebook" : "♡ Add to my notebook"; return; }
		if(k === "lead"){ close(); return openLead(); }
		if(k === "replay"){ S.errors = 0; S.learned = new Set(); S.done = new Set(); helixHot = -1; m1 = m3 = m5 = null; seen.clear(); renderSkills(); term.innerHTML = ""; return go(0); }
	});
	function close(){
		if(closed) return; closed = true;
		if(S.cold){ S.cold.close(); S.cold = null; }
		cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey);
		root.remove(); onClose && onClose();
	}
	function onKey(e){ if(e.key === "Escape") close(); }
	document.addEventListener("keydown", onKey);
	$(".bd-x").addEventListener("click", close);
	if(PT.alex) $("#bdWho").innerHTML = `<img src="${PT.alex}" alt="Alex"><span style="font-size:12.5px;font-weight:700;color:#5b6b7a">Patient P-0412<br>seen by Dr Lemaire, internal medicine</span>`;
	go(0);      // ouverture à chaud : Alex et sa médecin en deux bulles, puis le dossier à protéger tout de suite
	onEvent && onEvent("start");
	// mode relecture : étapes où l'enseignant peut sauter directement
	onEvent && onEvent("missions", [["Mission 1 · Data governance", () => go(0)], ["Mission 2 · Reading Alex's DNA", () => go(2)], ["Mission 3 · From one patient to 240", () => go(5)], ["Mission 4 · A model to decide who gets tested", () => go(8)]]);
	if(window.campus) window.campus.game = { S, get cold(){ return S.cold; }, go, STEPS, help, cohort, FIELDS, CAND, VARS, get m5(){ return m5; }, fitPredict, rocOf };
}
