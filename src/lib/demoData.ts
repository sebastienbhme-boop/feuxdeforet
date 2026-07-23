import type { FirePoint } from "./types";

// Fictional data shown when no API key is configured, so the app is visibly
// functional out of the box instead of rendering an empty map.
export const DEMO_FIRES: FirePoint[] = [
  {
    id: "demo-var-1",
    source: "FIRMS",
    lat: 43.35,
    lon: 6.4,
    acquiredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    confidence: "high",
    frp: 145,
    satellite: "VIIRS (démo)",
    placeName: "Massif des Maures, Var",
  },
  {
    id: "demo-corse-1",
    source: "EFFIS",
    lat: 42.15,
    lon: 9.15,
    acquiredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    confidence: "nominal",
    frp: 38,
    placeName: "Corse-du-Sud",
  },
  {
    id: "demo-gironde-1",
    source: "FIRMS",
    lat: 44.65,
    lon: -0.9,
    acquiredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    confidence: "high",
    frp: 12,
    satellite: "VIIRS (démo)",
    placeName: "Landiras, Gironde",
  },
];
