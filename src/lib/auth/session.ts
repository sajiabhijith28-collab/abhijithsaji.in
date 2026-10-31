import { cookies } from "next/headers";
import { getProfileById, toPublicProfile } from "@/lib/db/store";
import {
  type SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "@/lib/security";
import type { PublicProfile } from "@/types/database";

export const SESSION_COOKIE_NAME = "mydr_session";

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<PublicProfile | null> {
  const session = await getSessionPayload();
  if (!session) return null;
  const profile = getProfileById(session.userId);
  if (!profile || !profile.is_active) return null;
  return toPublicProfile(profile);
}

export async function setSessionCookie(payload: {
  userId: string;
  role: "patient" | "doctor" | "admin";
  phone: string;
  mustChangePassword?: boolean;
}): Promise<string> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

