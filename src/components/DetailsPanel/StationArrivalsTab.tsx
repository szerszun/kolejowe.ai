import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, StationDetails } from "../../types";
import { StationMovementList } from "./StationMovementList";
import { StationDataStatus } from "./StationDataStatus";

interface StationArrivalsTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
  loading: boolean;
  error: boolean;
}

export function StationArrivalsTab({ details, lines, loading, error }: StationArrivalsTabProps) {
  const { t } = useI18n();

  if (!details) {
    return (
      <div className="tab-content">
        <StationDataStatus loading={loading} error={error} />
        {!loading && !error && <p className="empty-state">{t("timetableEmpty")}</p>}
      </div>
    );
  }

  return (
    <StationMovementList
      stationId={details.stationId}
      kind="arrival"
      entries={details.arrivals}
      lines={lines}
      placeLabel={(entry) => entry.origin}
      disclaimer={t("arrivalsDisclaimer")}
      emptyMessage={t("arrivalsEmpty")}
    />
  );
}
