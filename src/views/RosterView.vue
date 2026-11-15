<script setup lang="ts">
import { computed, ref } from 'vue'

import PlayerForm from '@/components/ui/PlayerForm.vue'
import { groupByPosition } from '@/domain/lineup'
import { fr } from '@/i18n/fr'
import { type PlayerInput, useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

const dataStore = useDataStore()
const ui = useUiStore()
const showFormer = ref(false)
const form = ref<InstanceType<typeof PlayerForm> | null>(null)

const formerCount = computed(() => dataStore.players.filter((player) => !player.actif).length)
const groups = computed(() => {
  const visible = dataStore.players.filter((player) => player.actif || showFormer.value)
  const byPosition = groupByPosition(visible)
  return [
    {
      key: 'Handler',
      title: fr.common.handlers(byPosition.Handler.length),
      players: byPosition.Handler,
    },
    {
      key: 'Middle',
      title: fr.common.middles(byPosition.Middle.length),
      players: byPosition.Middle,
    },
  ]
})

function addPlayer(input: PlayerInput): void {
  const duplicate = dataStore.activePlayers.find((player) => player.numero === input.numero)
  dataStore.addPlayer(input)
  const added = fr.roster.added(`${input.prenom} ${input.nom}`)
  const warning = duplicate
    ? fr.roster.duplicateNumber(`${duplicate.prenom} ${duplicate.nom}`, input.numero)
    : ''
  ui.toast(`${added}. ${warning}`.trim())
  form.value?.reset()
}
</script>

<template>
  <div class="page">
    <section class="card stack" aria-labelledby="add-title">
      <h2 id="add-title">{{ fr.roster.addTitle }}</h2>
      <PlayerForm ref="form" :submit-label="fr.roster.add" @submit="addPlayer" />
    </section>

    <p v-if="dataStore.players.length === 0" class="muted">{{ fr.roster.empty }}</p>

    <section
      v-for="group in groups"
      :key="group.key"
      class="card"
      :aria-labelledby="`group-${group.key}`"
    >
      <h2 :id="`group-${group.key}`">{{ group.title }}</h2>
      <ul class="player-list">
        <li v-for="player in group.players" :key="player.id">
          <RouterLink class="player-row" :to="{ name: 'player', params: { id: player.id } }">
            <span class="number">{{ player.numero }}</span>
            <span class="name">{{ player.prenom }} {{ player.nom }}</span>
            <span v-if="!player.actif" class="badge">{{ fr.roster.former }}</span>
            <span aria-hidden="true">›</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <button
      v-if="formerCount > 0"
      type="button"
      class="btn"
      :aria-pressed="showFormer"
      @click="showFormer = !showFormer"
    >
      {{ showFormer ? fr.roster.hideFormer : fr.roster.showFormer(formerCount) }}
    </button>
  </div>
</template>

<style scoped>
.player-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.player-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 52px;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  text-decoration: none;
}

.number {
  min-width: 2.4ch;
  font: 700 1.5rem var(--font-title);
  text-align: right;
}

.name {
  flex: 1;
  font-weight: 600;
}
</style>
