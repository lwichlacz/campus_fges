# Fiche de validation · Mini-jeu « La clinique rurale » (Prépa concours B Véto et Agro)

**À relire par :** un enseignant de la prépa (parcours de la Licence Sciences de la Vie)
**Vérifié en partie (13/11/2026) :** la plaquette FGES 2025-2026 décrit la Licence Sciences de la Vie (convention UPHF, 100 étudiants en L1, poursuites en écoles d'ingénieurs agro : ISA, ISARA, UniLaSalle, AgroParisTech…) mais pas encore la préparation au concours B, plus récente. Le jeu s'appuie sur les épreuves nationales du concours B (biologie, chimie, géologie, physique, maths) et cite les quatre écoles vétérinaires publiques.
**Objectif du jeu :** faire vivre une journée de vétérinaire rural où chaque cas mobilise une matière du concours B, jusqu'à l'oral.
**Univers :** une ferme-clinique au petit matin (la Clinique des Prés, fictive), une table d'examen, une stalle, une carrière, un champ ; la docteure Hélène Vasseur (fictive) guide le joueur ; l'interface est une application de dossier clinique.
**Durée :** environ 7 minutes ; la première consultation se joue en une minute, puis un palier propose de continuer.
**Fichier :** `js/games/clinique.js`.

Merci de cocher, corriger ou commenter chaque point.

## 1. Déroulé

| Scène | Matière | Ce que fait le joueur | Réponse attendue |
|---|---|---|---|
| Pixel, chien agité | Biologie, chimie | Glisse le stéthoscope sur le cœur et tape le rythme (176/min, normal 60 à 140), prend la température (39,6 °C), interroge le propriétaire, joue une carte diagnostic | Intoxication au chocolat (théobromine) ; traitement : charbon activé, perfusion, surveillance |
| Marguerite, vache | Biologie, chimie | Écoute le rumen (aucune contraction ; normal 1 à 3 par minute), trempe une bandelette de pH (5,2) | Acidose ruminale après un apport brutal d'orge (amidon → acide lactique) |
| La carrière | Géologie | Touche les roches de la plus ancienne à la plus récente | Grès, argile, calcaire à fossiles, sable, filon de basalte (qui les recoupe), sol |
| Le champ | Agronomie | Compose une rotation sur trois ans, avec une jauge d'azote | Une légumineuse (féverole) avant le blé ; jamais deux fois la même culture d'affilée |
| L'oral | Oraux | « Pourquoi le chocolat est-il plus dangereux pour un chien ? » | Le chien élimine la théobromine bien plus lentement |

- [ ] Les valeurs (fréquence cardiaque, température, contractions du rumen, pH) sont-elles justes en ordre de grandeur ?
- [ ] Le bilan cite les écoles vétérinaires (VetAgro Sup, Oniris, Alfort, Toulouse) et les écoles d'agronomie : formulation correcte ?

## 2. Remarques libres

…
