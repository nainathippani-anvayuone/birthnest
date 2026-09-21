import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPicker } from '@/components/PatientPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Field';
import { SearchInput } from '@/components/ui/SearchInput';
import { formatDate, formatDateTime } from '@/utils/formatters';
import type { Consultation } from '@/types';

export function ConsultationsPage() {
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Consultation | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('consultations')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*))')
      .order('consultation_date', { ascending: false });
    setConsultations((data as Consultation[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = consultations.filter((c) =>
    `${c.patient?.full_name ?? ''} ${c.diagnosis ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Consultation>[] = [
    { header: 'Date', accessor: (c) => formatDateTime(c.consultation_date) },
    { header: 'Patient', accessor: (c) => c.patient?.full_name ?? '—' },
    { header: 'Doctor', accessor: (c) => `Dr. ${c.doctor?.profile?.full_name ?? ''}` },
    { header: 'Diagnosis', accessor: (c) => c.diagnosis || '—' },
    { header: 'Follow-up', accessor: (c) => formatDate(c.follow_up_date) },
  ];

  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Clinical notes, diagnoses and vitals from patient visits."
        actions={
          isDoctor && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Consultation
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Search by patient or diagnosis…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} rows={filtered} keyField={(c) => c.id} loading={loading} emptyTitle="No consultations recorded" onRowClick={setDetail} />

      {createOpen && <NewConsultationModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {detail && <ConsultationDetailModal consultation={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function NewConsultationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [form, setForm] = useState({
    chiefComplaint: '', diagnosis: '', notes: '', weight: '', height: '', bp: '', pulse: '', followUp: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!patientId) {
      setError('Please select a patient.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('consultations').insert({
      patient_id: patientId,
      doctor_id: profile!.id,
      chief_complaint: form.chiefComplaint || null,
      diagnosis: form.diagnosis || null,
      clinical_notes: form.notes || null,
      weight_kg: form.weight ? Number(form.weight) : null,
      height_cm: form.height ? Number(form.height) : null,
      blood_pressure: form.bp || null,
      pulse_bpm: form.pulse ? Number(form.pulse) : null,
      follow_up_date: form.followUp || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="New Consultation" size="lg">
      <div className="space-y-4">
        <PatientPicker value={patientId} onChange={setPatientId} />

        <Textarea label="Chief Complaint" value={form.chiefComplaint} onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />

        <div className="grid gap-4 sm:grid-cols-4">
          <Input label="Weight (kg)" type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          <Input label="Height (cm)" type="number" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
          <Input label="Blood Pressure" placeholder="120/80" value={form.bp} onChange={(e) => setForm((f) => ({ ...f, bp: e.target.value }))} />
          <Input label="Pulse (bpm)" type="number" value={form.pulse} onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))} />
        </div>

        <Textarea label="Diagnosis" value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} />
        <Textarea label="Clinical Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        <Input label="Follow-up Date (optional)" type="date" value={form.followUp} onChange={(e) => setForm((f) => ({ ...f, followUp: e.target.value }))} />

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Save Consultation</Button>
      </div>
    </Modal>
  );
}

function ConsultationDetailModal({ consultation, onClose }: { consultation: Consultation; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Consultation — ${formatDate(consultation.consultation_date)}`} size="lg">
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 rounded-xl bg-blush-50 p-4 sm:grid-cols-2">
          <p><span className="text-brand-500">Patient:</span> {consultation.patient?.full_name}</p>
          <p><span className="text-brand-500">Doctor:</span> Dr. {consultation.doctor?.profile?.full_name}</p>
          <p><span className="text-brand-500">Weight:</span> {consultation.weight_kg ?? '—'} kg</p>
          <p><span className="text-brand-500">Height:</span> {consultation.height_cm ?? '—'} cm</p>
          <p><span className="text-brand-500">Blood Pressure:</span> {consultation.blood_pressure ?? '—'}</p>
          <p><span className="text-brand-500">Pulse:</span> {consultation.pulse_bpm ?? '—'} bpm</p>
        </div>
        <div>
          <p className="font-medium text-brand-800">Chief Complaint</p>
          <p className="text-brand-600">{consultation.chief_complaint || '—'}</p>
        </div>
        <div>
          <p className="font-medium text-brand-800">Diagnosis</p>
          <p className="text-brand-600">{consultation.diagnosis || '—'}</p>
        </div>
        <div>
          <p className="font-medium text-brand-800">Clinical Notes</p>
          <p className="whitespace-pre-wrap text-brand-600">{consultation.clinical_notes || '—'}</p>
        </div>
        <div>
          <p className="font-medium text-brand-800">Follow-up Date</p>
          <p className="text-brand-600">{formatDate(consultation.follow_up_date)}</p>
        </div>
      </div>
    </Modal>
  );
}
