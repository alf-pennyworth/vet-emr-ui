"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClinicProfileStep, type ClinicProfileData } from "./clinic-profile-step"
import { InviteStaffStep, type StaffMember } from "./invite-staff-step"
import { RoleAssignmentStep } from "./role-assignment-step"
import { PreferencesStep } from "./preferences-step"
import { createClinic } from "@/lib/api/clinic"

type Step = "profile" | "staff" | "roles" | "preferences" | "complete" | "submitting"

interface OnboardingFlowProps {
  onComplete?: (data: {
    profile: ClinicProfileData
    staff: StaffMember[]
    preferences: { timezone: string; currency: string; appointmentInterval: string }
  }) => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("profile")
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<ClinicProfileData>({
    name: "",
    address: "",
    phone: "",
    email: "",
  })
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [preferences, setPreferences] = useState({
    timezone: "America/New_York",
    currency: "USD",
    appointmentInterval: "30",
  })

  const handlePreferencesComplete = useCallback(
    async (prefs: { timezone: string; currency: string; appointmentInterval: string }) => {
      setError("")
      setStep("submitting")
      const data = { profile, staff, preferences: prefs }
      try {
        await createClinic(data)
        setPreferences(prefs)
        setStep("complete")
        if (onComplete) onComplete(data)
      } catch (e: any) {
        setError(e.message || "Failed to create clinic. Please try again.")
        setStep("preferences")
      }
    },
    [profile, staff, onComplete]
  )

  if (step === "complete") {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Setup Complete</CardTitle>
          <CardDescription>Your clinic profile has been created successfully.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm">
              <strong>{profile.name}</strong> is ready to go.
            </p>
            <p className="text-sm text-muted-foreground">
              Invited {staff.length} staff member{staff.length !== 1 ? "s" : ""}.
              Default appointment interval set to {preferences.appointmentInterval} minutes.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/")}>Go to Dashboard</Button>
        </CardContent>
      </Card>
    )
  }

  if (step === "submitting") {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Creating your clinic profile...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="py-8">
      {error && <p className="text-destructive text-center mb-4">{error}</p>}
      {step === "profile" && (
        <ClinicProfileStep
          value={profile}
          onChange={setProfile}
          onNext={() => setStep("staff")}
        />
      )}
      {step === "staff" && (
        <InviteStaffStep
          value={staff}
          onChange={setStaff}
          onBack={() => setStep("profile")}
          onNext={() => setStep("roles")}
        />
      )}
      {step === "roles" && (
        <RoleAssignmentStep
          staff={staff}
          onChange={setStaff}
          onBack={() => setStep("staff")}
          onNext={() => setStep("preferences")}
        />
      )}
      {step === "preferences" && (
        <PreferencesStep
          timezone={preferences.timezone}
          currency={preferences.currency}
          appointmentInterval={preferences.appointmentInterval}
          onTimezoneChange={(v) => setPreferences((p) => ({ ...p, timezone: v }))}
          onCurrencyChange={(v) => setPreferences((p) => ({ ...p, currency: v }))}
          onAppointmentIntervalChange={(v) => setPreferences((p) => ({ ...p, appointmentInterval: v }))}
          onBack={() => setStep("roles")}
          onComplete={handlePreferencesComplete}
        />
      )}
    </div>
  )
}
