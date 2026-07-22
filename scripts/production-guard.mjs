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
const packagesPage = read('app/admin/packages/page.tsx');
const fleetPage = read('app/admin/vehicles/page.tsx');
const bookingStatusPage = read('app/(public)/booking-status/page.tsx');
const portalAccess = read('components/edrive/portal-access.tsx');
const publicShell = read('components/edrive/public-shell.tsx');
const layout = read('app/layout.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const migration = read('supabase/public-request-hardening.sql');
const packageMigration = read('supabase/package-catalog-hardening.sql');
const fleetEnumMigration = read('supabase/fleet-status-enum-values.sql');
const fleetLegacyPreflight = read('supabase/fleet-legacy-data-preflight.sql');
const fleetMigration = read('supabase/fleet-asset-hardening.sql');
const fleetEditMigration = read('supabase/fleet-edit-partial-and-image-upload.sql');

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

assert(packagesPage.includes("rpc('save_package_catalog_entry'"), 'Package writes must prefer the secured catalog RPC.');
assert(packagesPage.includes("rpc('delete_package_if_unused'"), 'Package deletion must use the booking-aware delete RPC.');
assert(packagesPage.includes('packageSpecKey'), 'Package duplicate specifications must be detected in the admin UI.');
assert(packagesPage.includes('Duplicate spec'), 'Existing duplicate specifications must be clearly identified.');
assert(packagesPage.includes('isSuperAdmin'), 'Permanent package deletion must remain restricted to Super Admin.');
assert(packageMigration.includes('packages_prevent_duplicate_trigger'), 'Database duplicate prevention trigger is required.');
assert(packageMigration.includes('delete_package_if_unused'), 'Database booking-aware package deletion is required.');
assert(packageMigration.includes('package_audit_logs'), 'Package catalog changes must be audited.');

assert(fleetPage.includes('Registration number is required for every new fleet unit.'), 'New fleet units must require a registration number in the admin UI.');
assert(fleetPage.includes("rpc('save_fleet_asset_entry'"), 'Fleet master writes must prefer the secured fleet RPC.');
assert(fleetPage.includes("rpc('set_fleet_asset_status'"), 'Fleet lifecycle updates must use the secured status RPC.');
assert(fleetPage.includes("rpc('delete_fleet_asset_if_unused'"), 'Fleet deletion must use the operational-history-aware RPC.');
assert(fleetPage.includes("role === 'maintenance_staff'"), 'Maintenance Staff must have limited lifecycle controls.');
assert(fleetPage.includes('isSuperAdmin'), 'Fleet master edit and delete controls must remain restricted to Super Admin.');
assert(fleetPage.includes('complianceIssues'), 'Fleet records must expose registration, insurance, tracker, and profile alerts.');
assert(fleetPage.includes('Missing Registration'), 'Fleet filters must surface missing registration records.');
assert(fleetPage.includes("const fleetImageBucket = 'fleet-images'"), 'Fleet image uploads must use the dedicated storage bucket.');
assert(fleetPage.includes('Upload fleet image'), 'Fleet edit form must expose image upload.');
assert(fleetPage.includes('!editingId && (!regNo'), 'Existing incomplete fleet records must support partial edits.');
assert(fleetPage.includes('function FleetDrawer'), 'Fleet details must open in the compact right-side drawer.');
assert(fleetPage.includes('MoreHorizontal'), 'Secondary fleet actions must remain inside the compact actions menu.');
assert(fleetPage.includes('min-w-0 table-fixed'), 'Fleet inventory table must use the compact fixed layout.');
assert(!fleetPage.includes('min-w-[1460px]'), 'Fleet inventory must not force the legacy horizontal desktop table width.');
assert(fleetPage.includes('Registration required'), 'Fleet table must use one concise registration compliance summary.');
assert(fleetEnumMigration.includes("add value if not exists 'out_of_service'"), 'Fleet lifecycle enum prerequisite must include Out of Service.');
assert(fleetEnumMigration.includes("add value if not exists 'retired'"), 'Fleet lifecycle enum prerequisite must include Retired.');
assert(fleetLegacyPreflight.includes('drop trigger if exists vehicles_validate_identifiers_trigger'), 'Fleet legacy cleanup must temporarily remove the strict validation trigger.');
assert(fleetLegacyPreflight.includes('invalid legacy tracker IMEI removed'), 'Fleet legacy cleanup must quarantine invalid tracker identifiers.');
assert(fleetMigration.includes('vehicles_reg_no_unique_ci'), 'Database-level unique registration enforcement is required.');
assert(fleetMigration.includes('validate_fleet_asset_identifiers'), 'Fleet identifier validation trigger is required.');
assert(fleetMigration.includes('delete_fleet_asset_if_unused'), 'Fleet deletion must be protected by operational history.');
assert(fleetMigration.includes('fleet_asset_audit_logs'), 'Fleet master changes must be audited.');
assert(fleetMigration.includes('fleet_maintenance_logs'), 'Fleet maintenance lifecycle changes must be logged.');
assert(fleetEditMigration.includes('v_type::public.vehicle_type'), 'Fleet save RPC must cast vehicle_type text to its enum.');
assert(fleetEditMigration.includes("'fleet-images'"), 'Fleet image storage bucket migration is required.');
assert(fleetEditMigration.includes("tg_op = 'INSERT' and length(v_reg) < 3"), 'New fleet units must still require registration while legacy edits remain possible.');

if (failures.length) {
  console.error('\nProduction guard failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Production guard passed.');
