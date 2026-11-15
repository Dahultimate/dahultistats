// Mise en forme française des dates et des nombres (fr-FR : « sam. 14 nov. 2026 », « 1,5 », « 86 % »).

const LOCALE = 'fr-FR'

const longDate = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })
const time = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })

/** Lit une date AAAA-MM-JJ en heure locale (évite le décalage d'un jour lié au fuseau UTC). */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** « sam. 14 nov. 2026 » */
export function formatLongDate(iso: string): string {
  return longDate.format(parseIsoDate(iso))
}

/** « 14 nov. 2026 » */
export function formatShortDate(iso: string): string {
  return shortDate.format(parseIsoDate(iso))
}

/** « 14 nov. » */
export function formatDayMonth(iso: string): string {
  return dayMonth.format(parseIsoDate(iso))
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${shortDate.format(date)} à ${time.format(date)}`
}

/** « 86 % » ; « — » si le dénominateur est nul. */
export function formatPercent(numerator: number, denominator: number): string {
  return denominator > 0 ? percent.format(numerator / denominator) : '—'
}

export function formatFraction(fraction: number | null): string {
  return fraction === null ? '—' : percent.format(fraction)
}

/** « 1,5 » */
export function formatNumber(value: number): string {
  return decimal.format(value)
}

/** « +2 », « 0 », « −2 » (vrai signe moins). */
export function formatSigned(value: number): string {
  if (value > 0) return `+${formatNumber(value)}`
  if (value < 0) return `−${formatNumber(-value)}`
  return '0'
}
