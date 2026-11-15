// Données chargées (effectif, équipes, matchs) et indicateur « Non exporté ».
// Chaque modification passe par touch() : indicateur mis à jour et copie de secours écrite.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  createEmptyData,
  exportFileName,
  generateId,
  type ImportResult,
  normalizeAppData,
  parseAppData,
  serializeAppData,
} from '@/domain/importExport'
import { createSampleData } from '@/domain/sampleData'
import type { AppData, Match, Player, Team } from '@/domain/types'
import { loadBackup, saveBackup } from '@/services/backupService'
import { copyText } from '@/services/clipboardService'
import { fr } from '@/i18n/fr'
import { downloadText, readFileAsText } from '@/services/fileService'
import { useUiStore } from './uiStore'

export type PlayerInput = Pick<Player, 'prenom' | 'nom' | 'numero' | 'poste'>
export type TeamInput = Pick<Team, 'nom' | 'joueurs'>
export type MatchInput = Pick<
  Match,
  'date' | 'equipeId' | 'adversaire' | 'evenement' | 'terrain' | 'type'
>

export const useDataStore = defineStore('data', () => {
  const data = ref<AppData | null>(null)
  const dirty = ref(false)

  const players = computed(() => data.value?.joueurs ?? [])
  const activePlayers = computed(() => players.value.filter((player) => player.actif))
  const teams = computed(() => data.value?.equipes ?? [])
  const matches = computed(() => data.value?.matchs ?? [])
  const isSample = computed(() => data.value?.exemple === true)
  const playersById = computed(() => new Map(players.value.map((player) => [player.id, player])))

  function findPlayer(id: string): Player | undefined {
    return playersById.value.get(id)
  }

  function findTeam(id: string): Team | undefined {
    return teams.value.find((team) => team.id === id)
  }

  function findMatch(id: string): Match | undefined {
    return matches.value.find((match) => match.id === id)
  }

  function load(newData: AppData, options: { dirty?: boolean } = {}): void {
    data.value = newData
    dirty.value = options.dirty ?? false
  }

  function unload(): void {
    data.value = null
    dirty.value = false
  }

  /** À appeler après chaque modification des données. */
  function touch(): void {
    dirty.value = true
    if (data.value) saveBackup(data.value)
  }

  function serialize(now = new Date()): { fileName: string; text: string } {
    if (!data.value) throw new Error('Aucune donnée chargée')
    return { fileName: exportFileName(now), text: serializeAppData(data.value, now) }
  }

  function markExported(): void {
    dirty.value = false
  }

  /** Télécharge le fichier JSON ; si c'est impossible, affiche son contenu à copier. */
  function exportData(): void {
    const ui = useUiStore()
    const { fileName, text } = serialize()
    if (!downloadText(fileName, text)) {
      ui.jsonFallback = text
      return
    }
    markExported()
    ui.toast(fr.dataFile.exported(fileName))
  }

  async function copyExport(text: string): Promise<boolean> {
    const copied = await copyText(text)
    if (copied) markExported()
    return copied
  }

  function importText(text: string): ImportResult {
    const result = parseAppData(text)
    if (result.ok) load(result.data)
    return result
  }

  async function importFile(
    file: File,
  ): Promise<ImportResult | { ok: false; error: 'read_error' }> {
    try {
      return importText(await readFileAsText(file))
    } catch {
      return { ok: false, error: 'read_error' }
    }
  }

  function loadEmpty(): void {
    load(createEmptyData())
  }

  function loadSample(): void {
    load(createSampleData())
  }

  /** Heure de la copie de secours de ce navigateur, ou null s'il n'y en a pas. */
  function backupSavedAt(): number | null {
    return loadBackup()?.savedAt ?? null
  }

  /** Restaure la copie de secours : les données sont marquées « Non exporté ». */
  function restoreBackup(): boolean {
    const data = normalizeAppData(loadBackup()?.data)
    if (!data) return false
    load(data, { dirty: true })
    return true
  }

  function requireData(): AppData {
    if (!data.value) throw new Error('Aucune donnée chargée')
    return data.value
  }

  function addPlayer(input: PlayerInput): Player {
    const player: Player = { id: generateId('j'), ...input, actif: true }
    requireData().joueurs.push(player)
    touch()
    return player
  }

  function updatePlayer(id: string, input: PlayerInput): void {
    const player = findPlayer(id)
    if (!player) return
    Object.assign(player, input)
    touch()
  }

  /** Un joueur qui a déjà joué devient ancien joueur ; sinon il est supprimé. Il sort des équipes. */
  function removePlayer(id: string): 'retired' | 'deleted' {
    const store = requireData()
    const hasPlayed = store.matchs.some((match) =>
      match.points.some((point) => point.ligne.includes(id)),
    )
    for (const team of store.equipes)
      team.joueurs = team.joueurs.filter((playerId) => playerId !== id)
    if (hasPlayed) {
      const player = findPlayer(id)
      if (player) player.actif = false
    } else {
      store.joueurs = store.joueurs.filter((player) => player.id !== id)
    }
    touch()
    return hasPlayed ? 'retired' : 'deleted'
  }

  function restorePlayer(id: string): void {
    const player = findPlayer(id)
    if (!player) return
    player.actif = true
    touch()
  }

  function saveTeam(id: string | null, input: TeamInput): Team {
    const existing = id ? findTeam(id) : undefined
    if (existing) {
      Object.assign(existing, input)
      touch()
      return existing
    }
    const team: Team = { id: generateId('e'), ...input }
    requireData().equipes.push(team)
    touch()
    return team
  }

  function deleteTeam(id: string): void {
    const store = requireData()
    store.equipes = store.equipes.filter((team) => team.id !== id)
    touch()
  }

  function createMatch(input: MatchInput): Match {
    const match: Match = {
      id: generateId('m'),
      cree: Date.now(),
      ...input,
      equipeNom: findTeam(input.equipeId)?.nom ?? '',
      termine: false,
      points: [],
    }
    requireData().matchs.push(match)
    touch()
    return match
  }

  function deleteMatch(id: string): void {
    const store = requireData()
    store.matchs = store.matchs.filter((match) => match.id !== id)
    touch()
  }

  function setMatchFinished(id: string, finished: boolean): void {
    const match = findMatch(id)
    if (!match) return
    match.termine = finished
    touch()
  }

  return {
    data,
    dirty,
    players,
    activePlayers,
    teams,
    matches,
    isSample,
    findPlayer,
    findTeam,
    findMatch,
    load,
    unload,
    touch,
    serialize,
    markExported,
    exportData,
    copyExport,
    importText,
    importFile,
    loadEmpty,
    loadSample,
    backupSavedAt,
    restoreBackup,
    addPlayer,
    updatePlayer,
    removePlayer,
    restorePlayer,
    saveTeam,
    deleteTeam,
    createMatch,
    deleteMatch,
    setMatchFinished,
  }
})
