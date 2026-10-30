import { useEffect, useMemo, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { formatDate, formatTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { CLINIC_PHONES } from '@/utils/links';
import { EMAIL_RE, isValidPhone } from '@/utils/validation';
import type { Doctor } from '@/types';

interface Slot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

// The clinic runs on India time, whatever the visitor's own timezone is.
// (The database's slot function compares against UTC, so slots earlier today
// are hidden here in the browser instead.)
function clinicNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}
const todayISO = () => clinicNow().date;
const maxDateISO = () => {
  const d = new Date(`${todayISO()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 60);
  return d.toISOString().slice(0, 10);
};

const CALL_US = `please call us at ${CLINIC_PHONES.map((p) => p.display).join(' or ')}`;
const BOOKING_FAILED_MESSAGE = `Something went wrong booking that slot. Please try again, or ${CALL_US}.`;

export function BookAppointmentSection() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsStatus, setDoctorsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', reason: '', isFirstVisit: '' as '' | 'yes' | 'no' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ emailSent: boolean; date: string; time: string } | null>(null);

  useEffect(() => {
    supabase
      .from('doctors')
      .select('*, profile:profiles(*)')
      .eq('is_active', true)
      .then(({ data, error: doctorsError }) => {
        if (doctorsError) {
          setDoctorsStatus('error');
          return;
        }
        const list = (data as Doctor[]) ?? [];
        setDoctors(list);
        setDoctorsStatus('ready');
        if (list.length === 1) setDoctorId(list[0].id);
      });
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    setSlotsError(false);
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    supabase
      .rpc('get_doctor_available_slots', { p_doctor_id: doctorId, p_date: date })
      .then(({ data, error: slotsFetchError }) => {
        setSlotsError(!!slotsFetchError);
        setSlots((data as Slot[]) ?? []);
        setSlotsLoading(false);
      });
  }, [doctorId, date]);

  // Slots whose start time has already passed today (clinic time) are dropped.
  const visibleSlots = useMemo(() => {
    const now = clinicNow();
    return date === now.date ? slots.filter((s) => s.slot_start > now.time) : slots;
  }, [slots, date]);
  const anyAvailable = visibleSlots.some((s) => s.is_available);

  const refreshSlots = () => {
    supabase.rpc('get_doctor_available_slots', { p_doctor_id: doctorId, p_date: date }).then(({ data: fresh }) => {
      setSlots((fresh as Slot[]) ?? []);
    });
    setSelectedSlot(null);
  };

  const handleSubmit = async () => {
    if (!doctorId || !date || !selectedSlot) {
      setError('Please choose a date and an available time slot.');
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.isFirstVisit) {
      setError('Please fill in your name, email, and let us know if this is your first visit.');
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setError('Please enter a valid phone number, or leave it blank.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke('book-appointment', {
      body: {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        reason: form.reason.trim() || undefined,
        is_first_visit: form.isFirstVisit === 'yes',
        doctor_id: doctorId,
        appointment_date: date,
        start_time: selectedSlot.slot_start,
        end_time: selectedSlot.slot_end,
      },
    });

    setSubmitting(false);
    if (fnError) {
      // Non-2xx replies from the function (e.g. 409 "slot no longer available",
      // 400 validation) arrive here; surface the function's own message.
      if (fnError instanceof FunctionsHttpError) {
        const status = fnError.context.status;
        const body = (await fnError.context.json().catch(() => null)) as { error?: string } | null;
        if (status === 409) refreshSlots();
        setError(
          status === 409
            ? body?.error ?? 'That slot may have just been taken — please pick another.'
            : status === 400 && body?.error
              ? body.error
              : BOOKING_FAILED_MESSAGE,
        );
        return;
      }
      setError(BOOKING_FAILED_MESSAGE);
      return;
    }
    const payload = data as { success?: boolean; error?: string; emailSent?: boolean } | null;
    if (!payload?.success) {
      setError(payload?.error ?? 'That slot may have just been taken — please pick another.');
      // Refresh slots since the one they picked might now be gone.
      refreshSlots();
      return;
    }
    setResult({ emailSent: !!payload.emailSent, date, time: selectedSlot.slot_start });
  };

  if (result) {
    return (
      <section id="book-appointment" className="section-y border-y border-line bg-paper">
        <div className="container-app">
          <div className="card-ref !bg-cream mx-auto flex max-w-md flex-col items-center gap-3 text-center desk:p-10">
            <CheckCircle2 className="h-12 w-12 text-clay" />
            <h3 className="font-serif text-[1.6rem] font-medium">Appointment confirmed</h3>
            <p className="rounded-[18px] bg-sand px-5 py-3 font-semibold">
              {formatDate(result.date)} · {formatTime(result.time)}
            </p>
            <p className="text-sm text-muted">
              {result.emailSent
                ? `A confirmation has been sent to ${form.email}. We look forward to seeing you.`
                : "You're all set — we look forward to seeing you. (We couldn't send a confirmation email, so please save your appointment details.)"}
            </p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Book Another Appointment
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const doctorLabel = (d: Doctor) => (d.profile?.full_name ? `Dr. ${d.profile.full_name} — ${d.specialization}` : d.specialization);

  return (
    <section id="book-appointment" className="section-y border-y border-line bg-paper">
      <div className="container-app">
        <div className="mx-auto max-w-[850px] text-center">
          <div className="eyebrow">Book online</div>
          <h2 className="section-title">Book your appointment</h2>
          <p className="section-lead">Pick an open time below and we'll confirm it instantly — no phone call needed.</p>
        </div>

        <div className="card-ref !bg-cream mx-auto mt-10 max-w-3xl desk:p-[42px]">
          <div className="grid gap-4 xs:grid-cols-2">
            {doctors.length > 1 && (
              <Select label="Doctor" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{doctorLabel(d)}</option>
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
              className={doctors.length > 1 ? '' : 'xs:col-span-2'}
            />
          </div>

          <div className="mt-6">
            <p className="mb-2.5 text-sm font-semibold">Available Time Slots</p>
            {doctorsStatus === 'loading' ? (
              <p className="text-sm text-clay">Loading doctor availability…</p>
            ) : doctorsStatus === 'error' || doctors.length === 0 ? (
              <p className="text-sm text-rose-700">
                Online booking is unavailable right now. Please try again later, or {CALL_US}.
              </p>
            ) : !doctorId ? (
              <p className="text-sm text-clay">Choose a doctor to see open slots.</p>
            ) : !date ? (
              <p className="text-sm text-clay">Choose a date to see open slots.</p>
            ) : slotsLoading ? (
              <p className="flex items-center gap-2 text-sm text-clay"><Loader2 className="h-4 w-4 animate-spin" /> Loading slots…</p>
            ) : slotsError ? (
              <p className="text-sm text-rose-700">We couldn't load time slots for this date. Please try again.</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-clay">The clinic is closed on this date. Please choose another day.</p>
            ) : visibleSlots.length === 0 ? (
              <p className="text-sm text-clay">There are no more appointment times today. Please choose another day.</p>
            ) : (
              <>
                {!anyAvailable && (
                  <p className="mb-3 text-sm text-rose-700">All appointment times on this date are booked. Please choose another day.</p>
                )}
                <div className="grid grid-cols-3 gap-2 xs:grid-cols-5">
                  {visibleSlots.map((slot) => {
                    const selected = slot.is_available && selectedSlot?.slot_start === slot.slot_start;
                    return (
                      <button
                        key={slot.slot_start}
                        type="button"
                        disabled={!slot.is_available}
                        aria-pressed={selected}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'rounded-full border px-2 py-2 text-xs font-[650] transition-colors xs:text-sm',
                          !slot.is_available && 'cursor-not-allowed border-transparent bg-sand/70 text-peach line-through',
                          selected && 'border-ink bg-ink text-white',
                          slot.is_available && !selected && 'border-line bg-paper text-ink hover:border-clay',
                        )}
                      >
                        {formatTime(slot.slot_start)}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-clay">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-clay bg-paper" /> Available</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-peach" /> Booked</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-7 grid gap-4 border-t border-line pt-7 xs:grid-cols-2">
            <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <div>
              <p className="mb-1.5 text-sm font-semibold">Is this your first visit? <span className="text-rose-600">*</span></p>
              <div className="flex gap-2">
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={form.isFirstVisit === v}
                    onClick={() => setForm((f) => ({ ...f, isFirstVisit: v }))}
                    className={cn(
                      'flex-1 rounded-full border px-3 py-2 text-sm font-[650] capitalize transition-colors',
                      form.isFirstVisit === v ? 'border-ink bg-ink text-white' : 'border-line bg-paper text-ink hover:border-clay',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Textarea
              label="What's the reason for your visit? (optional)"
              placeholder="e.g. Antenatal checkup, irregular periods, fertility consultation…"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>

          {error && <p role="alert" className="mt-4 text-sm font-medium text-rose-700">{error}</p>}

          <Button className="mt-6 w-full" loading={submitting} onClick={handleSubmit}>
            Confirm Appointment
          </Button>
        </div>
      </div>
    </section>
  );
}
