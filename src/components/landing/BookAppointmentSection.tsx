import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { formatTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { Doctor } from '@/types';

interface Slot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const maxDateISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
};

export function BookAppointmentSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', reason: '', isFirstVisit: '' as '' | 'yes' | 'no' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ emailSent: boolean } | null>(null);

  useEffect(() => {
    supabase
      .from('doctors')
      .select('*, profile:profiles(*)')
      .eq('is_active', true)
      .then(({ data }) => {
        const list = (data as Doctor[]) ?? [];
        setDoctors(list);
        if (list.length === 1) setDoctorId(list[0].id);
      });
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    supabase
      .rpc('get_doctor_available_slots', { p_doctor_id: doctorId, p_date: date })
      .then(({ data }) => {
        setSlots((data as Slot[]) ?? []);
        setSlotsLoading(false);
      });
  }, [doctorId, date]);

  const handleSubmit = async () => {
    if (!doctorId || !date || !selectedSlot) {
      setError('Please choose a date and an available time slot.');
      return;
    }
    if (!form.fullName || !form.email || !form.isFirstVisit) {
      setError('Please fill in your name, email, and let us know if this is your first visit.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke('book-appointment', {
      body: {
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        reason: form.reason || undefined,
        is_first_visit: form.isFirstVisit === 'yes',
        doctor_id: doctorId,
        appointment_date: date,
        start_time: selectedSlot.slot_start,
        end_time: selectedSlot.slot_end,
      },
    });

    setSubmitting(false);
    if (fnError) {
      setError('Something went wrong booking that slot. Please call us at +91 98808 55845 instead.');
      return;
    }
    const payload = data as { success?: boolean; error?: string; emailSent?: boolean } | null;
    if (!payload?.success) {
      setError(payload?.error ?? 'That slot may have just been taken — please pick another.');
      // Refresh slots since the one they picked might now be gone.
      supabase.rpc('get_doctor_available_slots', { p_doctor_id: doctorId, p_date: date }).then(({ data: fresh }) => {
        setSlots((fresh as Slot[]) ?? []);
      });
      setSelectedSlot(null);
      return;
    }
    setResult({ emailSent: !!payload.emailSent });
  };

  if (result) {
    return (
      <section id="book-appointment" className="section-y bg-brand-50/60">
        <div className="container-app">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h3 className="font-serif text-xl font-semibold text-brand-900">Appointment Confirmed!</h3>
            <p className="text-sm text-brand-600">
              {result.emailSent
                ? `A confirmation has been sent to ${form.email}. We look forward to seeing you.`
                : "You're all set — we look forward to seeing you. (We couldn't send a confirmation email, so please save your appointment details.)"}
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>Book Another Appointment</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="book-appointment" className="section-y bg-brand-50/60">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
            <CalendarCheck className="h-4 w-4" /> Book Online
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Book Your Appointment</h2>
          <p className="mt-4 text-brand-700/90">
            Pick an open time below and we'll confirm it instantly — no phone call needed.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {doctors.length > 1 && (
              <Select label="Doctor" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>Dr. {d.profile?.full_name} — {d.specialization}</option>
                ))}
              </Select>
            )}
            <Input
              label="Preferred Date"
              type="date"
              required
              min={todayISO()}
              max={maxDateISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={doctors.length > 1 ? '' : 'sm:col-span-2'}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-brand-900">Available Time Slots</p>
            {!doctorId ? (
              <p className="text-sm text-brand-400">Loading doctor availability…</p>
            ) : !date ? (
              <p className="text-sm text-brand-400">Choose a date to see open slots.</p>
            ) : slotsLoading ? (
              <p className="flex items-center gap-2 text-sm text-brand-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-brand-400">The clinic is closed on this date. Please choose another day.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      key={slot.slot_start}
                      type="button"
                      disabled={!slot.is_available}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors sm:text-sm',
                        !slot.is_available && 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-300 line-through',
                        slot.is_available && selectedSlot?.slot_start === slot.slot_start && 'border-emerald-600 bg-emerald-600 text-white',
                        slot.is_available && selectedSlot?.slot_start !== slot.slot_start && 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500',
                      )}
                    >
                      {formatTime(slot.slot_start)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-brand-500">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-300" /> Booked</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-4 border-t border-brand-100 pt-6 sm:grid-cols-2">
            <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-brand-900">Is this your first visit? <span className="text-rose-600">*</span></p>
              <div className="flex gap-2">
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isFirstVisit: v }))}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize',
                      form.isFirstVisit === v ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 text-brand-700 hover:border-brand-400',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Textarea
            label="What's the reason for your visit? (optional)"
            placeholder="e.g. Antenatal checkup, irregular periods, fertility consultation…"
            className="mt-4"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />

          {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

          <Button className="mt-6 w-full" size="lg" loading={submitting} onClick={handleSubmit}>
            Confirm Appointment
          </Button>
        </div>
      </div>
    </section>
  );
}
