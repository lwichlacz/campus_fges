# Fiche de validation · Mini-jeu « Le jardin se tait » (Licence Sciences de la Vie)

**À relire par :** un enseignant de la Licence Sciences de la Vie
**Objectif du jeu :** faire vivre à un lycéen le travail d'un biologiste de terrain : observer, identifier, compter, calculer, confronter une hypothèse aux données, puis défendre un diagnostic avec des preuves.
**Fichier du jeu :** `js/games/jardin.js` (chargeur `jardin`, formation `sv`). Les contenus sont regroupés en haut du fichier : `TAXA`, `KEY`, `NET`, `TRUTH`, `RELEVE`, `PISTES`, `CLUES`, `HYPS`, `ACTIONS`, `COURSES`.
**Durée d'une partie :** 7 à 9 minutes (estimation : 8 min pour un lycéen qui lit les textes). L'écran de fin affiche la durée réelle.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Le dossier et la question

Fin septembre, au jardin botanique Nicolas Boulay. Thibault, le jardinier (personnage fictif), écrit : cet été, presque pas d'abeilles ni de bourdons, et les pommiers ont donné trois fois moins de fruits. « Le jardin se tait. »

**La question :** pourquoi les pollinisateurs disparaissent-ils, et que faire avant le printemps ?

Le joueur mène un **seul diagnostic**. Son **carnet de terrain** (un objet 3D posé sur une table de terrain, consultable à tout moment avec le bouton « Carnet ») contient :
- à gauche, les **cinq pistes de Thibault** : « des guêpes rôdent près des ruches », « le voisin traite ses rosiers », « la prairie fleurit moins », « des bourraches blanches dans mon semis », « l'antenne-relais du toit voisin » (rumeur) ;
- à droite, les **indices** que le joueur y écrit au fil de l'enquête (pages 1 à 4), plus une **page 5 « fausse piste »**.

Deux fausses pistes : la « guêpe » de la lavande (un syrphe, pollinisateur) et l'antenne-relais (aucune mesure ne la soutient).

- [ ] Le scénario est-il plausible pour un jardin botanique urbain ? (Le rucher du jardin est fictif.)
- [ ] Les causes retenues (frelon asiatique, insecticide, appauvrissement floral, semis à fleurs blanches) sont-elles crédibles ensemble ?

## 2. Déroulé : quatre indices, un rapport

| Étape | Année | Ce que fait le joueur (geste du biologiste) | Ce qu'il produit | Cours révélé |
|---|---|---|---|---|
| Indice 1 · Terrain | L1 | Touche dans la scène 3D trois insectes rayés près des ruches ; pour chacun, promène une **loupe** sur le dessin (flou à l'œil nu, net sous la lentille) pour observer le caractère demandé, puis avance dans la **clé de détermination** | L'identification de chaque suspect | Biologie des organismes |
| Indice 2 · Réseau trophique | L1 | **Prédit** pour cinq maillons du réseau (glisser la case vers le haut ou le bas) l'effet de l'insecticide six semaines plus tard, puis **observe** le relevé de Thibault | Cinq prédictions, confrontées aux mesures | Écologie |
| Indice 3 · Quadrats | L2 | **Lance** le cadre d'1 m² sans viser (le point de chute est tiré au hasard), **compte** les fleurs dans le cadre en les touchant une à une, quatre fois, puis **calcule** la densité et la compare à l'inventaire de 2023 sur un pavé numérique | La densité (fleurs/m²) et le rapport avec 2023 | Écologie quantitative |
| Indice 4 · Génétique | L3 | **Compte** les pieds blancs du semis de bourrache dans la scène, **règle le génotype** des deux parents (toucher un allèle le fait passer de B à b) jusqu'à ce que l'échiquier prédise le nombre de blanches observé, puis **calcule** les visites par pied | Le génotype des parents (Bb × Bb) et le taux de visite | Génétique |
| Rapport au jardinier | — | **Agrafe** une page du carnet à chaque cause qu'elle prouve, **écarte** les pistes sans preuve, puis choisit **deux actions**, chacune agrafée à la page qui la justifie | Le diagnostic et le plan d'action | — |

Aucune étape ne se joue par glisser-déposer ni en choisissant une réponse dans une liste : le joueur observe, compte, calcule, règle une hypothèse et l'appuie sur une preuve. Les seuls choix à deux options sont les couplets de la clé de détermination, et ils ne se débloquent qu'après l'observation à la loupe.

- [ ] Les années associées à chaque notion sont-elles justes (quadrats en L2, génétique en L3) ?
- [ ] Les gestes sont-ils représentatifs des TP et sorties de terrain de la licence ?

## 3. Indice 1 · La clé de détermination (simplifiée)

| Couplet | Caractère observé à la loupe | Réponses |
|---|---|---|
| 1. Combien d'ailes ? | les ailes | Deux ailes, une seule paire → **Syrphe ceinturé** (*Episyrphus balteatus*, Diptères) · Quatre ailes, deux paires → couplet 2 |
| 2. Couleur du thorax ? | le thorax | Brun-roux → **Frelon européen** (*Vespa crabro*) · Noir → couplet 3 |
| 3. Abdomen et pattes ? | l'abdomen et le bout des pattes | Abdomen sombre à un large anneau orange, bout des pattes jaune → **Frelon asiatique** (*Vespa velutina*) · Abdomen jaune rayé de noir → **Guêpe commune** (*Vespula vulgaris*, aucun spécimen dans le jeu) |

Les trois spécimens : le frelon asiatique en vol stationnaire devant les ruches, le syrphe au-dessus de la lavande, le frelon européen sur un tronc. Le dessin du syrphe montre une seule paire d'ailes et les deux balanciers ; ceux des frelons montrent deux paires d'ailes.

| Espèce | Fiche affichée |
|---|---|
| Syrphe ceinturé | Imite une guêpe (mimétisme) mais n'a pas de dard et butine : un pollinisateur, pas un suspect |
| Frelon européen | Indigène, chasse surtout d'autres insectes et ne s'attaque que rarement aux ruches ; on ne le détruit pas |
| Frelon asiatique | Exotique envahissant, arrivé en France vers 2004 ; chasse en vol stationnaire devant les ruches, les abeilles n'osent plus sortir |

- [ ] La clé est-elle juste malgré la simplification ? Le couplet « couleur du thorax » sépare-t-il correctement les deux frelons ?
- [ ] Faut-il citer la date d'arrivée du frelon asiatique (2004, dans le Lot-et-Garonne) ?

## 4. Indice 2 · Réseau trophique et effet en cascade

Réseau affiché (la flèche va de celui qui est mangé vers celui qui mange) : Rosiers → Pucerons → Coccinelles · Fleurs → Abeilles → Frelons asiatiques · en pointillés, l'abeille pollinise les fleurs, qui font des graines.

Scénario : en juin, le voisin a ressorti un vieux bidon d'insecticide (interdit aux jardiniers amateurs depuis 2019, loi Labbé). Le produit tue pucerons, coccinelles et abeilles qu'il touche. Thibault avait fait un relevé la veille, puis six semaines plus tard.

| Relevé | Avant | Mi-juillet | Prédiction attendue |
|---|---|---|---|
| Pucerons par rameau | 4 | 31 | ↑ (effet rebond : ils se reproduisent vite et n'ont plus de prédateurs) |
| Coccinelles sur les rosiers | 9 | 1 | ↓ |
| Abeilles sur la lavande (10 min) | 38 | 14 | ↓ |
| Graines par fleur de bourrache (4 au plus) | 3,6 | 1,9 | ↓ (moins de pollinisation) |
| Feuilles saines des rosiers | 90 % | 55 % | ↓ |

Chaque mauvaise prédiction compte une erreur et reçoit son explication. Conclusion : effet en cascade ; la parade est la **lutte biologique** (lâcher des larves de coccinelles).

- [ ] Les chiffres du relevé sont-ils plausibles (ils sont inventés) ?
- [ ] Le rappel de la loi Labbé est-il exact et bien formulé ?

## 5. Indice 3 · Quadrats

- Prairie de 20 m² (5 × 4 mètres carrés). Chaque mètre carré porte entre 3 et 9 fleurs.
- Les quatre quadrats tombent au hasard, sur des carrés choisis pour que la moyenne tombe juste : 24 fleurs au total, soit **6 fleurs par m²** (exemples de tirages : 5, 7, 4, 8 ou 6, 6, 5, 7).
- Le joueur compte en touchant les fleurs dans le cadre (un comptage incomplet est refusé), puis tape la densité : (somme) ÷ 4 = 6. Une réponse égale au total (24) déclenche l'explication « il faut partager entre 4 m² ».
- Comparaison : inventaire 2023, même semaine, même protocole, **12 fleurs par m²** ; le joueur tape 12 ÷ 6 = **2** : deux fois moins de fleurs.
- Message : un cercle vicieux (moins de pollinisateurs → moins de graines → moins de fleurs → moins de nourriture) ; le tirage au hasard évite le biais d'échantillonnage.

- [ ] Le vocabulaire (quadrat, densité, protocole, biais) est-il juste ?
- [ ] La règle des fleurs « à cheval sur le cadre » mériterait-elle d'être jouée ? (Aujourd'hui, aucune fleur ne touche le cadre.)

## 6. Indice 4 · Génétique (L3)

- Semis de l'an dernier : les graines de deux bourraches **bleues** du jardin. 32 pieds : **23 bleues, 9 blanches**.
- Le gène de la couleur a deux allèles : **B** (bleu, dominant) et **b** (blanc, récessif). Une fleur est blanche seulement si elle est bb.
- Le joueur règle le génotype des deux parents ; l'échiquier de croisement et le nombre de blanches attendu sur 32 se mettent à jour. Un parent bb est refusé (il aurait été blanc). BB × BB ou BB × Bb donnent 0 blanche attendue : l'hypothèse est rejetée face aux 9 observées (une erreur).
- Bonne hypothèse : **Bb × Bb**, 3:1 attendu, soit 24 et 8 ; observé 23 et 9 : écart dû au hasard (un test du χ² le confirmerait). Origine de l'allèle b : une bourrache blanche plantée à côté il y a deux ans.
- Visites notées par Thibault en 30 min : 69 sur les 23 pieds bleus, 9 sur les 9 pieds blancs. Le joueur tape 69 ÷ 23 = **3** visites par pied bleu, contre 1 par pied blanc.
- Message : arracher les blanches ne suffit pas, deux bleues sur trois sont Bb en moyenne.

- [ ] **À vérifier en priorité :** chez la bourrache (*Borago officinalis*), la fleur blanche est-elle bien un caractère récessif monogénique ? Sinon, quelle espèce mellifère prendre ?
- [ ] Les fleurs blanches de bourrache sont-elles réellement moins visitées ? (Les chiffres sont inventés pour le jeu.)
- [ ] La notation (B / b, même lettre, majuscule pour le dominant) convient-elle ?

## 7. Le rapport au jardinier

**Les causes** (agrafer une page ou écarter) :

| Cause proposée | Attendu |
|---|---|
| Un prédateur chasse les abeilles devant les ruches | page 1 (frelon) |
| Un produit chimique tue ou affaiblit les insectes | page 2 (insecticide) |
| Les pollinisateurs trouvent moins de fleurs à butiner | page 3 (quadrats) |
| Une partie des fleurs attire moins les pollinisateurs | page 4 (semis) |
| Les insectes rayés de la lavande sont des guêpes dangereuses | écartée (la page 5 prouve le contraire) |
| Les ondes de l'antenne-relais font fuir les abeilles | écartée (aucune preuve) |

**Deux actions** parmi six, chacune agrafée à la page qui la justifie :

| Action | Justification attendue |
|---|---|
| Faire détruire le nid de frelons asiatiques par un professionnel, et poser des grilles d'entrée sur les ruches | page 1 |
| Expliquer au voisin la loi Labbé, et lui proposer des coccinelles contre les pucerons (lutte biologique) | page 2 |
| Semer des fleurs sauvages locales dans la prairie, et la faucher plus tard | page 3 |
| Ressemer avec des graines de bourrache bleue de lignée pure (BB) | page 4 |
| Poser des pièges sucrés contre tous les insectes rayés du jardin | piège : tuerait aussi syrphes, frelons européens et abeilles |
| Déplacer les ruches loin de l'antenne-relais | piège : aucune preuve |

Toute paire de deux actions justes, chacune avec sa bonne page, est acceptée.

- [ ] Les actions sont-elles réalistes et bien formulées (destruction du nid, grilles d'entrée, fauche tardive) ?
- [ ] Faut-il imposer une action prioritaire (par exemple le frelon) ?

## 8. Mention

| Mention | Erreurs sur toute la partie |
|---|---|
| Très bien | 3 au plus |
| Bien | 4 à 7 |
| Assez bien | 8 à 12 |
| De justesse | au-delà |

Une erreur, c'est : une mauvaise réponse dans la clé, une prédiction fausse du réseau, un comptage incomplet, un calcul faux, une hypothèse génétique rejetée, une cause mal classée ou une action injustifiée.

## 9. Ce qui reste de l'ancienne version

L'ancien jeu (« Mission Jardin Boulay ») proposait ensuite trois parcours de L3 jouables (écologie, biotechnologies, ingénieur). Ils ne sont plus joués : l'écran de fin les présente en une phrase. Le carnet de médailles « par parcours » ne s'affiche donc plus pour ce jeu.

## 10. Questions ouvertes pour l'enseignant

1. Le jardin Boulay a-t-il un rucher, ou faut-il parler d'abeilles sauvages et de bourdons seulement ?
2. Une sortie de terrain ou un TP de la licence ressemble-t-il à l'une de ces étapes ? On pourrait en reprendre les vrais chiffres.
3. Faut-il remettre un aperçu des parcours de L3 dans le jeu ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
