import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui/Primitives';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (actionFilter) query = query.eq('action', actionFilter);
    const { data } = await query;
    let result = (data || []) as AuditLog[];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.action.toLowerCase().includes(s) ||
        (l.actor_name?.toLowerCase().includes(s) || false) ||
        (l.reason?.toLowerCase().includes(s) || false)
      );
    }
    setLogs(result);
    setLoading(false);
  }, [search, actionFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">Audit Log</h1>
        <p className="mt-1 text-sm text-ink-500">Immutable record of all critical actions. Entries cannot be edited or deleted.</p>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-300" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by action, actor, or reason..." className="input-field pl-10" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input-field">
            <option value="">All Actions</option>
            {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading audit logs..." />
      ) : logs.length === 0 ? (
        <Card className="p-8"><EmptyState icon={<ScrollText className="h-12 w-12" />} title="No audit entries" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-cream-50 text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Reason / Details</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.is_demo && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">DEMO</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{log.actor_name || 'System'}</td>
                    <td className="px-4 py-3 text-ink-600 max-w-xs">{log.reason || '—'}</td>
                    <td className="px-4 py-3 text-xs text-ink-400">{log.entity_type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
