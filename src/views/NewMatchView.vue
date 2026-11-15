<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { FIELD_TYPE_LABELS, FIELD_TYPES, MATCH_TYPE_LABELS, MATCH_TYPES } from '@/domain/constants'
import { eventNames } from '@/domain/filters'
import { toIsoDate } from '@/domain/format'
import type { FieldType, MatchType } from '@/domain/types'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'

const router = useRouter()
const dataStore = useDataStore()

const form = reactive({
  date: toIsoDate(new Date()),
  equipeId: dataStore.teams[0]?.id ?? '',
  adversaire: '',
  evenement: '',
  terrain: 'outdoor' as FieldType,
  type: 'competition' as MatchType,
})
const error = ref('')
const suggestions = eventNames(dataStore.matches)

const fieldOptions = FIELD_TYPES.map((value) => ({ value, label: FIELD_TYPE_LABELS[value] }))
const typeOptions = MATCH_TYPES.map((value) => ({ value, label: MATCH_TYPE_LABELS[value] }))

function start(): void {
  if (!form.date || !form.equipeId || !form.adversaire.trim() || !form.evenement.trim()) {
    error.value = fr.newMatch.allRequired
    return
  }
  const match = dataStore.createMatch({
    ...form,
    adversaire: form.adversaire.trim(),
    evenement: form.evenement.trim(),
  })
  router.push({ name: 'line', params: { id: match.id } })
}
</script>

<template>
  <div v-if="dataStore.teams.length === 0" class="page">
    <section class="card stack">
      <p>{{ fr.newMatch.noTeam }}</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'team-edit', params: { id: 'nouvelle' } }">
        {{ fr.teams.create }}
      </RouterLink>
    </section>
  </div>
  <form v-else class="page" novalidate @submit.prevent="start">
    <section class="card stack">
      <label class="form-field">
        <span>{{ fr.newMatch.date }}</span>
        <input v-model="form.date" type="date" required />
      </label>
      <label class="form-field">
        <span>{{ fr.newMatch.team }}</span>
        <select v-model="form.equipeId" required>
          <option v-for="team in dataStore.teams" :key="team.id" :value="team.id">
            {{ fr.newMatch.teamOption(team.nom, team.joueurs.length) }}
          </option>
        </select>
      </label>
      <label class="form-field">
        <span>{{ fr.newMatch.opponent }}</span>
        <input v-model="form.adversaire" required autocomplete="off" />
      </label>
      <label class="form-field">
        <span>{{ fr.newMatch.event }}</span>
        <input
          v-model="form.evenement"
          required
          list="event-suggestions"
          autocomplete="off"
          :placeholder="fr.newMatch.eventHint"
        />
        <datalist id="event-suggestions">
          <option v-for="name in suggestions" :key="name" :value="name"></option>
        </datalist>
      </label>
      <SegmentedControl
        v-model="form.terrain"
        :label="fr.newMatch.fieldType"
        :options="fieldOptions"
      />
      <SegmentedControl v-model="form.type" :label="fr.newMatch.matchType" :options="typeOptions" />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary btn-big">{{ fr.newMatch.start }}</button>
    </section>
  </form>
</template>
