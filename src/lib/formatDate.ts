const PARIS_TIME_ZONE = "Europe/Paris";

export function formatParisDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { timeZone: PARIS_TIME_ZONE });
}

export function formatParisTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: PARIS_TIME_ZONE });
}

// Rough day/night split (7h-21h = jour) instead of real sunrise/sunset — good
// enough for a visual map mode toggle without pulling in astronomical calculations.
export function isNightTime(timestamp: number): boolean {
  // "en-GB" with hourCycle "h23" yields a plain "HH" string (fr-FR appends " h").
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: PARIS_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(timestamp)),
  );
  return hour < 7 || hour >= 21;
}
