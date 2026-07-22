'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Mail, MessageCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortalAccess } from '@/components/edrive/portal-access';
import { supabase } from '@/lib/supabase-client';

type InquiryStatus = 'new' | 'reviewed' | 'contacted' | 'closed';

type InquiryRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  inquiry_type: string;
  message: string;
  source: string;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
};

const statusOptions: Array<{ value: InquiryStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' }
];

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai'
  }).format(new Date(value));
}

function preferredDateLabel(value: string | null) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dubai'
  }).format(new Date(`${value}T12:00:00+04:00`));
}

function statusTone(status: InquiryStatus) {
  if (status === 'closed') return 'border-slate-200 bg-slate-100 text-slate-700';
  if (status === 'contacted') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'reviewed') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function whatsappHref(row: InquiryRow) {
  let digits = row.phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  if (digits.length < 7) return '';
  const message = encodeURIComponent(`Hello ${row.name}, this is eDrive Water Sports regarding inquiry ${row.reference} about ${row.inquiry_type}.`);
  return `https://wa.me/${digits}?text=${message}`;
}

export default function InquiriesPage() {
  const { canMutateCurrentPage, isReadOnlyAdmin } = usePortalAccess();
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | InquiryStatus>('new');
  const [selected, setSelected] = useState<InquiryRow | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('contact_inquiries')
      .select('id,reference,name,phone,email,preferred_date,inquiry_type,message,source,status,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (queryError) {
      const message = queryError.message || 'Unable to load inquiries.';
      if (message.toLowerCase().includes('contact_inquiries') || message.toLowerCase().includes('schema cache')) {
        setError('The inquiry database migration has not been applied yet. Public inquiries will continue using the safe booking/WhatsApp fallback until the migration is installed.');
      } else {
        setError(message);
      }
      setItems([]);
    } else {
      setItems((data || []) as InquiryRow[]);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({
    all: items.length,
    new: items.filter((item) => item.status === 'new').length,
    reviewed: items.filter((item) => item.status === 'reviewed').length,
    contacted: items.filter((item) => item.status === 'contacted').length,
    closed: items.filter((item) => item.status === 'closed').length
  }), [items]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!term) return true;
      return [item.reference, item.name, item.phone, item.email, item.inquiry_type, item.message].some((value) => text(value).toLowerCase().includes(term));
    });
  }, [filter, items, query]);

  async function updateStatus(status: InquiryStatus) {
    if (!selected || !canMutateCurrentPage) return;
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('contact_inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', selected.id);

    if (updateError) {
      setError(updateError.message || 'Unable to update inquiry status.');
      setSaving(false);
      return;
    }

    setSelected(null);
    setSaving(false);
    await load();
  }

  const filters: Array<{ id: 'all' | InquiryStatus; label: string; count: number }> = [
    { id: 'new', label: 'New', count: counts.new },
    { id: 'reviewed', label: 'Reviewed', count: counts.reviewed },
    { id: 'contacted', label: 'Contacted', count: counts.contacted },
    { id: 'closed', label: 'Closed', count: counts.closed },
    { id: 'all', label: 'All', count: counts.all }
  ];

  return (
    <section className="w-full py-4 sm:py-6">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.06)] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Operations</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground">Contact inquiries</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Review website inquiries, contact guests and keep the response status current. Admin access remains read-only.</p>
        </div>
        <Button type="button" variant="outline" onClick={load} data-readonly-allow="true" className="w-fit rounded-full bg-white"><RefreshCw className="size-4" aria-hidden="true" />Refresh</Button>
      </div>

      {isReadOnlyAdmin ? <div className="mt-4 flex gap-3 rounded-2xl border border-primary/20 bg-primary-50 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-sm font-bold text-primary-900">Read-only inquiry access</p><p className="mt-1 text-xs leading-5 text-primary-900/75">You can review inquiry details, but only Super Admin and Booking Manager may change the workflow status.</p></div></div> : null}
      {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">{error}</p> : null}

      <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-border/80 bg-white">
        <CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div><CardTitle className="font-heading text-xl font-semibold">Inquiry inbox</CardTitle><p className="mt-1 text-xs font-semibold text-muted-foreground">{loading ? 'Loading...' : `${visible.length} of ${items.length} inquiries`}</p></div>
          <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, reference..." className="h-10 rounded-full bg-white pl-9" /></div>
        </CardHeader>
        <div className="flex gap-2 overflow-x-auto border-b border-border/70 bg-white px-4 py-3">{filters.map((item) => <button key={item.id} type="button" data-readonly-allow="true" onClick={() => setFilter(item.id)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${filter === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-white text-muted-foreground'}`}>{item.label} <span className={filter === item.id ? 'text-white/75' : 'text-muted-foreground'}>{item.count}</span></button>)}</div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1050px]">
              <TableHeader><TableRow className="bg-[#F7FAFA]"><TableHead>Reference</TableHead><TableHead>Guest</TableHead><TableHead>Inquiry</TableHead><TableHead>Preferred Date</TableHead><TableHead>Received</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Loading inquiries...</TableCell></TableRow> : null}
                {!loading && !visible.length ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No matching inquiries.</TableCell></TableRow> : null}
                {visible.map((row) => <TableRow key={row.id} className="align-top hover:bg-[#F7FAFA]"><TableCell><p className="font-mono text-xs font-bold text-primary">{row.reference}</p><p className="mt-1 text-xs text-muted-foreground">{row.source}</p></TableCell><TableCell><p className="font-semibold text-foreground">{row.name}</p><p className="text-xs text-muted-foreground">{row.phone}</p><p className="text-xs text-muted-foreground">{row.email || 'No email'}</p></TableCell><TableCell className="max-w-[22rem]"><p className="font-semibold text-foreground">{row.inquiry_type}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{row.message}</p></TableCell><TableCell className="whitespace-nowrap">{preferredDateLabel(row.preferred_date)}</TableCell><TableCell className="whitespace-nowrap">{dateTimeLabel(row.created_at)}</TableCell><TableCell><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(row.status)}`}>{statusOptions.find((item) => item.value === row.status)?.label || row.status}</span></TableCell><TableCell className="text-right"><Button type="button" size="sm" variant="outline" data-readonly-allow="true" onClick={() => setSelected(row)} className="rounded-full bg-white">View</Button></TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-border bg-white p-5 shadow-[0_28px_90px_rgba(8,37,50,0.24)]">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Inquiry {selected.reference}</p><h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">{selected.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.inquiry_type}</p></div><Button type="button" variant="outline" data-readonly-allow="true" onClick={() => setSelected(null)} className="rounded-full">Close</Button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Info icon={MessageCircle} label="Phone / WhatsApp" value={selected.phone} /><Info icon={Mail} label="Email" value={selected.email || 'Not provided'} /><Info icon={Clock3} label="Preferred Date" value={preferredDateLabel(selected.preferred_date)} /><Info icon={CheckCircle2} label="Current Status" value={statusOptions.find((item) => item.value === selected.status)?.label || selected.status} /></div>
            <div className="mt-4 rounded-2xl border border-border bg-[#F7FAFA] p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Customer message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{selected.message}</p></div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {whatsappHref(selected) ? <Button asChild><a href={whatsappHref(selected)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp Guest</a></Button> : null}
                {selected.email ? <Button asChild variant="outline"><a href={`mailto:${selected.email}?subject=${encodeURIComponent(`eDrive inquiry ${selected.reference}`)}`}><Mail className="size-4" aria-hidden="true" />Email Guest</a></Button> : null}
              </div>
              {canMutateCurrentPage ? <label className="grid min-w-[12rem] gap-1.5 text-sm font-semibold text-foreground">Workflow Status<select value={selected.status} disabled={saving} onChange={(event) => void updateStatus(event.target.value as InquiryStatus)} className="h-10 rounded-xl border border-border bg-white px-3 text-sm">{statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MessageCircle; label: string; value: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p></div></div>;
}
