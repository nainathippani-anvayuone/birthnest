const STAGES = [
  { num: '01', title: 'Understand', desc: 'Pregnancy education and reliable answers to common concerns.' },
  { num: '02', title: 'Prepare', desc: 'Nutrition, safe exercise, birth preparation and emotional support.' },
  { num: '03', title: 'Recover', desc: 'Postnatal nutrition, lactation, pelvic floor and diastasis care.' },
  { num: '04', title: 'Reconnect', desc: 'Mental wellness, sexual wellness and a supportive community.' },
];

export function Programmes() {
  return (
    <section id="journey" className="section-y bg-oat">
      <div className="container-app">
        <div>
          <div className="eyebrow">Womb to World</div>
          <h2 className="section-title">Support beyond a doctor’s appointment</h2>
          <p className="section-lead">
            Birth Nest programmes are designed to help women feel informed, prepared and supported through
            pregnancy and recovery.
          </p>
        </div>

        <div className="mt-[38px] grid gap-3 xs:grid-cols-2 desk:grid-cols-4">
          {STAGES.map((stage) => (
            <article key={stage.num} className="rounded-[22px] bg-[rgba(255,253,249,0.76)] p-[25px]">
              <span className="font-serif text-[2rem] font-semibold text-clay">{stage.num}</span>
              <h3 className="mt-3.5 mb-1.5 font-serif text-[1.18rem] font-semibold">{stage.title}</h3>
              <p className="m-0 text-[0.93rem] text-[#765c4f]">{stage.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
