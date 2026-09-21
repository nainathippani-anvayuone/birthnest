import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Returns false if the session is "valid" (a real JWT) but points at a
  // profile that no longer exists — e.g. the account was deleted directly
  // in the database. Without this, such a session sails through
  // ProtectedRoute (which only checks `user`) and then hangs forever on a
  // dashboard that's stuck waiting for a `profile` that will never arrive.
  const loadProfile = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return false;
    setProfile(data as Profile);
    return true;
  };

  useEffect(() => {
    let mounted = true;

    const hydrate = async (nextSession: Session | null) => {
      if (!nextSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }
      const ok = await loadProfile(nextSession.user.id);
      if (!mounted) return;
      if (!ok) {
        // Stale/orphaned session — sign out so the user lands back on
        // /login instead of a blank, permanently-loading dashboard.
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }
      setSession(nextSession);
      setUser(nextSession.user);
    };

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      await hydrate(data.session);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      await hydrate(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const value = useMemo(
    () => ({ user, session, profile, loading, signIn, signOut, refreshProfile }),
    [user, session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
