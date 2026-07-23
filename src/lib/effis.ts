import type { FirePoint } from "./types";
import { isInMainlandFrance } from "./franceBoundary";

// Copernicus EFFIS (European Forest Fire Information System) publishes active
// fire hotspots as a public WFS/GeoJSON layer. Endpoint below queries the
// "Current Situation - Active Fires" layer for the last 24h, no API key required.
const EFFIS_WFS_URL =
  "https://ies-ows.jrc.ec.europa.eu/gwis?service=WFS&version=2.0.0&request=GetFeature" +
  "&typeName=ba.hs&outputFormat=application/json&srsName=EPSG:4326";

interface EffisFeature {
  geometry: { type: string; coordinates: [number, number] };
  properties: Record<string, string | number | null>;
}

export async function fetchEffisFires(): Promise<FirePoint[]> {
  try {
    const res = await fetch(EFFIS_WFS_URL, { next: { revalidate: 600 } });
    if (!res.ok) {
      throw new Error(`EFFIS request failed: ${res.status}`);
    }
    const data = (await res.json()) as { features: EffisFeature[] };

    return data.features
      .filter((f) => f.geometry?.type === "Point")
      .map((f, i) => {
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties;
        return {
          id: `effis-${lat}-${lon}-${i}`,
          source: "EFFIS" as const,
          lat,
          lon,
          acquiredAt:
            (p.date as string) ?? (p.acq_date as string) ?? new Date().toISOString(),
          confidence: p.confidence ? String(p.confidence) : undefined,
          placeName: (p.province as string) ?? (p.country as string) ?? undefined,
        };
      })
      .filter((fire) => isInMainlandFrance(fire.lat, fire.lon));
  } catch {
    // EFFIS endpoint shape can change; fail soft so the map still shows FIRMS data.
    return [];
  }
}
