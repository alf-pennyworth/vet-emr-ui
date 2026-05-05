"use client";

import { notFound, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getPatientById, formatAge, formatWeight } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AudioRecorder from "@/components/ui/audio-recorder";
import ClinicalNoteEditor, { SoapNoteData, CorrectionLog } from "@/components/ui/clinical-note-editor";
import OutcomesViewer from "@/components/ui/outcomes-viewer";
import FollowUpReminderPanel from "@/components/ui/follow-up-reminder-panel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PatientDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const patient = getPatientById(id);
  const [savedCorrections, setSavedCorrections] = useState<Record<string, CorrectionLog[]>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!patient) return;
    fetch(`/api/corrections?patientId=${encodeURIComponent(patient.id)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        const data = (json.data || []);
        const map: Record<string, CorrectionLog[]> = {};
        for (const c of data) {
          if (!map[c.visitId]) map[c.visitId] = [];
          map[c.visitId].push({
            id: c.id,
            field: c.field,
            original: c.original,
            corrected: c.corrected,
            timestamp: c.timestamp,
            vet: c.vet,
          });
        }
        setSavedCorrections(map);
      })
      .catch(() => {
        // silently fail: backend may not be available yet
      });
  }, [patient]);

  if (!patient) {
    notFound();
  }

  const handleNoteSave = async (visitId: string, note: SoapNoteData, corrections: CorrectionLog[]) => {
    setSaving(visitId);
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          patientId: patient.id,
          patientName: patient.name,
          vet: note.vet,
          corrections: corrections.slice(-1).map((c) => ({
            field: c.field,
            original: c.original,
            corrected: c.corrected,
            timestamp: c.timestamp,
          })),
          note,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fresh = await fetch(`/api/corrections?patientId=${encodeURIComponent(patient.id)}`);
      if (fresh.ok) {
        const json = await fresh.json();
        const data = (json.data || []);
        const map: Record<string, CorrectionLog[]> = {};
        for (const c of data) {
          if (!map[c.visitId]) map[c.visitId] = [];
          map[c.visitId].push({
            id: c.id,
            field: c.field,
            original: c.original,
            corrected: c.corrected,
            timestamp: c.timestamp,
            vet: c.vet,
          });
        }
        setSavedCorrections(map);
      }
      console.log("Saved corrections for", visitId, corrections);
    } catch (err) {
      console.error("Failed to save corrections:", err);
      alert("Failed to save corrections to dataset. See console for details.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={16} /> Back to list
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            {patient.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.species} — {patient.breed} • {patient.gender} • {formatAge(patient.dateOfBirth)} • {formatWeight(patient.weightKg)}
          </p>
          <div className="mt-2 flex gap-2">
            {patient.status === "active" && <Badge>Active</Badge>}
            {patient.microchipId && (
              <Badge variant="outline">Chip: {patient.microchipId}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Owner</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{patient.owner.name}</p>
            <p className="text-muted-foreground">{patient.owner.email}</p>
            <p className="text-muted-foreground">{patient.owner.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conditions &amp; Allergies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {patient.conditions.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
              {patient.allergies.map((a) => (
                <Badge key={a} variant="destructive">Allergy: {a}</Badge>
              ))}
              {patient.conditions.length === 0 && patient.allergies.length === 0 && (
                <span className="text-sm text-muted-foreground">None recorded</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <AudioRecorder patientName={patient.name} patientId={patient.id} />

      <Tabs defaultValue="visits" className="w-full">
        <TabsList>
          <TabsTrigger value="visits">Visits ({patient.visits.length})</TabsTrigger>
          <TabsTrigger value="medications">Medications ({patient.medications.length})</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <Card>
            <CardContent className="py-4">
              <div className="space-y-4">
                {patient.visits.map((v) => (
                  <div key={v.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{v.type}</span>
                        <Badge variant={v.status === "completed" ? "default" : "outline"}>{v.status}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{v.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Vet: {v.vet}</p>
                    <p className="text-sm">{v.notes}</p>
                    {v.diagnosis && (
                      <p className="text-sm">
                        <span className="font-medium">Diagnosis:</span> {v.diagnosis}
                      </p>
                    )}
                    {saving === v.id && (
                      <span className="text-xs text-muted-foreground">Saving...</span>
                    )}
                    <ClinicalNoteEditor
                      key={`${v.id}-${savedCorrections[v.id]?.length || 0}`}
                      initialNote={{
                        subjective: v.soap?.subjective || "",
                        objective: v.soap?.objective || "",
                        assessment: v.soap?.assessment || "",
                        plan: v.soap?.plan || "",
                        vet: v.soap?.vet || v.vet,
                        date: v.soap?.date || v.date,
                        aiGenerated: true,
                      }}
                      initialCorrections={savedCorrections[v.id]}
                      visitId={v.id}
                      patientName={patient.name}
                      vet={v.vet}
                      onSave={(note, corrections) => handleNoteSave(v.id, note, corrections)}
                    />
                  </div>
                ))}
                {patient.visits.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">No visits recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardContent className="py-4">
              {patient.medications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patient.medications.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>{m.dosage}</TableCell>
                          <TableCell>{m.frequency}</TableCell>
                          <TableCell>{m.startDate}</TableCell>
                          <TableCell>
                            <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">No medications prescribed.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outcome Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OutcomesViewer patientId={patient.id} patientName={patient.name} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <FollowUpReminderPanel patientId={patient.id} patientName={patient.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
