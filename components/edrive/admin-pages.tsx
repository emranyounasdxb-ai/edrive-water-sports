import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  CalendarDays,
  Download,
  Filter,
  Package,
  Plus,
  Ship,
  UserCog,
  Users,
  WalletCards
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookings, coupons, dashboardStats, inventoryItems, reports, staff, vehicles } from '@/lib/mock-data';
import { MotionReveal } from './motion-reveal';

export function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        label="Dashboard"
        title="Command center"
        text="A clear view of today's bookings, revenue, fleet availability, and operating priorities."
        actionLabel="Export Report"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <MotionReveal key={stat.label} delay={index * 0.04}>
            <MetricCard {...stat} />
          </MotionReveal>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <RecentBookingsCard />
        <AvailabilityCard />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.75fr]">
        <RevenueCard />
        <BookingsOverviewCard />
        <ActivityCard />
      </div>
    </div>
  );
}

export function AdminBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Bookings" title="Booking operations" text="Review customer schedules, payment states, assigned craft, and upcoming departures." actionLabel="New Booking" />
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat title="Confirmed" value="2" icon={CalendarDays} />
        <MiniStat title="Pending" value="1" icon={Filter} />
        <MiniStat title="Booked Revenue" value="AED 3,040" icon={WalletCards} />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>Customer, schedule, vehicle, and payment status overview.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter data-icon aria-hidden="true" />
            Filter
          </Button>
        </CardHeader>
        <CardContent>
          <BookingsTable />
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminVehiclesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Vehicles" title="Fleet management" text="Review craft status, specifications, hourly pricing, and sale availability." actionLabel="Add Vehicle" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle, index) => (
          <MotionReveal key={vehicle.id} delay={index * 0.03}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant={statusVariant(vehicle.status)}>{vehicle.status}</Badge>
                    <CardTitle className="mt-3">{vehicle.name}</CardTitle>
                    <CardDescription>{vehicle.category} · {vehicle.id}</CardDescription>
                  </div>
                  <Ship data-icon aria-hidden="true" className="text-ocean-glow" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <FleetSpec label="Seats" value={vehicle.seats} />
                  <FleetSpec label="HP" value={vehicle.horsepower} />
                  <FleetSpec label={vehicle.status === 'For Sale' ? 'Price' : 'Rate'} value={vehicle.status === 'For Sale' ? `${Math.round(vehicle.hourlyRate / 1000)}K` : vehicle.hourlyRate} />
                </div>
                <p className="text-sm leading-6 text-pearl-muted">{vehicle.description}</p>
                <Button variant="outline" size="sm" className="w-fit">View Record</Button>
              </CardContent>
            </Card>
          </MotionReveal>
        ))}
      </div>
    </div>
  );
}

export function AdminInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Inventory" title="Dock inventory" text="Track supplies, safety gear, media kits, and maintenance stock levels." actionLabel="Add Item" />
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Reorder thresholds and current stock health.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reorder At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell className="font-semibold text-pearl">{item.sku}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.reorderAt}</TableCell>
                  <TableCell><Badge variant={item.status === 'Low' ? 'warning' : item.status === 'Watch' ? 'gold' : 'success'}>{item.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminCouponsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Coupons" title="Promotion studio" text="Manage booking discounts, VIP upgrades, and seasonal experience offers." actionLabel="Create Coupon" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {coupons.map((coupon, index) => (
          <MotionReveal key={coupon.code} delay={index * 0.04}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <Badge variant={coupon.status === 'Active' ? 'success' : coupon.status === 'Draft' ? 'secondary' : 'warning'}>{coupon.status}</Badge>
                  <BadgePercent data-icon aria-hidden="true" className="text-gold" />
                </div>
                <CardTitle>{coupon.code}</CardTitle>
                <CardDescription>{coupon.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="font-heading text-3xl font-bold text-pearl">{coupon.type}</p>
                <ProgressBar value={(coupon.uses / coupon.limit) * 100} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{coupon.uses} uses</span>
                  <span>Limit {coupon.limit}</span>
                </div>
                <p className="text-sm text-pearl-muted">Expires {coupon.expires}</p>
              </CardContent>
            </Card>
          </MotionReveal>
        ))}
      </div>
    </div>
  );
}

export function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Reports" title="Performance reports" text="Review revenue trends, activity mix, and demand across Dubai departure points." actionLabel="Download CSV" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RevenueCard large />
        <Card>
          <CardHeader>
            <CardTitle>Location Split</CardTitle>
            <CardDescription>Booking share by dock point.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {reports.locations.map((item) => (
              <ProgressMetric key={item.label} label={item.label} value={item.value} />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <MiniStat title="Avg. Order Value" value="AED 769" icon={WalletCards} />
        <MiniStat title="Peak Slot" value="6:30 PM" icon={CalendarDays} />
        <MiniStat title="Repeat Guests" value="34%" icon={Users} />
      </div>
    </div>
  );
}

export function AdminStaffPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader label="Staff Management" title="Team schedule" text="Review shifts, current duty state, and assigned operating tasks." actionLabel="Invite Staff" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {staff.map((member, index) => (
          <MotionReveal key={member.name} delay={index * 0.04}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-ocean-glow">
                  <UserCog data-icon aria-hidden="true" />
                </div>
                <CardTitle>{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shift</span>
                  <span className="font-semibold text-pearl">{member.shift}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasks</span>
                  <span className="font-semibold text-pearl">{member.tasks}</span>
                </div>
                <Badge variant={member.status === 'On Duty' ? 'success' : member.status === 'Dock Check' ? 'gold' : 'secondary'}>{member.status}</Badge>
              </CardContent>
            </Card>
          </MotionReveal>
        ))}
      </div>
    </div>
  );
}

function AdminPageHeader({ label, title, text, actionLabel }: { label: string; title: string; text: string; actionLabel: string }) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="fine-label">{label}</p>
        <h2 className="mt-2 font-heading text-3xl font-bold text-pearl sm:text-4xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-pearl-muted">{text}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm">
          <Download data-icon aria-hidden="true" />
          Export
        </Button>
        <Button variant="gold" size="sm">
          <Plus data-icon aria-hidden="true" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, delta, detail }: { label: string; value: string; delta: string; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-ocean-glow">
            <BarChart3 data-icon aria-hidden="true" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm">
        <Badge variant="success">{delta}</Badge>
        <span className="text-muted-foreground">{detail}</span>
      </CardContent>
    </Card>
  );
}

function MiniStat({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
        </div>
        <Icon data-icon aria-hidden="true" className="text-ocean-glow" />
      </CardHeader>
    </Card>
  );
}

function RecentBookingsCard() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest customer requests.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/bookings">
            View all
            <ArrowRight data-icon aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <BookingsTable compact />
      </CardContent>
    </Card>
  );
}

function BookingsTable({ compact = false }: { compact?: boolean }) {
  const rows = compact ? bookings.slice(0, 5) : bookings;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Booking ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Activity</TableHead>
          {!compact ? <TableHead>Vehicle</TableHead> : null}
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-semibold text-pearl">{booking.id}</TableCell>
            <TableCell>{booking.customer}</TableCell>
            <TableCell>{booking.activity}</TableCell>
            {!compact ? <TableCell>{booking.vehicle}</TableCell> : null}
            <TableCell>{booking.date}</TableCell>
            <TableCell>{booking.time}</TableCell>
            <TableCell><Badge variant={statusVariant(booking.status)}>{booking.status}</Badge></TableCell>
            <TableCell>AED {booking.amount.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AvailabilityCard() {
  const available = vehicles.filter((vehicle) => vehicle.status === 'Available').length;
  const inUse = vehicles.filter((vehicle) => vehicle.status === 'Booked').length;
  const maintenance = vehicles.filter((vehicle) => vehicle.status === 'Maintenance').length;
  const total = vehicles.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Availability</CardTitle>
        <CardDescription>Current fleet availability snapshot.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
        <div
          className="mx-auto flex size-44 items-center justify-center rounded-full"
          style={{
            background: 'conic-gradient(#0E7C86 0deg 210deg, #D9B56D 210deg 270deg, #E77A63 270deg 330deg, #EAF4F6 330deg)'
          }}
        >
          <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-heading text-3xl font-bold text-pearl">{total}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Legend color="bg-primary" label="Available" value={`${available} (${Math.round((available / total) * 100)}%)`} />
          <Legend color="bg-gold" label="In Use" value={`${inUse} (${Math.round((inUse / total) * 100)}%)`} />
          <Legend color="bg-[#FF795B]" label="Maintenance" value={`${maintenance} (${Math.round((maintenance / total) * 100)}%)`} />
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueCard({ large = false }: { large?: boolean }) {
  const max = Math.max(...reports.revenue.map((item) => item.value));
  return (
    <Card className={large ? 'min-h-[420px]' : undefined}>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue trend.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={large ? 'flex h-72 items-end gap-3' : 'flex h-44 items-end gap-3'}>
          {reports.revenue.map((item) => (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${(item.value / max) * 100}%` }} />
              <span className="text-xs text-muted-foreground">{item.month}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsOverviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings Overview</CardTitle>
        <CardDescription>Weekly volume by activity.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {reports.activities.map((item) => (
          <ProgressMetric key={item.label} label={item.label} value={item.value} />
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Activities</CardTitle>
        <CardDescription>Current activity mix.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {reports.activities.map((item) => (
          <ProgressMetric key={item.label} label={item.label} value={item.value} />
        ))}
      </CardContent>
    </Card>
  );
}

function ProgressMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-pearl">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-pearl-muted">
        <span className={`size-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-pearl">{value}</span>
    </div>
  );
}

function FleetSpec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-[#F7FBFC] p-3">
      <p className="font-heading text-2xl font-bold text-pearl">{value}</p>
      <p className="mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function statusVariant(status: string): 'success' | 'warning' | 'gold' | 'destructive' | 'secondary' {
  if (status === 'Confirmed' || status === 'Available' || status === 'Completed') return 'success';
  if (status === 'Pending' || status === 'Maintenance') return 'warning';
  if (status === 'For Sale') return 'gold';
  if (status === 'Cancelled') return 'destructive';
  return 'secondary';
}
