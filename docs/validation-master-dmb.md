# Fiche de validation · Mini-jeu « From Blood to Decision » (Master Data Management in Biosciences, École du Numérique)

**À relire par :** l'équipe pédagogique du Master Data Management in Biosciences
**Public :** candidats au master (bac+3/4). **Langue :** anglais, comme le master (enseigné 100 % en anglais).
**Point de départ :** la maquette des relations presse (« Jeu Data MB site.pptx ») : un patient fatigué, une prise de sang, le pipeline « biology → data → decision », la brochure. Le jeu garde ce récit et l'étend du cas individuel à l'étude de cohorte.
**Durée :** 8 à 10 minutes, quatre missions (raccourci le 12/11/2026 : le contrôle qualité du séquençage et la rédaction du compte rendu ont été retirés ; la découverte fortuite BRCA2 est désormais la dernière étape de la mission 2).
**Où le trouver :** dans Wenov (aile sud, épingle « Laboratoire bio-data »), dans l'onglet Jeux et sur la fiche du master.
**Fichier :** `js/games/biodata.js`. Cohorte, séquences et chiffres sont **simulés** (indiqué dans le jeu).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Le cas

Alex, 27 ans, fatigue chronique et douleurs articulaires ; ferritine 1 140 µg/L, coefficient de saturation de la transferrine 78 %. Un exome est séquencé, puis analysé d'abord sur les gènes de la surcharge en fer (panel virtuel) ; c'est ce qui rend possible la découverte fortuite BRCA2 de la mission 2. Alex est homozygote HFE c.845G>A p.(Cys282Tyr) (C282Y) : hémochromatose héréditaire.

- [ ] Le cas est-il juste et bien choisi pour illustrer le master ?

## 2. Les quatre missions

| # | Mission | Ce que fait le joueur | Pièges | Cours révélés |
|---|---|---|---|---|
| 1 | Data governance | Pour 10 champs du dossier : garder, transformer (date de naissance → âge, code postal → département) ou retirer (nom, n° de sécurité sociale, e-mail). Puis ordonner la chaîne : consentement, prélèvement, pseudonymisation, séquençage, stockage sur hébergeur certifié HDS, contrôle qualité, interprétation, compte rendu. | Carte « déposer le génome sur un cloud public gratuit » | M2 Data protection & health data |
| 2 | Variant interpretation & consent | Calculer la fréquence allélique (VAF) de 3 positions, sur 12 lectures montrées parmi les 45 de l'échantillon (profondeur 45×) : artefact (1/12 lecture, faible qualité), hétérozygote (6/12), homozygote (12/12). Puis classer 3 variants sur l'échelle à 5 niveaux (ACMG) à partir de preuves : C282Y pathogène, variant synonyme fréquent bénin, faux-sens rare sans données = VUS. Puis une découverte fortuite BRCA2 : le joueur lit le consentement signé en mission 1 (Alex a demandé à être informé des découvertes actionnables) → confirmer, puis annoncer en consultation de conseil génétique. | Fréquence de C282Y (~6 %) qui pourrait faire croire à un variant bénin ; note de bas de page ou silence pour BRCA2 | M1 Bioinformatics & databases, M1 Disease biology, M2 Clinical trials & regulation |
| 3 | Cohort biostatistics | 240 patients simulés (24 homozygotes). Choisir le test pour une ferritine très asymétrique (Mann–Whitney ou t-test sur le log), interpréter la p-value, puis l'effet du sexe (pénétrance plus forte chez les hommes). | t-test sur les valeurs brutes ; « probabilité que H0 soit vraie » ; « significatif donc cliniquement important » | M2 Epidemiology |
| 4 | Machine learning | Régression logistique (réellement entraînée dans le navigateur) pour décider qui tester. Choisir les variables, entraîner, valider. Choisir le découpage par patient (3 visites par patient). Régler le seuil sur la courbe ROC : sensibilité ≥ 90 %, spécificité ≥ 60 %. | Fuites : nombre de saignées déjà faites, numéro d'inscription (AUC 0,998 au lieu de 0,96) ; découpage par lignes | M1 AI & machine learning, M2 Data mining & Big Data |

## 3. Points à vérifier

- [ ] **Ouverture (13/11/2026)** : la minimisation se fait d'abord à la main, dans une biobanque à −80 °C (`js/games/coldchain.js`) : on décolle les bandes de l'étiquette du tube (supprimer), on les replie (généraliser : « 14/03/1998 » devient « 1998 · aged 27 », « 59000 Lille » devient « 59 · Nord »), on garde le reste ; la déléguée à la protection des données bloque le rangement tant qu'une bande est mal traitée. Les valeurs repliées sont-elles justes ?
- [ ] **Mission 1** : la pseudonymisation est acceptée au prélèvement ou juste après le séquençage, toujours avant le stockage. Les champs à transformer sont-ils les bons ?
- [ ] **Mission 2** : preuves de classement (fréquence ~6 % de l'allèle C282Y en Europe du Nord-Ouest, ClinVar, études fonctionnelles) exactes ? Séquence affichée illustrative : faut-il la vraie ?
- [ ] **Mission 3** : la cohorte est simulée (ferritine log-normale, effet du sexe). Les ordres de grandeur sont-ils plausibles ?
- [ ] **Mission 4** : objectif de dépistage (sensibilité ≥ 90 %) et vocabulaire (data leakage, grouped split, AUC) adaptés ?
- [ ] **Mission 2 (BRCA2)** : conduite à tenir pour la découverte fortuite conformes aux pratiques françaises ?
- [ ] Les intitulés de cours (en anglais) correspondent-ils à la maquette (M1 : biologie des maladies, biostatistiques, bio-informatique, bases de données, biotechnologies, programmation, IA ; M2 : essais cliniques, protection des données, épidémiologie, data mining, Big Data) ?

## 4. Mention

| Mention (site) | Libellé affiché | Condition |
|---|---|---|
| Très bien | Highest distinction | 3 erreurs au plus |
| Bien | Distinction | 8 erreurs au plus |
| Assez bien | Pass | Au-delà |

Une erreur : une validation refusée (export, pipeline, coupe, contrôle qualité, génotypes, classement, compte rendu) ou une mauvaise réponse à une question.

## 5. Questions ouvertes

1. Souhaitez-vous un autre cas que l'hémochromatose ?
2. Le niveau est-il le bon pour des candidats bac+3 ? Trop difficile, pas assez ?
3. Faut-il ajouter une mission « programmation » (lire ou corriger quelques lignes de Python) ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
