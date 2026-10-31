import { BookingsManagerClient } from "@/components/admin/bookings-manager-client";
import { adminGetAllBookings, adminGetAllPatients } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminBookingsPage() {
  return (
    <BookingsManagerClient
      initialBookings={adminGetAllBookings()}
      initialPatients={adminGetAllPatients()}
    />
  );
}

