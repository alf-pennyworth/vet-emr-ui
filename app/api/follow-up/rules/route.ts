import { NextResponse } from "next/server"
import { listFollowUpRules, upsertFollowUpRule, seedDefaultRules } from "@/lib/follow-up"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clinicId = searchParams.get("clinicId") || "default-clinic"
  let rules = await listFollowUpRules(clinicId)
  if (rules.length === 0) {
    rules = await seedDefaultRules(clinicId)
  }
  return NextResponse.json({ data: rules })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rule = await upsertFollowUpRule(body)
    return NextResponse.json({ data: rule }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
