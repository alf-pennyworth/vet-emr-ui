"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface ClinicProfileData {
  name: string
  address: string
  phone: string
  email: string
}

interface ClinicProfileStepProps {
  value: ClinicProfileData
  onChange: (data: ClinicProfileData) => void
  onNext: () => void
}

export function ClinicProfileStep({ value, onChange, onNext }: ClinicProfileStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ClinicProfileData, string>>>({})

  const validate = () => {
    const nextErrors: Partial<Record<keyof ClinicProfileData, string>> = {}
    if (!value.name.trim()) nextErrors.name = "Clinic name is required"
    if (!value.address.trim()) nextErrors.address = "Address is required"
    if (!value.phone.trim()) nextErrors.phone = "Phone number is required"
    if (!value.email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      nextErrors.email = "Enter a valid email"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Clinic Profile</CardTitle>
        <CardDescription>Enter your clinic&apos;s basic information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clinic-name">Clinic Name</Label>
          <Input
            id="clinic-name"
            placeholder="e.g. Happy Paws Veterinary Clinic"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clinic-address">Address</Label>
          <Textarea
            id="clinic-address"
            placeholder="Street, City, State, ZIP"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            aria-invalid={!!errors.address}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clinic-phone">Phone</Label>
            <Input
              id="clinic-phone"
              placeholder="(555) 555-5555"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-email">Email</Label>
            <Input
              id="clinic-email"
              type="email"
              placeholder="contact@clinic.com"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleNext}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  )
}
