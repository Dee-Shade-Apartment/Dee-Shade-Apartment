import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Wrench, X, Calendar as CalIcon } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatDate, todayISO } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import type { ApartmentUnit, Booking, Guest, MaintenanceBlock } from '@/lib/types';

interface BookingWithGuest extends Booking {
  guest: Guest | null;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200',
  PENDING_VERIFICATION_HOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  RESERVED: 'bg-blue-100 text-blue-700 border-blue-200',
  OCCUPIED: 'bg-sage-100 text-sage-700 border-sage-200',
  MAINTENANCE_BLOCK: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function AdminCalendar() {
  const { user } = useAuth();
  const [units, setUnits] = useState<ApartmentUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<BookingWithGuest[]>([]);
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<MaintenanceBlock[]>([]);
  const [cellData, setCellData] = useState<Record<string, { status: string; booking?: BookingWithGuest }>>({});
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintUnit, setMaintUnit] = useState<ApartmentUnit | null>(null);
  const [maintStart, setMaintStart] = useState('');
  const [maintEnd, setMaintEnd] = useState('');
  const [maintReason, setMaintReason] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ unit: ApartmentUnit; date: Date; status: string; booking?: BookingWithGuest } | null>(null);

  const daysToShow = 14;

  useEffect(() => {
    generateDays();
  }, [currentDate]);

  useEffect(() => {
    if (days.length > 0) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const generateDays = () => {
    const newDays: Date[] = [];
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      newDays.push(d);
    }
    setDays(newDays);
  };

  const loadData = async () => {
    setLoading(true);
    const { data: unitsData } = await supabase.from('apartment_units').select('*').order('unit_number');
    setUnits(unitsData || []);

    const startDate = days[0].toISOString().split('T')[0];
    const endDate = days[days.length - 1].toISOString().split('T')[0];

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`*, guest:guests(*)`)
      .lte('check_in', endDate)
      .gte('check_out', startDate)
      .in('status', ['PENDING', 'CONFIRMED', 'CHECKED_IN']);
    setBookings((bookingsData || []) as BookingWithGuest[]);

    const { data: maintData } = await supabase
      .from('maintenance_blocks')
      .select('*')
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    setMaintenanceBlocks(maintData || []);

    // Build cell data
    const cells: Record<string, { status: string; booking?: BookingWithGuest }> = {};
    for (const unit of (unitsData || [])) {
      for (const day of days) {
        const key = `${unit.id}_${day.toISOString().split('T')[0]}`;
        const dayDate = day.toISOString().split('T')[0];

        const maint = (maintData || []).find((m: MaintenanceBlock) =>
          m.unit_id === unit.id && dayDate >= m.start_date && dayDate <= m.end_date
        );
        if (maint) { cells[key] = { status: 'MAINTENANCE_BLOCK' }; continue; }

        const booking = (bookingsData || []).find((b: BookingWithGuest) =>
          b.unit_id === unit.id &&
          dayDate >= b.check_in && dayDate < b.check_out &&
          b.status !== 'EXPIRED' && b.status !== 'CANCELLED' && b.status !== 'REJECTED'
        );
        if (booking) {
          if (booking.status === 'CHECKED_IN') cells[key] = { status: 'OCCUPIED', booking };
          else if (booking.status === 'CONFIRMED') cells[key] = { status: 'RESERVED', booking };
          else if (booking.status === 'PENDING') {
            const expired = booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date();
            cells[key] = { status: expired ? 'AVAILABLE' : 'PENDING_VERIFICATION_HOLD', booking };
          }
          else cells[key] = { status: 'AVAILABLE' };
        } else {
          if (unit.status === 'maintenance') {
            cells[key] = { status: 'MAINTENANCE_BLOCK' };
          } else {
            cells[key] = { status: 'AVAILABLE' };
          }
        }
      }
    }
    setCellData(cells);
    setLoading(false);
  };

  const navigateDays = (direction: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + direction * daysToShow);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const openMaintenance = (unit: ApartmentUnit) => {
    setMaintUnit(unit);
    setMaintStart(todayISO());
    setMaintEnd(todayISO());
    setMaintReason('');
    setShowMaintModal(true);
  };

  const handleAddMaintenance = async () => {
    if (!maintUnit || !maintStart || !maintEnd || !maintReason) {
      toast('error', 'Please fill all fields.');
      return;
    }
    if (maintEnd < maintStart) { toast('error', 'End date must be after or equal to start date.'); return; }

    const { error } = await supabase.from('maintenance_blocks').insert({
      unit_id: maintUnit.id,
      start_date: maintStart,
      end_date: maintEnd,
      reason: maintReason,
      created_by: user?.id,
    });
    if (error) { toast('error', 'Could not add maintenance block.'); return; }

    await supabase.from('audit_logs').insert({
      action: 'maintenance_block_created',
      entity_type: 'apartment_unit',
      entity_id: maintUnit.id,
      metadata: { start: maintStart, end: maintEnd, reason: maintReason },
      reason: `Maintenance block added for ${maintUnit.unit_label}`,
    });

    toast('success', 'Maintenance block added.');
    setShowMaintModal(false);
    loadData();
  };

  const cellKey = (unitId: string, date: Date) => `${unitId}_${date.toISOString().split('T')[0]}`;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Availability Calendar</h1>
          <p className="mt-1 text-sm text-ink-500">View and manage unit availability across dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDays(-1)} className="btn-secondary px-3"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goToToday} className="btn-secondary">Today</button>
          <button onClick={() => navigateDays(1)} className="btn-secondary px-3"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${color}`}>
            {status.replace(/_/g, ' ')}
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading calendar..." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium text-ink-400">Unit</th>
                {days.map((day, i) => (
                  <th key={i} className="min-w-[80px] px-2 py-2 text-center text-xs">
                    <p className="font-medium text-ink-600">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                    <p className="text-ink-400">{day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map(unit => (
                <tr key={unit.id} className="border-b border-ink-50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink-900">{unit.unit_label}</p>
                      <button onClick={() => openMaintenance(unit)} className="text-ink-300 hover:text-orange-500" title="Add maintenance block">
                        <Wrench className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  {days.map((day, i) => {
                    const key = cellKey(unit.id, day);
                    const cell = cellData[key];
                    const status = cell?.status || 'AVAILABLE';
                    const colorClass = STATUS_COLORS[status] || STATUS_COLORS.AVAILABLE;
                    return (
                      <td key={i} className="border-l border-ink-50 p-1">
                        <button
                          onClick={() => setSelectedCell({ unit, date: day, status, booking: cell?.booking })}
                          className={`flex h-12 w-full items-center justify-center rounded-md border text-[10px] font-medium transition-all hover:opacity-80 ${colorClass}`}
                        >
                          {status === 'AVAILABLE' ? '' : status === 'PENDING_VERIFICATION_HOLD' ? 'HOLD' : status === 'MAINTENANCE_BLOCK' ? 'MAINT' : status === 'OCCUPIED' ? 'OCC' : status === 'RESERVED' ? 'RES' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Maintenance Modal */}
      <Modal
        open={showMaintModal}
        onClose={() => setShowMaintModal(false)}
        title={`Add Maintenance Block — ${maintUnit?.unit_label || ''}`}
        footer={
          <>
            <button onClick={() => setShowMaintModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddMaintenance} className="btn-primary">Add Block</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Start Date</label>
              <input type="date" value={maintStart} onChange={e => setMaintStart(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-text">End Date</label>
              <input type="date" value={maintEnd} onChange={e => setMaintEnd(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-text">Reason</label>
            <textarea value={maintReason} onChange={e => setMaintReason(e.target.value)} rows={2} className="input-field resize-none" placeholder="e.g. AC repair, repainting..." />
          </div>
        </div>
      </Modal>

      {/* Cell Detail Modal */}
      <Modal
        open={!!selectedCell}
        onClose={() => setSelectedCell(null)}
        title={selectedCell ? `${selectedCell.unit.unit_label} — ${formatDate(selectedCell.date.toISOString())}` : ''}
        size="sm"
      >
        {selectedCell && (
          <div className="space-y-3">
            <div className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${STATUS_COLORS[selectedCell.status]}`}>
              {selectedCell.status.replace(/_/g, ' ')}
            </div>
            {selectedCell.booking ? (
              <div className="rounded-lg bg-cream-50 p-4 text-sm">
                <p className="font-medium text-ink-900">{selectedCell.booking.booking_reference}</p>
                <p className="mt-1 text-ink-500">Guest: {selectedCell.booking.guest?.full_name || '—'}</p>
                <p className="text-ink-500">{formatDate(selectedCell.booking.check_in)} → {formatDate(selectedCell.booking.check_out)}</p>
                <p className="text-ink-500">{selectedCell.booking.nights} nights · {selectedCell.booking.guest_count} guests</p>
                <div className="mt-2"><Badge status={selectedCell.booking.status} /></div>
              </div>
            ) : selectedCell.status === 'AVAILABLE' ? (
              <p className="text-sm text-ink-500">This unit is available on this date.</p>
            ) : (
              <p className="text-sm text-ink-500">This unit is under maintenance.</p>
            )}
            {selectedCell.status === 'AVAILABLE' && (
              <button onClick={() => openMaintenance(selectedCell.unit)} className="btn-secondary w-full">
                <Wrench className="h-4 w-4" /> Block for Maintenance
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
