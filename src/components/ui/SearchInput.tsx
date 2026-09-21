import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300" />
      <input
        type="search"
        className="w-full rounded-lg border border-brand-200 bg-white py-2 pl-9 pr-3 text-sm text-brand-900 placeholder:text-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        {...props}
      />
    </div>
  );
}
