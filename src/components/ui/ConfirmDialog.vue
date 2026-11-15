<script setup lang="ts">
import { fr } from '@/i18n/fr'
import { useUiStore } from '@/stores/uiStore'

import BaseDialog from './BaseDialog.vue'

const ui = useUiStore()
</script>

<template>
  <BaseDialog
    :open="ui.confirmRequest !== null"
    :title="ui.confirmRequest?.title ?? ''"
    @close="ui.answerConfirm(false)"
  >
    <p v-if="ui.confirmRequest?.message">{{ ui.confirmRequest.message }}</p>
    <template #actions>
      <button type="button" class="btn" @click="ui.answerConfirm(false)">
        {{ fr.common.cancel }}
      </button>
      <button
        type="button"
        class="btn"
        :class="ui.confirmRequest?.danger ? 'btn-danger' : 'btn-primary'"
        @click="ui.answerConfirm(true)"
      >
        {{ ui.confirmRequest?.confirmLabel }}
      </button>
    </template>
  </BaseDialog>
</template>
