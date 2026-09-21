import { useEffect, useState, type ReactNode } from 'react';
import { Plus, PackagePlus, ListChecks, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPicker } from '@/components/PatientPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import type { Medication, MedicationDispense } from '@/types';

export function PharmacyPage() {
  const [tab, setTab] = useState<'inventory' | 'dispenses'>('inventory');

  return (
    <div>
      <PageHeader title="Pharmacy" description="Manage medication stock and dispensing records." />

      <div className="mb-6 flex gap-2 border-b border-brand-100">
        <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={PackagePlus}>Inventory</TabButton>
        <TabButton active={tab === 'dispenses'} onClick={() => setTab('dispenses')} icon={ListChecks}>Dispense Records</TabButton>
      </div>

      {tab === 'inventory' ? <InventoryTab /> : <DispensesTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof PackagePlus; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium',
        active ? 'border-brand-600 text-brand-800' : 'border-transparent text-brand-400 hover:text-brand-700',
      )}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

function InventoryTab() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('medications').select('*').order('name');
    setMeds((data as Medication[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Medication>[] = [
    {
      header: 'Medication',
      accessor: (m) => (
        <div>
          <p className="font-medium text-brand-900">{m.name}</p>
          <p className="text-xs text-brand-400">{m.generic_name} {m.strength ? `· ${m.strength}` : ''}</p>
        </div>
      ),
    },
    { header: 'Form', accessor: (m) => m.form },
    {
      header: 'Stock',
      accessor: (m) => (
        <span className={cn('font-medium', m.stock_quantity <= m.reorder_level ? 'text-rose-600' : 'text-brand-900')}>
          {m.stock_quantity}
          {m.stock_quantity <= m.reorder_level && <AlertTriangle className="ml-1 inline h-3.5 w-3.5" />}
        </span>
      ),
    },
    { header: 'Unit Price', accessor: (m) => formatCurrency(m.unit_price) },
    { header: 'Status', accessor: (m) => <Badge className={m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}>{m.is_active ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add Medication
        </Button>
      </div>
      <DataTable columns={columns} rows={meds} keyField={(m) => m.id} loading={loading} emptyTitle="No medications in inventory" />
      {createOpen && <NewMedicationModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
    </div>
  );
}

function NewMedicationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', genericName: '', form: 'tablet', strength: '', manufacturer: '', stock: '0', reorder: '10', price: '0' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Medication name is required.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('medications').insert({
      name: form.name, generic_name: form.genericName || null, form: form.form, strength: form.strength || null,
      manufacturer: form.manufacturer || null, stock_quantity: Number(form.stock) || 0,
      reorder_level: Number(form.reorder) || 10, unit_price: Number(form.price) || 0,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Add Medication" size="md">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Generic Name" value={form.genericName} onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))} />
          <Select label="Form" value={form.form} onChange={(e) => setForm((f) => ({ ...f, form: e.target.value }))}>
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="syrup">Syrup</option>
            <option value="injection">Injection</option>
            <option value="cream">Cream</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Strength" placeholder="e.g. 500mg" value={form.strength} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} />
          <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
          <Input label="Unit Price (₹)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Input label="Opening Stock" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          <Input label="Reorder Level" type="number" value={form.reorder} onChange={(e) => setForm((f) => ({ ...f, reorder: e.target.value }))} />
        </div>
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Add Medication</Button>
      </div>
    </Modal>
  );
}

function DispensesTab() {
  const { profile } = useAuth();
  const [dispenses, setDispenses] = useState<MedicationDispense[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('medication_dispenses')
      .select('*, medication:medications(*)')
      .order('dispensed_at', { ascending: false });
    setDispenses((data as MedicationDispense[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<MedicationDispense>[] = [
    { header: 'Date', accessor: (d) => formatDateTime(d.dispensed_at) },
    { header: 'Medication', accessor: (d) => d.medication?.name ?? '—' },
    { header: 'Quantity', accessor: (d) => d.quantity },
    { header: 'Notes', accessor: (d) => d.notes ?? '—' },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Log Dispense
        </Button>
      </div>
      <DataTable columns={columns} rows={dispenses} keyField={(d) => d.id} loading={loading} emptyTitle="No medications dispensed yet" />
      {createOpen && <NewDispenseModal recordedBy={profile!.id} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
    </div>
  );
}

function NewDispenseModal({ recordedBy, onClose, onSaved }: { recordedBy: string; onClose: () => void; onSaved: () => void }) {
  const [patientId, setPatientId] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationId, setMedicationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('medications').select('*').eq('is_active', true).order('name').then(({ data }) => setMedications((data as Medication[]) ?? []));
  }, []);

  const handleSubmit = async () => {
    const med = medications.find((m) => m.id === medicationId);
    if (!patientId || !med) {
      setError('Select a patient and a medication.');
      return;
    }
    const qty = Number(quantity) || 1;
    if (qty > med.stock_quantity) {
      setError(`Only ${med.stock_quantity} units in stock.`);
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('medication_dispenses').insert({
      patient_id: patientId, medication_id: medicationId, quantity: qty, dispensed_by: recordedBy, notes: notes || null,
    });

    if (insertError) {
      setSubmitting(false);
      setError(insertError.message);
      return;
    }

    await supabase.from('medications').update({ stock_quantity: med.stock_quantity - qty }).eq('id', med.id);
    setSubmitting(false);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Log Medication Dispense" size="md">
      <div className="space-y-4">
        <PatientPicker value={patientId} onChange={setPatientId} />
        <Select label="Medication" required value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
          <option value="">Select medication</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>{m.name} {m.strength ? `(${m.strength})` : ''} — {m.stock_quantity} in stock</option>
          ))}
        </Select>
        <Input label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Log Dispense</Button>
      </div>
    </Modal>
  );
}
