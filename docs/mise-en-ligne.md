# Mise en ligne du Campus FGES (guide du webmaster)

Trois chantiers, dans cet ordre : **1.** brancher le formulaire sur le CRM, **2.** donner au campus sa propre
adresse, **3.** créer les entrées depuis fges.fr. Compter une demi-journée en tout, hors délai du DNS.

## Le principe : le campus vit à côté de WordPress, pas dedans

```
fges.fr (WordPress)                         campus.fges.fr (GitHub Pages)
├─ menu, accueil, fiches formation ──liens──▶ le campus 3D (index.html)
├─ page JPO                                   ├─ ?jeu=gestion  → un mini-jeu directement
└─ /wp-json/campus-fges/v1/lead ◀──formulaire─┘ └─ liste.html    → version sans 3D
        │ (extension « relais »)
        ▼
   CRM FGES  /api/webhooks/wordpress-form   (clé d'import, jamais dans le navigateur)
```

**Pourquoi pas une page WordPress ou une iframe :** le campus charge des modules JavaScript que les extensions
de cache et de minification de WordPress cassent ; dans une iframe, sur téléphone, les gestes du jeu se battent
avec le défilement de la page, le plein écran et le son sont bridés, et on perd les liens directs vers les
jeux. On garde donc le campus en site statique, sur sa propre adresse, et WordPress y renvoie par des liens.

## 1. Brancher le formulaire sur le CRM (avant tout le reste)

Aujourd'hui l'adresse du relais est vide : en ligne, le formulaire est en **mode démo** (il affiche la
confirmation mais rien n'arrive au CRM).

1. **Installer l'extension.** Déposer [`tools/wordpress/campus-fges-relais.php`](../tools/wordpress/campus-fges-relais.php)
   dans `wp-content/plugins/` (SFTP ou *Extensions → Ajouter → Téléverser*, après l'avoir zippé), puis activer
   **« Campus FGES · relais du formulaire »**.
2. **Ajouter les réglages dans `wp-config.php`**, au-dessus de la ligne `/* That's all, stop editing! */` :

   ```php
   define('CAMPUS_FGES_CRM_URL',   'https://adresse-du-crm');      // le CRM, joignable depuis le serveur WordPress
   define('CAMPUS_FGES_CRM_TOKEN', 'la-clé-d-import');             // = IMPORT_TOKEN du .env du CRM (16 caractères minimum)
   define('CAMPUS_FGES_CRM_LIVE',  false);                         // mode essai d'abord
   define('CAMPUS_FGES_ORIGINS',   'https://lwichlacz.github.io'); // + 'https://campus.fges.fr' une fois l'étape 2 faite
   ```

3. **Vérifier que rien ne bloque l'API de WordPress.** Si une extension de sécurité (Wordfence, iThemes,
   « Disable REST API »…) filtre `/wp-json/`, autoriser la route `campus-fges/v1`. Si une extension de cache est
   active, exclure `/wp-json/` du cache.
4. **Tester en mode essai** depuis un terminal :

   ```bash
   curl -s -X POST https://www.fges.fr/wp-json/campus-fges/v1/lead -H "Content-Type: application/json" -H "Origin: https://lwichlacz.github.io" -d "{\"prenom\":\"Test\",\"email\":\"test@example.com\",\"consentement\":true,\"elapsed\":5000,\"formations\":[{\"name\":\"Licence Gestion\",\"school\":\"FGES\"}]}"
   ```

   Réponse attendue : `{"ok":true,"sent":1,"dryRun":true}`. Un 404 veut dire que l'extension n'est pas active
   (ou que les permaliens sont en « simple » : passer en « nom de l'article ») ; un 403, que l'origine n'est pas
   dans `CAMPUS_FGES_ORIGINS`.
5. **Dire au campus où est le relais.** Dans [`js/data.js`](../js/data.js) :

   ```js
   export const LEAD_ENDPOINT = "https://www.fges.fr/wp-json/campus-fges/v1/lead";
   ```

   puis `python tools/version.py`, commit, push.
6. **Passer en réel** : `CAMPUS_FGES_CRM_LIVE` à `true`, puis faire une vraie demande depuis le campus (carnet →
   « Recevoir les plaquettes ») et vérifier que le contact apparaît dans le CRM avec la source
   « Campus FGES (jeu 3D) ». En cas d'échec, les erreurs sont dans le journal PHP (`[Campus FGES] …`).

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
4. **WordPress** : ajouter `https://campus.fges.fr` dans `CAMPUS_FGES_ORIGINS` (séparé par une virgule).

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

Dans WordPress, le plus efficace : un **bloc réutilisable** (ou « composition ») « Campus 3D » avec l'image et le
bouton, inséré sur l'accueil, la page JPO et les fiches ; on ne change ensuite que le lien `?jeu=` par fiche.

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
