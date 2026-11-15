<script setup lang="ts">
import { computed } from 'vue'

import { FIELD_TYPE_LABELS, MATCH_TYPE_LABELS } from '@/domain/constants'
import { sortMatchesByDate } from '@/domain/filters'
import { formatLongDate } from '@/domain/format'
import { matchResult, matchScore } from '@/domain/score'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

const rows = computed(() =>
  sortMatchesByDate(dataStore.matches).map((match) => ({
    match,
    result: matchResult(match),
    score: matchScore(match),
    details: [
      formatLongDate(match.date),
      match.evenement,
      FIELD_TYPE_LABELS[match.terrain],
      MATCH_TYPE_LABELS[match.type],
    ].join(' · '),
  })),
)
</script>

<template>
  <div class="page">
    <section v-if="rows.length === 0" class="card stack">
      <p>{{ fr.history.empty }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'new-match' }">{{
        fr.home.newMatch
      }}</RouterLink>
    </section>
    <ul class="history">
      <li v-for="row in rows" :key="row.match.id">
        <RouterLink class="card history-row" :to="{ name: 'match', params: { id: row.match.id } }">
          <span class="result" :class="row.result" :title="fr.history.resultLong[row.result]">
            {{ fr.history.result[row.result] }}
          </span>
          <span class="text">
            <strong>{{ row.match.equipeNom }} – {{ row.match.adversaire }}</strong>
            <span class="small muted">{{ row.details }}</span>
          </span>
          <strong class="score">{{ row.score.us }} – {{ row.score.them }}</strong>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.history-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--ink);
  text-decoration: none;
}

.text {
  flex: 1;
  display: grid;
  gap: 2px;
}

.score {
  font: 700 1.5rem var(--font-title);
  white-space: nowrap;
}

.result {
  min-width: 40px;
  min-height: 40px;
  padding: 0 var(--space-1);
  border-radius: 8px;
  display: grid;
  place-items: center;
  font: 700 1.1rem var(--font-title);
  color: #fff;
  text-align: center;
}

.result.V {
  background: var(--success);
}

.result.D {
  background: var(--danger);
}

.result.N {
  background: var(--neutral);
}

.result.en_cours {
  background: var(--warning);
  font-size: 0.85rem;
  line-height: 1;
}
</style>
