import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { confirmBookingPayment } from "@/lib/db/store";
import { verifyRazorpaySignature } from "@/lib/security";
import { verifyPaymentSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid payment payload" },
        { status: 400 }
      );
    }

    // Server-side cryptographic HMAC-SHA256 verification — NEVER trust client status alone
    const isAuthentic = verifyRazorpaySignature(
      parsed.data.razorpay_order_id,
      parsed.data.razorpay_payment_id,
      parsed.data.razorpay_signature
    );

    if (!isAuthentic) {
      return NextResponse.json(
        { error: "Payment signature verification failed. Transaction rejected." },
        { status: 400 }
      );
    }

    const confirmed = confirmBookingPayment({
      appointmentId: parsed.data.appointmentId,
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature,
      paymentMethod: parsed.data.payment_method,
    });

    return NextResponse.json({
      success: true,
      appointment: confirmed,
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

