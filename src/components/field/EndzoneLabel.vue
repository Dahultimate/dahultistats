<script setup lang="ts">
// Étiquette verticale d'un en-but : nom de l'équipe qui le défend, « notre en-but » ou « on marque ici ».
import { fr } from '@/i18n/fr'

defineProps<{ side: 'left' | 'right'; team: string; ours: boolean }>()
</script>

<template>
  <span class="endzone-label" :class="[side, { ours }]" aria-hidden="true">
    <strong>{{ team }}</strong>
    <em>{{ ours ? fr.field.ourEndzone : fr.field.weScore }}</em>
  </span>
</template>

<style scoped>
.endzone-label {
  position: absolute;
  z-index: 1;
  top: 3px;
  bottom: 3px;
  /* Un en-but occupe 1 / 5,6 de la largeur du terrain (1 + 3 × 1,2 + 1). */
  width: calc((100% - 6px) / 5.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  pointer-events: none;
  color: #fff;
  font-size: 0.8rem;
  text-align: center;
  overflow: hidden;
  text-shadow: 0 1px 2px rgb(0 0 0 / 70%);
}

.left {
  left: 3px;
  transform: rotate(180deg);
}

.right {
  right: 3px;
}

strong {
  font-family: var(--font-title);
  font-size: 1rem;
  max-height: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

em {
  font-style: normal;
  font-weight: 700;
}

.endzone-label:not(.ours) em {
  color: var(--accent);
}
</style>
