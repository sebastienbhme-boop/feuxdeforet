"use client";

import type { FirePoint } from "@/lib/types";
import { formatParisDateTime } from "@/lib/formatDate";

// FIRMS reports the satellite as a short code; map to a readable name.
const SATELLITE_LABELS: Record<string, string> = {
  N: "Suomi NPP",
  "1": "NOAA-20",
  "2": "NOAA-21",
  Terra: "Terra (MODIS)",
  Aqua: "Aqua (MODIS)",
};

function labelFor(code: string): string {
  return SATELLITE_LABELS[code] ?? code;
}

export default function LastSatelliteUpdates({ fires }: { fires: FirePoint[] }) {
  const lastBySatellite = new Map<string, string>();

  for (const fire of fires) {
    if (!fire.satellite) continue;
    const current = lastBySatellite.get(fire.satellite);
    if (!current || fire.acquiredAt > current) {
      lastBySatellite.set(fire.satellite, fire.acquiredAt);
    }
  }

  const rows = [...lastBySatellite.entries()].sort((a, b) => (a[1] < b[1] ? 1 : -1));

  if (rows.length === 0) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Aucune détection satellite disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        Dernière donnée reçue par satellite
      </p>
      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {rows.map(([satellite, acquiredAt]) => (
          <li key={satellite} className="flex items-center justify-between gap-2">
            <span>{labelFor(satellite)}</span>
            <span className="font-mono">{formatParisDateTime(acquiredAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
