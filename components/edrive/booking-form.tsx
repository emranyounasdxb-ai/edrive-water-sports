'use client';

import { useState } from 'react';
import { CalendarCheck, CheckCircle2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { vehicles } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const rentalVehicles = vehicles.filter((vehicle) => vehicle.status !== 'For Sale').slice(0, 4);
const fieldClass = 'h-11 rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25';

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(rentalVehicles[0].id);

  return (
    <Card className="shadow-premium">
      <CardHeader className="border-b border-border">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary">
            <CalendarCheck data-icon aria-hidden="true" />
          </span>
          <div><CardTitle>Request a booking</CardTitle><CardDescription className="mt-1">Share your preferred ride and schedule. Our team will confirm availability directly.</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary-50 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-glass"><CheckCircle2 className="size-7" aria-hidden="true" /></span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">Your request is ready</h3>
            <p className="max-w-md text-sm leading-7 text-muted-foreground">Thank you. This preview shows the confirmation experience guests will see after sending their booking details.</p>
            <div className="flex flex-col gap-3 sm:flex-row"><Button variant="outline" onClick={() => setSubmitted(false)}>Start another request</Button><Button asChild><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Continue on WhatsApp</a></Button></div>
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Choose your vehicle</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {rentalVehicles.map((vehicle) => (
                  <label key={vehicle.id} className={cn('cursor-pointer rounded-md border bg-white p-4 transition', selectedVehicle === vehicle.id ? 'border-primary bg-primary-50 shadow-sm' : 'border-border hover:border-primary/30')}>
                    <input type="radio" name="vehicle" value={vehicle.id} checked={selectedVehicle === vehicle.id} onChange={() => setSelectedVehicle(vehicle.id)} className="sr-only" />
                    <span className="flex items-start justify-between gap-3"><span><span className="block text-sm font-semibold text-foreground">{vehicle.name}</span><span className="mt-1 block text-xs text-muted-foreground">{vehicle.category} - up to {vehicle.seats} guests</span></span><span className="text-sm font-semibold text-primary">AED {vehicle.hourlyRate}/hr</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-foreground">Full name<Input required placeholder="Your name" /></label>
              <label className="grid gap-2 text-sm font-semibold text-foreground">Phone or WhatsApp<Input required placeholder={companyInfo.whatsappDisplay} /></label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-foreground">Date<Input required type="date" defaultValue="2026-07-04" /></label>
              <label className="grid gap-2 text-sm font-semibold text-foreground">Time<Input required type="time" defaultValue="10:00" /></label>
              <label className="grid gap-2 text-sm font-semibold text-foreground">Duration<select className={fieldClass} defaultValue="1 Hour"><option>30 Minutes</option><option>1 Hour</option><option>90 Minutes</option><option>2 Hours</option></select></label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-foreground">Number of guests<Input required type="number" min="1" max="6" defaultValue="2" /></label>
              <label className="grid gap-2 text-sm font-semibold text-foreground">Preferred location<select className={fieldClass} defaultValue={companyInfo.locationName}><option>{companyInfo.locationName}</option><option>JBR</option><option>Bluewaters</option></select></label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-foreground">Notes<Textarea placeholder="Celebration details, rider experience, or anything else we should know" /></label>
            <label className="flex items-start gap-3 rounded-md border border-border bg-[#F7FBFC] p-4 text-sm text-muted-foreground"><input type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[#0E7C86]" /><span><span className="block font-semibold text-foreground">Send updates by WhatsApp</span><span className="mt-1 block text-xs leading-5">Receive availability and meeting-point details on the number above.</span></span></label>
            <Button type="submit" size="lg" className="w-full sm:w-fit"><Send data-icon aria-hidden="true" />Review booking request</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
