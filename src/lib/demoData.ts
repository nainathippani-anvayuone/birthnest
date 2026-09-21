// Seed data for demo mode (no Supabase project configured). Loosely typed on
// purpose: this stands in for a schemaless DB layer, so rows are plain
// objects keyed by column name exactly as supabase/schema.sql defines them.
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Row = Record<string, any>;
export type Store = Record<string, Row[]>;

const iso = (offsetDays: number, hh = 0, mm = 0) => {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
};
const dateOnly = (offsetDays: number) => iso(offsetDays).toISOString().slice(0, 10);
const dateTime = (offsetDays: number, hh: number, mm: number) => iso(offsetDays, hh, mm).toISOString();

export const DEMO_PASSWORD = 'demo1234';

// Staff-only — patients never log in (this is a staff hospital management
// portal, not a patient portal). Patient records live purely in the
// `patients` table below, with no matching login account.
export const DEMO_ACCOUNTS = [
  { id: 'u-admin', email: 'admin@birthnest.demo', role: 'admin', full_name: 'Asha Rao', label: 'Admin' },
  { id: 'u-doctor', email: 'doctor@birthnest.demo', role: 'doctor', full_name: 'Mythri Sharan', label: 'Doctor' },
  { id: 'u-receptionist', email: 'receptionist@birthnest.demo', role: 'receptionist', full_name: 'Kavya Nair', label: 'Receptionist' },
  { id: 'u-lab', email: 'lab@birthnest.demo', role: 'lab_staff', full_name: 'Rahul Verma', label: 'Lab Staff' },
] as const;

function buildStore(): Store {
  const now = new Date().toISOString();

  const profiles: Row[] = DEMO_ACCOUNTS.map((a) => ({
    id: a.id, role: a.role, full_name: a.full_name, email: a.email, phone: '+91 90000 00001',
    avatar_url: null, is_active: true, created_at: now, updated_at: now,
  }));

  const doctors: Row[] = [
    {
      id: 'u-doctor', specialization: 'Obstetrics & Gynaecology',
      qualifications: 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
      registration_number: 'KMC-2011-45210', experience_years: 15,
      bio: 'Dr. Mythri Sharan has spent over 15 years helping women through every stage of reproductive health, from adolescence to menopause.',
      consultation_fee: 800, is_active: true, created_at: now,
    },
  ];

  const patients: Row[] = [
    { id: 'pt-1', full_name: 'Sneha Iyer', email: 'sneha.iyer@example.com', phone: '+91 90000 10001', date_of_birth: '1994-03-12', gender: 'female', blood_group: 'O+', address: '221B, Indiranagar, Bengaluru', emergency_contact_name: 'Arjun Iyer', emergency_contact_phone: '+91 90000 20001', allergies: 'None known', medical_history: 'G1P0 — first pregnancy, uneventful so far.', created_at: now, updated_at: now },
    { id: 'pt-2', full_name: 'Divya Menon', email: 'divya.menon@example.com', phone: '+91 90000 10002', date_of_birth: '1990-07-22', gender: 'female', blood_group: 'B+', address: 'HSR Layout, Bengaluru', emergency_contact_name: 'Rohan Menon', emergency_contact_phone: '+91 90000 20002', allergies: 'Penicillin', medical_history: 'G2P1, second pregnancy — 14 weeks.', created_at: now, updated_at: now },
    { id: 'pt-3', full_name: 'Ananya Gupta', email: 'ananya.gupta@example.com', phone: '+91 90000 10003', date_of_birth: '1997-11-02', gender: 'female', blood_group: 'A-', address: 'Koramangala, Bengaluru', emergency_contact_name: 'Vikram Gupta', emergency_contact_phone: '+91 90000 20003', allergies: 'None known', medical_history: 'Routine annual gynaecology checkups.', created_at: now, updated_at: now },
    { id: 'pt-4', full_name: 'Priya Kulkarni', email: 'priya.kulkarni@example.com', phone: '+91 90000 10004', date_of_birth: '1988-01-30', gender: 'female', blood_group: 'AB+', address: 'Whitefield, Bengaluru', emergency_contact_name: 'Sanjay Kulkarni', emergency_contact_phone: '+91 90000 20004', allergies: 'None known', medical_history: 'Undergoing fertility evaluation & treatment.', created_at: now, updated_at: now },
  ];

  const services: Row[] = [
    { id: 's1', name: 'Gynaecology Consultation', description: 'General gynaecological consultation and examination.', category: 'consultation', price: 800, duration_minutes: 30, is_active: true, created_at: now },
    { id: 's2', name: 'Antenatal Checkup', description: 'Routine pregnancy checkup including fetal heart rate and growth monitoring.', category: 'pregnancy_care', price: 900, duration_minutes: 30, is_active: true, created_at: now },
    { id: 's3', name: 'Obstetric Ultrasound (2D)', description: 'Pregnancy dating, growth and anomaly scan.', category: 'ultrasound', price: 1500, duration_minutes: 30, is_active: true, created_at: now },
    { id: 's4', name: '4D/HD Live Ultrasound', description: 'High-definition live 3D/4D fetal imaging.', category: 'ultrasound', price: 2500, duration_minutes: 45, is_active: true, created_at: now },
    { id: 's5', name: 'Infertility Consultation', description: 'Fertility assessment and treatment planning.', category: 'fertility_care', price: 1200, duration_minutes: 45, is_active: true, created_at: now },
    { id: 's6', name: 'IUI Procedure', description: 'Intrauterine insemination procedure.', category: 'fertility_care', price: 8000, duration_minutes: 60, is_active: true, created_at: now },
    { id: 's7', name: 'PAP Smear Screening', description: 'Cervical cancer screening test.', category: 'diagnostics', price: 600, duration_minutes: 15, is_active: true, created_at: now },
    { id: 's8', name: 'Colposcopy', description: 'Detailed examination of the cervix.', category: 'gynaecology_procedure', price: 2000, duration_minutes: 30, is_active: true, created_at: now },
    { id: 's9', name: 'Hysteroscopy', description: 'Minimally invasive procedure to examine the uterus.', category: 'gynaecology_procedure', price: 15000, duration_minutes: 60, is_active: true, created_at: now },
    { id: 's10', name: 'Family Planning Counselling', description: 'Contraception options and counselling.', category: 'consultation', price: 500, duration_minutes: 20, is_active: true, created_at: now },
    { id: 's11', name: 'Menopause Management', description: 'Hormonal and lifestyle management for menopause.', category: 'consultation', price: 900, duration_minutes: 30, is_active: true, created_at: now },
    { id: 's12', name: 'Laboratory & Diagnostic Tests', description: 'Full panel of hormonal, prenatal and general diagnostic lab testing, in-house.', category: 'laboratory', price: 0, duration_minutes: 15, is_active: true, created_at: now },
  ];

  const labTests: Row[] = [
    { id: 'lt1', name: 'Complete Blood Count (CBC)', category: 'hematology', sample_type: 'blood', price: 350, turnaround_hours: 6, reference_range: 'See report', is_active: true, created_at: now },
    { id: 'lt2', name: 'Beta hCG (Quantitative)', category: 'hormone', sample_type: 'blood', price: 500, turnaround_hours: 12, reference_range: 'Varies by gestational age', is_active: true, created_at: now },
    { id: 'lt3', name: 'Thyroid Profile (TSH, T3, T4)', category: 'hormone', sample_type: 'blood', price: 700, turnaround_hours: 24, reference_range: 'TSH 0.4-4.0 mIU/L', is_active: true, created_at: now },
    { id: 'lt4', name: 'Blood Sugar (Fasting & PP)', category: 'biochemistry', sample_type: 'blood', price: 250, turnaround_hours: 6, reference_range: '70-140 mg/dL', is_active: true, created_at: now },
    { id: 'lt5', name: 'Urine Routine & Microscopy', category: 'urine', sample_type: 'urine', price: 200, turnaround_hours: 6, reference_range: 'See report', is_active: true, created_at: now },
    { id: 'lt6', name: 'Pap Smear Cytology', category: 'cytology', sample_type: 'cervical swab', price: 600, turnaround_hours: 48, reference_range: 'Negative for intraepithelial lesion', is_active: true, created_at: now },
    { id: 'lt7', name: 'Vitamin D', category: 'biochemistry', sample_type: 'blood', price: 1200, turnaround_hours: 48, reference_range: '30-100 ng/mL', is_active: true, created_at: now },
    { id: 'lt8', name: 'AMH (Anti-Mullerian Hormone)', category: 'hormone', sample_type: 'blood', price: 1800, turnaround_hours: 72, reference_range: 'Age-dependent', is_active: true, created_at: now },
    { id: 'lt9', name: 'Double Marker Test', category: 'prenatal_screening', sample_type: 'blood', price: 2500, turnaround_hours: 96, reference_range: 'Risk score', is_active: true, created_at: now },
    { id: 'lt10', name: 'HIV, HBsAg, VDRL (Antenatal Panel)', category: 'infectious_disease', sample_type: 'blood', price: 900, turnaround_hours: 24, reference_range: 'Non-reactive', is_active: true, created_at: now },
  ];

  const testimonials: Row[] = [
    { id: 't1', patient_name: 'Aishwarya Sai', rating: 5, message: 'We are so thankful to Dr. Mythri Sharan for being with us in our pregnancy journey. From the very beginning, she was very kind, calm, and clear in her explanations. We always felt comfortable and confident after speaking to her.', is_published: true, created_at: now },
    { id: 't2', patient_name: 'Gayathri Mantha', rating: 5, message: "I recently delivered my twins under the care of Dr. Mythri, and I can say with all my heart — she is truly the best. I cannot imagine walking this pregnancy journey without her. She wasn't just my doctor — she became a friend, a guide, and a part of our family through it all.", is_published: true, created_at: now },
    { id: 't3', patient_name: 'Rizwana Angel', rating: 5, message: "I had the pleasure of having Dr. Mythri Ma'am as my gynecologist at Apollo Cradle Hospital in Hyderabad. From the moment I met her, she exuded confidence and warmth, which immediately put me at ease. I was naturally anxious about the delivery. However, Dr. Mythri Ma'am's expertise and calm demeanor made all the difference.", is_published: true, created_at: now },
    { id: 't4', patient_name: 'Neelima Palavali', rating: 5, message: "I'm incredibly grateful to Dr. Mythri Sharan for her exceptional care during my twin pregnancy. Her personalized guidance, from diet planning to encouraging me to stay active, made a huge difference. Her compassion, expertise, and constant support provided so much comfort throughout the journey. Truly a blessing to our family!", is_published: true, created_at: now },
    { id: 't5', patient_name: 'Nadia Basree', rating: 5, message: 'Dr. Mythri Sharan is truly one of the best gynecologists I have met. She combines deep medical expertise with a genuinely caring and empathetic approach, which made me feel completely comfortable and confident throughout my treatment.', is_published: true, created_at: now },
    { id: 't6', patient_name: 'Aditi Garg', rating: 5, message: "I'd like to express my heartfelt gratitude to Mythri mam for her exceptional care and dedication throughout my pregnancy. Her patience, guidance, and reassurance helped me feel safe and confident every step of the way.", is_published: true, created_at: now },
  ];

  const doctorAvailability: Row[] = [1, 2, 3, 4, 5].flatMap((day) => [
    { id: `da-${day}-am`, doctor_id: 'u-doctor', day_of_week: day, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, is_active: true },
    { id: `da-${day}-pm`, doctor_id: 'u-doctor', day_of_week: day, start_time: '16:00', end_time: '20:00', slot_duration_minutes: 20, is_active: true },
  ]);
  doctorAvailability.push({ id: 'da-6-am', doctor_id: 'u-doctor', day_of_week: 6, start_time: '09:00', end_time: '13:00', slot_duration_minutes: 20, is_active: true });

  const doctorTimeOff: Row[] = [
    { id: 'off1', doctor_id: 'u-doctor', off_date: dateOnly(12), reason: 'Medical conference' },
  ];

  const appointments: Row[] = [
    { id: 'a1', patient_id: 'pt-1', doctor_id: 'u-doctor', service_id: 's1', appointment_date: dateOnly(0), start_time: '09:00', end_time: '09:20', status: 'confirmed', reason: 'Routine checkup', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a2', patient_id: 'pt-2', doctor_id: 'u-doctor', service_id: 's2', appointment_date: dateOnly(0), start_time: '09:40', end_time: '10:00', status: 'scheduled', reason: 'Antenatal visit — 14 weeks', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a3', patient_id: 'pt-3', doctor_id: 'u-doctor', service_id: 's3', appointment_date: dateOnly(1), start_time: '10:00', end_time: '10:30', status: 'scheduled', reason: 'Ultrasound scan', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a4', patient_id: 'pt-1', doctor_id: 'u-doctor', service_id: 's1', appointment_date: dateOnly(-3), start_time: '09:00', end_time: '09:20', status: 'completed', reason: 'First trimester checkup', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a5', patient_id: 'pt-4', doctor_id: 'u-doctor', service_id: 's5', appointment_date: dateOnly(-7), start_time: '11:00', end_time: '11:45', status: 'completed', reason: 'Fertility evaluation', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a6', patient_id: 'pt-2', doctor_id: 'u-doctor', service_id: 's1', appointment_date: dateOnly(-1), start_time: '16:00', end_time: '16:20', status: 'cancelled', reason: 'Follow-up', notes: 'Patient requested reschedule by phone', created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'a7', patient_id: 'pt-3', doctor_id: 'u-doctor', service_id: 's7', appointment_date: dateOnly(5), start_time: '09:20', end_time: '09:40', status: 'confirmed', reason: 'PAP smear', notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
  ];

  const consultations: Row[] = [
    {
      id: 'c1', appointment_id: 'a4', patient_id: 'pt-1', doctor_id: 'u-doctor', consultation_date: dateTime(-3, 9, 15),
      chief_complaint: 'Routine first-trimester checkup, mild nausea', diagnosis: 'Normal early pregnancy (8 weeks)',
      clinical_notes: 'Fetal heart rate not yet audible on Doppler (expected at this stage). Advised folic acid, iron and hydration. Review in 4 weeks with dating scan.',
      weight_kg: 58.5, height_cm: 162, blood_pressure: '112/72', pulse_bpm: 78, follow_up_date: dateOnly(25), created_at: now, updated_at: now,
    },
    {
      id: 'c2', appointment_id: 'a5', patient_id: 'pt-4', doctor_id: 'u-doctor', consultation_date: dateTime(-7, 11, 10),
      chief_complaint: '18 months trying to conceive', diagnosis: 'Suspected PCOS, mild male-factor contribution',
      clinical_notes: 'Ordered AMH and hormonal panel. Recommended lifestyle modification and started on ovulation induction. Partner referred for semen analysis.',
      weight_kg: 68, height_cm: 158, blood_pressure: '118/78', pulse_bpm: 82, follow_up_date: dateOnly(14), created_at: now, updated_at: now,
    },
  ];

  const prescriptions: Row[] = [
    { id: 'p1', consultation_id: 'c1', patient_id: 'pt-1', doctor_id: 'u-doctor', notes: 'Continue through first trimester.', created_at: now },
    { id: 'p2', consultation_id: 'c2', patient_id: 'pt-4', doctor_id: 'u-doctor', notes: 'Start on cycle day 2.', created_at: now },
  ];

  const prescriptionItems: Row[] = [
    { id: 'pi1', prescription_id: 'p1', medication_name: 'Folic Acid', dosage: '5mg', frequency: 'Once daily', duration: '90 days', instructions: 'Take after breakfast' },
    { id: 'pi2', prescription_id: 'p1', medication_name: 'Iron + Vitamin C', dosage: '100mg', frequency: 'Once daily', duration: '90 days', instructions: 'Avoid with dairy' },
    { id: 'pi3', prescription_id: 'p2', medication_name: 'Clomiphene Citrate', dosage: '50mg', frequency: 'Once daily', duration: '5 days', instructions: 'Days 2-6 of cycle' },
  ];

  const labOrders: Row[] = [
    { id: 'lo1', patient_id: 'pt-1', doctor_id: 'u-doctor', consultation_id: 'c1', ordered_by: 'u-doctor', order_date: dateTime(-3, 9, 20), status: 'completed', notes: null, created_at: now, updated_at: now },
    { id: 'lo2', patient_id: 'pt-4', doctor_id: 'u-doctor', consultation_id: 'c2', ordered_by: 'u-doctor', order_date: dateTime(-1, 10, 0), status: 'sample_collected', notes: null, created_at: now, updated_at: now },
    { id: 'lo3', patient_id: 'pt-2', doctor_id: 'u-doctor', consultation_id: null, ordered_by: 'u-receptionist', order_date: dateTime(0, 8, 30), status: 'ordered', notes: 'Routine antenatal panel', created_at: now, updated_at: now },
  ];

  const labOrderItems: Row[] = [
    { id: 'loi1', lab_order_id: 'lo1', lab_test_id: 'lt1', status: 'completed', result_value: '12.4 g/dL', result_notes: 'Within normal limits', is_abnormal: false, result_file_path: null, resulted_at: dateTime(-2, 14, 0), resulted_by: 'u-lab' },
    { id: 'loi2', lab_order_id: 'lo1', lab_test_id: 'lt3', status: 'completed', result_value: 'TSH 5.8 mIU/L', result_notes: 'Slightly elevated — recommend endocrinology follow-up', is_abnormal: true, result_file_path: null, resulted_at: dateTime(-2, 14, 5), resulted_by: 'u-lab' },
    { id: 'loi3', lab_order_id: 'lo2', lab_test_id: 'lt8', status: 'sample_collected', result_value: null, result_notes: null, is_abnormal: false, result_file_path: null, resulted_at: null, resulted_by: null },
    { id: 'loi4', lab_order_id: 'lo3', lab_test_id: 'lt5', status: 'ordered', result_value: null, result_notes: null, is_abnormal: false, result_file_path: null, resulted_at: null, resulted_by: null },
    { id: 'loi5', lab_order_id: 'lo3', lab_test_id: 'lt10', status: 'ordered', result_value: null, result_notes: null, is_abnormal: false, result_file_path: null, resulted_at: null, resulted_by: null },
  ];

  const invoices: Row[] = [
    { id: 'inv1', invoice_number: 'INV-DEMO001', patient_id: 'pt-1', appointment_id: 'a4', invoice_date: dateOnly(-3), due_date: dateOnly(4), status: 'paid', subtotal: 1850, discount: 0, tax: 0, total_amount: 1850, notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'inv2', invoice_number: 'INV-DEMO002', patient_id: 'pt-4', appointment_id: 'a5', invoice_date: dateOnly(-7), due_date: dateOnly(0), status: 'partially_paid', subtotal: 1200, discount: 0, tax: 0, total_amount: 1200, notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
    { id: 'inv3', invoice_number: 'INV-DEMO003', patient_id: 'pt-2', appointment_id: 'a2', invoice_date: dateOnly(0), due_date: dateOnly(7), status: 'pending', subtotal: 900, discount: 0, tax: 0, total_amount: 900, notes: null, created_by: 'u-receptionist', created_at: now, updated_at: now },
  ];

  const invoiceItems: Row[] = [
    { id: 'ii1', invoice_id: 'inv1', item_type: 'consultation', description: 'Gynaecology Consultation', quantity: 1, unit_price: 800, amount: 800 },
    { id: 'ii2', invoice_id: 'inv1', item_type: 'lab_test', description: 'Complete Blood Count (CBC)', quantity: 1, unit_price: 350, amount: 350 },
    { id: 'ii3', invoice_id: 'inv1', item_type: 'lab_test', description: 'Thyroid Profile', quantity: 1, unit_price: 700, amount: 700 },
    { id: 'ii4', invoice_id: 'inv2', item_type: 'consultation', description: 'Infertility Consultation', quantity: 1, unit_price: 1200, amount: 1200 },
    { id: 'ii5', invoice_id: 'inv3', item_type: 'service', description: 'Antenatal Checkup', quantity: 1, unit_price: 900, amount: 900 },
  ];

  const payments: Row[] = [
    { id: 'pay1', invoice_id: 'inv1', patient_id: 'pt-1', amount: 1850, payment_method: 'cash', payment_date: dateTime(-3, 9, 40), transaction_reference: null, recorded_by: 'u-receptionist', notes: null, created_at: now },
    { id: 'pay2', invoice_id: 'inv2', patient_id: 'pt-4', amount: 600, payment_method: 'upi', payment_date: dateTime(-7, 11, 50), transaction_reference: 'UPI-DEMO-118822', recorded_by: 'u-receptionist', notes: 'Partial payment', created_at: now },
  ];

  const medications: Row[] = [
    { id: 'm1', name: 'Folic Acid', generic_name: 'Folic Acid', form: 'tablet', strength: '5mg', manufacturer: 'Cipla', stock_quantity: 240, reorder_level: 50, unit_price: 2, is_active: true, created_at: now },
    { id: 'm2', name: 'Iron + Vitamin C', generic_name: 'Ferrous Ascorbate', form: 'tablet', strength: '100mg', manufacturer: 'Sun Pharma', stock_quantity: 180, reorder_level: 50, unit_price: 3, is_active: true, created_at: now },
    { id: 'm3', name: 'Clomiphene Citrate', generic_name: 'Clomiphene', form: 'tablet', strength: '50mg', manufacturer: "Dr. Reddy's", stock_quantity: 8, reorder_level: 10, unit_price: 12, is_active: true, created_at: now },
    { id: 'm4', name: 'Paracetamol', generic_name: 'Acetaminophen', form: 'tablet', strength: '500mg', manufacturer: 'GSK', stock_quantity: 320, reorder_level: 100, unit_price: 1, is_active: true, created_at: now },
    { id: 'm5', name: 'Progesterone', generic_name: 'Micronized Progesterone', form: 'capsule', strength: '200mg', manufacturer: 'Abbott', stock_quantity: 45, reorder_level: 20, unit_price: 18, is_active: true, created_at: now },
  ];

  const medicationDispenses: Row[] = [
    { id: 'md1', prescription_item_id: 'pi1', medication_id: 'm1', patient_id: 'pt-1', quantity: 30, dispensed_by: 'u-receptionist', dispensed_at: dateTime(-3, 9, 45), notes: null },
    { id: 'md2', prescription_item_id: 'pi3', medication_id: 'm3', patient_id: 'pt-4', quantity: 5, dispensed_by: 'u-receptionist', dispensed_at: dateTime(-6, 10, 0), notes: null },
  ];

  // Patients never log in, so they never receive notifications — every
  // notification here targets a staff member.
  const notifications: Row[] = [
    { id: 'n4', user_id: 'u-doctor', type: 'appointment', title: 'New appointment booked', message: 'Divya Menon booked an antenatal checkup for today at 9:40 AM.', is_read: false, related_entity_type: 'appointment', related_entity_id: 'a2', created_at: now },
    { id: 'n5', user_id: 'u-admin', type: 'general', title: 'New patient registered', message: 'Ananya Gupta was registered by the front desk.', is_read: true, related_entity_type: 'patient', related_entity_id: 'pt-3', created_at: now },
    { id: 'n6', user_id: 'u-receptionist', type: 'reminder', title: "Today's schedule", message: 'You have 3 appointments and 1 pending invoice today.', is_read: false, related_entity_type: null, related_entity_id: null, created_at: now },
    { id: 'n7', user_id: 'u-lab', type: 'reminder', title: 'New lab order', message: 'A routine antenatal panel was ordered for Divya Menon.', is_read: false, related_entity_type: 'lab_order', related_entity_id: 'lo3', created_at: now },
  ];

  return {
    profiles, doctors, patients, services, lab_tests: labTests, testimonials,
    doctor_availability: doctorAvailability, doctor_time_off: doctorTimeOff,
    appointments, consultations, prescriptions, prescription_items: prescriptionItems,
    lab_orders: labOrders, lab_order_items: labOrderItems,
    invoices, invoice_items: invoiceItems, payments,
    medications, medication_dispenses: medicationDispenses,
    notifications, contact_messages: [],
  };
}

// Module-singleton store, shared by every mock client instance (mirrors every
// Supabase client instance talking to the same underlying database).
export const demoStore: Store = buildStore();

// Shared credentials map so both the main client and any "ephemeral" client
// (see createEphemeralAuthClient) see accounts created during the session.
export const demoCredentials = new Map<string, { password: string; id: string }>(
  DEMO_ACCOUNTS.map((a) => [a.email, { password: DEMO_PASSWORD, id: a.id }]),
);
