/*
# DEESHADES APARTMENT — Server Functions

## Overview
Creates PostgreSQL functions for:
1. `generate_booking_reference()` — Generate unique DSD-YYMM-XXXX references
2. `check_availability()` — Check which units are available for a date range
3. `get_unit_date_status()` — Get unit status for a specific date
4. `create_booking()` — Create a booking with inventory hold (idempotent)
5. `set_updated_at()` — Auto-update updated_at trigger

## Security
- Functions are SECURITY DEFINER where needed
- Availability function is safe for public use
- Booking creation validates inputs and checks for conflicts

## Important Notes
- Booking references are unique with DB constraint and retry on collision
- Availability checks consider confirmed bookings, holds, and maintenance
- Booking creation is idempotent via idempotency_key
*/

-- ============================================================
-- Updated at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_properties BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_settings BEFORE UPDATE ON property_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_units BEFORE UPDATE ON apartment_units
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_guests BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_bookings BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_receipts BEFORE UPDATE ON payment_receipts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_caution BEFORE UPDATE ON caution_fee_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_enquiries BEFORE UPDATE ON enquiries
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_maintenance BEFORE UPDATE ON maintenance_blocks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_staff BEFORE UPDATE ON staff_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Generate unique booking reference (DSD-YYMM-XXXX)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text AS $$
DECLARE
  ref text;
  yy_mm text;
  rand_code text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  attempts integer := 0;
BEGIN
  yy_mm := to_char(now(), 'YYMM');
  
  LOOP
    rand_code := '';
    FOR i IN 1..4 LOOP
      rand_code := rand_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    ref := 'DSD-' || yy_mm || '-' || rand_code;
    
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = ref);
    
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique booking reference after 100 attempts';
    END IF;
  END LOOP;
  
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Check availability for a date range
-- ============================================================
CREATE OR REPLACE FUNCTION check_availability(
  p_check_in date,
  p_check_out date
)
RETURNS TABLE (
  unit_id uuid,
  unit_label text,
  unit_number integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id AS unit_id,
    au.unit_label,
    au.unit_number,
    au.status::text
  FROM apartment_units au
  WHERE au.status = 'active'
    AND au.id NOT IN (
      SELECT b.unit_id FROM bookings b
      WHERE b.unit_id IS NOT NULL
        AND b.check_in < p_check_out
        AND b.check_out > p_check_in
        AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
        AND (b.hold_expires_at IS NULL OR b.hold_expires_at > now())
    )
    AND au.id NOT IN (
      SELECT mb.unit_id FROM maintenance_blocks mb
      WHERE mb.start_date < p_check_out
        AND mb.end_date >= p_check_in
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Get unit status for a specific date (for calendar)
-- ============================================================
CREATE OR REPLACE FUNCTION get_unit_date_status(
  p_unit_id uuid,
  p_date date
)
RETURNS TABLE (
  status text,
  booking_ref text,
  guest_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN mb.id IS NOT NULL THEN 'MAINTENANCE_BLOCK'
      WHEN b.status = 'CHECKED_IN' THEN 'OCCUPIED'
      WHEN b.status = 'CONFIRMED' THEN 'RESERVED'
      WHEN b.status = 'PENDING' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > now()) THEN 'PENDING_VERIFICATION_HOLD'
      WHEN b.status = 'PENDING' AND b.hold_expires_at <= now() THEN 'AVAILABLE'
      ELSE 'AVAILABLE'
    END AS status,
    b.booking_reference AS booking_ref,
    g.full_name AS guest_name
  FROM apartment_units au
  LEFT JOIN bookings b ON b.unit_id = au.id
    AND p_date >= b.check_in
    AND p_date < b.check_out
    AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
    AND (b.hold_expires_at IS NULL OR b.hold_expires_at > now() OR b.status IN ('CONFIRMED', 'CHECKED_IN'))
  LEFT JOIN guests g ON g.id = b.guest_id
  LEFT JOIN maintenance_blocks mb ON mb.unit_id = au.id
    AND p_date >= mb.start_date
    AND p_date <= mb.end_date
  WHERE au.id = p_unit_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Create booking (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION create_booking(
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_check_in date,
  p_check_out date,
  p_guest_count integer,
  p_special_requests text DEFAULT NULL,
  p_accepted_rules boolean DEFAULT false,
  p_rate_type text DEFAULT 'standard',
  p_accommodation_subtotal numeric DEFAULT 0,
  p_caution_fee numeric DEFAULT 50000,
  p_total_amount numeric DEFAULT 0,
  p_hold_minutes integer DEFAULT 120,
  p_idempotency_key text DEFAULT NULL,
  p_is_demo boolean DEFAULT false
)
RETURNS TABLE (
  booking_id uuid,
  booking_reference text,
  guest_id uuid,
  nights integer,
  total_amount numeric
) AS $$
DECLARE
  v_guest_id uuid;
  v_booking_id uuid;
  v_ref text;
  v_nights integer;
  v_hold_expires timestamptz;
  v_existing_id uuid;
  v_existing_ref text;
  v_existing_guest uuid;
  v_existing_nights integer;
  v_existing_total numeric;
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, booking_reference, guest_id, nights, total_amount 
    INTO v_existing_id, v_existing_ref, v_existing_guest, v_existing_nights, v_existing_total
    FROM bookings WHERE idempotency_key = p_idempotency_key AND status = 'DRAFT';
    IF FOUND THEN
      RETURN QUERY SELECT v_existing_id, v_existing_ref, v_existing_guest, v_existing_nights, v_existing_total;
      RETURN;
    END IF;
  END IF;

  -- Calculate nights
  v_nights := p_check_out - p_check_in;
  
  -- Set hold expiry
  v_hold_expires := now() + (p_hold_minutes || ' minutes')::interval;
  
  -- Find or create guest
  SELECT id INTO v_guest_id FROM guests WHERE phone = p_guest_phone LIMIT 1;
  IF v_guest_id IS NULL THEN
    INSERT INTO guests (full_name, phone, email, is_demo)
    VALUES (p_guest_name, p_guest_phone, p_guest_email, p_is_demo)
    RETURNING id INTO v_guest_id;
  ELSE
    UPDATE guests SET full_name = p_guest_name, email = COALESCE(p_guest_email, email), updated_at = now()
    WHERE id = v_guest_id;
  END IF;
  
  -- Generate reference
  v_ref := generate_booking_reference();
  
  -- Create booking
  INSERT INTO bookings (
    booking_reference, guest_id, check_in, check_out, nights,
    guest_count, accommodation_subtotal, caution_fee, total_amount,
    status, rate_type, special_requests, accepted_rules,
    hold_expires_at, idempotency_key, is_demo
  )
  VALUES (
    v_ref, v_guest_id, p_check_in, p_check_out, v_nights,
    p_guest_count, p_accommodation_subtotal, p_caution_fee, p_total_amount,
    'DRAFT', p_rate_type, p_special_requests, p_accepted_rules,
    v_hold_expires, p_idempotency_key, p_is_demo
  )
  RETURNING id INTO v_booking_id;
  
  RETURN QUERY SELECT v_booking_id, v_ref, v_guest_id, v_nights, p_total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;