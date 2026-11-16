<script setup lang="ts">
// Carte du terrain avec un sélecteur de statistique. À l'export, le sélecteur devient un titre.
import { computed } from 'vue'

import type { FieldPosition } from '@/domain/types'
import { fr } from '@/i18n/fr'

import HeatmapField from './HeatmapField.vue'

export interface HeatmapOption {
  key: string
  label: string
  positions: FieldPosition[]
  ramp?: 'blue' | 'orange'
}

const props = defineProps<{ options: HeatmapOption[]; mode: 'screen' | 'print' }>()
const selected = defineModel<string>({ required: true })

const current = computed(
  () => props.options.find((option) => option.key === selected.value) ?? props.options[0]!,
)
</script>

<template>
  <div class="picker">
    <label v-if="mode === 'screen'" class="form-field">
      <span>{{ fr.heatmap.select }}</span>
      <select v-model="selected">
        <option v-for="option in options" :key="option.key" :value="option.key">
          {{ option.label }}
        </option>
      </select>
    </label>
    <h4 v-else>{{ fr.export.heatmapTitle(current.label) }}</h4>
    <HeatmapField :positions="current.positions" :label="current.label" :ramp="current.ramp" />
  </div>
</template>

<style scoped>
.picker {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.picker .form-field {
  width: min(320px, 100%);
}

h4 {
  margin: 0;
}
</style>
