import { createEphemeralAuthClient, generateTempPassword, isDemoMode, supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

interface DoctorDetails {
  specialization?: string;
  qualifications?: string;
  experience_years?: number;
  consultation_fee?: number;
}

interface ProvisionParams {
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  doctor?: DoctorDetails;
}

interface ProvisionResult {
  userId: string;
  tempPassword: string;
}

/**
 * Creates a doctor/receptionist/lab_staff/admin account on behalf of the
 * current admin. Patients are never logins — the "Register Patient" flow
 * inserts a plain row into `patients` directly and never touches this.
 *
 * - Real backend: calls the `provision-account` Edge Function, which uses
 *   the service-role key to create the user with a generated temp password
 *   (returned once, to hand to the new user) and writes the profiles.role /
 *   doctors row atomically. None of that is possible from the browser with
 *   only the anon key.
 * - Demo mode: there is no server to call, so this does the equivalent work
 *   directly against the in-memory mock store via a throwaway client, so
 *   the calling admin's own session is never disturbed.
 */
export async function provisionAccount(params: ProvisionParams): Promise<ProvisionResult> {
  return isDemoMode ? provisionDemoAccount(params) : provisionRealAccount(params);
}

async function provisionRealAccount(params: ProvisionParams): Promise<ProvisionResult> {
  const { data, error } = await supabase.functions.invoke('provision-account', {
    body: {
      email: params.email,
      full_name: params.fullName,
      phone: params.phone,
      role: params.role,
      doctor: params.doctor,
    },
  });

  if (error) throw new Error(error.message ?? 'Failed to create account.');
  const result = data as { userId?: string; tempPassword?: string; error?: string } | null;
  if (result?.error) throw new Error(result.error);
  if (!result?.userId || !result?.tempPassword) throw new Error('Failed to create account.');
  return { userId: result.userId, tempPassword: result.tempPassword };
}

async function provisionDemoAccount(params: ProvisionParams): Promise<ProvisionResult> {
  const ephemeral = createEphemeralAuthClient();
  const tempPassword = generateTempPassword();

  const { data, error } = await ephemeral.auth.signUp({
    email: params.email,
    password: tempPassword,
    options: { data: { full_name: params.fullName, phone: params.phone } },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Account could not be created.');
  const userId = data.user.id;

  await supabase.from('profiles').update({ role: params.role }).eq('id', userId);

  if (params.role === 'doctor') {
    const d = params.doctor ?? {};
    await supabase.from('doctors').insert({
      id: userId,
      specialization: d.specialization ?? 'Obstetrics & Gynaecology',
      qualifications: d.qualifications ?? '',
      experience_years: d.experience_years ?? 0,
      consultation_fee: d.consultation_fee ?? 0,
    });
  }

  return { userId, tempPassword };
}
