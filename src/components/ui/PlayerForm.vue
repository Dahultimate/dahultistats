<script setup lang="ts">
// Formulaire joueur (ajout dans l'effectif, modification sur la fiche). Tous les champs sont obligatoires.
import { reactive, ref } from 'vue'

import type { Position } from '@/domain/types'
import { fr } from '@/i18n/fr'
import type { PlayerInput } from '@/stores/dataStore'

import SegmentedControl from './SegmentedControl.vue'

const MAX_NUMBER = 999

const props = defineProps<{ initial?: PlayerInput; submitLabel: string; cancellable?: boolean }>()
const emit = defineEmits<{ submit: [input: PlayerInput]; cancel: [] }>()

const form = reactive({
  prenom: props.initial?.prenom ?? '',
  nom: props.initial?.nom ?? '',
  numero: props.initial ? String(props.initial.numero) : '',
  poste: props.initial?.poste ?? ('Handler' as Position),
})
const error = ref('')
const firstNameInput = ref<HTMLInputElement | null>(null)

const positions = [
  { value: 'Handler' as const, label: fr.common.handler },
  { value: 'Middle' as const, label: fr.common.middle },
]

function submit(): void {
  const numero = Number(form.numero)
  if (!form.prenom.trim() || !form.nom.trim() || form.numero === '') {
    error.value = fr.common.required
    return
  }
  if (!Number.isInteger(numero) || numero < 0 || numero > MAX_NUMBER) {
    error.value = fr.roster.numberRange
    return
  }
  error.value = ''
  emit('submit', { prenom: form.prenom.trim(), nom: form.nom.trim(), numero, poste: form.poste })
}

/** Vide le formulaire et replace le curseur dans « Prénom » pour enchaîner les ajouts. */
function reset(): void {
  form.prenom = ''
  form.nom = ''
  form.numero = ''
  firstNameInput.value?.focus()
}

defineExpose({ reset })
</script>

<template>
  <form class="stack" novalidate @submit.prevent="submit">
    <div class="form-grid">
      <label class="form-field">
        <span>{{ fr.roster.firstName }}</span>
        <input ref="firstNameInput" v-model="form.prenom" required autocomplete="off" />
      </label>
      <label class="form-field">
        <span>{{ fr.roster.lastName }}</span>
        <input v-model="form.nom" required autocomplete="off" />
      </label>
      <label class="form-field">
        <span>{{ fr.roster.number }}</span>
        <input
          v-model="form.numero"
          required
          type="number"
          inputmode="numeric"
          min="0"
          :max="MAX_NUMBER"
        />
      </label>
    </div>
    <SegmentedControl v-model="form.poste" :label="fr.roster.position" :options="positions" />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <div class="row">
      <button type="submit" class="btn btn-primary">{{ submitLabel }}</button>
      <button v-if="cancellable" type="button" class="btn" @click="emit('cancel')">
        {{ fr.common.cancel }}
      </button>
    </div>
  </form>
</template>
