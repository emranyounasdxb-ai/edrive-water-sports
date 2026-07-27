'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { dubaiDateParts, dubaiDateValue } from '@/lib/public-request-validation';
import { cn } from '@/lib/utils';

export type AppDatePickerProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  triggerClassName?: string;
};

function displayDate(value: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dubai'
  }).format(new Date(`${value}T12:00:00+04:00`));
}

function monthKey(value: string | undefined) {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

export function AppDatePicker({
  label,
  value,
  placeholder,
  onChange,
  minDate,
  maxDate,
  triggerClassName
}: AppDatePickerProps) {
  const today = dubaiDateValue();
  const todayParts = dubaiDateParts();
  const selectedParts = value ? value.split('-').map(Number) : null;
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(
    selectedParts?.[0] || todayParts.year,
    (selectedParts?.[1] || todayParts.month) - 1,
    1
  ));
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ left: 16, top: 72, width: 320 });

  useEffect(() => {
    if (!open) return;
    const positionPopover = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 32);
      const left = Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16));
      const estimatedHeight = 330;
      const below = rect.bottom + 8;
      const top = below + estimatedHeight <= window.innerHeight
        ? below
        : Math.max(16, rect.top - estimatedHeight - 8);
      setPopoverPosition({ left, top, width });
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', positionPopover);
    window.addEventListener('scroll', positionPopover, true);
    positionPopover();
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', positionPopover);
      window.removeEventListener('scroll', positionPopover, true);
    };
  }, [open]);

  useEffect(() => {
    if (!value) return;
    const [year, month] = value.split('-').map(Number);
    setVisibleMonth(new Date(year, month - 1, 1));
  }, [value]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const visibleMonthKey = year * 12 + month;
  const minimumMonthKey = monthKey(minDate);
  const maximumMonthKey = monthKey(maxDate);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  function selectDate(nextValue: string) {
    if ((minDate && nextValue < minDate) || (maxDate && nextValue > maxDate)) return;
    onChange(nextValue);
    setOpen(false);
  }

  function clearValue() {
    onChange('');
    setOpen(false);
  }

  return (
    <div className="grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <div ref={pickerRef} className="relative min-w-0">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn('flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:border-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2', value && 'pr-14', triggerClassName)}
        >
          <CalendarDays className="size-4 shrink-0 text-teal-700" />
          <span className={cn('min-w-0 flex-1 truncate', !value && 'text-slate-400')}>{value ? displayDate(value) : placeholder}</span>
          <ChevronDown className={cn('size-3.5 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
        </button>
        {value ? (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onClick={(event) => {
              event.stopPropagation();
              clearValue();
            }}
            className="absolute right-7 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        {open ? createPortal(
          <div ref={popoverRef} role="dialog" aria-label={`${label} calendar`} className="fixed z-[120] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_20px_55px_rgba(15,23,42,0.18)]" style={popoverPosition}>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Previous month" disabled={minimumMonthKey !== null && visibleMonthKey <= minimumMonthKey} onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="size-4" /></button>
              <p className="text-sm font-bold text-slate-900">{visibleMonth.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}</p>
              <button type="button" aria-label="Next month" disabled={maximumMonthKey !== null && visibleMonthKey >= maximumMonthKey} onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="size-4" /></button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}</div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const disabled = Boolean((minDate && iso < minDate) || (maxDate && iso > maxDate));
                const selected = value === iso;
                const isToday = today === iso;
                return <button key={iso} type="button" disabled={disabled} aria-label={displayDate(iso)} aria-pressed={selected} onClick={() => selectDate(iso)} className={cn('relative aspect-square rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1', selected ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-700 hover:bg-teal-50', isToday && !selected && 'bg-teal-50 font-extrabold text-teal-800 ring-1 ring-inset ring-teal-300', disabled && 'cursor-not-allowed bg-transparent text-slate-300 hover:bg-transparent')}>{day}{selected ? <Check className="absolute right-0.5 top-0.5 size-2.5" /> : null}</button>;
              })}
            </div>
          </div>,
          document.body
        ) : null}
      </div>
    </div>
  );
}
