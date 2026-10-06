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

| Adresse | Usage |
|---|---|
| `index.html` | Le campus en 3D |
| `index.html?borne` | Mode stand (JPO, salons) : pas d'écran d'accueil, visite guidée en boucle, retour à la visite après 30 s sans interaction |
| `liste.html` | Version sans 3D, accessible (clavier, lecteurs d'écran), proposée depuis l'accueil et si le navigateur ne gère pas la 3D |
| `?debug` | Expose `window.campus` dans la console (caméra, lieux, intérieurs, qualité…) |

La qualité graphique (haute, moyenne, basse) est choisie automatiquement selon l'appareil, puis abaissée si
l'image descend sous ~30 images/s. Elle se règle aussi à la main dans le menu Ambiance.
Sans interaction pendant 60 s, la visite guidée se lance seule (écran de veille).

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Interface (accueil, barre de navigation, panneaux, visite guidée) et styles |
| `liste.html` | Version sans 3D (mêmes données) |
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

## Formulaire plaquettes → CRM

Le formulaire (depuis le carnet ou une fiche formation) envoie les coordonnées à un **relais serveur**
(`POST api/lead`), qui les transmet au CRM (`/api/webhooks/wordpress-form`, une entrée par formation,
source « Campus FGES (jeu 3D) »). **La clé du CRM ne doit jamais se trouver dans le navigateur ni dans git.**

En local, `tools/serve.py` fait office de relais :

1. Copier `.env.example` en `.env` et y renseigner `CRM_IMPORT_TOKEN` (le `.env` est ignoré par git).
2. `CRM_LIVE=0` (par défaut) : **mode essai**, rien n'est envoyé, la demande s'affiche dans le terminal.
   `CRM_LIVE=1` : envoi réel au CRM.

Le relais vérifie l'e-mail et le consentement, ignore les robots (champ piège, envoi trop rapide) et limite
les envois (5 par 10 minutes par adresse IP). Le serveur local n'écoute que sur ce poste et ne sert jamais
les fichiers cachés (`.env`, `.git`) ni le dossier `tools/`.

Après l'envoi, le visiteur reçoit tout de suite ses plaquettes : le lien PDF de chaque formation
(table `PLAQUETTES` dans `js/data.js`, à compléter) ou, à défaut, le catalogue Calaméo de toutes les plaquettes.

**En production**, le même relais doit tourner côté serveur (par exemple une route du plugin WordPress) ;
l'adresse se règle sur la page d'intégration avec `window.CAMPUS_LEAD_API = "https://…/route"`.

## Mettre à jour la carte

Remplacer les extraits de `tools/osm/` (requêtes Overpass) puis :

```bash
python tools/build_map.py
```

## Crédits

Données cartographiques © les contributeurs d'[OpenStreetMap](https://www.openstreetmap.org/copyright), licence ODbL.
La mention doit rester affichée dans l'interface.
