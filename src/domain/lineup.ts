// Aides à la sélection de la ligne et aux présélections de la saisie en direct.

import { LINE_SIZE } from './constants'
import { derivePointState } from './pointState'
import type { Match, Player, Position, Side, Team } from './types'

export function sortPlayers(players: readonly Player[]): Player[] {
  return [...players].sort(
    (a, b) =>
      a.numero - b.numero ||
      a.prenom.localeCompare(b.prenom, 'fr') ||
      a.nom.localeCompare(b.nom, 'fr'),
  )
}

export function groupByPosition(players: readonly Player[]): Record<Position, Player[]> {
  const sorted = sortPlayers(players)
  return {
    Handler: sorted.filter((player) => player.poste === 'Handler'),
    Middle: sorted.filter((player) => player.poste === 'Middle'),
  }
}

/** Nombre de points où chaque joueur figure dans la ligne, dans ce match (aide à la rotation). */
export function pointsPlayedInMatch(match: Match): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const point of match.points) {
    for (const id of point.ligne) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

/** Joueurs proposés : l'équipe du match, ceux qui ont déjà joué ce match, et tout l'effectif actif si demandé. */
export function lineCandidates(
  match: Match,
  team: Team | undefined,
  players: readonly Player[],
  includeWholeRoster: boolean,
): Player[] {
  const ids = new Set([...(team?.joueurs ?? []), ...match.points.flatMap((point) => point.ligne)])
  return players.filter((player) => ids.has(player.id) || (includeWholeRoster && player.actif))
}

export function lineSize(match: Match): number {
  return LINE_SIZE[match.terrain]
}

/** Premier point : vers la droite ; ensuite l'inverse du point précédent (changement de côté). */
export function defaultAttackRight(match: Match): boolean {
  const previous = match.points.at(-1)
  return previous ? !previous.attaqueDroite : true
}

/** L'équipe qui a marqué le point précédent lance le pull ; null au premier point. */
export function expectedPuller(match: Match): Side | null {
  const previous = [...match.points].reverse().find((point) => point.resultat !== null)
  return previous?.resultat ?? null
}

/** Dernier lanceur de pull du match encore présent dans la ligne, pour le présélectionner. */
export function lastPuller(match: Match, line: readonly string[]): string | null {
  for (const point of [...match.points].reverse()) {
    for (const event of [...point.evenements].reverse()) {
      if (event.t === 'pull' && event.joueur && line.includes(event.joueur)) return event.joueur
    }
  }
  return null
}

/** Point en cours (le dernier point s'il n'a pas de résultat). */
export function currentPoint(match: Match) {
  const last = match.points.at(-1)
  return last && last.resultat === null ? last : null
}

export function currentPointState(match: Match) {
  const point = currentPoint(match)
  return point ? derivePointState(point.evenements) : null
}
