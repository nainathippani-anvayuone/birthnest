import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Share2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function PublicFooter() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container-app grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm text-brand-200/80">
            Compassionate, expert gynaecology, pregnancy and fertility care — led by Dr. Mythri Sharan.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Share Birth Nest" className="rounded-full bg-white/10 p-2 hover:bg-white/20">
              <Share2 className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm text-brand-200/80">
            <li><a href="#about" className="hover:text-white">About Us</a></li>
            <li><a href="#services" className="hover:text-white">Services</a></li>
            <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
            <li><Link to="/login" className="hover:text-white">Staff Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-brand-200/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              7-66/3/102, 2nd Floor, Prasanthi Hills, Raidurg, Khajaguda - Nanakramguda Rd, beside Golden
              Leaves Hotel, Nanakramguda, Hyderabad, Telangana 500104
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+919734111222" className="hover:text-white">+91 97341 11222</a>
            </li>
            <li className="flex items-center gap-2 pl-6">
              <a href="tel:+918090100569" className="hover:text-white">+91 80901 00569</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              care@birthnest.clinic
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-sm font-semibold uppercase tracking-wide text-white">Working Hours</h4>
          <ul className="mt-4 space-y-2 text-sm text-brand-200/80">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> Mon – Sat: 9:00 AM – 8:00 PM</li>
            <li className="flex items-center gap-2 pl-6">Sunday: 10:00 AM – 2:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="container-app text-center text-xs text-brand-200/70">
          © {new Date().getFullYear()} Birth Nest — Dr. Mythri Sharan's Clinic. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
