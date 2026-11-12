/* Encart « Viens le vivre en vrai » des écrans de fin : le prochain rendez-vous sur le campus (RENDEZ_VOUS, data.js).
   Même encart dans tous les jeux, au moment où le visiteur est le plus convaincu. Ne s'affiche plus quand aucun
   rendez-vous n'est à venir. Le jaune est celui du banc du patio de Wenov : il ne se confond avec aucun habillage. */
import { RENDEZ_VOUS } from "../data.js?v=4c7bed0933";

export function nextRendezVous(now = new Date()){
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return RENDEZ_VOUS.map(r => ({ ...r, d:new Date(r.date + "T12:00:00") })).filter(r => r.d >= today).sort((a, b) => a.d - b.d)[0] || null;
}

export function jpoCard(lang = "fr"){
	const r = nextRendezVous();
	if(!r) return "";
	const en = lang === "en";
	const day = r.d.toLocaleDateString(en ? "en-GB" : "fr-FR", { weekday:"long", day:"numeric", month:"long" });
	const title = en ? "Come and live it for real" : "Viens le vivre en vrai";
	const what = en ? `Open day on ${day}` : `Journée portes ouvertes le ${day}`;
	const hours = en ? "" : `, ${r.hours}`;
	const where = en ? "Vauban campus, Lille" : "Campus Vauban, Lille";
	return `<a href="${r.url}" target="_blank" rel="noopener" data-jpo="${r.date}" style="display:flex;gap:12px;align-items:center;margin:14px 0 6px;padding:12px 14px;min-height:48px;border-radius:12px;background:#fdf3c7;border:2px solid #f4c430;color:#3d2e00;text-decoration:none;text-align:left;font:inherit;line-height:1.35;box-sizing:border-box;width:100%">`
		+ `<span aria-hidden="true" style="font-size:26px;line-height:1">📅</span>`
		+ `<span style="flex:1;min-width:0"><b style="display:block;font-size:15px">${title}</b>`
		+ `<span style="font-size:14px">${what}${hours}. ${where}.</span></span>`
		+ `<span aria-hidden="true" style="font-weight:700">↗</span></a>`;
}
