const CARDS = [
  {
    icon: '♡',
    title: 'Personalised Care',
    desc: 'Your concerns, medical history and goals guide every consultation and treatment plan.',
  },
  {
    icon: '⌁',
    title: 'High-Risk Expertise',
    desc: 'Close, thoughtful care for complex pregnancies, recurrent loss, growth concerns and cervical insufficiency.',
  },
  {
    icon: '◎',
    title: 'Complete Support',
    desc: 'Clinical care, scans, nutrition, physiotherapy, lactation and postnatal wellness in one place.',
  },
];

// "Welcome to Birth Nest" section from the reference design.
export function HospitalIntro() {
  return (
    <section className="section-y">
      <div className="container-app">
        <div className="mx-auto max-w-[850px] text-center">
          <div className="eyebrow">Welcome to Birth Nest</div>
          <h2 className="section-title">A women’s wellness centre built around you</h2>
          <p className="section-lead">
            Birth Nest brings consultation, ultrasound, diagnostics and supportive wellness services together in
            one calm, private space. We care for women through adolescence, fertility planning, pregnancy, recovery
            after birth and beyond.
          </p>
        </div>

        <div className="mt-11 grid gap-[18px] desk:grid-cols-3">
          {CARDS.map((card) => (
            <article key={card.title} className="card-ref">
              <div
                aria-hidden="true"
                className="grid h-12 w-12 place-items-center rounded-[15px] bg-sand text-xl text-clay"
              >
                {card.icon}
              </div>
              <h3 className="mt-[18px] mb-2.5 font-serif text-[1.42rem] font-semibold">{card.title}</h3>
              <p className="m-0 text-[#775f54]">{card.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
