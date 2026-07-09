# eDrive Water Sports

Production-ready static Next.js booking platform for a luxury water sports company in Dubai.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui component pattern
- Framer Motion
- Lucide Icons
- React Hook Form
- Zod
- Supabase Auth, PostgreSQL, RLS, Storage
- Static export build for cPanel hosting

## Architecture

The application uses feature-based modular architecture. Public pages are static and fetch runtime data directly from Supabase using the browser client and the public anon key. Staff/admin pages are protected by Supabase Auth and database RLS policies.

No API routes, server actions, Express, Laravel, or Node.js backend runtime are used.

```txt
app/
components/
features/
  booking/
  admin/
  inventory/
  vehicles/
  coupons/
  reports/
  staff/
  auth/
lib/
services/
hooks/
types/
utils/
config/
styles/
public/
database/
```

## Active booking data flow

The live website and Admin Bookings page use `public.booking_requests` as the active booking table.

- Public booking form saves requests through `components/edrive/booking/booking-success.tsx`.
- Row mapping is handled in `lib/booking-records.ts`.
- Admin bookings are managed in `components/edrive/admin-bookings-page.tsx`.
- The manager/payment workflow fields are added by `database/015_booking_requests_workflow_alignment.sql`.

The older `public.bookings` workflow migrations are kept for reference and should not be used for the live website booking panel unless the application is intentionally migrated away from `booking_requests`.

## Booking operations workflow

1. Customer creates the booking from the website.
2. Booking is saved as Pending and appears in Admin New/Pending Bookings.
3. Admin checks customer details, package, date, time, and confirms availability.
4. Confirmed booking moves to Manager/Operations status.
5. Manager receives the guest and marks customer arrival.
6. Manager records the assigned vehicle at handover time.
7. Manager completes the ride and enters payment details.
8. Direct cash/card payments stay under manager collection until Admin receives them.
9. B2B payments can be marked against the selected B2B agent name until settlement.
10. Admin/Finance marks collections as received/settled in the booking workflow.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run the existing base schema migrations already required for the public website.
4. Run `database/015_booking_requests_workflow_alignment.sql` to align the live Admin Bookings workflow with `booking_requests`.
5. Create a staff user in Supabase Auth if admin authentication is enabled.
6. Create a public Storage bucket named `vehicle-images` for vehicle gallery assets if vehicle images are managed from Supabase.

## Environment variables

Create `.env.local` during development:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://edrivewatersports.com
```

Never expose the Supabase service role key in this project.

## Local development

```bash
npm install
npm run dev
```

## Static build for cPanel

```bash
npm run build
```

Upload the generated `out/` folder contents to cPanel `public_html`.

## Deployment notes

- Build output is static HTML/CSS/JS.
- Supabase handles database, auth, storage, and row-level authorization.
- Public booking writes are saved to `booking_requests` from the browser client.
- Admin booking workflow updates are saved back to `booking_requests`.
- Manager collection, B2B source, and settlement status are tracked on each booking request row.

## Production modules

- Public website
- Booking system
- Staff authentication
- Admin dashboard
- Manager operations workflow
- B2B tracking fields
- Vehicle inventory
- Coupons
- Payments and collections
- Reports
- Notification abstraction
- Audit logs
- SEO metadata
