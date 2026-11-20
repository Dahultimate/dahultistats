# Journal des modifications

## Non publié

- Saisie : un but encaissé, un Callahan ou un Callahan subi ne peut plus être placé hors de l’en-but
  concerné ; le toucher est refusé avec un message.
- Statistiques : affinités entre joueurs (passes, buts sur passe décisive et drops dans chaque
  sens, points joués ensemble, différentiel) dans le rapport individuel, les statistiques globales
  et la fiche joueur, exports compris.
- Apparence : choix du thème (Classique ou Verre liquide), chacun en clair et en sombre ; le mode
  suit l’appareil et se bascule depuis le bandeau. Police Figtree auto-hébergée.

## 1.1.0 — 2026-11-16

- Saisie : le terrain n’est plus découpé en zones, on touche l’endroit exact de l’action ;
  les coordonnées sont enregistrées (`position: { x, y }`) au lieu de la zone.
- Saisie : le circuit de passes s’affiche sur le terrain (nom et numéro de chaque receveur,
  flèches entre les passes, flèche en pointillés vers l’endroit déjà touché).
- Rapports : les terrains à zones sont remplacés par de vraies cartes de chaleur.
- Les fichiers enregistrés avec des zones se chargent toujours : chaque zone devient une position
  au centre de la zone. Les données d’exemple sont simulées avec des positions.

## 1.0.0 — 2026-11-15

Réécriture complète de Stats Ultimate (Vue 3, TypeScript, Vite, Pinia).

- Lecture sans perte des fichiers JSON `ultimate-stats` version 1 ; import par fichier, collage,
  copie de secours, fichier vide ou données d’exemple.
- Effectif, équipes, nouveau match, historique et détail des matchs.
- Saisie en direct : sélection de la ligne, terrain de 15 zones, règle d’ordre libre,
  présélections, annulation de la dernière action, réouverture du dernier point.
- Statistiques individuelles et collectives, possessions, indices de performance, meilleurs joueurs.
- Rapports collectif (neuf blocs), individuel (trois blocs) et point par point ; fiche joueur et
  statistiques globales filtrables.
- Export des rapports en PDF A4 et en image PNG, avec partage direct sur téléphone.
- Thèmes clair et sombre, accessibilité (clavier, lecteurs d’écran, couleurs lisibles par les daltoniens).
- Tests unitaires, de composants et de bout en bout ; déploiement automatique sur GitHub Pages.
