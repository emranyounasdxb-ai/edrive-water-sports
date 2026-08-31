'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppDatePicker } from '@/components/edrive/shared/app-date-picker';
import { generateBookingCode } from '@/lib/booking-data';
import { bookingRequestsTable } from '@/lib/booking-records';
import { companyInfo, whatsappMessageUrl } from '@/lib/company-info';
import { cleanMultiline, cleanSingleLine, isValidOptionalEmail, isValidPhone } from '@/lib/public-request-validation';
import { supabase } from '@/lib/supabase-client';
import type { PublicLocale } from '@/lib/i18n/locales';
import type { ContactMessages } from '@/lib/i18n/types';
import { enMessages } from '@/lib/i18n/messages/en';
import { trackMetaEvent } from '@/lib/meta-pixel';

type FormState = {
  name: string;
  phone: string;
  email: string;
  preferredDate: string;
  inquiryType: string;
  message: string;
  website: string;
};

const initialForm: FormState = {
  name: '',
  phone: '',
  email: '',
  preferredDate: '',
  inquiryType: 'Jet Ski Rental',
  message: '',
  website: ''
};

function rpcUnavailable(message: string) {
  const value = message.toLowerCase();
  return value.includes('submit_public_inquiry') && (value.includes('does not exist') || value.includes('schema cache') || value.includes('could not find') || value.includes('pgrst202'));
}

function inquiryExperienceType(inquiryType: string) {
  return inquiryType.toLowerCase().includes('jet car') ? 'jet-car-rental' : 'jet-ski-rental';
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ContactForm({ locale = 'en', messages = enMessages.contactForm }: { locale?: PublicLocale; messages?: ContactMessages }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [fallbackPayload, setFallbackPayload] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'saved' | 'fallback'>('idle');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function whatsappInquiryUrl(payload: FormState) {
    const text = encodeURIComponent(`Hello eDrive, I would like to send an inquiry.\n\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email || 'Not provided'}\nInquiry: ${payload.inquiryType}\nPreferred date: ${payload.preferredDate || 'Not selected'}\n\nMessage: ${payload.message}`);
    return whatsappMessageUrl(text);
  }

  async function saveLegacyInquiry(payload: FormState) {
    const bookingCode = generateBookingCode();
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from(bookingRequestsTable).insert({
      booking_code: bookingCode,
      booking_number: bookingCode,
      source: 'website',
      booking_source: 'website',
      status: 'Pending',
      admin_status: 'New',
      manager_status: 'Pending',
      selected_package_name: payload.inquiryType,
      selected_package_slug: `contact-${slugify(payload.inquiryType) || 'inquiry'}`,
      selected_package_category: 'Contact Inquiry',
      selected_package_price: null,
      selected_package_b2b_price: null,
      selected_package_capacity: null,
      experience_type: inquiryExperienceType(payload.inquiryType),
      service_type: 'sales_inquiry',
      duration_minutes: 0,
      inquiry_type: payload.inquiryType,
      vehicle_quantity: 1,
      guest_count: 1,
      preferred_date: payload.preferredDate || null,
      preferred_time: null,
      meeting_point_name: companyInfo.locationName,
      meeting_point_address: companyInfo.locationAddress,
      customer_name: payload.name,
      customer_phone: payload.phone,
      customer_email: payload.email || null,
      customer_hotel_or_area: null,
      customer_notes: `[Website contact inquiry] ${payload.message}`,
      subtotal: 0,
      vat_amount: 0,
      total_amount: 0,
      payment_status: 'Not Paid',
      payment_method: null,
      payment_source: 'direct',
      payment_workflow_status: 'unpaid',
      collection_status: 'pending_collection',
      amount_received_aed: 0,
      amount_pending_aed: 0,
      assigned_manager_name: null,
      assigned_vehicle_id: null,
      b2b_agent_id: null,
      customer_arrived: false,
      created_at: now,
      updated_at: now
    });

    return insertError ? { ok: false, message: insertError.message || '' } : { ok: true, reference: bookingCode };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setReference('');

    const payload: FormState = {
      name: cleanSingleLine(form.name, 100),
      phone: cleanSingleLine(form.phone, 30),
      email: cleanSingleLine(form.email, 160),
      preferredDate: form.preferredDate,
      inquiryType: cleanSingleLine(form.inquiryType, 80),
      message: cleanMultiline(form.message, 2000),
      website: form.website
    };

    if (payload.name.length < 2) return setError(messages.nameError);
    if (!isValidPhone(payload.phone)) return setError(messages.phoneError);
    if (!isValidOptionalEmail(payload.email)) return setError(messages.emailError);
    if (payload.message.length < 10) return setError(messages.messageError);

    setStatus('sending');
    setFallbackPayload(payload);
    const result = await supabase.rpc('submit_public_inquiry', { p_payload: payload });
    const row = Array.isArray(result.data) ? result.data[0] as { reference?: string } | undefined : undefined;

    if (!result.error && row?.reference) {
      setReference(row.reference);
      setStatus('saved');
      setForm(initialForm);
      trackMetaEvent('Lead');
      return;
    }

    const message = result.error?.message || messages.submitError;
    if (rpcUnavailable(message)) {
      const legacyResult = await saveLegacyInquiry(payload);
      if (legacyResult.ok) {
        setReference(legacyResult.reference || '');
        setStatus('saved');
        setForm(initialForm);
        trackMetaEvent('Lead');
        return;
      }

      window.open(whatsappInquiryUrl(payload), '_blank', 'noopener,noreferrer');
      setStatus('fallback');
      return;
    }

    setError(message);
    setStatus('idle');
  }

  const completed = status === 'saved' || status === 'fallback';

  return (
    <Card className="shadow-premium">
      <CardHeader className="border-b border-border">
        <CardTitle>{messages.formTitle}</CardTitle>
        <CardDescription>{messages.formText}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {completed ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary-50 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-glass">{status === 'saved' ? <CheckCircle2 className="size-7" aria-hidden="true" /> : <MessageCircle className="size-7" aria-hidden="true" />}</span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">{status === 'saved' ? messages.received : messages.whatsappContinue}</h3>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">{status === 'saved' ? messages.receivedText.replace('{reference}', reference) : messages.fallbackText}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {status === 'fallback' ? <Button asChild><a href={whatsappInquiryUrl(fallbackPayload)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />{messages.whatsappContinue}</a></Button> : null}
              <Button variant="outline" onClick={() => { setStatus('idle'); setReference(''); setError(''); }}>{messages.formTitle}</Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <input value={form.website} onChange={(event) => update('website', event.target.value)} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">{messages.name}<Input required autoComplete="name" maxLength={100} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder={messages.namePlaceholder} /></label><label className="grid gap-2 text-sm font-semibold text-foreground">{messages.phone}<Input required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+971 50 000 0000" /></label></div>
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">{messages.email} <span className="font-normal text-muted-foreground">({messages.optional})</span><Input type="email" autoComplete="email" maxLength={160} value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" /></label><AppDatePicker label={messages.preferredDate} value={form.preferredDate} placeholder={messages.datePlaceholder} onChange={(value) => update('preferredDate', value)} /></div>
            <label className="grid gap-2 text-sm font-semibold text-foreground">{messages.inquiry}<select value={form.inquiryType} onChange={(event) => update('inquiryType', event.target.value)} className="h-11 rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25">{['Jet Ski Rental', 'Jet Car Rental', 'Membership', 'Sales Inquiry', 'General Question'].map((value, index) => <option key={value} value={value}>{messages.inquiryTypes[index] || value}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">{messages.message}<Textarea required maxLength={2000} value={form.message} onChange={(event) => update('message', event.target.value)} placeholder={messages.messagePlaceholder} /></label>
            {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full sm:w-fit"><Send data-icon aria-hidden="true" />{status === 'sending' ? messages.sending : messages.send}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
