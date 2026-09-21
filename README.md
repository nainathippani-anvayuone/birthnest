# Birth Nest — Gynaecology Hospital Management System

A production-style **staff-only** hospital management portal for **Birth Nest**, Dr.
Mythri Sharan's gynaecology, pregnancy and fertility care clinic — a public marketing
site plus a role-based, authenticated management dashboard, backed by a real Supabase
project.

This is a tool for the clinic's own team, not a patient portal: patients never create
an account or log in anywhere. They're plain records (name, contact info, medical
history) that staff create and manage — the same way a receptionist would enter them
into any hospital system.

- **Frontend:** Vite + React 19 + TypeScript, Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage, Realtime, Edge Functions)

## Roles

| Role | Access |
|---|---|
| `admin` | Everything: staff/user management, services, analytics, billing, pharmacy |
| `doctor` | Own patients, consultations, prescriptions, schedule, appointments |
| `receptionist` | Patient registration, appointments, billing, pharmacy |
| `lab_staff` | Lab order queue, entering results, test catalog |

Patients are **not** a login role — see below.

## Two modes, same code

`src/lib/supabase.ts` checks whether `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
are set:

- **Configured** → talks to the real Supabase project below. This is the
  current state of this repo — a project (`birth-nest`) already exists and
  `.env` already points at it.
- **Not configured** (no `.env`) → falls back to **demo mode**: an in-memory
  mock of the same client API (`src/lib/mockSupabaseClient.ts`), seeded with
  sample data (`src/lib/demoData.ts`), so the whole app is explorable with
  zero setup via the "Try a demo account" panel on the login page. Nothing in
  the UI code branches on this — every page just calls `supabase.from(...)`
  the same way either way.

## Project structure

```
src/
  components/
    ui/           Reusable primitives: Button, Card, DataTable, Modal, Field, etc.
    layout/        DashboardLayout, PublicNavbar/Footer, ProtectedRoute, RoleGate
    landing/       Public homepage sections
    PatientPicker.tsx  Search-and-select for patient *records* (not accounts)
  contexts/        AuthContext (session + profile) — staff only
  hooks/           useUnreadNotifications, usePublicServices/Testimonials
  pages/
    public/        Landing, Login, 404 (no signup — see below)
    dashboard/      DashboardHome + admin/doctor/shared feature pages
  lib/
    supabase.ts             Real vs. demo client switch
    mockSupabaseClient.ts   Demo-mode query engine + RLS emulation
    demoData.ts             Demo seed data
  types/           Hand-maintained types mirroring the migrations below
  utils/           Formatters, role/nav config, scheduling (slot computation),
                   accountProvisioning (see below)
supabase/
  migrations/      Versioned schema history (see below) — the source of truth
  functions/
    provision-account/   Edge Function: creates staff accounts (admin/doctor/
                          receptionist/lab_staff) — never patients
  seed.sql         Catalog-only demo data: services, lab tests, testimonials
  config.toml      Project config (auth settings, etc.) — pushed via
                   `supabase config push`
```

## The database

Schema lives in `supabase/migrations/`, applied in order:

1. `20260920180550_initial_schema.sql` — tables, enums, triggers, RLS, storage
   bucket, realtime publications. (Patients originally shared a table keyed to
   login accounts here — see migration 3.)
2. `20260920182142_harden_rls_and_performance.sql` — a pass driven by
   `supabase db advisors`: pinned `search_path` on two functions, added 14
   missing foreign-key indexes, wrapped every `auth.uid()`/helper call in
   policies as `(select …)` so Postgres evaluates it once per query instead of
   once per row, and split every `for all` policy that overlapped a dedicated
   `for select` policy on the same table.
3. `20260921134746_remove_patient_login.sql` — product direction change:
   patients never log in. Drops the FK from `patients.id` to `auth.users`,
   gives `patients` its own identity columns (`full_name`, `email`, `phone`),
   and rebuilds every RLS policy that referenced `patient_id = auth.uid()`
   down to staff-only access (that clause is meaningless once a patient can't
   authenticate at all).
4. `20260921142329_public_booking.sql` — adds `appointments.is_first_visit`
   and the `get_doctor_available_slots(doctor_id, date)` function (see
   "Public appointment booking" below).

Two `WARN`-level advisor findings are left as-is, intentionally:
`current_role()`/`is_staff()`/`is_admin()` are flagged as "publicly executable
SECURITY DEFINER functions" — but revoking `EXECUTE` on them would break every
RLS policy that calls them (a policy's function calls run under the querying
role's own privileges), and calling them only ever reveals the caller's *own*
role. See the comment at the top of migration 2 for the full reasoning.

To apply schema changes to the linked project:

```bash
supabase db push --linked
```

(or add a new migration first with `supabase migration new <name>`).

### Bootstrapping the first admin

Every account — there's only ever the one kind, staff — lands as
`role = 'receptionist'` by default (the lowest-privilege role; enforced by the
`handle_new_user` trigger, and a browser client can never mint itself a
higher role directly). To create the **first** admin, create an account
through **Dashboard → Staff & Users** (which needs an admin to already
exist — chicken-and-egg for the very first one) or via the Supabase
dashboard/Admin API, then in the SQL Editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

This works specifically because that guard trigger only blocks role changes
made *by a logged-in browser session* — `auth.uid()` is null when run from
the SQL Editor or any service-role context, so this one-time bootstrap step
always works. After that, the admin creates every other account from
**Dashboard → Staff & Users** — no more SQL needed.

## Account creation

**Staff** (admin/doctor/receptionist/lab_staff) go through
`src/utils/accountProvisioning.ts`, the entry point the "Staff & Users" page
calls. In real mode it invokes the **`provision-account` Edge Function**
(`supabase/functions/provision-account`), which:

1. Authenticates the caller from their JWT and checks they're an admin.
2. Uses the service-role key — never sent to the browser — to call
   `auth.admin.createUser({ email, password: <generated>, email_confirm: true })`.
   This is impossible from the browser (the anon key can't call the
   `admin.*` namespace at all) and can't be forged by a client. No email is
   sent — the generated temp password is returned once and shown on screen
   for the admin to hand over. The new user should change it after their
   first login (Profile → Security).
3. Updates `profiles.role` and inserts the `doctors` row (if applicable), all
   with the service role so it bypasses RLS atomically.

To redeploy the function after an edit:

```bash
supabase functions deploy provision-account --project-ref zwuqsymaswlnicuvxiai
```

**Patients** are not accounts at all — "Register Patient" on the Patients
page does a single, direct `insert` into the `patients` table (name, phone,
medical history, etc.). No auth involved, no Edge Function, nothing to
provision. This is intentional: it's the whole reason the login/account
concept was removed from patients — see migration 3.

### If you ever need email verification

There's no patient signup to secure, but if staff account creation should
someday confirm the person owns their email (a real compliance requirement
in some deployments) instead of a temp password handed over in person: swap
the `auth.admin.createUser(...)` call in the Edge Function for
`auth.admin.inviteUserByEmail(...)` and drop the `tempPassword` return value.
Supabase's shared default email service caps out at **2 emails/hour** per
project — configure custom SMTP under Project Settings → Auth before relying
on this for real volume.

## Public appointment booking

Anyone can book directly from the homepage (`#book-appointment`) — no
account, no phone call. The flow, end to end:

1. **`get_doctor_available_slots(doctor_id, date)`** (SQL, `SECURITY DEFINER`,
   granted to `anon`) is the single source of truth for slot availability. It
   walks the doctor's `doctor_availability` windows for that weekday in
   20-minute steps, marks a slot unavailable if it overlaps a non-cancelled
   appointment or falls on a `doctor_time_off` day, and hides past slots for
   today. The browser calls this directly (`supabase.rpc(...)`) to paint the
   green/red slot grid — nothing about "who has this slot" is exposed, only
   the boolean.
2. Submitting the form calls the **`book-appointment` Edge Function**
   (`supabase/functions/book-appointment`, `auth: "none"` — fully public).
   Server-side, with the service-role key, it:
   - **Re-checks the slot** against the same `get_doctor_available_slots`
     function before writing anything, closing the race between "you loaded
     the page" and "someone else booked that slot first".
   - **Finds-or-creates the patient by email** — a repeat visitor doesn't
     accumulate duplicate records.
   - Inserts the `appointments` row (`status: 'scheduled'`, the reason and
     first-visit flag included) — it appears on staff's Appointments page and
     `DashboardHome` immediately, same as any other appointment.
   - Sends a confirmation email (best-effort — see below). A failed send
     never fails the booking; the confirmation screen just says so honestly.

`anon`/patients never get direct table access to `appointments` or
`patients` — this Edge Function is the one deliberate, narrow, validated
hole in that wall, same reasoning as `provision-account`.

### Email delivery (Resend)

`RESEND_API_KEY` is set as a Supabase secret (`supabase secrets list
--project-ref zwuqsymaswlnicuvxiai` to check). **Resend's sandbox mode — no
verified domain — only delivers to the account owner's own verified email**;
it rejects real patient addresses outright (`422 validation_error`). Confirmed
by testing both paths directly against the Resend API.

To send to real patients, verify a domain at
[resend.com/domains](https://resend.com/domains) (a few DNS records), then
update the `BOOKING_FROM_EMAIL` secret to an address on that domain:

```bash
supabase secrets set BOOKING_FROM_EMAIL="Birth Nest <noreply@yourdomain.com>" --project-ref zwuqsymaswlnicuvxiai
```

No code or redeploy needed — the Edge Function reads it at request time.

Planned: switch to Gmail SMTP (via `denomailer`) once an app password is
available — sends to any recipient with no domain verification needed. See
git history / conversation for the ready-to-restore implementation.

## Running locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. `.env` already points at the live `birth-nest`
Supabase project — delete it (or blank the values) to fall back to demo mode
instead.

## Instagram section

`src/components/landing/InstagramSection.tsx` (homepage, above Testimonials)
embeds a handful of real reels from `instagram.com/dr_mythrisharan` using
Instagram's own public per-post embed URL
(`instagram.com/reel/<shortcode>/embed`) — the same mechanism as Instagram's
"Embed" button, no API key or access token needed. The featured reels are
a hardcoded list of shortcodes (`REEL_SHORTCODES` in that file) — update it
by copying the shortcode out of the reel's URL on Instagram whenever the
featured posts should change; there's no automatic "latest posts" feed
without the Instagram Graph API (which needs a Meta developer app + token).

## Notes & known simplifications

- The "Send Us a Message" form in the Contact section (general questions,
  not appointment booking) submits into `contact_messages` (anyone can
  insert, no login) — for actual booking, see "Public appointment booking"
  above.
- Patient detail views use modals rather than dedicated routes, to keep
  the page count manageable — the underlying Supabase queries are unchanged
  either way.
- The `documents` table + `medical-documents` storage bucket exist in the
  schema (10 MB limit, PDF/PNG/JPEG/WebP only, staff-only access) but there's
  no upload/view page wired up yet — a natural next feature.
