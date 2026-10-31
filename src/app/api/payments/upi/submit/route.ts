import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { submitUpiPaymentForVerification } from "@/lib/db/store";
import { submitUpiUtrSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please log in to submit your UPI payment reference." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = submitUpiUtrSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Enter a valid 12-digit UPI UTR / Reference Number",
        },
        { status: 400 }
      );
    }

    const result = submitUpiPaymentForVerification({
      appointmentId: parsed.data.appointmentId,
      actorUserId: user.id,
      actorRole: user.role,
      upiUtr: parsed.data.upi_utr,
      upiPayerVpa: parsed.data.upi_payer_vpa || undefined,
      upiApp: parsed.data.upi_app,
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
          err instanceof Error
            ? err.message
            : "Could not submit UPI UTR reference",
      },
      { status: 400 }
    );
  }
}

