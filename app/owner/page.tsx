"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { owners } from "@/lib/data";
import Link from "next/link";

export default function OwnerPortalLanding() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">VO</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Tierbesitzer-Portal</h1>
          <p className="text-sm text-muted-foreground">Wählen Sie Ihr Konto, um Ihre Tiere zu verwalten.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {owners.map((owner) => (
          <Link key={owner.id} href={`/owner/${owner.id}`} className="group">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base group-hover:underline">{owner.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>{owner.email}</p>
                <p>{owner.phone}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
