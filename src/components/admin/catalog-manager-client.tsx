"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, MapPin, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  HospitalRecord,
  LocationRecord,
  SpecialtyRecord,
} from "@/types/database";

export function CatalogManagerClient({
  initialHospitals,
  initialSpecialties,
  initialLocations,
}: {
  initialHospitals: (HospitalRecord & { location?: LocationRecord })[];
  initialSpecialties: SpecialtyRecord[];
  initialLocations: LocationRecord[];
}) {
  const router = useRouter();
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [specialties, setSpecialties] = useState(initialSpecialties);
  const [locations, setLocations] = useState(initialLocations);
  const [saving, setSaving] = useState(false);

  // Hospital form
  const [hName, setHName] = useState("");
  const [hLocId, setHLocId] = useState(initialLocations[0]?.id || "");
  const [hAddress, setHAddress] = useState("");
  const [hPhone, setHPhone] = useState("+914828221000");
  const [hEmail, setHEmail] = useState("desk@clinic.in");

  // Specialty form
  const [sName, setSName] = useState("");
  const [sDesc, setSDesc] = useState("");

  // Location form (Ponkunnam, Kerala defaults)
  const [lCity, setLCity] = useState("Ponkunnam");
  const [lArea, setLArea] = useState("");
  const [lState, setLState] = useState("Kerala");
  const [lPin, setLPin] = useState("686506");

  const addHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "hospital",
          payload: {
            name: hName,
            location_id: hLocId,
            address: hAddress,
            phone: hPhone,
            email: hEmail,
            rating: 4.8,
            is_active: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add hospital");
      setHospitals((prev) => [
        {
          ...data.record,
          location: locations.find((l) => l.id === hLocId),
        },
        ...prev,
      ]);
      setHName("");
      setHAddress("");
      toast.success("Partner hospital added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "specialty",
          payload: {
            name: sName,
            icon_name: "Stethoscope",
            description: sDesc,
            is_active: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add specialty");
      setSpecialties((prev) => [...prev, data.record]);
      setSName("");
      setSDesc("");
      toast.success("Medical specialty added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const addLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "location",
          payload: {
            city: lCity,
            area: lArea,
            state: lState,
            pincode: lPin,
            latitude: 9.5662,
            longitude: 76.7628,
            is_active: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add location");
      setLocations((prev) => [...prev, data.record]);
      setLArea("");
      toast.success("Locality added in Ponkunnam, Kerala");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Hospitals, Specialties &amp; Ponkunnam Localities
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage partner hospitals/clinics, clinical specialties, and local
          areas in Ponkunnam, Kerala
        </p>
      </div>

      <Tabs defaultValue="hospitals">
        <TabsList>
          <TabsTrigger value="hospitals" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Hospitals ({hospitals.length})
          </TabsTrigger>
          <TabsTrigger value="specialties" className="gap-1.5">
            <Stethoscope className="h-4 w-4" />
            Specialties ({specialties.length})
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            Locations ({locations.length})
          </TabsTrigger>
        </TabsList>

        {/* HOSPITALS */}
        <TabsContent value="hospitals" className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-lg">Add Partner Hospital</CardTitle>
              <CardDescription>
                Available immediately when assigning doctors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addHospital} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Hospital / Clinic Name</Label>
                  <Input
                    placeholder="Fortis Healthcare Center"
                    value={hName}
                    onChange={(e) => setHName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City &amp; Area</Label>
                  <select
                    value={hLocId}
                    onChange={(e) => setHLocId(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.city} — {l.area}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Street Address</Label>
                  <Input
                    placeholder="Full clinic address"
                    value={hAddress}
                    onChange={(e) => setHAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Desk Phone</Label>
                    <Input
                      value={hPhone}
                      onChange={(e) => setHPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={hEmail}
                      onChange={(e) => setHEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Hospital
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardContent className="p-5 space-y-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {h.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h.address}
                    </div>
                  </div>
                  <Badge variant="success">★ {h.rating}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPECIALTIES */}
        <TabsContent value="specialties" className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-lg">Add Clinical Specialty</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addSpecialty} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Specialty Name</Label>
                  <Input
                    placeholder="e.g. Endocrinology"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    placeholder="Thyroid, diabetes & hormonal disorders"
                    value={sDesc}
                    onChange={(e) => setSDesc(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  <Plus className="h-4 w-4" />
                  Add Specialty
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardContent className="p-5 grid sm:grid-cols-2 gap-3">
              {specialties.map((s) => (
                <div key={s.id} className="rounded-xl border p-3.5 space-y-1">
                  <div className="font-heading font-bold text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.description}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCATIONS */}
        <TabsContent value="locations" className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-lg">Add Ponkunnam Locality</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addLocation} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Town / City</Label>
                  <Input
                    placeholder="Ponkunnam"
                    value={lCity}
                    onChange={(e) => setLCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Locality / Junction</Label>
                  <Input
                    placeholder="e.g. Kanjirappally Road / Attickal"
                    value={lArea}
                    onChange={(e) => setLArea(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input
                      value={lState}
                      onChange={(e) => setLState(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pincode</Label>
                    <Input
                      value={lPin}
                      onChange={(e) => setLPin(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7">
            <CardContent className="p-5 grid sm:grid-cols-2 gap-3">
              {locations.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {l.city} — {l.area}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.state} • {l.pincode}
                    </div>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

