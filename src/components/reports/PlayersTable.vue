<script setup lang="ts">
// Tableau des joueurs, partagé par le rapport individuel et les statistiques globales.
// Tri par Indice décroissant par défaut ; un deuxième toucher sur l'en-tête inverse l'ordre.
import { computed, ref } from 'vue'

import { formatNumber, formatPercent } from '@/domain/format'
import type { PlayerStats } from '@/domain/stats/computeStats'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import ColumnsLegend from './ColumnsLegend.vue'

type ColumnKey = keyof typeof fr.table.columns

const props = defineProps<{
  rows: PlayerStats[]
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()

const NUMERIC_COLUMNS: ColumnKey[] = [
  'matchesPlayed',
  'pointsPlayed',
  'mvpIndex',
  'offensiveImpact',
  'defensiveImpact',
  'differential',
  'plusMinus',
  'goals',
  'assists',
  'blocks',
  'recoveries',
  'turns',
  'passRate',
  'receptions',
  'defensiveFaults',
  'pulls',
]
const ALL_COLUMNS: ColumnKey[] = ['name', ...NUMERIC_COLUMNS]
const DECIMAL_COLUMNS: ColumnKey[] = ['mvpIndex', 'offensiveImpact', 'defensiveImpact']

const sortKey = ref<ColumnKey>('mvpIndex')
const descending = ref(true)

function playerName(stats: PlayerStats): string {
  const player = props.findPlayer(stats.playerId)
  return player ? `#${player.numero} ${player.prenom} ${player.nom}` : '?'
}

function sortValue(stats: PlayerStats, key: ColumnKey): number | string {
  if (key === 'name') return props.findPlayer(stats.playerId)?.numero ?? 0
  if (key === 'passRate')
    return stats.attemptedPasses ? stats.completedPasses / stats.attemptedPasses : -1
  return stats[key]
}

function cell(stats: PlayerStats, key: ColumnKey): string {
  if (key === 'passRate') return formatPercent(stats.completedPasses, stats.attemptedPasses)
  const value = sortValue(stats, key)
  return DECIMAL_COLUMNS.includes(key) ? formatNumber(value as number) : String(value)
}

const sorted = computed(() => {
  const direction = descending.value ? -1 : 1
  return [...props.rows].sort((a, b) => {
    const left = sortValue(a, sortKey.value)
    const right = sortValue(b, sortKey.value)
    return left < right ? -direction : left > right ? direction : 0
  })
})

function sortBy(key: ColumnKey): void {
  if (sortKey.value === key) descending.value = !descending.value
  else {
    sortKey.value = key
    descending.value = key !== 'name'
  }
}

function ariaSort(key: ColumnKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return descending.value ? 'descending' : 'ascending'
}
</script>

<template>
  <div class="table-wrap" :class="mode">
    <table class="players-table print-table">
      <caption class="visually-hidden">
        {{
          fr.table.caption
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="key in ALL_COLUMNS"
            :key="key"
            scope="col"
            :aria-sort="mode === 'screen' ? ariaSort(key) : undefined"
            :title="fr.table.columns[key][1]"
          >
            <button v-if="mode === 'screen'" type="button" class="sort" @click="sortBy(key)">
              {{ fr.table.columns[key][0] }}
              <span aria-hidden="true">{{ sortKey === key ? (descending ? '▼' : '▲') : '' }}</span>
            </button>
            <template v-else>{{ fr.table.columns[key][0] }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stats in sorted" :key="stats.playerId">
          <th scope="row">
            <RouterLink
              v-if="mode === 'screen'"
              :to="{ name: 'player', params: { id: stats.playerId } }"
            >
              {{ playerName(stats) }}
            </RouterLink>
            <template v-else>{{ playerName(stats) }}</template>
          </th>
          <td v-for="key in NUMERIC_COLUMNS" :key="key">{{ cell(stats, key) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <ColumnsLegend v-if="mode === 'screen'" />
</template>

<style scoped>
.table-wrap.screen {
  overflow-x: auto;
}

.players-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9rem;
}

.print .players-table {
  font-size: 9pt;
}

th,
td {
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--border);
  text-align: right;
  white-space: nowrap;
}

.print th,
.print td {
  padding: 3px 4px;
}

thead th,
tbody th {
  text-align: left;
}

thead th:not(:first-child) {
  text-align: right;
}

/* Première colonne fixe au défilement horizontal. */
.screen th:first-child {
  position: sticky;
  left: 0;
  background: var(--surface);
  z-index: 1;
}

.sort {
  min-height: var(--touch);
  border: none;
  background: none;
  color: inherit;
  font: 700 0.9rem var(--font-text);
  cursor: pointer;
  padding: 0;
}
</style>
