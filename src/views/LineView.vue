<script setup lang="ts">
// Sélection de la ligne avant chaque point. Si un point est en cours, la saisie du point s'affiche.
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PlayerChipGrid from '@/components/field/PlayerChipGrid.vue'
import ScoreBoard from '@/components/ui/ScoreBoard.vue'
import {
  defaultAttackRight,
  expectedPuller,
  lineCandidates,
  lineSize,
  pointsPlayedInMatch,
} from '@/domain/lineup'
import { matchScore } from '@/domain/score'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useLiveMatchStore } from '@/stores/liveMatchStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const live = useLiveMatchStore()
const ui = useUiStore()

live.open(String(route.params.id))
const match = computed(() => live.match)

watchEffect(() => {
  if (live.point) router.replace({ name: 'point', params: { id: route.params.id } })
})

const selected = ref<string[]>([])
const showAll = ref(false)
const attackRight = ref(match.value ? defaultAttackRight(match.value) : true)

const score = computed(() => (match.value ? matchScore(match.value) : { us: 0, them: 0 }))
const size = computed(() => (match.value ? lineSize(match.value) : 7))
const previous = computed(() => match.value?.points.at(-1))
const expected = computed(() => (match.value ? expectedPuller(match.value) : null))
const candidates = computed(() => {
  if (!match.value) return []
  const team = dataStore.findTeam(match.value.equipeId)
  const proposed = lineCandidates(match.value, team, dataStore.players, showAll.value)
  const extra = dataStore.players.filter(
    (p) => selected.value.includes(p.id) && !proposed.includes(p),
  )
  return [...proposed, ...extra]
})
const subtitles = computed(() => {
  const counts = match.value ? pointsPlayedInMatch(match.value) : {}
  return Object.fromEntries(
    candidates.value.map((p) => [p.id, fr.line.pointsPlayed(counts[p.id] ?? 0)]),
  )
})
const startLabel = computed(() =>
  selected.value.length === size.value ? fr.line.start : fr.line.startWith(selected.value.length),
)

function toggle(id: string): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((other) => other !== id)
    : [...selected.value, id]
}

function start(): void {
  live.startPoint(selected.value, attackRight.value)
}

async function reopenLastPoint(): Promise<void> {
  const number = match.value?.points.length ?? 0
  const confirmed = await ui.confirm({
    title: fr.line.reopenConfirm(number),
    message: fr.line.reopenMessage,
    confirmLabel: fr.line.reopenAction,
  })
  if (confirmed) live.reopenLastPoint()
}

async function finish(): Promise<void> {
  if (!match.value) return
  const finalScore = `${match.value.equipeNom} ${score.value.us} – ${score.value.them} ${match.value.adversaire}`
  const confirmed = await ui.confirm({
    title: fr.line.finishConfirm,
    message: fr.line.finishMessage(finalScore),
    confirmLabel: fr.line.finish,
  })
  if (!confirmed) return
  dataStore.setMatchFinished(match.value.id, true)
  router.push({ name: 'match', params: { id: match.value.id } })
}
</script>

<template>
  <div v-if="match" class="page">
    <ScoreBoard
      :our-name="match.equipeNom"
      :their-name="match.adversaire"
      :us="score.us"
      :them="score.them"
    />
    <section class="card stack">
      <div class="section-title">
        <h2>{{ fr.line.pointTitle(match.points.length + 1) }}</h2>
        <span v-if="expected" class="badge" :class="expected === 'nous' ? 'defense' : 'attack'">
          {{ expected === 'nous' ? fr.line.expectDefense : fr.line.expectOffense }}
        </span>
      </div>
      <p v-if="candidates.length === 0" class="muted">{{ fr.line.noPlayers }}</p>
      <PlayerChipGrid
        :players="candidates"
        :selected="selected"
        :subtitles="subtitles"
        :label="fr.titles.line"
        grouped
        @toggle="toggle"
      />
      <p class="counter" aria-live="polite">
        <strong>{{ fr.line.counter(selected.length, size) }}</strong>
      </p>
      <div class="row">
        <button v-if="previous" type="button" class="btn" @click="selected = [...previous.ligne]">
          {{ fr.line.sameLine(match.points.length) }}
        </button>
        <button type="button" class="btn" @click="selected = []">{{ fr.line.clear }}</button>
        <button type="button" class="btn" :aria-pressed="showAll" @click="showAll = !showAll">
          {{ showAll ? fr.line.hideAll : fr.line.showAll }}
        </button>
      </div>
      <div class="row direction">
        <span
          >{{ fr.line.direction }} :
          <strong>{{ attackRight ? fr.line.right : fr.line.left }}</strong></span
        >
        <button type="button" class="btn" @click="attackRight = !attackRight">
          {{ fr.line.swap }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-primary btn-big"
        :disabled="selected.length === 0"
        @click="start"
      >
        {{ startLabel }}
      </button>
    </section>
    <div class="row">
      <button v-if="previous?.resultat" type="button" class="btn" @click="reopenLastPoint">
        {{ fr.line.reopen(match.points.length) }}
      </button>
      <RouterLink class="btn" :to="{ name: 'match', params: { id: match.id } }">{{
        fr.line.matchStats
      }}</RouterLink>
      <button type="button" class="btn btn-danger" @click="finish">{{ fr.line.finish }}</button>
    </div>
  </div>
  <div v-else class="page">
    <p>{{ fr.match.notFound }}</p>
  </div>
</template>

<style scoped>
.badge.attack {
  background: var(--phase-attack);
  border-color: var(--phase-attack);
  color: #fff;
}

.badge.defense {
  background: var(--phase-defense);
  border-color: var(--phase-defense);
  color: #fff;
}

.counter {
  margin: 0;
  font-size: 1.2rem;
}

.direction {
  justify-content: space-between;
}
</style>
