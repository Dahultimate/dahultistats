import '@fontsource/barlow/400.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '@fontsource-variable/figtree'
import './styles/tokens.css'
import './styles/base.css'
import './styles/glass.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import { useThemeStore } from './stores/themeStore'

const pinia = createPinia()
// Thème posé avant le premier affichage : pas de flash de l'autre thème.
useThemeStore(pinia).start()
createApp(App).use(pinia).use(router).mount('#app')
