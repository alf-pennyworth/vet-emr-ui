export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SoapNote {
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vet: string;
}

export interface Visit {
  id: string;
  date: string;
  type: string;
  vet: string;
  notes: string;
  diagnosis?: string;
  status: "completed" | "scheduled" | "cancelled" | "in-progress";
  soap?: SoapNote;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: "active" | "discontinued" | "scheduled";
}

export interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  weightKg: number;
  microchipId?: string;
  status: "active" | "archived" | "deceased";
  owner: Owner;
  visits: Visit[];
  medications: Medication[];
  allergies: string[];
  conditions: string[];
}

const now = new Date().toISOString().slice(0, 10);

export const owners: Owner[] = [
  {
    id: "o1",
    name: "Dr. Sarah Müller",
    email: "s.mueller@vetvoice.de",
    phone: "+49 89 12345678",
  },
  {
    id: "o2",
    name: "Herr Thomas Schmidt",
    email: "t.schmidt@example.de",
    phone: "+49 30 98765432",
  },
  {
    id: "o3",
    name: "Frau Laura Braun",
    email: "l.braun@example.de",
    phone: "+49 40 5551234",
  },
];

export const patients: Patient[] = [
  {
    id: "101",
    name: "Luna",
    species: "Canine",
    breed: "Golden Retriever",
    dateOfBirth: "2018-06-12",
    gender: "Female",
    weightKg: 28.5,
    microchipId: "985112345678901",
    status: "active",
    owner: owners[0],
    allergies: ["Penicillin"],
    conditions: ["Hüftdysplasie", "Allergie: Pollen"],
    medications: [
      {
        id: "m1",
        name: "Carprofen",
        dosage: "75 mg",
        frequency: "Einmal täglich",
        startDate: "2025-03-01",
        status: "active",
      },
    ],
    visits: [
      {
        id: "v101-1",
        date: "2025-03-01",
        type: "Kontrolluntersuchung",
        vet: "Dr. Klaus Fischer",
        notes: "Gesamtzustand gut, Beweglichkeit der Hinterbeine minimal eingeschränkt.",
        diagnosis: "Hüftdysplasie – mild",
        status: "completed",
        soap: {
          date: "2025-03-01",
          subjective: "Hündin läuft etwas steif, aber ohne Schmerzanzeichen.",
          objective: "Hüftgelenk links minimal reizbar, Bewegungsumfang leicht reduziert.",
          assessment: "Hüftdysplasie – mild, gut kontrolliert.",
          plan: "Carprofen 75 mg 1x täglich, Bewegung moderatem Umfang empfohlen, Nachkontrolle in 3 Monaten.",
          vet: "Dr. Klaus Fischer",
        },
      },
      {
        id: "v101-2",
        date: "2025-09-15",
        type: "Impfung",
        vet: "Dr. Anna Weber",
        notes: "Jährliche Impfung (Kombi).",
        status: "completed",
      },
      {
        id: "v101-3",
        date: now,
        type: "Routinekontrolle",
        vet: "Dr. Klaus Fischer",
        notes: "Nächste Terminvergabe.",
        status: "scheduled",
      },
    ],
  },
  {
    id: "102",
    name: "Milo",
    species: "Feline",
    breed: "European Shorthair",
    dateOfBirth: "2020-02-14",
    gender: "Male",
    weightKg: 4.8,
    microchipId: "985112345678902",
    status: "active",
    owner: owners[1],
    allergies: [],
    conditions: ["Diabetes mellitus"],
    medications: [
      {
        id: "m2",
        name: "Insulin Glargin",
        dosage: "2 IE",
        frequency: "Zweimal täglich",
        startDate: "2024-11-10",
        status: "active",
      },
    ],
    visits: [
      {
        id: "v102-1",
        date: "2024-11-10",
        type: "Erstdiagnose",
        vet: "Dr. Klaus Fischer",
        notes: "Blutzucker stark erhöht, Polydipsie/Polyurie.",
        diagnosis: "Diabetes mellitus",
        status: "completed",
        soap: {
          date: "2024-11-10",
          subjective: "Kater trinkt und uriniert vermehrt, Gewichtsverlust.",
          objective: "BG 420 mg/dL, Fructosamin erhöht, Urin Glukose +++.",
          assessment: "Diabetes mellitus, guter Allgemeinzustand.",
          plan: "Insulin Glargin 2 IE BID, Fructosamin-Kontrolle in 4 Wochen, Diätumstellung.",
          vet: "Dr. Klaus Fischer",
        },
      },
      {
        id: "v102-2",
        date: "2025-01-15",
        type: "Kontrolluntersuchung",
        vet: "Dr. Anna Weber",
        notes: "Blutzucker stabilisiert, Gewicht +200g.",
        diagnosis: "Diabetes mellitus – stabil",
        status: "completed",
      },
    ],
  },
  {
    id: "103",
    name: "Bella",
    species: "Canine",
    breed: "Labrador",
    dateOfBirth: "2019-09-03",
    gender: "Female",
    weightKg: 30.2,
    microchipId: "985112345678903",
    status: "active",
    owner: owners[2],
    allergies: ["Hühnerfleisch"],
    conditions: ["Übergewicht"],
    medications: [],
    visits: [
      {
        id: "v103-1",
        date: "2025-04-20",
        type: "Beratung Ernährung",
        vet: "Dr. Klaus Fischer",
        notes: "Gewichtsreduktionsplan erstellt.",
        status: "completed",
      },
    ],
  },
];

export function getPatientById(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

export function getOwnerById(id: string): Owner | undefined {
  return owners.find((o) => o.id === id);
}

export function getPatientsByOwnerId(ownerId: string): Patient[] {
  return patients.filter((p) => p.owner.id === ownerId);
}

export function searchPatients(query: string): Patient[] {
  const q = query.toLowerCase();
  return patients.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.owner.name.toLowerCase().includes(q) ||
      p.species.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q)
  );
}

export function formatAge(dob: string): string {
  const birth = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
  return `${years} y`;
}

export function formatWeight(wKg: number): string {
  return `${wKg.toFixed(1)} kg`;
}

export function formatDateDE(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}
