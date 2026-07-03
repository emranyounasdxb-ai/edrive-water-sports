import type { LucideIcon } from 'lucide-react';
import { BarChart3, CalendarDays, ClipboardCheck, CreditCard, FileClock, Package, Plus, Settings, Ship, UserCog, UsersRound, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusPill = <Badge variant="secondary" className="rounded-full">Database ready</Badge>;

export function AdminDashboardPage() {
  return (
    <AdminPageShell
      label="Dashboard"
      title="Operations overview"
      text="Live dashboard will show booking requests, confirmed rides, revenue, payments, available vehicles, and recent activity after Supabase tables are connected."
      actionLabel="Refresh"
      metrics={[
        ['New Bookings', '0', CalendarDays],
        ['Today Rides', '0', ClipboardCheck],
        ['Pending Payments', 'AED 0.00', WalletCards],
        ['Available Vehicles', '0', Ship]
      ]}
    >
      <EmptyWorkflow title="No live data connected yet" text="Dummy dashboard numbers have been removed. Next step is to connect this page with bookings, payments, vehicles, and staff tables." />
    </AdminPageShell>
  );
}

export function AdminStaffPage() {
  return (
    <AdminPageShell label="Staff / Users" title="Staff and login access" text="Create admins, booking staff, managers, operations staff, and finance users with role-based access." actionLabel="Add Staff" metrics={[["Active Staff", '0', UserCog], ['Managers', '0', UsersRound], ['Inactive Staff', '0', FileClock]]}>
      <SetupTable columns={['Staff Name', 'Role', 'Email / Phone', 'Status']} rows={[]} empty="No staff users added yet." />
    </AdminPageShell>
  );
}

export function AdminPackagesPage() {
  return (
    <AdminPageShell label="Packages / Products" title="Website packages and product cards" text="Add Jet Ski, Jet Car, rental, and sales inquiry packages. Active packages will power website cards and booking selection." actionLabel="Add Package" metrics={[["Active Packages", '0', Package], ['Rental Packages', '0', CalendarDays], ['Sales Inquiries', '0', FileClock]]}>
      <SetupTable columns={['Package', 'Category', 'Duration / Type', 'Price + VAT', 'Status']} rows={[]} empty="No packages added yet." />
    </AdminPageShell>
  );
}

export function AdminVehiclesPage() {
  return (
    <AdminPageShell label="Vehicles / Fleet" title="Vehicle master list" text="Add real Jet Skis and Jet Cars with one main image, capacity, status, and maintenance notes." actionLabel="Add Vehicle" metrics={[["Jet Skis", '0', Ship], ['Jet Cars', '0', Ship], ['Maintenance', '0', Settings]]}>
      <SetupTable columns={['Vehicle Code', 'Vehicle Name', 'Type', 'Capacity', 'Status']} rows={[]} empty="No vehicles added yet." />
    </AdminPageShell>
  );
}

export function AdminBookingsPage() {
  return (
    <AdminPageShell label="Bookings" title="Booking requests" text="Website bookings will appear here for confirmation, cancellation, rescheduling, and handover to manager operations." actionLabel="New Manual Booking" metrics={[["New Requests", '0', CalendarDays], ['Confirmed', '0', ClipboardCheck], ['Cancelled', '0', FileClock]]}>
      <SetupTable columns={['Booking Code', 'Customer', 'Package', 'Date / Time', 'Status']} rows={[]} empty="No booking requests yet." />
    </AdminPageShell>
  );
}

export function AdminSchedulePage() {
  return (
    <AdminPageShell label="Schedule" title="Daily and weekly schedule" text="Calendar view for rides, time slots, assigned vehicles, and manager status updates." actionLabel="Add Schedule Note" metrics={[["Today", '0', CalendarDays], ['Upcoming', '0', FileClock], ['Assigned", "0', ClipboardCheck]]}>
      <EmptyWorkflow title="Schedule is ready for integration" text="Confirmed bookings will populate this page once booking data is connected." />
    </AdminPageShell>
  );
}

export function AdminAssignmentsPage() {
  return (
    <AdminPageShell label="Assignments" title="Vehicle and crew assignment" text="Manager assigns actual vehicles, captain/guide, payment collection, and ride status here." actionLabel="Assign Vehicle" metrics={[["Pending Assignment", '0', ClipboardCheck], ['Assigned Today', '0', Ship], ['Completed', '0', CalendarDays]]}>
      <SetupTable columns={['Booking', 'Package', 'Vehicle', 'Crew', 'Status']} rows={[]} empty="No confirmed bookings pending assignment." />
    </AdminPageShell>
  );
}

export function ManagerOperationsPage() {
  return (
    <AdminPageShell label="Manager" title="Manager operations dashboard" text="Confirmed rides, vehicle assignment, crew assignment, payment collection, and ride completion workflow." actionLabel="Update Status" metrics={[["Confirmed Rides", '0', ClipboardCheck], ['Vehicles Assigned', '0', Ship], ['Payments Pending', 'AED 0.00', CreditCard]]}>
      <EmptyWorkflow title="No confirmed rides yet" text="Confirmed bookings will appear here for manager actions." />
    </AdminPageShell>
  );
}

export function AdminPaymentsPage() {
  return (
    <AdminPageShell label="Payments" title="Payment tracking" text="Track not paid, partial, paid, refunded, payment method, amount paid, balance, and collection notes." actionLabel="Record Payment" metrics={[["Collected", 'AED 0.00', WalletCards], ['Pending', 'AED 0.00', FileClock], ['Refunds', 'AED 0.00', CreditCard]]}>
      <SetupTable columns={['Booking', 'Customer', 'Total', 'Paid', 'Balance', 'Status']} rows={[]} empty="No payment records yet." />
    </AdminPageShell>
  );
}

export function AdminCustomersPage() {
  return (
    <AdminPageShell label="Customers" title="Customer directory" text="Customer records, contact details, booking history, repeat customer status, and admin notes." actionLabel="Add Customer" metrics={[["Customers", '0', UsersRound], ['Repeat Customers', '0', UsersRound], ['VIP", "0', UsersRound]]}>
      <SetupTable columns={['Customer', 'Phone', 'Email', 'Bookings', 'Status']} rows={[]} empty="No customer records yet." />
    </AdminPageShell>
  );
}

export function AdminMaintenancePage() {
  return (
    <AdminPageShell label="Maintenance" title="Vehicle maintenance" text="Track vehicle issues, maintenance dates, costs, status, and available-again dates." actionLabel="Add Maintenance" metrics={[["Open Issues", '0', Settings], ['In Service', '0', Ship], ['Closed', '0', ClipboardCheck]]}>
      <SetupTable columns={['Vehicle', 'Issue', 'Date', 'Cost', 'Status']} rows={[]} empty="No maintenance records yet." />
    </AdminPageShell>
  );
}

export function AdminReportsPage() {
  return (
    <AdminPageShell label="Reports" title="Business reports" text="Daily revenue, monthly revenue, bookings by package, bookings by vehicle, payment reports, cancellations, and staff performance." actionLabel="Export" metrics={[["Revenue", 'AED 0.00', BarChart3], ['Bookings', '0', CalendarDays], ['Vehicle Usage', '0%', Ship]]}>
      <EmptyWorkflow title="Reports will use live database records" text="Dummy charts have been removed. Report charts will be added after bookings, payments, and assignments are connected." />
    </AdminPageShell>
  );
}

export function AdminSettingsPage() {
  return (
    <AdminPageShell label="Settings" title="Company and booking settings" text="Manage company details, WhatsApp, email, VAT percentage, meeting point, booking terms, and cancellation policy." actionLabel="Save Settings" metrics={[["VAT", '5%', Settings], ['Booking Flow', 'Ready', ClipboardCheck], ['Location', 'Set', Ship]]}>
      <SetupTable columns={['Setting', 'Current Value', 'Status']} rows={[]} empty="Settings fields are ready for Supabase connection." />
    </AdminPageShell>
  );
}

export function AdminInventoryPage() { return <AdminPackagesPage />; }
export function AdminCouponsPage() { return <AdminPackagesPage />; }
export function AdminReviewsPage() { return <AdminCustomersPage />; }

function AdminPageShell({ label, title, text, actionLabel, metrics, children }: { label: string; title: string; text: string; actionLabel: string; metrics: Array<[string, string, LucideIcon]>; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</span>{statusPill}</div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
        <Button type="button"><Plus data-icon aria-hidden="true" />{actionLabel}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map(([metric, value, Icon]) => <Card key={metric}><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{metric}</p><p className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span></CardContent></Card>)}
      </div>

      {children}
    </div>
  );
}

function EmptyWorkflow({ title, text }: { title: string; text: string }) {
  return <Card><CardContent className="p-8 text-center"><p className="font-heading text-xl font-semibold text-foreground">{title}</p><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{text}</p></CardContent></Card>;
}

function SetupTable({ columns, rows, empty }: { columns: string[]; rows: string[][]; empty: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Records</CardTitle>
        <CardDescription>Live records will show here after database connection.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.length ? rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={`${index}-${cellIndex}`}>{cell}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">{empty}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
