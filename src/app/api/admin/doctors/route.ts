import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminResetDoctorCredentials,
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

