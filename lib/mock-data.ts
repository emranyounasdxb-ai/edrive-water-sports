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
  { href: '/admin/staff-management', label: 'Staff / Users', icon: 'UserCog' },
  { href: '/admin/packages', label: 'Packages / Products', icon: 'Package' },
  { href: '/admin/vehicles', label: 'Vehicles / Fleet', icon: 'Ship' },
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

export const vehicles = [];
export const bookings = [];
export const dashboardStats = [];
export const inventoryItems = [];
export const coupons = [];
export const reports = {
  revenue: [],
  activities: [],
  locations: []
};
