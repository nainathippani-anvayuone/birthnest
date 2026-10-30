import { usePublicServices } from '@/hooks/usePublicContent';
import { Spinner } from '@/components/ui/Spinner';

const CARE_AREAS = [
  {
    title: 'Pregnancy & Birth Care',
    desc: 'Preconception counselling, antenatal care, birth preparation and personalised support through delivery.',
  },
  {
    title: 'High-Risk Pregnancy',
    desc: 'Care for IUGR, twins, diabetes, thyroid disorders, hypertension, recurrent loss and cervical incompetence.',
  },
  {
    title: 'Periods, PCOS & Gynaecology',
    desc: 'Evaluation and care for irregular or painful periods, heavy bleeding, fibroids, cysts and endometriosis.',
  },
  {
    title: 'Fertility Guidance',
    desc: 'Preconception assessment, ovulation guidance and fertility counselling, with timely referral when advanced treatment is needed.',
  },
  {
    title: 'Postnatal Recovery',
    desc: 'Lactation, nutrition, pelvic-floor care, diastasis recovery, emotional wellness and return-to-fitness support.',
  },
  {
    title: 'Intimate & Menopause Wellness',
    desc: 'Private, respectful care for dryness, painful intercourse, urinary leakage and menopausal concerns.',
  },
  {
    title: 'Ultrasound & Diagnostics',
    desc: 'Pregnancy and gynaecology ultrasound, follicular monitoring and convenient laboratory sample collection.',
  },
  {
    title: 'Preventive Women’s Health',
    desc: 'Routine check-ups, cervical screening, contraception and age-appropriate health guidance.',
  },
];

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
  return (
    <section id="care" className="section-y bg-ink text-[#fff7ed]">
      <div className="container-app">
        <div>
          <div className="eyebrow !text-[#d6c1af]">How we care for you</div>
          <h2 className="section-title">Complete women’s healthcare, thoughtfully connected</h2>
          <p className="section-lead !text-[#ded0c4]">Choose the area that best describes what you need today.</p>
        </div>

        <div className="mt-[42px] grid gap-4 desk:grid-cols-2">
          {CARE_AREAS.map((area) => (
            <article key={area.title} className="rounded-3xl border border-white/16 bg-white/[0.055] p-[27px]">
              <h3 className="mb-[7px] font-serif text-[1.35rem] font-semibold">{area.title}</h3>
              <p className="m-0 text-[#dfc9bc]">{area.desc}</p>
            </article>
          ))}
        </div>

        <LiveServices />
      </div>
    </section>
  );
}

// Services currently listed in the database (managed from the admin app).
// Only name, category and duration are shown: prices and the free-text
// descriptions stay out until the clinic has reviewed them against the care
// areas above. The list hides itself if it is empty or can't be loaded.
function LiveServices() {
  const { services, loading } = usePublicServices();

  if (loading) return <Spinner label="Loading services…" className="mt-10 py-6 text-[#ded0c4]" />;
  if (services.length === 0) return null;

  return (
    <div className="mt-14 border-t border-white/16 pt-10">
      <h3 className="font-serif text-[1.6rem] font-medium">Services &amp; consultations</h3>
      <ul className="mt-6 grid gap-x-8 gap-y-5 p-0 xs:grid-cols-2 desk:grid-cols-3">
        {services.map((s) => (
          <li key={s.id} className="list-none border-t border-white/10 pt-4">
            <span className="text-[0.7rem] font-bold tracking-[0.15em] text-[#d6c1af] uppercase">
              {CATEGORY_LABELS[s.category] ?? s.category}
            </span>
            <p className="mt-1 font-semibold">{s.name}</p>
            <p className="mt-1 text-[0.85rem] text-[#c9b29d]">{s.duration_minutes} min</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
