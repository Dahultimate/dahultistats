// Affinités entre joueurs : ce que chaque duo s'échange (passes, passes décisives, drops)
// et le résultat des points joués ensemble. Fonction pure, recalculée à la volée comme computeStats.

import type { Match } from '../types'

/** Compteur dans les deux sens : [de a vers b, de b vers a]. */
export type BothWays = [number, number]

export interface PairAffinity {
  a: string
  b: string
  passes: BothWays
  /** [a fait marquer b, b fait marquer a]. */
  assists: BothWays
  /** [passe de a lâchée par b, passe de b lâchée par a]. */
  drops: BothWays
  /** Points terminés joués ensemble. */
  points: number
  /** Points gagnés − points perdus quand les deux sont sur le terrain. */
  differential: number
}

export const total = (counts: BothWays): number => counts[0] + counts[1]

export function computeAffinities(matches: readonly Match[]): PairAffinity[] {
  const pairs = new Map<string, PairAffinity>()
  const pairOf = (x: string, y: string): PairAffinity => {
    const [a, b] = x < y ? [x, y] : [y, x]
    const key = `${a}|${b}`
    let pair = pairs.get(key)
    if (!pair) {
      pair = { a, b, passes: [0, 0], assists: [0, 0], drops: [0, 0], points: 0, differential: 0 }
      pairs.set(key, pair)
    }
    return pair
  }
  const count = (from: string, to: string, field: 'passes' | 'assists' | 'drops'): void => {
    const pair = pairOf(from, to)
    pair[field][from === pair.a ? 0 : 1]++
  }

  for (const point of matches.flatMap((match) => match.points)) {
    if (point.resultat !== null) {
      point.ligne.forEach((x, i) => {
        for (const y of point.ligne.slice(i + 1)) {
          const pair = pairOf(x, y)
          pair.points++
          pair.differential += point.resultat === 'nous' ? 1 : -1
        }
      })
    }
    for (const event of point.evenements) {
      if (event.t === 'passe' && event.de !== event.a) {
        count(event.de, event.a, 'passes')
        if (event.but) count(event.de, event.a, 'assists')
      }
      if (event.t === 'turn' && event.cause === 'drop' && event.porteur) {
        for (const id of event.joueurs) if (id !== event.porteur) count(event.porteur, id, 'drops')
      }
    }
  }

  // Seuls les duos qui se sont passé le disque ; les plus liés d'abord.
  return [...pairs.values()]
    .filter((pair) => total(pair.passes) + total(pair.drops) > 0)
    .sort(
      (x, y) =>
        total(y.passes) - total(x.passes) ||
        total(y.assists) - total(x.assists) ||
        y.differential - x.differential,
    )
}

/** Duos d'un joueur, orientés depuis lui : `a` est toujours ce joueur. */
export function partnersOf(pairs: readonly PairAffinity[], playerId: string): PairAffinity[] {
  const flip = ([x, y]: BothWays): BothWays => [y, x]
  return pairs
    .filter((pair) => pair.a === playerId || pair.b === playerId)
    .map((pair) =>
      pair.a === playerId
        ? pair
        : {
            ...pair,
            a: pair.b,
            b: pair.a,
            passes: flip(pair.passes),
            assists: flip(pair.assists),
            drops: flip(pair.drops),
          },
    )
}
