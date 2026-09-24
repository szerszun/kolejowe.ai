import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import type { FilterState } from "../../hooks/useLineFilters";
import { ALL_STATUSES, STATUS_COLORS, STATUS_LABEL_KEY } from "../../utils/status";

interface ExplorerPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  filteredLines: RailwayLine[];
  selectedLineId: string | null;
  onSelectLine: (id: string) => void;
}

export function ExplorerPanel({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  filteredLines,
  selectedLineId,
  onSelectLine,
}: ExplorerPanelProps) {
  const { t } = useI18n();

  const toggleStatus = (status: (typeof ALL_STATUSES)[number]) => {
    const next = new Set(filters.statuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onFiltersChange({ ...filters, statuses: next });
  };

  return (
    <div className="explorer-panel">
      <label className="visually-hidden" htmlFor="line-search">
        {t("searchPlaceholder")}
      </label>
      <input
        id="line-search"
        type="search"
        className="search-input"
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <fieldset className="filters">
        <legend>{t("filters")}</legend>
        <div className="filter-chips">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={`chip ${filters.statuses.has(status) ? "chip--active" : ""}`}
              style={{ borderColor: STATUS_COLORS[status] }}
              aria-pressed={filters.statuses.has(status)}
              onClick={() => toggleStatus(status)}
            >
              <span className="chip-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
              {t(STATUS_LABEL_KEY[status])}
            </button>
          ))}
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={filters.electrifiedOnly}
            onChange={(e) => onFiltersChange({ ...filters, electrifiedOnly: e.target.checked })}
          />
          {t("filterElectrified")}
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={filters.hasTendersOnly}
            onChange={(e) => onFiltersChange({ ...filters, hasTendersOnly: e.target.checked })}
          />
          {t("filterHasTenders")}
        </label>
      </fieldset>

      <div className="line-list-header">{t("resultsCount", { count: filteredLines.length })}</div>
      <ul className="line-list" role="listbox" aria-label={t("listViewToggle")}>
        {filteredLines.map((line) => (
          <li key={line.id}>
            <button
              type="button"
              role="option"
              aria-selected={line.id === selectedLineId}
              className={`line-list-item ${line.id === selectedLineId ? "line-list-item--active" : ""}`}
              onClick={() => onSelectLine(line.id)}
            >
              <span className="line-list-badge" style={{ backgroundColor: STATUS_COLORS[line.status] }}>
                {line.number}
              </span>
              <span className="line-list-text">
                <strong>{line.name}</strong>
              </span>
            </button>
          </li>
        ))}
        {filteredLines.length === 0 && <li className="line-list-empty">{t("noStationsSearchResult")}</li>}
      </ul>
    </div>
  );
}
