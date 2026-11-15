<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
</script>

<template>
  <div class="toast-region" role="status" aria-live="polite">
    <p v-if="ui.toastMessage" class="toast">{{ ui.toastMessage }}</p>
  </div>
</template>

<style scoped>
.toast-region {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--space-4);
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 50;
  padding: 0 var(--space-4);
}

.toast {
  margin: 0;
  max-width: 520px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--bg);
  font-weight: 600;
  box-shadow: 0 6px 20px rgb(0 0 0 / 30%);
}
</style>
