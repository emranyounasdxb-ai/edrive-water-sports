'use client';

import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

type PortalAccessValue = {
  role: string;
  status: string;
  loading: boolean;
  isSuperAdmin: boolean;
  isReadOnlyAdmin: boolean;
  isBookingManager: boolean;
  canMutateCurrentPage: boolean;
};

const PortalAccessContext = createContext<PortalAccessValue>({
  role: '',
  status: '',
  loading: true,
  isSuperAdmin: false,
  isReadOnlyAdmin: false,
  isBookingManager: false,
  canMutateCurrentPage: false
});

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

function canMutatePath(role: string, pathname: string) {
  const path = normalizePath(pathname);
  if (role === 'super_admin') return true;
  if (role === 'admin') return false;
  if (role === 'booking_staff') return path === '/admin/bookings' || path.startsWith('/admin/bookings/');
  if (role === 'finance') return path === '/admin/payments' || path.startsWith('/admin/payments/');
  if (role === 'maintenance_staff') return path === '/admin/vehicles' || path.startsWith('/admin/vehicles/') || path === '/admin/maintenance' || path.startsWith('/admin/maintenance/');
  if (role === 'manager') return path === '/admin/my-rides' || path.startsWith('/admin/my-rides/');
  return false;
}

export function portalRoleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    booking_staff: 'Booking Manager',
    manager: 'Ride Manager',
    finance: 'Finance',
    maintenance_staff: 'Maintenance Staff'
  };
  return labels[role] || 'Portal User';
}

function legacyRoleLabel(role: string) {
  if (role === 'booking_staff') return 'Booking Staff';
  if (role === 'manager') return 'Manager';
  if (role === 'admin') return 'Admin';
  return portalRoleLabel(role);
}

export function PortalAccessProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (active) setLoading(false);
        return;
      }

      const email = user.email || '';
      const filter = email ? `auth_user_id.eq.${user.id},email.eq.${email}` : `auth_user_id.eq.${user.id}`;
      const { data } = await supabase.from('admin_users').select('role,status').or(filter).limit(1);
      if (!active) return;
      setRole(String(data?.[0]?.role || ''));
      setStatus(String(data?.[0]?.status || ''));
      setLoading(false);
    }

    void loadRole();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || !role) return;
    const oldLabel = legacyRoleLabel(role);
    const newLabel = portalRoleLabel(role);
    if (oldLabel === newLabel) return;

    const syncLabels = () => {
      document.querySelectorAll('p.text-primary').forEach((element) => {
        if (element.textContent?.trim() === oldLabel) element.textContent = newLabel;
      });
    };

    syncLabels();
    const observer = new MutationObserver(syncLabels);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [loading, role]);

  const value = useMemo<PortalAccessValue>(() => ({
    role,
    status,
    loading,
    isSuperAdmin: role === 'super_admin',
    isReadOnlyAdmin: role === 'admin',
    isBookingManager: role === 'booking_staff',
    canMutateCurrentPage: canMutatePath(role, pathname)
  }), [loading, pathname, role, status]);

  return <PortalAccessContext.Provider value={value}>{children}</PortalAccessContext.Provider>;
}

export function usePortalAccess() {
  return useContext(PortalAccessContext);
}

const mutationWords = [
  'add ', 'create ', 'edit', 'save', 'update', 'delete', 'remove', 'deactivate', 'activate', 'suspend',
  'manage', 'confirm & assign', 'confirm booking', 'assign manager', 'reassign manager', 'receive payment',
  'save receipt', 'receive settlement', 'cash handover', 'start ride', 'complete ride', 'mark no show',
  'make available', 'mark maintenance', 'approve', 'reject', 'publish', 'archive', 'change status', 'send reset'
];

const exactMutationLabels = new Set([
  'receive', 'maintenance', 'available', 'booked', 'for sale', 'reset', 'confirm', 'assign', 'reassign', 'no show'
]);

function isMutationControl(target: HTMLElement) {
  const control = target.closest('button, input[type="submit"], input[type="button"], [role="button"]') as HTMLElement | null;
  if (!control) return false;
  if (control.dataset.readonlyAllow === 'true') return false;
  const label = `${control.textContent || ''} ${control.getAttribute('aria-label') || ''} ${control.getAttribute('title') || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
  return exactMutationLabels.has(label) || mutationWords.some((word) => label.includes(word));
}

export function PortalRoleBoundary({ children }: { children: ReactNode }) {
  const { loading, role, canMutateCurrentPage } = usePortalAccess();
  const restricted = !loading && Boolean(role) && !canMutateCurrentPage;

  function blockClick(event: MouseEvent<HTMLDivElement>) {
    if (!restricted || !isMutationControl(event.target as HTMLElement)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function blockSubmit(event: FormEvent<HTMLDivElement>) {
    if (!restricted) return;
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div onClickCapture={blockClick} onSubmitCapture={blockSubmit}>
      {restricted ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div><p className="font-bold">Role-based access</p><p className="mt-0.5 text-xs font-semibold leading-5 text-primary-900/75">This page is read-only for the {portalRoleLabel(role)} role. Database security policies also enforce the same restriction.</p></div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
