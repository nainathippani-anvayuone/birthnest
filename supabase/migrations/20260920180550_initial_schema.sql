-- ============================================================================
-- Birth Nest — Gynaecology Hospital Management System
-- Full relational schema + Row Level Security policies for Supabase/Postgres
--
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db
-- push` with this file as a migration). Idempotent-ish: safe to re-run on a
-- fresh DB; not designed for repeated re-runs against a populated DB.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'doctor', 'receptionist', 'lab_staff', 'patient');
create type public.gender as enum ('female', 'male', 'other');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.lab_order_status as enum ('ordered', 'sample_collected', 'in_progress', 'completed', 'cancelled');
create type public.invoice_status as enum ('pending', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type public.invoice_item_type as enum ('consultation', 'service', 'lab_test', 'medication', 'other');
create type public.payment_method as enum ('cash', 'card', 'upi', 'bank_transfer', 'insurance', 'other');
create type public.notification_type as enum ('appointment', 'lab_result', 'payment', 'prescription', 'reminder', 'general');
create type public.document_category as enum ('lab_report', 'prescription', 'scan', 'invoice', 'other');

-- ----------------------------------------------------------------------------
-- 2. Generic helpers that don't touch any table yet
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Core identity tables
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'patient',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user; carries role + display identity.';

-- `language sql` functions are parsed and rewritten against the catalog at
-- CREATE time (they're stored as a plan, not raw text) — these three must
-- come after `profiles` exists, unlike the trigger functions above.

-- Returns the role of the current authenticated user without recursively
-- triggering RLS on `profiles` (SECURITY DEFINER + fixed search_path).
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'doctor', 'receptionist', 'lab_staff') from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Prevent a user from escalating their own role; only an admin may change
-- someone else's role.
-- auth.uid() is null outside of a PostgREST/browser session (the Supabase
-- SQL Editor, a service-role script, etc.) — that's the only path able to
-- promote the very first admin, so the guard only applies to logged-in
-- browser clients, never to that superuser/service context.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

create trigger trg_guard_profile_role
  before update of role on public.profiles
  for each row execute function public.guard_profile_role_change();

-- Auto-create a profile row whenever a new auth user is created.
-- Public self-signup always lands as 'patient' regardless of any client-sent
-- metadata, so a browser client can never mint itself a staff role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'patient'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.doctors (
  id uuid primary key references public.profiles (id) on delete cascade,
  specialization text not null default 'Obstetrics & Gynaecology',
  qualifications text not null default '',
  registration_number text,
  experience_years integer not null default 0,
  bio text,
  consultation_fee numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date,
  gender public.gender not null default 'female',
  blood_group text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text,
  medical_history text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Catalog tables
-- ----------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'consultation',
  price numeric(10, 2) not null default 0,
  duration_minutes integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lab_tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'general',
  sample_type text not null default 'blood',
  price numeric(10, 2) not null default 0,
  turnaround_hours integer not null default 24,
  reference_range text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  form text not null default 'tablet',
  strength text,
  manufacturer text,
  stock_quantity integer not null default 0,
  reorder_level integer not null default 10,
  unit_price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. Scheduling
-- ----------------------------------------------------------------------------

create table public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null default 20,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint chk_availability_time check (end_time > start_time)
);

create table public.doctor_time_off (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  off_date date not null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'scheduled',
  reason text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_doctor_date on public.appointments (doctor_id, appointment_date);
create index idx_appointments_patient on public.appointments (patient_id);
create index idx_availability_doctor on public.doctor_availability (doctor_id);
create index idx_time_off_doctor on public.doctor_time_off (doctor_id);

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Clinical records
-- ----------------------------------------------------------------------------

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments (id) on delete set null,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  consultation_date timestamptz not null default now(),
  chief_complaint text,
  diagnosis text,
  clinical_notes text,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 2),
  blood_pressure text,
  pulse_bpm integer,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_consultations_patient on public.consultations (patient_id);
create index idx_consultations_doctor on public.consultations (doctor_id);

create trigger trg_consultations_updated_at
  before update on public.consultations
  for each row execute function public.set_updated_at();

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_prescriptions_patient on public.prescriptions (patient_id);
create index idx_prescriptions_doctor on public.prescriptions (doctor_id);
create index idx_prescriptions_consultation on public.prescriptions (consultation_id);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions (id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  instructions text,
  created_at timestamptz not null default now()
);

create index idx_prescription_items_prescription on public.prescription_items (prescription_id);

create table public.medication_dispenses (
  id uuid primary key default gen_random_uuid(),
  prescription_item_id uuid references public.prescription_items (id) on delete set null,
  medication_id uuid references public.medications (id) on delete set null,
  patient_id uuid not null references public.patients (id) on delete cascade,
  quantity integer not null default 1,
  dispensed_by uuid references public.profiles (id) on delete set null,
  dispensed_at timestamptz not null default now(),
  notes text
);

create index idx_dispenses_patient on public.medication_dispenses (patient_id);

-- ----------------------------------------------------------------------------
-- 7. Diagnostics / lab
-- ----------------------------------------------------------------------------

create table public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.doctors (id) on delete set null,
  consultation_id uuid references public.consultations (id) on delete set null,
  ordered_by uuid references public.profiles (id) on delete set null,
  order_date timestamptz not null default now(),
  status public.lab_order_status not null default 'ordered',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_lab_orders_updated_at
  before update on public.lab_orders
  for each row execute function public.set_updated_at();

create index idx_lab_orders_patient on public.lab_orders (patient_id);
create index idx_lab_orders_doctor on public.lab_orders (doctor_id);

create table public.lab_order_items (
  id uuid primary key default gen_random_uuid(),
  lab_order_id uuid not null references public.lab_orders (id) on delete cascade,
  lab_test_id uuid not null references public.lab_tests (id) on delete restrict,
  status public.lab_order_status not null default 'ordered',
  result_value text,
  result_notes text,
  is_abnormal boolean not null default false,
  result_file_path text,
  resulted_at timestamptz,
  resulted_by uuid references public.profiles (id) on delete set null
);

create index idx_lab_order_items_order on public.lab_order_items (lab_order_id);

-- ----------------------------------------------------------------------------
-- 8. Billing
-- ----------------------------------------------------------------------------

-- Server-generated, collision-free invoice numbers (INV-2026-000001, ...).
-- Sequence-backed instead of client-generated, so concurrent bookings can
-- never produce a duplicate invoice_number.
create sequence public.invoice_number_seq;

create or replace function public.generate_invoice_number()
returns text
language sql
stable
as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default public.generate_invoice_number(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  invoice_date date not null default current_date,
  due_date date,
  status public.invoice_status not null default 'pending',
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_patient on public.invoices (patient_id);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  item_type public.invoice_item_type not null default 'other',
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null default 0,
  amount numeric(10, 2) not null default 0
);

create index idx_invoice_items_invoice on public.invoice_items (invoice_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  amount numeric(10, 2) not null,
  payment_method public.payment_method not null default 'cash',
  payment_date timestamptz not null default now(),
  transaction_reference text,
  recorded_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_payments_invoice on public.payments (invoice_id);
create index idx_payments_patient on public.payments (patient_id);

-- ----------------------------------------------------------------------------
-- 9. Documents, notifications, marketing content
-- ----------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_type text,
  category public.document_category not null default 'other',
  related_entity_type text,
  related_entity_id uuid,
  uploaded_at timestamptz not null default now()
);

create index idx_documents_patient on public.documents (patient_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'general',
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, is_read);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  message text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.services enable row level security;
alter table public.lab_tests enable row level security;
alter table public.medications enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.doctor_time_off enable row level security;
alter table public.appointments enable row level security;
alter table public.consultations enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.medication_dispenses enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.testimonials enable row level security;
alter table public.contact_messages enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles_select_self_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- inserts happen only via the handle_new_user trigger (security definer)

-- doctors ---------------------------------------------------------------
create policy "doctors_select_all" on public.doctors
  for select using (true);

create policy "doctors_insert_admin" on public.doctors
  for insert with check (public.is_admin());

create policy "doctors_update_self_or_admin" on public.doctors
  for update using (id = auth.uid() or public.is_admin());

create policy "doctors_delete_admin" on public.doctors
  for delete using (public.is_admin());

-- patients --------------------------------------------------------------
create policy "patients_select_self_or_staff" on public.patients
  for select using (id = auth.uid() or public.is_staff());

create policy "patients_insert_self_or_staff" on public.patients
  for insert with check (id = auth.uid() or public.is_staff());

create policy "patients_update_self_or_staff" on public.patients
  for update using (id = auth.uid() or public.is_staff());

-- services ----------------------------------------------------------------
create policy "services_select_active_or_staff" on public.services
  for select using (is_active or public.is_staff());

create policy "services_write_admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

-- lab_tests -----------------------------------------------------------------
create policy "lab_tests_select_active_or_staff" on public.lab_tests
  for select using (is_active or public.is_staff());

create policy "lab_tests_write_admin_or_lab" on public.lab_tests
  for all using (public.is_admin() or public.current_role() = 'lab_staff')
  with check (public.is_admin() or public.current_role() = 'lab_staff');

-- medications -----------------------------------------------------------------
create policy "medications_select_staff" on public.medications
  for select using (public.is_staff());

create policy "medications_write_admin" on public.medications
  for all using (public.is_admin()) with check (public.is_admin());

-- doctor_availability ---------------------------------------------------
create policy "availability_select_all" on public.doctor_availability
  for select using (true);

create policy "availability_write_owner_or_admin" on public.doctor_availability
  for all using (doctor_id = auth.uid() or public.is_admin())
  with check (doctor_id = auth.uid() or public.is_admin());

create policy "time_off_select_all" on public.doctor_time_off
  for select using (true);

create policy "time_off_write_owner_or_admin" on public.doctor_time_off
  for all using (doctor_id = auth.uid() or public.is_admin())
  with check (doctor_id = auth.uid() or public.is_admin());

-- appointments ------------------------------------------------------------
create policy "appointments_select_related" on public.appointments
  for select using (
    patient_id = auth.uid()
    or doctor_id = auth.uid()
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_insert_related" on public.appointments
  for insert with check (
    patient_id = auth.uid()
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_update_related" on public.appointments
  for update using (
    patient_id = auth.uid()
    or doctor_id = auth.uid()
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_delete_staff" on public.appointments
  for delete using (public.current_role() in ('admin', 'receptionist'));

-- consultations -------------------------------------------------------------
create policy "consultations_select_related" on public.consultations
  for select using (
    patient_id = auth.uid() or doctor_id = auth.uid() or public.is_admin()
  );

create policy "consultations_write_doctor_or_admin" on public.consultations
  for all using (doctor_id = auth.uid() or public.is_admin())
  with check (doctor_id = auth.uid() or public.is_admin());

-- prescriptions & items -----------------------------------------------------
create policy "prescriptions_select_related" on public.prescriptions
  for select using (
    patient_id = auth.uid() or doctor_id = auth.uid() or public.is_admin()
  );

create policy "prescriptions_write_doctor_or_admin" on public.prescriptions
  for all using (doctor_id = auth.uid() or public.is_admin())
  with check (doctor_id = auth.uid() or public.is_admin());

create policy "prescription_items_select_related" on public.prescription_items
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.patient_id = auth.uid() or p.doctor_id = auth.uid() or public.is_admin())
    )
  );

create policy "prescription_items_write_related" on public.prescription_items
  for all using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = auth.uid() or public.is_admin())
    )
  );

-- medication_dispenses --------------------------------------------------
create policy "dispenses_select_related" on public.medication_dispenses
  for select using (patient_id = auth.uid() or public.is_staff());

create policy "dispenses_write_staff" on public.medication_dispenses
  for all using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));

-- lab_orders & items ----------------------------------------------------
create policy "lab_orders_select_related" on public.lab_orders
  for select using (
    patient_id = auth.uid()
    or doctor_id = auth.uid()
    or public.current_role() in ('admin', 'lab_staff', 'receptionist')
  );

create policy "lab_orders_insert_related" on public.lab_orders
  for insert with check (
    doctor_id = auth.uid() or public.current_role() in ('admin', 'receptionist')
  );

create policy "lab_orders_update_related" on public.lab_orders
  for update using (
    doctor_id = auth.uid() or public.current_role() in ('admin', 'lab_staff', 'receptionist')
  );

create policy "lab_order_items_select_related" on public.lab_order_items
  for select using (
    exists (
      select 1 from public.lab_orders o
      where o.id = lab_order_items.lab_order_id
        and (
          o.patient_id = auth.uid()
          or o.doctor_id = auth.uid()
          or public.current_role() in ('admin', 'lab_staff', 'receptionist')
        )
    )
  );

create policy "lab_order_items_insert_related" on public.lab_order_items
  for insert with check (
    exists (
      select 1 from public.lab_orders o
      where o.id = lab_order_items.lab_order_id
        and (o.doctor_id = auth.uid() or public.current_role() in ('admin', 'receptionist'))
    )
  );

create policy "lab_order_items_update_lab_or_admin" on public.lab_order_items
  for update using (public.current_role() in ('admin', 'lab_staff'));

-- invoices, invoice_items, payments -----------------------------------------
create policy "invoices_select_related" on public.invoices
  for select using (
    patient_id = auth.uid() or public.current_role() in ('admin', 'receptionist')
  );

create policy "invoices_write_staff" on public.invoices
  for all using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));

create policy "invoice_items_select_related" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and (i.patient_id = auth.uid() or public.current_role() in ('admin', 'receptionist'))
    )
  );

create policy "invoice_items_write_staff" on public.invoice_items
  for all using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));

create policy "payments_select_related" on public.payments
  for select using (
    patient_id = auth.uid() or public.current_role() in ('admin', 'receptionist')
  );

create policy "payments_write_staff" on public.payments
  for all using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));

-- documents -------------------------------------------------------------
create policy "documents_select_related" on public.documents
  for select using (patient_id = auth.uid() or public.is_staff());

create policy "documents_write_staff_or_self" on public.documents
  for insert with check (patient_id = auth.uid() or public.is_staff());

create policy "documents_delete_staff" on public.documents
  for delete using (public.is_staff());

-- notifications -----------------------------------------------------------
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_insert_staff_or_self" on public.notifications
  for insert with check (user_id = auth.uid() or public.is_staff());

-- testimonials ------------------------------------------------------------
create policy "testimonials_select_published_or_admin" on public.testimonials
  for select using (is_published or public.is_admin());

create policy "testimonials_write_admin" on public.testimonials
  for all using (public.is_admin()) with check (public.is_admin());

-- contact_messages ------------------------------------------------------
create policy "contact_messages_insert_anyone" on public.contact_messages
  for insert with check (true);

create policy "contact_messages_select_admin" on public.contact_messages
  for select using (public.is_admin());

create policy "contact_messages_update_admin" on public.contact_messages
  for update using (public.is_admin());

-- ============================================================================
-- 11. Storage bucket for medical documents/reports
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-documents', 'medical-documents', false,
  10485760, -- 10 MB per file
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Path convention: <patient_id>/<filename>. The leading folder segment is
-- checked against auth.uid() for patients, while staff roles get full access.
create policy "medical_documents_read" on storage.objects
  for select using (
    bucket_id = 'medical-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

create policy "medical_documents_write" on storage.objects
  for insert with check (
    bucket_id = 'medical-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

create policy "medical_documents_update" on storage.objects
  for update using (
    bucket_id = 'medical-documents' and public.is_staff()
  );

create policy "medical_documents_delete" on storage.objects
  for delete using (
    bucket_id = 'medical-documents' and public.is_staff()
  );

-- ============================================================================
-- 12. Realtime
-- ============================================================================

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.lab_order_items;
