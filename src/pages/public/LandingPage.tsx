import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MobileActionBar } from '@/components/layout/MobileActionBar';
import { Hero } from '@/components/landing/Hero';
import { HospitalIntro } from '@/components/landing/HospitalIntro';
import { Services } from '@/components/landing/Services';
import { DoctorProfile } from '@/components/landing/DoctorProfile';
import { BookAppointmentSection } from '@/components/landing/BookAppointmentSection';
import { Programmes } from '@/components/landing/Programmes';
import { Testimonials } from '@/components/landing/Testimonials';
import { Faq } from '@/components/landing/Faq';
import { InstagramSection } from '@/components/landing/InstagramSection';
import { ContactSection } from '@/components/landing/ContactSection';

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar />
      <main id="top">
        <Hero />
        <HospitalIntro />
        <Services />
        <DoctorProfile />
        <BookAppointmentSection />
        <Programmes />
        <Testimonials />
        <Faq />
        <InstagramSection />
        <ContactSection />
      </main>
      <PublicFooter />
      <MobileActionBar />
    </div>
  );
}
