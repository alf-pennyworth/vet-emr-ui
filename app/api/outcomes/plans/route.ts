import { NextRequest, NextResponse } from "next/server";
import { storeTreatmentPlan, getPatientOutcomeSummary } from "@/lib/outcomes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.patientId || !body?.diagnosis || !body?.startDate) {
      return NextResponse.json({ error: "Missing required fields: patientId, diagnosis, startDate" }, { status: 400 });
    }
    const plan = await storeTreatmentPlan(body);
    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (err: unknown) {
    console.error("Plan store error:", err);
    const message = err instanceof Error? err.message : "Store failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) {
      return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
    }
    const summary = await getPatientOutcomeSummary(patientId, "");
    return NextResponse.json({ success: true, data: summary });
  } catch (err: unknown) {
    console.error("Outcome summary error:", err);
    const message = err instanceof Error? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
