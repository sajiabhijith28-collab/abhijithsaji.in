import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { syncClientBookings } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const count = syncClientBookings(body.bookings || []);
    return NextResponse.json({ success: true, synced: count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 400 }
    );
  }
}
