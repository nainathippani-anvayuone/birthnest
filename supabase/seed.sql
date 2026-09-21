-- ============================================================================
-- Birth Nest — optional demo/catalog seed data
-- Run after schema.sql. Safe to skip in production; useful for a fresh demo.
-- ============================================================================

insert into public.services (name, description, category, price, duration_minutes) values
  ('Gynaecology Consultation', 'General gynaecological consultation and examination.', 'consultation', 800, 30),
  ('Antenatal Checkup', 'Routine pregnancy checkup including fetal heart rate and growth monitoring.', 'pregnancy_care', 900, 30),
  ('Obstetric Ultrasound (2D)', 'Pregnancy dating, growth and anomaly scan.', 'ultrasound', 1500, 30),
  ('4D/HD Live Ultrasound', 'High-definition live 3D/4D fetal imaging.', 'ultrasound', 2500, 45),
  ('Infertility Consultation', 'Fertility assessment and treatment planning.', 'fertility_care', 1200, 45),
  ('IUI Procedure', 'Intrauterine insemination procedure.', 'fertility_care', 8000, 60),
  ('PAP Smear Screening', 'Cervical cancer screening test.', 'diagnostics', 600, 15),
  ('Colposcopy', 'Detailed examination of the cervix.', 'gynaecology_procedure', 2000, 30),
  ('Hysteroscopy', 'Minimally invasive procedure to examine the uterus.', 'gynaecology_procedure', 15000, 60),
  ('Laparoscopy (Diagnostic)', 'Minimally invasive diagnostic abdominal surgery.', 'gynaecology_procedure', 25000, 90),
  ('Family Planning Counselling', 'Contraception options and counselling.', 'consultation', 500, 20),
  ('Menopause Management', 'Hormonal and lifestyle management for menopause.', 'consultation', 900, 30),
  ('Laboratory & Diagnostic Tests', 'Full panel of hormonal, prenatal and general diagnostic lab testing, in-house.', 'laboratory', 0, 15)
on conflict do nothing;

insert into public.lab_tests (name, category, sample_type, price, turnaround_hours, reference_range) values
  ('Complete Blood Count (CBC)', 'hematology', 'blood', 350, 6, 'See report'),
  ('Beta hCG (Quantitative)', 'hormone', 'blood', 500, 12, 'Varies by gestational age'),
  ('Thyroid Profile (TSH, T3, T4)', 'hormone', 'blood', 700, 24, 'TSH 0.4-4.0 mIU/L'),
  ('Blood Sugar (Fasting & PP)', 'biochemistry', 'blood', 250, 6, '70-140 mg/dL'),
  ('Urine Routine & Microscopy', 'urine', 'urine', 200, 6, 'See report'),
  ('Pap Smear Cytology', 'cytology', 'cervical swab', 600, 48, 'Negative for intraepithelial lesion'),
  ('Vitamin D', 'biochemistry', 'blood', 1200, 48, '30-100 ng/mL'),
  ('AMH (Anti-Mullerian Hormone)', 'hormone', 'blood', 1800, 72, 'Age-dependent'),
  ('Double Marker Test', 'prenatal_screening', 'blood', 2500, 96, 'Risk score'),
  ('HIV, HBsAg, VDRL (Antenatal Panel)', 'infectious_disease', 'blood', 900, 24, 'Non-reactive')
on conflict do nothing;

-- Real patient testimonials, sourced verbatim from drmythrisharan.com
-- (Dr. Mythri Sharan's own clinic site) — not invented placeholder copy.
insert into public.testimonials (patient_name, rating, message, is_published) values
  ('Aishwarya Sai', 5, 'We are so thankful to Dr. Mythri Sharan for being with us in our pregnancy journey. From the very beginning, she was very kind, calm, and clear in her explanations. We always felt comfortable and confident after speaking to her.', true),
  ('Gayathri Mantha', 5, 'I recently delivered my twins under the care of Dr. Mythri, and I can say with all my heart — she is truly the best. I cannot imagine walking this pregnancy journey without her. She wasn''t just my doctor — she became a friend, a guide, and a part of our family through it all.', true),
  ('Rizwana Angel', 5, 'I had the pleasure of having Dr. Mythri Ma''am as my gynecologist at Apollo Cradle Hospital in Hyderabad. From the moment I met her, she exuded confidence and warmth, which immediately put me at ease. I was naturally anxious about the delivery. However, Dr. Mythri Ma''am''s expertise and calm demeanor made all the difference.', true),
  ('Neelima Palavali', 5, 'I''m incredibly grateful to Dr. Mythri Sharan for her exceptional care during my twin pregnancy. Her personalized guidance, from diet planning to encouraging me to stay active, made a huge difference. Her compassion, expertise, and constant support provided so much comfort throughout the journey. Truly a blessing to our family!', true),
  ('Nadia Basree', 5, 'Dr. Mythri Sharan is truly one of the best gynecologists I have met. She combines deep medical expertise with a genuinely caring and empathetic approach, which made me feel completely comfortable and confident throughout my treatment.', true),
  ('Aditi Garg', 5, 'I''d like to express my heartfelt gratitude to Mythri mam for her exceptional care and dedication throughout my pregnancy. Her patience, guidance, and reassurance helped me feel safe and confident every step of the way.', true)
on conflict do nothing;
