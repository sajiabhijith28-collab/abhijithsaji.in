import { cookies } from "next/headers";
import {
  getProfileById,
  getProfileByPhone,
  loadDb,
  persistDb,
  toPublicProfile,
} from "@/lib/db/store";
import {
  type SessionPayload,
  signSessionToken,
  verifySessionToken,
} from "@/lib/security";
import type { ProfileRecord, PublicProfile } from "@/types/database";

export const SESSION_COOKIE_NAME = "mydr_session";

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<PublicProfile | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  let profile = getProfileById(session.userId);
  if (!profile && session.phone) {
    profile = getProfileByPhone(session.phone);
  }

  // Cross-serverless instance self-healing: if session token is cryptographically verified
  // but this particular lambda instance has a fresh in-memory db, reconstruct profile in-place
  if (!profile) {
    const db = loadDb();
    const nowIso = new Date().toISOString();
    const reconstructed: ProfileRecord = {
      id: session.userId,
      phone: session.phone,
      full_name:
        session.fullName ||
        (session.role === "admin"
          ? "Abhijith Saji"
          : session.role === "doctor"
          ? "Doctor"
          : "Patient"),
      role: session.role,
      city: session.city || "Ponkunnam",
      is_active: true,
      has_password: true,
      must_change_password: session.mustChangePassword || false,
      created_at: nowIso,
      updated_at: nowIso,
    };
    db.profiles.push(reconstructed);
    persistDb(db);
    profile = reconstructed;
  }

  if (!profile.is_active) return null;
  return toPublicProfile(profile);
}

export async function setSessionCookie(payload: {
  userId: string;
  role: "patient" | "doctor" | "admin";
  phone: string;
  fullName?: string;
  city?: string;
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

