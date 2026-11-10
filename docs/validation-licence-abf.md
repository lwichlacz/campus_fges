# Fiche de validation · Mini-jeu « Le guichet du samedi » (Licence Pro Assurance-Banque-Finance, FGES)

**À relire par :** un enseignant de la Licence Pro Assurance-Banque-Finance (spécialité chargé de clientèle)
**Objectif du jeu :** faire vivre à un lycéen une matinée de chargé de clientèle en alternance : écouter, conseiller juste, respecter la conformité.
**Scénario :** samedi, 9 h, une agence fictive de Lambersart. Le joueur est l'alternant au guichet ; Nadia, sa tutrice (fictive), commente. Cinq clients font la queue. Entre deux, le téléphone vibre, la radio annonce une hausse des taux et un inconnu dépose des espèces au guichet voisin.
**Durée d'une partie :** environ 4 minutes, une action toutes les quelques secondes.
**Version :** 3D (novembre 2026). Quatre gestes : toucher au bon moment les phrases importantes du client, répondre sous chrono, régler le simulateur (les chiffres bougent en direct), maintenir « Stop » pour une alerte de conformité.
**Fichiers du jeu :** `js/games/guichet-data.js` (toutes les répliques, tous les chiffres et les cours : c'est ce fichier qu'il faut relire) et `js/games/guichet.js` (le moteur).

> Personnes, agence et montants **fictifs**. Aucune banque ni aucun assureur réels. Programme relevé sur fges.fr le 10/11/2026.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Les cinq clients

| Client | Ce que fait le joueur | Bonne réponse attendue | Cours |
|---|---|---|---|
| **Jade et Sami**, 27-28 ans, achat d'un T3 de 195 000 € | Repérer 3 signaux (CDD qui finit, pas mariés, 3 900 € de revenus) ; la radio annonce +0,5 pt (3,6 → 4,1 %) ; régler la durée du prêt ; deux objections | 18 ou 19 ans : 34 % d'endettement, assurance emprunteur comprise (0,30 %/an), le moins d'intérêts possible. 10 jours de réflexion sur l'offre, 10 jours de rétractation après le compromis. Indivision selon les apports, conseil d'en parler au notaire | Entretien Vente, Macroéconomie, Crédit immobilier, Maths financières, Protection du consommateur, Droit de la propriété, Régimes matrimoniaux |
| **M. Duhamel**, 68 ans, 40 000 € d'héritage | Repérer 3 signaux (horizon 2-3 ans, jamais placé en Bourse, retraite suffisante) ; profil d'abord ; régler la part en unités de compte ; krach de −25 % puis appel paniqué | Questionnaire de profil MIF 2 avant toute proposition ; 20 % d'UC au plus ; « votre fonds en euros est garanti, on ne vend pas au plus bas » | Conformité, Marchés des capitaux, Épargne et assurance-vie, Approche patrimoniale |
| **Lucie**, 19 ans (sur la messagerie, pendant M. Duhamel) | Toucher le téléphone à temps (6 s), puis répondre : −400 €, crédit renouvelable proposé | Refuser le renouvelable, activer les alertes de solde, proposer un rendez-vous budget en visio | Vente omni-canal, Éducation financière, Crédits aux particuliers |
| **Tom**, Erasmus de Dublin (en anglais) | Repérer 3 signaux ; deux réponses en anglais | Passeport, carte étudiante, justificatif de domicile ; donner un RIB. Pièges : demander le code PIN (manquement), vendre une assurance-vie (survente) | Anglais bancaire et financier |
| **Mme Benali**, dégât des eaux | Repérer 4 signaux ; délai de déclaration ; choisir la franchise du nouveau contrat ; l'artisan | 5 jours ouvrés (2 pour un vol) ; franchise de 150 à 400 € (elle a 1 500 € d'épargne et des fuites à répétition) ; garantie décennale de l'artisan | Gestion des sinistres, Principe de l'assurance (mutualisation), Assurances auto et habitation, Assurance construction |
| **Karim**, plombier qui se met à son compte | Repérer 3 signaux ; trouver la ligne fausse du prévisionnel ; alerte espèces au guichet voisin ; équipement du pro | CA de 180 000 € irréaliste pour un plombier seul (plutôt 60-80 000 €) ; maintenir « Stop » face à 9 500 € fractionnés (origine des fonds, Tracfin sans prévenir le client) ; compte pro, prêt au nom de l'entreprise, RC pro et décennale | Création d'entreprise, Analyse financière, Lutte contre le blanchiment, Marché et produits du professionnel |

À la fin, le joueur lit le tableau de bord de satisfaction et touche le client le moins bien servi (Informatique et statistiques, Gestion de la relation client).

- [ ] Les situations sont-elles réalistes pour un alternant en agence ?
- [ ] Les bonnes réponses sont-elles exactes ? Les mauvaises sont-elles crédibles sans être caricaturales ?
- [ ] Les signaux à repérer sont-ils les bons ?

## 2. Les chiffres à vérifier

| Sujet | Chiffre du jeu |
|---|---|
| Crédit immobilier | 195 000 € à 4,1 % (après une hausse de 0,5 pt), assurance emprunteur 0,30 %/an ; 15 ans → 38 % (refusé) ; 18 ans → 34 % ; 25 ans → 28 % |
| Règle d'endettement | 35 % des revenus, assurance comprise, 25 ans au plus (HCSF) |
| Assurance-vie | Fonds euros 2,5 %/an, unités de compte 6 %/an espérés, krach de −25 % sur les UC |
| Habitation | Prime de 520 €/an sans franchise, 0,42 € de prime en moins par euro de franchise |
| Délais | Sinistre : 5 jours ouvrés (vol : 2) ; offre de prêt : 10 jours de réflexion ; compromis : 10 jours de rétractation ; crédit conso : 14 jours |
| Création d'entreprise | 30 000 € sur 5 ans ≈ 6 600 €/an de remboursement |

- [ ] Ces chiffres sont-ils plausibles pour 2027 ?

## 3. Mention

Chaque client donne une satisfaction de 0 à 100 % : signaux repérés, réponses (juste : tous les points, à moitié : la moitié), simulateur (3 points). Score final : 90 % de la satisfaction moyenne + 10 % pour le tableau de bord, moins 8 points par manquement de conformité.

| Mention | Score |
|---|---|
| Très bien | 85 et plus |
| Bien | 65 à 84 |
| Assez bien | 45 à 64 |
| De justesse | moins de 45 |

Les manquements de conformité : promettre une annulation sans frais, conseiller sans profil, proposer des cryptos à un client prudent, promettre que « ça remonte toujours », ouvrir un compte sans justificatifs, demander un code PIN, une allocation non conforme au profil, laisser passer les espèces fractionnées. La survente (assurance-vie à un Erasmus, épargne retraite à un créateur sans trésorerie) est comptée à part.

## 4. Ce que le jeu ne couvre pas

Marketing (BCC 6, deux parcours) ; culture générale et fiscalité du revenu ne sont qu'effleurées. Volontaire, pour tenir en 4 minutes.

## 5. Questions ouvertes pour l'enseignant

1. Le guichet d'agence avec des clients debout est-il fidèle à ce que vivent vos alternants, ou faut-il un bureau de rendez-vous ?
2. Faut-il une scène propre au parcours Bancassurance (par exemple un changement d'assurance emprunteur) ?
3. Une phrase entendue en agence qu'on pourrait ajouter comme signal à repérer ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
