import { useEffect, useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock, Home, Wrench, CreditCard,
  DollarSign, TrendingDown, Percent, TrendingUp, AlertCircle,
} from 'lucide-react';
import { Card, Badge, LoadingSpinner } from '@/components/ui/Primitives';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate } from '@/lib/utils';
import { BOOKING_STATUS_LABELS } from '@/lib/constants';
import type { Booking, Payment } from '@/lib/types';

interface DashboardMetrics {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  currentOccupancy: number;
  availableUnits: number;
  maintenanceUnits: number;
  paymentsAwaiting: number;
  verifiedRevenue: number;
  cautionFeesReceived: number;
  cautionFeesOutstanding: number;
  cautionFeesAwaitingInspection: number;
  conversionRate: number;
  lostOpportunities: number;
  lostEstimatedValue: number;
}

interface RecentBooking extends Booking {
  guest: { full_name: string; phone: string } | null;
  unit: { unit_label: string } | null;
}

export function DashboardOverview({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    // Load bookings
    const { data: bookings } = await supabase.from('bookings').select('*');
    const allBookings = (bookings || []) as Booking[];

    // Load units
    const { data: units } = await supabase.from('apartment_units').select('*');

    // Load payments
    const { data: payments } = await supabase.from('payments').select('*');
    const allPayments = (payments || []) as Payment[];

    // Load caution fees
    const { data: cautionFees } = await supabase.from('caution_fee_records').select('*');

    // Load enquiries (lost)
    const { data: enquiries } = await supabase.from('enquiries').select('*');

    // Recent bookings with relations
    const { data: recent } = await supabase
      .from('bookings')
      .select(`*, guest:guests(full_name, phone), unit:apartment_units(unit_label)`)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentBookings((recent || []) as RecentBooking[]);

    // Pending payments
    const { data: pending } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_status', 'AWAITING_VERIFICATION')
      .order('submitted_at', { ascending: false });
    setPendingPayments((pending || []) as Payment[]);

    // Calculate metrics
    const confirmed = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN' || b.status === 'CHECKED_OUT');
    const pendingBookings = allBookings.filter(b => b.status === 'PENDING');
    const checkedIn = allBookings.filter(b => b.status === 'CHECKED_IN');
    const activeUnits = (units || []).filter((u: { status: string }) => u.status === 'active');
    const maintUnits = (units || []).filter((u: { status: string }) => u.status === 'maintenance');
    const awaitingPayments = allPayments.filter(p => p.payment_status === 'AWAITING_VERIFICATION');
    const verifiedPayments = allPayments.filter(p => p.payment_status === 'VERIFIED');
    const verifiedRevenue = verifiedPayments.reduce((sum, p) => {
      const booking = allBookings.find(b => b.id === p.booking_id);
      return sum + (booking?.accommodation_subtotal || 0);
    }, 0);
    const cautionReceived = (cautionFees || []).filter((c: { amount_received: number | null }) => c.amount_received !== null).length;
    const cautionOutstanding = (cautionFees || []).filter((c: { amount_received: number | null }) => c.amount_received === null).length;
    const cautionAwaiting = (cautionFees || []).filter((c: { inspection_status: string }) => c.inspection_status === 'awaiting_inspection').length;
    const lost = (enquiries || []).filter((e: { follow_up_status: string }) => e.follow_up_status === 'lost');
    const lostValue = lost.reduce((sum: number, e: { estimated_value: number | null }) => sum + (e.estimated_value || 0), 0);
    const totalNonDraft = allBookings.filter(b => b.status !== 'DRAFT').length;
    const conversionRate = totalNonDraft > 0 ? (confirmed.length / totalNonDraft) * 100 : 0;

    setMetrics({
      totalBookings: allBookings.length,
      pendingBookings: pendingBookings.length,
      confirmedBookings: confirmed.length,
      currentOccupancy: checkedIn.length,
      availableUnits: activeUnits.length - checkedIn.length,
      maintenanceUnits: maintUnits.length,
      paymentsAwaiting: awaitingPayments.length,
      verifiedRevenue,
      cautionFeesReceived: cautionReceived,
      cautionFeesOutstanding: cautionOutstanding,
      cautionFeesAwaitingInspection: cautionAwaiting,
      conversionRate: Math.round(conversionRate * 10) / 10,
      lostOpportunities: lost.length,
      lostEstimatedValue: lostValue,
    });

    setLoading(false);
  };

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;

  const metricCards = [
    { label: 'Total Bookings', value: metrics?.totalBookings ?? 0, icon: CalendarDays, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Bookings', value: metrics?.pendingBookings ?? 0, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Confirmed Bookings', value: metrics?.confirmedBookings ?? 0, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Current Occupancy', value: `${metrics?.currentOccupancy ?? 0}/${5}`, icon: Home, color: 'bg-sage-50 text-sage-600' },
    { label: 'Available Units', value: metrics?.availableUnits ?? 0, icon: Home, color: 'bg-blue-50 text-blue-600' },
    { label: 'Under Maintenance', value: metrics?.maintenanceUnits ?? 0, icon: Wrench, color: 'bg-orange-50 text-orange-600' },
    { label: 'Payments Awaiting', value: metrics?.paymentsAwaiting ?? 0, icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
    { label: 'Verified Revenue', value: formatNaira(metrics?.verifiedRevenue ?? 0), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Caution Fees Received', value: metrics?.cautionFeesReceived ?? 0, icon: DollarSign, color: 'bg-sage-50 text-sage-600' },
    { label: 'Caution Fees Outstanding', value: metrics?.cautionFeesOutstanding ?? 0, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
    { label: 'Caution Awaiting Inspection', value: metrics?.cautionFeesAwaitingInspection ?? 0, icon: Clock, color: 'bg-orange-50 text-orange-600' },
    { label: 'Conversion Rate', value: `${metrics?.conversionRate ?? 0}%`, icon: Percent, color: 'bg-gold-50 text-gold-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-ink-500">Real-time metrics for DEESHADES APARTMENT operations.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metricCards.map((m, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-900">{m.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-400">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Lost Opportunities Summary */}
      <Card className="mt-4 border-orange-200 bg-orange-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Lost Booking Opportunities</p>
              <p className="text-xs text-ink-500">{metrics?.lostOpportunities ?? 0} enquiries lost · Estimated value: {formatNaira(metrics?.lostEstimatedValue ?? 0)} (estimate, not earned revenue)</p>
            </div>
          </div>
          <button onClick={() => onNavigate('lost-opportunities')} className="text-sm font-medium text-orange-600 hover:underline">
            View Details →
          </button>
        </div>
      </Card>

      {/* Recent Bookings */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Recent Bookings</h3>
            <button onClick={() => onNavigate('bookings')} className="text-xs text-gold-600 hover:underline">View all →</button>
          </div>
          <div className="mt-4 space-y-3">
            {recentBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">No bookings yet.</p>
            ) : (
              recentBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{booking.booking_reference}</p>
                    <p className="text-xs text-ink-400">
                      {booking.guest?.full_name || 'Unknown'} · {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                    </p>
                  </div>
                  <Badge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status] || booking.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">Payments Awaiting Verification</h3>
            <button onClick={() => onNavigate('payments')} className="text-xs text-gold-600 hover:underline">View queue →</button>
          </div>
          <div className="mt-4 space-y-3">
            {pendingPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-400">No payments awaiting verification.</p>
            ) : (
              pendingPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{formatNaira(payment.expected_amount)}</p>
                    <p className="text-xs text-ink-400">Narration: {payment.transfer_narration || '—'}</p>
                  </div>
                  <Badge status={payment.payment_status} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
