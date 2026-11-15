<script setup lang="ts">
// Part des passes du match : barre segmentée (nous / adversaire).
import { computed } from 'vue'

import { formatPercent } from '@/domain/format'
import { fr } from '@/i18n/fr'

/** Le pourcentage s'inscrit dans le segment s'il fait au moins 12 %. */
const MIN_SHARE_FOR_LABEL = 0.12

const props = defineProps<{ ours: number; theirs: number; ourName: string; theirName: string }>()

const total = computed(() => props.ours + props.theirs)
const segments = computed(() =>
  [
    { key: 'us', count: props.ours, name: props.ourName },
    { key: 'them', count: props.theirs, name: props.theirName },
  ].map((segment) => ({
    ...segment,
    share: segment.count / total.value,
    text: formatPercent(segment.count, total.value),
  })),
)
const description = computed(() =>
  segments.value.map((segment) => `${segment.name} ${segment.text} (${segment.count})`).join(', '),
)
</script>

<template>
  <p v-if="theirs === 0" class="muted">{{ fr.reports.passShareEmpty(ours) }}</p>
  <figure v-else class="share">
    <div class="bar" role="img" :aria-label="description">
      <span
        v-for="segment in segments"
        :key="segment.key"
        class="segment"
        :class="segment.key"
        :style="{ flexGrow: segment.count }"
        :title="`${segment.name} : ${segment.count} (${segment.text})`"
      >
        {{ segment.share >= MIN_SHARE_FOR_LABEL ? segment.text : '' }}
      </span>
    </div>
    <figcaption class="chart-legend">
      <span><i class="swatch us"></i>{{ fr.reports.passCount(ourName, ours) }}</span>
      <span><i class="swatch them"></i>{{ fr.reports.passCount(theirName, theirs) }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.share {
  margin: 0;
  display: grid;
  gap: var(--space-2);
}

.bar {
  display: flex;
  gap: 2px;
  height: 28px;
}

.segment {
  flex-basis: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  min-width: 2px;
}

.segment.us {
  background: var(--c-us);
  border-radius: 4px 0 0 4px;
}

.segment.them {
  background: var(--c-them);
  border-radius: 0 4px 4px 0;
}
</style>
