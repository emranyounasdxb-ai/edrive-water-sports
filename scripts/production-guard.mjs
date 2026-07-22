import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packageShowcase = read('components/edrive/live-package-showcase.tsx');
const bookingWizard = read('components/edrive/booking/booking-wizard.tsx');
const bookingSuccess = read('components/edrive/booking/booking-success.tsx');
const contactForm = read('components/edrive/contact-form.tsx');
const bookingTracker = read('components/edrive/public-booking-tracker.tsx');
const inquiriesPage = read('app/admin/inquiries/page.tsx');
const bookingStatusPage = read('app/(public)/booking-status/page.tsx');
const portalAccess = read('components/edrive/portal-access.tsx');
const publicShell = read('components/edrive/public-shell.tsx');
const layout = read('app/layout.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const migration = read('supabase/public-request-hardening.sql');

assert(!packageShowcase.includes('b2b_price'), 'Public package showcase must not request B2B pricing.');
assert(!bookingWizard.includes('b2b_price'), 'Public booking wizard must not request B2B pricing.');
assert(packageShowcase.includes('package=${encodeURIComponent(item.id)}'), 'Package cards must preserve the exact package ID.');
assert(bookingWizard.includes("params.get('duration')"), 'Booking wizard must preserve the selected duration.');
assert(!bookingWizard.includes('localStorage'), 'Public booking wizard must not persist customer PII in localStorage.');
assert(bookingWizard.includes('isSelectableDubaiBookingTime'), 'Public booking times must be validated in Dubai time.');
assert(bookingSuccess.includes("rpc('create_public_booking'"), 'Booking success must use the secured booking RPC.');
assert(bookingSuccess.includes('/my-booking?ref='), 'Booking status links must use the canonical My Booking route.');
assert(contactForm.includes("rpc('submit_public_inquiry'"), 'Contact form must submit through the secured inquiry RPC.');
assert(contactForm.includes('saveLegacyInquiry'), 'Contact form must preserve inquiries before the RPC migration is applied.');
assert(bookingTracker.includes("params.get('ref')"), 'My Booking must prefill a supplied booking reference.');
assert(inquiriesPage.includes("from('contact_inquiries')"), 'Admin inquiry operations page must read secured inquiry records.');
assert(bookingStatusPage.includes('index: false'), 'Legacy booking status route must be noindex.');
assert(portalAccess.includes("if (role === 'admin') return false;"), 'Admin role must remain read-only in the frontend.');
assert(!layout.includes('maximumScale'), 'The global viewport must allow user zoom.');
assert(manifest.start_url === '/', 'The public PWA must open the public homepage.');
assert(!publicShell.includes('https://instagram.com'), 'Placeholder Instagram links are not allowed.');
assert(!publicShell.includes('frfooter'), 'Public footer markup is malformed.');
assert(migration.includes('revoke select on table public.packages from anon'), 'Anonymous direct package table access must be revoked.');
assert(migration.includes('revoke insert on table public.booking_requests from anon'), 'Anonymous direct booking inserts must be revoked after RPC migration.');
assert(migration.includes('public_request_rate_limited'), 'Public booking and lookup throttling must be included in the migration.');

if (failures.length) {
  console.error('\nProduction guard failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Production guard passed.');
