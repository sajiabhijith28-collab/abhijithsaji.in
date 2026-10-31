import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Dr — Verified Doctors & Hospital Booking",
    short_name: "My Dr",
    description:
      "Book verified doctors near you. Pay only the platform fee via UPI and pay consultation fee at the clinic.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1f3a",
    theme_color: "#0b1f3a",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}

