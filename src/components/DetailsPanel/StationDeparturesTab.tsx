import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, StationDetails } from "../../types";
import { StationMovementList } from "./StationMovementList";

interface StationDeparturesTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
}

export function StationDeparturesTab({ details, lines }: StationDeparturesTabProps) {
  const { t } = useI18n();

  if (!details) {
    return (
      <div className="tab-content">
        <p className="empty-state">{t("timetableEmpty")}</p>
      </div>
    );
  }

  return (
    <StationMovementList
      entries={details.timetable}
      lines={lines}
      placeLabel={(entry) => entry.destination}
      disclaimer={t("departuresDisclaimer")}
      emptyMessage={t("departuresEmpty")}
    />
  );
}
