import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/session";
import { getDoctorById, getPlatformSettings } from "@/lib/db/store";
import { calculateBookingFees } from "@/lib/payments/fee-calculator";

export const dynamic = "force-dynamic";

export default async function BookDoctorPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;
  const doctor = getDoctorById(doctorId);
  if (!doctor) {
    notFound();
  }

  const settings = getPlatformSettings();
  const feeBreakdown = calculateBookingFees(doctor, settings);
  const currentUser = await getCurrentUser();

  return (
    <div className="container py-8 md:py-12 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Book Appointment</h1>
        <p className="text-sm text-muted-foreground">
          Choose your preferred slot and review the transparent fee breakdown
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <BookingWizard
          doctor={doctor}
          feeBreakdown={feeBreakdown}
          currentUser={currentUser}
        />
      </Suspense>
    </div>
  );
}

