# Campus FGES

Un campus 3D « cozy » pour découvrir les formations de la FGES (Université Catholique de Lille) en jouant :
le vrai quartier Vauban reconstruit d'après OpenStreetMap, l'Hôtel Académique, sa chapelle, le bâtiment
Michel Falise et son atrium, le Rizomm, la BU, All, Wenov à Euratechnologies… et des mini-jeux.

Aucun asset externe : tout est construit en code avec [Three.js](https://threejs.org/) (formes primitives,
textures dessinées sur canvas, musique lofi générée en direct).

## Lancer en local

```bash
python tools/serve.py
```

Puis ouvrir http://localhost:8765. Le serveur désactive le cache pour toujours tester la dernière version.
Ajouter `?debug` à l'adresse expose `window.campus` dans la console (caméra, lieux, intérieurs…).

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Interface (accueil, barre de navigation, panneaux, visite guidée) et styles |
| `js/main.js` | Le quartier, les bâtiments faits main, la caméra, la navigation, la visite guidée |
| `js/city.js` | Construction du quartier à partir des données OpenStreetMap |
| `js/vauban.js` | Données de la carte, **générées** par `tools/build_map.py` (ne pas modifier à la main) |
| `js/data.js` | Formations, lieux, liens, ambiances |
| `js/details.js` | Fiches détaillées des formations (programme, débouchés, admission) |
| `js/atrium.js` · `js/chapelle.js` | Les intérieurs visitables |
| `js/games/comptoir.js` | Mini-jeu « Le Comptoir » (Licence Gestion) |
| `js/audio.js` | Musique lofi, ambiances et effets sonores générés |
| `js/kit.js` | Outils 3D partagés (formes, fenêtres, étudiants) |
| `tools/build_map.py` | Régénère `js/vauban.js` depuis les extraits de `tools/osm/` |

## Mettre à jour la carte

Remplacer les extraits de `tools/osm/` (requêtes Overpass) puis :

```bash
python tools/build_map.py
```

## Crédits

Données cartographiques © les contributeurs d'[OpenStreetMap](https://www.openstreetmap.org/copyright), licence ODbL.
La mention doit rester affichée dans l'interface.
