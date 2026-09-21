import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Spinner({ className, label = 'Loading…' }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-brand-400', className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
