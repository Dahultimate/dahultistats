<script setup lang="ts">
// Grille de puces de joueurs, groupées par poste ou en une seule liste triée par numéro.
import { computed } from 'vue'

import { groupByPosition, sortPlayers } from '@/domain/lineup'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import PlayerChip from './PlayerChip.vue'

const props = defineProps<{
  players: readonly Player[]
  selected: readonly string[]
  label: string
  grouped?: boolean
  disabledIds?: readonly string[]
  subtitles?: Record<string, string>
}>()
const emit = defineEmits<{ toggle: [id: string] }>()

const groups = computed(() => {
  if (!props.grouped) return [{ title: '', players: sortPlayers(props.players) }]
  const byPosition = groupByPosition(props.players)
  return [
    { title: fr.common.handlers(byPosition.Handler.length), players: byPosition.Handler },
    { title: fr.common.middles(byPosition.Middle.length), players: byPosition.Middle },
  ].filter((group) => group.players.length > 0)
})
</script>

<template>
  <div class="chip-groups" role="group" :aria-label="label">
    <div v-for="group in groups" :key="group.title" class="chip-group">
      <h3 v-if="group.title" class="group-title">{{ group.title }}</h3>
      <div class="chips">
        <PlayerChip
          v-for="player in group.players"
          :key="player.id"
          :player="player"
          :pressed="selected.includes(player.id)"
          :disabled="disabledIds?.includes(player.id)"
          :subtitle="subtitles?.[player.id]"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chip-groups {
  display: grid;
  gap: var(--space-3);
}

.group-title {
  font-size: 1rem;
  margin-bottom: var(--space-2);
  color: var(--ink-muted);
}

.chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: var(--space-2);
}
</style>
