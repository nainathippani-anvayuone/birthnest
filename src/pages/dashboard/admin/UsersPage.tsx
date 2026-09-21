import { useEffect, useState } from 'react';
import { KeyRound, Plus, UserX, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { provisionAccount } from '@/utils/accountProvisioning';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ROLE_BADGE_CLASSES, ROLE_LABELS, ALL_ROLES } from '@/utils/roles';
import { formatDate, initials } from '@/utils/formatters';
import type { Profile, UserRole } from '@/types';

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = profiles.filter((p) => {
    const matchesSearch = `${p.full_name} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleActive = async (p: Profile) => {
    await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  };

  const columns: Column<Profile>[] = [
    {
      header: 'Name',
      accessor: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials(p.full_name)}
          </div>
          <div>
            <p className="font-medium text-brand-900">{p.full_name}</p>
            <p className="text-xs text-brand-400">{p.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Role', accessor: (p) => <Badge className={ROLE_BADGE_CLASSES[p.role]}>{ROLE_LABELS[p.role]}</Badge> },
    { header: 'Phone', accessor: (p) => p.phone ?? '—' },
    { header: 'Joined', accessor: (p) => formatDate(p.created_at) },
    {
      header: 'Status',
      accessor: (p) => (
        <Badge className={p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}>
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: '',
      accessor: (p) => (
        <button
          onClick={() => toggleActive(p)}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          {p.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
          {p.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff & Users"
        description="Manage doctor, receptionist, lab and admin accounts, and patient portal access."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Staff Member
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}>
          <option value="all">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </Select>
      </div>

      <DataTable columns={columns} rows={filtered} keyField={(p) => p.id} loading={loading} emptyTitle="No users found" />

      <AddStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(email, password) => {
          setModalOpen(false);
          setCredentials({ email, password });
          load();
        }}
      />

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Account Created" size="sm">
        {credentials && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
              <KeyRound className="h-5 w-5 shrink-0" />
              <p className="text-sm">Share these credentials securely — the user should change their password after first login.</p>
            </div>
            <div className="rounded-lg border border-brand-100 p-4 text-sm">
              <p><span className="font-medium text-brand-500">Email:</span> {credentials.email}</p>
              <p className="mt-1"><span className="font-medium text-brand-500">Temporary Password:</span> {credentials.password}</p>
            </div>
            <Button className="w-full" onClick={() => setCredentials(null)}>Done</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AddStaffModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (email: string, password: string) => void;
}) {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', role: 'receptionist' as UserRole,
    specialization: 'Obstetrics & Gynaecology', qualifications: '', experienceYears: '0', fee: '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm({ fullName: '', email: '', phone: '', role: 'receptionist', specialization: 'Obstetrics & Gynaecology', qualifications: '', experienceYears: '0', fee: '0' });
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { tempPassword } = await provisionAccount({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        doctor: form.role === 'doctor' ? {
          specialization: form.specialization,
          qualifications: form.qualifications,
          experience_years: Number(form.experienceYears) || 0,
          consultation_fee: Number(form.fee) || 0,
        } : undefined,
      });

      if (!tempPassword) throw new Error('Account was created but no temporary password was returned.');
      reset();
      onCreated(form.email, tempPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add Staff Member" size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full Name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Select label="Role" required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}>
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="lab_staff">Lab / Diagnostics Staff</option>
            <option value="admin">Administrator</option>
          </Select>
        </div>

        {form.role === 'doctor' && (
          <div className="grid gap-4 rounded-xl bg-blush-50 p-4 sm:grid-cols-2">
            <Input label="Specialization" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
            <Input label="Qualifications" placeholder="MBBS, MS (OBG)" value={form.qualifications} onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))} />
            <Input label="Experience (years)" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} />
            <Input label="Consultation Fee (₹)" type="number" min={0} value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} />
          </div>
        )}

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        <Button className="w-full" loading={submitting} onClick={handleSubmit} disabled={!form.fullName || !form.email}>
          Create Account
        </Button>
      </div>
    </Modal>
  );
}
