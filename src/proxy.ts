import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "mydr_session";

interface EdgeSessionPayload {
  userId: string;
  role: "patient" | "doctor" | "admin";
  phone: string;
  mustChangePassword?: boolean;
  exp: number;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function verifySessionEdge(
  token?: string
): Promise<EdgeSessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  try {
    const secret =
      process.env.AUTH_SESSION_SECRET ||
      "mydr-local-dev-hmac-secret-key-2026-change-in-prod";
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(sig);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      enc.encode(encoded)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(base64UrlToUint8Array(encoded));
    const payload = JSON.parse(jsonStr) as EdgeSessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionEdge(token);

  // 1. Patient protected routes
  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Doctor portal routes
  if (pathname.startsWith("/doctor")) {
    if (!session || session.role !== "doctor") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("tab", "doctor");
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Admin subroutes (/admin/* requires admin role; /admin itself renders Admin Login Gate if not admin)
  if (pathname.startsWith("/admin/") && (!session || session.role !== "admin")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/doctor/:path*",
    "/admin/:path*",
  ],
};

