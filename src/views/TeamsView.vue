<script setup lang="ts">
import { computed } from 'vue'

import { sortPlayers } from '@/domain/lineup'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

const teams = computed(() =>
  [...dataStore.teams]
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    .map((team) => {
      const members = team.joueurs
        .map(dataStore.findPlayer)
        .filter((player): player is Player => !!player)
      return {
        ...team,
        numbers: sortPlayers(members)
          .map((player) => `#${player.numero}`)
          .join(' '),
      }
    }),
)
</script>

<template>
  <div class="page">
    <RouterLink
      class="btn btn-primary btn-big"
      :to="{ name: 'team-edit', params: { id: 'nouvelle' } }"
    >
      {{ fr.teams.create }}
    </RouterLink>
    <p v-if="teams.length === 0" class="muted">{{ fr.teams.empty }}</p>
    <ul class="team-list">
      <li v-for="team in teams" :key="team.id">
        <RouterLink class="card team-row" :to="{ name: 'team-edit', params: { id: team.id } }">
          <strong>{{ team.nom }}</strong>
          <span class="muted">{{ fr.teams.playersCount(team.joueurs.length) }}</span>
          <span class="small muted">{{ team.numbers }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.team-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.team-row {
  display: grid;
  gap: 2px;
  color: var(--ink);
  text-decoration: none;
}

.team-row strong {
  font: 700 1.3rem var(--font-title);
}
</style>
