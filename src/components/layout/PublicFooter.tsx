export function PublicFooter() {
  return (
    <footer className="border-t border-line pt-[35px] pb-[calc(110px+env(safe-area-inset-bottom,0px))] text-[0.87rem] text-[#7d6458] desk:pb-[90px]">
      <div className="container-app flex flex-wrap justify-between gap-5">
        <span>© {new Date().getFullYear()} Birth Nest Women Wellness Centre</span>
        <span>Health information on this website is educational and does not replace a medical consultation.</span>
      </div>
    </footer>
  );
}
