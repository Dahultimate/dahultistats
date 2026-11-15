<script setup lang="ts">
// Comparatif des équipes : barres en miroir (nous à gauche, adversaire à droite).
import { computed } from 'vue'

import { formatFraction } from '@/domain/format'
import type { DuelRow } from '@/domain/reports'
import { fr } from '@/i18n/fr'

const props = defineProps<{ rows: DuelRow[]; ourName: string; theirName: string }>()

function display(row: DuelRow, value: number | null): string {
  if (value === null) return '—'
  return row.kind === 'percent' ? formatFraction(value) : String(value)
}

const lines = computed(() =>
  props.rows.map((row) => {
    const scale = row.kind === 'percent' ? 1 : Math.max(1, row.us ?? 0, row.them ?? 0)
    const width = (value: number | null) => `${((value ?? 0) / scale) * 100}%`
    return {
      ...row,
      label: fr.reports.duelRows[row.key],
      usText: display(row, row.us),
      themText: display(row, row.them),
      usWidth: width(row.us),
      themWidth: width(row.them),
    }
  }),
)

const description = computed(() =>
  lines.value
    .map(
      (line) =>
        `${line.label} : ${props.ourName} ${line.usText}, ${props.theirName} ${line.themText}`,
    )
    .join(' ; '),
)
const missingPossession = computed(() =>
  props.rows.some((row) => row.key === 'possession' && row.us === null),
)
</script>

<template>
  <figure class="duel">
    <div class="chart-legend">
      <span><i class="swatch us"></i>{{ ourName }}</span>
      <span><i class="swatch them"></i>{{ theirName }}</span>
    </div>
    <div class="rows" role="img" :aria-label="description">
      <div v-for="line in lines" :key="line.key" class="duel-row">
        <span class="label">{{ line.label }}</span>
        <div class="halves">
          <div class="half left" :title="`${ourName} : ${line.usText}`">
            <span class="value">{{ line.usText }}</span>
            <span class="bar us" :style="{ width: line.usWidth }"></span>
          </div>
          <div class="half right" :title="`${theirName} : ${line.themText}`">
            <span class="bar them" :style="{ width: line.themWidth }"></span>
            <span class="value">{{ line.themText }}</span>
          </div>
        </div>
      </div>
    </div>
    <figcaption v-if="missingPossession" class="small muted">
      {{ fr.reports.possessionNote }}
    </figcaption>
  </figure>
</template>

<style scoped>
.duel {
  margin: 0;
  display: grid;
  gap: var(--space-3);
}

.rows {
  display: grid;
  gap: var(--space-3);
}

.label {
  display: block;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.halves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  border-left: 1px solid transparent;
}

.half {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  height: 22px;
}

.half.left {
  justify-content: flex-end;
  border-right: 1px solid var(--ink-muted);
}

.bar {
  height: 100%;
  max-width: calc(100% - 3.5em);
}

.bar.us {
  background: var(--c-us);
  border-radius: 4px 0 0 4px;
}

.bar.them {
  background: var(--c-them);
  border-radius: 0 4px 4px 0;
}

.value {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
