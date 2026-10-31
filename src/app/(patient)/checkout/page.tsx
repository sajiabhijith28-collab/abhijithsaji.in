import crypto from "crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/booking/checkout-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppointmentById, getPlatformSettings } from "@/lib/db/store";
import { createRazorpaySignature } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/checkout");
  }

  const { bookingId } = await searchParams;
  if (!bookingId) {
    return (
      <div className="container py-16 max-w-lg text-center">
        <Card>
          <CardContent className="p-8 space-y-4">
            <h1 className="font-heading text-xl font-bold">
              No Active Checkout Selected
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a doctor and time slot first to proceed to secure payment.
            </p>
            <Button asChild>
              <Link href="/doctors">Browse Doctors</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const appointment = getAppointmentById(bookingId);
  if (!appointment || (user.role === "patient" && appointment.patient_id !== user.id)) {
    redirect("/account/appointments");
  }

  const platformSettings = getPlatformSettings();

  const orderId =
    appointment.payment?.razorpay_order_id ||
    `order_test_${crypto.randomBytes(6).toString("hex")}`;
  const isLiveGateway = Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
  const testSimPaymentId = !isLiveGateway
    ? `pay_test_${crypto.randomBytes(6).toString("hex")}`
    : undefined;
  const testSimSignature =
    !isLiveGateway && testSimPaymentId
      ? createRazorpaySignature(orderId, testSimPaymentId)
      : undefined;

  return (
    <div className="container py-8 md:py-12">
      <CheckoutClient
        initialAppointment={appointment}
        platformSettings={platformSettings}
        fallbackOrderPayload={{
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || null,
          orderId,
          amountInPaise: Math.round(appointment.platform_fee * 100),
          currency: "INR",
          isLiveGateway,
          testSimPaymentId,
          testSimSignature,
        }}
      />
    </div>
  );
}

