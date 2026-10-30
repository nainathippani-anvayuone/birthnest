import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { buttonClasses } from '@/components/ui/buttonClasses';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 text-center">
      <Logo />
      <div>
        <p className="font-serif text-6xl font-medium text-peach">404</p>
        <h1 className="mt-2 font-serif text-2xl font-medium">Page not found</h1>
        <p className="mt-1 text-sm text-muted">The page you're looking for doesn't exist or has moved.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('outline')}>
          Back to Homepage
        </Link>
        <Link to="/#book-appointment" className={buttonClasses('primary')}>
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
