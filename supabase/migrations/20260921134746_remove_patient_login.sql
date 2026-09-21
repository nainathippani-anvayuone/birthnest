-- ============================================================================
-- Product direction change: this is a staff-only hospital management portal.
-- Patients never log in — they are plain records that admin/doctor/
-- receptionist/lab_staff create and manage. This migration:
--   1. Decouples `patients` from auth.users/profiles entirely (drops the FK,
--      gives it its own identity: full_name/email/phone directly on the row).
--   2. Retires 'patient' as a *default* for new profiles (the enum value
--      itself is left in place — Postgres enum values can't be cheaply
--      dropped, and an unused value is harmless; application code simply
--      never assigns it again).
--   3. Rebuilds every RLS policy that referenced `patient_id = auth.uid()`
--      (a patient can no longer authenticate, so that clause is now
--      meaningless) down to staff-only access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Decouple `patients` from auth
-- ----------------------------------------------------------------------------

alter table public.patients drop constraint patients_id_fkey;
alter table public.patients alter column id set default gen_random_uuid();

alter table public.patients add column full_name text not null default '';
alter table public.patients add column email text;
alter table public.patients add column phone text;

alter table public.patients alter column full_name drop default;

-- ----------------------------------------------------------------------------
-- 2. New accounts default to the lowest-privilege staff role. (The 'patient'
-- enum value stays defined but unused — see header comment.)
-- ----------------------------------------------------------------------------

alter table public.profiles alter column role set default 'receptionist';

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
    'receptionist'
  );
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Rebuild RLS: drop every `patient_id = auth.uid()` / self-access clause.
-- ----------------------------------------------------------------------------

-- patients ----------------------------------------------------------------
drop policy "patients_select_self_or_staff" on public.patients;
drop policy "patients_insert_self_or_staff" on public.patients;
drop policy "patients_update_self_or_staff" on public.patients;

create policy "patients_select_staff" on public.patients
  for select using (public.is_staff());
create policy "patients_insert_staff" on public.patients
  for insert with check (public.is_staff());
create policy "patients_update_staff" on public.patients
  for update using (public.is_staff()) with check (public.is_staff());
create policy "patients_delete_admin" on public.patients
  for delete using (public.is_admin());

-- appointments ------------------------------------------------------------
drop policy "appointments_select_related" on public.appointments;
drop policy "appointments_insert_related" on public.appointments;
drop policy "appointments_update_related" on public.appointments;

create policy "appointments_select_related" on public.appointments
  for select using (
    doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_insert_staff" on public.appointments
  for insert with check (public.current_role() in ('admin', 'receptionist'));

create policy "appointments_update_related" on public.appointments
  for update using (
    doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist')
  );

-- consultations -------------------------------------------------------------
drop policy "consultations_select_related" on public.consultations;

create policy "consultations_select_related" on public.consultations
  for select using (doctor_id = (select auth.uid()) or public.is_admin());

-- prescriptions -------------------------------------------------------------
drop policy "prescriptions_select_related" on public.prescriptions;

create policy "prescriptions_select_related" on public.prescriptions
  for select using (doctor_id = (select auth.uid()) or public.is_admin());

drop policy "prescription_items_select_related" on public.prescription_items;

create policy "prescription_items_select_related" on public.prescription_items
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  );

-- medication_dispenses --------------------------------------------------
drop policy "dispenses_select_related" on public.medication_dispenses;

create policy "dispenses_select_related" on public.medication_dispenses
  for select using (public.is_staff());

-- lab_orders & items ----------------------------------------------------
drop policy "lab_orders_select_related" on public.lab_orders;

create policy "lab_orders_select_related" on public.lab_orders
  for select using (
    doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'lab_staff', 'receptionist')
  );

drop policy "lab_order_items_select_related" on public.lab_order_items;

create policy "lab_order_items_select_related" on public.lab_order_items
  for select using (
    exists (
      select 1 from public.lab_orders o
      where o.id = lab_order_items.lab_order_id
        and (
          o.doctor_id = (select auth.uid())
          or public.current_role() in ('admin', 'lab_staff', 'receptionist')
        )
    )
  );

-- invoices, invoice_items, payments -----------------------------------------
drop policy "invoices_select_related" on public.invoices;

create policy "invoices_select_related" on public.invoices
  for select using (public.current_role() in ('admin', 'receptionist'));

drop policy "invoice_items_select_related" on public.invoice_items;

create policy "invoice_items_select_related" on public.invoice_items
  for select using (public.current_role() in ('admin', 'receptionist'));

drop policy "payments_select_related" on public.payments;

create policy "payments_select_related" on public.payments
  for select using (public.current_role() in ('admin', 'receptionist'));

-- documents -------------------------------------------------------------
drop policy "documents_select_related" on public.documents;
drop policy "documents_write_staff_or_self" on public.documents;

create policy "documents_select_related" on public.documents
  for select using (public.is_staff());
create policy "documents_write_staff" on public.documents
  for insert with check (public.is_staff());

-- storage: medical-documents — patient-foldername convention is gone along
-- with patient auth; access is staff-only now.
drop policy "medical_documents_read" on storage.objects;
drop policy "medical_documents_write" on storage.objects;

create policy "medical_documents_read" on storage.objects
  for select using (bucket_id = 'medical-documents' and public.is_staff());
create policy "medical_documents_write" on storage.objects
  for insert with check (bucket_id = 'medical-documents' and public.is_staff());
