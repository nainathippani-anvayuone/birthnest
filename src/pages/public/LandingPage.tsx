import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Hero } from '@/components/landing/Hero';
import { HospitalIntro } from '@/components/landing/HospitalIntro';
import { DoctorProfile } from '@/components/landing/DoctorProfile';
import { BookAppointmentSection } from '@/components/landing/BookAppointmentSection';
import { Services } from '@/components/landing/Services';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { InstagramSection } from '@/components/landing/InstagramSection';
import { Testimonials } from '@/components/landing/Testimonials';
import { ContactSection } from '@/components/landing/ContactSection';

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main>
        <Hero />
        <HospitalIntro />
        <DoctorProfile />
        <BookAppointmentSection />
        <Services />
        <WhyChooseUs />
        <InstagramSection />
        <Testimonials />
        <ContactSection />
      </main>
      <PublicFooter />
    </div>
  );
}
