# Fiche de validation · Mini-jeu « Mission Jardin Boulay » (Licence Sciences de la Vie)

**À relire par :** un enseignant de la Licence Sciences de la Vie
**Objectif du jeu :** faire vivre à un lycéen le travail d'un biologiste (terrain, identification, écologie, comptage, génétique) à partir d'un lieu réel du campus.
**Scénario :** la Ville se demande si le jardin botanique Nicolas Boulay mérite le label « refuge de biodiversité ». Le labo de licence du joueur fait l'inventaire.
**Durée d'une partie :** environ 6 minutes.
**Fichier du jeu :** `js/games/jardin.js` (les contenus sont regroupés en haut du fichier : `SPECIES`, `KEY`, `WEB_NODES`, `WEB_OK`, `COURSES`).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| Terrain | L1 | Cherche 6 petites bêtes cachées dans le jardin en 3D, puis identifie chacune avec une clé de détermination | Biologie des organismes |
| Réseau trophique | L1 | Relie « qui mange qui », puis prédit l'effet d'un insecticide | Écologie |
| Quadrats | L2 | Choisit 4 quadrats d'1 m² (à la main ou au hasard), compte les pâquerettes, estime la population de la prairie | Écologie quantitative et biostatistiques |
| Génétique | L3 | Croisement de Mendel : prédit la F1, remplit l'échiquier de croisement, sème 40 graines et compare l'observé à l'attendu | Génétique |
| Rapport de mission | — | Bilan, mention, cours rencontrés | — |

- [ ] Les activités sont-elles représentatives de la licence ?
- [ ] Les années (L1, L2, L3) associées à chaque notion sont-elles justes ?

## 2. Terrain : la clé de détermination (simplifiée)

| Question | Réponses |
|---|---|
| 1. Son corps est couvert de… | Plumes → **Mésange bleue** (Oiseaux) · Poils ou piquants → **Hérisson d'Europe** (Mammifères) · Ni l'un ni l'autre → question 2 |
| 2. A-t-il des pattes ? | Non → **Lombric** (Annélides) · Oui → question 3 |
| 3. Combien de pattes ? | 8 → **Épeire diadème** (Arachnides) · 6 → question 4 |
| 4. Ses ailes de devant sont… | Dures et colorées (élytres) → **Coccinelle à sept points** (Insectes, Coléoptères) · Fines et transparentes → **Abeille domestique** (Insectes, Hyménoptères) |

Chaque espèce est présentée par un dessin (le joueur compte les pattes, observe les ailes) et une anecdote :

| Espèce | Anecdote affichée |
|---|---|
| Coccinelle | Dévore des dizaines de pucerons par jour : utilisée comme insecticide naturel |
| Abeille | Transporte le pollen de fleur en fleur : la pollinisation |
| Épeire | Huit pattes, pas d'antennes, pas d'ailes : un arachnide, pas un insecte |
| Lombric | Digère les feuilles mortes et aère le sol |
| Mésange bleue | Un couple apporte des milliers de chenilles à ses petits au printemps |
| Hérisson | Chasse la nuit limaces, vers et insectes ; espèce protégée |

- [ ] La clé est-elle juste scientifiquement, malgré la simplification ?
- [ ] Les rangs taxonomiques et les anecdotes sont-ils corrects ?
- [ ] Faut-il d'autres espèces (une plante, un champignon) ?

## 3. Réseau trophique

La flèche va **de celui qui est mangé vers celui qui mange** (sens du flux d'énergie). Le joueur doit tracer au moins ces liens :
Rosier → Puceron · Puceron → Coccinelle · Puceron ou Coccinelle → Mésange · Mésange → Épervier · Feuilles mortes → Lombric · Lombric → Hérisson.
Le lien Coccinelle → Hérisson est aussi accepté. Une flèche dans le mauvais sens déclenche un message sur la convention.

Question finale : un insecticide non sélectif tue pucerons et coccinelles ; les pucerons reviennent plus vite que leurs prédateurs, donc les rosiers sont plus attaqués. Le jeu conclut sur la **lutte biologique**.

- [ ] Les liens acceptés et refusés sont-ils justes (mettre « feuilles mortes » dans un réseau trophique est-il acceptable, ou faut-il parler de réseau détritivore) ?
- [ ] Le scénario de l'insecticide est-il correct ?

## 4. Quadrats

- Prairie de 100 m², découpée en 100 quadrats d'1 m². Les fleurs sont plus denses côté soleil : entre environ 1 et 14 par quadrat, soit 450 à 600 au total.
- Le joueur choisit 4 quadrats, ou les tire au hasard, puis compte les fleurs en les touchant une à une.
- Estimation = moyenne × 100. Le vrai total est ensuite révélé.
- Si le joueur a choisi lui-même ses quadrats et que l'écart dépasse 15 %, le jeu explique le **biais d'échantillonnage** et l'intérêt du tirage aléatoire. Si les quadrats étaient tirés au hasard, il explique l'effet du faible nombre de quadrats.

- [ ] Le vocabulaire (quadrat, échantillonnage, biais, estimation) est-il juste ?
- [ ] Faut-il évoquer l'intervalle de confiance, ou est-ce trop pour des lycéens ?

## 5. Génétique

- Pois à fleurs violettes (allèle V, dominant) × pois à fleurs blanches (allèle b, récessif), lignées pures. F1 : tous Vb, donc violets. Le jeu signale que « mauve » est faux : les caractères ne se mélangent pas dans ce cas.
- Échiquier de croisement Vb × Vb : VV, Vb, Vb, bb. Proportion de blanches attendue : 1/4.
- Le joueur sème 40 graines : tirage aléatoire à 25 % de blanches. Le jeu compare à l'attendu (30 / 10), explique que l'écart vient du hasard, et cite le **test du χ²**.

- [ ] La notation des allèles (V / b) convient-elle, ou préférez-vous la notation utilisée en cours ?
- [ ] Le test du χ² est-il bien enseigné en L3 (ou plus tôt) ?

## 6. Mention

| Mention | Condition |
|---|---|
| Très bien | 3 erreurs au plus et estimation des quadrats à 20 % près |
| Bien | 8 erreurs au plus |
| Assez bien | Au-delà |

Une erreur, c'est une mauvaise réponse dans la clé, une mauvaise flèche ou une mauvaise réponse à une question.

## 7. Questions ouvertes pour l'enseignant

1. Une sortie de terrain, un TP ou un stage emblématique de la licence qu'on pourrait mettre en scène ?
2. Faut-il illustrer les parcours de L3 (écologie, biologie santé…) ?
3. Le ton (« ton labo de licence », label « refuge de biodiversité ») vous convient-il ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
