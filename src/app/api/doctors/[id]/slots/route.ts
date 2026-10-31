import { NextResponse } from "next/server";
import { getDoctorSlotsForDate } from "@/lib/db/store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 });
  }
  const result = getDoctorSlotsForDate(id, date);
  return NextResponse.json(result);
}

