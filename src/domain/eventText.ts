// Textes du journal d'un point (« Passe #7 Léa → #9 Lucas · Milieu droite »…).

import { DEF_CAUSE_LABELS, isConcededCause, isRecoveryCause, TURN_CAUSE_LABELS } from './constants'
import type { DefCause, MatchEvent, Player, TurnCause } from './types'
import { positionName } from './zones'

export type PlayerLookup = (id: string) => Player | undefined

export function playerLabel(player: Player | undefined): string {
  return player ? `#${player.numero} ${player.prenom}` : '#?'
}

function defPrefix(cause: DefCause): string {
  if (cause === 'callahan') return 'CALLAHAN'
  if (isRecoveryCause(cause)) return 'Récupération'
  if (isConcededCause(cause)) return 'But adverse'
  return ''
}

function joinParts(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' · ')
}

/** Détail des passes ratées : « 1 drop, 2 mauvaise passe ». */
export function describeFailedPasses(counts: Partial<Record<string, number>>): string {
  return Object.entries(counts)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(
      ([cause, count]) =>
        `${count} ${(TURN_CAUSE_LABELS[cause as TurnCause] ?? cause).toLowerCase()}`,
    )
    .join(', ')
}

export function describeEvent(event: MatchEvent, findPlayer: PlayerLookup): string {
  const label = (id: string) => playerLabel(findPlayer(id))
  const names = (ids: string[]) => ids.map(label).join(', ')
  const where = positionName(event.t === 'passeAdv' ? undefined : event.position)
  switch (event.t) {
    case 'pull': {
      const landing = event.brick ? 'Brick' : where
      if (event.equipe === 'eux') return `Pull adverse → ${landing}`
      return `Pull${event.joueur ? ` de ${label(event.joueur)}` : ''} → ${landing}`
    }
    case 'reprise':
      return joinParts([`${label(event.joueur)} ramasse le disque`, where])
    case 'passe':
      if (event.but) return `BUT de ${label(event.a)} · passe décisive de ${label(event.de)}`
      return joinParts([`Passe ${label(event.de)} → ${label(event.a)}`, where])
    case 'turn':
      return joinParts(['TURN', TURN_CAUSE_LABELS[event.cause], names(event.joueurs), where])
    case 'def':
      return joinParts([
        defPrefix(event.cause),
        DEF_CAUSE_LABELS[event.cause],
        names(event.joueurs),
        where,
      ])
    case 'passeAdv':
      return 'Passe adverse'
  }
}
