import { AtSign, ArrowUpRight } from 'lucide-react';

const INSTAGRAM_HANDLE = 'dr_mythrisharan';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

// Public reel embed URLs — no API key needed, same mechanism as Instagram's own
// "Embed" button. Update these shortcodes from the profile whenever the
// featured posts should change.
const REEL_SHORTCODES = ['DYbQR-KAVq8', 'DV3VXixk1h7', 'DOhzCteE-Rk'];

export function InstagramSection() {
  return (
    <section id="instagram" className="section-y bg-white">
      <div className="container-app">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-500">
              <AtSign className="h-4 w-4" />
              {INSTAGRAM_HANDLE}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">From Our Instagram</h2>
            <p className="mt-3 max-w-xl text-brand-700/90">
              Real patient stories, women's health tips, and behind-the-scenes moments from the clinic —
              follow along for more.
            </p>
          </div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            Follow on Instagram
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REEL_SHORTCODES.map((code) => (
            <div key={code} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
              <iframe
                title={`Birth Nest Instagram reel ${code}`}
                src={`https://www.instagram.com/reel/${code}/embed`}
                className="h-[620px] w-full"
                loading="lazy"
                scrolling="no"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
