import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  subtitle?: string;
  showText?: boolean;
  lightText?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

export function BrandLogo({
  size = "md",
  subtitle,
  showText = true,
  lightText = false,
  className,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-[#0b1f3a] ring-1 ring-[#c9a353]/65 shadow-md transition-transform duration-200 group-hover:scale-105",
          SIZE_CLASSES[size]
        )}
      >
        <img
          src="/logo.jpg"
          alt="My Dr Logo"
          className="h-full w-full object-cover object-center scale-[1.18]"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              "font-heading font-bold leading-none tracking-tight",
              size === "sm" ? "text-base" : size === "lg" || size === "xl" ? "text-xl" : "text-lg",
              lightText ? "text-white" : "text-foreground"
            )}
          >
            My{" "}
            <span className="text-[#b88f36] dark:text-[#d4af5a]">Dr</span>
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-[10px] font-medium mt-0.5 tracking-wide",
                lightText ? "text-[#e5ca87]/85" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

