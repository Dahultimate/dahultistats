// Saisie en direct : sous-étapes du point en cours (choix provisoires du coach) et
// enregistrement des évènements. L'état du point est toujours dérivé de ses évènements.

import { defineStore } from 'pinia'
import { computed, reactive, type Ref, ref } from 'vue'

import { CARRIER_FAULT_CAUSES } from '@/domain/constants'
import { describeEvent, playerLabel } from '@/domain/eventText'
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
  FieldPosition,
  Match,
  MatchEvent,
  Point,
  Side,
  TurnCause,
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

/** Étapes où un toucher sur le terrain est attendu. */
const SPOT_STEPS: LiveStep[] = [
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
  /** Endroit touché sur le terrain, ou « brick » pour un pull sorti. */
  spot: FieldPosition | 'brick' | null
  player: string | null
  players: string[]
}

function emptyDraft(): Draft {
  return {
    pullTeam: null,
    turnMode: false,
    turnCause: null,
    defCause: null,
    spot: null,
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

  const spotExpected = computed(() => SPOT_STEPS.includes(step.value))
  /** Endroit marqué en jaune : choix du coach, ou endroit présélectionné pour la reprise. */
  const selectedSpot = computed<FieldPosition | null>(() => {
    if (draft.spot && draft.spot !== 'brick') return draft.spot
    return step.value === 'pickup' ? (state.value?.pickupPosition ?? null) : null
  })
  const goalPending = computed(() => step.value === 'pass' && isOpponentEndzone(selectedSpot.value))
  /** Circuit de passes de la dernière possession, avec « #7 Léa » à chaque réception. */
  const trail = computed(() =>
    (state.value?.trail ?? []).map((stop) => ({
      label: playerLabel(dataStore.findPlayer(stop.player)),
      position: stop.position,
    })),
  )
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
    spotExpected,
    selectedSpot,
    goalPending,
    opponentPassesThisPoint,
    trail,
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

/** Touches du coach : règle d'ordre libre (endroit et joueur dans n'importe quel ordre). */
function useLiveInput(draft: Draft, live: LiveContext) {
  function tryRecordPull(): void {
    if (draft.spot === null) return
    const landing = draft.spot === 'brick' ? { brick: true } : { position: draft.spot }
    if (draft.pullTeam === 'eux') live.recordEvent({ t: 'pull', equipe: 'eux', ...landing })
    else if (draft.player) {
      live.recordEvent({ t: 'pull', equipe: 'nous', joueur: draft.player, ...landing })
    }
  }

  function tryRecordPass(): void {
    const carrier = live.state.value?.carrier
    if (!draft.player || !draft.spot || draft.spot === 'brick' || !carrier) return
    const position = draft.spot
    live.recordEvent({
      t: 'passe',
      de: carrier,
      a: draft.player,
      position,
      ...(isOpponentEndzone(position) ? { but: true } : {}),
    })
  }

  function selectSpot(spot: FieldPosition | 'brick'): void {
    const step = live.step.value
    const carrier = live.state.value?.carrier ?? null
    if (step === 'pullUs' || step === 'pullThem') {
      draft.spot = spot
      return tryRecordPull()
    }
    if (spot === 'brick') return
    if (step === 'pickup') draft.spot = spot
    if (step === 'pass') {
      draft.spot = spot
      return tryRecordPass()
    }
    const joueurs = [...draft.players]
    if (step === 'turnDetails' && draft.turnCause) {
      live.recordEvent({
        t: 'turn',
        cause: draft.turnCause,
        joueurs,
        position: spot,
        porteur: carrier,
      })
    }
    if (step === 'defenseDetails' && draft.defCause) {
      live.recordEvent({ t: 'def', cause: draft.defCause, joueurs, position: spot })
    }
  }

  function selectPlayer(id: string): void {
    const step = live.step.value
    if (step === 'pullUs') {
      draft.player = draft.player === id ? null : id
      return tryRecordPull()
    }
    if (step === 'pickup') {
      const position =
        draft.spot && draft.spot !== 'brick' ? draft.spot : live.state.value?.pickupPosition
      live.recordEvent({ t: 'reprise', joueur: id, position })
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
    draft.spot = null
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

  function validateDefenseWithoutSpot(): void {
    if (draft.defCause)
      live.recordEvent({ t: 'def', cause: draft.defCause, joueurs: [...draft.players] })
  }

  function recordOpponentPass(): void {
    live.recordEvent({ t: 'passeAdv' })
  }

  /** « Retour » : annule la sous-étape en cours sans toucher aux évènements. */
  function back(): void {
    draft.spot = null
    draft.player = null
    draft.players = []
    if (draft.defCause) draft.defCause = null
    else if (draft.turnCause) draft.turnCause = null
    else if (draft.turnMode) draft.turnMode = false
    else draft.pullTeam = null
  }

  return {
    selectSpot,
    selectPlayer,
    choosePullTeam,
    startTurn,
    chooseTurnCause,
    chooseDefCause,
    validateDefenseWithoutSpot,
    recordOpponentPass,
    back,
  }
}
