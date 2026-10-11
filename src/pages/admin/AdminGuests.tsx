import { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Mail, Eye, Calendar, DollarSign, Users } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, getInitials } from '@/lib/utils';
import { BOOKING_STATUS_LABELS } from '@/lib/constants';
import type { Guest, Booking } from '@/lib/types';

interface GuestWithBookings extends Guest {
  bookings: Booking[];
  totalSpend: number;
}

export function AdminGuests() {
  const [guests, setGuests] = useState<GuestWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestWithBookings | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const { data: guestsData } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
    
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .in('status', ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']);

    const verifiedBookings = (bookingsData || []) as Booking[];

    let result: GuestWithBookings[] = ((guestsData || []) as Guest[]).map(g => {
      const gBookings = verifiedBookings.filter(b => b.guest_id === g.id);
      return {
        ...g,
        bookings: gBookings,
        totalSpend: gBookings.reduce((sum, b) => sum + b.accommodation_subtotal, 0),
      };
    });

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(g =>
        g.full_name.toLowerCase().includes(s) ||
        g.phone.includes(s) ||
        (g.email?.toLowerCase().includes(s) || false)
      );
    }

    setGuests(result);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  const openGuest = (guest: GuestWithBookings) => {
    setSelectedGuest(guest);
    setShowModal(true);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Guest Management</h1>
        <p className="mt-1 text-sm text-ink-500">View guest records and their booking history.</p>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="input-field pl-10" />
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading guests..." />
      ) : guests.length === 0 ? (
        <Card className="p-8"><EmptyState icon={<Users className="h-12 w-12" />} title="No guests found" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Bookings</th>
                  <th className="px-4 py-3 font-medium">Verified Spend</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {guests.map(guest => (
                  <tr key={guest.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-600 text-xs font-semibold text-white">
                          {getInitials(guest.full_name)}
                        </div>
                        <span className="font-medium text-ink-900">{guest.full_name}</span>
                        {guest.is_demo && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">DEMO</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{guest.phone}</td>
                    <td className="px-4 py-3 text-ink-600">{guest.email || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{guest.bookings.length}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatNaira(guest.totalSpend)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openGuest(guest)} className="rounded-lg p-1.5 text-gold-600 hover:bg-gold-50">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selectedGuest?.full_name || ''} size="lg">
        {selectedGuest && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-ink-400"><Phone className="h-3.5 w-3.5" /> Phone</p>
                <p className="mt-1 text-sm font-medium text-ink-900">{selectedGuest.phone}</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="flex items-center gap-1.5 text-xs text-ink-400"><Mail className="h-3.5 w-3.5" /> Email</p>
                <p className="mt-1 text-sm font-medium text-ink-900">{selectedGuest.email || '—'}</p>
              </div>
            </div>

            <div className="rounded-lg bg-gold-50 p-4">
              <p className="flex items-center gap-1.5 text-xs text-gold-600"><DollarSign className="h-3.5 w-3.5" /> Total Verified Spend</p>
              <p className="mt-1 text-xl font-bold text-gold-800">{formatNaira(selectedGuest.totalSpend)}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink-900">Booking History ({selectedGuest.bookings.length})</h4>
              {selectedGuest.bookings.length === 0 ? (
                <p className="mt-2 text-sm text-ink-400">No verified bookings yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {selectedGuest.bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-ink-900">{b.booking_reference}</p>
                        <p className="text-xs text-ink-400">{formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.nights} nights</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-900">{formatNaira(b.accommodation_subtotal)}</span>
                        <Badge status={b.status} label={BOOKING_STATUS_LABELS[b.status]} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedGuest.notes && (
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="text-xs text-ink-400">Notes</p>
                <p className="mt-1 text-sm text-ink-600">{selectedGuest.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
