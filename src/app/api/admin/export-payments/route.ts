import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { adminGetPaymentsLedger } from "@/lib/db/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = adminGetPaymentsLedger();
  const headers = [
    "Booking Code",
    "Appointment Date",
    "Patient Name",
    "Patient Phone",
    "Doctor Name",
    "Consultation Fee - Pay at Clinic (INR)",
    "Platform Fee - Paid Online (INR)",
    "Online Paid (INR)",
    "Payment Status",
    "Payment Method",
    "UPI UTR / Ref No",
    "Paid To UPI ID",
    "Order / Gateway ID",
    "Payment / Txn ID",
    "Refund Amount (INR)",
    "Created At",
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.booking_code,
        r.appointment_date,
        r.patient_name,
        r.patient_phone,
        r.doctor_name,
        r.consultation_fee,
        r.platform_fee,
        r.total_amount,
        r.status,
        r.payment_method || "",
        r.upi_utr || "",
        r.upi_paid_to || "",
        r.razorpay_order_id,
        r.razorpay_payment_id || "",
        r.refund_amount || 0,
        r.created_at,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mydr-payments-${
        new Date().toISOString().split("T")[0]
      }.csv"`,
    },
  });
}

