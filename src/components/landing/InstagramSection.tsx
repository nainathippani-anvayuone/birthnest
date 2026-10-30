import { buttonClasses } from '@/components/ui/buttonClasses';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/utils/links';

// Public reel embed URLs — no API key needed, same mechanism as Instagram's own
// "Embed" button. Update these shortcodes from the profile whenever the
// featured posts should change.
const REEL_SHORTCODES = ['DYbQR-KAVq8', 'DV3VXixk1h7', 'DOhzCteE-Rk'];

export function InstagramSection() {
  return (
    <section id="instagram" className="section-y border-y border-line bg-paper">
      <div className="container-app">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <div className="eyebrow">@{INSTAGRAM_HANDLE}</div>
            <h2 className="section-title">From our Instagram</h2>
            <p className="section-lead m-0 max-w-xl">
              Real patient stories, women's health tips, and behind-the-scenes moments from the clinic — follow
              along for more.
            </p>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={buttonClasses('outline')}>
            Follow on Instagram
          </a>
        </div>

        {/* Three columns on desktop; a swipeable row below that, so the page
            doesn't stack three tall embeds on a phone. */}
        <div className="mt-10 flex snap-x snap-mandatory gap-[18px] overflow-x-auto pb-2 desk:grid desk:grid-cols-3 desk:overflow-visible desk:pb-0">
          {REEL_SHORTCODES.map((code) => (
            <div
              key={code}
              className="w-[min(82%,340px)] shrink-0 snap-start overflow-hidden rounded-[26px] border border-line bg-cream shadow-card desk:w-auto"
            >
              <iframe
                title={`Birth Nest Instagram reel ${code}`}
                src={`https://www.instagram.com/reel/${code}/embed`}
                className="block h-[620px] w-full border-0"
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
