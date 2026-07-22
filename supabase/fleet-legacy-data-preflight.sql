-- eDrive fleet legacy-data preflight.
-- Run AFTER fleet-status-enum-values.sql and BEFORE fleet-asset-hardening.sql.
-- This file is intentionally rerunnable. It preserves fleet rows and clears only
-- invalid legacy tracker identifiers that cannot satisfy the new 10-20 digit rule.

begin;

alter table public.vehicles
  add column if not exists updated_at timestamptz not null default now();

-- A validation trigger may exist from an earlier rollout attempt. Disable it only
-- while legacy identifiers are being cleaned. fleet-asset-hardening.sql recreates it.
drop trigger if exists vehicles_validate_identifiers_trigger on public.vehicles;

update public.vehicles
set device_imei = null,
    notes = case
      when lower(coalesce(notes, '')) like '%invalid legacy tracker imei removed%'
        then notes
      else concat_ws(
        E'\n',
        nullif(btrim(coalesce(notes, '')), ''),
        'System alert: invalid legacy tracker IMEI removed. Assign a unique 10-20 digit tracker IMEI before saving the fleet profile.'
      )
    end,
    updated_at = now()
where nullif(regexp_replace(coalesce(device_imei, ''), '[^0-9]', '', 'g'), '') is not null
  and length(regexp_replace(coalesce(device_imei, ''), '[^0-9]', '', 'g')) not between 10 and 20;

-- A previous rollout attempt may already have created these RLS policies. Remove
-- only the named fleet policies so fleet-asset-hardening.sql can recreate them.
do $$
begin
  if to_regclass('public.fleet_asset_audit_logs') is not null then
    execute 'drop policy if exists fleet_asset_audit_staff_select on public.fleet_asset_audit_logs';
  end if;

  if to_regclass('public.fleet_maintenance_logs') is not null then
    execute 'drop policy if exists fleet_maintenance_staff_select on public.fleet_maintenance_logs';
  end if;
end
$$;

-- Restore the existing validation trigger immediately when its function already
-- exists. This keeps the table protected even if the following main migration
-- later stops for an unrelated schema difference.
do $$
begin
  if to_regprocedure('public.validate_fleet_asset_identifiers()') is not null then
    execute 'create trigger vehicles_validate_identifiers_trigger before insert or update on public.vehicles for each row execute function public.validate_fleet_asset_identifiers()';
  end if;
end
$$;

commit;

-- Optional inspection after success:
select vehicle_code, reg_no, device_imei, notes
from public.vehicles
where lower(coalesce(notes, '')) like '%invalid legacy tracker imei removed%'
order by vehicle_code;
