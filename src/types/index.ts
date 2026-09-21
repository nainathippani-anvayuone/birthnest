// Domain types mirroring supabase/schema.sql. Hand-maintained — keep in sync
// with the SQL schema when either changes.

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'lab_staff';
export type Gender = 'female' | 'male' | 'other';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type LabOrderStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceItemType = 'consultation' | 'service' | 'lab_test' | 'medication' | 'other';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance' | 'other';
export type NotificationType = 'appointment' | 'lab_result' | 'payment' | 'prescription' | 'reminder' | 'general';
export type DocumentCategory = 'lab_report' | 'prescription' | 'scan' | 'invoice' | 'other';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  specialization: string;
  qualifications: string;
  registration_number: string | null;
  experience_years: number;
  bio: string | null;
  consultation_fee: number;
  is_active: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender;
  blood_group: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  allergies: string | null;
  medical_history: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface LabTest {
  id: string;
  name: string;
  category: string;
  sample_type: string;
  price: number;
  turnaround_hours: number;
  reference_range: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Medication {
  id: string;
  name: string;
  generic_name: string | null;
  form: string;
  strength: string | null;
  manufacturer: string | null;
  stock_quantity: number;
  reorder_level: number;
  unit_price: number;
  is_active: boolean;
  created_at: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export interface DoctorTimeOff {
  id: string;
  doctor_id: string;
  off_date: string;
  reason: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  is_first_visit: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
  service?: Service;
}

export interface Consultation {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  clinical_notes: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  blood_pressure: string | null;
  pulse_bpm: number | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
}

export interface Prescription {
  id: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  notes: string | null;
  created_at: string;
  items?: PrescriptionItem[];
  doctor?: Doctor;
  patient?: Patient;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

export interface MedicationDispense {
  id: string;
  prescription_item_id: string | null;
  medication_id: string | null;
  patient_id: string;
  quantity: number;
  dispensed_by: string | null;
  dispensed_at: string;
  notes: string | null;
  medication?: Medication;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  consultation_id: string | null;
  ordered_by: string | null;
  order_date: string;
  status: LabOrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: Doctor;
  items?: LabOrderItem[];
}

export interface LabOrderItem {
  id: string;
  lab_order_id: string;
  lab_test_id: string;
  status: LabOrderStatus;
  result_value: string | null;
  result_notes: string | null;
  is_abnormal: boolean;
  result_file_path: string | null;
  resulted_at: string | null;
  resulted_by: string | null;
  lab_test?: LabTest;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_type: InvoiceItemType;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  transaction_reference: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  patient_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  category: DocumentCategory;
  related_entity_type: string | null;
  related_entity_id: string | null;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  patient_name: string;
  rating: number;
  message: string;
  is_published: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
