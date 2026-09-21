import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime } from '@/utils/formatters';
import type { Doctor, DoctorAvailability, DoctorTimeOff } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function SchedulesPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(isAdmin ? '' : profile!.id);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [timeOff, setTimeOff] = useState<DoctorTimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [offModalOpen, setOffModalOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      supabase.from('doctors').select('*, profile:profiles(*)').then(({ data }) => {
        const list = (data as Doctor[]) ?? [];
        setDoctors(list);
        if (list[0]) setSelectedDoctorId(list[0].id);
      });
    }
  }, [isAdmin]);

  const load = async (doctorId: string) => {
    setLoading(true);
    const [{ data: avail }, { data: off }] = await Promise.all([
      supabase.from('doctor_availability').select('*').eq('doctor_id', doctorId).order('day_of_week'),
      supabase.from('doctor_time_off').select('*').eq('doctor_id', doctorId).gte('off_date', new Date().toISOString().slice(0, 10)).order('off_date'),
    ]);
    setAvailability((avail as DoctorAvailability[]) ?? []);
    setTimeOff((off as DoctorTimeOff[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedDoctorId) load(selectedDoctorId);
  }, [selectedDoctorId]);

  const removeSlot = async (id: string) => {
    await supabase.from('doctor_availability').delete().eq('id', id);
    load(selectedDoctorId);
  };

  const removeTimeOff = async (id: string) => {
    await supabase.from('doctor_time_off').delete().eq('id', id);
    load(selectedDoctorId);
  };

  return (
    <div>
      <PageHeader
        title="Doctor Schedules"
        description="Set weekly availability windows and block out days off."
        actions={
          selectedDoctorId ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOffModalOpen(true)}>
                <CalendarOff className="h-4 w-4" /> Block a Day
              </Button>
              <Button onClick={() => setSlotModalOpen(true)}>
                <Plus className="h-4 w-4" /> Add Availability
              </Button>
            </div>
          ) : undefined
        }
      />

      {isAdmin && (
        <div className="mb-6 max-w-sm">
          <Select label="Doctor" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
            <option value="">Select a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>Dr. {d.profile?.full_name}</option>
            ))}
          </Select>
        </div>
      )}

      {!selectedDoctorId ? (
        <EmptyState title="Select a doctor" description="Choose a doctor above to view or edit their schedule." />
      ) : loading ? (
        <Spinner />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Weekly Availability</CardTitle></CardHeader>
            <CardContent>
              {availability.length === 0 ? (
                <EmptyState title="No availability set" description="Add weekly slots so patients can book appointments." />
              ) : (
                <div className="space-y-2">
                  {availability.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-brand-100 px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-brand-900">{DAYS[a.day_of_week]}</p>
                        <p className="text-xs text-brand-500">
                          {formatTime(a.start_time)} – {formatTime(a.end_time)} · {a.slot_duration_minutes} min slots
                        </p>
                      </div>
                      <button onClick={() => removeSlot(a.id)} className="text-brand-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Upcoming Days Off</CardTitle></CardHeader>
            <CardContent>
              {timeOff.length === 0 ? (
                <EmptyState title="No blocked days" description="Block specific dates for leave or holidays." />
              ) : (
                <div className="space-y-2">
                  {timeOff.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-brand-100 px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-brand-900">{formatDate(t.off_date)}</p>
                        {t.reason && <p className="text-xs text-brand-500">{t.reason}</p>}
                      </div>
                      <button onClick={() => removeTimeOff(t.id)} className="text-brand-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {slotModalOpen && (
        <AddAvailabilityModal doctorId={selectedDoctorId} onClose={() => setSlotModalOpen(false)} onSaved={() => { setSlotModalOpen(false); load(selectedDoctorId); }} />
      )}
      {offModalOpen && (
        <AddTimeOffModal doctorId={selectedDoctorId} onClose={() => setOffModalOpen(false)} onSaved={() => { setOffModalOpen(false); load(selectedDoctorId); }} />
      )}
    </div>
  );
}

function AddAvailabilityModal({ doctorId, onClose, onSaved }: { doctorId: string; onClose: () => void; onSaved: () => void }) {
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [duration, setDuration] = useState('20');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('doctor_availability').insert({
      doctor_id: doctorId,
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: Number(duration),
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Add Weekly Availability" size="sm">
      <div className="space-y-4">
        <Select label="Day of Week" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
          {DAYS.map((d, i) => (
            <option key={d} value={i}>{d}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <Input label="Slot Duration (minutes)" type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Save Availability</Button>
      </div>
    </Modal>
  );
}

function AddTimeOffModal({ doctorId, onClose, onSaved }: { doctorId: string; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date) {
      setError('Please choose a date.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('doctor_time_off').insert({ doctor_id: doctorId, off_date: date, reason: reason || null });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Block a Day" size="sm">
      <div className="space-y-4">
        <Input label="Date" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Conference, Leave" />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Block Day</Button>
      </div>
    </Modal>
  );
}
