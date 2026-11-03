# Fiche de validation · Mini-jeu « Courée, la boutique en 3D » (Master E-Business & Marketing Digital)

**À relire par :** la responsable pédagogique du Master E-Business & Marketing Digital
**Objectif du jeu :** faire vivre le métier de chef de projet e-commerce / marketing digital à un candidat bac+3, en lui montrant que chaque décision (UX, référencement, RGPD, acquisition, CRM, logistique) se voit dans les chiffres du site.
**Durée d'une partie :** environ 12 minutes (6 étapes).
**Lien direct :** `?jeu=ebmd` · dans le campus : Wenov, épingle « Studio e-commerce ».
**Fichier du jeu :** `js/games/boutique.js` (les contenus et les chiffres sont regroupés en haut du fichier : `COURSES`, `UX`, `SEO`, `RGPD`, `ACQ`, `SEG`, `MSG`, `BF`).

Merci de cocher, corriger ou commenter chaque point. **Tous les chiffres sont illustratifs** : ils servent à rendre les effets visibles, pas à décrire un marché réel. La marque Courée, les sites concurrents et les personnes sont fictifs.

---

## 1. Principe

- Le joueur arrive en alternance chez **Courée**, une jeune marque lilloise (fictive) de sweats brodés, dont le site vient d'ouvrir.
- À gauche, **le site vu de l'intérieur**, en 3D : les visiteurs arrivent par six portails (recherche, publicité, réseaux sociaux, influence, e-mail, accès direct, chacun sa couleur), traversent l'accueil, le catalogue, la fiche produit et la caisse… ou font demi-tour. Les acheteurs repartent avec un sac et un colis part de l'entrepôt vers la camionnette.
- Au-dessus de chaque pièce, le taux de passage (« 21 % ajoutent au panier »). En haut, les indicateurs du site : visiteurs par jour, conversion, ventes par jour, conformité RGPD, note des avis.
- **Inès, head of growth** (fictive), commente chaque étape par messages, comme dans une messagerie d'équipe.
- Chaque étape est notée de 1 à 3 étoiles ; le total (sur 18) donne la mention : 16+ Très bien, 13+ Bien, 10+ Assez bien, sinon De justesse.

| Étape | Ce que fait le joueur | Cours révélé |
|---|---|---|
| 1 · Tunnel de commande | Choisit 4 corrections au maximum sur une vraie page de commande (avec carte de chaleur) | UX design, UI et accessibilité |
| 2 · Référencement | Choisit le titre, la méta-description et l'adresse d'une fiche produit, voit sa position dans les résultats | Référencement naturel (SEO) |
| 3 · Bannière cookies | Règle la bannière et la case newsletter, voit les visiteurs qui refusent devenir des « fantômes » | Droit du numérique et RGPD |
| 4 · Acquisition | Répartit 3 000 € entre 5 canaux, lit le ROAS, décide quel canal couper | Acquisition et croissance · Web analytics |
| 5 · CRM | Associe 4 segments de clients à 4 messages (+ 1 piège), règle le délai de relance de panier | CRM et relation client |
| 6 · Black Friday | 80 secondes en direct, trafic ×8, 4 alertes à trancher en 14 s | Performance de site et marketing mobile · E-business et logistique |

---

## 2. Étape 1 · Le tunnel de commande

Point de départ : 18 % des paniers arrivés à la caisse sont payés (« 82 paniers sur 100 abandonnés »). Le joueur touche les éléments de la page à faire corriger (4 au maximum, « un sprint »).

| Élément | À corriger ? | Gain (points de taux de paiement) | Explication donnée |
|---|---|---|---|
| Création de compte obligatoire | Oui | +7 | Parmi les premières causes d'abandon ; commande en invité, compte après l'achat |
| Frais de port + frais de dossier découverts à la dernière étape | Oui | +7 | Première cause d'abandon de panier ; les annoncer dès la fiche produit |
| Formulaire de 14 champs (fax, date de naissance…) | Oui | +4 | Effort inutile ; minimisation des données (RGPD) |
| Bouton « Payer » blanc sur gris clair | Oui | +4 | Contraste ≈ 1,3:1 ; WCAG demande au moins 4,5:1 ; « rage clicks » |
| Pop-up « −10 % contre ton e-mail » sur la caisse | Oui (moins prioritaire) | +3 | Interrompt le paiement |
| Récapitulatif du panier | Non (piège) | −2 si retiré | Rassure le client |
| Avis vérifiés et paiement sécurisé | Non (piège) | −2 si retiré | Réassurance |

Notation : 3 ★ si le gain atteint 95 % du meilleur choix possible sans retirer d'élément utile ; 2 ★ dès 60 % ; 1 ★ sinon (2 ★ au maximum si un élément utile est retiré).

- [ ] Les causes d'abandon et leur ordre d'importance sont-ils justes ?
- [ ] Le seuil de contraste et la référence WCAG conviennent-ils ?

## 3. Étape 2 · Le référencement

2 400 recherches par jour autour de « sweat lille » (fictif). Le joueur choisit trois éléments, avec un aperçu en direct du résultat de recherche (titre coupé au-delà de 58 caractères, description au-delà de 150).

| Élément | Bon choix | Autres choix |
|---|---|---|
| Balise titre | « Sweat brodé Vauban, fabriqué à Lille \| Courée » | « Produit 12 – Accueil » (ne dit rien) · « Sweat Lille sweat pas cher sweat… » (suroptimisation, pénalisée) |
| Méta-description | Matière, lieu, livraison offerte dès 60 €, retours 30 jours | Vide (le moteur prend un bout de menu) · « LE MEILLEUR SWEAT DU MONDE !!! » |
| Adresse | `/sweat-brode-vauban` | `/index.php?id_product=12&cat=3` · adresse bourrée de mots-clés |

- Le **classement** dépend du titre et de l'adresse : position 2, 4, 7 ou page 2.
- La **méta-description ne joue pas sur le classement** mais sur le taux de clic (×1,3 si elle est bonne, ×0,9 si vide, ×0,7 si criarde). Taux de clic par position : 15 % (2e), 7 % (4e), 3 % (7e), 0,6 % (page 2).
- Message affiché : « En vrai, il faut des semaines, du contenu et des liens venus d'autres sites pour grimper : ici, on a accéléré le temps. »
- Notation : 3 ★ si les trois sont bons ; 2 ★ si le titre est bon ; 1 ★ sinon.

- [ ] La distinction « le titre classe, la description fait cliquer » est-elle formulée comme vous l'enseignez ?

## 4. Étape 3 · La bannière cookies

Point de départ : la bannière de « l'ancien stagiaire » (refus en 3 clics, cases précochées, traceurs publicitaires chargés avant le choix, newsletter précochée « offres de Courée et de ses partenaires »).

| Réglage | Conforme | Non conforme |
|---|---|---|
| Refuser | Bouton « Tout refuser » aussi visible qu'« Accepter » | Petit lien gris « continuer sans accepter » · seulement « Paramétrer » |
| Finalités | Cases vides | Cases précochées |
| Mesure d'audience | Outil exempté (statistiques anonymes, sans consentement) · ou aucune mesure | Traceurs publicitaires avant le choix |
| Newsletter | Case à cocher soi-même | Case précochée, offres « des partenaires » |

- Taux d'acceptation illustratifs : 55 % avec un vrai bouton « Refuser », 75 % avec un lien discret, 90 % sans refus (+5 points si les cases sont précochées).
- Les visiteurs qui refusent deviennent des **fantômes** sur la maquette : ils achètent quand même. Avec un outil exempté, ils restent comptés (anonymement) ; sans mesure, ils disparaissent des statistiques.
- Si un réglage n'est pas conforme : « mise en demeure » fictive, avec le rappel des amendes de la CNIL de décembre 2021 (150 M€ pour Google, 60 M€ pour Facebook, parce que refuser était plus compliqué qu'accepter).
- **Conséquence plus tard** : une newsletter précochée rend la liste d'e-mails peu fiable à l'étape 4 (rendement de l'e-mail divisé, note des avis en baisse) et le segment « abonnés » est signalé à l'étape 5.
- Notation : 3 ★ si tout est conforme avec l'outil exempté ; 2 ★ si conforme sans mesure ; 1 ★ sinon.

- [ ] Le cas de l'outil de mesure d'audience exempté (lignes directrices de la CNIL) est-il présenté correctement ?
- [ ] La newsletter « avec partenaires » précochée comme exemple de consentement non valable vous convient-elle ?

## 5. Étape 4 · Le budget d'acquisition

3 000 € en 6 tranches de 500 €. Chaque tranche supplémentaire sur un même canal rapporte moins (rendements décroissants). Panier moyen : 52 €.

| Canal | Visites pour 500 € | Conversion | ROAS de la 1re tranche | Chaque tranche suivante |
|---|---|---|---|---|
| Annonces sur les moteurs de recherche | 830 | 3,2 % | 2,8 | ×0,8 |
| Publicités sur les réseaux sociaux | 2 000 | 0,7 % | 1,5 | ×0,85 |
| Créatrice lilloise (12 000 abonnés), mention « collaboration commerciale » | 1 500 | 2,2 % | 3,4 | ×0,15 (même audience) |
| E-mail aux abonnés | 1 200 | 5 % | 6,2 | ×0,25 |
| Bannières sur des sites partenaires | 1 500 | 0,5 % | 0,8 | ×0,9 |

- Si la liste vient d'une case précochée (étape 3) : e-mail à 400 visites et 2 % de conversion.
- Le jeu calcule la meilleure répartition possible ; notation : 3 ★ à 92 % de ce maximum, 2 ★ à 75 %, 1 ★ sinon.
- **Question d'analyse** : « Courée garde environ 50 % de marge. Quel canal couper en premier ? » Bonne réponse : le canal financé au ROAS le plus bas sous 2 (seuil de rentabilité avec 50 % de marge), ou « aucun » s'ils sont tous au-dessus. Une erreur retire une étoile.

- [ ] Les ordres de grandeur (coût par clic, conversion par canal) sont-ils crédibles pour une petite marque ?
- [ ] La règle « ROAS minimum = 1 / taux de marge » est-elle présentée comme vous le souhaitez ?

## 6. Étape 5 · Le CRM

| Segment (fictif) | Bon message | Explication |
|---|---|---|
| 🛒 Paniers abandonnés (312) | Rappel du panier avec les avis clients | Pas de remise d'emblée : sinon les clients apprennent à abandonner pour en obtenir une |
| 💎 Clients fidèles (180, 3 commandes ou plus) | Avant-première de la collection d'hiver | L'exclusivité plutôt que la remise |
| 🧢 Clients d'un seul produit (390) | Le bonnet assorti au sweat | Vente croisée : le panier moyen augmente (+4 €) |
| 📬 Abonnés sans commande (420) | Bienvenue : l'histoire de la marque | Série de bienvenue avant de vendre |
| Piège | « −30 % sur tout, pour tout le monde, tout le temps » | Abîme la marge et l'image (panier moyen −6 €) |

- Délai de relance du panier abandonné : **1 heure** (meilleur), le lendemain (moins bien), une semaine (trop tard).
- Notation : 3 ★ si 4/4 et relance à 1 h ; 2 ★ dès 3/4 ; 1 ★ sinon.

- [ ] Les associations et le délai de relance correspondent-ils aux pratiques enseignées ?

## 7. Étape 6 · Le Black Friday en direct

24 heures en 80 secondes, trafic multiplié par 8 (conversion ×1,5 grâce aux promotions). Quatre alertes ; le joueur a 14 secondes pour chacune, sinon c'est le pire choix qui s'applique.

| Alerte | ★★★ | ★★ | ★ |
|---|---|---|---|
| 🐢 Pages à 5,2 s sur mobile (70 % du trafic) | Compresser les images et activer le cache (1,9 s) | Retirer la vidéo d'accueil (3,4 s) | Ne rien faire. « Selon Google, plus de la moitié des visites mobiles sont abandonnées au-delà de 3 s » |
| 📦 Plus que 45 sweats, ceux de toutes les publicités | Précommande (livraison sous 3 semaines) et pub basculée sur le tote | Couper la pub du sweat | Afficher « Plus que 3 pièces ! » partout (fausse rareté = pratique commerciale trompeuse ; la pub continue vers un produit épuisé) |
| 🚚 Colis en attente, environ 120 expédiés par jour, la page promet 48 h | Annoncer honnêtement « expédié sous 4 jours » et prévenir les clients | Appeler des intérimaires (arrivent dans 3 jours) | Garder « 48 h » |
| 💬 Avis 1★ partagé 2 000 fois | Réponse publique, renvoi d'un sweat neuf, remboursement de la livraison | Réponse en privé seulement | Supprimer l'avis (fausse l'information des clients, interdit) |

- La note des avis clients évolue selon les choix (logistique, avis, fausse rareté).
- Notation : moyenne des quatre alertes (3 ★ à partir de 2,75).

- [ ] La statistique de Google sur les 3 secondes peut-elle être citée ainsi ?
- [ ] Les qualifications juridiques (fausse rareté, suppression d'avis négatifs) sont-elles formulées prudemment et justement ?

## 8. Rapport final

Total sur 18 et titre (« Head of Growth en puissance », « Chef·fe de projet e-commerce », « Alternant·e prometteur·se », « Stagiaire à suivre de près »), étoiles par étape, visiteurs / conversion / ventes par jour avant et après, chiffre d'affaires du Black Friday, liste des cours rencontrés, puis plaquette, lien vers la fiche du master, carnet et « Rejouer ».

- [ ] Les intitulés de cours (`COURSES`) correspondent-ils aux vrais intitulés des UE du master ?
- [ ] Les métiers cités (chef de projet e-commerce, consultant SEO, trafic manager, responsable CRM) vous conviennent-ils ?

## 9. Remarques libres

…
