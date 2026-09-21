import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, IndianRupee } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PatientPicker } from '@/components/PatientPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Invoice, InvoiceItemType, PaymentMethod } from '@/types';

interface DraftItem {
  description: string;
  item_type: InvoiceItemType;
  quantity: string;
  unit_price: string;
}

const emptyItem = (): DraftItem => ({ description: '', item_type: 'service', quantity: '1', unit_price: '0' });

export function BillingPage() {
  const { profile } = useAuth();
  const canManage = profile?.role === 'admin' || profile?.role === 'receptionist';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Invoice | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('*, patient:patients(*), items:invoice_items(*), payments(*)')
      .order('invoice_date', { ascending: false });
    setInvoices((data as Invoice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Invoice>[] = [
    { header: 'Invoice #', accessor: (i) => i.invoice_number },
    { header: 'Date', accessor: (i) => formatDate(i.invoice_date) },
    { header: 'Patient', accessor: (i) => i.patient?.full_name ?? '—' },
    { header: 'Total', accessor: (i) => formatCurrency(i.total_amount) },
    {
      header: 'Paid',
      accessor: (i) => formatCurrency((i.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)),
    },
    { header: 'Status', accessor: (i) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Billing & Payments"
        description="Generate invoices and record payments."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          )
        }
      />

      <DataTable columns={columns} rows={invoices} keyField={(i) => i.id} loading={loading} emptyTitle="No invoices yet" onRowClick={setDetail} />

      {createOpen && <NewInvoiceModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {detail && <InvoiceDetailModal invoice={detail} canManage={canManage} onClose={() => setDetail(null)} onSaved={load} />}
    </div>
  );
}

function NewInvoiceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (index: number, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.description.trim());
    if (!patientId || validItems.length === 0) {
      setError('Select a patient and add at least one line item.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        patient_id: patientId,
        due_date: dueDate || null,
        subtotal,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        total_amount: total,
        created_by: profile!.id,
      })
      .select()
      .single();

    if (insertError || !invoice) {
      setSubmitting(false);
      setError(insertError?.message ?? 'Failed to create invoice.');
      return;
    }

    const { error: itemsError } = await supabase.from('invoice_items').insert(
      validItems.map((i) => ({
        invoice_id: invoice.id,
        description: i.description,
        item_type: i.item_type,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
        amount: (Number(i.quantity) || 1) * (Number(i.unit_price) || 0),
      })),
    );

    setSubmitting(false);
    if (itemsError) {
      setError(itemsError.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="New Invoice" size="lg">
      <div className="space-y-4">
        <PatientPicker value={patientId} onChange={setPatientId} />

        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-900">Line Items</p>
          {items.map((item, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-brand-100 p-3 sm:grid-cols-12 sm:items-end">
              <Input className="sm:col-span-5" placeholder="Description" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
              <Select className="sm:col-span-3" value={item.item_type} onChange={(e) => updateItem(i, 'item_type', e.target.value as InvoiceItemType)}>
                <option value="consultation">Consultation</option>
                <option value="service">Service</option>
                <option value="lab_test">Lab Test</option>
                <option value="medication">Medication</option>
                <option value="other">Other</option>
              </Select>
              <Input className="sm:col-span-1" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
              <Input className="sm:col-span-2" type="number" min={0} placeholder="Unit price" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
              <button
                className="flex items-center justify-center sm:col-span-1"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4 text-brand-400 hover:text-rose-600" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
            <Plus className="h-4 w-4" /> Add Line Item
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Discount (₹)" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input label="Tax (₹)" type="number" min={0} value={tax} onChange={(e) => setTax(e.target.value)} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="flex justify-end rounded-xl bg-blush-50 p-4">
          <div className="text-right text-sm">
            <p className="text-brand-500">Subtotal: {formatCurrency(subtotal)}</p>
            <p className="mt-1 font-serif text-lg font-semibold text-brand-900">Total: {formatCurrency(total)}</p>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Create Invoice</Button>
      </div>
    </Modal>
  );
}

function InvoiceDetailModal({ invoice, canManage, onClose, onSaved }: { invoice: Invoice; canManage: boolean; onClose: () => void; onSaved: () => void }) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const paidTotal = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = invoice.total_amount - paidTotal;

  return (
    <Modal open onClose={onClose} title={`Invoice ${invoice.invoice_number}`} size="lg">
      <div className="space-y-5 text-sm">
        <div className="grid gap-2 rounded-xl bg-blush-50 p-4 sm:grid-cols-2">
          <p><span className="text-brand-500">Patient:</span> {invoice.patient?.full_name}</p>
          <p><span className="text-brand-500">Date:</span> {formatDate(invoice.invoice_date)}</p>
          <p><span className="text-brand-500">Status:</span> <StatusBadge status={invoice.status} /></p>
          <p><span className="text-brand-500">Balance Due:</span> {formatCurrency(balance)}</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-brand-100">
          <table className="min-w-full divide-y divide-brand-100">
            <thead className="bg-brand-50/70">
              <tr>
                {['Description', 'Type', 'Qty', 'Unit Price', 'Amount'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase text-brand-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {(invoice.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-brand-900">{item.description}</td>
                  <td className="px-3 py-2 capitalize text-brand-500">{item.item_type.replace('_', ' ')}</td>
                  <td className="px-3 py-2 text-brand-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-brand-700">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2 font-medium text-brand-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end text-sm">
          <div className="w-56 space-y-1 text-right">
            <p className="text-brand-500">Subtotal: {formatCurrency(invoice.subtotal)}</p>
            <p className="text-brand-500">Discount: -{formatCurrency(invoice.discount)}</p>
            <p className="text-brand-500">Tax: +{formatCurrency(invoice.tax)}</p>
            <p className="font-semibold text-brand-900">Total: {formatCurrency(invoice.total_amount)}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-brand-900">Payments</p>
            {canManage && balance > 0 && (
              <Button size="sm" onClick={() => setPaymentOpen(true)}>
                <IndianRupee className="h-3.5 w-3.5" /> Record Payment
              </Button>
            )}
          </div>
          {(invoice.payments ?? []).length === 0 ? (
            <p className="text-brand-400">No payments recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {(invoice.payments ?? []).map((p) => (
                <div key={p.id} className="flex justify-between rounded-lg bg-blush-50 px-3 py-2">
                  <span className="text-brand-600">{formatDate(p.payment_date)} · {p.payment_method.toUpperCase()}</span>
                  <span className="font-medium text-brand-900">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {paymentOpen && (
        <RecordPaymentModal
          invoice={invoice}
          balance={balance}
          onClose={() => setPaymentOpen(false)}
          onSaved={() => { setPaymentOpen(false); onSaved(); onClose(); }}
        />
      )}
    </Modal>
  );
}

function RecordPaymentModal({ invoice, balance, onClose, onSaved }: { invoice: Invoice; balance: number; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount: value,
      payment_method: method,
      transaction_reference: reference || null,
      recorded_by: profile!.id,
    });

    if (paymentError) {
      setSubmitting(false);
      setError(paymentError.message);
      return;
    }

    const newPaid = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0) + value;
    const newStatus = newPaid >= invoice.total_amount ? 'paid' : newPaid > 0 ? 'partially_paid' : 'pending';
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoice.id);

    setSubmitting(false);
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Record Payment" size="sm">
      <div className="space-y-4">
        <Input label="Amount (₹)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="insurance">Insurance</option>
          <option value="other">Other</option>
        </Select>
        <Input label="Transaction Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        <Button className="w-full" loading={submitting} onClick={handleSubmit}>Record Payment</Button>
      </div>
    </Modal>
  );
}
