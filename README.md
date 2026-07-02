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

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `database/001_extensions.sql`.
4. Run `database/002_schema.sql`.
5. Run `database/003_rls.sql`.
6. Run `database/004_functions.sql`.
7. Create a staff user in Supabase Auth.
8. Copy the Auth user UUID.
9. Insert the staff profile in `public.users` with an Admin role.
10. Create a public Storage bucket named `vehicle-images` for vehicle gallery assets.

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

## Production modules

- Public website
- Booking system
- Staff authentication
- Admin dashboard
- Vehicle inventory
- Coupons
- Reports
- Notification abstraction
- Audit logs
- SEO metadata
