import { useMemo, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useTimetableInfo } from "../../hooks/useTimetableInfo";
import type { DaysOfOperation, RailwayLine, StationDetails } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { normalize } from "../../utils/text";
import { TimetableValidityBanner } from "./TimetableValidityBanner";

const DAYS_KEY: Record<DaysOfOperation, "timetableDaily" | "timetableWeekdays" | "timetableWeekend" | "timetableOther"> = {
  daily: "timetableDaily",
  weekdays: "timetableWeekdays",
  weekend: "timetableWeekend",
  other: "timetableOther",
};

interface StationTimetableTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
}

export function StationTimetableTab({ details, lines }: StationTimetableTabProps) {
  const { t } = useI18n();
  const timetableInfo = useTimetableInfo();
  const [query, setQuery] = useState("");

  const lineById = useMemo(() => new Map(lines.map((line) => [line.id, line])), [lines]);

  const sorted = useMemo(() => {
    const all = [...(details?.timetable ?? [])].sort((a, b) => a.time.localeCompare(b.time));
    const q = normalize(query.trim());
    if (!q) return all;
    return all.filter((entry) => {
      const line = lineById.get(entry.lineId);
      const haystack = [entry.destination, entry.operator, entry.lineId, line?.number, entry.trainNumber, entry.trainName].filter(
        Boolean,
      ) as string[];
      return haystack.some((h) => normalize(h).includes(q));
    });
  }, [details, query, lineById]);

  if (!details || details.timetable.length === 0) {
    return (
      <div className="tab-content">
        <TimetableValidityBanner info={timetableInfo} />
        <p className="empty-state">{t("timetableEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <TimetableValidityBanner info={timetableInfo} />
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
                <span className="timetable-destination">
                  {entry.destination}
                  {(entry.trainName || entry.trainNumber) && (
                    <span className="timetable-train">
                      {" "}
                      ({[entry.trainName, entry.trainNumber].filter(Boolean).join(" ")})
                    </span>
                  )}
                </span>
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
