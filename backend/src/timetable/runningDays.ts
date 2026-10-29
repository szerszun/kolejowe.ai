/**
 * Turns the dates a train runs on into a station-timetable note, the way PLK's printed
 * station timetables word it: a weekly pattern ("w dni robocze", "pon.–czw., niedz."),
 * optionally bounded ("od 31 X", "do 12 XII") and corrected by exceptions ("nie kursuje:
 * 24 XII", "kursuje także: 11 XI"), or, when no pattern fits better, the dates
 * themselves ("kursuje: 1, 8 XI").
 *
 * Only the dates inside the window matter -- for the app that's today to the end of the
 * current timetable period, so a note never mentions days that have already gone.
 */
import { isPolishHoliday } from './polishHolidays'

/**
 * How a pattern treats public holidays: like the weekday they fall on, never ("w dni
 * robocze" -- Mon-Fri except holidays), or always ("w niedziele i święta").
 */
export type HolidayRule = 'as-weekday' | 'excluded' | 'added'

export interface WeeklyPattern {
  /** ISO weekdays, 1 = Monday ... 7 = Sunday, ascending. */
  weekdays: number[]
  holidays: HolidayRule
}

export type RunningDays =
  | { kind: 'pattern'; pattern: WeeklyPattern; from?: string; to?: string; except: string[]; also: string[] }
  | { kind: 'dates'; dates: string[] }

/** 1 = Monday ... 7 = Sunday, ISO weekday of a YYYY-MM-DD date. */
function weekday(date: string): number {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay()
  return d === 0 ? 7 : d
}

function matches(pattern: WeeklyPattern, date: string): boolean {
  if (pattern.holidays !== 'as-weekday' && isPolishHoliday(date)) return pattern.holidays === 'added'
  return pattern.weekdays.includes(weekday(date))
}

// The patterns printed timetables name, simplest first: on an equal cost the earlier one
// wins, and any of these beats an arbitrary weekday combination.
const NAMED: WeeklyPattern[] = [
  { weekdays: [1, 2, 3, 4, 5, 6, 7], holidays: 'as-weekday' }, // codziennie
  { weekdays: [1, 2, 3, 4, 5], holidays: 'excluded' }, // w dni robocze ("D")
  { weekdays: [6, 7], holidays: 'added' }, // w soboty, niedziele i święta ("C")
  { weekdays: [1, 2, 3, 4, 5], holidays: 'as-weekday' },
  { weekdays: [6, 7], holidays: 'as-weekday' },
  { weekdays: [7], holidays: 'added' }, // w niedziele i święta
  { weekdays: [1, 2, 3, 4, 5, 6], holidays: 'excluded' },
]

/** Every other weekday combination, with each holiday rule; fewer weekdays first. */
const COMBINATIONS: WeeklyPattern[] = Array.from({ length: 127 }, (_, i) => i + 1)
  .map((mask) => [1, 2, 3, 4, 5, 6, 7].filter((_, bit) => mask & (1 << bit)))
  .sort((a, b) => a.length - b.length)
  .flatMap((weekdays) => (['as-weekday', 'excluded', 'added'] as const).map((holidays) => ({ weekdays, holidays })))
  .filter((p) => !NAMED.some((n) => n.holidays === p.holidays && n.weekdays.join() === p.weekdays.join()))

const PATTERNS = [...NAMED, ...COMBINATIONS]

function daysBetween(from: string, to: string): string[] {
  const out: string[] = []
  const d = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

function isNextDay(a: string, b: string): boolean {
  return daysBetween(a, b).length === 2
}

/** Items as formatDates prints them: consecutive dates in one month are one ("24-26 XII"), a run across a month end is two ("20-30 XI; 1-10 XII"). */
function listCost(dates: string[]): number {
  let items = 0
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || !isNextDay(dates[i - 1], dates[i]) || dates[i].slice(0, 7) !== dates[i - 1].slice(0, 7)) items++
  }
  return items
}

// A station has hundreds of rows sharing one window: each pattern's days are worked out once.
const patternDaysCache = new Map<string, string[][]>()

function patternDaysFor(window: { from: string; to: string }): string[][] {
  const key = `${window.from}|${window.to}`
  let days = patternDaysCache.get(key)
  if (!days) {
    const windowDays = daysBetween(window.from, window.to)
    days = PATTERNS.map((pattern) => windowDays.filter((d) => matches(pattern, d)))
    patternDaysCache.clear() // only ever one window in use at a time
    patternDaysCache.set(key, days)
  }
  return days
}

export function describeRunningDays(dates: Iterable<string>, window: { from: string; to: string }): RunningDays | null {
  const running = new Set([...dates].filter((d) => d >= window.from && d <= window.to))
  if (running.size === 0) return null
  const sorted = [...running].sort((a, b) => a.localeCompare(b))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const allPatternDays = patternDaysFor(window)

  // Where a bound may go: the window's edges, the first and last running day, and either
  // side of a break longer than a week ("codziennie do 19 XI, kursuje także: 11 XII").
  // Shorter breaks are a weekly train's normal rhythm, not a timetable boundary.
  const froms = new Set([window.from, first])
  const tos = new Set([window.to, last])
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]).length > 8) {
      tos.add(sorted[i - 1])
      froms.add(sorted[i])
    }
  }

  let best: { result: RunningDays; cost: number } | undefined
  for (const [index, pattern] of PATTERNS.entries()) {
    const patternDays = allPatternDays[index]
    for (const from of froms) {
      for (const to of tos) {
        if (to < from) continue
        const expected = patternDays.filter((d) => d >= from && d <= to)
        if (expected.length === 0) continue
        const expectedSet = new Set(expected)
        const except = expected.filter((d) => !running.has(d))
        // A pattern has to describe a rhythm: "we wtorki do 3 XI" for one Tuesday doesn't.
        if (expected.length - except.length < 2) continue
        const also = sorted.filter((d) => !expectedSet.has(d))
        // A bound costs a little less than an exception, so a gap at either end reads
        // "od 31 X" rather than "nie kursuje: 29-30 X", as printed timetables put it.
        const cost = listCost(except) + listCost(also) + (from === window.from ? 0 : 0.5) + (to === window.to ? 0 : 0.5)
        if (!best || cost < best.cost) {
          best = {
            cost,
            result: {
              kind: 'pattern',
              pattern,
              ...(from === window.from ? {} : { from }),
              ...(to === window.to ? {} : { to }),
              except,
              also,
            },
          }
        }
      }
    }
    if (best?.cost === 0) break // a named pattern that fits exactly: nothing can beat it
  }

  // Listing the dates beats a pattern that needs as much correcting ("kursuje: 3, 19 XI"
  // over "codziennie od 3 XI do 2 XII, nie kursuje: ..."); a pattern that needs none
  // always wins ("w soboty" over "kursuje: 31 X, 7 XI").
  if (!best || (best.cost > 0 && listCost(sorted) <= best.cost)) return { kind: 'dates', dates: sorted }
  return best.result
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "1, 8 XI; 24-26 XII" (pl) / "1, 8 Nov; 24-26 Dec" (en): days grouped by month, runs collapsed. */
export function formatDates(dates: string[], lang: 'pl' | 'en'): string {
  const months = lang === 'pl' ? ROMAN : EN_MONTHS
  const groups: Array<{ month: string; items: string[] }> = []
  let i = 0
  while (i < dates.length) {
    let j = i
    while (j + 1 < dates.length && isNextDay(dates[j], dates[j + 1]) && dates[j + 1].slice(0, 7) === dates[i].slice(0, 7)) j++
    const dayA = Number(dates[i].slice(8, 10))
    const dayB = Number(dates[j].slice(8, 10))
    const item = j === i ? `${dayA}` : `${dayA}–${dayB}`
    const month = months[Number(dates[i].slice(5, 7)) - 1]
    const group = groups[groups.length - 1]
    if (group && group.month === month) group.items.push(item)
    else groups.push({ month, items: [item] })
    i = j + 1
  }
  return groups.map((g) => `${g.items.join(', ')} ${g.month}`).join('; ')
}

// Wordings printed timetables use for the common patterns, keyed "weekdays|holidays".
const NAMED_TEXT: Record<string, { pl: string; en: string }> = {
  '1,2,3,4,5,6,7|as-weekday': { pl: 'codziennie', en: 'daily' },
  '1,2,3,4,5|excluded': { pl: 'w dni robocze', en: 'Mon–Fri except holidays' },
  '6,7|added': { pl: 'w soboty, niedziele i święta', en: 'Sat, Sun and holidays' },
  '1,2,3,4,5|as-weekday': { pl: 'od poniedziałku do piątku', en: 'Mon–Fri' },
  '6,7|as-weekday': { pl: 'w soboty i niedziele', en: 'Sat and Sun' },
  '7|added': { pl: 'w niedziele i święta', en: 'Sun and holidays' },
  '1,2,3,4,5,6|excluded': { pl: 'od poniedziałku do soboty oprócz świąt', en: 'Mon–Sat except holidays' },
  '1|as-weekday': { pl: 'w poniedziałki', en: 'Mondays' },
  '2|as-weekday': { pl: 'we wtorki', en: 'Tuesdays' },
  '3|as-weekday': { pl: 'w środy', en: 'Wednesdays' },
  '4|as-weekday': { pl: 'w czwartki', en: 'Thursdays' },
  '5|as-weekday': { pl: 'w piątki', en: 'Fridays' },
  '6|as-weekday': { pl: 'w soboty', en: 'Saturdays' },
  '7|as-weekday': { pl: 'w niedziele', en: 'Sundays' },
}

const DAY_ABBR = {
  pl: ['pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

/** "pon.–czw., niedz." / "Mon–Thu, Sun": runs of three or more weekdays collapsed. */
function formatWeekdays(weekdays: number[], lang: 'pl' | 'en'): string {
  const parts: string[] = []
  let i = 0
  while (i < weekdays.length) {
    let j = i
    while (j + 1 < weekdays.length && weekdays[j + 1] === weekdays[j] + 1) j++
    const name = (d: number) => DAY_ABBR[lang][d - 1]
    if (j - i >= 2) parts.push(`${name(weekdays[i])}–${name(weekdays[j])}`)
    else for (let k = i; k <= j; k++) parts.push(name(weekdays[k]))
    i = j + 1
  }
  return parts.join(', ')
}

export function formatPattern(pattern: WeeklyPattern, lang: 'pl' | 'en'): string {
  const named = NAMED_TEXT[`${pattern.weekdays.join()}|${pattern.holidays}`]
  if (named) return named[lang]
  const days = formatWeekdays(pattern.weekdays, lang)
  if (pattern.holidays === 'excluded') return lang === 'pl' ? `${days} oprócz świąt` : `${days} except holidays`
  if (pattern.holidays === 'added') return lang === 'pl' ? `${days} i w święta` : `${days} and holidays`
  return days
}

/** The note as one line, e.g. "w dni robocze od 31 X, nie kursuje: 24 XII". */
export function formatRunningDays(days: RunningDays, lang: 'pl' | 'en'): string {
  const t = lang === 'pl'
    ? { runs: 'kursuje', from: 'od', to: 'do', except: 'nie kursuje', also: 'kursuje także' }
    : { runs: 'runs', from: 'from', to: 'until', except: 'not running', also: 'also runs' }
  if (days.kind === 'dates') return `${t.runs}: ${formatDates(days.dates, lang)}`
  const parts = [formatPattern(days.pattern, lang)]
  if (days.from) parts.push(`${t.from} ${formatDates([days.from], lang)}`)
  if (days.to) parts.push(`${t.to} ${formatDates([days.to], lang)}`)
  let text = parts.join(' ')
  if (days.except.length) text += `, ${t.except}: ${formatDates(days.except, lang)}`
  if (days.also.length) text += `, ${t.also}: ${formatDates(days.also, lang)}`
  return text
}
