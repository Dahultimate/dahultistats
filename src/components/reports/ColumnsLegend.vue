<script setup lang="ts">
// Explication des colonnes du tableau des joueurs (lisible aussi sur téléphone, sans survol).
import { fr } from '@/i18n/fr'
</script>

<template>
  <details class="small">
    <summary class="btn-link">{{ fr.reports.columnsLegend }}</summary>
    <p class="muted">{{ fr.table.sortHint }}</p>
    <dl class="legend-list">
      <template v-for="(column, key) in fr.table.columns" :key="key">
        <dt>{{ column[0] }}</dt>
        <dd>{{ column[1] }}</dd>
      </template>
    </dl>
  </details>
</template>

<style scoped>
.legend-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--space-3);
}

dt {
  font-weight: 700;
}

dd {
  margin: 0;
}
</style>
