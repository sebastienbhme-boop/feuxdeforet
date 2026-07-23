import { NextResponse } from "next/server";
import { fetchFirmsFires } from "@/lib/firms";
import { fetchEffisFires } from "@/lib/effis";
import { DEMO_FIRES } from "@/lib/demoData";
import type { FirePoint } from "@/lib/types";

export async function GET() {
  if (!process.env.FIRMS_MAP_KEY) {
    return NextResponse.json({
      fires: DEMO_FIRES,
      errors: [],
      demo: true,
      updatedAt: new Date().toISOString(),
    });
  }

  const results = await Promise.allSettled([fetchFirmsFires(), fetchEffisFires()]);

  const fires: FirePoint[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );

  const errors = results
    .map((r, i) => (r.status === "rejected" ? { source: i === 0 ? "FIRMS" : "EFFIS", error: String(r.reason) } : null))
    .filter(Boolean);

  return NextResponse.json({ fires, errors, demo: false, updatedAt: new Date().toISOString() });
}
