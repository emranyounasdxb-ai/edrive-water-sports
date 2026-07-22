import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'out');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function file(relativePath) {
  return path.join(out, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(file(relativePath), 'utf8');
}

assert(fs.existsSync(out), 'Static export directory was not created.');

const requiredRoutes = [
  'index.html',
  'fleet/index.html',
  'rentals/index.html',
  'jet-ski-rentals/index.html',
  'jet-car-rentals/index.html',
  'membership/index.html',
  'booking/index.html',
  'my-booking/index.html',
  'contact/index.html',
  'privacy-policy/index.html',
  'terms-and-conditions/index.html',
  'refund-replacement-policy/index.html',
  'admin/login/index.html',
  'admin/inquiries/index.html',
  'admin/packages/index.html',
  'admin/vehicles/index.html',
  'manifest.webmanifest',
  'sw.js',
  'robots.txt',
  'sitemap.xml'
];

for (const route of requiredRoutes) {
  assert(fs.existsSync(file(route)), `Missing static export file: ${route}`);
}

if (fs.existsSync(file('index.html'))) {
  const home = read('index.html');
  const expectedTitle = '<title>Jet Ski Rental Dubai &amp; Jet Car Rides | eDrive Water Sports</title>';
  assert(home.includes(expectedTitle), 'Homepage SEO title is missing or duplicated.');
  assert(!home.includes('| eDrive Water Sports | eDrive Water Sports'), 'Homepage contains a duplicated brand suffix.');
  assert(home.includes('application/ld+json'), 'Homepage structured data is missing.');
  assert(home.includes('+971 4 611 3114'), 'Final company phone number is missing from homepage export.');
}

if (fs.existsSync(file('my-booking/index.html'))) {
  const tracker = read('my-booking/index.html');
  assert(tracker.includes('https://edrivedubai.ae/my-booking/'), 'My Booking canonical URL is missing.');
}

if (fs.existsSync(file('booking-status/index.html'))) {
  const legacyTracker = read('booking-status/index.html');
  assert(legacyTracker.includes('noindex'), 'Legacy booking status route must be noindex.');
  assert(legacyTracker.includes('https://edrivedubai.ae/my-booking/'), 'Legacy booking status canonical URL is missing.');
}

if (fs.existsSync(file('manifest.webmanifest'))) {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert(manifest.start_url === '/', 'Installed PWA does not open the public homepage.');
}

if (fs.existsSync(file('sw.js'))) {
  const serviceWorker = read('sw.js');
  assert(serviceWorker.includes("startsWith('/admin/')"), 'Service worker must bypass admin pages.');
  assert(serviceWorker.includes("startsWith('/agent/')"), 'Service worker must bypass B2B agent pages.');
}

if (failures.length) {
  console.error('\nStatic export smoke test failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static export smoke test passed (${requiredRoutes.length} required files checked).`);
