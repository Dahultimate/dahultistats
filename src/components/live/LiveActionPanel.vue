<script setup lang="ts">
// Panneau d'actions de la saisie : son contenu dépend de la sous-étape du point.
import { computed } from 'vue'

import PlayerChipGrid from '@/components/field/PlayerChipGrid.vue'
import { isConcededCause, TURN_CAUSE_LABELS, TURN_CAUSES } from '@/domain/constants'
import type { Player, Side } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useLiveMatchStore } from '@/stores/liveMatchStore'

import DefenseChoices from './DefenseChoices.vue'

const props = defineProps<{
  linePlayers: Player[]
  ourName: string
  theirName: string
  expectedPuller: Side | null
}>()

const live = useLiveMatchStore()

const chipSelection = computed(() => {
  if (live.step === 'turnDetails' || live.step === 'defenseDetails') return live.draft.players
  return live.draft.player ? [live.draft.player] : []
})
const showChips = computed(() =>
  ['pullUs', 'pickup', 'pass', 'turnDetails', 'defenseDetails'].includes(live.step),
)
const disabledIds = computed(() =>
  live.step === 'pass' && live.state?.carrier ? [live.state.carrier] : [],
)

const validateLabel = computed(() => {
  const cause = live.draft.defCause
  if (live.draft.players.length > 0) return fr.live.validateNoZone
  if (cause && (cause === 'break_sans_but' || isConcededCause(cause)))
    return fr.live.validateNoFault
  return fr.live.validateNoPlayer
})

const pullChoices = computed(() => [
  { side: 'nous' as const, name: props.ourName, hint: fr.live.wePull },
  { side: 'eux' as const, name: props.theirName, hint: fr.live.theyPull },
])
</script>

<template>
  <div class="panel">
    <div v-if="live.step === 'chooseTeam'" class="pull-choice">
      <button
        v-for="choice in pullChoices"
        :key="choice.side"
        type="button"
        class="btn btn-big pull-button"
        @click="live.choosePullTeam(choice.side)"
      >
        <strong>{{ choice.name }}</strong>
        <span>{{ choice.hint }}</span>
        <span v-if="expectedPuller === choice.side" class="badge badge-warning">{{
          fr.live.expected
        }}</span>
      </button>
    </div>

    <PlayerChipGrid
      v-if="showChips"
      :players="linePlayers"
      :selected="chipSelection"
      :disabled-ids="disabledIds"
      :label="fr.live.players"
      @toggle="live.selectPlayer"
    />

    <button
      v-if="live.step === 'pullUs' || live.step === 'pullThem'"
      type="button"
      class="btn btn-big"
      @click="live.selectZone('brick')"
    >
      {{ fr.live.brick }}
    </button>

    <button
      v-if="live.step === 'pass'"
      type="button"
      class="btn btn-big btn-danger turn"
      @click="live.startTurn"
    >
      {{ fr.live.turn }}
    </button>

    <div v-if="live.step === 'turnCause'" class="causes">
      <button
        v-for="cause in TURN_CAUSES"
        :key="cause"
        type="button"
        class="btn btn-big"
        @click="live.chooseTurnCause(cause)"
      >
        {{ TURN_CAUSE_LABELS[cause] }}
      </button>
    </div>

    <DefenseChoices
      v-if="live.step === 'defenseChoice'"
      :opponent-passes="live.opponentPassesThisPoint"
      @choose="live.chooseDefCause"
      @opponent-pass="live.recordOpponentPass"
    />

    <button
      v-if="live.step === 'defenseDetails'"
      type="button"
      class="btn btn-big btn-primary"
      @click="live.validateDefenseWithoutZone"
    >
      {{ validateLabel }}
    </button>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--space-3);
  align-content: start;
}

.pull-choice {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.pull-button {
  min-height: 96px;
  flex-direction: column;
  gap: 2px;
}

.pull-button strong {
  font-family: var(--font-title);
  font-size: 1.3rem;
}

.turn {
  font-size: 1.3rem;
  letter-spacing: 0.08em;
}

.causes {
  display: grid;
  gap: var(--space-2);
}
</style>
