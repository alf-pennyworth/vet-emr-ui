# Domain Layer API Client

Thin transport layer for the VetVoice Domain Layer (VET-52, VET-111, VET-112).

## Design
- `client.ts` — generic fetch wrapper (`rpc`, `getJson`). Zero business logic.
- `patient.ts`, `encounter.ts`, `clinical-notes.ts`, `medication.ts`, `scheduling.ts` — per-domain adapters.
- Each adapter exposes typed, domain-scoped functions that call the backend via `/api/<domain>`.
- **No frontend writes directly to tables.** All writes go through API routes that forward to domain RPCs.

## Files
- `lib/api/client.ts`
- `lib/api/patient.ts`
- `lib/api/encounter.ts`
- `lib/api/clinical-notes.ts`
- `lib/api/medication.ts`
- `lib/api/scheduling.ts`
- `lib/api/index.ts`

## Usage
See `docs/PATIENT-DOMAIN-API.md` for complete integration examples.

Example:
```ts
import { searchPatients, createPatient } from "@/lib/api";
const patients = await searchPatients("luna");
```
