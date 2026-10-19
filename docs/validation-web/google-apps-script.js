/* Réception des relectures des mini-jeux (page relecture/ du campus 3D) dans un tableur Google.

   Installation (5 minutes, une seule fois) :
   1. Créer un tableur Google « Relecture campus FGES », puis Extensions › Apps Script.
   2. Remplacer le contenu de Code.gs par ce fichier, enregistrer.
   3. Paramètres du projet (roue dentée) › Propriétés du script › ajouter CLE = un mot de passe de votre choix
      (il protège la lecture des retours depuis le tableau de bord de la page).
   4. Déployer › Nouveau déploiement › type « Application Web » ; Exécuter en tant que : moi ;
      Qui a accès : tout le monde. Autoriser l'accès demandé (tableur et Drive), puis copier l'URL (…/exec).
   5. Donner cette URL : elle va dans docs/validation-web/pages.json (« endpoint »), puis build.py et mise en ligne.
   Après une modification de ce script : Déployer › Gérer les déploiements › modifier › Nouvelle version (l'URL ne change pas).

   Feuilles créées automatiquement : « Retours » (une ligne par relecteur et par jeu, mise à jour s'il renvoie)
   et « Réglages » (date limite, relectures attendues par jeu : modifiables directement dans le tableur).
   Les captures d'écran vont dans le dossier Drive « Relecture campus FGES · captures », lisibles par lien. */

const COLS = ["Envoyé le", "Jeu", "Nom", "Fonction", "Appareil", "Avis", "Niveau", "Durée", "À corriger", "Bugs", "Idées", "Journal de partie", "Captures", "Relecteur", "Données"];
const JEUX = ["dmb", "sv", "spi", "gestion", "cfa", "info"];
const DOSSIER = "Relecture campus FGES · captures";

function feuille_(nom, entete){
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	let sh = ss.getSheetByName(nom);
	if(!sh){ sh = ss.insertSheet(nom); sh.appendRow(entete); sh.setFrozenRows(1); sh.getRange(1, 1, 1, entete.length).setFontWeight("bold"); }
	return sh;
}
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function cle_(){ return PropertiesService.getScriptProperties().getProperty("CLE") || ""; }
function reglages_(){
	const sh = feuille_("Réglages", ["Réglage", "Valeur"]);
	if(sh.getLastRow() < 2){ sh.appendRow(["date limite", "2026-11-06"]); JEUX.forEach(j => sh.appendRow(["attendus " + j, 2])); }
	const out = { deadline:null, attendus:{} };
	sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(([k, v]) => {
		if(k === "date limite") out.deadline = (v && typeof v.getTime === "function") ? Utilities.formatDate(v, "Europe/Paris", "yyyy-MM-dd") : String(v);
		else if(String(k).indexOf("attendus ") === 0) out.attendus[String(k).slice(9)] = Number(v) || 0;
	});
	return out;
}
function lignes_(){
	const sh = feuille_("Retours", COLS);
	return sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, COLS.length).getValues();
}
function dossier_(){
	const it = DriveApp.getFoldersByName(DOSSIER);
	return it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER);
}

// GET : compteurs publics (?action=compteurs) ou tous les retours pour le tableau de bord (?action=retours&cle=…)
function doGet(e){
	const p = (e && e.parameter) || {};
	if(p.action === "retours"){
		if(!cle_() || p.cle !== cle_()) return json_({ ok:false, error:"cle" });
		const retours = lignes_().map(r => { try { return JSON.parse(r[14]); } catch(x){ return null; } }).filter(Boolean);
		return json_({ ok:true, reglages:reglages_(), retours });
	}
	const compteurs = {};
	lignes_().forEach(r => { compteurs[r[1]] = (compteurs[r[1]] || 0) + 1; });
	return json_({ ok:true, compteurs, reglages:reglages_() });
}

// POST (corps JSON envoyé en text/plain) : une relecture, ou les réglages depuis le tableau de bord
function doPost(e){
	const d = JSON.parse(e.postData.contents);
	if(d.action === "reglages"){
		if(!cle_() || d.cle !== cle_()) return json_({ ok:false, error:"cle" });
		const sh = feuille_("Réglages", ["Réglage", "Valeur"]); reglages_();
		const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
		vals.forEach((row, i) => {
			if(row[0] === "date limite" && d.deadline) sh.getRange(i + 2, 2).setValue(d.deadline);
			const j = String(row[0]).slice(9);
			if(String(row[0]).indexOf("attendus ") === 0 && d.attendus && d.attendus[j] != null) sh.getRange(i + 2, 2).setValue(Number(d.attendus[j]) || 0);
		});
		return json_({ ok:true, reglages:reglages_() });
	}
	if(d.website) return json_({ ok:true });                                  // champ piège : un robot
	if(JEUX.indexOf(d.jeu) < 0 || !d.relecteur || !d.retour) return json_({ ok:false, error:"donnees" });
	const lock = LockService.getScriptLock(); lock.waitLock(20000);
	try {
		const r = d.retour;
		let folder = null;
		r.captures = (r.captures || []).slice(0, 8).map(c => {
			if(c.b64){
				folder = folder || dossier_();
				const f = folder.createFile(Utilities.newBlob(Utilities.base64Decode(c.b64), c.type || "image/jpeg", (r.nom || "relecteur") + " · " + d.jeu + ".jpg"));
				f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
				return { id:f.getId(), legende:String(c.legende || "").slice(0, 300) };
			}
			return { id:String(c.id || ""), legende:String(c.legende || "").slice(0, 300) };
		}).filter(c => c.id);
		r.jeu = d.jeu; r.envoyeLe = new Date().toISOString();
		const s = d.resume || {};
		const ligne = [new Date(), d.jeu, r.nom || "", r.fonction || "", r.appareil || "", s.avis || "", s.niveau || "", s.duree || "",
			s.corrections || "", r.bugs || "", s.idees || "", String(r.journal || "").slice(0, 45000),
			r.captures.map(c => "https://drive.google.com/file/d/" + c.id + "/view" + (c.legende ? " (" + c.legende + ")" : "")).join("\n"),
			d.relecteur, JSON.stringify(r).slice(0, 49000)];
		const sh = feuille_("Retours", COLS), rows = lignes_();
		const i = rows.findIndex(x => x[13] === d.relecteur && x[1] === d.jeu);
		if(i >= 0) sh.getRange(i + 2, 1, 1, COLS.length).setValues([ligne]); else sh.appendRow(ligne);
		return json_({ ok:true, captures:r.captures });
	} finally { lock.releaseLock(); }
}
