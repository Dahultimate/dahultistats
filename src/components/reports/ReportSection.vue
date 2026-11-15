<script setup lang="ts">
// Bloc de rapport : jamais coupé entre deux pages lors de l'export PDF (classe print-block).
defineProps<{ title?: string }>()
</script>

<template>
  <section class="card report-section print-block">
    <h3 v-if="title">{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.report-section {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}
</style>
