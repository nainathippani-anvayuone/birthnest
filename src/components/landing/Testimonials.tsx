import { Star, Quote } from 'lucide-react';
import { usePublicTestimonials } from '@/hooks/usePublicContent';
import { Spinner } from '@/components/ui/Spinner';
import { initials } from '@/utils/formatters';

export function Testimonials() {
  const { testimonials, loading } = usePublicTestimonials();

  return (
    <section id="testimonials" className="section-y bg-white">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Patient Stories</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">What Our Patients Say</h2>
        </div>

        <div className="mt-12">
          {loading ? (
            <Spinner label="Loading testimonials…" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(testimonials.length ? testimonials : FALLBACK).map((t, i) => (
                <div key={i} className="relative rounded-2xl border border-brand-100 bg-blush-50/60 p-6">
                  <Quote className="h-6 w-6 text-brand-200" />
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${idx < t.rating ? 'fill-brand-500 text-brand-500' : 'text-brand-200'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-brand-700">{t.message}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-200 text-xs font-semibold text-brand-800">
                      {initials(t.patient_name)}
                    </div>
                    <p className="text-sm font-medium text-brand-900">{t.patient_name}</p>
                  </div>
                </div>
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
