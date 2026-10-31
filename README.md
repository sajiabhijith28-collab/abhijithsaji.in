# My Dr — Hospital & Doctor Appointment Booking Platform

**My Dr** is a production-ready healthcare appointment booking platform built for India using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS + shadcn/ui**, **Framer Motion**, **Supabase (PostgreSQL + Phone Auth + Row Level Security + Storage)**, and **Razorpay**.

---

## ✨ Highlights & Capabilities

### 1. Patient Experience
- **Dual Login Methods**: Sign up & log in with **Mobile Number + 6-Digit SMS OTP**, and optionally set a password to log in via **Mobile Number + Password**.
- **Location-Aware Doctor Discovery**: Browser GPS Geolocation (`Near Me`) with manual Indian city/locality picker fallback.
- **Rich Clinical Filters**: Filter by Specialty, City/Area, Hospital, Availability Date, Max Consultation Fee, and Rating.
- **Zero Double-Booking Checkout**: Atomic 10-minute slot lock backed by PostgreSQL unique constraints (`idx_unique_active_doctor_slot`) and transactional server checks.
- **Pay Platform Fee Online • Consultation Fee at Clinic**: Patients click a direct UPI payment link (`upi://pay`, Google Pay, PhonePe, Paytm, BHIM — no QR code) pre-filled with your UPI ID (`pksaji020@oksbi`) and exact platform fee, submit their 12-digit UTR, and pay the Doctor's Consultation Fee directly at the clinic counter.
- **Personal Account (`/account`)**: Manage personal health profile, password security, SMS/in-app notifications, reschedule slots, cancel with automated policy refunds, and print/save official payment receipts.

### 2. Doctor Portal (`/doctor/*`)
- **Admin-Issued Login + Forced First-Login Password Change**: Newly onboarded doctors log in with admin-generated credentials and are required to set a personal password on first login.
- **Dashboard & Calendar (`/doctor/dashboard`)**: Today's appointment queue, KPI cards, and interactive 14-day schedule calendar.
- **Bookings Management (`/doctor/appointments`)**: View patient age, gender, phone, and symptoms; mark visits **Completed**, **No-Show**, or **Cancelled**.
- **Availability & Leaves (`/doctor/availability`)**: Configure working days, morning/evening shifts, slot duration (`15m`–`60m`), and block holiday/conference leave dates.
- **Earnings & Payouts (`/doctor/earnings`)**: Track gross collections, platform fees deducted, net payable earnings, and UTR bank settlement history.

### 3. Platform Admin Console (`/admin/*`)
- **Executive Analytics (`/admin`)**: Real-time KPIs, 7-day Bookings chart, Revenue & Platform Fee trend chart, Top Doctors, and Top Specialties.
- **Doctors & Credentials (`/admin/doctors`)**: Add/edit/deactivate doctors, set **per-doctor platform fee overrides** (`%` or `Flat ₹`), and auto-generate copyable login credentials.
- **Catalog Manager (`/admin/hospitals`)**: Manage Partner Hospitals, Specialties, and Cities/Areas.
- **Master Bookings & Patients (`/admin/bookings`)**: Monitor all appointments, manage patient accounts, and trigger instant 100% refunds.
- **Payments & UPI Approval (`/admin/payments`)**: Verify patient 12-digit UPI UTR transfers (`Approve` / `Reject`), filter transactions by date, doctor, patient, or status, inspect revenue splits, and download CSV reports.
- **Doctor Payouts (`/admin/payouts`)**: Reconcile pending vs settled payouts per doctor with one-click **"Mark as Settled"** + UTR tracking.
- **UPI & Platform Fee Settings (`/admin/settings`)**: Configure your receiving UPI ID (`pksaji020@oksbi`), confirmation policy (`Hold slot until Admin clicks Approve` vs `Instant UTR`), global platform fee (`Percentage` or `Flat INR`), refund windows, and SMS providers (`dev_console`, `supabase_native`, `msg91`, `twilio`).

---

## 🚀 Quick Start (Run Locally in 60 Seconds)

The platform includes a **Dual-Mode Data & Test Engine** pre-seeded with Indian cities, partner hospitals, NMC-verified demo doctors, patients, and historical bookings so you can test every single feature immediately — even before connecting external SMS or live Razorpay keys.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional for Local Demo Mode)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Start the Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## 🧪 Demo Accounts (Pre-Seeded for Instant Testing)

| Role | Login Route | Mobile Number | Password / OTP | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Patient (Password)** | `/login` | `9876543210` | `Patient@123` | Aarav Sharma (has upcoming & past bookings) |
| **Patient (First OTP)** | `/login` | `9876500011` | Click *Send OTP* (auto-fills in Test Mode) | Priya Nair (prompts optional password setup) |
| **Doctor (Active)** | `/login?tab=doctor` | `9820000101` | `Doctor@123` | Dr. Ananya Deshmukh (Cardiologist, today's queue) |
| **Doctor (1st Login)** | `/login?tab=doctor` | `9820000102` | `Temp@2026` | Dr. Rohan Kulkarni (forces password change on login; has ₹49 flat fee override) |
| **Platform Admin** | `/admin` | `9000000001` | `Admin@1234` | Full platform control, fee settings, payouts & CSV export |

---

## 🗄️ Production Supabase Setup

Run the SQL files inside `supabase/` in order inside the **Supabase SQL Editor** (or via `supabase db push`):
1. `supabase/migrations/0001_initial_schema.sql` — Tables, enums, indexes, `idx_unique_active_doctor_slot`, and `medical-media` Storage bucket.
2. `supabase/migrations/0002_rls_policies.sql` — Strict Row Level Security policies on every table (`patient`, `doctor`, `admin`).
3. `supabase/migrations/0003_functions_rpcs.sql` — Transactional `create_locked_appointment` PostgreSQL RPC with automatic expired lock cleanup and immutable fee snapshotting.
4. `supabase/seed.sql` — Initial Indian locations, specialties, partner hospitals, and default platform settings.

Then populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

---

## 💳 Razorpay & SMS Gateway Configuration

- **Razorpay**: Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` (`rzp_test_...`), `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `.env.local`. Point Razorpay webhooks (`payment.captured`) to `https://<your-domain>/api/payments/webhook`.
- **SMS OTP**: Set `SMS_PROVIDER` to `supabase_native`, `msg91`, or `twilio` (or swap dynamically inside `/admin/settings`).

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub / GitLab.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.example` in Vercel Project Settings.
4. Click **Deploy** — Next.js App Router & API routes deploy automatically on Vercel Serverless/Edge.

