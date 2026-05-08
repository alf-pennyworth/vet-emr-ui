import { NextRequest, NextResponse } from "next/server";

const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing transcript id" }, { status: 400 });
    }

    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { Authorization: ASSEMBLY_API_KEY },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AssemblyAI status failed: ${err}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    console.error("Transcript status error:", err);
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
