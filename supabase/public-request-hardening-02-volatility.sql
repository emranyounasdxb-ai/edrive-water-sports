-- Apply immediately after public-request-hardening.sql.
-- The booking lookup now records throttling attempts, so it must be VOLATILE.

begin;
alter function public.track_booking(text, text) volatile;
commit;
