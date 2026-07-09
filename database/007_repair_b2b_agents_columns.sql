alter table public.b2b_agents
  add column if not exists portal_user_id uuid unique references public.users(id) on delete set null,
  add column if not exists company_name text,
  add column if not exists contact_person text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists billing_email text,
  add column if not exists commission_type public.discount_type not null default 'percentage',
  add column if not exists commission_value numeric(12,2) not null default 0,
  add column if not exists credit_limit_aed numeric(12,2) not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_by uuid references public.users(id),
  add column if not exists updated_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists b2b_agents_active_idx
on public.b2b_agents(is_active);
