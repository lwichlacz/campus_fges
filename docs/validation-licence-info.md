# Fiche de validation · Mini-jeu « Projet Gaming » (Licence Informatique, École du Numérique)

**À relire par :** un enseignant de la Licence Informatique
**Objectif du jeu :** montrer à un lycéen ce qu'on fait concrètement en licence, à partir du Projet Gaming de L1 : programmer, interroger une base de données, sécuriser, exploiter des données.
**Scénario :** le jeu vidéo de l'équipe du joueur (un jeu de balle à deux raquettes) bugue, n'a pas de tableau des scores, puis attire des tricheurs. Joueurs, pseudos et scores sont **fictifs**.
**Durée d'une partie :** environ 7 minutes.
**Où le trouver :** dans l'intérieur de Wenov (épingle « Projet Gaming »), dans l'onglet Jeux et sur la fiche de la formation.
**Fichier du jeu :** `js/games/gaming.js` (missions `mission1` à `mission4`, données `SCORES`, `SECRET`, `PLAYERS` en haut du fichier).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Mission | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| La balle traverse la raquette | L1 | Complète 3 trous d'une fonction de rebond (bornes de la raquette, nouvelle vitesse), puis la teste : le code choisi est exécuté sur trois tirs (sur la raquette, au-dessus, en dessous). | Programmation et Projet Gaming |
| Le podium des meilleurs joueurs | L1 | Compose une requête SQL (SELECT, FROM, ORDER BY, LIMIT) ; le résultat s'affiche. | Bases de données |
| Un message codé dans le chat | L2 | Déchiffre un message codé par décalage (code de César) avec un curseur, puis choisit comment stocker les mots de passe. | Cryptologie (parcours Cyber) |
| Des tricheurs dans le classement | L3 | Règle deux seuils (précision des tirs, temps de réaction) pour signaler les 5 tricheurs sans accuser plus d'un joueur honnête, puis choisit la conduite à tenir face à un faux positif. | Machine learning (parcours Data) |

- [ ] Les missions sont-elles représentatives de la licence et du Projet Gaming ?
- [ ] Les années associées sont-elles justes (cryptologie en L2, machine learning en L3) ?
- [ ] Les intitulés des cours et des parcours (Data, Cyber, IoT et réalité virtuelle) sont-ils exacts ?

## 2. Les contenus à vérifier

**Mission 1** : code de la forme `if (balle.x <= raquette.x + raquette.largeur && balle.y >= raquette.y && balle.y <= raquette.y + raquette.hauteur) { balle.vx = -balle.vx; }` (syntaxe proche du JavaScript).
- [ ] Le langage et la syntaxe conviennent-ils (faut-il du Python, enseigné en L1) ?
- [ ] Les messages d'erreur sont-ils pédagogiquement justes ?

**Mission 2** : `SELECT pseudo, score FROM scores ORDER BY score DESC LIMIT 3;`. Pièges : table « joueurs » inexistante, ASC au lieu de DESC, LIMIT 1 ou 10, colonne niveau seule. `SELECT *` est accepté avec une remarque.
- [ ] La requête et les pièges sont-ils adaptés à des lycéens ?

**Mission 3** : « LE TOURNOI COMMENCE A MIDI » chiffré avec un décalage de 3. Puis : stocker les mots de passe hachés avec un sel (et non en clair, ni chiffrés par César).
- [ ] L'explication du hachage et du sel est-elle juste et suffisante ?
- [ ] Faut-il citer un algorithme (bcrypt, Argon2) ?

**Mission 4** : 28 joueurs (précision de 44 à 98 %, réaction de 95 à 380 ms), dont 5 tricheurs et 2 joueurs professionnels proches de la zone. Exemple de réglage qui réussit : précision ≥ 91 %, réaction ≤ 150 ms. Conclusion : faux positifs et vérification humaine avant toute sanction.
- [ ] Présenter deux seuils réglés à la main comme du « machine learning » est-il acceptable, ou faut-il parler de « règle de décision » et ajouter une étape d'apprentissage ?
- [ ] Le vocabulaire (faux positifs, détecteur) est-il juste ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 6 erreurs au plus |
| Assez bien | Au-delà |

Une erreur : un test du code qui échoue, une requête fausse, un mauvais décalage, une mauvaise réponse, un détecteur refusé.

## 4. Questions ouvertes pour l'enseignant

1. Le Projet Gaming de L1 : quel moteur ou langage utilisent les étudiants ? Des captures d'un vrai projet permettraient d'en rapprocher le jeu.
2. Faut-il une mission sur le parcours IoT et réalité virtuelle ?
3. Le ton « studio de jeu vidéo » vous convient-il pour présenter la licence ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
