/* Contenus du « Guichet du samedi » (Licence Pro Assurance-Banque-Finance, FGES) : un enseignant peut modifier
   ici les répliques, les chiffres et les cours sans toucher au moteur du jeu (guichet.js).
   Programme : fges.fr, Licence professionnelle Assurance Banque Finance, BCC 1 à 6 (relevé le 10/11/2026).
   Personnes, agence et montants fictifs.

   Types d'étapes :
     listen : le client parle, ses phrases défilent ; toucher celles qui comptent (sig:1) avant qu'elles s'effacent.
     choice : une réplique à choisir sous chrono. res : ok / mid / ko ; conf:1 = manquement de conformité ; pnb = € pour l'agence.
     doc    : un document à lire ; toucher la ligne fausse.
     slider : le simulateur de l'écran ; on règle une valeur, les chiffres bougent en direct, puis on propose.
     radio  : une annonce qui change la suite (pas de geste).
     phone  : le téléphone vibre ; le toucher vite, puis répondre (étape choice qui suit).
     stop   : une alerte au guichet voisin ; maintenir « Stop » à temps. */

export const COURSES = {
	vente:    ["BCC 4", "Séminaire Entretien Vente", "Découvrir, reformuler, traiter l'objection, conclure : un entretien a une structure. Et ce que le client dit en passant compte souvent plus que sa demande."],
	immo:     ["BCC 5", "Crédit immobilier", "Mensualités au plus à 35 % des revenus, assurance emprunteur comprise, sur 25 ans au plus : c'est la règle du HCSF."],
	mathfi:   ["BCC 5", "Mathématiques financières", "La mensualité dépend du capital, du taux et de la durée. Allonger la durée baisse la mensualité mais fait grimper le coût total des intérêts."],
	macro:    ["BCC 1", "Introduction à la macroéconomie", "Quand la BCE relève ses taux directeurs, le crédit coûte plus cher pour tout le monde : les banques répercutent la hausse sur leurs offres."],
	conso:    ["BCC 2", "Protection du consommateur", "Offre de prêt immobilier : 10 jours de réflexion avant de pouvoir l'accepter. Crédit à la consommation : 14 jours de rétractation."],
	propriete:["BCC 2", "Droit de la propriété", "Acheter à deux sans être mariés, c'est l'indivision : chacun possède à proportion de son apport, et le notaire l'écrit dans l'acte."],
	matrim:   ["BCC 2", "Régimes matrimoniaux et fiscalité du patrimoine familial", "Mariage, PACS ou concubinage ne protègent pas pareil le survivant. Le conseiller explique ; il ne choisit pas à la place du couple."],
	conform:  ["BCC 1", "Conformité", "Avant tout placement : le profil du client (objectifs, connaissances, capacité à perdre), c'est la directive MIF 2. Et la lutte contre le blanchiment impose de connaître l'origine des fonds."],
	marches:  ["BCC 1", "Systèmes financiers et placement sur les marchés des capitaux", "Fonds en euros : capital garanti, rendement modeste. Unités de compte : plus de rendement espéré, mais on peut perdre. L'horizon décide."],
	epargne:  ["BCC 3", "Produits d'épargne, assurance vie, épargne retraite", "L'assurance-vie sert à tout : épargner, transmettre, compléter sa retraite. Après 8 ans, sa fiscalité devient avantageuse."],
	patrim:   ["BCC 6 · Bancassurance", "Approche patrimoniale · Fiscalité du revenu", "Un conseil patrimonial regarde toute la situation : revenus, impôts, famille, projets. Puis seulement les produits."],
	omni:     ["BCC 4", "Technique de vente omni-canal", "Agence, téléphone, appli, messagerie : le client choisit son canal, et il attend la même qualité de réponse partout."],
	educfi:   ["BCC 4", "Éducation financière et entraînement à la banque en ligne", "Aider un client à tenir son budget (alertes de solde, épargne automatique) vaut mieux qu'un crédit renouvelable qui creuse le trou."],
	credit:   ["BCC 3", "Crédits aux particuliers", "Crédit affecté, prêt personnel, renouvelable : chacun a son usage. Le renouvelable ne doit jamais financer un découvert qui dure."],
	anglais:  ["BCC 5", "Anglais bancaire et financier", "Account, statement, wire transfer, overdraft… En agence comme au téléphone, un chargé de clientèle reçoit aussi des clients étrangers."],
	sinistre: ["BCC 1", "Gestion de risques financiers et gestion des sinistres", "Un sinistre se déclare sous 5 jours ouvrés (2 pour un vol), avec photos et factures. L'assureur indemnise, moins la franchise."],
	autohab:  ["BCC 3", "Assurances automobiles et habitation", "La multirisque habitation couvre le dégât des eaux. Choisir sa franchise, c'est arbitrer entre la prime payée chaque année et ce qui reste à payer en cas de sinistre."],
	principe: ["BCC 6 · Bancassurance", "Principe de l'assurance", "Mutualisation : les primes de milliers d'assurés paient les sinistres de quelques-uns. C'est tout le principe de l'assurance."],
	constr:   ["BCC 3", "Assurance construction", "Tout artisan du bâtiment doit avoir une garantie décennale. Avant les travaux, on demande l'attestation."],
	creation: ["BCC 6 · Banque +", "Accompagnement à la création d'entreprise", "Un créateur arrive avec un prévisionnel. Le banquier le lit, le questionne, et vérifie qu'il tient debout."],
	analyse:  ["BCC 6 · Banque +", "Analyse financière", "Chiffre d'affaires, charges, résultat : on compare aux chiffres habituels du métier. Un plombier seul ne facture pas 180 000 € la première année."],
	pro:      ["BCC 6", "Marché du professionnel · Produits du professionnel", "Un pro a besoin d'un compte pro, d'un financement au nom de l'entreprise et d'assurances obligatoires : RC pro, décennale."],
	lcbft:    ["BCC 1", "Conformité · lutte contre le blanchiment", "Des espèces fractionnées pour rester sous 10 000 € : signal d'alerte. On demande l'origine des fonds ; sans justificatif, déclaration de soupçon à Tracfin, sans prévenir le client."],
	stats:    ["BCC 5", "Informatique et statistiques appliquées", "Les tableaux de bord de l'agence (satisfaction, taux de transformation) se lisent chaque semaine pour savoir où progresser."],
	relation: ["BCC 6 · Bancassurance", "Gestion de la relation client", "La file d'attente compte aussi : un client qui attend trop repart, et il le dit autour de lui."]
};

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
				["Il coûte 195 000 €, frais de notaire compris.", 0],
				["Moi, mon contrat à l'hôpital se termine en juin.", 1, "Un CDD qui finit : la banque regardera la stabilité des revenus."],
				["On adore le quartier, il y a un marché le dimanche.", 0],
				["On n'est pas mariés, on achète à deux.", 1, "Pas mariés : il faudra organiser la propriété et la protection de chacun."],
				["Ensemble, on gagne 3 900 € par mois.", 1, "Leurs revenus : la base de tout calcul d'endettement."]
			], courses:["vente"] },
			{ t:"radio", text:"📻 Flash info : la BCE relève ses taux directeurs d'un demi-point. Ton simulateur passe de 3,6 % à 4,1 %.", courses:["macro"] },
			{ t:"slider", kind:"immo", courses:["immo", "mathfi"] },
			{ t:"choice", q:"Et si on change d'avis après avoir signé ?", opts:[
				["Vous aurez 10 jours de réflexion sur l'offre de prêt, et 10 jours de rétractation après le compromis.", "ok", "Exact : la loi protège l'emprunteur, et le dire rassure."],
				["Une fois signé, c'est trop tard : il faut être sûrs de vous.", "ko", "Faux : il y a 10 jours de réflexion sur l'offre et 10 jours de rétractation après le compromis."],
				["Aucun souci, on peut tout annuler à tout moment, sans frais.", "ko", "Faux, et c'est une promesse qu'on ne peut pas tenir : un manquement au devoir de conseil.", { conf:1 }]
			], courses:["conso"] },
			{ t:"choice", q:"On n'est pas mariés… on met l'appartement à quel nom ?", opts:[
				["Aux deux, en indivision selon vos apports. Et parlez au notaire de la protection de chacun : PACS, testament.", "ok", "C'est ça : l'indivision, et un conseil sans rien vendre."],
				["Mettez tout au nom de Sami, c'est plus simple pour le dossier.", "ko", "Jade paierait sans rien posséder : si le couple se sépare, elle perd tout."],
				["Mariez-vous d'abord, sinon on ne pourra pas vous prêter.", "ko", "Faux : on prête à des concubins. Le conseiller ne choisit pas la vie du couple."]
			], courses:["propriete", "matrim"] }
		]
	},
	{
		id:"duhamel", name:"M. Duhamel", who:"68 ans · un héritage à placer", kinds:["senior"], ticket:42,
		hello:"Bonjour ! J'ai un peu d'argent à placer, et je n'y connais rien.",
		steps:[
			{ t:"listen", lines:[
				["Ma sœur m'a laissé 40 000 €.", 0],
				["J'aimerais aider mes petits-enfants dans deux ou trois ans.", 1, "Un horizon court : pas de placement risqué."],
				["Mon voisin dit qu'il fait 12 % avec ses cryptos.", 0],
				["Je n'ai jamais rien placé en Bourse.", 1, "Pas de connaissance des marchés : ça compte pour son profil."],
				["Ma retraite me suffit pour vivre.", 1, "Il n'a pas besoin de cet argent au quotidien."]
			], courses:["vente"] },
			{ t:"choice", q:"Alors, vous me mettez sur quoi ?", opts:[
				["D'abord, quelques questions ensemble : vos objectifs, ce que vous connaissez, ce que vous pouvez perdre.", "ok", "Oui : le profil d'abord, c'est la directive MIF 2."],
				["Sur notre fonds le plus rentable de l'année, bien sûr.", "ko", "Sans profil, c'est interdit : MIF 2 impose de connaître le client avant de conseiller.", { conf:1 }],
				["Comme votre voisin : une petite part en cryptos, c'est l'avenir.", "ko", "Un produit très risqué pour un client prudent : manquement grave.", { conf:1 }]
			], courses:["conform"] },
			{ t:"phone" },
			{ t:"choice", who:"lucie", q:"Coucou ! C'est Lucie 👋 Je suis à −400 €, l'appli me propose un crédit renouvelable. Je prends ?", time:10, opts:[
				["Non, pas pour un découvert. Je t'active les alertes de solde et on fait ton budget lundi, en visio ?", "ok", "Bien : réponse rapide, sur son canal, et de l'éducation financière plutôt qu'un crédit."],
				["Oui, c'est fait pour ça, c'est accepté en deux clics.", "ko", "Un renouvelable pour un découvert qui dure : le trou se creuse, à 20 % d'intérêts."],
				["Je ne peux pas répondre ici, appelle le service client.", "mid", "Elle t'a écrit à toi : la renvoyer ailleurs, c'est perdre sa confiance."]
			], courses:["omni", "educfi", "credit"] },
			{ t:"slider", kind:"uc", courses:["marches", "epargne"] },
			{ t:"choice", q:"Un mois plus tard, il rappelle : « Les marchés s'effondrent à la radio ! Je vends tout ? »", time:9, opts:[
				["Votre fonds en euros est garanti. On ne vend pas au plus bas : on regarde votre horizon ensemble.", "ok", "Bien : rassurer avec des faits, sans rien promettre."],
				["Oui, vendez tout tout de suite, avant que ça baisse encore.", "ko", "Vendre au plus bas, c'est transformer une baisse en perte définitive."],
				["Ne vous inquiétez pas, ça remonte toujours.", "mid", "Personne ne peut le promettre : une promesse de rendement n'est pas conforme.", { conf:1 }]
			], courses:["patrim"] }
		]
	},
	{
		id:"tom", name:"Tom", who:"Erasmus · Dublin", kinds:["student"], ticket:43, english:true,
		hello:"Hi! Sorry, my French is not very good…",
		steps:[
			{ t:"listen", lines:[
				["I'm Tom, I come from Dublin.", 0],
				["I'm here for one year, at the university.", 1, "Un an en France : il lui faut un vrai compte, pas une carte de voyage."],
				["My scholarship arrives next week.", 1, "Il attend un virement : il lui faut un RIB."],
				["I love the waffles here!", 0],
				["I don't have a French address yet.", 1, "Pas encore de justificatif de domicile : on lui dit lequel apporter."]
			], courses:["vente"] },
			{ t:"choice", q:"What do I need to open an account?", opts:[
				["Your passport, your student card, and a proof of address in Lille, like your housing contract.", "ok", "Perfect: les bons justificatifs, en anglais simple."],
				["Just your phone number, that's enough.", "ko", "Non : on doit vérifier l'identité et l'adresse de tout nouveau client.", { conf:1 }],
				["You need a French salary first, sorry.", "ko", "Faux : un étudiant étranger a le droit d'ouvrir un compte."]
			], courses:["anglais"] },
			{ t:"choice", q:"And how do I receive my scholarship?", opts:[
				["I'll print your RIB: your account details. Give it to your university.", "ok", "Oui : le RIB, c'est ce qu'il faut pour recevoir un virement."],
				["Give me your card PIN code and I'll do it for you.", "ko", "Jamais ! Aucun banquier ne demande un code secret : c'est le b.a.-ba de la sécurité.", { conf:1 }],
				["And I add a life insurance contract, it's a great deal!", "mid", "Une assurance-vie pour un étudiant qui reste un an ? C'est de la survente.", { sell:1, pnb:120 }]
			], courses:["anglais"] }
		]
	},
	{
		id:"benali", name:"Mme Benali", who:"Dégât des eaux", kinds:["pro"], ticket:44,
		hello:"Bonjour… Mon plafond s'est effondré, je ne sais pas par où commencer.",
		steps:[
			{ t:"listen", lines:[
				["La voisine du dessus a eu une fuite.", 1, "Une fuite venant de chez la voisine : un dégât des eaux, couvert par sa multirisque."],
				["C'est arrivé il y a trois jours.", 1, "Trois jours : elle est encore dans le délai de 5 jours ouvrés."],
				["Il pleuvait des cordes ce jour-là.", 0],
				["Mon cousin peut refaire le plafond, il n'est pas cher.", 1, "Un artisan : il faudra vérifier sa garantie décennale."],
				["J'ai 1 500 € de côté, pas plus.", 1, "Son épargne : ça compte pour choisir sa franchise."]
			], courses:["vente"] },
			{ t:"choice", q:"Est-ce que je peux encore déclarer ?", opts:[
				["Oui, vous avez 5 jours ouvrés. On déclare maintenant, avec vos photos.", "ok", "Exact : on déclare tout de suite, preuves à l'appui."],
				["Non, c'était dans les 48 heures, c'est trop tard.", "ko", "Faux : 48 h, c'est pour un vol. Pour un dégât des eaux, c'est 5 jours ouvrés."],
				["Attendez un mois de voir si ça s'aggrave.", "ko", "Elle dépasserait le délai : l'assureur pourrait refuser."]
			], courses:["sinistre", "principe"] },
			{ t:"slider", kind:"franchise", courses:["autohab"] },
			{ t:"choice", q:"Et mon cousin, il peut faire les travaux ?", opts:[
				["Oui, s'il a une garantie décennale : demandez-lui l'attestation avant de commencer.", "ok", "Oui : c'est la décennale qui protège Mme Benali si le plafond retombe."],
				["Bien sûr, prenez qui vous voulez, ça ne change rien.", "ko", "Sans décennale, en cas de malfaçon, elle n'aura aucun recours."],
				["Non, c'est l'assureur qui choisit l'artisan.", "mid", "Faux : elle choisit son artisan. Mais il doit être assuré."]
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
				["J'ai déjà douze clients qui m'attendent.", 1, "Une clientèle avant même de démarrer : le marché existe."]
			], courses:["vente"] },
			{ t:"doc", q:"Voici son prévisionnel de la première année. Une ligne ne tient pas debout : touche-la.", lines:[
				["Chiffre d'affaires", "180 000 €", 1, "180 000 € pour un plombier seul la première année ? Plutôt 60 000 à 80 000 €. Le prévisionnel est à refaire avec lui."],
				["Achats de matériel et pièces", "21 000 €", 0, ""],
				["Assurances (RC pro, décennale)", "3 200 €", 0, ""],
				["Remboursement du prêt (30 000 € sur 5 ans)", "6 600 €", 0, ""]
			], courses:["creation", "analyse"] },
			{ t:"stop", text:"Au guichet d'à côté, un inconnu dépose 9 500 € en espèces. « C'est la troisième fois ce mois-ci. Je reste sous 10 000, comme ça pas de questions. »", courses:["lcbft"] },
			{ t:"choice", q:"Il me faut quoi d'autre pour démarrer ?", opts:[
				["Un compte pro, un prêt au nom de l'entreprise, et une RC pro avec la décennale.", "ok", "C'est le bon équipement d'un artisan qui démarre.", { pnb:900 }],
				["Un crédit conso à ton nom, ce sera plus rapide.", "ko", "Il mélangerait ses dettes perso et pro, et paierait un taux bien plus cher."],
				["Une assurance-vie et un plan épargne retraite, pendant qu'on y est.", "mid", "Pas maintenant : il a besoin de trésorerie. C'est de la survente.", { sell:1, pnb:300 }]
			], courses:["pro"] }
		]
	}
];
