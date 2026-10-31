import type { MetadataRoute } from "next";
import { getSpecialties, searchDoctors } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.abhijithsaji.in"
  ).replace(/\/$/, "");
  const now = new Date();

  const specialties = getSpecialties();
  const doctors = searchDoctors({});

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/doctors`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...specialties.map((s) => ({
      url: `${baseUrl}/doctors?specialty=${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...doctors.map((d) => ({
      url: `${baseUrl}/doctors/${d.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  ];
}

