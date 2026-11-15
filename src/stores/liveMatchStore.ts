// Saisie en direct : sous-étapes du point en cours (choix provisoires du coach) et
// enregistrement des évènements. L'état du point est toujours dérivé de ses évènements.

import { defineStore } from 'pinia'
import { computed, reactive, type Ref, ref } from 'vue'

import { CARRIER_FAULT_CAUSES } from '@/domain/constants'
import { describeEvent } from '@/domain/eventText'
import { currentPoint, lastPuller } from '@/domain/lineup'
import {
  appendEvent,
  derivePointState,
  type PointState,
  removeLastEvent,
} from '@/domain/pointState'
import { matchScore, type Score } from '@/domain/score'
import type {
  DefCause,
  Match,
  MatchEvent,
  Point,
  PullZone,
  Side,
  TurnCause,
  ZoneId,
} from '@/domain/types'
import { isOpponentEndzone } from '@/domain/zones'

import { useDataStore } from './dataStore'

export type LiveStep =
  | 'none'
  | 'chooseTeam'
  | 'pullUs'
  | 'pullThem'
  | 'pickup'
  | 'pass'
  | 'turnCause'
  | 'turnDetails'
  | 'defenseChoice'
  | 'defenseDetails'

/** Étapes où le toucher d'une zone est attendu. */
const ZONE_STEPS: LiveStep[] = [
  'pullUs',
  'pullThem',
  'pickup',
  'pass',
  'turnDetails',
  'defenseDetails',
]

type NewEvent = MatchEvent extends infer E ? (E extends MatchEvent ? Omit<E, 'ts'> : never) : never

interface Draft {
  pullTeam: Side | null
  turnMode: boolean
  turnCause: TurnCause | null
  defCause: DefCause | null
  zone: PullZone | null
  player: string | null
  players: string[]
}

function emptyDraft(): Draft {
  return {
    pullTeam: null,
    turnMode: false,
    turnCause: null,
    defCause: null,
    zone: null,
    player: null,
    players: [],
  }
}

export const useLiveMatchStore = defineStore('liveMatch', () => {
  const dataStore = useDataStore()
  const matchId = ref<string | null>(null)
  const draft = reactive<Draft>(emptyDraft())
  /** Fin de point à annoncer par la vue (toast + retour à la sélection de la ligne). */
  const pointEnded = ref<{ winner: Side; score: Score } | null>(null)

  const match = computed(() => (matchId.value ? dataStore.findMatch(matchId.value) : undefined))
  const point = computed(() => (match.value ? currentPoint(match.value) : null))
  const pointNumber = computed(() => match.value?.points.length ?? 0)
  const state = computed(() => (point.value ? derivePointState(point.value.evenements) : null))

  const step = computed<LiveStep>(() => {
    const phase = state.value?.phase
    if (!phase || phase === 'fin') return 'none'
    if (phase === 'engagement') {
      if (draft.pullTeam === null) return 'chooseTeam'
      return draft.pullTeam === 'nous' ? 'pullUs' : 'pullThem'
    }
    if (phase === 'reprise') return 'pickup'
    if (phase === 'attaque') {
      if (!draft.turnMode) return 'pass'
      return draft.turnCause ? 'turnDetails' : 'turnCause'
    }
    return draft.defCause ? 'defenseDetails' : 'defenseChoice'
  })

  const zoneExpected = computed(() => ZONE_STEPS.includes(step.value))
  /** Zone affichée en jaune : choix du coach, ou zone présélectionnée pour la reprise. */
  const selectedZone = computed<ZoneId | null>(() => {
    if (draft.zone && draft.zone !== 'brick') return draft.zone
    return step.value === 'pickup' ? (state.value?.pickupZone ?? null) : null
  })
  const goalPending = computed(() => step.value === 'pass' && isOpponentEndzone(selectedZone.value))
  const opponentPassesThisPoint = computed(
    () => point.value?.evenements.filter((event) => event.t === 'passeAdv').length ?? 0,
  )

  function open(id: string): void {
    if (matchId.value !== id) Object.assign(draft, emptyDraft())
    matchId.value = id
  }

  function resetDraft(): void {
    Object.assign(draft, emptyDraft())
  }

  function recordEvent(event: NewEvent): void {
    const current = match.value
    if (!current || !point.value) return
    const updated = appendEvent(point.value, { ...event, ts: Date.now() } as MatchEvent)
    current.points[current.points.length - 1] = updated
    dataStore.touch()
    resetDraft()
    if (updated.resultat)
      pointEnded.value = { winner: updated.resultat, score: matchScore(current) }
  }

  function startPoint(line: string[], attackRight: boolean): void {
    if (!match.value) return
    match.value.points.push({
      ligne: line,
      attaqueDroite: attackRight,
      evenements: [],
      resultat: null,
    })
    dataStore.touch()
    resetDraft()
  }

  /** Retire le dernier évènement ; renvoie son texte, ou null si le point n'en a aucun. */
  function undoLastEvent(): string | null {
    const current = match.value
    const last = point.value?.evenements.at(-1)
    if (!current || !point.value || !last) return null
    current.points[current.points.length - 1] = removeLastEvent(point.value)
    dataStore.touch()
    resetDraft()
    return describeEvent(last, dataStore.findPlayer)
  }

  function cancelPoint(): void {
    if (!match.value || !point.value) return
    match.value.points.pop()
    dataStore.touch()
    resetDraft()
  }

  /** Rouvre le dernier point terminé en retirant sa dernière action. */
  function reopenLastPoint(): void {
    const current = match.value
    const last = current?.points.at(-1)
    if (!current || !last || last.resultat === null) return
    current.points[current.points.length - 1] = removeLastEvent(last)
    dataStore.touch()
    resetDraft()
  }

  function toggleDirection(): void {
    if (!point.value) return
    point.value.attaqueDroite = !point.value.attaqueDroite
    dataStore.touch()
  }

  return {
    matchId,
    draft,
    pointEnded,
    match,
    point,
    pointNumber,
    state,
    step,
    zoneExpected,
    selectedZone,
    goalPending,
    opponentPassesThisPoint,
    open,
    resetDraft,
    recordEvent,
    startPoint,
    undoLastEvent,
    cancelPoint,
    reopenLastPoint,
    toggleDirection,
    ...useLiveInput(draft, { match, point, state, step, recordEvent }),
  }
})

interface LiveContext {
  match: Readonly<Ref<Match | undefined>>
  point: Readonly<Ref<Point | null>>
  state: Readonly<Ref<PointState | null>>
  step: Readonly<Ref<LiveStep>>
  recordEvent: (event: NewEvent) => void
}

/** Touches du coach : règle d'ordre libre (zone et joueur dans n'importe quel ordre). */
function useLiveInput(draft: Draft, live: LiveContext) {
  function tryRecordPull(): void {
    if (draft.zone === null) return
    if (draft.pullTeam === 'eux') live.recordEvent({ t: 'pull', equipe: 'eux', zone: draft.zone })
    else if (draft.player) {
      live.recordEvent({ t: 'pull', equipe: 'nous', joueur: draft.player, zone: draft.zone })
    }
  }

  function tryRecordPass(): void {
    const carrier = live.state.value?.carrier
    if (!draft.player || !draft.zone || draft.zone === 'brick' || !carrier) return
    const zone = draft.zone
    live.recordEvent({
      t: 'passe',
      de: carrier,
      a: draft.player,
      zone,
      ...(isOpponentEndzone(zone) ? { but: true } : {}),
    })
  }

  function selectZone(zone: PullZone): void {
    const step = live.step.value
    const carrier = live.state.value?.carrier ?? null
    if (step === 'pullUs' || step === 'pullThem') {
      draft.zone = zone
      return tryRecordPull()
    }
    if (zone === 'brick') return
    if (step === 'pickup') draft.zone = zone
    if (step === 'pass') {
      draft.zone = zone
      return tryRecordPass()
    }
    if (step === 'turnDetails' && draft.turnCause) {
      live.recordEvent({
        t: 'turn',
        cause: draft.turnCause,
        joueurs: [...draft.players],
        zone,
        porteur: carrier,
      })
    }
    if (step === 'defenseDetails' && draft.defCause) {
      live.recordEvent({ t: 'def', cause: draft.defCause, joueurs: [...draft.players], zone })
    }
  }

  function selectPlayer(id: string): void {
    const step = live.step.value
    if (step === 'pullUs') {
      draft.player = draft.player === id ? null : id
      return tryRecordPull()
    }
    if (step === 'pickup') {
      const zone = draft.zone && draft.zone !== 'brick' ? draft.zone : live.state.value?.pickupZone
      if (zone) live.recordEvent({ t: 'reprise', joueur: id, zone })
      return
    }
    if (step === 'pass') {
      draft.player = draft.player === id ? null : id
      return tryRecordPass()
    }
    if (step === 'turnDetails' || step === 'defenseDetails') {
      draft.players = draft.players.includes(id)
        ? draft.players.filter((other) => other !== id)
        : [...draft.players, id]
    }
  }

  function choosePullTeam(side: Side): void {
    draft.pullTeam = side
    const { match, point } = live
    if (side === 'nous' && match.value && point.value)
      draft.player = lastPuller(match.value, point.value.ligne)
  }

  function startTurn(): void {
    draft.turnMode = true
    draft.zone = null
    draft.player = null
  }

  function chooseTurnCause(cause: TurnCause): void {
    const carrier = live.state.value?.carrier
    draft.turnCause = cause
    draft.players = carrier && CARRIER_FAULT_CAUSES.includes(cause) ? [carrier] : []
  }

  function chooseDefCause(cause: DefCause): void {
    draft.defCause = cause
    draft.players = []
  }

  function validateDefenseWithoutZone(): void {
    if (draft.defCause)
      live.recordEvent({ t: 'def', cause: draft.defCause, joueurs: [...draft.players], zone: null })
  }

  function recordOpponentPass(): void {
    live.recordEvent({ t: 'passeAdv' })
  }

  /** « Retour » : annule la sous-étape en cours sans toucher aux évènements. */
  function back(): void {
    draft.zone = null
    draft.player = null
    draft.players = []
    if (draft.defCause) draft.defCause = null
    else if (draft.turnCause) draft.turnCause = null
    else if (draft.turnMode) draft.turnMode = false
    else draft.pullTeam = null
  }

  return {
    selectZone,
    selectPlayer,
    choosePullTeam,
    startTurn,
    chooseTurnCause,
    chooseDefCause,
    validateDefenseWithoutZone,
    recordOpponentPass,
    back,
  }
}
