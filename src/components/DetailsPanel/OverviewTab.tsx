import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine } from "../../types";
import { SourceFooter } from "./SourceFooter";

interface OverviewTabProps {
  line: RailwayLine;
  onSelectStation: (id: string) => void;
}

export function OverviewTab({ line, onSelectStation }: OverviewTabProps) {
  const { t } = useI18n();
  const source = line.sources.find((s) => s.section === "overview");

  return (
    <div className="tab-content">
      {line.manuallyCurated && <div className="badge badge--info">{t("manuallyCurated")}</div>}
      <dl className="fact-grid">
        <div>
          <dt>{t("endStations")}</dt>
          <dd>
            {line.endStations[0]} – {line.endStations[1]}
          </dd>
        </div>
        <div>
          <dt>{t("lengthKm")}</dt>
          <dd>{line.lengthKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>{t("tracks")}</dt>
          <dd>{line.tracks}</dd>
        </div>
        <div>
          <dt>{t("electrification")}</dt>
          <dd>{line.electrified ? t("yes") : t("no")}</dd>
        </div>
        <div>
          <dt>{t("maxSpeed")}</dt>
          <dd>{line.maxSpeedKmh > 0 ? `${line.maxSpeedKmh} km/h` : "—"}</dd>
        </div>
        <div>
          <dt>{t("operators")}</dt>
          <dd>{line.operators.join(", ")}</dd>
        </div>
        <div>
          <dt>{t("passengerServices")}</dt>
          <dd>{line.passengerServices.length > 0 ? line.passengerServices.join(", ") : "—"}</dd>
        </div>
      </dl>

      <h3>{t("stations")}</h3>
      <ol className="station-list">
        {line.stations.map((s) => (
          <li key={s.id}>
            <button type="button" className="station-list-link" onClick={() => onSelectStation(s.id)}>
              {s.name}
            </button>
          </li>
        ))}
      </ol>

      {source && <SourceFooter source={source} />}
    </div>
  );
}
