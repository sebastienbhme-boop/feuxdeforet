import { NextResponse } from "next/server";
import { getFires } from "@/lib/getFires";

export async function GET() {
  const { fires, demo, errors } = await getFires();
  return NextResponse.json({ fires, errors, demo, updatedAt: new Date().toISOString() });
}
