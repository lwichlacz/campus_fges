# Fiche de validation · Mini-jeu « L'Enquête de l'auditeur » (Licence Comptabilité-Finance-Audit, ISEA)

**À relire par :** un enseignant de la Licence Comptabilité-Finance-Audit
**Objectif du jeu :** montrer à un lycéen que la comptabilité, c'est de l'enquête : chaque chiffre a une pièce, chaque écart a une explication.
**Scénario :** la trésorerie de « La Fabrique à Gaufres » (PME **fictive**, 12 salariés à Lille) fond sans raison. Le joueur, auditeur en alternance, mène l'enquête avec les outils de chaque année de la licence.
**Durée d'une partie :** environ 6 minutes.
**Fichier du jeu :** `js/games/audit.js` (tous les contenus sont dans les fonctions `sortDocs`, `tva`, `bank`, `budget`, `audit`, `board`).

> Toutes les entreprises et personnes sont **fictives** (La Fabrique à Gaufres, Mme Garnier, Julien Morel, Inès Benali, Dupont Conseil Services, Moulins du Nord, Hôtel Bellevue, etc.).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Trier les pièces | L1 | Classe 6 pièces en charge, produit ou investissement | Comptabilité financière |
| La TVA | L1 | Calcule le TTC d'une facture de 400 € HT à 20 % | Fiscalité |
| Rapprochement bancaire | L1 | Relie 4 lignes du relevé (montants TTC) à leurs factures ; isole un virement de 2 940 € sans justificatif | Rapprochement bancaire |
| Budget / réel | L2 | Repère l'écart anormal (prestations de services : 500 € prévus, 3 440 € réels) et le calcule : 2 940 € | Contrôle de gestion |
| Tamponner les pièces | L3 | Contrôle 4 pièces : 2 conformes, 2 anomalies (TVA fausse ; prestation floue sans bon de commande) | — |
| Tableau d'enquête | L3 | Relie le RIB de Dupont Conseil (ou son Kbis) à la fiche du comptable : même IBAN, même adresse | — |
| Déontologie | L3 | Choisit la bonne réaction : documenter les preuves et alerter la gérante dans le rapport | Audit et expertise comptable (alternance) |

- [ ] La progression L1 → L2 → L3 est-elle fidèle à la maquette ?
- [ ] Les intitulés des cours sont-ils les bons ?

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

- [ ] Le terme « investissement » convient-il pour des lycéens, ou faut-il dire « immobilisation » ?
- [ ] Simplification : toutes les factures sont à 20 % de TVA (y compris la farine, qui relève normalement du taux réduit). Faut-il corriger ?

**Rapprochement bancaire** : montants TTC = HT × 1,2 (984 €, 1 380 €, 480 €, 7 680 €) + le virement suspect de 2 940 €.

**Budget du trimestre**

| Poste | Budget | Réel |
|---|---|---|
| Farine et matières | 3 000 € | 3 150 € |
| Électricité | 1 200 € | 1 260 € |
| Emballages | 900 € | 880 € |
| Prestations de services | 500 € | 3 440 € |
| Salaires | 21 000 € | 21 000 € |

- [ ] La notion d'écart « favorable / défavorable » doit-elle apparaître ?

**Audit des pièces** : facture Imprimerie Lilloise 300 € HT avec 66 € de TVA (au lieu de 60 €) ; facture Dupont Conseil n° 118 de 2 450 € HT, « mission de conseil » sans détail ni bon de commande.

- [ ] Les anomalies choisies sont-elles représentatives du travail d'un auditeur junior ?
- [ ] La conclusion déontologique (preuves, alerte de la gérante, pas de diffusion publique) est-elle juste ? Faut-il évoquer le commissaire aux comptes et la révélation au procureur ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 6 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est un mauvais classement, un mauvais rapprochement, une mauvaise ligne de budget, un mauvais tampon, un mauvais lien ou une mauvaise réponse.

## 4. Questions ouvertes pour l'enseignant

1. Une situation vécue en alternance (cabinet ou entreprise) qu'on pourrait mettre en scène ?
2. Faut-il un passage sur le bilan (actif / passif), en plus du compte de résultat ?
3. Le ton « enquête policière » vous convient-il pour présenter le métier ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
