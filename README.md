# Birth Nest — Public Site

The public marketing site and live appointment-booking flow for **Birth
Nest**, Dr. Mythri Sharan's gynaecology, pregnancy and fertility care
clinic, backed by a real Supabase project.

This repo is **public-facing only** — there is no login page and no staff
dashboard here. Those live in a separate companion repo,
[`birthnest-admin`](https://github.com/nainathippani-anvayuone/birthnest-admin)
(admin app URL: TODO — fill in once deployed), so a patient browsing the
website never sees a staff sign-in surface at all. Both apps talk to the
**same Supabase project**, so an appointment booked here shows up in the
admin app immediately — there's no syncing code, they just share a
database.

- **Frontend:** Vite + React 19 + TypeScript, Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage, Realtime, Edge Functions)

Patients are **not** a login role anywhere in this system — they're plain
records (name, contact info, medical history) that staff create and manage
from the admin app, the same way a receptionist would enter them into any
hospital system.

## Project structure

```
src/
  components/
    ui/           Reusable primitives: Button, Field, Spinner
    layout/        PublicNavbar, PublicFooter
    landing/       Public homepage sections (Hero, Services, booking widget, etc.)
  hooks/           usePublicServices/usePublicTestimonials
  pages/
    public/        LandingPage, NotFoundPage
  lib/
    supabase.ts    Supabase client (always talks to the real project — no demo mode here)
  types/           Hand-maintained types mirroring the migrations below
  utils/           Formatters, cn
supabase/
  migrations/      Versioned schema history (see below) — the source of truth,
                    shared by both this repo and birthnest-admin
  functions/
    book-appointment/    Public Edge Function powering the booking widget
    provision-account/   Staff-account creation, called from the admin app
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
5. `20260921165535_add_real_testimonials.sql` / `20260921165849_replace_placeholder_testimonials.sql`
   — replace placeholder testimonial copy with real, sourced patient reviews.

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

(or add a new migration first with `supabase migration new <name>`). Since
`birthnest-admin` reads from this same database, a schema change here is
immediately visible there too — no separate migration step needed on that
side.

### Bootstrapping the first admin account

There's no UI in *this* repo for creating staff accounts (that's the admin
app's job) or for promoting the very first one to `admin` — every account
starts as `role = 'receptionist'` by default (lowest privilege, enforced by
the `handle_new_user` trigger). To create the first admin, create an account
via the Supabase dashboard/Admin API, then in the SQL Editor run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

This works specifically because that guard trigger only blocks role changes
made *by a logged-in browser session* — `auth.uid()` is null when run from
the SQL Editor or any service-role context. After that, the admin creates
every other account from the admin app's **Staff & Users** page.

## Staff account creation (backend)

The `provision-account` Edge Function (`supabase/functions/provision-account`)
lives here since it's backend, but is only ever called from the
`birthnest-admin` app's Staff & Users page:

1. Authenticates the caller from their JWT and checks they're an admin.
2. Uses the service-role key — never sent to the browser — to call
   `auth.admin.createUser({ email, password: <generated>, email_confirm: true })`.
   No email is sent — the generated temp password is returned once and shown
   on screen for the admin to hand over.
3. Updates `profiles.role` and inserts the `doctors` row (if applicable), all
   with the service role so it bypasses RLS atomically.

To redeploy the function after an edit:

```bash
supabase functions deploy provision-account --project-ref zwuqsymaswlnicuvxiai
```

**Patients** are not accounts at all — the admin app's "Register Patient"
does a single, direct `insert` into the `patients` table. No auth involved,
no Edge Function.

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
     first-visit flag included) — it appears on the **admin app's**
     Appointments page and dashboard overview immediately, same as any other
     appointment, because both apps read the same database.
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

Needs a `.env` (see `.env.example`) with `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` pointing at the Supabase project — unlike
`birthnest-admin`, this app has no demo-mode fallback, since its whole
purpose (booking, live services/testimonials) only makes sense against a
real backend.

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
- The `documents` table + `medical-documents` storage bucket exist in the
  schema (10 MB limit, PDF/PNG/JPEG/WebP only, staff-only access) but there's
  no upload/view page wired up yet — a natural next feature for the admin app.
