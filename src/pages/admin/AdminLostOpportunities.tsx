import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, Plus, Eye, Users, DollarSign, Clock } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { formatNaira, formatDate, todayISO, tomorrowISO } from '@/lib/utils';
import { LOST_REASONS } from '@/lib/constants';
import type { Enquiry } from '@/lib/types';

const ENQUIRY_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  waitlisted: 'Waitlisted',
  lost: 'Lost',
  converted: 'Converted',
};

export function AdminLostOpportunities() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [staffNotes, setStaffNotes] = useState('');

  // Add form
  const [gName, setGName] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gCheckIn, setGCheckIn] = useState('');
  const [gCheckOut, setGCheckOut] = useState('');
  const [gCount, setGCount] = useState('2');
  const [gMessage, setGMessage] = useState('');
  const [gEstValue, setGEstValue] = useState('');
  const [gReason, setGReason] = useState('');
  const [gFollowUp, setGFollowUp] = useState('new');

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('follow_up_status', statusFilter);
    const { data } = await query;
    setEnquiries((data || []) as Enquiry[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadEnquiries(); }, [loadEnquiries]);

  const handleAdd = async () => {
    if (!gName && !gPhone) { toast('error', 'Please enter at least a name or phone number.'); return; }
    const { error } = await supabase.from('enquiries').insert({
      guest_name: gName || null,
      guest_phone: gPhone || null,
      guest_email: gEmail || null,
      requested_check_in: gCheckIn || null,
      requested_check_out: gCheckOut || null,
      guest_count: Number(gCount) || null,
      message: gMessage || null,
      estimated_value: gEstValue ? Number(gEstValue) : null,
      lost_reason: gReason || null,
      follow_up_status: gFollowUp,
    });
    if (error) { toast('error', 'Could not add enquiry.'); return; }
    toast('success', 'Enquiry added.');
    setShowAdd(false);
    setGName(''); setGPhone(''); setGEmail(''); setGCheckIn(''); setGCheckOut(''); setGCount('2'); setGMessage(''); setGEstValue(''); setGReason(''); setGFollowUp('new');
    loadEnquiries();
  };

  const openDetails = (enq: Enquiry) => {
    setSelected(enq);
    setStaffNotes(enq.staff_notes || '');
    setShowDetails(true);
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase.from('enquiries').update({ staff_notes: staffNotes }).eq('id', selected.id);
    if (error) { toast('error', 'Could not save notes.'); return; }
    toast('success', 'Notes saved.');
    loadEnquiries();
    setShowDetails(false);
  };

  const updateStatus = async (enq: Enquiry, status: string) => {
    const { error } = await supabase.from('enquiries').update({ follow_up_status: status }).eq('id', enq.id);
    if (error) { toast('error', 'Could not update status.'); return; }
    toast('success', 'Status updated.');
    loadEnquiries();
  };

  const lostCount = enquiries.filter(e => e.follow_up_status === 'lost').length;
  const lostValue = enquiries.filter(e => e.follow_up_status === 'lost').reduce((sum, e) => sum + (e.estimated_value || 0), 0);
  const waitlistCount = enquiries.filter(e => e.follow_up_status === 'waitlisted').length;
  const reasonCounts: Record<string, number> = {};
  enquiries.filter(e => e.lost_reason).forEach(e => {
    const r = e.lost_reason!;
    reasonCounts[r] = (reasonCounts[r] || 0) + 1;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Lost Booking Opportunities</h1>
          <p className="mt-1 text-sm text-ink-500">Track enquiries that didn't convert and identify patterns.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="h-4 w-4" /> Add Enquiry</button>
      </div>

      {/* Summary */}
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100"><TrendingDown className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{lostCount}</p>
              <p className="text-xs text-ink-400">Lost enquiries</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100"><DollarSign className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{formatNaira(lostValue)}</p>
              <p className="text-xs text-ink-400">Est. potential value (not earned)</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><Clock className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{waitlistCount}</p>
              <p className="text-xs text-ink-400">Waitlist entries</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reasons breakdown */}
      {Object.keys(reasonCounts).length > 0 && (
        <Card className="mb-4 p-5">
          <h3 className="text-sm font-semibold text-ink-900">Reasons Bookings Are Lost</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <span key={reason} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
                {reason}: <strong>{count}</strong>
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
          <option value="">All Statuses</option>
          {Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading enquiries..." />
      ) : enquiries.length === 0 ? (
        <Card className="p-8"><EmptyState icon={<Users className="h-12 w-12" />} title="No enquiries recorded" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Requested Dates</th>
                  <th className="px-4 py-3 font-medium">Est. Value</th>
                  <th className="px-4 py-3 font-medium">Lost Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {enquiries.map(e => (
                  <tr key={e.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 text-ink-600">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{e.guest_name || '—'}</p>
                      <p className="text-xs text-ink-400">{e.guest_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {e.requested_check_in ? `${formatDate(e.requested_check_in)} → ${formatDate(e.requested_check_out || '')}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{e.estimated_value ? formatNaira(e.estimated_value) : '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{e.lost_reason || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={e.follow_up_status}
                        onChange={ev => updateStatus(e, ev.target.value)}
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs"
                      >
                        {Object.entries(ENQUIRY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDetails(e)} className="rounded-lg p-1.5 text-gold-600 hover:bg-gold-50">
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

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Enquiry / Lost Opportunity"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} className="btn-primary">Add Enquiry</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label-text">Guest Name</label><input value={gName} onChange={e => setGName(e.target.value)} className="input-field" /></div>
            <div><label className="label-text">Phone</label><input value={gPhone} onChange={e => setGPhone(e.target.value)} className="input-field" placeholder="+234..." /></div>
            <div><label className="label-text">Email</label><input value={gEmail} onChange={e => setGEmail(e.target.value)} className="input-field" /></div>
            <div><label className="label-text">Guests</label><select value={gCount} onChange={e => setGCount(e.target.value)} className="input-field">{[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="label-text">Requested Check-in</label><input type="date" value={gCheckIn} onChange={e => setGCheckIn(e.target.value)} className="input-field" /></div>
            <div><label className="label-text">Requested Check-out</label><input type="date" value={gCheckOut} onChange={e => setGCheckOut(e.target.value)} className="input-field" /></div>
            <div><label className="label-text">Estimated Value</label><input value={gEstValue} onChange={e => setGEstValue(e.target.value)} type="number" className="input-field" /></div>
            <div><label className="label-text">Lost Reason</label><select value={gReason} onChange={e => setGReason(e.target.value)} className="input-field"><option value="">None</option>{LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div><label className="label-text">Message / Notes</label><textarea value={gMessage} onChange={e => setGMessage(e.target.value)} rows={2} className="input-field resize-none" /></div>
          <div><label className="label-text">Follow-up Status</label><select value={gFollowUp} onChange={e => setGFollowUp(e.target.value)} className="input-field">{Object.entries(ENQUIRY_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="Enquiry Details"
        size="md"
        footer={<><button onClick={() => setShowDetails(false)} className="btn-secondary">Close</button><button onClick={saveNotes} className="btn-primary">Save Notes</button></>}
      >
        {selected && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><p className="text-xs text-ink-400">Guest</p><p className="font-medium text-ink-900">{selected.guest_name || '—'}</p></div>
              <div><p className="text-xs text-ink-400">Phone</p><p className="font-medium text-ink-900">{selected.guest_phone || '—'}</p></div>
              <div><p className="text-xs text-ink-400">Email</p><p className="font-medium text-ink-900">{selected.guest_email || '—'}</p></div>
              <div><p className="text-xs text-ink-400">Guests</p><p className="font-medium text-ink-900">{selected.guest_count || '—'}</p></div>
              <div><p className="text-xs text-ink-400">Check-in</p><p className="font-medium text-ink-900">{selected.requested_check_in ? formatDate(selected.requested_check_in) : '—'}</p></div>
              <div><p className="text-xs text-ink-400">Check-out</p><p className="font-medium text-ink-900">{selected.requested_check_out ? formatDate(selected.requested_check_out) : '—'}</p></div>
              <div><p className="text-xs text-ink-400">Est. Value</p><p className="font-medium text-ink-900">{selected.estimated_value ? formatNaira(selected.estimated_value) : '—'}</p></div>
              <div><p className="text-xs text-ink-400">Lost Reason</p><p className="font-medium text-ink-900">{selected.lost_reason || '—'}</p></div>
            </div>
            {selected.message && <div className="rounded-lg bg-cream-50 p-3 text-sm text-ink-600">{selected.message}</div>}
            <div><label className="label-text">Staff Notes</label><textarea value={staffNotes} onChange={e => setStaffNotes(e.target.value)} rows={3} className="input-field resize-none" /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
