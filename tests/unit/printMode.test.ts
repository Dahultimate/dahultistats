import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CollectiveReport from '@/components/reports/CollectiveReport.vue'
import GlobalReport from '@/components/reports/GlobalReport.vue'
import IndividualReport from '@/components/reports/IndividualReport.vue'
import PlayerReport from '@/components/reports/PlayerReport.vue'
import PointByPoint from '@/components/reports/PointByPoint.vue'
import { buildGlobalReport, buildMatchReport, buildPlayerStats } from '@/domain/reports'
import { createSampleData } from '@/domain/sampleData'
import { computeAffinities, partnersOf } from '@/domain/stats/affinities'

const data = createSampleData()
const match = data.matchs[0]!
const report = buildMatchReport(match)
const findPlayer = (id: string) => data.joueurs.find((player) => player.id === id)
const INTERACTIVE = 'button, select, input, textarea, details, summary, a'

function mountReport(name: string, mode: 'screen' | 'print') {
  switch (name) {
    case 'CollectiveReport':
      return mount(CollectiveReport, { props: { match, report, findPlayer, mode } })
    case 'IndividualReport':
      return mount(IndividualReport, {
        props: {
          players: report.tablePlayers,
          affinities: report.affinities,
          findPlayer,
          mode,
        },
      })
    case 'PointByPoint':
      return mount(PointByPoint, { props: { match, findPlayer, mode } })
    case 'PlayerReport':
      return mount(PlayerReport, {
        props: {
          stats: buildPlayerStats(data.matchs, data.joueurs[0]!.id),
          partners: partnersOf(computeAffinities(data.matchs), data.joueurs[0]!.id),
          findPlayer,
          mode,
          heatmapKey: 'throws',
        },
      })
    default:
      return mount(GlobalReport, {
        props: { report: buildGlobalReport(data.matchs), findPlayer, mode, heatmapKey: 'goals' },
        global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      })
  }
}

const REPORTS = [
  'CollectiveReport',
  'IndividualReport',
  'PointByPoint',
  'PlayerReport',
  'GlobalReport',
]

describe('rapports en mode print', () => {
  it.each(REPORTS)('%s ne contient ni bouton ni sélecteur', (name) => {
    const wrapper = mountReport(name, 'print')
    expect(wrapper.findAll(INTERACTIVE)).toHaveLength(0)
    expect(wrapper.findAll('.print-block').length).toBeGreaterThan(0)
  })

  it.each(['IndividualReport', 'PlayerReport', 'GlobalReport'])(
    '%s garde ses éléments interactifs à l’écran',
    (name) => {
      expect(mountReport(name, 'screen').findAll(INTERACTIVE).length).toBeGreaterThan(0)
    },
  )

  it('les affinités entre joueurs figurent dans l’export', () => {
    expect(mountReport('GlobalReport', 'print').text()).toContain('Affinités entre joueurs')
    expect(
      mountReport('PlayerReport', 'print').findAll('.affinity-table tbody tr').length,
    ).toBeGreaterThan(0)
  })

  it('la carte du terrain exportée précise la statistique choisie', () => {
    expect(mountReport('PlayerReport', 'print').text()).toContain(
      'Carte du terrain : passes lancées',
    )
  })
})
