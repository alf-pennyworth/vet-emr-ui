export interface AudioUploadMetadata {
  id: string;
  clinicId: string;
  patientId: string;
  sessionId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  status: "uploaded" | "processing" | "completed" | "error";
  createdAt: string;
  updatedAt: string;
}
