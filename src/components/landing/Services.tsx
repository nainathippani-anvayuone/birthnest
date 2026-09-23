import { Sparkles } from 'lucide-react';
import { usePublicServices } from '@/hooks/usePublicContent';
import { Spinner } from '@/components/ui/Spinner';

const CATEGORY_LABELS: Record<string, string> = {
  consultation: 'Consultations',
  pregnancy_care: 'Pregnancy Care',
  ultrasound: 'Ultrasound & Imaging',
  fertility_care: 'Fertility Care',
  diagnostics: 'Diagnostics',
  gynaecology_procedure: 'Gynaecology Procedures',
  laboratory: 'Laboratory Tests',
};

export function Services() {
  const { services, loading } = usePublicServices();

  return (
    <section id="services" className="section-y bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">What We Offer</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Comprehensive Women's Health Services</h2>
          <p className="mt-4 text-brand-700/90">
            From routine consultations to advanced fertility treatment, everything is delivered under one
            roof, by one trusted team.
          </p>
        </div>

        <div className="mt-12">
          {loading ? (
            <Spinner label="Loading services…" />
          ) : services.length === 0 ? (
            <FallbackServiceGrid />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <div key={s.id} className="rounded-2xl border border-brand-100 bg-blush-50/60 p-6 transition-shadow hover:shadow-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {CATEGORY_LABELS[s.category] ?? s.category}
                  </span>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-brand-900">{s.name}</h3>
                  {s.description && <p className="mt-1.5 text-sm text-brand-600">{s.description}</p>}
                  <div className="mt-4 text-sm text-brand-400">{s.duration_minutes} min</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const FALLBACK = [
  'Gynaecology Consultations', 'Antenatal & Pregnancy Care', '2D/4D Ultrasound & Imaging',
  'Infertility & Fertility Care', 'Gynaecology Procedures', 'Laboratory & Diagnostic Tests',
];

function FallbackServiceGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FALLBACK.map((name) => (
        <div key={name} className="rounded-2xl border border-brand-100 bg-blush-50/60 p-6">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <h3 className="mt-3 font-serif text-lg font-semibold text-brand-900">{name}</h3>
        </div>
      ))}
    </div>
  );
}
