<script setup lang="ts">
// Tableau de score : notre équipe, « 5 – 3 », adversaire.
defineProps<{ ourName: string; theirName: string; us: number; them: number }>()
</script>

<template>
  <div class="scoreboard" role="group" :aria-label="`${ourName} ${us}, ${theirName} ${them}`">
    <span class="team">{{ ourName }}</span>
    <strong class="score" aria-hidden="true">{{ us }} – {{ them }}</strong>
    <span class="team team-them">{{ theirName }}</span>
  </div>
</template>

<style scoped>
.scoreboard {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--bg);
}

.team {
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 1.15rem;
  overflow-wrap: anywhere;
}

.team-them {
  text-align: right;
}

.score {
  font-family: var(--font-title);
  font-size: 2rem;
  white-space: nowrap;
}
</style>
