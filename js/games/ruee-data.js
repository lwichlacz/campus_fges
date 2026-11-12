/* Contenus de « La Ruée » (Licence Économie-Finance, FGES) : un enseignant peut modifier ici les nouvelles,
   les chiffres et les cours sans toucher au moteur du jeu (ruee.js).
   Programme : fges.fr, Licence Économie-Finance, L1 à L3, BCC 1 à 3 et parcours (relevé le 10/11/2026).
   Banque Lys, start-up, personnes et montants fictifs. */

// [année · bloc, intitulé exact du cours sur fges.fr, ce que le joueur vient de pratiquer]
export const COURSES = {
	mbf:      ["L1 · BCC 1", "Monnaie Banque Finance", "La BCE fixe le taux auquel les banques se refinancent : c'est le premier levier de la politique monétaire de la zone euro."],
	instit:   ["L1 · BCC 1", "Organisation juridictionnelle et Institutions Européennes", "La BCE est une institution de l'Union européenne, indépendante : ses décisions valent pour les 20 pays de la zone euro."],
	theo:     ["L3 · BCC 1", "Théorie des marchés financiers", "Les prix intègrent déjà ce qui est attendu : seule la surprise fait bouger le marché."],
	finmar:   ["L1 · BCC 1", "Introduction à la finance de marché", "Le prix d'une obligation monte quand les taux baissent, et baisse quand ils montent : son coupon est fixé d'avance."],
	monnaie:  ["L2 · BCC 1", "La monnaie", "Des taux moins hauts que prévu rendent l'euro moins rémunérateur : il baisse face au dollar."],
	inter:    ["L2 · BCC 1", "International economics", "Un pétrole plus cher, c'est une facture plus lourde pour les pays importateurs comme la France, et des secteurs entiers qui souffrent."],
	micro:    ["L1-L2 · BCC 1", "Microéconomie", "Moins d'offre pour la même demande : le prix monte. Le baril obéit lui aussi à l'offre et à la demande."],
	conj:     ["L2 · BCC 1", "Conjoncture macroéconomique", "Pétrole plus cher, inflation qui repart : les marchés anticipent des taux plus hauts, et les obligations baissent."],
	anglais:  ["L1-L3 · BCC 2", "Anglais", "Dépêches, rapports, salles de marchés : la finance parle anglais. TOEIC en L3."],
	compnat:  ["L1 · BCC 1", "Comptabilité nationale", "Le PIB mesure la richesse produite dans un pays en un an ; sa croissance est le chiffre que tout le monde guette."],
	croiss:   ["L3 · BCC 1", "Analyse de la croissance économique", "Quand la croissance ralentit, le chômage monte : c'est la loi d'Okun, vérifiée pays après pays."],
	stats:    ["L1-L2 · BCC 2", "Statistiques", "Un nuage de points, et la droite qui le résume au mieux : c'est la régression linéaire."],
	econo:    ["L3 · BCC 2", "Économétrie", "Le coefficient mesure le lien : un point de croissance en plus va avec environ 0,4 point de chômage en moins. Un lien, pas une preuve de cause."],
	excelr:   ["L2 · BCC 2", "Excel et R", "Une ligne de R suffit à estimer le modèle : lm(chomage ~ croissance)."],
	prog:     ["L3 · BCC 2", "Initiation à la programmation", "Le même script tourne sur 30 pays ou sur 3 000 actions : on automatise l'analyse."],
	fintech:  ["L3 · BCC 1", "Macroéconomie financière et FinTech", "Réseaux sociaux et applis de trading : une rumeur peut faire plonger une banque en quelques minutes."],
	ict:      ["L3 · Parcours Sciences Politiques", "The Challenges of ICT's : Privacy, Democracy, Truth", "Comptes créés la veille, photos sorties de leur contexte : vérifier la source est un réflexe de citoyen autant que de financier."],
	risque:   ["L3 · BCC 1", "Théorie du risque", "Un risque se mesure, se compare à ce qu'on peut perdre, et se paie quand on veut s'en protéger."],
	portef:   ["L3 · BCC 1", "Gestion de portefeuille, couverture et trading", "Se couvrir coûte une prime, comme une assurance : on la paie pendant la chute, on la lâche quand le marché se reprend."],
	crise:    ["L2 · Parcours Économie Avancée", "Comment résoudre une crise économique ?", "Krachs, paniques, contagion : pourquoi les marchés surréagissent, et ce que font banques centrales et États."],
	pensee:   ["L1 · BCC 1", "Histoire de la pensée économique", "Keynes, Smith, Friedman, Schumpeter : des idées qui expliquent encore les marchés d'aujourd'hui."],
	invest:   ["L3 · BCC 2", "Investment Appraisal", "La valeur actuelle nette (VAN) : on ramène chaque flux futur à aujourd'hui et on retire la mise. Négative, le projet détruit de la valeur, même s'il « rapporte » sur le papier."],
	calcfi:   ["L2 · BCC 2", "Calculs financiers", "Actualiser : à 12 % par an, 100 € reçus dans 5 ans ne valent que 57 € aujourd'hui."],
	maths:    ["L1-L3 · BCC 2", "Mathématiques appliquées à l'économie", "(1 + taux) puissance n : toute l'actualisation tient dans cette formule."],
	fisc:     ["L3 · BCC 2", "Fiscalité d'Entreprise", "Les flux d'un projet s'évaluent après impôt sur les sociétés (25 %)."],
	anafi:    ["L3 · BCC 2", "Analyse financière", "Confronter les prévisions d'une entreprise à la réalité de son marché, avant d'y mettre un euro."],
	createur: ["L1-L3 · Parcours Étudiant Créateur", "Ateliers création d'entreprise", "Du projet au concours FGES Start-up à impact positif, avec le HubHouse et le réseau Pépite."],
	donnees:  ["L3 · BCC 2", "Analyse de données", "Lire un tableau de bord et trouver ce qui a pesé le plus : le premier réflexe après une séance."],
	travail:  ["L1-L3 · BCC 2", "Approche du monde du travail", "Un stage chaque année, de 4 à 6 semaines ; en L3, dans le métier qu'on vise."]
};

// les lignes de l'écran « Marchés » : nom, prix de départ, décimales, unité
export const ASSETS = {
	cac:   { name:"Actions · CAC 40",            p:7850,   dec:0, unit:" pts" },
	oat:   { name:"Obligation d'État · OAT 10 ans", p:98.40, dec:2, unit:" €" },
	eur:   { name:"Euro / dollar",               p:1.0850, dec:4, unit:" $" },
	brent: { name:"Pétrole · Brent",             p:82.40,  dec:2, unit:" $" },
	air:   { name:"Compagnies aériennes",        p:412,    dec:0, unit:" pts" },
	lys:   { name:"Banque Lys (fictive)",        p:24.60,  dec:2, unit:" €" }
};

export const STAKE = 2500;      // € gagnés ou perdus par ligne bien ou mal jouée

/* Les flashs : glisser chaque ligne vers le haut (ça monte) ou vers le bas (ça baisse).
   rows : [actif, sens attendu +1 / -1, variation réelle affichée ensuite, explication] */
export const FLASHES = [
	{ id:"bce", clock:"14 h 15", time:11,
		pre:"Le marché attend une hausse de 0,50 pt des taux de la BCE.",
		news:"DÉCISION BCE : +0,25 pt seulement",
		sub:"Moitié moins que ce qu'attendait le marché.",
		rows:[
			["cac", +1, .012, "Une hausse plus petite que prévu, c'est un crédit moins cher que prévu pour les entreprises : les actions montent."],
			["oat", +1, .006, "Les taux montent moins que prévu : les obligations déjà émises, avec leur coupon, valent plus."],
			["eur", -1, -.008, "L'euro rapporte moins que ce qu'on espérait : il baisse face au dollar."]
		],
		trap:"Le piège : « hausse des taux = tout baisse ». Mais le marché attendait +0,50 pt : ce qui compte, c'est la surprise.",
		courses:["mbf", "instit", "theo", "finmar", "monnaie"] },
	{ id:"opep", clock:"15 h 02", time:12, english:true,
		pre:"Dépêche en anglais, en direct.",
		news:"OPEC+ agrees surprise cut of 1 million barrels a day",
		sub:"L'OPEP+ réduit par surprise sa production d'un million de barils par jour.",
		rows:[
			["brent", +1, .06, "Moins d'offre pour la même demande : le baril grimpe."],
			["air", -1, -.04, "Le carburant, c'est un tiers des coûts d'une compagnie aérienne : leurs actions chutent."],
			["oat", -1, -.005, "Pétrole plus cher, inflation qui repart, taux attendus plus hauts : les obligations baissent."]
		],
		trap:"Un même choc, trois effets en chaîne : prix, entreprises, inflation.",
		courses:["inter", "micro", "conj", "anglais"] }
];

/* La régression : la croissance du PIB et la variation du chômage dans 30 pays (données inventées, réalistes) */
export const REG = {
	clock:"15 h 40", time:13, slope:-.41, n:30, seed:7,
	code:["pays <- read.csv(\"ocde_2026.csv\")", "modele <- lm(chomage ~ croissance, data = pays)", "summary(modele)"],
	courses:["compnat", "croiss", "stats", "econo", "excelr", "prog"]
};

/* La rumeur : un post sur la Banque Lys ; maintenir le téléphone pour voir la source */
export const RUMOUR = {
	clock:"16 h 10", time:13, drop:-.09, back:.085,
	author:"@InfoMarchés_Flash", post:"🚨 EXCLUSIF : la Banque Lys au bord de la faillite, les retraits sont bloqués !!",
	source:["Compte créé hier", "14 abonnés", "Aucune source citée", "Photo prise à Madrid en 2012"],
	denial:"Communiqué officiel de la Banque Lys : « Aucune difficulté, les retraits fonctionnent normalement. »",
	courses:["fintech", "ict"]
};

/* Le krach : maintenir le doigt sur l'écran pour être couvert (prime par seconde) */
export const KRACH = {
	clock:"16 h 45", time:13, expo:100000, premium:250, cover:.9,
	// courbe de l'indice : [temps en s, variation depuis le début]
	path:[[0, 0], [1.5, -.004], [6.5, -.08], [7.6, -.081], [13, -.02]],
	keynes:"« Les marchés peuvent rester irrationnels plus longtemps que vous ne pouvez rester solvable. » (attribué à Keynes)",
	courses:["risque", "portef", "crise", "pensee"]
};

/* La start-up : glisser sur les années pour actualiser, puis décider */
export const STARTUP = {
	clock:"17 h 05", time:24, rf:4, prime:8, flows:[-300, 40, 60, 80, 100, 120],     // k€, après impôt
	name:"Maxime", pitch:"300 000 € aujourd'hui, et on vous rend 400 000 € en cinq ans. Ça fait 100 000 € de gagnés !",
	courses:["invest", "calcfi", "maths", "fisc", "anafi", "createur"]
};
export const van = (flows, r) => flows.reduce((a, f, i) => a + f/Math.pow(1 + r, i), 0);

export const CLOSE = { clock:"17 h 30", time:12, courses:["donnees", "travail"] };

export const euro = n => (n < 0 ? "−" : n > 0 ? "+" : "") + Math.abs(Math.round(n)).toLocaleString("fr-FR").replace(/ | /g, " ") + " €";
