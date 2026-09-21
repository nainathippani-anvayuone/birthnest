import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
  variant?: 'dark' | 'light';
}

export function Logo({ className, markClassName, showTagline = true, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? 'text-brand-800' : 'text-white';
  const taglineColor = variant === 'dark' ? 'text-brand-400' : 'text-white/70';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img src="/logo-mark.svg" alt="" aria-hidden="true" className={cn('h-9 w-auto', markClassName)} />
      <div className="leading-tight">
        <p className={cn('font-serif text-lg font-bold tracking-wide', textColor)}>BIRTH NEST</p>
        {showTagline && (
          <p className={cn('text-[10px] font-medium uppercase tracking-[0.2em]', taglineColor)}>
            Dr. Mythri Sharan
          </p>
        )}
      </div>
    </div>
  );
}
