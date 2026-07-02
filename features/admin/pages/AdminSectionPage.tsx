import { Card, CardDescription, CardTitle } from '@/components/ui/card';

const titles: Record<string, string> = {
  dashboard: 'Dashboard',
  bookings: 'Booking Management',
  vehicles: 'Vehicles',
  inventory: 'Inventory Control',
  coupons: 'Coupons',
  reports: 'Reports & Analytics',
  staff: 'Staff Management',
};

export function AdminSectionPage({ section }: { section: string }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.26em] text-primary">Admin Module</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">{titles[section] ?? section}</h1>
      <Card className="mt-8">
        <CardTitle>Production module shell</CardTitle>
        <CardDescription>
          This route is wired for static export, Supabase Auth protection, role-based RLS, and feature-level implementation.
        </CardDescription>
      </Card>
    </div>
  );
}
