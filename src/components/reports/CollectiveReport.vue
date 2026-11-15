<script setup lang="ts">
// Rapport collectif d'un match : neuf blocs, dans l'ordre de la spécification.
import { computed } from 'vue'

import CauseBars from '@/components/charts/CauseBars.vue'
import PassShareBar from '@/components/charts/PassShareBar.vue'
import RunsStrip from '@/components/charts/RunsStrip.vue'
import ScoreGapChart from '@/components/charts/ScoreGapChart.vue'
import TeamDuel from '@/components/charts/TeamDuel.vue'
import HeatmapField from '@/components/field/HeatmapField.vue'
import { CONCEDED_LABELS, RECOVERY_LABELS, TURN_CAUSE_LABELS } from '@/domain/constants'
import { causeItems, type MatchReport } from '@/domain/reports'
import type { Match, Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import EssentialsTiles from './EssentialsTiles.vue'
import LeaderCards from './LeaderCards.vue'
import ReportSection from './ReportSection.vue'

const props = defineProps<{
  match: Match
  report: MatchReport
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()

const team = computed(() => props.report.stats.team)
const ourName = computed(() => props.match.equipeNom)
const theirName = computed(() => props.match.adversaire)
</script>

<template>
  <div class="report">
    <EssentialsTiles :essentials="report.essentials" />
    <LeaderCards :leaders="report.leaders" :find-player="findPlayer" :mode="mode" />
    <ReportSection :title="fr.reports.scoreGap">
      <ScoreGapChart :steps="report.progression" :our-name="ourName" :their-name="theirName" />
    </ReportSection>
    <ReportSection :title="fr.reports.runs">
      <RunsStrip
        :steps="report.progression"
        :runs="report.runs"
        :our-name="ourName"
        :their-name="theirName"
      />
    </ReportSection>
    <ReportSection :title="fr.reports.duel">
      <TeamDuel :rows="report.duel" :our-name="ourName" :their-name="theirName" />
    </ReportSection>
    <ReportSection :title="fr.reports.passShare">
      <PassShareBar
        :ours="team.completedPasses"
        :theirs="team.opponentPasses"
        :our-name="ourName"
        :their-name="theirName"
      />
    </ReportSection>
    <ReportSection :title="fr.reports.passMap">
      <HeatmapField :counts="team.receptionsByZone" :label="fr.reports.passMap" />
    </ReportSection>
    <ReportSection :title="fr.reports.goalZones">
      <div class="pair">
        <div class="stack">
          <h4>{{ fr.reports.ourGoals }}</h4>
          <HeatmapField :counts="team.goalsByZone" :label="fr.reports.ourGoals" size="compact" />
          <span class="small muted">{{ fr.reports.withoutZone(team.goalsWithoutZone) }}</span>
        </div>
        <div class="stack">
          <h4>{{ fr.reports.theirGoals }}</h4>
          <HeatmapField
            :counts="team.concededByZone"
            :label="fr.reports.theirGoals"
            ramp="orange"
            size="compact"
          />
          <span class="small muted">{{ fr.reports.withoutZone(team.concededWithoutZone) }}</span>
        </div>
      </div>
    </ReportSection>
    <ReportSection>
      <div class="bars-grid">
        <CauseBars
          :title="fr.reports.turnsByCause"
          :items="causeItems(team.turnsByCause, TURN_CAUSE_LABELS)"
          color="miss"
        />
        <CauseBars
          :title="fr.reports.recoveriesByType"
          :items="causeItems(team.recoveriesByCause, RECOVERY_LABELS)"
        />
        <CauseBars
          :title="fr.reports.concededByCause"
          :items="causeItems(team.concededByCause, CONCEDED_LABELS)"
          color="them"
        >
          <span class="small muted">{{
            fr.reports.breaksWithoutGoal(team.breaksWithoutGoal)
          }}</span>
        </CauseBars>
      </div>
    </ReportSection>
  </div>
</template>

<style scoped>
.report {
  display: grid;
  gap: var(--space-4);
}

.pair {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
}

h4 {
  margin: 0;
}

.bars-grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
</style>
