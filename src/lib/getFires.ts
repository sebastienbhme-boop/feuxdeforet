import { fetchFirmsFires } from "./firms";
import { fetchEffisFires } from "./effis";
import { DEMO_FIRES } from "./demoData";
import type { FirePoint } from "./types";

export async function getFires(): Promise<{
  fires: FirePoint[];
  demo: boolean;
  errors: { source: string; error: string }[];
}> {
  if (!process.env.FIRMS_MAP_KEY) {
    return { fires: DEMO_FIRES, demo: true, errors: [] };
  }

  const results = await Promise.allSettled([fetchFirmsFires(), fetchEffisFires()]);
  const fires = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const errors = results.flatMap((r, i) =>
    r.status === "rejected" ? [{ source: i === 0 ? "FIRMS" : "EFFIS", error: String(r.reason) }] : [],
  );
  return { fires, demo: false, errors };
}
