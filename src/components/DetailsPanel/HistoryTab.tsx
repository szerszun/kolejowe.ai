import type { RailwayLine } from "../../types";
import { SourceFooter } from "./SourceFooter";

export function HistoryTab({ line }: { line: RailwayLine }) {
  const source = line.sources.find((s) => s.section === "history");

  return (
    <div className="tab-content">
      <ol className="timeline">
        {line.history.timeline.map((event) => (
          <li key={`${event.year}-${event.label}`}>
            <span className="timeline-year">{event.year}</span>
            <span className="timeline-label">{event.label}</span>
          </li>
        ))}
      </ol>

      <p className="narrative">{line.history.narrative}</p>

      {line.history.photos.length > 0 && (
        <div className="photo-grid">
          {line.history.photos.map((photo) => (
            <figure key={photo.url}>
              <img src={photo.url} alt="" loading="lazy" />
              <figcaption>{photo.credit}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {source && <SourceFooter source={source} />}
    </div>
  );
}
