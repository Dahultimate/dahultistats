// Score d'un match (jamais stocké : il se compte à partir des résultats des points),
// évolution de l'écart au score et plus longues séries.

import type { Match, Side } from './types'

export interface Score {
  us: number
  them: number
}

export type MatchResult = 'V' | 'D' | 'N' | 'en_cours'

export interface ScoreStep {
  /** Numéro du point (1 = premier point du match). */
  pointNumber: number
  winner: Side
  us: number
  them: number
  /** Score nous − score adversaire après ce point. */
  gap: number
}

export interface Run {
  length: number
  before: Score
  after: Score
}

type PointsOnly = Pick<Match, 'points'>

export function matchScore(match: PointsOnly): Score {
  let us = 0
  let them = 0
  for (const point of match.points) {
    if (point.resultat === 'nous') us++
    if (point.resultat === 'eux') them++
  }
  return { us, them }
}

export function matchResult(match: Pick<Match, 'points' | 'termine'>): MatchResult {
  if (!match.termine) return 'en_cours'
  const { us, them } = matchScore(match)
  if (us > them) return 'V'
  if (us < them) return 'D'
  return 'N'
}

export function scoreProgression(match: PointsOnly): ScoreStep[] {
  const steps: ScoreStep[] = []
  let us = 0
  let them = 0
  match.points.forEach((point, index) => {
    if (point.resultat === null) return
    if (point.resultat === 'nous') us++
    else them++
    steps.push({ pointNumber: index + 1, winner: point.resultat, us, them, gap: us - them })
  })
  return steps
}

/** Plus longue série de points consécutifs de chaque équipe (la première en cas d'égalité). */
export function longestRuns(match: PointsOnly): Record<Side, Run | null> {
  const best: Record<Side, Run | null> = { nous: null, eux: null }
  let current: { side: Side; length: number; before: Score } | null = null
  let previous: Score = { us: 0, them: 0 }
  for (const step of scoreProgression(match)) {
    if (current === null || current.side !== step.winner) {
      current = { side: step.winner, length: 0, before: previous }
    }
    current.length++
    const after = { us: step.us, them: step.them }
    const record = best[current.side]
    if (record === null || current.length > record.length) {
      best[current.side] = { length: current.length, before: current.before, after }
    }
    previous = after
  }
  return best
}

/** Points étiquetés sur le graphique d'écart : plus grande avance de chaque équipe et valeur finale. */
export function labelledGapIndexes(steps: readonly ScoreStep[]): Set<number> {
  const indexes = new Set<number>()
  for (const sign of [1, -1]) {
    let found = -1
    steps.forEach((step, index) => {
      if (step.gap * sign > 0 && (found < 0 || step.gap * sign > steps[found]!.gap * sign))
        found = index
    })
    if (found >= 0) indexes.add(found)
  }
  if (steps.length > 0) indexes.add(steps.length - 1)
  return indexes
}
