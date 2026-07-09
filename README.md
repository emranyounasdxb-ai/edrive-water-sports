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

## Booking operations workflow

1. Customer creates the booking from the website.
2. Booking is saved as Pending and appears in Admin New/Pending Bookings.
3. Admin checks customer details, coupon, date, time, and confirms availability.
4. Confirmed booking moves to Manager/Operations queue.
5. Manager receives the guest and checks the booking in.
6. Manager selects the actual available vehicle at handover time.
7. Manager completes the ride and must enter payment details.
8. Direct cash/card payments stay under manager collection until Admin receives them.
9. B2B payments create an invoice for the selected B2B agent and show in the agent portal.
10. Payments tab shows manager-held collections and B2B receivables until Admin/Finance settles them.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `database/001_extensions.sql`.
4. Run `database/002_schema.sql`.
5. Run `database/003_rls.sql`.
6. Run `database/004_functions.sql`.
7. Run `database/005_booking_b2b_payment_workflow.sql`.
8. Create a staff user in Supabase Auth.
9. Copy the Auth user UUID.
10. Insert the staff profile in `public.users` with an Admin role.
11. Create a public Storage bucket named `vehicle-images` for vehicle gallery assets.

Example staff seed:

```sql
insert into public.users (id, email, full_name, role_id, is_active)
select
  'AUTH_USER_UUID_HERE',
  'admin@edrivewatersports.com',
  'System Admin',
  id,
  true
from public.roles
where slug = 'admin';
```

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
- All public booking writes are done through a database RPC function.
- Double booking is prevented by a PostgreSQL exclusion constraint.
- Manager completion creates direct payment collection records or B2B agent invoices.
- Admin/Finance settlement closes manager collections and B2B receivables.

## Production modules

- Public website
- Booking system
- Staff authentication
- Admin dashboard
- Manager operations workflow
- B2B agent portal invoices
- Vehicle inventory
- Coupons
- Payments and collections
- Reports
- Notification abstraction
- Audit logs
- SEO metadata
