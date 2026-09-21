import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarClock, Ban } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableSlots, type TimeSlot } from '@/utils/scheduling';
import { PatientPicker } from '@/components/PatientPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Field';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatTime } from '@/utils/formatters';
import type { Appointment, AppointmentStatus, Doctor, Service } from '@/types';

const STATUS_OPTIONS: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

export function AppointmentsPage() {
  const { profile } = useAuth();
  const isStaff = profile?.role === 'admin' || profile?.role === 'receptionist';
  const isDoctor = profile?.role === 'doctor';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*)), service:services(*)')
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });
    setAppointments((data as Appointment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => appointments.filter((a) => statusFilter === 'all' || a.status === statusFilter),
    [appointments, statusFilter],
  );

  const updateStatus = async (appt: Appointment, status: AppointmentStatus) => {
    await supabase.from('appointments').update({ status }).eq('id', appt.id);
    load();
  };

  const columns: Column<Appointment>[] = [
    {
      header: 'Date & Time',
      accessor: (a) => (
        <div>
          <p className="font-medium text-brand-900">{formatDate(a.appointment_date)}</p>
          <p className="text-xs text-brand-400">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: (a) => (
        <div>
          <p>{a.patient?.full_name ?? '—'}</p>
          {a.is_first_visit && <Badge className="mt-0.5 bg-sky-100 text-sky-700">New patient</Badge>}
        </div>
      ),
    },
    ...(!isDoctor ? [{ header: 'Doctor', accessor: (a: Appointment) => `Dr. ${a.doctor?.profile?.full_name ?? ''}` } as Column<Appointment>] : []),
    {
      header: 'Service / Reason',
      accessor: (a) => (
        <div>
          <p>{a.service?.name ?? 'Consultation'}</p>
          {a.reason && <p className="text-xs text-brand-400">{a.reason}</p>}
        </div>
      ),
    },
    { header: 'Status', accessor: (a) => <StatusBadge status={a.status} /> },
    {
      header: 'Actions',
      accessor: (a) => (
        <div className="flex items-center gap-3">
          {(isStaff || isDoctor) && a.status !== 'cancelled' && a.status !== 'completed' && (
            <Select
              className="!w-auto py-1 text-xs"
              value={a.status}
              onChange={(e) => updateStatus(a, e.target.value as AppointmentStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Select>
          )}
          {['scheduled', 'confirmed'].includes(a.status) && (
            <>
              <button onClick={() => setRescheduleTarget(a)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                <CalendarClock className="h-3.5 w-3.5" /> Reschedule
              </button>
              <button onClick={() => updateStatus(a, 'cancelled')} className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline">
                <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book, reschedule and manage consultations."
        actions={
          <Button onClick={() => setBookOpen(true)}>
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        }
      />

      <div className="mb-4">
        <Select className="max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | AppointmentStatus)}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={filtered} keyField={(a) => a.id} loading={loading} emptyTitle="No appointments found" />

      {bookOpen && <BookAppointmentModal onClose={() => setBookOpen(false)} onBooked={() => { setBookOpen(false); load(); }} />}
      {rescheduleTarget && (
        <RescheduleModal appointment={rescheduleTarget} onClose={() => setRescheduleTarget(null)} onSaved={() => { setRescheduleTarget(null); load(); }} />
      )}
    </div>
  );
}

function BookAppointmentModal({ onClose, onBooked }: { onClose: () => void; onBooked: () => void }) {
  const { profile } = useAuth();
  const isDoctorRole = profile?.role === 'doctor';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(isDoctorRole ? profile!.id : '');
  const [serviceId, setServiceId] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('doctors').select('*, profile:profiles(*)').eq('is_active', true).then(({ data }) => setDoctors((data as Doctor[]) ?? []));
    supabase.from('services').select('*').eq('is_active', true).then(({ data }) => setServices((data as Service[]) ?? []));
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    getAvailableSlots(doctorId, date).then((s) => {
      setSlots(s);
      setSlotsLoading(false);
    });
  }, [doctorId, date]);

  const handleSubmit = async () => {
    if (!selectedPatientId || !doctorId || !date || !selectedSlot) {
      setError('Please complete all required fields and pick a time slot.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('appointments').insert({
      patient_id: selectedPatientId,
      doctor_id: doctorId,
      service_id: serviceId || null,
      appointment_date: date,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      reason: reason || null,
      created_by: profile?.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onBooked();
  };

  return (
    <Modal open onClose={onClose} title="Book Appointment" size="lg">
      <div className="space-y-4">
        <PatientPicker value={selectedPatientId} onChange={setSelectedPatientId} />

        <div className="grid gap-4 sm:grid-cols-2">
          {!isDoctorRole && (
            <Select label="Doctor" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.profile?.full_name} — {d.specialization}</option>
              ))}
            </Select>
          )}
          <Select label="Service (optional)" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">General consultation</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <input
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-brand-900">Available Slots</p>
          {slotsLoading ? (
            <p className="text-sm text-brand-400">Loading availability…</p>
          ) : !doctorId || !date ? (
            <p className="text-sm text-brand-400">Choose a doctor and date to see open slots.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-brand-400">No slots available on this date. Try another day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    selectedSlot?.start === slot.start
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-brand-200 text-brand-700 hover:border-brand-400'
                  }`}
                >
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          )}
        </div>

        <Textarea label="Reason for visit (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <Button className="w-full" loading={submitting} onClick={handleSubmit}>
          Confirm Booking
        </Button>
      </div>
    </Modal>
  );
}

function RescheduleModal({ appointment, onClose, onSaved }: { appointment: Appointment; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(appointment.appointment_date);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAvailableSlots(appointment.doctor_id, date, appointment.id).then((s) => {
      setSlots(s);
      setLoading(false);
    });
  }, [date, appointment]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError('Please select a new time slot.');
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ appointment_date: date, start_time: selectedSlot.start, end_time: selectedSlot.end, status: 'scheduled' })
      .eq('id', appointment.id);
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Reschedule Appointment" size="md">
      <div className="space-y-4">
        <p className="text-sm text-brand-600">
          Currently: {formatDate(appointment.appointment_date)} at {formatTime(appointment.start_time)}
        </p>
        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {loading ? (
          <p className="text-sm text-brand-400">Loading availability…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-brand-400">No slots available on this date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  selectedSlot?.start === slot.start ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 text-brand-700 hover:border-brand-400'
                }`}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Confirm New Time</Button>
      </div>
    </Modal>
  );
}
