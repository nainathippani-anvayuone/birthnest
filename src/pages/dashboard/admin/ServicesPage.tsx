import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/formatters';
import type { Service } from '@/types';

const CATEGORIES = ['consultation', 'pregnancy_care', 'ultrasound', 'fertility_care', 'diagnostics', 'gynaecology_procedure', 'laboratory'];

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('category');
    setServices((data as Service[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (s: Service) => {
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    load();
  };

  const columns: Column<Service>[] = [
    { header: 'Service', accessor: (s) => <button onClick={() => setEditing(s)} className="font-medium text-brand-900 hover:underline">{s.name}</button> },
    { header: 'Category', accessor: (s) => s.category.replace(/_/g, ' ') },
    { header: 'Price', accessor: (s) => (s.price > 0 ? formatCurrency(s.price) : 'Varies') },
    { header: 'Duration', accessor: (s) => `${s.duration_minutes} min` },
    {
      header: 'Status',
      accessor: (s) => (
        <button onClick={() => toggleActive(s)}>
          <Badge className={s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}>
            {s.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage the services shown on the public site and used for booking."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      <DataTable columns={columns} rows={services} keyField={(s) => s.id} loading={loading} emptyTitle="No services configured" />

      {(createOpen || editing) && (
        <ServiceFormModal
          service={editing}
          onClose={() => { setCreateOpen(false); setEditing(null); }}
          onSaved={() => { setCreateOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ServiceFormModal({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: service?.name ?? '', category: service?.category ?? 'consultation', description: service?.description ?? '',
    price: (service?.price ?? 0).toString(), duration: (service?.duration_minutes ?? 30).toString(),
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Service name is required.');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name, category: form.category, description: form.description || null,
      price: Number(form.price) || 0, duration_minutes: Number(form.duration) || 30,
    };
    const { error: saveError } = service
      ? await supabase.from('services').update(payload).eq('id', service.id)
      : await supabase.from('services').insert(payload);
    setSubmitting(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={service ? 'Edit Service' : 'Add Service'} size="md">
      <div className="space-y-4">
        <Input label="Service Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </Select>
        <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Price (₹, 0 = varies)" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Input label="Duration (minutes)" type="number" min={5} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
        </div>
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>{service ? 'Save Changes' : 'Add Service'}</Button>
      </div>
    </Modal>
  );
}
