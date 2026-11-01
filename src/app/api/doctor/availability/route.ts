import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  addDoctorLeave,
  getDoctorById,
  getDoctorByProfileId,
  removeDoctorLeave,
  saveDoctorAvailabilitySchedule,
} from "@/lib/db/store";
import {
  doctorLeaveSchema,
  saveDoctorAvailabilitySchema,
} from "@/lib/validations";

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctor =
      getDoctorByProfileId(user.id) ||
      (user.role === "admin" ? getDoctorById("doc-admin-saji") : null);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor record not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = saveDoctorAvailabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid schedule data" },
        { status: 400 }
      );
    }

    saveDoctorAvailabilitySchedule({
      doctorId: doctor.id,
      slotDurationMins: parsed.data.slotDurationMins,
      days: parsed.data.days,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save schedule" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "doctor" && user.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const doctor =
      getDoctorByProfileId(user.id) ||
      (user.role === "admin" ? getDoctorById("doc-admin-saji") : null);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor record not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = doctorLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid leave date" },
        { status: 400 }
      );
    }

    const leave = addDoctorLeave({
      doctorId: doctor.id,
      leaveDate: parsed.data.leave_date,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true, leave });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not add leave" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "doctor" && user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const doctor =
    getDoctorByProfileId(user.id) ||
    (user.role === "admin" ? getDoctorById("doc-admin-saji") : null);
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const leaveId = searchParams.get("id");
  if (!leaveId) {
    return NextResponse.json({ error: "Missing leave id" }, { status: 400 });
  }
  removeDoctorLeave(doctor.id, leaveId);
  return NextResponse.json({ success: true });
}

