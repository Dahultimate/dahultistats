<script setup lang="ts">
// Statistiques globales (après les filtres) : tuiles, barres, carte du terrain, tableau des joueurs.
import { computed } from 'vue'

import CauseBars from '@/components/charts/CauseBars.vue'
import HeatmapPicker from '@/components/field/HeatmapPicker.vue'
import KpiTile from '@/components/ui/KpiTile.vue'
import { CONCEDED_LABELS, RECOVERY_LABELS, TURN_CAUSE_LABELS } from '@/domain/constants'
import { formatNumber, formatPercent } from '@/domain/format'
import { causeItems, type GlobalReport } from '@/domain/reports'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import PlayersTable from './PlayersTable.vue'
import ReportSection from './ReportSection.vue'

const props = defineProps<{
  report: GlobalReport
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()
const heatmapKey = defineModel<string>('heatmapKey', { required: true })

const r = fr.reports
const team = computed(() => props.report.stats.team)

const tiles = computed(() => {
  const t = team.value
  const turnsPerPoint = t.pointsPlayed ? formatNumber(t.turns / t.pointsPlayed) : '—'
  return [
    { label: r.record, value: `${t.wins}-${t.losses}-${t.draws}` },
    { label: r.pointsScoredConceded, value: `${t.pointsScored} – ${t.pointsConceded}` },
    {
      label: r.hold,
      value: formatPercent(t.offensePointsWon, t.offensePoints),
      detail: `${t.offensePointsWon} / ${t.offensePoints}`,
    },
    {
      label: r.break,
      value: formatPercent(t.defensePointsWon, t.defensePoints),
      detail: `${t.defensePointsWon} / ${t.defensePoints}`,
    },
    {
      label: r.completedPasses,
      value: formatPercent(t.completedPasses, t.attemptedPasses),
      detail: `${t.completedPasses} / ${t.attemptedPasses}`,
    },
    { label: r.turns, value: String(t.turns), detail: r.turnsPerPoint(turnsPerPoint) },
    {
      label: r.recoveries,
      value: String(t.recoveries),
      detail: r.recoveriesDetail(t.blocks, t.callahans),
    },
    {
      label: r.pulls,
      value: String(t.ourPulls),
      detail: r.brickShare(formatPercent(t.ourBricks, t.ourPulls)),
    },
  ]
})

const heatmaps = computed(() => {
  const t = team.value
  return [
    { key: 'receptions', label: fr.heatmap.receptions, counts: t.receptionsByZone },
    { key: 'goals', label: fr.heatmap.goalsScored, counts: t.goalsByZone },
    { key: 'turns', label: fr.heatmap.ourTurns, counts: t.turnsByZone, ramp: 'orange' as const },
    { key: 'recoveries', label: fr.heatmap.recoveries, counts: t.recoveriesByZone },
    {
      key: 'conceded',
      label: fr.heatmap.conceded,
      counts: t.concededByZone,
      ramp: 'orange' as const,
    },
    { key: 'ourPulls', label: fr.heatmap.ourPulls, counts: t.ourPullZones },
    {
      key: 'theirPulls',
      label: fr.heatmap.theirPulls,
      counts: t.theirPullZones,
      ramp: 'orange' as const,
    },
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
          :title="r.turnsByCause"
          :items="causeItems(team.turnsByCause, TURN_CAUSE_LABELS)"
          color="miss"
        />
        <CauseBars
          :title="r.recoveriesByType"
          :items="causeItems(team.recoveriesByCause, RECOVERY_LABELS)"
        />
        <CauseBars
          :title="r.concededByCause"
          :items="causeItems(team.concededByCause, CONCEDED_LABELS)"
          color="them"
        />
      </div>
    </ReportSection>
    <ReportSection :title="mode === 'screen' ? r.fieldMap : undefined">
      <HeatmapPicker v-model="heatmapKey" :options="heatmaps" :mode="mode" />
    </ReportSection>
    <ReportSection :title="r.playersTable">
      <PlayersTable :rows="report.tablePlayers" :find-player="findPlayer" :mode="mode" />
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
