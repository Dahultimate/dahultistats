<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PlayerChipGrid from '@/components/field/PlayerChipGrid.vue'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const ui = useUiStore()

const existing = dataStore.findTeam(String(route.params.id))
const name = ref(existing?.nom ?? '')
// Les anciens joueurs ne sont plus proposés : ils sortent des équipes quand on les retire.
const members = ref<string[]>(
  existing?.joueurs.filter((id) => dataStore.findPlayer(id)?.actif) ?? [],
)
const error = ref('')

const activeIds = computed(() => dataStore.activePlayers.map((player) => player.id))

function toggle(id: string): void {
  members.value = members.value.includes(id)
    ? members.value.filter((other) => other !== id)
    : [...members.value, id]
}

function save(): void {
  if (!name.value.trim()) {
    error.value = fr.teams.nameRequired
    return
  }
  dataStore.saveTeam(existing?.id ?? null, { nom: name.value.trim(), joueurs: members.value })
  ui.toast(fr.teams.saved)
  router.push({ name: 'teams' })
}

async function remove(): Promise<void> {
  if (!existing) return
  const confirmed = await ui.confirm({
    title: fr.teams.deleteConfirm(existing.nom),
    message: fr.teams.deleteMessage,
    confirmLabel: fr.teams.delete,
    danger: true,
  })
  if (!confirmed) return
  dataStore.deleteTeam(existing.id)
  ui.toast(fr.teams.deleted)
  router.push({ name: 'teams' })
}
</script>

<template>
  <form class="page" novalidate @submit.prevent="save">
    <section class="card stack">
      <label class="form-field">
        <span>{{ fr.teams.name }}</span>
        <input v-model="name" required autocomplete="off" />
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>

    <section class="card stack" aria-labelledby="members-title">
      <div class="section-title">
        <h2 id="members-title">{{ fr.teams.players }}</h2>
        <div class="row">
          <button type="button" class="btn" @click="members = [...activeIds]">
            {{ fr.common.all }}
          </button>
          <button type="button" class="btn" @click="members = []">{{ fr.common.none }}</button>
        </div>
      </div>
      <p v-if="activeIds.length === 0" class="muted">{{ fr.teams.noActivePlayers }}</p>
      <PlayerChipGrid
        :players="dataStore.activePlayers"
        :selected="members"
        :label="fr.teams.players"
        grouped
        @toggle="toggle"
      />
    </section>

    <div class="row">
      <button type="submit" class="btn btn-primary btn-big">
        {{ existing ? fr.common.save : fr.teams.createSubmit }}
      </button>
      <button v-if="existing" type="button" class="btn btn-danger" @click="remove">
        {{ fr.teams.delete }}
      </button>
    </div>
  </form>
</template>
