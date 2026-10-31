/**
 * NPCI-compliant UPI Intent & App Deep-Link Builder for "My Dr"
 * Default Receiving VPA: pksaji020@oksbi (Direct Link — No QR)
 */

export interface UpiPaymentLinkParams {
  upiId: string;
  payeeName: string;
  amountInr: number;
  bookingCode: string;
}

export interface UpiAppOption {
  id: "any_upi" | "gpay" | "phonepe" | "paytm" | "bhim";
  label: string;
  subtitle: string;
  href: string;
}

function buildQuery(params: UpiPaymentLinkParams): string {
  const pa = params.upiId.trim();
  const pn = params.payeeName.trim() || "My Dr Healthcare";
  const am = Math.max(0, Number(params.amountInr)).toFixed(2);
  const tn = `MyDr Booking ${params.bookingCode}`;

  return [
    `pa=${encodeURIComponent(pa)}`,
    `pn=${encodeURIComponent(pn)}`,
    `am=${encodeURIComponent(am)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(tn)}`,
  ].join("&");
}

/**
 * Standard NPCI `upi://pay?...` intent link that opens the device's UPI app chooser
 * with Payee VPA, Name, Exact INR Amount, and Booking Reference pre-filled.
 */
export function buildUpiPaymentUri(params: UpiPaymentLinkParams): string {
  return `upi://pay?${buildQuery(params)}`;
}

/**
 * Clickable UPI Payment Option deep-links (Google Pay, PhonePe, Paytm, BHIM, and Universal UPI).
 */
export function buildUpiPaymentOptions(
  params: UpiPaymentLinkParams
): UpiAppOption[] {
  const query = buildQuery(params);

  return [
    {
      id: "any_upi",
      label: "Open UPI Payment App",
      subtitle: "System chooser (GPay, PhonePe, Paytm, SBI YONO, CRED)",
      href: `upi://pay?${query}`,
    },
    {
      id: "gpay",
      label: "Google Pay (GPay)",
      subtitle: "Pay directly in Google Pay",
      href: `tez://upi/pay?${query}`,
    },
    {
      id: "phonepe",
      label: "PhonePe",
      subtitle: "Pay directly in PhonePe",
      href: `phonepe://pay?${query}`,
    },
    {
      id: "paytm",
      label: "Paytm UPI",
      subtitle: "Pay directly in Paytm",
      href: `paytmmp://pay?${query}`,
    },
    {
      id: "bhim",
      label: "BHIM / Bank UPI",
      subtitle: "Pay via BHIM or Bank UPI app",
      href: `bhim://pay?${query}`,
    },
  ];
}
