import { Card, CardDescription, CardTitle } from '@/components/ui/card';

const stats = [
  { label: 'Pending Bookings', value: '—' },
  { label: 'Confirmed Today', value: '—' },
  { label: 'Estimated Revenue', value: '—' },
  { label: 'Active Vehicles', value: '—' },
];

export function AdminDashboardPage() {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.26em] text-primary">Operations</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">Dashboard</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardDescription>{stat.label}</CardDescription>
            <CardTitle className="mt-3 text-4xl">{stat.value}</CardTitle>
          </Card>
        ))}
      </div>
    </div>
  );
}
