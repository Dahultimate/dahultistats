// Petit match construit à la main, dont toutes les statistiques sont calculées dans les tests.

import { derivePointState } from '@/domain/pointState'
import type { Match, MatchEvent, Player, Point } from '@/domain/types'
import { zoneCenter } from '@/domain/zones'

/** Centre d'une zone : position lisible dans les tests. */
export const at = zoneCenter

type EventWithoutTime = MatchEvent extends infer E
  ? E extends MatchEvent
    ? Omit<E, 'ts'>
    : never
  : never

/** Construit un point ; chaque évènement reçoit une heure : 0 s, 1 s, 2 s… */
export function makePoint(events: EventWithoutTime[], ligne = ['a', 'b', 'c']): Point {
  const evenements = events.map((event, index) => ({ ...event, ts: index * 1000 }) as MatchEvent)
  return { ligne, attaqueDroite: true, evenements, resultat: derivePointState(evenements).winner }
}

export function makeMatch(points: Point[], overrides: Partial<Match> = {}): Match {
  return {
    id: 'm_test',
    cree: 1,
    date: '2026-10-04',
    terrain: 'outdoor',
    equipeId: 'e_open',
    equipeNom: 'Open',
    adversaire: 'Les Frelons',
    evenement: 'Championnat régional',
    type: 'competition',
    termine: true,
    points,
    ...overrides,
  }
}

export const PLAYERS: Player[] = [
  { id: 'a', prenom: 'Léa', nom: 'Martin', numero: 7, poste: 'Handler', actif: true },
  { id: 'b', prenom: 'Lucas', nom: 'Girard', numero: 9, poste: 'Middle', actif: true },
  { id: 'c', prenom: 'Inès', nom: 'Faure', numero: 5, poste: 'Handler', actif: true },
]

/**
 * Six points : 3 – 3.
 * P1 (O) gagné après un drop et un contre ; P2 (D) perdu (marquage, pull brick) ;
 * P3 (D) gagné sur Callahan ; P4 (O) perdu (break sans but, stall out…) ;
 * P5 (O) perdu sur Callahan subi ; P6 (O) gagné sans turn.
 */
export function handMadeMatch(): Match {
  return makeMatch([
    makePoint([
      { t: 'pull', equipe: 'eux', position: at('D-C') },
      { t: 'reprise', joueur: 'a', position: at('D-C') },
      { t: 'passe', de: 'a', a: 'b', position: at('M1-L') },
      { t: 'passe', de: 'b', a: 'c', position: at('M2-C') },
      { t: 'turn', cause: 'drop', joueurs: ['b'], position: at('M3-L'), porteur: 'c' },
      { t: 'def', cause: 'contre', joueurs: ['a'], position: at('M3-R') },
      { t: 'reprise', joueur: 'a', position: at('M3-R') },
      { t: 'passe', de: 'a', a: 'b', position: at('A-C'), but: true },
    ]),
    makePoint([
      { t: 'pull', equipe: 'nous', joueur: 'a', brick: true },
      { t: 'passeAdv' },
      { t: 'passeAdv' },
      { t: 'def', cause: 'marquage', joueurs: ['b'], position: at('D-L') },
    ]),
    makePoint([
      { t: 'pull', equipe: 'nous', joueur: 'c', position: at('A-C') },
      { t: 'def', cause: 'callahan', joueurs: ['c'], position: at('A-L') },
    ]),
    makePoint([
      { t: 'pull', equipe: 'eux', position: at('M1-C') },
      { t: 'reprise', joueur: 'b', position: at('M1-C') },
      { t: 'turn', cause: 'mauvaise_passe', joueurs: ['b'], position: at('M1-C'), porteur: 'b' },
      { t: 'def', cause: 'break_sans_but', joueurs: ['a'] },
      { t: 'def', cause: 'drop_adv', joueurs: [], position: at('M2-C') },
      { t: 'reprise', joueur: 'c', position: at('M2-C') },
      { t: 'turn', cause: 'stall_out', joueurs: ['c'], position: at('M2-C'), porteur: 'c' },
      { t: 'def', cause: 'autre_but', joueurs: [] },
    ]),
    makePoint([
      { t: 'pull', equipe: 'eux', position: at('D-R') },
      { t: 'reprise', joueur: 'a', position: at('D-R') },
      { t: 'turn', cause: 'callahan', joueurs: ['a'], position: at('D-R'), porteur: 'a' },
    ]),
    makePoint([
      { t: 'pull', equipe: 'eux', position: at('M1-C') },
      { t: 'reprise', joueur: 'a', position: at('M1-C') },
      { t: 'passe', de: 'a', a: 'c', position: at('A-R'), but: true },
    ]),
  ])
}
