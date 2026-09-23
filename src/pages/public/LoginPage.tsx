import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Eye,
  EyeOff,
  Pill,
  Calendar,
  Venus,
  HeartPulse,
  Heart,
  Baby,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoMode } from '@/lib/supabase';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/demoData';

const DEMO_ICONS = {
  admin: ShieldCheck,
  doctor: Stethoscope,
  receptionist: ClipboardList,
  lab_staff: FlaskConical,
} as const;

export function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoadingId, setDemoLoadingId] = useState<string | null>(null);

  if (!loading && user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate('/dashboard');
  };

  const handleDemoLogin = async (accountEmail: string, id: string) => {
    setDemoLoadingId(id);
    setError(null);
    const { error: signInError } = await signIn(accountEmail, DEMO_PASSWORD);
    setDemoLoadingId(null);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[480px] lg:shrink-0 xl:w-[540px]">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex">
            <Logo />
          </Link>

          <h1 className="mt-10 font-serif text-3xl font-bold text-brand-900">Welcome back</h1>
          <p className="mt-1 text-sm text-brand-500">Sign in to the Birth Nest staff dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@birthnest.clinic"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-brand-300 hover:text-brand-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              }
            />
            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-400">
            Accounts are created by an administrator — contact yours if you need access.
          </p>
          <p className="mt-4 text-center text-sm">
            <Link to="/" className="font-medium text-brand-500 hover:text-brand-700 hover:underline">
              ← Back to homepage
            </Link>
          </p>

          {isDemoMode && (
            <div className="mt-8 rounded-2xl border border-brand-200 bg-blush-50/60 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <h2 className="font-serif text-base font-semibold text-brand-900">Try a demo account</h2>
              </div>
              <p className="mt-1 text-xs text-brand-500">
                No Supabase project is connected — explore the dashboard instantly with sample data.
              </p>

              <div className="mt-4 space-y-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = DEMO_ICONS[account.role];
                  return (
                    <button
                      key={account.id}
                      onClick={() => handleDemoLogin(account.email, account.id)}
                      disabled={demoLoadingId !== null}
                      className="flex w-full items-center gap-3 rounded-xl border border-brand-100 bg-white px-4 py-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-900">{account.label}</p>
                        <p className="text-xs text-brand-400">{account.full_name} · {account.email}</p>
                      </div>
                      {demoLoadingId === account.id && (
                        <span className="text-xs font-medium text-brand-400">Signing in…</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-brand-300">
                Demo password: <code className="rounded bg-white px-1.5 py-0.5">{DEMO_PASSWORD}</code> — works
                for any of the emails above if you'd rather type it in yourself.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-b from-blush-50 via-brand-50 to-brand-100 lg:block">
        {/* Backdrop circle, vertically centered, behind everything */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/70 xl:h-[34rem] xl:w-[34rem]"
        />
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 z-10 h-36 w-auto -translate-x-1/2 -translate-y-1/2 opacity-90 xl:h-44"
        />

        {/* Clinic wordmark */}
        <div className="relative z-10 pt-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">Birth Nest Clinic</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-brand-900">Compassionate Women's Care</h2>
        </div>

        <p className="absolute bottom-14 left-1/2 z-10 max-w-xs -translate-x-1/2 text-center font-serif text-lg font-semibold text-brand-800">
          For every chapter of motherhood &amp; womanhood.
        </p>

        {/* Floating icon badges, spread across the full height */}
        <IconBadge icon={Pill} className="left-[10%] top-[12%] h-14 w-14" iconClassName="h-6 w-6" />
        <IconBadge icon={Calendar} className="right-[11%] top-[10%] h-16 w-16" iconClassName="h-7 w-7" />
        <IconBadge icon={Venus} className="left-[6%] top-[36%] h-12 w-12" iconClassName="h-5 w-5" />
        <IconBadge icon={HeartPulse} className="right-[7%] top-[34%] h-14 w-14" iconClassName="h-6 w-6" />
        <IconBadge icon={Stethoscope} className="left-[7%] top-[62%] h-14 w-14" iconClassName="h-6 w-6" />
        <IconBadge icon={ClipboardList} className="right-[8%] top-[60%] h-14 w-14" iconClassName="h-6 w-6" />
        <IconBadge icon={Baby} className="left-[13%] bottom-[10%] h-12 w-12" iconClassName="h-5 w-5" />
        <IconBadge icon={ShieldCheck} className="right-[13%] bottom-[9%] h-12 w-12" iconClassName="h-5 w-5" />
        <Heart aria-hidden="true" className="absolute left-[26%] top-[22%] h-4 w-4 fill-brand-300 text-brand-300" />
        <Heart aria-hidden="true" className="absolute right-[24%] top-[52%] h-5 w-5 fill-brand-300 text-brand-300" />
        <Sparkles aria-hidden="true" className="absolute left-[22%] bottom-[26%] h-5 w-5 text-brand-300" />
        <Sparkles aria-hidden="true" className="absolute right-[20%] top-[76%] h-4 w-4 text-brand-300" />
      </div>
    </div>
  );
}

function IconBadge({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: typeof Pill;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute z-10 flex items-center justify-center rounded-full bg-white text-brand-600 shadow-lg ${className ?? ''}`}
    >
      <Icon className={iconClassName ?? 'h-5 w-5'} />
    </div>
  );
}
