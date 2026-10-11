import { useState } from 'react';
import { Search, Lock, Calendar, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import type { Booking, Guest, ApartmentUnit, Payment } from '@/lib/types';

interface BookingWithRelations extends Booking {
  guest: Guest | null;
  unit: ApartmentUnit | null;
  payments: Payment[];
}

export function BookingLookupPage() {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    if (!reference.trim()) { setError('Please enter your booking reference.'); return; }
    if (!phone.trim()) { setError('Please enter the phone number used for the booking.'); return; }

    setLoading(true);
    setSearched(true);

    const { data, error: queryError } = await supabase
      .from('bookings')
      .select(`
        *,
        guest:guests(*),
        unit:apartment_units(*),
        payments(*)
      `)
      .eq('booking_reference', reference.trim().toUpperCase())
      .maybeSingle();

    setLoading(false);

    if (queryError) { setError('Could not search for your booking. Please try again.'); return; }

    if (!data) {
      setBooking(null);
      setError('No booking found with that reference. Please check and try again.');
      return;
    }

    // Verify phone matches
    if (data.guest && data.guest.phone !== phone.trim()) {
      setBooking(null);
      setError('The phone number does not match this booking. Please verify and try again.');
      return;
    }

    setBooking(data as BookingWithRelations);
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-16">
      <div className="container-wide py-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-600">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-ink-900">Check Your Booking</h1>
            <p className="mt-2 text-sm text-ink-500">
              Enter your booking reference and the phone number used during booking to view your reservation status.
            </p>
          </div>

          <Card className="mt-8 p-6">
            <div className="space-y-4">
              <div>
                <label className="label-text">Booking Reference</label>
                <input
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="input-field uppercase"
                  placeholder="DSD-YYMM-XXXX"
                />
              </div>
              <div>
                <label className="label-text">Phone Number (used during booking)</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="+234..."
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              <button onClick={handleSearch} disabled={loading} className="btn-primary w-full">
                {loading ? <LoadingSpinner size="sm" /> : <><Search className="h-4 w-4" /> Find My Booking</>}
              </button>
            </div>
          </Card>

          {searched && !loading && booking && (
            <Card className="mt-6 p-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gold-600">Booking Reference</p>
                  <p className="font-serif text-xl font-bold text-ink-900">{booking.booking_reference}</p>
                </div>
                <Badge status={booking.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-cream-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs text-ink-400"><Calendar className="h-3.5 w-3.5" /> Check-in</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{formatDate(booking.check_in)}</p>
                </div>
                <div className="rounded-lg bg-cream-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs text-ink-400"><Calendar className="h-3.5 w-3.5" /> Check-out</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{formatDate(booking.check_out)}</p>
                </div>
                <div className="rounded-lg bg-cream-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs text-ink-400"><Clock className="h-3.5 w-3.5" /> Nights</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{booking.nights}</p>
                </div>
                <div className="rounded-lg bg-cream-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs text-ink-400"><Users className="h-3.5 w-3.5" /> Guests</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{booking.guest_count}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-ink-100 p-3">
                  <p className="text-xs text-ink-400">Accommodation</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(booking.accommodation_subtotal)}</p>
                </div>
                <div className="rounded-lg border border-ink-100 p-3">
                  <p className="text-xs text-ink-400">Caution Fee</p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(booking.caution_fee)}</p>
                </div>
                <div className="rounded-lg border border-gold-200 bg-gold-50 p-3">
                  <p className="text-xs text-gold-600">Total</p>
                  <p className="mt-1 text-sm font-bold text-gold-800">{formatNaira(booking.total_amount)}</p>
                </div>
              </div>

              {booking.unit && (
                <div className="mt-4 rounded-lg bg-cream-50 p-4">
                  <p className="text-xs text-ink-400">Assigned Unit</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{booking.unit.unit_label}</p>
                </div>
              )}

              {booking.payments && booking.payments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-ink-900">Payment Status</p>
                  <div className="mt-2 space-y-2">
                    {booking.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg bg-cream-50 px-4 py-3">
                        <div>
                          <Badge status={p.payment_status} />
                          {p.verified_at && (
                            <p className="mt-1 text-xs text-ink-400">Verified: {formatDateTime(p.verified_at)}</p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-ink-700">{formatNaira(p.expected_amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {booking.status === 'CONFIRMED' && 'Your booking is confirmed. We look forward to welcoming you.'}
                  {booking.status === 'PENDING' && 'Your payment is awaiting verification. Your booking will be confirmed once management verifies your bank transfer.'}
                  {booking.status === 'REJECTED' && 'Your payment could not be verified. Please contact management for assistance.'}
                  {booking.status === 'CANCELLED' && 'This booking has been cancelled.'}
                  {booking.status === 'CHECKED_IN' && 'You are checked in. Enjoy your stay!'}
                  {booking.status === 'CHECKED_OUT' && 'You have checked out. We hope you enjoyed your stay.'}
                  {booking.status === 'EXPIRED' && 'This booking has expired. Please make a new booking.'}
                  {booking.status === 'CONFLICT_REVIEW' && 'There is a scheduling conflict with your booking. Management is resolving this.'}
                  {booking.status === 'DRAFT' && 'Your booking is in draft. Please complete the payment process.'}
                </p>
              </div>
            </Card>
          )}

          {searched && !loading && !booking && !error && (
            <Card className="mt-6 p-8">
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="No booking found"
                message="Check your booking reference and phone number and try again."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
