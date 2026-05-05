"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OutcomeTimelineEntry, PatientOutcomeSummary } from "@/lib/outcomes";

interface Props {
  patientId: string;
  patientName: string;
}

export default function OutcomesViewer({ patientId, patientName }: Props) {
  const [entries, setEntries] = useState<OutcomeTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/outcomes/timeline?patientId=${encodeURIComponent(patientId)}`)
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        setEntries(json.data || []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading outcomes...</div>;

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No outcome entries yet. Use the form below to add timeline events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((e) => (
        <Card key={e.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{e.title}</CardTitle>
              <Badge variant={e.type === "resolution" ? "default" : e.type === "relapse" ? "destructive" : "secondary"}>
                {e.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{e.date} — {e.vet}</p>
          </CardHeader>
          <CardContent className="pt-0">
            {e.description && <p className="text-sm mb-2">{e.description}</p>}
            {e.metrics.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {e.metrics.map((m) => (
                  <div key={m.id} className="border rounded p-2">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-semibold">{m.value} {m.unit}</p>
                  </div>
                ))}
              </div>
            )}
            {e.linkedCaseIds && e.linkedCaseIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Linked cases: {e.linkedCaseIds.join(", ")}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
