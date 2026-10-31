import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { updateAppointmentStatusByStaff } from "@/lib/db/store";
import { doctorStatusUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = doctorStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid status update" },
        { status: 400 }
      );
    }

    const updated = updateAppointmentStatusByStaff({
      appointmentId: parsed.data.appointmentId,
      actorUserId: user.id,
      actorRole: user.role,
      status: parsed.data.status,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 400 }
    );
  }
}

