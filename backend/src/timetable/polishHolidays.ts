/**
 * Polish public holidays (dni ustawowo wolne od pracy), which decide the "w dni robocze"
 * and "w niedziele i święta" running-day patterns on station timetables. Christmas Eve
 * is a holiday from 2025 on.
 */

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Easter Sunday (Gregorian), Meeus/Jones/Butcher algorithm. */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function plusDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function polishHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  const holidays = [
    iso(year, 1, 1), // Nowy Rok
    iso(year, 1, 6), // Trzech Króli
    plusDays(easter, 0), // Wielkanoc
    plusDays(easter, 1), // Poniedziałek Wielkanocny
    iso(year, 5, 1),
    iso(year, 5, 3),
    plusDays(easter, 49), // Zielone Świątki
    plusDays(easter, 60), // Boże Ciało
    iso(year, 8, 15),
    iso(year, 11, 1),
    iso(year, 11, 11),
    iso(year, 12, 25),
    iso(year, 12, 26),
  ]
  if (year >= 2025) holidays.push(iso(year, 12, 24)) // Wigilia, a holiday since 2025
  return new Set(holidays)
}

const cache = new Map<number, Set<string>>()

export function isPolishHoliday(date: string): boolean {
  const year = Number(date.slice(0, 4))
  let set = cache.get(year)
  if (!set) {
    set = polishHolidays(year)
    cache.set(year, set)
  }
  return set.has(date)
}
