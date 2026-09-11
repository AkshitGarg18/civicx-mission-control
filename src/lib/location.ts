/** Browser-safe location shape shared by the report flow and the picker. */
export interface SelectedLocation {
  label: string;
  address: string | null;
  latitude: number;
  longitude: number;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

/** Quick shortcuts shown under the search field — never a limit on the user. */
export const popularAreas = [
  { name: "Rohini", latitude: 28.7495, longitude: 77.0676 },
  { name: "Pitampura", latitude: 28.6942, longitude: 77.1315 },
  { name: "Dwarka", latitude: 28.5921, longitude: 77.046 },
  { name: "Connaught Place", latitude: 28.6315, longitude: 77.2167 },
] as const;

export const formatCoords = (lat: number, lng: number) =>
  `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
