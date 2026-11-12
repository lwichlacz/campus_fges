/* Contenus de « La Ruée · Le comité de 18 h » (Licence Économie-Finance, FGES) : un enseignant peut modifier ici
   le dossier, les chiffres et les cours sans toucher au moteur du jeu (ruee.js).
   Programme : fges.fr, Licence Économie-Finance, L1 à L3, BCC 1 à 3 et parcours (relevé le 10/11/2026).
   Fonds Beffroi Équilibre, Banque Lys, Énergie Nord, Banque Rivage, personnes et montants : tout est fictif.

   Le dossier : le fonds a perdu 3,2 % dans la journée. Les chiffres se tiennent entre eux :
     pétrole (11 h 30)  −0,1 %  = bêta pétrole 0,03 × Brent −3 %
     BCE (14 h 15)      −1,0 %  = OAT 45 % × (−8 × 0,25 pt de surprise = −2 %) + actions 40 % × −0,25 %
     Lys (15 h 41)      −0,5 %  = 5 % du fonds × −10 % (vendue sur la rumeur, 11 min avant le démenti)
     krach (16 h 20)    −1,6 %  = actions 40 % × −4 % ; la couverture posée au plus bas fait manquer +2,5 % × 40 % = 1,0 %
     total              −3,2 %  soit −320 000 € sur 10 M€ */

// [année · bloc, intitulé exact du cours sur fges.fr, ce que le joueur vient de pratiquer]
export const COURSES = {
	donnees:  ["L3 · BCC 2", "Analyse de données", "Lire une courbe et mesurer ce qui a pesé : le premier réflexe après une séance difficile."],
	travail:  ["L1-L3 · BCC 2", "Approche du monde du travail", "Un stage chaque année, de 4 à 6 semaines ; en L3, dans le métier qu'on vise. Et un jour, un comité à convaincre."],
	mbf:      ["L1 · BCC 1", "Monnaie Banque Finance", "La BCE fixe le taux auquel les banques se refinancent : c'est le premier levier de la politique monétaire de la zone euro."],
	instit:   ["L1 · BCC 1", "Organisation juridictionnelle et Institutions Européennes", "La BCE est une institution de l'Union européenne, indépendante : ses décisions valent pour les 20 pays de la zone euro."],
	theo:     ["L3 · BCC 1", "Théorie des marchés financiers", "Les prix intègrent déjà ce qui est attendu : seule la surprise fait bouger le marché."],
	finmar:   ["L1 · BCC 1", "Introduction à la finance de marché", "Le prix d'une obligation baisse quand les taux montent : son coupon est fixé d'avance, il devient moins intéressant."],
	calcfi:   ["L2 · BCC 2", "Calculs financiers", "La duration : une obligation de duration 8 perd environ 8 × 0,25 = 2 % quand son taux monte de 0,25 point."],
	croiss:   ["L3 · BCC 1", "Analyse de la croissance économique", "Monter les taux freine l'inflation, mais aussi la croissance : les actions baissent un peu, elles aussi."],
	anglais:  ["L1-L3 · BCC 2", "Anglais", "Dépêches, rapports, comités : la finance parle anglais. TOEIC en L3."],
	stats:    ["L1-L2 · BCC 2", "Statistiques", "Un nuage de points et la droite qui le résume au mieux : celle qui rend les écarts les plus petits possible."],
	econo:    ["L3 · BCC 2", "Économétrie", "La pente de la régression, c'est le bêta : de combien bouge le fonds quand un facteur bouge de 1 %."],
	excelr:   ["L2 · BCC 2", "Excel et R", "Une ligne de R estime les trois bêtas d'un coup : lm(fonds ~ oat + cac + brent)."],
	prog:     ["L3 · BCC 2", "Initiation à la programmation", "Le même script tourne chaque soir sur tous les fonds de la maison : on automatise l'analyse."],
	inter:    ["L2 · BCC 1", "International economics", "Le Brent, prix mondial du pétrole, bouge au gré de l'OPEP+ ; il pèse très différemment selon les portefeuilles."],
	micro:    ["L1-L2 · BCC 1", "Microéconomie", "Plus d'offre pour la même demande : le prix baisse. Le baril obéit lui aussi à l'offre et à la demande."],
	conj:     ["L2 · BCC 1", "Conjoncture macroéconomique", "Pétrole, taux, croissance : un comité commence toujours par la conjoncture du jour."],
	fintech:  ["L3 · BCC 1", "Macroéconomie financière et FinTech", "Réseaux sociaux et applis de trading : une rumeur peut faire plonger une banque en quelques minutes."],
	ict:      ["L3 · Parcours Sciences Politiques", "The Challenges of ICT's : Privacy, Democracy, Truth", "Un compte créé la veille, sans source : vérifier avant d'agir est un réflexe de citoyen autant que de financier."],
	risque:   ["L3 · BCC 1", "Théorie du risque", "Un risque se mesure (le bêta), se compare à ce qu'on accepte de perdre, et se paie quand on veut s'en protéger."],
	portef:   ["L3 · BCC 1", "Gestion de portefeuille, couverture et trading", "Se couvrir, c'est vendre des contrats à terme : utile pendant la chute, coûteux si on l'oublie pendant le rebond."],
	crise:    ["L2 · Parcours Économie Avancée", "Comment résoudre une crise économique ?", "Krachs, paniques, contagion : pourquoi les marchés surréagissent, puis rebondissent."],
	pensee:   ["L1 · BCC 1", "Histoire de la pensée économique", "Keynes, Smith, Friedman, Schumpeter : des idées qui expliquent encore les marchés d'aujourd'hui."],
	maths:    ["L1-L3 · BCC 2", "Mathématiques appliquées à l'économie", "Une règle de trois bien posée : perdre au plus 1 % quand le marché perd 4 %, c'est un bêta de 1 ÷ 4 = 0,25."]
};

// le fonds d'Inès (fictif)
export const FUND = {
	name:"Fonds Beffroi Équilibre", size:10,      // M€ : 1 % du fonds = 100 000 €
	lines:[["OAT 10 ans (obligations d'État)", 45], ["Actions zone euro", 40], ["Banque Lys", 5], ["Énergie Nord", 5], ["Monétaire", 5]]
};

/* La courbe du fonds dans la journée : [heure en minutes depuis minuit, variation depuis 9 h en %].
   Les quatre chutes que le joueur doit mesurer à la règle : [début, fin, chute attendue, nom, heure affichée] */
const hm = (h, m = 0) => h*60 + m;
export const CURVE = {
	from:hm(9), to:hm(17, 30),
	keys:[[hm(9), 0], [hm(10), .05], [hm(11), .02], [hm(11, 30), 0], [hm(11, 45), -.1], [hm(12, 30), -.08], [hm(13, 30), -.1], [hm(14, 15), -.1], [hm(14, 30), -1.1],
		[hm(15), -1.08], [hm(15, 30), -1.1], [hm(15, 41), -1.6], [hm(16, 20), -1.6], [hm(16, 50), -3.2], [hm(17, 30), -3.2]],
	falls:[
		{ id:"petrole", a:hm(11, 30), b:hm(11, 45), d:-.1, name:"Pétrole", at:"11 h 30", minor:true },
		{ id:"bce", a:hm(14, 15), b:hm(14, 30), d:-1, name:"BCE", at:"14 h 15" },
		{ id:"lys", a:hm(15, 30), b:hm(15, 41), d:-.5, name:"Banque Lys", at:"15 h 30" },
		{ id:"krach", a:hm(16, 20), b:hm(16, 50), d:-1.6, name:"Krach", at:"16 h 20" }
	]
};
// le fil d'actualités de la journée (écran de droite)
export const NEWS = [
	["11 h 30", "Brent −3 % : désaccord à l'OPEP+, la production va augmenter"],
	["14 h 15", "ECB raises rates by 50 bp, consensus was 25 bp"],
	["15 h 30", "Rumeur sur les réseaux : « la Banque Lys au bord de la faillite »"],
	["15 h 52", "Démenti officiel de la Banque Lys"],
	["16 h 20", "Krach éclair : le CAC 40 perd 4 % en 30 minutes"],
	["17 h 30", "Clôture : le CAC 40 finit à −1,5 %"]
];

/* L'enquête BCE : le joueur calcule trois cellules sur la calculatrice ; la ligne actions est déjà remplie */
export const BCE = {
	news:"ECB raises rates by 50 bp, consensus was 25 bp",
	fr:"La BCE monte ses taux de 0,50 point ; les économistes attendaient 0,25 point.",
	expected:.25, announced:.5, duration:8,
	cells:[
		{ id:"surprise", label:"Surprise = annoncé − attendu (en point)", hint:"0,50 − 0,25", want:.25, unit:" pt" },
		{ id:"oatvar", label:"Variation de l'OAT = − duration × surprise (en %)", hint:"− 8 × 0,25", want:-2, unit:" %" },
		{ id:"oatc", label:"Perte due à l'OAT = poids × variation (en % du fonds)", hint:"0,45 × −2", want:-.9, unit:" %" }
	],
	equity:{ w:40, v:-.25, c:-.1 },
	courses:["mbf", "instit", "theo", "finmar", "calcfi", "croiss", "anglais"]
};

/* La régression : 60 séances, le rendement du fonds face à trois facteurs (données inventées, réalistes) */
export const REG = {
	n:60, seed:11,
	code:"lm(fonds ~ oat + cac + brent)",
	factors:[
		{ id:"oat", name:"OAT 10 ans", beta:.45, sx:.6, noise:.18 },
		{ id:"cac", name:"CAC 40", beta:.5, sx:1.1, noise:.18 },
		{ id:"brent", name:"Brent", beta:.03, sx:1.8, noise:.2 }
	],
	courses:["stats", "econo", "excelr", "prog"]
};

/* Le carnet d'ordres de la journée : [heure, sens, titre, montant, détail] */
export const ORDERS = [
	["09 h 12", "ACHAT", "OAT 2035", "1 000 000 €", ""],
	["09 h 48", "VENTE", "Énergie Nord", "120 000 €", ""],
	["10 h 31", "ACHAT", "Fonds monétaire", "200 000 €", ""],
	["11 h 52", "ACHAT", "Banque Rivage", "80 000 €", ""],
	["13 h 40", "VENTE", "OAT 2030", "300 000 €", ""],
	["14 h 22", "ACHAT", "Panier actions zone euro", "150 000 €", ""],
	["15 h 41", "VENTE", "Banque Lys", "450 000 €", "20 000 titres à 22,50 €"],
	["16 h 50", "VENTE", "Contrats à terme CAC 40", "4 000 000 €", "couverture : 100 % des actions"],
	["17 h 02", "ACHAT", "OAT 2032", "250 000 €", ""]
];

/* La Banque Lys : la rumeur, le démenti, le cours ; le joueur pose le curseur à l'heure du ticket */
export const LYS = {
	ticket:6, sale:hm(15, 41), denial:hm(15, 52), rumour:hm(15, 30), open:25, price:22.5, w:5,
	author:"@InfoMarchés_Flash", post:"🚨 EXCLUSIF : la Banque Lys au bord de la faillite, les retraits sont bloqués !!",
	source:"Compte créé hier · 14 abonnés · aucune source",
	denialText:"Communiqué officiel de la Banque Lys : « Aucune difficulté, les retraits fonctionnent normalement. »",
	from:hm(15), to:hm(17, 30),
	keys:[[hm(15), 25], [hm(15, 30), 25], [hm(15, 41), 22.5], [hm(15, 52), 22.3], [hm(16, 5), 24.6], [hm(17, 30), 24.8]],
	cell:{ id:"lysc", label:"Perte due à Lys = poids × variation (en % du fonds)", hint:"0,05 × −10", want:-.5, unit:" %" },
	courses:["fintech", "ict"]
};

/* Le krach : le CAC 40 depuis 16 h (variation en %), la couverture retrouvée dans le carnet */
export const KRACH = {
	ticket:7, pose:hm(16, 50), from:hm(16), to:hm(17, 30),
	keys:[[hm(16), 0], [hm(16, 20), 0], [hm(16, 50), -4], [hm(17, 5), -2.6], [hm(17, 30), -1.5]],
	// les deux mesures attendues à la règle : la chute avant la couverture, le rebond pendant
	spans:[{ id:"chute", a:hm(16, 20), b:hm(16, 50), d:-4, name:"chute avant la couverture" }, { id:"rebond", a:hm(16, 50), b:hm(17, 30), d:2.5, name:"rebond manqué" }],
	cell:{ id:"krachc", label:"Rebond manqué = poids des actions × rebond (en % du fonds)", hint:"0,40 × 2,5", want:1, unit:" %" },
	keynes:"« Les marchés peuvent rester irrationnels plus longtemps que vous ne pouvez rester solvable. » (attribué à Keynes)",
	courses:["risque", "portef", "crise", "pensee"]
};

/* Les pièces du dossier, posées sur la table du comité : [identifiant du chiffre, ce qui est écrit] */
export const PIECES = {
	courbe:{ title:"La courbe du jour", sub:"Mesures à la règle", zones:[["petrole", "11 h 30 · pétrole · −0,1 %"], ["bce", "14 h 15 · BCE · −1,0 %"], ["lys", "15 h 30 · Banque Lys · −0,5 %"], ["krach", "16 h 20 · krach · −1,6 %"], ["total", "Total de la journée · −3,2 %"]] },
	bce:{ title:"Attribution BCE", sub:"Tableur, calculs vérifiés", zones:[["surprise", "Surprise : +0,25 point"], ["oatvar", "OAT 10 ans : −2,0 %"], ["total", "Perte : −1,0 % du fonds"]] },
	reg:{ title:"Régression · 60 séances", sub:"lm(fonds ~ oat + cac + brent)", zones:[["oat", "Bêta OAT : 0,45"], ["cac", "Bêta CAC 40 : 0,50"], ["brent", "Bêta Brent : 0,03"]] },
	lys:{ title:"Ticket d'ordre · Banque Lys", sub:"Carnet d'ordres et cours du titre", zones:[["heure", "Vendu à 15 h 41 · démenti à 15 h 52"], ["prix", "Cours : 22,50 € (−10 %)"], ["perte", "Perte : −0,5 % du fonds"]] },
	krach:{ title:"Couverture du krach", sub:"Carnet d'ordres et CAC 40", zones:[["pose", "Posée à 16 h 50 · jamais levée"], ["chute", "Chute subie : −4 %"], ["rebond", "Rebond manqué : −1,0 % du fonds"]] }
};

/* Le comité : trois membres, cinq questions. Pour chaque question, les pièces et les chiffres qui y répondent.
   who : 0 = directeur de la gestion, 1 = conformité, 2 = risques */
export const BOARD = [
	{ name:"Bertrand Delcourt", role:"directeur de la gestion" },
	{ name:"Karim Benali", role:"conformité" },
	{ name:"Claire Delattre", role:"risques" }
];
export const QUESTIONS = [
	{ who:0, q:"Tout le monde savait que la BCE allait monter ses taux. Alors pourquoi nos obligations ont-elles décroché à 14 h 15 ?",
		ok:[["bce", "surprise"]], ans:"La BCE a monté de 0,50 point au lieu des 0,25 attendus : une surprise de 0,25 point. Avec une duration de 8, l'OAT perd 2 %, soit 0,9 % du fonds, et 1,0 % avec les actions.",
		courses:["theo"] },
	{ who:1, q:"La vente de la Banque Lys : on avait une information, ou on a paniqué ?",
		ok:[["lys", "heure"]], ans:"Le ticket est horodaté 15 h 41, onze minutes avant le démenti de 15 h 52, et la seule nouvelle était un compte anonyme créé la veille : on a vendu sur une rumeur. Coût : 0,5 % du fonds.",
		courses:["fintech"] },
	{ who:2, q:"Le krach, maintenant. On était couverts, non ? Pourquoi a-t-on perdu autant ?",
		ok:[["krach", "rebond"], ["krach", "pose"]], ans:"La couverture a été posée à 16 h 50, au plus bas, et jamais levée : on a pris toute la chute de 4 %, puis manqué le rebond de 2,5 %. Ce mauvais timing coûte 1,0 % du fonds.",
		courses:["portef"] },
	{ who:2, q:"Et le pétrole qui a perdu 3 % ce matin ? On dit que c'est lui qui nous a coulés.",
		ok:[["reg", "brent"], ["courbe", "petrole"]], ans:"Non : notre bêta au pétrole n'est que de 0,03. Trois pour cent de baisse du Brent, c'est 0,1 % pour le fonds : la plus petite des quatre chutes.",
		courses:["inter", "micro"] },
	{ who:0, q:"Bien. Ta recommandation ? Je ne veux plus qu'une chute de 4 % des actions nous coûte plus de 1 %.",
		ok:[["reg", "cac"]], calc:{ id:"reco", label:"À couvrir = (bêta actuel − bêta visé) × 10 M€, avec bêta visé = 1 ÷ 4", hint:"(0,5 − 1 ÷ 4) × 10", want:2.5, unit:" M€", alt:[2500, 2500000] },
		ans:"Notre bêta actions est de 0,50. Pour ne pas perdre plus de 1 % quand le marché perd 4 %, il faut un bêta de 0,25 : je propose de vendre 2,5 M€ de contrats à terme, avec une règle de levée écrite d'avance.",
		courses:["risque", "maths", "conj", "donnees", "travail"] }
];

export const fr = (n, d = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/ | /g, " ");
export const pct = (n, d = 1) => (n > 0 ? "+" : n < 0 ? "−" : "") + fr(Math.abs(n), d) + " %";
export const hhmm = m => `${Math.floor(m/60)} h ${String(Math.floor(m % 60)).padStart(2, "0")}`;
// valeur d'une courbe à clés [[t, v], …] au temps t
export const at = (keys, t) => { for(let i = 1; i < keys.length; i++) if(t <= keys[i][0]){ const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0)*(t - t0)/(t1 - t0); } return keys[keys.length - 1][1]; };
