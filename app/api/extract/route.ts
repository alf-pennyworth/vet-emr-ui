import { NextRequest, NextResponse } from "next/server";

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "ollama";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

const EXTRACTION_PROMPT = `You are a veterinary clinical data extraction engine. Given a transcript of a veterinary consultation, extract the following structured fields and return ONLY a JSON object with this exact shape:

{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "diagnosis": "string",
  "medications": [{"name":"string","dosage":"string","frequency":"string"}],
  "allergies": ["string"],
  "conditions": ["string"],
  "followUp": "string",
  "entities": [{"text":"string","type":"string"}]
}

Transcript:
"""
{{TRANSCRIPT}}
"""
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transcript = body?.transcript as string;
    const model = (body?.model as string) || "gemma3:12b";

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript text" }, { status: 400 });
    }

    const prompt = EXTRACTION_PROMPT.replace("{{TRANSCRIPT}}", transcript);

    const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You output only valid JSON. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama extraction failed: ${res.status} ${err}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if any
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data: parsed }, { status: 200 });
  } catch (err: unknown) {
    console.error("Extract error:", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
