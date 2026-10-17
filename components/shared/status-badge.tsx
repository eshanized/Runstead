import { cn } from '@/lib/utils';

type BadgeColor = 'success' | 'warning' | 'destructive' | 'default' | 'accent';

const colorMap: Record<BadgeColor, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  default: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({
  status,
  color,
  className,
}: {
  status: string;
  color?: BadgeColor;
  className?: string;
}) {
  const colorClass = color ?? colorForStatus(status);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        colorMap[colorClass],
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function colorForStatus(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    active: 'success',
    paid: 'success',
    operational: 'success',
    resolved: 'success',
    connected: 'success',
    available: 'success',
    live: 'success',
    sent: 'default',
    draft: 'default',
    pending: 'warning',
    provisioning: 'accent',
    in_progress: 'accent',
    degraded: 'warning',
    planned: 'accent',
    demo: 'accent',
    awaiting_payment: 'warning',
    overdue: 'destructive',
    failed: 'destructive',
    canceled: 'destructive',
    void: 'destructive',
    refunded: 'default',
    suspended: 'destructive',
    expired: 'destructive',
    closed: 'default',
    disconnected: 'default',
    unavailable: 'destructive',
    pending_transfer: 'warning',
    pending_registration: 'warning',
    roadmap: 'default',
    invited: 'warning',
    inactive: 'default',
  };
  return map[status] ?? 'default';
}
