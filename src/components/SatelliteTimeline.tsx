"use client";

import { useEffect, useState } from "react";

const PARIS_TIME_ZONE = "Europe/Paris";

function parisMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

// Real satellite overpasses last only a few minutes; widened slightly here
// purely so the band is visible at this timeline's scale.
const PASSES = [
  { label: "SNPP", color: "bg-orange-600", start: 1 * 60 + 30, duration: 12 },
  { label: "SNPP", color: "bg-orange-600", start: 13 * 60 + 30, duration: 12 },
  { label: "NOAA-20", color: "bg-amber-600", start: 0 * 60 + 40, duration: 12 },
  { label: "NOAA-20", color: "bg-amber-600", start: 12 * 60 + 40, duration: 12 },
  { label: "NOAA-21", color: "bg-yellow-700", start: 2 * 60, duration: 12 },
  { label: "NOAA-21", color: "bg-yellow-700", start: 14 * 60, duration: 12 },
  { label: "Terra", color: "bg-emerald-600", start: 10 * 60 + 30, duration: 12 },
  { label: "Terra", color: "bg-emerald-600", start: 22 * 60 + 30, duration: 12 },
  { label: "Aqua", color: "bg-teal-600", start: 13 * 60 + 30, duration: 12 },
  { label: "Aqua", color: "bg-teal-600", start: 1 * 60 + 30, duration: 12 },
];

// Matches isSatellitePassLikely in lib/formatDate.ts: 10h-17h and 0h-5h.
const NRT_WINDOWS = [
  { start: 0, duration: 5 * 60 },
  { start: 10 * 60, duration: 7 * 60 },
];

function pct(minutes: number): string {
  return `${(minutes / (24 * 60)) * 100}%`;
}

export default function SatelliteTimeline() {
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    setNowMinutes(parisMinutesNow());
    const id = setInterval(() => setNowMinutes(parisMinutesNow()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const hourMarks = [0, 6, 12, 18];

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Passages satellite sur 24h (heure de Paris)
        </p>
        {nowMinutes !== null && (
          <p className="text-[11px] font-mono text-sky-700 dark:text-sky-400">
            maintenant {String(Math.floor(nowMinutes / 60)).padStart(2, "0")}:
            {String(nowMinutes % 60).padStart(2, "0")}
          </p>
        )}
      </div>

      <div className="relative h-6">
        {NRT_WINDOWS.map((w, i) => (
          <div
            key={i}
            className="absolute top-0 h-full rounded bg-sky-100 dark:bg-sky-950"
            style={{ left: pct(w.start), width: pct(w.duration) }}
          />
        ))}
        {PASSES.map((p, i) => (
          <div
            key={i}
            className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${p.color}`}
            style={{ left: pct(p.start), width: pct(p.duration) }}
          />
        ))}
        {nowMinutes !== null && (
          <div
            className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-red-600 dark:bg-red-500"
            style={{ left: pct(nowMinutes) }}
          >
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-600 dark:bg-red-500" />
          </div>
        )}
      </div>

      <div className="relative mt-1 h-4 text-[10px] text-zinc-500 dark:text-zinc-400">
        {hourMarks.map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2 font-mono"
            style={{ left: pct(h * 60) }}
          >
            {h}h
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-600" /> SNPP
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-600" /> NOAA-20
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-700" /> NOAA-21
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600" /> Terra (MODIS)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-600" /> Aqua (MODIS)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded bg-sky-100 dark:bg-sky-950" /> Fenêtre de publication (polling 10 min)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-600" /> Heure actuelle
        </span>
      </div>
    </div>
  );
}
