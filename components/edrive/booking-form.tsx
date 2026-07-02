'use client';

import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { vehicles } from '@/lib/mock-data';

const fieldClass = 'rounded-md border border-input bg-white/[0.055] px-3 py-2 text-sm text-pearl outline-none transition focus:ring-2 focus:ring-ring';

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Card className="glass-panel-strong">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-primary/[0.12] text-ocean-glow">
            <CalendarCheck data-icon aria-hidden="true" />
          </span>
          <div>
            <CardTitle>Reserve Your Water Experience</CardTitle>
            <CardDescription>Static frontend booking request. No API is called.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/[0.30] bg-primary/10 p-8 text-center">
            <CheckCircle2 data-icon aria-hidden="true" className="text-ocean-glow" />
            <h3 className="font-heading text-2xl font-bold text-pearl">Request staged</h3>
            <p className="max-w-md text-sm leading-6 text-pearl-muted">
              This is a frontend-only confirmation state. The booking data stays in the browser mock flow.
            </p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>Create Another Request</Button>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Full name
                <Input required placeholder="Your name" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Phone or WhatsApp
                <Input required placeholder="+971 50 000 0000" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Experience
                <select className={fieldClass} defaultValue="Jet Ski Rental">
                  <option>Jet Ski Rental</option>
                  <option>Jet Car Rental</option>
                  <option>Fleet Sales Inquiry</option>
                  <option>Private Group Experience</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Preferred vehicle
                <select className={fieldClass} defaultValue={vehicles[0].name}>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id}>{vehicle.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Date
                <Input required type="date" defaultValue="2026-07-04" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Time
                <Input required type="time" defaultValue="18:30" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-pearl">
                Guests
                <Input required type="number" min="1" max="6" defaultValue="2" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-pearl">
              Notes
              <Textarea placeholder="Preferred dock, celebration details, or add-ons" />
            </label>
            <Button type="submit" variant="gold" size="lg" className="w-full sm:w-fit">
              <Send data-icon aria-hidden="true" />
              Stage Booking Request
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
