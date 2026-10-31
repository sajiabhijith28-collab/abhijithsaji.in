import { DoctorsManagerClient } from "@/components/admin/doctors-manager-client";
import {
  getHospitals,
  getLocations,
  getPlatformSettings,
  getSpecialties,
  searchDoctors,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminDoctorsPage() {
  const doctors = searchDoctors({ includeInactive: true });
  const hospitals = getHospitals(true);
  const specialties = getSpecialties(true);
  const locations = getLocations(true);
  const settings = getPlatformSettings();

  return (
    <DoctorsManagerClient
      initialDoctors={doctors}
      hospitals={hospitals}
      specialties={specialties}
      locations={locations}
      settings={settings}
    />
  );
}

