import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { calculateAge, formatDate, initials } from '@/utils/formatters';
import type { Patient } from '@/types';

export function PatientsPage() {
  const { profile } = useAuth();
  const canRegister = profile?.role === 'admin' || profile?.role === 'receptionist';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detail, setDetail] = useState<Patient | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    setPatients((data as Patient[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.full_name} ${p.phone ?? ''} ${p.email ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Patient>[] = [
    {
      header: 'Patient',
      accessor: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials(p.full_name)}
          </div>
          <div>
            <p className="font-medium text-brand-900">{p.full_name}</p>
            <p className="text-xs text-brand-400">{p.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { header: 'Age / Gender', accessor: (p) => `${calculateAge(p.date_of_birth) ?? '—'} / ${p.gender}` },
    { header: 'Phone', accessor: (p) => p.phone ?? '—' },
    { header: 'Blood Group', accessor: (p) => p.blood_group ?? '—' },
    { header: 'Registered', accessor: (p) => formatDate(p.created_at) },
  ];

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search patient records, medical history and registrations."
        actions={
          canRegister && (
            <Button onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" /> Register Patient
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Search by name, phone or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        keyField={(p) => p.id}
        loading={loading}
        emptyTitle="No patients found"
        emptyDescription={canRegister ? 'Register your first patient to get started.' : undefined}
        onRowClick={setDetail}
      />

      {registerOpen && (
        <RegisterPatientModal
          onClose={() => setRegisterOpen(false)}
          onCreated={() => { setRegisterOpen(false); load(); }}
        />
      )}

      {detail && <PatientDetailModal patient={detail} canEdit={!!canRegister} onClose={() => setDetail(null)} onSaved={load} />}
    </div>
  );
}

function RegisterPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '', gender: 'female', bloodGroup: '',
    address: '', emergencyName: '', emergencyPhone: '', allergies: '', history: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('patients').insert({
      full_name: form.fullName,
      email: form.email || null,
      phone: form.phone || null,
      date_of_birth: form.dob || null,
      gender: form.gender,
      blood_group: form.bloodGroup || null,
      address: form.address || null,
      emergency_contact_name: form.emergencyName || null,
      emergency_contact_phone: form.emergencyPhone || null,
      allergies: form.allergies || null,
      medical_history: form.history || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onCreated();
  };

  return (
    <Modal open onClose={onClose} title="Register New Patient" size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Email (optional)" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} />
        </div>
        <Textarea label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Emergency Contact Name" value={form.emergencyName} onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))} />
          <Input label="Emergency Contact Phone" value={form.emergencyPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))} />
        </div>
        <Textarea label="Known Allergies" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} />
        <Textarea label="Medical History" value={form.history} onChange={(e) => setForm((f) => ({ ...f, history: e.target.value }))} />

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <Button className="w-full" loading={submitting} onClick={handleSubmit} disabled={!form.fullName || !form.phone}>
          Register Patient
        </Button>
      </div>
    </Modal>
  );
}

function PatientDetailModal({ patient, canEdit, onClose, onSaved }: { patient: Patient; canEdit: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    fullName: patient.full_name, email: patient.email ?? '', phone: patient.phone ?? '',
    allergies: patient.allergies ?? '', history: patient.medical_history ?? '', bloodGroup: patient.blood_group ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('patients')
      .update({
        full_name: form.fullName,
        email: form.email || null,
        phone: form.phone || null,
        allergies: form.allergies || null,
        medical_history: form.history || null,
        blood_group: form.bloodGroup || null,
      })
      .eq('id', patient.id);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={patient.full_name} size="lg">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl bg-blush-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="text-brand-500">Age / Gender:</span> {calculateAge(patient.date_of_birth) ?? '—'} / {patient.gender}</p>
          <p><span className="text-brand-500">Registered:</span> {formatDate(patient.created_at)}</p>
          <p className="sm:col-span-2"><span className="text-brand-500">Address:</span> {patient.address ?? '—'}</p>
          <p><span className="text-brand-500">Emergency Contact:</span> {patient.emergency_contact_name ?? '—'} {patient.emergency_contact_phone ? `(${patient.emergency_contact_phone})` : ''}</p>
        </div>

        {canEdit ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} />
            </div>
            <Textarea label="Known Allergies" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} />
            <Textarea label="Medical History" value={form.history} onChange={(e) => setForm((f) => ({ ...f, history: e.target.value }))} />
            <Button className="w-full" loading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-brand-800">Contact</p>
              <p className="text-brand-600">{patient.phone ?? '—'} {patient.email ? `· ${patient.email}` : ''}</p>
            </div>
            <div>
              <p className="font-medium text-brand-800">Known Allergies</p>
              <p className="text-brand-600">{patient.allergies || 'None recorded'}</p>
            </div>
            <div>
              <p className="font-medium text-brand-800">Medical History</p>
              <p className="text-brand-600">{patient.medical_history || 'None recorded'}</p>
            </div>
          </div>
        )}

        <div>
          <Badge className="bg-brand-100 text-brand-700">Blood Group: {patient.blood_group ?? 'Unknown'}</Badge>
        </div>
      </div>
    </Modal>
  );
}
