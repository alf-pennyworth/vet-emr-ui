"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { getOwnerById, getPatientsByOwnerId, formatAge, formatWeight } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";

export default function OwnerDashboard() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const owner = getOwnerById(id);
  if (!owner) return notFound();

  const pets = getPatientsByOwnerId(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/owner" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={16} /> Zurück zur Übersicht
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {owner.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{owner.name}</h1>
          <p className="text-sm text-muted-foreground">{owner.email} · {owner.phone}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold flex items-center gap-2">
        <PawPrint size={20} /> Ihre Tiere ({pets.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pets.map((pet) => (
          <Link key={pet.id} href={`/owner/pet/${pet.id}`} className="group">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base group-hover:underline">{pet.name}</CardTitle>
                  <Badge variant={pet.status === "active" ? "default" : "secondary"}>
                    {pet.status === "active" ? "Aktiv" : "Archiviert"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium">Art:</span> {pet.species} — {pet.breed}</p>
                <p><span className="font-medium">Alter:</span> {formatAge(pet.dateOfBirth)} · <span className="font-medium">Gewicht:</span> {formatWeight(pet.weightKg)}</p>
                {pet.microchipId && <p><span className="font-medium">Chip:</span> {pet.microchipId}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {pet.conditions.map((c) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                  {pet.allergies.map((a) => (
                    <Badge key={a} variant="destructive">Allergie: {a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
