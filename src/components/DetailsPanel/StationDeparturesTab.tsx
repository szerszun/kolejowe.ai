import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, StationDetails } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { getUpcomingDepartures } from "../../utils/departures";

interface StationDeparturesTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function StationDeparturesTab({ details, lines }: StationDeparturesTabProps) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!details) {
    return (
      <div className="tab-content">
        <p className="empty-state">{t("timetableEmpty")}</p>
      </div>
    );
  }

  const lineById = new Map(lines.map((line) => [line.id, line]));
  const departures = getUpcomingDepartures(details.timetable, now, 6);

  return (
    <div className="tab-content">
      <p className="departures-disclaimer">{t("departuresDisclaimer")}</p>

      {departures.length === 0 ? (
        <p className="empty-state">{t("departuresEmpty")}</p>
      ) : (
        <ul className="departure-list">
          {departures.map((departure) => {
            const line = lineById.get(departure.entry.lineId);
            return (
              <li key={departure.entry.id} className={`departure-card departure-card--${departure.status}`}>
                <div className="departure-card-header">
                  <span className="line-list-badge" style={{ backgroundColor: line ? getLineColor(line.id) : "#374151" }}>
                    {line?.number ?? departure.entry.lineId}
                  </span>
                  <strong className="departure-destination">{departure.entry.destination}</strong>
                  <span className={`badge badge--${departure.status}`}>
                    {departure.status === "cancelled"
                      ? t("departureStatusCancelled")
                      : departure.status === "delayed"
                        ? t("departureStatusDelayed", { minutes: departure.delayMinutes })
                        : t("departureStatusOnTime")}
                  </span>
                </div>
                <dl className="fact-grid fact-grid--compact">
                  <div>
                    <dt>{t("departureScheduled")}</dt>
                    <dd>{formatTime(departure.scheduledAt)}</dd>
                  </div>
                  {departure.actualAt && (
                    <div>
                      <dt>{t("departureActual")}</dt>
                      <dd>{formatTime(departure.actualAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("trainOperator")}</dt>
                    <dd>{departure.entry.operator}</dd>
                  </div>
                  <div>
                    <dt>{t("platformLabel")}</dt>
                    <dd>{departure.entry.platform}</dd>
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
