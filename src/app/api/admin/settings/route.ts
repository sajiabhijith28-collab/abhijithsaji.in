import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminUpdatePlatformSettings, getPlatformSettings } from "@/lib/db/store";
import { platformSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const settings = getPlatformSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load settings" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = platformSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid settings" },
        { status: 400 }
      );
    }

    const settings = adminUpdatePlatformSettings(parsed.data);
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save settings" },
      { status: 400 }
    );
  }
}

