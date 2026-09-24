import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, Station } from "../../types";
import { getLineColor } from "../../utils/lineColors";

interface StationDetailsPanelProps {
  station: Station;
  servingLines: RailwayLine[];
  onClose: () => void;
  onSelectLine: (id: string) => void;
}

export function StationDetailsPanel({ station, servingLines, onClose, onSelectLine }: StationDetailsPanelProps) {
  const { t } = useI18n();

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

      <div className="details-panel-body">
        <h3>{t("stationPanelLinesTitle")}</h3>
        <ul className="line-list" role="listbox" aria-label={t("stationPanelLinesTitle")}>
          {servingLines.map((line) => (
            <li key={line.id}>
              <button type="button" role="option" className="line-list-item" onClick={() => onSelectLine(line.id)}>
                <span className="line-list-badge" style={{ backgroundColor: getLineColor(line.id) }}>
                  {line.number}
                </span>
                <span className="line-list-text">
                  <strong>{line.name}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="empty-state" style={{ marginTop: "1.4rem" }}>
          {t("stationPanelNoData")}
        </p>
      </div>
    </aside>
  );
}
