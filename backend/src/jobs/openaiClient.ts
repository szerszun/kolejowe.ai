/**
 * Minimal client for a single OpenAI Responses API call with the built-in
 * web_search tool, used by the overview/history verify agents to actually
 * check DB content against the live web. No SDK dependency, just fetch,
 * matching the rest of src/jobs/ (see overpass.ts, syncLineGeometry.ts).
 */
const OPENAI_URL = 'https://api.openai.com/v1/responses'
const MODEL = process.env.OPENAI_MODEL || 'gpt-5.5'

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set -- add it to backend/.env (get one at platform.openai.com)')
  }
  return key
}

type OutputTextContent = { type: 'output_text'; text: string }
type MessageItem = { type: 'message'; content: (OutputTextContent | { type: string })[] }
type ResponsesResult = {
  status: 'completed' | 'incomplete' | 'failed'
  incomplete_details?: { reason: string }
  output: (MessageItem | { type: string })[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs one research turn with web search enabled and returns the
 * concatenated text of the final assistant message. The web_search tool
 * runs server-side within this single call, so there's no multi-turn loop
 * to manage here.
 *
 * Retries on 429 (rate limit) with exponential backoff -- a sequential
 * 86-line sweep is heavy enough to reliably hit a shared org-level TPM
 * limit, and a single transient 429 shouldn't permanently skip a line.
 */
export async function researchWithWebSearch(system: string, userContent: string): Promise<string> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(5000 * 2 ** (attempt - 1), 60_000)
      await sleep(delay)
    }

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: system,
        input: userContent,
        // Reasoning + web_search tool-call tokens both count against
        // max_output_tokens before the visible answer does, so this needs a
        // lot of headroom. "low" effort keeps cost/latency down for a batch
        // job and is the lowest effort level OpenAI supports combined with
        // web_search (web_search rejects "minimal").
        max_output_tokens: 16000,
        reasoning: { effort: 'low' },
        tools: [{ type: 'web_search' }],
      }),
    })

    if (res.status === 429) {
      lastError = new Error(`OpenAI API -> 429: ${await res.text()}`)
      continue
    }
    if (!res.ok) {
      throw new Error(`OpenAI API -> ${res.status}: ${await res.text()}`)
    }

    return parseResponse((await res.json()) as ResponsesResult)
  }
  throw lastError ?? new Error('OpenAI API retries exhausted')
}

function parseResponse(result: ResponsesResult): string {
  if (result.status !== 'completed') {
    throw new Error(`OpenAI response did not complete: ${result.status} (${result.incomplete_details?.reason})`)
  }

  const text = result.output
    .filter((item): item is MessageItem => item.type === 'message')
    .flatMap((item) => item.content)
    .filter((block): block is OutputTextContent => block.type === 'output_text')
    .map((block) => block.text)
    .join('\n')

  if (!text) {
    throw new Error('OpenAI response completed but contained no output_text.')
  }
  return text
}

/** Extracts and parses the last ```json fenced block in `text`. Throws if none is found or it doesn't parse. */
export function extractJsonBlock<T>(text: string): T {
  // No \s* after "```json": a lazy [\s\S]*? right next to a whitespace-matching
  // quantifier is an overlapping-quantifier pattern (SonarCloud correctly flagged
  // super-linear backtracking risk on non-matching input) -- dropping it costs nothing
  // since JSON.parse already ignores the leading whitespace this would have skipped.
  const matches = [...text.matchAll(/```json([\s\S]*?)```/g)]
  if (matches.length === 0) {
    throw new Error(`No \`\`\`json block found in model response: ${text.slice(0, 500)}`)
  }
  return JSON.parse(matches[matches.length - 1][1]) as T
}
