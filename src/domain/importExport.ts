// Import tolérant et export du fichier JSON « ultimate-stats ».
// Les champs inconnus sont conservés tels quels : un fichier de la version actuelle se relit sans perte.

import { toIsoDate } from './format'
import type {
  AppData,
  FieldType,
  Match,
  MatchEvent,
  MatchType,
  Player,
  Point,
  Position,
  Side,
  Team,
} from './types'

export type ImportError = 'invalid_json' | 'invalid_format'
export type ImportResult = { ok: true; data: AppData } | { ok: false; error: ImportError }

type RawObject = Record<string, unknown>

const EVENT_TYPES: MatchEvent['t'][] = ['pull', 'reprise', 'passe', 'turn', 'def', 'passeAdv']

function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasId(value: unknown): value is RawObject & { id: string } {
  return isObject(value) && typeof value.id === 'string' && value.id !== ''
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function text(value: unknown): string {
  return typeof value === 'string'
    ? value
    : value === undefined || value === null
      ? ''
      : String(value)
}

function idList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

function normalizePlayer(raw: RawObject & { id: string }): Player {
  return {
    ...raw,
    id: raw.id,
    prenom: text(raw.prenom),
    nom: text(raw.nom),
    numero: Number(raw.numero) || 0,
    poste: oneOf<Position>(raw.poste, ['Handler', 'Middle'], 'Middle'),
    actif: raw.actif !== false,
  }
}

function normalizeTeam(raw: RawObject & { id: string }): Team {
  return { ...raw, id: raw.id, nom: text(raw.nom), joueurs: idList(raw.joueurs) }
}

function normalizeEvent(raw: RawObject): MatchEvent {
  const event = { ...raw } as RawObject
  if (event.t === 'turn' || event.t === 'def') event.joueurs = idList(event.joueurs)
  if (event.t === 'turn') event.porteur = typeof event.porteur === 'string' ? event.porteur : null
  if (event.t === 'def') event.zone = typeof event.zone === 'string' ? event.zone : null
  return event as unknown as MatchEvent
}

function normalizePoint(raw: RawObject): Point {
  const events = Array.isArray(raw.evenements) ? raw.evenements : []
  return {
    ...raw,
    ligne: idList(raw.ligne),
    attaqueDroite: raw.attaqueDroite !== false,
    resultat: raw.resultat === 'nous' || raw.resultat === 'eux' ? (raw.resultat as Side) : null,
    evenements: events
      .filter(
        (event): event is RawObject =>
          isObject(event) && EVENT_TYPES.includes(event.t as MatchEvent['t']),
      )
      .map(normalizeEvent),
  }
}

function normalizeMatch(raw: RawObject & { id: string }): Match {
  const points = Array.isArray(raw.points) ? raw.points.filter(isObject) : []
  return {
    ...raw,
    id: raw.id,
    cree: Number(raw.cree) || 0,
    date: text(raw.date),
    terrain: oneOf<FieldType>(raw.terrain, ['indoor', 'outdoor', 'beach'], 'outdoor'),
    equipeId: text(raw.equipeId),
    equipeNom: text(raw.equipeNom),
    adversaire: text(raw.adversaire),
    evenement: text(raw.evenement),
    type: oneOf<MatchType>(raw.type, ['competition', 'entrainement'], 'competition'),
    termine: raw.termine === true,
    points: points.map(normalizePoint),
  }
}

/** Normalise un objet déjà lu ; null si les listes attendues sont absentes. */
export function normalizeAppData(raw: unknown): AppData | null {
  if (!isObject(raw)) return null
  const { joueurs, equipes, matchs } = raw
  if (!Array.isArray(joueurs) || !Array.isArray(equipes) || !Array.isArray(matchs)) return null
  return {
    ...raw,
    format: 'ultimate-stats',
    version: 1,
    exemple: raw.exemple === true,
    joueurs: joueurs.filter(hasId).map(normalizePlayer),
    equipes: equipes.filter(hasId).map(normalizeTeam),
    matchs: matchs.filter(hasId).map(normalizeMatch),
  }
}

export function parseAppData(content: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(content)
  } catch {
    return { ok: false, error: 'invalid_json' }
  }
  const data = normalizeAppData(raw)
  return data ? { ok: true, data } : { ok: false, error: 'invalid_format' }
}

/** JSON indenté de 2 espaces, avec la date d'export. */
export function serializeAppData(data: AppData, now: Date): string {
  const { format, version, exemple, joueurs, equipes, matchs, ...others } = data
  const ordered = { format, version, exporteLe: '', exemple, joueurs, equipes, matchs, ...others }
  // Après la décomposition : remplace la date de l'export précédent sans changer l'ordre des champs.
  ordered.exporteLe = now.toISOString()
  return JSON.stringify(ordered, null, 2)
}

export function exportFileName(now: Date): string {
  return `stats-ultimate-${toIsoDate(now)}.json`
}

export function createEmptyData(): AppData {
  return {
    format: 'ultimate-stats',
    version: 1,
    exemple: false,
    joueurs: [],
    equipes: [],
    matchs: [],
  }
}

/** Identifiant : préfixe + « _ » + caractères aléatoires en base 36. */
export function generateId(prefix: 'j' | 'e' | 'm', random: () => number = Math.random): string {
  const chars = Array.from({ length: 9 }, () => Math.floor(random() * 36).toString(36))
  return `${prefix}_${chars.join('')}`
}
