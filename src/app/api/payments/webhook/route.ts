import crypto from "crypto";
import { NextResponse } from "next/server";
import { confirmBookingPayment } from "@/lib/db/store";

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "RAZORPAY_WEBHOOK_SECRET not configured" },
        { status: 501 }
      );
    }

    const signature = request.headers.get("x-razorpay-signature") || "";
    const rawBody = await request.text();

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    if (event.event === "payment.captured") {
      const entity = event.payload?.payment?.entity;
      const appointmentId = entity?.notes?.appointmentId;
      if (appointmentId && entity?.order_id && entity?.id) {
        confirmBookingPayment({
          appointmentId,
          razorpayOrderId: entity.order_id,
          razorpayPaymentId: entity.id,
          razorpaySignature: signature,
          paymentMethod: entity.method,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing error" },
      { status: 500 }
    );
  }
}

