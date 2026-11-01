import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete("mydr_otp_challenge");
  return response;
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}


