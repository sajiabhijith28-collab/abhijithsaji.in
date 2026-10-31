import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicProfile, updatePatientProfile } from "@/lib/db/store";
import { updateProfileSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid profile fields" },
        { status: 400 }
      );
    }
    const updated = updatePatientProfile(user.id, parsed.data);
    return NextResponse.json({
      success: true,
      user: toPublicProfile(updated),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update profile" },
      { status: 400 }
    );
  }
}

