"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Edit3,
  KeyRound,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  DoctorWithDetails,
  HospitalRecord,
  LocationRecord,
  PlatformSettingsRecord,
  SpecialtyRecord,
} from "@/types/database";
import { formatDisplayPhone, formatINR } from "@/lib/utils";

export function DoctorsManagerClient({
  initialDoctors,
  hospitals,
  specialties,
  locations,
  settings,
}: {
  initialDoctors: DoctorWithDetails[];
  hospitals: HospitalRecord[];
  specialties: SpecialtyRecord[];
  locations: LocationRecord[];
  settings: PlatformSettingsRecord;
}) {
  const router = useRouter();
  const [doctors, setDoctors] = useState(initialDoctors);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generated credentials modal
  const [issuedCreds, setIssuedCreds] = useState<{
    name: string;
    phone: string;
    tempPassword: string;
  } | null>(null);

  // Form fields
  const [editId, setEditId] = useState<string | undefined>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id || "");
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || "");
  const [locationId, setLocationId] = useState(locations[0]?.id || "");
  const [regNo, setRegNo] = useState("");
  const [qualifications, setQualifications] = useState("MBBS, MD");
  const [experienceYears, setExperienceYears] = useState("10");
  const [languages, setLanguages] = useState("Malayalam, English");
  const [bio, setBio] = useState("");
  const [consultationFee, setConsultationFee] = useState("800");
  const [slotDurationMins, setSlotDurationMins] = useState("20");
  const [overrideMode, setOverrideMode] = useState<
    "global" | "percentage" | "flat"
  >("global");
  const [overrideValue, setOverrideValue] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    if (hospitals.length === 0) {
      toast.error(
        "Please add at least one Hospital / Clinic in Ponkunnam first."
      );
      router.push("/admin/hospitals");
      return;
    }
    setEditId(undefined);
    setFullName("");
    setPhone("");
    setEmail("");
    setPhotoUrl("");
    setSpecialtyId(specialties[0]?.id || "");
    setHospitalId(hospitals[0]?.id || "");
    setLocationId(locations[0]?.id || "");
    setRegNo(`TCMC-KL-${Math.floor(10000 + Math.random() * 89999)}`);
    setQualifications("MBBS, MD");
    setExperienceYears("10");
    setLanguages("Malayalam, English");
    setBio(
      "Experienced clinical specialist dedicated to evidence-based patient care."
    );
    setConsultationFee("800");
    setSlotDurationMins("20");
    setOverrideMode("global");
    setOverrideValue("");
    setIsFeatured(true);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (doc: DoctorWithDetails) => {
    setEditId(doc.id);
    setFullName(doc.full_name);
    setPhone(doc.phone.replace(/^\+91/, ""));
    setEmail(doc.email || "");
    setPhotoUrl(doc.photo_url);
    setSpecialtyId(doc.specialty_id);
    setHospitalId(doc.hospital_id);
    setLocationId(doc.location_id);
    setRegNo(doc.registration_number);
    setQualifications(doc.qualifications.join(", "));
    setExperienceYears(String(doc.experience_years));
    setLanguages(doc.languages.join(", "));
    setBio(doc.bio);
    setConsultationFee(String(doc.consultation_fee));
    setSlotDurationMins(String(doc.slot_duration_mins));
    if (doc.platform_fee_override_type) {
      setOverrideMode(doc.platform_fee_override_type);
      setOverrideValue(String(doc.platform_fee_override_value ?? ""));
    } else {
      setOverrideMode("global");
      setOverrideValue("");
    }
    setIsFeatured(doc.is_featured);
    setIsActive(doc.is_active);
    setModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          full_name: fullName,
          phone,
          email,
          photo_url: photoUrl,
          specialty_id: specialtyId,
          hospital_id: hospitalId,
          location_id: locationId,
          registration_number: regNo,
          qualifications: qualifications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          experience_years: Number(experienceYears),
          languages: languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bio,
          consultation_fee: Number(consultationFee),
          slot_duration_mins: Number(slotDurationMins),
          platform_fee_override_type:
            overrideMode === "global" ? null : overrideMode,
          platform_fee_override_value:
            overrideMode === "global" ? null : Number(overrideValue || 0),
          is_featured: isFeatured,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save doctor");

      if (editId) {
        setDoctors((prev) =>
          prev.map((d) => (d.id === editId ? data.doctor : d))
        );
        toast.success("Doctor profile updated");
      } else {
        setDoctors((prev) => [data.doctor, ...prev]);
        toast.success("New doctor onboarded with login credentials!");
      }
      setModalOpen(false);

      if (data.credentials) {
        setIssuedCreds({
          name: data.doctor.full_name,
          phone: data.credentials.phone,
          tempPassword: data.credentials.tempPassword,
        });
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetCredentials = async (doc: DoctorWithDetails) => {
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_credentials",
          doctorId: doc.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setIssuedCreds({
        name: doc.full_name,
        phone: data.credentials.phone,
        tempPassword: data.credentials.tempPassword,
      });
      toast.success("Generated fresh temporary password for doctor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset");
    }
  };

  const filtered = doctors.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${d.full_name} ${d.specialty.name} ${d.hospital.name} ${d.location.city} ${d.phone}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Manage Doctors &amp; Portal Credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Onboard specialists, configure per-doctor platform fee overrides,
            and issue first-login credentials
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add New Doctor
        </Button>
      </div>

      {hospitals.length === 0 && (
        <Card className="border-amber-500/45 bg-amber-500/10">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold text-sm text-amber-950 dark:text-amber-200">
                Step 1 Required: Add Your First Hospital / Clinic
              </p>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                Before onboarding a doctor, add at least one Hospital or Clinic
                in Hospitals &amp; Cities so you can assign the doctor&apos;s
                practice location.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/admin/hospitals">+ Add Hospital / Clinic First</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search doctors by name, specialty, city, or phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Hospital &amp; City</th>
                <th className="px-4 py-3">Consult Fee</th>
                <th className="px-4 py-3">Platform Fee Rule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-muted/25">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.photo_url}
                        alt={doc.full_name}
                        className="h-11 w-11 rounded-xl object-cover border"
                      />
                      <div>
                        <div className="font-heading font-bold">
                          {doc.full_name}
                        </div>
                        <div className="text-xs text-primary font-medium">
                          {doc.specialty.name} • {doc.experience_years}y exp
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {formatDisplayPhone(doc.phone)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{doc.hospital.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.location.area}, {doc.location.city}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-heading font-bold tabular-nums">
                    {formatINR(doc.consultation_fee)}
                  </td>
                  <td className="px-4 py-3.5">
                    {doc.platform_fee_override_type ? (
                      <Badge variant="warning">
                        Override:{" "}
                        {doc.platform_fee_override_type === "percentage"
                          ? `${doc.platform_fee_override_value}%`
                          : `${formatINR(
                              doc.platform_fee_override_value || 0
                            )} Flat`}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Global (
                        {settings.platform_fee_type === "percentage"
                          ? `${settings.platform_fee_value}%`
                          : `${formatINR(settings.platform_fee_value)} Flat`}
                        )
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={doc.is_active ? "success" : "destructive"}>
                      {doc.is_active ? "Active" : "Deactivated"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(doc)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Regenerate temporary login password"
                        onClick={() => handleResetCredentials(doc)}
                      >
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upsert Doctor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Doctor Profile" : "Onboard New Doctor"}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? "Update clinical details, status, or per-doctor platform fee override."
                : "Creates a verified doctor profile and auto-generates first-login portal credentials."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDoctor} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Doctor Full Name</Label>
                <Input
                  placeholder="Dr. Aditi Rao"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Doctor Mobile (Login ID)</Label>
                <Input
                  placeholder="9820011223"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <select
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Hospital / Clinic</Label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>City &amp; Area</Label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
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
                <Label>Medical Registration No.</Label>
                <Input
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Qualifications (comma separated)</Label>
                <Input
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Experience (Years)</Label>
                <Input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Consultation Fee (INR ₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Languages (comma separated)</Label>
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Photo URL (Optional)</Label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Per-Doctor Platform Fee Override */}
            <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">
                Platform Fee Rule for This Doctor
              </Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={overrideMode}
                  onChange={(e) =>
                    setOverrideMode(
                      e.target.value as "global" | "percentage" | "flat"
                    )
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="global">
                    Use Global Platform Fee (Default)
                  </option>
                  <option value="percentage">
                    Custom Percentage (%) Override
                  </option>
                  <option value="flat">Custom Flat (₹) Override</option>
                </select>
                {overrideMode !== "global" && (
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder={
                      overrideMode === "percentage"
                        ? "e.g. 5 for 5%"
                        : "e.g. 49 for ₹49"
                    }
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    required
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Clinical Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                Active (Bookable by Patients)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                Featured on Landing Page
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? "Save Changes" : "Create Doctor & Generate Login"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auto-Generated Credentials Modal */}
      <Dialog
        open={Boolean(issuedCreds)}
        onOpenChange={(o) => !o && setIssuedCreds(null)}
      >
        <DialogContent className="max-w-md">
          {issuedCreds && (
            <>
              <DialogHeader>
                <Badge variant="success" className="w-fit gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Doctor Portal Credentials Ready
                </Badge>
                <DialogTitle className="pt-1">
                  Share Login Details with {issuedCreds.name}
                </DialogTitle>
                <DialogDescription>
                  The doctor will be required to change this temporary password
                  upon their first login at <code>/login?tab=doctor</code>.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border bg-muted/50 p-4 space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile Login:</span>
                  <span className="font-bold">{issuedCreds.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temp Password:</span>
                  <span className="font-bold text-primary">
                    {issuedCreds.tempPassword}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `My Dr Portal Login\nPhone: ${issuedCreds.phone}\nTemp Password: ${issuedCreds.tempPassword}`
                    );
                    toast.success("Credentials copied to clipboard!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy Credentials
                </Button>
                <Button onClick={() => setIssuedCreds(null)}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

