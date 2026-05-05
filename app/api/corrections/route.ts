import { NextRequest, NextResponse } from "next/server";
import { storeCorrection, listCorrections, getCorrectionStats } from "@/lib/corrections";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.visitId || !body?.patientId || !Array.isArray(body.corrections)) {
      return NextResponse.json({ error: "Missing required fields: visitId, patientId, corrections[]" }, { status: 400 });
    }
    const entries = await storeCorrection(body);
    return NextResponse.json({ success: true, data: entries }, { status: 201 });
  } catch (err: unknown) {
    console.error("Correction store error:", err);
    const message = err instanceof Error ? err.message : "Store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || undefined;
    const visitId = searchParams.get("visitId") || undefined;
    const stats = searchParams.get("stats") === "true";

    if (stats) {
      const result = await getCorrectionStats(patientId);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    const entries = await listCorrections({ patientId, visitId });
    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (err: unknown) {
    console.error("Correction list error:", err);
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
