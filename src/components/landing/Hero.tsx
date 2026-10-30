import { buttonClasses } from '@/components/ui/buttonClasses';

const TRUST_POINTS = ['Unhurried consultations', 'Evidence-based care', 'Under one roof'];

export function Hero() {
  return (
    <section className="overflow-hidden pt-[52px] pb-[45px] desk:pt-[84px] desk:pb-16">
      <div className="container-app grid items-center gap-[54px] desk:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="eyebrow">Women’s care in Khajaguda, Hyderabad</div>
          <h1 className="mt-[18px] mb-6 font-serif text-[3rem] leading-[0.98] font-medium tracking-[-0.045em] xs:text-[3.55rem] desk:text-[clamp(3.1rem,6vw,6.15rem)]">
            Care that listens.
            <br />
            <em className="text-clay not-italic">Expertise that reassures.</em>
          </h1>
          <p className="mb-8 max-w-[670px] text-[1.03rem] text-[#6f5d54] xs:text-[1.18rem]">
            Personalised care for every stage of womanhood—from periods, PCOS and pregnancy to motherhood,
            intimate wellness and menopause.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#book-appointment" className={buttonClasses('primary', 'md', 'w-full xs:w-auto')}>
              Book an Appointment
            </a>
            <a href="#care" className={buttonClasses('outline', 'md', 'w-full xs:w-auto')}>
              Explore Our Care
            </a>
          </div>
          <div className="mt-[35px] flex flex-wrap gap-[22px] text-[0.88rem] text-[#6f5d54]">
            {TRUST_POINTS.map((point) => (
              <span key={point}>
                <span aria-hidden="true" className="mr-2 text-clay">✦</span>
                {point}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[350px] items-end rounded-[150px_150px_28px_28px] bg-[linear-gradient(145deg,#e8ddce,#bda896)] p-[38px] shadow-soft desk:min-h-[520px] desk:rounded-[220px_220px_34px_34px]">
          <div
            aria-hidden="true"
            className="absolute inset-5 rounded-[200px_200px_26px_26px] border border-white/50"
          />
          <figure className="relative m-0 rounded-[22px] bg-[rgba(255,253,250,0.92)] p-[26px] shadow-[0_12px_30px_rgba(68,38,22,0.12)]">
            <blockquote className="m-0 font-serif text-[1.18rem] leading-[1.35] font-medium desk:text-[1.35rem]">
              “You deserve to understand your health, feel heard and receive care designed around you.”
            </blockquote>
            <figcaption className="mt-3.5 text-sm font-[750] text-clay">— Dr. Mythri Sharan, Founder</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
