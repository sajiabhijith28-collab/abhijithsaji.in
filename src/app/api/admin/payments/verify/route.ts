import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminVerifyUpiPayment } from "@/lib/db/store";
import { adminVerifyUpiPaymentSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = adminVerifyUpiPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid verification request",
        },
        { status: 400 }
      );
    }

    const result = adminVerifyUpiPayment({
      paymentId: parsed.data.paymentId,
      adminUserId: user.id,
      action: parsed.data.action,
      reason: parsed.data.reason,
    });

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      payment: result.payment,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Payment verification failed",
      },
      { status: 400 }
    );
  }
}

