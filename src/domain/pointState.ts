// Machine à états d'un point : l'état (phase, porteur, position du porteur, vainqueur) se déduit
// uniquement de la liste des évènements. Annuler revient donc à retirer le dernier évènement.

import { DEFAULT_PICKUP_ZONE, isConcededCause, isRecoveryCause } from './constants'
import type { FieldPosition, MatchEvent, Point, Side } from './types'
import { zoneCenter } from './zones'

export type Phase = 'engagement' | 'reprise' | 'attaque' | 'defense' | 'fin'

/** Étape du circuit de passes : joueur qui a eu le disque, et où. */
export interface TrailStop {
  player: string
  position: FieldPosition
}

export interface PointState {
  phase: Phase
  /** Joueur qui a le disque (en attaque). */
  carrier: string | null
  carrierPosition: FieldPosition | null
  winner: Side | null
  /** Endroit présélectionné pour la reprise du jeu. */
  pickupPosition: FieldPosition
  /** Circuit de la dernière possession : reprise puis chaque réception. */
  trail: TrailStop[]
}

const DEFAULT_PICKUP_POSITION = zoneCenter(DEFAULT_PICKUP_ZONE)

export const INITIAL_POINT_STATE: PointState = {
  phase: 'engagement',
  carrier: null,
  carrierPosition: null,
  winner: null,
  pickupPosition: DEFAULT_PICKUP_POSITION,
  trail: [],
}

function endPoint(state: PointState, winner: Side): PointState {
  return { ...state, phase: 'fin', winner, carrier: null, carrierPosition: null }
}

function toDefense(state: PointState): PointState {
  return { ...state, phase: 'defense', carrier: null, carrierPosition: null }
}

function toPickup(state: PointState, position: FieldPosition | undefined): PointState {
  return {
    ...toDefense(state),
    phase: 'reprise',
    pickupPosition: position ?? DEFAULT_PICKUP_POSITION,
  }
}

function receive(
  state: PointState,
  player: string,
  position: FieldPosition | undefined,
  trail: TrailStop[],
) {
  const stops = position ? [...trail, { player, position }] : trail
  return {
    ...state,
    phase: 'attaque' as const,
    carrier: player,
    carrierPosition: position ?? null,
    trail: stops,
  }
}

export function nextPointState(state: PointState, event: MatchEvent): PointState {
  // Un point terminé ne change plus (évènements parasites d'un fichier importé).
  if (state.phase === 'fin') return state
  switch (event.t) {
    case 'pull':
      return event.equipe === 'nous' ? toDefense(state) : toPickup(state, event.position)
    case 'reprise':
      return receive(state, event.joueur, event.position, [])
    case 'passe':
      if (event.but) return endPoint(state, 'nous')
      return receive(state, event.a, event.position, state.trail)
    case 'turn':
      return event.cause === 'callahan' ? endPoint(state, 'eux') : toDefense(state)
    case 'def':
      if (isRecoveryCause(event.cause)) return toPickup(state, event.position)
      if (event.cause === 'callahan') return endPoint(state, 'nous')
      if (isConcededCause(event.cause)) return endPoint(state, 'eux')
      return toDefense(state)
    case 'passeAdv':
      return toDefense(state)
  }
}

export function derivePointState(events: readonly MatchEvent[]): PointState {
  return events.reduce(nextPointState, INITIAL_POINT_STATE)
}

/** Ajoute un évènement et met à jour le résultat du point. */
export function appendEvent(point: Point, event: MatchEvent): Point {
  const evenements = [...point.evenements, event]
  return { ...point, evenements, resultat: derivePointState(evenements).winner }
}

/** Retire le dernier évènement (annulation) et recalcule le résultat. */
export function removeLastEvent(point: Point): Point {
  const evenements = point.evenements.slice(0, -1)
  return { ...point, evenements, resultat: derivePointState(evenements).winner }
}

/** Équipe qui a lancé le pull du point, ou null si le pull n'est pas encore saisi. */
export function pullingSide(point: Point): Side | null {
  const pull = point.evenements.find((event) => event.t === 'pull')
  return pull?.t === 'pull' ? pull.equipe : null
}
