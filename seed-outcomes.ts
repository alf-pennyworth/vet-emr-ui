import { storeTimelineEntry, storeTreatmentPlan, OutcomeTimelineEntry, TreatmentPlan } from "./lib/outcomes";

async function seed() {
  // Seed treatment plan for Luna (Hüftdysplasie)
  const plan1 = await storeTreatmentPlan({
    diagnosis: "Hüftdysplasie",
    medications: [{ name: "Carprofen", dosage: "75 mg", frequency: "Einmal täglich", startDate: "2025-03-01" }],
    procedures: ["Physiotherapie"],
    recommendations: ["Moderate Bewegung", "Gewichtskontrolle", "Nutze rutschfeste Böden"],
    startDate: "2025-03-01",
    targetEndDate: "2025-09-01",
    status: "active",
  });

  // Seed timeline entries for Luna
  await storeTimelineEntry({
    patientId: "101",
    date: "2025-03-01",
    type: "diagnosis",
    title: "Hüftdysplasie diagnostiziert",
    description: "Röntgenbestätigung, milder Befund.",
    vet: "Dr. Klaus Fischer",
    metrics: [
      { id: "m1", type: "mobility_score", label: "Mobility Score", value: 6, unit: "/10", timestamp: "2025-03-01T10:00:00Z", recordedBy: "Dr. Klaus Fischer", source: "visit", visitId: "v101-1" },
    ],
    treatmentPlanId: plan1.id,
  });

  await storeTimelineEntry({
    patientId: "101",
    date: "2025-09-15",
    type: "follow_up",
    title: "9-Monats-Kontrolle",
    description: "Mobilität verbessert, kein Schmerzverhalten.",
    vet: "Dr. Anna Weber",
    metrics: [
      { id: "m2", type: "mobility_score", label: "Mobility Score", value: 8, unit: "/10", timestamp: "2025-09-15T10:00:00Z", recordedBy: "Dr. Anna Weber", source: "visit", visitId: "v101-2" },
    ],
    linkedCaseIds: ["101-hip-2025"],
    treatmentPlanId: plan1.id,
  });

  // Seed treatment plan for Milo (Diabetes)
  const plan2 = await storeTreatmentPlan({
    diagnosis: "Diabetes mellitus",
    medications: [{ name: "Insulin Glargin", dosage: "2 IE", frequency: "Zweimal täglich", startDate: "2024-11-10" }],
    procedures: ["Fructosamin-Monitoring"],
    recommendations: ["Low-Carb-Diät", "Fütterung 2x täglich zur Insulingabe"],
    startDate: "2024-11-10",
    status: "active",
  });

  await storeTimelineEntry({
    patientId: "102",
    date: "2024-11-10",
    type: "diagnosis",
    title: "Diabetes mellitus",
    description: "Polyurie, Polydipsie, BG 420 mg/dL.",
    vet: "Dr. Klaus Fischer",
    metrics: [
      { id: "m3", type: "glucose", label: "Blood Glucose", value: 420, unit: "mg/dL", timestamp: "2024-11-10T09:00:00Z", recordedBy: "Dr. Klaus Fischer", source: "visit", visitId: "v102-1" },
    ],
    treatmentPlanId: plan2.id,
  });

  await storeTimelineEntry({
    patientId: "102",
    date: "2025-01-15",
    type: "follow_up",
    title: "3-Monats-Kontrolle",
    description: "BG stabilisiert, Gewicht +200g.",
    vet: "Dr. Anna Weber",
    metrics: [
      { id: "m4", type: "glucose", label: "Blood Glucose", value: 180, unit: "mg/dL", timestamp: "2025-01-15T09:00:00Z", recordedBy: "Dr. Anna Weber", source: "lab", visitId: "v102-2" },
    ],
    linkedCaseIds: ["102-dia-2024"],
    treatmentPlanId: plan2.id,
  });

  console.log("Seeded outcome data successfully.");
}

seed().catch(console.error);
