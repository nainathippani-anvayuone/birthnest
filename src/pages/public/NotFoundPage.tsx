import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-blush-50 px-4 text-center">
      <Logo />
      <div>
        <p className="font-serif text-6xl font-bold text-brand-300">404</p>
        <h1 className="mt-2 text-xl font-semibold text-brand-900">Page not found</h1>
        <p className="mt-1 text-sm text-brand-500">The page you're looking for doesn't exist or has moved.</p>
      </div>
      <Link to="/">
        <Button>Back to Homepage</Button>
      </Link>
    </div>
  );
}
