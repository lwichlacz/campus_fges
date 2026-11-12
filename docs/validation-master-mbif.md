# Fiche de validation · Mini-jeu « Le dossier Duval Textiles » (Master Management des Banques et Institutions Financières, FGES)

**À relire par :** l'équipe pédagogique du Master MBIF
**Dossier et question à résoudre :** le dossier de crédit de Duval Textiles. Jeudi, en comité de crédit, prête-t-on 1,2 M€ à Duval Textiles (PME textile fictive de Roubaix, 42 salariés) pour sa nouvelle ligne d'enduction ?
**Objectif du jeu :** montrer à un lycéen ce que fait un chargé d'affaires entreprises : un seul dossier, instruit du lundi au jeudi, avec les vrais objets du métier (liasse fiscale, ratios, visite, montage, KYC, notation, comité), et une réponse qui se déduit des pièces.
**Public :** lycéens et étudiants de L3 aux journées portes ouvertes ; niveau master, mais chaque notion est expliquée en une phrase.
**Durée d'une partie :** environ 9 minutes, six étapes.
**Où le trouver :** dans Wenov, onglet Jeux, et sur la fiche du master (`?jeu=mbif`).
**Fichiers :** `js/games/affaires.js` (scène et gestes), `js/games/affaires-data.js` (tous les chiffres, textes, objections et cours).

> Tout est **fictif** : Duval Textiles, Jean et Clara Duval, JD Participations, Lys Invest, Volta Mobility, Autolux, Siègeco, Nordtex Auto, le Crédit des Flandres, la grille de notation. Les chiffres sont cohérents entre eux d'une étape à l'autre.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Programme officiel → étapes du jeu (matrice)

Programme relevé sur fges.fr (onglet Programme), le 12/11/2026.

| Cours (programme) | Année | Étape du jeu | Ce que fait le joueur |
|---|---|---|---|
| Analyse financière approfondie | M2 S3 | 1. Liasse | Entoure la ligne anormale de la liasse (les stocks) |
| Création d'entreprise – analyse financière | M1 S2 | 1-2. Liasse, ratios | Lit EBE, résultat, dotations ; calcule la CAF |
| Connaissance du marché des professionnels et des entreprises | M1 S2 | 1. Liasse | Une PME industrielle, sa clientèle automobile |
| Mise à niveau en mathématiques | M1 S1 | 2. Ratios | Calcule à la calculatrice |
| Analyse des besoins et risques financiers | M1 S1 | 2. Ratios | Rotation des stocks, endettement, capacité de remboursement |
| Risque sur la clientèle professionnelle et PME | M2 S3 | 3. Visite | Compte les palettes, repère le stock invendable |
| Conjoncture économique et financière | M1 S1 | 3. Visite | La fermeture d'Autolux (crise de l'automobile) |
| Anglais – business negotiation | M1, M2 | 3. Visite | Lit la lettre d'intention de Volta, en anglais |
| Décisions et techniques de financement des professionnels | M1 S2 | 4. Montage | Durée, annuité, effort de remboursement |
| Droit du financement de l'entreprise | M2 S4 | 4. Montage | Nantissement, condition suspensive |
| Droit bancaire | M1 S1 | 4. Montage | Caution proportionnée au patrimoine |
| Les régimes matrimoniaux | M2 S3 | 4. Montage | Caution d'un époux commun en biens (accord du conjoint) |
| Système, intermédiation et stratégie bancaire | M1 S1 | 4. Montage | Partage du risque avec Bpifrance |
| Droit des sociétés | M1 S2 | 5. KYC | La holding familiale entre les Duval et l'usine |
| Contrôles et audits internes | M2 S3 | 5. KYC | Bénéficiaires effectifs, écart avec le registre |
| Gestion du risque bancaire | M2 S3 | 5. Notation | Cote, probabilité de défaut, perte attendue |
| Contrôle de gestion bancaire | M2 S3 | 5. Notation | Le taux : ressource + risque + frais + marge |
| Politique économique | M1 S1 | 5. Notation | Le coût de la ressource suit les taux de la BCE |
| Négociation | M2 S3-S4 | 6. Comité | Répondre aux objections |
| Parler en public | M2 S4 | 6. Comité | Défendre son dossier |
| Éthique et finance | M2 S4 | 3, 6 | Dire au comité ce que le dossier cache (le stock mort) |
| Évaluation de la période en entreprise, Problématiques professionnelles | M1, M2 | Tout le jeu | Une semaine d'alternant, du lundi au jeudi |
| Holdings – LBO – Transmission ; Droit de la transmission ; Statut social et fiscal du chef d'entreprise ; Stratégies patrimoniales et fiscales du dirigeant ; Épargne salariale – Madelin – PEE – PERCO ; Le démembrement de propriété | M2 S3-S4 | Écran de fin | « La suite du dossier » : M. Duval a 62 ans, Clara a déjà 32 % ; la transmission est annoncée, pas jouée |

**Non couverts par ce dossier** (un crédit d'entreprise ne s'y prête pas sans le rallonger) : Entrée en relation – produits d'épargne bancaire ; Épargne Assurance Vie ; Impôt sur le revenu ; Impôt sur le capital – contrôle fiscal ; Finance des marchés ; Connaissance des marchés financiers ; Économie de l'assurance ; Gestion des flux bancaires internationaux ; Stratégies du conseil ; Stratégies patrimoniales et fiscales des particuliers ; Aspects réglementaires du bilan patrimonial – Big Expert ; Marché immobilier ; Stratégie d'allocation d'actifs ; Management d'équipe ; Jeu d'entreprise ; méthodologie de recherche ; certifications AMF et Bloomberg. Le volet « particuliers et patrimoine » est celui du jeu du Master Droit et Gestion du Patrimoine (« Le Dossier Deslaurier »).

- [ ] Les intitulés et semestres sont-ils les bons ?
- [ ] Faut-il couvrir un cours absent (par exemple les flux internationaux avec le paiement de Volta, ou l'assurance homme-clé sur M. Duval) ?

## 2. Le déroulé

| # | Moment | Le geste du joueur | Ce qu'il doit trouver |
|---|---|---|---|
| 1 | Lundi 9 h, agence | Entoure au doigt une ligne de la liasse | Les stocks : 900 → 1 250 → 1 850 k€ pour un chiffre d'affaires presque stable (la trésorerie fond, mais c'est une conséquence) |
| 2 | Lundi 11 h, agence | Tape sur une calculatrice 3D les chiffres lus dans la liasse, puis « Reporter » | Rotation des stocks 105 jours (53 en 2023) ; endettement après prêt 0,75 ; CAF 520 k€ ; capacité de remboursement 4,0 ans |
| 3 | Mardi 10 h, usine | Compte les 12 palettes du doigt, lit les étiquettes, colle une pastille rouge sur les invendables, signe la fiche de visite ; puis entoure la phrase inquiétante de la lettre de Volta (en anglais) | 4 palettes Autolux (client fermé), 600 k€ à déprécier ; « This letter is non-binding » (ou « subject to the successful qualification of your samples ») |
| 4 | Mercredi 9 h, agence | Règle sur une tablette la durée, la caution, la garantie Bpifrance, le nantissement, la condition suspensive, en voyant bouger deux jauges (effort de remboursement, couverture), puis transmet | Durée 7 ou 8 ans ; couverture ≥ 70 % ; caution ≤ 350 k€ ; condition « contrat Volta signé » |
| 5 | Mercredi 15 h, agence | Trace du doigt le chemin de chaque actionnaire jusqu'à l'usine (les pourcentages se multiplient), entoure la ligne fausse du registre ; touche la case de la grille de notation, calcule la perte attendue | Jean 48 %, Clara 32 % : deux bénéficiaires effectifs, le registre n'en déclare qu'un ; cote 5 (défaut 2 %) ; perte attendue = 2 % × (1 200 − garanties) |
| 6 | Jeudi 14 h, comité | Pour chaque objection, touche la pièce du dossier étalée sur la table, puis la ligne qui le prouve | Voir § 4 |

Le dossier physique (une chemise sur le bureau) s'épaissit d'une feuille à chaque pièce : 8 pièces au comité.

## 3. Les chiffres à vérifier

**Liasse (k€)** : chiffre d'affaires 6 200 / 6 350 / 6 400 ; EBE 720 / 700 / 690 ; dotations 300 / 300 / 310 ; résultat net 250 / 230 / 210 ; immobilisations nettes 2 060 / 1 860 / 1 440 ; stocks 900 / 1 250 / 1 850 ; créances clients 1 020 / 1 050 / 1 080 ; trésorerie 420 / 260 / 90 ; capitaux propres 2 400 / 2 600 / 2 800 ; dettes financières 1 300 / 1 100 / 900 ; dettes fournisseurs 700 / 720 / 760.

- [ ] La liasse « simplifiée » est-elle assez vraisemblable ? Faut-il les numéros de cerfa (2050, 2052) ?
- [ ] La CAF est simplifiée en « résultat net + dotations aux amortissements ». Acceptable pour ce public ?

**Normes de la banque (fictives)** : endettement (dettes financières ÷ capitaux propres) ≤ 1 ; capacité de remboursement (dettes financières ÷ CAF) ≤ 4 ans ; effort de remboursement (annuités ÷ CAF prévisionnelle) ≤ 55 % ; couverture par les garanties ≥ 70 %.

- [ ] Ces seuils sont-ils réalistes pour une PME industrielle ?

**Visite** : 12 palettes à 150 k€ (valeur d'inventaire) = 1 800 k€ + 50 k€ d'en-cours ; 4 palettes Autolux invendables = 600 k€ à déprécier ; capitaux propres corrigés 2 200 k€, endettement après prêt 0,95.

**Montage** : prêt 1 200 k€ à 4,2 % (taux indicatif) ; annuité 230 k€ sur 6 ans, 201 k€ sur 7 ans, 180 k€ sur 8 ans ; remboursements existants 150 k€ par an ; CAF prévisionnelle 650 k€ (520 + 130 attendus de la nouvelle ligne) ; durée de vie de la ligne 8 ans ; nantissement de la ligne retenu pour 360 k€ (30 %) ; garantie Bpifrance jusqu'à 50 % ; patrimoine net de M. Duval 350 k€ ; sans l'accord de son épouse (communauté), la caution n'engage que ses biens propres et revenus, retenus pour 100 k€.

Messages de refus du montage : prêt plus long que la machine ; annuités au-delà de 55 % de la CAF ; caution disproportionnée (« un juge la réduirait », Code civil, art. 2300) ; couverture sous 70 % ; pas de condition suspensive sur Volta.

- [ ] Les règles de la caution sont-elles bien formulées (art. 2300 sur la disproportion, art. 1415 sur l'accord du conjoint commun en biens) ?
- [ ] La quotité Bpifrance (jusqu'à 50 %) et la valeur retenue du nantissement (30 %) sont-elles plausibles ?
- [ ] Faut-il parler de la commission de la garantie Bpifrance ?

**KYC** : Jean Duval 60 % et Clara Duval 40 % de JD Participations, qui détient 80 % de Duval Textiles ; Lys Invest (fonds régional) 20 %. Bénéficiaires effectifs (plus de 25 %) : Jean 48 %, Clara 32 %. Le registre (déposé en 2021) ne déclare que Jean ; Clara a reçu ses parts en 2024. La banque signale l'écart au greffe.

- [ ] Le seuil de 25 % et l'obligation de signaler une divergence au greffe sont-ils bien présentés ?

**Notation** : grille fictive 3 × 3 (capacité de remboursement × endettement) ; Duval Textiles en cote 5, probabilité de défaut 2 % à un an. Perte attendue = probabilité de défaut × (prêt − garanties). Taux client = coût de la ressource 3,0 % + coût du risque (perte attendue ÷ prêt) + frais 0,6 % + marge 0,2 % (4,2 % avec 80 % de couverture).

- [ ] La perte attendue est simplifiée (pas de taux de récupération sur la part non garantie, garanties comptées à leur valeur). Acceptable pour ce public ?
- [ ] La décomposition du taux convient-elle ?

## 4. Le comité : objections et pièces attendues

| Membre | Objection | Pièce et ligne qui répondent |
|---|---|---|
| M. Vasseur, directeur régional | « Les stocks ont doublé en deux ans. Vous voulez prêter à une entreprise qui ne vend plus ? » | Fiche de visite : « 4 palettes Autolux invendables, 600 k€ à déprécier » ou « 8 palettes en rotation normale » |
| Mme Lambert, directrice des risques | « Quatre ans de capacité de remboursement, c'est notre limite. Si ça tourne mal, combien perd la banque ? » | Fiche de montage : couverture, garantie Bpifrance ou nantissement ; ou grille : perte attendue |
| M. Okafor, responsable conformité | « Qui contrôle vraiment Duval Textiles ? » | Organigramme : Jean 48 %, Clara 32 % ; ou registre : « aucun autre bénéficiaire déclaré » (l'écart signalé) |
| Mme Lambert | « Et si Volta ne signe jamais ? » | Fiche de montage : condition suspensive (si le joueur l'a prévue ; sinon la lettre de Volta ne vaut qu'une demi-réponse) |

Bonne pièce et bonne ligne du premier coup : 2 points ; bonne pièce mais ligne moins précise, ou deuxième essai : 1 point ; sinon 0. Le comité **accorde** le prêt (sous conditions) avec au moins la moitié des points du comité, sinon il **ajourne** le dossier.

- [ ] Les objections sont-elles celles qu'entend vraiment un chargé d'affaires en comité ?
- [ ] Faut-il une issue « refus » en plus de l'accord et de l'ajournement ?

## 5. Mention

Note sur 100 : chaque étape rapporte des points (liasse 2, ratios 4, stock 2, lettre 1, montage 3, KYC 1, cote 1, perte attendue 1, comité 8), moitié des points au deuxième essai, aucun au troisième. Très bien ≥ 85, Bien ≥ 65, Assez bien ≥ 45, sinon De justesse.

## 6. Questions ouvertes pour l'équipe

1. Une situation vécue en alternance (centre d'affaires, comité de crédit) qu'on pourrait mettre en scène à la place d'une étape ?
2. Le personnage de Nadia, directrice du centre d'affaires, qui guide le joueur, vous convient-il ?
3. Qu'est-ce qui manque pour donner envie de rejoindre le master ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
