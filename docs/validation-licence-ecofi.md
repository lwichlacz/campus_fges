# Fiche de validation · Mini-jeu « La Ruée · Le comité de 18 h » (Licence Économie-Finance, FGES)

**À relire par :** un enseignant de la Licence Économie-Finance
**Objectif du jeu :** faire vivre à un lycéen le travail d'un analyste de L3 en stage. Il doit expliquer une mauvaise journée à partir de preuves, avec les outils de la licence, puis la défendre devant un comité.
**Le dossier :** 17 h 30, dans une société de gestion lilloise fictive, en plein jour. Le fonds d'Inès, la gérante qui encadre le stagiaire, a perdu **3,2 %** dans la journée, soit 320 000 € sur 10 M€. À 18 h, le comité demande : **pourquoi, et que fait-on ?** Le joueur a trente minutes de jeu pour monter son dossier. L'horloge du bureau tourne cinq fois plus vite que le temps réel, ce qui laisse environ 6 minutes. Ensuite, il défend son dossier devant trois membres du comité.
**Durée d'une partie :** 6 à 8 minutes.
**Gestes, tous dans la scène 3D :**
- poser une règle sur une courbe : appuyer au début d'un mouvement, glisser jusqu'à la fin, lire l'écart ;
- calculer sur le téléphone, qui sert de calculatrice : le bon résultat remplit la cellule du tableur ;
- saisir une droite de régression et la tourner jusqu'à ce que la jauge des écarts soit au plus bas ;
- faire défiler le carnet d'ordres et retrouver un ticket ;
- poser un curseur sur le cours d'une action, à l'heure du ticket ;
- au comité, prendre une pièce du dossier sur la table, puis montrer du doigt le chiffre qui répond.

Le jeu n'a ni glisser-déposer ni bouton de réponse : chaque réponse se mesure, se calcule ou se lit sur une pièce.
**Fichiers du jeu :** `js/games/ruee-data.js` contient le dossier, tous les chiffres, les questions du comité et les cours : c'est ce fichier qu'il faut relire. `js/games/ruee.js` est le moteur.

> Fonds Beffroi Équilibre, Banque Lys, Banque Rivage, Énergie Nord, personnes, montants et données de régression : tout est **fictif**. Programme relevé sur fges.fr le 10/11/2026.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Le fonds et la journée

| Ligne du fonds | Poids |
|---|---|
| OAT 10 ans (obligations d'État) | 45 % |
| Actions zone euro | 40 % |
| Banque Lys | 5 % |
| Énergie Nord | 5 % |
| Monétaire | 5 % |

La courbe du fonds dans la journée compte quatre chutes. Leur somme fait exactement −3,2 % :

| Heure | Événement | Chute du fonds | D'où elle vient |
|---|---|---|---|
| 11 h 30 | Le Brent perd 3 % (désaccord à l'OPEP+) | −0,1 % | bêta pétrole 0,03 × −3 % |
| 14 h 15 | La BCE monte ses taux de 0,50 point ; le consensus attendait 0,25 point | −1,0 % | OAT : 45 % × (−8 × 0,25 = −2 %) = −0,9 % ; actions : 40 % × −0,25 % = −0,1 % |
| 15 h 30 → 15 h 41 | Une rumeur annonce la faillite de la Banque Lys. Le fonds vend à 15 h 41 à 22,50 €, soit −10 %. Le démenti tombe à 15 h 52 | −0,5 % | 5 % × −10 % ; le titre finit à 24,80 € |
| 16 h 20 → 16 h 50 | Krach éclair : le CAC 40 perd 4 %. La couverture (4 M€ de contrats à terme vendus) est posée à 16 h 50, au plus bas, et jamais levée | −1,6 % | 40 % × −4 % ; le rebond de +2,5 % jusqu'à la clôture est manqué, soit 40 % × 2,5 % = 1,0 % du fonds |

## 2. Les étapes de l'enquête

| Étape | Ce que fait le joueur | Ce qui est attendu | Pièce obtenue | Cours |
|---|---|---|---|---|
| **1. La courbe** | Mesure chaque chute de la courbe du fonds à la règle | −1,0, −0,5, −1,6. Inès fait alors remarquer que la somme fait −3,1 % et qu'il manque 0,1 % : le joueur doit trouver la petite chute de 11 h 30 | La courbe du jour | Analyse de données |
| **2. La BCE** | Lit la dépêche en anglais (« ECB raises rates by 50 bp, consensus was 25 bp »), puis calcule trois cellules sur la calculatrice | Surprise = 0,50 − 0,25 = 0,25 point ; variation de l'OAT = −8 × 0,25 = −2 % ; perte due à l'OAT = 0,45 × −2 = −0,9 % ; avec les actions (−0,1 %), le total vaut −1,0 %, la chute mesurée | Attribution BCE | Monnaie Banque Finance, Institutions Européennes, Théorie des marchés financiers, Introduction à la finance de marché, Calculs financiers, Analyse de la croissance, Anglais |
| **3. La régression** | Ajuste trois droites, le fonds face à l'OAT, au CAC 40 et au Brent sur 60 séances, en minimisant la jauge des écarts | Bêta OAT 0,45, bêta CAC 40 0,50, bêta Brent 0,03 | Régression | Statistiques, Économétrie, Excel et R, Initiation à la programmation |
| **4. La Banque Lys** | Retrouve le ticket de vente dans le carnet d'ordres, pose le curseur à son heure sur le cours de Lys, puis calcule la perte | Ticket à 15 h 41, onze minutes avant le démenti ; 22,50 € = −10 % ; 0,05 × −10 = −0,5 % | Ticket d'ordre · Banque Lys | Macroéconomie financière et FinTech, ICT's : Privacy, Democracy, Truth (Sciences Po) |
| **5. Le krach** | Retrouve la couverture dans le carnet. Mesure à la règle, sur le CAC 40, la chute avant la couverture puis le mouvement pendant. Calcule le rebond manqué | −4 % avant 16 h 50, +2,5 % après ; 0,40 × 2,5 = 1,0 % du fonds | Couverture du krach | Théorie du risque, Gestion de portefeuille, couverture et trading, Comment résoudre une crise économique ? (Économie Avancée), Histoire de la pensée économique (citation attribuée à Keynes) |

Erreurs prévues, avec l'indice d'Inès :
- règle posée sur une partie de chute seulement ;
- deux chutes mesurées d'un coup ;
- « 45 × 2 » au lieu de « 0,45 × 2 » ;
- Banque Rivage prise pour Banque Lys ;
- curseur posé à l'heure du démenti.

Au bout de deux erreurs sur un calcul, la calculatrice affiche l'indice ; au bout de quatre, Inès remplit la cellule.

Si 18 h sonne avant la fin, le joueur part au comité avec les pièces déjà récoltées. Il ne peut pas répondre aux questions dont il n'a pas la preuve.

## 3. Le comité de 18 h

Trois membres, tous fictifs : Bertrand Delcourt (directeur de la gestion), Karim Benali (conformité) et Claire Delattre (risques). Pour répondre, le joueur prend une pièce sur la table, puis touche le chiffre qui répond.

| Question | Pièce et chiffre attendus | Explication donnée par le joueur |
|---|---|---|
| Delcourt : tout le monde savait que la BCE monterait ses taux, pourquoi les obligations ont-elles décroché ? | Attribution BCE · surprise +0,25 point | Seule la surprise compte. Avec une duration de 8, l'OAT perd 2 %, soit −1,0 % pour le fonds |
| Benali : la vente de Lys, information ou panique ? | Ticket · « vendu à 15 h 41, démenti à 15 h 52 » | Vente sur une rumeur venue d'un compte anonyme, avant le démenti ; −0,5 % |
| Delattre : on était couverts, pourquoi a-t-on perdu autant ? | Couverture · rebond manqué −1,0 %, ou « posée à 16 h 50, jamais levée » | Couverture posée au plus bas et jamais levée : toute la chute, aucun rebond |
| Delattre : le pétrole a perdu 3 %, c'est lui qui nous a coulés ? | Régression · bêta Brent 0,03 (ou la courbe · −0,1 %) | Non : 0,03 × −3 % ≈ −0,1 %, la plus petite des quatre chutes. **C'est le piège** |
| Delcourt : ta recommandation ? Une chute de 4 % des actions ne doit plus coûter plus de 1 % | Régression · bêta CAC 0,50, puis calcul : (0,50 − 1 ÷ 4) × 10 M€ = **2,5 M€** | Vendre 2,5 M€ de contrats à terme pour ramener le bêta actions à 0,25, avec une règle de levée écrite d'avance ; plus aucun ordre sur une information non vérifiée |

Cours ajoutés au comité : International economics, Microéconomie, Conjoncture macroéconomique, Mathématiques appliquées à l'économie, Approche du monde du travail.

- [ ] Les situations sont-elles réalistes pour un stagiaire de L3 ?
- [ ] Les raisonnements sont-ils exacts, notamment la surprise BCE, la duration, le bêta et le montant de la couverture ?
- [ ] Le niveau est-il juste, entre lycéen curieux et étudiant de licence ?

## 4. Les chiffres à vérifier

| Sujet | Chiffre du jeu |
|---|---|
| Fonds | 10 M€ ; 1 % = 100 000 € |
| BCE | +0,50 point annoncé, +0,25 point attendu ; OAT de duration 8 : −2 % ; actions −0,25 % |
| Hausse du taux à 10 ans | Le jeu suppose que le taux à 10 ans monte autant que la surprise (0,25 point). C'est une simplification : en réalité, il bouge souvent moins |
| Régression | 60 séances inventées ; bêtas 0,45 (OAT), 0,50 (CAC 40), 0,03 (Brent) |
| Banque Lys | 20 000 titres ; 25,00 € à 15 h, 22,50 € à la vente (15 h 41), 22,30 € au plus bas (15 h 52), 24,80 € à la clôture |
| Krach | CAC 40 −4 % de 16 h 20 à 16 h 50, puis −1,5 % à la clôture ; couverture de 4 M€ (100 % des actions) |
| Recommandation | Bêta visé = 1 % ÷ 4 % = 0,25 ; à couvrir = (0,50 − 0,25) × 10 M€ = 2,5 M€ |

- [ ] Ces ordres de grandeur sont-ils plausibles pour 2027 ?

## 5. Mention

La mention récompense la justesse du raisonnement, pas la vitesse ni l'argent. Le joueur peut gagner 32 points :

| Moment | Points | Ce qui en retire |
|---|---|---|
| La courbe (4 mesures) | 4 | 0,5 par mesure fausse |
| La BCE (3 calculs) | 3 | 0,5 par calcul faux |
| La régression | 2 | rien |
| La Banque Lys (ticket, curseur, calcul) | 3 | 0,5 par erreur |
| Le krach (ticket, 2 mesures, calcul) | 4 | 0,5 par erreur |
| Le comité (5 questions) | 15 | 3 par question ; 1 par pièce ou chiffre faux |
| Le calcul de la recommandation | 1 | 0,5 par calcul faux |

Une pièce qui manque au dossier vaut 0 à l'étape correspondante et à la question du comité qui en dépend.

| Mention | Score sur 100 |
|---|---|
| Très bien | 85 et plus |
| Bien | 65 à 84 |
| Assez bien | 45 à 64 |
| De justesse | moins de 45 |

## 6. Ce que le jeu ne couvre pas

Ces cours sont absents ou seulement effleurés, pour garder un seul dossier en 7 minutes :
- droit de l'entreprise ;
- audit ;
- théorie des organisations et management ;
- management interculturel ;
- RSE ;
- gestion des coûts ;
- recherche opérationnelle ;
- parcours Prépa Grandes Écoles.

L'ancienne version (glisser des lignes vers le haut ou le bas) couvrait aussi la VAN d'une start-up : Investment Appraisal, Fiscalité d'Entreprise, Analyse financière, Ateliers création d'entreprise et La monnaie. Ces cours ne sont plus dans le jeu.

## 7. Questions ouvertes pour l'enseignant

1. La simplification « le taux à 10 ans monte de toute la surprise » est-elle acceptable pour des lycéens ?
2. La couverture par contrats à terme sur l'indice et le calcul (bêta actuel − bêta visé) × encours sont-ils présentés au bon niveau pour la L3 ?
3. Faut-il réintégrer la VAN, par exemple avec une quatrième question du comité sur un investissement ?
4. Le parcours Sciences Politiques n'apparaît qu'avec la rumeur. Faut-il un moment de plus, par exemple une élection qui fait bouger les taux ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
