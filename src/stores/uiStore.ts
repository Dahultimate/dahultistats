// Messages courts (toast) et fenêtres de confirmation intégrées (jamais alert/confirm natifs).

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const TOAST_DURATION_MS = 3000

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  /** Action destructrice : bouton rouge. */
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

export const useUiStore = defineStore('ui', () => {
  const toastMessage = ref<string | null>(null)
  const confirmRequest = ref<ConfirmRequest | null>(null)
  /** Contenu JSON affiché quand le téléchargement est impossible. */
  const jsonFallback = ref<string | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | undefined

  function toast(message: string): void {
    toastMessage.value = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toastMessage.value = null), TOAST_DURATION_MS)
  }

  function confirm(options: ConfirmOptions): Promise<boolean> {
    confirmRequest.value?.resolve(false)
    return new Promise((resolve) => {
      confirmRequest.value = { ...options, resolve }
    })
  }

  function answerConfirm(confirmed: boolean): void {
    confirmRequest.value?.resolve(confirmed)
    confirmRequest.value = null
  }

  return { toastMessage, confirmRequest, jsonFallback, toast, confirm, answerConfirm }
})
