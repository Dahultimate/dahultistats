// Thème de l'interface : préférence gardée dans ce navigateur, mode clair / sombre de l'appareil,
// et attributs posés sur <html> pour les jetons de tokens.css.

export type ThemeId = 'base' | 'glass'
export type ColorMode = 'light' | 'dark'

export interface ThemePreference {
  theme: ThemeId
  /** null : suivre l'appareil. */
  mode: ColorMode | null
}

const THEME_KEY = 'stats-ultimate:theme'
const THEMES: ThemeId[] = ['base', 'glass']
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function loadThemePreference(): ThemePreference {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY) ?? '{}') as Partial<ThemePreference>
    return {
      theme: THEMES.includes(saved.theme as ThemeId) ? (saved.theme as ThemeId) : 'base',
      mode: saved.mode === 'light' || saved.mode === 'dark' ? saved.mode : null,
    }
  } catch {
    return { theme: 'base', mode: null }
  }
}

export function saveThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(preference))
  } catch {
    // Stockage indisponible (navigation privée…) : le choix vaut pour cette visite seulement.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

/** Prévient quand l'appareil passe en clair ou en sombre. */
export function watchSystemDark(onChange: (dark: boolean) => void): void {
  if (typeof window.matchMedia !== 'function') return
  window.matchMedia(DARK_QUERY).addEventListener('change', (event) => onChange(event.matches))
}

export function applyTheme(theme: ThemeId, mode: ColorMode): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.mode = mode
}
