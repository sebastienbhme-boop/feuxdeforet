import { NextRequest, NextResponse } from "next/server";
import { getFires } from "@/lib/getFires";
import { reverseGeocodeNearbyCity } from "@/lib/reverseGeocode";
import type { FirePoint } from "@/lib/types";

// GPS coordinates mean nothing to readers; group fires into rough ~100km
// areas and name each group after the nearest well-known city instead of
// listing raw lat/lon per detection.
const GRID_DEGREES = 1; // ~111km of latitude

function clusterKey(fire: FirePoint): string {
  const day = fire.acquiredAt.slice(0, 10);
  const gridLat = Math.round(fire.lat / GRID_DEGREES) * GRID_DEGREES;
  const gridLon = Math.round(fire.lon / GRID_DEGREES) * GRID_DEGREES;
  return `${gridLat},${gridLon},${day}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function googleSearchUrl(place: string) {
  const query = `feu de forêt ${place} incendie actualités, chronologie de la progression classée par date puis heure par heure de la plus récente à la plus ancienne, et trouve des vidéos TikTok et YouTube montrant ce sinistre`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`;
}

export async function GET(request: NextRequest) {
  const { fires } = await getFires();
  const siteUrl = new URL("/", request.url).toString().replace(/\/$/, "");

  const clusters = new Map<string, FirePoint[]>();
  for (const fire of fires) {
    const key = clusterKey(fire);
    const group = clusters.get(key);
    if (group) {
      group.push(fire);
    } else {
      clusters.set(key, [fire]);
    }
  }

  const groups = [...clusters.values()]
    .map((group) => ({
      group,
      latest: group.reduce((a, b) => (a.acquiredAt > b.acquiredAt ? a : b)),
    }))
    .sort((a, b) => (a.latest.acquiredAt < b.latest.acquiredAt ? 1 : -1))
    .slice(0, 8);

  // Nominatim is rate-limited (~1 req/s), so resolve places sequentially.
  // The route is cached 10min (see headers below), so this only runs at
  // most once every 10 minutes, not per visitor — one geocode per ~100km
  // area instead of per fire keeps this well within that budget.
  const places: string[] = [];
  for (const { latest } of groups) {
    if (latest.placeName) {
      places.push(latest.placeName);
      continue;
    }
    const resolved = await reverseGeocodeNearbyCity(latest.lat, latest.lon);
    places.push(resolved ?? `${latest.lat.toFixed(2)}, ${latest.lon.toFixed(2)}`);
    await new Promise((r) => setTimeout(r, 1100));
  }

  const itemsXml = groups
    .map(({ group, latest }, i) => {
      const place = places[i];
      const title =
        group.length > 1
          ? `${group.length} foyers détectés vers ${place}`
          : `Foyer détecté vers ${place}`;
      const pubDate = new Date(latest.acquiredAt).toUTCString();
      const maxFrp = Math.max(...group.map((f) => f.frp ?? 0));
      const description = [
        `Sources : ${[...new Set(group.map((f) => f.source))].join(", ")}`,
        maxFrp > 0 ? `Puissance radiative max : ${maxFrp} MW` : null,
      ]
        .filter(Boolean)
        .join(" — ");

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(googleSearchUrl(place))}</link>
      <guid isPermaLink="false">${escapeXml(latest.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feux de forêt en direct</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Nouveaux foyers de feux de forêt détectés par satellite en France</description>
    <language>fr</language>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=60",
    },
  });
}
