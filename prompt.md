# Prompt de réécriture – Stats Ultimate

Nov 14, 2026 · @Sandra

## 1. Rôle, objectif et contexte

Tu es un développeur front-end senior. Réécris de zéro l'application web « Stats Ultimate » décrite dans ce document, avec un code propre, testé et publiable sur GitHub Pages.

- **Utilisateur** : le coach d'un club d'Ultimate Frisbee (club Dahultimate, Annecy, fédération FFFD). Il saisit les statistiques en direct, au bord du terrain, sur son téléphone, souvent en plein soleil et d'une seule main.
- **But de l'application** : enregistrer chaque action d'un match en une ou deux touches, puis consulter des statistiques individuelles et collectives, par match ou sur une période.
- **Périmètre** : toutes les fonctionnalités décrites ci-dessous, sans en retirer aucune. Une fonctionnalité notée « facultatif » est un bonus.
- **Compatibilité** : l'application doit lire sans perte les fichiers JSON exportés par la version actuelle (section 3).

Ce document est la spécification de référence. N'invente pas de règle de calcul ni de comportement qui n'y figure pas. Si un point est ambigu, choisis l'option la plus simple pour le coach et signale-la dans le README.

**Livrable attendu** : un dépôt Git complet (code source, tests, README en français, workflow de déploiement) qui se publie sur GitHub Pages sans étape manuelle autre que l'activation de Pages.

## 2. Contraintes générales

L'application est un site statique : aucun compte, aucun serveur, aucune base de données, accessible à tous sans identification.

### Données dans un fichier

- Toutes les données tiennent dans **un fichier JSON** que l'utilisateur importe à chaque visite, puis exporte après chaque modification.
- L'export télécharge `stats-ultimate-AAAA-MM-JJ.json` (JSON indenté de 2 espaces, champ `exporteLe` ajouté). Si le téléchargement est impossible, une fenêtre affiche le JSON avec un bouton « Copier le contenu ».
- Un indicateur « Non exporté » (pastille jaune sur le bouton Exporter) signale toute modification non exportée. Un export réussi ou une copie réussie le remet à « À jour ».
- Fermer la page avec des modifications non exportées déclenche l'avertissement du navigateur (`beforeunload`), sauf pour les données d'exemple.
- **Copie de secours** : à chaque modification, les données sont aussi copiées dans le `localStorage` (clé `stats-ultimate:secours`, avec l'heure). Elle n'est jamais chargée automatiquement : l'écran d'ouverture la propose. Un simple import ne l'écrase pas. L'accès au stockage est toujours protégé par `try/catch`.

### Interface

- Tout est en **français** : textes, dates au format fr-FR (« sam. 14 nov. 2026 »), décimales avec virgule, apostrophes typographiques.
- **Mobile d'abord** (390 px de large), utilisable en paysage, sur tablette et sur ordinateur. Cibles tactiles d'au moins 44 px, gros boutons, aucune information accessible seulement au survol.
- **Vitesse de saisie** : une action = une ou deux touches, avec des présélections intelligentes. L'annulation de la dernière action est toujours possible.
- **Thèmes clair et sombre** selon `prefers-color-scheme`, avec un contraste élevé pour l'extérieur.
- **Accessibilité** : focus clavier visible, chaque champ a un libellé, `aria-pressed` sur les boutons bascule, `role="img"` et description sur les graphiques, aucune information portée par la couleur seule, respect de `prefers-reduced-motion`.
- Pas de `alert`, `confirm` ou `prompt` natifs : fenêtres de confirmation intégrées (fermables par Échap ou clic sur le fond) et messages courts en bas d'écran (toast d'environ 3 secondes).
- Typographie : Barlow Condensed (titres, numéros, scores) et Barlow (texte), avec des polices de repli système.
- Facultatif : fonctionnement hors ligne après le premier chargement (service worker).

## 3. Modèle de données et format JSON

Le format `ultimate-stats` version 1 ci-dessous est figé : garde exactement ces noms de champs (en français) pour rester compatible avec les fichiers existants.

```json
{
  "format": "ultimate-stats",
  "version": 1,
  "exporteLe": "2026-11-14T20:00:00.000Z",
  "exemple": false,
  "joueurs": [
    { "id": "j_k3x9a1m2b", "prenom": "Léa", "nom": "Martin", "numero": 7, "poste": "Handler", "actif": true }
  ],
  "equipes": [
    { "id": "e_p2q8z0c4d", "nom": "Open", "joueurs": ["j_k3x9a1m2b"] }
  ],
  "matchs": [
    {
      "id": "m_r7t5y1u3e", "cree": 1794687186000, "date": "2026-11-14",
      "terrain": "outdoor", "equipeId": "e_p2q8z0c4d", "equipeNom": "Open",
      "adversaire": "Les Frelons", "evenement": "Championnat régional", "type": "competition",
      "termine": false,
      "points": [
        {
          "ligne": ["j_k3x9a1m2b"], "attaqueDroite": true, "resultat": "nous",
          "evenements": [
            { "t": "pull", "equipe": "eux", "zone": "D-C", "ts": 1794687200000 },
            { "t": "reprise", "joueur": "j_k3x9a1m2b", "zone": "D-C", "ts": 1794687206000 },
            { "t": "passe", "de": "j_k3x9a1m2b", "a": "j_xxx", "zone": "A-R", "but": true, "ts": 1794687215000 }
          ]
        }
      ]
    }
  ]
}
```

### Entités

| Entité | Champs | Règles |
| --- | --- | --- |
| Racine | `format`, `version`, `exporteLe`, `exemple`, `joueurs`, `equipes`, `matchs` | `exemple: true` = données fictives (bandeau d'avertissement) |
| Joueur | `id`, `prenom`, `nom`, `numero` (nombre), `poste`, `actif` | `poste` = `Handler` ou `Middle` ; `actif: false` = ancien joueur, gardé pour l'historique |
| Équipe | `id`, `nom`, `joueurs` (liste d'id) | Un joueur peut appartenir à plusieurs équipes |
| Match | `id`, `cree` (horodatage ms), `date` (AAAA-MM-JJ), `terrain`, `equipeId`, `equipeNom`, `adversaire`, `evenement`, `type`, `termine`, `points` | `terrain` = `indoor`, `outdoor` ou `beach` ; `type` = `competition` ou `entrainement` ; `equipeNom` = copie du nom pour l'historique si l'équipe est supprimée |
| Point | `ligne` (id des joueurs sur le terrain), `attaqueDroite`, `evenements`, `resultat` | `resultat` = `null` (en cours), `nous` ou `eux` ; `attaqueDroite` = sens d'affichage seulement |

Les identifiants sont générés ainsi : préfixe (`j`, `e`, `m`) + `_` + caractères aléatoires en base 36. Le score d'un match n'est pas stocké : il se calcule en comptant les `resultat` des points.

### Évènements d'un point

Chaque évènement porte `t` (son type) et `ts` (heure de saisie en millisecondes, utilisée pour le temps de possession).

| `t` | Champs | Signification |
| --- | --- | --- |
| `pull` | `equipe` (`nous`/`eux`), `joueur` (si `nous`), `zone` | Engagement ; `zone` = zone d'atterrissage ou `brick` (sorti du terrain) |
| `reprise` | `joueur`, `zone` | Notre joueur ramasse le disque ; début de notre possession |
| `passe` | `de`, `a`, `zone`, `but` (facultatif) | Passe réussie ; `zone` = zone de réception ; `but: true` si elle est attrapée dans l'en-but adverse |
| `turn` | `cause`, `joueurs` (fautifs), `zone`, `porteur` | Nous perdons le disque ; `porteur` = joueur qui avait le disque |
| `def` | `cause`, `joueurs` (concernés), `zone` (ou `null`) | Action quand l'adversaire a le disque |
| `passeAdv` | aucun | Une passe de l'adversaire, comptée (facultatif) |

### Codes de cause

| Code | Libellé affiché | Type d'évènement | Effet |
| --- | --- | --- | --- |
| `mauvaise_passe` | Mauvaise passe | `turn` | Possession adverse |
| `drop` | Drop | `turn` | Possession adverse |
| `duel_perdu` | Duel perdu | `turn` | Possession adverse |
| `stall_out` | Stall out | `turn` | Possession adverse |
| `callahan` | Callahan (but adverse) | `turn` | Point pour l'adversaire |
| `contre` | Contre / interception | `def` | Nous récupérons le disque |
| `mauvaise_passe_adv` | Mauvaise passe adverse | `def` | Nous récupérons le disque |
| `drop_adv` | Drop adverse | `def` | Nous récupérons le disque |
| `stall_adv` | Stall out adverse | `def` | Nous récupérons le disque |
| `autre_recup` | Autre | `def` | Nous récupérons le disque |
| `callahan` | Callahan (but) | `def` | Point pour nous |
| `break_sans_but` | Break (sans but) | `def` | Le disque reste adverse |
| `marquage` | Marquage individuel | `def` | Point pour l'adversaire |
| `break` | Break | `def` | Point pour l'adversaire |
| `communication` | Communication | `def` | Point pour l'adversaire |
| `positionnement` | Positionnement | `def` | Point pour l'adversaire |
| `autre_but` | Autre | `def` | Point pour l'adversaire |

### Zones du terrain

Une zone s'écrit `<rang>-<côté>`, toujours dans le sens de **notre** attaque, quel que soit le sens affiché :

- Rang : `D` (notre en-but), `M1` (tiers défensif), `M2` (milieu), `M3` (tiers offensif), `A` (en-but adverse, où nous marquons).
- Côté : `L` (gauche), `C` (centre), `R` (droite), vus par un joueur de notre équipe qui attaque.
- Noms affichés : « Notre en-but gauche », « Milieu centre », « En-but adverse droite », etc.

### Import tolérant

- JSON invalide → message « Ce fichier n'est pas un JSON valide. »
- Listes `joueurs`, `equipes` ou `matchs` absentes → message expliquant le format attendu.
- Valeurs par défaut : poste inconnu → `Middle`, terrain inconnu → `outdoor`, type inconnu → `competition`, `actif` absent → `true`, `resultat` invalide → `null`, `attaqueDroite` absent → `true`.
- Les entrées sans `id` et les évènements sans `t` sont ignorés ; les `ts` absents sont acceptés.

## 4. Écrans de gestion

L'application compte douze vues : ouverture, accueil, effectif, fiche joueur, équipes, édition d'équipe, nouveau match, sélection de la ligne, saisie du point, statistiques, historique et détail du match.

### Barre supérieure (toutes les vues sauf l'ouverture)

- Bouton retour ← vers la vue parente : fiche joueur → effectif, édition d'équipe → équipes, détail du match → historique, toute autre vue → accueil. Pas de retour sur l'accueil.
- Titre de la vue.
- Bouton « Exporter », mis en avant avec une pastille jaune quand des modifications ne sont pas exportées.
- La barre reste fixée en haut au défilement.

### Ouverture des données

- Titre « Stats Ultimate », logo de disque et une phrase qui explique le principe du fichier JSON.
- Bouton principal « Importer mon fichier JSON » (sélecteur de fichier `.json`).
- « Coller le contenu du fichier » : affiche une zone de texte et un bouton « Charger ce contenu ».
- « Reprendre la copie de secours de ce navigateur (date et heure) », seulement si une copie existe. Après restauration, les données sont marquées « Non exporté ».
- Encadré « Première visite ? » : « Créer un fichier vide » et « Essayer avec des données d'exemple » (section 9).
- Toute erreur d'import s'affiche en rouge sous les boutons. Un import réussi ouvre l'accueil avec le toast « Données chargées : N joueurs, M matchs ».

### Accueil

- Bandeau jaune si les données sont des données d'exemple.
- Carte « Match en cours » si un match n'est pas terminé (le plus récent) : date, évènement, tableau de score et bouton « Reprendre la saisie ».
- Menu de cinq tuiles : **Nouveau match** (tuile principale, en couleur), **Effectif** (nombre de joueurs actifs), **Statistiques**, **Historique des matchs** (nombre de matchs), **Équipes** (nombre d'équipes).
- Carte « Fichier de données » : badge « À jour » ou « Non exporté », rappel que seul le fichier exporté fait foi, boutons « Exporter le fichier JSON » et « Ouvrir un autre fichier » (confirmation si des modifications ne sont pas exportées).

### Effectif

- Formulaire « Ajouter un joueur » : prénom, nom, numéro (0 à 999), poste (choix segmenté Handler / Middle). Tous les champs sont obligatoires.
- Après un ajout : toast de confirmation et curseur replacé dans « Prénom » pour enchaîner. Si le numéro est déjà porté par un joueur actif, le toast le signale sans bloquer.
- Liste en deux groupes, « Handlers · N » et « Middles · N », triée par numéro puis par nom. Chaque ligne ouvre la fiche du joueur.
- Les anciens joueurs sont masqués ; un bouton « Afficher les anciens joueurs (N) » les montre avec un badge « ancien ».

### Fiche joueur (statistiques individuelles)

- En-tête : grand numéro, prénom et nom, badge du poste, badge « ancien joueur » s'il y a lieu, bouton « Modifier ».
- Mode modification : même formulaire (Enregistrer / Annuler), bouton « Retirer de l'effectif » et, pour un ancien joueur, « Remettre dans l'effectif ».
- Retirer un joueur qui a déjà joué un point : il devient ancien joueur (`actif: false`) et sort des équipes ; ses statistiques restent. Retirer un joueur qui n'a jamais joué : suppression définitive, de l'effectif et des équipes. Confirmation dans les deux cas.
- Filtres : match (parmi ceux qu'il a joués), compétition / évènement, date de début, date de fin ; compteur « N matchs retenus » et bouton « Effacer les filtres ».
- Tuiles : matchs, points joués (en attaque / en défense), différentiel (gagnés / perdus), +/−, buts (dont Callahans), passes décisives, passes réussies en % (réussies / tentées), réceptions, turns, contres (et récupérations au total), fautes défensives, pulls (et bricks).
- Barres horizontales : turns par cause, fautes défensives par type.
- Carte du terrain avec un sélecteur : réceptions, passes lancées (zone de lancer), buts, turns, récupérations.

### Équipes

- Bouton « Créer une équipe » et liste des équipes triée par nom : nom, nombre de joueurs et leurs numéros.
- Édition : champ nom, joueurs actifs sous forme de puces à cocher groupées par poste, boutons « Tous » et « Aucun », « Créer l'équipe » ou « Enregistrer », « Supprimer l'équipe » avec confirmation.
- Un nom vide affiche une erreur. Une équipe supprimée reste lisible dans l'historique grâce à `equipeNom`.

### Nouveau match

- S'il n'existe aucune équipe : message et bouton « Créer une équipe ».
- Formulaire, tous champs obligatoires : date (aujourd'hui par défaut), équipe du club (liste avec son nombre de joueurs), équipe adverse (texte libre), nom de l'évènement (texte libre avec suggestions des évènements déjà saisis), type de terrain (Indoor / Outdoor / Beach, Outdoor par défaut), type de match (Compétition / Entraînement, Compétition par défaut).
- « Commencer le match » crée le match et ouvre la sélection de la ligne.

### Historique des matchs

- Liste triée par date décroissante, puis par ordre de création.
- Chaque ligne : pastille de résultat (V vert, D rouge, N gris, « En cours » orange), « Équipe – Adversaire », date longue · évènement · terrain · type, score.
- Liste vide : message et bouton « Nouveau match ». Une ligne ouvre le détail du match (section 8).

### Statistiques globales

- Filtres : date de début, date de fin (bornes incluses), compétition / évènement (nom exact), équipe, type de match ; compteur de matchs retenus et « Effacer les filtres ».
- Contenu décrit en section 8.

## 5. Saisie en direct : ligne, terrain et zones

Pendant un match, l'application alterne entre deux vues : la sélection de la ligne avant chaque point, puis la saisie du point. Si un point est en cours, c'est toujours la saisie du point qui s'affiche.

### Sélection de la ligne

- Tableau de score : nom de notre équipe, score « 5 – 3 », nom de l'adversaire.
- Titre « Point N » et badge indicatif : si nous avons marqué le point précédent, « Défense attendue · vous lancez le pull » ; sinon « Attaque attendue · vous recevez ». Pas de badge au premier point.
- Puces des joueurs : ceux de l'équipe du match, plus ceux qui ont déjà joué un point de ce match, groupés par poste et triés par numéro. Une puce affiche le numéro (gros), le prénom et l'initiale du nom, et le nombre de points joués dans ce match (aide à la rotation).
- Compteur « N/taille » : la taille indicative est 7 en outdoor, 5 en indoor et en beach. Elle n'est jamais imposée.
- Boutons : « Même ligne qu'au point N », « Vider », « Ajouter un joueur hors équipe » (affiche tout l'effectif actif ; bascule « Masquer les joueurs hors équipe »).
- Sens d'attaque : « vers la droite → » ou « ← vers la gauche », bouton « ⇄ Inverser ». Par défaut : droite au premier point, puis l'inverse du point précédent (les équipes changent de côté à chaque point).
- « Démarrer le point », désactivé sans joueur. Si le nombre diffère de la taille indicative, le libellé devient « Démarrer le point avec N joueurs ».
- Sous la carte : « ↶ Annuler la fin du point N » (rouvre le dernier point en retirant sa dernière action, avec confirmation), « Stats du match », « Terminer le match » (confirmation avec le score final, puis ouverture du détail du match).

### Le terrain

- Terrain horizontal vert, vu depuis la ligne de touche : en-but, trois tiers, en-but. Largeurs relatives 1 / 1,2 / 1,2 / 1,2 / 1 et ratio d'environ 100 × 52, avec des rangées d'au moins 50 px de haut.
- Il compte **15 zones tactiles** : chaque en-but est découpé en côté gauche, centre et côté droit, et la zone de jeu en 9 zones (3 tiers × 3 couloirs).
- Lignes de but blanches et épaisses, séparations fines entre les zones, en-buts d'un vert plus foncé.
- **Étiquettes des en-buts** (texte vertical) : chaque en-but porte le nom de l'équipe qui le défend. L'en-but adverse affiche le nom de l'adversaire et « on marque ici » en jaune ; le nôtre affiche notre nom et « notre en-but ».
- Flèche « Notre attaque → » en haut au centre.
- En attaque, l'en-but adverse est hachuré en jaune pour rappeler la cible.
- La zone choisie se colore en jaune. La zone du porteur affiche un disque blanc avec son numéro.
- Quand aucune zone n'est attendue, le terrain est désactivé et légèrement atténué.
- « ⇄ Inverser le sens » pendant le point change seulement l'affichage : les zones restent enregistrées dans le sens de notre attaque.

### Correspondance écran ↔ zones enregistrées

| Sens affiché | Colonnes de gauche à droite | Rangées de haut en bas |
| --- | --- | --- |
| Nous attaquons vers la droite | D, M1, M2, M3, A | L, C, R |
| Nous attaquons vers la gauche | A, M3, M2, M1, D | R, C, L |

Un joueur qui attaque vers la droite a sa gauche en haut de l'écran ; vers la gauche, sa gauche est en bas.

## 6. Saisie en direct : déroulé d'un point

L'état d'un point (phase, porteur du disque, zone du porteur, vainqueur) se déduit uniquement de la liste de ses évènements, par une fonction pure. Annuler revient donc à retirer le dernier évènement, et l'écran se recalcule.

&#91;embedded content: machine à états d'un point · 4 phases, 2 fins\]

Le point tourne entre reprise, attaque et défense jusqu'à un but ; le tableau ci-dessous fait foi pour le code.

### Transitions

| Phase actuelle | Évènement saisi | Phase suivante |
| --- | --- | --- |
| Engagement (aucun évènement) | `pull` lancé par nous | Défense |
| Engagement | `pull` lancé par l'adversaire | Reprise |
| Reprise | `reprise` (joueur + zone) | Attaque, ce joueur a le disque |
| Attaque | `passe` hors de l'en-but adverse | Attaque, le receveur a le disque |
| Attaque | `passe` dans l'en-but adverse (`but: true`) | Fin du point, point pour nous |
| Attaque | `turn` (sauf Callahan) | Défense |
| Attaque | `turn` cause Callahan | Fin du point, point pour l'adversaire |
| Défense | `def` de récupération | Reprise |
| Défense | `def` Callahan | Fin du point, point pour nous |
| Défense | `def` Break (sans but) ou `passeAdv` | Défense |
| Défense | `def` cause de but adverse | Fin du point, point pour l'adversaire |

Chaque évènement reçoit `ts = Date.now()` au moment où il est enregistré.

### Écran de saisie

- En haut : tableau de score, puis un bandeau de phase coloré « POINT N · Engagement » (gris), « Attaque · disque : #7 Léa » ou « Attaque · reprise du jeu » (bleu), « Défense · disque adverse » (orange).
- Une consigne en gras dit quoi toucher, et une aide en petit la complète.
- Sur écran large (≥ 860 px), le terrain est à gauche et le panneau d'actions à droite ; sur téléphone, tout s'empile.
- Les puces de la ligne servent à choisir des joueurs ; elles sont triées par numéro.
- **Règle d'ordre libre** : pour toute action « zone + joueur », le coach touche les deux dans l'ordre qu'il veut, et l'action s'enregistre dès que les deux sont choisis.

### Engagement

- Question « Quelle équipe lance le pull ? » : deux grands boutons (notre nom « nous lançons », nom de l'adversaire « ils lancent »). L'équipe qui a marqué le point précédent porte la mention « attendu ».
- Pull lancé par nous : puces pour le lanceur, terrain et bouton « Brick : pull sorti du terrain ». Le dernier lanceur du match présent dans la ligne est présélectionné : une seule touche sur la zone suffit alors.
- Pull adverse : terrain et bouton Brick ; une touche enregistre le pull (sans joueur).

### Reprise du jeu

- Consigne « Où reprend le jeu, et qui ramasse le disque ? ».
- La zone est présélectionnée : celle du dernier évènement (atterrissage du pull ou zone de la récupération), ou `M1-C` après un Brick. Le coach peut toucher une autre zone, puis le joueur.

### Attaque

- Consigne « Passe : zone de réception et receveur ». La puce du porteur est désactivée (bordure pointillée).
- Une réception dans l'en-but adverse est un **but** : passe décisive pour le lanceur, but pour le receveur, fin du point. Si le coach touche d'abord une zone de l'en-but adverse, la consigne devient « BUT pour Équipe ! Qui a attrapé le disque ? ».
- Bouton **TURN** (rouge, toute la largeur), puis l'une des cinq causes : Mauvaise passe, Drop, Duel perdu, Stall out, Callahan (but adverse).
- Ensuite : puces à choix multiple des joueurs fautifs, facultatives, avec le porteur présélectionné pour Mauvaise passe, Stall out et Callahan. Le toucher de la zone du turn (obligatoire) valide. Le porteur est toujours enregistré dans `porteur`.

### Défense

- Bouton facultatif « Passe adverse » avec le compteur du point (« 3 passes ce point »). Chaque toucher enregistre un `passeAdv` ; il sert à la part des passes.
- Trois groupes de boutons, chacun avec une bande de couleur à gauche :
  - **On récupère le disque** (vert) : Contre / interception, Mauvaise passe adverse, Drop adverse, Stall out adverse, Autre, et Callahan (but), en doré.
  - **Le disque reste adverse** (orange) : Break (sans but).
  - **But adverse · cause** (rouge) : Marquage individuel, Break, Communication, Positionnement, Autre.
- Après le choix : puces à choix multiple des joueurs concernés ou fautifs, toutes **facultatives**.
- Le toucher d'une zone valide l'action. Un grand bouton valide aussi sans zone (`zone: null`) ; son libellé s'adapte : « Valider sans joueur fautif » (break ou but adverse sans joueur choisi), « Valider sans joueur » (récupération ou Callahan sans joueur), « Valider sans préciser la zone » (au moins un joueur choisi).

### Outils toujours visibles

- « Retour » : annule la sous-étape en cours (choix d'équipe, choix de cause, choix d'action), sans toucher aux évènements.
- « ↶ Annuler la dernière action » : retire le dernier évènement et affiche « Annulé : \<texte de l'action> ». Si le point n'a aucun évènement, il propose d'annuler le point (retour à la sélection de la ligne).
- « ⇄ Inverser le sens ».
- Journal « Dernières actions du point » : les 6 dernières, la plus récente en haut.

### Fin du point

- Le résultat est enregistré, la vue revient à la sélection de la ligne et un toast annonce « But Open ! 6 – 4 » ou « But Les Frelons. 5 – 5 ».
- Les présélections et sous-étapes se réinitialisent à chaque nouvel évènement ou annulation.

### Textes du journal

| Évènement | Texte affiché |
| --- | --- |
| Pull de nous | Pull de #12 Sarah → Tiers offensif centre |
| Pull adverse | Pull adverse → Notre en-but gauche (ou Brick) |
| Reprise | #7 Léa ramasse le disque · Milieu centre |
| Passe | Passe #7 Léa → #9 Lucas · Milieu droite |
| But | BUT de #9 Lucas · passe décisive de #7 Léa |
| Turn | TURN · Drop · #9 Lucas · Tiers offensif gauche |
| Défense | Récupération · Contre / interception · #5 Inès · Milieu centre (préfixe « CALLAHAN · » ou « But adverse · » selon le cas ; zone omise si absente) |
| Passe adverse | Passe adverse |

## 7. Règles de calcul des statistiques

Toutes les statistiques sont calculées à la volée par une fonction pure qui reçoit une liste de matchs et renvoie les totaux de l'équipe et de chaque joueur. Rien n'est stocké dans le JSON.

### Filtres

Un match est retenu si sa date est entre les bornes (incluses), si son évènement est exactement celui choisi, et si son équipe, son type et son id correspondent aux filtres renseignés. Un filtre vide ne filtre rien.

### Points

- Seuls les points terminés comptent comme points joués.
- Un point est **en attaque** (O) si l'adversaire a lancé le pull, **en défense** (D) si nous l'avons lancé.
- Bilan V-D-N : seulement sur les matchs terminés, en comparant les scores.

### Statistiques d'un joueur

| Statistique | Définition |
| --- | --- |
| Matchs joués | Matchs où il figure dans au moins une ligne |
| Points joués, O, D | Points terminés où il est dans la ligne, séparés selon le pull |
| Gagnés, perdus, différentiel | Points terminés de sa ligne gagnés ou perdus ; différentiel = gagnés − perdus |
| Buts | Passes `but` qu'il a reçues + ses Callahans |
| Passes décisives | Passes `but` qu'il a lancées |
| Passes réussies | Passes qu'il a lancées |
| Passes tentées | Réussies + turns où il était porteur, causes Mauvaise passe, Drop, Duel perdu ou Callahan (pas Stall out) |
| Passes ratées par cause | Ces mêmes turns, comptés côté lanceur, par cause |
| Réceptions | Passes qu'il a reçues |
| Turns, par cause | Turns où il est désigné fautif |
| Contres | `def` Contre / interception où il est désigné + ses Callahans |
| Récupérations | Toutes les `def` de récupération où il est désigné + ses Callahans |
| Callahans | `def` Callahan où il est désigné |
| Fautes défensives, par type | Break (sans but) et causes de but adverse où il est désigné |
| Pulls, bricks | Pulls qu'il a lancés, dont ceux sortis |
| +/− | Buts + passes décisives + contres − turns |
| Zones | Réceptions, buts, turns, récupérations et zones de lancer (zone du porteur au moment de chaque passe tentée) |

La zone du porteur se suit au fil du point : elle vaut la zone de la reprise, puis la zone de réception de chaque passe. Une zone `null` n'est comptée sur aucune carte.

### Indices de performance

```latex
\begin{aligned}
\text{Apport offensif} &= 3\,\text{buts} + 3\,\text{passes décisives} + 0{,}2\,\text{passes réussies} + 0{,}1\,\text{réceptions} - 2\,\text{turns} \\
\text{Apport défensif} &= 3\,\text{contres} + (\text{récupérations} - \text{contres}) - \text{fautes défensives} \\
\text{Indice MVP} &= \text{apport offensif} + \text{apport défensif}
\end{aligned}
```

Les trois indices sont arrondis au dixième. Un Callahan compte donc comme un but et un contre. Les pondérations sont des constantes nommées, regroupées dans un seul fichier.

### Statistiques de l'équipe

| Statistique | Définition |
| --- | --- |
| Points marqués / encaissés | Somme des scores |
| Points d'attaque gagnés (hold) | Points O gagnés / points O |
| Points de défense gagnés (break) | Points D gagnés / points D |
| Attaques propres | Points O gagnés sans aucun `turn` dans le point / points O |
| Passes réussies, tentées, % | Somme des joueurs (tentées = passes + turns de lancer) |
| Turns | Nombre de `turn`, par cause et par zone |
| Récupérations | `def` de récupération + Callahans, par type et par zone |
| Breaks subis sans but | Nombre de `def` Break (sans but) |
| Buts encaissés par cause | Causes de but adverse + « Callahan subi » (turn Callahan), avec leur zone |
| Pulls, bricks | Nos pulls et nos bricks ; idem pour l'adversaire ; zones d'atterrissage |
| Passes adverses | Nombre de `passeAdv` |

### Possessions

Une possession commence quand une équipe reçoit le disque et finit par un but ou un turnover. On parcourt les évènements de chaque point :

| Évènement | Effet sur les possessions |
| --- | --- |
| `pull` | Ouvre la possession de l'équipe qui reçoit (origine « pull »), début = `ts` du pull |
| `passe` avec `but` | Ferme notre possession par un but |
| `turn` | Ferme notre possession par un turnover, ouvre celle de l'adversaire (origine « turn ») ; si Callahan, la ferme aussitôt par un but |
| `def` de récupération | Ferme la possession adverse par un turnover, ouvre la nôtre (origine « récupération ») |
| `def` Callahan | Ferme la possession adverse, ouvre la nôtre (origine « récupération ») et la ferme aussitôt par un but |
| `def` cause de but adverse | Ferme la possession adverse par un but |

Une possession encore ouverte (point en cours) est ignorée. On en déduit :

- **Conversion après récupération** = nos possessions d'origine récupération finies par un but / nombre de ces possessions.
- **Efficacité offensive** d'une équipe = ses possessions finies par un but / ses possessions.
- **Efficacité défensive** d'une équipe = possessions de l'autre équipe finies par un turnover / possessions de l'autre équipe.
- **Turnovers gagnés** : nous = nos récupérations (Callahans inclus) ; adversaire = nos turns.
- **Possession (%)** = durée de nos possessions / durée totale, chaque durée étant `ts` de fin − `ts` de début. Si une possession n'a pas d'heure, la possession est « — » avec une note explicative.

### Séries et meilleurs joueurs

- **Écart au score** : après chaque point terminé, score nous − score adversaire.
- **Plus longue série** de chaque équipe : nombre maximal de points consécutifs, avec le score avant et après la série.
- Seuls les joueurs avec au moins un point joué sont classés. En cas d'égalité, on applique le critère secondaire.

| Distinction | Critère | Égalité | Personne si |
| --- | --- | --- | --- |
| MVP du match | Indice MVP le plus haut | buts + passes décisives − turns | aucun joueur |
| Meilleur passeur décisif | Passes décisives | passes réussies | 0 passe décisive |
| Meilleur apport offensif | Apport offensif | buts + passes décisives | aucun joueur |
| Meilleur défenseur | Apport défensif | contres | 0 récupération |

## 8. Rapports, statistiques globales et visualisations

Chaque match a un rapport collectif, un rapport individuel et un déroulé point par point. Rapports, fiches joueurs et statistiques globales s'exportent en PDF ou en image. Les graphiques sont des composants SVG ou HTML/CSS faits maison, lisibles sur téléphone, en thème clair comme sombre.

### Détail d'un match

- En-tête : tableau de score, date longue · évènement · terrain · type, badge « Terminé » ou « En cours ».
- Boutons : « Reprendre la saisie » (match en cours) ou « Rouvrir la saisie » (match terminé, qui repasse en cours), et « Supprimer le match » avec confirmation.
- Trois onglets : **Rapport collectif** (par défaut), **Rapport individuel**, **Point par point**. Sans point saisi : message « Aucun point saisi pour ce match ».

### Rapport collectif, dans cet ordre

1. **L'essentiel** : quatre tuiles avec une jauge horizontale : points d'attaque gagnés, conversion après récupération, attaques propres, points de défense gagnés. Chacune affiche le % et « x / y » avec son explication.
2. **Joueurs du match** : quatre fiches (MVP mise en avant en doré, meilleur passeur décisif, meilleur apport offensif, meilleur défenseur). Chaque fiche donne le numéro et le nom, la valeur et le détail (par exemple « 2 buts · 3 PD · 1 contre · 0 turn »). Un dépliant « Comment sont calculés ces indices ? » donne les trois formules.
3. **Évolution de l'écart au score** : colonnes divergentes, une par point, depuis une ligne zéro ; bleu vers le haut quand nous menons, orange vers le bas quand l'adversaire mène, petit trait gris à égalité. Graduations signées (+2, 0, −2), numéros de points en abscisse (au plus 12 étiquettes). Seules la plus grande avance de chaque équipe et la valeur finale sont étiquetées ; une infobulle par colonne donne le score. Légende « Équipe mène / Adversaire mène ».
4. **Points consécutifs** : bande de petits carrés (un par point, couleur du vainqueur), puis pour chaque équipe « plus longue série de N points d'affilée (de 3–2 à 8–2) ».
5. **Comparatif des équipes** : barres en miroir (notre équipe à gauche en bleu, l'adversaire à droite en orange), valeur au bout de chaque barre. Lignes : efficacité offensive, efficacité défensive, turnovers gagnés, possession, bricks. Les pourcentages sont à l'échelle 0–100 %, les nombres à l'échelle du plus grand des deux.
6. **Part des passes du match** : barre segmentée de 28 px (bleu / orange), % inscrit dans un segment s'il fait au moins 12 %, légende avec le nombre de passes. Sans passe adverse comptée : notre nombre de passes et une phrase qui explique comment utiliser « Passe adverse ».
7. **Où circulent nos passes** : carte de chaleur des zones de réception.
8. **Zones des points marqués** : deux cartes côte à côte, nos buts (rampe bleue) et les buts adverses (rampe orange, zone saisie avec la cause), avec le nombre de buts sans zone.
9. Trois blocs de barres horizontales : nos turns par cause, récupérations du disque par type, buts encaissés par cause (et nombre de breaks subis sans but).

### Rapport individuel

1. **Tableau récapitulatif** triable (voir le tableau des joueurs ci-dessous).
2. **Passes réussies et ratées par joueur** : une barre horizontale empilée par joueur ayant tenté une passe (réussies en bleu, ratées en rouge), à l'échelle du joueur qui en a tenté le plus, triée par passes tentées. À droite : « 12/14 · 86 % ». Infobulle avec les causes des passes ratées.
3. **Carte des passes de chaque joueur** : petites cartes de chaleur (une par joueur, en grille) des zones de lancer, avec « x réussies · y ratées » et le détail des ratées (« 1 drop, 2 mauvaise passe »).

### Point par point

Un élément dépliable par point : numéro, badge Attaque ou Défense, « Point Équipe » en vert ou « Point Adversaire » en rouge, nombre de passes et de turns, score cumulé. Déplié : la ligne (numéros et prénoms) et le journal complet du point.

### Statistiques globales (après les filtres)

- Tuiles : bilan V-D-N, points marqués – encaissés, hold, break, passes réussies, turns (moyenne par point), récupérations (dont contres et Callahans), pulls (% de bricks).
- Barres : nos turns par cause, récupérations, buts encaissés par cause.
- Carte du terrain avec un sélecteur : réceptions, buts marqués, nos turns, récupérations, buts encaissés, nos pulls, pulls adverses.
- Tableau des joueurs.

### Tableau des joueurs (partagé)

- Colonnes : Joueur, MJ, Pts, Indice, Off., Déf., Diff., +/−, Buts, PD, Contres, Récup., Turns, % passes, Réc., Fautes D, Pulls. Chaque en-tête a une infobulle d'explication.
- Tri par Indice décroissant par défaut. Toucher un en-tête trie ; un deuxième toucher inverse l'ordre (`aria-sort` à jour).
- La première colonne reste fixe au défilement horizontal ; un nom ouvre la fiche du joueur.
- Seuls les joueurs avec au moins un point, une passe, un turn ou un pull apparaissent.

### Carte de chaleur du terrain

- Terrain vertical, notre attaque vers le haut : en-but adverse, M3, M2, M1, notre en-but ; colonnes gauche, centre, droite. Légendes « ↑ En-but adverse (on marque) » et « Notre en-but ».
- Rampe séquentielle à une teinte en 7 paliers, du clair (peu) au foncé (beaucoup). Une zone à zéro reste neutre (gris). Le nombre est inscrit dans chaque case, en blanc sur les paliers foncés. Échelle « 1 … max » sous la carte.
- Rampe bleue : `#cde2fb #9ec5f4 #6da7ec #3987e5 #256abf #184f95 #0d366b`. Rampe orange : `#fde4d8 #f9c4ab #f4a07d #eb6834 #c9521f #a24118 #7c3112`.
- Trois tailles : normale (230 px), compacte (140 px), mini (100 px, sans les zéros).

### Règles visuelles des graphiques

| Rôle | Clair | Sombre |
| --- | --- | --- |
| Notre équipe, passes réussies | `#2a78d6` | `#3987e5` |
| Adversaire | `#eb6834` | `#d95926` |
| Passes ratées | `#e34948` | `#e66767` |

- Ces paires sont lisibles par les daltoniens. Ne remplace pas les passes ratées par du vert et du rouge.
- Barres de 24 px d'épaisseur au plus, bout arrondi de 4 px du côté de la valeur, carré côté ligne de base, 2 px d'espace entre segments voisins.
- Quadrillage en traits fins et continus, discrets. Pas d'axe double.
- Une légende dès qu'il y a deux séries, et des étiquettes de valeur sélectives. Les textes restent dans les couleurs d'encre, jamais dans la couleur d'une série.
- Chaque graphique a `role="img"` et un `aria-label` qui résume ce qu'il montre ; chaque marque a une infobulle (`title`).

### Export des statistiques en PDF ou en image

Les statistiques collectives et individuelles s'exportent en PDF (A4) ou en image PNG, pour les imprimer ou les partager (TeamPulse, messagerie, e-mail). Tout est généré dans le navigateur, sans envoi de données.

| Écran | Contenu exporté | Formats | Nom du fichier |
| --- | --- | --- | --- |
| Détail du match | Rapport collectif | PDF, PNG | `stats-ultimate_<equipe>-vs-<adversaire>_<date>_collectif` |
| Détail du match | Rapport individuel : tableau récapitulatif, passes par joueur, cartes des passes | PDF, PNG | `…_individuel` |
| Détail du match | Rapport complet : collectif, individuel, puis point par point (tous les points dépliés) | PDF | `…_complet` |
| Fiche joueur | Statistiques du joueur avec les filtres actifs | PDF, PNG | `stats-ultimate_<numero>-<prenom>-<nom>_<periode>` |
| Statistiques globales | Statistiques avec les filtres actifs | PDF, PNG | `stats-ultimate_global_<periode>` |

Pour la fiche d'un joueur sur un seul match, le coach filtre la fiche sur ce match puis exporte. Les noms de fichier sont en minuscules, sans accents ni espaces ; `<periode>` vaut « tout » sans filtre de dates.

**Interface**

- Un bouton « PDF / Image » en haut de chacun de ces écrans. Il est distinct du bouton « Exporter » de la barre supérieure, qui sauvegarde les données JSON ; son infobulle le précise.
- Le bouton ouvre une fenêtre : format (PDF A4 ou Image PNG), et pour un match le contenu (Rapport collectif, Rapport individuel, Rapport complet). Le Rapport complet n'existe qu'en PDF. Par défaut : PDF et l'onglet affiché.
- « Créer le fichier » affiche « Préparation du fichier… », puis télécharge le fichier.
- Sur téléphone, si le navigateur sait partager des fichiers (`navigator.canShare({ files })`), un bouton « Partager » ouvre la feuille de partage du système ; sinon, téléchargement.
- En cas d'échec : « Le fichier n'a pas pu être créé. Réessayez, ou faites une capture d'écran. »

**Mise en page du fichier**

- Le fichier vient d'une mise en page dédiée, rendue hors écran, pas d'une capture de l'écran : toujours en thème clair sur fond blanc, quelle que soit l'apparence choisie.
- Largeur fixe : 794 px pour le PDF (A4 à 96 dpi), 1 080 px pour l'image, rendue en densité ×2 pour rester nette.
- En-tête : nom de l'équipe et titre (« Rapport collectif · Open – Les Frelons »), puis date, évènement, terrain, type et score pour un match ; numéro, nom et poste pour un joueur ; filtres actifs écrits en clair (« Championnat régional, du 4 au 5 oct. 2026 ») pour une fiche ou les statistiques globales.
- Pied de page : « Généré le 15 nov. 2026 avec Stats Ultimate » et, dans le PDF, le numéro de page (« 2 / 3 »).
- Aucun élément interactif : ni boutons, ni sélecteurs, ni onglets, ni infobulles. Une carte de chaleur apparaît telle qu'elle est affichée, son titre précisant la statistique choisie (« Carte du terrain : nos turns »).
- Le tableau des joueurs affiche toutes ses colonnes, sans défilement, en petit corps (environ 9 pt). S'il ne tient pas sur une page, il continue sur la suivante en répétant la ligne d'en-tête.
- PDF : A4 portrait, marges de 15 mm. Un bloc (rangée de tuiles, graphique, carte, morceau de tableau) n'est jamais coupé entre deux pages : s'il ne tient pas, il passe à la page suivante.
- Image : une seule image haute. Au-delà de 6 000 px de haut, l'application propose le PDF à la place.
- Les graphiques gardent leurs couleurs, légendes et étiquettes. Dans cette version, les pages du PDF sont des images ; un texte sélectionnable est facultatif.

## 9. Données d'exemple

« Essayer avec des données d'exemple » charge un club fictif (`exemple: true`) dont les matchs sont simulés avec les mêmes fonctions que la saisie réelle. Le résultat est identique à chaque chargement.

### Contenu

- 14 joueurs. Handlers : Léa Martin #7, Hugo Bernard #3, Camille Petit #11, Nathan Roux #21, Inès Faure #5. Middles : Lucas Girard #9, Chloé Morel #14, Tom Fournier #23, Manon Lambert #17, Jules Bonnet #8, Sarah Mercier #12, Maxime Blanc #31, Zoé Garnier #4, Théo Chevalier #19.
- 2 équipes : « Équipe exemple » (les 14 joueurs) et « Exemple indoor » (Léa, Hugo, Camille, Lucas, Chloé, Tom, Jules, Zoé).

| Date | Terrain | Équipe | Adversaire | Évènement | Type |
| --- | --- | --- | --- | --- | --- |
| 2026-10-04 | Outdoor | Équipe exemple | Les Frelons (ex.) | Championnat régional | Compétition |
| 2026-10-05 | Outdoor | Équipe exemple | Disc'Oiseaux (ex.) | Championnat régional | Compétition |
| 2026-11-06 | Indoor | Exemple indoor | Équipe B du club (ex.) | Entraînement du jeudi | Entraînement |

### Simulation

- Générateur pseudo-aléatoire déterministe (mulberry32, graine 20261114), pour que les données soient reproductibles et testables.
- Un match s'arrête dès qu'une équipe atteint 13 points en outdoor (9 en indoor), ou après 30 points. Le match est marqué terminé.
- Ligne : tirage au hasard de 7 joueurs (5 en indoor). Le premier pull est tiré au sort, puis l'équipe qui vient de marquer lance le pull. Le sens d'affichage alterne.
- Pull de nous : lanceur = premier joueur de la ligne, 10 % de bricks, sinon zone en M3 ou A. Pull adverse : 10 % de bricks, sinon zone en M1 ou D.
- Reprise : le joueur désigné dans la récupération (sinon au hasard), dans la zone du dernier évènement (`M1-C` après un brick).
- Attaque, à chaque action : 10 % de turn. Causes pondérées : mauvaise passe 5, drop 3, duel perdu 2, stall out 1, Callahan 0,4 si le porteur est en D ou M1. Le fautif est le receveur pour drop et duel perdu, sinon le porteur. Sinon, passe vers un autre joueur : depuis M3, 45 % de chances de but dans l'en-but adverse ; sinon le rang avance de −1, 0 ou +1 (poids 1, 2, 3), borné entre M1 et M3.
- Défense, à chaque action : 20 % de récupération (contre 4, mauvaise passe adverse 4, drop adverse 2, stall out adverse 0,5, autre 0,5 ; joueur désigné pour un contre ou dans 40 % des cas). 1,2 % de Callahan. 5,8 % de break sans but. 18 % de but adverse (marquage 3, break 3, communication 2, positionnement 2, autre 1 ; joueur désigné dans 80 % des cas ; zone en D ou M1). Le reste du temps, une passe adverse.
- Heures simulées : départ à 14 h le jour du match ; 60 à 100 s avant chaque pull, 3 à 8 s par passe, 3 à 7 s par passe adverse, 3 à 6 s pour toute autre action.
- Garde-fou : après 150 actions dans un point, but adverse « Autre » en `D-C`.

## 10. Exigences techniques : architecture et clean code

Le code doit pouvoir être repris par un bénévole du club qui connaît les bases du web : une structure prévisible, des noms explicites et une logique métier séparée de l'affichage.

### Pile technique

- **Vue 3** (Composition API, composants `.vue` avec `<script setup lang="ts">`) : des gabarits proches du HTML, faciles à lire.
- **TypeScript** en mode strict, sans `any`.
- **Vite** pour le développement et la construction.
- **Pinia** pour l'état de l'application (données chargées, indicateur non exporté, filtres).
- **Vue Router** en mode hash (`createWebHashHistory`) : GitHub Pages ne sait pas réécrire les URL, le mode hash évite les erreurs 404 au rechargement.

### Architecture en couches

1. **`domain/`** : TypeScript pur, sans Vue ni DOM. Types, zones, machine à états du point, calcul des statistiques, possessions, indices, import et normalisation du JSON, simulation des données d'exemple. C'est le cœur, entièrement testé.
2. **`services/`** : tout ce qui touche le navigateur. Lecture d'un fichier, téléchargement, presse-papiers, copie de secours `localStorage`.
3. **`stores/`** : stores Pinia qui appellent le domaine et les services, et exposent des actions nommées (`addPlayer`, `recordEvent`, `undoLastEvent`, `finishMatch`…).
4. **`components/` et `views/`** : affichage uniquement. Un composant ne calcule pas de statistique : il reçoit des données prêtes.

### Arborescence attendue

```text
stats-ultimate/
├── .github/workflows/deploy.yml
├── public/                     # icône, polices si auto-hébergées
├── src/
│   ├── domain/
│   │   ├── types.ts            # Player, Team, Match, Point, MatchEvent (union discriminée sur t)
│   │   ├── constants.ts        # tailles de ligne, causes, libellés, pondérations des indices
│   │   ├── zones.ts            # ids, noms, correspondance écran ↔ zones
│   │   ├── pointState.ts       # derivePointState(events) : machine à états
│   │   ├── score.ts            # score, série d'écarts, plus longues séries
│   │   ├── stats/
│   │   │   ├── computeStats.ts # statistiques équipe + joueurs
│   │   │   ├── possessions.ts
│   │   │   ├── indices.ts
│   │   │   └── leaders.ts
│   │   ├── export/
│   │   │   ├── paginate.ts     # répartit des blocs de hauteurs données sur des pages A4
│   │   │   ├── fileName.ts     # noms de fichier sans accents ni espaces
│   │   │   └── describeFilters.ts # filtres actifs écrits en clair pour l'en-tête
│   │   ├── filters.ts
│   │   ├── importExport.ts     # normalisation tolérante, sérialisation JSON
│   │   ├── eventText.ts        # textes du journal
│   │   └── sampleData.ts       # générateur déterministe + simulation
│   ├── services/               # fileService.ts, backupService.ts, clipboardService.ts,
│   │                           # reportExportService.ts (PNG, PDF, partage)
│   ├── stores/                 # dataStore.ts, liveMatchStore.ts, filtersStore.ts
│   ├── components/
│   │   ├── ui/                 # AppButton, ConfirmDialog, ToastMessage, SegmentedControl, KpiTile
│   │   ├── field/              # LiveField, HeatmapField, PlayerChip, PlayerChipGrid
│   │   ├── charts/             # ScoreGapChart, RunsStrip, TeamDuel, PassShareBar, PassesByPlayer, CauseBars
│   │   ├── reports/            # CollectiveReport, IndividualReport, PlayerReport, GlobalReport, PointByPoint
│   │   └── export/             # ExportButton, ExportDialog, PrintLayout (en-tête, pied de page, thème clair)
│   ├── views/                  # une vue par écran
│   ├── i18n/fr.ts              # tous les textes de l'interface
│   ├── styles/tokens.css       # couleurs, polices, espacements (clair + sombre)
│   ├── router.ts
│   └── main.ts
├── tests/                      # unit/ (Vitest) et e2e/ (Playwright)
├── index.html
├── vite.config.ts
├── README.md
└── CHANGELOG.md
```

Les rapports (`components/reports/`) servent deux fois : à l'écran, et dans `PrintLayout` pour l'export, avec une propriété `mode: 'screen' | 'print'` qui retire les éléments interactifs. Il n'y a qu'une seule définition de chaque rapport.

### Règles de clean code

- **Noms** : identifiants en anglais, explicites, sans abréviation obscure (`completedPasses`, pas `cp`). Seuls les champs du format JSON restent en français, pour la compatibilité. Commentaires, README et textes d'interface en français.
- **Une responsabilité par fonction et par fichier** : une fonction fait une chose (environ 30 lignes au plus), un composant reste sous 200 lignes. Au-delà, découpe.
- **Fonctions pures** pour toute règle métier : mêmes entrées, même résultat, aucun effet de bord. L'état d'un point est toujours dérivé de ses évènements, jamais stocké en double.
- **Pas de valeur magique** : tailles de ligne, pondérations, seuils et couleurs sont des constantes nommées ou des variables CSS.
- **Pas de duplication** : un seul composant pour les puces de joueur, un pour le terrain de saisie, un pour la carte de chaleur, un pour les tuiles, réutilisés partout.
- **Types forts** : union discriminée pour les évènements (`switch` exhaustif vérifié par le compilateur), types littéraux pour causes, zones, postes et terrains.
- **Textes centralisés** dans `i18n/fr.ts`, sans texte en dur dans les composants.
- **Erreurs** : gérées aux frontières (import de fichier, stockage, téléchargement) avec un message clair pour l'utilisateur, jamais une erreur silencieuse.
- **Commentaires** : ils expliquent pourquoi, pas quoi. Chaque fichier du domaine commence par un court en-tête qui décrit son rôle.
- **Style** : formatage Prettier, règles ESLint sans avertissement, imports triés, pas de code mort ni de `console.log`.
- **Accessibilité et performance** : HTML sémantique (`button`, `label`, `table`), pas de bibliothèque lourde, bundle initial sous 150 ko gzip (les bibliothèques d'export sont chargées à la demande par import dynamique au premier export).

## 11. Librairies, tests et déploiement GitHub Pages

Garde peu de dépendances, toutes courantes et maintenues, en dernière version stable. Deux bibliothèques chargées à la demande servent à l'export PDF / image. Aucune bibliothèque de graphiques : les graphiques sont simples et doivent suivre les règles visuelles de la section 8.

### Dépendances

| Paquet | Usage | Type |
| --- | --- | --- |
| `vue` | Interface | Exécution |
| `vue-router` | Navigation entre les vues (mode hash) | Exécution |
| `pinia` | État de l'application | Exécution |
| `@fontsource/barlow`, `@fontsource/barlow-condensed` | Polices auto-hébergées (fonctionnent sans Google Fonts) | Exécution |
| `html-to-image` | Rendu d'un bloc de rapport (HTML + SVG) en PNG, densité ×2 | Exécution, chargé à la demande |
| `jspdf` | Assemblage des blocs en pages A4, pied de page numéroté | Exécution, chargé à la demande |
| `vite`, `@vitejs/plugin-vue` | Serveur de développement et construction | Développement |
| `typescript`, `vue-tsc` | Vérification des types | Développement |
| `vitest`, `@vue/test-utils`, `jsdom` | Tests unitaires et de composants | Développement |
| `@playwright/test` | Tests de bout en bout du parcours de saisie et des exports | Développement |
| `eslint`, `typescript-eslint`, `eslint-plugin-vue`, `prettier` | Qualité et formatage | Développement |
| `vite-plugin-pwa` | Fonctionnement hors ligne | Facultatif |

**Export PDF / image, mode opératoire** : attendre `document.fonts.ready`, rendre `PrintLayout` hors écran, convertir chaque bloc en PNG avec `html-to-image`, calculer les pages avec `paginate`, placer les images avec `jspdf`, puis partager (`navigator.share`) ou télécharger. Pour l'image seule, un rendu unique du `PrintLayout` entier suffit.

### Scripts npm

- `dev` : serveur local.
- `build` : `vue-tsc --noEmit && vite build`.
- `preview` : aperçu de la version construite.
- `test` : Vitest. `test:e2e` : Playwright.
- `lint` et `format` : ESLint et Prettier.

### Tests attendus

- **Machine à états** : chaque ligne du tableau de transitions de la section 6, plus l'annulation (retirer le dernier évènement redonne l'état précédent).
- **Statistiques** : un cas de test par définition des sections 7 (joueur, équipe, possessions, indices, meilleurs joueurs, séries), avec de petits matchs construits à la main.
- **Invariants sur les données d'exemple** : buts de l'équipe = score marqué ; buts encaissés = score encaissé ; somme des buts des joueurs = buts de l'équipe ; passes décisives = buts − Callahans ; possessions finies par un but = score ; somme des zones de lancer d'un joueur = ses passes tentées ; points O + points D = points joués.
- **Import / export** : un fichier exporté puis réimporté redonne les mêmes données ; un fichier invalide affiche le bon message ; un fichier de la version actuelle (exemple de la section 3) se charge.
- **Export PDF / image** : `paginate` (un bloc trop haut passe à la page suivante, aucun bloc coupé, en-tête du tableau répété), `fileName` (accents, espaces, période « tout »), `describeFilters` (filtres en clair) ; un test de composant vérifie que le mode `print` ne contient ni bouton ni sélecteur.
- **Bout en bout** (Playwright, écran 390 × 844) : créer un fichier vide, ajouter 7 joueurs, créer une équipe, créer un match, jouer un point en attaque jusqu'au but, un point en défense avec contre, reprise, turn et but adverse validé sans joueur, annuler une action, rouvrir un point, terminer le match, ouvrir les trois onglets du rapport, exporter le rapport collectif en PDF et la fiche d'un joueur en PNG (fichier téléchargé, nom attendu, taille non nulle, PDF d'au moins une page), exporter les données JSON puis les réimporter.
- Couverture visée : au moins 90 % sur `src/domain`.

### Déploiement GitHub Pages

- Dans `vite.config.ts`, `base: './'` (chemins relatifs) : le site fonctionne quel que soit le nom du dépôt.
- Le workflow ci-dessous vérifie, teste, construit et publie à chaque push sur `main`. Utilise les dernières versions majeures des actions officielles.
- Dans le dépôt : Settings → Pages → Source : « GitHub Actions ». Le site est ensuite à l'adresse `https://<compte>.github.io/<depot>/`.

```yaml
# .github/workflows/deploy.yml
name: Déployer sur GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### README (en français)

- À quoi sert l'application et comment l'utiliser en match, en dix lignes.
- Installer et lancer en local (`npm install`, `npm run dev`), lancer les tests.
- Publier sur GitHub Pages, pas à pas.
- Le format JSON (renvoi vers `src/domain/types.ts`) et la règle de compatibilité.
- Les choix d'interprétation faits pendant la réécriture.

## 12. Critères d'acceptation

La réécriture est terminée quand chaque point ci-dessous est vérifié sur téléphone (390 px) et sur ordinateur, en thème clair et sombre.

### Données

- [ ] Un fichier exporté par la version actuelle se charge sans perte.
- [ ] Import par fichier, par collage, copie de secours, fichier vide et données d'exemple fonctionnent ; les erreurs s'affichent clairement.
- [ ] L'export télécharge le fichier daté ; l'indicateur « Non exporté » et l'avertissement de fermeture fonctionnent.

### Gestion

- [ ] Effectif : ajout, modification, retrait (ancien joueur ou suppression), anciens joueurs masquables.
- [ ] Équipes : création, modification, suppression, historique intact.
- [ ] Nouveau match : tous les champs, suggestions d'évènements, refus sans équipe.
- [ ] Historique, détail du match, reprise et suppression d'un match.

### Saisie en direct

- [ ] Ligne : puces avec points joués, même ligne, hors équipe, sens d'attaque alterné, badge attaque ou défense attendue.
- [ ] Les 15 zones, les étiquettes d'en-but, le sens et le disque du porteur s'affichent comme décrit.
- [ ] Chaque transition de la section 6 fonctionne, avec la règle d'ordre libre et les présélections.
- [ ] Une passe attrapée dans l'en-but adverse donne le point et revient à la sélection de la ligne.
- [ ] En défense, joueurs et zone sont facultatifs ; le bouton de validation adapte son libellé.
- [ ] Annuler la dernière action, annuler un point vide, rouvrir le dernier point, terminer et rouvrir un match.
- [ ] Une passe simple se saisit en deux touches, un pull de notre lanceur habituel en une.

### Statistiques et rapports

- [ ] Chaque définition de la section 7 est respectée et couverte par un test.
- [ ] Fiche joueur et statistiques globales avec tous leurs filtres.
- [ ] Rapport collectif complet (neuf blocs), rapport individuel (trois blocs), point par point.
- [ ] Graphiques conformes aux règles visuelles, lisibles en sombre, avec descriptions accessibles.
- [ ] Export PDF et PNG depuis le détail du match (collectif, individuel, complet en PDF), la fiche joueur et les statistiques globales : en-tête, filtres en clair, pied de page, thème clair, aucun bloc coupé, nom de fichier conforme.
- [ ] Sur téléphone, le fichier exporté peut être partagé directement quand le navigateur le permet.

### Code et déploiement

- [ ] Architecture en couches respectée ; `src/domain` sans dépendance à Vue ni au navigateur.
- [ ] `npm run lint`, `npm test`, `npm run test:e2e` et `npm run build` passent sans erreur ni avertissement.
- [ ] Le push sur `main` publie automatiquement le site sur GitHub Pages.
- [ ] Le README permet à un bénévole d'installer, de tester et de publier sans aide.
