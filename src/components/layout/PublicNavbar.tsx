import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { buttonClasses } from '@/components/ui/buttonClasses';

const LINKS = [
  { href: '#care', label: 'Our Care' },
  { href: '#doctor', label: 'Dr. Mythri' },
  { href: '#journey', label: 'Programmes' },
  { href: '#contact', label: 'Contact' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(103,84,74,0.14)] bg-[rgba(245,239,229,0.94)] backdrop-blur-[16px]">
      <nav className="container-app flex h-[70px] items-center justify-between gap-7 desk:h-[82px]">
        <a href="#top" onClick={close} aria-label="Birth Nest — back to top">
          <Logo />
        </a>

        <div className="hidden items-center gap-6 text-[0.9rem] font-[650] desk:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-clay">
              {link.label}
            </a>
          ))}
          <a href="#book-appointment" className={buttonClasses('primary', 'sm')}>
            Book Appointment
          </a>
        </div>

        <button
          type="button"
          className="p-1 text-ink desk:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-cream desk:hidden">
          <div className="container-app flex flex-col py-3 text-[0.95rem] font-[650]">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={close} className="border-b border-line/60 py-3">
                {link.label}
              </a>
            ))}
            <a href="#book-appointment" onClick={close} className={buttonClasses('primary', 'md', 'mt-4')}>
              Book Appointment
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
