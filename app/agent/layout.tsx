import { AgentPortalProvider } from '@/components/edrive/agent/agent-portal-provider';
import { AgentPortalShell } from '@/components/edrive/agent/agent-portal-shell';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentPortalProvider><AgentPortalShell>{children}</AgentPortalShell></AgentPortalProvider>;
}
