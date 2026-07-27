'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Package, RefreshCw, UserRound, WalletCards } from 'lucide-react';
import { AgentPageHeader } from '@/components/edrive/agent/agent-page-header';
import { AgentPortalShell, type AgentPortalProfile } from '@/components/edrive/agent/agent-portal-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatAed, timeSlots } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { createB2BBooking, getB2BFinanceSummary } from '@/services/b2b-finance';

type PackageRow = { id: string; title: string; category: string; duration_minutes: number; b2b_price: number; capacity: number | null; image_url: string | null; short_description: string | null };
type FormState = { packageId: string; vehicleQuantity: string; guestCount: string; preferredDate: string; preferredTime: string; customerName: string; customerPhone: string; customerEmail: string; customerHotelOrArea: string; customerNotes: string };
const initial: FormState = { packageId: '', vehicleQuantity: '1', guestCount: '1', preferredDate: '', preferredTime: '09:00 AM', customerName: '', customerPhone: '', customerEmail: '', customerHotelOrArea: '', customerNotes: '' };
const steps = [{ title: 'Package', icon: Package }, { title: 'Customer', icon: UserRound }, { title: 'Schedule', icon: CalendarDays }, { title: 'Review', icon: CheckCircle2 }];

export default function AgentNewBookingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentPortalProfile | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [balance, setBalance] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; deducted: number; remaining: number } | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) { router.replace('/admin/login'); return; }
      const profileResult = await supabase.from('b2b_agents').select('id,agent_code,company_name,contact_person,status').eq('auth_user_id', session.session.user.id).maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const next = profileResult.data as AgentPortalProfile | null;
      if (!next || String(next.status).toLowerCase() !== 'active') throw new Error('An active B2B Agent profile is required.');
      const [summary, packageResult] = await Promise.all([
        getB2BFinanceSummary(),
        supabase.from('packages').select('id,title,category,duration_minutes,b2b_price,capacity,image_url,short_description,status,display_order').eq('status', 'active').gt('b2b_price', 0).order('display_order')
      ]);
      if (packageResult.error) throw new Error(packageResult.error.message);
      const rows = (packageResult.data || []) as PackageRow[];
      setProfile(next); setBalance(summary.wallet_balance_aed); setPackages(rows); setForm((current) => ({ ...current, packageId: current.packageId || rows[0]?.id || '' }));
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

  function validateStep() {
    if (step === 0 && !selected) return 'Select a B2B package.';
    if (step === 1 && (!form.customerName.trim() || !form.customerPhone.trim())) return 'Customer name and phone are required.';
    if (step === 2 && (!form.preferredDate || !form.preferredTime)) return 'Select the booking date and time.';
    return '';
  }
  function next() { const validation = validateStep(); if (validation) { setError(validation); return; } setError(''); setStep((current) => Math.min(current + 1, 3)); }
  async function submit() {
    if (!profile || !selected || insufficient || saving) return;
    setSaving(true); setError('');
    try {
      const created = await createB2BBooking({ package_id: selected.id, vehicle_quantity: quantity, guest_count: Math.max(Number(form.guestCount) || 1, 1), preferred_date: form.preferredDate, preferred_time: form.preferredTime, customer_name: form.customerName.trim(), customer_phone: form.customerPhone.trim(), customer_email: form.customerEmail.trim() || null, customer_hotel_or_area: form.customerHotelOrArea.trim() || null, customer_notes: form.customerNotes.trim() || null });
      const code = String(created.booking_code || '');
      if (!code) throw new Error('Booking created without a booking reference.');
      const nextSummary = await getB2BFinanceSummary();
      setBalance(nextSummary.wallet_balance_aed); setSuccess({ code, deducted: total, remaining: nextSummary.wallet_balance_aed });
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Unable to create booking.'); }
    finally { setSaving(false); }
  }
  function reset() { setForm({ ...initial, packageId: packages[0]?.id || '' }); setStep(0); setSuccess(null); setError(''); }

  if (loading) return <div className="min-h-screen animate-pulse bg-slate-50 p-6"><div className="mx-auto h-[32rem] max-w-6xl rounded-2xl bg-slate-200" /></div>;
  if (!profile) return <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-red-700">{error || 'Booking access unavailable.'}</div>;
  if (success) return <AgentPortalShell profile={profile} walletBalance={balance}><div className="mx-auto max-w-xl py-7"><Card className="rounded-2xl border-emerald-200 shadow-xl"><CardContent className="p-6 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-8" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Booking confirmed</p><h1 className="mt-2 font-heading text-2xl font-semibold">{success.code}</h1><div className="mt-5 grid grid-cols-2 gap-3 text-left"><SummaryBox label="Wallet deducted" value={formatAed(success.deducted)} /><SummaryBox label="Remaining balance" value={formatAed(success.remaining)} /></div><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Button asChild><Link href="/agent/bookings">View Booking</Link></Button><Button variant="outline" onClick={reset}>Create Another Booking</Button></div></CardContent></Card></div></AgentPortalShell>;

  return <AgentPortalShell profile={profile} walletBalance={balance}>
    <AgentPageHeader eyebrow="New booking" title="Create a partner booking" description="Complete four concise steps. Final pricing and wallet eligibility remain controlled by the secured booking RPC." walletBalance={balance} actions={<Button variant="outline" onClick={load}><RefreshCw className="size-4" />Refresh balance</Button>} />
    {balance <= 0 ? <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Wallet funding is required</p><p className="mt-1 leading-6 text-red-800">Your current balance is AED 0.00. You may review available packages, but a booking cannot be submitted until the wallet is funded.</p></div><Button asChild variant="outline" className="shrink-0 border-red-300 bg-white text-red-800 hover:bg-red-100"><a href="tel:+97146113114">Contact for Top-up</a></Button></div> : null}
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div>
        <div className="grid grid-cols-4 gap-2">{steps.map(({ title, icon: Icon }, index) => <button type="button" key={title} onClick={() => index < step && setStep(index)} className={`rounded-xl border p-3 text-left transition ${index === step ? 'border-teal-500 bg-teal-50 text-teal-800' : index < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-400'}`}><div className="flex items-center gap-2">{index < step ? <Check className="size-4" /> : <Icon className="size-4" />}<span className="hidden text-xs font-bold sm:inline">{index + 1}. {title}</span><span className="text-xs font-bold sm:hidden">{index + 1}</span></div></button>)}</div>
        <Card className="mt-3.5 rounded-xl border-slate-200"><CardContent className="p-4 sm:p-5">
          {error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
          {step === 0 ? <PackageStep packages={packages} selectedId={form.packageId} onSelect={(id) => update('packageId', id)} quantity={form.vehicleQuantity} setQuantity={(value) => update('vehicleQuantity', value)} /> : null}
          {step === 1 ? <CustomerStep form={form} update={update} /> : null}
          {step === 2 ? <ScheduleStep form={form} update={update} /> : null}
          {step === 3 ? <ReviewStep form={form} selected={selected} quantity={quantity} total={total} /> : null}
          <div className="mt-6 flex justify-between border-t border-slate-200 pt-5"><Button variant="outline" disabled={step === 0 || saving} onClick={() => { setError(''); setStep((current) => current - 1); }}><ChevronLeft className="size-4" />Back</Button>{step < 3 ? <Button onClick={next}>Continue<ChevronRight className="size-4" /></Button> : <Button disabled={saving || insufficient} onClick={submit}><WalletCards className="size-4" />{saving ? 'Creating booking...' : 'Confirm & Pay from Wallet'}</Button>}</div>
        </CardContent></Card>
      </div>
      <aside className="lg:sticky lg:top-5 lg:self-start"><Card className="rounded-xl border-slate-200 shadow-md"><CardContent className="p-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><WalletCards className="size-5" /></span><div><p className="text-xs font-semibold text-slate-500">Current wallet balance</p><p className="font-heading text-xl font-semibold">{formatAed(balance)}</p></div></div><div className="mt-4 space-y-2.5 border-t border-slate-200 pt-4"><Row label="B2B unit price" value={formatAed(unit)} /><Row label="Vehicle quantity" value={String(quantity)} /><Row label="Subtotal" value={formatAed(subtotal)} /><Row label="VAT 5%" value={formatAed(vat)} /><Row label="Total wallet debit" value={formatAed(total)} strong /><Row label="Balance after booking" value={formatAed(Math.max(remaining, 0))} strong /></div>{insufficient ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><p className="font-bold">Insufficient wallet balance</p><p className="mt-1">Shortfall: {formatAed(shortfall)}. Call +971 4 611 3114 for top-up assistance.</p></div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Visible balance covers this booking. The secured RPC performs the final check.</div>}</CardContent></Card></aside>
    </div>
  </AgentPortalShell>;
}

function PackageStep({ packages, selectedId, onSelect, quantity, setQuantity }: { packages: PackageRow[]; selectedId: string; onSelect: (id: string) => void; quantity: string; setQuantity: (value: string) => void }) { return <section><h2 className="font-heading text-lg font-semibold">Select package</h2><p className="mt-1 text-sm text-slate-500">Choose the experience and number of vehicles.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{packages.map((item) => <button type="button" key={item.id} onClick={() => onSelect(item.id)} className={`rounded-xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${selectedId === item.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}><div className="flex justify-between gap-3"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.duration_minutes} minutes · Capacity {item.capacity || '-'}</p></div><p className="font-heading font-semibold text-teal-700">{formatAed(item.b2b_price)}</p></div><p className="mt-3 text-xs leading-5 text-slate-500">{item.short_description}</p></button>)}</div><label className="mt-4 grid max-w-xs gap-2 text-sm font-semibold">Vehicle quantity<Input type="number" min="1" max="20" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label></section>; }
function CustomerStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: string) => void }) { return <section><h2 className="font-heading text-lg font-semibold">Customer details</h2><div className="mt-4 grid gap-3.5 sm:grid-cols-2"><Field label="Customer name" required value={form.customerName} onChange={(v) => update('customerName', v)} /><Field label="Phone number" required value={form.customerPhone} onChange={(v) => update('customerPhone', v)} /><Field label="Email" type="email" value={form.customerEmail} onChange={(v) => update('customerEmail', v)} /><Field label="Hotel or area" value={form.customerHotelOrArea} onChange={(v) => update('customerHotelOrArea', v)} /><Field label="Guest count" type="number" value={form.guestCount} onChange={(v) => update('guestCount', v)} /><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Customer notes<Textarea value={form.customerNotes} onChange={(e) => update('customerNotes', e.target.value)} /></label></div></section>; }
function ScheduleStep({ form, update }: { form: FormState; update: (key: keyof FormState, value: string) => void }) { return <section><h2 className="font-heading text-lg font-semibold">Schedule</h2><div className="mt-4 grid gap-3.5 sm:grid-cols-2"><Field label="Preferred date" type="date" min={new Date().toISOString().slice(0, 10)} value={form.preferredDate} onChange={(v) => update('preferredDate', v)} /><label className="grid gap-2 text-sm font-semibold">Preferred time<select value={form.preferredTime} onChange={(e) => update('preferredTime', e.target.value)} className="h-11 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400">{timeSlots.map((time) => <option key={time}>{time}</option>)}</select></label></div></section>; }
function ReviewStep({ form, selected, quantity, total }: { form: FormState; selected: PackageRow | null; quantity: number; total: number }) { return <section><h2 className="font-heading text-lg font-semibold">Review & confirm</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><SummaryBox label="Package" value={selected?.title || '-'} /><SummaryBox label="Customer" value={form.customerName} /><SummaryBox label="Schedule" value={`${form.preferredDate} · ${form.preferredTime}`} /><SummaryBox label="Vehicles / Guests" value={`${quantity} / ${form.guestCount}`} /><SummaryBox label="Customer phone" value={form.customerPhone} /><SummaryBox label="Total wallet debit" value={formatAed(total)} /></div></section>; }
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) { return <label className="grid gap-2 text-sm font-semibold">{label}<Input value={value} onChange={(e) => onChange(e.target.value)} {...props} /></label>; }
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`flex justify-between gap-3 text-sm ${strong ? 'border-t border-slate-200 pt-3 font-bold' : 'text-slate-600'}`}><span>{label}</span><span className="shrink-0 whitespace-nowrap">{value}</span></div>; }
function SummaryBox({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-slate-50 p-3.5 text-left"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value || '-'}</p></div>; }
