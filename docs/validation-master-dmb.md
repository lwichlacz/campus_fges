# Fiche de validation · Mini-jeu « From Blood to Decision » (Master Data Management in Biosciences, École du Numérique)

**À relire par :** l'équipe pédagogique du Master Data Management in Biosciences
**Langue :** anglais, comme le master (enseigné 100 % en anglais). Le reste du site est en français ; l'écran d'accueil du jeu le signale (« In English, like the Master »).
**Point de départ :** la maquette des relations presse (« Jeu Data MB site.pptx ») : un patient fatigué, une prise de sang, le pipeline « biology → data → decision » en quatre phases, puis la brochure. Le jeu garde ce récit et ces phases, et y ajoute deux vraies missions.
**Durée :** environ 6 minutes.
**Où le trouver :** dans Wenov (aile sud, épingle « Laboratoire bio-data »), dans l'onglet Jeux et sur la fiche du master.
**Fichier :** `js/games/biodata.js`.

Merci de cocher, corriger ou commenter chaque point.

---

## 1. Déroulé

| Mission | Ce que fait le joueur | Cours révélé |
|---|---|---|
| Build the pipeline | Remet dans l'ordre 6 étapes : prélèvement, pseudonymisation (le nom d'Alex devient P-0412), séquençage, nettoyage et contrôle qualité, bio-informatique et IA, décision de l'équipe médicale. Une 7ᵉ carte est un piège à écarter (envoyer le fichier nominatif par e-mail). Une fois juste, les phases apparaissent : Biological sample, Data protection, Data generation, Data preprocessing, Data analysis, Interpretation. | M2 · Data protection |
| Clean the data | Applique quatre règles de qualité à 8 séquençages (score Phred ≥ 30, lectures alignées ≥ 90 %, contamination ≤ 2 %, profondeur ≥ 30×) et exclut les 3 qui échouent. | M1 · Biostatistics |
| Find the variant | Sur un alignement de 12 lectures (gène HFE), inspecte trois positions et consulte la base de variants : une erreur de séquençage (1 lecture sur 12, faible qualité), une variation fréquente et bénigne (6/12), et HFE c.845G>A, p.Cys282Tyr (C282Y) à l'état homozygote (12/12). Puis choisit le message à l'équipe médicale : recommander un bilan martial (ferritine, coefficient de saturation de la transferrine) et une consultation spécialisée pour confirmer. | M1 · Bioinformatics & databases, M1 · Disease biology, M2 · Clinical trials & epidemiology |

- [ ] Le récit (fatigue chronique, hémochromatose héréditaire HFE C282Y) est-il juste et bien choisi ?
- [ ] Les intitulés de cours (en anglais) correspondent-ils à la maquette ?

## 2. Points à vérifier

- [ ] **Ordre du pipeline** : la pseudonymisation est acceptée en 2ᵉ ou 3ᵉ position (au prélèvement ou juste après le séquençage), toujours avant le nettoyage des données. Est-ce correct ?
- [ ] **Seuils de qualité** (Phred 30, 90 % de lectures alignées, 2 % de contamination, profondeur 30×) : réalistes pour un séquençage clinique ciblé ?
- [ ] **Séquence affichée** : elle est illustrative (indiqué dans le jeu). Faut-il afficher la vraie séquence autour du codon 282 de HFE ?
- [ ] **Message médical** : le bon message recommande de confirmer par un bilan martial et un avis spécialisé ; les deux mauvais sont « l'IA a posé le diagnostic, traitez aujourd'hui » et « ignorez le résultat ». La formulation vous convient-elle ?
- [ ] Dans la réalité, le bilan martial précède souvent le test génétique. Faut-il le dire dans le jeu ?

## 3. Mention

| Mention (site) | Libellé affiché | Condition |
|---|---|---|
| Très bien | Highest distinction | 2 erreurs au plus |
| Bien | Distinction | 5 erreurs au plus |
| Assez bien | Pass | Au-delà |

Une erreur : une exécution du pipeline incorrecte (ou avec la carte piège), un contrôle qualité raté, un variant mal signalé, un mauvais message à l'équipe médicale.

## 4. Questions ouvertes

1. Souhaitez-vous un autre cas que l'hémochromatose (par exemple une maladie que les étudiants étudient en M1) ?
2. Faut-il une 4ᵉ mission sur l'épidémiologie ou les essais cliniques (M2) ?
3. Le ton et le niveau d'anglais conviennent-ils à des candidats bac+3 ?

**Validé par :** ____________________ **Date :** __________ **Remarques :**
