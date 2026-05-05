import { promises as fs } from "fs";
import { join } from "path";

export type ReminderStatus = "pending" | "sent" | "completed" | "dismissed" | "overdue";
export type ReminderPriority = "low" | "medium" | "high" | "critical";
export type TriggerType = "auto_diagnosis" | "auto_treatment" | "manual";

export interface FollowUpReminder {
  id: string;
  clinicId: string;
  patientId: string;
  encounterId?: string;
  triggerType: TriggerType;
  triggerDetail?: string;
  scheduledAt: string; // ISO
  completedAt?: string;
  dismissedAt?: string;
  title: string;
  description?: string;
  priority: ReminderPriority;
  assignedTo?: string;
  status: ReminderStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpRule {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  diagnosisPattern?: string;
  treatmentPattern?: string;
  speciesFilter?: string[];
  daysAfterEncounter: number;
  priority: ReminderPriority;
  titleTemplate: string;
  descriptionTemplate?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = process.env.DATA_DIR || "./data";
const REMINDERS_FILE = join(DATA_DIR, "follow_up_reminders.jsonl");
const RULES_FILE = join(DATA_DIR, "follow_up_rules.jsonl");

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch { /* noop */ }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

async function appendJsonl(filePath: string, obj: unknown) {
  await ensureDir(DATA_DIR);
  const line = JSON.stringify(obj) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

async function rewriteJsonl(filePath: string, items: unknown[]) {
  await ensureDir(DATA_DIR);
  const lines = items.map((i) => JSON.stringify(i)).join("\n") + "\n";
  await fs.writeFile(filePath, lines, "utf-8");
}

// ---- Reminders ----

export async function createFollowUpReminder(
  input: Omit<FollowUpReminder, "id" | "createdAt" | "updatedAt">
): Promise<FollowUpReminder> {
  const now = new Date().toISOString();
  const reminder: FollowUpReminder = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await appendJsonl(REMINDERS_FILE, reminder);
  return reminder;
}

export async function listFollowUpReminders(
  filters?: { patientId?: string; clinicId?: string; status?: ReminderStatus }
): Promise<FollowUpReminder[]> {
  let items = await readJsonl<FollowUpReminder>(REMINDERS_FILE);
  if (filters?.patientId) items = items.filter((i) => i.patientId === filters.patientId);
  if (filters?.clinicId) items = items.filter((i) => i.clinicId === filters.clinicId);
  if (filters?.status) items = items.filter((i) => i.status === filters.status);
  return items.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export async function updateFollowUpReminder(
  id: string,
  patch: Partial<Omit<FollowUpReminder, "id" | "createdAt">>
): Promise<FollowUpReminder | null> {
  const items = await readJsonl<FollowUpReminder>(REMINDERS_FILE);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
  await rewriteJsonl(REMINDERS_FILE, items);
  return items[idx];
}

export async function deleteFollowUpReminder(id: string): Promise<boolean> {
  const items = await readJsonl<FollowUpReminder>(REMINDERS_FILE);
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  await rewriteJsonl(REMINDERS_FILE, filtered);
  return true;
}

// ---- Rules ----

export async function listFollowUpRules(clinicId?: string): Promise<FollowUpRule[]> {
  let items = await readJsonl<FollowUpRule>(RULES_FILE);
  if (clinicId) items = items.filter((i) => i.clinicId === clinicId);
  return items.filter((i) => i.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function seedDefaultRules(clinicId: string): Promise<FollowUpRule[]> {
  const existing = await listFollowUpRules(clinicId);
  if (existing.length > 0) return existing;

  const defaults: Omit<FollowUpRule, "id" | "createdAt" | "updatedAt">[] = [
    {
      clinicId,
      name: "Post-surgical follow-up",
      description: "Automatic reminder after surgical procedures",
      diagnosisPattern: "%surgery%",
      daysAfterEncounter: 3,
      priority: "high",
      titleTemplate: "Post-surgical check-in",
      descriptionTemplate: "Please schedule a follow-up to assess recovery after recent surgery.",
      isActive: true,
      sortOrder: 1,
    },
    {
      clinicId,
      name: "Chronic condition monitoring",
      description: "Periodic reminder for chronic condition management",
      diagnosisPattern: "%chronic%",
      daysAfterEncounter: 30,
      priority: "medium",
      titleTemplate: "Chronic condition review",
      descriptionTemplate: "Time for scheduled chronic condition review and medication check.",
      isActive: true,
      sortOrder: 2,
    },
    {
      clinicId,
      name: "Vaccination booster",
      description: "Reminder for upcoming vaccination booster",
      treatmentPattern: "%vaccine%",
      daysAfterEncounter: 21,
      priority: "low",
      titleTemplate: "Vaccination booster due",
      descriptionTemplate: "Upcoming vaccination booster dose is approaching due date.",
      isActive: true,
      sortOrder: 3,
    },
  ];

  const now = new Date().toISOString();
  const created: FollowUpRule[] = [];
  for (const d of defaults) {
    const rule: FollowUpRule = { ...d, id: generateId(), createdAt: now, updatedAt: now };
    await appendJsonl(RULES_FILE, rule);
    created.push(rule);
  }
  return created;
}

export async function upsertFollowUpRule(
  rule: Omit<FollowUpRule, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<FollowUpRule> {
  const items = await readJsonl<FollowUpRule>(RULES_FILE);
  const now = new Date().toISOString();
  if (rule.id) {
    const idx = items.findIndex((i) => i.id === rule.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...rule, updatedAt: now };
      await rewriteJsonl(RULES_FILE, items);
      return items[idx];
    }
  }
  const created: FollowUpRule = { ...rule, id: generateId(), createdAt: now, updatedAt: now };
  await appendJsonl(RULES_FILE, created);
      return created;
}

export async function deleteFollowUpRule(id: string): Promise<boolean> {
  const items = await readJsonl<FollowUpRule>(RULES_FILE);
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  await rewriteJsonl(RULES_FILE, filtered);
  return true;
}

export async function updateFollowUpRule(
  id: string,
  patch: Partial<Omit<FollowUpRule, "id" | "createdAt">>
): Promise<FollowUpRule | null> {
  const items = await readJsonl<FollowUpRule>(RULES_FILE);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
  await rewriteJsonl(RULES_FILE, items);
  return items[idx];
}

// ---- Auto-generation ----

export interface EncounterLike {
  id: string;
  clinicId: string;
  patientId: string;
  diagnosisCodes?: string[];
  soapPlan?: string;
  species?: string;
}

export async function generateFollowUpReminders(encounter: EncounterLike): Promise<FollowUpReminder[]> {
  const rules = await listFollowUpRules(encounter.clinicId);
  if (rules.length === 0) {
    await seedDefaultRules(encounter.clinicId);
    rules.push(...await listFollowUpRules(encounter.clinicId));
  }

  const created: FollowUpReminder[] = [];
  for (const rule of rules) {
    let diagMatch = false;
    if (!rule.diagnosisPattern || rule.diagnosisPattern === "") diagMatch = true;
    else if (encounter.diagnosisCodes && encounter.diagnosisCodes.some((c) => c.toLowerCase().includes(rule.diagnosisPattern!.replace(/%/g, "").toLowerCase()))) {
      diagMatch = true;
    }

    let treatMatch = false;
    if (!rule.treatmentPattern || rule.treatmentPattern === "") treatMatch = true;
    else if (encounter.soapPlan && encounter.soapPlan.toLowerCase().includes(rule.treatmentPattern.replace(/%/g, "").toLowerCase())) {
      treatMatch = true;
    }

    let speciesMatch = false;
    if (!rule.speciesFilter || rule.speciesFilter.length === 0) speciesMatch = true;
    else if (encounter.species && rule.speciesFilter.includes(encounter.species)) speciesMatch = true;

    if (diagMatch && treatMatch && speciesMatch) {
      const scheduledAt = new Date(Date.now() + rule.daysAfterEncounter * 24 * 60 * 60 * 1000).toISOString();
      const reminder = await createFollowUpReminder({
        clinicId: encounter.clinicId,
        patientId: encounter.patientId,
        encounterId: encounter.id,
        triggerType: "auto_diagnosis",
        triggerDetail: rule.name,
        scheduledAt,
        title: rule.titleTemplate,
        description: rule.descriptionTemplate,
        priority: rule.priority,
        status: "pending",
      });
      created.push(reminder);
    }
  }
  return created;
}
