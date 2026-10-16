import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, StationDetails } from "../../types";
import { StationMovementList } from "./StationMovementList";
import { StationDataStatus } from "./StationDataStatus";

interface StationDeparturesTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
  loading: boolean;
  error: boolean;
}

export function StationDeparturesTab({ details, lines, loading, error }: StationDeparturesTabProps) {
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
      kind="departure"
      entries={details.timetable}
      lines={lines}
      placeLabel={(entry) => entry.destination}
      disclaimer={t("departuresDisclaimer")}
      emptyMessage={t("departuresEmpty")}
      searchPlaceholder={t("departuresSearchPlaceholder")}
    />
  );
}
