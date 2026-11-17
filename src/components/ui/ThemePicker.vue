<script setup lang="ts">
// Choix du thème de l'interface ; le mode clair / sombre se bascule depuis le bandeau du haut.
import { fr } from '@/i18n/fr'
import type { ThemeId } from '@/services/themeService'
import { useThemeStore } from '@/stores/themeStore'

import SegmentedControl from './SegmentedControl.vue'

const themeStore = useThemeStore()
const options = (Object.keys(fr.theme.names) as ThemeId[]).map((value) => ({
  value,
  label: fr.theme.names[value],
}))
</script>

<template>
  <section class="card stack" aria-labelledby="theme-title">
    <h2 id="theme-title">{{ fr.theme.title }}</h2>
    <SegmentedControl
      :model-value="themeStore.theme"
      :label="fr.theme.label"
      :options="options"
      @update:model-value="themeStore.setTheme"
    />
    <p class="muted small">{{ fr.theme.hint }}</p>
  </section>
</template>
