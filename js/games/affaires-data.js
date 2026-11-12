/* « Le dossier Duval Textiles » : les contenus (chiffres, pièces, objections, cours du master).
   Tout est fictif : Duval Textiles, Volta Mobility, Autolux, Siègeco, Nordtex, Lys Invest, le Crédit des Flandres.
   Les chiffres sont cohérents entre eux (liasse → ratios → visite → montage → notation) : en changer un,
   c'est vérifier les autres. À relire par l'équipe du master (docs/validation-master-mbif.md). */

export const PRET = 1200;            // k€ demandés
export const TAUX = .042;            // taux du prêt
export const CAF = 520;              // CAF 2025 = résultat net 210 + dotations 310
export const CAF_PREV = 650;         // CAF prévisionnelle avec la nouvelle ligne (520 + 130)
export const SERVICE = 150;          // remboursements annuels des dettes existantes (k€)
export const DETTES = 900;           // dettes financières fin 2025
export const CP = 2800;              // capitaux propres fin 2025
export const VIE = 8;                // durée de vie de la ligne d'enduction (ans)
export const PATRI = 350;            // patrimoine net de M. Duval (k€)
export const PROPRES = 100;          // biens propres et revenus de M. Duval, sans l'accord de son épouse
export const NANT = 360;             // valeur retenue du nantissement de la ligne (30 %)
export const BPI_MAX = 50;           // quotité maximale de la garantie Bpifrance ici (%)
export const PAL = 150;              // valeur d'inventaire d'une palette (k€)
export const annuite = n => PRET*TAUX/(1 - Math.pow(1 + TAUX, -n));

// la liasse fiscale simplifiée, en k€ : [id, libellé, 2023, 2024, 2025] ; sans chiffres = intertitre
export const LIASSE = [
	["h1", "COMPTE DE RÉSULTAT"],
	["ca", "Chiffre d'affaires", 6200, 6350, 6400],
	["ebe", "Excédent brut d'exploitation", 720, 700, 690],
	["dot", "Dotations aux amortissements", 300, 300, 310],
	["rn", "Résultat net", 250, 230, 210],
	["h2", "BILAN (au 31 décembre)"],
	["immo", "Immobilisations nettes (machines)", 2060, 1860, 1440],
	["stk", "Stocks de fil et de tissu", 900, 1250, 1850],
	["cli", "Créances clients", 1020, 1050, 1080],
	["tre", "Trésorerie", 420, 260, 90],
	["cp", "Capitaux propres", 2400, 2600, 2800],
	["dfi", "Dettes financières", 1300, 1100, 900],
	["fou", "Dettes fournisseurs", 700, 720, 760]
];

// les ratios du comité, à la calculatrice
export const RATIOS = [
	{ id:"stock", t:"Rotation des stocks 2025", f:"Stocks ÷ Chiffre d'affaires × 365", unit:"jours", v:1850/6400*365, tol:2.5, dec:0, norm:"en 2023 : 53 jours",
		hint:"Stocks 2025 (1 850) ÷ chiffre d'affaires 2025 (6 400) × 365. Tape-le dans l'ordre : la calculatrice calcule de gauche à droite." },
	{ id:"endet", t:"Endettement après le prêt", f:"(Dettes financières + 1 200) ÷ Capitaux propres", unit:"", v:2100/2800, tol:.02, dec:2, norm:"norme de la banque : 1 au plus",
		hint:"Dettes financières 2025 (900) + le prêt (1 200), puis ÷ capitaux propres 2025 (2 800)." },
	{ id:"caf", t:"Capacité d'autofinancement 2025", f:"Résultat net + Dotations aux amortissements", unit:"k€", v:520, tol:1, dec:0, norm:"l'argent que l'activité dégage chaque année",
		hint:"Résultat net 2025 (210) + dotations 2025 (310) : les dotations ne sortent pas de la caisse." },
	{ id:"capa", t:"Capacité de remboursement", f:"(Dettes financières + 1 200) ÷ CAF", unit:"ans", v:2100/520, tol:.08, dec:1, norm:"norme de la banque : 4 ans au plus",
		hint:"(900 + 1 200) ÷ la CAF que tu viens de calculer (520)." }
];

// les 12 palettes du stock : [client, référence, entrée en stock, invendable]
export const PALLETS = [
	["Siègeco", "Fil PA 6.6 gris", "10/2025", false],
	["Autolux", "Fil noir AX-17", "02/2024", true],
	["Nordtex Auto", "Tissu enduit beige", "11/2025", false],
	["Siègeco", "Fil PA 6.6 bleu", "09/2025", false],
	["Autolux", "Tissu AX-17 perforé", "04/2024", true],
	["Volta (essais)", "Tissu enduit gris", "10/2025", false],
	["Nordtex Auto", "Fil polyester blanc", "11/2025", false],
	["Siègeco", "Fil PA 6.6 noir", "10/2025", false],
	["Autolux", "Fil noir AX-17", "01/2024", true],
	["Nordtex Auto", "Tissu 3D respirant", "09/2025", false],
	["Autolux", "Tissu AX-17 uni", "03/2024", true],
	["Siègeco", "Fil PA 6.6 rouge", "11/2025", false]
];

// le carnet de commandes 2026 et la lettre de Volta, épinglée au tableau (en anglais, comme dans la vraie vie)
export const ORDERS = [["Siègeco", "2 900", "signé"], ["Nordtex Auto", "2 400", "signé"], ["Divers", "1 300", "signé"], ["Volta Mobility", "1 600 / an", "lettre"]];
export const LETTER = [
	["z1", ["We are pleased to confirm our interest", "in your coated seat fabric."]],
	["z2", ["We intend to purchase up to 180,000 metres", "per year from 2027,"]],
	["z3", ["subject to the successful qualification", "of your samples."]],
	["z4", ["This letter is non-binding and does not", "constitute a purchase order."]],
	["z5", ["We look forward to working with you."]]
];

// l'actionnariat (KYC) : qui est derrière Duval Textiles ?
export const ORG = {
	nodes:{ jean:[180, 175, "Jean Duval", "62 ans, président"], clara:[520, 175, "Clara Duval", "34 ans, sa fille"], lys:[830, 360, "Lys Invest", "fonds régional"],
		jdp:[330, 360, "JD Participations", "holding familiale"], dt:[580, 560, "Duval Textiles SAS", "l'usine"] },
	edges:[["jean", "jdp", 60], ["clara", "jdp", 40], ["jdp", "dt", 80], ["lys", "dt", 20]]
};
export const RBE = [
	["l1", "Jean Duval · né le 12/03/1964 · 48 % · détention indirecte (JD Participations)"],
	["l2", "Aucun autre bénéficiaire effectif déclaré"],
	["l3", "Déclaration déposée le 14/03/2021"],
	["l4", "Représentant légal : JD Participations, représentée par Jean Duval"]
];

// la grille de notation interne (fictive) : lignes = capacité de remboursement, colonnes = endettement ; [cote, probabilité de défaut %]
export const GRID = { rows:["moins de 3 ans", "de 3 à 5 ans", "plus de 5 ans"], cols:["moins de 0,5", "de 0,5 à 1", "plus de 1"],
	cells:[[[1, .3], [2, .6], [4, 1.5]], [[3, 1], [5, 2], [7, 5]], [[6, 3], [8, 8], [9, 15]]], good:[1, 1] };

// les pièces du dossier, dans l'ordre où elles arrivent
export const PIECES = { liasse:"Liasse fiscale annotée", ratios:"Fiche de ratios", visite:"Fiche de visite de l'usine", volta:"Photo du tableau : lettre de Volta",
	montage:"Fiche de montage du prêt", kyc:"Organigramme des actionnaires", rbe:"Extrait du registre des bénéficiaires effectifs", grille:"Grille de notation" };

// le comité : trois membres, quatre objections. ok / mid : « pièce:zone » (zone * = n'importe quelle ligne de la pièce)
export const MEMBERS = { lambert:"Mme Lambert, directrice des risques", vasseur:"M. Vasseur, directeur régional", okafor:"M. Okafor, responsable conformité" };
export function objections(volta){
	return [
		{ who:"vasseur", q:"Les stocks ont doublé en deux ans. Vous voulez prêter 1,2 million à une entreprise qui ne vend plus ?",
			ok:["visite:dead", "visite:live"], mid:["visite:count", "visite:cp"],
			yes:"Les stocks gonflent à cause de 4 palettes Autolux, 600 k€ invendables depuis la fermeture de ce client : on les déprécie. Les 8 autres palettes partent en quelques semaines.",
			no:"Il fallait sortir la fiche de visite : 4 palettes Autolux invendables, 600 k€ à déprécier, et 8 palettes qui tournent normalement." },
		{ who:"lambert", q:"Quatre ans de capacité de remboursement, c'est notre limite. Si ça tourne mal, combien perd la banque ?",
			ok:["montage:cov", "montage:bpi", "montage:nant", "grille:el"], mid:["montage:caution", "montage:effort", "grille:cell"],
			yes:"Peu : les garanties couvrent l'essentiel du prêt, Bpifrance partage le risque et la ligne est nantie. La perte attendue est calculée dans la grille.",
			no:"Il fallait montrer la couverture des garanties (fiche de montage) ou la perte attendue (grille de notation)." },
		{ who:"okafor", q:"Qui contrôle vraiment Duval Textiles ? Je ne signe pas un crédit sans le savoir.",
			ok:["kyc:jean", "kyc:clara", "rbe:l2"], mid:["kyc:*", "rbe:*"],
			yes:"Jean Duval, 48 %, et sa fille Clara, 32 %, via la holding familiale. Le registre n'était pas à jour pour Clara : nous l'avons signalé au greffe.",
			no:"Il fallait montrer l'organigramme : Jean Duval 48 %, Clara Duval 32 %, et l'écart avec le registre, signalé au greffe." },
		{ who:"lambert", q:"Dernière chose : la nouvelle ligne est faite pour Volta. Et si Volta ne signe jamais ?",
			ok:volta ? ["montage:volta"] : [], mid:volta ? ["volta:z3", "volta:z4"] : ["volta:z3", "volta:z4"],
			yes:"Les fonds ne seront débloqués qu'une fois le contrat Volta signé : c'est une condition suspensive du prêt.",
			no:volta ? "Il fallait montrer la condition suspensive de la fiche de montage : pas de contrat Volta, pas de déblocage."
				: "Le montage ne prévoit rien si Volta ne signe pas. Le comité ajoute lui-même une condition suspensive : c'était à toi de la prévoir." }
	];
}

// les cours du master, tels qu'ils figurent au programme (fges.fr, onglet Programme)
export const COURSES = {
	af:["M2 · S3", "Analyse financière approfondie", "lire une liasse fiscale et repérer la ligne qui cloche"],
	crea:["M1 · S2", "Création d'entreprise – analyse financière", "EBE, résultat, CAF : les soldes de gestion"],
	marche:["M1 · S2", "Connaissance du marché des professionnels et des entreprises", "une PME industrielle, ses clients et sa demande"],
	math:["M1 · S1", "Mise à niveau en mathématiques", "les ratios à la calculatrice"],
	besoins:["M1 · S1", "Analyse des besoins et risques financiers", "rotation des stocks, endettement, capacité de remboursement"],
	risqpme:["M2 · S3", "Risque sur la clientèle professionnelle et PME", "détecter sur place un stock invendable"],
	conj:["M1 · S1", "Conjoncture économique et financière", "la fermeture d'un client de l'automobile"],
	ang:["M1 · M2", "Anglais – business negotiation", "lire une lettre d'intention en anglais"],
	finpro:["M1 · S2", "Décisions et techniques de financement des professionnels", "durée, annuité, effort de remboursement"],
	droitfin:["M2 · S4", "Droit du financement de l'entreprise", "nantissement et condition suspensive"],
	droitbq:["M1 · S1", "Droit bancaire", "une caution proportionnée au patrimoine"],
	regmat:["M2 · S3", "Les régimes matrimoniaux", "la caution d'un époux marié sous la communauté"],
	sib:["M1 · S1", "Système, intermédiation et stratégie bancaire", "partager le risque avec Bpifrance"],
	soc:["M1 · S2", "Droit des sociétés", "une holding entre la famille et l'usine"],
	audit:["M2 · S3", "Contrôles et audits internes", "le KYC et les bénéficiaires effectifs"],
	grisk:["M2 · S3", "Gestion du risque bancaire", "cote, probabilité de défaut, perte attendue"],
	cdg:["M2 · S3", "Contrôle de gestion bancaire", "le taux : ressource + risque + frais + marge"],
	polec:["M1 · S1", "Politique économique", "le coût de la ressource suit les taux de la BCE"],
	nego:["M2 · S3-S4", "Négociation", "répondre aux objections du comité"],
	oral:["M2 · S4", "Parler en public", "défendre son dossier"],
	ethique:["M2 · S4", "Éthique et finance", "dire au comité ce que le dossier cache"],
	alt:["M1 · M2", "Évaluation de la période en entreprise", "une semaine d'alternant, du lundi au jeudi"]
};
// la suite du même dossier, côté patrimoine du dirigeant : ce que le master apprend aussi
export const NEXT = ["Holdings – LBO – Transmission d'entreprises", "Droit de la transmission (d'entreprise)", "Statut social et fiscal du chef d'entreprise",
	"Stratégies patrimoniales et fiscales du dirigeant d'entreprise", "Épargne salariale – Madelin – PEE – PERCO", "Le démembrement de propriété"];
