import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, setSessionCookie } from "@/lib/auth/session";
import {
  toPublicProfile,
  upsertVerifiedPatient,
  verifyOtpChallengeAndUpsertPatient,
} from "@/lib/db/store";
import { verifyOtpToken } from "@/lib/security";
import { normalizeIndianPhone } from "@/lib/utils";
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

    const cookieHeader = request.headers.get("cookie") || "";
    const cookiesMap = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k.trim(), decodeURIComponent(v.join("="))];
      })
    );
    const challengeCookie = cookiesMap["mydr_otp_challenge"];

    let result;
    try {
      result = verifyOtpChallengeAndUpsertPatient({
        phone: parsed.data.phone,
        otp: parsed.data.otp,
        fullName: parsed.data.fullName,
        city: parsed.data.city,
      });
    } catch (primaryErr) {
      // Stateless fallback for serverless instances where /tmp db might be cold
      const verified = verifyOtpToken(challengeCookie);
      const normalizedPhone = normalizeIndianPhone(parsed.data.phone);
      if (
        verified &&
        verified.phone === normalizedPhone &&
        verified.otp === parsed.data.otp.trim()
      ) {
        result = upsertVerifiedPatient({
          phone: normalizedPhone,
          fullName: parsed.data.fullName || verified.fullName,
          city: parsed.data.city,
        });
      } else {
        throw primaryErr;
      }
    }

    const { profile, isNewUser, needsProfileSetup } = result;

    const token = await setSessionCookie({
      userId: profile.id,
      role: profile.role,
      phone: profile.phone,
      fullName: profile.full_name,
      city: profile.city,
      mustChangePassword: profile.must_change_password,
    });

    const response = NextResponse.json({
      success: true,
      isNewUser,
      needsProfileSetup,
      user: toPublicProfile(profile),
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.delete("mydr_otp_challenge");
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "OTP verification failed",
      },
      { status: 400 }
    );
  }
}

