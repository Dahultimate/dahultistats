<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import ExportButton from '@/components/export/ExportButton.vue'
import ExportDialog from '@/components/export/ExportDialog.vue'
import GlobalReport from '@/components/reports/GlobalReport.vue'
import FiltersPanel from '@/components/ui/FiltersPanel.vue'
import { describeFilters } from '@/domain/export/describeFilters'
import { globalReportFileName } from '@/domain/export/fileName'
import { eventNames, filterMatches } from '@/domain/filters'
import { buildGlobalReport } from '@/domain/reports'
import { fr } from '@/i18n/fr'
import { useDataStore } from '@/stores/dataStore'
import { useFiltersStore } from '@/stores/filtersStore'

const dataStore = useDataStore()
const filtersStore = useFiltersStore()
const { global: filters } = storeToRefs(filtersStore)

const exportOpen = ref(false)
const heatmapKey = ref('receptions')

const selected = computed(() => filterMatches(dataStore.matches, filters.value))
const report = computed(() => buildGlobalReport(selected.value))

function describeExport() {
  return {
    fileName: globalReportFileName(filters.value),
    title: fr.export.globalTitle,
    lines: [describeFilters(filters.value, { teams: dataStore.teams, matches: dataStore.matches })],
  }
}
</script>

<template>
  <div class="page">
    <FiltersPanel
      v-model:filters="filters"
      :count="selected.length"
      :events="eventNames(dataStore.matches)"
      :teams="dataStore.teams"
      show-type
      @clear="filtersStore.clearGlobal"
    />
    <div class="row">
      <ExportButton @click="exportOpen = true" />
    </div>
    <GlobalReport
      v-model:heatmap-key="heatmapKey"
      :report="report"
      :find-player="dataStore.findPlayer"
      mode="screen"
    />
    <ExportDialog v-model:open="exportOpen" default-content="global" :describe="describeExport">
      <template #print>
        <GlobalReport
          v-model:heatmap-key="heatmapKey"
          :report="report"
          :find-player="dataStore.findPlayer"
          mode="print"
        />
      </template>
    </ExportDialog>
  </div>
</template>
