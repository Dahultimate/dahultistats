<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ExportButton from '@/components/export/ExportButton.vue'
import ExportDialog from '@/components/export/ExportDialog.vue'
import PlayerReport from '@/components/reports/PlayerReport.vue'
import FiltersPanel from '@/components/ui/FiltersPanel.vue'
import PlayerForm from '@/components/ui/PlayerForm.vue'
import { describeFilters } from '@/domain/export/describeFilters'
import { playerReportFileName } from '@/domain/export/fileName'
import { eventNames, filterMatches, matchesPlayedBy, sortMatchesByDate } from '@/domain/filters'
import { formatShortDate } from '@/domain/format'
import { buildPlayerStats } from '@/domain/reports'
import { computeAffinities, partnersOf } from '@/domain/stats/affinities'
import { fr } from '@/i18n/fr'
import { type PlayerInput, useDataStore } from '@/stores/dataStore'
import { useFiltersStore } from '@/stores/filtersStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const filtersStore = useFiltersStore()
const ui = useUiStore()

const editing = ref(false)
const exportOpen = ref(false)
const heatmapKey = ref('receptions')

const player = computed(() => dataStore.findPlayer(String(route.params.id)))
// Les filtres de la fiche repartent de zéro quand on change de joueur.
watch(
  () => String(route.params.id),
  (id) => filtersStore.forPlayer(id),
  { immediate: true },
)
const { player: filters } = storeToRefs(filtersStore)
const played = computed(() =>
  sortMatchesByDate(matchesPlayedBy(dataStore.matches, String(route.params.id))),
)
const selected = computed(() => filterMatches(played.value, filters.value))
const stats = computed(() => buildPlayerStats(selected.value, String(route.params.id)))
const partners = computed(() =>
  partnersOf(computeAffinities(selected.value), String(route.params.id)),
)
const matchOptions = computed(() =>
  played.value.map((match) => ({
    id: match.id,
    label: `${formatShortDate(match.date)} · ${match.equipeNom} – ${match.adversaire}`,
  })),
)
const fullName = computed(() =>
  player.value ? `#${player.value.numero} ${player.value.prenom} ${player.value.nom}` : '',
)

function save(input: PlayerInput): void {
  if (!player.value) return
  dataStore.updatePlayer(player.value.id, input)
  editing.value = false
  ui.toast(fr.player.saved)
}

async function remove(): Promise<void> {
  if (!player.value) return
  const hasPlayed = played.value.length > 0
  const confirmed = await ui.confirm({
    title: fr.player.retireConfirm(`${player.value.prenom} ${player.value.nom}`),
    message: hasPlayed ? fr.player.retireMessage : fr.player.deleteMessage,
    confirmLabel: fr.player.remove,
    danger: true,
  })
  if (!confirmed) return
  const outcome = dataStore.removePlayer(player.value.id)
  editing.value = false
  ui.toast(outcome === 'retired' ? fr.player.retired : fr.player.deleted)
  if (outcome === 'deleted') router.push({ name: 'roster' })
}

function restore(): void {
  if (!player.value) return
  dataStore.restorePlayer(player.value.id)
  editing.value = false
  ui.toast(fr.player.restored)
}

function describeExport() {
  const current = player.value!
  return {
    fileName: playerReportFileName(current, filters.value),
    title: fr.export.playerTitle(`${current.prenom} ${current.nom}`),
    lines: [
      `${fullName.value} · ${current.poste}`,
      describeFilters(filters.value, { teams: dataStore.teams, matches: dataStore.matches }),
    ],
  }
}
</script>

<template>
  <div v-if="!player" class="page">
    <p>{{ fr.player.notFound }}</p>
  </div>
  <div v-else class="page">
    <section class="card identity">
      <span class="big-number">{{ player.numero }}</span>
      <div class="stack who">
        <h2>{{ player.prenom }} {{ player.nom }}</h2>
        <div class="row">
          <span class="badge">{{ player.poste }}</span>
          <span v-if="!player.actif" class="badge badge-warning">{{ fr.player.formerPlayer }}</span>
        </div>
      </div>
      <button v-if="!editing" type="button" class="btn" @click="editing = true">
        {{ fr.common.edit }}
      </button>
    </section>

    <section v-if="editing" class="card stack">
      <PlayerForm
        :initial="player"
        :submit-label="fr.common.save"
        cancellable
        @submit="save"
        @cancel="editing = false"
      />
      <div class="row">
        <button v-if="player.actif" type="button" class="btn btn-danger" @click="remove">
          {{ fr.player.remove }}
        </button>
        <button v-else type="button" class="btn" @click="restore">{{ fr.player.restore }}</button>
      </div>
    </section>

    <FiltersPanel
      v-model:filters="filters"
      :count="selected.length"
      :events="eventNames(played)"
      :matches="matchOptions"
      @clear="filtersStore.clearPlayer"
    />
    <div class="row">
      <ExportButton @click="exportOpen = true" />
    </div>
    <PlayerReport
      v-model:heatmap-key="heatmapKey"
      :stats="stats"
      :partners="partners"
      :find-player="dataStore.findPlayer"
      mode="screen"
    />

    <ExportDialog v-model:open="exportOpen" default-content="joueur" :describe="describeExport">
      <template #print>
        <PlayerReport
          v-model:heatmap-key="heatmapKey"
          :stats="stats"
          :partners="partners"
          :find-player="dataStore.findPlayer"
          mode="print"
        />
      </template>
    </ExportDialog>
  </div>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.big-number {
  font: 700 3.5rem var(--font-title);
  line-height: 1;
}

.who {
  flex: 1;
  gap: var(--space-1);
}

.who h2 {
  margin: 0;
}
</style>
