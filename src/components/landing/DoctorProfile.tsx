import { GraduationCap, Award, Stethoscope, HeartPulse, ArrowUpRight } from 'lucide-react';

const CREDENTIALS = [
  { icon: GraduationCap, label: 'MBBS, DGO, DNB' },
  { icon: Award, label: 'SumanTV Doctor Award recipient' },
  { icon: Stethoscope, label: '14+ years of clinical practice' },
  { icon: HeartPulse, label: '~80% normal delivery rate, even among high-risk cases' },
];

export function DoctorProfile() {
  return (
    <section id="about" className="section-y bg-white">
      <div className="container-app grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Meet Your Doctor</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Dr. Mythri Sharan</h2>
          <p className="mt-1 text-base font-medium text-brand-600">
            High-Risk Obstetrician &amp; Gynaecologist &middot; 14 Years Experience
          </p>

          <p className="mt-5 text-brand-700/90">
            High-Risk Obstetrician &amp; Gynecologist practicing in Hyderabad, India. Known for her
            patient-centric and evidence-based approach, she is highly acclaimed for promoting natural
            births, maintaining an estimated 80% normal delivery rate even among high-risk cases. Her
            excellence in maternal care was formally recognized when she received the prestigious SumanTV
            Doctor Award.
          </p>

          <ul className="mt-6 space-y-3">
            {CREDENTIALS.map((c) => (
              <li key={c.label} className="flex items-start gap-3 text-sm text-brand-800">
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                {c.label}
              </li>
            ))}
          </ul>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-4 rounded-2xl bg-blush-50 p-5">
            <MiniStat value="14+" label="Years experience" />
            <MiniStat value="8,000+" label="Deliveries" />
            <MiniStat value="4.9/5" label="Patient rating" />
          </div>

          <a
            href="https://drmythrisharan.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            Visit Dr. Mythri Sharan's website
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative flex h-80 w-80 items-center justify-center rounded-[3rem] bg-gradient-to-br from-brand-100 to-blush-100 sm:h-96 sm:w-96">
            <div className="h-64 w-64 overflow-hidden rounded-full bg-white shadow-lg sm:h-72 sm:w-72">
              <img src="/doctor-mythri-sharan.jpg" alt="Dr. Mythri Sharan" className="h-full w-full object-cover" />
            </div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-md">
              Dr. Mythri Sharan, MBBS, DGO, DNB
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-xl font-bold text-brand-800">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-brand-500">{label}</p>
    </div>
  );
}
