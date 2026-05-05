import { NextRequest, NextResponse } from "next/server";
import { getAudioMetadata } from "@/lib/storage";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const record = await getAudioMetadata(params.id);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: record }, { status: 200 });
  } catch (err: unknown) {
    console.error("Audio status error:", err);
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
