<script setup lang="ts">
// Mise en page dédiée à l'export, rendue hors écran : toujours en thème clair sur fond blanc,
// largeur fixe, sans élément interactif. Le contenu est fourni par le slot (rapports en mode print).
import { ref } from 'vue'

import { fr } from '@/i18n/fr'

defineProps<{
  width: number
  title: string
  lines: string[]
  footer: string
}>()

const root = ref<HTMLElement | null>(null)
defineExpose({ root })
</script>

<template>
  <div class="offscreen" aria-hidden="true">
    <div ref="root" class="theme-light print-layout" :style="{ width: `${width}px` }">
      <header class="print-header print-block">
        <p class="app">{{ fr.appName }}</p>
        <h1>{{ title }}</h1>
        <p v-for="line in lines" :key="line" class="line">{{ line }}</p>
      </header>
      <slot />
      <footer class="print-footer">{{ footer }}</footer>
    </div>
  </div>
</template>

<style scoped>
/* Le conteneur est décalé hors écran ; le contenu capturé reste dans le flux normal. */
.offscreen {
  position: fixed;
  top: 0;
  left: -20000px;
  pointer-events: none;
}

.print-layout {
  background: #ffffff;
  color: var(--ink);
  /* Police du thème Classique, quel que soit le thème choisi à l'écran. */
  font-family: var(--font-text);
  padding: 57px; /* 15 mm à 96 dpi */
  display: grid;
  gap: 16px;
  font-size: 15px;
}

.print-header h1 {
  margin: 0 0 6px;
  font-size: 1.8rem;
}

.app {
  margin: 0;
  font-weight: 700;
  color: var(--primary);
}

.line {
  margin: 0;
  color: var(--ink-muted);
}

.print-footer {
  font-size: 0.8rem;
  color: var(--ink-muted);
  border-top: 1px solid var(--border);
  padding-top: 8px;
}

/* À l'impression, les cartes deviennent de simples blocs (un tableau peut être découpé). */
.print-layout :deep(.card) {
  border: none;
  padding: 0;
  background: transparent;
}
</style>
