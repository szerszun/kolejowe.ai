import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { useTimetableInfo } from "../../hooks/useTimetableInfo";
import { useLiveMovements } from "../../hooks/useLiveMovements";
import type { DaysOfOperation, RailwayLine } from "../../types";
import { getContrastingTextColor, getLineColor } from "../../utils/lineColors";
import { applyLiveData, getUpcomingMovements } from "../../utils/departures";
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
  stationId: string;
  kind: "departure" | "arrival";
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
  stationId,
  kind,
  entries,
  lines,
  placeLabel,
  disclaimer,
  emptyMessage,
}: StationMovementListProps<T>) {
  const { t } = useI18n();
  const timetableInfo = useTimetableInfo();
  const [now, setNow] = useState(() => new Date());
  // Defaults to the live PKP PLK feed; stations without a match (or when the feed is
  // down) fall back to the static timetable automatically -- see liveServiceDown below.
  const [timetableTimeOnly, setTimetableTimeOnly] = useState(false);
  const { movements: liveMovements, reason: liveUnavailableReason } = useLiveMovements(stationId, !timetableTimeOnly);
  // The live feed is down (quota exhausted or the PKP PLK API itself didn't respond) rather than
  // just "this station has no PKP PLK match" -- fall back to plain timetable display and say why.
  const liveServiceDown = !timetableTimeOnly && (liveUnavailableReason === "rate_limited" || liveUnavailableReason === "upstream_error");
  const effectiveTimetableOnly = timetableTimeOnly || liveServiceDown;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const lineById = new Map(lines.map((line) => [line.id, line]));
  const baseMovements = getUpcomingMovements(entries ?? [], now, 6);
  const movements =
    !effectiveTimetableOnly && liveMovements ? applyLiveData(baseMovements, liveMovements, kind) : baseMovements;

  return (
    <div className="tab-content">
      <TimetableValidityBanner info={timetableInfo} />
      {liveServiceDown ? (
        <p className="live-unavailable-banner">{t("liveUnavailableWarning")}</p>
      ) : (
        <p className="departures-disclaimer">{timetableTimeOnly ? t("timetableTimeDisclaimer") : disclaimer}</p>
      )}
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
            // Only a live-matched entry has an actual status claim to make -- an unmatched entry in
            // live view gets neutral styling rather than an implied (fabricated) "on time".
            const showStatus = !effectiveTimetableOnly && movement.isLive;
            const cardStatus = showStatus ? movement.status : "on_time";
            const badgeColor = line ? getLineColor(line.id) : "#374151";
            return (
              <li key={movement.entry.id} className={`departure-card departure-card--${cardStatus}`}>
                <div className="departure-card-header">
                  <span className="line-list-badge" style={{ backgroundColor: badgeColor, color: getContrastingTextColor(badgeColor) }}>
                    {line?.number ?? movement.entry.lineId}
                  </span>
                  <strong className="departure-destination">{placeLabel(movement.entry)}</strong>
                  {showStatus && <span className="live-tag">{t("liveSourceTag")}</span>}
                  {showStatus && (
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
                  {!effectiveTimetableOnly && movement.actualAt && (
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
