"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { FirePoint } from "@/lib/types";
import { formatParisDateTime, formatParisTime, isNightTime, isSatellitePassLikely } from "@/lib/formatDate";
import TimelineSlider from "@/components/TimelineSlider";
import FaqModal from "@/components/FaqModal";

const FireMap = dynamic(() => import("@/components/FireMap"), { ssr: false });

export default function Home() {
  const [fires, setFires] = useState<FirePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [timelineValue, setTimelineValue] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/fires");
        const data = await res.json();
        const loadedFires: FirePoint[] = data.fires ?? [];
        setFires(loadedFires);
        setUpdatedAt(data.updatedAt ?? null);
        setDemo(Boolean(data.demo));
        // default to showing everything (latest point in time)
        if (loadedFires.length > 0) {
          const maxTime = Math.max(...loadedFires.map((f) => new Date(f.acquiredAt).getTime()));
          setTimelineValue(maxTime);
        }
      } finally {
        setLoading(false);
      }
    }
    load();

    // Poll every 10min during likely satellite pass windows (matches the
    // server-side cache TTL), and only once an hour otherwise as a safety
    // net — no point hammering the API when no new pass is expected.
    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      const delay = isSatellitePassLikely(Date.now()) ? 10 * 60 * 1000 : 60 * 60 * 1000;
      timeoutId = setTimeout(async () => {
        await load();
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const { minTime, maxTime } = useMemo(() => {
    if (fires.length === 0) {
      return { minTime: 0, maxTime: 0 };
    }
    const times = fires.map((f) => new Date(f.acquiredAt).getTime());
    return { minTime: Math.min(...times), maxTime: Math.max(...times) };
  }, [fires]);

  const visibleFires = useMemo(() => {
    if (timelineValue === null) return fires;
    return fires.filter((f) => new Date(f.acquiredAt).getTime() <= timelineValue);
  }, [fires, timelineValue]);

  const isNight = timelineValue !== null && isNightTime(timelineValue);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-orange-600">🔥 Feux de forêt en direct</h1>
          <p className="text-xs text-zinc-500">
            {loading
              ? "Chargement des foyers actifs…"
              : `${visibleFires.length}/${fires.length} foyer(s) affiché(s)${updatedAt ? ` · mis à jour ${formatParisTime(updatedAt)} (heure de Paris)` : ""}`}
          </p>
        </div>
        <button
          onClick={() => setFaqOpen(true)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          FAQ
        </button>
      </header>
      {faqOpen && <FaqModal onClose={() => setFaqOpen(false)} />}
      {demo && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Mode démonstration : aucune clé API n&apos;est configurée, les données affichées sont fictives.
          Voir le <span className="font-mono">README.md</span> pour configurer <span className="font-mono">FIRMS_MAP_KEY</span>.
        </div>
      )}
      {!demo && !loading && maxTime > 0 && (
        <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
          Dernière détection satellite disponible : {formatParisDateTime(new Date(maxTime).toISOString())}.
          Les satellites VIIRS survolent la France environ 2 fois par jour ; ce n&apos;est pas un flux continu, les données arrivent par paquets à chaque passage.
        </div>
      )}
      <main className="flex flex-1 overflow-hidden">
        <FireMap fires={visibleFires} isNight={isNight} />
      </main>
      {fires.length > 0 && timelineValue !== null && (
        <TimelineSlider
          minTime={minTime}
          maxTime={maxTime}
          value={timelineValue}
          onChange={setTimelineValue}
        />
      )}
    </div>
  );
}
