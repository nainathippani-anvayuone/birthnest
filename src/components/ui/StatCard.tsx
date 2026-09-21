import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: 'brand' | 'emerald' | 'amber' | 'sky';
}

const accentClasses = {
  brand: 'bg-brand-100 text-brand-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
};

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent = 'brand' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-500">{label}</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-brand-900">{value}</p>
        </div>
        <div className={cn('rounded-xl p-2.5', accentClasses[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p className={cn('mt-3 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-brand-400')}>{trend}</p>
      )}
    </Card>
  );
}
