<script setup lang="ts">
// Défense : passe adverse (facultative) et trois groupes d'actions, chacun avec une bande de couleur.
import { CONCEDED_CAUSES, DEF_CAUSE_LABELS, RECOVERY_CAUSES } from '@/domain/constants'
import type { DefCause } from '@/domain/types'
import { fr } from '@/i18n/fr'

defineProps<{ opponentPasses: number }>()
const emit = defineEmits<{ choose: [cause: DefCause]; opponentPass: [] }>()

const groups: { key: string; title: string; causes: DefCause[] }[] = [
  { key: 'recovery', title: fr.live.groupRecovery, causes: [...RECOVERY_CAUSES, 'callahan'] },
  { key: 'kept', title: fr.live.groupKept, causes: ['break_sans_but'] },
  { key: 'conceded', title: fr.live.groupConceded, causes: CONCEDED_CAUSES },
]
</script>

<template>
  <div class="defense">
    <button type="button" class="btn btn-big" @click="emit('opponentPass')">
      {{ fr.live.opponentPass }}
      <span class="small muted">· {{ fr.live.opponentPassCount(opponentPasses) }}</span>
    </button>
    <fieldset v-for="group in groups" :key="group.key" class="group" :class="group.key">
      <legend>{{ group.title }}</legend>
      <div class="buttons">
        <button
          v-for="cause in group.causes"
          :key="cause"
          type="button"
          class="btn"
          :class="{ gold: cause === 'callahan' }"
          @click="emit('choose', cause)"
        >
          {{ DEF_CAUSE_LABELS[cause] }}
        </button>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.defense {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-3);
}

.group {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-left: 8px solid var(--neutral);
  border-radius: var(--radius);
}

.group legend {
  font-weight: 700;
  padding: 0 var(--space-1);
}

.group.recovery {
  border-left-color: var(--success);
}

.group.kept {
  border-left-color: var(--warning);
}

.group.conceded {
  border-left-color: var(--danger);
}

.buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: var(--space-2);
}

.gold {
  background: var(--gold-bg);
  border-color: var(--gold);
}
</style>
