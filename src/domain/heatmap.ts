// Carte de chaleur : densité des actions sur une grille, calculée à partir de leurs positions
// (chaque action est étalée par un noyau gaussien).

import type { FieldPosition } from './types'

/** Rapport largeur / longueur du terrain dessiné (100 × 52). */
export const FIELD_ASPECT = 0.52
/** Étalement d'une action, en fraction de la longueur du terrain. */
const SPREAD = 0.05

export interface DensityGrid {
  /** Cellules dans la largeur (de gauche à droite). */
  columns: number
  /** Cellules dans la longueur (de notre en-but à l'en-but adverse). */
  rows: number
  /** Densité de chaque cellule : index = rangée × columns + colonne. */
  values: number[]
  max: number
}

export function densityGrid(
  positions: readonly FieldPosition[],
  columns: number,
  rows: number,
): DensityGrid {
  const values: number[] = []
  for (let row = 0; row < rows; row++) {
    const x = (row + 0.5) / rows
    for (let column = 0; column < columns; column++) {
      const y = (column + 0.5) / columns
      let density = 0
      for (const position of positions) {
        const dx = position.x - x
        const dy = (position.y - y) * FIELD_ASPECT
        density += Math.exp(-(dx * dx + dy * dy) / (2 * SPREAD * SPREAD))
      }
      values.push(density)
    }
  }
  return { columns, rows, values, max: Math.max(0, ...values) }
}

/** Position du centre de la cellule la plus dense, ou null sans action. */
export function densestPosition(grid: DensityGrid): FieldPosition | null {
  if (grid.max === 0) return null
  const index = grid.values.indexOf(grid.max)
  const row = Math.floor(index / grid.columns)
  const column = index % grid.columns
  return { x: (row + 0.5) / grid.rows, y: (column + 0.5) / grid.columns }
}
