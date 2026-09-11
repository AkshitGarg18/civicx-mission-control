/**
 * Geocoding for the citizen location picker.
 *
 * Runs server-side (OpenStreetMap Nominatim requires a descriptive User-Agent
 * and is friendlier to a single server origin than to every browser), so the
 * frontend never talks to the geocoder directly.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const HEADERS = {
  "User-Agent": "CivicX/1.0 (civic reporting platform)",
  Accept: "application/json",
};

export interface GeoPlace {
  /** Short human label, e.g. "Sector 17, Rohini". */
  label: string;
  /** Full readable address line. */
  address: string;
  latitude: number;
  longitude: number;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
}

const pick = (...values: Array<string | undefined>) =>
  values.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() ?? null;

/** Build a compact, human label instead of a long raw address string. */
function toPlace(raw: NominatimPlace): GeoPlace | null {
  const latitude = Number.parseFloat(raw.lat);
  const longitude = Number.parseFloat(raw.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const a = raw.address ?? {};
  const locality = pick(a.neighbourhood, a.suburb, a.village, a.city_district);
  const city = pick(a.city, a.town, a.village, a.county);
  const state = pick(a.state, a.state_district);
  const country = pick(a.country);

  const seen = new Set<string>();
  const parts = [pick(raw.name, a.road), locality, city, state]
    .filter((p): p is string => Boolean(p))
    .filter((p) => {
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const label = parts.slice(0, 3).join(", ") || raw.display_name?.split(",").slice(0, 3).join(", ") || "Selected location";

  return {
    label,
    address: raw.display_name ?? label,
    latitude,
    longitude,
    locality,
    city,
    state,
    country,
  };
}

async function callNominatim(path: string): Promise<unknown> {
  const response = await fetch(`${NOMINATIM}${path}`, { headers: HEADERS });
  if (!response.ok) {
    const body = await response.text();
    console.error(`[civicx] nominatim failed [${response.status}]: ${body.slice(0, 300)}`);
    throw new Error("GEOCODER_UNAVAILABLE");
  }
  return response.json();
}

/** Forward geocoding: free-text query -> ranked place suggestions. */
export const searchPlaces = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().trim().min(2).max(160) }).parse(data),
  )
  .handler(async ({ data }): Promise<GeoPlace[]> => {
    const params = new URLSearchParams({
      q: data.query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "7",
      "accept-language": "en",
    });
    const raw = (await callNominatim(`/search?${params.toString()}`)) as NominatimPlace[];
    return (Array.isArray(raw) ? raw : [])
      .map(toPlace)
      .filter((p): p is GeoPlace => p !== null);
  });

/** Reverse geocoding: coordinates -> readable place. */
export const reverseGeocode = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
      .parse(data),
  )
  .handler(async ({ data }): Promise<GeoPlace | null> => {
    const params = new URLSearchParams({
      lat: String(data.latitude),
      lon: String(data.longitude),
      format: "jsonv2",
      addressdetails: "1",
      zoom: "17",
      "accept-language": "en",
    });
    const raw = (await callNominatim(`/reverse?${params.toString()}`)) as NominatimPlace;
    const place = raw && typeof raw === "object" ? toPlace(raw) : null;
    if (!place) return null;
    // keep the exact clicked coordinates, not the geocoder's snapped centre
    return { ...place, latitude: data.latitude, longitude: data.longitude };
  });
