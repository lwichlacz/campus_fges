# Fiche de validation · Mini-jeu « Le troupeau du Riez » (Prépa concours B Véto et Agro)

**À relire par :** un enseignant de la prépa (parcours de la Licence Sciences de la Vie), idéalement avec un·e vétérinaire.
**Objectif du jeu :** faire vivre à un lycéen le métier de vétérinaire rural·e (et, pour la dernière décision, d'ingénieur·e agronome), et l'esprit de la prépa : chaque matière du concours B sert à résoudre un vrai dossier. Un premier essai bâclé est barré au dossier, expliqué, puis refait avec la méthode.
**Le dossier :** à la ferme du Riez (fictive, dans les Flandres), les génisses flamandes maigrissent depuis la rentrée ; la n° 27 tient à peine debout. L'éleveur, Rémi, accuse le nouvel aliment. Verdict : fasciolose (grande douve du foie), contractée dans une zone humide argileuse du pré du bas où vivent des limnées ; l'aliment est mis hors de cause grâce au pré du haut, qui sert de groupe témoin.
**Univers :** l'étable (la génisse au cornadis, la caisse du vétérinaire), les deux prés et le ru, le labo de la clinique ; l'interface est le dossier de visite de la clinique (chemise kraft, papier ligné) ; la Dre Hélène Vasseur, vétérinaire associée (fictive), y colle ses mots.
**Durée :** environ 7 minutes ; la première scène (l'examen) se joue en une minute, puis un palier propose de continuer.
**Fichier :** `js/games/clinique.js` (constantes en tête : `T_CHEST`, `T_BELLY`, `P_EXP`, `TEMP`, `HCT`, `N_SICK`, `W_SICK`, `PRE_HA`, `WET`, `EGGS`).

Merci de cocher, corriger ou commenter chaque point.

## 1. Déroulé

| Étape | Matières | Geste du joueur | Premier essai qui bute | Preuve |
|---|---|---|---|---|
| 1 · L'examen | Maths, biologie | Passer le ruban barymétrique autour de la poitrine (P ≈ 80 × T³), maintenir le thermomètre jusqu'au bip, tirer la paupière et comparer la muqueuse au nuancier | Ruban passé sur le ventre (1,88 m → 532 kg) ; thermomètre retiré avant le bip | 340 kg au lieu de ≈ 420 kg, 38,6 °C, muqueuses pâles |
| 2 · Le troupeau | Maths | Marquer à la bombe les génisses maigres des deux prés (même aliment partout) | Marquer une génisse en bon état, ou la plus jeune, petite mais pas maigre | Pré du bas 7/12 (58 %), pré du haut 0/12 : l'aliment est hors de cause (groupe témoin) |
| 3 · Le sang | Physique, biologie | Prise de sang à la veine de la queue, tube dans la centrifugeuse, tube d'eau d'équilibrage en face, lecture de l'hématocrite au trait | Lancer la centrifugeuse avec un seul tube : rotor déséquilibré | Hématocrite 18 % (normale 24 à 46 %) : anémie |
| 4 · Les bouses | Chimie, physique, biologie | Flottation (lamelle sur le tube, solution de densité 1,2), puis sédimentation : décanter le verre à pied sans perdre le culot ; mesurer un œuf au microscope | La flottation ne montre que des strongles (les œufs de douve, plus denses, coulent) ; culot versé à l'évier | Œufs de grande douve : jaune doré, operculés, 140 µm |
| 5 · Le pré du bas | Géologie, écologie | Carotter le sol à la tarière en trois points, fouiller la boue, tracer au doigt une clôture autour de la zone humide | Clôture qui laisse une limnée dehors, ou qui prend plus de 30 % du pré | Argile grise à taches de rouille (sol hydromorphe) ; limnées tronquées |
| 6 · L'ordonnance | Maths | Régler le pistolet doseur (1 mL pour 10 kg) sur la plus lourde du lot (378 kg → 38 mL), puis signer | Doser sur le poids moyen (336 kg → 34 mL) : sous-dosage, risque de résistance | Ordonnance signée : douvicide, clôture, aliment hors de cause |

- [ ] Le scénario (fasciolose chez des génisses pâturant une zone humide, anémie, amaigrissement, sans fièvre) est-il réaliste et représentatif du métier ?
- [ ] Formule barymétrique simplifiée P ≈ 80 × T³ (T en mètres) : acceptable pour des lycéens ? Poids attendu ≈ 420 kg à 18 mois pour une génisse flamande : correct ?
- [ ] Température normale 38 à 39,5 °C, hématocrite normal 24 à 46 % chez les bovins : correct ?
- [ ] Coproscopie : la flottation au NaCl (densité ≈ 1,2) laisse échapper les œufs de grande douve, qu'on recherche par sédimentation. Formulation correcte ?
- [ ] Œufs de Fasciola hepatica ≈ 140 µm, jaune doré, operculés ; œufs de strongles ≈ 80 µm, gris, à coque fine : correct ?
- [ ] Cycle présenté : douve adulte (foie) → œufs (bouses) → larve nageuse (eau) → limnée tronquée → larves enkystées sur l'herbe → génisse. Simplification acceptable ?
- [ ] Sol hydromorphe (argile grise, taches de rouille) : vocabulaire juste pour l'épreuve de géologie ?
- [ ] Mise en défens de la zone humide plutôt que traitement à vie : bonne pratique à présenter ainsi ?
- [ ] Produit fictif « 1 mL pour 10 kg », dose réglée sur l'animal le plus lourd du lot pour éviter le sous-dosage et les résistances : correct ?
- [ ] Le bilan cite les quatre écoles vétérinaires publiques (Alfort, VetAgro Sup à Lyon, Oniris à Nantes, Toulouse) et les écoles nationales d'agronomie (AgroParisTech, L'Institut Agro…) ouvertes par le concours B : formulation correcte ?
- [ ] La plaquette FGES 2025-2026 ne décrit pas encore la préparation au concours B : le texte du bilan (« la prépa travaille les épreuves en même temps que la Licence Sciences de la Vie, avec des colles chaque semaine ») est-il exact ?
- [x] Aucun taux de réussite affiché.

## 2. Remarques libres

…
