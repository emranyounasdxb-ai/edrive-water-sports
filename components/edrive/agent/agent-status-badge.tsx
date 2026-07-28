import { Badge } from '@/components/ui/badge';
import { uiLabel } from '@/lib/ui-labels';

export function AgentStatusBadge({ status }: { status: string | null | undefined }) {
  const value = String(status || 'Pending');
  const normalized = value.trim().toLowerCase();
  const variant = ['active', 'approved', 'confirmed', 'completed', 'paid'].includes(normalized)
    ? 'success'
    : ['rejected', 'cancelled', 'inactive'].includes(normalized)
      ? 'destructive'
      : ['pending', 'no show', 'no_show', 'suspended'].includes(normalized)
        ? 'warning'
        : 'secondary';
  return <Badge variant={variant}>{uiLabel(value)}</Badge>;
}
