-- eDrive fleet lifecycle enum prerequisite.
-- Run this file as a separate SQL Editor query BEFORE fleet-asset-hardening.sql.
-- Do not wrap these statements in BEGIN/COMMIT. The new enum values must be
-- committed before another migration can write rows using them.

alter type public.vehicle_status add value if not exists 'reserved';
alter type public.vehicle_status add value if not exists 'assigned';
alter type public.vehicle_status add value if not exists 'in_use';
alter type public.vehicle_status add value if not exists 'out_of_service';
alter type public.vehicle_status add value if not exists 'retired';
