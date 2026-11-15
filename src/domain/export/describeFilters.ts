// Filtres actifs écrits en clair pour l'en-tête d'un fichier exporté
// (« Championnat régional, du 4 au 5 oct. 2026 »).

import { MATCH_TYPE_LABELS } from '../constants'
import type { StatsFilters } from '../filters'
import { formatDayMonth, formatShortDate, parseIsoDate } from '../format'
import type { Match, Team } from '../types'

export const NO_FILTER_TEXT = 'Toutes les données'

/** « du 4 au 5 oct. 2026 », « du 28 sept. au 5 oct. 2026 », « du 28 déc. 2025 au 5 janv. 2026 ». */
export function describeDateRange(from: string, to: string): string {
  if (from && to) {
    if (from === to) return `le ${formatShortDate(from)}`
    const start = parseIsoDate(from)
    const end = parseIsoDate(to)
    const sameYear = start.getFullYear() === end.getFullYear()
    if (sameYear && start.getMonth() === end.getMonth()) {
      return `du ${start.getDate()} au ${formatShortDate(to)}`
    }
    return `du ${sameYear ? formatDayMonth(from) : formatShortDate(from)} au ${formatShortDate(to)}`
  }
  if (from) return `depuis le ${formatShortDate(from)}`
  if (to) return `jusqu’au ${formatShortDate(to)}`
  return ''
}

export function describeFilters(
  filters: StatsFilters,
  context: { teams: readonly Team[]; matches: readonly Match[] },
): string {
  const match = context.matches.find((candidate) => candidate.id === filters.matchId)
  const team = context.teams.find((candidate) => candidate.id === filters.teamId)
  const parts = [
    match ? `${match.equipeNom} – ${match.adversaire} (${formatShortDate(match.date)})` : '',
    filters.event,
    team ? `équipe ${team.nom}` : '',
    filters.type ? MATCH_TYPE_LABELS[filters.type].toLowerCase() : '',
    describeDateRange(filters.from, filters.to),
  ].filter((part) => part !== '')
  return parts.length > 0 ? parts.join(', ') : NO_FILTER_TEXT
}
