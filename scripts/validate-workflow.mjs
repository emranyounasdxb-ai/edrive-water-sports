import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const passes = [];

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function check(label, condition, detail) {
  if (condition) passes.push(label);
  else failures.push(`${label}${detail ? `: ${detail}` : ''}`);
}

const nextConfig = read('next.config.mjs');
check('Static export enabled', /output\s*:\s*['"]export['"]/.test(nextConfig));
check('Trailing slash enabled', /trailingSlash\s*:\s*true/.test(nextConfig));
check('Unoptimized images enabled', /unoptimized\s*:\s*true/.test(nextConfig));

const workflow = read('.github/workflows/static-export.yml');
check('Static export workflow builds project', /npm run build/.test(workflow));
check('Static export workflow deploys out directory', /local-dir:\s*\.\/out\//.test(workflow));
check('FTP server secret unchanged', /CPANEL_FTP_SERVER/.test(workflow));
check('FTP username secret unchanged', /CPANEL_FTP_USERNAME/.test(workflow));
check('FTP password secret unchanged', /CPANEL_FTP_PASSWORD/.test(workflow));
check('FTP directory secret unchanged', /CPANEL_FTP_DIR/.test(workflow));
check('Supabase URL secret available during build', /NEXT_PUBLIC_SUPABASE_URL/.test(workflow));
check('Supabase anon key secret available during build', /NEXT_PUBLIC_SUPABASE_ANON_KEY/.test(workflow));

const bookingRecords = read('lib/booking-records.ts');
check('Live booking table remains booking_requests', /booking_requests/.test(bookingRecords) && !/['"]bookings['"]/.test(bookingRecords));

const paymentSql = read('supabase/payment-receiving.sql');
check('Payment receipt table definition exists', /payment_receipts/.test(paymentSql));
check('Payment allocation table definition exists', /payment_receipt_allocations/.test(paymentSql));
check('Payment ledger table definition exists', /payment_ledger_entries/.test(paymentSql));

const auditSql = read('supabase/audit-log.sql');
check('Audit log definition exists', /audit_logs/.test(auditSql));

const trackingSql = read('supabase/public-booking-tracking.sql');
check('Secure booking tracking RPC exists', /track_booking/.test(trackingSql));
check('Tracking RPC checks booking code and contact', /p_booking_code/.test(trackingSql) && /p_contact/.test(trackingSql));

const requiredRoutes = [
  'app/admin/bookings/page.tsx',
  'app/admin/payments/page.tsx',
  'app/admin/reports/page.tsx',
  'app/admin/customers/page.tsx',
  'app/(public)/my-booking/page.tsx'
];
requiredRoutes.forEach((route) => check(`Route available: ${route}`, fs.existsSync(path.join(root, route))));

console.log(`Workflow validation: ${passes.length} checks passed.`);
passes.forEach((item) => console.log(`PASS ${item}`));

if (failures.length) {
  console.error(`Workflow validation failed with ${failures.length} issue(s).`);
  failures.forEach((item) => console.error(`FAIL ${item}`));
  process.exit(1);
}

console.log('Workflow validation completed successfully.');
