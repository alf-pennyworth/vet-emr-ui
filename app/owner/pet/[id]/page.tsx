"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { getPatientById, formatAge, formatWeight, formatDateDE } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ArrowLeft, Pill, Stethoscope, ClipboardList, AlertTriangle } from "lucide-react";

export default function OwnerPetDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const patient = getPatientById(id);
  if (!patient) return notFound();

  const completedVisits = patient.visits.filter((v) => v.status === "completed");
  const activeMeds = patient.medications.filter((m) => m.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/owner/${patient.owner.id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={16} /> Zurück zu {patient.owner.name}
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">{patient.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">{patient.species} — {patient.breed} · {formatAge(patient.dateOfBirth)} · {formatWeight(patient.weightKg)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {patient.conditions.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
            {patient.allergies.map((a) => <Badge key={a} variant="destructive">Allergie: {a}</Badge>)}
          </div>
        </div>
      </div>

      <Tabs defaultValue="visits" className="w-full">
        <TabsList>
          <TabsTrigger value="visits"><Stethoscope size={16} className="mr-1" />Besuchsberichte ({completedVisits.length})</TabsTrigger>
          <TabsTrigger value="medications"><Pill size={16} className="mr-1" />Medikamente ({activeMeds.length})</TabsTrigger>
          <TabsTrigger value="info"><ClipboardList size={16} className="mr-1" />Allgemeine Infos</TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Besuche &amp; Zusammenfassungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedVisits.length === 0 && (
                <p className="text-muted-foreground">Bisher keine abgeschlossenen Besuche.</p>
              )}
              {completedVisits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{visit.type}</span>
                    <span className="text-sm text-muted-foreground">{formatDateDE(visit.date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Tierarzt: {visit.vet}</p>
                  {visit.diagnosis && (
                    <p className="text-sm"><span className="font-medium">Diagnose:</span> {visit.diagnosis}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{visit.notes}</p>
                  {visit.soap && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted rounded p-2">
                        <p className="font-medium">Anamnese / Symptome</p>
                        <p className="text-muted-foreground">{visit.soap.subjective}</p>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <p className="font-medium">Befund</p>
                        <p className="text-muted-foreground">{visit.soap.objective}</p>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <p className="font-medium">Einschätzung</p>
                        <p className="text-muted-foreground">{visit.soap.assessment}</p>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <p className="font-medium">Plan / Empfehlungen</p>
                        <p className="text-muted-foreground">{visit.soap.plan}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktuelle Medikationen</CardTitle>
            </CardHeader>
            <CardContent>
              {activeMeds.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medikament</TableHead>
                        <TableHead>Dosierung</TableHead>
                        <TableHead>Häufigkeit</TableHead>
                        <TableHead>Seit</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeMeds.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.name}</TableCell>
                          <TableCell>{m.dosage}</TableCell>
                          <TableCell>{m.frequency}</TableCell>
                          <TableCell>{formatDateDE(m.startDate)}</TableCell>
                          <TableCell><Badge variant="default">Aktiv</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">Momentan keine aktiven Medikamente.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allgemeine Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Geburtsdatum</p>
                  <p className="text-muted-foreground">{formatDateDE(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="font-medium">Geschlecht</p>
                  <p className="text-muted-foreground">{patient.gender}</p>
                </div>
                <div>
                  <p className="font-medium">Gewicht</p>
                  <p className="text-muted-foreground">{formatWeight(patient.weightKg)}</p>
                </div>
                <div>
                  <p className="font-medium">Mikrochip</p>
                  <p className="text-muted-foreground">{patient.microchipId || "Nicht vorhanden"}</p>
                </div>
              </div>
              {patient.allergies.length > 0 && (
                <div className="flex items-start gap-2 mt-2">
                  <AlertTriangle size={16} className="mt-0.5 text-destructive"></AlertTriangle>
                  <div>
                    <p className="font-medium text-destructive">Allergien</p>
                    <p className="text-muted-foreground">{patient.allergies.join(", ")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
