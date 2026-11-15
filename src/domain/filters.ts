// Filtres des statistiques : un match est retenu s'il respecte tous les filtres renseignés.
// Un filtre vide ('') ne filtre rien.

import type { Match, MatchType } from './types'

export interface StatsFilters {
  /** Date de début incluse (AAAA-MM-JJ). */
  from: string
  /** Date de fin incluse (AAAA-MM-JJ). */
  to: string
  /** Nom exact de la compétition / de l'évènement. */
  event: string
  teamId: string
  type: MatchType | ''
  matchId: string
}

export function emptyFilters(): StatsFilters {
  return { from: '', to: '', event: '', teamId: '', type: '', matchId: '' }
}

export function hasActiveFilters(filters: StatsFilters): boolean {
  return Object.values(filters).some((value) => value !== '')
}

export function matchPassesFilters(match: Match, filters: StatsFilters): boolean {
  return (
    (filters.from === '' || match.date >= filters.from) &&
    (filters.to === '' || match.date <= filters.to) &&
    (filters.event === '' || match.evenement === filters.event) &&
    (filters.teamId === '' || match.equipeId === filters.teamId) &&
    (filters.type === '' || match.type === filters.type) &&
    (filters.matchId === '' || match.id === filters.matchId)
  )
}

export function filterMatches(matches: readonly Match[], filters: StatsFilters): Match[] {
  return matches.filter((match) => matchPassesFilters(match, filters))
}

/** Matchs où le joueur figure dans au moins une ligne. */
export function matchesPlayedBy(matches: readonly Match[], playerId: string): Match[] {
  return matches.filter((match) => match.points.some((point) => point.ligne.includes(playerId)))
}

/** Noms d'évènements déjà saisis, sans doublon, triés. */
export function eventNames(matches: readonly Match[]): string[] {
  const names = new Set(matches.map((match) => match.evenement).filter((name) => name !== ''))
  return [...names].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Tri de l'historique : date décroissante, puis ordre de création décroissant. */
export function sortMatchesByDate(matches: readonly Match[]): Match[] {
  return [...matches].sort((a, b) => b.date.localeCompare(a.date) || b.cree - a.cree)
}
