import { PayoutsManagerClient } from "@/components/admin/payouts-manager-client";
import { adminGetPayoutSummary } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminPayoutsPage() {
  const { doctorsSummary, payoutBatches } = adminGetPayoutSummary();
  return (
    <PayoutsManagerClient
      doctorsSummary={doctorsSummary}
      payoutBatches={payoutBatches}
    />
  );
}

