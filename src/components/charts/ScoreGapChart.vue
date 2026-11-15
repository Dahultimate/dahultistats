<script setup lang="ts">
// Écart au score point par point : colonnes divergentes depuis une ligne zéro.
import { computed } from 'vue'

import { formatSigned } from '@/domain/format'
import { labelledGapIndexes, type ScoreStep } from '@/domain/score'
import { fr } from '@/i18n/fr'

const MAX_X_LABELS = 12

const props = defineProps<{ steps: ScoreStep[]; ourName: string; theirName: string }>()

const maxGap = computed(() => Math.max(1, ...props.steps.map((step) => Math.abs(step.gap))))
const labelEvery = computed(() => Math.ceil(props.steps.length / MAX_X_LABELS))

const labelled = computed(() => labelledGapIndexes(props.steps))

const columns = computed(() =>
  props.steps.map((step, index) => ({
    ...step,
    height: `${(Math.abs(step.gap) / maxGap.value) * 100}%`,
    showLabel: labelled.value.has(index),
    showX: index % labelEvery.value === 0 || index === props.steps.length - 1,
  })),
)

const description = computed(() =>
  fr.reports.scoreGapDescribe(props.steps.length, formatSigned(props.steps.at(-1)?.gap ?? 0)),
)
</script>

<template>
  <figure class="stack chart">
    <div class="plot" role="img" :aria-label="description">
      <div class="axis" aria-hidden="true">
        <span>{{ formatSigned(maxGap) }}</span>
        <span>0</span>
        <span>{{ formatSigned(-maxGap) }}</span>
      </div>
      <div class="area">
        <span class="gridline zero"></span>
        <div
          v-for="column in columns"
          :key="column.pointNumber"
          class="column"
          :title="`${fr.reports.point(column.pointNumber)} : ${column.us} – ${column.them}`"
        >
          <div class="half up">
            <span v-if="column.gap > 0" class="bar us" :style="{ height: column.height }">
              <span v-if="column.showLabel" class="value">{{ formatSigned(column.gap) }}</span>
            </span>
          </div>
          <div class="half down">
            <span v-if="column.gap < 0" class="bar them" :style="{ height: column.height }">
              <span v-if="column.showLabel" class="value">{{ formatSigned(column.gap) }}</span>
            </span>
          </div>
          <span v-if="column.gap === 0" class="tie">
            <span v-if="column.showLabel" class="value">0</span>
          </span>
          <span class="x-label" aria-hidden="true">{{
            column.showX ? column.pointNumber : ''
          }}</span>
        </div>
      </div>
    </div>
    <figcaption class="chart-legend">
      <span><i class="swatch us"></i>{{ fr.reports.teamLeads(ourName) }}</span>
      <span><i class="swatch them"></i>{{ fr.reports.teamLeads(theirName) }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}

.plot {
  /* Place réservée aux étiquettes de valeur au-dessus et au-dessous des colonnes. */
  --label-room: 16px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  height: 200px;
  padding-bottom: 20px;
}

.axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--ink-muted);
  text-align: right;
  margin: -0.5em 0;
  padding: var(--label-room) 0;
}

.area {
  position: relative;
  display: flex;
  gap: 2px;
  padding: var(--label-room) 0;
  /* Quadrillage haut et bas, fin et discret. */
  --line: linear-gradient(var(--grid), var(--grid));
  background:
    var(--line) left top var(--label-room) / 100% 1px no-repeat,
    var(--line) left bottom var(--label-room) / 100% 1px no-repeat;
}

.gridline.zero {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--ink-muted);
}

.column {
  position: relative;
  flex: 1;
  min-width: 3px;
  display: grid;
  grid-template-rows: 1fr 1fr;
}

.half {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.half.up {
  align-items: flex-end;
}

.bar {
  position: relative;
  width: 100%;
  max-width: 24px;
}

.bar.us {
  background: var(--c-us);
  border-radius: 4px 4px 0 0;
}

.bar.them {
  background: var(--c-them);
  border-radius: 0 0 4px 4px;
}

.tie {
  position: absolute;
  top: calc(50% - 1px);
  left: 25%;
  right: 25%;
  height: 3px;
  background: var(--neutral);
}

.value {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}

.bar.us .value,
.tie .value {
  bottom: 100%;
}

.bar.them .value {
  top: 100%;
}

.x-label {
  position: absolute;
  top: calc(100% + var(--label-room));
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.7rem;
  color: var(--ink-muted);
  padding-top: 4px;
}
</style>
