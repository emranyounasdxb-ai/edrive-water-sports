import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgePercent,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  FileClock,
  Filter,
  MessageSquare,
  MoreHorizontal,
  Package,
  Plus,
  Ship,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  WalletCards
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookings, coupons, inventoryItems, jetCarLightImage, jetSkiLightImage, reports, staff, vehicles } from '@/lib/mock-data';
import { MotionReveal } from './motion-reveal';

const chartDays = ['May 10', 'May 11', 'May 12', 'May 13', 'May 14', 'May 15', 'May 16'];
const bookingsLine = [112, 246, 268, 338, 282, 286, 322];
const confirmedLine = [92, 172, 180, 225, 178, 202, 222];
const cancelledLine = [34, 48, 36, 54, 62, 42, 58];
const revenueLine = [24000, 27000, 43000, 48200, 72400, 42800, 21400];

const dashboardMetrics = [
  { title: 'Total Bookings', value: '1,248', detail: '18.6% vs last 7 days', icon: CalendarDays, tone: 'teal' },
  { title: "Today's Revenue", value: 'AED 54,320', detail: '22.4% vs yesterday', icon: DollarSign, tone: 'teal' },
  { title: 'Fleet Available', value: '28 / 40', detail: '70% available', icon: Ship, tone: 'teal' },
  { title: 'Pending Confirmations', value: '37', detail: '6 vs yesterday', icon: FileClock, tone: 'gold' }
];

export function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <MotionReveal key={metric.title} delay={index * 0.04}>
            <DashboardMetricCard {...metric} />
          </MotionReveal>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.18fr_1fr] 2xl:grid-cols-[1.2fr_1fr_0.95fr]">
        <PremiumChartCard title="Bookings Overview" icon={CalendarDays} action="Last 7 Days">
          <LineChart lines={[bookingsLine, confirmedLine, cancelledLine]} labels={chartDays} height={212} />
        </PremiumChartCard>
        <PremiumChartCard title="Revenue Trend" icon={DollarSign} action="Last 7 Days">
          <LineChart lines={[revenueLine]} labels={chartDays} height={212} maxValue={80000} money />
        </PremiumChartCard>
        <FleetAvailabilityPanel />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1.45fr_0.78fr_0.78fr]">
        <RecentBookingsCard />
        <ScheduleCard />
        <NotificationsCard />
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
          <Button variant="outline" size="sm"><Filter data-icon aria-hidden="true" />Filter</Button>
        </CardHeader>
        <CardContent><BookingsTable /></CardContent>
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
            <Card className="h-full overflow-hidden">
              <div className="m-4 h-40 overflow-hidden rounded-[1.5rem] bg-primary-50">
                <img src={vehicle.image} alt="" className="h-full w-full object-cover" />
              </div>
              <CardHeader className="pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant={statusVariant(vehicle.status)}>{vehicle.status}</Badge>
                    <CardTitle className="mt-3">{vehicle.name}</CardTitle>
                    <CardDescription>{vehicle.category} · {vehicle.id}</CardDescription>
                  </div>
                  <Ship data-icon aria-hidden="true" className="text-primary" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <FleetSpec label="Seats" value={vehicle.seats} />
                  <FleetSpec label="HP" value={vehicle.horsepower} />
                  <FleetSpec label={vehicle.status === 'For Sale' ? 'Price' : 'Rate'} value={vehicle.status === 'For Sale' ? `${Math.round(vehicle.hourlyRate / 1000)}K` : vehicle.hourlyRate} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{vehicle.description}</p>
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
        <CardHeader><CardTitle>Inventory Items</CardTitle><CardDescription>Reorder thresholds and current stock health.</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Quantity</TableHead><TableHead>Reorder At</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{inventoryItems.map((item) => <TableRow key={item.sku}><TableCell className="font-semibold text-foreground">{item.sku}</TableCell><TableCell>{item.item}</TableCell><TableCell>{item.category}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.reorderAt}</TableCell><TableCell><Badge variant={item.status === 'Low' ? 'warning' : item.status === 'Watch' ? 'gold' : 'success'}>{item.status}</Badge></TableCell></TableRow>)}</TableBody>
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
              <CardHeader><div className="flex items-start justify-between gap-4"><Badge variant={coupon.status === 'Active' ? 'success' : coupon.status === 'Draft' ? 'secondary' : 'warning'}>{coupon.status}</Badge><BadgePercent data-icon aria-hidden="true" className="text-gold" /></div><CardTitle>{coupon.code}</CardTitle><CardDescription>{coupon.name}</CardDescription></CardHeader>
              <CardContent className="flex flex-col gap-4"><p className="font-heading text-3xl font-bold text-foreground">{coupon.type}</p><ProgressBar value={(coupon.uses / coupon.limit) * 100} /><div className="flex justify-between text-xs text-muted-foreground"><span>{coupon.uses} uses</span><span>Limit {coupon.limit}</span></div><p className="text-sm text-muted-foreground">Expires {coupon.expires}</p></CardContent>
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
        <PremiumChartCard title="Revenue Overview" icon={TrendingUp} action="Monthly"><LineChart lines={[[62000, 71000, 84000, 78000, 92400, 98450]]} labels={reports.revenue.map((item) => item.month)} height={292} maxValue={100000} money /></PremiumChartCard>
        <Card><CardHeader><CardTitle>Location Split</CardTitle><CardDescription>Booking share by dock point.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5">{reports.locations.map((item) => <ProgressMetric key={item.label} label={item.label} value={item.value} />)}</CardContent></Card>
      </div>
      <div className="grid gap-6 md:grid-cols-3"><MiniStat title="Avg. Order Value" value="AED 769" icon={WalletCards} /><MiniStat title="Peak Slot" value="6:30 PM" icon={CalendarDays} /><MiniStat title="Repeat Guests" value="34%" icon={Users} /></div>
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
            <Card className="h-full"><CardHeader><div className="flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary"><UserCog data-icon aria-hidden="true" /></div><CardTitle>{member.name}</CardTitle><CardDescription>{member.role}</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><InfoRow label="Shift" value={member.shift} /><InfoRow label="Tasks" value={member.tasks} /><Badge variant={member.status === 'On Duty' ? 'success' : member.status === 'Dock Check' ? 'gold' : 'secondary'}>{member.status}</Badge></CardContent></Card>
          </MotionReveal>
        ))}
      </div>
    </div>
  );
}

function DashboardMetricCard({ title, value, detail, icon: Icon, tone }: { title: string; value: string; detail: string; icon: LucideIcon; tone: string }) {
  const isGold = tone === 'gold';
  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className={isGold ? 'metric-icon-gold' : 'metric-icon-teal'}><Icon className="size-6" aria-hidden="true" /></div>
          <div><p className="text-sm font-medium text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{value}</p><p className={isGold ? 'mt-1 text-xs font-bold text-amber-600' : 'mt-1 text-xs font-bold text-emerald-600'}>{isGold ? '↓' : '↑'} {detail}</p></div>
        </div>
        <MiniSparkline tone={tone} />
      </CardContent>
    </Card>
  );
}

function PremiumChartCard({ title, icon: Icon, action, children }: { title: string; icon: LucideIcon; action: string; children: React.ReactNode }) {
  return <Card className="min-h-[290px]"><CardHeader className="flex-row items-center justify-between pb-2"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><CardTitle className="text-base">{title}</CardTitle></div><Button variant="outline" size="sm" className="h-8 text-xs">{action}</Button></CardHeader><CardContent>{children}</CardContent></Card>;
}

function FleetAvailabilityPanel() {
  const items = [
    { title: 'Jet Ski', count: '18 / 25', percent: 72, image: jetSkiLightImage },
    { title: 'Jet Car', count: '10 / 15', percent: 67, image: jetCarLightImage }
  ];
  return <Card><CardHeader className="flex-row items-center justify-between pb-2"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><ShieldCheck className="size-4" aria-hidden="true" /></span><CardTitle className="text-base">Fleet Availability</CardTitle></div><Link href="/admin/vehicles" className="text-xs font-bold text-primary">View Fleet</Link></CardHeader><CardContent className="flex flex-col gap-3">{items.map((item) => <div key={item.title} className="rounded-[1.35rem] border border-border bg-white/80 p-3 shadow-sm"><div className="grid gap-4 sm:grid-cols-[9rem_1fr]"><img src={item.image} alt="" className="h-24 w-full rounded-2xl object-cover" /><div className="flex flex-col justify-center"><div className="flex items-center justify-between gap-2"><h3 className="font-heading text-xl font-bold text-foreground">{item.title}</h3><Badge variant="success" className="rounded-full">Available</Badge></div><p className="mt-1 font-heading text-3xl font-bold text-foreground">{item.count}</p><p className="mt-1 text-xs text-muted-foreground">{item.percent}% Available</p><ProgressBar value={item.percent} /></div></div></div>)}</CardContent></Card>;
}

function RecentBookingsCard() {
  return <Card><CardHeader className="flex-row items-center justify-between pb-2"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><CalendarDays className="size-4" aria-hidden="true" /></span><CardTitle className="text-base">Recent Bookings</CardTitle></div><Button asChild variant="ghost" size="sm"><Link href="/admin/bookings">View All Bookings</Link></Button></CardHeader><CardContent><BookingsTable compact /></CardContent></Card>;
}

function ScheduleCard() {
  const items = [
    ['10:00 AM', 'Jet Ski Tour', '2 Bookings', 'bg-primary'],
    ['12:00 PM', 'Jet Car Experience', '3 Bookings', 'bg-gold'],
    ['02:00 PM', 'Sunset Adventure', '4 Bookings', 'bg-primary'],
    ['04:00 PM', 'Marina Thrill Ride', '2 Bookings', 'bg-primary']
  ];
  return <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><CalendarDays className="size-4" aria-hidden="true" /></span><CardTitle className="text-base">Schedule</CardTitle></div></div></CardHeader><CardContent><div className="rounded-[1.4rem] border border-border bg-white/70 p-4"><div className="mb-4 flex items-center justify-between text-sm font-bold text-foreground"><ChevronLeft className="size-4" aria-hidden="true" /><span>May 16, 2026</span><ChevronRight className="size-4" aria-hidden="true" /></div><div className="flex flex-col gap-4">{items.map(([time, title, count, dot]) => <div key={time} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-xs"><span className="text-muted-foreground">{time}</span><span className="flex items-center gap-2 font-semibold text-foreground"><span className={`size-2 rounded-full ${dot}`} />{title}</span><span className="text-muted-foreground">{count}</span></div>)}</div></div></CardContent></Card>;
}

function NotificationsCard() {
  const items = [
    { icon: MessageSquare, title: 'New booking request', text: 'Jet Ski on May 17, 10:00 AM', time: '5m ago', dot: 'bg-primary' },
    { icon: WalletCards, title: 'Payment received', text: 'AED 1,450 from James Smith', time: '15m ago', dot: 'bg-primary' },
    { icon: Bell, title: 'Fleet maintenance due', text: 'Jet Ski #JS-07 in 2 days', time: '1h ago', dot: 'bg-gold' }
  ];
  return <Card><CardHeader className="flex-row items-center justify-between pb-2"><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-xl bg-primary-50 text-primary"><Bell className="size-4" aria-hidden="true" /></span><CardTitle className="text-base">Notifications</CardTitle></div><Link href="/admin" className="text-xs font-bold text-primary">View All</Link></CardHeader><CardContent className="flex flex-col gap-3">{items.map((item) => <NotificationItem key={item.title} {...item} />)}<Button variant="outline" size="sm" className="mt-1 w-full">View All Notifications</Button></CardContent></Card>;
}

function NotificationItem({ icon: Icon, title, text, time, dot }: { icon: LucideIcon; title: string; text: string; time: string; dot: string }) {
  return <div className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-white/75 p-3"><span className="flex size-10 items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{title}</p><p className="truncate text-xs text-muted-foreground">{text}</p></div><div className="flex flex-col items-end gap-2"><span className="text-[11px] text-muted-foreground">{time}</span><span className={`size-2 rounded-full ${dot}`} /></div></div>;
}

function BookingsTable({ compact = false }: { compact?: boolean }) {
  const rows = compact ? bookings.slice(0, 5) : bookings;
  return <Table><TableHeader><TableRow><TableHead>Guest Name</TableHead><TableHead>Vehicle</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.map((booking) => <TableRow key={booking.id}><TableCell><div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">{booking.customer.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="font-semibold text-foreground">{booking.customer}</span></div></TableCell><TableCell>{booking.activity}</TableCell><TableCell>{booking.date}</TableCell><TableCell>{booking.time}</TableCell><TableCell><Badge variant={statusVariant(booking.status)} className="rounded-full">{booking.status}</Badge></TableCell><TableCell>AED {booking.amount.toLocaleString()}</TableCell><TableCell><MoreHorizontal className="size-4 text-muted-foreground" aria-hidden="true" /></TableCell></TableRow>)}</TableBody></Table>;
}

function MiniStat({ title, value, icon: Icon }: { title: string; value: string; icon: LucideIcon }) { return <Card><CardHeader className="flex-row items-center justify-between"><div><CardDescription>{title}</CardDescription><CardTitle className="mt-2 text-3xl">{value}</CardTitle></div><Icon data-icon aria-hidden="true" className="text-primary" /></CardHeader></Card>; }
function InfoRow({ label, value }: { label: string; value: string | number }) { return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground">{value}</span></div>; }
function AdminPageHeader({ label, title, text, actionLabel }: { label: string; title: string; text: string; actionLabel: string }) { return <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="fine-label">{label}</p><h2 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{text}</p></div><div className="flex gap-3"><Button variant="outline" size="sm"><Download data-icon aria-hidden="true" />Export</Button><Button variant="gold" size="sm"><Plus data-icon aria-hidden="true" />{actionLabel}</Button></div></div>; }
function ProgressMetric({ label, value }: { label: string; value: number }) { return <div className="flex flex-col gap-2"><div className="flex justify-between text-sm"><span className="font-semibold text-foreground">{label}</span><span className="text-muted-foreground">{value}%</span></div><ProgressBar value={value} /></div>; }
function ProgressBar({ value }: { value: number }) { return <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value, 100)}%` }} /></div>; }
function FleetSpec({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-border bg-[#F7FBFC] p-3"><p className="font-heading text-2xl font-bold text-foreground">{value}</p><p className="mt-1 text-muted-foreground">{label}</p></div>; }

function LineChart({ lines, labels, height, maxValue, money = false }: { lines: number[][]; labels: string[]; height: number; maxValue?: number; money?: boolean }) {
  const max = maxValue ?? Math.max(...lines.flat());
  const width = 560;
  const chartHeight = height - 34;
  const points = (values: number[]) => values.map((value, index) => `${(index / (values.length - 1)) * width},${chartHeight - (value / max) * (chartHeight - 18)}`).join(' ');
  return <div className="w-full overflow-hidden"><svg viewBox={`0 0 ${width} ${height}`} className="h-[230px] w-full"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0E7C86" stopOpacity="0.20" /><stop offset="100%" stopColor="#0E7C86" stopOpacity="0" /></linearGradient></defs>{[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={width} y1={(chartHeight / 4) * line + 8} y2={(chartHeight / 4) * line + 8} stroke="#E8EEF0" strokeWidth="1" />)}{lines.map((line, index) => <g key={index}><polyline fill="none" points={points(line)} stroke={index === 2 ? '#B9D5DA' : index === 1 ? '#2AAFC0' : '#0E9EB0'} strokeDasharray={index === 2 ? '5 5' : undefined} strokeWidth={index === 2 ? '2' : '3'} strokeLinecap="round" strokeLinejoin="round" />{index === 0 ? <polygon points={`0,${chartHeight} ${points(line)} ${width},${chartHeight}`} fill="url(#chartFill)" /> : null}</g>)}{labels.map((label, index) => <text key={label} x={(index / (labels.length - 1)) * width} y={height - 6} textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[11px]">{label}</text>)}{money ? <text x="0" y="14" className="fill-muted-foreground text-[11px]">AED</text> : null}</svg></div>;
}

function MiniSparkline({ tone }: { tone: string }) { return <svg viewBox="0 0 82 34" className="hidden h-10 w-24 sm:block"><polyline points="2,24 16,18 28,20 40,10 54,14 68,8 80,16" fill="none" stroke={tone === 'gold' ? '#D9B56D' : '#0E9EB0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 24 C16 18 28 20 40 10 C54 14 68 8 80 16 L80 34 L2 34 Z" fill={tone === 'gold' ? 'rgba(217,181,109,0.14)' : 'rgba(14,158,176,0.14)'} /></svg>; }

function statusVariant(status: string): 'success' | 'warning' | 'gold' | 'destructive' | 'secondary' {
  if (status === 'Confirmed' || status === 'Available' || status === 'Completed') return 'success';
  if (status === 'Pending' || status === 'Maintenance') return 'warning';
  if (status === 'For Sale') return 'gold';
  if (status === 'Cancelled') return 'destructive';
  return 'secondary';
}
