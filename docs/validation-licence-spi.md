# Fiche de validation · Mini-jeu « Panne avant lundi » (Licence Sciences pour l'Ingénieur, École du Numérique)

**À relire par :** un enseignant de la Licence Sciences pour l'Ingénieur
**Objectif du jeu :** montrer à un lycéen comment travaille un ingénieur face à une panne : observer, mesurer, changer un seul facteur à la fois, prouver chaque cause, puis rendre compte au client.
**Le dossier :** vendredi 15 h, sur le plateau robotique de Wenov. Depuis mardi, la cellule (un bras à 3 articulations, un tapis, une caméra sur la pince, une palette de livraison) **rejette une pièce sur cinq**. Le client attend **12 000 pièces lundi 8 h**, et la cellule ne tourne que samedi, de 6 h à 22 h. Le joueur, stagiaire dans l'équipe, doit trouver les causes, réparer et écrire au client. Karim, technicien de maintenance, l'accompagne (et l'oriente d'abord vers une fausse piste).
**Indices de départ :** le cahier de maintenance de la semaine (mardi : néons remplacés par des LED ; mercredi : tapis nettoyé, capteur remonté ; jeudi : épaule réglée « plus nerveuse » ; coude : aucune intervention depuis 3 ans).
**Mise en scène :** la cellule, le client et les chiffres sont fictifs ; ils ne représentent pas un équipement réel de l'école.
**Durée d'une partie :** 7 à 9 minutes.
**Où le trouver :** dans l'intérieur de Wenov (épingle « Plateau robotique »), dans l'onglet Jeux et sur la fiche de la formation (titre de la carte : « Cellule robotique Wenov »).
**Fichier du jeu :** `js/games/robot.js` (étapes `stepObs`, `stepJeu`, `stepCapteur`, `stepServo`, `stepVision`, `stepProd`).

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Étape | Ce que fait le joueur (geste de l'ingénieur) | Ce qu'il prouve | Cours révélé |
|---|---|---|---|
| 1 · Observer | Rejoue au ralenti les 4 derniers cycles rejetés de la boîte noire. Le bras n'avance que tant qu'il **maintient le bouton d'homme mort** ; il lâche quand ça rate et **relève l'instant**. | Quatre symptômes à quatre endroits du cycle : dépose décalée, saisie de travers, pièce qui s'échappe à la levée, bonne pièce jetée par la caméra. | — |
| 2 · Le coude | **Pilote le coude à la main** (glisser sur la vue 3D) au-dessus d'un comparateur. Amène l'aiguille à 0 en descendant, relève la consigne ; repasse dessous, revient à 0 en remontant, relève encore. Saisit ensuite la compensation de jeu à appliquer. | Le jeu du réducteur : 0,40° entre les deux consignes, soit 9 mm au bout du bras, le décalage observé à la dépose. | L1 · Mécanique et métrologie |
| 3 · La saisie | **Fausse piste :** Karim veut changer la pince. Le joueur mesure son serrage sur la jauge d'effort (52 N pour 40 N exigés) : elle est hors de cause. Puis il lance un cycle **sorties inhibées**, pose deux curseurs sur le **chronogramme** (front du capteur, arrivée en butée) et lit Δt = 0,60 s. Il recale enfin la fermeture de la pince en touchant la ligne de sortie. | Le capteur, remonté mercredi, prévient 0,60 s avant l'arrivée de la pièce ; la pince se fermait à 0,25 s. Le défaut n'apparaît que quand le robot attendait déjà la pièce, d'où un rebut « de temps en temps ». | L2 · Robotique et systèmes industriels |
| 4 · L'épaule | Tourne les deux boutons du variateur (gain, amortissement), lance un essai, lit la **courbe de réponse** superposée aux essais précédents. **Un seul réglage à la fois** : changer les deux d'un coup compte comme une erreur. | Le réglage de jeudi (gain 40, amortissement 3) dépasse la consigne de 9,8° : la pièce s'échappe. | L2 · Automatique et asservissement |
| 5 · La caméra | Touche les 10 pièces contrôlées à la main par Karim (pastille verte ou rouge) : le bras les photographie sous les LED. Place le nouveau seuil sur l'échelle de luminosité, puis le teste sur un lot neuf de 12 pièces. | Les LED ajoutent 12 points de luminosité : 3 bonnes pièces sur 6 dépassent l'ancien seuil de 70 %. Le nouveau seuil doit passer entre 78 % et 84 %. | L3 · Vision par ordinateur et IA embarquée |
| Production | Une heure de production en 60 s : la courbe du taux de rebut (sur les 300 dernières pièces) tombe de 20 % à 2 %. Le joueur **chronomètre le temps de cycle** en touchant « Top » à deux fermetures de pince. | Cadence tenue : 4,6 s par pièce. | — |
| Rapport | Le rapport au client reprend ses mesures : 4 causes prouvées, la fausse piste écartée, le rebut avant et après, la production prévue samedi. | | — |

- [ ] Les quatre pannes (jeu mécanique, capteur décalé dans le cycle, asservissement mal réglé, vision apprise sous un autre éclairage) sont-elles réalistes pour une cellule de ce type ?
- [ ] La progression L1 → L2 → L2 → L3 est-elle fidèle à la maquette ? Les intitulés des cours sont-ils les bons ?

## 2. Les chiffres à vérifier

**Le dossier**
- Commande : 12 000 pièces ; la cellule tourne samedi de 6 h à 22 h, soit 57 600 s.
- Temps de cycle = 3,85 s + délai entre le capteur et la fermeture de la pince. Pour livrer lundi avec ~2 % de rebut, il faut **4,7 s au plus**.
- Avec le réglage retenu (fermeture à 0,75 s) : 4,60 s par pièce → 12 521 pièces samedi, dont 12 270 bonnes.

**Étape 2 · Coude**
- Avant-bras de 1,3 m : 1° au coude ≈ 22,7 mm au bout du bras.
- Jeu réel du réducteur : 0,40° → 9,1 mm. Le comparateur lit ±10 mm ; le relevé est accepté à ±1 mm de zéro.
- La compensation est acceptée si l'écart restant entre les deux sens d'approche est de 1,5 mm au plus (soit 0,33° à 0,47°).
- [ ] La compensation de jeu par logiciel (en attendant le réducteur neuf) est-elle une pratique que vous présenteriez ?

**Étape 3 · Capteur et pince**
- Pince : serrage mesuré 52 N, exigé par le constructeur 40 N (fausse piste, une pince neuve « à 1 900 € »).
- Tapis à 0,75 m/s ; le capteur est 30 cm en amont de la butée (pièce de 30 cm) : la pièce touche la butée **0,60 s** après le front du capteur.
- Réglage d'origine : fermeture à 0,25 s. Réglage accepté : de 0,65 s (marge après l'arrivée) à 0,85 s (cadence), par pas de 0,05 s.
- [ ] Le terme « sorties inhibées » est-il le bon pour un cycle où le programme tourne sans actionner la pince ?

**Étape 4 · Épaule**
- Modèle simplifié d'un moteur asservi en position : θ'' = gain·(consigne − θ) − (amortissement + 0,6)·θ' (correcteur proportionnel-dérivé, sans gravité ni saturation). Levée de 35° à 60°.
- Exigences : dépassement de 2° au plus, stable à ±1° en 0,65 s au plus.
- Réglage de jeudi (gain 40, amortissement 3) : 9,8° de dépassement. Réglage d'avant (gain 20, amortissement 6) : 0,8°, mais stable en 0,70 s seulement, trop lent.
- Réglages qui réussissent, par exemple : gain 40 et amortissement 10 (0,2°, 0,60 s), gain 50 et amortissement 10 ou 12, gain 60 et amortissement 12 ou 14. Boutons : gain de 10 à 60 par pas de 5, amortissement de 0 à 16.
- [ ] Le correcteur PD est-il vu en L2, ou plutôt en L3 ? Faut-il parler de PID ?
- [ ] La règle « un seul réglage à la fois » vous paraît-elle juste à enseigner, ou trop stricte ?

**Étape 5 · Vision**
- Mesure : luminosité de la pièce (une pièce mal peinte paraît plus claire). Ancien seuil 70 %, appris sous les néons.
- Les LED ajoutent 12 points. Exemples : bonnes à 62, 65, 68, 71, 74, 78 % ; défauts à 84, 88, 93, 97 %. Lot neuf : bonnes de 61 à 77 %, défauts de 86 à 95 %.
- Seuils acceptés : 78 à 83 %.
- [ ] Le terme « IA embarquée » est-il juste pour un seuil appris sur des exemples, ou faut-il dire « apprentissage » ou « classification » ?

**Production**
- 2 % des pièces sont réellement défectueuses (moulage du fournisseur) : elles restent en rebut, à raison.

## 3. Mention

| Mention | Condition |
|---|---|
| Très bien | 2 erreurs au plus |
| Bien | 5 erreurs au plus |
| Assez bien | 9 erreurs au plus |
| De justesse | Au-delà |

Une erreur, c'est : trois relevés inutiles sur un même cycle (étape 1) ; deux relevés du comparateur dans le même sens ou une compensation qui laisse plus de 1,5 mm (étape 2) ; une mesure prise entre les mauvais signaux, une fermeture trop tôt ou trop lente (étape 3) ; deux réglages changés d'un coup, ou un essai raté au-delà du 5e (étape 4) ; un seuil qui trie mal le lot neuf (étape 5). Le premier essai de l'étape 4, avec le réglage de jeudi, ne compte jamais.

## 4. Questions ouvertes pour l'enseignant

1. L'école dispose-t-elle d'un bras robotisé ou d'une cellule de démonstration dans Wenov ? Des photos permettraient d'en rapprocher le décor.
2. Avez-vous un vrai cas de panne vécu en projet ou en stage, qui pourrait remplacer ce dossier fictif ?
3. Le rapport au client est généré à partir des mesures du joueur : faut-il lui faire écrire une partie (par exemple, la recommandation pour la maintenance) ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
