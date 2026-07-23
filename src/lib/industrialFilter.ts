import type { FirePoint } from "./types";

// FIRMS doesn't expose the "static source" classification (refineries, steel
// plants, flares...) in its CSV export. As a proxy, industrial heat sources
// show up as a near-fixed point that re-triggers day after day, while a
// wildfire's hotspots move/spread and eventually stop appearing. We flag any
// grid cell that had a detection on most of the last N days as "persistent"
// and drop it.
const GRID_PRECISION = 2; // ~1.1km at this latitude, rounds lat/lon to 2 decimals
const MIN_DAYS_FOR_PERSISTENCE = 4; // out of the lookback window
const LOOKBACK_DAYS = 5; // FIRMS area/csv API only accepts a day range of 1-5

function gridKey(lat: number, lon: number): string {
  return `${lat.toFixed(GRID_PRECISION)},${lon.toFixed(GRID_PRECISION)}`;
}

export function filterPersistentSources(fires: FirePoint[]): FirePoint[] {
  const daysByCell = new Map<string, Set<string>>();

  for (const fire of fires) {
    const key = gridKey(fire.lat, fire.lon);
    const day = fire.acquiredAt.slice(0, 10); // YYYY-MM-DD
    let days = daysByCell.get(key);
    if (!days) {
      days = new Set();
      daysByCell.set(key, days);
    }
    days.add(day);
  }

  const persistentCells = new Set(
    [...daysByCell.entries()]
      .filter(([, days]) => days.size >= MIN_DAYS_FOR_PERSISTENCE)
      .map(([key]) => key),
  );

  return fires.filter((fire) => !persistentCells.has(gridKey(fire.lat, fire.lon)));
}

export { LOOKBACK_DAYS };
