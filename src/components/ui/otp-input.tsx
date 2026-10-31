"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, idx) => value[idx] || "");

  const focusIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(length - 1, idx));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  };

  const handleDigitChange = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const nextArr = [...digits];
      nextArr[idx] = "";
      onChange(nextArr.join(""));
      return;
    }

    // Handle multi-digit paste or mobile keyboard auto-fill ("one-time-code")
    if (clean.length > 1) {
      const nextArr = [...digits];
      for (let i = 0; i < clean.length && idx + i < length; i++) {
        nextArr[idx + i] = clean[i];
      }
      const joined = nextArr.join("").slice(0, length);
      onChange(joined);
      focusIndex(Math.min(idx + clean.length, length - 1));
      return;
    }

    const nextArr = [...digits];
    nextArr[idx] = clean[0];
    onChange(nextArr.join(""));
    if (idx < length - 1) {
      focusIndex(idx + 1);
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const nextArr = [...digits];
        nextArr[idx] = "";
        onChange(nextArr.join(""));
      } else if (idx > 0) {
        e.preventDefault();
        const nextArr = [...digits];
        nextArr[idx - 1] = "";
        onChange(nextArr.join(""));
        focusIndex(idx - 1);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      focusIndex(idx - 1);
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      focusIndex(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text/plain")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className="grid grid-cols-6 gap-2 sm:gap-2.5"
      role="group"
      aria-label={`${length}-digit verification code`}
    >
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={idx === 0 ? length : 1}
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && idx === 0}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          value={digit}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "h-12 sm:h-13 w-full rounded-xl border bg-background text-center font-heading text-lg sm:text-xl font-bold tabular-nums transition-all focus:outline-none focus:ring-2 focus:ring-[#c9a353] focus:border-[#c9a353] disabled:opacity-50",
            digit
              ? "border-primary/70 bg-primary/[0.04] text-foreground shadow-xs"
              : "border-input text-foreground"
          )}
        />
      ))}
    </div>
  );
}

