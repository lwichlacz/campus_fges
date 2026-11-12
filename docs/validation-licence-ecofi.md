# Fiche de validation · Mini-jeu « La Ruée » (Licence Économie-Finance, FGES)

**À relire par :** un enseignant de la Licence Économie-Finance
**Objectif du jeu :** faire vivre à un lycéen un après-midi de stage de L3 dans une société de gestion, où chaque décision mobilise un cours de la licence : anticiper, vérifier, se couvrir, actualiser.
**Scénario :** 14 h, une société de gestion lilloise fictive, en plein jour. Le joueur gère une ligne de 100 000 €. Inès, l'analyste qui l'encadre (fictive), commente. Les nouvelles tombent toutes les quelques secondes.
**Durée d'une partie :** environ 4 minutes, une action toutes les 5 à 10 secondes.
**Gestes, tous dans la scène 3D :**
- glisser une ligne de l'écran vers le haut ou vers le bas ;
- toucher l'écran au bon moment ;
- maintenir le téléphone pour voir la source ;
- maintenir le doigt sur l'écran pendant le krach ;
- glisser sur les années pour les actualiser ;
- toucher un point de la courbe.

Aucun panneau ni bouton de réponse.
**Fichiers du jeu :** `js/games/ruee-data.js` contient toutes les nouvelles, tous les chiffres et les cours : c'est ce fichier qu'il faut relire. `js/games/ruee.js` est le moteur.

> Banque Lys, start-up, personnes et montants **fictifs**. Programme relevé sur fges.fr le 10/11/2026.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Les moments du jeu

| Heure | Moment | Ce que fait le joueur | Bonne réponse attendue | Cours |
|---|---|---|---|---|
| 14 h 15 | **Flash BCE.** Le marché attend +0,50 pt ; la BCE annonce +0,25 pt seulement | Glisse 3 lignes vers le haut ou le bas (11 s) | CAC 40 ▲, OAT 10 ans ▲, euro/dollar ▼ : seule la surprise compte | Monnaie Banque Finance, Institutions Européennes, Théorie des marchés financiers, Introduction à la finance de marché, La monnaie |
| 15 h 02 | **Dépêche en anglais :** « OPEC+ agrees surprise cut of 1 million barrels a day » (traduction au bout de 3,5 s) | Glisse 3 lignes (12 s) | Brent ▲, compagnies aériennes ▼, OAT ▼ (inflation, donc taux attendus plus hauts) | International economics, Microéconomie, Conjoncture macroéconomique, Anglais |
| 15 h 40 | **Régression :** croissance du PIB et variation du chômage dans 30 pays, script R à l'écran | La droite tourne ; le joueur touche quand elle colle le mieux (jauge d'écart au nuage) | Pente proche de −0,41 (loi d'Okun) ; « un lien n'est pas une cause » | Comptabilité nationale, Analyse de la croissance, Statistiques, Économétrie, Excel et R, Initiation à la programmation |
| 16 h 10 | **Rumeur :** un post annonce la faillite de la Banque Lys, l'action perd 9 % | Maintenir le téléphone pour voir la source, puis garder ou vendre | Vérifier (compte créé hier, sans source, photo de 2012) puis garder ; le démenti tombe, l'action remonte | Macroéconomie financière et FinTech, ICT's : Privacy, Democracy, Truth (Sciences Po) |
| 16 h 45 | **Krach :** −8 % en quelques secondes, puis rebond | Maintenir le doigt sur l'écran pour être couvert (prime de 250 €/s) | Couvert pendant la chute, découvert pour le rebond | Théorie du risque, Gestion de portefeuille, couverture et trading, Comment résoudre une crise économique ? (Économie Avancée), Histoire de la pensée économique (citation attribuée à Keynes) |
| 17 h 05 | **Start-up :** Maxime, ancien du parcours Étudiant Créateur, demande 300 000 € et promet 400 000 € sur 5 ans | Glisser sur les années pour les actualiser à 12 %, puis investir ou passer | VAN de −28 k€ : passer, et lui proposer de revenir avec une mise plus petite ou des ventes signées | Investment Appraisal, Calculs financiers, Mathématiques appliquées, Fiscalité d'Entreprise, Analyse financière, Ateliers création d'entreprise |
| 17 h 30 | **Clôture :** la courbe du résultat de la journée | Toucher la décision qui a coûté le plus | Le point le plus bas de la marche | Analyse de données, Approche du monde du travail |

- [ ] Les situations sont-elles réalistes pour un stagiaire de L3 ?
- [ ] Les bonnes réponses sont-elles exactes, en particulier le sens des marchés après la BCE et l'OPEP ?
- [ ] Le niveau est-il juste, entre lycéen curieux et étudiant de licence ?

## 2. Les chiffres à vérifier

| Sujet | Chiffre du jeu |
|---|---|
| Mise par ligne | ±2 500 € par ligne bien ou mal jouée |
| Flash BCE | CAC +1,2 %, OAT +0,6 %, euro −0,8 % |
| Dépêche OPEP | Brent +6 %, compagnies aériennes −4 %, OAT −0,5 % |
| Régression | 30 pays inventés, pente −0,41 |
| Rumeur | −9 % puis +8,5 % après le démenti |
| Krach | Position de 100 000 €, couverture à 90 %, prime 250 €/s, −8 % puis rebond à −2 % |
| Start-up | Flux après impôt : −300, 40, 60, 80, 100, 120 k€ ; taux de 12 % = 4 % sans risque + 8 % de prime de risque ; VAN −28 k€ |

- [ ] Ces ordres de grandeur sont-ils plausibles pour 2027 ?

## 3. Mention

Chaque moment rapporte des points :
- 1 point par ligne bien jouée ;
- 2 points pour la régression ;
- 2 points pour la rumeur ;
- 3 points pour le krach ;
- 3 points pour la start-up.

Le score final vaut 90 % de ces points et 10 % pour la lecture de la clôture.

Le résultat en euros s'affiche, mais il ne fait pas la mention. Un joueur peut finir en gain avec une mention faible s'il a vendu sur une rumeur ou investi dans un projet à VAN négative.

| Mention | Score |
|---|---|
| Très bien | 85 et plus |
| Bien | 65 à 84 |
| Assez bien | 45 à 64 |
| De justesse | moins de 45 |

## 4. Ce que le jeu ne couvre pas

Ces cours sont absents ou seulement effleurés, pour tenir en 4 minutes :
- droit de l'entreprise ;
- audit ;
- théorie des organisations et management ;
- management interculturel ;
- RSE ;
- gestion des coûts ;
- recherche opérationnelle ;
- parcours Prépa Grandes Écoles.

## 5. Questions ouvertes pour l'enseignant

1. Le décor d'une société de gestion convient-il, ou faut-il plutôt une salle de marchés de banque ?
2. Le moment « régression » est-il au bon niveau pour montrer l'économétrie à un lycéen ?
3. Faut-il un moment propre au parcours Sciences Politiques au-delà de la rumeur, par exemple une élection qui fait bouger les marchés ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
