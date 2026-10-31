import { NextResponse } from "next/server";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { toPublicProfile, verifyAndChangePatientPhone } from "@/lib/db/store";
import { changeMobileVerifySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = changeMobileVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid mobile OTP" },
        { status: 400 }
      );
    }

    const updated = verifyAndChangePatientPhone({
      userId: user.id,
      newPhone: parsed.data.newPhone,
      otp: parsed.data.otp,
    });

    await setSessionCookie({
      userId: updated.id,
      role: updated.role,
      phone: updated.phone,
      mustChangePassword: updated.must_change_password,
    });

    return NextResponse.json({
      success: true,
      user: toPublicProfile(updated),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not update mobile number",
      },
      { status: 400 }
    );
  }
}

