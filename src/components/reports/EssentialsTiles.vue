<script setup lang="ts">
// « L'essentiel » : quatre tuiles avec jauge (%, « x / y » et explication).
import { computed } from 'vue'

import KpiTile from '@/components/ui/KpiTile.vue'
import { formatPercent } from '@/domain/format'
import type { Essentials, Ratio } from '@/domain/reports'
import { fr } from '@/i18n/fr'

import ReportSection from './ReportSection.vue'

const props = defineProps<{ essentials: Essentials }>()

function tile(label: string, ratio: Ratio, explanation: string) {
  const { numerator, denominator } = ratio
  return {
    label,
    explanation,
    value: formatPercent(numerator, denominator),
    detail: `${numerator} / ${denominator}`,
    gauge: denominator > 0 ? numerator / denominator : null,
  }
}

const tiles = computed(() => [
  tile(fr.reports.hold, props.essentials.hold, fr.reports.holdHelp),
  tile(fr.reports.conversion, props.essentials.recoveryConversion, fr.reports.conversionHelp),
  tile(fr.reports.clean, props.essentials.cleanOffense, fr.reports.cleanHelp),
  tile(fr.reports.break, props.essentials.break, fr.reports.breakHelp),
])
</script>

<template>
  <ReportSection :title="fr.reports.essentials">
    <div class="tiles">
      <KpiTile v-for="item in tiles" :key="item.label" v-bind="item" />
    </div>
  </ReportSection>
</template>
