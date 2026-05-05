import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile, staff, preferences } = body

    if (!profile || !staff || !preferences) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // TODO: replace with real DB / backend call
    const clinicId = crypto.randomUUID()
    return NextResponse.json({
      success: true,
      clinicId,
      profile,
      staffCount: staff.length,
      preferences,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
