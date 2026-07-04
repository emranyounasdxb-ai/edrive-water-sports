'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Mail, MapPin, Minus, Phone, Plus, Send, TicketCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookingDraft, BookingRequest, durationPackages, experienceOptions, formatAed, formatDuration, generateBookingCode, getBookingTotals, getExperience, initialBookingDraft, inquiryTypes, timeSlots } from '@/lib/booking-data';
import { companyInfo } from '@/lib/company-info';
import { getPublicPackageBySlug, packageCategoryLabels, type PublicPackage } from '@/lib/public-packages';
import { cn } from '@/lib/utils';
import { BookingInfoAccordions } from './booking-info-accordions';
import { BookingSuccess } from './booking-success';
import { BookingSummaryTicket } from './booking-summary-ticket';

const STORAGE_KEY = 'edrive-booking-requests';
const steps = ['Select Experience', 'Select Duration', 'Vehicles & Guests', 'Date & Time', 'Contact Details', 'Review & Submit'];
const fieldLabel = 'grid gap-1.5 text-sm font-semibold text-foreground';

function durationFromPackage(packageItem: PublicPackage, fallback: number) {
  const match = packageItem.duration.match(/^(\d+)/);
  if (!match) return fallback;
  const minutes = Number(match[1]);
  return [30, 60, 90, 120].includes(minutes) ? minutes : fallback;
}

function draftFromPackage(packageItem?: PublicPackage): BookingDraft {
  if (!packageItem) return initialBookingDraft;
  const experienceType: BookingDraft['experienceType'] = packageItem.category === 'jet-car' ? 'jet-car-rental' : 'jet-ski-rental';
  const fallbackDuration = packageItem.category === 'vip' ? 90 : 60;

  return {
    ...initialBookingDraft,
    selectedPackageName: packageItem.name,
    selectedPackageSlug: packageItem.slug,
    selectedPackageCategory: packageCategoryLabels[packageItem.category],
    experienceType,
    durationMinutes: durationFromPackage(packageItem, fallbackDuration),
    customerNotes: `Best for: ${packageItem.bestFor}.`
  };
}

export function BookingWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BookingDraft>(initialBookingDraft);
  const [selectedPackage, setSelectedPackage] = useState<PublicPackage | null>(null);
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);
  const experience = getExperience(draft.experienceType);
  const isSales = experience.serviceType === 'sales_inquiry';
  const capacity = draft.vehicleQuantity * experience.capacity;
  const capacityExceeded = draft.guestCount > capacity;

  function updateDraft(values: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('package');
    const packageItem = getPublicPackageBySlug(slug);
    if (!packageItem) return;

    setSelectedPackage(packageItem);
    setDraft(draftFromPackage(packageItem));
  }, []);

  function selectExperience(experienceType: BookingDraft['experienceType']) {
    const nextExperience = getExperience(experienceType);
    updateDraft({
      experienceType,
      durationMinutes: nextExperience.serviceType === 'rental' ? 60 : 0,
      inquiryType: nextExperience.serviceType === 'sales_inquiry' ? 'Price Quote' : '',
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
        draft.selectedPackageName ? `Selected package: ${draft.selectedPackageName}${draft.selectedPackageCategory ? ` (${draft.selectedPackageCategory})` : ''}.` : '',
        draft.customerNotes.trim()
      ].filter(Boolean).join(' ') || null,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      paymentStatus: 'Not Paid',
      paymentMethod: null,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, request]));
    setSubmitted(request);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startAnother() {
    setDraft(draftFromPackage(selectedPackage ?? undefined));
    setStep(0);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) return <BookingSuccess request={submitted} onAnother={startAnother} />;

  return (
    <section className="container-x pb-10 pt-3 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <WizardProgress currentStep={step} onStepSelect={setStep} />
        {selectedPackage ? <SelectedPackageNotice packageItem={selectedPackage} /> : null}

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
                <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Step {step + 1} of {steps.length}</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground sm:text-2xl">{steps[step]}</h2></div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">{step + 1}</span>
              </div>

              {step === 0 ? <ExperienceStep selected={draft.experienceType} onSelect={selectExperience} /> : null}
              {step === 1 ? <DurationStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 2 ? <PartyStep draft={draft} capacity={capacity} exceeded={capacityExceeded} onUpdate={updateDraft} /> : null}
              {step === 3 ? <ScheduleStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 4 ? <ContactStep draft={draft} onUpdate={updateDraft} /> : null}
              {step === 5 ? <ReviewStep draft={draft} /> : null}

              <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
                <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft data-icon aria-hidden="true" />Back</Button>
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

function WizardProgress({ currentStep, onStepSelect }: { currentStep: number; onStepSelect: (step: number) => void }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[660px] items-start">
        {steps.map((label, index) => {
          const complete = index < currentStep;
          const active = index === currentStep;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center px-1 text-center">
              {index ? <span className={cn('absolute right-1/2 top-3.5 h-px w-full bg-border', index <= currentStep && 'bg-primary')} /> : null}
              <button type="button" disabled={index > currentStep} onClick={() => onStepSelect(index)} className={cn('relative z-10 flex size-7 items-center justify-center rounded-full border bg-background text-[11px] font-bold transition', active ? 'border-primary bg-primary text-white shadow-sm' : complete ? 'border-primary bg-primary-50 text-primary' : 'border-border text-muted-foreground')} aria-current={active ? 'step' : undefined} aria-label={`Step ${index + 1}: ${label}`}>{complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}</button>
              <span className={cn('relative z-10 mt-1.5 max-w-[105px] text-[10px] font-semibold leading-4', active || complete ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SelectedPackageNotice({ packageItem }: { packageItem: PublicPackage }) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-primary/15 bg-primary-50 p-4 text-left sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm"><TicketCheck className="size-5" aria-hidden="true" /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Selected package</p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{packageItem.name}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{packageCategoryLabels[packageItem.category]} · {packageItem.duration} · {packageItem.priceLabel}</p>
        </div>
      </div>
      <p className="mt-3 max-w-sm text-xs leading-5 text-primary-900 sm:mt-0">You can still edit the ride type, date, guests, and notes before submitting.</p>
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
            <div className="flex items-start justify-between gap-3 p-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>{item.recommended ? <span className="rounded-full bg-accent-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary-900">Popular</span> : null}</div><p className="mt-1.5 max-w-xl text-xs leading-5 text-muted-foreground">{item.shortDescription}</p><p className="mt-2 text-xs font-medium text-muted-foreground">Duration and pricing will show in the next step.</p></div><span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-white' : 'border-border bg-background')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span></div>
          </button>
        );
      })}
    </div>
  );
}

function DurationStep({ draft, onUpdate }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void }) {
  const experience = getExperience(draft.experienceType);
  if (experience.serviceType === 'sales_inquiry') return <div><p className="mb-3 text-sm leading-6 text-muted-foreground">Tell us what kind of sales help you need.</p><div className="grid gap-3 sm:grid-cols-2">{inquiryTypes.map((type) => <ChoiceButton key={type} active={draft.inquiryType === type} onClick={() => onUpdate({ inquiryType: type })} title={type} detail="Direct follow-up" />)}</div></div>;
  const packages = durationPackages[draft.experienceType as keyof typeof durationPackages];
  return <div><p className="mb-3 text-sm leading-6 text-muted-foreground">Prices shown are per vehicle.</p><div className="grid gap-3 sm:grid-cols-2">{packages.map((item) => <ChoiceButton key={item.minutes} active={draft.durationMinutes === item.minutes} onClick={() => onUpdate({ durationMinutes: item.minutes })} title={formatDuration(item.minutes)} detail={formatAed(item.price)} />)}</div></div>;
}

function ChoiceButton({ active, onClick, title, detail }: { active: boolean; onClick: () => void; title: string; detail: string }) {
  return <button type="button" onClick={onClick} className={cn('flex items-center justify-between gap-4 rounded-[1.15rem] border bg-white p-4 text-left transition', active ? 'border-primary bg-primary-50 shadow-sm' : 'border-border hover:border-primary/35')} aria-pressed={active}><span><span className="block font-semibold text-foreground">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span><span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-white' : 'border-border')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span></button>;
}

function PartyStep({ draft, capacity, exceeded, onUpdate }: { draft: BookingDraft; capacity: number; exceeded: boolean; onUpdate: (values: Partial<BookingDraft>) => void }) {
  return <div><p className="mb-4 text-sm leading-6 text-muted-foreground">Each vehicle can carry up to 2 guests.</p><div className="grid gap-3 sm:grid-cols-2"><Counter label="Vehicles" helper="Up to 2 guests each" value={draft.vehicleQuantity} min={1} max={6} onChange={(vehicleQuantity) => onUpdate({ vehicleQuantity })} /><Counter label="Guests" helper={`Current capacity: ${capacity}`} value={draft.guestCount} min={1} max={12} onChange={(guestCount) => onUpdate({ guestCount })} /></div><div className={cn('mt-4 rounded-[1.15rem] border px-4 py-3 text-sm', exceeded ? 'border-red-200 bg-red-50 text-red-700' : 'border-primary/15 bg-primary-50 text-primary-900')} role="status">{exceeded ? `Please add ${Math.ceil(draft.guestCount / 2) - draft.vehicleQuantity} more vehicle${Math.ceil(draft.guestCount / 2) - draft.vehicleQuantity === 1 ? '' : 's'} for ${draft.guestCount} guests.` : `${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} can accommodate your party of ${draft.guestCount}.`}</div></div>;
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
  return <div><div className="grid gap-3 sm:grid-cols-2"><ReviewGroup title="Experience" items={[[experience.title, isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)], ...(draft.selectedPackageName ? [[draft.selectedPackageName, draft.selectedPackageCategory ?? 'Public package']] : []), [`${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'}`, `${draft.guestCount} ${draft.guestCount === 1 ? 'guest' : 'guests'}`]]} /><ReviewGroup title="Schedule" items={[[date, draft.preferredTime], [companyInfo.locationName, companyInfo.locationAddress]]} /><ReviewGroup title="Contact" items={[[draft.customerName, draft.customerPhone], [draft.customerEmail || 'Email not provided', draft.customerHotelOrArea || 'Area not provided']]} /><ReviewGroup title={isSales ? 'Pricing' : 'Estimate'} items={[[isSales ? 'Request quote' : formatAed(totals.totalAmount), isSales ? 'Our sales team will follow up' : 'Includes 5% VAT'], ['Payment status', 'Not Paid']]} /></div>{draft.customerNotes ? <div className="mt-3 rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Notes</p><p className="mt-2 text-sm leading-6 text-foreground">{draft.customerNotes}</p></div> : null}<div className="mt-4 rounded-[1.15rem] border border-primary/15 bg-primary-50 p-4 text-sm leading-6 text-primary-900">Submitting sends a request only. Your booking becomes final after our team confirms availability with you.</div></div>;
}

function ReviewGroup({ title, items }: { title: string; items: string[][] }) {
  return <div className="rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{title}</p>{items.map(([label, value], index) => <div key={`${label}-${index}`} className={cn('mt-2.5', index && 'border-t border-border/60 pt-2.5')}><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{value}</p></div>)}</div>;
}
