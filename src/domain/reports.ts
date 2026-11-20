// Données prêtes à afficher pour les rapports : les composants ne calculent rien eux-mêmes.

import { computeAffinities, type PairAffinity } from './stats/affinities'
import { computeStats, type PlayerStats, type Stats, type TeamStats } from './stats/computeStats'
import { findLeaders, type Leaders } from './stats/leaders'
import { type PossessionSummary, summarizePossessions } from './stats/possessions'
import { createPlayerStats } from './stats/statsTypes'
import { pullingSide } from './pointState'
import {
  longestRuns,
  matchScore,
  type Run,
  type Score,
  scoreProgression,
  type ScoreStep,
} from './score'
import type { Match, Side } from './types'

export interface Ratio {
  numerator: number
  denominator: number
}

export type DuelKey = 'offense' | 'defense' | 'turnovers' | 'possession' | 'bricks'

export interface DuelRow {
  key: DuelKey
  /** Les pourcentages (0 à 1) sont à l'échelle 0–100 %, les nombres à l'échelle du plus grand. */
  kind: 'percent' | 'count'
  us: number | null
  them: number | null
}

export interface Essentials {
  hold: Ratio
  recoveryConversion: Ratio
  cleanOffense: Ratio
  break: Ratio
}

export interface MatchReport {
  score: Score
  progression: ScoreStep[]
  runs: Record<Side, Run | null>
  stats: Stats
  possessions: PossessionSummary
  leaders: Leaders
  essentials: Essentials
  duel: DuelRow[]
  tablePlayers: PlayerStats[]
  affinities: PairAffinity[]
}

/** Duos affichés dans les rapports de match et les statistiques globales ; la fiche joueur les montre tous. */
export const TOP_PAIRS = 10

function share(part: number, total: number): number | null {
  return total > 0 ? part / total : null
}

export function essentials(team: TeamStats, possessions: PossessionSummary): Essentials {
  return {
    hold: { numerator: team.offensePointsWon, denominator: team.offensePoints },
    recoveryConversion: {
      numerator: possessions.recoveryGoals,
      denominator: possessions.recoveryPossessions,
    },
    cleanOffense: { numerator: team.cleanOffensePointsWon, denominator: team.offensePoints },
    break: { numerator: team.defensePointsWon, denominator: team.defensePoints },
  }
}

export function teamDuel(team: TeamStats, possessions: PossessionSummary): DuelRow[] {
  const { us, them, ourTimeShare } = possessions
  return [
    {
      key: 'offense',
      kind: 'percent',
      us: share(us.goals, us.possessions),
      them: share(them.goals, them.possessions),
    },
    {
      key: 'defense',
      kind: 'percent',
      us: share(them.turnovers, them.possessions),
      them: share(us.turnovers, us.possessions),
    },
    { key: 'turnovers', kind: 'count', us: team.recoveries, them: team.turns },
    {
      key: 'possession',
      kind: 'percent',
      us: ourTimeShare,
      them: ourTimeShare === null ? null : 1 - ourTimeShare,
    },
    { key: 'bricks', kind: 'count', us: team.ourBricks, them: team.theirBricks },
  ]
}

/** Joueurs du tableau : au moins un point, une passe, un turn ou un pull. */
export function tablePlayers(stats: Stats): PlayerStats[] {
  return Object.values(stats.players).filter(
    (player) =>
      player.pointsPlayed > 0 || player.attemptedPasses > 0 || player.turns > 0 || player.pulls > 0,
  )
}

export function buildMatchReport(match: Match): MatchReport {
  const stats = computeStats([match])
  const possessions = summarizePossessions([match])
  return {
    score: matchScore(match),
    progression: scoreProgression(match),
    runs: longestRuns(match),
    stats,
    possessions,
    leaders: findLeaders(Object.values(stats.players)),
    essentials: essentials(stats.team, possessions),
    duel: teamDuel(stats.team, possessions),
    tablePlayers: tablePlayers(stats),
    affinities: computeAffinities([match]).slice(0, TOP_PAIRS),
  }
}

export interface GlobalReport {
  stats: Stats
  tablePlayers: PlayerStats[]
  affinities: PairAffinity[]
}

export function buildGlobalReport(matches: readonly Match[]): GlobalReport {
  const stats = computeStats(matches)
  return {
    stats,
    tablePlayers: tablePlayers(stats),
    affinities: computeAffinities(matches).slice(0, TOP_PAIRS),
  }
}

export function buildPlayerStats(matches: readonly Match[], playerId: string): PlayerStats {
  return computeStats(matches).players[playerId] ?? createPlayerStats(playerId)
}

/** Compteurs par cause → lignes de barres, dans l'ordre des libellés fournis. */
export function causeItems(
  counts: Partial<Record<string, number>>,
  labels: Partial<Record<string, string>>,
): { label: string; value: number }[] {
  return Object.entries(labels).map(([cause, label]) => ({
    label: label ?? cause,
    value: counts[cause] ?? 0,
  }))
}

export interface PointSummary {
  number: number
  /** O : l'adversaire a lancé le pull ; D : nous l'avons lancé. */
  kind: 'O' | 'D' | null
  winner: Side | null
  passes: number
  turns: number
  us: number
  them: number
}

export function pointSummaries(match: Match): PointSummary[] {
  let us = 0
  let them = 0
  return match.points.map((point, index) => {
    if (point.resultat === 'nous') us++
    if (point.resultat === 'eux') them++
    const pull = pullingSide(point)
    return {
      number: index + 1,
      kind: pull === 'eux' ? 'O' : pull === 'nous' ? 'D' : null,
      winner: point.resultat,
      passes: point.evenements.filter((event) => event.t === 'passe').length,
      turns: point.evenements.filter((event) => event.t === 'turn').length,
      us,
      them,
    }
  })
}

/** Joueurs ayant tenté au moins une passe, triés par passes tentées décroissantes. */
export function passersByAttempts(players: readonly PlayerStats[]): PlayerStats[] {
  return players
    .filter((player) => player.attemptedPasses > 0)
    .sort((a, b) => b.attemptedPasses - a.attemptedPasses)
}
