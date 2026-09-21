import { useEffect, useState } from 'react';
import { Bell, CalendarDays, FlaskConical, Receipt, Pill, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/formatters';
import type { Notification, NotificationType } from '@/types';

const ICONS: Record<NotificationType, typeof Bell> = {
  appointment: CalendarDays,
  lab_result: FlaskConical,
  payment: Receipt,
  prescription: Pill,
  reminder: Bell,
  general: Bell,
};

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notifications-page-${user!.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user!.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Appointment reminders, lab results, prescriptions and payment updates."
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </Button>
          )
        }
      />

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="New updates will show up here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  n.is_read ? 'border-brand-100 bg-white' : 'border-brand-200 bg-brand-50/60',
                )}
              >
                <div className={cn('mt-0.5 rounded-lg p-2', n.is_read ? 'bg-brand-50 text-brand-400' : 'bg-brand-600 text-white')}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm', n.is_read ? 'font-medium text-brand-700' : 'font-semibold text-brand-900')}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-brand-500">{n.message}</p>
                  <p className="mt-1 text-xs text-brand-300">{formatDateTime(n.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
