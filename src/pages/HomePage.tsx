import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { lines } from "../data/lines";
import { useLineFilters } from "../hooks/useLineFilters";
import { Header } from "../components/Header";
import { RailwayMap } from "../components/Map/RailwayMap";
import { Legend } from "../components/Map/Legend";
import { ExplorerPanel } from "../components/Explorer/ExplorerPanel";
import { DetailsPanel } from "../components/DetailsPanel/DetailsPanel";
import { ChatButton } from "../components/Chat/ChatButton";
import { ChatPanel } from "../components/Chat/ChatPanel";

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { number } = useParams();
  const { query, setQuery, filters, setFilters, filteredLines, visibleLineIds } = useLineFilters(lines);

  const [highlightedLineIds, setHighlightedLineIds] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContextLineId, setChatContextLineId] = useState<string | null>(null);

  const selectedLine = useMemo(() => lines.find((l) => l.number === number), [number]);
  const chatContextLine = useMemo(() => lines.find((l) => l.id === chatContextLineId) ?? null, [chatContextLineId]);

  const selectLine = (id: string) => {
    const line = lines.find((l) => l.id === id);
    if (line) navigate(`/line/${line.number}`);
  };

  return (
    <div className="app-shell">
      <Header />
      <div className="demo-banner">{t("demoBanner")}</div>
      <div className="app-body">
        <ExplorerPanel
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          filteredLines={filteredLines}
          selectedLineId={selectedLine?.id ?? null}
          onSelectLine={selectLine}
        />
        <div className="map-area">
          <RailwayMap
            lines={lines}
            visibleLineIds={visibleLineIds}
            selectedLineId={selectedLine?.id ?? null}
            highlightedLineIds={highlightedLineIds}
            onSelectLine={selectLine}
          />
          <Legend />
        </div>
        {selectedLine && (
          <DetailsPanel
            line={selectedLine}
            onClose={() => navigate("/")}
            onAskAboutLine={() => {
              setChatContextLineId(selectedLine.id);
              setChatOpen(true);
            }}
          />
        )}
      </div>

      <ChatButton onClick={() => setChatOpen(true)} />
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        contextLine={chatContextLine}
        onClearContext={() => setChatContextLineId(null)}
        onHighlightLines={setHighlightedLineIds}
      />
    </div>
  );
}
