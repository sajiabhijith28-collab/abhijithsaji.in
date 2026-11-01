import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminDeleteDoctor,
  adminResetDoctorCredentials,
  adminToggleDoctorStatus,
  adminUpsertDoctor,
} from "@/lib/db/store";
import { adminUpsertDoctorSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();

    // Toggle active / deactivate action
    if (body.action === "toggle_status" && body.doctorId) {
      const updated = adminToggleDoctorStatus(
        body.doctorId,
        Boolean(body.is_active)
      );
      return NextResponse.json({ success: true, doctor: updated });
    }

    // Optional credential regeneration action
    if (body.action === "reset_credentials" && body.doctorId) {
      const creds = adminResetDoctorCredentials(body.doctorId);
      return NextResponse.json({ success: true, credentials: creds });
    }

    const parsed = adminUpsertDoctorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid doctor input" },
        { status: 400 }
      );
    }

    const result = adminUpsertDoctor(parsed.data);
    return NextResponse.json({
      success: true,
      doctor: result.doctor,
      credentials: result.generatedCredentials,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save doctor" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("id");
    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    const result = adminDeleteDoctor(doctorId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete doctor" },
      { status: 400 }
    );
  }
}

