'use client';

import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

type PortalAccessValue = {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  nationality: string;
  role: string;
  status: string;
  accessError: string;
  loading: boolean;
  refreshAccess: () => void;
  isSuperAdmin: boolean;
  isReadOnlyAdmin: boolean;
  isBookingManager: boolean;
  canMutateCurrentPage: boolean;
};

const PortalAccessContext = createContext<PortalAccessValue>({
  userId: '',
  fullName: '',
  email: '',
  avatarUrl: '',
  nationality: '',
  role: '',
  status: '',
  accessError: '',
  loading: true,
  refreshAccess: () => undefined,
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
  const activePortalRoles = new Set(['super_admin', 'admin', 'booking_staff', 'manager', 'finance']);
  const isSelfProfilePath = path === '/admin/my-profile' || path === '/admin/manager/my-profile';
  if (isSelfProfilePath && activePortalRoles.has(role)) return true;
  if (role === 'super_admin') return true;
  if (role === 'admin') return false;
  if (role === 'booking_staff') return path === '/admin/bookings' || path.startsWith('/admin/bookings/') || path === '/admin/inquiries' || path.startsWith('/admin/inquiries/');
  if (role === 'finance') return false;
  if (role === 'manager') return path === '/admin/my-rides' || path.startsWith('/admin/my-rides/');
  return false;
}

export function portalRoleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    booking_staff: 'Booking Manager',
    manager: 'Ride Manager',
    finance: 'Finance'
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
  const router = useRouter();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [profile, setProfile] = useState({ userId: '', fullName: '', email: '', avatarUrl: '', nationality: '' });
  const [accessError, setAccessError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadVersion, setLoadVersion] = useState(0);
  const isLoginPage = normalizePath(pathname) === '/admin/login';

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (isLoginPage) {
        if (active) {
          setProfile({ userId: '', fullName: '', email: '', avatarUrl: '', nationality: '' });
          setRole('');
          setStatus('');
          setAccessError('');
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setAccessError('');
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        if (active) {
          setProfile({ userId: '', fullName: '', email: '', avatarUrl: '', nationality: '' });
          setRole('');
          setStatus('');
          setLoading(false);
          router.replace('/admin/login');
        }
        return;
      }

      const { data, error } = await supabase.from('admin_users').select('full_name,email,role,status,avatar_url,nationality').eq('auth_user_id', user.id).limit(2);
      if (!active) return;
      if (error) setAccessError(`Profile read error: ${error.message}`);
      const row = !error && data?.length === 1 && String(data[0]?.status || '').toLowerCase() === 'active' ? data[0] : null;
      if (!row && !error) setAccessError('No active portal profile is linked to this account.');
      setProfile({
        userId: row ? user.id : '',
        fullName: String(row?.full_name || user.email || ''),
        email: String(row?.email || user.email || ''),
        avatarUrl: String(row?.avatar_url || ''),
        nationality: String(row?.nationality || '')
      });
      setRole(String(row?.role || ''));
      setStatus(String(row?.status || ''));
      setLoading(false);
    }

    void loadRole();
    return () => { active = false; };
  }, [isLoginPage, loadVersion, router]);

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

  const effectiveLoading = loading || (!isLoginPage && !role && !accessError);
  const value = useMemo<PortalAccessValue>(() => ({
    ...profile,
    role,
    status,
    accessError,
    loading: effectiveLoading,
    refreshAccess: () => setLoadVersion((value) => value + 1),
    isSuperAdmin: role === 'super_admin',
    isReadOnlyAdmin: role === 'admin',
    isBookingManager: role === 'booking_staff',
    canMutateCurrentPage: canMutatePath(role, pathname)
  }), [accessError, effectiveLoading, pathname, profile, role, status]);

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
  if (!loading && role === 'maintenance_staff') {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-800">Maintenance Staff portal access is inactive. Fleet lifecycle and maintenance operations are restricted to Super Admin.</div>;
  }
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
