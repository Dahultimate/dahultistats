import { describe, expect, it } from 'vitest'

import { computeAffinities, partnersOf } from '@/domain/stats/affinities'

import { at, handMadeMatch, makeMatch, makePoint } from './fixtures'

describe('affinités entre joueurs', () => {
  const pairs = computeAffinities([handMadeMatch()])

  it('passes, passes décisives et drops dans chaque sens, points joués ensemble', () => {
    expect(pairs).toEqual([
      // a → b deux fois, dont le but du point 1.
      {
        a: 'a',
        b: 'b',
        passes: [2, 0],
        assists: [1, 0],
        drops: [0, 0],
        points: 6,
        differential: 0,
      },
      // a → c : le but du point 6.
      {
        a: 'a',
        b: 'c',
        passes: [1, 0],
        assists: [1, 0],
        drops: [0, 0],
        points: 6,
        differential: 0,
      },
      // b → c, puis b lâche la passe de c (drop, porteur c).
      {
        a: 'b',
        b: 'c',
        passes: [1, 0],
        assists: [0, 0],
        drops: [0, 1],
        points: 6,
        differential: 0,
      },
    ])
  })

  it('partenaires d’un joueur, orientés depuis lui', () => {
    expect(partnersOf(pairs, 'c')).toMatchObject([
      { a: 'c', b: 'a', passes: [0, 1], assists: [0, 1] },
      { a: 'c', b: 'b', passes: [0, 1], drops: [1, 0] },
    ])
  })

  it('même duo quel que soit l’ordre ; point non terminé et duo sans passe ignorés', () => {
    const unfinished = makePoint(
      [
        { t: 'pull', equipe: 'eux', position: at('M1-C') },
        { t: 'reprise', joueur: 'b', position: at('M1-C') },
        { t: 'passe', de: 'b', a: 'a', position: at('M2-C') },
      ],
      ['b', 'a', 'x'],
    )
    const won = makePoint(
      [
        { t: 'pull', equipe: 'eux', position: at('M1-C') },
        { t: 'reprise', joueur: 'a', position: at('M1-C') },
        { t: 'passe', de: 'a', a: 'b', position: at('A-C'), but: true },
      ],
      ['a', 'b', 'x'],
    )
    expect(unfinished.resultat).toBeNull()
    expect(computeAffinities([makeMatch([unfinished, won])])).toEqual([
      {
        a: 'a',
        b: 'b',
        passes: [1, 1],
        assists: [1, 0],
        drops: [0, 0],
        points: 1,
        differential: 1,
      },
    ])
  })
})
