import { describe, expect, it } from 'vitest'

import {
  createEmptyData,
  exportFileName,
  generateId,
  parseAppData,
  serializeAppData,
} from '@/domain/importExport'
import { createSampleData } from '@/domain/sampleData'
import { zoneCenter } from '@/domain/zones'

/** Exemple de la section 3 de la spécification (fichier de la version actuelle). */
const CURRENT_VERSION_FILE = `{
  "format": "ultimate-stats",
  "version": 1,
  "exporteLe": "2026-11-14T20:00:00.000Z",
  "exemple": false,
  "joueurs": [
    { "id": "j_k3x9a1m2b", "prenom": "Léa", "nom": "Martin", "numero": 7, "poste": "Handler", "actif": true }
  ],
  "equipes": [
    { "id": "e_p2q8z0c4d", "nom": "Open", "joueurs": ["j_k3x9a1m2b"] }
  ],
  "matchs": [
    {
      "id": "m_r7t5y1u3e", "cree": 1794687186000, "date": "2026-11-14",
      "terrain": "outdoor", "equipeId": "e_p2q8z0c4d", "equipeNom": "Open",
      "adversaire": "Les Frelons", "evenement": "Championnat régional", "type": "competition",
      "termine": false,
      "points": [
        {
          "ligne": ["j_k3x9a1m2b"], "attaqueDroite": true, "resultat": "nous",
          "evenements": [
            { "t": "pull", "equipe": "eux", "zone": "D-C", "ts": 1794687200000 },
            { "t": "reprise", "joueur": "j_k3x9a1m2b", "zone": "D-C", "ts": 1794687206000 },
            { "t": "passe", "de": "j_k3x9a1m2b", "a": "j_xxx", "zone": "A-R", "but": true, "ts": 1794687215000 }
          ]
        }
      ]
    }
  ]
}`

describe('import', () => {
  it('charge sans perte un fichier de l’ancienne version : chaque zone devient une position', () => {
    const result = parseAppData(CURRENT_VERSION_FILE)
    if (!result.ok) throw new Error('import refusé')
    expect(result.data).toMatchObject(JSON.parse(CURRENT_VERSION_FILE))
    const events = result.data.matchs[0]!.points[0]!.evenements
    expect(events.map((event) => (event.t === 'passeAdv' ? null : event.position))).toEqual([
      zoneCenter('D-C'),
      zoneCenter('D-C'),
      zoneCenter('A-R'),
    ])
  })

  it('positions : gardées si valides, ignorées sinon ; ancienne zone « brick »', () => {
    const file = {
      joueurs: [],
      equipes: [],
      matchs: [
        {
          id: 'm_1',
          points: [
            {
              ligne: [],
              evenements: [
                { t: 'pull', equipe: 'eux', zone: 'brick' },
                { t: 'reprise', joueur: 'j', position: { x: 0.2, y: 0.7 } },
                { t: 'passe', de: 'j', a: 'k', position: { x: 2, y: 'a' } },
              ],
            },
          ],
        },
      ],
    }
    const result = parseAppData(JSON.stringify(file))
    if (!result.ok) throw new Error('import refusé')
    expect(result.data.matchs[0]!.points[0]!.evenements).toEqual([
      { t: 'pull', equipe: 'eux', zone: 'brick', brick: true },
      { t: 'reprise', joueur: 'j', position: { x: 0.2, y: 0.7 } },
      { t: 'passe', de: 'j', a: 'k' },
    ])
  })

  it('JSON invalide', () => {
    expect(parseAppData('{ pas du json')).toEqual({ ok: false, error: 'invalid_json' })
  })

  it('listes absentes', () => {
    expect(parseAppData('{"joueurs": []}')).toEqual({ ok: false, error: 'invalid_format' })
    expect(parseAppData('[]')).toEqual({ ok: false, error: 'invalid_format' })
  })

  it('valeurs par défaut et entrées ignorées', () => {
    const result = parseAppData(
      JSON.stringify({
        joueurs: [
          { id: 'j_1', prenom: 'A', nom: 'B', numero: '4', poste: 'Cutter' },
          { prenom: 'Sans id' },
        ],
        equipes: [{ nom: 'Sans id' }],
        matchs: [
          {
            id: 'm_1',
            terrain: 'gazon',
            type: 'amical',
            points: [
              {
                ligne: ['j_1'],
                resultat: 'gagné',
                evenements: [{ zone: 'D-C' }, { t: 'passeAdv' }, { t: 'def', cause: 'contre' }],
              },
            ],
          },
        ],
        champInconnu: 42,
      }),
    )
    if (!result.ok) throw new Error('import refusé')
    const { joueurs, equipes, matchs } = result.data
    expect(joueurs).toEqual([
      { id: 'j_1', prenom: 'A', nom: 'B', numero: 4, poste: 'Middle', actif: true },
    ])
    expect(equipes).toEqual([])
    expect(matchs[0]).toMatchObject({ terrain: 'outdoor', type: 'competition', termine: false })
    const point = matchs[0]!.points[0]!
    expect(point).toMatchObject({ resultat: null, attaqueDroite: true })
    expect(point.evenements).toEqual([
      { t: 'passeAdv' },
      { t: 'def', cause: 'contre', joueurs: [] },
    ])
    expect((result.data as unknown as Record<string, unknown>).champInconnu).toBe(42)
  })
})

describe('export', () => {
  it('un fichier exporté puis réimporté redonne les mêmes données', () => {
    const data = createSampleData()
    const now = new Date('2026-11-15T10:00:00Z')
    const text = serializeAppData(data, now)
    const result = parseAppData(text)
    expect(result.ok && result.data).toEqual({ ...data, exporteLe: now.toISOString() })
  })

  it('JSON indenté de 2 espaces, champ exporteLe en tête', () => {
    const text = serializeAppData(
      { ...createEmptyData(), exporteLe: 'ancien' },
      new Date('2026-11-15T10:00:00Z'),
    )
    expect(text.split('\n')[1]).toBe('  "format": "ultimate-stats",')
    expect(text).toContain('"exporteLe": "2026-11-15T10:00:00.000Z"')
    expect(Object.keys(JSON.parse(text))).toEqual([
      'format',
      'version',
      'exporteLe',
      'exemple',
      'joueurs',
      'equipes',
      'matchs',
    ])
  })

  it('nom du fichier daté', () => {
    expect(exportFileName(new Date(2026, 10, 14, 20))).toBe('stats-ultimate-2026-11-14.json')
  })

  it('identifiants : préfixe, « _ » et base 36', () => {
    expect(generateId('j')).toMatch(/^j_[0-9a-z]{9}$/)
    expect(generateId('m', () => 0.5)).toBe('m_iiiiiiiii')
  })
})
