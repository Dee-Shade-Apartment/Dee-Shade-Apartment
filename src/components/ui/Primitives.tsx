import { type ReactNode } from 'react';

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className = '' }: BadgeProps) {
  const colorMap: Record<string, string> = {
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
    expected: 'bg-ink-100 text-ink-600',
    received: 'bg-green-100 text-green-700',
    awaiting_inspection: 'bg-amber-100 text-amber-700',
    eligible_for_refund: 'bg-blue-100 text-blue-700',
    refund_pending: 'bg-purple-100 text-purple-700',
    refunded: 'bg-sage-100 text-sage-700',
    deduction_under_review: 'bg-orange-100 text-orange-700',
    partially_refunded: 'bg-yellow-100 text-yellow-700',
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    waitlisted: 'bg-purple-100 text-purple-700',
    lost: 'bg-red-100 text-red-700',
    converted: 'bg-green-100 text-green-700',
  };

  const colorClass = colorMap[status] || 'bg-ink-100 text-ink-600';
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colorClass} ${className}`}>
      {displayLabel}
    </span>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`rounded-2xl border border-ink-100 bg-white shadow-sm ${className}`}>{children}</div>;
}

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export function SectionTitle({ eyebrow, title, subtitle, center = false }: SectionTitleProps) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-600">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-semibold text-ink-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-ink-500">{subtitle}</p>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-700">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm text-ink-400">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const dimensions = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-2 border-ink-200 border-t-gold-600 ${dimensions}`} />
      {label && <p className="mt-3 text-sm text-ink-400">{label}</p>}
    </div>
  );
}
