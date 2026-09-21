import { useState, type FormEvent, type ReactNode } from 'react';
import { MapPin, Phone, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';

const CLINIC_ADDRESS =
  '7-66/3/102, 2nd Floor, Prasanthi Hills, Raidurg, Khajaguda - Nanakramguda Rd, beside Golden Leaves Hotel, Nanakramguda, Hyderabad, Telangana 500104';
const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(CLINIC_ADDRESS)}&output=embed`;

export function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      message: form.message,
    });

    setSubmitting(false);
    if (insertError) {
      setError('Something went wrong sending your message. Please call us instead.');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section id="contact" className="section-y bg-brand-50/60">
      <div className="container-app">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Visit or Reach Us</p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-brand-900 sm:text-4xl">Get in Touch</h2>
        <p className="mt-4 max-w-md text-brand-700/90">
          Have a general question rather than an appointment to book? Reach out — our team responds to
          every enquiry within one business day.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="space-y-5 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
            <InfoRow icon={MapPin} title="Clinic Address">
              {CLINIC_ADDRESS}
            </InfoRow>
            <InfoRow icon={Phone} title="Phone">
              <a href="tel:+919880855845" className="hover:text-brand-800">+91 98808 55845</a>
            </InfoRow>
            <InfoRow icon={Mail} title="Email">
              care@birthnest.clinic
            </InfoRow>
            <InfoRow icon={Clock} title="Working Hours">
              Mon – Sat: 9:00 AM – 8:00 PM &nbsp;•&nbsp; Sun: 10:00 AM – 2:00 PM
            </InfoRow>
          </div>

          <div className="min-h-[320px] overflow-hidden rounded-2xl border border-brand-100 shadow-sm">
            <iframe
              title="Birth Nest clinic location"
              src={MAP_EMBED_SRC}
              className="h-full w-full min-h-[320px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="font-serif text-xl font-semibold text-brand-900">Send Us a Message</h3>
          <p className="mt-1 text-sm text-brand-500">
            Looking to book a visit? Use the appointment booking section above instead — this is for
            general questions.
          </p>

          {submitted ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-emerald-50 px-4 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="font-medium text-emerald-800">Message received!</p>
              <p className="text-sm text-emerald-700">We'll get back to you within one business day.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Textarea
                  label="Message"
                  required
                  placeholder="How can we help?"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              {error && <p className="text-sm font-medium text-rose-600 sm:col-span-2">{error}</p>}
              <Button type="submit" className="sm:col-span-2" loading={submitting}>
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="text-sm text-brand-600">{children}</p>
      </div>
    </div>
  );
}
