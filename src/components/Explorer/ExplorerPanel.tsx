import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import type { FilterState } from "../../hooks/useLineFilters";
import type { StationEntry } from "../../utils/stations";
import { ALL_STATUSES, STATUS_COLORS, STATUS_LABEL_KEY } from "../../utils/status";
import { getContrastingTextColor, getLineColor } from "../../utils/lineColors";
import { StationIcon } from "./StationIcon";

interface ExplorerPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  filteredLines: RailwayLine[];
  filteredStations: StationEntry[];
  selectedLineId: string | null;
  selectedStationId: string | null;
  onSelectLine: (id: string) => void;
  onSelectStation: (id: string) => void;
}

export function ExplorerPanel({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  filteredLines,
  filteredStations,
  selectedLineId,
  selectedStationId,
  onSelectLine,
  onSelectStation,
}: ExplorerPanelProps) {
  const { t } = useI18n();
  const isSearching = query.trim().length > 0;
  // Mobile-only state (see .explorer-panel's bottom-sheet rules under
  // @media max-width: 760px -- the handle that toggles this is display:none above that
  // breakpoint, so this never becomes true on desktop).
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapse the sheet on selection so it doesn't sit open underneath the details sheet
  // that then opens on top of it. Selecting via a map tap instead of this list can't
  // happen while expanded -- the backdrop below covers the map the whole time.
  const selectLine = (id: string) => {
    onSelectLine(id);
    setIsExpanded(false);
  };
  const selectStation = (id: string) => {
    onSelectStation(id);
    setIsExpanded(false);
  };

  const toggleStatus = (status: (typeof ALL_STATUSES)[number]) => {
    const next = new Set(filters.statuses);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    onFiltersChange({ ...filters, statuses: next });
  };

  return (
    <>
      {isExpanded && (
        <button type="button" className="explorer-backdrop" aria-label={t("close")} onClick={() => setIsExpanded(false)} />
      )}
      <div className={`explorer-panel ${isExpanded ? "explorer-panel--expanded" : ""}`}>
        <button type="button" className="explorer-handle" aria-expanded={isExpanded} onClick={() => setIsExpanded((e) => !e)}>
          <span className="explorer-handle-grip" aria-hidden="true" />
          <span>{t("resultsCountLines", { count: filteredLines.length })}</span>
        </button>

        <div className="explorer-body">
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

          <div className="results-scroll">
            <div className="line-list-header">{t("resultsCountLines", { count: filteredLines.length })}</div>
            <ul className="line-list" role="listbox" aria-label={t("listViewToggle")}>
              {filteredLines.map((line) => {
                const badgeColor = getLineColor(line.id);
                return (
                  // role="presentation" -- a <ul role="listbox"> may only contain role="option"
                  // (or role="group") children per ARIA; this <li> is purely a styling wrapper
                  // around the actual option button, so it must be removed from the a11y tree
                  // rather than present an unlabeled, context-less "listitem" of its own.
                  <li key={line.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={line.id === selectedLineId}
                      className={`line-list-item ${line.id === selectedLineId ? "line-list-item--active" : ""}`}
                      onClick={() => selectLine(line.id)}
                    >
                      <span
                        className="line-list-badge"
                        style={{ backgroundColor: badgeColor, color: getContrastingTextColor(badgeColor) }}
                      >
                        {line.number}
                      </span>
                      <span className="line-list-text">
                        <strong>{line.name}</strong>
                      </span>
                    </button>
                  </li>
                );
              })}
              {filteredLines.length === 0 && (
                <li className="line-list-empty" role="presentation">
                  {t("noStationsSearchResult")}
                </li>
              )}
            </ul>

            {isSearching && (
              <>
                <div className="line-list-header line-list-header--stations">
                  {t("resultsCountStations", { count: filteredStations.length })}
                </div>
                <ul className="line-list" role="listbox" aria-label={t("stationsSectionTitle")}>
                  {filteredStations.map((station) => (
                    <li key={station.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={station.id === selectedStationId}
                        className={`line-list-item ${station.id === selectedStationId ? "line-list-item--active" : ""}`}
                        onClick={() => selectStation(station.id)}
                      >
                        <span className="station-list-badge">
                          <StationIcon />
                        </span>
                        <span className="line-list-text">
                          <strong>{station.name}</strong>
                        </span>
                      </button>
                    </li>
                  ))}
                  {filteredStations.length === 0 && (
                    <li className="line-list-empty" role="presentation">
                      {t("noStationsSearchResult")}
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
