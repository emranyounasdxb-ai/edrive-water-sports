'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Minus, Package, Plus, RefreshCw, UserRound, WalletCards } from 'lucide-react';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { useAgentPortal } from '@/components/edrive/agent/agent-portal-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatAed, timeSlots } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { createB2BBooking } from '@/services/b2b-finance';

type PackageRow = { id: string; title: string; category: string; duration_minutes: number; b2b_price: number; capacity: number | null; image_url: string | null; short_description: string | null };
type FormState = { packageId: string; vehicleQuantity: string; guestCount: string; preferredDate: string; preferredTime: string; customerName: string; customerPhone: string; customerEmail: string; customerHotelOrArea: string; customerNotes: string };
const initial: FormState = { packageId: '', vehicleQuantity: '1', guestCount: '1', preferredDate: '', preferredTime: '09:00 AM', customerName: '', customerPhone: '', customerEmail: '', customerHotelOrArea: '', customerNotes: '' };
const steps = [{ title: 'Package', icon: Package }, { title: 'Customer', icon: UserRound }, { title: 'Schedule', icon: CalendarDays }, { title: 'Review', icon: CheckCircle2 }];
const packageCategories = [
  { id: 'jet_ski', label: 'Jet Ski' },
  { id: 'jet_car_2', label: 'Jet Car 2 Seater' },
  { id: 'jet_car_4', label: 'Jet Car 4 Seater' }
] as const;
type PackageCategory = typeof packageCategories[number]['id'];

function packageCategory(item: PackageRow): PackageCategory {
  const normalized = item.category.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  if (normalized.includes('jet_ski')) return 'jet_ski';
  return Number(item.capacity || 0) >= 4 ? 'jet_car_4' : 'jet_car_2';
}

export default function AgentNewBookingPage() {
  const { walletBalance: balance, refreshingPortal, refreshPortal } = useAgentPortal();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [form, setForm] = useState<FormState>(initial);
  const [activeCategory, setActiveCategory] = useState<PackageCategory>('jet_ski');
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; deducted: number; remaining: number } | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const packageResult = await supabase.from('packages').select('id,title,category,duration_minutes,b2b_price,capacity,image_url,short_description,status,display_order').eq('status', 'active').gt('b2b_price', 0).order('display_order');
      if (packageResult.error) throw new Error(packageResult.error.message);
      const rows = (packageResult.data || []) as PackageRow[];
      const currentPackage = rows.find((item) => item.id === form.packageId);
      const firstCategory = currentPackage ? packageCategory(currentPackage) : packageCategories.find((category) => rows.some((item) => packageCategory(item) === category.id))?.id || 'jet_ski';
      const firstPackage = rows.find((item) => packageCategory(item) === firstCategory);
      setPackages(rows); setActiveCategory(firstCategory); setForm((current) => ({ ...current, packageId: current.packageId || firstPackage?.id || rows[0]?.id || '' }));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load booking form.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const selected = packages.find((item) => item.id === form.packageId) || null;
  const quantity = Math.max(Number(form.vehicleQuantity) || 1, 1);
  const unit = Number(selected?.b2b_price || 0);
  const subtotal = unit * quantity;
  const vat = subtotal * 0.05;
  const total = subtotal + vat;
  const remaining = balance - total;
  const shortfall = Math.max(-remaining, 0);
  const insufficient = total > balance;
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const selectCategory = (category: PackageCategory) => {
    setActiveCategory(category);
    const currentPackage = packages.find((item) => item.id === form.packageId);
    if (!currentPackage || packageCategory(currentPackage) !== category) {
      update('packageId', packages.find((item) => packageCategory(item) === category)?.id || '');
    }
  };

  function validateStep() {
    if (step === 0 && !selected) return 'Select a B2B package.';
    if (step === 1 && (!form.customerName.trim() || !form.customerPhone.trim())) return 'Customer name and phone are required.';
    if (step === 2 && (!form.preferredDate || !form.preferredTime)) return 'Select the booking date and time.';
    return '';
  }
  function next() { const validation = validateStep(); if (validation) { setError(validation); return; } setError(''); setStep((current) => Math.min(current + 1, 3)); }
  async function submit() {
    if (!selected || insufficient || saving) return;
    setSaving(true); setError('');
    try {
      const created = await createB2BBooking({ package_id: selected.id, vehicle_quantity: quantity, guest_count: Math.max(Number(form.guestCount) || 1, 1), preferred_date: form.preferredDate, preferred_time: form.preferredTime, customer_name: form.customerName.trim(), customer_phone: form.customerPhone.trim(), customer_email: form.customerEmail.trim() || null, customer_hotel_or_area: form.customerHotelOrArea.trim() || null, customer_notes: form.customerNotes.trim() || null });
      const code = String(created.booking_code || '');
      if (!code) throw new Error('Booking created without a booking reference.');
      const nextSummary = await refreshPortal();
      setSuccess({ code, deducted: total, remaining: nextSummary?.wallet_balance_aed ?? Math.max(balance - total, 0) });
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Unable to create booking.'); }
    finally { setSaving(false); }
  }
  function reset() {
    const firstCategory = packageCategories.find((category) => packages.some((item) => packageCategory(item) === category.id))?.id || 'jet_ski';
    setActiveCategory(firstCategory); setForm({ ...initial, packageId: packages.find((item) => packageCategory(item) === firstCategory)?.id || packages[0]?.id || '' }); setStep(0); setSuccess(null); setError('');
  }

  if (loading) return <><AgentPageHeader eyebrow="New booking" title="Create a partner booking" description="Complete four concise steps. Final pricing and wallet eligibility remain controlled by the secured booking RPC." /><BookingSkeleton /></>;
  if (success) return <div className="mx-auto max-w-xl py-7"><Card className="rounded-2xl border-emerald-200 shadow-xl"><CardContent className="p-6 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-8" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Booking confirmed</p><h1 className="mt-2 font-heading text-2xl font-semibold">{success.code}</h1><div className="mt-5 grid grid-cols-2 gap-3 text-left"><SummaryBox label="Wallet deducted" value={formatAed(success.deducted)} /><SummaryBox label="Remaining balance" value={formatAed(success.remaining)} /></div><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Button asChild><Link href="/agent/bookings">View Booking</Link></Button><Button variant="outline" onClick={reset}>Create Another Booking</Button></div></CardContent></Card></div>;

  return <>
    <AgentPageHeader eyebrow="New booking" title="Create a partner booking" description="Complete four concise steps. Final pricing and wallet eligibility remain controlled by the secured booking RPC." walletBalance={balance} actions={<Button variant="outline" disabled={refreshingPortal} onClick={() => refreshPortal()}><RefreshCw className={`size-4 ${refreshingPortal ? 'animate-spin' : ''}`} />Refresh balance</Button>} />
    {balance <= 0 ? <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Wallet funding is required</p><p className="mt-1 leading-6 text-red-800">Your current balance is AED 0.00. You may review available packages, but a booking cannot be submitted until the wallet is funded.</p></div><Button asChild variant="outline" className="shrink-0 border-red-300 bg-white text-red-800 hover:bg-red-100"><a href="tel:+97146113114">Contact for Top-up</a></Button></div> : null}
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div>
        <div className="grid grid-cols-4 gap-2">{steps.map(({ title, icon: Icon }, index) => <button type="button" key={title} onClick={() => index < step && setStep(index)} className={`rounded-xl border p-3 text-left transition ${index === step ? 'border-teal-500 bg-teal-50 text-teal-800' : index < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-400'}`}><div className="flex items-center gap-2">{index < step ? <Check className="size-4" /> : <Icon className="size-4" />}<span className="hidden text-xs font-bold sm:inline">{index + 1}. {title}</span><span className="text-xs font-bold sm:hidden">{index + 1}</span></div></button>)}</div>
        <Card className="mt-3.5 rounded-xl border-slate-200"><CardContent className="p-4 sm:p-5">
          {error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
          {step === 0 ? <PackageStep packages={packages} activeCategory={activeCategory} onCategoryChange={selectCategory} selectedId={form.packageId} onSelect={(id) => update('packageId', id)} quantity={quantity} setQuantity={(value) => update('vehicleQuantity', String(value))} /> : null}
          {step === 1 ? <CustomerStep form={form} update={update} /> : null}
          {step === 2 ? <ScheduleStep form={form} update={update} /> : null}
          {step === 3 ? <ReviewStep form={form} selected={selected} quantity={quantity} total={total} /> : null}
          <div className="mt-6 flex justify-between border-t border-slate-200 pt-5"><Button variant="outline" disabled={step === 0 || saving} onClick={() => { setError(''); setStep((current) => current - 1); }}><ChevronLeft className="size-4" />Back</Button>{step < 3 ? <Button onClick={next}>Continue<ChevronRight className="size-4" /></Button> : <Button disabled={saving || insufficient} onClick={submit}><WalletCards className="size-4" />{saving ? 'Creating booking...' : 'Confirm & Pay from Wallet'}</Button>}</div>
        </CardContent></Card>
      </div>
      <aside className="lg:sticky lg:top-5 lg:self-start"><Card className="rounded-xl border-slate-200 shadow-md"><CardContent className="p-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><WalletCards className="size-5" /></span><div><p className="text-xs font-semibold text-slate-500">Current wallet balance</p><p className="font-heading text-xl font-semibold">{formatAed(balance)}</p></div></div><div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4"><Row label="B2B unit price" value={formatAed(unit)} /><Row label="Vehicle quantity" value={String(quantity)} /><Row label="Subtotal" value={formatAed(subtotal)} /><Row label="VAT 5%" value={formatAed(vat)} /><Row label="Total wallet debit" value={formatAed(total)} strong /><div className="flex items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm font-bold text-teal-950"><span>Balance after booking</span><span className="shrink-0 whitespace-nowrap">{formatAed(Math.max(remaining, 0))}</span></div></div>{insufficient ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-bold">Insufficient wallet balance</p><p className="mt-1">Shortfall: {formatAed(shortfall)}. Call +971 4 611 3114 for top-up assistance.</p></div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Visible balance covers this booking. The secured RPC performs the final check.</div>}</CardContent></Card></aside>
    </div>
  </>;
}

function PackageStep({ packages, activeCategory, onCategoryChange, selectedId, onSelect, quantity, setQuantity }: {
  packages: PackageRow[];
  activeCategory: PackageCategory;
  onCategoryChange: (category: PackageCategory) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  quantity: number;
  setQuantity: (value: number) => void;
}) {
  const availableCategories = packageCategories.filter((category) => packages.some((item) => packageCategory(item) === category.id));
  const visiblePackages = packages.filter((item) => packageCategory(item) === activeCategory);
  return <section>
    <h2 className="font-heading text-lg font-semibold">Select package</h2>
    <p className="mt-1 text-sm text-slate-500">Choose the experience and number of vehicles.</p>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Package categories">
      {availableCategories.map((category) => <Button key={category.id} type="button" size="sm" role="tab" aria-selected={activeCategory === category.id} variant={activeCategory === category.id ? 'default' : 'outline'} className="shrink-0" onClick={() => onCategoryChange(category.id)}>{category.label}</Button>)}
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-2">{visiblePackages.map((item) => {
      const selectedPackage = selectedId === item.id;
      return <button type="button" key={item.id} onClick={() => onSelect(item.id)} aria-pressed={selectedPackage} className={`relative rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${selectedPackage ? 'border-2 border-teal-600 bg-teal-50 shadow-sm' : 'border-slate-200 hover:border-teal-300'}`}>
        {selectedPackage ? <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-teal-600 text-white"><Check className="size-4" /></span> : null}
        <div className="flex justify-between gap-8"><div className="min-w-0"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.duration_minutes} minutes | Capacity {item.capacity || '-'}</p></div><p className="shrink-0 whitespace-nowrap font-heading font-semibold text-teal-700">{formatAed(item.b2b_price)}</p></div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{item.short_description}</p>
      </button>;
    })}</div>
    <div className="mt-4">
      <p className="text-sm font-semibold">Vehicle quantity</p>
      <div className="mt-2 inline-flex h-10 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <button type="button" aria-label="Decrease vehicle quantity" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-full w-10 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"><Minus className="size-4" /></button>
        <output aria-live="polite" className="flex h-full min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-bold">{quantity}</output>
        <button type="button" aria-label="Increase vehicle quantity" disabled={quantity >= 20} onClick={() => setQuantity(Math.min(20, quantity + 1))} className="flex h-full w-10 items-center justify-center text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"><Plus className="size-4" /></button>
      </div>
    </div>
  </section>;
}
function CustomerStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: string) => void }) { return <section><h2 className="font-heading text-lg font-semibold">Customer details</h2><div className="mt-4 grid gap-3.5 sm:grid-cols-2"><Field label="Customer name" required value={form.customerName} onChange={(v) => update('customerName', v)} /><Field label="Phone number" required value={form.customerPhone} onChange={(v) => update('customerPhone', v)} /><Field label="Email" type="email" value={form.customerEmail} onChange={(v) => update('customerEmail', v)} /><Field label="Hotel or area" value={form.customerHotelOrArea} onChange={(v) => update('customerHotelOrArea', v)} /><Field label="Guest count" type="number" value={form.guestCount} onChange={(v) => update('guestCount', v)} /><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Customer notes<Textarea value={form.customerNotes} onChange={(e) => update('customerNotes', e.target.value)} /></label></div></section>; }
function ScheduleStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: string) => void }) { return <section><h2 className="font-heading text-lg font-semibold">Schedule</h2><div className="mt-4 grid gap-3.5 sm:grid-cols-2"><Field label="Preferred date" type="date" min={new Date().toISOString().slice(0, 10)} value={form.preferredDate} onChange={(v) => update('preferredDate', v)} /><label className="grid gap-2 text-sm font-semibold">Preferred time<select value={form.preferredTime} onChange={(e) => update('preferredTime', e.target.value)} className="h-11 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400">{timeSlots.map((time) => <option key={time}>{time}</option>)}</select></label></div></section>; }
function ReviewStep({ form, selected, quantity, total }: { form: FormState; selected: PackageRow | null; quantity: number; total: number }) { return <section><h2 className="font-heading text-lg font-semibold">Review & confirm</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><SummaryBox label="Package" value={selected?.title || '-'} /><SummaryBox label="Customer" value={form.customerName} /><SummaryBox label="Schedule" value={`${form.preferredDate} · ${form.preferredTime}`} /><SummaryBox label="Vehicles / Guests" value={`${quantity} / ${form.guestCount}`} /><SummaryBox label="Customer phone" value={form.customerPhone} /><SummaryBox label="Total wallet debit" value={formatAed(total)} /></div></section>; }
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) { return <label className="grid gap-2 text-sm font-semibold">{label}<Input value={value} onChange={(e) => onChange(e.target.value)} {...props} /></label>; }
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`flex justify-between gap-3 text-sm ${strong ? 'border-t-2 border-slate-300 pt-3 font-bold text-slate-950' : 'text-slate-600'}`}><span>{label}</span><span className="shrink-0 whitespace-nowrap">{value}</span></div>; }
function SummaryBox({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-3.5 text-left"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value || '-'}</p></div>; }
function BookingSkeleton() { return <div className="mt-4 grid animate-pulse gap-4 lg:grid-cols-[minmax(0,1fr)_310px]"><div><div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 rounded-xl bg-slate-200" />)}</div><div className="mt-4 h-80 rounded-xl bg-white shadow-sm" /></div><div className="h-72 rounded-xl bg-white shadow-sm" /></div>; }
