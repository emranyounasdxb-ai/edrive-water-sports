'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CircleDollarSign, Eye, EyeOff, Link2, Pencil, Plus, RefreshCw, Search, ShieldCheck, UsersRound, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';
import { manageB2BAgentProfile, setB2BAgentStatus } from '@/services/b2b-finance';
import { provisionB2BAgentUser } from '@/services/portal-user-provisioning';
import { usePortalAccess } from './portal-access';

type Agent = {
  id: string; auth_user_id: string | null; agent_code: string | null; company_name: string;
  agent_type: string | null; contact_person: string | null; phone: string | null; login_email: string | null;
  billing_email: string | null; payment_terms: string | null; status: string; rate_profile: string | null;
  special_pricing: boolean | null; notes: string | null; created_at: string | null;
};
type Wallet = { b2b_agent_id: string; balance_aed: number };
type Booking = { id: string; b2b_agent_id: string; booking_code: string | null; customer_name: string | null; selected_package_name: string | null; total_amount: number | null; status: string | null; created_at: string | null };
type Request = { id: string; b2b_agent_id: string; booking_request_id: string; status: string; requested_at: string };
type Ledger = { id: string; b2b_agent_id: string; transaction_type: string; direction: string; amount_aed: number; description: string; created_at: string };
type Form = { auth_user_id: string; company_name: string; agent_code: string; agent_type: string; contact_person: string; phone: string; billing_email: string; login_email: string; initial_password: string; confirm_password: string; payment_terms: string; rate_profile: string; special_pricing: boolean; status: 'Active' | 'Suspended' | 'Inactive'; notes: string };

const blankForm: Form = { auth_user_id: '', company_name: '', agent_code: '', agent_type: 'B2B Agent', contact_person: '', phone: '', billing_email: '', login_email: '', initial_password: '', confirm_password: '', payment_terms: 'Instant', rate_profile: 'Default B2B Package Rates', special_pricing: false, status: 'Active', notes: '' };
const selectClass = 'h-11 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

export function AdminB2BAgentsPolishedPage() {
  const { role } = usePortalAccess();
  const canManage = role === 'super_admin';
  const [agents, setAgents] = useState<Agent[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [authFilter, setAuthFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [form, setForm] = useState<Form>(blankForm);

  async function load(refresh = false) {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [agentResult, walletResult, bookingResult, requestResult, ledgerResult] = await Promise.all([
        supabase.from('b2b_agents').select('*').order('created_at', { ascending: false }),
        supabase.from('b2b_wallets').select('b2b_agent_id,balance_aed'),
        supabase.from('booking_requests').select('id,b2b_agent_id,booking_code,customer_name,selected_package_name,total_amount,status,created_at').not('b2b_agent_id', 'is', null).order('created_at', { ascending: false }),
        supabase.from('b2b_refund_requests').select('id,b2b_agent_id,booking_request_id,status,requested_at').order('requested_at', { ascending: false }),
        supabase.from('b2b_wallet_ledger').select('id,b2b_agent_id,transaction_type,direction,amount_aed,description,created_at').order('created_at', { ascending: false })
      ]);
      const failure = agentResult.error || walletResult.error || bookingResult.error || requestResult.error || ledgerResult.error;
      if (failure) throw new Error(failure.message);
      setAgents((agentResult.data || []) as Agent[]); setWallets((walletResult.data || []) as Wallet[]); setBookings((bookingResult.data || []) as Booking[]); setRequests((requestResult.data || []) as Request[]); setLedger((ledgerResult.data || []) as Ledger[]);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load B2B partner accounts.'); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); }, []);

  const walletFor = (id: string) => Number(wallets.find((wallet) => wallet.b2b_agent_id === id)?.balance_aed || 0);
  const bookingsFor = (id: string) => bookings.filter((booking) => booking.b2b_agent_id === id);
  const requestsFor = (id: string) => requests.filter((request) => request.b2b_agent_id === id);
  const ledgerFor = (id: string) => ledger.filter((entry) => entry.b2b_agent_id === id);
  const lastActivity = (agent: Agent) => [agent.created_at, bookingsFor(agent.id)[0]?.created_at, requestsFor(agent.id)[0]?.requested_at, ledgerFor(agent.id)[0]?.created_at].filter(Boolean).sort().reverse()[0] || null;
  const totalWallet = wallets.reduce((sum, wallet) => sum + Number(wallet.balance_aed || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const pendingRequests = requests.filter((request) => request.status === 'Pending').length;
  const visibleAgents = useMemo(() => agents.filter((agent) => {
    const text = `${agent.company_name} ${agent.agent_code} ${agent.contact_person} ${agent.login_email}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'All' || agent.status === statusFilter) && (authFilter === 'All' || (authFilter === 'Linked' ? Boolean(agent.auth_user_id) : !agent.auth_user_id));
  }), [agents, query, statusFilter, authFilter]);

  function openAdd() { setEditing(null); setForm(blankForm); setFormOpen(true); setError(''); setSuccess(''); }
  function openEdit(agent: Agent) {
    setEditing(agent); setForm({ auth_user_id: agent.auth_user_id || '', company_name: agent.company_name || '', agent_code: agent.agent_code || '', agent_type: agent.agent_type || 'B2B Agent', contact_person: agent.contact_person || '', phone: agent.phone || '', billing_email: agent.billing_email || '', login_email: agent.login_email || '', initial_password: '', confirm_password: '', payment_terms: agent.payment_terms || 'Instant', rate_profile: agent.rate_profile || 'Default B2B Package Rates', special_pricing: Boolean(agent.special_pricing), status: (agent.status as Form['status']) || 'Active', notes: agent.notes || '' }); setFormOpen(true); setProfileOpen(false); setError(''); setSuccess('');
  }
  function field<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function save() {
    if (!canManage || saving) return;
    if (!form.company_name.trim() || !form.login_email.trim() || (editing && !form.auth_user_id.trim())) { setError('Company name and login email are required.'); return; }
    if (!editing && form.initial_password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (!editing && !(form.initial_password.length >= 12 && /[A-Z]/.test(form.initial_password) && /[a-z]/.test(form.initial_password) && /\d/.test(form.initial_password) && /[^A-Za-z0-9]/.test(form.initial_password))) { setError('Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const profile = { company_name: form.company_name.trim(), agent_code: form.agent_code.trim(), agent_type: form.agent_type, contact_person: form.contact_person.trim(), phone: form.phone.trim(), login_email: form.login_email.trim().toLowerCase(), email: form.login_email.trim().toLowerCase(), billing_email: form.billing_email.trim().toLowerCase() || form.login_email.trim().toLowerCase(), payment_terms: form.payment_terms, rate_profile: form.rate_profile.trim(), special_pricing: form.special_pricing, status: form.status, notes: form.notes.trim() || null };
      if (editing) await manageB2BAgentProfile(editing.id, form.auth_user_id.trim(), profile);
      else await provisionB2BAgentUser({ email: form.login_email, initial_password: form.initial_password, profile });
      setForm(blankForm);
      setSuccess(editing ? 'Partner profile updated.' : 'Partner profile created and linked.'); await load(true); setFormOpen(false);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save partner profile.'); }
    finally { setSaving(false); }
  }
  async function changeStatus(agent: Agent) {
    if (!canManage || saving) return;
    const next = agent.status === 'Active' ? 'Suspended' : 'Active';
    setSaving(true); setError('');
    try { await setB2BAgentStatus(agent.id, next); await load(true); if (selected?.id === agent.id) setSelected({ ...agent, status: next }); }
    catch (statusError) { setError(statusError instanceof Error ? statusError.message : 'Unable to change partner status.'); }
    finally { setSaving(false); }
  }

  return <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">B2B Partners</p><h1 className="mt-2 font-heading text-3xl font-semibold">B2B Partner Accounts</h1><p className="mt-2 text-sm text-muted-foreground">Manage partner access, company details, rates, wallet status and account availability.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</Button>{canManage ? <Button onClick={openAdd}><Plus className="size-4" />Add B2B Agent</Button> : null}</div></div>
    {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}{success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</p> : null}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total Agents" value={String(agents.length)} icon={UsersRound} /><Metric label="Active Agents" value={String(agents.filter((agent) => agent.status === 'Active').length)} icon={ShieldCheck} /><Metric label="Available Wallet Balance" value={formatAed(totalWallet)} icon={WalletCards} /><Metric label="B2B Bookings Today" value={String(bookings.filter((booking) => booking.created_at?.slice(0, 10) === today).length)} icon={Activity} /><Metric label="Pending Requests" value={String(pendingRequests)} icon={CircleDollarSign} /></div>
    <Card className="mt-5 rounded-2xl border-border/80"><CardContent className="p-4"><div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]"><label className="relative"><Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search company, code, contact or email" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Status filter" className={selectClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Suspended</option><option>Inactive</option></select><select aria-label="Auth link filter" className={selectClass} value={authFilter} onChange={(event) => setAuthFilter(event.target.value)}><option>All</option><option>Linked</option><option>Not Linked</option></select></div></CardContent></Card>
    <Card className="mt-5 overflow-hidden rounded-2xl border-border/80"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Auth</TableHead><TableHead>Wallet</TableHead><TableHead>Bookings</TableHead><TableHead>Requests</TableHead><TableHead>Status</TableHead><TableHead>Last Activity</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={9} className="py-10 text-center">Loading partner accounts...</TableCell></TableRow> : null}{!loading && !visibleAgents.length ? <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No partner accounts match the selected filters.</TableCell></TableRow> : visibleAgents.map((agent) => <TableRow key={agent.id}><TableCell><p className="font-semibold">{agent.company_name}</p><p className="font-mono text-xs text-muted-foreground">{agent.agent_code || '-'}</p></TableCell><TableCell><p>{agent.contact_person || '-'}</p><p className="text-xs text-muted-foreground">{agent.login_email || '-'}</p></TableCell><TableCell><Badge variant={agent.auth_user_id ? 'success' : 'warning'}>{agent.auth_user_id ? 'Auth Linked' : 'Not Linked'}</Badge></TableCell><TableCell className="font-semibold">{formatAed(walletFor(agent.id))}</TableCell><TableCell>{bookingsFor(agent.id).length}</TableCell><TableCell>{requestsFor(agent.id).filter((request) => request.status === 'Pending').length}</TableCell><TableCell><StatusBadge status={agent.status} /></TableCell><TableCell className="text-xs">{formatDate(lastActivity(agent))}</TableCell><TableCell><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => { setSelected(agent); setProfileOpen(true); }}><Eye className="size-4" />View</Button>{canManage ? <Button size="sm" variant="ghost" onClick={() => openEdit(agent)}><Pencil className="size-4" />Edit</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
    <AgentFormSheet open={formOpen} onOpenChange={setFormOpen} form={form} field={field} editing={Boolean(editing)} saving={saving} error={error} onSave={save} />
    <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} agent={selected} wallet={selected ? walletFor(selected.id) : 0} bookings={selected ? bookingsFor(selected.id) : []} requests={selected ? requestsFor(selected.id) : []} ledger={selected ? ledgerFor(selected.id) : []} canManage={canManage} saving={saving} onEdit={() => selected && openEdit(selected)} onStatus={() => selected && changeStatus(selected)} />
  </section>;
}

function AgentFormSheet({ open, onOpenChange, form, field, editing, saving, error, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; form: Form; field: <K extends keyof Form>(key: K, value: Form[K]) => void; editing: boolean; saving: boolean; error: string; onSave: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  return <Sheet open={open} onOpenChange={(next) => !saving && onOpenChange(next)}><SheetContent><SheetHeader><SheetTitle>{editing ? 'Edit B2B Agent' : 'Add B2B Agent'}</SheetTitle><SheetDescription>{editing ? 'Manage the existing linked B2B Agent profile.' : 'Super Admin will securely create and link Auth access with the B2B Agent profile.'}</SheetDescription></SheetHeader><div className="flex-1 space-y-6 overflow-y-auto p-5">
    <FormSection title="Company Information"><Field label="Company / Agent Name" value={form.company_name} onChange={(value) => field('company_name', value)} /><Field label="Agent Code" value={form.agent_code} onChange={(value) => field('agent_code', value)} /><Select label="Agent Type" value={form.agent_type} options={['B2B Agent', 'Tour Operator', 'Hotel', 'Travel Desk', 'Vendor', 'Freelancer']} onChange={(value) => field('agent_type', value)} /><Field label="Contact Person" value={form.contact_person} onChange={(value) => field('contact_person', value)} /><Field label="Phone / WhatsApp" value={form.phone} onChange={(value) => field('phone', value)} /><Field label="Billing Email" type="email" value={form.billing_email} onChange={(value) => field('billing_email', value)} /><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Notes<Textarea value={form.notes} onChange={(event) => field('notes', event.target.value)} /></label></FormSection>
    <FormSection title="Login Access"><Field label="Login Email" type="email" value={form.login_email} onChange={(value) => field('login_email', value)} />{editing ? <Field label="Linked Auth User UUID" value={form.auth_user_id} onChange={() => undefined} readOnly /> : <><label className="relative grid gap-2 text-sm font-semibold">Initial Password<Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.initial_password} onChange={(event) => field('initial_password', event.target.value)} className="pr-11" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute bottom-0 right-0 flex size-10 items-center justify-center text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></label><Field label="Confirm Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirm_password} onChange={(value) => field('confirm_password', value)} /><p className="sm:col-span-2 text-xs leading-5 text-muted-foreground">Use at least 12 characters with uppercase, lowercase, a number, and a special character.</p></>}<div className="sm:col-span-2 rounded-xl border border-primary/15 bg-primary-50 p-3 text-xs leading-5 text-primary-900"><p className="font-bold">{editing ? 'Auth Linked' : 'Secure provisioning'}</p><p>{editing ? 'The linked Auth identity is retained while this profile is updated.' : 'Auth access and the B2B Agent profile will be created and linked securely by Super Admin.'}</p></div></FormSection>
    <FormSection title="Commercial Settings"><Select label="Payment Terms" value={form.payment_terms} options={['Instant', 'Daily', 'Weekly', 'Monthly', 'Custom']} onChange={(value) => field('payment_terms', value)} /><Field label="Rate Profile" value={form.rate_profile} onChange={(value) => field('rate_profile', value)} /><label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold"><input type="checkbox" checked={form.special_pricing} onChange={(event) => field('special_pricing', event.target.checked)} />Special Pricing</label><Select label="Status" value={form.status} options={['Active', 'Suspended', 'Inactive']} onChange={(value) => field('status', value as Form['status'])} /></FormSection>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
  </div><SheetFooter><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving} onClick={onSave}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create & Link Agent'}</Button></SheetFooter></SheetContent></Sheet>;
}
function ProfileSheet({ open, onOpenChange, agent, wallet, bookings, requests, ledger, canManage, saving, onEdit, onStatus }: { open: boolean; onOpenChange: (open: boolean) => void; agent: Agent | null; wallet: number; bookings: Booking[]; requests: Request[]; ledger: Ledger[]; canManage: boolean; saving: boolean; onEdit: () => void; onStatus: () => void }) {
  const credits = ledger.filter((entry) => entry.direction === 'credit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0); const debits = ledger.filter((entry) => entry.transaction_type === 'booking_debit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0); const refunds = ledger.filter((entry) => entry.transaction_type === 'refund_credit').reduce((sum, entry) => sum + Number(entry.amount_aed), 0);
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent><SheetHeader><SheetTitle>{agent?.company_name || 'Partner Profile'}</SheetTitle><SheetDescription>{agent?.agent_code || 'B2B partner operational overview'}</SheetDescription></SheetHeader>{agent ? <div className="flex-1 space-y-5 overflow-y-auto p-5">
    <Card><CardContent className="grid gap-4 p-4 sm:grid-cols-2"><Info label="Contact" value={agent.contact_person || '-'} /><Info label="Phone" value={agent.phone || '-'} /><Info label="Login Email" value={agent.login_email || '-'} /><Info label="Billing Email" value={agent.billing_email || '-'} /><Info label="Payment Terms" value={agent.payment_terms || '-'} /><Info label="Rate Profile" value={agent.rate_profile || '-'} /><Info label="Special Pricing" value={agent.special_pricing ? 'Enabled' : 'Standard rates'} /><Info label="Auth Access" value={agent.auth_user_id ? 'Auth Linked' : 'Not Linked'} /><Info label="Account Status" value={agent.status} /></CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2"><SmallMetric label="Available Balance" value={formatAed(wallet)} /><SmallMetric label="Total Credits" value={formatAed(credits)} /><SmallMetric label="Booking Debits" value={formatAed(debits)} /><SmallMetric label="Refund Credits" value={formatAed(refunds)} /></div>
    <Card><CardContent className="p-4"><h3 className="font-semibold">Recent Activity</h3><div className="mt-3 space-y-3">{bookings.slice(0, 3).map((booking) => <div key={booking.id} className="rounded-xl bg-muted p-3 text-sm"><p className="font-semibold">{booking.booking_code} · {booking.customer_name}</p><p className="text-xs text-muted-foreground">{booking.selected_package_name} · {formatAed(booking.total_amount || 0)}</p></div>)}{ledger.slice(0, 3).map((entry) => <div key={entry.id} className="rounded-xl bg-muted p-3 text-sm"><p className="font-semibold">{entry.transaction_type.replaceAll('_', ' ')} · {formatAed(entry.amount_aed)}</p><p className="text-xs text-muted-foreground">{entry.description}</p></div>)}{!bookings.length && !ledger.length ? <p className="text-sm text-muted-foreground">No recent booking or wallet activity.</p> : null}</div><p className="mt-4 text-sm font-semibold">{requests.filter((request) => request.status === 'Pending').length} pending cancellation/refund request(s)</p></CardContent></Card>
  </div> : null}<SheetFooter>{canManage ? <><Button variant="outline" onClick={onEdit}><Pencil className="size-4" />Edit Profile</Button><Button asChild variant="outline"><Link href="/admin/b2b-finance">Open in B2B Finance</Link></Button><Button disabled={saving} onClick={onStatus}>{agent?.status === 'Active' ? 'Suspend' : 'Activate'}</Button></> : <span className="text-xs text-muted-foreground">Read-only profile</span>}</SheetFooter></SheetContent></Sheet>;
}
function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UsersRound }) { return <Card className="rounded-2xl border-border/80"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-heading text-xl font-semibold">{value}</p></div></CardContent></Card>; }
function StatusBadge({ status }: { status: string }) { return <Badge variant={status === 'Active' ? 'success' : status === 'Suspended' ? 'destructive' : 'secondary'}>{status}</Badge>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-'; }
function FormSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="border-b pb-2 font-heading text-lg font-semibold">{title}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></section>; }
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) { return <label className="grid gap-2 text-sm font-semibold">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} {...props} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-semibold">{label}<select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
function SmallMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-white p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-heading text-lg font-semibold">{value}</p></div>; }
