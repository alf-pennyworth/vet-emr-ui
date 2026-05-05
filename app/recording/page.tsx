"use client";

import { useState, useEffect } from "react";
import AudioRecorder from "@/components/ui/audio-recorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, History } from "lucide-react";

export default function RecordingPage() {
  const [consultationId, setConsultationId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/audio-upload")
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSessions(json.data.slice(0, 10));
        }
      })
      .catch(() => {
        // silently ignore if backend unavailable
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mic size={20} />
        <h1 className="text-2xl font-bold">Audio Recording</h1>
      </div>

      <p className="text-sm text-muted-foreground max-w-2xl">
        Record veterinary consultations with pause and resume. All segments are stitched into a single session file for download or upload.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="cid" className="text-xs">Consultation ID</Label>
              <Input
                id="cid"
                placeholder="e.g. vet-2026-05-04-001"
                value={consultationId}
                onChange={(e) => setConsultationId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pid" className="text-xs">Patient ID</Label>
              <Input
                id="pid"
                placeholder="e.g. patient-123"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pname" className="text-xs">Patient Name</Label>
              <Input
                id="pname"
                placeholder="e.g. Bella"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AudioRecorder
            consultationId={consultationId || undefined}
            patientName={patientName || undefined}
            patientId={patientId || undefined}
          />
        </div>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History size={16} />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{s.originalName}</Badge>
                    <span className="text-muted-foreground">{s.patientId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "uploaded" ? "default" : "secondary"}>{s.status}</Badge>
                    <span className="text-muted-foreground">{(s.sizeBytes / 1024).toFixed(1)} KB</span>
                    <a href={`/api/audio-upload/${s.id}`} className="text-primary underline">
                      Metadata
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
