'use client';

import { useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <Card className="shadow-premium">
      <CardHeader className="border-b border-border"><CardTitle>Send an inquiry</CardTitle><CardDescription>Tell us what you are planning and how you would like us to contact you.</CardDescription></CardHeader>
      <CardContent className="pt-6">
        {sent ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary-50 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-glass"><CheckCircle2 className="size-7" aria-hidden="true" /></span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">Inquiry prepared</h3>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">This preview confirms the message details and success state without sending data to a server.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Write another message</Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">Name<Input required placeholder="Your name" /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Phone<Input required placeholder="+971 50 000 0000" /></label></div>
            <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-foreground">Email<Input required type="email" placeholder="you@example.com" /></label><label className="grid gap-2 text-sm font-semibold text-foreground">Inquiry type<select className="h-11 rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25"><option>Rental booking</option><option>Group or event</option><option>Watercraft sales</option><option>Partnership</option></select></label></div>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Message<Textarea required placeholder="Tell us the date, group size, or watercraft you are interested in." /></label>
            <Button type="submit" size="lg" className="w-full sm:w-fit"><Send data-icon aria-hidden="true" />Review inquiry</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
