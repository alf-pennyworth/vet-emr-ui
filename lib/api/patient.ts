// lib/api/patient.ts — Patient Domain adapter
// Thin wrapper around /api/patient RPC routes.
// Business logic stays in the backend; this file is transport-only.

import { rpc } from "./client";

export interface PatientSummary {
  id: string;
  clinic_id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  date_of_birth: string;
  color: string;
  identification: string;
  patient_status: string;
  weight_kg: number;
  neutered: boolean;
  reproductive_status: string;
  insurance_provider: string;
  registration_date: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  conditions: unknown[];
  allergies: unknown[];
  vaccinations: unknown[];
  weight_history: unknown[];
  encounters: unknown[];
  created_at: string;
  updated_at: string;
}

export interface UpsertPatientPayload {
  patient_id?: string;
  clinic_id?: string;
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  date_of_birth?: string; // ISO date
  color?: string;
  identification?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  owner_address?: string;
  notes?: string;
  notes_internal?: string;
}

export interface UpsertPatientResult {
  patient_id: string;
  owner_id?: string;
}

export interface UpsertWeightPayload {
  patient_id: string;
  weight_kg: number;
  bcs?: number; // 1–9
  notes?: string;
}

export interface UpsertWeightResult {
  weight_id: string;
}

/** Fuzzy patient search by name, species, or owner. */
export async function searchPatients(query: string): Promise<PatientSummary[]> {
  return rpc<PatientSummary[]>("/patient/search", { query });
}

/** Atomic patient + owner upsert. */
export async function upsertPatient(payload: UpsertPatientPayload): Promise<UpsertPatientResult> {
  return rpc<UpsertPatientResult>("/patient", payload);
}

/** Record a new weight measurement for a patient. */
export async function upsertPatientWeight(payload: UpsertWeightPayload): Promise<UpsertWeightResult> {
  return rpc<UpsertWeightResult>("/patient/weight", payload);
}

/** Fetch a single patient by id (uses search with exact id under the hood). */
export async function getPatient(patientId: string): Promise<PatientSummary | null> {
  const results = await searchPatients(patientId);
  return results.find((p) => p.id === patientId) ?? null;
}
