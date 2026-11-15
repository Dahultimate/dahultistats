// Filtres actifs des statistiques globales et de la fiche joueur (conservés pendant la visite).

import { defineStore } from 'pinia'
import { ref } from 'vue'

import { emptyFilters, type StatsFilters } from '@/domain/filters'

export const useFiltersStore = defineStore('filters', () => {
  const global = ref<StatsFilters>(emptyFilters())
  const player = ref<StatsFilters>(emptyFilters())
  /** Les filtres de la fiche se réinitialisent quand on change de joueur. */
  const playerId = ref<string | null>(null)

  function forPlayer(id: string): StatsFilters {
    if (playerId.value !== id) {
      playerId.value = id
      player.value = emptyFilters()
    }
    return player.value
  }

  function clearGlobal(): void {
    global.value = emptyFilters()
  }

  function clearPlayer(): void {
    player.value = emptyFilters()
  }

  return { global, player, forPlayer, clearGlobal, clearPlayer }
})
