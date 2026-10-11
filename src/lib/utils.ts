export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₦0';
  return '₦' + new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function tomorrowISO(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split('T')[0];
}

export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateIdempotencyKey(): string {
  return `bk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'bg-ink-100 text-ink-600',
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CHECKED_IN: 'bg-blue-100 text-blue-700',
    CHECKED_OUT: 'bg-sage-100 text-sage-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-ink-100 text-ink-500',
    CANCELLED: 'bg-red-50 text-red-600',
    CONFLICT_REVIEW: 'bg-orange-100 text-orange-700',
    NOT_SUBMITTED: 'bg-ink-100 text-ink-500',
    AWAITING_VERIFICATION: 'bg-amber-100 text-amber-700',
    VERIFIED: 'bg-green-100 text-green-700',
    PARTIALLY_VERIFIED: 'bg-yellow-100 text-yellow-700',
    REFUND_PENDING: 'bg-purple-100 text-purple-700',
    REFUNDED: 'bg-sage-100 text-sage-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    REPLACEMENT_SUBMITTED: 'bg-blue-100 text-blue-700',
    NOT_UPLOADED: 'bg-ink-100 text-ink-500',
  };
  return map[status] || 'bg-ink-100 text-ink-600';
}

export function downloadCSV(filename: string, rows: Record<string, string | number>[]): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = row[h];
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
