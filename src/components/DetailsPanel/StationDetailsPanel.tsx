import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, Station } from "../../types";
import { useStationDetails } from "../../hooks/useStationDetails";
import { StationOverviewTab } from "./StationOverviewTab";
import { StationTimetableTab } from "./StationTimetableTab";
import { StationDeparturesTab } from "./StationDeparturesTab";
import { StationArrivalsTab } from "./StationArrivalsTab";

type Tab = "overview" | "timetable" | "arrivals" | "departures";

const TAB_LABEL_KEY: Record<Tab, "tabOverview" | "tabTimetable" | "tabArrivals" | "tabDepartures"> = {
  overview: "tabOverview",
  timetable: "tabTimetable",
  arrivals: "tabArrivals",
  departures: "tabDepartures",
};

interface StationDetailsPanelProps {
  station: Station;
  servingLines: RailwayLine[];
  onClose: () => void;
  onSelectLine: (id: string) => void;
}

export function StationDetailsPanel({ station, servingLines, onClose, onSelectLine }: StationDetailsPanelProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const { details, loading, error } = useStationDetails(station.id);

  return (
    <aside className="details-panel" aria-label={station.name}>
      <header className="details-panel-header">
        <div>
          <h2>{station.name}</h2>
        </div>
        <button type="button" className="icon-button" aria-label={t("close")} onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="tabs" role="tablist">
        {(["overview", "arrivals", "departures", "timetable"] as Tab[]).map((tabId) => (
          <button
            key={tabId}
            role="tab"
            type="button"
            aria-selected={tab === tabId}
            className={`tab-button ${tab === tabId ? "tab-button--active" : ""}`}
            onClick={() => setTab(tabId)}
          >
            {t(TAB_LABEL_KEY[tabId])}
          </button>
        ))}
      </div>

      <div className="details-panel-body">
        {tab === "overview" && (
          <StationOverviewTab
            station={station}
            servingLines={servingLines}
            details={details}
            loading={loading}
            error={error}
            onSelectLine={onSelectLine}
          />
        )}
        {tab === "timetable" && <StationTimetableTab details={details} lines={servingLines} loading={loading} error={error} />}
        {tab === "arrivals" && <StationArrivalsTab details={details} lines={servingLines} loading={loading} error={error} />}
        {tab === "departures" && <StationDeparturesTab details={details} lines={servingLines} loading={loading} error={error} />}
      </div>
    </aside>
  );
}
