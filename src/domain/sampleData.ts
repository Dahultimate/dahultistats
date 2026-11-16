// Données d'exemple : un club fictif dont les matchs sont simulés avec les mêmes fonctions
// que la saisie réelle (appendEvent / derivePointState). Générateur déterministe (mulberry32).

import { LINE_SIZE } from './constants'
import { generateId } from './importExport'
import { appendEvent, derivePointState, type PointState } from './pointState'
import { matchScore } from './score'
import type {
  AppData,
  ConcededCause,
  FieldPosition,
  FieldType,
  Lane,
  Match,
  MatchEvent,
  MatchType,
  Player,
  Point,
  Position,
  Rank,
  RecoveryCause,
  Side,
  Team,
  TurnCause,
} from './types'
import { LANES, rankOf, RANKS, zoneAt, zoneBounds, zoneCenter, zoneId } from './zones'

export const SAMPLE_SEED = 20261114

const SIM = {
  goalsToWinOutdoor: 13,
  goalsToWinIndoor: 9,
  maxPoints: 30,
  maxActionsPerPoint: 150,
  brickChance: 0.1,
  turnChance: 0.1,
  goalChanceFromM3: 0.45,
  designatedRecoveryChance: 0.4,
  designatedConcededChance: 0.8,
  startHour: 14,
} as const

/** Défense, à chaque action : récupération, Callahan, break sans but, but adverse, sinon passe adverse. */
const DEFENSE_OUTCOMES: [
  'recovery' | 'callahan' | 'breakWithoutGoal' | 'conceded' | 'opponentPass',
  number,
][] = [
  ['recovery', 0.2],
  ['callahan', 0.012],
  ['breakWithoutGoal', 0.058],
  ['conceded', 0.18],
  ['opponentPass', 0.55],
]

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Random {
  constructor(readonly next: () => number) {}

  chance(probability: number): boolean {
    return this.next() < probability
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)] as T
  }

  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
    let roll = this.next() * total
    for (const [value, weight] of entries) {
      roll -= weight
      if (roll < 0) return value
    }
    return entries[entries.length - 1]![0]
  }

  sample<T>(items: readonly T[], count: number): T[] {
    const pool = [...items]
    const result: T[] = []
    while (result.length < count && pool.length > 0) {
      result.push(pool.splice(Math.floor(this.next() * pool.length), 1)[0] as T)
    }
    return result
  }

  /** Endroit tiré au hasard dans une zone d'un des rangs donnés. */
  position(ranks: readonly Rank[]): FieldPosition {
    const { x0, x1, y0, y1 } = zoneBounds(zoneId(this.pick(ranks), this.pick<Lane>(LANES)))
    return { x: x0 + this.next() * (x1 - x0), y: y0 + this.next() * (y1 - y0) }
  }
}

const SAMPLE_PLAYERS: [string, string, number, Position][] = [
  ['Léa', 'Martin', 7, 'Handler'],
  ['Hugo', 'Bernard', 3, 'Handler'],
  ['Camille', 'Petit', 11, 'Handler'],
  ['Nathan', 'Roux', 21, 'Handler'],
  ['Inès', 'Faure', 5, 'Handler'],
  ['Lucas', 'Girard', 9, 'Middle'],
  ['Chloé', 'Morel', 14, 'Middle'],
  ['Tom', 'Fournier', 23, 'Middle'],
  ['Manon', 'Lambert', 17, 'Middle'],
  ['Jules', 'Bonnet', 8, 'Middle'],
  ['Sarah', 'Mercier', 12, 'Middle'],
  ['Maxime', 'Blanc', 31, 'Middle'],
  ['Zoé', 'Garnier', 4, 'Middle'],
  ['Théo', 'Chevalier', 19, 'Middle'],
]

const INDOOR_FIRST_NAMES = ['Léa', 'Hugo', 'Camille', 'Lucas', 'Chloé', 'Tom', 'Jules', 'Zoé']

interface SampleMatchSpec {
  date: string
  terrain: FieldType
  indoorTeam: boolean
  adversaire: string
  evenement: string
  type: MatchType
}

const SAMPLE_MATCHES: SampleMatchSpec[] = [
  {
    date: '2026-10-04',
    terrain: 'outdoor',
    indoorTeam: false,
    adversaire: 'Les Frelons (ex.)',
    evenement: 'Championnat régional',
    type: 'competition',
  },
  {
    date: '2026-10-05',
    terrain: 'outdoor',
    indoorTeam: false,
    adversaire: "Disc'Oiseaux (ex.)",
    evenement: 'Championnat régional',
    type: 'competition',
  },
  {
    date: '2026-11-06',
    terrain: 'indoor',
    indoorTeam: true,
    adversaire: 'Équipe B du club (ex.)',
    evenement: 'Entraînement du jeudi',
    type: 'entrainement',
  },
]

const TURN_WEIGHTS: [TurnCause, number][] = [
  ['mauvaise_passe', 5],
  ['drop', 3],
  ['duel_perdu', 2],
  ['stall_out', 1],
]
const RECOVERY_WEIGHTS: [RecoveryCause, number][] = [
  ['contre', 4],
  ['mauvaise_passe_adv', 4],
  ['drop_adv', 2],
  ['stall_adv', 0.5],
  ['autre_recup', 0.5],
]
const CONCEDED_WEIGHTS: [ConcededCause, number][] = [
  ['marquage', 3],
  ['break', 3],
  ['communication', 2],
  ['positionnement', 2],
  ['autre_but', 1],
]
const RANK_STEP_WEIGHTS: [number, number][] = [
  [-1, 1],
  [0, 2],
  [1, 3],
]
/** La spécification ne fixe pas l'endroit d'une récupération simulée : on le tire entre D et M3. */
const RECOVERY_RANKS: Rank[] = ['D', 'M1', 'M2', 'M3']

/** Simulation d'un point : état courant, horloge et enregistrement via appendEvent. */
class PointSimulation {
  point: Point
  actions = 0

  constructor(
    readonly random: Random,
    public clock: number,
    line: string[],
    attackRight: boolean,
  ) {
    this.point = { ligne: line, attaqueDroite: attackRight, evenements: [], resultat: null }
  }

  record(event: MatchEvent, minSeconds: number, maxSeconds: number): void {
    this.clock += this.random.int(minSeconds, maxSeconds) * 1000
    this.point = appendEvent(this.point, { ...event, ts: this.clock })
    this.actions++
  }

  get line(): string[] {
    return this.point.ligne
  }

  teammateOf(id: string | null): string {
    return this.random.pick(this.line.filter((other) => other !== id))
  }
}

function simulatePull(sim: PointSimulation, puller: Side): void {
  const { random } = sim
  const brick = random.chance(SIM.brickChance)
  if (puller === 'nous') {
    const landing = brick ? { brick: true } : { position: random.position(['M3', 'A']) }
    sim.record({ t: 'pull', equipe: 'nous', joueur: sim.line[0], ...landing }, 60, 100)
  } else {
    const landing = brick ? { brick: true } : { position: random.position(['M1', 'D']) }
    sim.record({ t: 'pull', equipe: 'eux', ...landing }, 60, 100)
  }
}

function simulatePickup(sim: PointSimulation, state: PointState): void {
  const last = sim.point.evenements.at(-1)
  const designated = last?.t === 'def' ? last.joueurs[0] : undefined
  const joueur = designated ?? sim.random.pick(sim.line)
  sim.record({ t: 'reprise', joueur, position: state.pickupPosition }, 3, 6)
}

function simulateTurn(sim: PointSimulation, carrier: string, position: FieldPosition): void {
  const { random } = sim
  const deep = ['D', 'M1'].includes(rankOf(zoneAt(position)))
  const cause = random.weighted<TurnCause>(
    deep ? [...TURN_WEIGHTS, ['callahan', 0.4]] : TURN_WEIGHTS,
  )
  const receiver = sim.teammateOf(carrier)
  const fautif = cause === 'drop' || cause === 'duel_perdu' ? receiver : carrier
  sim.record({ t: 'turn', cause, joueurs: [fautif], position, porteur: carrier }, 3, 6)
}

function simulateAttack(sim: PointSimulation, state: PointState): void {
  const { random } = sim
  const carrier = state.carrier ?? sim.random.pick(sim.line)
  const position = state.carrierPosition ?? zoneCenter('M2-C')
  const rank = rankOf(zoneAt(position))
  if (random.chance(SIM.turnChance)) return simulateTurn(sim, carrier, position)
  const receiver = sim.teammateOf(carrier)
  if (rank === 'M3' && random.chance(SIM.goalChanceFromM3)) {
    sim.record(
      { t: 'passe', de: carrier, a: receiver, position: random.position(['A']), but: true },
      3,
      8,
    )
    return
  }
  const rankIndex = RANKS.indexOf(rank) + random.weighted(RANK_STEP_WEIGHTS)
  const nextRank = RANKS[Math.min(3, Math.max(1, rankIndex))] as Rank
  sim.record({ t: 'passe', de: carrier, a: receiver, position: random.position([nextRank]) }, 3, 8)
}

function simulateDefense(sim: PointSimulation): void {
  const { random } = sim
  const someone = (probability: number) =>
    random.chance(probability) ? [random.pick(sim.line)] : []
  switch (random.weighted(DEFENSE_OUTCOMES)) {
    case 'recovery': {
      const cause = random.weighted(RECOVERY_WEIGHTS)
      const joueurs =
        cause === 'contre' ? [random.pick(sim.line)] : someone(SIM.designatedRecoveryChance)
      return sim.record(
        { t: 'def', cause, joueurs, position: random.position(RECOVERY_RANKS) },
        3,
        6,
      )
    }
    case 'callahan': {
      const joueurs = [random.pick(sim.line)]
      return sim.record(
        { t: 'def', cause: 'callahan', joueurs, position: random.position(['A']) },
        3,
        6,
      )
    }
    case 'breakWithoutGoal': {
      const joueurs = someone(SIM.designatedConcededChance)
      return sim.record({ t: 'def', cause: 'break_sans_but', joueurs }, 3, 6)
    }
    case 'conceded': {
      const cause = random.weighted(CONCEDED_WEIGHTS)
      const joueurs = someone(SIM.designatedConcededChance)
      return sim.record({ t: 'def', cause, joueurs, position: random.position(['D', 'M1']) }, 3, 6)
    }
    case 'opponentPass':
      return sim.record({ t: 'passeAdv' }, 3, 7)
  }
}

function simulatePoint(sim: PointSimulation, puller: Side): Point {
  simulatePull(sim, puller)
  while (sim.point.resultat === null) {
    if (sim.actions >= SIM.maxActionsPerPoint) {
      sim.record({ t: 'def', cause: 'autre_but', joueurs: [], position: zoneCenter('D-C') }, 3, 6)
      break
    }
    const state = derivePointState(sim.point.evenements)
    if (state.phase === 'reprise') simulatePickup(sim, state)
    else if (state.phase === 'attaque') simulateAttack(sim, state)
    else simulateDefense(sim)
  }
  return sim.point
}

function simulateMatch(match: Match, roster: string[], random: Random): Match {
  const target = match.terrain === 'indoor' ? SIM.goalsToWinIndoor : SIM.goalsToWinOutdoor
  let clock = match.cree
  let puller: Side = random.chance(0.5) ? 'nous' : 'eux'
  let attackRight = true
  const points: Point[] = []
  while (points.length < SIM.maxPoints) {
    const score = matchScore({ points })
    if (score.us >= target || score.them >= target) break
    const line = random.sample(roster, LINE_SIZE[match.terrain])
    const sim = new PointSimulation(random, clock, line, attackRight)
    const point = simulatePoint(sim, puller)
    points.push(point)
    clock = sim.clock
    puller = point.resultat ?? puller
    attackRight = !attackRight
  }
  return { ...match, points, termine: true }
}

function samplePlayers(random: Random): Player[] {
  return SAMPLE_PLAYERS.map(([prenom, nom, numero, poste]) => ({
    id: generateId('j', random.next),
    prenom,
    nom,
    numero,
    poste,
    actif: true,
  }))
}

function sampleTeams(players: Player[], random: Random): [Team, Team] {
  const indoorIds = players.filter((p) => INDOOR_FIRST_NAMES.includes(p.prenom)).map((p) => p.id)
  return [
    { id: generateId('e', random.next), nom: 'Équipe exemple', joueurs: players.map((p) => p.id) },
    { id: generateId('e', random.next), nom: 'Exemple indoor', joueurs: indoorIds },
  ]
}

function matchStart(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1, SIM.startHour).getTime()
}

export function createSampleData(seed: number = SAMPLE_SEED): AppData {
  const random = new Random(mulberry32(seed))
  const players = samplePlayers(random)
  const teams = sampleTeams(players, random)
  const matches = SAMPLE_MATCHES.map((spec) => {
    const team = spec.indoorTeam ? teams[1] : teams[0]
    const skeleton: Match = {
      id: generateId('m', random.next),
      cree: matchStart(spec.date),
      date: spec.date,
      terrain: spec.terrain,
      equipeId: team.id,
      equipeNom: team.nom,
      adversaire: spec.adversaire,
      evenement: spec.evenement,
      type: spec.type,
      termine: false,
      points: [],
    }
    return simulateMatch(skeleton, team.joueurs, random)
  })
  return {
    format: 'ultimate-stats',
    version: 1,
    exemple: true,
    joueurs: players,
    equipes: teams,
    matchs: matches,
  }
}
