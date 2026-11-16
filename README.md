# Stats Ultimate

Application web pour saisir en direct les statistiques d’un match d’Ultimate Frisbee, au bord du
terrain, sur téléphone, puis consulter les statistiques individuelles et collectives (club
Dahultimate, Annecy).

## À quoi sert l’application, et comment l’utiliser en match

1. À l’ouverture, importez votre fichier JSON (ou créez un fichier vide, ou essayez les données d’exemple).
2. **Effectif** : ajoutez les joueurs (prénom, nom, numéro, poste). **Équipes** : regroupez-les.
3. **Nouveau match** : date, équipe, adversaire, évènement, terrain, type → « Commencer le match ».
4. Avant chaque point, touchez les joueurs sur le terrain, puis « Démarrer le point ».
5. Pendant le point, une action = une ou deux touches : l’endroit sur le terrain et un joueur, dans l’ordre que vous voulez.
6. En attaque : passe = endroit + receveur (les passes s’affichent en flèches sur le terrain) ; une réception dans l’en-but adverse est un but. Bouton **TURN** pour une perte de disque.
7. En défense : choisissez ce qui se passe (contre, but adverse…), joueurs et endroit facultatifs.
8. « ↶ Annuler la dernière action » corrige toute erreur, à tout moment.
9. « Terminer le match » ouvre le rapport : rapport collectif, individuel, point par point, export PDF / image.
10. **Exportez le fichier JSON** (bouton jaune « Exporter ») après chaque séance : seul ce fichier fait foi.

Aucun compte, aucun serveur : tout reste dans le navigateur et dans votre fichier. Une copie de
secours est gardée dans le navigateur et proposée à l’ouverture, mais elle ne remplace pas l’export.

## Installer et lancer en local

Il faut [Node.js](https://nodejs.org/) (version LTS).

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrez l’adresse affichée (par défaut http://localhost:5173).

Autres commandes :

| Commande                | Rôle                                                    |
| ----------------------- | ------------------------------------------------------- |
| `npm run build`         | Vérifie les types puis construit le site dans `dist/`   |
| `npm run preview`       | Sert la version construite                              |
| `npm test`              | Tests unitaires et de composants (Vitest)               |
| `npm run test:coverage` | Idem, avec la couverture de `src/domain` (seuil : 90 %) |
| `npm run test:e2e`      | Test de bout en bout du parcours du coach (Playwright)  |
| `npm run lint`          | ESLint (aucun avertissement toléré)                     |
| `npm run format`        | Formatage Prettier                                      |

Avant le premier `npm run test:e2e`, installez le navigateur de test :

```bash
npx playwright install chromium
```

## Publier sur GitHub Pages, pas à pas

1. Créez un dépôt sur GitHub (public, ou privé avec un abonnement qui permet Pages).
2. Envoyez le code sur la branche `main` :
   ```bash
   git init
   ```
   ```bash
   git add . && git commit -m "Stats Ultimate"
   ```
   ```bash
   git branch -M main && git remote add origin https://github.com/<compte>/<depot>.git && git push -u origin main
   ```
3. Dans le dépôt : **Settings → Pages → Source : « GitHub Actions »**.
4. Le workflow `.github/workflows/deploy.yml` vérifie (lint, tests), construit et publie le site à
   chaque push sur `main`. Suivez-le dans l’onglet **Actions**.
5. Le site est ensuite à l’adresse `https://<compte>.github.io/<depot>/`.

Le site utilise des chemins relatifs (`base: './'`) et une navigation en mode hash (`#/…`) : il
fonctionne quel que soit le nom du dépôt, et un rechargement de page ne donne jamais d’erreur 404.

## Format des données (JSON) et compatibilité

Le format `ultimate-stats` version 1 est décrit par les types de
[`src/domain/types.ts`](src/domain/types.ts). Les noms de champs restent en français
(`joueurs`, `equipes`, `matchs`, `evenements`…) et **ne doivent pas changer** : ils garantissent
que les fichiers exportés par l’ancienne version se relisent sans perte.

- Le score, les statistiques et l’état d’un point ne sont jamais stockés : ils sont recalculés à
  partir des évènements.
- L’import est tolérant (valeurs par défaut, entrées sans `id` ou évènements sans `t` ignorés) et
  conserve les champs inconnus.
- L’endroit d’une action est enregistré dans `position: { "x": …, "y": … }`, toujours dans le sens
  de notre attaque : `x` va de 0 (fond de notre en-but) à 1 (fond de l’en-but adverse), `y` de 0
  (gauche) à 1 (droite). Un pull sorti du terrain porte `"brick": true` et pas de position.
- Les fichiers plus anciens enregistraient une zone (`"zone": "M2-C"`) : à l’import, elle est
  convertie en position au centre de la zone, et le champ `zone` est conservé tel quel.
- L’export écrit `stats-ultimate-AAAA-MM-JJ.json`, indenté de 2 espaces, avec le champ `exporteLe`.

## Organisation du code

| Dossier           | Contenu                                                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/`     | TypeScript pur, sans Vue ni navigateur : types, zones et positions, machine à états du point, carte de chaleur, statistiques, possessions, indices, import / export, données d’exemple, pagination des exports. Entièrement testé. |
| `src/services/`   | Accès au navigateur : fichiers, téléchargement, presse-papiers, copie de secours, PDF / PNG.                                                                                                                                       |
| `src/stores/`     | État de l’application (Pinia) : données, saisie en direct, filtres, messages.                                                                                                                                                      |
| `src/components/` | Affichage : terrain, carte de chaleur, graphiques, rapports, export.                                                                                                                                                               |
| `src/views/`      | Une vue par écran (12 vues).                                                                                                                                                                                                       |
| `src/i18n/fr.ts`  | Tous les textes de l’interface.                                                                                                                                                                                                    |
| `tests/`          | `unit/` (Vitest) et `e2e/` (Playwright).                                                                                                                                                                                           |

Les pondérations des indices (apport offensif, défensif, MVP) sont dans
[`src/domain/constants.ts`](src/domain/constants.ts).

## Choix d’interprétation

La spécification laisse quelques points ouverts ; voici les choix retenus (les plus simples pour le coach).

**Saisie**

- On touche l’endroit exact de l’action sur le terrain ; au clavier, les flèches déplacent un repère
  et Entrée valide. Le journal nomme l’endroit par sa zone (« Milieu droite »).
- Le circuit de passes affiché sur le terrain est celui de la dernière possession : il repart de
  zéro à chaque reprise du jeu et reste visible en défense jusqu’à la reprise suivante.
- Après une récupération saisie sans endroit, la reprise est présélectionnée au centre de `M1-C`,
  comme après un brick.
- Le bouton « Partager » n’apparaît que sur un appareil tactile dont le navigateur sait partager
  des fichiers ; sur ordinateur, le fichier est téléchargé directement.
- Dans le journal, un pull de notre équipe sorti du terrain s’écrit « Pull de #12 Sarah → Brick » ;
  un break sans but s’écrit sans préfixe (« Break (sans but) · #5 Inès »).
- Un numéro déjà porté par un joueur actif est signalé dans le message de confirmation, sans bloquer.

**Statistiques**

- Meilleur passeur décisif : « Personne » si aucun joueur classé n’a de passe décisive.
  Meilleur défenseur : « Personne » si aucun joueur classé n’a de récupération. Si l’égalité
  persiste après le critère secondaire, le premier joueur rencontré l’emporte.
- Historique : à date égale, le match créé le plus récemment apparaît en premier.
- Carte de chaleur : chaque action est étalée sur environ 5 % de la longueur du terrain (noyau
  gaussien) ; la densité est découpée en 7 paliers de couleur, et les endroits sans action restent gris.
- Le tableau des joueurs garde ses infobulles, et un dépliant « Explication des colonnes » donne
  les mêmes explications sur téléphone (aucune information n’est accessible seulement au survol).
- Nos turns sont tracés en rouge (couleur des passes ratées), les buts encaissés en orange.

**Exports PDF / image**

- Les pages du PDF sont des images JPEG (qualité 0,92) : un rapport complet pèse quelques Mo au
  lieu de plusieurs dizaines avec des PNG.
- Un bloc plus haut qu’une page entière (rare) est réduit pour tenir sur sa page plutôt que coupé.
- Le nom de fichier d’une période vaut `tout`, `du-AAAA-MM-JJ-au-AAAA-MM-JJ`, `depuis-AAAA-MM-JJ`
  ou `jusqu-au-AAAA-MM-JJ`.

**Données d’exemple (simulation)**

- Chaque position est tirée au hasard à l’intérieur d’une zone de la simulation (par exemple un
  pull adverse en `D` ou `M1`). L’endroit d’une récupération est tiré entre notre en-but et le
  tiers offensif ; celui d’un turn est celui du porteur.
- Un Callahan désigne toujours un joueur, dans l’en-but adverse ; un break sans but désigne un
  joueur dans 80 % des cas, sans position.
- Les heures sont calculées à partir de 14 h, heure locale, le jour du match.

**Non fourni**

- Le fonctionnement hors ligne (service worker, facultatif) n’est pas inclus.
- Pas de composant `AppButton` : les boutons sont des `<button>` natifs avec les classes CSS `.btn`.
