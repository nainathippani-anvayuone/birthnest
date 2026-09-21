import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Service, Testimonial } from '@/types';

export function usePublicServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('services').select('*').eq('is_active', true).order('category');
        setServices((data as Service[]) ?? []);
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { services, loading };
}

export function usePublicTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        setTestimonials((data as Testimonial[]) ?? []);
      } catch {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { testimonials, loading };
}
