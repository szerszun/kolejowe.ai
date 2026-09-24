import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import type { RailwayLine, TenderStatus } from "../../types";
import { SourceFooter } from "./SourceFooter";

const STATUS_KEY: Record<TenderStatus, "tenderStatusOpen" | "tenderStatusClosed" | "tenderStatusAwarded"> = {
  open: "tenderStatusOpen",
  closed: "tenderStatusClosed",
  awarded: "tenderStatusAwarded",
};

export function TendersTab({ line }: { line: RailwayLine }) {
  const { t } = useI18n();
  const [showClosed, setShowClosed] = useState(false);
  const source = line.sources.find((s) => s.section === "tenders");

  const openTenders = line.tenders.filter((tender) => tender.status === "open");
  const closedTenders = line.tenders.filter((tender) => tender.status !== "open");
  const visible = showClosed ? line.tenders : openTenders;

  return (
    <div className="tab-content">
      {openTenders.length === 0 && (
        <p className="empty-state">{t("noTendersOpen", { number: line.number, date: source?.lastUpdated ?? "—" })}</p>
      )}

      {visible.length > 0 && (
        <ul className="tender-list">
          {visible.map((tender) => (
            <li key={tender.id} className="tender-card">
              <div className="tender-card-header">
                <span className={`badge badge--${tender.status}`}>{t(STATUS_KEY[tender.status])}</span>
                <span className={`match-tag match-tag--${tender.matchType === "confirmed" ? "confirmed" : "auto"}`}>
                  {tender.matchType === "confirmed" ? t("confirmed") : t("autoMatched")}
                </span>
              </div>
              <h4>{tender.title}</h4>
              <dl className="fact-grid fact-grid--compact">
                <div>
                  <dt>{t("tenderAuthority")}</dt>
                  <dd>{tender.authority}</dd>
                </div>
                <div>
                  <dt>{t("tenderValue")}</dt>
                  <dd>{tender.estimatedValuePLN ? `${tender.estimatedValuePLN.toLocaleString("pl-PL")} PLN` : "—"}</dd>
                </div>
                <div>
                  <dt>{t("tenderPublished")}</dt>
                  <dd>{tender.publicationDate}</dd>
                </div>
                <div>
                  <dt>{t("tenderDeadline")}</dt>
                  <dd>{tender.deadline ?? "—"}</dd>
                </div>
              </dl>
              <a href={tender.url} target="_blank" rel="noreferrer">
                {t("tenderLink")} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      {closedTenders.length > 0 && (
        <label className="checkbox-row">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          {t("showClosedTenders")}
        </label>
      )}

      {source && <SourceFooter source={source} />}
    </div>
  );
}
