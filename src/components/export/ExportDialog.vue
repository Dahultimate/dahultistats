<script setup lang="ts" generic="C extends string">
// Fenêtre « PDF / Image » : choix du format (et du contenu pour un match), création du fichier,
// puis partage (téléphone) ou téléchargement.
import { computed, nextTick, type Ref, ref, watch } from 'vue'

import BaseDialog from '@/components/ui/BaseDialog.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { formatShortDate, toIsoDate } from '@/domain/format'
import { fr } from '@/i18n/fr'
import { downloadBlob } from '@/services/fileService'
import {
  canShareFile,
  createPdf,
  createPng,
  type ExportFormat,
  PRINT_WIDTH,
  shareFile,
} from '@/services/reportExportService'
import { useUiStore } from '@/stores/uiStore'

import PrintLayout from './PrintLayout.vue'

export interface ExportDescription {
  fileName: string
  title: string
  lines: string[]
}

const props = defineProps<{
  contentOptions?: { value: C; label: string; pdfOnly?: boolean }[]
  defaultContent: C
  describe: (format: ExportFormat, content: C) => ExportDescription
}>()
const open = defineModel<boolean>('open', { required: true })

const ui = useUiStore()
const format = ref<ExportFormat>('pdf')
const content = ref(props.defaultContent) as Ref<C>
const status = ref<'idle' | 'preparing' | 'ready' | 'error'>('idle')
const notice = ref('')
const readyFile = ref<File | null>(null)
const layout = ref<InstanceType<typeof PrintLayout> | null>(null)

const formatOptions = [
  { value: 'pdf' as const, label: fr.export.pdf },
  { value: 'png' as const, label: fr.export.png },
]
const contentChoices = computed(() =>
  (props.contentOptions ?? []).map((option) => ({
    ...option,
    disabled: option.pdfOnly && format.value === 'png',
  })),
)
const description = computed(() => props.describe(format.value, content.value))
const footer = fr.export.generatedOn(formatShortDate(toIsoDate(new Date())))

watch(open, (isOpen) => {
  if (!isOpen) return
  format.value = 'pdf'
  content.value = props.defaultContent
  status.value = 'idle'
  notice.value = ''
  readyFile.value = null
})

watch(format, (value) => {
  const current = props.contentOptions?.find((option) => option.value === content.value)
  if (value === 'png' && current?.pdfOnly) {
    content.value = props.contentOptions?.[0]?.value ?? props.defaultContent
    notice.value = fr.export.completePdfOnly
  }
})

async function create(): Promise<void> {
  status.value = 'preparing'
  notice.value = ''
  await nextTick()
  const root = layout.value?.root
  try {
    if (!root) throw new Error('Mise en page absente')
    const result = format.value === 'png' ? await createPng(root) : await createPdf(root, footer)
    if (result === 'too_tall') {
      format.value = 'pdf'
      notice.value = fr.export.tooTall
      status.value = 'idle'
      return
    }
    const file = new File([result], `${description.value.fileName}.${format.value}`, {
      type: result.type,
    })
    if (canShareFile(file)) {
      readyFile.value = file
      status.value = 'ready'
      return
    }
    if (!downloadBlob(file.name, file)) throw new Error('Téléchargement impossible')
    ui.toast(fr.export.downloaded(file.name))
    open.value = false
  } catch {
    status.value = 'error'
  }
}

async function share(): Promise<void> {
  if (readyFile.value && (await shareFile(readyFile.value))) open.value = false
}

function download(): void {
  if (!readyFile.value) return
  downloadBlob(readyFile.value.name, readyFile.value)
  ui.toast(fr.export.downloaded(readyFile.value.name))
  open.value = false
}
</script>

<template>
  <BaseDialog :open="open" :title="fr.export.dialogTitle" @close="open = false">
    <SegmentedControl v-model="format" :label="fr.export.format" :options="formatOptions" />
    <SegmentedControl
      v-if="contentOptions"
      v-model="content"
      :label="fr.export.content"
      :options="contentChoices"
    />
    <p v-if="notice" class="small">{{ notice }}</p>
    <p v-if="status === 'preparing'" role="status">{{ fr.export.preparing }}</p>
    <p v-if="status === 'error'" class="error" role="alert">{{ fr.export.failed }}</p>
    <p v-if="status === 'ready' && readyFile" role="status">
      {{ fr.export.ready(readyFile.name) }}
    </p>
    <template #actions>
      <button type="button" class="btn" @click="open = false">{{ fr.common.cancel }}</button>
      <template v-if="status === 'ready'">
        <button type="button" class="btn" @click="download">{{ fr.export.download }}</button>
        <button type="button" class="btn btn-primary" @click="share">{{ fr.export.share }}</button>
      </template>
      <button
        v-else
        type="button"
        class="btn btn-primary"
        :disabled="status === 'preparing'"
        @click="create"
      >
        {{ fr.export.create }}
      </button>
    </template>
  </BaseDialog>
  <PrintLayout
    v-if="status === 'preparing'"
    ref="layout"
    :width="PRINT_WIDTH[format]"
    :title="description.title"
    :lines="description.lines"
    :footer="footer"
  >
    <slot name="print" :content="content" />
  </PrintLayout>
</template>
