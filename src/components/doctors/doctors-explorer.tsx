"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Calendar,
  Filter,
  LocateFixed,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  UserX,
} from "lucide-react";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { useLocationContext } from "@/components/providers/location-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DoctorWithDetails,
  HospitalRecord,
  LocationRecord,
  SpecialtyRecord,
} from "@/types/database";
import { formatINR } from "@/lib/utils";

export function DoctorsExplorer({
  initialDoctors,
  specialties,
  hospitals,
  locations,
}: {
  initialDoctors: DoctorWithDetails[];
  specialties: SpecialtyRecord[];
  hospitals: HospitalRecord[];
  locations: LocationRecord[];
}) {
  const searchParams = useSearchParams();
  const {
    city: globalCity,
    setCity: setGlobalCity,
    detectLocation,
    isDetecting,
  } = useLocationContext();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || "Ponkunnam"
  );
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [specialtySlug, setSpecialtySlug] = useState(
    searchParams.get("specialty") || "all"
  );
  const [hospitalId, setHospitalId] = useState("all");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [maxFee, setMaxFee] = useState<number>(2500);
  const [minRating, setMinRating] = useState<number>(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync with navbar city selector if URL didn't explicitly override
  useEffect(() => {
    const urlCity = searchParams.get("city");
    if (urlCity) {
      setSelectedCity(urlCity);
    } else if (globalCity) {
      setSelectedCity(globalCity);
    }
  }, [globalCity, searchParams]);

  useEffect(() => {
    const urlSpec = searchParams.get("specialty");
    if (urlSpec) setSpecialtySlug(urlSpec);
    const urlQ = searchParams.get("q");
    if (urlQ !== null) setQuery(urlQ);
  }, [searchParams]);

  const cities = useMemo(
    () => Array.from(new Set(locations.map((l) => l.city))),
    [locations]
  );

  const areasForCity = useMemo(() => {
    if (selectedCity === "All Cities") return [];
    return locations
      .filter((l) => l.city === selectedCity)
      .map((l) => l.area);
  }, [locations, selectedCity]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== "All Cities") count++;
    if (selectedArea !== "All Areas") count++;
    if (specialtySlug !== "all") count++;
    if (hospitalId !== "all") count++;
    if (availabilityDate) count++;
    if (maxFee < 2500) count++;
    if (minRating > 0) count++;
    return count;
  }, [
    selectedCity,
    selectedArea,
    specialtySlug,
    hospitalId,
    availabilityDate,
    maxFee,
    minRating,
  ]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialDoctors.filter((doc) => {
      if (
        selectedCity !== "All Cities" &&
        doc.location.city.toLowerCase() !== selectedCity.toLowerCase()
      ) {
        return false;
      }
      if (
        selectedArea !== "All Areas" &&
        doc.location.area.toLowerCase() !== selectedArea.toLowerCase()
      ) {
        return false;
      }
      if (specialtySlug !== "all" && doc.specialty.slug !== specialtySlug) {
        return false;
      }
      if (hospitalId !== "all" && doc.hospital_id !== hospitalId) {
        return false;
      }
      if (doc.consultation_fee > maxFee) {
        return false;
      }
      if (minRating > 0 && doc.rating < minRating) {
        return false;
      }
      if (availabilityDate) {
        const dt = new Date(availabilityDate + "T00:00:00");
        if (dt.getDay() === 0 && !doc.is_featured) {
          return false;
        }
      }
      if (q) {
        const hay = [
          doc.full_name,
          doc.specialty.name,
          doc.hospital.name,
          doc.location.city,
          doc.location.area,
          ...doc.qualifications,
          ...doc.languages,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    initialDoctors,
    query,
    selectedCity,
    selectedArea,
    specialtySlug,
    hospitalId,
    maxFee,
    minRating,
    availabilityDate,
  ]);

  const resetFilters = () => {
    const defaultCity = cities[0] || "Ponkunnam";
    setQuery("");
    setSelectedCity(defaultCity);
    setGlobalCity(defaultCity);
    setSelectedArea("All Areas");
    setSpecialtySlug("all");
    setHospitalId("all");
    setAvailabilityDate("");
    setMaxFee(2500);
    setMinRating(0);
  };

  const renderFilterFields = (prefix: string) => (
    <div className="space-y-4">
      {/* City / Town */}
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-city`} className="text-xs">
          Town / City (Kerala)
        </Label>
        <select
          id={`${prefix}-city`}
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setGlobalCity(e.target.value);
            setSelectedArea("All Areas");
          }}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {cities.length > 1 && (
            <option value="All Cities">All Towns (Kerala)</option>
          )}
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}, Kerala
            </option>
          ))}
        </select>
      </div>

      {/* Area */}
      {areasForCity.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-area`} className="text-xs">
            Locality / Area
          </Label>
          <select
            id={`${prefix}-area`}
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="All Areas">All Areas in {selectedCity}</option>
            {areasForCity.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Specialty */}
      <div className="space-y-1.5">
        <Label htmlFor={`${prefix}-spec`} className="text-xs">
          Specialty
        </Label>
        <select
          id={`${prefix}-spec`}
          value={specialtySlug}
          onChange={(e) => setSpecialtySlug(e.target.value)}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Hospital */}
      <div className="space-y-1.5">
        <Label
          htmlFor={`${prefix}-hosp`}
          className="text-xs flex items-center gap-1"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          Hospital / Clinic
        </Label>
        <select
          id={`${prefix}-hosp`}
          value={hospitalId}
          onChange={(e) => setHospitalId(e.target.value)}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Partner Hospitals</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Availability Date */}
      <div className="space-y-1.5">
        <Label
          htmlFor={`${prefix}-date`}
          className="text-xs flex items-center gap-1"
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          Availability Date
        </Label>
        <Input
          id={`${prefix}-date`}
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={availabilityDate}
          onChange={(e) => setAvailabilityDate(e.target.value)}
        />
      </div>

      {/* Max Fee */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <Label htmlFor={`${prefix}-fee`} className="text-xs">
            Max Consultation Fee
          </Label>
          <span className="font-semibold text-primary tabular-nums">
            Up to {formatINR(maxFee)}
          </span>
        </div>
        <input
          id={`${prefix}-fee`}
          type="range"
          min={500}
          max={2500}
          step={100}
          value={maxFee}
          onChange={(e) => setMaxFee(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2">
        <Label className="text-xs">Minimum Rating</Label>
        <div className="flex gap-1.5">
          {[0, 4.5, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                minRating === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {r === 0 ? (
                "Any"
              ) : (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-5 md:py-10 space-y-5">
      {/* Page Title + Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default">Verified Specialists</Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {selectedCity === "All Cities"
                ? "Ponkunnam, Kerala"
                : `${selectedCity}, Kerala`}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {selectedCity === "All Cities"
              ? "Doctors & Specialists in Ponkunnam, Kerala"
              : `Top Doctors in ${selectedCity}, Kerala`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {filteredDoctors.length} verified medical{" "}
            {filteredDoctors.length === 1 ? "specialist" : "specialists"} with
            instant online booking
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={isDetecting}
          >
            <LocateFixed
              className={`h-3.5 w-3.5 ${isDetecting ? "animate-spin" : ""}`}
            />
            Use My GPS Location
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* MOBILE STICKY SEARCH + SPECIALTY CHIPS + FILTER DRAWER TRIGGER */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search doctor, specialty, hospital..."
              className="pl-9 h-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
            className="shrink-0 h-10 px-3 gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Horizontal Specialty Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSpecialtySlug("all")}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              specialtySlug === "all"
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "bg-card hover:bg-muted text-foreground"
            }`}
          >
            All Specialties
          </button>
          {specialties.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpecialtySlug(s.slug)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                specialtySlug === s.slug
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "bg-card hover:bg-muted text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Desktop Sidebar Filters */}
        <Card className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-heading text-sm font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Filter Doctors
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-primary hover:underline font-medium"
              >
                Clear all
              </button>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-q" className="text-xs">
                Doctor, Hospital or Qualification
              </Label>
              <div className="relative">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="doc-q"
                  placeholder="Search e.g. AIIMS, Cardio..."
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {renderFilterFields("desk")}
          </CardContent>
        </Card>

        {/* Results Grid */}
        <div className="lg:col-span-9">
          {filteredDoctors.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <UserX className="h-7 w-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-heading text-lg font-bold">
                    No matching doctors found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try expanding your city filter to &ldquo;All Cities&rdquo;
                    or increasing the consultation fee limit.
                  </p>
                </div>
                <Button onClick={resetFilters}>Reset All Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {filteredDoctors.map((doc, idx) => (
                <DoctorCard key={doc.id} doctor={doc} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet Modal */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filter &amp; Refine Doctors
            </DialogTitle>
            <DialogDescription>
              Filter specialists by city, hospital, availability date, and
              consultation fee
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">{renderFilterFields("mob")}</div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={resetFilters}
            >
              Reset All
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {filteredDoctors.length} Doctors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
