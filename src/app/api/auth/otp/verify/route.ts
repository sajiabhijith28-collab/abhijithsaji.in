import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import {
  toPublicProfile,
  verifyOtpChallengeAndUpsertPatient,
} from "@/lib/db/store";
import { verifyOtpSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid OTP input" },
        { status: 400 }
      );
    }

    const { profile, isNewUser, needsProfileSetup } =
      verifyOtpChallengeAndUpsertPatient({
        phone: parsed.data.phone,
        otp: parsed.data.otp,
        fullName: parsed.data.fullName,
        city: parsed.data.city,
      });

    await setSessionCookie({
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
      mustChangePassword: profile.must_change_password,
    });

    return NextResponse.json({
      success: true,
      isNewUser,
      needsProfileSetup,
      user: toPublicProfile(profile),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "OTP verification failed",
      },
      { status: 400 }
    );
  }
}
