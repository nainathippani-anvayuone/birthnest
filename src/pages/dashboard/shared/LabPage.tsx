import { useEffect, useState, type ReactNode } from 'react';
import { Plus, FlaskConical, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPicker } from '@/components/PatientPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { LabOrder, LabOrderItem, LabOrderStatus, LabTest } from '@/types';

export function LabPage() {
  const { profile } = useAuth();
  const canOrder = profile?.role === 'admin' || profile?.role === 'doctor' || profile?.role === 'receptionist';
  const canManageCatalog = profile?.role === 'admin' || profile?.role === 'lab_staff';
  const [tab, setTab] = useState<'orders' | 'catalog'>('orders');

  return (
    <div>
      <PageHeader title="Lab & Diagnostics" description="Order tests, track processing, and review results." />

      <div className="mb-6 flex gap-2 border-b border-brand-100">
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} icon={FlaskConical}>Orders</TabButton>
        <TabButton active={tab === 'catalog'} onClick={() => setTab('catalog')} icon={ClipboardCheck}>Test Catalog</TabButton>
      </div>

      {tab === 'orders' ? <OrdersTab canOrder={canOrder} /> : <CatalogTab canManage={canManageCatalog} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof FlaskConical; children: ReactNode }) {
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

function OrdersTab({ canOrder }: { canOrder: boolean }) {
  const { profile } = useAuth();
  const isLab = profile?.role === 'lab_staff';
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<LabOrder | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lab_orders')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*)), items:lab_order_items(*, lab_test:lab_tests(*))')
      .order('order_date', { ascending: false });
    setOrders((data as LabOrder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<LabOrder>[] = [
    { header: 'Date', accessor: (o) => formatDate(o.order_date) },
    { header: 'Patient', accessor: (o) => o.patient?.full_name ?? '—' },
    { header: 'Tests', accessor: (o) => (o.items ?? []).map((i) => i.lab_test?.name).join(', ') || '—' },
    { header: 'Status', accessor: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canOrder && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Order Tests
          </Button>
        )}
      </div>

      <DataTable columns={columns} rows={orders} keyField={(o) => o.id} loading={loading} emptyTitle="No lab orders yet" onRowClick={setDetail} />

      {createOpen && <NewOrderModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {detail && <OrderDetailModal order={detail} canEnterResults={isLab} onClose={() => setDetail(null)} onSaved={load} />}
    </div>
  );
}

function NewOrderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [tests, setTests] = useState<LabTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('lab_tests').select('*').eq('is_active', true).order('category').then(({ data }) => setTests((data as LabTest[]) ?? []));
  }, []);

  const toggleTest = (id: string) => {
    setSelectedTests((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!patientId || selectedTests.length === 0) {
      setError('Select a patient and at least one test.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const isDoctor = profile?.role === 'doctor';
    const { data: order, error: insertError } = await supabase
      .from('lab_orders')
      .insert({ patient_id: patientId, doctor_id: isDoctor ? profile!.id : null, ordered_by: profile!.id, notes: notes || null })
      .select()
      .single();

    if (insertError || !order) {
      setSubmitting(false);
      setError(insertError?.message ?? 'Failed to create order.');
      return;
    }

    const { error: itemsError } = await supabase.from('lab_order_items').insert(
      selectedTests.map((testId) => ({ lab_order_id: order.id, lab_test_id: testId })),
    );

    setSubmitting(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Order Lab Tests" size="lg">
      <div className="space-y-4">
        <PatientPicker value={patientId} onChange={setPatientId} />

        <div>
          <p className="mb-2 text-sm font-medium text-brand-900">Select Tests</p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-brand-100 p-2">
            {tests.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-brand-50">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedTests.includes(t.id)} onChange={() => toggleTest(t.id)} className="h-4 w-4 accent-brand-600" />
                  {t.name}
                </span>
                <span className="text-brand-400">{formatCurrency(t.price)}</span>
              </label>
            ))}
          </div>
        </div>

        <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Place Order</Button>
      </div>
    </Modal>
  );
}

const ORDER_STATUS_FLOW: LabOrderStatus[] = ['ordered', 'sample_collected', 'in_progress', 'completed'];

function OrderDetailModal({ order, canEnterResults, onClose, onSaved }: { order: LabOrder; canEnterResults: boolean; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [items, setItems] = useState<LabOrderItem[]>(order.items ?? []);
  const [saving, setSaving] = useState(false);

  const updateOrderStatus = async (newStatus: LabOrderStatus) => {
    setStatus(newStatus);
    await supabase.from('lab_orders').update({ status: newStatus }).eq('id', order.id);
    onSaved();
  };

  const updateItem = (id: string, patch: Partial<LabOrderItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const saveResult = async (item: LabOrderItem) => {
    setSaving(true);
    await supabase
      .from('lab_order_items')
      .update({
        result_value: item.result_value,
        result_notes: item.result_notes,
        is_abnormal: item.is_abnormal,
        status: 'completed',
        resulted_at: new Date().toISOString(),
      })
      .eq('id', item.id);
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Lab Order Details" size="xl">
      <div className="space-y-5">
        <div className="grid gap-2 rounded-xl bg-blush-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="text-brand-500">Patient:</span> {order.patient?.full_name}</p>
          <p><span className="text-brand-500">Ordered:</span> {formatDate(order.order_date)}</p>
        </div>

        {canEnterResults && (
          <div>
            <p className="mb-2 text-sm font-medium text-brand-900">Order Status</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  onClick={() => updateOrderStatus(s)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium capitalize',
                    status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-200 text-brand-600 hover:border-brand-400',
                  )}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-brand-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-brand-900">{item.lab_test?.name}</p>
                <StatusBadge status={item.status} />
              </div>
              {canEnterResults ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Result Value"
                    value={item.result_value ?? ''}
                    onChange={(e) => updateItem(item.id, { result_value: e.target.value })}
                  />
                  <label className="flex items-end gap-2 pb-2 text-sm">
                    <input type="checkbox" checked={item.is_abnormal} onChange={(e) => updateItem(item.id, { is_abnormal: e.target.checked })} className="h-4 w-4 accent-rose-600" />
                    Flag as abnormal
                  </label>
                  <Textarea
                    label="Result Notes"
                    className="sm:col-span-2"
                    value={item.result_notes ?? ''}
                    onChange={(e) => updateItem(item.id, { result_notes: e.target.value })}
                  />
                  <Button size="sm" loading={saving} onClick={() => saveResult(item)} className="sm:col-span-2">Save Result</Button>
                </div>
              ) : (
                <div className="mt-2 text-sm text-brand-600">
                  <p>Result: {item.result_value ?? 'Pending'}{item.is_abnormal && <span className="ml-2 text-rose-600">(Abnormal)</span>}</p>
                  {item.result_notes && <p className="mt-1 text-brand-500">{item.result_notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function CatalogTab({ canManage }: { canManage: boolean }) {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('lab_tests').select('*').order('category');
    setTests((data as LabTest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (t: LabTest) => {
    await supabase.from('lab_tests').update({ is_active: !t.is_active }).eq('id', t.id);
    load();
  };

  const columns: Column<LabTest>[] = [
    { header: 'Test', accessor: (t) => t.name },
    { header: 'Category', accessor: (t) => t.category },
    { header: 'Sample', accessor: (t) => t.sample_type },
    { header: 'Price', accessor: (t) => formatCurrency(t.price) },
    { header: 'TAT', accessor: (t) => `${t.turnaround_hours}h` },
    ...(canManage
      ? [{
          header: 'Status',
          accessor: (t: LabTest) => (
            <button onClick={() => toggleActive(t)} className="text-xs font-medium text-brand-600 hover:underline">
              {t.is_active ? 'Active — deactivate' : 'Inactive — activate'}
            </button>
          ),
        } as Column<LabTest>]
      : []),
  ];

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Test
          </Button>
        </div>
      )}
      <DataTable columns={columns} rows={tests} keyField={(t) => t.id} loading={loading} emptyTitle="No lab tests configured" />
      {createOpen && <NewTestModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
    </div>
  );
}

function NewTestModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'general', sampleType: 'blood', price: '0', turnaround: '24', reference: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Test name is required.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('lab_tests').insert({
      name: form.name, category: form.category, sample_type: form.sampleType,
      price: Number(form.price) || 0, turnaround_hours: Number(form.turnaround) || 24, reference_range: form.reference || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Add Lab Test" size="md">
      <div className="space-y-4">
        <Input label="Test Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <Select label="Sample Type" value={form.sampleType} onChange={(e) => setForm((f) => ({ ...f, sampleType: e.target.value }))}>
            <option value="blood">Blood</option>
            <option value="urine">Urine</option>
            <option value="cervical swab">Cervical Swab</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Price (₹)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <Input label="Turnaround (hours)" type="number" value={form.turnaround} onChange={(e) => setForm((f) => ({ ...f, turnaround: e.target.value }))} />
        </div>
        <Input label="Reference Range (optional)" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Add Test</Button>
      </div>
    </Modal>
  );
}
