# Fiche de validation · Mini-jeu « L'Enquête de l'auditeur » (Licence Comptabilité-Finance-Audit, ISEA)

**À relire par :** un enseignant de la Licence Comptabilité-Finance-Audit
**Objectif du jeu :** montrer à un lycéen que la comptabilité, c'est de l'enquête : chaque chiffre a une pièce, chaque écart a une explication.
**Scénario :** la trésorerie de « La Fabrique à Gaufres » (PME **fictive**, 12 salariés à Lille) fond sans raison. Le joueur, auditeur en alternance, mène l'enquête avec les outils de chaque année de la licence.
**Durée d'une partie :** environ 8 minutes.
**Version :** 3D (novembre 2026). Le joueur est à son bureau de cabinet d'audit, au bâtiment Michel Falise : il manipule les pièces de la main (glisser, taper, tamponner, tendre un fil). La fiche à droite est une feuille de travail d'auditeur (références A à G) ; la responsable, C. Roussel, y laisse des notes de revue à l'encre rouge.
**Fichier du jeu :** `js/games/audit.js` (contenus en tête du fichier : `PIECES`, `AUDIT_DOCS`, et dans les fonctions `tri`, `tva`, `bank`, `budget`, `stamp`, `board`).

> Toutes les entreprises et personnes sont **fictives** (La Fabrique à Gaufres, Mme Garnier, Julien Morel, Sylvie Dupont, Inès Benali, C. Roussel, Dupont Conseil Services, Banque des Flandres, Moulins du Nord, Hôtel Bellevue, etc.). Le Kbis est marqué « FICTIF » et son numéro RCS commence par 000.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Trier les pièces | L1 | Glisse 6 factures dans trois bannettes : charges, produits, immobilisations | Comptabilité financière |
| La TVA | L1 | Calcule sur une calculatrice 3D le TTC d'une facture de 400 € HT à 20 % ; le jeu signale ensuite le taux réduit de 5,5 % de l'alimentaire | Fiscalité |
| Rapprochement bancaire | L1 | Tire un trait de crayon de 4 lignes du relevé (montants TTC) vers leurs factures ; isole un virement de 2 940 € sans justificatif | Rapprochement bancaire |
| Budget / réel | L2 | Touche la barre anormale d'un graphique budget / réel en 3D (prestations de services : 500 € prévus, 2 950 € réels), puis calcule l'écart à la calculatrice : 2 450 € HT, soit la facture Dupont payée 2 940 € TTC | Contrôle de gestion |
| Tamponner les pièces | L3 | Frappe chaque pièce du bon tampon parmi quatre : CONFORME, TVA ERRONÉE, SANS JUSTIFICATIF, DOUBLON. 2 conformes, 2 anomalies | — |
| Tableau d'enquête | L3 | Lit de près le Kbis de Dupont Conseil Services, puis tend deux fils rouges : RIB ↔ fiche du comptable (même IBAN) et Kbis ↔ fiche du comptable (même adresse) | Droit des sociétés (L3) |
| Déontologie | L3 | Choisit la bonne réaction : documenter les preuves et alerter la gérante dans le rapport | Pratique de l'expertise comptable (L3 en alternance) |

- [ ] La progression L1 → L2 → L3 est-elle fidèle à la maquette ?
- [ ] Les intitulés des cours sont-ils les bons ?

**Le Kbis (fictif) affiché au tableau**

| Rubrique | Contenu |
|---|---|
| Greffe | Tribunal de commerce de Lille Métropole |
| Immatriculation | 000 482 117 R.C.S. Lille Métropole, le 04/08/2026 |
| Dénomination, forme | Dupont Conseil Services, SARL à associé unique (EURL), capital 1 000 € |
| Siège | 14 rue des Lilas, 59000 Lille (l'adresse de Julien Morel) |
| Gérante | Sylvie Dupont, domiciliée à la même adresse |
| Activité | Conseil pour les affaires et autres conseils de gestion, débutée le 04/08/2026, aucun salarié |

Le jeu conclut à une **société écran** montée avec un **prête-nom**.

- [ ] Les rubriques et leur présentation sont-elles assez proches d'un vrai Kbis ?
- [ ] Le vocabulaire « société écran » et « prête-nom » convient-il ?

## 2. Les contenus à vérifier

**Tri des pièces**

| Pièce | Montant HT | Classement attendu |
|---|---|---|
| Farine (Moulins du Nord) | 820 € | Charge |
| Vente de 48 coffrets (Hôtel Bellevue) | 1 150 € | Produit |
| Four professionnel | 6 400 € | Investissement (immobilisation amortie) |
| Électricité du trimestre | 1 260 € | Charge |
| Ventes de la boutique (ticket Z) | 2 380 € | Produit |
| Camionnette de livraison | 18 000 € | Investissement |

- [ ] La bannette s'appelle « Immobilisations » : le terme convient-il pour des lycéens, avec l'explication « amortie sur sa durée d'utilisation » ?
- [ ] Les taux de TVA sont-ils justes ? Farine (achat) et gaufres (vente) au taux réduit de 5,5 % ; emballages, électricité, four, camionnette, flyers et conseil à 20 %.

**Rapprochement bancaire** : montants TTC, farine et gaufres à 5,5 % (865,10 € et 1 213,25 €), emballages et four à 20 % (480 € et 7 680 €), + le virement suspect de 2 940 €.

**Budget du trimestre** (hors taxe, comme toujours en gestion)

| Poste | Budget | Réel |
|---|---|---|
| Farine et matières | 3 000 € | 3 150 € |
| Électricité | 1 200 € | 1 260 € |
| Emballages | 900 € | 880 € |
| Prestations de services | 500 € | 2 950 € |
| Salaires | 21 000 € | 21 000 € |

- [ ] La notion d'écart « favorable / défavorable » doit-elle apparaître ?

**Audit des pièces** : facture Imprimerie Lilloise 300 € HT avec 66 € de TVA (au lieu de 60 €) ; facture Dupont Conseil n° 118 de 2 450 € HT, « mission de conseil » sans détail ni bon de commande. La facture de farine (820 € HT, TVA 5,5 % : 45,10 €, 865,10 € TTC, bon de commande signé) et une note de frais justifiée sont conformes.

- [ ] Les anomalies choisies sont-elles représentatives du travail d'un auditeur junior ?
- [ ] La conclusion déontologique (preuves, alerte de la gérante, pas de diffusion publique) est-elle juste ? Faut-il évoquer le commissaire aux comptes et la révélation au procureur ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 6 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est un mauvais classement, un mauvais calcul validé, un mauvais rapprochement, une mauvaise barre de budget, un mauvais tampon, un mauvais fil ou une mauvaise réponse. Le rapport affiche aussi les preuves réunies (5 au total : virement sans justificatif, écart de budget, facture Dupont, même IBAN, même adresse).

## 4. Questions ouvertes pour l'enseignant

1. Une situation vécue en alternance (cabinet ou entreprise) qu'on pourrait mettre en scène ?
2. Faut-il un passage sur le bilan (actif / passif), en plus du compte de résultat ?
3. Le ton « enquête policière » vous convient-il pour présenter le métier ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
