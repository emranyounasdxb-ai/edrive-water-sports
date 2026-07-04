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
  { href: '/sales', label: 'Sales' },
  { href: '/rentals', label: 'Rentals' },
  { href: '/membership', label: 'Membership' },
  { href: '/contact', label: 'Contact' }
];

export const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/staff-management', label: 'Staff', icon: 'UserCog' },
  { href: '/admin/b2b-agents', label: 'B2B Agents', icon: 'UsersRound' },
  { href: '/admin/packages', label: 'Packages', icon: 'Package' },
  { href: '/admin/vehicles', label: 'Fleet', icon: 'Ship' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'CalendarDays' },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays' },
  { href: '/admin/vehicle-assignment', label: 'Assignments', icon: 'ClipboardCheck' },
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
  { href: '/admin/customers', label: 'Customers', icon: 'UsersRound' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'Settings' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
  { href: '/admin/system-settings', label: 'Settings', icon: 'Settings' }
];

export const managerNavItems = [
  { href: '/admin/manager', label: 'Manager Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/vehicle-assignment', label: 'Assignments', icon: 'ClipboardCheck' },
  { href: '/admin/operations-schedule', label: 'Schedule', icon: 'CalendarDays' },
  { href: '/admin/vehicles', label: 'Vehicle Status', icon: 'Ship' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: 'Settings' },
  { href: '/admin/payments', label: 'Payment Updates', icon: 'CreditCard' }
];

export const financeNavItems = [
  { href: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
  { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' }
];

export const fleetHeroImage = '/images/edrive/fleet-hero.png';
export const fleetShowcaseImage = '/images/edrive/fleet-showcase.png';
export const dubaiWaterfrontImage = '/images/edrive/dubai-waterfront-hero.png';
export const jetSkiLightImage = '/images/edrive/jet-ski-fleet-light.png';
export const jetCarLightImage = '/images/edrive/jet-car-marina-light.png';

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