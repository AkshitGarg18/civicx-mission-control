import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { LngLatBoundsLike, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, LocateFixed, Minus, Plus } from "lucide-react";
import type { ChallengeRow } from "@/lib/challenges-service";
import { statusMap } from "@/lib/challenges-service";

/** Default view: Delhi NCR, the CivicX pilot region. */
const DEFAULT_CENTER: [number, number] = [77.1025, 28.7041];
const DEFAULT_ZOOM = 10.5;

/** Dark raster basemap with real roads, streets and neighbourhoods, no API token required. */
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#05070d" } },
    { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.92 } },
  ],
};

const priorityStyle: Record<string, { color: string; ring: number; pulse: string }> = {
  CRITICAL: { color: "var(--destructive)", ring: 20, pulse: "civicx-pulse-strong" },
  HIGH: { color: "var(--destructive)", ring: 18, pulse: "civicx-pulse-strong" },
  MEDIUM: { color: "var(--warn)", ring: 15, pulse: "civicx-pulse-soft" },
  LOW: { color: "var(--neon-cyan)", ring: 13, pulse: "civicx-pulse-min" },
};

const styleFor = (priority: string) => priorityStyle[priority] ?? priorityStyle["MEDIUM"]!;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch,
  );

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Real interactive geographic map (MapLibre GL + CARTO dark basemap) with the
 * CivicX mission-control chrome layered on top. Markers come from stored
 * challenges only; no synthetic coordinates are ever generated.
 */
export default function ChallengeMap({
  rows,
  arriving,
  reduced,
  onViewMission,
}: {
  rows: ChallengeRow[];
  arriving: string[];
  reduced: boolean;
  onViewMission: (challengeId: string) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  /** Only rows with usable coordinates can be placed. */
  const placed = useMemo(
    () =>
      rows.filter(
        (r) =>
          typeof r.latitude === "number" &&
          typeof r.longitude === "number" &&
          Number.isFinite(r.latitude) &&
          Number.isFinite(r.longitude) &&
          Math.abs(r.latitude) <= 90 &&
          Math.abs(r.longitude) <= 180,
      ),
    [rows],
  );

  /* create the map once */
  useEffect(() => {
    if (map.current || !container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: DARK_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    instance.on("load", () => setReady(true));
    map.current = instance;

    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
      instance.remove();
      map.current = null;
      fitted.current = false;
    };
  }, []);

  /* sync markers with the current (filtered) challenge set */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    const keep = new Set(placed.map((r) => r.id));
    markers.current.forEach((marker, id) => {
      if (!keep.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    placed.forEach((row) => {
      if (markers.current.has(row.id)) return;
      const tone = styleFor(row.priority);
      const isNew = arriving.includes(row.id);

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${row.title} — ${row.priority} priority`);
      el.className = "civicx-marker";
      el.style.setProperty("--marker-color", tone.color);
      el.style.setProperty("--marker-ring", `${tone.ring}px`);
      el.innerHTML = `
        <span class="civicx-marker-halo${reduced ? "" : ` ${tone.pulse}`}"></span>
        ${isNew && !reduced ? '<span class="civicx-marker-radar"></span>' : ""}
        <span class="civicx-marker-core"></span>
        <span class="civicx-marker-tip">
          <span class="civicx-marker-tip-title">${escapeHtml(row.title)}</span>
          <span class="civicx-marker-tip-meta">${escapeHtml(row.category ?? "UNCATEGORISED")} · ${escapeHtml(row.priority)}</span>
        </span>`;

      const impact =
        row.estimated_impact !== null && row.estimated_impact !== undefined
          ? `${row.estimated_impact.toLocaleString()} citizens (AI estimate)`
          : "Not enough data to estimate";

      const popupNode = document.createElement("div");
      popupNode.className = "civicx-popup";
      popupNode.innerHTML = `
        <p class="civicx-popup-code">MISSION #${row.id.slice(0, 4).toUpperCase()}</p>
        <h3 class="civicx-popup-title">${escapeHtml(row.title)}</h3>
        <p class="civicx-popup-loc">${escapeHtml(row.location_name ?? "Location pending")}</p>
        <div class="civicx-popup-chips">
          <span class="civicx-popup-chip" style="--chip:${tone.color}">${escapeHtml(row.priority)}</span>
          <span class="civicx-popup-chip">${escapeHtml(statusMap[row.status] ?? "SIGNAL DETECTED")}</span>
        </div>
        <dl class="civicx-popup-grid">
          <div><dt>CATEGORY</dt><dd>${escapeHtml(row.category ?? "—")}</dd></div>
          <div><dt>ESTIMATED IMPACT</dt><dd>${escapeHtml(impact)}</dd></div>
          <div><dt>REPORTED</dt><dd>${escapeHtml(formatDate(row.created_at))}</dd></div>
        </dl>
        ${
          row.ai_summary
            ? `<p class="civicx-popup-label">AI SUMMARY</p><p class="civicx-popup-summary">${escapeHtml(row.ai_summary)}</p>`
            : ""
        }
        <button type="button" class="civicx-popup-cta">VIEW MISSION →</button>`;

      popupNode
        .querySelector<HTMLButtonElement>(".civicx-popup-cta")
        ?.addEventListener("click", () => onViewMission(row.id));

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        maxWidth: "20rem",
        className: "civicx-popup-shell",
      }).setDOMContent(popupNode);

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([row.longitude!, row.latitude!])
        .setPopup(popup)
        .addTo(instance);

      markers.current.set(row.id, marker);
    });
  }, [placed, ready, arriving, reduced, onViewMission]);

  /* centre intelligently on the available challenges (first load only) */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || fitted.current || placed.length === 0) return;
    fitted.current = true;

    if (placed.length === 1) {
      instance.easeTo({
        center: [placed[0]!.longitude!, placed[0]!.latitude!],
        zoom: 13,
        duration: reduced ? 0 : 900,
      });
      return;
    }

    const lngs = placed.map((r) => r.longitude!);
    const lats = placed.map((r) => r.latitude!);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    instance.fitBounds(bounds, { padding: 90, maxZoom: 14, duration: reduced ? 0 : 900 });
  }, [placed, ready, reduced]);

  /* fly to a brand-new signal */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready || arriving.length === 0) return;
    const latest = placed.find((r) => r.id === arriving[arriving.length - 1]);
    if (!latest) return;
    instance.easeTo({
      center: [latest.longitude!, latest.latitude!],
      zoom: Math.max(instance.getZoom(), 12.5),
      duration: reduced ? 0 : 1200,
    });
  }, [arriving, placed, ready, reduced]);

  const recenter = () => {
    const instance = map.current;
    if (!instance) return;
    fitted.current = false;
    if (placed.length === 0) {
      instance.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: reduced ? 0 : 700 });
      return;
    }
    const lngs = placed.map((r) => r.longitude!);
    const lats = placed.map((r) => r.latitude!);
    instance.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 90, maxZoom: 14, duration: reduced ? 0 : 700 },
    );
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("LOCATION UNAVAILABLE ON THIS DEVICE");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        map.current?.easeTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 13,
          duration: reduced ? 0 : 900,
        });
      },
      (err) => {
        setLocating(false);
        console.warn("[civicx] geolocation denied", err);
        setGeoError("LOCATION PERMISSION DENIED");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/70">
      <div ref={container} className="civicx-map h-full w-full" />

      {/* scan-line + vignette keep the mission-control feel without hiding the map */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_120px_rgba(3,7,18,0.85)]" />

      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <MapButton label="Zoom in" onClick={() => map.current?.zoomIn()}>
          <Plus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => map.current?.zoomOut()}>
          <Minus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Recenter map" onClick={recenter}>
          <Crosshair className="h-4 w-4" />
        </MapButton>
        <MapButton label="Locate me" onClick={locate} active={locating}>
          <LocateFixed className="h-4 w-4" />
        </MapButton>
      </div>

      {geoError && (
        <p className="glass-soft absolute bottom-3 right-3 rounded-xl px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
          {geoError}
        </p>
      )}

      {ready && placed.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="glass rounded-2xl px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            NO ACTIVE CIVIC SIGNALS IN THIS AREA
          </p>
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-background/70">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            LOADING TERRAIN…
          </p>
        </div>
      )}
    </div>
  );
}

function MapButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={
        active
          ? "glass grid h-9 w-9 place-items-center rounded-xl border-cyan/50 text-cyan"
          : "glass grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:border-cyan/40 hover:text-cyan"
      }
    >
      {children}
    </button>
  );
}
