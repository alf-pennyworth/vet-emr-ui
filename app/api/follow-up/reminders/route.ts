import { NextResponse } from "next/server"
import { listFollowUpReminders, createFollowUpReminder } from "@/lib/follow-up"
import { FollowUpReminder } from "@/lib/follow-up"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId") || undefined
  const clinicId = searchParams.get("clinicId") || "default-clinic"
  const status = (searchParams.get("status") as any) || undefined
  const reminders = await listFollowUpReminders({ patientId, clinicId, status })
  return NextResponse.json({ data: reminders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      clinicId,
      patientId,
      encounterId,
      scheduledAt,
      title,
      description,
      priority,
      assignedTo,
    } = body

    if (!clinicId || !patientId || !scheduledAt || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const reminder = await createFollowUpReminder({
      clinicId,
      patientId,
      encounterId,
      triggerType: "manual",
      scheduledAt,
      title,
      description,
      priority: priority || "medium",
      assignedTo,
      status: "pending",
    })

    return NextResponse.json({ data: reminder }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
