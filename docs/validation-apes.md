# Fiche de validation · Mini-jeu « La salle de TP » (APES, année préparatoire aux études scientifiques)

**À relire par :** un enseignant de l'APES
**Objectif du jeu :** montrer à un lycéen ce que l'APES lui apporte : prendre pied en sciences et, surtout, apprendre à apprendre. Chaque premier essai bute ; l'atelier de méthode fait réussir le second.
**Univers :** une salle de travaux pratiques le soir, porte fermée par quatre cadenas ; un tableau noir où s'écrit la courbe ; M. Diallo, professeur de méthodologie (fictif), écrit ses conseils à la craie.
**Durée :** environ 6 minutes ; la première scène (le dosage) se joue en une minute, puis un palier propose de continuer.
**Fichier :** `js/games/tp.js` (constantes en tête : `VEQ`, `CB`, `VA`, `L`, `DROP`, `SLIDES`).

Merci de cocher, corriger ou commenter chaque point.

## 1. Déroulé

| Cadenas | Matière | Ce que fait le joueur | Le premier essai qui bute | La méthode |
|---|---|---|---|---|
| 1 | Chimie | Verse la soude en maintenant un bouton ; la phénolphtaléine vire au rose pâle à l'équivalence (12,4 mL) | Verser trop vite et dépasser (fuchsia) | Un dosage rapide pour situer l'équivalence, puis vite jusqu'à 11 mL et goutte à goutte |
| 2 | Physique | Chronomètre un pendule de 50 cm pour trouver g = 4π²L/T² | Mesurer une seule période (erreur du doigt énorme) | Mesurer dix périodes et diviser par dix |
| 3 | SVTU | Règle un microscope (×4, ×10, ×40, vis de mise au point) et identifie trois lames : élodée (végétale), frottis de joue (animale), yaourt (bactéries) | Commencer directement au ×40 : on ne voit rien | Toujours partir du ×4, faire le point, puis monter |
| 4 | Maths | Fait passer une droite par l'origine au plus près des points d'une chute libre | Tracer d en fonction de t : les points courbent | Changer de variable : d en fonction de t², pente 4,9, donc g = 9,8 |

- [ ] Les quatre manipulations sont-elles représentatives des TP de l'APES ?
- [ ] Le calcul c(acide) = c(soude) × V(éq) ÷ V(acide) = 0,10 × 12,4 ÷ 20 = 0,062 mol/L convient-il ?
- [ ] L'élodée est donnée comme exemple de cellule végétale (paroi, chloroplastes) ; la joue comme cellule animale (pas de paroi) ; les lactobacilles comme bactéries (pas de noyau). Correct ?
- [x] Les deux parcours (Sciences de la Vie, Maths-Physique-Chimie) sont confirmés par la plaquette FGES « Licences & Masters 2025-2026 », comme le programme (maths, physique, chimie, SVTU, anglais, ateliers méthodologiques, bases de données et programmation).
- [x] « 94 % de réussite » **retiré** : la plaquette annonce 57 % de réussite en 2023-24 (20 étudiants). Le bilan parle désormais du petit effectif, du suivi personnalisé et des poursuites d'études listées par la plaquette.

## 2. Remarques libres

…
