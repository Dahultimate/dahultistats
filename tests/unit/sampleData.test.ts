import { describe, expect, it } from 'vitest'

import { createSampleData, mulberry32 } from '@/domain/sampleData'
import { matchScore } from '@/domain/score'
import { computeStats } from '@/domain/stats/computeStats'
import { summarizePossessions } from '@/domain/stats/possessions'
import { sumCounts } from '@/domain/stats/statsTypes'

const data = createSampleData()

describe('données d’exemple', () => {
  it('contenu : 14 joueurs, 2 équipes, 3 matchs terminés', () => {
    expect(data.exemple).toBe(true)
    expect(data.joueurs).toHaveLength(14)
    expect(data.equipes.map((team) => [team.nom, team.joueurs.length])).toEqual([
      ['Équipe exemple', 14],
      ['Exemple indoor', 8],
    ])
    expect(data.matchs.map((match) => [match.date, match.terrain, match.equipeNom])).toEqual([
      ['2026-10-04', 'outdoor', 'Équipe exemple'],
      ['2026-10-05', 'outdoor', 'Équipe exemple'],
      ['2026-11-06', 'indoor', 'Exemple indoor'],
    ])
    expect(data.matchs.every((match) => match.termine)).toBe(true)
  })

  it('est identique à chaque chargement', () => {
    expect(createSampleData()).toEqual(data)
  })

  it('mulberry32 est déterministe', () => {
    const first = mulberry32(1)
    const second = mulberry32(1)
    expect([first(), first()]).toEqual([second(), second()])
  })

  it('un match s’arrête à 13 points (9 en indoor) ou après 30 points', () => {
    for (const match of data.matchs) {
      const { us, them } = matchScore(match)
      const target = match.terrain === 'indoor' ? 9 : 13
      expect(Math.max(us, them) === target || match.points.length === 30).toBe(true)
      expect(
        match.points.every((point) => point.ligne.length === (match.terrain === 'indoor' ? 5 : 7)),
      ).toBe(true)
    }
  })

  describe.each(data.matchs.map((match) => [match.adversaire, match] as const))(
    'invariants : %s',
    (_, match) => {
      const { team, players } = computeStats([match])
      const playerList = Object.values(players)
      const sum = (pick: (player: (typeof playerList)[number]) => number) =>
        playerList.reduce((total, player) => total + pick(player), 0)
      const score = matchScore(match)

      it('buts de l’équipe = score marqué ; buts encaissés = score encaissé', () => {
        expect(team.goalSpots.length + team.goalsWithoutSpot).toBe(score.us)
        expect(sumCounts(team.concededByCause)).toBe(score.them)
      })

      it('somme des buts des joueurs = buts de l’équipe', () => {
        expect(sum((player) => player.goals)).toBe(score.us)
      })

      it('passes décisives = buts − Callahans', () => {
        expect(sum((player) => player.assists)).toBe(score.us - team.callahans)
      })

      it('possessions finies par un but = score', () => {
        const possessions = summarizePossessions([match])
        expect(possessions.us.goals).toBe(score.us)
        expect(possessions.them.goals).toBe(score.them)
      })

      it('somme des zones de lancer d’un joueur = ses passes tentées', () => {
        for (const player of playerList) {
          expect(player.spots.throws.length).toBe(player.attemptedPasses)
        }
      })

      it('points O + points D = points joués', () => {
        expect(team.offensePoints + team.defensePoints).toBe(team.pointsPlayed)
        for (const player of playerList) {
          expect(player.offensePoints + player.defensePoints).toBe(player.pointsPlayed)
        }
      })
    },
  )
})
