"use client";

import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Link as LinkIcon, Loader2, Trash2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Client-side Canvas image compressor.
 * Downscales large camera photos to max 500x500 WebP/JPEG,
 * keeping size ~25-60KB for instant storage in SQLite/Supabase and ultra-fast loading.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 500,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file (JPEG, PNG, WebP)"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to process image"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first (smallest footprint), fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  fallbackInitials?: string;
  category?: "doctor" | "patient";
  className?: string;
}

const DOCTOR_PRESETS = [
  {
    name: "Dr. Female 1",
    url: "https://images.unsplash.com/photo-1594824813590-48967916962f?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dr. Male 1",
    url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dr. Female 2",
    url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Dr. Male 2",
    url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
  },
];

const PATIENT_PRESETS = [
  {
    name: "Avatar 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Avatar 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Avatar 3",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Avatar 4",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
];

export function ImageUpload({
  value,
  onChange,
  label = "Profile Photo",
  description,
  fallbackInitials,
  category = "doctor",
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const presets = category === "doctor" ? DOCTOR_PRESETS : PATIENT_PRESETS;

  const handleFileProcess = async (file: File) => {
    try {
      setCompressing(true);
      const compressedDataUrl = await compressImageToDataUrl(file, 500, 0.82);
      onChange(compressedDataUrl);
      toast.success("Profile photo uploaded & optimized successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process image");
    } finally {
      setCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:image/")) {
      toast.error("Please enter a valid image web URL starting with https://");
      return;
    }
    onChange(trimmed);
    setUrlDraft("");
    setShowUrlInput(false);
    toast.success("Image URL applied");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
        >
          <LinkIcon className="h-3 w-3" />
          {showUrlInput ? "Hide URL input" : "Or paste image link"}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Upload / Preview Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col sm:flex-row items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
            : "border-border/80 bg-muted/20 hover:border-primary/50"
        )}
      >
        {/* Avatar Preview Box */}
        <div className="relative group shrink-0">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-[#c9a353]/40 bg-gradient-to-br from-[#0b1f3a]/90 to-[#14325a] shadow-inner flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="Profile Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback on broken image link
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80";
                }}
              />
            ) : fallbackInitials ? (
              <span className="font-heading text-2xl font-black text-[#ebd396]">
                {fallbackInitials}
              </span>
            ) : (
              <User className="h-10 w-10 text-slate-300" />
            )}

            {/* Hover Camera Overlay */}
            <button
              type="button"
              disabled={compressing}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs font-semibold"
            >
              <Camera className="h-5 w-5" />
              <span>Change</span>
            </button>

            {compressing && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-[10px] font-bold mt-1">Compressing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={compressing}
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold shadow-xs hover:border-primary"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Image File
            </Button>

            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Supports JPG, PNG, WebP. Drag &amp; drop or click to upload from your computer or camera.
          </p>

          {/* Quick preset selector */}
          <div className="pt-1">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground">Or pick sample:</span>
              {presets.map((preset, idx) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  title={preset.name}
                  className={cn(
                    "relative h-7 w-7 rounded-lg overflow-hidden border transition-all hover:scale-110",
                    value === preset.url
                      ? "ring-2 ring-primary border-primary scale-105"
                      : "opacity-75 hover:opacity-100"
                  )}
                >
                  <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optional URL Input Drawer */}
      {showUrlInput && (
        <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">Paste Image Web Address (URL)</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyUrl();
                }
              }}
              className="text-xs h-9"
            />
            <Button type="button" size="sm" onClick={handleApplyUrl} className="shrink-0 h-9">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

