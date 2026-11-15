<script setup lang="ts">
// Saisie du point : bandeau de phase, consigne, terrain, panneau d'actions, outils et journal.
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LiveField from '@/components/field/LiveField.vue'
import ActionLog from '@/components/live/ActionLog.vue'
import LiveActionPanel from '@/components/live/LiveActionPanel.vue'
import ScoreBoard from '@/components/ui/ScoreBoard.vue'
import { playerLabel } from '@/domain/eventText'
import { expectedPuller } from '@/domain/lineup'
import { matchScore } from '@/domain/score'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { type LiveStep, useLiveMatchStore } from '@/stores/liveMatchStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const live = useLiveMatchStore()
const ui = useUiStore()

live.open(String(route.params.id))
let leaving = false

// Fin du point (ou point annulé) : retour à la sélection de la ligne, avec le score en toast.
watchEffect(() => {
  if (live.point || leaving || !live.match) return
  leaving = true
  const ended = live.pointEnded
  if (ended) {
    const score = `${ended.score.us} – ${ended.score.them}`
    ui.toast(
      ended.winner === 'nous'
        ? fr.live.goalUs(live.match.equipeNom, score)
        : fr.live.goalThem(live.match.adversaire, score),
    )
    live.pointEnded = null
  }
  router.replace({ name: 'line', params: { id: route.params.id } })
})

const score = computed(() => (live.match ? matchScore(live.match) : { us: 0, them: 0 }))
const linePlayers = computed(() =>
  (live.point?.ligne ?? [])
    .map(dataStore.findPlayer)
    .filter((player): player is Player => !!player),
)
const carrier = computed(() =>
  live.state?.carrier ? dataStore.findPlayer(live.state.carrier) : undefined,
)
const phase = computed(() => live.state?.phase ?? 'engagement')

const banner = computed(() => {
  if (phase.value === 'engagement')
    return { text: fr.live.phaseEngagement(live.pointNumber), tone: 'neutral' }
  if (phase.value === 'reprise') return { text: fr.live.phaseAttackPickup, tone: 'attack' }
  if (phase.value === 'attaque')
    return { text: fr.live.phaseAttackCarrier(playerLabel(carrier.value)), tone: 'attack' }
  return { text: fr.live.phaseDefense, tone: 'defense' }
})

const INSTRUCTIONS: Record<Exclude<LiveStep, 'none'>, [string, string]> = {
  chooseTeam: [fr.live.whoPulls, ''],
  pullUs: [fr.live.pullUs, fr.live.pullUsHelp],
  pullThem: [fr.live.pullThem, fr.live.pullThemHelp],
  pickup: [fr.live.pickup, fr.live.pickupHelp],
  pass: [fr.live.pass, fr.live.passHelp],
  turnCause: [fr.live.turnCause, fr.live.turnCauseHelp],
  turnDetails: [fr.live.turnDetails, fr.live.turnDetailsHelp],
  defenseChoice: [fr.live.defenseChoice, fr.live.defenseChoiceHelp],
  defenseDetails: [fr.live.defenseDetails, fr.live.defenseDetailsHelp],
}
const instruction = computed(() => {
  if (live.goalPending) return [fr.live.goal(live.match?.equipeNom ?? ''), fr.live.goalHelp]
  return live.step === 'none' ? ['', ''] : INSTRUCTIONS[live.step]
})
const canGoBack = computed(() => {
  const d = live.draft
  return (
    d.pullTeam !== null ||
    d.turnMode ||
    d.defCause !== null ||
    d.zone !== null ||
    (live.step === 'pass' && d.player !== null)
  )
})

async function undo(): Promise<void> {
  const text = live.undoLastEvent()
  if (text) {
    ui.toast(fr.live.undone(text))
    return
  }
  const confirmed = await ui.confirm({
    title: fr.live.cancelPointConfirm,
    message: fr.live.cancelPointMessage,
    confirmLabel: fr.live.cancelPoint,
    danger: true,
  })
  if (confirmed) live.cancelPoint()
}
</script>

<template>
  <div v-if="live.match && live.point" class="page live">
    <ScoreBoard
      :our-name="live.match.equipeNom"
      :their-name="live.match.adversaire"
      :us="score.us"
      :them="score.them"
    />
    <p class="phase" :class="banner.tone" role="status">{{ banner.text }}</p>
    <div class="instruction">
      <p class="lead">{{ instruction[0] }}</p>
      <p v-if="instruction[1]" class="small muted">{{ instruction[1] }}</p>
    </div>
    <div class="workspace">
      <LiveField
        :attack-right="live.point.attaqueDroite"
        :our-name="live.match.equipeNom"
        :their-name="live.match.adversaire"
        :selected-zone="live.selectedZone"
        :carrier-zone="phase === 'attaque' ? (live.state?.carrierZone ?? null) : null"
        :carrier-number="carrier?.numero ?? null"
        :disabled="!live.zoneExpected"
        :attacking="phase === 'attaque' || phase === 'reprise'"
        @select="live.selectZone"
      />
      <LiveActionPanel
        :line-players="linePlayers"
        :our-name="live.match.equipeNom"
        :their-name="live.match.adversaire"
        :expected-puller="expectedPuller(live.match)"
      />
    </div>
    <div class="row tools">
      <button v-if="canGoBack" type="button" class="btn" @click="live.back">
        {{ fr.live.back }}
      </button>
      <button type="button" class="btn" @click="undo">{{ fr.live.undo }}</button>
      <button type="button" class="btn" @click="live.toggleDirection">{{ fr.live.swap }}</button>
    </div>
    <ActionLog :events="live.point.evenements" :find-player="dataStore.findPlayer" />
  </div>
</template>

<style scoped>
.phase {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  color: #fff;
  font: 700 1.2rem var(--font-title);
  letter-spacing: 0.02em;
}

.phase.neutral {
  background: var(--phase-neutral);
}

.phase.attack {
  background: var(--phase-attack);
}

.phase.defense {
  background: var(--phase-defense);
}

/* Hauteur fixe : le terrain ne bouge pas sous le doigt quand la consigne change. */
.instruction {
  min-height: 4.6em;
}

.instruction p {
  margin: 0;
}

.lead {
  font-weight: 700;
  font-size: 1.15rem;
}

.workspace {
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 860px) {
  .workspace {
    grid-template-columns: 3fr 2fr;
    align-items: start;
  }
}
</style>
