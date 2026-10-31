import { NextResponse } from "next/server";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { toPublicProfile, updateUserPassword } from "@/lib/db/store";
import { setPasswordSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid password" },
        { status: 400 }
      );
    }

    const updated = updateUserPassword({
      userId: current.id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    await setSessionCookie({
      userId: updated.id,
      role: updated.role,
      phone: updated.phone,
      mustChangePassword: false,
    });

    return NextResponse.json({
      success: true,
      user: toPublicProfile(updated),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not update password",
      },
      { status: 400 }
    );
  }
}

