import { Clock3, ShieldCheck, Stethoscope, Heart, HeartHandshake, FlaskConical } from 'lucide-react';

const REASONS = [
  { icon: Stethoscope, title: 'Expert, Experienced Care', desc: 'Led by Dr. Mythri Sharan with 14+ years of dedicated obstetric & gynaecological practice.' },
  { icon: Clock3, title: 'Timely Appointments', desc: 'Structured scheduling means minimal waiting and same-week availability.' },
  { icon: FlaskConical, title: 'In-House Diagnostics', desc: 'On-site ultrasound and lab testing for faster results and fewer visits elsewhere.' },
  { icon: ShieldCheck, title: 'Privacy & Safety', desc: 'Confidential records, secure digital systems, and a comfortable clinical environment.' },
  { icon: Heart, title: 'Continuity of Care', desc: 'See the same doctor from your first consultation through delivery and beyond.' },
  { icon: HeartHandshake, title: 'Personalised Attention', desc: 'Every treatment plan is tailored to your health, history and comfort.' },
];

export function WhyChooseUs() {
  return (
    <section id="why-us" className="section-y bg-blush-50">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Why Choose Birth Nest</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Care That Puts You First</h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div key={r.title} className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                <r.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-brand-900">{r.title}</h3>
                <p className="mt-1 text-sm text-brand-600">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
