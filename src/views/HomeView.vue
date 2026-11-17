<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import ScoreBoard from '@/components/ui/ScoreBoard.vue'
import ThemePicker from '@/components/ui/ThemePicker.vue'
import { sortMatchesByDate } from '@/domain/filters'
import { formatLongDate } from '@/domain/format'
import { matchScore } from '@/domain/score'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

const router = useRouter()
const dataStore = useDataStore()
const ui = useUiStore()

const liveMatch = computed(() =>
  sortMatchesByDate(dataStore.matches).find((match) => !match.termine),
)
const liveScore = computed(() => (liveMatch.value ? matchScore(liveMatch.value) : null))

const tiles = computed(() => [
  {
    name: 'roster',
    title: fr.home.roster,
    detail: fr.home.rosterCount(dataStore.activePlayers.length),
  },
  { name: 'stats', title: fr.home.stats, detail: fr.home.statsHint },
  {
    name: 'history',
    title: fr.home.history,
    detail: fr.home.historyCount(dataStore.matches.length),
  },
  { name: 'teams', title: fr.home.teams, detail: fr.home.teamsCount(dataStore.teams.length) },
])

async function openOtherFile(): Promise<void> {
  if (dataStore.dirty) {
    const confirmed = await ui.confirm({
      title: fr.home.openOtherConfirm,
      message: fr.home.openOtherMessage,
      confirmLabel: fr.home.openOther,
      danger: true,
    })
    if (!confirmed) return
  }
  dataStore.unload()
  router.push({ name: 'open' })
}
</script>

<template>
  <div class="page">
    <p v-if="dataStore.isSample" class="banner-sample" role="note">{{ fr.home.sampleBanner }}</p>

    <section v-if="liveMatch && liveScore" class="card stack" aria-labelledby="live-title">
      <h2 id="live-title">{{ fr.home.liveMatch }}</h2>
      <p class="muted">{{ formatLongDate(liveMatch.date) }} · {{ liveMatch.evenement }}</p>
      <ScoreBoard
        :our-name="liveMatch.equipeNom"
        :their-name="liveMatch.adversaire"
        :us="liveScore.us"
        :them="liveScore.them"
      />
      <RouterLink
        class="btn btn-primary btn-big"
        :to="{ name: 'line', params: { id: liveMatch.id } }"
      >
        {{ fr.home.resume }}
      </RouterLink>
    </section>

    <nav class="menu" :aria-label="fr.titles.home">
      <RouterLink class="menu-tile primary" :to="{ name: 'new-match' }">
        <strong>{{ fr.home.newMatch }}</strong>
      </RouterLink>
      <RouterLink
        v-for="tile in tiles"
        :key="tile.name"
        class="menu-tile"
        :to="{ name: tile.name }"
      >
        <strong>{{ tile.title }}</strong>
        <span class="muted">{{ tile.detail }}</span>
      </RouterLink>
    </nav>

    <section class="card stack" aria-labelledby="file-title">
      <div class="section-title">
        <h2 id="file-title">{{ fr.home.dataFile }}</h2>
        <span class="badge" :class="dataStore.dirty ? 'badge-warning' : 'badge-success'">
          {{ dataStore.dirty ? fr.header.notExported : fr.header.upToDate }}
        </span>
      </div>
      <p class="muted">{{ fr.home.dataReminder }}</p>
      <div class="row">
        <button type="button" class="btn btn-primary" @click="dataStore.exportData">
          {{ fr.home.exportJson }}
        </button>
        <button type="button" class="btn" @click="openOtherFile">{{ fr.home.openOther }}</button>
      </div>
    </section>

    <ThemePicker />
  </div>
</template>

<style scoped>
.menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.menu-tile {
  display: grid;
  gap: var(--space-1);
  align-content: center;
  min-height: 96px;
  padding: var(--space-3);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
}

.menu-tile strong {
  font-family: var(--font-title);
  font-size: 1.35rem;
}

.menu-tile.primary {
  grid-column: 1 / -1;
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-ink);
  text-align: center;
}

.menu-tile.primary strong {
  font-size: 1.8rem;
}
</style>
