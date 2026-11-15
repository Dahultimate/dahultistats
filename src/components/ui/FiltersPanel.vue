<script setup lang="ts">
// Filtres des statistiques (fiche joueur et statistiques globales). Les champs affichés sont choisis par la vue.
import { MATCH_TYPE_LABELS, MATCH_TYPES } from '@/domain/constants'
import type { StatsFilters } from '@/domain/filters'
import { fr } from '@/i18n/fr'

const filters = defineModel<StatsFilters>('filters', { required: true })
defineProps<{
  count: number
  events: string[]
  teams?: { id: string; nom: string }[]
  matches?: { id: string; label: string }[]
  showType?: boolean
}>()
const emit = defineEmits<{ clear: [] }>()
</script>

<template>
  <section class="card stack" aria-labelledby="filters-title">
    <h2 id="filters-title" class="visually-hidden">{{ fr.stats.filters }}</h2>
    <div class="form-grid">
      <label v-if="matches" class="form-field">
        <span>{{ fr.player.filterMatch }}</span>
        <select v-model="filters.matchId">
          <option value="">{{ fr.player.allMatches }}</option>
          <option v-for="match in matches" :key="match.id" :value="match.id">
            {{ match.label }}
          </option>
        </select>
      </label>
      <label class="form-field">
        <span>{{ fr.stats.event }}</span>
        <select v-model="filters.event">
          <option value="">{{ fr.stats.allEvents }}</option>
          <option v-for="name in events" :key="name" :value="name">{{ name }}</option>
        </select>
      </label>
      <label v-if="teams" class="form-field">
        <span>{{ fr.stats.team }}</span>
        <select v-model="filters.teamId">
          <option value="">{{ fr.stats.allTeams }}</option>
          <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.nom }}</option>
        </select>
      </label>
      <label v-if="showType" class="form-field">
        <span>{{ fr.stats.type }}</span>
        <select v-model="filters.type">
          <option value="">{{ fr.stats.allTypes }}</option>
          <option v-for="type in MATCH_TYPES" :key="type" :value="type">
            {{ MATCH_TYPE_LABELS[type] }}
          </option>
        </select>
      </label>
      <label class="form-field">
        <span>{{ fr.stats.from }}</span>
        <input v-model="filters.from" type="date" />
      </label>
      <label class="form-field">
        <span>{{ fr.stats.to }}</span>
        <input v-model="filters.to" type="date" />
      </label>
    </div>
    <div class="row">
      <strong>{{ fr.common.matchesKept(count) }}</strong>
      <button type="button" class="btn btn-ghost" @click="emit('clear')">
        {{ fr.common.clearFilters }}
      </button>
    </div>
  </section>
</template>
