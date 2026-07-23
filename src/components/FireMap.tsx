"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { FirePoint } from "@/lib/types";
import { formatParisDateTime } from "@/lib/formatDate";
import { reverseGeocode } from "@/lib/reverseGeocode";

const FRANCE_CENTER: [number, number] = [46.6, 2.5];

function intensityColor(fire: FirePoint) {
  if (fire.frp !== undefined) {
    if (fire.frp > 100) return "#7f1d1d";
    if (fire.frp > 30) return "#dc2626";
    if (fire.frp > 10) return "#f97316";
    return "#facc15";
  }
  return "#f97316";
}

function googleSearchUrl(place: string) {
  const query = `feu de forêt ${place} incendie actualités, et trouve des vidéos TikTok et YouTube montrant ce sinistre`;
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

function FireMarker({ fire }: { fire: FirePoint }) {
  const [resolvedPlace, setResolvedPlace] = useState<string | null>(fire.placeName ?? null);

  const place = resolvedPlace ?? `${fire.lat.toFixed(2)}, ${fire.lon.toFixed(2)}`;

  return (
    <CircleMarker
      center={[fire.lat, fire.lon]}
      radius={7}
      pathOptions={{ color: intensityColor(fire), fillColor: intensityColor(fire), fillOpacity: 0.8 }}
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
          <p>Source : {fire.source}</p>
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

export default function FireMap({ fires, isNight = false }: { fires: FirePoint[]; isNight?: boolean }) {
  return (
    <MapContainer center={FRANCE_CENTER} zoom={6} className="h-full w-full">
      {isNight ? (
        <TileLayer
          key="dark"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
      ) : (
        <TileLayer
          key="light"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      {fires.length > 0 && <FitToData fires={fires} />}
      {fires.map((fire) => (
        <FireMarker key={fire.id} fire={fire} />
      ))}
    </MapContainer>
  );
}
