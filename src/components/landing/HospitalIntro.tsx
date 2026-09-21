import { Building2, Microscope, Users2, HeartHandshake } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Building2, title: 'Modern Facility', desc: 'A calm, dedicated women’s health clinic with private consultation and procedure rooms.' },
  { icon: Microscope, title: 'In-House Diagnostics', desc: 'On-site ultrasound and laboratory services for fast, accurate results.' },
  { icon: Users2, title: 'Dedicated Care Team', desc: 'Experienced nursing, reception and lab staff supporting every visit.' },
  { icon: HeartHandshake, title: 'Patient-First Approach', desc: 'Unhurried consultations and clear communication at every step.' },
];

export function HospitalIntro() {
  return (
    <section className="section-y bg-blush-50">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Welcome to Birth Nest</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">
            A nest built around your care
          </h2>
          <p className="mt-4 text-brand-700/90">
            Birth Nest is a dedicated gynaecology, pregnancy and fertility care clinic founded on one
            principle: every woman deserves attentive, unhurried, expert care. From routine checkups to
            complex fertility journeys, our team walks alongside you with clinical excellence and genuine
            compassion.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-serif text-base font-semibold text-brand-900">{h.title}</h3>
              <p className="mt-1.5 text-sm text-brand-600">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
