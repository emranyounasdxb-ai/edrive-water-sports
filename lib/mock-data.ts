export type VehicleStatus = 'Available' | 'Booked' | 'Maintenance' | 'For Sale';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';

export type VehicleItem = {
  id: string;
  name: string;
  category: string;
  tag: string;
  hourlyRate: number;
  seats: number;
  horsepower: number;
  range: string;
  status: VehicleStatus;
  image: string;
  description: string;
  specs: string[];
};

export type GalleryItem = {
  title: string;
  category: string;
  image: string;
};

export type TestimonialItem = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export const publicNavItems = [
  { href: '/', label: 'Home' },
  { href: '/fleet', label: 'Fleet' },
  { href: '/membership', label: 'Membership' },
  { href: '/contact', label: 'Contact' }
];

export const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Overview' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'CalendarDays', section: 'Operations' },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays', section: 'Operations' },
  { href: '/admin/customers', label: 'Customers', icon: 'UsersRound', section: 'Operations' },
  { href: '/admin/b2b-agents', label: 'B2B Agents', icon: 'UsersRound', section: 'Partners & Sales' },
  { href: '/admin/packages', label: 'Packages', icon: 'Package', section: 'Partners & Sales' },
  { href: '/admin/vehicles', label: 'Fleet', icon: 'Ship', section: 'Assets' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'Settings', section: 'Assets' },
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard', section: 'Finance' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3', section: 'Finance' },
  { href: '/admin/staff-management', label: 'Team & Access', icon: 'UserCog', section: 'Team & System' },
  { href: '/admin/system-settings', label: 'Settings', icon: 'Settings', section: 'Team & System' }
];

export const managerNavItems = [
  { href: '/admin/manager', label: 'Today', icon: 'LayoutDashboard' },
  { href: '/admin/my-rides', label: 'My Rides', icon: 'ClipboardCheck' },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays' },
  { href: '/admin/payments', label: 'Collections', icon: 'CreditCard' }
];

export const financeNavItems = [
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' }
];

export const fleetHeroImage = '/images/edrive/fleet/jc-01.webp';
export const fleetShowcaseImage = '/images/edrive/fleet/jc-02.webp';
export const dubaiWaterfrontImage = '/images/edrive/dubai-waterfront-hero.png';
export const jetSkiLightImage = '/images/edrive/fleet/js-01.webp';
export const jetCarLightImage = '/images/edrive/fleet/jc-03.webp';

export const vehicles: VehicleItem[] = [];
export const salesListings: VehicleItem[] = [];
export const galleryItems: GalleryItem[] = [];
export const testimonials: TestimonialItem[] = [];
export const bookings: Array<Record<string, never>> = [];
export const dashboardStats: Array<Record<string, never>> = [];
export const inventoryItems: Array<Record<string, never>> = [];
export const coupons: Array<Record<string, never>> = [];
export const reports = {
  revenue: [] as Array<Record<string, never>>,
  activities: [] as Array<Record<string, never>>,
  locations: [] as Array<Record<string, never>>
};