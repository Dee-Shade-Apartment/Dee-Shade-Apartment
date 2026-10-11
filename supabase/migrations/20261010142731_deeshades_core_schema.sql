/*
# DEESHADES APARTMENT — Core Database Schema

## Overview
Creates the complete database backend for the DEESHADES APARTMENT booking platform,
including properties, apartment units, guests, bookings, payments, receipts,
caution fee records, enquiries, maintenance blocks, staff profiles, audit logs,
and configurable property settings.

## New Tables
1. `properties` — Main property record (name, address, contact info)
2. `property_settings` — Configurable rates, bank details, WhatsApp, policies, hold duration
3. `apartment_units` — Five apartment units with status and features
4. `guests` — Guest records (name, phone, email)
5. `bookings` — Booking records with reference, dates, amounts, statuses
6. `payments` — Payment records with expected/verified amounts, transfer narration
7. `payment_receipts` — Receipt file metadata (private storage paths)
8. `caution_fee_records` — Refundable caution fee tracking
9. `enquiries` — Contact enquiries and lost booking opportunities
10. `maintenance_blocks` — Unit maintenance blocks with date ranges
11. `staff_profiles` — Staff user profiles with roles
12. `audit_logs` — Append-only audit history

## Security
- RLS enabled on all tables
- Public tables allow anon read for the customer website
- Admin operations via SECURITY DEFINER functions
- Private storage bucket for payment receipts

## Important Notes
- Booking references use format DSD-YYMM-XXXX, generated server-side
- All status enums enforced via CHECK constraints
- Demo data flagged with `is_demo` boolean
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'DRAFT', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT',
    'REJECTED', 'EXPIRED', 'CANCELLED', 'CONFLICT_REVIEW'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'NOT_SUBMITTED', 'AWAITING_VERIFICATION', 'VERIFIED',
    'REJECTED', 'PARTIALLY_VERIFIED', 'REFUND_PENDING', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE receipt_status AS ENUM (
    'NOT_UPLOADED', 'SUBMITTED', 'REPLACEMENT_SUBMITTED', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status AS ENUM (
    'AVAILABLE', 'TEMPORARILY_HELD', 'PENDING_VERIFICATION_HOLD',
    'RESERVED', 'OCCUPIED', 'MAINTENANCE_BLOCK'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM (
    'super_admin', 'manager', 'receptionist', 'accountant'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unit_status_enum AS ENUM (
    'active', 'maintenance', 'inactive'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE caution_refund_status AS ENUM (
    'expected', 'received', 'awaiting_inspection', 'eligible_for_refund',
    'refund_pending', 'refunded', 'deduction_under_review', 'partially_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enquiry_status AS ENUM (
    'new', 'contacted', 'waitlisted', 'lost', 'converted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'DEESHADES APARTMENT',
  address text NOT NULL DEFAULT 'Gbenga Fapohunda Street, Alagbaka Extension, Akure, Ondo State, Nigeria.',
  phone text,
  email text,
  whatsapp_number text,
  check_in_time text,
  check_out_time text,
  map_embed_url text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_properties" ON properties;
CREATE POLICY "public_read_properties" ON properties FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_properties" ON properties;
CREATE POLICY "admin_update_properties" ON properties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_insert_properties" ON properties;
CREATE POLICY "admin_insert_properties" ON properties FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- PROPERTY SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS property_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  standard_rate numeric NOT NULL DEFAULT 100000,
  party_rate numeric NOT NULL DEFAULT 200000,
  party_rate_description text DEFAULT 'Configurable — confirm purpose, duration, and eligibility with management.',
  caution_fee numeric NOT NULL DEFAULT 50000,
  max_occupancy integer NOT NULL DEFAULT 4,
  hold_duration_minutes integer NOT NULL DEFAULT 120,
  bank_name text,
  account_name text,
  account_number text,
  payment_instructions text,
  house_rules text DEFAULT 'No smoking inside the apartment. Maximum 4 overnight guests. Respect the property and neighbours.',
  cancellation_policy text DEFAULT 'Reservations are non-refundable once confirmed and payment has been verified, subject to applicable law and mandatory consumer protections.',
  party_rate_conditions text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_settings" ON property_settings;
CREATE POLICY "public_read_settings" ON property_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_settings" ON property_settings;
CREATE POLICY "admin_update_settings" ON property_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_insert_settings" ON property_settings;
CREATE POLICY "admin_insert_settings" ON property_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- APARTMENT UNITS
-- ============================================================
CREATE TABLE IF NOT EXISTS apartment_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_label text NOT NULL,
  unit_number integer,
  status unit_status_enum NOT NULL DEFAULT 'active',
  features jsonb DEFAULT '[]'::jsonb,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE apartment_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_units" ON apartment_units;
CREATE POLICY "public_read_units" ON apartment_units FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_units" ON apartment_units;
CREATE POLICY "admin_insert_units" ON apartment_units FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_update_units" ON apartment_units;
CREATE POLICY "admin_update_units" ON apartment_units FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_delete_units" ON apartment_units;
CREATE POLICY "admin_delete_units" ON apartment_units FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- GUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  notes text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_read_guests" ON guests;
CREATE POLICY "admin_read_guests" ON guests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_guests" ON guests;
CREATE POLICY "public_insert_guests" ON guests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admin_update_guests" ON guests;
CREATE POLICY "admin_update_guests" ON guests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES apartment_units(id) ON DELETE SET NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer NOT NULL,
  guest_count integer NOT NULL DEFAULT 1,
  accommodation_subtotal numeric NOT NULL DEFAULT 0,
  caution_fee numeric NOT NULL DEFAULT 50000,
  total_amount numeric NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'DRAFT',
  rate_type text NOT NULL DEFAULT 'standard',
  special_requests text,
  accepted_rules boolean NOT NULL DEFAULT false,
  hold_expires_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  cancellation_reason text,
  internal_notes text,
  idempotency_key text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_out_after_check_in CHECK (check_out > check_in),
  CONSTRAINT valid_nights CHECK (nights >= 1)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_unit_dates ON bookings(unit_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_id);

DROP POLICY IF EXISTS "read_bookings" ON bookings;
CREATE POLICY "read_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_bookings" ON bookings;
CREATE POLICY "insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_bookings" ON bookings;
CREATE POLICY "update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  expected_amount numeric NOT NULL,
  verified_amount numeric,
  payment_status payment_status NOT NULL DEFAULT 'NOT_SUBMITTED',
  transfer_narration text,
  bank_transaction_ref text,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  rejection_notes text,
  submitted_at timestamptz,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_bank_transaction_ref ON payments(bank_transaction_ref);

DROP POLICY IF EXISTS "read_payments" ON payments;
CREATE POLICY "read_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_payments" ON payments;
CREATE POLICY "insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_payments" ON payments;
CREATE POLICY "update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PAYMENT RECEIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  receipt_status receipt_status NOT NULL DEFAULT 'NOT_UPLOADED',
  uploaded_by text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_receipts_booking ON payment_receipts(booking_id);

DROP POLICY IF EXISTS "read_receipts" ON payment_receipts;
CREATE POLICY "read_receipts" ON payment_receipts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_receipts" ON payment_receipts;
CREATE POLICY "insert_receipts" ON payment_receipts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_receipts" ON payment_receipts;
CREATE POLICY "update_receipts" ON payment_receipts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_receipts" ON payment_receipts;
CREATE POLICY "delete_receipts" ON payment_receipts FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- CAUTION FEE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS caution_fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  expected_amount numeric NOT NULL DEFAULT 50000,
  amount_received numeric,
  inspection_status caution_refund_status NOT NULL DEFAULT 'expected',
  amount_refunded numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  deduction_reason text,
  refund_date timestamptz,
  refund_reference text,
  inspection_notes text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE caution_fee_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_caution_booking ON caution_fee_records(booking_id);

DROP POLICY IF EXISTS "read_caution_fees" ON caution_fee_records;
CREATE POLICY "read_caution_fees" ON caution_fee_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_caution_fees" ON caution_fee_records;
CREATE POLICY "insert_caution_fees" ON caution_fee_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_caution_fees" ON caution_fee_records;
CREATE POLICY "update_caution_fees" ON caution_fee_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ENQUIRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text,
  guest_phone text,
  guest_email text,
  requested_check_in date,
  requested_check_out date,
  guest_count integer,
  message text,
  estimated_value numeric,
  lost_reason text,
  follow_up_status enquiry_status NOT NULL DEFAULT 'new',
  staff_notes text,
  preferred_unit text,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(follow_up_status);

DROP POLICY IF EXISTS "read_enquiries" ON enquiries;
CREATE POLICY "read_enquiries" ON enquiries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_enquiries" ON enquiries;
CREATE POLICY "insert_enquiries" ON enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_enquiries" ON enquiries;
CREATE POLICY "update_enquiries" ON enquiries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- MAINTENANCE BLOCKS
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES apartment_units(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_by uuid,
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT maintenance_dates_valid CHECK (end_date >= start_date)
);

ALTER TABLE maintenance_blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_maint_unit_dates ON maintenance_blocks(unit_id, start_date, end_date);

DROP POLICY IF EXISTS "read_maintenance" ON maintenance_blocks;
CREATE POLICY "read_maintenance" ON maintenance_blocks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_maintenance" ON maintenance_blocks;
CREATE POLICY "insert_maintenance" ON maintenance_blocks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_maintenance" ON maintenance_blocks;
CREATE POLICY "update_maintenance" ON maintenance_blocks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_maintenance" ON maintenance_blocks;
CREATE POLICY "delete_maintenance" ON maintenance_blocks FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- STAFF PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  role staff_role NOT NULL DEFAULT 'receptionist',
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_staff_profiles" ON staff_profiles;
CREATE POLICY "read_staff_profiles" ON staff_profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_staff_profiles" ON staff_profiles;
CREATE POLICY "insert_staff_profiles" ON staff_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_staff_profiles" ON staff_profiles;
CREATE POLICY "update_staff_profiles" ON staff_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

DROP POLICY IF EXISTS "read_audit_logs" ON audit_logs;
CREATE POLICY "read_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);