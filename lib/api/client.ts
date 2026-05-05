// lib/api/client.ts
// Base client for VetVoice Domain Layer.
// All frontend communication goes through this layer.
// No business logic lives here—just transport.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export async function rpc<T = unknown>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RPC ${path} failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}

export async function getJson<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<T>;
}
