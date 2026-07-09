'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarPlus, CheckCircle2, LogOut, PackageCheck, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BrandMark } from '@/components/edrive/brand';
import { bookingRequestsTable } from '@/lib/booking-records';
import { formatAed, generateBookingCode, timeSlots } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';

type AgentProfile = {
  id: string;
  agent_code: string | null;
  company_name: string;
  contact_person: string;
  login_email: string | null;
  email: string | null;
  phone: string | null;
  status: string;
};

type PackageRow = {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  duration_minutes: number;
  base_price: number;
  b2b_price: number;
  capacity: number | null;
  image_url: string | null;
  short_description: string | null;
};

type FormState = {
  packageId: string;
  vehicleQuantity: string;
  guestCount: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerHotelOrArea: string;
  customerNotes: string;
};

const emptyForm: FormState = {
  packageId: '',
  vehicleQuantity: '1',
  guestCount: '2',
  preferredDate: '',
  preferredTime: '09:00 AM',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerHotelOrArea: '',
  customerNotes: ''
};

function isActiveStatus(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase() === 'active';
}

function serviceFromCategory(category: string) {
  if (category === 'jet_car_rental') return 'jet-car-rental';
  return 'jet-ski-rental';
}

function categoryLabel(category: string) {
  if (category === 'jet_car_rental') return 'Jet Car Rental';
  if (category === 'jet_ski_rental') return 'Jet Ski Rental';
  return category.replace(/_/g, ' ');
}

function packageSelectLabel(item: PackageRow) {
  return item.title || `${categoryLabel(item.category)} ${item.duration_minutes} min`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function B2BNewBookingPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) {
        router.replace('/admin/login');
        return;
      }

      const { data: agentData, error: agentError } = await supabase
        .from('b2b_agents')
        .select('id,agent_code,company_name,contact_person,login_email,email,phone,status')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (!active) return;

      const nextAgent = agentData as AgentProfile | null;
      if (agentError || !nextAgent || !isActiveStatus(nextAgent.status)) {
        setError(agentError?.message || 'Active B2B agent profile nahi mila.');
        setLoading(false);
        return;
      }

      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('id,title,slug,category,duration_minutes,base_price,b2b_price,capacity,image_url,short_description,status,display_order')
        .eq('status', 'active')
        .gt('b2b_price', 0)
        .order('category')
        .order('capacity')
        .order('duration_minutes');

      if (!active) return;

      if (packageError) {
        setError(packageError.message);
        setLoading(false);
        return;
      }

      const rows = (packageData || []) as PackageRow[];
      setAgent(nextAgent);
      setPackages(rows);
      setForm((current) => ({ ...current, packageId: current.packageId || rows[0]?.id || '' }));
      setLoading(false);
    }

    void loadData();
    return () => { active = false; };
  }, [router]);

  const selectedPackage = useMemo(() => packages.find((item) => item.id === form.packageId) || null, [packages, form.packageId]);
  const vehicleQuantity = Math.max(Number(form.vehicleQuantity || 1), 1);
  const guestCount = Math.max(Number(form.guestCount || 1), 1);
  const unitPrice = Number(selectedPackage?.b2b_price || 0);
  const subtotal = unitPrice * vehicleQuantity;
  const vatAmount = subtotal * 0.05;
  const totalAmount = subtotal + vatAmount;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessCode('');

    try {
      if (!agent) throw new Error('B2B agent profile missing.');
      if (!selectedPackage) throw new Error('Please select a B2B package.');
      if (!form.customerName.trim()) throw new Error('Customer name is required.');
      if (!form.customerPhone.trim()) throw new Error('Customer phone is required.');
      if (!form.preferredDate) throw new Error('Preferred date is required.');
      if (!form.preferredTime) throw new Error('Preferred time is required.');
      if (unitPrice <= 0) throw new Error('B2B price is not set for selected package.');

      const now = new Date().toISOString();
      const bookingCode = generateBookingCode();
      const agentEmail = agent.login_email || agent.email || '';
      const packageCategory = selectedPackage.category;

      const { error: insertError } = await supabase.from(bookingRequestsTable).insert({
        booking_code: bookingCode,
        booking_number: bookingCode,
        source: 'b2b',
        booking_source: 'b2b',
        status: 'Pending',
        admin_status: 'New',
        manager_status: 'Pending',
        selected_package_name: selectedPackage.title,
        selected_package_slug: selectedPackage.slug,
        selected_package_category: packageCategory,
        selected_package_price: Number(selectedPackage.base_price || 0),
        selected_package_b2b_price: unitPrice,
        selected_package_capacity: Number(selectedPackage.capacity || 2),
        experience_type: serviceFromCategory(packageCategory),
        service_type: 'rental',
        duration_minutes: Number(selectedPackage.duration_minutes || 0),
        inquiry_type: null,
        vehicle_quantity: vehicleQuantity,
        guest_count: guestCount,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        meeting_point_name: 'Dubai Islands Marina',
        meeting_point_address: 'Dubai Islands Marina',
        customer_name: form.customerName.trim(),
        customer_phone: form.customerPhone.trim(),
        customer_email: form.customerEmail.trim() || null,
        customer_hotel_or_area: form.customerHotelOrArea.trim() || null,
        customer_notes: form.customerNotes.trim() || null,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        payment_status: 'Not Paid',
        payment_method: 'B2B Invoice',
        payment_source: 'b2b',
        payment_workflow_status: 'pending_from_b2b_agent',
        collection_status: 'with_b2b_agent',
        amount_received_aed: 0,
        amount_pending_aed: totalAmount,
        b2b_agent_id: agent.id,
        b2b_agent_code: agent.agent_code,
        b2b_agent_name: agent.company_name,
        b2b_agent_email: agentEmail,
        customer_arrived: false,
        created_at: now,
        updated_at: now
      });

      if (insertError) throw new Error(insertError.message);
      setSuccessCode(bookingCode);
      setForm({ ...emptyForm, packageId: packages[0]?.id || '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create B2B booking.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F4F7F8] text-sm font-semibold text-muted-foreground">Loading B2B booking form...</div>;

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#F5F8F8_0%,#EEF7F7_52%,#F8F2E8_100%)] px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.7rem] border border-white/85 bg-white/82 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-7">
          <Link href="/agent" className="w-fit"><BrandMark /></Link>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="rounded-full bg-white/90"><Link href="/agent"><ArrowLeft className="size-4" aria-hidden="true" />Dashboard</Link></Button>
            <Button asChild variant="outline" className="rounded-full bg-white/90"><Link href="/agent/bookings">My Bookings</Link></Button>
            <Button type="button" onClick={handleLogout} className="rounded-full bg-primary-900 hover:bg-primary-800"><LogOut className="size-4" aria-hidden="true" />Logout</Button>
          </div>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden rounded-[2rem] border-white/85 bg-white/86 shadow-[0_24px_70px_rgba(8,37,50,0.10)]">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
              <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><CalendarPlus className="size-5" aria-hidden="true" /></div>
              <CardTitle className="font-heading text-2xl font-semibold">Create B2B booking</CardTitle>
              <CardDescription>{agent?.company_name} ke liye booking create karein. Package select karein, B2B price side summary me show hogi.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
              {successCode ? <p className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" aria-hidden="true" />Booking created: {successCode}</p> : null}

              <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-foreground md:col-span-2">
                  B2B Package
                  <select value={form.packageId} onChange={(event) => updateField('packageId', event.target.value)} required className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
                    {packages.map((item) => <option key={item.id} value={item.id}>{packageSelectLabel(item)}</option>)}
                  </select>
                </label>
                <FormInput label="Customer Name" value={form.customerName} required onChange={(value) => updateField('customerName', value)} />
                <FormInput label="Customer Phone" value={form.customerPhone} required onChange={(value) => updateField('customerPhone', value)} />
                <FormInput label="Customer Email" type="email" value={form.customerEmail} onChange={(value) => updateField('customerEmail', value)} />
                <FormInput label="Hotel / Area" value={form.customerHotelOrArea} onChange={(value) => updateField('customerHotelOrArea', value)} />
                <FormInput label="Preferred Date" type="date" min={todayIso()} value={form.preferredDate} required onChange={(value) => updateField('preferredDate', value)} />
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                  Preferred Time
                  <select value={form.preferredTime} onChange={(event) => updateField('preferredTime', event.target.value)} required className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
                    {timeSlots.map((slot) => <option key={slot}>{slot}</option>)}
                  </select>
                </label>
                <FormInput label="Vehicles" type="number" min="1" value={form.vehicleQuantity} required onChange={(value) => updateField('vehicleQuantity', value)} />
                <FormInput label="Guests" type="number" min="1" value={form.guestCount} required onChange={(value) => updateField('guestCount', value)} />
                <label className="grid gap-1.5 text-sm font-semibold text-foreground md:col-span-2">
                  Notes
                  <Textarea value={form.customerNotes} onChange={(event) => updateField('customerNotes', event.target.value)} placeholder="Customer request, hotel pickup note, or internal partner note." />
                </label>
                <div className="md:col-span-2"><Button type="submit" disabled={saving || packages.length === 0} className="w-full rounded-full"><Save className="size-4" aria-hidden="true" />{saving ? 'Saving...' : 'Create Booking'}</Button></div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit overflow-hidden rounded-[2rem] border-white/85 bg-white/86 shadow-[0_24px_70px_rgba(8,37,50,0.10)]">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
              <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><PackageCheck className="size-5" aria-hidden="true" /></div>
              <CardTitle className="font-heading text-2xl font-semibold">B2B price summary</CardTitle>
              <CardDescription>Agent ko yahi price nazar aayegi. B2C price yahan show nahi hoti.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-5">
              <SummaryLine label="Package" value={selectedPackage?.title || '-'} />
              <SummaryLine label="Ride Type" value={selectedPackage ? categoryLabel(selectedPackage.category) : '-'} />
              <SummaryLine label="Duration" value={selectedPackage ? `${selectedPackage.duration_minutes} min` : '-'} />
              <SummaryLine label="B2B Unit Price" value={formatAed(unitPrice)} />
              <SummaryLine label="Vehicles" value={String(vehicleQuantity)} />
              <SummaryLine label="Subtotal" value={formatAed(subtotal)} />
              <SummaryLine label="VAT 5%" value={formatAed(vatAmount)} />
              <div className="mt-2 rounded-2xl bg-primary-50 p-4"><SummaryLine label="Total Payable" value={formatAed(totalAmount)} strong /></div>
              {packages.length === 0 ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">No active B2B package price found. Admin packages me B2B price add karni hogi.</p> : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false, min }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground">{label}<Input required={required} type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl" /></label>;
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-muted-foreground">{label}</span><span className={strong ? 'font-heading text-xl font-semibold text-primary-900' : 'font-semibold text-foreground'}>{value}</span></div>;
}
