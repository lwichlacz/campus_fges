# Fiche de validation · Mini-jeu « Marquelle » (Licence Administration Économique, Sociale et Environnementale, FGES)

**À relire par :** un enseignant de la Licence AES-E
**⚠ Avant de relire :** le programme détaillé de la licence n'a pas pu être consulté (le site fges.fr bloque la lecture automatique). Les cours cités reprennent le socle habituel d'une licence AES et l'accroche de la fiche (« économie, gestion et transitions : vers la RSE, l'ESS ou les concours de la fonction publique »). **Intitulés et années à corriger en priorité.**
**Objectif du jeu :** montrer à un lycéen à quoi sert une licence AES : comprendre un territoire, ses habitants, ses institutions et ses budgets, et faire voter un projet utile.
**Univers :** une ville miniature en plein jour. La filature vient de fermer au milieu des maisons ; les habitants vivent leur journée (le marché le matin, la pause de midi, la sortie de l'école et la gare à 17 h, le soir chez soi). La directrice des services, Sophie Lefebvre, guide le joueur ; une « Gazette de Marquelle » titre chaque étape.
**Scénario :** Marquelle (commune **fictive**, 18 000 habitants) doit décider de l'avenir de la friche. Le joueur, stagiaire à la mairie, porte le projet jusqu'au vote.
**Durée :** environ 7 minutes ; la première scène (l'enquête) se joue en une minute, puis un palier propose de continuer.
**Fichier :** `js/games/marquelle.js` (contenus en tête : `PEOPLE`, `QUOTA`, `ASKS`, `TILES`, `NEWS`, `SIGNS`, `UNDECIDED`).

> Commune, personnes et chiffres sont **fictifs et simplifiés**.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Scène | Année (à vérifier) | Ce que fait le joueur | Cours révélé (à vérifier) |
|---|---|---|---|
| 1 · Écouter la ville | L2 | Fait tourner l'horloge (10 h, 13 h, 17 h, 20 h) et touche les habitants pour les interroger, avec des quotas : 2 jeunes, 3 actifs, 2 retraités. À 10 h, au marché, il n'y a presque que des retraités ; les jeunes n'apparaissent qu'à 17 h. Le jeu compare ensuite son échantillon au « sondage du marché » | Méthodes d'enquête |
| 2 · Les échelons | L1 | La ville est posée sur ses échelons (département, région, État) ; le joueur renvoie six demandes à la bonne collectivité en touchant le bon plateau | Institutions et droit public |
| 3 · Aménager | L3 | Pose 12 aménagements sur la friche (ressourcerie, atelier vélo, café, jardins, îlot de fraîcheur, parking, logements) sous une carte de chaleur ; quatre jauges : emplois (≥ 20), sol perméable (≥ 6 parcelles), chaleur (≤ +0,5 °C), envies des habitants | Transitions et territoires |
| 4 · Le budget | L2 | Glisse des piles de pièces dans deux bocaux, investissement et fonctionnement ; l'emprunt rebondit sur le fonctionnement (règle d'or) ; une nouvelle change les subventions | Finances publiques |
| 5 · L'enseigne | L2 | Accroche la bonne enseigne sur le tiers-lieu : SCIC (pièges : association, SARL, régie) | Économie sociale et solidaire |
| 6 · Le conseil | L3 | Hémicycle de 33 élus : 14 pour, 9 contre, 10 indécis avec leur préoccupation (budget, climat, emploi, stationnement). Le joueur leur oppose les arguments tirés de ses choix (s'il n'a prévu aucun parking, l'argument « stationnement » ne convainc personne), puis fait voter | Action publique et démocratie locale |

- [ ] Les intitulés de cours et leurs années correspondent-ils à la maquette ?
- [ ] Faut-il évoquer le partenariat avec l'ESSLIL ?

## 2. Les contenus à vérifier

**L'enquête** : les retraités demandent surtout un parking (4 sur 6), les jeunes et les actifs surtout un tiers-lieu. Un échantillon par quotas fait toujours gagner le tiers-lieu ; le seul marché de 10 h fait gagner le parking.
- [ ] Les quotas (2 / 3 / 2) sont-ils un bon ordre de grandeur pour un lycéen, même si la vraie méthode porte sur des centaines de personnes ?

**Les échelons**

| Demande | Échelon | Explication |
|---|---|---|
| Inscription en CP | Commune | Écoles maternelles et élémentaires |
| Toit du gymnase du collège | Département | Collèges |
| Demande de RSA | Département | Financé par le département, versé par la CAF |
| TER supprimé | Région | Trains régionaux |
| Aide pour reprendre la filature | Région | Chef de file du développement économique |
| Agents au commissariat de police nationale | État | Police nationale |

- [ ] La métropole n'apparaît pas : faut-il un cinquième échelon ?

**L'aménagement (valeurs simplifiées par parcelle)**

| Aménagement | Emplois | Sol perméable | Chaleur |
|---|---|---|---|
| Ressourcerie | 8 | non | +0,3 °C |
| Atelier vélo | 4 | non | +0,3 °C |
| Café solidaire | 5 | non | +0,3 °C |
| Jardins partagés | 1 | oui | −0,3 °C |
| Îlot de fraîcheur | 0 | oui | −0,5 °C |
| Parking (20 places) | 0 | non | +0,5 °C |
| Logements (12) | 0 | non | +0,3 °C |
| Friche bétonnée (avant) | — | non | +0,25 °C |

- [ ] Ces ordres de grandeur sont-ils défendables pour illustrer les arbitrages ?

**Le budget** : travaux 1 500 000 € (investissement), fonctionnement 120 000 € par an (recettes du lieu 80 000 €, budget communal 40 000 €).

| Nouvelle | Subventions | Emprunt de la commune |
|---|---|---|
| Les financeurs confirment | Région 30 %, État 20 %, Département 10 % | 600 000 € (40 %) |
| La Région plafonne à 20 % | Région 20 %, État 20 %, Département 10 % | 750 000 € (50 %) |
| Le FEDER s'ajoute | + Europe 10 % | 450 000 € (30 %) |

Le jeu rappelle que la commune doit financer au moins 20 % des travaux elle-même et que l'emprunt ne finance que l'investissement (règle d'or).
- [ ] Formulations correctes pour un lycéen ?

**L'enseigne** : SCIC (salariés, habitants, associations et la commune jusqu'à 50 % du capital ; une personne, une voix ; la majorité des bénéfices reste dans le projet). Pièges expliqués : l'association (la commune ne peut pas la codiriger sans risque juridique), la SARL (dividendes ; une commune n'entre pas, en principe, au capital d'une société commerciale ordinaire), la régie (la commune porte seule le risque).

**Le conseil** : il faut 17 voix sur 33 ; trois étoiles à partir de 22 voix.

## 3. Remarques libres

…
