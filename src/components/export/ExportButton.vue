<script setup lang="ts">
// Bouton « PDF / Image », distinct du bouton « Exporter » qui sauvegarde les données JSON.
import { fr } from '@/i18n/fr'

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" class="btn" :title="fr.export.buttonTitle" @click="emit('click')">
    <span aria-hidden="true">⎙</span> {{ fr.export.button }}
  </button>
</template>
