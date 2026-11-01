import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorByProfileId, updateDoctorPhoto } from "@/lib/db/store";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = getDoctorByProfileId(user.id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const photoUrl = typeof body.photo_url === "string" ? body.photo_url.trim() : "";

    if (!photoUrl) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    const updated = updateDoctorPhoto(doctor.id, photoUrl);

    return NextResponse.json({
      success: true,
      doctor: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update doctor profile" },
      { status: 400 }
    );
  }
}
