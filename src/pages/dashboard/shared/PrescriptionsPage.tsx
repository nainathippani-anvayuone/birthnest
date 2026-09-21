import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { formatDate } from '@/utils/formatters';
import type { Consultation, Prescription, PrescriptionItem } from '@/types';

interface DraftItem {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const emptyItem = (): DraftItem => ({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });

export function PrescriptionsPage() {
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Prescription | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('prescriptions')
      .select('*, doctor:doctors(*, profile:profiles(*)), patient:patients(*), items:prescription_items(*)')
      .order('created_at', { ascending: false });
    setPrescriptions((data as Prescription[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Prescription>[] = [
    { header: 'Date', accessor: (p) => formatDate(p.created_at) },
    { header: 'Patient', accessor: (p) => p.patient?.full_name ?? '—' },
    { header: 'Doctor', accessor: (p) => `Dr. ${p.doctor?.profile?.full_name ?? ''}` },
    { header: 'Medications', accessor: (p) => (p.items ?? []).map((i) => i.medication_name).join(', ') || '—' },
  ];

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Medications prescribed during consultations."
        actions={
          isDoctor && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Prescription
            </Button>
          )
        }
      />

      <DataTable columns={columns} rows={prescriptions} keyField={(p) => p.id} loading={loading} emptyTitle="No prescriptions yet" onRowClick={setDetail} />

      {createOpen && <NewPrescriptionModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {detail && <PrescriptionDetailModal prescription={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function NewPrescriptionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationId, setConsultationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('consultations')
      .select('*, patient:patients(*)')
      .eq('doctor_id', profile!.id)
      .order('consultation_date', { ascending: false })
      .limit(50)
      .then(({ data }) => setConsultations((data as Consultation[]) ?? []));
  }, [profile]);

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async () => {
    const consultation = consultations.find((c) => c.id === consultationId);
    if (!consultation) {
      setError('Please select a consultation.');
      return;
    }
    const validItems = items.filter((i) => i.medication_name.trim());
    if (validItems.length === 0) {
      setError('Add at least one medication.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data: prescription, error: insertError } = await supabase
      .from('prescriptions')
      .insert({ consultation_id: consultation.id, patient_id: consultation.patient_id, doctor_id: profile!.id, notes: notes || null })
      .select()
      .single();

    if (insertError || !prescription) {
      setSubmitting(false);
      setError(insertError?.message ?? 'Failed to create prescription.');
      return;
    }

    const { error: itemsError } = await supabase.from('prescription_items').insert(
      validItems.map((i) => ({ ...i, prescription_id: prescription.id, instructions: i.instructions || null })),
    );

    setSubmitting(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="New Prescription" size="lg">
      <div className="space-y-4">
        <Select label="Consultation" required value={consultationId} onChange={(e) => setConsultationId(e.target.value)}>
          <option value="">Select a consultation</option>
          {consultations.map((c) => (
            <option key={c.id} value={c.id}>
              {formatDate(c.consultation_date)} — {c.patient?.full_name} {c.diagnosis ? `(${c.diagnosis})` : ''}
            </option>
          ))}
        </Select>

        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-900">Medications</p>
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-brand-100 p-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <Input placeholder="Medication name" value={item.medication_name} onChange={(e) => updateItem(i, 'medication_name', e.target.value)} />
                <Input placeholder="Dosage (e.g. 500mg)" value={item.dosage} onChange={(e) => updateItem(i, 'dosage', e.target.value)} />
                <Input placeholder="Frequency (e.g. 2x/day)" value={item.frequency} onChange={(e) => updateItem(i, 'frequency', e.target.value)} />
                <Input placeholder="Duration (e.g. 5 days)" value={item.duration} onChange={(e) => updateItem(i, 'duration', e.target.value)} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  placeholder="Instructions (optional)"
                  className="flex-1"
                  value={item.instructions}
                  onChange={(e) => updateItem(i, 'instructions', e.target.value)}
                />
                {items.length > 1 && (
                  <button onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} className="text-brand-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
            <Plus className="h-4 w-4" /> Add Medication
          </Button>
        </div>

        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Save Prescription</Button>
      </div>
    </Modal>
  );
}

function PrescriptionDetailModal({ prescription, onClose }: { prescription: Prescription; onClose: () => void }) {
  const items: PrescriptionItem[] = prescription.items ?? [];
  return (
    <Modal open onClose={onClose} title={`Prescription — ${formatDate(prescription.created_at)}`} size="lg">
      <div className="space-y-4 text-sm">
        <div className="grid gap-2 rounded-xl bg-blush-50 p-4 sm:grid-cols-2">
          <p><span className="text-brand-500">Patient:</span> {prescription.patient?.full_name}</p>
          <p><span className="text-brand-500">Doctor:</span> Dr. {prescription.doctor?.profile?.full_name}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-brand-100">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50/70">
              <tr>
                {['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-brand-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2 font-medium text-brand-900">{i.medication_name}</td>
                  <td className="px-3 py-2 text-brand-700">{i.dosage}</td>
                  <td className="px-3 py-2 text-brand-700">{i.frequency}</td>
                  <td className="px-3 py-2 text-brand-700">{i.duration}</td>
                  <td className="px-3 py-2 text-brand-500">{i.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prescription.notes && (
          <div>
            <p className="font-medium text-brand-800">Notes</p>
            <p className="text-brand-600">{prescription.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
