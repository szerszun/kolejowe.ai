export type LineStatus = "active_passenger" | "freight_only" | "planned" | "closed";

export type TenderStatus = "open" | "closed" | "awarded";

export interface Station {
  id: string;
  name: string;
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export interface Tender {
  id: string;
  title: string;
  authority: string;
  estimatedValuePLN: number | null;
  publicationDate: string; // ISO date
  deadline: string | null; // ISO date
  status: TenderStatus;
  url: string;
  matchType: "auto-matched" | "confirmed";
}

export interface HistoryEvent {
  year: number;
  label: string;
}

export interface SourceRef {
  section: "overview" | "history" | "tenders";
  label: string;
  url?: string;
  lastUpdated: string; // ISO date
}

export interface RailwayLine {
  id: string; // slug, equals number for now e.g. "274"
  number: string;
  name: string;
  status: LineStatus;
  electrified: boolean;
  lengthKm: number;
  tracks: number;
  maxSpeedKmh: number;
  operators: string[];
  passengerServices: string[];
  endStations: [string, string];
  stations: Station[];
  /** Simplified illustrative path, not a surveyed track alignment. [lon, lat][] */
  geometry: [number, number][];
  history: {
    timeline: HistoryEvent[];
    narrative: string;
    photos: { url: string; credit: string }[];
  };
  tenders: Tender[];
  sources: SourceRef[];
  /** Line 275 in the spec has a manually curated Notion structure */
  manuallyCurated?: boolean;
}

export type Language = "pl" | "en";

export type DaysOfOperation = "daily" | "weekdays" | "weekend" | "other";

export interface TimetableInfo {
  validFrom?: string; // ISO date
  validTo?: string; // ISO date
  source?: string;
}

export interface StationPhoto {
  url: string;
  credit: string;
}

export interface StationTimetableEntry {
  id: string;
  time: string; // "HH:MM", 24h
  lineId: string;
  destination: string;
  operator: string;
  platform: string;
  daysOfOperation: DaysOfOperation;
  trainNumber?: string;
  trainName?: string;
}

export interface StationArrivalEntry {
  id: string;
  time: string; // "HH:MM", 24h
  lineId: string;
  origin: string;
  operator: string;
  platform: string;
  daysOfOperation: DaysOfOperation;
  trainNumber?: string;
  trainName?: string;
}

export interface StationDetails {
  stationId: string;
  /** One sentence for a simple-tier station; a fuller paragraph for a detailed-tier one. */
  description?: string;
  category?: string;
  address?: string;
  yearBuilt?: number;
  platformCount?: number;
  accessibility?: string;
  amenities: string[];
  photo?: StationPhoto;
  timetable: StationTimetableEntry[];
  arrivals: StationArrivalEntry[];
  sources: SourceRef[];
}
