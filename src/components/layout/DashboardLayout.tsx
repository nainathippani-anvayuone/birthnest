import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/lib/supabase';
import { navForRole } from '@/utils/nav';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/Badge';
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from '@/utils/roles';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { initials } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unread = useUnreadNotifications();

  if (!profile) return null;

  const items = navForRole(profile.role);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sidebarContent = (
    <>
      <div className="px-5 py-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-700 hover:bg-brand-50',
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
            {item.to === '/dashboard/notifications' && unread > 0 && (
              <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-brand-100 p-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-blush-50">
      <aside className="hidden w-64 flex-col border-r border-brand-100 bg-white lg:flex">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex h-full w-72 flex-col bg-white">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {isDemoMode && (
          <div className="flex items-center justify-center gap-1.5 bg-brand-600 px-3 py-1.5 text-center text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Demo Mode — sample data only, resets on reload. No Supabase project connected.
          </div>
        )}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden sm:block" />

          <div className="flex items-center gap-4">
            <NavLink to="/dashboard/notifications" className="relative rounded-lg p-2 text-brand-600 hover:bg-brand-50">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </NavLink>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {initials(profile.full_name)}
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-brand-900">{profile.full_name}</p>
                <Badge className={ROLE_BADGE_CLASSES[profile.role]}>{ROLE_LABELS[profile.role]}</Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
