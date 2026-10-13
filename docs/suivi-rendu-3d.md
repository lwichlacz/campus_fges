# Suivi du chantier « rendu 3D et quartier fidèle »

Dernière mise à jour : 13 octobre 2026. Tout est sur `main` et en ligne sur https://lwichlacz.github.io/campus_fges/

## Reprendre sur un autre ordinateur

```bash
git clone https://github.com/lwichlacz/campus_fges.git
cd campus_fges
python3 tools/serve.py
```

Puis ouvrir http://localhost:8765 (ajouter `?debug` pour avoir `window.campus` dans la console).
Si le dossier existe déjà : `git pull` sur `main`.

**À savoir avant de regénérer les cartes** (`tools/build_map.py`, `tools/build_eura.py`) : ce n'est utile que si
l'on change les données ou les règles de construction. `js/vauban.js`, `js/vauban_far.js` et `js/euramap.js` sont
déjà générés et commités. La lecture de la photo aérienne passe par `sips`, qui n'existe que sur macOS : sur un autre
système, le script tourne mais **perd la couleur réelle des toits, le sol (img/sol.png) et les arbres plantés
d'après la photo**. Sur Windows ou Linux, il faudrait remplacer `sips` par Pillow (`load_ortho` dans build_map.py).

## Ce qui a été fait

| Thème | Contenu |
|---|---|
| Quartier fidèle (IGN) | Bâtiments de la BD TOPO : 1 996 dans la zone réelle (dont 299 absents d'OpenStreetMap), étages, hauteur du toit, matériaux. Toits : deux pentes côté rue, extension arrière plate, pans brisés sur les formes irrégulières, couleur relevée sur la photo aérienne. Façades selon l'époque. Hauteurs à l'échelle de l'Hôtel Académique. Sol (jardins ou cours pavées) et arbres d'après la photo. |
| Lointain | 20 722 vrais bâtiments jusqu'au bord de l'horizon, centre de Lille compris, chargés après le campus (`js/vauban_far.js`). Bois de Boulogne et parcs d'après la photo. |
| Monuments | Saint-Martin d'Esquermes, Notre-Dame-de-Consolation, Saint-Maurice, cathédrale de la Treille, beffroi, tours d'Euralille (`js/monuments.js`). Hauteurs approximatives. |
| Citadelle | Vraie enceinte bastionnée (OpenStreetMap), douves (IGN), 36 bâtiments de la place d'armes. |
| Euratechnologies | 1 571 bâtiments de la BD TOPO ; Wenov et le Blan-Lafont restent faits main. |
| Hôtel Académique, Falise | Soubassement de pierre bleue, pinacles, observatoire, chapelle en croix latine avec grand toit d'ardoise ; Falise sur cinq niveaux. Tour d'angle inventée retirée. |
| Repères | Plaques de rue (81 rues), panneaux « M » jusqu'aux stations, 104 lieux réels (`js/landmarks.js`). |
| Ambiances | Heure dorée, fenêtres variées la nuit, météo réelle (Open-Meteo) ou choisie : pluie, brouillard, ombres de nuages. |
| Eau | Péniches, canards, reflets du soleil et de la lune ; quai de la Deûle qui cachait l'eau corrigé. |
| Rendu et vitesse | Regroupement des objets, ombres à la demande, post-traitement en qualité haute (`js/render.js`), carte de départ 2,5 fois plus légère. |
| Allègement pour téléphones | Lointain découpé en 139 carreaux de 150 m : ceux qui sont hors du cadre ne sont pas dessinés (environ 70 % dans la vue d'accueil). Dans chaque carreau, les bâtiments sont rangés par volume : la qualité moyenne laisse les plus petits au loin et ne garde qu'une touffe par arbre ; la qualité basse, qui n'avait plus de lointain du tout, montre maintenant les grands volumes. Faces jamais vues retirées (dessous, toits plats invisibles), réverbères et troncs simplifiés. Résultat en vue d'accueil sur iPhone : 850 000 triangles en qualité moyenne au lieu de 1,34 million ; 884 000 au lieu de 1,34 million en haute ; basse inchangée (527 000) malgré le lointain ajouté. |
| Mesure | `?perf` affiche images/s, pire image, triangles, appels, qualité, résolution et processeur graphique (toucher le relevé le copie). `tools/mesure_rendu.cjs` mesure triangles et appels par qualité et point de vue, et vérifie les shaders. |

Sources des données : OpenStreetMap (ODbL), IGN BD TOPO et BD ORTHO (Licence Ouverte), Open-Meteo.
Mention affichée en bas de l'écran.

## Points de vigilance

- **Pas encore testé sur un vrai téléphone.** Après l'allègement : environ 850 000 triangles par image en qualité
  moyenne (ombres comprises), 530 000 en basse. Il faut maintenant ouvrir le site avec `?perf` sur un iPhone et un
  Android milieu de gamme et noter les relevés. C'est la priorité maintenant que le site est public.
- **Ce qui pèse encore** : le quartier proche (environ 500 000 triangles dans l'image, autant de nouveau dans la carte
  d'ombres) est dessiné en entier quelle que soit la direction regardée. Le découper en carreaux comme le lointain a
  été essayé : 50 000 triangles gagnés seulement, pour deux fois plus d'appels de dessin (900 au lieu de 420), ce qui
  coûte plus cher sur téléphone. Abandonné.
- **À vérifier sur photo** : les deux tourelles et l'horloge du pavillon central de l'Hôtel Académique, et
  l'observatoire (attesté en 1888-1889, placé au jugé sur la grande aile, existence actuelle non vérifiée).
- **Approximations** : hauteurs des clochers, du beffroi et des tours ; position des monuments du centre-ville.
- **Contrôle après chaque modification de shader** : vérifier qu'aucun programme n'est en erreur
  (`campus.renderer.info.programs.filter(p => p.diagnostics && !p.diagnostics.runnable)` doit être vide).
  Un `uTime` déclaré deux fois a déjà rendu tous les murs invisibles.

## La suite (par ordre conseillé)

1. Tester sur de vrais téléphones (iPhone, Android milieu de gamme) avec `?perf`, vue d'accueil puis vue piéton, en
   qualité auto. Le lointain est déjà allégé. Si c'est encore lent : arbres du quartier sans ombre en qualité
   moyenne, carte d'ombres limitée à la zone regardée, ou fusion des maisons d'un même îlot en un seul volume au-delà
   de 150 m.
2. Script de contrôle : comparer la hauteur de chaque modèle fait main à la hauteur mesurée par l'IGN, pour repérer d'autres éléments inventés.
3. Vérifier l'Hôtel Académique sur photo de façade (tourelles, horloge, observatoire, travées, lucarnes), puis Michel Falise (rotonde).
4. Mettre à jour l'image d'aperçu `img/apercu.jpg` pour les partages sur les réseaux sociaux.
5. Page « Crédits et sources ».
6. Son de la pluie et du vent, qui suit la météo réelle.
7. Vitrines au rez-de-chaussée des rues commerçantes.
8. Porte Royale de la Citadelle.
9. Neige réelle quand Open-Meteo en annonce.
10. Chemin à pied jusqu'au métro en vue piéton, le long des panneaux « M ».

## Pour relancer Claude

> On reprend le projet Campus FGES (lis `docs/suivi-rendu-3d.md`). Commence par le point 1 de « La suite ».
> À la fin de chaque série de modifications, propose-moi 10 nouvelles améliorations.
