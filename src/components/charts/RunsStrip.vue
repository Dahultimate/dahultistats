<script setup lang="ts">
// Bande de points consécutifs : un carré par point, rangée du haut pour nous, du bas pour l'adversaire
// (la position porte l'information autant que la couleur).
import { computed } from 'vue'

import type { Run, ScoreStep } from '@/domain/score'
import type { Side } from '@/domain/types'
import { fr } from '@/i18n/fr'

const props = defineProps<{
  steps: ScoreStep[]
  runs: Record<Side, Run | null>
  ourName: string
  theirName: string
}>()

const description = computed(() =>
  props.steps.map((step) => (step.winner === 'nous' ? props.ourName : props.theirName)).join(', '),
)

function runText(side: Side): string {
  const name = side === 'nous' ? props.ourName : props.theirName
  const run = props.runs[side]
  if (!run) return fr.reports.noRun(name)
  const score = (value: { us: number; them: number }) => `${value.us}–${value.them}`
  return fr.reports.runText(name, run.length, score(run.before), score(run.after))
}
</script>

<template>
  <figure class="runs">
    <div class="strip" role="img" :aria-label="description">
      <span
        v-for="step in steps"
        :key="step.pointNumber"
        class="square"
        :class="step.winner === 'nous' ? 'us' : 'them'"
        :title="`${fr.reports.point(step.pointNumber)} : ${step.winner === 'nous' ? ourName : theirName} (${step.us} – ${step.them})`"
      ></span>
    </div>
    <figcaption class="stack small">
      <span><i class="swatch us"></i>{{ runText('nous') }}</span>
      <span><i class="swatch them"></i>{{ runText('eux') }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.runs {
  margin: 0;
  display: grid;
  gap: var(--space-2);
}

.strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(6px, 16px);
  grid-template-rows: 16px 16px;
  gap: 2px;
  overflow-x: auto;
}

.square {
  border-radius: 3px;
}

.square.us {
  grid-row: 1;
  background: var(--c-us);
}

.square.them {
  grid-row: 2;
  background: var(--c-them);
}
</style>
