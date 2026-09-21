import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell,
} from 'recharts';
import { Users, CalendarDays, Receipt, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/utils/formatters';
import type { AppointmentStatus } from '@/types';

// Palette pulled from the dataviz skill's validated reference (references/palette.md):
// fixed categorical slots 1-5, and the sequential "blue" ramp for single-series charts.
const CHART = {
  surface: '#fcfcfb',
  primaryInk: '#0b0b0b',
  mutedInk: '#898781',
  gridline: '#e1e0d9',
  seq450: '#2a78d6',
  seq250: '#86b6ef',
  seq150: '#b7d3f6',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: '#2a78d6',
  confirmed: '#1baf7a',
  completed: '#008300',
  cancelled: '#e34948',
  no_show: '#eda100',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show',
};

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ patients: 0, appointments: 0, revenue: 0 });
  const [dailyAppointments, setDailyAppointments] = useState<{ day: string; count: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ status: AppointmentStatus; count: number }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const since14 = isoDaysAgo(13);
      const since6mo = new Date();
      since6mo.setMonth(since6mo.getMonth() - 5);
      since6mo.setDate(1);

      const [{ count: patients }, { count: appointments }, { data: payments }, { data: apptsRecent }, { data: apptsAll }, { data: apptsWithService }] =
        await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('appointments').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('amount, payment_date').gte('payment_date', since6mo.toISOString()),
          supabase.from('appointments').select('appointment_date').gte('appointment_date', since14),
          supabase.from('appointments').select('status'),
          supabase.from('appointments').select('service:services(name)').not('service_id', 'is', null),
        ]);

      const revenueTotal = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
      setTotals({ patients: patients ?? 0, appointments: appointments ?? 0, revenue: revenueTotal });

      const dayBuckets = new Map<string, number>();
      for (let i = 13; i >= 0; i--) dayBuckets.set(isoDaysAgo(i), 0);
      (apptsRecent ?? []).forEach((a) => {
        dayBuckets.set(a.appointment_date, (dayBuckets.get(a.appointment_date) ?? 0) + 1);
      });
      setDailyAppointments(
        Array.from(dayBuckets.entries()).map(([day, count]) => ({
          day: new Date(day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          count,
        })),
      );

      const monthBuckets = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthBuckets.set(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), 0);
      }
      (payments ?? []).forEach((p) => {
        const key = new Date(p.payment_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        if (monthBuckets.has(key)) monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + Number(p.amount));
      });
      setMonthlyRevenue(Array.from(monthBuckets.entries()).map(([month, revenue]) => ({ month, revenue })));

      const statusCounts = new Map<AppointmentStatus, number>();
      (apptsAll ?? []).forEach((a) => {
        const s = a.status as AppointmentStatus;
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
      });
      setStatusBreakdown(
        (['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map((status) => ({
          status,
          count: statusCounts.get(status) ?? 0,
        })),
      );

      const serviceCounts = new Map<string, number>();
      (apptsWithService as { service: { name: string } | null }[] | null ?? []).forEach((a) => {
        const name = a.service?.name;
        if (name) serviceCounts.set(name, (serviceCounts.get(name) ?? 0) + 1);
      });
      setTopServices(
        Array.from(serviceCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );

      setLoading(false);
    };
    load();
  }, []);

  const axisStyle = { fontSize: 12, fill: CHART.mutedInk };

  if (loading) return <Spinner label="Crunching the numbers…" />;

  return (
    <div>
      <PageHeader title="Analytics" description="Clinic performance over time." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Patients" value={totals.patients} icon={Users} accent="brand" />
        <StatCard label="Total Appointments" value={totals.appointments} icon={CalendarDays} accent="sky" />
        <StatCard label="Revenue (Last 6 Months)" value={formatCurrency(totals.revenue)} icon={Receipt} accent="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Appointments — Last 14 Days</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyAppointments} barCategoryGap={6}>
                <CartesianGrid vertical={false} stroke={CHART.gridline} />
                <XAxis dataKey="day" tick={axisStyle} axisLine={{ stroke: CHART.gridline }} tickLine={false} interval={1} />
                <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: CHART.gridline, fontSize: 13 }}
                  labelStyle={{ color: CHART.primaryInk, fontWeight: 600 }}
                />
                <Bar dataKey="count" name="Appointments" fill={CHART.seq450} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue Trend — Last 6 Months</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.seq250} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={CHART.seq250} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART.gridline} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: CHART.gridline }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: 8, borderColor: CHART.gridline, fontSize: 13 }}
                  labelStyle={{ color: CHART.primaryInk, fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.seq450} strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Appointment Status Breakdown</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown.map((s) => ({ ...s, label: STATUS_LABELS[s.status] }))} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid horizontal={false} stroke={CHART.gridline} />
                <XAxis type="number" allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, borderColor: CHART.gridline, fontSize: 13 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {statusBreakdown.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fill: CHART.primaryInk, fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Booked Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-brand-400">Not enough data yet.</p>
            ) : (
              <div className="space-y-3">
                {topServices.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-brand-900">{s.name}</span>
                        <span className="text-brand-500">{s.count} bookings</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-brand-50">
                        <div
                          className="h-1.5 rounded-full bg-brand-500"
                          style={{ width: `${(s.count / topServices[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-400">
        <TrendingUp className="h-3.5 w-3.5" /> Figures reflect live data across all recorded appointments and payments.
      </p>
    </div>
  );
}
