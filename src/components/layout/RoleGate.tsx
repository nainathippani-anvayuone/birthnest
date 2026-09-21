import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export function RoleGate({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!profile || !roles.includes(profile.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description="This section is restricted to a different role. Contact an administrator if you believe this is a mistake."
      />
    );
  }

  return <>{children}</>;
}
