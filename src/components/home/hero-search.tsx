"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LocateFixed, MapPin, Search, Stethoscope } from "lucide-react";
import { useLocationContext } from "@/components/providers/location-provider";
import { Button } from "@/components/ui/button";
import type { SpecialtyRecord } from "@/types/database";

export function HeroSearch({
  specialties,
}: {
  specialties: SpecialtyRecord[];
}) {
  const router = useRouter();
  const { city, setCity, detectLocation, isDetecting, availableCities } =
    useLocationContext();
  const [specialty, setSpecialty] = useState("all");
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== "All Cities") params.set("city", city);
    if (specialty && specialty !== "all") params.set("specialty", specialty);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/doctors?${params.toString()}`);
  };

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="w-full rounded-2xl border bg-card p-3 shadow-xl md:p-4"
    >
      <div className="grid gap-3 md:grid-cols-12 items-center">
        {/* Location Picker + GPS */}
        <div className="md:col-span-3 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <select
            aria-label="Location"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent text-sm font-medium focus:outline-none"
          >
            {availableCities.length > 1 && (
              <option value="All Cities">All Towns (Kerala)</option>
            )}
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}, Kerala
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            title="Use current GPS location"
            className="rounded-lg p-1 text-primary hover:bg-primary/10 transition-colors"
          >
            <LocateFixed
              className={`h-4 w-4 ${isDetecting ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Specialty Picker */}
        <div className="md:col-span-3 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
          <Stethoscope className="h-4 w-4 text-primary shrink-0" />
          <select
            aria-label="Specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full bg-transparent text-sm font-medium focus:outline-none"
          >
            <option value="all">All Specialties</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Free-text query */}
        <div className="md:col-span-4 flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Doctor name, hospital, symptom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="w-full h-11 font-semibold">
            Find Doctors
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

