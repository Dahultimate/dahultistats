// Navigation en mode hash : GitHub Pages ne sait pas réécrire les URL,
// le mode hash évite les erreurs 404 au rechargement.

import { createRouter, createWebHashHistory } from 'vue-router'

import { fr } from './i18n/fr'
import { useDataStore } from './stores/dataStore'
import HistoryView from './views/HistoryView.vue'
import HomeView from './views/HomeView.vue'
import LineView from './views/LineView.vue'
import MatchDetailView from './views/MatchDetailView.vue'
import NewMatchView from './views/NewMatchView.vue'
import OpenView from './views/OpenView.vue'
import PlayerView from './views/PlayerView.vue'
import PointView from './views/PointView.vue'
import RosterView from './views/RosterView.vue'
import StatsView from './views/StatsView.vue'
import TeamEditView from './views/TeamEditView.vue'
import TeamsView from './views/TeamsView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    /** Vue parente du bouton retour ; absente sur l'accueil et l'ouverture. */
    parent?: string
  }
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'open', component: OpenView },
    { path: '/accueil', name: 'home', component: HomeView, meta: { title: fr.titles.home } },
    {
      path: '/effectif',
      name: 'roster',
      component: RosterView,
      meta: { title: fr.titles.roster, parent: 'home' },
    },
    {
      path: '/joueur/:id',
      name: 'player',
      component: PlayerView,
      meta: { title: fr.titles.player, parent: 'roster' },
    },
    {
      path: '/equipes',
      name: 'teams',
      component: TeamsView,
      meta: { title: fr.titles.teams, parent: 'home' },
    },
    {
      path: '/equipes/:id',
      name: 'team-edit',
      component: TeamEditView,
      meta: { title: fr.titles.teamEdit, parent: 'teams' },
    },
    {
      path: '/match/nouveau',
      name: 'new-match',
      component: NewMatchView,
      meta: { title: fr.titles.newMatch, parent: 'home' },
    },
    {
      path: '/match/:id/ligne',
      name: 'line',
      component: LineView,
      meta: { title: fr.titles.line, parent: 'home' },
    },
    {
      path: '/match/:id/point',
      name: 'point',
      component: PointView,
      meta: { title: fr.titles.point, parent: 'home' },
    },
    {
      path: '/match/:id',
      name: 'match',
      component: MatchDetailView,
      meta: { title: fr.titles.match, parent: 'history' },
    },
    {
      path: '/statistiques',
      name: 'stats',
      component: StatsView,
      meta: { title: fr.titles.stats, parent: 'home' },
    },
    {
      path: '/historique',
      name: 'history',
      component: HistoryView,
      meta: { title: fr.titles.history, parent: 'home' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Sans données chargées, toutes les vues renvoient vers l'écran d'ouverture.
router.beforeEach((to) => {
  if (to.name !== 'open' && !useDataStore().data) return { name: 'open' }
  return true
})
