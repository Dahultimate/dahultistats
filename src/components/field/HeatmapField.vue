<script setup lang="ts">
// Carte de chaleur : terrain vertical, notre attaque vers le haut. Rampe à une teinte en 7 paliers.
import { computed } from 'vue'

import type { Counts } from '@/domain/stats/statsTypes'
import type { ZoneId } from '@/domain/types'
import { heatmapGrid, zoneName } from '@/domain/zones'
import { fr } from '@/i18n/fr'

const RAMPS = {
  blue: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  orange: ['#fde4d8', '#f9c4ab', '#f4a07d', '#eb6834', '#c9521f', '#a24118', '#7c3112'],
} as const
/** À partir de ce palier, le nombre s'écrit en blanc. */
const FIRST_DARK_STEP = 4
const WIDTHS = { normal: 230, compact: 140, mini: 100 } as const

const props = withDefaults(
  defineProps<{
    counts: Counts<ZoneId>
    label: string
    ramp?: keyof typeof RAMPS
    size?: keyof typeof WIDTHS
  }>(),
  { ramp: 'blue', size: 'normal' },
)

const max = computed(() => Math.max(0, ...Object.values(props.counts).map((value) => value ?? 0)))
const total = computed(() =>
  Object.values(props.counts).reduce<number>((sum, value) => sum + (value ?? 0), 0),
)

function step(value: number): number {
  return Math.min(6, Math.max(0, Math.ceil((value / max.value) * 7) - 1))
}

const cells = computed(() =>
  heatmapGrid()
    .flat()
    .map((zone) => {
      const value = props.counts[zone] ?? 0
      const level = value > 0 ? step(value) : -1
      return {
        zone,
        value,
        background: level >= 0 ? RAMPS[props.ramp][level] : 'var(--heat-zero)',
        dark: level >= FIRST_DARK_STEP,
        endzone: zone.startsWith('A') || zone.startsWith('D'),
      }
    }),
)

const description = computed(() => {
  const busiest = cells.value.filter((cell) => cell.value === max.value && max.value > 0)
  const where = busiest.map((cell) => zoneName(cell.zone)).join(', ')
  return fr.heatmap.describe(props.label, total.value, max.value, where)
})
</script>

<template>
  <figure class="heatmap" :class="size" :style="{ width: `${WIDTHS[size]}px` }">
    <figcaption v-if="size !== 'mini'" class="legend small">{{ fr.heatmap.top }}</figcaption>
    <div class="grid" role="img" :aria-label="description">
      <span
        v-for="cell in cells"
        :key="cell.zone"
        class="cell"
        :class="{ endzone: cell.endzone, dark: cell.dark }"
        :style="{ background: cell.background }"
        :title="`${zoneName(cell.zone)} : ${cell.value}`"
      >
        {{ size === 'mini' && cell.value === 0 ? '' : cell.value }}
      </span>
    </div>
    <p v-if="size !== 'mini'" class="legend small">{{ fr.heatmap.bottom }}</p>
    <p v-if="max > 0" class="scale small" aria-hidden="true">
      <span>1</span>
      <span class="ramp">
        <span v-for="color in RAMPS[ramp]" :key="color" :style="{ background: color }"></span>
      </span>
      <span>{{ max }}</span>
    </p>
  </figure>
</template>

<style scoped>
.heatmap {
  margin: 0;
  display: grid;
  gap: var(--space-1);
  max-width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr 1.2fr 1.2fr 1.2fr 1fr;
  gap: 2px;
  aspect-ratio: 52 / 100;
  padding: 2px;
  border-radius: 6px;
  background: var(--border);
}

.cell {
  display: grid;
  place-items: center;
  font: 700 1.05rem var(--font-title);
  color: #10161a;
  border-radius: 2px;
}

.cell.endzone {
  outline: 1px dashed rgb(0 0 0 / 25%);
  outline-offset: -3px;
}

.cell.dark {
  color: #fff;
}

.compact .cell {
  font-size: 0.85rem;
}

.mini .cell {
  font-size: 0.75rem;
}

.legend {
  margin: 0;
  text-align: center;
  color: var(--ink-muted);
}

.scale {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--ink-muted);
}

.ramp {
  flex: 1;
  display: flex;
  height: 8px;
}

.ramp span {
  flex: 1;
}
</style>
