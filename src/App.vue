<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppHeader from '@/components/ui/AppHeader.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import JsonFallbackDialog from '@/components/ui/JsonFallbackDialog.vue'
import ToastMessage from '@/components/ui/ToastMessage.vue'
import { useDataStore } from '@/stores/dataStore'

const route = useRoute()
const dataStore = useDataStore()

// Avertissement du navigateur si des modifications ne sont pas exportées (sauf données d'exemple).
function warnBeforeLeaving(event: BeforeUnloadEvent): void {
  if (!dataStore.dirty || dataStore.isSample) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeLeaving))
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving))
</script>

<template>
  <AppHeader v-if="route.name !== 'open'" />
  <main>
    <RouterView />
  </main>
  <ToastMessage />
  <ConfirmDialog />
  <JsonFallbackDialog />
</template>
