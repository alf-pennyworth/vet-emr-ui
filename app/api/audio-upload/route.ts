import { NextRequest, NextResponse } from "next/server";
import { storeAudioBlob, listAudioMetadata } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file || !file.name) {
      return NextResponse.json({ error: "Missing 'audio' file" }, { status: 400 });
    }

    const clinicId = formData.get("clinicId") as string | null;
    const patientId = formData.get("patientId") as string | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!clinicId || !patientId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: clinicId, patientId, sessionId" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const record = await storeAudioBlob(buffer, file.name, file.type || "application/octet-stream", {
      clinicId,
      patientId,
      sessionId,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: unknown) {
    console.error("Audio upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;
    const records = await listAudioMetadata({ clinicId, patientId });
    return NextResponse.json({ success: true, data: records }, { status: 200 });
  } catch (err: unknown) {
    console.error("Audio list error:", err);
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
