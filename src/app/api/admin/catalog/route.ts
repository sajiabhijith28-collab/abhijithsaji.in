import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  adminTogglePatientActive,
  adminUpsertHospital,
  adminUpsertLocation,
  adminUpsertSpecialty,
} from "@/lib/db/store";
import {
  adminHospitalSchema,
  adminLocationSchema,
  adminSpecialtySchema,
} from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { entity, payload } = body;

    if (entity === "hospital") {
      const parsed = adminHospitalSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid hospital" },
          { status: 400 }
        );
      }
      const record = adminUpsertHospital(parsed.data);
      return NextResponse.json({ success: true, record });
    }

    if (entity === "specialty") {
      const parsed = adminSpecialtySchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid specialty" },
          { status: 400 }
        );
      }
      const record = adminUpsertSpecialty(parsed.data);
      return NextResponse.json({ success: true, record });
    }

    if (entity === "location") {
      const parsed = adminLocationSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid location" },
          { status: 400 }
        );
      }
      const record = adminUpsertLocation(parsed.data);
      return NextResponse.json({ success: true, record });
    }

    if (entity === "patient_status") {
      adminTogglePatientActive(payload.patientId, Boolean(payload.isActive));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown entity type" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Operation failed" },
      { status: 400 }
    );
  }
}

