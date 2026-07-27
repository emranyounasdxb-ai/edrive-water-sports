'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { timeSlots } from '@/lib/booking-data';
import { dubaiDateParts, dubaiDateValue, isSelectableDubaiBookingTime } from '@/lib/public-request-validation';
import { cn } from '@/lib/utils';

type AgentSchedulePickerProps = {
  date: string;
  time: string;
  now: Date;
  error?: string;
  onChange: (date: string, time: string) => void;
};

function dateLabel(value: string) {
  if (!value) return 'Choose a date';
  return new Intl.DateTimeFormat('en-AE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dubai'
  }).format(new Date(`${value}T12:00:00+04:00`));
}

export function AgentSchedulePicker({ date, time, now, error, onChange }: AgentSchedulePickerProps) {
  const today = dubaiDateValue(now);
  const todayParts = dubaiDateParts(now);
  const selectedParts = date ? date.split('-').map(Number) : null;
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(
    selectedParts?.[0] || todayParts.year,
    (selectedParts?.[1] || todayParts.month) - 1,
    1
  ));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!date) return;
    const [year, month] = date.split('-').map(Number);
    setVisibleMonth(new Date(year, month - 1, 1));
  }, [date]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const minMonthKey = todayParts.year * 12 + todayParts.month - 1;
  const visibleMonthKey = year * 12 + month;
  const availableSlots = useMemo(
    () => timeSlots.filter((slot) => isSelectableDubaiBookingTime(date, slot, now)),
    [date, now]
  );

  function selectDate(nextDate: string) {
    const nextTime = time && isSelectableDubaiBookingTime(nextDate, time, now) ? time : '';
    onChange(nextDate, nextTime);
    setOpen(false);
  }

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold">Schedule</h2>
      <p className="mt-1 text-sm text-slate-500">Times are shown in Dubai time (GST).</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">Preferred Date</p>
          <div ref={popoverRef} className="relative">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2.5"><CalendarDays className="size-4 text-teal-700" />{dateLabel(date)}</span>
              <ChevronRight className={cn('size-4 text-slate-400 transition', open && 'rotate-90')} />
            </button>
            {open ? (
              <div role="dialog" aria-label="Choose preferred date" className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_20px_55px_rgba(15,23,42,0.18)] sm:w-[330px]">
                <div className="flex items-center justify-between">
                  <button type="button" aria-label="Previous month" disabled={visibleMonthKey <= minMonthKey} onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="size-4" /></button>
                  <p className="text-sm font-bold text-slate-900">{visibleMonth.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}</p>
                  <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><ChevronRight className="size-4" /></button>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}</div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: startDay }).map((_, index) => <span key={`blank-${index}`} />)}
                  {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const disabled = iso < today;
                    const selected = date === iso;
                    const isToday = iso === today;
                    return <button key={iso} type="button" disabled={disabled} aria-label={dateLabel(iso)} aria-pressed={selected} onClick={() => selectDate(iso)} className={cn('relative aspect-square rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1', selected ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-700 hover:bg-teal-50', isToday && !selected && 'bg-teal-50 font-extrabold text-teal-800 ring-1 ring-inset ring-teal-300', disabled && 'cursor-not-allowed bg-transparent text-slate-300 hover:bg-transparent')}>{day}{selected ? <Check className="absolute right-0.5 top-0.5 size-2.5" /> : null}</button>;
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2"><Clock3 className="size-4 text-teal-700" /><p className="text-sm font-semibold text-slate-800">Available Time</p></div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Available Dubai time slots">
            {timeSlots.map((slot) => {
              const disabled = !date || !isSelectableDubaiBookingTime(date, slot, now);
              const selected = time === slot;
              return <button key={slot} type="button" disabled={disabled} aria-pressed={selected} onClick={() => onChange(date, slot)} className={cn('h-9 rounded-lg border px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2', selected ? 'border-teal-700 bg-teal-700 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50', disabled && 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through hover:border-slate-100 hover:bg-slate-50')}>{slot}</button>;
            })}
          </div>
          {date === today && availableSlots.length === 0 ? <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">No more booking slots are available today. Please select another date.</p> : null}
        </div>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </section>
  );
}
