# Fiche de validation · Mini-jeu « Cellule robotique Wenov » (Licence Sciences pour l'Ingénieur, École du Numérique)

**À relire par :** un enseignant de la Licence Sciences pour l'Ingénieur
**Objectif du jeu :** montrer à un lycéen ce qu'on fait concrètement en licence : faire bouger un vrai robot, le programmer, puis lui donner la vue.
**Scénario :** le joueur fait fonctionner une cellule robotique (un bras à 3 articulations, un tapis, des bacs) avec les outils de chaque année de la licence. La cellule est une **mise en scène** : elle ne représente pas un équipement réel de l'école.
**Durée d'une partie :** environ 7 minutes.
**Où le trouver :** dans l'intérieur de Wenov (épingle « Plateau robotique »), dans l'onglet Jeux et sur la fiche de la formation.
**Fichier du jeu :** `js/games/robot.js` (missions `mission1`, `mission2`, `mission3`).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Mission | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Prends la main | L1 | Pilote la base, l'épaule et le coude avec des curseurs pour saisir une pièce et la déposer dans un bac. Les angles s'affichent en direct ; une collision avec une surface est refusée. | Mécanique et systèmes numériques |
| Programme la cellule | L2 | Compose un cycle à partir de 5 blocs (attendre le capteur, aller au-dessus du tapis, saisir, aller au-dessus du bac, déposer). Le robot l'exécute en boucle ; il faut ranger 3 pièces. | Robotique et systèmes industriels |
| Donne-lui des yeux | L3 | À partir de 10 exemples étiquetés (teinte mesurée par la caméra), règle la frontière entre pièces orange et bleues, puis lance le tri automatique de 8 pièces (au moins 7 bien triées). | Vision par ordinateur et IA embarquée |

- [ ] La progression L1 → L2 → L3 est-elle fidèle à la maquette ?
- [ ] Les intitulés des cours sont-ils les bons ?

## 2. Les contenus à vérifier

**Mission 1** : bras à 3 articulations (base en rotation, épaule et coude en élévation), pince qui reste verticale.
- [ ] Le vocabulaire (articulation, degré de liberté, cinématique) est-il adapté à des lycéens ?

**Mission 2** : le cycle attendu est « Attendre une pièce (capteur) → Aller au-dessus du tapis → Saisir → Aller au-dessus du bac → Déposer », répété en boucle. Sans le capteur, la saisie échoue quand la pièce n'est pas encore arrivée.
- [ ] Faut-il parler d'automate programmable (API) plutôt que de microcontrôleur ?

**Mission 3** : classification sur une seule caractéristique (la teinte, de 0 à 240°) avec un seuil. Deux exemples limites (75° orange, 120° bleu) obligent à placer le seuil entre les deux.
- [ ] Le terme « IA embarquée » est-il juste pour un seuil appris sur des exemples, ou faut-il dire « apprentissage » ou « classification » ?

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 6 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est une collision, une pièce lâchée hors du bac, un cycle qui échoue ou une pièce mal triée.

## 4. Questions ouvertes pour l'enseignant

1. L'école dispose-t-elle d'un bras robotisé ou d'une cellule de démonstration dans Wenov ? Des photos permettraient d'en rapprocher le jeu.
2. Quelles missions ajouter ensuite : câblage d'un capteur (L1), réglage d'un asservissement (L2), jumeau numérique à deux bras (L3) ?
3. Le ton « tableau de bord d'ingénieur » vous convient-il pour présenter la licence ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
