# Fiche de validation · Mini-jeu « Game Jam 48 h » (Licence Informatique, École du Numérique)

**À relire par :** un enseignant de la Licence Informatique
**Objectif du jeu :** montrer à un lycéen ce qu'on fait concrètement en licence, en partant du Projet Gaming de L1 : concevoir un jeu, le programmer, le mettre en ligne, le faire tenir et le défendre devant un jury.
**Scénario :** le joueur passe un week-end de game jam (vendredi 18 h → dimanche 17 h) dans la salle de l'École du Numérique, avec deux coéquipiers fictifs, Inès (graphisme) et Yanis (son et tests). Sur la table, la maquette 3D du jeu de plateforme de l'équipe : le joueur la construit, la programme, puis y joue lui-même au clavier ou au doigt. La lumière des fenêtres suit les 48 heures. Équipe, joueurs et scores sont fictifs.
**Durée d'une partie :** environ 10 minutes.
**Où le trouver :** dans l'intérieur de Wenov (épingle « Game Jam 48 h »), dans l'onglet Jeux, sur la fiche de la formation, et en lien direct : `?jeu=info`.
**Fichier du jeu :** `js/games/gaming.js` (étapes `mission1` à `mission5`, puis `finale`). Il remplace l'ancien « Projet Gaming » (quiz en cartes 2D).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Heure de la jam | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Le niveau | H+00 · vendredi 18 h | Le niveau dessiné par Inès est infaisable (un trou de 4 cases, un mur de 2 blocs). Le joueur pose jusqu'à 3 blocs en touchant la maquette, puis lance un **parcours en largeur** : on voit la file d'attente évoluer et les colonnes atteignables s'allumer une à une. | Projet Gaming (L1) ; Structures de données et algorithmique (L1-L2) |
| Le héros | H+06 · samedi 00 h | Complète la fonction de physique du héros (gravité, élan du saut, position au sol), exécutée réellement 60 fois par seconde. Yanis teste ; chaque mauvaise valeur produit un bug visible (le héros s'envole, s'enfonce, rebondit, saute trop peu ou trop haut). Ensuite, le joueur **joue le niveau** (ou laisse Yanis le finir). | Programmation (L1) |
| Les scores | H+20 · samedi 14 h | Compose la requête SQL du podium (MAX, GROUP BY, ORDER BY, LIMIT). Le résultat s'affiche sur le grand écran et les 3 joueurs montent sur un podium. L'appel d'API et sa réponse JSON sont montrés. | Bases de données (L1) ; Développement back-end (L2) |
| Le jeu buzze | H+36 · dimanche 6 h | Un streamer fait affluer 5 000 demandes par seconde. Le joueur règle le nombre de serveurs (budget : 3) et active un cache ; les paquets réseau circulent en 3D et tombent quand le serveur sature. Puis un tricheur envoie un score impossible : où faut-il le vérifier ? | Réseaux et cloud (L1-L3) ; Cybersécurité, parcours Cyber (L2) |
| Le jury | H+47 · dimanche 17 h | Le jury (une enseignante, une développeuse de studio, une étudiante de L3) regarde le joueur jouer le niveau, puis note gameplay, technique et thème. | |

- [ ] Cette progression reflète-t-elle bien le Projet Gaming de L1 et la suite de la licence ?
- [ ] Les intitulés et les années des cours sont-ils les bons ?

## 2. Les contenus à vérifier

**H+00 · Le parcours en largeur.** Règle de saut : le héros monte d'un bloc au plus, franchit 2 cases vides au plus, et rien de plus haut ne doit se trouver entre le départ et l'arrivée. La file part de la colonne 0 ; le niveau est faisable si la colonne 15 (drapeau) est atteinte. Le plus court chemin (en nombre de sauts) est surligné. Deux blocs suffisent (par exemple colonnes 5 et 8).
- [ ] Le parcours en largeur est-il vu en L1 (structures de données) ou en L2 (algorithmique avancée) ?
- [ ] Le vocabulaire « file d'attente », « parcours en largeur » convient-il pour des lycéens ?

**H+06 · La physique.** Unités en blocs et en secondes. Valeurs justes : gravité 20, élan 8 (saut d'environ 1,6 bloc), `heros.y = sol`. Pièges : gravité -20 ou 0, élan 3 ou 25, `heros.y = 0` ou `heros.y + 1`.
- [ ] Le code (JavaScript simplifié, `dt` en secondes) est-il lisible pour un lycéen ? Faut-il plutôt du Python, enseigné en L1 ?
- [ ] Quel moteur ou langage les L1 utilisent-ils pour le Projet Gaming ? Des captures d'un vrai projet permettraient d'en rapprocher le jeu.

**H+20 · Le SQL.** Table `parties(pseudo, score)` de 11 lignes. Requête attendue : `SELECT pseudo, MAX(score) AS meilleur FROM parties GROUP BY pseudo ORDER BY meilleur DESC LIMIT 3`. Chaque erreur a son explication : doublon sans GROUP BY, une seule ligne avec MAX sans GROUP BY, colonne non agrégée avec GROUP BY, SUM qui favorise les gros joueurs, ASC, LIMIT.
- [ ] Le message « avec GROUP BY, chaque colonne doit être regroupée ou calculée » est-il juste et suffisant ?

**H+36 · Le serveur.** Modèle simplifié : un serveur traite 1 000 demandes par seconde ; le cache évite 65 % des demandes (le podium est recalculé toutes les 10 s) ; temps de réponse ≈ 30 ms / (1 − charge), objectif sous 200 ms, soit 85 % de charge au plus. Seule solution dans le budget : cache et 3 serveurs (charge 58 %, 72 ms). Question cyber : la vérification se fait côté serveur (« jamais confiance au client »).
- [ ] Les chiffres et la formule simplifiée de la latence vous semblent-ils acceptables pour une illustration ?
- [ ] Faut-il parler de « répartition de charge » (load balancing) et de « mise à l'échelle » ?

**H+47 · Le jury.** Notes : gameplay 10 à 20 (pièces ramassées, chutes), technique 10 à 20 (selon les erreurs), thème 17.
- [ ] Le Projet Gaming se termine-t-il bien par une présentation devant un jury ? Qui le compose ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 6 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est un niveau déclaré faisable à tort, un test de physique raté, une requête SQL fausse, un déploiement refusé (trop lent ou hors budget) ou une mauvaise réponse sur le tricheur. Les chutes en jouant ne comptent pas.

## 4. Questions ouvertes pour l'enseignant

1. L'école organise-t-elle une vraie game jam (Global Game Jam, jam interne) ? Le nom, la date ou des photos rendraient le jeu plus concret.
2. Les parcours de L2 (Data, Cyber, IoT et réalité virtuelle) sont-ils bien représentés ? Faut-il une étape « réalité virtuelle » ou « données » ?
3. Le ton « week-end entre étudiants » (pizzas, Yanis qui s'endort) vous convient-il pour présenter la licence ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
