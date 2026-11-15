// Copie de secours dans le localStorage. Elle n'est jamais chargée automatiquement :
// l'écran d'ouverture la propose. Tout accès au stockage est protégé (navigation privée, quota…).

import type { AppData } from '@/domain/types'

const BACKUP_KEY = 'stats-ultimate:secours'

export interface Backup {
  savedAt: number
  data: unknown
}

/** Renvoie false si le stockage est indisponible ou plein. */
export function saveBackup(data: AppData, now = Date.now()): boolean {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt: now, data }))
    return true
  } catch {
    return false
  }
}

export function loadBackup(): Backup | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Backup>
    return typeof parsed.savedAt === 'number'
      ? { savedAt: parsed.savedAt, data: parsed.data }
      : null
  } catch {
    return null
  }
}
