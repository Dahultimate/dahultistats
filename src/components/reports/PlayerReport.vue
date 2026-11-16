<script setup lang="ts">
// Statistiques individuelles d'un joueur (fiche joueur), avec les filtres déjà appliqués.
import { computed } from 'vue'

import CauseBars from '@/components/charts/CauseBars.vue'
import HeatmapPicker from '@/components/field/HeatmapPicker.vue'
import KpiTile from '@/components/ui/KpiTile.vue'
import { DEFENSIVE_FAULT_LABELS, TURN_CAUSE_LABELS } from '@/domain/constants'
import { formatPercent, formatSigned } from '@/domain/format'
import { causeItems } from '@/domain/reports'
import type { PlayerStats } from '@/domain/stats/computeStats'
import { fr } from '@/i18n/fr'

import ReportSection from './ReportSection.vue'

const props = defineProps<{ stats: PlayerStats; mode: 'screen' | 'print' }>()
const heatmapKey = defineModel<string>('heatmapKey', { required: true })

const r = fr.reports
const tiles = computed(() => {
  const s = props.stats
  return [
    { label: r.matches, value: String(s.matchesPlayed) },
    {
      label: r.pointsPlayed,
      value: String(s.pointsPlayed),
      detail: r.pointsSplit(s.offensePoints, s.defensePoints),
    },
    {
      label: r.differential,
      value: formatSigned(s.differential),
      detail: r.wonLost(s.pointsWon, s.pointsLost),
    },
    { label: r.plusMinus, value: formatSigned(s.plusMinus) },
    { label: r.goals, value: String(s.goals), detail: r.callahansDetail(s.callahans) },
    { label: r.assists, value: String(s.assists) },
    {
      label: r.passRate,
      value: formatPercent(s.completedPasses, s.attemptedPasses),
      detail: r.passRateDetail(s.completedPasses, s.attemptedPasses),
    },
    { label: r.receptions, value: String(s.receptions) },
    { label: r.turns, value: String(s.turns) },
    { label: r.blocks, value: String(s.blocks), detail: r.blocksDetail(s.recoveries) },
    { label: r.defensiveFaults, value: String(s.defensiveFaults) },
    { label: r.pulls, value: String(s.pulls), detail: r.pullsDetail(s.bricks) },
  ]
})

const heatmaps = computed(() => {
  const spots = props.stats.spots
  return [
    { key: 'receptions', label: fr.heatmap.receptions, positions: spots.receptions },
    { key: 'throws', label: fr.heatmap.throws, positions: spots.throws },
    { key: 'goals', label: fr.heatmap.goals, positions: spots.goals },
    { key: 'turns', label: fr.heatmap.turns, positions: spots.turns, ramp: 'orange' as const },
    { key: 'recoveries', label: fr.heatmap.recoveries, positions: spots.recoveries },
  ]
})
</script>

<template>
  <div class="report">
    <ReportSection>
      <div class="tiles">
        <KpiTile v-for="tile in tiles" :key="tile.label" v-bind="tile" />
      </div>
    </ReportSection>
    <ReportSection>
      <div class="bars-grid">
        <CauseBars
          :title="r.playerTurnsByCause"
          :items="causeItems(stats.turnsByCause, TURN_CAUSE_LABELS)"
          color="miss"
        />
        <CauseBars
          :title="r.faultsByType"
          :items="causeItems(stats.defensiveFaultsByCause, DEFENSIVE_FAULT_LABELS)"
          color="them"
        />
      </div>
    </ReportSection>
    <ReportSection :title="mode === 'screen' ? r.fieldMap : undefined">
      <HeatmapPicker v-model="heatmapKey" :options="heatmaps" :mode="mode" />
    </ReportSection>
  </div>
</template>

<style scoped>
.report {
  display: grid;
  gap: var(--space-4);
}

.bars-grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
</style>
