"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Pause, Play, Square, Download, Upload, Loader2 } from "lucide-react";

type RecordingState = "idle" | "recording" | "paused";

interface AudioRecorderProps {
  consultationId?: string;
  patientName?: string;
  patientId?: string;
  clinicId?: string;
}

export default function AudioRecorder({
  consultationId,
  patientName,
  patientId,
  clinicId = "default",
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0); // total elapsed ms from completed segments
  const [currentSegmentElapsed, setCurrentSegmentElapsed] = useState(0); // current segment ms
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [mimeType, setMimeType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(consultationId || "");

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const seg = Date.now() - startTimeRef.current;
      setCurrentSegmentElapsed(seg);
    }, 100);
  };

  const stopTimer = () => {
    clearTimer();
  };

  const getSupportedMimeType = (): string => {
    const types = [
      "audio/webm",
      "audio/webm;codecs=opus",
      "audio/mp4",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/ogg",
      "audio/ogg;codecs=opus",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setUploadState("idle");
    setUploadedUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mt = getSupportedMimeType();
      setMimeType(mt || "audio/webm");
      const recorder = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined);
      mediaRecorderRef.current = recorder;

      const localChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          localChunks.push(e.data);
          setChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setState("recording");
      setElapsed(0);
      setCurrentSegmentElapsed(0);
      if (!sessionIdRef.current) {
        sessionIdRef.current = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      }
      startTimer();
    } catch (err: any) {
      setError(err?.message || "Microphone access denied or not available.");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    stopTimer();
    const seg = Date.now() - startTimeRef.current;
    setElapsed((prev) => prev + seg);
    setCurrentSegmentElapsed(0);
    setState("paused");
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startTimer();
    setState("recording");
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.stop();
    }
    stopTimer();
    if (state === "recording") {
      const seg = Date.now() - startTimeRef.current;
      setElapsed((prev) => prev + seg);
    }
    setCurrentSegmentElapsed(0);
    setState("idle");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }, [state]);

  const download = useCallback(() => {
    if (chunks.length === 0) return;
    const finalMime = mimeType && mimeType !== "" ? mimeType : "audio/webm";
    const blob = new Blob(chunks, { type: finalMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = finalMime.includes("mp4") ? "m4a" : finalMime.includes("ogg") ? "ogg" : "webm";
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const suffix = consultationId
      ? `-${consultationId}`
      : patientName
        ? `-${patientName.replace(/\s+/g, "_")}`
        : "";
    a.download = `consultation${suffix}_${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chunks, mimeType, consultationId, patientName]);

  const upload = useCallback(async () => {
    if (chunks.length === 0) return;
    setUploadState("uploading");
    try {
      const finalMime = mimeType && mimeType !== "" ? mimeType : "audio/webm";
      const blob = new Blob(chunks, { type: finalMime });
      const ext = finalMime.includes("mp4") ? "m4a" : finalMime.includes("ogg") ? "ogg" : "webm";
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const suffix = consultationId
        ? `-${consultationId}`
        : patientName
          ? `-${patientName.replace(/\s+/g, "_")}`
          : "";
      const filename = `consultation${suffix}_${ts}.${ext}`;

      const form = new FormData();
      form.append("audio", new File([blob], filename, { type: finalMime }));
      form.append("clinicId", clinicId);
      form.append("patientId", patientId || "unknown");
      form.append("sessionId", sessionIdRef.current || `${Date.now()}`);

      const res = await fetch("/api/audio-upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Upload failed (${res.status})`);
      }
      setUploadState("done");
      setUploadedUrl(`/api/audio-upload/${json.data.id}`);
    } catch (err: any) {
      setUploadState("error");
      setError(err?.message || "Upload failed");
    }
  }, [chunks, mimeType, clinicId, patientId, consultationId, patientName]);

  const reset = useCallback(() => {
    setChunks([]);
    setElapsed(0);
    setCurrentSegmentElapsed(0);
    setState("idle");
    setError(null);
    setUploadState("idle");
    setUploadedUrl(null);
    sessionIdRef.current = consultationId || "";
  }, [consultationId]);

  const hasRecording = chunks.length > 0 && state === "idle";
  const displayElapsed = elapsed + currentSegmentElapsed;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic size={16} />
          Consultation Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-3xl font-mono tabular-nums">{formatTime(displayElapsed)}</div>
          {state === "recording" && (
            <Badge variant="destructive" className="animate-pulse">Recording</Badge>
          )}
          {state === "paused" && (
            <Badge variant="outline">Paused</Badge>
          )}
          {uploadState === "done" && (
            <Badge variant="default" className="text-emerald-700 bg-emerald-100">Uploaded</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state === "idle" && !hasRecording && (
            <Button onClick={startRecording} disabled={!!error}>
              <Mic size={16} className="mr-1" /> Start Recording
            </Button>
          )}
          {state === "recording" && (
            <>
              <Button variant="secondary" onClick={pauseRecording}>
                <Pause size={16} className="mr-1" /> Pause
              </Button>
              <Button variant="destructive" onClick={stopRecording}>
                <Square size={16} className="mr-1" /> Stop &amp; Finish
              </Button>
            </>
          )}
          {state === "paused" && (
            <>
              <Button onClick={resumeRecording}>
                <Play size={16} className="mr-1" /> Resume
              </Button>
              <Button variant="destructive" onClick={stopRecording}>
                <Square size={16} className="mr-1" /> Stop &amp; Finish
              </Button>
            </>
          )}

          {hasRecording && (
            <>
              <Button variant="outline" onClick={download}>
                <Download size={16} className="mr-1" /> Download Session
              </Button>
              <Button
                variant="outline"
                onClick={upload}
                disabled={uploadState === "uploading" || uploadState === "done"}
              >
                {uploadState === "uploading" ? (
                  <>
                    <Loader2 size={16} className="mr-1 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-1" /> Upload Session
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={reset}>
                Discard &amp; New
              </Button>
            </>
          )}
        </div>

        {hasRecording && (
          <div className="text-sm text-muted-foreground">
            Session: <span className="font-medium">{chunks.length} segment(s)</span>{" "}
            {mimeType && `• ${mimeType}`}
            {uploadedUrl && (
              <span className="ml-2">
                • <a href={uploadedUrl} className="underline text-primary">View metadata</a>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
