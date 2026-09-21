-- ============================================================================
-- Hardening pass, driven by `supabase db advisors` findings against the
-- initial schema:
--   1. function_search_path_mutable  — pin search_path on the two functions
--      that were missing it.
--   2. unindexed_foreign_keys        — add the 14 missing covering indexes.
--   3. auth_rls_initplan             — every policy calling auth.uid() (or a
--      helper that wraps it) directly gets re-evaluated per row; wrapping
--      the call as `(select auth.uid())` lets Postgres hoist it into an
--      InitPlan and evaluate it once per query instead.
--   4. multiple_permissive_policies  — 13 tables had a `for all` policy
--      alongside a separate `for select` policy, so Postgres had to
--      evaluate *both* permissive policies for every SELECT. Split each
--      `for all` into insert/update/delete so every command has exactly
--      one applicable policy.
--
-- `anon_security_definer_function_executable` / `authenticated_...` (for
-- current_role/is_staff/is_admin) and `unused_index` are not fixed here:
-- revoking EXECUTE on the former would break every RLS policy that calls
-- them (RLS runs as the querying role, which needs EXECUTE on functions
-- referenced in USING/WITH CHECK); they're safe to expose since they only
-- ever reveal the caller's own role. `unused_index` is expected on a fresh
-- database with no query history yet.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Function search_path
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_invoice_number()
returns text
language sql
stable
set search_path = public
as $$
  select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

-- ----------------------------------------------------------------------------
-- 2. Missing covering indexes on foreign keys
-- ----------------------------------------------------------------------------

create index if not exists idx_appointments_created_by on public.appointments (created_by);
create index if not exists idx_appointments_service on public.appointments (service_id);
create index if not exists idx_consultations_appointment on public.consultations (appointment_id);
create index if not exists idx_documents_uploaded_by on public.documents (uploaded_by);
create index if not exists idx_invoices_appointment on public.invoices (appointment_id);
create index if not exists idx_invoices_created_by on public.invoices (created_by);
create index if not exists idx_lab_order_items_test on public.lab_order_items (lab_test_id);
create index if not exists idx_lab_order_items_resulted_by on public.lab_order_items (resulted_by);
create index if not exists idx_lab_orders_consultation on public.lab_orders (consultation_id);
create index if not exists idx_lab_orders_ordered_by on public.lab_orders (ordered_by);
create index if not exists idx_dispenses_dispensed_by on public.medication_dispenses (dispensed_by);
create index if not exists idx_dispenses_medication on public.medication_dispenses (medication_id);
create index if not exists idx_dispenses_prescription_item on public.medication_dispenses (prescription_item_id);
create index if not exists idx_payments_recorded_by on public.payments (recorded_by);

-- ----------------------------------------------------------------------------
-- 3 & 4. Rebuild every policy: wrap auth.uid()/helper calls in `(select …)`,
-- and split each `for all` policy so it no longer overlaps a dedicated
-- `for select` policy on the same table.
-- ----------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
drop policy "profiles_select_self_or_staff" on public.profiles;
drop policy "profiles_update_self_or_admin" on public.profiles;

create policy "profiles_select_self_or_staff" on public.profiles
  for select using (id = (select auth.uid()) or public.is_staff());

create policy "profiles_update_self_or_admin" on public.profiles
  for update using (id = (select auth.uid()) or public.is_admin());

-- doctors ---------------------------------------------------------------
drop policy "doctors_insert_admin" on public.doctors;
drop policy "doctors_update_self_or_admin" on public.doctors;
drop policy "doctors_delete_admin" on public.doctors;

create policy "doctors_insert_admin" on public.doctors
  for insert with check (public.is_admin());

create policy "doctors_update_self_or_admin" on public.doctors
  for update using (id = (select auth.uid()) or public.is_admin());

create policy "doctors_delete_admin" on public.doctors
  for delete using (public.is_admin());

-- patients --------------------------------------------------------------
drop policy "patients_select_self_or_staff" on public.patients;
drop policy "patients_insert_self_or_staff" on public.patients;
drop policy "patients_update_self_or_staff" on public.patients;

create policy "patients_select_self_or_staff" on public.patients
  for select using (id = (select auth.uid()) or public.is_staff());

create policy "patients_insert_self_or_staff" on public.patients
  for insert with check (id = (select auth.uid()) or public.is_staff());

create policy "patients_update_self_or_staff" on public.patients
  for update using (id = (select auth.uid()) or public.is_staff());

-- services ----------------------------------------------------------------
drop policy "services_write_admin" on public.services;

create policy "services_insert_admin" on public.services
  for insert with check (public.is_admin());
create policy "services_update_admin" on public.services
  for update using (public.is_admin()) with check (public.is_admin());
create policy "services_delete_admin" on public.services
  for delete using (public.is_admin());

-- lab_tests -----------------------------------------------------------------
drop policy "lab_tests_write_admin_or_lab" on public.lab_tests;

create policy "lab_tests_insert_admin_or_lab" on public.lab_tests
  for insert with check (public.is_admin() or public.current_role() = 'lab_staff');
create policy "lab_tests_update_admin_or_lab" on public.lab_tests
  for update using (public.is_admin() or public.current_role() = 'lab_staff')
  with check (public.is_admin() or public.current_role() = 'lab_staff');
create policy "lab_tests_delete_admin_or_lab" on public.lab_tests
  for delete using (public.is_admin() or public.current_role() = 'lab_staff');

-- medications -----------------------------------------------------------------
drop policy "medications_write_admin" on public.medications;

create policy "medications_insert_admin" on public.medications
  for insert with check (public.is_admin());
create policy "medications_update_admin" on public.medications
  for update using (public.is_admin()) with check (public.is_admin());
create policy "medications_delete_admin" on public.medications
  for delete using (public.is_admin());

-- doctor_availability ---------------------------------------------------
drop policy "availability_write_owner_or_admin" on public.doctor_availability;

create policy "availability_insert_owner_or_admin" on public.doctor_availability
  for insert with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "availability_update_owner_or_admin" on public.doctor_availability
  for update using (doctor_id = (select auth.uid()) or public.is_admin())
  with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "availability_delete_owner_or_admin" on public.doctor_availability
  for delete using (doctor_id = (select auth.uid()) or public.is_admin());

drop policy "time_off_write_owner_or_admin" on public.doctor_time_off;

create policy "time_off_insert_owner_or_admin" on public.doctor_time_off
  for insert with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "time_off_update_owner_or_admin" on public.doctor_time_off
  for update using (doctor_id = (select auth.uid()) or public.is_admin())
  with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "time_off_delete_owner_or_admin" on public.doctor_time_off
  for delete using (doctor_id = (select auth.uid()) or public.is_admin());

-- appointments ------------------------------------------------------------
drop policy "appointments_select_related" on public.appointments;
drop policy "appointments_insert_related" on public.appointments;
drop policy "appointments_update_related" on public.appointments;
drop policy "appointments_delete_staff" on public.appointments;

create policy "appointments_select_related" on public.appointments
  for select using (
    patient_id = (select auth.uid())
    or doctor_id = (select auth.uid())
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_insert_related" on public.appointments
  for insert with check (
    patient_id = (select auth.uid())
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_update_related" on public.appointments
  for update using (
    patient_id = (select auth.uid())
    or doctor_id = (select auth.uid())
    or public.current_role() in ('admin', 'receptionist')
  );

create policy "appointments_delete_staff" on public.appointments
  for delete using (public.current_role() in ('admin', 'receptionist'));

-- consultations -------------------------------------------------------------
drop policy "consultations_select_related" on public.consultations;
drop policy "consultations_write_doctor_or_admin" on public.consultations;

create policy "consultations_select_related" on public.consultations
  for select using (
    patient_id = (select auth.uid()) or doctor_id = (select auth.uid()) or public.is_admin()
  );

create policy "consultations_insert_doctor_or_admin" on public.consultations
  for insert with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "consultations_update_doctor_or_admin" on public.consultations
  for update using (doctor_id = (select auth.uid()) or public.is_admin())
  with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "consultations_delete_doctor_or_admin" on public.consultations
  for delete using (doctor_id = (select auth.uid()) or public.is_admin());

-- prescriptions & items -----------------------------------------------------
drop policy "prescriptions_select_related" on public.prescriptions;
drop policy "prescriptions_write_doctor_or_admin" on public.prescriptions;

create policy "prescriptions_select_related" on public.prescriptions
  for select using (
    patient_id = (select auth.uid()) or doctor_id = (select auth.uid()) or public.is_admin()
  );

create policy "prescriptions_insert_doctor_or_admin" on public.prescriptions
  for insert with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "prescriptions_update_doctor_or_admin" on public.prescriptions
  for update using (doctor_id = (select auth.uid()) or public.is_admin())
  with check (doctor_id = (select auth.uid()) or public.is_admin());
create policy "prescriptions_delete_doctor_or_admin" on public.prescriptions
  for delete using (doctor_id = (select auth.uid()) or public.is_admin());

drop policy "prescription_items_select_related" on public.prescription_items;
drop policy "prescription_items_write_related" on public.prescription_items;

create policy "prescription_items_select_related" on public.prescription_items
  for select using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.patient_id = (select auth.uid()) or p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  );

create policy "prescription_items_insert_related" on public.prescription_items
  for insert with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  );
create policy "prescription_items_update_related" on public.prescription_items
  for update using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  );
create policy "prescription_items_delete_related" on public.prescription_items
  for delete using (
    exists (
      select 1 from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and (p.doctor_id = (select auth.uid()) or public.is_admin())
    )
  );

-- medication_dispenses --------------------------------------------------
drop policy "dispenses_select_related" on public.medication_dispenses;
drop policy "dispenses_write_staff" on public.medication_dispenses;

create policy "dispenses_select_related" on public.medication_dispenses
  for select using (patient_id = (select auth.uid()) or public.is_staff());

create policy "dispenses_insert_staff" on public.medication_dispenses
  for insert with check (public.current_role() in ('admin', 'receptionist'));
create policy "dispenses_update_staff" on public.medication_dispenses
  for update using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));
create policy "dispenses_delete_staff" on public.medication_dispenses
  for delete using (public.current_role() in ('admin', 'receptionist'));

-- lab_orders & items ----------------------------------------------------
drop policy "lab_orders_select_related" on public.lab_orders;
drop policy "lab_orders_insert_related" on public.lab_orders;
drop policy "lab_orders_update_related" on public.lab_orders;

create policy "lab_orders_select_related" on public.lab_orders
  for select using (
    patient_id = (select auth.uid())
    or doctor_id = (select auth.uid())
    or public.current_role() in ('admin', 'lab_staff', 'receptionist')
  );

create policy "lab_orders_insert_related" on public.lab_orders
  for insert with check (
    doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist')
  );

create policy "lab_orders_update_related" on public.lab_orders
  for update using (
    doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'lab_staff', 'receptionist')
  );

drop policy "lab_order_items_select_related" on public.lab_order_items;
drop policy "lab_order_items_insert_related" on public.lab_order_items;
drop policy "lab_order_items_update_lab_or_admin" on public.lab_order_items;

create policy "lab_order_items_select_related" on public.lab_order_items
  for select using (
    exists (
      select 1 from public.lab_orders o
      where o.id = lab_order_items.lab_order_id
        and (
          o.patient_id = (select auth.uid())
          or o.doctor_id = (select auth.uid())
          or public.current_role() in ('admin', 'lab_staff', 'receptionist')
        )
    )
  );

create policy "lab_order_items_insert_related" on public.lab_order_items
  for insert with check (
    exists (
      select 1 from public.lab_orders o
      where o.id = lab_order_items.lab_order_id
        and (o.doctor_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist'))
    )
  );

create policy "lab_order_items_update_lab_or_admin" on public.lab_order_items
  for update using (public.current_role() in ('admin', 'lab_staff'));

-- invoices, invoice_items, payments -----------------------------------------
drop policy "invoices_select_related" on public.invoices;
drop policy "invoices_write_staff" on public.invoices;

create policy "invoices_select_related" on public.invoices
  for select using (
    patient_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist')
  );

create policy "invoices_insert_staff" on public.invoices
  for insert with check (public.current_role() in ('admin', 'receptionist'));
create policy "invoices_update_staff" on public.invoices
  for update using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));
create policy "invoices_delete_staff" on public.invoices
  for delete using (public.current_role() in ('admin', 'receptionist'));

drop policy "invoice_items_select_related" on public.invoice_items;
drop policy "invoice_items_write_staff" on public.invoice_items;

create policy "invoice_items_select_related" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id
        and (i.patient_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist'))
    )
  );

create policy "invoice_items_insert_staff" on public.invoice_items
  for insert with check (public.current_role() in ('admin', 'receptionist'));
create policy "invoice_items_update_staff" on public.invoice_items
  for update using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));
create policy "invoice_items_delete_staff" on public.invoice_items
  for delete using (public.current_role() in ('admin', 'receptionist'));

drop policy "payments_select_related" on public.payments;
drop policy "payments_write_staff" on public.payments;

create policy "payments_select_related" on public.payments
  for select using (
    patient_id = (select auth.uid()) or public.current_role() in ('admin', 'receptionist')
  );

create policy "payments_insert_staff" on public.payments
  for insert with check (public.current_role() in ('admin', 'receptionist'));
create policy "payments_update_staff" on public.payments
  for update using (public.current_role() in ('admin', 'receptionist'))
  with check (public.current_role() in ('admin', 'receptionist'));
create policy "payments_delete_staff" on public.payments
  for delete using (public.current_role() in ('admin', 'receptionist'));

-- documents -------------------------------------------------------------
drop policy "documents_select_related" on public.documents;
drop policy "documents_write_staff_or_self" on public.documents;
drop policy "documents_delete_staff" on public.documents;

create policy "documents_select_related" on public.documents
  for select using (patient_id = (select auth.uid()) or public.is_staff());

create policy "documents_write_staff_or_self" on public.documents
  for insert with check (patient_id = (select auth.uid()) or public.is_staff());

create policy "documents_delete_staff" on public.documents
  for delete using (public.is_staff());

-- notifications -----------------------------------------------------------
drop policy "notifications_select_own" on public.notifications;
drop policy "notifications_update_own" on public.notifications;
drop policy "notifications_insert_staff_or_self" on public.notifications;

create policy "notifications_select_own" on public.notifications
  for select using (user_id = (select auth.uid()));

create policy "notifications_update_own" on public.notifications
  for update using (user_id = (select auth.uid()));

create policy "notifications_insert_staff_or_self" on public.notifications
  for insert with check (user_id = (select auth.uid()) or public.is_staff());

-- testimonials ------------------------------------------------------------
drop policy "testimonials_write_admin" on public.testimonials;

create policy "testimonials_insert_admin" on public.testimonials
  for insert with check (public.is_admin());
create policy "testimonials_update_admin" on public.testimonials
  for update using (public.is_admin()) with check (public.is_admin());
create policy "testimonials_delete_admin" on public.testimonials
  for delete using (public.is_admin());

-- contact_messages ------------------------------------------------------
drop policy "contact_messages_select_admin" on public.contact_messages;
drop policy "contact_messages_update_admin" on public.contact_messages;

create policy "contact_messages_select_admin" on public.contact_messages
  for select using (public.is_admin());

create policy "contact_messages_update_admin" on public.contact_messages
  for update using (public.is_admin());

-- storage: medical-documents ------------------------------------------------
drop policy "medical_documents_read" on storage.objects;
drop policy "medical_documents_write" on storage.objects;
drop policy "medical_documents_update" on storage.objects;
drop policy "medical_documents_delete" on storage.objects;

create policy "medical_documents_read" on storage.objects
  for select using (
    bucket_id = 'medical-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_staff()
    )
  );

create policy "medical_documents_write" on storage.objects
  for insert with check (
    bucket_id = 'medical-documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
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
