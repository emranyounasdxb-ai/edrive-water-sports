export type PortalRole = 'admin' | 'manager';

export type DemoUser = {
  name: string;
  email: string;
  role: PortalRole;
  roleLabel: string;
};

export const demoUsers: Record<PortalRole, DemoUser> = {
  admin: {
    name: 'Admin User',
    email: 'admin@edrivedubai.ae',
    role: 'admin',
    roleLabel: 'Admin'
  },
  manager: {
    name: 'Booking Manager',
    email: 'manager@edrivedubai.ae',
    role: 'manager',
    roleLabel: 'Booking Manager'
  }
};

export const portalSessionKey = 'edrive-portal-user';

export const managerAllowedPaths = ['/admin/manager', '/admin/vehicle-assignment', '/admin/operations-schedule', '/admin/payments', '/admin/vehicles', '/admin/maintenance'];

export function getDemoUserFromStorage(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(portalSessionKey);
    if (!value) return null;
    const user = JSON.parse(value) as DemoUser;
    return user?.role === 'admin' || user?.role === 'manager' ? user : null;
  } catch {
    return null;
  }
}

export function setDemoUser(role: PortalRole) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(portalSessionKey, JSON.stringify(demoUsers[role]));
}

export function clearDemoUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(portalSessionKey);
}

export function isManagerPathAllowed(pathname: string) {
  return managerAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
