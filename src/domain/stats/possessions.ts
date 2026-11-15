// Possessions : une possession commence quand une équipe reçoit le disque
// et se termine par un but ou un turnover. Une possession encore ouverte est ignorée.

import { isConcededCause, isRecoveryCause } from '../constants'
import type { Match, MatchEvent, Point, Side } from '../types'

export type PossessionOrigin = 'pull' | 'turn' | 'recuperation'
export type PossessionOutcome = 'but' | 'turnover'

export interface Possession {
  side: Side
  origin: PossessionOrigin
  start?: number
  end?: number
  outcome: PossessionOutcome
}

export interface SidePossessions {
  possessions: number
  goals: number
  turnovers: number
  /** Durée totale en ms (0 si une heure manque). */
  duration: number
}

export interface PossessionSummary {
  us: SidePossessions
  them: SidePossessions
  /** Nos possessions qui commencent par une récupération. */
  recoveryPossessions: number
  recoveryGoals: number
  /** Part de temps de possession de notre équipe (0 à 1), ou null si une heure manque. */
  ourTimeShare: number | null
}

type OpenPossession = Omit<Possession, 'outcome' | 'end'>

class PossessionTracker {
  readonly closed: Possession[] = []
  private open: OpenPossession | null = null

  start(side: Side, origin: PossessionOrigin, ts?: number): void {
    this.open = { side, origin, start: ts }
  }

  close(outcome: PossessionOutcome, ts?: number): void {
    if (this.open) this.closed.push({ ...this.open, end: ts, outcome })
    this.open = null
  }
}

function trackEvent(tracker: PossessionTracker, event: MatchEvent): void {
  const { ts } = event
  if (event.t === 'pull') tracker.start(event.equipe === 'nous' ? 'eux' : 'nous', 'pull', ts)
  if (event.t === 'passe' && event.but) tracker.close('but', ts)
  if (event.t === 'turn') {
    tracker.close('turnover', ts)
    tracker.start('eux', 'turn', ts)
    if (event.cause === 'callahan') tracker.close('but', ts)
  }
  if (event.t !== 'def') return
  if (isRecoveryCause(event.cause) || event.cause === 'callahan') {
    tracker.close('turnover', ts)
    tracker.start('nous', 'recuperation', ts)
    if (event.cause === 'callahan') tracker.close('but', ts)
  } else if (isConcededCause(event.cause)) {
    tracker.close('but', ts)
  }
}

export function pointPossessions(point: Point): Possession[] {
  const tracker = new PossessionTracker()
  for (const event of point.evenements) trackEvent(tracker, event)
  return tracker.closed
}

function emptySide(): SidePossessions {
  return { possessions: 0, goals: 0, turnovers: 0, duration: 0 }
}

export function summarizePossessions(matches: readonly Match[]): PossessionSummary {
  const summary: PossessionSummary = {
    us: emptySide(),
    them: emptySide(),
    recoveryPossessions: 0,
    recoveryGoals: 0,
    ourTimeShare: null,
  }
  let missingTime = false
  const all = matches.flatMap((match) => match.points.flatMap(pointPossessions))
  for (const possession of all) {
    const side = possession.side === 'nous' ? summary.us : summary.them
    side.possessions++
    if (possession.outcome === 'but') side.goals++
    else side.turnovers++
    if (possession.start === undefined || possession.end === undefined) missingTime = true
    else side.duration += possession.end - possession.start
    if (possession.side === 'nous' && possession.origin === 'recuperation') {
      summary.recoveryPossessions++
      if (possession.outcome === 'but') summary.recoveryGoals++
    }
  }
  const total = summary.us.duration + summary.them.duration
  summary.ourTimeShare = missingTime || total === 0 ? null : summary.us.duration / total
  return summary
}
