# Suivi du chantier « rendu 3D et quartier fidèle »

Dernière mise à jour : 13 octobre 2026 (après-midi). Tout est sur `main` et en ligne sur https://lwichlacz.github.io/campus_fges/

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
| Scintillement (octobre) | Deux bâtiments dont les emprises se chevauchent (OpenStreetMap et BD TOPO) avaient des murs exactement dans le même plan : chaque emprise est maintenant poussée vers l'extérieur de 1 à 5 cm, différemment d'un bâtiment à l'autre (`nudgeRing`, `js/city.js`). Caméra haute : le plan proche recule de 2 à 8 m (`fogFollow`, `js/main.js`), la profondeur gagne jusqu'à 4 fois en précision. Contrôle : `tools/film/pilote.js` (`scintillement`, `clignote`). |
| Scintillement sur iPhone | Le moteur demande un tampon de stencil : sans lui, Safari peut ne donner que 16 bits de profondeur et les surfaces proches clignotent. `?perf` affiche maintenant la précision obtenue (« profondeur 24 bits »). |
| Ombres sur téléphone | Hors qualité haute, seuls les bâtiments et les feuillages portent une ombre (passants, troncs, réverbères, cheminées, lucarnes exclus) : chaque mise à jour des ombres coûte 35 % de moins. Une baisse automatique de qualité n'est plus gardée que 3 jours. Testé en bridant le rendu : à 36 i/s la qualité moyenne est gardée, à 26 i/s le site passe en basse en 4 s. |
| Wenov | L'îlot est coupé derrière la rangée de maisons de l'avenue de Bretagne (OpenStreetMap et BD TOPO concordent) : 13 bâtiments rendus au quartier. Wenov reste en R+4 (20,5 m, Lalou+Lebec, 2021). |
| Ajouts | Image d'aperçu refaite, page `credits.html`, son de la pluie et vent réel (Open-Meteo), promenade à pied jusqu'au métro (fiche d'une station), Porte Royale de la Citadelle, place d'armes rétablie. |
| Euratechnologies (comme Vauban) | Même échelle verticale que Vauban (Wenov R+4 à 20,5 m, Blan-Lafont 16,6 m). Toits orientés sur la rue et colorés d'après la photo aérienne de l'IGN (`tools/osm/ortho_eura.jpg`, lue avec Pillow : fonctionne sous Windows), sol (`img/sol_eura.png`) et 1 046 arbres de jardin d'après la photo, plaques de 63 rues, panneaux « M » de Wenov à la station, 50 lieux réels. Horizon : 6 735 bâtiments réels jusqu'à 1,3 km (`tools/fetch_eura_far.py` puis `js/eura_far.js`). Fichiers JS numérotés à chaque mise en ligne (`tools/version.py`). |
| Euratechnologies, 2ᵉ passe | Blan-Lafont refait d'après les photos de Wikimedia Commons (grille de baies, frise, attique vitré, auvent rouge, tour de 1896 crénelée à pavillon d'ardoise, tour d'escalier de l'aile Lafont, atrium) ; le Diamant (« Black Diamond », PDAA : socle de brique en claustra, bureaux noirs) et la French Tech (verre et lames verticales, Barbarito Bancel) faits main ; Rives de l'Isle en brique récente, Téranéo en bois sombre. Deûle : 2 péniches et un bateau-promenade qui naviguent, 5 bateaux amarrés, 6 canards, reflets. Météo du quartier comme à Vauban (pluie, rues mouillées, brouillard, ombres de nuages, lumière grise). Année de construction de 2 584 bâtiments (`tools/fetch_eura_annees.py`) : façades selon l'époque. Jardin Le Blan-Lafont sans arbres « devinés » sur la photo (prairie, bassins, roseaux). |
| Mesure | `?perf` affiche images/s, pire image, triangles, appels, qualité, résolution et processeur graphique (toucher le relevé le copie). `tools/mesure_rendu.cjs` mesure triangles et appels par qualité et point de vue, et vérifie les shaders. |

Sources des données : OpenStreetMap (ODbL), IGN BD TOPO et BD ORTHO (Licence Ouverte), Open-Meteo.
Mention affichée en bas de l'écran.

## Relecture des mini-jeux par les enseignants

Page de relecture sur le site : https://lwichlacz.github.io/campus_fges/relecture/ (un lien par jeu : `#dmb`, `#sv`, `#spi`, `#gestion`, `#cfa`, `#info` ;
`#tableau` : tableau de bord, avec la clé du script). Lien public, sans compte. Les réponses vont dans un tableur Google
via `docs/validation-web/google-apps-script.js` (installation en tête du fichier ; l'URL du script va dans
`docs/validation-web/pages.json`), les captures dans un dossier Drive. Tant que l'URL n'est pas renseignée, l'enseignant
obtient un récapitulatif à copier. L'accueil montre le film du projet (2 min 04, tourné image par image dans le vrai campus 3D : Vauban, Euratechnologies, les
36 formations avec leur mini-jeu disponible ou à venir, les mini-jeux et la relecture ; `tools/film/film.js` et `tools/film/pilote.js`,
`docs/validation-web/media/campus-3d.mp4`) et les jeux avec leur compteur. E-mail d'invitation : `docs/validation-web/invitation.md`. (Les anciennes pages claude.ai ont été
supprimées.)

Côté site : `?jeu=<formation>` ouvre directement un jeu ; `&relecture` ajoute la bannière « Relecture » (chronomètre,
erreurs, « Aller à… » pour sauter à une étape, « ✏️ Noter ici », lien vers le formulaire). Le journal est gardé dans le
navigateur et repris tout seul par le formulaire. Pour modifier la page : `python3 docs/validation-web/build.py`, puis push.

Nouveau jeu : **Projet Gaming** (Licence Informatique, `js/games/gaming.js`, fiche `docs/validation-licence-info.md`) :
rebond de balle programmé (L1), podium en SQL (L1), code de César et mots de passe hachés (L2 Cyber), détecteur de
tricheurs (L3 Data). Épingle dans Wenov, salle de l'École du Numérique.

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

1. Tester sur iPhone avec `?perf` : vérifier « profondeur 24 bits » et l'absence de scintillement sur Vauban et dans Wenov.
2. Script de contrôle : comparer la hauteur de chaque modèle fait main à la hauteur mesurée par l'IGN.
3. Vérifier l'Hôtel Académique sur photo de façade (tourelles, horloge, observatoire), puis Michel Falise (rotonde).
4. Remplacer `sips` par Pillow dans `tools/build_map.py` pour pouvoir regénérer Vauban sur Windows.
5. Vitrines au rez-de-chaussée des rues commerçantes.
6. Neige réelle quand Open-Meteo en annonce.
7. Promenade à pied : marcher sur le trottoir plutôt qu'au milieu de la chaussée.

## Pour relancer Claude

> On reprend le projet Campus FGES (lis `docs/suivi-rendu-3d.md`). Commence par le point 1 de « La suite ».
> À la fin de chaque série de modifications, propose-moi 10 nouvelles améliorations.

## Film de présentation

2 min 12, Full HD, sur la page de relecture (destiné aussi à la direction). Tourné image par image dans le campus à
jour (`tools/film/pilote.js` pilote l'horloge, `tools/film/film.js` le montage), encodé dans le navigateur.
Montage calé sur la musique (`docs/validation-web/voix/musique.py`, 80 bpm) : ouverture, la promesse (découvrir le
campus, découvrir les formations, les essayer), 01 le campus en travellings, 02 les formations **entité par entité**
(FGES, ISEA, École du Numérique : carte d'entité puis grilles, les 36 formations avec leur mini-jeu ou « en
préparation »), 03 les mini-jeux, la relecture, signature. Bandes cinéma, transitions aux couleurs des entités,
typographie animée, fond flouté sous les textes. Refaire : `F.planche(4)` pour relire, puis `F.tourner()` (2 min),
puis `python docs/validation-web/build.py`. **Toujours partir de `git pull` : les bâtiments évoluent.**
