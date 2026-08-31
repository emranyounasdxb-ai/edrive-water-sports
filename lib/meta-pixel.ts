export type MetaEvent = 'PageView' | 'ViewContent' | 'Contact' | 'Lead' | 'Schedule' | 'InitiateCheckout' | 'CompleteRegistration';
type EventSink = (event: MetaEvent) => void;

const marketingPaths = new Set(['/', '/rentals', '/fleet', '/jet-ski-rentals', '/jet-car-rentals', '/membership', '/contact', '/booking', '/privacy-policy', '/terms-and-conditions', '/refund-replacement-policy']);
const contentPaths = new Set(['/rentals', '/jet-ski-rentals', '/jet-car-rentals', '/membership']);
const bookingParameters = new Set(['package', 'category', 'capacity', 'duration']);
const marketingParameters = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']);
const completedBookings = new Set<string>();
const completedSchedules = new Set<string>();
let sink: EventSink | undefined;
let pendingEvents: MetaEvent[] = [];
let lastPageView = '';
let lastContentView = '';
let lastCheckout = '';

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

export function trackMetaInitiateCheckout(url: URL) {
  const key = viewKey(url);
  if (!isMetaEligibleUrl(url) || normalizedPathname(url) !== '/booking' || lastCheckout === key) return;
  lastCheckout = key;
  trackMetaEvent('InitiateCheckout');
}

// The selected date/time stay local and are used only to suppress repeat events.
export function trackBookingSchedule(localScheduleKey: string) {
  try {
    if (!eligibleNow() || !localScheduleKey) return;
    const pathname = window.location.pathname.replace(/\/$/, '');
    if (!/^\/(?:ar\/|ru\/)?booking$/.test(pathname)) return;
    const key = `edrive:meta:schedule:${localScheduleKey}`;
    if (completedSchedules.has(key)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
    completedSchedules.add(key);
    try { sessionStorage.setItem(key, '1'); } catch { /* In-memory protection remains. */ }
    trackMetaEvent('Schedule');
  } catch { /* Analytics must never affect booking progress. */ }
}

// The reference stays local: it is never included in the Meta event.
export function trackBookingCompletion(localBookingKey: string) {
  try {
    if (!eligibleNow() || !localBookingKey) return;
    const pathname = window.location.pathname.replace(/\/$/, '');
    if (!/^\/(?:ar\/|ru\/)?booking$/.test(pathname)) return;
    const key = `edrive:meta:completed:${localBookingKey}`;
    if (completedBookings.has(key)) return;
    try { if (sessionStorage.getItem(key)) return; } catch { /* Storage may be disabled. */ }
    completedBookings.add(key);
    try { sessionStorage.setItem(key, '1'); } catch { /* In-memory protection remains. */ }
    trackMetaEvent('CompleteRegistration');
  } catch { /* Analytics must never affect booking success. */ }
}
