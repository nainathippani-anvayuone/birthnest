import { buttonClasses } from '@/components/ui/buttonClasses';
import { DIRECTIONS_URL, INSTAGRAM_URL } from '@/utils/links';

// Fixed bottom bar shown on tablet and phone widths only. Directions appear
// once a confirmed destination is configured; until then the reference's
// other contact action (Message) takes its place.
export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 gap-2.5 border-t border-line bg-[rgba(245,239,229,0.96)] px-3.5 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] backdrop-blur-[16px] desk:hidden">
      {DIRECTIONS_URL ? (
        <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className={buttonClasses('outline')}>
          Directions
        </a>
      ) : (
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={buttonClasses('outline')}>
          Message
        </a>
      )}
      <a href="#book-appointment" className={buttonClasses('primary')}>
        Book
      </a>
    </div>
  );
}
