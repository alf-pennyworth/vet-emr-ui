import { promises as fs } from "fs";
import { join } from "path";

export interface CorrectionEntry {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  field: "subjective" | "objective" | "assessment" | "plan";
  original: string;
  corrected: string;
  vet: string;
  timestamp: string;
  modelDatasetEntry?: {
    instruction: string;
    input: string;
    target: string;
    field: string;
    context: string;
  };
}

export interface CorrectionPayload {
  visitId: string;
  patientId: string;
  patientName: string;
  vet: string;
  corrections: {
    field: CorrectionEntry["field"];
    original: string;
    corrected: string;
    timestamp: string;
  }[];
  note: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    vet: string;
    date: string;
  };
}

const CORRECTIONS_DIR = process.env.CORRECTIONS_DIR || "./corrections";
const CORRECTIONS_FILE = join(CORRECTIONS_DIR, "corrections.jsonl");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    /* noop */
  }
}

function ensureId(patientId: string, visitId: string, index: number): string {
  return `${patientId}-${visitId}-${Date.now()}-${index}`;
}

export async function storeCorrection(payload: CorrectionPayload): Promise<CorrectionEntry[]> {
  await ensureDir(CORRECTIONS_DIR);
  const entries: CorrectionEntry[] = payload.corrections.map((c, i) => ({
    id: ensureId(payload.patientId, payload.visitId, i),
    visitId: payload.visitId,
    patientId: payload.patientId,
    patientName: payload.patientName,
    field: c.field,
    original: c.original,
    corrected: c.corrected,
    vet: payload.vet,
    timestamp: c.timestamp,
    modelDatasetEntry: {
      instruction: `Correct the veterinary SOAP ${c.field} field for patient ${payload.patientName} (visit ${payload.visitId}).`,
      input: c.original,
      target: c.corrected,
      field: c.field,
      context: JSON.stringify({
        patientName: payload.patientName,
        vet: payload.vet,
        visitDate: payload.note.date,
        subjective: payload.note.subjective,
        objective: payload.note.objective,
        assessment: payload.note.assessment,
        plan: payload.note.plan,
      }),
    },
  }));

  const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await fs.appendFile(CORRECTIONS_FILE, lines, "utf-8");
  return entries;
}

export async function listCorrections(filters?: { patientId?: string; visitId?: string }): Promise<CorrectionEntry[]> {
  await ensureDir(CORRECTIONS_DIR);
  try {
    const raw = await fs.readFile(CORRECTIONS_FILE, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const entries: CorrectionEntry[] = lines.map((l) => JSON.parse(l));
    let result = entries;
    if (filters?.patientId) result = result.filter((e) => e.patientId === filters.patientId);
    if (filters?.visitId) result = result.filter((e) => e.visitId === filters.visitId);
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

export async function getCorrectionStats(patientId?: string): Promise<{ total: number; byField: Record<string, number> }> {
  const all = await listCorrections(patientId ? { patientId } : undefined);
  const byField: Record<string, number> = {};
  for (const entry of all) {
    byField[entry.field] = (byField[entry.field] || 0) + 1;
  }
  return { total: all.length, byField };
}
