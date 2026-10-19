/* Page de relecture des mini-jeux (servie par GitHub Pages : relecture/).
   Les réponses partent vers un script Google Apps Script (google-apps-script.js) qui les range dans un tableur.
   Sans adresse de script (CFG.endpoint vide) ou en cas d'échec, l'enseignant obtient un récapitulatif à copier.
   Le journal de partie arrive tout seul : le jeu l'écrit dans le localStorage du même site (relecture-journal-<jeu>). */
const CFG = JSON.parse(document.getElementById("cfg").textContent);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const LABEL = { ok:"Juste", ko:"À corriger", na:"Je ne sais pas" };
const QLABEL = { ok:"Oui", ko:"Non", na:"Sans avis" };
const PICK = { facile:"Trop facile", adapte:"Adapté", difficile:"Trop difficile", court:"Trop courte", bien:"Bien", long:"Trop longue", valide:"Oui, en l'état", corrections:"Après corrections", non:"Pas en l'état" };
const store = { get(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } } };
const IDS = CFG.order;
const API = CFG.endpoint || "";
let G = null;                       // le jeu affiché (null = accueil)
let counts = {}, reviewsBy = {}, settings = null, ownerKey = store.get("relecture:cle") || "", owner = false;
// identifiant de ce relecteur sur cet appareil : renvoyer le formulaire met à jour sa ligne au lieu d'en ajouter une
let rid = store.get("relecture:id");
if(!rid){ rid = "r" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("relecture:id", rid); }
const deadline = () => settings?.deadline || CFG.defaults.deadline;
const expected = id => +(settings?.attendus?.[id] ?? CFG.defaults.attendus) || 0;
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
function daysLeft(){ return Math.ceil((new Date(deadline() + "T23:59:59") - new Date())/86400000); }
const thumb = id => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600`;
const driveLink = id => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

/* ---------- échanges avec le script Google ---------- */
async function apiGet(params){
	const r = await fetch(API + "?" + new URLSearchParams(params), { redirect:"follow" });
	return r.json();
}
async function apiPost(body){
	// text/plain : pas de requête préalable CORS, que Google Apps Script ne sait pas traiter
	const r = await fetch(API, { method:"POST", headers:{ "Content-Type":"text/plain;charset=utf-8" }, body:JSON.stringify(body), redirect:"follow" });
	return r.json();
}
async function loadCounts(){
	if(!API) return;
	try { const r = await apiGet({ action:"compteurs" }); if(r.ok){ counts = r.compteurs || {}; settings = r.reglages || settings; refresh(); } } catch(e){}
}
async function loadReviews(){
	if(!API || !ownerKey) return false;
	try {
		const r = await apiGet({ action:"retours", cle:ownerKey });
		if(!r.ok) return false;
		owner = true; settings = r.reglages || settings; reviewsBy = {};
		for(const x of r.retours) (reviewsBy[x.jeu] ||= []).push(x);
		for(const id in reviewsBy) reviewsBy[id].sort((a, b) => String(b.envoyeLe).localeCompare(String(a.envoyeLe)));
		counts = Object.fromEntries(IDS.map(id => [id, (reviewsBy[id] || []).length]));
		refresh(); return true;
	} catch(e){ return false; }
}

/* ---------- la vidéo (avec sa musique) ---------- */
const img = src => { const i = new Image(); i.src = src; return i; };
const images = { campus:img("img/campus.jpg"), logo:img("img/logo-fges.png") };
const audio = $("mvAudio");
let mv = null, soundOn = true, audioOk = true;
const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
audio.addEventListener("error", () => { audioOk = false; $("mvSound").hidden = true; });
fetch("media/bande-son.mp4").then(r => r.ok ? r.blob() : Promise.reject()).then(b => { audio.src = URL.createObjectURL(b); }).catch(() => { audioOk = false; $("mvSound").hidden = true; });
function setupVideo(g){
	if(mv?.playing) mv.pause();
	audio.pause();
	mv = createMotion($("mv"), { games:CFG.videoGames, current:g?.id, accent:g?.videoAccent || "#5fcbe0", accentInk:g?.videoInk || "#0b7a8e", gameTitle:g?.short, steps:g?.videoSteps, images, poster:2.6 });
	// la vidéo garde sa propre horloge ; la musique est recalée sur elle si elle s'en écarte
	mv.onTime = t => {
		$("mvSeek").value = t; $("mvTime").textContent = `${fmt(t)} / ${fmt(mv.duration)}`;
		if(mv.playing && soundOn && audioOk && !audio.paused && Math.abs(audio.currentTime - t) > .3){ try { audio.currentTime = t; } catch(e){} }
	};
	mv.onState = on => { $("mvToggle").textContent = on ? "Pause" : (mv.t >= mv.duration - .05 ? "Revoir" : "Lecture"); if(on) $("mvPlay").hidden = true; else audio.pause(); };
	$("mvTime").textContent = `0:00 / ${fmt(mv.duration)}`; $("mvSeek").max = mv.duration; $("mvSeek").value = 0; $("mvPlay").hidden = false; $("mvToggle").textContent = "Lecture";
}
function play(){
	if(mv.t >= mv.duration - .05) mv.seek(0);
	if(soundOn && audioOk){ try { audio.currentTime = mv.t; } catch(e){} audio.play().catch(() => {}); }
	mv.play();
}
$("mvPlay").addEventListener("click", () => { mv.seek(0); play(); });
$("mvToggle").addEventListener("click", () => mv.playing ? mv.pause() : play());
$("mv").addEventListener("click", () => mv.playing ? mv.pause() : play());
$("mvSeek").addEventListener("input", e => { $("mvPlay").hidden = true; mv.seek(+e.target.value); try { audio.currentTime = +e.target.value; } catch(x){} });
$("mvSound").addEventListener("click", () => {
	soundOn = !soundOn; $("mvSound").setAttribute("aria-pressed", String(soundOn)); $("mvSound").textContent = soundOn ? "🔊 Son" : "🔇 Son coupé";
	if(!soundOn) audio.pause(); else if(mv.playing && audioOk){ try { audio.currentTime = mv.t; } catch(e){} audio.play().catch(() => {}); }
});
const redraw = () => { if(mv && !mv.playing) mv.draw(mv.t); };
images.campus.onload = images.logo.onload = redraw;
document.fonts?.ready.then(redraw);

/* ---------- accueil et tableau de bord ---------- */
function dueHTML(id){
	const d = daysLeft(), n = counts[id] || 0, y = expected(id);
	const when = d < 0 ? `Date limite passée (${fmtDate(deadline())})` : `À rendre avant le ${fmtDate(deadline())}${d <= 7 ? ` · J−${d}` : ""}`;
	return `<span>${esc(when)}</span>${y ? `<span class="n">${n} relecture${n > 1 ? "s" : ""} sur ${y} attendue${y > 1 ? "s" : ""}</span>` : ""}`;
}
function renderHome(){
	$("games").innerHTML = IDS.map(id => {
		const g = CFG.games[id], n = counts[id] || 0, y = expected(id);
		return `<a class="game" href="#${id}" style="--accent-l:${g.accent[0]};--accent-d:${g.accent[2]}"><span class="ic" aria-hidden="true">${g.card.icon}</span><b>${esc(g.card.title)}</b><small>${esc(g.card.formation)}</small>
			<span class="cnt">${n} relecture${n > 1 ? "s" : ""}${y ? ` sur ${y}` : ""}</span>${y ? `<span class="meter"><i style="width:${Math.min(100, n/y*100)}%"></i></span>` : ""}</a>`;
	}).join("");
	if(G) return;
	const d = daysLeft();
	$("due").innerHTML = `<span>${esc(d < 0 ? `Date limite passée (${fmtDate(deadline())})` : `Relectures attendues avant le ${fmtDate(deadline())}`)}</span>`;
	const wantDash = location.hash === "#tableau";
	$("loginBox").hidden = !(wantDash && !owner);
	$("dashBox").hidden = !owner;
	if(owner) renderDash();
}
function renderDash(){
	$("dashRows").innerHTML = IDS.map(id => {
		const g = CFG.games[id], rs = reviewsBy[id] || [], n = rs.length, y = expected(id);
		const v = k => rs.filter(r => r.verdict === k).length;
		const ko = todoData(g, rs).ko.length + rs.filter(r => r.bugs).length;
		const last = rs[0]?.envoyeLe ? new Date(rs[0].envoyeLe).toLocaleDateString("fr-FR", { day:"numeric", month:"short" }) : "—";
		return `<tr><td><a href="#${id}">${g.card.icon} ${esc(g.card.title)}</a></td>
			<td class="num">${n}${y ? ` / ${y}` : ""}${y ? `<div class="meter" style="width:90px;margin-top:4px"><i style="width:${Math.min(100, n/y*100)}%;background:${g.accent[0]}"></i></div>` : ""}</td>
			<td><div class="pills">${v("valide") ? `<span class="pill ok">${v("valide")} validé</span>` : ""}${v("corrections") ? `<span class="pill mid">${v("corrections")} après corr.</span>` : ""}${v("non") ? `<span class="pill ko">${v("non")} non</span>` : ""}${!n ? `<span class="pill na">en attente</span>` : ""}</div></td>
			<td class="num">${n ? ko : "—"}</td><td class="num">${last}</td></tr>`;
	}).join("");
	if(document.activeElement?.closest?.("#settings")) return;
	$("setDeadline").value = deadline();
	$("setCounts").innerHTML = IDS.map(id => `<label>${esc(CFG.games[id].card.title)}<input type="number" min="0" max="20" data-att="${id}" value="${expected(id)}"></label>`).join("");
}
$("login").addEventListener("submit", async e => {
	e.preventDefault();
	ownerKey = $("loginKey").value.trim();
	$("loginMsg").textContent = API ? "Vérification…" : "Le script Google n'est pas encore branché sur cette page.";
	if(!API) return;
	if(await loadReviews()){ store.set("relecture:cle", ownerKey); $("loginMsg").textContent = ""; }
	else { ownerKey = ""; $("loginMsg").textContent = "Clé refusée. C'est la valeur CLE des propriétés du script Google."; }
});
$("logout").addEventListener("click", () => { store.set("relecture:cle", ""); ownerKey = ""; owner = false; reviewsBy = {}; location.hash = "accueil"; route(); });
$("reload").addEventListener("click", () => loadReviews());
$("settings").addEventListener("submit", async e => {
	e.preventDefault();
	const att = {}; document.querySelectorAll("[data-att]").forEach(i => att[i.dataset.att] = Math.max(0, Math.min(20, +i.value || 0)));
	try {
		const r = await apiPost({ action:"reglages", cle:ownerKey, deadline:$("setDeadline").value || deadline(), attendus:att });
		if(!r.ok) throw 0;
		settings = r.reglages; refresh(); $("setMsg").textContent = "Enregistré : les enseignants voient la nouvelle date et le compteur.";
	} catch(x){ $("setMsg").textContent = "L'enregistrement n'a pas abouti. Vous pouvez aussi modifier la feuille « Réglages » du tableur."; }
});

/* ---------- un jeu : contenu ---------- */
const ALL = () => G.sections.flatMap(s => s.items.map(it => ({ ...it, sec:s.t })));
const itemHTML = (it, kind) => {
	const L = kind === "q" ? QLABEL : LABEL;
	return `<div class="item" data-k="${it.k}" data-kind="${kind}"><span class="q">${esc(it.q)}</span>${it.d ? `<span class="d">${esc(it.d)}</span>` : ""}
		<div class="chips" role="group" aria-label="${esc(it.q)}">${["ok", "ko", "na"].map(v => `<button type="button" class="chip" data-v="${v}" aria-pressed="false">${L[v]}</button>`).join("")}</div>
		<textarea id="c-${it.k}" placeholder="${kind === "q" ? "Votre réponse ou précision" : "Ce qu'il faudrait corriger, ou une précision"}" aria-label="Commentaire : ${esc(it.q)}"></textarea></div>`;
};
function renderGame(){
	$("h1").textContent = G.h1; $("lead").textContent = G.lead;
	$("facts").innerHTML = G.facts.map(f => `<span>${esc(f)}</span>`).join("");
	$("play").href = `../?jeu=${G.id}&relecture=1`;       // même site : le jeu écrit son journal là où cette page le lit
	$("howto").textContent = G.howto;
	$("gamecard").innerHTML = `<span class="ic" aria-hidden="true">${G.card.icon}</span><span class="k">Mini-jeu · ${esc(G.card.formation)}</span><h3>${esc(G.card.title)}</h3><ol>${G.card.steps.map(([y, s]) => `<li><span>${esc(y)}</span>${esc(s)}</li>`).join("")}</ol>`;
	$("publicHint").textContent = G.publicHint; $("dureeHint").textContent = G.dureeHint;
	$("parcoursBox").hidden = !G.parcours;
	$("parcours").innerHTML = (G.parcours || []).map(([k, t]) => `<label><input type="checkbox" value="${k}" id="p-${k}"> ${esc(t)}</label>`).join("");
	$("sections").innerHTML = G.sections.map(s => `<fieldset><legend><h3>${esc(s.t)}${s.sub ? ` <small>${esc(s.sub)}</small>` : ""}</h3></legend>${s.items.map(it => itemHTML(it, it.kind || "c")).join("")}</fieldset>`).join("");
	$("openItems").innerHTML = G.open.map(o => `<label class="f">${esc(o.q)}<textarea id="o-${o.k}"></textarea></label>`).join("");
	clearForm();
	fillForm(store.get(DRAFT()));
	pullJournal();
	$("due").innerHTML = dueHTML(G.id);
	$("sendStatus").hidden = true; $("fallback").hidden = true;
}

/* ---------- formulaire ---------- */
const DRAFT = () => "relecture:" + G.id;
let captures = [];          // [{ id?, b64?, type?, url, legende }]
function readForm(){
	const items = {};
	document.querySelectorAll("#sections .item").forEach(el => {
		const k = el.dataset.k, s = el.dataset.s || "", c = $("c-" + k).value.trim();
		if(s || c) items[k] = { s, c };
	});
	const pick = k => document.querySelector(`.item[data-k="${k}"]`).dataset.s || "";
	const open = {}; G.open.forEach(o => { const v = $("o-" + o.k).value.trim(); if(v) open[o.k] = v; });
	return {
		nom:$("nom").value.trim(), fonction:$("fonction").value.trim(), appareil:$("appareil").value,
		parcours:G.parcours ? G.parcours.map(p => p[0]).filter(k => $("p-" + k).checked) : [],
		journal:$("journal").value.trim().slice(0, 20000),
		captures:captures.map(c => ({ id:c.id, legende:(c.legende || "").slice(0, 300) })),
		items, niveau:pick("_niveau"), duree:pick("_duree"), bugs:$("bugs").value.trim(), open,
		verdict:pick("_verdict"), remarques:$("remarques").value.trim()
	};
}
function setChip(el, s){
	el.dataset.s = s;
	el.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.x || b.dataset.v) === s)));
}
function clearForm(){
	for(const id of ["appareil", "bugs", "remarques", "journal"]) $(id).value = "";
	document.querySelectorAll(".item").forEach(el => setChip(el, ""));
	captures = []; renderShots(); $("dropMsg").textContent = "";
}
function fillForm(d){
	if(!d) return;
	if(d.nom) $("nom").value = d.nom;
	if(d.fonction) $("fonction").value = d.fonction;
	$("appareil").value = d.appareil || "";
	(d.parcours || []).forEach(k => { const c = $("p-" + k); if(c) c.checked = true; });
	document.querySelectorAll("#sections .item").forEach(el => { const v = (d.items || {})[el.dataset.k]; if(v){ setChip(el, v.s || ""); $("c-" + el.dataset.k).value = v.c || ""; } });
	for(const k of ["niveau", "duree", "verdict"]) if(d[k]) setChip(document.querySelector(`.item[data-k="_${k}"]`), d[k]);
	$("bugs").value = d.bugs || ""; $("remarques").value = d.remarques || ""; $("journal").value = d.journal || "";
	G.open.forEach(o => { $("o-" + o.k).value = (d.open || {})[o.k] || ""; });
	captures = (d.captures || []).map(c => ({ ...c, url:c.url || (c.id ? thumb(c.id) : "") }));
	renderShots();
}
$("form").addEventListener("click", e => {
	const b = e.target.closest(".chip"); if(!b) return;
	const el = b.closest(".item"), v = b.dataset.x || b.dataset.v;
	setChip(el, el.dataset.s === v ? "" : v);
	if(v === "ko" && el.dataset.s === "ko") $("c-" + el.dataset.k)?.focus();
	saveDraft();
});
let draftT;
function saveDraft(){
	clearTimeout(draftT); const key = DRAFT();
	draftT = setTimeout(() => { if(!store.set(key, { ...readForm(), captures })) store.set(key, { ...readForm(), captures:captures.filter(c => c.id) }); }, 400);
}
$("form").addEventListener("input", saveDraft);
$("nom").addEventListener("change", () => store.set("relecture:nom", $("nom").value.trim()));
$("fonction").addEventListener("change", () => store.set("relecture:fonction", $("fonction").value.trim()));
$("nom").value = store.get("relecture:nom") || ""; $("fonction").value = store.get("relecture:fonction") || "";

/* ---------- journal de partie : écrit par le jeu sur le même site ---------- */
let journalAuto = "";
function pullJournal(){
	if(!G) return;
	let j = ""; try { j = localStorage.getItem("relecture-journal-" + G.id) || ""; } catch(e){}
	const cur = $("journal").value.trim();
	if(j && (!cur || cur === journalAuto) && j !== cur){ $("journal").value = j; journalAuto = j; saveDraft(); $("journalHint").textContent = "✓ Rempli automatiquement avec votre dernière partie (vous pouvez le modifier)."; }
}
addEventListener("storage", e => { if(G && e.key === "relecture-journal-" + G.id) pullJournal(); });
addEventListener("focus", pullJournal);
document.addEventListener("visibilitychange", () => { if(!document.hidden) pullJournal(); });

/* ---------- captures d'écran : réduites dans le navigateur, envoyées avec la relecture ---------- */
function renderShots(){
	$("shots").innerHTML = captures.map((c, i) => `<div class="shot"><img src="${esc(c.url)}" alt="Capture ${i + 1}"><div class="row"><input type="text" data-leg="${i}" value="${esc(c.legende)}" placeholder="Quel écran, quel problème ?" aria-label="Légende de la capture ${i + 1}"><button type="button" data-del="${i}" aria-label="Retirer la capture ${i + 1}">✕</button></div></div>`).join("");
}
$("shots").addEventListener("input", e => { const i = e.target.dataset.leg; if(i != null){ captures[i].legende = e.target.value; saveDraft(); } });
$("shots").addEventListener("click", e => { const i = e.target.dataset.del; if(i != null){ captures.splice(+i, 1); renderShots(); saveDraft(); } });
function shrink(file){
	return new Promise((ok, ko) => {
		const u = URL.createObjectURL(file), im = new Image();
		im.onload = () => {
			const k = Math.min(1, 1600/Math.max(im.width, im.height)), c = document.createElement("canvas");
			c.width = Math.round(im.width*k); c.height = Math.round(im.height*k);
			c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
			ok(c.toDataURL("image/jpeg", .82));
		};
		im.onerror = () => { URL.revokeObjectURL(u); ko(); };
		im.src = u;
	});
}
async function addFiles(files){
	const list = [...files].filter(f => /^image\//.test(f.type));
	if(!list.length) return;
	if(captures.length + list.length > 8){ $("dropMsg").textContent = "8 captures au plus : retirez-en une pour en ajouter une autre."; return; }
	for(const f of list){
		try { const url = await shrink(f); captures.push({ b64:url.split(",")[1], type:"image/jpeg", url, legende:"" }); renderShots(); saveDraft(); $("dropMsg").textContent = "Image ajoutée : elle partira avec votre relecture. Ajoutez une légende pour dire ce qui ne va pas."; }
		catch(x){ $("dropMsg").textContent = `${f.name} n'a pas pu être lue. Essayez une capture en PNG ou JPEG.`; }
	}
}
$("shotInput").addEventListener("change", e => { addFiles(e.target.files); e.target.value = ""; });
$("drop").addEventListener("dragover", e => { e.preventDefault(); $("drop").classList.add("over"); });
$("drop").addEventListener("dragleave", () => $("drop").classList.remove("over"));
$("drop").addEventListener("drop", e => { e.preventDefault(); $("drop").classList.remove("over"); addFiles(e.dataTransfer.files); });
document.addEventListener("paste", e => { if(G && !$("viewGame").hidden && e.clipboardData?.files?.length){ e.preventDefault(); addFiles(e.clipboardData.files); } });

/* ---------- récapitulatif texte ---------- */
function recapText(d, g = G){
	const lines = [`Relecture · ${g.game}`, `${d.nom}${d.fonction ? " (" + d.fonction + ")" : ""}${d.appareil ? " · " + d.appareil : ""}`];
	if(d.parcours?.length) lines.push("Parcours joués : " + d.parcours.map(k => (g.parcours.find(p => p[0] === k) || [k, k])[1]).join(", "));
	lines.push("");
	for(const s of g.sections){
		const rows = s.items.filter(it => d.items?.[it.k]).map(it => {
			const v = d.items[it.k], L = it.kind === "q" ? QLABEL : LABEL;
			return `- ${it.q} : ${L[v.s] || "—"}${v.c ? "\n  " + v.c : ""}`;
		});
		if(rows.length) lines.push(`## ${s.t}`, ...rows, "");
	}
	lines.push(`Niveau : ${PICK[d.niveau] || "—"} · Durée : ${PICK[d.duree] || "—"}`);
	if(d.bugs) lines.push("Bugs : " + d.bugs);
	g.open.forEach(o => { if(d.open?.[o.k]) lines.push(`${o.q}\n  ${d.open[o.k]}`); });
	lines.push(`Avis : ${PICK[d.verdict] || "—"}`);
	if(d.remarques) lines.push("Dernier mot : " + d.remarques);
	if(d.captures?.length) lines.push(`Captures d'écran : ${d.captures.length} (à joindre à l'e-mail)`);
	if(d.journal) lines.push("", d.journal);
	return lines.join("\n");
}
// résumé lisible pour les colonnes du tableur
function resume(d){
	const ko = [], idees = [];
	for(const it of ALL()){ const v = d.items[it.k]; if(v && (v.s === "ko" || (it.kind !== "q" && v.c && v.s !== "ok"))) ko.push(`• ${it.sec} · ${it.q}${v.c ? " : " + v.c : ""}`); else if(v && it.kind === "q") idees.push(`• ${it.q} ${QLABEL[v.s] || ""}${v.c ? " : " + v.c : ""}`); }
	G.open.forEach(o => { if(d.open[o.k]) idees.push(`• ${o.q} ${d.open[o.k]}`); });
	return { avis:PICK[d.verdict] || "", niveau:PICK[d.niveau] || "", duree:PICK[d.duree] || "", corrections:ko.join("\n"), idees:idees.join("\n") };
}
async function copyText(text, btn, label){
	try { await navigator.clipboard.writeText(text); btn.textContent = "Copié ✓"; setTimeout(() => btn.textContent = label, 1600); return true; }
	catch(e){ return false; }
}
$("copyBtn").addEventListener("click", async () => {
	if(!await copyText($("recap").textContent, $("copyBtn"), "Copier le récapitulatif")){ const r = document.createRange(); r.selectNodeContents($("recap")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
});

/* ---------- envoi ---------- */
const status = (cls, msg) => { const el = $("sendStatus"); el.className = "status " + cls; el.textContent = msg; el.hidden = false; };
$("form").addEventListener("submit", async e => {
	e.preventDefault();
	const d = readForm();
	if(!d.nom){ $("nom").setAttribute("aria-invalid", "true"); $("nom").focus(); status("ko", "Indiquez votre nom pour que l'on sache qui a relu."); return; }
	$("nom").removeAttribute("aria-invalid");
	$("submit").disabled = true; $("submit").textContent = captures.some(c => c.b64) ? "Envoi des images…" : "Envoi…";
	try {
		if(!API) throw new Error("local");
		const body = { jeu:G.id, relecteur:rid, website:$("website").value, resume:resume(d),
			retour:{ ...d, captures:captures.map(c => c.b64 ? { b64:c.b64, type:c.type, legende:c.legende || "" } : { id:c.id, legende:c.legende || "" }) } };
		const r = await apiPost(body);
		if(!r.ok) throw new Error(r.error || "refus");
		captures = (r.captures || []).map(c => ({ ...c, url:thumb(c.id) })); renderShots();
		store.set(DRAFT(), { ...readForm(), captures });
		counts[G.id] = (counts[G.id] || 0) + (store.get("relecture:envoye:" + G.id) ? 0 : 1); store.set("relecture:envoye:" + G.id, true);
		$("due").innerHTML = dueHTML(G.id);
		status("ok", "Merci ! Votre relecture est enregistrée. Vous pouvez la modifier et la renvoyer depuis cet appareil : elle remplacera la précédente.");
		$("fallback").hidden = true;
	} catch(x){
		status("ko", API ? "Votre relecture n'a pas pu être envoyée (connexion ?). Réessayez dans un instant, ou copiez le récapitulatif ci-dessous." : "L'envoi en ligne n'est pas encore activé. Rien n'est perdu : copiez le récapitulatif ci-dessous.");
		$("recap").textContent = recapText(d); $("fallback").hidden = false;
	} finally { $("submit").disabled = false; $("submit").textContent = "Envoyer ma relecture"; }
});

/* ---------- retours d'un jeu (avec la clé) ---------- */
function todoData(g, reviews){
	const ko = [], answers = [], all = g.sections.flatMap(s => s.items.map(it => ({ ...it, sec:s.t })));
	for(const it of all){
		const got = reviews.map(r => ({ r, v:r.items?.[it.k] })).filter(x => x.v);
		if(it.kind === "q"){ const a = got.filter(x => x.v.s || x.v.c); if(a.length) answers.push({ it, a }); continue; }
		const bad = got.filter(x => x.v.s === "ko" || (x.v.s !== "ok" && x.v.c));
		if(bad.length) ko.push({ it, bad, n:got.filter(x => x.v.s === "ko").length });
	}
	ko.sort((a, b) => b.n - a.n);
	const bugs = reviews.filter(r => r.bugs).map(r => ({ nom:r.nom, t:r.bugs }));
	const ideas = g.open.map(o => ({ o, a:reviews.filter(r => r.open?.[o.k]).map(r => ({ nom:r.nom, t:r.open[o.k] })) })).filter(x => x.a.length);
	const shots = reviews.flatMap(r => (r.captures || []).map(c => ({ nom:r.nom, ...c })));
	const stuck = reviews.filter(r => r.journal).map(r => ({ nom:r.nom, lines:r.journal.split("\n").filter(l => (/erreur/.test(l) && l.startsWith("- ")) || l.startsWith("  ✏️")) })).filter(x => x.lines.length);
	const count = k => Object.entries(reviews.reduce((m, r) => (r[k] && (m[PICK[r[k]]] = (m[PICK[r[k]]] || 0) + 1), m), {})).map(([l, n]) => `${l} ×${n}`).join(", ");
	return { ko, answers, bugs, ideas, shots, stuck, niveau:count("niveau"), duree:count("duree") };
}
function todoMarkdown(g, reviews){
	const T = todoData(g, reviews), L = [];
	L.push(`# Corrections demandées par les enseignants · ${g.game}`, `${reviews.length} relecture(s) : ${reviews.map(r => `${r.nom} (${PICK[r.verdict] || "sans avis"})`).join(" ; ")}`, "");
	if(T.ko.length){ L.push("## À corriger dans le jeu"); T.ko.forEach(x => L.push(`- [ ] ${x.it.sec} · ${x.it.q} (${x.n}/${reviews.length} à corriger)`, ...x.bad.filter(b => b.v.c).map(b => `  - « ${b.v.c} » (${b.r.nom})`))); L.push(""); }
	if(T.bugs.length){ L.push("## Bugs et blocages"); T.bugs.forEach(b => L.push(`- [ ] « ${b.t} » (${b.nom})`)); L.push(""); }
	if(T.stuck.length){ L.push("## Erreurs et notes prises pendant la partie (journaux)"); T.stuck.forEach(s => L.push(`- ${s.nom}`, ...s.lines.map(l => "  " + l.trim()))); L.push(""); }
	if(T.answers.length){ L.push("## Réponses aux questions posées"); T.answers.forEach(x => L.push(`- ${x.it.q}`, ...x.a.map(a => `  - ${QLABEL[a.v.s] || "—"}${a.v.c ? ` : « ${a.v.c} »` : ""} (${a.r.nom})`))); L.push(""); }
	if(T.ideas.length){ L.push("## Idées"); T.ideas.forEach(x => L.push(`- ${x.o.q}`, ...x.a.map(a => `  - « ${a.t} » (${a.nom})`))); L.push(""); }
	if(T.niveau || T.duree) L.push(`Niveau : ${T.niveau || "—"} · Durée : ${T.duree || "—"}`);
	if(T.shots.length) L.push(`Captures d'écran : ${T.shots.map(s => `${driveLink(s.id)} (${s.nom}${s.legende ? " : " + s.legende : ""})`).join(" ; ")}`);
	return L.join("\n");
}
function renderReviews(){
	if(!G || !owner) return;
	const reviews = reviewsBy[G.id] || [];
	$("nRes").textContent = `(${reviews.length})`;
	$("resEmpty").hidden = reviews.length > 0; $("resBody").hidden = !reviews.length;
	const v = k => reviews.filter(r => r.verdict === k).length;
	$("sum").innerHTML = [[reviews.length, "relecture" + (reviews.length > 1 ? "s" : "") + (expected(G.id) ? ` sur ${expected(G.id)}` : "")], [v("valide"), "validé en l'état"], [v("corrections"), "après corrections"], [v("non"), "pas en l'état"]]
		.map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join("");
	const T = todoData(G, reviews);
	const li = (main, sub) => `<li>${main}${sub ? `<br><small>${sub}</small>` : ""}</li>`;
	const parts = [];
	if(T.ko.length) parts.push(`<h4>À corriger dans le jeu</h4><ul>${T.ko.map(x => li(`<b>${esc(x.it.q)}</b> <span class="pill ko">${x.n}/${reviews.length}</span>`, esc(x.it.sec) + x.bad.filter(b => b.v.c).map(b => ` · « ${esc(b.v.c)} » (${esc(b.r.nom)})`).join(""))).join("")}</ul>`);
	if(T.bugs.length) parts.push(`<h4>Bugs et blocages</h4><ul>${T.bugs.map(b => li(`« ${esc(b.t)} »`, esc(b.nom))).join("")}</ul>`);
	if(T.stuck.length) parts.push(`<h4>Erreurs et notes prises pendant la partie</h4><ul>${T.stuck.map(s => li(esc(s.nom), s.lines.map(l => esc(l.trim())).join("<br>"))).join("")}</ul>`);
	if(T.answers.length) parts.push(`<h4>Réponses aux questions posées</h4><ul>${T.answers.map(x => li(`<b>${esc(x.it.q)}</b>`, x.a.map(a => `${QLABEL[a.v.s] || "—"}${a.v.c ? ` : « ${esc(a.v.c)} »` : ""} (${esc(a.r.nom)})`).join("<br>"))).join("")}</ul>`);
	if(T.ideas.length) parts.push(`<h4>Idées</h4><ul>${T.ideas.map(x => li(`<b>${esc(x.o.q)}</b>`, x.a.map(a => `« ${esc(a.t)} » (${esc(a.nom)})`).join("<br>"))).join("")}</ul>`);
	if(T.shots.length) parts.push(`<h4>Captures d'écran</h4><div class="shots">${T.shots.map(s => `<a class="shot" href="${driveLink(s.id)}" target="_blank" rel="noopener"><img src="${thumb(s.id)}" alt="Capture de ${esc(s.nom)}" loading="lazy"><p>${esc(s.legende || "Sans légende")} · ${esc(s.nom)}</p></a>`).join("")}</div>`);
	if(T.niveau || T.duree) parts.push(`<p class="hint">Niveau : ${esc(T.niveau || "—")} · Durée : ${esc(T.duree || "—")}</p>`);
	$("todo").innerHTML = parts.join("") || `<p class="hint">Rien à corriger pour l'instant : tous les points notés sont justes.</p>`;
	const rows = ALL().map(it => {
		const got = reviews.map(r => ({ r, v:r.items?.[it.k] })).filter(x => x.v);
		const n = s => got.filter(x => x.v.s === s).length;
		return { it, got, ko:n("ko"), ok:n("ok"), na:n("na") };
	}).filter(x => x.got.length).sort((a, b) => b.ko - a.ko);
	const L = it => it.kind === "q" ? QLABEL : LABEL;
	$("byPoint").innerHTML = rows.map(x => `<div class="bar"><span><b>${esc(x.it.q)}</b><br><span class="hint">${esc(x.it.sec)}</span></span>
		<span class="tally">${x.ko ? `<span class="pill ko">${x.ko} ${L(x.it).ko.toLowerCase()}</span>` : ""}${x.ok ? `<span class="pill ok">${x.ok} ${L(x.it).ok.toLowerCase()}</span>` : ""}${x.na ? `<span class="pill na">${x.na} ?</span>` : ""}</span>
		${x.got.some(g => g.v.c) ? `<div class="cm">${x.got.filter(g => g.v.c).map(g => `<div>« ${esc(g.v.c)} » · ${esc(g.r.nom)}</div>`).join("")}</div>` : ""}</div>`).join("");
	$("byPerson").innerHTML = reviews.map(r => {
		const pill = r.verdict === "valide" ? "ok" : r.verdict === "non" ? "ko" : r.verdict ? "mid" : "na";
		const date = r.envoyeLe ? new Date(r.envoyeLe).toLocaleDateString("fr-FR", { day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" }) : "";
		const extra = [["Niveau", PICK[r.niveau]], ["Durée", PICK[r.duree]], ["Bugs", r.bugs], ...G.open.map(o => [o.q, r.open?.[o.k]]), ["Dernier mot", r.remarques]].filter(x => x[1]);
		return `<article class="rev"><header><h3>${esc(r.nom)}</h3><span class="pill ${pill}">${esc(PICK[r.verdict] || "Sans avis global")}</span></header>
			<span class="meta">${esc([r.fonction, r.appareil, date].filter(Boolean).join(" · "))}</span>
			${extra.length ? `<ul>${extra.map(([k, t]) => `<li><b>${esc(k)}</b> ${esc(t)}</li>`).join("")}</ul>` : ""}
			${r.journal ? `<pre class="copy">${esc(r.journal)}</pre>` : ""}</article>`;
	}).join("");
}
$("copyTodo").addEventListener("click", () => copyText(todoMarkdown(G, reviewsBy[G.id] || []), $("copyTodo"), "Copier la liste pour Claude"));
function showTab(view){
	$("viewGame").hidden = view !== "form"; $("viewRes").hidden = view !== "res";
	$("tabForm").setAttribute("aria-pressed", String(view === "form")); $("tabRes").setAttribute("aria-pressed", String(view === "res"));
	if(view === "res" && mv.playing) mv.pause();
	store.set("relecture:vue", view);
}
$("toForm").addEventListener("click", () => $("formulaire").scrollIntoView({ behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
$("tabForm").addEventListener("click", () => showTab("form"));
$("tabRes").addEventListener("click", () => showTab("res"));
function refresh(){ renderHome(); if(G){ $("due").innerHTML = dueHTML(G.id); $("tabs").hidden = !owner; renderReviews(); } }

/* ---------- navigation : #accueil, #tableau, #dmb, #sv… ---------- */
function route(){
	const id = location.hash.slice(1);
	G = CFG.games[id] || null;
	const acc = G ? G.accent : CFG.homeAccent, root = document.documentElement.style;
	root.setProperty("--accent-l", acc[0]); root.setProperty("--soft-l", acc[1]); root.setProperty("--accent-d", acc[2]); root.setProperty("--soft-d", acc[3]);
	setupVideo(G);
	$("viewHome").hidden = !!G;
	if(G){
		document.title = `Relecture · ${G.card.title} · Campus FGES`;
		renderGame();
		$("tabs").hidden = !owner;
		showTab(owner ? (store.get("relecture:vue") || "form") : "form");
		renderReviews();
	} else {
		document.title = "Relecture des mini-jeux · Campus FGES";
		$("h1").textContent = id === "tableau" ? "Tableau de bord des relectures" : "Relecture des mini-jeux"; $("lead").textContent = CFG.homeLead;
		$("tabs").hidden = true; $("viewGame").hidden = true; $("viewRes").hidden = true;
		renderHome();
		if(id === "tableau") $(owner ? "dashBox" : "loginBox").scrollIntoView();
	}
	if(id !== "tableau") window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();
loadCounts();
if(ownerKey) loadReviews();
