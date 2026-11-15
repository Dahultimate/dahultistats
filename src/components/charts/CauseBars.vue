<script setup lang="ts">
// Barres horizontales par cause (turns, récupérations, buts encaissés…), triées par valeur.
import { computed } from 'vue'

import { fr } from '@/i18n/fr'

const props = withDefaults(
  defineProps<{
    title: string
    items: { label: string; value: number }[]
    color?: 'us' | 'them' | 'miss'
  }>(),
  { color: 'us' },
)

const visible = computed(() =>
  props.items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value),
)
const max = computed(() => Math.max(1, ...visible.value.map((item) => item.value)))
const description = computed(
  () =>
    `${props.title} : ${visible.value.map((item) => `${item.label} ${item.value}`).join(', ') || fr.reports.noValue}`,
)
</script>

<template>
  <figure class="cause-bars">
    <figcaption class="caption">{{ title }}</figcaption>
    <p v-if="visible.length === 0" class="muted small">{{ fr.reports.noValue }}</p>
    <div v-else class="bars" role="img" :aria-label="description">
      <template v-for="item in visible" :key="item.label">
        <span class="label">{{ item.label }}</span>
        <span class="track" :title="`${item.label} : ${item.value}`">
          <span
            class="bar"
            :class="color"
            :style="{ width: `${(item.value / max) * 100}%` }"
          ></span>
          <span class="value">{{ item.value }}</span>
        </span>
      </template>
    </div>
    <slot />
  </figure>
</template>

<style scoped>
.cause-bars {
  margin: 0;
  display: grid;
  gap: var(--space-2);
  align-content: start;
}

.caption {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.1rem;
}

.bars {
  display: grid;
  grid-template-columns: minmax(90px, auto) 1fr;
  gap: var(--space-2) var(--space-3);
  align-items: center;
}

.label {
  font-size: 0.9rem;
}

.track {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  border-left: 1px solid var(--ink-muted);
}

.bar {
  height: 20px;
  border-radius: 0 4px 4px 0;
  max-width: calc(100% - 2.5em);
}

.bar.us {
  background: var(--c-us);
}

.bar.them {
  background: var(--c-them);
}

.bar.miss {
  background: var(--c-miss);
}

.value {
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
