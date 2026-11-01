import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  cancelAppointmentWithRefund,
  confirmPayAtClinic,
  getAppointmentById,
  reschedulePatientAppointment,
} from "@/lib/db/store";
import { cancelOrRescheduleSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const appointment = getAppointmentById(id);
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role === "patient" && appointment.patient_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ appointment });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const body = await request.json();
    const parsed = cancelOrRescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid action" },
        { status: 400 }
      );
    }

    if (parsed.data.action === "pay_at_clinic") {
      const result = confirmPayAtClinic({
        appointmentId: id,
        actorUserId: user.id,
      });
      return NextResponse.json({
        success: true,
        appointment: result.appointment,
        payment: result.payment,
      });
    }

    if (parsed.data.action === "cancel") {
      const result = cancelAppointmentWithRefund({
        appointmentId: id,
        actorUserId: user.id,
        actorRole: user.role,
        reason: parsed.data.reason,
      });
      return NextResponse.json({
        success: true,
        appointment: result.appointment,
        refundAmount: result.refundAmount,
      });
    }

    if (
      parsed.data.action === "reschedule" &&
      parsed.data.newDate &&
      parsed.data.newSlotTime
    ) {
      const updated = reschedulePatientAppointment({
        appointmentId: id,
        patientId: user.id,
        newDate: parsed.data.newDate,
        newSlotTime: parsed.data.newSlotTime,
      });
      return NextResponse.json({ success: true, appointment: updated });
    }

    return NextResponse.json(
      { error: "Missing reschedule date or slot time" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 400 }
    );
  }
}

