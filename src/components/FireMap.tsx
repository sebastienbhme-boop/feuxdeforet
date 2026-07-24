"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { FirePoint } from "@/lib/types";
import { formatParisDateTime } from "@/lib/formatDate";
import { reverseGeocode } from "@/lib/reverseGeocode";

const FRANCE_CENTER: [number, number] = [46.6, 2.5];

// Fresh detections (within a few hours of the reference time) keep their
// full intensity color; older ones fade progressively to grey, so replaying
// the timeline shows points arrive in color and age into grey rather than
// flipping binarily. Tuned to reach full grey within the ~48h display
// window (DISPLAY_DAYS in lib/firms.ts) so the fade is actually visible.
const FRESH_HOURS = 6;
const FADE_HOURS = 24;
const GREY = [156, 163, 175] as const; // #9ca3af

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixWithGrey(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mr = Math.round(r + (GREY[0] - r) * t);
  const mg = Math.round(g + (GREY[1] - g) * t);
  const mb = Math.round(b + (GREY[2] - b) * t);
  return `rgb(${mr}, ${mg}, ${mb})`;
}

function baseIntensityColor(fire: FirePoint) {
  if (fire.frp !== undefined) {
    if (fire.frp > 100) return "#7f1d1d";
    if (fire.frp > 30) return "#dc2626";
    if (fire.frp > 10) return "#f97316";
    return "#facc15";
  }
  return "#f97316";
}

function intensityColor(fire: FirePoint, referenceTime: number) {
  const ageHours = (referenceTime - new Date(fire.acquiredAt).getTime()) / (1000 * 60 * 60);
  const fadeT = Math.min(1, Math.max(0, (ageHours - FRESH_HOURS) / FADE_HOURS));
  return mixWithGrey(baseIntensityColor(fire), fadeT);
}

function googleSearchUrl(place: string) {
  const query = `feu de forêt ${place} incendie actualités, chronologie de la progression classée par date puis heure par heure de la plus récente à la plus ancienne, et trouve des vidéos TikTok et YouTube montrant ce sinistre`;
  // udm=50 force l'ouverture directe du Mode IA de Google
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
}

function FitToData({ fires }: { fires: FirePoint[] }) {
  const map = useMap();
  // Only fit bounds once when data first arrives, not on every timeline change.
  useEffect(() => {
    if (fires.length === 0) return;
    const bounds = fires.map((f) => [f.lat, f.lon] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fires.length > 0]);
  return null;
}

function FireMarker({ fire, referenceTime }: { fire: FirePoint; referenceTime: number }) {
  const [resolvedPlace, setResolvedPlace] = useState<string | null>(fire.placeName ?? null);

  const place = resolvedPlace ?? `${fire.lat.toFixed(2)}, ${fire.lon.toFixed(2)}`;
  const color = intensityColor(fire, referenceTime);

  return (
    <CircleMarker
      center={[fire.lat, fire.lon]}
      radius={7}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
      eventHandlers={{
        click: () => {
          if (!resolvedPlace) {
            reverseGeocode(fire.lat, fire.lon).then((name) => {
              if (name) setResolvedPlace(name);
            });
          }
        },
      }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{place}</p>
          <p>Source : {fire.source}{fire.satellite ? ` (${fire.satellite})` : ""}</p>
          <p>Détecté : {formatParisDateTime(fire.acquiredAt)} (heure de Paris)</p>
          {fire.frp !== undefined && <p>Puissance radiative : {fire.frp} MW</p>}
          <div className="mt-2 flex justify-center">
            <a
              href={googleSearchUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-blue-600 px-2 py-1 text-white"
              style={{ color: "#ffffff", textDecoration: "none", display: "inline-block" }}
            >
              Recherche Google
            </a>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function FireMap({
  fires,
  referenceTime,
}: {
  fires: FirePoint[];
  referenceTime: number;
}) {
  return (
    <MapContainer center={FRANCE_CENTER} zoom={6} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fires.length > 0 && <FitToData fires={fires} />}
      {fires.map((fire) => (
        <FireMarker key={fire.id} fire={fire} referenceTime={referenceTime} />
      ))}
    </MapContainer>
  );
}
