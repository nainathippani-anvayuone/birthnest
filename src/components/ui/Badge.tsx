import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        'bg-brand-100 text-brand-700',
        className,
      )}
      {...props}
    />
  );
}

const STATUS_CLASSES: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  no_show: 'bg-gray-200 text-gray-700',
  ordered: 'bg-sky-100 text-sky-800',
  sample_collected: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  partially_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-rose-100 text-rose-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_CLASSES[status] ?? 'bg-brand-100 text-brand-700'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
