<script setup lang="ts">
// Puce de joueur : numéro (gros), prénom et initiale du nom, information secondaire.
import type { Player } from '@/domain/types'

defineProps<{
  player: Player
  pressed: boolean
  disabled?: boolean
  subtitle?: string
}>()
const emit = defineEmits<{ toggle: [id: string] }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :aria-pressed="pressed"
    :disabled="disabled"
    @click="emit('toggle', player.id)"
  >
    <span class="number">{{ player.numero }}</span>
    <span class="name">{{ player.prenom }} {{ player.nom.charAt(0) }}.</span>
    <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
  </button>
</template>

<style scoped>
.chip {
  position: relative;
  min-height: 56px;
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  border: 2px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  display: grid;
  justify-items: center;
  align-content: center;
  cursor: pointer;
  font-family: var(--font-text);
}

.number {
  font-family: var(--font-title);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1;
}

.name {
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle {
  font-size: 0.75rem;
  color: var(--ink-muted);
}

.chip[aria-pressed='true'] {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-ink);
}

.chip[aria-pressed='true'] .subtitle {
  color: inherit;
}

/* Marque visible sans couleur : coche dans le coin. */
.chip[aria-pressed='true']::after {
  content: '✓';
  position: absolute;
  top: 2px;
  right: 6px;
  font-weight: 700;
}

.chip:disabled {
  border-style: dashed;
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
