import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createBookingLockAndOrder,
  getDoctorById,
  getPlatformSettings,
} from "@/lib/db/store";
import { calculateBookingFees } from "@/lib/payments/fee-calculator";
import { createRazorpaySignature } from "@/lib/security";
import { createBookingLockSchema } from "@/lib/validations";

async function createRazorpayOrderOnServer(params: {
  amountInPaise: number;
  receipt: string;
}): Promise<{ orderId: string; isLiveGateway: boolean }> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret) {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        currency: "INR",
        receipt: params.receipt,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Razorpay Order API error: ${errBody}`);
    }
    const orderJson = (await res.json()) as { id: string };
    return { orderId: orderJson.id, isLiveGateway: true };
  }

  // Test-mode server order ID
  return {
    orderId: `order_test_${crypto.randomBytes(7).toString("hex")}`,
    isLiveGateway: false,
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in as a patient to book an appointment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createBookingLockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid booking details" },
        { status: 400 }
      );
    }

    const doc = getDoctorById(parsed.data.doctorId);
    if (!doc) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const settings = getPlatformSettings();
    const fees = calculateBookingFees(doc, settings);
    // Patient pays ONLY the Platform Booking Fee online; Consultation Fee is paid at the clinic
    const amountInPaise = Math.round(fees.onlinePayable * 100);

    const { orderId, isLiveGateway } =
      amountInPaise > 0
        ? await createRazorpayOrderOnServer({
            amountInPaise,
            receipt: `rcpt_${Date.now()}`,
          })
        : {
            orderId: `order_free_${crypto.randomBytes(6).toString("hex")}`,
            isLiveGateway: false,
          };

    const { appointment, payment } = createBookingLockAndOrder({
      patientId: user.id,
      doctorId: parsed.data.doctorId,
      appointmentDate: parsed.data.appointmentDate,
      slotTime: parsed.data.slotTime,
      patientName: parsed.data.patientName,
      patientAge: parsed.data.patientAge,
      patientGender: parsed.data.patientGender,
      patientPhone: parsed.data.patientPhone,
      symptomsNotes: parsed.data.symptomsNotes,
      razorpayOrderId: orderId,
      payAtClinic: parsed.data.payAtClinic,
    });

    // When running in local Test Simulator mode (without live Razorpay keys),
    // prepare a server-generated test payment token that still undergoes full HMAC verification!
    const testSimPaymentId = !isLiveGateway
      ? `pay_test_${crypto.randomBytes(7).toString("hex")}`
      : undefined;
    const testSimSignature =
      !isLiveGateway && testSimPaymentId
        ? createRazorpaySignature(orderId, testSimPaymentId)
        : undefined;

    return NextResponse.json({
      success: true,
      appointment,
      payment,
      razorpay: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
        orderId,
        amountInPaise,
        currency: "INR",
        isLiveGateway,
        testSimPaymentId,
        testSimSignature,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to lock appointment slot",
      },
      { status: 409 }
    );
  }
}

