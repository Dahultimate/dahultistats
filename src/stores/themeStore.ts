// Thème choisi (Classique ou Verre liquide) et mode clair / sombre.
// Par défaut le mode suit l'appareil ; le bouton du bandeau le force jusqu'à ce qu'il rejoigne l'appareil.

import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'

import {
  applyTheme,
  type ColorMode,
  loadThemePreference,
  saveThemePreference,
  systemPrefersDark,
  type ThemeId,
  watchSystemDark,
} from '@/services/themeService'

export const useThemeStore = defineStore('theme', () => {
  const saved = loadThemePreference()
  const theme = ref<ThemeId>(saved.theme)
  const modePreference = ref<ColorMode | null>(saved.mode)
  const systemDark = ref(systemPrefersDark())

  const mode = computed<ColorMode>(
    () => modePreference.value ?? (systemDark.value ? 'dark' : 'light'),
  )

  /** À appeler une fois au démarrage, avant d'afficher l'application. */
  function start(): void {
    watchSystemDark((dark) => (systemDark.value = dark))
    watchEffect(() => applyTheme(theme.value, mode.value))
  }

  function setTheme(next: ThemeId): void {
    theme.value = next
    saveThemePreference({ theme: next, mode: modePreference.value })
  }

  /** Bascule clair / sombre ; revenir au mode de l'appareil efface le choix forcé. */
  function toggleMode(): void {
    const next: ColorMode = mode.value === 'dark' ? 'light' : 'dark'
    const systemMode: ColorMode = systemDark.value ? 'dark' : 'light'
    modePreference.value = next === systemMode ? null : next
    saveThemePreference({ theme: theme.value, mode: modePreference.value })
  }

  return { theme, mode, modePreference, systemDark, start, setTheme, toggleMode }
})
