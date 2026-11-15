<script setup lang="ts">
// Déroulé point par point : un élément dépliable par point (tous dépliés à l'export).
import { computed } from 'vue'

import { describeEvent, playerLabel } from '@/domain/eventText'
import { pointSummaries } from '@/domain/reports'
import type { Match, Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

const props = defineProps<{
  match: Match
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()

const points = computed(() =>
  pointSummaries(props.match).map((summary, index) => {
    const point = props.match.points[index]!
    return {
      ...summary,
      line: point.ligne.map((id) => playerLabel(props.findPlayer(id))).join(', '),
      log: point.evenements.map((event) => describeEvent(event, props.findPlayer)),
    }
  }),
)
</script>

<template>
  <div class="points">
    <component
      :is="mode === 'screen' ? 'details' : 'section'"
      v-for="point in points"
      :key="point.number"
      class="card point print-block"
    >
      <component :is="mode === 'screen' ? 'summary' : 'div'" class="point-summary">
        <strong>{{ fr.reports.point(point.number) }}</strong>
        <span v-if="point.kind" class="badge">
          {{ point.kind === 'O' ? fr.reports.offense : fr.reports.defense }}
        </span>
        <span v-if="point.winner" class="badge" :class="point.winner === 'nous' ? 'won' : 'lost'">
          {{ fr.reports.pointFor(point.winner === 'nous' ? match.equipeNom : match.adversaire) }}
        </span>
        <span v-else class="badge">{{ fr.match.inProgress }}</span>
        <span class="small muted">{{ fr.reports.pointSummary(point.passes, point.turns) }}</span>
        <strong class="score">{{ point.us }} – {{ point.them }}</strong>
      </component>
      <div class="point-body">
        <p class="small">
          <strong>{{ fr.reports.line }} :</strong> {{ point.line }}
        </p>
        <ol class="log small">
          <li v-for="(text, index) in point.log" :key="index">{{ text }}</li>
        </ol>
      </div>
    </component>
  </div>
</template>

<style scoped>
.points {
  display: grid;
  gap: var(--space-2);
}

.point {
  padding: var(--space-2) var(--space-3);
}

.point-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--touch);
  cursor: pointer;
}

.score {
  margin-left: auto;
  font-family: var(--font-title);
  font-size: 1.2rem;
}

.badge.won {
  background: var(--success);
  border-color: var(--success);
  color: #fff;
}

.badge.lost {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

.point-body {
  padding-top: var(--space-2);
}

.log {
  margin: 0;
  padding-left: 1.5em;
}
</style>
