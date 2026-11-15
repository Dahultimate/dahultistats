import { describe, expect, it } from 'vitest'

import { describeDateRange, describeFilters, NO_FILTER_TEXT } from '@/domain/export/describeFilters'
import {
  globalReportFileName,
  matchReportFileName,
  periodSlug,
  playerReportFileName,
  slugify,
} from '@/domain/export/fileName'
import { paginate } from '@/domain/export/paginate'
import { emptyFilters } from '@/domain/filters'

import { makeMatch, PLAYERS } from './fixtures'

describe('paginate', () => {
  it('place les blocs les uns sous les autres', () => {
    expect(paginate([{ height: 100 }, { height: 200 }], 1000, 10)).toEqual([
      [
        { block: 0, top: 0, height: 100 },
        { block: 1, top: 110, height: 200 },
      ],
    ])
  })

  it('un bloc trop haut pour la place restante passe à la page suivante, sans être coupé', () => {
    const pages = paginate([{ height: 600 }, { height: 500 }, { height: 300 }], 1000)
    expect(pages).toEqual([
      [{ block: 0, top: 0, height: 600 }],
      [
        { block: 1, top: 0, height: 500 },
        { block: 2, top: 500, height: 300 },
      ],
    ])
  })

  it('un bloc plus haut qu’une page reste entier sur sa propre page', () => {
    const pages = paginate([{ height: 100 }, { height: 1500 }], 1000)
    expect(pages[1]).toEqual([{ block: 1, top: 0, height: 1500 }])
  })

  it('un tableau continue sur la page suivante en répétant son en-tête', () => {
    const table = { height: 30 + 10 * 100, headerHeight: 30, rowHeights: Array(10).fill(100) }
    const pages = paginate([{ height: 500 }, table], 1000)
    expect(pages).toEqual([
      [
        { block: 0, top: 0, height: 500 },
        { block: 1, top: 500, height: 430, rows: [0, 4] },
      ],
      [{ block: 1, top: 0, height: 630, rows: [4, 10] }],
    ])
  })

  it('un tableau sans place pour une ligne commence sur une nouvelle page', () => {
    const table = { height: 130, headerHeight: 30, rowHeights: [100] }
    expect(paginate([{ height: 900 }, table], 1000)[1]).toEqual([
      { block: 1, top: 0, height: 130, rows: [0, 1] },
    ])
  })
})

describe('noms de fichier', () => {
  it('sans accents, sans espaces, en minuscules', () => {
    expect(slugify("Disc'Oiseaux (ex.) – Équipe")).toBe('disc-oiseaux-ex-equipe')
  })

  it('période « tout » sans filtre de dates', () => {
    expect(periodSlug(emptyFilters())).toBe('tout')
    expect(periodSlug({ from: '2026-10-04', to: '2026-10-05' })).toBe('du-2026-10-04-au-2026-10-05')
    expect(periodSlug({ from: '2026-10-04', to: '' })).toBe('depuis-2026-10-04')
    expect(periodSlug({ from: '', to: '2026-10-05' })).toBe('jusqu-au-2026-10-05')
  })

  it('rapport de match, fiche joueur, statistiques globales', () => {
    const match = makeMatch([], { equipeNom: 'Équipe exemple', adversaire: 'Les Frelons (ex.)' })
    expect(matchReportFileName(match, 'collectif')).toBe(
      'stats-ultimate_equipe-exemple-vs-les-frelons-ex_2026-10-04_collectif',
    )
    expect(playerReportFileName(PLAYERS[0]!, emptyFilters())).toBe(
      'stats-ultimate_7-lea-martin_tout',
    )
    expect(globalReportFileName({ ...emptyFilters(), from: '2026-10-01' })).toBe(
      'stats-ultimate_global_depuis-2026-10-01',
    )
  })
})

describe('filtres en clair', () => {
  const context = { teams: [{ id: 'e_open', nom: 'Open', joueurs: [] }], matches: [makeMatch([])] }

  it('aucun filtre', () => {
    expect(describeFilters(emptyFilters(), context)).toBe(NO_FILTER_TEXT)
  })

  it('évènement et dates', () => {
    const filters = {
      ...emptyFilters(),
      event: 'Championnat régional',
      from: '2026-10-04',
      to: '2026-10-05',
    }
    expect(describeFilters(filters, context)).toBe('Championnat régional, du 4 au 5 oct. 2026')
  })

  it('match, équipe et type', () => {
    const filters = {
      ...emptyFilters(),
      matchId: 'm_test',
      teamId: 'e_open',
      type: 'competition' as const,
    }
    expect(describeFilters(filters, context)).toBe(
      'Open – Les Frelons (4 oct. 2026), équipe Open, compétition',
    )
  })

  it('plages de dates', () => {
    expect(describeDateRange('2026-09-28', '2026-10-05')).toBe('du 28 sept. au 5 oct. 2026')
    expect(describeDateRange('2025-12-28', '2026-01-05')).toBe('du 28 déc. 2025 au 5 janv. 2026')
    expect(describeDateRange('2026-10-04', '2026-10-04')).toBe('le 4 oct. 2026')
    expect(describeDateRange('2026-10-04', '')).toBe('depuis le 4 oct. 2026')
    expect(describeDateRange('', '2026-10-05')).toBe('jusqu’au 5 oct. 2026')
  })
})
