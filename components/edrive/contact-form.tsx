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
    <Card className="glass-panel-strong">
      <CardHeader>
        <CardTitle>Send a Concierge Note</CardTitle>
        <CardDescription>Frontend-only message composer for the static UI phase.</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/[0.30] bg-primary/10 p-8 text-center">
            <CheckCircle2 data-icon aria-hidden="true" className="text-ocean-glow" />
            <h3 className="font-heading text-2xl font-bold text-pearl">Message staged</h3>
            <p className="text-sm leading-6 text-pearl-muted">No backend submission was made. This confirms the frontend state only.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Compose Another</Button>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Name
                <Input required placeholder="Your name" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Email
                <Input required type="email" placeholder="you@example.com" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-pearl">
              Subject
              <Input required placeholder="Booking, sales, partnership, or event" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-pearl">
              Message
              <Textarea required placeholder="Tell us what kind of water experience you want to plan." />
            </label>
            <Button type="submit" variant="gold" size="lg" className="w-full sm:w-fit">
              <Send data-icon aria-hidden="true" />
              Stage Message
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
