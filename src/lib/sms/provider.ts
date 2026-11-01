import { getPlatformSettings } from "@/lib/db/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SendOtpResult {
  delivered: boolean;
  liveSmsSent: boolean;
  provider: string;
  maskedPhone: string;
  /**
   * Only populated when no external cellular SMS gateway key is configured yet,
   * allowing the mobile OS push-notification banner to deliver the real random OTP
   * without ever auto-filling the OTP input box.
   */
  fallbackSmsCode?: string;
}

function maskIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 2)}•••• ••${digits.slice(-2)}`;
  }
  return phone;
}

/**
 * Production SMS / Mobile OTP Dispatcher.
 * Supports live cellular SMS via:
 *  - "fast2sms" (Fast2SMS India Instant OTP API — 1 API key)
 *  - "twofactor" (2Factor.in India Instant OTP API — 1 API key)
 *  - "msg91" (MSG91 India Flow OTP API)
 *  - "twilio" (Twilio Programmable SMS)
 *  - "supabase_native" (Supabase Phone Auth)
 * Falls back cleanly to a non-autofilled mobile SMS notification when no live API key is set yet.
 */
export async function dispatchMobileOtp(params: {
  phone: string; // Normalized +91XXXXXXXXXX
  otp: string;
}): Promise<SendOtpResult> {
  const settings = getPlatformSettings();
  const provider =
    process.env.SMS_PROVIDER || settings.sms_provider || "dev_console";
  const tenDigit = params.phone.replace(/\D/g, "").slice(-10);
  const maskedPhone = maskIndianPhone(params.phone);

  // 1. Fast2SMS (India Instant OTP Route)
  const fast2smsKey =
    process.env.FAST2SMS_API_KEY ||
    (provider === "fast2sms" || settings.sms_provider === "fast2sms"
      ? settings.sms_api_key
      : undefined);

  if (fast2smsKey) {
    const url = new URL("https://www.fast2sms.com/dev/bulkV2");
    url.searchParams.set("variables_values", params.otp);
    url.searchParams.set("route", "otp");
    url.searchParams.set("numbers", tenDigit);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authorization: fast2smsKey,
        accept: "application/json",
      },
    });
    const data = (await res.json().catch(() => ({}))) as {
      return?: boolean;
      message?: string | string[];
    };
    if (!res.ok || data.return === false) {
      const msg = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Fast2SMS rejected OTP request";
      throw new Error(`SMS Gateway Error: ${msg}`);
    }
    return {
      delivered: true,
      liveSmsSent: true,
      provider: "fast2sms",
      maskedPhone,
    };
  }

  // 2. 2Factor.in (India Instant OTP Route)
  const twoFactorKey =
    process.env.TWOFACTOR_API_KEY ||
    (provider === "twofactor" || settings.sms_provider === "twofactor"
      ? settings.sms_api_key
      : undefined);

  if (twoFactorKey) {
    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(
      twoFactorKey
    )}/SMS/${tenDigit}/${params.otp}/MYDR_OTP`;
    const res = await fetch(endpoint, { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as {
      Status?: string;
      Details?: string;
    };
    if (!res.ok || data.Status === "Error") {
      throw new Error(
        `2Factor SMS Error: ${data.Details || "Could not dispatch SMS"}`
      );
    }
    return {
      delivered: true,
      liveSmsSent: true,
      provider: "twofactor",
      maskedPhone,
    };
  }

  // 3. MSG91 India OTP API
  const msg91Key =
    process.env.MSG91_AUTH_KEY ||
    (provider === "msg91" || settings.sms_provider === "msg91"
      ? settings.sms_api_key
      : undefined);
  const msg91Template =
    process.env.MSG91_TEMPLATE_ID || settings.sms_template_id;

  if (msg91Key) {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: msg91Key,
      },
      body: JSON.stringify({
        template_id: msg91Template,
        mobile: params.phone.replace("+", ""),
        otp: params.otp,
      }),
    });
    if (!res.ok) {
      throw new Error("Failed to send OTP via MSG91");
    }
    return {
      delivered: true,
      liveSmsSent: true,
      provider: "msg91",
      maskedPhone,
    };
  }

  // 4. Twilio Programmable SMS
  const twilioSid =
    process.env.TWILIO_ACCOUNT_SID || settings.twilio_account_sid;
  const twilioToken =
    process.env.TWILIO_AUTH_TOKEN || settings.twilio_auth_token;
  const twilioFrom =
    process.env.TWILIO_FROM_NUMBER || settings.twilio_from_number;

  if (twilioSid && twilioToken && twilioFrom) {
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const body = new URLSearchParams({
      To: params.phone,
      From: twilioFrom,
      Body: `Your My Dr verification code is ${params.otp}. Valid for 5 minutes. Do not share this code with anyone.`,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );
    if (!res.ok) {
      throw new Error("Failed to send OTP via Twilio");
    }
    return {
      delivered: true,
      liveSmsSent: true,
      provider: "twilio",
      maskedPhone,
    };
  }

  // 5. Supabase Native Phone Auth
  if (provider === "supabase_native") {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: params.phone,
      });
      if (error) {
        throw new Error(`Supabase Phone Auth error: ${error.message}`);
      }
      return {
        delivered: true,
        liveSmsSent: true,
        provider: "supabase_native",
        maskedPhone,
      };
    }
  }

  // Local SMS Sandbox (until an API key is pasted in /admin/settings or .env.local):
  // Never auto-fills the form — delivers via realistic incoming SMS push notification.
  console.info(
    `[My Dr SMS] To ${params.phone}: Your My Dr verification code is ${params.otp} (Valid 5 mins)`
  );
  return {
    delivered: true,
    liveSmsSent: false,
    provider: "sms_sandbox",
    maskedPhone,
    fallbackSmsCode: params.otp,
  };
}
