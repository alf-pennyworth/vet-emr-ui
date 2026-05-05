"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Save, RotateCcw, FileText, CheckCircle, AlertCircle, History, Download } from "lucide-react";

export interface SoapNoteData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vet: string;
  date: string;
  aiGenerated?: boolean;
}

export type SoapField = "subjective" | "objective" | "assessment" | "plan";

export interface CorrectionLog {
  id: string;
  field: SoapField;
  original: string;
  corrected: string;
  timestamp: string;
  vet: string;
}

interface ClinicalNoteEditorProps {
  initialNote: SoapNoteData;
  initialCorrections?: CorrectionLog[];
  visitId: string;
  patientName: string;
  vet: string;
  onSave?: (note: SoapNoteData, corrections: CorrectionLog[]) => void;
}

export default function ClinicalNoteEditor({
  initialNote,
  initialCorrections = [],
  visitId,
  patientName,
  vet,
  onSave,
}: ClinicalNoteEditorProps) {
  const [note, setNote] = useState<SoapNoteData>(() => structuredClone(initialNote));
  const [originalNote] = useState<SoapNoteData>(() => structuredClone(initialNote));
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [corrections, setCorrections] = useState<CorrectionLog[]>(() => structuredClone(initialCorrections));
  const [showHistory, setShowHistory] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const fields: { key: SoapField; label: string }[] = [
    { key: "subjective", label: "Subjective" },
    { key: "objective", label: "Objective" },
    { key: "assessment", label: "Assessment" },
    { key: "plan", label: "Plan" },
  ];

  useEffect(() => {
    const changed = fields.some((f) => (note[f.key] as string).trim() !== (originalNote[f.key] as string).trim());
    setHasChanges(changed);
  }, [note, originalNote, fields]);

  const handleFieldChange = useCallback(
    (field: SoapField, value: string) => {
      setNote((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const computeDiff = useCallback(
    (before: SoapNoteData, after: SoapNoteData): CorrectionLog[] => {
      const diffs: CorrectionLog[] = [];
      for (const { key } of fields) {
        const orig = (before[key] as string).trim();
        const corr = (after[key] as string).trim();
        if (orig !== corr) {
          diffs.push({
            id: `${visitId}-${key}-${Date.now()}`,
            field: key,
            original: orig,
            corrected: corr,
            timestamp: new Date().toISOString(),
            vet,
          });
        }
      }
      return diffs;
    },
    [visitId, vet, fields]
  );

  const handleSave = useCallback(() => {
    const newCorrections = computeDiff(originalNote, note);
    const allCorrections = [...corrections, ...newCorrections];
    setCorrections(allCorrections);
    setIsEditing(false);
    setSavedAt(new Date().toISOString());
    if (onSave) {
      onSave(note, allCorrections);
    }
  }, [computeDiff, corrections, note, onSave, originalNote]);

  const handleReset = useCallback(() => {
    setNote(structuredClone(originalNote));
    setIsEditing(false);
  }, [originalNote]);

  const exportCorrections = useCallback(() => {
    const payload = {
      visitId,
      patientName,
      vet,
      corrections,
      exportedAt: new Date().toISOString(),
      modelDataset: corrections.map((c) => ({
        input: c.original,
        target: c.corrected,
        field: c.field,
        timestamp: c.timestamp,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corrections-${visitId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [corrections, patientName, vet, visitId]);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                SOAP Clinical Note
                {initialNote.aiGenerated && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    AI Generated
                  </Badge>
                )}
              </div>
            </CardTitle>
            {savedAt && (
              <span className="text-xs text-muted-foreground">
                Saved {new Date(savedAt).toLocaleString()}
              </span>
            )}
            {hasChanges && !isEditing && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {corrections.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                <History size={14} className="mr-1" />
                Corrections ({corrections.length})
              </Button>
            )}
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil size={14} className="mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                  <Save size={14} className="mr-1" />
                  Save &amp; Track
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {initialNote.date} &bull; {initialNote.vet}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {label}
                </Label>
                {isEditing && note[key] !== originalNote[key] && (
                  <span className="text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertCircle size={10} />
                    Modified
                  </span>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={note[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  rows={5}
                  className="text-sm resize-y min-h-[100px]"
                />
              ) : (
                <div className="bg-muted/50 rounded-md p-3 text-sm min-h-[100px] whitespace-pre-wrap">
                  {note[key] || <span className="text-muted-foreground italic">No {label.toLowerCase()} recorded.</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isEditing && corrections.length > 0 && (
          <div className="mt-4 border rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground mb-2">
              <CheckCircle size={14} />
              Correction Summary (Model Training Dataset)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from(new Set(corrections.map((c) => c.field))).map((field) => (
                <Badge key={field} variant="outline" className="text-xs justify-start">
                  {field}: {corrections.filter((c) => c.field === field).length} correction(s)
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={exportCorrections}>
                <Download size={12} className="mr-1" />
                Export JSON for Model Training
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History size={18} />
              Correction History &mdash; {patientName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              All tracked edits serve as training data for model improvement. Each record links original AI text to corrected clinician input.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {corrections.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                No corrections recorded yet.
              </div>
            )}
            {corrections.map((c) => (
              <div key={c.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{c.field}</Badge>
                    <span>{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <span>{c.vet}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-red-50 border border-red-100 rounded p-2">
                    <div className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1">Original</div>
                    <div className="text-sm text-red-900 whitespace-pre-wrap">{c.original}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded p-2">
                    <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">Corrected</div>
                    <div className="text-sm text-emerald-900 whitespace-pre-wrap">{c.corrected}</div>
                  </div>
                </div>
              </div>
            ))}
            {corrections.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={exportCorrections}>
                  <Download size={14} className="mr-1" />
                  Export {corrections.length} Correction(s) as JSON
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
