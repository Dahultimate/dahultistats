<script setup lang="ts">
// « Joueurs du match » : MVP (mis en avant en doré), passeur décisif, apport offensif, défenseur.
import { computed } from 'vue'

import { formatNumber } from '@/domain/format'
import type { PlayerStats } from '@/domain/stats/computeStats'
import type { Leaders } from '@/domain/stats/leaders'
import type { Player } from '@/domain/types'
import { fr } from '@/i18n/fr'

import ReportSection from './ReportSection.vue'

const props = defineProps<{
  leaders: Leaders
  findPlayer: (id: string) => Player | undefined
  mode: 'screen' | 'print'
}>()

function card(key: keyof Leaders, title: string, value: (stats: PlayerStats) => string) {
  const stats = props.leaders[key]
  const player = stats ? props.findPlayer(stats.playerId) : undefined
  return {
    key,
    title,
    number: player ? `#${player.numero}` : '',
    name: stats ? (player ? `${player.prenom} ${player.nom}` : '?') : fr.reports.nobody,
    value: stats ? value(stats) : '',
    detail: stats
      ? fr.reports.leaderDetail(stats.goals, stats.assists, stats.blocks, stats.turns)
      : '',
  }
}

const cards = computed(() => [
  card('mvp', fr.reports.mvp, (s) => fr.reports.indexValue(formatNumber(s.mvpIndex))),
  card('topAssister', fr.reports.topAssister, (s) => fr.reports.assistsValue(s.assists)),
  card('topOffense', fr.reports.topOffense, (s) =>
    fr.reports.offenseValue(formatNumber(s.offensiveImpact)),
  ),
  card('topDefender', fr.reports.topDefender, (s) =>
    fr.reports.defenseValue(formatNumber(s.defensiveImpact)),
  ),
])
</script>

<template>
  <ReportSection :title="fr.reports.leaders">
    <div class="leaders">
      <article
        v-for="item in cards"
        :key="item.key"
        class="leader"
        :class="{ mvp: item.key === 'mvp' }"
      >
        <span class="leader-title">{{ item.key === 'mvp' ? '★ ' : '' }}{{ item.title }}</span>
        <strong class="leader-name">
          <span v-if="item.number" class="leader-number">{{ item.number }}</span> {{ item.name }}
        </strong>
        <span v-if="item.value" class="leader-value">{{ item.value }}</span>
        <span class="small muted">{{ item.detail }}</span>
      </article>
    </div>
    <details v-if="mode === 'screen'">
      <summary class="btn-link">{{ fr.reports.howComputed }}</summary>
      <ul class="small">
        <li>{{ fr.reports.formulaOffense }}</li>
        <li>{{ fr.reports.formulaDefense }}</li>
        <li>{{ fr.reports.formulaMvp }}</li>
      </ul>
    </details>
    <ul v-else class="small muted">
      <li>{{ fr.reports.formulaOffense }}</li>
      <li>{{ fr.reports.formulaDefense }}</li>
      <li>{{ fr.reports.formulaMvp }}</li>
    </ul>
  </ReportSection>
</template>

<style scoped>
.leaders {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.leader {
  display: grid;
  gap: 2px;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.leader.mvp {
  border: 2px solid var(--gold);
  background: var(--gold-bg);
}

.leader-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ink-muted);
}

.leader-name {
  font-family: var(--font-title);
  font-size: 1.3rem;
}

.leader-number {
  font-size: 1.6rem;
}

.leader-value {
  font-weight: 700;
}
</style>
