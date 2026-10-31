import { Suspense } from "react";
import { DoctorsExplorer } from "@/components/doctors/doctors-explorer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getHospitals,
  getLocations,
  getSpecialties,
  searchDoctors,
} from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function DoctorsPage() {
  const doctors = searchDoctors();
  const specialties = getSpecialties();
  const hospitals = getHospitals();
  const locations = getLocations();

  return (
    <Suspense
      fallback={
        <div className="container py-10 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-64 rounded-2xl" />
          ))}
        </div>
      }
    >
      <DoctorsExplorer
        initialDoctors={doctors}
        specialties={specialties}
        hospitals={hospitals}
        locations={locations}
      />
    </Suspense>
  );
}

