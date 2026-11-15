<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

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
