// Structures des statistiques calculées (équipe et joueurs) et leurs valeurs initiales.

import type { FieldPosition } from '../types'

/** Compteur par clé (cause…). Une clé absente vaut 0. */
export type Counts<K extends string = string> = Partial<Record<K, number>>

export interface PlayerSpots {
  receptions: FieldPosition[]
  /** Position du porteur au moment de chaque passe tentée. */
  throws: FieldPosition[]
  goals: FieldPosition[]
  turns: FieldPosition[]
  recoveries: FieldPosition[]
}

export interface PlayerStats {
  playerId: string
  matchesPlayed: number
  pointsPlayed: number
  offensePoints: number
  defensePoints: number
  pointsWon: number
  pointsLost: number
  differential: number
  goals: number
  callahans: number
  assists: number
  completedPasses: number
  attemptedPasses: number
  failedPassesByCause: Counts
  receptions: number
  turns: number
  turnsByCause: Counts
  blocks: number
  recoveries: number
  defensiveFaults: number
  defensiveFaultsByCause: Counts
  pulls: number
  bricks: number
  plusMinus: number
  offensiveImpact: number
  defensiveImpact: number
  mvpIndex: number
  spots: PlayerSpots
}

export interface TeamStats {
  matches: number
  wins: number
  losses: number
  draws: number
  pointsScored: number
  pointsConceded: number
  pointsPlayed: number
  offensePoints: number
  offensePointsWon: number
  defensePoints: number
  defensePointsWon: number
  cleanOffensePointsWon: number
  completedPasses: number
  attemptedPasses: number
  turns: number
  turnsByCause: Counts
  turnSpots: FieldPosition[]
  recoveries: number
  recoveriesByCause: Counts
  recoverySpots: FieldPosition[]
  blocks: number
  callahans: number
  breaksWithoutGoal: number
  concededByCause: Counts
  concededSpots: FieldPosition[]
  concededWithoutSpot: number
  goalSpots: FieldPosition[]
  goalsWithoutSpot: number
  receptionSpots: FieldPosition[]
  ourPulls: number
  ourBricks: number
  theirPulls: number
  theirBricks: number
  ourPullSpots: FieldPosition[]
  theirPullSpots: FieldPosition[]
  opponentPasses: number
}

export interface Stats {
  team: TeamStats
  players: Record<string, PlayerStats>
}

/** Ajoute 1 au compteur `key` ; une clé nulle (zone inconnue) n'est comptée nulle part. */
export function addCount<K extends string>(counts: Counts<K>, key: K | null): void {
  if (key === null) return
  counts[key] = (counts[key] ?? 0) + 1
}

/** Ajoute une position ; une action sans position n'apparaît sur aucune carte. */
export function addSpot(spots: FieldPosition[], position: FieldPosition | null | undefined): void {
  if (position) spots.push(position)
}

export function sumCounts(counts: Counts): number {
  return Object.values(counts).reduce<number>((total, value) => total + (value ?? 0), 0)
}

export function createPlayerStats(playerId: string): PlayerStats {
  return {
    playerId,
    matchesPlayed: 0,
    pointsPlayed: 0,
    offensePoints: 0,
    defensePoints: 0,
    pointsWon: 0,
    pointsLost: 0,
    differential: 0,
    goals: 0,
    callahans: 0,
    assists: 0,
    completedPasses: 0,
    attemptedPasses: 0,
    failedPassesByCause: {},
    receptions: 0,
    turns: 0,
    turnsByCause: {},
    blocks: 0,
    recoveries: 0,
    defensiveFaults: 0,
    defensiveFaultsByCause: {},
    pulls: 0,
    bricks: 0,
    plusMinus: 0,
    offensiveImpact: 0,
    defensiveImpact: 0,
    mvpIndex: 0,
    spots: { receptions: [], throws: [], goals: [], turns: [], recoveries: [] },
  }
}

export function createTeamStats(): TeamStats {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsScored: 0,
    pointsConceded: 0,
    pointsPlayed: 0,
    offensePoints: 0,
    offensePointsWon: 0,
    defensePoints: 0,
    defensePointsWon: 0,
    cleanOffensePointsWon: 0,
    completedPasses: 0,
    attemptedPasses: 0,
    turns: 0,
    turnsByCause: {},
    turnSpots: [],
    recoveries: 0,
    recoveriesByCause: {},
    recoverySpots: [],
    blocks: 0,
    callahans: 0,
    breaksWithoutGoal: 0,
    concededByCause: {},
    concededSpots: [],
    concededWithoutSpot: 0,
    goalSpots: [],
    goalsWithoutSpot: 0,
    receptionSpots: [],
    ourPulls: 0,
    ourBricks: 0,
    theirPulls: 0,
    theirBricks: 0,
    ourPullSpots: [],
    theirPullSpots: [],
    opponentPasses: 0,
  }
}
