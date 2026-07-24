import { NextRequest, NextResponse } from "next/server";
import { getFires } from "@/lib/getFires";
import type { FirePoint } from "@/lib/types";

// Multiple satellites/sources often detect the same wildfire within a short
// window; group nearby same-day detections into one feed entry instead of
// flooding the feed with near-duplicates.
const GRID_PRECISION = 1; // ~11km at this latitude

function clusterKey(fire: FirePoint): string {
  const day = fire.acquiredAt.slice(0, 10);
  return `${fire.lat.toFixed(GRID_PRECISION)},${fire.lon.toFixed(GRID_PRECISION)},${day}`;
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

  const latestByCluster = new Map<string, FirePoint>();
  for (const fire of fires) {
    const key = clusterKey(fire);
    const current = latestByCluster.get(key);
    if (!current || fire.acquiredAt > current.acquiredAt) {
      latestByCluster.set(key, fire);
    }
  }

  const items = [...latestByCluster.values()]
    .sort((a, b) => (a.acquiredAt < b.acquiredAt ? 1 : -1))
    .slice(0, 100);

  const itemsXml = items
    .map((fire) => {
      const place = fire.placeName ?? `${fire.lat.toFixed(2)}, ${fire.lon.toFixed(2)}`;
      const title = `Foyer détecté près de ${place}`;
      const pubDate = new Date(fire.acquiredAt).toUTCString();
      const description = [
        `Source : ${fire.source}${fire.satellite ? ` (${fire.satellite})` : ""}`,
        fire.frp !== undefined ? `Puissance radiative : ${fire.frp} MW` : null,
      ]
        .filter(Boolean)
        .join(" — ");

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(googleSearchUrl(place))}</link>
      <guid isPermaLink="false">${escapeXml(fire.id)}</guid>
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
