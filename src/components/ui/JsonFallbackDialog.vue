<script setup lang="ts">
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

import BaseDialog from './BaseDialog.vue'

const ui = useUiStore()
const dataStore = useDataStore()

async function copy(): Promise<void> {
  if (!ui.jsonFallback) return
  if (await dataStore.copyExport(ui.jsonFallback)) {
    ui.jsonFallback = null
    ui.toast(fr.dataFile.copied)
  } else {
    ui.toast(fr.dataFile.copyFailed)
  }
}
</script>

<template>
  <BaseDialog
    :open="ui.jsonFallback !== null"
    :title="fr.dataFile.fallbackTitle"
    @close="ui.jsonFallback = null"
  >
    <p>{{ fr.dataFile.fallbackText }}</p>
    <label class="form-field">
      <span class="visually-hidden">{{ fr.dataFile.fallbackTitle }}</span>
      <textarea readonly :value="ui.jsonFallback ?? ''"></textarea>
    </label>
    <template #actions>
      <button type="button" class="btn" @click="ui.jsonFallback = null">
        {{ fr.common.close }}
      </button>
      <button type="button" class="btn btn-primary" @click="copy">{{ fr.dataFile.copy }}</button>
    </template>
  </BaseDialog>
</template>
