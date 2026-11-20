<script setup lang="ts">
// Affinités : passes, buts et drops dans chaque sens, points joués ensemble, pour chaque duo.
// Avec `partners`, chaque ligne est vue depuis le joueur de la fiche (colonne « Partenaire »).
import { playerLabel } from '@/domain/eventText'
import { formatSigned } from '@/domain/format'
import { type BothWays, type PairAffinity, total } from '@/domain/stats/affinities'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

const props = defineProps<{
  rows: PairAffinity[]
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
  partners?: boolean
}>()

const c = fr.affinity.columns
const ways = ['passes', 'assists', 'drops'] as const
const label = (id: string) => playerLabel(props.findPlayer(id))
const split = ([out, back]: BothWays) => `${out}→ ←${back}`
</script>

<template>
  <p v-if="rows.length === 0" class="muted">{{ fr.reports.noValue }}</p>
  <template v-else>
    <div class="table-wrap" :class="mode">
      <table class="affinity-table print-table">
        <caption class="visually-hidden">
          {{
            fr.affinity.caption
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ partners ? fr.affinity.partner : fr.affinity.duo }}</th>
            <th v-for="key in ways" :key="key" scope="col">{{ c[key] }}</th>
            <th scope="col">{{ c.points }}</th>
            <th scope="col">{{ c.differential }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pair in rows" :key="`${pair.a}|${pair.b}`">
            <th scope="row">
              <span v-if="!partners" class="who">{{ label(pair.a) }}</span>
              <span class="who">{{ label(pair.b) }}</span>
            </th>
            <td v-for="key in ways" :key="key">
              <strong>{{ total(pair[key]) }}</strong>
              <span v-if="total(pair[key])" class="split">{{ split(pair[key]) }}</span>
            </td>
            <td>{{ pair.points }}</td>
            <td>{{ formatSigned(pair.differential) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="small muted">{{ partners ? fr.affinity.playerLegend : fr.affinity.legend }}</p>
  </template>
</template>

<style scoped>
.table-wrap.screen {
  overflow-x: auto;
}

.affinity-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9rem;
}

.print .affinity-table {
  font-size: 9pt;
}

th,
td {
  padding: var(--space-1) 6px;
  border-bottom: 1px solid var(--border);
  text-align: right;
  white-space: nowrap;
  vertical-align: top;
}

thead th:first-child,
tbody th {
  text-align: left;
}

.who {
  display: block;
}

.split {
  display: block;
  font-size: 0.75rem;
  color: var(--ink-muted);
}

/* Première colonne fixe au défilement horizontal. */
.screen th:first-child {
  position: sticky;
  left: 0;
  background: var(--surface-solid);
  z-index: 1;
}
</style>
