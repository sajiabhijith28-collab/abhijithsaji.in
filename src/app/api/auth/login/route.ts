import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { authenticateWithPassword, toPublicProfile } from "@/lib/db/store";
import { passwordLoginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = passwordLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const profile = authenticateWithPassword({
      phone: parsed.data.phone,
      password: parsed.data.password,
      expectedRole: parsed.data.expectedRole,
    });

    await setSessionCookie({
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
      mustChangePassword: profile.must_change_password,
    });

    return NextResponse.json({
      success: true,
      user: toPublicProfile(profile),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Authentication failed",
      },
      { status: 401 }
    );
  }
}

