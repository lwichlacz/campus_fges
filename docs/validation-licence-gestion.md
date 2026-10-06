# Fiche de validation · Mini-jeu « Le Comptoir » (Licence Gestion)

**À relire par :** un enseignant de la Licence Gestion
**Objectif du jeu :** faire comprendre ce qu'est « piloter une entreprise » en le faisant, à travers le café de l'atrium.
**Durée d'une partie :** environ 6 minutes (4 matinées de service, 4 imprévus et 3 exercices).
**Fichier du jeu :** `js/games/comptoir.js` (les chiffres sont regroupés en haut du fichier : `ECO`, `COMPO`, `DAYS`, `COURSES`).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

Chaque matinée a deux temps :

- **Avant d'ouvrir**, le joueur prend trois décisions : le prix du café, le nombre de croissants à commander et le nombre de baristas.
- **Pendant le service**, ses baristas servent et lui **pilote en gérant**, avec des leviers qui ont chacun un coût :

  | Levier | Effet | Coût | Notion |
  |---|---|---|---|
  | 💶 Prix modifiable en direct | Les passants entrent ou passent leur chemin (« trop cher ») | — | Prix et demande |
  | 🎉 Happy hour (une fois par matinée) | −30 % pendant 10 s pour les nouveaux clients ; affluence en hausse ; un peu de réputation en plus | Marge réduite | Promotion, heures creuses |
  | 📞 Renfort (une fois par matinée) | Un barista de plus jusqu'à midi | 15 € | Flexibilité du personnel, anticipation |
  | 🚚 Réassort express | +10 croissants livrés en 8 s | 0,80 € pièce au lieu de 0,45 € | Approvisionnement, coût de l'urgence |
  | 🍪 Geste commercial (toucher un client impatient) | Le client reste dans la file | 0,30 € | Relation client, fidélisation |

  En haut de l'écran, le **résultat de la matinée s'affiche en direct** : il démarre en négatif (salaires et croissants déjà payés) et remonte à chaque vente. Une bannière signale le moment où les charges sont couvertes. Pendant la première matinée, des conseils apparaissent au bon moment (file trop longue, croissants presque épuisés, client impatient, période calme).

> Une variante « caisse » (le joueur compose lui-même les commandes) existe aussi, à l'adresse `?caisse`, pour comparer les deux versions.

| Étape | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Matinée 1 · L'ouverture (tutoriel) | L1 | Réglages, puis service à sa caisse. Imprévu : commande groupée avec remise | — |
| Matinée 2 · Premier vrai rush | L1 | Idem. Imprévu : rupture de lait | — |
| **Exercice 1** · Le compte de résultat | L1 | Classe ses propres montants de la matinée 2 (chiffre d'affaires, achats consommés, salaires), puis calcule le résultat | Comptabilité financière |
| **Exercice 2** · Coût de revient et seuil de rentabilité | L2 | Calcule le coût d'un cappuccino, puis le nombre de cafés à vendre pour payer l'équipe (avec un graphique) | Gestion des coûts |
| Matinée 3 · La rentrée de L2 | L2 | Le seuil de rentabilité s'affiche quand il fixe son prix. Imprévu : barista malade | — |
| **Exercice 3** · Investir dans un vélo cargo | L3 | Calcule le délai de récupération, puis décide d'investir ou non | Décision d'investissement |
| Matinée 4 · Le Comptoir grandit | L3 | En cas d'investissement : livraisons en plus et amortissement déduit. Imprévu : story Instagram | — |
| Diplôme | — | Bilan des 4 matinées, mention, liste des cours rencontrés | Marketing, GRH, Logistique (en plus des 3 ci-dessus) |

- [ ] Le déroulé et la progression L1 → L2 → L3 sont-ils fidèles à la maquette ?
- [ ] Les cours associés sont-ils placés dans la bonne année ?

## 2. Hypothèses économiques (volontairement simplifiées)

| Paramètre | Valeur | Commentaire |
|---|---|---|
| Coût d'un cappuccino | 0,55 € (café 0,25 + lait 0,20 + gobelet 0,10) | Un expresso coûte 0,35 € (sans lait). Hors main-d'œuvre |
| Prix de vente | Choisi par le joueur, de 1,00 € à 3,50 € (2,00 € par défaut) | Même prix pour l'expresso et le cappuccino |
| Croissant | Acheté 0,45 €, revendu 1,20 € ; les invendus sont perdus | Environ 45 % des clients en prennent un |
| Salaire d'un barista | 25 € par matinée | Charge fixe de la matinée |
| Affluence | Baisse quand le prix monte ; dépend aussi de la réputation | Pic d'affluence vers 10 h |
| Au-delà de 2,60 € | Les clients trouvent ça cher : la satisfaction et la réputation baissent | |
| Leviers du gérant | Renfort 15 €, réassort 0,80 € le croissant, geste commercial 0,30 €, happy hour à −30 % | Comptés dans les salaires ou les achats |
| Vélo cargo | 3 000 € ; 30 livraisons par semaine à 1,50 € de marge | Délai de récupération ≈ 67 semaines |
| Amortissement du vélo | 7 € par matinée (3 000 € sur 3 ans) | Apparaît dans le compte de la matinée 4 |

- [ ] Les ordres de grandeur sont-ils crédibles pour des lycéens ?
- [ ] Le vocabulaire est-il juste (« achats consommés », « charges », « résultat », « coût de revient », « seuil de rentabilité », « délai de récupération », « amortissement », « coût d'acquisition client ») ?
- [ ] Faut-il parler explicitement de « charges fixes » et de « charges variables » ?

## 3. Les imprévus (une décision en plein service, le jeu se met en pause)

| Matinée | Situation | Choix A | Choix B | Notion |
|---|---|---|---|---|
| 1 | Le secrétariat commande 12 cappuccinos avec 20 % de remise | Accepter : marge en plus, mais les baristas s'arrêtent 6 s et la file s'allonge | Refuser : la file est servie, mais la marge est perdue | Prix, remise, capacité |
| 2 | Rupture de lait | Racheter à la supérette : +0,30 € par cappuccino | Supprimer le cappuccino : une partie des clients repart | Approvisionnement, coût |
| 3 | Un barista est malade | Intérim : 38 € au lieu de 25 € | Faire sans lui : 25 € de salaire en moins, mais une personne en moins | Gestion des ressources humaines |
| 4 | Une étudiante influente propose une story contre 10 cappuccinos offerts | Accepter : 5,50 € de coût et environ 12 clients en plus | Refuser : ni coût ni clients | Marketing, coût d'acquisition |

Après chaque choix, un message explique le calcul. La décision apparaît ensuite dans le bilan de la matinée.

- [ ] Les situations sont-elles réalistes ? Faut-il en remplacer une ?
- [ ] Imprévu 3 : le raccourci « salaire non versé pendant l'absence » est-il acceptable, ou faut-il évoquer les indemnités journalières ?

## 4. Les exercices

**Exercice 1 – Compte de résultat**
Le joueur reçoit trois montants issus de **sa** matinée et les place sur les bonnes lignes. Il choisit ensuite le résultat parmi trois propositions. La bonne réponse est : chiffre d'affaires − achats − salaires.
- [ ] La formulation et la présentation sont-elles correctes ?

**Exercice 2 – Coût de revient et seuil de rentabilité**
1. Coût de revient d'un cappuccino : 0,25 + 0,20 + 0,10 = 0,55 €.
2. « Combien de cafés vendre pour payer les salaires ? » : salaires ÷ (prix − 0,55), arrondi au supérieur. Un graphique montre la marge cumulée qui croise la droite des salaires.
- [ ] Le raccourci « seuil de rentabilité = couvrir les salaires du jour » est-il acceptable à ce niveau ?

**Exercice 3 – Décision d'investissement**
3 000 € ÷ (30 × 1,50 €) ≈ 67 semaines. Le joueur décide ensuite d'investir ou non ; les deux choix sont défendables.
- [ ] Faut-il ajouter une notion (VAN, trésorerie, financement) ou en rester au délai de récupération ?

## 5. Équilibrage observé (parties simulées automatiquement)

La mention tient compte du **résultat cumulé et de la satisfaction des clients**.

| Façon de jouer | Résultat cumulé | Satisfaction | Mention |
|---|---|---|---|
| Réglages par défaut, aucun levier | ≈ 70 € | 75 % | Assez bien |
| Bons réglages (≈ 2,40 €, 2 baristas, 25 croissants), aucun levier | ≈ 110 € | 76 % | Bien |
| Bons réglages et leviers utilisés au bon moment | ≈ 120 € | 89 % | Très bien |
| Un seul barista et un renfort au rush | ≈ 165 € | 78 % | Bien (rentable, clients moins contents) |
| Trois baristas | ≈ 65 € | 93 % | Assez bien (trop de salaires) |
| Prix cassé (1,40 €) | Pertes | 82 % | De justesse |
| Prix abusif (3,30 €) | ≈ 155 € | 68 % | Assez bien |

## 6. Questions ouvertes pour l'enseignant

1. Une situation vécue en stage ou en cours qu'on pourrait ajouter (négociation fournisseur, recrutement, contrôle de gestion) ?
2. Un exercice qui vous semble plus emblématique de la licence que l'un des trois actuels ?
3. Les messages d'analyse en fin de matinée (rupture, invendus, clients partis, gaspillage, prix) sont-ils pédagogiquement justes ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
