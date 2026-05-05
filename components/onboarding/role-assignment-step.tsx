"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StaffMember } from "./invite-staff-step"

interface RoleAssignmentStepProps {
  staff: StaffMember[]
  onChange: (staff: StaffMember[]) => void
  onBack: () => void
  onNext: () => void
}

export function RoleAssignmentStep({ staff, onChange, onBack, onNext }: RoleAssignmentStepProps) {
  const [error, setError] = useState("")

  function handleRoleChange(id: string, role: StaffMember["role"]) {
    onChange(staff.map((s) => (s.id === id ? { ...s, role } : s)))
  }

  function handleNext() {
    if (staff.length === 0) {
      setError("Please add at least one staff member before assigning roles.")
      return
    }
    setError("")
    onNext()
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Roles</CardTitle>
        <CardDescription>Confirm or adjust the role for each team member.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff members added yet. Go back to invite staff first.</p>
        ) : (
          <div className="border rounded-md divide-y">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{member.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as StaffMember["role"])}
                >
                  <option value="veterinarian">Veterinarian</option>
                  <option value="technician">Technician</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="pt-2 flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onNext}>Skip</Button>
            <Button onClick={handleNext}>Continue</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
