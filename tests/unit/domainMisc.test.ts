import { describe, expect, it } from 'vitest'

import { describeEvent } from '@/domain/eventText'
import { densestPosition, densityGrid } from '@/domain/heatmap'
import {
  emptyFilters,
  eventNames,
  filterMatches,
  hasActiveFilters,
  matchesPlayedBy,
  sortMatchesByDate,
} from '@/domain/filters'
import {
  formatLongDate,
  formatNumber,
  formatPercent,
  formatSigned,
  toIsoDate,
} from '@/domain/format'
import {
  currentPoint,
  currentPointState,
  defaultAttackRight,
  expectedPuller,
  groupByPosition,
  lastPuller,
  lineCandidates,
  lineSize,
  pointsPlayedInMatch,
} from '@/domain/lineup'
import type { MatchEvent, Player } from '@/domain/types'
import {
  isOpponentEndzone,
  isZoneId,
  positionName,
  zoneAt,
  zoneCenter,
  zoneName,
} from '@/domain/zones'

import { at, handMadeMatch, makeMatch, makePoint, PLAYERS } from './fixtures'

const players: Player[] = [
  ...PLAYERS,
  { id: 'e', prenom: 'Sarah', nom: 'Mercier', numero: 12, poste: 'Middle', actif: true },
]
const find = (id: string) => players.find((player) => player.id === id)

describe('zones', () => {
  it('noms affichés', () => {
    expect(zoneName('D-L')).toBe('Notre en-but gauche')
    expect(zoneName('M2-C')).toBe('Milieu centre')
    expect(zoneName('A-R')).toBe('En-but adverse droite')
    expect(positionName({ x: 0.5, y: 0.9 })).toBe('Milieu droite')
    expect(positionName(undefined)).toBe('')
  })

  it('zone d’une position : en-buts de 1 / 5,6 de la longueur, couloirs en tiers', () => {
    expect(zoneAt({ x: 0, y: 0 })).toBe('D-L')
    expect(zoneAt({ x: 1 / 5.6, y: 0.5 })).toBe('M1-C')
    expect(zoneAt({ x: 0.82, y: 0.99 })).toBe('M3-R')
    expect(zoneAt({ x: 0.83, y: 1 })).toBe('A-R')
    for (const zone of ['D-L', 'M1-C', 'M2-R', 'M3-L', 'A-C'] as const) {
      expect(zoneAt(zoneCenter(zone))).toBe(zone)
    }
  })

  it('en-but adverse et identifiants de zone', () => {
    expect(isOpponentEndzone({ x: 0.9, y: 0.5 })).toBe(true)
    expect(isOpponentEndzone({ x: 0.8, y: 0.5 })).toBe(false)
    expect(isOpponentEndzone(null)).toBe(false)
    expect(isZoneId('M2-C')).toBe(true)
    expect(isZoneId('brick')).toBe(false)
  })
})

describe('carte de chaleur', () => {
  it('sans action : densité nulle partout', () => {
    const grid = densityGrid([], 4, 8)
    expect(grid.values).toHaveLength(32)
    expect(grid.max).toBe(0)
    expect(densestPosition(grid)).toBeNull()
  })

  it('la cellule la plus dense est celle de l’action', () => {
    const grid = densityGrid([{ x: 0.95, y: 0.1 }], 5, 10)
    expect(zoneAt(densestPosition(grid)!)).toBe('A-L')
    expect(grid.values[9 * 5]).toBe(grid.max)
  })

  it('deux actions au même endroit doublent la densité', () => {
    const one = densityGrid([{ x: 0.5, y: 0.5 }], 3, 5)
    const two = densityGrid(
      [
        { x: 0.5, y: 0.5 },
        { x: 0.5, y: 0.5 },
      ],
      3,
      5,
    )
    expect(two.max).toBeCloseTo(2 * one.max)
  })
})

describe('textes du journal', () => {
  it.each<[MatchEvent, string]>([
    [
      { t: 'pull', equipe: 'nous', joueur: 'e', position: at('M3-C') },
      'Pull de #12 Sarah → Tiers offensif centre',
    ],
    [{ t: 'pull', equipe: 'eux', position: at('D-L') }, 'Pull adverse → Notre en-but gauche'],
    [{ t: 'pull', equipe: 'eux', brick: true }, 'Pull adverse → Brick'],
    [
      { t: 'reprise', joueur: 'a', position: at('M2-C') },
      '#7 Léa ramasse le disque · Milieu centre',
    ],
    [
      { t: 'passe', de: 'a', a: 'b', position: at('M2-R') },
      'Passe #7 Léa → #9 Lucas · Milieu droite',
    ],
    [
      { t: 'passe', de: 'a', a: 'b', position: at('A-R'), but: true },
      'BUT de #9 Lucas · passe décisive de #7 Léa',
    ],
    [
      { t: 'turn', cause: 'drop', joueurs: ['b'], position: at('M3-L'), porteur: 'a' },
      'TURN · Drop · #9 Lucas · Tiers offensif gauche',
    ],
    [
      { t: 'def', cause: 'contre', joueurs: ['c'], position: at('M2-C') },
      'Récupération · Contre / interception · #5 Inès · Milieu centre',
    ],
    [{ t: 'def', cause: 'callahan', joueurs: ['c'] }, 'CALLAHAN · Callahan (but) · #5 Inès'],
    [
      { t: 'def', cause: 'marquage', joueurs: [], position: at('D-C') },
      'But adverse · Marquage individuel · Notre en-but centre',
    ],
    [{ t: 'def', cause: 'break_sans_but', joueurs: [] }, 'Break (sans but)'],
    [{ t: 'passeAdv' }, 'Passe adverse'],
  ])('%o', (event, text) => {
    expect(describeEvent(event, find)).toBe(text)
  })

  it('joueur inconnu', () => {
    expect(describeEvent({ t: 'reprise', joueur: 'zz', position: at('M2-C') }, find)).toBe(
      '#? ramasse le disque · Milieu centre',
    )
  })
})

describe('filtres', () => {
  const first = makeMatch([makePoint([], ['a'])], { id: 'm1', date: '2026-10-04', cree: 1 })
  const second = makeMatch([], {
    id: 'm2',
    date: '2026-10-05',
    evenement: 'Tournoi',
    type: 'entrainement',
    cree: 2,
  })
  const third = makeMatch([], { id: 'm3', date: '2026-10-05', equipeId: 'autre', cree: 3 })
  const all = [first, second, third]

  it('un filtre vide ne filtre rien', () => {
    expect(filterMatches(all, emptyFilters())).toHaveLength(3)
    expect(hasActiveFilters(emptyFilters())).toBe(false)
  })

  it('dates incluses, évènement exact, équipe, type, match', () => {
    expect(filterMatches(all, { ...emptyFilters(), from: '2026-10-05', to: '2026-10-05' })).toEqual(
      [second, third],
    )
    expect(filterMatches(all, { ...emptyFilters(), event: 'Tournoi' })).toEqual([second])
    expect(filterMatches(all, { ...emptyFilters(), event: 'Tourn' })).toEqual([])
    expect(filterMatches(all, { ...emptyFilters(), teamId: 'autre' })).toEqual([third])
    expect(filterMatches(all, { ...emptyFilters(), type: 'entrainement' })).toEqual([second])
    expect(filterMatches(all, { ...emptyFilters(), matchId: 'm1' })).toEqual([first])
  })

  it('matchs joués, évènements, tri de l’historique', () => {
    expect(matchesPlayedBy(all, 'a')).toEqual([first])
    expect(eventNames(all)).toEqual(['Championnat régional', 'Tournoi'])
    expect(sortMatchesByDate(all).map((match) => match.id)).toEqual(['m3', 'm2', 'm1'])
  })
})

describe('sélection de la ligne', () => {
  const match = handMadeMatch()

  it('points joués dans le match et candidats', () => {
    expect(pointsPlayedInMatch(match)).toEqual({ a: 6, b: 6, c: 6 })
    const team = { id: 'e_open', nom: 'Open', joueurs: ['a'] }
    expect(lineCandidates(match, team, players, false).map((p) => p.id)).toEqual(['a', 'b', 'c'])
    expect(lineCandidates(match, team, players, true).map((p) => p.id)).toEqual([
      'a',
      'b',
      'c',
      'e',
    ])
  })

  it('groupes par poste triés par numéro', () => {
    const groups = groupByPosition(players)
    expect(groups.Handler.map((p) => p.numero)).toEqual([5, 7])
    expect(groups.Middle.map((p) => p.numero)).toEqual([9, 12])
  })

  it('sens d’attaque, pull attendu, dernier lanceur, taille de ligne', () => {
    expect(defaultAttackRight(makeMatch([]))).toBe(true)
    expect(defaultAttackRight(match)).toBe(false)
    expect(expectedPuller(makeMatch([]))).toBeNull()
    expect(expectedPuller(match)).toBe('nous')
    expect(lastPuller(match, ['a', 'c'])).toBe('c')
    expect(lastPuller(match, ['a', 'b'])).toBe('a')
    expect(lastPuller(match, ['b'])).toBeNull()
    expect(lineSize(match)).toBe(7)
    expect(lineSize({ ...match, terrain: 'beach' })).toBe(5)
  })

  it('point en cours', () => {
    expect(currentPoint(match)).toBeNull()
    const live = makeMatch([
      makePoint([{ t: 'pull', equipe: 'nous', joueur: 'a', position: at('A-C') }]),
    ])
    expect(currentPointState(live)?.phase).toBe('defense')
  })
})

describe('mise en forme', () => {
  it('dates et nombres en français', () => {
    expect(formatLongDate('2026-11-14')).toBe('sam. 14 nov. 2026')
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatNumber(1.5)).toBe('1,5')
    expect(formatPercent(6, 7).replace(/\s/g, ' ')).toBe('86 %')
    expect(formatPercent(1, 0)).toBe('—')
    expect([formatSigned(2), formatSigned(0), formatSigned(-2)]).toEqual(['+2', '0', '−2'])
  })
})
