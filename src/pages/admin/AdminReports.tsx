import { useState, useEffect, useCallback } from 'react';
import { Download, DollarSign, TrendingUp, Calendar, Percent, Clock } from 'lucide-react';
import { Card, LoadingSpinner } from '@/components/ui/Primitives';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, downloadCSV } from '@/lib/utils';
import type { Booking, Payment, CautionFeeRecord, ApartmentUnit } from '@/lib/types';

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<{
    verifiedRevenue: number;
    revenueByUnit: Record<string, number>;
    bookingCount: number;
    confirmedCount: number;
    cancelledCount: number;
    avgNightlyRate: number;
    avgStayLength: number;
    cautionReceived: number;
    cautionRefunded: number;
    cautionOutstanding: number;
    bookings: Booking[];
    units: ApartmentUnit[];
  } | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);

    let bookingQuery = supabase.from('bookings').select('*');
    if (dateFrom) bookingQuery = bookingQuery.gte('check_in', dateFrom);
    if (dateTo) bookingQuery = bookingQuery.lte('check_out', dateTo);
    const { data: allBookings } = await bookingQuery;
    const bookings = (allBookings || []) as Booking[];

    const { data: payments } = await supabase.from('payments').select('*');
    const allPayments = (payments || []) as Payment[];

    const { data: cautionFees } = await supabase.from('caution_fee_records').select('*');

    const { data: units } = await supabase.from('apartment_units').select('*').order('unit_number');

    const verifiedPaymentBookings = bookings.filter(b => {
      const p = allPayments.find(pay => pay.booking_id === b.id);
      return p && p.payment_status === 'VERIFIED';
    });

    const verifiedRevenue = verifiedPaymentBookings.reduce((sum, b) => sum + b.accommodation_subtotal, 0);

    const revenueByUnit: Record<string, number> = {};
    verifiedPaymentBookings.forEach(b => {
      const unitLabel = units?.find(u => u.id === b.unit_id)?.unit_label || 'Unassigned';
      revenueByUnit[unitLabel] = (revenueByUnit[unitLabel] || 0) + b.accommodation_subtotal;
    });

    const confirmed = bookings.filter(b => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status));
    const cancelled = bookings.filter(b => b.status === 'CANCELLED');

    const avgNightlyRate = verifiedPaymentBookings.length > 0
      ? verifiedPaymentBookings.reduce((sum, b) => sum + (b.accommodation_subtotal / b.nights), 0) / verifiedPaymentBookings.length
      : 0;

    const avgStayLength = confirmed.length > 0
      ? confirmed.reduce((sum, b) => sum + b.nights, 0) / confirmed.length
      : 0;

    const cautionReceived = (cautionFees || []).filter((c: CautionFeeRecord) => c.amount_received !== null).reduce((sum: number, c: CautionFeeRecord) => sum + (c.amount_received || 0), 0);
    const cautionRefunded = (cautionFees || []).reduce((sum: number, c: CautionFeeRecord) => sum + (c.amount_refunded || 0), 0);
    const cautionOutstanding = (cautionFees || []).filter((c: CautionFeeRecord) => c.amount_received !== null && c.inspection_status !== 'refunded' && c.inspection_status !== 'partially_refunded').reduce((sum: number, c: CautionFeeRecord) => sum + ((c.amount_received || 0) - (c.amount_refunded || 0)), 0);

    setReportData({
      verifiedRevenue,
      revenueByUnit,
      bookingCount: bookings.length,
      confirmedCount: confirmed.length,
      cancelledCount: cancelled.length,
      avgNightlyRate,
      avgStayLength,
      cautionReceived,
      cautionRefunded,
      cautionOutstanding,
      bookings,
      units: (units || []) as ApartmentUnit[],
    });
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const exportBookings = () => {
    if (!reportData) return;
    const rows = reportData.bookings.map(b => ({
      Reference: b.booking_reference,
      CheckIn: b.check_in,
      CheckOut: b.check_out,
      Nights: b.nights,
      Guests: b.guest_count,
      Accommodation: b.accommodation_subtotal,
      CautionFee: b.caution_fee,
      Total: b.total_amount,
      Status: b.status,
      Created: b.created_at,
    }));
    downloadCSV('deeshades-bookings-report.csv', rows);
  };

  if (loading || !reportData) return <LoadingSpinner label="Generating reports..." />;

  const metricCards = [
    { label: 'Verified Revenue', value: formatNaira(reportData.verifiedRevenue), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Total Bookings', value: String(reportData.bookingCount), icon: Calendar, color: 'bg-blue-50 text-blue-600' },
    { label: 'Confirmed', value: String(reportData.confirmedCount), icon: TrendingUp, color: 'bg-sage-50 text-sage-600' },
    { label: 'Cancelled', value: String(reportData.cancelledCount), icon: Calendar, color: 'bg-red-50 text-red-600' },
    { label: 'Avg Nightly Rate', value: formatNaira(reportData.avgNightlyRate), icon: DollarSign, color: 'bg-gold-50 text-gold-600' },
    { label: 'Avg Stay Length', value: `${reportData.avgStayLength.toFixed(1)} nights`, icon: Clock, color: 'bg-blue-50 text-blue-600' },
    { label: 'Caution Received', value: formatNaira(reportData.cautionReceived), icon: DollarSign, color: 'bg-sage-50 text-sage-600' },
    { label: 'Caution Refunded', value: formatNaira(reportData.cautionRefunded), icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
    { label: 'Caution Outstanding', value: formatNaira(reportData.cautionOutstanding), icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Revenue & Reports</h1>
          <p className="mt-1 text-sm text-ink-500">Financial overview with date filtering and CSV export.</p>
        </div>
        <button onClick={exportBookings} className="btn-secondary"><Download className="h-4 w-4" /> Export CSV</button>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="label-text">From Date</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" /></div>
          <div><label className="label-text">To Date</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" /></div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn-secondary">Clear</button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {metricCards.map((m, i) => (
          <Card key={i} className="p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-900">{m.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-400">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Revenue by Unit */}
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-semibold text-ink-900">Revenue by Unit</h3>
        {Object.keys(reportData.revenueByUnit).length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">No verified revenue yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {Object.entries(reportData.revenueByUnit).sort((a, b) => b[1] - a[1]).map(([unit, revenue]) => {
              const maxRev = Math.max(...Object.values(reportData.revenueByUnit));
              const pct = maxRev > 0 ? (revenue / maxRev) * 100 : 0;
              return (
                <div key={unit}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">{unit}</span>
                    <span className="font-semibold text-ink-900">{formatNaira(revenue)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Percent className="mr-1.5 inline h-4 w-4" />
        Revenue figures include only verified payments. Caution fees are tracked as liabilities, not revenue. Unverified transfers are not counted.
      </div>
    </div>
  );
}
