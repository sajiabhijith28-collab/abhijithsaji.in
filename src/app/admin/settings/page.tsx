import { SettingsClient } from "@/components/admin/settings-client";
import { getPlatformSettings } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return <SettingsClient initialSettings={getPlatformSettings()} />;
}

