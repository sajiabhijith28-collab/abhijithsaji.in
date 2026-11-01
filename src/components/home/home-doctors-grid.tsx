"use client";

import Link from "next/link";
import { MapPin, Stethoscope } from "lucide-react";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { useLocationContext } from "@/components/providers/location-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DoctorWithDetails } from "@/types/database";

/**
 * Homepage doctor grid that follows the city chosen in the navbar
 * (Ponkunnam / Palai / All Cities).
 */
export function HomeDoctorsGrid({ doctors }: { doctors: DoctorWithDetails[] }) {
  const { city, setCity, availableCities } = useLocationContext();

  const inCity =
    city === "All Cities"
      ? doctors
      : doctors.filter(
          (d) => d.location.city.toLowerCase() === city.toLowerCase()
        );

  if (inCity.length > 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {inCity.slice(0, 6).map((doc, idx) => (
          <DoctorCard key={doc.id} doctor={doc} index={idx} />
        ))}
      </div>
    );
  }

  const otherCities = availableCities.filter(
    (c) =>
      c.toLowerCase() !== city.toLowerCase() &&
      doctors.some((d) => d.location.city.toLowerCase() === c.toLowerCase())
  );

  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-lg font-bold">
          No doctors available in {city} yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Doctors and clinics in {city} will appear here as soon as they are
          onboarded by the administrator.
        </p>
        {otherCities.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {otherCities.map((c) => (
              <Button
                key={c}
                size="sm"
                variant="outline"
                onClick={() => setCity(c)}
              >
                <MapPin className="h-3.5 w-3.5" />
                View doctors in {c}
              </Button>
            ))}
            <Button size="sm" variant="ghost" asChild>
              <Link href="/doctors">Browse all</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

