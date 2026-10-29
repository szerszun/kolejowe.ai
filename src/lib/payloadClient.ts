import type {
  DaysOfOperation,
  HistoryEvent,
  LiveMovement,
  LiveMovementsUnavailableReason,
  RailwayLine,
  SourceRef,
  Station,
  StationArrivalEntry,
  StationDetails,
  StationTimetableEntry,
  Tender,
  TenderStatus,
  TimetableInfo,
} from "../types";

// Base URL of the Payload backend (see backend/README.md). Configurable via
// VITE_PAYLOAD_URL for anything other than the default local dev setup, or
// via VITE_PAYLOAD_HOST (just the bare Render service name, e.g.
// "kolejowe-backend" -- confirmed empirically: Render's `fromService`
// `property: host` does NOT return a full hostname, just the service's own
// name, so ".onrender.com" has to be appended here) when the only thing
// that varies between environments is which Render service to hit.
const payloadHost = import.meta.env.VITE_PAYLOAD_HOST as string | undefined;
export const PAYLOAD_URL =
  (import.meta.env.VITE_PAYLOAD_URL as string | undefined) ??
  (payloadHost ? `https://${payloadHost}.onrender.com` : "http://localhost:3000");

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

// `geometry` is a loosely-typed `json` field, and some write path in the
// backend (confirmed: any PATCH at all, even ones that never touch this
// field) occasionally round-trips each [lon, lat] tuple through Payload's
// internal merge as a plain object ({"0": lon, "1": lat}) instead of a real
// array -- same values, wrong shape, invisible in a JSON dump but fatal to
// anything that iterates coordinates (`for (const [lon, lat] of coords)`
// throws instead of destructuring a plain object). Normalizing defensively
// here, once, is far more durable than re-fixing the DB after every write.
function toCoordinate(p: unknown): [number, number] | null {
  if (Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number") return [p[0], p[1]];
  if (p && typeof p === "object" && "0" in p && "1" in p) {
    const obj = p as Record<string, unknown>;
    if (typeof obj["0"] === "number" && typeof obj["1"] === "number") return [obj["0"], obj["1"]];
  }
  return null;
}

function toGeometry(raw: unknown): [number, number][] {
  if (!Array.isArray(raw)) return [];
  return raw.map(toCoordinate).filter((p): p is [number, number] => p !== null);
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
  description?: string | null;
  category?: string | null;
  address?: string | null;
  yearBuilt?: number | null;
  platformCount?: number | null;
  accessibility?: string | null;
  amenities?: { label: string }[] | null;
  photo?: { url?: string | null; credit?: string | null } | null;
  timetable?: PayloadMovementDoc[] | null;
  arrivals?: PayloadMovementDoc[] | null;
  sources?: PayloadSourceDoc[] | null;
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
  trainNumber?: string | null;
  trainName?: string | null;
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
    photos?: { url: string; credit?: string | null }[] | null;
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
    // Unpopulated relationship -- /api/lines/map leaves a station the visitor
    // can't read (unpublished) as a bare id. Shouldn't happen for published
    // lines, but fail soft with a placeholder rather than crashing the line.
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
    geometry: toGeometry(doc.geometry),
    history: {
      timeline: doc.history?.timeline ?? [],
      narrative: doc.history?.narrative ?? "",
      photos: (doc.history?.photos ?? []).map((p) => ({ url: p.url, credit: p.credit ?? "" })),
    },
    tenders: (doc.tenders ?? []).map((t) => toTender(t, doc.id)),
    sources: (doc.sources ?? []).map(toSource),
    manuallyCurated: doc.manuallyCurated ?? undefined,
  };
}

export async function fetchLines(): Promise<RailwayLine[]> {
  // Every line, each station cut down to id/name/coordinates (backend Lines.ts, /map endpoint).
  const data = await payloadFetch<{ docs: PayloadLineDoc[] }>("/api/lines/map");
  return data.docs.map(toRailwayLine);
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
    trainNumber: m.trainNumber ?? undefined,
    trainName: m.trainName ?? undefined,
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
    trainNumber: m.trainNumber ?? undefined,
    trainName: m.trainName ?? undefined,
    daysOfOperation: m.daysOfOperation ?? "daily",
  };
}

export function toStationDetails(doc: PayloadStationDoc): StationDetails {
  return {
    stationId: doc.id,
    description: doc.description ?? undefined,
    category: doc.category ?? undefined,
    address: doc.address ?? undefined,
    yearBuilt: doc.yearBuilt ?? undefined,
    platformCount: doc.platformCount ?? undefined,
    accessibility: doc.accessibility ?? undefined,
    amenities: (doc.amenities ?? []).map((a) => a.label),
    photo: doc.photo?.url ? { url: doc.photo.url, credit: doc.photo.credit ?? "" } : undefined,
    timetable: (doc.timetable ?? []).map(toTimetableEntry),
    arrivals: (doc.arrivals ?? []).map(toArrivalEntry),
    sources: (doc.sources ?? []).map(toSource),
  };
}

export async function submitFeedback(input: { message: string; page: string; language: string }): Promise<void> {
  const res = await fetch(`${PAYLOAD_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message,
      page: input.page,
      language: input.language,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    throw new PayloadFetchError(`${PAYLOAD_URL}/api/feedback -> HTTP ${res.status}`);
  }
}

export async function fetchTimetableInfo(): Promise<TimetableInfo | null> {
  try {
    return await payloadFetch<TimetableInfo>("/api/globals/timetable-info");
  } catch {
    return null;
  }
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

interface LiveMovementsResponse {
  available: boolean;
  stale?: boolean;
  movements?: LiveMovement[];
  reason?: LiveMovementsUnavailableReason;
}

export interface LiveMovementsFetchResult {
  movements: LiveMovement[] | null;
  /** Non-null exactly when `movements` is null -- see LiveMovementsUnavailableReason for what each value means. */
  reason: LiveMovementsUnavailableReason | null;
}

/**
 * Real-time arrivals/departures for a station from PKP PLK's Open Data API,
 * proxied through the backend (see backend/src/lib/liveMovements.ts --
 * that's where caching and the API quota budget live). `movements: null`
 * means the caller should fall back to the static timetable; `reason`
 * distinguishes "this station just has no PKP PLK match" (normal) from
 * "the feed itself is down" (worth telling the user about).
 */
export async function fetchLiveMovements(stationId: string): Promise<LiveMovementsFetchResult> {
  try {
    const data = await payloadFetch<LiveMovementsResponse>(`/api/stations/${encodeURIComponent(stationId)}/live`);
    if (data.available) return { movements: data.movements ?? [], reason: null };
    return { movements: null, reason: data.reason ?? "upstream_error" };
  } catch {
    return { movements: null, reason: "upstream_error" };
  }
}
