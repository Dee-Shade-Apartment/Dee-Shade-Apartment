/*
# DEESHADES APARTMENT — Storage Bucket & Demo Seed Data

## Overview
1. Creates a private storage bucket 'payment-receipts' for receipt uploads
2. Seeds the property, 5 apartment units, default settings, and demo bookings
3. Adds is_demo column to audit_logs for demo flagging

## Storage
- 'payment-receipts' bucket is private (not public)
- Anon + authenticated can upload (guests submit receipts during booking)
- Only authenticated can read (admins view receipts)

## Demo Data
- 5 apartment units (Unit A through Unit E)
- Demo bookings: pending, confirmed, rejected, expired, checked-out
- Demo maintenance block on Unit E
- Demo caution fee records
- Demo lost enquiries
- All demo records flagged with is_demo = true
*/

-- ============================================================
-- Storage bucket for payment receipts (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "receipt_upload_policy" ON storage.objects;
CREATE POLICY "receipt_upload_policy" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "receipt_read_policy" ON storage.objects;
CREATE POLICY "receipt_read_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "receipt_delete_policy" ON storage.objects;
CREATE POLICY "receipt_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts');

-- ============================================================
-- Add is_demo to audit_logs
-- ============================================================
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- ============================================================
-- SEED: Property
-- ============================================================
INSERT INTO properties (id, name, address, is_demo)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'DEESHADES APARTMENT',
  'Gbenga Fapohunda Street, Alagbaka Extension, Akure, Ondo State, Nigeria.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Property Settings
-- ============================================================
INSERT INTO property_settings (property_id, standard_rate, party_rate, caution_fee, max_occupancy, hold_duration_minutes, is_demo)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  100000, 200000, 50000, 4, 120, true
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: 5 Apartment Units
-- ============================================================
INSERT INTO apartment_units (id, property_id, unit_label, unit_number, status, features, is_demo)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Unit A', 1, 'active', '["2 Bedroom","Fully Equipped Kitchen","Smart TV","Netflix","Amazon Prime Video","Starlink Wi-Fi","24/7 Electricity","Standby Generator","Refrigerator","Heat Extractor","Snooker Board","Table Tennis","Security & CCTV","Ample Parking"]'::jsonb, true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Unit B', 2, 'active', '["2 Bedroom","Fully Equipped Kitchen","Smart TV","Netflix","Amazon Prime Video","Starlink Wi-Fi","24/7 Electricity","Standby Generator","Refrigerator","Heat Extractor","Snooker Board","Table Tennis","Security & CCTV","Ample Parking"]'::jsonb, true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Unit C', 3, 'active', '["2 Bedroom","Fully Equipped Kitchen","Smart TV","Netflix","Amazon Prime Video","Starlink Wi-Fi","24/7 Electricity","Standby Generator","Refrigerator","Heat Extractor","Snooker Board","Table Tennis","Security & CCTV","Ample Parking"]'::jsonb, true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Unit D', 4, 'active', '["2 Bedroom","Fully Equipped Kitchen","Smart TV","Netflix","Amazon Prime Video","Starlink Wi-Fi","24/7 Electricity","Standby Generator","Refrigerator","Heat Extractor","Snooker Board","Table Tennis","Security & CCTV","Ample Parking"]'::jsonb, true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Unit E', 5, 'maintenance', '["2 Bedroom","Fully Equipped Kitchen","Smart TV","Netflix","Amazon Prime Video","Starlink Wi-Fi","24/7 Electricity","Standby Generator","Refrigerator","Heat Extractor","Snooker Board","Table Tennis","Security & CCTV","Ample Parking"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Demo guests
-- ============================================================
INSERT INTO guests (id, full_name, phone, email, is_demo)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Chidi Okafor', '+2348012345678', 'chidi.okafor@example.com', true),
  ('c0000000-0000-0000-0000-000000000002', 'Aisha Bello', '+2348023456789', 'aisha.bello@example.com', true),
  ('c0000000-0000-0000-0000-000000000003', 'Tunde Adeyemi', '+2348034567890', 'tunde.adeyemi@example.com', true),
  ('c0000000-0000-0000-0000-000000000004', 'Ngozi Eze', '+2348045678901', 'ngozi.eze@example.com', true),
  ('c0000000-0000-0000-0000-000000000005', 'Emeka Nwosu', '+2348056789012', 'emeka.nwosu@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Demo bookings
-- ============================================================
INSERT INTO bookings (id, booking_reference, guest_id, unit_id, check_in, check_out, nights, guest_count, accommodation_subtotal, caution_fee, total_amount, status, rate_type, hold_expires_at, is_demo)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'DSD-2610-A7K2', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE + 7, CURRENT_DATE + 9, 2, 2, 200000, 50000, 250000, 'PENDING', 'standard', now() + interval '90 minutes', true),
  ('d0000000-0000-0000-0000-000000000002', 'DSD-2610-B3X9', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', CURRENT_DATE + 14, CURRENT_DATE + 17, 3, 4, 300000, 50000, 350000, 'CONFIRMED', 'standard', NULL, true),
  ('d0000000-0000-0000-0000-000000000003', 'DSD-2610-C5M1', 'c0000000-0000-0000-0000-000000000003', NULL, CURRENT_DATE + 21, CURRENT_DATE + 23, 2, 2, 200000, 50000, 250000, 'REJECTED', 'standard', now() - interval '2 hours', true),
  ('d0000000-0000-0000-0000-000000000004', 'DSD-2609-D8N4', 'c0000000-0000-0000-0000-000000000004', NULL, CURRENT_DATE + 3, CURRENT_DATE + 5, 2, 1, 200000, 50000, 250000, 'EXPIRED', 'standard', now() - interval '3 hours', true),
  ('d0000000-0000-0000-0000-000000000005', 'DSD-2608-E2P7', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', CURRENT_DATE - 14, CURRENT_DATE - 11, 3, 3, 300000, 50000, 350000, 'CHECKED_OUT', 'standard', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Demo payments
-- ============================================================
INSERT INTO payments (id, booking_id, expected_amount, verified_amount, payment_status, transfer_narration, bank_transaction_ref, rejection_reason, submitted_at, verified_at, is_demo)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 250000, NULL, 'AWAITING_VERIFICATION', 'DSD-2610-A7K2', NULL, NULL, now() - interval '10 minutes', NULL, true),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 350000, 350000, 'VERIFIED', 'DSD-2610-B3X9', 'BANK-TRX-001234', NULL, now() - interval '5 days', now() - interval '4 days', true),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 250000, NULL, 'REJECTED', 'DSD-2610-C5M1', NULL, 'Transfer not found', now() - interval '6 hours', NULL, true),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 250000, NULL, 'NOT_SUBMITTED', NULL, NULL, NULL, NULL, NULL, true),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 350000, 350000, 'VERIFIED', 'DSD-2608-E2P7', 'BANK-TRX-009876', NULL, now() - interval '20 days', now() - interval '19 days', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Demo caution fee records
-- ============================================================
INSERT INTO caution_fee_records (booking_id, expected_amount, amount_received, inspection_status, is_demo)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 50000, NULL, 'expected', true),
  ('d0000000-0000-0000-0000-000000000002', 50000, 50000, 'received', true),
  ('d0000000-0000-0000-0000-000000000005', 50000, 50000, 'awaiting_inspection', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Demo maintenance block
-- ============================================================
INSERT INTO maintenance_blocks (id, unit_id, start_date, end_date, reason, is_demo)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', CURRENT_DATE, CURRENT_DATE + 10, 'AC repair and interior repainting', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: Demo lost enquiries
-- ============================================================
INSERT INTO enquiries (guest_name, guest_phone, guest_email, requested_check_in, requested_check_out, guest_count, message, estimated_value, lost_reason, follow_up_status, staff_notes, is_demo)
VALUES
  ('Kunle Adebayo', '+2348067890123', 'kunle.adebayo@example.com', CURRENT_DATE + 2, CURRENT_DATE + 4, 4, 'Looking for a 2-bedroom apartment for a weekend getaway.', 250000, 'No availability', 'lost', 'Guest wanted Unit A but it was already booked. Suggested alternative dates.', true),
  ('Funmilayo Ogundimu', '+2348078901234', NULL, CURRENT_DATE + 10, CURRENT_DATE + 12, 2, 'Interested in booking but the price was a bit high for our budget.', 250000, 'Price too high', 'lost', 'Guest indicated price was beyond budget. No negotiation was offered.', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Demo audit log entries
-- ============================================================
INSERT INTO audit_logs (action, entity_type, entity_id, metadata, reason, is_demo)
VALUES
  ('payment_verified', 'booking', 'd0000000-0000-0000-0000-000000000002', '{"amount": 350000, "method": "bank_transfer"}'::jsonb, 'Bank transfer confirmed against account statement', true),
  ('payment_rejected', 'booking', 'd0000000-0000-0000-0000-000000000003', '{"reason": "Transfer not found"}'::jsonb, 'No matching transfer found in bank statement', true),
  ('booking_created', 'booking', 'd0000000-0000-0000-0000-000000000001', '{"reference": "DSD-2610-A7K2"}'::jsonb, 'New booking submitted by guest', true),
  ('maintenance_block_created', 'apartment_unit', 'b0000000-0000-0000-0000-000000000005', '{"reason": "AC repair and interior repainting"}'::jsonb, 'Unit E blocked for maintenance', true)
ON CONFLICT DO NOTHING;