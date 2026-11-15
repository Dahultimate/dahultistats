<script setup lang="ts">
// Journal « Dernières actions du point » : les 6 dernières, la plus récente en haut.
import { computed } from 'vue'

import { LOG_SIZE } from '@/domain/constants'
import { describeEvent, type PlayerLookup } from '@/domain/eventText'
import type { MatchEvent } from '@/domain/types'
import { fr } from '@/i18n/fr'

const props = defineProps<{ events: readonly MatchEvent[]; findPlayer: PlayerLookup }>()

const lines = computed(() =>
  props.events
    .slice(-LOG_SIZE)
    .reverse()
    .map((event) => describeEvent(event, props.findPlayer)),
)
</script>

<template>
  <section class="card log" aria-labelledby="log-title">
    <h2 id="log-title" class="log-title">{{ fr.live.log }}</h2>
    <p v-if="lines.length === 0" class="muted small">{{ fr.live.logEmpty }}</p>
    <ul v-else class="entries">
      <li v-for="(line, index) in lines" :key="`${events.length}-${index}`">{{ line }}</li>
    </ul>
  </section>
</template>

<style scoped>
.log-title {
  font-size: 1.1rem;
}

.entries {
  margin: 0;
  padding-left: 1.6em;
  display: grid;
  gap: var(--space-1);
}

.entries li:first-child {
  font-weight: 700;
}
</style>
