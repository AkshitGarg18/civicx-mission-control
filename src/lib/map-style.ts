/**
 * Shared MapLibre basemap for every CivicX map, so the challenges map and the
 * report location picker always look identical.
 */

import type { StyleSpecification } from "maplibre-gl";

/** Default view: Delhi NCR, the CivicX pilot region. */
export const DEFAULT_CENTER: [number, number] = [77.1025, 28.7041];
export const DEFAULT_ZOOM = 10.5;

const ESRI = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas";

/** Keyless dark raster basemap (Esri Dark Gray Canvas): real streets, no token. */
export const DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: [`${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 16,
      attribution:
        'Tiles © <a href="https://www.esri.com/">Esri</a> — Esri, HERE, Garmin, © OpenStreetMap contributors',
    },
    labels: {
      type: "raster",
      tiles: [`${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 16,
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#05070d" } },
    { id: "base", type: "raster", source: "base", paint: { "raster-opacity": 0.95 } },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.9 } },
  ],
};
