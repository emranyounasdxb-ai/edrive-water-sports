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

export type AdminNavRole = 'super_admin' | 'admin' | 'booking_staff' | 'finance' | 'maintenance_staff';
export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  section?: string;
  roles?: AdminNavRole[];
};

const allPortalRoles: AdminNavRole[] = ['super_admin', 'admin', 'booking_staff', 'finance', 'maintenance_staff'];
const ownerAndAdmin: AdminNavRole[] = ['super_admin', 'admin'];

export const publicNavItems = [
  { href: '/', label: 'Home' },
  { href: '/fleet', label: 'Fleet' },
  { href: '/membership', label: 'Membership' },
  { href: '/contact', label: 'Contact' }
];

export const adminNavItems: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', roles: allPortalRoles },
  { href: '/admin/my-profile', label: 'My Profile', icon: 'UserCog', roles: allPortalRoles },
  { href: '/admin/bookings', label: 'Bookings', icon: 'CalendarDays', section: 'Booking Operations', roles: ['super_admin', 'admin', 'booking_staff'] },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays', section: 'Booking Operations', roles: allPortalRoles },
  { href: '/admin/customers', label: 'Customers', icon: 'UsersRound', section: 'Booking Operations', roles: ['super_admin', 'admin', 'booking_staff', 'finance'] },
  { href: '/admin/booking-activity', label: 'Booking Activity', icon: 'ClipboardCheck', section: 'Booking Operations', roles: ['super_admin', 'admin', 'booking_staff'] },
  { href: '/admin/b2b-agents', label: 'B2B Agents', icon: 'UsersRound', section: 'Partners & Sales', roles: ownerAndAdmin },
  { href: '/admin/packages', label: 'Packages', icon: 'Package', section: 'Partners & Sales', roles: ['super_admin', 'admin', 'booking_staff'] },
  { href: '/admin/vehicles', label: 'Fleet', icon: 'Ship', section: 'Assets', roles: ['super_admin', 'admin', 'booking_staff', 'maintenance_staff'] },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'Settings', section: 'Assets', roles: ['super_admin', 'admin', 'maintenance_staff'] },
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard', section: 'Finance', roles: ['super_admin', 'admin', 'finance'] },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3', section: 'Finance', roles: ['super_admin', 'admin', 'finance'] },
  { href: '/admin/staff-management', label: 'Team & Access', icon: 'UserCog', section: 'Team & System', roles: ownerAndAdmin },
  { href: '/admin/audit-log', label: 'Audit Log', icon: 'ClipboardCheck', section: 'Team & System', roles: ['super_admin', 'admin', 'finance'] },
  { href: '/admin/workflow-check', label: 'Workflow Check', icon: 'ClipboardCheck', section: 'Team & System', roles: ['super_admin'] }
];

export const managerNavItems = [
  { href: '/admin/manager', label: 'Today', icon: 'LayoutDashboard' },
  { href: '/admin/my-rides', label: 'My Rides', icon: 'ClipboardCheck' },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays' },
  { href: '/admin/payments', label: 'Collections', icon: 'CreditCard' },
  { href: '/admin/manager/my-profile', label: 'Profile', icon: 'UserCog' }
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
