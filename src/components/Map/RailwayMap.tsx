import { useEffect, useRef, useState } from "react";
import { MapLibreMap, NavigationControl, type GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { RailwayLine } from "../../types";
import { getLineColor } from "../../utils/lineColors";
import { boundsForCoordinates } from "../../utils/geo";
import { regionBorder } from "../../data/regionBorder";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type HoverInfo =
  | { kind: "line"; x: number; y: number; number: string; endStations: [string, string] }
  | { kind: "station"; x: number; y: number; name: string };

interface RailwayMapProps {
  lines: RailwayLine[];
  visibleLineIds: Set<string>;
  selectedLineId: string | null;
  highlightedLineIds: string[];
  selectedStationId: string | null;
  onSelectLine: (id: string) => void;
  onSelectStation: (id: string) => void;
}

function linesToGeoJSON(lines: RailwayLine[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: lines.map((line) => ({
      type: "Feature",
      properties: {
        id: line.id,
        number: line.number,
        status: line.status,
        color: getLineColor(line.id),
        endStationA: line.endStations[0],
        endStationB: line.endStations[1],
        hasTenders: line.tenders.some((t) => t.status === "open") ? 1 : 0,
      },
      geometry: { type: "LineString", coordinates: line.geometry },
    })),
  };
}

function stationsToGeoJSON(lines: RailwayLine[]): FeatureCollection<Point> {
  const seen = new Set<string>();
  const features: FeatureCollection<Point>["features"] = [];
  for (const line of lines) {
    for (const station of line.stations) {
      if (seen.has(station.id)) continue;
      seen.add(station.id);
      features.push({
        type: "Feature",
        properties: { id: station.id, name: station.name },
        geometry: { type: "Point", coordinates: station.coordinates },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

function tenderBadgesToGeoJSON(lines: RailwayLine[]): FeatureCollection<Point> {
  const features: FeatureCollection<Point>["features"] = [];
  for (const line of lines) {
    if (!line.tenders.some((t) => t.status === "open")) continue;
    const mid = line.geometry[Math.floor(line.geometry.length / 2)];
    features.push({
      type: "Feature",
      properties: { number: line.number },
      geometry: { type: "Point", coordinates: mid },
    });
  }
  return { type: "FeatureCollection", features };
}

export function RailwayMap({
  lines,
  visibleLineIds,
  selectedLineId,
  highlightedLineIds,
  selectedStationId,
  onSelectLine,
  onSelectStation,
}: RailwayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [16.4, 51.0],
      zoom: 7.1,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-left");
    mapRef.current = map;

    // The container can settle its final size (e.g. details panel opening/
    // closing) after the map is constructed; keep the canvas in sync.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    map.on("load", () => {
      map.addSource("region-border", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: regionBorder } },
      });
      map.addLayer({
        id: "region-border-line",
        type: "line",
        source: "region-border",
        paint: { "line-color": "#1B1F4B", "line-width": 2, "line-dasharray": [2, 2] },
      });

      map.addSource("lines", { type: "geojson", data: linesToGeoJSON(lines) });
      map.addLayer({
        id: "lines-casing",
        type: "line",
        source: "lines",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 7 },
      });
      map.addLayer({
        id: "lines-layer",
        type: "line",
        source: "lines",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          // Colour identifies the individual line; dash pattern conveys its
          // status, so two lines sharing a status remain distinguishable.
          "line-color": ["get", "color"],
          "line-width": 4,
          "line-opacity": ["case", ["==", ["get", "status"], "closed"], 0.55, 1],
          "line-dasharray": [
            "match",
            ["get", "status"],
            "planned",
            ["literal", [1, 1.6]],
            "freight_only",
            ["literal", [4, 2]],
            "closed",
            ["literal", [2, 2]],
            ["literal", [1, 0]],
          ],
        },
      });
      map.addLayer({
        id: "lines-highlight",
        type: "line",
        source: "lines",
        layout: { "line-cap": "round", "line-join": "round" },
        filter: ["in", ["get", "id"], ["literal", []]],
        paint: { "line-color": "#E91E63", "line-width": 8, "line-opacity": 0.55 },
      });

      map.addSource("tender-badges", { type: "geojson", data: tenderBadgesToGeoJSON(lines) });
      map.addLayer({
        id: "tender-badges-layer",
        type: "circle",
        source: "tender-badges",
        paint: {
          "circle-radius": 6,
          "circle-color": "#E91E63",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource("stations", { type: "geojson", data: stationsToGeoJSON(lines) });
      map.addLayer({
        id: "stations-layer",
        type: "circle",
        source: "stations",
        minzoom: 10,
        paint: {
          "circle-radius": 4,
          "circle-color": "#1B1F4B",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "stations-highlight",
        type: "circle",
        source: "stations",
        minzoom: 10,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-radius": 8,
          "circle-color": "transparent",
          "circle-stroke-color": "#E91E63",
          "circle-stroke-width": 2.5,
        },
      });
      map.addLayer({
        id: "stations-label",
        type: "symbol",
        source: "stations",
        minzoom: 11,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": "#1B1F4B", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
      });

      const interactiveLayers = ["stations-layer", "lines-layer"];
      const pointBox = (p: { x: number; y: number }): [[number, number], [number, number]] => [
        [p.x - 6, p.y - 6],
        [p.x + 6, p.y + 6],
      ];

      map.on("mousemove", (e) => {
        const feats = map.queryRenderedFeatures(pointBox(e.point), { layers: interactiveLayers });
        const stationFeat = feats.find((f) => f.layer.id === "stations-layer");
        const lineFeat = feats.find((f) => f.layer.id === "lines-layer");
        if (stationFeat) {
          map.getCanvas().style.cursor = "pointer";
          setHover({ kind: "station", x: e.point.x, y: e.point.y, name: stationFeat.properties?.name });
        } else if (lineFeat) {
          map.getCanvas().style.cursor = "pointer";
          setHover({
            kind: "line",
            x: e.point.x,
            y: e.point.y,
            number: lineFeat.properties?.number,
            endStations: [lineFeat.properties?.endStationA, lineFeat.properties?.endStationB],
          });
        } else {
          map.getCanvas().style.cursor = "";
          setHover(null);
        }
      });
      map.on("mouseout", () => {
        map.getCanvas().style.cursor = "";
        setHover(null);
      });
      map.on("click", (e) => {
        const feats = map.queryRenderedFeatures(pointBox(e.point), { layers: interactiveLayers });
        const stationFeat = feats.find((f) => f.layer.id === "stations-layer");
        if (stationFeat?.properties?.id) {
          onSelectStation(stationFeat.properties.id);
          return;
        }
        const lineFeat = feats.find((f) => f.layer.id === "lines-layer");
        if (lineFeat?.properties?.id) onSelectLine(lineFeat.properties.id);
      });

      setReady(true);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update visible lines (filters)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filtered = lines.filter((l) => visibleLineIds.has(l.id));
    (map.getSource("lines") as GeoJSONSource | undefined)?.setData(linesToGeoJSON(filtered));
    (map.getSource("stations") as GeoJSONSource | undefined)?.setData(stationsToGeoJSON(filtered));
    (map.getSource("tender-badges") as GeoJSONSource | undefined)?.setData(tenderBadgesToGeoJSON(filtered));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, visibleLineIds, ready]);

  // Highlight layer (selected + chat-mentioned lines)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ids = new Set(highlightedLineIds);
    if (selectedLineId) ids.add(selectedLineId);
    map.setFilter("lines-highlight", ["in", ["get", "id"], ["literal", Array.from(ids)]]);
  }, [selectedLineId, highlightedLineIds, ready]);

  // Fit bounds on selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedLineId) return;
    const line = lines.find((l) => l.id === selectedLineId);
    if (!line) return;
    map.fitBounds(boundsForCoordinates(line.geometry), { padding: { top: 80, bottom: 80, left: 80, right: 420 }, duration: 700, maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLineId, ready]);

  // Highlight the selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter("stations-highlight", ["==", ["get", "id"], selectedStationId ?? "__none__"]);
  }, [selectedStationId, ready]);

  // Fly to the selected station
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedStationId) return;
    for (const line of lines) {
      const station = line.stations.find((s) => s.id === selectedStationId);
      if (station) {
        map.flyTo({ center: station.coordinates, zoom: Math.max(map.getZoom(), 12), duration: 700 });
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStationId, ready]);

  return (
    <div className="railway-map-wrap">
      <div ref={containerRef} className="railway-map" role="application" aria-label="Interactive map of Lower Silesia railway lines" />
      {hover && hover.kind === "line" && (
        <div className="map-tooltip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <strong>Linia {hover.number}</strong>
          <span>
            {hover.endStations[0]} – {hover.endStations[1]}
          </span>
        </div>
      )}
      {hover && hover.kind === "station" && (
        <div className="map-tooltip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <strong>{hover.name}</strong>
        </div>
      )}
    </div>
  );
}
