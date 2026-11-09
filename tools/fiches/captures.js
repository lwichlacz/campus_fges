/* Vignettes des bandeaux « Campus 3D » des fiches formation de fges.fr (img/fiches/<jeu>.jpg).
   Une vue « maquette » par mini-jeu, rendue dans le vrai campus : téléobjectif, sans étiquettes ni interface.

   À chaque nouveau mini-jeu : ajouter son cadrage dans VUES (lieu + caméra + cible), puis
     python tools/fiches/recepteur.py                         (reçoit les images, port 8769)
     ouvrir http://localhost:8765/?debug, puis dans la console :
       const V = await import("/tools/fiches/captures.js");
       await V.essai("robot")      // montre le cadrage à l'écran, sans rien enregistrer
       await V.tout()              // enregistre toutes les vignettes (ou V.une("robot"))
     python tools/fiches/bandeaux.py                          (bandeaux HTML à coller dans WordPress)
   Fenêtre conseillée : 1564 × 1020 (même proportion que l'image, 1200 × 783). */

// lieu : "ext" (le quartier de Vauban), ou un intérieur (atrium, wenovin, eura…)
// cam / cible : positions de la caméra et du point visé ; fov : angle de vue (petit = téléobjectif, effet maquette)
// Vauban : jardin botanique, Michel Falise (dehors) et l'atrium (dedans) · Euratechnologies : Wenov vu sous 4 angles et le quartier.
// Les vues rapprochées dans Wenov sont encombrées (piliers, vitres, arbres) : on montre le bâtiment, vu du ciel.
export const VUES = {
	jardin:     { lieu:"ext",     cam:[66, 105, 103],   cible:[-18, 0, -22],  fov:22 },
	comptoir:   { lieu:"atrium",  cam:[15, 11, 3],      cible:[-12, 3, 0],    fov:30 },
	audit:      { lieu:"ext",     cam:[75, 85, -5],     cible:[9, 4, -37],    fov:21 },
	patrimoine: { lieu:"ext",     cam:[-60, 95, 30],    cible:[9, 4, -37],    fov:19 },
	robot:      { lieu:"eura",    cam:[75, 100, 110],   cible:[1, 6, 7],      fov:20 },
	gaming:     { lieu:"eura",    cam:[-90, 100, 95],   cible:[1, 6, 7],      fov:20 },
	boutique:   { lieu:"eura",    cam:[105, 95, -55],   cible:[1, 6, 7],      fov:20 },
	biodata:    { lieu:"eura",    cam:[-85, 100, -65],  cible:[1, 6, 7],      fov:20 },
	affaires:   { lieu:"eura",    cam:[60, 150, 185],   cible:[-12, 0, 18],   fov:26 },
	crise:      { lieu:"ext",     cam:[78, 92, 88],     cible:[0, 8, -6],     fov:20 }
};

const C = () => { if(!window.campus) throw new Error("ouvrir le campus avec ?debug"); return window.campus; };
const attendre = ms => new Promise(r => setTimeout(r, ms));

// masque l'interface et les étiquettes (DOM, et étiquettes des lieux dessinées dans la scène)
function nettoyer(){
	if(!document.getElementById("vignettes-css")){
		const st = document.createElement("style"); st.id = "vignettes-css";
		st.textContent = "body>*:not(#scene):not(#vignette){visibility:hidden!important} #pins{display:none!important}";
		document.head.appendChild(st);
	}
	C().scene.traverse(o => { const m = o.material; if(m && m.uniforms && (m.uniforms.uSplit || m.uniforms.uLum)) o.visible = false; });
	for(const it of Object.values(C().interiors || {})) it && it.scene && it.scene.traverse(o => { const m = o.material; if(m && m.uniforms && (m.uniforms.uSplit || m.uniforms.uLum)) o.visible = false; });
}

async function cadrer(id){
	const v = VUES[id]; if(!v) throw new Error(`pas de cadrage pour « ${id} » dans VUES`);
	const c = C();
	try { c.setQuality("haute"); } catch(e){}
	c.set("time", "jour");
	if(v.lieu === "ext"){ if(c.mode !== "ext") c.placeExt("ha"); }
	else { await c.loadInterior(v.lieu); c.placeIn(v.lieu); }
	await attendre(900);
	nettoyer();
	c.camera.fov = v.fov; c.camera.updateProjectionMatrix();
	c.view(...v.cam, ...v.cible);
	await attendre(1500);
	// l'image est rendue puis lue dans la même image d'animation (sinon le navigateur a déjà vidé le tampon)
	return new Promise(ok => requestAnimationFrame(t => { c.frame(t); ok(c.renderer.domElement.toDataURL("image/jpeg", .92)); }));
}

// affiche le cadrage par-dessus le campus, pour régler VUES
export async function essai(id){
	const url = await cadrer(id);
	let im = document.getElementById("vignette");
	if(!im){ im = document.createElement("img"); im.id = "vignette"; im.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:99999;object-fit:cover"; im.onclick = () => im.remove(); document.body.appendChild(im); }
	im.src = url;
	return "clic sur l'image pour la retirer";
}

export async function une(id){
	const url = await cadrer(id);
	const r = await fetch("http://127.0.0.1:8769/" + id, { method:"POST", body:url });
	if(!r.ok) throw new Error("récepteur : " + r.status);
	return id + " enregistrée";
}

export async function tout(){
	const faits = [];
	for(const id of Object.keys(VUES)) faits.push(await une(id));
	return faits;
}
