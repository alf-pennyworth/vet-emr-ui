"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patients, searchPatients, formatAge, formatWeight } from "@/lib/data";
import Link from "next/link";

function speciesInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

export default function PatientListPage() {
  const [query, setQuery] = useState("");
  const results = query.trim() ? searchPatients(query) : patients;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="w-full max-w-md">
          <label htmlFor="search" className="text-sm font-medium mb-1 block">
            Search patients, owners, species
          </label>
          <Input
            id="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button>+ New Patient</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patients ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Species / Breed</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/patient/${p.id}`} className="flex items-center gap-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {speciesInitial(p.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium group-hover:underline">{p.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.species} — {p.breed}
                    </TableCell>
                    <TableCell className="text-sm">{formatAge(p.dateOfBirth)}</TableCell>
                    <TableCell className="text-sm">{formatWeight(p.weightKg)}</TableCell>
                    <TableCell className="text-sm">{p.owner.name}</TableCell>
                    <TableCell>
                      {p.status === "active" ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.visits.length}
                    </TableCell>
                  </TableRow>
                ))}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No patients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
