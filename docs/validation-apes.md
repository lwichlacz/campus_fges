# Fiche de validation · Mini-jeu « L'eau des Tilleuls » (APES, année préparatoire aux études scientifiques)

**À relire par :** un enseignant de l'APES
**Objectif du jeu :** faire vivre à un lycéen le métier de technicien·ne d'analyse en laboratoire, et l'esprit de l'APES : la méthode scientifique, « apprendre à apprendre ». Un premier essai bâclé fausse la preuve ; on barre dans le cahier, on comprend, on refait avec la méthode.
**Le dossier :** à l'école des Tilleuls (fictive), douze élèves ont la gastro, tous ont mangé à la cantine. L'eau du robinet est-elle en cause ? Verdict : oui (E. coli, chlore épuisé dans une canalisation où l'eau stagnait) ; la piste des nitrates des champs est écartée.
**Univers :** la cantine (prélèvement, dosage sur place) puis un laboratoire des eaux en 3D ; l'interface est le cahier de laboratoire à petits carreaux ; Nadia Keller, responsable du labo (fictive), y laisse ses visas.
**Durée :** environ 7 minutes ; la première scène (le prélèvement) se joue en une minute, puis un palier propose de continuer.
**Fichier :** `js/games/tp.js` (constantes en tête : `T_HOT`, `T_NET`, `VEQ`, `K_CL`, `STD`, `A_ECH`, `N_BLUE`, `N_PINK`).

Merci de cocher, corriger ou commenter chaque point.

## 1. Déroulé

| Étape | Matières | Geste du joueur | Premier essai qui bute | Preuve |
|---|---|---|---|---|
| 1 · Prélever | Physique, maths | Flamber le bec au chalumeau, ouvrir le robinet, attendre une température stable (courbe qui tend vers un palier), remplir le flacon stérile au trait | Remplir tout de suite : l'eau du tuyau (19,6 °C) n'est pas celle du réseau | 19,6 °C au premier jet, 12,4 °C après ~11 L : l'eau stagnait |
| 2 · Chlore | Chimie | Dosage DPD/FAS à la burette : on ouvre le robinet en le faisant glisser, le rose disparaît à l'équivalence (4,0 mL ; 1 mL = 0,01 mg/L) | Verser à flot : la valeur, trop forte, ferait croire l'eau protégée | Chlore libre 0,04 mg/L (0,3 en sortie d'usine) |
| 3 · Nitrates | Physique, chimie, maths | Spectrophotomètre : blanc puis ZÉRO, étalons 10/25/50 mg/L, tracer la droite d'étalonnage par l'origine, y lire l'échantillon (A = 0,236) | Mesurer un étalon sans avoir fait le zéro (décalage de 0,085) | 19 mg/L < 50 : fausse piste écartée |
| 4 · Bactéries | SVTU, maths | Filtration sur membrane, gélose chromogène, étuve 36 °C 21 h, pointer au feutre les colonies bleues | 100 mL filtrés : boîte indénombrable ; on refait avec 10 mL | 14 E. coli / 10 mL = 140 / 100 mL (limite 0) ; coliformes 200 / 100 mL |
| 5 · Microscope | SVTU, physique | Mise au point à ×10, objectif ×100, goutte d'huile à immersion, mesurer un bacille | ×100 sans huile : image sombre et floue | Bacilles Gram négatif de 2 µm |
| 6 · Bulletin | — | Juger chaque ligne (conforme / non conforme) face à sa limite, puis signer au doigt | Une case fausse : le stylo s'arrête | Bulletin signé : eau non conforme |

- [ ] Les gestes sont-ils représentatifs des TP de l'APES et du métier visé ?
- [ ] Dosage du chlore libre DPD/FAS (FAS dilué, 1 mL = 0,01 mg/L) : simplification acceptable ?
- [ ] « Repère ≥ 0,1 mg/L » de chlore libre au robinet : formulation correcte (ce n'est pas une limite réglementaire) ?
- [ ] Limites affichées : E. coli et coliformes 0 / 100 mL, nitrates 50 mg/L. Correct ?
- [ ] Incubation 21 h à 36 °C sur gélose chromogène (E. coli bleues, autres coliformes roses) : correct ?
- [x] Programme vérifié sur la fiche fges.fr (19/11/2026) : parcours Sciences de la Vie (maths, physique, chimie, SVTU) et Maths-Physique-Chimie ; ateliers méthodologiques au S1 ; poursuites d'études citées dans le bilan.
- [x] Aucun taux de réussite affiché (la fiche annonce 94 %, la plaquette 57 % en 2023-24 : à harmoniser).

## 2. Remarques libres

…
