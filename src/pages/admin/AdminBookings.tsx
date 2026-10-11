import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, Eye, Home, Check, X, Calendar, User,
  DollarSign, LogIn, LogOut, FileText, Clock,
} from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import type { Booking, Guest, ApartmentUnit, Payment, CautionFeeRecord } from '@/lib/types';

interface BookingWithRelations extends Booking {
  guest: Guest | null;
  unit: ApartmentUnit | null;
  payments: Payment[];
  caution_fee_records: CautionFeeRecord[];
}

export function AdminBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [units, setUnits] = useState<ApartmentUnit[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [assignUnitId, setAssignUnitId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select(`*, guest:guests(*), unit:apartment_units(*), payments(*), caution_fee_records(*)`)
      .order('created_at', { ascending: false });

    if (statusFilter) query = query.eq('status', statusFilter);
    if (unitFilter) query = query.eq('unit_id', unitFilter);

    const { data } = await query;
    let result = (data || []) as BookingWithRelations[];

    if (paymentFilter) {
      result = result.filter(b =>
        b.payments?.some(p => p.payment_status === paymentFilter)
      );
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(b =>
        b.booking_reference.toLowerCase().includes(s) ||
        b.guest?.full_name?.toLowerCase().includes(s) ||
        b.guest?.phone?.includes(s) ||
        b.guest?.email?.toLowerCase().includes(s)
      );
    }

    setBookings(result);
    setLoading(false);
  }, [search, statusFilter, paymentFilter, unitFilter]);

  useEffect(() => {
    supabase.from('apartment_units').select('*').order('unit_number').then(({ data }) => {
      if (data) setUnits(data);
    });
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleAssignUnit = async () => {
    if (!selectedBooking || !assignUnitId) return;

    // Check availability for the unit on these dates
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id, booking_reference')
      .eq('unit_id', assignUnitId)
      .neq('id', selectedBooking.id)
      .lt('check_in', selectedBooking.check_out)
      .gt('check_out', selectedBooking.check_in)
      .in('status', ['PENDING', 'CONFIRMED', 'CHECKED_IN']);

    if (conflicts && conflicts.length > 0) {
      toast('error', `Unit is already booked for these dates (conflicts with: ${conflicts.map(c => c.booking_reference).join(', ')}).`);
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ unit_id: assignUnitId })
      .eq('id', selectedBooking.id);

    if (error) { toast('error', 'Could not assign unit.'); return; }

    await supabase.from('audit_logs').insert({
      action: 'unit_assigned',
      entity_type: 'booking',
      entity_id: selectedBooking.id,
      metadata: { unit_id: assignUnitId },
      reason: `Unit assigned to booking ${selectedBooking.booking_reference}`,
    });

    toast('success', 'Unit assigned successfully.');
    setShowAssignModal(false);
    loadBookings();
  };

  const handleCancel = async () => {
    if (!selectedBooking || !cancelReason) { toast('error', 'Please provide a cancellation reason.'); return; }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED', cancellation_reason: cancelReason })
      .eq('id', selectedBooking.id);

    if (error) { toast('error', 'Could not cancel booking.'); return; }

    await supabase.from('audit_logs').insert({
      action: 'booking_cancelled',
      entity_type: 'booking',
      entity_id: selectedBooking.id,
      metadata: { reason: cancelReason },
      reason: `Booking ${selectedBooking.booking_reference} cancelled`,
    });

    toast('success', 'Booking cancelled.');
    setShowCancelModal(false);
    setCancelReason('');
    loadBookings();
  };

  const handleCheckIn = async (booking: BookingWithRelations) => {
    const { error } = await supabase.from('bookings').update({ status: 'CHECKED_IN' }).eq('id', booking.id);
    if (error) { toast('error', 'Could not record check-in.'); return; }
    await supabase.from('audit_logs').insert({
      action: 'check_in',
      entity_type: 'booking',
      entity_id: booking.id,
      reason: `Guest checked in for ${booking.booking_reference}`,
    });
    toast('success', 'Check-in recorded.');
    loadBookings();
  };

  const handleCheckOut = async (booking: BookingWithRelations) => {
    const { error } = await supabase.from('bookings').update({ status: 'CHECKED_OUT' }).eq('id', booking.id);
    if (error) { toast('error', 'Could not record check-out.'); return; }
    await supabase.from('audit_logs').insert({
      action: 'check_out',
      entity_type: 'booking',
      entity_id: booking.id,
      reason: `Guest checked out for ${booking.booking_reference}`,
    });
    // Update caution fee to awaiting inspection
    await supabase.from('caution_fee_records')
      .update({ inspection_status: 'awaiting_inspection' })
      .eq('booking_id', booking.id);
    toast('success', 'Check-out recorded. Caution fee set to awaiting inspection.');
    loadBookings();
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    const { error } = await supabase
      .from('bookings')
      .update({ internal_notes: internalNotes })
      .eq('id', selectedBooking.id);
    if (error) { toast('error', 'Could not save notes.'); return; }
    toast('success', 'Notes saved.');
    loadBookings();
  };

  const openDetails = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setInternalNotes(booking.internal_notes || '');
    setShowDetails(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Booking Management</h1>
        <p className="mt-1 text-sm text-ink-500">View, filter, and manage all reservations.</p>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ref, name, phone..." className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
            <option value="">All Statuses</option>
            {Object.entries(BOOKING_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="input-field">
            <option value="">All Payments</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="input-field">
            <option value="">All Units</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.unit_label}</option>)}
          </select>
          <button onClick={loadBookings} className="btn-secondary">
            <Filter className="h-4 w-4" /> Apply Filters
          </button>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState icon={<Calendar className="h-12 w-12" />} title="No bookings found" message="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Check-out</th>
                  <th className="px-4 py-3 font-medium">Nights</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {booking.booking_reference}
                      {booking.is_demo && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">DEMO</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <p>{booking.guest?.full_name || '—'}</p>
                      <p className="text-xs text-ink-400">{booking.guest?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{booking.unit?.unit_label || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(booking.check_in)}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(booking.check_out)}</td>
                    <td className="px-4 py-3 text-ink-600">{booking.nights}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatNaira(booking.total_amount)}</td>
                    <td className="px-4 py-3">
                      {booking.payments?.[0] ? <Badge status={booking.payments[0].payment_status} /> : <Badge status="NOT_SUBMITTED" />}
                    </td>
                    <td className="px-4 py-3"><Badge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetails(booking)} className="rounded-lg p-1.5 text-gold-600 hover:bg-gold-50">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedBooking ? `Booking ${selectedBooking.booking_reference}` : ''}
        size="xl"
      >
        {selectedBooking && (
          <div className="space-y-5">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge status={selectedBooking.status} label={BOOKING_STATUS_LABELS[selectedBooking.status]} />
              {selectedBooking.payments?.[0] && <Badge status={selectedBooking.payments[0].payment_status} />}
              {selectedBooking.is_demo && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">DEMO DATA</span>}
            </div>

            {/* Guest info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900"><User className="h-4 w-4 text-gold-600" /> Guest</h4>
                <div className="mt-3 space-y-1.5 text-sm text-ink-600">
                  <p><span className="text-ink-400">Name:</span> {selectedBooking.guest?.full_name || '—'}</p>
                  <p><span className="text-ink-400">Phone:</span> {selectedBooking.guest?.phone || '—'}</p>
                  <p><span className="text-ink-400">Email:</span> {selectedBooking.guest?.email || '—'}</p>
                  <p><span className="text-ink-400">Guests:</span> {selectedBooking.guest_count}</p>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900"><Calendar className="h-4 w-4 text-gold-600" /> Stay Details</h4>
                <div className="mt-3 space-y-1.5 text-sm text-ink-600">
                  <p><span className="text-ink-400">Check-in:</span> {formatDate(selectedBooking.check_in)}</p>
                  <p><span className="text-ink-400">Check-out:</span> {formatDate(selectedBooking.check_out)}</p>
                  <p><span className="text-ink-400">Nights:</span> {selectedBooking.nights}</p>
                  <p><span className="text-ink-400">Unit:</span> {selectedBooking.unit?.unit_label || 'Unassigned'}</p>
                  <p><span className="text-ink-400">Rate type:</span> {selectedBooking.rate_type}</p>
                  <p><span className="text-ink-400">Created:</span> {formatDateTime(selectedBooking.created_at)}</p>
                </div>
              </Card>
            </div>

            {/* Pricing */}
            <Card className="p-4">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900"><DollarSign className="h-4 w-4 text-gold-600" /> Pricing</h4>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-cream-50 p-3">
                  <p className="text-xs text-ink-400">Accommodation</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(selectedBooking.accommodation_subtotal)}</p>
                </div>
                <div className="rounded-lg bg-cream-50 p-3">
                  <p className="text-xs text-ink-400">Caution Fee</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(selectedBooking.caution_fee)}</p>
                </div>
                <div className="rounded-lg bg-gold-50 p-3">
                  <p className="text-xs text-gold-600">Total</p>
                  <p className="mt-1 text-sm font-bold text-gold-800">{formatNaira(selectedBooking.total_amount)}</p>
                </div>
              </div>
            </Card>

            {/* Payment info */}
            {selectedBooking.payments && selectedBooking.payments.length > 0 && (
              <Card className="p-4">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900"><FileText className="h-4 w-4 text-gold-600" /> Payment Records</h4>
                <div className="mt-3 space-y-2">
                  {selectedBooking.payments.map(p => (
                    <div key={p.id} className="rounded-lg border border-ink-100 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge status={p.payment_status} />
                        <span className="font-medium text-ink-900">{formatNaira(p.expected_amount)}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-400">
                        <p>Narration: {p.transfer_narration || '—'}</p>
                        <p>Bank ref: {p.bank_transaction_ref || '—'}</p>
                        <p>Submitted: {formatDateTime(p.submitted_at)}</p>
                        <p>Verified: {p.verified_at ? formatDateTime(p.verified_at) : '—'}</p>
                        {p.rejection_reason && <p className="col-span-2 text-red-500">Rejected: {p.rejection_reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Special requests */}
            {selectedBooking.special_requests && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold text-ink-900">Special Requests</h4>
                <p className="mt-2 text-sm text-ink-600">{selectedBooking.special_requests}</p>
              </Card>
            )}

            {/* Internal notes */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-ink-900">Internal Notes</h4>
              <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} className="input-field mt-2 resize-none" placeholder="Add internal notes..." />
              <button onClick={handleSaveNotes} className="btn-secondary mt-2 text-xs">Save Notes</button>
            </Card>

            {/* Hold info */}
            {selectedBooking.hold_expires_at && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <Clock className="h-4 w-4" />
                Hold expires: {formatDateTime(selectedBooking.hold_expires_at)}
                {new Date(selectedBooking.hold_expires_at) < new Date() && ' (EXPIRED)'}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              {!selectedBooking.unit_id && selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'CHECKED_OUT' && (
                <button onClick={() => { setAssignUnitId(''); setShowAssignModal(true); }} className="btn-secondary">
                  <Home className="h-4 w-4" /> Assign Unit
                </button>
              )}
              {selectedBooking.unit_id && selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'CHECKED_OUT' && (
                <button onClick={() => { setAssignUnitId(selectedBooking.unit_id || ''); setShowAssignModal(true); }} className="btn-secondary">
                  <Home className="h-4 w-4" /> Change Unit
                </button>
              )}
              {selectedBooking.status === 'CONFIRMED' && (
                <button onClick={() => handleCheckIn(selectedBooking)} className="btn-primary">
                  <LogIn className="h-4 w-4" /> Record Check-in
                </button>
              )}
              {selectedBooking.status === 'CHECKED_IN' && (
                <button onClick={() => handleCheckOut(selectedBooking)} className="btn-primary">
                  <LogOut className="h-4 w-4" /> Record Check-out
                </button>
              )}
              {selectedBooking.status !== 'CANCELLED' && selectedBooking.status !== 'CHECKED_OUT' && selectedBooking.status !== 'REJECTED' && (
                <button onClick={() => setShowCancelModal(true)} className="btn-danger">
                  <X className="h-4 w-4" /> Cancel Booking
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Unit Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Unit"
        footer={
          <>
            <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssignUnit} className="btn-primary">Assign</button>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-600">Select a unit for this booking. The system will check for conflicts before assigning.</p>
        <select value={assignUnitId} onChange={e => setAssignUnitId(e.target.value)} className="input-field">
          <option value="">Select a unit...</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.unit_label} ({u.status})</option>)}
        </select>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
        footer={
          <>
            <button onClick={() => setShowCancelModal(false)} className="btn-secondary">Don't Cancel</button>
            <button onClick={handleCancel} className="btn-danger">Confirm Cancellation</button>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-600">Please provide a reason for cancelling this booking. This will be recorded in the audit log.</p>
        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} className="input-field resize-none" placeholder="Cancellation reason..." />
      </Modal>
    </div>
  );
}
