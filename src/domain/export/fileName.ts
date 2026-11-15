// Noms des fichiers exportés : minuscules, sans accents ni espaces.

import type { StatsFilters } from '../filters'
import type { Match, Player } from '../types'

export type MatchReportContent = 'collectif' | 'individuel' | 'complet'

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** « tout » sans filtre de dates. */
export function periodSlug(filters: Pick<StatsFilters, 'from' | 'to'>): string {
  const { from, to } = filters
  if (from && to) return `du-${from}-au-${to}`
  if (from) return `depuis-${from}`
  if (to) return `jusqu-au-${to}`
  return 'tout'
}

export function matchReportFileName(match: Match, content: MatchReportContent): string {
  return `stats-ultimate_${slugify(match.equipeNom)}-vs-${slugify(match.adversaire)}_${match.date}_${content}`
}

export function playerReportFileName(player: Player, filters: StatsFilters): string {
  const name = slugify(`${player.numero}-${player.prenom}-${player.nom}`)
  return `stats-ultimate_${name}_${periodSlug(filters)}`
}

export function globalReportFileName(filters: StatsFilters): string {
  return `stats-ultimate_global_${periodSlug(filters)}`
}
