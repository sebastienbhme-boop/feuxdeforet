const cache = new Map<string, string>();

interface NominatimResponse {
  address?: {
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
  };
}

// Nominatim (OpenStreetMap) reverse geocoding — free, no API key, but rate-limited
// to ~1 req/s. Only called on demand (user click), not for every fire on the map.
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    zoom: "10",
    "accept-language": "fr",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "User-Agent": "wildfire-tracker (usage personnel)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    const addr = data.address;
    const place =
      addr?.village ?? addr?.town ?? addr?.city ?? addr?.municipality ?? addr?.county ?? addr?.state ?? null;
    if (place) cache.set(key, place);
    return place;
  } catch {
    return null;
  }
}

const nearbyCityCache = new Map<string, string>();

// Same API, but zoomed out to city/county level so it resolves to a well-known
// nearby town instead of a tiny hamlet — used for grouping fires by rough area.
export async function reverseGeocodeNearbyCity(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  const cached = nearbyCityCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    zoom: "8",
    "accept-language": "fr",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "User-Agent": "wildfire-tracker (usage personnel)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    const addr = data.address;
    const place =
      addr?.city ?? addr?.town ?? addr?.municipality ?? addr?.county ?? addr?.state ?? addr?.village ?? null;
    if (place) nearbyCityCache.set(key, place);
    return place;
  } catch {
    return null;
  }
}
