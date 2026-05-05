"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface StaffMember {
  id: string
  name: string
  email: string
  role: "veterinarian" | "technician" | "receptionist" | "admin"
}

interface InviteStaffStepProps {
  value: StaffMember[]
  onChange: (staff: StaffMember[]) => void
  onBack: () => void
  onNext: () => void
}

export function InviteStaffStep({ value, onChange, onBack, onNext }: InviteStaffStepProps) {
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<StaffMember["role"]>("veterinarian")
  const [error, setError] = useState("")

  function handleAdd() {
    if (!newName.trim() || !newEmail.trim()) {
      setError("Name and email are required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Enter a valid email")
      return
    }
    if (value.some((s) => s.email.toLowerCase() === newEmail.toLowerCase())) {
      setError("This email has already been invited")
      return
    }
    const id = Math.random().toString(36).slice(2)
    onChange([...value, { id, name: newName, email: newEmail, role: newRole }])
    setNewName("")
    setNewEmail("")
    setNewRole("veterinarian")
    setError("")
  }

  function handleRemove(id: string) {
    onChange(value.filter((s) => s.id !== id))
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Invite Staff</CardTitle>
        <CardDescription>Add members to your clinic team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Dr. Smith"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError("") }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label>Email</Label>
            <Input
              placeholder="dr.smith@clinic.com"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setError("") }}
            />
          </div>
          <div className="w-36 space-y-2">
            <Label>Role</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as StaffMember["role"])}
            >
              <option value="veterinarian">Veterinarian</option>
              <option value="technician">Technician</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleAdd}>Add</Button>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {value.length > 0 && (
          <div className="border rounded-md divide-y">
            {value.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3">
                <div className="flex flex-col">
                  <span className="font-medium">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.email} • {member.role}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(member.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onNext}>Skip</Button>
            <Button onClick={onNext}>Continue</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
