export type FireSource = "FIRMS" | "EFFIS";

export interface FirePoint {
  id: string;
  source: FireSource;
  lat: number;
  lon: number;
  acquiredAt: string; // ISO date
  confidence?: string;
  brightness?: number;
  frp?: number; // fire radiative power (MW), proxy for intensity
  satellite?: string;
  placeName?: string;
}
