"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ReminderStatus = "pending" | "sent" | "completed" | "dismissed" | "overdue";
type ReminderPriority = "low" | "medium" | "high" | "critical";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  triggerType: string;
  triggerDetail?: string;
}

interface Props {
  patientId: string;
  patientName: string;
}

export default function FollowUpReminderPanel({ patientId, patientName }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [rules, setRules] = useState<{ id: string; name: string; titleTemplate: string; daysAfterEncounter: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualPriority, setManualPriority] = useState<ReminderPriority>("medium");
  const [manualDays, setManualDays] = useState("7");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, ruRes] = await Promise.all([
        fetch(`/api/follow-up/reminders?patientId=${patientId}`),
        fetch(`/api/follow-up/rules?clinicId=default-clinic`),
      ]);
      if (rRes.ok) {
        const json = await rRes.json();
        setReminders(json.data || []);
      }
      if (ruRes.ok) {
        const json = await ruRes.json();
        setRules(json.data || []);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(Date.now() + parseInt(manualDays, 10) * 86400000).toISOString();
    const res = await fetch("/api/follow-up/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicId: "default-clinic",
        patientId,
        scheduledAt,
        title: manualTitle,
        description: manualDesc,
        priority: manualPriority,
      }),
    });
    if (res.ok) {
      setManualOpen(false);
      setManualTitle("");
      setManualDesc("");
      setManualPriority("medium");
      setManualDays("7");
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: ReminderStatus) => {
    const res = await fetch(`/api/follow-up/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchData();
  };

  const priorityColor: Record<ReminderPriority, string> = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-amber-100 text-amber-800",
    critical: "bg-red-100 text-red-800",
  };

  const statusColor: Record<ReminderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    sent: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-800",
    overdue: "bg-red-100 text-red-800",
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Follow-up Reminders</h3>
        <Button size="sm" onClick={() => setManualOpen(!manualOpen)}>
          {manualOpen ? "Cancel" : "+ Manual"}
        </Button>
      </div>

      {manualOpen && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <form onSubmit={handleCreateManual} className="space-y-3">
              <Input placeholder="Title" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} required />
              <Input placeholder="Description (optional)" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} />
              <div className="grid grid-cols-3 gap-3">
                <select value={manualPriority} onChange={(e) => setManualPriority(e.target.value as ReminderPriority)} className="w-full border rounded px-2 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <Input type="number" placeholder="Days from now" value={manualDays} onChange={(e) => setManualDays(e.target.value)} />
                <Button type="submit" size="sm">Add</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {["active", "completed", "all"].map((tab) => {
          let filtered = reminders;
          if (tab === "active") filtered = reminders.filter((r) => !["completed", "dismissed"].includes(r.status));
          if (tab === "completed") filtered = reminders.filter((r) => ["completed", "dismissed"].includes(r.status));
          return (
            <TabsContent key={tab} value={tab}>
              {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No reminders found.</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((r) => {
                    const scheduled = new Date(r.scheduledAt);
                    const isOverdue = r.status === "pending" && scheduled < today;
                    return (
                      <Card key={r.id} className={isOverdue ? "border-red-200" : ""}>
                        <CardContent className="py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{r.title}</span>
                              <Badge className={priorityColor[r.priority]}>{r.priority}</Badge>
                              {isOverdue && <Badge className="bg-red-100 text-red-800">Overdue</Badge>}
                            </div>
                            {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                            <div className="text-xs text-muted-foreground">
                              Scheduled: {formatDate(r.scheduledAt)} · {r.triggerType === "manual" ? "Manual" : `Auto: ${r.triggerDetail || "rule"}`}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={statusColor[r.status]}>{r.status}</Badge>
                            <div className="flex gap-1">
                              {r.status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => updateStatus(r.id, "completed")}>
                                    Done
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => updateStatus(r.id, "dismissed")}>
                                    Dismiss
                                  </Button>
                                </>
                              )}
                              {(r.status === "completed" || r.status === "dismissed") && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => updateStatus(r.id, "pending")}>
                                  Reopen
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
