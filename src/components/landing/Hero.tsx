import { CalendarHeart, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-100 via-blush-50 to-white">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl"
      />

      <div className="container-app relative grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Trusted Women's Care in Hyderabad
          </span>

          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-brand-900 sm:text-5xl">
            Compassionate care for every chapter of{' '}
            <span className="text-brand-600">motherhood &amp; womanhood</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-brand-700/90 sm:text-lg">
            Birth Nest is Dr. Mythri Sharan's dedicated gynaecology and fertility clinic — combining
            experienced clinical care with a warm, personal touch, from your first consultation to
            delivery day and beyond.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => document.getElementById('book-appointment')?.scrollIntoView({ behavior: 'smooth' })}>
              <CalendarHeart className="h-5 w-5" />
              Book Appointment
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Meet Dr. Mythri Sharan
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Stat value="14+" label="Years of experience" />
            <Stat value="8,000+" label="Deliveries & procedures" />
            <Stat value="98%" label="Patient satisfaction" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-[2.5rem] border border-brand-100 bg-white p-8 shadow-xl">
            <img
              src="/doctor-mythri-sharan.jpg"
              alt="Dr. Mythri Sharan"
              className="mx-auto h-40 w-40 rounded-2xl object-cover shadow-md sm:h-48 sm:w-48"
            />
            <div className="mt-6 space-y-4">
              <FeatureRow icon={ShieldCheck} text="Board-certified obstetrician & gynaecologist" />
              <FeatureRow icon={Sparkles} text="Modern ultrasound & in-house diagnostics" />
              <FeatureRow icon={CalendarHeart} text="Same-week appointments, most days" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-2xl font-bold text-brand-800">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-500">{label}</p>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-blush-50 px-4 py-3">
      <Icon className="h-5 w-5 shrink-0 text-brand-600" />
      <p className="text-sm font-medium text-brand-800">{text}</p>
    </div>
  );
}
