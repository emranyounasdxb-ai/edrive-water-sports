export type VehicleStatus = 'Available' | 'Booked' | 'Maintenance' | 'For Sale';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

export const publicNavItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/jet-ski-rentals', label: 'Jet Ski Rentals' },
  { href: '/jet-car-rentals', label: 'Jet Car Rentals' },
  { href: '/sales', label: 'Sales' },
  { href: '/booking', label: 'Booking' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' }
];

export const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'CalendarDays' },
  { href: '/admin/vehicles', label: 'Vehicles', icon: 'Ship' },
  { href: '/admin/inventory', label: 'Inventory', icon: 'Package' },
  { href: '/admin/coupons', label: 'Coupons', icon: 'BadgePercent' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
  { href: '/admin/staff-management', label: 'Staff Management', icon: 'UserCog' }
];

export const fleetHeroImage = '/images/edrive/fleet-hero.png';
export const fleetShowcaseImage = '/images/edrive/fleet-showcase.png';
export const dubaiWaterfrontImage = '/images/edrive/dubai-waterfront-hero.png';
export const jetSkiLightImage = '/images/edrive/jet-ski-fleet-light.png';
export const jetCarLightImage = '/images/edrive/jet-car-marina-light.png';

export const vehicles = [
  {
    id: 'JS-01',
    name: 'Yamaha FX Cruiser HO',
    category: 'Jet Ski',
    tag: 'Popular',
    hourlyRate: 650,
    seats: 3,
    horsepower: 180,
    range: '2 hr ride window',
    status: 'Available' as VehicleStatus,
    image: jetSkiLightImage,
    description: 'A stable, comfortable cruiser with smooth acceleration and room for up to three riders.',
    specs: ['Bluetooth audio', 'Dry storage', 'Safety lanyard', 'Guided route']
  },
  {
    id: 'JS-02',
    name: 'Sea-Doo GTX Limited',
    category: 'Jet Ski',
    tag: 'Premium',
    hourlyRate: 720,
    seats: 3,
    horsepower: 230,
    range: '90 min sport ride',
    status: 'Booked' as VehicleStatus,
    image: dubaiWaterfrontImage,
    description: 'A premium touring jet ski designed for confident handling and a more relaxed ride.',
    specs: ['Touring saddle', 'Aqua underglow', 'Cooler mount', 'Pro guide']
  },
  {
    id: 'JC-01',
    name: 'Lamborghini Jet Car',
    category: 'Jet Car',
    tag: 'Signature',
    hourlyRate: 1250,
    seats: 2,
    horsepower: 250,
    range: 'Marina showcase',
    status: 'Available' as VehicleStatus,
    image: jetCarLightImage,
    description: 'A distinctive private water experience for marina cruising, celebrations, and photographs.',
    specs: ['Captain included', 'Photo stop', 'LED cabin', 'VIP dock pickup']
  },
  {
    id: 'JC-02',
    name: 'Corvette Jet Car',
    category: 'Jet Car',
    tag: 'New Arrival',
    hourlyRate: 1100,
    seats: 2,
    horsepower: 220,
    range: 'Coastal cruise',
    status: 'Maintenance' as VehicleStatus,
    image: dubaiWaterfrontImage,
    description: 'Low-slung styling, comfortable seating, and an easy pace for Dubai waterfront cruising.',
    specs: ['Twin seats', 'Sound system', 'Safety kit', 'Dock concierge']
  },
  {
    id: 'WB-01',
    name: 'Aqua Bike Carbon',
    category: 'Water Bike',
    tag: 'Eco Ride',
    hourlyRate: 420,
    seats: 1,
    horsepower: 35,
    range: '45 min circuit',
    status: 'Available' as VehicleStatus,
    image: jetSkiLightImage,
    description: 'Compact electric water bike for calmer exploration close to the marina.',
    specs: ['Electric assist', 'Beginner route', 'Low wake', 'Guide optional']
  },
  {
    id: 'SL-01',
    name: 'Pre-Owned FX Cruiser',
    category: 'Jet Ski',
    tag: 'For Sale',
    hourlyRate: 48500,
    seats: 3,
    horsepower: 180,
    range: '28 engine hours',
    status: 'For Sale' as VehicleStatus,
    image: jetSkiLightImage,
    description: 'A maintained premium cruiser with clear service history and marina-ready detailing.',
    specs: ['Service record', 'Trailer option', 'Warranty check', 'Detail included']
  },
  {
    id: 'SL-02',
    name: 'Pre-Owned Jet Car Touring',
    category: 'Jet Car',
    tag: 'For Sale',
    hourlyRate: 265000,
    seats: 2,
    horsepower: 220,
    range: '42 engine hours',
    status: 'For Sale' as VehicleStatus,
    image: jetCarLightImage,
    description: 'A carefully presented two-seat jet car with low running hours and recent marina service.',
    specs: ['Service record', 'Cover included', 'Dock trial', 'Handover support']
  }
];

export const bookings = [
  {
    id: 'BK-10234',
    customer: 'Noura Al Mansoori',
    activity: 'Jet Car',
    vehicle: 'Lamborghini Jet Car',
    date: 'Jul 04, 2026',
    time: '6:30 PM',
    guests: 2,
    location: 'Dubai Marina',
    status: 'Confirmed' as BookingStatus,
    amount: 1250,
    payment: 'Paid'
  },
  {
    id: 'BK-10233',
    customer: 'Adam Stone',
    activity: 'Jet Ski',
    vehicle: 'Yamaha FX Cruiser HO',
    date: 'Jul 04, 2026',
    time: '4:00 PM',
    guests: 3,
    location: 'JBR Beach',
    status: 'Confirmed' as BookingStatus,
    amount: 650,
    payment: 'Paid'
  },
  {
    id: 'BK-10232',
    customer: 'Sara Johnson',
    activity: 'Jet Ski',
    vehicle: 'Sea-Doo GTX Limited',
    date: 'Jul 05, 2026',
    time: '10:00 AM',
    guests: 2,
    location: 'Bluewaters',
    status: 'Pending' as BookingStatus,
    amount: 720,
    payment: 'Deposit'
  },
  {
    id: 'BK-10231',
    customer: 'Khalid Rahman',
    activity: 'Water Bike',
    vehicle: 'Aqua Bike Carbon',
    date: 'Jul 06, 2026',
    time: '9:30 AM',
    guests: 1,
    location: 'Harbour Point',
    status: 'Completed' as BookingStatus,
    amount: 420,
    payment: 'Paid'
  },
  {
    id: 'BK-10230',
    customer: 'Maya Rossi',
    activity: 'Jet Car',
    vehicle: 'Corvette Jet Car',
    date: 'Jul 06, 2026',
    time: '5:00 PM',
    guests: 2,
    location: 'Dubai Marina',
    status: 'Cancelled' as BookingStatus,
    amount: 0,
    payment: 'Refunded'
  }
];

export const dashboardStats = [
  { label: 'Total Bookings', value: '128', delta: '+18.6%', detail: 'Jul 2026 pipeline' },
  { label: 'Total Revenue', value: 'AED 98,450', delta: '+24.3%', detail: 'Mock monthly revenue' },
  { label: 'Active Vehicles', value: '42', delta: '84%', detail: 'Available today' },
  { label: 'Customer Rating', value: '4.9', delta: '+0.2', detail: 'Average review score' }
];

export const inventoryItems = [
  { sku: 'VEST-PRO-M', item: 'Premium Life Vest - M', category: 'Safety', quantity: 34, reorderAt: 12, status: 'Healthy' },
  { sku: 'HELM-AQUA', item: 'Aqua Safety Helmet', category: 'Safety', quantity: 18, reorderAt: 10, status: 'Healthy' },
  { sku: 'CAM-GO-12', item: 'Action Camera Kit', category: 'Media', quantity: 7, reorderAt: 6, status: 'Watch' },
  { sku: 'FUEL-ADD', item: 'Marine Fuel Additive', category: 'Maintenance', quantity: 5, reorderAt: 8, status: 'Low' },
  { sku: 'TOW-ROPE', item: 'Tow Rope Set', category: 'Operations', quantity: 12, reorderAt: 5, status: 'Healthy' }
];

export const coupons = [
  { code: 'MARINA15', name: 'Marina Sunset Offer', type: '15% off', uses: 48, limit: 120, expires: 'Jul 31, 2026', status: 'Active' },
  { code: 'VIPCAR', name: 'VIP Jet Car Upgrade', type: 'AED 200 off', uses: 18, limit: 40, expires: 'Aug 15, 2026', status: 'Active' },
  { code: 'FLEET10', name: 'Fleet Week Trial', type: '10% off', uses: 64, limit: 64, expires: 'Jun 30, 2026', status: 'Expired' },
  { code: 'GROUPRIDE', name: 'Group Ride Add-On', type: 'Free media kit', uses: 21, limit: 80, expires: 'Sep 01, 2026', status: 'Draft' }
];

export const reports = {
  revenue: [
    { month: 'Jan', value: 62000 },
    { month: 'Feb', value: 71000 },
    { month: 'Mar', value: 84000 },
    { month: 'Apr', value: 78000 },
    { month: 'May', value: 92400 },
    { month: 'Jun', value: 98450 }
  ],
  activities: [
    { label: 'Jet Ski Rentals', value: 68 },
    { label: 'Jet Car Rentals', value: 26 },
    { label: 'Sales Inquiries', value: 6 }
  ],
  locations: [
    { label: 'Dubai Marina', value: 48 },
    { label: 'JBR Beach', value: 31 },
    { label: 'Bluewaters', value: 21 }
  ]
};

export const staff = [
  { name: 'Omar Haddad', role: 'Operations Manager', shift: 'Morning', status: 'On Duty', tasks: 14 },
  { name: 'Leena Park', role: 'Booking Concierge', shift: 'Afternoon', status: 'On Duty', tasks: 9 },
  { name: 'Ibrahim Noor', role: 'Fleet Technician', shift: 'Evening', status: 'Dock Check', tasks: 7 },
  { name: 'Mina Volkov', role: 'Guest Experience', shift: 'Weekend', status: 'Scheduled', tasks: 5 }
];

export const galleryItems = [
  { title: 'Morning on the Marina', category: 'Dubai Marina', image: dubaiWaterfrontImage },
  { title: 'Fleet Ready at the Dock', category: 'Jet Ski', image: jetSkiLightImage },
  { title: 'A Different Way to Drive', category: 'Jet Car', image: jetCarLightImage },
  { title: 'Open Water Perspective', category: 'Experience', image: dubaiWaterfrontImage },
  { title: 'Private Marina Departure', category: 'Fleet', image: jetCarLightImage },
  { title: 'Prepared for the Day', category: 'Jet Ski', image: jetSkiLightImage }
];

export const testimonials = [
  { name: 'Layla M.', role: 'Dubai Marina', quote: 'The jet car was the highlight of our weekend. The team had everything ready and made the marina handover effortless.' },
  { name: 'Ryan K.', role: 'JBR Beach', quote: 'Easy to arrange, well maintained, and exactly the right mix of excitement and professional support.' },
  { name: 'Hessa A.', role: 'Bluewaters', quote: 'The route, photographs, and attention from the dock team made the experience feel genuinely special.' }
];

export const salesListings = vehicles.filter((vehicle) => vehicle.status === 'For Sale');

export const serviceHighlights = [
  { value: '500+', label: 'Happy Customers' },
  { value: '50+', label: 'Premium Vehicles' },
  { value: '10K+', label: 'Bookings Completed' },
  { value: '4.9', label: 'Customer Rating' }
];
