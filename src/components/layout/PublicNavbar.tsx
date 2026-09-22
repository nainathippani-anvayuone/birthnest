import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#why-us', label: 'Why Us' },
  { href: '#instagram', label: 'Instagram' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToBookAppointment = () => {
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#book-appointment');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors',
        scrolled ? 'bg-brand-100/95 shadow-sm backdrop-blur' : 'bg-brand-50/80 backdrop-blur',
      )}
    >
      <div className="container-app flex h-18 items-center justify-between py-3">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-brand-700 hover:text-brand-900">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-medium text-brand-700 xl:flex">
            <Phone className="h-4 w-4 shrink-0" />
            <a href="tel:+919734111222" className="hover:text-brand-900">+91 97341 11222</a>
            <span className="text-brand-300">/</span>
            <a href="tel:+918090100569" className="hover:text-brand-900">80901 00569</a>
          </div>
          {user ? (
            <Button size="sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={goToBookAppointment}>
                Book Appointment
              </Button>
            </>
          )}
        </div>

        <button className="rounded-lg p-2 text-brand-700 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-200 bg-brand-50 md:hidden">
          <div className="container-app flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex items-center gap-1.5 px-2 text-sm font-medium text-brand-700">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+919734111222" className="hover:text-brand-900">+91 97341 11222</a>
              <span className="text-brand-300">/</span>
              <a href="tel:+918090100569" className="hover:text-brand-900">80901 00569</a>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                  <Button onClick={goToBookAppointment}>Book Appointment</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
