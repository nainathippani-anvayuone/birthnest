import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  Receipt,
  PackagePlus,
  Sparkles,
  BarChart3,
  Bell,
  UserCog,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'lab_staff'], end: true },
  { to: '/dashboard/patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'receptionist', 'lab_staff'] },
  { to: '/dashboard/appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'receptionist'] },
  { to: '/dashboard/schedules', label: 'Doctor Schedules', icon: Stethoscope, roles: ['admin', 'doctor'] },
  { to: '/dashboard/consultations', label: 'Consultations', icon: ClipboardList, roles: ['admin', 'doctor'] },
  { to: '/dashboard/prescriptions', label: 'Prescriptions', icon: Pill, roles: ['admin', 'doctor'] },
  { to: '/dashboard/lab', label: 'Lab & Diagnostics', icon: FlaskConical, roles: ['admin', 'doctor', 'lab_staff', 'receptionist'] },
  { to: '/dashboard/billing', label: 'Billing & Payments', icon: Receipt, roles: ['admin', 'receptionist'] },
  { to: '/dashboard/pharmacy', label: 'Pharmacy', icon: PackagePlus, roles: ['admin', 'receptionist'] },
  { to: '/dashboard/services', label: 'Services', icon: Sparkles, roles: ['admin'] },
  { to: '/dashboard/users', label: 'Staff & Users', icon: UserPlus, roles: ['admin'] },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'doctor', 'receptionist', 'lab_staff'] },
  { to: '/dashboard/profile', label: 'My Profile', icon: UserCog, roles: ['admin', 'doctor', 'receptionist', 'lab_staff'] },
];

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
