import { CatalogManagerClient } from "@/components/admin/catalog-manager-client";
import {
  getHospitals,
  getLocations,
  getSpecialties,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function AdminHospitalsPage() {
  return (
    <CatalogManagerClient
      initialHospitals={getHospitals(true)}
      initialSpecialties={getSpecialties(true)}
      initialLocations={getLocations(true)}
    />
  );
}

