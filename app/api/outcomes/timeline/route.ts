import { NextRequest, NextResponse } from "next/server";
import { storeTimelineEntry, listTimelineEntries, OutcomeTimelineEntry } from "@/lib/outcomes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.patientId || !body?.date || !body?.type || !body?.title) {
      return NextResponse.json({ error: "Missing required fields: patientId, date, type, title" }, { status: 400 });
    }
    const entry = await storeTimelineEntry(body as Omit<OutcomeTimelineEntry, "id">);
    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (err: unknown) {
    console.error("Timeline store error:", err);
    const message = err instanceof Error ? err.message : "Store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || undefined;
    const entries = await listTimelineEntries(patientId);
    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (err: unknown) {
    console.error("Timeline list error:", err);
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
