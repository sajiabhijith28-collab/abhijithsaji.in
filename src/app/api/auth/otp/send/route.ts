import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createOtpChallenge, getProfileByPhone } from "@/lib/db/store";
import { signOtpToken } from "@/lib/security";
import { dispatchMobileOtp } from "@/lib/sms/provider";
import { sendOtpSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid mobile number" },
        { status: 400 }
      );
    }

    if (parsed.data.mode === "change_phone") {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const existing = getProfileByPhone(parsed.data.phone);
      if (existing && existing.id !== currentUser.id) {
        return NextResponse.json(
          {
            error:
              "This mobile number is already registered with another account.",
          },
          { status: 409 }
        );
      }
    }

    const { otp, normalizedPhone } = createOtpChallenge({
      phone: parsed.data.phone,
      fullName: parsed.data.fullName,
    });

    const smsResult = await dispatchMobileOtp({
      phone: normalizedPhone,
      otp,
    });

    const challengeToken = signOtpToken({
      phone: normalizedPhone,
      otp,
      fullName: parsed.data.fullName,
    });

    const response = NextResponse.json({
      success: true,
      phone: normalizedPhone,
      maskedPhone: smsResult.maskedPhone,
      liveSmsSent: smsResult.liveSmsSent,
      provider: smsResult.provider,
      fallbackSmsCode: smsResult.fallbackSmsCode,
      resendAfterSeconds: 30,
      message: `6-digit verification code sent to ${smsResult.maskedPhone}`,
    });

    response.cookies.set("mydr_otp_challenge", challengeToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 300,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to send OTP",
      },
      { status: 400 }
    );
  }
}

