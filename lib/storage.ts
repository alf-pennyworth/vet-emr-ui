import { promises as fs } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { AudioUploadMetadata } from "./audio-metadata";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";
const META_FILE = join(UPLOADS_DIR, "audio-metadata.json");

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // noop
  }
}

async function loadMeta(): Promise<Record<string, AudioUploadMetadata>> {
  await ensureDir(UPLOADS_DIR);
  try {
    const raw = await fs.readFile(META_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, AudioUploadMetadata>;
  } catch {
    return {};
  }
}

async function saveMeta(meta: Record<string, AudioUploadMetadata>) {
  await ensureDir(UPLOADS_DIR);
  await fs.writeFile(META_FILE, JSON.stringify(meta, null, 2), "utf-8");
}

export async function storeAudioBlob(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  metadata: Omit<AudioUploadMetadata, "id" | "storageKey" | "sizeBytes" | "createdAt" | "updatedAt" | "status" | "originalName" | "mimeType">
): Promise<AudioUploadMetadata> {
  await ensureDir(UPLOADS_DIR);
  const id = randomUUID();
  const ext = originalName.split(".").pop() || "bin";
  const storageKey = `${id}.${ext}`;
  const filePath = join(UPLOADS_DIR, storageKey);
  await fs.writeFile(filePath, buffer);

  const record: AudioUploadMetadata = {
    id,
    clinicId: metadata.clinicId,
    patientId: metadata.patientId,
    sessionId: metadata.sessionId,
    originalName,
    mimeType,
    sizeBytes: buffer.length,
    storageKey,
    status: "uploaded",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const registry = await loadMeta();
  registry[id] = record;
  await saveMeta(registry);
  return record;
}

export async function getAudioMetadata(id: string): Promise<AudioUploadMetadata | null> {
  const registry = await loadMeta();
  return registry[id] || null;
}

export async function listAudioMetadata(options?: { clinicId?: string; patientId?: string }): Promise<AudioUploadMetadata[]> {
  const registry = await loadMeta();
  let values = Object.values(registry);
  if (options?.clinicId) values = values.filter((v) => v.clinicId === options.clinicId);
  if (options?.patientId) values = values.filter((v) => v.patientId === options.patientId);
  return values.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateAudioStatus(
  id: string,
  status: AudioUploadMetadata["status"]
): Promise<AudioUploadMetadata | null> {
  const registry = await loadMeta();
  const record = registry[id];
  if (!record) return null;
  record.status = status;
  record.updatedAt = new Date().toISOString();
  registry[id] = record;
  await saveMeta(registry);
  return record;
}

export async function deleteAudio(id: string): Promise<boolean> {
  const registry = await loadMeta();
  const record = registry[id];
  if (!record) return false;
  delete registry[id];
  await saveMeta(registry);
  try {
    await fs.unlink(join(UPLOADS_DIR, record.storageKey));
  } catch {
    // ignore cleanup errors
  }
  return true;
}
