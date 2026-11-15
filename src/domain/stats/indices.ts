// Indices de performance : apport offensif, apport défensif et indice MVP, arrondis au dixième.
// Un Callahan compte comme un but et comme un contre (voir computeStats).

import { INDEX_WEIGHTS } from '../constants'

interface OffensiveCounts {
  goals: number
  assists: number
  completedPasses: number
  receptions: number
  turns: number
}

interface DefensiveCounts {
  blocks: number
  recoveries: number
  defensiveFaults: number
}

export function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function rawOffensiveImpact(counts: OffensiveCounts): number {
  const w = INDEX_WEIGHTS
  return (
    w.goal * counts.goals +
    w.assist * counts.assists +
    w.completedPass * counts.completedPasses +
    w.reception * counts.receptions -
    w.turn * counts.turns
  )
}

function rawDefensiveImpact(counts: DefensiveCounts): number {
  const w = INDEX_WEIGHTS
  return (
    w.block * counts.blocks +
    w.otherRecovery * (counts.recoveries - counts.blocks) -
    w.defensiveFault * counts.defensiveFaults
  )
}

export function offensiveImpact(counts: OffensiveCounts): number {
  return roundToTenth(rawOffensiveImpact(counts))
}

export function defensiveImpact(counts: DefensiveCounts): number {
  return roundToTenth(rawDefensiveImpact(counts))
}

export function mvpIndex(counts: OffensiveCounts & DefensiveCounts): number {
  return roundToTenth(rawOffensiveImpact(counts) + rawDefensiveImpact(counts))
}
