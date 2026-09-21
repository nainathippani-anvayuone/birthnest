import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './mockSupabaseClient';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * True whenever no real Supabase project is configured. Every page in this
 * app talks to `supabase` exactly as it would against a real project — in
 * demo mode that object is actually `mockSupabaseClient`, an in-memory
 * stand-in seeded with sample data (see lib/demoData.ts). Nothing persists
 * across a page reload in this mode, and it never talks to the network.
 */
export const isDemoMode = !isSupabaseConfigured;

if (isDemoMode) {
  console.info(
    '[Birth Nest] Running in DEMO MODE — no Supabase project configured. ' +
      'All data is in-memory sample data and resets on reload. Log in from ' +
      'the "Try a demo account" panel on the login page. See .env.example ' +
      'to connect a real Supabase project instead.',
  );
}

/**
 * `persist` mirrors supabase-js's `persistSession` option: true for the
 * app's main client, false for the "ephemeral" client used for
 * staff-initiated account creation (see createEphemeralAuthClient below) so
 * that action never swaps the browser's logged-in session.
 */
function buildClient(persist: boolean): SupabaseClient {
  if (isDemoMode) {
    return createMockSupabaseClient(persist) as unknown as SupabaseClient;
  }
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: persist,
      persistSession: persist,
      detectSessionInUrl: persist,
    },
  });
}

export const supabase = buildClient(true);

/**
 * A throwaway client for staff-initiated account creation (registering a
 * walk-in patient, or an admin creating a doctor/receptionist/lab account).
 *
 * `supabase.auth.signUp()` on the main client would swap the *current*
 * browser session over to the newly created user — logging the admin/
 * receptionist out. This client never persists a session or touches
 * localStorage, so calling signUp on it cannot affect who is logged in.
 */
export function createEphemeralAuthClient(): SupabaseClient {
  return buildClient(false);
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
