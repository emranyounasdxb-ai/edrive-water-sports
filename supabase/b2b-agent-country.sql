alter table public.b2b_agents
  add column if not exists country text;

comment on column public.b2b_agents.country is
  'Country selected for the B2B partner or company profile.';
