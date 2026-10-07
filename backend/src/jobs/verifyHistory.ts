/**
 * Weekly "Historia" tab verification agent: re-checks a line's history
 * timeline and narrative against the live web and, if Claude finds a
 * clear, sourced, significant discrepancy or omission, writes a draft
 * update for a human to review. Always bumps the history source's
 * `lastUpdated` to today, even when nothing changed -- see verifyOverview.ts
 * for why that matters.
 */
import { getLine, patchLine, bumpSourceDate, type SourceEntry } from './payloadClient'
import { researchWithWebSearch, extractJsonBlock } from './openaiClient'

const today = () => new Date().toISOString().slice(0, 10)

type HistoryLineDoc = {
  id: string
  number: string
  name: string
  endStations: { value: string }[]
  history: {
    timeline: { year: number; label: string }[]
    narrative: string
  }
  sources: SourceEntry[]
}

type VerifyVerdict = {
  hasSignificantChange: boolean
  updatedTimeline: { year: number; label: string }[] | null
  updatedNarrative: string | null
  reasoning: string
  sourceUrl: string | null
}

const SYSTEM_PROMPT = `You are a fact-checking agent for kolejowe.ai, a database of railway lines in the Dolny Śląsk (Lower Silesia) region of Poland. You verify the "history" tab (an opening-year-to-present timeline, plus a short narrative) for one line at a time, against current, authoritative sources (Wikipedia, Atlas linii kolejowych w Polsce, PKP PLK, regional history sources).

Only flag a significant change if you find clear, sourced evidence of a real factual error or a genuinely important missing milestone (opening year, major closure/reopening, electrification date, a significant reconstruction) -- not minor stylistic rewrites. If the existing timeline and narrative already look accurate and reasonably complete, say so with hasSignificantChange: false rather than inventing filler.

IMPORTANT pitfall specific to this dataset, discovered repeatedly during manual research: a Wikipedia article for a given PKP line *number* sometimes describes a historically different route than our dataset's actual geometry (Polish line numbers get reused across eras). Before using any fact, confirm the source's route endpoints/towns genuinely match the end stations given below -- if they don't match, the source is about a different line reusing the same number; discard it entirely rather than attributing its history to this line.

When you do propose an update, updatedTimeline must be the FULL replacement list (merge your verified addition/correction into the existing entries rather than replacing wholesale), in chronological order by year, and updatedNarrative must be the full replacement paragraph (not a diff).

Respond at the end of your turn with exactly one \`\`\`json fenced code block (and nothing else inside the fence) containing:
{
  "hasSignificantChange": boolean,
  "updatedTimeline": null | [{ "year": number, "label": string }, ...],
  "updatedNarrative": null | string,
  "reasoning": string,
  "sourceUrl": string | null
}
sourceUrl is required (non-null) whenever hasSignificantChange is true. Set updatedTimeline/updatedNarrative to null individually if that particular part doesn't need changing even when the other one does.`

export type HistoryVerifyResult =
  | { ref: string; outcome: 'no_published_line' }
  | { ref: string; outcome: 'unchanged'; reasoning: string }
  | { ref: string; outcome: 'updated_as_draft'; reasoning: string; sourceUrl: string | null }

export async function verifyHistoryLine(ref: string): Promise<HistoryVerifyResult> {
  let line: HistoryLineDoc
  try {
    line = (await getLine(ref)) as unknown as HistoryLineDoc
  } catch {
    return { ref, outcome: 'no_published_line' }
  }

  const userContent = `Today's date is ${today()}. Verify this line's history timeline and narrative:

Line ${line.number} -- "${line.name}"
End stations: ${line.endStations.map((s) => s.value).join(' - ')}

Current timeline:
${line.history.timeline.map((e) => `- ${e.year}: ${e.label}`).join('\n') || '(empty)'}

Current narrative:
${line.history.narrative || '(empty)'}`

  const text = await researchWithWebSearch(SYSTEM_PROMPT, userContent)
  const verdict = extractJsonBlock<VerifyVerdict>(text)

  const sources = bumpSourceDate(line.sources, 'history', today())

  if (!verdict.hasSignificantChange) {
    await patchLine(ref, { sources })
    return { ref, outcome: 'unchanged', reasoning: verdict.reasoning }
  }

  const changeSummary = [
    'Agent web-search verification of the history tab found a significant discrepancy or omission.',
    verdict.reasoning,
    verdict.sourceUrl ? `Source: ${verdict.sourceUrl}` : '',
    'Not auto-published -- review before publishing.',
  ]
    .filter(Boolean)
    .join(' ')

  const body: Record<string, unknown> = {
    sources,
    changeSummary,
    history: {
      timeline: verdict.updatedTimeline ?? line.history.timeline,
      narrative: verdict.updatedNarrative ?? line.history.narrative,
    },
  }

  await patchLine(ref, body, { draft: true })

  return { ref, outcome: 'updated_as_draft', reasoning: verdict.reasoning, sourceUrl: verdict.sourceUrl }
}
