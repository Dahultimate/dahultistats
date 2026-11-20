<script setup lang="ts">
// Rapport individuel : tableau récapitulatif, passes par joueur, carte des passes de chaque joueur.
import { computed } from 'vue'

import PassesByPlayer from '@/components/charts/PassesByPlayer.vue'
import HeatmapField from '@/components/field/HeatmapField.vue'
import { describeFailedPasses, playerLabel } from '@/domain/eventText'
import { passersByAttempts, TOP_PAIRS } from '@/domain/reports'
import type { PairAffinity } from '@/domain/stats/affinities'
import type { PlayerStats } from '@/domain/stats/computeStats'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import AffinityTable from './AffinityTable.vue'
import PlayersTable from './PlayersTable.vue'
import ReportSection from './ReportSection.vue'

const props = defineProps<{
  players: PlayerStats[]
  affinities: PairAffinity[]
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()

const passers = computed(() =>
  passersByAttempts(props.players).map((stats) => ({
    id: stats.playerId,
    label: playerLabel(props.findPlayer(stats.playerId)),
    completed: stats.completedPasses,
    attempted: stats.attemptedPasses,
    missedDetail: describeFailedPasses(stats.failedPassesByCause),
    throws: stats.spots.throws,
  })),
)
</script>

<template>
  <div class="report">
    <ReportSection :title="fr.reports.summaryTable">
      <PlayersTable :rows="players" :find-player="findPlayer" :mode="mode" />
    </ReportSection>
    <ReportSection :title="fr.affinity.title">
      <p class="small muted">{{ fr.affinity.topHint(TOP_PAIRS) }}</p>
      <AffinityTable :rows="affinities" :find-player="findPlayer" :mode="mode" />
    </ReportSection>
    <ReportSection :title="fr.reports.passesByPlayer">
      <PassesByPlayer :rows="passers" />
    </ReportSection>
    <ReportSection :title="fr.reports.passMaps">
      <p v-if="passers.length === 0" class="muted">{{ fr.reports.noValue }}</p>
      <div class="maps">
        <figure v-for="passer in passers" :key="passer.id" class="map">
          <figcaption>
            <strong>{{ passer.label }}</strong>
            <span class="small">{{
              fr.reports.passMapDetail(passer.completed, passer.attempted - passer.completed)
            }}</span>
            <span v-if="passer.missedDetail" class="small muted">{{ passer.missedDetail }}</span>
          </figcaption>
          <HeatmapField
            :positions="passer.throws"
            :label="`${fr.reports.passMaps} : ${passer.label}`"
            size="mini"
          />
        </figure>
      </div>
    </ReportSection>
  </div>
</template>

<style scoped>
.report {
  display: grid;
  gap: var(--space-4);
}

.maps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-4) var(--space-3);
}

.map {
  margin: 0;
  display: grid;
  gap: var(--space-1);
  align-content: start;
}

.map figcaption {
  display: grid;
}
</style>
