import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Navbar } from "@/components/layout/navbar";
import { LocationProvider } from "@/components/providers/location-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocations } from "@/lib/db/store";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0b1f3a",
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.abhijithsaji.in";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "My Dr — Book Verified Doctors & Clinics in Ponkunnam, Kerala",
    template: "%s | My Dr Ponkunnam",
  },
  description:
    "Book verified doctors, clinics, and hospital appointments in Ponkunnam, Kerala. View real-time slots, pay platform booking fee via Direct UPI, and pay consultation fee at the clinic.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "My Dr — Book Verified Doctors & Clinics in Ponkunnam, Kerala",
    description:
      "Instant confirmed doctor & clinic appointments in Ponkunnam, Kerala. Direct UPI booking fee + pay consultation at clinic.",
    url: APP_URL,
    siteName: "My Dr Ponkunnam",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/logo.jpg", width: 512, height: 512, alt: "My Dr Logo" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Dr",
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const locations = getLocations();
  const uniqueCities = Array.from(new Set(locations.map((l) => l.city)));

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LocationProvider initialCities={uniqueCities}>
            <Navbar user={user} />
            <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav user={user} />
            <Toaster richColors position="top-center" closeButton />
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
