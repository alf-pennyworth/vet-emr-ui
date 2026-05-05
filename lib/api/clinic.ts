import { rpc } from "./client";

export interface ClinicProfileData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "veterinarian" | "technician" | "receptionist" | "admin";
}

export interface PreferencesData {
  timezone: string;
  currency: string;
  appointmentInterval: string;
}

export interface OnboardingPayload {
  profile: ClinicProfileData;
  staff: StaffMember[];
  preferences: PreferencesData;
}

export async function createClinic(payload: OnboardingPayload) {
  return rpc<{ clinicId: string }>("/clinic", payload);
}
