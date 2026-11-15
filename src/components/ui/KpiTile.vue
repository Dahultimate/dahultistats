<script setup lang="ts">
// Tuile de chiffre clé, avec une jauge horizontale facultative (fraction de 0 à 1).
defineProps<{
  label: string
  value: string
  detail?: string
  gauge?: number | null
  explanation?: string
}>()
</script>

<template>
  <div class="tile">
    <span class="tile-label">{{ label }}</span>
    <strong class="tile-value">{{ value }}</strong>
    <div v-if="gauge !== undefined" class="gauge" aria-hidden="true">
      <div class="gauge-fill" :style="{ width: `${Math.round((gauge ?? 0) * 100)}%` }"></div>
    </div>
    <span v-if="detail" class="tile-detail">{{ detail }}</span>
    <span v-if="explanation" class="tile-explanation">{{ explanation }}</span>
  </div>
</template>

<style scoped>
.tile {
  display: grid;
  gap: 2px;
  align-content: start;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.tile-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
}

.tile-value {
  font-family: var(--font-title);
  font-size: 2rem;
  line-height: 1;
}

.tile-detail,
.tile-explanation {
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.gauge {
  height: 10px;
  margin: var(--space-1) 0;
  border-radius: 4px;
  background: var(--grid);
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: var(--c-us);
  border-radius: 0 4px 4px 0;
}
</style>
