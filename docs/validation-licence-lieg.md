# Fiche de validation · Mini-jeu « Cargo » (Licence Internationale Économie & Gestion, FGES)

**À relire par :** un enseignant de la Licence Internationale Économie & Gestion
**Objectif du jeu :** faire sentir à un lycéen ce qu'est l'économie et la gestion à l'international, en anglais comme la licence : des devises qui bougent, un prix à fixer, un conteneur qui traverse l'océan, une négociation avec quelqu'un qui ne travaille pas comme nous, et une année à l'étranger.
**Univers :** une carte du monde de nuit, posée comme une maquette. Des routes lumineuses partent de Lille vers Londres, Hambourg et Austin ; un cargo traverse l'Atlantique ; Maya, la responsable export, tient le journal de bord.
**Scénario :** Beffroi Bikes (fabricant lillois de vélos électriques, **fictif**) ouvre son premier marché à l'étranger.
**Durée :** environ 7 minutes ; la première scène (le cours de la livre) se joue en une minute, puis un palier propose de continuer.
**Langue :** tout le jeu est en anglais.
**Fichier :** `js/games/cargo.js` (contenus en tête : `MARKETS`, `NEWS`, `CARDS`, `EVENTS`, `outcome()`, `CALL`).

> Entreprise, personnes, distributeurs et chiffres sont **fictifs et simplifiés**.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Scène | Année | Ce que fait le joueur | Cours révélé |
|---|---|---|---|
| 1 · Le taux | L1 | Une boutique londonienne paie 1 900 £ par vélo ; il faut au moins 2 150 €. Le cours de la livre bouge en direct (il monte, puis la Banque d'Angleterre baisse ses taux et la livre plonge) : le joueur **bloque le taux** au bon moment (contrat à terme) | Maths & economics |
| 2 · Le prix | L1 | Fait glisser le prix à Hambourg : la foule de cyclistes grossit ou fond, chiffre d'affaires et profit s'affichent en direct ; il faut trouver le **profit maximal** (2 200 €), pas le chiffre d'affaires maximal (1 500 €) | Microeconomics |
| 3 · L'expédition | L2 | Joue une **carte Incoterm** (EXW, FOB, CIF, DDP) pour Austin ; un marqueur rouge montre où le risque passe à l'acheteur ; le cargo traverse l'Atlantique et **un coup du sort** tombe (tempête, grève des dockers, blocage en douane). Qui paie ? | International economics |
| 4 · L'appel | L1-L2 | Négocie en visio avec Jolene, la distributrice d'Austin : trois échanges en anglais, une jauge de confiance (ancrer son prix, vocabulaire comptable, contrat de common law) | Organisational behaviour · Anglo-Saxon accounting · Comparative law |
| 5 · Le marché | L2 | Une nouvelle tombe, les colonnes de profit montent ou s'effondrent ; le joueur touche la ville du meilleur marché | Business plan |
| 6 · L'échange | L3 | Choisit sa ville d'échange ; un avion trace la route depuis Lille | A year abroad |

- [ ] La progression et les intitulés de cours sont-ils fidèles à la maquette ?
- [ ] Les cinq villes d'échange (Montréal, Dublin, Séoul, Valence, Bogotá) sont des **exemples** : à remplacer par de vraies universités partenaires.

## 2. Les contenus à vérifier

**Le taux** : seuil 2 150 € / 1 900 £ = 1,1316 €. Trois étoiles si le taux bloqué est d'au moins 1,155, deux s'il dépasse le seuil, une sinon (bloqué trop tard, ou automatiquement au bout de 24 s).
- [ ] L'explication du contrat à terme (« la banque fixe aujourd'hui le taux que tu auras dans trois mois ») convient-elle ?

**Le prix** : demande = 2 400 − 0,8 × prix ; coût 1 400 € ; profit maximal à 2 200 € (640 vélos, 512 000 €).

**Les Incoterms (règles 2020, simplifiées)**

| Carte | Où le risque passe | Verdict |
|---|---|---|
| EXW | à Lille, chez nous | ★ : une importatrice débutante ne vient pas chercher un conteneur à Lille |
| FOB | à bord, à Anvers ; elle paie le bateau | ★★ : légal, mais difficile pour une débutante ; en cas de tempête, la perte est pour elle (non assurée) |
| CIF | à bord, à Anvers ; nous payons le fret et l'assurance jusqu'à Houston | ★★★ : la tempête est couverte par l'assurance ; classique en maritime |
| DDP | à sa porte, droits payés | ★★ (★ si blocage en douane) : tous les risques et les formalités d'importation sont pour nous |

- [ ] Les verdicts et les explications sont-ils justes ?

**L'appel** : « net income » (pas « benefit », faux ami ; « turnover » = chiffre d'affaires au Royaume-Uni) ; contrat de 40 pages normal en common law.

**Les trois marchés** (profit de la 1re année = vélos attendus × marge − coûts fixes)

| | Hambourg | Londres | Austin |
|---|---|---|---|
| Marge par vélo | 760 € | 685 € | 310 € (droit de 15 %) |
| Coûts fixes | 228 000 € | 137 000 € | 155 000 € |
| Vélos attendus | 640 | 260 | 900 |
| Profit | 258 400 € | 41 100 € | 124 000 € |

Nouvelles possibles : semaine calme (Hambourg l'emporte) ; suspension des droits américains, **inventée pour le jeu** (Austin : 421 000 €) ; concurrent allemand (Hambourg : 420 vélos, Austin l'emporte) ; chaîne londonienne (Londres : 700 vélos, 342 500 €).

## 3. Remarques libres

…
