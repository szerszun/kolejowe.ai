import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, Station, StationDetails } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { SourceFooter } from "./SourceFooter";

interface StationOverviewTabProps {
  station: Station;
  servingLines: RailwayLine[];
  details: StationDetails | undefined;
  onSelectLine: (id: string) => void;
}

export function StationOverviewTab({ station, servingLines, details, onSelectLine }: StationOverviewTabProps) {
  const { t } = useI18n();

  return (
    <div className="tab-content">
      {details?.photo ? (
        <figure className="station-photo-figure">
          <img className="station-photo" src={details.photo.url} alt={station.name} loading="lazy" />
          <figcaption className="photo-credit">{details.photo.credit}</figcaption>
        </figure>
      ) : (
        <div className="station-photo station-photo--placeholder">{t("stationPhotoNone")}</div>
      )}

      {details && (
        <dl className="fact-grid">
          {details.category && (
            <div>
              <dt>{t("stationCategory")}</dt>
              <dd>{details.category}</dd>
            </div>
          )}
          {details.address && (
            <div>
              <dt>{t("stationAddress")}</dt>
              <dd>{details.address}</dd>
            </div>
          )}
          {details.yearBuilt && (
            <div>
              <dt>{t("stationYearBuilt")}</dt>
              <dd>{details.yearBuilt}</dd>
            </div>
          )}
          {details.platformCount != null && (
            <div>
              <dt>{t("stationPlatformCount")}</dt>
              <dd>{details.platformCount}</dd>
            </div>
          )}
        </dl>
      )}

      {details?.accessibility && (
        <>
          <h3>{t("stationAccessibility")}</h3>
          <p>{details.accessibility}</p>
        </>
      )}

      {details && details.amenities.length > 0 && (
        <>
          <h3>{t("stationAmenities")}</h3>
          <ul className="amenity-list">
            {details.amenities.map((amenity) => (
              <li key={amenity}>{amenity}</li>
            ))}
          </ul>
        </>
      )}

      {!details && <p className="empty-state">{t("stationOverviewNoDetails")}</p>}

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

      {details?.sources[0] && <SourceFooter source={details.sources[0]} />}
    </div>
  );
}
