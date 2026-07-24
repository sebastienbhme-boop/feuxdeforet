import type { FirePoint } from "./types";
import { isInMainlandFrance } from "./franceBoundary";

// NASA FIRMS area API returns CSV. Docs: https://firms.modaps.eosdis.nasa.gov/api/area/
// MAP_KEY is a free key from https://firms.modaps.eosdis.nasa.gov/api/map_key/
const FIRMS_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";

// Bounding box tightly covering mainland France (incl. Corsica): west,south,east,north
const FRANCE_BBOX = "-5.2,41,9.7,51.1";

// Querying all three VIIRS polar satellites instead of just SNPP roughly triples
// the number of daily passes over France (each satellite has its own orbit/pass
// time), which is the closest we can get to "more real-time" without switching
// to the geostationary product (only available via WMS, not the simple CSV API).
const VIIRS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"] as const;

// MODIS (Aqua/Terra) passes over France at different times than the VIIRS
// satellites, filling in some of the hours where no VIIRS pass occurs.
// Lower spatial resolution (1km vs 375m) but same FIRMS API/auth.
const MODIS_SOURCE = "MODIS_NRT";

// FIRMS area/csv API only accepts a day range of 1-5; we only need enough
// history to cover the display window plus the polar satellites' pass gaps.
const DISPLAY_DAYS = 2;

function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = values[i]?.trim() ?? "";
    });
    return row;
  });
}

async function fetchViirsSource(mapKey: string, source: string): Promise<FirePoint[]> {
  const url = `${FIRMS_BASE}/${mapKey}/${source}/${FRANCE_BBOX}/${DISPLAY_DAYS}`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`FIRMS request failed for ${source}: ${res.status}`);
  }
  const csv = await res.text();
  // FIRMS returns HTTP 200 with a plain-text error body (e.g. "Invalid day
  // range...") instead of an HTTP error status, so check the content shape too.
  if (!csv.trim().startsWith("country_id") && !csv.trim().startsWith("latitude")) {
    throw new Error(`FIRMS returned an unexpected response for ${source}: ${csv.slice(0, 200)}`);
  }
  const rows = parseCsv(csv);

  return rows
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      id: `firms-${source}-${r.latitude}-${r.longitude}-${r.acq_date}-${r.acq_time}`,
      source: "FIRMS" as const,
      lat: Number(r.latitude),
      lon: Number(r.longitude),
      acquiredAt: `${r.acq_date}T${r.acq_time?.padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2")}:00Z`,
      confidence: r.confidence,
      // VIIRS uses bright_ti4, MODIS uses brightness for its equivalent channel.
      brightness: r.bright_ti4 ? Number(r.bright_ti4) : r.brightness ? Number(r.brightness) : undefined,
      frp: r.frp ? Number(r.frp) : undefined,
      satellite: r.satellite,
    }))
    .filter((fire) => isInMainlandFrance(fire.lat, fire.lon));
}

export async function fetchFirmsFires(): Promise<FirePoint[]> {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    return [];
  }

  const results = await Promise.allSettled(
    [...VIIRS_SOURCES, MODIS_SOURCE].map((source) => fetchViirsSource(mapKey, source)),
  );

  const allFires = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const cutoff = Date.now() - DISPLAY_DAYS * 24 * 60 * 60 * 1000;
  return allFires.filter((fire) => new Date(fire.acquiredAt).getTime() >= cutoff);
}
