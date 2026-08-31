export type MetaEvent = 'PageView' | 'ViewContent' | 'Contact' | 'Lead' | 'InitiateCheckout' | 'CompleteRegistration';
export type MetaCustomEvent = 'BookingDateSelected';
type TrackedMetaEvent = MetaEvent | MetaCustomEvent;
type EventSink = (event: TrackedMetaEvent) => void;

const marketingPaths = new Set(['/', '/rentals', '/fleet', '/jet-ski-rentals', '/jet-car-rentals', '/membership', '/contact', '/booking', '/privacy-policy', '/terms-and-conditions', '/refund-replacement-policy']);
const contentPaths = new Set(['/rentals', '/jet-ski-rentals', '/jet-car-rentals', '/membership']);
const bookingParameters = new Set(['package', 'category', 'capacity', 'duration']);
const marketingParameters = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']);
const completedBookingLeads = new Set<string>();
let sink: EventSink | undefined;
let pendingEvents: TrackedMetaEvent[] = [];
let lastPageView = '';
let lastContentView = '';
let bookingInteractionTracked = false;

function normalizedPathname(url: URL) {
  return url.pathname.replace(/^\/(ar|ru)(?=\/|$)/, '').replace(/\/$/, '') || '/';
}

function viewKey(url: URL) {
  return `${url.pathname}${url.search}`;
}

export function isMetaEligibleUrl(url: URL) {
  if (url.hash) return false;
  const pathname = normalizedPathname(url);
  if (!marketingPaths.has(pathname)) return false;
  const allowedParameters = pathname === '/booking'
    ? new Set([...bookingParameters, ...marketingParameters])
    : marketingParameters;
  return Array.from(url.searchParams.keys()).every((key) => allowedParameters.has(key));
}

function eligibleNow() {
  return typeof window !== 'undefined' && isMetaEligibleUrl(new URL(window.location.href));
}

export function connectMetaEvents(nextSink: EventSink) {
  sink = nextSink;
  if (pendingEvents.length && eligibleNow()) {
    const queued = pendingEvents;
    pendingEvents = [];
    queued.forEach((event) => sink?.(event));
  }
  return () => { if (sink === nextSink) sink = undefined; };
}

export function discardPendingMetaEvents() {
  pendingEvents = [];
}

export function trackMetaEvent(event: MetaEvent) {
  try {
    if (!eligibleNow()) return;
    if (sink) sink(event);
    else pendingEvents.push(event);
  } catch { /* Analytics must never affect public actions. */ }
}

export function trackMetaCustomEvent(event: MetaCustomEvent) {
  try {
    if (!eligibleNow()) return;
    if (sink) sink(event);
    else pendingEvents.push(event);
  } catch { /* Analytics must never affect public actions. */ }
}

export function trackMetaPageView(url: URL) {
  const key = viewKey(url);
  if (!isMetaEligibleUrl(url) || lastPageView === key) return;
  lastPageView = key;
  trackMetaEvent('PageView');
}

export function trackMetaContentView(url: URL) {
  const key = viewKey(url);
  if (!isMetaEligibleUrl(url) || !contentPaths.has(normalizedPathname(url)) || lastContentView === key) return;
  lastContentView = key;
  trackMetaEvent('ViewContent');
}

export function trackBookingInteraction() {
  try {
    if (!eligibleNow() || bookingInteractionTracked) return;
    bookingInteractionTracked = true;
    trackMetaEvent('Contact');
  } catch { /* Analytics must never affect booking interaction. */ }
}

// The reference stays local: it is never included in the Meta event.
export function trackBookingLead(localBookingKey: string) {
  try {
    if (!eligibleNow() || !localBookingKey) return;
    const pathname = window.location.pathname.replace(/\/$/, '');
    if (!/^\/(?:ar\/|ru\/)?booking$/.test(pathname)) return;
    const key = `edrive:meta:lead:${localBookingKey}`;
    if (completedBookingLeads.has(key)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
    completedBookingLeads.add(key);
    try { sessionStorage.setItem(key, '1'); } catch { /* In-memory protection remains. */ }
    trackMetaEvent('Lead');
  } catch { /* Analytics must never affect booking success. */ }
}
