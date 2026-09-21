import { supabase } from '@/lib/supabase';

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots(
  doctorId: string,
  dateISO: string,
  excludeAppointmentId?: string,
): Promise<TimeSlot[]> {
  const dayOfWeek = new Date(`${dateISO}T00:00:00`).getDay();

  const [{ data: availability }, { data: timeOff }, { data: booked }] = await Promise.all([
    supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true),
    supabase.from('doctor_time_off').select('*').eq('doctor_id', doctorId).eq('off_date', dateISO),
    supabase
      .from('appointments')
      .select('id, start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', dateISO)
      .neq('status', 'cancelled'),
  ]);

  if ((timeOff?.length ?? 0) > 0) return [];

  const busy = (booked ?? [])
    .filter((b) => b.id !== excludeAppointmentId)
    .map((b) => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }));

  const now = new Date();
  const isToday = dateISO === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];
  for (const window of availability ?? []) {
    const windowStart = timeToMinutes(window.start_time);
    const windowEnd = timeToMinutes(window.end_time);
    const duration = window.slot_duration_minutes;

    for (let start = windowStart; start + duration <= windowEnd; start += duration) {
      const end = start + duration;
      if (isToday && start <= nowMinutes) continue;
      if (busy.some((b) => intervalsOverlap(start, end, b.start, b.end))) continue;
      slots.push({ start: minutesToTime(start), end: minutesToTime(end) });
    }
  }

  return slots;
}
