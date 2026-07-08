'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Mail, MapPin, Minus, Phone, Plus, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { durationPackages, experienceOptions, formatAed, formatDuration, generateBookingCode, getBookingTotals, getCapacityPerVehicle, getExperience, getSelectedRateForDuration, initialBookingDraft, inquiryTypes, timeSlots } from '@/lib/booking-data';
import type { BookingDraft, BookingRateOption, BookingRequest } from '@/lib/booking-data';
import { companyInfo } from '@/lib/company-info';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { BookingInfoAccordions } from './booking-info-accordions';
import { BookingSuccess } from './booking-success';
import { BookingSummaryTicket } from './booking-summary-ticket';

const STORAGE_KEY = 'edrive-booking-requests';
const steps = ['Select Experience', 'Select Duration', 'Vehicles & Guests', 'Date & Time', 'Contact Details', 'Review & Submit'];
const fieldLabel = 'grid gap-1.5 text-sm font-semibold text-foreground';

const packageCategoryLabels: Record<string, string> = {
  jet_car_rental: 'Jet Car Rental',
  jet_ski_rental: 'Jet Ski Rental',
  yacht_rental: 'Yacht Rental'
};

type PackageRateRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration_minutes: number;
  base_price: number;
  b2b_price: number | null;
  capacity: number;
};

function experienceTypeFromCategory(category: string): BookingDraft['experienceType'] {
  return category === 'jet_car_rental' ? 'jet-car-rental' : 'jet-ski-rental';
}

function categoryLabel(category: string) {
  return packageCategoryLabels[category] || 'Water Sports Rental';
}

function rideTitle(category: string, capacity: number) {
  if (category === 'jet_car_rental') return `Jet Car ${capacity} Seater`;
  if (category === 'jet_ski_rental') return `Jet Ski ${capacity} Seater`;
  return categoryLabel(category);
}

function rideSlug(category: string, capacity: number) {
  if (category === 'jet_car_rental') return `jet-car-${capacity}-seater`;
  if (category === 'jet_ski_rental') return `jet-ski-${capacity}-seater`;
  return `package-${capacity}-seater`;
}

function mapRates(rows: PackageRateRow[]): BookingRateOption[] {
  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      category: row.category,
      minutes: Number(row.duration_minutes || 0),
      price: Number(row.base_price || 0),
      b2bPrice: Number(row.b2b_price || 0),
      capacity: Number(row.capacity || 2)
    }))
    .filter((rate) => rate.minutes > 0 && rate.price > 0)
    .sort((a, b) => a.minutes - b.minutes);
}

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>(initialBookingDraft);
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);

  const experience = getExperience(draft.experienceType);
  const isSales = experience.serviceType === 'sales_inquiry';
  const capacityPerVehicle = getCapacityPerVehicle(draft);
  const capacity = draft.vehicleQuantity * capacityPerVehicle;
  const capacityExceeded = draft.guestCount > capacity;
  const lockedPackage = Boolean(draft.selectedPackageName && draft.selectedPackageCapacity);
  const visibleSteps = lockedPackage ? steps.slice(1) : steps;
  const visibleStepIndex = lockedPackage ? Math.max(0, step - 1) : step;
  const visibleStepLabel = visibleSteps[visibleStepIndex] || steps[step];

  function updateDraft(values: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function goToStep(nextStep: number) {
    setStep(lockedPackage && nextStep === 0 ? 1 : nextStep);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    const selectedCapacity = Number(params.get('capacity') || 0);

    if (!categoryParam || !selectedCapacity) return;
    const selectedCategory = categoryParam;
    let active = true;

    async function loadSelectedVehicleRates() {
      const { data } = await supabase
        .from('packages')
        .select('id,title,slug,category,duration_minutes,base_price,b2b_price,capacity')
        .eq('status', 'active')
        .eq('category', selectedCategory)
        .eq('capacity', selectedCapacity)
        .order('duration_minutes', { ascending: true });

      if (!active) return;
      const rates = mapRates((data || []) as PackageRateRow[]);
      if (!rates.length) return;

      const preferredRate = rates.find((rate) => rate.minutes === 60) || rates[0];
      const title = rideTitle(selectedCategory, selectedCapacity);
      const experienceType = experienceTypeFromCategory(selectedCategory);

      setDraft({
        ...initialBookingDraft,
        selectedPackageName: title,
        selectedPackageSlug: rideSlug(selectedCategory, selectedCapacity),
        selectedPackageCategory: categoryLabel(selectedCategory),
        selectedPackageCapacity: selectedCapacity,
        selectedPackagePrice: preferredRate.price,
        selectedPackageB2BPrice: preferredRate.b2bPrice,
        selectedPackageRates: rates,
        experienceType,
        durationMinutes: preferredRate.minutes,
        inquiryType: '',
        vehicleQuantity: 1,
        guestCount: selectedCapacity
      });
      setStep(1);
    }

    void loadSelectedVehicleRates();

    return () => { active = false; };
  }, []);

  function selectExperience(experienceType: BookingDraft['experienceType']) {
    if (lockedPackage) return;
    const nextExperience = getExperience(experienceType);
    updateDraft({
      selectedPackageName: undefined,
      selectedPackageSlug: undefined,
      selectedPackageCategory: undefined,
      selectedPackagePrice: undefined,
      selectedPackageB2BPrice: undefined,
      selectedPackageCapacity: undefined,
      selectedPackageRates: undefined,
      experienceType,
      durationMinutes: nextExperience.serviceType === 'rental' ? 60 : 0,
      inquiryType: nextExperience.serviceType === 'sales_inquiry' ? 'Price Quote' : '',
      vehicleQuantity: 1,
      guestCount: nextExperience.capacity
    });
  }

  const canContinue = useMemo(() => {
    if (step === 2) return !capacityExceeded && draft.vehicleQuantity > 0 && draft.guestCount > 0;
    if (step === 3) return Boolean(draft.preferredDate && draft.preferredTime);
    if (step === 4) return Boolean(draft.customerName.trim() && draft.customerPhone.trim() && (!draft.customerEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customerEmail)));
    return true;
  }, [capacityExceeded, draft, step]);

  function submitRequest() {
    const totals = getBookingTotals(draft);
    const selectedRate = getSelectedRateForDuration(draft);
    let existing: BookingRequest[] = [];

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      existing = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    const request: BookingRequest = {
      bookingCode: generateBookingCode(existing.length),
      source: 'website',
      status: 'Pending',
      adminStatus: 'New',
      managerStatus: null,
      selectedPackageName: draft.selectedPackageName ?? null,
      selectedPackageSlug: draft.selectedPackageSlug ?? null,
      selectedPackageCategory: draft.selectedPackageCategory ?? null,
      selectedPackagePrice: isSales ? null : (selectedRate?.price ?? draft.selectedPackagePrice ?? null),
      selectedPackageB2BPrice: isSales ? null : (selectedRate?.b2bPrice ?? draft.selectedPackageB2BPrice ?? null),
      selectedPackageCapacity: isSales ? null : getCapacityPerVehicle(draft),
      experienceType: draft.experienceType,
      serviceType: experience.serviceType,
      durationMinutes: isSales ? 0 : draft.durationMinutes,
      inquiryType: isSales ? draft.inquiryType : null,
      vehicleQuantity: draft.vehicleQuantity,
      guestCount: draft.guestCount,
      preferredDate: draft.preferredDate,
      preferredTime: draft.preferredTime,
      meetingPointName: companyInfo.locationName,
      meetingPointAddress: companyInfo.locationAddress,
      customerName: draft.customerName.trim(),
      customerPhone: draft.customerPhone.trim(),
      customerEmail: draft.customerEmail.trim() || null,
      customerHotelOrArea: draft.customerHotelOrArea.trim() || null,
      customerNotes: [
        draft.selectedPackageName ? `Selected vehicle: ${draft.selectedPackageName}${draft.selectedPackageCategory ? ` (${draft.selectedPackageCategory})` : ''}. Duration: ${formatDuration(draft.durationMinutes)}.` : '',
        draft.customerNotes.trim()
      ].filter(Boolean).join(' ') || null,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      paymentStatus: 'Not Paid',
      paymentMethod: null,
      createdAt: new Date().toISOString()
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, request]));
    setSubmitted(request);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startAnother() {
    setDraft((current) => ({
      ...initialBookingDraft,
      selectedPackageName: current.selectedPackageName,
      selectedPackageSlug: current.selectedPackageSlug,
      selectedPackageCategory: current.selectedPackageCategory,
      selectedPackagePrice: current.selectedPackagePrice,
      selectedPackageB2BPrice: current.selectedPackageB2BPrice,
      selectedPackageCapacity: current.selectedPackageCapacity,
      selectedPackageRates: current.selectedPackageRates,
      experienceType: current.experienceType,
      durationMinutes: current.durationMinutes,
      vehicleQuantity: 1,
      guestCount: current.selectedPackageCapacity || getExperience(current.experienceType).capacity
    }));
    setStep(lockedPackage ? 1 : 0);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) return <BookingSuccess request={submitted} onAnother={startAnother} />;

  return (
    <section className="container-x pb-10 pt-3 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <WizardProgress currentStep={step} lockedPackage={lockedPackage} onStepSelect={goToStep} />

        <details className="group mt-3 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-[1.25rem] border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm">
            View booking summary
            <ChevronDown className="size-4 text-primary transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3"><BookingSummaryTicket draft={draft} compact /></div>
        </details>

        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <div className="min-w-0">
            <div className="premium-surface rounded-[1.65rem] p-4 sm:p-5 lg:p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Step {visibleStepIndex + 1} of {visibleSteps.length}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-foreground sm:text-2xl">{visibleStepLabel}</h2>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">{visibleStepIndex + 1}</span>
              </div>

              {step === 0 && !lockedPackage ? <ExperienceStep selected={draft.experienceType} onSelect={selectExperience} /> : null}
              {step === 1 ? <DurationStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 2 ? <PartyStep draft={draft} capacity={capacity} capacityPerVehicle={capacityPerVehicle} exceeded={capacityExceeded} onUpdate={updateDraft} /> : null}
              {step === 3 ? <ScheduleStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 4 ? <ContactStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 5 ? <ReviewStep draft={draft} /> : null}

              <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
                <Button type="button" variant="outline" disabled={step === 0 || (lockedPackage && step === 1)} onClick={() => setStep((current) => Math.max(lockedPackage ? 1 : 0, current - 1))}><ArrowLeft data-icon aria-hidden="true" />Back</Button>
                {step < 5 ? (
                  <Button type="button" disabled={!canContinue} onClick={() => setStep((current) => Math.min(5, current + 1))}>{step === 4 ? 'Review Booking' : 'Continue'}<ArrowRight data-icon aria-hidden="true" /></Button>
                ) : (
                  <Button type="button" onClick={submitRequest}><Send data-icon aria-hidden="true" />Submit Booking Request</Button>
                )}
              </div>
            </div>

            <div className="mt-4"><BookingInfoAccordions /></div>
          </div>

          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] lg:block"><BookingSummaryTicket draft={draft} /></aside>
        </div>
      </div>
    </section>
  );
}

function WizardProgress({ currentStep, lockedPackage, onStepSelect }: { currentStep: number; lockedPackage: boolean; onStepSelect: (step: number) => void }) {
  const progressSteps = lockedPackage ? steps.slice(1) : steps;
  const displayStep = lockedPackage ? Math.max(0, currentStep - 1) : currentStep;
  return (
    <div className="overflow-x-auto pb-1">
      <ol className={cn('flex items-start', lockedPackage ? 'min-w-[560px]' : 'min-w-[660px]')}>
        {progressSteps.map((label, displayIndex) => {
          const realIndex = lockedPackage ? displayIndex + 1 : displayIndex;
          const complete = displayIndex < displayStep;
          const active = displayIndex === displayStep;
          const disabled = realIndex > currentStep;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center px-1 text-center">
              {displayIndex ? <span className={cn('absolute right-1/2 top-3.5 h-px w-full bg-border', displayIndex <= displayStep && 'bg-primary')} /> : null}
              <button type="button" disabled={disabled} onClick={() => onStepSelect(realIndex)} className={cn('relative z-10 flex size-7 items-center justify-center rounded-full border bg-background text-[11px] font-bold transition', active ? 'border-primary bg-primary text-white shadow-sm' : complete ? 'border-primary bg-primary-50 text-primary' : 'border-border text-muted-foreground', disabled && 'cursor-not-allowed opacity-55')} aria-current={active ? 'step' : undefined} aria-label={`Step ${displayIndex + 1}: ${label}`}>
                {complete ? <Check className="size-3.5" aria-hidden="true" /> : displayIndex + 1}
              </button>
              <span className={cn('relative z-10 mt-1.5 max-w-[105px] text-[10px] font-semibold leading-4', active || complete ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ExperienceStep({ selected, onSelect }: { selected: BookingDraft['experienceType']; onSelect: (id: BookingDraft['experienceType']) => void }) {
  return (
    <div className="grid gap-3">
      {experienceOptions.map((item) => {
        const active = item.id === selected;
        return (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={cn('group grid overflow-hidden rounded-[1.25rem] border bg-white text-left transition sm:grid-cols-[125px_1fr]', active ? 'border-primary shadow-sm ring-2 ring-primary/10' : 'border-border/80 hover:border-primary/35')} aria-pressed={active}>
            <div className="relative min-h-[95px] overflow-hidden bg-primary-50 sm:min-h-full"><Image src={item.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="125px" /></div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>{item.recommended ? <span className="rounded-full bg-accent-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary-900">Popular</span> : null}</div>
                <p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">{item.shortDescription}</p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">Duration and pricing will show in the next step.</p>
              </div>
              <span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-white' : 'border-border bg-background')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DurationStep({ draft, onUpdate }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void }) {
  const experience = getExperience(draft.experienceType);
  if (experience.serviceType === 'sales_inquiry') return <div><p className="mb-3 text-sm leading-6 text-muted-foreground">Tell us what kind of sales help you need.</p><div className="grid gap-3 sm:grid-cols-2">{inquiryTypes.map((type) => <ChoiceButton key={type} active={draft.inquiryType === type} onClick={() => onUpdate({ inquiryType: type })} title={type} detail="Direct follow-up" />)}</div></div>;
  const packages: BookingRateOption[] = draft.selectedPackageRates?.length ? draft.selectedPackageRates : durationPackages[draft.experienceType as keyof typeof durationPackages].map((item) => ({ category: draft.experienceType, minutes: item.minutes, price: item.price, b2bPrice: undefined, capacity: getCapacityPerVehicle(draft) }));
  return <div><p className="mb-3 text-sm leading-6 text-muted-foreground">Choose duration for {draft.selectedPackageName || experience.title}. Prices shown are per vehicle.</p><div className="grid gap-3 sm:grid-cols-2">{packages.map((item) => <ChoiceButton key={item.minutes} active={draft.durationMinutes === item.minutes} onClick={() => onUpdate({ durationMinutes: item.minutes, selectedPackagePrice: item.price, selectedPackageB2BPrice: item.b2bPrice, selectedPackageCapacity: item.capacity })} title={formatDuration(item.minutes)} detail={formatAed(item.price)} />)}</div></div>;
}

function ChoiceButton({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return <button type="button" onClick={onClick} className={cn('flex items-center justify-between gap-4 rounded-[1.15rem] border bg-white p-4 text-left transition', active ? 'border-primary bg-primary-50 shadow-sm' : 'border-border hover:border-primary/35')} aria-pressed={active}><span><span className="block font-semibold text-foreground">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span><span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-white' : 'border-border')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span></button>;
}

function PartyStep({ draft, capacity, capacityPerVehicle, exceeded, onUpdate }: { draft: BookingDraft; capacity: number; capacityPerVehicle: number; exceeded: boolean; onUpdate: (values: Partial<BookingDraft>) => void }) {
  return <div><p className="mb-4 text-sm leading-6 text-muted-foreground">Each selected vehicle can carry up to {capacityPerVehicle} guests.</p><div className="grid gap-3 sm:grid-cols-2"><Counter label="Vehicles" helper={`Up to ${capacityPerVehicle} guests each`} value={draft.vehicleQuantity} min={1} max={6} onChange={(vehicleQuantity) => onUpdate({ vehicleQuantity })} /><Counter label="Guests" helper={`Current capacity: ${capacity}`} value={draft.guestCount} min={1} max={12} onChange={(guestCount) => onUpdate({ guestCount })} /></div><div className={cn('mt-4 rounded-[1.15rem] border px-4 py-3 text-sm', exceeded ? 'border-red-200 bg-red-50 text-red-700' : 'border-primary/15 bg-primary-50 text-primary-900')} role="status">{exceeded ? `Please add ${Math.ceil(draft.guestCount / capacityPerVehicle) - draft.vehicleQuantity} more vehicle${Math.ceil(draft.guestCount / capacityPerVehicle) - draft.vehicleQuantity === 1 ? '' : 's'} for ${draft.guestCount} guests.` : `${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} can accommodate your party of ${draft.guestCount}.`}</div></div>;
}

function Counter({ label, helper, value, min, max, onChange }: { label: string; helper: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="rounded-[1.25rem] border border-border bg-white p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div><div className="flex items-center gap-3"><button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:bg-primary-50 disabled:opacity-35" aria-label={`Decrease ${label}`}><Minus className="size-4" /></button><span className="w-6 text-center text-base font-bold text-foreground">{value}</span><button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:bg-primary-50 disabled:opacity-35" aria-label={`Increase ${label}`}><Plus className="size-4" /></button></div></div></div>;
}

function ScheduleStep({ draft, onUpdate }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  return <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]"><div className="rounded-[1.25rem] border border-border bg-white p-4"><div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Previous month" disabled={visibleMonth.getTime() <= minMonth} onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-border text-primary disabled:opacity-30"><ChevronLeft className="size-4" /></button><p className="font-semibold text-foreground">{visibleMonth.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}</p><button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-border text-primary"><ChevronRight className="size-4" /></button></div><div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-foreground">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: startDay }).map((_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => { const date = new Date(year, month, day); const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const disabled = date < new Date(today.getFullYear(), today.getMonth(), today.getDate()); const selected = draft.preferredDate === iso; return <button key={iso} type="button" disabled={disabled} onClick={() => onUpdate({ preferredDate: iso })} className={cn('aspect-square rounded-lg text-xs font-semibold transition', selected ? 'bg-primary text-white shadow-sm' : 'hover:bg-primary-50', disabled && 'cursor-not-allowed text-muted-foreground/35 hover:bg-transparent')}>{day}</button>; })}</div></div><div><div className="mb-3 flex items-center gap-2"><Clock3 className="size-4 text-primary" aria-hidden="true" /><p className="font-semibold text-foreground">Preferred time</p></div><div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1">{timeSlots.map((time) => <button key={time} type="button" onClick={() => onUpdate({ preferredTime: time })} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold transition', draft.preferredTime === time ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40')}>{time}</button>)}</div></div></div>;
}

function ContactStep({ draft, onUpdate }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void }) {
  return <div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className={fieldLabel}>Full name <span className="relative"><UserRound className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input required value={draft.customerName} onChange={(event) => onUpdate({ customerName: event.target.value })} className="pl-10" placeholder="Your full name" /></span></label><label className={fieldLabel}>Phone or WhatsApp <span className="relative"><Phone className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input required type="tel" value={draft.customerPhone} onChange={(event) => onUpdate({ customerPhone: event.target.value })} className="pl-10" placeholder={companyInfo.whatsappDisplay} /></span></label></div><div className="grid gap-4 sm:grid-cols-2"><label className={fieldLabel}>Email address <span className="font-normal text-muted-foreground">(optional)</span><span className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input type="email" value={draft.customerEmail} onChange={(event) => onUpdate({ customerEmail: event.target.value })} className="pl-10" placeholder="you@example.com" /></span></label><label className={fieldLabel}>Hotel or area <span className="font-normal text-muted-foreground">(optional)</span><span className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input value={draft.customerHotelOrArea} onChange={(event) => onUpdate({ customerHotelOrArea: event.target.value })} className="pl-10" placeholder="Where are you staying?" /></span></label></div><label className={fieldLabel}>Ride type or package notes <span className="font-normal text-muted-foreground">(optional)</span><Textarea value={draft.customerNotes} onChange={(event) => onUpdate({ customerNotes: event.target.value })} placeholder="Selected package, celebration details, rider experience, or anything else we should know" /></label><p className="rounded-[1.15rem] bg-primary-50 px-4 py-3 text-xs leading-5 text-primary-900">Your details are used only to confirm and manage this booking request.</p></div>;
}

function ReviewStep({ draft }: { draft: BookingDraft }) {
  const experience = getExperience(draft.experienceType);
  const totals = getBookingTotals(draft);
  const isSales = experience.serviceType === 'sales_inquiry';
  const date = new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${draft.preferredDate}T12:00:00`));
  return <div><div className="grid gap-3 sm:grid-cols-2"><ReviewGroup title="Experience" items={[[draft.selectedPackageName || experience.title, isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)], ...(draft.selectedPackageCapacity ? [[`${draft.selectedPackageCapacity} seater`, draft.selectedPackageCategory ?? 'Selected vehicle']] : []), [`${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'}`, `${draft.guestCount} ${draft.guestCount === 1 ? 'guest' : 'guests'}`]]} /><ReviewGroup title="Schedule" items={[[date, draft.preferredTime], [companyInfo.locationName, companyInfo.locationAddress]]} /><ReviewGroup title="Contact" items={[[draft.customerName, draft.customerPhone], [draft.customerEmail || 'Email not provided', draft.customerHotelOrArea || 'Area not provided']]} /><ReviewGroup title={isSales ? 'Pricing' : 'Estimate'} items={[[isSales ? 'Request quote' : formatAed(totals.totalAmount), isSales ? 'Our sales team will follow up' : 'Includes 5% VAT'], ['Payment status', 'Not Paid']]} /></div>{draft.customerNotes ? <div className="mt-3 rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Notes</p><p className="mt-2 text-sm leading-6 text-foreground">{draft.customerNotes}</p></div> : null}<div className="mt-4 rounded-[1.15rem] border border-primary/15 bg-primary-50 p-4 text-sm leading-6 text-primary-900">Submitting sends a request only. Your booking becomes final after our team confirms availability with you.</div></div>;
}

function ReviewGroup({ title, items }: { title: string; items: string[][] }) {
  return <div className="rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{title}</p>{items.map(([label, value], index) => <div key={`${label}-${index}`} className={cn('mt-2.5', index && 'border-t border-border/60 pt-2.5')}><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{value}</p></div>)}</div>;
}
