# Fiche de validation · Mini-jeu « La cellule de crise » (Licence Management & Humanités, FGES)

**À relire par :** un enseignant de la Licence Management & Humanités (gestion et philosophie)
**Objectif du jeu :** montrer à un lycéen que le management éclairé croise la gestion et les humanités. Il faut trier l'information, décider sans tout savoir, parler juste à chacun et convaincre sans mentir.
**Scénario :** un lundi à 8 h, une vidéo montre des boîtes abîmées de la « Chocolaterie Verbrugge » (entreprise **fictive**, Roubaix). Dans la salle du conseil de l'Hôtel Académique, le joueur dirige la cellule de crise avec Mme Lambert, DRH et ancienne élève (personnage fictif).
**Origine :** reprend l'exercice « messagerie de crise » du FGES Lab (`fges_games/fges-lab-man.html`), qui avait bien plu, en 3D.
**Geste unique :** le joueur **lance** les objets posés sur la table vers leur cible, d'un coup de doigt. Il peut aussi toucher l'objet puis la cible.
**Durée d'une partie :** environ 8 minutes.
**Fichier du jeu :** `js/games/crise.js`. Tous les textes sont dans `MESSAGES`, `PHILO`, `EVENTS`, `TEAM`, `REPLIES`, `FRAGS` et `COURSES`.

> L'entreprise, les personnes et les chiffres sont **fictifs** : Chocolaterie Verbrugge, Mme Lambert, Karim, Léa, Sami, Nadia, Chloé, Marc, Inès.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Moment | Ce que fait le joueur | Cours révélés |
|---|---|---|
| 1 · Trier l'info | 6 messages arrivent en avions de papier. Il lance les faits (sourcés, chiffrés) vers le dossier et les rumeurs vers la corbeille. | Erreur humaine : épistémologie de l'erreur et de l'illusion (L2) · Statistiques descriptives (L1) |
| 2 · Décider | Faut-il rappeler le lot ? Une balance porte déjà les chiffres (coût du rappel, réclamations). Il lance 2 ou 3 arguments de philosophes dans le plateau que chacun défend. Un coup du sort tombe ensuite au hasard, puis le conseil tranche. | Gestion des coûts / budgétaire (L2) · Éthique de la conviction vs de la responsabilité (L3) · Le principe d'incertitude (L2) |
| 3 · L'équipe | Trois collègues l'interpellent tour à tour, 25 s chacun. Il lance la réponse au bon ton (empathique, rationnel, ferme) vers la personne qui parle. Avec un mauvais ton, le collègue quitte la salle. | Management humain : entre bienveillance et exigence (L3) · Management de la fonction RH (L2) |
| 4 · Le communiqué | Il lance 3 fragments sur un panneau qui ne tient que sur pathos, logos et ethos. Le déni, le mensonge ou l'agressivité le font vaciller. | Augmenter, persuader, convaincre (L3) · Communication d'entreprise (L2) · Éthique des affaires (L3) |
| Bilan | Niveau de crise, climat d'équipe, décision prise, étoiles et rang (Manager en devenir, confirmé, Directeur de crise). | — |

- [ ] Les intitulés et années des cours sont-ils les bons ?
- [ ] Faut-il ajouter un cours (Pensée complexe et systémique, Délibérer choisir agir, Management de la qualité…) ?

## 2. Les contenus à vérifier

**Moment 1 · Faits et rumeurs** (3 faits et 3 rumeurs tirés au hasard à chaque partie)

| Type | Auteur | Message |
|---|---|---|
| Fait | Karim · Qualité | Contrôle du lot B : 15 % des boîtes sont mal scellées. Le chocolat a pu blanchir. |
| Fait | Léa · Service client | 230 réclamations en 24 h, toutes enregistrées dans le logiciel du SAV. |
| Fait | Sami · Logistique | Le reste du lot B est bloqué en entrepôt : 4 200 boîtes isolées. |
| Fait | Nadia · Comptabilité | Le lot B représente 38 000 € de chiffre d'affaires, factures à l'appui. |
| Rumeur | Anonyme | J'ai lu sur les réseaux qu'on allait TOUS être licenciés demain !! |
| Rumeur | Compte inconnu | Paraît que le patron aurait déjà vendu l'usine en douce |
| Rumeur | Un influenceur | Ce chocolat serait DANGEREUX, je le sens. Partagez ! |
| Rumeur | Le cousin d'un collègue | Les machines sont pourries depuis des années, tout le monde le sait. |

- [ ] La règle donnée au joueur convient-elle : « un fait est sourcé, daté ou chiffré ; une rumeur, non » ?

**Moment 2 · Les arguments des philosophes**

Chaque argument doit aller dans le plateau qu'il défend. A = rappeler le lot, B = attendre les analyses.

| Philosophe | Argument donné au joueur | Plateau attendu | Explication en cas de contresens |
|---|---|---|---|
| Kant | Dire la vérité est un devoir, même quand elle coûte cher. | A | Le devoir de vérité ne dépend pas des conséquences. |
| Weber | Éthique de responsabilité : tu réponds des conséquences prévisibles, même improbables. | A | Répondre de ce qui peut arriver plaide pour le rappel. |
| Mill | Inquiéter des milliers de clients pour 15 % de boîtes abîmées, est-ce le plus grand bien ? | B | Le calcul des effets sur le bien-être de tous plaide ici pour attendre. |
| Aristote | La prudence, c'est délibérer avant d'agir : une analyse de plus évite une panique. | B | La phronèsis invite à délibérer d'abord. |

Poids de départ : coût du rappel −60 000 € (B, 2) et 230 réclamations (A, 1,5). Coups du sort : une vidéo virale (A, 1,5) ou un labo qui rassure (B, 1).
Si le conseil attend, une chance sur deux : le pari passe, ou une seconde vidéo force un rappel à 110 000 €.

- [ ] **Point délicat :** est-il juste de faire pencher Mill vers « attendre » ? Un utilitariste pourrait aussi plaider le rappel. Faut-il reformuler son argument ?
- [ ] Aristote pour « attendre » : la prudence est-elle bien rendue ?
- [ ] Faut-il ajouter un philosophe vu dans la licence (Arendt, Rawls…) ?

**Moment 3 · Le bon ton**

| Collègue | Ce qu'il dit | Ton attendu | Réponse attendue |
|---|---|---|---|
| Chloé, chargée de communication | C'est la cata, la presse nous appelle sans arrêt… Qu'est-ce qu'on fait ?! | Empathique | Je comprends ton stress, Chloé, on est ensemble. Respire : j'ai un plan, et je prends la presse en charge. |
| Marc, chef d'atelier | C'est la faute de la qualité, point. Je REFUSE de porter le chapeau ! | Ferme | Stop, Marc. On ne cherche pas un coupable, on agit. Chacun assume sa part, maintenant. |
| Inès, conseillère au service client | Je ne sais pas quoi répondre aux clients, c'est flou pour moi. | Rationnel | La marche à suivre : 1) reconnaître le défaut, 2) proposer le remboursement, 3) rassurer. C'est clair ? |

- [ ] Les trois profils et leurs besoins sont-ils crédibles pour un cours de management humain ?
- [ ] Le ton « ferme » face à Marc reste-t-il dans l'esprit « bienveillance et exigence » ?

**Moment 4 · Le communiqué**

| Rôle | Fragment |
|---|---|
| Pathos | Nous comprenons votre déception et la prenons au sérieux. |
| Logos | Le lot B est retiré de la vente : 15 % de ses boîtes étaient mal scellées. (variante si le conseil a attendu : « … le reste du lot est bloqué et analysé ») |
| Ethos | Nous remboursons chaque boîte, car votre confiance passe avant tout. |
| Piège · Déni | Il n'y a aucun problème : ce sont des rumeurs malveillantes. |
| Piège · Mensonge | Nos chocolats sont parfaits et certifiés sans aucun défaut. |
| Piège · Agressivité | Ceux qui se plaignent n'avaient qu'à bien conserver leurs boîtes. |

- [ ] Le remboursement relève-t-il bien de l'ethos (la crédibilité, les valeurs) dans la présentation du cours ?

## 3. Couverture du programme officiel

| Année | Cours | Dans le jeu |
|---|---|---|
| L1 | Statistiques descriptives | Moment 1 (lire 15 % de 4 200 boîtes) |
| L1 | Comptabilité financière · Analyse économique | Moment 2, en filigrane (chiffre d'affaires du lot, coût du rappel) |
| L1 | Introduction à l'éthique · Bases de la communication | Moments 2 et 4 |
| L2 | Erreur humaine : épistémologie de l'erreur et de l'illusion | Moment 1 |
| L2 | Gestion des coûts / gestion budgétaire | Moment 2 |
| L2 | Le principe d'incertitude · Délibérer, choisir, agir | Moment 2 |
| L2 | Management de la fonction RH · Communication d'entreprise | Moments 3 et 4 |
| L3 | Éthique de la conviction vs de la responsabilité · Faudrait-il être utilitariste ? | Moment 2 (Kant, Weber, Mill) |
| L3 | Management humain : entre bienveillance et exigence | Moment 3 |
| L3 | Augmenter, persuader, convaincre · Éthique des affaires | Moment 4 |
| L3 | Management de la qualité | Contexte (lot défectueux, contrôle qualité) |
| — | Géopolitique, Stratégie, Management interculturel, ESS, Humanités numériques, Analyse financière | Non couverts : à discuter |

- [ ] Ces absences sont-elles acceptables pour un jeu de 8 minutes ?

## 4. Remarques libres

…
