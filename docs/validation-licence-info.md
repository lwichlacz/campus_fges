# Fiche de validation · Mini-jeu « Game Jam 48 h » (Licence Informatique, École du Numérique)

**À relire par :** un enseignant de la Licence Informatique
**Objectif du jeu :** montrer à un lycéen ce qu'on fait concrètement en licence, en partant du Projet Gaming de L1 : concevoir un jeu, le programmer, l'habiller en 3D, le mettre en ligne, le faire tenir et le défendre devant un jury.
**Scénario :** le joueur passe un week-end de game jam (vendredi 18 h → dimanche 17 h) dans la salle de l'École du Numérique, avec deux coéquipiers fictifs, Inès (graphisme) et Yanis (son et tests). Sur la table, la maquette 3D du jeu de plateforme de l'équipe : le joueur la construit, la programme, puis y joue lui-même au clavier ou au doigt. La lumière des fenêtres suit les 48 heures ; le style graphique choisi (Néon, Briques de Lille, Jungle) habille toute la salle. Équipe, joueurs et scores sont fictifs.
**Durée d'une partie :** environ 12 minutes.
**Où le trouver :** dans l'intérieur de Wenov (épingle « Game Jam 48 h »), dans l'onglet Jeux, sur la fiche de la formation, et en lien direct : `?jeu=info`.
**Fichier du jeu :** `js/games/gaming.js` (étapes `mission1`, `mission2`, `mission3`, `missionVR`, `mission4`, `mission5`, puis `finale` et l'éditeur `freeEditor`). Il remplace l'ancien « Projet Gaming » (quiz en cartes 2D).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Heure de la jam | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Le niveau | H+00 · vendredi 18 h | Le niveau dessiné par Inès est infaisable (un trou de 4 cases, un mur de 2 blocs). Le joueur pose jusqu'à 3 blocs en touchant la maquette, puis lance un **parcours en largeur** : on voit la file d'attente évoluer et les colonnes atteignables s'allumer une à une. | Projet Gaming (L1) ; Structures de données et algorithmique (L1-L2) |
| Le héros | H+06 · samedi 00 h | Complète la fonction de physique du héros **en Python** (gravité, élan du saut, position au sol), exécutée réellement 60 fois par seconde. Yanis teste ; chaque mauvaise valeur produit un bug visible. Ensuite, le joueur **joue le niveau**, poursuivi par un **ennemi** qui calcule son chemin avec le même parcours en largeur (son chemin s'allume en rouge) ; on peut l'écraser en lui sautant dessus. Yanis peut aussi finir le niveau. | Programmation, Python (L1) |
| Les scores | H+20 · samedi 14 h | Compose la requête SQL du podium (MAX, GROUP BY, ORDER BY, LIMIT). Le résultat s'affiche sur le grand écran et les 3 joueurs montent sur un podium. L'appel d'API et sa réponse JSON sont montrés. | Bases de données (L1) ; Développement back-end (L2) |
| L'ambiance | H+28 · samedi 22 h | La salle s'assombrit : le joueur règle la hauteur et la couleur de la lumière, le brouillard et la caméra pour respecter la demande d'Inès (coucher de soleil, brume légère, caméra à hauteur du héros comme dans un casque). La maquette change en direct. Puis un tour du niveau avec cette caméra. | Réalité virtuelle et 3D, parcours IoT et VR (L2-L3) |
| Le jeu buzze | H+36 · dimanche 6 h | Un streamer fait affluer 5 000 demandes par seconde. Le joueur règle le nombre de serveurs (budget : 3) et active un cache ; les paquets réseau circulent en 3D et tombent quand le serveur sature (alarme). Un tricheur envoie un score impossible : où le vérifier ? Puis il modifie un vrai score en route : le joueur **recalcule les signatures** de trois scores, rejette le faux, et explique pourquoi le tricheur ne peut pas signer lui-même. | Réseaux et cloud (L1-L3) ; Cybersécurité (L2) ; Cryptologie (L2) |
| Le jury | H+47 · dimanche 17 h | Le jury (une enseignante, une développeuse de studio, une étudiante de L3) regarde le joueur jouer le niveau, puis note gameplay, technique et thème. | |
| Bonus | après le bilan | **Éditeur de niveau libre** : ajouter ou retirer des blocs, tester son niveau, puis obtenir un lien à partager. Le parcours en largeur refuse un niveau impossible. Le lien (`?jeu=info&niveau=…`) ouvre directement le niveau chez la personne qui le reçoit. | |

- [ ] Cette progression reflète-t-elle bien le Projet Gaming de L1 et la suite de la licence ?
- [ ] Les intitulés et les années des cours sont-ils les bons ?

## 2. Les contenus à vérifier

**H+00 · Le parcours en largeur.** Règle de saut : le héros monte d'un bloc au plus, franchit 2 cases vides au plus, et rien de plus haut ne doit se trouver entre le départ et l'arrivée. La file part de la colonne 0 ; le niveau est faisable si la colonne 15 (drapeau) est atteinte. Le plus court chemin (en nombre de sauts) est surligné. Deux blocs suffisent (par exemple colonnes 5 et 8).
- [ ] Le parcours en largeur est-il vu en L1 (structures de données) ou en L2 (algorithmique avancée) ?
- [ ] Le vocabulaire « file d'attente », « parcours en largeur » convient-il pour des lycéens ?

**H+06 · La physique, en Python.**

```python
def mettre_a_jour(heros, dt):
    heros.vy = heros.vy - 20 * dt   # gravité
    if touche_saut and heros.au_sol:
        heros.vy = 8                # élan du saut
    heros.y = heros.y + heros.vy * dt
    if heros.y < sol:
        heros.y = sol
        heros.vy = 0
        heros.au_sol = True
```

Unités en blocs et en secondes (saut d'environ 1,6 bloc). Pièges : gravité -20 ou 0, élan 3 ou 25, `heros.y = 0` ou `heros.y + 1`. L'ennemi part du haut de la tour (colonne 9) et recalcule toutes les demi-secondes le plus court chemin vers la dernière colonne où le héros s'est posé, avec la même règle de saut.
- [ ] Le Python présenté est-il correct et lisible pour un lycéen ?
- [ ] Quel moteur ou langage les L1 utilisent-ils pour le Projet Gaming ? Des captures d'un vrai projet permettraient d'en rapprocher le jeu.

**H+20 · Le SQL.** Table `parties(pseudo, score)` de 11 lignes. Requête attendue : `SELECT pseudo, MAX(score) AS meilleur FROM parties GROUP BY pseudo ORDER BY meilleur DESC LIMIT 3`. Chaque erreur a son explication : doublon sans GROUP BY, une seule ligne avec MAX sans GROUP BY, colonne non agrégée avec GROUP BY, SUM qui favorise les gros joueurs, ASC, LIMIT.
- [ ] Le message « avec GROUP BY, chaque colonne doit être regroupée ou calculée » est-il juste et suffisant ?

**H+28 · La réalité virtuelle.** Réglages attendus : lumière chaude, soleil à 25° au plus, brouillard entre 25 et 65 %, caméra « Vue du héros » (placée à hauteur du héros, juste derrière lui). Yanis explique qu'un casque calcule deux images, une par œil, 90 fois par seconde, et que le brouillard évite aussi de dessiner en détail ce qui est caché.
- [ ] Ces notions (lumière directionnelle, brouillard, caméra, images par seconde) correspondent-elles au parcours IoT et réalité virtuelle ?
- [ ] Faut-il une vraie vue à la première personne, ou la caméra derrière le héros suffit-elle ?

**H+36 · Le serveur et les signatures.** Modèle simplifié : un serveur traite 1 000 demandes par seconde ; le cache évite 65 % des demandes (le podium est recalculé toutes les 10 s) ; temps de réponse ≈ 30 ms / (1 − charge), objectif sous 200 ms, soit 85 % de charge au plus. Seule solution dans le budget : cache et 3 serveurs (charge 58 %, 72 ms). Question cyber : la vérification se fait côté serveur (« jamais confiance au client »). Signatures : l'empreinte de *clé secrète + pseudo + score* (une fonction de hachage simple, FNV-1a, affichée en 8 caractères) ; le score de xX_Max_Xx, passé de 1 990 à 2 990 en route, ne correspond plus à sa signature.
- [ ] Les chiffres et la formule simplifiée de la latence vous semblent-ils acceptables pour une illustration ?
- [ ] Faut-il nommer la vraie technique (HMAC) ou rester sur « signature » ?

**H+47 · Le jury.** Notes : gameplay 10 à 20 (pièces ramassées, ennemis écrasés, chutes), technique 10 à 20 (selon les erreurs), thème 17.
- [ ] Le Projet Gaming se termine-t-il bien par une présentation devant un jury ? Qui le compose ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 7 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est un parcours lancé sur un niveau impossible, un test de physique raté, une requête SQL fausse, une ambiance refusée, un déploiement refusé (trop lent ou hors budget), une mauvaise réponse sur le tricheur ou un score signé mal jugé. Les chutes et les coups de l'ennemi ne comptent pas.

## 4. Questions ouvertes pour l'enseignant

1. L'école organise-t-elle une vraie game jam (Global Game Jam, jam interne) ? Le nom, la date ou des photos rendraient le jeu plus concret.
2. Le parcours Data est le seul à ne pas avoir d'étape : faut-il en ajouter une (par exemple analyser les parties pour équilibrer le niveau) ?
3. Le ton « week-end entre étudiants » (pizzas, Yanis qui s'endort) vous convient-il pour présenter la licence ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
