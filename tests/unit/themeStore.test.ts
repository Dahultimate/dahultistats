import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { useThemeStore } from '@/stores/themeStore'

const THEME_KEY = 'stats-ultimate:theme'

/** Simule un appareil réglé en clair ou en sombre (jsdom n'a pas matchMedia). */
function mockSystem(dark: boolean) {
  let listener: ((event: { matches: boolean }) => void) | undefined
  window.matchMedia = vi.fn(() => ({
    matches: dark,
    addEventListener: (_: string, callback: typeof listener) => (listener = callback),
  })) as unknown as typeof window.matchMedia
  return (nowDark: boolean) => listener?.({ matches: nowDark })
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('thème de l’interface', () => {
  it('par défaut : thème Classique, mode de l’appareil, posé sur <html>', () => {
    mockSystem(true)
    const store = useThemeStore()
    store.start()
    expect([store.theme, store.mode]).toEqual(['base', 'dark'])
    expect(document.documentElement.dataset).toMatchObject({ theme: 'base', mode: 'dark' })
  })

  it('suit l’appareil quand il change de mode', async () => {
    const switchSystem = mockSystem(false)
    const store = useThemeStore()
    store.start()
    switchSystem(true)
    await nextTick()
    expect(store.mode).toBe('dark')
    expect(document.documentElement.dataset.mode).toBe('dark')
  })

  it('le bouton force le mode ; revenir au mode de l’appareil efface le choix forcé', () => {
    mockSystem(false)
    const store = useThemeStore()
    store.toggleMode()
    expect([store.mode, store.modePreference]).toEqual(['dark', 'dark'])
    store.toggleMode()
    expect([store.mode, store.modePreference]).toEqual(['light', null])
  })

  it('garde le thème et le mode choisis dans ce navigateur', () => {
    mockSystem(false)
    const store = useThemeStore()
    store.setTheme('glass')
    store.toggleMode()
    setActivePinia(createPinia())
    const reloaded = useThemeStore()
    expect([reloaded.theme, reloaded.mode]).toEqual(['glass', 'dark'])
  })

  it('ignore une préférence illisible ou d’un thème inconnu', () => {
    localStorage.setItem(THEME_KEY, '{pas du json')
    expect([useThemeStore().theme, useThemeStore().modePreference]).toEqual(['base', null])
    setActivePinia(createPinia())
    localStorage.setItem(THEME_KEY, JSON.stringify({ theme: 'night', mode: 'dark' }))
    expect(useThemeStore().theme).toBe('base')
  })
})
