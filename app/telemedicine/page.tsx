"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "vet" | "owner" | "system";
  text: string;
  timestamp: string;
}

export default function TelemedicinePage() {
  const [activeTab, setActiveTab] = useState("video");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", sender: "system", text: "Consultation room ready. Waiting to start...", timestamp: new Date().toISOString() },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [notes, setNotes] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const startCall = () => {
    setIsCallActive(true);
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: "system", text: "Video consultation started.", timestamp: new Date().toISOString() },
    ]);
  };

  const endCall = () => {
    setIsCallActive(false);
    setChatMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: "system", text: "Video consultation ended.", timestamp: new Date().toISOString() },
    ]);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "vet",
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
    // Simulate owner reply
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "owner", text: "Acknowledged, thank you.", timestamp: new Date().toISOString() },
      ]);
    }, 1500);
  };

  const sendSOAPToBackend = async () => {
    try {
      const res = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: `tele-${Date.now()}`,
          patientId: "tele-patient",
          patientName: "Telemedicine Patient",
          vet: "Dr. Tele Vet",
          corrections: [],
          note: {
            subjective: "Telemedicine consult subjective notes:\n" + notes,
            objective: "",
            assessment: "",
            plan: "",
            vet: "Dr. Tele Vet",
            date: new Date().toISOString().slice(0, 10),
            aiGenerated: false,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Notes saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save notes.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Telemedicine</h1>
      <p className="text-sm text-muted-foreground">
        Conduct remote video consultations, chat with owners, and capture SOAP notes in real time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main video / chat area */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Consultation Room</CardTitle>
              <Badge variant={isCallActive ? "default" : "secondary"}>
                {isCallActive ? "Live" : "Idle"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-2">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="video">
                <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {isCallActive ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Video size={48} />
                      <p>Video stream placeholder (WebRTC integration required)</p>
                      <p className="text-xs">Connect your WebRTC provider (e.g., Daily.co, Twilio) for real video.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <VideoOff size={48} />
                      <p>Call not started</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3 mt-4">
                  {!isCallActive ? (
                    <Button onClick={startCall} className="gap-2">
                      <Video size={18} /> Start Consultation
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="icon" onClick={() => setIsMicOn((v) => !v)}>
                        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setIsCameraOn((v) => !v)}>
                        {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </Button>
                      <Button variant="destructive" onClick={endCall} className="gap-2">
                        <PhoneOff size={18} /> End
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chat">
                <div className="h-72 overflow-y-auto border rounded-lg p-3 space-y-2 bg-muted/30">
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender === "vet" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          m.sender === "vet"
                            ? "bg-primary text-primary-foreground"
                            : m.sender === "system"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-background border"
                        }`}
                      >
                        <p>{m.text}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {new Date(m.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  />
                  <Button size="icon" onClick={sendChat}>
                    <Send size={18} />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notes panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consultation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Capture subjective findings, owner concerns, observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={12}
            />
            <Button className="w-full" onClick={sendSOAPToBackend}>
              Save to Patient Record
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
