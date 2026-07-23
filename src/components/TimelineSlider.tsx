"use client";

import { useEffect, useRef, useState } from "react";
import { formatParisDateTime } from "@/lib/formatDate";

const STEP_MS = 60 * 60 * 1000; // 1 heure
const PLAY_INTERVAL_MS = 700; // real ms between each step while playing

export default function TimelineSlider({
  minTime,
  maxTime,
  value,
  onChange,
}: {
  minTime: number;
  maxTime: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const disabled = minTime >= maxTime;
  const [playing, setPlaying] = useState(false);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      const next = valueRef.current + STEP_MS;
      if (next >= maxTime) {
        onChange(maxTime);
        setPlaying(false);
      } else {
        onChange(next);
      }
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [playing, maxTime, onChange]);

  function togglePlay() {
    if (!playing && value >= maxTime) {
      onChange(minTime);
    }
    setPlaying((p) => !p);
  }

  return (
    <div className="flex items-center gap-3 border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
      <button
        onClick={togglePlay}
        disabled={disabled}
        className="rounded bg-orange-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        {playing ? "⏸ Pause" : "▶ Lecture"}
      </button>
      <span className="whitespace-nowrap text-xs text-zinc-500">
        {formatParisDateTime(new Date(minTime).toISOString())}
      </span>
      <input
        type="range"
        min={minTime}
        max={maxTime}
        step={STEP_MS}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          setPlaying(false);
          onChange(Number(e.target.value));
        }}
        className="flex-1 accent-orange-600"
      />
      <span className="whitespace-nowrap text-xs text-zinc-500">
        {formatParisDateTime(new Date(maxTime).toISOString())}
      </span>
      <span className="whitespace-nowrap rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-950 dark:text-orange-200">
        Affiché jusqu&apos;à {formatParisDateTime(new Date(value).toISOString())}
      </span>
    </div>
  );
}
