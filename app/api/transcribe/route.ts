import { NextRequest, NextResponse } from "next/server";

const ASSEMBLY_API_KEY = process.env.ASSEMBLYAI_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "de";
    const audioUrlParam = formData.get("audio_url") as string | null;

    if (!file && !audioUrlParam) {
      return NextResponse.json({ error: "Missing audio file or audio_url" }, { status: 400 });
    }

    let audioUrl = audioUrlParam;

    if (file) {
      const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: { Authorization: ASSEMBLY_API_KEY },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("AssemblyAI upload failed");
      const uploadJson = await uploadRes.json();
      audioUrl = uploadJson.upload_url;
    }

    if (!audioUrl) {
      return NextResponse.json({ error: "No audio URL available" }, { status: 400 });
    }

    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: ASSEMBLY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: language === "de" ? "de" : "en_us",
        punctuate: true,
        format_text: true,
        speaker_labels: false,
        entity_detection: true,
      }),
    });

    if (!transcriptRes.ok) {
      const err = await transcriptRes.text();
      throw new Error(`AssemblyAI transcript request failed: ${err}`);
    }

    const transcript = await transcriptRes.json();
    return NextResponse.json({ success: true, data: transcript }, { status: 201 });
  } catch (err: unknown) {
    console.error("Transcribe error:", err);
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
