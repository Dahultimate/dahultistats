// Répartit des blocs de hauteurs connues sur des pages A4 sans jamais couper un bloc.
// Un tableau (bloc avec des lignes) peut continuer sur la page suivante en répétant son en-tête.

export interface PrintBlock {
  height: number
  /** Pour un tableau : hauteur de la ligne d'en-tête répétée sur chaque page. */
  headerHeight?: number
  /** Pour un tableau : hauteur de chaque ligne de données. */
  rowHeights?: number[]
}

export interface PlacedSlice {
  block: number
  /** Position verticale sur la page (0 = haut de la zone imprimable). */
  top: number
  height: number
  /** Pour un tableau : lignes [début, fin[ placées sur cette page, sous l'en-tête répété. */
  rows?: [number, number]
}

/** Nombre de lignes qui tiennent dans `available`, à partir de `start`. */
function rowsThatFit(rowHeights: number[], start: number, available: number): number {
  let used = 0
  let count = 0
  while (start + count < rowHeights.length && used + rowHeights[start + count]! <= available) {
    used += rowHeights[start + count]!
    count++
  }
  return count
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function paginate(blocks: PrintBlock[], pageHeight: number, gap = 0): PlacedSlice[][] {
  const pages: PlacedSlice[][] = [[]]
  let y = 0
  const newPage = () => {
    pages.push([])
    y = 0
  }
  const place = (slice: PlacedSlice) => {
    pages[pages.length - 1]!.push(slice)
    y += slice.height + gap
  }

  blocks.forEach((block, index) => {
    if (!block.rowHeights) {
      // Un bloc plus haut qu'une page reste entier, seul sur sa page (réduit au rendu).
      if (y > 0 && y + block.height > pageHeight) newPage()
      place({ block: index, top: y, height: block.height })
      return
    }
    const header = block.headerHeight ?? 0
    let start = 0
    while (start < block.rowHeights.length) {
      let count = rowsThatFit(block.rowHeights, start, pageHeight - y - header)
      if (count === 0 && y > 0) {
        newPage()
        continue
      }
      count = Math.max(count, 1)
      const rows = block.rowHeights.slice(start, start + count)
      place({ block: index, top: y, height: header + sum(rows), rows: [start, start + count] })
      start += count
      if (start < block.rowHeights.length) newPage()
    }
  })
  return pages
}
