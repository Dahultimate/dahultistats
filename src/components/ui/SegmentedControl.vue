<script setup lang="ts" generic="T extends string">
// Choix segmenté : boutons bascule avec aria-pressed.
defineProps<{
  label: string
  options: readonly { value: T; label: string; disabled?: boolean }[]
  modelValue: T
}>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="segmented-field">
    <span class="form-label">{{ label }}</span>
    <div class="segmented" role="group" :aria-label="label">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :aria-pressed="option.value === modelValue"
        :disabled="option.disabled"
        @click="emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.segmented-field {
  display: grid;
  gap: var(--space-1);
}

.segmented {
  display: flex;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.segmented button {
  flex: 1;
  min-height: var(--touch);
  border: none;
  border-right: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  font: 600 1rem var(--font-text);
  cursor: pointer;
}

.segmented button:last-child {
  border-right: none;
}

.segmented button[aria-pressed='true'] {
  background: var(--primary);
  color: var(--primary-ink);
}

.segmented button[aria-pressed='true']::before {
  content: '✓ ';
}

.segmented button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
