// Constantes métier : tailles de ligne, causes et leurs libellés, pondérations des indices.

import type {
  ConcededCause,
  DefCause,
  FieldType,
  MatchType,
  Position,
  RecoveryCause,
  TurnCause,
} from './types'

/** Nombre indicatif de joueurs sur le terrain (jamais imposé). */
export const LINE_SIZE: Record<FieldType, number> = { outdoor: 7, indoor: 5, beach: 5 }

export const POSITIONS: Position[] = ['Handler', 'Middle']
export const FIELD_TYPES: FieldType[] = ['indoor', 'outdoor', 'beach']
export const MATCH_TYPES: MatchType[] = ['competition', 'entrainement']

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  beach: 'Beach',
}

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  competition: 'Compétition',
  entrainement: 'Entraînement',
}

export const TURN_CAUSES: TurnCause[] = [
  'mauvaise_passe',
  'drop',
  'duel_perdu',
  'stall_out',
  'callahan',
]

/** Turns qui comptent comme une passe tentée par le porteur (le stall out n'est pas une passe). */
export const THROW_TURN_CAUSES: TurnCause[] = ['mauvaise_passe', 'drop', 'duel_perdu', 'callahan']

/** Turns où le porteur est présélectionné comme fautif. */
export const CARRIER_FAULT_CAUSES: TurnCause[] = ['mauvaise_passe', 'stall_out', 'callahan']

export const RECOVERY_CAUSES: RecoveryCause[] = [
  'contre',
  'mauvaise_passe_adv',
  'drop_adv',
  'stall_adv',
  'autre_recup',
]

export const CONCEDED_CAUSES: ConcededCause[] = [
  'marquage',
  'break',
  'communication',
  'positionnement',
  'autre_but',
]

export const TURN_CAUSE_LABELS: Record<TurnCause, string> = {
  mauvaise_passe: 'Mauvaise passe',
  drop: 'Drop',
  duel_perdu: 'Duel perdu',
  stall_out: 'Stall out',
  callahan: 'Callahan (but adverse)',
}

export const DEF_CAUSE_LABELS: Record<DefCause, string> = {
  contre: 'Contre / interception',
  mauvaise_passe_adv: 'Mauvaise passe adverse',
  drop_adv: 'Drop adverse',
  stall_adv: 'Stall out adverse',
  autre_recup: 'Autre',
  callahan: 'Callahan (but)',
  break_sans_but: 'Break (sans but)',
  marquage: 'Marquage individuel',
  break: 'Break',
  communication: 'Communication',
  positionnement: 'Positionnement',
  autre_but: 'Autre',
}

/** Libellé de la cause « Callahan subi » dans les buts encaissés (turn Callahan). */
export const CALLAHAN_CONCEDED = 'callahan_subi'
export const CALLAHAN_CONCEDED_LABEL = 'Callahan subi'

function labelsFor(causes: readonly DefCause[]): Partial<Record<string, string>> {
  return Object.fromEntries(causes.map((cause) => [cause, DEF_CAUSE_LABELS[cause]]))
}

/** Libellés des barres « récupérations par type » (Callahans inclus). */
export const RECOVERY_LABELS = labelsFor([...RECOVERY_CAUSES, 'callahan'])
/** Libellés des barres « buts encaissés par cause » (avec le Callahan subi). */
export const CONCEDED_LABELS = {
  ...labelsFor(CONCEDED_CAUSES),
  [CALLAHAN_CONCEDED]: CALLAHAN_CONCEDED_LABEL,
}
/** Libellés des barres « fautes défensives par type ». */
export const DEFENSIVE_FAULT_LABELS = labelsFor(['break_sans_but', ...CONCEDED_CAUSES])

export function isRecoveryCause(cause: DefCause): cause is RecoveryCause {
  return (RECOVERY_CAUSES as DefCause[]).includes(cause)
}

export function isConcededCause(cause: DefCause): cause is ConcededCause {
  return (CONCEDED_CAUSES as DefCause[]).includes(cause)
}

/** Pondérations des indices de performance (section 7 de la spécification). */
export const INDEX_WEIGHTS = {
  goal: 3,
  assist: 3,
  completedPass: 0.2,
  reception: 0.1,
  turn: 2,
  block: 3,
  otherRecovery: 1,
  defensiveFault: 1,
} as const

/** Zone de reprise quand la dernière zone est inconnue (brick ou récupération sans zone). */
export const DEFAULT_PICKUP_ZONE = 'M1-C' as const

/** Nombre d'actions affichées dans le journal du point. */
export const LOG_SIZE = 6
