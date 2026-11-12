/* Contenus du « Guichet du samedi » (Licence Pro Assurance-Banque-Finance, FGES) : un enseignant peut modifier
   ici les répliques, les chiffres, les indices et les cours sans toucher au moteur du jeu (guichet.js).
   Programme : fges.fr, Licence professionnelle Assurance Banque Finance, BCC 1 à 6 (relevé le 10/11/2026).
   Personnes, agence et montants fictifs.

   Le dossier : « Qui blanchit ? ». À 9 h, la conformité prévient que des fonds suspects transitent par l'agence
   (NOTE). Chaque client apporte des indices (PINS), épinglés dans le carnet de Nadia. À midi, le joueur relie
   chaque soupçon à sa preuve (ALERTS), puis désigne qui signaler à Tracfin (SUSPECTS). Coupable : Karim.

   Types d'étapes (gestes du métier, jamais de réponse à choisir) :
     listen   : le client parle ; toucher les phrases qui comptent (sig:1) avant qu'elles s'effacent. pin : l'indice épinglé.
     radio    : une annonce qui change la suite (pas de geste).
     slider   : le simulateur de l'écran ; on règle une valeur, les chiffres bougent en direct, puis on propose.
     parts    : l'acte de propriété ; colorier la part de chacun selon son apport.
     pair     : pointer une attestation : toucher une ligne, puis la pièce qui la confirme (les autres sont des leurres).
     idcheck  : comparer les pièces d'un client ; toucher l'information qui ne colle pas.
     phone    : le téléphone vibre ; le toucher vite, puis faire le budget de la cliente (budget).
     calendar : compter les jours ouvrés sur le calendrier, un par un.
     doc      : un document à vérifier ; toucher la ligne fausse.
     stop     : une alerte au guichet voisin ; maintenir « Stop » à temps.
     hand     : le client tend une pièce, qui part au carnet (pas de geste). */

export const COURSES = {
	vente:    ["BCC 4", "Séminaire Entretien Vente", "Découvrir, reformuler, traiter l'objection, conclure : un entretien a une structure. Et ce que le client dit en passant compte souvent plus que sa demande."],
	immo:     ["BCC 5", "Crédit immobilier", "Mensualités au plus à 35 % des revenus, assurance emprunteur comprise, sur 25 ans au plus : c'est la règle du HCSF."],
	mathfi:   ["BCC 5", "Mathématiques financières", "La mensualité dépend du capital, du taux et de la durée. Allonger la durée baisse la mensualité mais fait grimper le coût total des intérêts."],
	macro:    ["BCC 1", "Introduction à la macroéconomie", "Quand la BCE relève ses taux directeurs, le crédit coûte plus cher pour tout le monde : les banques répercutent la hausse sur leurs offres."],
	conso:    ["BCC 2", "Protection du consommateur", "Offre de prêt immobilier : 10 jours de réflexion avant de pouvoir l'accepter. Crédit à la consommation : 14 jours de rétractation."],
	propriete:["BCC 2", "Droit de la propriété", "Acheter à deux sans être mariés, c'est l'indivision : chacun possède à proportion de son apport, et le notaire l'écrit dans l'acte."],
	matrim:   ["BCC 2", "Régimes matrimoniaux et fiscalité du patrimoine familial", "Mariage, PACS ou concubinage ne protègent pas pareil le survivant. Le conseiller explique ; il ne choisit pas à la place du couple."],
	conform:  ["BCC 1", "Conformité", "Connaître son client : son profil avant tout placement (directive MIF 2), et l'origine de son argent, prouvée par une pièce. Une parole ne suffit pas."],
	kyc:      ["BCC 1", "Conformité · ouverture de compte", "Pièce d'identité et justificatif de domicile. Hébergé chez quelqu'un ? Une attestation d'hébergement signée, avec la pièce d'identité de l'hébergeant."],
	marches:  ["BCC 1", "Systèmes financiers et placement sur les marchés des capitaux", "Fonds en euros : capital garanti, rendement modeste. Unités de compte : plus de rendement espéré, mais on peut perdre. L'horizon décide."],
	epargne:  ["BCC 3", "Produits d'épargne, assurance vie, épargne retraite", "L'assurance-vie sert à tout : épargner, transmettre, compléter sa retraite. Après 8 ans, sa fiscalité devient avantageuse."],
	patrim:   ["BCC 6 · Bancassurance", "Approche patrimoniale · Fiscalité du revenu", "Un conseil patrimonial regarde toute la situation : revenus, impôts, famille, projets. Puis seulement les produits."],
	omni:     ["BCC 4", "Technique de vente omni-canal", "Agence, téléphone, appli, messagerie : le client choisit son canal, et il attend la même qualité de réponse partout."],
	educfi:   ["BCC 4", "Éducation financière et entraînement à la banque en ligne", "Aider un client à tenir son budget (alertes de solde, abonnements en trop) vaut mieux qu'un crédit renouvelable qui creuse le trou."],
	credit:   ["BCC 3", "Crédits aux particuliers", "Crédit affecté, prêt personnel, renouvelable : chacun a son usage. Le renouvelable ne doit jamais financer un découvert qui dure."],
	anglais:  ["BCC 5", "Anglais bancaire et financier", "Account, statement, wire transfer, proof of address… En agence comme au téléphone, un chargé de clientèle reçoit aussi des clients étrangers."],
	sinistre: ["BCC 1", "Gestion de risques financiers et gestion des sinistres", "Un sinistre se déclare sous 5 jours ouvrés (2 pour un vol), avec photos et factures. L'assureur indemnise, moins la franchise."],
	autohab:  ["BCC 3", "Assurances automobiles et habitation", "La multirisque habitation couvre le dégât des eaux. Choisir sa franchise, c'est arbitrer entre la prime payée chaque année et ce qui reste à payer en cas de sinistre."],
	principe: ["BCC 6 · Bancassurance", "Principe de l'assurance", "Mutualisation : les primes de milliers d'assurés paient les sinistres de quelques-uns. C'est tout le principe de l'assurance."],
	constr:   ["BCC 3", "Assurance construction", "Tout artisan du bâtiment doit avoir une garantie décennale en cours de validité. Avant les travaux, on demande l'attestation de l'année."],
	creation: ["BCC 6 · Banque +", "Accompagnement à la création d'entreprise", "Un créateur arrive avec un prévisionnel. Le banquier le lit, le questionne, et vérifie qu'il tient debout."],
	analyse:  ["BCC 6 · Banque +", "Analyse financière", "Chiffre d'affaires, charges, résultat : on compare aux chiffres habituels du métier. Un plombier seul ne facture pas 180 000 € la première année."],
	pro:      ["BCC 6", "Marché du professionnel · Produits du professionnel", "Un pro a besoin d'un compte pro, d'un financement au nom de l'entreprise et d'assurances obligatoires : RC pro, décennale."],
	lcbft:    ["BCC 1", "Conformité · lutte contre le blanchiment", "Des espèces fractionnées pour rester sous 10 000 € : signal d'alerte. On demande l'origine des fonds ; sans justificatif, déclaration de soupçon à Tracfin, sans prévenir le client."],
	tracfin:  ["BCC 1", "Conformité · déclaration de soupçon", "La déclaration à Tracfin s'appuie sur des faits et des pièces, jamais sur une impression. Elle est confidentielle : prévenir le client est un délit."],
	stats:    ["BCC 5", "Informatique et statistiques appliquées", "Les tableaux de bord de l'agence (satisfaction, produit net bancaire) se lisent chaque semaine pour savoir où progresser."],
	relation: ["BCC 6 · Bancassurance", "Gestion de la relation client", "Bien servir tout le monde, même un jour d'enquête : un client soupçonné à tort reste un client."]
};

/* ---------- le dossier : la note de la conformité, à 9 h ---------- */
export const NOTE = {
	date:"Samedi 14 novembre, 9 h",
	lead:"Des fonds suspects transitent par l'agence. Le logiciel a levé trois alertes ce mois-ci :",
	items:[
		["A", "9 500 € en espèces, déposés au guichet 2 par un tiers, une fois par mois depuis septembre, sur le compte n° …4471. Toujours sous 10 000 €."],
		["B", "40 000 € arrivés d'un coup, le 3 novembre, sur le compte d'un client retraité."],
		["C", "Une demande d'ouverture de compte en ligne annonce des virements réguliers depuis l'Irlande."]
	],
	end:"Un seul de ces dossiers relève de Tracfin. Épingle les indices dans mon carnet ; à midi, on décide. Signaler un innocent : non. Prévenir le suspect : interdit."
};

/* ---------- les indices, épinglés au carnet au fil de la matinée ---------- */
export const PINS = {
	temoin:   { who:"Sami", ico:"👀", t:"Un homme dépose des enveloppes d'espèces au guichet 2, « comme le mois dernier »." },
	heritage: { who:"M. Duhamel", ico:"💬", t:"« Ma sœur m'a laissé 40 000 €. »" },
	notaire:  { who:"M. Duhamel", ico:"📜", t:"Attestation de Me Claire Lefebvre, notaire à Lille : succession de sa sœur, 40 000 € virés le 3 novembre. Pointée sur son relevé." },
	bourse:   { who:"Tom", ico:"💬", t:"« My scholarship arrives next week. »" },
	erasmus:  { who:"Tom", ico:"🎓", t:"Lettre de bourse Erasmus+ : University College Dublin lui verse 450 € par mois, d'octobre à juin." },
	cousin:   { who:"Mme Benali", ico:"💬", t:"« Mon cousin peut refaire le plafond, il n'est pas cher. »" },
	benarib:  { who:"Mme Benali", ico:"🏦", t:"Son nouveau contrat sera prélevé sur son compte n° …4417." },
	liquide:  { who:"Karim", ico:"💬", t:"« Mes clients me paient souvent en liquide. »" },
	previ:    { who:"Karim", ico:"📊", t:"Prévisionnel : 180 000 € de chiffre d'affaires, environ 110 000 € de plus qu'un plombier seul. Soit à peu près 9 200 € de trop chaque mois." },
	bordereau:{ who:"Guichet 2", ico:"🧾", t:"Bordereau : 9 500 € en espèces, « pour mon cousin », motif « recettes de chantiers », sur le compte n° …4471." },
	rib:      { who:"Karim", ico:"🏦", t:"RIB de Karim, pour recevoir son prêt : FR76 3000 4012 5800 0104 4471." }
};

/* ---------- à midi : relier chaque soupçon à sa preuve ---------- */
// key : l'indice qui répond ; who : la personne que ce lien désigne ; clear:1 = la preuve innocente ; hints : pourquoi un autre indice ne va pas.
export const ALERTS = [
	{ id:"A1", tag:"A", q:"Le compte n° …4471, crédité en espèces au guichet 2 : à qui est-il ?", key:"rib", who:"karim",
		verdict:"Le compte …4471 est celui de Karim.",
		hints:{ bordereau:"Le bordereau dit quel compte, pas à qui il est.", benarib:"Lis bien : …4417, pas …4471.", cousin:"Un cousin… mais à qui est le compte ?", temoin:"Un témoin ne dit pas à qui est le compte." } },
	{ id:"A2", tag:"A", q:"9 500 € d'espèces chaque mois : quel document les ferait passer pour normaux ?", key:"previ", who:"karim",
		verdict:"Le chiffre d'affaires gonflé de Karim couvrirait les dépôts : 110 000 € de trop par an, c'est à peu près douze dépôts de 9 500 €.",
		hints:{ liquide:"C'est ce qu'il dit. Quel document le mettrait noir sur blanc ?", bordereau:"Le bordereau montre le dépôt, pas ce qui le justifierait." } },
	{ id:"B", tag:"B", q:"40 000 € arrivés d'un coup sur le compte d'un retraité : d'où viennent-ils ?", key:"notaire", who:"duhamel", clear:1,
		verdict:"Un héritage, prouvé par l'attestation du notaire : origine justifiée.",
		hints:{ heritage:"Sa parole ne suffit pas : il faut une pièce." } },
	{ id:"C", tag:"C", q:"Des virements réguliers d'Irlande sur un compte tout neuf : pourquoi ?", key:"erasmus", who:"tom", clear:1,
		verdict:"La bourse Erasmus+ de Tom : origine justifiée.",
		hints:{ bourse:"Une phrase n'est pas une preuve : il faut un document." } }
];
export const SUSPECTS = [
	{ id:"duhamel", name:"M. Duhamel", ico:"👴", tag:"le retraité" },
	{ id:"tom", name:"Tom", ico:"🧑‍🎓", tag:"l'Erasmus" },
	{ id:"benali", name:"Mme Benali", ico:"👩", tag:"le dégât des eaux" },
	{ id:"karim", name:"Karim", ico:"👷", tag:"le plombier" }
];
export const CULPRIT = "karim";

/* ---------- le simulateur de crédit (Jade et Sami) ---------- */
export const IMMO = { capital:195000, revenus:3900, tauxAvant:3.6, taux:4.1, assurance:.30, max:.35 };
export function mensualite(capital, tauxAn, ans){
	const r = tauxAn/100/12, n = ans*12;
	return capital*r/(1 - Math.pow(1 + r, -n));
}
export function immoCalc(ans){
	const m = mensualite(IMMO.capital, IMMO.taux, ans), ass = IMMO.capital*IMMO.assurance/100/12;
	const total = m + ass, pct = total/IMMO.revenus, interets = m*ans*12 - IMMO.capital;
	return { m, ass, total, pct, interets };
}
export function immoBest(){ for(let a = 10; a <= 25; a++) if(immoCalc(a).pct <= IMMO.max) return a; return 25; }

const euro = n => Math.round(n).toLocaleString("fr-FR") + " €";
export { euro };

/* ---------- les clients, dans l'ordre de la file ---------- */
export const CLIENTS = [
	{
		id:"lemaire", name:"Jade et Sami", who:"27 et 28 ans · achat d'un T3", kinds:["casual", "pro"], ticket:41,
		hello:"Bonjour ! On a trouvé un appartement à Lambersart, on vient pour le prêt.",
		steps:[
			{ t:"listen", lines:[
				["Un T3 de 65 m², à deux pas du parc.", 0],
				["Il coûte 225 000 €, frais de notaire compris.", 0],
				["Moi, mon contrat à l'hôpital se termine en juin.", 1, "Un CDD qui finit : la banque regardera la stabilité des revenus."],
				["On a 30 000 € d'apport : 20 000 de Jade, 10 000 de Sami.", 1, "Des apports inégaux : ça comptera dans l'acte."],
				["Au guichet 2, le monsieur aux enveloppes est encore là, comme le mois dernier.", 1, "Un témoin, peut-être utile pour l'alerte A : je l'épingle.", "temoin"],
				["Ensemble, on gagne 3 900 € par mois.", 1, "Leurs revenus : la base de tout calcul d'endettement."]
			], courses:["vente"] },
			{ t:"radio", text:"📻 Flash info : la BCE relève ses taux directeurs d'un demi-point. Ton simulateur passe de 3,6 % à 4,1 %.", courses:["macro"] },
			{ t:"slider", kind:"immo", courses:["immo", "mathfi", "conso"] },
			{ t:"parts", total:6, good:4, q:"Ils ne sont pas mariés : chacun possède selon son apport. Jade met 20 000 €, Sami 10 000 €. <b>Colorie la part de Jade</b> sur le plan, puis envoie au notaire.",
				ok:"C'est ça : 2/3 pour Jade, 1/3 pour Sami, et le notaire l'écrit dans l'acte. Pour se protéger l'un l'autre (PACS, testament), on les envoie le voir : on explique, on ne choisit pas pour eux.",
				courses:["propriete", "matrim"] }
		]
	},
	{
		id:"duhamel", name:"M. Duhamel", who:"68 ans · un héritage à placer", kinds:["senior"], ticket:42,
		hello:"Bonjour ! J'ai un peu d'argent à placer, et je n'y connais rien.",
		steps:[
			{ t:"listen", lines:[
				["Ma sœur m'a laissé 40 000 €.", 1, "40 000 € d'un coup… comme l'alerte B. Je l'épingle, et on vérifie.", "heritage"],
				["J'aimerais aider mes petits-enfants dans deux ou trois ans.", 1, "Un horizon court : pas de placement risqué."],
				["Mon voisin dit qu'il fait 12 % avec ses cryptos.", 0],
				["Je n'ai jamais rien placé en Bourse.", 1, "Pas de connaissance des marchés : ça compte pour son profil MIF 2."],
				["Ma retraite me suffit pour vivre.", 1, "Il n'a pas besoin de cet argent au quotidien."]
			], courses:["vente"] },
			{ t:"pair", title:"Attestation du notaire", pin:"notaire", time:32,
				q:"Il a apporté l'attestation du notaire. <b>Pointe-la</b> : touche une ligne de l'attestation, puis la pièce qui la confirme.",
				left:[
					["Somme versée à M. Duhamel : 40 000 €", "r1"],
					["Signée : Me Claire Lefebvre, notaire à Lille", "r3"],
					["Défunte : Mme Odile Duhamel, sa sœur", "r5"]
				],
				right:[
					["r1", "Son relevé · 03/11 · virement reçu · + 40 000,00 €"],
					["r2", "Son relevé · 03/10 · virement de son livret · + 4 000,00 €", "4 000 €, pas 40 000 € : regarde les zéros."],
					["r3", "Annuaire des notaires · Me Claire Lefebvre · Lille"],
					["r4", "Annuaire des notaires · Me Claire Lefèvre · Lens", "Lefèvre, à Lens : ce n'est pas la même étude."],
					["r5", "Ce qu'il t'a dit : « Ma sœur m'a laissé 40 000 € »"],
					["r6", "Ce qu'il t'a dit : « Mon voisin fait 12 % avec ses cryptos »", "Rien à voir avec l'héritage."]
				],
				ok:"Tout concorde : montant, notaire, défunte. L'origine des 40 000 € est prouvée. C'est ça, connaître l'origine des fonds.",
				courses:["conform"] },
			{ t:"phone" },
			{ t:"budget", target:100, time:20,
				q:"Lucie, 19 ans, sur la messagerie : « Je suis à −400 €, l'appli me propose un crédit renouvelable. Je prends ? » Pas de crédit : <b>trouve dans ses dépenses 100 € par mois</b> à couper, et elle est à zéro en quatre mois.",
				lines:[
					["Loyer de la colocation", 380, 0, "Son loyer : on n'y touche pas."],
					["Livraisons de repas (4 par mois)", 72, 1],
					["Courses", 160, 0, "Il faut bien manger !"],
					["Salle de sport, jamais utilisée", 30, 1],
					["Abonnement de transport", 25, 0, "Elle en a besoin pour aller en cours."],
					["Deuxième plateforme de streaming", 13, 1],
					["Forfait téléphone", 20, 0, "Elle en a besoin, et il est déjà bas."],
					["Troisième plateforme de streaming", 11, 1]
				],
				ok:"Envoyé à Lucie : pas de renouvelable à 20 %, on coupe ce qui ne sert pas, j'active une alerte de solde, et budget lundi en visio. Réponse rapide, sur son canal.",
				courses:["omni", "educfi", "credit"] },
			{ t:"slider", kind:"uc", courses:["marches", "epargne", "patrim"] }
		]
	},
	{
		id:"tom", name:"Tom", who:"Erasmus · Dublin", kinds:["student"], ticket:43, english:true,
		hello:"Hi! I started my account online, I came to finish it. Sorry, my French is not very good…",
		steps:[
			{ t:"listen", lines:[
				["I'm Tom, I come from Dublin.", 0],
				["I'm here for one year, at the university.", 1, "Un an en France : il lui faut un vrai compte, pas une carte de voyage."],
				["My scholarship arrives next week.", 1, "Des virements d'Irlande… comme l'alerte C. Je l'épingle.", "bourse"],
				["I love the waffles here!", 0],
				["I rent a room in Lille.", 1, "Il loue une chambre : regarde bien son justificatif de domicile."]
			], courses:["vente", "anglais"] },
			{ t:"idcheck", pin:"erasmus", time:24,
				q:"Tom pose ses pièces sur le comptoir. <b>Compare-les</b> : touche l'information qui ne colle pas.",
				docs:[
					{ title:"Passeport", rows:[["Nom", "BYRNE"], ["Prénom", "Tom"], ["Né le", "14/03/2005, Dublin"], ["Valable jusqu'au", "02/2031"]] },
					{ title:"Justificatif de domicile · facture d'électricité", rows:[["Titulaire", "Mme Colette Vasseur", 1], ["Adresse", "12 rue Solférino, Lille"], ["Date", "octobre 2026"]] },
					{ title:"Lettre de bourse Erasmus+", rows:[["Bénéficiaire", "Tom Byrne"], ["Versée par", "University College Dublin"], ["Montant", "450 € par mois, octobre à juin"]] }
				],
				wrong:"Ça, c'est cohérent d'une pièce à l'autre. Cherche encore.",
				ok:"Bien vu : la facture n'est pas à son nom. « Oh, it's my landlady! » Il est hébergé : il faut une <b>attestation d'hébergement</b> signée par Mme Vasseur, avec sa pièce d'identité. On ouvre quand même son compte, et j'imprime son RIB pour sa bourse.",
				courses:["kyc", "anglais"] }
		]
	},
	{
		id:"benali", name:"Mme Benali", who:"Dégât des eaux", kinds:["pro"], ticket:44,
		hello:"Bonjour… Mon plafond s'est effondré, je ne sais pas par où commencer.",
		steps:[
			{ t:"listen", lines:[
				["La voisine du dessus a eu une fuite.", 1, "Une fuite venant de chez la voisine : un dégât des eaux, couvert par sa multirisque."],
				["C'est arrivé jeudi soir.", 1, "Jeudi : le délai de déclaration court à partir de là."],
				["Il pleuvait des cordes ce jour-là.", 0],
				["Mon cousin peut refaire le plafond, il n'est pas cher.", 1, "Un artisan : il faudra vérifier sa garantie décennale.", "cousin"],
				["J'ai 1 500 € de côté, pas plus.", 1, "Son épargne : ça compte pour choisir sa franchise."]
			], courses:["vente"] },
			{ t:"calendar", from:12, days:5, time:22,
				q:"Le sinistre date de jeudi 12. Elle a 5 jours ouvrés pour déclarer. <b>Compte-les sur le calendrier</b>, un par un, à partir du lendemain.",
				ok:"Jusqu'au jeudi 19 : on déclare tout de suite, avec ses photos. (Pour un vol, ce serait 2 jours ouvrés.)",
				courses:["sinistre", "principe"] },
			{ t:"slider", kind:"franchise", pin:"benarib", courses:["autohab"] },
			{ t:"doc", title:"Attestation de garantie décennale · Yanis, son cousin", time:16,
				q:"Son cousin a envoyé son attestation d'assurance. <b>Vérifie-la</b> : touche la ligne qui pose problème.",
				lines:[
					["Assuré", "Yanis Ait Ali, plaquiste", 0],
					["Activité garantie", "Plâtrerie, faux plafonds", 0],
					["Garantie", "Responsabilité civile décennale", 0],
					["Période de validité", "du 01/01/2025 au 31/12/2025", 1, "Expirée depuis presque un an ! Sans décennale en cours, aucun recours si le plafond retombe. Qu'il fournisse l'attestation 2026 avant de commencer."],
					["Cachet et signature", "Assureur, le 05/01/2025", 0]
				], courses:["constr"] }
		]
	},
	{
		id:"karim", name:"Karim", who:"Plombier · création d'entreprise", kinds:["casual"], ticket:45,
		hello:"Salut ! Je veux me mettre à mon compte, et j'ai besoin de la banque.",
		steps:[
			{ t:"listen", lines:[
				["Je suis plombier salarié depuis huit ans.", 1, "De l'expérience dans son métier : un vrai atout pour le dossier."],
				["Ma femme est d'accord, elle me soutient.", 0],
				["Il me faut 30 000 € pour la camionnette et l'outillage.", 1, "Le besoin de financement : à mettre au nom de l'entreprise."],
				["Mes clients me paient souvent en liquide.", 1, "Du liquide… Beaucoup d'artisans sont payés ainsi : je l'épingle, sans juger.", "liquide"],
				["J'ai déjà douze clients qui m'attendent.", 1, "Une clientèle avant même de démarrer : le marché existe."]
			], courses:["vente"] },
			{ t:"doc", title:"Prévisionnel · année 1", pin:"previ", time:16,
				q:"Voici son prévisionnel de la première année. <b>Une ligne ne tient pas debout</b> : touche-la.",
				lines:[
					["Chiffre d'affaires", "180 000 €", 1, "180 000 € pour un plombier seul la première année ? Plutôt 60 000 à 80 000 €. Ça fait 110 000 € de trop… À quoi serviraient-ils ?"],
					["Achats de matériel et pièces", "21 000 €", 0],
					["Assurances (RC pro, décennale)", "3 200 €", 0],
					["Remboursement du prêt (30 000 € sur 5 ans)", "6 600 €", 0]
				], courses:["creation", "analyse"] },
			{ t:"stop", pin:"bordereau", text:"Au guichet 2, un homme en blouson dépose 9 500 € en espèces. « Comme chaque mois, pour mon cousin. Je reste sous 10 000, comme ça pas de questions. »", courses:["lcbft"] },
			{ t:"hand", pin:"rib", say:"Tiens, mon RIB, pour verser le prêt. Compte pro, prêt, RC pro et décennale : tu me prépares tout ?",
				nadia:"Il a le bon équipement en tête. Mais ne lui dis rien de nos doutes : prévenir un client d'une déclaration de soupçon, c'est un délit.",
				courses:["pro"] }
		]
	}
];
