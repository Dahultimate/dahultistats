// Parcours complet sur téléphone (390 × 844) : fichier vide → effectif → équipe → match en direct
// → rapports → exports PDF / PNG → export JSON puis réimport.

import { readFile } from 'node:fs/promises'

import { type Download, expect, type Page, test } from '@playwright/test'

import type { ZoneId } from '../../src/domain/types'
import { zoneCenter } from '../../src/domain/zones'

const PLAYERS: [string, string, string, 'Handler' | 'Middle'][] = [
  ['Léa', 'Martin', '7', 'Handler'],
  ['Hugo', 'Bernard', '3', 'Handler'],
  ['Inès', 'Faure', '5', 'Handler'],
  ['Lucas', 'Girard', '9', 'Middle'],
  ['Chloé', 'Morel', '14', 'Middle'],
  ['Sarah', 'Mercier', '12', 'Middle'],
  ['Tom', 'Fournier', '23', 'Middle'],
]

function today(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const field = (page: Page) => page.getByRole('button', { name: /^Terrain/ })

/** Touche le terrain au centre d'une zone ; vers la gauche, l'écran est le terrain tourné de 180°. */
async function tapZone(page: Page, zone: ZoneId, attackRight: boolean): Promise<void> {
  const box = await field(page).boundingBox()
  if (!box) throw new Error('Terrain introuvable')
  const { x, y } = zoneCenter(zone)
  const left = attackRight ? x : 1 - x
  const top = attackRight ? y : 1 - y
  await field(page).click({ position: { x: left * box.width, y: top * box.height } })
}

const linePlayer = (page: Page, number: string) =>
  page
    .getByRole('group', { name: 'Joueurs de la ligne' })
    .getByRole('button', { name: new RegExp(`^${number} `) })
const button = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first()
const scoreboard = (page: Page) => page.getByRole('group', { name: /^Open \d+, Les Frelons \d+$/ })
const confirmDialog = (page: Page, label: string) =>
  page.getByRole('dialog').getByRole('button', { name: label }).click()

async function downloaded(download: Download): Promise<Buffer> {
  const path = await download.path()
  return readFile(path)
}

async function addPlayers(page: Page): Promise<void> {
  await page.getByRole('link', { name: /Effectif/ }).click()
  for (const [firstName, lastName, number, position] of PLAYERS) {
    await page.getByLabel('Prénom').fill(firstName)
    await page.getByLabel('Nom', { exact: true }).fill(lastName)
    await page.getByLabel('Numéro').fill(number)
    await button(page, new RegExp(`${position}$`)).click()
    await button(page, 'Ajouter').click()
    await expect(page.getByLabel('Prénom')).toBeFocused()
  }
  await expect(page.getByText('Handlers · 3')).toBeVisible()
  await expect(page.getByText('Middles · 4')).toBeVisible()
}

async function createTeamAndMatch(page: Page): Promise<void> {
  await page.goto('/#/equipes')
  await page.getByRole('link', { name: 'Créer une équipe' }).click()
  await page.getByLabel('Nom de l’équipe').fill('Open')
  await button(page, 'Tous').click()
  await button(page, 'Créer l’équipe').click()
  await expect(page.getByText('7 joueurs')).toBeVisible()

  await page.goto('/#/match/nouveau')
  await page.getByLabel('Équipe adverse').fill('Les Frelons')
  await page.getByLabel('Nom de l’évènement').fill('Championnat régional')
  await button(page, 'Commencer le match').click()
  await expect(page.getByRole('heading', { name: 'Point 1' })).toBeVisible()
}

async function startLine(page: Page, numbers: string[] | 'same'): Promise<void> {
  if (numbers === 'same') await button(page, /^Même ligne/).click()
  else
    for (const number of numbers)
      await page.getByRole('button', { name: new RegExp(`^${number} `) }).click()
  await button(page, 'Démarrer le point').click()
}

async function playOffensePoint(page: Page): Promise<void> {
  await startLine(
    page,
    PLAYERS.map((player) => player[2]),
  )
  await button(page, /ils lancent/).click()
  await tapZone(page, 'D-C', true)
  await linePlayer(page, '7').click()
  await expect(page.getByText('Attaque · disque : #7 Léa')).toBeVisible()
  // Passe simple en deux touches : endroit puis receveur.
  await tapZone(page, 'M2-R', true)
  await linePlayer(page, '9').click()
  // Le circuit de passes s'affiche sur le terrain : chaque receveur, relié par une flèche.
  await expect(field(page).getByText('#7 Léa')).toBeVisible()
  await expect(field(page).getByText('#9 Lucas')).toBeVisible()
  await tapZone(page, 'A-C', true)
  await expect(page.getByText('BUT pour Open ! Qui a attrapé le disque ?')).toBeVisible()
  await linePlayer(page, '12').click()
  await expect(page.getByRole('heading', { name: 'Point 2' })).toBeVisible()
  await expect(scoreboard(page)).toHaveAccessibleName('Open 1, Les Frelons 0')
}

async function playDefensePoint(page: Page): Promise<void> {
  await startLine(page, 'same')
  await button(page, /nous lançons/).click()
  await linePlayer(page, '3').click()
  await tapZone(page, 'M3-C', false)
  await button(page, 'Contre / interception').click()
  await linePlayer(page, '5').click()
  await tapZone(page, 'M2-C', false)
  await linePlayer(page, '5').click()
  await button(page, 'TURN').click()
  await button(page, 'Drop').click()
  await tapZone(page, 'M3-L', false)
  await button(page, 'Marquage individuel').click()
  await button(page, 'Valider sans joueur fautif').click()
  await expect(page.getByRole('heading', { name: 'Point 3' })).toBeVisible()
  await expect(scoreboard(page)).toHaveAccessibleName('Open 1, Les Frelons 1')
}

async function undoAndReopen(page: Page): Promise<void> {
  await startLine(page, 'same')
  await button(page, /ils lancent/).click()
  await tapZone(page, 'D-L', true)
  await button(page, '↶ Annuler la dernière action').click()
  await expect(page.getByText('Annulé : Pull adverse → Notre en-but gauche')).toBeVisible()
  await button(page, '↶ Annuler la dernière action').click()
  await confirmDialog(page, 'Annuler le point')
  await expect(page.getByRole('heading', { name: 'Point 3' })).toBeVisible()

  await button(page, '↶ Annuler la fin du point 2').click()
  await confirmDialog(page, 'Rouvrir le point')
  await expect(page.getByText('Défense · disque adverse')).toBeVisible()
  await button(page, 'Marquage individuel').click()
  await button(page, 'Valider sans joueur fautif').click()
  await expect(page.getByRole('heading', { name: 'Point 3' })).toBeVisible()
}

test('parcours complet du coach', async ({ page }) => {
  await page.goto('/')
  await button(page, 'Créer un fichier vide').click()
  await addPlayers(page)
  await createTeamAndMatch(page)
  await playOffensePoint(page)
  await playDefensePoint(page)
  await undoAndReopen(page)

  await button(page, 'Terminer le match').click()
  await confirmDialog(page, 'Terminer le match')
  await expect(page.getByText('Terminé', { exact: true })).toBeVisible()

  await page.getByRole('tab', { name: 'Rapport collectif' }).click()
  await expect(page.getByRole('heading', { name: 'L’essentiel' })).toBeVisible()
  await page.getByRole('tab', { name: 'Rapport individuel' }).click()
  await expect(page.getByRole('heading', { name: 'Tableau récapitulatif' })).toBeVisible()
  await page.getByRole('tab', { name: 'Point par point' }).click()
  await expect(page.getByText('Point Open')).toBeVisible()

  // Rapport collectif en PDF.
  await page.getByRole('tab', { name: 'Rapport collectif' }).click()
  await button(page, /PDF \/ Image/).click()
  const pdfDownload = page.waitForEvent('download')
  await page.getByRole('dialog').getByRole('button', { name: 'Créer le fichier' }).click()
  const pdf = await pdfDownload
  expect(pdf.suggestedFilename()).toBe(
    `stats-ultimate_open-vs-les-frelons_${today()}_collectif.pdf`,
  )
  const pdfContent = await downloaded(pdf)
  expect(pdfContent.subarray(0, 5).toString()).toBe('%PDF-')
  expect(
    pdfContent.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0,
  ).toBeGreaterThanOrEqual(1)

  // Fiche joueur en PNG.
  await page.goto('/#/effectif')
  await page.getByRole('link', { name: /Léa Martin/ }).click()
  await button(page, /PDF \/ Image/).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Image PNG/ })
    .click()
  const pngDownload = page.waitForEvent('download')
  await page.getByRole('dialog').getByRole('button', { name: 'Créer le fichier' }).click()
  const png = await pngDownload
  expect(png.suggestedFilename()).toBe('stats-ultimate_7-lea-martin_tout.png')
  const pngContent = await downloaded(png)
  expect(pngContent.length).toBeGreaterThan(1000)
  expect(pngContent.subarray(1, 4).toString()).toBe('PNG')

  // Export des données JSON puis réimport.
  const jsonDownload = page.waitForEvent('download')
  await page
    .locator('header')
    .getByRole('button', { name: /^Exporter/ })
    .click()
  const json = await jsonDownload
  expect(json.suggestedFilename()).toBe(`stats-ultimate-${today()}.json`)
  const jsonPath = await json.path()

  await page.goto('/#/accueil')
  await expect(page.getByText('À jour', { exact: true })).toBeVisible()
  await button(page, 'Ouvrir un autre fichier').click()
  await page.locator('input[type="file"]').setInputFiles(jsonPath)
  await expect(page.getByText('Données chargées : 7 joueurs, 1 match')).toBeVisible()
  await expect(page.getByText('1 match', { exact: true })).toBeVisible()
})
