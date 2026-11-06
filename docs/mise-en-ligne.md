# Mise en ligne du Campus FGES (guide du webmaster)

Trois chantiers, dans cet ordre : **1.** brancher le formulaire sur le CRM, **2.** donner au campus sa propre
adresse, **3.** créer les entrées depuis fges.fr. Compter une demi-journée en tout, hors délai du DNS.

## Le principe : le campus vit à côté de WordPress, pas dedans

```
fges.fr (WordPress)                         campus.fges.fr (GitHub Pages)
├─ menu, accueil, fiches formation ──liens──▶ le campus 3D (index.html)
├─ page JPO                                   ├─ ?jeu=gestion  → un mini-jeu directement
└─ /wp-json/campus-fges/v1/lead ◀──formulaire─┘ └─ liste.html    → version sans 3D
        │ (extension « Campus FGES 3D »)
        ▼
   CRM FGES  /api/webhooks/wordpress-form   (clé d'import, jamais dans le navigateur)
```

**Pourquoi pas une page WordPress ou une iframe :** le campus charge des modules JavaScript que les extensions
de cache et de minification de WordPress cassent ; dans une iframe, sur téléphone, les gestes du jeu se battent
avec le défilement de la page, le plein écran et le son sont bridés, et on perd les liens directs vers les
jeux. On garde donc le campus en site statique, sur sa propre adresse, et WordPress y renvoie par des liens.

## 1. Installer l'extension « Campus FGES 3D » et brancher le CRM (avant tout le reste)

Aujourd'hui l'adresse du relais est vide : en ligne, le formulaire est en **mode démo** (il affiche la
confirmation mais rien n'arrive au CRM). L'extension se règle entièrement dans le back-office, sans toucher
à `wp-config.php`.

1. **Installer.** *Extensions → Ajouter → Téléverser une extension* :
   [`tools/wordpress/campus-fges.zip`](../tools/wordpress/campus-fges.zip), puis **Activer**. Le tableau de bord
   de l'extension s'ouvre tout seul (menu **Campus 3D**, à gauche) avec les 5 étapes de mise en route.
2. **Réglages → Le CRM** : coller l'adresse du CRM et sa clé d'import (`IMPORT_TOKEN` du `.env` du CRM),
   **Enregistrer**, puis **Envoyer un contact de test au CRM**. Le résultat s'affiche en clair (CRM injoignable,
   clé refusée, adresse fausse…) ; un contact « Test Campus 3D » apparaît dans le CRM, à supprimer ensuite.
3. **Brancher le campus.** L'onglet **Aide** donne la ligne à copier dans [`js/data.js`](../js/data.js) :

   ```js
   export const LEAD_ENDPOINT = "https://www.fges.fr/wp-json/campus-fges/v1/lead";
   ```

   puis `python tools/version.py`, commit, push. Le tableau de bord vérifie tout seul que le campus en ligne
   envoie bien ses demandes au site (étape 3 au vert).
4. **Faire une demande depuis le campus** (carnet → « Recevoir les plaquettes ») : elle apparaît dans l'onglet
   **Demandes** en « Mode essai ».
5. **Réglages → Mode d'envoi → Réel**, enregistrer, refaire une demande : elle passe en « Arrivée au CRM ».
6. **Plaquettes** : pour chaque formation, **Choisir** le PDF dans la médiathèque. Le visiteur le reçoit tout de
   suite après sa demande (sinon, le catalogue de toutes les plaquettes).

Si une extension de sécurité (Wordfence, iThemes, « Disable REST API »…) filtre `/wp-json/`, autoriser la route
`campus-fges/v1` ; si une extension de cache est active, exclure `/wp-json/` du cache ; les permaliens ne doivent
pas être en « Simple ».

**Ce que fait l'extension, en plus du relais :**
- si le CRM ne répond pas (maintenance, clé changée…), la demande n'est **pas perdue** : elle est gardée et
  renvoyée toute seule toutes les 5 minutes, jusqu'à 7 jours, et l'adresse choisie reçoit un e-mail d'alerte
  (au plus un par heure). Le menu **Campus 3D** affiche un compteur tant que des demandes attendent ;
- un journal des demandes (prénom, initiale, e-mail masqué, formations, provenance) et des chiffres : demandes
  sur 7 et 30 jours, formations les plus demandées, d'où viennent les visiteurs ;
- un bloc **Campus 3D** pour l'éditeur de pages, et le code court `[campus_3d]` pour les autres éditeurs ;
- un générateur de liens et de **QR codes** prêts à imprimer.

Pour l'équipe technique : les réglages sensibles peuvent aussi être posés dans `wp-config.php`
(`CAMPUS_FGES_CRM_URL`, `CAMPUS_FGES_CRM_TOKEN`, `CAMPUS_FGES_CRM_LIVE`, `CAMPUS_FGES_ORIGINS`) ; ils sont alors
verrouillés dans l'écran de réglages. Après une modification des formations ou des jeux dans `js/data.js`, lancer
`python tools/wordpress/build.py` : il met à jour `formations.json` (lu par l'extension) et refait le zip ; la
vérification avant chaque envoi le rappelle si on l'oublie.

## 2. Donner au campus sa propre adresse : campus.fges.fr

On garde GitHub Pages (mise en ligne par `git push`, avec la vérification automatique avant chaque envoi, HTTPS
gratuit) et on lui donne une adresse FGES. Si le DNS n'est pas prêt pour la JPO, l'adresse github.io fonctionne
très bien en attendant : tout le reste du guide s'applique pareil.

1. **DNS** (chez l'hébergeur du domaine fges.fr, ou demande à la DSI si elle en a la main) : un enregistrement
   `CNAME` `campus` → `lwichlacz.github.io.`
2. **GitHub**, dépôt `lwichlacz/campus_fges` → *Settings → Pages → Custom domain* : `campus.fges.fr`, *Save*,
   puis cocher **Enforce HTTPS** dès que GitHub le propose (quelques minutes à quelques heures).
3. **Dans le dépôt** :
   - créer un fichier `CNAME` à la racine contenant la seule ligne `campus.fges.fr` ;
   - remplacer `https://lwichlacz.github.io/campus_fges/` par `https://campus.fges.fr/` dans les balises
     `og:image` de `index.html` et `liste.html` (l'aperçu quand on partage le lien) ;
   - `python tools/version.py`, commit, push.
4. **WordPress** : *Campus 3D → Réglages → Adresse du campus* : `https://campus.fges.fr/`, et l'ancienne adresse
   dans *Réglages avancés* le temps de la bascule.

L'ancienne adresse github.io redirige alors toute seule vers campus.fges.fr : les liens et QR codes déjà
diffusés continuent de marcher.

## 3. Les entrées depuis fges.fr

Toujours un **lien simple** (même onglet ou nouvel onglet), jamais une iframe. Chaque lien porte des paramètres
`utm_…` : ils sont transmis au CRM avec chaque demande de plaquette, ce qui permet de savoir d'où vient le contact.

| Où | Quoi | Lien |
|---|---|---|
| Menu principal | « Campus 3D » | `https://campus.fges.fr/?utm_source=fges.fr&utm_medium=menu` |
| Page d'accueil | Un bloc : l'image `img/apercu.jpg`, une phrase, un bouton « Visiter le campus en 3D » | `https://campus.fges.fr/?utm_source=fges.fr&utm_medium=accueil` |
| Fiche de chaque formation **qui a un jeu** | Bouton « Joue au mini-jeu de la formation » | `https://campus.fges.fr/?jeu=<id>&utm_source=fges.fr&utm_medium=fiche&utm_campaign=<id>` |
| Fiche des autres formations | Lien « Découvre le campus en 3D » | `https://campus.fges.fr/?utm_source=fges.fr&utm_medium=fiche` |
| Page JPO | Bloc « Prépare ta visite en 3D » | `https://campus.fges.fr/?utm_source=fges.fr&utm_medium=jpo` |
| Affiches et flyers JPO | QR code | `https://campus.fges.fr/?utm_source=jpo&utm_medium=qr&utm_campaign=jpo-2026-11` |
| Pied de page ou page accessibilité | « Version sans 3D » | `https://campus.fges.fr/liste.html` |

Identifiants des formations qui ont un jeu (`?jeu=`) : `gestion`, `sv`, `cfa`, `spi`, `info` (licences) ;
`dmb`, `dgp`, `mbif`, `ebmd` (masters). À compléter au fil des nouveaux jeux (`GAMES` dans `js/data.js`).

**Fiches formation (Elementor)** : chaque fiche qui a un jeu reçoit deux codes, tous deux dans le widget HTML du
haut de la fiche (jamais dans le widget des onglets) : le **bouton « Tester la licence (le master) en 3D »**, à
ajouter à la fin de la rangée de boutons du bandeau principal (`<div class="lh-btns">`, après « Contactez-nous »),
et le **bandeau Campus 3D** (vignette du lieu, titre, bouton « Lancer la mission »), juste sous les chiffres clés.
Les codes prêts à coller sont dans `docs/bandeaux/` (`<formation>-bouton.html` et `<formation>.html`) ; ouvrir
`docs/bandeaux/index.html` pour les voir tous et copier chaque code d'un clic. Chaque bandeau prend la couleur de son
école, comme le reste de la fiche : turquoise FGES, bordeaux ISEA, or EDN (`ECOLES` dans `tools/fiches/bandeaux.py`). Exemple complet :
`docs/fiche-sv-complete.html` (titre, bandeau principal avec le bouton « Tester la licence en 3D », bandeau Campus 3D).

**Routine à chaque nouveau mini-jeu** (le vérificateur refuse un jeu qui n'a pas sa vignette ou son bandeau) :
1. ajouter son cadrage dans `tools/fiches/captures.js` (lieu, caméra, cible) ;
2. `python tools/fiches/recepteur.py`, puis dans le campus ouvert avec `?debug` :
   `const V = await import("/tools/fiches/captures.js"); await V.essai("<jeu>"); await V.une("<jeu>")`
   → `img/fiches/<jeu>.jpg` ;
3. `python tools/wordpress/build.py` puis `python tools/fiches/bandeaux.py` → `docs/bandeaux/<formation>.html` ;
4. pousser (la vignette doit être en ligne), puis coller le bandeau sur la fiche de la formation.

Dans WordPress, le plus simple : le **bloc « Campus 3D »** de l'extension (carte, bouton ou lien, formation au
choix) ; il fabrique le bon lien tout seul. L'onglet **Campus sur le site** de l'extension reprend ce tableau et
génère les liens et les QR codes.

## 4. Le jour de la JPO (stand)

- Ordinateur ou tablette du stand : `https://campus.fges.fr/?borne` en plein écran (F11). Pas d'écran d'accueil,
  visite guidée en boucle, retour à la visite après 30 s sans que personne ne touche l'écran.
- Un QR code imprimé à côté de l'écran (lien de la ligne « Affiches et flyers » ci-dessus) pour continuer sur
  son téléphone et demander les plaquettes.
- La veille : `python tools/version.py`, push, puis ouvrir le site sur un téléphone et faire une demande de
  plaquette de test.

## 5. Encore à fournir

- Les liens PDF des plaquettes, formation par formation : `PLAQUETTES` dans [`js/data.js`](../js/data.js)
  (téléverser les PDF dans la médiathèque WordPress et copier leur adresse). En attendant, le formulaire renvoie
  vers le catalogue Calaméo.
- Mesure d'audience (plus tard) : la FGES utilise déjà Matomo (voir ses mentions légales).
