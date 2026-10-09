import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useTimetableInfo } from "../../hooks/useTimetableInfo";
import type { DaysOfOperation, RailwayLine } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { getUpcomingMovements } from "../../utils/departures";
import { TimetableValidityBanner } from "./TimetableValidityBanner";

interface MovementEntry {
  id: string;
  time: string;
  lineId: string;
  operator: string;
  platform: string;
  daysOfOperation: DaysOfOperation;
  trainNumber?: string;
  trainName?: string;
}

interface StationMovementListProps<T extends MovementEntry> {
  entries: T[] | undefined;
  lines: RailwayLine[];
  placeLabel: (entry: T) => string;
  disclaimer: string;
  emptyMessage: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function StationMovementList<T extends MovementEntry>({
  entries,
  lines,
  placeLabel,
  disclaimer,
  emptyMessage,
}: StationMovementListProps<T>) {
  const { t } = useI18n();
  const timetableInfo = useTimetableInfo();
  const [now, setNow] = useState(() => new Date());
  // Defaults to the static timetable until a real PKP PLK realtime feed replaces the mocked
  // status in getUpcomingMovements -- flip this default to false once that's live.
  const [timetableTimeOnly, setTimetableTimeOnly] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const lineById = new Map(lines.map((line) => [line.id, line]));
  const movements = getUpcomingMovements(entries ?? [], now, 6);

  return (
    <div className="tab-content">
      <TimetableValidityBanner info={timetableInfo} />
      <p className="departures-disclaimer">{timetableTimeOnly ? t("timetableTimeDisclaimer") : disclaimer}</p>
      <label className="checkbox-row checkbox-row--spaced">
        <input type="checkbox" checked={timetableTimeOnly} onChange={(e) => setTimetableTimeOnly(e.target.checked)} />
        {t("timetableTimeCheckbox")}
      </label>

      {movements.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="departure-list">
          {movements.map((movement) => {
            const line = lineById.get(movement.entry.lineId);
            const cardStatus = timetableTimeOnly ? "on_time" : movement.status;
            return (
              <li key={movement.entry.id} className={`departure-card departure-card--${cardStatus}`}>
                <div className="departure-card-header">
                  <span className="line-list-badge" style={{ backgroundColor: line ? getLineColor(line.id) : "#374151" }}>
                    {line?.number ?? movement.entry.lineId}
                  </span>
                  <strong className="departure-destination">{placeLabel(movement.entry)}</strong>
                  {!timetableTimeOnly && (
                    <span className={`badge badge--${movement.status}`}>
                      {movement.status === "cancelled"
                        ? t("departureStatusCancelled")
                        : movement.status === "delayed"
                          ? t("departureStatusDelayed", { minutes: movement.delayMinutes })
                          : t("departureStatusOnTime")}
                    </span>
                  )}
                </div>
                <dl className="fact-grid fact-grid--compact">
                  <div>
                    <dt>{t("departureScheduled")}</dt>
                    <dd>{formatTime(movement.scheduledAt)}</dd>
                  </div>
                  {!timetableTimeOnly && movement.actualAt && (
                    <div>
                      <dt>{t("departureActual")}</dt>
                      <dd>{formatTime(movement.actualAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("trainOperator")}</dt>
                    <dd>{movement.entry.operator}</dd>
                  </div>
                  <div>
                    <dt>{t("platformLabel")}</dt>
                    <dd>{movement.entry.platform}</dd>
                  </div>
                  {(movement.entry.trainName || movement.entry.trainNumber) && (
                    <div>
                      <dt>{t("trainNumberLabel")}</dt>
                      <dd>{[movement.entry.trainName, movement.entry.trainNumber].filter(Boolean).join(" ")}</dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
