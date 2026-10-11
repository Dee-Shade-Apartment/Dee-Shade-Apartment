export interface Property {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  map_embed_url: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertySettings {
  id: string;
  property_id: string;
  standard_rate: number;
  party_rate: number;
  party_rate_description: string;
  caution_fee: number;
  max_occupancy: number;
  hold_duration_minutes: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  payment_instructions: string | null;
  house_rules: string;
  cancellation_policy: string;
  party_rate_conditions: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApartmentUnit {
  id: string;
  property_id: string;
  unit_label: string;
  unit_number: number | null;
  status: 'active' | 'maintenance' | 'inactive';
  features: string[];
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  guest_id: string | null;
  unit_id: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  accommodation_subtotal: number;
  caution_fee: number;
  total_amount: number;
  status: string;
  rate_type: string;
  special_requests: string | null;
  accepted_rules: boolean;
  hold_expires_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  cancellation_reason: string | null;
  internal_notes: string | null;
  idempotency_key: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  guest?: Guest | null;
  unit?: ApartmentUnit | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  expected_amount: number;
  verified_amount: number | null;
  payment_status: string;
  transfer_narration: string | null;
  bank_transaction_ref: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  rejection_notes: string | null;
  submitted_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  booking?: Booking | null;
}

export interface PaymentReceipt {
  id: string;
  booking_id: string;
  payment_id: string | null;
  storage_path: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  receipt_status: string;
  uploaded_by: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CautionFeeRecord {
  id: string;
  booking_id: string;
  expected_amount: number;
  amount_received: number | null;
  inspection_status: string;
  amount_refunded: number;
  deductions: number;
  deduction_reason: string | null;
  refund_date: string | null;
  refund_reference: string | null;
  inspection_notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  booking?: Booking | null;
}

export interface Enquiry {
  id: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  guest_count: number | null;
  message: string | null;
  estimated_value: number | null;
  lost_reason: string | null;
  follow_up_status: string;
  staff_notes: string | null;
  preferred_unit: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceBlock {
  id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  unit?: ApartmentUnit | null;
}

export interface StaffProfile {
  id: string;
  user_id: string | null;
  full_name: string;
  role: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  reason: string | null;
  is_demo: boolean;
  created_at: string;
}
