// Types du format JSON « ultimate-stats » version 1.
// Les noms de champs restent en français : ils doivent rester compatibles avec les fichiers existants.

export type Position = 'Handler' | 'Middle'
export type FieldType = 'indoor' | 'outdoor' | 'beach'
export type MatchType = 'competition' | 'entrainement'
/** Côté d'une action : notre équipe (`nous`) ou l'adversaire (`eux`). */
export type Side = 'nous' | 'eux'

/** Rang d'une zone, toujours dans le sens de NOTRE attaque : D (notre en-but) → A (en-but adverse). */
export type Rank = 'D' | 'M1' | 'M2' | 'M3' | 'A'
/** Couloir vu par un joueur de notre équipe qui attaque. */
export type Lane = 'L' | 'C' | 'R'
export type ZoneId = `${Rank}-${Lane}`
export type PullZone = ZoneId | 'brick'

export type TurnCause = 'mauvaise_passe' | 'drop' | 'duel_perdu' | 'stall_out' | 'callahan'
export type RecoveryCause =
  'contre' | 'mauvaise_passe_adv' | 'drop_adv' | 'stall_adv' | 'autre_recup'
export type ConcededCause = 'marquage' | 'break' | 'communication' | 'positionnement' | 'autre_but'
export type DefCause = RecoveryCause | 'callahan' | 'break_sans_but' | ConcededCause

export interface Player {
  id: string
  prenom: string
  nom: string
  numero: number
  poste: Position
  actif: boolean
}

export interface Team {
  id: string
  nom: string
  joueurs: string[]
}

export interface PullEvent {
  t: 'pull'
  equipe: Side
  joueur?: string
  zone: PullZone
  ts?: number
}

export interface PickupEvent {
  t: 'reprise'
  joueur: string
  zone: ZoneId
  ts?: number
}

export interface PassEvent {
  t: 'passe'
  de: string
  a: string
  zone: ZoneId
  but?: boolean
  ts?: number
}

export interface TurnEvent {
  t: 'turn'
  cause: TurnCause
  joueurs: string[]
  zone: ZoneId
  porteur: string | null
  ts?: number
}

export interface DefenseEvent {
  t: 'def'
  cause: DefCause
  joueurs: string[]
  zone: ZoneId | null
  ts?: number
}

export interface OpponentPassEvent {
  t: 'passeAdv'
  ts?: number
}

export type MatchEvent =
  PullEvent | PickupEvent | PassEvent | TurnEvent | DefenseEvent | OpponentPassEvent

export interface Point {
  ligne: string[]
  /** Sens d'affichage seulement : les zones sont toujours enregistrées dans le sens de notre attaque. */
  attaqueDroite: boolean
  evenements: MatchEvent[]
  resultat: Side | null
}

export interface Match {
  id: string
  cree: number
  date: string
  terrain: FieldType
  equipeId: string
  /** Copie du nom de l'équipe, pour l'historique si l'équipe est supprimée. */
  equipeNom: string
  adversaire: string
  evenement: string
  type: MatchType
  termine: boolean
  points: Point[]
}

export interface AppData {
  format: 'ultimate-stats'
  version: 1
  exporteLe?: string
  exemple: boolean
  joueurs: Player[]
  equipes: Team[]
  matchs: Match[]
}
