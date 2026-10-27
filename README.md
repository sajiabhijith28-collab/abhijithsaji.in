# Ente Hospital Portal

A React and Supabase appointment portal for patients, doctors, and hospital administrators. Authentication and application records are stored in Supabase; the browser does not contain seeded accounts or a local mock database.

## Features

- Supabase email/password sign-in, email verification, and password reset.
- Patient and doctor self-registration. New doctor accounts remain pending until an administrator approves them.
- Doctor directory, availability management, appointment booking, and cancellation.
- Admin tools for doctor approval, account suspension, appointment oversight, and platform fee configuration.
- Row Level Security (RLS) policies and server-side database functions for role-sensitive operations and atomic appointment booking.

## Run locally

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env` and set your project URL and **anon/publishable key**:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Never put a Supabase `service_role` key in a `VITE_` variable or in browser code.

4. In Supabase Authentication settings, configure email confirmation and the allowed redirect URLs for your local and deployed app.
5. Install dependencies and run the development server:

   ```sh
   npm install
   npm run dev
   ```

   `npm run build` creates the static production bundle in `dist`.

If Supabase environment variables are missing, the sign-in screen will explain how to configure them. This project intentionally does not sign in with preloaded demo users or fall back to browser-only data.

## Administrator onboarding

There is no public administrator signup or shared passkey. Register the account through Supabase Auth as a patient, verify its email, then promote the intended account from the Supabase SQL Editor using its verified email:

```sql
update public.profiles
set role = 'admin', is_approved = true
where email = 'admin@your-hospital.example';
```

Only run this statement in the trusted Supabase SQL Editor after verifying the account owner. Administrators must use the normal sign-in form and select the Administrator role.

## Before using with real patients

This repository is an application starting point, not a certified clinical or billing system. It does not process payments, send email/push appointment reminders, provide medical records storage, or establish HIPAA/NABH compliance. Review and test the RLS policies against your own Supabase project, configure backups and monitoring, and obtain the appropriate security, privacy, and regulatory review before storing protected health information or deploying for clinical use.
