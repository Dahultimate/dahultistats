<script setup lang="ts">
// En-but du terrain de saisie : fond plus foncé, ligne de but blanche, et le nom de l'équipe qui le
// défend écrit à la verticale (« notre en-but » ou « on marque ici »). Hachuré quand c'est notre cible.
import { fr } from '@/i18n/fr'

defineProps<{ side: 'left' | 'right'; team: string; ours: boolean; target: boolean }>()
</script>

<template>
  <span class="endzone" :class="[side, { ours, target }]" aria-hidden="true">
    <span class="label">
      <strong>{{ team }}</strong>
      <em>{{ ours ? fr.field.ourEndzone : fr.field.weScore }}</em>
    </span>
  </span>
</template>

<style scoped>
.endzone {
  position: absolute;
  z-index: 1;
  top: 0;
  bottom: 0;
  /* Un en-but occupe 1 / 5,6 de la longueur du terrain (1 + 3 × 1,2 + 1). */
  width: calc(100% / 5.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  background: var(--field-endzone);
}

.left {
  left: 0;
  border-right: 4px solid var(--field-line);
}

.right {
  right: 0;
  border-left: 4px solid var(--field-line);
}

.target {
  background: repeating-linear-gradient(
    45deg,
    var(--field-endzone) 0 10px,
    rgb(255 210 63 / 55%) 10px 14px
  );
}

.label {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 100%;
  writing-mode: vertical-rl;
  color: #fff;
  font-size: 0.8rem;
  text-align: center;
  text-shadow: 0 1px 2px rgb(0 0 0 / 70%);
}

.left .label {
  transform: rotate(180deg);
}

strong {
  font-family: var(--font-title);
  font-size: 1rem;
  max-height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

em {
  font-style: normal;
  font-weight: 700;
}

.endzone:not(.ours) em {
  color: var(--accent);
}
</style>
