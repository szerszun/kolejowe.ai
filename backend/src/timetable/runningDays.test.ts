import { describe, expect, it } from 'vitest'
import { describeRunningDays, formatDates, formatRunningDays } from './runningDays'
import { polishHolidays } from './polishHolidays'

// Today to the end of the 2025/26 timetable. Holidays inside: 1 XI (a Sunday), 11 XI (a Wednesday).
const WINDOW = { from: '2026-10-29', to: '2026-12-12' }

function days(filter: (date: string, weekday: number) => boolean, from = WINDOW.from, to = WINDOW.to): string[] {
  const out: string[] = []
  for (const d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10)
    const wd = d.getUTCDay() === 0 ? 7 : d.getUTCDay()
    if (filter(date, wd)) out.push(date)
  }
  return out
}
const describe_ = (dates: string[]) => describeRunningDays(dates, WINDOW)
const text = (dates: string[], lang: 'pl' | 'en' = 'pl') => formatRunningDays(describe_(dates)!, lang)

describe('describeRunningDays', () => {
  it('a train running every day is "codziennie"', () => {
    expect(text(days(() => true))).toBe('codziennie')
  })

  it('Mon-Fri skipping public holidays is "w dni robocze", not Mon-Fri with an exception', () => {
    expect(text(days((d, wd) => wd <= 5 && d !== '2026-11-11'))).toBe('w dni robocze')
  })

  it('Mon-Fri including a public holiday is "od poniedziałku do piątku"', () => {
    expect(text(days((_, wd) => wd <= 5))).toBe('od poniedziałku do piątku')
  })

  it('Sundays plus the holidays is "w niedziele i święta"', () => {
    expect(text(days((d, wd) => wd === 7 || d === '2026-11-11'))).toBe('w niedziele i święta')
  })

  it('a weekly train gets its weekday, not a list of dates', () => {
    expect(text(days((_, wd) => wd === 6))).toBe('w soboty')
  })

  it('a new timetable starting mid-window is bounded with "od"', () => {
    expect(text(days((d) => d >= '2026-10-31'))).toBe('codziennie od 31 X')
  })

  it('a timetable ending mid-window is bounded with "do"', () => {
    expect(text(days((d, wd) => wd <= 5 && d !== '2026-11-11' && d <= '2026-11-20'))).toBe('w dni robocze do 20 XI')
  })

  it('a single missing day is an exception', () => {
    expect(text(days((d) => d !== '2026-11-15'))).toBe('codziennie, nie kursuje: 15 XI')
  })

  it('an extra day on top of a pattern is "kursuje także"', () => {
    expect(text(days((d, wd) => wd === 6 || d === '2026-11-11'))).toBe('w soboty, kursuje także: 11 XI')
  })

  // IC 7318 at Wrocław Główny: Sunday to Thursday, which no named pattern covers.
  it('any weekday combination is written as weekdays, not as one day plus a list', () => {
    expect(text(days((_, wd) => wd <= 4 || wd === 7))).toBe('pon.–czw., niedz.')
    expect(text(days((_, wd) => wd <= 4 || wd === 7), 'en')).toBe('Mon–Thu, Sun')
  })

  it('a weekday combination skipping holidays says so', () => {
    expect(text(days((d, wd) => (wd === 2 || wd === 3) && d !== '2026-11-11'))).toBe('wt., śr. oprócz świąt')
  })

  // IC 37011 at Wrocław Główny: daily, then a long break across the month end, then one last day.
  it('picks the wording with fewer printed items when a gap crosses a month end', () => {
    expect(text(days((d) => d <= '2026-11-19' || d === '2026-12-11'))).toBe('codziennie do 19 XI, kursuje także: 11 XII')
  })

  it('scattered dates with no pattern are listed', () => {
    expect(text(['2026-11-03', '2026-11-19', '2026-12-02'])).toBe('kursuje: 3, 19 XI; 2 XII')
  })

  // The replacement-bus case seen at Nysa on 2026-10-29: a bus on the first two days.
  it('a short run at the start of the window is a "do" bound', () => {
    expect(text(['2026-10-29', '2026-10-30'])).toBe('codziennie do 30 X')
  })

  it('ignores dates outside the window, and returns null when none are left', () => {
    expect(text(['2026-10-01', ...days(() => true)])).toBe('codziennie')
    expect(describe_(['2026-10-01', '2027-01-05'])).toBeNull()
  })

  it('has an English wording', () => {
    expect(text(days((d) => d >= '2026-10-31' && d !== '2026-11-15'), 'en')).toBe('daily from 31 Oct, not running: 15 Nov')
  })
})

describe('formatDates', () => {
  it('collapses consecutive days and groups by month', () => {
    expect(formatDates(['2026-11-01', '2026-11-08', '2026-12-24', '2026-12-25', '2026-12-26'], 'pl')).toBe('1, 8 XI; 24–26 XII')
    expect(formatDates(['2026-11-30', '2026-12-01'], 'en')).toBe('30 Nov; 1 Dec')
  })
})

describe('polishHolidays', () => {
  it('includes the Easter-based holidays', () => {
    const h = polishHolidays(2026) // Easter Sunday: 5 April 2026
    for (const d of ['2026-04-05', '2026-04-06', '2026-05-24', '2026-06-04']) expect(h.has(d)).toBe(true)
  })

  it('counts Christmas Eve as a holiday from 2025', () => {
    expect(polishHolidays(2024).has('2024-12-24')).toBe(false)
    expect(polishHolidays(2025).has('2025-12-24')).toBe(true)
  })
})
