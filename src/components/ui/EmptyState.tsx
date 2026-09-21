import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-6 py-14 text-center">
      <Icon className="h-9 w-9 text-brand-300" />
      <div>
        <p className="font-medium text-brand-800">{title}</p>
        {description && <p className="mt-1 text-sm text-brand-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
