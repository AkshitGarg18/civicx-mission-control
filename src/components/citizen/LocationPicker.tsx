import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { reverseGeocode, searchPlaces, type GeoPlace } from "@/lib/geocoding.functions";
import { formatCoords, popularAreas, type SelectedLocation } from "@/lib/location";
import { cn } from "@/lib/utils";

const LocationPickerMap = lazy(() => import("./LocationPickerMap"));

interface Camera {
  latitude: number;
  longitude: number;
  zoom?: number;
  nonce: number;
}

/**
 * Full location picker for the citizen report flow: search anywhere, use the
 * device location, or pick a point on the map and drag the marker.
 */
export function LocationPicker({
  value,
  onChange,
  onConfirm,
}: {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation | null) => void;
  onConfirm: () => void;
}) {
  const reduced = !!useReducedMotion();
  const runSearch = useServerFn(searchPlaces);
  const runReverse = useServerFn(reverseGeocode);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoPlace[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const reverseToken = useRef(0);

  /* debounced search — never one request per keystroke */
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      setSearchError(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const found = await runSearch({ data: { query: term } });
        if (!live) return;
        setResults(found);
      } catch (err) {
        console.error("[civicx] location search failed", err);
        if (!live) return;
        setResults(null);
        setSearchError(
          "Unable to search locations right now. Please try again or select a location on the map.",
        );
      } finally {
        if (live) setSearching(false);
      }
    }, 450);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, runSearch]);

  const applyPlace = useCallback(
    (place: GeoPlace, zoom = 15) => {
      onChange({
        label: place.label,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        locality: place.locality,
        city: place.city,
        state: place.state,
        country: place.country,
      });
      setCamera({
        latitude: place.latitude,
        longitude: place.longitude,
        zoom,
        nonce: Date.now(),
      });
    },
    [onChange],
  );

  /** Coordinates chosen on the map (click or marker drag) — resolve an address. */
  const applyPoint = useCallback(
    async (latitude: number, longitude: number, recenter = false) => {
      const token = ++reverseToken.current;
      onChange({
        label: "Location selected",
        address: null,
        latitude,
        longitude,
        locality: null,
        city: null,
        state: null,
        country: null,
      });
      if (recenter) setCamera({ latitude, longitude, zoom: 15, nonce: Date.now() });

      setResolving(true);
      try {
        const place = await runReverse({ data: { latitude, longitude } });
        if (token !== reverseToken.current) return;
        if (place) {
          onChange({
            label: place.label,
            address: place.address,
            latitude,
            longitude,
            locality: place.locality,
            city: place.city,
            state: place.state,
            country: place.country,
          });
        }
      } catch (err) {
        console.error("[civicx] reverse geocode failed", err);
        // coordinates stay selected even when no address can be resolved
      } finally {
        if (token === reverseToken.current) setResolving(false);
      }
    },
    [onChange, runReverse],
  );

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoError("Unable to detect your location. Please select a location manually.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void applyPoint(pos.coords.latitude, pos.coords.longitude, true);
      },
      (err) => {
        setLocating(false);
        console.warn("[civicx] geolocation unavailable", err);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. You can still search for a location or select one manually on the map."
            : "Unable to detect your location. Please select a location manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-4">
      {/* search + current location */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="glass-soft flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5">
            {searching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, area, locality or address..."
              aria-label="Search city, area, locality or address"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {query.length > 0 && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-2.5 font-mono text-[10px] tracking-[0.14em] text-cyan transition-colors hover:bg-cyan/20"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            {locating ? "DETECTING YOUR LOCATION…" : "USE MY CURRENT LOCATION"}
          </button>
        </div>

        {searching && (
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            SEARCHING LOCATIONS…
          </p>
        )}
        {searchError && <p className="text-xs text-destructive">{searchError}</p>}
        {geoError && <p className="text-xs text-warn">{geoError}</p>}

        {/* suggestions */}
        {results && results.length > 0 && (
          <div className="glass-soft max-h-56 divide-y divide-border/60 overflow-y-auto rounded-xl">
            {results.map((place, i) => (
              <button
                key={`${place.latitude}-${place.longitude}-${i}`}
                type="button"
                onClick={() => {
                  applyPlace(place);
                  setQuery("");
                  setResults(null);
                }}
                className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cyan/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{place.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {place.address}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        {results && results.length === 0 && !searching && (
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            NO LOCATIONS FOUND
          </p>
        )}

        {/* optional shortcuts — not a limit */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="mono-label text-muted-foreground">POPULAR AREAS</span>
          {popularAreas.map((area) => (
            <button
              key={area.name}
              type="button"
              onClick={() => setQuery(area.name)}
              className="rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground transition-colors hover:border-cyan/40 hover:text-cyan"
            >
              {area.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* map */}
      <div className="h-[18rem] w-full sm:h-[22rem]">
        <ClientOnly
          fallback={
            <div className="grid h-full w-full place-items-center rounded-xl border border-border/70 bg-background/40">
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                LOADING MAP…
              </p>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="grid h-full w-full place-items-center rounded-xl border border-border/70 bg-background/40">
                <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                  LOADING MAP…
                </p>
              </div>
            }
          >
            <LocationPickerMap
              point={value ? { latitude: value.latitude, longitude: value.longitude } : null}
              flyTo={camera}
              reduced={reduced}
              onPick={(p) => void applyPoint(p.latitude, p.longitude)}
            />
          </Suspense>
        </ClientOnly>
      </div>

      {/* selected location card */}
      <div className="grid-floor glass-soft relative overflow-hidden rounded-xl p-4 sm:p-5">
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mono-label text-cyan/90 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {value ? "SELECTED LOCATION" : "NO LOCATION SELECTED"}
            </p>
            {value ? (
              <>
                <p className="mt-2 truncate text-sm text-foreground">{value.label}</p>
                {value.address && value.address !== value.label && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{value.address}</p>
                )}
                <p className="mt-2 font-mono text-xs tracking-[0.12em] text-muted-foreground">
                  {formatCoords(value.latitude, value.longitude)}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/80">
                  {resolving ? "FINDING ADDRESS…" : "DRAG THE MARKER TO ADJUST LOCATION"}
                </p>
              </>
            ) : (
              <p className="mt-2 max-w-md text-xs text-muted-foreground">
                Search for a location, use your current location, or select a point on the map.
              </p>
            )}
          </div>
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            {value && (
              <span className="absolute h-10 w-10 rounded-full border border-cyan/30 motion-safe:animate-ping" />
            )}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                value ? "bg-cyan shadow-[0_0_12px_var(--neon-cyan)]" : "bg-muted-foreground/50",
              )}
            />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!value}
        className="w-full rounded-xl px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background disabled:opacity-40 sm:w-auto"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      >
        CONFIRM LOCATION
      </button>
    </div>
  );
}
