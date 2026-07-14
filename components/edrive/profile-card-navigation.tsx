'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAccess } from './portal-access';

const profileSelectors = [
  'aside .premium-surface > div:first-child',
  'aside .mt-auto.flex.flex-col.items-center.gap-2.pb-1 > :first-child',
  '.manager-mobile-avatar',
  '.manager-mobile-avatar + div'
];

function decorateProfileTargets() {
  profileSelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      element.dataset.profileNavigation = 'true';
      element.setAttribute('role', 'link');
      element.setAttribute('tabindex', '0');
      element.setAttribute('title', 'Open My Profile');
      element.classList.add('cursor-pointer', 'transition', 'hover:opacity-90', 'focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-primary/25');
    });
  });
}

export function ProfileCardNavigation() {
  const router = useRouter();
  const { role, loading } = usePortalAccess();

  useEffect(() => {
    if (loading || !role) return;

    const profileHref = role === 'manager' ? '/admin/manager/my-profile/' : '/admin/my-profile/';
    const decorate = () => window.requestAnimationFrame(decorateProfileTargets);
    decorate();

    const openProfile = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const profileTarget = target.closest<HTMLElement>('[data-profile-navigation="true"]');
      if (!profileTarget) return false;
      router.push(profileHref);
      return true;
    };

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('button, a, input, select, textarea')) return;
      openProfile(event.target);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!openProfile(event.target)) return;
      event.preventDefault();
    };

    const observer = new MutationObserver(decorate);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, role, router]);

  return null;
}
