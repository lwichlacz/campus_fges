# Mise en ligne du Campus FGES

## 1. Version de test (GitHub Pages)

À faire une fois, sur github.com, dans le dépôt `lwichlacz/campus_fges` :

1. **Settings → General → Danger Zone → Change visibility → Make public.**
2. **Settings → Pages** : *Deploy from a branch*, branche `main`, dossier `/ (root)`, **Save**.

Le site est en ligne 1 à 2 minutes plus tard : **https://lwichlacz.github.io/campus_fges/**
Chaque `git push` sur `main` le met à jour automatiquement.

Sur cette adresse, le formulaire est en **mode démo** : il affiche la confirmation mais **ne transmet rien** au CRM.

## 2. Brancher le formulaire sur le CRM (service informatique / webmaster WordPress)

Le relais est prêt : [`tools/wordpress/campus-fges-relais.php`](../tools/wordpress/campus-fges-relais.php).

1. Déposer le fichier dans `wp-content/plugins/` du site fges.fr, puis activer l'extension **« Campus FGES · relais du formulaire »**.
2. Ajouter dans `wp-config.php` :

   ```php
   define('CAMPUS_FGES_CRM_URL',   'https://adresse-du-crm');
   define('CAMPUS_FGES_CRM_TOKEN', 'la-clé-d-import');      // la même que dans le .env local
   define('CAMPUS_FGES_CRM_LIVE',  false);                  // passer à true après le test
   define('CAMPUS_FGES_ORIGINS',   'https://lwichlacz.github.io');
   ```

3. Dans [`js/data.js`](../js/data.js), renseigner l'adresse du relais puis pousser :

   ```js
   export const LEAD_ENDPOINT = "https://www.fges.fr/wp-json/campus-fges/v1/lead";
   ```

4. Tester une demande (mode essai : la réponse contient `"dryRun": true`), puis passer `CAMPUS_FGES_CRM_LIVE` à `true`.

Le relais refuse les envois venant d'une autre adresse que le campus 3D, limite à 5 envois par 10 minutes et par IP, et ignore les robots (champ piège, envoi trop rapide).

## 3. Si le site change d'adresse (ex. campus.fges.fr)

- Mettre à jour l'image d'aperçu dans `index.html` et `liste.html` (`og:image`, adresse complète obligatoire).
- Ajouter la nouvelle adresse dans `CAMPUS_FGES_ORIGINS`.

## 4. Encore à fournir

- Les liens PDF des plaquettes, formation par formation : `PLAQUETTES` dans [`js/data.js`](../js/data.js). En attendant, le formulaire renvoie vers le catalogue Calaméo.
- Mesure d'audience (plus tard) : la FGES utilise déjà Matomo (voir ses mentions légales).
