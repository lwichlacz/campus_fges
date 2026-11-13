/* Le palier commun aux mini-jeux (le « teasing » demandé par les responsables pédagogiques, nov. 2026).
   Chaque jeu s'ouvre à chaud sur sa première scène, jouable en une minute environ, sans écran de règles.
   À la fin de cette scène, ce palier propose : continuer tout le dossier, recevoir la plaquette, ou revenir au campus.
   La partie reprend exactement où elle en était : rien n'est perdu ni rejoué.

   palier({ id, titre, texte, suite, onEvent, openLead, quit, en }) → Promise résolue quand le joueur continue.
   - id : le jeu ; une fois le palier passé, il ne revient pas dans la même visite (« Rejouer » enchaîne sans s'arrêter)
   - titre : le résultat de la scène, en une phrase (« Tu as trouvé la chute qui manquait. »)
   - texte : ce qui attend la suite (deux phrases au plus) ; masqué sur téléphone pour garder les boutons à l'écran
   - suite : le libellé du bouton principal, durée comprise (« Monter tout le dossier (≈ 6 min) »)
   - quit : ferme le jeu (sa fonction close) ; openLead : ouvre le formulaire de plaquette, après fermeture
   L'entonnoir compte « palier » (scène d'ouverture finie) et « suite » (le joueur a choisi de continuer). */
const CSS = `
.pl-ov{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(10,18,14,.38);font-family:Inter,system-ui,sans-serif;font-weight:300;animation:plIn .3s ease both}
@keyframes plIn{from{opacity:0}}
.pl-card{width:100%;max-width:430px;max-height:100%;overflow:auto;background:#fffcf3;color:#24302a;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.45);padding:18px 18px 14px;box-sizing:border-box;animation:plUp .4s cubic-bezier(.2,.8,.2,1) both;border-top:6px solid var(--pl,#b08a3e)}
@keyframes plUp{from{opacity:0;transform:translateY(24px)}}
.pl-k{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--pl,var(--ec-texte,#0f3168))}
.pl-h{font:300 21px/1.2 Tiempos Headline,Georgia,serif;margin:6px 0 8px;color:#1f2b26}
.pl-p{margin:0 0 6px;font-size:14.5px;line-height:1.45;color:#4a5450}
.pl-go{display:block;width:100%;border:0;border-radius:12px;padding:14px;background:var(--ec-fort,#0f3168);color:#fff;font:700 16px Inter,system-ui,sans-serif;cursor:pointer;margin-top:12px}
.pl-alt{display:block;width:100%;border:2px solid #ddd3bb;border-radius:12px;padding:11px;background:#fff;color:#1f2b26;font:700 14px Inter,system-ui,sans-serif;cursor:pointer;margin-top:8px}
.pl-go:focus-visible,.pl-alt:focus-visible{outline:3px solid var(--pl,var(--ec,#21b7cb));outline-offset:2px}
@media (max-width:759px){
	.pl-ov{align-items:flex-end;padding:0}
	.pl-card{max-width:none;border-radius:18px 18px 0 0;padding:16px 16px 20px}
	.pl-p.more{display:none}
}`;

const seen = new Set();
export function palier({ id, titre, texte, suite, onEvent, openLead, quit, en = false, accent }){
	if(id && seen.has(id)) return Promise.resolve();
	if(!document.getElementById("plCss")){ const st = document.createElement("style"); st.id = "plCss"; st.textContent = CSS; document.head.appendChild(st); }
	onEvent && onEvent("palier");
	return new Promise(res => {
		const ov = document.createElement("div");
		ov.className = "pl-ov";
		if(accent) ov.style.setProperty("--pl", accent);
		ov.innerHTML = `<div class="pl-card" role="dialog" aria-modal="true" aria-labelledby="plH">
			<div class="pl-k">${en ? "You've had a taste" : "Tu viens de goûter au métier"}</div>
			<h2 class="pl-h" id="plH">${titre}</h2>
			${texte ? `<p class="pl-p more">${texte}</p>` : ""}
			<button class="pl-go" data-p="suite">${suite}</button>
			${openLead ? `<button class="pl-alt" data-p="lead">📄 ${en ? "Get the brochure" : "Recevoir la plaquette"}</button>` : ""}
			<button class="pl-alt" data-p="quit">${en ? "Back to the campus" : "Retour au campus"}</button></div>`;
		const done = () => { ov.remove(); document.removeEventListener("keydown", key, true); };
		// Échap ferme le palier comme « Retour au campus » ; les jeux, eux, se ferment déjà sur Échap
		const key = e => { if(e.key === "Escape") done(); };
		document.addEventListener("keydown", key, true);
		ov.addEventListener("click", e => {
			const p = e.target.closest("[data-p]")?.dataset.p; if(!p) return;
			done();
			if(p === "suite"){ id && seen.add(id); onEvent && onEvent("suite"); res(); }
			else { quit && quit(); if(p === "lead") openLead(); }
		});
		document.body.appendChild(ov);
		setTimeout(() => ov.querySelector(".pl-go")?.focus({ preventScroll:true }), 350);
	});
}
