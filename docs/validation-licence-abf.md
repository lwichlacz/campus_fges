# Fiche de validation · Mini-jeu « Le guichet du samedi » (Licence Pro Assurance-Banque-Finance, FGES)

**À relire par :** un enseignant de la Licence Pro Assurance-Banque-Finance (spécialité chargé de clientèle)
**Objectif du jeu :** faire vivre à un lycéen une matinée de chargé de clientèle en alternance : conseiller juste, respecter la conformité, et mener une petite enquête de lutte contre le blanchiment.
**Le dossier et la question :** « Qui blanchit ? ». Samedi 14 novembre, 9 h, une agence fictive de Lambersart. Nadia, la tutrice (fictive), tend au joueur une note de la conformité : des fonds suspects transitent par l'agence. Les cinq clients de la matinée apportent des indices, épinglés dans le carnet de Nadia (un carnet posé sur le comptoir, qui s'épaissit et se couvre d'onglets). À midi, le joueur relie chaque soupçon à sa preuve, puis désigne qui signaler à Tracfin.
**Durée d'une partie :** environ 7 minutes (6 à 8).
**Version :** 3D, refonte du 12/11/2026. Plus aucune réponse à choisir sous chrono : chaque étape est un geste du métier (voir § 2).
**Fichiers du jeu :** `js/games/guichet-data.js` (répliques, chiffres, indices, cours : c'est ce fichier qu'il faut relire) et `js/games/guichet.js` (le moteur).

> Personnes, agence, notaire, université et montants **fictifs**. Aucune banque ni aucun assureur réels. Programme relevé sur fges.fr le 10/11/2026.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. L'enquête

**La note de la conformité, à 9 h** (trois alertes du logiciel) :

| | Alerte | Ce qui l'explique |
|---|---|---|
| **A** | 9 500 € en espèces déposés au guichet 2 par un tiers, une fois par mois depuis septembre, sur le compte n° …4471, toujours sous 10 000 € | **Karim, le coupable.** Le compte …4471 est le sien (son RIB). Son prévisionnel annonce 180 000 € de chiffre d'affaires, environ 110 000 € de plus qu'un plombier seul : de quoi faire passer douze dépôts de 9 500 € pour des recettes de chantiers. |
| **B** | 40 000 € arrivés d'un coup, le 3 novembre, sur le compte d'un client retraité | **Fausse piste : M. Duhamel.** Héritage de sa sœur, prouvé par l'attestation du notaire (montant, notaire, défunte pointés). |
| **C** | Une ouverture de compte en ligne annonce des virements réguliers depuis l'Irlande | **Fausse piste : Tom.** Sa bourse Erasmus+ (450 € par mois, d'octobre à juin), prouvée par la lettre de l'université. |

**Les indices épinglés** (11 au plus) : le témoignage de Sami (« le monsieur aux enveloppes, comme le mois dernier »), la phrase de M. Duhamel sur l'héritage et l'attestation du notaire, la phrase de Tom sur sa bourse et la lettre Erasmus+, la phrase de Mme Benali sur son cousin et son numéro de compte …4417 (leurre volontaire, un chiffre inversé), la phrase de Karim (« mes clients me paient souvent en liquide »), son prévisionnel, le bordereau du guichet 2 et son RIB. Les phrases ne sont épinglées que si le joueur les a touchées ; les pièces le sont toujours.

**À midi, le carnet de Nadia :**
1. Relier : le joueur touche un soupçon, puis l'indice qui y répond (ou l'inverse). Quatre liens : A-compte → RIB de Karim ; A-« qu'est-ce qui justifierait ces espèces sur le papier ? » → prévisionnel gonflé ; B → attestation du notaire ; C → lettre Erasmus+. Une phrase ne vaut jamais preuve (« Sa parole ne suffit pas : il faut une pièce »). Après trois erreurs sur un même soupçon, Nadia montre la pièce.
2. Désigner : quatre portraits (M. Duhamel, Tom, Mme Benali, Karim). La déclaration de soupçon se remplit avec les pièces qui concernent la personne choisie (pour un innocent, on y lit « origine justifiée », ou rien du tout). Le joueur maintient « Transmettre à Tracfin ».
3. Verdict : Karim signalé, la banque gèle son projet de prêt et personne ne le prévient (le jeu le rappelle : prévenir le client est un délit). Un innocent signalé : dossier vide chez Tracfin, client de confiance fiché à tort, et le compte …4471 continue d'encaisser.

- [ ] L'enchaînement (note de conformité, indices, rapprochement, déclaration de soupçon) est-il fidèle à ce que fait une agence ?
- [ ] Le rôle de l'alternant est-il crédible ? (Dans la réalité, il alerterait le correspondant Tracfin de sa banque, qui déclare.)
- [ ] Les deux fausses pistes sont-elles honnêtes et bien prouvées ?

## 2. Les cinq clients et les gestes

| Client | Gestes du joueur | Bonne réponse attendue | Cours |
|---|---|---|---|
| **Jade et Sami**, 27-28 ans, achat d'un T3 de 225 000 € (30 000 € d'apport : 20 000 de Jade, 10 000 de Sami) | Toucher 4 phrases (CDD qui finit, apports, témoin du guichet 2, 3 900 € de revenus) ; la radio annonce +0,5 pt (3,6 → 4,1 %) ; régler la durée du prêt de 195 000 € au simulateur ; **colorier sur le plan la part de Jade** dans l'acte | 18 ou 19 ans : 34 % d'endettement, assurance comprise, le moins d'intérêts possible ; 10 jours de réflexion sur l'offre. Indivision : 4/6 pour Jade, 2/6 pour Sami ; PACS, testament : à voir avec le notaire | Entretien Vente, Macroéconomie, Crédit immobilier, Maths financières, Protection du consommateur, Droit de la propriété, Régimes matrimoniaux |
| **M. Duhamel**, 68 ans, 40 000 € d'héritage | Toucher 4 phrases ; **pointer l'attestation du notaire** : chaque ligne avec la pièce qui la confirme (relevé, annuaire des notaires, ce qu'il a dit), parmi des leurres (4 000 € au lieu de 40 000 € ; Me Lefèvre de Lens au lieu de Me Lefebvre de Lille) ; régler la part en unités de compte ; krach de −25 % | Les trois lignes concordent : origine prouvée. 20 % d'UC au plus (profil MIF 2 prudent, horizon 2-3 ans) | Conformité, Marchés des capitaux, Épargne et assurance-vie, Approche patrimoniale |
| **Lucie**, 19 ans (sur la messagerie, pendant M. Duhamel) | Toucher le téléphone à temps (6 s) ; puis **couper dans ses dépenses** 100 € par mois au lieu du crédit renouvelable que l'appli lui propose | Livraisons de repas (72 €) et salle de sport jamais utilisée (30 €) ; les deux plateformes de streaming en trop (24 €) ne suffisent pas seules ; loyer, courses, transport et forfait ne se coupent pas. Alerte de solde, budget lundi en visio | Vente omni-canal, Éducation financière, Crédits aux particuliers |
| **Tom**, Erasmus de Dublin (en anglais) | Toucher 3 phrases ; **comparer ses trois pièces** (passeport, facture d'électricité, lettre de bourse) et toucher ce qui ne colle pas | La facture est au nom de Mme Vasseur, sa logeuse : il faut une attestation d'hébergement signée, avec sa pièce d'identité. On ouvre le compte, on imprime le RIB | Conformité (ouverture de compte), Anglais bancaire |
| **Mme Benali**, dégât des eaux | Toucher 4 phrases ; **compter les 5 jours ouvrés** sur le calendrier de novembre, un par un, à partir du lendemain du sinistre (jeudi 12) ; choisir sa franchise au simulateur ; **vérifier l'attestation décennale** de son cousin | Vendredi 13, lundi 16, mardi 17, mercredi 18, jeudi 19 (le week-end ne compte pas) ; franchise de 150 à 400 € ; l'attestation est expirée (01/01/2025-31/12/2025) | Gestion des sinistres, Principe de l'assurance, Assurances auto et habitation, Assurance construction |
| **Karim**, plombier qui se met à son compte | Toucher 4 phrases ; **trouver la ligne fausse du prévisionnel** ; alerte au guichet 2 : **maintenir « Stop »** (demander l'origine des fonds) ; il tend son RIB | CA de 180 000 € irréaliste (plutôt 60-80 000 €) ; espèces fractionnées sous 10 000 € « pour mon cousin » ; RIB n° …4471 | Création d'entreprise, Analyse financière, Lutte contre le blanchiment, Produits du professionnel |

À midi : le carnet (Conformité · déclaration de soupçon). Le bilan affiche le tableau de bord de satisfaction et le PNB de la matinée (Informatique et statistiques, Gestion de la relation client).

- [ ] Les situations sont-elles réalistes pour un alternant en agence ?
- [ ] Les gestes (pointer, comparer, compter, colorier) sont-ils fidèles au métier ?
- [ ] Les signaux à repérer sont-ils les bons ?

## 3. Les chiffres à vérifier

| Sujet | Chiffre du jeu |
|---|---|
| Crédit immobilier | 195 000 € empruntés à 4,1 % (après une hausse de 0,5 pt), assurance emprunteur 0,30 %/an ; 15 ans → 38 % (refusé) ; 18 ans → 34 % ; 25 ans → 28 % |
| Règle d'endettement | 35 % des revenus, assurance comprise, 25 ans au plus (HCSF) |
| Indivision | 20 000 € + 10 000 € d'apport → 2/3 et 1/3 |
| Assurance-vie | Fonds euros 2,5 %/an, unités de compte 6 %/an espérés, krach de −25 % sur les UC |
| Habitation | Prime de 520 €/an sans franchise, 0,42 € de prime en moins par euro de franchise |
| Délais | Sinistre : 5 jours ouvrés (vol : 2) ; offre de prêt : 10 jours de réflexion ; crédit conso : 14 jours |
| Blanchiment | 9 500 € par mois en espèces (seuil de 10 000 €) ; CA de 180 000 € contre 60-80 000 € attendus, soit ≈ 110 000 € de trop par an |
| Création d'entreprise | 30 000 € sur 5 ans ≈ 6 600 €/an de remboursement |
| Bourse Erasmus+ | 450 € par mois, d'octobre à juin |

- [ ] Ces chiffres sont-ils plausibles pour 2027 ?

## 4. Mention

Chaque client donne une satisfaction de 0 à 100 % (signaux repérés, gestes réussis, simulateur). Score sur 100 : 55 points pour la satisfaction moyenne, 25 pour les soupçons bien reliés (un lien juste du premier coup : plein ; au deuxième : moitié), 20 pour le bon signalement, moins 6 points par manquement de conformité. **Signaler un innocent** retire 25 points et plafonne le score à 44 : mention « De justesse » au mieux.

| Mention | Score |
|---|---|
| Très bien | 85 et plus |
| Bien | 65 à 84 |
| Assez bien | 45 à 64 |
| De justesse | moins de 45 |

Les manquements de conformité : une allocation non conforme au profil MIF 2 de M. Duhamel, laisser passer les espèces fractionnées sans demander leur origine.

## 5. Ce que le jeu ne couvre pas

Marketing (BCC 6, deux parcours) ; culture générale et fiscalité du revenu ne sont qu'effleurées. Le circuit réel d'une déclaration (correspondant Tracfin, gel des avoirs) est simplifié.

## 6. Questions ouvertes pour l'enseignant

1. Un alternant participe-t-il à ce type de rapprochement, ou l'alerte part-elle directement au service conformité ?
2. Faut-il une scène propre au parcours Bancassurance (par exemple un changement d'assurance emprunteur) ?
3. Une phrase entendue en agence qu'on pourrait ajouter comme signal ou comme indice ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
