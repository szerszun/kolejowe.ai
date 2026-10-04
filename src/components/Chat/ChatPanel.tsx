import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import { answerQuestion, detectQuestionLanguage, type AssistantSource } from "./mockAssistant";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: AssistantSource[];
  streaming?: boolean;
}

const RATE_LIMIT_PER_HOUR = 30;
const TIMESTAMPS_KEY = "kolejowe-chat-timestamps";
const MESSAGES_KEY = "kolejowe-chat-messages";

function loadTimestamps(): number[] {
  try {
    return JSON.parse(sessionStorage.getItem(TIMESTAMPS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function recentTimestamps(): number[] {
  const cutoff = Date.now() - 60 * 60 * 1000;
  return loadTimestamps().filter((ts) => ts > cutoff);
}

function loadMessages(): ChatMessage[] {
  try {
    return JSON.parse(sessionStorage.getItem(MESSAGES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function suggestedQuestions(line: RailwayLine, lang: "pl" | "en"): string[] {
  return lang === "pl"
    ? [
        `Kiedy linia ${line.number} została otwarta?`,
        `Czy linia ${line.number} jest zelektryfikowana?`,
        `Jakie przetargi dotyczą linii ${line.number}?`,
        `Jakie stacje obsługuje linia ${line.number}?`,
      ]
    : [
        `When was line ${line.number} opened?`,
        `Is line ${line.number} electrified?`,
        `Which tenders affect line ${line.number}?`,
        `Which stations does line ${line.number} serve?`,
      ];
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextLine: RailwayLine | null;
  onClearContext: () => void;
  onHighlightLines: (ids: string[]) => void;
  lines: RailwayLine[];
}

export function ChatPanel({ isOpen, onClose, contextLine, onClearContext, onHighlightLines, lines }: ChatPanelProps) {
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
  }, []);

  const send = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const recent = recentTimestamps();
    if (recent.length >= RATE_LIMIT_PER_HOUR) {
      setRateLimited(true);
      return;
    }
    sessionStorage.setItem(TIMESTAMPS_KEY, JSON.stringify([...recent, Date.now()]));
    setRateLimited(false);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    const answer = answerQuestion(lines, text, detectQuestionLanguage(text, language), contextLine?.id ?? null);
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", text: "", sources: answer.sources, streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    if (answer.mentionedLineIds.length > 0) onHighlightLines(answer.mentionedLineIds);

    let i = 0;
    const full = answer.text;
    streamTimer.current = setInterval(() => {
      i += Math.max(1, Math.round(full.length / 60));
      const chunk = full.slice(0, i);
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: chunk } : m)));
      if (i >= full.length) {
        if (streamTimer.current) clearInterval(streamTimer.current);
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
      }
    }, 24);
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel" role="dialog" aria-label={t("chatTitle")}>
      <header className="chat-panel-header">
        <strong>{t("chatTitle")}</strong>
        <button type="button" className="icon-button" aria-label={t("close")} onClick={onClose}>
          ✕
        </button>
      </header>

      {contextLine && (
        <div className="chat-context-bar">
          <span>{t("chatAboutLine", { number: contextLine.number, name: contextLine.name })}</span>
          <button type="button" className="link-button" onClick={onClearContext}>
            {t("chatClearContext")}
          </button>
        </div>
      )}

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && <p className="chat-empty-state">{t("chatEmptyState")}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-message chat-message--${m.role}`}>
            <p>
              {m.text}
              {m.streaming && <span className="cursor-blink">▍</span>}
            </p>
            {!m.streaming && m.sources && m.sources.length > 0 && (
              <div className="chat-sources">
                <span>{t("chatSources")}:</span>
                <ul>
                  {m.sources.map((s, idx) => (
                    <li key={idx}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      ) : (
                        s.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {contextLine && messages.length === 0 && (
        <div className="chat-suggestions">
          <span>{t("chatSuggested")}:</span>
          {suggestedQuestions(contextLine, language).map((q) => (
            <button key={q} type="button" className="chip" onClick={() => send(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {rateLimited && <p className="chat-rate-limited">{t("chatRateLimited")}</p>}

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatInputPlaceholder")}
          aria-label={t("chatInputPlaceholder")}
        />
        <button type="submit" className="primary-button">
          {t("chatSend")}
        </button>
      </form>
      <p className="chat-disclaimer">{t("chatDisclaimer")}</p>
    </div>
  );
}
