'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { countryOptionsForValue } from '@/lib/country-options';
import { supabase } from '@/lib/supabase-client';
import { usePortalAccess } from './portal-access';

type AgentStatus = 'Active' | 'Inactive' | 'Suspended';
type AgentType = 'B2B Agent' | 'Tour Operator' | 'Hotel' | 'Travel Desk' | 'Vendor' | 'Freelancer';
type PaymentTerms = 'Instant' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

type AgentRecord = {
  id: string;
  agent_code: string;
  company_name: string;
  agent_type: AgentType;
  contact_person: string;
  phone: string;
  country: string;
  login_email: string;
  billing_email: string;
  payment_terms: PaymentTerms;
  credit_limit_aed: number;
  status: AgentStatus;
  rate_profile: string;
  special_pricing: boolean;
  notes: string;
};

type AgentForm = Omit<AgentRecord, 'id' | 'credit_limit_aed'> & {
  credit_limit_aed: string;
};

const tableName = 'b2b_agents';
const defaultRateProfile = 'Default B2B Package Rates';
const agentTypes: AgentType[] = ['B2B Agent', 'Tour Operator', 'Hotel', 'Travel Desk', 'Vendor', 'Freelancer'];
const paymentTermsOptions: PaymentTerms[] = ['Instant', 'Daily', 'Weekly', 'Monthly', 'Custom'];
const statusOptions: AgentStatus[] = ['Active', 'Inactive', 'Suspended'];
const selectClass = 'h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25';

const emptyForm: AgentForm = {
  agent_code: '',
  company_name: '',
  agent_type: 'B2B Agent',
  contact_person: '',
  phone: '',
  country: '',
  login_email: '',
  billing_email: '',
  payment_terms: 'Instant',
  credit_limit_aed: '0',
  status: 'Active',
  rate_profile: defaultRateProfile,
  special_pricing: false,
  notes: ''
};

function normalizeStatus(value: unknown): AgentStatus {
  const clean = String(value || '').toLowerCase();
  if (clean === 'inactive') return 'Inactive';
  if (clean === 'suspended') return 'Suspended';
  return 'Active';
}

function normalizeType(value: unknown): AgentType {
  const clean = String(value || 'B2B Agent') as AgentType;
  return agentTypes.includes(clean) ? clean : 'B2B Agent';
}

function normalizeTerms(value: unknown): PaymentTerms {
  const clean = String(value || 'Instant') as PaymentTerms;
  return paymentTermsOptions.includes(clean) ? clean : 'Instant';
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function nextAgentCode(agents: AgentRecord[]) {
  const max = agents.reduce((current, agent) => {
    const value = Number(agent.agent_code.replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, 0);
  return `B2B-${String(max + 1).padStart(3, '0')}`;
}

function mapAgent(row: Record<string, unknown>): AgentRecord {
  const loginEmail = String(row.login_email || row.email || '');
  return {
    id: String(row.id || ''),
    agent_code: String(row.agent_code || ''),
    company_name: String(row.company_name || ''),
    agent_type: normalizeType(row.agent_type),
    contact_person: String(row.contact_person || ''),
    phone: String(row.phone || ''),
    country: String(row.country || ''),
    login_email: loginEmail,
    billing_email: String(row.billing_email || loginEmail),
    payment_terms: normalizeTerms(row.payment_terms),
    credit_limit_aed: Number(row.credit_limit_aed || 0),
    status: normalizeStatus(row.status),
    rate_profile: String(row.rate_profile || defaultRateProfile),
    special_pricing: row.special_pricing === true || row.special_pricing === 'true',
    notes: String(row.notes || '')
  };
}

function toForm(agent: AgentRecord): AgentForm {
  return {
    agent_code: agent.agent_code,
    company_name: agent.company_name,
    agent_type: agent.agent_type,
    contact_person: agent.contact_person,
    phone: agent.phone,
    country: agent.country,
    login_email: agent.login_email,
    billing_email: agent.billing_email,
    payment_terms: agent.payment_terms,
    credit_limit_aed: String(agent.credit_limit_aed || 0),
    status: agent.status,
    rate_profile: agent.rate_profile,
    special_pricing: agent.special_pricing,
    notes: agent.notes
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-semibold text-foreground"><span>{label}</span>{children}</label>;
}

export function B2BAgentCountryForm() {
  const { loading: accessLoading, isSuperAdmin } = usePortalAccess();
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const countryOptions = useMemo(() => countryOptionsForValue(form.country), [form.country]);

  async function loadAgents() {
    if (!isSuperAdmin) return;
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(500);
    if (loadError) {
      setError(loadError.message.includes('country') ? 'Run supabase/b2b-agent-country.sql first, then refresh this page.' : loadError.message);
      setAgents([]);
    } else {
      const rows = ((data || []) as Record<string, unknown>[]).map(mapAgent);
      setAgents(rows);
      setForm((current) => current.agent_code ? current : { ...current, agent_code: nextAgentCode(rows) });
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!accessLoading && isSuperAdmin) void loadAgents();
  }, [accessLoading, isSuperAdmin]);

  function setField<Key extends keyof AgentForm>(key: Key, value: AgentForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectAgent(id: string) {
    setEditingId(id);
    setError('');
    setNotice('');
    if (!id) {
      setForm({ ...emptyForm, agent_code: nextAgentCode(agents) });
      return;
    }
    const agent = agents.find((item) => item.id === id);
    if (agent) setForm(toForm(agent));
  }

  async function saveAgent() {
    if (!isSuperAdmin) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const loginEmail = cleanEmail(form.login_email);
      const billingEmail = cleanEmail(form.billing_email) || loginEmail;
      if (!form.company_name.trim()) throw new Error('Company / Agent Name is required.');
      if (!form.contact_person.trim()) throw new Error('Contact person is required.');
      if (!form.phone.trim()) throw new Error('Phone / WhatsApp is required.');
      if (!form.country.trim()) throw new Error('Country is required.');
      if (!loginEmail || !loginEmail.includes('@')) throw new Error('Valid login email is required.');

      const payload = {
        agent_code: form.agent_code.trim() || nextAgentCode(agents),
        company_name: form.company_name.trim(),
        agent_type: form.agent_type,
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
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
      setNotice(editingId ? 'B2B agent updated.' : 'B2B agent added.');
      setEditingId('');
      await loadAgents();
      setForm((current) => ({ ...emptyForm, agent_code: nextAgentCode(agents), country: current.country }));
      window.setTimeout(() => window.location.reload(), 500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save B2B agent.');
    } finally {
      setSaving(false);
    }
  }

  if (accessLoading) return <div className="b2b-country-form" data-visible="false" />;
  if (!isSuperAdmin) return <div className="b2b-country-form" data-visible="false" />;

  return (
    <div className="b2b-country-form" data-visible="true">
      <Card className="mx-4 mt-5 overflow-hidden rounded-[1.5rem] border-border/80 bg-white sm:mx-6 lg:mx-8 xl:mx-10">
        <CardHeader className="gap-3 border-b border-border/70 bg-[#F7FAFA] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
          <div><CardTitle className="font-heading text-lg font-semibold sm:text-xl">{editingId ? 'Edit B2B agent' : 'Add B2B agent'}</CardTitle><CardDescription>Country selection is saved with the partner profile.</CardDescription></div>
          <div className="w-full sm:max-w-sm"><label className="grid gap-1.5 text-xs font-bold text-muted-foreground">Edit Existing Agent<select value={editingId} onChange={(event) => selectAgent(event.target.value)} className={selectClass}><option value="">Add New Agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.agent_code} · {agent.company_name}</option>)}</select></label></div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {notice ? <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Agent Code"><Input value={form.agent_code} onChange={(event) => setField('agent_code', event.target.value)} placeholder="B2B-001" /></Field>
            <Field label="Company / Agent Name"><Input value={form.company_name} onChange={(event) => setField('company_name', event.target.value)} /></Field>
            <Field label="Agent Type"><select value={form.agent_type} onChange={(event) => setField('agent_type', event.target.value as AgentType)} className={selectClass}>{agentTypes.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Contact Person"><Input value={form.contact_person} onChange={(event) => setField('contact_person', event.target.value)} /></Field>
            <Field label="Phone / WhatsApp"><Input value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+971..." /></Field>
            <Field label="Country"><select value={form.country} onChange={(event) => setField('country', event.target.value)} required className={selectClass}><option value="">Select country</option>{countryOptions.map((option) => <option key={`${option.code}-${option.value}`} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Login Email"><Input type="email" value={form.login_email} onChange={(event) => setField('login_email', event.target.value)} /></Field>
            <Field label="Billing Email"><Input type="email" value={form.billing_email} onChange={(event) => setField('billing_email', event.target.value)} /></Field>
            <Field label="Payment Terms"><select value={form.payment_terms} onChange={(event) => setField('payment_terms', event.target.value as PaymentTerms)} className={selectClass}>{paymentTermsOptions.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Credit Limit / Allowed Balance"><Input type="number" min="0" value={form.credit_limit_aed} onChange={(event) => setField('credit_limit_aed', event.target.value)} /></Field>
            <Field label="Status"><select value={form.status} onChange={(event) => setField('status', event.target.value as AgentStatus)} className={selectClass}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></Field>
            <Field label="Rate Profile"><Input value={form.rate_profile} onChange={(event) => setField('rate_profile', event.target.value)} /></Field>
            <label className="flex items-center gap-3 rounded-xl border border-border bg-[#F7FAFA] px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={form.special_pricing} onChange={(event) => setField('special_pricing', event.target.checked)} className="size-4 rounded border-border" />Special Pricing</label>
            <div className="sm:col-span-2 xl:col-span-3"><Field label="Notes"><Textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></Field></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button type="button" onClick={saveAgent} disabled={saving || loading} className="rounded-full"><Save className="size-4" />{saving ? 'Saving...' : editingId ? 'Update Agent' : 'Save Agent'}</Button><Button type="button" variant="outline" onClick={loadAgents} disabled={loading} className="rounded-full"><RefreshCw className="size-4" />Refresh</Button>{editingId ? <Button type="button" variant="outline" onClick={() => selectAgent('')} className="rounded-full">Cancel Edit</Button> : null}</div>
        </CardContent>
      </Card>
    </div>
  );
}
