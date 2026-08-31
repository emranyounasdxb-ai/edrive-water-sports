'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Mail, MapPin, Minus, Phone, Plus, Send, TicketCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { bookingRatePricing, formatAed, formatDuration, generateBookingCode, getBookingTotals, getCapacityPerVehicle, getExperience, getSelectedRateForDuration, initialBookingDraft, timeSlots } from '@/lib/booking-data';
import type { BookingDraft, BookingRateOption, BookingRequest } from '@/lib/booking-data';
import { companyInfo } from '@/lib/company-info';
import { getLivePackageImage } from '@/lib/edrive-package-images';
import { getPublicImageUrl } from '@/lib/public-image-overrides';
import { cleanMultiline, cleanSingleLine, dubaiDateParts, dubaiDateValue, isSelectableDubaiBookingTime, isValidOptionalEmail, isValidPhone } from '@/lib/public-request-validation';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { getPackagePricePresentation } from '@/lib/package-pricing';
import { PackageOfferPrice, PackageOfferRibbon } from '@/components/edrive/shared/package-offer-price';
import { BookingInfoAccordions } from './booking-info-accordions';
import { BookingSuccess } from './booking-success';
import { BookingSummaryTicket } from './booking-summary-ticket';
import type { PublicLocale } from '@/lib/i18n/locales';
import type { BookingMessages, PackageMessages } from '@/lib/i18n/types';
import { enMessages } from '@/lib/i18n/messages/en';
import { trackBookingSchedule } from '@/lib/meta-pixel';

const steps = ['Select Package', 'Select Duration', 'Vehicles & Guests', 'Date & Time', 'Contact Details', 'Review & Submit'];
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
  offer_enabled?: boolean | null;
  offer_name?: string | null;
  b2c_offer_price?: number | null;
  capacity: number;
  image_url?: string | null;
  short_description?: string | null;
  display_order?: number | null;
};

type PackageGroup = {
  key: string;
  title: string;
  slug: string;
  category: string;
  categoryLabel: string;
  capacity: number;
  imageUrl: string;
  description: string;
  displayOrder: number;
  rates: BookingRateOption[];
};

function hasPackageParams() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('package') || (params.get('category') && Number(params.get('capacity') || 0)));
}

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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function packageFamilyTitle(row: PackageRateRow) {
  const clean = String(row.title || '')
    .replace(/\b\d+(?:\.\d+)?\s*(?:minutes?|mins?|hours?|hrs?)\b/gi, '')
    .replace(/\b(?:half|one|two|three)\s+hours?\b/gi, '')
    .replace(/[|–—-]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || rideTitle(row.category, Number(row.capacity || 2));
}

function packageFamilyKey(row: PackageRateRow) {
  const capacity = Number(row.capacity || 2);
  return `${row.category}-${capacity}-${slugify(packageFamilyTitle(row))}`;
}

function mapRates(rows: PackageRateRow[]): BookingRateOption[] {
  return rows
    .map((row) => {
      const price = getPackagePricePresentation(row, 'b2c');
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        category: row.category,
        minutes: Number(row.duration_minutes || 0),
        price: price.effectivePrice,
        normalPrice: price.normalPrice,
        offerEnabled: price.active,
        offerName: price.active ? price.label : null,
        offerPrice: price.offerPrice,
        capacity: Number(row.capacity || 2)
      };
    })
    .filter((rate) => rate.id && rate.minutes > 0 && rate.price > 0)
    .sort((a, b) => a.minutes - b.minutes || String(a.title).localeCompare(String(b.title)));
}

function groupPackageRows(rows: PackageRateRow[]) {
  const grouped = new Map<string, PackageRateRow[]>();

  rows.forEach((row) => {
    const key = packageFamilyKey(row);
    grouped.set(key, [...(grouped.get(key) || []), row]);
  });

  return Array.from(grouped.entries())
    .map(([key, groupRows]) => {
      const sortedRows = [...groupRows].sort((a, b) => Number(a.duration_minutes) - Number(b.duration_minutes));
      const first = sortedRows[0];
      const capacity = Number(first.capacity || 2);
      const title = packageFamilyTitle(first);
      const savedImage = sortedRows.map((row) => String(row.image_url || '').trim()).find(Boolean);
      return {
        key,
        title,
        slug: slugify(title) || rideSlug(first.category, capacity),
        category: first.category,
        categoryLabel: categoryLabel(first.category),
        capacity,
        imageUrl: getPublicImageUrl(savedImage) || getLivePackageImage(first.category, Number(first.display_order || capacity)),
        description: first.short_description || `Choose your ${title.toLowerCase()} duration and submit your request.`,
        displayOrder: Math.min(...sortedRows.map((row) => Number(row.display_order || 100))),
        rates: mapRates(sortedRows)
      } as PackageGroup;
    })
    .filter((group) => group.rates.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title));
}

function draftFromPackageGroup(group: PackageGroup, preferredPackageId = '', preferredDuration = 0) {
  const preferredRate = group.rates.find((rate) => rate.id === preferredPackageId)
    || group.rates.find((rate) => rate.minutes === preferredDuration)
    || group.rates.find((rate) => rate.minutes === 60)
    || group.rates[0];

  return {
    ...initialBookingDraft,
    selectedPackageRateId: preferredRate.id,
    selectedPackageName: preferredRate.title || group.title,
    selectedPackageSlug: preferredRate.slug || group.slug,
    selectedPackageCategory: group.categoryLabel,
    selectedPackageCapacity: preferredRate.capacity || group.capacity,
    selectedPackagePrice: preferredRate.price,
    selectedPackageB2BPrice: undefined,
    selectedPackageRates: group.rates,
    experienceType: experienceTypeFromCategory(group.category),
    durationMinutes: preferredRate.minutes,
    inquiryType: '',
    vehicleQuantity: 1,
    guestCount: preferredRate.capacity || group.capacity
  } satisfies BookingDraft;
}

async function fetchPublicPackageRows() {
  const rpcResult = await supabase.rpc('get_public_packages', { p_categories: null });
  if (!rpcResult.error) return (rpcResult.data || []) as PackageRateRow[];

  const fallbackResult = await supabase
    .from('packages')
    .select('id,title,slug,category,duration_minutes,base_price,offer_enabled,offer_name,b2c_offer_price,capacity,image_url,short_description,display_order')
    .eq('status', 'active')
    .order('display_order', { ascending: true })
    .order('capacity', { ascending: true })
    .order('duration_minutes', { ascending: true });

  if (fallbackResult.error) throw fallbackResult.error;
  return (fallbackResult.data || []) as PackageRateRow[];
}

export function BookingWizard({ locale = 'en', messages = enMessages.booking, packageMessages = enMessages.packages }: { locale?: PublicLocale; messages?: BookingMessages; packageMessages?: PackageMessages }) {
  const [step, setStep] = useState(() => (hasPackageParams() ? 1 : 0));
  const [draft, setDraft] = useState<BookingDraft>(initialBookingDraft);
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);
  const [ready, setReady] = useState(false);
  const [packageQueryMode, setPackageQueryMode] = useState(() => hasPackageParams());
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>([]);
  const [packageError, setPackageError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const experience = getExperience(draft.experienceType);
  const isSales = experience.serviceType === 'sales_inquiry';
  const capacityPerVehicle = getCapacityPerVehicle(draft);
  const capacity = draft.vehicleQuantity * capacityPerVehicle;
  const capacityExceeded = draft.guestCount > capacity;
  const packageFlow = packageQueryMode;
  const localizedSteps = messages.steps;
  const visibleSteps = packageFlow ? localizedSteps.slice(1) : localizedSteps;
  const visibleStepIndex = packageFlow ? Math.max(0, step - 1) : step;
  const visibleStepLabel = visibleSteps[visibleStepIndex] || localizedSteps[step];

  function updateDraft(values: Partial<BookingDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function goToStep(nextStep: number) {
    setStep(packageFlow && nextStep === 0 ? 1 : nextStep);
  }

  function selectPackageGroup(group: PackageGroup) {
    setDraft(draftFromPackageGroup(group));
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const packageIdParam = params.get('package') || '';
    const categoryParam = params.get('category') || '';
    const selectedCapacity = Number(params.get('capacity') || 0);
    const selectedDuration = Number(params.get('duration') || 0);
    let active = true;

    async function loadPackages() {
      setReady(false);
      setPackageError('');
      try {
        const rows = await fetchPublicPackageRows();
        if (!active) return;
        const groups = groupPackageRows(rows);
        setPackageGroups(groups);

        const selectedGroup = packageIdParam
          ? groups.find((group) => group.rates.some((rate) => rate.id === packageIdParam))
          : groups.find((group) => group.category === categoryParam && group.capacity === selectedCapacity);

        if (selectedGroup) {
          setPackageQueryMode(true);
          setDraft(draftFromPackageGroup(selectedGroup, packageIdParam, selectedDuration));
          setStep(1);
        } else {
          setPackageQueryMode(false);
          setStep(0);
        }
      } catch {
        if (!active) return;
        setPackageGroups([]);
        setPackageQueryMode(false);
        setStep(0);
        setPackageError(messages.packageLoadError);
      } finally {
        if (active) setReady(true);
      }
    }

    void loadPackages();
    return () => { active = false; };
  }, []);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(draft.selectedPackageRates?.length);
    if (step === 1) return Boolean(draft.selectedPackageRateId && draft.selectedPackageRates?.length && draft.durationMinutes > 0);
    if (step === 2) return !capacityExceeded && draft.vehicleQuantity > 0 && draft.guestCount > 0;
    if (step === 3) return isSelectableDubaiBookingTime(draft.preferredDate, draft.preferredTime, now);
    if (step === 4) return Boolean(draft.customerName.trim().length >= 2 && isValidPhone(draft.customerPhone) && isValidOptionalEmail(draft.customerEmail));
    return true;
  }, [capacityExceeded, draft, now, step]);

  function submitRequest() {
    const totals = getBookingTotals(draft);
    const selectedRate = getSelectedRateForDuration(draft);
    const request: BookingRequest = {
      bookingCode: generateBookingCode(),
      source: 'website',
      status: 'Pending',
      adminStatus: 'New',
      managerStatus: null,
      selectedPackageRateId: selectedRate?.id || draft.selectedPackageRateId || null,
      selectedPackageName: selectedRate?.title || draft.selectedPackageName || null,
      selectedPackageSlug: selectedRate?.slug || draft.selectedPackageSlug || null,
      selectedPackageCategory: draft.selectedPackageCategory ?? null,
      selectedPackagePrice: isSales ? null : (selectedRate?.price ?? draft.selectedPackagePrice ?? null),
      selectedPackageB2BPrice: null,
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
      customerName: cleanSingleLine(draft.customerName, 100),
      customerPhone: cleanSingleLine(draft.customerPhone, 30),
      customerEmail: cleanSingleLine(draft.customerEmail, 160) || null,
      customerHotelOrArea: cleanSingleLine(draft.customerHotelOrArea, 160) || null,
      customerNotes: [
        draft.selectedPackageName ? `Selected package: ${draft.selectedPackageName}${draft.selectedPackageCategory ? ` (${draft.selectedPackageCategory})` : ''}. Duration: ${formatDuration(draft.durationMinutes)}.` : '',
        cleanMultiline(draft.customerNotes, 1000)
      ].filter(Boolean).join(' ') || null,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      paymentStatus: 'Not Paid',
      paymentMethod: null,
      createdAt: new Date().toISOString()
    };

    setSubmitted(request);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueToNextStep() {
    if (step === 3 && canContinue) {
      trackBookingSchedule(`${draft.preferredDate}|${draft.preferredTime}`);
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function startAnother() {
    setDraft((current) => ({
      ...initialBookingDraft,
      selectedPackageRateId: current.selectedPackageRateId,
      selectedPackageName: current.selectedPackageName,
      selectedPackageSlug: current.selectedPackageSlug,
      selectedPackageCategory: current.selectedPackageCategory,
      selectedPackagePrice: current.selectedPackagePrice,
      selectedPackageCapacity: current.selectedPackageCapacity,
      selectedPackageRates: current.selectedPackageRates,
      experienceType: current.experienceType,
      durationMinutes: current.durationMinutes,
      vehicleQuantity: 1,
      guestCount: current.selectedPackageCapacity || getExperience(current.experienceType).capacity
    }));
    setStep(packageFlow ? 1 : 0);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) return <BookingSuccess request={submitted} onAnother={startAnother} locale={locale} messages={messages} />;

  if (!ready) {
    return (
      <section className="container-x pb-10 pt-3 sm:pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="premium-surface rounded-[1.65rem] p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{messages.preparing}</p>
            <h2 className="mt-2 font-heading text-xl font-semibold text-foreground">{messages.preparingText}</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-x pb-10 pt-3 sm:pb-12">
      <div className="mx-auto max-w-6xl">
        <WizardProgress currentStep={step} packageFlow={packageFlow} onStepSelect={goToStep} steps={localizedSteps} />

        <details className="group mt-3 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-[1.25rem] border border-white/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm">
            {messages.summary}
            <ChevronDown className="size-4 text-primary transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3"><BookingSummaryTicket draft={draft} compact locale={locale} messages={messages} /></div>
        </details>

        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <div className="min-w-0">
            <div className="premium-surface rounded-[1.65rem] p-4 sm:p-5 lg:p-5">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{messages.stepOf.replace('{current}', String(visibleStepIndex + 1)).replace('{total}', String(visibleSteps.length))}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-foreground sm:text-2xl">{visibleStepLabel}</h2>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">{visibleStepIndex + 1}</span>
              </div>

              {packageError ? <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">{packageError}</p> : null}
              {step === 0 && !packageFlow ? <PackageSelectionStep groups={packageGroups} selectedRateId={draft.selectedPackageRateId || ''} onSelect={selectPackageGroup} messages={messages} packageMessages={packageMessages} /> : null}
              {step === 1 ? <DurationStep draft={draft} onUpdate={updateDraft} messages={messages} /> : null}
              {step === 2 ? <PartyStep draft={draft} capacity={capacity} capacityPerVehicle={capacityPerVehicle} exceeded={capacityExceeded} onUpdate={updateDraft} messages={messages} /> : null}
              {step === 3 ? <ScheduleStep draft={draft} now={now} onUpdate={updateDraft} locale={locale} messages={messages} /> : null}
              {step === 4 ? <ContactStep draft={draft} onUpdate={updateDraft} messages={messages} /> : null}
              {step === 5 ? <ReviewStep draft={draft} locale={locale} messages={messages} /> : null}

              <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-border/70 pt-4 sm:flex-row">
                <Button type="button" variant="outline" disabled={step === 0 || (packageFlow && step === 1)} onClick={() => setStep((current) => Math.max(packageFlow ? 1 : 0, current - 1))}><ArrowLeft data-icon aria-hidden="true" />{messages.back}</Button>
                {step < 5 ? (
                  <Button type="button" disabled={!canContinue} onClick={continueToNextStep}>{step === 4 ? messages.reviewBooking : messages.continue}<ArrowRight data-icon aria-hidden="true" /></Button>
                ) : (
                  <Button type="button" onClick={submitRequest}><Send data-icon aria-hidden="true" />{messages.submit}</Button>
                )}
              </div>
            </div>

            <div className="mt-4"><BookingInfoAccordions messages={messages} /></div>
          </div>

          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] lg:block"><BookingSummaryTicket draft={draft} locale={locale} messages={messages} /></aside>
        </div>
      </div>
    </section>
  );
}

function WizardProgress({ currentStep, packageFlow, onStepSelect, steps: progressLabels }: { currentStep: number; packageFlow: boolean; onStepSelect: (step: number) => void; steps: string[] }) {
  const progressSteps = packageFlow ? progressLabels.slice(1) : progressLabels;
  const displayStep = packageFlow ? Math.max(0, currentStep - 1) : currentStep;
  return (
    <div className="overflow-x-auto pb-1">
      <ol className={cn('flex items-start', packageFlow ? 'min-w-[560px]' : 'min-w-[660px]')}>
        {progressSteps.map((label, displayIndex) => {
          const realIndex = packageFlow ? displayIndex + 1 : displayIndex;
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

function PackageSelectionStep({ groups, selectedRateId, onSelect, messages, packageMessages }: { groups: PackageGroup[]; selectedRateId: string; onSelect: (group: PackageGroup) => void; messages: BookingMessages; packageMessages: PackageMessages }) {
  if (!groups.length) {
    return <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">{messages.noPackages}</div>;
  }

  return (
    <div>
      <p className="mb-3 text-sm leading-6 text-muted-foreground">{messages.choosePackageText}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group, index) => {
          const active = group.rates.some((rate) => rate.id === selectedRateId);
          const startingPrice = Math.min(...group.rates.map((rate) => rate.price));
          const offeredRate = group.rates.find((rate) => getPackagePricePresentation(bookingRatePricing(rate), 'b2c').active);
          return (
            <button key={group.key} type="button" onClick={() => onSelect(group)} className={cn('group overflow-hidden rounded-[1.25rem] border bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md', active ? 'border-primary bg-gradient-to-br from-primary-50 via-white to-accent-100/40 shadow-md ring-1 ring-primary/15' : 'border-border shadow-sm')} aria-pressed={active}>
              <PackageSelectionImage src={group.imageUrl} title={group.title} category={group.category} index={index} />
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><TicketCheck className="size-4 text-primary" aria-hidden="true" /><h3 className="font-heading text-lg font-semibold text-foreground">{group.title}</h3></div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{group.categoryLabel} | {group.capacity} seater</p>
                  {offeredRate ? <div className="mt-2"><PackageOfferRibbon pricing={bookingRatePricing(offeredRate)} /></div> : null}
                  <p className="mt-2 text-sm font-bold text-primary-900">{packageMessages.price}: {formatAed(startingPrice)}</p>
                  <div className="mt-3 grid gap-1.5">{group.rates.map((rate) => <div key={rate.id} className="flex flex-wrap items-baseline gap-1.5 rounded-xl bg-primary-50 px-2 py-1.5 text-[10px] font-semibold text-primary-900"><span>{rate.minutes} min</span><PackageOfferPrice pricing={bookingRatePricing(rate)} audience="b2c" compact /></div>)}</div>
                </div>
                <span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-primary bg-primary text-white' : 'border-border bg-background')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PackageSelectionImage({ src, title, category, index }: { src: string; title: string; category: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = failed || !src ? getLivePackageImage(category, index) : src;
  return <img src={imageSrc} alt={title} onError={() => setFailed(true)} className="aspect-[16/8.4] w-full object-cover object-center" loading="lazy" />;
}

function DurationStep({ draft, onUpdate, messages }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void; messages: BookingMessages }) {
  const experience = getExperience(draft.experienceType);
  const packages: BookingRateOption[] = draft.selectedPackageRates || [];
  if (!packages.length) return <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">{messages.choosePackage}</div>;
  return <div><p className="mb-3 text-sm leading-6 text-muted-foreground">{messages.chooseDuration}: {draft.selectedPackageName || experience.title}</p><div className="grid gap-3 md:grid-cols-3">{packages.map((item) => {
    const pricing = bookingRatePricing(item);
    return <ChoiceButton key={item.id || item.minutes} active={draft.selectedPackageRateId === item.id} onClick={() => onUpdate({ selectedPackageRateId: item.id, selectedPackageName: item.title || draft.selectedPackageName, selectedPackageSlug: item.slug || draft.selectedPackageSlug, durationMinutes: item.minutes, selectedPackagePrice: item.price, selectedPackageB2BPrice: undefined, selectedPackageCapacity: item.capacity })} title={formatDuration(item.minutes)} detail={<PackageOfferPrice pricing={pricing} audience="b2c" compact />} ribbon={<PackageOfferRibbon pricing={pricing} />} />;
  })}</div></div>;
}

function ChoiceButton({ active, onClick, title, detail, ribbon }: { active: boolean; onClick: () => void; title: string; detail: ReactNode; ribbon?: ReactNode }) {
  return <button type="button" onClick={onClick} className={cn('group flex min-h-[84px] items-center justify-between gap-3 rounded-[1.05rem] border bg-white px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md', active ? 'border-primary bg-gradient-to-br from-primary-50 via-white to-accent-100/40 shadow-md ring-1 ring-primary/15' : 'border-border shadow-sm')} aria-pressed={active}><span className="min-w-0">{ribbon}<span className="mt-1 block text-[15px] font-bold leading-5 text-foreground">{title}</span><span className="mt-1.5 block text-xs font-medium text-muted-foreground">{detail}</span></span><span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border transition', active ? 'border-primary bg-primary text-white shadow-sm' : 'border-border bg-white group-hover:border-primary/45')}>{active ? <Check className="size-3" aria-hidden="true" /> : null}</span></button>;
}

function PartyStep({ draft, capacity, capacityPerVehicle, exceeded, onUpdate, messages }: { draft: BookingDraft; capacity: number; capacityPerVehicle: number; exceeded: boolean; onUpdate: (values: Partial<BookingDraft>) => void; messages: BookingMessages }) {
  return <div><p className="mb-4 text-sm leading-6 text-muted-foreground">{messages.capacityNote.replace('{count}', String(capacityPerVehicle))}</p><div className="grid gap-3 sm:grid-cols-2"><Counter label={messages.vehicles} helper={`${capacityPerVehicle} ${messages.guests}`} value={draft.vehicleQuantity} min={1} max={6} onChange={(vehicleQuantity) => onUpdate({ vehicleQuantity })} /><Counter label={messages.guests} helper={`${messages.capacityNote}: ${capacity}`} value={draft.guestCount} min={1} max={12} onChange={(guestCount) => onUpdate({ guestCount })} /></div><div className={cn('mt-4 rounded-[1.15rem] border px-4 py-3 text-sm', exceeded ? 'border-red-200 bg-red-50 text-red-700' : 'border-primary/15 bg-primary-50 text-primary-900')} role="status">{exceeded ? messages.capacityExceeded : `${draft.vehicleQuantity} ${messages.vehicles} | ${draft.guestCount} ${messages.guests}`}</div></div>;
}

function Counter({ label, helper, value, min, max, onChange }: { label: string; helper: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="rounded-[1.25rem] border border-border bg-white p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-foreground">{label}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div><div className="flex items-center gap-3"><button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:bg-primary-50 disabled:opacity-35" aria-label={`Decrease ${label}`}><Minus className="size-4" /></button><span className="w-6 text-center text-base font-bold text-foreground">{value}</span><button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:bg-primary-50 disabled:opacity-35" aria-label={`Increase ${label}`}><Plus className="size-4" /></button></div></div></div>;
}

function ScheduleStep({ draft, now, onUpdate, locale, messages }: { draft: BookingDraft; now: Date; onUpdate: (values: Partial<BookingDraft>) => void; locale: PublicLocale; messages: BookingMessages }) {
  const todayIso = dubaiDateValue(now);
  const todayParts = dubaiDateParts(now);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(todayParts.year, todayParts.month - 1, 1));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const minMonthKey = todayParts.year * 12 + todayParts.month - 1;
  const visibleMonthKey = year * 12 + month;
  const selectedDateIsToday = draft.preferredDate === todayIso;
  const availableToday = timeSlots.some((time) => isSelectableDubaiBookingTime(draft.preferredDate, time, now));

  function selectDate(iso: string) {
    const nextTime = draft.preferredTime && isSelectableDubaiBookingTime(iso, draft.preferredTime, now) ? draft.preferredTime : '';
    onUpdate({ preferredDate: iso, preferredTime: nextTime });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.92fr]">
      <div className="rounded-[1.25rem] border border-border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Previous month" disabled={visibleMonthKey <= minMonthKey} onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-border text-primary disabled:opacity-30"><ChevronLeft className="size-4" /></button>
          <p className="font-semibold text-foreground">{visibleMonth.toLocaleDateString(locale === 'ar' ? 'ar-AE' : locale === 'ru' ? 'ru-RU' : 'en-AE', { month: 'long', year: 'numeric' })}</p>
          <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} className="flex size-8 items-center justify-center rounded-full border border-border text-primary"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-muted-foreground">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const disabled = iso < todayIso;
            const selected = draft.preferredDate === iso;
            return <button key={iso} type="button" disabled={disabled} onClick={() => selectDate(iso)} className={cn('aspect-square rounded-lg text-xs font-semibold transition', selected ? 'bg-primary text-white shadow-sm' : 'hover:bg-primary-50', disabled && 'cursor-not-allowed text-muted-foreground/35 hover:bg-transparent')}>{day}</button>;
          })}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2"><Clock3 className="size-4 text-primary" aria-hidden="true" /><p className="font-semibold text-foreground">{messages.preferredTime}</p></div>
        {selectedDateIsToday ? <p className="mb-3 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold leading-5 text-primary-900">Past time slots are disabled using Dubai local time.</p> : null}
        <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {timeSlots.map((time) => {
            const disabled = !isSelectableDubaiBookingTime(draft.preferredDate, time, now);
            return <button key={time} type="button" disabled={disabled} onClick={() => onUpdate({ preferredTime: time })} className={cn('rounded-xl border px-3 py-2 text-sm font-semibold transition', draft.preferredTime === time ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/40', disabled && 'cursor-not-allowed border-border bg-slate-50 text-muted-foreground/45 line-through hover:border-border')}>{time}</button>;
          })}
        </div>
        {selectedDateIsToday && !availableToday ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">All slots for today have passed. Please select tomorrow or another date.</p> : null}
      </div>
    </div>
  );
}

function ContactStep({ draft, onUpdate, messages }: { draft: BookingDraft; onUpdate: (values: Partial<BookingDraft>) => void; messages: BookingMessages }) {
  const phoneValid = !draft.customerPhone || isValidPhone(draft.customerPhone);
  const emailValid = isValidOptionalEmail(draft.customerEmail);
  return <div className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className={fieldLabel}>{messages.fullName}<span className="relative"><UserRound className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input required autoComplete="name" maxLength={100} value={draft.customerName} onChange={(event) => onUpdate({ customerName: event.target.value })} className="pl-10" placeholder={messages.namePlaceholder} /></span></label><label className={fieldLabel}>{messages.phone}<span className="relative"><Phone className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={draft.customerPhone} onChange={(event) => onUpdate({ customerPhone: event.target.value })} className={cn('pl-10', !phoneValid && 'border-red-300 focus-visible:ring-red-200')} placeholder={messages.phonePlaceholder} /></span>{!phoneValid ? <span className="text-xs font-medium text-red-600">{messages.phonePlaceholder}</span> : null}</label></div><div className="grid gap-4 sm:grid-cols-2"><label className={fieldLabel}>{messages.email} <span className="font-normal text-muted-foreground">({messages.optional})</span><span className="relative"><Mail className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input type="email" autoComplete="email" maxLength={160} value={draft.customerEmail} onChange={(event) => onUpdate({ customerEmail: event.target.value })} className={cn('pl-10', !emailValid && 'border-red-300 focus-visible:ring-red-200')} placeholder={messages.emailPlaceholder} /></span>{!emailValid ? <span className="text-xs font-medium text-red-600">{messages.emailPlaceholder}</span> : null}</label><label className={fieldLabel}>{messages.hotelArea} <span className="font-normal text-muted-foreground">({messages.optional})</span><span className="relative"><MapPin className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input autoComplete="address-level2" maxLength={160} value={draft.customerHotelOrArea} onChange={(event) => onUpdate({ customerHotelOrArea: event.target.value })} className="pl-10" placeholder={messages.hotelPlaceholder} /></span></label></div><label className={fieldLabel}>{messages.notes} <span className="font-normal text-muted-foreground">({messages.optional})</span><Textarea maxLength={1000} value={draft.customerNotes} onChange={(event) => onUpdate({ customerNotes: event.target.value })} placeholder={messages.notesPlaceholder} /></label><p className="rounded-[1.15rem] bg-primary-50 px-4 py-3 text-xs leading-5 text-primary-900">{messages.noPaymentNow}</p></div>;
}

function ReviewStep({ draft, locale, messages }: { draft: BookingDraft; locale: PublicLocale; messages: BookingMessages }) {
  const experience = getExperience(draft.experienceType);
  const totals = getBookingTotals(draft);
  const isSales = experience.serviceType === 'sales_inquiry';
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : locale === 'ru' ? 'ru-RU' : 'en-AE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' }).format(new Date(`${draft.preferredDate}T12:00:00+04:00`));
  return <div><div className="grid gap-3 sm:grid-cols-2"><ReviewGroup title="Experience" items={[[draft.selectedPackageName || experience.title, isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)], ...(draft.selectedPackageCapacity ? [[`${draft.selectedPackageCapacity} seater`, draft.selectedPackageCategory ?? 'Selected vehicle']] : []), [`${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'}`, `${draft.guestCount} ${draft.guestCount === 1 ? 'guest' : 'guests'}`]]} /><ReviewGroup title="Schedule" items={[[date, `${draft.preferredTime} Dubai time`], [companyInfo.locationName, companyInfo.locationAddress]]} /><ReviewGroup title="Contact" items={[[draft.customerName, draft.customerPhone], [draft.customerEmail || 'Email not provided', draft.customerHotelOrArea || 'Area not provided']]} /><ReviewGroup title={isSales ? 'Pricing' : 'Estimate'} items={[[isSales ? 'Request quote' : formatAed(totals.totalAmount), isSales ? 'Our sales team will follow up' : 'Includes 5% VAT'], ['Payment status', 'Not Paid']]} /></div>{draft.customerNotes ? <div className="mt-3 rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Notes</p><p className="mt-2 text-sm leading-6 text-foreground">{draft.customerNotes}</p></div> : null}<div className="mt-4 rounded-[1.15rem] border border-primary/15 bg-primary-50 p-4 text-sm leading-6 text-primary-900">Submitting sends a request only. Your booking becomes final after our team confirms availability with you.</div></div>;
}

function ReviewGroup({ title, items }: { title: string; items: string[][] }) {
  return <div className="rounded-[1.15rem] border border-border bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{title}</p>{items.map(([label, value], index) => <div key={`${label}-${index}`} className={cn('mt-2.5', index && 'border-t border-border/60 pt-2.5')}><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{value}</p></div>)}</div>;
}
