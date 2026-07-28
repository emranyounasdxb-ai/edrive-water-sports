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
const publicShellStyles = read('components/edrive/public-shell.module.css');
const publicPages = read('components/edrive/public-pages.tsx');
const heroVideoMedia = read('components/edrive/hero-video-media.tsx');
const publicVideoHero = read('components/edrive/public-video-hero.tsx');
const rentalsPage = read('app/(public)/rentals/page.tsx');
const jetSkiRentalsPage = read('app/(public)/jet-ski-rentals/page.tsx');
const jetCarRentalsPage = read('app/(public)/jet-car-rentals/page.tsx');
const heroVideoFile = path.join(root, 'public/videos/edrive-hero-loop.mp4');
const heroVideoExists = fs.existsSync(heroVideoFile);
const heroCtaStyles = read('app/hero-cta.css');
const homeResponsiveStyles = read('app/home-responsive.css');
const contactPolishStyles = read('app/contact-page-polish.css');
const layout = read('app/layout.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const migration = read('supabase/public-request-hardening.sql');
const packageMigration = read('supabase/package-catalog-hardening.sql');
const fleetEnumMigration = read('supabase/fleet-status-enum-values.sql');
const fleetLegacyPreflight = read('supabase/fleet-legacy-data-preflight.sql');
const fleetMigration = read('supabase/fleet-asset-hardening.sql');
const fleetEditMigration = read('supabase/fleet-edit-partial-and-image-upload.sql');
const fleetEditFinalMigration = read('supabase/fleet-edit-final-enum-fix.sql');
const b2bMigration = read('supabase/02-b2b-wallet-refunds-reporting.sql');
const maintenanceLockdownMigration = read('supabase/02a-super-admin-maintenance-lockdown.sql');
const b2bFinanceService = read('services/b2b-finance.ts');
const b2bFinancePage = read('components/edrive/admin-b2b-finance-page.tsx');
const provisioningFunction = read('supabase/functions/provision-portal-user/index.ts');
const provisioningService = read('services/portal-user-provisioning.ts');
const teamAccessPage = read('components/edrive/team-access-role-page.tsx');
const b2bAgentsPage = read('components/edrive/admin-b2b-agents-polished-page.tsx');
const nextConfig = read('next.config.mjs');
const deployWorkflow = read('.github/workflows/static-export.yml');
const myProfilePage = read('components/edrive/my-profile-page.tsx');
const myProfileAccessMigration = read('supabase/my-profile-access.sql');
const adminShell = read('components/edrive/admin-shell.tsx');
const dashboardRoute = read('components/edrive/admin-dashboard-route-page.tsx');
const financeNav = read('lib/mock-data.ts');
const financeBookings = read('components/edrive/finance-bookings-page.tsx');
const financeReports = read('components/edrive/finance-reports-page.tsx');
const financeExport = read('lib/finance-report-export.ts');
const financeService = read('services/finance-reporting.ts');
const financeMigration = read('supabase/04-finance-portal-rbac-reporting.sql');
const financeAudit = read('components/edrive/admin-audit-log-page.tsx');
const adminPaymentsControlCenter = read('components/edrive/admin-payments-control-center.tsx');
const uiLabels = read('lib/ui-labels.ts');
const compactPresentation = read('components/edrive/shared/compact-presentation.tsx');
const overflowText = read('components/edrive/shared/overflow-text.tsx');
const tablePrimitive = read('components/ui/table.tsx');

function sourceFiles(directory) {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(relative) : [relative];
  });
}

const privilegedBrowserSources = ['app', 'components', 'lib', 'services'].flatMap(sourceFiles);
const privilegedBrowserText = privilegedBrowserSources.map((file) => read(file)).join('\n');
const createUserOutsideFunctions = [...privilegedBrowserSources, ...sourceFiles('supabase').filter((file) => !file.startsWith(path.join('supabase', 'functions')))]
  .filter((file) => read(file).includes('auth.admin.createUser'));

assert(!packageShowcase.includes('b2b_price'), 'Public package showcase must not request B2B pricing.');
assert(createUserOutsideFunctions.length === 0, 'Privileged Auth user creation must exist only under supabase/functions/.');
assert(!privilegedBrowserText.includes('SUPABASE_SERVICE_ROLE_KEY'), 'The Supabase service-role key must never appear in browser source code.');
assert(provisioningFunction.includes('auth.admin.createUser'), 'Portal provisioning must create Auth users inside the Edge Function.');
assert(provisioningFunction.includes(".eq('auth_user_id', userData.user.id)") && provisioningFunction.includes("!== 'active'") && provisioningFunction.includes("!== 'super_admin'"), 'The provisioning Edge Function must require exactly one active Super Admin database profile.');
assert(provisioningFunction.includes('auth.admin.deleteUser(authUserId)'), 'The provisioning Edge Function must roll back newly created Auth users after profile failure.');
assert(!provisioningFunction.includes("from('admin_users').insert"), 'Internal provisioning must finalize the trigger-created admin_users profile instead of inserting a duplicate.');
assert(provisioningFunction.includes("from('admin_users').update") && provisioningFunction.includes(".eq('auth_user_id', authUserId)"), 'Internal provisioning must finalize the trigger-created profile by auth_user_id.');
const temporaryProfileCleanup = provisioningFunction.indexOf("from('admin_users').delete()");
const b2bProfileRpc = provisioningFunction.indexOf("callerClient.rpc('manage_b2b_agent_profile'");
assert(temporaryProfileCleanup >= 0 && b2bProfileRpc > temporaryProfileCleanup, 'B2B provisioning must remove the exact temporary trigger-created admin_users profile before calling the secured profile RPC.');
assert(!/from\(['"](?:admin_users|b2b_agents)['"]\)\.insert\(\{[\s\S]{0,800}(?:initial_)?password/.test(provisioningFunction), 'Provisioning passwords must never be inserted into portal profile tables.');
assert(!provisioningService.includes('localStorage') && !provisioningService.includes('sessionStorage'), 'Provisioning passwords must never be persisted in browser storage.');
assert(provisioningService.includes("functions.invoke('provision-portal-user'"), 'Browser provisioning must use the secured Supabase Edge Function.');
assert(teamAccessPage.includes('provisionInternalPortalUser') && !teamAccessPage.includes('Create the account in Supabase Authentication first'), 'Team & Access create mode must securely provision Auth and profile records without a manual Auth UUID prerequisite.');
assert(b2bAgentsPage.includes('provisionB2BAgentUser') && !b2bAgentsPage.includes('paste the Auth user UUID'), 'B2B Agent create mode must securely provision Auth and profile records without manual Auth UUID entry.');
assert(nextConfig.includes("output: 'export'"), 'The website must remain a Next.js static export.');
assert(deployWorkflow.includes('local-dir: ./out/') && deployWorkflow.includes('SamKirkland/FTP-Deploy-Action'), 'The existing static-export FTP deployment architecture must remain unchanged.');
assert(portalAccess.includes("path === '/admin/my-profile'") && portalAccess.includes("path === '/admin/manager/my-profile'"), 'Approved self-profile routes must retain their mutation exception.');
assert(portalAccess.includes("['super_admin', 'admin', 'booking_staff', 'manager', 'finance']"), 'Every active supported portal role must retain self-profile mutation access.');
assert(!portalAccess.includes('Role-based access') && !portalAccess.includes('Database security policies'), 'Portal authorization must remain enforced without exposing implementation banners.');
assert(uiLabels.includes("super_admin: 'Super Admin'") && uiLabels.includes("booking_staff: 'Booking Manager'") && uiLabels.includes("b2b_agent: 'B2B Agent'"), 'Shared portal labels must preserve approved business terminology.');
assert(uiLabels.includes('export function safeUiError') && !financeBookings.includes('public.booking_requests'), 'Portal pages must use safe presentation errors and avoid visible database identifiers.');
  assert(compactPresentation.includes('CompactPageHeader') && compactPresentation.includes('CompactKpiCard') && compactPresentation.includes('CompactSegmentedTabs') && compactPresentation.includes('CompactOperationalRow') && compactPresentation.includes('CompactEmptyState'), 'Portal density standards must retain shared compact headers, metrics, tabs, operational rows and empty states.');
  assert(compactPresentation.includes('min-h-[56px]') && compactPresentation.includes('h-8 shrink-0'), 'Portal metrics and segmented tabs must retain compact laptop-first dimensions.');
  assert(overflowText.includes('CompactInfoTooltip') && overflowText.includes('role="tooltip"') && overflowText.includes("event.key === 'Escape'") && overflowText.includes('aria-expanded'), 'Overflow and metric helper text must remain accessible by pointer, keyboard and touch.');
assert(tablePrimitive.includes('whitespace-nowrap') && tablePrimitive.includes("text-[10px]"), 'Portal table headers and cells must retain compact single-line defaults.');
assert(portalAccess.includes("if (role === 'admin') return false;") && portalAccess.includes("if (role === 'finance') return path === '/admin/payments'"), 'Admin must remain read-only and Finance mutations must remain limited to Payments and self-profile.');
assert(myProfilePage.includes("const avatarBucket = 'profile-avatars'"), 'Self-profile uploads must continue using the profile-avatars bucket.');
assert(myProfilePage.includes('const maxAvatarSize = 3 * 1024 * 1024') && myProfilePage.includes("'image/jpeg', 'image/png', 'image/webp'"), 'Self-profile uploads must retain the 3 MB JPG, PNG, and WebP restrictions.');
assert(myProfilePage.includes('`${userId}/profile-${Date.now()}') && myProfilePage.includes("rpc('update_my_admin_profile'"), 'Self-profile writes must use the authenticated user storage folder and secured profile RPC.');
assert(myProfilePage.includes('refreshAccess()'), 'Successful self-profile updates must immediately refresh portal avatar context.');
assert(myProfilePage.includes('newlyUploadedPath') && myProfilePage.includes('remove([newlyUploadedPath])'), 'Failed profile updates must remove newly uploaded unused avatars.');
assert(myProfileAccessMigration.includes('where auth_user_id = auth.uid()'), 'The self-profile RPC must remain restricted to the authenticated user profile.');
assert(dashboardRoute.includes("role === 'finance'") && dashboardRoute.includes('<FinanceDashboardPage />'), 'Finance must route to FinanceDashboardPage instead of the Admin dashboard.');
assert(adminShell.includes('financeNavItems') && adminShell.includes('isFinancePathAllowed'), 'AdminShell must use dedicated Finance navigation and route protection.');
for (const route of ['/admin/payments', '/admin/finance-bookings', '/admin/b2b-finance', '/admin/reports', '/admin/audit-log']) {
  assert(financeNav.includes(`href: '${route}'`), `Finance navigation must retain ${route}.`);
}
for (const route of ['/admin/bookings', '/admin/inquiries', '/admin/operations-schedule', '/admin/staff-management', '/admin/vehicles', '/admin/maintenance']) {
  const financeBlock = financeNav.match(/export const financeNavItems = \[[\s\S]*?\n\];/)?.[0] || '';
  assert(!financeBlock.includes(`href: '${route}'`), `Finance navigation must not include operational route ${route}.`);
}
assert(financeBookings.includes('Review booking revenue, payments and outstanding balances.') && !financeBookings.includes('start_booking_ride') && !financeBookings.includes('set_booking_manager'), 'Financial Bookings must remain professionally described and free of operational controls.');
assert(financeReports.includes('exportFinanceCsv') && financeReports.includes('exportFinancePdf'), 'Finance Reports must retain CSV and PDF export.');
assert(financeExport.includes('context.rows.map') && financeExport.includes('finance_report_exported'), 'Finance exports must use the filtered rows and create a safe audit event.');
assert(!/(password|jwt|access_token|service_role)[\s\S]{0,80}metadata/i.test(financeExport), 'Finance export audit metadata must not include credentials or tokens.');
assert(financeService.includes("rpc('get_finance_portal_data'") && !financeService.includes("from('bookings')"), 'Finance reporting must use the secured RPC and public.booking_requests flow.');
assert(financeAudit.includes("role === 'finance'") && financeAudit.includes("rpc('get_finance_audit_logs'"), 'Finance Audit Log must use the finance-only secured RPC.');
const financeAuditReadPolicy = financeMigration.match(/create policy "audit_logs_admin_read"[\s\S]*?\n\);/)?.[0] ?? '';
assert(
  financeMigration.includes('drop policy if exists "audit_logs_admin_read"') &&
    financeAuditReadPolicy.includes('au.auth_user_id::text = auth.uid()::text') &&
    financeAuditReadPolicy.includes("lower(coalesce(au.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))") &&
    financeAuditReadPolicy.includes("lower(coalesce(au.status::text, '')) = 'active'") &&
    financeAuditReadPolicy.includes("lower(coalesce(au.role::text, '')) in ('super_admin', 'admin', 'booking_staff')") &&
    !financeAuditReadPolicy.includes("'finance'"),
  'Finance must lose direct audit table SELECT while the live active-profile identity checks remain intact.',
);
assert(
  !financeMigration.includes("'discount_amount_aed'") &&
    !financeMigration.includes('br.discount_amount_aed') &&
    !financeBookings.includes('discount_amount_aed'),
  'Finance Portal must not depend on a physical booking_requests.discount_amount_aed column.',
);
assert(financeMigration.includes('receive_finance_settlement') && financeMigration.includes('p_operation_key uuid'), 'Finance settlements must use the atomic idempotent payment RPC.');
assert(financeMigration.includes('revoke insert, update, delete, truncate on table public.payment_receipts from anon, authenticated') && !financeMigration.includes('create policy "booking_requests_finance_collection_update"'), 'Finance must not receive broad direct payment or booking write access.');
assert(!financeMigration.includes('create policy "payment_receipts_finance_insert"') && !financeMigration.includes('create policy "payment_allocations_finance_insert"') && !financeMigration.includes('create policy "payment_ledger_finance_insert"'), 'Finance payment writes must remain RPC-only.');
assert(financeMigration.includes("revoke all on function public.receive_finance_settlement") && financeMigration.includes("grant execute on function public.receive_finance_settlement"), 'The secured Finance settlement RPC must revoke PUBLIC and grant authenticated execution explicitly.');
assert(financeMigration.includes('revoke all on function public.edrive_booking_matches_report_filters') && financeMigration.includes('from authenticated;') && !financeMigration.includes('grant execute on function public.edrive_booking_matches_report_filters'), 'The internal report-filter helper must not be browser executable.');
assert(financeMigration.includes("to_regprocedure('public.normalize_edrive_vehicle_type(text)')") && financeMigration.includes("to_regprocedure('public.get_b2b_finance_summary(uuid)')") && financeMigration.includes('relrowsecurity'), 'Finance migration preflight must verify reporting dependencies and required RLS.');
assert(adminPaymentsControlCenter.includes("rpc('receive_finance_settlement'") && !adminPaymentsControlCenter.includes("from('payment_receipts').insert") && !adminPaymentsControlCenter.includes("from('payment_receipt_allocations').insert") && !adminPaymentsControlCenter.includes("from('payment_ledger_entries').insert"), 'Payments must use the secured atomic settlement RPC without sequential browser inserts.');
assert(adminPaymentsControlCenter.includes('p_source_id: group.sourceId') && financeMigration.includes('assigned_manager_id is distinct from p_source_id') && financeMigration.includes('b2b_agent_id is distinct from p_source_id'), 'Settlement sources must use stable Manager or B2B Agent IDs.');
assert(financeMigration.includes('v_canonical_allocations') && financeMigration.includes('extensions.digest'), 'Settlement idempotency must use canonical allocations and the schema-qualified pgcrypto digest.');
assert(financeService.includes('getAllFinanceReportData') && financeService.includes('maxPages = 200'), 'Filtered exports must fetch every safe paginated reporting page.');
assert(financeMigration.includes('order by br.preferred_date desc nulls last, br.created_at desc, br.id desc') && financeMigration.includes('order by pr.received_at desc, pr.id desc'), 'Finance report pagination must use deterministic booking and receipt ordering before LIMIT/OFFSET.');
assert(financeMigration.includes("p.policyname <> 'booking_requests_finance_collection_update'") && financeMigration.includes('Finance booking UPDATE policy remains after Finance Portal lockdown.'), 'Finance policy preflight must tolerate only the known legacy policy and verify its removal.');
assert(financeMigration.includes('jsonb_array_length(p_allocations) > 500'), 'Finance settlements must enforce the bounded allocation request limit.');
for (const source of ['bookings', 'receipts', 'ledger', 'wallet_ledger', 'refunds']) {
  assert(financeService.includes(`${source === 'wallet_ledger' ? 'walletLedger' : source}.push`) || source === 'bookings', `Complete Finance exports must accumulate paginated ${source} rows.`);
}
assert(financeReports.includes("reportType === 'Payment Transaction Report'") && financeReports.includes("reportType === 'B2B Wallet Ledger Report'") && financeReports.includes("reportType === 'Refund Report'"), 'Finance report exports must select the complete report-specific ledger, wallet, and refund datasets.');
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
assert(publicShell.includes("import styles from './public-shell.module.css'"), 'Public header spacing must use the locked CSS module contract.');
assert(publicShell.includes('data-public-header'), 'Public header must keep its contract marker.');
assert(publicShell.includes('data-public-main'), 'Public main content must keep its contract marker.');
assert(!publicShell.includes("import { RouteContentTransition } from './route-content-transition'"), 'PublicShell must not import RouteContentTransition; public pages must remain direct children of data-public-main.');
assert(!publicShell.includes('<RouteContentTransition'), 'PublicShell must not render RouteContentTransition; public pages must remain direct children of data-public-main.');
assert(/<main\b[^>]*data-public-main[^>]*>\s*\{children\}\s*<\/main>/.test(publicShell), 'PublicShell must render children directly inside data-public-main with no transition or layout wrapper.');
assert(!publicShell.includes('pt-[86px]'), 'Public main must not use the old independent 86px top offset.');
assert(publicShellStyles.includes('--public-header-height: 4.625rem'), 'Public header height must remain locked to 74px.');
assert(publicShellStyles.includes('height: var(--public-header-height)'), 'Public header must use the shared header-height variable.');
assert(publicShellStyles.includes('padding-top: var(--public-header-height)'), 'Public main must use the same shared header-height variable.');
assert(publicShellStyles.includes('.main > section:first-of-type:not([data-public-hero])'), 'Non-hero public sections must be protected from accidental top margin.');
assert(publicPages.match(/data-public-hero(?=[\s>])/g)?.length === 1, 'HomeHero must keep its stable public hero marker.');
assert(publicVideoHero.includes('data-public-hero'), 'Shared PublicVideoHero must keep the stable public hero marker.');
assert(heroCtaStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Hero polish must target stable public layout markers.');
assert(heroCtaStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Public hero CSS must retain the direct-child data-public-main layout contract.');
assert(!publicPages.includes('Dubai Water Sports Packages'), 'The homepage live package grid must not return.');
assert(!publicPages.includes('LivePackageShowcase'), 'The homepage must not render or import the live package grid.');
assert(publicPages.match(/data-home-ride-card/g)?.length === 3, 'The homepage must define exactly two primary ride cards and one shared card marker type.');
const homeRideSection = publicPages.match(/<section className="bg-\[#f4f5f5\]" data-home-rides>[\s\S]*?<\/section>/)?.[0] || '';
assert(homeRideSection.match(/data-home-ride-card/g)?.length === 2, 'The homepage ride section must contain exactly two primary ride cards.');
assert(!homeRideSection.includes('/membership'), 'Membership must remain outside the homepage ride-card grid.');
assert(homeRideSection.includes('View Jet Ski Packages'), 'The Jet Ski ride CTA must remain View Jet Ski Packages.');
assert(homeRideSection.includes('View Jet Car Packages'), 'The Jet Car ride CTA must remain View Jet Car Packages.');
assert(!publicPages.includes('bg-primary-950'), 'The homepage must not use the unsupported bg-primary-950 utility.');
assert(!publicPages.includes('text-primary-950'), 'The homepage must not use the unsupported text-primary-950 utility.');
const homeMembershipSection = publicPages.match(/<section className="border-y border-border bg-white\/70" data-home-membership>[\s\S]*?<\/section>/)?.[0] || '';
assert(homeMembershipSection.includes('bg-primary-900'), 'The Membership panel must retain its supported dark primary-900 background.');
assert(/<Button[^>]*\btext-primary-900\b[^>]*>[\s\S]*?href="\/membership"/.test(homeMembershipSection), 'The Membership CTA must retain a readable primary-900 text color.');
for (const marker of ['data-home-rides', 'data-home-membership', 'data-home-why', 'data-home-process', 'data-home-contact']) {
  assert(publicPages.includes(marker), `Homepage markup must retain the stable ${marker} marker.`);
  assert(homeResponsiveStyles.includes(`[data-public-main] > [${marker}]`), `Homepage responsive CSS must target ${marker} through the direct-child data-public-main contract.`);
}
assert(!homeResponsiveStyles.includes('#live-packages + section'), 'Homepage responsive CSS must not depend on live-package sibling positions.');
assert(jetSkiRentalsPage.includes('sortByDuration'), 'Jet Ski package listings must enable duration sorting.');
assert(jetCarRentalsPage.includes('sortByDuration'), 'Jet Car package listings must enable duration sorting.');
assert(packageShowcase.includes('sortByDuration?: boolean'), 'LivePackageShowcase must expose controlled duration sorting.');
assert(/if \(sortByDuration\) \{\s*return Number\(a\.duration_minutes/.test(packageShowcase), 'Duration sorting must prioritize duration_minutes before all other fields.');
assert(heroCtaStyles.includes('margin-top: calc(-1 * var(--public-header-height))'), 'Public hero must overlap the shared header height without a blank strip.');
assert(contactPolishStyles.includes('[data-public-main] > [data-public-hero]:first-of-type'), 'Contact polish must target stable public layout markers.');
assert(heroVideoMedia.includes("'use client';"), 'Hero video media must manage browser playback readiness on the client.');
assert(heroVideoMedia.includes('data-public-hero-image'), 'Hero fallback image must keep its stable visibility marker.');
assert(heroVideoMedia.includes('data-public-hero-video'), 'Hero video must keep its stable video marker.');
assert(heroCtaStyles.includes('> [data-public-hero-image]'), 'Public hero visibility must target the stable hero-image marker.');
assert(heroCtaStyles.includes('opacity: 1 !important'), 'Assigned public hero media must remain available to the controlled visibility state.');
assert(!heroCtaStyles.includes("background-image: url('/images/edrive/dubai-waterfront-hero.png')"), 'Global hero CSS must not force one shared background image across pages.');
assert(!heroCtaStyles.includes('[data-public-hero]:first-of-type > img {'), 'Global hero CSS must not hide page-specific hero images.');
assert(heroVideoMedia.includes('object-cover'), 'Shared public hero media must cover the complete hero frame.');
assert(heroVideoExists, 'Shared public hero video file must exist.');
assert(!heroVideoExists || fs.statSync(heroVideoFile).size > 1024, 'Shared public hero video file must not be empty.');
assert(heroVideoMedia.includes("publicHeroVideoPath = '/videos/edrive-hero-loop.mp4'"), 'Hero video component must use the approved shared video path.');
assert(heroVideoMedia.includes('autoPlay') && heroVideoMedia.includes('muted') && heroVideoMedia.includes('loop') && heroVideoMedia.includes('playsInline'), 'Shared hero video must autoplay silently, loop, and support inline mobile playback.');
assert(heroVideoMedia.includes('preload="auto"'), 'Shared hero video must preload playable data before route transitions.');
assert(heroVideoMedia.includes('onLoadedData={markVideoReady}') && heroVideoMedia.includes('onCanPlay={markVideoReady}') && heroVideoMedia.includes('onPlaying={markVideoReady}'), 'Hero video visibility must wait for a playable frame.');
assert(heroVideoMedia.includes('onError={showFallbackImage}'), 'Hero video failures must reveal the static fallback image.');
assert(heroVideoMedia.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"), 'Hero video must respect the browser reduced-motion preference.');
assert(heroVideoMedia.includes("style={{ visibility: showVideo ? 'visible' : 'hidden' }}"), 'Hero video must remain hidden until its first frame is ready.');
assert(heroVideoMedia.includes('hidden={!showFallback}'), 'Page-specific fallback images must stay hidden during normal video loading.');
assert(!heroVideoMedia.includes('poster={fallbackImage}'), 'Page-specific fallback images must not be used as video posters.');
assert(heroCtaStyles.includes('[data-public-hero-video]'), 'Hero CSS must explicitly support the shared video layer.');
assert(heroCtaStyles.includes('prefers-reduced-motion: reduce'), 'Reduced-motion users must receive the static hero fallback.');
assert(publicPages.includes('HeroVideoMedia fallbackImage={dubaiWaterfrontImage}'), 'Home hero must use the shared video media component.');
assert(publicPages.includes('<PublicVideoHero title={title}'), 'Fleet, Membership, and Contact must use the shared video hero component.');
assert(rentalsPage.includes('<PublicVideoHero'), 'Rentals page must use the shared video hero.');
assert(jetSkiRentalsPage.includes('<PublicVideoHero'), 'Jet Ski rentals page must use the shared video hero.');
assert(jetCarRentalsPage.includes('<PublicVideoHero'), 'Jet Car rentals page must use the shared video hero.');
assert(publicVideoHero.includes('publicHeroFrameClass') && publicVideoHero.includes('publicHeroContentClass'), 'Shared video hero must preserve the locked public hero layout contract.');
assert(publicVideoHero.includes('<HeroVideoMedia'), 'Shared public hero must render the approved video media component.');
assert(publicVideoHero.includes('fallbackImage={fallbackImage}'), 'Every video hero must keep its page-specific fallback image.');
assert(publicVideoHero.includes('fallbackAlt={fallbackAlt}'), 'Every video hero must keep accessible fallback image text.');
assert(publicVideoHero.includes('export const publicHeroFrameClass ='), 'Shared video hero must own the public hero frame contract.');
assert(publicVideoHero.includes('export const publicHeroContentClass ='), 'Shared video hero must own the public hero content contract.');
assert(publicPages.match(/className=\{publicHeroFrameClass\}/g)?.length === 1, 'HomeHero must use the shared hero frame class.');
assert(publicPages.match(/className=\{publicHeroContentClass\}/g)?.length === 1, 'HomeHero must use the shared hero content class.');
assert(publicVideoHero.includes('className={publicHeroFrameClass}'), 'Shared PublicVideoHero must use the shared hero frame class.');
assert(publicVideoHero.includes('className={publicHeroContentClass}'), 'Shared PublicVideoHero must use the shared hero content class.');
assert(!heroCtaStyles.includes('min-height: 520px !important'), 'Global hero polish must not override shared component height.');
assert(!heroCtaStyles.includes('min-height: 540px !important'), 'Mobile hero polish must not override shared component height.');
assert(!contactPolishStyles.includes('[data-public-hero]:first-of-type:has(+ section.container-x.grid)'), 'Contact page must not compress or hide the shared public hero.');
assert(!heroCtaStyles.includes('main.pt-\\[86px\\]'), 'Hero polish must not depend on the removed Tailwind top-padding class.');
assert(!contactPolishStyles.includes('main.pt-\\[86px\\]'), 'Contact polish must not depend on the removed Tailwind top-padding class.');
assert(publicShellStyles.includes('.main > div:first-of-type'), 'Public pages with a div root must also be protected from accidental top margin.');
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
assert(fleetPage.includes('const canMaintain = isSuperAdmin;') && !fleetPage.includes("role === 'maintenance_staff'"), 'Fleet lifecycle controls must be Super Admin only.');
assert(fleetPage.includes('isSuperAdmin'), 'Fleet master edit and delete controls must remain restricted to Super Admin.');
assert(fleetPage.includes('complianceIssues'), 'Fleet records must expose registration, insurance, tracker, and profile alerts.');
assert(fleetPage.includes('Missing Registration'), 'Fleet filters must surface missing registration records.');
assert(fleetPage.includes("const fleetImageBucket = 'fleet-images'"), 'Fleet image uploads must use the dedicated storage bucket.');
assert(fleetPage.includes('Replace image'), 'Fleet edit form must expose a simple replacement image action.');
assert(fleetPage.includes('Advanced image options'), 'Gallery and custom image fields must stay collapsed by default.');
assert(fleetPage.includes('fleetImageOptionsForType'), 'Fleet image gallery must be filtered by vehicle type.');
assert(fleetPage.includes('removeFleetImage'), 'Failed fleet saves must clean up newly uploaded images.');
assert(!fleetPage.includes('Fleet database enum fix is pending'), 'Fleet edit must not show the obsolete migration-pending message.');
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
assert(fleetEditMigration.includes('type = v_type::public.vehicle_type'), 'Fleet save RPC must cast the legacy type column when it uses the vehicle_type enum.');
assert(fleetEditFinalMigration.includes('type = v_type::public.vehicle_type'), 'Final fleet enum rollout must include the legacy type-column cast.');
assert(fleetEditMigration.includes("'fleet-images'"), 'Fleet image storage bucket migration is required.');
assert(fleetEditMigration.includes("tg_op = 'INSERT' and length(v_reg) < 3"), 'New fleet units must still require registration while legacy edits remain possible.');
assert(maintenanceLockdownMigration.includes("if v_role <> 'super_admin'"), 'Active fleet lifecycle authorization must be Super Admin only.');
assert(!maintenanceLockdownMigration.includes("array['super_admin', 'maintenance_staff"), 'Active fleet and maintenance read policies must exclude Maintenance Staff.');
assert(maintenanceLockdownMigration.includes("drop policy if exists \"fleet_maintenance_staff_select\"") && maintenanceLockdownMigration.includes('create policy "fleet_maintenance_operational_select"'), 'Maintenance-log policy replacement must be rerunnable.');
assert(b2bMigration.includes('as restrictive') && b2bMigration.includes('"booking_requests_b2b_identity_select_guard"'), 'B2B booking reads require a restrictive identity guard.');
assert(b2bMigration.includes('revoke insert, update, delete on public.b2b_agents from public, anon, authenticated'), 'B2B profile tables must reject direct authenticated writes.');
assert(b2bMigration.includes('reverse_b2b_wallet_entry') && b2bMigration.includes('reversal_of_entry_id'), 'Wallet reversals must be traceable through the secured RPC and source foreign key.');
assert(b2bFinanceService.includes("rpc<B2BWalletLedgerEntry>('reverse_b2b_wallet_entry'"), 'Wallet reversals must use the secured RPC.');
assert(!b2bFinancePage.includes(".from('b2b_wallets').update(") && !b2bFinancePage.includes(".from('b2b_wallet_ledger').insert("), 'The finance UI must not write wallet data directly.');
assert(!portalAccess.includes("case 'maintenance_staff'") && !portalAccess.includes("role === 'maintenance_staff' &&"), 'Maintenance Staff must not receive active navigation or mutation permissions.');

if (failures.length) {
  console.error('\nProduction guard failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Production guard passed.');
