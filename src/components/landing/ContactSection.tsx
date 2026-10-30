import { useState, type FormEvent } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Input, Textarea } from '@/components/ui/Field';
import { CLINIC_PHONES, DIRECTIONS_URL, INSTAGRAM_URL } from '@/utils/links';
import { EMAIL_RE, isValidPhone } from '@/utils/validation';

type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>;

function validate(form: { name: string; email: string; phone: string; message: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!form.email.trim()) errors.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (form.phone.trim() && !isValidPhone(form.phone)) errors.phone = 'Please enter a valid phone number, or leave it blank.';
  if (!form.message.trim()) errors.message = 'Please write a short message.';
  return errors;
}

export function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      message: form.message.trim(),
    });

    setSubmitting(false);
    if (insertError) {
      setError(
        `Something went wrong sending your message. Please try again, or call us at ${CLINIC_PHONES.map((p) => p.display).join(' or ')}.`,
      );
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section id="contact" className="section-y">
      <div className="container-app">
        <div className="rounded-[36px] bg-[linear-gradient(135deg,#9b8474,#5f4c43)] px-[25px] py-[34px] text-white desk:flex desk:items-center desk:justify-between desk:gap-[35px] desk:p-[50px]">
          <div>
            <h2 className="mb-3 font-serif text-[clamp(2.1rem,4vw,3.8rem)] leading-[1.05] font-medium">
              Let’s take the next step together.
            </h2>
            <p className="m-0 text-[#eee4d8]">Birth Nest Women Wellness Centre • Khajaguda, Hyderabad</p>
          </div>
          <div className="mt-[25px] flex flex-wrap gap-3 desk:mt-0 desk:shrink-0">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses('inverse', 'md', 'w-full xs:w-auto')}
            >
              Message Dr. Mythri
            </a>
            {DIRECTIONS_URL && (
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses('outlineInverse', 'md', 'w-full xs:w-auto')}
              >
                Get Directions
              </a>
            )}
          </div>
        </div>

        <div className="card-ref mt-8 grid gap-8 desk:grid-cols-[0.8fr_1.2fr] desk:p-[42px]">
          <div>
            <div className="eyebrow">General questions</div>
            <h3 className="mt-2.5 font-serif text-[1.8rem] leading-tight font-medium">Send us a message</h3>
            <p className="mt-3 text-muted">
              Looking to book a visit? Use the{' '}
              <a href="#book-appointment" className="font-semibold text-ink underline underline-offset-4">
                appointment booking
              </a>{' '}
              section instead — this form is for general questions.
            </p>

            <div className="mt-7 border-t border-line pt-6">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="h-4 w-4 text-clay" aria-hidden="true" /> Call the clinic
              </p>
              <ul className="mt-2 grid gap-1 p-0">
                {CLINIC_PHONES.map((p) => (
                  <li key={p.tel} className="list-none">
                    <a href={p.tel} className="font-serif text-[1.25rem] hover:text-clay">
                      {p.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {submitted ? (
            <div role="status" className="flex flex-col items-center justify-center gap-2 rounded-[22px] bg-sand px-4 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-clay" />
              <p className="font-serif text-xl">Message received</p>
              <p className="text-sm text-muted">Thank you — your message has been sent to the Birth Nest team.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="grid gap-4 xs:grid-cols-2">
              <Input
                label="Full Name"
                required
                autoComplete="name"
                value={form.name}
                error={fieldErrors.name}
                onChange={(e) => update('name', e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                error={fieldErrors.email}
                onChange={(e) => update('email', e.target.value)}
              />
              <div className="xs:col-span-2">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  error={fieldErrors.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
              <div className="xs:col-span-2">
                <Textarea
                  label="Message"
                  required
                  placeholder="How can we help?"
                  value={form.message}
                  error={fieldErrors.message}
                  onChange={(e) => update('message', e.target.value)}
                />
              </div>
              {error && <p role="alert" className="text-sm font-medium text-rose-700 xs:col-span-2">{error}</p>}
              <Button type="submit" className="xs:col-span-2 xs:justify-self-start" loading={submitting}>
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
