/* Données du campus : formations (récap fges.fr, 5 oct. 2026), lieux et ambiances.
   niveau : prep | L | LP | M | DU   ·   lieu : falise | wenov | ha */

const U = "https://www.fges.fr/formations/";
export const FORMATIONS = [
	["apes","APES · Année préparatoire aux études scientifiques","FGES","prep","falise",24,"1 an · formation initiale","Une année pour prendre pied en sciences avant la licence. 94 % de réussite.","apes-annee-de-preparation-aux-etudes-scientifiques/"],
	["sv","Licence Sciences de la Vie","FGES","L","falise",100,"L1-L3 · 1 stage par an","Biologie, écologie, génétique… et une sortie terrain à Ambleteuse.","licence-science-de-la-vie/"],
	["mh","Licence Management & Humanités","FGES","L","falise",40,"L1-L3 · 1 stage par an","La gestion et la philosophie dans le même cursus.","humanites-management/"],
	["gestion","Licence Gestion","FGES","L","falise",180,"L1-L3 · 1 stage par an","Marketing, finance, RH : apprendre à piloter une entreprise.","licence-de-gestion/"],
	["ecofi","Licence Économie-Finance","FGES","L","falise",200,"L1-L3 · 1 stage par an","Des marchés financiers à l'économétrie, avec des maths solides.","licence-economie-finance/"],
	["cupge","Prépa Grandes Écoles de Commerce","FGES","L","falise",220,"Prépa + licence","Une licence et une prépa pour viser HEC, ESCP ou l'EDHEC.","prepa-grandes-ecoles-de-commerce/"],
	["lieg","Licence Internationale Économie & Gestion","FGES","L","falise",180,"L1-L3 · 100 % en anglais","Une L3 dans l'une des 200 universités partenaires.","licence-internationale-deconomie-et-de-gestion/"],
	["cfa","Licence Comptabilité-Finance-Audit","ISEA","L","falise",50,"L1-L3 · L3 en alternance","Les chiffres de l'entreprise, avec 83 % d'intervenants du métier.","licence-comptabilite-finance-audit/"],
	["lpabf","Licence Pro Assurance-Banque-Finance","FGES","LP","falise",40,"1 an · alternance","Une L3 pro en alternance pour devenir conseiller bancaire.","licence-professionnelle-assurance-banque-finance/"],
	["info","Licence Informatique","EDN","L","wenov",50,"L1-L3 · L3 en alternance possible","Data, cyber ou réalité virtuelle, et un Projet Gaming dès la L1.","licence-sciences-du-numerique/"],
	["spi","Licence Sciences pour l'Ingénieur","EDN","L","wenov",30,"Nouveau 2026 · L1-L3","Robots, objets connectés et systèmes embarqués.","licence-informatique-industrielle-objets-connectes-et-robotique/"],
	["mn","Licence Management & Numérique","EDN","L","wenov",30,"L1-L3 · 1 stage par an","Manager la transition digitale ou lancer sa start-up.","licence-management-numerique/"],
	["ecoop","Master Écologie Opérationnelle","FGES","M","falise",25,"M1 initial · M2 alternance possible","Devenir écologue de terrain : 190 h de cours dehors.","master-ecologie-operationnelle/"],
	["mdd","Master Management du Développement Durable","FGES","M","falise",30,"M1 stage · M2 alternance","Responsable RSE, chargé de mission climat, consultant.","master-management-du-developpement-durable/"],
	["im","Master International Management","FGES","M","falise",30,"100 % en anglais · M2 alternance","Le management à l'international, avec des doubles diplômes.","master-international-management/"],
	["mrc","Master Marketing & Responsible Cocreation","FGES","M","falise",25,"100 % en anglais · M2 alternance","Un marketing éthique, construit avec les clients.","master-marketing-and-responsible-cocreation/"],
	["cca","Master Comptabilité, Contrôle et Audit","ISEA","M","falise",30,"Alternance 2 ans","La voie vers l'expertise comptable. 93 % en emploi à 6 mois.","master-comptabilite-controle-audit/"],
	["dgp","Master Droit & Gestion du Patrimoine","ISEA","M","falise",30,"Alternance 2 ans","Conseiller en gestion de patrimoine, banquier privé.","master-droit-gestion-du-patrimoine/"],
	["cgao","Master Contrôle de Gestion & Audit Organisationnel","ISEA","M","falise",30,"Alternance 2 ans","Contrôle de gestion, SAP et Power BI. 100 % en emploi.","master-controle-de-gestion-et-audit-organisationnel/"],
	["me","Master Management des Entreprises","FGES","M","wenov",30,"Alternance 2 ans","Piloter une business unit et conduire le changement.","master-management-des-entreprises/"],
	["frd","Master Finance Responsable & Durable","FGES","M","wenov",25,"M1 stage · M2 alternance","Finance de marché et ESG, avec une préparation au CFA.","master-finance-responsable-durable/"],
	["mbif","Master Management des Banques et Institutions Financières","FGES","M","wenov",30,"Alternance 2 ans","Chargé d'affaires, conseiller patrimonial, directeur d'agence.","master-management-des-banques-et-institutions-financieres/"],
	["iasi","Master Informatique Appliquée et Systèmes Intelligents","EDN","M","wenov",30,"Nouveau 2026 · alternance 2 ans","Full stack, cloud et IA : l'ingénieur logiciel complet.","master-informatique-appliquee-et-systemes-intelligents"],
	["dia","Master Data & Intelligence Artificielle","EDN","M","wenov",30,"Alternance 2 ans","Machine learning, deep learning et IA agentique.","master-data-intelligence-artificielle/"],
	["cyber","Master Cyber","EDN","M","wenov",30,"Alternance 2 ans","Pentest, forensic et développement sécurisé.","master-cyber/"],
	["jn","Master Jumeaux Numériques","EDN","M","wenov",20,"Alternance 2 ans","Simulation, 3D et IoT, avec la Gendarmerie nationale.","master-jumeaux-numeriques"],
	["dmb","Master Data Management in Biosciences","EDN","M","wenov",20,"100 % en anglais · alternance","La data science au service de la santé.","master-data-management-in-biosciences/"],
	["ebmd","Master E-Business & Marketing Digital","EDN","M","wenov",25,"Alternance 2 ans","UX, SEO, e-commerce et croissance.","master-ux-marketing-digital/"],
	["mtn","Master Management & Transformation Numérique","EDN","M","wenov",20,"Alternance 2 ans","Conduire la transformation digitale des entreprises.","master-management-in-biosciences/"],
	["duia","DU IA au service des entreprises","EDN","DU","wenov",0,"10 vendredis · 2 490 €","De l'histoire de l'IA à l'IA générative.","du-lia-au-service-des-entreprises/"],
	["duric","DU Renseignement & Investigation Cyber","EDN","DU","wenov",0,"102 h · 3 950 €","Avec le Campus Cyber.","du-renseignement-investigation-cyber/"],
	["ducse","DU Cybersécurité en Entreprise","EDN","DU","wenov",0,"12 journées · 3 200 €","Gouvernance, risques, conformité, sans profil technique.","du-cybersecurite-en-entreprise-gouvernance-risques-et-conformite/"],
	["ducc","DU Cybercriminalité","EDN","DU","wenov",0,"170 h hybride · 3 900 €","Pour officiers et juristes : investigation et informatique légale.","du-cybercriminalite/"],
	["duiacg","DU IA & Numérique au service du Contrôle de Gestion","ISEA","DU","falise",0,"125 h · 2 490 €","Le contrôle de gestion augmenté par l'IA.","du-ia-et-numerique-au-service-du-controle-de-gestion/"],
	["dusp","DU Stratégies patrimoniales","ISEA","DU","falise",0,"125,5 h · 4 900 € HT","Pour experts-comptables, avocats et notaires.","du-strategies-patrimoniales/"],
	["duhm","Parcours Humanités & Management","FGES","DU","ha",0,"Sur mesure · sur devis","Conférences et ateliers d'éthique pour les équipes.","du-humanite-management/"]
].map(a => ({ id:a[0], name:a[1], school:a[2], level:a[3], place:a[4], seats:a[5], rhythm:a[6], pitch:a[7], url:U + a[8] }));

/* Mini-jeux disponibles : id de formation → id du jeu */
export const GAMES = { gestion: "comptoir" };

export const PROFILES = {
	lycee: { icon:"🎒", label:"Lycée", levels:["prep","L"] },
	bac3:  { icon:"🎓", label:"Bac+2/3", levels:["LP","M"] },
	pro:   { icon:"💼", label:"En poste", levels:["DU"] }
};

export const PLACES = {
	ha: {
		icon:"🏛️", name:"Hôtel Académique", kicker:"60 boulevard Vauban",
		links:[{ label:"Histoire et patrimoine de l'Université", url:"https://www.univ-catholille.fr/histoire-et-patrimoine/" }],
		text:"Construit de 1879 à 1881, c'est le cœur historique de l'Université Catholique de Lille : 125 m de façade néogothique, des tourelles, des pinacles et la chapelle Saint-Joseph.",
		facts:["1881","Néogothique","Siège de l'Université"],
		pin:[0,27,-12], target:[0,6,-4], cam:[16,30,46]
	},
	falise: {
		icon:"🧱", name:"Bâtiment Michel Falise", kicker:"13 rue de Toul · campus Vauban",
		links:[{ label:"Le campus Vauban de la FGES", url:"https://www.fges.fr/campus-vauban/" }],
		text:"La FGES s'y est installée en juin 2024 : 10 000 m², 30 salles et 15 amphis autour d'un grand atrium vitré. C'est ici que vivent les licences FGES et toutes les formations de l'ISEA.",
		facts:["10 000 m²","30 salles · 15 amphis","FGES & ISEA"],
		pin:[-52,20,-1], target:[-52,5,0], cam:[-38,28,46]
	},
	wenov: {
		icon:"💡", name:"Campus Wenov", kicker:"Euratechnologies · 177 av. Clémentine Deman",
		links:[{ label:"L'École du Numérique", url:"https://www.fges.fr/cursus-universitaire/licence-sts/ecole-du-numerique/" }, { label:"Le campus Wenov", url:"https://lidd.univ-catholille.fr/campus/le-campus-wenov/" }],
		text:"Le campus de l'École du Numérique, au cœur d'Euratechnologies, à 2 km de Vauban : informatique, data, cyber et réalité virtuelle. Plusieurs masters FGES en alternance y ont aussi leurs cours.",
		facts:["École du Numérique","Euratechnologies","Masters en alternance"]
	}
};

/* Les lieux de vie du campus (pas de formation, mais tout ce qui fait la vie étudiante). */
export const LIFE = {
	chapelle: {
		icon:"⛪", name:"Chapelle universitaire", kicker:"Hôtel Académique · aile sud",
		text:"Construite dans les années 1920 dans un style néogothique d'influence anglo-saxonne, unique en France. Restaurée en 2020 : voûtes blanches et dorées, vitraux remis en lumière. Concerts, conférences et célébrations s'y tiennent toute l'année.",
		facts:["Années 1920","Restaurée en 2020","Vitraux"], action:{ label:"✨ Entrer dans la chapelle", go:"chapelle" }
	},
	rizomm: {
		icon:"☀️", name:"Bâtiment Rizomm", kicker:"41 rue du Port · FGES",
		links:[{ label:"Le campus Vauban de la FGES", url:"https://www.fges.fr/campus-vauban/" }],
		text:"Un bâtiment « intelligent » de 6 500 m², rénové de 2016 à 2018 : ses panneaux solaires produisent environ 73 % de son électricité. Il accueille des masters de la FGES et une terrasse expérimentale dédiée à la transition énergétique.",
		facts:["6 500 m²","73 % d'électricité solaire","Masters FGES"]
	},
	bu: {
		icon:"📚", name:"BU Vauban", kicker:"Bâtiment Robert Schuman · rue du Port",
		links:[{ label:"Portail des bibliothèques", url:"https://bibliotheque.univ-catholille.fr/" }],
		text:"La bibliothèque universitaire du campus : environ 300 000 ouvrages, 3 300 revues imprimées et 338 places pour travailler au calme.",
		facts:["338 places","300 000 ouvrages","Lun-ven 8 h 30-20 h · sam 8 h 30-17 h"]
	},
	resto: {
		icon:"🍽️", name:"Restaurant universitaire", kicker:"All Resto · boulevard Vauban",
		links:[{ label:"All Resto : points de vente et services", url:"https://all-lacatho.fr/fr/restauration" }],
		text:"Le resto U du campus, géré par All. Avec ses selfs, cafétérias, sandwicheries et points click & collect, All sert environ 3 500 repas par jour.",
		facts:["3 500 repas par jour","Selfs & cafétérias","Click & collect"]
	},
	all: {
		icon:"🏠", name:"All · services étudiants", kicker:"Logement · restauration · sport · santé",
		links:[{ label:"Le site d'All", url:"https://www.all-lacatho.fr/fr" }, { label:"Logement", url:"https://all-lacatho.fr/fr/logement" }, { label:"Restauration", url:"https://all-lacatho.fr/fr/restauration" }, { label:"Santé (CPSU)", url:"https://all-lacatho.fr/fr/sante" }, { label:"Sport", url:"https://all-lacatho.fr/fr/sport" }],
		text:"Depuis 1930, All accompagne la vie étudiante de l'Université : près de 1 480 chambres en résidences, le centre de santé universitaire (13 500 consultations par an), le sport et la solidarité.",
		facts:["Depuis 1930","1 480 chambres","Centre de santé"]
	},
	maison: {
		icon:"🎭", name:"Maison de l'étudiant", kicker:"Boulevard Vauban",
		links:[{ label:"Les associations étudiantes", url:"https://www.univ-catholille.fr/en/student-associations/" }],
		text:"Le QG de la vie associative : la plupart des plus de 300 associations étudiantes de l'Université y sont rattachées (chorale, orchestres, théâtre, clubs de sport…), avec la Fédération des étudiants.",
		facts:["300+ associations","Fédé des étudiants","Théâtre, musique, sport"]
	},
	sport: {
		icon:"🏀", name:"Salle omnisports Norbert Segard", kicker:"Sport sur le campus",
		links:[{ label:"All Sport : salle et cours", url:"https://all-lacatho.fr/fr/sport" }],
		text:"La salle omnisports du campus. All Sport propose aussi un espace cardio et musculation et plus de 24 cours collectifs par semaine.",
		facts:["24 cours par semaine","Cardio & muscu","Clubs étudiants"]
	},
	residence: {
		icon:"🛏️", name:"Résidences étudiantes", kicker:"All logement",
		links:[{ label:"Trouver une résidence All", url:"https://all-lacatho.fr/fr/logement/rechercher" }, { label:"Le logement étudiant All", url:"https://all-lacatho.fr/fr/logement" }],
		text:"Une vingtaine de résidences au cœur du campus Vauban et dans la métropole, de la chambre au studio, de 350 à 750 € par mois tout compris (laverie, petit-déjeuner, service technique).",
		facts:["350 à 750 € / mois","Au cœur du campus","Chambres & studios"]
	},
	jardin: {
		icon:"🌿", name:"Jardin botanique Nicolas Boulay", kicker:"Rue du Port",
		text:"Le jardin botanique de l'Université, en plein cœur du campus : un vrai poumon vert entre deux cours, pour réviser au soleil.",
		facts:["Jardin botanique","En plein campus"]
	},
	rameau: {
		icon:"🌱", name:"Palais Rameau", kicker:"Junia · agriculture urbaine",
		links:[{ label:"Le Palais Rameau (Junia)", url:"https://www.junia.com/fr/junia/palais-rameau/" }],
		text:"Palais horticole du XIXe siècle restauré par Junia et rouvert en février 2025 : un lieu d'enseignement et de recherche sur l'agriculture et l'alimentation de demain, entouré d'un parc pédagogique de 6 000 m².",
		facts:["Rouvert en 2025","Parc de 6 000 m²","Agriculture urbaine"]
	},
	citadelle: {
		icon:"🏰", name:"Citadelle de Lille", kicker:"À deux pas du campus",
		links:[{ label:"La Citadelle de Lille", url:"https://fr.wikipedia.org/wiki/Citadelle_de_Lille" }],
		text:"La « reine des citadelles », bâtie par Vauban au XVIIe siècle et entourée du Bois de Boulogne et du Jardin Vauban : le grand parc des joggings et des pique-niques entre deux cours.",
		facts:["Vauban, XVIIe siècle","Bois de Boulogne","Jardin Vauban"]
	}
};

/* Saisons : végétation, sol, particules + éclairage de jour */
export const SEASONS = {
	automne: {
		icon:"🍂", label:"Automne",
		grass:"#a9b05c", lawn:"#9cb257", path:"#dec59c", water:"#6e9aa4", slate:"#4f5767",
		trees:["#d9822b","#e6a43c","#c4532f","#b98a2f","#a03d2a","#e9b84b","#8f9a3c"], conifer:"#4d6a44", bush:["#7c8f3e","#b0602e","#97a046"],
		parts:{ n:150, colors:["#d9822b","#c4532f","#e6a43c","#b98a2f"], w:.38, h:.26, speed:1.3, sway:1.3 },
		day:{ skyTop:"#f2bf86", skyBot:"#fde9c8", fog:"#f5dcb6", hemiSky:"#ffe8c4", hemiGround:"#7d5b3c", hemiI:1.15, sun:"#ffcf8f", sunI:2.5, sunPos:[-70,62,50], cloud:"#fff1dc", exposure:1 }
	},
	hiver: {
		icon:"❄️", label:"Hiver",
		grass:"#dfe6f1", lawn:"#e9eff7", path:"#c4bfcc", water:"#4d6a8a", slate:"#c8d1df",
		trees:["#eef3f9","#dde6f1","#d0dae8"], conifer:"#35503f", bush:["#dfe7f0","#cbd6e2","#e9eef5"], snowy:true,
		parts:{ n:400, colors:["#ffffff","#eef3ff"], w:.17, h:.17, speed:1.7, sway:.7 },
		day:{ skyTop:"#9db5d4", skyBot:"#eaf0f6", fog:"#e1e8f0", hemiSky:"#eef4ff", hemiGround:"#7a8296", hemiI:1.05, sun:"#fff0dc", sunI:2.1, sunPos:[-60,50,55], cloud:"#f6f8fb", exposure:.95 }
	},
	printemps: {
		icon:"🌸", label:"Printemps",
		grass:"#8dc463", lawn:"#80c05a", path:"#e3d4b1", water:"#79b5c9", slate:"#4f5767",
		trees:["#7dbb4f","#93c95a","#f3b3c6","#6aa848","#f7c9d6","#5f9e43"], conifer:"#466f48", bush:["#6aa848","#e88fb0","#f2c94c"],
		parts:{ n:120, colors:["#f8c3d3","#fbd7e1","#ffffff"], w:.27, h:.2, speed:.8, sway:1.5 },
		day:{ skyTop:"#8dc4e6", skyBot:"#e6f4f4", fog:"#d8ecef", hemiSky:"#e6f5ff", hemiGround:"#6b7b4a", hemiI:1.05, sun:"#fff2d6", sunI:2.7, sunPos:[-55,80,55], cloud:"#ffffff", exposure:1 }
	}
};
export const NIGHT = { skyTop:"#141a38", skyBot:"#4f4b7c", fog:"#33375f", hemiSky:"#8394cc", hemiGround:"#221f38", hemiI:.6, sun:"#a8b9ff", sunI:.65, sunPos:[60,55,-30], cloud:"#4f5684", exposure:1.05 };
export const SEASON_ORDER = ["automne","hiver","printemps"];
