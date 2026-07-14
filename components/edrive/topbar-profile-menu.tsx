'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, UserCog } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { countryFlagUrl } from '@/lib/country-options';
import { supabase } from '@/lib/supabase-client';
import { portalRoleLabel, usePortalAccess } from './portal-access';

type ProfileSummary = {
  name: string;
  email: string;
  avatarUrl: string;
  nationality: string;
};

const hiddenShellSelectors = [
  'aside .premium-surface',
  'aside .mt-auto.flex.flex-col.items-center.gap-2.pb-1',
  'header.sticky .manager-mobile-avatar',
  'header.sticky .manager-mobile-avatar + div',
  'header.sticky .ml-auto > button[aria-label="Logout"]'
];

function hideOldProfileControls() {
  hiddenShellSelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.dataset.profileMenuHidden = 'true';
      element.style.display = 'none';
    });
  });
}

function restoreOldProfileControls() {
  document.querySelectorAll<HTMLElement>('[data-profile-menu-hidden="true"]').forEach((element) => {
    element.style.removeProperty('display');
    delete element.dataset.profileMenuHidden;
  });
}

function ensureTopbarMount() {
  const actionBar = document.querySelector<HTMLElement>('header.sticky .ml-auto.flex.shrink-0');
  if (!actionBar) return null;

  const current = actionBar.querySelector<HTMLElement>('#edrive-topbar-profile-menu');
  if (current) return current;

  const mount = document.createElement('div');
  mount.id = 'edrive-topbar-profile-menu';
  mount.className = 'relative flex shrink-0 items-center';

  const mobileLogout = actionBar.querySelector<HTMLElement>('button[aria-label="Logout"]');
  if (mobileLogout) actionBar.insertBefore(mount, mobileLogout);
  else actionBar.appendChild(mount);

  return mount;
}

export function TopbarProfileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading: roleLoading } = usePortalAccess();
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [profile, setProfile] = useState<ProfileSummary>({ name: 'Portal User', email: '', avatarUrl: '', nationality: '' });
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';
  const profileHref = role === 'manager' ? '/admin/manager/my-profile/' : '/admin/my-profile/';
  const flagUrl = countryFlagUrl(profile.nationality, 40);

  useEffect(() => {
    if (isLoginPage) return;

    const sync = () => {
      hideOldProfileControls();
      const target = ensureTopbarMount();
      if (target) setMount(target);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      restoreOldProfileControls();
      document.getElementById('edrive-topbar-profile-menu')?.remove();
    };
  }, [isLoginPage]);

  useEffect(() => {
    if (roleLoading || !role || isLoginPage) return;
    let active = true;

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser || !active) return;

      const authEmail = authUser.email || '';
      const filter = authEmail
        ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}`
        : `auth_user_id.eq.${authUser.id}`;
      const { data } = await supabase
        .from('admin_users')
        .select('full_name,email,avatar_url,nationality')
        .or(filter)
        .limit(1);
      if (!active) return;

      const row = data?.[0] as Record<string, unknown> | undefined;
      setProfile({
        name: String(row?.full_name || authEmail || 'Portal User'),
        email: String(row?.email || authEmail || ''),
        avatarUrl: String(row?.avatar_url || ''),
        nationality: String(row?.nationality || '')
      });
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [isLoginPage, role, roleLoading, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  async function logout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (!mount || isLoginPage || roleLoading || !role) return null;

  return createPortal(
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Open profile menu"
        className="flex h-10 items-center gap-1 rounded-full border border-border bg-white px-1.5 text-primary-900 shadow-sm transition hover:border-primary/35 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name} className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#F0E6D7] text-primary"><User className="size-4" aria-hidden="true" /></span>
        )}
        <ChevronDown className={`mr-1 size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-[100] w-72 overflow-hidden rounded-[1.25rem] border border-border/80 bg-white shadow-[0_22px_60px_rgba(8,37,50,0.18)]">
          <div className="flex items-center gap-3 bg-[linear-gradient(135deg,#EAF8FA,#FFFFFF_55%,#F4E7C7)] p-4">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="size-12 rounded-full border-2 border-white object-cover shadow-sm" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-[#F0E6D7] text-primary shadow-sm"><User className="size-5" aria-hidden="true" /></span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-bold text-primary-900">{profile.name}</p>
                {flagUrl ? <img src={flagUrl} alt="Nationality flag" className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm" /> : null}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-primary">{portalRoleLabel(role)}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-1 p-2">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-900 transition hover:bg-primary-50"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary"><UserCog className="size-4" aria-hidden="true" /></span>
              Update Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-red-600"><LogOut className="size-4" aria-hidden="true" /></span>
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    mount
  );
}
