<script setup lang="ts">
// Fenêtre intégrée (élément <dialog> natif) : fermable par Échap ou par un clic sur le fond.
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)

function sync(open: boolean): void {
  const element = dialog.value
  if (!element) return
  if (open && !element.open) element.showModal()
  if (!open && element.open) element.close()
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

function onBackdropClick(event: MouseEvent): void {
  if (event.target === dialog.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :aria-label="title"
    @cancel.prevent="emit('close')"
    @click="onBackdropClick"
  >
    <div class="dialog-body">
      <h2>{{ title }}</h2>
      <slot />
      <div class="dialog-actions">
        <slot name="actions" />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 55%);
}

.dialog-body {
  padding: var(--space-4);
  display: grid;
  gap: var(--space-3);
}

.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
