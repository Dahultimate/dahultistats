// Meilleurs joueurs d'un match : MVP, meilleur passeur décisif, meilleur apport offensif, meilleur défenseur.
// Seuls les joueurs avec au moins un point joué sont classés ; en cas d'égalité, critère secondaire.

import type { PlayerStats } from './statsTypes'

export interface Leaders {
  mvp: PlayerStats | null
  topAssister: PlayerStats | null
  topOffense: PlayerStats | null
  topDefender: PlayerStats | null
}

type Criterion = (player: PlayerStats) => number

function best(
  players: PlayerStats[],
  primary: Criterion,
  secondary: Criterion,
): PlayerStats | null {
  let leader: PlayerStats | null = null
  for (const player of players) {
    if (
      leader === null ||
      primary(player) > primary(leader) ||
      (primary(player) === primary(leader) && secondary(player) > secondary(leader))
    ) {
      leader = player
    }
  }
  return leader
}

export function findLeaders(allPlayers: readonly PlayerStats[]): Leaders {
  const ranked = allPlayers.filter((player) => player.pointsPlayed > 0)
  const anyAssist = ranked.some((player) => player.assists > 0)
  const anyRecovery = ranked.some((player) => player.recoveries > 0)
  return {
    mvp: best(
      ranked,
      (p) => p.mvpIndex,
      (p) => p.goals + p.assists - p.turns,
    ),
    topAssister: anyAssist
      ? best(
          ranked,
          (p) => p.assists,
          (p) => p.completedPasses,
        )
      : null,
    topOffense: best(
      ranked,
      (p) => p.offensiveImpact,
      (p) => p.goals + p.assists,
    ),
    topDefender: anyRecovery
      ? best(
          ranked,
          (p) => p.defensiveImpact,
          (p) => p.blocks,
        )
      : null,
  }
}
