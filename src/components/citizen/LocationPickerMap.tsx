import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";
import { DARK_STYLE, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/map-style";

export interface MapPoint {
  latitude: number;
  longitude: number;
}

/**
 * Interactive map surface for the location picker: click anywhere to place the
 * civic-report marker, drag the marker to fine-tune it.
 */
export default function LocationPickerMap({
  point,
  flyTo,
  reduced,
  onPick,
}: {
  point: MapPoint | null;
  /** Bumps whenever the caller wants the camera to move (search / current location). */
  flyTo: { latitude: number; longitude: number; zoom?: number; nonce: number } | null;
  reduced: boolean;
  onPick: (p: MapPoint) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const pick = useRef(onPick);
  const [ready, setReady] = useState(false);

  pick.current = onPick;

  useEffect(() => {
    if (map.current || !container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: DARK_STYLE,
      center: point ? [point.longitude, point.latitude] : DEFAULT_CENTER,
      zoom: point ? 14 : DEFAULT_ZOOM,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    instance.on("load", () => setReady(true));
    instance.on("click", (e) => pick.current({ latitude: e.lngLat.lat, longitude: e.lngLat.lng }));
    map.current = instance;

    return () => {
      marker.current?.remove();
      marker.current = null;
      instance.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep the draggable marker in sync with the selected point */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;

    if (!point) {
      marker.current?.remove();
      marker.current = null;
      return;
    }

    if (!marker.current) {
      const el = document.createElement("div");
      el.className = "civicx-pin";
      el.innerHTML = `<span class="civicx-pin-halo"></span><span class="civicx-pin-core"></span>`;
      marker.current = new maplibregl.Marker({ element: el, draggable: true, anchor: "center" })
        .setLngLat([point.longitude, point.latitude])
        .addTo(instance);
      marker.current.on("dragend", () => {
        const pos = marker.current?.getLngLat();
        if (pos) pick.current({ latitude: pos.lat, longitude: pos.lng });
      });
    } else {
      marker.current.setLngLat([point.longitude, point.latitude]);
    }
  }, [point, ready]);

  /* camera moves requested by search / current location */
  useEffect(() => {
    const instance = map.current;
    if (!instance || !flyTo) return;
    instance.easeTo({
      center: [flyTo.longitude, flyTo.latitude],
      zoom: flyTo.zoom ?? 15,
      duration: reduced ? 0 : 900,
    });
  }, [flyTo, reduced]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/70">
      <div ref={container} className="civicx-map h-full w-full" />
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => map.current?.zoomIn()}
          className="glass grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:border-cyan/40 hover:text-cyan"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => map.current?.zoomOut()}
          className="glass grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:border-cyan/40 hover:text-cyan"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-background/70">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            LOADING MAP…
          </p>
        </div>
      )}

      <p className="glass-soft pointer-events-none absolute bottom-3 left-3 rounded-lg px-2.5 py-1.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
        TAP THE MAP OR DRAG THE MARKER
      </p>
    </div>
  );
}
