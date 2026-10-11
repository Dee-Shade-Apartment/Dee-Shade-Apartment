import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Eye, Save, AlertCircle } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, formatDateTime } from '@/lib/utils';
import { CAUTION_FEE_STATUS_LABELS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import type { CautionFeeRecord, Booking, Guest } from '@/lib/types';

interface CautionWithBooking extends CautionFeeRecord {
  booking: Booking | null;
}

export function AdminCautionFees() {
  const { user } = useAuth();
  const [records, setRecords] = useState<CautionWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<CautionWithBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [deductionReason, setDeductionReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('0');
  const [refundRef, setRefundRef] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('caution_fee_records')
      .select(`*, booking:bookings(*)`)
      .order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('inspection_status', statusFilter);
    const { data } = await query;

    // Load guests for bookings
    const bookingIds = (data || []).map((r: CautionFeeRecord) => r.booking_id).filter(Boolean);
    let guestsMap: Record<string, Guest> = {};
    if (bookingIds.length > 0) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, guest:guests(*)')
        .in('id', bookingIds);
      for (const b of (bookingsData || [])) {
        if (b.guest) guestsMap[b.id] = b.guest as Guest;
      }
    }

    const result = ((data || []) as CautionWithBooking[]).map(r => ({
      ...r,
      booking: r.booking ? { ...r.booking, guest: guestsMap[r.booking.id] || null } as Booking : null,
    }));

    setRecords(result);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const openRecord = (record: CautionWithBooking) => {
    setSelected(record);
    setInspectionNotes(record.inspection_notes || '');
    setDeductions(String(record.deductions || 0));
    setDeductionReason(record.deduction_reason || '');
    setRefundAmount(String(record.amount_refunded || 0));
    setRefundRef(record.refund_reference || '');
    setNewStatus(record.inspection_status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);

    const { error } = await supabase
      .from('caution_fee_records')
      .update({
        inspection_status: newStatus,
        inspection_notes: inspectionNotes || null,
        deductions: Number(deductions) || 0,
        deduction_reason: deductionReason || null,
        amount_refunded: Number(refundAmount) || 0,
        refund_reference: refundRef || null,
        refund_date: newStatus === 'refunded' || newStatus === 'partially_refunded' ? new Date().toISOString() : null,
      })
      .eq('id', selected.id);

    if (error) { setSaving(false); toast('error', 'Could not save caution fee record.'); return; }

    await supabase.from('audit_logs').insert({
      action: 'caution_fee_updated',
      entity_type: 'caution_fee_record',
      entity_id: selected.id,
      metadata: { status: newStatus, deductions: Number(deductions), refundAmount: Number(refundAmount) },
      reason: `Caution fee record updated: ${CAUTION_FEE_STATUS_LABELS[newStatus]}`,
    });

    setSaving(false);
    toast('success', 'Caution fee record updated.');
    setShowModal(false);
    loadRecords();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Caution Fee Management</h1>
        <p className="mt-1 text-sm text-ink-500">Track refundable caution fees separately from accommodation revenue.</p>
      </div>

      <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <AlertCircle className="mr-1.5 inline h-4 w-4" />
        Caution fees are liabilities, not revenue. They must be refunded after checkout subject to inspection.
      </div>

      <Card className="mb-4 p-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
          <option value="">All Statuses</option>
          {Object.entries(CAUTION_FEE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading caution fees..." />
      ) : records.length === 0 ? (
        <Card className="p-8"><EmptyState icon={<DollarSign className="h-12 w-12" />} title="No caution fee records" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Booking Ref</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Refunded</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 font-medium text-ink-900">{r.booking?.booking_reference || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{(r.booking as Booking & { guest?: Guest })?.guest?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{formatNaira(r.expected_amount)}</td>
                    <td className="px-4 py-3 text-ink-600">{r.amount_received ? formatNaira(r.amount_received) : '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{r.amount_refunded > 0 ? formatNaira(r.amount_refunded) : '—'}</td>
                    <td className="px-4 py-3"><Badge status={r.inspection_status} label={CAUTION_FEE_STATUS_LABELS[r.inspection_status]} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => openRecord(r)} className="rounded-lg p-1.5 text-gold-600 hover:bg-gold-50">
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

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Caution Fee Record"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="text-xs text-ink-400">Booking Reference</p>
                <p className="mt-1 text-sm font-medium text-ink-900">{selected.booking?.booking_reference || '—'}</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="text-xs text-ink-400">Guest</p>
                <p className="mt-1 text-sm font-medium text-ink-900">{(selected.booking as Booking & { guest?: Guest })?.guest?.full_name || '—'}</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="text-xs text-ink-400">Expected Amount</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{formatNaira(selected.expected_amount)}</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-4">
                <p className="text-xs text-ink-400">Amount Received</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{selected.amount_received ? formatNaira(selected.amount_received) : 'Not received'}</p>
              </div>
            </div>

            <div>
              <label className="label-text">Inspection Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
                {Object.entries(CAUTION_FEE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div>
              <label className="label-text">Inspection Notes</label>
              <textarea value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} rows={2} className="input-field resize-none" placeholder="Record inspection findings..." />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-text">Deductions</label>
                <input value={deductions} onChange={e => setDeductions(e.target.value)} type="number" className="input-field" />
              </div>
              <div>
                <label className="label-text">Deduction Reason</label>
                <input value={deductionReason} onChange={e => setDeductionReason(e.target.value)} className="input-field" placeholder="e.g. Damaged furniture" />
              </div>
              <div>
                <label className="label-text">Refund Amount</label>
                <input value={refundAmount} onChange={e => setRefundAmount(e.target.value)} type="number" className="input-field" />
              </div>
              <div>
                <label className="label-text">Refund Transaction Reference</label>
                <input value={refundRef} onChange={e => setRefundRef(e.target.value)} className="input-field" placeholder="Bank transfer ref" />
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Recording a refund here does not automatically issue a refund. You must perform the actual bank transfer and record the reference above.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
