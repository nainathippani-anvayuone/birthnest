import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  lab_staff: 'Lab / Diagnostics',
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: 'bg-brand-700 text-white',
  doctor: 'bg-emerald-100 text-emerald-800',
  receptionist: 'bg-sky-100 text-sky-800',
  lab_staff: 'bg-amber-100 text-amber-800',
};

export const ALL_ROLES: UserRole[] = ['admin', 'doctor', 'receptionist', 'lab_staff'];
