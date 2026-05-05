"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface PreferencesStepProps {
  timezone: string
  currency: string
  appointmentInterval: string
  onTimezoneChange: (v: string) => void
  onCurrencyChange: (v: string) => void
  onAppointmentIntervalChange: (v: string) => void
  onBack: () => void
  onComplete: (data: { timezone: string; currency: string; appointmentInterval: string }) => void
}

export function PreferencesStep({
  timezone,
  currency,
  appointmentInterval,
  onTimezoneChange,
  onCurrencyChange,
  onAppointmentIntervalChange,
  onBack,
  onComplete,
}: PreferencesStepProps) {
  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Practice Preferences</CardTitle>
        <CardDescription>Set default settings for your clinic.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
          >
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
          >
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="CAD">Canadian Dollar (C$)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interval">Default Appointment Interval</Label>
          <select
            id="interval"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={appointmentInterval}
            onChange={(e) => onAppointmentIntervalChange(e.target.value)}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>

        <div className="pt-2 flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={() => onComplete({ timezone, currency, appointmentInterval })}>
            Complete Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
