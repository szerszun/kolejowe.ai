/**
 * Weekly "Informacje" tab verification agent: re-checks a line's overview
 * facts (status, electrification, length, tracks, max speed, operators,
 * passenger services, end stations) against the live web and, if Claude
 * finds a clear, sourced, significant discrepancy, writes a draft update
 * for a human to review. Always bumps the overview source's `lastUpdated`
 * to today -- even when nothing changed, that's the point: it records that
 * a real check happened (see the lastUpdated staleness bug fixed earlier
 * this project for why this matters).
 */
import { getLine, patchLine, bumpSourceDate, type SourceEntry } from './payloadClient'
import { researchWithWebSearch, extractJsonBlock } from './openaiClient'

const today = () => new Date().toISOString().slice(0, 10)

type OverviewLineDoc = {
  id: string
  number: string
  name: string
  status: string
  electrified: boolean
  lengthKm: number
  tracks: number
  maxSpeedKmh: number
  operators: { value: string }[]
  passengerServices: { value: string }[]
  endStations: { value: string }[]
  sources: SourceEntry[]
}

type UpdatedFields = {
  status?: 'active_passenger' | 'freight_only' | 'planned' | 'closed'
  electrified?: boolean
  lengthKm?: number
  tracks?: number
  maxSpeedKmh?: number
  operators?: string[]
  passengerServices?: string[]
  endStations?: [string, string]
}

type VerifyVerdict = {
  hasSignificantChange: boolean
  updatedFields: UpdatedFields | null
  reasoning: string
  sourceUrl: string | null
}

const SYSTEM_PROMPT = `You are a fact-checking agent for kolejowe.ai, a database of railway lines in the Dolny Śląsk (Lower Silesia) region of Poland. You verify the "overview" facts for one line at a time against current, authoritative sources (official PKP PLK documents/announcements, Wikipedia, regional operator news).

Only flag a field as needing an update if you find clear, current evidence the stored value is factually wrong or outdated -- e.g. the line was electrified since, a passenger operator was added or withdrew, the line closed or reopened, or a completed upgrade changed its speed/track count. Do NOT flag rounding differences, phrasing differences, or anything you can't confirm with a real source.

IMPORTANT pitfall specific to this dataset: a Wikipedia article for a given PKP line *number* sometimes describes a historically different route than our dataset's actual geometry. Before using any fact, confirm the source's route endpoints/towns genuinely match the end stations given below -- if they don't match, the source is about a different line reusing the same number; discard it.

Respond at the end of your turn with exactly one \`\`\`json fenced code block (and nothing else inside the fence) containing:
{
  "hasSignificantChange": boolean,
  "updatedFields": null | {
    "status"?: "active_passenger" | "freight_only" | "planned" | "closed",
    "electrified"?: boolean,
    "lengthKm"?: number,
    "tracks"?: number,
    "maxSpeedKmh"?: number,
    "operators"?: string[],
    "passengerServices"?: string[],
    "endStations"?: [string, string]
  },
  "reasoning": string,
  "sourceUrl": string | null
}
Only include keys in updatedFields for values that actually changed. sourceUrl is required (non-null) whenever hasSignificantChange is true.`

export type OverviewVerifyResult =
  | { ref: string; outcome: 'no_published_line' }
  | { ref: string; outcome: 'unchanged'; reasoning: string }
  | { ref: string; outcome: 'updated_as_draft'; reasoning: string; sourceUrl: string | null; fields: string[] }

export async function verifyOverviewLine(ref: string): Promise<OverviewVerifyResult> {
  let line: OverviewLineDoc
  try {
    line = (await getLine(ref)) as unknown as OverviewLineDoc
  } catch {
    return { ref, outcome: 'no_published_line' }
  }

  const userContent = `Today's date is ${today()}. Verify this line's overview facts:

Line ${line.number} -- "${line.name}"
End stations: ${line.endStations.map((s) => s.value).join(' - ')}
Status: ${line.status}
Electrified: ${line.electrified}
Length: ${line.lengthKm} km
Tracks: ${line.tracks}
Max speed: ${line.maxSpeedKmh} km/h
Operators: ${line.operators.map((o) => o.value).join(', ') || '(none listed)'}
Passenger services: ${line.passengerServices.map((p) => p.value).join(', ') || '(none listed)'}`

  const text = await researchWithWebSearch(SYSTEM_PROMPT, userContent)
  const verdict = extractJsonBlock<VerifyVerdict>(text)

  const sources = bumpSourceDate(line.sources, 'overview', today())

  if (!verdict.hasSignificantChange || !verdict.updatedFields) {
    await patchLine(ref, { sources })
    return { ref, outcome: 'unchanged', reasoning: verdict.reasoning }
  }

  const f = verdict.updatedFields
  const changeSummary = [
    'Agent web-search verification of the overview tab found a significant discrepancy.',
    verdict.reasoning,
    verdict.sourceUrl ? `Source: ${verdict.sourceUrl}` : '',
    'Not auto-published -- review before publishing.',
  ]
    .filter(Boolean)
    .join(' ')

  const body: Record<string, unknown> = { sources, changeSummary }
  if (f.status !== undefined) body.status = f.status
  if (f.electrified !== undefined) body.electrified = f.electrified
  if (f.lengthKm !== undefined) body.lengthKm = f.lengthKm
  if (f.tracks !== undefined) body.tracks = f.tracks
  if (f.maxSpeedKmh !== undefined) body.maxSpeedKmh = f.maxSpeedKmh
  if (f.operators !== undefined) body.operators = f.operators.map((value) => ({ value }))
  if (f.passengerServices !== undefined)
    body.passengerServices = f.passengerServices.map((value) => ({ value }))
  if (f.endStations !== undefined) body.endStations = f.endStations.map((value) => ({ value }))

  await patchLine(ref, body, { draft: true })

  return {
    ref,
    outcome: 'updated_as_draft',
    reasoning: verdict.reasoning,
    sourceUrl: verdict.sourceUrl,
    fields: Object.keys(f),
  }
}
