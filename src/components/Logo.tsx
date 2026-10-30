import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
}

// Reference "B" monogram tile with the Birth Nest wordmark.
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="grid h-11 w-11 place-items-center rounded-[14px] bg-ink font-serif text-[1.75rem] font-bold text-[#eadfce]"
      >
        B
      </span>
      <span>
        <strong className="block font-serif text-base font-bold tracking-[0.08em] desk:text-[1.15rem]">BIRTH NEST</strong>
        <small className="block text-[0.68rem] tracking-[0.19em] text-clay">WOMEN WELLNESS CENTRE</small>
      </span>
    </span>
  );
}
