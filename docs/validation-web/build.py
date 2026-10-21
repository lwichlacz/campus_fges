"""Pages de relecture des mini-jeux par les enseignants (publiées en artefacts claude.ai).

Usage : python3 docs/validation-web/build.py   → relecture/index.html, en ligne sur https://lwichlacz.github.io/campus_fges/relecture/
(une page, un lien par jeu : #dmb, #sv… ; #tableau pour le tableau de bord, avec la clé du script Google)
Le contenu suit les fiches docs/validation-*.md. La vidéo de présentation (motion.js) est intégrée à chaque page.
Les réponses vont dans un tableur Google via google-apps-script.js (installation décrite en tête du fichier) ;
pages.json garde l'URL du script (« endpoint »).
Les réponses sont gardées dans la base de l'artefact (collection « retours », une fiche par relecteur).
"""
import json, pathlib

HERE = pathlib.Path(__file__).parent
SITE = "https://lwichlacz.github.io/campus_fges/"

def c(k, q, d=""): return {"k": k, "q": q, "d": d}
def q(k, q_, d=""): return {"k": k, "q": q_, "d": d, "kind": "q"}

PAGES = {
	"dmb": {
		"title": "Relecture From Blood to Decision",
		"accent": ("#24407a", "#e6ecf7", "#93b0ea", "#1d2a44"),
		"cfg": {
			"id": "dmb", "game": "From Blood to Decision (Master Data Management in Biosciences)",
			"h1": "From Blood to Decision\u00a0: votre relecture",
			"lead": "Le mini-jeu du Master Data Management in Biosciences, dans le campus 3D de la FGES. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux candidats.",
			"facts": ["12 à 15 min", "En anglais, comme le master", "6 missions", "Public : candidats bac+3/4", "Données simulées"],
			"url": SITE + "?jeu=dmb",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › From Blood to Decision. Le jeu est aussi dans Wenov, aile sud, épingle « Laboratoire bio-data ».",
			"short": "From Blood to Decision", "videoSteps": ["Données", "Séquençage", "Variants", "Cohorte", "IA", "Compte rendu"],
			"card": {"icon": "🧬", "title": "From Blood to Decision", "formation": "Master Data Management in Biosciences", "steps": [
				["1", "Data governance (GDPR, consent)"], ["2", "Sequencing quality control"], ["3", "Variant interpretation"],
				["4", "Cohort biostatistics"], ["5", "Machine learning for screening"], ["6", "Clinical report & ethics"]]},
			"publicHint": "Des candidats titulaires d'une licence (biologie, informatique, maths), avant leur entrée en M1.",
			"dureeHint": "Durée prévue : 12 à 15 minutes.",
			"sections": [
				{"t": "Le cas", "sub": "Alex, 27 ans", "items": [
					c("cas", "Le cas d'Alex est-il juste et bien choisi pour illustrer le master ?", "Fatigue chronique, ferritine 1 140 µg/L, saturation de la transferrine 78 %, HFE C282Y homozygote : hémochromatose héréditaire."),
					c("anglais", "L'anglais du jeu est-il correct et naturel ?", "Vocabulaire scientifique, consignes, dialogues.")]},
				{"t": "Mission 1 · Data governance", "items": [
					c("m1_champs", "Le tri des champs du dossier est-il juste ?", "Garder, transformer (date de naissance → âge, code postal → département) ou retirer (nom, n° de sécurité sociale, e-mail)."),
					c("m1_chaine", "L'ordre de la chaîne est-il juste ?", "Consentement, prélèvement, pseudonymisation, séquençage, stockage sur hébergeur HDS, contrôle qualité, interprétation, compte rendu. La pseudonymisation est acceptée au prélèvement ou juste après le séquençage, toujours avant le stockage.")]},
				{"t": "Mission 2 · Sequencing QC", "items": [
					c("m2_coupe", "La coupe des lectures est-elle réaliste ?", "Lectures de 150 bases, garder Phred ≥ 25 en conservant au moins 80 % des bases."),
					c("m2_seuils", "Les seuils de contrôle sont-ils réalistes pour un panel clinique ?", "Qualité moyenne ≥ 30, alignement ≥ 90 %, contamination ≤ 2 %, profondeur ≥ 30×, concordance < 99 %."),
					c("m2_pieges", "Les pièges sont-ils crédibles ?", "Inversion d'échantillons (femme déclarée avec des lectures du chromosome Y), doublon à 99,8 % de concordance.")]},
				{"t": "Mission 3 · Variant interpretation", "items": [
					c("m3_vaf", "Le calcul de la fréquence allélique (VAF) est-il bien présenté ?", "Artefact (1/12 lecture, faible qualité), hétérozygote (6/12), homozygote (12/12)."),
					c("m3_acmg", "Le classement des variants et ses preuves sont-ils exacts ?", "C282Y pathogène (fréquence ~6 % en Europe du Nord-Ouest, ClinVar, études fonctionnelles), synonyme fréquent bénin, faux-sens rare sans données = VUS."),
					q("m3_seq", "Faut-il afficher la vraie séquence de HFE plutôt qu'une séquence illustrative ?")]},
				{"t": "Mission 4 · Cohort biostatistics", "items": [
					c("m4_test", "Le choix du test et l'interprétation de la p-value sont-ils justes ?", "Ferritine très asymétrique : Mann–Whitney ou t-test sur le log. Pièges : t-test sur les valeurs brutes, « probabilité que H0 soit vraie », « significatif donc cliniquement important »."),
					c("m4_cohorte", "Les ordres de grandeur de la cohorte simulée sont-ils plausibles ?", "240 patients dont 24 homozygotes, ferritine log-normale, pénétrance plus forte chez les hommes.")]},
				{"t": "Mission 5 · Machine learning", "items": [
					c("m5_fuites", "Les fuites de données et le découpage par patient sont-ils bien expliqués ?", "Variables piégées : nombre de saignées déjà faites, numéro d'inscription (AUC 0,998 au lieu de 0,96). 3 visites par patient."),
					c("m5_seuil", "L'objectif de dépistage est-il pertinent ?", "Seuil sur la courbe ROC : sensibilité ≥ 90 %, spécificité ≥ 60 %.")]},
				{"t": "Mission 6 · Report & ethics", "items": [
					c("m6_cr", "La conclusion du compte rendu est-elle bien formulée ?", "Constat, interprétation, recommandation : bilan martial, avis spécialisé, dépistage familial avec conseil génétique. Piège : « c'est une hémochromatose » (génotype ≠ diagnostic)."),
					c("m6_brca", "La conduite face à la découverte fortuite BRCA2 est-elle conforme aux pratiques françaises ?", "Alex a consenti à être informé des découvertes actionnables : confirmer, puis annoncer en consultation de conseil génétique.")]},
				{"t": "Le master dans le jeu", "items": [
					c("cours", "Les intitulés de cours affichés correspondent-ils à la maquette ?", "M1 : biologie des maladies, biostatistiques, bio-informatique, bases de données, biotechnologies, programmation, IA. M2 : essais cliniques, protection des données, épidémiologie, data mining, Big Data."),
					c("mention", "Les mentions de fin sont-elles bien calibrées ?", "Highest distinction : 3 erreurs au plus ; Distinction : 8 au plus ; Pass au-delà.")]},
			],
			"open": [
				{"k": "autre_cas", "q": "Souhaitez-vous un autre cas que l'hémochromatose ? Lequel ?"},
				{"k": "python", "q": "Faut-il ajouter une mission de programmation (lire ou corriger quelques lignes de Python) ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre le master ?"},
			],
		},
	},
	"sv": {
		"title": "Relecture Mission Jardin Boulay",
		"accent": ("#2f6a43", "#e3f0e6", "#86c99b", "#1b3324"),
		"cfg": {
			"id": "sv", "game": "Mission Jardin Boulay (Licence Sciences de la Vie)",
			"h1": "Mission Jardin Boulay\u00a0: votre relecture",
			"lead": "Le mini-jeu de la Licence Sciences de la Vie, dans le campus 3D de la FGES. Il se joue dans le jardin botanique Nicolas Boulay, avec un tronc commun puis trois parcours de L3. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux lycéens.",
			"facts": ["7 min par partie", "Tronc commun L1-L2", "3 parcours de L3", "Public : lycéens"],
			"url": SITE + "?jeu=sv",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › Mission Jardin Boulay. À la fin, « Rejouer la L3 » permet d'essayer les deux autres parcours sans tout refaire : si vous le pouvez, jouez les trois.",
			"short": "Mission Jardin Boulay",
			"card": {"icon": "🔍", "title": "Mission Jardin Boulay", "formation": "Licence Sciences de la Vie", "steps": [
				["L1", "Identifier les espèces, comprendre qui mange qui"], ["L2", "Vérifier une loi de la génétique"],
				["L3", "Ta spécialisation : écologie, biotech ou ingénieur"]]},
			"publicHint": "Des lycéens de première et terminale qui hésitent entre plusieurs licences.",
			"dureeHint": "Durée prévue : environ 7 minutes, plus 2 à 3 minutes par parcours rejoué.",
			"parcours": [["eco", "🌿 Écologie opérationnelle"], ["biotech", "🧬 Biotechnologies"], ["inge", "⚙️ Ingénieur"]],
			"sections": [
				{"t": "Le déroulé", "items": [
					c("activites", "Les activités sont-elles représentatives de la licence ?", "Terrain et identification, réseau trophique, génétique de Mendel, puis un parcours de L3."),
					c("annees", "Les années associées à chaque notion sont-elles justes ?", "Identification et écologie en L1, génétique en L2, parcours en L3."),
					c("parcours_noms", "Les intitulés des trois parcours sont-ils exacts ?", "Écologie opérationnelle, Biotechnologies, Ingénieur.")]},
				{"t": "Terrain · la clé de détermination", "sub": "L1", "items": [
					c("cle", "La clé simplifiée est-elle juste scientifiquement ?", "Plumes → mésange ; poils → hérisson ; pas de pattes → lombric ; 8 pattes → épeire ; 6 pattes et élytres → coccinelle ; ailes transparentes → abeille."),
					c("anecdotes", "Les rangs taxonomiques et les anecdotes sont-ils corrects ?", "Coccinelle et pucerons, abeille et pollinisation, épeire (arachnide), lombric, mésange et chenilles, hérisson espèce protégée."),
					q("especes", "Faut-il d'autres espèces (une plante, un champignon) ?")]},
				{"t": "Réseau trophique", "sub": "L1", "items": [
					c("liens", "Les liens acceptés et refusés sont-ils justes ?", "La flèche va de celui qui est mangé vers celui qui mange. Rosier → puceron → coccinelle → mésange → épervier ; feuilles mortes → lombric → hérisson."),
					q("detritivore", "Mettre les « feuilles mortes » dans le réseau est-il acceptable, ou faut-il parler de réseau détritivore ?"),
					c("insecticide", "Le scénario de l'insecticide est-il correct ?", "Un insecticide non sélectif tue pucerons et coccinelles ; les pucerons reviennent plus vite que leurs prédateurs ; conclusion sur la lutte biologique.")]},
				{"t": "Génétique", "sub": "L2", "items": [
					c("mendel", "Le croisement de Mendel est-il juste ?", "Pois violet (V, dominant) × blanc (b, récessif) en lignées pures ; F1 toute violette ; échiquier Vb × Vb ; 1/4 de blanches attendu ; 40 graines semées."),
					q("notation", "La notation des allèles (V / b) convient-elle, ou préférez-vous celle utilisée en cours ?"),
					q("chi2", "Citer le test du χ² est-il pertinent à ce niveau ?")]},
				{"t": "Parcours Écologie opérationnelle", "sub": "L3", "items": [
					c("quadrats", "Le vocabulaire et la méthode des quadrats sont-ils justes ?", "100 quadrats d'1 m², 4 choisis ou tirés au hasard, estimation = moyenne × 100, explication du biais d'échantillonnage."),
					q("ic", "Faut-il évoquer l'intervalle de confiance, ou est-ce trop pour des lycéens ?")]},
				{"t": "Parcours Biotechnologies", "sub": "L3", "items": [
					c("pcr", "La simplification de l'amorce de PCR est-elle acceptable ?", "Brin complémentaire de ATGCGTAC → TACGCATG, écrit dans le même sens (sans orientation 5'→3')."),
					c("valeurs", "Les valeurs sont-elles crédibles ?", "Bande à 750 pb, pipetage de 100 µL, dilution finale 1/1 000, bioréacteur à 37 °C et pH 7."),
					q("ufc", "Faut-il parler d'UFC plutôt que de « bactéries par mL » ?")]},
				{"t": "Parcours Ingénieur", "sub": "L3", "items": [
					c("ferme", "La ferme urbaine du Palais Rameau est-elle un bon exemple ?", "Dimensionner (300 salades, 25 bacs, pompe de 60 L/h), modéliser une croissance logistique, piloter une serre avec un budget énergie."),
					c("inge_ton", "Le parcours prépare-t-il bien aux écoles d'ingénieurs (agro, bio) ? Le ton est-il juste ?")]},
				{"t": "Fin de partie", "items": [
					c("mention", "Les mentions sont-elles bien calibrées ?", "Très bien : 3 erreurs au plus et parcours ≥ 70 % ; Bien : 8 erreurs au plus et ≥ 40 % ; Assez bien au-delà."),
					c("ton", "Le ton vous convient-il ?", "« Ton labo de licence », label « refuge de biodiversité », tutoiement des lycéens.")]},
			],
			"open": [
				{"k": "terrain", "q": "Une sortie de terrain, un TP ou un stage emblématique de la licence à mettre en scène (Ambleteuse, par exemple) ?"},
				{"k": "autre_inge", "q": "Pour le parcours Ingénieur, un meilleur exemple qu'une ferme urbaine (bioprocédé industriel, traitement de l'eau…) ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre la licence ?"},
			],
		},
	},
	"spi": {
		"title": "Relecture Cellule robotique Wenov",
		"accent": ("#a8501c", "#f8e9df", "#f0a473", "#3a2316"),
		"cfg": {
			"id": "spi", "game": "Cellule robotique Wenov (Licence Sciences pour l'Ingénieur)", "short": "Cellule robotique Wenov",
			"h1": "Cellule robotique Wenov : votre relecture",
			"lead": "Le mini-jeu de la Licence Sciences pour l'Ingénieur de l'École du Numérique, dans le campus 3D de la FGES. Le joueur fait fonctionner une cellule robotique avec les outils de chaque année. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux lycéens.",
			"facts": ["Environ 9 min", "4 missions, de L1 à L3", "Public : lycéens", "Cellule mise en scène, pas un équipement réel"],
			"url": SITE + "?jeu=spi",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › Cellule robotique Wenov. Le jeu est aussi dans Wenov, épingle « Plateau robotique ».",
			"card": {"icon": "🦾", "title": "Cellule robotique Wenov", "formation": "Licence Sciences pour l'Ingénieur", "steps": [
				["L1", "Piloter les articulations du bras"], ["L2", "Programmer le cycle de la ligne"],
				["L2", "Régler le moteur d'une articulation"], ["L3", "Lui donner des yeux pour trier"]]},
			"videoSteps": ["L1", "L2", "L2", "L3"],
			"publicHint": "Des lycéens de première et terminale, notamment en spécialité sciences de l'ingénieur, maths ou NSI.",
			"dureeHint": "Durée prévue : environ 9 minutes.",
			"sections": [
				{"t": "Le déroulé", "items": [
					c("progression", "La progression L1 → L2 → L2 → L3 est-elle fidèle à la maquette ?", "Piloter le bras (L1), programmer la cellule (L2), régler le moteur (L2), donner la vue au robot (L3)."),
					c("cours", "Les intitulés des cours révélés sont-ils les bons ?", "Mécanique et systèmes numériques ; Robotique et systèmes industriels ; Automatique et asservissement ; Vision par ordinateur et IA embarquée.")]},
				{"t": "Mission 1 · Prends la main", "sub": "L1", "items": [
					c("m1", "La prise en main du bras est-elle juste ?", "Bras à 3 articulations (base en rotation, épaule et coude en élévation), pince qui reste verticale, angles affichés en direct, collisions refusées."),
					c("m1_vocab", "Le vocabulaire (articulation, degré de liberté, cinématique) est-il adapté à des lycéens ?")]},
				{"t": "Mission 2 · Programme la cellule", "sub": "L2", "items": [
					c("m2", "Le cycle attendu est-il juste ?", "Attendre une pièce (capteur) → aller au-dessus du tapis → saisir → aller au-dessus du bac → déposer, en boucle. Sans le capteur, la saisie échoue."),
					q("m2_api", "Faut-il parler d'automate programmable (API) plutôt que de microcontrôleur ?")]},
				{"t": "Mission 3 · Règle le moteur", "sub": "L2", "items": [
					c("m3", "Le modèle et les critères de réglage sont-ils acceptables ?", "Moteur asservi en position, correcteur proportionnel-dérivé (P et D), sans gravité ni saturation. Réussite : dépassement de 4° au plus et stabilité à ±2° en moins de 1,5 s."),
					q("m3_annee", "Le correcteur PD est-il vu en L2 ? Faut-il parler de PID ?"),
					q("m3_mots", "Les mots « gain » et « amortissement » conviennent-ils pour des lycéens ?")]},
				{"t": "Mission 4 · Donne-lui des yeux", "sub": "L3", "items": [
					c("m4", "La classification est-elle bien présentée ?", "10 exemples étiquetés (teinte mesurée par la caméra), un seuil entre pièces orange et bleues, puis le tri automatique de 8 pièces (7 bien triées au moins)."),
					q("m4_ia", "« IA embarquée » est-il juste pour un seuil appris sur des exemples, ou faut-il dire « apprentissage » ou « classification » ?")]},
				{"t": "Fin de partie", "items": [
					c("mention", "Les mentions sont-elles bien calibrées ?", "Très bien : 3 erreurs au plus ; Bien : 8 au plus ; Assez bien au-delà. Une erreur : collision, pièce lâchée hors du bac, cycle qui échoue, réglage raté, pièce mal triée."),
					c("ton", "Le ton « tableau de bord d'ingénieur » vous convient-il pour présenter la licence ?")]},
			],
			"open": [
				{"k": "materiel", "q": "L'école dispose-t-elle d'un bras robotisé ou d'une cellule de démonstration ? Des photos permettraient d'en rapprocher le jeu."},
				{"k": "missions", "q": "Quelles missions ajouter ensuite (câblage d'un capteur en L1, jumeau numérique à deux bras en L3…) ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre la licence ?"},
			],
		},
	},
	"gestion": {
		"title": "Relecture Le Comptoir",
		"accent": ("#1d7488", "#e0f1f5", "#6fc6da", "#163039"),
		"cfg": {
			"id": "gestion", "game": "Le Comptoir (Licence Gestion)", "short": "Le Comptoir",
			"h1": "Le Comptoir : votre relecture",
			"lead": "Le mini-jeu de la Licence Gestion, dans le campus 3D de la FGES. Le joueur pilote le café de l'atrium pendant quatre matinées, avec un exercice à chaque année. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux lycéens.",
			"facts": ["Environ 6 min", "4 matinées, 4 imprévus, 3 exercices", "Public : lycéens", "Chiffres volontairement simplifiés"],
			"url": SITE + "?jeu=gestion",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › Le Comptoir. Le jeu est aussi dans l'atrium de Michel Falise.",
			"card": {"icon": "☕", "title": "Le Comptoir", "formation": "Licence Gestion", "steps": [
				["L1", "Prix, équipe et compte de résultat"], ["L2", "Coût de revient et seuil de rentabilité"], ["L3", "Investir pour grandir"]]},
			"publicHint": "Des lycéens de première et terminale qui hésitent entre plusieurs licences.",
			"dureeHint": "Durée prévue : environ 6 minutes.",
			"sections": [
				{"t": "Le déroulé", "items": [
					c("progression", "Le déroulé et la progression L1 → L2 → L3 sont-ils fidèles à la maquette ?", "Chaque matinée : prix, croissants et baristas, puis le service en direct avec des leviers (prix, happy hour, renfort, réassort, geste commercial)."),
					c("cours", "Les cours associés sont-ils placés dans la bonne année ?", "Comptabilité financière (L1), Gestion des coûts (L2), Décision d'investissement (L3), plus Marketing, GRH et Logistique.")]},
				{"t": "Hypothèses économiques", "sub": "volontairement simplifiées", "items": [
					c("chiffres", "Les ordres de grandeur sont-ils crédibles pour des lycéens ?", "Cappuccino à 0,55 € de coût, vendu 1 à 3,50 € ; croissant acheté 0,45 €, revendu 1,20 € ; barista à 25 € la matinée ; vélo cargo à 3 000 €."),
					c("vocab", "Le vocabulaire est-il juste ?", "Achats consommés, charges, résultat, coût de revient, seuil de rentabilité, délai de récupération, amortissement, coût d'acquisition client."),
					q("fixes", "Faut-il parler explicitement de « charges fixes » et de « charges variables » ?")]},
				{"t": "Les imprévus", "items": [
					c("imprevus", "Les situations sont-elles réalistes ?", "Commande groupée avec 20 % de remise ; rupture de lait ; barista malade (intérim à 38 €) ; story Instagram contre 10 cappuccinos offerts."),
					q("malade", "Barista malade : le raccourci « salaire non versé pendant l'absence » est-il acceptable, ou faut-il évoquer les indemnités journalières ?")]},
				{"t": "Les exercices", "items": [
					c("ex1", "Exercice 1 · Le compte de résultat est-il correct ?", "Le joueur classe ses propres montants (chiffre d'affaires, achats, salaires) puis calcule le résultat."),
					c("ex2", "Exercice 2 · Le raccourci « seuil de rentabilité = couvrir les salaires du jour » est-il acceptable à ce niveau ?", "Coût de revient 0,25 + 0,20 + 0,10 = 0,55 € ; cafés à vendre = salaires ÷ (prix − 0,55)."),
					q("ex3", "Exercice 3 · Faut-il ajouter une notion (VAN, trésorerie, financement) au délai de récupération ?", "3 000 € ÷ (30 × 1,50 €) ≈ 67 semaines ; investir ou non sont deux choix défendables.")]},
				{"t": "Fin de partie", "items": [
					c("analyse", "Les messages d'analyse en fin de matinée sont-ils justes ?", "Rupture, invendus, clients partis, gaspillage, prix trop haut ou trop bas."),
					c("mention", "La mention (résultat cumulé et satisfaction des clients) vous paraît-elle juste ?", "Bons réglages et leviers bien utilisés : Très bien ; prix cassé : De justesse ; trois baristas : Assez bien (trop de salaires).")]},
			],
			"open": [
				{"k": "situation", "q": "Une situation vécue en stage ou en cours à ajouter (négociation fournisseur, recrutement, contrôle de gestion…) ?"},
				{"k": "exercice", "q": "Un exercice plus emblématique de la licence que l'un des trois actuels ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre la licence ?"},
			],
		},
	},
	"cfa": {
		"title": "Relecture L'Enquête de l'auditeur",
		"accent": ("#8c2b3c", "#f6e4e7", "#ec8fa0", "#3a1d23"),
		"cfg": {
			"id": "cfa", "game": "L'Enquête de l'auditeur (Licence Comptabilité-Finance-Audit)", "short": "L'Enquête de l'auditeur",
			"h1": "L'Enquête de l'auditeur : votre relecture",
			"lead": "Le mini-jeu de la Licence Comptabilité-Finance-Audit (ISEA), dans le campus 3D de la FGES. La trésorerie d'une PME fictive fond sans raison : le joueur mène l'enquête avec les outils de chaque année. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux lycéens.",
			"facts": ["Environ 6 min", "7 étapes, de L1 à L3", "Public : lycéens", "Entreprise et personnes fictives"],
			"url": SITE + "?jeu=cfa",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › L'Enquête de l'auditeur.",
			"card": {"icon": "🕵️", "title": "L'Enquête de l'auditeur", "formation": "Licence Comptabilité-Finance-Audit", "steps": [
				["L1", "Trier les pièces, calculer la TVA, rapprocher la banque"], ["L2", "Analyser les écarts du budget"], ["L3", "Mener l'audit et confondre le coupable"]]},
			"publicHint": "Des lycéens de première et terminale qui hésitent entre plusieurs licences.",
			"dureeHint": "Durée prévue : environ 6 minutes.",
			"sections": [
				{"t": "Le déroulé", "items": [
					c("progression", "La progression L1 → L2 → L3 est-elle fidèle à la maquette ?", "Tri des pièces, TVA et rapprochement bancaire (L1) ; budget et réel (L2) ; audit des pièces, tableau d'enquête et déontologie (L3)."),
					c("cours", "Les intitulés des cours sont-ils les bons ?", "Comptabilité financière, Fiscalité, Rapprochement bancaire, Contrôle de gestion, Audit et expertise comptable (alternance).")]},
				{"t": "Trier les pièces et la TVA", "sub": "L1", "items": [
					c("tri", "Le classement des 6 pièces est-il juste ?", "Farine et électricité : charges ; ventes à l'hôtel et ticket Z : produits ; four et camionnette : investissements."),
					q("immo", "Faut-il dire « immobilisation » plutôt qu'« investissement » ?"),
					q("tva", "Toutes les factures sont à 20 % de TVA (la farine relève normalement du taux réduit). Faut-il corriger ?")]},
				{"t": "Rapprochement et budget", "sub": "L1 · L2", "items": [
					c("rappro", "Le rapprochement bancaire est-il juste ?", "Montants TTC = HT × 1,2 (984 €, 1 380 €, 480 €, 7 680 €) et un virement de 2 940 € sans justificatif."),
					c("budget", "L'analyse budget / réel est-elle juste ?", "Prestations de services : 500 € prévus, 3 440 € réels, soit un écart de 2 940 €."),
					q("ecart", "La notion d'écart « favorable / défavorable » doit-elle apparaître ?")]},
				{"t": "L'audit", "sub": "L3", "items": [
					c("anomalies", "Les anomalies sont-elles représentatives du travail d'un auditeur junior ?", "TVA fausse (66 € au lieu de 60 € sur 300 € HT) ; « mission de conseil » de 2 450 € HT sans détail ni bon de commande."),
					c("enquete", "Le tableau d'enquête est-il crédible ?", "Le RIB de Dupont Conseil (ou son Kbis) relié à la fiche du comptable : même IBAN, même adresse."),
					c("deonto", "La conclusion déontologique est-elle juste ?", "Documenter les preuves et alerter la gérante dans le rapport, sans diffusion publique."),
					q("cac", "Faut-il évoquer le commissaire aux comptes et la révélation au procureur ?")]},
				{"t": "Fin de partie", "items": [
					c("mention", "Les mentions sont-elles bien calibrées ?", "Très bien : 2 erreurs au plus ; Bien : 6 au plus ; Assez bien au-delà."),
					c("ton", "Le ton « enquête policière » vous convient-il pour présenter le métier ?")]},
			],
			"open": [
				{"k": "alternance", "q": "Une situation vécue en alternance (cabinet ou entreprise) qu'on pourrait mettre en scène ?"},
				{"k": "bilan", "q": "Faut-il un passage sur le bilan (actif / passif), en plus du compte de résultat ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre la licence ?"},
			],
		},
	},
	"info": {
		"title": "Relecture Game Jam 48 h",
		"accent": ("#5b3fd0", "#ece8fd", "#a996ff", "#2a2350"),
		"cfg": {
			"id": "info", "game": "Game Jam 48 h (Licence Informatique)", "short": "Game Jam 48 h",
			"h1": "Game Jam 48 h : votre relecture",
			"lead": "Le mini-jeu de la Licence Informatique de l'École du Numérique, dans le campus 3D de la FGES. Un week-end de game jam avec une équipe du Projet Gaming de L1 : le joueur construit un jeu de plateforme en 3D, le programme en Python, y joue face à un ennemi, met les scores en ligne, crée l'ambiance en réalité virtuelle, tient le choc quand les joueurs affluent (cache, serveurs, scores signés) et passe devant un jury. En bonus, un éditeur de niveau à partager. Nous avons besoin de l'œil de l'équipe pédagogique avant de le montrer aux lycéens.",
			"facts": ["Environ 12 min", "6 étapes, de H+0 à H+47, et un éditeur bonus", "En 3D, jouable au clavier ou au doigt", "Public : lycéens", "Pas besoin de savoir programmer"],
			"url": SITE + "?jeu=info",
			"howto": "Le bouton ouvre le jeu directement. Sinon : ouvrez le site, barre du bas › Jeux › Game Jam 48 h. Le jeu est aussi dans Wenov, épingle « Game Jam 48 h ».",
			"videoSteps": ["Niveau", "Python", "SQL", "VR", "Serveur", "Jury"],
			"card": {"icon": "🎮", "title": "Game Jam 48 h", "formation": "Licence Informatique", "steps": [
				["H+0", "Dessiner un niveau faisable (parcours en largeur)"], ["H+6", "Le héros en Python, puis jouer face à un ennemi"],
				["H+20", "Le podium des joueurs en SQL"], ["H+28", "L'ambiance en réalité virtuelle"], ["H+36", "5 000 joueurs : serveurs, cache, scores signés"], ["H+47", "La démo devant le jury"]]},
			"publicHint": "Des lycéens de première et terminale, notamment en spécialité NSI ou maths.",
			"dureeHint": "Durée prévue : environ 12 minutes.",
			"sections": [
				{"t": "Le déroulé", "items": [
					c("etapes", "Les étapes sont-elles représentatives de la licence et du Projet Gaming ?", "Level design et parcours en largeur ; physique d'un personnage en Python et ennemi qui se déplace par parcours en largeur ; SQL et API ; ambiance 3D et réalité virtuelle ; serveurs, cache, sécurité et signatures ; présentation devant un jury ; éditeur de niveau à partager."),
					c("cours", "Les intitulés et les années des cours révélés sont-ils exacts ?", "Projet Gaming (L1) ; Structures de données et algorithmique (L1-L2) ; Programmation, Python (L1) ; Bases de données (L1) ; Développement back-end (L2) ; Réalité virtuelle et 3D, parcours IoT et VR (L2-L3) ; Réseaux et cloud (L1-L3) ; Cybersécurité et cryptologie, parcours Cyber (L2)."),
					c("jam", "Le cadre « game jam de 48 h » est-il crédible pour le Projet Gaming ?", "Vendredi 18 h → dimanche 17 h, salle de l'École du Numérique à Wenov, deux coéquipiers fictifs.")]},
				{"t": "H+00 · Le niveau", "sub": "L1 · Projet Gaming, structures de données", "items": [
					c("bfs", "Le parcours en largeur est-il bien présenté ?", "On part de la colonne 0, on sort une colonne de la file, on ajoute ses voisines atteignables ; le niveau est faisable si le drapeau (colonne 15) est atteint. Le plus court chemin est surligné."),
					c("bfs_regle", "La règle de saut est-elle claire ?", "Monter d'un bloc au plus, franchir 2 cases vides au plus. Le joueur dispose de 3 blocs ; 2 suffisent."),
					q("bfs_annee", "Le parcours en largeur est-il vu en L1 (structures de données) ou en L2 (algorithmique avancée) ?")]},
				{"t": "H+06 · Le héros", "sub": "L1 · programmation en Python", "items": [
					c("phys", "La fonction de physique en Python est-elle juste et lisible ?", "def mettre_a_jour(heros, dt): heros.vy = heros.vy - 20 * dt ; if touche_saut and heros.au_sol: heros.vy = 8 ; heros.y = heros.y + heros.vy * dt ; if heros.y < sol: heros.y = sol. Elle tourne réellement 60 fois par seconde."),
					c("ennemi", "L'ennemi illustre-t-il bien le parcours en largeur ?", "Un bug rouge part de la tour et recalcule toutes les demi-secondes le plus court chemin vers le héros, avec la même règle de saut ; son chemin s'allume en rouge. On l'écrase en lui sautant dessus."),
					c("phys_bugs", "Les bugs montrés pour chaque erreur sont-ils pédagogiquement justes ?", "Gravité -20 ou 0 : le héros s'envole ; y = 0 : il s'enfonce ; y + 1 : il grimpe par bonds ; élan 3 : il tombe dans le trou ; élan 25 : il sort de l'écran."),
					q("phys_langage", "Quel moteur ou langage utilisent les L1 pour le Projet Gaming ?")]},
				{"t": "H+28 · L'ambiance", "sub": "Parcours IoT et réalité virtuelle", "items": [
					c("vr", "Les réglages de la scène sont-ils justes et parlants ?", "Hauteur et couleur de la lumière, densité du brouillard, caméra (de côté, plongée, à hauteur du héros). Attendu : lumière chaude à 25° au plus, brouillard de 25 à 65 %, caméra à hauteur du héros."),
					c("vr_casque", "L'explication sur le casque VR est-elle juste ?", "Deux images, une par œil, 90 fois par seconde ; le brouillard évite aussi de dessiner en détail ce qui est caché."),
					q("vr_vue", "Faut-il une vraie vue à la première personne plutôt qu'une caméra juste derrière le héros ?")]},
				{"t": "H+20 · Les scores", "sub": "L1 · bases de données, L2 · back-end", "items": [
					c("sql", "La requête et ses pièges sont-ils adaptés ?", "SELECT pseudo, MAX(score) AS meilleur FROM parties GROUP BY pseudo ORDER BY meilleur DESC LIMIT 3 ; pièges : doublons sans GROUP BY, MAX sans GROUP BY, colonne non agrégée, SUM, ASC, LIMIT."),
					c("api", "L'explication de l'API (requête servie en JSON) est-elle juste ?", "GET /api/podium renvoie les trois meilleurs joueurs en JSON.")]},
				{"t": "H+36 · Le jeu buzze", "sub": "Réseaux et cloud, parcours Cyber", "items": [
					c("srv", "Le modèle simplifié du serveur est-il acceptable ?", "1 000 demandes/s par serveur, 5 000 demandes/s, cache qui évite 65 % des demandes, latence ≈ 30 ms / (1 − charge), objectif 200 ms, budget 3 serveurs : il faut le cache et 3 serveurs."),
					c("triche", "La question sur le tricheur est-elle juste ?", "Un score de 999 999 en 3 s : on vérifie sur le serveur (jamais confiance au client), pas dans le jeu ni en chiffrant le score."),
					c("signature", "L'étape des signatures est-elle juste ?", "Le serveur signe chaque score (empreinte de clé secrète + pseudo + score). Le joueur recalcule trois signatures : celle du score modifié en route (1 990 → 2 990) ne correspond plus. Le tricheur ne peut pas signer : il n'a pas la clé."),
					q("hmac", "Faut-il nommer la vraie technique (HMAC) ?"),
					q("srv_mots", "Faut-il nommer la répartition de charge (load balancing) et la mise à l'échelle ?")]},
				{"t": "H+47 · Le jury et la fin de partie", "items": [
					c("jury", "La démo devant un jury est-elle fidèle au Projet Gaming ?", "Jury fictif : une enseignante, une développeuse de studio lillois, une étudiante de L3 ; notes de gameplay, technique et thème."),
					c("mention", "Les mentions sont-elles bien calibrées ?", "Très bien : 2 erreurs au plus ; Bien : 7 au plus ; Assez bien au-delà. Les chutes et les coups de l'ennemi ne comptent pas."),
					c("editeur", "L'éditeur de niveau bonus est-il une bonne idée ?", "Ajouter et retirer des blocs, tester, puis partager un lien qui ouvre le niveau ; le parcours en largeur refuse un niveau impossible."),
					c("ton", "Le ton « week-end entre étudiants » (pizzas, coéquipier qui s'endort) vous convient-il pour présenter la licence ?")]},
			],
			"open": [
				{"k": "jam", "q": "L'école organise-t-elle une vraie game jam ? Un nom, une date ou des photos rendraient le jeu plus concret."},
				{"k": "parcours", "q": "Le parcours Data est le seul sans étape : faut-il en ajouter une ?"},
				{"k": "manque", "q": "Qu'est-ce qui manque pour donner envie de rejoindre la licence ?"},
			],
		},
	},
}

# les jeux, pour la scène « un mini-jeu par formation » de la vidéo
GAMES = [
	{"id": "gestion", "icon": "☕", "title": "Le Comptoir", "formation": "Licence Gestion", "dur": "6 min"},
	{"id": "cfa", "icon": "🕵️", "title": "L'Enquête de l'auditeur", "formation": "Licence Comptabilité-Finance-Audit", "dur": "6 min"},
	{"id": "sv", "icon": "🔍", "title": "Mission Jardin Boulay", "formation": "Licence Sciences de la Vie", "dur": "7 min"},
	{"id": "spi", "icon": "🦾", "title": "Cellule robotique Wenov", "formation": "Licence Sciences pour l'Ingénieur", "dur": "9 min"},
	{"id": "info", "icon": "🎮", "title": "Game Jam 48 h", "formation": "Licence Informatique", "dur": "12 min"},
	{"id": "dmb", "icon": "🧬", "title": "From Blood to Decision", "formation": "Master Data Management in Biosciences", "dur": "12-15 min"},
]
# une seule page pour tous les jeux (relecture/#dmb, #sv…), servie par GitHub Pages avec le site ;
# les réponses partent vers le script Google (pages.json : « endpoint », l'URL …/exec du déploiement)
import shutil
conf = json.loads((HERE / "pages.json").read_text()) if (HERE / "pages.json").exists() else {}
DEFAULTS = {"deadline": "2026-11-14", "attendus": 2}
games = {}
for key, p in PAGES.items():
	a, a_soft, a_dark, a_soft_dark = p["accent"]
	games[key] = {**p["cfg"], "accent": [a, a_soft, a_dark, a_soft_dark], "videoAccent": a_dark, "videoInk": a}
cfg = {"games": games, "order": list(PAGES), "videoGames": GAMES, "defaults": DEFAULTS, "endpoint": conf.get("endpoint", ""),
	"homeAccent": ["#0b7a8e", "#e2f3f6", "#5fcbe0", "#17343b"],
	"homeLead": "Le campus 3D de la FGES propose un mini-jeu par formation. Avant de les montrer aux candidats, nous demandons à chaque équipe pédagogique de relire le sien : environ 15 minutes."}
OUT = HERE.parent.parent / "relecture"
(OUT / "img").mkdir(parents=True, exist_ok=True); (OUT / "media").mkdir(exist_ok=True)
# le film n'est versionné qu'une fois, dans relecture/media (la copie de docs/ sert au tournage)
for f in ["img/affiche.jpg", "media/campus-3d.mp4"]:
	if (HERE / f).exists(): shutil.copyfile(HERE / f, OUT / f)
for f in ["img/campus.jpg", "img/logo-fges.png", "media/bande-son.mp4"]: (OUT / f).unlink(missing_ok=True)
tpl = (HERE / "template.html").read_text(encoding="utf-8")
html = (tpl.replace("__APP__", (HERE / "app.js").read_text(encoding="utf-8"))
	.replace("__CONFIG__", json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")))
(OUT / "index.html").write_text(html, encoding="utf-8")
(HERE / "relecture.html").write_text(html, encoding="utf-8")       # copie locale
print("écrit relecture/index.html ·", len(games), "jeux · envoi", cfg["endpoint"] or "pas encore branché (récapitulatif à copier)")
