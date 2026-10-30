import { useState } from 'react';
import { buttonClasses } from '@/components/ui/buttonClasses';

// Doctor facts below are taken verbatim from the doctor's reference website
// and are pending the clinic's final confirmation before production.
const CREDENTIALS = [
  { title: 'MBBS, DGO, DNB (OBG)', detail: 'Obstetrician & Gynaecologist' },
  { title: 'Senior Consultant', detail: 'Apollo Cradle, Jubilee Hills' },
];

const HIGHLIGHTS = [
  'Special interest in high-risk and complex pregnancy care',
  'Telangana Vaidyaratna Award 2022 – Best Young Gynaecologist',
  'Subbalaxmi Memorial Award, KMC Manipal',
  <>
    Author of <em>DNB Topic Wise Question Bank</em>
  </>,
  'Consultations in English, Telugu, Hindi, Kannada and Tamil',
];

export function DoctorProfile() {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <section id="doctor" className="section-y">
      <div className="container-app grid items-center gap-14 desk:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[40px] bg-sand p-6 desk:p-[42px]">
          {/* Reference arch frame with Dr. Mythri's photo; the "MS" initials
              from the reference stay underneath as a fallback. */}
          <div className="relative grid h-[240px] place-items-center overflow-hidden rounded-[160px_160px_28px_28px] bg-[linear-gradient(160deg,#79675c,#b6a08e)] font-serif text-[6rem] font-semibold text-[#f3eadf] desk:h-[290px] desk:text-[8rem]">
            <span aria-hidden="true">MS</span>
            {photoOk && (
              <img
                src="/doctor-mythri-sharan.jpg"
                alt="Dr. Mythri Sharan"
                className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                onError={() => setPhotoOk(false)}
              />
            )}
          </div>
          <div className="mt-[26px] grid gap-3 desk:grid-cols-2">
            {CREDENTIALS.map((c) => (
              <div key={c.title} className="border-t border-line p-[15px] text-[0.92rem]">
                <b>{c.title}</b>
                <br />
                {c.detail}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow">Meet your doctor</div>
          <h2 className="my-2.5 font-serif text-[clamp(2.5rem,4vw,4.2rem)] leading-[1.05] font-medium">
            Dr. Mythri Sharan
          </h2>
          <p className="text-[1.15rem] text-[#73584c]">
            High-Risk Pregnancy Specialist • Normal Delivery Specialist • Founder, Birth Nest
          </p>
          <p className="mt-4">
            Dr. Mythri believes that good healthcare begins with listening. Her approach combines evidence-based
            treatment with clear explanations, practical guidance and compassionate support—especially during
            pregnancies that need closer monitoring.
          </p>
          <ul className="my-[25px] grid gap-[11px] p-0">
            {HIGHLIGHTS.map((item, i) => (
              <li key={i} className="flex list-none items-start">
                <span
                  aria-hidden="true"
                  className="mr-2.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ead3bc] font-extrabold text-clay"
                >
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a href="#book-appointment" className={buttonClasses('outline')}>
            Book with Dr. Mythri
          </a>
        </div>
      </div>
    </section>
  );
}
