"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  ExternalLink,
  Loader2,
  Percent,
  Save,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
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
import { calculateBookingFees } from "@/lib/payments/fee-calculator";
import { buildUpiPaymentUri } from "@/lib/payments/upi";
import type {
  FeeType,
  PaymentGatewayMode,
  PlatformSettingsRecord,
  UpiVerificationMode,
} from "@/types/database";
import { formatINR } from "@/lib/utils";

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: PlatformSettingsRecord;
}) {
  const router = useRouter();
  const [feeType, setFeeType] = useState<FeeType>(
    initialSettings.platform_fee_type
  );
  const [feeValue, setFeeValue] = useState(
    String(initialSettings.platform_fee_value)
  );
  const [paymentGatewayMode, setPaymentGatewayMode] =
    useState<PaymentGatewayMode>(
      initialSettings.payment_gateway_mode || "upi_direct"
    );
  const [upiId, setUpiId] = useState(
    initialSettings.upi_id || "pksaji020@oksbi"
  );
  const [upiPayeeName, setUpiPayeeName] = useState(
    initialSettings.upi_payee_name || "My Dr Healthcare"
  );
  const [upiVerificationMode, setUpiVerificationMode] =
    useState<UpiVerificationMode>(
      initialSettings.upi_verification_mode || "admin_approval"
    );
  const [freeCancelHours, setFreeCancelHours] = useState(
    String(initialSettings.free_cancellation_hours)
  );
  const [refundPercent, setRefundPercent] = useState(
    String(initialSettings.cancellation_refund_percent)
  );
  const [smsProvider, setSmsProvider] = useState(initialSettings.sms_provider);
  const [smsApiKey, setSmsApiKey] = useState(
    initialSettings.sms_api_key || ""
  );
  const [smsTemplateId, setSmsTemplateId] = useState(
    initialSettings.sms_template_id || ""
  );
  const [twilioSid, setTwilioSid] = useState(
    initialSettings.twilio_account_sid || ""
  );
  const [twilioToken, setTwilioToken] = useState(
    initialSettings.twilio_auth_token || ""
  );
  const [twilioFrom, setTwilioFrom] = useState(
    initialSettings.twilio_from_number || ""
  );
  const [supportPhone, setSupportPhone] = useState(
    initialSettings.support_phone
  );
  const [supportEmail, setSupportEmail] = useState(
    initialSettings.support_email
  );
  const [sampleConsultFee, setSampleConsultFee] = useState("1000");
  const [saving, setSaving] = useState(false);

  const preview = calculateBookingFees(
    {
      consultation_fee: Number(sampleConsultFee) || 0,
      platform_fee_override_type: null,
      platform_fee_override_value: null,
    },
    {
      platform_fee_type: feeType,
      platform_fee_value: Number(feeValue) || 0,
    }
  );

  const testUpiHref = buildUpiPaymentUri({
    upiId: upiId || "pksaji020@oksbi",
    payeeName: upiPayeeName || "My Dr Healthcare",
    amountInr: preview.onlinePayable,
    bookingCode: "TEST-PREVIEW",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_fee_type: feeType,
          platform_fee_value: Number(feeValue),
          payment_gateway_mode: paymentGatewayMode,
          upi_id: upiId.trim(),
          upi_payee_name: upiPayeeName.trim(),
          upi_verification_mode: upiVerificationMode,
          free_cancellation_hours: Number(freeCancelHours),
          cancellation_refund_percent: Number(refundPercent),
          sms_provider: smsProvider,
          sms_api_key: smsApiKey.trim(),
          sms_template_id: smsTemplateId.trim(),
          twilio_account_sid: twilioSid.trim(),
          twilio_auth_token: twilioToken.trim(),
          twilio_from_number: twilioFrom.trim(),
          support_phone: supportPhone,
          support_email: supportEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      toast.success(
        "Platform fee, UPI ID & policies saved! Past bookings remain untouched."
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          UPI Collection, Platform Fee &amp; Policies
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your receiving UPI ID, platform booking fee, verification
          workflow, and SMS OTP gateway
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="grid gap-8 lg:grid-cols-12 items-start"
      >
        <div className="lg:col-span-7 space-y-6">
          {/* Direct UPI Payment Configuration */}
          <Card className="border-primary/25">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Online Payment Collection &amp; Receiving UPI ID
              </CardTitle>
              <CardDescription>
                Patients click the payment link at checkout to open their UPI
                app directly (no QR code) with your exact platform fee pre-filled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentGatewayMode("upi_direct")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentGatewayMode === "upi_direct"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-heading font-bold text-sm">
                    Direct UPI Link (0% Fee)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Click-to-pay UPI app deep link + 12-digit UTR check
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentGatewayMode("razorpay")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentGatewayMode === "razorpay"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-heading font-bold text-sm">
                    Razorpay Merchant Gateway
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Requires Razorpay live/test API keys
                  </div>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-upi-id">Receiving UPI ID (VPA) *</Label>
                  <Input
                    id="admin-upi-id"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="pksaji020@oksbi"
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-upi-name">Payee Display Name *</Label>
                  <Input
                    id="admin-upi-name"
                    value={upiPayeeName}
                    onChange={(e) => setUpiPayeeName(e.target.value)}
                    placeholder="My Dr Healthcare"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Booking Confirmation Policy (After Patient Submits UTR)</Label>
                <select
                  value={upiVerificationMode}
                  onChange={(e) =>
                    setUpiVerificationMode(e.target.value as UpiVerificationMode)
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="admin_approval">
                    Hold Slot as &apos;Payment Verification Pending&apos; until
                    Admin Clicks Approve in /admin/payments
                  </option>
                  <option value="instant_utr">
                    Instant Confirm upon 12-Digit UTR Submission (Audit in
                    /admin/payments)
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Global Platform Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Global Platform Convenience Fee
              </CardTitle>
              <CardDescription>
                Applies to all doctors unless a per-doctor override is set under
                Doctors Management. Every booking snapshots its exact fee at
                payment time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFeeType("percentage")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    feeType === "percentage"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-heading font-bold text-sm">
                    Percentage Fee (%)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    e.g. 10% of doctor&apos;s consultation fee
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFeeType("flat")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    feeType === "flat"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-heading font-bold text-sm">
                    Flat Fixed Amount (₹)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    e.g. ₹49 fixed convenience fee per booking
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <Label>
                  {feeType === "percentage"
                    ? "Platform Fee Percentage (%)"
                    : "Flat Platform Fee Amount (INR ₹)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Refund Policy & SMS Gateway */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Cancellation Policy &amp; OTP SMS Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>100% Free Cancellation Window (Hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={freeCancelHours}
                    onChange={(e) => setFreeCancelHours(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Late Cancellation Refund (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={refundPercent}
                    onChange={(e) => setRefundPercent(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border p-4 bg-muted/25">
                <Label className="flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Mobile OTP SMS Gateway (Live Cellular Delivery)
                </Label>
                <select
                  value={smsProvider}
                  onChange={(e) =>
                    setSmsProvider(
                      e.target.value as PlatformSettingsRecord["sms_provider"]
                    )
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="fast2sms">
                    Fast2SMS India Instant OTP (1 API Key — Recommended)
                  </option>
                  <option value="twofactor">
                    2Factor.in India Instant OTP (1 API Key)
                  </option>
                  <option value="msg91">MSG91 India OTP Flow API</option>
                  <option value="twilio">Twilio Programmable SMS</option>
                  <option value="supabase_native">
                    Supabase Native Phone Auth
                  </option>
                  <option value="dev_console">
                    Local SMS Notification Sandbox (Until Live Key Added)
                  </option>
                </select>

                {(smsProvider === "fast2sms" ||
                  smsProvider === "twofactor" ||
                  smsProvider === "msg91") && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="sms-api-key" className="text-xs">
                        {smsProvider === "fast2sms"
                          ? "Fast2SMS Authorization API Key"
                          : smsProvider === "twofactor"
                          ? "2Factor.in API Key"
                          : "MSG91 Auth Key"}
                      </Label>
                      <Input
                        id="sms-api-key"
                        type="password"
                        placeholder="Paste your live SMS gateway API key"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                      />
                    </div>
                    {smsProvider === "msg91" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="sms-tpl-id" className="text-xs">
                          MSG91 DLT Template ID
                        </Label>
                        <Input
                          id="sms-tpl-id"
                          placeholder="Enter MSG91 OTP Template ID"
                          value={smsTemplateId}
                          onChange={(e) => setSmsTemplateId(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {smsProvider === "twilio" && (
                  <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Account SID</Label>
                      <Input
                        placeholder="AC..."
                        value={twilioSid}
                        onChange={(e) => setTwilioSid(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Auth Token</Label>
                      <Input
                        type="password"
                        placeholder="Auth Token"
                        value={twilioToken}
                        onChange={(e) => setTwilioToken(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">From Phone</Label>
                      <Input
                        placeholder="+1..."
                        value={twilioFrom}
                        onChange={(e) => setTwilioFrom(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Support Helpline</Label>
                  <Input
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Global Platform Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Fee & UPI Link Calculator */}
        <Card className="lg:col-span-5 border-primary/30 shadow-lg">
          <CardHeader className="border-b bg-primary/[0.04]">
            <Badge variant="default" className="w-fit mb-1">
              Live Checkout Preview
            </Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Patient Fee &amp; UPI Link Calculator
            </CardTitle>
            <CardDescription>
              Preview your exact patient fee split and test your click-to-pay
              UPI link
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label>Sample Doctor Consultation Fee (₹)</Label>
              <Input
                type="number"
                min={0}
                value={sampleConsultFee}
                onChange={(e) => setSampleConsultFee(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border bg-muted/35 p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Consultation Fee (Pay at Clinic)
                </span>
                <span className="font-medium tabular-nums">
                  {formatINR(preview.clinicPayable, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {preview.feeLabel} (Pay Online via UPI)
                </span>
                <span className="font-semibold text-primary tabular-nums">
                  {formatINR(preview.onlinePayable, true)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-heading font-bold text-base">
                <span>Patient Pays Online Now</span>
                <span className="text-primary tabular-nums">
                  {formatINR(preview.onlinePayable, true)}
                </span>
              </div>
              <div className="border-t pt-2.5 flex justify-between text-xs text-muted-foreground">
                <span>Patient Pays at Clinic (Doctor Share):</span>
                <span className="font-semibold text-emerald-600 tabular-nums">
                  {formatINR(preview.clinicPayable, true)}
                </span>
              </div>
            </div>

            {paymentGatewayMode === "upi_direct" && (
              <div className="space-y-2.5 rounded-2xl border p-4 bg-primary/[0.03]">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Receiving UPI ID:</span>
                  <code className="font-mono font-bold text-foreground">
                    {upiId || "pksaji020@oksbi"}
                  </code>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={testUpiHref}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Test UPI Payment Link (
                    {formatINR(preview.onlinePayable, true)})
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
