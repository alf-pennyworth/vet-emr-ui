import { promises as fs } from "fs";
import { join } from "path";

export type OutcomeStatus = "improving" | "stable" | "worsening" | "resolved" | "unknown";
export type OutcomeMetricType = "weight" | "glucose" | "temperature" | "pain_score" | "mobility_score" | "custom";

export interface OutcomeMetric {
  id: string;
  type: OutcomeMetricType;
  label: string;
  unit?: string;
  value: number;
  timestamp: string; // ISO
  recordedBy: string;
  source: "visit" | "lab" | "owner_report" | "device";
  visitId?: string;
  note?: string;
}

export interface TreatmentPlan {
  id: string;
  diagnosis: string;
  medications: { name: string; dosage: string; frequency: string; startDate: string; endDate?: string }[];
  procedures: string[];
  recommendations: string[];
  startDate: string;
  targetEndDate?: string;
  status: "active" | "completed" | "discontinued";
}

export interface OutcomeTimelineEntry {
  id: string;
  patientId: string;
  date: string;
  type: "diagnosis" | "treatment_start" | "follow_up" | "milestone" | "relapse" | "resolution";
  title: string;
  description?: string;
  vet: string;
  metrics: OutcomeMetric[];
  linkedCaseIds?: string[]; // longitudinal linking
  treatmentPlanId?: string;
}

export interface PatientOutcomeSummary {
  patientId: string;
  patientName: string;
  timeline: OutcomeTimelineEntry[];
  latestStatus: OutcomeStatus;
  openTreatmentPlans: TreatmentPlan[];
}

const OUTCOMES_DIR = process.env.OUTCOMES_DIR || "./outcomes";
const OUTCOMES_FILE = join(OUTCOMES_DIR, "outcomes.jsonl");
const PLANS_FILE = join(OUTCOMES_DIR, "plans.jsonl");

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch { /* noop */ }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function storeTimelineEntry(entry: Omit<OutcomeTimelineEntry, "id">): Promise<OutcomeTimelineEntry> {
  await ensureDir(OUTCOMES_DIR);
  const fullEntry: OutcomeTimelineEntry = { ...entry, id: generateId() };
  const line = JSON.stringify(fullEntry) + "\n";
  await fs.appendFile(OUTCOMES_FILE, line, "utf-8");
  return fullEntry;
}

export async function storeTreatmentPlan(plan: Omit<TreatmentPlan, "id">): Promise<TreatmentPlan> {
  await ensureDir(OUTCOMES_DIR);
  const fullPlan: TreatmentPlan = { ...plan, id: generateId() };
  const line = JSON.stringify(fullPlan) + "\n";
  await fs.appendFile(PLANS_FILE, line, "utf-8");
  return fullPlan;
}

export async function listTimelineEntries(patientId?: string): Promise<OutcomeTimelineEntry[]> {
  await ensureDir(OUTCOMES_DIR);
  try {
    const raw = await fs.readFile(OUTCOMES_FILE, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const entries: OutcomeTimelineEntry[] = lines.map((l) => JSON.parse(l));
    let result = entries;
    if (patientId) result = result.filter((e) => e.patientId === patientId);
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export async function listTreatmentPlans(patientId?: string): Promise<TreatmentPlan[]> {
  await ensureDir(OUTCOMES_DIR);
  try {
    const raw = await fs.readFile(PLANS_FILE, "utf-8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const plans: TreatmentPlan[] = lines.map((l) => JSON.parse(l));
    // Plans are stored globally; caller filters by patient via timeline linkage
    return plans;
  } catch {
    return [];
  }
}

export async function getPatientOutcomeSummary(patientId: string, patientName: string): Promise<PatientOutcomeSummary | null> {
  const timeline = await listTimelineEntries(patientId);
  if (timeline.length === 0) return null;

  const allPlans = await listTreatmentPlans();
  const planIds = new Set(timeline.map((t) => t.treatmentPlanId).filter(Boolean) as string[]);
  const openTreatmentPlans = allPlans.filter((p) => planIds.has(p.id) && p.status === "active");

  // Derive latest status from most recent milestone/follow_up entry
  const recent = timeline.find((t) => t.type === "follow_up" || t.type === "milestone" || t.type === "resolution");
  let latestStatus: OutcomeStatus = "unknown";
  if (recent) {
    const noteLower = (recent.description || "").toLowerCase();
    if (recent.type === "resolution") latestStatus = "resolved";
    else if (noteLower.includes("besser") || noteLower.includes("improving") || noteLower.includes("verbesserung")) latestStatus = "improving";
    else if (noteLower.includes("schlechter") || noteLower.includes("worsening") || noteLower.includes("verschlechterung")) latestStatus = "worsening";
    else latestStatus = "stable";
  }

  return { patientId, patientName, timeline, latestStatus, openTreatmentPlans };
}

// Analytics helpers
export interface CohortOutcome {
  diagnosis: string;
  totalPatients: number;
  avgTimeToResolutionDays?: number;
  statusDistribution: Record<OutcomeStatus, number>;
}

export async function getCohortOutcomesByDiagnosis(): Promise<CohortOutcome[]> {
  const timeline = await listTimelineEntries();
  const byDiagnosis: Record<string, { patientIds: Set<string>; entries: OutcomeTimelineEntry[] }> = {};

  for (const entry of timeline) {
    if (entry.type === "diagnosis") {
      if (!byDiagnosis[entry.title]) byDiagnosis[entry.title] = { patientIds: new Set(), entries: [] };
      byDiagnosis[entry.title].patientIds.add(entry.patientId);
      byDiagnosis[entry.title].entries.push(entry);
    }
  }

  const results: CohortOutcome[] = [];
  for (const [diagnosis, data] of Object.entries(byDiagnosis)) {
    const resolutions = data.entries.filter((e) => e.type === "resolution");
    const times = resolutions.map((r) => {
      const diag = data.entries.find((e) => e.date < r.date);
      if (!diag) return 0;
      return (new Date(r.date).getTime() - new Date(diag.date).getTime()) / (1000 * 60 * 60 * 24);
    }).filter((t) => t > 0);

    const statusDistribution: Record<string, number> = {};
    for (const e of data.entries) {
      const s = e.type === "resolution" ? "resolved" : "stable";
      statusDistribution[s] = (statusDistribution[s] || 0) + 1;
    }

    results.push({
      diagnosis,
      totalPatients: data.patientIds.size,
      avgTimeToResolutionDays: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : undefined,
      statusDistribution,
    });
  }
  return results;
}
