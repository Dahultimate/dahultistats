<script setup lang="ts">
// Passes réussies (bleu) et ratées (rouge) par joueur, à l'échelle du joueur qui en a tenté le plus.
import { computed } from 'vue'

import { formatPercent } from '@/domain/format'
import { fr } from '@/i18n/fr'

export interface PasserRow {
  id: string
  label: string
  completed: number
  attempted: number
  missedDetail: string
}

const props = defineProps<{ rows: PasserRow[] }>()

const max = computed(() => Math.max(1, ...props.rows.map((row) => row.attempted)))
const lines = computed(() =>
  props.rows.map((row) => {
    const missed = row.attempted - row.completed
    const summary = `${row.completed}/${row.attempted} · ${formatPercent(row.completed, row.attempted)}`
    return {
      ...row,
      missed,
      summary,
      okWidth: `${(row.completed / max.value) * 100}%`,
      missedWidth: `${(missed / max.value) * 100}%`,
      title: `${row.label} : ${summary}${row.missedDetail ? fr.reports.missedPasses(row.missedDetail) : ''}`,
    }
  }),
)
const description = computed(() => lines.value.map((line) => line.title).join(' ; '))
</script>

<template>
  <figure class="passes">
    <div class="chart-legend">
      <span><i class="swatch us"></i>{{ fr.reports.passesLegendOk }}</span>
      <span><i class="swatch miss"></i>{{ fr.reports.passesLegendMissed }}</span>
    </div>
    <p v-if="rows.length === 0" class="muted small">{{ fr.reports.noValue }}</p>
    <div v-else class="rows" role="img" :aria-label="description">
      <template v-for="line in lines" :key="line.id">
        <span class="label">{{ line.label }}</span>
        <span class="track" :title="line.title">
          <span v-if="line.completed" class="bar ok" :style="{ width: line.okWidth }"></span>
          <span v-if="line.missed" class="bar missed" :style="{ width: line.missedWidth }"></span>
        </span>
        <span class="summary">{{ line.summary }}</span>
      </template>
    </div>
  </figure>
</template>

<style scoped>
.passes {
  margin: 0;
  display: grid;
  gap: var(--space-3);
}

.rows {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--space-2) var(--space-2);
  align-items: center;
}

.label,
.summary {
  font-size: 0.85rem;
  white-space: nowrap;
}

.summary {
  font-weight: 700;
}

.track {
  display: flex;
  gap: 2px;
  height: 20px;
  border-left: 1px solid var(--ink-muted);
}

.bar.ok {
  background: var(--c-us);
}

.bar.missed {
  background: var(--c-miss);
  border-radius: 0 4px 4px 0;
}

.bar.ok:last-child {
  border-radius: 0 4px 4px 0;
}
</style>
