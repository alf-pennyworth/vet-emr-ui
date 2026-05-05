"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  patientId: string;
  patientName: string;
  onCreated?: () => void;
}

type EntryType = "diagnosis" | "treatment_start" | "follow_up" | "milestone" | "relapse" | "resolution";

export default function OutcomeForm({ patientId, patientName, onCreated }: Props) {
  const [type, setType] = useState<EntryType>("follow_up");
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vet, setVet] = useState("");
  const [metricType, setMetricType] = useState("custom");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload: any = {
      patientId,
      date,
      type,
      title,
      description,
      vet,
      metrics: metricLabel ? [{
        type: metricType,
        label: metricLabel,
        value: parseFloat(metricValue),
        unit: metricUnit,
        timestamp: new Date(date).toISOString(),
        recordedBy: vet,
        source: "visit",
      }] : [],
    };
    try {
      const res = await fetch("/api/outcomes/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDate("");
      setTitle("");
      setDescription("");
      setVet("");
      setMetricLabel("");
      setMetricValue("");
      setMetricUnit("");
      onCreated?.();
    } catch (err) {
      console.error(err);
      alert("Failed to save outcome entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add Outcome Entry for {patientName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="o-date">Date</Label>
              <Input id="o-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="o-type">Type</Label>
              <select id="o-type" value={type} onChange={(e) => setType(e.target.value as EntryType)} className="w-full border rounded px-2 py-2 text-sm">
                <option value="diagnosis">Diagnosis</option>
                <option value="treatment_start">Treatment Start</option>
                <option value="follow_up">Follow-up</option>
                <option value="milestone">Milestone</option>
                <option value="relapse">Relapse</option>
                <option value="resolution">Resolution</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="o-title">Title</Label>
            <Input id="o-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="o-desc">Description</Label>
            <Textarea id="o-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="o-vet">Veterinarian</Label>
            <Input id="o-vet" value={vet} onChange={(e) => setVet(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Metric Label</Label>
              <Input value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} placeholder="e.g. Weight" />
            </div>
            <div className="space-y-1">
              <Label>Value</Label>
              <Input value={metricValue} onChange={(e) => setMetricValue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} placeholder="kg" />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Outcome Entry"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
