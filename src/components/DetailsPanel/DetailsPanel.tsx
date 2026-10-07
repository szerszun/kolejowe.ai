import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import { STATUS_LABEL_KEY } from "../../utils/status";
import { getLineColor } from "../../utils/lineColors";
import { OverviewTab } from "./OverviewTab";
import { HistoryTab } from "./HistoryTab";
import { TendersTab } from "./TendersTab";

type Tab = "overview" | "history" | "tenders";

interface DetailsPanelProps {
  line: RailwayLine;
  onClose: () => void;
  onSelectStation: (id: string) => void;
}

export function DetailsPanel({ line, onClose, onSelectStation }: DetailsPanelProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <aside className="details-panel" aria-label={`${line.number} ${line.name}`}>
      <header className="details-panel-header">
        <div>
          <span className="line-badge" style={{ backgroundColor: getLineColor(line.id) }}>
            {line.number}
          </span>
          <h2>{line.name}</h2>
          <span className="status-label">{t(STATUS_LABEL_KEY[line.status])}</span>
        </div>
        <button type="button" className="icon-button" aria-label={t("close")} onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="tabs" role="tablist">
        {(["overview", "history", "tenders"] as Tab[]).map((tabId) => (
          <button
            key={tabId}
            role="tab"
            type="button"
            aria-selected={tab === tabId}
            className={`tab-button ${tab === tabId ? "tab-button--active" : ""}`}
            onClick={() => setTab(tabId)}
          >
            {t(tabId === "overview" ? "tabOverview" : tabId === "history" ? "tabHistory" : "tabTenders")}
          </button>
        ))}
      </div>

      <div className="details-panel-body">
        {tab === "overview" && <OverviewTab line={line} onSelectStation={onSelectStation} />}
        {tab === "history" && <HistoryTab line={line} />}
        {tab === "tenders" && <TendersTab line={line} />}
      </div>
    </aside>
  );
}
