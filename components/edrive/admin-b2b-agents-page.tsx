'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, Eye, FileClock, MessageCircle, RefreshCw, Save, Trash2, UsersRound, WalletCards, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatAed } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { supabase } from '@/lib/supabase-client';

type AgentStatus = 'Active' | 'Inactive' | 'Suspended';
type AgentType = 'B2B Agent' | 'Tour Operator' | 'Hotel' | 'Travel Desk' | 'Vendor' | 'Freelancer';
type PaymentTerms = 'Instant' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
type PortalRole = 'super_admin' | 'admin' | 'booking_staff' | 'manager' | 'finance' | string;

type AgentRow = {
  id: string;
  agent_code: string;
  company_name: string;
  agent_type: AgentType;
  contact_person: string;
  phone: string;
  login_email: string;
  billing_email: string;
  payment_terms: PaymentTerms;
  credit_limit_aed: number;
  status: AgentStatus;
  rate_profile: string;
  special_pricing: boolean;
  notes: string;
  is_test_record: boolean;
  created_at: string;
};

type AgentForm = {
  agent_code: string;
  company_name: string;
  agent_type: AgentType;
  contact_person: string;
  phone: string;
  login_email: string;
  billing_email: string;
  payment_terms: PaymentTerms;
  credit_limit_aed: string;
  status: AgentStatus;
  rate_profile: string;
  special_pricing: boolean;
  notes: string;
};

type BookingRow = {
  b2b_agent_id?: string | null;
  b2b_agent_name?: string | null;
  b2b_agent_email?: string | null;
  payment_source?: string | null;
  total_amount?: number | string | null;
  amount_pending_aed?: number | string | null;
  status?: string | null;
  preferred_date?: string | null;
  created_at?: string | null;
};

type AgentStats = {
  totalBookings: number;
  pendingBookings: number;
  pendingAmount: number;
  totalAmount: number;
  lastBookingDate: string;
};

const tableName = 'b2b_agents';
const defaultRateProfile = 'Default B2B Package Rates';
const agentTypes: AgentType[] = ['B2B Agent', 'Tour Operator', 'Hotel', 'Travel Desk', 'Vendor', 'Freelancer'];
const paymentTermsOptions: PaymentTerms[] = ['Instant', 'Daily', 'Weekly', 'Monthly', 'Custom'];
const statusOptions: AgentStatus[] = ['Active', 'Inactive', 'Suspended'];
const inputClass = 'h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background transition focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';

const emptyForm: AgentForm = {
  agent_code: '',
  company_name: '',
  agent_type: 'B2B Agent',
  contact_person: '',
  phone: '',
  login_email: '',
  billing_email: '',
  payment_terms: 'Instant',
  credit_limit_aed: '0',
  status: 'Active',
  rate_profile: defaultRateProfile,
  special_pricing: false,
  notes: ''
};

const testAgents = [
  {
    agent_code: 'B2B-001',
    company_name: 'SkyWay Travel LLC',
    agent_type: 'B2B Agent',
    contact_person: 'Ahmed Khan',
    phone: '+971500000001',
    login_email: 'skyway@test.com',
    email: 'skyway@test.com',
    billing_email: 'skyway@test.com',
    payment_terms: 'Instant',
    credit_limit_aed: 5000,
    status: 'Active',
    rate_profile: defaultRateProfile,
    special_pricing: false,
    notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.',
    is_test_record: true
  },
  {
    agent_code: 'B2B-002',
    company_name: 'Golden Wings Tourism',
    agent_type: 'Tour Operator',
    contact_person: 'Sarah Ali',
    phone: '+971500000002',
    login_email: 'golden@test.com',
    email: 'golden@test.com',
    billing_email: 'golden@test.com',
    payment_terms: 'Weekly',
    credit_limit_aed: 12000,
    status: 'Active',
    rate_profile: defaultRateProfile,
    special_pricing: false,
    notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.',
    is_test_record: true
  },
  {
    agent_code: 'B2B-003',
    company_name: 'Royal Stay Hotels',
    agent_type: 'Hotel',
    contact_person: "John D'Souza",
    phone: '+971500000003',
    login_email: 'royalstay@test.com',
    email: 'royalstay@test.com',
    billing_email: 'royalstay@test.com',
    payment_terms: 'Monthly',
    credit_limit_aed: 20000,
    status: 'Active',
    rate_profile: defaultRateProfile,
    special_pricing: false,
    notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.',
    is_test_record: true
  }
];

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAgentType(value: string): AgentType {
  return agentTypes.includes(value as AgentType) ? (value as AgentType) : 'B2B Agent';
}

function normalizePaymentTerms(value: string): PaymentTerms {
  return paymentTermsOptions.includes(value as PaymentTerms) ? (value as PaymentTerms) : 'Instant';
}

function normalizeStatus(value: string): AgentStatus {
  const clean = value.trim().toLowerCase();
  if (clean === 'inactive') return 'Inactive';
  if (clean === 'suspended') return 'Suspended';
  return 'Active';
}

function asBool(value: unknown) {
  return value === true || value === 'true';
}

function asNumber(value: unknown) {
  return Number(value || 0);
}

function mapAgent(row: Record<string, unknown>): AgentRow {
  const loginEmail = String(row.login_email || row.email || '');
  return {
    id: String(row.id || ''),
    agent_code: String(row.agent_code || ''),
    company_name: String(row.company_name || ''),
    agent_type: normalizeAgentType(String(row.agent_type || 'B2B Agent')),
    contact_person: String(row.contact_person || ''),
    phone: String(row.phone || ''),
    login_email: loginEmail,
    billing_email: String(row.billing_email || loginEmail),
    payment_terms: normalizePaymentTerms(String(row.payment_terms || 'Instant')),
    credit_limit_aed: Number(row.credit_limit_aed || 0),
    status: normalizeStatus(String(row.status || 'Active')),
    rate_profile: String(row.rate_profile || defaultRateProfile),
    special_pricing: asBool(row.special_pricing),
    notes: String(row.notes || ''),
    is_test_record: asBool(row.is_test_record),
    created_at: String(row.created_at || '')
  };
}

function nextAgentCode(agents: AgentRow[]) {
  const maxNumber = agents.reduce((max, agent) => {
    const value = Number(agent.agent_code.replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `B2B-${String(maxNumber + 1).padStart(3, '0')}`;
}

function statusBadge(status: AgentStatus) {
  if (status === 'Active') return 'success';
  if (status === 'Suspended') return 'destructive';
  return 'secondary';
}

function formFromAgent(agent: AgentRow): AgentForm {
  return {
    agent_code: agent.agent_code,
    company_name: agent.company_name,
    agent_type: agent.agent_type,
    contact_person: agent.contact_person,
    phone: agent.phone,
    login_email: agent.login_email,
    billing_email: agent.billing_email,
    payment_terms: agent.payment_terms,
    credit_limit_aed: String(agent.credit_limit_aed || 0),
    status: agent.status,
    rate_profile: agent.rate_profile || defaultRateProfile,
    special_pricing: agent.special_pricing,
    notes: agent.notes
  };
}

function matchAgentBooking(agent: AgentRow, booking: BookingRow) {
  const bookingName = String(booking.b2b_agent_name || '').toLowerCase();
  const bookingEmail = String(booking.b2b_agent_email || '').toLowerCase();
  return booking.b2b_agent_id === agent.id || bookingName === agent.company_name.toLowerCase() || bookingEmail === agent.login_email.toLowerCase();
}

function emptyStats(): AgentStats {
  return { totalBookings: 0, pendingBookings: 0, pendingAmount: 0, totalAmount: 0, lastBookingDate: '-' };
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value.includes('T') ? value : `${value}T12:00:00`));
}

function whatsappHref(phone: string, company: string) {
  let digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `971${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) digits = `971${digits}`;
  const message = encodeURIComponent(`Hello ${company}, this is eDrive Water Sports regarding your B2B partner account.`);
  return `https://web.whatsapp.com/send?phone=${digits}&text=${message}&app_absent=0`;
}

export function AdminB2BAgentsCleanPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [role, setRole] = useState<PortalRole>('admin');
  const [roleReady, setRoleReady] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const canManageAgents = role === 'super_admin';

  async function loadRole() {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    const authEmail = authUser?.email || '';
    if (!authUser) {
      setRole('admin');
      setRoleReady(true);
      return;
    }
    const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
    const { data } = await supabase.from('admin_users').select('role,status').or(filter).limit(1);
    const profile = (data || [])[0] as { role?: string | null; status?: string | null } | undefined;
    setRole(String(profile?.role || 'admin'));
    setRoleReady(true);
  }

  async function loadAgents() {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setAgents([]);
    } else {
      const rows = ((data || []) as Record<string, unknown>[]).map(mapAgent);
      setAgents(rows);
      setForm((current) => current.agent_code ? current : { ...current, agent_code: nextAgentCode(rows) });
    }
    setLoading(false);
  }

  async function loadBookings() {
    const { data } = await supabase
      .from(bookingRequestsTable)
      .select('b2b_agent_id,b2b_agent_name,b2b_agent_email,payment_source,total_amount,amount_pending_aed,status,preferred_date,created_at')
      .eq('payment_source', 'b2b')
      .limit(500);
    setBookings((data || []) as BookingRow[]);
  }

  async function refreshAll() {
    await Promise.all([loadRole(), loadAgents(), loadBookings()]);
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const statsByAgent = useMemo(() => {
    const map = new Map<string, AgentStats>();
    agents.forEach((agent) => {
      const stats = emptyStats();
      bookings.filter((booking) => matchAgentBooking(agent, booking)).forEach((booking) => {
        stats.totalBookings += 1;
        const pending = asNumber(booking.amount_pending_aed);
        stats.pendingAmount += pending;
        stats.totalAmount += asNumber(booking.total_amount);
        if ((booking.status || 'Pending') === 'Pending') stats.pendingBookings += 1;
        const dateValue = booking.preferred_date || booking.created_at || '';
        if (dateValue && (stats.lastBookingDate === '-' || new Date(dateValue) > new Date(stats.lastBookingDate))) stats.lastBookingDate = dateValue;
      });
      stats.lastBookingDate = formatDate(stats.lastBookingDate === '-' ? '' : stats.lastBookingDate);
      map.set(agent.id || agent.agent_code, stats);
    });
    return map;
  }, [agents, bookings]);

  const metrics = useMemo(() => {
    const active = agents.filter((agent) => agent.status === 'Active').length;
    const blocked = agents.filter((agent) => agent.status !== 'Active').length;
    const creditLimit = agents.reduce((sum, agent) => sum + Number(agent.credit_limit_aed || 0), 0);
    const pendingAmount = bookings.reduce((sum, booking) => sum + asNumber(booking.amount_pending_aed), 0);
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter((booking) => String(booking.created_at || '').slice(0, 10) === todayIso || booking.preferred_date === todayIso).length;
    return { active, blocked, creditLimit, pendingAmount, todayBookings };
  }, [agents, bookings]);

  const filteredAgents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return agents;
    return agents.filter((agent) => [agent.agent_code, agent.company_name, agent.agent_type, agent.contact_person, agent.phone, agent.login_email, agent.status].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [agents, query]);

  function setField<Key extends keyof AgentForm>(key: Key, value: AgentForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId('');
    setForm({ ...emptyForm, agent_code: nextAgentCode(agents) });
  }

  async function saveAgent() {
    if (!canManageAgents) return;
    setSaving(true);
    setError('');
    try {
      const loginEmail = cleanEmail(form.login_email);
      const billingEmail = cleanEmail(form.billing_email) || loginEmail;
      if (!form.company_name.trim()) throw new Error('Company / Agent Name is required.');
      if (!form.contact_person.trim()) throw new Error('Contact person is required.');
      if (!form.phone.trim()) throw new Error('Phone / WhatsApp is required.');
      if (!loginEmail || !loginEmail.includes('@')) throw new Error('Valid login email is required.');

      const payload = {
        agent_code: form.agent_code.trim() || nextAgentCode(agents),
        company_name: form.company_name.trim(),
        agent_type: form.agent_type,
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        login_email: loginEmail,
        email: loginEmail,
        billing_email: billingEmail,
        payment_terms: form.payment_terms,
        credit_limit_aed: Number(form.credit_limit_aed || 0),
        status: form.status,
        rate_profile: form.rate_profile.trim() || defaultRateProfile,
        special_pricing: form.special_pricing,
        notes: form.notes.trim() || null
      };

      const result = editingId
        ? await supabase.from(tableName).update(payload).eq('id', editingId)
        : await supabase.from(tableName).insert({ ...payload, is_test_record: false });

      if (result.error) throw new Error(result.error.message);
      await loadAgents();
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save B2B agent.');
    } finally {
      setSaving(false);
    }
  }

  async function addTestAgents() {
    if (!canManageAgents) return;
    setSaving(true);
    setError('');
    try {
      const { error: upsertError } = await supabase.from(tableName).upsert(testAgents, { onConflict: 'agent_code' });
      if (upsertError) throw new Error(upsertError.message);
      await loadAgents();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : 'Unable to add test agents.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestAgents() {
    if (!canManageAgents) return;
    if (!window.confirm('Delete all test B2B agents?')) return;
    setSaving(true);
    setError('');
    try {
      const { error: deleteError } = await supabase.from(tableName).delete().eq('is_test_record', true);
      if (deleteError) throw new Error(deleteError.message);
      await loadAgents();
      resetForm();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete test agents.');
    } finally {
      setSaving(false);
    }
  }

  function editAgent(agent: AgentRow) {
    if (!canManageAgents) {
      setSelectedAgent(agent);
      return;
    }
    setEditingId(agent.id);
    setForm(formFromAgent(agent));
  }

  return (
    <section className="w-full overflow-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <div className="w-full min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">B2B Agents</p>
            <h1 className="mt-2 font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-4xl">Partner accounts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{canManageAgents ? 'Owner level setup for partner login, billing terms, rate profile and status.' : 'Operational view for partner contacts, bookings, pending amount and status.'}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={refreshAll} disabled={saving} className="rounded-full"><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
            {canManageAgents ? <Button type="button" variant="outline" onClick={addTestAgents} disabled={saving} className="rounded-full">Add Test Agents</Button> : null}
            {canManageAgents ? <Button type="button" variant="danger" onClick={deleteTestAgents} disabled={saving} className="rounded-full"><Trash2 data-icon aria-hidden="true" />Delete Test Agents</Button> : null}
          </div>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {!roleReady ? <p className="mt-5 rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-900">Loading access...</p> : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Active Agents" value={String(metrics.active)} icon={UsersRound} />
          <Metric title="B2B Bookings Today" value={String(metrics.todayBookings)} icon={FileClock} />
          <Metric title="Pending Collection" value={formatAed(metrics.pendingAmount)} icon={WalletCards} />
          {canManageAgents ? <Metric title="Credit Limit" value={formatAed(metrics.creditLimit)} icon={WalletCards} /> : <Metric title="Blocked Accounts" value={String(metrics.blocked)} icon={Building2} />}
        </div>

        {canManageAgents ? (
          <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
            <CardHeader className="border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5">
              <CardTitle className="font-heading text-lg font-semibold sm:text-xl">{editingId ? 'Edit B2B agent' : 'Add B2B agent'}</CardTitle>
              <CardDescription>Package B2B rates stay in packages. Use special pricing only for custom deals.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Agent Code"><Input value={form.agent_code} onChange={(event) => setField('agent_code', event.target.value)} placeholder="B2B-001" /></Field>
                <Field label="Company / Agent Name"><Input value={form.company_name} onChange={(event) => setField('company_name', event.target.value)} placeholder="SkyWay Travel LLC" /></Field>
                <Field label="Agent Type"><Select value={form.agent_type} options={agentTypes} onChange={(value) => setField('agent_type', value as AgentType)} /></Field>
                <Field label="Contact Person"><Input value={form.contact_person} onChange={(event) => setField('contact_person', event.target.value)} placeholder="Ahmed Khan" /></Field>
                <Field label="Phone / WhatsApp"><Input value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+971..." /></Field>
                <Field label="Login Email"><Input type="email" value={form.login_email} onChange={(event) => setField('login_email', event.target.value)} placeholder="agent@test.com" /></Field>
                <Field label="Billing Email"><Input type="email" value={form.billing_email} onChange={(event) => setField('billing_email', event.target.value)} placeholder="billing@test.com" /></Field>
                <Field label="Payment Terms"><Select value={form.payment_terms} options={paymentTermsOptions} onChange={(value) => setField('payment_terms', value as PaymentTerms)} /></Field>
                <Field label="Credit Limit / Allowed Balance"><Input type="number" min="0" value={form.credit_limit_aed} onChange={(event) => setField('credit_limit_aed', event.target.value)} placeholder="5000" /></Field>
                <Field label="Status"><Select value={form.status} options={statusOptions} onChange={(value) => setField('status', value as AgentStatus)} /></Field>
                <Field label="Rate Profile"><Input value={form.rate_profile} onChange={(event) => setField('rate_profile', event.target.value)} /></Field>
                <div className="rounded-xl border border-border bg-[#F7FAFA] px-4 py-3">
                  <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                    <input type="checkbox" checked={form.special_pricing} onChange={(event) => setField('special_pricing', event.target.checked)} className="size-4 rounded border-border" />
                    Special Pricing
                  </label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Keep off for default B2B package rates.</p>
                </div>
                <div className="sm:col-span-2 xl:col-span-3"><Field label="Notes"><Textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Agreement notes, custom terms, or internal details." /></Field></div>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button type="button" onClick={saveAgent} disabled={saving} className="rounded-full"><Save data-icon aria-hidden="true" />{saving ? 'Saving...' : editingId ? 'Update Agent' : 'Save Agent'}</Button>
                {editingId ? <Button type="button" variant="outline" onClick={resetForm} className="rounded-full">Cancel Edit</Button> : null}
                <p className="text-xs leading-5 text-muted-foreground">Portal password is managed in Supabase Auth and is not saved in this form.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-heading text-lg font-semibold sm:text-xl">Agent list</CardTitle>
              <CardDescription>{loading ? 'Loading records...' : canManageAgents ? `${agents.length} records` : 'Read-only operational view'}</CardDescription>
            </div>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents..." className="h-10 w-full rounded-full md:max-w-xs" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table className="table-fixed">
                <TableHeader>
                  {canManageAgents ? <SuperAdminHeader /> : <AdminHeader />}
                </TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={canManageAgents ? 7 : 6} className="py-8 text-center">Loading B2B agents...</TableCell></TableRow> : null}
                  {!loading && filteredAgents.length === 0 ? <TableRow><TableCell colSpan={canManageAgents ? 7 : 6} className="py-8 text-center">No B2B agents found.</TableCell></TableRow> : null}
                  {filteredAgents.map((agent) => canManageAgents ? (
                    <SuperAdminRow key={agent.id || agent.agent_code} agent={agent} onEdit={editAgent} />
                  ) : (
                    <AdminRow key={agent.id || agent.agent_code} agent={agent} stats={statsByAgent.get(agent.id || agent.agent_code) || emptyStats()} onView={setSelectedAgent} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading B2B agents...</p> : null}
              {!loading && filteredAgents.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No B2B agents found.</p> : null}
              {filteredAgents.map((agent) => (
                <MobileAgentCard
                  key={agent.id || agent.agent_code}
                  agent={agent}
                  stats={statsByAgent.get(agent.id || agent.agent_code) || emptyStats()}
                  canManageAgents={canManageAgents}
                  onAction={canManageAgents ? editAgent : setSelectedAgent}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedAgent ? <AgentViewModal agent={selectedAgent} stats={statsByAgent.get(selectedAgent.id || selectedAgent.agent_code) || emptyStats()} onClose={() => setSelectedAgent(null)} /> : null}
    </section>
  );
}

function SuperAdminHeader() {
  return (
    <TableRow>
      <TableHead className="w-[18%]">Agent</TableHead>
      <TableHead className="w-[14%]">Contact</TableHead>
      <TableHead className="w-[22%]">Login</TableHead>
      <TableHead className="w-[14%]">Terms</TableHead>
      <TableHead className="w-[17%]">Rate Profile</TableHead>
      <TableHead className="w-[8%]">Status</TableHead>
      <TableHead className="w-[7%] text-right">Action</TableHead>
    </TableRow>
  );
}

function AdminHeader() {
  return (
    <TableRow>
      <TableHead className="w-[22%]">Agent</TableHead>
      <TableHead className="w-[18%]">Contact</TableHead>
      <TableHead className="w-[20%]">Bookings</TableHead>
      <TableHead className="w-[20%]">Pending Amount</TableHead>
      <TableHead className="w-[10%]">Status</TableHead>
      <TableHead className="w-[10%] text-right">Action</TableHead>
    </TableRow>
  );
}

function SuperAdminRow({ agent, onEdit }: { agent: AgentRow; onEdit: (agent: AgentRow) => void }) {
  return (
    <TableRow>
      <TableCell className="align-top"><CellTitle title={agent.company_name} subtitle={`${agent.agent_code || '-'} · ${agent.agent_type}`} /></TableCell>
      <TableCell className="align-top"><CellTitle title={agent.contact_person || '-'} subtitle={agent.phone || '-'} /></TableCell>
      <TableCell className="align-top"><CellTitle title={agent.login_email || '-'} subtitle={`Billing: ${agent.billing_email || '-'}`} /></TableCell>
      <TableCell className="align-top"><CellTitle title={agent.payment_terms} subtitle={`Limit ${formatAed(agent.credit_limit_aed)}`} /></TableCell>
      <TableCell className="align-top"><CellTitle title={agent.rate_profile || defaultRateProfile} subtitle={agent.special_pricing ? 'Special pricing enabled' : 'Default package rates'} /></TableCell>
      <TableCell className="align-top"><Badge variant={statusBadge(agent.status)}>{agent.status}</Badge>{agent.is_test_record ? <div className="mt-1 text-xs font-semibold text-gold">Test record</div> : null}</TableCell>
      <TableCell className="align-top text-right"><Button type="button" size="sm" variant="outline" onClick={() => onEdit(agent)} className="rounded-full">Edit</Button></TableCell>
    </TableRow>
  );
}

function AdminRow({ agent, stats, onView }: { agent: AgentRow; stats: AgentStats; onView: (agent: AgentRow) => void }) {
  return (
    <TableRow>
      <TableCell className="align-top"><CellTitle title={agent.company_name} subtitle={`${agent.agent_code || '-'} · ${agent.agent_type}`} /></TableCell>
      <TableCell className="align-top"><CellTitle title={agent.contact_person || '-'} subtitle={agent.phone || '-'} /></TableCell>
      <TableCell className="align-top"><CellTitle title={`${stats.totalBookings} total · ${stats.pendingBookings} pending`} subtitle={`Last: ${stats.lastBookingDate}`} /></TableCell>
      <TableCell className="align-top"><CellTitle title={formatAed(stats.pendingAmount)} subtitle={`Total value ${formatAed(stats.totalAmount)}`} /></TableCell>
      <TableCell className="align-top"><Badge variant={statusBadge(agent.status)}>{agent.status}</Badge></TableCell>
      <TableCell className="align-top text-right"><Button type="button" size="sm" variant="outline" onClick={() => onView(agent)} className="rounded-full"><Eye className="size-4" aria-hidden="true" />View</Button></TableCell>
    </TableRow>
  );
}

function MobileAgentCard({ agent, stats, canManageAgents, onAction }: { agent: AgentRow; stats: AgentStats; canManageAgents: boolean; onAction: (agent: AgentRow) => void }) {
  return (
    <div className="rounded-[1.2rem] border border-border bg-white p-4 shadow-[0_10px_28px_rgba(8,37,50,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-heading text-base font-semibold text-foreground">{agent.company_name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{agent.agent_code || '-'} · {agent.agent_type}</p>
        </div>
        <Badge variant={statusBadge(agent.status)}>{agent.status}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <InfoBlock label="Contact" value={agent.contact_person || '-'} subValue={agent.phone || '-'} />
        <InfoBlock label="Bookings" value={`${stats.totalBookings} total`} subValue={`${stats.pendingBookings} pending`} />
        <InfoBlock label="Pending" value={formatAed(stats.pendingAmount)} subValue={`Total ${formatAed(stats.totalAmount)}`} />
        <InfoBlock label="Last" value={stats.lastBookingDate} subValue={canManageAgents ? agent.payment_terms : 'Booking'} />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => onAction(agent)} className="mt-4 w-full rounded-full">
        {canManageAgents ? 'Edit' : <><Eye className="size-4" aria-hidden="true" />View</>}
      </Button>
    </div>
  );
}

function CellTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-0">
      <div className="break-words text-sm font-bold leading-5 text-primary-900">{title}</div>
      <div className="mt-0.5 break-words text-xs leading-4 text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function InfoBlock({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F7FAFA] px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-foreground">{value}</p>
      {subValue ? <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{subValue}</p> : null}
    </div>
  );
}

function AgentViewModal({ agent, stats, onClose }: { agent: AgentRow; stats: AgentStats; onClose: () => void }) {
  const whatsapp = whatsappHref(agent.phone, agent.company_name);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/35 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[1.5rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(8,37,50,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#F7FAFA] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">B2B Partner</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">{agent.company_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{agent.agent_code} · {agent.agent_type}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground" aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Info label="Contact" value={agent.contact_person || '-'} />
          <Info label="Phone" value={agent.phone || '-'} />
          <Info label="Login Email" value={agent.login_email || '-'} />
          <Info label="Status" value={agent.status} />
          <Info label="Total Bookings" value={String(stats.totalBookings)} />
          <Info label="Pending Bookings" value={String(stats.pendingBookings)} />
          <Info label="Pending Amount" value={formatAed(stats.pendingAmount)} />
          <Info label="Last Booking" value={stats.lastBookingDate} />
          {agent.notes ? <div className="sm:col-span-2"><Info label="Notes" value={agent.notes} /></div> : null}
        </div>
        <div className="flex flex-col gap-2 border-t border-border/70 px-5 py-4 sm:flex-row sm:justify-end">
          {whatsapp ? <Button asChild className="rounded-full border-[#25D366] bg-[#25D366] text-white hover:bg-[#1EBE5D] hover:text-white"><a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />WhatsApp Agent</a></Button> : null}
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-[#F7FAFA] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Building2 }) {
  return (
    <Card className="rounded-[1.25rem] border-border/80">
      <CardContent className="flex min-w-0 items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground"><span>{label}</span>{children}</label>;
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}
