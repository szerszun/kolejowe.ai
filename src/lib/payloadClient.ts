import type {
  DaysOfOperation,
  HistoryEvent,
  RailwayLine,
  SourceRef,
  Station,
  StationArrivalEntry,
  StationDetails,
  StationTimetableEntry,
  Tender,
  TenderStatus,
} from "../types";

// Base URL of the Payload backend (see backend/README.md). Configurable via
// VITE_PAYLOAD_URL for anything other than the default local dev setup.
export const PAYLOAD_URL = (import.meta.env.VITE_PAYLOAD_URL as string | undefined) ?? "http://localhost:3000";

export class PayloadFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadFetchError";
  }
}

async function payloadFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${PAYLOAD_URL}${path}`);
  } catch {
    throw new PayloadFetchError(`Could not reach the backend at ${PAYLOAD_URL}. Is it running? (cd backend && npm run dev)`);
  }
  if (!res.ok) {
    throw new PayloadFetchError(`${PAYLOAD_URL}${path} -> HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// Payload represents string[] fields as an array of {id, value} rows (a
// side effect of how its `array` field type works) -- unwrap them back into
// plain strings for the frontend's RailwayLine shape.
function unwrapValues(rows: { value: string }[] | null | undefined): string[] {
  return (rows ?? []).map((r) => r.value);
}

function toDateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toOptionalDateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

// A relationship field comes back as either a bare id (depth=0) or a fully
// populated document (depth>=1) depending on the query -- normalize to the
// id either way rather than depending on a specific depth.
function relId(value: string | number | { id: string | number } | null | undefined): string {
  if (value == null) return "";
  return typeof value === "object" ? String(value.id) : String(value);
}

interface PayloadStationDoc {
  id: string;
  name: string;
  coordinates: [number, number];
  category?: string | null;
  address?: string | null;
  yearBuilt?: number | null;
  platformCount?: number | null;
  accessibility?: string | null;
  amenities?: { label: string }[] | null;
  photo?: string | number | PayloadMediaDoc | null;
  timetable?: PayloadMovementDoc[] | null;
  arrivals?: PayloadMovementDoc[] | null;
  sources?: PayloadSourceDoc[] | null;
}

interface PayloadMediaDoc {
  id: string | number;
  url?: string | null;
  credit?: string | null;
}

interface PayloadMovementDoc {
  id: string;
  time: string;
  lineId: string | { id: string };
  operator?: string | null;
  platform?: string | null;
  daysOfOperation?: DaysOfOperation | null;
  destination?: string | null;
  origin?: string | null;
}

interface PayloadSourceDoc {
  section: "overview" | "history" | "tenders";
  label: string;
  url?: string | null;
  lastUpdated?: string | null;
}

interface PayloadTenderDoc {
  title: string;
  authority?: string | null;
  estimatedValuePLN?: number | null;
  publicationDate?: string | null;
  deadline?: string | null;
  status?: TenderStatus | null;
  url?: string | null;
  matchType?: "auto-matched" | "confirmed" | null;
}

interface PayloadLineDoc {
  id: string;
  number: string;
  name: string;
  status: RailwayLine["status"];
  electrified: boolean;
  lengthKm: number;
  tracks: number;
  maxSpeedKmh: number;
  manuallyCurated?: boolean | null;
  operators?: { value: string }[] | null;
  passengerServices?: { value: string }[] | null;
  endStations?: { value: string }[] | null;
  stations?: (string | PayloadStationDoc)[] | null;
  geometry?: [number, number][] | null;
  history?: {
    timeline?: HistoryEvent[] | null;
    narrative?: string | null;
    photos?: (string | number | PayloadMediaDoc)[] | null;
  } | null;
  tenders?: PayloadTenderDoc[] | null;
  sources?: PayloadSourceDoc[] | null;
}

function toSource(s: PayloadSourceDoc): SourceRef {
  return {
    section: s.section,
    label: s.label,
    url: s.url ?? undefined,
    lastUpdated: toDateOnly(s.lastUpdated),
  };
}

function toStation(s: PayloadStationDoc | string): Station {
  if (typeof s === "string") {
    // Unpopulated relationship (depth 0) -- shouldn't normally happen given
    // how fetchLines requests depth=1, but fail soft with a placeholder
    // rather than crashing the whole line.
    return { id: s, name: s, coordinates: [0, 0] };
  }
  return { id: s.id, name: s.name, coordinates: s.coordinates };
}

let tenderCounter = 0;
function toTender(t: PayloadTenderDoc, lineId: string): Tender {
  tenderCounter += 1;
  return {
    id: `${lineId}-tender-${tenderCounter}`,
    title: t.title,
    authority: t.authority ?? "",
    estimatedValuePLN: t.estimatedValuePLN ?? null,
    publicationDate: toDateOnly(t.publicationDate),
    deadline: toOptionalDateOnly(t.deadline),
    status: t.status ?? "open",
    url: t.url ?? "",
    matchType: t.matchType ?? "auto-matched",
  };
}

export function toRailwayLine(doc: PayloadLineDoc): RailwayLine {
  const endStations = unwrapValues(doc.endStations);
  return {
    id: doc.id,
    number: doc.number,
    name: doc.name,
    status: doc.status,
    electrified: doc.electrified,
    lengthKm: doc.lengthKm,
    tracks: doc.tracks,
    maxSpeedKmh: doc.maxSpeedKmh,
    operators: unwrapValues(doc.operators),
    passengerServices: unwrapValues(doc.passengerServices),
    endStations: [endStations[0] ?? "", endStations[1] ?? ""],
    stations: (doc.stations ?? []).map(toStation),
    geometry: doc.geometry ?? [],
    history: {
      timeline: doc.history?.timeline ?? [],
      narrative: doc.history?.narrative ?? "",
      photos: [], // not populated by fetchLines (depth=1 doesn't reach history.photos' media docs); none of the seeded lines have any yet
    },
    tenders: (doc.tenders ?? []).map((t) => toTender(t, doc.id)),
    sources: (doc.sources ?? []).map(toSource),
    manuallyCurated: doc.manuallyCurated ?? undefined,
  };
}

export async function fetchLines(): Promise<RailwayLine[]> {
  const data = await payloadFetch<{ docs: PayloadLineDoc[] }>("/api/lines?limit=0&depth=1");
  return data.docs.map(toRailwayLine);
}

function mediaUrl(m: string | number | PayloadMediaDoc | null | undefined): string | undefined {
  if (!m || typeof m !== "object" || !m.url) return undefined;
  return m.url.startsWith("http") ? m.url : `${PAYLOAD_URL}${m.url}`;
}

function toTimetableEntry(m: PayloadMovementDoc): StationTimetableEntry {
  return {
    id: m.id,
    time: m.time,
    lineId: relId(m.lineId),
    destination: m.destination ?? "",
    operator: m.operator ?? "",
    platform: m.platform ?? "",
    daysOfOperation: m.daysOfOperation ?? "daily",
  };
}

function toArrivalEntry(m: PayloadMovementDoc): StationArrivalEntry {
  return {
    id: m.id,
    time: m.time,
    lineId: relId(m.lineId),
    origin: m.origin ?? "",
    operator: m.operator ?? "",
    platform: m.platform ?? "",
    daysOfOperation: m.daysOfOperation ?? "daily",
  };
}

export function toStationDetails(doc: PayloadStationDoc): StationDetails {
  const photoUrl = mediaUrl(doc.photo);
  const photoCredit = typeof doc.photo === "object" && doc.photo ? doc.photo.credit : undefined;
  return {
    stationId: doc.id,
    category: doc.category ?? undefined,
    address: doc.address ?? undefined,
    yearBuilt: doc.yearBuilt ?? undefined,
    platformCount: doc.platformCount ?? undefined,
    accessibility: doc.accessibility ?? undefined,
    amenities: (doc.amenities ?? []).map((a) => a.label),
    photo: photoUrl ? { url: photoUrl, credit: photoCredit ?? "" } : undefined,
    timetable: (doc.timetable ?? []).map(toTimetableEntry),
    arrivals: (doc.arrivals ?? []).map(toArrivalEntry),
    sources: (doc.sources ?? []).map(toSource),
  };
}

export async function fetchStationDetails(stationId: string): Promise<StationDetails | null> {
  let doc: PayloadStationDoc;
  try {
    doc = await payloadFetch<PayloadStationDoc>(`/api/stations/${encodeURIComponent(stationId)}?depth=1`);
  } catch (err) {
    if (err instanceof PayloadFetchError && err.message.includes("HTTP 404")) return null;
    throw err;
  }
  return toStationDetails(doc);
}
