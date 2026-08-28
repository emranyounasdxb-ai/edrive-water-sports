type MetaEvent = 'PageView' | 'CompleteRegistration';
type EventSink = (event: MetaEvent) => void;

const marketingPaths = new Set(['/', '/rentals', '/fleet', '/jet-ski-rentals', '/jet-car-rentals', '/membership', '/contact', '/booking', '/privacy-policy', '/terms-and-conditions', '/refund-replacement-policy']);
const bookingParameters = new Set(['package', 'category', 'capacity', 'duration']);
const marketingParameters = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']);
const completedBookings = new Set<string>();
let sink: EventSink | undefined;
let pendingCompletions = 0;

export function isMetaEligibleUrl(url: URL) {
  if (url.hash) return false;
  const pathname = url.pathname.replace(/^\/(ar|ru)(?=\/|$)/, '').replace(/\/$/, '') || '/';
  if (!marketingPaths.has(pathname)) return false;
  const allowedParameters = pathname === '/booking' ? bookingParameters : marketingParameters;
  return Array.from(url.searchParams.keys()).every((key) => allowedParameters.has(key));
}

function eligibleNow() {
  return typeof window !== 'undefined' && isMetaEligibleUrl(new URL(window.location.href));
}

export function connectMetaEvents(nextSink: EventSink) {
  sink = nextSink;
  if (pendingCompletions && eligibleNow()) {
    const count = pendingCompletions;
    pendingCompletions = 0;
    for (let index = 0; index < count; index += 1) sink('CompleteRegistration');
  }
  return () => { if (sink === nextSink) sink = undefined; };
}

export function discardPendingMetaEvents() {
  pendingCompletions = 0;
}

// The reference stays local: it is never included in the event or frame message.
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
    if (sink) sink('CompleteRegistration');
    else pendingCompletions += 1;
  } catch { /* Analytics must never affect booking success. */ }
}
