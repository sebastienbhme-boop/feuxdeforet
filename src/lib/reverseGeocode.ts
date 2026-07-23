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
