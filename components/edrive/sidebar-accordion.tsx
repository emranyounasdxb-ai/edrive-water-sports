'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const sectionNames = new Set([
  'Overview',
  'Booking Operations',
  'Partners & Sales',
  'Assets',
  'Finance',
  'Team & System'
]);

type SidebarGroup = {
  key: string;
  header: HTMLElement;
  items: HTMLElement[];
};

function normalizePath(value: string) {
  if (!value || value === '/') return '/';
  return value.replace(/\/$/, '');
}

function headerLabel(header: HTMLElement) {
  const saved = header.dataset.sidebarLabel;
  if (saved) return saved;
  const label = String(header.textContent || '').trim();
  header.dataset.sidebarLabel = label;
  return label;
}

function collectGroups(nav: HTMLElement) {
  const groups: SidebarGroup[] = [];
  let current: SidebarGroup | null = null;

  Array.from(nav.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;

    const header = Array.from(node.children).find((child) => child instanceof HTMLElement && child.tagName === 'P') as HTMLElement | undefined;
    const label = header ? headerLabel(header) : '';

    if (header && sectionNames.has(label)) {
      current = { key: label, header, items: [] };
      groups.push(current);

      const firstLink = Array.from(node.children).find((child) => child instanceof HTMLElement && child.tagName === 'A') as HTMLElement | undefined;
      if (firstLink) current.items.push(firstLink);
      return;
    }

    if (current) current.items.push(node);
  });

  return groups;
}

function decorateHeader(header: HTMLElement, key: string) {
  header.dataset.sidebarSection = key;
  header.dataset.sidebarLabel = key;
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.className = 'mb-1 mt-1 flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-primary-50 hover:text-primary-900';

  let label = header.querySelector<HTMLElement>('[data-sidebar-section-label]');
  let arrow = header.querySelector<HTMLElement>('[data-sidebar-section-arrow]');

  if (!label) {
    header.textContent = '';
    label = document.createElement('span');
    label.dataset.sidebarSectionLabel = 'true';
    label.textContent = key;
    header.appendChild(label);
  }

  if (!arrow) {
    arrow = document.createElement('span');
    arrow.dataset.sidebarSectionArrow = 'true';
    arrow.className = 'ml-2 text-sm leading-none transition-transform duration-200';
    arrow.textContent = '⌄';
    header.appendChild(arrow);
  }
}

function setGroupOpen(group: SidebarGroup, open: boolean) {
  group.header.setAttribute('aria-expanded', String(open));
  group.header.classList.toggle('bg-primary-50', open);
  group.header.classList.toggle('text-primary-900', open);

  const arrow = group.header.querySelector<HTMLElement>('[data-sidebar-section-arrow]');
  if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(-90deg)';

  group.items.forEach((item) => {
    item.hidden = !open;
  });
}

function linkMatchesPath(link: HTMLAnchorElement, pathname: string) {
  const href = normalizePath(link.getAttribute('href')?.split('?')[0] || '');
  const current = normalizePath(pathname);
  if (!href) return false;
  if (href === '/admin') return current === '/admin';
  return current === href || current.startsWith(`${href}/`);
}

function activeGroupKey(groups: SidebarGroup[], pathname: string) {
  for (const group of groups) {
    const links = group.items.flatMap((item) => {
      if (item instanceof HTMLAnchorElement) return [item];
      return Array.from(item.querySelectorAll<HTMLAnchorElement>('a[href]'));
    });
    if (links.some((link) => linkMatchesPath(link, pathname))) return group.key;
  }
  return '';
}

function applyAccordion(pathname: string) {
  document.querySelectorAll<HTMLElement>('nav').forEach((nav) => {
    const groups = collectGroups(nav);
    if (!groups.length) return;

    groups.forEach((group) => decorateHeader(group.header, group.key));
    const activeKey = activeGroupKey(groups, pathname);
    groups.forEach((group) => setGroupOpen(group, group.key === activeKey));
  });
}

function toggleSection(header: HTMLElement) {
  const nav = header.closest('nav');
  const key = header.dataset.sidebarSection;
  if (!(nav instanceof HTMLElement) || !key) return;

  const groups = collectGroups(nav);
  const selected = groups.find((group) => group.key === key);
  if (!selected) return;

  const willOpen = selected.header.getAttribute('aria-expanded') !== 'true';
  groups.forEach((group) => setGroupOpen(group, willOpen && group.key === key));
}

function addedNodeContainsSidebar(node: Node) {
  if (!(node instanceof HTMLElement)) return false;
  const candidates = [node, ...Array.from(node.querySelectorAll<HTMLElement>('p'))];
  return candidates.some((candidate) => sectionNames.has(String(candidate.textContent || '').trim()));
}

export function SidebarAccordion() {
  const pathname = usePathname();

  useEffect(() => {
    const run = () => window.requestAnimationFrame(() => applyAccordion(pathname));
    run();

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const header = event.target.closest<HTMLElement>('[data-sidebar-section]');
      if (!header) return;
      event.preventDefault();
      toggleSection(header);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!(event.target instanceof Element)) return;
      const header = event.target.closest<HTMLElement>('[data-sidebar-section]');
      if (!header) return;
      event.preventDefault();
      toggleSection(header);
    };

    const observer = new MutationObserver((mutations) => {
      const needsRefresh = mutations.some((mutation) => Array.from(mutation.addedNodes).some(addedNodeContainsSidebar));
      if (needsRefresh) run();
    });

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
