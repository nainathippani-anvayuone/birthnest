-- ============================================================================
-- Public self-service appointment booking (no login required).
--
-- Patients still never have accounts — but they can now book directly from
-- the public site. That flow is: browser calls the public
-- `get_doctor_available_slots` RPC below to render a red/green slot grid,
-- then calls the `book-appointment` Edge Function (service-role, validates
-- the slot server-side to prevent double-booking, finds-or-creates the
-- patient record by email, inserts the appointment, emails a confirmation).
-- Anonymous visitors never get direct table access to `appointments` or
-- `patients` — only this narrow, purpose-built surface.
-- ============================================================================

alter table public.appointments add column is_first_visit boolean not null default false;

create or replace function public.get_doctor_available_slots(p_doctor_id uuid, p_date date)
returns table(slot_start time, slot_end time, is_available boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_day_of_week int := extract(dow from p_date);
  v_has_time_off boolean;
begin
  select exists(
    select 1 from public.doctor_time_off
    where doctor_id = p_doctor_id and off_date = p_date
  ) into v_has_time_off;

  if v_has_time_off then
    return; -- no availability windows returned = the whole day is blocked
  end if;

  return query
  with windows as (
    select da.start_time as w_start, da.end_time as w_end, da.slot_duration_minutes as dur
    from public.doctor_availability da
    where da.doctor_id = p_doctor_id
      and da.day_of_week = v_day_of_week
      and da.is_active = true
  ),
  slots as (
    select
      (w.w_start + (n || ' minutes')::interval)::time as s_start,
      (w.w_start + ((n + w.dur) || ' minutes')::interval)::time as s_end
    from windows w,
      lateral generate_series(0, (extract(epoch from (w.w_end - w.w_start)) / 60)::int - w.dur, w.dur) as n
  ),
  busy as (
    select a.start_time as b_start, a.end_time as b_end
    from public.appointments a
    where a.doctor_id = p_doctor_id
      and a.appointment_date = p_date
      and a.status <> 'cancelled'
  )
  select
    s.s_start,
    s.s_end,
    not exists (
      select 1 from busy b where s.s_start < b.b_end and b.b_start < s.s_end
    ) and (p_date > current_date or s.s_start > current_time)
  from slots s
  order by s.s_start;
end;
$$;

grant execute on function public.get_doctor_available_slots(uuid, date) to anon, authenticated;
