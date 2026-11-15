# Journal des modifications

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
