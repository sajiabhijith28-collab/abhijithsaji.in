import crypto from "crypto";

function getSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET ||
    "mydr-local-dev-hmac-secret-key-2026-change-in-prod"
  );
}

/**
 * Deterministic salted SHA-256 password hash using Node crypto.scryptSync.
 */
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedBuffer = crypto.scryptSync(plain, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (derivedBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
}

export interface SessionPayload {
  userId: string;
  role: "patient" | "doctor" | "admin";
  phone: string;
  fullName?: string;
  city?: string;
  mustChangePassword?: boolean;
  exp: number;
}

/**
 * Signs a compact stateless OTP verification challenge token.
 */
export function signOtpToken(payload: {
  phone: string;
  otp: string;
  fullName?: string;
}): string {
  const fullPayload = {
    phone: payload.phone,
    otp: payload.otp,
    fullName: payload.fullName,
    exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 mins
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyOtpToken(token?: string): {
  phone: string;
  otp: string;
  fullName?: string;
} | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Signs a compact JWT-like session token using HMAC-SHA256 (Edge & Node compatible).
 */
export function signSessionToken(
  payload: Omit<SessionPayload, "exp">,
  ttlSeconds = 60 * 60 * 24 * 7
): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Generates and verifies Razorpay HMAC-SHA256 payment signatures.
 */
export function getRazorpaySecret(): string {
  return (
    process.env.RAZORPAY_KEY_SECRET || "rzp_test_demo_secret_mydr_platform"
  );
}

export function createRazorpaySignature(
  orderId: string,
  paymentId: string
): string {
  return crypto
    .createHmac("sha256", getRazorpaySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = createRazorpaySignature(orderId, paymentId);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateTempDoctorPassword(): string {
  const digits = crypto.randomInt(1000, 9999);
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const c1 = chars[crypto.randomInt(0, chars.length)];
  const c2 = chars[crypto.randomInt(0, chars.length)];
  return `Dr@${digits}${c1}${c2}`;
}

