import { describe, expect, it } from 'vitest'
import type { PlkScheduleRoute } from '../lib/plkApi'
import { formatRunningDays } from './runningDays'
import { buildStationTimetable, timetablePeriodEnd } from './stationTimetable'

const WINDOW = { from: '2026-10-29', to: '2026-12-12' }
const NAMES = new Map([
  [1, 'Wrocław Główny'],
  [2, 'Oława'],
  [3, 'Brzeg'],
  [4, 'Opole Główne'],
])

function dates(from: string, to: string): string[] {
  const out: string[] = []
  for (const d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10))
  return out
}

// Wrocław Główny -> Oława -> Brzeg -> Opole Główne, departing at `time` from platform `platform`.
function route(orderId: number, time: string, platform: string, operatingDates: string[]): PlkScheduleRoute {
  return {
    scheduleId: 2026,
    orderId,
    trainOrderId: orderId,
    carrierCode: 'KD',
    nationalNumber: '64101',
    commercialCategorySymbol: 'R',
    operatingDates,
    stations: [
      { stationId: 1, orderNumber: 1, departureTime: `${time}:00`, departureTrainNumber: '64101', departurePlatform: platform, departureTrack: '3' },
      { stationId: 2, orderNumber: 2, arrivalTime: '08:20:00', departureTime: '08:21:00', arrivalTrainNumber: '64101', departureTrainNumber: '64101' },
      { stationId: 3, orderNumber: 3, arrivalTime: '08:35:00', departureTime: '08:36:00', arrivalTrainNumber: '64101', departureTrainNumber: '64101' },
      { stationId: 4, orderNumber: 4, arrivalTime: '09:00:00', arrivalTrainNumber: '64101', arrivalPlatform: '2' },
    ],
  }
}

describe('buildStationTimetable', () => {
  it('lists a departure with its terminus, calling points and running days', () => {
    const { departures, arrivals } = buildStationTimetable([route(1, '08:00', '4', dates('2026-10-29', '2026-12-12'))], NAMES, 1, WINDOW)

    expect(arrivals).toEqual([])
    expect(departures).toHaveLength(1)
    expect(departures[0]).toMatchObject({ time: '08:00', category: 'R', trainNumber: '64101', carrier: 'KD', platform: '4', track: '3', terminus: 'Opole Główne', via: ['Oława', 'Brzeg'] })
    expect(formatRunningDays(departures[0].runningDays, 'pl')).toBe('codziennie')
  })

  it('lists an arrival at the terminus with its origin', () => {
    const { departures, arrivals } = buildStationTimetable([route(1, '08:00', '4', ['2026-11-02'])], NAMES, 4, WINDOW)

    expect(departures).toEqual([])
    expect(arrivals[0]).toMatchObject({ time: '09:00', terminus: 'Wrocław Główny', via: ['Oława', 'Brzeg'], platform: '2' })
  })

  // The Szklarska Poręba case from 2026-10-29: new times from 31 X, split by PLK into
  // several routes. One row per time, each with its own dates, all routes merged.
  it('keeps each time as its own row, merging the routes that share it', () => {
    const { departures } = buildStationTimetable(
      [
        route(1, '08:00', '4', dates('2026-10-29', '2026-10-30')),
        route(2, '08:15', '4', dates('2026-10-31', '2026-11-15')),
        route(3, '08:15', '4', dates('2026-11-16', '2026-12-12')),
      ],
      NAMES,
      1,
      WINDOW,
    )

    expect(departures.map((d) => [d.time, formatRunningDays(d.runningDays, 'pl')])).toEqual([
      ['08:00', 'codziennie do 30 X'],
      ['08:15', 'codziennie od 31 X'],
    ])
  })

  it('splits a train by platform, as the timetable prints platforms per row', () => {
    const { departures } = buildStationTimetable(
      [route(1, '08:00', '4', dates('2026-10-29', '2026-11-30')), route(2, '08:00', '1', dates('2026-12-01', '2026-12-12'))],
      NAMES,
      1,
      WINDOW,
    )
    expect(departures.map((d) => [d.platform, formatRunningDays(d.runningDays, 'pl')])).toEqual([
      ['4', 'codziennie do 30 XI'],
      ['1', 'codziennie od 1 XII'],
    ])
  })

  it('drops a variant that no longer runs in the window', () => {
    const { departures } = buildStationTimetable([route(1, '08:00', '4', ['2026-10-01'])], NAMES, 1, WINDOW)
    expect(departures).toEqual([])
  })

  it('caps calling points at three, spread along the route', () => {
    const long: PlkScheduleRoute = {
      ...route(1, '08:00', '4', ['2026-11-02']),
      stations: Array.from({ length: 9 }, (_, i) => ({ stationId: 100 + i, orderNumber: i + 1, departureTime: '08:00:00', arrivalTime: '08:00:00' })),
    }
    const names = new Map(Array.from({ length: 9 }, (_, i) => [100 + i, `S${i}`] as [number, string]))
    const { departures } = buildStationTimetable([long], names, 100, WINDOW)
    expect(departures[0].terminus).toBe('S8')
    expect(departures[0].via).toEqual(['S2', 'S4', 'S6'])
  })
})

describe('timetablePeriodEnd', () => {
  it('is the Saturday before the second Sunday of December', () => {
    expect(timetablePeriodEnd('2026-10-29')).toBe('2026-12-12')
    expect(timetablePeriodEnd('2026-12-12')).toBe('2026-12-12')
    expect(timetablePeriodEnd('2026-12-13')).toBe('2027-12-11')
    expect(timetablePeriodEnd('2025-12-01')).toBe('2025-12-13')
  })
})
