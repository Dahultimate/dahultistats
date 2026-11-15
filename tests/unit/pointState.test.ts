import { describe, expect, it } from 'vitest'

import {
  appendEvent,
  derivePointState,
  INITIAL_POINT_STATE,
  pullingSide,
  removeLastEvent,
} from '@/domain/pointState'
import type { MatchEvent, Point } from '@/domain/types'

const pullUs: MatchEvent = { t: 'pull', equipe: 'nous', joueur: 'a', zone: 'M3-C' }
const pullThem: MatchEvent = { t: 'pull', equipe: 'eux', zone: 'D-L' }
const pickup: MatchEvent = { t: 'reprise', joueur: 'a', zone: 'D-L' }
const pass: MatchEvent = { t: 'passe', de: 'a', a: 'b', zone: 'M2-R' }
const goal: MatchEvent = { t: 'passe', de: 'a', a: 'b', zone: 'A-C', but: true }
const turn: MatchEvent = { t: 'turn', cause: 'drop', joueurs: ['b'], zone: 'M2-C', porteur: 'a' }

const toAttack = [pullThem, pickup]
const toDefense = [pullUs]

describe('derivePointState : transitions de la section 6', () => {
  it('Engagement sans évènement', () => {
    expect(derivePointState([])).toEqual(INITIAL_POINT_STATE)
  })

  it('Engagement + pull lancé par nous → Défense', () => {
    expect(derivePointState([pullUs]).phase).toBe('defense')
  })

  it('Engagement + pull adverse → Reprise, zone du pull présélectionnée', () => {
    const state = derivePointState([pullThem])
    expect(state.phase).toBe('reprise')
    expect(state.pickupZone).toBe('D-L')
  })

  it('pull adverse brick → reprise présélectionnée en M1-C', () => {
    expect(derivePointState([{ t: 'pull', equipe: 'eux', zone: 'brick' }]).pickupZone).toBe('M1-C')
  })

  it('Reprise + reprise → Attaque, ce joueur a le disque', () => {
    const state = derivePointState(toAttack)
    expect(state).toMatchObject({ phase: 'attaque', carrier: 'a', carrierZone: 'D-L' })
  })

  it('Attaque + passe hors en-but → Attaque, le receveur a le disque', () => {
    const state = derivePointState([...toAttack, pass])
    expect(state).toMatchObject({ phase: 'attaque', carrier: 'b', carrierZone: 'M2-R' })
  })

  it('Attaque + passe dans l’en-but adverse → fin du point, point pour nous', () => {
    expect(derivePointState([...toAttack, goal])).toMatchObject({ phase: 'fin', winner: 'nous' })
  })

  it('Attaque + turn → Défense', () => {
    expect(derivePointState([...toAttack, turn])).toMatchObject({ phase: 'defense', carrier: null })
  })

  it('Attaque + turn Callahan → fin du point, point pour l’adversaire', () => {
    const callahan: MatchEvent = { ...turn, cause: 'callahan' } as MatchEvent
    expect(derivePointState([...toAttack, callahan])).toMatchObject({ phase: 'fin', winner: 'eux' })
  })

  it.each(['contre', 'mauvaise_passe_adv', 'drop_adv', 'stall_adv', 'autre_recup'] as const)(
    'Défense + récupération %s → Reprise à la zone de la récupération',
    (cause) => {
      const state = derivePointState([...toDefense, { t: 'def', cause, joueurs: [], zone: 'M2-L' }])
      expect(state).toMatchObject({ phase: 'reprise', pickupZone: 'M2-L' })
    },
  )

  it('récupération sans zone → reprise présélectionnée en M1-C', () => {
    const state = derivePointState([
      ...toDefense,
      { t: 'def', cause: 'contre', joueurs: [], zone: null },
    ])
    expect(state.pickupZone).toBe('M1-C')
  })

  it('Défense + Callahan → fin du point, point pour nous', () => {
    const state = derivePointState([
      ...toDefense,
      { t: 'def', cause: 'callahan', joueurs: ['a'], zone: 'A-C' },
    ])
    expect(state).toMatchObject({ phase: 'fin', winner: 'nous' })
  })

  it('Défense + Break (sans but) ou passe adverse → Défense', () => {
    const breakWithoutGoal: MatchEvent = {
      t: 'def',
      cause: 'break_sans_but',
      joueurs: [],
      zone: null,
    }
    expect(derivePointState([...toDefense, breakWithoutGoal]).phase).toBe('defense')
    expect(derivePointState([...toDefense, { t: 'passeAdv' }]).phase).toBe('defense')
  })

  it.each(['marquage', 'break', 'communication', 'positionnement', 'autre_but'] as const)(
    'Défense + but adverse %s → fin du point, point pour l’adversaire',
    (cause) => {
      const state = derivePointState([...toDefense, { t: 'def', cause, joueurs: [], zone: null }])
      expect(state).toMatchObject({ phase: 'fin', winner: 'eux' })
    },
  )

  it('ignore les évènements après la fin du point', () => {
    expect(derivePointState([...toAttack, goal, turn])).toMatchObject({
      phase: 'fin',
      winner: 'nous',
    })
  })
})

describe('annulation', () => {
  const sequence: MatchEvent[] = [
    pullThem,
    pickup,
    pass,
    turn,
    { t: 'passeAdv' },
    { t: 'def', cause: 'contre', joueurs: ['c'], zone: 'M2-L' },
    { t: 'reprise', joueur: 'c', zone: 'M2-L' },
    goal,
  ]

  it('retirer le dernier évènement redonne l’état précédent, à chaque étape', () => {
    let point: Point = {
      ligne: ['a', 'b', 'c'],
      attaqueDroite: true,
      evenements: [],
      resultat: null,
    }
    const states = [derivePointState([])]
    for (const event of sequence) {
      point = appendEvent(point, event)
      states.push(derivePointState(point.evenements))
    }
    expect(point.resultat).toBe('nous')
    for (let index = sequence.length - 1; index >= 0; index--) {
      point = removeLastEvent(point)
      expect(derivePointState(point.evenements)).toEqual(states[index])
    }
    expect(point.resultat).toBeNull()
  })

  it('pullingSide renvoie l’équipe qui a lancé le pull', () => {
    const point: Point = { ligne: [], attaqueDroite: true, evenements: [pullUs], resultat: null }
    expect(pullingSide(point)).toBe('nous')
    expect(pullingSide({ ...point, evenements: [] })).toBeNull()
  })
})
