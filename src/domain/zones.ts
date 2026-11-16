// Zones du terrain : elles ne sont plus saisies, mais servent à nommer l'endroit d'une action
// (« Milieu droite »), à reconnaître l'en-but adverse et à relire les anciens fichiers.
// Les positions sont toujours exprimées dans le sens de NOTRE attaque.

import type { FieldPosition, Lane, Rank, ZoneId } from './types'

export const RANKS: Rank[] = ['D', 'M1', 'M2', 'M3', 'A']
export const LANES: Lane[] = ['L', 'C', 'R']

/** Longueurs relatives : en-but 1, chaque tiers 1,2, en-but 1 (total 5,6). */
const RANK_LENGTHS: Record<Rank, number> = { D: 1, M1: 1.2, M2: 1.2, M3: 1.2, A: 1 }
const FIELD_LENGTH = 5.6
/** Profondeur d'un en-but, en fraction de la longueur du terrain. */
export const ENDZONE_DEPTH = RANK_LENGTHS.D / FIELD_LENGTH

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

export function isZoneId(value: unknown): value is ZoneId {
  if (typeof value !== 'string') return false
  const [rank, lane] = value.split('-')
  return RANKS.includes(rank as Rank) && LANES.includes(lane as Lane)
}

export function rankOf(zone: ZoneId): Rank {
  return zone.split('-')[0] as Rank
}

/** Limites d'une zone : x le long du terrain, y dans la largeur, de 0 à 1. */
export function zoneBounds(zone: ZoneId): { x0: number; x1: number; y0: number; y1: number } {
  const [rank, lane] = zone.split('-') as [Rank, Lane]
  const before = RANKS.slice(0, RANKS.indexOf(rank)).reduce((sum, r) => sum + RANK_LENGTHS[r], 0)
  const laneIndex = LANES.indexOf(lane)
  return {
    x0: before / FIELD_LENGTH,
    x1: (before + RANK_LENGTHS[rank]) / FIELD_LENGTH,
    y0: laneIndex / 3,
    y1: (laneIndex + 1) / 3,
  }
}

export function zoneCenter(zone: ZoneId): FieldPosition {
  const { x0, x1, y0, y1 } = zoneBounds(zone)
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
}

/** Zone qui contient une position (les bords appartiennent à la zone suivante). */
export function zoneAt(position: FieldPosition): ZoneId {
  let rank: Rank = 'D'
  let start = 0
  for (const candidate of RANKS) {
    if (position.x >= start) rank = candidate
    start += RANK_LENGTHS[candidate] / FIELD_LENGTH
  }
  const lane = LANES[Math.min(2, Math.max(0, Math.floor(position.y * 3)))]!
  return zoneId(rank, lane)
}

export function isOpponentEndzone(position: FieldPosition | null | undefined): boolean {
  return !!position && position.x >= 1 - ENDZONE_DEPTH
}

export function zoneName(zone: ZoneId): string {
  const [rank, lane] = zone.split('-') as [Rank, Lane]
  return `${RANK_NAMES[rank]} ${LANE_NAMES[lane]}`
}

/** Nom de l'endroit d'une action (« Milieu droite ») ; vide si l'endroit n'est pas connu. */
export function positionName(position: FieldPosition | null | undefined): string {
  return position ? zoneName(zoneAt(position)) : ''
}
