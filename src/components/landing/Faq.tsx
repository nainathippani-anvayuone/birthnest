const QUESTIONS = [
  {
    q: 'When should I book my first pregnancy appointment?',
    a: 'You may book after a positive home pregnancy test. The ideal timing of your first scan or blood tests will be advised according to your dates, symptoms and medical history.',
  },
  {
    q: 'Does Birth Nest care for high-risk pregnancies?',
    a: 'Yes. High-risk pregnancy care is one of Dr. Mythri’s key areas of expertise, including growth concerns, twins, recurrent pregnancy loss, cervical incompetence and pregnancy complicated by medical conditions.',
  },
  {
    q: 'Are ultrasound and laboratory services available?',
    a: 'Birth Nest offers on-site ultrasound services and laboratory sample collection for convenient, coordinated care. Availability of a specific scan or test can be confirmed while booking.',
  },
  {
    q: 'Do all fertility concerns require IVF?',
    a: 'No. The first step is a complete evaluation of both partners. Many couples benefit from lifestyle guidance, ovulation tracking or simpler treatment; advanced fertility care is recommended only when appropriate.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="section-y">
      <div className="container-app">
        <div className="mx-auto max-w-[850px]">
          <div className="text-center">
            <div className="eyebrow">Common questions</div>
            <h2 className="section-title">Before your visit</h2>
          </div>
          {QUESTIONS.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p className="m-0 pb-5 text-[#745a4d]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
