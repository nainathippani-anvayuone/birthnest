import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, CalendarDays, Receipt, FlaskConical, ClipboardList, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';
import type { Appointment } from '@/types';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function DashboardHome() {
  const { profile } = useAuth();
  if (!profile) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name.split(' ')[0]}`}
        description="Here's what's happening at Birth Nest today."
      />
      {profile.role === 'admin' && <AdminOverview />}
      {profile.role === 'doctor' && <DoctorOverview doctorId={profile.id} />}
      {profile.role === 'receptionist' && <ReceptionistOverview />}
      {profile.role === 'lab_staff' && <LabOverview />}
    </div>
  );
}

function AppointmentsList({ appointments, showPatient = true, showDoctor = false }: { appointments: Appointment[]; showPatient?: boolean; showDoctor?: boolean }) {
  if (appointments.length === 0) {
    return <EmptyState title="No appointments to show" />;
  }
  return (
    <div className="divide-y divide-brand-50">
      {appointments.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium text-brand-900">
              {formatDate(a.appointment_date)} · {formatTime(a.start_time)}
            </p>
            <p className="text-xs text-brand-500">
              {showPatient && a.patient?.full_name}
              {showPatient && showDoctor && ' with '}
              {showDoctor && `Dr. ${a.doctor?.profile?.full_name ?? ''}`}
              {!showPatient && !showDoctor && (a.reason ?? 'Consultation')}
            </p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}

function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, monthRevenue: 0, pendingLab: 0 });
  const [recent, setRecent] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date();
      monthStart.setDate(1);

      const [{ count: patients }, { count: todayAppts }, { data: payments }, { count: pendingLab }, { data: recentAppts }] =
        await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayISO()),
          supabase.from('payments').select('amount').gte('payment_date', monthStart.toISOString()),
          supabase.from('lab_orders').select('id', { count: 'exact', head: true }).in('status', ['ordered', 'sample_collected', 'in_progress']),
          supabase
            .from('appointments')
            .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*))')
            .eq('appointment_date', todayISO())
            .order('start_time')
            .limit(6),
        ]);

      setStats({
        patients: patients ?? 0,
        todayAppts: todayAppts ?? 0,
        monthRevenue: (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0),
        pendingLab: pendingLab ?? 0,
      });
      setRecent((recentAppts as Appointment[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={stats.patients} icon={Users} accent="brand" />
        <StatCard label="Today's Appointments" value={stats.todayAppts} icon={CalendarDays} accent="sky" />
        <StatCard label="Revenue This Month" value={formatCurrency(stats.monthRevenue)} icon={Receipt} accent="emerald" />
        <StatCard label="Pending Lab Orders" value={stats.pendingLab} icon={FlaskConical} accent="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
          <Link to="/dashboard/appointments" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <AppointmentsList appointments={recent} showDoctor />
        </CardContent>
      </Card>
    </div>
  );
}

function DoctorOverview({ doctorId }: { doctorId: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, patients: 0, pendingFollowUps: 0 });
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: today }, { count: patients }, { count: followUps }, { data: appts }] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('appointment_date', todayISO()),
        supabase.from('consultations').select('patient_id', { count: 'exact', head: true }).eq('doctor_id', doctorId),
        supabase.from('consultations').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).gte('follow_up_date', todayISO()),
        supabase
          .from('appointments')
          .select('*, patient:patients(*)')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', todayISO())
          .order('start_time'),
      ]);
      setStats({ today: today ?? 0, patients: patients ?? 0, pendingFollowUps: followUps ?? 0 });
      setTodayAppts((appts as Appointment[]) ?? []);
      setLoading(false);
    };
    load();
  }, [doctorId]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's Appointments" value={stats.today} icon={CalendarDays} accent="sky" />
        <StatCard label="Patients Seen (All Time)" value={stats.patients} icon={Users} accent="brand" />
        <StatCard label="Upcoming Follow-ups" value={stats.pendingFollowUps} icon={ClipboardList} accent="amber" />
      </div>
      <Card>
        <CardHeader><CardTitle>Today's Schedule</CardTitle></CardHeader>
        <CardContent><AppointmentsList appointments={todayAppts} /></CardContent>
      </Card>
    </div>
  );
}

function ReceptionistOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, newPatients: 0, pendingInvoices: 0 });
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: today }, { count: newPatients }, { count: pendingInvoices }, { data: appts }] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', todayISO()),
        supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', todayISO()),
        supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['pending', 'partially_paid', 'overdue']),
        supabase
          .from('appointments')
          .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*))')
          .eq('appointment_date', todayISO())
          .order('start_time'),
      ]);
      setStats({ today: today ?? 0, newPatients: newPatients ?? 0, pendingInvoices: pendingInvoices ?? 0 });
      setTodayAppts((appts as Appointment[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's Appointments" value={stats.today} icon={CalendarDays} accent="sky" />
        <StatCard label="New Patients Today" value={stats.newPatients} icon={Users} accent="brand" />
        <StatCard label="Pending Invoices" value={stats.pendingInvoices} icon={Receipt} accent="amber" />
      </div>
      <Card>
        <CardHeader><CardTitle>Today's Front Desk Schedule</CardTitle></CardHeader>
        <CardContent><AppointmentsList appointments={todayAppts} showDoctor /></CardContent>
      </Card>
    </div>
  );
}

function LabOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completedToday: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: pending }, { count: inProgress }, { count: completedToday }] = await Promise.all([
        supabase.from('lab_orders').select('id', { count: 'exact', head: true }).eq('status', 'ordered'),
        supabase.from('lab_orders').select('id', { count: 'exact', head: true }).in('status', ['sample_collected', 'in_progress']),
        supabase.from('lab_orders').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', todayISO()),
      ]);
      setStats({ pending: pending ?? 0, inProgress: inProgress ?? 0, completedToday: completedToday ?? 0 });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting Sample Collection" value={stats.pending} icon={FlaskConical} accent="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={FlaskConical} accent="sky" />
        <StatCard label="Completed Today" value={stats.completedToday} icon={ClipboardList} accent="emerald" />
      </div>
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <p className="text-sm text-brand-600">Head to the Lab &amp; Diagnostics section to process new orders.</p>
          <Link to="/dashboard/lab" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
            Open Lab Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
