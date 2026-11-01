import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an amount in Indian Rupees (INR) with clean formatting.
 */
export function formatINR(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Normalizes Indian mobile numbers to E.164 (+91XXXXXXXXXX).
 */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (raw.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
}

/**
 * Strips non-digits and cleanly extracts the 10-digit mobile number,
 * correctly handling pasted numbers with +91, 91, or leading 0 without truncating.
 */
export function cleanIndianPhoneInput(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

/**
 * Formats +919876543210 into +91 98765 43210 for display.
 */
export function formatDisplayPhone(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  const match = normalized.match(/^\+91(\d{5})(\d{5})$/);
  if (match) {
    return `+91 ${match[1]} ${match[2]}`;
  }
  return phone;
}

/**
 * Converts 24h "HH:mm" into "10:30 AM" / "05:20 PM".
 */
export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * Adds minutes to "HH:mm" and returns "HH:mm".
 */
export function addMinutesToTime(time24: string, mins: number): string {
  const [hStr, mStr] = time24.split(":");
  const total = parseInt(hStr || "0", 10) * 60 + parseInt(mStr || "0", 10) + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/**
 * Generates human-friendly booking reference code e.g. MYDR-2026-4829
 */
export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MYDR-${year}-${rand}`;
}

/**
 * Haversine distance in kilometers between two lat/lng coordinates.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Formats YYYY-MM-DD cleanly e.g. "Sun, 1 Nov 2026"
 */
export function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns local YYYY-MM-DD offset by `daysOffset` from today.
 */
export function getLocalISODate(daysOffset = 0): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysOffset);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Extracts up to 2 uppercase initials from a full name.
 */
export function getInitials(name: string): string {
  const parts = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "MD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

