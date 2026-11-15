import { describe, expect, it } from 'vitest'

import { buildMatchReport, passersByAttempts } from '@/domain/reports'
import {
  labelledGapIndexes,
  longestRuns,
  matchResult,
  matchScore,
  scoreProgression,
} from '@/domain/score'
import { computeStats } from '@/domain/stats/computeStats'
import { defensiveImpact, mvpIndex, offensiveImpact, roundToTenth } from '@/domain/stats/indices'
import { findLeaders } from '@/domain/stats/leaders'
import { pointPossessions, summarizePossessions } from '@/domain/stats/possessions'
import { createPlayerStats, sumCounts } from '@/domain/stats/statsTypes'

import { handMadeMatch, makeMatch, makePoint } from './fixtures'

const match = handMadeMatch()
const { team, players } = computeStats([match])
const a = players.a!
const b = players.b!
const c = players.c!

describe('statistiques d’un joueur', () => {
  it('matchs, points joués O / D, gagnés, perdus, différentiel', () => {
    expect(a).toMatchObject({
      matchesPlayed: 1,
      pointsPlayed: 6,
      offensePoints: 4,
      defensePoints: 2,
    })
    expect(a).toMatchObject({ pointsWon: 3, pointsLost: 3, differential: 0 })
  })

  it('buts (passes reçues dans l’en-but + Callahans) et Callahans', () => {
    expect(b.goals).toBe(1)
    expect(c.goals).toBe(2)
    expect(c.callahans).toBe(1)
  })

  it('passes décisives, passes réussies et tentées', () => {
    expect(a).toMatchObject({ assists: 2, completedPasses: 3, attemptedPasses: 4 })
    expect(b).toMatchObject({ assists: 0, completedPasses: 1, attemptedPasses: 2 })
    // Le stall out de c ne compte pas comme passe tentée, son drop (porteur) oui.
    expect(c).toMatchObject({ completedPasses: 0, attemptedPasses: 1 })
  })

  it('passes ratées par cause, comptées côté lanceur', () => {
    expect(a.failedPassesByCause).toEqual({ callahan: 1 })
    expect(b.failedPassesByCause).toEqual({ mauvaise_passe: 1 })
    expect(c.failedPassesByCause).toEqual({ drop: 1 })
  })

  it('réceptions', () => {
    expect([a.receptions, b.receptions, c.receptions]).toEqual([0, 2, 2])
  })

  it('turns par cause, pour les joueurs désignés fautifs', () => {
    expect(b.turnsByCause).toEqual({ drop: 1, mauvaise_passe: 1 })
    expect(c.turnsByCause).toEqual({ stall_out: 1 })
    expect(a.turns).toBe(1)
  })

  it('contres, récupérations et fautes défensives', () => {
    expect(a).toMatchObject({ blocks: 1, recoveries: 1, defensiveFaults: 1 })
    expect(a.defensiveFaultsByCause).toEqual({ break_sans_but: 1 })
    expect(b.defensiveFaultsByCause).toEqual({ marquage: 1 })
    expect(c).toMatchObject({ blocks: 1, recoveries: 1, defensiveFaults: 0 })
  })

  it('pulls et bricks', () => {
    expect(a).toMatchObject({ pulls: 1, bricks: 1 })
    expect(c).toMatchObject({ pulls: 1, bricks: 0 })
  })

  it('+/− = buts + passes décisives + contres − turns', () => {
    expect([a.plusMinus, b.plusMinus, c.plusMinus]).toEqual([2, -1, 2])
  })

  it('zones : lancers, réceptions, buts, turns, récupérations', () => {
    expect(a.zones.throws).toEqual({ 'D-C': 1, 'M3-R': 1, 'M1-C': 1, 'D-R': 1 })
    expect(sumCounts(a.zones.throws)).toBe(a.attemptedPasses)
    expect(c.zones.throws).toEqual({ 'M2-C': 1 })
    expect(b.zones.receptions).toEqual({ 'M1-L': 1, 'A-C': 1 })
    expect(c.zones.goals).toEqual({ 'A-R': 1, 'A-L': 1 })
    expect(b.zones.turns).toEqual({ 'M3-L': 1, 'M1-C': 1 })
    expect(a.zones.recoveries).toEqual({ 'M3-R': 1 })
  })
})

describe('indices de performance', () => {
  it('apport offensif, défensif et indice MVP calculés et arrondis au dixième', () => {
    expect([a.offensiveImpact, a.defensiveImpact, a.mvpIndex]).toEqual([4.6, 2, 6.6])
    expect([b.offensiveImpact, b.defensiveImpact, b.mvpIndex]).toEqual([-0.6, -1, -1.6])
    expect([c.offensiveImpact, c.defensiveImpact, c.mvpIndex]).toEqual([4.2, 3, 7.2])
  })

  it('formules directes', () => {
    const counts = {
      goals: 1,
      assists: 1,
      completedPasses: 7,
      receptions: 3,
      turns: 1,
      blocks: 2,
      recoveries: 3,
      defensiveFaults: 1,
    }
    expect(offensiveImpact(counts)).toBe(5.7)
    expect(defensiveImpact(counts)).toBe(6)
    expect(mvpIndex(counts)).toBe(11.7)
    expect(roundToTenth(0.1 + 0.2)).toBe(0.3)
  })
})

describe('statistiques de l’équipe', () => {
  it('points marqués, encaissés, hold, break, attaques propres', () => {
    expect(team).toMatchObject({ pointsScored: 3, pointsConceded: 3, pointsPlayed: 6 })
    expect(team).toMatchObject({ offensePoints: 4, offensePointsWon: 2, cleanOffensePointsWon: 1 })
    expect(team).toMatchObject({ defensePoints: 2, defensePointsWon: 1 })
  })

  it('bilan V-D-N sur les matchs terminés seulement', () => {
    expect(team).toMatchObject({ matches: 1, wins: 0, losses: 0, draws: 1 })
    const unfinished = computeStats([{ ...match, termine: false }]).team
    expect(unfinished.wins + unfinished.losses + unfinished.draws).toBe(0)
  })

  it('passes réussies et tentées = somme des joueurs', () => {
    expect(team).toMatchObject({ completedPasses: 4, attemptedPasses: 7 })
  })

  it('turns par cause et par zone', () => {
    expect(team.turns).toBe(4)
    expect(team.turnsByCause).toEqual({ drop: 1, mauvaise_passe: 1, stall_out: 1, callahan: 1 })
    expect(team.turnsByZone).toEqual({ 'M3-L': 1, 'M1-C': 1, 'M2-C': 1, 'D-R': 1 })
  })

  it('récupérations (Callahans inclus) par type et par zone', () => {
    expect(team).toMatchObject({ recoveries: 3, blocks: 1, callahans: 1 })
    expect(team.recoveriesByCause).toEqual({ contre: 1, callahan: 1, drop_adv: 1 })
    expect(team.recoveriesByZone).toEqual({ 'M3-R': 1, 'A-L': 1, 'M2-C': 1 })
  })

  it('breaks subis sans but et buts encaissés par cause, avec Callahan subi', () => {
    expect(team.breaksWithoutGoal).toBe(1)
    expect(team.concededByCause).toEqual({ marquage: 1, autre_but: 1, callahan_subi: 1 })
    expect(team.concededByZone).toEqual({ 'D-L': 1, 'D-R': 1 })
    expect(team.concededWithoutZone).toBe(1)
  })

  it('zones des buts marqués et des réceptions', () => {
    expect(team.goalsByZone).toEqual({ 'A-C': 1, 'A-L': 1, 'A-R': 1 })
    expect(team.goalsWithoutZone).toBe(0)
    expect(sumCounts(team.receptionsByZone)).toBe(4)
  })

  it('pulls, bricks et passes adverses', () => {
    expect(team).toMatchObject({ ourPulls: 2, ourBricks: 1, theirPulls: 4, theirBricks: 0 })
    expect(team.ourPullZones).toEqual({ 'A-C': 1 })
    expect(team.theirPullZones).toEqual({ 'D-C': 1, 'M1-C': 2, 'D-R': 1 })
    expect(team.opponentPasses).toBe(2)
  })

  it('les points en cours ne comptent pas comme points joués', () => {
    const live = makeMatch([makePoint([{ t: 'pull', equipe: 'eux', zone: 'D-C' }])], {
      termine: false,
    })
    const stats = computeStats([live])
    expect(stats.team.pointsPlayed).toBe(0)
    expect(stats.players.a!.pointsPlayed).toBe(0)
    expect(stats.players.a!.matchesPlayed).toBe(1)
  })
})

describe('possessions', () => {
  const summary = summarizePossessions([match])

  it('compte les possessions, buts et turnovers de chaque équipe', () => {
    expect(summary.us).toMatchObject({ possessions: 7, goals: 3, turnovers: 4 })
    expect(summary.them).toMatchObject({ possessions: 6, goals: 3, turnovers: 3 })
  })

  it('conversion après récupération', () => {
    expect([summary.recoveryGoals, summary.recoveryPossessions]).toEqual([2, 3])
  })

  it('part du temps de possession', () => {
    expect(summary.us.duration).toBe(14000)
    expect(summary.them.duration).toBe(8000)
    expect(summary.ourTimeShare).toBeCloseTo(14 / 22)
  })

  it('« — » si une heure manque', () => {
    const point = makePoint([
      { t: 'pull', equipe: 'eux', zone: 'D-C' },
      { t: 'reprise', joueur: 'a', zone: 'D-C' },
      { t: 'passe', de: 'a', a: 'b', zone: 'A-C', but: true },
    ])
    delete point.evenements[0]!.ts
    expect(summarizePossessions([makeMatch([point])]).ourTimeShare).toBeNull()
  })

  it('une possession encore ouverte est ignorée', () => {
    const point = makePoint([
      { t: 'pull', equipe: 'eux', zone: 'D-C' },
      { t: 'reprise', joueur: 'a', zone: 'D-C' },
    ])
    expect(pointPossessions(point)).toEqual([])
  })

  it('Callahan subi : possession adverse ouverte et fermée aussitôt par un but', () => {
    expect(pointPossessions(match.points[4]!)).toEqual([
      { side: 'nous', origin: 'pull', start: 0, end: 2000, outcome: 'turnover' },
      { side: 'eux', origin: 'turn', start: 2000, end: 2000, outcome: 'but' },
    ])
  })
})

describe('score, écarts et séries', () => {
  it('score calculé depuis les résultats', () => {
    expect(matchScore(match)).toEqual({ us: 3, them: 3 })
    expect(matchResult(match)).toBe('N')
    expect(matchResult({ ...match, termine: false })).toBe('en_cours')
    expect(matchResult(makeMatch([match.points[0]!]))).toBe('V')
    expect(matchResult(makeMatch([match.points[1]!]))).toBe('D')
  })

  it('écart au score après chaque point terminé', () => {
    expect(scoreProgression(match).map((step) => step.gap)).toEqual([1, 0, 1, 0, -1, 0])
  })

  it('étiquettes du graphique : plus grande avance de chaque équipe et valeur finale', () => {
    // Écarts 1, 0, 1, 0, −1, 0 : première avance de 1 (index 0), avance adverse (index 4), final (index 5).
    expect([...labelledGapIndexes(scoreProgression(match))].sort()).toEqual([0, 4, 5])
    expect(labelledGapIndexes([]).size).toBe(0)
  })

  it('plus longue série de chaque équipe, avec le score avant et après', () => {
    const runs = longestRuns(match)
    expect(runs.nous).toEqual({ length: 1, before: { us: 0, them: 0 }, after: { us: 1, them: 0 } })
    expect(runs.eux).toEqual({ length: 2, before: { us: 2, them: 1 }, after: { us: 2, them: 3 } })
    expect(longestRuns(makeMatch([]))).toEqual({ nous: null, eux: null })
  })
})

describe('meilleurs joueurs', () => {
  it('MVP, passeur décisif, apport offensif, défenseur', () => {
    const leaders = findLeaders(Object.values(players))
    expect(leaders.mvp?.playerId).toBe('c')
    expect(leaders.topAssister?.playerId).toBe('a')
    expect(leaders.topOffense?.playerId).toBe('a')
    expect(leaders.topDefender?.playerId).toBe('c')
  })

  it('personne sans joueur classé, sans passe décisive ou sans récupération', () => {
    expect(findLeaders([])).toEqual({
      mvp: null,
      topAssister: null,
      topOffense: null,
      topDefender: null,
    })
    const idle = { ...createPlayerStats('x'), pointsPlayed: 1 }
    const leaders = findLeaders([idle])
    expect(leaders.mvp?.playerId).toBe('x')
    expect(leaders.topAssister).toBeNull()
    expect(leaders.topDefender).toBeNull()
  })

  it('critère secondaire en cas d’égalité', () => {
    const first = { ...createPlayerStats('x'), pointsPlayed: 1, assists: 1, completedPasses: 2 }
    const second = { ...createPlayerStats('y'), pointsPlayed: 1, assists: 1, completedPasses: 5 }
    expect(findLeaders([first, second]).topAssister?.playerId).toBe('y')
  })

  it('un joueur sans point joué n’est pas classé', () => {
    const benched = { ...createPlayerStats('x'), mvpIndex: 50 }
    expect(findLeaders([benched]).mvp).toBeNull()
  })
})

describe('rapport de match', () => {
  const report = buildMatchReport(match)

  it('l’essentiel', () => {
    expect(report.essentials).toEqual({
      hold: { numerator: 2, denominator: 4 },
      recoveryConversion: { numerator: 2, denominator: 3 },
      cleanOffense: { numerator: 1, denominator: 4 },
      break: { numerator: 1, denominator: 2 },
    })
  })

  it('comparatif des équipes', () => {
    const rows = Object.fromEntries(report.duel.map((row) => [row.key, row]))
    expect(rows.offense).toMatchObject({ us: 3 / 7, them: 3 / 6 })
    expect(rows.defense).toMatchObject({ us: 3 / 6, them: 4 / 7 })
    expect(rows.turnovers).toMatchObject({ us: 3, them: 4 })
    expect(rows.bricks).toMatchObject({ us: 1, them: 0 })
    expect(rows.possession!.us! + rows.possession!.them!).toBeCloseTo(1)
  })

  it('tableau : joueurs avec au moins un point, une passe, un turn ou un pull', () => {
    expect(report.tablePlayers.map((player) => player.playerId).sort()).toEqual(['a', 'b', 'c'])
    expect(passersByAttempts(report.tablePlayers).map((player) => player.playerId)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
