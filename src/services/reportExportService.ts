// Export des rapports en PDF (A4) ou en image PNG, entièrement dans le navigateur.
// Les bibliothèques (html-to-image, jspdf) sont chargées à la demande, au premier export.

import { paginate, type PrintBlock } from '@/domain/export/paginate'

export type ExportFormat = 'pdf' | 'png'

export const PRINT_WIDTH: Record<ExportFormat, number> = { pdf: 794, png: 1080 }
const PIXEL_RATIO = 2
const MAX_PNG_HEIGHT = 6000
const MM_PER_PX = 25.4 / 96
const PAGE = { widthMm: 210, heightMm: 297, marginMm: 15, footerMm: 8 }
const BLOCK_GAP_PX = 16
/** JPEG : un PDF de quelques Mo au lieu de plusieurs dizaines avec des PNG non compressés. */
const JPEG_QUALITY = 0.92
const BLOCK_SELECTOR = '.print-block'

interface MeasuredBlock extends PrintBlock {
  width: number
  rowTops?: number[]
}

function measureBlock(element: HTMLElement): MeasuredBlock {
  const box = element.getBoundingClientRect()
  const table = element.querySelector('table.print-table')
  const head = table?.querySelector('thead')
  if (!table || !head) return { height: box.height, width: box.width }
  const rows = [...table.querySelectorAll('tbody tr')].map((row) => row.getBoundingClientRect())
  return {
    height: box.height,
    width: box.width,
    headerHeight: head.getBoundingClientRect().bottom - box.top,
    rowHeights: rows.map((row) => row.height),
    rowTops: rows.map((row) => row.top - box.top),
  }
}

/** Morceau de tableau : en-tête répété + lignes [start, end[. */
function cropTable(
  source: HTMLCanvasElement,
  block: MeasuredBlock,
  [start, end]: [number, number],
) {
  const header = (block.headerHeight ?? 0) * PIXEL_RATIO
  const top = (block.rowTops?.[start] ?? 0) * PIXEL_RATIO
  const lastTop = block.rowTops?.[end - 1] ?? 0
  const bottom = (lastTop + (block.rowHeights?.[end - 1] ?? 0)) * PIXEL_RATIO
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = Math.ceil(header + bottom - top)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponible')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, source.width, header, 0, 0, source.width, header)
  context.drawImage(
    source,
    0,
    top,
    source.width,
    bottom - top,
    0,
    header,
    source.width,
    bottom - top,
  )
  return canvas
}

function captureOptions(fontEmbedCSS: string) {
  return { pixelRatio: PIXEL_RATIO, backgroundColor: '#ffffff', fontEmbedCSS }
}

/** Une seule image haute ; 'too_tall' au-delà de 6 000 px (le PDF est alors proposé). */
export async function createPng(root: HTMLElement): Promise<Blob | 'too_tall'> {
  await document.fonts.ready
  if (root.getBoundingClientRect().height > MAX_PNG_HEIGHT) return 'too_tall'
  const { getFontEmbedCSS, toBlob } = await import('html-to-image')
  const blob = await toBlob(root, captureOptions(await getFontEmbedCSS(root)))
  if (!blob) throw new Error('Image vide')
  return blob
}

/** PDF A4 portrait : chaque bloc devient une image, jamais coupée entre deux pages. */
export async function createPdf(root: HTMLElement, footerText: string): Promise<Blob> {
  await document.fonts.ready
  const [{ getFontEmbedCSS, toCanvas }, { jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ])
  const elements = [...root.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)]
  const blocks = elements.map(measureBlock)
  const options = captureOptions(await getFontEmbedCSS(root))
  const canvases: HTMLCanvasElement[] = []
  for (const element of elements) canvases.push(await toCanvas(element, options))

  const usableHeightMm = PAGE.heightMm - 2 * PAGE.marginMm - PAGE.footerMm
  const pageHeightPx = usableHeightMm / MM_PER_PX
  const pages = paginate(blocks, pageHeightPx, BLOCK_GAP_PX)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage()
    for (const slice of page) {
      const block = blocks[slice.block]!
      const canvas = slice.rows
        ? cropTable(canvases[slice.block]!, block, slice.rows)
        : canvases[slice.block]!
      // Un bloc plus haut qu'une page est réduit pour rester entier.
      const scale = Math.min(1, pageHeightPx / slice.height)
      const widthMm = block.width * MM_PER_PX * scale
      const heightMm = slice.height * MM_PER_PX * scale
      const topMm = PAGE.marginMm + slice.top * MM_PER_PX
      const image = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      pdf.addImage(image, 'JPEG', PAGE.marginMm, topMm, widthMm, heightMm)
    }
    pdf.setFontSize(9)
    pdf.setTextColor(90)
    const footerY = PAGE.heightMm - PAGE.marginMm + 4
    pdf.text(footerText, PAGE.marginMm, footerY)
    pdf.text(`${pageIndex + 1} / ${pages.length}`, PAGE.widthMm - PAGE.marginMm, footerY, {
      align: 'right',
    })
  })
  return pdf.output('blob')
}

/** Partage direct possible : téléphone (pointeur tactile) dont le navigateur sait partager des fichiers. */
export function canShareFile(file: File): boolean {
  try {
    return (
      window.matchMedia('(pointer: coarse)').matches &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    )
  } catch {
    return false
  }
}

/** Ouvre la feuille de partage du système ; false si l'utilisateur annule ou en cas d'échec. */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: file.name })
    return true
  } catch {
    return false
  }
}
