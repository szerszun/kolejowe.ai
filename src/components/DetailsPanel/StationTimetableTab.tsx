import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { DaysOfOperation, RailwayLine, StationDetails } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { normalize } from "../../utils/text";

const DAYS_KEY: Record<DaysOfOperation, "timetableDaily" | "timetableWeekdays" | "timetableWeekend"> = {
  daily: "timetableDaily",
  weekdays: "timetableWeekdays",
  weekend: "timetableWeekend",
};

interface StationTimetableTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
}

export function StationTimetableTab({ details, lines }: StationTimetableTabProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const lineById = useMemo(() => new Map(lines.map((line) => [line.id, line])), [lines]);

  const sorted = useMemo(() => {
    const all = [...(details?.timetable ?? [])].sort((a, b) => a.time.localeCompare(b.time));
    const q = normalize(query.trim());
    if (!q) return all;
    return all.filter((entry) => {
      const line = lineById.get(entry.lineId);
      const haystack = [entry.destination, entry.operator, entry.lineId, line?.number].filter(Boolean) as string[];
      return haystack.some((h) => normalize(h).includes(q));
    });
  }, [details, query, lineById]);

  if (!details || details.timetable.length === 0) {
    return (
      <div className="tab-content">
        <p className="empty-state">{t("timetableEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <label className="visually-hidden" htmlFor="timetable-search">
        {t("timetableSearchPlaceholder")}
      </label>
      <input
        id="timetable-search"
        type="search"
        className="search-input"
        placeholder={t("timetableSearchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {sorted.length === 0 ? (
        <p className="empty-state">{t("timetableSearchNoResults")}</p>
      ) : (
        <ul className="timetable-list">
          {sorted.map((entry) => {
            const line = lineById.get(entry.lineId);
            return (
              <li key={entry.id} className="timetable-row">
                <span className="timetable-time">{entry.time}</span>
                <span className="line-list-badge" style={{ backgroundColor: line ? getLineColor(line.id) : "#374151" }}>
                  {line?.number ?? entry.lineId}
                </span>
                <span className="timetable-destination">{entry.destination}</span>
                <span className="timetable-meta">
                  {entry.operator} · {t("departurePlatformShort", { platform: entry.platform })} · {t(DAYS_KEY[entry.daysOfOperation])}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
