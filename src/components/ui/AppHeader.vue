<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useThemeStore } from '@/stores/themeStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const themeStore = useThemeStore()

const parent = computed(() => route.meta.parent)

function goBack(): void {
  if (parent.value) router.push({ name: parent.value })
}
</script>

<template>
  <header class="app-header">
    <button
      v-if="parent"
      type="button"
      class="icon-button"
      :aria-label="fr.header.back"
      :title="fr.header.back"
      @click="goBack"
    >
      ←
    </button>
    <h1 class="title">{{ route.meta.title }}</h1>
    <button
      type="button"
      class="icon-button"
      :aria-label="themeStore.mode === 'dark' ? fr.theme.toLight : fr.theme.toDark"
      :title="themeStore.mode === 'dark' ? fr.theme.toLight : fr.theme.toDark"
      @click="themeStore.toggleMode"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <template v-if="themeStore.mode === 'dark'">
          <circle cx="12" cy="12" r="4"></circle>
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          ></path>
        </template>
        <path v-else d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"></path>
      </svg>
    </button>
    <button
      type="button"
      class="btn export"
      :class="{ 'export-dirty': dataStore.dirty }"
      :title="fr.header.exportTitle"
      @click="dataStore.exportData"
    >
      <span v-if="dataStore.dirty" class="dot" aria-hidden="true"></span>
      {{ fr.header.export }}
      <span class="visually-hidden">
        ({{ dataStore.dirty ? fr.header.notExported : fr.header.upToDate }})
      </span>
    </button>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--header-height);
  padding: var(--space-1) var(--space-3);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.title {
  flex: 1;
  margin: 0;
  font-size: 1.35rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  min-width: var(--touch);
  min-height: var(--touch);
  border: none;
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--ink);
  font-size: 1.4rem;
  cursor: pointer;
}

.export-dirty {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-ink);
}
</style>
