import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.abhijithsaji.in"
  ).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/doctors"],
      disallow: ["/admin/", "/doctor/", "/account/", "/checkout", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

