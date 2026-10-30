import { usePublicTestimonials } from '@/hooks/usePublicContent';
import { Spinner } from '@/components/ui/Spinner';
import { initials } from '@/utils/formatters';

export function Testimonials() {
  const { testimonials, loading } = usePublicTestimonials();

  return (
    <section id="testimonials" className="section-y border-y border-line bg-paper">
      <div className="container-app">
        <div className="mx-auto max-w-[850px] text-center">
          <div className="eyebrow">Patient stories</div>
          <h2 className="section-title">What our patients say</h2>
        </div>

        <div className="mt-11">
          {loading ? (
            <Spinner label="Loading testimonials…" />
          ) : (
            <div className="grid gap-[18px] xs:grid-cols-2 desk:grid-cols-3">
              {(testimonials.length ? testimonials : FALLBACK).map((t, i) => (
                <figure key={i} className="card-ref m-0 flex flex-col !bg-cream">
                  <div className="flex gap-0.5 text-peach" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx} aria-hidden="true" className={idx < t.rating ? '' : 'text-line'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <blockquote className="m-0 mt-3 flex-1 font-serif text-[1.08rem] leading-[1.45]">
                    “{t.message}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-xs font-bold text-clay">
                      {initials(t.patient_name)}
                    </span>
                    <span className="text-sm font-[650]">{t.patient_name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Real patient testimonials, sourced verbatim from drmythrisharan.com
// (Dr. Mythri Sharan's own clinic site) — used only if the `testimonials`
// table is empty or unreachable.
const FALLBACK = [
  {
    patient_name: 'Aishwarya Sai',
    rating: 5,
    message:
      'We are so thankful to Dr. Mythri Sharan for being with us in our pregnancy journey. From the very beginning, she was very kind, calm, and clear in her explanations.',
  },
  {
    patient_name: 'Gayathri Mantha',
    rating: 5,
    message:
      "I recently delivered my twins under the care of Dr. Mythri, and I can say with all my heart — she is truly the best. She wasn't just my doctor — she became a friend, a guide, and a part of our family.",
  },
  {
    patient_name: 'Rizwana Angel',
    rating: 5,
    message:
      "I had the pleasure of having Dr. Mythri Ma'am as my gynecologist at Apollo Cradle Hospital. From the moment I met her, she exuded confidence and warmth, which immediately put me at ease.",
  },
  {
    patient_name: 'Neelima Palavali',
    rating: 5,
    message:
      "I'm incredibly grateful to Dr. Mythri Sharan for her exceptional care during my twin pregnancy. Her compassion, expertise, and constant support provided so much comfort throughout the journey.",
  },
  {
    patient_name: 'Nadia Basree',
    rating: 5,
    message:
      'Dr. Mythri Sharan is truly one of the best gynecologists I have met. She combines deep medical expertise with a genuinely caring and empathetic approach.',
  },
  {
    patient_name: 'Aditi Garg',
    rating: 5,
    message:
      "I'd like to express my heartfelt gratitude to Mythri mam for her exceptional care and dedication throughout my pregnancy.",
  },
];
