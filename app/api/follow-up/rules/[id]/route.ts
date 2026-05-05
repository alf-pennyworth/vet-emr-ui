import { NextResponse } from "next/server"
import { updateFollowUpRule, deleteFollowUpRule } from "@/lib/follow-up"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const allowed: Array<keyof typeof body> = [
      "name",
      "description",
      "diagnosisPattern",
      "treatmentPattern",
      "speciesFilter",
      "daysAfterEncounter",
      "priority",
      "titleTemplate",
      "descriptionTemplate",
      "isActive",
      "sortOrder",
    ]
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key]
    }
    const updated = await updateFollowUpRule(id, patch)
    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
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
    const ok = await deleteFollowUpRule(id)
    if (!ok) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
