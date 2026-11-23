# Fiche de validation · Mini-jeu « Faut-il monter les taux ? » (Prépa D2 Économie-Gestion)

**À relire par :** un enseignant de la prépa D2
**Vérifié (13/11/2026) :** la page « Prépa ENS D2 » de Marcq Institution confirme l'ouverture en septembre 2027, la Licence internationale d'économie-gestion de la FGES et les concours visés (ENS Paris-Saclay économie-gestion option 1, magistères d'économie, Pré-Master EDHEC), cités au bilan. Le programme détaillé n'est pas publié : les notions du jeu restent celles d'une D2 classique (macroéconomie, microéconomie, mathématiques et statistique, gestion, anglais).
**Objectif du jeu :** faire vivre à un lycéen le métier d'**économiste en banque centrale**, auquel mènent l'ENS et les magistères, et à travers lui ce qu'entraîne la D2 : lire des données, se méfier d'un chiffre, modéliser, puis défendre une recommandation chiffrée, en français et en anglais.
**Univers :** mercredi, 14 h, le service de conjoncture d'une banque centrale **fictive**, en plein jour. L'inflation vient de bondir à 4,2 % sur un an ; Bernard Vasseur, membre du Conseil, veut monter le taux directeur de 0,50 point au vote de jeudi, 9 h. Yasmine Benali, cheffe du service, guide le joueur. Dans la salle trône une machine hydraulique inspirée de la MONIAC de Bill Phillips (1949), « réglée sur notre économie », avec sa table traçante. La note au Conseil se remplit dans le panneau à chaque pièce. Banque, personnes, chiffres et documents sont fictifs et simplifiés.
**Durée :** environ 7 minutes ; l'indice des prix (≈ 1 min) se joue en ouverture, puis le palier propose de continuer. Chaque erreur coûte 15 minutes de la nuit.
**Fichier :** `js/games/moniac.js` (contenus en tête : `LAYERS`, `FORECASTS`, `wage`/`price`, `infl2028`/`chom2028`, `QUESTIONS`).

Merci de cocher, corriger ou commenter chaque point.

## 1. Déroulé

| Étape | Geste, sur la pièce | Ce qu'on trouve | Cours révélé |
|---|---|---|---|
| 1 · L'indice (ouverture) | Arracher du graphique empilé les deux couches volatiles (énergie 1,8 point, alimentation 0,9 point) ; arracher les services ou les biens manufacturés est une erreur | Inflation sous-jacente : 1,5 point sur les ¾ du panier, soit +2,0 % sur un an | Statistique (indices, pondérations) ; macroéconomie |
| 2 · L'enquête, en anglais | Faire glisser un curseur sur une enquête de 15 prévisionnistes (inflation attendue en 2028) jusqu'à la médiane ; au lâcher, on compte les points de part et d'autre | Médiane 2,1 % ; la moyenne (2,5 %) est tirée par une seule prévision à 8 % | Mathématiques (médiane, moyenne) ; anglais |
| 3 · Les salaires | Poser le calque des prix (base 100 en janvier 2022) sur la courbe des salaires, croix « 100 » sur croix « 100 » | Salaires 113,5, prix 117 : pouvoir d'achat −3 %, pas de spirale prix-salaires | Microéconomie (salaire réel) |
| 4 · La machine | Tourner la vanne du taux (glisser), tirer le levier : la plume trace l'inflation jusqu'en 2028 ; la vanne part sur la proposition de Bernard (3,75 %) | 3,75 % → 1,4 % et chômage 8,1 % ; 3,25 % (maintien) → 2,0 % ; chaque essai coûte 30 minutes | Modélisation, histoire de la pensée (Phillips) ; gestion (coût du capital) |
| 5 · Le Conseil (verdict) | 4 objections (dont une en anglais), un sablier de 20 s : poser sur le rétroprojecteur la pièce qui répond | Maintien voté 7 voix contre 2 si la défense tient (sinon +0,25 point) | Oraux ; anglais ; débouchés |

Règle simplifiée de la machine : inflation 2028 = 2,0 − 1,2 × (taux − 3,25) ; chômage 2028 = 7,4 + 1,4 × (taux − 3,25).

- [ ] Le scénario (choc d'énergie, sous-jacente à la cible, anticipations ancrées → maintien) est-il juste et assez nuancé pour un lycéen ?
- [ ] « 1,5 point sur les ¾ du panier, soit +2,0 % » : la présentation de l'inflation sous-jacente est-elle claire ?
- [ ] La machine présente l'effet du taux comme une règle simple et retardée : la mention « modèle simplifié » suffit-elle ?
- [ ] Le Conseil de politique monétaire d'une banque centrale fictive (et non la BCE) convient-il, ou faut-il ancrer le jeu dans l'Eurosystème ?
- [ ] Les débouchés cités au bilan (banque centrale, INSEE, service d'études, recherche) sont-ils ceux que la prépa veut mettre en avant ?

## 2. Remarques libres

…
