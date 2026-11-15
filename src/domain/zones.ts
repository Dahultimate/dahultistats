// Zones du terrain : identifiants, noms affichés et correspondance écran ↔ zones enregistrées.
// Une zone est toujours exprimée dans le sens de NOTRE attaque, quel que soit le sens affiché.

import type { Lane, PullZone, Rank, ZoneId } from './types'

export const RANKS: Rank[] = ['D', 'M1', 'M2', 'M3', 'A']
export const LANES: Lane[] = ['L', 'C', 'R']
/** Les 9 zones de jeu + les 6 zones d'en-but. */
export const ALL_ZONES: ZoneId[] = RANKS.flatMap((rank) => LANES.map((lane) => zoneId(rank, lane)))

const RANK_NAMES: Record<Rank, string> = {
  D: 'Notre en-but',
  M1: 'Tiers défensif',
  M2: 'Milieu',
  M3: 'Tiers offensif',
  A: 'En-but adverse',
}

const LANE_NAMES: Record<Lane, string> = { L: 'gauche', C: 'centre', R: 'droite' }

export function zoneId(rank: Rank, lane: Lane): ZoneId {
  return `${rank}-${lane}`
}

export function rankOf(zone: ZoneId): Rank {
  return zone.split('-')[0] as Rank
}

export function isOpponentEndzone(zone: ZoneId | null): boolean {
  return zone !== null && rankOf(zone) === 'A'
}

export function zoneName(zone: PullZone | null): string {
  if (zone === null) return ''
  if (zone === 'brick') return 'Brick'
  const [rank, lane] = zone.split('-') as [Rank, Lane]
  return `${RANK_NAMES[rank] ?? rank} ${LANE_NAMES[lane] ?? lane}`
}

/**
 * Grille affichée à l'écran (terrain horizontal) : rangées de haut en bas, colonnes de gauche à droite.
 * Vers la droite : colonnes D→A, rangées L, C, R. Vers la gauche : colonnes A→D, rangées R, C, L.
 */
export function screenGrid(attackRight: boolean): ZoneId[][] {
  const columns = attackRight ? RANKS : [...RANKS].reverse()
  const rows = attackRight ? LANES : [...LANES].reverse()
  return rows.map((lane) => columns.map((rank) => zoneId(rank, lane)))
}

/** Grille de la carte de chaleur (terrain vertical, notre attaque vers le haut). */
export function heatmapGrid(): ZoneId[][] {
  return [...RANKS].reverse().map((rank) => LANES.map((lane) => zoneId(rank, lane)))
}
