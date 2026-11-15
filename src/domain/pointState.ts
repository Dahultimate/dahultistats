// Machine à états d'un point : l'état (phase, porteur, zone du porteur, vainqueur) se déduit
// uniquement de la liste des évènements. Annuler revient donc à retirer le dernier évènement.

import { DEFAULT_PICKUP_ZONE, isConcededCause, isRecoveryCause } from './constants'
import type { MatchEvent, Point, PullZone, Side, ZoneId } from './types'

export type Phase = 'engagement' | 'reprise' | 'attaque' | 'defense' | 'fin'

export interface PointState {
  phase: Phase
  /** Joueur qui a le disque (en attaque). */
  carrier: string | null
  carrierZone: ZoneId | null
  winner: Side | null
  /** Zone présélectionnée pour la reprise du jeu. */
  pickupZone: ZoneId
}

export const INITIAL_POINT_STATE: PointState = {
  phase: 'engagement',
  carrier: null,
  carrierZone: null,
  winner: null,
  pickupZone: DEFAULT_PICKUP_ZONE,
}

function pickupZoneFrom(zone: PullZone | null): ZoneId {
  return zone === null || zone === 'brick' ? DEFAULT_PICKUP_ZONE : zone
}

function endPoint(state: PointState, winner: Side): PointState {
  return { ...state, phase: 'fin', winner, carrier: null, carrierZone: null }
}

function toDefense(state: PointState): PointState {
  return { ...state, phase: 'defense', carrier: null, carrierZone: null }
}

export function nextPointState(state: PointState, event: MatchEvent): PointState {
  // Un point terminé ne change plus (évènements parasites d'un fichier importé).
  if (state.phase === 'fin') return state
  switch (event.t) {
    case 'pull':
      return event.equipe === 'nous'
        ? toDefense(state)
        : { ...state, phase: 'reprise', pickupZone: pickupZoneFrom(event.zone) }
    case 'reprise':
      return { ...state, phase: 'attaque', carrier: event.joueur, carrierZone: event.zone }
    case 'passe':
      if (event.but) return endPoint(state, 'nous')
      return { ...state, phase: 'attaque', carrier: event.a, carrierZone: event.zone }
    case 'turn':
      return event.cause === 'callahan' ? endPoint(state, 'eux') : toDefense(state)
    case 'def':
      if (isRecoveryCause(event.cause)) {
        return { ...toDefense(state), phase: 'reprise', pickupZone: pickupZoneFrom(event.zone) }
      }
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
