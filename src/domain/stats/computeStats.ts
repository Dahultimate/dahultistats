// Calcul des statistiques de l'équipe et de chaque joueur à partir d'une liste de matchs.
// Fonction pure : rien n'est stocké dans le JSON, tout est recalculé à la volée.

import {
  CALLAHAN_CONCEDED,
  isConcededCause,
  isRecoveryCause,
  THROW_TURN_CAUSES,
} from '../constants'
import { INITIAL_POINT_STATE, nextPointState, type PointState, pullingSide } from '../pointState'
import { matchResult, matchScore } from '../score'
import type {
  DefenseEvent,
  FieldPosition,
  Match,
  MatchEvent,
  Point,
  PullEvent,
  TurnEvent,
} from '../types'
import { defensiveImpact, mvpIndex, offensiveImpact } from './indices'
import {
  addCount,
  addSpot,
  createPlayerStats,
  createTeamStats,
  type PlayerStats,
  type Stats,
  type TeamStats,
} from './statsTypes'

export type { PlayerStats, Stats, TeamStats } from './statsTypes'

interface Accumulator {
  team: TeamStats
  players: Record<string, PlayerStats>
}

function playerOf(acc: Accumulator, id: string): PlayerStats {
  acc.players[id] ??= createPlayerStats(id)
  return acc.players[id]
}

export function computeStats(matches: readonly Match[]): Stats {
  const acc: Accumulator = { team: createTeamStats(), players: {} }
  for (const match of matches) accumulateMatch(acc, match)
  for (const player of Object.values(acc.players)) finalizePlayer(player)
  for (const player of Object.values(acc.players)) {
    acc.team.completedPasses += player.completedPasses
    acc.team.attemptedPasses += player.attemptedPasses
  }
  return acc
}

function accumulateMatch(acc: Accumulator, match: Match): void {
  const { team } = acc
  team.matches++
  const result = matchResult(match)
  if (result === 'V') team.wins++
  if (result === 'D') team.losses++
  if (result === 'N') team.draws++
  const score = matchScore(match)
  team.pointsScored += score.us
  team.pointsConceded += score.them
  const playedIds = new Set(match.points.flatMap((point) => point.ligne))
  for (const id of playedIds) playerOf(acc, id).matchesPlayed++
  for (const point of match.points) accumulatePoint(acc, point)
}

function accumulatePoint(acc: Accumulator, point: Point): void {
  if (point.resultat !== null) accumulatePointResult(acc, point)
  let state: PointState = INITIAL_POINT_STATE
  for (const event of point.evenements) {
    accumulateEvent(acc, event, state)
    state = nextPointState(state, event)
  }
}

function accumulatePointResult(acc: Accumulator, point: Point): void {
  const { team } = acc
  const won = point.resultat === 'nous'
  const pull = pullingSide(point)
  const offense = pull === 'eux'
  const defense = pull === 'nous'
  team.pointsPlayed++
  if (offense) {
    team.offensePoints++
    if (won) team.offensePointsWon++
    if (won && !point.evenements.some((event) => event.t === 'turn')) team.cleanOffensePointsWon++
  }
  if (defense) {
    team.defensePoints++
    if (won) team.defensePointsWon++
  }
  for (const id of point.ligne) {
    const player = playerOf(acc, id)
    player.pointsPlayed++
    if (offense) player.offensePoints++
    if (defense) player.defensePoints++
    if (won) player.pointsWon++
    else player.pointsLost++
  }
}

function accumulateEvent(acc: Accumulator, event: MatchEvent, before: PointState): void {
  switch (event.t) {
    case 'pull':
      return accumulatePull(acc, event)
    case 'reprise':
      return
    case 'passe': {
      const thrower = playerOf(acc, event.de)
      const receiver = playerOf(acc, event.a)
      thrower.completedPasses++
      thrower.attemptedPasses++
      addSpot(thrower.spots.throws, before.carrierPosition)
      receiver.receptions++
      addSpot(receiver.spots.receptions, event.position)
      addSpot(acc.team.receptionSpots, event.position)
      if (!event.but) return
      receiver.goals++
      addSpot(receiver.spots.goals, event.position)
      thrower.assists++
      addGoal(acc.team, event.position)
      return
    }
    case 'turn':
      return accumulateTurn(acc, event, before)
    case 'def':
      return accumulateDefense(acc, event)
    case 'passeAdv':
      acc.team.opponentPasses++
      return
  }
}

function accumulatePull(acc: Accumulator, event: PullEvent): void {
  const { team } = acc
  const brick = event.brick === true
  const { position } = event
  if (event.equipe === 'eux') {
    team.theirPulls++
    if (brick) team.theirBricks++
    addSpot(team.theirPullSpots, position)
    return
  }
  team.ourPulls++
  if (brick) team.ourBricks++
  addSpot(team.ourPullSpots, position)
  if (!event.joueur) return
  const player = playerOf(acc, event.joueur)
  player.pulls++
  if (brick) player.bricks++
}

function accumulateTurn(acc: Accumulator, event: TurnEvent, before: PointState): void {
  const { team } = acc
  team.turns++
  addCount(team.turnsByCause, event.cause)
  addSpot(team.turnSpots, event.position)
  for (const id of event.joueurs) {
    const player = playerOf(acc, id)
    player.turns++
    addCount(player.turnsByCause, event.cause)
    addSpot(player.spots.turns, event.position)
  }
  if (event.porteur && THROW_TURN_CAUSES.includes(event.cause)) {
    const carrier = playerOf(acc, event.porteur)
    carrier.attemptedPasses++
    addCount(carrier.failedPassesByCause, event.cause)
    addSpot(carrier.spots.throws, before.carrierPosition)
  }
  if (event.cause === 'callahan') addConcededGoal(team, CALLAHAN_CONCEDED, event.position)
}

function accumulateDefense(acc: Accumulator, event: DefenseEvent): void {
  const { team } = acc
  const { cause, position } = event
  if (isRecoveryCause(cause) || cause === 'callahan') {
    team.recoveries++
    addCount(team.recoveriesByCause, cause)
    addSpot(team.recoverySpots, position)
    if (cause === 'contre') team.blocks++
    if (cause === 'callahan') {
      team.callahans++
      addGoal(team, position)
    }
    for (const id of event.joueurs) accumulatePlayerRecovery(playerOf(acc, id), event)
    return
  }
  if (cause === 'break_sans_but') team.breaksWithoutGoal++
  if (isConcededCause(cause)) addConcededGoal(team, cause, position)
  for (const id of event.joueurs) {
    const player = playerOf(acc, id)
    player.defensiveFaults++
    addCount(player.defensiveFaultsByCause, cause)
  }
}

function accumulatePlayerRecovery(player: PlayerStats, event: DefenseEvent): void {
  player.recoveries++
  addSpot(player.spots.recoveries, event.position)
  if (event.cause === 'contre') player.blocks++
  if (event.cause !== 'callahan') return
  player.callahans++
  player.blocks++
  player.goals++
  addSpot(player.spots.goals, event.position)
}

function addGoal(team: TeamStats, position: FieldPosition | undefined): void {
  if (!position) team.goalsWithoutSpot++
  addSpot(team.goalSpots, position)
}

function addConcededGoal(
  team: TeamStats,
  cause: string,
  position: FieldPosition | undefined,
): void {
  addCount(team.concededByCause, cause)
  if (!position) team.concededWithoutSpot++
  addSpot(team.concededSpots, position)
}

function finalizePlayer(player: PlayerStats): void {
  player.differential = player.pointsWon - player.pointsLost
  player.plusMinus = player.goals + player.assists + player.blocks - player.turns
  player.offensiveImpact = offensiveImpact(player)
  player.defensiveImpact = defensiveImpact(player)
  player.mvpIndex = mvpIndex(player)
}
