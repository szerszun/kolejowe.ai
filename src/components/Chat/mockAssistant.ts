import type { Language, RailwayLine } from "../../types";
import { lines as allLines } from "../../data/lines";

export interface AssistantSource {
  label: string;
  url?: string;
}

export interface AssistantAnswer {
  text: string;
  sources: AssistantSource[];
  mentionedLineIds: string[];
}

/**
 * Stand-in for the real backend described in the spec ("How an answer is
 * made" — AI Assistant Chat: the user's query triggers a live lookup
 * against the Notion-backed database). This mock answers from the same
 * sample dataset using simple keyword matching so the chat UX (streaming,
 * citations, refusal-on-no-data, PL/EN) can be reviewed before the real
 * retrieval + LLM backend exists.
 */

const EN_MARKERS = ["the ", "what", "when", "which", "how ", "tender", "station", "open", "line "];
const PL_MARKERS = ["kiedy", "jak", "jaka", "jaki", "jakie", "linia", "linii", "stacj", "przetarg", "czy "];

export function detectQuestionLanguage(question: string, fallback: Language): Language {
  const q = question.toLowerCase();
  const enHits = EN_MARKERS.filter((m) => q.includes(m)).length;
  const plHits = PL_MARKERS.filter((m) => q.includes(m)).length;
  if (plHits > enHits) return "pl";
  if (enHits > plHits) return "en";
  return fallback;
}

function findMentionedLine(question: string, contextLineId: string | null): RailwayLine | undefined {
  const numberMatch = question.match(/\b\d{2,3}\b/);
  if (numberMatch) {
    const byNumber = allLines.find((l) => l.number === numberMatch[0]);
    if (byNumber) return byNumber;
  }
  const q = question.toLowerCase();
  const byStationOrName = allLines.find(
    (l) =>
      q.includes(l.name.toLowerCase()) ||
      l.stations.some((s) => q.includes(s.name.toLowerCase())) ||
      l.endStations.some((e) => q.includes(e.toLowerCase())),
  );
  if (byStationOrName) return byStationOrName;
  // Only fall back to the line the panel was opened from if the question is
  // actually railway-related — an off-topic question should still refuse
  // (AI-5), not silently answer about whatever line happens to be open.
  const RAIL_KEYWORDS = [
    "lini",
    "stacj",
    "przetarg",
    "histor",
    "elektryf",
    "tor",
    "km",
    "długo",
    "prędko",
    "kiedy",
    "otwar",
    "zamkn",
    "line",
    "station",
    "tender",
    "history",
    "electrif",
    "track",
    "length",
    "speed",
    "when",
  ];
  if (contextLineId && RAIL_KEYWORDS.some((k) => q.includes(k))) {
    return allLines.find((l) => l.id === contextLineId);
  }
  return undefined;
}

function overviewSource(line: RailwayLine): AssistantSource {
  const s = line.sources.find((s) => s.section === "overview");
  return { label: s ? `${s.label} (${s.lastUpdated})` : line.name };
}
function historySource(line: RailwayLine): AssistantSource {
  const s = line.sources.find((s) => s.section === "history");
  return { label: s ? `${s.label} (${s.lastUpdated})` : line.name };
}
function tendersSource(line: RailwayLine): AssistantSource {
  const s = line.sources.find((s) => s.section === "tenders");
  return { label: s ? `${s.label} (${s.lastUpdated})` : line.name, url: s?.url };
}

const noAnswer = (lang: Language): AssistantAnswer => ({
  text:
    lang === "pl"
      ? "Nie znalazłem w danych projektu odpowiedzi na to pytanie. Sprawdź zakładkę „Informacje” lub „Przetargi” wybranej linii, albo doprecyzuj pytanie (np. podaj numer linii)."
      : "I couldn't find an answer to that in the project's data. Try the line's Overview or Tenders tab, or rephrase your question (e.g. include a line number).",
  sources: [],
  mentionedLineIds: [],
});

export function answerQuestion(question: string, lang: Language, contextLineId: string | null): AssistantAnswer {
  const q = question.toLowerCase();
  const line = findMentionedLine(question, contextLineId);

  // Cross-line query: tenders closing "this month"
  if (!line && (q.includes("przetarg") || q.includes("tender"))) {
    const open = allLines.flatMap((l) => l.tenders.filter((t) => t.status === "open").map((t) => ({ l, t })));
    if (open.length === 0) return noAnswer(lang);
    const text =
      lang === "pl"
        ? `Otwarte przetargi znalezione w danych projektu: ${open
            .map(({ l, t }) => `linia ${l.number} — „${t.title}” (termin: ${t.deadline ?? "brak danych"})`)
            .join("; ")}.`
        : `Open tenders found in the project's data: ${open
            .map(({ l, t }) => `line ${l.number} — "${t.title}" (deadline: ${t.deadline ?? "n/a"})`)
            .join("; ")}.`;
    return { text, sources: open.map(({ l }) => tendersSource(l)), mentionedLineIds: open.map(({ l }) => l.id) };
  }

  if (!line) return noAnswer(lang);

  if (q.includes("elektryf") || q.includes("electrif")) {
    const text = line.electrified
      ? lang === "pl"
        ? `Linia ${line.number} (${line.name}) jest zelektryfikowana.`
        : `Line ${line.number} (${line.name}) is electrified.`
      : lang === "pl"
        ? `Linia ${line.number} (${line.name}) nie jest zelektryfikowana.`
        : `Line ${line.number} (${line.name}) is not electrified.`;
    return { text, sources: [overviewSource(line)], mentionedLineIds: [line.id] };
  }

  if (q.includes("kiedy") || q.includes("otwar") || q.includes("histor") || q.includes("when") || q.includes("history") || q.includes("opened")) {
    const opened = line.history.timeline[0];
    const text =
      lang === "pl"
        ? `Linia ${line.number} (${line.name}): ${opened ? `${opened.label.toLowerCase()} w ${opened.year} r.` : "brak daty otwarcia w danych"}. ${line.history.narrative.slice(0, 220)}…`
        : `Line ${line.number} (${line.name}): ${opened ? `${opened.label.toLowerCase()} in ${opened.year}` : "no opening date in the data"}. ${line.history.narrative.slice(0, 220)}…`;
    return { text, sources: [historySource(line)], mentionedLineIds: [line.id] };
  }

  if (q.includes("przetarg") || q.includes("tender")) {
    const open = line.tenders.filter((t) => t.status === "open");
    if (open.length === 0) {
      const src = line.sources.find((s) => s.section === "tenders");
      const text =
        lang === "pl"
          ? `Brak otwartych przetargów dla linii ${line.number} (stan na ${src?.lastUpdated ?? "brak danych"}).`
          : `No open tenders found for line ${line.number} as of ${src?.lastUpdated ?? "n/a"}.`;
      return { text, sources: src ? [tendersSource(line)] : [], mentionedLineIds: [line.id] };
    }
    const text =
      lang === "pl"
        ? `Dla linii ${line.number} znalazłem ${open.length} otwarty(ch) przetarg(ów): ${open.map((t) => `„${t.title}” (termin: ${t.deadline})`).join("; ")}.`
        : `For line ${line.number} I found ${open.length} open tender(s): ${open.map((t) => `"${t.title}" (deadline: ${t.deadline})`).join("; ")}.`;
    return { text, sources: [tendersSource(line)], mentionedLineIds: [line.id] };
  }

  if (q.includes("stacj") || q.includes("station")) {
    const text =
      lang === "pl"
        ? `Linia ${line.number} obsługuje stacje: ${line.stations.map((s) => s.name).join(", ")}.`
        : `Line ${line.number} serves the following stations: ${line.stations.map((s) => s.name).join(", ")}.`;
    return { text, sources: [overviewSource(line)], mentionedLineIds: [line.id] };
  }

  if (q.includes("długo") || q.includes("length") || q.includes("km")) {
    const text =
      lang === "pl"
        ? `Linia ${line.number} (${line.name}) ma długość ${line.lengthKm.toFixed(1)} km.`
        : `Line ${line.number} (${line.name}) is ${line.lengthKm.toFixed(1)} km long.`;
    return { text, sources: [overviewSource(line)], mentionedLineIds: [line.id] };
  }

  // Generic fallback: give an overview summary for the identified line
  const text =
    lang === "pl"
      ? `Linia ${line.number} (${line.name}) łączy ${line.endStations[0]} i ${line.endStations[1]}, ma ${line.lengthKm.toFixed(1)} km i status: ${line.status.replace("_", " ")}.`
      : `Line ${line.number} (${line.name}) connects ${line.endStations[0]} and ${line.endStations[1]}, is ${line.lengthKm.toFixed(1)} km long, status: ${line.status.replace("_", " ")}.`;
  return { text, sources: [overviewSource(line)], mentionedLineIds: [line.id] };
}
