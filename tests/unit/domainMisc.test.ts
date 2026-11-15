import { describe, expect, it } from 'vitest'

import { describeEvent } from '@/domain/eventText'
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
import { heatmapGrid, isOpponentEndzone, screenGrid, zoneName } from '@/domain/zones'

import { handMadeMatch, makeMatch, makePoint, PLAYERS } from './fixtures'

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
    expect(zoneName('brick')).toBe('Brick')
    expect(zoneName(null)).toBe('')
  })

  it('correspondance écran ↔ zones selon le sens d’attaque', () => {
    expect(screenGrid(true)[0]).toEqual(['D-L', 'M1-L', 'M2-L', 'M3-L', 'A-L'])
    expect(screenGrid(true)[2]![4]).toBe('A-R')
    expect(screenGrid(false)[0]).toEqual(['A-R', 'M3-R', 'M2-R', 'M1-R', 'D-R'])
    expect(screenGrid(false)[2]![0]).toBe('A-L')
  })

  it('carte de chaleur : en-but adverse en haut, gauche à gauche', () => {
    expect(heatmapGrid()[0]).toEqual(['A-L', 'A-C', 'A-R'])
    expect(heatmapGrid()[4]).toEqual(['D-L', 'D-C', 'D-R'])
    expect(isOpponentEndzone('A-C')).toBe(true)
    expect(isOpponentEndzone('M3-C')).toBe(false)
  })
})

describe('textes du journal', () => {
  it.each<[MatchEvent, string]>([
    [
      { t: 'pull', equipe: 'nous', joueur: 'e', zone: 'M3-C' },
      'Pull de #12 Sarah → Tiers offensif centre',
    ],
    [{ t: 'pull', equipe: 'eux', zone: 'D-L' }, 'Pull adverse → Notre en-but gauche'],
    [{ t: 'pull', equipe: 'eux', zone: 'brick' }, 'Pull adverse → Brick'],
    [{ t: 'reprise', joueur: 'a', zone: 'M2-C' }, '#7 Léa ramasse le disque · Milieu centre'],
    [{ t: 'passe', de: 'a', a: 'b', zone: 'M2-R' }, 'Passe #7 Léa → #9 Lucas · Milieu droite'],
    [
      { t: 'passe', de: 'a', a: 'b', zone: 'A-R', but: true },
      'BUT de #9 Lucas · passe décisive de #7 Léa',
    ],
    [
      { t: 'turn', cause: 'drop', joueurs: ['b'], zone: 'M3-L', porteur: 'a' },
      'TURN · Drop · #9 Lucas · Tiers offensif gauche',
    ],
    [
      { t: 'def', cause: 'contre', joueurs: ['c'], zone: 'M2-C' },
      'Récupération · Contre / interception · #5 Inès · Milieu centre',
    ],
    [
      { t: 'def', cause: 'callahan', joueurs: ['c'], zone: null },
      'CALLAHAN · Callahan (but) · #5 Inès',
    ],
    [
      { t: 'def', cause: 'marquage', joueurs: [], zone: 'D-C' },
      'But adverse · Marquage individuel · Notre en-but centre',
    ],
    [{ t: 'def', cause: 'break_sans_but', joueurs: [], zone: null }, 'Break (sans but)'],
    [{ t: 'passeAdv' }, 'Passe adverse'],
  ])('%o', (event, text) => {
    expect(describeEvent(event, find)).toBe(text)
  })

  it('joueur inconnu', () => {
    expect(describeEvent({ t: 'reprise', joueur: 'zz', zone: 'M2-C' }, find)).toBe(
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
    const live = makeMatch([makePoint([{ t: 'pull', equipe: 'nous', joueur: 'a', zone: 'A-C' }])])
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
