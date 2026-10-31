import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminMarkDoctorPayoutSettled } from "@/lib/db/store";
import { settlePayoutSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = settlePayoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid settlement details" },
        { status: 400 }
      );
    }

    const batch = adminMarkDoctorPayoutSettled({
      doctorId: parsed.data.doctorId,
      adminUserId: user.id,
      settlementReference: parsed.data.settlementReference,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Settlement failed" },
      { status: 400 }
    );
  }
}

