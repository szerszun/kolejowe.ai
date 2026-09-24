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
