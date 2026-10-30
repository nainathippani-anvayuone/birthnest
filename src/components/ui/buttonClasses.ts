import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'outline' | 'inverse' | 'outlineInverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-ink bg-ink text-white focus-visible:outline-ink',
  outline: 'border-[#ad8b76] bg-transparent text-ink focus-visible:outline-clay',
  inverse: 'border-white bg-white text-ink focus-visible:outline-white',
  outlineInverse: 'border-white/60 bg-transparent text-white focus-visible:outline-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[0.9rem]',
  md: 'text-base',
  lg: 'text-base',
};

// Pill button from the reference design. Shared by <Button> and by anchor
// links (in-page booking links, Instagram, Maps) so both look identical.
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-[22px] font-[750] transition duration-200',
    'hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(67,41,31,0.18)]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
