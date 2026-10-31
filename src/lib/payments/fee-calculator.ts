import type {
  DoctorRecord,
  FeeType,
  PlatformSettingsRecord,
} from "@/types/database";

export interface FeeBreakdown {
  consultationFee: number;
  clinicPayable: number;
  appliedFeeType: FeeType;
  appliedFeeRate: number;
  isDoctorOverride: boolean;
  platformFee: number;
  onlinePayable: number;
  totalAmount: number;
  netDoctorEarning: number;
  feeLabel: string;
}

/**
 * Calculates the exact fee breakdown for a doctor consultation.
 * Business model: Patient pays ONLY the Platform Fee online to lock & confirm
 * the slot, and pays the Consultation Fee directly at the clinic/hospital.
 * Per-doctor override takes precedence over global platform settings.
 * All numbers are rounded to 2 decimal places (paise precision).
 */
export function calculateBookingFees(
  doctor: Pick<
    DoctorRecord,
    | "consultation_fee"
    | "platform_fee_override_type"
    | "platform_fee_override_value"
  >,
  settings: Pick<
    PlatformSettingsRecord,
    "platform_fee_type" | "platform_fee_value"
  >
): FeeBreakdown {
  const consultationFee = roundPaise(doctor.consultation_fee);
  const hasOverride =
    doctor.platform_fee_override_type !== null &&
    doctor.platform_fee_override_value !== null &&
    doctor.platform_fee_override_value !== undefined;

  const appliedFeeType: FeeType = hasOverride
    ? doctor.platform_fee_override_type!
    : settings.platform_fee_type;

  const appliedFeeRate = hasOverride
    ? doctor.platform_fee_override_value!
    : settings.platform_fee_value;

  const platformFee =
    appliedFeeType === "percentage"
      ? roundPaise((consultationFee * appliedFeeRate) / 100)
      : roundPaise(appliedFeeRate);

  const onlinePayable = platformFee;
  const clinicPayable = consultationFee;
  const totalAmount = roundPaise(consultationFee + platformFee);

  const feeLabel =
    appliedFeeType === "percentage"
      ? `Platform Booking Fee (${appliedFeeRate}%)`
      : `Platform Booking Fee (Flat)`;

  return {
    consultationFee,
    clinicPayable,
    appliedFeeType,
    appliedFeeRate,
    isDoctorOverride: hasOverride,
    platformFee,
    onlinePayable,
    totalAmount,
    netDoctorEarning: consultationFee,
    feeLabel,
  };
}

/**
 * Calculates refund eligibility & amount when an appointment is cancelled.
 */
export function calculateCancellationRefund(params: {
  appointmentDate: string; // YYYY-MM-DD
  slotTime: string; // HH:mm
  totalPaid: number;
  cancelledByRole: "patient" | "doctor" | "admin";
  freeCancellationHours: number;
  cancellationRefundPercent: number;
}): { refundAmount: number; reasonNote: string } {
  const {
    appointmentDate,
    slotTime,
    totalPaid,
    cancelledByRole,
    freeCancellationHours,
    cancellationRefundPercent,
  } = params;

  // Doctor or Admin cancellations always give 100% full refund to patient
  if (cancelledByRole === "doctor" || cancelledByRole === "admin") {
    return {
      refundAmount: roundPaise(totalPaid),
      reasonNote: `100% full refund (${cancelledByRole} cancellation)`,
    };
  }

  const [y, m, d] = appointmentDate.split("-").map(Number);
  const [hh, mm] = slotTime.split(":").map(Number);
  const apptDate = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  const hoursUntilSlot = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilSlot >= freeCancellationHours) {
    return {
      refundAmount: roundPaise(totalPaid),
      reasonNote: `100% refund (cancelled >${freeCancellationHours}h before slot)`,
    };
  }

  const refundAmount = roundPaise(
    (totalPaid * cancellationRefundPercent) / 100
  );
  return {
    refundAmount,
    reasonNote: `${cancellationRefundPercent}% policy refund (cancelled within ${freeCancellationHours}h window)`,
  };
}

export function roundPaise(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

