import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, StationDetails } from "../../types";
import { StationMovementList } from "./StationMovementList";

interface StationArrivalsTabProps {
  details: StationDetails | undefined;
  lines: RailwayLine[];
}

export function StationArrivalsTab({ details, lines }: StationArrivalsTabProps) {
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
      entries={details.arrivals}
      lines={lines}
      placeLabel={(entry) => entry.origin}
      disclaimer={t("arrivalsDisclaimer")}
      emptyMessage={t("arrivalsEmpty")}
    />
  );
}
