"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Power,
  Search,
  Trash2,
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
import { ImageUpload } from "@/components/ui/image-upload";
import type {
  DoctorWithDetails,
  HospitalRecord,
  LocationRecord,
  PlatformSettingsRecord,
  SpecialtyRecord,
} from "@/types/database";
import { formatDisplayPhone, formatINR } from "@/lib/utils";

const DELETED_DOCTORS_KEY = "mydr_deleted_doctors";

function readDeletedDoctors(): string[] {
  try {
    const raw = window.localStorage.getItem(DELETED_DOCTORS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberDeletedDoctor(id: string) {
  try {
    const ids = new Set(readDeletedDoctors());
    ids.add(id);
    window.localStorage.setItem(
      DELETED_DOCTORS_KEY,
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // ignore storage errors
  }
}

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

  // Serverless instances don't share memory: replay earlier deletions so a
  // deleted doctor never reappears in the admin list or on the public site.
  useEffect(() => {
    const ids = readDeletedDoctors();
    if (ids.length === 0) return;
    setDoctors((prev) => prev.filter((d) => !ids.includes(d.id)));
    fetch("/api/admin/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync_deleted", ids }),
    }).catch(() => {});
  }, []);
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
  const [hospitalId, setHospitalId] = useState(hospitals[0]?.id || "__new__");
  const [newHospitalName, setNewHospitalName] = useState("");
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
    setEditId(undefined);
    setFullName("");
    setPhone("");
    setEmail("");
    setPhotoUrl("");
    setSpecialtyId(specialties[0]?.id || "");
    setHospitalId(hospitals[0]?.id || "__new__");
    setNewHospitalName("");
    setLocationId(locations[0]?.id || "");
    setRegNo(`TCMC-KL-${Math.floor(10000 + Math.random() * 89999)}`);
    setQualifications("MBBS, MD");
    setExperienceYears("10");
    setLanguages("Malayalam, English");
    setBio(
      "Experienced clinical specialist in Ponkunnam dedicated to evidence-based patient care."
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
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit mobile number");
      }
      if (hospitalId === "__new__" && !newHospitalName.trim()) {
        throw new Error("Please enter the Clinic / Hospital Name");
      }

      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          full_name: fullName,
          phone: cleanPhone,
          email,
          photo_url: photoUrl,
          specialty_id: specialtyId,
          hospital_id: hospitalId === "__new__" ? undefined : hospitalId,
          new_hospital_name:
            hospitalId === "__new__" ? newHospitalName.trim() : undefined,
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
          bio:
            bio.trim() ||
            "Experienced clinical specialist in Ponkunnam dedicated to evidence-based patient care.",
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

  const [doctorToDelete, setDoctorToDelete] = useState<DoctorWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleStatus = async (doc: DoctorWithDetails) => {
    setTogglingId(doc.id);
    const newStatus = !doc.is_active;
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          doctorId: doc.id,
          is_active: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      setDoctors((prev) =>
        prev.map((d) => (d.id === doc.id ? data.doctor : d))
      );
      toast.success(
        newStatus
          ? `${doc.full_name} is now ACTIVE and visible on booking portal`
          : `${doc.full_name} is DEACTIVATED and hidden from patients`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete doctor");

      rememberDeletedDoctor(doctorToDelete.id);
      setDoctors((prev) => prev.filter((d) => d.id !== doctorToDelete.id));
      toast.success(`${doctorToDelete.full_name} was permanently removed`);
      setDoctorToDelete(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeleting(false);
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

      {/* Mobile Doctors List (Cards) */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No doctors found matching your search.
            </CardContent>
          </Card>
        ) : (
          filtered.map((doc) => (
            <Card key={`mob-${doc.id}`} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={doc.photo_url}
                    alt={doc.full_name}
                    className="h-14 w-14 rounded-xl object-cover border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading font-bold text-base truncate">
                        {doc.full_name}
                      </h3>
                      <Badge variant={doc.is_active ? "success" : "destructive"} className="shrink-0 text-[11px]">
                        {doc.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      {doc.specialty.name} • {doc.experience_years}y exp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.hospital.name} ({doc.location.city})
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {formatDisplayPhone(doc.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Consultation Fee</span>
                    <span className="font-heading font-bold text-sm tabular-nums">{formatINR(doc.consultation_fee)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Platform Fee</span>
                    <span className="font-semibold text-primary">
                      {doc.platform_fee_override_type
                        ? `${doc.platform_fee_override_type === "percentage" ? `${doc.platform_fee_override_value}%` : formatINR(doc.platform_fee_override_value || 0)}`
                        : `Global (${settings.platform_fee_type === "percentage" ? `${settings.platform_fee_value}%` : formatINR(settings.platform_fee_value)})`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                  <Button
                    size="sm"
                    variant={doc.is_active ? "ghost" : "outline"}
                    className={
                      doc.is_active
                        ? "text-amber-600 hover:bg-amber-500/10 text-xs"
                        : "text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10 text-xs"
                    }
                    disabled={togglingId === doc.id}
                    onClick={() => handleToggleStatus(doc)}
                  >
                    {togglingId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : doc.is_active ? (
                      <EyeOff className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 mr-1" />
                    )}
                    {doc.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => openEditModal(doc)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => handleResetCredentials(doc)}
                  >
                    <KeyRound className="h-3.5 w-3.5 mr-1 text-primary" />
                    Reset Pass
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive font-medium"
                    onClick={() => setDoctorToDelete(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete Doctor
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Doctors Table */}
      <Card className="hidden md:block overflow-hidden">
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
                      {/* 1-Click Activate / Deactivate Toggle Button */}
                      <Button
                        size="sm"
                        variant={doc.is_active ? "ghost" : "outline"}
                        className={
                          doc.is_active
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            : "text-emerald-600 border-emerald-500/40 hover:bg-emerald-500/10"
                        }
                        title={
                          doc.is_active
                            ? "Deactivate doctor (hide from patients)"
                            : "Activate doctor (show on booking portal)"
                        }
                        disabled={togglingId === doc.id}
                        onClick={() => handleToggleStatus(doc)}
                      >
                        {togglingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : doc.is_active ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {doc.is_active ? "Deactivate" : "Activate"}
                        </span>
                      </Button>

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

                      {/* Delete Doctor from Site button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1 font-medium"
                        title="Delete Doctor permanently from site"
                        onClick={() => setDoctorToDelete(doc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
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
                  <option value="__new__">+ Enter New Clinic / Practice Name</option>
                </select>
                {hospitalId === "__new__" && (
                  <Input
                    placeholder="e.g. Dr. Saji Family Clinic, Ponkunnam"
                    value={newHospitalName}
                    onChange={(e) => setNewHospitalName(e.target.value)}
                    required
                    className="mt-2"
                  />
                )}
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
                <ImageUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  label="Doctor Profile Picture / Portrait Photo"
                  description="Upload a photo from your device or select a preset avatar. Automatically compressed for fast loading."
                  fallbackInitials={fullName ? fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() : "DR"}
                  category="doctor"
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

            <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t">
              {editId ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => {
                    const target = doctors.find((d) => d.id === editId);
                    if (target) {
                      setModalOpen(false);
                      setDoctorToDelete(target);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Doctor from Site
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center justify-end gap-2">
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
              </div>
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
      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(doctorToDelete)}
        onOpenChange={(o) => !o && setDoctorToDelete(null)}
      >
        <DialogContent className="max-w-md">
          {doctorToDelete && (
            <>
              <DialogHeader>
                <Badge variant="destructive" className="w-fit">
                  Permanent Removal from Site
                </Badge>
                <DialogTitle className="pt-1 text-xl">
                  Delete {doctorToDelete.full_name}?
                </DialogTitle>
                <DialogDescription className="leading-relaxed">
                  Are you sure you want to permanently delete <strong>{doctorToDelete.full_name}</strong> from <code>abhijithsaji.in</code>?
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs space-y-2">
                <p className="font-bold text-destructive flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  What happens when deleted:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Doctor profile will be removed from the public website directory.</li>
                  <li>All recurring schedules and slot availability will be cleared.</li>
                  <li>Patients will no longer be able to book this doctor.</li>
                </ul>
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-destructive/20">
                  Tip: If you only want to take the doctor temporarily offline, you can use <strong>Deactivate</strong> instead.
                </p>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDoctorToDelete(null)}
                  disabled={deleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDoctor}
                  disabled={deleting}
                  className="w-full sm:w-auto font-semibold gap-1.5"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Confirm Delete from Site
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

