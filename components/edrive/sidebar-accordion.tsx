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
  headerWrapper: HTMLElement;
  firstLink: HTMLAnchorElement | null;
  itemWrappers: HTMLElement[];
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
      const firstLink = Array.from(node.children).find((child) => child instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
      current = {
        key: label,
        header,
        headerWrapper: node,
        firstLink: firstLink || null,
        itemWrappers: []
      };
      groups.push(current);
      return;
    }

    if (current) current.itemWrappers.push(node);
  });

  return groups;
}

function decorateHeader(header: HTMLElement, key: string) {
  header.dataset.sidebarSection = key;
  header.dataset.sidebarLabel = key;
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.style.outline = 'none';
  header.className = 'mb-1 mt-1 flex w-full cursor-pointer select-none items-center justify-between rounded-xl border border-transparent px-2.5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 hover:bg-primary-50 hover:text-primary-900';

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
    arrow.className = 'ml-2 text-base leading-none transition-transform duration-200';
    arrow.textContent = '›';
    header.appendChild(arrow);
  }
}

function groupLinks(group: SidebarGroup) {
  const links: HTMLAnchorElement[] = [];
  if (group.firstLink) links.push(group.firstLink);
  group.itemWrappers.forEach((item) => {
    links.push(...Array.from(item.querySelectorAll<HTMLAnchorElement>('a[href]')));
  });
  return links;
}

function setGroupOpen(group: SidebarGroup, open: boolean) {
  group.header.setAttribute('aria-expanded', String(open));
  group.header.classList.toggle('bg-primary-50', open);
  group.header.classList.toggle('text-primary-900', open);
  group.header.classList.toggle('border-primary/15', open);
  group.header.classList.toggle('shadow-sm', open);

  const arrow = group.header.querySelector<HTMLElement>('[data-sidebar-section-arrow]');
  if (arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';

  if (group.firstLink) group.firstLink.style.display = open ? '' : 'none';
  group.itemWrappers.forEach((item) => {
    item.style.display = open ? '' : 'none';
  });
}

function linkMatchesPath(link: HTMLAnchorElement, pathname: string) {
  const href = normalizePath(link.getAttribute('href')?.split('?')[0] || '');
  const current = normalizePath(pathname);
  if (!href) return false;
  if (href === '/admin') return current === '/admin';
  return current === href || current.startsWith(`${href}/`);
}

function applyPageSelection(groups: SidebarGroup[], pathname: string) {
  groups.forEach((group) => {
    groupLinks(group).forEach((link) => {
      const active = linkMatchesPath(link, pathname);
      link.setAttribute('aria-current', active ? 'page' : 'false');
      link.classList.toggle('bg-primary-100', active);
      link.classList.toggle('text-primary-900', active);
      link.classList.toggle('shadow-sm', active);

      const icon = link.querySelector<HTMLElement>('span');
      if (icon) {
        icon.classList.toggle('bg-[#DDF4F6]', active);
        icon.classList.toggle('text-primary', active);
      }
    });
  });
}

function activeGroupKey(groups: SidebarGroup[], pathname: string) {
  for (const group of groups) {
    if (groupLinks(group).some((link) => linkMatchesPath(link, pathname))) return group.key;
  }
  return '';
}

function applyAccordion(pathname: string) {
  document.querySelectorAll<HTMLElement>('nav').forEach((nav) => {
    const groups = collectGroups(nav);
    if (!groups.length) return;

    groups.forEach((group) => decorateHeader(group.header, group.key));
    applyPageSelection(groups, pathname);

    const activeKey = activeGroupKey(groups, pathname);
    const previousPath = nav.dataset.sidebarPath || '';
    if (previousPath !== pathname) {
      nav.dataset.sidebarPath = pathname;
      nav.dataset.openSidebarSection = activeKey;
    }

    const openKey = nav.dataset.openSidebarSection || activeKey;
    groups.forEach((group) => setGroupOpen(group, group.key === openKey));
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
  nav.dataset.openSidebarSection = willOpen ? key : '';
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
