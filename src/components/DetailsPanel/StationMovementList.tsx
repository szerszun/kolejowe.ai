import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { getUpcomingMovements } from "../../utils/departures";

interface MovementEntry {
  id: string;
  time: string;
  lineId: string;
  operator: string;
  platform: string;
  daysOfOperation: "daily" | "weekdays" | "weekend";
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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const lineById = new Map(lines.map((line) => [line.id, line]));
  const movements = getUpcomingMovements(entries ?? [], now, 6);

  return (
    <div className="tab-content">
      <p className="departures-disclaimer">{disclaimer}</p>

      {movements.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="departure-list">
          {movements.map((movement) => {
            const line = lineById.get(movement.entry.lineId);
            return (
              <li key={movement.entry.id} className={`departure-card departure-card--${movement.status}`}>
                <div className="departure-card-header">
                  <span className="line-list-badge" style={{ backgroundColor: line ? getLineColor(line.id) : "#374151" }}>
                    {line?.number ?? movement.entry.lineId}
                  </span>
                  <strong className="departure-destination">{placeLabel(movement.entry)}</strong>
                  <span className={`badge badge--${movement.status}`}>
                    {movement.status === "cancelled"
                      ? t("departureStatusCancelled")
                      : movement.status === "delayed"
                        ? t("departureStatusDelayed", { minutes: movement.delayMinutes })
                        : t("departureStatusOnTime")}
                  </span>
                </div>
                <dl className="fact-grid fact-grid--compact">
                  <div>
                    <dt>{t("departureScheduled")}</dt>
                    <dd>{formatTime(movement.scheduledAt)}</dd>
                  </div>
                  {movement.actualAt && (
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
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
