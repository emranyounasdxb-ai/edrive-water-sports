'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { whatsappUrl } from '@/lib/company-info';
import { cleanMultiline, cleanSingleLine, isValidOptionalEmail, isValidPhone } from '@/lib/public-request-validation';
import { supabase } from '@/lib/supabase-client';

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

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'saved' | 'fallback'>('idle');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function whatsappInquiryUrl(payload: FormState) {
    const text = encodeURIComponent(`Hello eDrive, I would like to send an inquiry.\n\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email || 'Not provided'}\nInquiry: ${payload.inquiryType}\nPreferred date: ${payload.preferredDate || 'Not selected'}\n\nMessage: ${payload.message}`);
    return `${whatsappUrl}?text=${text}`;
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

    if (payload.name.length < 2) return setError('Please enter your full name.');
    if (!isValidPhone(payload.phone)) return setError('Please enter a valid phone or WhatsApp number.');
    if (!isValidOptionalEmail(payload.email)) return setError('Please enter a valid email address.');
    if (payload.message.length < 10) return setError('Please add a little more detail to your message.');

    setStatus('sending');
    const result = await supabase.rpc('submit_public_inquiry', { p_payload: payload });
    const row = Array.isArray(result.data) ? result.data[0] as { reference?: string } | undefined : undefined;

    if (!result.error && row?.reference) {
      setReference(row.reference);
      setStatus('saved');
      setForm(initialForm);
      return;
    }

    const message = result.error?.message || 'Your inquiry could not be submitted.';
    if (rpcUnavailable(message)) {
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
        <CardTitle>Send an inquiry</CardTitle>
        <CardDescription>Tell us what you are planning and how you would like us to contact you.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {completed ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary-50 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-glass">{status === 'saved' ? <CheckCircle2 className="size-7" aria-hidden="true" /> : <MessageCircle className="size-7" aria-hidden="true" />}</span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">{status === 'saved' ? 'Inquiry received' : 'Continue on WhatsApp'}</h3>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">{status === 'saved' ? `Thank you. Your inquiry reference is ${reference}. Our team will contact you shortly.` : 'The secure inquiry service is being updated, so your message has been prepared in WhatsApp to make sure it is not lost.'}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {status === 'fallback' ? <Button asChild><a href={whatsappInquiryUrl(form)} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden="true" />Open WhatsApp</a></Button> : null}
              <Button variant="outline" onClick={() => { setStatus('idle'); setReference(''); setError(''); }}>Write another message</Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <input value={form.website} onChange={(event) => update('website', event.target.value)} type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">Name<Input required autoComplete="name" maxLength={100} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your name" /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Phone / WhatsApp<Input required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+971 50 000 0000" /></label></div>
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">Email <span className="font-normal text-muted-foreground">(optional)</span><Input type="email" autoComplete="email" maxLength={160} value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Preferred date <span className="font-normal text-muted-foreground">(optional)</span><Input type="date" value={form.preferredDate} onChange={(event) => update('preferredDate', event.target.value)} /></label></div>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Inquiry type<select value={form.inquiryType} onChange={(event) => update('inquiryType', event.target.value)} className="h-11 rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25"><option>Jet Ski Rental</option><option>Jet Car Rental</option><option>Membership</option><option>Sales Inquiry</option><option>General Question</option></select></label>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Message<Textarea required maxLength={2000} value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Tell us the package, date, guests, or question you have for the eDrive team." /></label>
            {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            <Button type="submit" size="lg" disabled={status === 'sending'} className="w-full sm:w-fit"><Send data-icon aria-hidden="true" />{status === 'sending' ? 'Sending Inquiry...' : 'Send Inquiry'}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
