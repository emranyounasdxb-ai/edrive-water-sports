'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CalendarCheck, Instagram, Loader2, LockKeyhole, Mail, MapPin, Menu, Phone, Search, TicketCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { bookingRequestsTable } from '@/lib/booking-records';
import { publicNavItems } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const menuPillClass = 'border border-white/75 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.025),0_5px_14px_rgba(8,37,50,0.045)] hover:border-primary/15 hover:bg-primary-50/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.025),0_8px_18px_rgba(8,37,50,0.07)]';
const activeMenuClass = 'border-primary/18 bg-primary-100 text-primary-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.03),0_9px_20px_rgba(8,37,50,0.09)]';

const policyLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/refund-replacement-policy', label: 'Refund / Replacement Policy' }
];

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

function updateLinkText(anchor: HTMLAnchorElement, text: string) {
  const svg = anchor.querySelector('svg');
  anchor.textContent = text;
  if (svg) anchor.appendChild(svg);
}

function buildExperienceInquiryMessage(title: string) {
  return [
    `Hello eDrive, I am interested in this water sports experience: ${title}.`,
    '',
    'Please suggest the best available package, price, duration, and timing for this experience.',
    '',
    'My preferred date:',
    'Number of guests:',
    'Preferred location:'
  ].join('\n');
}

function normalizeBookingButtonsAndMessages() {
  const bookingLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/booking"], a[href*="/booking?"]'));

  bookingLinks.forEach((anchor) => {
    const currentText = anchor.textContent?.trim().toLowerCase() || '';
    anchor.href = '/booking';
    if (currentText.includes('book') || currentText.includes('open booking')) {
      updateLinkText(anchor, 'Book Now');
    }
  });

  const staticBookingLinks = bookingLinks.filter((anchor) => anchor.closest('article'));
  staticBookingLinks.forEach((anchor) => {
    const card = anchor.closest('article');
    const title = card?.querySelector('h3')?.textContent?.trim() || 'eDrive water sports experience';
    const whatsappAnchor = card?.querySelector<HTMLAnchorElement>('a[href*="wa.me"]');
    if (!whatsappAnchor) return;

    const url = new URL(whatsappAnchor.href);
    url.searchParams.set('text', buildExperienceInquiryMessage(title));
    whatsappAnchor.href = url.toString();
    updateLinkText(whatsappAnchor, 'Ask on WhatsApp');
  });
}

function moveLivePackagesNearTop(pathname: string) {
  if (pathname !== '/' && pathname !== '/rentals') return;
  const main = document.querySelector('main');
  const livePackages = document.getElementById('live-packages');
  const firstSection = main?.querySelector(':scope > section');
  if (!main || !livePackages || !firstSection) return;
  if (firstSection.nextElementSibling === livePackages) return;
  main.insertBefore(livePackages, firstSection.nextElementSibling);
}

function normalizeExperienceHeadings(pathname: string) {
  if (pathname !== '/' && pathname !== '/rentals') return;

  const headingMap: Record<string, string> = {
    'Popular Packages': 'Popular Experience Ideas',
    'Most Popular Packages': 'Popular Ride Ideas',
    'Choose a Package Category': 'Explore Experience Categories',
    'Jet Ski Rental Packages in Dubai': 'Jet Ski Experience Ideas in Dubai',
    'Jet Car Rental Packages in Dubai': 'Jet Car Experience Ideas in Dubai',
    'Jet Ski and Jet Car Packages Dubai': 'Jet Ski and Jet Car Experience Ideas',
    'Family Water Sports Packages': 'Family Water Sports Experience Ideas',
    'VIP Water Sports Experiences': 'VIP Water Sports Experience Ideas',
    'Recommended Rental Packages': 'Recommended Experience Ideas',
    'Packages customers should not miss': 'Recommended Experience Ideas'
  };

  document.querySelectorAll('h2').forEach((heading) => {
    const current = heading.textContent?.trim() || '';
    if (headingMap[current]) heading.textContent = headingMap[current];
  });
}

function findHeading(text: string) {
  return Array.from(document.querySelectorAll<HTMLHeadingElement>('h2')).find((heading) => heading.textContent?.trim() === text) || null;
}

function alignFleetGrid(headingText: string) {
  const heading = findHeading(headingText);
  const section = heading?.closest('section');
  const grid = section?.querySelector<HTMLElement>('.mt-7.grid');
  if (!section || !grid) return null;

  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  grid.style.alignItems = 'stretch';
  grid.style.maxWidth = '100%';
  grid.querySelectorAll<HTMLElement>('article').forEach((card) => {
    card.style.height = '100%';
  });

  return grid;
}

function addFleetCard(grid: HTMLElement) {
  if (grid.querySelector('[data-fleet-added="photo-jet-ski"]')) return;

  const message = encodeURIComponent(buildExperienceInquiryMessage('Photo-Friendly Jet Ski'));
  const card = document.createElement('article');
  card.dataset.fleetAdded = 'photo-jet-ski';
  card.className = 'premium-surface premium-card-hover h-full overflow-hidden rounded-[1.75rem] p-3';
  card.innerHTML = `
    <div class="relative aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-primary-50" style="background-image:url('/images/edrive/packages/jet-ski/jet-ski-package-41.webp');background-size:cover;background-position:center;"></div>
    <div class="p-4">
      <span class="flex size-7 items-center justify-center rounded-xl bg-primary-50 text-lg font-bold text-primary">≋</span>
      <h3 class="mt-4 font-heading text-2xl font-semibold text-foreground">Photo-Friendly Jet Ski</h3>
      <dl class="mt-4 grid gap-3 rounded-[1.2rem] bg-primary-50 p-4 text-sm">
        <div><dt class="font-semibold text-foreground">Capacity</dt><dd class="mt-1 text-muted-foreground">1-2 guests</dd></div>
        <div><dt class="font-semibold text-foreground">Best for</dt><dd class="mt-1 text-muted-foreground">Skyline photos, beginner-friendly routes, and golden-hour Dubai water sports content.</dd></div>
      </dl>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row">
        <a href="/booking" class="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary-900 px-4 text-xs font-bold text-white shadow-[0_8px_18px_rgba(8,37,50,0.18)] transition hover:bg-primary-800">Book Now</a>
        <a href="${whatsappUrl}?text=${message}" target="_blank" rel="noopener noreferrer" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-500 px-4 text-xs font-bold text-white transition hover:bg-emerald-600">Ask on WhatsApp</a>
      </div>
    </div>
  `;
  grid.appendChild(card);
}

function refineFleetPage(pathname: string) {
  if (pathname !== '/fleet') return;

  document.documentElement.dataset.publicPage = 'fleet';
  const jetSkiGrid = alignFleetGrid('Jet Ski Fleet Cards');
  alignFleetGrid('Jet Car Fleet Cards');
  if (jetSkiGrid) addFleetCard(jetSkiGrid);

  ['Fleet Features', 'Safety & Maintenance', 'Recommended Rental Packages'].forEach((title) => {
    const heading = findHeading(title);
    const section = heading?.closest<HTMLElement>('section');
    if (!section) return;
    section.style.paddingTop = '2.75rem';
    section.style.paddingBottom = '2.75rem';
  });
}

function replaceTextEverywhere(from: string, to: string) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    if (node.nodeValue?.includes(from)) node.nodeValue = node.nodeValue.replace(from, to);
  });
}

function refineHomePage(pathname: string) {
  if (pathname !== '/') return;

  replaceTextEverywhere('50 Static packages', '50 Experience ideas');
  replaceTextEverywhere('Static packages', 'Experience ideas');
  replaceTextEverywhere('Choose, book, confirm, ride.', '');

  const processHeading = findHeading('From package card to confirmed water time');
  const section = processHeading?.closest('section');
  const image = section?.querySelector<HTMLImageElement>('img');
  if (image) {
    image.src = '/images/edrive/packages/jet-car/jet-car-package-19.webp';
    image.removeAttribute('srcset');
    image.style.objectPosition = 'center';
  }

  section?.querySelectorAll<HTMLElement>('[class*="gradient"], [class*="absolute"]').forEach((element) => {
    const text = element.textContent?.trim() || '';
    if (!text || text.includes('Choose') || text.includes('book') || text.includes('confirm')) {
      element.style.display = 'none';
    }
  });
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReference, setStatusReference] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 32);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  useEffect(() => {
    const applyPublicPageRules = () => {
      moveLivePackagesNearTop(currentPath);
      normalizeBookingButtonsAndMessages();
      normalizeExperienceHeadings(currentPath);
      refineFleetPage(currentPath);
      refineHomePage(currentPath);
    };

    applyPublicPageRules();
    const timeout = window.setTimeout(applyPublicPageRules, 650);
    return () => window.clearTimeout(timeout);
  }, [currentPath]);

  async function handleStatusSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = statusReference.trim().toUpperCase();
    if (!code) {
      setStatusError('Please enter your booking reference number.');
      return;
    }

    setStatusLoading(true);
    setStatusError('');
    const { data, error } = await supabase.from(bookingRequestsTable).select('booking_code').eq('booking_code', code).maybeSingle();
    setStatusLoading(false);

    if (error || !data) {
      setStatusError('Booking number not found. Please check and enter it again.');
      return;
    }

    window.location.href = `/booking-status?ref=${encodeURIComponent(code)}`;
  }

  function openStatusModal() {
    setOpen(false);
    setStatusModalOpen(true);
    setStatusError('');
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-[90] py-3">
        <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              'flex min-h-[50px] items-center justify-between gap-3 rounded-full px-4 ring-1 transition-all duration-300 ease-out',
              'shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_22px_rgba(8,37,50,0.025),0_18px_42px_rgba(8,37,50,0.18),0_3px_8px_rgba(255,255,255,0.65)]',
              scrolled
                ? 'border border-white/90 bg-white/90 ring-black/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-10px_22px_rgba(8,37,50,0.025),0_14px_32px_rgba(8,37,50,0.12)]'
                : 'border border-white bg-white ring-black/5'
            )}
          >
            <Link href="/" aria-label="eDrive Water Sports home" className="flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-9 [&_img]:w-auto" />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <div className={cn('flex items-center gap-1.5 rounded-full p-1 transition-all duration-300', scrolled ? 'bg-white/82 shadow-[inset_0_1px_5px_rgba(8,37,50,0.04)] backdrop-blur-sm' : 'bg-white shadow-[inset_0_1px_4px_rgba(8,37,50,0.05)]')}>
                {publicNavItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-[11px] font-bold leading-none text-slate-700 transition-all duration-200 xl:px-4 xl:text-xs',
                        menuPillClass,
                        active && activeMenuClass
                      )}
                    >
                      <span className="relative -top-px block leading-none">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button type="button" onClick={openStatusModal} className={cn('hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold leading-none text-primary-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_14px_rgba(8,37,50,0.055)] transition hover:bg-primary-100 hover:text-primary lg:inline-flex', scrolled ? 'bg-primary-50/90 backdrop-blur-sm' : 'bg-primary-50')}>
                <TicketCheck className="size-3.5" aria-hidden="true" />
                Check Status
              </button>
              <Button asChild variant="outline" size="sm" className={cn('h-8 rounded-full px-3 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_6px_15px_rgba(8,37,50,0.075)] hover:bg-primary-50', scrolled ? 'border-white/90 bg-white/90 backdrop-blur-sm' : 'border-border bg-white')}>
                <Link href="/admin"><LockKeyhole data-icon aria-hidden="true" />Admin Portal</Link>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-full bg-primary-900 px-3 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_9px_20px_rgba(8,37,50,0.2)] hover:bg-primary-800">
                <Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Now</Link>
              </Button>
            </div>

            <Button variant="outline" size="icon" className={cn('size-9 shrink-0 rounded-full lg:hidden', scrolled ? 'bg-white/90 backdrop-blur-sm' : 'bg-white')} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
              {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
            </Button>
          </div>
        </nav>

        {open ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
            <div className="premium-surface flex flex-col gap-1 rounded-[1.5rem] p-3 shadow-[0_18px_45px_rgba(8,37,50,0.16)]">
              {publicNavItems.map((item) => {
                const active = currentPath === normalizePath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('inline-flex h-10 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-white hover:text-foreground', active && activeMenuClass)}
                  >
                    <span className="relative -top-px block leading-none">{item.label}</span>
                  </Link>
                );
              })}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Button type="button" variant="outline" className="rounded-full" onClick={openStatusModal}>
                  <TicketCheck data-icon aria-hidden="true" />Check Status
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/admin" onClick={() => setOpen(false)}><LockKeyhole data-icon aria-hidden="true" />Admin Portal</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/booking" onClick={() => setOpen(false)}><CalendarCheck data-icon aria-hidden="true" />Book Now</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {statusModalOpen ? (
        <BookingStatusModal
          reference={statusReference}
          error={statusError}
          loading={statusLoading}
          onReferenceChange={setStatusReference}
          onClose={() => setStatusModalOpen(false)}
          onSubmit={handleStatusSearch}
        />
      ) : null}

      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

function BookingStatusModal({ reference, error, loading, onReferenceChange, onClose, onSubmit }: { reference: string; error: string; loading: boolean; onReferenceChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-primary-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_28px_85px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-primary-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Status</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Check your booking</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary" aria-label="Close status checker">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Booking reference number
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <input value={reference} onChange={(event) => onReferenceChange(event.target.value.toUpperCase())} placeholder="ED-20260707-007" className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm font-bold uppercase text-foreground outline-none transition focus:border-primary" />
            </span>
          </label>
          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{error}</p> : <p className="mt-3 text-xs leading-5 text-muted-foreground">Enter the reference number shown on your booking confirmation page.</p>}
          <Button type="submit" disabled={loading} className="mt-5 w-full rounded-full">
            {loading ? <Loader2 data-icon className="animate-spin" aria-hidden="true" /> : <Search data-icon aria-hidden="true" />}
            {loading ? 'Checking...' : 'Search Booking'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_0.7fr_0.8fr_1fr]">
        <div className="flex flex-col gap-5">
          <BrandMark />
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Private jet ski and jet car experiences from {companyInfo.locationName}, prepared with a premium fleet and attentive local support.
          </p>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-primary-50" aria-label="Instagram">
            <Instagram data-icon aria-hidden="true" />
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Explore</h3>
          {publicNavItems.slice(1, 6).map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">{item.label}</Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Packages</h3>
          <Link href="/rentals#live-packages" className="text-sm text-muted-foreground transition hover:text-primary">Live Bookable Packages</Link>
          <Link href="/rentals#jet-ski-packages" className="text-sm text-muted-foreground transition hover:text-primary">Jet Ski Experience Ideas</Link>
          <Link href="/rentals#jet-car-packages" className="text-sm text-muted-foreground transition hover:text-primary">Jet Car Experience Ideas</Link>
          <Link href="/rentals#combo-packages" className="text-sm text-muted-foreground transition hover:text-primary">Combo Experience Ideas</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <a href={`tel:${companyInfo.landlineHref}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Phone data-icon aria-hidden="true" />{companyInfo.landlineDisplay}</a>
          <a href={`mailto:${companyInfo.bookingEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Mail data-icon aria-hidden="true" />{companyInfo.bookingEmail}</a>
          <p className="flex items-center gap-3 text-sm text-muted-foreground"><MapPin data-icon aria-hidden="true" />{companyInfo.locationName}</p>
        </div>
      </div>
      <div className="waterline border-t border-border py-5">
        <div className="container-x flex flex-col justify-between gap-4 text-xs text-muted-foreground lg:flex-row lg:items-center">
          <span>(c) 2026 eDrive Water Sports. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {policyLinks.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-3">
                {index > 0 ? <span className="text-border">|</span> : null}
                <Link href={item.href} className="font-semibold transition hover:text-primary">{item.label}</Link>
              </span>
            ))}
          </div>
          <Link href="/rentals#live-packages" className="inline-flex items-center gap-2 font-semibold text-primary">Explore live packages <ArrowRight data-icon aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
