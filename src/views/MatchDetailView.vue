<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ExportButton from '@/components/export/ExportButton.vue'
import ExportDialog from '@/components/export/ExportDialog.vue'
import CollectiveReport from '@/components/reports/CollectiveReport.vue'
import IndividualReport from '@/components/reports/IndividualReport.vue'
import PointByPoint from '@/components/reports/PointByPoint.vue'
import ScoreBoard from '@/components/ui/ScoreBoard.vue'
import { FIELD_TYPE_LABELS, MATCH_TYPE_LABELS } from '@/domain/constants'
import { type MatchReportContent, matchReportFileName } from '@/domain/export/fileName'
import { formatLongDate } from '@/domain/format'
import { buildMatchReport } from '@/domain/reports'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useUiStore } from '@/stores/uiStore'

type Tab = 'collective' | 'individual' | 'points'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()
const ui = useUiStore()

const tab = ref<Tab>('collective')
const exportOpen = ref(false)
const match = computed(() => dataStore.findMatch(String(route.params.id)))
const report = computed(() => (match.value ? buildMatchReport(match.value) : null))
const details = computed(() => {
  const m = match.value
  return m
    ? [
        formatLongDate(m.date),
        m.evenement,
        FIELD_TYPE_LABELS[m.terrain],
        MATCH_TYPE_LABELS[m.type],
      ].join(' · ')
    : ''
})

const tabs: { key: Tab; label: string }[] = [
  { key: 'collective', label: fr.match.tabs.collective },
  { key: 'individual', label: fr.match.tabs.individual },
  { key: 'points', label: fr.match.tabs.points },
]
const contentOptions = [
  { value: 'collectif' as const, label: fr.export.collective },
  { value: 'individuel' as const, label: fr.export.individual },
  { value: 'complet' as const, label: fr.export.complete, pdfOnly: true },
]
const TAB_CONTENT: Record<Tab, MatchReportContent> = {
  collective: 'collectif',
  individual: 'individuel',
  points: 'complet',
}
const TITLES = {
  collectif: fr.export.collectiveTitle,
  individuel: fr.export.individualTitle,
  complet: fr.export.completeTitle,
}

function describeExport(_format: string, content: MatchReportContent) {
  const m = match.value!
  const score = report.value!.score
  return {
    fileName: matchReportFileName(m, content),
    title: TITLES[content](m.equipeNom, m.adversaire),
    lines: [details.value, `${m.equipeNom} ${score.us} – ${score.them} ${m.adversaire}`],
  }
}

function resume(): void {
  if (!match.value) return
  if (match.value.termine) dataStore.setMatchFinished(match.value.id, false)
  router.push({ name: 'line', params: { id: match.value.id } })
}

async function remove(): Promise<void> {
  if (!match.value) return
  const confirmed = await ui.confirm({
    title: fr.match.deleteConfirm,
    message: fr.match.deleteMessage,
    confirmLabel: fr.match.delete,
    danger: true,
  })
  if (!confirmed) return
  dataStore.deleteMatch(match.value.id)
  ui.toast(fr.match.deleted)
  router.push({ name: 'history' })
}
</script>

<template>
  <div v-if="!match || !report" class="page">
    <p>{{ fr.match.notFound }}</p>
  </div>
  <div v-else class="page">
    <section class="card stack">
      <ScoreBoard
        :our-name="match.equipeNom"
        :their-name="match.adversaire"
        :us="report.score.us"
        :them="report.score.them"
      />
      <p class="muted">{{ details }}</p>
      <div class="row">
        <span class="badge" :class="match.termine ? 'badge-success' : 'badge-warning'">
          {{ match.termine ? fr.match.finished : fr.match.inProgress }}
        </span>
      </div>
      <div class="row">
        <button type="button" class="btn btn-primary" @click="resume">
          {{ match.termine ? fr.match.reopen : fr.match.resume }}
        </button>
        <ExportButton v-if="match.points.length > 0" @click="exportOpen = true" />
        <button type="button" class="btn btn-danger" @click="remove">{{ fr.match.delete }}</button>
      </div>
    </section>

    <p v-if="match.points.length === 0" class="card">{{ fr.match.noPoints }}</p>
    <template v-else>
      <div class="tabs" role="tablist">
        <button
          v-for="item in tabs"
          :id="`tab-${item.key}`"
          :key="item.key"
          type="button"
          role="tab"
          class="tab"
          :aria-selected="tab === item.key"
          :aria-controls="`panel-${item.key}`"
          @click="tab = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <div :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`">
        <CollectiveReport
          v-if="tab === 'collective'"
          :match="match"
          :report="report"
          :find-player="dataStore.findPlayer"
          mode="screen"
        />
        <IndividualReport
          v-if="tab === 'individual'"
          :players="report.tablePlayers"
          :find-player="dataStore.findPlayer"
          mode="screen"
        />
        <PointByPoint
          v-if="tab === 'points'"
          :match="match"
          :find-player="dataStore.findPlayer"
          mode="screen"
        />
      </div>
    </template>

    <ExportDialog
      v-model:open="exportOpen"
      :content-options="contentOptions"
      :default-content="TAB_CONTENT[tab]"
      :describe="describeExport"
    >
      <template #print="{ content }">
        <CollectiveReport
          v-if="content !== 'individuel'"
          :match="match"
          :report="report"
          :find-player="dataStore.findPlayer"
          mode="print"
        />
        <IndividualReport
          v-if="content !== 'collectif'"
          :players="report.tablePlayers"
          :find-player="dataStore.findPlayer"
          mode="print"
        />
        <PointByPoint
          v-if="content === 'complet'"
          :match="match"
          :find-player="dataStore.findPlayer"
          mode="print"
        />
      </template>
    </ExportDialog>
  </div>
</template>
