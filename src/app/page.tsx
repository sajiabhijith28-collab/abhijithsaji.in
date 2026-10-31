import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Bone,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HeartPulse,
  HelpCircle,
  Lock,
  ShieldCheck,
  ShieldPlus,
  Smile,
  Smartphone,
  Sparkles,
  Stethoscope,
  UserCheck,
  Wallet,
} from "lucide-react";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { HeroSearch } from "@/components/home/hero-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHospitals, getSpecialties, searchDoctors } from "@/lib/db/store";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Sparkles,
  Baby,
  Bone,
  ShieldPlus,
  Stethoscope,
  Brain,
  Smile,
};

const FAQS = [
  {
    q: "How do I access my Personal Account?",
    a: "Enter your 10-digit Indian mobile number on the Sign In page to verify via 6-digit SMS OTP. Your mobile number is directly linked to your personal health profile, appointments, and digital receipts.",
  },
  {
    q: "When do I pay the consultation fee vs. the booking fee?",
    a: "You only pay the small My Dr Platform Booking Fee online via Direct UPI (Google Pay, PhonePe, Paytm, BHIM) to lock your slot. The Doctor's Consultation Fee is paid directly at the hospital or clinic counter.",
  },
  {
    q: "Can two patients double-book the same appointment slot?",
    a: "Never. Selecting a time slot places an atomic lock on that doctor's exact date and slot time, protected against concurrent bookings while your UPI payment is verified.",
  },
  {
    q: "What is the cancellation and reschedule policy?",
    a: "You can reschedule to another open slot or cancel directly from your Personal Account. Cancellations outside the free cancellation window or initiated by the clinic qualify for full booking-fee refund.",
  },
];

export default function LandingPage() {
  const specialties = getSpecialties();
  const featuredDoctors = searchDoctors({ featuredOnly: true });
  const allDoctors =
    featuredDoctors.length > 0 ? featuredDoctors : searchDoctors({});
  const hospitals = getHospitals();

  return (
    <div className="space-y-20 pb-8">
      {/* 1. HERO SECTION */}
      <section className="royal-navy-hero relative overflow-hidden border-b border-[#c9a353]/35 text-white pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="container relative z-10 space-y-8">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a353]/50 bg-[#c9a353]/15 px-3.5 py-1 text-xs font-medium text-[#ebd396]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#dfc074]" />
                Ponkunnam, Kerala • Verified Hospital &amp; Specialist Network
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] text-white">
                Find Trusted Doctors in Ponkunnam.{" "}
                <span className="bg-gradient-to-r from-[#ebd396] via-[#dfc074] to-[#c9a353] bg-clip-text text-transparent">
                  Book Confirmed Slots
                </span>{" "}
                in 60 Seconds.
              </h1>
              <p className="text-base sm:text-lg text-slate-200/90 max-w-2xl leading-relaxed">
                Skip hospital queues in Ponkunnam, Kerala. Browse verified
                specialists
                {hospitals.length > 0
                  ? ` across ${hospitals.length} partner hospital${
                      hospitals.length > 1 ? "s" : ""
                    } in Ponkunnam`
                  : " across Ponkunnam clinics"}
                , lock your slot with a direct UPI booking fee, and pay your
                consultation fee directly at the clinic.
              </p>
            </div>

            {/* Signature Royal Gold Emblem Showcase */}
            <div className="hidden lg:flex lg:col-span-4 justify-center">
              <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-[#c9a353]/55 bg-[#0b1f3a] p-2 shadow-[0_0_60px_rgba(201,163,83,0.22)]">
                <img
                  src="/logo.jpg"
                  alt="My Dr Royal Emblem"
                  className="h-full w-full rounded-full object-cover object-center scale-[1.12]"
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="text-foreground">
            <HeroSearch specialties={specialties} />
          </div>

          {/* Quick Specialty Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-[#ebd396]">Departments:</span>
            {specialties.slice(0, 6).map((s) => (
              <Link
                key={s.id}
                href={`/doctors?specialty=${s.slug}`}
                className="rounded-full border border-[#c9a353]/35 bg-white/[0.08] px-3 py-1 font-medium text-slate-100 hover:border-[#ebd396] hover:bg-[#c9a353]/20 hover:text-[#ebd396] transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>

          {/* Authentic Platform Guarantees Bar */}
          <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
            {[
              { value: "100%", label: "NMC Verified Specialists" },
              { value: "< 60 sec", label: "Atomic Slot Lock" },
              { value: "Direct UPI", label: "1-Tap UPI App Launch" },
              { value: "At Clinic", label: "Pay Consultation at Counter" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#c9a353]/30 bg-white/[0.07] p-4 backdrop-blur-xs"
              >
                <div className="font-heading text-xl sm:text-2xl font-bold text-[#ebd396]">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-200/85 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CLINICAL SPECIALTIES */}
      <section id="specialties" className="container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="secondary">Clinical Departments</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Browse by Medical Specialty
            </h2>
            <p className="text-sm text-muted-foreground">
              Consult verified specialists across major clinical departments
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/doctors">
              View All Doctors
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {specialties.map((spec) => {
            const Icon = ICON_MAP[spec.icon_name] || Stethoscope;
            return (
              <Link
                key={spec.id}
                href={`/doctors?specialty=${spec.slug}`}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-base group-hover:text-primary transition-colors">
                        {spec.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {spec.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. VERIFIED SPECIALISTS */}
      <section className="container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="default">Verified Specialists</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Available Doctors &amp; Clinics
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time hospital schedules with guaranteed zero double-booking
            </p>
          </div>
          {allDoctors.length > 0 && (
            <Button asChild>
              <Link href="/doctors">
                Explore All Specialists
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {allDoctors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allDoctors.slice(0, 6).map((doc, idx) => (
              <DoctorCard key={doc.id} doctor={doc} index={idx} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 px-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-lg font-bold">
                No Doctors Published Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Doctors and partner clinics added in the Admin Control Center
                appear here automatically with live morning and evening slots.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 4. HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y bg-muted/35 py-16 md:py-20"
      >
        <div className="container space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="secondary">Simple 3-Step Booking</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">How My Dr Works</h2>
            <p className="text-sm text-muted-foreground">
              Built mobile-first for verified, queue-free hospital appointments
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Smartphone,
                title: "Verify Mobile & Pick Doctor",
                desc: "Sign into your Personal Account with a 6-digit SMS OTP and browse verified specialists near your city.",
              },
              {
                step: "02",
                icon: CalendarCheck,
                title: "Lock Your Exact Time Slot",
                desc: "Choose an open morning or evening slot. Your time is atomically reserved so no one else can double-book it.",
              },
              {
                step: "03",
                icon: Wallet,
                title: "Pay Booking Fee via UPI & Visit Clinic",
                desc: "Tap your UPI app link to pay the small booking fee online, and settle the doctor's consultation fee directly at the clinic.",
              },
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="font-heading text-3xl font-extrabold text-primary/20">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ */}
      <section id="faq" className="container max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="secondary">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Transparent Answers Before You Book
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FAQS.map((item) => (
            <Card key={item.q}>
              <CardContent className="p-5 space-y-2">
                <h3 className="font-heading text-base font-semibold">
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <Card className="royal-navy-hero text-white border border-[#c9a353]/45 shadow-xl overflow-hidden">
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="font-heading text-2xl font-bold text-white">
                Ready to consult a specialist near you?
              </h3>
              <p className="text-sm text-slate-200/85 max-w-xl">
                6-digit mobile OTP login, verified doctors, direct UPI slot
                confirmation, and digital receipts in your Personal Account.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-1 text-xs text-[#ebd396]">
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" /> Personal Health ID
                </span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Direct UPI Verification
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Pay Consult Fee at Clinic
                </span>
              </div>
            </div>
            <Button
              size="xl"
              className="shrink-0 font-bold bg-gradient-to-r from-[#c9a353] to-[#dfc074] text-[#08172c] border border-[#ebd396]/70 hover:brightness-105"
              asChild
            >
              <Link href="/doctors">
                Find a Doctor Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
