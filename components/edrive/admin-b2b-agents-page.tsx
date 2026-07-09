'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, FileClock, RefreshCw, Save, Trash2, UsersRound, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatAed } from '@/lib/booking-data';
import { supabase } from '@/lib/supabase-client';

type AgentStatus = 'Active' | 'Inactive' | 'Suspended';
type AgentType = 'B2B Agent' | 'Tour Operator' | 'Hotel' | 'Travel Desk' | 'Vendor' | 'Freelancer';
type PaymentTerms = 'Instant' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

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
  { agent_code: 'B2B-001', company_name: 'SkyWay Travel LLC', agent_type: 'B2B Agent', contact_person: 'Ahmed Khan', phone: '+971500000001', login_email: 'skyway@test.com', email: 'skyway@test.com', billing_email: 'skyway@test.com', payment_terms: 'Instant', credit_limit_aed: 5000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-002', company_name: 'Golden Wings Tourism', agent_type: 'Tour Operator', contact_person: 'Sarah Ali', phone: '+971500000002', login_email: 'golden@test.com', email: 'golden@test.com', billing_email: 'golden@test.com', payment_terms: 'Weekly', credit_limit_aed: 12000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-003', company_name: 'Royal Stay Hotels', agent_type: 'Hotel', contact_person: "John D'Souza", phone: '+971500000003', login_email: 'royalstay@test.com', email: 'royalstay@test.com', billing_email: 'royalstay@test.com', payment_terms: 'Monthly', credit_limit_aed: 20000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-004', company_name: 'Gulf Corporate Travel', agent_type: 'Travel Desk', contact_person: 'Faisal Ahmed', phone: '+971500000004', login_email: 'gulfdesk@test.com', email: 'gulfdesk@test.com', billing_email: 'gulfdesk@test.com', payment_terms: 'Monthly', credit_limit_aed: 10000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-005', company_name: 'Global Visa Services', agent_type: 'Vendor', contact_person: 'Imran Sheikh', phone: '+971500000005', login_email: 'visa@test.com', email: 'visa@test.com', billing_email: 'visa@test.com', payment_terms: 'Weekly', credit_limit_aed: 3000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: true, notes: 'Special fixed referral handling for testing.', is_test_record: true },
  { agent_code: 'B2B-006', company_name: 'Elite Holidays UAE', agent_type: 'B2B Agent', contact_person: 'Maria Fernandes', phone: '+971500000006', login_email: 'elite@test.com', email: 'elite@test.com', billing_email: 'elite@test.com', payment_terms: 'Daily', credit_limit_aed: 4000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-007', company_name: 'Desert Pearl Tourism', agent_type: 'Tour Operator', contact_person: 'Khalid Hassan', phone: '+971500000007', login_email: 'desert@test.com', email: 'desert@test.com', billing_email: 'desert@test.com', payment_terms: 'Custom', credit_limit_aed: 0, status: 'Suspended', rate_profile: defaultRateProfile, special_pricing: true, notes: 'Suspended test account for access-block testing.', is_test_record: true },
  { agent_code: 'B2B-008', company_name: 'City Hotels Group', agent_type: 'Hotel', contact_person: 'Robert Thomas', phone: '+971500000008', login_email: 'cityhotel@test.com', email: 'cityhotel@test.com', billing_email: 'cityhotel@test.com', payment_terms: 'Monthly', credit_limit_aed: 25000, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true },
  { agent_code: 'B2B-009', company_name: 'FlyConnect Travel', agent_type: 'B2B Agent', contact_person: 'Zubair Malik', phone: '+971500000009', login_email: 'flyconnect@test.com', email: 'flyconnect@test.com', billing_email: 'flyconnect@test.com', payment_terms: 'Instant', credit_limit_aed: 0, status: 'Inactive', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Inactive test account for access-block testing.', is_test_record: true },
  { agent_code: 'B2B-010', company_name: 'Quick Booking Services', agent_type: 'Freelancer', contact_person: 'Ali Raza', phone: '+971500000010', login_email: 'freelancer@test.com', email: 'freelancer@test.com', billing_email: 'freelancer@test.com', payment_terms: 'Instant', credit_limit_aed: 1500, status: 'Active', rate_profile: defaultRateProfile, special_pricing: false, notes: 'Test partner account. Create Supabase Auth login separately with the shared test password.', is_test_record: true }
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

export function AdminB2BAgentsCleanPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

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

  useEffect(() => {
    void loadAgents();
  }, []);

  const metrics = useMemo(() => {
    const active = agents.filter((agent) => agent.status === 'Active').length;
    const blocked = agents.filter((agent) => agent.status !== 'Active').length;
    const creditLimit = agents.reduce((sum, agent) => sum + Number(agent.credit_limit_aed || 0), 0);
    return { active, blocked, creditLimit };
  }, [agents]);

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
    setEditingId(agent.id);
    setForm(formFromAgent(agent));
  }

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">B2B Agents</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Partner accounts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Clean setup for partner login, billing terms, package rate profile, status, and test records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadAgents} disabled={saving}><RefreshCw data-icon aria-hidden="true" />Refresh</Button>
            <Button type="button" variant="outline" onClick={addTestAgents} disabled={saving}>Add Test Agents</Button>
            <Button type="button" variant="danger" onClick={deleteTestAgents} disabled={saving}><Trash2 data-icon aria-hidden="true" />Delete Test Agents</Button>
          </div>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric title="Active Agents" value={String(metrics.active)} icon={UsersRound} />
          <Metric title="Blocked Accounts" value={String(metrics.blocked)} icon={FileClock} />
          <Metric title="Credit Limit" value={formatAed(metrics.creditLimit)} icon={WalletCards} />
        </div>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="border-b border-border/70 bg-[#F7FAFA]">
            <CardTitle className="font-heading text-xl font-semibold">{editingId ? 'Edit B2B agent' : 'Add B2B agent'}</CardTitle>
            <CardDescription>Package B2B rates stay in packages. Use special pricing only for custom deals.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="md:col-span-2 xl:col-span-3">
                <Field label="Notes"><Textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Agreement notes, custom terms, or internal details." /></Field>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button type="button" onClick={saveAgent} disabled={saving}><Save data-icon aria-hidden="true" />{saving ? 'Saving...' : editingId ? 'Update Agent' : 'Save Agent'}</Button>
              {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel Edit</Button> : null}
              <p className="text-xs leading-5 text-muted-foreground">Portal password is managed in Supabase Auth and is not saved in this form.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 overflow-hidden rounded-[1.5rem] border-border/80 bg-white">
          <CardHeader className="gap-4 border-b border-border/70 bg-[#F7FAFA] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-xl font-semibold">Agent list</CardTitle>
              <CardDescription>{loading ? 'Loading records...' : `${agents.length} records`}</CardDescription>
            </div>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents..." className="h-10 max-w-xs rounded-full" />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Rate Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center">Loading B2B agents...</TableCell></TableRow> : null}
                {!loading && filteredAgents.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center">No B2B agents found.</TableCell></TableRow> : null}
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.id || agent.agent_code}>
                    <TableCell>
                      <div className="font-bold text-primary-900">{agent.company_name}</div>
                      <div className="text-xs text-muted-foreground">{agent.agent_code || '-'} · {agent.agent_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{agent.contact_person || '-'}</div>
                      <div className="text-xs text-muted-foreground">{agent.phone || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{agent.login_email || '-'}</div>
                      <div className="text-xs text-muted-foreground">Billing: {agent.billing_email || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{agent.payment_terms}</div>
                      <div className="text-xs text-muted-foreground">Limit {formatAed(agent.credit_limit_aed)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{agent.rate_profile || defaultRateProfile}</div>
                      <div className="text-xs text-muted-foreground">{agent.special_pricing ? 'Special pricing enabled' : 'Default package rates'}</div>
                    </TableCell>
                    <TableCell><Badge variant={statusBadge(agent.status)}>{agent.status}</Badge>{agent.is_test_record ? <div className="mt-1 text-xs font-semibold text-gold">Test record</div> : null}</TableCell>
                    <TableCell><Button type="button" size="sm" variant="outline" onClick={() => editAgent(agent)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Building2 }) {
  return <Card className="rounded-[1.35rem]"><CardContent className="flex items-center gap-4 p-4"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-1 font-heading text-2xl font-semibold text-foreground">{value}</p></div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground"><span>{label}</span>{children}</label>;
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}
