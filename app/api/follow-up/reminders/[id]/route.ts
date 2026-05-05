import { NextResponse } from "next/server"
import { updateFollowUpReminder, deleteFollowUpReminder } from "@/lib/follow-up"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const allowed: Array<keyof typeof body> = [
      "title",
      "description",
      "scheduledAt",
      "completedAt",
      "dismissedAt",
      "priority",
      "assignedTo",
      "status",
    ]
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    const updated = await updateFollowUpReminder(id, patch)
    if (!updated) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }
    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ok = await deleteFollowUpReminder(id)
    if (!ok) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
