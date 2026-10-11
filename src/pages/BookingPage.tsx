import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, Search, ChevronRight, ChevronLeft, Check,
  Copy, Upload, FileText, MessageCircle, AlertCircle, Lock,
  Home, Receipt, Info, Clock,
} from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { BUSINESS, HOUSE_RULES } from '@/lib/constants';
import {
  formatNaira, formatDate, formatDateTime, todayISO, tomorrowISO,
  calculateNights, buildWhatsAppLink, generateIdempotencyKey,
} from '@/lib/utils';
import type { ApartmentUnit, Property, PropertySettings } from '@/lib/types';

interface BookingPageProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  property: Property | null;
  settings: PropertySettings | null;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface AvailabilityResult {
  unit_id: string;
  unit_label: string;
  unit_number: number | null;
  status: string;
}

export function BookingPage({ initialCheckIn, initialCheckOut, initialGuests, property, settings }: BookingPageProps) {
  const [step, setStep] = useState<Step>(1);
  const [checkIn, setCheckIn] = useState(initialCheckIn || '');
  const [checkOut, setCheckOut] = useState(initialCheckOut || '');
  const [guests, setGuests] = useState(initialGuests || 2);
  const [availableUnits, setAvailableUnits] = useState<AvailabilityResult[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<AvailabilityResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Guest details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);

  // Booking result
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [idempotencyKey] = useState(generateIdempotencyKey());
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const nights = calculateNights(checkIn, checkOut);
  const standardRate = settings?.standard_rate || BUSINESS.standardRate;
  const cautionFee = settings?.caution_fee || BUSINESS.cautionFee;
  const accommodationSubtotal = nights * standardRate;
  const totalAmount = accommodationSubtotal + cautionFee;

  const bankName = settings?.bank_name || '';
  const accountName = settings?.account_name || '';
  const accountNumber = settings?.account_number || '';
  const whatsappNumber = property?.whatsapp_number || '';
  const bankConfigured = !!(bankName && accountName && accountNumber);

  useEffect(() => {
    if (initialCheckIn && initialCheckOut) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(async () => {
    if (!checkIn || !checkOut) { toast('error', 'Please select check-in and check-out dates.'); return; }
    if (checkIn < todayISO()) { toast('error', 'Check-in date cannot be in the past.'); return; }
    if (checkOut <= checkIn) { toast('error', 'Check-out must be after check-in.'); return; }

    setSearching(true);
    setHasSearched(true);
    const { data, error } = await supabase.rpc('check_availability', {
      p_check_in: checkIn,
      p_check_out: checkOut,
    });
    setSearching(false);

    if (error) { toast('error', 'Could not check availability. Please try again.'); return; }
    setAvailableUnits(data || []);
    setSelectedUnit(null);
  }, [checkIn, checkOut]);

  const proceedToGuestDetails = () => {
    if (!selectedUnit) { toast('error', 'Please select an available unit.'); return; }
    setStep(2);
  };

  const proceedToPricing = () => {
    if (!fullName.trim()) { toast('error', 'Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { toast('error', 'Please enter a valid email address.'); return; }
    if (!phone.trim()) { toast('error', 'Please enter your phone number including country code.'); return; }
    if (!acceptedRules) { toast('error', 'Please accept the house rules and booking policy to continue.'); return; }
    setStep(3);
  };

  const createBookingRecord = async (): Promise<{ id: string; ref: string } | null> => {
    if (bookingId && bookingRef) return { id: bookingId, ref: bookingRef };

    setSubmitting(true);
    const { data, error } = await supabase.rpc('create_booking', {
      p_guest_name: fullName,
      p_guest_phone: phone,
      p_guest_email: email,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_count: guests,
      p_special_requests: specialRequests || null,
      p_accepted_rules: acceptedRules,
      p_rate_type: 'standard',
      p_accommodation_subtotal: accommodationSubtotal,
      p_caution_fee: cautionFee,
      p_total_amount: totalAmount,
      p_hold_minutes: settings?.hold_duration_minutes || 120,
      p_idempotency_key: idempotencyKey,
    });
    setSubmitting(false);

    if (error || !data || data.length === 0) {
      toast('error', 'Could not create your booking. Please try again.');
      return null;
    }

    const result = data[0];
    setBookingId(result.booking_id);
    setBookingRef(result.booking_reference);
    return { id: result.booking_id, ref: result.booking_reference };
  };

  const proceedToPayment = async () => {
    const result = await createBookingRecord();
    if (result) setStep(4);
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      toast('error', 'Only JPG, JPEG, PNG and PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('error', 'File size must not exceed 5 MB.');
      return;
    }

    setReceiptFile(file);
    uploadReceipt(file);
  };

  const uploadReceipt = async (file: File) => {
    if (!bookingId) return;
    setUploadingReceipt(true);

    const filePath = `${bookingId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, file);

    if (uploadError) {
      setUploadingReceipt(false);
      toast('error', 'Could not upload receipt. Please try again.');
      return;
    }

    const { error: dbError } = await supabase.from('payment_receipts').insert({
      booking_id: bookingId,
      storage_path: filePath,
      original_filename: file.name,
      file_type: file.type,
      file_size: file.size,
      receipt_status: 'SUBMITTED',
      uploaded_by: 'guest',
    });

    setUploadingReceipt(false);

    if (dbError) {
      toast('error', 'Receipt uploaded but could not save record. Please try again.');
      return;
    }

    setReceiptPath(filePath);
    toast('success', 'Receipt uploaded successfully.');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast('success', `${label} copied to clipboard.`);
    });
  };

  const buildWhatsAppMessage = (): string => {
    return [
      'DEESHADES APARTMENT — PAYMENT NOTIFICATION',
      '',
      `Booking Reference: ${bookingRef}`,
      `Guest Name: ${fullName}`,
      `Phone: ${phone}`,
      `Check-in: ${formatDate(checkIn)}`,
      `Check-out: ${formatDate(checkOut)}`,
      `Nights: ${nights}`,
      `Guests: ${guests}`,
      `Apartment Unit: ${selectedUnit?.unit_label || 'Pending assignment'}`,
      `Accommodation Amount: ${formatNaira(accommodationSubtotal)}`,
      `Refundable Caution Fee: ${formatNaira(cautionFee)}`,
      `Total Amount Due: ${formatNaira(totalAmount)}`,
      `Transfer Narration: ${bookingRef}`,
      `Receipt: Uploaded on the booking platform.`,
      `Submission Time: ${formatDateTime(new Date())}`,
      '',
      'Please verify the transfer and update my booking status. Thank you.',
    ].join('\n');
  };

  const handleNotifyDeeshades = async () => {
    if (!receiptPath && !receiptFile) {
      toast('error', 'Please upload your payment receipt first.');
      return;
    }
    if (!bookingId) {
      toast('error', 'Booking record not found. Please go back and try again.');
      return;
    }

    setSubmitting(true);

    // Update booking to PENDING
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'PENDING' })
      .eq('id', bookingId);

    if (bookingError) {
      setSubmitting(false);
      toast('error', 'Could not update booking status. Please try again.');
      return;
    }

    // Create or update payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingPayment) {
      await supabase
        .from('payments')
        .update({
          payment_status: 'AWAITING_VERIFICATION',
          transfer_narration: bookingRef,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
    } else {
      await supabase.from('payments').insert({
        booking_id: bookingId,
        expected_amount: totalAmount,
        payment_status: 'AWAITING_VERIFICATION',
        transfer_narration: bookingRef,
        submitted_at: new Date().toISOString(),
      });
    }

    // Insert audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_submitted',
      entity_type: 'booking',
      entity_id: bookingId,
      metadata: { reference: bookingRef, amount: totalAmount },
      reason: 'Guest submitted payment notification with receipt',
    });

    // Insert caution fee record if not exists
    const { data: existingCaution } = await supabase
      .from('caution_fee_records')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (!existingCaution) {
      await supabase.from('caution_fee_records').insert({
        booking_id: bookingId,
        expected_amount: cautionFee,
        inspection_status: 'expected',
      });
    }

    setSubmitting(false);
    setPaymentSubmitted(true);

    // Open WhatsApp
    if (whatsappNumber) {
      const link = buildWhatsAppLink(whatsappNumber, buildWhatsAppMessage());
      window.open(link, '_blank');
      setWhatsappSent(true);
    }

    setStep(5);
  };

  const steps = [
    { num: 1, label: 'Dates' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Pricing' },
    { num: 4, label: 'Payment' },
    { num: 5, label: 'Confirmation' },
  ];

  return (
    <div className="min-h-screen bg-cream-50 pt-16">
      <div className="container-wide py-8">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                  step >= s.num ? 'bg-gold-600 text-white' : 'bg-ink-100 text-ink-400'
                }`}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                    {step > s.num ? <Check className="h-3 w-3" /> : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-ink-300 mx-0.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Dates & Availability */}
        {step === 1 && (
          <div className="mx-auto max-w-4xl">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-ink-900">Select Your Dates</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label-text flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gold-600" /> Check-in</label>
                  <input type="date" min={todayISO()} value={checkIn} onChange={e => setCheckIn(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label-text flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gold-600" /> Check-out</label>
                  <input type="date" min={checkIn || tomorrowISO()} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label-text flex items-center gap-1.5"><Users className="h-4 w-4 text-gold-600" /> Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="input-field">
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div>
                  {nights > 0 && (
                    <p className="text-sm text-ink-500">
                      {nights} {nights === 1 ? 'night' : 'nights'} · {formatNaira(accommodationSubtotal)} + {formatNaira(cautionFee)} caution fee
                    </p>
                  )}
                </div>
                <button onClick={handleSearch} disabled={searching} className="btn-primary">
                  {searching ? <LoadingSpinner size="sm" /> : <><Search className="h-4 w-4" /> Check Availability</>}
                </button>
              </div>
            </Card>

            {hasSearched && !searching && (
              <div className="mt-6">
                {availableUnits.length > 0 ? (
                  <>
                    <p className="mb-3 text-sm font-medium text-ink-700">
                      {availableUnits.length} {availableUnits.length === 1 ? 'unit' : 'units'} available for your dates
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availableUnits.map(unit => (
                        <button
                          key={unit.unit_id}
                          onClick={() => setSelectedUnit(unit)}
                          className={`rounded-2xl border-2 p-5 text-left transition-all ${
                            selectedUnit?.unit_id === unit.unit_id
                              ? 'border-gold-500 bg-gold-50'
                              : 'border-ink-100 bg-white hover:border-gold-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Home className="h-5 w-5 text-gold-600" />
                            {selectedUnit?.unit_id === unit.unit_id && <Check className="h-5 w-5 text-gold-600" />}
                          </div>
                          <p className="mt-3 font-serif text-lg font-semibold text-ink-900">{unit.unit_label}</p>
                          <p className="mt-1 text-sm text-ink-500">2 Bedroom · 4 Guests max</p>
                          <p className="mt-2 text-sm font-medium text-gold-700">{formatNaira(standardRate)}/night</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button onClick={proceedToGuestDetails} disabled={!selectedUnit} className="btn-primary">
                        Continue <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <Card className="p-8">
                    <EmptyState
                      icon={<AlertCircle className="h-12 w-12" />}
                      title="No units available for these dates"
                      message="All apartments are booked or under maintenance for your selected dates. You can try different dates or submit an enquiry."
                      action={
                        <div className="flex gap-3">
                          <button onClick={() => setHasSearched(false)} className="btn-secondary">Try Different Dates</button>
                          <button
                            onClick={async () => {
                              await supabase.from('enquiries').insert({
                                guest_name: null,
                                message: `Enquiry for unavailable dates: ${formatDate(checkIn)} to ${formatDate(checkOut)} (${guests} guests)`,
                                requested_check_in: checkIn,
                                requested_check_out: checkOut,
                                guest_count: guests,
                                estimated_value: totalAmount,
                                lost_reason: 'No availability',
                                follow_up_status: 'waitlisted',
                              });
                              toast('success', 'Your enquiry has been recorded. We will contact you if dates become available.');
                            }}
                            className="btn-primary"
                          >
                            Join Waitlist
                          </button>
                        </div>
                      }
                    />
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Guest Details */}
        {step === 2 && (
          <div className="mx-auto max-w-2xl">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-ink-900">Guest Details</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="label-text">Full Name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Your full name" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-text">Email Address *</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="label-text">Phone Number * (with country code)</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="input-field" placeholder="+234..." />
                  </div>
                </div>
                <div>
                  <label className="label-text">Number of Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="input-field">
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Special Requests (optional)</label>
                  <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={3} className="input-field resize-none" placeholder="Any special requirements..." />
                </div>
                <div className="rounded-xl border border-ink-100 bg-cream-50 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={acceptedRules} onChange={e => setAcceptedRules(e.target.checked)} className="mt-1 h-4 w-4 rounded border-ink-300 text-gold-600 focus:ring-gold-500" />
                    <span className="text-sm text-ink-600">
                      I have read and accept the{' '}
                      <button onClick={(e) => { e.preventDefault(); setShowRulesModal(true); }} className="font-medium text-gold-600 underline">
                        house rules and booking policy
                      </button>.
                    </span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={proceedToPricing} className="btn-primary">Continue <ChevronRight className="h-4 w-4" /></button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Price Breakdown */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-ink-900">Price Breakdown</h2>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium text-ink-900">Accommodation</p>
                    <p className="text-ink-500">{nights} {nights === 1 ? 'night' : 'nights'} × {formatNaira(standardRate)}</p>
                  </div>
                  <p className="text-lg font-semibold text-ink-900">{formatNaira(accommodationSubtotal)}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <div className="text-sm">
                    <p className="font-medium text-ink-900">Refundable Caution Fee</p>
                    <p className="text-ink-500">Returned after checkout subject to inspection</p>
                  </div>
                  <p className="text-lg font-semibold text-ink-900">{formatNaira(cautionFee)}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gold-600 px-4 py-4">
                  <p className="text-base font-semibold text-white">Total Amount Due</p>
                  <p className="text-2xl font-bold text-white">{formatNaira(totalAmount)}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-ink-100 p-4">
                <h3 className="text-sm font-semibold text-ink-900">Booking Summary</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-ink-400">Check-in</p><p className="font-medium text-ink-700">{formatDate(checkIn)}</p></div>
                  <div><p className="text-ink-400">Check-out</p><p className="font-medium text-ink-700">{formatDate(checkOut)}</p></div>
                  <div><p className="text-ink-400">Nights</p><p className="font-medium text-ink-700">{nights}</p></div>
                  <div><p className="text-ink-400">Guests</p><p className="font-medium text-ink-700">{guests}</p></div>
                  <div><p className="text-ink-400">Unit</p><p className="font-medium text-ink-700">{selectedUnit?.unit_label}</p></div>
                  <div><p className="text-ink-400">Guest</p><p className="font-medium text-ink-700">{fullName}</p></div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>The ₦50,000 caution fee is tracked separately from accommodation revenue and is refundable after checkout.</p>
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary"><ChevronLeft className="h-4 w-4" /> Back</button>
                <button onClick={proceedToPayment} disabled={submitting} className="btn-primary">
                  {submitting ? <LoadingSpinner size="sm" /> : <>Proceed to Payment <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: Bank Transfer Payment */}
        {step === 4 && (
          <div className="mx-auto max-w-3xl space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-600">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Bank Transfer Payment</h2>
                  <p className="text-sm text-ink-500">Transfer the total amount to the account below, then upload your receipt.</p>
                </div>
              </div>

              {/* Booking Reference */}
              <div className="mt-6 rounded-xl bg-ink-900 p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gold-400">Your Booking Reference</p>
                <p className="mt-1 font-serif text-3xl font-bold text-white">{bookingRef}</p>
                <button onClick={() => copyToClipboard(bookingRef, 'Booking reference')} className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-300 hover:text-white">
                  <Copy className="h-3 w-3" /> Copy reference
                </button>
                <p className="mt-2 text-xs text-ink-400">Use this as your transfer narration / payment description.</p>
              </div>

              {/* Bank Details */}
              {bankConfigured ? (
                <div className="mt-6 rounded-xl border border-ink-100 p-5">
                  <h3 className="text-sm font-semibold text-ink-900">Bank Details</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                      <div><p className="text-xs text-ink-400">Bank Name</p><p className="text-sm font-medium text-ink-900">{bankName}</p></div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                      <div><p className="text-xs text-ink-400">Account Name</p><p className="text-sm font-medium text-ink-900">{accountName}</p></div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                      <div><p className="text-xs text-ink-400">Account Number</p><p className="text-sm font-medium text-ink-900">{accountNumber}</p></div>
                      <button onClick={() => copyToClipboard(accountNumber, 'Account number')} className="text-gold-600 hover:text-gold-700"><Copy className="h-4 w-4" /></button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3">
                      <div><p className="text-xs text-gold-600">Amount Due</p><p className="text-sm font-bold text-gold-800">{formatNaira(totalAmount)}</p></div>
                      <button onClick={() => copyToClipboard(String(totalAmount), 'Amount')} className="text-gold-600 hover:text-gold-700"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${bankName}\n${accountName}\n${accountNumber}\nAmount: ${formatNaira(totalAmount)}\nNarration: ${bookingRef}`, 'Bank details')}
                    className="mt-3 btn-secondary w-full"
                  >
                    <Copy className="h-4 w-4" /> Copy All Bank Details
                  </button>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
                  <p className="mt-2 text-sm font-medium text-amber-800">Bank details not yet configured</p>
                  <p className="mt-1 text-xs text-amber-600">Management needs to configure bank account details in the admin settings before payments can be processed. Your booking has been created — please contact management directly for payment instructions.</p>
                </div>
              )}

              {/* Payment Instructions */}
              {settings?.payment_instructions && (
                <div className="mt-4 rounded-xl bg-cream-50 p-4">
                  <h3 className="text-sm font-semibold text-ink-900">Payment Instructions</h3>
                  <p className="mt-2 text-sm text-ink-600">{settings.payment_instructions}</p>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-ink-100 p-3">
                  <p className="text-xs text-ink-400">Accommodation</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(accommodationSubtotal)}</p>
                </div>
                <div className="rounded-lg border border-ink-100 p-3">
                  <p className="text-xs text-ink-400">Caution Fee</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(cautionFee)}</p>
                </div>
                <div className="rounded-lg border border-gold-200 bg-gold-50 p-3">
                  <p className="text-xs text-gold-600">Total Due</p>
                  <p className="mt-1 text-sm font-bold text-gold-800">{formatNaira(totalAmount)}</p>
                </div>
              </div>
            </Card>

            {/* Receipt Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink-900">Upload Payment Receipt</h3>
              <p className="mt-1 text-sm text-ink-500">Upload a screenshot or photo of your transfer receipt. Accepted: JPG, JPEG, PNG, PDF (max 5 MB).</p>

              {!receiptFile ? (
                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-cream-50 px-6 py-10 transition-all hover:border-gold-300 hover:bg-gold-50">
                  <Upload className="h-8 w-8 text-ink-300" />
                  <p className="mt-2 text-sm font-medium text-ink-600">Click to upload your receipt</p>
                  <p className="mt-1 text-xs text-ink-400">JPG, JPEG, PNG or PDF · Max 5 MB</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                </label>
              ) : (
                <div className="mt-4 rounded-xl border border-ink-100 bg-cream-50 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gold-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-900">{receiptFile.name}</p>
                      <p className="text-xs text-ink-400">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {uploadingReceipt ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    <button
                      onClick={() => { setReceiptFile(null); setReceiptPath(null); }}
                      className="text-ink-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Uploading a receipt does not confirm your booking. Management must verify the actual bank transfer before your booking is confirmed.</p>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="btn-secondary"><ChevronLeft className="h-4 w-4" /> Back</button>
              <button
                onClick={handleNotifyDeeshades}
                disabled={submitting || !receiptFile || uploadingReceipt}
                className="btn-primary"
              >
                {submitting ? <LoadingSpinner size="sm" /> : <><MessageCircle className="h-4 w-4" /> I have paid — Notify DEESHADES</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="mx-auto max-w-2xl">
            <Card className="p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-ink-900">Payment Notification Submitted</h2>
              <p className="mt-2 text-sm text-ink-500">
                Your booking has been created and your payment notification has been submitted. Your booking is <strong>not yet confirmed</strong> — it will be confirmed once management verifies your bank transfer.
              </p>

              <div className="mt-6 rounded-xl bg-ink-900 p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gold-400">Booking Reference</p>
                <p className="mt-1 font-serif text-2xl font-bold text-white">{bookingRef}</p>
              </div>

              <div className="mt-6 grid gap-3 text-left">
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <span className="text-sm text-ink-500">Booking Status</span>
                  <Badge status="PENDING" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <span className="text-sm text-ink-500">Payment Status</span>
                  <Badge status="AWAITING_VERIFICATION" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <span className="text-sm text-ink-500">Check-in</span>
                  <span className="text-sm font-medium text-ink-900">{formatDate(checkIn)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <span className="text-sm text-ink-500">Check-out</span>
                  <span className="text-sm font-medium text-ink-900">{formatDate(checkOut)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                  <span className="text-sm text-ink-500">Amount Submitted</span>
                  <span className="text-sm font-bold text-ink-900">{formatNaira(totalAmount)}</span>
                </div>
              </div>

              {whatsappSent && (
                <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  <MessageCircle className="mr-1.5 inline h-4 w-4" />
                  WhatsApp opened with a prefilled message. Please tap Send inside WhatsApp to notify management.
                </div>
              )}

              {!whatsappSent && whatsappNumber && (
                <a
                  href={buildWhatsAppLink(whatsappNumber, buildWhatsAppMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 btn-primary w-full"
                >
                  <MessageCircle className="h-4 w-4" /> Notify DEESHADES on WhatsApp
                </a>
              )}

              {!whatsappNumber && (
                <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  WhatsApp number not configured. Please contact management directly to notify them of your payment.
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm text-blue-700">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Save your booking reference. You can use it to check your booking status on the website. Do not share it with others.</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Rules Modal */}
      <Modal open={showRulesModal} onClose={() => setShowRulesModal(false)} title="House Rules & Booking Policy" size="lg">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-ink-900">House Rules</h4>
            <ul className="mt-2 space-y-2">
              {HOUSE_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" /> {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-900">Booking Policy</h4>
            <p className="mt-2 text-sm text-ink-600">
              Reservations become confirmed only after management verifies the required bank transfer. Once confirmed and payment verified, the stated policy is non-refundable, subject to applicable law and mandatory consumer protections. The caution fee is refundable after checkout subject to inspection.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
