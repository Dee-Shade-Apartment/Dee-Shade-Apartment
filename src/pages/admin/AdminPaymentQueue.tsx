import { useEffect, useState, useCallback } from 'react';
import {
  Check, X, FileText, Eye, Clock, AlertCircle, ShieldCheck,
  DollarSign, Download,
} from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { REJECTION_REASONS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import type { Payment, Booking, Guest, ApartmentUnit, PaymentReceipt } from '@/lib/types';

interface PaymentWithRelations extends Payment {
  booking: Booking | null;
}

interface ReceiptWithRelations extends PaymentReceipt {
  payment_receipts?: PaymentReceipt;
}

export function AdminPaymentQueue() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState('');
  const [bankTxRef, setBankTxRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [approving, setApproving] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select(`*, booking:bookings(*)`)
      .eq('payment_status', 'AWAITING_VERIFICATION')
      .order('submitted_at', { ascending: false });
    setPayments((data || []) as PaymentWithRelations[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const loadReceipts = async (bookingId: string) => {
    const { data } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    setReceipts((data || []) as PaymentReceipt[]);
  };

  const viewReceipt = async (path: string) => {
    const { data } = await supabase.storage
      .from('payment-receipts')
      .createSignedUrl(path, 300);
    if (data) {
      setReceiptUrl(data.signedUrl);
      setShowReceipt(true);
    } else {
      toast('error', 'Could not load receipt. You may need to be signed in.');
    }
  };

  const openApprove = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setVerifiedAmount(String(payment.expected_amount));
    setBankTxRef('');
    setShowApprove(true);
    if (payment.booking) loadReceipts(payment.booking.id);
  };

  const openReject = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setRejectNotes('');
    setShowReject(true);
    if (payment.booking) loadReceipts(payment.booking.id);
  };

  const handleApprove = async () => {
    if (!selectedPayment || !selectedPayment.booking) return;
    if (!verifiedAmount) { toast('error', 'Please enter the verified amount.'); return; }

    setApproving(true);
    const booking = selectedPayment.booking;
    const amount = Number(verifiedAmount);

    // Check for duplicate bank transaction ref
    if (bankTxRef) {
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('bank_transaction_ref', bankTxRef)
        .neq('id', selectedPayment.id)
        .maybeSingle();
      if (existing) {
        setApproving(false);
        toast('error', 'This bank transaction reference has already been used for another booking.');
        return;
      }
    }

    // If unit is assigned, check availability
    if (booking.unit_id) {
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id, booking_reference')
        .eq('unit_id', booking.unit_id)
        .neq('id', booking.id)
        .lt('check_in', booking.check_out)
        .gt('check_out', booking.check_in)
        .in('status', ['CONFIRMED', 'CHECKED_IN']);

      if (conflicts && conflicts.length > 0) {
        // Move to conflict review
        await supabase.from('bookings').update({ status: 'CONFLICT_REVIEW' }).eq('id', booking.id);
        await supabase.from('audit_logs').insert({
          action: 'payment_conflict',
          entity_type: 'booking',
          entity_id: booking.id,
          metadata: { conflicts: conflicts.map(c => c.booking_reference) },
          reason: `Conflict detected: unit already booked by ${conflicts.map(c => c.booking_reference).join(', ')}`,
        });
        setApproving(false);
        toast('error', `Dates no longer available. Booking moved to conflict review. Conflicts: ${conflicts.map(c => c.booking_reference).join(', ')}`);
        loadPayments();
        setShowApprove(false);
        return;
      }
    }

    // Verify payment
    const { error: payError } = await supabase
      .from('payments')
      .update({
        payment_status: 'VERIFIED',
        verified_amount: amount,
        bank_transaction_ref: bankTxRef || null,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', selectedPayment.id);

    if (payError) { setApproving(false); toast('error', 'Could not verify payment.'); return; }

    // Confirm booking
    await supabase.from('bookings').update({
      status: 'CONFIRMED',
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    }).eq('id', booking.id);

    // Update caution fee to received
    await supabase.from('caution_fee_records')
      .update({ amount_received: booking.caution_fee, inspection_status: 'received' })
      .eq('booking_id', booking.id);

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_verified',
      entity_type: 'booking',
      entity_id: booking.id,
      metadata: {
        amount: amount,
        bank_ref: bankTxRef,
        reference: booking.booking_reference,
      },
      reason: `Payment verified and booking confirmed for ${booking.booking_reference}`,
    });

    setApproving(false);
    toast('success', 'Payment verified and booking confirmed.');
    loadPayments();
    setShowApprove(false);
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason) { toast('error', 'Please select a rejection reason.'); return; }
    if (!selectedPayment.booking) return;

    const booking = selectedPayment.booking;

    // Update payment
    await supabase.from('payments').update({
      payment_status: 'REJECTED',
      rejection_reason: rejectReason,
      rejection_notes: rejectNotes || null,
    }).eq('id', selectedPayment.id);

    // Update booking status
    await supabase.from('bookings').update({ status: 'REJECTED' }).eq('id', booking.id);

    // Update receipt status
    await supabase.from('payment_receipts')
      .update({ receipt_status: 'REJECTED' })
      .eq('booking_id', booking.id);

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_rejected',
      entity_type: 'booking',
      entity_id: booking.id,
      metadata: { reason: rejectReason, notes: rejectNotes },
      reason: `Payment rejected for ${booking.booking_reference}: ${rejectReason}`,
    });

    toast('success', 'Payment rejected. Guest can submit new evidence.');
    loadPayments();
    setShowReject(false);
  };

  if (loading) return <LoadingSpinner label="Loading payment queue..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Payment Verification Queue</h1>
        <p className="mt-1 text-sm text-ink-500">
          Verify bank transfers against your actual bank statement before approving. Do not approve based on receipts alone.
        </p>
      </div>

      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <AlertCircle className="mr-2 inline h-4 w-4" />
        Receipts and WhatsApp notifications do not verify payment. Check the actual bank alert or statement before approving.
      </div>

      {payments.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Check className="h-12 w-12" />}
            title="No payments awaiting verification"
            message="All submitted payments have been processed."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map(payment => (
            <Card key={payment.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">{payment.booking?.booking_reference}</p>
                    {payment.booking?.is_demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">DEMO</span>}
                    <Badge status={payment.payment_status} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-ink-400">Expected Amount</p>
                      <p className="font-medium text-ink-900">{formatNaira(payment.expected_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400">Transfer Narration</p>
                      <p className="font-medium text-ink-900">{payment.transfer_narration || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-400">Submitted</p>
                      <p className="font-medium text-ink-900">{payment.submitted_at ? formatDateTime(payment.submitted_at) : '—'}</p>
                    </div>
                  </div>
                  {payment.booking && (
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-ink-400">Check-in / Out</p>
                        <p className="font-medium text-ink-900">{formatDate(payment.booking.check_in)} → {formatDate(payment.booking.check_out)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Nights / Guests</p>
                        <p className="font-medium text-ink-900">{payment.booking.nights} nights · {payment.booking.guest_count} guests</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-400">Hold Expires</p>
                        <p className={`font-medium ${payment.booking.hold_expires_at && new Date(payment.booking.hold_expires_at) < new Date() ? 'text-red-600' : 'text-ink-900'}`}>
                          {payment.booking.hold_expires_at ? formatDateTime(payment.booking.hold_expires_at) : '—'}
                          {payment.booking.hold_expires_at && new Date(payment.booking.hold_expires_at) < new Date() && ' (EXPIRED)'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => { if (payment.booking) { await loadReceipts(payment.booking.id); setSelectedPayment(payment); } }}
                    className="btn-secondary"
                  >
                    <Eye className="h-4 w-4" /> View Receipt
                  </button>
                  <button onClick={() => openApprove(payment)} className="btn-primary">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => openReject(payment)} className="btn-danger">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>

              {/* Receipt preview */}
              {selectedPayment?.id === payment.id && receipts.length > 0 && (
                <div className="mt-4 border-t border-ink-100 pt-4">
                  <p className="mb-2 text-xs font-medium text-ink-400">RECEIPTS</p>
                  <div className="space-y-2">
                    {receipts.map(r => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gold-600" />
                          <div>
                            <p className="text-sm font-medium text-ink-900">{r.original_filename}</p>
                            <p className="text-xs text-ink-400">{(r.file_size / 1024).toFixed(0)} KB · {r.file_type} · {formatDateTime(r.created_at)}</p>
                          </div>
                          <Badge status={r.receipt_status} />
                        </div>
                        <button
                          onClick={() => viewReceipt(r.storage_path)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gold-50 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-100"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        title="Approve Payment — Confirm Verification"
        size="md"
        footer={
          <>
            <button onClick={() => setShowApprove(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleApprove} disabled={approving} className="btn-primary">
              {approving ? <LoadingSpinner size="sm" /> : <><ShieldCheck className="h-4 w-4" /> Confirm & Approve</>}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <ShieldCheck className="mr-1.5 inline h-4 w-4" />
            By approving, you confirm that you have verified the actual bank transfer against your bank statement. This action will confirm the booking and is recorded in the audit log.
          </div>

          {selectedPayment?.booking && (
            <div className="rounded-lg bg-cream-50 p-4 text-sm">
              <p className="font-semibold text-ink-900">{selectedPayment.booking.booking_reference}</p>
              <p className="text-ink-500">{formatDate(selectedPayment.booking.check_in)} → {formatDate(selectedPayment.booking.check_out)}</p>
              <p className="mt-1 text-ink-700">Expected: {formatNaira(selectedPayment.expected_amount)}</p>
              <p className="text-ink-700">Accommodation: {formatNaira(selectedPayment.booking.accommodation_subtotal)}</p>
              <p className="text-ink-700">Caution fee: {formatNaira(selectedPayment.booking.caution_fee)}</p>
            </div>
          )}

          <div>
            <label className="label-text">Verified Amount Received *</label>
            <input value={verifiedAmount} onChange={e => setVerifiedAmount(e.target.value)} type="number" className="input-field" />
          </div>
          <div>
            <label className="label-text">Bank Transaction Reference (optional)</label>
            <input value={bankTxRef} onChange={e => setBankTxRef(e.target.value)} className="input-field" placeholder="e.g. BANK-TRX-001234" />
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="Reject Payment"
        size="md"
        footer={
          <>
            <button onClick={() => setShowReject(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} className="btn-danger">Confirm Rejection</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-text">Rejection Reason *</label>
            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input-field">
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Additional Explanation (optional)</label>
            <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3} className="input-field resize-none" placeholder="Add more detail..." />
          </div>
          <p className="text-sm text-ink-500">The guest will be able to submit corrected evidence after rejection.</p>
        </div>
      </Modal>

      {/* Receipt Viewer */}
      {showReceipt && receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setShowReceipt(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setShowReceipt(false)}>
            <X className="h-8 w-8" />
          </button>
          {receiptUrl.includes('.pdf') ? (
            <iframe src={receiptUrl} className="h-[85vh] w-[90vw] rounded-lg bg-white" title="Receipt" />
          ) : (
            <img src={receiptUrl} alt="Receipt" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
