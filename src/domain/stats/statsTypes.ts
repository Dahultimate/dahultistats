// Structures des statistiques calculées (équipe et joueurs) et leurs valeurs initiales.

import type { ZoneId } from '../types'

/** Compteur par clé (zone, cause…). Une clé absente vaut 0. */
export type Counts<K extends string = string> = Partial<Record<K, number>>

export interface PlayerZones {
  receptions: Counts<ZoneId>
  /** Zone du porteur au moment de chaque passe tentée. */
  throws: Counts<ZoneId>
  goals: Counts<ZoneId>
  turns: Counts<ZoneId>
  recoveries: Counts<ZoneId>
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
  zones: PlayerZones
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
  turnsByZone: Counts<ZoneId>
  recoveries: number
  recoveriesByCause: Counts
  recoveriesByZone: Counts<ZoneId>
  blocks: number
  callahans: number
  breaksWithoutGoal: number
  concededByCause: Counts
  concededByZone: Counts<ZoneId>
  concededWithoutZone: number
  goalsByZone: Counts<ZoneId>
  goalsWithoutZone: number
  receptionsByZone: Counts<ZoneId>
  ourPulls: number
  ourBricks: number
  theirPulls: number
  theirBricks: number
  ourPullZones: Counts<ZoneId>
  theirPullZones: Counts<ZoneId>
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
    zones: { receptions: {}, throws: {}, goals: {}, turns: {}, recoveries: {} },
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
    turnsByZone: {},
    recoveries: 0,
    recoveriesByCause: {},
    recoveriesByZone: {},
    blocks: 0,
    callahans: 0,
    breaksWithoutGoal: 0,
    concededByCause: {},
    concededByZone: {},
    concededWithoutZone: 0,
    goalsByZone: {},
    goalsWithoutZone: 0,
    receptionsByZone: {},
    ourPulls: 0,
    ourBricks: 0,
    theirPulls: 0,
    theirBricks: 0,
    ourPullZones: {},
    theirPullZones: {},
    opponentPasses: 0,
  }
}
