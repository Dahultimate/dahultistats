<script setup lang="ts">
// Ouverture des données : import d'un fichier, collage, copie de secours, fichier vide ou exemple.
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { formatDateTime } from '@/domain/format'
import type { ImportResult } from '@/domain/importExport'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

const router = useRouter()
const dataStore = useDataStore()
const ui = useUiStore()

const error = ref('')
const showPaste = ref(false)
const pasted = ref('')
const backupSavedAt = dataStore.backupSavedAt()

const ERRORS = {
  invalid_json: fr.open.invalidJson,
  invalid_format: fr.open.invalidFormat,
  read_error: fr.open.readError,
} as const

function opened(): void {
  error.value = ''
  ui.toast(fr.open.loaded(dataStore.players.length, dataStore.matches.length))
  router.push({ name: 'home' })
}

function handle(result: ImportResult | { ok: false; error: keyof typeof ERRORS }): void {
  if (result.ok) opened()
  else error.value = ERRORS[result.error]
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) handle(await dataStore.importFile(file))
}

function restoreBackup(): void {
  if (dataStore.restoreBackup()) opened()
  else error.value = fr.open.backupInvalid
}

function startEmpty(): void {
  dataStore.loadEmpty()
  opened()
}

function startSample(): void {
  dataStore.loadSample()
  opened()
}
</script>

<template>
  <div class="page open">
    <header class="hero">
      <svg class="logo" viewBox="0 0 64 64" aria-hidden="true">
        <ellipse cx="32" cy="35" rx="28" ry="12" fill="#14448a" />
        <ellipse cx="32" cy="30" rx="28" ry="12" fill="#1f62c4" />
        <ellipse cx="32" cy="30" rx="17" ry="6.5" fill="none" stroke="#ffd23f" stroke-width="3" />
      </svg>
      <h1>{{ fr.appName }}</h1>
      <p>{{ fr.open.intro }}</p>
    </header>

    <section class="card stack">
      <label class="btn btn-primary btn-big file-button">
        {{ fr.open.importFile }}
        <input
          type="file"
          accept=".json,application/json"
          class="visually-hidden"
          @change="onFileChosen"
        />
      </label>
      <button
        type="button"
        class="btn btn-big"
        :aria-expanded="showPaste"
        @click="showPaste = !showPaste"
      >
        {{ fr.open.pasteToggle }}
      </button>
      <div v-if="showPaste" class="stack">
        <label class="form-field">
          <span>{{ fr.open.pasteLabel }}</span>
          <textarea v-model="pasted"></textarea>
        </label>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!pasted.trim()"
          @click="handle(dataStore.importText(pasted))"
        >
          {{ fr.open.pasteLoad }}
        </button>
      </div>
      <button v-if="backupSavedAt" type="button" class="btn btn-big" @click="restoreBackup">
        {{ fr.open.backup(formatDateTime(backupSavedAt)) }}
      </button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <section class="card stack">
      <h2>{{ fr.open.firstVisit }}</h2>
      <button type="button" class="btn" @click="startEmpty">{{ fr.open.createEmpty }}</button>
      <button type="button" class="btn" @click="startSample">{{ fr.open.trySample }}</button>
    </section>
  </div>
</template>

<style scoped>
.open {
  max-width: 560px;
}

.hero {
  text-align: center;
  padding-top: var(--space-5);
}

.logo {
  width: 88px;
  height: 88px;
}

.hero h1 {
  font-size: 2.6rem;
}

.file-button {
  cursor: pointer;
}

.file-button:focus-within {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}
</style>
