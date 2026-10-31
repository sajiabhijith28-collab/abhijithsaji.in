import { PaymentsLedgerClient } from "@/components/admin/payments-ledger-client";
import { adminGetPaymentsLedger, searchDoctors } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  const { rows } = adminGetPaymentsLedger();
  const doctors = searchDoctors({ includeInactive: true }).map((d) => ({
    id: d.id,
    name: d.full_name,
  }));

  return <PaymentsLedgerClient rows={rows} doctors={doctors} />;
}

