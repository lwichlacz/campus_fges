# Fiche de validation · Mini-jeu « The Lone Star order » (Licence Internationale Économie & Gestion, FGES)

**À relire par :** un enseignant de la Licence Internationale Économie & Gestion
**Refonte du 23/11/2026 :** l'ancien « Cargo » enchaînait cinq épreuves indépendantes (change, prix, Incoterm, négociation, choix du marché). Le jeu suit désormais **un seul dossier**, sur le modèle de L'Enquête de l'auditeur (CFA) : un métier réel, des gestes sur de vraies pièces, une question à trancher.
**Le métier :** analyste export (*export analyst*) chez Beffroi Bikes, fabricant lillois de vélos électriques (**fictif**). La responsable export, Maya Dubois, envoie ses messages au joueur.
**Le dossier :** la première commande américaine. Lone Star Cycles (Austin, Texas) achète 120 vélos Urban E7 à 2 350 $, soit **282 000 $**, payés par **lettre de crédit**. Le bateau part d'Anvers le vendredi 27 novembre à 17 h. **Sera-t-on payé ?** Chaque jour de la semaine ajoute une pièce au dossier export ; le vendredi, la banque paie… si tout est conforme.
**Univers :** le bureau export de l'entreprise, en plein jour : bureau en chêne, fenêtre sur l'entrepôt (cartons de vélos, conteneur), planisphère des ventes, horloges Lille et Austin, un vélo d'exposition. Les documents sont posés sur le bureau.
**Durée :** environ 7 minutes ; la première scène (la lettre de crédit) se joue en une minute, puis un palier propose de continuer.
**Langue :** tout le jeu est en anglais, comme la licence.
**Fichier :** `js/games/cargo.js` (contenus en tête : `COURSES`, `CONTRACT`, `LC_ROWS`, `STOPS`, `FLAG_HELP`, `RIVALS`, `REQS`).

> Entreprises, banques, transitaire, assureur, navire, personnes et chiffres sont **fictifs et simplifiés**.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Jour | Pièce du dossier | Geste du joueur | Cours révélé (à vérifier) |
|---|---|---|---|
| Lundi · la lettre de crédit | Demande d'amendement | Relit le crédit documentaire (message SWIFT MT700) ligne à ligne contre le contrat signé et **entoure au stylo rouge** les trois écarts : montant, Incoterm, date limite d'expédition | L1 · Contract law ; L1 à L3 · Business English |
| Mardi · la route | CIF et assurance | Sur la carte de la route posée sur le bureau, **plante deux drapeaux** : là où le risque passe à l'acheteuse, là où nos frais s'arrêtent. Le porte-conteneurs traverse ensuite l'Atlantique | L2 · International economics & trade |
| Mercredi · le dollar | Contrat à terme | Sur l'écran du desk de change de la banque, le cours à terme EUR/USD bouge en direct ; la BCE laisse entendre une hausse de taux et l'euro monte. Le joueur **touche le bon ordre** (vendre ses dollars à terme) **au bon moment** (sous le cours d'équilibre) | L2 · International finance |
| Jeudi · le prix | Prix public américain | Sur le rayon du magasin d'Austin, **fait glisser l'étiquette** du prix conseillé (MSRP) le long d'une règle graduée, face aux quatre concurrents ; la marge du distributeur s'affiche en direct | L2 · International marketing |
| Vendredi · les documents | Documents conformes | **Tire au crayon** chaque exigence du crédit vers la case qui la prouve (facture, connaissement, certificat d'assurance) et **démasque** le connaissement marqué « FREIGHT COLLECT » ; le transitaire le réémet, la banque paie | L3 · Trade operations & documentary credit |
| Bilan | — | Montant encaissé en euros, récapitulatif du dossier, cours, et l'année à l'étranger en L3 | L3 · A year abroad |

- [ ] Les intitulés de cours et leurs années correspondent-ils à la maquette ? (Ils sont repris du programme annoncé : économie internationale, finance, marketing, droit des contrats, anglais des affaires ; les intitulés exacts sont à corriger.)
- [ ] Le métier d'analyste export est-il un débouché crédible pour présenter la licence ? Faut-il nommer un autre poste (assistant export, chargé d'affaires internationales) ?

## 2. Les contenus à vérifier

**Le contrat (signé le 16/11/2026)** : 120 vélos × 2 350 $ = 282 000 $ ; Incoterms® 2020 CIF Houston ; navire MV Scheldt Star, départ d'Anvers le 27/11/2026 ; paiement par lettre de crédit à 60 jours date de connaissement.

**La lettre de crédit (lundi)** : neuf lignes, trois écarts à entourer.

| Ligne | Valeur du crédit | Écart ? |
|---|---|---|
| :32B: Montant | USD 228,000.00 | **Oui** : chiffres inversés, 282 000 $ au contrat |
| :45A: Marchandise et Incoterm | FOB Antwerp | **Oui** : CIF Houston au contrat |
| :44C: Date limite d'expédition | 20 novembre 2026 | **Oui** : le navire part le 27 |
| :20:, :50:, :59:, :44E/F:, :42C:, :31D: | référence, donneur d'ordre, bénéficiaire, ports, paiement à 60 jours, validité au 31/12/2026 à Lille | Non |

- [ ] Explication donnée : « la banque ne lit pas le contrat, elle vérifie seulement que nos documents sont conformes à **son** crédit » (autonomie du crédit documentaire). Formulation juste pour un lycéen ?
- [ ] La demande d'amendement retient : 282 000 $, CIF Houston, expédition au plus tard le 30/11/2026.

**L'Incoterm CIF (mardi)** : le risque passe **à bord du navire, à Anvers** ; les frais (fret et assurance) courent **jusqu'au port de Houston**. Messages d'erreur : à Lille = EXW ; en plein océan = aucun point de transfert ; à Houston pour le risque = « le piège classique du CIF » ; à Austin = DDP ; frais arrêtés à Anvers = FOB.
- [ ] Assurance : le vendeur assure pour au moins **110 % du prix** (Incoterms 2020). Le jeu affiche 110 % × 282 000 $ = **310 200 $**. Le certificat mentionne les Institute Cargo Clauses **(A)** (au-delà du minimum (C) exigé en CIF) : à garder ou simplifier ?

**Le change (mercredi)**

| Donnée | Valeur |
|---|---|
| Recette attendue | 282 000 $ dans 60 jours |
| Besoin (coûts + marge, fiche de coût posée sur le bureau) | 240 000 € (vélos 204 000 €, camion 3 000 €, fret 8 500 €, assurance 1 500 €, marge 23 000 €) |
| Cours d'équilibre | 282 000 / 240 000 = 1,1750 $ pour 1 € |
| Cours à terme simulé | part de 1,1655, monte vers 1,188 après l'annonce de la BCE, puis oscille autour de 1,172 |

Ordre attendu : **vendre** 282 000 $ à terme quand le cours est sous 1,1750. Acheter des dollars est une erreur (« on va recevoir des dollars ; en acheter doublerait le risque »). Vendre au-dessus du cours d'équilibre aussi (on toucherait moins de 240 000 €).
- [ ] Sens de la cotation (1 € = x $) et explication de la hausse de l'euro défavorable à l'exportateur : clairs ?
- [ ] La BCE qui « laisse entendre une hausse de taux » est **inventée pour le jeu**.

**Le prix public (jeudi)** : coût rendu Austin pour le distributeur 2 600 $ par vélo (notre prix 2 350 $ + 250 $ de transport intérieur, droits et manutention, simplifiés) ; le distributeur veut au moins 30 % du prix public, d'où un plancher de 2 600 / 0,7 ≈ **3 715 $**. Plafond : le leader du rayon à **4 999 $** (plus d'autonomie). Toute étiquette entre les deux est acceptée (prix arrondis en …99 $) ; 3 999 $ est commenté comme prix psychologique.

| Concurrent (fictif) | Prix | Argument |
|---|---|---|
| BigBox Cruiser | 1 299 $ | 40 km d'autonomie |
| Trailhawk City | 2 499 $ | 60 km |
| Austin Volt | 3 499 $ | 80 km |
| Velo Nord Premium | 4 999 $ | 130 km, fabriqué aux Pays-Bas |
| **Beffroi Urban E7** | à placer | 120 km, fabriqué à Lille |

- [ ] Les droits de douane américains sur les vélos électriques européens ne sont pas détaillés (inclus dans les 250 $) : à préciser ?

**Les documents (vendredi)**

| Exigence du crédit amendé | Preuve attendue |
|---|---|
| Facture commerciale de 282 000,00 $ | Facture n° BB-26-118, case « Total amount » |
| Connaissement : embarqué au plus tard le 30/11/2026 | Connaissement, case « Shipped on board 27 NOV 2026 » |
| Connaissement marqué FREIGHT PREPAID | Le connaissement dit **FREIGHT COLLECT** : c'est la réserve à démasquer ; le transitaire le réémet en FREIGHT PREPAID |
| Assurance pour 110 % : 310 200,00 $ | Certificat d'assurance, case « Sum insured » |

Le joueur peut signaler le « FREIGHT COLLECT » en touchant la case (sans erreur) ; s'il y tire le trait de l'exigence 3, c'est compté comme une erreur, et la réserve est révélée.
- [ ] Le connaissement « à ordre de la banque émettrice » et le principe de conformité stricte sont-ils correctement résumés ?

**Le bilan** : paiement de 282 000 $ le 26 janvier 2027 (60 jours après le 27/11), converti au cours à terme obtenu (environ 240 000 €). Appréciation : « excellent » jusqu'à 2 erreurs, « very good » jusqu'à 6, « good » au-delà.

## 3. Remarques libres

…
