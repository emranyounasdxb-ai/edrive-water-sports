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
const portalAccess = read('components/edrive/portal-access.tsx');
const publicShell = read('components/edrive/public-shell.tsx');
const layout = read('app/layout.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const migration = read('supabase/public-request-hardening.sql');

assert(!packageShowcase.includes('b2b_price'), 'Public package showcase must not request B2B pricing.');
assert(!bookingWizard.includes('b2b_price'), 'Public booking wizard must not request B2B pricing.');
assert(!bookingWizard.includes('localStorage'), 'Public booking wizard must not persist customer PII in localStorage.');
assert(bookingSuccess.includes("rpc('create_public_booking'"), 'Booking success must use the secured booking RPC.');
assert(bookingSuccess.includes('/my-booking?ref='), 'Booking status links must use the canonical My Booking route.');
assert(contactForm.includes("rpc('submit_public_inquiry'"), 'Contact form must submit through the secured inquiry RPC.');
assert(portalAccess.includes("if (role === 'admin') return false;"), 'Admin role must remain read-only in the frontend.');
assert(!layout.includes('maximumScale'), 'The global viewport must allow user zoom.');
assert(manifest.start_url === '/', 'The public PWA must open the public homepage.');
assert(!publicShell.includes('https://instagram.com'), 'Placeholder Instagram links are not allowed.');
assert(!publicShell.includes('frfooter'), 'Public footer markup is malformed.');
assert(migration.includes('revoke select on table public.packages from anon'), 'Anonymous direct package table access must be revoked.');
assert(migration.includes('revoke insert on table public.booking_requests from anon'), 'Anonymous direct booking inserts must be revoked after RPC migration.');

if (failures.length) {
  console.error('\nProduction guard failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Production guard passed.');
